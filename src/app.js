'use strict';
/* ===================== 앱 상태 ===================== */
const PRESETS = {
  '44': { chest: 82, hip: 88, shoulder: 36, armDepth: 16.5, neckW: 14.5, armLen: 54, upperArm: 25.5, wrist: 15, length: 56 },
  '55': { chest: 86, hip: 92, shoulder: 38, armDepth: 17, neckW: 15, armLen: 55, upperArm: 27, wrist: 15.5, length: 58 },
  '66': { chest: 90, hip: 96, shoulder: 39, armDepth: 17.5, neckW: 15.5, armLen: 56, upperArm: 28.5, wrist: 16, length: 60 },
  '77': { chest: 95, hip: 100, shoulder: 40, armDepth: 18, neckW: 16, armLen: 57, upperArm: 30, wrist: 16.5, length: 61 },
  '88': { chest: 100, hip: 104, shoulder: 41, armDepth: 18.5, neckW: 16.5, armLen: 57.5, upperArm: 32, wrist: 17, length: 62 },
};
function defaultProject() {
  return {
    name: '새 도안', garment: 'pullover', neck: 'round', sleeve: 'setin', size: '55',
    body: { chest: 86, hip: 92, shoulder: 38, armDepth: 17, neckW: 15, armLen: 55, upperArm: 27, wrist: 15.5 },
    ease: { chest: 8, hip: 6, shoulder: 0, armDepth: 3, neckW: 2, armLen: 0, upperArm: 4, wrist: 4 },
    design: { length: 58, ribH: 6, cuffH: 6, neckbandH: 2.5, bandW: 3, frontNeckD: 7, backNeckD: 2, vDepth: 20, shoulderDrop: 2, capTop: 8, buttons: 6, shoulderMethod: 'bo' },
    gauge: { unit: '10cm', st: 22, row: 30, dens: 1.2, swatchW: 6, needle: 4, ribNeedle: 3.5, yarn: '', ballW: 50 },
    pattern: { bg: 'st', rib: '2x2', center: 'diamond10', side: 'rope6r', gap: 6, sep: 2, applyBack: false, applySleeve: true },
    memo: '',
  };
}
const S = {
  P: defaultProject(), id: null, dirty: false, tab: 'size', piece: 'back',
  chart: { cell: 14, showKnit: true, tint: true, ratio: false, center: true },
  print: { cell: 4, ratio: false, cover: true, schem: true, text: true, motifs: true, charts: true },
  projects: [], motifs: [], workers: ['지영'], worker: '', filterMine: false,
  C: null, T: null, err: null, rowSel: null, editor: null, store: 'local', dl: null,
};
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function allMotifs() { return BUILTIN_MOTIFS.concat(S.motifs.map(m => ({ ...m, custom: true }))); }
function getPath(o, p) { return p.split('.').reduce((a, k) => a == null ? a : a[k], o); }
function setPath(o, p, v) { const ks = p.split('.'); let a = o; ks.slice(0, -1).forEach(k => a = a[k]); a[ks[ks.length - 1]] = v; }
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 2600); }

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
  ['body', 'ease', 'design', 'gauge', 'pattern'].forEach(k => out[k] = { ...d[k], ...(p[k] || {}) });
  return out;
}
function saveDraft() { LS.set('draft', { P: S.P, id: S.id, dirty: S.dirty }); }
async function saveCurrent() {
  if (!S.id) S.id = uid();
  const rec = { name: S.P.name || '이름 없는 도안', owner: S.worker, updated: Date.now(), data: JSON.parse(JSON.stringify(S.P)) };
  try { await Store.saveProject(S.id, rec); S.dirty = false; saveDraft(); renderHeader(); toast(Store.db ? '공유 저장소에 저장했습니다.' : '이 기기에 저장했습니다.'); }
  catch (e) { toast('저장하지 못했습니다: ' + (e && e.code ? e.code : '오류')); }
}

