@echo off
REM Automatic Daily Backup Script for College Connect
REM This script runs the backup and logs the results

cd C:\Users\Pc\Downloads\college-connect-app

echo ================================================
echo College Connect - Automatic Backup
echo Started: %date% %time%
echo ================================================

REM Run the backup
call npm run backup

echo ================================================
echo Backup completed: %date% %time%
echo ================================================
