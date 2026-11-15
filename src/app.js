'use strict';
/* ===================== 앱 상태 ===================== */
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
const PRESET_GROUPS = [['여성', ['44', '55', '66', '77', '88']], ['남성', ['m95', 'm100', 'm105', 'm110']], ['아동', ['k110', 'k130']]];
const presetLabel = k => k.replace(/^[mk]/, '');
const FITS = {
  slim: { name: '슬림핏', d: '+4cm', ease: { chest: 4, hip: 2, shoulder: 0, armDepth: 1.5, neckW: 1, armLen: 0, upperArm: 2, wrist: 2 } },
  standard: { name: '스탠다드핏', d: '+8cm', ease: { chest: 8, hip: 6, shoulder: 0, armDepth: 3, neckW: 2, armLen: 0, upperArm: 4, wrist: 4 } },
  semi: { name: '세미오버핏', d: '+14cm', ease: { chest: 14, hip: 12, shoulder: 3, armDepth: 5, neckW: 3, armLen: 0, upperArm: 8, wrist: 5 } },
  over: { name: '오버핏', d: '+22cm', ease: { chest: 22, hip: 20, shoulder: 8, armDepth: 7, neckW: 4, armLen: 0, upperArm: 12, wrist: 6 } },
};
function defaultProject() {
  return {
    name: '새 도안', garment: 'pullover', neck: 'round', sleeve: 'setin', size: '55', fit: 'standard',
    body: { chest: 86, hip: 92, shoulder: 38, armDepth: 17, neckW: 15, armLen: 55, upperArm: 27, wrist: 15.5 },
    ease: { chest: 8, hip: 6, shoulder: 0, armDepth: 3, neckW: 2, armLen: 0, upperArm: 4, wrist: 4 },
    design: { length: 58, ribH: 6, cuffH: 6, neckbandH: 2.5, bandW: 3, frontNeckD: 7, backNeckD: 2, vDepth: 20, shoulderDrop: 2, capTop: 8, buttons: 6, shoulderMethod: 'bo' },
    gauge: { unit: '10cm', st: 22, row: 30, dens: 1.2, swatchW: 6, needle: 4, ribNeedle: 3.5, yarn: '', ballW: 50, ballLen: 120 },
    pattern: { bg: 'st', rib: '2x2', center: 'diamond10', side: 'rope6r', gap: 6, sep: 2, applyBack: false, applySleeve: true },
    progress: { back: 1, front: 1, rfront: 1, lfront: 1, sleeve: 1 },
    textDone: [],
    memo: '',
  };
}
const S = {
  P: defaultProject(), id: null, dirty: false, tab: 'size', piece: 'back',
  chart: { cell: 14, showKnit: true, tint: true, ratio: false, center: true, dim: true },
  print: { cell: 4, ratio: false, cover: true, schem: true, text: true, motifs: true, charts: true },
  projects: [], motifs: [], workers: ['작업자 1', '작업자 2'], worker: '', filterMine: false,
  C: null, T: null, err: null, editor: null, store: 'local', dl: null, scrolled: {},
};
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function allMotifs() { return BUILTIN_MOTIFS.concat(S.motifs.map(m => ({ ...m, custom: true }))); }
function getPath(o, p) { return p.split('.').reduce((a, k) => a == null ? a : a[k], o); }
function setPath(o, p, v) { const ks = p.split('.'); let a = o; ks.slice(0, -1).forEach(k => a = a[k]); a[ks[ks.length - 1]] = v; }
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 2600); }
const safeName = s => String(s || '도안').replace(/[\\/:*?"<>|]/g, '').trim() || '도안';

/* ===================== 저장소 ===================== */
const LS = {
  get(k, d) { try { const v = localStorage.getItem('kowadan.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('kowadan.' + k, JSON.stringify(v)); } catch (e) { } },
};
const Store = {
  db: null, unsubs: [],
  async init() {
    S.projects = LS.get('projects', []);
    S.motifs = LS.get('motifs', []);
    S.workers = LS.get('workers', ['작업자 1', '작업자 2']);
    S.worker = LS.get('worker', S.workers[0]);
    const draft = LS.get('draft', null);
    if (draft && draft.P) { S.P = migrate(draft.P); S.id = draft.id; S.dirty = !!draft.dirty; }
    renderAll();
    try {
      if (window.claude && window.claude.use) {
        // 공유 저장소는 앱 주인과 편집 권한이 있는 사람만 씀. 링크로 받은 사람은 자기 브라우저에 저장.
        const user = await window.claude.use('user');
        const editor = user ? await user.canEdit() : false;
        if (editor) {
          const db = await window.claude.use('db');
          if (db) { this.db = db; S.store = 'db'; this.subscribe(); renderHeader(); if (S.tab === 'proj') renderTab(); }
        }
      }
    } catch (e) { }
    try { if (window.claude && window.claude.use) { S.dl = await window.claude.use('downloads'); if (S.tab === 'print') renderTab(); } } catch (e) { S.dl = null; }
  },
  subscribe() {
    const db = this.db;
    const timer = setTimeout(() => toast('공유 저장소 응답이 늦습니다. 이 기기 저장본으로 계속합니다.'), 10000);
    this.unsubs.push(db.collection('projects').onSnapshot(snap => {
      clearTimeout(timer);
      S.projects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      LS.set('projects', S.projects);
      if (S.tab === 'proj') renderTab();
    }, () => { clearTimeout(timer); }));
    this.unsubs.push(db.collection('motifs').onSnapshot(snap => {
      S.motifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      LS.set('motifs', S.motifs);
      recompute();
    }, () => { }));
    this.unsubs.push(db.doc('settings/workers').onSnapshot(d => {
      if (d.exists && Array.isArray(d.data().names) && d.data().names.length) { S.workers = d.data().names; LS.set('workers', S.workers); if (!S.workers.includes(S.worker)) S.worker = S.workers[0]; renderHeader(); if (S.tab === 'proj') renderTab(); }
    }, () => { }));
  },
  async saveProject(id, rec) {
    const i = S.projects.findIndex(p => p.id === id);
    if (i >= 0) S.projects[i] = { id, ...rec }; else S.projects.push({ id, ...rec });
    LS.set('projects', S.projects);
    if (this.db) await this.db.collection('projects').doc(id).set(rec);
  },
  async deleteProject(id) {
    S.projects = S.projects.filter(p => p.id !== id); LS.set('projects', S.projects);
    if (this.db) await this.db.collection('projects').doc(id).delete();
  },
  async saveMotif(m) {
    const { id, custom, ...rec } = m;
    const i = S.motifs.findIndex(x => x.id === id);
    if (i >= 0) S.motifs[i] = { id, ...rec }; else S.motifs.push({ id, ...rec });
    LS.set('motifs', S.motifs);
    if (this.db) await this.db.collection('motifs').doc(id).set(rec);
  },
  async deleteMotif(id) {
    S.motifs = S.motifs.filter(m => m.id !== id); LS.set('motifs', S.motifs);
    if (this.db) await this.db.collection('motifs').doc(id).delete();
  },
  async saveWorkers() { LS.set('workers', S.workers); if (this.db) await this.db.doc('settings/workers').set({ names: S.workers }); },
};
function migrate(p) {
  const d = defaultProject();
  const out = { ...d, ...p };
  ['body', 'ease', 'design', 'gauge', 'pattern', 'progress'].forEach(k => out[k] = { ...d[k], ...(p[k] || {}) });
  if (!Array.isArray(out.textDone)) out.textDone = [];
  return out;
}
function saveDraft() { LS.set('draft', { P: S.P, id: S.id, dirty: S.dirty }); }
async function saveCurrent() {
  if (!S.id) S.id = uid();
  const rec = { name: S.P.name || '이름 없는 도안', owner: S.worker, updated: Date.now(), data: JSON.parse(JSON.stringify(S.P)) };
  try { await Store.saveProject(S.id, rec); S.dirty = false; saveDraft(); updateSaveState(); toast(Store.db ? '공유 저장소에 저장했습니다.' : '이 브라우저에 저장했습니다.'); }
  catch (e) { toast('저장하지 못했습니다: ' + (e && e.code ? e.code : '오류')); }
}

/* ===================== 계산 ===================== */
let rcT = null;
function touch() { S.dirty = true; saveDraft(); updateSaveState(); clearTimeout(rcT); rcT = setTimeout(recompute, 220); }
function touchQuiet() { S.dirty = true; saveDraft(); updateSaveState(); } // 진행 단수, 체크처럼 재계산이 필요 없는 변경
function recompute() {
  try {
    const P = S.P;
    const bad = [];
    ['chest', 'hip', 'shoulder', 'armDepth', 'neckW', 'armLen', 'upperArm', 'wrist'].forEach(k => { if (!(P.body[k] > 0)) bad.push(k); });
    if (!(P.gauge.st > 0) || !(P.gauge.row > 0)) bad.push('게이지');
    if (!(P.design.length > 0)) bad.push('총장');
    if (bad.length) { S.err = '입력값을 확인하세요. 0보다 큰 숫자가 필요합니다.'; S.C = null; }
    else { S.C = compute(P, allMotifs()); S.T = buildText(P, S.C); S.err = null; }
  } catch (e) { S.err = '계산 중 오류가 발생했습니다: ' + e.message; S.C = null; console.error(e); }
  if (S.C && !S.C.pieces.find(p => p.id === S.piece)) S.piece = S.C.pieces[0].id;
  renderTab(true);
}

/* ===================== 아이콘 ===================== */
const ICON = {
  proj: '<path d="M3 7h6l2 2h10v10H3z"/>',
  size: '<rect x="2.5" y="8" width="19" height="8" rx="1.5"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/>',
  design: '<path d="M8.5 4L3 7.5l2 4 3-1.6V20h8v-10.1l3 1.6 2-4L15.5 4c-.8 1.6-6.2 1.6-7 0z"/>',
  motif: '<path d="M8 3c0 4.5 8 4.5 8 9s-8 4.5-8 9M16 3c0 2.6-2.2 3.8-3.6 4.6M11.6 16.4C13.8 17.2 16 18.4 16 21"/>',
  chart: '<rect x="3.5" y="3.5" width="17" height="17" rx="1"/><path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17"/>',
  schem: '<path d="M8 3h8l1.2 3 3.3 2.2V21h-17V8.2L6.8 6z"/><path d="M3.5 13h17" stroke-dasharray="2 2"/>',
  text: '<path d="M5 5h14M5 9.5h14M5 14h14M5 18.5h9"/>',
  print: '<path d="M7 9V3.5h10V9M7 17H3.5V9h17v8H17"/><rect x="7" y="13.5" width="10" height="7"/>',
};
const icon = k => `<svg class="ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;

/* ===================== 화면: 공통 ===================== */
const TAB_GROUPS = [['설계', [['proj', '프로젝트'], ['size', '치수'], ['design', '디자인'], ['motif', '무늬']]], ['산출물', [['chart', '차트'], ['schem', '도식화'], ['text', '서술형'], ['print', '출력']]]];
function renderAll() {
  $('#app').innerHTML = `
  <header class="top">
    <div class="brand"><span class="logo">코와단</span><span class="sub">대바늘 도안 설계</span></div>
    <div class="hdr" id="hdr"></div>
  </header>
  <nav class="tabs" id="tabs">${TAB_GROUPS.map(([g, tabs], gi) => `${gi ? '<span class="tdiv" aria-hidden="true"></span>' : ''}<span class="tgl">${g}</span>${tabs.map(([k, n]) => `<button data-tab="${k}">${icon(k)}<span>${n}</span></button>`).join('')}`).join('')}</nav>
  <main id="main"></main>
  <div id="toast" class="toast"></div>
  <div id="modal" class="modal"></div>`;
  $('#tabs').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (b) { S.tab = b.dataset.tab; LS.set('tab', S.tab); renderTab(); window.scrollTo(0, 0); } });
  S.tab = LS.get('tab', 'size');
  renderHeader();
  recompute();
}
function renderHeader() {
  const h = $('#hdr'); if (!h) return;
  if (h.dataset.built && document.activeElement && document.activeElement.id === 'pname') { updateSaveState(); return; }
  h.dataset.built = '1';
  h.innerHTML = `
    <input class="pname" id="pname" value="${esc(S.P.name)}" aria-label="도안 이름">
    <select id="worker" aria-label="작업자">${S.workers.map(w => `<option ${w === S.worker ? 'selected' : ''}>${esc(w)}</option>`).join('')}</select>
    <button class="btn pri" id="saveBtn">저장</button>`;
  $('#pname').oninput = e => { S.P.name = e.target.value; touchQuiet(); };
  $('#worker').onchange = e => { S.worker = e.target.value; LS.set('worker', S.worker); if (S.tab === 'proj') renderTab(); };
  $('#saveBtn').onclick = saveCurrent;
  updateSaveState();
}
function updateSaveState() {
  const b = $('#saveBtn'); if (!b) return;
  b.textContent = S.dirty ? '저장' : '저장됨';
  b.classList.toggle('dirty', S.dirty);
  const n = $('#pname'); if (n && document.activeElement !== n && n.value !== S.P.name) n.value = S.P.name;
  document.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('on', x.dataset.tab === S.tab));
}
function renderTab(fromCompute) {
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === S.tab));
  const m = $('#main'); if (!m) return;
  // 입력 화면은 계산 때마다 다시 그리지 않음 (포커스 유지)
  const same = S.renderedTab === S.tab && m.firstElementChild;
  if (fromCompute && same && (S.tab === 'size' || S.tab === 'design')) { updateLive(); return; }
  if (fromCompute && same && S.tab === 'motif' && S.editor) return;
  if (fromCompute && same && S.tab === 'chart' && $('#chartbox') && S.C) { refreshChart(); return; }
  S.renderedTab = S.tab;
  const f = { proj: viewProj, size: viewSize, design: viewDesign, motif: viewMotif, chart: viewChart, schem: viewSchem, text: viewText, print: viewPrint }[S.tab];
  m.innerHTML = f();
  bindInputs(m);
  ({ proj: bindProj, size: bindSize, design: () => { }, motif: bindMotif, chart: bindChart, schem: bindSchem, text: bindText, print: bindPrint })[S.tab]();
  updateLive();
}
function warnBox() {
  if (S.err) return `<div class="alert">${esc(S.err)}</div>`;
  if (!S.C || !S.C.warnings.length) return '';
  return `<div class="alert"><b>확인이 필요합니다</b><ul>${S.C.warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>`;
}
function num(path, label, unit, opt = {}) {
  const v = getPath(S.P, path);
  return `<label class="fld${opt.wide ? ' wide' : ''}"><span class="lb">${label}${opt.help ? `<i class="hp">${opt.help}</i>` : ''}</span>
    <span class="iw"><input type="number" inputmode="decimal" step="${opt.step || 0.5}" data-path="${path}" data-num="1" value="${v ?? ''}">${unit ? `<em>${unit}</em>` : ''}</span></label>`;
}
function txt(path, label, opt = {}) {
  return `<label class="fld${opt.wide ? ' wide' : ''}"><span class="lb">${label}</span><span class="iw"><input type="text" data-path="${path}" value="${esc(getPath(S.P, path))}" placeholder="${opt.ph || ''}"></span></label>`;
}
function seg(path, label, opts) {
  const v = getPath(S.P, path);
  return `<div class="fld wide"><span class="lb">${label}</span><div class="seg" data-seg="${path}">${opts.map(([k, n]) => `<button type="button" data-v="${k}" class="${String(v) === String(k) ? 'on' : ''}">${n}</button>`).join('')}</div></div>`;
}
function sel(path, label, opts) {
  const v = getPath(S.P, path);
  return `<label class="fld"><span class="lb">${label}</span><span class="iw"><select data-path="${path}">${opts.map(([k, n]) => `<option value="${esc(k)}" ${String(v) === String(k) ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></span></label>`;
}
function chk(path, label) {
  return `<label class="chk"><input type="checkbox" data-path="${path}" ${getPath(S.P, path) ? 'checked' : ''}><span>${label}</span></label>`;
}
function bindInputs(root) {
  root.querySelectorAll('input[data-path], select[data-path]').forEach(el => {
    const ev = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(ev, () => {
      let v = el.type === 'checkbox' ? el.checked : el.value;
      if (el.dataset.num) v = v === '' ? 0 : parseFloat(v);
      if (el.tagName === 'SELECT' && v === '') v = null;
      setPath(S.P, el.dataset.path, v);
      if (el.dataset.path.startsWith('ease.')) { S.P.fit = 'custom'; document.querySelectorAll('[data-fit]').forEach(x => x.classList.toggle('on', x.dataset.fit === 'custom')); }
      touch();
    });
  });
  root.querySelectorAll('[data-seg]').forEach(g => g.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const path = g.dataset.seg, cur = getPath(S.P, path);
    let v = b.dataset.v; if (v === 'true') v = true; if (v === 'false') v = false;
    if (path === 'gauge.unit' && v !== cur) { const f = v === 'cm' ? 0.1 : 10; S.P.gauge.st = +(S.P.gauge.st * f).toFixed(2); S.P.gauge.row = +(S.P.gauge.row * f).toFixed(2); }
    setPath(S.P, path, v);
    g.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    touch();
    if (path === 'garment' || path === 'neck' || path === 'gauge.unit' || path === 'sleeve') renderTab();
  }));
}
function updateLive() {
  document.querySelectorAll('[data-live]').forEach(el => {
    const k = el.dataset.live;
    if (k.startsWith('t.')) { const f = k.slice(2); const v = (S.P.body[f] || 0) + (S.P.ease[f] || 0); el.textContent = fmt(v); }
    if (k === 'warn') el.innerHTML = warnBox();
    if (k === 'insp') el.innerHTML = inspectorHTML();
    if (k === 'alloc') el.innerHTML = allocHTML();
  });
}
function yarnInfo(C) {
  if (!C || !C.yarnG) return null;
  const g = S.P.gauge, grams = Math.ceil(C.yarnG / 10) * 10;
  const balls = g.ballW ? Math.ceil(C.yarnG / g.ballW) : null;
  const meters = g.ballW && g.ballLen ? Math.ceil(C.yarnG / g.ballW * g.ballLen / 10) * 10 : null;
  return { grams, balls, meters };
}
function maxSts(pc) { let m = 0; for (let r = 1; r <= pc.total; r++) { const w = (pc.rows[r] || []).reduce((a, s) => a + s.r - s.l + 1, 0); if (w > m) m = w; } return m; }
function inspectorHTML() {
  const C = S.C;
  if (!C) return warnBox();
  const f = C.finished, y = yarnInfo(C);
  return `${warnBox()}
  <div class="icard"><h3>도식화 미리보기</h3><div class="mini">${schematicSVG(C, 360)}</div></div>
  <div class="icard"><h3>설계 요약</h3>
    <table class="kv"><tbody>
      <tr><th>완성 가슴둘레</th><td>${fmt(f.chest)}cm</td></tr>
      <tr><th>총장</th><td>${fmt(f.length)}cm</td></tr>
      <tr><th>소매길이</th><td>${fmt(f.sleeveLen)}cm</td></tr>
    </tbody></table>
    <table class="kv pcs"><thead><tr><th>조각</th><th>시작</th><th>최대</th><th>총 단</th></tr></thead><tbody>
      ${C.pieces.map(pc => `<tr><th>${esc(pc.name)}</th><td>${pc.kind === 'sleeve' ? pc.info.Ncuff : pc.info.Nh}코</td><td>${maxSts(pc)}코</td><td>${pc.total}단</td></tr>`).join('')}
    </tbody></table>
    <table class="kv"><tbody><tr><th>예상 실 소요량</th><td>${y ? `${y.grams}g${y.balls ? `, ${y.balls}볼` : ''}${y.meters ? `, 약 ${y.meters.toLocaleString()}m` : ''}` : '스와치 무게를 넣으면 계산합니다'}</td></tr></tbody></table>
  </div>`;
}
function splitView(left) {
  return `<div class="split"><div class="lft"><div class="mwarn" data-live="warn"></div>${left}</div><aside class="insp" data-live="insp"></aside></div>`;
}

/* ===================== 탭: 프로젝트 ===================== */
function viewProj() {
  const list = S.projects.filter(p => !S.filterMine || p.owner === S.worker).sort((a, b) => (b.updated || 0) - (a.updated || 0));
  return `
  <section class="card">
    <h2>작업자</h2>
    <p class="desc">여러 사람이 함께 쓸 때 작업자를 나눠 둡니다. 저장할 때 현재 작업자 이름이 함께 기록됩니다.</p>
    <div class="chips">${S.workers.map((w, i) => `<span class="chip ${w === S.worker ? 'on' : ''}" data-w="${i}">${esc(w)}</span>`).join('')}</div>
    <div class="row"><input id="wname" placeholder="작업자 이름" class="inp"><button class="btn" id="wadd">추가</button><button class="btn" id="wren">현재 작업자 이름 바꾸기</button></div>
    <p class="desc small">저장 위치: ${Store.db ? '공유 저장소 (앱 주인과 편집 권한을 받은 사람만 볼 수 있음)' : '지금 쓰는 이 브라우저에만 저장됩니다. 다른 사람은 볼 수 없고, 브라우저 기록을 지우면 사라질 수 있으니 출력 탭에서 백업을 받아 두세요.'}</p>
  </section>
  <section class="card">
    <div class="hrow"><h2>도안 목록</h2>
      <div class="row"><label class="chk"><input type="checkbox" id="fmine" ${S.filterMine ? 'checked' : ''}><span>내 도안만</span></label>
      <button class="btn pri" id="pnew">새 도안</button><button class="btn" id="pdup">현재 도안 복제</button></div></div>
    ${list.length ? `<div class="plist">${list.map(p => `
      <div class="pitem ${p.id === S.id ? 'cur' : ''}">
        <div class="pinfo"><b>${esc(p.name)}</b><span>${esc(p.owner || '-')}, ${new Date(p.updated || 0).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })}</span>
        <span>${p.data ? `${p.data.garment === 'cardigan' ? '가디건' : '풀오버'}, ${p.data.neck === 'v' ? 'V넥' : '라운드넥'}, 가슴 ${p.data.body.chest}cm` : ''}</span></div>
        <div class="pact"><button class="btn" data-open="${p.id}">열기</button><button class="btn ghost" data-del="${p.id}">삭제</button></div>
      </div>`).join('')}</div>` : `<p class="desc">저장된 도안이 없습니다. 치수를 입력하고 위의 저장 버튼을 누르면 여기에 쌓입니다.</p>`}
  </section>
  <section class="card">
    <h2>메모</h2>
    <textarea data-path="memo" class="memo" placeholder="실 색상 번호, 고객 요청 사항, 수정 이력 등">${esc(S.P.memo)}</textarea>
  </section>`;
}
function bindProj() {
  document.querySelectorAll('[data-w]').forEach(el => el.onclick = () => { S.worker = S.workers[+el.dataset.w]; LS.set('worker', S.worker); renderHeader(); renderTab(); });
  $('#wadd').onclick = async () => { const n = $('#wname').value.trim(); if (!n || S.workers.includes(n)) return; S.workers.push(n); S.worker = n; LS.set('worker', n); await Store.saveWorkers().catch(() => { }); $('#hdr').dataset.built = ''; renderHeader(); renderTab(); };
  $('#wren').onclick = async () => { const n = $('#wname').value.trim(); if (!n) return toast('바꿀 이름을 입력하세요.'); const i = S.workers.indexOf(S.worker); S.workers[i] = n; S.worker = n; LS.set('worker', n); await Store.saveWorkers().catch(() => { }); $('#hdr').dataset.built = ''; renderHeader(); renderTab(); };
  $('#fmine').onchange = e => { S.filterMine = e.target.checked; renderTab(); };
  $('#pnew').onclick = () => ask('새 도안을 만들까요? 저장하지 않은 변경은 사라집니다.', () => { S.P = defaultProject(); S.id = null; S.dirty = true; saveDraft(); updateSaveState(); S.tab = 'size'; recompute(); renderTab(); });
  $('#pdup').onclick = () => { S.P = JSON.parse(JSON.stringify(S.P)); S.P.name += ' 사본'; S.id = null; S.dirty = true; saveDraft(); updateSaveState(); toast('복제했습니다. 저장을 누르면 새 도안으로 저장됩니다.'); };
  document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => {
    const p = S.projects.find(x => x.id === b.dataset.open); if (!p) return;
    const go = () => { S.P = migrate(p.data || {}); S.id = p.id; S.dirty = false; S.scrolled = {}; saveDraft(); updateSaveState(); S.tab = 'chart'; recompute(); renderTab(); };
    S.dirty ? ask('저장하지 않은 변경이 있습니다. 그래도 열까요?', go) : go();
  });
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    const p = S.projects.find(x => x.id === b.dataset.del);
    ask(`"${p.name}" 도안을 삭제할까요? 되돌릴 수 없습니다.`, async () => { await Store.deleteProject(p.id).catch(() => { }); if (S.id === p.id) S.id = null; renderTab(); });
  });
  const ta = document.querySelector('textarea[data-path]');
  ta.oninput = () => { S.P.memo = ta.value; touchQuiet(); };
}
function ask(msg, yes) {
  const m = $('#modal');
  m.innerHTML = `<div class="mbox"><p>${esc(msg)}</p><div class="row end"><button class="btn" id="mno">취소</button><button class="btn pri" id="myes">확인</button></div></div>`;
  m.classList.add('on');
  $('#mno').onclick = () => m.classList.remove('on');
  $('#myes').onclick = () => { m.classList.remove('on'); yes(); };
}

/* ===================== 탭: 치수 ===================== */
const BODY_ROWS = [
  ['chest', '가슴둘레', '가슴의 가장 높은 곳을 수평으로 한 바퀴'],
  ['hip', '엉덩이둘레(밑단)', '밑단이 오는 위치의 둘레. 밑단 폭 계산에 씀'],
  ['shoulder', '어깨너비', '왼쪽 어깨끝점에서 오른쪽 어깨끝점까지 뒤쪽으로'],
  ['armDepth', '진동깊이', '어깨 가장 높은 곳(옆목점 높이)에서 겨드랑이까지 수직'],
  ['neckW', '목너비', '좌우 옆목점 사이의 직선 거리'],
  ['armLen', '팔길이', '어깨끝점에서 손목까지(소맷부리 포함 소매길이 기준)'],
  ['upperArm', '위팔둘레', '팔에서 가장 굵은 곳의 둘레'],
  ['wrist', '손목둘레', '손목 둘레'],
];
function welcomeHTML() {
  if (LS.get('welcomed', false)) return '';
  return `<section class="card welcome"><div class="hrow"><h2>처음 오셨나요?</h2><button class="btn" id="wclose">닫기</button></div>
  <ol>
    <li><b>치수</b>: 사이즈 버튼을 누르거나 신체 치수를 넣고, 핏을 고른 뒤 게이지를 넣습니다.</li>
    <li><b>디자인</b>: 풀오버나 가디건, 목선, 소매 모양, 꽈배기 무늬 배치를 고릅니다.</li>
    <li><b>차트, 도식화, 서술형</b>: 결과를 확인합니다. 차트에서 지금 뜨는 단을 표시하며 뜰 수 있습니다.</li>
    <li><b>출력</b>: A4 PDF로 받아 인쇄합니다. 위의 저장 버튼으로 도안을 보관하세요.</li>
  </ol></section>`;
}
function viewSize() {
  const P = S.P;
  return `${welcomeHTML()}` + splitView(`
  <section class="card">
    <h2>신체 치수와 여유분</h2>
    <div class="pgroups">${PRESET_GROUPS.map(([g, ks]) => `<div class="pg"><span class="pgl">${g}</span><div class="chips">${ks.map(k => `<span class="chip ${P.size === k ? 'on' : ''}" data-preset="${k}">${presetLabel(k)}</span>`).join('')}</div></div>`).join('')}
      <div class="pg"><span class="pgl">기타</span><div class="chips"><span class="chip ${P.size === 'custom' ? 'on' : ''}" data-preset="custom">직접 입력</span></div></div></div>
    <p class="desc">신체 치수는 여유를 넣지 않은 몸 치수입니다. 사이즈 버튼은 표준 체형 참고값을 채워 줍니다.</p>
    <div class="fitbar"><span class="pgl">핏 여유분 자동 설정</span><div class="seg">${Object.entries(FITS).map(([k, f]) => `<button type="button" data-fit="${k}" class="${P.fit === k ? 'on' : ''}">${f.name} <small>${f.d}</small></button>`).join('')}</div></div>
    <div class="mtable">
      <div class="mh"><span>부위</span><span>신체 (cm)</span><span>여유 (cm)</span><span>완성 목표</span></div>
      ${BODY_ROWS.map(([k, n, h]) => `<div class="mr"><span class="mn">${n}<i>${h}</i></span>
        <span><input type="number" inputmode="decimal" step="0.5" data-path="body.${k}" data-num="1" value="${P.body[k]}"></span>
        <span><input type="number" inputmode="decimal" step="0.5" data-path="ease.${k}" data-num="1" value="${P.ease[k]}" data-ease="${k}"></span>
        <span class="mt" data-live="t.${k}"></span></div>`).join('')}
    </div>
  </section>
  <section class="card">
    <h2>디자인 치수</h2>
    <div class="grid">
      ${num('design.length', '총장', 'cm', { help: '옆목점에서 밑단까지' })}
      ${num('design.ribH', '밑단 고무단 길이', 'cm')}
      ${num('design.cuffH', '소맷부리 길이', 'cm')}
      ${num('design.neckbandH', '넥밴드 높이', 'cm')}
      ${S.P.neck === 'v' ? num('design.vDepth', 'V넥 깊이', 'cm', { help: '옆목점 높이에서 V 끝까지' }) : num('design.frontNeckD', '앞목 깊이', 'cm')}
      ${num('design.backNeckD', '뒷목 깊이', 'cm')}
      ${num('design.shoulderDrop', '어깨 경사(처짐)', 'cm')}
      ${num('design.capTop', '소매산 윗폭', 'cm')}
      ${S.P.garment === 'cardigan' ? num('design.bandW', '앞단 폭', 'cm') + num('design.buttons', '단추 개수', '개', { step: 1 }) : ''}
    </div>
  </section>
  <section class="card">
    <h2>게이지와 재료</h2>
    ${seg('gauge.unit', '게이지 단위', [['cm', '1cm 기준'], ['10cm', '10cm 기준']])}
    <div class="grid">
      ${num('gauge.st', `코 (${P.gauge.unit === 'cm' ? '1cm' : '10cm'} 안)`, '코', { step: P.gauge.unit === 'cm' ? 0.05 : 0.5 })}
      ${num('gauge.row', `단 (${P.gauge.unit === 'cm' ? '1cm' : '10cm'} 안)`, '단', { step: P.gauge.unit === 'cm' ? 0.05 : 0.5 })}
      ${num('gauge.dens', '꽈배기 수축 비율', '배', { step: 0.05, help: '같은 코 수일 때 꽈배기가 메리야스보다 좁아지는 비율. 보통 1.15~1.3' })}
      ${num('gauge.swatchW', '스와치 무게(10x10cm)', 'g', { step: 0.5, help: '실 사용량 계산용' })}
      ${num('gauge.needle', '몸판 바늘', 'mm', { step: 0.25 })}
      ${num('gauge.ribNeedle', '고무단 바늘', 'mm', { step: 0.25 })}
      ${txt('gauge.yarn', '실 이름', { ph: '예: 메리노 울 100%, 아란' })}
      ${num('gauge.ballW', '1볼 무게', 'g', { step: 5 })}
      ${num('gauge.ballLen', '1볼 길이', 'm', { step: 5 })}
    </div>
  </section>`);
}
function bindSize() {
  const wc = $('#wclose'); if (wc) wc.onclick = () => { LS.set('welcomed', true); renderTab(); };
  document.querySelectorAll('[data-preset]').forEach(el => el.onclick = () => {
    const k = el.dataset.preset;
    S.P.size = k;
    if (PRESETS[k]) { const p = PRESETS[k]; Object.keys(S.P.body).forEach(f => { if (p[f] !== undefined) S.P.body[f] = p[f]; }); S.P.design.length = p.length; }
    touch(); renderTab();
  });
  document.querySelectorAll('[data-fit]').forEach(el => el.onclick = () => {
    const f = FITS[el.dataset.fit]; if (!f) return;
    S.P.fit = el.dataset.fit;
    Object.assign(S.P.ease, f.ease);
    document.querySelectorAll('[data-ease]').forEach(inp => inp.value = S.P.ease[inp.dataset.ease]);
    document.querySelectorAll('[data-fit]').forEach(x => x.classList.toggle('on', x === el));
    touch(); updateLive();
  });
}

/* ===================== 탭: 디자인 ===================== */
function motifOptions(withNone) {
  const ms = allMotifs();
  return [...(withNone ? [['', '없음']] : []), ...ms.map(m => [m.id, `${m.custom ? '[내 무늬] ' : ''}${m.name} (${expandMotif(m).w}코)`])];
}
function viewDesign() {
  const P = S.P;
  return splitView(`
  <section class="card">
    <h2>옷 형태</h2>
    ${seg('garment', '종류', [['pullover', '풀오버'], ['cardigan', '가디건']])}
    ${seg('neck', '목선', [['round', '라운드넥'], ['v', 'V넥']])}
    ${seg('sleeve', '소매', [['setin', '셋인 슬리브'], ['drop', '드롭숄더']])}
    ${seg('design.shoulderMethod', '어깨 처리', [['bo', '계단식 덮어씌우기'], ['sr', '되돌아뜨기 후 빼뜨기 잇기']])}
  </section>
  <section class="card">
    <h2>바탕과 고무단</h2>
    ${seg('pattern.bg', '바탕 무늬', [['st', '메리야스'], ['rev', '안메리야스'], ['seed', '멍석뜨기'], ['garter', '가터']])}
    ${seg('pattern.rib', '고무단', [['1x1', '1코 고무'], ['2x2', '2코 고무'], ['1x1t', '1코 꼬아 고무'], ['garter', '가터']])}
  </section>
  <section class="card">
    <h2>무늬 배치</h2>
    <p class="desc">중앙 무늬를 가운데에 두고, 양옆 무늬를 좌우 대칭으로 놓습니다. 왼쪽에 놓이는 무늬는 교차 방향을 자동으로 뒤집어 대칭을 맞춥니다.${P.garment === 'cardigan' ? ' 가디건은 앞판마다 중앙 무늬 하나를 놓습니다.' : ''}</p>
    <div class="grid">
      ${sel('pattern.center', '중앙 무늬', motifOptions(true))}
      ${sel('pattern.side', '양옆 무늬', motifOptions(true))}
      ${num('pattern.gap', '중앙과 양옆 사이 바탕', '코', { step: 1 })}
      ${num('pattern.sep', '무늬 양쪽 안뜨기', '코', { step: 1 })}
    </div>
    <div class="row wrap">${chk('pattern.applyBack', '뒤판에도 같은 무늬')}${chk('pattern.applySleeve', '소매 중앙에 중앙 무늬')}</div>
    <div data-live="alloc"></div>
  </section>`);
}
const ALLOC_COL = { sel: '#78716C', bg: '#ECE6DE', purl: '#B8ADA2', center: '#F5E6C8', side: '#E8C9BB', gap: '#F3EFEA' };
function allocHTML() {
  const C = S.C; if (!C) return '';
  const pc = C.pieces.find(p => p.kind === 'front' || p.kind === 'rfront');
  const lay = pc.lay, Nc = pc.info.Nc;
  const bgSide = (Nc - lay.panelW - 2) / 2;
  const segs = [{ t: 'sel', n: 1, name: '가장자리' }, { t: 'bg', n: bgSide, name: '바탕' }];
  lay.blocks.forEach(b => {
    if (b.type === 'purl') segs.push({ t: 'purl', n: b.w, name: '안뜨기' });
    else if (b.type === 'bg') segs.push({ t: 'gap', n: b.w, name: '사이바탕' });
    else { const isC = b.motif.id === S.P.pattern.center; segs.push({ t: isC ? 'center' : 'side', n: b.w, name: isC ? '중앙무늬' : '양옆무늬' }); }
  });
  segs.push({ t: 'bg', n: bgSide, name: '바탕' }, { t: 'sel', n: 1, name: '가장자리' });
  const cm = cmFor(Nc, lay, C.gs, C.dens);
  const nsh = pc.info.Nsh;
  const risk = lay.panelW > nsh;
  return `<div class="alloc">
    <h3>${pc.kind === 'rfront' ? '오른앞판' : '앞판'} 가슴 폭 코 배열 (${Nc}코)</h3>
    <div class="abar">${segs.filter(s => s.n > 0).map(s => `<span style="flex:${s.n} 0 0;background:${ALLOC_COL[s.t]}" title="${s.name} ${s.n}코">${s.n >= Math.max(4, Nc / 24) ? s.n : ''}</span>`).join('')}</div>
    <div class="alegend">${[['sel', '가장자리'], ['bg', '바탕'], ['purl', '안뜨기'], ['gap', '사이바탕'], ['side', '양옆무늬'], ['center', '중앙무늬']].map(([k, n]) => `<span><i style="background:${ALLOC_COL[k]}"></i>${n}</span>`).join('')}</div>
    <p class="aformula">${segs.filter(s => s.n > 0).map(s => `[${s.name} ${s.n}코]`).join(' + ')} = 총 ${Nc}코 (${fmt(cm)}cm)</p>
    ${risk ? `<div class="alert">무늬 패널 폭(${lay.panelW}코)이 진동을 줄인 뒤 남는 코(${nsh}코)보다 넓습니다. 진동과 목을 줄일 때 가장자리 꽈배기가 잘려 겉뜨기로 바뀝니다. 양옆 무늬 간격을 줄이거나 무늬를 빼는 것을 검토하세요.</div>` : ''}
  </div>`;
}

/* ===================== 탭: 무늬 ===================== */
const PALETTE = ['k', 'p', 'tk', 'yo', 'k2tog', 'ssk', 'sk2p', 'mb', 'LC1/1', 'RC1/1', 'LC2/2', 'RC2/2', 'LC3/3', 'RC3/3', 'LC4/4', 'RC4/4', 'LPC2/1', 'RPC2/1', 'LC2/1', 'RC2/1', 'LPC2/2', 'RPC2/2', 'LPC1/1', 'RPC1/1'];
function viewMotif() {
  if (S.editor) return viewEditor();
  const ms = allMotifs();
  return `
  <section class="card">
    <div class="hrow"><h2>무늬 라이브러리</h2><button class="btn pri" id="mnew">새 무늬 그리기</button></div>
    <p class="desc">기본 무늬는 복제해서 고칠 수 있습니다. 직접 만든 무늬는 ${Store.db ? '공유 저장소에 저장됩니다' : '이 브라우저에 저장됩니다'}.</p>
    <div class="mgrid">${ms.map(m => {
      const ex = expandMotif(m);
      const cs = Math.max(8, Math.min(14, Math.floor(150 / Math.max(ex.w, 6))));
      return `<div class="mcard"><div class="mhead"><b>${esc(m.name)}</b><span>${ex.w}코 ${ex.h}단${m.custom ? ', 내 무늬' : ''}</span></div>
      <div class="mimg">${chartSVG(motifPiece(m), { cw: cs, ch: cs, showKnit: true })}</div>
      <div class="row"><button class="btn" data-medit="${m.id}">${m.custom ? '편집' : '복제하여 편집'}</button>${m.custom ? `<button class="btn ghost" data-mdel="${m.id}">삭제</button>` : ''}</div></div>`;
    }).join('')}</div>
  </section>`;
}
function newEditor(o) { return { history: [], future: [], tool: 'p', ...o }; }
function editorFrom(m) {
  const ex = expandMotif(m);
  return newEditor({ id: m.custom ? m.id : null, name: m.custom ? m.name : m.name + ' 변형', w: ex.w, h: ex.h, cells: ex.cells.map(r => r.map(v => typeof v === 'object' ? { ...v } : v)) });
}
function editorTokens(E) {
  return E.cells.map(row => { const out = []; for (let c = 0; c < row.length; c++) { const v = row[c]; if (typeof v === 'object') { if (v.j === 0) out.push(v.tok); } else out.push(v); } return out; });
}
const snapE = E => ({ w: E.w, h: E.h, cells: E.cells.map(r => r.map(v => typeof v === 'object' ? { ...v } : v)) });
function pushHist(E) { E.history.push(snapE(E)); if (E.history.length > 80) E.history.shift(); E.future = []; }
function restoreE(E, s) { E.w = s.w; E.h = s.h; E.cells = s.cells; }
function undoE() { const E = S.editor; if (!E || !E.history.length) return; E.future.push(snapE(E)); restoreE(E, E.history.pop()); editorRefresh(); }
function redoE() { const E = S.editor; if (!E || !E.future.length) return; E.history.push(snapE(E)); restoreE(E, E.future.pop()); editorRefresh(); }
function viewEditor() {
  const E = S.editor;
  return `
  <section class="card">
    <div class="hrow"><h2>무늬 편집</h2><div class="row"><button class="btn" id="ecancel">닫기</button><button class="btn pri" id="esave">무늬 저장</button></div></div>
    <div class="grid">
      <label class="fld"><span class="lb">무늬 이름</span><span class="iw"><input id="ename" value="${esc(E.name)}"></span></label>
      <label class="fld"><span class="lb">폭</span><span class="iw"><input id="ew" type="number" min="1" max="60" value="${E.w}"><em>코</em></span></label>
      <label class="fld"><span class="lb">높이</span><span class="iw"><input id="eh" type="number" min="1" max="80" value="${E.h}"><em>단</em></span></label>
    </div>
    <p class="desc">기호를 고른 뒤 칸을 누르세요. 1칸짜리 기호는 누른 채로 끌면 연속으로 칠해집니다. 교차뜨기는 누른 칸부터 오른쪽으로 놓이며 홀수 단(겉면)에만 둡니다. 차트는 겉면에서 본 모양입니다.</p>
    <div class="pal">${PALETTE.map(t => `<button class="${E.tool === t ? 'on' : ''}" data-tool="${t}" title="${esc(symName(t))}">${symbolSVG(t, 20)}<span>${esc(symName(t))}</span></button>`).join('')}</div>
    <div class="row wrap etools">
      <button class="btn" id="eundo">실행 취소</button><button class="btn" id="eredo">다시 실행</button>
      <span class="vsep"></span>
      <button class="btn" id="emirror">좌우 대칭 뒤집기</button><button class="btn" id="edup">맨 위 2단 복제 추가</button><button class="btn" id="edel">맨 위 2단 삭제</button>
      <span class="vsep"></span>
      <button class="btn" id="efill">안면 단 자동 채우기</button><button class="btn" id="eclear">모두 겉뜨기로</button><button class="btn" id="eclearp">모두 안뜨기로</button>
    </div>
    <div id="eerr"></div>
    <div class="ewrap">
      <div class="ecanvas" id="ecanvas"></div>
      <div class="etile"><h3>2x2 반복 미리보기</h3><p class="desc small">가로 2회, 세로 2회 이어 붙인 모양입니다. 이음새를 확인하세요.</p><div id="etile"></div></div>
    </div>
    <h3>단별 설명 미리보기</h3>
    <ol class="rows" id="erows"></ol>
  </section>`;
}
function editorRefresh() {
  const E = S.editor; if (!E) return;
  const rows = editorTokens(E);
  const m = { rows };
  const errs = motifCheck(m);
  E.cs = Math.max(16, Math.min(30, Math.floor(Math.min((($('#ecanvas') || {}).clientWidth || 600) - 70, 700) / E.w)));
  $('#eerr').innerHTML = errs.length ? `<div class="alert"><ul>${errs.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>` : `<div class="ok">무늬가 올바릅니다.</div>`;
  $('#ecanvas').innerHTML = chartSVG(motifPiece(m), { cw: E.cs, ch: E.cs, showKnit: true });
  const tile = { rows: [...rows, ...rows].map(r => r.concat(r)) };
  const tcs = Math.max(5, Math.min(14, Math.floor(260 / (2 * E.w))));
  $('#etile').innerHTML = chartSVG(motifPiece(tile), { cw: tcs, ch: tcs, showKnit: true });
  $('#erows').innerHTML = motifRowsText(m).map(s => `<li>${esc(s)}</li>`).join('');
  $('#eundo').disabled = !E.history.length; $('#eredo').disabled = !E.future.length;
  if (+$('#ew').value !== E.w) $('#ew').value = E.w;
  if (+$('#eh').value !== E.h) $('#eh').value = E.h;
}
function bindMotif() {
  if (S.editor) return bindEditor();
  $('#mnew').onclick = () => { S.editor = newEditor({ id: null, name: '새 무늬', w: 8, h: 8, cells: Array.from({ length: 8 }, () => Array(8).fill('k')), tool: 'LC2/2' }); renderTab(); };
  document.querySelectorAll('[data-medit]').forEach(b => b.onclick = () => { const m = allMotifs().find(x => x.id === b.dataset.medit); S.editor = editorFrom(m); renderTab(); });
  document.querySelectorAll('[data-mdel]').forEach(b => b.onclick = () => { const m = allMotifs().find(x => x.id === b.dataset.mdel); ask(`"${m.name}" 무늬를 삭제할까요?`, async () => { await Store.deleteMotif(m.id).catch(() => { }); recompute(); renderTab(); }); });
}
function bindEditor() {
  const E = S.editor;
  $('#ename').oninput = e => E.name = e.target.value;
  const resize = () => {
    const w = clamp(parseInt($('#ew').value) || 1, 1, 60), h = clamp(parseInt($('#eh').value) || 1, 1, 80);
    if (w === E.w && h === E.h) return;
    pushHist(E);
    const cells = Array.from({ length: h }, (_, r) => Array.from({ length: w }, (_, c) => (E.cells[r] && E.cells[r][c] !== undefined) ? E.cells[r][c] : 'k'));
    cells.forEach(row => row.forEach((v, c) => { if (typeof v === 'object') { const x = parseTok(v.tok); if (c - v.j + x.w > w) row[c] = 'k'; } }));
    E.w = w; E.h = h; E.cells = cells; editorRefresh();
  };
  $('#ew').onchange = resize; $('#eh').onchange = resize;
  document.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => { E.tool = b.dataset.tool; document.querySelectorAll('[data-tool]').forEach(x => x.classList.toggle('on', x === b)); });
  $('#ecancel').onclick = () => { S.editor = null; renderTab(); };
  $('#eundo').onclick = undoE; $('#eredo').onclick = redoE;
  $('#eclear').onclick = () => { pushHist(E); E.cells = E.cells.map(r => r.map(() => 'k')); editorRefresh(); };
  $('#eclearp').onclick = () => { pushHist(E); E.cells = E.cells.map(r => r.map(() => 'p')); editorRefresh(); };
  $('#emirror').onclick = () => {
    pushHist(E);
    const rows = editorTokens(E).map(row => row.slice().reverse().map(mirrorTok));
    E.cells = expandMotif({ rows }).cells.map(r => r.map(v => typeof v === 'object' ? { ...v } : v));
    editorRefresh();
  };
  $('#edup').onclick = () => {
    if (E.h < 2 || E.h + 2 > 80) return toast('높이가 2단 이상, 78단 이하일 때만 복제할 수 있습니다.');
    pushHist(E);
    const top = E.cells.slice(E.h - 2).map(r => r.map(v => typeof v === 'object' ? { ...v } : v));
    E.cells = E.cells.concat(top); E.h += 2; editorRefresh();
  };
  $('#edel').onclick = () => {
    if (E.h <= 2) return toast('2단보다 적게 줄일 수 없습니다.');
    pushHist(E); E.cells = E.cells.slice(0, E.h - 2); E.h -= 2; editorRefresh();
  };
  $('#efill').onclick = () => {
    pushHist(E);
    for (let r = 1; r < E.h; r += 2) {
      const below = E.cells[r - 1];
      E.cells[r] = below.map(v => {
        if (typeof v === 'object') return crossOut(v.tok, v.j);
        if (v === 'p') return 'p';
        if (v === 'tk') return 'tk';
        return 'k';
      });
    }
    editorRefresh();
  };
  $('#esave').onclick = async () => {
    const rows = editorTokens(E);
    const errs = motifCheck({ rows });
    if (errs.length) return toast('무늬에 확인할 점이 있어 저장하지 않았습니다.');
    const m = { id: E.id || 'u' + uid(), name: E.name || '내 무늬', cat: '내 무늬', rows, owner: S.worker, updated: Date.now() };
    try { await Store.saveMotif(m); toast('무늬를 저장했습니다.'); } catch (e) { toast('저장하지 못했습니다.'); }
    S.editor = null; recompute(); renderTab();
  };
  const cv = $('#ecanvas');
  const cellAt = e => {
    const svg = cv.querySelector('svg'); if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const G = chartGeom({ W: E.w, total: E.h }, { cw: E.cs, ch: E.cs });
    const sx = svg.viewBox.baseVal.width / rect.width;
    const x = (e.clientX - rect.left) * sx, y = (e.clientY - rect.top) * sx;
    const c = Math.floor((x - G.mL) / E.cs), r = E.h - 1 - Math.floor((y - G.mT) / E.cs);
    if (c < 0 || c >= E.w || r < 0 || r >= E.h) return null;
    return { r, c };
  };
  let drag = null;
  cv.onpointerdown = e => {
    if (e.button !== undefined && e.button !== 0) return;
    const p = cellAt(e); if (!p) return;
    e.preventDefault();
    pushHist(E);
    placeTool(E, p.r, p.c, E.tool);
    editorRefresh();
    if (!parseTok(E.tool)) { drag = { key: p.r + ':' + p.c }; try { cv.setPointerCapture(e.pointerId); } catch (_) { } }
  };
  cv.onpointermove = e => {
    if (!drag) return;
    const p = cellAt(e); if (!p) return;
    const key = p.r + ':' + p.c; if (key === drag.key) return;
    drag.key = key; placeTool(E, p.r, p.c, E.tool); editorRefresh();
  };
  cv.onpointerup = cv.onpointercancel = () => { drag = null; };
  requestAnimationFrame(editorRefresh);
}
function placeTool(E, r, c, tool) {
  const row = E.cells[r];
  const clearAt = cc => { const v = row[cc]; if (typeof v === 'object') { const x = parseTok(v.tok); const st = cc - v.j; for (let j = 0; j < x.w; j++) row[st + j] = 'k'; } };
  const x = parseTok(tool);
  if (!x) { clearAt(c); row[c] = tool; return; }
  if (r % 2 === 1) { toast('교차뜨기는 홀수 단(겉면)에 두세요.'); return; }
  if (c + x.w > E.w) { toast(`이 교차는 ${x.w}칸이 필요합니다.`); return; }
  for (let j = 0; j < x.w; j++) clearAt(c + j);
  for (let j = 0; j < x.w; j++) row[c + j] = { tok: tool, j };
}

/* ===================== 탭: 차트 (단 트래커) ===================== */
function curPiece() { return S.C ? (S.C.pieces.find(p => p.id === S.piece) || S.C.pieces[0]) : null; }
function curRow(pc) { const v = (S.P.progress || {})[pc.id] || 1; return clamp(v, 1, pc.total); }
function chartOpts(pc) {
  const o = S.chart, ch = o.ratio ? o.cell * S.C.gs / S.C.gr : o.cell;
  return { cw: o.cell, ch, showKnit: o.showKnit, tint: o.tint, center: o.center, hlRow: curRow(pc), dimBelow: o.dim };
}
function viewChart() {
  const C = S.C;
  if (!C) return warnBox();
  const pc = curPiece();
  const o = S.chart;
  const syms = usedSymbols([pc]);
  return `
  <div data-live="warn"></div>
  <section class="card chartcard">
    <div class="chips">${C.pieces.map(p => `<span class="chip ${p.id === pc.id ? 'on' : ''}" data-piece="${p.id}">${esc(p.name)}</span>`).join('')}</div>
    <div class="row wrap ctl">
      <label class="zoom">크기 <input type="range" min="4" max="28" value="${o.cell}" id="zoom"></label>
      ${[['showKnit', '겉뜨기 기호'], ['tint', '무늬 색'], ['center', '중심선'], ['ratio', '게이지 비율 칸'], ['dim', '완료한 아래 단 어둡게']].map(([k, n]) => `<label class="chk"><input type="checkbox" data-c="${k}" ${o[k] ? 'checked' : ''}><span>${n}</span></label>`).join('')}
    </div>
    <div class="row wrap ctl">
      <button class="btn sm" id="cfit">가로 폭 맞춤</button><button class="btn sm" id="cgo">현재 단으로 스크롤</button>
      <button class="btn sm" id="cpng">차트 PNG 저장</button><button class="btn sm" id="csvg">차트 SVG 저장</button>
    </div>
    <div class="rowbar" id="rowbar"></div>
    <div class="chartbox" id="chartbox"></div>
    <p class="desc small">차트를 누르면 그 단으로 이동합니다. 마우스로 끌면 차트가 움직이고, 키보드 위아래 화살표로 한 단씩 옮길 수 있습니다.</p>
  </section>
  <section class="card">
    <h2>기호</h2>
    <div class="legend">${syms.map(s => `<div class="lg">${symbolSVG(s, 22)}<span>${esc(symName(s))}${s === 'k' ? ' (빈 칸도 겉뜨기)' : ''}</span></div>`).join('')}</div>
    <p class="desc small">홀수 단은 겉면(오른쪽에서 왼쪽), 짝수 단은 안면(왼쪽에서 오른쪽)입니다. 안면에서는 기호의 반대로 뜹니다. 굵은 선은 10코, 10단마다, 붉은 선은 고무단 끝입니다.</p>
  </section>`;
}
function rowBadges(pc, r) {
  const row = pc.codes[r] || [];
  const out = [];
  if (row.some(v => v === 'bo' || v === 'sr' || v === 'k2tog' || v === 'ssk' || v === 'm1l' || v === 'm1r') && r !== pc.total) out.push(['shape', '⚡ 줄임/늘림 단']);
  if (row.some(v => v && parseTok(v))) out.push(['cross', '🔀 교차뜨기 포함']);
  if (r === pc.ribRows) out.push(['rib', '🧶 고무단 마지막 단']);
  const nxt = pc.rows[r + 1] || [];
  if ((pc.rows[r] || []).length === 1 && nxt.length === 2) out.push(['split', '✂ 이 단 뒤 좌우 분리']);
  if (r === pc.total) out.push(['end', '🏁 마지막 단']);
  return out;
}
function rowTextHTML(pc, r) {
  const row = pc.codes[r]; if (!row) return '';
  const rs = r % 2 === 1;
  const idx = []; row.forEach((v, c) => { if (v !== null && v !== undefined && v !== '>') idx.push(c); });
  const seq = (rs ? idx.slice().reverse() : idx).map(c => row[c]);
  return `<b>${r}단 (${rs ? '겉면, 오른쪽부터' : '안면, 왼쪽부터'}, ${row.filter(v => v !== null && v !== undefined).length}코)</b> ${esc(runsText(seq, !rs))}`;
}
function renderRowBar() {
  const pc = curPiece(); const bar = $('#rowbar'); if (!pc || !bar) return;
  const r = curRow(pc), pct = Math.round(r / pc.total * 100);
  bar.innerHTML = `
    <div class="rb1">
      <button class="btn" id="rprev" ${r <= 1 ? 'disabled' : ''}>-1단</button>
      <label class="rjump"><input type="number" id="rjump" min="1" max="${pc.total}" value="${r}"><span>단</span></label>
      <button class="btn pri" id="rnext" ${r >= pc.total ? 'disabled' : ''}>+1단</button>
      <span class="prog"><b>${r} / ${pc.total}단, ${pct}%</b><span class="pbar"><i style="width:${pct}%"></i></span></span>
    </div>
    <div class="badges">${rowBadges(pc, r).map(([k, t]) => `<span class="badge b-${k}">${t}</span>`).join('')}</div>
    <div class="rtext">${rowTextHTML(pc, r)}</div>`;
  $('#rprev').onclick = () => setRow(r - 1, true);
  $('#rnext').onclick = () => setRow(r + 1, true);
  $('#rjump').onchange = e => setRow(parseInt(e.target.value) || 1, true);
}
function renderChartBox() {
  const pc = curPiece(); const box = $('#chartbox'); if (!pc || !box) return;
  const had = !!box.firstElementChild;
  const saved = S.scrolled[pc.id];
  const st = had ? box.scrollTop : saved && saved.t, sl = had ? box.scrollLeft : saved && saved.l;
  box.innerHTML = chartSVG(pc, chartOpts(pc));
  if (!had && !saved) scrollToRow(true);
  else { box.scrollTop = st; box.scrollLeft = sl; }
  box.onscroll = () => { S.scrolled[pc.id] = { t: box.scrollTop, l: box.scrollLeft }; };
}
function refreshChart() { renderChartBox(); renderRowBar(); }
function scrollToRow(right) {
  const pc = curPiece(); const box = $('#chartbox'); if (!pc || !box) return;
  const opts = chartOpts(pc), G = chartGeom(pc, opts);
  const y = G.mT + (G.r1 - curRow(pc)) * opts.ch;
  box.scrollTop = Math.max(0, y - box.clientHeight / 2);
  if (right) box.scrollLeft = box.scrollWidth;
}
function setRow(r, ensureVisible) {
  const pc = curPiece(); if (!pc) return;
  r = clamp(r, 1, pc.total);
  S.P.progress = S.P.progress || {};
  S.P.progress[pc.id] = r;
  touchQuiet();
  renderChartBox(); renderRowBar();
  if (ensureVisible) {
    const box = $('#chartbox'), opts = chartOpts(pc), G = chartGeom(pc, opts);
    const y = G.mT + (G.r1 - r) * opts.ch;
    if (y < box.scrollTop + opts.ch * 2 || y > box.scrollTop + box.clientHeight - opts.ch * 3) scrollToRow(false);
  }
}
function bindChart() {
  document.querySelectorAll('[data-piece]').forEach(el => el.onclick = () => { S.piece = el.dataset.piece; renderTab(); });
  $('#zoom').oninput = e => { S.chart.cell = +e.target.value; LS.set('chart', S.chart); renderChartBox(); };
  document.querySelectorAll('[data-c]').forEach(el => el.onchange = () => { S.chart[el.dataset.c] = el.checked; LS.set('chart', S.chart); renderChartBox(); });
  $('#cfit').onclick = () => {
    const pc = curPiece(), box = $('#chartbox');
    let cell = 28;
    while (cell > 4) { const G = chartGeom(pc, { ...chartOpts(pc), cw: cell, ch: cell }); if (G.width <= box.clientWidth - 14) break; cell--; }
    S.chart.cell = cell; LS.set('chart', S.chart); $('#zoom').value = cell; renderChartBox(); box.scrollLeft = 0;
  };
  $('#cgo').onclick = () => scrollToRow(false);
  $('#csvg').onclick = () => { const pc = curPiece(); saveFile(`${safeName(S.P.name)}_${safeName(pc.name)}_차트.svg`, '<?xml version="1.0" encoding="UTF-8"?>\n' + chartSVG(pc, { ...chartOpts(pc), hlRow: null })); };
  $('#cpng').onclick = async () => {
    const pc = curPiece(); const opts = { ...chartOpts(pc), hlRow: null };
    const G = chartGeom(pc, opts);
    const sc = Math.min(3, 4000 / Math.max(G.width, G.height));
    const cv = document.createElement('canvas'); cv.width = Math.ceil(G.width * sc); cv.height = Math.ceil(G.height * sc);
    const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    drawChart(new CanvasDraw(ctx, 0, 0, sc), pc, opts, G);
    cv.toBlob(b => saveFile(`${safeName(S.P.name)}_${safeName(pc.name)}_차트.png`, b), 'image/png');
  };
  const box = $('#chartbox');
  let pan = null, panned = false;
  box.onpointerdown = e => { if (e.pointerType !== 'mouse' || e.button !== 0) return; pan = { x: e.clientX, y: e.clientY, sl: box.scrollLeft, st: box.scrollTop, moved: false }; };
  box.onpointermove = e => {
    if (!pan) return;
    const dx = e.clientX - pan.x, dy = e.clientY - pan.y;
    if (!pan.moved && Math.hypot(dx, dy) > 4) { pan.moved = true; box.classList.add('panning'); try { box.setPointerCapture(e.pointerId); } catch (_) { } }
    if (pan.moved) { box.scrollLeft = pan.sl - dx; box.scrollTop = pan.st - dy; }
  };
  box.onpointerup = box.onpointercancel = () => { if (pan && pan.moved) { panned = true; setTimeout(() => panned = false, 0); } pan = null; box.classList.remove('panning'); };
  box.onclick = e => {
    if (panned) return;
    const svg = box.querySelector('svg'); if (!svg) return;
    const pc = curPiece(), opts = chartOpts(pc), G = chartGeom(pc, opts);
    const rect = svg.getBoundingClientRect();
    const y = (e.clientY - rect.top) * (svg.viewBox.baseVal.height / rect.height);
    const r = G.r1 - Math.floor((y - G.mT) / opts.ch);
    if (r < 1 || r > pc.total) return;
    setRow(r, false);
  };
  renderChartBox(); renderRowBar();
}
document.addEventListener('keydown', e => {
  const t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT');
  if (S.tab === 'chart' && !typing && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && $('#chartbox')) {
    e.preventDefault(); const pc = curPiece(); setRow(curRow(pc) + (e.key === 'ArrowUp' ? 1 : -1), true);
  }
  if (S.tab === 'motif' && S.editor && (e.ctrlKey || e.metaKey) && !(t && t.id === 'ename')) {
    const k = e.key.toLowerCase();
    if (k === 'z' && !e.shiftKey) { e.preventDefault(); undoE(); }
    else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redoE(); }
  }
});

