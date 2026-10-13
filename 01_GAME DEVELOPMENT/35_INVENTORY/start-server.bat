@echo off
cd /d "%~dp0"
echo Starting 35_INVENTORY on port 5635 ...
set PORT=5635
set VQ_OPEN=1
node server.js
pause
