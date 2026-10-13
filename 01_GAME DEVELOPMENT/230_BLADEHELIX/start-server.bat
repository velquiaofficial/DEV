@echo off
cd /d "%~dp0"
echo Starting 230_BLADEORBIT on port 5330 ...
set PORT=5330
set VQ_OPEN=1
node server.js
pause
