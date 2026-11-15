'use strict';
/* ===================== 코와단 도안 엔진 ===================== */
const even = x => 2 * Math.round(x / 2);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const r1 = x => Math.round(x * 10) / 10;
const fmt = x => { const v = r1(x); return Number.isInteger(v) ? String(v) : v.toFixed(1); };

/* ---------- 기호 정의 ---------- */
const STITCH = {
  k: { name: '겉뜨기', ws: '안뜨기', how: '바늘을 코의 앞쪽에서 넣어 겉뜨기합니다.' },
  p: { name: '안뜨기', ws: '겉뜨기', how: '실을 앞에 두고 안뜨기합니다.' },
  tk: { name: '꼬아뜨기', ws: '꼬아 안뜨기', how: '코의 뒤쪽 고리에 바늘을 넣어 겉뜨기합니다.' },
  yo: { name: '바늘비우기', ws: '바늘비우기', how: '실을 오른바늘에 한 번 감아 1코를 만듭니다.' },
  k2tog: { name: '왼코 겹치기', ws: '안면 2코 모아 안뜨기', how: '2코에 한꺼번에 바늘을 넣어 겉뜨기합니다. 오른쪽으로 기울어집니다.' },
  ssk: { name: '오른코 겹치기', ws: '안면 오른코 겹치기', how: '2코를 1코씩 겉뜨기 방향으로 옮긴 뒤 왼바늘로 되돌려 뒤쪽 고리로 함께 겉뜨기합니다. 왼쪽으로 기울어집니다.' },
  sk2p: { name: '중심 3코 모아뜨기', ws: '안면 3코 모아뜨기', how: '2코를 함께 겉뜨기 방향으로 옮기고 다음 코를 겉뜨기한 뒤 옮긴 2코를 덮어씌웁니다.' },
  mb: { name: '방울뜨기', ws: '방울뜨기', how: '1코에 겉뜨기, 바늘비우기, 겉뜨기, 바늘비우기, 겉뜨기를 하여 5코를 만들고 4단 왕복한 뒤 5코를 1코로 모읍니다.' },
  bo: { name: '덮어씌우기', ws: '덮어씌우기', how: '2코를 뜨고 오른쪽 코를 왼쪽 코에 덮어씌우는 것을 반복합니다.' },
  sr: { name: '되돌아뜨기 남김코', ws: '되돌아뜨기 남김코', how: '단 끝까지 뜨지 않고 지정한 코 수를 남긴 채 편물을 돌립니다. 마지막에 남긴 코를 모두 한 번에 뜬 뒤 쉼코로 둡니다.' },
  m1r: { name: '오른코 늘리기', ws: '오른코 늘리기', how: '코와 코 사이의 가로실을 뒤에서 앞으로 걸어 올려 꼬아서 겉뜨기합니다.' },
  m1l: { name: '왼코 늘리기', ws: '왼코 늘리기', how: '코와 코 사이의 가로실을 앞에서 뒤로 걸어 올려 뒤쪽 고리로 겉뜨기합니다.' },
};

function parseTok(t) {
  if (typeof t !== 'string') return null;
  const m = /^(L|R)(P?)C(\d)\/(\d)$/.exec(t);
  if (!m) return null;
  return { side: m[1], purl: m[2] === 'P', a: +m[3], b: +m[4], w: +m[3] + +m[4] };
}
function tokW(t) { const x = parseTok(t); return x ? x.w : 1; }
function crossName(t) {
  const x = parseTok(t); if (!x) return STITCH[t] ? STITCH[t].name : t;
  const top = x.side === 'L' ? '오른코 위' : '왼코 위';
  if (x.a === x.b && !x.purl) return `${top} ${x.a}코 교차뜨기`;
  return `${top} ${x.a}코와 ${x.b}코 교차뜨기${x.purl ? '(아래 안뜨기)' : ''}`;
}
function crossHow(t) {
  const x = parseTok(t);
  const u = x.purl ? '안뜨기' : '겉뜨기';
  if (x.side === 'L') return `꽈배기바늘에 ${x.a}코를 옮겨 편물 앞쪽에 두고, 다음 ${x.b}코를 ${u}한 뒤 꽈배기바늘의 ${x.a}코를 겉뜨기합니다.`;
  return `꽈배기바늘에 ${x.b}코를 옮겨 편물 뒤쪽에 두고, 다음 ${x.a}코를 겉뜨기한 뒤 꽈배기바늘의 ${x.b}코를 ${u}합니다.`;
}
function symName(t) { return parseTok(t) ? crossName(t) : (STITCH[t] ? STITCH[t].name : t); }
// 교차 후 j번째 칸(왼쪽부터)의 결과 코
function crossOut(t, j) {
  const x = parseTok(t);
  if (x.side === 'L') return j < x.a ? 'k' : (x.purl ? 'p' : 'k');
  return j < x.b ? (x.purl ? 'p' : 'k') : 'k';
}

/* ---------- 무늬 라이브러리 ---------- */
function R(str) { // 'p*3 LC2/2 p*3' -> tokens
  const out = [];
  str.trim().split(/\s+/).forEach(s => {
    const m = /^(.+)\*(\d+)$/.exec(s);
    if (m) for (let i = 0; i < +m[2]; i++) out.push(m[1]); else out.push(s);
  });
  return out;
}
function rep(str, n) { return Array.from({ length: n }, () => R(str)); }

const BUILTIN_MOTIFS = [
  { id: 'rope6r', name: '6코 꽈배기(오른코 위)', cat: '꽈배기', rows: [R('LC3/3'), ...rep('k*6', 7)] },
  { id: 'rope6l', name: '6코 꽈배기(왼코 위)', cat: '꽈배기', rows: [R('RC3/3'), ...rep('k*6', 7)] },
  { id: 'rope4r', name: '4코 꽈배기(오른코 위)', cat: '꽈배기', rows: [R('LC2/2'), ...rep('k*4', 3)] },
  { id: 'rope4l', name: '4코 꽈배기(왼코 위)', cat: '꽈배기', rows: [R('RC2/2'), ...rep('k*4', 3)] },
  { id: 'rope8r', name: '8코 꽈배기(오른코 위)', cat: '꽈배기', rows: [R('LC4/4'), ...rep('k*8', 9)] },
  { id: 'horse12', name: '말굽 꽈배기 12코', cat: '꽈배기', rows: [R('LC3/3 RC3/3'), ...rep('k*12', 7)] },
  { id: 'plait9', name: '세 가닥 땋기 9코', cat: '꽈배기', rows: [R('k*3 LC3/3'), ...rep('k*9', 3), R('RC3/3 k*3'), ...rep('k*9', 3)] },
  { id: 'honey8', name: '벌집 꽈배기 8코', cat: '꽈배기', rows: [R('RC2/2 LC2/2'), ...rep('k*8', 3), R('LC2/2 RC2/2'), ...rep('k*8', 3)] },
  {
    id: 'diamond10', name: '다이아몬드 꽈배기 10코', cat: '이동 꽈배기', rows: [
      R('p*3 LC2/2 p*3'), R('p*3 k*4 p*3'),
      R('p*2 LPC2/1 RPC2/1 p*2'), R('p*2 k*2 p*2 k*2 p*2'),
      R('p LPC2/1 p*2 RPC2/1 p'), R('p k*2 p*4 k*2 p'),
      R('LPC2/1 p*4 RPC2/1'), R('k*2 p*6 k*2'),
      R('RPC2/1 p*4 LPC2/1'), R('p k*2 p*4 k*2 p'),
      R('p RPC2/1 p*2 LPC2/1 p'), R('p*2 k*2 p*2 k*2 p*2'),
      R('p*2 RPC2/1 LPC2/1 p*2'), R('p*3 k*4 p*3'),
      R('p*3 k*4 p*3'), R('p*3 k*4 p*3'),
    ]
  },
  { id: 'twist2', name: '잔꽈배기 2코', cat: '꽈배기', rows: [R('LC1/1'), R('k*2')] },
  { id: 'bobble5', name: '방울 무늬 5코', cat: '방울', rows: [R('p*2 mb p*2'), R('p*2 k p*2'), ...rep('p*5', 4)] },
  { id: 'eyelet7', name: '비침 다이아 7코', cat: '비침', rows: [
      R('k*7'), R('p*7'), R('k*2 k2tog yo k*3'), R('p*7'), R('k k2tog yo k yo ssk k'), R('p*7'),
      R('k2tog yo k*3 yo ssk'), R('p*7'), R('k yo ssk k k2tog yo k'), R('p*7'), R('k*2 yo sk2p yo k*2'), R('p*7')] },
];

