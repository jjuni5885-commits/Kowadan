'use strict';
/* ===================== 코와단 도안 엔진 ===================== */
const even = x => 2 * Math.round(x / 2);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const r1 = x => Math.round(x * 10) / 10;
const fmt = x => { if (x == null || !isFinite(x)) return '-'; const v = r1(x); return Number.isInteger(v) ? String(v) : v.toFixed(1); };

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
  ds: { name: '독일식 되돌아뜨기(더블 스티치)', ws: '독일식 되돌아뜨기(더블 스티치)', how: '편물을 돌린 뒤 실을 앞에 두고 첫 코를 안뜨기 방향으로 옮기고, 실을 뒤로 당겨 코의 두 다리가 바늘에 걸린 더블 스티치를 만듭니다. 다음에 이 코를 지날 때 두 다리를 한 코처럼 함께 뜹니다.' },
  pu: { name: '코 줍기', ws: '코 줍기', how: '이웃 조각의 가장자리(코잡기 가장자리)에서 바늘을 넣어 실을 걸어 빼내 새 코를 만듭니다.' },
  co: { name: '감아코(코 만들기)', ws: '감아코(코 만들기)', how: '오른바늘에 실을 감아 고리를 걸어 새 코를 만듭니다. 여러 코를 만들 때는 단 시작에서 손가락 걸어 코잡기(케이블 코잡기)로 해도 됩니다.' },
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
function fitBlocks(H, n) { // H단 안에 n코. 2단마다 1코로 모자라면 앞쪽 일부를 2코씩
  if (n <= 0) return [];
  const E = Math.max(1, Math.floor(H / 2));
  if (n <= E) return distribute(H, n).map(len => ({ len, amt: 1 }));
  const amts = Array(E).fill(1); let extra = n - E, i = 0;
  while (extra > 0) { amts[i % E]++; extra--; i++; }
  return amts.map(a => ({ len: 2, amt: a }));
}
function vBlocks(H, n) { return fitBlocks(H, n).map(b => ({ ...b, kind: b.amt >= 2 ? 'bo' : 'dec' })); }
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
    const x = a.pop(); // 뺀 횟수의 코를 앞쪽에 하나씩 되돌려 합계 유지
    for (let t = 0; t < x; t++) {
      let k = 0;
      for (let i = 1; i < a.length; i++) if (a[i] < a[i - 1]) { k = i; break; }
      a[k]++;
    }
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

// 꿰매는 선 길이 (cm): 2단 간격으로 이어 계단 모양을 매끈한 선으로 봄. 진동둘레와 소매산 비교용
function seamLen(rows, from, to, side, gs, gr) {
  const pos = r => { const segs = rows[r]; if (!segs || !segs.length) return null; const s = side === 'right' ? segs[segs.length - 1] : segs[0]; return side === 'right' ? s.r + 1 : s.l; };
  const pts = [];
  for (let r = from; r <= to; r += 2) { const p = pos(r); if (p === null) break; pts.push([r, p]); }
  const pl = pos(to); if (pl !== null && (!pts.length || pts[pts.length - 1][0] !== to)) pts.push([to, pl]);
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot((pts[i][1] - pts[i - 1][1]) / gs, (pts[i][0] - pts[i - 1][0]) / gr);
  return len + 1 / gr;
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
  if (type === 'seed') return (r + c) % 2 === 0 ? 'k' : 'p'; // 1코 1단 멍석: 매 단 엇갈림
  if (type === 'seed12') return (Math.floor((r - 1) / 2) + c) % 2 === 0 ? 'k' : 'p'; // 1코 2단 멍석: 2단마다 엇갈림
  if (type === 'seed22') return (Math.floor((r - 1) / 2) + Math.floor(c / 2)) % 2 === 0 ? 'k' : 'p'; // 2코 2단 멍석
  if (type === 'garter') return r % 2 === 1 ? 'k' : 'p';
  return 'k';
}
const BG_NAME = { st: '메리야스뜨기', rev: '안메리야스뜨기', seed: '1코 1단 멍석뜨기', seed12: '1코 2단 멍석뜨기', seed22: '2코 2단 멍석뜨기', garter: '가터뜨기' };
const RIB_NAME = { '1x1': '1코 고무뜨기', '2x2': '2코 고무뜨기', '1x1t': '1코 꼬아 고무뜨기', garter: '가터뜨기' };

