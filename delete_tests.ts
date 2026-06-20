import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || "(default)");

async function run() {
  const snapshot = await getDocs(collection(db, 'universities'));
  let count = 0;
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const name = (data.name || "").toLowerCase();
    
    if (name.includes('test') || name.includes('demo') || name.includes('sample') || name.includes('temp')) {
      console.log('Deleting test university:', name);
      await deleteDoc(doc(db, 'universities', docSnap.id));
      count++;
    }
  }
  console.log(`Deleted ${count} test universities.`);
}
run().catch(console.error);
