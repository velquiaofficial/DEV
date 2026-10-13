@echo off
cd /d "%~dp0"
echo Starting 23_EXPENSE_BUDGET on port 5623 ...
set PORT=5623
set VQ_OPEN=1
node server.js
pause
