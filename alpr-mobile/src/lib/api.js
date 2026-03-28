// src/lib/api.js
const API_BASE = "http://192.168.31.103:8080"; 

// 统一的请求工具函数
async function request(url) {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) throw new Error(`请求失败: ${res.status}`);
  return await res.json();
}

// 1. 获取最新状态
export const getLatestSession = (plate) => 
  request(`/api/parking/sessions/latest?plate=${encodeURIComponent(plate)}`);

// 2. 获取所有历史记录 (对应刚才后端新增的接口)
export const getParkingHistory = (plate) => 
  request(`/api/parking/sessions/all?plate=${encodeURIComponent(plate)}`);

// 👉 3. 模拟支付并离场 (POST 请求)
export const checkoutParking = async (plate) => {
  const res = await fetch(`${API_BASE}/api/parking/sessions/checkout?plate=${encodeURIComponent(plate)}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`结算失败: ${res.status}`);
  return await res.json();
};