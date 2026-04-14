import pdfParse from 'pdf-parse'
import type { SelfCheckImprovement } from '../../db/selfChecks.ts'
import { SELF_CHECK_GRADING_PROMPT } from '../gemini/prompts.ts'
import { generateFromGemini } from '../gemini/main.ts'

export interface UploadedSelfCheckFile {
    name: string
    mimeType?: string
    base64Data: string
}

interface SelfCheckImprovementResponse {
    section?: string
    suggestion?: string
    title?: string
    description?: string
}

interface SelfCheckAnalysisResponse {
    score?: number
    improvements?: SelfCheckImprovementResponse[]
}

const TEXT_FILE_EXTENSIONS = new Set([
    'txt',
    'md',
    'rtf',
    'csv',
    'json',
    'xml',
    'html',
    'css',
    'js',
    'jsx',
    'ts',
    'tsx',
    'py',
    'java',
    'c',
    'cpp',
    'h',
    'hpp',
])

const normalizeLine = (value: string): string => value.replace(/\u0000/g, ' ').replace(/\s+/g, ' ').trim()

const unique = (values: string[]): string[] => Array.from(new Set(values))

const toWords = (value: string): string[] => {
    const matches = value.toLowerCase().match(/[a-z0-9]{4,}/g)
    return matches ?? []
}

const getFileExtension = (name: string): string => {
    const match = name.toLowerCase().match(/\.([a-z0-9]+)$/)
    return match?.[1] ?? ''
}

const stripCodeFences = (value: string): string => value.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()

const isLikelyPdfNoise = (line: string): boolean => {
    const trimmed = line.trim()
    return /^%PDF/i.test(trimmed)
        || /^\d+\s+\d+\s+obj$/i.test(trimmed)
        || /^endobj$/i.test(trimmed)
        || /^xref$/i.test(trimmed)
        || /^trailer$/i.test(trimmed)
        || /^startxref$/i.test(trimmed)
        || /^<<.*>>$/i.test(trimmed)
        || /^<</.test(trimmed)
        || /^\/?(Type|Title|Producer|Creator|Author|CreationDate|ModDate)\b/.test(trimmed)
}

const cleanExtractedText = (value: string): string => {
    const withoutNoise = value
        .split(/\r?\n/)
        .map((line) => normalizeLine(line))
        .filter((line) => line.length > 0 && !isLikelyPdfNoise(line))
        .join('\n')

    return withoutNoise.replace(/\n{3,}/g, '\n\n').trim()
}

const decodeBase64 = (value: string): Buffer => {
    const normalized = value.includes(',') ? value.slice(value.indexOf(',') + 1) : value
    return Buffer.from(normalized, 'base64')
}

const isPdfFile = (file: UploadedSelfCheckFile): boolean => {
    return file.mimeType === 'application/pdf' || getFileExtension(file.name) === 'pdf'
}

const isSupportedTextFile = (file: UploadedSelfCheckFile): boolean => {
    if (file.mimeType?.startsWith('text/')) {
        return true
    }

    return TEXT_FILE_EXTENSIONS.has(getFileExtension(file.name))
}

const extractTextFromFile = async (file: UploadedSelfCheckFile): Promise<string> => {
    const buffer = decodeBase64(file.base64Data)

    if (isPdfFile(file)) {
        const parsed = await pdfParse(buffer)
        return cleanExtractedText(parsed.text ?? '')
    }

    if (isSupportedTextFile(file)) {
        return cleanExtractedText(buffer.toString('utf8'))
    }

    throw new Error(`Unsupported file type for ${file.name}. Please upload a PDF or text-based document.`)
}

const truncateForPrompt = (value: string, maxLength: number): string => {
    if (value.length <= maxLength) {
        return value
    }

    return `${value.slice(0, maxLength)}\n\n[Content truncated for analysis]`
}

const extractSections = (rubricText: string, rubricName: string): string[] => {
    const lines = rubricText
        .split(/\r?\n/)
        .map((line) => normalizeLine(line))
        .filter((line) => line.length >= 4 && !isLikelyPdfNoise(line))

    if (lines.length > 0) {
        return unique(lines).slice(0, 4)
    }

    const cleanedName = rubricName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim()
    return [
        cleanedName || 'Rubric Alignment',
        'Specific supporting details',
        'Clarity and organization',
    ]
}

