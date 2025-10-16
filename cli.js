#!/usr/bin/env node
/**
 * republish-npm (Node >= 14.17.0)
 * 将旧包的历史版本批量改名并重新发布到新包名
 * - 支持 --registry：不传则沿用 npm 默认配置
 * - 支持 --versions v1,v2：仅处理指定版本
 * - 支持 --dry-run：演练
 * - 支持 --access (public|restricted)
 * - 支持 --tag：dist-tag
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const child = require("child_process");
const minimist = require("minimist");
const tar = require("tar");
const readline = require("readline");

function log() {
  console.log("[republish-npm]", ...arguments);
}
function warn() {
  console.warn("[republish-npm][warn]", ...arguments);
}
function err() {
  console.error("[republish-npm][error]", ...arguments);
}

// Loading 动画辅助函数
function startLoading(message) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  process.stdout.write("  " + frames[0] + " " + message);
  
  const interval = setInterval(function() {
    i = (i + 1) % frames.length;
    process.stdout.write("\r  " + frames[i] + " " + message);
  }, 80);
  
  return {
    stop: function(successMsg) {
      clearInterval(interval);
      process.stdout.write("\r  ✓ " + (successMsg || message) + "\n");
    },
    fail: function(errorMsg) {
      clearInterval(interval);
      process.stdout.write("\r  ✗ " + (errorMsg || message) + "\n");
    }
  };
}

function run(cmd, args, opts) {
  const res = child.spawnSync(
    cmd,
    args,
    Object.assign({ stdio: ["ignore", "pipe", "pipe"] }, opts)
  );
  const stdout = res.stdout ? res.stdout.toString() : "";
  const stderr = res.stderr ? res.stderr.toString() : "";
  if (res.status !== 0) {
    throw new Error(
      "Command failed: " +
        cmd +
        " " +
        args.join(" ") +
        "\n" +
        stdout +
        "\n" +
        stderr
    );
  }
  return stdout.trim();
}

function parseArgs() {
  const argv = minimist(process.argv.slice(2), {
    string: ["from", "to", "registry", "versions", "access", "tag"],
    boolean: ["dry-run", "yes"],
    alias: { f: "from", t: "to", r: "registry" },
    default: { access: "public", yes: false },
  });

  if (!argv.from || !argv.to) {
    console.log(
      [
        "",
        "用法：",
        "  republish-npm --from <旧包名> --to <新包名> [--registry <url>] [--versions <v1,v2>] [--dry-run] [--access public|restricted] [--tag <dist-tag>]",
        "",
        "示例：",
        "  republish-npm --from @old-scope/pkg --to @new-scope/pkg",
        "  republish-npm --from foo --to @new/foo --registry https://registry.npmjs.org",
        "  republish-npm --from foo --to bar --versions 1.0.0,1.1.0 --dry-run",
        "",
      ].join("\n")
    );
    process.exit(1);
  }

  if (!/^public|restricted$/.test(argv.access)) {
    err("--access 仅支持 public|restricted，收到：" + argv.access);
    process.exit(1);
  }
  return argv;
}

function confirmOrExit(argv, from, to, callback) {
  if (argv["dry-run"]) {
    log("🔍 dry-run（演练）模式，不会真正发布。");
    callback();
    return;
  }
  if (argv.yes) {
    log("✓ 已通过 --yes 跳过确认步骤。");
    callback();
    return;
  }
  
  const msg =
    '\n⚠️  即将把包 "' +
    from +
    '" 的历史版本重新发布到新包名 "' +
    to +
    '"。\n确认继续？(y/N) ';
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question(msg, function(answer) {
    rl.close();
    const input = answer.trim().toLowerCase();
    
    if (input === "y" || input === "yes") {
      log("✓ 用户确认，开始执行...\n");
      callback();
    } else {
      log("❌ 用户取消操作。");
      process.exit(0);
    }
  });
  
  // 处理读取错误
  rl.on('error', function(e) {
    rl.close();
    err("读取用户输入失败：" + e.message);
    log("❌ 未收到确认，操作已取消。");
    process.exit(1);
  });
}

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

function filterVersions(versions, versionsArg) {
  if (!versionsArg) return versions.slice();
  var want = versionsArg
    .split(",")
    .map(function (s) {
      return s.trim();
    })
    .filter(Boolean);
  var set = Object.create(null);
  want.forEach(function (v) {
    set[v] = true;
  });
  return versions.filter(function (v) {
    return !!set[v];
  });
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
    if (!fs.existsSync(absPath)) throw new Error("未找到 pack 产物：" + absPath);
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

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function writeJSON(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function rewriteName(pkgDir, newName) {
  log("  ✏️  修改包名为：" + newName);
  const pkgJsonPath = path.join(pkgDir, "package.json");
  const pkg = readJSON(pkgJsonPath);
  const oldName = pkg.name;
  pkg.name = newName;
  writeJSON(pkgJsonPath, pkg);
  log("  ✓ 包名已从 " + oldName + " 改为 " + newName);
  return { version: pkg.version };
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

function main() {
  const argv = parseArgs();
  const fromName = argv.from;
  const toName = argv.to;
  const registry = argv.registry;
  const versionsArg = argv.versions;
  const dryRun = !!argv["dry-run"];
  const access = argv.access;
  const tag = argv.tag;

  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log("📦 NPM 包重新发布工具");
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log("📌 来源包:", fromName);
  log("📌 目标包:", toName);
  if (registry) log("🌐 使用自定义 registry:", registry);
  else log("🌐 未指定 --registry，将使用 npm 默认配置（.npmrc / 环境变量）");
  if (versionsArg) log("🔢 指定版本:", versionsArg);
  if (tag) log("🏷️  发布标签:", tag);
  log("🔓 访问权限:", access);
  log("");

  ensureNpmAuth();
  
  // 使用回调处理异步确认
  confirmOrExit(argv, fromName, toName, function() {
    try {
      log("📁 创建临时工作目录...");
      const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "republish-npm-"));
      const packDir = path.join(tmpRoot, "packs");
      const workDir = path.join(tmpRoot, "work");
      fs.mkdirSync(packDir, { recursive: true });
      fs.mkdirSync(workDir, { recursive: true });
      log("✓ 临时目录：" + tmpRoot + "\n");

      const all = getAllVersions(fromName, registry);
      if (!all.length) {
        err("❌ 未在 registry 中找到 " + fromName + " 的历史版本。");
        process.exit(1);
      }

      const targetVersions = filterVersions(all, versionsArg);
      if (!targetVersions.length) {
        err("❌ 经筛选后，没有需要处理的版本。");
        process.exit(1);
      }

      log(
        "📋 待处理版本（共 " + targetVersions.length + " 个）：" +
        targetVersions.join(", ")
      );
      log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

      const failures = [];
      const startTime = Date.now();
      
      for (var i = 0; i < targetVersions.length; i++) {
        const v = targetVersions[i];
        const progress = "[" + (i + 1) + "/" + targetVersions.length + "]";
        log("\n" + progress + " 🔄 处理版本 " + v);
        log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        try {
          const tgz = packOneVersion(packDir, fromName, v, registry);
          const pkgDir = extractToReadyDir(tgz, workDir);
          const meta = rewriteName(pkgDir, toName);

          if (meta.version !== v) {
            warn(
              "⚠️  解包后的 package.json version(" +
                meta.version +
                ") 与目标版本(" +
                v +
                ")不一致，将按包内 version 发布。"
            );
          }

          publishOne(pkgDir, {
            registry: registry,
            access: access,
            tag: tag,
            dryRun: dryRun,
          });
          log(
            "✅ " + progress + " 成功：" +
              toName +
              "@" +
              meta.version +
              (dryRun ? " (dry-run)" : "")
          );
        } catch (e) {
          failures.push({ version: v, error: e.message });
          err("❌ " + progress + " 失败：" + toName + "@" + v);
          err("   错误详情：" + e.message);
          
          // 如果是关键性错误（如网络问题），提前终止
          if (e.message && (
            e.message.includes("ENOTFOUND") || 
            e.message.includes("ETIMEDOUT") ||
            e.message.includes("ECONNREFUSED")
          )) {
            err("\n❌ 检测到网络错误，终止后续处理");
            break;
          }
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      log("🎉 全部处理完毕！");
      log("⏱️  总耗时：" + elapsed + " 秒");
      log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      if (failures.length) {
        warn("\n❌ 失败 " + failures.length + " 项：");
        for (var j = 0; j < failures.length; j++) {
          var f = failures[j];
          warn("   • " + toName + "@" + f.version + ": " + f.error);
        }
        log("\n✅ 成功：" + (targetVersions.length - failures.length) + " 个版本");
        process.exitCode = 1;
      } else {
        log("\n✅ 成功发布所有 " + targetVersions.length + " 个指定版本！");
      }
    } catch (fatalError) {
      err("\n❌ 程序执行出现致命错误：");
      err(fatalError.message);
      if (fatalError.stack) {
        err("\n堆栈信息：");
        err(fatalError.stack);
      }
      process.exit(1);
    }
  });
}

main();
