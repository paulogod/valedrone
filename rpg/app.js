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
    ship: state.ship,
    combatShips: state.combatShips,
    notes: state.notes,
    currentTurn: state.currentTurn
  }));
}

const saved = loadData();
const state = {
  entities: saved?.entities || [],
  ship: saved?.ship || { name:'Default Ship', hp:100, maxHp:100, hardness:0, speed:30, abilities:[], crew:[], goods:'' },
  combatShips: saved?.combatShips || [],
  notes: saved?.notes || '',
  currentTurn: saved?.currentTurn || 0
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
  state.entities.push({
    id: Date.now(),
    name,
    type: document.getElementById('entityType').value,
    maxHp: +document.getElementById('entityMaxHp').value,
    hp: +document.getElementById('entityMaxHp').value,
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
    tr.innerHTML = `
      <td>${esc(ent.name)}</td>
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
    tb.appendChild(tr);
  });
  updateTurnCounter();
  // Update turn info
  if (state.entities.length && state.currentTurn < state.entities.length) {
    document.getElementById('turnMarker').value = state.entities[state.currentTurn].turn_info || '';
  }
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

// ==================== SHIP (EMBARCAÇÃO) ====================
function loadShipForm() {
  document.getElementById('shipName').value = state.ship.name || '';
  document.getElementById('shipMaxHp').value = state.ship.maxHp || 100;
  document.getElementById('shipHp').value = state.ship.hp || 100;
  document.getElementById('shipHardness').value = state.ship.hardness || 0;
  document.getElementById('shipSpeed').value = state.ship.speed || 30;
  document.getElementById('shipAbilities').value = (state.ship.abilities||[]).join('\n');
  document.getElementById('shipGoods').value = state.ship.goods || '';
}

document.getElementById('shipForm').addEventListener('submit', e => {
  e.preventDefault();
  state.ship.name = document.getElementById('shipName').value;
  state.ship.maxHp = +document.getElementById('shipMaxHp').value;
  state.ship.hp = +document.getElementById('shipHp').value;
  state.ship.hardness = +document.getElementById('shipHardness').value;
  state.ship.speed = +document.getElementById('shipSpeed').value;
  state.ship.abilities = document.getElementById('shipAbilities').value.split('\n').filter(Boolean);
  state.ship.goods = document.getElementById('shipGoods').value;
  renderShip(); saveData();
});

function renderShip() {
  const tb = document.getElementById('shipTableBody');
  const s = state.ship;
  const cls = hpClass(s.hp, s.maxHp);
  tb.innerHTML = `<tr>
    <td>${esc(s.name)}</td>
    <td class="hp-display ${cls}">${s.hp}</td>
    <td>${s.maxHp}</td>
    <td>${s.hardness}</td>
    <td>${s.speed}</td>
    <td>${esc(s.goods||'')}</td>
    <td><div class="action-cell">
      <input type="number" min="0" max="9999" value="0" id="shipDmgVal">
      <button class="btn btn-dmg" onclick="shipDamage()">Dano</button>
      <input type="number" min="0" max="9999" value="0" id="shipRepVal">
      <button class="btn btn-repair" onclick="shipRepair()">Reparar</button>
    </div></td></tr>`;
}

function shipDamage() {
  const v = +document.getElementById('shipDmgVal').value;
  state.ship.hp = Math.max(0, state.ship.hp - v);
  renderShip(); loadShipForm(); saveData();
}
function shipRepair() {
  const v = +document.getElementById('shipRepVal').value;
  state.ship.hp = Math.min(state.ship.maxHp, state.ship.hp + v);
  renderShip(); loadShipForm(); saveData();
}

// ==================== CREW (TRIPULAÇÃO) ====================
document.getElementById('crewForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('crewName').value.trim();
  if (!name) return;
  state.ship.crew = state.ship.crew || [];
  state.ship.crew.push({
    id: Date.now(), name,
    role: document.getElementById('crewRole').value,
    maxHp: +document.getElementById('crewMaxHp').value,
    hp: +document.getElementById('crewMaxHp').value,
    info: document.getElementById('crewInfo').value,
    actions: document.getElementById('crewActions').value
  });
  document.getElementById('crewForm').reset();
  renderCrew(); saveData();
});

function renderCrew() {
  const tb = document.getElementById('crewTableBody');
  tb.innerHTML = '';
  (state.ship.crew||[]).forEach((c, i) => {
    const cls = hpClass(c.hp, c.maxHp);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${esc(c.name)}</td>
      <td>${esc(c.role||'')}</td>
      <td class="hp-display ${cls}">${c.hp}/${c.maxHp}</td>
      <td>${esc(c.info||'')}</td>
      <td>${esc(c.actions||'')}</td>
      <td><div class="action-cell">
        <input type="number" min="0" max="9999" value="0" id="crDmg${i}">
        <button class="btn btn-dmg" onclick="crewDamage(${i})">Dano</button>
        <input type="number" min="0" max="9999" value="0" id="crHeal${i}">
        <button class="btn btn-heal" onclick="crewHeal(${i})">Curar</button>
        <button class="btn btn-danger" onclick="crewRemove(${i})">Remover</button>
      </div></td>`;
    tb.appendChild(tr);
  });
}

