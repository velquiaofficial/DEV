@echo off
cd /d "%~dp0"
echo Starting 28_REVIEW_REPLY on port 5628 ...
set PORT=5628
set VQ_OPEN=1
node server.js
pause
