// ==================== ENCONTROS ====================
// Monta encontros com o orçamento de XP do SRD 5.2 (tabela "XP Budget per
// Character": Baixa, Moderada e Alta por nível do grupo) e guarda os prontos
// numa tabela que se filtra por dificuldade, tipo de criatura, local e nome.
// As criaturas vêm do Bestiário (SRD + importados): depende de bestiario.js.
const ENCONTROS_KEY = 'rpg_encontros';

// XP por personagem: [Baixa, Moderada, Alta], do nível 1 ao 20 (SRD 5.2.1, p. 202)
const ENC_ORCAMENTO = [
  [50, 75, 100], [100, 150, 200], [150, 225, 400], [250, 375, 500], [500, 750, 1100],
  [600, 1000, 1400], [750, 1300, 1700], [1000, 1700, 2100], [1300, 2000, 2600], [1600, 2300, 3100],
  [1900, 2900, 4100], [2200, 3700, 4700], [2600, 4200, 5400], [2900, 4900, 6200], [3300, 5400, 7800],
  [3800, 6100, 9800], [4500, 7200, 11700], [5000, 8700, 14200], [5500, 10700, 17200], [6400, 13200, 22000]
];
const ENC_DIFS = ['baixa', 'moderada', 'alta'];
const ENC_DIF_NOME = { baixa: 'Baixa', moderada: 'Moderada', alta: 'Alta', acima: 'Acima de Alta' };

const enc = carregarEncontros();

function carregarEncontros() {
  let salvo = {};
  try { salvo = JSON.parse(localStorage.getItem(ENCONTROS_KEY)) || {}; } catch (e) { /* começa vazio */ }
  return {
    n: salvo.n || 4,
    nivel: salvo.nivel || 1,
    dif: salvo.dif || 'moderada',
    atual: Array.isArray(salvo.atual) ? salvo.atual : [],    // [{ id, qtd }]
    tesouro: salvo.tesouro || null,                           // tesouro sugerido do encontro atual
    salvos: Array.isArray(salvo.salvos) ? salvo.salvos : []
  };
}
function salvarEncontros() {
  try { localStorage.setItem(ENCONTROS_KEY, JSON.stringify(enc)); } catch (e) { /* sem espaço: segue na memória */ }
}

// ---------- contas ----------
const xpDe = m => Number(m && m.xp) || 0;
const formatarXp = n => Number(n || 0).toLocaleString('pt-BR');

/** Limites do grupo: { baixa, moderada, alta } em XP total */
function limitesDoGrupo(n, nivel) {
  const linha = ENC_ORCAMENTO[Math.max(1, Math.min(20, nivel)) - 1];
  return { baixa: linha[0] * n, moderada: linha[1] * n, alta: linha[2] * n };
}
/** Dificuldade que um total de XP atinge para o grupo */
function dificuldadeDoTotal(total, lim) {
  if (total <= lim.baixa) return 'baixa';
  if (total <= lim.moderada) return 'moderada';
  if (total <= lim.alta) return 'alta';
  return 'acima';
}
function totalDoEncontro(lista) {
  return lista.reduce((soma, c) => soma + xpDe(acharMonstro(c.id)) * c.qtd, 0);
}
function orcamentoAtual() {
  return limitesDoGrupo(enc.n, enc.nivel)[enc.dif];
}

// ---------- montar ----------
function candidatosFiltrados() {
  const busca = document.getElementById('encBusca').value.trim().toLowerCase();
  const tipo = document.getElementById('encTipo').value;
  const local = document.getElementById('encLocal').value;
  const soOQueCabe = document.getElementById('encCabe').checked;
  const restante = orcamentoAtual() - totalDoEncontro(enc.atual);
  return todosOsMonstros().filter(m => {
    if (!xpDe(m)) return false;                       // ND 0 sem XP não pesa no orçamento
    if (tipo && m.tipo !== tipo) return false;
    if (!monstroNoLocal(m, local)) return false;
    if (soOQueCabe && xpDe(m) > restante) return false;
    if (busca && !`${m.n} ${m.ingles || ''}`.toLowerCase().includes(busca)) return false;
    return true;
  }).sort((a, b) => xpDe(b) - xpDe(a) || a.n.localeCompare(b.n));
}

