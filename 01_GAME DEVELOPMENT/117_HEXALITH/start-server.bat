@echo off
cd /d "%~dp0"
echo Starting 117_HEXMERGE on port 5217 ...
set PORT=5217
set VQ_OPEN=1
node server.js
pause
