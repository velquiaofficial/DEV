@echo off
cd /d "%~dp0"
echo Starting 47_ATELIER_DROP on port 5647 ...
set PORT=5647
set VQ_OPEN=1
node server.js
pause
