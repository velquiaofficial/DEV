@echo off
cd /d "%~dp0"
echo Starting 48_TABLE_FORGE on port 5648 ...
set PORT=5648
set VQ_OPEN=1
node server.js
pause