/* ===================== 계산 ===================== */
let rcT = null;
function touch() { S.dirty = true; saveDraft(); updateSaveState(); clearTimeout(rcT); rcT = setTimeout(recompute, 220); }
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

/* ===================== 화면: 공통 ===================== */
const TABS = [['proj', '프로젝트'], ['size', '치수'], ['design', '디자인'], ['motif', '무늬'], ['chart', '차트'], ['schem', '도식화'], ['text', '서술형'], ['print', '출력']];
function renderAll() {
  $('#app').innerHTML = `
  <header class="top">
    <div class="brand"><span class="logo">코와단</span><span class="sub">대바늘 도안 설계</span></div>
    <div class="hdr" id="hdr"></div>
  </header>
  <nav class="tabs" id="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}">${n}</button>`).join('')}</nav>
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
    <button class="btn pri" id="saveBtn">${S.dirty ? '저장' : '저장됨'}</button>`;
  $('#pname').oninput = e => { S.P.name = e.target.value; touch(); };
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
  if (fromCompute && (S.tab === 'size' || S.tab === 'design')) { updateLive(); return; }
  if (fromCompute && S.tab === 'motif' && S.editor) return;
  const f = { proj: viewProj, size: viewSize, design: viewDesign, motif: viewMotif, chart: viewChart, schem: viewSchem, text: viewText, print: viewPrint }[S.tab];
  m.innerHTML = f();
  bindInputs(m);
  ({ proj: bindProj, size: bindSize, design: () => { }, motif: bindMotif, chart: bindChart, schem: () => { }, text: bindText, print: bindPrint })[S.tab]();
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
  // 완성 목표치, 경고 등 즉시 갱신
  document.querySelectorAll('[data-live]').forEach(el => {
    const k = el.dataset.live;
    if (k.startsWith('t.')) { const f = k.slice(2); const v = (S.P.body[f] || 0) + (S.P.ease[f] || 0); el.textContent = fmt(v); }
    if (k === 'warn') el.innerHTML = warnBox();
    if (k === 'summary') el.innerHTML = summaryHTML();
  });
}
function summaryHTML() {
  const C = S.C; if (!C) return '';
  const f = C.finished;
  return `<div class="sum"><div><b>완성 가슴둘레</b>${fmt(f.chest)}cm</div><div><b>총장</b>${fmt(f.length)}cm</div><div><b>소매길이</b>${fmt(f.sleeveLen)}cm</div><div><b>예상 실</b>${C.yarnG ? Math.ceil(C.yarnG / 10) * 10 + 'g' : '스와치 무게 입력 시'}</div></div>`;
}

/* ===================== 탭: 프로젝트 ===================== */
function viewProj() {
  const list = S.projects.filter(p => !S.filterMine || p.owner === S.worker).sort((a, b) => (b.updated || 0) - (a.updated || 0));
  return `
  <section class="card">
    <h2>작업자</h2>
    <p class="desc">두 분이 함께 쓰실 수 있도록 작업자를 나눠 둡니다. 저장할 때 현재 작업자 이름이 함께 기록됩니다.</p>
    <div class="chips">${S.workers.map((w, i) => `<span class="chip ${w === S.worker ? 'on' : ''}" data-w="${i}">${esc(w)}</span>`).join('')}</div>
    <div class="row"><input id="wname" placeholder="작업자 이름" class="inp"><button class="btn" id="wadd">추가</button><button class="btn" id="wren">현재 작업자 이름 바꾸기</button></div>
    <p class="desc small">저장 위치: ${Store.db ? '공유 저장소 (앱 주인과 편집 권한을 받은 사람만 볼 수 있음)' : '지금 쓰는 이 브라우저에만 저장됩니다. 다른 사람은 볼 수 없고, 브라우저 기록을 지우면 사라질 수 있으니 출력 탭의 JSON 백업을 받아 두세요.'}</p>
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
  $('#wadd').onclick = async () => { const n = $('#wname').value.trim(); if (!n || S.workers.includes(n)) return; S.workers.push(n); S.worker = n; LS.set('worker', n); await Store.saveWorkers().catch(() => { }); renderHeader(); renderTab(); };
  $('#wren').onclick = async () => { const n = $('#wname').value.trim(); if (!n) return toast('바꿀 이름을 입력하세요.'); const i = S.workers.indexOf(S.worker); S.workers[i] = n; S.worker = n; LS.set('worker', n); await Store.saveWorkers().catch(() => { }); renderHeader(); renderTab(); };
  $('#fmine').onchange = e => { S.filterMine = e.target.checked; renderTab(); };
  $('#pnew').onclick = () => ask('새 도안을 만들까요? 저장하지 않은 변경은 사라집니다.', () => { S.P = defaultProject(); S.id = null; S.dirty = true; saveDraft(); renderHeader(); S.tab = 'size'; recompute(); renderTab(); });
  $('#pdup').onclick = () => { S.P = JSON.parse(JSON.stringify(S.P)); S.P.name += ' 사본'; S.id = null; S.dirty = true; saveDraft(); renderHeader(); toast('복제했습니다. 저장을 누르면 새 도안으로 저장됩니다.'); };
  document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => {
    const p = S.projects.find(x => x.id === b.dataset.open); if (!p) return;
    const go = () => { S.P = migrate(p.data || {}); S.id = p.id; S.dirty = false; saveDraft(); renderHeader(); S.tab = 'chart'; recompute(); renderTab(); };
    S.dirty ? ask('저장하지 않은 변경이 있습니다. 그래도 열까요?', go) : go();
  });
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    const p = S.projects.find(x => x.id === b.dataset.del);
    ask(`"${p.name}" 도안을 삭제할까요? 되돌릴 수 없습니다.`, async () => { await Store.deleteProject(p.id).catch(() => { }); if (S.id === p.id) S.id = null; renderTab(); });
  });
  const ta = document.querySelector('textarea[data-path]');
  ta.oninput = () => { S.P.memo = ta.value; touch(); };
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
    <li><b>치수</b>: 사이즈 버튼을 누르거나 신체 치수를 넣고, 부위별 여유분과 게이지를 넣습니다.</li>
    <li><b>디자인</b>: 풀오버나 가디건, 목선, 소매 모양, 꽈배기 무늬 배치를 고릅니다.</li>
    <li><b>차트, 도식화, 서술형</b>: 결과를 확인합니다. 차트의 단을 누르면 그 단을 글로 읽어 줍니다.</li>
    <li><b>출력</b>: A4 PDF로 받아 인쇄합니다. 위의 저장 버튼으로 도안을 보관하세요.</li>
  </ol></section>`;
}
function viewSize() {
  const P = S.P;
  return `${welcomeHTML()}
  <div data-live="warn"></div>
  <section class="card">
    <div class="hrow"><h2>신체 치수와 여유분</h2>
      <div class="chips">${Object.keys(PRESETS).map(k => `<span class="chip ${P.size === k ? 'on' : ''}" data-preset="${k}">${k}</span>`).join('')}<span class="chip ${P.size === 'custom' ? 'on' : ''}" data-preset="custom">직접 입력</span></div></div>
    <p class="desc">신체 치수는 여유를 넣지 않은 몸 치수입니다. 여유분을 따로 넣으면 완성 목표 치수가 바로 계산됩니다. 사이즈 버튼은 여성 표준 체형 참고값을 채워 줍니다.</p>
    <div class="mtable">
      <div class="mh"><span>부위</span><span>신체 (cm)</span><span>여유 (cm)</span><span>완성 목표</span></div>
      ${BODY_ROWS.map(([k, n, h]) => `<div class="mr"><span class="mn">${n}<i>${h}</i></span>
        <span><input type="number" inputmode="decimal" step="0.5" data-path="body.${k}" data-num="1" value="${P.body[k]}"></span>
        <span><input type="number" inputmode="decimal" step="0.5" data-path="ease.${k}" data-num="1" value="${P.ease[k]}"></span>
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
    </div>
  </section>
  <div data-live="summary"></div>`;
}
function bindSize() {
  const wc = $('#wclose'); if (wc) wc.onclick = () => { LS.set('welcomed', true); renderTab(); };
  document.querySelectorAll('[data-preset]').forEach(el => el.onclick = () => {
    const k = el.dataset.preset;
    S.P.size = k;
    if (PRESETS[k]) { const p = PRESETS[k]; Object.keys(S.P.body).forEach(f => { if (p[f] !== undefined) S.P.body[f] = p[f]; }); S.P.design.length = p.length; }
    touch(); renderTab();
  });
}

/* ===================== 탭: 디자인 ===================== */
function motifOptions(withNone) {
  const ms = allMotifs();
  return [...(withNone ? [['', '없음']] : []), ...ms.map(m => [m.id, `${m.custom ? '[내 무늬] ' : ''}${m.name} (${expandMotif(m).w}코)`])];
}
function viewDesign() {
  const P = S.P;
  return `
  <div data-live="warn"></div>
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
  </section>
  <div data-live="summary"></div>`;
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
function editorFrom(m) {
  const ex = expandMotif(m);
  return { id: m.custom ? m.id : null, name: m.custom ? m.name : m.name + ' 변형', w: ex.w, h: ex.h, cells: ex.cells.map(r => r.map(v => typeof v === 'object' ? { ...v } : v)), tool: 'p' };
}
function editorTokens(E) {
  return E.cells.map(row => { const out = []; for (let c = 0; c < row.length; c++) { const v = row[c]; if (typeof v === 'object') { if (v.j === 0) out.push(v.tok); } else out.push(v); } return out; });
}
function viewEditor() {
  const E = S.editor;
  const m = { rows: editorTokens(E) };
  const errs = motifCheck(m);
  const cs = Math.max(16, Math.min(30, Math.floor(Math.min(window.innerWidth - 80, 700) / E.w)));
  E.cs = cs;
  return `
  <section class="card">
    <div class="hrow"><h2>무늬 편집</h2><div class="row"><button class="btn" id="ecancel">닫기</button><button class="btn pri" id="esave">무늬 저장</button></div></div>
    <div class="grid">
      <label class="fld"><span class="lb">무늬 이름</span><span class="iw"><input id="ename" value="${esc(E.name)}"></span></label>
      <label class="fld"><span class="lb">폭</span><span class="iw"><input id="ew" type="number" min="1" max="60" value="${E.w}"><em>코</em></span></label>
      <label class="fld"><span class="lb">높이</span><span class="iw"><input id="eh" type="number" min="1" max="80" value="${E.h}"><em>단</em></span></label>
    </div>
    <p class="desc">아래 기호를 고른 뒤 칸을 누르세요. 교차뜨기는 누른 칸부터 오른쪽으로 놓이며 홀수 단(겉면)에만 둡니다. 차트는 겉면에서 본 모양입니다.</p>
    <div class="pal">${PALETTE.map(t => `<button class="${E.tool === t ? 'on' : ''}" data-tool="${t}" title="${esc(symName(t))}">${symbolSVG(t, 20)}<span>${esc(symName(t))}</span></button>`).join('')}</div>
    <div class="row wrap"><button class="btn" id="efill">안면 단 자동 채우기</button><button class="btn" id="eclear">모두 겉뜨기로</button><button class="btn" id="eclearp">모두 안뜨기로</button></div>
    ${errs.length ? `<div class="alert"><ul>${errs.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>` : `<div class="ok">무늬가 올바릅니다.</div>`}
    <div class="ecanvas" id="ecanvas">${chartSVG(motifPiece(m), { cw: cs, ch: cs, showKnit: true })}</div>
    <h3>단별 설명 미리보기</h3>
    <ol class="rows">${motifRowsText(m).map(s => `<li>${esc(s)}</li>`).join('')}</ol>
  </section>`;
}
function bindMotif() {
  if (S.editor) return bindEditor();
  $('#mnew').onclick = () => { S.editor = { id: null, name: '새 무늬', w: 8, h: 8, cells: Array.from({ length: 8 }, () => Array(8).fill('k')), tool: 'LC2/2' }; renderTab(); };
  document.querySelectorAll('[data-medit]').forEach(b => b.onclick = () => { const m = allMotifs().find(x => x.id === b.dataset.medit); S.editor = editorFrom(m); renderTab(); });
  document.querySelectorAll('[data-mdel]').forEach(b => b.onclick = () => { const m = allMotifs().find(x => x.id === b.dataset.mdel); ask(`"${m.name}" 무늬를 삭제할까요?`, async () => { await Store.deleteMotif(m.id).catch(() => { }); recompute(); renderTab(); }); });
}
function bindEditor() {
  const E = S.editor;
  $('#ename').oninput = e => E.name = e.target.value;
  const resize = () => {
    const w = clamp(parseInt($('#ew').value) || 1, 1, 60), h = clamp(parseInt($('#eh').value) || 1, 1, 80);
    const cells = Array.from({ length: h }, (_, r) => Array.from({ length: w }, (_, c) => (E.cells[r] && E.cells[r][c] !== undefined) ? E.cells[r][c] : 'k'));
    // 잘린 교차 정리
    cells.forEach(row => row.forEach((v, c) => { if (typeof v === 'object') { const x = parseTok(v.tok); if (c - v.j + x.w > w) row[c] = 'k'; } }));
    E.w = w; E.h = h; E.cells = cells; renderTab();
  };
  $('#ew').onchange = resize; $('#eh').onchange = resize;
  document.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => { E.tool = b.dataset.tool; document.querySelectorAll('[data-tool]').forEach(x => x.classList.toggle('on', x === b)); });
  $('#ecancel').onclick = () => { S.editor = null; renderTab(); };
  $('#eclear').onclick = () => { E.cells = E.cells.map(r => r.map(() => 'k')); renderTab(); };
  $('#eclearp').onclick = () => { E.cells = E.cells.map(r => r.map(() => 'p')); renderTab(); };
  $('#efill').onclick = () => {
    for (let r = 1; r < E.h; r += 2) {
      const below = E.cells[r - 1];
      E.cells[r] = below.map(v => {
        if (typeof v === 'object') return crossOut(v.tok, v.j);
        if (v === 'p') return 'p';
        if (v === 'tk') return 'tk';
        return 'k';
      });
    }
    renderTab();
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
  cv.onclick = e => {
    const svg = cv.querySelector('svg'); const rect = svg.getBoundingClientRect();
    const pc = motifPiece({ rows: editorTokens(E) });
    const G = chartGeom(pc, { cw: E.cs, ch: E.cs });
    const sx = svg.viewBox.baseVal.width / rect.width;
    const x = (e.clientX - rect.left) * sx, y = (e.clientY - rect.top) * sx;
    const c = Math.floor((x - G.mL) / E.cs), rr = Math.floor((y - G.mT) / E.cs);
    const r = E.h - 1 - rr;
    if (c < 0 || c >= E.w || r < 0 || r >= E.h) return;
    placeTool(E, r, c, E.tool);
    renderTab();
  };
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

/* ===================== 탭: 차트 ===================== */
function viewChart() {
  const C = S.C;
  if (!C) return warnBox();
  const pc = C.pieces.find(p => p.id === S.piece) || C.pieces[0];
  const o = S.chart;
  const ch = o.ratio ? o.cell * C.gs / C.gr : o.cell;
  const syms = usedSymbols([pc]);
  return `
  <div data-live="warn"></div>
  <section class="card">
    <div class="chips">${C.pieces.map(p => `<span class="chip ${p.id === pc.id ? 'on' : ''}" data-piece="${p.id}">${esc(p.name)}</span>`).join('')}</div>
    <div class="row wrap ctl">
      <label class="zoom">크기 <input type="range" min="6" max="28" value="${o.cell}" id="zoom"></label>
      <label class="chk"><input type="checkbox" data-c="showKnit" ${o.showKnit ? 'checked' : ''}><span>겉뜨기 기호</span></label>
      <label class="chk"><input type="checkbox" data-c="tint" ${o.tint ? 'checked' : ''}><span>무늬 색</span></label>
      <label class="chk"><input type="checkbox" data-c="center" ${o.center ? 'checked' : ''}><span>중심선</span></label>
      <label class="chk"><input type="checkbox" data-c="ratio" ${o.ratio ? 'checked' : ''}><span>게이지 비율 칸</span></label>
    </div>
    <p class="desc small">${esc(pc.name)}: 시작 ${pc.kind === 'sleeve' ? pc.info.Ncuff : pc.info.Nh}코, 총 ${pc.total}단. 차트의 단을 누르면 그 단을 글로 읽어 줍니다.</p>
    <div id="rowtxt" class="rowtxt">${S.rowSel && S.rowSel.piece === pc.id ? rowTextHTML(pc, S.rowSel.r) : ''}</div>
    <div class="chartbox" id="chartbox">${chartSVG(pc, { cw: o.cell, ch, showKnit: o.showKnit, tint: o.tint, center: o.center })}</div>
  </section>
  <section class="card">
    <h2>기호</h2>
    <div class="legend">${syms.map(s => `<div class="lg">${symbolSVG(s, 22)}<span>${esc(symName(s))}${s === 'k' ? ' (빈 칸도 겉뜨기)' : ''}</span></div>`).join('')}</div>
    <p class="desc small">홀수 단은 겉면(오른쪽에서 왼쪽), 짝수 단은 안면(왼쪽에서 오른쪽)입니다. 안면에서는 기호의 반대로 뜹니다. 굵은 선은 10코, 10단마다, 붉은 선은 고무단 끝입니다.</p>
  </section>`;
}
function rowTextHTML(pc, r) {
  const row = pc.codes[r]; if (!row) return '';
  const rs = r % 2 === 1;
  const seq = [];
  const idx = []; row.forEach((v, c) => { if (v !== null && v !== undefined && v !== '>') idx.push(c); });
  (rs ? idx.slice().reverse() : idx).forEach(c => seq.push(row[c]));
  const live = row.filter(v => v !== null && v !== undefined).length;
  return `<b>${r}단 (${rs ? '겉면, 오른쪽부터' : '안면, 왼쪽부터'}, ${live}코)</b> ${esc(runsText(seq, !rs))}`;
}
function bindChart() {
  document.querySelectorAll('[data-piece]').forEach(el => el.onclick = () => { S.piece = el.dataset.piece; S.rowSel = null; renderTab(); });
  $('#zoom').onchange = e => { S.chart.cell = +e.target.value; LS.set('chart', S.chart); renderTab(); };
  document.querySelectorAll('[data-c]').forEach(el => el.onchange = () => { S.chart[el.dataset.c] = el.checked; LS.set('chart', S.chart); renderTab(); });
  const box = $('#chartbox');
  requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; box.scrollLeft = box.scrollWidth; });
  box.onclick = e => {
    const svg = box.querySelector('svg'); if (!svg) return;
    const pc = S.C.pieces.find(p => p.id === S.piece);
    const o = S.chart, ch = o.ratio ? o.cell * S.C.gs / S.C.gr : o.cell;
    const G = chartGeom(pc, { cw: o.cell, ch });
    const rect = svg.getBoundingClientRect();
    const y = (e.clientY - rect.top) * (svg.viewBox.baseVal.height / rect.height);
    const rr = Math.floor((y - G.mT) / ch);
    const r = G.r1 - rr;
    if (r < 1 || r > pc.total) return;
    S.rowSel = { piece: pc.id, r };
    $('#rowtxt').innerHTML = rowTextHTML(pc, r);
  };
}

/* ===================== 탭: 도식화 ===================== */
function viewSchem() {
  const C = S.C; if (!C) return warnBox();
  const T = C.T, f = C.finished, P = S.P;
  const tgt = { chest: C.T.chest, hem: C.T.hip, length: C.T.length, shoulder: C.isDrop ? null : C.T.shoulder, armDepth: C.T.armDepth, neckW: C.T.neckW, sleeveLen: C.T.armLen, upper: C.isDrop ? null : C.T.upper, cuff: C.T.wrist };
  const names = { chest: '가슴둘레', hem: '밑단둘레', length: '총장', shoulder: '어깨너비', armDepth: '진동깊이', neckW: '목너비', sleeveLen: '소매길이', upper: '소매통', cuff: '소맷부리' };
  const sign = v => (v > 0 ? '+' : v < 0 ? '-' : '') + fmt(Math.abs(v));
  return `
  <div data-live="warn"></div>
  <section class="card">
    <h2>도식화</h2>
    <div class="schem">${schematicSVG(C, Math.min(window.innerWidth, 1180) - 70)}</div>
  </section>
  <section class="card">
    <h2>완성 치수</h2>
    <table class="tbl"><thead><tr><th>부위</th><th>목표</th><th>실제</th><th>차이</th></tr></thead><tbody>
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
      <tr><td>실 사용량</td><td>${C.yarnG ? `약 ${Math.ceil(C.yarnG / 10) * 10}g (총 ${C.cells.toLocaleString()}코 기준, 여유 8% 포함)` : '스와치 무게를 넣으면 계산합니다'}</td></tr>
    </tbody></table>
  </section>`;
}

/* ===================== 탭: 서술형 ===================== */
function textHTML(T) {
  let html = '', inList = false;
  T.forEach(b => {
    if (b.t === 'li') { if (!inList) { html += '<ul>'; inList = true; } html += `<li>${esc(b.s)}</li>`; return; }
    if (inList) { html += '</ul>'; inList = false; }
    const tag = { h1: 'h1', h2: 'h2', h3: 'h3', p: 'p', note: 'p' }[b.t];
    html += `<${tag}>${esc(b.s)}</${tag}>`;
  });
  if (inList) html += '</ul>';
  return html;
}
function textPlain(T) { return T.map(b => b.t === 'h1' ? `${b.s}\n` : b.t === 'h2' ? `\n[${b.s}]` : b.t === 'h3' ? `\n${b.s}` : b.t === 'li' ? `- ${b.s}` : b.s).join('\n'); }
function viewText() {
  if (!S.C) return warnBox();
  return `<div data-live="warn"></div><section class="card doc"><div class="row end"><button class="btn" id="tcopy">글 전체 복사</button></div>${textHTML(S.T)}</section>`;
}
function bindText() {
  const b = $('#tcopy'); if (!b) return;
  b.onclick = async () => { try { await navigator.clipboard.writeText(textPlain(S.T)); toast('복사했습니다.'); } catch (e) { toast('복사가 막혀 있습니다. 글을 길게 눌러 선택해 주세요.'); } };
}

/* ===================== 탭: 출력 ===================== */
function viewPrint() {
  const o = S.print;
  const C = S.C;
  return `
  <section class="card">
    <h2>PDF 도안 만들기</h2>
    <p class="desc">A4 세로 PDF로 표지(재료, 게이지, 완성 치수, 기호), 도식화, 서술형 도안, 무늬 차트, 조각별 차트를 묶습니다. 큰 차트는 여러 장으로 나누고 각 장에 코, 단 범위를 적습니다. 받은 PDF를 열어 인쇄하면 됩니다.</p>
    <div class="grid">
      <label class="fld"><span class="lb">차트 칸 크기</span><span class="iw"><select id="pcell">${[3, 4, 5, 6].map(v => `<option value="${v}" ${o.cell === v ? 'selected' : ''}>${v}mm</option>`).join('')}</select></span></label>
    </div>
    <div class="row wrap">
      ${[['cover', '표지와 재료'], ['schem', '도식화'], ['text', '서술형 도안'], ['motifs', '무늬 차트'], ['charts', '조각 차트'], ['ratio', '게이지 비율 칸']].map(([k, n]) => `<label class="chk"><input type="checkbox" data-pr="${k}" ${o[k] ? 'checked' : ''}><span>${n}</span></label>`).join('')}
    </div>
    <div class="row wrap"><button class="btn pri big" id="mkpdf" ${C ? '' : 'disabled'}>PDF 저장</button>${IN_CLAUDE ? '' : `<button class="btn big" id="prpdf" ${C ? '' : 'disabled'}>PDF 열어서 인쇄</button>`}<span id="pdfst" class="desc"></span></div>
    ${S.dl === null ? '' : ''}
    <div id="pdfprev" class="pdfprev"></div>
  </section>
  <section class="card">
    <h2>백업과 옮기기</h2>
    <p class="desc">모든 도안과 직접 만든 무늬를 JSON 파일 하나로 저장하거나 불러옵니다. 다른 기기로 옮길 때 씁니다.</p>
    <div class="row wrap"><button class="btn" id="bk">JSON 백업 저장</button><label class="btn file">JSON 불러오기<input type="file" id="bkin" accept=".json,application/json"></label></div>
  </section>`;
}
const IN_CLAUDE = !!(window.claude && window.claude.use);
function browserDownload(filename, data) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: filename.endsWith('.json') ? 'application/json' : 'application/octet-stream' });
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
function bindPrint() {
  $('#pcell').onchange = e => { S.print.cell = +e.target.value; LS.set('print', S.print); };
  document.querySelectorAll('[data-pr]').forEach(el => el.onchange = () => { S.print[el.dataset.pr] = el.checked; LS.set('print', S.print); });
  $('#mkpdf').onclick = () => makePDF(false);
  const pr = $('#prpdf'); if (pr) pr.onclick = () => makePDF(true);
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
  };
}

