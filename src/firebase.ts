import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration
// TODO: Replace with your Firebase project credentials
// Get these from: Firebase Console > Project Settings > General > Your apps > Firebase SDK snippet
const firebaseConfig = {
    apiKey: "AIzaSyDewKmEsvryFalR53CMLGrTiem3l6-fCXc",
    authDomain: "collegeconnect-a3fe0.firebaseapp.com",
    databaseURL: "https://collegeconnect-a3fe0-default-rtdb.firebaseio.com",
    projectId: "collegeconnect-a3fe0",
    storageBucket: "collegeconnect-a3fe0.firebasestorage.app",
    messagingSenderId: "90391097177",
    appId: "1:90391097177:web:4d037f831fa4401632e648",
    measurementId: "G-NXQVGC9ZX2"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

export default app;
