# 发布指南

本文档说明如何通过 GitHub Actions 自动发布新版本到 npm。

## 前置条件

### 1. 配置 NPM_TOKEN

1. 登录 [npm](https://www.npmjs.com/)
2. 进入 **Account Settings** → **Access Tokens**
3. 点击 **Generate New Token** → 选择 **Automation** 类型
4. 复制生成的 token
5. 在 GitHub 仓库设置中：
   - 进入 **Settings** → **Secrets and variables** → **Actions**
   - 点击 **New repository secret**
   - Name: `NPM_TOKEN`
   - Value: 粘贴你的 npm token
   - 点击 **Add secret**

### 2. 确保 package.json 配置正确

确保 `package.json` 中的以下字段正确：

```json
{
  "name": "@wilson_janet/republish-npm",
  "version": "0.2.0",
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

## 发布流程

### 方式一：使用 npm scripts（推荐）

项目已配置好 npm scripts，可以直接使用：

```bash
# 1. 确保所有更改已提交
git status

# 2. 更新 CHANGELOG.md（可选但推荐）
# 记录本次版本的更新内容

# 3. 使用 npm scripts 发布
npm run publish:patch  # 0.2.0 -> 0.2.1
# 或
npm run publish:minor  # 0.2.0 -> 0.3.0
# 或
npm run publish:major  # 0.2.0 -> 1.0.0
```

这会自动：

1. 更新 `package.json` 的版本号
2. 创建 git commit
3. 创建 git tag（如 v0.2.1）
4. 推送到 GitHub（包括 tag）
5. 触发 GitHub Actions 自动发布

### 方式二：手动创建 tag

```bash
# 1. 更新 package.json 版本号
npm version patch  # 或 minor / major

# 2. 推送代码和 tag
git push origin master
git push origin --tags

# 3. GitHub Actions 会自动触发发布
```

### 方式三：在 GitHub 网页上创建 Release

1. 进入仓库的 **Releases** 页面
2. 点击 **Draft a new release**
3. 在 **Choose a tag** 中输入新版本号（如 `v0.2.1`）
4. 填写 Release 标题和说明
5. 点击 **Publish release**
6. GitHub Actions 会自动触发发布

## 工作流说明

### Publish 工作流 (publish.yml)

**触发条件：**

- 推送 `v*` 格式的 tag（如 v1.0.0, v0.2.1）

**执行步骤：**

1. ✅ 检出代码
2. ✅ 设置 Node.js 环境
3. ✅ 安装依赖
4. ✅ 验证 tag 版本与 package.json 版本一致
5. ✅ 发布到 npm
6. ✅ 创建 GitHub Release

### Test 工作流 (test.yml)

**触发条件：**

- 推送到 master/main/develop 分支
- Pull Request 到 master/main 分支

**执行步骤：**

1. ✅ 在多个 Node.js 版本上测试（14, 16, 18, 20）
2. ✅ 在多个操作系统上测试（Ubuntu, macOS, Windows）
3. ✅ 代码质量检查

## 版本号规范

遵循 [Semantic Versioning](https://semver.org/)：

- **Major (主版本号)**：不兼容的 API 修改

  - 示例：0.2.0 → 1.0.0

- **Minor (次版本号)**：向后兼容的功能性新增

  - 示例：0.2.0 → 0.3.0

- **Patch (修订号)**：向后兼容的问题修正
  - 示例：0.2.0 → 0.2.1

## 发布检查清单

发布前请确认：

- [ ] 所有代码已提交并推送
- [ ] 代码通过了所有测试
- [ ] CHANGELOG.md 已更新
- [ ] package.json 版本号正确
- [ ] README.md 文档已更新（如有 API 变更）
- [ ] 已在本地测试 CLI 功能
- [ ] NPM_TOKEN 已正确配置在 GitHub Secrets

## 发布后验证

```bash
# 1. 检查 npm 上的版本
npm view @wilson_janet/republish-npm version

# 2. 检查 npm 上的文件列表
npm view @wilson_janet/republish-npm files

# 3. 全局安装测试
npm install -g @wilson_janet/republish-npm
republish-npm --help

# 4. 检查 GitHub Release
# 访问 https://github.com/<your-username>/republish-npm/releases
```

## 回滚版本

如果发现发布的版本有问题：

### 24 小时内（推荐撤销）

```bash
# 撤销指定版本（24小时内）
npm unpublish @wilson_janet/republish-npm@0.2.1
```

### 24 小时后（发布修复版本）

```bash
# 发布新的修复版本
npm run publish:patch
```

## 常见问题

### 1. 发布失败：401 Unauthorized

- 检查 NPM_TOKEN 是否正确配置
- 检查 token 是否过期
- 检查是否有发布权限

### 2. 发布失败：版本号已存在

- 确保 package.json 中的版本号是新的
- 检查 npm 上是否已存在该版本

### 3. 发布失败：tag 与版本不一致

- 确保 tag 格式为 `v${version}`
- 例如：package.json 是 0.2.1，tag 应该是 v0.2.1

### 4. GitHub Actions 没有触发

- 检查 tag 格式是否为 `v*`
- 确认 tag 已成功推送到远程
- 检查 GitHub Actions 是否已启用

## 参考资料

- [npm 发布文档](https://docs.npmjs.com/cli/v8/commands/npm-publish)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [语义化版本](https://semver.org/lang/zh-CN/)
