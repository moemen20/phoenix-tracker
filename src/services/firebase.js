import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAYz021lu_J2lmCwYpKE4K4GXekfLvGaao",
  authDomain: "phoenix-prospects.firebaseapp.com",
  projectId: "phoenix-prospects",
  storageBucket: "phoenix-prospects.firebasestorage.app",
  messagingSenderId: "739609384205",
  appId: "1:739609384205:web:2b9f4151ed11b074b78c44",
  measurementId: "G-LG8LGZ7WFE"
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // Create dummy objects to prevent crashes
  app = null;
  auth = null;
  db = null;
  storage = null;
}

export { auth, db, storage };
export default app;