/* ---------- 조각 -> 칸 코드 ---------- */
function fillPiece(pc, opt) {
  const { W, rows, marks, ribRows, ribType, bg, placements, finalBo } = pc;
  const total = rows.length - 1;
  const codes = [];
  const center = (W - 1) / 2;
  // 고무단: 바텀업은 처음 ribRows단, 탑다운(ribEnd)은 마지막 ribRows단
  const isRib = r => pc.ribEnd ? r > total - ribRows : r <= ribRows;
  const rr0 = pc.ribEnd ? total : 1;
  const first = rows[rr0] ? rows[rr0][0] : { l: 0, r: W - 1 };
  const ribCenter = rows[rr0] ? (first.l + rows[rr0][rows[rr0].length - 1].r) / 2 : (W - 1) / 2;
  const ribOdd = rows[rr0] ? ((rows[rr0][rows[rr0].length - 1].r - first.l + 1) % 2) === 1 : W % 2 === 1;
  for (let r = 1; r <= total; r++) {
    const row = Array(W).fill(null);
    (rows[r] || []).forEach(s => {
      for (let c = s.l; c <= s.r; c++) {
        let code;
        const edge = c === s.l || c === s.r;
        if (isRib(r)) code = edge ? 'k' : ribCode(ribType, c, ribCenter, ribOdd, r);
        else if (edge) code = 'k';
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
        let ok = v.j === 0 && (r % 2 === 1 || (pc.roundFrom && r >= pc.roundFrom));
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
  // 입력 범위 확인 (오타, 단위 착오 잡기)
  const RANGE = { chest: ['가슴둘레', 40, 170], hip: ['엉덩이둘레', 40, 180], shoulder: ['어깨너비', 20, 60], armDepth: ['진동깊이', 9, 30], neckW: ['목너비', 8, 25], armLen: ['팔길이', 20, 80], upperArm: ['위팔둘레', 12, 55], wrist: ['손목둘레', 8, 28] };
  Object.keys(RANGE).forEach(k => { const [n, lo, hi] = RANGE[k], v = P.body[k]; if (v < lo || v > hi) warn(`${n} ${v}cm가 보통 범위(${lo}~${hi}cm)를 벗어납니다. 입력을 확인하세요.`); });
  if (P.design.length < 25 || P.design.length > 100) warn(`총장 ${P.design.length}cm가 보통 범위(25~100cm)를 벗어납니다. 입력을 확인하세요.`);
  if (gs * 10 < 8 || gs * 10 > 45) warn(`게이지 코 수(10cm에 ${r1(gs * 10)}코)가 보통 범위(8~45코)를 벗어납니다. 게이지 단위(1cm/10cm)를 확인하세요.`);
  if (gr < gs * 0.9) warn('게이지 단 수가 코 수보다 적습니다. 코와 단을 바꿔 넣지 않았는지 확인하세요.');
  if (P.gauge.dens && (P.gauge.dens < 1 || P.gauge.dens > 1.5)) warn(`꽈배기 수축 비율 ${P.gauge.dens}배는 보통 범위(1.0~1.5배)를 벗어납니다.`);

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

  if (P.sleeve === 'raglan') return computeRaglan();
  if (P.sleeve === 'coco') return computeCoco();
  /* ===== 탑다운 공통 ===== */
    // 늘림 배분: 몸판은 첫 단부터 2단마다(모자라면 매 단), 소매는 몸판 늘림 구간에 고르게
  function tdBlocks(H, n) {
    if (n <= 0) return [];
    if (2 * n <= H) return Array(n).fill(2).map(len => ({ len, amt: 1 }));
    if (n <= H) { const a = 2 * n - H, b = H - n; return [...Array(a).fill(1), ...Array(b).fill(2)].map(len => ({ len, amt: 1 })); }
    warn('래글런 늘림이 요크 단수보다 많아 한 단에 2코씩 늘리는 곳이 있습니다. 진동깊이를 늘리거나 여유를 줄이세요.');
    const amts = Array(H).fill(1); let x = n - H, i = 0; while (x > 0) { amts[i % H]++; x--; i++; }
    return amts.map(a => ({ len: 1, amt: a }));
  }
  function simTD(W, init, total, ops, joins) {
    let segs = JSON.parse(JSON.stringify(init)), joined = !segs.L;
    const rows = [], marks = new Map(); const mk = (r, c, code) => marks.set(r * 10000 + c, code);
    const res = o => joined ? segs.main : segs[o.seg === 'main' ? (o.edge === 'left' ? 'L' : 'R') : o.seg];
    for (let r = 1; r <= total; r++) {
      if (joins[r] && !joined) { const L = segs.L, R_ = segs.R; for (let c = L.r + 1; c < R_.l; c++) mk(r, c, 'co'); segs = { main: { l: L.l, r: R_.r } }; joined = true; }
      const ro = ops[r] || [];
      ro.filter(o => o.type === 'inc' || o.type === 'co' || o.type === 'pu').forEach(o => {
        const s = res(o); if (!s) return;
        for (let i = 0; i < o.n; i++) {
          if (o.type === 'inc') { if (o.edge === 'left') { s.l--; mk(r, s.l + 1, 'm1l'); } else { s.r++; mk(r, s.r - 1, 'm1r'); } }
          else { if (o.edge === 'left') { s.l--; mk(r, s.l, o.type); } else { s.r++; mk(r, s.r, o.type); } }
        }
      });
      rows[r] = Object.entries(segs).filter(([, s]) => s.l <= s.r).map(([k, s]) => ({ name: k, l: s.l, r: s.r }));
      const after = [];
      ro.filter(o => o.type === 'dec').forEach(o => {
        const s = res(o); if (!s) return;
        if (o.edge === 'left') { mk(r, Math.min(s.l + 1, s.r), 'k2tog'); after.push(() => { s.l += 1; }); }
        else { mk(r, Math.max(s.r - 1, s.l), 'ssk'); after.push(() => { s.r -= 1; }); }
      });
      after.forEach(f => f());
    }
    return { rows, marks };
  }
  function place(W, lay, y0) { const out = []; let x = Math.round((W - lay.panelW) / 2); lay.blocks.forEach(bk => { if (bk.type === 'motif') out.push({ kind: 'motif', x0: x, w: bk.w, y0, ex: expandMotif(bk.motif), motif: bk.motif }); else out.push({ kind: bk.type, x0: x, w: bk.w, y0 }); x += bk.w; }); return out; }
  function mkPiece(o) { const pc = { ribRows: 0, ribType: pat.rib, bg: pat.bg, td: true, ...o }; fillPiece(pc); return pc; }

  /* --- 몸판: 겨드랑이 코를 만들고 아래로. 옆선 늘림/줄임, 끝에 고무단 --- */
  function bodyTD(id, name, kind, lay, Wsep, Nc, Nh, sides, y0, u, bodyRows) {
    const sideRowsTD = bodyRows - ribRows;
    // sides: 겨드랑이(옆선) 가장자리 ['left','right'] 중
    const W = Math.max(Nc, Nh);
    const ops = {};
    const cu = u / 2;
    const l0 = (W - Nc) / 2 + (sides.includes('left') ? cu : 0);
    (ops[1] = ops[1] || []);
    sides.forEach(sd => ops[1].push({ seg: 'main', edge: sd, type: 'co', n: cu }));
    const dd = sides.length === 2 ? (Nh - Nc) / 2 : Nh - Nc;
    let shp = null;
    if (dd) {
      const top = Math.min(rowsOf(3), Math.max(0, sideRowsTD - 6));
      let F = Math.min(rowsOf(4), Math.max(0, sideRowsTD - top - 4));
      let H = Math.max(2, sideRowsTD - top - F);
      if (2 * Math.abs(dd) > H) { F = 0; H = Math.max(2, sideRowsTD - top - 2); }
      const blocks = fitBlocks(H, Math.abs(dd)).reverse();
      if (blocks.some(x => x.amt >= 2)) warn(`${name}: 가슴과 밑단 폭 차이가 커서 옆선에서 2코씩 ${dd > 0 ? '늘리는' : '줄이는'} 단이 있습니다.`);
      let r = top + 1;
      blocks.forEach(b => { sides.forEach(sd => (ops[r] = ops[r] || []).push({ seg: 'main', edge: sd, type: dd > 0 ? (b.amt >= 2 ? 'co' : 'inc') : 'dec', n: b.amt })); r += b.len; });
      shp = { blocks, top, F, kind: dd > 0 ? 'inc' : 'dec', n: Math.abs(dd) };
      // 2코 이상 줄임은 겹치기 2번
      if (dd < 0) Object.keys(ops).forEach(k => { ops[k] = ops[k].flatMap(o => o.type === 'dec' && o.n > 1 ? Array(o.n).fill({ ...o, n: 1 }) : [o]); });
    }
    const sim = simTD(W, { main: { l: Math.round(l0), r: Math.round(l0) + Wsep - 1 } }, bodyRows, ops, {});
    return mkPiece({ id, name, kind, W, rows: sim.rows, marks: sim.marks, placements: place(W, lay, y0), lay, ribRows, ribEnd: true, finalBo: true, roundFrom: isCard ? 0 : 1,
      info: { Nh: Wsep, Nc, NhEnd: Nh, side: shp, cu } });
  }
  /* --- 소매: 쉼코 + 겨드랑이 코를 원통으로, 소맷부리 쪽으로 줄임 --- */
  function sleeveTD(Y, u, Nup, Ncuff, Ssep) {
  const cuffRows = rowsOf(d.cuffH);
  const sleeveLen = Math.max(T.armLen * 0.4, T.armLen - 0.55 * T.armDepth);
  const sRows = Math.max(cuffRows + 8, rowsOf(sleeveLen));
  return (() => {
    const W = Nup, ops = {}, cu = u / 2;
    ops[1] = [{ seg: 'main', edge: 'left', type: 'co', n: cu }, { seg: 'main', edge: 'right', type: 'co', n: cu }];
    const di = (Nup - Ncuff) / 2;
    const under = sRows - cuffRows;
    const top = Math.min(rowsOf(3), Math.max(0, under - 6));
    let F = Math.min(rowsOf(2), Math.max(0, under - top - 4));
    let H = Math.max(2, under - top - F);
    if (2 * di > H) { F = 0; H = Math.max(2, under - top - 2); }
    const blocks = fitBlocks(H, di).reverse();
    if (blocks.some(x => x.amt >= 2)) warn('소매 줄임이 촘촘해 한 단에 2코 줄이는 곳이 있습니다. 소매길이나 위팔 여유를 확인하세요.');
    let r = top + 1;
    blocks.forEach(b => { for (let k = 0; k < b.amt; k++) ['left', 'right'].forEach(sd => (ops[r] = ops[r] || []).push({ seg: 'main', edge: sd, type: 'dec', n: 1 })); r += b.len; });
    const sim = simTD(W, { main: { l: cu, r: cu + Ssep - 1 } }, sRows, ops, {});
    return mkPiece({ id: 'sleeve', name: '소매 (2장)', kind: 'tsleeve', mult: 2, W, rows: sim.rows, marks: sim.marks, placements: place(W, laySleeve, 1 - Y), lay: laySleeve, ribRows: cuffRows, ribEnd: true, finalBo: true, roundFrom: 1,
      info: { Nh: Ssep, Nup, Ncuff, decBlocks: blocks, top, under, cu, sRows, cuffRows, sleeveLen } });
  })();
  }

  /* ===== 탑다운 코코닛츠 메소드 (셋인형) =====
   1) 뒷목+어깨 코잡기, 어깨 경사(독일식 되돌아뜨기 또는 코늘림=계단식 코 만들기), 진동 윗부분까지 뒤판
   2) 뒤판 어깨에서 앞판 코 줍기, 같은 경사, 앞목 늘림(풀오버는 앞중심 코 만들어 잇기), 뒤판과 같은 단까지
   3) 진동 가장자리에서 소매 코 줍기, 앞판+소매+뒤판+소매를 한 바늘에 요크: 몸판 진동 늘림, 소매산 늘림
   4) 겨드랑이에서 나누기 (래글런과 같음) */
  function computeCoco() {
    const ah = rowsOf(T.armDepth);
    const backTotal = Math.max(ah + ribRows + 10, rowsOf(T.length));
    const bodyRows = backTotal - ah;
    const front0 = bodyPlan(layFront, isCard ? 0.5 : 1), back0 = bodyPlan(layBack, 1);
    const Fc = front0.Nc, Bc = back0.Nc;
    let NshB = Math.min(Bc, stsFor(T.shoulder, layBack, gs, dens));
    if ((Bc - NshB) % 2) NshB--;
    const A = (Bc - NshB) / 2; // 몸판 진동 한쪽 늘림 합계
    const b0 = A >= 4 ? clamp(Math.round(A * 0.4), 2, 6) : A; // 겨드랑이 코 만들기(한쪽). 어깨가 가슴만큼 넓으면 0
    const u = 2 * b0;
    const nA = A - b0;
    let neckB = Math.max(6, Math.round(T.neckW * gs)); if ((NshB - neckB) % 2) neckB++;
    const shSts = (NshB - neckB) / 2;
    if (shSts < 3) warn('어깨 코가 너무 적습니다. 어깨너비나 목너비를 확인하세요.');
    const steps = shSts >= 2 ? clamp(Math.round(rowsOf(d.shoulderDrop) / 2), 1, Math.min(4, shSts - 1)) : 0;
    const parts = Array.from({ length: steps + 1 }, (_, i) => Math.floor(shSts / (steps + 1)) + (i < shSts % (steps + 1) ? 1 : 0)); // 바깥쪽부터
    const leave = j => parts.slice(0, j).reduce((a, x) => a + x, 0);
    const slopeRows = 2 * steps + 2;
    const gsr = d.cocoSlope !== 'inc';
    let Nup = stsFor(T.upper, laySleeve, gs, dens);
    const Ncuff = stsFor(T.wrist, laySleeve, gs, dens);
    if (Nup < Ncuff) { warn('위팔둘레가 손목둘레보다 작아 소매를 줄임 없이 곧게 뜹니다.'); Nup = Ncuff; }
    if ((Nup - Ncuff) % 2) Nup++;
    const Ssep = Nup - u;
    // 진동 윗부분(어깨에서 소매 줍는 곳까지) 단수: 소매산 늘림이 요크 단수에 알맞게 들어가는 값
    let best = null;
    for (let Hu = Math.max(slopeRows + 4, even(0.3 * ah)); Hu <= even(0.7 * ah); Hu += 2) {
      const Hy = ah - Hu; if (Hy < 6) continue;
      const edgeRows = Hu - 2 * steps;
      let half = Math.max(2, Math.round(edgeRows * gs / gr));
      const Spick = 2 * half;
      const nS = (Ssep - Spick) / 2;
      if (nS < 0 || nS % 1) continue;
      const score = Math.abs(2 * nS - (Hy - 2)) + (nS > Hy - 2 ? 50 : 0) + (2 * nA > Hy - 2 ? 50 : 0);
      if (!best || score < best.score) best = { Hu, Hy, Spick, nS, score };
    }
    if (!best) { // 소매 줍는 코가 위팔보다 많으면 줍는 비율을 낮춤
      const Hu = even(0.5 * ah), Hy = ah - Hu; const Spick = Ssep - 2 * Math.max(0, Math.floor((Ssep - 4) / 2) - Math.floor(Hy / 2) + 1 > 0 ? Math.floor(Hy / 2) - 1 : Math.floor((Ssep - 4) / 2));
      best = { Hu, Hy, Spick: Math.max(4, Spick - (Spick % 2)), nS: 0 }; best.nS = (Ssep - best.Spick) / 2;
      warn('소매산 줍는 코 수를 맞추기 어려워 줍는 비율을 낮췄습니다. 위팔 여유와 진동깊이를 확인하세요.');
    }
    const { Hu, Hy, Spick, nS } = best;
    if (nS > Hy - 2) warn('소매산 늘림이 촘촘해 2코씩 늘리는 단이 있습니다. 위팔 여유를 줄이거나 진동깊이를 늘리세요.');
    // 늘림 배치: 양 끝(위, 아래)은 2단마다, 가운데는 4단마다. 촘촘하면 매 단
    const spread = (H, n) => {
      if (n <= 0) return [];
      if (2 * n > H) return tdBlocks(H, n);
      const iv = distribute(H, n), twos = iv.filter(x => x === 2), others = iv.filter(x => x !== 2), h = Math.ceil(twos.length / 2);
      return [...twos.slice(0, h), ...others, ...twos.slice(h)].map(len => ({ len, amt: 1 }));
    };
    const capBlocks = spread(Hy - 2, nS);
    // 몸판 진동 늘림은 겨드랑이 가까이에 몰림: 마지막 늘림이 요크 끝 2단 전
    const armBlocks = nA > 0 ? (2 * nA > Hy - 2 ? tdBlocks(Hy - 2, nA) : distribute(Math.min(Hy - 2, Math.max(2 * nA, Math.round((Hy - 2) * 0.6))), nA).map(len => ({ len, amt: 1 }))) : [];
    const armSpan = armBlocks.slice(0, -1).reduce((a, b) => a + b.len, 0);
    const armStart = Math.max(1, (Hy - 1) - armSpan - ((Hy - 1 - armSpan) % 2 === 0 ? 1 : 0)); // 홀수 단(겉면)
    const evOf = (start, blocks) => { const o = []; let r = start; blocks.forEach(b => { o.push({ row: r, amt: b.amt }); r += b.len; }); return o; };
    const armEv = evOf(armStart, armBlocks).map(e => ({ ...e, row: e.row + Hu }));
    const capEv = evOf(1, capBlocks);

    // 앞목
    let Rn = isV ? Math.max(8, rowsOf(d.vDepth)) : Math.max(6, rowsOf(d.frontNeckD));
    if (Rn > ah - 4) { Rn = Math.max(6, ah - 4); warn(`${isV ? 'V넥' : '앞목'} 깊이가 진동깊이보다 깊어 겨드랑이 4단 위까지로 줄였습니다. 탑다운에서는 앞목을 요크 안에서 끝냅니다.`); }
    const joinRow = isCard ? 0 : Rn; // Rn-1단(겉면) 끝에서 앞중심 코를 만들어 잇고 Rn단부터 한 장
    const roundFrom = isCard ? 0 : Math.max(Hu + 1, joinRow);
    // 몸판 진동: 앞판 한쪽, 뒤판
    const Fsep = Fc - (isCard ? u / 2 : u), Bsep = Bc - u;
    const ragFront = isCard ? Fsep - nA : Fsep - 2 * nA; // 진동 늘림 전 앞판 폭
    const Fn = isCard ? ragFront - shSts : ragFront - 2 * shSts; // 앞목 폭(앞판 몫)
    if (Fn < 2) warn('앞목 폭이 너무 좁습니다. 목너비, 어깨너비를 확인하세요.');
    const frontNeck = () => {
      const maxEv = Math.max(1, Math.floor(Rn / 2) - 1);
      if (isV) { const c = isCard ? 0 : Math.max(0, Fn) % 2; const fs = isCard ? Fn : (Fn - c) / 2; return { c, fs, blocks: tdBlocks(Rn - 2, Math.max(0, fs)) }; }
      if (isCard) { const ch = Math.max(2, Math.round(Fn * 0.34)); const amts = [ch, ...neckSide(Math.max(0, Fn - ch), maxEv - 1)].reverse(); return { c: 0, fs: Fn, blocks: amts.map(a => ({ len: 2, amt: a })) }; }
      let fs = Math.round(Fn * 0.33), center = Fn - 2 * fs; if (center < 2) { fs = Math.floor((Fn - 2) / 2); center = Fn - 2 * fs; }
      return { c: center, fs, blocks: neckSide(fs, maxEv).reverse().map(a => ({ len: 2, amt: a })) };
    };
    const nk = frontNeck();
    const add = (ops, r, o) => (ops[r] = ops[r] || []).push(o);
    // 어깨 경사: 되돌아뜨기 trims, 코늘림은 단 시작에서 계단식 코 만들기(뒤판) / 코 줍기(앞판)
    function slope(ops, trims, segL, segR, isBack) {
      // segL: 왼쪽 가장자리가 진동인 조각 이름, segR: 오른쪽 가장자리가 진동인 조각 이름
      for (let j = 1; j <= steps; j++) {
        if (gsr) {
          if (segL) { trims[2 * j - 1] = { ...(trims[2 * j - 1] || {}), [segL + 'l']: leave(j) }; trims[2 * j] = { ...(trims[2 * j] || {}), [segL + 'l']: leave(j) }; }
          if (segR) { trims[2 * j] = { ...(trims[2 * j] || {}), [segR + 'r']: leave(j) }; trims[2 * j + 1] = { ...(trims[2 * j + 1] || {}), [segR + 'r']: leave(j) }; }
        } else {
          const n = parts[steps - j];
          const code = isBack ? 'co' : 'pu';
          if (segR) add(ops, 2 * j - 1, { seg: segR, edge: 'right', type: code, n });
          if (segL) add(ops, 2 * j, { seg: segL, edge: 'left', type: code, n });
        }
      }
    }
    function simCoco(W, init, total, ops, joins, trims) {
      const sim = simTD(W, init, total, ops, joins);
      // 되돌아뜨기: 뜨지 않는 코를 그 단에서 빼고, 돌린 자리 다음 단 첫 코에 더블 스티치 표시
      Object.keys(trims).forEach(k => {
        const r = +k, t = trims[k]; if (!sim.rows[r]) return;
        sim.rows[r] = sim.rows[r].map(s => {
          const nm = s.name === 'main' ? null : s.name;
          const tl = t[(nm || 'main') + 'l'] || (nm ? 0 : (t.Ll || 0)) || 0, tr = t[(nm || 'main') + 'r'] || (nm ? 0 : (t.Rr || 0)) || 0;
          return { ...s, l: s.l + tl, r: s.r - tr };
        }).filter(s => s.l <= s.r);
      });
      for (let r = 2; r <= total; r++) {
        const prev = sim.rows[r - 1] || [], cur = sim.rows[r] || [];
        cur.forEach(s => {
          const p = prev.find(x => x.name === s.name) || prev.find(x => x.l <= s.r && x.r >= s.l); if (!p) return;
          // 왼쪽 끝에서 돌림(이전 단이 겉면에서 왼쪽 끝 전에 멈춤) / 오른쪽 끝에서 돌림
          const tL = trims[r - 1] && Object.keys(trims[r - 1]).some(k => k.endsWith('l')) && r % 2 === 0 && p.l === s.l && trims[r - 1][Object.keys(trims[r - 1]).find(k => k.endsWith('l'))];
          if (tL) sim.marks.set(r * 10000 + s.l, 'ds');
          const tR = trims[r - 1] && Object.keys(trims[r - 1]).some(k => k.endsWith('r')) && r % 2 === 1 && p.r === s.r && trims[r - 1][Object.keys(trims[r - 1]).find(k => k.endsWith('r'))];
          if (tR) sim.marks.set(r * 10000 + s.r, 'ds');
        });
      }
      return sim;
    }
    const total = ah; // 뒤판, 앞판 차트: 어깨부터 겨드랑이까지
    /* --- 뒤판 --- */
    const yb = (() => {
      const W = Bsep, ops = {}, trims = {};
      const c0 = (W - NshB) / 2;
      const init = gsr ? { main: { l: c0, r: c0 + NshB - 1 } } : { main: { l: c0 + leave(steps), r: c0 + NshB - 1 - leave(steps) } };
      slope(ops, trims, 'main', 'main', true);
      armEv.forEach(e => { add(ops, e.row, { seg: 'main', edge: 'left', type: 'inc', n: e.amt }); add(ops, e.row, { seg: 'main', edge: 'right', type: 'inc', n: e.amt }); });
      const sim = simCoco(W, init, total, ops, {}, trims);
      return mkPiece({ id: 'yback', name: '뒤판 요크', kind: 'yback', W, rows: sim.rows, marks: sim.marks, placements: place(W, layBack, 1), lay: layBack, roundFrom,
        info: { Nh: gsr ? NshB : NshB - 2 * leave(steps), Nc: Bsep, start: NshB, end: Bsep, arm: armBlocks, armStart: armStart + Hu } });
    })();
    /* --- 앞판 --- */
    function frontPiece(id, name, kind, lay, side) {
      const W = Fsep, ops = {}, joins = {}, trims = {};
      const sh0 = gsr ? shSts : parts[steps];
      let init;
      if (side === 'both') {
        const cL = Math.floor((W - nk.c) / 2);
        const Lr = cL - 1 - nk.fs, Rl = cL + nk.c + nk.fs;
        init = { L: { l: Lr - sh0 + 1, r: Lr }, R: { l: Rl, r: Rl + sh0 - 1 } };
        slope(ops, trims, 'L', 'R', false);
        let r = 1;
        nk.blocks.forEach(b => { const t = b.amt >= 2 ? 'co' : 'inc'; add(ops, r, { seg: 'L', edge: 'right', type: t, n: b.amt }); add(ops, t === 'co' ? r + 1 : r, { seg: 'R', edge: 'left', type: t, n: b.amt }); r += b.len; });
        joins[joinRow] = true;
        armEv.forEach(e => { add(ops, e.row, { seg: 'L', edge: 'left', type: 'inc', n: e.amt }); add(ops, e.row, { seg: 'R', edge: 'right', type: 'inc', n: e.amt }); });
      } else {
        const neckEdge = side === 'L' ? 'right' : 'left', armEdge = side === 'L' ? 'left' : 'right';
        const p = side === 'L' ? W - 1 - nk.fs : nk.fs;
        init = side === 'L' ? { main: { l: p - sh0 + 1, r: p } } : { main: { l: p, r: p + sh0 - 1 } };
        if (side === 'L') slope(ops, trims, 'main', null, false); else slope(ops, trims, null, 'main', false);
        let r = 1;
        nk.blocks.forEach(b => { const t = b.amt >= 2 ? 'co' : 'inc'; add(ops, t === 'co' && neckEdge === 'left' ? r + 1 : r, { seg: 'main', edge: neckEdge, type: t, n: b.amt }); r += b.len; });
        armEv.forEach(e => add(ops, e.row, { seg: 'main', edge: armEdge, type: 'inc', n: e.amt }));
      }
      const sim = simCoco(W, init, total, ops, joins, trims);
      return mkPiece({ id, name, kind, W, rows: sim.rows, marks: sim.marks, placements: place(W, lay, isCard ? 1 : joinRow + 1), lay, roundFrom,
        info: { Nh: side === 'both' ? 2 * sh0 : sh0, Nc: W, neck: { type: isV ? 'v' : 'round', blocks: nk.blocks, center: nk.c, rows: Rn, joinRow, fs: nk.fs }, arm: armBlocks, side } });
    }
    const lay2 = { blocks: layOne.blocks.map(bk => bk.type === 'motif' ? { ...bk, motif: mirrorMotif(bk.motif) } : bk), panelW: layOne.panelW, cableSts: layOne.cableSts };
    /* --- 소매산 (요크) --- */
    const ys = (() => {
      const W = Ssep, ops = {}, l0 = (W - Spick) / 2;
      capEv.forEach(e => { add(ops, e.row, { seg: 'main', edge: 'left', type: e.amt >= 2 ? 'co' : 'inc', n: e.amt }); add(ops, e.row, { seg: 'main', edge: 'right', type: e.amt >= 2 ? 'co' : 'inc', n: e.amt }); });
      const sim = simTD(W, { main: { l: l0, r: l0 + Spick - 1 } }, Hy, ops, {});
      return mkPiece({ id: 'ysleeve', name: '소매산 (2장)', kind: 'ysleeve', mult: 2, W, rows: sim.rows, marks: sim.marks, placements: place(W, laySleeve, 1), lay: laySleeve, roundFrom: roundFrom ? Math.max(1, roundFrom - Hu) : 0,
        info: { Nh: Spick, Nc: Ssep, start: Spick, end: Ssep, rag: capBlocks } });
    })();
    const pieces = [];
    if (!isCard) pieces.push(frontPiece('yfront', '앞판 요크', 'yfront', layFront, 'both'));
    else pieces.push(frontPiece('ylfront', '왼앞판 요크', 'ylfront', layOne, 'L'), frontPiece('yrfront', '오른앞판 요크', 'yrfront', lay2, 'R'));
    pieces.push(yb, ys);
    const yJ = isCard ? 1 : joinRow + 1;
    if (!isCard) pieces.push(bodyTD('bfront', '몸판 앞판', 'bfront', layFront, Fsep, Fc, front0.Nh, ['left', 'right'], yJ - ah, u, bodyRows));
    else pieces.push(bodyTD('blfront', '몸판 왼앞판', 'blfront', layOne, Fsep, Fc, front0.Nh, ['left'], 1 - ah, u, bodyRows), bodyTD('brfront', '몸판 오른앞판', 'brfront', lay2, Fsep, Fc, front0.Nh, ['right'], 1 - ah, u, bodyRows));
    pieces.push(bodyTD('bback', '몸판 뒤판', 'bback', layBack, Bsep, Bc, back0.Nh, ['left', 'right'], 1 - ah, u, bodyRows));
    const sl = sleeveTD(Hy, u, Nup, Ncuff, Ssep);
    pieces.push(sl);
    /* --- 넥밴드, 앞단, 완성 치수, 실 --- */
    const nbRows = rowsOf(d.neckbandH);
    const ribMult = pat.rib === '2x2' ? 4 : 2;
    const pf = pieces[0];
    const neckEdgeCm = isCard ? 2 * edgeLen(pf.rows, 1, Math.min(Rn, ah), 'right', gs, gr) : edgeLen(pf.rows, 1, joinRow - 1, 'right', gs, gr, s => s.find(x => x.name === 'L') || s[0]) + edgeLen(pf.rows, 1, joinRow - 1, 'left', gs, gr, s => s.find(x => x.name === 'R') || s[s.length - 1]);
    const neckCirc = neckB / gs + neckEdgeCm + (isCard ? 0 : nk.c / gs);
    const neckPick = Math.round(neckCirc * gs * 0.92 / ribMult) * ribMult;
    let band = null;
    if (isCard) {
      const edgeCm = (ah + bodyRows - (isV ? Rn : 0) + (isV ? 0 : nbRows)) / gr;
      let pick = Math.round(edgeCm * gs * 0.9);
      if (pat.rib === '2x2') pick = Math.round((pick - 2) / 4) * 4 + 2; else pick = pick % 2 ? pick : pick + 1;
      const nbt = Math.max(2, d.buttons || 6), first = 3, last = pick - 3;
      band = { edgeCm, pick, pos: Array.from({ length: nbt }, (_, i) => Math.round(first + (last - first) * i / (nbt - 1))), rows: rowsOf(d.bandW), nb: nbt };
    }
    const finished = {
      chest: cmFor(Bc, layBack, gs, dens) + (isCard ? 2 * cmFor(Fc, layOne, gs, dens) + d.bandW : cmFor(Fc, layFront, gs, dens)),
      hem: cmFor(back0.Nh, layBack, gs, dens) + (isCard ? 2 * cmFor(front0.Nh, layOne, gs, dens) + d.bandW : cmFor(front0.Nh, layFront, gs, dens)),
      length: backTotal / gr, armDepth: ah / gr, shoulder: cmFor(NshB, layBack, gs, dens), neckW: neckB / gs,
      sleeveLen: sl.info.sRows / gr, upper: cmFor(Nup, laySleeve, gs, dens), cuff: cmFor(Ncuff, laySleeve, gs, dens), ribH: ribRows / gr, cuffH: sl.info.cuffRows / gr,
    };
    let cells = 0;
    pieces.forEach(pc => { const mult = pc.mult || 1; pc.codes.forEach(row => { if (row) row.forEach(v => { if (v) cells += mult; }); }); });
    cells += neckPick * nbRows + (band ? band.pick * band.rows * 2 : 0);
    const sw = P.gauge.swatchW, gSw = P.gauge.unit === '10cm' ? P.gauge.st * P.gauge.row : P.gauge.st * P.gauge.row * 100;
    return {
      td: 'coco', pieces, warnings: W_, T, finished, gs, gr, dens, ribRows, ahRows: ah, totalRows: backTotal, Y: Hy, Hu, Hy, bodyRows, sideRows: bodyRows - ribRows, u, b0, neckB, NshB, shSts, parts, steps, gsr, Spick, nS, nA, A,
      Fsep, Bsep, Ssep, Nup, Ncuff, joinRow, Rn, roundFrom, capBlocks, armBlocks, armPick: Spick / 2, backTopRows: Hu, frontTopRows: Hu, yokeRows: Hy,
      cuffRows: sl.info.cuffRows, sRows: sl.info.sRows, sleeveLen: sl.info.sleeveLen, neckPick, nbRows, neckCirc, band, yarnG: sw ? cells / gSw * sw * 1.08 : null, cells,
      layFull, layBack, laySleeve, layFront, isCard, isV, isDrop: false, capInfo: null,
    };
  }

  /* ===== 탑다운 래글런 =====
   목에서 코를 잡아 요크(앞판, 뒤판, 소매 2장을 한 바늘에)를 뜨며 래글런 선 양옆에서 늘림.
   겨드랑이에서 소매 코를 쉼코로 두고 겨드랑이 코를 만들어 몸판을 아래로, 소매는 쉼코를 원통으로 이어 아래로 뜸.
   차트는 구역별: 요크 앞판, 요크 뒤판, 요크 소매, 몸판(앞, 뒤), 소매. 래글런 선 2코는 몸판 가장자리 1코 + 소매 가장자리 1코 */
  function computeRaglan() {
    const Y = rowsOf(T.armDepth); // 뒷목 코잡기부터 겨드랑이까지
    const backTotal = Math.max(Y + ribRows + 10, rowsOf(T.length - d.backNeckD));
    const bodyRows = backTotal - Y;
    const u = Math.max(2, even(clamp(0.035 * T.chest + 0.5, 1.5, 5) * gs)); // 겨드랑이 코 (짝수, 반씩 앞뒤)
    const front0 = bodyPlan(layFront, isCard ? 0.5 : 1), back0 = bodyPlan(layBack, 1);
    const Fc = front0.Nc, Bc = back0.Nc; // 몸판 가슴 코
    const Fsep = Fc - (isCard ? u / 2 : u), Bsep = Bc - u;
    let Nup = stsFor(T.upper, laySleeve, gs, dens);
    const Ncuff = stsFor(T.wrist, laySleeve, gs, dens);
    if (Nup < Ncuff) { warn('위팔둘레가 손목둘레보다 작아 소매를 줄임 없이 곧게 뜹니다.'); Nup = Ncuff; }
    if ((Nup - Ncuff) % 2) Nup++;
    if ((Nup - u) % 2) Nup++;
    const Ssep = Nup - u;
    // 뒷목 코: 목너비, 늘림 횟수가 정수가 되도록
    let B0 = Math.max(6, Math.round(T.neckW * gs)); if ((Bsep - B0) % 2) B0++;
    const nb = (Bsep - B0) / 2;
    let S0 = Math.max(4, Math.round(clamp(0.12 * T.upper, 2, 6) * gs)); if ((Ssep - S0) % 2) S0++;
    if (S0 > Ssep) S0 = Ssep - ((Ssep - 4) % 2 ? 1 : 0);
    const ns = (Ssep - S0) / 2;
    if (nb < 0) warn('목너비가 가슴 폭보다 넓습니다. 목너비를 확인하세요.');
    const bodyBlocks = tdBlocks(Y - 2, Math.max(0, nb));
    const bodyIncRows = bodyBlocks.reduce((a, b) => a + b.len, 0);
    const sleeveBlocks = ns > 0 ? (2 * ns <= Math.max(bodyIncRows, 2) ? distribute(Math.max(bodyIncRows, 2 * ns), ns).map(len => ({ len, amt: 1 })) : tdBlocks(Y - 2, ns)) : [];
    const evRows = (start, blocks) => { const out = []; let r = start; blocks.forEach(b => { for (let k = 0; k < 1; k++) out.push({ row: r, amt: b.amt }); r += b.len; }); return out; };
    const bodyEv = evRows(1, bodyBlocks), sleeveEv = evRows(1, sleeveBlocks);
    const lastEv = Math.max(0, ...bodyEv.map(e => e.row), ...sleeveEv.map(e => e.row));
    if (lastEv > Y) warn('래글런 늘림이 요크 안에 다 들어가지 않습니다.');

    // 앞목: 앞목 깊이 - 뒷목 깊이 만큼 왕복으로 뜨며 목 쪽에서 늘림
    let Rn = isV ? Math.max(8, rowsOf(d.vDepth - d.backNeckD)) : Math.max(4, rowsOf(d.frontNeckD - d.backNeckD));
    if (Rn > Y - 4) { Rn = Math.max(4, Y - 4); warn(`${isV ? 'V넥' : '앞목'} 깊이가 요크보다 깊어 겨드랑이 4단 위까지로 줄였습니다. 탑다운에서는 앞목을 요크 안에서 끝냅니다.`); }
    const joinRow = isCard ? 0 : Math.min(Rn, Y);
    const f0 = 1; // 앞판 쪽 처음 코 (래글런 선 1코)
    // 몸판, 소매 쪽 래글런 늘림 (1 = 래글런 선 바로 안쪽 늘림)
    const mkRagOps = (ops, ev, edges) => ev.forEach(e => edges.forEach(([seg, edge]) => (ops[e.row] = ops[e.row] || []).push({ seg, edge, type: 'inc', n: e.amt })));

    /* --- 요크 뒤판 --- */
    const yb = (() => {
      const W = Bsep, l0 = (W - B0) / 2, ops = {};
      mkRagOps(ops, bodyEv, [['main', 'left'], ['main', 'right']]);
      const sim = simTD(W, { main: { l: l0, r: l0 + B0 - 1 } }, Y, ops, {});
      return mkPiece({ id: 'yback', name: '요크 뒤판', kind: 'yback', W, rows: sim.rows, marks: sim.marks, placements: place(W, layBack, 1), lay: layBack, roundFrom: isCard ? 0 : joinRow,
        info: { Nh: B0, Nc: Bsep, start: B0, end: Bsep, rag: bodyBlocks } });
    })();
    /* --- 요크 소매 --- */
    const ys = (() => {
      const W = Ssep, l0 = (W - S0) / 2, ops = {};
      mkRagOps(ops, sleeveEv, [['main', 'left'], ['main', 'right']]);
      const sim = simTD(W, { main: { l: l0, r: l0 + S0 - 1 } }, Y, ops, {});
      return mkPiece({ id: 'ysleeve', name: '요크 소매 (2장)', kind: 'ysleeve', mult: 2, W, rows: sim.rows, marks: sim.marks, placements: place(W, laySleeve, 1), lay: laySleeve, roundFrom: isCard ? 0 : joinRow,
        info: { Nh: S0, Nc: Ssep, start: S0, end: Ssep, rag: sleeveBlocks } });
    })();
    /* --- 요크 앞판 --- */
    const frontNeck = (Fn, depth) => { // 한쪽 목 늘림 코 배열 (위에서부터, 작은 것 먼저) + 중앙 코
      if (isV) {
        const c = isCard ? 0 : Fn % 2; const fs = isCard ? Fn - f0 : (Fn - 2 * f0 - c) / 2;
        return { c, blocks: tdBlocks(depth - (isCard ? 0 : 2), Math.max(0, fs)), fs };
      }
      if (isCard) {
        const neckSts = Fn - f0, maxEv = Math.max(2, depth / 2 - 1);
        const ch = Math.max(2, Math.round(neckSts * 0.34));
        const amts = [ch, ...neckSide(Math.max(0, neckSts - ch), maxEv - 1)].reverse();
        return { c: 0, blocks: amts.map(a => ({ len: 2, amt: a })), fs: neckSts };
      }
      // 바텀업 둥근 목(중앙 덮어씌우기 후 큰 코부터)을 뒤집음: 위(어깨 쪽)는 1코씩, 아래로 갈수록 2~3코 코 만들기, 마지막에 중앙 코 만들기
      const neckSts = Math.max(2, Fn - 2 * f0);
      let fs = Math.round(neckSts * 0.33), center = neckSts - 2 * fs;
      if (center < 2) { fs = Math.floor((neckSts - 2) / 2); center = neckSts - 2 * fs; }
      const amts = neckSide(fs, Math.max(1, depth / 2 - 1)).reverse();
      return { c: center, blocks: amts.map(a => ({ len: 2, amt: a })), fs };
    };
    function frontYoke(id, name, kind, lay, side) {
      // side: 'both'(풀오버 한 장), 'L'(왼앞판: 앞중심이 차트 오른쪽), 'R'(오른앞판: 앞중심이 차트 왼쪽)
      const W = Fsep, ops = {}, joins = {};
      const Fn = isCard ? W - nb : W - 2 * nb;
      const nk = frontNeck(Fn, Rn);
      let init;
      if (side === 'both') {
        const cL = Math.floor((W - nk.c) / 2); // 중앙 코 시작 열
        // L: 왼앞판(차트 왼쪽, 목 쪽이 오른쪽 가장자리), R: 오른앞판
        const Lr = cL - 1 - nk.fs, Rl = cL + nk.c + nk.fs;
        init = { L: { l: Lr - f0 + 1, r: Lr }, R: { l: Rl, r: Rl + f0 - 1 } };
        mkRagOps(ops, bodyEv, [['L', 'left'], ['R', 'right']]);
        // 목 늘림: 왼앞판 목 쪽은 겉면 단의 시작, 오른앞판 목 쪽은 끝 → 2코 이상 코 만들기는 다음 안면 단
        let r = 1;
        nk.blocks.forEach(b => {
          const t = b.amt >= 2 ? 'co' : 'inc';
          (ops[r] = ops[r] || []).push({ seg: 'L', edge: 'right', type: t, n: b.amt });
          const r2 = t === 'co' ? r + 1 : r;
          (ops[r2] = ops[r2] || []).push({ seg: 'R', edge: 'left', type: t, n: b.amt });
          r += b.len;
        });
        joins[joinRow] = true;
      } else {
        // 가디건 앞판 한쪽: L(왼앞판) 앞중심 = 오른쪽 가장자리(겉면 단 시작), R(오른앞판) 앞중심 = 왼쪽 가장자리(겉면 단 끝)
        const neckEdge = side === 'L' ? 'right' : 'left', ragEdge = side === 'L' ? 'left' : 'right';
        const p0 = side === 'L' ? W - 1 - nk.fs : nk.fs; // 처음 코 위치
        init = { main: { l: p0 - (f0 - 1) * (side === 'L' ? 1 : 0), r: p0 + (f0 - 1) * (side === 'L' ? 0 : 1) } };
        mkRagOps(ops, bodyEv, [['main', ragEdge]]);
        let r = 1;
        nk.blocks.forEach(b => {
          const t = b.amt >= 2 ? 'co' : 'inc';
          const rr = t === 'co' && neckEdge === 'left' ? r + 1 : r;
          (ops[rr] = ops[rr] || []).push({ seg: 'main', edge: neckEdge, type: t, n: b.amt });
          r += b.len;
        });
      }
      const sim = simTD(W, init, Y, ops, joins);
      const yJoin = isCard ? 1 : joinRow + (joinRow % 2 === 0 ? 1 : 0);
      return mkPiece({ id, name, kind, W, rows: sim.rows, marks: sim.marks, placements: place(W, lay, isCard ? 1 : joinRow + 1), lay, roundFrom: isCard ? 0 : joinRow,
        info: { Nh: side === 'both' ? 2 * f0 : f0, Nc: W, start: f0, end: W, rag: bodyBlocks, neck: { type: isV ? 'v' : 'round', blocks: nk.blocks, center: nk.c, rows: Rn, joinRow, fs: nk.fs }, side, yJoin } });
    }
    const yf = isCard ? null : frontYoke('yfront', '요크 앞판', 'yfront', layFront, 'both');
    const lay2 = { blocks: layOne.blocks.map(bk => bk.type === 'motif' ? { ...bk, motif: mirrorMotif(bk.motif) } : bk), panelW: layOne.panelW, cableSts: layOne.cableSts };
    const ylf = isCard ? frontYoke('ylfront', '요크 왼앞판', 'ylfront', layOne, 'L') : null;
    const yrf = isCard ? frontYoke('yrfront', '요크 오른앞판', 'yrfront', lay2, 'R') : null;

    const pieces = [];
    const yJ = isCard ? 1 : joinRow + 1;
    if (!isCard) pieces.push(yf);
    else pieces.push(ylf, yrf);
    pieces.push(yb, ys);
    if (!isCard) {
      pieces.push(bodyTD('bfront', '몸판 앞판', 'bfront', layFront, Fsep, Fc, front0.Nh, ['left', 'right'], yJ - Y, u, bodyRows));
    } else {
      pieces.push(bodyTD('blfront', '몸판 왼앞판', 'blfront', layOne, Fsep, Fc, front0.Nh, ['left'], 1 - Y, u, bodyRows));
      pieces.push(bodyTD('brfront', '몸판 오른앞판', 'brfront', lay2, Fsep, Fc, front0.Nh, ['right'], 1 - Y, u, bodyRows));
    }
    pieces.push(bodyTD('bback', '몸판 뒤판', 'bback', layBack, Bsep, Bc, back0.Nh, ['left', 'right'], 1 - Y, u, bodyRows));

    const sl = sleeveTD(Y, u, Nup, Ncuff, Ssep);
    pieces.push(sl);

    /* --- 넥밴드, 앞단 --- */
    const nbRows = rowsOf(d.neckbandH);
    const ribMult = pat.rib === '2x2' ? 4 : 2;
    let neckCirc;
    const edgeOf = (pc, side, segName, to) => edgeLen(pc.rows, 1, to, side, gs, gr, segs => segs.find(s => s.name === segName) || segs[side === 'right' ? segs.length - 1 : 0]);
    if (!isCard) {
      const to = joinRow - 1;
      neckCirc = (B0 + 2 * S0 + yf.info.neck.center) / gs + edgeOf(yf, 'right', 'L', to) + edgeOf(yf, 'left', 'R', to);
    } else {
      neckCirc = (B0 + 2 * S0) / gs + 2 * edgeLen(ylf.rows, 1, Math.min(Rn, Y), 'right', gs, gr);
    }
    let neckPick = Math.round(neckCirc * gs * 0.92 / ribMult) * ribMult;
    let band = null;
    const frontRows = Y + bodyRows;
    if (isCard) {
      const edgeCm = (frontRows - (isV ? Rn : 0) + (isV ? 0 : nbRows)) / gr;
      let pick = Math.round(edgeCm * gs * 0.9);
      if (pat.rib === '2x2') pick = Math.round((pick - 2) / 4) * 4 + 2; else pick = pick % 2 ? pick : pick + 1;
      const nbt = Math.max(2, d.buttons || 6);
      const first = 3, last = pick - 3;
      const pos = Array.from({ length: nbt }, (_, i) => Math.round(first + (last - first) * i / (nbt - 1)));
      band = { edgeCm, pick, pos, rows: rowsOf(d.bandW), nb: nbt };
    }

    /* --- 완성 치수 --- */
    const fb = pieces.find(p => p.kind === 'bfront' || p.kind === 'blfront');
    const chestCm = cmFor(Bc, layBack, gs, dens) + (isCard ? 2 * cmFor(Fc, layOne, gs, dens) + d.bandW : cmFor(Fc, layFront, gs, dens));
    const hemCm = cmFor(back0.Nh, layBack, gs, dens) + (isCard ? 2 * cmFor(front0.Nh, layOne, gs, dens) + d.bandW : cmFor(front0.Nh, layFront, gs, dens));
    const finished = {
      chest: chestCm, hem: hemCm, length: backTotal / gr + d.backNeckD, armDepth: Y / gr, shoulder: NaN,
      neckW: B0 / gs, sleeveLen: sl.info.sRows / gr, upper: cmFor(Nup, laySleeve, gs, dens), cuff: cmFor(Ncuff, laySleeve, gs, dens),
      ribH: ribRows / gr, cuffH: sl.info.cuffRows / gr,
    };
    let cells = 0;
    pieces.forEach(pc => { const mult = pc.mult || 1; pc.codes.forEach(row => { if (row) row.forEach(v => { if (v) cells += mult; }); }); });
    cells += neckPick * nbRows + (band ? band.pick * band.rows * 2 : 0);
    const sw = P.gauge.swatchW;
    const gSw = P.gauge.unit === '10cm' ? P.gauge.st * P.gauge.row : P.gauge.st * P.gauge.row * 100;
    const yarnG = sw ? cells / gSw * sw * 1.08 : null;
    return {
      td: 'raglan', pieces, warnings: W_, T, finished, gs, gr, dens, ribRows, ahRows: Y, totalRows: backTotal, Y, bodyRows, u, B0, S0, nb, ns, Fsep, Bsep, Ssep, Nup, Ncuff, joinRow, Rn,
      cuffRows: sl.info.cuffRows, neckPick, nbRows, neckCirc, band, yarnG, cells, layFull, layBack, laySleeve, layFront, isCard, isV, isDrop: false, capInfo: null, sleeveLen: sl.info.sleeveLen, sRows: sl.info.sRows, sideRows: bodyRows - ribRows,
    };
  }

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

  // 어깨 단계
  const sdRows = rowsOf(d.shoulderDrop);
  const kSteps = clamp(Math.round(sdRows / 2), 2, Math.min(4, shSts));
  const shParts = Array.from({ length: kSteps }, (_, i) => Math.floor(shSts / kSteps) + (i < shSts % kSteps ? 1 : 0));
  const shStart = totalRows - 2 * kSteps + 1;
  const ahStart = ribRows + sideRows + 1;

  // 진동 단계: 덮어씌우기 후 2단마다 1코 6회, 나머지는 4단마다. 어깨 경사 4단 전까지 들어가도록 조정
  function armholeBlocks(A) {
    const out = []; let rem = A;
    if (rem <= 0) return out;
    const budget = shStart - ahStart - 4;
    if (rem >= 4) { const b0 = clamp(Math.round(A * 0.35), 2, 6); out.push({ len: 2, amt: b0, kind: 'bo' }); rem -= b0; }
    if (rem >= 5) { out.push({ len: 2, amt: 2, kind: 'bo' }); rem -= 2; }
    while (rem >= 4 && 2 * (out.length + rem) > budget) { out.push({ len: 2, amt: 2, kind: 'bo' }); rem -= 2; }
    const n4 = Math.max(0, Math.min(rem - 6, Math.floor((budget - 2 * (out.length + rem)) / 2)));
    for (let i = 0; i < rem; i++) out.push({ len: i >= rem - n4 ? 4 : 2, amt: 1, kind: 'dec' });
    return out;
  }
  const ahBlocks = armholeBlocks(A);
  const ahUsed = ahBlocks.reduce((a, x) => a + x.len, 0);
  if (ahStart + ahUsed > shStart - 4) warn('진동 줄임이 어깨 경사와 겹칩니다. 진동깊이를 늘리거나 어깨너비를 넓히세요.');

  // 옆선 쉐이핑(밑단 -> 가슴)
  function sideShaping(Nh, Nc, oneSide) {
    const dd = oneSide ? (Nc - Nh) : (Nc - Nh) / 2;
    if (dd === 0) return { events: [], blocks: [], F: 0, kind: null, n: 0 };
    let F = Math.min(rowsOf(4), Math.max(0, sideRows - 4));
    let H = Math.max(2, sideRows - F - rowsOf(3));
    if (2 * Math.abs(dd) > H) { F = 0; H = Math.max(2, sideRows - 2); } // 촘촘하면 평단을 줄여 옆선 전체에 배분
    const blocks = fitBlocks(H, Math.abs(dd));
    if (blocks.some(x => x.amt >= 2)) warn(`밑단과 가슴 폭 차이가 커서 옆선에서 2코씩 ${dd > 0 ? '늘리는' : '줄이는'} 단이 있습니다. 밑단둘레나 가슴 여유를 확인하세요.`);
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
      const nb = Math.max(4, rowsOf(d.backNeckD)); // 나눈 단 + 줄임 단이 들어갈 최소 단수
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
      const nf = Math.max(6, rowsOf(d.frontNeckD));
      const s = totalRows - nf + 1;
      const rn = roundNeck(neckSts, nf);
      const a = Math.round(centerCol - (rn.center - 1) / 2);
      splits[s] = { a, b: a + rn.center - 1 };
      const blocks = rn.amts.map(x => ({ len: 2, amt: x, kind: x >= 2 ? 'bo' : 'dec' }));
      addEvents(ops, blocksToEvents(s + 2, blocks, 'dec'), [{ seg: 'L', edge: 'right' }, { seg: 'R', edge: 'left' }]);
      info.neck = { type: 'round', s, center: rn.center, blocks, depthRows: nf };
    } else if (kind === 'front' && isV) {
      const nv = Math.max(8, rowsOf(d.vDepth));
      const s = totalRows - nv + 1;
      const odd = neckSts % 2 === 1;
      const fs = Math.floor(neckSts / 2);
      const mid = Math.floor(W / 2);
      if (odd) splits[s] = { a: Math.round(centerCol), b: Math.round(centerCol) };
      else splits[s] = { a: mid, b: mid - 1 }; // 0코 덮어씌우기
      const H = nv - 6;
      const blocks = vBlocks(H, fs);
      addEvents(ops, blocksToEvents(s + 2, blocks, 'dec'), [{ seg: 'L', edge: 'right' }, { seg: 'R', edge: 'left' }]);
      info.neck = { type: 'v', s, center: odd ? 1 : 0, blocks, depthRows: nv };
    } else if (half) {
      const neckRows = isV ? Math.max(8, rowsOf(d.vDepth)) : Math.max(6, rowsOf(d.frontNeckD));
      const s = totalRows - neckRows + 1;
      let blocks;
      if (isV) {
        const H = neckRows - 6;
        blocks = vBlocks(H, neckSts);
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
  const ahLen = seamLen(back.rows, ahStart, shStart - 1, 'right', gs, gr);

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
  if (Nup < Ncuff) { warn('위팔둘레가 손목둘레보다 작게 계산되어 소매를 늘림 없이 곧게 뜹니다. 위팔둘레와 손목둘레를 확인하세요.'); Nup = Ncuff; }
  if ((Nup - Ncuff) % 2) Nup++;

  function sleeveBuild(capRows, capPlan) {
    const underRows = Math.max(4, rowsOf(sleeveLen) - capRows - cuffRows);
    const total = cuffRows + underRows + capRows;
    const W = Math.max(Nup, Ncuff);
    const l0 = (W - Ncuff) / 2;
    const ops = {};
    const di = (Nup - Ncuff) / 2;
    let F = Math.min(rowsOf(2), Math.max(0, underRows - 4));
    let H = Math.max(2, underRows - F - rowsOf(3));
    if (2 * di > H) { F = 0; H = Math.max(2, underRows - 2); }
    const incBlocks = fitBlocks(H, di);
    addEvents(ops, blocksToEvents(cuffRows + 1 + F, incBlocks, 'inc'), [{ seg: 'main', edge: 'left' }, { seg: 'main', edge: 'right' }]);
    const capStart = cuffRows + underRows + 1;
    if (capPlan) addEvents(ops, blocksToEvents(capStart, capPlan, 'dec'), [{ seg: 'main', edge: 'left' }, { seg: 'main', edge: 'right' }]);
    const sim = simulate(W, l0, l0 + Ncuff - 1, total, ops, {});
    return { W, sim, total, underRows, capStart, incBlocks, F, H, ivOver: incBlocks.some(x => x.amt >= 2) };
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
      while (extra > 0) { const j = Math.floor(i / 2) % E; const k = i % 2 === 0 ? j : E - 1 - j; amts[k]++; extra--; i++; if (i > 8 * E) break; }
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
    let best = null;
    const tryCap = (lo, hi) => { for (let hc = lo; hc <= hi; hc += 2) {
      const cp = capPlanFor(hc); if (!cp) continue;
      const sb = sleeveBuild(hc, cp.blocks);
      const capEdge = seamLen(sb.sim.rows, sb.capStart, sb.total, 'right', gs, gr);
      const topCm = cp.topSts / gs;
      const capTotal = 2 * capEdge + topCm;
      const armTotal = 2 * ahLen;
      const easeC = capTotal - armTotal;
      const score = Math.abs(easeC - 1.5) + Math.max(0, cp.blocks.filter(x => x.amt >= 2).length - 4) * 0.4;
      if (!best || score < best.score) best = { hc, cp, sb, capTotal, armTotal, easeC, score };
    } };
    tryCap(Math.max(6, even(0.5 * ahRows)), even(0.85 * ahRows));
    // 굵은 실, 큰 여유처럼 기본 범위(진동깊이 50~85%)로 맞지 않을 때만 35~95%로 넓힘
    if (!best || best.easeC > 3) tryCap(Math.max(6, even(0.35 * ahRows)), even(0.5 * ahRows) - 2);
    if (!best || best.easeC < -0.5) tryCap(even(0.85 * ahRows) + 2, even(0.95 * ahRows));
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
  if (sleeve.ivOver) warn('소매 늘림이 촘촘해 2코씩 늘리는 단이 있습니다. 소매길이나 위팔 여유를 확인하세요.');
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
    const edgeCm = (fr.info.neck.s - 1 + (isV ? 0 : nbRows)) / gr; // 라운드넥은 넥밴드 끝까지, V넥은 목선 시작까지
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
  const list = lay.blocks.filter(b => b.w > 0).slice().reverse().map(b => {
    if (b.type === 'motif') return `${b.motif._label || b.motif.name} ${b.w}코`;
    if (b.type === 'purl') return `안뜨기 ${b.w}코`;
    return `${BG_NAME[bg]} ${b.w}코`;
  });
  return list;
}

function buildText(P, C, opt) {
  // opt.mark: 사이즈 병기용. 사이즈마다 달라질 수 있는 수(코, 단, 단-코-회)를 표시해 두면 병기 때 값이 같아도 모든 사이즈를 적음
  const mk = !!(opt && opt.mark);
  const M = v => mk ? `\u0003${v}\u0004` : String(v);
  const NT = blocks => M(notation(blocks));
  const out = []; // {t:'h1'|'h2'|'h3'|'p'|'li'|'note', s}
  const H1 = s => out.push({ t: 'h1', s }), H2 = s => out.push({ t: 'h2', s }), Pp = s => out.push({ t: 'p', s }), Li = s => out.push({ t: 'li', s }), Nt = s => out.push({ t: 'note', s });
  const g = P.gauge, d = P.design, pat = P.pattern;
  const gsTxt = `${fmt(C.gs * 10)}코 x ${fmt(C.gr * 10)}단 (10cm x 10cm, ${BG_NAME[pat.bg]})`;
  const cm = r => fmt(r / C.gr);
  const LEN = r => mk ? `${cm(r)}cm, ${M(r)}단` : `${cm(r)}cm(${r}단)`;
  const garmentName = (C.isCard ? '가디건' : '풀오버') + ', ' + (C.isV ? 'V넥' : '라운드넥') + ', ' + (C.td === 'raglan' ? '탑다운 래글런' : C.td === 'coco' ? '탑다운 코코닛츠 메소드' : C.isDrop ? '드롭숄더' : '셋인 슬리브');
  H1(P.name || '이름 없는 도안');
  Pp(C.td ? `${garmentName}. 목에서 시작해 아래로 뜨는 방식이며, 꿰매는 곳 없이 이어 뜹니다.` : `${garmentName}. 아래에서 위로 뜨는 조각 뜨기 방식이며, 각 조각을 뜬 뒤 꿰매어 완성합니다.`);

  H2('재료');
  Li(`실: ${g.yarn || '(실 이름 입력)'}${C.yarnG ? `, 약 ${M(Math.ceil(C.yarnG / 10) * 10)}g` + (g.ballW ? `, ${g.ballW}g 볼 ${M(Math.ceil(C.yarnG / g.ballW))}개${g.ballLen ? `, 약 ${M(Math.ceil(C.yarnG / g.ballW * g.ballLen / 10) * 10)}m` : ''}` : '') : ''}`);
  Li(`바늘: 몸판 ${g.needle || '-'}mm 대바늘, 고무단 ${g.ribNeedle || '-'}mm 대바늘, 넥밴드용 ${g.ribNeedle || '-'}mm 줄바늘(40cm)`);
  const hasCable = C.pieces.some(p => p.codes.some(row => row && row.some(v => typeof v === 'string' && parseTok(v))));
  Li(`부자재: ${hasCable ? '꽈배기바늘, ' : ''}단수 링, 돗바늘${C.isCard ? `, 단추 ${C.band.nb}개 (지름 1.5cm 내외)` : ''}`);
  H2('게이지');
  Pp(`${gsTxt}. 반드시 게이지 스와치를 떠서 세탁, 건조 후 측정하세요. 게이지가 다르면 완성 치수가 달라집니다.${C.layFull.cableSts ? ` 꽈배기 무늬는 메리야스보다 폭이 줄어드는 비율 ${fmt(C.dens)}배를 적용해 코 수를 계산했습니다.` : ''}`);

  const f = C.finished;
  const n0 = out.length;
  H2('완성 치수');
  Li(`가슴둘레 ${M(fmt(f.chest))}cm, 밑단둘레 ${M(fmt(f.hem))}cm, 총장 ${M(fmt(f.length))}cm`);
  Li(C.td === 'raglan' ? `요크 깊이 ${M(fmt(f.armDepth))}cm, 뒷목너비 ${M(fmt(f.neckW))}cm` : `어깨너비 ${M(fmt(f.shoulder))}cm, 진동깊이 ${M(fmt(f.armDepth))}cm, 목너비 ${M(fmt(f.neckW))}cm`);
  Li(`${C.td === 'raglan' ? '소매 밑길이(겨드랑이부터)' : '소매길이'} ${M(fmt(f.sleeveLen))}cm, 소매통(위팔) ${M(fmt(f.upper))}cm, 소맷부리 ${M(fmt(f.cuff))}cm`);
  for (let i = n0; i < out.length; i++) out[i].sec = 'fin';

  H2('읽는 법');
  Pp('차트는 겉면에서 본 모양입니다. 홀수 단(겉면)은 오른쪽에서 왼쪽으로, 짝수 단(안면)은 왼쪽에서 오른쪽으로 읽으며 안면에서는 기호의 반대 코(겉뜨기는 안뜨기로)를 뜹니다.');
  Pp('줄임, 늘림 표기 "단-코-회"는 해당 단수마다 몇 코씩 몇 회 하는지를 뜻합니다. 예: 2-1-4는 2단마다 1코씩 4회. 각 구간의 첫 겉면 단에서 실행합니다. 2코 이상은 덮어씌우기, 1코는 겹치기(가장자리 1코 안쪽)로 합니다.');
  if (C.td) Pp('탑다운 표기: 1-1-4는 매 단 1코씩 4회입니다. 코 만들기(감아코)와 덮어씌우기는 단의 시작에서만 할 수 있으므로 왕복 단에서는 오른쪽 가장자리는 겉면 단, 왼쪽 가장자리는 다음 안면 단에서 합니다.');
  else Pp('덮어씌우기는 단의 시작에서만 할 수 있으므로, 오른쪽 가장자리는 겉면 단에서, 왼쪽 가장자리는 다음 안면 단에서 합니다.');
  const SEED_HOW = {
    seed: '겉면에서 겉뜨기 1코, 안뜨기 1코를 번갈아 뜨고, 다음 단부터는 겉뜨기 위에 안뜨기, 안뜨기 위에 겉뜨기가 오도록 매 단 엇갈려 뜹니다. 2단 반복.',
    seed12: '겉뜨기 1코, 안뜨기 1코를 번갈아 2단 뜬 뒤(안면에서는 보이는 대로), 다음 2단은 엇갈려 뜹니다. 4단 반복.',
    seed22: '겉뜨기 2코, 안뜨기 2코를 번갈아 2단 뜬 뒤(안면에서는 보이는 대로), 다음 2단은 엇갈려 뜹니다. 4단 반복.',
  };
  if (SEED_HOW[pat.bg]) Pp(`${BG_NAME[pat.bg]}: ${SEED_HOW[pat.bg]} 코 수가 늘거나 줄어도 차트의 무늬 자리를 따라 뜹니다.`);

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

  if (C.td === 'raglan') { raglanText(); return out; }
  if (C.td === 'coco') { cocoText(); return out; }
  // 조각
  const ribName = RIB_NAME[pat.rib];
  C.pieces.forEach(pc => {
    H2(pc.name);
    const info = pc.info;
    const isSleeve = pc.kind === 'sleeve';
    const startN = isSleeve ? info.Ncuff : info.Nh;
    const ribR = pc.ribRows;
    Pp(`${g.ribNeedle || ''}mm 바늘로 일반코잡기 ${M(startN)}코를 잡습니다. 가장자리 1코씩은 꿰매기용 코로 늘 겉뜨기합니다. ${ribName}로 ${LEN(ribR)}을 뜹니다.`);
    const sideN = (startN - pc.lay.panelW - 2) / 2, sideTxt = sideN > 0 ? `${BG_NAME[pat.bg]} ${M(sideN)}코, ` : '';
    if (pc.lay.panelW) Pp(`${g.needle || ''}mm 바늘로 바꾸어 다음 배치로 뜹니다 (겉면, 오른쪽부터): 가장자리 1코, ${sideTxt}${blocksDesc(pc.lay, pat.bg).join(', ')}, ${sideTxt}가장자리 1코.`);
    else Pp(`${g.needle || ''}mm 바늘로 바꾸어 가장자리 1코, ${BG_NAME[pat.bg]} ${M(startN - 2)}코, 가장자리 1코로 뜹니다.`);
    if (!isSleeve) {
      const ss = info.side;
      if (ss && ss.blocks.length) Pp(`옆선: 고무단 위로 평 ${M(ss.F)}단을 뜬 뒤 ${pc.kind === 'rfront' || pc.kind === 'lfront' ? '옆선 쪽에서' : '양쪽에서'} ${NT(ss.blocks)} ${ss.kind === 'inc' ? '늘립니다' : '줄입니다'}, ${M(ss.n)}코씩. ${ss.kind === 'inc' ? '늘린 코는 바탕무늬로 뜹니다.' : ''}${ss.blocks.some(x => x.amt >= 2) ? (ss.kind === 'inc' ? ' 2코씩 늘리는 단은 가장자리에서 감아코 2코를 만듭니다.' : ' 2코씩 줄이는 단은 덮어씌우기로 합니다.') : ''}`);
      Pp(`고무단 위로 ${LEN(C.sideRows)}까지 뜨면 ${M(info.Nc)}코가 됩니다. 단수 링을 겁니다.`);
      if (C.A > 0) Pp(`진동: ${pc.kind === 'rfront' ? '왼쪽(옆선 쪽) 가장자리에서' : pc.kind === 'lfront' ? '오른쪽(옆선 쪽) 가장자리에서' : '양쪽에서'} ${NT(info.ahBlocks)} 줄입니다, ${M(C.A)}코씩. ${pc.kind === 'rfront' || pc.kind === 'lfront' ? '' : `남은 코는 ${M(info.Nsh)}코입니다.`}`);
      else Pp('드롭숄더이므로 진동 줄임 없이 곧게 뜹니다. 소매 달 위치에 단수 링을 겁니다.');
      const nk = info.neck;
      if (nk && nk.type === 'back') Pp(`뒷목: 총장까지 ${LEN(nk.depthRows)} 남은 ${M(nk.s)}단째(겉면)에서 중앙 ${M(nk.center)}코를 덮어씌우고 좌우를 나누어 뜹니다. 목 쪽에서 ${NT(nk.blocks)} 줄입니다.`);
      if (nk && nk.type === 'round') Pp(`앞목: ${M(nk.s)}단째(겉면, 총장까지 ${cm(nk.depthRows)}cm)에서 중앙 ${M(nk.center)}코를 덮어씌우고 좌우를 나누어 뜹니다. 목 쪽에서 ${NT(nk.blocks)} 줄인 뒤 어깨까지 곧게 뜹니다. 한쪽을 먼저 끝내고 반대쪽에 실을 새로 이어 대칭으로 뜹니다.`);
      if (nk && nk.type === 'v') Pp(`V넥: ${M(nk.s)}단째(겉면, 총장까지 ${cm(nk.depthRows)}cm)에서 ${nk.center ? '중앙 1코를 덮어씌우고' : '중앙에서'} 좌우로 나눕니다. 평 2단 후 목 쪽에서 ${NT(nk.blocks)} 줄입니다 (가장자리 1코 안쪽에서 겹치기).`);
      if (nk && nk.type === 'round-half') Pp(`앞목: ${M(nk.s)}단째부터 앞중심 쪽에서 ${NT(nk.blocks)} 줄입니다.`);
      if (nk && nk.type === 'v-half') Pp(`V넥: ${M(nk.s)}단째부터 앞중심 쪽에서 ${NT(nk.blocks)} 줄입니다.`);
      const shTxt = NT(info.shBlocks);
      if (P.design.shoulderMethod === 'sr') Pp(`어깨: ${M(C.shStart)}단째부터 어깨 쪽에서 ${shTxt} 되돌아뜨기를 합니다. 마지막 단에서 남긴 코를 모두 정리해 뜬 뒤 어깨 ${M(C.shSts)}코는 쉼코로 둡니다 (앞뒤 어깨는 빼뜨기 잇기).`);
      else Pp(`어깨: ${M(C.shStart)}단째부터 어깨 쪽에서 ${shTxt} 계단식으로 덮어씌웁니다, 어깨 ${M(C.shSts)}코.`);
      Pp(`총 ${M(pc.total)}단, 총장 ${M(cm(pc.total))}cm.`);
    } else {
      const ib = info.incBlocks;
      if (ib.length) Pp(`소매 늘림: 소맷부리 위로 평 ${M(info.F)}단을 뜬 뒤 양쪽에서 ${NT(ib)} 늘립니다. ${M(info.Nup)}코가 됩니다. 늘린 코는 바탕무늬로 뜹니다.${ib.some(x => x.amt >= 2) ? ' 2코씩 늘리는 단은 가장자리에서 감아코 2코를 만듭니다.' : ''}`);
      else Pp(`소매는 늘림 없이 ${M(info.Nup)}코로 곧게 뜹니다.`);
      Pp(`소맷부리 위로 ${LEN(info.underRows)}까지 뜹니다.`);
      if (info.cap) Pp(`소매산: 양쪽에서 ${NT(info.cap.blocks)} 줄인 뒤 남은 ${M(info.cap.topSts)}코를 모두 덮어씌웁니다. 소매산 높이 ${LEN(info.cap.hc)}.`);
      else Pp(`드롭숄더이므로 소매산 없이 ${M(info.Nup)}코를 모두 덮어씌웁니다.`);
      Pp(`총 ${M(pc.total)}단. 같은 것을 2장 뜹니다.`);
    }
  });

  H2('마무리');
  Li(P.design.shoulderMethod === 'sr' ? '앞판과 뒤판의 어깨 쉼코를 겉끼리 마주 대고 빼뜨기로 잇습니다.' : '앞판과 뒤판의 어깨를 떠서 꿰매기로 잇습니다.');
  if (C.isCard) {
    const b = C.band;
    Li(`넥밴드: ${g.ribNeedle || ''}mm 바늘로 앞중심 끝부터 목둘레를 따라 약 ${M(C.neckPick)}코를 주워 ${ribName}로 ${LEN(C.nbRows)}을 뜨고 고무뜨기 덮어씌우기를 합니다.`);
    Li(`앞단: 앞판 가장자리(밑단부터 ${C.isV ? 'V넥 시작점' : '넥밴드 끝'}까지)에서 ${M(b.pick)}코를 주워 ${ribName}로 ${LEN(b.rows)}을 뜹니다. 단추 구멍 쪽 앞단(여성용은 오른앞판)은 ${M(Math.max(1, Math.floor(b.rows / 2)))}단째에 아래에서부터 ${b.pos.map(M).join(', ')}번째 코 위치에 바늘비우기와 왼코 겹치기로 단추 구멍 ${b.nb}개를 냅니다.`);
  } else if (C.isV) {
    Li(`넥밴드: 왼쪽 어깨에서 시작해 목둘레를 따라 약 ${M(C.neckPick)}코를 원통으로 줍고, V 중심 1코에 단수 링을 겁니다. ${ribName}로 뜨면서 매 단 V 중심에서 중심 3코 모아뜨기로 줄여 ${LEN(C.nbRows)}을 뜬 뒤 고무뜨기 덮어씌우기를 합니다.`);
  } else {
    Li(`넥밴드: ${g.ribNeedle || ''}mm 줄바늘로 목둘레를 따라 약 ${M(C.neckPick)}코를 원통으로 주워 ${ribName}로 ${LEN(C.nbRows)}을 뜬 뒤 고무뜨기 덮어씌우기를 합니다. 접어서 꿰매는 이중 넥밴드는 2배 길이로 뜹니다.`);
  }
  Li(C.isDrop ? '소매 중심을 어깨 이음선에 맞추고, 몸판의 단수 링 사이에 소매 윗선을 꿰매어 답니다.' : '소매산 중심을 어깨 이음선에 맞추고 진동 둘레에 고르게 배분하며 소매를 답니다.');
  Li('옆선과 소매 밑선을 가장자리 1코 안쪽에서 떠서 꿰매기(매트리스 스티치)로 잇습니다.');
  Li('실 끝을 정리하고 완성 치수에 맞춰 블로킹합니다.');
  /* ----- 탑다운 래글런 서술형 ----- */
  function raglanText() {
    const ribName = RIB_NAME[pat.rib];
    const pf = C.pieces.find(p => p.kind === 'yfront' || p.kind === 'ylfront');
    const nk = pf.info.neck;
    const fr = C.isCard ? 1 : 1;
    const tot0 = 2 * fr + 2 * C.S0 + C.B0;
    H2('뜨는 순서');
    Pp(`목에서 시작해 아래로 뜹니다. 요크(앞판, 소매, 뒤판, 소매를 한 바늘에)를 뜨며 래글런 선에서 코를 늘리고, 겨드랑이에서 소매 코를 쉼코로 둔 뒤 몸판을 밑단까지 뜹니다. 소매는 쉼코를 원통으로 이어 소맷부리까지 뜹니다. ${C.isCard ? '가디건이므로 몸판은 끝까지 왕복으로 뜹니다.' : '앞목을 왕복으로 뜬 뒤 앞중심 코를 만들어 원형으로 잇습니다.'}`);
    Pp(`차트는 구역별로 나누어 그렸습니다. 겉면 단(원형 단)에서는 ${C.isCard ? '왼앞판, 소매, 뒤판, 소매, 오른앞판' : '앞판, 소매, 뒤판, 소매'} 차트를 차례로 이어 뜹니다. 차트 1단이 첫 단(목 쪽)이고, 원형으로 뜨는 단은 모두 겉면이라 오른쪽에서 왼쪽으로 읽습니다.`);
    H2('요크');
    Pp(`${g.needle || ''}mm 줄바늘(80cm)로 일반코잡기 ${M(tot0)}코를 잡습니다: 왼앞판 ${M(fr)}코, 링, 소매 ${M(C.S0)}코, 링, 뒤판 ${M(C.B0)}코, 링, 소매 ${M(C.S0)}코, 링, 오른앞판 ${M(fr)}코. 링 4개가 래글런 선 자리입니다.`);
    Pp('래글런 선: 링 양옆 1코씩(모두 2코)은 늘 겉뜨기합니다. 늘리는 단에서는 링 앞 1코를 남기고 오른코 늘리기, 링 앞 1코, 링 옮기기, 링 뒤 1코, 왼코 늘리기를 합니다. 몸판 쪽만 늘리는 단에서는 몸판 쪽에서만, 소매 쪽만 늘리는 단에서는 소매 쪽에서만 늘립니다.');
    Pp(`몸판(앞판, 뒤판) 쪽 래글런 늘림: 1단부터 ${NT(C.pieces.find(p => p.kind === 'yback').info.rag)}, 래글런 선마다 1코씩 늘립니다.`);
    Pp(`소매 쪽 래글런 늘림: 1단부터 ${NT(C.pieces.find(p => p.kind === 'ysleeve').info.rag)}, 래글런 선마다 1코씩 늘립니다.`);
    const neckTxt = NT(nk.blocks);
    if (!C.isCard) {
      Pp(`앞목: 1단부터 왕복으로 뜨면서 앞목 쪽(겉면 단의 시작과 끝)에서 ${neckTxt} 늘립니다. 1코는 가장자리 1코 안쪽에서 늘리기, 2코 이상은 단 시작에서 코 만들기로 합니다(오른앞판 쪽은 다음 안면 단 시작).`);
      Pp(`${M(C.joinRow - 1)}단(겉면) 끝에서 ${nk.center ? `앞중심 ${M(nk.center)}코를 감아코로 만들고 ` : ''}왼앞판 첫 코에 이어 원형으로 잇습니다. ${M(C.joinRow)}단부터 원형으로 뜹니다. 단 시작 표시 링을 앞중심에 겁니다.`);
    } else {
      Pp(`앞목: 앞중심 쪽(왼앞판은 겉면 단 시작, 오른앞판은 겉면 단 끝)에서 ${neckTxt} 늘립니다. 1코는 가장자리 1코 안쪽에서 늘리기, 2코 이상은 단 시작에서 코 만들기로 합니다(오른앞판 쪽은 다음 안면 단 시작). 가디건이므로 끝까지 왕복으로 뜹니다.`);
    }
    Pp(`요크를 뒷목에서 ${LEN(C.Y)} 뜨면 ${C.isCard ? `왼앞판, 오른앞판 ${M(C.Fsep)}코씩` : `앞판 ${M(C.Fsep)}코`}, 뒤판 ${M(C.Bsep)}코, 소매 ${M(C.Ssep)}코씩이 됩니다.`);
    H2('몸판');
    const bb = C.pieces.find(p => p.kind === 'bback');
    Pp(`나누기: 소매 ${M(C.Ssep)}코씩을 쉼코로 두고, 겨드랑이마다 감아코 ${M(C.u)}코를 만들어 앞판과 뒤판을 잇습니다. 몸판은 ${C.isCard ? `왼앞판 ${M(C.Fsep + C.u / 2)}코, 뒤판 ${M(C.Bsep + C.u)}코, 오른앞판 ${M(C.Fsep + C.u / 2)}코` : `앞판 ${M(C.Fsep + C.u)}코, 뒤판 ${M(C.Bsep + C.u)}코, 모두 ${M(C.Fsep + C.Bsep + 2 * C.u)}코`}입니다.${C.isCard ? '' : ' 원형으로 계속 뜹니다.'}`);
    const sh = bb.info.side;
    if (sh) Pp(`옆선: 겨드랑이에서 평 ${M(sh.top)}단을 뜬 뒤 옆선(겨드랑이 코 가운데) 양쪽에서 ${NT(sh.blocks)} ${sh.kind === 'inc' ? '늘립니다' : '줄입니다'}. 뒤판 ${M(bb.info.NhEnd)}코가 됩니다. ${sh.kind === 'inc' ? '늘린 코는 바탕무늬로 뜹니다.' : ''}`);
    Pp(`겨드랑이에서 ${LEN(C.bodyRows - C.ribRows)} 뜬 뒤 ${g.ribNeedle || ''}mm 바늘로 바꾸어 ${ribName}로 ${LEN(C.ribRows)}을 뜨고 고무뜨기 덮어씌우기를 합니다.`);
    H2('소매');
    const sv = C.pieces.find(p => p.kind === 'tsleeve');
    Pp(`쉼코 ${M(C.Ssep)}코를 바늘에 옮기고, 겨드랑이 만든 코 ${M(C.u)}코에서 ${M(C.u)}코를 주워 ${M(C.Nup)}코로 원형으로 뜹니다. 단 시작은 겨드랑이 가운데입니다.`);
    if (sv.info.decBlocks.length) Pp(`소매 줄임: 평 ${M(sv.info.top)}단을 뜬 뒤 단 시작 양쪽(겨드랑이 1코 안쪽)에서 ${NT(sv.info.decBlocks)} 줄입니다. ${M(C.Ncuff)}코가 됩니다.`);
    Pp(`겨드랑이에서 ${LEN(sv.info.under)} 뜬 뒤 ${g.ribNeedle || ''}mm 바늘로 바꾸어 ${ribName}로 ${LEN(C.cuffRows)}을 뜨고 고무뜨기 덮어씌우기를 합니다. 다른 쪽 소매도 같은 방법으로 뜹니다.`);
    H2('마무리');
    if (C.isCard) {
      const b = C.band;
      Li(`넥밴드: ${g.ribNeedle || ''}mm 바늘로 앞중심 끝부터 목둘레를 따라 약 ${M(C.neckPick)}코를 주워 ${ribName}로 ${LEN(C.nbRows)}을 뜨고 고무뜨기 덮어씌우기를 합니다.`);
      Li(`앞단: 앞판 가장자리(밑단부터 ${C.isV ? 'V넥 시작점' : '넥밴드 끝'}까지)에서 ${M(b.pick)}코를 주워 ${ribName}로 ${LEN(b.rows)}을 뜹니다. 단추 구멍 쪽 앞단(여성용은 오른앞판)은 ${M(Math.max(1, Math.floor(b.rows / 2)))}단째에 아래에서부터 ${b.pos.map(M).join(', ')}번째 코 위치에 바늘비우기와 왼코 겹치기로 단추 구멍 ${b.nb}개를 냅니다.`);
    } else if (C.isV) {
      Li(`넥밴드: 왼쪽 래글런에서 시작해 목둘레를 따라 약 ${M(C.neckPick)}코를 원통으로 줍고, V 중심 1코에 단수 링을 겁니다. ${ribName}로 뜨면서 매 단 V 중심에서 중심 3코 모아뜨기로 줄여 ${LEN(C.nbRows)}을 뜬 뒤 고무뜨기 덮어씌우기를 합니다.`);
    } else {
      Li(`넥밴드: ${g.ribNeedle || ''}mm 줄바늘로 목둘레를 따라 약 ${M(C.neckPick)}코를 원통으로 주워 ${ribName}로 ${LEN(C.nbRows)}을 뜬 뒤 고무뜨기 덮어씌우기를 합니다.`);
    }
    Li('겨드랑이에 생긴 작은 구멍은 실 끝으로 꿰매어 막습니다.');
    Li('실 끝을 정리하고 완성 치수에 맞춰 블로킹합니다.');
  }
  function cocoText() {
    const ribName = RIB_NAME[pat.rib];
    const pf = C.pieces.find(p => p.kind === 'yfront' || p.kind === 'ylfront');
    const nk = pf.info.neck;
    const yb = C.pieces.find(p => p.kind === 'yback'), ys = C.pieces.find(p => p.kind === 'ysleeve');
    const pts = C.parts, st = C.steps, leaveTxt = pts.slice(0, st).map(M).join(', ');
    H2('뜨는 순서');
    Pp(`목에서 시작해 아래로 뜨는 코코닛츠 메소드입니다. 1) 뒷목과 어깨 코를 잡아 어깨 경사를 만들고 뒤판 윗부분을 뜹니다. 2) 뒤판 어깨에서 앞판 코를 주워 같은 경사와 앞목을 만듭니다. 3) 진동 가장자리에서 소매 코를 주워 ${C.isCard ? '앞판, 소매, 뒤판, 소매, 앞판' : '앞판, 소매, 뒤판, 소매'}를 한 바늘에 걸고 요크를 뜨며 소매산과 진동을 늘립니다. 4) 겨드랑이에서 소매 코를 쉼코로 두고 몸판을 밑단까지, 소매는 원통으로 소맷부리까지 뜹니다.`);
    Pp(`어깨 경사: ${C.gsr ? '독일식 되돌아뜨기' : '코늘림(뒤판은 단 시작에서 코 만들기, 앞판은 뒤판의 그 코에서 줍기)'}. 차트는 구역별로 그렸고 1단이 어깨 쪽(첫 단)입니다. 원형으로 뜨는 단은 모두 겉면이라 오른쪽에서 왼쪽으로 읽습니다.`);
    H2('1. 뒤판 어깨');
    if (C.gsr) {
      Pp(`${g.needle || ''}mm 바늘로 일반코잡기 ${M(C.NshB)}코를 잡습니다 (어깨 ${M(C.shSts)}코, 뒷목 ${M(C.neckB)}코, 어깨 ${M(C.shSts)}코). 뒷목 양쪽에 링을 겁니다.`);
      Pp(`어깨 경사(독일식 되돌아뜨기): 1단(겉면)은 왼쪽 끝 ${M(pts[0])}코를 남기고 돌립니다. 이어서 양쪽 끝에서 차례로 ${leaveTxt}코씩 더 남기며 단마다 돌립니다(돌린 뒤 첫 코는 더블 스티치). ${M(2 * st + 1)}단과 ${M(2 * st + 2)}단에서 더블 스티치를 한 코로 뜨며 끝까지 뜹니다.`);
    } else {
      Pp(`${g.needle || ''}mm 바늘로 일반코잡기 ${M(C.neckB + 2 * pts[st])}코를 잡습니다 (어깨 안쪽 ${M(pts[st])}코, 뒷목 ${M(C.neckB)}코, 어깨 안쪽 ${M(pts[st])}코). 뒷목 양쪽에 링을 겁니다.`);
      Pp(`어깨 경사(코늘림): 단 시작에서 감아코(또는 케이블 코잡기)로 ${pts.slice(0, st).reverse().map(M).join(', ')}코씩 차례로 2단마다 만듭니다(겉면 단은 오른쪽, 안면 단은 왼쪽). ${M(2 * st)}단을 뜨면 ${M(C.NshB)}코가 됩니다. 계단 모양 코잡기 가장자리가 어깨선이 됩니다.`);
    }
    Pp(`어깨 코잡기에서 ${LEN(C.Hu)} 뜬 뒤 실을 끊지 않고 그대로 둡니다(쉼코).`);
    H2('2. 앞판');
    const sh0 = C.gsr ? C.shSts : pts[st];
    Pp(`뒤판 코잡기 가장자리의 ${C.gsr ? '어깨 부분' : '어깨 안쪽 부분'}에서 겉면을 보고 ${C.isCard ? '양쪽 앞판' : '왼앞판, 오른앞판'} ${M(sh0)}코씩을 줍습니다. ${C.isCard ? '양쪽을 실 두 타래로 함께 뜨거나 한쪽씩 뜹니다.' : '앞중심 코를 만들 때까지 양쪽을 실 두 타래로 함께 뜹니다.'}`);
    if (C.gsr) Pp(`어깨 경사: 진동 쪽 가장자리에서 뒤판과 같이 ${leaveTxt}코씩 남기며 되돌아뜨기를 하고, 더블 스티치를 정리하며 끝까지 뜹니다. 왼앞판은 겉면 단, 오른앞판은 안면 단에서 돌립니다.`);
    else Pp(`어깨 경사: 진동 쪽 가장자리의 단 시작에서 뒤판 계단 코잡기 가장자리를 따라 ${pts.slice(0, st).reverse().map(M).join(', ')}코씩 차례로 2단마다 줍습니다(오른앞판은 겉면 단, 왼앞판은 안면 단). 앞판 어깨가 ${M(C.shSts)}코씩이 됩니다.`);
    Pp(`앞목: 1단부터 목 쪽에서 ${NT(nk.blocks)} 늘립니다. 1코는 가장자리 1코 안쪽에서 늘리기, 2코 이상은 단 시작에서 코 만들기로 합니다.`);
    if (!C.isCard) Pp(`${M(C.joinRow - 1)}단(겉면) 끝에서 ${nk.center ? `앞중심 ${M(nk.center)}코를 감아코로 만들고 ` : ''}오른앞판을 이어 한 장으로 뜹니다.`);
    Pp(`앞판도 어깨에서 ${LEN(C.Hu)}까지 뜹니다(목 쪽 기준).`);
    H2('3. 요크');
    Pp(`소매 코 줍기: 진동 가장자리(앞판 쪽 ${M(C.Spick / 2)}코, 뒤판 쪽 ${M(C.Spick / 2)}코)에서 소매마다 ${M(C.Spick)}코를 줍습니다. ${C.isCard ? '왼앞판, 소매, 뒤판, 소매, 오른앞판' : '앞판, 소매, 뒤판, 소매'} 순서로 한 바늘에 걸고 경계마다 링을 겁니다.${C.roundFrom ? ` ${M(C.roundFrom)}단(어깨에서)부터 원형으로 뜹니다.` : ''}`);
    Pp(`소매산: 소매 양쪽 링 안쪽에서 1단부터 ${NT(C.capBlocks)} 늘립니다. 소매가 ${M(C.Ssep)}코가 됩니다.`);
    if (C.armBlocks.length) Pp(`진동: 앞판, 뒤판의 소매 쪽 가장자리(링 바깥쪽)에서 ${M(yb.info.armStart - C.Hu)}단(요크)부터 ${NT(C.armBlocks)} 늘립니다.`);
    Pp(`요크를 ${LEN(C.Hy)} 뜨면 ${C.isCard ? `왼앞판, 오른앞판 ${M(C.Fsep)}코씩` : `앞판 ${M(C.Fsep)}코`}, 뒤판 ${M(C.Bsep)}코, 소매 ${M(C.Ssep)}코씩이 됩니다.`);
    H2('4. 몸판');
    const bb = C.pieces.find(p => p.kind === 'bback');
    Pp(`나누기: 소매 ${M(C.Ssep)}코씩을 쉼코로 두고, ${C.u ? `겨드랑이마다 감아코 ${M(C.u)}코를 만들어 ` : ''}앞판과 뒤판을 잇습니다. 몸판은 ${C.isCard ? `왼앞판 ${M(C.Fsep + C.u / 2)}코, 뒤판 ${M(C.Bsep + C.u)}코, 오른앞판 ${M(C.Fsep + C.u / 2)}코` : `앞판 ${M(C.Fsep + C.u)}코, 뒤판 ${M(C.Bsep + C.u)}코, 모두 ${M(C.Fsep + C.Bsep + 2 * C.u)}코`}입니다.`);
    const sh = bb.info.side;
    if (sh) Pp(`옆선: 겨드랑이에서 평 ${M(sh.top)}단을 뜬 뒤 옆선 양쪽에서 ${NT(sh.blocks)} ${sh.kind === 'inc' ? '늘립니다' : '줄입니다'}. 뒤판 ${M(bb.info.NhEnd)}코가 됩니다.`);
    Pp(`겨드랑이에서 ${LEN(C.bodyRows - C.ribRows)} 뜬 뒤 ${g.ribNeedle || ''}mm 바늘로 바꾸어 ${ribName}로 ${LEN(C.ribRows)}을 뜨고 고무뜨기 덮어씌우기를 합니다.`);
    H2('5. 소매');
    const sv = C.pieces.find(p => p.kind === 'tsleeve');
    Pp(`쉼코 ${M(C.Ssep)}코를 바늘에 옮기고, ${C.u ? `겨드랑이 만든 코에서 ${M(C.u)}코를 주워 ` : ''}${M(C.Nup)}코로 원형으로 뜹니다. 단 시작은 겨드랑이 가운데입니다.`);
    if (sv.info.decBlocks.length) Pp(`소매 줄임: 평 ${M(sv.info.top)}단을 뜬 뒤 단 시작 양쪽에서 ${NT(sv.info.decBlocks)} 줄입니다. ${M(C.Ncuff)}코가 됩니다.`);
    Pp(`겨드랑이에서 ${LEN(sv.info.under)} 뜬 뒤 ${ribName}로 ${LEN(C.cuffRows)}을 뜨고 고무뜨기 덮어씌우기를 합니다. 다른 쪽 소매도 같습니다.`);
    H2('마무리');
    if (C.isCard) {
      const b = C.band;
      Li(`넥밴드: 앞중심 끝부터 목둘레를 따라 약 ${M(C.neckPick)}코를 주워 ${ribName}로 ${LEN(C.nbRows)}을 뜨고 고무뜨기 덮어씌우기를 합니다.`);
      Li(`앞단: 앞판 가장자리(밑단부터 ${C.isV ? 'V넥 시작점' : '넥밴드 끝'}까지)에서 ${M(b.pick)}코를 주워 ${ribName}로 ${LEN(b.rows)}을 뜹니다. 단추 구멍 쪽 앞단은 ${M(Math.max(1, Math.floor(b.rows / 2)))}단째에 아래에서부터 ${b.pos.map(M).join(', ')}번째 코 위치에 단추 구멍 ${b.nb}개를 냅니다.`);
    } else if (C.isV) Li(`넥밴드: 목둘레를 따라 약 ${M(C.neckPick)}코를 원통으로 줍고 V 중심 1코에 링을 겁니다. ${ribName}로 뜨면서 매 단 V 중심에서 중심 3코 모아뜨기로 줄여 ${LEN(C.nbRows)}을 뜬 뒤 덮어씌웁니다.`);
    else Li(`넥밴드: 목둘레를 따라 약 ${M(C.neckPick)}코를 원통으로 주워 ${ribName}로 ${LEN(C.nbRows)}을 뜬 뒤 고무뜨기 덮어씌우기를 합니다.`);
    Li('겨드랑이에 생긴 작은 구멍은 실 끝으로 꿰매어 막습니다.');
    Li('실 끝을 정리하고 완성 치수에 맞춰 블로킹합니다.');
  }
  return out;
}

/* ===================== 사이즈 병기 ===================== */
// 여러 사이즈의 서술형 도안을 하나로 합침: 95(100) 105(110) 115 사이즈 → 108코(112코) 116코(120코) 124코
// \u0003값\u0004 으로 표시된 수(buildText mark)는 모든 사이즈 값이 같아도 전부 적음. 표시 없는 수는 같으면 한 번만
const NOT_RE = /\d+-\d+-\d+(?:, \d+-\d+-\d+)*/y, NUM_RE = /\d+(?:\.\d+)?/y;
const altJoinE = vals => vals.map((v, i) => i % 2 ? `(${v})` : (i ? ' ' : '') + v).join('');
function splitNums(s) {
  const parts = []; let buf = '', i = 0;
  while (i < s.length) {
    if (s[i] === '\u0003') {
      const j = s.indexOf('\u0004', i); const v = s.slice(i + 1, j < 0 ? s.length : j);
      parts.push(buf, { k: /-/.test(v) ? 'n' : 'v', v, m: true }); buf = ''; i = j < 0 ? s.length : j + 1; continue;
    }
    NOT_RE.lastIndex = i; let m = NOT_RE.exec(s);
    if (m && !/[\d.]/.test(s[i - 1] || '')) { parts.push(buf, { k: 'n', v: m[0] }); buf = ''; i += m[0].length; continue; }
    NUM_RE.lastIndex = i; m = /[\d]/.test(s[i]) && !/[\d.]/.test(s[i - 1] || '') ? NUM_RE.exec(s) : null;
    if (m) { parts.push(buf, { k: 'v', v: m[0] }); buf = ''; i += m[0].length; continue; }
    buf += s[i++];
  }
  parts.push(buf);
  return parts;
}
const stripMarks = s => s == null ? s : String(s).replace(/[\u0003\u0004]/g, '');
function skelOf(b) { return b.t + '\u0000' + (b.s == null ? '' : splitNums(b.s).map(x => typeof x === 'string' ? x : x.k === 'n' ? '\u0002' : '\u0001').join('')); }
// vals: 사이즈별 값, labels: 사이즈 이름. opt.always: 같아도 전부, opt.unit: 값마다 붙일 단위
function mergeVals(vals, labels, opt) {
  const o = opt || {}, u = o.unit || '';
  const same = vals.every(v => v === vals[0]);
  if (vals.some(v => /-/.test(v))) { // 단-코-회: 사이즈마다 다르면 사이즈별로 나눔(같은 표기는 묶음)
    if (same && !o.always) return vals[0];
    if (same && !vals[0].includes(',')) return altJoinE(vals); // 한 구간: 2-1-4(2-1-4) 2-1-4
    const g = [];
    vals.forEach((v, i) => { const x = g.find(y => y.v === v); x ? x.l.push(labels[i]) : g.push({ v, l: [labels[i]] }); });
    return '[' + g.map(x => `${x.l.join(', ')}: ${x.v}`).join(' / ') + ']';
  }
  if (same && !o.always) return vals[0] + u;
  return altJoinE(vals.map(v => v + u));
}
const UNIT_RE = /^(코|단째|단|cm|mm|g|m|개|번째|회)/;
function mergeTexts(list) {
  // list: [{label, T}] 작은 사이즈부터
  if (!list.length) return [];
  if (list.length === 1) return list[0].T.map(b => ({ ...b, s: stripMarks(b.s) }));
  const N = list.length;
  let M = list[0].T.map(b => ({ b, sk: skelOf(b), v: [splitNums(b.s || '')], at: [0] }));
  for (let k = 1; k < N; k++) {
    const B = list[k].T, bs = B.map(skelOf);
    const n = M.length, m = B.length;
    const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = M[i].sk === bs[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const out = []; let i = 0, j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && M[i].sk === bs[j]) { M[i].v.push(splitNums(B[j].s || '')); M[i].at.push(k); out.push(M[i]); i++; j++; }
      else if (j < m && (i === n || L[i][j + 1] >= L[i + 1][j])) { out.push({ b: B[j], sk: bs[j], v: [splitNums(B[j].s || '')], at: [k] }); j++; }
      else { out.push(M[i]); i++; }
    }
    M = out;
  }
  const labels = list.map(x => x.label);
  const res = [];
  const head = list[0].T.findIndex(b => b.t === 'h1');
  M.forEach((e, idx) => {
    const lb = e.at.map(k => labels[k]);
    let s = e.b.s;
    if (s != null) {
      const P0 = e.v[0], outS = [];
      let skipUnit = '';
      P0.forEach((x, pi) => {
        if (typeof x === 'string') { outS.push(skipUnit ? x.slice(skipUnit.length) : x); skipUnit = ''; return; }
        const vals = e.v.map(v => v[pi].v);
        const always = e.v.some(v => v[pi].m);
        const nxt = P0[pi + 1], um = typeof nxt === 'string' ? UNIT_RE.exec(nxt) : null;
        const unit = um && x.k === 'v' ? um[1] : '';
        const merged = mergeVals(vals, lb, { always, unit });
        outS.push(merged);
        skipUnit = unit;
      });
      s = outS.join('');
      if (e.at.length < N) s = `(${lb.join(', ')} 사이즈) ` + s;
    }
    res.push({ ...e.b, s });
    if (idx === head) res.push({ t: 'p', s: `사이즈: ${altJoinE(labels)}. 괄호 밖과 괄호 안의 수가 차례로 ${labels.join(', ')} 사이즈입니다. 수가 하나뿐인 곳은 모든 사이즈 공통입니다. 줄임, 늘림(단-코-회)이 사이즈마다 다르면 [사이즈: 표기]로 사이즈별로 나누어 적었습니다.`, sec: 'size' });
  });
  return res;
}

if (typeof module !== 'undefined') module.exports = { mergeTexts, mergeVals, stripMarks, splitNums, compute, buildText, BUILTIN_MOTIFS, expandMotif, motifCheck, parseTok, symName, crossHow, STITCH, notation, mirrorMotif, motifRowsText, tokW, fmt };
