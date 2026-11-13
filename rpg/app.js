// ==================== DATA LAYER ====================
const STORAGE_KEY = 'rpg_master_data';
const MESA_KEY = 'rpg_mesa_config';
const MESAS_LISTA_KEY = 'rpg_mesas_lista';

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) { console.error('Load error:', e); }
  return null;
}

let _masterDriveTimer = null;
function saveData() {
  const payload = JSON.stringify({
    entities: state.entities,
    notes: state.notes,
    currentTurn: state.currentTurn,
    round: state.round,
    turnoId: state.turnoId,
    registro: state.registro,
    diario: state.diario
  });
  try { sessionStorage.setItem(STORAGE_KEY, payload); } catch(e) {}
  try { localStorage.setItem(STORAGE_KEY, payload); } catch(e) {}
  if (typeof salvarEstadoNaMesaAtual === 'function') salvarEstadoNaMesaAtual();
  agendarBackupSessaoMestre();
}

const saved = loadData();
const state = {
  entities: saved?.entities || [],
  notes: saved?.notes || '',
  currentTurn: saved?.currentTurn || 0,
  round: saved?.round || 1,
  turnoId: saved?.turnoId ?? null,
  registro: saved?.registro || [],
  diario: saved?.diario || [],
  editingIndex: -1 // New: tracking which character is being edited
};

// ==================== TABS ====================
document.getElementById('tabNav').addEventListener('click', e => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('content-' + btn.dataset.tab).classList.add('active');
});

// ==================== HP HELPERS ====================
function hpClass(hp, max) {
  const pct = max > 0 ? hp / max : 0;
  if (hp <= 0) return 'hp-dead';
  if (pct <= 0.25) return 'hp-critical';
  if (pct <= 0.5) return 'hp-hurt';
  return 'hp-healthy';
}

// ==================== COMBATE: formulário de adicionar ====================
document.getElementById('entityForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('entityName').value.trim();
  if (!name) return;
  const maxHp = +document.getElementById('entityMaxHp').value;
  const ficha = state.fichaNoFormulario !== null && state.fichaNoFormulario !== undefined ? state.fichas[state.fichaNoFormulario] : null;
  const hpFicha = ficha && ficha.pvAtual !== null && ficha.pvAtual !== undefined ? Math.min(ficha.pvAtual, maxHp) : maxHp;
  state.fichaNoFormulario = null;
  document.getElementById('entityFicha').value = '';
  state.entities.push({
    id: ficha && !state.entities.some(x => x.id === ficha.id) ? ficha.id : Date.now(),
    fichaId: ficha ? ficha.id : null,
    name,
    type: document.getElementById('entityType').value,
    maxHp,
    hp: hpFicha,
    initiative: +document.getElementById('entityInitiative').value,
    armor: +document.getElementById('entityArmor').value,
    conditions: document.getElementById('entityConditions').value.split(',').map(s=>s.trim()).filter(Boolean),
    abilities: document.getElementById('entityAbilities').value.split(',').map(s=>s.trim()).filter(Boolean),
    turn_info: ''
  });
  state.entities.sort((a,b) => b.initiative - a.initiative);
  renderEntities();
  saveData();
});

// A lista do Combate, o cartão do turno e os controles de rodada ficam em combate.js

// ==================== FICHAS D&D 5.5 ====================
// Fichas exportadas pelo criador em ../dnd/. CA, PV máximo, iniciativa e
// percepção são contas do criador: ele grava o resultado em `resumo`, e aqui
// só se lê. Ficam no localStorage para o mestre não recarregar a cada sessão.
const FICHAS_KEY = 'rpg_fichas_dnd';

function carregarFichas() {
  try { return JSON.parse(localStorage.getItem(FICHAS_KEY)) || []; }
  catch(e) { return []; }
}
function salvarFichas() {
  try { localStorage.setItem(FICHAS_KEY, JSON.stringify(state.fichas)); }
  catch(e) { console.error('Fichas não salvas:', e); }
  if (typeof salvarEstadoNaMesaAtual === 'function') salvarEstadoNaMesaAtual();
}
state.fichas = carregarFichas();

/** Linha do painel a partir do JSON exportado (com ou sem resumo) */
function resumirFicha(dados, opcoesDrive = {}) {
  const r = dados.resumo || {};
  const nivelBruto = (+dados.level1 || 1) + (dados.class2 && dados.class2 !== 'none' ? (+dados.level2 || 0) : 0);
  const pvMax = r.pvMax ?? null;
  const pvAtual = dados.currentHp !== undefined && dados.currentHp !== null ? +dados.currentHp : (r.pvAtual ?? pvMax);
  const pvTemp = dados.tempHp !== undefined && dados.tempHp !== null ? +dados.tempHp : (r.pvTemp ?? 0);
  return {
    id: dados.id || ('ficha_' + Date.now() + Math.random()),
    temResumo: !!dados.resumo,
    nome: r.nome ?? dados.name ?? '',
    jogador: r.jogador ?? dados.playerName ?? opcoesDrive.driveOwnerEmail ?? '',
    classe: r.classe || dados.class1 || '',
    subclasse: r.subclasse || '',
    especie: r.especie || dados.species || '',
    nivel: r.nivel ?? nivelBruto,
    nivelTexto: r.nivelTexto || String(r.nivel ?? nivelBruto),
    pvMax,
    pvAtual,
    pvTemp,
    ca: r.ca ?? null,
    iniciativa: r.iniciativa ?? null,
    percepcaoPassiva: r.percepcaoPassiva ?? null,
    percepcao: r.percepcao ?? null,
    carregadaEm: new Date().toISOString(),
    driveFileId: opcoesDrive.driveFileId || dados.driveFileId || (dados.mesaVinculada && dados.mesaVinculada.driveFileId) || null,
    driveModifiedTime: opcoesDrive.driveModifiedTime || dados.driveModifiedTime || null,
    driveOwnerEmail: opcoesDrive.driveOwnerEmail || dados.driveOwnerEmail || '',
    // JSON inteiro, para a lupa abrir a ficha completa no Criador
    json: dados
  };
}

function lerArquivoTexto(file) {
  return new Promise((ok, erro) => {
    const reader = new FileReader();
    reader.onload = ev => ok(ev.target.result);
    reader.onerror = () => erro(reader.error);
    reader.readAsText(file);
  });
}

document.getElementById('fichasInput').addEventListener('change', async e => {
  const files = Array.from(e.target.files || []);
  const falhas = [];
  for (const file of files) {
    try {
      const dados = JSON.parse(await lerArquivoTexto(file));
      if (!dados || !dados.class1) throw new Error('não é uma ficha do Criador D&D 5.5');
      const ficha = resumirFicha(dados);
      const i = state.fichas.findIndex(f => f.id === ficha.id);
      if (i >= 0) state.fichas[i] = ficha; else state.fichas.push(ficha);
    } catch(err) { falhas.push(`${file.name}: ${err.message}`); }
  }
  e.target.value = '';
  salvarFichas(); renderFichas();
  if (falhas.length) alert('Não foi possível carregar:\n' + falhas.join('\n'));
});

