import { Router } from 'express'
import {
    createOfficeHourRequest,
    getOfficeHourRequests,
    getOfficeHourRequestsByStudent,
    listOfficeHourContacts,
    updateOfficeHourRequest,
} from '../../db/officeHours.ts'

const router = Router()

router.get('/', async (req, res) => {
    try {
        const professorId = typeof req.query.professorId === 'string' ? req.query.professorId : null
        const status = typeof req.query.status === 'string' ? req.query.status as 'pending' | 'confirmed' | 'declined' : null
        const requests = await getOfficeHourRequests({ professorId, status })
        res.json(requests)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not retrieve office hour requests.' })
    }
})

router.get('/contacts', async (_req, res) => {
    try {
        const contacts = await listOfficeHourContacts()
        res.json(contacts)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not retrieve office hour contacts.' })
    }
})

router.get('/student/:studentId', async (req, res) => {
    try {
        const studentId = req.params.studentId

        if (!studentId) {
            return res.status(400).json({ error: 'Student ID is required.' })
        }

        const requests = await getOfficeHourRequestsByStudent(studentId)
        res.json(requests)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not retrieve office hour requests.' })
    }
})

router.post('/', async (req, res) => {
    try {
        const {
            studentId,
            studentName,
            studentEmail,
            groupId,
            groupName,
            professorId,
            professorName,
            department,
            reason,
            date,
            startTime,
            endTime,
            meetingType,
            meetingLink,
        } = req.body

        if (!studentId || !groupId || !groupName || !professorId || !professorName || !department || !reason || !date || !startTime || !endTime || !meetingType) {
            return res.status(400).json({ error: 'Missing required office hour request fields.' })
        }

        const request = await createOfficeHourRequest({
            studentId,
            studentName,
            studentEmail,
            groupId,
            groupName,
            professorId,
            professorName,
            department,
            reason,
            date,
            startTime,
            endTime,
            meetingType,
            meetingLink,
        })

        res.status(201).json(request)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not create office hour request.' })
    }
})

router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id

        if (!id) {
            return res.status(400).json({ error: 'Office hour request id is required.' })
        }

        const {
            status,
            date,
            startTime,
            endTime,
            meetingLink,
        } = req.body

        await updateOfficeHourRequest(id, {
            ...(status ? { status } : {}),
            ...(date ? { date } : {}),
            ...(startTime ? { startTime } : {}),
            ...(endTime ? { endTime } : {}),
            ...(meetingLink ? { meetingLink } : {}),
        })

        res.json({ success: true, message: 'Office hour request updated successfully.' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not update office hour request.' })
    }
})

export default router
