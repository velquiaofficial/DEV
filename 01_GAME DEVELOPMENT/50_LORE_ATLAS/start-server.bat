@echo off
cd /d "%~dp0"
echo Starting 50_LORE_ATLAS on port 5650 ...
set PORT=5650
set VQ_OPEN=1
node server.js
pause
