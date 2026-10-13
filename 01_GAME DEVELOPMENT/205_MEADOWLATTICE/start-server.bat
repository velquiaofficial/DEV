@echo off
cd /d "%~dp0"
echo Starting 205_MEADOWSUDO on port 5305 ...
set PORT=5305
set VQ_OPEN=1
node server.js
pause
