import admin from 'firebase-admin';
import serviceAccount from './firebaseKey.json' with { type: 'json' };
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export const db = getFirestore();
