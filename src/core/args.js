/**
 * 命令行参数解析模块
 */

const minimist = require("minimist");
const { err } = require("../utils/logger");

function parseArgs() {
  const argv = minimist(process.argv.slice(2), {
    string: ["from", "to", "registry", "from-registry", "to-registry", "versions", "exclude-versions", "access", "tag"],
    boolean: ["dry-run", "yes", "keep-scripts"],
    alias: { f: "from", t: "to", r: "registry" },
    default: { access: "public", yes: false, "keep-scripts": false },
  });

  if (!argv.from || !argv.to) {
    console.log(
      [
        "",
        "用法：",
        "  republish-npm --from <旧包名> --to <新包名> [选项]",
        "",
        "选项：",
        "  --registry <url>           自定义 npm registry（同时用于源和目标）",
        "  --from-registry <url>      源包的 npm registry（需与 --to-registry 同时使用）",
        "  --to-registry <url>        目标包的 npm registry（需与 --from-registry 同时使用）",
        "                             支持多个值，用逗号分隔，同时发布到多个 registry",
        "  --versions <v1,v2>         仅处理指定版本（逗号分隔）",
        "  --exclude-versions <v1,v2> 排除指定版本（逗号分隔）",
        "  --dry-run                  演练模式，不真正发布",
        "  --yes                      跳过确认步骤",
        "  --access <public|restricted>  访问权限（默认：public）",
        "  --tag <dist-tag>           发布 dist-tag",
        "  --keep-scripts             保留 package.json 中的构建脚本",
        "",
        "示例：",
        "  republish-npm --from @old-scope/pkg --to @new-scope/pkg",
        "  republish-npm --from foo --to @new/foo --registry https://registry.npmjs.org",
        "  republish-npm --from foo --to bar --from-registry https://npm.company.com --to-registry https://registry.npmjs.org",
        "  republish-npm --from foo --to bar --from-registry https://npm.company.com --to-registry https://registry.npmjs.org,https://npm.backup.com",
        "  republish-npm --from foo --to bar --versions 1.0.0,1.1.0 --dry-run",
        "  republish-npm --from foo --to bar --exclude-versions 1.0.5,2.0.0-beta.1",
        "",
      ].join("\n"),
    );
    process.exit(1);
  }

  if (!/^public|restricted$/.test(argv.access)) {
    err(`--access 仅支持 public|restricted，收到：${argv.access}`);
    process.exit(1);
  }

  // 校验 from-registry 和 to-registry 必须同时存在
  const hasFromRegistry = !!argv["from-registry"];
  const hasToRegistry = !!argv["to-registry"];

  if (hasFromRegistry !== hasToRegistry) {
    err("❌ --from-registry 和 --to-registry 必须同时指定！");
    err("   提示：如果只需要使用一个 registry，请使用 --registry 参数");
    process.exit(1);
  }

  // 校验 registry 和 from-registry/to-registry 不能同时使用
  if (argv.registry && (hasFromRegistry || hasToRegistry)) {
    err("❌ --registry 不能与 --from-registry/--to-registry 同时使用！");
    err("   提示：--registry 用于源和目标使用同一个 registry");
    err("   提示：--from-registry/--to-registry 用于源和目标使用不同的 registry");
    process.exit(1);
  }

  return argv;
}

module.exports = {
  parseArgs,
};
