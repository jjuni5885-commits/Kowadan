// 탑다운(래글런, 코코닛츠) 검증: 사이즈 x 핏 x 형태 x 게이지 x 무늬 조합 + 무작위 입력
const E = require('../src/engine.js');
const SZ = require('../src/sizes.js');
const FITS = {
  slim: { chest: 4, hip: 2, shoulder: 0, armDepth: 1.5, neckW: 1, armLen: 0, upperArm: 2, wrist: 2 },
  standard: { chest: 8, hip: 6, shoulder: 0, armDepth: 3, neckW: 2, armLen: 0, upperArm: 4, wrist: 4 },
  over: { chest: 22, hip: 20, shoulder: 8, armDepth: 7, neckW: 4, armLen: 0, upperArm: 12, wrist: 6 },
};
const GAUGES = [[16, 22], [22, 30], [28, 38]];
const PATS = [
  { bg: 'st', rib: '2x2', center: 'diamond10', side: 'rope6r', gap: 6, sep: 2, applyBack: false, applySleeve: true },
  { bg: 'seed12', rib: '1x1', center: '', side: '', gap: 6, sep: 2, applyBack: false, applySleeve: false },
];
const SHAPES = [];
for (const g of ['pullover', 'cardigan']) for (const n of ['round', 'v']) { SHAPES.push([g, n, 'raglan', 'gsr']); SHAPES.push([g, n, 'coco', 'gsr']); SHAPES.push([g, n, 'coco', 'inc']); }
const issues = {}; const add = (k, ex) => { (issues[k] = issues[k] || { n: 0, ex: [] }).n++; if (issues[k].ex.length < 4) issues[k].ex.push(ex); };
const warnCount = {}; let total = 0;
const live = (pc, r) => (pc.rows[r] || []).reduce((a, s) => a + s.r - s.l + 1, 0);
function check(P, id) {
  total++;
  let C, T;
  try { C = E.compute(P, E.BUILTIN_MOTIFS); T = E.buildText(P, C); } catch (e) { add('예외: ' + e.message.slice(0, 70), id); return; }
  C.warnings.forEach(w => { const key = w.replace(/[\d.]+/g, '#').slice(0, 50); warnCount[key] = (warnCount[key] || 0) + 1; });
  T.forEach(b => { const s = b.s || ''; if (/NaN|undefined|null|Infinity/.test(s)) add('서술형 이상값', id + ' :: ' + s.slice(0, 90)); if (/(?<![\d.-])0코|-0-|\b\d+\.\d+코/.test(s)) add('0코/소수 코', id + ' :: ' + (s.match(/.{0,30}((?<![\d.-])0코|-0-|\d+\.\d+코).{0,15}/) || [''])[0]); if (/(?<![\d.])-\d/.test(s.replace(/\d+-\d+-\d+/g, ''))) add('음수', id + ' :: ' + s.slice(0, 90)); });
  const pk = k => C.pieces.find(p => p.kind === k);
  const fr = pk('yfront') || pk('ylfront'), bk = pk('yback'), ys = pk('ysleeve'), sl = pk('tsleeve');
  if (!fr || !bk || !ys || !sl) { add('조각 없음', id); return; }
  if (live(fr, fr.total) !== C.Fsep) add('앞판 끝 코 불일치', `${id} ${live(fr, fr.total)} vs ${C.Fsep}`);
  if (live(bk, bk.total) !== C.Bsep) add('뒤판 끝 코 불일치', `${id} ${live(bk, bk.total)} vs ${C.Bsep}`);
  if (live(ys, ys.total) !== C.Ssep) add('소매 요크 끝 코 불일치', `${id} ${live(ys, ys.total)} vs ${C.Ssep}`);
  if (P.garment === 'cardigan') { const rf = pk('yrfront'); if (live(rf, rf.total) !== C.Fsep) add('오른앞판 끝 코 불일치', id); }
  if (P.garment === 'pullover' && (fr.rows[fr.total] || []).length !== 1) add('앞판이 이어지지 않음', id);
  ['bfront', 'blfront', 'brfront', 'bback'].forEach(k => { const b = pk(k); if (!b) return; if (live(b, 1) !== b.info.Nc) add('몸판 첫 단 코 불일치', `${id} ${b.name} ${live(b, 1)} vs ${b.info.Nc}`); if (live(b, b.total) !== b.info.NhEnd) add('몸판 밑단 코 불일치', `${id} ${b.name} ${live(b, b.total)} vs ${b.info.NhEnd}`); });
  if (live(sl, 1) !== C.Nup) add('소매 첫 단 불일치', id);
  if (live(sl, sl.total) !== C.Ncuff) add('소맷부리 코 불일치', `${id} ${live(sl, sl.total)} vs ${C.Ncuff}`);
  C.pieces.forEach(pc => { for (let r = 1; r <= pc.total; r++) if (!live(pc, r)) { add('빈 단', `${id} ${pc.name} ${r}단`); break; } });
  if (Math.abs(C.finished.chest - C.T.chest) > 3.5) add('가슴둘레 오차>3.5', `${id} ${C.finished.chest.toFixed(1)} vs ${C.T.chest}`);
  if (Math.abs(C.finished.length - C.T.length) > 1.5) add('총장 오차>1.5', `${id} ${C.finished.length.toFixed(1)} vs ${C.T.length}`);
  if (C.neckPick % (P.pattern.rib === '2x2' ? 4 : 2)) add('넥밴드 코 배수', id);
  if (!(C.yarnG > 0)) add('실 사용량 0', id);
}
const keys = Object.keys(SZ.PRESETS);
for (const k of keys) for (const f in FITS) for (const [st, row] of GAUGES) for (const pat of PATS) for (const [g, n, s, sl] of SHAPES) {
  if (k[0] === 'b' && st < 20) continue;
  const p = SZ.PRESETS[k];
  const P = { name: 't', garment: g, neck: n, sleeve: s, body: { ...p }, ease: { ...FITS[f] },
    design: { length: p.length, ...SZ.groupOf(k).dz, bandW: 3, buttons: 6, shoulderMethod: 'bo', cocoSlope: sl },
    gauge: { unit: '10cm', st, row, dens: 1.2, swatchW: 6, needle: 4, ribNeedle: 3.5, yarn: '', ballW: 50, ballLen: 120 }, pattern: pat };
  delete P.body.length; delete P.body.height;
  check(P, `${k}/${f}/${st}x${row}/${pat.bg}/${g}/${n}/${s}/${sl}`);
}
// 무작위
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const R = (a, b, st = 0.5) => Math.round((a + rnd() * (b - a)) / st) * st;
const pick = a => a[Math.floor(rnd() * a.length)];
const N = +(process.argv[2] || 1500);
for (let i = 0; i < N; i++) {
  const chest = R(55, 125);
  const P = { name: 'f', garment: pick(['pullover', 'cardigan']), neck: pick(['round', 'v']), sleeve: pick(['raglan', 'coco']),
    body: { chest, hip: chest + R(-8, 10), shoulder: R(chest * 0.38, chest * 0.47), armDepth: R(12, 22), neckW: R(11, 19), armLen: R(35, 65), upperArm: R(chest * 0.26, chest * 0.36), wrist: R(12, 19) },
    ease: { chest: R(0, 25), hip: R(0, 22), shoulder: R(0, 8), armDepth: R(0, 7), neckW: R(0, 4), armLen: R(-2, 3), upperArm: R(0, 12), wrist: R(0, 6) },
    design: { length: R(36, 78), ribH: R(2, 9), cuffH: R(2, 9), neckbandH: R(1.5, 4), bandW: R(2, 5), frontNeckD: R(4, 10), backNeckD: R(1, 3), vDepth: R(10, 28), shoulderDrop: R(0, 4), capTop: R(4, 12), buttons: Math.round(R(3, 9, 1)), shoulderMethod: 'bo', cocoSlope: pick(['gsr', 'inc']) },
    gauge: { unit: '10cm', st: R(14, 32, 1), row: 0, dens: 1.2, swatchW: 6, needle: 4, ribNeedle: 3.5, yarn: '', ballW: 50, ballLen: 120 },
    pattern: { bg: pick(['st', 'rev', 'seed', 'seed12', 'seed22', 'garter']), rib: pick(['1x1', '2x2', '1x1t', 'garter']), center: pick(['', 'diamond10']), side: pick(['', 'rope6r']), gap: R(0, 8, 1), sep: R(0, 3, 1), applyBack: rnd() < .3, applySleeve: rnd() < .5 } };
  P.gauge.row = Math.round(P.gauge.st * R(1.1, 1.6, 0.05));
  check(P, `#${i} ${P.garment}/${P.neck}/${P.sleeve}/${P.design.cocoSlope} 가슴${chest}+${P.ease.chest} 게이지${P.gauge.st}x${P.gauge.row}`);
}
console.log('조합', total);
console.log('\n[문제]'); for (const k in issues) console.log(`${issues[k].n}건  ${k}\n   ` + issues[k].ex.join('\n   '));
console.log('\n[경고 빈도]'); Object.entries(warnCount).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => console.log(v, k));
process.exit(Object.keys(issues).length ? 1 : 0);