const buildFallbackImprovements = (sections: string[], workText: string): SelfCheckImprovement[] => {
    const loweredWork = workText.toLowerCase()

    return sections.map((section) => {
        const keywords = toWords(section)
        const matched = keywords.some((keyword) => loweredWork.includes(keyword))

        return {
            section,
            suggestion: matched
                ? `Strengthen ${section.toLowerCase()} with one more precise example or direct reference to the rubric.`
                : `Address ${section.toLowerCase()} more directly so the submission aligns with the rubric expectations.`,
        }
    }).slice(0, 4)
}

const calculateFallbackScore = (rubricText: string, workText: string): number => {
    const rubricWords = unique(toWords(rubricText))
    const workWords = new Set(toWords(workText))

    if (rubricWords.length === 0) {
        return Math.min(96, 70 + Math.floor(workText.length / 250))
    }

    const matches = rubricWords.filter((word) => workWords.has(word)).length
    const coverage = matches / rubricWords.length
    const lengthBoost = Math.min(8, Math.floor(workText.length / 350))
    const score = Math.round(64 + coverage * 28 + lengthBoost)

    return Math.max(60, Math.min(99, score))
}

const normalizeImprovement = (item: SelfCheckImprovementResponse, index: number): SelfCheckImprovement | null => {
    const section = normalizeLine(item.section ?? item.title ?? '') || `Improvement ${index + 1}`
    const suggestion = normalizeLine(item.suggestion ?? item.description ?? '')

    if (!suggestion) {
        return null
    }

    return {
        section,
        suggestion,
    }
}

const parseSelfCheckResponse = (rawResponse: string): SelfCheckAnalysisResponse | null => {
    try {
        return JSON.parse(stripCodeFences(rawResponse)) as SelfCheckAnalysisResponse
    } catch (error) {
        console.error('Failed to parse self-check Gemini response:', error)
        return null
    }
}

export const analyzeSelfCheckSubmission = async (params: {
    assignmentName: string
    rubricName: string
    rubricFile: UploadedSelfCheckFile
    workFile: UploadedSelfCheckFile
}): Promise<{ score: number, improvements: SelfCheckImprovement[] }> => {
    const rubricText = await extractTextFromFile(params.rubricFile)
    const workText = await extractTextFromFile(params.workFile)

    if (!rubricText) {
        throw new Error('Could not extract readable text from the rubric file.')
    }

    if (!workText) {
        throw new Error('Could not extract readable text from the submission file.')
    }

    const truncatedRubricText = truncateForPrompt(rubricText, 12000)
    const truncatedWorkText = truncateForPrompt(workText, 18000)

    const fullPrompt = `
assignment_name: ${params.assignmentName}
rubric_name: ${params.rubricName}

extracted_rubric:
${truncatedRubricText}

extracted_submission:
${truncatedWorkText}

Return ONLY valid JSON in this exact format:
{
  "score": number,
  "improvements": [
    {
      "section": "Name of Rubric Criterion",
      "suggestion": "Specific feedback referencing the student's text and explaining exactly what to improve"
    }
  ]
}
`

    const rawResponse = await generateFromGemini(fullPrompt, {
        systemPrompt: SELF_CHECK_GRADING_PROMPT,
        temperature: 0.0,
    })

    const parsedResponse = parseSelfCheckResponse(rawResponse)
    const normalizedImprovements = (parsedResponse?.improvements ?? [])
        .map(normalizeImprovement)
        .filter((item): item is SelfCheckImprovement => Boolean(item))
        .slice(0, 5)

    if (parsedResponse && typeof parsedResponse.score === 'number' && normalizedImprovements.length > 0) {
        return {
            score: Math.max(0, Math.min(100, Math.round(parsedResponse.score))),
            improvements: normalizedImprovements,
        }
    }

    const fallbackSections = extractSections(rubricText, params.rubricName)
    return {
        score: calculateFallbackScore(rubricText, workText),
        improvements: buildFallbackImprovements(fallbackSections, workText),
    }
}
