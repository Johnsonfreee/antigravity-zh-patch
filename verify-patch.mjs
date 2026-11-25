#!/usr/bin/env node
/**
 * 验证已安装 Antigravity 中的 app.asar 汉化补丁完整性与语法正确性
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import vm from 'vm';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { resolveAntigravityPaths, resolveAsarPrefix } from './locate-antigravity.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { installDir, asarPath } = resolveAntigravityPaths(process.argv.slice(2));
const ASAR_CMD = resolveAsarPrefix(__dirname);

console.log('=== Antigravity 汉化补丁校验 ===');
console.log('安装目录:', installDir);
console.log('目标文件:', asarPath);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-verify-'));
try {
  execSync(`${ASAR_CMD} extract "${asarPath}" "${tempDir}"`, { stdio: 'pipe' });

  const utilsContent = fs.readFileSync(path.join(tempDir, 'dist', 'utils.js'), 'utf8');
  const preloadContent = fs.readFileSync(path.join(tempDir, 'dist', 'preload.js'), 'utf8');
  const i18nPath = path.join(tempDir, 'dist', 'i18nZh.js');
  if (!fs.existsSync(i18nPath)) {
    throw new Error('dist/i18nZh.js 不存在，汉化补丁未注入！');
  }
  execSync(`node --check "${i18nPath}"`);
  const i18nContent = fs.readFileSync(i18nPath, 'utf8');

  const utilsMatches = utilsContent.match(/const __runZhOverlay/g) || [];
  const preloadMatches = preloadContent.match(/\[antigravity-zh-preload-start\]/g) || [];
  console.log(`- utils.js __runZhOverlay 声明次数: ${utilsMatches.length}`);
  console.log(`- preload.js 注入块次数: ${preloadMatches.length}`);
  if (utilsMatches.length > 1 || preloadMatches.length !== 1) {
    throw new Error('检测到重复注入或缺少 preload 注入！');
  }

  const samples = [
    ['Permission preset', '权限预设'],
    ['This computer', '本地计算机'],
    ['Tool permissions', '工具权限'],
    ['Network access rules', '网络访问规则'],
    ['Enable notifications for agent', '启用智能体通知'],
    ['Open links in', '链接打开方式'],
    ['Your plan: Google AI Pro', '当前方案：Google AI Pro'],
    ['Conversation steps', '对话步骤'],
    ['Notification settings', '通知设置'],
    ['Color theme', '颜色主题'],
    ['Weekly limit', '每周额度'],
    ['Weekly Limit', '每周限额'],
    ['go to', 'go to']
  ];

  const textNodes = samples.map(([text]) => ({
    nodeType: 3,
    nodeValue: text,
    parentElement: { nodeType: 1, tagName: 'DIV', closest: () => null }
  }));
  const bodyEl = {
    nodeType: 1,
    tagName: 'BODY',
    attributes: [],
    getAttribute: () => null,
    childNodes: textNodes,
    children: [],
    closest: () => null
  };
  const sandbox = {
    window: {},
    document: {
      readyState: 'complete',
      documentElement: bodyEl,
      body: bodyEl,
      createTreeWalker: () => ({ nextNode: () => null }),
      addEventListener: () => {}
    },
    Element: { prototype: { attachShadow: () => ({}) } },
    NodeFilter: { SHOW_TEXT: 4 },
    MutationObserver: class { observe() {} },
    WeakMap,
    WeakSet,
    setTimeout: () => {}
  };
  sandbox.window = sandbox;
  vm.runInNewContext(i18nContent, sandbox);

  for (let i = 0; i < samples.length; i++) {
    const [src, expected] = samples[i];
    const actual = textNodes[i].nodeValue;
    if (actual !== expected) {
      throw new Error(`翻译校验失败: "${src}" => "${actual}" (期望 "${expected}")`);
    }
  }
  console.log(`✓ 校验通过：语法、注入幂等性与 ${samples.length} 项核心翻译测试全部 PASS`);
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