function mirrorTok(t) {
  const x = parseTok(t);
  if (x) return `${x.side === 'L' ? 'R' : 'L'}${x.purl ? 'P' : ''}C${x.a}/${x.b}`;
  return ({ k2tog: 'ssk', ssk: 'k2tog', m1l: 'm1r', m1r: 'm1l' })[t] || t;
}
function mirrorMotif(m) {
  const nm = /오른코|왼코/.test(m.name) ? m.name.replace(/오른코|왼코/g, x => x === '오른코' ? '왼코' : '오른코') : m.name + ' (대칭)';
  return { ...m, id: m.id + '~m', name: nm, rows: m.rows.map(row => row.slice().reverse().map(mirrorTok)) };
}
// 무늬 -> 칸 그리드 [r][c] : 문자열 또는 {tok,j}
function expandMotif(m) {
  const cells = m.rows.map(row => {
    const out = [];
    row.forEach(t => {
      const x = parseTok(t);
      if (x) for (let j = 0; j < x.w; j++) out.push({ tok: t, j });
      else out.push(t);
    });
    return out;
  });
  const w = Math.max(...cells.map(r => r.length));
  return { w, h: cells.length, cells };
}
function motifCheck(m) {
  const e = expandMotif(m), errs = [];
  e.cells.forEach((row, i) => {
    if (row.length !== e.w) errs.push(`${i + 1}단의 코 수(${row.length})가 무늬 폭(${e.w})과 다릅니다.`);
    let bal = 0;
    m.rows[i].forEach(t => { if (t === 'yo') bal++; if (t === 'k2tog' || t === 'ssk') bal--; if (t === 'sk2p') bal -= 2; });
    if (bal !== 0) errs.push(`${i + 1}단의 늘림과 줄임이 맞지 않습니다(${bal > 0 ? '+' : ''}${bal}코).`);
    if (i % 2 === 1 && m.rows[i].some(t => parseTok(t))) errs.push(`${i + 1}단(안면)에 교차뜨기가 있습니다. 교차는 겉면 단(홀수 단)에 두세요.`);
  });
  return errs;
}

/* ---------- 줄임/늘림 배분 (단-코-회) ---------- */
function distribute(H, n) { // H단 동안 n회, 간격은 짝수
  if (n <= 0) return [];
  let lo = Math.max(2, 2 * Math.floor(H / n / 2));
  if (lo * n > H) return Array(n).fill(2);
  const rem = H - lo * n;
  const y = Math.min(n, Math.floor(rem / 2));
  return [...Array(y).fill(lo + 2), ...Array(n - y).fill(lo)];
}
function mergeToFit(total, maxEvents, firstMin) { // 코 수를 횟수 한도에 맞게 묶음
  const a = Array(Math.max(0, total)).fill(1);
  if (firstMin && a.length >= firstMin + 1) { a.splice(0, firstMin, firstMin); }
  while (a.length > Math.max(1, maxEvents)) { const x = a.shift(); a[0] += x; }
  // 앞이 더 크게 정렬
  return a;
}
function neckSide(fs, maxEv) { // 둥근 목선 한쪽 줄임 코 배열 (큰 것부터)
  const a = []; let rem = fs;
  if (rem >= 8) { a.push(3); rem -= 3; }
  if (rem >= 5) { a.push(2); rem -= 2; }
  while (rem > 0) { a.push(1); rem--; }
  maxEv = Math.max(1, maxEv);
  while (a.length > maxEv) {
    a.pop();
    let k = 0;
    for (let i = 1; i < a.length; i++) if (a[i] < a[i - 1]) { k = i; break; }
    a[k]++;
  }
  return a;
}
// 블록 -> 표기 "2-3-1, 2-1-4"
function notation(blocks) {
  const g = [];
  blocks.forEach(b => {
    const last = g[g.length - 1];
    if (last && last.len === b.len && last.amt === b.amt) last.t++;
    else g.push({ len: b.len, amt: b.amt, t: 1 });
  });
  return g.map(x => `${x.len}-${x.amt}-${x.t}`).join(', ');
}

/* ---------- 조각 시뮬레이터 ---------- */
// ops[row] = [{seg:'main'|'L'|'R', edge:'left'|'right', type:'bo'|'dec'|'inc'|'sr', n}]
function simulate(W, l0, r0, total, ops, splits) {
  let segs = { main: { l: l0, r: r0 } }, split = false;
  const rows = [], marks = new Map();
  const mk = (r, c, code) => marks.set(r * 10000 + c, code);
  const resolve = op => {
    if (!split) return segs.main;
    if (op.seg === 'main') return op.edge === 'left' ? segs.L : segs.R;
    return segs[op.seg];
  };
  for (let r = 1; r <= total; r++) {
    const rowOps = ops[r] || [];
    rowOps.filter(o => o.type === 'inc').forEach(o => {
      const s = resolve(o); if (!s || s.l > s.r) return;
      for (let i = 0; i < o.n; i++) {
        if (o.edge === 'left') { s.l--; mk(r, s.l + 1, 'm1l'); } else { s.r++; mk(r, s.r - 1, 'm1r'); }
      }
    });
    const live = Object.entries(segs).filter(([, s]) => s.l <= s.r).map(([k, s]) => ({ name: k, l: s.l, r: s.r }));
    if (!live.length) break;
    rows[r] = live;
    const after = [];
    rowOps.filter(o => o.type !== 'inc').forEach(o => {
      const s = resolve(o); if (!s || s.l > s.r) return;
      const n = Math.min(o.n, s.r - s.l + 1);
      if (o.type === 'dec') {
        if (o.edge === 'left') { mk(r, Math.min(s.l + 1, s.r), 'k2tog'); after.push(() => { s.l += 1; }); }
        else { mk(r, Math.max(s.r - 1, s.l), 'ssk'); after.push(() => { s.r -= 1; }); }
      } else { // bo / sr
        const code = o.type === 'sr' ? 'sr' : 'bo';
        if (o.edge === 'left') { for (let c = s.l; c < s.l + n; c++) mk(r, c, code); after.push(() => { s.l += n; }); }
        else { for (let c = s.r - n + 1; c <= s.r; c++) mk(r, c, code); after.push(() => { s.r -= n; }); }
      }
    });
    if (splits[r] && !split) {
      const sp = splits[r];
      for (let c = sp.a; c <= sp.b; c++) mk(r, c, 'bo');
      after.push(() => {
        const m = segs.main;
        segs = { L: { l: m.l, r: sp.a - 1 }, R: { l: sp.b + 1, r: m.r } };
        split = true;
      });
    }
    after.forEach(f => f());
  }
  const left = Object.values(segs).reduce((a, s) => a + Math.max(0, s.r - s.l + 1), 0);
  return { rows, marks, left };
}
function addEvents(ops, events, edges) {
  // events: [{row, amt, kind}] ; edges: [{seg, edge}]
  events.forEach(ev => {
    edges.forEach(e => {
      let type = ev.kind, row = ev.row;
      if (type === 'dec' && ev.amt >= 2) type = 'bo';
      if ((type === 'bo' || type === 'sr') && e.edge === 'left') row = ev.row + 1;
      (ops[row] = ops[row] || []).push({ seg: e.seg, edge: e.edge, type, n: ev.amt });
    });
  });
}
function blocksToEvents(start, blocks, kind) {
  let row = start; const ev = [];
  blocks.forEach(b => { ev.push({ row, amt: b.amt, kind: b.kind || kind }); row += b.len; });
  return ev;
}
function edgeLen(rows, from, to, side, gs, gr, segPick) {
  // 가장자리 길이 (cm): side 'right' or 'left'
  let len = 0, prev = null;
  for (let r = from; r <= to; r++) {
    const segs = rows[r]; if (!segs) break;
    const s = segPick ? segPick(segs) : (side === 'right' ? segs[segs.length - 1] : segs[0]);
    if (!s) break;
    const pos = side === 'right' ? s.r + 1 : s.l;
    if (prev !== null) len += Math.hypot((pos - prev) / gs, 1 / gr); else len += 1 / gr;
    prev = pos;
  }
  return len;
}

