# 项目架构说明

## 📦 项目概述

`republish-npm` 是一个 Node.js CLI 工具，用于将 npm 包的历史版本批量改名并重新发布到新包名下。

## 📁 目录结构

```
republish-npm/
├── cli.js                  # CLI 入口文件（bin）
├── src/                    # 源代码目录
│   ├── index.js           # 主程序逻辑
│   ├── core/              # 核心功能模块
│   │   ├── args.js        # 命令行参数解析
│   │   ├── confirm.js     # 用户交互确认
│   │   ├── npm.js         # npm 相关操作
│   │   ├── package.js     # package.json 处理
│   │   └── version.js     # 版本过滤逻辑
│   └── utils/             # 工具函数
│       ├── logger.js      # 日志输出
│       ├── loader.js      # Loading 动画
│       └── runner.js      # 命令执行
├── package.json           # 项目配置
├── README.md              # 用户文档
├── PUBLISH.md             # 发布指南
├── ARCHITECTURE.md        # 架构说明（本文件）
├── LICENSE                # MIT 许可证
├── .npmignore             # npm 发布忽略配置
└── .gitignore             # git 忽略配置
```

## 🏗️ 架构设计

### 分层架构

```
┌─────────────────────────────────────┐
│         CLI Entry (cli.js)          │  ← 命令行入口
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│      Main Process (src/index.js)    │  ← 主流程控制
└─────────────────────────────────────┘
           ↓           ↓
┌──────────────┐  ┌──────────────┐
│  Core Layer  │  │ Utils Layer  │
│  (src/core/) │  │ (src/utils/) │
└──────────────┘  └──────────────┘
```

### 模块职责

#### 1. CLI 层 (cli.js)

- **职责**：作为可执行文件入口
- **功能**：
  - 设置 shebang (`#!/usr/bin/env node`)
  - 引入并执行主程序

#### 2. 主程序层 (src/index.js)

- **职责**：协调所有模块，控制整体流程
- **功能**：
  - 解析参数
  - 显示配置信息
  - 认证检查
  - 用户确认
  - 创建临时目录
  - 版本筛选
  - 批量处理包
  - 错误处理和统计

#### 3. 核心功能层 (src/core/)

**args.js - 参数解析**

- 解析命令行参数
- 验证参数合法性
- 显示帮助信息

**confirm.js - 用户确认**

- 交互式确认提示
- 处理 `--yes` 和 `--dry-run`
- 错误处理

**npm.js - npm 操作**

- 认证检查 (`npm whoami`)
- 获取版本列表 (`npm view`)
- 下载包 (`npm pack`)
- 发布包 (`npm publish`)
- 解压 tgz 文件

**package.js - package.json 处理**

- 读写 JSON 文件
- 修改包名
- 清理构建脚本
- 移除冲突配置

**version.js - 版本过滤**

- 版本包含筛选
- 版本排除筛选
- 支持组合筛选

#### 4. 工具层 (src/utils/)

**logger.js - 日志工具**

- 统一的日志输出接口
- 支持普通、警告、错误三种级别

**loader.js - Loading 动画**

- Spinner 动画效果
- 成功/失败状态切换
- 提升用户体验

**runner.js - 命令执行**

- 封装 `child_process.spawnSync`
- 统一的错误处理
- 返回标准输出

## 🔄 数据流

```
1. 用户输入命令
   ↓
2. parseArgs() 解析参数
   ↓
3. ensureNpmAuth() 检查认证
   ↓
4. confirmOrExit() 用户确认
   ↓
5. getAllVersions() 获取版本列表
   ↓
6. filterVersions() 过滤版本
   ↓
7. 循环处理每个版本：
   ├─ packOneVersion()      下载包
   ├─ extractToReadyDir()   解压
   ├─ rewriteName()         修改包名
   └─ publishOne()          发布
   ↓
8. 统计并输出结果
```

## 🎯 设计原则

### 1. 单一职责原则

每个模块只负责一个明确的功能，便于理解和维护。

### 2. 模块化设计

- **高内聚**：相关功能集中在同一模块
- **低耦合**：模块间通过明确的接口通信
- **可测试**：每个模块都可以独立测试

### 3. 向后兼容

- 使用 CommonJS 模块系统
- 支持 Node.js >= 14.17.0
- 不使用实验性 API

### 4. 用户体验优先

- 清晰的进度提示
- Loading 动画反馈
- 详细的错误信息
- 友好的交互确认

## 🔌 扩展性

### 添加新功能的步骤

1. **确定功能类型**

   - 工具类 → `src/utils/`
   - 核心业务 → `src/core/`

2. **创建新模块文件**

   ```javascript
   // src/core/new-feature.js
   function newFeature() {
     // 实现功能
   }

   module.exports = { newFeature };
   ```

3. **在主程序中引入**

   ```javascript
   // src/index.js
   const { newFeature } = require("./core/new-feature");
   ```

4. **更新文档**
   - 更新 `src/README.md`
   - 更新本文档
   - 更新用户 `README.md`

### 测试建议

```
tests/
├── unit/              # 单元测试
│   ├── core/
│   └── utils/
├── integration/       # 集成测试
└── e2e/              # 端到端测试
```

## 📊 依赖关系图

```
index.js
├── core/args.js
│   └── utils/logger.js
├── core/confirm.js
│   └── utils/logger.js
├── core/version.js
├── core/package.js
│   └── utils/logger.js
└── core/npm.js
    ├── utils/logger.js
    ├── utils/loader.js
    └── utils/runner.js
```

## 🔒 安全考虑

1. **输入验证**

   - 参数合法性检查
   - 版本号格式验证

2. **临时文件管理**

   - 使用系统临时目录
   - 自动清理（由操作系统负责）

3. **错误处理**
   - 网络错误识别
   - 及时终止异常流程
   - 防止数据损坏

## 📝 代码规范

- **命名规范**：驼峰式命名（camelCase）
- **缩进**：2 空格
- **注释**：函数和复杂逻辑需要注释
- **错误处理**：使用 try-catch 或错误回调
- **日志输出**：使用统一的 logger 模块

## 🚀 性能优化

- **同步操作**：使用同步 API，简化流程
- **临时目录**：使用系统临时目录，自动清理
- **错误快速失败**：网络错误时提前终止

## 📚 参考资源

- [Node.js 官方文档](https://nodejs.org/docs/)
- [npm CLI 文档](https://docs.npmjs.com/cli/)
- [minimist 参数解析](https://github.com/minimistjs/minimist)
- [tar 模块](https://github.com/npm/node-tar)
