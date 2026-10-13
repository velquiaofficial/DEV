@echo off
cd /d "%~dp0"
echo Starting 105_LILYPAD on port 5205 ...
set PORT=5205
set VQ_OPEN=1
node server.js
pause
