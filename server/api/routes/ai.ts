import express from 'express'
import type { GeminiImageInput } from '../gemini/main.ts'
import { generateAnswer } from '../services/answer.ts'
import { generateGrade } from '../services/grade.ts'
import { generateCourseAnalytics } from '../services/analytics.ts'
import { formatCriteria } from '../../db/criterions.ts'
import { getRubric } from '../../db/rubrics.ts'
import { createGradeAttempt } from '../../db/gradeAttempts.ts'
import type { AnalyticsRequesterContext } from '../services/analytics.ts'

const router = express.Router()

const readOptionalString = (value: unknown): string | null => {
    if (typeof value !== 'string') {
        return null
    }

    const trimmedValue = value.trim()
    return trimmedValue.length > 0 ? trimmedValue : null
}

const readImages = (value: unknown): GeminiImageInput[] | null => {
    if (value === undefined) {
        return []
    }

    const rawImages = Array.isArray(value) ? value : [value]
    const images: GeminiImageInput[] = []

    for (const rawImage of rawImages) {
        if (!rawImage || typeof rawImage !== 'object') {
            return null
        }

        const { data, mimeType } = rawImage as Record<string, unknown>

        if (typeof data !== 'string' || data.trim().length === 0) {
            return null
        }

        if (typeof mimeType !== 'string' || mimeType.trim().length === 0) {
            return null
        }

        images.push({
            data: data.trim(),
            mimeType: mimeType.trim(),
        })
    }

    return images
}

router.post('/answer', async (req: any, res: any) => {
    try {
        const { groupId, prompt } = req.body
        const images = readImages(req.body?.images ?? req.body?.image)

        console.log('Received answer request:', { groupId, prompt })

        if (!groupId || !prompt) {
            return res.status(400).json({ error: 'Group ID and question prompt are required.' })
        }

        if (images === null) {
            return res.status(400).json({ error: 'Images must be sent as objects with string data and mimeType fields.' })
        }

        console.log('Generating answer for groupId:', groupId)

        const answer = await generateAnswer(groupId, prompt, images)

        res.json({ success: true, answer })

        console.log('Full response: ', answer)
    }

    catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not generate answer.' })
    }
});

router.post('/grade', async (req: any, res: any) => {
    try {
        const { answer, rubricId, studentId, assignmentId } = req.body
        const images = readImages(req.body?.images ?? req.body?.image)
        const parsedStudentId = readOptionalString(studentId)
        const parsedAssignmentId = readOptionalString(assignmentId)

        if (!answer || !rubricId || !parsedStudentId) {
            return res.status(400).json({ error: 'Student answer, grading rubric, and studentId are required.' })
        }

        if (images === null) {
            return res.status(400).json({ error: 'Images must be sent as objects with string data and mimeType fields.' })
        }

        const rubric = await getRubric(rubricId)
        if (!rubric) {
            return res.status(404).json({ error: 'Rubric not found.' })
        }

        const criteria = formatCriteria(rubric?.criteria || [])
        if (!criteria) {
            return res.status(400).json({ error: 'Grading rubric must have criteria.' })
        }

        const grade = await generateGrade(answer, criteria, images)

        const aiGrade = typeof grade === 'object' && 'score' in grade ? grade.score : 0
        const aiFeedback = typeof grade === 'object' && 'feedback' in grade ? grade.feedback : ''

        const attempt = await createGradeAttempt({
            studentId: parsedStudentId,
            rubricID: rubricId,
            aiGrade: aiGrade,
            feedback: aiFeedback,
            ...(parsedAssignmentId ? { assignmentId: parsedAssignmentId } : {}),
        })

        res.json({ success: true, grade, attempt })
    }

    catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not generate grade.' })
    }
});

router.post('/analytics', async (req, res) => {
        try {
            const { groupId, requester } = req.body

            console.log('Received analytics request:', { groupId })

            if (!groupId || !requester) {
                return res.status(400).json({ error: 'Group ID and requester are required.' })
            }

            const requesterObject: AnalyticsRequesterContext = {
                userId: requester.userId,
                role: requester.role
            }

            const analytics = await generateCourseAnalytics(groupId, requesterObject)

            res.json({ success: true, analytics })
        }
        
        catch (error) {
            console.error(error)
            res.status(500).json({ error: 'Could not generate analytics.' })
        }
})

export default router