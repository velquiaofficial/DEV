@echo off
cd /d "%~dp0"
echo Starting 93_PROMPT_LAB on port 5693 ...
set PORT=5693
set VQ_OPEN=1
node server.js
pause
