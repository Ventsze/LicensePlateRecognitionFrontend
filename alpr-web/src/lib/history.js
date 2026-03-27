// src/lib/history.js
const KEY = "alpr:history";

export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveRun({ run, downloadUrl, createdAt = Date.now() }) {
  const list = loadHistory();
  // 去重：同 run 只保留一条
  const i = list.findIndex((x) => x.run === run);
  if (i >= 0) list.splice(i, 1);
  list.unshift({ run, downloadUrl, createdAt });
  // 只保留最近 50 条
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
}

export function clearHistory() {
  localStorage.removeItem(KEY);
}
