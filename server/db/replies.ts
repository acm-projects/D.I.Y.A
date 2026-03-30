import { Timestamp } from 'firebase-admin/firestore'
import { db } from '../config/firebase.ts'

export interface ReplyRecord {
    id: string
    postId: string
    authorId: string
    authorName: string
    role: 'student' | 'professor'
    text: string
    imageUrl?: string
    createdAt: Timestamp
    updatedAt: Timestamp
}

const collection = db.collection('replies')

export const createReply = async (
    data: Omit<ReplyRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ReplyRecord> => {
    const docRef = collection.doc()

    const reply: ReplyRecord = {
        id: docRef.id,
        postId: data.postId,
        authorId: data.authorId,
        authorName: data.authorName,
        role: data.role,
        text: data.text,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...(data.imageUrl ? { imageUrl: data.imageUrl } : {}),
    }

    await docRef.set(reply)
    return reply
}

export const getRepliesByPost = async (postId: string): Promise<ReplyRecord[]> => {
    const snapshot = await collection.where('postId', '==', postId).get()
    const replies: ReplyRecord[] = []

    snapshot.forEach((doc) => {
        replies.push(doc.data() as ReplyRecord)
    })

    replies.sort((a, b) => {
        const aSeconds = a.createdAt?.seconds ?? 0
        const bSeconds = b.createdAt?.seconds ?? 0
        return aSeconds - bSeconds
    })

    return replies
}
