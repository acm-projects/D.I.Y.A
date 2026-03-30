import { db } from '../../config/firebase.ts'
import { getGroup } from '../../db/groups.ts'
import { getGeminiConfig } from '../gemini/config.ts'
import { generateFromGemini } from '../gemini/main.ts'
import type { Group, Post } from '../../types.ts'

const postsCollection = db.collection('posts')

const ALLOWED_ANALYTICS_ROLES = new Set(['admin', 'professor', 'ta'])
const DEFAULT_POST_LIMIT = 50

export interface AnalyticsRequesterContext {
    userId?: string
    role?: string | null
    tokenPayload?: Record<string, unknown>
}

export interface AnalyticsQuestionType {
    type: string
    countEstimate: number
    description: string
}

export interface AnalyticsKeywordTrend {
    keyword: string
    mentions: number
    context: string
}

export interface CourseAnalytics {
    groupId: string
    groupTitle: string
    generatedAt: string
    postsAnalyzed: number
    sourcePostIds: string[]
    mostCommonQuestionTypes: AnalyticsQuestionType[]
    keywordTrends: AnalyticsKeywordTrend[]
    topicsToRevisit: string[]
}

interface GeminiAnalyticsResponse {
    mostCommonQuestionTypes?: unknown
    keywordTrends?: unknown
    topicsToRevisit?: unknown
}

interface FirestoreDocumentLike {
    id: string
    data(): unknown
}

export class AnalyticsAuthorizationError extends Error {
    constructor(message = 'You are not authorized to generate analytics for this group.') {
        super(message)
        this.name = 'AnalyticsAuthorizationError'
    }
}

export class AnalyticsNotFoundError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'AnalyticsNotFoundError'
    }
}

export class AnalyticsGenerationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'AnalyticsGenerationError'
    }
}

const normalizeRole = (role?: string | null): string | null => {
    if (!role) {
        return null
    }

    return role.trim().toLowerCase()
}

const assertAnalyticsAccess = (requester?: AnalyticsRequesterContext): void => {
    const normalizedRole = normalizeRole(requester?.role)

    if (!normalizedRole || !ALLOWED_ANALYTICS_ROLES.has(normalizedRole)) {
        throw new AnalyticsAuthorizationError()
    }
}

const toPost = (rawPost: Partial<Post>, fallbackId: string): Post => {
    return {
        id: rawPost.id ?? fallbackId,
        title: rawPost.title ?? '',
        upvotes: Array.isArray(rawPost.upvotes) ? rawPost.upvotes : [],
        authorId: rawPost.authorId ?? '',
        groupId: rawPost.groupId ?? '',
        content: rawPost.content ?? '',
        createdAt: rawPost.createdAt as Post['createdAt'],
        updatedAt: rawPost.updatedAt as Post['updatedAt'],
        ...(rawPost.imageUrl ? { imageUrl: rawPost.imageUrl } : {}),
        ...(rawPost.aiAnswer ? { aiAnswer: rawPost.aiAnswer } : {}),
        ...(rawPost.isVerified !== undefined ? { isVerified: rawPost.isVerified } : {}),
    }
}

const buildAnalyticsPrompt = (group: Group, posts: Post[], systemPrompt: string): string => {
    const serializedPosts = posts.map((post, index) => {
        const title = post.title.trim() || 'Untitled Post'
        const content = post.content.trim() || 'No content provided'

        return [
            `Post ${index + 1}`,
            `Post ID: ${post.id}`,
            `Title: ${title}`,
            `Content: ${content}`,
        ].join('\n')
    }).join('\n\n')

    return [
        `System Prompt: ${systemPrompt}`,
        'You are analyzing course discussion posts for a university admin dashboard.',
        'Return only valid JSON.',
        'Do not wrap the JSON in markdown code fences.',
        `Group Title: ${group.title}`,
        `Group Description: ${group.description}`,
        '',
        'Required JSON schema:',
        '{',
        '  "mostCommonQuestionTypes": [',
        '    { "type": "string", "countEstimate": 0, "description": "string" }',
        '  ],',
        '  "keywordTrends": [',
        '    { "keyword": "string", "mentions": 0, "context": "string" }',
        '  ],',
        '  "topicsToRevisit": ["string"]',
        '}',
        '',
        'Rules:',
        '- Provide 3 to 5 question types.',
        '- Provide 5 to 10 keyword trends.',
        '- Provide 3 to 6 concise topics to revisit.',
        '- Infer student struggle areas from repeated confusion, incomplete reasoning, or recurring mistakes.',
        '- Keep descriptions and contexts concise.',
        '- Use integer values for countEstimate and mentions.',
        '',
        'Posts to analyze:',
        serializedPosts,
    ].join('\n')
}

const stripJsonCodeFence = (value: string): string => {
    const trimmed = value.trim()

    if (!trimmed.startsWith('```')) {
        return trimmed
    }

    return trimmed
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()
}

const parseQuestionTypes = (value: unknown): AnalyticsQuestionType[] => {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .map((item) => {
            if (!item || typeof item !== 'object') {
                return null
            }

            const record = item as Record<string, unknown>
            const type = typeof record.type === 'string' ? record.type.trim() : ''
            const description = typeof record.description === 'string' ? record.description.trim() : ''
            const rawCount = typeof record.countEstimate === 'number'
                ? record.countEstimate
                : typeof record.countEstimate === 'string'
                    ? Number(record.countEstimate)
                    : NaN

            if (!type) {
                return null
            }

            return {
                type,
                countEstimate: Number.isFinite(rawCount) ? Math.max(0, Math.round(rawCount)) : 0,
                description,
            }
        })
        .filter((item): item is AnalyticsQuestionType => item !== null)
}

