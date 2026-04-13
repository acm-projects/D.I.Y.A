import { generateEmbedding } from '../api/services/embedding.ts';
import { getFirestore } from 'firebase-admin/firestore';

export const backfillEmbeddings = async () => {
    const db = getFirestore();

    const postsSnapshot = await db.collection('posts').get();
    const docs = postsSnapshot.docs.filter(doc => !doc.data().embedding);

    console.log("Total docs:", postsSnapshot.size);
    console.log("Missing embeddings:", docs.length);

    const batchSize = 10;

    for (let i = 0; i < docs.length; i += batchSize) {
        const batch = docs.slice(i, i + batchSize);

        await Promise.all(batch.map(async (doc) => {
            const data = doc.data();

            try {
                const text = `${data.title} ${data.content}`;

                console.log("Generating embedding for:", doc.id);

                const vector = await generateEmbedding(text);

                if (!Array.isArray(vector)) {
                    console.log("Invalid embedding:", doc.id, vector);
                    return;
                }

                await doc.ref.update({ embedding: vector });

                console.log("Updated:", doc.id);
            } catch (error) {
                console.error(`Error for ${doc.id}:`, error);
            }
        }));
    }
};