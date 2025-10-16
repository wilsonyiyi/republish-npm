/**
 * 命令行参数解析模块
 */

const minimist = require("minimist");
const { err } = require("../utils/logger");

function parseArgs() {
  const argv = minimist(process.argv.slice(2), {
    string: [
      "from",
      "to",
      "registry",
      "versions",
      "exclude-versions",
      "access",
      "tag",
    ],
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
        "  --registry <url>           自定义 npm registry",
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
        "  republish-npm --from foo --to bar --versions 1.0.0,1.1.0 --dry-run",
        "  republish-npm --from foo --to bar --exclude-versions 1.0.5,2.0.0-beta.1",
        "",
      ].join("\n")
    );
    process.exit(1);
  }

  if (!/^public|restricted$/.test(argv.access)) {
    err("--access 仅支持 public|restricted，收到：" + argv.access);
    process.exit(1);
  }

  return argv;
}

module.exports = {
  parseArgs,
};