function renderCandidatos() {
  const lista = candidatosFiltrados();
  const tb = document.getElementById('encCandidatos');
  if (!lista.length) {
    tb.innerHTML = '<tr><td colspan="6" class="fichas-ajuda">Nada com esses filtros (ou o orçamento acabou).</td></tr>';
    return;
  }
  tb.innerHTML = lista.map(m => `<tr>
      <td><span class="col-clickable" data-enc-ver="${esc(m.id)}">${esc(m.n)}</span></td>
      <td>${esc(tipoTexto(m))}</td>
      <td class="enc-local">${esc(habitatTexto(m.hab)) || '—'}</td>
      <td>${ndTexto(m.nd)}</td>
      <td>${formatarXp(xpDe(m))}</td>
      <td><button class="btn btn-heal" data-enc-add="${esc(m.id)}" title="Adicionar ao encontro">+</button></td>
    </tr>`).join('');
}

function renderEncontroAtual() {
  const box = document.getElementById('encAtual');
  const lim = limitesDoGrupo(enc.n, enc.nivel);
  const orc = lim[enc.dif];
  const total = totalDoEncontro(enc.atual);

  document.getElementById('encOrcamento').innerHTML =
    `Orçamento: <strong>${formatarXp(orc)} XP</strong> (${formatarXp(orc / enc.n)} × ${enc.n})`;

  box.innerHTML = enc.atual.length ? enc.atual.map((c, i) => {
    const m = acharMonstro(c.id);
    if (!m) return '';
    return `<div class="enc-item">
        <span class="col-clickable" data-enc-ver="${esc(m.id)}">${esc(m.n)}</span>
        <span class="ficha-sub bst-inline">ND ${ndTexto(m.nd)} · ${formatarXp(xpDe(m))} XP</span>
        <span class="enc-qtd">
          <button class="btn btn-secondary btn-sm" data-enc-menos="${i}" aria-label="Menos um">−</button>
          <strong>${c.qtd}</strong>
          <button class="btn btn-secondary btn-sm" data-enc-mais="${i}" aria-label="Mais um">+</button>
        </span>
        <span class="enc-xp">${formatarXp(xpDe(m) * c.qtd)} XP</span>
      </div>`;
  }).join('') : '<p class="fichas-ajuda">Adicione criaturas da lista ou use 🎲 Sortear.</p>';

  // Medidor: a barra vai até a Alta; passar dela pinta de vermelho
  const dif = dificuldadeDoTotal(total, lim);
  const pct = Math.min(100, (total / lim.alta) * 100);
  const marca = v => `<i style="left:${(v / lim.alta) * 100}%"></i>`;
  document.getElementById('encMedidor').innerHTML = `
    <div class="enc-barra enc-${total ? dif : 'vazio'}"><span style="width:${pct}%"></span>${marca(lim.baixa)}${marca(lim.moderada)}</div>
    <div class="enc-legenda">
      <strong>${formatarXp(total)} XP</strong> de ${formatarXp(orc)} ·
      ${total ? `dificuldade <strong class="enc-txt-${dif}">${ENC_DIF_NOME[dif]}</strong>` : 'vazio'}
      <span class="ficha-sub bst-inline">(Baixa ≤ ${formatarXp(lim.baixa)} · Moderada ≤ ${formatarXp(lim.moderada)} · Alta ≤ ${formatarXp(lim.alta)})</span>
    </div>`;
}

function renderMontagem() {
  renderEncontroAtual();
  renderCandidatos();
  renderTesouroAtual();
}

function renderTesouroAtual() {
  document.getElementById('encTesouro').innerHTML = enc.atual.length
    ? tesouroHtml(enc.tesouro)
    : '<p class="fichas-ajuda">Monte o encontro para ver o tesouro.</p>';
}

/** Dificuldade que o encontro atual atingiu para o grupo */
function difAtual() {
  return dificuldadeDoTotal(totalDoEncontro(enc.atual), limitesDoGrupo(enc.n, enc.nivel));
}

