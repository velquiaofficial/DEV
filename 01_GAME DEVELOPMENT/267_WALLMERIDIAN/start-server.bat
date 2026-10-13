@echo off
cd /d "%~dp0"
echo Starting 267_WALLPULSE on port 5367 ...
set PORT=5367
set VQ_OPEN=1
node server.js
pause