/* ===================== 탭: 도식화 ===================== */
function scheduleRows(pc, C) {
  const out = [];
  const info = pc.info, nk = info.neck;
  const live = r => (pc.rows[r] || []).reduce((a, s) => a + s.r - s.l + 1, 0);
  const zone = (r, side, seg) => {
    if (pc.kind === 'sleeve') return r >= info.capStart ? '소매산' : '소매 옆선';
    if (nk && r > nk.s && ((seg === 'L' && side === 'right') || (seg === 'R' && side === 'left'))) return pc.kind === 'back' ? '뒷목' : '앞목';
    if (nk && r >= nk.s && ((pc.kind === 'rfront' && side === 'right') || (pc.kind === 'lfront' && side === 'left'))) return '앞목';
    if (r >= C.shStart) return '어깨';
    if (r >= C.ahStart) return '진동';
    return '옆선';
  };
  for (let r = 1; r <= pc.total; r++) {
    const row = pc.codes[r] || [], segs = pc.rows[r] || [];
    const acts = [];
    if (r === pc.total && pc.finalBo) { out.push({ r, text: `남은 ${live(r)}코 모두 덮어씌우기`, after: 0 }); continue; }
    segs.forEach(s => {
      let c = s.l;
      while (c <= s.r) {
        const v = row[c];
        if (v === 'bo' || v === 'sr') {
          let e = c; while (e + 1 <= s.r && row[e + 1] === v) e++;
          const n = e - c + 1;
          const side = c === s.l ? 'left' : e === s.r ? 'right' : 'center';
          const zn = side === 'center' ? (pc.kind === 'back' ? '뒷목 중앙' : '앞목 중앙') : zone(r, side, s.name);
          acts.push({ zone: zn, side: /목$/.test(zn) && (s.name === 'L' || s.name === 'R') ? 'seg' + s.name : side, kind: v === 'sr' ? '되돌아뜨기 남김' : '덮어씌우기', n });
          c = e + 1; continue;
        }
        if (v === 'k2tog' || v === 'ssk' || v === 'm1l' || v === 'm1r') {
          const sd = c - s.l < s.r - c ? 'left' : 'right', zn = zone(r, sd, s.name);
          acts.push({ zone: zn, side: /목$/.test(zn) && (s.name === 'L' || s.name === 'R') ? 'seg' + s.name : sd, kind: v === 'm1l' || v === 'm1r' ? '늘림' : '줄임', n: 1 });
        }
        c++;
      }
    });
    const nextSegs = (pc.rows[r + 1] || []).length;
    const splitNow = segs.length === 1 && nextSegs === 2;
    if (!acts.length && !splitNow) continue;
    // 같은 구역, 같은 동작, 같은 코 수의 좌우를 '양쪽'으로 합침
    const merged = [];
    acts.forEach(a => {
      const twin = merged.find(m => m.zone === a.zone && m.kind === a.kind && m.n === a.n && m.side !== a.side && m.side !== 'both' && a.side !== 'center');
      if (twin) twin.side = 'both'; else merged.push({ ...a });
    });
    const sideTxt = s => s === 'both' ? '양쪽 ' : s === 'left' ? '왼쪽 ' : s === 'right' ? '오른쪽 ' : s === 'segL' ? '(차트 왼쪽 조각) ' : s === 'segR' ? '(차트 오른쪽 조각) ' : '';
    const parts = merged.map(a => `${a.zone} ${sideTxt(a.side)}${a.n}코${a.side === 'both' && a.kind !== '덮어씌우기' ? '씩' : ''} ${a.kind}`);
    if (splitNow) parts.push('좌우로 나누어 뜨기 시작');
    out.push({ r, text: parts.join(', '), after: r < pc.total ? live(r + 1) : 0 });
  }
  return out;
}
function scheduleHTML(pc, C) {
  const rows = scheduleRows(pc, C);
  return `<details class="sched"><summary>📋 ${esc(pc.name)}: 단수별 줄임, 늘림, 목, 어깨 정확한 단 번호 일람표 (${rows.length}개 단)</summary>
    <table class="tbl"><thead><tr><th>단</th><th>면</th><th>할 일</th><th>다음 단 코 수</th></tr></thead><tbody>
    ${rows.map(x => `<tr><td>${x.r}</td><td>${x.r % 2 ? '겉면' : '안면'}</td><td>${esc(x.text)}</td><td>${x.after ? x.after + '코' : '끝'}</td></tr>`).join('')}
    </tbody></table></details>`;
}
function viewSchem() {
  const C = S.C; if (!C) return warnBox();
  const f = C.finished;
  const tgt = { chest: C.T.chest, hem: C.T.hip, length: C.T.length, shoulder: C.isDrop ? null : C.T.shoulder, armDepth: C.T.armDepth, neckW: C.T.neckW, sleeveLen: C.T.armLen, upper: C.isDrop ? null : C.T.upper, cuff: C.T.wrist };
  const names = { chest: '가슴둘레', hem: '밑단둘레', length: '총장', shoulder: '어깨너비', armDepth: '진동깊이', neckW: '목너비', sleeveLen: '소매길이', upper: '소매통', cuff: '소맷부리' };
  const sign = v => (v > 0 ? '+' : v < 0 ? '-' : '') + fmt(Math.abs(v));
  const y = yarnInfo(C);
  return `
  <div data-live="warn"></div>
  <section class="card">
    <div class="hrow"><h2>도식화</h2><div class="row"><button class="btn sm" id="spng">도식화 PNG 다운로드</button><button class="btn sm" id="ssvg">SVG 다운로드</button></div></div>
    <div class="schem">${schematicSVG(C, Math.min(window.innerWidth, 1180) - 70)}</div>
  </section>
  <section class="card">
    <h2>단수별 일람표</h2>
    <p class="desc">차트에서 코 수가 바뀌거나 좌우로 나뉘는 단만 뽑았습니다. 뜨면서 한 줄씩 확인하세요.</p>
    ${C.pieces.map(pc => scheduleHTML(pc, C)).join('')}
  </section>
  <section class="card">
    <h2>완성 치수</h2>
    <table class="tbl num"><thead><tr><th>부위</th><th>목표</th><th>실제</th><th>차이</th></tr></thead><tbody>
    ${Object.keys(names).map(k => `<tr><td>${names[k]}</td><td>${tgt[k] != null ? fmt(tgt[k]) : '-'}</td><td>${fmt(f[k])}</td><td>${tgt[k] != null ? sign(f[k] - tgt[k]) : '-'}</td></tr>`).join('')}
    </tbody></table>
    <p class="desc small">실제 값은 코 수와 단 수를 정수로 맞춘 뒤 게이지로 되돌려 계산한 값입니다.${C.isDrop ? ' 드롭숄더는 어깨너비가 몸판 폭과 같고, 소매길이는 늘어진 어깨만큼 줄어듭니다.' : ''}</p>
  </section>
  <section class="card">
    <h2>계산 내역</h2>
    <table class="tbl"><tbody>
      <tr><td>게이지</td><td>${fmt(C.gs * 10)}코 x ${fmt(C.gr * 10)}단 / 10cm, 꽈배기 수축 ${fmt(C.dens)}배</td></tr>
      <tr><td>앞판 무늬 폭</td><td>${C.layFront.panelW}코 (교차 무늬 ${C.layFront.cableSts}코)</td></tr>
      <tr><td>단 수</td><td>고무단 ${C.ribRows}단, 옆선 ${C.sideRows}단, 진동 ${C.ahRows}단, 총 ${C.totalRows}단</td></tr>
      <tr><td>진동 줄임</td><td>${C.A > 0 ? `한쪽 ${C.A}코, 진동둘레(앞뒤) ${fmt(2 * C.ahLen)}cm` : '없음(드롭숄더)'}</td></tr>
      ${C.capInfo ? `<tr><td>소매산</td><td>높이 ${fmt(C.capInfo.hc / C.gr)}cm, 소매산 둘레 ${fmt(C.capInfo.capTotal)}cm, 진동둘레와 차이 ${sign(C.capInfo.easeC)}cm (권장 0~3cm)</td></tr>` : ''}
      <tr><td>어깨</td><td>한쪽 ${C.shSts}코, ${notation(C.shParts.map(a => ({ len: 2, amt: a })))}</td></tr>
      <tr><td>넥밴드</td><td>목둘레 약 ${fmt(C.neckCirc)}cm, ${C.neckPick}코 줍기</td></tr>
      <tr><td>실 사용량</td><td>${y ? `약 ${y.grams}g${y.balls ? `, ${y.balls}볼` : ''}${y.meters ? `, 약 ${y.meters.toLocaleString()}m` : ''} (총 ${C.cells.toLocaleString()}코 기준, 여유 8% 포함)` : '스와치 무게를 넣으면 계산합니다'}</td></tr>
    </tbody></table>
  </section>`;
}
function bindSchem() {
  const C = S.C; if (!C) return;
  const aw = Math.min(window.innerWidth, 1180) - 70;
  $('#ssvg').onclick = () => saveFile(`${safeName(S.P.name)}_도식화.svg`, '<?xml version="1.0" encoding="UTF-8"?>\n' + schematicSVG(C, aw));
  $('#spng').onclick = () => {
    const dm = schematicDims(C, aw), sc = 2;
    const cv = document.createElement('canvas'); cv.width = dm.w * sc; cv.height = dm.h * sc;
    const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    drawSchematicAll(new CanvasDraw(ctx, 0, 0, sc), C, dm);
    cv.toBlob(b => saveFile(`${safeName(S.P.name)}_도식화.png`, b), 'image/png');
  };
}