/* ===================== PDF ===================== */
const PG = { W: 840, H: 1188, M: 48 }; // 1단위 = 0.25mm
async function makePDF(openIt) {
  const C = S.C; if (!C) return;
  const st = $('#pdfst'); const btn = openIt ? $('#prpdf') : $('#mkpdf');
  const win = openIt ? window.open('', '_blank') : null;
  if (win) win.document.write('<p style="font-family:sans-serif">PDF를 만드는 중입니다...</p>');
  if (!window.jspdf) { st.textContent = 'PDF 도구를 불러오는 중입니다. 잠시 후 다시 눌러 주세요.'; return; }
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
    const ok = await saveFile(`${(S.P.name || '도안').replace(/[\\/:*?"<>|]/g, '')}.pdf`, blob);
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
  // ---- 글 흐름 (표지 + 서술형)
  if (o.cover || o.text) {
    const blocks = [];
    const f = C.finished;
    if (o.cover) {
      blocks.push({ t: 'title', s: P.name || '도안' });
      blocks.push({ t: 'sub', s: `${C.isCard ? '가디건' : '풀오버'}, ${C.isV ? 'V넥' : '라운드넥'}, ${C.isDrop ? '드롭숄더' : '셋인 슬리브'}${P.size && P.size !== 'custom' ? `, 기준 사이즈 ${P.size}` : ''}` });
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
        page.push(D => { b.rows.forEach((r, i) => { const yy = y0 + i * 34; D.fillRect(X0, yy, X1 - X0, 32, i % 2 ? '#FBF7F2' : '#F4ECE3'); const cw = (X1 - X0) / 4; r.forEach((c, j) => D.text(X0 + cw * j + 12, yy + 16, c, 13, INK, 'left', j % 2 ? 400 : 700)); }); });
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
  // ---- 도식화
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
  // ---- 무늬 차트
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
  // ---- 조각 차트 (분할)
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
