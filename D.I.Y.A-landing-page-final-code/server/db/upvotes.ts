// No update function, only create and delete

import { db } from '../config/firebase.js'
import type { Upvote } from '../types.js'
import { Timestamp } from 'firebase-admin/firestore'

const collection = db.collection('upvotes')

export const createUpvote = async (data: Omit<Upvote, 'id'>): Promise<Upvote> => {
    const docRef = collection.doc()
    
    const upvote: Upvote = {
        id: docRef.id,
        postId: data.postId,
        userId: data.userId,
        upvotedAt: Timestamp.now()
    }

    await docRef.set(upvote)
    return upvote
}

export const getUpvote = async (id: string): Promise<Upvote | null> => {
    const doc = await collection.doc(id).get()
    return doc.data() ? (doc.data() as Upvote) : null
}

export const deleteUpvote = async (id: string): Promise<void> => {
    await collection.doc(id).delete()
}