/** O encontro mudou de criaturas: o tesouro sugerido acompanha */
function encontroMudou() {
  enc.tesouro = enc.atual.length ? sortearTesouro(enc.atual, enc.nivel, difAtual()) : null;
  salvarEncontros(); renderMontagem();
}

function adicionarAoEncontro(id) {
  const c = enc.atual.find(x => x.id === id);
  if (c) c.qtd++; else enc.atual.push({ id, qtd: 1 });
  encontroMudou();
}

/**
 * Sorteia criaturas com os filtros da lista até chegar perto do orçamento.
 * No máximo três tipos diferentes e oito criaturas, como os exemplos do SRD:
 * um chefe com capangas ou um bando do mesmo bicho, e não dez avulsos.
 */
function sortearEncontro() {
  const orc = orcamentoAtual();
  const cabe = document.getElementById('encCabe');
  const antes = cabe.checked;
  cabe.checked = false;                          // o sorteio olha o orçamento inteiro
  const pool = candidatosFiltrados().filter(m => xpDe(m) <= orc);
  cabe.checked = antes;
  if (!pool.length) { alert('Nenhuma criatura cabe nesse orçamento com esses filtros.'); return; }

  const sorteia = lista => lista[Math.floor(Math.random() * lista.length)];
  // Começa por uma criatura que ocupe boa parte do orçamento, se houver
  const fortes = pool.filter(m => xpDe(m) >= orc * 0.25);
  const escolhidos = [];
  let resta = orc, total = 0;
  const pegar = m => {
    const c = escolhidos.find(x => x.id === m.id);
    if (c) c.qtd++; else escolhidos.push({ id: m.id, qtd: 1 });
    resta -= xpDe(m); total++;
  };
  pegar(sorteia(fortes.length ? fortes : pool));

  for (let tentativas = 0; tentativas < 40 && total < 8; tentativas++) {
    const tipos = escolhidos.map(c => c.id);
    const opcoes = (escolhidos.length >= 3 ? pool.filter(m => tipos.includes(m.id)) : pool)
      .filter(m => xpDe(m) <= resta && xpDe(m) >= orc / 16);
    if (!opcoes.length) break;
    // Repetir o que já está no encontro é mais provável: forma bandos
    const repetidos = opcoes.filter(m => tipos.includes(m.id));
    pegar(repetidos.length && Math.random() < 0.5 ? sorteia(repetidos) : sorteia(opcoes));
    if (resta < orc * 0.1) break;
  }
  enc.atual = escolhidos;
  encontroMudou();
}

function encontroParaIniciativa(lista) {
  if (!lista.length) { alert('O encontro está vazio.'); return; }
  const rolarPv = document.getElementById('bstPv') && document.getElementById('bstPv').value === 'rolado';
  const partes = lista.map(c => {
    const m = acharMonstro(c.id);
    if (!m) return null;
    const ini = monstroParaIniciativa(c.id, { qtd: c.qtd, rolarPv, grupo: true });
    return `${c.qtd}× ${m.n} (iniciativa ${ini})`;
  }).filter(Boolean);
  alert('Na iniciativa:\n' + partes.join('\n'));
}

// ---------- tabela de encontros ----------
function salvarNaTabela() {
  if (!enc.atual.length) { alert('Monte o encontro antes de salvar.'); return; }
  const nome = document.getElementById('encNome').value.trim() ||
    enc.atual.map(c => `${c.qtd}× ${(acharMonstro(c.id) || {}).n || c.id}`).join(', ');
  const lim = limitesDoGrupo(enc.n, enc.nivel);
  const xp = totalDoEncontro(enc.atual);
  enc.salvos.push({
    id: 'enc-' + Date.now().toString(36),
    nome,
    local: document.getElementById('encSalvarLocal').value || document.getElementById('encLocal').value || '',
    criaturas: enc.atual.map(c => ({ ...c })),
    xp,
    n: enc.n, nivel: enc.nivel,
    dif: dificuldadeDoTotal(xp, lim),
    tesouro: enc.tesouro
  });
  document.getElementById('encNome').value = '';
  salvarEncontros(); renderTabela();
}

