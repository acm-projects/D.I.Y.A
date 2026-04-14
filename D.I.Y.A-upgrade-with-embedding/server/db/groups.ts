import { db } from '../config/firebase.ts'
import type { Group, User } from '../types.ts'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import type { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase-admin/firestore'

const collection = db.collection('groups')
const usersCollection = db.collection('users')

type CreateGroupInput = {
    title: string
    description: string
    professorId: string
    avatarUrl?: string
}

const normalizeValue = (value?: string | null): string | null => {
    const normalized = value?.trim()
    return normalized ? normalized : null
}

const toGroupRecord = (doc: DocumentSnapshot | QueryDocumentSnapshot): Group | null => {
    const data = doc.data() as Group | undefined

    if (!data) {
        return null
    }

    return {
        ...data,
        id: data.id || doc.id,
    }
}

const toUserRecord = (doc: DocumentSnapshot | QueryDocumentSnapshot): User | null => {
    const data = doc.data() as User | undefined

    if (!data) {
        return null
    }

    return {
        ...data,
        id: data.id || doc.id,
    }
}

const resolveProfessorDocument = async (professorId: string) => {
    const normalizedProfessorId = normalizeValue(professorId)

    if (!normalizedProfessorId) {
        throw new Error('Professor id is required to create a group.')
    }

    const directDoc = await usersCollection.doc(normalizedProfessorId).get()
    const directUser = directDoc.exists ? toUserRecord(directDoc) : null
    if (directUser) {
        return { ref: directDoc.ref, user: directUser }
    }

    const authIdSnapshot = await usersCollection.where('authId', '==', normalizedProfessorId).limit(1).get()
    const authDoc = authIdSnapshot.docs[0]
    const authUser = authDoc ? toUserRecord(authDoc) : null
    if (authDoc && authUser) {
        return { ref: authDoc.ref, user: authUser }
    }

    throw new Error('Professor user record could not be found.')
}

export const getGroups = async (): Promise<Group[]> => {
    const snapshot = await collection.get()
    const groups: Group[] = []
    snapshot.forEach((doc) => {
        const group = toGroupRecord(doc)
        if (group) {
            groups.push(group)
        }
    })
    return groups
}

export const createGroup = async ({ title, description, professorId, avatarUrl }: CreateGroupInput): Promise<Group> => {
    const normalizedTitle = normalizeValue(title)
    const normalizedDescription = description.trim()

    if (!normalizedTitle) {
        throw new Error('Group title is required.')
    }

    const docRef = collection.doc()
    const { ref: professorRef, user: professorUser } = await resolveProfessorDocument(professorId)
    const now = Timestamp.now()

    const group: Group = {
        id: docRef.id,
        title: normalizedTitle,
        description: normalizedDescription,
        professor: professorUser.authId || professorUser.id,
        members: [],
        createdAt: now,
        updatedAt: now,
        ...(avatarUrl ? { avatarUrl } : {})
    }

    const batch = db.batch()
    batch.set(docRef, group)
    batch.update(professorRef, {
        groups: FieldValue.arrayUnion(group.id),
        updatedAt: now,
    })
    await batch.commit()

    return group
}

export const getGroup = async (id: string): Promise<Group | null> => {
    const normalizedId = normalizeValue(id)
    if (!normalizedId) {
        return null
    }

    const doc = await collection.doc(normalizedId).get()
    return doc.exists ? toGroupRecord(doc) : null
}

export const updateGroup = async (id: string, updates: Partial<Group>): Promise<void> => {
    const normalizedId = normalizeValue(id)
    if (!normalizedId) {
        throw new Error('Group id is required to update a group.')
    }

    const docRef = collection.doc(normalizedId)
    await docRef.update(updates)
    await docRef.update({ updatedAt: Timestamp.now() })
}

export const deleteGroup = async (id: string): Promise<void> => {
    const normalizedId = normalizeValue(id)
    if (!normalizedId) {
        throw new Error('Group id is required to delete a group.')
    }

    await collection.doc(normalizedId).delete()
}
