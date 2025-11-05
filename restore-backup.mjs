// Restore data from backup
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

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

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function listBackups() {
    const backupsDir = './backups';
    
    if (!fs.existsSync(backupsDir)) {
        console.log('❌ No backups directory found');
        return [];
    }
    
    const files = fs.readdirSync(backupsDir)
        .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
        .sort()
        .reverse();
    
    if (files.length === 0) {
        console.log('❌ No backups found');
        return [];
    }
    
    console.log('\n📦 Available Backups:\n');
    files.forEach((file, index) => {
        const filepath = path.join(backupsDir, file);
        const backup = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        console.log(`${index + 1}. ${file}`);
        console.log(`   Date: ${new Date(backup.timestamp).toLocaleString()}`);
        console.log(`   Colleges: ${backup.stats.colleges}, Students: ${backup.stats.students}, Companies: ${backup.stats.companies}`);
        console.log('');
    });
    
    return files;
}

async function restoreBackup() {
    try {
        const files = await listBackups();
        
        if (files.length === 0) {
            process.exit(1);
        }
        
        const answer = await question('Enter backup number to restore (or "cancel"): ');
        
        if (answer.toLowerCase() === 'cancel') {
            console.log('❌ Restore cancelled');
            process.exit(0);
        }
        
        const index = parseInt(answer) - 1;
        
        if (isNaN(index) || index < 0 || index >= files.length) {
            console.log('❌ Invalid selection');
            process.exit(1);
        }
        
        const selectedFile = files[index];
        const filepath = path.join('./backups', selectedFile);
        const backup = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        
        console.log(`\n⚠️  You are about to restore: ${selectedFile}`);
        console.log(`This will REPLACE current database with:`);
        console.log(`   - ${backup.stats.colleges} colleges`);
        console.log(`   - ${backup.stats.students} students`);
        console.log(`   - ${backup.stats.companies} companies`);
        
        const confirm = await question('\nType "RESTORE" to confirm: ');
        
        if (confirm !== 'RESTORE') {
            console.log('❌ Restore cancelled');
            process.exit(0);
        }
        
        console.log('\n🔄 Restoring backup...');
        
        // Create a backup of current state before restoring
        const currentSnapshot = await get(ref(database, 'colleges'));
        const currentData = currentSnapshot.val();
        if (currentData) {
            const emergencyBackup = {
                timestamp: new Date().toISOString(),
                note: 'Emergency backup before restore',
                data: currentData
            };
            fs.writeFileSync(
                `./backups/emergency-before-restore-${Date.now()}.json`,
                JSON.stringify(emergencyBackup, null, 2)
            );
            console.log('✅ Created emergency backup of current state');
        }
        
        // Restore the backup
        await set(ref(database, 'colleges'), backup.data);
        
        console.log('✅ Backup restored successfully!');
        console.log(`📊 Restored ${backup.stats.colleges} colleges, ${backup.stats.students} students, ${backup.stats.companies} companies`);
        
    } catch (error) {
        console.error('❌ Restore failed:', error.message);
    } finally {
        rl.close();
        process.exit(0);
    }
}

restoreBackup();
