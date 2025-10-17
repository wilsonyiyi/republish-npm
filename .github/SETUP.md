# GitHub Actions 配置指南

本文档说明如何为项目配置 GitHub Actions 自动发布功能。

## 前置要求

### 1. 创建 npm 账号

如果还没有 npm 账号：

1. 访问 [npmjs.com](https://www.npmjs.com/)
2. 点击 "Sign Up" 注册账号
3. 验证邮箱

### 2. 获取 npm Access Token

1. 登录 npm
2. 点击右上角头像 → **Access Tokens**
3. 点击 **Generate New Token**
4. 选择 **Automation** 类型（推荐）
5. 复制生成的 token（只显示一次！）

### 3. 配置 GitHub Secrets

1. 进入 GitHub 仓库页面
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加以下 secret：

   **名称：** `NPM_TOKEN`  
   **值：** 粘贴你的 npm token

5. 点击 **Add secret**

## 工作流说明

项目包含两个 GitHub Actions 工作流：

### 1. Publish 工作流

**文件：** `.github/workflows/publish.yml`

**触发条件：**

- 推送以 `v` 开头的 tag（如 `v0.2.0`）

**执行内容：**

1. 检出代码
2. 设置 Node.js 环境
3. 安装依赖
4. 验证 tag 版本与 package.json 一致
5. 发布到 npm
6. 创建 GitHub Release

**使用方式：**

```bash
# 方式 1：使用 npm scripts（推荐）
pnpm run release:patch  # 0.2.0 -> 0.2.1
pnpm run release:minor  # 0.2.0 -> 0.3.0
pnpm run release:major  # 0.2.0 -> 1.0.0

# 方式 2：手动创建 tag
git tag v0.2.1
git push origin v0.2.1
```

### 2. Test 工作流

**文件：** `.github/workflows/test.yml`

**触发条件：**

- 推送到 master/main/develop 分支
- 创建 Pull Request

**执行内容：**

1. 在多个 Node.js 版本上测试（14, 16, 18, 20）
2. 在多个操作系统上测试（Ubuntu, macOS, Windows）
3. 运行代码质量检查

## 首次发布

### 步骤 1：准备代码

```bash
# 确保所有代码已提交
git status

# 确保在最新的 master 分支
git checkout master
git pull origin master
```

### 步骤 2：更新 CHANGELOG

编辑 `CHANGELOG.md`，添加新版本的更新内容：

```markdown
## [0.2.0] - 2025-01-16

### 新功能

- 添加了某某功能

### Bug 修复

- 修复了某某问题
```

### 步骤 3：提交并推送

```bash
git add CHANGELOG.md
git commit -m "docs: 更新 CHANGELOG"
git push origin master
```

### 步骤 4：发布版本

```bash
# 使用 npm scripts 发布
pnpm run release:patch
```

这会自动：

1. 更新 package.json 版本号
2. 创建 git commit
3. 创建 git tag
4. 推送到 GitHub
5. 触发 GitHub Actions

### 步骤 5：验证发布

1. **查看 GitHub Actions**

   - 进入仓库 → **Actions** 标签
   - 查看 "Publish to NPM" 工作流状态

2. **查看 npm**

   ```bash
   npm view @wilson_janet/republish-npm version
   ```

3. **测试安装**

   ```bash
   npm install -g @wilson_janet/republish-npm
   republish-npm --version
   ```

4. **查看 GitHub Release**
   - 进入仓库 → **Releases** 标签
   - 应该能看到自动创建的 release

## 常见问题

### Q: 工作流没有触发？

**A:** 检查：

- tag 格式是否正确（必须以 `v` 开头）
- tag 是否成功推送到远程
- GitHub Actions 是否已启用（Settings → Actions → Allow all actions）

### Q: 发布失败：401 Unauthorized

**A:** 检查：

- NPM_TOKEN 是否正确配置
- token 是否过期
- token 类型是否为 Automation

### Q: 发布失败：版本号已存在

**A:**

- 确保 package.json 中的版本号是新的
- 或者从 npm 撤销该版本（24 小时内）

### Q: 发布失败：tag 与版本不一致

**A:**

- 确保 tag 为 `v${version}` 格式
- 例如：package.json 是 0.2.1，tag 应该是 v0.2.1

### Q: 如何发布 prerelease 版本？

**A:**

```bash
# 手动创建 prerelease 版本
npm version prerelease --preid=beta
git push && git push --tags
```

tag 格式：`v0.2.0-beta.0`

### Q: 如何撤销已发布的版本？

**A:**

```bash
# 24小时内可以撤销
npm unpublish @wilson_janet/republish-npm@0.2.1

# 24小时后只能发布新版本修复
```

## 安全建议

1. **定期更新 npm token**

   - 每 90 天更新一次 token
   - 使用 Automation 类型的 token

2. **保护主分支**

   - Settings → Branches → Add rule
   - 要求 PR review
   - 要求 status checks 通过

3. **审查依赖**
   - 定期更新依赖
   - 检查安全漏洞

## 工作流自定义

### 修改 Node.js 版本

编辑 `.github/workflows/publish.yml`：

```yaml
- name: 设置 Node.js
  uses: actions/setup-node@v4
  with:
    node-version: "20" # 修改这里
```

### 添加构建步骤

如果项目需要构建：

```yaml
- name: 构建
  run: pnpm run build
```

### 跳过 GitHub Release

如果不需要自动创建 Release，删除 `.github/workflows/publish.yml` 中的：

```yaml
- name: 创建 GitHub Release
  uses: actions/create-release@v1
  # ... 整个步骤
```

## 参考资料

- [npm 发布文档](https://docs.npmjs.com/cli/v8/commands/npm-publish)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [创建 npm token](https://docs.npmjs.com/creating-and-viewing-access-tokens)
- [语义化版本](https://semver.org/lang/zh-CN/)

## 获取帮助

如果遇到问题：

1. 查看 GitHub Actions 日志
2. 查看本项目的 [Issues](https://github.com/wilson_janet/republish-npm/issues)
3. 创建新的 Issue 描述问题
