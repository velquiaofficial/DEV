@echo off
cd /d "%~dp0"
echo Starting 283_ARCANEHAND on port 5383 ...
set PORT=5383
set VQ_OPEN=1
node server.js
pause
