# 源代码结构说明

本目录包含 `republish-npm` 的所有核心代码，采用模块化设计，便于维护和测试。

## 目录结构

```
src/
├── utils/              # 工具模块
│   ├── logger.js       # 日志输出（log, warn, err）
│   ├── loader.js       # Loading 动画效果
│   └── runner.js       # 命令执行器
├── core/               # 核心功能模块
│   ├── args.js         # 命令行参数解析
│   ├── confirm.js      # 用户交互确认
│   ├── npm.js          # npm 相关操作
│   ├── package.js      # package.json 处理
│   └── version.js      # 版本过滤和筛选
└── index.js            # 主程序入口
```

## 模块说明

### utils/ - 工具模块

#### logger.js
提供统一的日志输出接口。

**导出函数：**
- `log(...args)` - 普通日志
- `warn(...args)` - 警告日志
- `err(...args)` - 错误日志

**示例：**
```javascript
const { log, warn, err } = require('./utils/logger');
log('操作成功');
warn('注意事项');
err('发生错误');
```

#### loader.js
提供 Loading 动画效果，增强用户体验。

**导出函数：**
- `startLoading(message)` - 启动 loading 动画
  - 返回对象：
    - `stop(successMsg)` - 停止并显示成功消息
    - `fail(errorMsg)` - 停止并显示失败消息

**示例：**
```javascript
const { startLoading } = require('./utils/loader');
const loader = startLoading('下载中...');
// ... 执行操作
loader.stop('下载完成');
// 或
loader.fail('下载失败');
```

#### runner.js
封装命令行执行逻辑。

**导出函数：**
- `run(cmd, args, opts)` - 同步执行命令
  - `cmd`: 命令名
  - `args`: 参数数组
  - `opts`: child_process.spawnSync 选项

**示例：**
```javascript
const { run } = require('./utils/runner');
const output = run('npm', ['--version']);
console.log(output); // 7.24.0
```

### core/ - 核心功能模块

#### args.js
解析和验证命令行参数。

**导出函数：**
- `parseArgs()` - 解析 process.argv，返回参数对象

**返回对象包含：**
- `from` - 源包名
- `to` - 目标包名
- `registry` - npm registry URL
- `versions` - 指定版本列表
- `exclude-versions` - 排除版本列表
- `access` - 访问权限
- `tag` - dist-tag
- `dry-run` - 演练模式
- `yes` - 跳过确认
- `keep-scripts` - 保留构建脚本

#### confirm.js
处理用户确认交互。

**导出函数：**
- `confirmOrExit(argv, from, to, callback)` - 显示确认提示并等待用户输入
  - `argv` - 参数对象
  - `from` - 源包名
  - `to` - 目标包名
  - `callback` - 确认后的回调函数

**特性：**
- 支持 `--yes` 跳过确认
- 支持 `--dry-run` 演练模式
- 错误处理和异常退出

#### npm.js
封装所有 npm 相关操作。

**导出函数：**
- `npmArgsWithRegistry(baseArgs, registry)` - 构建带 registry 的 npm 命令参数
- `ensureNpmAuth()` - 检查 npm 登录状态
- `getAllVersions(pkg, registry)` - 获取包的所有历史版本
- `packOneVersion(tmpDir, fromName, version, registry)` - 下载指定版本的包
- `extractToReadyDir(tgzPath, workRoot)` - 解压 tgz 包
- `publishOne(pkgDir, opts)` - 发布包到 npm

**示例：**
```javascript
const { getAllVersions, packOneVersion } = require('./core/npm');
const versions = getAllVersions('@scope/package', 'https://registry.npmjs.org');
const tgzPath = packOneVersion('/tmp', '@scope/package', '1.0.0', null);
```

#### package.js
处理 package.json 文件的读写和修改。

**导出函数：**
- `readJSON(path)` - 读取 JSON 文件
- `writeJSON(path, obj)` - 写入 JSON 文件
- `rewriteName(pkgDir, newName, keepScripts)` - 修改包名并清理脚本
  - 修改 package.json 中的 `name` 字段
  - 清理可能导致发布失败的 scripts
  - 清理 publishConfig 中的冲突配置

**清理的 scripts：**
- `prepublishOnly`
- `prepublish`
- `prepare`
- `prepack`

#### version.js
版本过滤和筛选逻辑。

**导出函数：**
- `filterVersions(versions, versionsArg, excludeVersionsArg)` - 根据参数过滤版本列表
  - `versions` - 所有版本数组
  - `versionsArg` - 包含的版本（逗号分隔字符串）
  - `excludeVersionsArg` - 排除的版本（逗号分隔字符串）

**逻辑：**
1. 如果指定 `versionsArg`，只保留指定的版本
2. 如果指定 `excludeVersionsArg`，排除这些版本
3. 两者可以同时使用

### index.js - 主程序

主程序入口，协调所有模块完成整个流程。

**主要流程：**
1. 解析命令行参数
2. 显示配置信息
3. 检查 npm 认证
4. 用户确认
5. 创建临时工作目录
6. 获取版本列表
7. 过滤版本
8. 循环处理每个版本：
   - 下载包
   - 解压
   - 修改 package.json
   - 发布
9. 汇总统计信息

**导出函数：**
- `main()` - 主函数

## 扩展和维护

### 添加新功能

1. **工具类功能**：在 `utils/` 目录添加新模块
2. **核心业务功能**：在 `core/` 目录添加新模块
3. **更新主流程**：修改 `index.js`

### 模块依赖关系

```
index.js
├── utils/logger.js
├── utils/loader.js (依赖 logger)
├── utils/runner.js
├── core/args.js (依赖 logger)
├── core/confirm.js (依赖 logger)
├── core/version.js
├── core/package.js (依赖 logger)
└── core/npm.js (依赖 logger, loader, runner)
```

### 测试建议

可以为每个模块编写单元测试：

```
tests/
├── utils/
│   ├── logger.test.js
│   ├── loader.test.js
│   └── runner.test.js
├── core/
│   ├── args.test.js
│   ├── version.test.js
│   └── package.test.js
└── integration.test.js
```

## 代码规范

- 使用 CommonJS 模块系统（`require`/`module.exports`）
- 函数命名使用驼峰式（camelCase）
- 导出对象使用对象字面量
- 保持向后兼容（Node.js >= 14.17.0）
- 适当的错误处理和日志输出

