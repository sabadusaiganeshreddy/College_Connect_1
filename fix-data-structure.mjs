// Fix college data structure - add missing fields
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set } from 'firebase/database';

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

console.log('🔧 Fixing college data structure...');

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

try {
    const snapshot = await get(ref(database, 'colleges'));
    const colleges = snapshot.val();
    
    if (!colleges) {
        console.log('❌ No data found');
        process.exit(0);
    }
    
    let fixed = false;
    
    Object.keys(colleges).forEach(collegeKey => {
        const college = colleges[collegeKey];
        
        // Add missing companies array
        if (!college.companies) {
            console.log(`✅ Adding companies array to ${college.name}`);
            college.companies = [];
            fixed = true;
        }
        
        // Add missing selections to students
        if (college.students) {
            college.students.forEach((student, idx) => {
                if (!student.selections) {
                    console.log(`✅ Adding selections array to student: ${student.name}`);
                    college.students[idx].selections = [];
                    fixed = true;
                }
            });
        }
    });
    
    if (fixed) {
        await set(ref(database, 'colleges'), colleges);
        console.log('✅ Data structure fixed and saved to Firebase!');
    } else {
        console.log('✅ Data structure is already correct!');
    }
    
} catch (error) {
    console.error('❌ Error:', error.message);
}

process.exit(0);
