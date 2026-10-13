@echo off
cd /d "%~dp0"
echo Starting 76_MENU_COST on port 5676 ...
set PORT=5676
set VQ_OPEN=1
node server.js
pause
