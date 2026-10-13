@echo off
cd /d "%~dp0"
echo Starting 71_AUDIT_TRAIL on port 5671 ...
set PORT=5671
set VQ_OPEN=1
node server.js
pause
