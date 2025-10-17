# 多 Registry 发布功能说明

## 功能概述

`--to-registry` 参数现在支持多个值（逗号分隔），允许将包同时发布到多个 npm registry。

## 使用场景

### 1. 主仓库 + 备份仓库

同时发布到主 npm registry 和备份 registry，确保高可用性：

```bash
republish-npm \
  --from @company/old-package \
  --to @company/new-package \
  --from-registry https://npm.company.com \
  --to-registry https://registry.npmjs.org,https://npm.backup.com
```

### 2. 多区域镜像同步

同时发布到不同地区的镜像仓库：

```bash
republish-npm \
  --from @myorg/package \
  --to @myorg/package-mirror \
  --from-registry https://registry.npmjs.org \
  --to-registry https://npm.asia.com,https://npm.eu.com,https://npm.us.com
```

### 3. 公共 + 私有仓库

同时发布到公共 registry 和公司内部 registry：

```bash
republish-npm \
  --from old-package \
  --to @mycompany/new-package \
  --from-registry https://registry.npmjs.org \
  --to-registry https://registry.npmjs.org,https://npm.internal.company.com
```

## 语法

```bash
--to-registry <url1>,<url2>,<url3>...
```

**说明：**

- 使用英文逗号 `,` 分隔多个 registry URL
- 支持任意数量的 registry
- 发布顺序按照指定的顺序执行

## 执行流程

### 单 Registry（原有行为）

```
下载包 → 解压 → 修改 package.json → 发布到 registry → 完成
```

### 多 Registry（新功能）

```
下载包 → 解压 → 修改 package.json
                           ↓
                    发布到 registry 1 → 完成
                           ↓
                    发布到 registry 2 → 完成
                           ↓
                    发布到 registry 3 → 完成
                           ↓
                        全部完成
```

## 日志输出示例

### 单个 Registry

```
[1/5] 🔄 处理版本 1.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ 已下载：package-1.0.0.tgz
  ✓ 解压完成
  ✏️  修改包名为：@new/package
  ✓ 包名已从 @old/package 改为 @new/package
  ✓ 发布成功
✅ [1/5] 成功：@new/package@1.0.0
```

### 多个 Registry

```
[1/5] 🔄 处理版本 1.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ 已下载：package-1.0.0.tgz
  ✓ 解压完成
  ✏️  修改包名为：@new/package
  ✓ 包名已从 @old/package 改为 @new/package
  📤 发布到 registry 1/3: https://registry.npmjs.org
  ✓ 已发布到 registry 1
  📤 发布到 registry 2/3: https://npm.backup.com
  ✓ 已发布到 registry 2
  📤 发布到 registry 3/3: https://npm.mirror.com
  ✓ 已发布到 registry 3
✅ [1/5] 成功：@new/package@1.0.0 (已发布到 3 个 registry)
```

## 错误处理

### 某个 Registry 发布失败

如果发布到某个 registry 失败，会显示具体的错误信息：

```
[1/5] 🔄 处理版本 1.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ 已下载：package-1.0.0.tgz
  ✓ 解压完成
  ✏️  修改包名为：@new/package
  ✓ 包名已从 @old/package 改为 @new/package
  📤 发布到 registry 1/2: https://registry.npmjs.org
  ✓ 已发布到 registry 1
  📤 发布到 registry 2/2: https://npm.backup.com
  ✗ 发布到 https://npm.backup.com 失败: 401 Unauthorized
❌ [1/5] 失败：@new/package@1.0.0
   错误详情：发布到 https://npm.backup.com 失败: 401 Unauthorized
```

**说明：**

- 如果某个 registry 发布失败，会立即停止后续 registry 的发布
- 会显示具体是哪个 registry 失败
- 会显示详细的错误信息

## 配置示例

### 示例 1：双活发布

发布到主仓库和灾备仓库：

```bash
republish-npm \
  --from @old/package \
  --to @new/package \
  --from-registry https://npm.company.com \
  --to-registry https://npm.primary.com,https://npm.disaster-recovery.com \
  --access public
```

### 示例 2：内外网同步

同时发布到内网和外网：

```bash
republish-npm \
  --from @internal/package \
  --to @public/package \
  --from-registry https://npm.internal.com \
  --to-registry https://registry.npmjs.org,https://npm.internal-mirror.com \
  --dry-run  # 先演练
```

