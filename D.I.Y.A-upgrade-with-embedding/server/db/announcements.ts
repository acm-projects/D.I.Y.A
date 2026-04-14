import { Timestamp } from 'firebase-admin/firestore'
import { db } from '../config/firebase.ts'
import type { Announcement } from '../types.ts'

const collection = db.collection('announcements')

export const createAnnouncement = async (
    data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Announcement> => {
    const docRef = collection.doc()
    const now = Timestamp.now()

    const announcement: Announcement = {
        id: docRef.id,
        authorId: data.authorId,
        authorName: data.authorName,
        title: data.title,
        message: data.message,
        ...(data.groupId ? { groupId: data.groupId } : {}),
        createdAt: now,
        updatedAt: now,
    }

    await docRef.set(announcement)
    return announcement
}

export const getAnnouncements = async ({
    groupId,
}: {
    groupId?: string | null
} = {}): Promise<Announcement[]> => {
    let query: FirebaseFirestore.Query = collection

    if (groupId) {
        query = query.where('groupId', '==', groupId)
    }

    const snapshot = await query.get()
    const announcements: Announcement[] = []

    snapshot.forEach((doc) => {
        announcements.push(doc.data() as Announcement)
    })

    announcements.sort((a, b) => {
        const aSeconds = a.createdAt?.seconds ?? 0
        const bSeconds = b.createdAt?.seconds ?? 0
        return bSeconds - aSeconds
    })

    return announcements
}
