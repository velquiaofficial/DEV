@echo off
cd /d "%~dp0"
echo Starting 143_MEADOWMAY on port 5243 ...
set PORT=5243
set VQ_OPEN=1
node server.js
pause
