import { useState, useEffect } from 'react'

interface RelatedPost {
    id: string;
    title?: string;
    content?: string;
    groupId?: string;
}

export const useRelatedPosts = (postId: string | null) => {
    const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([])
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
                setRelatedPosts(data.relatedPosts);
            } catch (err) {
                setError((err as Error).message)
            } finally {
                setLoading(false)
            }
        }

        void fetchRelatedPosts()
    }, [postId])

    return { relatedPosts, loading, error }
}
