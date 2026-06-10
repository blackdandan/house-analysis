const fs = require('fs');
const path = require('path');

// 基础宏观数据
const macroMonths = [
  "2023-01", "2023-02", "2023-03", "2023-04", "2023-05", "2023-06",
  "2023-07", "2023-08", "2023-09", "2023-10", "2023-11", "2023-12",
  "2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06",
  "2024-07", "2024-08", "2024-09", "2024-10", "2024-11", "2024-12",
  "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06",
  "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12",
  "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"
];

const index70SecondRing = [
  99.5, 99.7, 100.2, 100.3, 100.1, 99.8, 99.4, 99.1, 99.2, 99.0, 98.7, 98.4,
  98.2, 98.1, 98.5, 98.8, 99.1, 99.2, 98.9, 98.7, 98.8, 99.0, 99.3, 99.5,
  99.7, 99.9, 100.1, 100.3, 100.4, 100.2, 99.8, 99.5, 99.4, 99.3, 99.2, 99.1,
  99.3, 99.4, 99.7, 100.1, 100.3, 100.4
];

const index70SecondYear = [
  -4.2, -4.0, -3.5, -3.1, -2.8, -3.0, -3.5, -4.1, -4.3, -4.8, -5.2, -5.8,
  -6.1, -6.3, -5.8, -5.1, -4.2, -3.8, -4.5, -4.9, -4.8, -4.2, -3.5, -3.0,
  -2.6, -2.1, -1.8, -1.2, -0.8, -1.0, -1.5, -2.0, -2.3, -2.5, -2.8, -3.1,
  -2.9, -2.7, -2.1, -1.3, -0.6, -0.2
];

const index70NewRing = [
  99.8, 100.1, 100.5, 100.6, 100.4, 100.1, 99.7, 99.5, 99.6, 99.4, 99.1, 98.9,
  98.7, 98.6, 99.0, 99.3, 99.6, 99.7, 99.4, 99.2, 99.3, 99.5, 99.8, 100.1,
  100.3, 100.5, 100.7, 100.8, 100.9, 100.7, 100.3, 100.0, 99.9, 99.8, 99.7, 99.6,
  99.8, 99.9, 100.2, 100.5, 100.7, 100.8
];

const index70NewYear = [
  -2.1, -1.8, -1.2, -0.8, -0.5, -0.8, -1.3, -1.7, -1.9, -2.3, -2.7, -3.1,
  -3.4, -3.6, -3.1, -2.5, -1.8, -1.4, -2.0, -2.4, -2.3, -1.8, -1.2, -0.7,
  -0.3,  0.2,  0.6,  1.1,  1.5,  1.2,  0.7,  0.2,  0.0, -0.2, -0.5, -0.8,
  -0.6, -0.4,  0.1,  0.8,  1.4,  1.8
];

const salesArea = [
  9800, 15400, 24800, 32900, 42100, 50200, 56300, 62400, 71500, 79200, 88100, 98500,
  8900, 13800, 22600, 29800, 38200, 46100, 51900, 57800, 66300, 73600, 82100, 92400,
  9400, 14900, 24200, 31800, 41200, 49800, 56100, 62300, 71400, 79100, 88200, 99200,
  9900, 15900, 25800, 33800, 43900, 52900
];

const salesAreaSpeed = [
  -3.8, -4.2, -4.8, -5.0, -4.5, -4.1, -4.9, -5.3, -5.8, -5.5, -5.1, -4.6,
  -9.1, -10.3, -8.8, -9.4, -9.2, -8.1, -7.8, -7.3, -7.2, -7.0, -6.8, -6.1,
  5.6,   7.9,   7.0,   6.7,   7.8,   8.0,   8.0,   7.7,   7.6,   7.4,   7.4,   7.3,
  5.3,   6.7,   6.6,   6.2,   6.5,   6.2
];

const salesAmount = [
  1.10, 1.72, 2.78, 3.69, 4.72, 5.63, 6.31, 7.00, 8.01, 8.88, 9.87, 11.05,
  0.97, 1.51, 2.47, 3.26, 4.18, 5.04, 5.68, 6.32, 7.25, 8.05, 8.98, 10.11,
  1.05, 1.66, 2.70, 3.55, 4.60, 5.56, 6.26, 6.95, 7.97, 8.83, 9.85, 11.08,
  1.12, 1.80, 2.92, 3.83, 4.97, 5.99
];

