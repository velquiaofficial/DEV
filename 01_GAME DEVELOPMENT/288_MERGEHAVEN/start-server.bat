@echo off
cd /d "%~dp0"
echo Starting 288_MERGEBAY on port 5388 ...
set PORT=5388
set VQ_OPEN=1
node server.js
pause
