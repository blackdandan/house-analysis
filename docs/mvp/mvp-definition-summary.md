# MVP Definition Summary

## 1. Workflow Responsibility

本工作流通过产品经理式的多轮澄清对话，将用户对于房产可视化系统的原始创意细化并收敛为具体的 MVP 产品定义。

**职责范围 (Responsible for)**:
* 梳理产品的目标用户、核心痛点、MVP 假设与最小价值闭环。
* 定义 MVP 的功能范围（P0 核心功能及 P1、Later 延期规划）。
* 规划产品的交互页面图表排版、用户流转路径及系统异常/空状态表现。
* 明确产品验收的 Given-When-Then 标准。
* 生成可在本地双击打开、高保真展示产品视觉意图的静态预览（Preview）。

**非职责范围 (Not responsible for)**:
* 技术架构选型（如开发语言、打包工具、部署云平台）。
* 数据库建模与物理表设计。
* API 接口规范与数据传输契约设计。
* 具体工程的开发任务拆分与代码实现。
* 真实网络请求与爬虫底表抓取代码编写。

## 2. Completion Condition (工作流完工确认)

* 用户确认了正式落盘生成: **是 (2026-06-10 21:19:59)**
* 用户确认了 MVP 产品文档: **是 (待用户审阅本目录文档后批复)**
* 用户确认了视觉预览范围与交互: **待生成预览并在浏览器双击打开审阅后批复**
* 用户确认了整个工作流定稿结束: **否 (待最终审阅完毕后定稿)**

## 3. Generated Artifacts (生成的正式产物清单)

| Artifact (产物名称) | Path (本地路径) | Purpose (核心目的) | Authoritative (唯一权威性) |
|---|---|---|---|
| MVP Document | `docs/mvp/MVP.md` | 产品 MVP 功能与范围的唯一事实源 (Source of Truth) | **Yes** |
| Discovery Log | `docs/mvp/discovery-log.md` | 记录需求澄清、用户问答及范围决策的决策链条 | No |
| Feature Scope | `docs/mvp/feature-scope.md` | 便于开发查阅的 P0/P1 功能范围分类清单表格 | No |
| User Flow | `docs/mvp/user-flow.md` | 描述用户主路径流程图、异常空状态及页面映射 | No |
| Acceptance Criteria | `docs/mvp/acceptance-criteria.md` | 提供 Given-When-Then 产品业务逻辑验收标准 | No |
| Data And States | `docs/mvp/data-and-states.md` | 定义产品级实体字段与多状态交互视觉反馈 | No |
| MVP Definition Summary | `docs/mvp/mvp-definition-summary.md` | 本工作流职责边界、产物清单及完工状态总结 | No |
| Preview README | `preview/mvp/README.md` | 说明静态预览网页的覆盖页面、状态与快捷使用说明 | No |
| Preview Entry | `preview/mvp/index.html` | 静态高保真视觉预览的前端主入口 HTML 文件 | No |
| Preview Styles | `preview/mvp/styles.css` | 静态预览的现代感暗黑风样式表（Vanilla CSS） | No |
| Preview Interactions | `preview/mvp/app.js` | 控制本地图表自主切换、地图聚合与抽屉展开逻辑 | No |
| Preview Mock Data | `preview/mvp/mock-data.js` | 集中存放 3 年大盘宏观及 3 个杭州典型小区的假数据 | No |

## 4. Preview Constraints (视觉预览约束说明)

* **纯本地假数据**：预览数据 100% 来源于本地 `mock-data.js`。
* **绝对无网络请求**：页面中不允许包含任何 fetch/XMLHttpRequest 异步请求，也不得依赖外部 API、远程 CDN 等线上资源。
* **不作为技术选型指标**：静态预览页面采用原生 HTML+CSS+JS 编写，以最优的前端视觉展现产品经理（PM）的产品设计意图（如同比环比折线图、地图聚合交互），并不承诺技术实现时的框架选择（例如技术开发时可自由选用 React、ECharts 等技术栈）。

## 5. Recommended Next Workflow (建议后续工作流)

1. **进入技术规划与架构设计工作流 (Technical Architecture & Database Design)**：
   * 编写数据库表结构设计（建立 `macro_indicator` 表及小区成交历史记录表）。
   * 规划杭州小区爬虫的技术方案（使用 Python Scrapy 还是 Node.js，设计如何规避贝壳反爬机制，评估爬虫频率和增量写入逻辑）。
   * 设计大盘 Excel 解析器的代码契约，定义标准模板列字段。
   * 选择前端地图库（如 ECharts Map、Leaflet）和图表库（如 Chart.js、Apache ECharts）。
2. **进入 AI 编码交付工作流 (AI Coding Delivery)**：
   * 根据技术规划正式开展前后端及爬虫的工程编写与联调，完成最终系统部署。

## 6. Open Questions (未决问题)

* 暂无未决的产品定义问题。
