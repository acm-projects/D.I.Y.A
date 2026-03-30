import { Router } from 'express'
import { createReply, getRepliesByPost } from '../../db/replies.ts'

const router = Router()

router.get('/post/:postId', async (req, res) => {
    try {
        const replies = await getRepliesByPost(req.params.postId)
        res.json(replies)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not retrieve replies.' })
    }
})

router.post('/', async (req, res) => {
    try {
        const { postId, authorId, authorName, role, text, imageUrl } = req.body

        if (!postId || !authorId || !authorName || !role || !text) {
            return res.status(400).json({ error: 'postId, authorId, authorName, role, and text are required.' })
        }

        const reply = await createReply({
            postId,
            authorId,
            authorName,
            role,
            text,
            imageUrl,
        })

        res.status(201).json(reply)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not create reply.' })
    }
})

export default router
