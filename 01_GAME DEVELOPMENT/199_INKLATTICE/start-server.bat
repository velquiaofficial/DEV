@echo off
cd /d "%~dp0"
echo Starting 199_INKSUDO on port 5299 ...
set PORT=5299
set VQ_OPEN=1
node server.js
pause
