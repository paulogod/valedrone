// ==================== DATA LAYER ====================
const STORAGE_KEY = 'rpg_master_data';

function loadData() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) { console.error('Load error:', e); }
  return null;
}

function saveData() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
    entities: state.entities,
    notes: state.notes,
    currentTurn: state.currentTurn
  }));
}

const saved = loadData();
const state = {
  entities: saved?.entities || [],
  notes: saved?.notes || '',
  currentTurn: saved?.currentTurn || 0,
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

// ==================== ENTITY (PERSONAGENS) ====================
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
    id: Date.now(),
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

function renderEntities() {
  const tb = document.getElementById('entityTableBody');
  tb.innerHTML = '';
  state.entities.forEach((ent, i) => {
    const tr = document.createElement('tr');
    if (i === state.currentTurn) tr.classList.add('current-turn');
    const cls = hpClass(ent.hp, ent.maxHp);
    const isEditing = state.editingIndex === i;

    if (isEditing) {
      tr.innerHTML = `
        <td><input type="text" class="table-input" value="${esc(ent.name)}" id="editName${i}"></td>
        <td>
          <select class="table-input" id="editType${i}">
            <option ${ent.type==='PC'?'selected':''}>PC</option>
            <option ${ent.type==='NPC'?'selected':''}>NPC</option>
            <option ${ent.type==='Monster'?'selected':''}>Monster</option>
          </select>
        </td>
        <td class="hp-display ${cls}">
          <input type="number" class="table-input hp-in" value="${ent.hp}" id="editHp${i}"> / 
          <input type="number" class="table-input hp-in" value="${ent.maxHp}" id="editMaxHp${i}">
        </td>
        <td><input type="number" class="table-input" value="${ent.initiative}" id="editInit${i}"></td>
        <td><input type="number" class="table-input" value="${ent.armor}" id="editArmor${i}"></td>
        <td><input type="text" class="table-input" value="${esc((ent.conditions||[]).join(', '))}" id="editCond${i}"></td>
        <td><input type="text" class="table-input" value="${esc((ent.abilities||[]).join(', '))}" id="editAbil${i}"></td>
        <td><div class="action-cell">
          <button class="btn btn-repair" onclick="saveEdit(${i})">✅ Salvar</button>
          <button class="btn btn-secondary" onclick="toggleEdit(-1)">❌ Cancelar</button>
        </div></td>`;
    } else {
      tr.innerHTML = `
        <td><div class="ficha-nome"><span class="col-clickable" onclick="toggleEdit(${i})">✏️ ${esc(ent.name)}</span>${ent.ref ? `<button class="btn-lupa" onclick="verMonstroNoBestiario('${esc(ent.ref)}')" title="Ver o bloco de estatísticas no Bestiário">📖</button>` : ''}</div></td>
        <td>${esc(ent.type)}</td>
        <td class="hp-display ${cls}">${ent.hp}/${ent.maxHp}</td>
        <td>${ent.initiative}</td>
        <td>${ent.armor}</td>
        <td>${esc((ent.conditions||[]).join(', '))}</td>
        <td>${esc((ent.abilities||[]).join(', '))}</td>
        <td><div class="action-cell">
          <input type="number" min="0" max="9999" value="0" id="entDmg${i}">
          <button class="btn btn-dmg" onclick="entityDamage(${i})">Dano</button>
          <input type="number" min="0" max="9999" value="0" id="entHeal${i}">
          <button class="btn btn-heal" onclick="entityHeal(${i})">Curar</button>
          <button class="btn btn-danger" onclick="entityRemove(${i})">Remover</button>
        </div></td>`;
    }
    tb.appendChild(tr);
  });
  updateTurnCounter();
}

function toggleEdit(index) {
  state.editingIndex = index;
  renderEntities();
}

function saveEdit(i) {
  state.entities[i].name = document.getElementById(`editName${i}`).value;
  state.entities[i].type = document.getElementById(`editType${i}`).value;
  state.entities[i].hp = +document.getElementById(`editHp${i}`).value;
  state.entities[i].maxHp = +document.getElementById(`editMaxHp${i}`).value;
  state.entities[i].initiative = +document.getElementById(`editInit${i}`).value;
  state.entities[i].armor = +document.getElementById(`editArmor${i}`).value;
  state.entities[i].conditions = document.getElementById(`editCond${i}`).value.split(',').map(s=>s.trim()).filter(Boolean);
  state.entities[i].abilities = document.getElementById(`editAbil${i}`).value.split(',').map(s=>s.trim()).filter(Boolean);
  
  state.entities.sort((a,b) => b.initiative - a.initiative);
  state.editingIndex = -1;
  renderEntities(); saveData();
}

function updateEnt(i, key, val) {
  if (key === 'conditions' || key === 'abilities') {
    state.entities[i][key] = val.split(',').map(s=>s.trim()).filter(Boolean);
  } else {
    state.entities[i][key] = val;
  }
  if (key === 'initiative') state.entities.sort((a,b) => b.initiative - a.initiative);
  renderEntities(); saveData();
}

function entityDamage(i) {
  const v = +document.getElementById('entDmg'+i).value;
  state.entities[i].hp = Math.max(0, state.entities[i].hp - v);
  renderEntities(); saveData();
}
function entityHeal(i) {
  const v = +document.getElementById('entHeal'+i).value;
  state.entities[i].hp = Math.min(state.entities[i].maxHp, state.entities[i].hp + v);
  renderEntities(); saveData();
}
function entityRemove(i) {
  if (!confirm(`Remover "${state.entities[i].name}"?`)) return;
  state.entities.splice(i, 1);
  if (!state.entities.length) state.currentTurn = 0;
  else state.currentTurn = state.currentTurn % state.entities.length;
  renderEntities(); saveData();
}

document.getElementById('nextTurnBtn').addEventListener('click', () => {
  if (!state.entities.length) return;
  state.entities.sort((a,b) => b.initiative - a.initiative);
  state.currentTurn = (state.currentTurn + 1) % state.entities.length;
  renderEntities(); saveData();
});

document.getElementById('turnMarker').addEventListener('input', e => {
  if (state.entities.length && state.currentTurn < state.entities.length) {
    state.entities[state.currentTurn].turn_info = e.target.value;
    saveData();
  }
});

function updateTurnCounter() {
  const el = document.getElementById('turnCounter');
  el.textContent = state.entities.length ? `${state.currentTurn+1}/${state.entities.length}` : '0/0';
}

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
}
state.fichas = carregarFichas();

