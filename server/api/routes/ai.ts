import express from 'express'
import { generateAnswer } from '../services/answer.js'
import { generateGrade } from '../services/grade.js'

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
        const { answer, criteria } = req.body

        if (!answer || !criteria) {
            return res.status(400).json({ error: 'Student answer and grading criteria are required.' })
        }

        const grade = await generateGrade(answer, criteria)

        res.json({ success: true, grade })
    }

    catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not generate grade.' })
    }
});

export default router