function crewDamage(i) {
  const v = +document.getElementById('crDmg'+i).value;
  state.ship.crew[i].hp = Math.max(0, state.ship.crew[i].hp - v);
  renderCrew(); saveData();
}
function crewHeal(i) {
  const v = +document.getElementById('crHeal'+i).value;
  const c = state.ship.crew[i];
  c.hp = Math.min(c.maxHp, c.hp + v);
  renderCrew(); saveData();
}
function crewRemove(i) {
  if (!confirm(`Remover "${state.ship.crew[i].name}"?`)) return;
  state.ship.crew.splice(i, 1);
  renderCrew(); saveData();
}

// ==================== COMBAT SHIPS (COMBATE NAVAL) ====================
document.getElementById('combatForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('combatShipName').value.trim();
  if (!name) return;
  state.combatShips.push({
    name,
    initiative: +document.getElementById('combatShipInitiative').value,
    hp: +document.getElementById('combatShipHp').value,
    maxHp: +document.getElementById('combatShipMaxHp').value,
    hardness: +document.getElementById('combatShipHardness').value,
    speed: +document.getElementById('combatShipSpeed').value,
    abilities: document.getElementById('combatShipAbilities').value.split(',').map(s=>s.trim()).filter(Boolean)
  });
  renderCombat(); saveData();
});

function renderCombat() {
  const tb = document.getElementById('combatTableBody');
  tb.innerHTML = '';
  state.combatShips.forEach((s, i) => {
    const cls = hpClass(s.hp, s.maxHp);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${esc(s.name)}</td>
      <td>${s.initiative}</td>
      <td class="hp-display ${cls}">${s.hp}</td>
      <td>${s.maxHp}</td>
      <td>${s.hardness}</td>
      <td>${s.speed}</td>
      <td>${esc((s.abilities||[]).join(', '))}</td>
      <td><div class="action-cell">
        <input type="number" min="0" max="9999" value="0" id="cbDmg${i}">
        <button class="btn btn-dmg" onclick="combatDamage(${i})">Dano</button>
        <input type="number" min="0" max="9999" value="0" id="cbRep${i}">
        <button class="btn btn-repair" onclick="combatRepair(${i})">Reparar</button>
        <button class="btn btn-danger" onclick="combatRemove(${i})">Remover</button>
      </div></td>`;
    tb.appendChild(tr);
  });
}

function combatDamage(i) {
  const v = +document.getElementById('cbDmg'+i).value;
  state.combatShips[i].hp = Math.max(0, state.combatShips[i].hp - v);
  renderCombat(); saveData();
}
function combatRepair(i) {
  const v = +document.getElementById('cbRep'+i).value;
  const s = state.combatShips[i];
  s.hp = Math.min(s.maxHp, s.hp + v);
  renderCombat(); saveData();
}
function combatRemove(i) {
  if (!confirm(`Remover "${state.combatShips[i].name}"?`)) return;
  state.combatShips.splice(i, 1);
  renderCombat(); saveData();
}

// ==================== NOTES ====================
const notesArea = document.getElementById('notesArea');
notesArea.value = state.notes;
notesArea.addEventListener('input', () => { state.notes = notesArea.value; saveData(); });

// ==================== EXPORT / IMPORT ====================
document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({
    entities: state.entities, ship: state.ship,
    combatShips: state.combatShips, notes: state.notes,
    currentTurn: state.currentTurn
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
      state.ship = data.ship || state.ship;
      state.combatShips = data.combatShips || data.enemyShips?.map(s => ({
        name: s.name, initiative: 0, hp: s.hp||s.maxHp, maxHp: s.maxHp||100,
        hardness: s.hardness||0, speed: s.speed||30, abilities: []
      })) || [];
      state.notes = data.notes || '';
      state.currentTurn = data.currentTurn || 0;
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
  loadShipForm();
  renderShip();
  renderCrew();
  renderCombat();
  notesArea.value = state.notes;
}
renderAll();
