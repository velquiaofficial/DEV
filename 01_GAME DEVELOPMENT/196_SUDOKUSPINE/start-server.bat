@echo off
cd /d "%~dp0"
echo Starting 196_SUDOKUCORE on port 5296 ...
set PORT=5296
set VQ_OPEN=1
node server.js
pause
