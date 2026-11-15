'use strict';
const CANVAS_FONT = "'Pretendard Variable', Pretendard, 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";

/* ===================== 달의정원 마크 ===================== */
// 실 감은 초승달과 바늘 두 개. SVG, 캔버스, PDF 그리기 모두 같은 함수로 그림
const BRAND = { night: '#1F2335', moon: '#F7F2E6', gold: '#B8862F', knob: '#D9822B', lav: '#5E57A6', mus: '#C98F1E', teal: '#2C9A86' };
function moonMark(D, cx, cy, R, opt = {}) {
  const gold = opt.color || BRAND.gold, small = opt.small ?? R < 30, sw = opt.sw || (small ? Math.max(1.3, R * 0.09) : R * 0.045);
  if (opt.disc) D.circle(cx, cy, R, opt.disc, opt.ring || null, opt.ring ? sw * 0.8 : 0);
  if (opt.zoom) { R *= opt.zoom; cx += R * 0.04; }
  const a = { x: cx - 0.06 * R, y: cy + 0.04 * R, r: 0.6 * R }, b = { x: a.x + 0.34 * R, y: a.y - 0.3 * R, r: 0.5 * R };
  const inA = (x, y) => (x - a.x) ** 2 + (y - a.y) ** 2 <= a.r * a.r, outB = (x, y) => (x - b.x) ** 2 + (y - b.y) ** 2 >= b.r * b.r;
  const inside = (x, y) => inA(x, y) && outB(x, y);
  // 두 원의 교점
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), l = (a.r * a.r - b.r * b.r + d * d) / (2 * d), h = Math.sqrt(a.r * a.r - l * l);
  const mx = a.x + dx * l / d, my = a.y + dy * l / d;
  const p1 = [mx + h * dy / d, my - h * dx / d], p2 = [mx - h * dy / d, my + h * dx / d];
  const ang = (c, p) => Math.atan2(p[1] - c.y, p[0] - c.x);
  const arc = (c, t0, t1, n) => Array.from({ length: n + 1 }, (_, i) => { const t = t0 + (t1 - t0) * i / n; return [c.x + c.r * Math.cos(t), c.y + c.r * Math.sin(t)]; });
  let a0 = ang(a, p1), a1 = ang(a, p2); if (a1 <= a0) a1 += 2 * Math.PI;
  let outer = arc(a, a0, a1, 40); if (inside(...arc(a, (a0 + a1) / 2, (a0 + a1) / 2, 0)[0]) === false) { a1 -= 2 * Math.PI; outer = arc(a, a0, a1, 40); }
  let b0 = ang(b, p2), b1 = ang(b, p1);
  let inner = arc(b, b0, b1, 30); const midB = arc(b, (b0 + b1) / 2, (b0 + b1) / 2, 0)[0]; if (!inA(...midB)) { b1 += (b1 > b0 ? -2 : 2) * Math.PI; inner = arc(b, b0, b1, 30); }
  if (opt.fill) D.poly(outer.concat(inner), opt.fill, null, 0);
  // 실 줄무늬: 오른쪽 아래를 중심으로 한 동심원 조각 + 위쪽 사선 줄
  const strokeIn = pts => { let seg = []; pts.forEach(q => { if (inside(q[0], q[1])) seg.push(q); else { if (seg.length > 1) D.poly(seg, null, gold, sw * 0.8, false); seg = []; } }); if (seg.length > 1) D.poly(seg, null, gold, sw * 0.8, false); };
  const o = { x: a.x + 0.42 * R, y: a.y + 0.62 * R };
  for (let k = 1; k <= (small ? 3 : 5); k++) { const rr = (small ? 0.28 : 0.18) * R * k; strokeIn(Array.from({ length: 61 }, (_, i) => { const t = Math.PI + (Math.PI / 2) * i / 60; return [o.x + rr * Math.cos(t), o.y + rr * Math.sin(t)]; })); }
  const q = { x: a.x + 0.9 * R, y: a.y - 0.9 * R };
  for (let k = 0; k < (small ? 2 : 4); k++) { const rr = 0.95 * R + (small ? 0.24 : 0.15) * R * k; strokeIn(Array.from({ length: 61 }, (_, i) => { const t = Math.PI / 2 + (Math.PI / 2) * i / 60; return [q.x + rr * Math.cos(t), q.y + rr * Math.sin(t)]; })); }
  D.poly(outer.concat(inner), null, gold, sw, true);
  // 바늘 두 개
  if (!opt.noNeedles) {
    [[0.02, 0.6, 0.74], [0.26, 0.73, 0.6]].forEach(([oy, ey, ex], i) => {
      const k = small ? 0.8 : 1, x0 = cx - (small ? 0.64 : 0.8) * R, y0 = cy + oy * R, x1 = cx + ex * k * R, y1 = cy + ey * k * R;
      // 초승달 안쪽은 실에 가려지도록 바깥 부분만
      const n = 60, pts = Array.from({ length: n + 1 }, (_, j) => [x0 + (x1 - x0) * j / n, y0 + (y1 - y0) * j / n]);
      let seg = []; pts.forEach(pp => { if (!inside(pp[0], pp[1])) seg.push(pp); else { if (seg.length > 1) D.poly(seg, null, gold, sw * 0.8, false); seg = []; } }); if (seg.length > 1) D.poly(seg, null, gold, sw * 0.8, false);
      D.circle(x0, y0, small ? R * 0.11 : R * 0.075, opt.knob || BRAND.knob);
    });
  }
  if (D.flush) D.flush();
}
function moonSVG(size, opt = {}) { const D = new SvgDraw(size, size); moonMark(D, size / 2, size / 2, size / 2 - (opt.ring ? 1 : 0), opt); return D.toString(); }
/* ===================== 그리기 백엔드 ===================== */
const INK = '#1C1917', GRID = '#D6CFC7', GRID10 = '#78716C', PAPER = '#FFFFFF', TINT = '#F5E6C8', CENTER = '#8E86D0', RIBLINE = '#A97A28';
const HL_FILL = 'rgba(94,87,166,0.2)', DIM_FILL = 'rgba(247,242,230,0.66)';
class SvgDraw {
  constructor(w, h) { this.w = w; this.h = h; this.out = []; this.lb = new Map(); this.fb = new Map(); }
  _k(m, k) { let b = m.get(k); if (!b) { b = []; m.set(k, b); } return b; }
  line(x1, y1, x2, y2, sw, col, cap) { this._k(this.lb, sw + '|' + col + '|' + (cap || 'butt')).push(`M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`); }
  fillRect(x, y, w, h, fill) { this._k(this.fb, fill).push(`M${x.toFixed(2)} ${y.toFixed(2)}h${w.toFixed(2)}v${h.toFixed(2)}h${(-w).toFixed(2)}Z`); }
  flush() {
    this.fb.forEach((d, k) => this.out.push(`<path d="${d.join('')}" fill="${k}"/>`));
    this.lb.forEach((d, k) => { const [sw, col, cap] = k.split('|'); this.out.push(`<path d="${d.join('')}" stroke="${col}" stroke-width="${sw}" stroke-linecap="${cap}" fill="none"/>`); });
    this.fb.clear(); this.lb.clear();
  }
  rect(x, y, w, h, fill, stroke, sw) { this.flush(); this.out.push(`<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="${fill || 'none'}"${stroke ? ` stroke="${stroke}" stroke-width="${sw || 1}"` : ''}/>`); }
  circle(cx, cy, r, fill, stroke, sw) { this.flush(); this.out.push(`<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="${fill || 'none'}"${stroke ? ` stroke="${stroke}" stroke-width="${sw || 1}"` : ''}/>`); }
  poly(pts, fill, stroke, sw, close = true) { this.flush(); const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('') + (close ? 'Z' : ''); this.out.push(`<path d="${d}" fill="${fill || 'none'}"${stroke ? ` stroke="${stroke}" stroke-width="${sw || 1}" stroke-linejoin="round"` : ''}/>`); }
  text(x, y, s, size, col, align, weight) { this.flush(); const a = align === 'right' ? 'end' : align === 'center' ? 'middle' : 'start'; this.out.push(`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" fill="${col || INK}" text-anchor="${a}" dominant-baseline="middle" font-weight="${weight || 400}">${String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`); }
  toString() { this.flush(); return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.w}" height="${this.h}" viewBox="0 0 ${this.w} ${this.h}" font-family="'Pretendard Variable', Pretendard, 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif" style="font-variant-numeric:tabular-nums">${this.out.join('')}</svg>`; }
}
class CanvasDraw {
  constructor(ctx, ox = 0, oy = 0, sc = 1) { this.c = ctx; this.ox = ox; this.oy = oy; this.s = sc; }
  X(x) { return this.ox + x * this.s; } Y(y) { return this.oy + y * this.s; }
  line(x1, y1, x2, y2, sw, col, cap) { const c = this.c; c.beginPath(); c.moveTo(this.X(x1), this.Y(y1)); c.lineTo(this.X(x2), this.Y(y2)); c.lineWidth = sw * this.s; c.strokeStyle = col; c.lineCap = cap || 'butt'; c.stroke(); }
  fillRect(x, y, w, h, fill) { this.c.fillStyle = fill; this.c.fillRect(this.X(x), this.Y(y), w * this.s, h * this.s); }
  flush() { }
  rect(x, y, w, h, fill, stroke, sw) { const c = this.c; if (fill) { c.fillStyle = fill; c.fillRect(this.X(x), this.Y(y), w * this.s, h * this.s); } if (stroke) { c.lineWidth = (sw || 1) * this.s; c.strokeStyle = stroke; c.strokeRect(this.X(x), this.Y(y), w * this.s, h * this.s); } }
  circle(cx, cy, r, fill, stroke, sw) { const c = this.c; c.beginPath(); c.arc(this.X(cx), this.Y(cy), r * this.s, 0, Math.PI * 2); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.lineWidth = (sw || 1) * this.s; c.strokeStyle = stroke; c.stroke(); } }
  poly(pts, fill, stroke, sw, close = true) { const c = this.c; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(this.X(p[0]), this.Y(p[1])) : c.moveTo(this.X(p[0]), this.Y(p[1]))); if (close) c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.lineWidth = (sw || 1) * this.s; c.strokeStyle = stroke; c.lineJoin = 'round'; c.stroke(); } }
  text(x, y, s, size, col, align, weight) { const c = this.c; c.font = `${weight || 400} ${size * this.s}px ${CANVAS_FONT}`; c.fillStyle = col || INK; c.textAlign = align || 'left'; c.textBaseline = 'middle'; c.fillText(String(s), this.X(x), this.Y(y)); }
}

