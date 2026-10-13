@echo off
cd /d "%~dp0"
echo Starting 309_GROWDOCK on port 5409 ...
set PORT=5409
set VQ_OPEN=1
node server.js
pause
