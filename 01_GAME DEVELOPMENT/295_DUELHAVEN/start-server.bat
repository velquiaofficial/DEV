@echo off
cd /d "%~dp0"
echo Starting 295_DUELPORT on port 5395 ...
set PORT=5395
set VQ_OPEN=1
node server.js
pause
