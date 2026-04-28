// ==================== DATA LAYER ====================
const STORAGE_KEY = 'conta_finance_data';
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MESES_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function loadData() {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch(e) { console.error(e); }
  return null;
}
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    cartoes: state.cartoes, receitas: state.receitas,
    despesas: state.despesas, parcelamentos: state.parcelamentos,
    currentMonth: state.currentMonth
  }));
}

const saved = loadData();
const state = {
  cartoes: saved?.cartoes || {},       // { "Janeiro": [{cartao,data,nome,valor,tipo},...], ... }
  receitas: saved?.receitas || [],     // [{desc, valores:[12 months]}]
  despesas: saved?.despesas || [],     // [{desc, cat, valores:[12 months]}]
  parcelamentos: saved?.parcelamentos || [], // [{cartao,desc,valor,mesInicio,qtd}]
  currentMonth: saved?.currentMonth || 0
};
// Init empty months
MESES.forEach(m => { if (!state.cartoes[m]) state.cartoes[m] = []; });

// ==================== HELPERS ====================
function esc(s) { const d = document.createElement('div'); d.textContent = s||''; return d.innerHTML; }
function fmt(v) { return v != null && v !== '' && v !== 0 ? 'R$ ' + Number(v).toFixed(2).replace('.', ',') : '—'; }
function fmtNum(v) { return v != null && v !== '' && v !== 0 ? Number(v).toFixed(2).replace('.', ',') : ''; }
function toast(msg, err) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.toggle('error', !!err);
  t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500);
}
function badgeClass(cartao) {
  if (/santander/i.test(cartao)) return 'badge-santander';
  if (/c6/i.test(cartao)) return 'badge-c6';
  return 'badge-outro';
}

// ==================== TABS ====================
document.getElementById('tabNav').addEventListener('click', e => {
  const btn = e.target.closest('.tab-btn'); if (!btn) return;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('content-' + btn.dataset.tab).classList.add('active');
});

// ==================== CARTÕES GERAL ====================
function updateMonthLabel() {
  document.getElementById('monthLabelCartoes').textContent = MESES[state.currentMonth];
}
document.getElementById('prevMonthCartoes').addEventListener('click', () => {
  state.currentMonth = (state.currentMonth - 1 + 12) % 12; updateMonthLabel(); renderCartoes(); saveData();
});
document.getElementById('nextMonthCartoes').addEventListener('click', () => {
  state.currentMonth = (state.currentMonth + 1) % 12; updateMonthLabel(); renderCartoes(); saveData();
});

document.getElementById('cartoesForm').addEventListener('submit', e => {
  e.preventDefault();
  const mes = MESES[state.currentMonth];
  state.cartoes[mes].push({
    id: Date.now(),
    cartao: document.getElementById('cartoesCartao').value,
    data: document.getElementById('cartoesData').value,
    nome: document.getElementById('cartoesNome').value.trim(),
    valor: +document.getElementById('cartoesValor').value,
    tipo: document.getElementById('cartoesTipo').value
  });
  document.getElementById('cartoesForm').reset();
  renderCartoes(); saveData(); toast('Lançamento adicionado!');
});

