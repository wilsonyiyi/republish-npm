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
