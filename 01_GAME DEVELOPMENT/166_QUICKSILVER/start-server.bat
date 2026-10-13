@echo off
cd /d "%~dp0"
echo Starting 166_QUICKQUIZ on port 5266 ...
set PORT=5266
set VQ_OPEN=1
node server.js
pause
