import { Router } from 'express'
import { Timestamp } from 'firebase-admin/firestore'
import { createPost, getPost, getPosts, getPostsbyGroup, updatePost, deletePost } from '../../db/posts.ts'
import { generateAnswer } from '../services/answer.ts'
import { cosineSimilarity } from '../services/embedding.ts'
import type { Post } from '../../types.ts'
import * as admin from 'firebase-admin'

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

router.get('/', async (req, res) => {
    try {
        const posts = await getPosts()
        res.json(posts)
    } catch (error) {
        console.error(error)
        res.status(500).json('Could not retrieve posts.')
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

export const getRelatedPosts = async (req: { params: { postId: string } }, res: { json: (arg0: { relatedPosts: any[] }) => void }) => {
    const { postId } = req.params

    const db = admin.firestore()

    const currentDoc = await db.collection('posts').doc(postId).get()
    const currentData = currentDoc.data() as Post | undefined

    if (!currentData || !currentData?.embedding) {
        return res.json({ relatedPosts: [] })
    }

    const snapshot = await db.collection('posts').where('groupId', '==', currentData.groupId).limit(50).get()

    const relatedPosts = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }) as Post)
        .filter(post => post.id !== postId)
        .map(post => ({
            ...post,
            similarity: cosineSimilarity(currentData.embedding, post.embedding)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5)

    res.json({ relatedPosts })
}

export default router