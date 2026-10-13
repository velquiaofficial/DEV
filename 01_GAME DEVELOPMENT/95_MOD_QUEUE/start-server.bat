@echo off
cd /d "%~dp0"
echo Starting 95_MOD_QUEUE on port 5695 ...
set PORT=5695
set VQ_OPEN=1
node server.js
pause