/* ---------- 기호 ---------- */
function drawSym(D, code, x, y, cw, ch, opt) {
  const cx = x + cw / 2, cy = y + ch / 2, m = Math.min(cw, ch), sw = Math.max(0.7, m * 0.075);
  switch (code) {
    case 'k': if (opt.showKnit) D.line(cx, y + ch * 0.22, cx, y + ch * 0.78, sw, INK); break;
    case 'p': D.line(x + cw * 0.22, cy, x + cw * 0.78, cy, sw, INK); break;
    case 'tk':
      D.line(cx - cw * 0.16, y + ch * 0.82, cx + cw * 0.14, y + ch * 0.38, sw, INK);
      D.line(cx + cw * 0.16, y + ch * 0.82, cx - cw * 0.14, y + ch * 0.38, sw, INK);
      D.circle(cx, y + ch * 0.3, m * 0.14, null, INK, sw); break;
    case 'yo': D.circle(cx, cy, m * 0.27, null, INK, sw); break;
    case 'k2tog':
      D.line(x + cw * 0.2, y + ch * 0.85, x + cw * 0.6, y + ch * 0.15, sw, INK);
      D.line(x + cw * 0.8, y + ch * 0.85, x + cw * 0.45, y + ch * 0.43, sw, INK); break;
    case 'ssk':
      D.line(x + cw * 0.8, y + ch * 0.85, x + cw * 0.4, y + ch * 0.15, sw, INK);
      D.line(x + cw * 0.2, y + ch * 0.85, x + cw * 0.55, y + ch * 0.43, sw, INK); break;
    case 'sk2p':
      D.line(x + cw * 0.18, y + ch * 0.85, cx, y + ch * 0.15, sw, INK);
      D.line(x + cw * 0.82, y + ch * 0.85, cx, y + ch * 0.15, sw, INK);
      D.line(cx, y + ch * 0.85, cx, y + ch * 0.15, sw, INK); break;
    case 'mb': D.circle(cx, cy, m * 0.3, null, INK, sw); D.circle(cx, cy, m * 0.13, INK); break;
    case 'bo': D.circle(cx, cy, m * 0.22, INK); break;
    case 'sr': D.poly([[cx, y + ch * 0.2], [x + cw * 0.8, y + ch * 0.78], [x + cw * 0.2, y + ch * 0.78]], null, INK, sw); break;
    case 'm1r': D.line(cx - cw * 0.08, y + ch * 0.85, cx - cw * 0.08, y + ch * 0.18, sw, INK); D.line(cx - cw * 0.08, y + ch * 0.55, cx + cw * 0.26, y + ch * 0.2, sw, INK); break;
    case 'm1l': D.line(cx + cw * 0.08, y + ch * 0.85, cx + cw * 0.08, y + ch * 0.18, sw, INK); D.line(cx + cw * 0.08, y + ch * 0.55, cx - cw * 0.26, y + ch * 0.2, sw, INK); break;
  }
}
function drawCross(D, tok, x, y, cw, ch, bgFill) {
  const t = parseTok(tok), w = t.w;
  D.rect(x + 0.5, y + 0.5, w * cw - 1, ch - 1, bgFill || PAPER);
  D.rect(x, y, w * cw, ch, null, GRID, 0.6);
  const m = Math.min(cw, ch), sw = Math.max(0.9, m * 0.1);
  const yb = y + ch * 0.9, yt = y + ch * 0.1;
  const cxs = i => x + (i + 0.5) * cw;
  let top = [], under = [];
  if (t.side === 'L') { for (let i = 0; i < t.a; i++) top.push([t.b + i, i]); for (let j = 0; j < t.b; j++) under.push([j, t.a + j]); }
  else { for (let i = 0; i < t.a; i++) top.push([i, t.b + i]); for (let j = 0; j < t.b; j++) under.push([t.a + j, j]); }
  under.forEach(([s, d]) => {
    D.line(cxs(s), yb, cxs(d), yt, sw, INK, 'round');
    if (t.purl) D.line(cxs(d) - cw * 0.22, y + ch * 0.28, cxs(d) + cw * 0.22, y + ch * 0.28, sw, INK);
  });
  D.flush();
  top.forEach(([s, d]) => D.line(cxs(s), yb, cxs(d), yt, sw * 3.2, bgFill || PAPER, 'butt'));
  D.flush();
  top.forEach(([s, d]) => D.line(cxs(s), yb, cxs(d), yt, sw, INK, 'round'));
  D.flush();
}

