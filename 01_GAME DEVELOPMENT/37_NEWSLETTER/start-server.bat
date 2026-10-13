@echo off
cd /d "%~dp0"
echo Starting 37_NEWSLETTER on port 5637 ...
set PORT=5637
set VQ_OPEN=1
node server.js
pause
