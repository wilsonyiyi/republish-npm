# 贡献指南

感谢你考虑为 `republish-npm` 做出贡献！

## 如何贡献

### 报告 Bug

如果你发现了 bug，请在 [Issues](https://github.com/wilson_janet/republish-npm/issues) 中创建一个新的 issue，包含：

- **标题**：简短描述问题
- **环境信息**：Node.js 版本、操作系统等
- **复现步骤**：如何触发这个 bug
- **期望行为**：应该发生什么
- **实际行为**：实际发生了什么
- **错误信息**：完整的错误堆栈（如果有）

### 提出新功能

如果你有新功能的想法：

1. 先在 Issues 中搜索，看是否已有类似建议
2. 如果没有，创建一个新的 issue，说明：
   - 功能描述
   - 使用场景
   - 预期效果

### 提交代码

1. **Fork 仓库**

   点击页面右上角的 "Fork" 按钮

2. **克隆你的 fork**

   ```bash
   git clone https://github.com/<your-username>/republish-npm.git
   cd republish-npm
   ```

3. **创建分支**

   ```bash
   git checkout -b feature/my-new-feature
   # 或
   git checkout -b fix/bug-description
   ```

4. **安装依赖**

   ```bash
   pnpm install
   ```

5. **进行修改**

   - 保持代码风格一致
   - 添加必要的注释
   - 更新相关文档

6. **代码检查**

   ```bash
   # 格式化代码
   pnpm run format

   # 代码检查
   pnpm run lint

   # 完整检查
   pnpm run check
   ```

7. **测试修改**

   ```bash
   # 测试 CLI
   node cli.js --help

   # 测试具体功能（如果可以）
   node cli.js --from <test-package> --to <new-package> --dry-run
   ```

8. **提交修改**

   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   # 或
   git commit -m "fix: 修复某个问题"
   ```

   **Commit 消息规范**：

   - `feat:` 新功能
   - `fix:` Bug 修复
   - `docs:` 文档更新
   - `style:` 代码格式（不影响功能）
   - `refactor:` 重构（不修复 bug，不添加功能）
   - `perf:` 性能优化
   - `test:` 测试相关
   - `chore:` 构建过程或辅助工具的变动

9. **推送到你的 fork**

   ```bash
   git push origin feature/my-new-feature
   ```

10. **创建 Pull Request**

    - 进入你的 fork 页面
    - 点击 "Pull Request"
    - 填写 PR 描述：
      - 做了什么修改
      - 为什么需要这个修改
      - 如何测试

## 代码规范

### JavaScript 风格

- 使用 ES6+ 语法（箭头函数、模板字符串等）
- 使用 `const` 和 `let`，避免使用 `var`
- 使用有意义的变量名
- 添加必要的注释

### 文件组织

```
src/
├── utils/       # 工具函数
│   ├── logger.js
│   ├── loader.js
│   └── runner.js
├── core/        # 核心功能
│   ├── args.js
│   ├── confirm.js
│   ├── npm.js
│   ├── package.js
│   └── version.js
└── index.js     # 主入口
```

### 注释规范

```javascript
/**
 * 函数说明
 * @param {string} name - 参数说明
 * @returns {boolean} - 返回值说明
 */
function example(name) {
  // 实现逻辑
}
```

## 开发工具

项目使用以下工具：

- **Biome**：代码格式化和 lint
- **Lefthook**：Git hooks 管理
- **pnpm**：包管理器

## 测试

虽然目前还没有单元测试，但你可以：

1. 手动测试 CLI 功能
2. 使用 `--dry-run` 模式测试
3. 在不同操作系统上测试

我们欢迎添加测试相关的贡献！

## 文档

如果你修改了功能，请同时更新：

- README.md
- src/README.md
- CHANGELOG.md
- JSDoc 注释

## 审查流程

1. 提交 PR 后，维护者会进行审查
2. 可能会要求进行修改
3. 通过审查后，PR 会被合并
4. 你的贡献会出现在下一个版本的 CHANGELOG 中

## 获取帮助

如果有任何问题：

- 在 Issue 中提问
- 查看现有的 Issue 和 PR
- 阅读项目文档

## 行为准则

- 尊重所有贡献者
- 接受建设性的批评
- 关注对项目最有利的事情
- 对社区成员表示同理心

感谢你的贡献！🎉
