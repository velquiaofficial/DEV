@echo off
cd /d "%~dp0"
echo Starting 152_CANDYCASTLE on port 5252 ...
set PORT=5252
set VQ_OPEN=1
node server.js
pause
