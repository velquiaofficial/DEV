@echo off
cd /d "%~dp0"
echo Starting 59_VOICE_CAST on port 5659 ...
set PORT=5659
set VQ_OPEN=1
node server.js
pause
