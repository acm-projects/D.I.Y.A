import express from 'express'
import { generateAnswer } from '../services/answer.ts'
import { generateGrade } from '../services/grade.ts'
import { generateCourseAnalytics } from '../services/analytics.ts'
import { formatCriteria } from '../../db/criterions.ts'
import { getRubric } from '../../db/rubrics.ts'
import { createGradeAttempt } from '../../db/gradeAttempts.ts'
import type { AnalyticsRequesterContext } from '../services/analytics.ts'

const router = express.Router()

router.post('/answer', async (req, res) => {
    try {
        const { groupId, prompt } = req.body

        console.log('Received answer request:', { groupId, prompt })

        if (!groupId || !prompt) {
            return res.status(400).json({ error: 'Group ID and question prompt are required.' })
        }

        console.log('Generating answer for groupId:', groupId)

        const answer = await generateAnswer(groupId, prompt)

        res.json({ success: true, answer })

        console.log('Full response: ', answer)
    }

    catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not generate answer.' })
    }
});

router.post('/grade', async (req, res) => {
    try {
        const { answer, rubricId, studentId, assignmentId } = req.body

        if (!answer || !rubricId) {
            return res.status(400).json({ error: 'Student answer and grading rubric are required.' })
        }

        const rubric = await getRubric(rubricId)
        if (!rubric) {
            return res.status(404).json({ error: 'Rubric not found.' })
        }

        const criteria = formatCriteria(rubric?.criteria || [])
        if (!criteria) {
            return res.status(400).json({ error: 'Grading rubric must have criteria.' })
        }

        const grade = await generateGrade(answer, criteria)

        const aiGrade = typeof grade === 'object' && 'score' in grade ? grade.score : 0
        const aiFeedback = typeof grade === 'object' && 'feedback' in grade ? grade.feedback : ''

        const attempt = await createGradeAttempt({
            studentId,
            rubricID: rubricId,
            aiGrade: aiGrade,
            feedback: aiFeedback,
            assignmentId: assignmentId
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