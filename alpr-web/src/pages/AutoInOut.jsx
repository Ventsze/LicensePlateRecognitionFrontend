// src/pages/AutoInOut.jsx
import { useMemo, useRef, useState, useEffect } from "react";
import {
  pipelineProcess,
  parkingEntry,
  parkingExit,
  getLatestSessionByPlate,
  getSessionById,
  getActiveTariff,
  toAbsUrl,
} from "../lib/api";

function pickFirstVideo(fs) {
  const arr = Array.from(fs || []);
  const f =
    arr.find((f) => String(f.type).startsWith("video/")) ||
    arr.find((f) => /\.(mp4|mov|m4v|webm)$/i.test(f.name || ""));
  return f || null;
}

// 提取的纯 UI 组件：苹果风上传卡片
function DropCard({ title, file, setFile, onRun, loading }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const onInputChange = (e) => {
    const f = pickFirstVideo(e.target.files);
    setFile(f || null);
  };
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(false);
    const f = pickFirstVideo(e.dataTransfer?.files);
    setFile(f || null);
  };

  const sizeMB = useMemo(() => (file ? Math.round(file.size / 1024 / 1024) : 0), [file]);

  return (
    <div className="apple-card" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: "#1d1d1f" }}>{title}</h3>
      <p style={{ margin: "0 0 20px", color: "#86868b", fontSize: 14 }}>
        支持 mp4 / mov / m4v / webm，单击或拖拽上传。
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDrag(false); }}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        style={{
          flex: 1,
          border: drag ? "2px dashed #0071e3" : "2px dashed #d2d2d7",
          backgroundColor: drag ? "rgba(0,113,227,0.04)" : "#fafafa",
          borderRadius: 12,
          padding: "32px 20px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s ease",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center"
        }}
      >
        <p style={{ margin: 0, color: "#1d1d1f", fontSize: 15 }}>
          拖拽视频到这里，或 <span style={{ color: "#0071e3" }}>点击选择</span>
        </p>
        {file && (
          <p style={{ margin: "12px 0 0", color: "#86868b", fontSize: 13 }}>
            已选择：<strong style={{ color: "#1d1d1f" }}>{file.name}</strong>（{sizeMB} MB）
          </p>
        )}
        <input ref={inputRef} type="file" accept="video/*" onChange={onInputChange} style={{ display: "none" }} />
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button className="apple-btn" style={{ flex: 1 }} onClick={onRun} disabled={!file || loading}>
          {loading ? "处理中…" : title.includes("入场") ? "🚗 识别并记为入场" : "🚙 识别并记为出场"}
        </button>
        <button className="apple-btn apple-btn-secondary" onClick={() => setFile(null)} disabled={loading}>
          重选
        </button>
      </div>
    </div>
  );
}

