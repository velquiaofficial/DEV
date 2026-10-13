@echo off
cd /d "%~dp0"
echo Starting 108_FLAPGLIDE on port 5208 ...
set PORT=5208
set VQ_OPEN=1
node server.js
pause
