import { Timestamp } from 'firebase-admin/firestore'

export interface User {
    id: string
    authId?: string
    name: string
    email: string
    role: 'admin' | 'user' | 'student' | 'professor' | 'ta'
    avatarUrl?: string  // Optional avatar for the user
    groups: string[]
    createdAt: Timestamp
    updatedAt: Timestamp
}

export interface Group {
    id: string
    title: string
    avatarUrl?: string  // Optional avatar for the group
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
    rubricId?: string   // Optional rubric
    imageUrl?: string   // Optional image upload for the assignment
    createdAt: Timestamp
    updatedAt: Timestamp 
}

export interface Rubric {
    id: string
    title: string
    criteria?: Criterion[]  // Optional array of written criteria
    imageUrl?: string   // Optional image upload
    createdAt: Timestamp
    updatedAt: Timestamp
}

export interface Criterion {
    id: string
    description: string
    points?: number // Optional points for the criterion, can be used for grading
    createdAt: Timestamp
    updatedAt: Timestamp
}

export interface Post {
    id: string
    title: string
    imageUrl?: string   // Optional image upload for the post
    upvotes: Upvote[]
    authorId: string
    groupId: string
    content: string
    createdAt: Timestamp
    updatedAt: Timestamp
    embedding?: number[]  // Optional embedding for semantic search
    aiAnswer?: string  // Optional AI-generated answer for the post
    isVerified?: boolean   // Optional field to indicate if the AI-generated answer has been verified by a human
    aiReviewStatus?: 'pending' | 'verified' | 'rejected'
}

export interface Upvote {
    id: string
    postId: string
    userId: string
    upvotedAt: Timestamp
}

export interface GradeAttempt {
    id: string
    assignmentId?: string   // Optional assignmentId for grading an assignment
    studentId: string
    rubricID: string    // Has to be either an image or a written rubric, handles in createRubric function
    aiGrade: number
    feedback: string
    createdAt: Timestamp
    updatedAt: Timestamp
}

export interface OfficeHour {
    id: string
    studentId: string
    studentName?: string
    studentEmail?: string
    professorId: string
    professorName?: string
    department?: string
    groupId: string
    date?: string
    startTime?: string
    endTime?: string
    meetingType?: 'online' | 'in-person'
    meetingLink?: string
    scheduledTime: Timestamp
    location: string
    topic: string
    status: 'accepted' | 'pending' | 'rejected' | 'confirmed' | 'declined' | 'completed'
    createdAt: Timestamp
    updatedAt: Timestamp
}

export interface Announcement {
    id: string
    authorId: string
    authorName: string
    title: string
    message: string
    groupId?: string
    createdAt: Timestamp
    updatedAt: Timestamp
}
