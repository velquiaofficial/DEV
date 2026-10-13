@echo off
cd /d "%~dp0"
echo Starting 70_POLICY_DRAFT on port 5670 ...
set PORT=5670
set VQ_OPEN=1
node server.js
pause
