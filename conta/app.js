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

// ==================== INLINE CELL EDITING ====================
function inlineEditText(cell, value, onCommit, onCancel) {
  const input = document.createElement('input');
  input.type = 'text'; input.className = 'table-input'; input.value = value || '';
  cell.textContent = ''; cell.appendChild(input); input.focus(); input.select();
  let done = false;
  input.addEventListener('blur', () => { if (!done) { done = true; onCommit(input.value.trim()); } });
  input.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') input.blur();
    if (ev.key === 'Escape') { done = true; onCancel(); }
  });
}

function inlineEditNumber(cell, value, onCommit, onCancel) {
  const input = document.createElement('input');
  input.type = 'number'; input.step = '0.01'; input.className = 'table-input val-input'; input.value = value || '';
  cell.textContent = ''; cell.appendChild(input); input.focus(); input.select();
  let done = false;
  input.addEventListener('blur', () => { if (!done) { done = true; onCommit(+input.value || 0); } });
  input.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') input.blur();
    if (ev.key === 'Escape') { done = true; onCancel(); }
  });
}

function inlineEditDate(cell, value, onCommit, onCancel) {
  const input = document.createElement('input');
  input.type = 'date'; input.className = 'table-input'; input.value = value || '';
  cell.textContent = ''; cell.appendChild(input); input.focus();
  let done = false;
  input.addEventListener('blur', () => { if (!done) { done = true; onCommit(input.value); } });
  input.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') input.blur();
    if (ev.key === 'Escape') { done = true; onCancel(); }
  });
}

function inlineEditSelect(cell, options, value, onCommit) {
  const select = document.createElement('select');
  select.className = 'table-input';
  options.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o; opt.textContent = o; opt.selected = o === value;
    select.appendChild(opt);
  });
  cell.textContent = ''; cell.appendChild(select); select.focus();
  select.addEventListener('change', () => onCommit(select.value));
  select.addEventListener('blur', () => onCommit(select.value));
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

const CARTOES_TIPOS = ['Alimentação','Transporte','Lazer','Saúde','Educação','Moradia','Assinaturas','Outros'];

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
      <td class="editable" onclick="editCartaoBanco(${i}, this)"><span class="badge ${badgeClass(it.cartao)}">${esc(it.cartao)}</span></td>
      <td class="editable" onclick="editCartaoData(${i}, this)">${esc(it.data)}</td>
      <td class="editable" onclick="editCartaoNome(${i}, this)">${esc(it.nome)}</td>
      <td class="val-cell has-value editable" onclick="editCartaoValor(${i}, this)">${fmt(it.valor)}</td>
      <td class="editable" onclick="editCartaoTipo(${i}, this)">${esc(it.tipo)}</td>
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

function editCartaoBanco(i, cell) {
  const mes = MESES[state.currentMonth];
  inlineEditText(cell, state.cartoes[mes][i].cartao, val => {
    if (val) state.cartoes[mes][i].cartao = val;
    renderCartoes(); saveData();
  }, renderCartoes);
}
function editCartaoData(i, cell) {
  const mes = MESES[state.currentMonth];
  inlineEditDate(cell, state.cartoes[mes][i].data, val => {
    state.cartoes[mes][i].data = val;
    renderCartoes(); saveData();
  }, renderCartoes);
}
function editCartaoNome(i, cell) {
  const mes = MESES[state.currentMonth];
  inlineEditText(cell, state.cartoes[mes][i].nome, val => {
    state.cartoes[mes][i].nome = val;
    renderCartoes(); saveData();
  }, renderCartoes);
}
function editCartaoValor(i, cell) {
  const mes = MESES[state.currentMonth];
  inlineEditNumber(cell, state.cartoes[mes][i].valor, val => {
    state.cartoes[mes][i].valor = val;
    renderCartoes(); saveData();
  }, renderCartoes);
}
function editCartaoTipo(i, cell) {
  const mes = MESES[state.currentMonth];
  inlineEditSelect(cell, CARTOES_TIPOS, state.cartoes[mes][i].tipo, val => {
    state.cartoes[mes][i].tipo = val;
    renderCartoes(); saveData();
  });
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
    let cells = `<td class="editable" onclick="editReceitaDesc(${i}, this)">${esc(rec.desc)}</td>`;
    for (let m = 0; m < 12; m++) {
      const v = rec.valores[m] || 0; totals[m] += v;
      cells += `<td class="val-cell editable ${v ? 'has-value' : 'empty'}" onclick="editReceitaValor(${i}, ${m}, this)">${fmtNum(v) || '—'}</td>`;
    }
    cells += `<td><button class="btn btn-danger" onclick="removeReceita(${i})">✕</button></td>`;
    tr.innerHTML = cells; tb.appendChild(tr);
  });
  document.getElementById('receitaFoot').innerHTML = state.receitas.length ?
    `<tr><td><strong>Total</strong></td>${totals.map(t => `<td class="val-cell">${fmtNum(t) || '—'}</td>`).join('')}<td></td></tr>` : '';
}
function removeReceita(i) { if (!confirm('Remover receita?')) return; state.receitas.splice(i,1); renderReceitas(); renderResumo(); saveData(); }

