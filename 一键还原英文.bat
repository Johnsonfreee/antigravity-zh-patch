@echo off
title Antigravity 还原英文官方原版
echo ====================================================
echo           Antigravity 官方英文原版还原程序
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

echo 正在检查 Antigravity 是否在后台运行...
tasklist /fi "imagename eq Antigravity.exe" | findstr /i "Antigravity.exe" >nul
if not errorlevel 1 goto RUNNING
goto NEXT_STEP

:RUNNING
echo [提示] 检测到 Antigravity 正在运行或在系统托盘常驻。
echo 正在自动安全退出所有残留的 Antigravity 进程...
taskkill /f /im Antigravity.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo [完成] 后台进程已完全清理。

:NEXT_STEP
echo.
echo 正在关闭自动汉化启动项...
node "%~dp0setup-autostart.mjs" disable >nul 2>&1

echo 正在还原官方原版英文文件...
node "%~dp0revert-antigravity-zh.mjs" %*

echo.
if errorlevel 1 goto ERROR
goto SUCCESS

:ERROR
echo [错误] 还原失败，请检查上方报错信息。
goto END

:SUCCESS
echo ====================================================
echo [成功] 已关闭自动汉化并成功还原为官方纯净英文版！
echo 现在您可以重新打开 Antigravity 桌面端。
echo ====================================================

:END
echo.
pause
