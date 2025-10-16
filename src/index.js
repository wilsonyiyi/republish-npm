#!/usr/bin/env node
/**
 * republish-npm (Node >= 14.17.0)
 * 将旧包的历史版本批量改名并重新发布到新包名
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const { log, warn, err } = require("./utils/logger");
const { parseArgs } = require("./core/args");
const { confirmOrExit } = require("./core/confirm");
const { filterVersions } = require("./core/version");
const { rewriteName } = require("./core/package");
const {
  ensureNpmAuth,
  getAllVersions,
  packOneVersion,
  extractToReadyDir,
  publishOne,
} = require("./core/npm");

function main() {
  const argv = parseArgs();
  const fromName = argv.from;
  const toName = argv.to;
  const registry = argv.registry;
  const versionsArg = argv.versions;
  const excludeVersionsArg = argv["exclude-versions"];
  const dryRun = !!argv["dry-run"];
  const access = argv.access;
  const tag = argv.tag;
  const keepScripts = !!argv["keep-scripts"];

  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log("📦 NPM 包重新发布工具");
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log("📌 来源包:", fromName);
  log("📌 目标包:", toName);
  if (registry) log("🌐 使用自定义 registry:", registry);
  else log("🌐 未指定 --registry，将使用 npm 默认配置（.npmrc / 环境变量）");
  if (versionsArg) log("🔢 指定版本:", versionsArg);
  if (excludeVersionsArg) log("🚫 排除版本:", excludeVersionsArg);
  if (tag) log("🏷️  发布标签:", tag);
  log("🔓 访问权限:", access);
  log("🧹 清理构建脚本:", keepScripts ? "否" : "是");
  log("");

  ensureNpmAuth();

  // 使用回调处理异步确认
  confirmOrExit(argv, fromName, toName, function () {
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

      const targetVersions = filterVersions(
        all,
        versionsArg,
        excludeVersionsArg
      );
      if (!targetVersions.length) {
        err("❌ 经筛选后，没有需要处理的版本。");
        process.exit(1);
      }

      // 显示排除的版本信息
      if (excludeVersionsArg) {
        const excludedCount =
          all.length -
          targetVersions.length -
          (versionsArg
            ? all.length - filterVersions(all, versionsArg, null).length
            : 0);
        if (excludedCount > 0) {
          log("✓ 已排除 " + excludedCount + " 个版本");
        }
      }

      log(
        "📋 待处理版本（共 " +
          targetVersions.length +
          " 个）：" +
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
          const meta = rewriteName(pkgDir, toName, keepScripts);

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
            "✅ " +
              progress +
              " 成功：" +
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
          if (
            e.message &&
            (e.message.includes("ENOTFOUND") ||
              e.message.includes("ETIMEDOUT") ||
              e.message.includes("ECONNREFUSED"))
          ) {
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
        log(
          "\n✅ 成功：" + (targetVersions.length - failures.length) + " 个版本"
        );
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

module.exports = { main };

// 如果直接运行此文件
if (require.main === module) {
  main();
}