function renderCartoes() {
  const mes = MESES[state.currentMonth];
  const items = state.cartoes[mes] || [];
  const tb = document.getElementById('cartoesTableBody');
  tb.innerHTML = '';
  let total = 0;
  items.forEach((it, i) => {
    total += it.valor || 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="badge ${badgeClass(it.cartao)}">${esc(it.cartao)}</span></td>
      <td>${esc(it.data)}</td>
      <td>${esc(it.nome)}</td>
      <td class="val-cell has-value">${fmt(it.valor)}</td>
      <td>${esc(it.tipo)}</td>
      <td><div class="action-cell">
        <button class="btn btn-danger" onclick="removeCartao(${i})">Remover</button>
      </div></td>`;
    tb.appendChild(tr);
  });
  document.getElementById('cartoesFoot').innerHTML = items.length ?
    `<tr><td colspan="3"><strong>Total ${mes}</strong></td><td class="val-cell has-value"><strong>${fmt(total)}</strong></td><td colspan="2"></td></tr>` : '';
  // Summary
  document.getElementById('cartoesSummary').innerHTML = `
    <div class="summary-item"><span class="label">Mês</span><span class="value neutral">${mes}</span></div>
    <div class="summary-item"><span class="label">Lançamentos</span><span class="value neutral">${items.length}</span></div>
    <div class="summary-item"><span class="label">Total</span><span class="value negative">${fmt(total)}</span></div>`;
}

function removeCartao(i) {
  const mes = MESES[state.currentMonth];
  if (!confirm('Remover este lançamento?')) return;
  state.cartoes[mes].splice(i, 1);
  renderCartoes(); saveData();
}

// ==================== ORÇAMENTO - RECEITAS ====================
document.getElementById('receitaForm').addEventListener('submit', e => {
  e.preventDefault();
  const desc = document.getElementById('receitaDesc').value.trim();
  const mes = +document.getElementById('receitaMes').value;
  const val = +document.getElementById('receitaValor').value;
  // Check if desc already exists
  let rec = state.receitas.find(r => r.desc === desc);
  if (!rec) { rec = { desc, valores: new Array(12).fill(0) }; state.receitas.push(rec); }
  rec.valores[mes] = (rec.valores[mes] || 0) + val;
  document.getElementById('receitaForm').reset();
  renderReceitas(); renderResumo(); saveData(); toast('Receita adicionada!');
});

function renderReceitas() {
  const tb = document.getElementById('receitaTableBody');
  tb.innerHTML = '';
  const totals = new Array(12).fill(0);
  state.receitas.forEach((rec, i) => {
    const tr = document.createElement('tr');
    let cells = `<td>${esc(rec.desc)}</td>`;
    for (let m = 0; m < 12; m++) {
      const v = rec.valores[m] || 0; totals[m] += v;
      cells += `<td class="val-cell ${v ? 'has-value' : 'empty'}">${fmtNum(v) || '—'}</td>`;
    }
    cells += `<td><button class="btn btn-danger" onclick="removeReceita(${i})">✕</button></td>`;
    tr.innerHTML = cells; tb.appendChild(tr);
  });
  document.getElementById('receitaFoot').innerHTML = state.receitas.length ?
    `<tr><td><strong>Total</strong></td>${totals.map(t => `<td class="val-cell">${fmtNum(t) || '—'}</td>`).join('')}<td></td></tr>` : '';
}
function removeReceita(i) { if (!confirm('Remover receita?')) return; state.receitas.splice(i,1); renderReceitas(); renderResumo(); saveData(); }

// ==================== ORÇAMENTO - DESPESAS ====================
document.getElementById('despesaForm').addEventListener('submit', e => {
  e.preventDefault();
  const desc = document.getElementById('despesaDesc').value.trim();
  const cat = document.getElementById('despesaCat').value;
  const mes = +document.getElementById('despesaMes').value;
  const val = +document.getElementById('despesaValor').value;
  let desp = state.despesas.find(d => d.desc === desc && d.cat === cat);
  if (!desp) { desp = { desc, cat, valores: new Array(12).fill(0) }; state.despesas.push(desp); }
  desp.valores[mes] = (desp.valores[mes] || 0) + val;
  document.getElementById('despesaForm').reset();
  renderDespesas(); renderResumo(); saveData(); toast('Despesa adicionada!');
});

function renderDespesas() {
  const tb = document.getElementById('despesaTableBody');
  tb.innerHTML = '';
  const totals = new Array(12).fill(0);
  state.despesas.forEach((d, i) => {
    const tr = document.createElement('tr');
    const bc = /essencial/i.test(d.cat) ? 'badge-santander' : /variável/i.test(d.cat) ? 'badge-c6' : 'badge-outro';
    let cells = `<td>${esc(d.desc)}</td><td><span class="badge ${bc}">${esc(d.cat)}</span></td>`;
    for (let m = 0; m < 12; m++) {
      const v = d.valores[m] || 0; totals[m] += v;
      cells += `<td class="val-cell ${v ? 'has-value' : 'empty'}">${fmtNum(v) || '—'}</td>`;
    }
    cells += `<td><button class="btn btn-danger" onclick="removeDespesa(${i})">✕</button></td>`;
    tr.innerHTML = cells; tb.appendChild(tr);
  });
  document.getElementById('despesaFoot').innerHTML = state.despesas.length ?
    `<tr><td colspan="2"><strong>Total</strong></td>${totals.map(t => `<td class="val-cell">${fmtNum(t) || '—'}</td>`).join('')}<td></td></tr>` : '';
}
function removeDespesa(i) { if (!confirm('Remover despesa?')) return; state.despesas.splice(i,1); renderDespesas(); renderResumo(); saveData(); }

function renderResumo() {
  const el = document.getElementById('orcamentoResumo');
  let html = '';
  for (let m = 0; m < 12; m++) {
    const rec = state.receitas.reduce((s, r) => s + (r.valores[m] || 0), 0);
    const desp = state.despesas.reduce((s, d) => s + (d.valores[m] || 0), 0);
    const saldo = rec - desp;
    html += `<div class="summary-card">
      <div class="month-name">${MESES_SHORT[m]}</div>
      <div class="amount ${saldo >= 0 ? 'positive' : 'negative'}">${fmt(saldo)}</div>
    </div>`;
  }
  el.innerHTML = html;
}

// ==================== PARCELAMENTOS ====================
document.getElementById('parcelForm').addEventListener('submit', e => {
  e.preventDefault();
  state.parcelamentos.push({
    id: Date.now(),
    cartao: document.getElementById('parcelCartao').value,
    desc: document.getElementById('parcelDesc').value.trim(),
    valor: +document.getElementById('parcelValor').value,
    mesInicio: +document.getElementById('parcelMesInicio').value,
    qtd: +document.getElementById('parcelQtd').value
  });
  document.getElementById('parcelForm').reset();
  renderParcelamentos(); saveData(); toast('Parcelamento adicionado!');
});

function renderParcelamentos() {
  const tb = document.getElementById('parcelTableBody');
  tb.innerHTML = '';
  const totals = new Array(12).fill(0);
  state.parcelamentos.forEach((p, i) => {
    const tr = document.createElement('tr');
    let cells = `<td><span class="badge ${badgeClass(p.cartao)}">${esc(p.cartao)}</span></td><td>${esc(p.desc)}</td>`;
    for (let m = 0; m < 12; m++) {
      const active = m >= p.mesInicio && m < p.mesInicio + p.qtd;
      if (active) { totals[m] += p.valor; cells += `<td class="val-cell has-value">${fmtNum(p.valor)}</td>`; }
      else cells += `<td class="val-cell empty">—</td>`;
    }
    cells += `<td><button class="btn btn-danger" onclick="removeParcel(${i})">✕</button></td>`;
    tr.innerHTML = cells; tb.appendChild(tr);
  });
  document.getElementById('parcelFoot').innerHTML = state.parcelamentos.length ?
    `<tr><td colspan="2"><strong>Total</strong></td>${totals.map(t => `<td class="val-cell">${fmtNum(t) || '—'}</td>`).join('')}<td></td></tr>` : '';
}
function removeParcel(i) { if (!confirm('Remover parcelamento?')) return; state.parcelamentos.splice(i,1); renderParcelamentos(); saveData(); }

// ==================== EXPORT XLSX ====================
document.getElementById('exportXlsx').addEventListener('click', () => {
  if (typeof XLSX === 'undefined') { toast('Biblioteca XLSX não carregou', true); return; }
  const wb = XLSX.utils.book_new();

  // Sheet 1: Cartões Geral (one sheet per month)
  MESES.forEach(mes => {
    const items = state.cartoes[mes] || [];
    if (!items.length) return;
    const data = [['Cartão de Crédito'], ['Data', 'Nome', 'Valor', 'Tipo']];
    items.forEach(it => data.push([it.data, it.nome, it.valor, it.tipo]));
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, mes);
  });

  // Sheet: Orçamento Doméstico
  const orcData = [['Receitas', '', ...MESES]];
  state.receitas.forEach(r => orcData.push([r.desc, '', ...r.valores]));
  const recTotals = new Array(12).fill(0);
  state.receitas.forEach(r => r.valores.forEach((v, i) => recTotals[i] += v || 0));
  orcData.push(['Receita Total', '', ...recTotals]);
  orcData.push([]);
  orcData.push(['Despesas', '', ...MESES]);
  state.despesas.forEach(d => orcData.push([d.desc, d.cat, ...d.valores]));
  const ws2 = XLSX.utils.aoa_to_sheet(orcData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Orçamento Doméstico');

  // Sheet: Parcelamentos
  const parcData = [['Parcelamentos Cartões'], ['Cartão', 'Descrição', ...MESES]];
  state.parcelamentos.forEach(p => {
    const row = [p.cartao, p.desc];
    for (let m = 0; m < 12; m++) {
      row.push(m >= p.mesInicio && m < p.mesInicio + p.qtd ? p.valor : '');
    }
    parcData.push(row);
  });
  const ws3 = XLSX.utils.aoa_to_sheet(parcData);
  XLSX.utils.book_append_sheet(wb, ws3, 'Parcelamentos');

  XLSX.writeFile(wb, 'Conta_Financas.xlsx');
  toast('Arquivo XLSX exportado!');
});

// ==================== IMPORT XLSX ====================
document.getElementById('importXlsx').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const wb = XLSX.read(ev.target.result, { type: 'array', cellDates: true });
      // Reset state
      MESES.forEach(m => state.cartoes[m] = []);
      state.receitas = []; state.despesas = []; state.parcelamentos = [];

      wb.SheetNames.forEach(name => {
        const ws = wb.Sheets[name];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (!data.length) return;

        // Detect sheet type by content
        const flat = data.flat().join(' ').toLowerCase();

        if (name === 'Orçamento Doméstico' || flat.includes('receita')) {
          importOrcamento(data);
        } else if (name === 'Parcelamentos' || name === 'Planilha1' && flat.includes('parcelamento')) {
          importParcelamentos(data);
        } else {
          // Treat as a month sheet for Cartões
          importCartoesMes(name, data);
        }
      });
      renderAll(); saveData();
      toast('XLSX importado com sucesso!');
    } catch(err) { toast('Erro ao importar: ' + err.message, true); console.error(err); }
  };
  reader.readAsArrayBuffer(file);
  e.target.value = '';
});

function importCartoesMes(mesName, data) {
  // Find closest month name
  const mesIdx = MESES.findIndex(m => mesName.toLowerCase().includes(m.toLowerCase()));
  const mes = mesIdx >= 0 ? MESES[mesIdx] : mesName;
  if (!state.cartoes[mes]) state.cartoes[mes] = [];

  let currentCartao = 'Outro';
  data.forEach(row => {
    if (!row || !row.length) return;
    const first = String(row[0] || '').trim();
    // Detect card header
    if (/cart[aã]o/i.test(first) && !/data/i.test(first)) {
      if (/santander/i.test(first)) currentCartao = 'Santander';
      else if (/c6/i.test(first)) currentCartao = 'C6 Bank';
      else currentCartao = first;
      return;
    }
    if (/^data$/i.test(first)) return; // header row
    // Data row
    const dateVal = row[0];
    const nome = String(row[1] || '').trim();
    const valor = parseFloat(row[2]) || 0;
    const tipo = String(row[3] || 'Outros').trim();
    if (!nome && !valor) return;
    let dataStr = '';
    if (dateVal instanceof Date) dataStr = dateVal.toISOString().split('T')[0];
    else if (dateVal) dataStr = String(dateVal);
    state.cartoes[mes].push({ id: Date.now() + Math.random(), cartao: currentCartao, data: dataStr, nome, valor, tipo });
  });
}

function importOrcamento(data) {
  let section = 'receita'; // or 'despesa'
  data.forEach(row => {
    if (!row || !row.length) return;
    const first = String(row[0] || '').trim().toLowerCase();
    if (first.includes('despesa')) { section = 'despesa'; return; }
    if (first.includes('receita') && !first.includes('total')) { section = 'receita'; return; }
    if (first.includes('total') || !first) return;
    const desc = String(row[0] || '').trim();
    if (!desc) return;
    const valores = [];
    const startCol = (section === 'despesa') ? 2 : 2;
    for (let i = startCol; i < startCol + 12; i++) valores.push(parseFloat(row[i]) || 0);
    if (section === 'receita') {
      state.receitas.push({ desc, valores });
    } else {
      const cat = String(row[1] || 'Essencial (D1)').trim();
      state.despesas.push({ desc, cat, valores });
    }
  });
}

function importParcelamentos(data) {
  data.forEach((row, ri) => {
    if (ri < 2 || !row || !row.length) return; // skip headers
    const cartao = String(row[0] || 'Outro').trim();
    const desc = String(row[1] || '').trim();
    if (!desc) return;
    let mesInicio = -1, qtd = 0, valor = 0;
    for (let m = 0; m < 12; m++) {
      const v = parseFloat(row[m + 2]) || 0;
      if (v > 0) {
        if (mesInicio < 0) { mesInicio = m; valor = v; }
        qtd++;
      }
    }
    if (mesInicio >= 0 && valor > 0) {
      state.parcelamentos.push({ id: Date.now() + Math.random(), cartao, desc, valor, mesInicio, qtd });
    }
  });
}

// ==================== JSON BACKUP ====================
document.getElementById('exportJson').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({
    cartoes: state.cartoes, receitas: state.receitas,
    despesas: state.despesas, parcelamentos: state.parcelamentos,
    currentMonth: state.currentMonth
  }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'conta_backup.json'; a.click(); URL.revokeObjectURL(a.href);
  toast('Backup JSON salvo!');
});

document.getElementById('importJson').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.cartoes) state.cartoes = data.cartoes;
      if (data.receitas) state.receitas = data.receitas;
      if (data.despesas) state.despesas = data.despesas;
      if (data.parcelamentos) state.parcelamentos = data.parcelamentos;
      if (data.currentMonth != null) state.currentMonth = data.currentMonth;
      MESES.forEach(m => { if (!state.cartoes[m]) state.cartoes[m] = []; });
      renderAll(); saveData(); toast('Backup restaurado!');
    } catch(err) { toast('Erro: ' + err.message, true); }
  };
  reader.readAsText(file); e.target.value = '';
});

// ==================== INIT ====================
function renderAll() {
  updateMonthLabel(); renderCartoes(); renderReceitas();
  renderDespesas(); renderResumo(); renderParcelamentos();
}
renderAll();
