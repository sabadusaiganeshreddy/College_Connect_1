// Automatic Firebase Backup Script
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
import fs from 'fs';

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

console.log('📦 Starting Firebase Backup...');

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

try {
    const snapshot = await get(ref(database, 'colleges'));
    const data = snapshot.val();
    
    if (!data) {
        console.log('⚠️  No data found in Firebase to backup');
        process.exit(0);
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `backup-${timestamp}.json`;
    
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    
    console.log(`✅ Backup created: ${filename}`);
    console.log(`📊 Backed up ${Object.keys(data).length} colleges`);
    
    let totalStudents = 0;
    let totalCompanies = 0;
    Object.values(data).forEach(college => {
        totalStudents += college.students?.length || 0;
        totalCompanies += college.companies?.length || 0;
    });
    
    console.log(`   - ${totalStudents} students`);
    console.log(`   - ${totalCompanies} companies`);
    
} catch (error) {
    console.error('❌ Backup failed:', error.message);
}

process.exit(0);
