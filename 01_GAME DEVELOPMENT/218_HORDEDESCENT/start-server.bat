@echo off
cd /d "%~dp0"
echo Starting 218_HORDEFALL on port 5318 ...
set PORT=5318
set VQ_OPEN=1
node server.js
pause
