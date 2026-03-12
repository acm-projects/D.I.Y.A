import { db } from '../config/firebase.ts'
import type { GradeAttempt } from '../types.ts'
import { Timestamp } from 'firebase-admin/firestore'

const collection = db.collection('gradeAttempts')

export const createGradeAttempt = async (data: Omit<GradeAttempt, 'id'>): Promise<GradeAttempt> => {
    const docRef = collection.doc()

    const gradeAttempt: GradeAttempt = {
        id: docRef.id,
        studentId: data.studentId,
        rubricID: data.rubricID,
        aiGrade: data.aiGrade,
        feedback: data.feedback,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...(data.assignmentId ? { assignmentId: data.assignmentId } : {}) // Conditionally include assignmentId if provided
    }

    await docRef.set(gradeAttempt)
    return gradeAttempt
}

export const getGradeAttempt = async (id: string): Promise<GradeAttempt | null> => {
    const doc = await collection.doc(id).get()
    return doc.data() ? (doc.data() as GradeAttempt) : null
}

export const updateGradeAttempt = async (id: string, updates: Partial<GradeAttempt>): Promise<void> => {
    const docRef = collection.doc(id)
    await docRef.update(updates)
    await docRef.update({ updatedAt: Timestamp.now() })
}

export const deleteGradeAttempt = async (id: string): Promise<void> => {
    await collection.doc(id).delete()
}