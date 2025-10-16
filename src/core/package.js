/**
 * package.json 处理模块
 */

const fs = require("fs");
const path = require("path");
const { log } = require("../utils/logger");

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJSON(p, obj) {
  fs.writeFileSync(p, `${JSON.stringify(obj, null, 2)}\n`, "utf8");
}

function rewriteName(pkgDir, newName, keepScripts) {
  log(`  ✏️  修改包名为：${newName}`);
  const pkgJsonPath = path.join(pkgDir, "package.json");
  const pkg = readJSON(pkgJsonPath);
  const oldName = pkg.name;

  // 修改包名
  pkg.name = newName;

  // 清理可能导致发布失败的 scripts（除非用户指定保留）
  const removedScripts = [];
  if (!keepScripts && pkg.scripts) {
    const scriptsToRemove = ["prepublishOnly", "prepublish", "prepare", "prepack"];

    scriptsToRemove.forEach((scriptName) => {
      if (pkg.scripts[scriptName]) {
        removedScripts.push(scriptName);
        delete pkg.scripts[scriptName];
      }
    });

    // 如果 scripts 对象为空，删除整个 scripts 字段
    if (Object.keys(pkg.scripts).length === 0) {
      delete pkg.scripts;
    }
  }

  // 清理可能导致问题的其他字段
  const fieldsToClean = ["publishConfig"];
  fieldsToClean.forEach((field) => {
    if (pkg[field] && pkg[field].registry) {
      log(`  ⚠️  移除 package.json 中的 ${field}.registry`);
      delete pkg[field].registry;
      if (Object.keys(pkg[field]).length === 0) {
        delete pkg[field];
      }
    }
  });

  writeJSON(pkgJsonPath, pkg);
  log(`  ✓ 包名已从 ${oldName} 改为 ${newName}`);

  if (removedScripts.length > 0) {
    log(`  ✓ 已清理 scripts: ${removedScripts.join(", ")}`);
  } else if (keepScripts && pkg.scripts) {
    log(`  ℹ️  保留原始 scripts（--keep-scripts）`);
  }

  return { version: pkg.version };
}

module.exports = {
  readJSON,
  writeJSON,
  rewriteName,
};
