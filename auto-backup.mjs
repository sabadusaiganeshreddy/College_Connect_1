// Automatic Daily Backup System for College Connect
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, onValue } from 'firebase/database';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Create backups directory if it doesn't exist
const backupsDir = './backups';
if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir);
    console.log('📁 Created backups directory');
}

async function createBackup() {
    try {
        console.log('🔄 Starting backup...');
        
        const snapshot = await get(ref(database, 'colleges'));
        const data = snapshot.val();
        
        if (!data) {
            console.log('⚠️  No data found in Firebase - skipping backup');
            return;
        }
        
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const filename = `backup-${timestamp}.json`;
        const filepath = path.join(backupsDir, filename);
        
        // Create backup with metadata
        const backupData = {
            timestamp: new Date().toISOString(),
            data: data,
            stats: {
                colleges: Object.keys(data).length,
                students: Object.values(data).reduce((sum, c) => sum + (c.students?.length || 0), 0),
                companies: Object.values(data).reduce((sum, c) => sum + (c.companies?.length || 0), 0)
            }
        };
        
        fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
        
        console.log(`✅ Backup created: ${filename}`);
        console.log(`📊 Stats:`);
        console.log(`   - Colleges: ${backupData.stats.colleges}`);
        console.log(`   - Students: ${backupData.stats.students}`);
        console.log(`   - Companies: ${backupData.stats.companies}`);
        
        // Keep only last 30 backups
        cleanOldBackups();
        
    } catch (error) {
        console.error('❌ Backup failed:', error.message);
        // Send alert email or notification here
    }
}

function cleanOldBackups() {
    const files = fs.readdirSync(backupsDir)
        .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
        .sort()
        .reverse();
    
    if (files.length > 30) {
        const toDelete = files.slice(30);
        toDelete.forEach(file => {
            fs.unlinkSync(path.join(backupsDir, file));
            console.log(`🗑️  Deleted old backup: ${file}`);
        });
    }
}

// Run backup
createBackup().then(() => {
    console.log('✅ Backup process completed');
    process.exit(0);
});
