@echo off
cd /d "%~dp0"
echo Starting 64_MERCH_SPEC on port 5664 ...
set PORT=5664
set VQ_OPEN=1
node server.js
pause
