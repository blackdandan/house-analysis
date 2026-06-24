# MVP Preview

本目录为“杭州房地产信息可视化系统”的静态高保真视觉预览（Preview）。用于协助用户确认页面范围、图表排列、交互逻辑与视觉氛围，非最终工程生产代码。

## How To Open (如何打开)

本项目已完成 Node.js 前端工程化适配，您可以通过以下两种方式之体验预览：

### 方式一：直接双击打开（无环境依赖）
在 Mac 上，直接双击或使用任意现代浏览器（推荐 Chrome 或 Safari）打开本目录下的：
[index.html](file:///Users/blackdandan/CodeXWorkSpace/house-analysis/preview/mvp/index.html)

### 方式二：通过本地静态服务打开（推荐）
1. 确保已安装 [Node.js](https://nodejs.org/) 环境。
2. 在 `preview/mvp/` 目录下执行依赖安装：
   ```bash
   npm install
   ```
3. 启动本地 Vite 静态服务器：
   ```bash
   npm run dev
   ```
4. 终端会输出本地访问地址（如 `http://localhost:5173`），在浏览器中打开该链接即可进行交互式体验。

## Covered Pages (覆盖的预览页面与交互状态)

| Page (页面) | Purpose (核心目的) | Covered States (覆盖的交互状态) |
|---|---|---|
| **大盘宏观看板** (`macro-dashboard`) | 研判全国房地产宏观价格与供需走势。 | 1. 70城新房/二手房均价折线趋势渲染；<br>2. 折线图同比 / 环比自由切换；<br>3. 全国新房面积与销售额双轴图；<br>4. 需求端与供给端基本面 Tab 切换联动；<br>5. **[V2 新增] 折线图与双轴图鼠标悬停 Tooltip 动态高亮和磨砂卡片热点呈现**。 |
| **杭州局部地图** (`hz-map-view`) | 在地图上直观搜寻、比价和定位小区。 | 1. **[V2 升级] 真实的 9 个行政区级高精度边界多边形 SVG 底图与均价聚合气泡**；<br>2. 放大地图后，热力区域平滑过渡为具体小区（共 11 个）的散点打点图；<br>3. 点击小区标点，右侧滑出抽屉，显示 12 个月挂牌趋势，并提供“加入对比”；<br>4. 支持模糊搜索定位小区。 |
| **小区对比分析** (`community-compare`) | 多角度、多维度切换比对小区性价比和户型偏好。 | 1. **[V2 升级] 2 ~ 4 个小区的多选对比暂存池**；<br>2. **[V2 升级] 自定义小区复选框浮层下拉框，支持勾选 2~4 个小区进行跨盘 PK**；<br>3. 均价折线图（多条自适应）、成交柱状图（多组并排）、户型占比饼图（多饼并排）自适应渲染；<br>4. **[V2 升级] 对照表格自适应动态生成多列展现指标极差与同环比对比**；<br>5. 图表切换联动与空数据重合状态的友好展示。 |
| **数据导入后台** (`admin-portal`) | 模拟管理员上传 Excel 及监控爬虫抓取。 | 1. 模拟拖拽 Excel 校验与解析进度条效果；<br>2. 校验成功或失败的警报提示反馈；<br>3. 模拟展示杭州小区爬虫每日抓取日志、抓取率、成功率。 |

## Mock Data (本地假数据)

所有的模拟数据均集中存放于：
[mock-data.js](file:///Users/blackdandan/CodeXWorkSpace/house-analysis/preview/mvp/mock-data.js)

数据涵盖 2023年1月至2026年6月 的月度宏观经济指标，以及杭州“学雅苑”、“翡翠城”、“柳浪东苑”、“武林壹号”、“良渚文化村”等共 11 个典型小区的标准化户型 18 个月成交历史与单价字典。

## Constraints (预览限制说明)

* 本预览 **100% 基于本地假数据运行**，绝不发起任何网络请求。
* 本预览不需要配置任何本地服务器容器，双击 `index.html` 即可完整体验。
* 预览中展现的所有地图、折线、柱状、饼图均采用原生 SVG/Canvas 动态绘制，代表视觉和布局意图，不绑定任何特定的技术开发框架。

## Regression Testing (自动化回归测试)

为防止前端 JS 代码在迭代中引入运行时报错（如 TDZ、undefined 异常等），本项目配置了无浏览器依赖的 Node.js 仿真回归测试。
该脚本通过高精度 Mock 浏览器 DOM/Canvas 环境，执行完整的 DOMContentLoaded 初始化及高阶交互流（如 Tab 切换、图表模式变更、数据对比等）。

在 `preview/mvp/` 目录下执行以下命令运行测试：
```bash
npm run test
# 或者手动执行
node validate_preview.js
```
运行结束后，若看到 `🎉 SUCCESS: All interactive simulations executed without errors!` 字样，则代表代码无异常。
