@echo off
cd /d "%~dp0"
echo Starting 39_ONBOARDING on port 5639 ...
set PORT=5639
set VQ_OPEN=1
node server.js
pause
