/**
 * 用户确认交互模块
 */

const readline = require("readline");
const { log, err } = require("../utils/logger");

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

  const msg = `\n⚠️  即将把包 "${from}" 的历史版本重新发布到新包名 "${to}"。\n确认继续？(y/N) `;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(msg, (answer) => {
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
  rl.on("error", (e) => {
    rl.close();
    err(`读取用户输入失败：${e.message}`);
    log("❌ 未收到确认，操作已取消。");
    process.exit(1);
  });
}

module.exports = {
  confirmOrExit,
};
