@echo off
cd /d "%~dp0"
echo Starting 96_AMBASSADOR on port 5696 ...
set PORT=5696
set VQ_OPEN=1
node server.js
pause
