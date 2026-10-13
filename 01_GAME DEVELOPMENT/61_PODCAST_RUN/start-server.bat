@echo off
cd /d "%~dp0"
echo Starting 61_PODCAST_RUN on port 5661 ...
set PORT=5661
set VQ_OPEN=1
node server.js
pause
