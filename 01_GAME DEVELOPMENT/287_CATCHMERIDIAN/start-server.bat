@echo off
cd /d "%~dp0"
echo Starting 287_CATCHLINE on port 5387 ...
set PORT=5387
set VQ_OPEN=1
node server.js
pause
