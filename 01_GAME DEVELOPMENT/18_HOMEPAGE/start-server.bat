@echo off
cd /d "%~dp0"
echo Starting 18_HOMEPAGE on port 5618 ...
set PORT=5618
set VQ_OPEN=1
node server.js
pause
