import { db } from '../config/firebase.js'
import type { User } from '../types.js'
import { Timestamp } from 'firebase-admin/firestore'

const collection = db.collection('users') // Reference to the 'users' collection in Firestore

export const createUser = async (data: Omit<User, 'id'>): Promise<User> => {   // Pass User data without the id field, generated in databse
    const docRef = collection.doc()

    // Create a new user object with the provided data and generated id
    const user: User = {
        id: docRef.id,
        name: data.name,
        email: data.email,
        role: data.role,
        groups: data.groups,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...(data.avatarUrl ? { avatarUrl: data.avatarUrl } : {}) // Conditionally include avatarUrl if provided
    }

    await docRef.set(user)  // Save the user document to Firestore
    return user // Return the created user object
}

export const getUser = async (id: string): Promise<User | null> => {
    const doc = await collection.doc(id).get() // Get user document by id
    return doc.exists ? (doc.data() as User) : null // Return the user data if document exists, otherwise return null
}

export const updateUser = async (id: string, updates: Partial<User>): Promise<void> => {    // Pass the user id and the fields to update (partial User object)
    const docRef = await collection.doc(id) // Get reference to the user document by id
    await docRef.update(updates) // Update the user document with the provided updates
    await docRef.update({ updatedAt: Timestamp.now() }) // Update the updatedAt field to the current timestamp
}

export const deleteUser = async (id: string): Promise<void> => {
    await collection.doc(id).delete() // Delete the user document by id
}