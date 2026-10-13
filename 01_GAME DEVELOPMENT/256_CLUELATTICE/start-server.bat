@echo off
cd /d "%~dp0"
echo Starting 256_CLUEGRID on port 5356 ...
set PORT=5356
set VQ_OPEN=1
node server.js
pause