const sinal = n => n === null || n === undefined ? '—' : (n >= 0 ? `+${n}` : `${n}`);
const valor = n => n === null || n === undefined ? '—' : n;

function renderFichas() {
  renderFichaSelect();
  const tb = document.getElementById('fichasTableBody');
  if (!state.fichas.length) {
    tb.innerHTML = '<tr><td colspan="9" class="fichas-ajuda">Nenhuma ficha carregada.</td></tr>';
    return;
  }
  tb.innerHTML = '';
  const txt = (i, k, extra = '') => `<input type="text" class="table-input ${extra}" value="${esc(state.fichas[i][k] ?? '')}" onchange="fichaEditar(${i}, '${k}', this.value)">`;
  const num = (i, k, extra = '') => `<input type="number" class="table-input ficha-in ${extra}" value="${state.fichas[i][k] ?? ''}" onchange="fichaEditar(${i}, '${k}', this.value === '' ? null : +this.value)">`;
  state.fichas.forEach((f, i) => {
    const tr = document.createElement('tr');
    const seloDrive = f.driveFileId
      ? `<span class="ficha-drive-badge" title="Ficha sincronizada via Google Drive${f.driveOwnerEmail ? ' (' + esc(f.driveOwnerEmail) + ')' : ''}">☁️ Drive Online</span>`
      : '';
    tr.innerHTML = `
      <td><div class="ficha-nome">${txt(i, 'nome', 'ficha-forte')}<button class="btn-lupa" onclick="fichaAbrir(${i})" title="${f.json ? 'Abrir a ficha completa' : 'Carregue o JSON de novo para abrir a ficha completa'}" ${f.json ? '' : 'disabled'}>🔍</button></div>${txt(i, 'jogador', 'ficha-sub')}${seloDrive}
        ${f.temResumo ? '' : '<span class="ficha-aviso">Ficha antiga: exporte de novo no Criador para trazer PV, CA, percepção e iniciativa.</span>'}</td>
      <td>${txt(i, 'classe')}${txt(i, 'subclasse', 'ficha-sub')}</td>
      <td>${txt(i, 'especie')}</td>
      <td>${txt(i, 'nivelTexto', 'ficha-in')}</td>
      <td class="hp-display ${hpClass(f.pvAtual ?? 0, f.pvMax ?? 0)}"><div class="ficha-pv">${num(i, 'pvAtual')} / ${num(i, 'pvMax')}</div>
        <div class="ficha-pv"><span class="ficha-sub">temp.</span>${num(i, 'pvTemp')}</div></td>
      <td>${num(i, 'ca')}</td>
      <td>${num(i, 'percepcaoPassiva')}<span class="ficha-sub">passiva</span></td>
      <td>${num(i, 'iniciativa')}</td>
      <td><div class="action-cell">
        <input type="number" min="0" max="9999" value="0" id="fichaDmg${i}">
        <button class="btn btn-dmg" onclick="fichaDano(${i})">Dano</button>
        <input type="number" min="0" max="9999" value="0" id="fichaCura${i}">
        <button class="btn btn-heal" onclick="fichaCura(${i})">Curar</button>
        <button class="btn btn-repair" onclick="fichaNoFormulario(${i})">➕ Combate</button>
        <button class="btn btn-danger" onclick="fichaRemover(${i})">Remover</button>
      </div></td>`;
    tb.appendChild(tr);
  });
}

/**
 * Abre a ficha completa no Criador (../dnd/) em outra aba. O JSON vai pelo
 * localStorage (mesma origem) sob um token único; o Criador consome a chave.
 * PV e nome seguem o que o mestre editou aqui.
 */
function fichaAbrir(i) {
  const f = state.fichas[i];
  if (!f || !f.json) return;
  const dados = { ...f.json, name: f.nome, playerName: f.jogador, currentHp: f.pvAtual, tempHp: f.pvTemp || 0 };
  const token = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  try {
    localStorage.setItem('dnd55_mestre_' + token, JSON.stringify(dados));
  } catch(e) {
    alert('Não foi possível abrir a ficha: sem espaço no navegador.');
    return;
  }
  window.open('../dnd/?ficha=' + token, '_blank');
}

function fichaEditar(i, k, v) {
  state.fichas[i][k] = v;
  if (k === 'percepcaoPassiva') state.fichas[i].percepcao = v === null ? null : v - 10;
  refletirFichaNoJsonECombate(i);
  salvarFichas(); renderFichas();
  agendarEnvioFichaMestre(i);
}

/** Dano gasta os temporários primeiro, como no Criador */
function fichaDano(i) {
  const f = state.fichas[i];
  let v = +document.getElementById('fichaDmg' + i).value || 0;
  const doTemp = Math.min(f.pvTemp || 0, v);
  f.pvTemp = (f.pvTemp || 0) - doTemp;
  f.pvAtual = Math.max(0, (f.pvAtual ?? f.pvMax ?? 0) - (v - doTemp));
  refletirFichaNoJsonECombate(i);
  salvarFichas(); renderFichas();
  agendarEnvioFichaMestre(i);
}
function fichaCura(i) {
  const f = state.fichas[i];
  const v = +document.getElementById('fichaCura' + i).value || 0;
  const atual = (f.pvAtual ?? 0) + v;
  f.pvAtual = f.pvMax === null || f.pvMax === undefined ? atual : Math.min(f.pvMax, atual);
  refletirFichaNoJsonECombate(i);
  salvarFichas(); renderFichas();
  agendarEnvioFichaMestre(i);
}

/** Seletor de ficha no formulário da aba Combate */
function renderFichaSelect() {
  const sel = document.getElementById('entityFicha');
  if (!sel) return;
  sel.innerHTML = '<option value="">— preencher à mão —</option>' + state.fichas.map((f, i) =>
    `<option value="${i}">${esc(f.nome || '(sem nome)')}${f.classe ? ' — ' + esc(f.classe) + ' ' + esc(f.nivelTexto || '') : ''}</option>`).join('');
}

/** Preenche o formulário "Adicionar ao Combate" com os dados da ficha */
function preencherFormularioComFicha(i) {
  const f = state.fichas[i];
  if (!f) return;
  const set = (id, v) => { document.getElementById(id).value = v; };
  set('entityName', f.nome || '');
  set('entityType', 'PC');
  set('entityMaxHp', f.pvMax ?? f.pvAtual ?? 10);
  set('entityInitiative', f.iniciativa ?? 0);
  set('entityArmor', f.ca ?? 0);
  set('entityConditions', '');
  set('entityAbilities', [
    [f.classe, f.nivelTexto].filter(Boolean).join(' '), f.especie,
    f.percepcaoPassiva !== null && f.percepcaoPassiva !== undefined ? `Percepção passiva ${f.percepcaoPassiva}` : ''
  ].filter(Boolean).join(', '));
  state.fichaNoFormulario = i;
}

