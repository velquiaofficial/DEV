@echo off
cd /d "%~dp0"
echo Starting 233_QUIZBEAM on port 5333 ...
set PORT=5333
set VQ_OPEN=1
node server.js
pause
