import { db } from '../config/firebase.ts'
import type { Criterion } from '../types.ts'
import { Timestamp } from 'firebase-admin/firestore'

const collection = db.collection('criterions')

export const createCriterion = async (data: Omit<Criterion, 'id' | 'createdAt' | 'updatedAt'>): Promise<Criterion> => {
    const docRef = collection.doc()

    const criterion: Criterion = {
        id: docRef.id,
        description: data.description,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...(data.points ? { points: data.points } : {}) // Conditionally include points if provided
    }

    await docRef.set(criterion)
    return criterion
}

export const getCriterion = async (id: string): Promise<Criterion | null> => {
    const doc = await collection.doc(id).get()
    return doc.data() ? ( doc.data() as Criterion ) : null
}

export const updateCriterion = async (id: string, updates: Partial<Criterion>): Promise<void> => {
    const docRef = await collection.doc(id)
    await docRef.update(updates)
    await docRef.update({ updatedAt: Timestamp.now()})
}

export const deleteCriterion = async (id: string): Promise<void> => {
    await collection.doc(id).delete()
}

// Helper function to format criteria for AI prompts
export const formatCriteria = (criteria: Criterion[]): string => {
    return criteria.map(c => {
        const pointsText = c.points ? ` (${c.points} points)` : ''
        return `-${c.description}${pointsText}`
    }).join('\n')
}
