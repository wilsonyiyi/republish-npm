/**
 * npm 操作模块
 */

const fs = require("fs");
const path = require("path");
const tar = require("tar");
const { log, warn } = require("../utils/logger");
const { startLoading } = require("../utils/loader");
const { run } = require("../utils/runner");

function npmArgsWithRegistry(baseArgs, registry) {
  if (registry) return baseArgs.concat(["--registry", registry]);
  return baseArgs; // 不传则用 npm 默认配置
}

function ensureNpmAuth() {
  log("🔐 检查 npm 认证状态...");
  try {
    const username = run("npm", ["whoami"]);
    log("✓ 已登录用户：" + username);
  } catch (_) {
    warn(
      "`npm whoami` 失败。请确认已登录（npm login）并有目标 scope 的发布权限。"
    );
  }
}

function getAllVersions(pkg, registry) {
  const loader = startLoading("正在获取包 " + pkg + " 的历史版本列表...");
  try {
    const out = run(
      "npm",
      npmArgsWithRegistry(["view", pkg, "versions", "--json"], registry)
    );
    var versions = [];
    try {
      var parsed = JSON.parse(out);
      versions = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      if (out) versions = [out.replace(/"/g, "").trim()];
    }
    loader.stop("找到 " + versions.length + " 个历史版本");
    return versions;
  } catch (e) {
    loader.fail("获取版本列表失败");
    throw e;
  }
}

function packOneVersion(tmpDir, fromName, version, registry) {
  const loader = startLoading("下载版本 " + version + "...");
  try {
    const args = npmArgsWithRegistry(
      ["pack", fromName + "@" + version],
      registry
    );
    const out = run("npm", args, { cwd: tmpDir });
    const lines = out.split("\n");
    const tgzName = lines[lines.length - 1].trim();
    const absPath = path.join(tmpDir, tgzName);
    if (!fs.existsSync(absPath))
      throw new Error("未找到 pack 产物：" + absPath);
    loader.stop("已下载：" + tgzName);
    return absPath;
  } catch (e) {
    loader.fail("下载失败");
    throw e;
  }
}

function extractToReadyDir(tgzPath, workRoot) {
  const loader = startLoading("解压包文件...");
  try {
    const folderName = path.basename(tgzPath, ".tgz");
    const dest = path.join(workRoot, folderName);
    fs.mkdirSync(dest, { recursive: true });
    tar.x({ file: tgzPath, cwd: dest, sync: true });
    const pkgDir = path.join(dest, "package");
    if (!fs.existsSync(pkgDir))
      throw new Error("解压结构异常，未找到目录：" + pkgDir);
    loader.stop("解压完成");
    return pkgDir;
  } catch (e) {
    loader.fail("解压失败");
    throw e;
  }
}

function publishOne(pkgDir, opts) {
  const args = ["publish", "--access", opts.access];
  if (opts.tag) args.push("--tag", opts.tag);
  const finalArgs = npmArgsWithRegistry(args, opts.registry);
  if (opts.dryRun) {
    log("  🔍 [dry-run] npm " + finalArgs.join(" ") + " (cwd: " + pkgDir + ")");
    return;
  }
  const loader = startLoading("发布到 npm registry...");
  try {
    run("npm", finalArgs, { cwd: pkgDir });
    loader.stop("发布成功");
  } catch (e) {
    loader.fail("发布失败");
    throw e;
  }
}

module.exports = {
  npmArgsWithRegistry,
  ensureNpmAuth,
  getAllVersions,
  packOneVersion,
  extractToReadyDir,
  publishOne,
};