/* ===================== 탭: 서술형 ===================== */
function textHTML(T, interactive) {
  let html = '', inList = false;
  const done = new Set(interactive ? (S.P.textDone || []) : []);
  T.forEach((b, i) => {
    const attr = interactive && (b.t === 'p' || b.t === 'li') ? ` data-ti="${i}" class="tick${done.has(i) ? ' done' : ''}"` : '';
    if (b.t === 'li') { if (!inList) { html += '<ul>'; inList = true; } html += `<li${attr}>${esc(b.s)}</li>`; return; }
    if (inList) { html += '</ul>'; inList = false; }
    const tag = { h1: 'h1', h2: 'h2', h3: 'h3', p: 'p', note: 'p' }[b.t];
    html += `<${tag}${attr}>${esc(b.s)}</${tag}>`;
  });
  if (inList) html += '</ul>';
  return html;
}
function textPlain(T) { return T.map(b => b.t === 'h1' ? `${b.s}\n` : b.t === 'h2' ? `\n[${b.s}]` : b.t === 'h3' ? `\n${b.s}` : b.t === 'li' ? `- ${b.s}` : b.s).join('\n'); }
function viewText() {
  if (!S.C) return warnBox();
  const n = (S.P.textDone || []).length;
  return `<div data-live="warn"></div><section class="card doc">
    <div class="hrow"><p class="desc small">문단을 누르면 완료 표시가 됩니다. 뜨면서 한 단계씩 체크하세요. (완료 ${n}개)</p>
    <div class="row"><button class="btn sm" id="treset">체크 모두 지우기</button><button class="btn sm" id="tcopy">글 전체 복사</button></div></div>
    ${textHTML(S.T, true)}</section>`;
}
function bindText() {
  const b = $('#tcopy'); if (!b) return;
  b.onclick = async () => { try { await navigator.clipboard.writeText(textPlain(S.T)); toast('복사했습니다.'); } catch (e) { toast('복사가 막혀 있습니다. 글을 길게 눌러 선택해 주세요.'); } };
  $('#treset').onclick = () => { S.P.textDone = []; touchQuiet(); renderTab(); };
  document.querySelectorAll('[data-ti]').forEach(el => el.onclick = () => {
    const i = +el.dataset.ti; const set = new Set(S.P.textDone || []);
    set.has(i) ? set.delete(i) : set.add(i);
    S.P.textDone = [...set].sort((a, b) => a - b);
    el.classList.toggle('done', set.has(i));
    touchQuiet();
    const d = document.querySelector('.doc .desc'); if (d) d.textContent = `문단을 누르면 완료 표시가 됩니다. 뜨면서 한 단계씩 체크하세요. (완료 ${set.size}개)`;
  });
}

