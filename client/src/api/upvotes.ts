const BASE_URL = "http://localhost:3000/api/upvotes"

export const createUpvote = async (postId: string, userId: string) => {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, userId }),
    })
    if (!res.ok) throw new Error('Failed to create upvote.');
    return res.json();
}

export const deleteUpvote = async (upvoteId: string) => {
    const res = await fetch(`${BASE_URL}/${upvoteId}`, {
        method: "DELETE",
    })
    if (!res.ok) throw new Error('Failed to delete upvote.');
    return res.json();
}

export const getUpvotesByPost = async (postId: string) => {
    const res = await fetch(`${BASE_URL}/posts/${postId}`);
    if (!res.ok) throw new Error('Failed to fetch upvotes for post.');
    return res.json();
}