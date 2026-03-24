const BASE_URL = "http://localhost:3000/api/posts"

export const getPosts = async () => {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error('Failed to fetch posts.');
    return res.json();
}

export const getPostsByGroup = async (groupId: string) => {
    if (!groupId) throw new Error('groupId is required')
    const res = await fetch(`${BASE_URL}/groups/${groupId}`)
    if (!res.ok) throw new Error('Failed to fetch posts by group.');
    return res.json();
}