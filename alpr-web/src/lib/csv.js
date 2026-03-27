// src/lib/csv.js

function downloadBlob(content, filename, mime = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// 导出 “历史记录” CSV：items 形如 [{ run, downloadUrl, createdAt }]
export function exportHistoryCSV(items, filename = "alpr_history.csv") {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["run", "download_url", "created_at"];
  const lines = [header.join(",")];

  for (const it of (items || [])) {
    const created = it.createdAt ? new Date(it.createdAt).toLocaleString() : "";
    lines.push([esc(it.run), esc(it.downloadUrl), esc(created)].join(","));
  }

  // 带上 UTF-8 BOM，Excel 打开不乱码
  const csv = "\uFEFF" + lines.join("\n");
  downloadBlob(csv, filename);
}

// （可选）如果你在结果页也想导出统计：rows 形如 [{ plate, max_text_score, samples }]
export function exportStatsCSV(rows, filename = "alpr_stats.csv") {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["plate", "max_text_score", "samples"];
  const lines = [header.join(",")];

  for (const r of (rows || [])) {
    const plate = r.plate ?? r.license_number ?? "";
    const score = r.max_text_score ?? r.max_score ?? "";
    const samples = r.samples ?? r.count ?? "";
    lines.push([esc(plate), esc(score), esc(samples)].join(","));
  }

  const csv = "\uFEFF" + lines.join("\n");
  downloadBlob(csv, filename);
}
