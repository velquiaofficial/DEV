@echo off
cd /d "%~dp0"
echo Starting 114_AIRHOCK on port 5214 ...
set PORT=5214
set VQ_OPEN=1
node server.js
pause