function encontrosFiltrados() {
  const busca = document.getElementById('tabBusca').value.trim().toLowerCase();
  const dif = document.getElementById('tabDif').value;
  const tipo = document.getElementById('tabTipo').value;
  const local = document.getElementById('tabLocal').value;
  return enc.salvos.filter(e => {
    const monstros = e.criaturas.map(c => acharMonstro(c.id)).filter(Boolean);
    if (dif && e.dif !== dif) return false;
    if (local && e.local !== local) return false;
    if (tipo && !monstros.some(m => m.tipo === tipo)) return false;
    if (busca && !`${e.nome} ${monstros.map(m => m.n).join(' ')}`.toLowerCase().includes(busca)) return false;
    return true;
  });
}

let _encDestacado = null;

function renderTabela() {
  const lista = encontrosFiltrados();
  const tb = document.getElementById('tabEncontros');
  document.getElementById('tabTotal').textContent = `${lista.length} de ${enc.salvos.length}`;
  if (!lista.length) {
    tb.innerHTML = `<tr><td colspan="8" class="fichas-ajuda">${enc.salvos.length ? 'Nenhum encontro com esses filtros.' : 'Nenhum encontro salvo ainda: monte um acima e clique em 💾 Salvar na tabela.'}</td></tr>`;
    return;
  }
  tb.innerHTML = lista.map((e, i) => {
    const criaturas = e.criaturas.map(c => {
      const m = acharMonstro(c.id);
      return m ? `${c.qtd}× <span class="col-clickable" data-enc-ver="${esc(m.id)}">${esc(m.n)}</span>` : '';
    }).filter(Boolean).join(', ');
    return `<tr class="${_encDestacado === e.id ? 'current-turn' : ''}">
      <td>${i + 1}</td>
      <td>${esc(e.nome)}</td>
      <td>${esc(BST_HABITATS[e.local] || e.local || '—')}</td>
      <td><span class="enc-txt-${e.dif}">${ENC_DIF_NOME[e.dif] || e.dif}</span><span class="ficha-sub">${e.n} × nível ${e.nivel}</span></td>
      <td>${criaturas}</td>
      <td>${formatarXp(e.xp)}</td>
      <td class="tes-resumo">${tesouroResumo(e.tesouro)}</td>
      <td><div class="action-cell bst-acoes">
        <button class="btn btn-repair" data-tab-ini="${esc(e.id)}">⚔️ Iniciativa</button>
        <button class="btn btn-secondary btn-sm" data-tab-carregar="${esc(e.id)}" title="Levar para Montar Encontro">✏️ Editar</button>
        <button class="btn btn-danger" data-tab-del="${esc(e.id)}">Excluir</button>
      </div></td>
    </tr>`;
  }).join('');
}

function rolarNaTabela() {
  const lista = encontrosFiltrados();
  if (!lista.length) { alert('Nenhum encontro na tabela com esses filtros.'); return; }
  const i = Math.floor(Math.random() * lista.length);
  _encDestacado = lista[i].id;
  renderTabela();
  alert(`🎲 d${lista.length} = ${i + 1}: ${lista[i].nome}`);
}

// ---------- eventos ----------
function sincronizarGrupo() {
  document.getElementById('encN').value = enc.n;
  document.getElementById('encNivel').value = enc.nivel;
  document.getElementById('encDif').value = enc.dif;
}

