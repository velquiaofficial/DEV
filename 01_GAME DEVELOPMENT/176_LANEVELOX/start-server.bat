@echo off
cd /d "%~dp0"
echo Starting 176_LANEDASH on port 5276 ...
set PORT=5276
set VQ_OPEN=1
node server.js
pause
