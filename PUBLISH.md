# 发布指南

本文档说明如何发布 `republish-npm` 项目到 npm。

## 前置条件

1. **登录 npm**
   ```bash
   npm login
   ```

2. **确认 npm 用户**
   ```bash
   npm whoami
   ```

3. **确认有 `@wilson_janet` scope 的发布权限**

## 发布流程

### 方式一：使用 npm scripts（推荐）

根据版本类型选择对应的命令：

```bash
# 发布补丁版本（1.0.1 -> 1.0.2）
npm run publish:patch

# 发布次版本（1.0.1 -> 1.1.0）
npm run publish:minor

# 发布主版本（1.0.1 -> 2.0.0）
npm run publish:major
```

这些命令会自动：
1. 更新 package.json 中的版本号
2. 创建 git commit 和 tag
3. 推送到远程仓库
4. 发布到 npm

### 方式二：手动发布

如果需要更精细的控制：

```bash
# 1. 更新版本号
npm version patch  # 或 minor / major

# 2. 推送到 git
git push && git push --tags

# 3. 发布到 npm
npm publish
```

## 发布前检查清单

- [ ] 代码已提交到 git
- [ ] README.md 已更新
- [ ] 功能已测试
- [ ] CHANGELOG（如有）已更新
- [ ] 已登录 npm 账号
- [ ] 确认 package.json 中的包名和版本号正确

## 发布配置说明

### package.json 关键字段

```json
{
  "files": [
    "cli.js",
    "README.md", 
    "LICENSE"
  ]
}
```
这个字段指定了发布到 npm 时包含的文件。

### npm scripts

- **prepublishOnly**: 发布前执行，用于检查项目状态
- **version**: 更新版本号时执行
- **postversion**: 版本号更新后执行，自动推送到 git

## 测试发布

在正式发布前，可以先测试打包结果：

```bash
# 打包但不发布
npm pack

# 查看打包文件内容
tar -tzf wilson_janet-republish-npm-*.tgz

# 测试安装
npm install ./wilson_janet-republish-npm-*.tgz -g

# 测试命令
republish-npm --help
```

## 发布后验证

```bash
# 检查 npm 上的包信息
npm view @wilson_janet/republish-npm

# 检查版本
npm view @wilson_janet/republish-npm version

# 检查文件列表
npm view @wilson_janet/republish-npm files

# 全局安装测试
npm install -g @wilson_janet/republish-npm
republish-npm --help
```

## 撤销发布（24小时内）

如果发现问题，可以在发布后 24 小时内撤销：

```bash
# 撤销指定版本
npm unpublish @wilson_janet/republish-npm@1.0.2

# 注意：24小时后无法撤销，只能发布新版本修复
```

## 常见问题

### 1. 发布时提示权限错误

确保你：
- 已登录正确的 npm 账号
- 有 `@wilson_janet` scope 的发布权限
- 包名在 npm 上可用或你有权限发布

### 2. Git 推送失败

检查：
- 是否有未提交的更改
- 远程仓库是否可访问
- 是否有推送权限

### 3. 版本号冲突

如果版本号已存在于 npm，需要：
- 使用更高的版本号
- 或先撤销该版本（24小时内）

## 发布清单模板

```
发布版本：v______
发布日期：________
发布人：________

变更内容：
- [ ] 功能1
- [ ] 功能2
- [ ] Bug修复

检查项：
- [ ] 代码审查通过
- [ ] 本地测试通过
- [ ] README 已更新
- [ ] 版本号已更新
- [ ] 已推送到 git
- [ ] npm 发布成功
- [ ] 发布后验证通过
```

