@echo off
cd /d "%~dp0"
echo Starting 208_FROSTFARM on port 5308 ...
set PORT=5308
set VQ_OPEN=1
node server.js
pause
