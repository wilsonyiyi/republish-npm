/**
 * Loading 动画工具
 */

function startLoading(message) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  process.stdout.write(`  ${frames[0]} ${message}`);

  const interval = setInterval(() => {
    i = (i + 1) % frames.length;
    process.stdout.write(`\r  ${frames[i]} ${message}`);
  }, 80);

  return {
    stop: (successMsg) => {
      clearInterval(interval);
      process.stdout.write(`\r  ✓ ${successMsg || message}\n`);
    },
    fail: (errorMsg) => {
      clearInterval(interval);
      process.stdout.write(`\r  ✗ ${errorMsg || message}\n`);
    },
  };
}

module.exports = {
  startLoading,
};