function editReceitaDesc(i, cell) {
  inlineEditText(cell, state.receitas[i].desc, val => {
    if (val) state.receitas[i].desc = val;
    renderReceitas(); saveData();
  }, renderReceitas);
}
function editReceitaValor(i, m, cell) {
  inlineEditNumber(cell, state.receitas[i].valores[m], val => {
    state.receitas[i].valores[m] = val;
    renderReceitas(); renderResumo(); saveData();
  }, renderReceitas);
}

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
    let cells = `<td class="editable" onclick="editDespesaDesc(${i}, this)">${esc(d.desc)}</td>` +
      `<td class="editable" onclick="editDespesaCat(${i}, this)"><span class="badge ${bc}">${esc(d.cat)}</span></td>`;
    for (let m = 0; m < 12; m++) {
      const v = d.valores[m] || 0; totals[m] += v;
      cells += `<td class="val-cell editable ${v ? 'has-value' : 'empty'}" onclick="editDespesaValor(${i}, ${m}, this)">${fmtNum(v) || '—'}</td>`;
    }
    cells += `<td><button class="btn btn-danger" onclick="removeDespesa(${i})">✕</button></td>`;
    tr.innerHTML = cells; tb.appendChild(tr);
  });
  document.getElementById('despesaFoot').innerHTML = state.despesas.length ?
    `<tr><td colspan="2"><strong>Total</strong></td>${totals.map(t => `<td class="val-cell">${fmtNum(t) || '—'}</td>`).join('')}<td></td></tr>` : '';
}
function removeDespesa(i) { if (!confirm('Remover despesa?')) return; state.despesas.splice(i,1); renderDespesas(); renderResumo(); saveData(); }

function editDespesaDesc(i, cell) {
  inlineEditText(cell, state.despesas[i].desc, val => {
    if (val) state.despesas[i].desc = val;
    renderDespesas(); saveData();
  }, renderDespesas);
}
function editDespesaCat(i, cell) {
  inlineEditSelect(cell, ['Essencial (D1)', 'Variável (D2)', 'Extra (D3)'], state.despesas[i].cat, val => {
    state.despesas[i].cat = val;
    renderDespesas(); saveData();
  });
}
function editDespesaValor(i, m, cell) {
  inlineEditNumber(cell, state.despesas[i].valores[m], val => {
    state.despesas[i].valores[m] = val;
    renderDespesas(); renderResumo(); saveData();
  }, renderDespesas);
}

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
    let cells = `<td class="editable" onclick="editParcelCartao(${i}, this)"><span class="badge ${badgeClass(p.cartao)}">${esc(p.cartao)}</span></td>` +
      `<td class="editable" onclick="editParcelDesc(${i}, this)">${esc(p.desc)}</td>` +
      `<td class="val-cell has-value editable" onclick="editParcelValor(${i}, this)">${fmtNum(p.valor)}</td>` +
      `<td class="editable" onclick="editParcelMesInicio(${i}, this)">${esc(MESES[p.mesInicio])}</td>` +
      `<td class="val-cell has-value editable" onclick="editParcelQtd(${i}, this)">${p.qtd}</td>`;
    for (let m = 0; m < 12; m++) {
      const active = m >= p.mesInicio && m < p.mesInicio + p.qtd;
      if (active) { totals[m] += p.valor; cells += `<td class="val-cell has-value">${fmtNum(p.valor)}</td>`; }
      else cells += `<td class="val-cell empty">—</td>`;
    }
    cells += `<td><button class="btn btn-danger" onclick="removeParcel(${i})">✕</button></td>`;
    tr.innerHTML = cells; tb.appendChild(tr);
  });
  document.getElementById('parcelFoot').innerHTML = state.parcelamentos.length ?
    `<tr><td colspan="5"><strong>Total</strong></td>${totals.map(t => `<td class="val-cell">${fmtNum(t) || '—'}</td>`).join('')}<td></td></tr>` : '';
}

