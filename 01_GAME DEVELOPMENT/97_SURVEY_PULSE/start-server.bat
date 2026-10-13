@echo off
cd /d "%~dp0"
echo Starting 97_SURVEY_PULSE on port 5697 ...
set PORT=5697
set VQ_OPEN=1
node server.js
pause