function fichaNoFormulario(i) {
  renderFichaSelect();
  document.getElementById('entityFicha').value = String(i);
  preencherFormularioComFicha(i);
  document.getElementById('tab-personagens').click();
  document.getElementById('entityForm').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('entityFicha').addEventListener('change', e => {
  if (e.target.value === '') { state.fichaNoFormulario = null; return; }
  preencherFormularioComFicha(+e.target.value);
});

/** Envio direto, usado por "Enviar todas". Não duplica. */
function fichaParaCombate(i) {
  const f = state.fichas[i];
  const ent = {
    id: f.id, fichaId: f.id, name: f.nome || '(sem nome)', type: 'PC',
    maxHp: f.pvMax ?? 0, hp: f.pvAtual ?? f.pvMax ?? 0,
    initiative: f.iniciativa ?? 0, armor: f.ca ?? 0,
    conditions: [], abilities: [], turn_info: ''
  };
  const j = state.entities.findIndex(e => e.id === f.id || e.fichaId === f.id);
  if (j >= 0) state.entities[j] = { ...state.entities[j], fichaId: f.id, name: ent.name, maxHp: ent.maxHp, hp: ent.hp, initiative: ent.initiative, armor: ent.armor };
  else state.entities.push(ent);
}

function fichaRemover(i) {
  const f = state.fichas[i];
  if (!f || !confirm(`Remover a ficha de "${f.nome || '(sem nome)'}" desta mesa?`)) return;
  state.fichas.splice(i, 1);
  salvarFichas(); renderFichas(); atualizarPainelMesaOnline();
  if (window.VDGoogleDrive && typeof window.VDGoogleDrive.unlinkSheetFromMesa === 'function') {
    window.VDGoogleDrive.unlinkSheetFromMesa(f.json || { id: f.id }, state.mesa.id).catch(() => {});
  }
}

document.getElementById('fichasCombateBtn').addEventListener('click', () => {
  if (!state.fichas.length) return;
  state.fichas.forEach((_, i) => fichaParaCombate(i));
  state.entities.sort((a,b) => b.initiative - a.initiative);
  renderEntities(); saveData();
  alert(`${state.fichas.length} ficha(s) enviada(s) para o Combate.`);
});

document.getElementById('fichasLimparBtn').addEventListener('click', () => {
  if (!state.fichas.length || !confirm('Remover todas as fichas carregadas desta mesa?')) return;
  const antigas = state.fichas.slice();
  state.fichas = [];
  salvarFichas(); renderFichas(); atualizarPainelMesaOnline();
  if (window.VDGoogleDrive && typeof window.VDGoogleDrive.unlinkSheetFromMesa === 'function') {
    antigas.forEach(f => {
      window.VDGoogleDrive.unlinkSheetFromMesa(f.json || { id: f.id }, state.mesa.id).catch(() => {});
    });
  }
});

// ==================== NOTES ====================
const notesArea = document.getElementById('notesArea');
notesArea.value = state.notes;
notesArea.addEventListener('input', () => { state.notes = notesArea.value; saveData(); });

// ==================== EXPORT / IMPORT ====================
document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({
    entities: state.entities, notes: state.notes,
    currentTurn: state.currentTurn, round: state.round, registro: state.registro, diario: state.diario, fichas: state.fichas,
    // Bestiário e encontros ficam em bestiario.js / encontros.js
    bestiario: typeof bst !== 'undefined' ? bst.meus : [],
    encontros: typeof enc !== 'undefined' ? enc.salvos : [],
    encontroAtual: typeof enc !== 'undefined'
      ? { n: enc.n, nivel: enc.nivel, dif: enc.dif, atual: enc.atual, tesouro: enc.tesouro } : null
  }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'rpg_master_data.json';
  a.click(); URL.revokeObjectURL(a.href);
});

document.getElementById('importBtn').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      state.entities = data.entities || [];
      state.notes = data.notes || '';
      state.currentTurn = data.currentTurn || 0;
      state.round = data.round || 1;
      state.registro = data.registro || [];
      state.diario = data.diario || [];
      if (Array.isArray(data.fichas)) { state.fichas = data.fichas; salvarFichas(); }
      if (Array.isArray(data.bestiario) && typeof bst !== 'undefined') { bst.meus = data.bestiario; salvarBestiario(); renderBestiario(); }
      if (Array.isArray(data.encontros) && typeof enc !== 'undefined') { enc.salvos = data.encontros; salvarEncontros(); renderTabela(); }
      if (data.encontroAtual && typeof enc !== 'undefined') {
        Object.assign(enc, data.encontroAtual);
        salvarEncontros(); sincronizarGrupo(); renderMontagem();
      }
      renderAll(); saveData();
      alert('Dados importados com sucesso!');
    } catch(err) { alert('Erro ao importar: ' + err.message); }
  };
  reader.readAsText(file);
});

// ==================== HELPERS ====================
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

// ==================== MESA ONLINE & GOOGLE DRIVE SYNC ====================
function carregarConfigMesa() {
  try {
    const salvo = JSON.parse(localStorage.getItem(MESA_KEY) || 'null');
    if (salvo && salvo.id) return salvo;
  } catch (e) {}
  const novo = {
    id: 'mesa_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    nome: 'Mesa ValeDrone RPG'
  };
  try { localStorage.setItem(MESA_KEY, JSON.stringify(novo)); } catch (e) {}
  return novo;
}

function carregarListaMesasRpg(mesaInicial) {
  try {
    const lista = JSON.parse(localStorage.getItem(MESAS_LISTA_KEY) || '[]');
    if (Array.isArray(lista) && lista.length > 0) {
      if (mesaInicial && !lista.some(m => m.id === mesaInicial.id)) {
        lista.push({
          id: mesaInicial.id,
          nome: mesaInicial.nome || 'Mesa ValeDrone RPG',
          fichas: state.fichas || [],
          entities: state.entities || [],
          notes: state.notes || '',
          currentTurn: state.currentTurn || 0,
          round: state.round || 1,
          turnoId: state.turnoId ?? null,
          registro: state.registro || [],
          diario: state.diario || []
        });
      }
      return lista;
    }
  } catch (e) {}
  return [{
    id: mesaInicial.id,
    nome: mesaInicial.nome || 'Mesa ValeDrone RPG',
    fichas: state.fichas || [],
    entities: state.entities || [],
    notes: state.notes || '',
    currentTurn: state.currentTurn || 0,
    round: state.round || 1,
    turnoId: state.turnoId ?? null,
    registro: state.registro || [],
    diario: state.diario || []
  }];
}

function salvarConfigMesa() {
  try { localStorage.setItem(MESA_KEY, JSON.stringify(state.mesa)); } catch (e) {}
  salvarEstadoNaMesaAtual();
}

