import { Router } from 'express'
import { createReply, getRepliesByPost } from '../../db/replies.ts'
import { getPost } from '../../db/posts.ts'
import { generateAnswer } from '../services/answer.ts'

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

        // If a student posts a reply, generate an AI follow-up answer
        if (role === 'student' && authorId !== 'diya-ai') {
            const replyPostId = postId
            const replyText = text
            const replyImageUrl = imageUrl
            setImmediate(() => {
                getPost(replyPostId)
                    .then((post) => {
                        const groupId = post?.groupId ?? ''
                        return generateAnswer(groupId, replyText, replyImageUrl ? [replyImageUrl] : undefined)
                    })
                    .then(async ({ answer: aiAnswer }) => {
                        if (aiAnswer) {
                            await createReply({
                                postId: replyPostId,
                                authorId: 'diya-ai',
                                authorName: 'D.I.Y.A AI',
                                role: 'professor',
                                text: aiAnswer,
                            })
                            console.log(`[AI] Follow-up answer generated for reply in post ${replyPostId}`)
                        }
                    })
                    .catch((aiError) => {
                        console.error(`[AI] Failed to generate follow-up for post ${replyPostId}:`, aiError)
                    })
            })
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not create reply.' })
    }
})

export default router
