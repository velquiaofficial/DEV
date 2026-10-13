@echo off
cd /d "%~dp0"
echo Starting 123_INKDOUBLE on port 5223 ...
set PORT=5223
set VQ_OPEN=1
node server.js
pause
