@echo off
cd /d "%~dp0"
echo Starting 94_EVAL_SET on port 5694 ...
set PORT=5694
set VQ_OPEN=1
node server.js
pause