const listingRatio = [
  0.18, 0.20, 0.25, 0.26, 0.22, 0.19, 0.15, 0.12, 0.13, 0.11, 0.09, 0.08,
  0.08, 0.09, 0.14, 0.18, 0.21, 0.20, 0.16, 0.14, 0.15, 0.17, 0.22, 0.24,
  0.26, 0.28, 0.32, 0.35, 0.38, 0.34, 0.28, 0.22, 0.20, 0.19, 0.17, 0.16,
  0.18, 0.20, 0.26, 0.33, 0.37, 0.39
];

// 补全 42 个数值的二手房挂牌成交比 (%)
const listingTransactionRatio = [
  2.5, 2.8, 3.8, 4.0, 3.6, 3.2, 2.7, 2.2, 2.4, 2.1, 1.8, 1.6,
  1.5, 1.7, 2.6, 3.0, 3.2, 3.1, 2.8, 2.5, 2.6, 2.9, 3.3, 3.5,
  3.8, 4.2, 4.8, 5.2, 5.5, 5.1, 4.5, 3.9, 3.7, 3.5, 3.2, 3.0,
  3.2, 3.5, 4.1, 4.8, 5.2, 5.6
];

const districts = [
  { id: "xihu", name: "西湖区", price: 58500, volume: 820, lat: 30.26, lng: 120.12 },
  { id: "gongshu", name: "拱墅区", price: 46200, volume: 640, lat: 30.32, lng: 120.15 },
  { id: "shangcheng", name: "上城区", price: 54800, volume: 550, lat: 30.24, lng: 120.20 },
  { id: "binjiang", name: "滨江区", price: 51200, volume: 490, lat: 30.20, lng: 120.21 },
  { id: "yuhang", name: "余杭区", price: 37500, volume: 1120, lat: 30.28, lng: 120.02 },
  { id: "xiaoshan", name: "萧山区", price: 34200, volume: 980, lat: 30.18, lng: 120.26 },
  { id: "linping", name: "临平区", price: 21500, volume: 420, lat: 30.42, lng: 120.30 },
  { id: "qiantang", name: "钱塘区", price: 28500, volume: 510, lat: 30.30, lng: 120.35 },
  { id: "fuyang", name: "富阳区", price: 20200, volume: 290, lat: 30.05, lng: 119.95 }
];

const communityTemplates = [
  { communityId: "comm_01", name: "学雅苑", district: "西湖区", subDistrict: "文教", lat: 30.28, lng: 120.12, basePrice: 72800, mainRoomType: "三居", activeListingCount: 45 },
  { communityId: "comm_02", name: "翡翠城", district: "余杭区", subDistrict: "未来科技城", lat: 30.27, lng: 120.03, basePrice: 38200, mainRoomType: "三居", activeListingCount: 120 },
  { communityId: "comm_03", name: "柳浪东苑", district: "上城区", subDistrict: "西湖景区", lat: 30.24, lng: 120.16, basePrice: 96500, mainRoomType: "四居+", activeListingCount: 15 },
  { communityId: "comm_04", name: "武林壹号", district: "拱墅区", subDistrict: "文晖", lat: 30.27, lng: 120.15, basePrice: 118000, mainRoomType: "四居+", activeListingCount: 22 },
  { communityId: "comm_05", name: "朝晖六区", district: "拱墅区", subDistrict: "朝晖", lat: 30.29, lng: 120.16, basePrice: 32200, mainRoomType: "二居", activeListingCount: 85 },
  { communityId: "comm_06", name: "金沙湖壹号", district: "钱塘区", subDistrict: "下沙", lat: 30.31, lng: 120.28, basePrice: 28500, mainRoomType: "三居", activeListingCount: 60 },
  { communityId: "comm_07", name: "良渚文化村", district: "余杭区", subDistrict: "良渚", lat: 30.34, lng: 120.01, basePrice: 25200, mainRoomType: "三居", activeListingCount: 140 },
  { communityId: "comm_08", name: "春江郦城", district: "滨江区", subDistrict: "区政府", lat: 30.21, lng: 120.21, basePrice: 62800, mainRoomType: "三居", activeListingCount: 38 },
  { communityId: "comm_09", name: "江南之星", district: "萧山区", subDistrict: "市心北路", lat: 30.19, lng: 120.24, basePrice: 43500, mainRoomType: "三居", activeListingCount: 52 },
  { communityId: "comm_10", name: "东方苑", district: "富阳区", subDistrict: "富春", lat: 30.05, lng: 119.95, basePrice: 20500, mainRoomType: "三居", activeListingCount: 40 },
  { communityId: "comm_11", name: "红丰社区", district: "临平区", subDistrict: "南苑", lat: 30.42, lng: 120.30, basePrice: 18200, mainRoomType: "二居", activeListingCount: 75 }
];

