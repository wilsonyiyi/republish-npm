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

function log() {
  console.log("[republish-npm]", ...arguments);
}
function warn() {
  console.warn("[republish-npm][warn]", ...arguments);
}
function err() {
  console.error("[republish-npm][error]", ...arguments);
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

function confirmOrExit(argv, from, to) {
  if (argv["dry-run"]) {
    log("dry-run（演练）模式，不会真正发布。");
    return;
  }
  if (argv.yes) return;
  const msg =
    '即将把包 "' +
    from +
    '" 的历史版本重新发布到新包名 "' +
    to +
    '"。\n确认继续？(y/N) ';
  process.stdout.write(msg);
  try {
    const input = fs.readFileSync(0, "utf-8").trim().toLowerCase();
    if (input !== "y" && input !== "yes") {
      log("已取消。");
      process.exit(0);
    }
  } catch (_) {}
}

function npmArgsWithRegistry(baseArgs, registry) {
  if (registry) return baseArgs.concat(["--registry", registry]);
  return baseArgs; // 不传则用 npm 默认配置
}

function ensureNpmAuth() {
  try {
    run("npm", ["whoami"]);
  } catch (_) {
    warn(
      "`npm whoami` 失败。请确认已登录（npm login）并有目标 scope 的发布权限。"
    );
  }
}

function getAllVersions(pkg, registry) {
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
  return versions;
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
  const args = npmArgsWithRegistry(
    ["pack", fromName + "@" + version],
    registry
  );
  const out = run("npm", args, { cwd: tmpDir });
  const lines = out.split("\n");
  const tgzName = lines[lines.length - 1].trim();
  const absPath = path.join(tmpDir, tgzName);
  if (!fs.existsSync(absPath)) throw new Error("未找到 pack 产物：" + absPath);
  return absPath;
}

function extractToReadyDir(tgzPath, workRoot) {
  const folderName = path.basename(tgzPath, ".tgz");
  const dest = path.join(workRoot, folderName);
  fs.mkdirSync(dest, { recursive: true });
  tar.x({ file: tgzPath, cwd: dest, sync: true });
  const pkgDir = path.join(dest, "package");
  if (!fs.existsSync(pkgDir))
    throw new Error("解压结构异常，未找到目录：" + pkgDir);
  return pkgDir;
}

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function writeJSON(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function rewriteName(pkgDir, newName) {
  const pkgJsonPath = path.join(pkgDir, "package.json");
  const pkg = readJSON(pkgJsonPath);
  pkg.name = newName;
  writeJSON(pkgJsonPath, pkg);
  return { version: pkg.version };
}

function publishOne(pkgDir, opts) {
  const args = ["publish", "--access", opts.access];
  if (opts.tag) args.push("--tag", opts.tag);
  const finalArgs = npmArgsWithRegistry(args, opts.registry);
  if (opts.dryRun) {
    log("[dry-run] npm " + finalArgs.join(" ") + " (cwd: " + pkgDir + ")");
    return;
  }
  run("npm", finalArgs, { cwd: pkgDir });
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

  log("来源包:", fromName);
  log("目标包:", toName);
  if (registry) log("使用自定义 registry:", registry);
  else log("未指定 --registry，将使用 npm 默认配置（.npmrc / 环境变量）");

  ensureNpmAuth();
  confirmOrExit(argv, fromName, toName);

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "republish-npm-"));
  const packDir = path.join(tmpRoot, "packs");
  const workDir = path.join(tmpRoot, "work");
  fs.mkdirSync(packDir, { recursive: true });
  fs.mkdirSync(workDir, { recursive: true });

  log("读取历史版本...");
  const all = getAllVersions(fromName, registry);
  if (!all.length) {
    err("未在 registry 中找到 " + fromName + " 的历史版本。");
    process.exit(1);
  }

  const targetVersions = filterVersions(all, versionsArg);
  if (!targetVersions.length) {
    err("经筛选后，没有需要处理的版本。");
    process.exit(1);
  }

  log(
    "待处理版本（共 " + targetVersions.length + " 个）：",
    targetVersions.join(", ")
  );

  const failures = [];
  for (var i = 0; i < targetVersions.length; i++) {
    const v = targetVersions[i];
    log("\n==> 处理版本 " + v);
    try {
      const tgz = packOneVersion(packDir, fromName, v, registry);
      const pkgDir = extractToReadyDir(tgz, workDir);
      const meta = rewriteName(pkgDir, toName);

      if (meta.version !== v) {
        warn(
          "解包后的 package.json version(" +
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
        "发布完成：" +
          toName +
          "@" +
          meta.version +
          (dryRun ? " (dry-run)" : "")
      );
    } catch (e) {
      failures.push({ version: v, error: e.message });
      err("发布失败：" + toName + "@" + v + "\n" + e.message);
    }
  }

  log("\n全部处理完毕。");
  if (failures.length) {
    warn("失败 " + failures.length + " 项：");
    for (var j = 0; j < failures.length; j++) {
      var f = failures[j];
      warn("- " + toName + "@" + f.version + ": " + f.error);
    }
    process.exitCode = 1;
  } else {
    log("成功发布所有指定版本。");
  }
}

main();
