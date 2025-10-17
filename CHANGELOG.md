# 更新日志

所有重要的项目更改都将记录在此文件中。

## [0.2.0] - 2025-01-16

### ✨ 新功能

- **跨 registry 支持**：添加 `--from-registry` 和 `--to-registry` 参数
  - 支持从一个 registry 下载包，发布到另一个 registry
  - 适用场景：公司私有仓库 ↔ npm 公共仓库迁移
  - 这两个参数必须同时指定，否则报错
  - 保持 `--registry` 参数独立支持（用于源和目标使用同一个 registry）

### 🔧 改进

- 添加参数校验逻辑
  - `--from-registry` 和 `--to-registry` 必须成对出现
  - `--registry` 不能与 `--from-registry`/`--to-registry` 同时使用
  - 提供清晰的错误提示和使用建议

### 📚 文档更新

- 更新 README.md，添加跨 registry 迁移示例
- 更新命令行帮助文档
- 添加使用场景说明

### 🤖 CI/CD

- **GitHub Actions 自动发布**：添加完整的 CI/CD 工作流
  - `.github/workflows/publish.yml`：基于 tag 自动发布到 npm
  - `.github/workflows/test.yml`：多版本 Node.js 和多系统测试
  - 自动创建 GitHub Release
  - 支持 npm provenance
- 添加发布相关文档
  - `.github/RELEASE.md`：详细的发布流程指南
  - `.github/CONTRIBUTING.md`：贡献者指南
- 优化 npm scripts
  - `release:patch/minor/major`：版本发布脚本
  - 自动推送 tag 触发 CI/CD

## [0.1.1] - 2025-01-16

### ♻️ 重构

- **代码模块化重构**：将单文件 `cli.js` (535 行) 拆分为多个模块
  - 创建 `src/` 目录存放源代码
  - 按功能拆分为 `core/` 和 `utils/` 两个子目录
  - 提高代码可维护性和可测试性

### 📁 新增文件结构

```
src/
├── utils/
│   ├── logger.js      # 日志工具 (17行)
│   ├── loader.js      # Loading 动画 (25行)
│   └── runner.js      # 命令执行 (22行)
├── core/
│   ├── args.js        # 参数解析 (59行)
│   ├── confirm.js     # 用户确认 (47行)
│   ├── npm.js         # npm 操作 (103行)
│   ├── package.js     # package.json 处理 (74行)
│   └── version.js     # 版本过滤 (48行)
└── index.js           # 主流程 (174行)
```

### 📚 新增文档

- `src/README.md` - 源代码模块说明
- `ARCHITECTURE.md` - 项目架构文档
- `CHANGELOG.md` - 更新日志（本文件）

### 🔧 配置更新

- 更新 `package.json`：
  - `main` 指向 `src/index.js`
  - `files` 包含 `src/` 目录
- 更新 `.npmignore`：排除开发文档

### ✨ 改进

- 模块职责单一，易于理解
- 便于编写单元测试
- 支持独立模块复用
- 降低代码耦合度

## [0.1.0] - 2025-01-16

### 🎉 初始版本

- 基本功能实现
- 支持批量重新发布 npm 包
- 支持版本筛选和排除
- 自动清理构建脚本
- Loading 动画和进度提示
- 用户交互确认
- 错误处理和统计

### ✨ 核心特性

- 🔒 自动清理可能导致发布失败的构建脚本
- 🧹 自动移除 publishConfig.registry
- 📊 实时进度显示和 Loading 动画
- ⚠️ 智能错误处理，网络错误时提前终止
- 🎯 支持指定版本或全量迁移
- 🚫 支持排除特定版本

### 📦 发布配置

- 添加 MIT 许可证
- 配置 npm 发布设置
- 创建发布指南文档

---

## 版本说明

版本号格式：`主版本号.次版本号.修订号`

- **主版本号**：不兼容的 API 修改
- **次版本号**：向后兼容的功能性新增
- **修订号**：向后兼容的问题修正
