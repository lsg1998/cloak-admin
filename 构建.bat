@echo off
chcp 65001 >nul

echo 开始构建...

REM 清理旧构建
if exist "dist" (
    echo 清理旧构建产物...
    rmdir /s /q dist
)

REM 直接使用vite构建，跳过TypeScript检查
echo 正在构建（跳过TypeScript检查）...
call npx vite build --mode production --logLevel error

if errorlevel 1 (
    echo 构建失败
    pause
    exit /b 1
)

if exist "dist" (
    echo.
    echo ========================================
    echo 构建成功！
    echo 构建产物: dist/
    echo ========================================
) else (
    echo 构建失败，未找到dist目录
    pause
    exit /b 1
)

pause
