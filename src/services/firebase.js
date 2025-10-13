import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAYz021lu_J2lmCwYpKE4K4GXekfLvGaao",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "phoenix-prospects.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "phoenix-prospects",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "phoenix-prospects.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "739609384205",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:739609384205:web:2b9f4151ed11b074b78c44",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-LG8LGZ7WFE"
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);

  // Persistence not needed here - handled by custom session management

  db = getFirestore(app);
  storage = getStorage(app);
  console.log('Firebase initialized successfully with local persistence');
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