/* ===================== 탭: 출력 ===================== */
function viewPrint() {
  const o = S.print;
  const C = S.C;
  return `
  <section class="card">
    <h2>PDF 도안 만들기</h2>
    <p class="desc">A4 세로 PDF로 표지(재료, 게이지, 완성 치수, 기호), 도식화, 서술형 도안, 무늬 차트, 조각별 차트를 묶습니다. 큰 차트는 여러 장으로 나누고 각 장에 코, 단 범위를 적습니다.</p>
    <div class="grid">
      <label class="fld"><span class="lb">차트 칸 크기</span><span class="iw"><select id="pcell">${[3, 4, 5, 6].map(v => `<option value="${v}" ${o.cell === v ? 'selected' : ''}>${v}mm</option>`).join('')}</select></span></label>
    </div>
    <div class="row wrap">
      ${[['cover', '표지와 재료'], ['schem', '도식화'], ['text', '서술형 도안'], ['motifs', '무늬 차트'], ['charts', '조각 차트'], ['ratio', '게이지 비율 칸']].map(([k, n]) => `<label class="chk"><input type="checkbox" data-pr="${k}" ${o[k] ? 'checked' : ''}><span>${n}</span></label>`).join('')}
    </div>
    <div class="row wrap"><button class="btn pri big" id="mkpdf" ${C ? '' : 'disabled'}>PDF 저장</button>${IN_CLAUDE ? '' : `<button class="btn big" id="prpdf" ${C ? '' : 'disabled'}>PDF 열어서 인쇄</button>`}<span id="pdfst" class="desc"></span></div>
  </section>
  <section class="card">
    <h2>현재 도안 파일</h2>
    <p class="desc">지금 열려 있는 도안 하나를 파일로 주고받습니다. 이 도안에 쓴 내 무늬도 함께 들어갑니다. 다른 사람에게 도안을 보내거나 받을 때 씁니다.</p>
    <div class="row wrap"><button class="btn" id="exone">현재 도안만 파일로 내보내기</button><label class="btn file">단일 도안 파일 불러오기<input type="file" id="imone" accept=".json,application/json"></label></div>
  </section>
  <section class="card">
    <h2>전체 백업과 옮기기</h2>
    <p class="desc">저장된 모든 도안과 직접 만든 무늬를 JSON 파일 하나로 저장하거나 불러옵니다. 다른 기기로 옮길 때 씁니다.</p>
    <div class="row wrap"><button class="btn" id="bk">JSON 백업 저장</button><label class="btn file">JSON 불러오기<input type="file" id="bkin" accept=".json,application/json"></label></div>
  </section>`;
}
const IN_CLAUDE = !!(window.claude && window.claude.use);
function browserDownload(filename, data) {
  const type = filename.endsWith('.json') ? 'application/json' : filename.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream';
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return true;
}
async function saveFile(filename, data) {
  if (!IN_CLAUDE) return browserDownload(filename, data);
  const dl = S.dl || await window.claude.use('downloads').catch(() => null);
  if (!dl) { toast('이 화면에서는 파일 저장을 쓸 수 없습니다.'); return false; }
  try { await dl.save({ filename, data }); return true; }
  catch (e) { if (e && e.code === 'declined') toast('저장을 취소했습니다.'); else toast('파일을 저장하지 못했습니다' + (e && e.code ? ` (${e.code})` : '')); return false; }
}
function usedCustomMotifs(P) {
  const ids = [P.pattern.center, P.pattern.side].filter(Boolean);
  return S.motifs.filter(m => ids.includes(m.id));
}
function bindPrint() {
  $('#pcell').onchange = e => { S.print.cell = +e.target.value; LS.set('print', S.print); };
  document.querySelectorAll('[data-pr]').forEach(el => el.onchange = () => { S.print[el.dataset.pr] = el.checked; LS.set('print', S.print); });
  $('#mkpdf').onclick = () => makePDF(false);
  const pr = $('#prpdf'); if (pr) pr.onclick = () => makePDF(true);
  $('#exone').onclick = () => {
    const data = JSON.stringify({ app: 'kowadan', type: 'project', ver: 1, at: new Date().toISOString(), owner: S.worker, P: S.P, motifs: usedCustomMotifs(S.P) }, null, 1);
    saveFile(`${safeName(S.P.name)}_코와단.json`, data);
  };
  $('#imone').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      const P = j.type === 'project' ? j.P : (j.current && j.current.P) || j.data || null;
      if (!P || !P.body) throw new Error('도안 파일이 아닙니다');
      for (const m of j.motifs || []) if (m && m.id && m.rows && !S.motifs.find(x => x.id === m.id)) await Store.saveMotif(m);
      const go = () => { S.P = migrate(P); S.id = null; S.dirty = true; S.scrolled = {}; saveDraft(); updateSaveState(); S.tab = 'chart'; recompute(); renderTab(); toast('도안을 불러왔습니다. 저장을 누르면 내 목록에 들어갑니다.'); };
      S.dirty ? ask('저장하지 않은 변경이 있습니다. 불러온 도안으로 바꿀까요?', go) : go();
    } catch (err) { toast('도안 파일을 읽지 못했습니다.'); }
    e.target.value = '';
  };
  $('#bk').onclick = () => {
    const data = JSON.stringify({ app: 'kowadan', ver: 1, at: new Date().toISOString(), projects: S.projects, motifs: S.motifs, workers: S.workers, current: { id: S.id, P: S.P } }, null, 1);
    saveFile(`코와단_백업_${new Date().toISOString().slice(0, 10)}.json`, data);
  };
  $('#bkin').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      let n = 0, mN = 0;
      for (const p of j.projects || []) { if (p && p.id && p.data) { const { id, ...rec } = p; await Store.saveProject(id, rec); n++; } }
      for (const m of j.motifs || []) { if (m && m.id && m.rows) { await Store.saveMotif(m); mN++; } }
      toast(`도안 ${n}개, 무늬 ${mN}개를 불러왔습니다.`); recompute();
    } catch (err) { toast('파일을 읽지 못했습니다.'); }
    e.target.value = '';
  };
}

