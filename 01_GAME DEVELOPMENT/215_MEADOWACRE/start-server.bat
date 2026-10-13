@echo off
cd /d "%~dp0"
echo Starting 215_MEADOWPLOT on port 5315 ...
set PORT=5315
set VQ_OPEN=1
node server.js
pause
