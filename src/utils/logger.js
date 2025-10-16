/**
 * 日志工具模块
 */

function log(...args) {
  console.log("[republish-npm]", ...args);
}

function warn(...args) {
  console.warn("[republish-npm][warn]", ...args);
}

function err(...args) {
  console.error("[republish-npm][error]", ...args);
}

module.exports = {
  log,
  warn,
  err,
};
