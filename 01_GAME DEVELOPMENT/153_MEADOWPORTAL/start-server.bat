@echo off
cd /d "%~dp0"
echo Starting 153_MEADOWGATE on port 5253 ...
set PORT=5253
set VQ_OPEN=1
node server.js
pause
