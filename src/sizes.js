'use strict';
/* ===================== 사이즈 치수표 =====================
 사이즈 숫자 = 시판 의류 표기 사이즈 = 맨몸 가슴둘레(cm). 여성 80~120, 남성 90~120 (5cm 간격)
 유아 70~100호(키 cm), 아동 3~13호(유니클로 키즈 100~150에 대응)

 근거 (유니클로 코리아 사이즈 조견표)
 - 여성 가슴둘레(신체): XS 74~80, S 77~83, M 80~86, L 86~92, XL 92~98, XXL 98~104, 3XL 104~110
   엉덩이둘레(신체): XS 82~88, S 85~91, M 88~94, L 94~100, XL 100~106 ... → 가슴 + 8cm
   어깨너비, 전체팔길이(화장): 여성 울트라라이트다운 컴팩트재킷(셋인, 레귤러) XS 37/74.5 ... 3XL 44/82
   팔길이 = 화장 - 어깨/2 - 3(재킷 소매 여분)
 - 남성 가슴둘레(신체): XS 78~84, S 80~88, M 88~96, L 96~104, XL 104~112, XXL 112~120, 3XL 120~128
   어깨너비, 전체팔길이, 전체길이: 남성 워셔블 밀라노립 크루넥 스웨터 XS 39.5/77.5/60 ... 3XL 50/90.5/75
   팔길이 = 화장 - 어깨/2
 - 키즈(신체): 100 키 95~105 가슴 49~55 (3~4세), 110 53~59 (4~5세), 120 57~63 (6~7세),
   130 61~67 (8~9세), 140 65~71 (10~11세), 150 71~77 (12~13세)
 - 베이비: 70 키 65~75 (6~12개월), 80 75~85, 90 85~95, 100 95~105. 가슴둘레는 유니클로 표에 없어 추정
 그 밖의 부위(진동깊이, 목너비, 위팔, 손목, 여성 총장)는 비례 추정값. 치수 탭에서 고쳐 쓸 수 있음 */
