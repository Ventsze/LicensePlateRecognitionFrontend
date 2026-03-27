// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import { getDashboardStats } from "../lib/api"; 

// 🎯 提前准备好一套非常丰满的“演示假数据”
const MOCK_DATA = {
  revenue: 3250.00,
  availableSpots: 120,
  totalCapacity: 200,
  todayEntries: 482,
  chartCategories: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
  chartData: [120, 182, 145, 210, 260, 320, 290]
};

// 🎯 真实数据的初始空壳
const EMPTY_REAL_DATA = {
  revenue: 0, availableSpots: 200, totalCapacity: 200, todayEntries: 0,
  chartCategories: ["08:00", "10:00", "12:00", "14:00", "16:00"], chartData: [0, 0, 0, 0, 0]
};

export default function Dashboard() {
  // 👉 1. 核心开关：是否开启演示模式 (默认开启，方便答辩一上来就好看)
  const [isMockMode, setIsMockMode] = useState(true);

  // 👉 2. 存放后端返回的真实数据
  const [realStats, setRealStats] = useState(EMPTY_REAL_DATA);

  // 页面加载时去拿真实数据（偷偷存起来，等用户切回真实模式时用）
  useEffect(() => {
    getDashboardStats()
      .then(data => setRealStats(data))
      .catch(err => console.error("获取大屏数据失败:", err));
  }, []);

  // 👉 3. 动态决定当前要渲染的数据：如果开启了 Mock，就用假数据，否则用真数据
  const stats = isMockMode ? MOCK_DATA : realStats;

  // 4. 折线图配置 
  const lineChartOption = {
    tooltip: { trigger: "axis" },
    grid: { left: "3%", right: "4%", bottom: "5%", containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: stats.chartCategories, // 👈 动态吃数据
      axisLine: { show: false }, 
      axisTick: { show: false }, 
      axisLabel: { color: "#86868b", margin: 16 },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { type: "dashed", color: "#e5e5ea" } }, 
      axisLabel: { color: "#86868b" },
    },
    series: [
      {
        name: "入场车次",
        type: "line",
        smooth: true, 
        symbol: "none", 
        lineStyle: { width: 4, color: isMockMode ? "#ff9500" : "#0071e3" }, // 演示模式用橙色线，真实模式用蓝色线区分
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: isMockMode ? "rgba(255,149,0,0.3)" : "rgba(0,113,227,0.3)" }, 
              { offset: 1, color: isMockMode ? "rgba(255,149,0,0.0)" : "rgba(0,113,227,0.0)" }  
            ],
          },
        },
        data: stats.chartData, // 👈 动态吃数据
      },
    ],
  };

  // 5. 环形图配置
  const pieChartOption = {
    tooltip: { trigger: "item" },
    legend: { bottom: "0%", left: "center", icon: "circle", textStyle: { color: "#86868b" } },
    series: [
      {
        name: "车位状态",
        type: "pie",
        radius: ["55%", "80%"], 
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: "#fff", borderWidth: 4 },
        label: { show: false, position: "center" },
        emphasis: { label: { show: true, fontSize: 24, fontWeight: "bold", color: "#1d1d1f" } },
        labelLine: { show: false },
        data: [
          // 👈 智能动态计算：总容量 - 空闲 = 已占用
          { value: stats.totalCapacity - stats.availableSpots, name: "已占用", itemStyle: { color: "#ff3b30" } }, 
          // 演示模式下给预留车位写死 15 个，真实模式下暂时为 0
          { value: isMockMode ? 15 : 0, name: "预约/预留", itemStyle: { color: "#ff9500" } }, 
          { value: stats.availableSpots - (isMockMode ? 15 : 0), name: "空闲可用", itemStyle: { color: "#34c759" } }, 
        ],
      },
    ],
  };

  // 顶部卡片组件
  const StatCard = ({ title, value, unit, trend }) => (
    <div style={{
      background: "#fff", borderRadius: 20, padding: 24, flex: 1, minWidth: 200,
      boxShadow: "0 4px 20px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", gap: 8,
      border: isMockMode ? "1px solid rgba(255,149,0,0.2)" : "1px solid transparent", // 演示模式加个微弱的橙色框
      transition: "all 0.3s"
    }}>
      <div style={{ color: "#86868b", fontSize: 15, fontWeight: 500 }}>{title}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 36, fontWeight: 700, color: "#1d1d1f", letterSpacing: "-1px" }}>{value}</span>
        <span style={{ fontSize: 16, color: "#86868b" }}>{unit}</span>
      </div>
      <div style={{ 
        fontSize: 13, 
        color: isMockMode ? "#ff9500" : "#34c759", // 演示模式文字变橙
        fontWeight: 500, display: "flex", alignItems: "center", gap: 4 
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: isMockMode ? "#ff9500" : "#34c759" }}></div>
        {trend}
      </div>
    </div>
  );

  return (
    <div style={{ padding: "40px", boxSizing: "border-box", maxWidth: 1200, margin: "0 auto" }}>
      
      {/* 标题栏 + 👉 魔法切换按钮 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1d1d1f", margin: 0, letterSpacing: "-0.5px" }}>
          数据概览
        </h1>
        <button 
          onClick={() => setIsMockMode(!isMockMode)}
          style={{
            padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontWeight: 600, fontSize: 14,
            transition: "all 0.3s", outline: "none",
            // 根据模式切换按钮颜色
            border: `1px solid ${isMockMode ? "#ff9500" : "#0071e3"}`,
            background: isMockMode ? "#fff8e6" : "#e6f0ff",
            color: isMockMode ? "#d97706" : "#0071e3"
          }}
        >
          {isMockMode ? "✨ 演示模式 (点击切为真实数据)" : "📊 真实数据 (点击切为演示模式)"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 32 }}>
        <StatCard 
          title="今日总收入" 
          value={Number(stats.revenue || 0).toFixed(2)} 
          unit="₽" 
          trend={isMockMode ? "静态演示数据" : "实时更新"} 
        />
        <StatCard 
          title="今日进场车次" 
          value={stats.todayEntries} 
          unit="辆" 
          trend={isMockMode ? "静态演示数据" : "实时监控中"} 
        />
        <StatCard 
          title="当前空闲车位" 
          value={stats.availableSpots} 
          unit={`/ ${stats.totalCapacity}`} 
          trend={isMockMode ? "模拟设备在线" : "设备在线"} 
        />
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        
        <div style={{ background: "#fff", borderRadius: 24, padding: "32px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", flex: "2 1 500px" }}>
          <h3 style={{ margin: "0 0 24px 16px", fontSize: 18, fontWeight: 600, color: "#1d1d1f" }}>
            {isMockMode ? "过去 7 天车流量趋势" : "今日时段车流量趋势"}
          </h3>
          <ReactECharts option={lineChartOption} style={{ height: 350, width: "100%" }} />
        </div>

        <div style={{ background: "#fff", borderRadius: 24, padding: "32px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", flex: "1 1 300px" }}>
          <h3 style={{ margin: "0 0 24px 16px", fontSize: 18, fontWeight: 600, color: "#1d1d1f", textAlign: "center" }}>实时车位状态</h3>
          <ReactECharts option={pieChartOption} style={{ height: 350, width: "100%" }} />
        </div>

      </div>
    </div>
  );
}