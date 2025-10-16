/**
 * 版本过滤和处理模块
 */

function filterVersions(versions, versionsArg, excludeVersionsArg) {
  let result = versions.slice();

  // 如果指定了 --versions，仅保留这些版本
  if (versionsArg) {
    const want = versionsArg
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const wantSet = Object.create(null);
    want.forEach((v) => {
      wantSet[v] = true;
    });
    result = result.filter((v) => !!wantSet[v]);
  }

  // 如果指定了 --exclude-versions，排除这些版本
  if (excludeVersionsArg) {
    const exclude = excludeVersionsArg
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const excludeSet = Object.create(null);
    exclude.forEach((v) => {
      excludeSet[v] = true;
    });
    result = result.filter((v) => !excludeSet[v]);
  }

  return result;
}

module.exports = {
  filterVersions,
};