/* ---------- 패널 배치 ---------- */
function makeLayout(pat, motifs, which) {
  // which: 'full' (중앙+양옆), 'center' (중앙만), 'none'
  const get = id => motifs.find(m => m.id === id);
  const blocks = [];
  const M0 = which !== 'none' && pat.center ? get(pat.center) : null;
  const M1 = which === 'full' && pat.side ? get(pat.side) : null;
  const sep = pat.sep || 0, gap = pat.gap || 0;
  const mBlock = (m, mir) => ({ type: 'motif', motif: mir ? mirrorMotif(m) : m, w: expandMotif(m).w });
  const sepB = () => sep ? [{ type: 'purl', w: sep }] : [];
  const center = M0 ? [...sepB(), mBlock(M0, false), ...sepB()] : [];
  if (M1) {
    const leftSide = [...sepB(), mBlock(M1, true), ...sepB(), { type: 'bg', w: M0 ? gap : Math.ceil(gap / 2) }];
    const rightSide = [{ type: 'bg', w: M0 ? gap : Math.floor(gap / 2) }, ...sepB(), mBlock(M1, false), ...sepB()];
    blocks.push(...leftSide, ...center, ...rightSide);
  } else blocks.push(...center);
  const panelW = blocks.reduce((a, b) => a + b.w, 0);
  const cableSts = blocks.filter(b => b.type === 'motif' && b.motif.rows.some(r => r.some(t => parseTok(t)))).reduce((a, b) => a + b.w, 0);
  return { blocks, panelW, cableSts };
}
function layoutWidthCm(lay, gs, dens) { return lay.cableSts / (gs * dens) + (lay.panelW - lay.cableSts) / gs; }
function stsFor(cm, lay, gs, dens) {
  const bg = (cm - layoutWidthCm(lay, gs, dens)) * gs;
  const bgE = Math.max(2, even(bg));
  return lay.panelW + bgE;
}
function cmFor(n, lay, gs, dens) { return (n - lay.panelW) / gs + layoutWidthCm(lay, gs, dens); }

/* ---------- 고무단 / 바탕 ---------- */
function ribCode(type, c, center, odd, r) {
  if (type === 'garter') return r % 2 === 1 ? 'k' : 'p';
  const i = Math.floor(Math.abs(c - center) + 1e-9);
  const knit = type === '2x2' ? (odd ? Math.floor(i / 2) % 2 === 0 : (i === 0 || Math.floor((i - 1) / 2) % 2 === 1)) : i % 2 === 0;
  if (!knit) return 'p';
  return type === '1x1t' ? 'tk' : 'k';
}
function bgCode(type, r, c) {
  if (type === 'rev') return 'p';
  if (type === 'seed') return (r + c) % 2 === 0 ? 'k' : 'p';
  if (type === 'garter') return r % 2 === 1 ? 'k' : 'p';
  return 'k';
}
const BG_NAME = { st: '메리야스뜨기', rev: '안메리야스뜨기', seed: '멍석뜨기', garter: '가터뜨기' };
const RIB_NAME = { '1x1': '1코 고무뜨기', '2x2': '2코 고무뜨기', '1x1t': '1코 꼬아 고무뜨기', garter: '가터뜨기' };

/* ---------- 조각 -> 칸 코드 ---------- */
function fillPiece(pc, opt) {
  const { W, rows, marks, ribRows, ribType, bg, placements, finalBo } = pc;
  const total = rows.length - 1;
  const codes = [];
  const center = (W - 1) / 2;
  const first = rows[1] ? rows[1][0] : { l: 0, r: W - 1 };
  const ribCenter = (first.l + rows[1][rows[1].length - 1].r) / 2;
  const ribOdd = ((rows[1][rows[1].length - 1].r - first.l + 1) % 2) === 1;
  for (let r = 1; r <= total; r++) {
    const row = Array(W).fill(null);
    (rows[r] || []).forEach(s => {
      for (let c = s.l; c <= s.r; c++) {
        let code;
        if (r <= ribRows) code = (c === s.l || c === s.r) ? 'k' : ribCode(ribType, c, ribCenter, ribOdd, r);
        else if (c === s.l || c === s.r) code = 'k';
        else {
          code = bgCode(bg, r, c);
          for (const p of placements) {
            if (c >= p.x0 && c < p.x0 + p.w && r >= p.y0) {
              if (p.kind === 'purl') { code = 'p'; break; }
              if (p.kind === 'bg') break;
              const mr = (r - p.y0) % p.ex.h;
              const cell = p.ex.cells[mr][c - p.x0];
              code = typeof cell === 'object' ? { ...cell } : cell;
              break;
            }
          }
        }
        row[c] = code;
      }
    });
    codes[r] = row;
  }
  marks.forEach((code, key) => {
    const r = Math.floor(key / 10000), c = key % 10000;
    if (codes[r] && codes[r][c] !== null && codes[r][c] !== undefined) codes[r][c] = code;
  });
  if (finalBo) { const r = total; codes[r] = codes[r].map(v => v === null ? null : 'bo'); }
  // 교차 검증
  const segOf = (r, c) => (rows[r] || []).find(s => c >= s.l && c <= s.r);
  for (let r = 1; r <= total; r++) {
    const row = codes[r];
    for (let c = 0; c < W; c++) {
      const v = row[c];
      if (v && typeof v === 'object') {
        const x = parseTok(v.tok);
        let ok = v.j === 0 && r % 2 === 1;
        const sg = segOf(r, c);
        if (ok) for (let j = 1; j < x.w; j++) {
          const u = row[c + j];
          if (!(u && typeof u === 'object' && u.tok === v.tok && u.j === j) || !sg || c + j > sg.r) { ok = false; break; }
        }
        if (ok && sg && (c === sg.l || c + x.w - 1 === sg.r)) ok = false;
        if (ok) { row[c] = v.tok; for (let j = 1; j < x.w; j++) row[c + j] = '>'; c += x.w - 1; }
        else row[c] = crossOut(v.tok, v.j);
      }
    }
  }
  pc.codes = codes;
  pc.total = total;
  return pc;
}

