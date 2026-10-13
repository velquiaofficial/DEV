@echo off
cd /d "%~dp0"
echo Starting 79_SCHOOL_UNIT on port 5679 ...
set PORT=5679
set VQ_OPEN=1
node server.js
pause
