#!/usr/bin/env node
/**
 * 将 overlay_script.raw.js 与 full_dict.json 同步到 apply-antigravity-zh.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawOverlayPath = path.join(__dirname, 'overlay_script.raw.js');
const fullDictPath = path.join(__dirname, 'full_dict.json');
const applyPath = path.join(__dirname, 'apply-antigravity-zh.mjs');

const fullDict = JSON.parse(fs.readFileSync(fullDictPath, 'utf8'));
const flatDict = {};
for (const group of Object.values(fullDict)) {
  if (group && typeof group === 'object') {
    Object.assign(flatDict, group);
  }
}

let rawOverlay = fs.readFileSync(rawOverlayPath, 'utf8');
const dictMatch = rawOverlay.match(/const DICTIONARY = ({[\s\S]*?});/);
if (!dictMatch) {
  throw new Error('无法在 overlay_script.raw.js 中定位 DICTIONARY');
}
const existingDict = JSON.parse(dictMatch[1]);
const mergedDict = { ...existingDict, ...flatDict };
rawOverlay = rawOverlay.replace(
  /const DICTIONARY = {[\s\S]*?};/,
  'const DICTIONARY = ' + JSON.stringify(mergedDict) + ';'
);
fs.writeFileSync(rawOverlayPath, rawOverlay, 'utf8');

let applyScript = fs.readFileSync(applyPath, 'utf8');
const startTag = 'const OVERLAY_CODE = ';
const endTag = ';\n/* [OVERLAY_CODE_END] */';
const startIdx = applyScript.indexOf(startTag);
const endIdx = applyScript.indexOf(endTag, startIdx);
if (startIdx === -1 || endIdx === -1) {
  throw new Error('无法在 apply-antigravity-zh.mjs 中定位 OVERLAY_CODE 标记');
}
applyScript =
  applyScript.slice(0, startIdx + startTag.length) +
  JSON.stringify(rawOverlay) +
  applyScript.slice(endIdx);

fs.writeFileSync(applyPath, applyScript, 'utf8');
console.log(`✓ 已同步 OVERLAY_CODE 到 apply-antigravity-zh.mjs（总词条: ${Object.keys(mergedDict).length}）`);
