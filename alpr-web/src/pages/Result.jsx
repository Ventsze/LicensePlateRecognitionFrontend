// src/pages/Result.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { fetchStats, toAbsUrl } from "../lib/api";

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // 兼容两种进入方式：1) 从 Upload navigate 过来（state） 2) 直接用 ?url=&run= 打开
  const params = new URLSearchParams(window.location.search);
  const urlFromQuery = params.get("url") || "";
  const runFromQuery = params.get("run") || "";

  const videoUrl = state?.videoUrl || toAbsUrl(urlFromQuery || ""); // 尽量使用绝对地址
  const run = state?.run || runFromQuery || "";
  const initialStats = Array.isArray(state?.stats) ? state.stats : undefined;

  const [rows, setRows] = useState(initialStats || []);
  const [loading, setLoading] = useState(!Array.isArray(initialStats) && !!run); // 有 run 但没初始统计时再拉
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  // 没有视频就回首页
  useEffect(() => {
    if (!videoUrl) navigate("/", { replace: true });
  }, [videoUrl, navigate]);

  // 按 run 拉统计（若 Upload 时未携带 stats）
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (initialStats || !run) return;
      setLoading(true);
      setErr("");
      try {
        const arr = await fetchStats(run);
        if (mounted) setRows(arr);
      } catch (e) {
        if (mounted) setErr(e.message || "拉取统计失败");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [run, initialStats]);

  // 搜索 + 分数降序
  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    const arr = Array.isArray(rows) ? rows : [];
    const byText = key
      ? arr.filter(r => String(r.plate || r.license_number || "").toLowerCase().includes(key))
      : arr;
    const scoreOf = (r) => Number(r?.max_text_score ?? r?.max_score ?? 0);
    return [...byText].sort((a, b) => scoreOf(b) - scoreOf(a));
  }, [rows, q]);

  if (!videoUrl) return null;

  return (
    <main className="page">
      {/* 轻量样式，含移动端适配 */}
      <style>{`
        .page { padding: 24px; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
        .container { max-width: 960px; margin: 0 auto; }
        .videoWrap { width: 100%; margin: 8px 0; }
        .video { width: 100%; height: auto; background:#000; border-radius: 8px; }
        .note { margin-top: 8px; word-break: break-all; }
        .search { margin: 8px 0 12px; padding: 6px 8px; width: 240px; border: 1px solid #ddd; border-radius: 6px; }
        .tbl { border-collapse: collapse; width: 100%; max-width: 100%; }
        .th { text-align: left; border-bottom: 1px solid #ddd; padding: 8px; }
        .td { border-bottom: 1px solid #f0f0f0; padding: 8px; }

        /* 卡片列表（默认隐藏，移动端展示） */
        .cards { display: none; }
        .card { border: 1px solid #eee; border-radius: 8px; padding: 10px; }
        .plate { font-weight: 700; font-size: 16px; }
        .meta { color:#666; font-size: 13px; margin-top: 4px; }

        /* 移动端适配 */
        @media (max-width: 640px) {
          .page { padding: 16px; }
          h1 { font-size: 20px; margin-bottom: 10px; }
          h2 { font-size: 16px; }
          .search { width: 100%; }
          .tbl { display: none; }
          .cards { display: grid; grid-template-columns: 1fr; gap: 8px; }
        }
      `}</style>

      <div className="container">
        <h1>识别结果</h1>

        <div className="videoWrap">
          <video
            src={videoUrl}
            controls
            playsInline
            preload="metadata"
            className="video"
          />
        </div>

        <p className="note">
          如果无法播放，直接复制链接在新标签页打开：<br />
          <a href={videoUrl} target="_blank" rel="noreferrer">{videoUrl}</a>
        </p>

        <h2 style={{ marginTop: 24 }}>
          识别统计 {run ? `（run=${run}）` : ""}
        </h2>

        {/* 搜索框 */}
        <input
          className="search"
          placeholder="搜索车牌…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {loading && <p>加载统计中…</p>}
        {err && <p style={{ color: "crimson" }}>出错：{err}</p>}

        {!loading && !err && (
          filtered.length ? (
            <>
              {/* 桌面端：表格 */}
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="th">车牌</th>
                    <th className="th">最大文本分数</th>
                    <th className="th">样本数</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={i}>
                      <td className="td">{String(r.plate || r.license_number || "-")}</td>
                      <td className="td">{String(r.max_text_score ?? r.max_score ?? "-")}</td>
                      <td className="td">{String(r.samples ?? r.count ?? "-")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 移动端：卡片 */}
              <div className="cards">
                {filtered.map((r, i) => {
                  const plate = String(r.plate || r.license_number || "-");
                  const score = String(r.max_text_score ?? r.max_score ?? "-");
                  const count = String(r.samples ?? r.count ?? "-");
                  return (
                    <div className="card" key={i}>
                      <div className="plate">{plate}</div>
                      <div className="meta">最大文本分数：{score}</div>
                      <div className="meta">样本数：{count}</div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p>暂无统计数据。</p>
          )
        )}
      </div>
    </main>
  );
}
