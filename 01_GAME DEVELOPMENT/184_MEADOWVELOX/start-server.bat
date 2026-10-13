@echo off
cd /d "%~dp0"
echo Starting 184_MEADOWRUSH on port 5284 ...
set PORT=5284
set VQ_OPEN=1
node server.js
pause
