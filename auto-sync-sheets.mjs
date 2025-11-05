import { google } from 'googleapis';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config();

// Firebase config - for Node.js scripts (not browser)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDewKmEsvryFalR53CMLGrTiem3l6-fCXc",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "collegeconnect-a3fe0.firebaseapp.com",
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || "https://collegeconnect-a3fe0-default-rtdb.firebaseio.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "collegeconnect-a3fe0",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "collegeconnect-a3fe0.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "90391097177",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:90391097177:web:4d037f831fa4401632e648",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-NXQVGC9ZX2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let isInitialSync = true;
let lastSyncTime = null;
let syncCount = 0;

// Google Sheets Authentication
async function getGoogleSheetsClient() {
  const credentials = JSON.parse(readFileSync('./google-credentials.json', 'utf8'));
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

// Sync function
async function syncToSheets(colleges, spreadsheetId) {
  try {
    syncCount++;
    const timestamp = new Date().toISOString();
    const localTime = new Date().toLocaleString();

    if (isInitialSync) {
      console.log(`\n🔄 Initial sync to Google Sheets...`);
      isInitialSync = false;
    } else {
      console.log(`\n🔄 Sync #${syncCount} triggered - ${localTime}`);
    }

    const sheets = await getGoogleSheetsClient();

    // Prepare data
    const studentsData = [
      ['Student ID', 'Name', 'Email', 'LinkedIn', 'College Domain', 'College Name', 'Registered At', 'Selections', 'Last Updated']
    ];

    const collegesData = [
      ['College Domain', 'College Name', 'Total Students', 'Total Companies', 'Created At', 'Last Updated']
    ];

    const companiesData = [
      ['Company ID', 'Company Name', 'College Domain', 'Added By', 'Visit Date', 'Selections', 'Job Roles', 'Added At', 'Last Updated']
    ];

    const auditLog = [
      ['Timestamp', 'Sync Number', 'Students Count', 'Colleges Count', 'Companies Count', 'Event Type']
    ];

    let totalStudents = 0;
    let totalCompanies = 0;

    for (const [collegeKey, college] of Object.entries(colleges || {})) {
      collegesData.push([
        college.domain || '',
        college.name || '',
        college.students?.length || 0,
        college.companies?.length || 0,
        college.createdAt || '',
        timestamp
      ]);

      if (college.students) {
        totalStudents += college.students.length;
        for (const student of college.students) {
          studentsData.push([
            student.id || '',
            student.name || '',
            student.email || '',
            student.linkedin || '',
            student.collegeDomain || college.domain || '',
            college.name || '',
            student.registeredAt || '',
            student.selections?.length || 0,
            timestamp
          ]);
        }
      }

      if (college.companies) {
        totalCompanies += college.companies.length;
        for (const company of college.companies) {
          companiesData.push([
            company.id || '',
            company.name || '',
            college.domain || '',
            company.addedBy || '',
            company.visitDate || '',
            company.totalSelections || 0,
            company.jobRoles?.join(', ') || '',
            company.addedAt || '',
            timestamp
          ]);
        }
      }
    }

    // Add audit log entry
    auditLog.push([
      timestamp,
      syncCount,
      totalStudents,
      collegesData.length - 1,
      totalCompanies,
      isInitialSync ? 'Initial Sync' : 'Auto Sync'
    ]);

    // Update all sheets
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      resource: {
        valueInputOption: 'RAW',
        data: [
          { range: 'Students!A1', values: studentsData },
          { range: 'Colleges!A1', values: collegesData },
          { range: 'Companies!A1', values: companiesData },
          { range: 'Audit Log!A1:F1', values: auditLog }
        ]
      }
    });

    // Append audit log (keep history)
    if (syncCount > 1) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Audit Log!A:F',
        valueInputOption: 'RAW',
        resource: {
          values: [auditLog[1]]
        }
      });
    }

    lastSyncTime = new Date();
    console.log(`✅ Synced: ${totalStudents} students, ${collegesData.length - 1} colleges, ${totalCompanies} companies`);
    console.log(`⏰ Time: ${localTime}`);

  } catch (error) {
    console.error('❌ Sync error:', error.message);
  }
}

// Monitor Firebase and auto-sync
async function startAutoSync(spreadsheetId) {
  console.log('🚀 Starting automatic Google Sheets sync...');
  console.log(`📊 Spreadsheet: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
  console.log('👀 Watching Firebase for changes...\n');

  const collegesRef = ref(database, 'colleges');

  // Listen for changes
  onValue(collegesRef, (snapshot) => {
    const colleges = snapshot.val();
    syncToSheets(colleges, spreadsheetId);
  });

  // Keep process alive
  setInterval(() => {
    const now = new Date();
    if (lastSyncTime) {
      const minutesSinceSync = Math.floor((now - lastSyncTime) / 1000 / 60);
      console.log(`💚 Monitor active - Last sync: ${minutesSinceSync} minutes ago`);
    }
  }, 60000); // Status update every minute

  console.log('✨ Auto-sync is now active! Press Ctrl+C to stop.\n');
}

// Main
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

if (!SPREADSHEET_ID) {
  console.log('❌ ERROR: GOOGLE_SHEET_ID not set');
  console.log('\nSet it with: set GOOGLE_SHEET_ID=your_spreadsheet_id');
  process.exit(1);
}

startAutoSync(SPREADSHEET_ID).catch(console.error);
