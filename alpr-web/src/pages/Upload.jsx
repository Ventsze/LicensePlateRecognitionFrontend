// src/pages/Upload.jsx
import { useMemo, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toAbsUrl, parseRunFromUrl, pipelineProcess, parkingEntry, parkingExit } from "../lib/api";

// XHR 带进度上传
function uploadWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/alpr/video");

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch (e) { reject(e); }
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));

    if (xhr.upload && typeof onProgress === "function") {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }

    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

export default function Upload() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // --- 状态管理 ---
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // 上传到结果页的状态
  const [uploadLoading, setUploadLoading] = useState(false);
  const [pct, setPct] = useState(0);
  
  // 本地流水线的状态
  const [pipelineResp, setPipelineResp] = useState(null);
  const [pipeMsg, setPipeMsg] = useState("");
  const [pipeLoading, setPipeLoading] = useState(false);
  
  // 全局错误
  const [err, setErr] = useState("");

  const SUPPORTS_CAPTURE = useMemo(() => (
    typeof navigator !== "undefined" && navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function" &&
    typeof window !== "undefined" && "MediaRecorder" in window
  ), []);

  const sizeMB = useMemo(() => file ? Math.round(file.size / 1024 / 1024) : 0, [file]);

  // --- 文件选择逻辑 ---
  const pickFirstVideo = (fs) => {
    const arr = Array.from(fs || []);
    return arr.find(f => String(f.type).startsWith("video/")) ||
           arr.find(f => /\.(mp4|mov|m4v|webm)$/i.test(f.name || "")) || null;
  };

  const handleFileChange = (f) => {
    setFile(f);
    setErr("");
    setPipeMsg("");
    setPipelineResp(null);
  };

  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    handleFileChange(pickFirstVideo(e.dataTransfer?.files));
  };

  // --- 核心操作逻辑 ---

  // 1. 生成完整报告并跳转 (原 FileUploadCard 逻辑)
  const handleFullUpload = async () => {
    if (!file) return;
    setUploadLoading(true); setErr(""); setPct(0);
    try {
      const data = await uploadWithProgress(file, setPct);
      const url = data.download_url || "";
      const run = parseRunFromUrl(url);
      const absUrl = toAbsUrl(url);
      navigate("/result", { state: { videoUrl: absUrl, run, stats: Array.isArray(data.stats) ? data.stats : undefined } });
    } catch (e) {
      setErr(e.message || "上传失败");
    } finally {
      setUploadLoading(false);
    }
  };

  // 2. 快速本地流水线 (原 PipelinePanel 逻辑)
  const runLocalPipeline = async () => {
    if (!file) return;
    setPipeLoading(true); setPipeMsg("正在提取车牌特征...");
    try {
      const r = await pipelineProcess(file);
      setPipelineResp(r);
      setPipeMsg(r?.message === "OK" ? "处理完成" : (r?.error || "处理异常"));
    } catch (e) {
      setPipeMsg(e.message || "处理失败");
    } finally {
      setPipeLoading(false);
    }
  };

  // 3. 模拟停车场操作
  const doAction = async (actionFn, actionName) => {
    setPipeMsg(`触发${actionName}...`);
    try {
      const r = await actionFn(1); // 默认传个假的车道ID
      setPipeMsg(`${actionName}结果：` + JSON.stringify(r));
    } catch (e) {
      setPipeMsg(`${actionName}失败：` + (e.message || ""));
    }
  };

  return (
    <div className="apple-page">
      <h1 className="apple-title">智能识别工作台</h1>

      <div className="apple-card" style={{ maxWidth: 900 }}>
        
        {/* 第一部分：获取视频源 */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 18, color: "#1d1d1f" }}>1. 提供视频源</h3>
          
          <div
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: isDragging ? "2px dashed #0071e3" : "2px dashed #d2d2d7",
              backgroundColor: isDragging ? "rgba(0,113,227,0.04)" : "#fafafa",
              borderRadius: 12, padding: "40px 20px", textAlign: "center",
              cursor: "pointer", transition: "all 0.2s ease"
            }}
          >
            <p style={{ margin: 0, color: "#1d1d1f", fontSize: 16 }}>
              拖拽视频到这里，或 <span style={{ color: "#0071e3" }}>点击选择本地文件</span>
            </p>
            {file && (
              <p style={{ margin: "12px 0 0", color: "#86868b", fontSize: 14 }}>
                当前选择：<strong style={{ color: "#1d1d1f" }}>{file.name}</strong>（{sizeMB} MB）
              </p>
            )}
            <input ref={inputRef} type="file" accept="video/*" onChange={(e) => handleFileChange(pickFirstVideo(e.target.files))} style={{ display: "none" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
            <span style={{ color: "#86868b", fontSize: 14 }}>或者：</span>
            <Link to="/capture" className="apple-btn apple-btn-secondary" style={{ textDecoration: "none" }}>
              📷 开启实时摄像头抓拍
            </Link>
          </div>
        </div>

        {/* 第二部分：处理与分析 (选中文件后才激活) */}
        <div style={{ opacity: file ? 1 : 0.4, transition: "opacity 0.3s", pointerEvents: file ? "auto" : "none" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 18, color: "#1d1d1f" }}>2. 处理与分析</h3>
          
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            {/* 核心操作 1：生成完整报告 */}
            <button className="apple-btn" onClick={handleFullUpload} disabled={uploadLoading || pipeLoading}>
              {uploadLoading ? `上传中 (${pct}%)...` : "⬆️ 生成完整分析报告"}
            </button>
            
            {/* 核心操作 2：快速流水线 */}
            <button className="apple-btn apple-btn-secondary" onClick={runLocalPipeline} disabled={uploadLoading || pipeLoading}>
              {pipeLoading ? "提取中..." : "⚡️ 快速本地提取"}
            </button>
          </div>

          {/* 进度条与错误提示 */}
          {uploadLoading && (
            <div style={{ height: 4, background: "#f5f5f7", borderRadius: 2, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "#0071e3", transition: "width 0.2s ease" }} />
            </div>
          )}
          {err && <p style={{ color: "#ff3b30", fontSize: 14 }}>{err}</p>}

          {/* 流水线结果展示区 */}
          {pipelineResp && (
            <div style={{ marginTop: 20, padding: 16, background: "#f5f5f7", borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontWeight: 600 }}>识别结果明细</span>
                {pipelineResp.download_url && (
                  <a href={pipelineResp.download_url} target="_blank" rel="noreferrer" style={{ color: "#0071e3", textDecoration: "none", fontSize: 14 }}>
                    查看生成视频 ↗
                  </a>
                )}
              </div>
              <div style={{ overflowX: "auto", background: "#fff", borderRadius: 8, border: "1px solid #e5e5ea" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: "#fafafa", borderBottom: "1px solid #e5e5ea" }}>
                      <th style={{ padding: "10px 16px", color: "#86868b", fontWeight: 500 }}>#</th>
                      <th style={{ padding: "10px 16px", color: "#86868b", fontWeight: 500 }}>车牌号</th>
                      <th style={{ padding: "10px 16px", color: "#86868b", fontWeight: 500 }}>置信度</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(pipelineResp.stats || []).filter(s => s.license_number && s.license_number !== "0").slice(0, 5).map((s, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #e5e5ea" }}>
                        <td style={{ padding: "10px 16px", color: "#86868b" }}>{i + 1}</td>
                        <td style={{ padding: "10px 16px", fontWeight: 600, color: "#1d1d1f" }}>{s.license_number}</td>
                        <td style={{ padding: "10px 16px", color: "#86868b" }}>
                          {Number(s.max_text_score ?? s.license_number_score ?? 0).toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 第三部分：停车场模拟调度 */}
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #e5e5ea" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#86868b", fontWeight: 500 }}>停车场模拟调度</h3>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="apple-btn apple-btn-secondary" onClick={() => doAction(parkingEntry, "入场")}>
              🚗 触发入场
            </button>
            <button className="apple-btn apple-btn-secondary" onClick={() => doAction(parkingExit, "出场")}>
              🚙 触发出场
            </button>
          </div>
          {pipeMsg && <div style={{ marginTop: 12, color: "#86868b", fontSize: 13 }}>{pipeMsg}</div>}
        </div>

      </div>
    </div>
  );
}