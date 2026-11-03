// 自作教材の数学用Canvas描画。ログインや保存処理、元アプリのグローバルCSSには依存しない。
export function drawMathAnimation(canvas, animation, values) {
 const ctx = canvas.getContext('2d');
 if (!ctx) return;
 ctx.clearRect(0, 0, canvas.width, canvas.height);
 const renderers = { numberLine: drawNumberLine, areaModel: drawAreaModel, balance: drawBalance, graph: drawGraph, shape: drawShape, barData: drawBarData, ratio: drawRatio, integerGrid: drawIntegerGrid };
 (renderers[animation.type] || drawGeneric)(ctx, canvas, animation.params || {}, values);
}

function drawGeneric(ctx, canvas, p) {
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(p.label || '図解準備中', canvas.width / 2, canvas.height / 2);
}

function drawNumberLine(ctx, canvas, p, v) {
  const min = p.min ?? -10, max = p.max ?? 10;
  const left = 25, right = canvas.width - 25, y = 110;
  const scale = (right - left) / (max - min);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke();

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  for (let i = min; i <= max; i++) {
    const x = left + (i - min) * scale;
    ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5); ctx.strokeStyle = '#475569'; ctx.stroke();
    if (i % Math.max(1, Math.round((max - min) / 10)) === 0) ctx.fillText(String(i), x, y + 18);
  }

  const val = v.p ?? 0;
  const x = left + (val - min) * scale;
  ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#f59e0b'; ctx.fill();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();

  ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`${p.pointLabel || '点'} = ${val}`, x, y - 16);
}

function drawAreaModel(ctx, canvas, p, v) {
  const a = v.a ?? 70, b = v.b ?? 40;
  const startX = 55, startY = 20;
  const mode = p.mode || 'sum';

  if (mode === 'diff') {
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(startX, startY, a, a);
    ctx.fillStyle = '#0b1329';
    ctx.fillRect(startX + a - b, startY, b, b);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, a, a);
    ctx.strokeRect(startX + a - b, startY, b, b);
    ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('a² − b²', startX + a / 2, startY + a + 22);
    ctx.fillText('a', startX + a / 2, startY - 6);
    ctx.fillText('b', startX + a - b / 2, startY + b + 12);
  } else {
    ctx.fillStyle = '#0284c7'; ctx.fillRect(startX, startY, a, a);
    ctx.fillStyle = '#f59e0b'; ctx.fillRect(startX + a, startY, b, a);
    ctx.fillRect(startX, startY + a, a, b);
    ctx.fillStyle = '#10b981'; ctx.fillRect(startX + a, startY + a, b, b);

    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, a + b, a + b);
    ctx.beginPath();
    ctx.moveTo(startX + a, startY); ctx.lineTo(startX + a, startY + a + b);
    ctx.moveTo(startX, startY + a); ctx.lineTo(startX + a + b, startY + a);
    ctx.stroke();

    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('a²', startX + a / 2, startY + a / 2 + 4);
    ctx.fillText('ab', startX + a + b / 2, startY + a / 2 + 4);
    ctx.fillText('ab', startX + a / 2, startY + a + b / 2 + 4);
    ctx.fillText('b²', startX + a + b / 2, startY + a + b / 2 + 4);
  }
}

function drawBalance(ctx, canvas, p, v) {
  const tilt = (v.tilt ?? 0) * 18;
  const cx = canvas.width / 2, cy = 70;
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + 90); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy + 90); ctx.lineTo(cx - 30, cy + 110); ctx.lineTo(cx + 30, cy + 110); ctx.closePath();
  ctx.fillStyle = '#475569'; ctx.fill();

  const armLen = 120;
  const rad = (tilt * Math.PI) / 180;
  const lx = cx - armLen * Math.cos(rad), ly = cy - armLen * Math.sin(rad);
  const rx = cx + armLen * Math.cos(rad), ry = cy + armLen * Math.sin(rad);

  ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(rx, ry); ctx.stroke();

  [[lx, ly, p.leftExpr || '左辺', '#0284c7'], [rx, ry, p.rightExpr || '右辺', '#f59e0b']].forEach(([px, py, label, color]) => {
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 22, py + 28); ctx.lineTo(px + 22, py + 28); ctx.closePath();
    ctx.fillStyle = color; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(label, px, py + 20);
  });

  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fillStyle = '#f8fafc'; ctx.fill();
  ctx.fillStyle = '#cbd5e1'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('左右がつり合う = 等式が成り立つ', cx, 195);
}

