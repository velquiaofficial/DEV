@echo off
cd /d "%~dp0"
echo Starting 175_MEADOWMIND on port 5275 ...
set PORT=5275
set VQ_OPEN=1
node server.js
pause
