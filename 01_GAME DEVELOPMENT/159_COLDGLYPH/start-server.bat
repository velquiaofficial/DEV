@echo off
cd /d "%~dp0"
echo Starting 159_COLDTYPE on port 5259 ...
set PORT=5259
set VQ_OPEN=1
node server.js
pause
