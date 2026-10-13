@echo off
cd /d "%~dp0"
echo Starting 296_GRIDMIND on port 5396 ...
set PORT=5396
set VQ_OPEN=1
node server.js
pause
