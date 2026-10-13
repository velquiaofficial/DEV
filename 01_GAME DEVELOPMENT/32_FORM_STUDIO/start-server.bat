@echo off
cd /d "%~dp0"
echo Starting 32_FORM_STUDIO on port 5632 ...
set PORT=5632
set VQ_OPEN=1
node server.js
pause
