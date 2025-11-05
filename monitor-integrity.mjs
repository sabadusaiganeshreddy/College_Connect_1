// Data Integrity Monitor - Runs continuously to detect anomalies
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, get, set } from 'firebase/database';
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

console.log('🛡️ Starting Data Integrity Monitor...\n');

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let lastSnapshot = null;
let alertCount = 0;

// Monitor database changes
const collegesRef = ref(database, 'colleges');

onValue(collegesRef, (snapshot) => {
    const data = snapshot.val();
    const timestamp = new Date().toISOString();
    
    if (!data) {
        console.log(`\n⚠️  [${timestamp}] WARNING: Database is empty!`);
        
        // Try to auto-restore from last snapshot
        if (lastSnapshot && alertCount === 0) {
            console.log('🔄 Attempting auto-restore from last snapshot...');
            set(collegesRef, lastSnapshot).then(() => {
                console.log('✅ Database restored from last snapshot!');
                alertCount++;
            }).catch(err => {
                console.error('❌ Auto-restore failed:', err.message);
            });
        }
        return;
    }
    
    const stats = {
        colleges: Object.keys(data).length,
        students: Object.values(data).reduce((sum, c) => sum + (c.students?.length || 0), 0),
        companies: Object.values(data).reduce((sum, c) => sum + (c.companies?.length || 0), 0)
    };
    
    // Check for significant data loss
    if (lastSnapshot) {
        const lastStats = {
            colleges: Object.keys(lastSnapshot).length,
            students: Object.values(lastSnapshot).reduce((sum, c) => sum + (c.students?.length || 0), 0),
            companies: Object.values(lastSnapshot).reduce((sum, c) => sum + (c.companies?.length || 0), 0)
        };
        
        const studentLoss = lastStats.students - stats.students;
        const collegeLoss = lastStats.colleges - stats.colleges;
        const companyLoss = lastStats.companies - stats.companies;
        
        if (studentLoss > 5 || collegeLoss > 1) {
            console.log(`\n🚨 [${timestamp}] DATA LOSS DETECTED!`);
            console.log(`   Lost ${studentLoss} students, ${collegeLoss} colleges, ${companyLoss} companies`);
            console.log(`   Previous: ${lastStats.students} students, ${lastStats.colleges} colleges`);
            console.log(`   Current: ${stats.students} students, ${stats.colleges} colleges`);
            
            // Create emergency backup
            const emergencyFile = `./backups/EMERGENCY-${Date.now()}.json`;
            fs.writeFileSync(emergencyFile, JSON.stringify({
                timestamp,
                alert: 'Data loss detected',
                before: lastStats,
                after: stats,
                recoveryData: lastSnapshot
            }, null, 2));
            
            console.log(`   💾 Emergency backup created: ${emergencyFile}`);
            console.log(`   🔄 You can restore using: npm run restore`);
        } else if (studentLoss > 0 || collegeLoss > 0) {
            console.log(`\n📉 [${timestamp}] Data decreased:`);
            console.log(`   -${studentLoss} students, -${collegeLoss} colleges`);
        } else if (stats.students > lastStats.students || stats.colleges > lastStats.colleges) {
            console.log(`\n📈 [${timestamp}] Data increased:`);
            console.log(`   +${stats.students - lastStats.students} students, +${stats.colleges - lastStats.colleges} colleges`);
        }
    }
    
    console.log(`✅ [${timestamp}] Database healthy: ${stats.colleges} colleges, ${stats.students} students, ${stats.companies} companies`);
    
    // Update last snapshot
    lastSnapshot = JSON.parse(JSON.stringify(data));
}, (error) => {
    console.error(`\n❌ [${new Date().toISOString()}] Monitor error:`, error.message);
});

console.log('✅ Monitor active. Watching for changes...');
console.log('Press Ctrl+C to stop\n');

// Keep process alive
process.stdin.resume();