/* ---------- 차트 ---------- */
function chartGeom(pc, opt) {
  const W = pc.W, total = pc.total;
  const r0 = opt.r0 || 1, r1 = opt.r1 || total, c0 = opt.c0 || 0, c1 = opt.c1 === undefined ? W - 1 : opt.c1;
  const cw = opt.cw, ch = opt.ch;
  const fs = Math.max(6, Math.min(12, Math.min(cw, ch) * 0.62));
  const mL = fs * 2.6, mR = fs * 2.6, mB = fs * 2.4, mT = (opt.title ? fs * 2.6 : fs * 0.8);
  return { W, total, r0, r1, c0, c1, cw, ch, fs, mL, mR, mB, mT, width: mL + (c1 - c0 + 1) * cw + mR, height: mT + (r1 - r0 + 1) * ch + mB };
}
function drawChart(D, pc, opt, G) {
  G = G || chartGeom(pc, opt);
  const { W, r0, r1, c0, c1, cw, ch, fs, mL, mT } = G;
  const codes = pc.codes;
  const ex = (r, c) => r >= 1 && r <= pc.total && c >= 0 && c < W && codes[r] && codes[r][c] !== null && codes[r][c] !== undefined;
  const X = c => mL + (c - c0) * cw, Y = r => mT + (r1 - r) * ch;
  if (opt.title) D.text(mL, mT * 0.45, opt.title, fs * 1.2, INK, 'left', 700);
  // 1. 바탕 색
  const tintAt = (r, c) => {
    if (!opt.tint) return null;
    for (const p of pc.placements || []) if (p.kind === 'motif' && c >= p.x0 && c < p.x0 + p.w && r >= p.y0) return TINT;
    return null;
  };
  const centerOdd = W % 2 === 1, cc = (W - 1) / 2;
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    if (!ex(r, c)) continue;
    const t = tintAt(r, c);
    if (t && codes[r][c] !== 'bo') D.fillRect(X(c), Y(r), cw, ch, t);
    if (opt.center && centerOdd && c === cc) D.fillRect(X(c), Y(r), cw, ch, '#ECE9F7');
  }
  // 2. 가는 격자
  const gsw = Math.max(0.5, cw * 0.045);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    if (!ex(r, c)) continue;
    const x = X(c), y = Y(r);
    D.line(x, y, x, y + ch, gsw, GRID); D.line(x, y + ch, x + cw, y + ch, gsw, GRID);
    if (!ex(r, c + 1) || c === c1) D.line(x + cw, y, x + cw, y + ch, gsw, GRID);
    if (!ex(r + 1, c) || r === r1) D.line(x, y, x + cw, y, gsw, GRID);
  }
  // 3. 10코/10단 굵은 선
  const bsw = Math.max(0.8, cw * 0.08);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    if (!ex(r, c)) continue;
    const x = X(c), y = Y(r);
    if ((W - c) % 10 === 0 && ex(r, c + 1)) D.line(x + cw, y, x + cw, y + ch, bsw, GRID10);
    if (r % 10 === 0 && ex(r + 1, c)) D.line(x, y, x + cw, y, bsw, GRID10);
  }
  // 4. 중심선
  if (opt.center && !centerOdd) {
    const xc = X(W / 2);
    for (let r = r0; r <= r1; r++) if (ex(r, W / 2) || ex(r, W / 2 - 1)) D.line(xc, Y(r), xc, Y(r) + ch, Math.max(1.5, cw * 0.22), CENTER);
  }
  // 5. 기호
  const so = { showKnit: opt.showKnit };
  const crosses = [];
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    if (!ex(r, c)) continue;
    const v = codes[r][c];
    if (v === '>') continue;
    if (parseTok(v)) { crosses.push([r, c, v]); continue; }
    drawSym(D, v, X(c), Y(r), cw, ch, so);
  }
  D.flush();
  crosses.forEach(([r, c, v]) => {
    const w = parseTok(v).w;
    const cEnd = Math.min(c + w - 1, c1);
    // 범위 밖으로 잘리는 교차는 잘린 부분만 표시
    if (c < c0) return;
    drawCross(D, v, X(c), Y(r), cw, ch, tintAt(r, c) || PAPER);
    if (cEnd < c + w - 1) D.rect(X(cEnd + 1), Y(r), (c + w - 1 - cEnd) * cw, ch, '#FFFFFF');
  });
  // 5-1. 완료 단 어둡게, 현재 단 강조
  D.flush();
  const xa = X(c0), xb = X(c1 + 1);
  if (opt.hlRow && opt.dimBelow) {
    const top = Math.min(opt.hlRow - 1, r1);
    if (top >= r0) D.fillRect(xa, Y(top), xb - xa, (top - r0 + 1) * ch, DIM_FILL);
  }
  if (opt.hlRow && opt.hlRow >= r0 && opt.hlRow <= r1) {
    D.fillRect(xa, Y(opt.hlRow), xb - xa, ch, HL_FILL);
    D.flush();
    const lw = Math.max(1.2, ch * 0.12);
    D.line(xa - cw * 0.4, Y(opt.hlRow), xb + cw * 0.4, Y(opt.hlRow), lw, RIBLINE);
    D.line(xa - cw * 0.4, Y(opt.hlRow) + ch, xb + cw * 0.4, Y(opt.hlRow) + ch, lw, RIBLINE);
  }
  D.flush();
  // 6. 외곽선
  const osw = Math.max(1.2, cw * 0.12);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    if (!ex(r, c)) continue;
    const x = X(c), y = Y(r);
    if (!ex(r, c - 1)) D.line(x, y, x, y + ch, osw, INK, 'square');
    if (!ex(r, c + 1)) D.line(x + cw, y, x + cw, y + ch, osw, INK, 'square');
    if (!ex(r + 1, c)) D.line(x, y, x + cw, y, osw, INK, 'square');
    if (!ex(r - 1, c)) D.line(x, y + ch, x + cw, y + ch, osw, INK, 'square');
  }
  // 고무단 경계
  if (pc.ribRows && pc.ribRows >= r0 && pc.ribRows < r1) {
    const y = Y(pc.ribRows);
    let lo = Infinity, hi = -Infinity;
    for (let c = c0; c <= c1; c++) if (ex(pc.ribRows, c)) { lo = Math.min(lo, c); hi = Math.max(hi, c); }
    if (lo <= hi) D.line(X(lo) - cw * 0.6, y, X(hi + 1) + cw * 0.6, y, Math.max(1.2, cw * 0.14), RIBLINE);
  }
  // 7. 번호
  const step = ch >= 9 ? 1 : ch >= 5 ? 2 : 5;
  for (let r = r0; r <= r1; r++) {
    if (r % step !== 0 && r !== r0 && r % 10 !== 0) continue;
    const y = Y(r) + ch / 2, bold = r % 10 === 0 ? 700 : 400;
    if (r % 2 === 1) { // 겉면: 오른쪽
      let hi = -1; for (let c = c1; c >= c0; c--) if (ex(r, c)) { hi = c; break; }
      const xr = hi >= 0 ? X(hi + 1) : X(c1 + 1);
      D.text(Math.max(xr, X(c1 + 1)) + fs * 0.4, y, r, fs * 0.9, INK, 'left', bold);
    } else {
      D.text(X(c0) - fs * 0.4, y, r, fs * 0.9, INK, 'right', bold);
    }
  }
  const yb = Y(r0) + ch + fs * 0.9;
  for (let c = c0; c <= c1; c++) {
    const n = W - c;
    if (n % 5 === 0 || n === 1) D.text(X(c) + cw / 2, yb, n, fs * 0.85, INK, 'center', n % 10 === 0 ? 700 : 400);
  }
  D.flush();
  return G;
}
function chartSVG(pc, opt) {
  const G = chartGeom(pc, opt);
  const D = new SvgDraw(Math.ceil(G.width), Math.ceil(G.height));
  drawChart(D, pc, opt, G);
  return D.toString();
}
function motifPiece(m) {
  const ex = expandMotif(m);
  const codes = [];
  ex.cells.forEach((row, i) => {
    const r = i + 1;
    codes[r] = row.map(v => typeof v === 'object' ? (v.j === 0 ? v.tok : '>') : v);
  });
  return { W: ex.w, total: ex.h, codes, placements: [], ribRows: 0 };
}
function usedSymbols(pieces) {
  const set = new Set();
  pieces.forEach(pc => pc.codes.forEach(row => row && row.forEach(v => { if (v && v !== '>') set.add(v); })));
  const order = ['k', 'p', 'tk', 'yo', 'k2tog', 'ssk', 'sk2p', 'mb', 'm1r', 'm1l', 'bo', 'sr'];
  const list = order.filter(k => set.has(k));
  [...set].filter(k => parseTok(k)).sort().forEach(k => list.push(k));
  if (!list.includes('k')) list.unshift('k');
  return list;
}
function symbolSVG(code, cs = 22, showKnit = true) {
  const w = parseTok(code) ? parseTok(code).w : 1;
  const D = new SvgDraw(w * cs + 2, cs + 2);
  D.rect(1, 1, w * cs, cs, PAPER, GRID, 0.8);
  if (parseTok(code)) drawCross(D, code, 1, 1, cs, cs, PAPER); else drawSym(D, code, 1, 1, cs, cs, { showKnit: true });
  return D.toString();
}

