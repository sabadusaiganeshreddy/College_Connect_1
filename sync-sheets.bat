@echo off
REM Google Sheets Auto-Sync for College Connect
REM Run this script to keep Google Sheets synced with Firebase

cd /d C:\Users\Pc\Downloads\college-connect-app

REM Set your spreadsheet ID here
set GOOGLE_SHEET_ID=YOUR_SPREADSHEET_ID_HERE

REM Check if credentials exist
if not exist google-credentials.json (
    echo ❌ ERROR: google-credentials.json not found!
    echo.
    echo Please follow setup instructions in GOOGLE-SHEETS-SETUP.md
    pause
    exit /b 1
)

REM Check if spreadsheet ID is set
if "%GOOGLE_SHEET_ID%"=="YOUR_SPREADSHEET_ID_HERE" (
    echo ❌ ERROR: GOOGLE_SHEET_ID not set!
    echo.
    echo Edit this file and replace YOUR_SPREADSHEET_ID_HERE with your actual spreadsheet ID
    echo Or set environment variable: set GOOGLE_SHEET_ID=your_id
    pause
    exit /b 1
)

echo 📊 Starting Google Sheets auto-sync...
echo 🔗 Spreadsheet: https://docs.google.com/spreadsheets/d/%GOOGLE_SHEET_ID%
echo.

call npm run sync:sheets:auto

pause
