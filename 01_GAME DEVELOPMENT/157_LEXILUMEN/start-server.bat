@echo off
cd /d "%~dp0"
echo Starting 157_LEXILAMP on port 5257 ...
set PORT=5257
set VQ_OPEN=1
node server.js
pause