/** Linha do painel a partir do JSON exportado (com ou sem resumo) */
function resumirFicha(dados) {
  const r = dados.resumo || {};
  const nivelBruto = (+dados.level1 || 1) + (dados.class2 && dados.class2 !== 'none' ? (+dados.level2 || 0) : 0);
  const pvMax = r.pvMax ?? null;
  return {
    id: dados.id || ('ficha_' + Date.now() + Math.random()),
    temResumo: !!dados.resumo,
    nome: r.nome ?? dados.name ?? '',
    jogador: r.jogador ?? dados.playerName ?? '',
    classe: r.classe || dados.class1 || '',
    subclasse: r.subclasse || '',
    especie: r.especie || dados.species || '',
    nivel: r.nivel ?? nivelBruto,
    nivelTexto: r.nivelTexto || String(r.nivel ?? nivelBruto),
    pvMax,
    pvAtual: r.pvAtual ?? dados.currentHp ?? pvMax,
    pvTemp: r.pvTemp ?? dados.tempHp ?? 0,
    ca: r.ca ?? null,
    iniciativa: r.iniciativa ?? null,
    percepcaoPassiva: r.percepcaoPassiva ?? null,
    percepcao: r.percepcao ?? null,
    carregadaEm: new Date().toISOString(),
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
    tr.innerHTML = `
      <td><div class="ficha-nome">${txt(i, 'nome', 'ficha-forte')}<button class="btn-lupa" onclick="fichaAbrir(${i})" title="${f.json ? 'Abrir a ficha completa' : 'Carregue o JSON de novo para abrir a ficha completa'}" ${f.json ? '' : 'disabled'}>🔍</button></div>${txt(i, 'jogador', 'ficha-sub')}
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
        <button class="btn btn-repair" onclick="fichaNoFormulario(${i})">➕ Personagens</button>
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
  salvarFichas(); renderFichas();
}

/** Dano gasta os temporários primeiro, como no Criador */
function fichaDano(i) {
  const f = state.fichas[i];
  let v = +document.getElementById('fichaDmg' + i).value || 0;
  const doTemp = Math.min(f.pvTemp || 0, v);
  f.pvTemp = (f.pvTemp || 0) - doTemp;
  f.pvAtual = Math.max(0, (f.pvAtual ?? f.pvMax ?? 0) - (v - doTemp));
  salvarFichas(); renderFichas();
}
function fichaCura(i) {
  const f = state.fichas[i];
  const v = +document.getElementById('fichaCura' + i).value || 0;
  const atual = (f.pvAtual ?? 0) + v;
  f.pvAtual = f.pvMax === null || f.pvMax === undefined ? atual : Math.min(f.pvMax, atual);
  salvarFichas(); renderFichas();
}

/** Seletor de ficha no formulário da aba Personagens */
function renderFichaSelect() {
  const sel = document.getElementById('entityFicha');
  if (!sel) return;
  sel.innerHTML = '<option value="">— preencher à mão —</option>' + state.fichas.map((f, i) =>
    `<option value="${i}">${esc(f.nome || '(sem nome)')}${f.classe ? ' — ' + esc(f.classe) + ' ' + esc(f.nivelTexto || '') : ''}</option>`).join('');
}

/** Preenche o formulário "Adicionar Personagem" com os dados da ficha */
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
    id: f.id, name: f.nome || '(sem nome)', type: 'PC',
    maxHp: f.pvMax ?? 0, hp: f.pvAtual ?? f.pvMax ?? 0,
    initiative: f.iniciativa ?? 0, armor: f.ca ?? 0,
    conditions: [], abilities: [], turn_info: ''
  };
  const j = state.entities.findIndex(e => e.id === f.id);
  if (j >= 0) state.entities[j] = { ...state.entities[j], name: ent.name, maxHp: ent.maxHp, hp: ent.hp, initiative: ent.initiative, armor: ent.armor };
  else state.entities.push(ent);
}

function fichaRemover(i) {
  if (!confirm(`Remover a ficha de "${state.fichas[i].nome || '(sem nome)'}"?`)) return;
  state.fichas.splice(i, 1);
  salvarFichas(); renderFichas();
}

document.getElementById('fichasCombateBtn').addEventListener('click', () => {
  if (!state.fichas.length) return;
  state.fichas.forEach((_, i) => fichaParaCombate(i));
  state.entities.sort((a,b) => b.initiative - a.initiative);
  renderEntities(); saveData();
  alert(`${state.fichas.length} ficha(s) enviada(s) para Personagens.`);
});

document.getElementById('fichasLimparBtn').addEventListener('click', () => {
  if (!state.fichas.length || !confirm('Remover todas as fichas carregadas?')) return;
  state.fichas = [];
  salvarFichas(); renderFichas();
});

// ==================== NOTES ====================
const notesArea = document.getElementById('notesArea');
notesArea.value = state.notes;
notesArea.addEventListener('input', () => { state.notes = notesArea.value; saveData(); });

// ==================== EXPORT / IMPORT ====================
document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({
    entities: state.entities, notes: state.notes,
    currentTurn: state.currentTurn, fichas: state.fichas,
    // Bestiário e encontros ficam em bestiario.js / encontros.js
    bestiario: typeof bst !== 'undefined' ? bst.meus : [],
    encontros: typeof enc !== 'undefined' ? enc.salvos : []
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
      if (Array.isArray(data.fichas)) { state.fichas = data.fichas; salvarFichas(); }
      if (Array.isArray(data.bestiario) && typeof bst !== 'undefined') { bst.meus = data.bestiario; salvarBestiario(); renderBestiario(); }
      if (Array.isArray(data.encontros) && typeof enc !== 'undefined') { enc.salvos = data.encontros; salvarEncontros(); renderTabela(); }
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

// ==================== INIT ====================
function renderAll() {
  renderEntities();
  renderFichas();
  notesArea.value = state.notes;
}
renderAll();
