// src/pages/Admin.jsx
import { useEffect, useState } from "react";
import {
  adminGetWhitelist, adminAddWhitelist, adminRemoveWhitelist,
  adminGetParked, adminManualExit, adminManualEntry
} from "../lib/api";

export default function Admin() {
  const [wl, setWl] = useState([]);
  const [plate, setPlate] = useState("");
  const [expireDays, setExpireDays] = useState("30"); 
  const [loadingWL, setLoadingWL] = useState(false);
  const [errWL, setErrWL] = useState("");

  const [parked, setParked] = useState([]);
  const [loadingP, setLoadingP] = useState(false);
  const [errP, setErrP] = useState("");

  const [manualPlate, setManualPlate] = useState("");
  
  const handleManualEntry = async () => {
    const p = (manualPlate || "").trim().toUpperCase();
    if (!p) return;
    try {
      await adminManualEntry(p);
      setManualPlate(""); // 清空输入框
      alert(`车牌 ${p} 人工入库成功！`);
      refreshParked();    // 刷新列表
    } catch (e) {
      alert(e.message || "入库失败");
    }
  };

  useEffect(() => { refreshWL(); refreshParked(); }, []);

  async function refreshWL() {
    setLoadingWL(true); setErrWL("");
    try { setWl(await adminGetWhitelist()); }
    catch(e){ setErrWL(e.message || "加载失败"); }
    finally { setLoadingWL(false); }
  }
  
  async function refreshParked() {
    setLoadingP(true); setErrP("");
    try { setParked(await adminGetParked()); }
    catch(e){ setErrP(e.message || "加载失败"); }
    finally { setLoadingP(false); }
  }

  const handleManualExit = async (sessionId, plate) => {
    if (!window.confirm(`确定将车牌 ${plate} 人工结算并准备离场吗？`)) return;
    try {
      await adminManualExit(sessionId);
      alert("操作成功，车辆已移至结算区！");
      refreshParked();
    } catch (e) {
      alert(e.message || "操作失败");
    }
  };

  const addWL = async () => {
    const p = (plate || "").trim().toUpperCase();
    if (!p) return;
    try { 
      await adminAddWhitelist(p, parseInt(expireDays, 10)); 
      setPlate(""); 
      setExpireDays("30"); // 添加成功后重置为 30 天
      await refreshWL(); 
    }
    catch(e){ alert(e.message || "添加失败"); }
  };
  
  const delWL = async (p) => {
    if (!window.confirm(`确定把 ${p} 移出白名单？`)) return;
    try { await adminRemoveWhitelist(p); await refreshWL(); }
    catch(e){ alert(e.message || "删除失败"); }
  };

  const fmt = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString('zh-CN', {hour12: false})}`;
  };
  const fmtMoney = (v) => `${Number(v || 0).toFixed(2)} ₽`;

  // 👉 新增：将分钟转换为“X 小时 Y 分钟”的前端格式化小工具
  const fmtDuration = (totalMins) => {
    if (totalMins == null) return "-";
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    
    if (h > 0) {
      return (
        <>
          {h} <span style={{fontSize: 12, color: "#86868b", marginRight: 4}}>小时</span>
          {m} <span style={{fontSize: 12, color: "#86868b"}}>分钟</span>
        </>
      );
    }
    return (
      <>
        {m} <span style={{fontSize: 12, color: "#86868b"}}>分钟</span>
      </>
    );
  };

  // 苹果风 Badge 标签组件
  const Badge = ({ text, type = "default" }) => {
    const colors = {
      success: { bg: "#e5f6e8", color: "#248a3d" }, // 绿
      warning: { bg: "#fff8e6", color: "#d97706" }, // 橙
      default: { bg: "#f5f5f7", color: "#86868b" }, // 灰
      blue:    { bg: "#e6f0ff", color: "#0071e3" }, // 蓝
    };
    const style = colors[type] || colors.default;
    return (
      <span style={{
        background: style.bg, color: style.color, 
        padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 500
      }}>
        {text}
      </span>
    );
  };

  return (
    <div className="apple-page">
      <h1 className="apple-title">管理员控制台</h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 32, alignItems: "flex-start" }}>
        
        {/* 左侧：白名单管理 */}
        <div className="apple-card" style={{ flex: "1 1 320px", maxWidth: 400 }}>

          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexDirection: "column" }}>
            <div style={{ display: "flex", gap: 12 }}>
                <input
                  className="apple-input"
                  value={plate}
                  onChange={(e)=>setPlate(e.target.value)}
                  placeholder="输入车牌号"
                  style={{ flex: 1 }}
                  onKeyDown={(e) => e.key === "Enter" && addWL()}
                />
                {/* 👉 新增：选择有效期的下拉框 */}
                <select 
                  className="apple-input" 
                  style={{ width: "100px", padding: "8px" }}
                  value={expireDays}
                  onChange={(e) => setExpireDays(e.target.value)}
                >
                  <option value="30">30天</option>
                  <option value="90">90天</option>
                  <option value="365">1年</option>
                  <option value="9999">永久</option>
                </select>
                <button className="apple-btn" onClick={addWL} disabled={!plate}>➕ 添加</button>
            </div>
          </div>

          {errWL && <p style={{ color: "#ff3b30", fontSize: 14, marginBottom: 16 }}>错误：{errWL}</p>}

          <div style={{ border: "1px solid #e5e5ea", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
              <thead style={{ background: "#f5f5f7", borderBottom: "1px solid #e5e5ea" }}>
                <tr>
                  <th style={{ padding: "12px 16px", color: "#86868b", fontWeight: 500 }}>车牌号</th>
                  {/* 👉 新增表头 */}
                  <th style={{ padding: "12px 16px", color: "#86868b", fontWeight: 500 }}>到期时间</th>
                  <th style={{ padding: "12px 16px", color: "#86868b", fontWeight: 500, width: 80, textAlign: "right" }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {wl.map((row, i) => (
                  <tr key={row.id || row.plate} style={{ borderBottom: i === wl.length - 1 ? "none" : "1px solid #e5e5ea" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1d1d1f", fontFamily: "monospace", fontSize: 15 }}>
                      {row.plate}
                    </td>
                    {/* 👉 新增单元格：显示后端返回的到期时间 */}
                    <td style={{ padding: "12px 16px", color: "#86868b", fontSize: 13 }}>
                      {row.vipExpireTime ? fmt(row.vipExpireTime) : "永久"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button 
                        className="apple-btn apple-btn-danger" 
                        style={{ padding: "4px 10px", fontSize: 12 }}
                        onClick={()=>delWL(row.plate)}
                      >
                        移出
                      </button>
                    </td>
                  </tr>
                ))}
                {/* ... 无数据提示的 colspan 需要改成 3 ... */}
                {wl.length === 0 && (
                  <tr><td colSpan={3} style={{ padding: "24px", textAlign: "center", color: "#86868b" }}>暂无白名单车辆</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 右侧：当前在场车辆 */}
        <div className="apple-card" style={{ flex: "2 1 600px", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: "#1d1d1f" }}>在场车辆调度</h3>
              <p style={{ margin: 0, color: "#86868b", fontSize: 14 }}>分为在库与已结算。</p>
            </div>
            <button className="apple-btn apple-btn-secondary" style={{ padding: "6px 12px" }} onClick={refreshParked} disabled={loadingP}>
              {loadingP ? "刷新中" : "🔄 刷新"}
            </button>
          </div>

          {errP && <p style={{ color: "#ff3b30", fontSize: 14, marginBottom: 16 }}>错误：{errP}</p>}

          {(() => {
            const openList = parked.filter(row => row.status === "OPEN");
            const rtcList  = parked.filter(row => row.status === "READY_TO_CLOSE");

            const renderTableBlock= ({ title, data, showAction, colorType }) => (
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ margin: "0 0 12px", fontSize: 15, color: "#1d1d1f", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: colorType === "blue" ? "#0071e3" : "#34c759" }} />
                  {title} 
                  <span style={{ color: "#86868b", fontWeight: 400 }}>({data.length} 辆)</span>

                  {/* 👉 追加：只有在库中时，才在最右侧显示人工入库按钮（marginLeft: "auto" 将其推到最右边） */}
                  {/* {title === "在库中 (OPEN)" && (
                    <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                      <input
                        className="apple-input"
                        value={manualPlate}
                        onChange={(e) => setManualPlate(e.target.value)}
                        placeholder="输入车牌号..."
                        style={{ padding: "4px 8px", fontSize: 13, width: 120, minHeight: 0 }}
                        onKeyDown={(e) => e.key === "Enter" && handleManualEntry()}
                      />
                      <button 
                        className="apple-btn apple-btn-primary" 
                        style={{ padding: "4px 10px", fontSize: 13 }}
                        onClick={handleManualEntry}
                        disabled={!manualPlate}
                      >
                        ➕ 人工入库
                      </button>
                    </div>
                  )} */}
                </h4>
                
                <div style={{ border: "1px solid #e5e5ea", borderRadius: 12, overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14, minWidth: 500 }}>
                    <thead style={{ background: "#f5f5f7", borderBottom: "1px solid #e5e5ea" }}>
                      <tr>
                        <th style={{ padding: "12px 16px", color: "#86868b", fontWeight: 500 }}>车牌</th>
                        <th style={{ padding: "12px 16px", color: "#86868b", fontWeight: 500 }}>入场时间</th>
                        <th style={{ padding: "12px 16px", color: "#86868b", fontWeight: 500 }}>停留时长</th>
                        <th style={{ padding: "12px 16px", color: "#86868b", fontWeight: 500 }}>费用</th>
                        <th style={{ padding: "12px 16px", color: "#86868b", fontWeight: 500 }}>类型</th>
                        {/* {showAction && <th style={{ padding: "12px 16px", color: "#86868b", fontWeight: 500, textAlign: "right" }}>操作</th>} */}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, i) => (
                        <tr key={row.sessionId} style={{ borderBottom: i === data.length - 1 ? "none" : "1px solid #e5e5ea" }}>
                          <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1d1d1f", fontFamily: "monospace", fontSize: 15 }}>
                            {row.plate}
                          </td>
                          <td style={{ padding: "12px 16px", color: "#86868b", fontSize: 13 }}>{fmt(row.entryTime)}</td>
                          
                          {/* 👉 这里调用了新写的 fmtDuration 来展示时长 */}
                          <td style={{ padding: "12px 16px", color: "#1d1d1f" }}>
                            {fmtDuration(row.minutes)}
                          </td>

                          <td style={{ padding: "12px 16px", color: row.estimatedFee > 0 ? "#ff3b30" : "#1d1d1f", fontWeight: row.estimatedFee > 0 ? 600 : 400 }}>
                            {fmtMoney(row.estimatedFee)}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {row.whitelist ? <Badge text="白名单" type="success" /> : <Badge text="外来车辆" type="default" />}
                          </td>
                          {/* {showAction && (
                            <td style={{ padding: "12px 16px", textAlign: "right" }}>
                              <button 
                                className="apple-btn" 
                                style={{ padding: "6px 12px", fontSize: 12 }}
                                onClick={() => handleManualExit(row.sessionId, row.plate)}
                              >
                                人工出库
                              </button>
                            </td>
                          )} */}
                        </tr>
                      ))}
                      {data.length === 0 && (
                        <tr><td colSpan={showAction ? 6 : 5} style={{ padding: "24px", textAlign: "center", color: "#86868b" }}>暂无车辆记录</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );

            return (
              <>
                {renderTableBlock({ title: "在库中 (OPEN)", data: openList, showAction: true, colorType: "blue" })}
                {renderTableBlock({ title: "已结算待离场 (READY_TO_CLOSE)", data: rtcList, showAction: false, colorType: "green" })}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}