const parseKeywordTrends = (value: unknown): AnalyticsKeywordTrend[] => {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .map((item) => {
            if (!item || typeof item !== 'object') {
                return null
            }

            const record = item as Record<string, unknown>
            const keyword = typeof record.keyword === 'string' ? record.keyword.trim() : ''
            const context = typeof record.context === 'string' ? record.context.trim() : ''
            const rawMentions = typeof record.mentions === 'number'
                ? record.mentions
                : typeof record.mentions === 'string'
                    ? Number(record.mentions)
                    : NaN

            if (!keyword) {
                return null
            }

            return {
                keyword,
                mentions: Number.isFinite(rawMentions) ? Math.max(0, Math.round(rawMentions)) : 0,
                context,
            }
        })
        .filter((item): item is AnalyticsKeywordTrend => item !== null)
}

const parseTopicsToRevisit = (value: unknown): string[] => {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .map((item) => typeof item === 'string' ? item.trim() : '')
        .filter((item) => item.length > 0)
}

const parseGeminiAnalytics = (rawResponse: string): Omit<CourseAnalytics, 'groupId' | 'groupTitle' | 'generatedAt' | 'postsAnalyzed' | 'sourcePostIds'> => {
    const cleanedResponse = stripJsonCodeFence(rawResponse)

    let parsedResponse: GeminiAnalyticsResponse

    try {
        parsedResponse = JSON.parse(cleanedResponse) as GeminiAnalyticsResponse
    }
    catch {
        throw new AnalyticsGenerationError('Gemini returned an invalid analytics payload.')
    }

    const mostCommonQuestionTypes = parseQuestionTypes(parsedResponse.mostCommonQuestionTypes)
    const keywordTrends = parseKeywordTrends(parsedResponse.keywordTrends)
    const topicsToRevisit = parseTopicsToRevisit(parsedResponse.topicsToRevisit)

    if (mostCommonQuestionTypes.length === 0 && keywordTrends.length === 0 && topicsToRevisit.length === 0) {
        throw new AnalyticsGenerationError('Gemini returned an empty analytics payload.')
    }

    return {
        mostCommonQuestionTypes,
        keywordTrends,
        topicsToRevisit,
    }
}

const mapGeminiError = (error: unknown): never => {
    if (error instanceof AnalyticsAuthorizationError || error instanceof AnalyticsNotFoundError || error instanceof AnalyticsGenerationError) {
        throw error
    }

    const message = error instanceof Error ? error.message : 'Unknown analytics generation error.'
    const normalizedMessage = message.toLowerCase()

    if (normalizedMessage.includes('429') || normalizedMessage.includes('rate limit') || normalizedMessage.includes('resource exhausted')) {
        throw new AnalyticsGenerationError('Gemini rate limit reached while generating analytics. Please try again shortly.')
    }

    throw new AnalyticsGenerationError(`Failed to generate analytics: ${message}`)
}

export const fetchRecentPostsForGroup = async (groupId: string, limit = DEFAULT_POST_LIMIT): Promise<Post[]> => {
    if (!groupId.trim()) {
        throw new AnalyticsNotFoundError('A groupId is required to generate analytics.')
    }

    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(Math.floor(limit), 200)) : DEFAULT_POST_LIMIT

    try {
        const snapshot = await postsCollection
            .where('groupId', '==', groupId)
            .orderBy('createdAt', 'desc')
            .limit(safeLimit)
            .get()

        return snapshot.docs.map((doc: FirestoreDocumentLike) => toPost(doc.data() as Partial<Post>, doc.id))
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown Firestore error.'
        throw new AnalyticsGenerationError(`Failed to fetch posts for analytics: ${message}`)
    }
}

export const generateCourseAnalytics = async (
    groupId: string,
    requester?: AnalyticsRequesterContext,
): Promise<CourseAnalytics> => {
    assertAnalyticsAccess(requester)

    const trimmedGroupId = groupId.trim()

    if (!trimmedGroupId) {
        throw new AnalyticsNotFoundError('A groupId is required to generate analytics.')
    }

    try {
        const group = await getGroup(trimmedGroupId)

        if (!group) {
            throw new AnalyticsNotFoundError(`Group ${trimmedGroupId} was not found.`)
        }

        const posts = await fetchRecentPostsForGroup(trimmedGroupId)

        if (posts.length === 0) {
            return {
                groupId: trimmedGroupId,
                groupTitle: group.title,
                generatedAt: new Date().toISOString(),
                postsAnalyzed: 0,
                sourcePostIds: [],
                mostCommonQuestionTypes: [],
                keywordTrends: [],
                topicsToRevisit: [],
            }
        }

        const aiConfig = await getGeminiConfig(trimmedGroupId)
        const prompt = buildAnalyticsPrompt(group, posts, aiConfig.sysPrompt)
        const rawResponse = await generateFromGemini(prompt, {
            temperature: aiConfig.temperature,
        })

        const parsedAnalytics = parseGeminiAnalytics(rawResponse)

        return {
            groupId: trimmedGroupId,
            groupTitle: group.title,
            generatedAt: new Date().toISOString(),
            postsAnalyzed: posts.length,
            sourcePostIds: posts.map((post) => post.id),
            ...parsedAnalytics,
        }
    }
    catch (error) {
        return mapGeminiError(error)
    }
}