function editParcelCartao(i, cell) {
  inlineEditText(cell, state.parcelamentos[i].cartao, val => {
    if (val) state.parcelamentos[i].cartao = val;
    renderParcelamentos(); saveData();
  }, renderParcelamentos);
}
function editParcelDesc(i, cell) {
  inlineEditText(cell, state.parcelamentos[i].desc, val => {
    if (val) state.parcelamentos[i].desc = val;
    renderParcelamentos(); saveData();
  }, renderParcelamentos);
}
function editParcelValor(i, cell) {
  inlineEditNumber(cell, state.parcelamentos[i].valor, val => {
    state.parcelamentos[i].valor = val;
    renderParcelamentos(); saveData();
  }, renderParcelamentos);
}
function editParcelMesInicio(i, cell) {
  inlineEditSelect(cell, MESES, MESES[state.parcelamentos[i].mesInicio], val => {
    state.parcelamentos[i].mesInicio = MESES.indexOf(val);
    renderParcelamentos(); saveData();
  });
}
function editParcelQtd(i, cell) {
  inlineEditNumber(cell, state.parcelamentos[i].qtd, val => {
    state.parcelamentos[i].qtd = Math.max(1, Math.min(48, val || 1));
    renderParcelamentos(); saveData();
  }, renderParcelamentos);
}

function removeParcel(i) { if (!confirm('Remover parcelamento?')) return; state.parcelamentos.splice(i,1); renderParcelamentos(); saveData(); }

// ==================== GRÁFICOS ====================
// Paleta validada (checks de luminosidade OKLCH, separação CVD e contraste
// contra a superfície escura do app — ver scripts/validate_palette.js do
// skill de dataviz). Não usar os tons claros (#10b981/#34d399/#f87171) da UI
// direto nos gráficos: eles falham o teste de faixa de luminosidade no modo escuro.
const CHART_COLORS = {
  receita: '#059669',
  despesa: '#2563eb',
  positivo: '#059669',
  negativo: '#dc2626',
  categoria: '#ea580c'
};

function fmtAxis(v) {
  if (!v) return '0';
  return 'R$ ' + Math.round(v).toLocaleString('pt-BR');
}

function niceStep(max) {
  if (max <= 0) return 1;
  const rough = max / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  const mult = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return mult * mag;
}

// Retângulo com cantos arredondados só na ponta de dados; a base (encontro
// com a linha de referência) fica quadrada — regra do skill de dataviz.
function roundTopRectPath(x, yTop, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h));
  const yBot = yTop + h;
  return `M${x},${yBot} L${x},${yTop + r} Q${x},${yTop} ${x + r},${yTop} L${x + w - r},${yTop} Q${x + w},${yTop} ${x + w},${yTop + r} L${x + w},${yBot} Z`;
}
function roundBottomRectPath(x, yTop, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h));
  const yBot = yTop + h;
  return `M${x},${yTop} L${x + w},${yTop} L${x + w},${yBot - r} Q${x + w},${yBot} ${x + w - r},${yBot} L${x + r},${yBot} Q${x},${yBot} ${x},${yBot - r} Z`;
}
function roundRightRectPath(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, h / 2, w));
  return `M${x},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} L${x},${y + h} Z`;
}

function computeMonthlyTotals(arr) {
  const totals = new Array(12).fill(0);
  arr.forEach(item => item.valores.forEach((v, i) => totals[i] += v || 0));
  return totals;
}

