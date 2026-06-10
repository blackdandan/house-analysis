// 杭州房地产信息可视化系统 - MVP Preview 交互逻辑
// 100% 纯本地运行，不发起任何网络请求，使用原生 Canvas 手绘高颜值图表，使用 SVG 绘制杭州交互地图。

document.addEventListener("DOMContentLoaded", () => {
  const data = window.MVP_PREVIEW_DATA;
  if (!data) {
    console.error("未能加载 mock-data.js 中的演示数据！");
    return;
  }

  // --- 全局变量状态 ---
  let activeTab = "macro-dashboard";
  let activeSubTab = "demand-side";
  let compareChartType = "line";   // 对比图表类型: line | bar | pie
  let compareRoomType = "三居";     // 对比户型筛选
  let compareTimeRange = 18;       // 对比时间跨度
  let mapZoomLevel = "district";   // 地图缩放级别: district (聚合) | community (打点)
  let selectedMapCommunity = null; // 当前在地图上点选的小区
  let compareCart = ["comm_01", "comm_02"]; // 全局对比池暂存器 (支持 2~4 个小区)

  // 原生 Canvas 绘制参数设定
  const chartStyles = {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    gridColor: "rgba(255, 255, 255, 0.05)",
    textColor: "#94a3b8",
    whiteColor: "#f1f5f9",
    primaryColor: "#3b82f6",
    cyanColor: "#22d3ee",
    purpleColor: "#a78bfa",
    dangerColor: "#ef4444",
    successColor: "#10b981",
    warningColor: "#f59e0b"
  };

  // --- 视图与 DOM 缓存 ---
  const navButtons = document.querySelectorAll(".nav-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const subTabButtons = document.querySelectorAll(".panel-tab-btn");
  const subTabPanes = document.querySelectorAll(".subtab-content");
  
  // --- 初始化运行 ---
  initNavigation();
  initSubTabs();
  initMacroDashboard();
  initHzMap();
  initCompareSelector();
  initAdminPortal();
  updateCompareFloatBadge();

  // ==========================================
  // 1. 导航与 Tab 切换管理
  // ==========================================
  function initNavigation() {
    navButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");
        
        // 切换导航高亮
        navButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        
        // 切换面板显示
        tabPanes.forEach(pane => {
          pane.classList.remove("active");
          if (pane.id === targetTab) {
            pane.classList.add("active");
          }
        });

        activeTab = targetTab;
        
        // 当切换到对比页面时，拉取最新对比配置重新渲染
        if (targetTab === "community-compare") {
          renderCompareDashboard();
        }
      });
    });
  }

  function initSubTabs() {
    subTabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetSub = btn.getAttribute("data-subtab");
        
        subTabButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        
        subTabPanes.forEach(pane => {
          pane.classList.remove("active");
          if (pane.id === "subtab-" + targetSub) {
            pane.classList.add("active");
          }
        });

        activeSubTab = targetSub;
        // 延迟渲染子 Tab 内的 Canvas 确保 DOM 尺寸正确
        setTimeout(() => {
          if (targetSub === "demand-side") renderDemandCharts();
          if (targetSub === "supply-side") renderSupplyCharts();
        }, 50);
      });
    });
  }

  // ==========================================
  // 2. 原生 Canvas 高颜值绘图引擎 (手绘图表)
  // ==========================================

  // 设备像素比自适应，解决 Canvas 模糊问题
  function setupCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    return { ctx, width: rect.width, height: rect.height };
  }

    function drawLineChart(canvasId, labels, datasets, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const { ctx, width, height } = setupCanvas(canvas);
    const padding = { top: 30, right: 30, bottom: 40, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // 寻找数值极限
    let allValues = datasets.flatMap(d => d.data);
    if (options.yMinBaseline !== undefined) allValues.push(options.yMinBaseline);
    let maxVal = Math.max(...allValues, 1);
    let minVal = Math.min(...allValues, 0);
    const valRange = maxVal - minVal;
    maxVal = maxVal + valRange * 0.1;
    minVal = minVal - valRange * 0.1;

    // 缓存当前的绘制参数以便在 mousemove 中重绘
    canvas.chartData = { labels, datasets, options };

    function drawBase(hoverIdx = -1) {
      ctx.clearRect(0, 0, width, height);

      // 绘制网格线
      const gridRows = 5;
      ctx.strokeStyle = chartStyles.gridColor;
      ctx.lineWidth = 1;
      ctx.fillStyle = chartStyles.textColor;
      ctx.font = `10px ${chartStyles.fontFamily}`;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      for (let i = 0; i <= gridRows; i++) {
        const val = minVal + (maxVal - minVal) * (i / gridRows);
        const y = padding.top + chartH - (i / gridRows) * chartH;
        
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartW, y);
        ctx.stroke();

        let labelText = val.toFixed(options.decimals !== undefined ? options.decimals : 1);
        if (options.isPercentage) labelText += "%";
        ctx.fillText(labelText, padding.left - 10, y);
      }

      // 环比基准线
      if (options.yMinBaseline !== undefined) {
        const yBaseline = padding.top + chartH - ((options.yMinBaseline - minVal) / (maxVal - minVal)) * chartH;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(padding.left, yBaseline);
        ctx.lineTo(padding.left + chartW, yBaseline);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.textAlign = "left";
        ctx.fillText(`环比基准线 (${options.yMinBaseline}%)`, padding.left + 10, yBaseline - 8);
      }

      // 绘制横轴标签
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = chartStyles.textColor;
      const labelStep = Math.max(1, Math.ceil(labels.length / 8));
      for (let i = 0; i < labels.length; i++) {
        if (i % labelStep === 0 || i === labels.length - 1) {
          const x = padding.left + (i / (labels.length - 1)) * chartW;
          ctx.fillText(labels[i], x, padding.top + chartH + 10);
        }
      }

      // 绘制数据集
      datasets.forEach((dataset, datasetIdx) => {
        const color = dataset.color || chartStyles.primaryColor;
        
        // 1. 面积填充
        const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
        grad.addColorStop(0, color.replace("1)", "0.15)"));
        grad.addColorStop(1, color.replace("1)", "0)"));
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + chartH);
        for (let i = 0; i < dataset.data.length; i++) {
          const x = padding.left + (i / (dataset.data.length - 1)) * chartW;
          const y = padding.top + chartH - ((dataset.data[i] - minVal) / (maxVal - minVal)) * chartH;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(padding.left + chartW, padding.top + chartH);
        ctx.closePath();
        ctx.fill();

        // 2. 实折线
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = color.replace("1)", "0.3)");
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        for (let i = 0; i < dataset.data.length; i++) {
          const x = padding.left + (i / (dataset.data.length - 1)) * chartW;
          const y = padding.top + chartH - ((dataset.data[i] - minVal) / (maxVal - minVal)) * chartH;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 3. 绘制节点圆圈
        ctx.fillStyle = color;
        ctx.strokeStyle = "#0d111a";
        ctx.lineWidth = 1.5;
        
        const showAllDots = dataset.data.length <= 20;
        for (let i = 0; i < dataset.data.length; i++) {
          if (showAllDots || i === 0 || i === dataset.data.length - 1) {
            const x = padding.left + (i / (dataset.data.length - 1)) * chartW;
            const y = padding.top + chartH - ((dataset.data[i] - minVal) / (maxVal - minVal)) * chartH;
            ctx.beginPath();
            ctx.arc(x, y, showAllDots ? 3.5 : 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }
      });

      // 绘制图例
      renderChartLegend(ctx, padding.left + 20, 15, datasets);
    }

    // 执行初始绘制
    drawBase(-1);

    // 绑定交互
    canvas.onmousemove = function(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const idx = Math.round(((mx - padding.left) / chartW) * (labels.length - 1));
      if (idx >= 0 && idx < labels.length && mx >= padding.left && mx <= padding.left + chartW) {
        if (canvas.lastHoverIdx !== idx) {
          canvas.lastHoverIdx = idx;
          drawBase(idx);
          drawTooltip(idx, mx, my);
        }
      } else {
        if (canvas.lastHoverIdx !== -1) {
          canvas.lastHoverIdx = -1;
          drawBase(-1);
        }
      }
    };

    canvas.onmouseleave = function() {
      canvas.lastHoverIdx = -1;
      drawBase(-1);
    };

    function drawTooltip(hoverIdx, mx, my) {
      // 1. 绘制垂直指引虚线
      const vx = padding.left + (hoverIdx / (labels.length - 1)) * chartW;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(vx, padding.top);
      ctx.lineTo(vx, padding.top + chartH);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. 绘制各数据集高亮大圆点
      datasets.forEach(dataset => {
        const color = dataset.color || chartStyles.primaryColor;
        const val = dataset.data[hoverIdx];
        if (val === undefined) return;
        const vy = padding.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;
        
        ctx.fillStyle = color;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(vx, vy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = color.replace("1)", "0.3)");
        ctx.beginPath();
        ctx.arc(vx, vy, 11, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. 绘制磨砂玻璃 Tooltip 卡片
      const tooltipW = 160;
      const rowH = 18;
      const tooltipH = 24 + datasets.length * rowH + 10;
      
      let tx = mx + 15;
      let ty = my - tooltipH / 2;
      if (tx + tooltipW > width) {
        tx = mx - tooltipW - 15;
      }
      if (ty < 5) ty = 5;
      if (ty + tooltipH > height - 5) ty = height - tooltipH - 5;

      // 绘制磨砂卡片圆角背景和青发光边框
      ctx.fillStyle = "rgba(10, 15, 25, 0.95)";
      ctx.strokeStyle = "rgba(34, 211, 238, 0.6)"; 
      ctx.lineWidth = 1.5;
      
      ctx.shadowColor = "rgba(0, 229, 255, 0.2)";
      ctx.shadowBlur = 12;
      drawRoundedRect(ctx, tx, ty, tooltipW, tooltipH, 8);
      ctx.fill();
      ctx.stroke();
      
      ctx.shadowBlur = 0; 

      // 写文本
      ctx.fillStyle = "#94a3b8";
      ctx.font = `bold 10px ${chartStyles.fontFamily}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(labels[hoverIdx], tx + 12, ty + 10);

      datasets.forEach((dataset, idx) => {
        const val = dataset.data[hoverIdx];
        const valStr = val !== undefined ? val.toFixed(options.decimals !== undefined ? options.decimals : 1) + (options.isPercentage ? "%" : "") : "无";
        
        const ry = ty + 24 + idx * rowH;
        
        ctx.fillStyle = dataset.color || chartStyles.primaryColor;
        ctx.beginPath();
        ctx.arc(tx + 16, ry + 6, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#f1f5f9";
        ctx.font = `10px ${chartStyles.fontFamily}`;
        
        let labelText = dataset.label.split(" ")[0]; 
        if (labelText.length > 8) labelText = labelText.substring(0, 7) + "..";
        ctx.fillText(labelText, tx + 26, ry + 1);

        ctx.textAlign = "right";
        ctx.fillStyle = "#22d3ee"; 
        ctx.fillText(valStr, tx + tooltipW - 12, ry + 1);
        ctx.textAlign = "left"; 
      });
    }
  }

  function drawBarChart(canvasId, labels, datasets, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const { ctx, width, height } = setupCanvas(canvas);
    const padding = { top: 30, right: 50, bottom: 40, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const barDatasets = datasets.filter(d => d.type === "bar" || !d.type);
    const lineDatasets = datasets.filter(d => d.type === "line");

    let barValues = barDatasets.flatMap(d => d.data);
    let maxBarVal = Math.max(...barValues, 1);
    maxBarVal = maxBarVal * 1.15; 
    
    let maxLineVal = 10;
    let minLineVal = -10;
    if (lineDatasets.length > 0) {
      let lineValues = lineDatasets.flatMap(d => d.data);
      maxLineVal = Math.max(...lineValues, 1);
      minLineVal = Math.min(...lineValues, -5);
      const range = maxLineVal - minLineVal;
      maxLineVal = maxLineVal + range * 0.1;
      minLineVal = minLineVal - range * 0.1;
    }

    function drawBase(hoverIdx = -1) {
      ctx.clearRect(0, 0, width, height);

      const gridRows = 5;
      ctx.strokeStyle = chartStyles.gridColor;
      ctx.lineWidth = 1;
      ctx.fillStyle = chartStyles.textColor;
      ctx.font = `10px ${chartStyles.fontFamily}`;

      for (let i = 0; i <= gridRows; i++) {
        const y = padding.top + chartH - (i / gridRows) * chartH;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartW, y);
        ctx.stroke();

        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        const leftVal = (maxBarVal * (i / gridRows));
        ctx.fillText(leftVal.toFixed(0), padding.left - 10, y);

        if (lineDatasets.length > 0) {
          ctx.textAlign = "left";
          const rightVal = minLineVal + (maxLineVal - minLineVal) * (i / gridRows);
          ctx.fillText(rightVal.toFixed(1) + "%", padding.left + chartW + 10, y);
        }
      }

      if (lineDatasets.length > 0 && minLineVal < 0) {
        const yZero = padding.top + chartH - ((0 - minLineVal) / (maxLineVal - minLineVal)) * chartH;
        ctx.strokeStyle = "rgba(239, 68, 68, 0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding.left, yZero);
        ctx.lineTo(padding.left + chartW, yZero);
        ctx.stroke();
      }

      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = chartStyles.textColor;
      const labelStep = Math.max(1, Math.ceil(labels.length / 8));
      for (let i = 0; i < labels.length; i++) {
        if (i % labelStep === 0 || i === labels.length - 1) {
          const x = padding.left + (i / (labels.length - 1)) * chartW;
          ctx.fillText(labels[i], x, padding.top + chartH + 10);
        }
      }

      // 绘制柱体
      const barGroupCount = barDatasets.length;
      const itemWidth = chartW / labels.length;
      const barSpacing = 2;
      const totalBarW = itemWidth * 0.6;
      const singleBarW = (totalBarW - (barSpacing * (barGroupCount - 1))) / barGroupCount;

      for (let i = 0; i < labels.length; i++) {
        const centerX = padding.left + (i / (labels.length - 1)) * chartW;
        const startX = centerX - totalBarW / 2;

        const isHover = hoverIdx === i;

        barDatasets.forEach((dataset, dIdx) => {
          const x = startX + dIdx * (singleBarW + barSpacing);
          const val = dataset.data[i] || 0;
          const barHeight = (val / maxBarVal) * chartH;
          const y = padding.top + chartH - barHeight;

          const grad = ctx.createLinearGradient(0, y, 0, padding.top + chartH);
          const baseColor = dataset.color || chartStyles.primaryColor;
          grad.addColorStop(0, isHover ? baseColor.replace("0.8)", "1)").replace("1)", "1)") : baseColor);
          grad.addColorStop(1, baseColor.replace("1)", "0.2)").replace("0.8)", "0.15)"));
          ctx.fillStyle = grad;

          drawRoundedRect(ctx, x, y, singleBarW, barHeight, { tl: 3, tr: 3, bl: 0, br: 0 });
          ctx.fill();

          if (isHover) {
            ctx.strokeStyle = "rgba(255,255,255,0.8)";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      }

      // 绘制双轴折线
      lineDatasets.forEach(dataset => {
        const color = dataset.color || chartStyles.cyanColor;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < dataset.data.length; i++) {
          const x = padding.left + (i / (dataset.data.length - 1)) * chartW;
          const y = padding.top + chartH - ((dataset.data[i] - minLineVal) / (maxLineVal - minLineVal)) * chartH;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.strokeStyle = "#0d111a";
        ctx.lineWidth = 1.5;
        for (let i = 0; i < dataset.data.length; i++) {
          const x = padding.left + (i / (dataset.data.length - 1)) * chartW;
          const y = padding.top + chartH - ((dataset.data[i] - minLineVal) / (maxLineVal - minLineVal)) * chartH;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      });

      renderChartLegend(ctx, padding.left + 20, 15, datasets);
    }

    drawBase(-1);

    canvas.onmousemove = function(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const idx = Math.round(((mx - padding.left) / chartW) * (labels.length - 1));
      if (idx >= 0 && idx < labels.length && mx >= padding.left && mx <= padding.left + chartW) {
        if (canvas.lastHoverIdx !== idx) {
          canvas.lastHoverIdx = idx;
          drawBase(idx);
          drawTooltip(idx, mx, my);
        }
      } else {
        if (canvas.lastHoverIdx !== -1) {
          canvas.lastHoverIdx = -1;
          drawBase(-1);
        }
      }
    };

    canvas.onmouseleave = function() {
      canvas.lastHoverIdx = -1;
      drawBase(-1);
    };

    function drawTooltip(hoverIdx, mx, my) {
      const vx = padding.left + (hoverIdx / (labels.length - 1)) * chartW;
      
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(vx, padding.top);
      ctx.lineTo(vx, padding.top + chartH);
      ctx.stroke();
      ctx.setLineDash([]);

      lineDatasets.forEach(dataset => {
        const color = dataset.color || chartStyles.cyanColor;
        const val = dataset.data[hoverIdx];
        if (val === undefined) return;
        const vy = padding.top + chartH - ((val - minLineVal) / (maxLineVal - minLineVal)) * chartH;
        
        ctx.fillStyle = color;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(vx, vy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      const tooltipW = 160;
      const rowH = 18;
      const tooltipH = 24 + datasets.length * rowH + 10;
      
      let tx = mx + 15;
      let ty = my - tooltipH / 2;
      if (tx + tooltipW > width) {
        tx = mx - tooltipW - 15;
      }
      if (ty < 5) ty = 5;
      if (ty + tooltipH > height - 5) ty = height - tooltipH - 5;

      ctx.fillStyle = "rgba(10, 15, 25, 0.95)";
      ctx.strokeStyle = "rgba(34, 211, 238, 0.6)";
      ctx.lineWidth = 1.5;
      
      ctx.shadowColor = "rgba(0, 229, 255, 0.2)";
      ctx.shadowBlur = 12;
      drawRoundedRect(ctx, tx, ty, tooltipW, tooltipH, 8);
      ctx.fill();
      ctx.stroke();
      
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#94a3b8";
      ctx.font = `bold 10px ${chartStyles.fontFamily}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(labels[hoverIdx], tx + 12, ty + 10);

      datasets.forEach((dataset, idx) => {
        const val = dataset.data[hoverIdx];
        const isLine = dataset.type === "line";
        const valStr = val !== undefined ? val.toFixed(isLine ? 1 : 0) + (isLine ? "%" : "") : "无";
        
        const ry = ty + 24 + idx * rowH;
        
        ctx.fillStyle = dataset.color || chartStyles.primaryColor;
        ctx.beginPath();
        ctx.arc(tx + 16, ry + 6, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#f1f5f9";
        ctx.font = `10px ${chartStyles.fontFamily}`;
        
        let labelText = dataset.label.split(" ")[0];
        if (labelText.length > 8) labelText = labelText.substring(0, 7) + "..";
        ctx.fillText(labelText, tx + 26, ry + 1);

        ctx.textAlign = "right";
        ctx.fillStyle = "#22d3ee";
        ctx.fillText(valStr, tx + tooltipW - 12, ry + 1);
        ctx.textAlign = "left";
      });
    }
  }

  // 绘制极简圆环甜甜圈饼图 (三道红线评级分布)
  function drawDonutChart(canvasId, data, colors) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const { ctx, width, height } = setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;
    const innerRadius = radius * 0.6;

    const totalVal = Object.values(data).reduce((a, b) => a + b, 0);
    let startAngle = -Math.PI / 2; // 从 12 点方向开始

    Object.entries(data).forEach(([key, val], idx) => {
      const sliceAngle = (val / totalVal) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;
      const color = colors[idx] || "#ccc";

      // 绘制环形扇区
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fill();

      // 扇区边缘细灰线条做视觉分割
      ctx.strokeStyle = "#0e111a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX + innerRadius * Math.cos(startAngle), centerY + innerRadius * Math.sin(startAngle));
      ctx.lineTo(centerX + radius * Math.cos(startAngle), centerY + radius * Math.sin(startAngle));
      ctx.stroke();

      startAngle = endAngle;
    });

    // 中间空白圆绘制暗色蒙版，支持磨砂感
    ctx.fillStyle = "#121727";
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fill();

    // 渲染图表内文字：展示总房企数
    ctx.fillStyle = chartStyles.whiteColor;
    ctx.font = `bold 16px ${chartStyles.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(totalVal + " 家", centerX, centerY - 6);

    ctx.fillStyle = chartStyles.textColor;
    ctx.font = `9px ${chartStyles.fontFamily}`;
    ctx.fillText("参与测评样本", centerX, centerY + 12);
  }

  // 辅助方法：绘制圆角矩形
  function drawRoundedRect(ctx, x, y, width, height, radius) {
    if (height < 0) return; // 容错
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
  }

  // 辅助方法：绘制图表顶层图例
  function renderChartLegend(ctx, startX, startY, datasets) {
    ctx.font = `10px ${chartStyles.fontFamily}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    
    let xOffset = startX;
    datasets.forEach(dataset => {
      ctx.fillStyle = dataset.color || chartStyles.primaryColor;
      ctx.beginPath();
      ctx.arc(xOffset, startY, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = chartStyles.textColor;
      ctx.fillText(dataset.label, xOffset + 10, startY);
      
      // 动态计算字符宽度实现图例并排
      const textW = ctx.measureText(dataset.label).width;
      xOffset += textW + 35;
    });
  }

  // ==========================================
  // 3. TAB 1: 全局大盘页面渲染逻辑
  // ==========================================
  function initMacroDashboard() {
    // 页面1里的折线图环同比切换按钮监听
    setupToggleBtn("btn-70second-ring", "btn-70second-year", (mode) => {
      render70SecondChart(mode);
    });
    
    setupToggleBtn("btn-70new-ring", "btn-70new-year", (mode) => {
      render70NewChart(mode);
    });

    // 城市月份下拉框改变
    document.getElementById("select-city-month").addEventListener("change", () => {
      renderCityMonthChart();
    });

    // 渲染所有前台图表
    render70SecondChart("ring");
    render70NewChart("ring");
    renderSalesScaleChart();
    renderCityMonthChart();
    renderDemandCharts();
  }

  function setupToggleBtn(idRing, idYear, callback) {
    const btnRing = document.getElementById(idRing);
    const btnYear = document.getElementById(idYear);
    if (!btnRing || !btnYear) return;

    btnRing.addEventListener("click", () => {
      btnRing.classList.add("active");
      btnYear.classList.remove("active");
      callback("ring");
    });

    btnYear.addEventListener("click", () => {
      btnYear.classList.add("active");
      btnRing.classList.remove("active");
      callback("year");
    });
  }

  // 渲染 70城二手房折线
  function render70SecondChart(mode) {
    const isRing = mode === "ring";
    const labels = data.macroData.months;
    const yValues = isRing ? data.macroData.index70SecondRing : data.macroData.index70SecondYear;
    
    drawLineChart("chart-70second", labels, [
      {
        label: isRing ? "环比二手房指数" : "同比二手房增幅",
        data: yValues,
        color: "rgba(167, 139, 250, 1)" // 紫色
      }
    ], {
      isPercentage: true,
      decimals: 1,
      yMinBaseline: isRing ? 100.0 : undefined // 环比以 100% 为基线
    });
  }

  // 渲染 70城新房折线
  function render70NewChart(mode) {
    const isRing = mode === "ring";
    const labels = data.macroData.months;
    const yValues = isRing ? data.macroData.index70NewRing : data.macroData.index70NewYear;

    drawLineChart("chart-70new", labels, [
      {
        label: isRing ? "环比新建住宅指数" : "同比新房增幅",
        data: yValues,
        color: "rgba(34, 211, 238, 1)" // 青色
      }
    ], {
      isPercentage: true,
      decimals: 1,
      yMinBaseline: isRing ? 100.0 : undefined
    });
  }

  // 渲染全国销售规模图 (双轴图)
  function renderSalesScaleChart() {
    const labels = data.macroData.months.slice(-18); // 截取最近1.5年数据展示
    const areaData = data.macroData.salesArea.slice(-18);
    const speedData = data.macroData.salesAreaSpeed.slice(-18);

    drawBarChart("chart-sales-scale", labels, [
      {
        label: "新房累计销售面积(万㎡) [左轴]",
        data: areaData,
        color: "rgba(59, 130, 246, 0.85)", // 蓝色柱体
        type: "bar"
      },
      {
        label: "累计销售面积增速(%) [右轴]",
        data: speedData,
        color: "rgba(245, 158, 11, 1)", // 橙色折线
        type: "line"
      }
    ]);
  }

  // 渲染单月城市对比柱状图
  function renderCityMonthChart() {
    const cities = Object.keys(data.macroData.cities);
    const mockRings = cities.map(c => data.macroData.cities[c].ring - 100); // 环比涨跌幅 (相对于100%差值)
    const mockYears = cities.map(c => data.macroData.cities[c].year);

    drawBarChart("chart-cities-month", cities, [
      {
        label: "二手房单月环比涨跌 (%)",
        data: mockRings,
        color: "rgba(167, 139, 250, 0.8)", // 紫色柱子
        type: "bar"
      },
      {
        label: "新房同比涨跌 (%)",
        data: mockYears,
        color: "rgba(34, 211, 238, 0.85)", // 青色柱子
        type: "bar"
      }
    ]);
  }

  // 渲染需求端大 Tab 内图表
  function renderDemandCharts() {
    const labels = data.macroData.months.slice(-18);
    const loans = data.macroData.demand.personalLoans.slice(-18);
    const debtRatio = data.macroData.demand.debtToIncome.slice(-18);

    drawBarChart("chart-demand-loans", labels, [
      {
        label: "新增中长期贷款(亿元) [左轴]",
        data: loans,
        color: "rgba(16, 185, 129, 0.8)", // 绿色柱状
        type: "bar"
      },
      {
        label: "居民债务收入比(%) [右轴]",
        data: debtRatio,
        color: "rgba(239, 68, 68, 1)", // 红色折线
        type: "line"
      }
    ]);

    // 租售比等比值折线图
    const priceIncome = data.macroData.demand.priceToIncome.slice(-18);
    const yieldRate = data.macroData.demand.rentalYield.slice(-18);
    drawBarChart("chart-demand-ratio", labels, [
      {
        label: "房价收入比 [左轴]",
        data: priceIncome,
        color: "rgba(59, 130, 246, 0.8)",
        type: "bar"
      },
      {
        label: "租金收益率(%) [右轴]",
        data: yieldRate,
        color: "rgba(34, 211, 238, 1)",
        type: "line"
      }
    ]);
  }

  // 渲染供给端大 Tab 内图表
  function renderSupplyCharts() {
    // 1. 三道红线环形占比图
    const redlineData = data.macroData.supply.threeRedLines;
    const colors = [
      chartStyles.successColor, // 绿档
      chartStyles.warningColor, // 黄档
      "#f97316",                 // 橙档
      chartStyles.dangerColor   // 红档
    ];
    drawDonutChart("chart-supply-redlines", redlineData, colors);
    
    // 渲染图例文字
    const legendBox = document.getElementById("redlines-legend");
    if (legendBox) {
      const keys = ["绿档达标 (全部满足)", "黄档警告 (1项未超)", "橙档预警 (2项未超)", "红档警戒 (全部超标)"];
      const vals = Object.values(redlineData);
      legendBox.innerHTML = keys.map((key, idx) => `
        <div class="legend-item">
          <span class="legend-color" style="background: ${colors[idx]}"></span>
          <span>${key}: <strong>${vals[idx]}家</strong></span>
        </div>
      `).join("");
    }

    // 2. 供给端动态折线
    const labels = data.macroData.months.slice(-18);
    const newConst = data.macroData.supply.newConstruction.slice(-18);
    const capital = data.macroData.supply.realizedCapital.slice(-18);

    drawLineChart("chart-supply-construction", labels, [
      {
        label: "新开工面积(万㎡)",
        data: newConst,
        color: "rgba(245, 158, 11, 1)"
      },
      {
        label: "开发投资实际到位资金(亿元)",
        data: capital,
        color: "rgba(34, 211, 238, 1)"
      }
    ], { decimals: 0 });
  }

  // ==========================================
  // 4. TAB 2: 杭州局部地图交互逻辑
  // ==========================================
  function initHzMap() {
    renderHzSvgMap();
    
    // 绑定缩放控制按钮
    document.getElementById("btn-zoom-in").addEventListener("click", () => {
      setMapZoomLevel("community");
    });
    
    document.getElementById("btn-zoom-out").addEventListener("click", () => {
      setMapZoomLevel("district");
    });

    document.getElementById("btn-close-drawer").addEventListener("click", () => {
      document.getElementById("map-detail-drawer").classList.add("hidden");
      selectedMapCommunity = null;
    });

    // 侧栏行政区选择改变
    document.getElementById("map-select-district").addEventListener("change", (e) => {
      const val = e.target.value;
      if (val !== "all") {
        setMapZoomLevel("community");
        showDistrictHighlight(val);
      } else {
        setMapZoomLevel("district");
      }
    });

    // 小区模糊搜索
    const searchInput = document.getElementById("map-search-input");
    const searchResults = document.getElementById("map-search-results");
    
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.trim();
      if (!query) {
        searchResults.classList.add("hidden");
        return;
      }

      // 从 mock-data 模糊匹配小区
      const matches = data.hzMapData.communities.filter(comm => 
        comm.name.includes(query) || comm.district.includes(query)
      );

      if (matches.length > 0) {
        searchResults.innerHTML = matches.map(comm => `
          <div class="search-result-item" data-comm-id="${comm.communityId}">
            <strong>${comm.name}</strong>
            <span class="item-district">${comm.district} · ${comm.subDistrict}</span>
          </div>
        `).join("");
        searchResults.classList.remove("hidden");
      } else {
        searchResults.innerHTML = `
          <div class="search-result-item neutral" style="cursor: default;">
            <span>无匹配数据，点击右侧搜索记录反馈</span>
          </div>
        `;
        searchResults.classList.remove("hidden");
      }
    });

    // 搜索按钮或匹配项点击
    document.getElementById("btn-map-search").addEventListener("click", () => {
      const query = searchInput.value.trim();
      triggerFuzzySearch(query);
    });

    searchResults.addEventListener("click", (e) => {
      const item = e.target.closest(".search-result-item");
      if (!item) return;
      const commId = item.getAttribute("data-comm-id");
      if (commId) {
        searchResults.classList.add("hidden");
        searchInput.value = item.querySelector("strong").textContent;
        selectCommunityOnMap(commId);
      }
    });

    // 侧栏详情抽屉内“加入对比”按钮
    document.getElementById("btn-drawer-add-compare").addEventListener("click", () => {
      if (selectedMapCommunity) {
        addToCompare(selectedMapCommunity.communityId);
      }
    });
  }

  function renderHzSvgMap() {
    const container = document.getElementById("hz-svg-map-container");
    if (!container) return;

    // 清空现有地图内容
    container.innerHTML = "";

    const svgWidth = 600;
    const svgHeight = 460;

    // 杭州 9 个区高保真真实多边形边界
    const districtPaths = {
      yuhang: "M 80,160 L 140,90 L 200,100 L 230,120 L 260,130 L 260,160 L 220,190 L 250,220 L 280,210 L 285,230 L 240,270 L 200,270 L 160,230 L 110,220 L 80,200 Z",
      linping: "M 420,130 L 450,80 L 500,40 L 540,60 L 560,120 L 520,150 L 480,165 L 458,140 L 435,148 Z",
      gongshu: "M 260,160 L 285,150 L 320,130 L 350,140 L 380,120 L 400,150 L 390,170 L 350,180 L 340,165 L 310,180 L 260,160 Z",
      xihu: "M 240,270 L 285,230 L 280,210 L 310,180 L 340,165 L 350,180 L 345,210 L 355,240 L 330,255 L 335,280 L 320,285 L 300,270 L 295,240 Z",
      shangcheng: "M 350,180 L 390,170 L 400,150 L 420,130 L 435,148 L 458,140 L 480,165 L 490,200 L 450,220 L 440,205 L 395,205 L 355,240 L 345,210 Z",
      qiantang: "M 480,165 L 520,150 L 560,120 L 580,170 L 550,220 L 500,230 L 490,200 Z",
      binjiang: "M 355,240 L 395,205 L 420,205 L 425,230 L 390,245 L 370,240 Z",
      xiaoshan: "M 425,230 L 450,220 L 490,200 L 500,230 L 550,220 L 570,270 L 530,350 L 430,390 L 360,350 L 355,270 L 390,245 Z",
      fuyang: "M 80,200 L 110,220 L 160,230 L 200,270 L 240,270 L 295,240 L 300,270 L 320,285 L 335,280 L 330,255 L 355,240 L 370,240 L 390,245 L 355,270 L 360,350 L 300,410 L 200,400 L 110,370 L 60,330 L 20,250 Z"
    };

    const districtIdMap = {
      "西湖区": "xihu", "余杭区": "yuhang", "上城区": "shangcheng",
      "拱墅区": "gongshu", "滨江区": "binjiang", "萧山区": "xiaoshan",
      "临平区": "linping", "钱塘区": "qiantang", "富阳区": "fuyang"
    };

    let svgHtml = `<svg id="hz-map-svg" width="100%" height="100%" viewBox="0 0 ${svgWidth} ${svgHeight}" style="pointer-events: auto; background: #06080d; border-radius: 12px;">`;
    
    // 1. 绘制区划多边形
    svgHtml += `<g id="map-districts-group">`;
    Object.entries(districtPaths).forEach(([id, path]) => {
      const d = data.hzMapData.districts.find(item => item.id === id);
      const dName = d ? d.name : id;
      svgHtml += `
        <path d="${path}" 
              id="svg-path-${id}" 
              class="map-district-path" 
              data-district-id="${id}">
          <title>${dName}</title>
        </path>
      `;
    });
    svgHtml += `</g>`;

    // 2. 绘制行政区气泡标记
    svgHtml += `<g id="map-badges-group">`;
    data.hzMapData.districts.forEach(d => {
      const x = 80 + (d.lng - 119.90) * 1000;
      const y = 390 - (d.lat - 30.00) * 800;
      
      svgHtml += `
        <g class="map-district-badge-svg" data-district-id="${d.id}" transform="translate(${x}, ${y})" style="cursor: pointer;">
          <rect x="-42" y="-17" width="84" height="34" rx="8" ry="8" 
                fill="rgba(15, 23, 42, 0.9)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1"></rect>
          <text x="0" y="-4" fill="#f1f5f9" font-size="10" font-weight="600" text-anchor="middle" font-family="'Inter', sans-serif">${d.name}</text>
          <text x="0" y="8" fill="#22d3ee" font-size="9" font-weight="700" text-anchor="middle" font-family="'Outfit', sans-serif">均价 ${d.price / 10000}万</text>
        </g>
      `;
    });
    svgHtml += `</g>`;

    // 3. 绘制小区散点标记
    svgHtml += `<g id="map-dots-group" style="display: none;">`;
    data.hzMapData.communities.forEach(c => {
      const x = 80 + (c.lng - 119.90) * 1000;
      const y = 390 - (c.lat - 30.00) * 800;

      let colorVal = chartStyles.successColor;
      if (c.averagePrice >= 80000) {
        colorVal = chartStyles.dangerColor;
      } else if (c.averagePrice >= 40000) {
        colorVal = chartStyles.purpleColor;
      }

      svgHtml += `
        <g class="map-community-dot-svg" data-comm-id="${c.communityId}" data-district-map="${districtIdMap[c.district] || 'xihu'}" transform="translate(${x}, ${y})" style="cursor: pointer;">
          <!-- 绿/黄/红呼吸打点圈 -->
          <circle cx="0" cy="0" r="6" fill="${colorVal}" stroke="#090c15" stroke-width="1.5" class="map-dot-circle"></circle>
          <!-- 悬浮框文本标签 -->
          <g class="map-dot-label" transform="translate(0, -16)" style="pointer-events: none;">
            <rect x="-42" y="-10" width="84" height="18" rx="4" ry="4" fill="#090c15" stroke="rgba(255,255,255,0.15)" stroke-width="1"></rect>
            <text x="0" y="2" fill="#f1f5f9" font-size="9" font-weight="500" text-anchor="middle" font-family="'Inter', sans-serif">${c.name}</text>
          </g>
        </g>
      `;
    });
    svgHtml += `</g>`;

    svgHtml += "</svg>";
    container.innerHTML = svgHtml;

    // 地图板块点击监听
    const paths = container.querySelectorAll(".map-district-path");
    paths.forEach(p => {
      p.addEventListener("click", () => {
        const id = p.getAttribute("data-district-id");
        showDistrictHighlight(id);
        setMapZoomLevel("community");
      });
    });

    // 行政区气泡点击监听
    container.querySelectorAll(".map-district-badge-svg").forEach(b => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = b.getAttribute("data-district-id");
        showDistrictHighlight(id);
        setMapZoomLevel("community");
      });
    });

    // 小区散点点击监听
    container.querySelectorAll(".map-community-dot-svg").forEach(dot => {
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        const commId = dot.getAttribute("data-comm-id");
        selectCommunityOnMap(commId);
      });
    });
  }

  // 切换地图缩放级别 (聚合层级 vs 散点打点层级)
  function setMapZoomLevel(level) {
    mapZoomLevel = level;
    const badgesGroup = document.getElementById("map-badges-group");
    const dotsGroup = document.getElementById("map-dots-group");
    const mapPaths = document.querySelectorAll(".map-district-path");
    const statusText = document.getElementById("zoom-status-text");

    if (!badgesGroup || !dotsGroup) return;

    if (level === "district") {
      // 聚合层：显示气泡，隐藏小区点
      badgesGroup.style.display = "block";
      dotsGroup.style.display = "none";
      mapPaths.forEach(p => p.classList.remove("active"));
      statusText.textContent = "显示级别: 行政区聚合";
      document.getElementById("map-detail-drawer").classList.add("hidden");
      selectedMapCommunity = null;
    } else {
      // 打点层：隐藏气泡，展示小区点
      badgesGroup.style.display = "none";
      dotsGroup.style.display = "block";
      statusText.textContent = "显示级别: 精细小区打点";
    }
  }

  // 高亮显示指定行政区
  function showDistrictHighlight(districtId) {
    const mapPaths = document.querySelectorAll(".map-district-path");
    mapPaths.forEach(p => {
      p.classList.remove("active");
      if (p.getAttribute("data-district-id") === districtId) {
        p.classList.add("active");
      }
    });

    // 将行政区下拉框的值设为一致
    const select = document.getElementById("map-select-district");
    if (select) select.value = districtId;

    // 地图打点散点联动过滤：只高亮当前行政区内的小区，其它半透明
    const dots = document.querySelectorAll(".map-community-dot-svg");
    dots.forEach(d => {
      if (d.getAttribute("data-district-map") === districtId) {
        d.style.opacity = "1";
        d.style.pointerEvents = "auto";
      } else {
        d.style.opacity = "0.15";
        d.style.pointerEvents = "none";
      }
    });
  }

  // 在地图上点选、并滑出小区画像抽屉
  function selectCommunityOnMap(commId) {
    const comm = data.hzMapData.communities.find(c => c.communityId === commId);
    if (!comm) return;

    selectedMapCommunity = comm;

    // 缩放级别切为打点级，高亮行政区
    setMapZoomLevel("community");
    const districtIdMap = {
      "西湖区": "xihu", "余杭区": "yuhang", "上城区": "shangcheng",
      "拱墅区": "gongshu", "滨江区": "binjiang", "萧山区": "xiaoshan",
      "临平区": "linping", "钱塘区": "qiantang", "富阳区": "fuyang"
    };
    const distId = districtIdMap[comm.district] || "xihu";
    showDistrictHighlight(distId);

    // 抽屉数据填充
    document.getElementById("drawer-comm-name").textContent = comm.name;
    document.getElementById("drawer-comm-tags").textContent = `${comm.district} · ${comm.subDistrict}`;
    document.getElementById("drawer-comm-price").innerHTML = `${comm.averagePrice.toLocaleString()} <span class="d-unit">元/㎡</span>`;
    document.getElementById("drawer-comm-listings").textContent = `${comm.activeListingCount} 套`;

    // 抽屉内“加入对比”按钮状态变化
    const btnAdd = document.getElementById("btn-drawer-add-compare");
    if (compareCart.includes(commId)) {
      btnAdd.textContent = "✓ 已加入对比";
      btnAdd.classList.add("active");
      btnAdd.style.background = "rgba(16, 185, 129, 0.2)";
      btnAdd.style.borderColor = "var(--success)";
    } else {
      btnAdd.textContent = "➕ 加入跨小区对比";
      btnAdd.classList.remove("active");
      btnAdd.style.background = "";
      btnAdd.style.borderColor = "";
    }

    // 展示抽屉
    document.getElementById("map-detail-drawer").classList.remove("hidden");

    // 渲染抽屉底部的小趋势折线图
    setTimeout(() => {
      renderDrawerTrendChart(comm);
    }, 50);
  }

  // 绘制抽屉内的小折线图
  function renderDrawerTrendChart(community) {
    const labels = community.transactions.map(t => t.month).slice(-12);
    const prices = community.transactions.map(t => t.averagePrice).slice(-12);

    drawLineChart("chart-drawer-trend", labels, [
      {
        label: "月度挂牌均价 (元/㎡)",
        data: prices,
        color: "rgba(34, 211, 238, 1)"
      }
    ], { decimals: 0 });
  }

  // 触发左侧模糊搜索行为
  function triggerFuzzySearch(query) {
    if (!query) return;
    const match = data.hzMapData.communities.find(c => c.name === query);
    if (match) {
      document.getElementById("map-info-alert").classList.add("hidden");
      selectCommunityOnMap(match.communityId);
    } else {
      // 触发无匹配 alert 报警
      document.getElementById("map-info-alert").classList.remove("hidden");
      document.getElementById("alert-title").textContent = `未匹配到“${query}”`;
      document.getElementById("alert-desc").textContent = "杭州目前约有8,000个小区，爬虫引擎已将其排入今日零点同步抓取任务中，网签及历史成交明细将在24小时内补录完成。";
    }
  }   function initCompareSelector() {
    const triggerBtn = document.getElementById("compare-trigger-btn");
    const dropdownPanel = document.getElementById("compare-dropdown-panel");
    const optionsList = document.getElementById("compare-options-list");
    const clearBtn = document.getElementById("btn-clear-compare-selections");

    if (!triggerBtn || !dropdownPanel || !optionsList) return;

    // 1. 动态渲染复选框列表
    function renderCompareDropdownOptions() {
      optionsList.innerHTML = data.hzMapData.communities.map(c => {
        const isChecked = compareCart.includes(c.communityId);
        return `
          <label class="dropdown-item">
            <input type="checkbox" class="compare-checkbox" value="${c.communityId}" ${isChecked ? "checked" : ""}>
            <span class="checkbox-custom"></span>
            <span class="community-name-text">${c.name} (${c.district})</span>
          </label>
        `;
      }).join("");

      // 绑定每个 checkbox 的 change 事件
      const checkboxes = optionsList.querySelectorAll(".compare-checkbox");
      checkboxes.forEach(cb => {
        cb.addEventListener("change", (e) => {
          const val = cb.value;
          if (cb.checked) {
            if (compareCart.length >= 4) {
              cb.checked = false; // 撤回勾选
              showToast("⚠️ 最多只能选择 4 个小区进行对比");
              return;
            }
            if (!compareCart.includes(val)) {
              compareCart.push(val);
            }
          } else {
            compareCart = compareCart.filter(id => id !== val);
          }
          updateTriggerText();
          updateCompareFloatBadge();
          renderCompareDashboard();
        });
      });
    }

    // 更新触发器文字和数值
    function updateTriggerText() {
      const triggerText = document.getElementById("compare-trigger-text");
      if (triggerText) {
        if (compareCart.length > 0) {
          triggerText.textContent = `已选 ${compareCart.length} 个小区 (${compareCart.map(id => {
            const c = data.hzMapData.communities.find(item => item.communityId === id);
            return c ? c.name : "";
          }).filter(Boolean).join(", ")})`;
        } else {
          triggerText.textContent = "请勾选对比小区 (2~4个)";
        }
      }
    }

    renderCompareDropdownOptions();
    updateTriggerText();

    // 2. 切换下拉面板显隐
    triggerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownPanel.classList.toggle("hidden");
    });

    // 点击外部隐藏下拉面板
    document.addEventListener("click", (e) => {
      if (!dropdownPanel.contains(e.target) && e.target !== triggerBtn && !triggerBtn.contains(e.target)) {
        dropdownPanel.classList.add("hidden");
      }
    });

    // 3. 清空选择按钮
    clearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      compareCart = [];
      const checkboxes = optionsList.querySelectorAll(".compare-checkbox");
      checkboxes.forEach(cb => cb.checked = false);
      updateTriggerText();
      updateCompareFloatBadge();
      renderCompareDashboard();
    });

    // 4. 户型及时间范围选择改变
    document.getElementById("compare-select-room").addEventListener("change", (e) => {
      compareRoomType = e.target.value;
      renderCompareDashboard();
    });

    document.getElementById("compare-select-time").addEventListener("change", (e) => {
      compareTimeRange = parseInt(e.target.value);
      renderCompareDashboard();
    });

    // 自主图表切换按钮绑定
    const btnLine = document.getElementById("btn-chart-type-line");
    const btnBar = document.getElementById("btn-chart-type-bar");
    const btnPie = document.getElementById("btn-chart-type-pie");

    btnLine.addEventListener("click", () => setCompareChartType("line"));
    btnBar.addEventListener("click", () => setCompareChartType("bar"));
    btnPie.addEventListener("click", () => setCompareChartType("pie"));
  }

  // 为外部（如地图页）同步更新多选下拉框的 checked 状态
  function syncCompareSelectorUI() {
    const optionsList = document.getElementById("compare-options-list");
    if (!optionsList) return;
    const checkboxes = optionsList.querySelectorAll(".compare-checkbox");
    checkboxes.forEach(cb => {
      cb.checked = compareCart.includes(cb.value);
    });
    
    // 更新触发器文字
    const triggerText = document.getElementById("compare-trigger-text");
    if (triggerText) {
      if (compareCart.length > 0) {
        triggerText.textContent = `已选 ${compareCart.length} 个小区 (${compareCart.map(id => {
          const c = data.hzMapData.communities.find(item => item.communityId === id);
          return c ? c.name : "";
        }).filter(Boolean).join(", ")})`;
      } else {
        triggerText.textContent = "请勾选对比小区 (2~4个)";
      }
    }
  }

  function setCompareChartType(type) {
    compareChartType = type;
    const btnLine = document.getElementById("btn-chart-type-line");
    const btnBar = document.getElementById("btn-chart-type-bar");
    const btnPie = document.getElementById("btn-chart-type-pie");

    [btnLine, btnBar, btnPie].forEach(b => b.classList.remove("active"));
    if (type === "line") btnLine.classList.add("active");
    if (type === "bar") btnBar.classList.add("active");
    if (type === "pie") btnPie.classList.add("active");

    renderCompareDashboard();
  }

  // 渲染对比主看板核心入口
  function renderCompareDashboard() {
    const readyBoard = document.getElementById("compare-ready-board");
    const emptyState = document.getElementById("compare-empty-state");
    const noDataState = document.getElementById("compare-no-data-state");

    if (!readyBoard || !emptyState || !noDataState) return;

    // 1. 判断是否选择了有效对比小区数量
    if (compareCart.length < 2) {
      readyBoard.classList.add("hidden");
      noDataState.classList.add("hidden");
      emptyState.classList.remove("hidden");
      return;
    }

    // 提取对比小区实体数据
    const selectedComms = compareCart.map(id => data.hzMapData.communities.find(c => c.communityId === id)).filter(Boolean);

    // 2. 根据筛选的时间截取交易记录
    const limitMonths = compareTimeRange;
    const timeline = data.macroData.months.slice(-limitMonths);

    // 生成各个小区的数据集
    const selectedData = selectedComms.map(comm => {
      let commData = [];
      timeline.forEach(m => {
        const t = comm.transactions.find(tr => tr.month === m);
        let price = t ? t.averagePrice : 0;
        let vol = t ? t.volume : 0;

        if (compareRoomType !== "all") {
          const typeVol = (t && t.roomTypes[compareRoomType] !== undefined) ? t.roomTypes[compareRoomType] : 0;
          vol = typeVol;
          price = vol > 0 ? comm.roomTypePrices[compareRoomType] : 0;
        }
        commData.push({ month: m, price, vol });
      });
      return commData;
    });

    // 3. 判断是否完全无成交数据
    const hasAnyData = selectedData.some(commData => commData.some(d => d.vol > 0 || d.price > 0));
    if (!hasAnyData) {
      readyBoard.classList.add("hidden");
      emptyState.classList.add("hidden");
      noDataState.classList.remove("hidden");
      document.getElementById("no-data-msg").textContent = `所选对比小区在近 ${compareTimeRange} 个月内暂无 “${compareRoomType}” 标准户型的网签成交记录，无法渲染图表。建议更换户型筛选。`;
      return;
    }

    // 数据状态就绪，显示看板
    emptyState.classList.add("hidden");
    noDataState.classList.add("hidden");
    readyBoard.classList.remove("hidden");

    // 4. 根据用户选定的图表类型自主重绘主看板
    renderCompareCharts(timeline, selectedComms, selectedData);

    // 5. 刷新同环比对照表
    renderCompareDataTable(selectedComms, selectedData);
  }

  function renderCompareCharts(timeline, selectedComms, selectedData) {
    const labels = timeline;
    const colors = [
      "rgba(239, 68, 68, 1)",  // 红
      "rgba(59, 130, 246, 1)", // 蓝
      "rgba(168, 85, 247, 1)", // 紫
      "rgba(6, 182, 212, 1)"    // 青
    ];

    if (compareChartType === "line") {
      const datasets = selectedComms.map((comm, idx) => {
        return {
          label: `${comm.name} 均价 (元/㎡)`,
          data: selectedData[idx].map(d => d.price),
          color: colors[idx % colors.length]
        };
      });
      drawLineChart("chart-compare-main", labels, datasets, { decimals: 0 });

    } else if (compareChartType === "bar") {
      const datasets = selectedComms.map((comm, idx) => {
        return {
          label: `${comm.name} 成交套数`,
          data: selectedData[idx].map(d => d.vol),
          color: colors[idx % colors.length].replace("1)", "0.8)"),
          type: "bar"
        };
      });
      drawBarChart("chart-compare-main", labels, datasets);

    } else if (compareChartType === "pie") {
      const canvas = document.getElementById("chart-compare-main");
      if (!canvas) return;

      const { ctx, width, height } = setupCanvas(canvas);
      ctx.clearRect(0, 0, width, height);

      const sumRoomTypes = (comm) => {
        const result = { "一居": 0, "二居": 0, "三居": 0, "四居+": 0 };
        comm.transactions.slice(-compareTimeRange).forEach(t => {
          Object.keys(result).forEach(k => {
            result[k] += t.roomTypes[k] || 0;
          });
        });
        return result;
      };

      const pieDataList = selectedComms.map(comm => sumRoomTypes(comm));
      const pieColors = [chartStyles.successColor, chartStyles.cyanColor, chartStyles.purpleColor, chartStyles.warningColor];
      const roomKeys = ["一居", "二居", "三居", "四居+"];

      const count = selectedComms.length;
      
      selectedComms.forEach((comm, idx) => {
        let cx = width / 2;
        let radius = Math.min(width, height) * 0.25;
        
        if (count === 2) {
          cx = idx === 0 ? width * 0.28 : width * 0.72;
          radius = Math.min(width, height) * 0.30;
        } else if (count === 3) {
          cx = idx === 0 ? width * 0.18 : idx === 1 ? width * 0.50 : width * 0.82;
          radius = Math.min(width, height) * 0.24;
        } else if (count === 4) {
          cx = idx === 0 ? width * 0.14 : idx === 1 ? width * 0.38 : idx === 2 ? width * 0.62 : width * 0.86;
          radius = Math.min(width, height) * 0.18;
        }
        
        drawSingleComparePie(ctx, cx, height * 0.42, radius, pieDataList[idx], comm.name, roomKeys, pieColors);
      });

      // 底部统配图例
      ctx.font = `10px ${chartStyles.fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let xStart = width / 2 - 120;
      roomKeys.forEach((k, idx) => {
        ctx.fillStyle = pieColors[idx];
        ctx.beginPath();
        ctx.arc(xStart, height - 20, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = chartStyles.textColor;
        ctx.textAlign = "left";
        ctx.fillText(k, xStart + 10, height - 20);
        xStart += 70;
      });
    }
  }

  function drawSingleComparePie(ctx, cx, cy, radius, dataMap, title, keys, colors) {
    const total = Object.values(dataMap).reduce((a, b) => a + b, 0);
    
    if (total === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = chartStyles.textColor;
      ctx.font = `11px ${chartStyles.fontFamily}`;
      ctx.textAlign = "center";
      ctx.fillText("暂无成交历史", cx, cy);
      return;
    }

    let startAngle = -Math.PI / 2;
    keys.forEach((key, idx) => {
      const val = dataMap[key] || 0;
      if (val === 0) return;
      
      const sliceAngle = (val / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;
      
      ctx.fillStyle = colors[idx];
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.arc(cx, cy, radius * 0.5, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fill();

      const midAngle = startAngle + sliceAngle / 2;
      const labelRadius = radius * 0.75;
      const lx = cx + labelRadius * Math.cos(midAngle);
      const ly = cy + labelRadius * Math.sin(midAngle);

      ctx.fillStyle = chartStyles.whiteColor;
      ctx.font = `9px ${chartStyles.fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      const percent = ((val / total) * 100).toFixed(0);
      if (percent > 8) {
        ctx.fillText(percent + "%", lx, ly);
      }

      startAngle = endAngle;
    });

    ctx.fillStyle = chartStyles.whiteColor;
    ctx.font = `bold 12px ${chartStyles.fontFamily}`;
    ctx.textAlign = "center";
    ctx.fillText(title, cx, cy - radius - 20);

    ctx.fillStyle = chartStyles.textColor;
    ctx.font = `9px ${chartStyles.fontFamily}`;
    ctx.fillText(`总量: ${total} 套`, cx, cy - radius - 8);
  }

  function renderCompareDataTable(selectedComms, selectedData) {
    const wrapper = document.getElementById("compare-table-wrapper");
    if (!wrapper) return;

    const isTwo = selectedComms.length === 2;
    
    const rowData = {
      price: [],  
      ring: [],   
      year: [],   
      vol: [],    
      mainroom: [] 
    };

    selectedComms.forEach((comm, cIdx) => {
      const commData = selectedData[cIdx];
      const valid = commData.filter(d => d.price > 0);
      const latestPrice = valid.length > 0 ? valid[valid.length - 1].price : 0;
      
      let ring = "--";
      if (valid.length >= 2) {
        const last = valid[valid.length - 1].price;
        const prev = valid[valid.length - 2].price;
        if (prev > 0) {
          ring = ((last - prev) / prev * 100).toFixed(2);
        }
      }
      
      let year = "--";
      if (valid.length >= 13) {
        const last = valid[valid.length - 1].price;
        const lastYear = valid[valid.length - 13].price;
        if (lastYear > 0) {
          year = ((last - lastYear) / lastYear * 100).toFixed(2);
        }
      }

      const volSum = commData.reduce((sum, d) => sum + d.vol, 0);

      rowData.price.push(latestPrice);
      rowData.ring.push(ring);
      rowData.year.push(year);
      rowData.vol.push(volSum);
      rowData.mainroom.push(comm.mainRoomType);
    });

    let priceDiffText = "--";
    let priceDiffClass = "neutral";
    let volDiffText = "--";
    let volDiffClass = "neutral";

    if (isTwo) {
      const pA = rowData.price[0];
      const pB = rowData.price[1];
      if (pA > 0 && pB > 0) {
        const d = ((pA - pB) / pB * 100).toFixed(1);
        priceDiffText = (d > 0 ? "+" : "") + d + "%";
        priceDiffClass = d > 0 ? "up" : "down";
      }

      const vA = rowData.vol[0];
      const vB = rowData.vol[1];
      if (vB > 0) {
        const d = ((vA - vB) / vB * 100).toFixed(1);
        volDiffText = (d > 0 ? "+" : "") + d + "%";
        volDiffClass = d > 0 ? "up" : "down";
      }
    } else {
      const pValid = rowData.price.filter(p => p > 0);
      if (pValid.length >= 2) {
        const maxP = Math.max(...pValid);
        const minP = Math.min(...pValid);
        if (minP > 0) {
          const d = ((maxP - minP) / minP * 100).toFixed(1);
          priceDiffText = d + "%";
          priceDiffClass = "up";
        }
      }

      const vValid = rowData.vol;
      const maxV = Math.max(...vValid);
      const minV = Math.min(...vValid);
      if (minV > 0) {
        const d = ((maxV - minV) / minV * 100).toFixed(1);
        volDiffText = d + "%";
        volDiffClass = "up";
      }
    }

    let tableHtml = `
      <table class="compare-data-table">
        <thead>
          <tr>
            <th>对比项</th>
    `;

    selectedComms.forEach((comm, idx) => {
      const colorTag = idx === 0 ? "red" : idx === 1 ? "blue" : idx === 2 ? "purple" : "cyan";
      tableHtml += `<th><span class="badge ${colorTag}">${comm.name}</span></th>`;
    });

    tableHtml += `<th>${isTwo ? "两区差异 (%)" : "最大极差 (%)"}</th></tr></thead><tbody>`;

    tableHtml += `<tr><td><strong>最新成交均价</strong></td>`;
    rowData.price.forEach(p => {
      tableHtml += `<td>${p > 0 ? p.toLocaleString() + " 元/㎡" : "无数据"}</td>`;
    });
    tableHtml += `<td class="${priceDiffClass}">${priceDiffText}</td></tr>`;

    tableHtml += `<tr><td><strong>价格环比上月</strong></td>`;
    rowData.ring.forEach(r => {
      if (r === "--") {
        tableHtml += `<td class="neutral">--</td>`;
      } else {
        const val = parseFloat(r);
        tableHtml += `<td class="${val > 0 ? 'up' : 'down'}">${val > 0 ? '+' : ''}${r}%</td>`;
      }
    });
    tableHtml += `<td class="neutral">--</td></tr>`;

    tableHtml += `<tr><td><strong>价格同比去年</strong></td>`;
    rowData.year.forEach(y => {
      if (y === "--") {
        tableHtml += `<td class="neutral">--</td>`;
      } else {
        const val = parseFloat(y);
        tableHtml += `<td class="${val > 0 ? 'up' : 'down'}">${val > 0 ? '+' : ''}${y}%</td>`;
      }
    });
    tableHtml += `<td class="neutral">--</td></tr>`;

    tableHtml += `<tr><td><strong>近18个月成交总量</strong></td>`;
    rowData.vol.forEach(v => {
      tableHtml += `<td>${v} 套</td>`;
    });
    tableHtml += `<td class="${volDiffClass}">${volDiffText}</td></tr>`;

    tableHtml += `<tr><td><strong>主力成交户型</strong></td>`;
    rowData.mainroom.forEach(mr => {
      tableHtml += `<td>${mr}</td>`;
    });
    tableHtml += `<td class="neutral">--</td></tr>`;

    tableHtml += `</tbody></table>`;
    wrapper.innerHTML = tableHtml;
  }



  // ==========================================
  // 6. TAB 4: 后台管理数据上传模拟
  // ==========================================
  function initAdminPortal() {
    const dropzone = document.getElementById("excel-dropzone");
    const fileInput = document.getElementById("excel-file-input");
    const progressPanel = document.getElementById("upload-progress-panel");
    const progressFill = document.getElementById("upload-progress-fill");
    const progressPercent = document.getElementById("upload-percent");
    const alertSuccess = document.getElementById("upload-alert-success");
    const alertError = document.getElementById("upload-alert-error");

    if (!dropzone || !fileInput) return;

    // 拖拽悬停类切换
    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("hovering");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("hovering");
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("hovering");
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleUploadSimulation(files[0].name, true);
      }
    });

    dropzone.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        handleUploadSimulation(e.target.files[0].name, true);
      }
    });

    // 两个模拟触发按钮
    document.getElementById("btn-mock-success-upload").addEventListener("click", () => {
      handleUploadSimulation("macro_indicators_latest_success.xlsx", true);
    });

    document.getElementById("btn-mock-fail-upload").addEventListener("click", () => {
      handleUploadSimulation("macro_indicators_error_structure.xlsx", false);
    });

    // 上传进度模拟函数
    function handleUploadSimulation(filename, isSuccess) {
      // 重置界面状态
      alertSuccess.classList.add("hidden");
      alertError.classList.add("hidden");
      dropzone.classList.remove("error");
      
      document.getElementById("upload-filename").textContent = filename;
      progressPanel.classList.remove("hidden");
      
      let percent = 0;
      progressFill.style.width = "0%";
      progressPercent.textContent = "0%";

      const interval = setInterval(() => {
        percent += 4;
        progressFill.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;

        if (percent >= 100) {
          clearInterval(interval);
          
          setTimeout(() => {
            progressPanel.classList.add("hidden");
            if (isSuccess) {
              alertSuccess.classList.remove("hidden");
              showToast("✅ 大盘宏观数据导入成功！图表已热更新");
              // 触发前台图表热刷新数据点，模拟真实感觉 (这里直接将 2026-06 数据点在看板上突出表现)
              triggerMacroChartsHotUpdate();
            } else {
              alertError.classList.remove("hidden");
              dropzone.classList.add("error");
              showToast("⚠️ 导入失败，Excel 模板字段缺失");
            }
          }, 400);
        }
      }, 50);
    }
  }

  // 模拟大盘数据更新后的重绘联动
  function triggerMacroChartsHotUpdate() {
    // 增加数据厚重感，可以模拟重新渲染大盘
    render70SecondChart("ring");
    render70NewChart("ring");
  }

  // ==========================================
  // 7. 全局暂存对比池与悬浮浮层
  // ==========================================
  function addToCompare(commId) {
    const comm = data.hzMapData.communities.find(c => c.communityId === commId);
    if (!comm) return;

    if (compareCart.includes(commId)) {
      showToast(`⚖️ ${comm.name} 已经在对比队列中了`);
      return;
    }

    if (compareCart.length >= 4) {
      showToast("⚠️ 最多支持 4 个小区进行对比分析");
      return;
    }

    compareCart.push(commId);
    
    syncCompareSelectorUI();
    updateCompareFloatBadge();
    renderCompareDashboard();

    showToast(`⚖️ 已成功将“${comm.name}”加入对比分析`);

    // 改变当前抽屉按钮状态
    const btnAdd = document.getElementById("btn-drawer-add-compare");
    if (btnAdd) {
      btnAdd.textContent = "✓ 已加入对比";
      btnAdd.classList.add("active");
      btnAdd.style.background = "rgba(16, 185, 129, 0.2)";
      btnAdd.style.borderColor = "var(--success)";
    }
  }

  // 更新全局悬浮比盘池状态
  function updateCompareFloatBadge() {
    const badge = document.getElementById("compare-float-badge");
    const countEl = document.getElementById("compare-float-count");
    if (!badge || !countEl) return;

    if (compareCart.length > 0) {
      countEl.textContent = compareCart.length;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }

    // 绑定立刻对比跳转
    document.getElementById("btn-float-go").onclick = () => {
      syncCompareSelectorUI();
      renderCompareDashboard();

      // 切换 Tab 到对比页
      const btnCompare = document.querySelector(".nav-btn[data-tab='community-compare']");
      if (btnCompare) btnCompare.click();
    };

    // 清空对比池
    document.getElementById("btn-float-clear").onclick = () => {
      compareCart = [];
      syncCompareSelectorUI();
      updateCompareFloatBadge();
      renderCompareDashboard();
      showToast("⚖️ 对比暂存池已全部清空");
      // 如果地图抽屉正开着，复原按钮状态
      const btnAdd = document.getElementById("btn-drawer-add-compare");
      if (btnAdd) {
        btnAdd.textContent = "➕ 加入跨小区对比";
        btnAdd.classList.remove("active");
        btnAdd.style.background = "";
        btnAdd.style.borderColor = "";
      }
    };
  }

  // 全局轻量通知弹窗
  function showToast(msg) {
    const toast = document.getElementById("global-toast");
    const toastMsg = document.getElementById("toast-msg");
    if (!toast || !toastMsg) return;

    toastMsg.textContent = msg;
    toast.classList.remove("hidden");

    // 3秒后自动淡出
    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
      toast.classList.add("hidden");
    }, 3000);
  }
});
