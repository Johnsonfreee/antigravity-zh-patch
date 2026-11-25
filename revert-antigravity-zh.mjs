#!/usr/bin/env node
/**
 * Antigravity Simplified Chinese Localization Reverter
 * 一键还原为官方原版脚本
 */

import fs from 'fs';
import { resolveAntigravityPaths } from './locate-antigravity.mjs';

const { installDir, asarPath, origPath } = resolveAntigravityPaths(process.argv.slice(2));

console.log('=== Antigravity 还原官方英文原版 ===');
console.log('安装目录:', installDir);

if (!fs.existsSync(origPath)) {
  console.error('[错误] 未找到原始备份文件: ' + origPath);
  console.error('无法自动还原（如尚未应用过本汉化补丁，当前即为原版）。');
  process.exit(1);
}

try {
  fs.copyFileSync(origPath, asarPath);
  console.log('[成功] 已从 app.asar.orig 还原 app.asar。');
  console.log('请完全退出 Antigravity 并重新启动，即可恢复官方英文界面。');
} catch (err) {
  if (err.code === 'EBUSY' || err.code === 'EPERM' || err.code === 'EACCES') {
    console.error('\n[错误] app.asar 被正在运行的 Antigravity 锁定或权限不足！');
    console.error('请完全退出 Antigravity（若安装在 Program Files 下请使用管理员权限运行）后再次运行此脚本。');
    process.exit(1);
  }
  console.error('还原失败:', err);
  process.exit(1);
}