/* ---------- 메인 계산 ---------- */
function compute(P, motifLib) {
  const W_ = [], notes = [];
  const warn = s => W_.push(s);
  const gs = P.gauge.unit === '10cm' ? P.gauge.st / 10 : P.gauge.st;
  const gr = P.gauge.unit === '10cm' ? P.gauge.row / 10 : P.gauge.row;
  const dens = P.gauge.dens || 1.2;
  const b = P.body, e = P.ease, d = P.design, pat = P.pattern;
  const isCard = P.garment === 'cardigan';
  const isV = P.neck === 'v';
  const isDrop = P.sleeve === 'drop';
  const rowsOf = cm => Math.max(2, even(cm * gr));

  // 완성 목표 치수
  const T = {
    chest: b.chest + e.chest, hip: b.hip + e.hip, shoulder: b.shoulder + e.shoulder,
    armDepth: b.armDepth + e.armDepth, neckW: b.neckW + e.neckW, armLen: b.armLen + e.armLen,
    upper: b.upperArm + e.upperArm, wrist: b.wrist + e.wrist, length: d.length,
  };
  if (T.neckW >= T.shoulder - 6) warn('목너비가 어깨너비에 비해 너무 넓습니다. 어깨 코가 부족할 수 있습니다.');
  if (T.shoulder > T.chest / 2 && !isDrop) warn('어깨너비가 가슴 반둘레보다 넓습니다. 드롭숄더를 고려하세요.');

  const layFull = makeLayout(pat, motifLib, 'full');
  const layBack = makeLayout(pat, motifLib, pat.applyBack ? 'full' : 'none');
  const layOne = makeLayout(pat, motifLib, 'center');
  const laySleeve = makeLayout(pat, motifLib, pat.applySleeve ? 'center' : 'none');
  const layFront = isCard ? layOne : layFull;

  const ribRows = rowsOf(d.ribH);
  const ahRows = rowsOf(T.armDepth);
  const totalRows = rowsOf(T.length);
  const sideRows = totalRows - ribRows - ahRows;
  if (sideRows < 10) warn('총장이 너무 짧아 옆선 길이가 부족합니다.');

  const pieces = [];
  const shoulderKind = d.shoulderMethod === 'sr' ? 'sr' : 'bo';

  // ---- 몸판 공통 계산 ----
  function bodyPlan(lay, halfFactor, label) {
    // halfFactor: 1 => 앞/뒤판 전체 폭(반둘레), 0.5 => 가디건 한쪽
    const bandHalf = isCard && halfFactor === 0.5 ? d.bandW / 2 : 0;
    const wChest = T.chest / 2 * halfFactor - bandHalf;
    const wHip = T.hip / 2 * halfFactor - bandHalf;
    const Nc = stsFor(wChest, lay, gs, dens);
    let Nh = stsFor(wHip, lay, gs, dens);
    return { Nc, Nh, wChest, wHip };
  }
  // 뒤판 기준 어깨/진동 코 계산
  const backP = bodyPlan(layBack, 1);
  const shoulderBase = isDrop ? cmFor(backP.Nc, layBack, gs, dens) : T.shoulder;
  const shSts = Math.max(4, Math.round(((shoulderBase - T.neckW) / 2) * gs));
  let NshBack = isDrop ? backP.Nc : stsFor(T.shoulder, layBack, gs, dens);
  if (NshBack > backP.Nc) NshBack = backP.Nc;
  const A = (backP.Nc - NshBack) / 2; // 진동 줄임 코 (한쪽)
  const neckStsBack = NshBack - 2 * shSts;
  if (neckStsBack < 6) warn('목 코 수가 너무 적습니다. 목너비나 어깨너비를 확인하세요.');

  // 진동 단계
  function armholeBlocks(A) {
    const out = []; let rem = A;
    if (rem <= 0) return out;
    if (rem >= 4) { const b0 = clamp(Math.round(A * 0.35), 2, 6); out.push({ len: 2, amt: b0, kind: 'bo' }); rem -= b0; }
    if (rem >= 5) { out.push({ len: 2, amt: 2, kind: 'bo' }); rem -= 2; }
    let ones = 0;
    while (rem > 0) { out.push({ len: ones < 6 ? 2 : 4, amt: 1, kind: 'dec' }); ones++; rem--; }
    return out;
  }
  const ahBlocks = armholeBlocks(A);
  const ahStart = ribRows + sideRows + 1;
  const ahUsed = ahBlocks.reduce((a, x) => a + x.len, 0);

  // 어깨 단계
  const sdRows = rowsOf(d.shoulderDrop);
  const kSteps = clamp(Math.round(sdRows / 2), 2, Math.min(4, shSts));
  const shParts = Array.from({ length: kSteps }, (_, i) => Math.floor(shSts / kSteps) + (i < shSts % kSteps ? 1 : 0));
  const shStart = totalRows - 2 * kSteps + 1;
  if (ahStart + ahUsed > shStart - 4) warn('진동 줄임이 어깨 경사와 겹칩니다. 진동깊이를 늘리거나 어깨너비를 넓히세요.');

  // 옆선 쉐이핑(밑단 -> 가슴)
  function sideShaping(Nh, Nc, oneSide) {
    const dd = oneSide ? (Nc - Nh) : (Nc - Nh) / 2;
    if (dd === 0) return { events: [], blocks: [], F: 0, kind: null, n: 0 };
    const F = Math.min(rowsOf(4), Math.max(0, sideRows - 4));
    const H = Math.max(2, sideRows - F - rowsOf(3));
    const iv = distribute(H, Math.abs(dd));
    if (iv.reduce((a, x) => a + x, 0) > H) warn('밑단과 가슴 폭 차이가 커서 옆선 쉐이핑 간격이 2단으로 촘촘합니다.');
    const blocks = iv.map(len => ({ len, amt: 1 }));
    return { blocks, F, kind: dd > 0 ? 'inc' : 'dec', n: Math.abs(dd) };
  }

  // 목 줄임 계산
  function roundNeck(neckSts, depthRows) {
    const maxEv = Math.max(1, Math.floor((depthRows - 4) / 2));
    let fs = Math.round(neckSts * 0.33);
    let center = neckSts - 2 * fs;
    if (center < 2) { fs = Math.floor((neckSts - 2) / 2); center = neckSts - 2 * fs; }
    const amts = neckSide(fs, maxEv);
    return { center, fs, amts };
  }

  /* ===== 몸판 조각 생성 ===== */
  function makeBody(id, name, lay, kind) {
    // kind: 'back' | 'front' | 'rfront' | 'lfront'
    const half = kind === 'rfront' || kind === 'lfront';
    const pl = bodyPlan(lay, half ? 0.5 : 1);
    const Nc = pl.Nc, Nh = pl.Nh;
    const Ash = half ? A : A; // 한쪽 진동 줄임 동일
    const W = Math.max(Nc, Nh);
    const l0 = (W - Nh) / 2;
    const ops = {}, splits = {}, info = { Nc, Nh, wChest: pl.wChest, wHip: pl.wHip };
    // 옆선
    const ss = sideShaping(Nh, Nc, half);
    const sideEdges = kind === 'rfront' ? [{ seg: 'main', edge: 'left' }] : kind === 'lfront' ? [{ seg: 'main', edge: 'right' }] : [{ seg: 'main', edge: 'left' }, { seg: 'main', edge: 'right' }];
    const centerEdge = kind === 'rfront' ? [{ seg: 'main', edge: 'right' }] : kind === 'lfront' ? [{ seg: 'main', edge: 'left' }] : [];
    if (ss.blocks.length) {
      addEvents(ops, blocksToEvents(ribRows + 1 + ss.F, ss.blocks, ss.kind), sideEdges);
      // 가디건 앞판은 옆선만 조정 -> 앞중심 쪽은 반영 안 함 (중심선 직선)
    }
    info.side = ss;
    // 진동
    const ahEdges = sideEdges;
    addEvents(ops, blocksToEvents(ahStart, ahBlocks, 'dec'), ahEdges);
    info.ahBlocks = ahBlocks;
    // 어깨
    const shBlocks = shParts.map(a => ({ len: 2, amt: a, kind: shoulderKind }));
    const shEdges = kind === 'rfront' ? [{ seg: 'main', edge: 'left' }] : kind === 'lfront' ? [{ seg: 'main', edge: 'right' }] : [{ seg: 'main', edge: 'left' }, { seg: 'main', edge: 'right' }];
    addEvents(ops, blocksToEvents(shStart, shBlocks, shoulderKind), shEdges);
    info.shBlocks = shBlocks;
    // 목
    const centerCol = (W - 1) / 2;
    const NshThis = (half ? Nc - A : Nc - 2 * A);
    const neckSts = half ? NshThis - shSts : NshThis - 2 * shSts;
    info.neckSts = neckSts; info.Nsh = NshThis;
    if (kind === 'back') {
      const nb = rowsOf(d.backNeckD);
      const s = totalRows - nb + 1;
      const maxEv = Math.max(1, nb / 2 - 1);
      const bs = clamp(Math.round(neckSts * 0.15), 2, 4);
      const amts = mergeToFit(bs, maxEv, 0);
      const center = neckSts - 2 * bs;
      const a = Math.round(centerCol - (center - 1) / 2);
      splits[s] = { a, b: a + center - 1 };
      const blocks = amts.map(x => ({ len: 2, amt: x, kind: x >= 2 ? 'bo' : 'dec' }));
      addEvents(ops, blocksToEvents(s + 2, blocks, 'dec'), [{ seg: 'L', edge: 'right' }, { seg: 'R', edge: 'left' }]);
      info.neck = { type: 'back', s, center, blocks, depthRows: nb };
    } else if (kind === 'front' && !isV) {
      const nf = rowsOf(d.frontNeckD);
      const s = totalRows - nf + 1;
      const rn = roundNeck(neckSts, nf);
      const a = Math.round(centerCol - (rn.center - 1) / 2);
      splits[s] = { a, b: a + rn.center - 1 };
      const blocks = rn.amts.map(x => ({ len: 2, amt: x, kind: x >= 2 ? 'bo' : 'dec' }));
      addEvents(ops, blocksToEvents(s + 2, blocks, 'dec'), [{ seg: 'L', edge: 'right' }, { seg: 'R', edge: 'left' }]);
      info.neck = { type: 'round', s, center: rn.center, blocks, depthRows: nf };
    } else if (kind === 'front' && isV) {
      const nv = rowsOf(d.vDepth);
      const s = totalRows - nv + 1;
      const odd = neckSts % 2 === 1;
      const fs = Math.floor(neckSts / 2);
      const mid = Math.floor(W / 2);
      if (odd) splits[s] = { a: Math.round(centerCol), b: Math.round(centerCol) };
      else splits[s] = { a: mid, b: mid - 1 }; // 0코 덮어씌우기
      const H = nv - 6;
      let iv = distribute(H, fs);
      if (iv.reduce((a, x) => a + x, 0) > H) warn('V넥 깊이에 비해 줄일 코가 많습니다. V넥 깊이를 늘리세요.');
      const blocks = iv.map(len => ({ len, amt: 1, kind: 'dec' }));
      addEvents(ops, blocksToEvents(s + 2, blocks, 'dec'), [{ seg: 'L', edge: 'right' }, { seg: 'R', edge: 'left' }]);
      info.neck = { type: 'v', s, center: odd ? 1 : 0, blocks, depthRows: nv };
    } else if (half) {
      const neckRows = isV ? rowsOf(d.vDepth) : rowsOf(d.frontNeckD);
      const s = totalRows - neckRows + 1;
      let blocks;
      if (isV) {
        const H = neckRows - 6;
        const iv = distribute(H, neckSts);
        if (iv.reduce((a, x) => a + x, 0) > H) warn('V넥 깊이에 비해 줄일 코가 많습니다. V넥 깊이를 늘리세요.');
        blocks = iv.map(len => ({ len, amt: 1, kind: 'dec' }));
        addEvents(ops, blocksToEvents(s, blocks, 'dec'), centerEdge);
      } else {
        const maxEv = Math.max(2, Math.floor((neckRows - 4) / 2));
        const ch = Math.max(2, Math.round(neckSts * 0.34));
        const amts = [ch, ...neckSide(neckSts - ch, maxEv - 1)];
        blocks = amts.map(x => ({ len: 2, amt: x, kind: x >= 2 ? 'bo' : 'dec' }));
        addEvents(ops, blocksToEvents(s, blocks, 'dec'), centerEdge);
      }
      info.neck = { type: isV ? 'v-half' : 'round-half', s, blocks, depthRows: neckRows };
    }
    const sim = simulate(W, l0, l0 + Nh - 1, totalRows, ops, splits);
    if (sim.left) warn(`${name}: 마지막 단 뒤에 ${sim.left}코가 남습니다. 치수를 확인하세요.`);
    // 무늬 배치
    const placements = [];
    let x = Math.round((W - lay.panelW) / 2);
    lay.blocks.forEach(bk => {
      if (bk.type === 'motif') placements.push({ kind: 'motif', x0: x, w: bk.w, y0: ribRows + 1, ex: expandMotif(bk.motif), motif: bk.motif });
      else placements.push({ kind: bk.type, x0: x, w: bk.w, y0: ribRows + 1 });
      x += bk.w;
    });
    const pc = { id, name, W, rows: sim.rows, marks: sim.marks, ribRows, ribType: pat.rib, bg: pat.bg, placements, lay, info, kind };
    fillPiece(pc);
    return pc;
  }

  const back = makeBody('back', '뒤판', layBack, 'back');
  pieces.push(back);
  if (isCard) {
    pieces.push(makeBody('rfront', '오른앞판', layOne, 'rfront'));
    const lay2 = { blocks: layOne.blocks.map(bk => bk.type === 'motif' ? { ...bk, motif: mirrorMotif(bk.motif) } : bk), panelW: layOne.panelW, cableSts: layOne.cableSts };
    pieces.push(makeBody('lfront', '왼앞판', lay2, 'lfront'));
  } else {
    pieces.push(makeBody('front', '앞판', layFront, 'front'));
  }

  // 진동 둘레 (뒤판 오른쪽 가장자리, 진동 시작 ~ 어깨 경사 시작)
  const ahLen = edgeLen(back.rows, ahStart, shStart - 1, 'right', gs, gr);

  /* ===== 소매 ===== */
  const cuffRows = rowsOf(d.cuffH);
  const Ncuff = stsFor(T.wrist, laySleeve, gs, dens);
  let upperCm = T.upper, sleeveLen = T.armLen;
  const bodyChestCm = cmFor(back.info.Nc, layBack, gs, dens);
  const shoulderCm = isDrop ? bodyChestCm : cmFor(NshBack, layBack, gs, dens);
  if (isDrop) {
    const ahCm = ahRows / gr;
    if (2 * ahCm < T.upper) warn('드롭숄더 진동깊이 x 2가 위팔둘레(여유 포함)보다 작습니다. 진동깊이를 늘리세요.');
    upperCm = 2 * ahCm;
    sleeveLen = T.armLen - (bodyChestCm - T.shoulder) / 2;
  }
  let Nup = stsFor(upperCm, laySleeve, gs, dens);
  if ((Nup - Ncuff) % 2) Nup++;
  if (Nup < Ncuff) warn('위팔둘레가 손목둘레보다 작게 계산되었습니다.');

  function sleeveBuild(capRows, capPlan) {
    const underRows = Math.max(4, rowsOf(sleeveLen) - capRows - cuffRows);
    const total = cuffRows + underRows + capRows;
    const W = Math.max(Nup, Ncuff);
    const l0 = (W - Ncuff) / 2;
    const ops = {};
    const di = (Nup - Ncuff) / 2;
    const F = Math.min(rowsOf(2), Math.max(0, underRows - 4));
    const H = Math.max(2, underRows - F - rowsOf(3));
    const iv = distribute(H, di);
    const incBlocks = iv.map(len => ({ len, amt: 1 }));
    addEvents(ops, blocksToEvents(cuffRows + 1 + F, incBlocks, 'inc'), [{ seg: 'main', edge: 'left' }, { seg: 'main', edge: 'right' }]);
    const capStart = cuffRows + underRows + 1;
    if (capPlan) addEvents(ops, blocksToEvents(capStart, capPlan, 'dec'), [{ seg: 'main', edge: 'left' }, { seg: 'main', edge: 'right' }]);
    const sim = simulate(W, l0, l0 + Ncuff - 1, total, ops, {});
    return { W, sim, total, underRows, capStart, incBlocks, F, H, ivOver: iv.reduce((a, x) => a + x, 0) > H };
  }
  function capPlanFor(hc) {
    const init = ahBlocks.filter(x => x.kind === 'bo').map(x => ({ ...x }));
    const initSum = init.reduce((a, x) => a + x.amt, 0);
    const topTarget = stsFor(d.capTop, laySleeve, gs, dens);
    const topSts = Nup - 2 * Math.floor((Nup - topTarget) / 2);
    const rem = (Nup - topSts) / 2 - initSum;
    if (rem < 0) return null;
    const Hc = hc - 2 * init.length - 2;
    const E = Math.floor(Hc / 2);
    if (E < 1) return null;
    let body;
    if (rem > E) { // 가파른 소매산: 일부를 2코 덮어씌우기로
      const amts = Array(E).fill(1);
      let extra = rem - E, i = 0;
      while (extra > 0) { const k = i % 2 === 0 ? Math.floor(i / 2) : E - 1 - Math.floor(i / 2); amts[k]++; extra--; i++; if (i > 4 * E) break; }
      if (extra > 0) return null;
      body = amts.map(a => ({ len: 2, amt: a, kind: a >= 2 ? 'bo' : 'dec' }));
    } else {
      const tail = rem >= 12 ? [2, 2] : rem >= 7 ? [2] : [];
      const md = rem - tail.reduce((a, x) => a + x, 0);
      const Hm = Hc - 2 * tail.length;
      const iv = distribute(Hm, md);
      const mid = iv.map(len => ({ len, amt: 1, kind: 'dec' }));
      const twos = mid.filter(x => x.len === 2), others = mid.filter(x => x.len !== 2);
      const half = Math.ceil(twos.length / 2);
      body = [...twos.slice(0, half), ...others, ...twos.slice(half), ...tail.map(a => ({ len: 2, amt: a, kind: 'bo' }))];
    }
    const blocks = [...init, ...body];
    const consumed = blocks.reduce((a, x) => a + x.len, 0);
    if (consumed > hc) return null;
    return { blocks, topSts };
  }

  let sleeve, capInfo = null;
  if (!isDrop) {
    const lo = Math.max(6, even(0.5 * ahRows)), hi = even(0.85 * ahRows);
    let best = null;
    for (let hc = lo; hc <= hi; hc += 2) {
      const cp = capPlanFor(hc); if (!cp) continue;
      const sb = sleeveBuild(hc, cp.blocks);
      const capEdge = edgeLen(sb.sim.rows, sb.capStart, sb.total, 'right', gs, gr);
      const topCm = cp.topSts / gs;
      const capTotal = 2 * capEdge + topCm;
      const armTotal = 2 * ahLen;
      const easeC = capTotal - armTotal;
      const score = Math.abs(easeC - 1.5) + Math.max(0, cp.blocks.filter(x => x.amt >= 2).length - 4) * 0.4;
      if (!best || score < best.score) best = { hc, cp, sb, capTotal, armTotal, easeC, score };
    }
    if (!best) {
      warn('소매산을 진동둘레에 맞출 수 없어 기본값으로 계산했습니다. 위팔둘레, 진동깊이, 소매산 윗폭을 확인하세요.');
      const hc = even(0.65 * ahRows);
      const sb = sleeveBuild(hc, null);
      sleeve = sb; capInfo = { hc, blocks: [], topSts: Nup, easeC: 0, capTotal: 0, armTotal: 2 * ahLen };
    } else {
      sleeve = best.sb; capInfo = { hc: best.hc, blocks: best.cp.blocks, topSts: best.cp.topSts, easeC: best.easeC, capTotal: best.capTotal, armTotal: best.armTotal };
    }
  } else {
    sleeve = sleeveBuild(0, null);
    capInfo = null;
  }
  if (capInfo && capInfo.blocks.length && capInfo.easeC > 3) warn(`소매산 둘레가 진동 둘레보다 ${fmt(capInfo.easeC)}cm 깁니다(권장 0~3cm). 위팔 여유를 줄이거나 진동깊이를 늘리면 소매산이 자연스러워집니다.`);
  if (capInfo && capInfo.blocks.length && capInfo.easeC < -0.5) warn(`소매산 둘레가 진동 둘레보다 ${fmt(-capInfo.easeC)}cm 짧습니다. 위팔 여유를 늘리거나 소매산 윗폭을 넓히세요.`);
  if (sleeve.ivOver) warn('소매 늘림 간격이 2단으로 촘촘합니다. 소매길이나 위팔 여유를 확인하세요.');
  const sPlacements = [];
  {
    let x = Math.round((sleeve.W - laySleeve.panelW) / 2);
    laySleeve.blocks.forEach(bk => {
      if (bk.type === 'motif') sPlacements.push({ kind: 'motif', x0: x, w: bk.w, y0: cuffRows + 1, ex: expandMotif(bk.motif), motif: bk.motif });
      else sPlacements.push({ kind: bk.type, x0: x, w: bk.w, y0: cuffRows + 1 });
      x += bk.w;
    });
  }
  const sleevePc = {
    id: 'sleeve', name: '소매 (2장)', W: sleeve.W, rows: sleeve.sim.rows, marks: sleeve.sim.marks, ribRows: cuffRows, ribType: pat.rib, bg: pat.bg,
    placements: sPlacements, lay: laySleeve, finalBo: true, kind: 'sleeve',
    info: { Ncuff, Nup, underRows: sleeve.underRows, capStart: sleeve.capStart, incBlocks: sleeve.incBlocks, F: sleeve.F, cap: capInfo, upperCm, sleeveLen }
  };
  fillPiece(sleevePc);
  pieces.push(sleevePc);

  /* ===== 완성 치수 ===== */
  const frontPc = pieces.find(p => p.kind === 'front' || p.kind === 'rfront');
  const finished = {
    chest: isCard ? bodyChestCm + 2 * cmFor(frontPc.info.Nc, frontPc.lay, gs, dens) + d.bandW : bodyChestCm + cmFor(frontPc.info.Nc, frontPc.lay, gs, dens),
    hem: isCard ? cmFor(back.info.Nh, layBack, gs, dens) + 2 * cmFor(frontPc.info.Nh, frontPc.lay, gs, dens) + d.bandW : cmFor(back.info.Nh, layBack, gs, dens) + cmFor(frontPc.info.Nh, frontPc.lay, gs, dens),
    length: totalRows / gr, armDepth: ahRows / gr, shoulder: shoulderCm,
    neckW: cmFor(NshBack, layBack, gs, dens) - 2 * shSts / gs,
    sleeveLen: sleeve.total / gr, upper: cmFor(Nup, laySleeve, gs, dens), cuff: cmFor(Ncuff, laySleeve, gs, dens),
    ribH: ribRows / gr, cuffH: cuffRows / gr,
  };

  /* ===== 넥밴드 / 앞단 ===== */
  function neckOpening(pc) {
    const nk = pc.info.neck; if (!nk) return 0;
    const lastL = pc.rows.length - 1;
    const Lside = edgeLen(pc.rows, nk.s + 1, lastL, 'right', gs, gr, segs => segs.find(s => s.name === 'L'));
    const Rside = edgeLen(pc.rows, nk.s + 1, lastL, 'left', gs, gr, segs => segs.find(s => s.name === 'R'));
    return Lside + Rside + (nk.center || 0) / gs;
  }
  let neckCirc;
  if (isCard) {
    const fr = pieces.find(p => p.kind === 'rfront');
    const frontNeck = edgeLen(fr.rows, fr.info.neck.s, fr.rows.length - 1, 'right', gs, gr) ;
    neckCirc = neckOpening(back) + 2 * frontNeck - 2 * shSts / gs * 0; // 앞판 목선
  } else neckCirc = neckOpening(back) + neckOpening(frontPc);
  const nbRows = rowsOf(d.neckbandH);
  const ribMult = pat.rib === '2x2' ? 4 : 2;
  let neckPick = Math.round(neckCirc * gs * 0.92 / ribMult) * ribMult;

  let band = null;
  if (isCard) {
    const fr = pieces.find(p => p.kind === 'rfront');
    const edgeCm = (fr.info.neck.s - 1) / gr;
    let pick = Math.round(edgeCm * gs * 0.9);
    if (pat.rib === '2x2') pick = Math.round((pick - 2) / 4) * 4 + 2; else pick = pick % 2 ? pick : pick + 1;
    const nb = Math.max(2, d.buttons || 6);
    const first = 3, last = pick - 3;
    const pos = Array.from({ length: nb }, (_, i) => Math.round(first + (last - first) * i / (nb - 1)));
    band = { edgeCm, pick, pos, rows: rowsOf(d.bandW), nb };
    if (!isV) neckPick = neckPick; // 넥밴드는 앞단 포함하여 줍기
  }

  /* ===== 실 사용량 ===== */
  let cells = 0;
  pieces.forEach(pc => { const mult = pc.kind === 'sleeve' ? 2 : 1; pc.codes.forEach(row => { if (row) row.forEach(v => { if (v) cells += mult; }); }); });
  cells += neckPick * nbRows + (band ? band.pick * band.rows * 2 : 0);
  const sw = P.gauge.swatchW;
  const gSw = P.gauge.unit === '10cm' ? P.gauge.st * P.gauge.row : P.gauge.st * P.gauge.row * 100;
  const yarnG = sw ? cells / gSw * sw * 1.08 : null;

  return {
    pieces, warnings: W_, T, finished, gs, gr, dens, ribRows, ahRows, totalRows, sideRows, ahStart, shStart, shSts, shParts, A, NshBack,
    ahLen, cuffRows, capInfo, neckPick, nbRows, neckCirc, band, yarnG, cells, layFull, layBack, laySleeve, layFront, isCard, isV, isDrop,
  };
}

