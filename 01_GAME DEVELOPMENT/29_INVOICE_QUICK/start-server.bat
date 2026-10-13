@echo off
cd /d "%~dp0"
echo Starting 29_INVOICE_QUICK on port 5629 ...
set PORT=5629
set VQ_OPEN=1
node server.js
pause
