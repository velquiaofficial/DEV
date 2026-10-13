@echo off
cd /d "%~dp0"
echo Starting 162_SANDSCRIPT on port 5262 ...
set PORT=5262
set VQ_OPEN=1
node server.js
pause
