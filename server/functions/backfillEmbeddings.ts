import { generateEmbedding } from '../api/services/embedding.ts';
import * as admin from 'firebase-admin';

export const backfillEmbeddings = async () => {
    const db = admin.firestore();
    const postsSnapshot = await db.collection('posts').where('embedding', '==', null).get();

    const batchSize = 10;
    const docs = postsSnapshot.docs;

    for (let i = 0; i < docs.length; i += batchSize) {
        const batch = docs.slice(i, i + batchSize);

        await Promise.all(batch.map(async (doc) => {
            const data = doc.data();
            try {
                const text = `${data.title} ${data.content}`;
                const vector = await generateEmbedding(text);
                await doc.ref.update({ embedding: vector });
            } catch (error) {
                console.error(`Error generating embedding for post ${doc.id}:`, error);
            }
        }));
    }
};