@echo off
cd /d "%~dp0"
echo Starting 255_KEEPFIRE on port 5355 ...
set PORT=5355
set VQ_OPEN=1
node server.js
pause
