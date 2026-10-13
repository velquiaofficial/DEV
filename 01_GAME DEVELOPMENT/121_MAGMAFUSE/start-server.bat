@echo off
cd /d "%~dp0"
echo Starting 121_BLOCKFUSE on port 5221 ...
set PORT=5221
set VQ_OPEN=1
node server.js
pause
