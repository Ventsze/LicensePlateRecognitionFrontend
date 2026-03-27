// src/pages/Capture.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toAbsUrl, parseRunFromUrl } from "../lib/api";

function pickSupportedMime() {
  const CANDIDATES = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  const ok = (t) => {
    const f = window.MediaRecorder?.isTypeSupported;
    return typeof f === "function" ? f(t) : false;
  };
  return CANDIDATES.find(ok) || "";
}

function uploadWithProgress(blob, onProgress) {
  return new Promise((resolve, reject) => {
    const ext = /mp4/i.test(blob.type) ? "mp4" : "webm";
    const file = new File([blob], `capture_${Date.now()}.${ext}`, { type: blob.type || `video/${ext}` });

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

    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });
}

function smartParseRun(url) {
  const m = String(url).match(/\/files\/(.+)\.(mp4|webm|mov|m4v)$/i);
  return m ? m[1] : parseRunFromUrl(url) || "";
}

export default function Capture() {
  const nav = useNavigate();
  const liveRef = useRef(null);
  const playRef = useRef(null);
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [blobUrl, setBlobUrl] = useState("");
  const [blobObj, setBlobObj] = useState(null);
  const [err, setErr] = useState("");
  const [recording, setRecording] = useState(false);
  const [sec, setSec] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [duration, setDuration] = useState(5);
  const [facing, setFacing] = useState("environment");
  const [uploading, setUploading] = useState(false);
  const [pct, setPct] = useState(0);

  const SUPPORTS =
    typeof navigator !== "undefined" &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function" &&
    typeof window !== "undefined" &&
    "MediaRecorder" in window;

  const progress = useMemo(() => {
    if (!recording || duration <= 0) return 0;
    return Math.max(0, Math.min(1, sec / duration));
  }, [recording, sec, duration]);

  useEffect(() => {
    let disposed = false;
    async function open() {
      try {
        setErr("");
        if (stream) stream.getTracks().forEach(t => t.stop());
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: true,
        });
        if (disposed) { s.getTracks().forEach(t => t.stop()); return; }
        setStream(s);
        if (liveRef.current) {
          liveRef.current.srcObject = s;
          await liveRef.current.play().catch(()=>{});
        }
      } catch (e) {
        setErr("无法访问摄像头/麦克风：" + (e.message || e));
      }
    }
    if (SUPPORTS) open();
    return () => {
      disposed = true;
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  const startRecordingInner = () => {
    const mimeType = pickSupportedMime();
    chunksRef.current = [];
    setSec(0);

    const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    mr.ondataavailable = (e) => e.data?.size && chunksRef.current.push(e.data);
    mr.onstop = () => {
      const type = mimeType || "video/webm";
      const blob = new Blob(chunksRef.current, { type });
      setBlobObj(blob);
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      setTimeout(() => playRef.current?.load(), 0);
      setRecording(false);
      clearInterval(timerRef.current);
    };
    recRef.current = mr;
    mr.start();
    setRecording(true);

    timerRef.current = setInterval(() => setSec((s) => s + 1), 1000);
    setTimeout(() => stop(), duration * 1000);
  };

  const start = () => {
    if (!SUPPORTS) return setErr("环境不支持摄像头");
    if (!stream)  return setErr("摄像头尚未就绪");
    if (recording) { stop(); return; } // 支持点击快门中途停止
    
    setErr(""); setBlobUrl(""); setBlobObj(null);
    let c = 3; setCountdown(c);
    const id = setInterval(() => {
      c -= 1; setCountdown(c);
      if (c <= 0) { clearInterval(id); startRecordingInner(); }
    }, 1000);
  };

  const stop = () => {
    try { if (recRef.current && recRef.current.state === "recording") recRef.current.stop(); } catch {}
  };

  const retake = () => { setBlobUrl(""); setBlobObj(null); setSec(0); setErr(""); };

  const upload = async () => {
    try {
      if (!blobObj) return setErr("没有可上传的视频");
      setUploading(true); setPct(0); setErr("");
      const data = await uploadWithProgress(blobObj, setPct);
      const url = data.download_url || "";
      const run = smartParseRun(url);
      const absUrl = toAbsUrl(url);
      nav("/result", { state: { videoUrl: absUrl, run, stats: Array.isArray(data.stats) ? data.stats : undefined } });
    } catch (e) {
      setErr(e.message || "上传失败");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="apple-page">
      <h1 className="apple-title">实时监控抓拍</h1>

      {!SUPPORTS && (
        <div style={{ padding: 16, background: "#fff3cd", color: "#856404", borderRadius: 12, marginBottom: 24 }}>
          ⚠️ 当前环境不支持摄像头录制，请使用 <b>HTTPS</b> 打开或使用移动端 App。
        </div>
      )}

      {/* 相机卡片主容器 */}
      <div className="apple-card" style={{ maxWidth: 700, padding: 0, overflow: "hidden", border: "1px solid #e5e5ea" }}>
        
        {/* 顶部工具栏 (类似 iOS 相机顶部) */}
        <div style={{ 
          display: "flex", justifyContent: "space-between", alignItems: "center", 
          padding: "16px 24px", background: "#f5f5f7", borderBottom: "1px solid #e5e5ea" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#1d1d1f" }}>⏱️ 录制时长</span>
            <select 
              className="apple-input" 
              style={{ padding: "6px 12px", borderRadius: 8, border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
              value={duration} 
              onChange={(e) => setDuration(Number(e.target.value))}
              disabled={recording || !!blobUrl}
            >
              <option value={5}>5 秒</option>
              <option value={10}>10 秒</option>
              <option value={15}>15 秒</option>
            </select>
          </div>
          
          <button 
            className="apple-btn apple-btn-secondary" 
            style={{ borderRadius: 20, padding: "8px 16px" }}
            onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
            disabled={recording || !!blobUrl}
          >
            🔄 翻转镜头
          </button>
        </div>

        {/* 视频预览区 */}
        {!blobUrl && (
          <div>
            <div style={{ position: "relative", background: "#000", aspectRatio: "4/3", display: "flex", alignItems: "center" }}>
              <video 
                ref={liveRef} 
                playsInline 
                muted 
                style={{ width: "100%", maxHeight: "100%", objectFit: "cover", display: "block" }} 
              />
              
              {/* 倒计时遮罩 */}
              {!!countdown && (
                <div style={{ 
                  position: "absolute", inset: 0, display: "flex", alignItems: "center", 
                  justifyContent: "center", background: "rgba(0,0,0,0.3)", color: "#fff", 
                  fontSize: 100, fontWeight: 700 
                }}>
                  {countdown}
                </div>
              )}
              
              {/* 录制时的红点提示 */}
              {recording && (
                <div style={{ position: "absolute", top: 16, right: 16, display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.5)", padding: "4px 10px", borderRadius: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: "#ff3b30", animation: "pulse 1.5s infinite" }} />
                  <span style={{ color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>00:{String(sec).padStart(2, '0')}</span>
                </div>
              )}
            </div>

            {/* 录制进度条（隐藏在视频底部边缘） */}
            {recording && (
              <div style={{ height: 4, background: "#e5e5ea", width: "100%" }}>
                <div style={{ height: "100%", width: `${Math.round(progress * 100)}%`, background: "#ff3b30", transition: "width 1s linear" }} />
              </div>
            )}
            
            {/* 底部快门控制区 */}
            <div style={{ padding: "32px 24px", background: "#ffffff", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              {/* iOS 同款快门按钮 */}
              <button 
                onClick={start} 
                disabled={(countdown > 0 && !recording) || !SUPPORTS || !stream}
                style={{
                  width: 72, height: 72, borderRadius: 36,
                  background: "transparent",
                  border: "4px solid #d2d2d7",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: (!SUPPORTS || !stream) ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  padding: 0
                }}
              >
                {/* 内部的实体按钮 (未录制是红圆，录制中是红方块) */}
                <div style={{
                  width: recording ? 28 : 56,
                  height: recording ? 28 : 56,
                  borderRadius: recording ? 6 : 28,
                  background: "#ff3b30",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                }} />
              </button>
              <span style={{ fontSize: 13, color: "#86868b", fontWeight: 500 }}>
                {recording ? "点击停止" : "点击抓拍"}
              </span>
            </div>
          </div>
        )}

        {/* 视频回放与上传区 */}
        {blobUrl && (
          <div>
            <div style={{ background: "#000", aspectRatio: "4/3", display: "flex", alignItems: "center" }}>
              <video 
                ref={playRef} 
                controls 
                src={blobUrl} 
                style={{ width: "100%", maxHeight: "100%", display: "block" }} 
              />
            </div>
            
            {uploading && (
              <div style={{ height: 4, background: "#e5e5ea", width: "100%" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "#0071e3", transition: "width 0.2s ease" }} />
              </div>
            )}

            <div style={{ padding: "32px 24px", background: "#ffffff", display: "flex", justifyContent: "center", gap: 16 }}>
              <button 
                className="apple-btn" 
                style={{ padding: "12px 32px", borderRadius: 24, fontSize: 16 }} 
                onClick={upload} 
                disabled={uploading}
              >
                {uploading ? `上传中 (${pct}%)` : "⬆️ 确认上传"}
              </button>
              <button 
                className="apple-btn apple-btn-secondary" 
                style={{ padding: "12px 32px", borderRadius: 24, fontSize: 16 }} 
                onClick={retake} 
                disabled={uploading}
              >
                🗑 重拍
              </button>
            </div>
          </div>
        )}

        {err && (
          <div style={{ padding: "0 24px 24px" }}>
            <p style={{ margin: 0, color: "#ff3b30", textAlign: "center", fontSize: 14, fontWeight: 500 }}>{err}</p>
          </div>
        )}
      </div>

      {/* 脉冲动画样式（用于录制时的红点闪烁） */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}