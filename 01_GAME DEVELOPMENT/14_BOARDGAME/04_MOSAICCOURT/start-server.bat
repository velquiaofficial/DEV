@echo off
cd /d "%~dp0"
echo Starting 04_MOSAICCOURT on port 6882 ...
set PORT=6882
set VQ_OPEN=1
node server.js
pause
