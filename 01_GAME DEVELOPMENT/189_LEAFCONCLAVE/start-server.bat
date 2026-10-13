@echo off
cd /d "%~dp0"
echo Starting 189_LEAFCLASH on port 5289 ...
set PORT=5289
set VQ_OPEN=1
node server.js
pause