function aggregateDespesasPorCategoria() {
  const totals = {};
  CARTOES_TIPOS.forEach(t => totals[t] = 0);
  MESES.forEach(mes => (state.cartoes[mes] || []).forEach(it => {
    const t = CARTOES_TIPOS.includes(it.tipo) ? it.tipo : 'Outros';
    totals[t] = (totals[t] || 0) + (it.valor || 0);
  }));
  return CARTOES_TIPOS.map(t => ({ label: t, value: totals[t] || 0 }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);
}

function renderChartCategorias() {
  const el = document.getElementById('chartCategorias');
  const data = aggregateDespesasPorCategoria();
  if (!data.length) { el.innerHTML = '<p class="card-hint">Sem lançamentos de cartão registrados ainda.</p>'; return; }

  const W = 760, rowH = 34, barH = 20, labelW = 130, valueW = 90;
  const plotW = W - labelW - valueW;
  const H = data.length * rowH + 8;
  const max = Math.max(...data.map(d => d.value));

  let marks = '';
  data.forEach((d, i) => {
    const y = i * rowH + (rowH - barH) / 2;
    const w = Math.max(2, (d.value / max) * plotW);
    marks += `
      <text x="${labelW - 10}" y="${y + barH / 2 + 4}" text-anchor="end">${esc(d.label)}</text>
      <path fill="${CHART_COLORS.categoria}" d="${roundRightRectPath(labelW, y, w, barH, 4)}"></path>
      <text class="chart-value" x="${labelW + w + 8}" y="${y + barH / 2 + 4}">${esc(fmt(d.value))}</text>
      <rect class="chart-mark" tabindex="0" role="img" aria-label="${esc(d.label)}: ${esc(fmt(d.value))}"
        x="0" y="${i * rowH}" width="${W}" height="${rowH}" fill="#000" fill-opacity="0" pointer-events="all"
        data-tt-title="${esc(d.label)}" data-tt-rows="${esc(fmt(d.value))}|${CHART_COLORS.categoria}"></rect>`;
  });

  el.innerHTML = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMinYMin meet">${marks}</svg>`;
}

function renderChartReceitaDespesa() {
  const el = document.getElementById('chartReceitaDespesa');
  const receitas = computeMonthlyTotals(state.receitas);
  const despesas = computeMonthlyTotals(state.despesas);
  const max = Math.max(1, ...receitas, ...despesas);
  const step = niceStep(max);
  const axisMax = Math.ceil(max / step) * step;

  const W = 760, H = 260, padL = 52, padB = 26, padT = 10, padR = 8;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const groupW = plotW / 12;
  const barW = Math.min(16, groupW / 2 - 4);
  const baseY = padT + plotH;

  let grid = '';
  const gridCount = Math.max(1, Math.round(axisMax / step));
  for (let g = 0; g <= gridCount; g++) {
    const val = g * step;
    const y = padT + plotH - (val / axisMax) * plotH;
    grid += `<line class="chart-axis-line" x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}"></line>
      <text x="${padL - 8}" y="${y + 3}" text-anchor="end">${fmtAxis(val)}</text>`;
  }

  let marks = '';
  for (let m = 0; m < 12; m++) {
    const gx = padL + m * groupW;
    const rH = (receitas[m] / axisMax) * plotH;
    const dH = (despesas[m] / axisMax) * plotH;
    const rx = gx + groupW / 2 - barW - 1;
    const dx = gx + groupW / 2 + 1;
    if (receitas[m] > 0) marks += `<path fill="${CHART_COLORS.receita}" d="${roundTopRectPath(rx, baseY - rH, barW, rH, 3)}"></path>`;
    if (despesas[m] > 0) marks += `<path fill="${CHART_COLORS.despesa}" d="${roundTopRectPath(dx, baseY - dH, barW, dH, 3)}"></path>`;
    marks += `<text x="${gx + groupW / 2}" y="${baseY + 16}" text-anchor="middle">${MESES_SHORT[m]}</text>
      <rect class="chart-mark" tabindex="0" role="img"
        aria-label="${MESES[m]}: Receita ${esc(fmt(receitas[m]))}, Despesa ${esc(fmt(despesas[m]))}"
        x="${gx}" y="${padT}" width="${groupW}" height="${plotH}" fill="#000" fill-opacity="0" pointer-events="all"
        data-tt-title="${MESES[m]}"
        data-tt-rows="${esc(fmt(receitas[m]))}|${CHART_COLORS.receita}|Receita;${esc(fmt(despesas[m]))}|${CHART_COLORS.despesa}|Despesa"></rect>`;
  }

  el.innerHTML = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMinYMin meet">${grid}${marks}</svg>
    <div class="chart-legend">
      <span class="chart-legend-item"><span class="chart-legend-swatch" style="background:${CHART_COLORS.receita}"></span>Receita</span>
      <span class="chart-legend-item"><span class="chart-legend-swatch" style="background:${CHART_COLORS.despesa}"></span>Despesa</span>
    </div>`;
}

function renderChartSaldo() {
  const el = document.getElementById('chartSaldo');
  const receitas = computeMonthlyTotals(state.receitas);
  const despesas = computeMonthlyTotals(state.despesas);
  const saldos = receitas.map((r, i) => r - despesas[i]);
  const maxAbs = Math.max(1, ...saldos.map(v => Math.abs(v)));
  const step = niceStep(maxAbs);
  const axisMax = Math.ceil(maxAbs / step) * step;

  const W = 760, H = 260, padL = 60, padB = 26, padT = 10, padR = 8;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const halfH = plotH / 2;
  const zeroY = padT + halfH;
  const groupW = plotW / 12;
  const barW = Math.min(22, groupW - 10);

  let grid = `<line class="chart-axis-line" x1="${padL}" y1="${zeroY}" x2="${W - padR}" y2="${zeroY}"></line>
    <text x="${padL - 8}" y="${zeroY + 3}" text-anchor="end">0</text>`;
  for (let g = 1; g <= 2; g++) {
    const val = (axisMax / 2) * g;
    const off = (val / axisMax) * halfH;
    grid += `<line class="chart-axis-line" x1="${padL}" y1="${zeroY - off}" x2="${W - padR}" y2="${zeroY - off}"></line>
      <text x="${padL - 8}" y="${zeroY - off + 3}" text-anchor="end">${fmtAxis(val)}</text>
      <line class="chart-axis-line" x1="${padL}" y1="${zeroY + off}" x2="${W - padR}" y2="${zeroY + off}"></line>
      <text x="${padL - 8}" y="${zeroY + off + 3}" text-anchor="end">-${fmtAxis(val)}</text>`;
  }

  let marks = '';
  for (let m = 0; m < 12; m++) {
    const gx = padL + m * groupW + (groupW - barW) / 2;
    const val = saldos[m];
    const h = (Math.abs(val) / axisMax) * halfH;
    const color = val >= 0 ? CHART_COLORS.positivo : CHART_COLORS.negativo;
    if (h > 0.3) {
      const path = val >= 0 ? roundTopRectPath(gx, zeroY - h, barW, h, 3) : roundBottomRectPath(gx, zeroY, barW, h, 3);
      marks += `<path fill="${color}" d="${path}"></path>`;
    }
    marks += `<text x="${gx + barW / 2}" y="${padT + plotH + 16}" text-anchor="middle">${MESES_SHORT[m]}</text>
      <rect class="chart-mark" tabindex="0" role="img" aria-label="${MESES[m]}: saldo ${esc(fmt(val))}"
        x="${padL + m * groupW}" y="${padT}" width="${groupW}" height="${plotH}" fill="#000" fill-opacity="0" pointer-events="all"
        data-tt-title="${MESES[m]}" data-tt-rows="${esc(fmt(val))}|${color}|Saldo"></rect>`;
  }

  el.innerHTML = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMinYMin meet">${grid}${marks}</svg>
    <div class="chart-legend">
      <span class="chart-legend-item"><span class="chart-legend-swatch" style="background:${CHART_COLORS.positivo}"></span>Saldo positivo</span>
      <span class="chart-legend-item"><span class="chart-legend-swatch" style="background:${CHART_COLORS.negativo}"></span>Saldo negativo</span>
    </div>`;
}

function renderGraficos() {
  renderChartCategorias();
  renderChartReceitaDespesa();
  renderChartSaldo();
}

// ---- Tooltip (hover + teclado; delegado nos containers, sobrevive ao re-render) ----
function showChartTooltip(mark, evt) {
  const tt = document.getElementById('chartTooltip');
  const rows = (mark.dataset.ttRows || '').split(';').filter(Boolean).map(r => {
    const [value, color, label] = r.split('|');
    return `<div class="tt-row">${color ? `<span class="tt-dot" style="background:${color}"></span>` : ''}${label ? esc(label) : ''}<span class="tt-value">${esc(value)}</span></div>`;
  }).join('');
  tt.innerHTML = `<div class="tt-title">${esc(mark.dataset.ttTitle || '')}</div>${rows}`;
  tt.hidden = false;
  const rect = mark.getBoundingClientRect();
  const x = evt.clientX || (rect.left + rect.width / 2);
  const y = evt.clientY || rect.top;
  tt.style.left = x + 'px';
  tt.style.top = y + 'px';
}
function hideChartTooltip() { document.getElementById('chartTooltip').hidden = true; }

['chartCategorias', 'chartReceitaDespesa', 'chartSaldo'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('pointermove', e => {
    const mark = e.target.closest('.chart-mark');
    if (mark) showChartTooltip(mark, e); else hideChartTooltip();
  });
  el.addEventListener('pointerleave', hideChartTooltip);
  el.addEventListener('focusin', e => {
    const mark = e.target.closest('.chart-mark');
    if (mark) showChartTooltip(mark, e);
  });
  el.addEventListener('focusout', hideChartTooltip);
});

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
  renderDespesas(); renderResumo(); renderParcelamentos(); renderGraficos();
}
renderAll();