/* ---------- 도식화 ---------- */
function pieceOutlineCells(pc) {
  const rects = [];
  for (let r = 1; r <= pc.total; r++) (pc.rows[r] || []).forEach(s => rects.push([s.l, r, s.r - s.l + 1]));
  return rects;
}
function drawSchematicPiece(D, C, pc, bx, by, scale, fs, mini) {
  const gs = C.gs, gr = C.gr;
  fs = fs || 11;
  const ph = (pc.total / gr) * scale, pw = (pc.W / gs) * scale;
  const base = by + ph;
  const sx = c => bx + (c / gs) * scale, sy = r => base - (r / gr) * scale;
  const lw = Math.max(0.8, fs * 0.09);
  const dimH = (xa, xb, y, label, above) => {
    D.line(xa, y, xb, y, lw * 0.8, RIBLINE); D.line(xa, y - fs * 0.35, xa, y + fs * 0.35, lw * 0.8, RIBLINE); D.line(xb, y - fs * 0.35, xb, y + fs * 0.35, lw * 0.8, RIBLINE);
    D.text((xa + xb) / 2, y + (above ? -fs * 0.75 : fs * 0.8), label, fs, INK, 'center', 500);
  };
  const dimV = (x, ya, yb, label, side) => {
    D.line(x, ya, x, yb, lw * 0.8, RIBLINE); D.line(x - fs * 0.35, ya, x + fs * 0.35, ya, lw * 0.8, RIBLINE); D.line(x - fs * 0.35, yb, x + fs * 0.35, yb, lw * 0.8, RIBLINE);
    D.text(x + (side === 'left' ? -fs * 0.5 : fs * 0.5), (ya + yb) / 2, label, fs, INK, side === 'left' ? 'right' : 'left', 500);
  };
  D.text(bx + pw / 2, by - fs * (mini ? 1.3 : 5.2), pc.name, fs * (mini ? 1.15 : 1.25), INK, 'center', 700);
  for (let r = 1; r <= pc.total; r++) (pc.rows[r] || []).forEach(s => D.fillRect(sx(s.l), sy(r), ((s.r - s.l + 1) / gs) * scale + 0.3, scale / gr + 0.3, r <= pc.ribRows ? '#EAE4DC' : '#FAF7F2'));
  const ex = (r, c) => pc.codes[r] && pc.codes[r][c] !== null && pc.codes[r][c] !== undefined;
  for (let r = 1; r <= pc.total; r++) (pc.rows[r] || []).forEach(s => {
    if (!ex(r, s.l - 1)) D.line(sx(s.l), sy(r), sx(s.l), sy(r - 1), lw * 1.4, INK, 'square');
    if (!ex(r, s.r + 1)) D.line(sx(s.r + 1), sy(r), sx(s.r + 1), sy(r - 1), lw * 1.4, INK, 'square');
    let a = null;
    for (let c = s.l; c <= s.r + 1; c++) { const open = c <= s.r && !ex(r + 1, c); if (open && a === null) a = c; if (!open && a !== null) { D.line(sx(a), sy(r), sx(c), sy(r), lw * 1.4, INK, 'square'); a = null; } }
    a = null;
    for (let c = s.l; c <= s.r + 1; c++) { const open = c <= s.r && !ex(r - 1, c); if (open && a === null) a = c; if (!open && a !== null) { D.line(sx(a), sy(r - 1), sx(c), sy(r - 1), lw * 1.4, INK, 'square'); a = null; } }
  });
  D.flush();
  if (mini) return { w: pw, h: ph };
  const f = C.finished, info = pc.info, lay = pc.lay;
  const cmOf = n => cmFor(n, lay, gs, C.dens);
  const row1 = pc.rows[1][0], row1r = pc.rows[1][pc.rows[1].length - 1];
  if (pc.kind !== 'sleeve') {
    dimH(sx(row1.l), sx(row1r.r + 1), base + fs * 1.3, `${fmt(cmOf(info.Nh))}cm (${info.Nh}코)`);
    const ur = C.ribRows + C.sideRows;
    const s = pc.rows[ur]; const ul = s[0].l, uh = s[s.length - 1].r + 1;
    dimH(sx(ul), sx(uh), sy(ur) + fs * 1.1, `${fmt(cmOf(info.Nc))}cm (${info.Nc}코)`);
    const xl = sx(Math.min(row1.l, ul));
    dimV(xl - fs * 1.4, base, sy(pc.total), `${fmt(pc.total / gr)}cm`, 'left');
    dimV(xl - fs * 5.6, base, sy(C.ribRows), `${fmt(C.ribRows / gr)}cm`, 'left');
    const xr = sx(Math.max(uh, row1r.r + 1)) + fs * 1.3;
    dimV(xr, sy(ur), sy(pc.total), `${fmt(C.ahRows / gr)}cm`, 'right');
    if (pc.kind === 'back' && info.neck) {
      const shL = pc.rows[C.shStart - 1];
      if (shL) dimH(sx(shL[0].l), sx(shL[shL.length - 1].r + 1), sy(pc.total) - fs * 2.6, `어깨 ${fmt(f.shoulder)}cm`, true);
      const nb = (info.neck.blocks || []).reduce((a, b) => a + b.amt, 0);
      const sr = pc.rows[info.neck.s + 1];
      if (sr && sr.length === 2) dimH(sx(sr[0].r + 1 - nb), sx(sr[1].l + nb), sy(pc.total) - fs * 0.9, `${fmt(f.neckW)}cm`, true);
    }
    if (info.neck && pc.kind !== 'back') {
      const xx = pc.kind === 'front' ? sx(pc.W / 2) : pc.kind === 'rfront' ? sx(row1r.r + 1) - fs * 0.6 : sx(row1.l) + fs * 0.6;
      const ya = sy(info.neck.s - 1), yb = sy(pc.total);
      D.line(xx, ya, xx, yb, lw * 0.8, RIBLINE); D.line(xx - fs * 0.35, ya, xx + fs * 0.35, ya, lw * 0.8, RIBLINE); D.line(xx - fs * 0.35, yb, xx + fs * 0.35, yb, lw * 0.8, RIBLINE);
      D.text(xx, ya + fs * 0.9, `목 깊이 ${fmt(info.neck.depthRows / gr)}cm`, fs, INK, pc.kind === 'front' ? 'center' : pc.kind === 'rfront' ? 'right' : 'left', 500);
    }
  } else {
    dimH(sx(row1.l), sx(row1r.r + 1), base + fs * 1.3, `${fmt(f.cuff)}cm (${info.Ncuff}코)`);
    const ur = pc.ribRows + info.underRows;
    const s = pc.rows[ur][0];
    dimH(sx(s.l), sx(s.r + 1), sy(ur) + fs * 1.1, `${fmt(f.upper)}cm (${info.Nup}코)`);
    dimV(sx(Math.min(s.l, row1.l)) - fs * 1.4, base, sy(pc.total), `${fmt(pc.total / gr)}cm`, 'left');
    if (info.cap) dimV(sx(s.r + 1) + fs * 1.3, sy(ur), sy(pc.total), `소매산 ${fmt(info.cap.hc / gr)}cm`, 'right');
  }
  D.flush();
  return { w: pw, h: ph };
}
function schemPieces(C) { return C.pieces.filter(p => p.kind !== 'lfront'); }
function schematicDims(C, availW, mini) {
  const fs = 11, padL = fs * (mini ? 1.2 : 8.4), padR = fs * (mini ? 1.2 : 10), padT = fs * (mini ? 2.4 : 6.8), padB = fs * (mini ? 0.6 : 3.4);
  const list = schemPieces(C);
  const sumW = list.reduce((a, pc) => a + pc.W / C.gs, 0);
  const scale = Math.max(mini ? 0.8 : 2.2, Math.min(7, (availW - list.length * (padL + padR)) / sumW));
  const w = list.reduce((a, pc) => a + (pc.W / C.gs) * scale + padL + padR, 0);
  const h = Math.max(...list.map(pc => (pc.total / C.gr) * scale)) + padT + padB;
  return { fs, padL, padR, padT, padB, list, scale, mini, w: Math.ceil(w), h: Math.ceil(h) };
}
function drawSchematicAll(D, C, dm) {
  let x = 0;
  dm.list.forEach(pc => { const r = drawSchematicPiece(D, C, pc, x + dm.padL, dm.padT, dm.scale, dm.fs, dm.mini); x += r.w + dm.padL + dm.padR; });
}
function schematicSVG(C, availW, mini) {
  const dm = schematicDims(C, availW, mini);
  const D = new SvgDraw(dm.w, dm.h);
  drawSchematicAll(D, C, dm);
  return D.toString();
}