/* ===================== 서술형 도안 ===================== */
function runsText(tokens, ws) {
  // tokens: 칸 기준 진행 순서 배열 (이미 읽는 방향 정렬)
  const out = []; let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (parseTok(t)) { out.push(crossName(t)); i++; continue; }
    let j = i; while (j < tokens.length && tokens[j] === t) j++;
    const n = j - i;
    const nm = ws ? (STITCH[t] ? STITCH[t].ws : t) : (STITCH[t] ? STITCH[t].name : t);
    out.push(n > 1 ? `${nm} ${n}코` : `${nm} 1코`);
    i = j;
  }
  return out.join(', ');
}
function motifRowsText(m) {
  return m.rows.map((row, i) => {
    const rs = i % 2 === 0;
    const seq = rs ? row.slice().reverse() : row.slice();
    return `${i + 1}단(${rs ? '겉면' : '안면'}): ${runsText(seq, !rs)}`;
  });
}
function blocksDesc(lay, bg) {
  // 겉면 1단 기준, 오른쪽부터
  const list = lay.blocks.slice().reverse().map(b => {
    if (b.type === 'motif') return `${b.motif._label || b.motif.name} ${b.w}코`;
    if (b.type === 'purl') return `안뜨기 ${b.w}코`;
    return `${BG_NAME[bg]} ${b.w}코`;
  });
  return list;
}

