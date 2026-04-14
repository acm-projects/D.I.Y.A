import { Timestamp } from 'firebase-admin/firestore'
import { db } from '../config/firebase.ts'

export interface SelfCheckImprovement {
    section: string
    suggestion: string
}

export interface SelfCheckRecord {
    id: string
    studentId: string
    assignmentName: string
    rubricName: string
    potentialGrade: string
    letterGrade: string
    improvements: SelfCheckImprovement[]
    createdAt: Timestamp
}

const collection = db.collection('selfChecks')

export const createSelfCheck = async (
    data: Omit<SelfCheckRecord, 'id' | 'createdAt'>
): Promise<SelfCheckRecord> => {
    const docRef = collection.doc()

    const selfCheck: SelfCheckRecord = {
        id: docRef.id,
        studentId: data.studentId,
        assignmentName: data.assignmentName,
        rubricName: data.rubricName,
        potentialGrade: data.potentialGrade,
        letterGrade: data.letterGrade,
        improvements: data.improvements,
        createdAt: Timestamp.now(),
    }

    await docRef.set(selfCheck)
    return selfCheck
}

export const getSelfChecksByStudent = async (studentId: string): Promise<SelfCheckRecord[]> => {
    const snapshot = await collection.where('studentId', '==', studentId).get()
    const selfChecks: SelfCheckRecord[] = []

    snapshot.forEach((doc) => {
        selfChecks.push(doc.data() as SelfCheckRecord)
    })

    selfChecks.sort((a, b) => {
        const aSeconds = a.createdAt?.seconds ?? 0
        const bSeconds = b.createdAt?.seconds ?? 0
        return bSeconds - aSeconds
    })

    return selfChecks
}
