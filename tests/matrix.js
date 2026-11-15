// 범용성 검증: 사이즈 x 핏 x 형태 x 게이지 x 무늬 조합을 모두 계산해 이상값을 찾는다
const E = require('../src/engine.js');
const PRESETS = {
  '44': { chest: 82, hip: 88, shoulder: 36, armDepth: 16.5, neckW: 14.5, armLen: 54, upperArm: 25.5, wrist: 15, length: 56 },
  '55': { chest: 86, hip: 92, shoulder: 38, armDepth: 17, neckW: 15, armLen: 55, upperArm: 27, wrist: 15.5, length: 58 },
  '66': { chest: 90, hip: 96, shoulder: 39, armDepth: 17.5, neckW: 15.5, armLen: 56, upperArm: 28.5, wrist: 16, length: 60 },
  '77': { chest: 95, hip: 100, shoulder: 40, armDepth: 18, neckW: 16, armLen: 57, upperArm: 30, wrist: 16.5, length: 61 },
  '88': { chest: 100, hip: 104, shoulder: 41, armDepth: 18.5, neckW: 16.5, armLen: 57.5, upperArm: 32, wrist: 17, length: 62 },
  'm95': { chest: 95, hip: 95, shoulder: 44, armDepth: 19, neckW: 16.5, armLen: 59, upperArm: 30, wrist: 17, length: 66 },
  'm100': { chest: 100, hip: 99, shoulder: 45.5, armDepth: 19.5, neckW: 17, armLen: 60, upperArm: 31.5, wrist: 17.5, length: 68 },
  'm105': { chest: 105, hip: 103, shoulder: 47, armDepth: 20, neckW: 17.5, armLen: 61, upperArm: 33, wrist: 18, length: 70 },
  'm110': { chest: 110, hip: 107, shoulder: 48.5, armDepth: 20.5, neckW: 18, armLen: 62, upperArm: 34.5, wrist: 18.5, length: 72 },
  'k110': { chest: 58, hip: 60, shoulder: 27, armDepth: 12.5, neckW: 11.5, armLen: 36, upperArm: 18, wrist: 12, length: 38 },
  'k130': { chest: 66, hip: 68, shoulder: 31, armDepth: 14, neckW: 12.5, armLen: 43, upperArm: 20.5, wrist: 13, length: 45 },
};
const FITS = {
  slim: { chest: 4, hip: 2, shoulder: 0, armDepth: 1.5, neckW: 1, armLen: 0, upperArm: 2, wrist: 2 },
  standard: { chest: 8, hip: 6, shoulder: 0, armDepth: 3, neckW: 2, armLen: 0, upperArm: 4, wrist: 4 },
  semi: { chest: 14, hip: 12, shoulder: 3, armDepth: 5, neckW: 3, armLen: 0, upperArm: 8, wrist: 5 },
  over: { chest: 22, hip: 20, shoulder: 8, armDepth: 7, neckW: 4, armLen: 0, upperArm: 12, wrist: 6 },
};
const GAUGES = [[14, 20], [18, 24], [22, 30], [26, 36], [32, 44]];
const PATS = [
  { bg: 'st', rib: '2x2', center: 'diamond10', side: 'rope6r', gap: 6, sep: 2, applyBack: false, applySleeve: true },
  { bg: 'st', rib: '1x1', center: '', side: '', gap: 6, sep: 2, applyBack: false, applySleeve: false },
  { bg: 'rev', rib: '1x1t', center: 'diamond10', side: '', gap: 4, sep: 2, applyBack: true, applySleeve: true },
];
const SHAPES = [];
for (const g of ['pullover', 'cardigan']) for (const n of ['round', 'v']) for (const s of ['setin', 'drop']) for (const sh of ['bo', 'sr']) SHAPES.push([g, n, s, sh]);
const issues = {}; const add = (k, ex) => { (issues[k] = issues[k] || { n: 0, ex: [] }).n++; if (issues[k].ex.length < 4) issues[k].ex.push(ex); };
const warnCount = {}; let total = 0;
const live = (pc, r) => (pc.rows[r] || []).reduce((a, s) => a + s.r - s.l + 1, 0);
for (const k in PRESETS) for (const f in FITS) for (const [st, row] of GAUGES) for (const pat of PATS) for (const [g, n, s, sh] of SHAPES) {
  const p = PRESETS[k];
  const P = { name: 't', garment: g, neck: n, sleeve: s, body: { ...p }, ease: { ...FITS[f] },
    design: { length: p.length, ribH: k.startsWith('k') ? 4 : 6, cuffH: k.startsWith('k') ? 4 : 6, neckbandH: 2.5, bandW: 3, frontNeckD: k.startsWith('k') ? 5.5 : 7, backNeckD: 2, vDepth: k.startsWith('k') ? 13 : 20, shoulderDrop: 2, capTop: 8, buttons: 6, shoulderMethod: sh },
    gauge: { unit: '10cm', st, row, dens: 1.2, swatchW: 6, needle: 4, ribNeedle: 3.5, yarn: '', ballW: 50, ballLen: 120 }, pattern: pat };
  delete P.body.length;
  const id = `${k}/${f}/${st}x${row}/${pat.rib}${pat.center ? '+c' : ''}/${g}/${n}/${s}/${sh}`;
  total++;
  let C;
  try { C = E.compute(P, E.BUILTIN_MOTIFS); } catch (e) { add('예외: ' + e.message.slice(0, 60), id); continue; }
  C.warnings.forEach(w => { if (/남습니다|V넥 깊이/.test(w)) add('경고: ' + w.replace(/[\d.]+/g, '#').slice(0, 30), id); const key = w.replace(/[\d.]+/g, '#'); warnCount[key] = (warnCount[key] || 0) + 1; });
  let T; try { T = E.buildText(P, C); } catch (e) { add('서술형 예외: ' + e.message.slice(0, 60), id); continue; }
  T.forEach(b => { if (/NaN|undefined|null|Infinity/.test(b.s || '')) add('서술형 이상값', id + ' :: ' + b.s.slice(0, 80)); });
  T.forEach(b => { if (/-?\d+-0-\d+|-\d+-\d+-0\b|\b0코/.test(b.s || '')) add('0 표기', id + ' :: ' + (b.s.match(/.{0,30}(\b0코|-0-|-0\b).{0,20}/) || [''])[0]); });
  T.forEach(b => { if (/(?<![\d.])-\d/.test((b.s || '').replace(/\d+-\d+-\d+/g, ''))) add('음수', id + ' :: ' + b.s.slice(0, 100)); });
  const fin = C.finished, tg = C.T;
  if (Math.abs(fin.chest - tg.chest) > 3) add('가슴둘레 오차>3cm', `${id} ${fin.chest.toFixed(1)} vs ${tg.chest}`);
  if (Math.abs(fin.length - tg.length) > 0.6) add('총장 오차', `${id} ${fin.length.toFixed(1)} vs ${tg.length}`);
  if (s === 'setin' && Math.abs(fin.shoulder - tg.shoulder) > 1.5) add('어깨 오차>1.5', `${id} ${fin.shoulder.toFixed(1)} vs ${tg.shoulder}`);
  if (s === 'setin' && Math.abs(fin.sleeveLen - tg.armLen) > 1.5) add('소매길이 오차>1.5', `${id} ${fin.sleeveLen.toFixed(1)} vs ${tg.armLen}`);
  if (Math.abs(fin.neckW - tg.neckW) > 2) add('목너비 오차>2', `${id} ${fin.neckW.toFixed(1)} vs ${tg.neckW}`);
  if (fin.neckW <= 0) add('목너비 0 이하', id);
  const bodies = C.pieces.filter(pc => pc.kind !== 'sleeve');
  const tt = bodies.map(pc => pc.total); if (Math.max(...tt) - Math.min(...tt) > 1) add('몸판 총단 불일치', id + ' ' + tt);
  bodies.forEach(pc => {
    const r = C.ribRows + C.sideRows;
    if (!(pc.info.neck && pc.info.neck.s <= r) && live(pc, r) !== pc.info.Nc) add('가슴 코 수 불일치', `${id} ${pc.name} ${live(pc, r)} vs ${pc.info.Nc}`);
    if (live(pc, 1) !== pc.info.Nh) add('시작 코 수 불일치', `${id} ${pc.name}`);
    const last = pc.rows[pc.total] || []; const lastLive = last.reduce((a, x) => a + x.r - x.l + 1, 0);
    if (pc.info.neck && pc.info.neck.blocks.some(b => b.amt <= 0)) add('목 줄임 0코', id);
    if (pc.info.neck && pc.info.neck.center < 0) add('목 중앙 음수', id + ' ' + pc.name);
  });
  const sl = C.pieces.find(pc => pc.kind === 'sleeve');
  if (live(sl, sl.info.capStart - 1) !== sl.info.Nup) add('소매 위팔 코 불일치', `${id} ${live(sl, sl.info.capStart - 1)} vs ${sl.info.Nup}`);
  if (sl.info.cap && sl.info.cap.topSts < 4 && sl.info.cap.blocks.length) add('소매산 윗코 너무 적음', id + ' ' + sl.info.cap.topSts);
  if (C.capInfo && Math.abs(C.capInfo.easeC) > 3) add('소매산 오차>3', `${id} ${C.capInfo.easeC.toFixed(1)}`);
  if (C.neckPick % (pat.rib === '2x2' ? 4 : 2)) add('넥밴드 코 배수', id);
  if (!(C.yarnG > 0)) add('실 사용량 0', id);
  if (sl.info.Ncuff < 20 && !k.startsWith('k')) add('소맷부리 코 적음', id + ' ' + sl.info.Ncuff);
  if (g === 'cardigan' && C.band.pos.some((v, i, a) => i && v - a[i - 1] < 4)) add('단추 간격 좁음', id);
}
console.log('조합', total);
console.log('\n[문제]'); for (const k in issues) console.log(`${issues[k].n}건  ${k}\n   ` + issues[k].ex.join('\n   '));
console.log('\n[경고 빈도]'); Object.entries(warnCount).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(v, k));
process.exit(Object.keys(issues).length ? 1 : 0);
