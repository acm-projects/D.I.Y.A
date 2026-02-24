import { Timestamp } from 'firebase-admin/firestore'

export interface User {
    id: string
    name: string
    email: string
    role: 'admin' | 'user'
    avatarUrl?: string
    groups: string[]
    createdAt: Timestamp
    updatedAt: Timestamp
}

export interface Group {
    id: string
    title: string
    avatarUrl?: string
    description: string
    professor: string
    members: string[]
    createdAt: Timestamp
    updatedAt: Timestamp
}

export interface Assignment {
    id: string
    title: string
    description: string
    groupId: string
    rubricId: string
    imageUrl?: string
    createdAt: Timestamp
    updatedAt: Timestamp 
}

export interface Rubric {
    id: string
    title: string
    criteria?: Criterion[]
    imageUrl?: string
    createdAt: Timestamp
    updatedAt: Timestamp
}

export interface Criterion {
    id: string
    description: string
    points: number
}

export interface Post {
    id: string
    title: string
    imageUrl?: string
    upvotes: Upvote[]
    authorId: string
    groupId: string
    content: string
    createdAt: Timestamp
    updatedAt: Timestamp
    ai_answer?: string
    is_verified?: boolean
}

export interface Upvote {
    userId: string
    upvotedAt: Timestamp
}

export interface GradeAttempt {
    id: string
    assignmentId: string
    studentId: string
    rubricID: string
    ai_grade: number
    feedback: string
    createdAt: Timestamp
    updatedAt: Timestamp
}

export interface OfficeHour {
    id: string
    studentId: string
    professor: string
    groupId: string
    time: Timestamp
    location: string
    topic: string
    status: 'accepted' | 'pending' | 'rejected'
    createdAt: Timestamp
    updatedAt: Timestamp
}
