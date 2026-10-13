@echo off
cd /d "%~dp0"
echo Starting 264_FOLDCORE on port 5364 ...
set PORT=5364
set VQ_OPEN=1
node server.js
pause