export default function AutoInOut() {
  const [fileIn, setFileIn] = useState(null);
  const [loadingIn, setLoadingIn] = useState(false);
  const [entryInfo, setEntryInfo] = useState(null);
  const [msgIn, setMsgIn] = useState("");

  const [fileOut, setFileOut] = useState(null);
  const [loadingOut, setLoadingOut] = useState(false);
  const [exitInfo, setExitInfo] = useState(null);
  const [msgOut, setMsgOut] = useState("");

  const [tariff, setTariff] = useState(null);

  useEffect(() => {
    getActiveTariff().then(setTariff).catch(() => setTariff(null));
  }, []);

  const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : "-");
  const fmtDur = (ms) => {
    if (ms == null) return "-";
    const m = Math.floor(ms / 60000);
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return h ? `${h}小时${mm}分钟` : `${m}分钟`;
  };

  const runIn = async () => {
    if (!fileIn) return;
    setLoadingIn(true);
    setMsgIn("识别中…");
    setEntryInfo(null);
    try {
      const r = await pipelineProcess(fileIn);
      const top = (r?.stats || []).find((s) => s.license_number && s.license_number !== "0");
      const plate = top?.license_number || "";
      const videoUrl = r?.download_url ? toAbsUrl(r.download_url) : null;

      const gate = await parkingEntry(1);

      let sess = null;
      try {
        if (gate.plate || plate) {
          const p = gate.plate || plate;
          sess = await getLatestSessionByPlate(p);
        }
      } catch {}

      setMsgIn("");
      setEntryInfo({
        plate: gate.plate || plate || "-",
        isWhitelist: !!gate.isWhitelist,
        entryTime: sess?.entryTime || null,
        videoUrl,
      });
    } catch (e) {
      setMsgIn(`失败：${e.message || e}`);
    } finally {
      setLoadingIn(false);
    }
  };

  const runOut = async () => {
    if (!fileOut) return;
    setLoadingOut(true);
    setMsgOut("识别中…");
    setExitInfo(null);
    try {
      const r = await pipelineProcess(fileOut);
      const top = (r?.stats || []).find((s) => s.license_number && s.license_number !== "0");
      const plate = top?.license_number || "";
      const videoUrl = r?.download_url ? toAbsUrl(r.download_url) : null;

      const gate = await parkingExit(2);

      let sess = null;
      try {
        if (gate.sessionId) sess = await getSessionById(gate.sessionId);
      } catch {}

      const entryTs = sess?.entryTime ? new Date(sess.entryTime).getTime() : null;
      const exitTs = sess?.exitTime ? new Date(sess.exitTime).getTime() : null;
      const durText = entryTs && exitTs ? fmtDur(exitTs - entryTs) : "-";

      setMsgOut("");
      setExitInfo({
        plate: gate.plate || plate || "-",
        isWhitelist: !!gate.whitelist,
        entryTime: sess?.entryTime || null,
        exitTime: sess?.exitTime || null,
        durationText: durText,
        fee: gate.fee ?? sess?.fee ?? 0,
        videoUrl,
      });
    } catch (e) {
      setMsgOut(`失败：${e.message || e}`);
    } finally {
      setLoadingOut(false);
    }
  };

  // 辅助渲染信息条目的小组件
  const InfoRow = ({ label, value, highlight = false }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f5f5f7" }}>
      <span style={{ color: "#86868b", fontSize: 14 }}>{label}</span>
      <span style={{ color: highlight ? "#ff3b30" : "#1d1d1f", fontWeight: highlight ? 600 : 500, fontSize: 14 }}>{value}</span>
    </div>
  );

  return (
    <div className="apple-page">
      <h1 className="apple-title">模拟进出库测试</h1>

      <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", marginBottom: 32 }}>
        <DropCard title="左侧：识别文件并自动记录入场" file={fileIn} setFile={setFileIn} onRun={runIn} loading={loadingIn} />
        <DropCard title="右侧：识别文件并自动记录出场" file={fileOut} setFile={setFileOut} onRun={runOut} loading={loadingOut} />
      </div>

      <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))" }}>
        
        {/* 入场结果面板 */}
        {(entryInfo || msgIn) && (
          <div className="apple-card">
            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 600, color: "#1d1d1f" }}>入场识别结果</h3>
            {msgIn && <div style={{ color: "#0071e3", fontSize: 14, marginBottom: 16 }}>{msgIn}</div>}
            
            {entryInfo && (
              <>
                <div style={{ background: "#fafafa", borderRadius: 12, padding: "4px 16px", marginBottom: 20 }}>
                  <InfoRow label="车牌号码" value={entryInfo.plate} />
                  <InfoRow label="车辆类型" value={entryInfo.isWhitelist ? "✅ 白名单 (免费)" : "🚗 外来车辆 (计费)"} />
                  <InfoRow label="入场时间" value={fmt(entryInfo.entryTime)} />
                </div>

                {entryInfo.videoUrl && (
                  <div style={{ borderRadius: 12, overflow: "hidden", background: "#000", aspectRatio: "16/9" }}>
                    <video src={entryInfo.videoUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 出场结果面板 */}
        {(exitInfo || msgOut) && (
          <div className="apple-card">
            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 600, color: "#1d1d1f" }}>出场结算单</h3>
            {msgOut && <div style={{ color: "#0071e3", fontSize: 14, marginBottom: 16 }}>{msgOut}</div>}
            
            {exitInfo && (
              <>
                <div style={{ background: "#fafafa", borderRadius: 12, padding: "4px 16px", marginBottom: 20 }}>
                  <InfoRow label="车牌号码" value={exitInfo.plate} />
                  <InfoRow label="车辆类型" value={exitInfo.isWhitelist ? "✅ 白名单" : "🚗 外来车辆"} />
                  <InfoRow label="入场时间" value={fmt(exitInfo.entryTime)} />
                  <InfoRow label="出场时间" value={fmt(exitInfo.exitTime)} />
                  <InfoRow label="停车时长" value={exitInfo.durationText} />
                  <InfoRow label="收费标准" value={tariff ? `${Number(tariff.price_per_hour || 0).toFixed(2)} ₽/小时` : "读取中…"} />
                  <InfoRow label="免费时长" value={tariff ? `前 ${tariff.free_minutes} 分钟免费` : "-"} />
                  <InfoRow label="应收费用" value={`${Number(exitInfo.fee || 0).toFixed(2)} ₽`} highlight={!exitInfo.isWhitelist && exitInfo.fee > 0} />
                </div>

                {exitInfo.videoUrl && (
                  <div style={{ borderRadius: 12, overflow: "hidden", background: "#000", aspectRatio: "16/9" }}>
                    <video src={exitInfo.videoUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}