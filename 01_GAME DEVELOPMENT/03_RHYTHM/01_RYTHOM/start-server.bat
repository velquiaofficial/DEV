@echo off
cd /d "%~dp0"
echo Starting 01_RYTHOM on port 6417 ...
set PORT=6417
set VQ_OPEN=1
node server.js
pause
