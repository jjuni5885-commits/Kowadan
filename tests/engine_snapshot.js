// 계산 엔진 결과 지문: 개편 전후 동일한지 확인용
const E = require('../src/engine.js');
const crypto = require('crypto');
const base = () => ({ name: '시험', garment: 'pullover', neck: 'round', sleeve: 'setin',
  body: { chest: 86, hip: 92, shoulder: 38, armDepth: 17, neckW: 15, armLen: 55, upperArm: 27, wrist: 15.5 },
  ease: { chest: 8, hip: 6, shoulder: 0, armDepth: 3, neckW: 2, armLen: 0, upperArm: 4, wrist: 4 },
  design: { length: 58, ribH: 6, cuffH: 6, neckbandH: 2.5, bandW: 3, frontNeckD: 7, backNeckD: 2, vDepth: 20, shoulderDrop: 2, capTop: 8, buttons: 6, shoulderMethod: 'bo' },
  gauge: { unit: '10cm', st: 22, row: 30, dens: 1.2, swatchW: 6, needle: 4, ribNeedle: 3.5, yarn: '울', ballW: 50 },
  pattern: { bg: 'st', rib: '2x2', center: 'diamond10', side: 'rope6r', gap: 6, sep: 2, applyBack: false, applySleeve: true } });
const out = {};
for (const [g, n, s] of [['pullover','round','setin'],['pullover','v','setin'],['cardigan','round','setin'],['cardigan','v','drop'],['pullover','round','drop']]) {
  const P = base(); P.garment = g; P.neck = n; P.sleeve = s;
  const C = E.compute(P, E.BUILTIN_MOTIFS);
  const h = crypto.createHash('md5').update(JSON.stringify(C.pieces.map(p => [p.W, p.total, p.codes]))).digest('hex');
  out[`${g}/${n}/${s}`] = h;
}
const file = __dirname + '/engine_snapshot.json';
const fs = require('fs');
if (process.argv[2] === 'save') { fs.writeFileSync(file, JSON.stringify(out, null, 1)); console.log('saved'); }
else { const prev = JSON.parse(fs.readFileSync(file)); let ok = true; for (const k in out) if (prev[k] !== out[k]) { ok = false; console.log('다름', k); } console.log(ok ? '엔진 결과 동일' : '엔진 결과 변경됨'); process.exit(ok ? 0 : 1); }
