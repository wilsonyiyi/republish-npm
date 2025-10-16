/**
 * 命令执行工具
 */

const child = require("child_process");

function run(cmd, args, opts) {
  const res = child.spawnSync(cmd, args, Object.assign({ stdio: ["ignore", "pipe", "pipe"] }, opts));
  const stdout = res.stdout ? res.stdout.toString() : "";
  const stderr = res.stderr ? res.stderr.toString() : "";
  if (res.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(" ")}\n${stdout}\n${stderr}`);
  }
  return stdout.trim();
}

module.exports = {
  run,
};
