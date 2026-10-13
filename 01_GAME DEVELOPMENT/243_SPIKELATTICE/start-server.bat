@echo off
cd /d "%~dp0"
echo Starting 243_SPIKEGRID on port 5343 ...
set PORT=5343
set VQ_OPEN=1
node server.js
pause
