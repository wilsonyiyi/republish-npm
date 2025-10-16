/**
 * 日志工具模块
 */

function log() {
  console.log("[republish-npm]", ...arguments);
}

function warn() {
  console.warn("[republish-npm][warn]", ...arguments);
}

function err() {
  console.error("[republish-npm][error]", ...arguments);
}

module.exports = {
  log,
  warn,
  err,
};

