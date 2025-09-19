@echo off
echo Starting Roven Global Server...
echo.

REM Check if port 5000 is available
echo Checking port 5000...
netstat -an | findstr ":5000" >nul
if %errorlevel% == 0 (
    echo Port 5000 is busy. Attempting to free it...
    call npm run port:kill
    echo.
)

REM Start the server
echo Starting server...
call npm start

pause