function salvarEstadoNaMesaAtual() {
  if (!state.mesa || !Array.isArray(state.mesas)) return;
  const idx = state.mesas.findIndex(m => m.id === state.mesa.id);
  const snapshot = {
    id: state.mesa.id,
    nome: state.mesa.nome || 'Mesa ValeDrone RPG',
    fichas: state.fichas || [],
    entities: state.entities || [],
    notes: state.notes || '',
    currentTurn: state.currentTurn || 0,
    round: state.round || 1,
    turnoId: state.turnoId ?? null,
    registro: state.registro || [],
    diario: state.diario || []
  };
  if (idx >= 0) state.mesas[idx] = snapshot;
  else state.mesas.push(snapshot);
  try { localStorage.setItem(MESAS_LISTA_KEY, JSON.stringify(state.mesas)); } catch (e) {}
}

function trocarMesaAtivaRpg(novoId) {
  if (!novoId || (state.mesa && state.mesa.id === novoId)) return;
  salvarEstadoNaMesaAtual();
  const alvo = (state.mesas || []).find(m => m.id === novoId);
  if (!alvo) return;
  state.mesa = { id: alvo.id, nome: alvo.nome || 'Mesa ValeDrone RPG' };
  state.fichas = Array.isArray(alvo.fichas) ? alvo.fichas : [];
  state.entities = Array.isArray(alvo.entities) ? alvo.entities : [];
  state.notes = alvo.notes || '';
  state.currentTurn = alvo.currentTurn || 0;
  state.round = alvo.round || 1;
  state.turnoId = alvo.turnoId ?? null;
  state.registro = Array.isArray(alvo.registro) ? alvo.registro : [];
  state.diario = Array.isArray(alvo.diario) ? alvo.diario : [];

  try { localStorage.setItem(MESA_KEY, JSON.stringify(state.mesa)); } catch (e) {}
  salvarFichas();
  saveData();
  renderAll();
  atualizarPainelMesaOnline();
  if (window.VDGoogleDrive && window.VDGoogleDrive.isLoggedIn()) {
    sincronizarMesaComDrive(true);
  }
  if (typeof avisoRapido === 'function') {
    avisoRapido(`🎲 Mesa alterada para "${state.mesa.nome}"`, 'neutro');
  }
}

function criarNovaMesaRpg() {
  const nome = prompt('Nome da nova Mesa / Campanha:', `Mesa ${(state.mesas ? state.mesas.length : 1) + 1}`);
  if (!nome || !nome.trim()) return;
  salvarEstadoNaMesaAtual();
  const nova = {
    id: 'mesa_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    nome: nome.trim(),
    fichas: [],
    entities: [],
    notes: '',
    currentTurn: 0,
    round: 1,
    turnoId: null,
    registro: [],
    diario: []
  };
  state.mesas.push(nova);
  trocarMesaAtivaRpg(nova.id);
}

function excluirMesaAtualRpg() {
  if (!Array.isArray(state.mesas) || state.mesas.length <= 1) {
    alert('É necessário manter pelo menos uma mesa ativa.');
    return;
  }
  if (!confirm(`Deseja excluir a mesa "${state.mesa.nome}"? As fichas originais no Google Drive dos jogadores e do Mestre NÃO serão apagadas.`)) return;
  const idRemovido = state.mesa.id;
  state.mesas = state.mesas.filter(m => m.id !== idRemovido);
  try { localStorage.setItem(MESAS_LISTA_KEY, JSON.stringify(state.mesas)); } catch (e) {}
  const proxima = state.mesas[0];
  state.mesa = { id: '', nome: '' };
  trocarMesaAtivaRpg(proxima.id);
}

state.mesa = carregarConfigMesa();
state.mesas = carregarListaMesasRpg(state.mesa);
const _enviosMestrePendentes = new Map();
let _sincronizandoMesa = false;

/**
 * Monta a URL de convite que o Mestre envia para os jogadores abrirem no /dnd
 */
function montarLinkConviteMesa() {
  const user = window.VDGoogleDrive && window.VDGoogleDrive.getUser();
  const base = new URL('../dnd/', window.location.href);
  base.searchParams.set('mesa', state.mesa.id);
  if (user && user.email) base.searchParams.set('mestre', user.email);
  if (state.mesa.nome) base.searchParams.set('nome', state.mesa.nome);
  return base.toString();
}

function atualizarPainelMesaOnline() {
  const selMesa = document.getElementById('mesaSelectRpg');
  const btnDelMesa = document.getElementById('mesaExcluirAtualBtn');
  const nomeIn = document.getElementById('mesaNomeInput');
  const linkIn = document.getElementById('mesaLinkInput');
  const pill = document.getElementById('mesaSyncStatus');
  const loginBtn = document.getElementById('rpgGoogleLoginBtn');
  const chip = document.getElementById('rpgUserChip');
  const userName = document.getElementById('rpgUserName');
  const userPic = document.getElementById('rpgUserPic');

  if (selMesa && Array.isArray(state.mesas)) {
    selMesa.innerHTML = state.mesas.map(m =>
      `<option value="${esc(m.id)}"${m.id === state.mesa.id ? ' selected' : ''}>🎲 ${esc(m.nome || 'Mesa')} (${(m.id === state.mesa.id ? state.fichas : (m.fichas || [])).length} fichas)</option>`
    ).join('');
  }
  if (btnDelMesa) {
    btnDelMesa.hidden = !Array.isArray(state.mesas) || state.mesas.length <= 1;
  }

  if (nomeIn && document.activeElement !== nomeIn) nomeIn.value = state.mesa.nome || 'Mesa ValeDrone RPG';
  if (linkIn) linkIn.value = montarLinkConviteMesa();

  const logado = window.VDGoogleDrive && window.VDGoogleDrive.isLoggedIn();
  const user = window.VDGoogleDrive && window.VDGoogleDrive.getUser();

  if (loginBtn) loginBtn.hidden = !!logado;
  if (chip) chip.hidden = !logado;
  if (logado && user) {
    if (userName) userName.textContent = user.name || user.email;
    if (userPic) {
      if (user.picture) { userPic.src = user.picture; userPic.hidden = false; }
      else userPic.hidden = true;
    }
  }
  if (pill) {
    const qtdOnline = (state.fichas || []).filter(f => f.driveFileId).length;
    if (logado) {
      pill.textContent = `🟢 Drive conectado (${user && user.email ? user.email : 'ativo'}) · ${qtdOnline} ficha(s) online nesta mesa`;
      pill.classList.add('ativo');
    } else {
      pill.textContent = '⚪ Faça login com Gmail para sincronizar as fichas do Drive';
      pill.classList.remove('ativo');
    }
  }
}

/**
 * Mantém o JSON interno da ficha e a criatura correspondente no Combate
 * alinhados quando o Mestre edita PV, PV Temp, CA ou Iniciativa na aba Personagens.
 */
