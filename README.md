# republish-npm

**Node >= 14.17.0**。批量将旧包的历史版本改名并重新发布到新包名。

## 用法

```bash
republish-npm --from <旧包名> --to <新包名> [选项]
```

### 示例

#### 使用 npm 默认 registry（读取你的 .npmrc / 环境变量）

republish-npm --from @old-scope/pkg --to @new-scope/pkg

#### 指定 registry

republish-npm --from foo --to @new/foo --registry https://registry.npmjs.org

#### 仅迁移部分版本 + 演练

republish-npm --from foo --to bar --versions 1.0.0,1.0.2 --dry-run

#### 跳过交互确认

republish-npm --from foo --to bar --yes

### 参数

- --from（必填）：旧包名
- --to（必填）：新包名
- --registry（可选）：自定义 registry；不传则使用 npm 默认配置
- --versions（可选）：逗号分隔列表，仅处理这些版本
- --dry-run（可选）：演练模式，仅打印命令不发布
- --yes（可选）：跳过确认
- --access（可选）：public（默认）或 restricted
- --tag（可选）：发布 dist-tag
