@echo off
cd /d "%~dp0"
echo Starting 106_PADDLEDUEL on port 5206 ...
set PORT=5206
set VQ_OPEN=1
node server.js
pause
