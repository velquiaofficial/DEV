@echo off
cd /d "%~dp0"
echo Starting 133_INKPRESS on port 5233 ...
set PORT=5233
set VQ_OPEN=1
node server.js
pause
