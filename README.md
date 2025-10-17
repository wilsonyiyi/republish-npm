# republish-npm

**Node >= 14.17.0**。批量将旧包的历史版本改名并重新发布到新包名。

## 用法

```bash
republish-npm --from <旧包名> --to <新包名> [选项]
```

### 示例

#### 使用 npm 默认 registry（读取你的 .npmrc / 环境变量）

republish-npm --from @old-scope/pkg --to @new-scope/pkg

#### 指定 registry（源和目标使用同一个）

republish-npm --from foo --to @new/foo --registry https://registry.npmjs.org

#### 指定不同的源和目标 registry

republish-npm --from foo --to @new/foo --from-registry https://npm.company.com --to-registry https://registry.npmjs.org

#### 仅迁移部分版本 + 演练

republish-npm --from foo --to bar --versions 1.0.0,1.0.2 --dry-run

#### 排除指定版本

republish-npm --from foo --to bar --exclude-versions 1.0.5,2.0.0-beta.1

#### 跳过交互确认

republish-npm --from foo --to bar --yes

### 参数

- **--from**（必填）：旧包名
- **--to**（必填）：新包名
- **--registry**（可选）：自定义 registry，同时用于源和目标；不传则使用 npm 默认配置
- **--from-registry**（可选）：源包的 npm registry（需与 `--to-registry` 同时使用）
- **--to-registry**（可选）：目标包的 npm registry（需与 `--from-registry` 同时使用）
- **--versions**（可选）：逗号分隔列表，仅处理这些版本
- **--exclude-versions**（可选）：逗号分隔列表，排除这些版本
- **--dry-run**（可选）：演练模式，仅打印命令不发布
- **--yes**（可选）：跳过确认
- **--access**（可选）：public（默认）或 restricted
- **--tag**（可选）：发布 dist-tag
- **--keep-scripts**（可选）：保留 package.json 中的构建脚本（默认会清理 prepublishOnly、prepublish、prepare、prepack）

### 特性

- 🔒 自动清理可能导致发布失败的构建脚本（prepublishOnly、prepublish、prepare、prepack）
- 🧹 自动移除 publishConfig.registry 以避免发布到错误的仓库
- 🌐 支持源和目标使用不同的 npm registry（跨 registry 迁移）
- 📊 实时进度显示和 Loading 动画
- ⚠️ 智能错误处理，网络错误时提前终止
- 🎯 支持指定版本或全量迁移
- 🚫 支持排除特定版本

### 使用场景

#### 跨 registry 迁移

如果你需要从公司私有 npm 仓库迁移包到公共 npmjs.org，或者反向操作：

```bash
# 从公司私有仓库迁移到 npm 公共仓库
republish-npm \
  --from @company/package \
  --to @public/package \
  --from-registry https://npm.company.com \
  --to-registry https://registry.npmjs.org

# 从 npm 公共仓库迁移到公司私有仓库
republish-npm \
  --from @public/package \
  --to @company/package \
  --from-registry https://registry.npmjs.org \
  --to-registry https://npm.company.com
```

#### 同一 registry 内重命名

```bash
# 使用 --registry 参数
republish-npm \
  --from @old-scope/package \
  --to @new-scope/package \
  --registry https://registry.npmjs.org
```

## 🚀 开发与发布

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/wilson_janet/republish-npm.git
cd republish-npm

# 安装依赖
pnpm install

# 本地测试
node cli.js --help

# 代码格式化和检查
pnpm run check
pnpm run format
pnpm run lint
```

### 发布新版本

本项目使用 **GitHub Actions** 自动发布到 npm。

#### 快速发布

```bash
# 补丁版本（bug 修复）：0.2.0 -> 0.2.1
pnpm run release:patch

# 次版本（新功能）：0.2.0 -> 0.3.0
pnpm run release:minor

# 主版本（破坏性更新）：0.2.0 -> 1.0.0
pnpm run release:major
```

执行后会自动：

1. ✅ 更新 `package.json` 版本号
2. ✅ 创建 git commit 和 tag
3. ✅ 推送到 GitHub
4. ✅ 触发 GitHub Actions 自动发布到 npm
5. ✅ 创建 GitHub Release

#### 详细发布指南

查看 [.github/RELEASE.md](.github/RELEASE.md) 了解完整的发布流程和注意事项。

### CI/CD

项目配置了两个 GitHub Actions 工作流：

- **Test** (`.github/workflows/test.yml`)

  - 在多个 Node.js 版本上测试（14, 16, 18, 20）
  - 在多个操作系统上测试（Ubuntu, macOS, Windows）
  - 每次推送到主分支或 PR 时触发

- **Publish** (`.github/workflows/publish.yml`)
  - 自动发布到 npm
  - 创建 GitHub Release
  - 推送 `v*` tag 时触发

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🔗 相关链接

- [npm 包地址](https://www.npmjs.com/package/@wilson_janet/republish-npm)
- [GitHub 仓库](https://github.com/wilson_janet/republish-npm)
- [更新日志](CHANGELOG.md)
- [发布指南](.github/RELEASE.md)
