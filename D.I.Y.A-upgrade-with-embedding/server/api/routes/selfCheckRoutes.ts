import { Router } from 'express'
import {
    createSelfCheck,
    getSelfChecksByStudent,
} from '../../db/selfChecks.ts'
import { analyzeSelfCheckSubmission } from '../services/selfCheck.ts'

const router = Router()

const toLetterGrade = (score: number): string => {
    if (score >= 97) return 'A+'
    if (score >= 93) return 'A'
    if (score >= 90) return 'A-'
    if (score >= 87) return 'B+'
    if (score >= 83) return 'B'
    if (score >= 80) return 'B-'
    if (score >= 77) return 'C+'
    if (score >= 73) return 'C'
    if (score >= 70) return 'C-'
    if (score >= 67) return 'D+'
    if (score >= 63) return 'D'
    if (score >= 60) return 'D-'
    return 'F'
}

router.get('/student/:studentId', async (req, res) => {
    try {
        const studentId = req.params.studentId

        if (!studentId) {
            return res.status(400).json({ error: 'Student ID is required.' })
        }

        const selfChecks = await getSelfChecksByStudent(studentId)
        res.json(selfChecks)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not retrieve self-check history.' })
    }
})

router.post('/analyze', async (req, res) => {
    try {
        const { studentId, assignmentName, rubricName, workFile, rubricFile } = req.body

        if (!studentId || !assignmentName || !rubricName) {
            return res.status(400).json({ error: 'studentId, assignmentName, and rubricName are required.' })
        }

        if (!workFile || !rubricFile) {
            return res.status(400).json({ error: 'Rubric file and submission file are required.' })
        }

        const { score, improvements } = await analyzeSelfCheckSubmission({
            assignmentName,
            rubricName,
            workFile,
            rubricFile,
        })

        const selfCheck = await createSelfCheck({
            studentId,
            assignmentName,
            rubricName,
            potentialGrade: `${score}/100`,
            letterGrade: toLetterGrade(score),
            improvements,
        })

        res.status(201).json(selfCheck)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not analyze self-check submission.' })
    }
})

export default router