function refletirFichaNoJsonECombate(i) {
  const f = state.fichas[i];
  if (!f) return;
  if (f.json) {
    f.json.name = f.nome;
    f.json.playerName = f.jogador;
    f.json.currentHp = f.pvAtual;
    f.json.tempHp = f.pvTemp || 0;
    if (!f.json.resumo) f.json.resumo = {};
    f.json.resumo.nome = f.nome;
    f.json.resumo.jogador = f.jogador;
    f.json.resumo.pvMax = f.pvMax;
    f.json.resumo.pvAtual = f.pvAtual;
    f.json.resumo.pvTemp = f.pvTemp || 0;
    f.json.resumo.ca = f.ca;
    f.json.resumo.iniciativa = f.iniciativa;
    f.json.resumo.percepcaoPassiva = f.percepcaoPassiva;
    f.json.resumo.percepcao = f.percepcao;
  }
  const ent = (state.entities || []).find(e => e.id === f.id || e.fichaId === f.id || (e.type === 'PC' && !e.fichaId && (e.name || '').trim() === (f.nome || '').trim()));
  if (ent) {
    if (f.pvMax !== null && f.pvMax !== undefined) ent.maxHp = +f.pvMax || ent.maxHp;
    if (f.pvAtual !== null && f.pvAtual !== undefined) ent.hp = +f.pvAtual;
    ent.tmp = +f.pvTemp || 0;
    if (f.ca !== null && f.ca !== undefined) ent.armor = +f.ca;
    renderEntities();
    saveData();
  }
}

/**
 * Chamado por combate.js quando o Mestre aplica dano, cura, PV temporários
 * ou testes contra a morte em um PC na aba Combate.
 */
function sincronizarEntidadeComFicha(ent) {
  if (!ent || ent.type !== 'PC') return;
  const idx = (state.fichas || []).findIndex(f => f.id === ent.id || (ent.fichaId && f.id === ent.fichaId) || (!ent.fichaId && (f.nome || '').trim() === (ent.name || '').trim()));
  if (idx < 0) return;
  const f = state.fichas[idx];
  f.pvAtual = ent.hp;
  f.pvMax = ent.maxHp;
  f.pvTemp = ent.tmp || 0;
  if (f.json) {
    f.json.currentHp = ent.hp;
    f.json.tempHp = ent.tmp || 0;
    if (ent.ds) {
      f.json.deathSaves = {
        succ1: ent.ds.s >= 1, succ2: ent.ds.s >= 2, succ3: ent.ds.s >= 3,
        fail1: ent.ds.f >= 1, fail2: ent.ds.f >= 2, fail3: ent.ds.f >= 3
      };
    }
    if (f.json.resumo) {
      f.json.resumo.pvAtual = ent.hp;
      f.json.resumo.pvMax = ent.maxHp;
      f.json.resumo.pvTemp = ent.tmp || 0;
    }
  }
  salvarFichas();
  renderFichas();
  agendarEnvioFichaMestre(idx);
}
window.sincronizarEntidadeComFicha = sincronizarEntidadeComFicha;

/**
 * Envia as alterações feitas pelo Mestre (dano, cura, edição) de volta
 * para o arquivo da ficha no Google Drive do jogador.
 */
function agendarEnvioFichaMestre(i) {
  const f = state.fichas[i];
  if (!f || !f.driveFileId || !f.json) return;
  if (!window.VDGoogleDrive || !window.VDGoogleDrive.isLoggedIn()) return;

  const fileId = f.driveFileId;
  if (_enviosMestrePendentes.has(fileId)) {
    clearTimeout(_enviosMestrePendentes.get(fileId));
  }
  const timer = setTimeout(async () => {
    _enviosMestrePendentes.delete(fileId);
    try {
      const res = await window.VDGoogleDrive.updateLinkedSheetAsMaster(fileId, f.json, state.mesa.id);
      const atual = state.fichas.find(x => x.driveFileId === fileId);
      if (atual && res && res.modifiedTime) {
        atual.driveModifiedTime = res.modifiedTime;
        salvarFichas();
      }
    } catch (err) {
      console.warn('Não foi possível sincronizar alteração com o Drive do jogador:', err);
    }
  }, 750);
  _enviosMestrePendentes.set(fileId, timer);
}

/**
 * Busca no Google Drive todas as fichas vinculadas à Mesa e atualiza
 * novas fichas ou fichas editadas pelos jogadores no /dnd.
 */
async function sincronizarMesaComDrive(silencioso = false) {
  if (!window.VDGoogleDrive || !window.VDGoogleDrive.isLoggedIn()) {
    if (!silencioso) {
      try {
        await window.VDGoogleDrive.login();
      } catch (err) {
        if (typeof avisoRapido === 'function') avisoRapido(err.message || 'Login cancelado.', 'dif');
        return;
      }
    } else {
      return;
    }
  }
  if (_sincronizandoMesa) return;
  _sincronizandoMesa = true;

  try {
    const arquivosMesa = await window.VDGoogleDrive.listMesaSheets(state.mesa.id);
    const mapaPorFileId = new Map();
    arquivosMesa.forEach(arq => mapaPorFileId.set(arq.id, arq));

    // Inclui também fichas que já foram vinculadas por ID direto
    for (const f of state.fichas) {
      if (f.driveFileId && !mapaPorFileId.has(f.driveFileId)) {
        try {
          const meta = await window.VDGoogleDrive.getFileMeta(f.driveFileId);
          if (meta && !meta.trashed) mapaPorFileId.set(meta.id, meta);
        } catch (e) { /* arquivo removido ou inacessível */ }
      }
    }

    let novas = 0;
    let atualizadas = 0;

    for (const [fileId, meta] of mapaPorFileId.entries()) {
      if (_enviosMestrePendentes.has(fileId)) continue; // não sobrescreve envio em trânsito

      const idxExistente = state.fichas.findIndex(f =>
        f.driveFileId === fileId || (meta.appProperties && meta.appProperties.vdCharId && f.id === meta.appProperties.vdCharId)
      );
      const existente = idxExistente >= 0 ? state.fichas[idxExistente] : null;

      if (existente && existente.driveModifiedTime && meta.modifiedTime && existente.driveModifiedTime === meta.modifiedTime) {
        continue; // sem mudanças desde a última leitura
      }

      try {
        const { data } = await window.VDGoogleDrive.getFileJson(fileId);
        if (!data || !data.class1) continue;
        const donoEmail = (meta.owners && meta.owners[0] && meta.owners[0].emailAddress) || data.driveOwnerEmail || '';
        const resumida = resumirFicha(data, {
          driveFileId: fileId,
          driveModifiedTime: meta.modifiedTime,
          driveOwnerEmail: donoEmail
        });

        if (idxExistente >= 0) {
          state.fichas[idxExistente] = resumida;
          atualizadas++;
        } else {
          state.fichas.push(resumida);
          novas++;
        }

        // Se o personagem já estiver na iniciativa do Combate, reflete os PV/CA atualizados pelo jogador
        const ent = (state.entities || []).find(e => e.id === resumida.id || e.fichaId === resumida.id || (e.type === 'PC' && !e.fichaId && (e.name || '').trim() === (resumida.nome || '').trim()));
        if (ent) {
          if (resumida.pvMax !== null && resumida.pvMax !== undefined) ent.maxHp = +resumida.pvMax || ent.maxHp;
          if (resumida.pvAtual !== null && resumida.pvAtual !== undefined) ent.hp = +resumida.pvAtual;
          ent.tmp = +resumida.pvTemp || 0;
          if (resumida.ca !== null && resumida.ca !== undefined) ent.armor = +resumida.ca;
        }
      } catch (err) {
        console.warn('Falha ao baixar ficha vinculada:', fileId, err);
      }
    }

    if (novas || atualizadas) {
      salvarFichas();
      renderFichas();
      renderEntities();
      saveData();
      if (typeof avisoRapido === 'function') {
        const msg = [];
        if (novas) msg.push(`${novas} nova(s) ficha(s) vinculada(s)`);
        if (atualizadas) msg.push(`${atualizadas} ficha(s) atualizada(s) do Drive`);
        avisoRapido(`☁️ ${msg.join(' · ')}`, 'neutro');
      }
    } else if (!silencioso && typeof avisoRapido === 'function') {
      avisoRapido('☁️ Fichas sincronizadas com o Google Drive (tudo em dia).', 'neutro');
    }
    atualizarPainelMesaOnline();
  } catch (err) {
    if (!silencioso && typeof avisoRapido === 'function') {
      avisoRapido('Erro ao sincronizar Drive: ' + err.message, 'dif');
    }
  } finally {
    _sincronizandoMesa = false;
  }
}

