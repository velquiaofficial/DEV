@echo off
cd /d "%~dp0"
echo Starting 178_EMBERDASH on port 5278 ...
set PORT=5278
set VQ_OPEN=1
node server.js
pause
