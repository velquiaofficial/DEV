@echo off
cd /d "%~dp0"
echo Starting 197_NIGHTSUDO on port 5297 ...
set PORT=5297
set VQ_OPEN=1
node server.js
pause
