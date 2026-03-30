import { db } from './firebase.ts'

export const test = async () => {
    const docRef = db.collection('test').doc('testDoc')
    await docRef.set({message: 'Hello, world!'})
    const doc = await docRef.get()
    console.log(doc.data())
}

await test()