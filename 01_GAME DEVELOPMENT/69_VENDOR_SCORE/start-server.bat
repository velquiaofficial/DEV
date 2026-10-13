@echo off
cd /d "%~dp0"
echo Starting 69_VENDOR_SCORE on port 5669 ...
set PORT=5669
set VQ_OPEN=1
node server.js
pause
