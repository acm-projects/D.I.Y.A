import { backfillEmbeddings } from "../functions/backfillEmbeddings.ts";
import '../config/firebase.ts'
import { db } from '../config/firebase.ts'

const snapshot = await db.collection('posts').get();

console.log("Total posts:", snapshot.size);

const docs = snapshot.docs.filter(doc => {
  const emb = doc.data().embedding;
  return !emb || emb.length === 0;
});

console.log("Posts missing embeddings:", docs.length);

const run = async () => {
    try {
        await backfillEmbeddings();
        console.log("Backfill complete")
        process.exit(0)
    } catch (err) {
        console.error("Backfill failed", err)
        process.exit(1)
    }
};

run()