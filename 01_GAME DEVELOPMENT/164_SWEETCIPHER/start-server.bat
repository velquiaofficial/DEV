@echo off
cd /d "%~dp0"
echo Starting 164_SWEETWORD on port 5264 ...
set PORT=5264
set VQ_OPEN=1
node server.js
pause