// 生成 18 个月的历史数据（2025-01 至 2026-06）
const historyMonths = [
  "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06",
  "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12",
  "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"
];

// 价格波动曲线：从 2025-01 开始，到 2025-12 呈缓慢下滑趋势，2026-01 起缓慢回升
const waveMultipliers = [
  1.02, 1.01, 1.03, 1.025, 1.035, 1.015, 1.00, 0.98, 0.985, 0.975, 0.965, 0.96,
  0.965, 0.97, 0.985, 0.99, 0.995, 1.00
];

// 交易套数分布（根据小区规模而不同）
function getVolume(baseVal, idx) {
  // 春季和年底多，夏季少
  const seasonal = [1.1, 0.8, 1.4, 1.2, 1.3, 1.0, 0.9, 0.7, 0.9, 0.8, 0.7, 1.0, 0.9, 0.7, 1.3, 1.1, 1.2, 1.2];
  return Math.max(1, Math.round(baseVal * seasonal[idx]));
}

const communities = communityTemplates.map(c => {
  const basePrice = c.basePrice;
  // 决定不同房型比例
  const roomTypesDist = c.mainRoomType === "四居+" ? 
    { "一居": 0.05, "二居": 0.10, "三居": 0.25, "四居+": 0.60 } :
    c.mainRoomType === "二居" ?
    { "一居": 0.25, "二居": 0.50, "三居": 0.20, "四居+": 0.05 } :
    { "一居": 0.10, "二居": 0.25, "三居": 0.50, "四居+": 0.15 };

  const transactions = historyMonths.map((month, idx) => {
    const mult = waveMultipliers[idx];
    const avgPrice = Math.round((basePrice * mult) / 100) * 100;
    const baseVol = c.activeListingCount * 0.1; // 活跃挂牌的 10% 左右是均值
    const volume = getVolume(baseVol, idx);

    // 随机分配各房型销量，确保总和等于 volume
    const roomTypes = { "一居": 0, "二居": 0, "三居": 0, "四居+": 0 };
    let remaining = volume;
    const keys = Object.keys(roomTypes);
    keys.forEach((k, kIdx) => {
      if (kIdx === keys.length - 1) {
        roomTypes[k] = remaining;
      } else {
        const share = Math.round(volume * roomTypesDist[k]);
        const val = Math.min(remaining, Math.max(0, share));
        roomTypes[k] = val;
        remaining -= val;
      }
    });

    return { month, averagePrice: avgPrice, volume, roomTypes };
  });

  // 各房型单价差异
  const roomTypePrices = {
    "一居": Math.round(basePrice * 0.92 / 100) * 100,
    "二居": Math.round(basePrice * 0.97 / 100) * 100,
    "三居": Math.round(basePrice * 1.00 / 100) * 100,
    "四居+": Math.round(basePrice * 1.07 / 100) * 100
  };

  return {
    communityId: c.communityId,
    name: c.name,
    district: c.district,
    subDistrict: c.subDistrict,
    lat: c.lat,
    lng: c.lng,
    mainRoomType: c.mainRoomType,
    activeListingCount: c.activeListingCount,
    averagePrice: basePrice,
    transactions,
    roomTypePrices
  };
});

