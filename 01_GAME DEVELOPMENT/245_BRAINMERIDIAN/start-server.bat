@echo off
cd /d "%~dp0"
echo Starting 245_BRAINLINE on port 5345 ...
set PORT=5345
set VQ_OPEN=1
node server.js
pause
