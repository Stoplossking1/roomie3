// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Import Firebase Storage

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyABeYKRkb3V6t5tbMLbvPkyvMAIHSH2800",
  authDomain: "exam1-7960c.firebaseapp.com",
  projectId: "exam1-7960c",
  storageBucket: "exam1-7960c.firebasestorage.app",
  messagingSenderId: "134432081401",
  appId: "1:134432081401:web:cbac90c40841a656bba928"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the auth module
export const auth = getAuth(app);

// Export the Firestore database
export const db = getFirestore(app);

// Export the Firebase Storage
export const storage = getStorage(app);