// 构建完整的 window.MVP_PREVIEW_DATA
const fullData = {
  productName: "杭州房地产信息可视化系统",
  summary: `本数据包含2023年1月至2026年6月的全国/70城大盘宏观指标，以及杭州${communities.length}个代表性小区的微观网签成交历史（2025-01至2026-06）。`,
  macroData: {
    months: macroMonths,
    index70SecondRing,
    index70SecondYear,
    index70NewRing,
    index70NewYear,
    salesArea,
    salesAreaSpeed,
    salesAmount,
    demand: {
      personalLoans: [
        2230, 1850, 4670, 1200, 2800, 4500, 1400, 1900, 3500, 1600, 2100, 3100,
        1560, 1200, 3800,  980, 2100, 3700, 1100, 1300, 2800, 1200, 1600, 2400,
        2400, 1980, 4900, 1500, 3100, 4800, 1800, 2200, 3900, 1900, 2500, 3600,
        2600, 2100, 5200, 1780, 3400, 5100
      ],
      priceToIncome: [
        11.8, 11.7, 11.5, 11.4, 11.3, 11.2, 11.0, 10.8, 10.7, 10.5, 10.3, 10.1,
        9.9, 9.8, 9.7, 9.6, 9.5, 9.4, 9.3, 9.2, 9.1, 9.0, 8.9, 8.8, 8.7, 8.6,
        8.5, 8.5, 8.4, 8.4, 8.3, 8.3, 8.2, 8.2, 8.1, 8.1, 8.1, 8.0, 8.0, 7.9,
        7.9, 7.8
      ],
      mortgageToIncome: [
        48.2, 48.0, 47.1, 46.8, 46.2, 45.8, 45.0, 44.2, 43.8, 43.1, 42.5, 41.8,
        41.0, 40.5, 39.8, 39.2, 38.8, 38.2, 37.8, 37.2, 36.8, 36.2, 35.8, 35.2,
        34.8, 34.2, 33.8, 33.5, 33.2, 33.0, 32.8, 32.5, 32.2, 32.0, 31.8, 31.5,
        31.2, 30.8, 30.5, 30.2, 29.8, 29.5
      ],
      rentToSell: [
        580, 578, 575, 572, 570, 565, 560, 558, 555, 550, 548, 545,
        540, 538, 535, 532, 530, 528, 525, 522, 520, 518, 515, 512,
        510, 508, 505, 502, 500, 498, 495, 492, 490, 488, 485, 482,
        480, 478, 475, 472, 470, 468
      ],
      rentalYield: [
        1.72, 1.73, 1.74, 1.75, 1.75, 1.77, 1.79, 1.79, 1.80, 1.82, 1.82, 1.83,
        1.85, 1.86, 1.87, 1.88, 1.89, 1.89, 1.90, 1.92, 1.92, 1.93, 1.94, 1.95,
        1.96, 1.97, 1.98, 1.99, 2.00, 2.01, 2.02, 2.03, 2.04, 2.05, 2.06, 2.07,
        2.08, 2.09, 2.11, 2.12, 2.13, 2.14
      ],
      debtToIncome: [
        112.5, 112.8, 113.1, 113.4, 113.8, 114.2, 114.5, 114.8, 115.1, 115.3, 115.5, 115.8,
        116.0, 116.2, 116.4, 116.5, 116.8, 117.0, 117.2, 117.3, 117.5, 117.8, 118.0, 118.2,
        118.5, 118.6, 118.8, 118.9, 119.0, 119.2, 119.3, 119.4, 119.5, 119.6, 119.8, 120.0,
        120.1, 120.2, 120.4, 120.5, 120.7, 120.8
      ]
    },
    supply: {
      newConstruction: [
        8200, 12400, 19800, 26400, 32800, 39500, 44200, 48900, 54500, 59800, 64900, 71200,
        7100, 10800, 17200, 22600, 28100, 33500, 37600, 41700, 46300, 50800, 55200, 60800,
        7600, 11500, 18400, 24200, 30200, 36200, 40800, 45200, 50100, 55100, 59800, 65800,
        7900, 12000, 19200, 25300, 31500, 37900
      ],
      realizedCapital: [
        11500, 17800, 29800, 38900, 49200, 59800, 68500, 76200, 87500, 97800, 107900, 120500,
        10200, 15600, 26200, 34100, 43200, 52400, 59800, 66500, 76400, 85200, 93800, 104800,
        10900, 16800, 28200, 36800, 46500, 56800, 64800, 72200, 82900, 92500, 101800, 113800,
        11200, 17200, 29100, 37900, 47900, 58200
      ],
      threeRedLines: {
        green: 95,
        yellow: 48,
        orange: 22,
        red: 10
      },
      listingRatio,
      listingTransactionRatio,
      secondHandSales: {
        cities: ["北京", "上海", "广州", "深圳", "杭州", "南京", "成都", "西安"],
        sales: [12800, 15900, 6800, 4200, 7800, 5200, 16200, 8900],
        salesRing: [8.5, 12.1, -2.3, 5.4, 15.2, -4.1, 9.8, 3.2]
      }
    }
  },
  hzMapData: {
    districts,
    communities
  }
};

const outputContent = `// 静态 MVP preview 假数据。所有页面演示数据必须集中放在这里。

window.MVP_PREVIEW_DATA = ${JSON.stringify(fullData, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../preview/mvp/mock-data.js'), outputContent, 'utf-8');
console.log("mock-data.js generated successfully!");
