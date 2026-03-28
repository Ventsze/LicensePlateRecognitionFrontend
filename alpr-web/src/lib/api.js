// src/lib/api.js
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export function toAbsUrl(u) {
  return u?.startsWith("http") ? u : `${API_BASE}${u || ""}`;
}

export function parseRunFromUrl(downloadUrl) {
  const m = String(downloadUrl || "").match(/\/files\/(.+)\.(mp4|webm|mov|m4v)$/i);
  return m ? m[1] : "";
}

export async function uploadVideo(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/alpr/video`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json(); // 可能返回 { download_url, stats?, ... }
}

export async function fetchStats(run) {
  const url = run
    ? `${API_BASE}/api/alpr/stats?run=${encodeURIComponent(run)}`
    : `${API_BASE}/api/alpr/stats`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Stats failed: ${res.status}`);
  const data = await res.json();
  // 后端可能返回 { stats: [...] }，也可能直接返回数组
  return Array.isArray(data) ? data : (Array.isArray(data.stats) ? data.stats : []);
}

// === Pipeline ===
export async function pipelineProcess(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/pipeline/process`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload fail: ${res.status}`);
  return res.json(); // { download_url, message, error, stats: [...] }
}

export async function pipelineStats() {
  const res = await fetch(`${API_BASE}/api/pipeline/stats`);
  if (!res.ok) throw new Error(`stats fail: ${res.status}`);
  return res.json();
}

// === Parking trigger ===
export async function parkingEntry(cameraId = 1) {
  const res = await fetch(`${API_BASE}/api/parking/entry/trigger?cameraId=${cameraId}`, { method: "POST" });
  if (!res.ok) throw new Error(`entry fail: ${res.status}`);
  return res.json();
}

export async function parkingExit(cameraId = 2) {
  const res = await fetch(`${API_BASE}/api/parking/exit/trigger?cameraId=${cameraId}`, { method: "POST" });
  if (!res.ok) throw new Error(`exit fail: ${res.status}`);
  return res.json();
}

export async function getLatestSessionByPlate(plate) {
  const res = await fetch(`/api/parking/sessions/latest?plate=${encodeURIComponent(plate)}`);
  if (!res.ok) throw new Error(`latest fail: ${res.status}`);
  return res.json();
}

export async function getSessionById(id) {
  const res = await fetch(`/api/parking/sessions/${id}`);
  if (!res.ok) throw new Error(`session fail: ${res.status}`);
  return res.json();
}

export async function getActiveTariff() {
  const res = await fetch('/api/parking/tariff/active');
  if (!res.ok) throw new Error(`tariff ${res.status}`);
  return res.json(); // { id, name, free_minutes, round_up_min, price_per_hour }
}

// 白名单
export async function adminGetWhitelist() {
  const r = await fetch('/api/parking/admin/whitelist');
  if (!r.ok) throw new Error('whitelist load fail');
  return r.json();
}
export async function adminAddWhitelist(plate, days = 30) {
  const r = await fetch('/api/parking/admin/whitelist', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ plate, days }) 
  });
  if (!r.ok) throw new Error('add whitelist fail');
  return r.json();
}
export async function adminRemoveWhitelist(plate) {
  const r = await fetch(`/api/parking/admin/whitelist/${encodeURIComponent(plate)}`, { method: 'DELETE' });
  if (!r.ok) throw new Error('remove whitelist fail');
  return r.json();
}

// 当前在场
export async function adminGetParked() {
  const r = await fetch('/api/parking/admin/parked');
  if (!r.ok) throw new Error('parked list fail');
  return r.json();
}

// 👉 人工干预：人工录入车辆入库
export async function adminManualEntry(plate) {
  const r = await fetch('/api/parking/admin/manual-entry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plate })
  });
  const data = await r.json();
  if (!r.ok || data.error) throw new Error(data.error || '人工入库失败');
  return data;
}

// 👉 人工干预：将 OPEN 状态的车辆手动转为 READY_TO_CLOSE
export async function adminManualExit(sessionId) {
  const r = await fetch(`/api/parking/admin/manual-exit/${sessionId}`, {
    method: "POST"
  });
  const data = await r.json();
  if (!r.ok || data.error) throw new Error(data.error || "人工出库失败");
  return data;
}

// 获取数据大屏统计数据
export async function getDashboardStats() {
  const r = await fetch('/api/dashboard/stats');
  if (!r.ok) throw new Error('获取大屏数据失败');
  return r.json();
}