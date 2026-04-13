import { db } from '../config/firebase.ts'
import type { Post } from '../types.ts'
import { cosineSimilarity } from '../api/services/embedding.ts'
import { Timestamp } from 'firebase-admin/firestore'
import * as admin from 'firebase-admin'

const collection = db.collection('posts')

export const createPost = async (data: Omit<Post, 'id'>): Promise<Post> => {
    const docRef = collection.doc()
    
    const post: Post = {
        id: docRef.id,
        title: data.title,
        upvotes: data.upvotes || 0,
        authorId: data.authorId,
        groupId: data.groupId,
        content: data.content,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...(data.imageUrl ? { imageUrl: data.imageUrl } : {}), // Conditionally include imageUrl if provided
        ...(data.aiAnswer ? { aiAnswer: data.aiAnswer } : {}), // Conditionally include aiAanswer if provided
        ...(data.isVerified !== undefined ? { isVerified: data.isVerified } : {}) // Conditionally include isVerified if provided
    }

    await docRef.set(post)
    return post
}

export const getPosts = async (): Promise<Post[]> => {
    const snapshot = await collection.get()
    const posts: Post[] = []
    snapshot.forEach((doc) => {
        posts.push(doc.data() as Post)
    })
    return posts
}

export const getPost = async (id: string): Promise<Post | null> => {
    const doc = await collection.doc(id).get()
    return doc.data() ? (doc.data() as Post) : null
}

export const getPostsbyGroup = async (groupId: string): Promise<Post[]> => {
    const snapshot = await collection.where('groupId', '==', groupId).get()
    const posts: Post[] = [];
    snapshot.forEach((doc) => {
        posts.push(doc.data() as Post)
    });
    return posts
}

export const updatePost = async (id: string, updates: Partial<Post>): Promise<void> => {
    const docRef = collection.doc(id)
    await docRef.update(updates)
    await docRef.update({ updatedAt: Timestamp.now() })
}

export const deletePost = async (id: string): Promise<void> => {
    await collection.doc(id).delete()
}

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