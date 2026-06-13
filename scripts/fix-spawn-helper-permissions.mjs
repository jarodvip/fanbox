#!/usr/bin/env node
// scripts/fix-spawn-helper-permissions.mjs
// node-pty 的 prebuild 在发布时未设置 spawn-helper 的执行权限，导致 macOS 上 pty.fork 报 "posix_spawnp failed"。
// 此脚本在 npm install 后自动修复。

import { chmodSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

const NP_ROOT = join(import.meta.dirname, "..", "node_modules", "node-pty");

if (!existsSync(NP_ROOT)) {
  console.log("node-pty not installed, skipping spawn-helper permission fix");
  process.exit(0);
}

const prebuildsDir = join(NP_ROOT, "prebuilds");
let fixed = 0;

for (const platform of readdirSync(prebuildsDir)) {
  const platformDir = join(prebuildsDir, platform);
  if (!readdirSync(platformDir).includes("spawn-helper")) continue;

  const helperPath = join(platformDir, "spawn-helper");
  if (existsSync(helperPath)) {
    const stats = statSync(helperPath);
    if ((stats.mode & 0o111) === 0) {
      chmodSync(helperPath, 0o755);
      fixed++;
    }
  }
}

if (fixed) console.log(`Fixed spawn-helper permissions on ${fixed} platform(s)`);