### 示例 3：全球镜像同步

发布到多个地区的镜像：

```bash
republish-npm \
  --from original-package \
  --to @global/package \
  --from-registry https://registry.npmjs.org \
  --to-registry https://npm.cn.com,https://npm.eu.com,https://npm.us.com,https://npm.ap.com \
  --versions 1.0.0,2.0.0  # 仅同步指定版本
```

## 注意事项

### 1. 认证要求

每个目标 registry 都需要有发布权限：

```bash
# 确保登录到所有 registry
npm login --registry=https://registry.npmjs.org
npm login --registry=https://npm.backup.com
npm login --registry=https://npm.mirror.com

# 或者在 .npmrc 中配置
echo "//registry.npmjs.org/:_authToken=YOUR_TOKEN_1" >> ~/.npmrc
echo "//npm.backup.com/:_authToken=YOUR_TOKEN_2" >> ~/.npmrc
echo "//npm.mirror.com/:_authToken=YOUR_TOKEN_3" >> ~/.npmrc
```

### 2. 版本冲突

如果某个 registry 已存在该版本，发布会失败：

```
✗ 发布到 https://npm.backup.com 失败: 403 version already exists
```

**解决方案：**

- 使用 `--exclude-versions` 排除已存在的版本
- 或者从 registry 中删除旧版本（24 小时内）

### 3. 性能考虑

- 发布到多个 registry 会增加总耗时
- 建议先使用 `--dry-run` 模式测试
- 可以使用 `--versions` 参数限制发布的版本数量

### 4. 网络要求

- 确保能够访问所有目标 registry
- 建议在网络稳定的环境下执行
- 如果某个 registry 不可访问，整个发布会失败

## 与单 Registry 的对比

| 特性     | 单 Registry           | 多 Registry                   |
| -------- | --------------------- | ----------------------------- |
| 参数格式 | `--to-registry <url>` | `--to-registry <url1>,<url2>` |
| 发布次数 | 1 次                  | N 次                          |
| 失败处理 | 直接失败              | 显示具体失败的 registry       |
| 日志输出 | 简洁                  | 详细显示每个 registry         |
| 认证要求 | 1 个 token            | N 个 token                    |
| 耗时     | 快                    | 相对较慢                      |

## 常见问题

### Q: 为什么不支持 `--from-registry` 多个值？

**A:** 因为源只需要一个，包只会从一个地方下载。多个值只对目标有意义（同步到多个仓库）。

### Q: 发布顺序重要吗？

**A:** 按照指定的顺序发布。如果某个 registry 失败，会停止后续发布。建议将最重要的 registry 放在前面。

### Q: 可以混合公共和私有 registry 吗？

**A:** 可以，只要确保有对应的发布权限。

### Q: 如何跳过某个失败的 registry？

**A:** 目前不支持跳过。如果需要，可以分两次执行：

```bash
# 第一次：发布到 registry 1
republish-npm --from pkg --to pkg --from-registry reg1 --to-registry reg2

# 第二次：发布到 registry 2
republish-npm --from pkg --to pkg --from-registry reg1 --to-registry reg3
```

### Q: 支持环境变量配置吗？

**A:** 目前不支持。需要在命令行中明确指定所有 registry。

## 技术细节

### 解析逻辑

```javascript
// 输入
--to-registry https://reg1.com,https://reg2.com,https://reg3.com

// 解析为数组
[
  "https://reg1.com",
  "https://reg2.com",
  "https://reg3.com"
]

// 循环发布
for (let i = 0; i < registries.length; i++) {
  publishOne(pkgDir, { registry: registries[i], ... });
}
```

### 错误传播

```javascript
try {
  // 循环发布
  for (const reg of targetRegistries) {
    publishOne(pkgDir, { registry: reg });
  }
} catch (error) {
  // 任何一个失败，整个版本标记为失败
  failures.push({ version, error: error.message });
}
```

## 参考资料

- [npm registry 文档](https://docs.npmjs.com/cli/v8/using-npm/registry)
- [配置多个 registry](https://docs.npmjs.com/cli/v8/configuring-npm/npmrc)
- [企业级 npm 部署](https://docs.npmjs.com/enterprise)
