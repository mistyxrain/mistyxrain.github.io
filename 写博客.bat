@echo off
chcp 65001 >nul
title 提灯 · 写作工具（关闭此窗口即退出）
cd /d "%~dp0"
if not exist node_modules (
  echo 第一次使用，正在安装依赖，请稍候...
  call npm install
)
node tools\editor\server.mjs
pause
