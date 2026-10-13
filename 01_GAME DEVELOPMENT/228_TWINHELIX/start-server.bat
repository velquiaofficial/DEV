@echo off
cd /d "%~dp0"
echo Starting 228_TWINCELL on port 5328 ...
set PORT=5328
set VQ_OPEN=1
node server.js
pause
