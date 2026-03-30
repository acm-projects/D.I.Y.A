import { db } from '../config/firebase.ts'
import type { User } from '../types.ts'
import { Timestamp } from 'firebase-admin/firestore'
import type { DocumentSnapshot } from 'firebase-admin/firestore'

const collection = db.collection('users') // Reference to the 'users' collection in Firestore

const normalizeLookupValue = (value?: string | null): string | null => {
    const normalized = value?.trim()
    return normalized ? normalized : null
}

const toUserRecord = (doc: DocumentSnapshot): User | null => {
    const data = doc.data() as User | undefined

    if (!data) {
        return null
    }

    return {
        ...data,
        id: data.id || doc.id,
    }
}

const getFallbackName = (email?: string | null, name?: string | null): string => {
    const trimmedName = name?.trim()

    if (trimmedName) {
        return trimmedName
    }

    const trimmedEmail = email?.trim()
    if (trimmedEmail) {
        return trimmedEmail.split('@')[0] || 'Student'
    }

    return 'Student'
}

export const createUser = async (data: Omit<User, 'id'>): Promise<User> => {   // Pass User data without the id field, generated in databse
    const docRef = collection.doc()

    // Create a new user object with the provided data and generated id
    const user: User = {
        id: docRef.id,
        ...(data.authId ? { authId: data.authId } : {}),
        name: data.name,
        email: data.email,
        role: data.role,    // Enumerated type?
        groups: data.groups,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...(data.avatarUrl ? { avatarUrl: data.avatarUrl } : {}) // Conditionally include avatarUrl if provided
    }

    await docRef.set(user)  // Save the user document to Firestore
    return user // Return the created user object
}

export const getUser = async (id: string): Promise<User | null> => {
    const normalizedId = normalizeLookupValue(id)
    if (!normalizedId) {
        return null
    }

    const doc = await collection.doc(normalizedId).get() // Get user document by id
    return doc.exists ? toUserRecord(doc) : null // Return the user data if document exists, otherwise return null
}

export const getUsers = async (): Promise<User[]> => {
    const snapshot = await collection.get()
    const users: User[] = []

    snapshot.forEach((doc) => {
        const user = toUserRecord(doc)
        if (user) {
            users.push(user)
        }
    })

    users.sort((a, b) => a.name.localeCompare(b.name))
    return users
}

export const findUserByEmailOrId = async ({
    email,
    id,
}: {
    email?: string | null
    id?: string | null
}): Promise<User | null> => {
    const normalizedId = normalizeLookupValue(id)
    const normalizedEmail = normalizeLookupValue(email)

    if (normalizedId) {
        const doc = await collection.doc(normalizedId).get()
        if (doc.exists) {
            return toUserRecord(doc)
        }

        const authIdSnapshot = await collection.where('authId', '==', normalizedId).limit(1).get()
        if (!authIdSnapshot.empty) {
            const firstAuthDoc = authIdSnapshot.docs[0]
            if (firstAuthDoc) {
                return toUserRecord(firstAuthDoc)
            }
        }
    }

    if (normalizedEmail) {
        const snapshot = await collection.where('email', '==', normalizedEmail).limit(1).get()
        if (!snapshot.empty) {
            const firstDoc = snapshot.docs[0]
            if (firstDoc) {
                return toUserRecord(firstDoc)
            }
        }
    }

    return null
}

export const syncUserFromAuth = async ({
    email,
    id,
    name,
}: {
    email?: string | null
    id?: string | null
    name?: string | null
}): Promise<User> => {
    const normalizedEmail = normalizeLookupValue(email)
    const normalizedId = normalizeLookupValue(id)
    const existingUser = await findUserByEmailOrId({ email: normalizedEmail, id: normalizedId })

    if (existingUser) {
        const updates: Partial<User> = {}
        const existingUserId = normalizeLookupValue(existingUser.id) || normalizedId

        if (normalizedId && existingUser.authId !== normalizedId) {
            updates.authId = normalizedId
        }

        if (normalizedEmail && existingUser.email !== normalizedEmail) {
            updates.email = normalizedEmail
        }

        const resolvedName = getFallbackName(normalizedEmail, name)
        if (resolvedName && existingUser.name !== resolvedName) {
            updates.name = resolvedName
        }

        if (Object.keys(updates).length > 0) {
            if (!existingUserId) {
                throw new Error('Cannot update synced user because no valid Firestore document id was found.')
            }

            await updateUser(existingUserId, updates)
            return {
                ...existingUser,
                id: existingUserId,
                ...updates,
                updatedAt: Timestamp.now(),
            }
        }

        return {
            ...existingUser,
            id: existingUserId || existingUser.id,
        }
    }

    const docId = normalizedId || collection.doc().id
    const now = Timestamp.now()
    const syncedUser: User = {
        id: docId,
        ...(normalizedId ? { authId: normalizedId } : {}),
        name: getFallbackName(normalizedEmail, name),
        email: normalizedEmail || `${docId}@auth.local`,
        role: 'student',
        groups: [],
        createdAt: now,
        updatedAt: now,
    }

    await collection.doc(docId).set(syncedUser)
    return syncedUser
}

export const updateUser = async (id: string, updates: Partial<User>): Promise<void> => {    // Pass the user id and the fields to update (partial User object)
    const normalizedId = normalizeLookupValue(id)
    if (!normalizedId) {
        throw new Error('Cannot update user without a valid document id.')
    }

    const docRef = await collection.doc(normalizedId) // Get reference to the user document by id
    await docRef.update(updates) // Update the user document with the provided updates
    await docRef.update({ updatedAt: Timestamp.now() }) // Update the updatedAt field to the current timestamp
}

export const deleteUser = async (id: string): Promise<void> => {
    await collection.doc(id).delete() // Delete the user document by id
}