/**
 * Permite vincular uma ficha diretamente pelo link ou ID do arquivo no Google Drive
 * (ou automaticamente quando o Mestre abre ?fichaDrive=<id>).
 */
async function vincularFichaPorFileId(rawInput) {
  const texto = String(rawInput || '').trim();
  if (!texto) return;
  // Extrai o ID se o usuário colou uma URL inteira
  let fileId = texto;
  try {
    if (texto.includes('fichaDrive=')) {
      fileId = new URL(texto, window.location.origin).searchParams.get('fichaDrive') || texto;
    } else {
      const m = texto.match(/[-\w]{25,}/);
      if (m) fileId = m[0];
    }
  } catch (e) {}

  if (!window.VDGoogleDrive.isLoggedIn()) {
    await window.VDGoogleDrive.login();
  }
  const { meta, data } = await window.VDGoogleDrive.getFileJson(fileId);
  if (!data || !data.class1) throw new Error('O arquivo informado não é uma ficha válida do Criador D&D 5.5.');
  await incluirFichaDadosNaMesaAtual(data, meta);
}

async function incluirFichaDadosNaMesaAtual(dados, metaOpcoes = {}) {
  const user = window.VDGoogleDrive && window.VDGoogleDrive.getUser();
  const mestreEmail = (user && user.email) || '';
  const donoEmail = (metaOpcoes.owners && metaOpcoes.owners[0] && metaOpcoes.owners[0].emailAddress) || dados.driveOwnerEmail || mestreEmail;

  // Registra esta mesa na lista de mesas da ficha (sem remover outras mesas às quais a ficha já pertença)
  let resMeta = metaOpcoes;
  if (window.VDGoogleDrive && window.VDGoogleDrive.isLoggedIn()) {
    try {
      resMeta = await window.VDGoogleDrive.saveSheetToDrive(dados, {
        mesaId: state.mesa.id,
        mestreEmail,
        nomeMesa: state.mesa.nome || 'Mesa ValeDrone RPG',
        updatedBy: 'mestre'
      });
    } catch (e) {}
  }

  // Atualiza também no armazenamento local do /dnd se a ficha for do mesmo navegador
  try {
    const savedList = JSON.parse(localStorage.getItem('dnd55_saved_characters') || '[]');
    const idxLocal = savedList.findIndex(c => c.id === dados.id);
    if (idxLocal >= 0) {
      savedList[idxLocal].mesasVinculadas = dados.mesasVinculadas;
      savedList[idxLocal].mesaVinculada = dados.mesaVinculada;
      if (resMeta && resMeta.id) savedList[idxLocal].driveFileId = resMeta.id;
      localStorage.setItem('dnd55_saved_characters', JSON.stringify(savedList));
    }
  } catch (e) {}

  const ficha = resumirFicha(dados, {
    driveFileId: (resMeta && resMeta.id) || dados.driveFileId || null,
    driveModifiedTime: (resMeta && resMeta.modifiedTime) || dados.driveModifiedTime || new Date().toISOString(),
    driveOwnerEmail: donoEmail
  });
  const i = state.fichas.findIndex(f => f.id === ficha.id || (ficha.driveFileId && f.driveFileId === ficha.driveFileId));
  if (i >= 0) state.fichas[i] = ficha;
  else state.fichas.push(ficha);

  salvarFichas();
  renderFichas();
  atualizarPainelMesaOnline();
  if (typeof avisoRapido === 'function') {
    avisoRapido(`☁️ Ficha "${ficha.nome || 'sem nome'}" incluída na mesa "${state.mesa.nome}"!`, 'neutro');
  }
  return ficha;
}

/**
 * Abre um seletor com todas as fichas do próprio Mestre (salvas no Google Drive da conta
 * ou criadas no /dnd neste navegador), permitindo incluir uma, várias ou todas na mesa atual.
 */
