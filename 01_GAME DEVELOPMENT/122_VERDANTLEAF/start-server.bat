@echo off
cd /d "%~dp0"
echo Starting 122_LEAFADD on port 5222 ...
set PORT=5222
set VQ_OPEN=1
node server.js
pause