/* ===================== PDF ===================== */
const PG = { W: 840, H: 1188, M: 48 }; // 1단위 = 0.25mm
async function makePDF(openIt) {
  const C = S.C; if (!C) return;
  const st = $('#pdfst'); const btn = openIt ? $('#prpdf') : $('#mkpdf');
  if (!window.jspdf) { st.textContent = 'PDF 도구를 불러오는 중입니다. 잠시 후 다시 눌러 주세요.'; return; }
  const win = openIt ? window.open('', '_blank') : null;
  if (win) win.document.write('<p style="font-family:sans-serif">PDF를 만드는 중입니다...</p>');
  btn.disabled = true; st.textContent = '페이지를 그리는 중...';
  try {
    await document.fonts.load("400 16px 'Noto Sans KR'"); await document.fonts.load("700 16px 'Noto Sans KR'");
    const pages = buildPages(C);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const px = 1240 / PG.W; // 150dpi
    for (let i = 0; i < pages.length; i++) {
      st.textContent = `페이지 ${i + 1} / ${pages.length} 그리는 중...`;
      await new Promise(r => setTimeout(r, 0));
      const cv = document.createElement('canvas'); cv.width = 1240; cv.height = 1754;
      const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
      const D = new CanvasDraw(ctx, 0, 0, px);
      pages[i](D, ctx, px);
      footer(D, i + 1, pages.length);
      if (i) doc.addPage();
      doc.addImage(cv.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 210, 297);
    }
    const blob = doc.output('blob');
    if (openIt) {
      const url = URL.createObjectURL(blob);
      if (win) win.location.href = url; else window.open(url, '_blank');
      st.textContent = `PDF ${pages.length}쪽을 새 창에 열었습니다. 그 창에서 인쇄하세요.`;
      btn.disabled = false; return;
    }
    st.textContent = 'PDF 저장 창을 엽니다...';
    const ok = await saveFile(`${safeName(S.P.name)}.pdf`, blob);
    st.textContent = ok ? `PDF ${pages.length}쪽을 저장했습니다.` : '';
  } catch (e) { console.error(e); st.textContent = 'PDF를 만들지 못했습니다: ' + e.message; if (win) win.close(); }
  btn.disabled = false;
}
function footer(D, n, N) {
  D.line(PG.M, PG.H - 34, PG.W - PG.M, PG.H - 34, 0.8, GRID);
  D.text(PG.M, PG.H - 22, `${S.P.name || ''}${S.worker ? ', 디자인 ' + S.worker : ''}`, 11, INK, 'left');
  D.text(PG.W - PG.M, PG.H - 22, `${n} / ${N}`, 11, INK, 'right');
}
function wrapLines(ctx, px, text, size, weight, maxW) {
  ctx.font = `${weight || 400} ${size * px}px 'Noto Sans KR', sans-serif`;
  const words = String(text).split(/(\s+)/);
  const lines = []; let cur = '';
  const fits = s => ctx.measureText(s).width / px <= maxW;
  words.forEach(w => {
    if (fits(cur + w)) { cur += w; return; }
    if (cur.trim()) { lines.push(cur.trimEnd()); cur = w.trimStart(); }
    while (!fits(cur)) { let k = cur.length; while (k > 1 && !fits(cur.slice(0, k))) k--; lines.push(cur.slice(0, k)); cur = cur.slice(k); }
  });
  if (cur.trim()) lines.push(cur.trimEnd());
  return lines;
}
function buildPages(C) {
  const pages = [], o = S.print, P = S.P;
  const X0 = PG.M, X1 = PG.W - PG.M, Y0 = PG.M, Y1 = PG.H - PG.M - 20;
  if (o.cover || o.text) {
    const blocks = [];
    const f = C.finished;
    if (o.cover) {
      blocks.push({ t: 'title', s: P.name || '도안' });
      blocks.push({ t: 'sub', s: `${C.isCard ? '가디건' : '풀오버'}, ${C.isV ? 'V넥' : '라운드넥'}, ${C.isDrop ? '드롭숄더' : '셋인 슬리브'}${P.size && P.size !== 'custom' ? `, 기준 사이즈 ${presetLabel(P.size)}` : ''}${FITS[P.fit] ? `, ${FITS[P.fit].name}` : ''}` });
      blocks.push({ t: 'sub', s: `디자인 ${S.worker || '-'}, ${new Date().toLocaleDateString('ko-KR')}` });
      blocks.push({ t: 'table', rows: [['가슴둘레', fmt(f.chest) + 'cm', '총장', fmt(f.length) + 'cm'], ['밑단둘레', fmt(f.hem) + 'cm', '어깨너비', fmt(f.shoulder) + 'cm'], ['진동깊이', fmt(f.armDepth) + 'cm', '목너비', fmt(f.neckW) + 'cm'], ['소매길이', fmt(f.sleeveLen) + 'cm', '소매통', fmt(f.upper) + 'cm']] });
      blocks.push({ t: 'legend' });
    }
    if (o.text) S.T.forEach(b => { if (o.cover && (b.t === 'h1' || b.sec === 'fin')) return; blocks.push(b); });
    let page = [], y = Y0;
    const flush = () => { const items = page; pages.push((D, ctx, px) => items.forEach(fn => fn(D, ctx, px))); page = []; y = Y0; };
    const tmp = document.createElement('canvas').getContext('2d'); const px = 1240 / PG.W;
    blocks.forEach(b => {
      if (b.t === 'table') {
        const h = b.rows.length * 34 + 10;
        if (y + h > Y1) flush();
        const y0 = y;
        page.push(D => { b.rows.forEach((r, i) => { const yy = y0 + i * 34; D.fillRect(X0, yy, X1 - X0, 32, i % 2 ? '#FBF9F6' : '#F3EFEA'); const cw = (X1 - X0) / 4; r.forEach((c, j) => D.text(X0 + cw * j + 12, yy + 16, c, 13, INK, 'left', j % 2 ? 400 : 700)); }); });
        y += h + 10; return;
      }
      if (b.t === 'legend') {
        const syms = usedSymbols(C.pieces);
        const cs = 22, colW = (X1 - X0) / 2;
        const rowsN = Math.ceil(syms.length / 2);
        const h = 40 + rowsN * 30;
        if (y + h > Y1) flush();
        const y0 = y;
        page.push(D => {
          D.text(X0, y0 + 14, '기호', 17, INK, 'left', 700);
          syms.forEach((s, i) => {
            const cx = X0 + (i % 2) * colW, cy = y0 + 36 + Math.floor(i / 2) * 30;
            const w = parseTok(s) ? parseTok(s).w : 1;
            D.rect(cx, cy, w * cs, cs, PAPER, GRID, 0.8);
            if (parseTok(s)) drawCross(D, s, cx, cy, cs, cs, PAPER); else drawSym(D, s, cx, cy, cs, cs, { showKnit: true });
            D.text(cx + w * cs + 10, cy + cs / 2, symName(s), 12, INK, 'left');
          });
        });
        y += h + 10; return;
      }
      const sty = { title: [30, 700, 14], sub: [14, 400, 6], h1: [24, 700, 14], h2: [18, 700, 10], h3: [14, 700, 6], p: [13, 400, 6], li: [13, 400, 4], note: [12, 400, 4] }[b.t];
      const [size, wt, gap] = sty;
      const indent = b.t === 'li' ? 18 : 0;
      const lines = wrapLines(tmp, px, b.s, size, wt, X1 - X0 - indent);
      const lh = size * 1.55;
      if (b.t === 'h2' || b.t === 'h3') { if (y + lh * 3 > Y1) flush(); y += gap; }
      if (b.t === 'h2') { const yy = y; page.push(D => D.line(X0, yy - 4, X1, yy - 4, 1, RIBLINE)); y += 6; }
      lines.forEach((ln, i) => {
        if (y + lh > Y1) flush();
        const yy = y;
        page.push(D => { if (b.t === 'li' && i === 0) D.circle(X0 + 6, yy + lh / 2, 2.4, INK); D.text(X0 + indent, yy + lh / 2, ln, size, INK, 'left', wt); });
        y += lh;
      });
      y += b.t === 'h2' ? 4 : gap;
    });
    if (page.length) flush();
  }
  if (o.schem) {
    const list = schemPieces(C);
    pages.push(D => {
      D.text(X0, Y0 + 10, '도식화', 22, INK, 'left', 700);
      const fs = 12, cols = 2;
      const cellW = (X1 - X0) / cols, cellH = (Y1 - Y0 - 40) / Math.ceil(list.length / cols);
      const maxWcm = Math.max(...list.map(pc => pc.W / C.gs)), maxHcm = Math.max(...list.map(pc => pc.total / C.gr));
      const scale = Math.min((cellW - fs * 14) / maxWcm, (cellH - fs * 9) / maxHcm);
      list.forEach((pc, i) => {
        const cx = X0 + (i % cols) * cellW, cy = Y0 + 40 + Math.floor(i / cols) * cellH;
        drawSchematicPiece(D, C, pc, cx + fs * 8, cy + fs * 6, scale, fs);
      });
    });
  }
  if (o.motifs) {
    const used = [];
    C.pieces.forEach(pc => pc.placements.slice().reverse().forEach(p => { if (p.kind === 'motif' && !used.find(m => m.id === p.motif.id)) used.push(p.motif); }));
    if (used.length) {
      let items = [], x = X0, y = Y0 + 40, rowH = 0;
      const pagesM = [];
      const pushPage = () => { const it = items; pagesM.push(it); items = []; x = X0; y = Y0 + 40; rowH = 0; };
      used.forEach(m => {
        const mp = motifPiece(m);
        const cs = 20;
        const G = chartGeom(mp, { cw: cs, ch: cs, title: `${m._label || ''} ${m.name}` });
        const w = Math.max(G.width, 200), h = G.height;
        if (x + w > X1) { x = X0; y += rowH + 20; rowH = 0; }
        if (y + h > Y1) pushPage();
        const ox = x, oy = y;
        items.push((D) => { const sub = new CanvasDraw(D.c, D.ox + ox * D.s, D.oy + oy * D.s, D.s); drawChart(sub, mp, { cw: cs, ch: cs, showKnit: true, title: `${m._label || ''} ${m.name}` }); });
        x += w + 24; rowH = Math.max(rowH, h);
      });
      if (items.length) pushPage();
      pagesM.forEach((it, i) => pages.push(D => { D.text(X0, Y0 + 10, i ? '무늬 차트 (이어서)' : '무늬 차트', 22, INK, 'left', 700); it.forEach(fn => fn(D)); }));
    }
  }
  if (o.charts) {
    const cw = o.cell * 4, ratio = o.ratio;
    C.pieces.forEach(pc => {
      const ch = ratio ? cw * C.gs / C.gr : cw;
      const G0 = chartGeom(pc, { cw, ch, title: 'x' });
      const availW = X1 - X0 - G0.mL - G0.mR, availH = Y1 - Y0 - G0.mT - G0.mB - 10;
      const nc0 = Math.max(1, Math.floor(availW / cw)), nr0 = Math.max(1, Math.floor(availH / ch));
      const nc = Math.ceil(pc.W / Math.ceil(pc.W / nc0)), nr = Math.ceil(pc.total / Math.ceil(pc.total / nr0));
      const tiles = [];
      for (let r0 = 1; r0 <= pc.total; r0 += nr) {
        for (let c1 = pc.W - 1; c1 >= 0; c1 -= nc) {
          const c0 = Math.max(0, c1 - nc + 1), r1 = Math.min(pc.total, r0 + nr - 1);
          let any = false;
          for (let r = r0; r <= r1 && !any; r++) for (let c = c0; c <= c1; c++) if (pc.codes[r] && pc.codes[r][c] != null) { any = true; break; }
          if (any) tiles.push({ r0, r1, c0, c1 });
        }
      }
      tiles.forEach((t, i) => {
        const title = `${pc.name} 차트 ${i + 1}/${tiles.length}: ${pc.W - t.c1}~${pc.W - t.c0}코, ${t.r0}~${t.r1}단`;
        pages.push(D => { const sub = new CanvasDraw(D.c, D.ox + X0 * D.s, D.oy + Y0 * D.s, D.s); drawChart(sub, pc, { cw, ch, r0: t.r0, r1: t.r1, c0: t.c0, c1: t.c1, showKnit: S.chart.showKnit, tint: S.chart.tint, center: S.chart.center, title }); });
      });
    });
  }
  return pages;
}

/* ===================== 시작 ===================== */
S.chart = { ...S.chart, ...LS.get('chart', {}) };
S.print = { ...S.print, ...LS.get('print', {}) };
window.addEventListener('DOMContentLoaded', () => Store.init());
