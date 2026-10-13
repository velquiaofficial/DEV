@echo off
cd /d "%~dp0"
echo Starting 275_GRABORBIT on port 5375 ...
set PORT=5375
set VQ_OPEN=1
node server.js
pause
