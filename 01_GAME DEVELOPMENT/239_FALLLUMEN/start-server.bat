@echo off
cd /d "%~dp0"
echo Starting 239_FALLGLOW on port 5339 ...
set PORT=5339
set VQ_OPEN=1
node server.js
pause
