import { db } from '../config/firebase.js'
import type { OfficeHour } from '../types.js'
import { Timestamp } from 'firebase-admin/firestore'

const collection = db.collection('officeHours')

export const createOfficeHour = async (data: Omit<OfficeHour, 'id'>): Promise<OfficeHour> => {
    const docRef = collection.doc()

    const officeHour: OfficeHour = {
        id: docRef.id,
        studentId: data.studentId,
        professorId: data.professorId,
        groupId: data.groupId,
        scheduledTime: data.scheduledTime,
        location: data.location,
        topic: data.topic,
        status: 'pending', // Default status when creating a new office hour
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    }

    await docRef.set(officeHour)
    return officeHour
}

export const getOfficeHour = async (id: string): Promise<OfficeHour | null> => {
    const doc = await collection.doc(id).get()
    return doc.data() ? (doc.data() as OfficeHour) : null
}

export const updateOfficeHourStatus = async (id: string, updates: Partial<OfficeHour>): Promise<void> => {
    const docRef = collection.doc(id)
    await docRef.update(updates)
    await docRef.update({ updatedAt: Timestamp.now() })
}

export const deleteOfficeHour = async (id: string): Promise<void> => {
    await collection.doc(id).delete()
}