const SIZE_SRC = '유니클로 코리아 사이즈 조견표(신체 가슴둘레, 엉덩이둘레, 키) + 레귤러핏 제품 완성 치수(어깨너비, 화장, 남성 총장). 나머지 부위는 비례 추정';
function lerpTab(tab, x, col) { // tab: [[x, ...cols]] x 오름차순, 범위 밖은 끝 구간 기울기로 연장
  let i = 0; while (i < tab.length - 2 && x > tab[i + 1][0]) i++;
  const a = tab[i], b = tab[i + 1];
  return a[col] + (b[col] - a[col]) * (x - a[0]) / (b[0] - a[0]);
}
const h5 = x => Math.round(x * 2) / 2;
// [가슴 중앙값, 어깨너비, 전체팔길이]
const UQ_W = [[77, 37, 74.5], [80, 38, 76.5], [83, 39, 78.5], [89, 40.5, 80], [95, 42, 81], [101, 43, 81.5], [107, 44, 82]];
// [가슴 중앙값, 어깨너비, 전체팔길이, 전체길이]
const UQ_M = [[81, 39.5, 77.5, 60], [84, 41, 80, 62], [92, 42.5, 82.5, 65], [100, 44, 85, 68], [108, 46, 87.5, 71], [116, 48, 89.5, 74], [124, 50, 90.5, 75]];
// 어린이 [키, 가슴, 어깨, 팔길이, 총장, 진동깊이, 목너비, 위팔, 손목]
const KID = [
  [70, 44, 20, 21, 28, 10, 9.5, 14, 10], [80, 47, 21.5, 24.5, 31, 10.5, 10, 15, 10.5], [90, 49, 23, 28, 33.5, 11, 10.5, 15.5, 11],
  [100, 52, 24.5, 31.5, 36, 11.5, 11, 16.5, 11.5], [110, 56, 26.5, 35.5, 38.5, 12.5, 11.5, 17.5, 12], [120, 60, 29, 39.5, 42, 13.5, 12, 18.5, 12.5],
  [130, 64, 31, 43, 45, 14, 12.5, 20, 13], [140, 68, 33, 46.5, 48, 15, 13, 21, 13.5], [150, 74, 35.5, 50, 51, 16, 13.5, 23, 14],
];
function womanSize(c) {
  const sh = lerpTab(UQ_W, c, 1), sl = lerpTab(UQ_W, c, 2);
  return { chest: c, hip: c + 8, shoulder: h5(sh), armDepth: h5(16.5 + (c - 82) * 0.11), neckW: h5(14.5 + (c - 82) * 0.1), armLen: h5(sl - sh / 2 - 3), upperArm: h5(25.5 + (c - 82) * 0.33), wrist: h5(15 + (c - 82) * 0.1), length: h5(56 + (c - 80) * 0.25) };
}
function manSize(c) {
  const sh = lerpTab(UQ_M, c, 1), sl = lerpTab(UQ_M, c, 2), ln = lerpTab(UQ_M, c, 3);
  return { chest: c, hip: c - 2, shoulder: h5(sh), armDepth: h5(19 + (c - 95) * 0.1), neckW: h5(16.5 + (c - 95) * 0.1), armLen: h5(sl - sh / 2), upperArm: h5(30 + (c - 95) * 0.3), wrist: h5(17 + (c - 95) * 0.1), length: h5(ln) };
}
function kidSize(h) {
  const v = j => h5(lerpTab(KID, h, j));
  const chest = v(1);
  return { chest, hip: chest + 2, shoulder: v(2), armDepth: v(5), neckW: v(6), armLen: v(3), upperArm: v(7), wrist: v(8), length: v(4), height: h };
}
const ADULT_DZ = { ribH: 6, cuffH: 6, neckbandH: 2.5, frontNeckD: 7, backNeckD: 2, vDepth: 20, shoulderDrop: 2, capTop: 8 };
const KID_DZ = { ribH: 4, cuffH: 4, neckbandH: 2, frontNeckD: 5.5, backNeckD: 1.5, vDepth: 13, shoulderDrop: 1.5, capTop: 6 };
const BABY_DZ = { ribH: 3, cuffH: 3, neckbandH: 1.5, frontNeckD: 4.5, backNeckD: 1.5, vDepth: 10, shoulderDrop: 1, capTop: 4 };
const SIZE_GROUPS = [
  { id: 'w', name: '여성', unit: '가슴둘레', dz: ADULT_DZ, keys: [80, 85, 90, 95, 100, 105, 110, 115, 120].map(c => ['w' + c, String(c), womanSize(c)]) },
  { id: 'm', name: '남성', unit: '가슴둘레', dz: ADULT_DZ, keys: [90, 95, 100, 105, 110, 115, 120].map(c => ['m' + c, String(c), manSize(c)]) },
  { id: 'b', name: '유아', unit: '키', dz: BABY_DZ, keys: [70, 80, 90, 100].map(h => ['b' + h, h + '호', kidSize(h)]) },
  { id: 'k', name: '아동', unit: '키', dz: KID_DZ, keys: [[3, 100], [5, 110], [7, 120], [9, 130], [11, 140], [13, 150]].map(([n, h]) => ['k' + n, n + '호', kidSize(h)]) },
];
const PRESETS = {}, SIZE_LABEL = {}, SIZE_GROUP = {};
SIZE_GROUPS.forEach(g => g.keys.forEach(([k, l, v]) => { PRESETS[k] = v; SIZE_LABEL[k] = l; SIZE_GROUP[k] = g.id; }));
const PRESET_GROUPS = SIZE_GROUPS.map(g => [g.name, g.keys.map(x => x[0]), g.id]);
const presetLabel = k => SIZE_LABEL[k] || String(k || '').replace(/^[wmbk]/, '');
const groupOf = k => SIZE_GROUPS.find(g => g.id === SIZE_GROUP[k]) || null;
// 예전 사이즈 키(44~88, m95~m110, k110, k130) → 새 키
const OLD_SIZE = { '44': 'w80', '55': 'w85', '66': 'w90', '77': 'w95', '88': 'w100', k110: 'k5', k130: 'k9' };
const sizeKeyFix = k => OLD_SIZE[k] || k;
// 95(100) 105(110) 115 처럼 괄호를 하나 건너 하나씩
const altJoin = vals => vals.map((v, i) => i % 2 ? `(${v})` : (i ? ' ' : '') + v).join('');
if (typeof module !== 'undefined') module.exports = { SIZE_GROUPS, PRESETS, PRESET_GROUPS, presetLabel, groupOf, sizeKeyFix, altJoin, SIZE_SRC };
