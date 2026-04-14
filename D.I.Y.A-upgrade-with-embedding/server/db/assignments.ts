import { db } from '../config/firebase.ts'
import type { Assignment } from '../types.ts'
import { Timestamp } from 'firebase-admin/firestore'

const collection = db.collection('assignments')

export const createAssignment = async (data: Omit<Assignment, 'id'>): Promise<Assignment> => {
    const docRef = collection.doc()

    const assignment: Assignment = {
        id: docRef.id,
        title: data.title,
        description: data.description,
        groupId: data.groupId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...(data.rubricId ? { rubricId: data.rubricId } : {}), // Conditionally include rubricId if provided
        ...(data.imageUrl ? { imageUrl: data.imageUrl } : {}) // Conditionally include imageUrl if provided
    }

    await docRef.set(assignment)
    return assignment
}

export const getAssignment = async (id: string): Promise<Assignment | null> => {
    const doc = await collection.doc(id).get()
    return doc.data() ? (doc.data() as Assignment) : null
}

// Update an assignment by its id with the provided updates (partial Assignment object)
export const updateAssignment = async (id: string, updates: Partial<Assignment>): Promise<void> => {
    const docRef = collection.doc(id)
    await docRef.update(updates)
    await docRef.update({ updatedAt: Timestamp.now() })
}

export const deleteAssignment = async (id: string): Promise<void> => {
    await collection.doc(id).delete()
}
