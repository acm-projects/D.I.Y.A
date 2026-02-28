import { db } from '../config/firebase.js'
import type { Rubric } from '../types.js'
import { Timestamp } from 'firebase-admin/firestore'

const collection = db.collection('rubrics')

export const createRubric = async (data: Omit<Rubric, 'id'>): Promise<Rubric> => {
    const docRef = collection.doc()

    // Ensure that at least criteria or an image is provided for the rubric
    if (!data.criteria && !data.imageUrl) {
        throw new Error('A rubric must have at least criteria or an image')
    }

    const rubric: Rubric = {
        id: docRef.id,
        title: data.title,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...(data.criteria ? { criteria: data.criteria } : {}), // Conditionally include criteria if provided
        ...(data.imageUrl ? { imageUrl: data.imageUrl } : {}) // Conditionally include imageUrl if provided
    }

    await docRef.set(rubric)
    return rubric
}

export const getRubric = async (id: string): Promise<Rubric | null> => {
    const doc = await collection.doc(id).get()
    return doc.data() ? (doc.data() as Rubric) : null
}

export const updateRubric = async (id: string, updates: Partial<Rubric>): Promise<void> => {
    const docRef = collection.doc(id)
    await docRef.update(updates)
    await docRef.update({ updatedAt: Timestamp.now() })
}

export const deleteRubric = async (id: string): Promise<void> => {
    await collection.doc(id).delete()
}