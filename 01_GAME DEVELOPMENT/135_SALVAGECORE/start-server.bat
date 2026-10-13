@echo off
cd /d "%~dp0"
echo Starting 135_SCRAPYARD on port 5235 ...
set PORT=5235
set VQ_OPEN=1
node server.js
pause
