@echo off
cd /d "%~dp0"
echo Starting 24_BOOKING_CRM on port 5624 ...
set PORT=5624
set VQ_OPEN=1
node server.js
pause
