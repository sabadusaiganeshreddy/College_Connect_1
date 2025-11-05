// Check Firebase Database Status
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, onValue } from 'firebase/database';

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

console.log('🔍 Connecting to Firebase...');

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const collegesRef = ref(database, 'colleges');

try {
    const snapshot = await get(collegesRef);
    const data = snapshot.val();
    
    console.log('\n📊 Firebase Database Status:');
    console.log('================================');
    
    if (data === null) {
        console.log('❌ DATABASE IS EMPTY!');
        console.log('\nPossible reasons:');
        console.log('1. Data was deleted');
        console.log('2. Firebase rules are blocking reads');
        console.log('3. Wrong database reference');
    } else {
        console.log('✅ Data exists in Firebase!');
        console.log('\n📈 Database Contents:');
        console.log(JSON.stringify(data, null, 2));
        
        const colleges = Object.keys(data).length;
        let totalStudents = 0;
        let totalCompanies = 0;
        
        Object.values(data).forEach(college => {
            totalStudents += college.students?.length || 0;
            totalCompanies += college.companies?.length || 0;
        });
        
        console.log('\n📊 Statistics:');
        console.log(`Total Colleges: ${colleges}`);
        console.log(`Total Students: ${totalStudents}`);
        console.log(`Total Companies: ${totalCompanies}`);
    }
    
} catch (error) {
    console.error('\n❌ ERROR accessing Firebase:');
    console.error(error.message);
    console.log('\nThis could mean:');
    console.log('1. Firebase rules are blocking access');
    console.log('2. Network/connection issue');
    console.log('3. Invalid credentials');
}

process.exit(0);
