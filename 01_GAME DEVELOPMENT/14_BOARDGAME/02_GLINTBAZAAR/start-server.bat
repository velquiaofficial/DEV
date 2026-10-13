@echo off
cd /d "%~dp0"
echo Starting 02_GLINTBAZAAR on port 6566 ...
set PORT=6566
set VQ_OPEN=1
node server.js
pause
