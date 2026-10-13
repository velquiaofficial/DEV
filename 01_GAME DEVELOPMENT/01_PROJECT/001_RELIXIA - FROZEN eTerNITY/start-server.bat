@echo off
cd /d "%~dp0"
echo Starting RELIXIA on port 5101 ...
set PORT=5101
set VQ_OPEN=1
node vq-server.js
pause

