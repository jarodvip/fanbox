#!/usr/bin/env node
// scripts/build-mac.mjs — 串行构建 macOS DMG（arm64 → x64），避免并行卷名冲突

import { execSync } from "child_process";
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";

const pkgPath = join(import.meta.dirname, "..", "package.json");
const original = JSON.parse(readFileSync(pkgPath, "utf-8"));

const buildOnce = (arch) => {
  // 临时修改 target.arch 为单架构
  const macTarget = original.build.mac.target.map((t) =>
    t.target === "dmg" ? { ...t, arch: [arch] } : t,
  );
  original.build.mac.target = macTarget;
  writeFileSync(pkgPath, JSON.stringify(original, null, 2) + "\n");

  console.log(`\n>>> Building ${arch} DMG...`);
  try {
    execSync("npx electron-builder --mac", {
      stdio: "inherit",
      cwd: join(import.meta.dirname, ".."),
    });
    console.log(`✅ ${arch} DMG built successfully`);
  } catch (err) {
    console.error(`❌ ${arch} DMG build failed`);
    process.exit(1);
  }
};

try {
  // 先构建 arm64
  buildOnce("arm64");
  // 再构建 x64
  buildOnce("x64");
} finally {
  // 恢复原始配置
  original.build.mac.target = [
    {
      target: "dmg",
      arch: ["arm64", "x64"],
    },
  ];
  writeFileSync(pkgPath, JSON.stringify(original, null, 2) + "\n");
}

console.log("\n🎉 All DMGs built successfully!");