(function iniciarEncontros() {
  const raiz = document.getElementById('content-encontros');
  if (!raiz) return;

  ['encTipo', 'tabTipo'].forEach(id => {
    document.getElementById(id).innerHTML = '<option value="">Todos os tipos</option>' + opcoesDeTipo();
  });
  ['encLocal', 'tabLocal'].forEach(id => {
    document.getElementById(id).innerHTML = '<option value="">Todos os locais</option>' + opcoesDeLocal();
  });
  document.getElementById('encSalvarLocal').innerHTML = '<option value="">Local…</option>' + opcoesDeLocal();
  sincronizarGrupo();

  const grupo = () => {
    enc.n = Math.max(1, Math.min(12, +document.getElementById('encN').value || 1));
    enc.nivel = Math.max(1, Math.min(20, +document.getElementById('encNivel').value || 1));
    enc.dif = document.getElementById('encDif').value;
    salvarEncontros(); renderMontagem();
  };
  ['encN', 'encNivel'].forEach(id => document.getElementById(id).addEventListener('input', grupo));
  document.getElementById('encDif').addEventListener('change', grupo);

  document.getElementById('encDasFichas').addEventListener('click', () => {
    const fichas = (state.fichas || []).filter(f => f.nivel);
    if (!fichas.length) { alert('Nenhuma ficha carregada na aba Fichas D&D.'); return; }
    enc.n = fichas.length;
    enc.nivel = Math.round(fichas.reduce((s, f) => s + (+f.nivel || 1), 0) / fichas.length);
    sincronizarGrupo(); salvarEncontros(); renderMontagem();
  });

  ['encBusca'].forEach(id => document.getElementById(id).addEventListener('input', renderCandidatos));
  ['encTipo', 'encLocal', 'encCabe'].forEach(id => document.getElementById(id).addEventListener('change', renderCandidatos));
  ['tabBusca'].forEach(id => document.getElementById(id).addEventListener('input', renderTabela));
  ['tabDif', 'tabTipo', 'tabLocal'].forEach(id => document.getElementById(id).addEventListener('change', renderTabela));

  document.getElementById('encSortear').addEventListener('click', sortearEncontro);
  document.getElementById('encIniciativa').addEventListener('click', () => encontroParaIniciativa(enc.atual));
  document.getElementById('encLimpar').addEventListener('click', () => { enc.atual = []; encontroMudou(); });
  document.getElementById('encTesouroRolar').addEventListener('click', () => {
    if (!enc.atual.length) return;
    enc.tesouro = sortearTesouro(enc.atual, enc.nivel, difAtual());
    salvarEncontros(); renderTesouroAtual();
  });
  document.getElementById('encTesouroNotas').addEventListener('click', () => {
    if (!enc.atual.length) return;
    const titulo = document.getElementById('encNome').value.trim() || 'Tesouro do encontro';
    state.notes = [state.notes, tesouroTexto(enc.tesouro, titulo)].filter(Boolean).join('\n\n');
    notesArea.value = state.notes; saveData();
    alert('Tesouro acrescentado na aba Notas.');
  });
  document.getElementById('encSalvar').addEventListener('click', salvarNaTabela);
  document.getElementById('tabRolar').addEventListener('click', rolarNaTabela);

  raiz.addEventListener('click', e => {
    const alvo = (attr) => { const el = e.target.closest(`[${attr}]`); return el ? el.getAttribute(attr) : null; };
    let v;
    if ((v = alvo('data-enc-ver')) !== null) return verMonstroNoBestiario(v);
    if ((v = alvo('data-enc-add')) !== null) return adicionarAoEncontro(v);
    if ((v = alvo('data-enc-mais')) !== null) { enc.atual[+v].qtd++; return encontroMudou(); }
    if ((v = alvo('data-enc-menos')) !== null) {
      if (--enc.atual[+v].qtd <= 0) enc.atual.splice(+v, 1);
      return encontroMudou();
    }
    if ((v = alvo('data-tab-ini')) !== null) {
      const s = enc.salvos.find(x => x.id === v);
      return s && encontroParaIniciativa(s.criaturas);
    }
    if ((v = alvo('data-tab-carregar')) !== null) {
      const s = enc.salvos.find(x => x.id === v);
      if (!s) return;
      enc.atual = s.criaturas.map(c => ({ ...c }));
      enc.n = s.n; enc.nivel = s.nivel;
      enc.tesouro = s.tesouro || sortearTesouro(enc.atual, s.nivel, s.dif);
      document.getElementById('encNome').value = s.nome;
      document.getElementById('encSalvarLocal').value = s.local || '';
      sincronizarGrupo(); salvarEncontros(); renderMontagem();
      return raiz.scrollIntoView({ behavior: 'smooth' });
    }
    if ((v = alvo('data-tab-del')) !== null) {
      const s = enc.salvos.find(x => x.id === v);
      if (!s || !confirm(`Excluir o encontro "${s.nome}"?`)) return;
      enc.salvos = enc.salvos.filter(x => x.id !== v);
      salvarEncontros(); renderTabela();
    }
  });

  renderMontagem();
  renderTabela();
})();
