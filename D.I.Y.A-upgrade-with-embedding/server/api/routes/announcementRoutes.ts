import { Router } from 'express'
import { createAnnouncement, getAnnouncements } from '../../db/announcements.ts'

const router = Router()

router.get('/', async (req, res) => {
    try {
        const groupId = typeof req.query.groupId === 'string' ? req.query.groupId : null
        const announcements = await getAnnouncements({ groupId })
        res.json(announcements)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not retrieve announcements.' })
    }
})

router.post('/', async (req, res) => {
    try {
        const {
            authorId,
            authorName,
            title,
            message,
            groupId,
        } = req.body

        if (!authorId || !authorName || !title || !message) {
            return res.status(400).json({ error: 'authorId, authorName, title, and message are required.' })
        }

        const announcement = await createAnnouncement({
            authorId,
            authorName,
            title,
            message,
            ...(groupId ? { groupId } : {}),
        })

        res.status(201).json(announcement)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not create announcement.' })
    }
})

export default router
