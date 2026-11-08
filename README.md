# 正则表达式生成器

粘贴一段示例文本，点击匹配建议，即可生成正则表达式。你还可以添加捕获组、查看多种编程语言的代码示例，或复制分享链接。链接会保留示例文本、选中的建议和生成选项。

界面支持简体中文和英文。首次访问跟随浏览器语言，手动切换后会记住语言偏好。

## 项目来源与主要改动

本项目在 [Olaf Neumann 的正则表达式生成器](https://github.com/noxone/regex-generator) 基础上修改，保留了原项目从示例文本选取匹配模式并生成正则表达式的操作流程。

- **中英双语。** 翻译了界面、匹配建议和使用指南。切换语言时保留当前输入和生成结果。
- **前端迁移。** 将 Kotlin 应用迁移至 TypeScript 和 Vite，使用 npm 构建和测试。代码示例仍支持 Kotlin。
- **静态部署。** 添加 GitHub Actions 发布流程，支持 GitHub Pages 仓库子路径和旧分享链接。
- **交互改进。** 默认展开捕获组。

## 本地开发

需要 Node.js 24 和 npm。应用采用 TypeScript、原生 DOM 和 Vite，在浏览器中生成正则表达式。

```sh
npm ci
npm run dev
```

## 测试与构建

| 命令 | 用途 |
| --- | --- |
| `npm run typecheck` | 检查 TypeScript 类型 |
| `npm test` | 运行 Vitest 单元测试 |
| `npm run build` | 构建静态站点到 `dist/` |
| `npm run preview` | 预览已构建的站点 |
| `npm run test:e2e` | 构建站点，并用 Playwright 测试根路径及仓库子路径 |

首次运行端到端测试前，请执行 `npx playwright install chromium`。

## 目录结构

### 源码与资源

```text
src/
├── main.ts                      浏览器入口，初始化界面并绑定事件
├── core/                        模式识别、生成和状态逻辑
│   ├── regex.ts                 查找匹配建议并将选中的模式组合成正则表达式
│   ├── recognizer-data.ts       内置的文本识别规则
│   ├── state.ts                 管理输入、选区、选项、浏览器存储和分享链接
│   ├── snippets.ts              处理各语言的正则转义、选项和代码生成
│   └── snippet-data.ts          各语言的代码模板与选项映射
├── ui/
│   └── groups.ts                添加、编辑和删除捕获组，处理编辑弹窗
├── i18n/                        本地化与使用指南
│   ├── locale.ts                翻译界面和匹配建议，记住语言偏好
│   ├── user-guide.en.json        英文引导的步骤和文案
│   └── user-guide.zh-CN.json     简体中文引导的步骤和文案
└── assets/                      由 Vite 随应用打包的资源
    ├── styles/
    │   ├── regex-generator.css  页面、匹配建议和捕获组样式
    │   └── driver.min.css        Driver.js 引导样式
    ├── images/
    │   ├── cursor-rg-match-item-16.png              匹配建议的自定义光标
    │   └── cursor-rg-match-selection-delete-32.png   取消已选建议的自定义光标
    └── libraries/prismjs/
        ├── prismjs.js           Prism 语法高亮及语言规则
        └── prismjs.css          代码高亮主题
public/                          构建时原样复制的静态资源
├── app.webmanifest              网页应用名称、启动路径、主题颜色和图标配置
└── favicon/                     浏览器标签页、主屏幕快捷方式和网页应用图标
```

### 测试与 GitHub 配置

```text
tests/
├── unit/
│   ├── regex.test.ts            验证匹配识别、正则生成、状态和分享链接
│   └── fixtures/snippets.json   用于比对各语言生成结果的预期代码示例
└── e2e/
    ├── site.spec.ts             验证双语、选区、捕获组、复制和刷新等浏览器交互
    └── serve-dist.mjs           将生产产物挂载到根路径和仓库子路径供测试
.github/
├── workflows/
│   ├── pages.yml                运行检查，并从 main 分支发布到 GitHub Pages
│   └── update-copyright.yml     定时或手动检查许可证年份，有变更时提交 PR
├── ISSUE_TEMPLATE/
│   └── issue.md                 通用问题反馈与建议模板
└── PULL_REQUEST_TEMPLATE.md     PR 改动说明与验证清单
```

### 根目录文件

| 文件 | 用途 |
| --- | --- |
| `index.html` | 页面 HTML 入口，包含基础结构和静态文案。 |
| `package.json` | 项目元数据、Node.js 版本要求、npm 命令和依赖范围。 |
| `package-lock.json` | 记录实际解析的依赖版本，供 `npm ci` 复现安装。 |
| `tsconfig.json` | TypeScript 编译选项和类型检查范围。 |
| `vite.config.ts` | Vite 构建配置和 Vitest 测试文件范围。 |
| `playwright.config.ts` | 浏览器测试目录、测试服务器和启动参数。 |
| `renovate.json` | Renovate 依赖更新配置。 |
| `.gitattributes` | Git 的文本文件和换行符规则。 |
| `.gitignore` | 排除本地依赖、构建产物、测试报告和编辑器配置。 |
| `LICENSE` | MIT 许可证及原作者和修改者的版权声明。 |
| `README.md` | 项目简介、开发命令和目录说明。 |

`node_modules/`、`dist/`、`test-results/` 和 `playwright-report/` 分别由依赖安装、生产构建和测试生成。
