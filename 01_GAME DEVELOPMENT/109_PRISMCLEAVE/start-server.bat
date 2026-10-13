@echo off
cd /d "%~dp0"
echo Starting 109_GEMTRI on port 5209 ...
set PORT=5209
set VQ_OPEN=1
node server.js
pause