function buildText(P, C) {
  const out = []; // {t:'h1'|'h2'|'h3'|'p'|'li'|'note', s}
  const H1 = s => out.push({ t: 'h1', s }), H2 = s => out.push({ t: 'h2', s }), Pp = s => out.push({ t: 'p', s }), Li = s => out.push({ t: 'li', s }), Nt = s => out.push({ t: 'note', s });
  const g = P.gauge, d = P.design, pat = P.pattern;
  const gsTxt = `${fmt(C.gs * 10)}코 x ${fmt(C.gr * 10)}단 (10cm x 10cm, ${BG_NAME[pat.bg]})`;
  const cm = r => fmt(r / C.gr);
  const garmentName = (C.isCard ? '가디건' : '풀오버') + ', ' + (C.isV ? 'V넥' : '라운드넥') + ', ' + (C.isDrop ? '드롭숄더' : '셋인 슬리브');
  H1(P.name || '이름 없는 도안');
  Pp(`${garmentName}. 아래에서 위로 뜨는 조각 뜨기 방식이며, 각 조각을 뜬 뒤 꿰매어 완성합니다.`);

  H2('재료');
  Li(`실: ${g.yarn || '(실 이름 입력)'}${C.yarnG ? `, 약 ${Math.ceil(C.yarnG / 10) * 10}g` + (g.ballW ? ` (${g.ballW}g 볼 ${Math.ceil(C.yarnG / g.ballW)}개)` : '') : ''}`);
  Li(`바늘: 몸판 ${g.needle || '-'}mm 대바늘, 고무단 ${g.ribNeedle || '-'}mm 대바늘, 넥밴드용 ${g.ribNeedle || '-'}mm 줄바늘(40cm)`);
  const hasCable = C.pieces.some(p => p.codes.some(row => row && row.some(v => typeof v === 'string' && parseTok(v))));
  Li(`부자재: ${hasCable ? '꽈배기바늘, ' : ''}단수 링, 돗바늘${C.isCard ? `, 단추 ${C.band.nb}개 (지름 1.5cm 내외)` : ''}`);
  H2('게이지');
  Pp(`${gsTxt}. 반드시 게이지 스와치를 떠서 세탁, 건조 후 측정하세요. 게이지가 다르면 완성 치수가 달라집니다.${C.layFull.cableSts ? ` 꽈배기 무늬는 메리야스보다 폭이 줄어드는 비율 ${fmt(C.dens)}배를 적용해 코 수를 계산했습니다.` : ''}`);

  const f = C.finished;
  const n0 = out.length;
  H2('완성 치수');
  Li(`가슴둘레 ${fmt(f.chest)}cm, 밑단둘레 ${fmt(f.hem)}cm, 총장 ${fmt(f.length)}cm`);
  Li(`어깨너비 ${fmt(f.shoulder)}cm, 진동깊이 ${fmt(f.armDepth)}cm, 목너비 ${fmt(f.neckW)}cm`);
  Li(`소매길이 ${fmt(f.sleeveLen)}cm, 소매통(위팔) ${fmt(f.upper)}cm, 소맷부리 ${fmt(f.cuff)}cm`);
  for (let i = n0; i < out.length; i++) out[i].sec = 'fin';

  H2('읽는 법');
  Pp('차트는 겉면에서 본 모양입니다. 홀수 단(겉면)은 오른쪽에서 왼쪽으로, 짝수 단(안면)은 왼쪽에서 오른쪽으로 읽으며 안면에서는 기호의 반대 코(겉뜨기는 안뜨기로)를 뜹니다.');
  Pp('줄임, 늘림 표기 "단-코-회"는 해당 단수마다 몇 코씩 몇 회 하는지를 뜻합니다. 예: 2-1-4는 2단마다 1코씩 4회. 각 구간의 첫 겉면 단에서 실행합니다. 2코 이상은 덮어씌우기, 1코는 겹치기(가장자리 1코 안쪽)로 합니다.');
  Pp('덮어씌우기는 단의 시작에서만 할 수 있으므로, 오른쪽 가장자리는 겉면 단에서, 왼쪽 가장자리는 다음 안면 단에서 합니다.');

  // 무늬 설명
  const usedMotifs = [];
  C.pieces.forEach(pc => pc.placements.slice().reverse().forEach(p => { if (p.kind === 'motif' && !usedMotifs.find(m => m.id === p.motif.id)) usedMotifs.push(p.motif); }));
  if (usedMotifs.length) {
    H2('무늬');
    usedMotifs.forEach((m, i) => {
      m._label = `무늬 ${String.fromCharCode(65 + i)}`;
      const ex = expandMotif(m);
      out.push({ t: 'h3', s: `${m._label}: ${m.name} (${ex.w}코 ${ex.h}단 반복)` });
      motifRowsText(m).forEach(s => Li(s));
    });
    C.pieces.forEach(pc => pc.placements.forEach(p => { if (p.kind === 'motif') { const u = usedMotifs.find(m => m.id === p.motif.id); if (u) p.motif._label = u._label; } }));
  }

  // 조각
  const ribName = RIB_NAME[pat.rib];
  C.pieces.forEach(pc => {
    H2(pc.name);
    const info = pc.info;
    const isSleeve = pc.kind === 'sleeve';
    const startN = isSleeve ? info.Ncuff : info.Nh;
    const ribR = pc.ribRows;
    Pp(`${g.ribNeedle || ''}mm 바늘로 일반코잡기 ${startN}코를 잡습니다. 가장자리 1코씩은 꿰매기용 코로 늘 겉뜨기합니다. ${ribName}로 ${cm(ribR)}cm(${ribR}단)를 뜹니다.`);
    if (pc.lay.panelW) Pp(`${g.needle || ''}mm 바늘로 바꾸어 다음 배치로 뜹니다 (겉면, 오른쪽부터): 가장자리 1코, ${BG_NAME[pat.bg]} ${(startN - pc.lay.panelW - 2) / 2}코, ${blocksDesc(pc.lay, pat.bg).join(', ')}, ${BG_NAME[pat.bg]} ${(startN - pc.lay.panelW - 2) / 2}코, 가장자리 1코.`);
    else Pp(`${g.needle || ''}mm 바늘로 바꾸어 가장자리 1코, ${BG_NAME[pat.bg]} ${startN - 2}코, 가장자리 1코로 뜹니다.`);
    if (!isSleeve) {
      const ss = info.side;
      if (ss && ss.blocks.length) Pp(`옆선: 고무단 위로 평 ${ss.F}단을 뜬 뒤 ${pc.kind === 'rfront' || pc.kind === 'lfront' ? '옆선 쪽에서' : '양쪽에서'} ${notation(ss.blocks)} ${ss.kind === 'inc' ? '늘립니다' : '줄입니다'} (${ss.n}코씩). ${ss.kind === 'inc' ? '늘린 코는 바탕무늬로 뜹니다.' : ''}`);
      Pp(`고무단 위로 ${cm(C.sideRows)}cm(${C.sideRows}단)까지 뜨면 ${info.Nc}코가 됩니다. 단수 링을 겁니다.`);
      if (C.A > 0) Pp(`진동: ${pc.kind === 'rfront' ? '왼쪽(옆선 쪽) 가장자리에서' : pc.kind === 'lfront' ? '오른쪽(옆선 쪽) 가장자리에서' : '양쪽에서'} ${notation(info.ahBlocks)} 줄입니다 (${C.A}코씩). ${pc.kind === 'rfront' || pc.kind === 'lfront' ? '' : `남은 코는 ${info.Nsh}코입니다.`}`);
      else Pp('드롭숄더이므로 진동 줄임 없이 곧게 뜹니다. 소매 달 위치에 단수 링을 겁니다.');
      const nk = info.neck;
      if (nk && nk.type === 'back') Pp(`뒷목: 총장까지 ${cm(nk.depthRows)}cm(${nk.depthRows}단) 남은 ${nk.s}단째(겉면)에서 중앙 ${nk.center}코를 덮어씌우고 좌우를 나누어 뜹니다. 목 쪽에서 ${notation(nk.blocks)} 줄입니다.`);
      if (nk && nk.type === 'round') Pp(`앞목: ${nk.s}단째(겉면, 총장까지 ${cm(nk.depthRows)}cm)에서 중앙 ${nk.center}코를 덮어씌우고 좌우를 나누어 뜹니다. 목 쪽에서 ${notation(nk.blocks)} 줄인 뒤 어깨까지 곧게 뜹니다. 한쪽을 먼저 끝내고 반대쪽에 실을 새로 이어 대칭으로 뜹니다.`);
      if (nk && nk.type === 'v') Pp(`V넥: ${nk.s}단째(겉면, 총장까지 ${cm(nk.depthRows)}cm)에서 ${nk.center ? '중앙 1코를 덮어씌우고' : '중앙에서'} 좌우로 나눕니다. 평 2단 후 목 쪽에서 ${notation(nk.blocks)} 줄입니다 (가장자리 1코 안쪽에서 겹치기).`);
      if (nk && nk.type === 'round-half') Pp(`앞목: ${nk.s}단째부터 앞중심 쪽에서 ${notation(nk.blocks)} 줄입니다.`);
      if (nk && nk.type === 'v-half') Pp(`V넥: ${nk.s}단째부터 앞중심 쪽에서 ${notation(nk.blocks)} 줄입니다.`);
      const shTxt = notation(info.shBlocks);
      if (P.design.shoulderMethod === 'sr') Pp(`어깨: ${C.shStart}단째부터 어깨 쪽에서 ${shTxt} 되돌아뜨기를 합니다. 마지막 단에서 남긴 코를 모두 정리해 뜬 뒤 어깨 ${C.shSts}코는 쉼코로 둡니다 (앞뒤 어깨는 빼뜨기 잇기).`);
      else Pp(`어깨: ${C.shStart}단째부터 어깨 쪽에서 ${shTxt} 계단식으로 덮어씌웁니다 (어깨 ${C.shSts}코).`);
      Pp(`총 ${pc.total}단, 총장 ${cm(pc.total)}cm.`);
    } else {
      const ib = info.incBlocks;
      Pp(`소매 늘림: 소맷부리 위로 평 ${info.F}단을 뜬 뒤 양쪽에서 ${notation(ib)} 늘립니다. ${info.Nup}코가 됩니다. 늘린 코는 바탕무늬로 뜹니다.`);
      Pp(`소맷부리 위로 ${cm(info.underRows)}cm(${info.underRows}단)까지 뜹니다.`);
      if (info.cap) Pp(`소매산: 양쪽에서 ${notation(info.cap.blocks)} 줄인 뒤 남은 ${info.cap.topSts}코를 모두 덮어씌웁니다. 소매산 높이 ${cm(info.cap.hc)}cm(${info.cap.hc}단).`);
      else Pp(`드롭숄더이므로 소매산 없이 ${info.Nup}코를 모두 덮어씌웁니다.`);
      Pp(`총 ${pc.total}단. 같은 것을 2장 뜹니다.`);
    }
  });

  H2('마무리');
  Li(P.design.shoulderMethod === 'sr' ? '앞판과 뒤판의 어깨 쉼코를 겉끼리 마주 대고 빼뜨기로 잇습니다.' : '앞판과 뒤판의 어깨를 떠서 꿰매기로 잇습니다.');
  if (C.isCard) {
    const b = C.band;
    Li(`넥밴드: ${g.ribNeedle || ''}mm 바늘로 앞중심 끝부터 목둘레를 따라 약 ${C.neckPick}코를 주워 ${ribName}로 ${cm(C.nbRows)}cm(${C.nbRows}단)를 뜨고 고무뜨기 덮어씌우기를 합니다.`);
    Li(`앞단: 앞판 가장자리(밑단부터 넥밴드 끝까지)에서 ${b.pick}코를 주워 ${ribName}로 ${cm(b.rows)}cm(${b.rows}단)를 뜹니다. 단추 구멍 쪽 앞단(여성용은 오른앞판)은 ${Math.max(1, Math.floor(b.rows / 2))}단째에 아래에서부터 ${b.pos.join(', ')}번째 코 위치에 바늘비우기와 왼코 겹치기로 단추 구멍 ${b.nb}개를 냅니다.`);
  } else if (C.isV) {
    Li(`넥밴드: 왼쪽 어깨에서 시작해 목둘레를 따라 약 ${C.neckPick}코를 원통으로 줍고, V 중심 1코에 단수 링을 겁니다. ${ribName}로 뜨면서 매 단 V 중심에서 중심 3코 모아뜨기로 줄여 ${cm(C.nbRows)}cm(${C.nbRows}단)를 뜬 뒤 고무뜨기 덮어씌우기를 합니다.`);
  } else {
    Li(`넥밴드: ${g.ribNeedle || ''}mm 줄바늘로 목둘레를 따라 약 ${C.neckPick}코를 원통으로 주워 ${ribName}로 ${cm(C.nbRows)}cm(${C.nbRows}단)를 뜬 뒤 고무뜨기 덮어씌우기를 합니다. 접어서 꿰매는 이중 넥밴드는 2배 길이로 뜹니다.`);
  }
  Li(C.isDrop ? '소매 중심을 어깨 이음선에 맞추고, 몸판의 단수 링 사이에 소매 윗선을 꿰매어 답니다.' : '소매산 중심을 어깨 이음선에 맞추고 진동 둘레에 고르게 배분하며 소매를 답니다.');
  Li('옆선과 소매 밑선을 가장자리 1코 안쪽에서 떠서 꿰매기(매트리스 스티치)로 잇습니다.');
  Li('실 끝을 정리하고 완성 치수에 맞춰 블로킹합니다.');
  return out;
}

if (typeof module !== 'undefined') module.exports = { compute, buildText, BUILTIN_MOTIFS, expandMotif, motifCheck, parseTok, symName, crossHow, STITCH, notation, mirrorMotif, motifRowsText, tokW, fmt };
