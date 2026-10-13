@echo off
cd /d "%~dp0"
echo Starting 281_ANSWERPAD on port 5381 ...
set PORT=5381
set VQ_OPEN=1
node server.js
pause
