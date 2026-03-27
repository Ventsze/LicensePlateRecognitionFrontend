// src/pages/History.jsx
import { useEffect, useMemo, useState } from "react";
import { exportHistoryCSV } from "../lib/csv";
import { toAbsUrl } from "../lib/api";

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const r = await fetch("/api/alpr/runs"); // 走 Vite 代理
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setItems(Array.isArray(d?.runs) ? d.runs : []);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    const arr = Array.isArray(items) ? items : [];
    const byText = key ? arr.filter(it => String(it.run || "").toLowerCase().includes(key)) : arr;
    // 时间倒序
    return [...byText].sort((a, b) => Number(b.modified || 0) - Number(a.modified || 0));
  }, [items, q]);

  const onExport = () => {
    if (!filtered.length) return;
    // 映射成导出工具需要的结构
    const list = filtered.map(it => ({
      run: it.run,
      downloadUrl: toAbsUrl(it.download_url),
      createdAt: it.modified,
    }));
    exportHistoryCSV(list); // 下载 alpr_history.csv
  };

  const fmtTime = (t) => (t ? new Date(t).toLocaleString() : "-");
  const fmtSize = (n) => {
    if (n == null) return "-";
    let x = Number(n), u = ["B", "KB", "MB", "GB", "TB"], i = 0;
    while (x >= 1024 && i < u.length - 1) { x /= 1024; i++; }
    const fixed = x < 10 ? 1 : 0;
    return `${x.toFixed(fixed)} ${u[i]}`;
  };

  return (
    <div className="apple-page">
      <h1 className="apple-title">历史记录</h1>

      {/* 顶部操作栏 */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
        <input
          className="apple-input"
          placeholder="🔍 搜索识别记录…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: 280 }}
        />
        <button className="apple-btn apple-btn-secondary" onClick={load} disabled={loading}>
          {loading ? "加载中…" : "刷新"}
        </button>
        <button className="apple-btn" onClick={onExport} disabled={!filtered.length || loading}>
          导出 CSV
        </button>
      </div>

      {/* 状态提示 */}
      {err && <p style={{ color: "#ff3b30", marginBottom: 16 }}>出错：{err}</p>}
      {!loading && !filtered.length && !err && (
        <p style={{ color: "#86868b", marginTop: 24 }}>暂无历史记录。</p>
      )}

      {/* 类似 Mac 相册的精美缩略图网格 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 20,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {filtered.map((it, i) => {
          const urlAbs = toAbsUrl(it.download_url || "");
          const thumbAbs = it.thumb_url ? toAbsUrl(it.thumb_url) : "";
          return (
            <a
              key={i}
              href={`/result?url=${encodeURIComponent(urlAbs)}&run=${encodeURIComponent(it.run)}`}
              className="apple-card"
              style={{
                display: "block",
                padding: 16,
                textDecoration: "none",
                color: "inherit"
              }}
            >
              {/* 封面图容器 */}
              <div
                style={{
                  width: "100%",
                  aspectRatio: "16/9",
                  background: "#f5f5f7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  borderRadius: 10,
                  marginBottom: 16
                }}
              >
                {thumbAbs ? (
                  <img
                    src={thumbAbs}
                    alt={it.run}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    loading="lazy"
                  />
                ) : (
                  <span style={{ color: "#86868b", fontSize: 13 }}>无缩略图</span>
                )}
              </div>
              
              {/* 文字信息 */}
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: "#1d1d1f", marginBottom: 6, wordBreak: "break-all" }}>
                  {it.run}
                </div>
                <div style={{ color: "#86868b", fontSize: 13 }}>
                  {fmtTime(it.modified)} · {fmtSize(it.size)}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}