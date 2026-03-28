// src/lib/api.js
const API_BASE = "http://192.168.31.104:8080"; 

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

// ====== 钱包与 VIP 相关 API ======

// 获取钱包余额和 VIP 状态
export async function getWalletInfo(plate) {
  const res = await fetch(`${API_BASE}/api/wallet/${encodeURIComponent(plate)}`);
  if (!res.ok) throw new Error('获取钱包信息失败');
  return res.json(); 
  // 预期后端返回: { balance: 150.00, vipExpireTime: "2026-05-01T12:00:00Z" }
}

// 模拟充值
export async function rechargeWallet(plate, amount) {
  const res = await fetch(`${API_BASE}/api/wallet/recharge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plate, amount })
  });
  if (!res.ok) throw new Error('充值失败');
  return res.json();
}

// 购买/续费 VIP
export async function buyVip(plate, days) {
  const res = await fetch(`${API_BASE}/api/wallet/buy-vip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plate, days })
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || '开通 VIP 失败，可能是余额不足');
  return data;
}