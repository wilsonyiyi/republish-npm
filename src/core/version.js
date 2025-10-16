/**
 * 版本过滤和处理模块
 */

function filterVersions(versions, versionsArg, excludeVersionsArg) {
  var result = versions.slice();

  // 如果指定了 --versions，仅保留这些版本
  if (versionsArg) {
    var want = versionsArg
      .split(",")
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    var wantSet = Object.create(null);
    want.forEach(function (v) {
      wantSet[v] = true;
    });
    result = result.filter(function (v) {
      return !!wantSet[v];
    });
  }

  // 如果指定了 --exclude-versions，排除这些版本
  if (excludeVersionsArg) {
    var exclude = excludeVersionsArg
      .split(",")
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    var excludeSet = Object.create(null);
    exclude.forEach(function (v) {
      excludeSet[v] = true;
    });
    result = result.filter(function (v) {
      return !excludeSet[v];
    });
  }

  return result;
}

module.exports = {
  filterVersions,
};

