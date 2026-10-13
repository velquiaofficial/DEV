@echo off
cd /d "%~dp0"
echo Starting 156_WORDVEIL on port 5256 ...
set PORT=5256
set VQ_OPEN=1
node server.js
pause
