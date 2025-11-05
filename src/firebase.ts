import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration - uses environment variables in production (Vercel)
// Falls back to hardcoded values for local development
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDewKmEsvryFalR53CMLGrTiem3l6-fCXc",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "collegeconnect-a3fe0.firebaseapp.com",
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://collegeconnect-a3fe0-default-rtdb.firebaseio.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "collegeconnect-a3fe0",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "collegeconnect-a3fe0.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "90391097177",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:90391097177:web:4d037f831fa4401632e648",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-NXQVGC9ZX2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

export default app;
