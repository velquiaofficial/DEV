@echo off
cd /d "%~dp0"
echo Starting 207_BERRYGRID on port 5307 ...
set PORT=5307
set VQ_OPEN=1
node server.js
pause
