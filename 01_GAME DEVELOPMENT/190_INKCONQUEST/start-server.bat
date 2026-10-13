@echo off
cd /d "%~dp0"
echo Starting 190_INKWAR on port 5290 ...
set PORT=5290
set VQ_OPEN=1
node server.js
pause
