@echo off
cd /d "%~dp0"
echo Starting 306_RUSHDOCK on port 5406 ...
set PORT=5406
set VQ_OPEN=1
node server.js
pause
