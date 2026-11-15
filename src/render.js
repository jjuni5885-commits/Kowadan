'use strict';
/* ===================== 그리기 백엔드 ===================== */
const INK = '#2A2320', GRID = '#C9BDB2', GRID10 = '#6F625A', PAPER = '#FFFFFF', TINT = '#FBE7B0', CENTER = '#F2A9C4', RIBLINE = '#A23E57';
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
  toString() { this.flush(); return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.w}" height="${this.h}" viewBox="0 0 ${this.w} ${this.h}" font-family="'Noto Sans KR', sans-serif">${this.out.join('')}</svg>`; }
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
  text(x, y, s, size, col, align, weight) { const c = this.c; c.font = `${weight || 400} ${size * this.s}px 'Noto Sans KR', sans-serif`; c.fillStyle = col || INK; c.textAlign = align || 'left'; c.textBaseline = 'middle'; c.fillText(String(s), this.X(x), this.Y(y)); }
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
    if (opt.center && centerOdd && c === cc) D.fillRect(X(c), Y(r), cw, ch, '#FBDDE8');
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
function drawSchematicPiece(D, C, pc, bx, by, scale, fs) {
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
  D.text(bx + pw / 2, by - fs * 4.4, pc.name, fs * 1.25, INK, 'center', 700);
  for (let r = 1; r <= pc.total; r++) (pc.rows[r] || []).forEach(s => D.fillRect(sx(s.l), sy(r), ((s.r - s.l + 1) / gs) * scale + 0.3, scale / gr + 0.3, r <= pc.ribRows ? '#E6D2C4' : '#F4E8DE'));
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
    dimV(xl - fs * 5.6, base, sy(C.ribRows), `${fmt(C.ribRows / gr)}`, 'left');
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
      dimV(xx, sy(info.neck.s - 1), sy(pc.total), `${fmt(info.neck.depthRows / gr)}`, pc.kind === 'lfront' ? 'right' : 'left');
    }
  } else {
    dimH(sx(row1.l), sx(row1r.r + 1), base + fs * 1.3, `${fmt(f.cuff)}cm (${info.Ncuff}코)`);
    const ur = pc.ribRows + info.underRows;
    const s = pc.rows[ur][0];
    dimH(sx(s.l), sx(s.r + 1), sy(ur) + fs * 1.1, `${fmt(f.upper)}cm (${info.Nup}코)`);
    dimV(sx(Math.min(s.l, row1.l)) - fs * 1.4, base, sy(pc.total), `${fmt(pc.total / gr)}cm`, 'left');
    if (info.cap) dimV(sx(s.r + 1) + fs * 1.3, sy(ur), sy(pc.total), `소매산 ${fmt(info.cap.hc / gr)}`, 'right');
  }
  D.flush();
  return { w: pw, h: ph };
}
function schemPieces(C) { return C.pieces.filter(p => p.kind !== 'lfront'); }
function schematicSVG(C, availW) {
  const fs = 11, padL = fs * 8, padR = fs * 6, padT = fs * 6, padB = fs * 3.4;
  const list = schemPieces(C);
  const sumW = list.reduce((a, pc) => a + pc.W / C.gs, 0);
  const scale = Math.max(2.2, Math.min(7, (availW - list.length * (padL + padR)) / sumW));
  const w = list.reduce((a, pc) => a + (pc.W / C.gs) * scale + padL + padR, 0);
  const h = Math.max(...list.map(pc => (pc.total / C.gr) * scale)) + padT + padB;
  const D = new SvgDraw(Math.ceil(w), Math.ceil(h));
  let x = 0;
  list.forEach(pc => { const r = drawSchematicPiece(D, C, pc, x + padL, padT, scale, fs); x += r.w + padL + padR; });
  return D.toString();
}
