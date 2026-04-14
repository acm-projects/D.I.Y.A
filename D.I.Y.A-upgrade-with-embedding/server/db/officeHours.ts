import { db } from '../config/firebase.ts'
import { Timestamp } from 'firebase-admin/firestore'
import { getGroups } from './groups.ts'

const collection = db.collection('officeHours')

export interface OfficeHourContact {
    id: string
    name: string
    email: string
    department: string
}

export interface OfficeHourRequestRecord {
    id: string
    studentId: string
    studentName?: string
    studentEmail?: string
    groupId: string
    groupName: string
    professorId: string
    professorName: string
    department: string
    reason: string
    date: string
    startTime: string
    endTime: string
    meetingType: 'online' | 'in-person'
    meetingLink?: string
    status: 'pending' | 'confirmed' | 'declined'
    createdAt: Timestamp
    updatedAt: Timestamp
}

const toEmail = (value: string): string => {
    const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.')
    const cleaned = normalized.replace(/^\.+|\.+$/g, '')
    return `${cleaned || 'instructor'}@university.edu`
}

export const listOfficeHourContacts = async (): Promise<OfficeHourContact[]> => {
    const groups = await getGroups()

    return groups.map((group) => ({
        id: group.id,
        name: group.professor || 'Professor',
        email: toEmail(group.professor || 'professor'),
        department: group.title,
    }))
}

export const createOfficeHourRequest = async (
    data: Omit<OfficeHourRequestRecord, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<OfficeHourRequestRecord> => {
    const docRef = collection.doc()

    const officeHourRequest: OfficeHourRequestRecord = {
        id: docRef.id,
        studentId: data.studentId,
        ...(data.studentName ? { studentName: data.studentName } : {}),
        groupId: data.groupId,
        groupName: data.groupName,
        professorId: data.professorId,
        professorName: data.professorName,
        department: data.department,
        reason: data.reason,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        meetingType: data.meetingType,
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...(data.studentEmail ? { studentEmail: data.studentEmail } : {}),
        ...(data.meetingLink ? { meetingLink: data.meetingLink } : {}),
    }

    await docRef.set(officeHourRequest)
    return officeHourRequest
}

const sortOfficeHourRequests = (officeHourRequests: OfficeHourRequestRecord[]): OfficeHourRequestRecord[] => {
    officeHourRequests.sort((a, b) => {
        const aSeconds = a.createdAt?.seconds ?? 0
        const bSeconds = b.createdAt?.seconds ?? 0
        return bSeconds - aSeconds
    })

    return officeHourRequests
}

export const getOfficeHourRequests = async ({
    professorId,
    status,
}: {
    professorId?: string | null
    status?: OfficeHourRequestRecord['status'] | null
} = {}): Promise<OfficeHourRequestRecord[]> => {
    let query: FirebaseFirestore.Query = collection

    if (professorId) {
        query = query.where('professorId', '==', professorId)
    }

    if (status) {
        query = query.where('status', '==', status)
    }

    const snapshot = await query.get()
    const officeHourRequests: OfficeHourRequestRecord[] = []

    snapshot.forEach((doc) => {
        officeHourRequests.push(doc.data() as OfficeHourRequestRecord)
    })

    return sortOfficeHourRequests(officeHourRequests)
}

export const getOfficeHourRequestsByStudent = async (studentId: string): Promise<OfficeHourRequestRecord[]> => {
    const snapshot = await collection.where('studentId', '==', studentId).get()
    const officeHourRequests: OfficeHourRequestRecord[] = []

    snapshot.forEach((doc) => {
        officeHourRequests.push(doc.data() as OfficeHourRequestRecord)
    })

    officeHourRequests.sort((a, b) => {
        const aSeconds = a.createdAt?.seconds ?? 0
        const bSeconds = b.createdAt?.seconds ?? 0
        return bSeconds - aSeconds
    })

    return officeHourRequests
}

export const updateOfficeHourRequest = async (
    id: string,
    updates: Partial<Pick<OfficeHourRequestRecord, 'status' | 'date' | 'startTime' | 'endTime' | 'meetingLink'>>
): Promise<void> => {
    await collection.doc(id).update({
        ...updates,
        updatedAt: Timestamp.now(),
    })
}