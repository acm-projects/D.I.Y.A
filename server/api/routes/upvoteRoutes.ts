import { Router } from 'express'
import { createUpvote, getUpvote, getUpvotesByPost, deleteUpvote } from '../../db/upvotes.ts'

const router = Router()

router.post('/', async (req, res) => {
    try {
        const upvote = await createUpvote(req.body)
        res.status(201).json(upvote)
    } catch (error) {
        console.error(error)
        res.status(500).json('Could not generate upvote.')
    }
})

router.get('/:id', async (req, res) => {
    try {
      const upvote = await getUpvote(req.params.id)
      if (upvote) {
        res.json(upvote)
      } else {
        res.status(404).json('Upvote not found.')
      }
    } catch (error) {
        console.error(error)
        res.status(500).json('Could not retrieve upvote.')
    }
})

router.get('/posts/:postId', async (req, res) => {
    try {
        const upvotes = await getUpvotesByPost(req.params.postId)
        res.json(upvotes)
    } catch (error){
        console.error(error)
        res.status(500).json('Could not retrieve upvotes.')
    }
})

router.delete('/:id', async (req, res) => {
    try {
        await deleteUpvote(req.params.id)
        res.json({success: true, message: 'Upvote deleted successfully.'})
    } catch (error) {
        console.error(error)
        res.status(500).json('Could not delete upvote.')
    }
})

export default router
