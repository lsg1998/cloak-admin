@echo off
chcp 65001 >nul

echo.
echo ==========================================
echo Frontend Build Script
echo ==========================================

REM Check package.json
if not exist "package.json" (
    echo [ERROR] package.json not found
    pause
    exit /b 1
)

REM Check Node.js
echo [STEP] Checking environment...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not installed
    pause
    exit /b 1
)

echo [INFO] Node.js version:
node --version

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not installed
    pause
    exit /b 1
)

echo [INFO] npm version:
npm --version

REM Check dependencies
echo [STEP] Checking dependencies...
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo [INFO] Dependencies exist, skipping install
)

REM Clean old build
echo [STEP] Cleaning old build...
if exist "dist" (
    echo [INFO] Removing old dist directory...
    rmdir /s /q dist
)

REM Build project
echo [STEP] Starting production build...
echo [INFO] Build command: npx vite build --mode production
echo [INFO] Start time: %time%
echo.
echo ==========================================
echo BUILD LOG START
echo ==========================================

REM Execute build with full logging
npx vite build --mode production

set BUILD_EXIT_CODE=%errorlevel%

echo ==========================================
echo BUILD LOG END
echo ==========================================
echo [INFO] End time: %time%
echo [INFO] Build exit code: %BUILD_EXIT_CODE%

if %BUILD_EXIT_CODE% neq 0 (
    echo.
    echo [ERROR] Build failed! Exit code: %BUILD_EXIT_CODE%
    echo.
    echo Common troubleshooting:
    echo 1. TypeScript errors - run: npm run type:check
    echo 2. ESLint errors - run: npm run lint:eslint
    echo 3. Dependencies issue - delete node_modules and reinstall
    echo 4. Config error - check .env.production
    echo 5. Memory issue - close other programs
    pause
    exit /b %BUILD_EXIT_CODE%
)

REM Verify build result
echo [STEP] Verifying build result...
if not exist "dist" (
    echo [ERROR] Build failed: dist directory not created
    pause
    exit /b 1
)

if not exist "dist\index.html" (
    echo [ERROR] Build failed: index.html not created
    pause
    exit /b 1
)

echo [INFO] Build verification passed

REM Count files
echo [STEP] Build statistics...
echo [INFO] Counting files...
for /f %%i in ('dir /s /b dist\*.* 2^>nul ^| find /c /v ""') do set FILE_COUNT=%%i

echo.
echo ========================================
echo BUILD SUCCESS!
echo ========================================
echo Build directory: dist\
echo Total files: %FILE_COUNT%
echo Build time: %date% %time%
echo ========================================

REM Show main files
echo.
echo [INFO] Main build files:
if exist "dist\index.html" echo - index.html
if exist "dist\assets" echo - assets\ (static resources)
if exist "dist\sw.js" echo - sw.js (Service Worker)

REM Show build output overview
echo.
echo [INFO] Build output overview:
dir dist

REM Deployment suggestions
echo.
echo [INFO] Deployment suggestions:
echo 1. Upload all files in dist\ to web server
echo 2. Configure server for SPA routing
echo 3. Enable gzip compression
echo 4. Set appropriate cache policies

REM Ask to open build directory
echo.
set /p OPEN_DIR="Open build directory? (y/n): "
if /i "%OPEN_DIR%"=="y" (
    start explorer dist
)

echo.
echo Build complete! Press any key to exit...
pause >nul