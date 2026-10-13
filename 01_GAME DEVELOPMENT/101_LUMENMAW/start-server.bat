@echo off
cd /d "%~dp0"
echo Starting 101_DOTMUNCH on port 5201 ...
set PORT=5201
set VQ_OPEN=1
node server.js
pause
