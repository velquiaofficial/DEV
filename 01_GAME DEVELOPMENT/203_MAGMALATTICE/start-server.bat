@echo off
cd /d "%~dp0"
echo Starting 203_MAGMASUDO on port 5303 ...
set PORT=5303
set VQ_OPEN=1
node server.js
pause
