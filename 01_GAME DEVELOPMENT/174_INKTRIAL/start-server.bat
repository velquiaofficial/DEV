@echo off
cd /d "%~dp0"
echo Starting 174_INKTEST on port 5274 ...
set PORT=5274
set VQ_OPEN=1
node server.js
pause
