import { generateEmbedding } from '../api/services/embedding.ts';
import * as admin from 'firebase-admin';

export const backfillEmbeddings = async () => {
    const db = admin.firestore();
    const postsSnapshot = await db.collection('posts').get();

    for (const doc of postsSnapshot.docs) {
        const data = doc.data();
        if (!data.embedding) {
            try {
                const text = `${data.title} ${data.content}`;
                const vector = await generateEmbedding(text);
                await doc.ref.update({ embedding: vector });
                console.log(`Backfilled embedding for post ${doc.id}`);
            } catch (error) {
                console.error(`Error generating embedding for post ${doc.id}:`, error);
            }
        }
    }
};