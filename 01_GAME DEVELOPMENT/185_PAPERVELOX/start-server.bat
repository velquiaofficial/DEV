@echo off
cd /d "%~dp0"
echo Starting 185_PAPERRACE on port 5285 ...
set PORT=5285
set VQ_OPEN=1
node server.js
pause
