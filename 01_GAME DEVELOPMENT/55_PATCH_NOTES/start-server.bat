@echo off
cd /d "%~dp0"
echo Starting 55_PATCH_NOTES on port 5655 ...
set PORT=5655
set VQ_OPEN=1
node server.js
pause
