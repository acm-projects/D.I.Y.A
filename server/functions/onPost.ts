import * as admin from 'firebase-admin';
import { generateEmbedding } from '../api/services/embedding.ts';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/firestore';

export const onPostCreated = onDocumentCreated('posts/{postId}', async (event) => {
    const snap = event.data;
    if (!snap) return;

    const post = snap.data();
    const postId = event.params.postId;

    const text = `${post.title} ${post.content}`;

    try {
        const vector = await generateEmbedding(text);

        return admin.firestore().collection('posts').doc(postId).update({
            embedding: vector
        })
    } catch (error) {
        console.error('Error generating embedding:', error);
        return null;
    }
});

export const onPostUpdated = onDocumentUpdated('posts/{postId}', async (event) => {
    const before = event.data?.before;
    const after = event.data?.after;

    if (!before || !after) return;

    const beforeData = before.data();
    const afterData = after.data();

    // Only update embedding if title or content has changed
    if (beforeData.title === afterData.title && beforeData.content === afterData.content) {
        return null;
    }

    const text = `${afterData.title} ${afterData.content}`;

    try {
        const vector = await generateEmbedding(text);

        return admin.firestore().collection('posts').doc(event.params.postId).update({
            embedding: vector
        })
    } catch (error) {
        console.error('Error generating embedding:', error);
        return null;
    }
});
