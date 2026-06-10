// 模拟浏览器 window 极其完备的环境，用于彻底捕获 DOMContentLoaded 下的运行时报错
global.window = global;
global.window.devicePixelRatio = 1;

let domLoadedCallback = null;
const elements = {};

// 模拟 DOM 节点生成器
const mockBtnCache = {};

function createMockElement(id, tagName = "div") {
  if (mockBtnCache[id]) return mockBtnCache[id];
  
  const listeners = {};
  const el = {
    id,
    tagName: tagName.toUpperCase(),
    classList: {
      add: (...cls) => {},
      remove: (...cls) => {},
      toggle: (...cls) => {},
      contains: () => false
    },
    addEventListener: (event, cb) => {
      listeners[event] = cb;
    },
    trigger: (event, ...args) => {
      if (listeners[event]) listeners[event](...args);
    },
    getAttribute: (attr) => {
      if (attr === "data-tab") {
        return id === "nav-btn-1" ? "macro-dashboard" : "community-compare";
      }
      if (attr === "data-subtab") {
        return "supply-side";
      }
      return null;
    },
    setAttribute: () => {},
    getContext: () => ({
      clearRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
      fillText: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      measureText: () => ({ width: 100 }),
      setLineDash: () => {},
      rect: () => {},
      scale: () => {},
      translate: () => {},
      save: () => {},
      restore: () => {},
      closePath: () => {},
      clip: () => {},
      quadraticCurveTo: () => {},
      bezierCurveTo: () => {},
      arcTo: () => {}
    }),
    getBoundingClientRect: () => ({ width: 600, height: 400 }),
    style: {},
    innerHTML: "",
    textContent: "",
    appendChild: () => {},
    querySelectorAll: () => [],
    querySelector: () => createMockElement("sub-element"),
    contains: () => false
  };

  mockBtnCache[id] = el;
  return el;
}

global.document = {
  addEventListener: (event, callback) => {
    if (event === "DOMContentLoaded") {
      domLoadedCallback = callback;
    }
  },
  querySelectorAll: (selector) => {
    if (selector === ".nav-btn") {
      return [createMockElement("nav-btn-1"), createMockElement("nav-btn-2")];
    }
    if (selector === ".tab-pane") {
      return [createMockElement("tab-pane-1")];
    }
    if (selector === ".panel-tab-btn") {
      return [createMockElement("panel-tab-btn-1")];
    }
    if (selector === ".subtab-content") {
      return [createMockElement("subtab-content-1")];
    }
    return [];
  },
  getElementById: (id) => {
    if (!elements[id]) {
      elements[id] = createMockElement(id);
    }
    return elements[id];
  }
};

// 预定义一些常用元素以防报错
const requiredIds = [
  "chart-70second", "chart-70new", "chart-sales-scale", "chart-cities-month",
  "chart-demand-loans", "chart-demand-ratio", "chart-supply-redlines",
  "chart-supply-construction", "hz-svg-map-container", "map-search-input",
  "map-search-results", "btn-map-search", "btn-drawer-add-compare",
  "compare-trigger-btn", "compare-dropdown-panel", "compare-options-list",
  "btn-clear-compare-selections", "compare-select-room", "compare-select-time",
  "btn-chart-type-line", "btn-chart-type-bar", "btn-chart-type-pie",
  "compare-ready-board", "compare-empty-state", "compare-no-data-state",
  "compare-table-wrapper", "excel-dropzone", "excel-file-input",
  "upload-progress-panel", "upload-progress-fill", "upload-percent",
  "upload-alert-success", "upload-alert-error", "btn-mock-success-upload",
  "btn-mock-fail-upload", "compare-float-badge", "compare-float-count",
  "btn-float-go", "btn-float-clear", "global-toast", "toast-msg",
  "btn-zoom-in", "btn-zoom-out", "btn-close-drawer", "map-select-district",
  "map-detail-drawer"
];
requiredIds.forEach(id => {
  elements[id] = createMockElement(id);
});

try {
  // 1. 加载假数据
  require('../preview/mvp/mock-data.js');
  console.log("1. mock-data.js loaded.");
  
  // 2. 加载 app.js (注册 DOMContentLoaded)
  require('../preview/mvp/app.js');
  console.log("2. app.js loaded.");

  // 3. 触发 DOMContentLoaded
  if (domLoadedCallback) {
    console.log("3. Triggering DOMContentLoaded callback...");
    domLoadedCallback();
    console.log("🎉 DOMContentLoaded callback executed successfully.");

    // 4. 模拟交互仿真
    console.log("4. Simulating interactive actions...");

    // 模拟子 Tab 切换
    const subTabBtn = mockBtnCache["panel-tab-btn-1"];
    if (subTabBtn) {
      console.log("-> Simulating subtab-btn click (switch to supply-side)...");
      subTabBtn.trigger("click");
    }

    // 模拟切换到“小区对比”主 Tab (触发 renderCompareDashboard)
    const compareNavBtn = mockBtnCache["nav-btn-2"];
    if (compareNavBtn) {
      console.log("-> Simulating nav-btn click (switch to community-compare)...");
      compareNavBtn.trigger("click");
    }

    // 模拟切换对比图表类型
    const chartTypeBarBtn = elements["btn-chart-type-bar"];
    if (chartTypeBarBtn) {
      console.log("-> Simulating compare chart type toggle (to bar)...");
      chartTypeBarBtn.trigger("click");
    }

    const chartTypePieBtn = elements["btn-chart-type-pie"];
    if (chartTypePieBtn) {
      console.log("-> Simulating compare chart type toggle (to pie)...");
      chartTypePieBtn.trigger("click");
    }

    // 给 setTimeout 里的异步渲染留出执行时间
    setTimeout(() => {
      console.log("🎉 SUCCESS: All interactive simulations executed without errors!");
      process.exit(0);
    }, 100);

  } else {
    throw new Error("DOMContentLoaded callback was not registered by app.js!");
  }
} catch (e) {
  console.error("❌ RUNTIME ERROR DETECTED:", e);
  process.exit(1);
}
