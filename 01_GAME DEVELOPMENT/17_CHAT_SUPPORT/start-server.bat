@echo off
cd /d "%~dp0"
echo Starting 17_CHAT_SUPPORT on port 5617 ...
set PORT=5617
set VQ_OPEN=1
node server.js
pause
