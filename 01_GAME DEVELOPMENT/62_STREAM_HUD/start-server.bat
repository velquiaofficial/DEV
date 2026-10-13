@echo off
cd /d "%~dp0"
echo Starting 62_STREAM_HUD on port 5662 ...
set PORT=5662
set VQ_OPEN=1
node server.js
pause
