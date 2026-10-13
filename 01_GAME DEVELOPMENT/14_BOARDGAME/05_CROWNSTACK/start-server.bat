@echo off
cd /d "%~dp0"
echo Starting 05_CROWNSTACK on port 6489 ...
set PORT=6489
set VQ_OPEN=1
node server.js
pause
