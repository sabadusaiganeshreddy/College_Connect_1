import { google } from 'googleapis';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
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

// Google Sheets Authentication
async function getGoogleSheetsClient() {
  try {
    // Load credentials from file (you'll need to create this)
    const credentials = JSON.parse(readFileSync('./google-credentials.json', 'utf8'));
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    
    return sheets;
  } catch (error) {
    console.error('❌ Failed to authenticate with Google Sheets:', error.message);
    console.log('\n📋 SETUP REQUIRED:');
    console.log('1. Go to https://console.cloud.google.com/');
    console.log('2. Create a new project or select existing');
    console.log('3. Enable Google Sheets API');
    console.log('4. Create Service Account credentials');
    console.log('5. Download JSON key and save as google-credentials.json');
    console.log('6. Share your Google Sheet with the service account email');
    throw error;
  }
}

// Sync Firebase data to Google Sheets
async function syncToGoogleSheets(spreadsheetId) {
  try {
    console.log('📊 Starting sync to Google Sheets...\n');

    // Get Firebase data
    const collegesRef = ref(database, 'colleges');
    const snapshot = await get(collegesRef);
    const colleges = snapshot.val() || {};

    console.log('✅ Retrieved data from Firebase');

    // Get Google Sheets client
    const sheets = await getGoogleSheetsClient();

    // Prepare Students sheet data
    const studentsData = [
      ['Student ID', 'Name', 'Email', 'LinkedIn', 'College Domain', 'College Name', 'Registered At', 'Selections Count', 'Last Updated']
    ];

    // Prepare Colleges sheet data
    const collegesData = [
      ['College Domain', 'College Name', 'Total Students', 'Total Companies', 'Created At', 'Last Updated']
    ];

    // Prepare Companies sheet data
    const companiesData = [
      ['Company ID', 'Company Name', 'College Domain', 'Added By Student', 'Visit Date', 'Total Selections', 'Job Roles', 'Added At', 'Last Updated']
    ];

    const timestamp = new Date().toISOString();

    // Process all colleges
    for (const [collegeKey, college] of Object.entries(colleges)) {
      // Add college to colleges sheet
      collegesData.push([
        college.domain || '',
        college.name || '',
        college.students?.length || 0,
        college.companies?.length || 0,
        college.createdAt || '',
        timestamp
      ]);

      // Add students to students sheet
      if (college.students) {
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

      // Add companies to companies sheet
      if (college.companies) {
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

    console.log(`📝 Prepared ${studentsData.length - 1} students`);
    console.log(`📝 Prepared ${collegesData.length - 1} colleges`);
    console.log(`📝 Prepared ${companiesData.length - 1} companies\n`);

    // Get spreadsheet metadata to find sheet IDs
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetsList = spreadsheet.data.sheets;
    
    console.log('📋 Found sheets:', sheetsList.map(s => s.properties.title).join(', '));

    // Find sheet IDs by name
    const getSheetId = (name) => {
      const sheet = sheetsList.find(s => s.properties.title === name);
      return sheet ? sheet.properties.sheetId : null;
    };

    const studentsSheetId = getSheetId('Students');
    const collegesSheetId = getSheetId('Colleges');
    const companiesSheetId = getSheetId('Companies');
    const auditSheetId = getSheetId('Audit Log');

    // Write data to sheets
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      resource: {
        valueInputOption: 'RAW',
        data: [
          {
            range: 'Students!A1',
            values: studentsData
          },
          {
            range: 'Colleges!A1',
            values: collegesData
          },
          {
            range: 'Companies!A1',
            values: companiesData
          }
        ]
      }
    });

    console.log('✅ Data written to sheets');

    // Format headers with colors - only if sheet IDs exist
    const formatRequests = [];

    if (studentsSheetId !== null) {
      formatRequests.push({
        repeatCell: {
          range: {
            sheetId: studentsSheetId,
            startRowIndex: 0,
            endRowIndex: 1
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
              textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true },
              horizontalAlignment: 'CENTER'
            }
          },
          fields: 'userEnteredFormat'
        }
      });
    }

    if (collegesSheetId !== null) {
      formatRequests.push({
        repeatCell: {
          range: {
            sheetId: collegesSheetId,
            startRowIndex: 0,
            endRowIndex: 1
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.6, blue: 0.4 },
              textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true },
              horizontalAlignment: 'CENTER'
            }
          },
          fields: 'userEnteredFormat'
        }
      });
    }

    if (companiesSheetId !== null) {
      formatRequests.push({
        repeatCell: {
          range: {
            sheetId: companiesSheetId,
            startRowIndex: 0,
            endRowIndex: 1
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.8, green: 0.4, blue: 0.2 },
              textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true },
              horizontalAlignment: 'CENTER'
            }
          },
          fields: 'userEnteredFormat'
        }
      });
    }

    if (auditSheetId !== null) {
      formatRequests.push({
        repeatCell: {
          range: {
            sheetId: auditSheetId,
            startRowIndex: 0,
            endRowIndex: 1
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.6, green: 0.2, blue: 0.8 },
              textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true },
              horizontalAlignment: 'CENTER'
            }
          },
          fields: 'userEnteredFormat'
        }
      });
    }

    if (formatRequests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: { requests: formatRequests }
      });
      console.log('✅ Applied color formatting to headers');
    }

    // Add audit log entry if sheet exists
    if (auditSheetId !== null) {
      const auditEntry = [[
        timestamp,
        '1',
        studentsData.length - 1,
        collegesData.length - 1,
        companiesData.length - 1,
        'Manual Sync'
      ]];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Audit Log!A:F',
        valueInputOption: 'RAW',
        resource: { values: auditEntry }
      });
      console.log('✅ Added audit log entry');
    }

    console.log('✅ Successfully synced to Google Sheets!');
    console.log(`🔗 View at: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
    console.log(`⏰ Last sync: ${timestamp}\n`);

    // Show statistics
    console.log('📊 Statistics:');
    console.log(`   👥 Total Students: ${studentsData.length - 1}`);
    console.log(`   🏫 Total Colleges: ${collegesData.length - 1}`);
    console.log(`   🏢 Total Companies: ${companiesData.length - 1}`);

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    throw error;
  }
}

// Main execution
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || 'YOUR_SPREADSHEET_ID_HERE';

if (SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
  console.log('❌ ERROR: Please set GOOGLE_SHEET_ID environment variable');
  console.log('\nUsage:');
  console.log('  set GOOGLE_SHEET_ID=your_spreadsheet_id');
  console.log('  npm run sync:sheets');
  console.log('\nOr create a .env file with:');
  console.log('  GOOGLE_SHEET_ID=your_spreadsheet_id');
  process.exit(1);
}

syncToGoogleSheets(SPREADSHEET_ID)
  .then(() => {
    console.log('\n✨ Sync completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Sync failed:', error);
    process.exit(1);
  });
