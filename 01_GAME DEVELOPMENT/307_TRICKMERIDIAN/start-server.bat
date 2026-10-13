@echo off
cd /d "%~dp0"
echo Starting 307_TRICKLANE on port 5407 ...
set PORT=5407
set VQ_OPEN=1
node server.js
pause