function drawGraph(ctx, canvas, p, v) {
  const kind = p.kind || 'linear';
  const ox = canvas.width / 2, oy = canvas.height / 2;
  const scale = p.scale || 16;

  ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(10, oy); ctx.lineTo(canvas.width - 10, oy);
  ctx.moveTo(ox, 10); ctx.lineTo(ox, canvas.height - 10); ctx.stroke();
  ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif';
  ctx.fillText('x', canvas.width - 18, oy - 6); ctx.fillText('y', ox + 6, 16);

  ctx.beginPath(); ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3;
  const a = v.a ?? 1, b = v.b ?? 0;
  let started = false;
  for (let px = 10; px <= canvas.width - 10; px++) {
    const x = (px - ox) / scale;
    let y;
    if (kind === 'linear') y = a * x + b;
    else if (kind === 'quadratic') y = a * x * x;
    else y = a !== 0 ? a / x : 0;
    const py = oy - y * scale;
    if (kind === 'inverse' && Math.abs(x) < 0.3) { started = false; continue; }
    if (py < -50 || py > canvas.height + 50) { started = false; continue; }
    if (!started) { ctx.moveTo(px, py); started = true; } else { ctx.lineTo(px, py); }
  }
  ctx.stroke();

  ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
  const formula = kind === 'linear' ? `y = ${a}x ${b >= 0 ? '+' : ''}${b}` : kind === 'quadratic' ? `y = ${a}x²` : `y = ${a}/x`;
  ctx.fillText(formula, 14, canvas.height - 10);
}

function drawShape(ctx, canvas, p, v) {
  const kind = p.kind || 'triangle';
  const cx = canvas.width / 2, cy = canvas.height / 2 + 10;
  const s = v.s ?? 60;

  ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3; ctx.fillStyle = 'rgba(56,189,248,0.25)';

  if (kind === 'triangle') {
    ctx.beginPath(); ctx.moveTo(cx, cy - s); ctx.lineTo(cx - s, cy + s * 0.6); ctx.lineTo(cx + s, cy + s * 0.6); ctx.closePath();
    ctx.fill(); ctx.stroke();
  } else if (kind === 'parallelogram') {
    ctx.beginPath(); ctx.moveTo(cx - s, cy + s * 0.5); ctx.lineTo(cx - s * 0.4, cy - s * 0.5);
    ctx.lineTo(cx + s, cy - s * 0.5); ctx.lineTo(cx + s * 0.4, cy + s * 0.5); ctx.closePath();
    ctx.fill(); ctx.stroke();
  } else if (kind === 'circle') {
    ctx.beginPath(); ctx.arc(cx, cy, s, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + s, cy); ctx.strokeStyle = '#f59e0b'; ctx.stroke();
  } else if (kind === 'rightTriangle') {
    ctx.beginPath(); ctx.moveTo(cx - s, cy + s * 0.6); ctx.lineTo(cx - s, cy - s * 0.6); ctx.lineTo(cx + s, cy + s * 0.6); ctx.closePath();
    ctx.fill(); ctx.stroke();
  } else {
    const sides = v.sides ?? p.sides ?? 5;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const ang = (i / sides) * 2 * Math.PI - Math.PI / 2;
      const px = cx + s * Math.cos(ang), py = cy + s * Math.sin(ang);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(p.caption || '', cx, canvas.height - 10);
}

function drawBarData(ctx, canvas, p, v) {
  const bars = (p.bars || []).map((bar, i) => (i === (p.bars.length - 1) && v.adj !== undefined ? { ...bar, value: v.adj } : bar));
  const baseY = canvas.height - 25, maxH = 150;
  const maxVal = Math.max(...bars.map((b) => b.value), 1);
  const bw = Math.min(50, (canvas.width - 40) / bars.length - 10);
  let x = 30;

  bars.forEach((bar) => {
    const h = (bar.value / maxVal) * maxH;
    ctx.fillStyle = bar.color || '#38bdf8';
    ctx.fillRect(x, baseY - h, bw, h);
    ctx.fillStyle = '#e2e8f0'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(bar.label, x + bw / 2, baseY + 14);
    ctx.fillText(String(bar.value), x + bw / 2, baseY - h - 6);
    x += bw + 12;
  });
  ctx.strokeStyle = '#475569'; ctx.beginPath(); ctx.moveTo(20, baseY); ctx.lineTo(canvas.width - 10, baseY); ctx.stroke();
}

function drawRatio(ctx, canvas, p, v) {
  const scaleF = v.scale ?? 1;
  const baseA = p.baseA ?? 40;
  const y1 = 70, y2 = 140;
  const unit = 2.2;

  ctx.fillStyle = '#38bdf8'; ctx.fillRect(40, y1, baseA * unit, 22);
  ctx.fillStyle = '#f59e0b'; ctx.fillRect(40, y2, baseA * scaleF * unit, 22);

  ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(`${p.labelA || '元の図'}: ${baseA}`, 40, y1 - 8);
  ctx.fillText(`${p.labelB || '拡大・縮小後'}: ${Math.round(baseA * scaleF)} (× ${scaleF.toFixed(1)})`, 40, y2 - 8);
}

function drawIntegerGrid(ctx, canvas, p, v) {
  const max = p.rangeMax || 40;
  const n = v.n ?? 2;
  const cols = 10, cellW = (canvas.width - 20) / cols, cellH = 26;

  for (let i = 1; i <= max; i++) {
    const row = Math.floor((i - 1) / cols), col = (i - 1) % cols;
    const x = 10 + col * cellW, y = 10 + row * cellH;
    const hit = p.rule === 'factor' ? (n % i === 0) : (i % n === 0);
    ctx.fillStyle = hit ? '#0ea5e9' : '#1e293b';
    ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);
    ctx.fillStyle = hit ? '#0b1329' : '#94a3b8';
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(String(i), x + cellW / 2, y + cellH / 2 + 4);
  }
}
