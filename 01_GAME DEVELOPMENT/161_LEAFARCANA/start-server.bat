@echo off
cd /d "%~dp0"
echo Starting 161_LEAFSPELL on port 5261 ...
set PORT=5261
set VQ_OPEN=1
node server.js
pause
