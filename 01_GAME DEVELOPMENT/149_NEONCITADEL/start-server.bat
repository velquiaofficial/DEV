@echo off
cd /d "%~dp0"
echo Starting 149_NEONGRID on port 5249 ...
set PORT=5249
set VQ_OPEN=1
node server.js
pause
