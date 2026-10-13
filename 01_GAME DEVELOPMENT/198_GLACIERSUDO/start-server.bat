@echo off
cd /d "%~dp0"
echo Starting 198_ICESUDO on port 5298 ...
set PORT=5298
set VQ_OPEN=1
node server.js
pause