async function abrirModalMinhasFichasMestre() {
  if (window.VDGoogleDrive && !window.VDGoogleDrive.isLoggedIn()) {
    try {
      await window.VDGoogleDrive.login();
      atualizarPainelMesaOnline();
    } catch (e) {}
  }

  let modal = document.getElementById('rpgMinhasFichasModal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'rpgMinhasFichasModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.85);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;z-index:99999;padding:1rem;font-family:Inter,sans-serif;';
  modal.innerHTML = `
    <div style="background:#111827;border:1px solid #4c1d95;border-radius:16px;max-width:600px;width:100%;padding:1.4rem;color:#f8fafc;box-shadow:0 20px 50px rgba(0,0,0,0.75);max-height:88vh;display:flex;flex-direction:column;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:.75rem;margin-bottom:.5rem;">
        <h3 style="margin:0;font-size:1.1rem;color:#f3e8ff;">🧙‍♂️ Minhas Fichas (/dnd &amp; Google Drive) → ${esc(state.mesa.nome || 'Mesa Atual')}</h3>
        <button type="button" id="rpgMfClose" style="background:none;border:none;color:#94a3b8;font-size:1.3rem;cursor:pointer;">✕</button>
      </div>
      <p style="margin:0 0 .85rem;font-size:.82rem;color:#cbd5e1;">Escolha quais personagens seus (ou fichas salvas na sua conta Google Drive / navegador) deseja colocar na mesa <strong>${esc(state.mesa.nome)}</strong>. Uma mesma ficha pode participar de várias mesas ao mesmo tempo.</p>
      <div id="rpgMfLista" style="display:flex;flex-direction:column;gap:.5rem;overflow-y:auto;flex:1;padding-right:.2rem;">
        <p style="color:#94a3b8;font-size:.85rem;text-align:center;padding:1.5rem 0;">🔄 Buscando suas fichas no Google Drive e no navegador...</p>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;flex-wrap:wrap;margin-top:1rem;padding-top:.75rem;border-top:1px solid #1e293b;">
        <a href="../dnd/" target="_blank" class="btn btn-secondary btn-sm">➕ Criar Nova Ficha no /dnd</a>
        <div style="display:flex;gap:.45rem;flex-wrap:wrap;">
          <button type="button" class="btn btn-primary btn-sm" id="rpgMfAddTodas" disabled>➕ Incluir Todas nesta Mesa</button>
          <button type="button" class="btn btn-secondary btn-sm" id="rpgMfFecharBtn">Fechar</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const fechar = () => modal.remove();
  modal.querySelector('#rpgMfClose').onclick = fechar;
  modal.querySelector('#rpgMfFecharBtn').onclick = fechar;
  modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });

  const mapaFichas = new Map();
  const temConteudo = (c) => c && (
    (c.name && c.name.trim() !== '') ||
    (c.class1 && c.class1 !== 'none') ||
    (c.species && c.species !== 'none')
  );

  // 1. Lê fichas salvas localmente no /dnd (mesmo navegador)
  try {
    const salvasLocal = JSON.parse(localStorage.getItem('dnd55_saved_characters') || '[]');
    salvasLocal.filter(temConteudo).forEach(c => mapaFichas.set(c.id, { dados: c, meta: { id: c.driveFileId || null, modifiedTime: c.driveModifiedTime || null } }));
    const ativaLocal = JSON.parse(localStorage.getItem('dnd55_active_character') || 'null');
    if (temConteudo(ativaLocal) && !ativaLocal._fichaDoMestre && !mapaFichas.has(ativaLocal.id)) {
      mapaFichas.set(ativaLocal.id, { dados: ativaLocal, meta: { id: ativaLocal.driveFileId || null, modifiedTime: ativaLocal.driveModifiedTime || null } });
    }
  } catch (e) {}

  // 2. Lê fichas do Google Drive / Nuvem da conta logada
  if (window.VDGoogleDrive && window.VDGoogleDrive.isLoggedIn()) {
    try {
      const remotos = await window.VDGoogleDrive.listMySheets();
      for (const arq of remotos) {
        const cid = (arq.appProperties && arq.appProperties.vdCharId) || arq.id;
        const jaTem = mapaFichas.get(cid);
        if (!jaTem || (arq.modifiedTime && (!jaTem.meta.modifiedTime || arq.modifiedTime > jaTem.meta.modifiedTime))) {
          try {
            const { data, meta } = await window.VDGoogleDrive.getFileJson(arq.id);
            if (temConteudo(data)) {
              data.driveFileId = arq.id;
              data.driveModifiedTime = arq.modifiedTime;
              mapaFichas.set(data.id || cid, { dados: data, meta: meta || arq });
            }
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  const listaEl = modal.querySelector('#rpgMfLista');
  const btnTodas = modal.querySelector('#rpgMfAddTodas');
  const entradas = Array.from(mapaFichas.values());

  const desenharLista = () => {
    if (entradas.length === 0) {
      listaEl.innerHTML = `<p style="color:#94a3b8;font-size:.86rem;text-align:center;padding:1.2rem;">Nenhuma ficha encontrada na sua conta ou navegador. Crie seus personagens no <a href="../dnd/" target="_blank" style="color:#a855f7;">Criador de Ficha (/dnd)</a> e clique em Salvar.</p>`;
      btnTodas.disabled = true;
      return;
    }
    btnTodas.disabled = false;
    listaEl.innerHTML = '';
    entradas.forEach(({ dados, meta }) => {
      const jaNestaMesa = state.fichas.some(f => f.id === dados.id || (dados.driveFileId && f.driveFileId === dados.driveFileId));
      const mesasFicha = (window.VDGoogleDrive && window.VDGoogleDrive.extractMesasFromCharacter)
        ? window.VDGoogleDrive.extractMesasFromCharacter(dados)
        : [];
      const nv = (+dados.level1 || 1) + (dados.class2 && dados.class2 !== 'none' ? (+dados.level2 || 0) : 0);

      const row = document.createElement('div');
      row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:.6rem;flex-wrap:wrap;padding:.65rem .85rem;border-radius:10px;background:#1e293b;border:1px solid ' + (jaNestaMesa ? 'rgba(34,197,94,0.45)' : '#334155') + ';';
      row.innerHTML = `
        <div style="flex:1;min-width:180px;">
          <div style="display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;">
            <strong style="color:#f8fafc;font-size:.92rem;">${esc(dados.name || '(Sem nome)')}</strong>
            ${dados.driveFileId ? '<span class="ficha-drive-badge">☁️ Drive</span>' : ''}
            ${mesasFicha.map(m => `<span class="ficha-drive-badge" style="background:rgba(168,85,247,0.18);color:#e9d5ff;border-color:rgba(168,85,247,0.4);">🔗 ${esc(m.nomeMesa || m.mesaId)}</span>`).join('')}
          </div>
          <div style="font-size:.78rem;color:#94a3b8;margin-top:.15rem;">
            ${esc(dados.species || '—')} • ${esc(dados.class1 || '—')} Nv ${nv} ${dados.playerName ? '• Jogador: ' + esc(dados.playerName) : ''}
          </div>
        </div>
        <div>
          <button type="button" class="btn ${jaNestaMesa ? 'btn-secondary' : 'btn-primary'} btn-sm">
            ${jaNestaMesa ? '🔄 Atualizar na Mesa' : '➕ Incluir nesta Mesa'}
          </button>
        </div>
      `;
      row.querySelector('button').onclick = async (ev) => {
        const btn = ev.currentTarget;
        btn.disabled = true;
        btn.textContent = '⏳ Vinculando...';
        try {
          await incluirFichaDadosNaMesaAtual(dados, meta);
          desenharLista();
        } catch (err) {
          btn.disabled = false;
          btn.textContent = '➕ Incluir nesta Mesa';
          alert('Erro ao incluir ficha: ' + err.message);
        }
      };
      listaEl.appendChild(row);
    });
  };

  desenharLista();

  btnTodas.onclick = async () => {
    btnTodas.disabled = true;
    btnTodas.textContent = '⏳ Incluindo todas...';
    for (const item of entradas) {
      try { await incluirFichaDadosNaMesaAtual(item.dados, item.meta); } catch (e) {}
    }
    desenharLista();
    btnTodas.textContent = '✅ Todas Incluídas!';
  };
}

function agendarBackupSessaoMestre() {
  if (!window.VDGoogleDrive || !window.VDGoogleDrive.isLoggedIn()) return;
  clearTimeout(_masterDriveTimer);
  _masterDriveTimer = setTimeout(async () => {
    try {
      await window.VDGoogleDrive.saveMasterSessionToDrive({
        mesa: state.mesa,
        mesas: state.mesas,
        entities: state.entities,
        notes: state.notes,
        currentTurn: state.currentTurn,
        round: state.round,
        registro: state.registro,
        diario: state.diario,
        fichas: state.fichas,
        bestiario: typeof bst !== 'undefined' ? bst.meus : [],
        encontros: typeof enc !== 'undefined' ? enc.salvos : []
      });
    } catch (e) { /* silencioso em background */ }
  }, 4000);
}

(function iniciarMesaOnlineRpg() {
  atualizarPainelMesaOnline();

  window.addEventListener('vd-google-auth-changed', () => {
    atualizarPainelMesaOnline();
    if (window.VDGoogleDrive && window.VDGoogleDrive.isLoggedIn()) {
      sincronizarMesaComDrive(true);
    }
  });

  const selMesa = document.getElementById('mesaSelectRpg');
  if (selMesa) {
    selMesa.addEventListener('change', () => {
      trocarMesaAtivaRpg(selMesa.value);
    });
  }

  const criarMesaBtn = document.getElementById('mesaCriarNovaBtn');
  if (criarMesaBtn) {
    criarMesaBtn.addEventListener('click', () => criarNovaMesaRpg());
  }

  const delMesaBtn = document.getElementById('mesaExcluirAtualBtn');
  if (delMesaBtn) {
    delMesaBtn.addEventListener('click', () => excluirMesaAtualRpg());
  }

  const minhasFichasBtn = document.getElementById('mesaMinhasFichasBtn');
  if (minhasFichasBtn) {
    minhasFichasBtn.addEventListener('click', () => abrirModalMinhasFichasMestre());
  }

  const minhasFichasTopoBtn = document.getElementById('fichasMinhasDriveBtn');
  if (minhasFichasTopoBtn) {
    minhasFichasTopoBtn.addEventListener('click', () => abrirModalMinhasFichasMestre());
  }

  const loginBtn = document.getElementById('rpgGoogleLoginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      try {
        await window.VDGoogleDrive.login({ prompt: 'select_account' });
        atualizarPainelMesaOnline();
        sincronizarMesaComDrive(false);
      } catch (err) {
        if (typeof avisoRapido === 'function') avisoRapido(err.message || 'Não foi possível entrar.', 'dif');
      }
    });
  }

  const logoutBtn = document.getElementById('rpgGoogleLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.VDGoogleDrive.logout();
      atualizarPainelMesaOnline();
      if (typeof avisoRapido === 'function') avisoRapido('Conta Google desconectada.', 'neutro');
    });
  }

  const configBtn = document.getElementById('rpgGoogleConfigBtn');
  if (configBtn) {
    configBtn.addEventListener('click', () => {
      window.VDGoogleDrive.openClientIdModal();
    });
  }

  const topoConviteBtn = document.getElementById('rpgConviteTopoBtn');
  if (topoConviteBtn) {
    topoConviteBtn.addEventListener('click', () => {
      document.getElementById('tab-fichas').click();
      const card = document.getElementById('mesaOnlineCard');
      if (card) card.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const nomeIn = document.getElementById('mesaNomeInput');
  if (nomeIn) {
    nomeIn.addEventListener('input', () => {
      state.mesa.nome = nomeIn.value.trim() || 'Mesa ValeDrone RPG';
      salvarConfigMesa();
      atualizarPainelMesaOnline();
    });
  }

  const copiarBtn = document.getElementById('mesaCopiarLinkBtn');
  if (copiarBtn) {
    copiarBtn.addEventListener('click', async () => {
      if (!window.VDGoogleDrive.isLoggedIn()) {
        try { await window.VDGoogleDrive.login(); } catch (e) {}
      }
      atualizarPainelMesaOnline();
      const link = montarLinkConviteMesa();
      try {
        await navigator.clipboard.writeText(link);
        if (typeof avisoRapido === 'function') avisoRapido('🔗 Link de convite copiado! Envie para os jogadores.', 'neutro');
      } catch (e) {
        const el = document.getElementById('mesaLinkInput');
        if (el) { el.select(); document.execCommand('copy'); }
        if (typeof avisoRapido === 'function') avisoRapido('🔗 Link copiado!', 'neutro');
      }
    });
  }

  const zapBtn = document.getElementById('mesaWhatsappBtn');
  if (zapBtn) {
    zapBtn.addEventListener('click', async () => {
      if (!window.VDGoogleDrive.isLoggedIn()) {
        try { await window.VDGoogleDrive.login(); } catch (e) {}
      }
      atualizarPainelMesaOnline();
      const link = montarLinkConviteMesa();
      const texto = `🎲 *${state.mesa.nome || 'Mesa de RPG'}* — Abra o link abaixo para criar ou vincular sua ficha D&D 5.5 à mesa do Mestre:\n${link}`;
      if (navigator.share) {
        try { await navigator.share({ title: state.mesa.nome || 'Mesa RPG', text: texto, url: link }); return; }
        catch (err) { if (err && err.name === 'AbortError') return; }
      }
      window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank', 'noopener');
    });
  }

  const syncBtn = document.getElementById('mesaSincronizarBtn');
  if (syncBtn) {
    syncBtn.addEventListener('click', () => sincronizarMesaComDrive(false));
  }

  const vincularIdBtn = document.getElementById('mesaVincularIdBtn');
  if (vincularIdBtn) {
    vincularIdBtn.addEventListener('click', async () => {
      const entrada = prompt('Cole o link da ficha enviado pelo jogador ou o ID do arquivo no Google Drive:');
      if (!entrada) return;
      try {
        await vincularFichaPorFileId(entrada);
      } catch (err) {
        alert('Não foi possível vincular a ficha: ' + err.message);
      }
    });
  }

  const novaMesaBtn = document.getElementById('mesaNovaIdBtn');
  if (novaMesaBtn) {
    novaMesaBtn.addEventListener('click', () => {
      if (!confirm('Gerar um novo código para esta mesa? Os jogadores precisarão usar o novo link para vincular novas fichas. (Se quiser criar uma segunda mesa mantendo esta, clique em "➕ Nova Mesa").')) return;
      state.mesa.id = 'mesa_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      salvarConfigMesa();
      atualizarPainelMesaOnline();
      if (typeof avisoRapido === 'function') avisoRapido('Novo código de mesa gerado.', 'neutro');
    });
  }

  // Se o Mestre abriu um link direto de ficha (?fichaDrive=<fileId>)
  try {
    const params = new URLSearchParams(window.location.search);
    const fichaDrive = params.get('fichaDrive');
    if (fichaDrive) {
      document.getElementById('tab-fichas').click();
      setTimeout(() => {
        vincularFichaPorFileId(fichaDrive).catch(err => console.warn(err));
      }, 400);
    }
  } catch (e) {}

  // Sincronização contínua em background a cada 8 segundos quando logado
  setInterval(() => {
    if (document.visibilityState === 'visible' && window.VDGoogleDrive && window.VDGoogleDrive.isLoggedIn()) {
      sincronizarMesaComDrive(true);
    }
  }, 8000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.VDGoogleDrive && window.VDGoogleDrive.isLoggedIn()) {
      sincronizarMesaComDrive(true);
    }
  });

  if (window.VDGoogleDrive && window.VDGoogleDrive.isLoggedIn()) {
    setTimeout(() => sincronizarMesaComDrive(true), 600);
  }
})();

// ==================== INIT ====================
function renderAll() {
  renderEntities();
  renderFichas();
  notesArea.value = state.notes;
}
renderAll();
