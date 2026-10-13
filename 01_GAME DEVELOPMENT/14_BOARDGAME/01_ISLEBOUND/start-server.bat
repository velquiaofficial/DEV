@echo off
cd /d "%~dp0"
echo Starting 01_ISLEBOUND on port 6139 ...
set PORT=6139
set VQ_OPEN=1
node server.js
pause
