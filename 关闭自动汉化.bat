@echo off
title Antigravity 关闭自动汉化
echo ====================================================
echo              Antigravity 关闭自动汉化
echo ====================================================
echo.
where node >nul 2>&1
if errorlevel 1 (
  echo [错误] 未检测到 Node.js 运行环境。
  echo 请先前往 https://nodejs.org/ 下载安装 Node.js ^(建议 LTS 版本^) 后重试。
  echo.
  pause
  exit /b 1
)

node "%~dp0setup-autostart.mjs" disable %*
echo.
pause
