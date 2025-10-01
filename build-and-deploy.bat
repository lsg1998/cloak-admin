@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Vue Admin Build and Deploy Script
echo ========================================
echo.

:: Set log file path
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set LOG_FILE=build-log-%mydate%-%mytime%.log

echo Start time: %date% %time% > %LOG_FILE%
echo Start time: %date% %time%

:: Check if package.json exists
if not exist "package.json" (
    echo [ERROR] package.json not found! Please run this script in the correct project directory!
    echo [ERROR] package.json not found! >> %LOG_FILE%
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo [WARNING] node_modules not found, installing dependencies...
    echo [WARNING] node_modules not found, installing dependencies... >> %LOG_FILE%
    npm install >> %LOG_FILE% 2>&1
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to install dependencies!
        echo [ERROR] Failed to install dependencies! >> %LOG_FILE%
        pause
        exit /b 1
    )
)

:: Clean old build files
echo [INFO] Cleaning old build files...
echo [INFO] Cleaning old build files... >> %LOG_FILE%
if exist "dist" (
    rmdir /s /q "dist" >> %LOG_FILE% 2>&1
)
if exist "admin-dist" (
    rmdir /s /q "admin-dist" >> %LOG_FILE% 2>&1
)

:: Execute vite build
echo [INFO] Starting vite build...
echo [INFO] Starting vite build... >> %LOG_FILE%
echo Build command: npx vite build --mode production
echo Build command: npx vite build --mode production >> %LOG_FILE%

npx vite build --mode production >> %LOG_FILE% 2>&1

:: Check if build was successful
if !errorlevel! neq 0 (
    echo [ERROR] Vite build failed! Please check log file: %LOG_FILE%
    echo [ERROR] Vite build failed! >> %LOG_FILE%
    pause
    exit /b 1
)

:: Check if dist directory exists
if not exist "dist" (
    echo [ERROR] Build completed but dist directory not found!
    echo [ERROR] Build completed but dist directory not found! >> %LOG_FILE%
    pause
    exit /b 1
)

:: Rename dist to admin-dist
echo [INFO] Renaming dist directory to admin-dist...
echo [INFO] Renaming dist directory to admin-dist... >> %LOG_FILE%
ren "dist" "admin-dist" >> %LOG_FILE% 2>&1

if !errorlevel! neq 0 (
    echo [ERROR] Failed to rename directory!
    echo [ERROR] Failed to rename directory! >> %LOG_FILE%
    pause
    exit /b 1
)

:: Check if admin-dist directory exists
if not exist "admin-dist" (
    echo [ERROR] admin-dist directory not found after rename!
    echo [ERROR] admin-dist directory not found after rename! >> %LOG_FILE%
    pause
    exit /b 1
)

:: Git operations
echo [INFO] Starting Git operations...
echo [INFO] Starting Git operations... >> %LOG_FILE%

:: Check if it's a git repository
git status >nul 2>&1
if !errorlevel! neq 0 (
    echo [WARNING] Current directory is not a Git repository, skipping Git operations
    echo [WARNING] Current directory is not a Git repository, skipping Git operations >> %LOG_FILE%
    goto :success
)

:: Add files to git
echo [INFO] Adding files to Git...
echo [INFO] Adding files to Git... >> %LOG_FILE%
git add admin-dist >> %LOG_FILE% 2>&1

:: Commit to git
set COMMIT_MSG=feat: update frontend build files admin-dist (%date% %time%)
echo [INFO] Committing to Git: %COMMIT_MSG%
echo [INFO] Committing to Git: %COMMIT_MSG% >> %LOG_FILE%
git commit -m "%COMMIT_MSG%" >> %LOG_FILE% 2>&1

if !errorlevel! neq 0 (
    echo [WARNING] Git commit may have failed or no changes to commit, please check log
    echo [WARNING] Git commit may have failed or no changes to commit >> %LOG_FILE%
)

:success
echo.
echo ========================================
echo Build Complete!
echo ========================================
echo [SUCCESS] Vite build completed
echo [SUCCESS] Directory renamed to: admin-dist
echo [SUCCESS] Git operations completed
echo [INFO] Detailed log available at: %LOG_FILE%
echo.

echo End time: %date% %time% >> %LOG_FILE%
echo [SUCCESS] All operations completed! End time: %date% %time%

pause