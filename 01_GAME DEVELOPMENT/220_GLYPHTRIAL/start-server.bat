@echo off
cd /d "%~dp0"
echo Starting 220_GLYPHTRY on port 5320 ...
set PORT=5320
set VQ_OPEN=1
node server.js
pause
