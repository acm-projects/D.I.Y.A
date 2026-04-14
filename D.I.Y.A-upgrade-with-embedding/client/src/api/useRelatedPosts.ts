import { useState, useEffect } from 'react'
import type { Post } from '../../../server/types.ts'

export const useRelatedPosts = (postId: string | null) => {
    const [relatedPosts, setRelatedPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!postId) return

        const fetchRelatedPosts = async () => {
            setLoading(true)
            try {
                const response = await fetch(`/api/posts/${postId}/related`)
                if (!response.ok) {
                    throw new Error('Failed to fetch related posts')
                }

                const data = await response.json();
                console.log("RELATED POSTS API RESPONSE:", data);
                setRelatedPosts(data.relatedPosts);
            } catch (err) {
                setError((err as Error).message)
            } finally {
                setLoading(false)
            }
        }

        fetchRelatedPosts()
    }, [postId])

    return { relatedPosts, loading, error }
}