@echo off
cd /d "%~dp0"
echo Starting 229_AUTOVINE on port 5329 ...
set PORT=5329
set VQ_OPEN=1
node server.js
pause
