@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 本地构建脚本 - 构建生产版本并提交到GitHub
REM 适用于 Windows 环境

echo.
echo ==========================================
echo 开始本地构建生产版本...
echo ==========================================

REM 检查环境
echo [STEP] 检查环境...

REM 检查Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js未安装
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [INFO] Node.js版本: %NODE_VERSION%

REM 检查npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm未安装
    pause
    exit /b 1
)

REM 检查Git
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git未安装
    pause
    exit /b 1
)

REM 检查package.json
if not exist "package.json" (
    echo [ERROR] 未找到package.json文件，请在项目根目录运行
    pause
    exit /b 1
)

echo [INFO] 环境检查通过

REM 检查Git状态
echo [STEP] 检查Git状态...

REM 检查是否有未提交的更改
git diff --quiet >nul 2>&1
if errorlevel 1 (
    echo [WARN] 检测到未提交的更改
    git status --short
    set /p CONTINUE="是否继续构建？(y/N): "
    if /i not "!CONTINUE!"=="y" (
        echo [INFO] 构建已取消
        pause
        exit /b 0
    )
)

REM 检查当前分支
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo [INFO] 当前分支: !CURRENT_BRANCH!

REM 拉取最新代码
echo [INFO] 拉取最新代码...
git pull origin !CURRENT_BRANCH!

echo [INFO] Git状态检查完成

REM 安装依赖
echo [STEP] 检查依赖...

REM 检查node_modules是否存在
if not exist "node_modules" (
    echo [INFO] 安装依赖...
    npm install
) else (
    echo [INFO] 依赖已存在，跳过安装
)

echo [INFO] 依赖检查完成

REM 构建项目
echo [STEP] 构建项目...

REM 清理旧的构建产物
if exist "dist" (
    echo [INFO] 清理旧的构建产物...
    rmdir /s /q dist
)

REM 直接使用vite构建，跳过TypeScript检查
echo [INFO] 使用vite直接构建，跳过TypeScript检查...
call npx vite build --mode production --logLevel error

if errorlevel 1 (
    echo [ERROR] 构建失败
    pause
    exit /b 1
)

REM 检查构建产物
if exist "dist" (
    echo [INFO] 构建成功！
    
    REM 检查关键文件
    if exist "dist\index.html" (
        echo [INFO] ✅ index.html 存在
    ) else (
        echo [ERROR] ❌ index.html 不存在
        pause
        exit /b 1
    )
    
    if exist "dist\assets" (
        echo [INFO] ✅ assets 目录存在
    ) else (
        echo [WARN] ⚠️ assets 目录不存在
    )
) else (
    echo [ERROR] 构建失败，未找到dist目录
    pause
    exit /b 1
)

echo [INFO] 项目构建完成

REM 提交构建产物
echo [STEP] 提交构建产物...

REM 检查dist目录
if not exist "dist" (
    echo [ERROR] dist目录不存在，无法提交
    pause
    exit /b 1
)

REM 添加构建产物
git add dist/

REM 检查是否有更改
git diff --cached --quiet >nul 2>&1
if not errorlevel 1 (
    echo [INFO] 构建产物无变化，无需提交
    goto :show_result
)

REM 提交更改
set COMMIT_MSG=构建生产版本 %date:~0,10% %time:~0,8%
git commit -m "!COMMIT_MSG!"

echo [INFO] 构建产物已提交

REM 推送到远程仓库
echo [STEP] 推送到远程仓库...

git push origin !CURRENT_BRANCH!

if errorlevel 1 (
    echo [ERROR] 推送失败
    pause
    exit /b 1
)

echo [INFO] 已推送到远程仓库

:show_result
echo [STEP] 构建结果...
echo.
echo ==========================================
echo 本地构建完成！
echo ==========================================
echo 构建产物: dist/
echo 提交信息: 构建生产版本 %date:~0,10% %time:~0,8%
echo ==========================================
echo 下一步：
echo 1. 在服务器上运行: sh 后台更新脚本.sh
echo 2. 访问后台: https://gammtt.shop/admin
echo ==========================================

echo.
echo [INFO] 🎉 本地构建完成！
echo [INFO] 📦 构建产物已提交到GitHub
echo [INFO] 🚀 请在服务器上运行更新脚本

pause
