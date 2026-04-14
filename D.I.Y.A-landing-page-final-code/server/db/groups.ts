import { db } from '../config/firebase.js'
import type { Group } from '../types.js'
import { Timestamp } from 'firebase-admin/firestore'

const collection = db.collection('groups')

export const createGroup = async (data: Omit<Group, 'id'>): Promise<Group> => {
    const docRef = collection.doc()

    const group: Group = {
        id: docRef.id,
        title: data.title,
        description: data.description,
        professor: data.professor,
        members: data.members,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...(data.avatarUrl ? { avatarUrl: data.avatarUrl } : {}) // Conditionally include avatarUrl if provided
    }

    await docRef.set(group)
    return group
}

export const getGroup = async (id: string): Promise<Group | null> => {
    const doc = await collection.doc(id).get()  // Get group document by id
    return doc.data() ? (doc.data() as Group) : null
}

export const updateGroup = async (id: string, updates: Partial<Group>): Promise<void> => {
    const docRef = collection.doc(id)
    await docRef.update(updates)
    await docRef.update({ updatedAt: Timestamp.now() })
}

export const deleteGroup = async (id: string): Promise<void> => {
    await collection.doc(id).delete()
}
