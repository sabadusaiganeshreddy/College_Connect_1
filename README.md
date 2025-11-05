# 🎓 College Connect App# College Connect App



A comprehensive React application for connecting students across colleges and tracking company placements with **6-layer data protection system**.A React application for connecting students across colleges and tracking company visits.



## ✨ Features## Setup Instructions



- 👥 **Student Management**: Registration with college email, LinkedIn profiles1. **Install Node.js** (if not already installed)

- 🏫 **College Management**: Dynamic college addition and tracking   - Download from https://nodejs.org/

- 🏢 **Company Tracking**: Monitor company visits and student selections   - Install the LTS version

- 🔍 **Advanced Search**: Search across colleges, companies, and students

- 📊 **Statistics Dashboard**: Real-time counts of users, colleges, and companies2. **Install Dependencies**

- 🔐 **Multi-Layer Data Protection**: 6 independent backup systems   ```cmd

   cd C:\Users\Pc\Downloads\college-connect-app

## 🚀 Quick Start   npm install

   ```

### 1. Install Dependencies

```bash3. **Run the Development Server**

npm install   ```cmd

```   npm run dev

   ```

### 2. Configure Firebase

Create `src/firebase.ts` with your Firebase config:4. **Open in Browser**

```typescript   - The app will run at `http://localhost:5173`

import { initializeApp } from 'firebase/app';   - Open this URL in your browser

import { getDatabase } from 'firebase/database';

## Features

const firebaseConfig = {

  // Your Firebase config here- Student registration with college email

};- Add new colleges dynamically

- Track company visits to colleges

export const app = initializeApp(firebaseConfig);- Mark student selections by companies

export const database = getDatabase(app);- Search across colleges and companies

```- View student LinkedIn profiles



### 3. Run Development Server## Technologies Used

```bash

npm run dev- React 18

```- TypeScript

Open `http://localhost:5173` in your browser.- Vite

- Tailwind CSS

### 4. Build for Production

```bash
npm run build
```

## 🛡️ Data Protection System (6 Layers)

| Layer | Description | Command |
|-------|-------------|---------|
| 1️⃣ Firebase Database | Primary real-time database | Auto |
| 2️⃣ localStorage Backup | Browser-based emergency backup | Auto |
| 3️⃣ File Backups | 30-day retention local backups | `npm run backup` |
| 4️⃣ Real-Time Monitoring | Detects and prevents data loss | Auto |
| 5️⃣ Firebase Rules | Prevents unauthorized deletion | Auto |
| 6️⃣ Google Sheets Sync | Real-time spreadsheet backup | `npm run sync:sheets:auto` |

### Backup Commands
```bash
# Create manual backup
npm run backup

# Check database status
npm run check:db

# Restore from backup
npm run restore

# Sync to Google Sheets
npm run sync:sheets

# Auto-sync to Google Sheets
npm run sync:sheets:auto
```

## 📚 Documentation

- **[BACKUP-GUIDE.md](BACKUP-GUIDE.md)** - Complete backup system guide
- **[GOOGLE-SHEETS-SETUP.md](GOOGLE-SHEETS-SETUP.md)** - Google Sheets backup setup
- **[FIREBASE-SECURITY.md](FIREBASE-SECURITY.md)** - Firebase security rules

## 🔧 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Database**: Firebase Realtime Database
- **Icons**: Lucide React
- **Backup**: Node.js scripts + Google Sheets API

## 📊 Project Structure

```
college-connect-app/
├── src/
│   ├── CollegeConnect.tsx    # Main app component
│   ├── firebase.ts            # Firebase configuration
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── public/
│   └── recovery.html          # User data recovery page
├── backups/                   # Automated backups (gitignored)
├── auto-backup.mjs            # Backup automation
├── google-sheets-sync.mjs     # Google Sheets sync
├── auto-sync-sheets.mjs       # Auto Google Sheets sync
├── monitor-integrity.mjs      # Real-time monitoring
└── restore-backup.mjs         # Backup restoration
```

## 🔐 Security Features

- ✅ Write-once fields (IDs, emails can't be changed)
- ✅ Deletion prevention (no data can be deleted)
- ✅ Data validation (email format, field types)
- ✅ Catastrophic loss prevention (blocks >50% data loss)
- ✅ Emergency backups (localStorage + Google Sheets)
- ✅ Real-time monitoring (detects attacks instantly)

## 📝 License

MIT

## 👨‍💻 Author

Sai Sagar Ganteda
