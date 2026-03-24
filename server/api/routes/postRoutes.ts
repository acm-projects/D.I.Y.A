import { Router } from 'express'
import { Timestamp } from 'firebase-admin/firestore'
import { createPost, getPost, getPostsbyGroup, updatePost, deletePost } from '../../db/posts.ts'
import { generateAnswer } from '../services/answer.ts'

const router = Router()

router.post('/', async (req, res) => {
    try {
        const { title, content, groupId, authorId, imageUrl } = req.body
        const { answer: aiAnswer } = await generateAnswer(groupId, content)

        const post = await createPost({
            title,
            content,
            groupId,
            authorId,
            imageUrl,
            aiAnswer,
            isVerified: false,
            upvotes: [],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        })

        res.status(201).json(post)
    } catch (error){
        console.error(error)
        res.status(500).json('Could not generate post.')
    }
})

router.get('/:id', async (req, res) => {
    try {
      const post = await getPost(req.params.id)
      if (post) {
        res.json(post)
      } else {
        res.status(404).json('Post not found.')
      }
    } catch (error) {
        console.error(error)
        res.status(500).json('Could not retrieve post.')
    }
})

router.get('/groups/:groupId', async (req, res) => {
    try {
        const posts = await getPostsbyGroup(req.params.groupId)
        res.json(posts)
    } catch (error) {
        console.error(error)
        res.status(500).json('Could not retrieve posts.')
    }
})

router.put('/:id', async (req, res) => {
    try {
        await updatePost(req.params.id, req.body)
        res.json({success: true, message: 'Post updated successfully.'})
    } catch (error) {
        console.error(error)
        res.status(500).json('Could not update post.')
    }
})

router.delete('/:id', async (req, res) => {
    try {
        await deletePost(req.params.id)
        res.json({success: true, message: 'Post deleted successfully.'})
    } catch (error) {
        console.error(error)
        res.status(500).json('Could not delete post.')
    }
})

export default router