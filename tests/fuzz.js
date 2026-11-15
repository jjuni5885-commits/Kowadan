// 직접 입력 치수, 디자인 값을 무작위로 넣어 예외, 남는 코, 이상 표기를 찾는다
const E = require('../src/engine.js');
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const R = (a, b, st = 0.5) => Math.round((a + rnd() * (b - a)) / st) * st;
const pick = a => a[Math.floor(rnd() * a.length)];
const issues = {}; const add = (k, ex) => { (issues[k] = issues[k] || { n: 0, ex: [] }).n++; if (issues[k].ex.length < 3) issues[k].ex.push(ex); };
const N = +(process.argv[2] || 3000);
for (let i = 0; i < N; i++) {
  const chest = R(55, 125);
  const P = { name: 'f', garment: pick(['pullover', 'cardigan']), neck: pick(['round', 'v']), sleeve: pick(['setin', 'drop']),
    body: { chest, hip: chest + R(-8, 10), shoulder: R(chest * 0.36, chest * 0.47), armDepth: R(12, 22), neckW: R(11, 19), armLen: R(35, 65), upperArm: R(chest * 0.26, chest * 0.36), wrist: R(12, 19) },
    ease: { chest: R(0, 25), hip: R(0, 22), shoulder: R(0, 8), armDepth: R(0, 7), neckW: R(0, 4), armLen: R(-2, 3), upperArm: R(0, 12), wrist: R(0, 6) },
    design: { length: R(36, 78), ribH: R(2, 9), cuffH: R(2, 9), neckbandH: R(1.5, 4), bandW: R(2, 5), frontNeckD: R(4, 10), backNeckD: R(1, 3), vDepth: R(10, 28), shoulderDrop: R(0, 4), capTop: R(4, 12), buttons: Math.round(R(3, 9, 1)), shoulderMethod: pick(['bo', 'sr']) },
    gauge: (() => { const st = R(12, 34, 1), row = Math.round(st * R(1.1, 1.6, 0.05)); return rnd() < .7 ? { unit: '10cm', st, row } : { unit: '1cm', st: st / 10, row: row / 10 }; })(),
    pattern: { bg: pick(['st', 'rev', 'seed', 'garter']), rib: pick(['1x1', '2x2', '1x1t', 'garter']), center: pick(['', 'diamond10']), side: pick(['', 'rope6r']), gap: R(0, 8, 1), sep: R(0, 3, 1), applyBack: rnd() < .3, applySleeve: rnd() < .5 } };
  Object.assign(P.gauge, { dens: R(1.1, 1.3, 0.05), swatchW: R(3, 12), needle: 4, ribNeedle: 3.5, yarn: '', ballW: 50, ballLen: 120 });
  const id = JSON.stringify(P).slice(0, 0) + `#${i} ${P.garment}/${P.neck}/${P.sleeve} 가슴${chest}+${P.ease.chest} 게이지${P.gauge.st}x${P.gauge.row}/${P.gauge.unit}`;
  if (process.argv[3] && +process.argv[3] !== i) continue;
  if (process.argv[3]) console.log(JSON.stringify(P));
  let C, T;
  try { C = E.compute(P, E.BUILTIN_MOTIFS); T = E.buildText(P, C); } catch (e) { add('예외: ' + e.message.slice(0, 80), id); continue; }
  C.warnings.forEach(w => add('경고: ' + w.replace(/[\d.]+/g, '#').slice(0, 40), id));
  T.forEach(b => { const s = b.s || ''; if (/NaN|undefined|null|Infinity/.test(s)) add('이상값', id + ' :: ' + s.slice(0, 90)); if (/(?<![\d.-])0코|-0-|\b\d+\.\d+코/.test(s)) add('0코/소수 코', id + ' :: ' + (s.match(/.{0,25}((?<![\d.-])0코|-0-|\d+\.\d+코).{0,15}/) || [''])[0]); if (/(?<![\d.])-\d/.test(s.replace(/\d+-\d+-\d+/g, ''))) add('음수', id + ' :: ' + s.slice(0, 90)); });
  const live = (pc, r) => (pc.rows[r] || []).reduce((a, x) => a + x.r - x.l + 1, 0);
  const sl = C.pieces.find(pc => pc.kind === 'sleeve');
  if (live(sl, sl.info.capStart - 1) !== sl.info.Nup) add('소매 위팔 코 불일치', `${id} ${live(sl, sl.info.capStart - 1)} vs ${sl.info.Nup}`);
  C.pieces.filter(pc => pc.kind !== 'sleeve').forEach(pc => { const r = C.ribRows + C.sideRows; if (!(pc.info.neck && pc.info.neck.s <= r) && live(pc, r) !== pc.info.Nc) add('가슴 코 불일치', id + ' ' + pc.name); });
  if (Math.abs(C.finished.chest - C.T.chest) > 4) add('가슴 오차>4', id + ' ' + C.finished.chest.toFixed(1));
}
console.log('무작위', N);
Object.entries(issues).sort((a, b) => b[1].n - a[1].n).forEach(([k, v]) => console.log(`${v.n}  ${k}\n    ` + v.ex.join('\n    ')));
process.exit(Object.keys(issues).some(k => !k.startsWith('경고')) ? 1 : 0);
