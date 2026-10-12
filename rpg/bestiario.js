// ==================== BESTIÁRIO (MONSTROS E NPCs) ====================
// Os monstros do SRD 5.2 vêm de srd-monstros.js (gerado por
// tools/gerar-monstros-srd.py). Os que o mestre importa colando o bloco de
// estatísticas ficam no localStorage, como as fichas: valem entre sessões.
// Cada monstro tem o link da página dele no AideDD, que mostra o bloco
// completo de 2024 sem login; o app não lê o AideDD (o site não permite).
const BESTIARIO_KEY = 'rpg_bestiario';

const BST_TAMANHOS = {
  Tiny: 'Miúdo', Small: 'Pequeno', Medium: 'Médio', Large: 'Grande', Huge: 'Enorme',
  Gargantuan: 'Imenso', 'Medium or small': 'Médio ou Pequeno'
};
const BST_TIPOS = {
  aberration: 'Aberração', beast: 'Fera', celestial: 'Celestial', construct: 'Constructo',
  dragon: 'Dragão', elemental: 'Elemental', fey: 'Feérico', fiend: 'Ínfero', giant: 'Gigante',
  humanoid: 'Humanoide', monstrosity: 'Monstruosidade', ooze: 'Limo', plant: 'Planta',
  undead: 'Morto-vivo', 'swarm of tiny beasts': 'Enxame de Feras Miúdas',
  'swarm of tiny undead': 'Enxame de Mortos-vivos Miúdos'
};
const BST_ALINHAMENTOS = {
  'lawful good': 'Leal e Bom', 'neutral good': 'Neutro e Bom', 'chaotic good': 'Caótico e Bom',
  'lawful neutral': 'Leal e Neutro', neutral: 'Neutro', 'chaotic neutral': 'Caótico e Neutro',
  'lawful evil': 'Leal e Mau', 'neutral evil': 'Neutro e Mau', 'chaotic evil': 'Caótico e Mau',
  unaligned: 'Sem Alinhamento'
};
const BST_ATRIBUTOS = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'];
// Habitat do Manual dos Monstros 2024 (os importados aceitam o nome em português)
const BST_HABITATS = {
  Any: 'Qualquer', Arctic: 'Ártico', Coastal: 'Costa', Desert: 'Deserto', Forest: 'Floresta',
  Grassland: 'Planície', Hill: 'Colinas', Mountain: 'Montanha', Planar: 'Outros Planos',
  Swamp: 'Pântano', Underdark: 'Subterrâneo', Underwater: 'Subaquático', Urban: 'Urbano'
};

/** Habitat digitado ("floresta", "Forest") → chave do mapa; o que não bate fica como veio */
function chaveDeHabitat(h) {
  const t = String(h || '').trim();
  if (BST_HABITATS[t]) return t;
  const achada = Object.entries(BST_HABITATS).find(([en, pt]) =>
    en.toLowerCase() === t.toLowerCase() || pt.toLowerCase() === t.toLowerCase());
  return achada ? achada[0] : t;
}
const habitatTexto = hab => (hab || []).map(h => BST_HABITATS[h] || h).join(', ');

const bst = {
  meus: carregarBestiario(),
  aberto: null      // id do monstro no painel de detalhes
};

function carregarBestiario() {
  try { return JSON.parse(localStorage.getItem(BESTIARIO_KEY)) || []; }
  catch (e) { return []; }
}
function salvarBestiario() {
  try { localStorage.setItem(BESTIARIO_KEY, JSON.stringify(bst.meus)); }
  catch (e) { alert('Sem espaço no navegador para salvar o bestiário.'); }
}

/** SRD + importados, cada um marcado com a origem */
function todosOsMonstros() {
  return [
    ...(window.SRD_MONSTROS || []).map(m => ({ ...m, origem: 'srd' })),
    ...bst.meus.map(m => ({ ...m, origem: 'meus' }))
  ];
}
function acharMonstro(id) {
  return todosOsMonstros().find(m => m.id === id) || null;
}

// ---------- formatação ----------
const modDe = v => Math.floor((v - 10) / 2);
const comSinalBst = n => (n >= 0 ? '+' : '') + n;

/** 0.25 → "1/4" */
function ndTexto(nd) {
  if (nd === undefined || nd === null || nd === '') return '—';
  return { 0.125: '1/8', 0.25: '1/4', 0.5: '1/2' }[nd] || String(nd);
}
/** "1/4" → 0.25 */
function ndNumero(txt) {
  const t = String(txt ?? '').trim().replace(',', '.');
  if (!t) return null;
  const f = t.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (f) return +f[1] / +f[2];
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}
function tipoTexto(m) {
  if (m.origem === 'meus') return m.tipoTexto || '';
  const tam = BST_TAMANHOS[m.tam] || m.tam;
  const tipo = BST_TIPOS[m.tipo] || m.tipo;
  return `${tipo} ${tam}`;
}
/** Bônus de iniciativa: o do bloco (importado) ou o modificador de Destreza */
function iniciativaDe(m) {
  if (Number.isFinite(m.ini)) return m.ini;
  return m.at ? modDe(m.at[1]) : 0;
}
/** "Adult Red Dragon" → "adult-red-dragon", o endereço do AideDD */
function slugAidedd(nome) {
  return String(nome || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function linkAidedd(m) {
  const slug = m.origem === 'srd' ? (m.slug || m.id) : slugAidedd(m.ingles || m.n);
  return slug ? `https://www.aidedd.org/monster/${slug}` : '';
}

// ---------- ordenação das tabelas ----------
/*
 * Clicar no cabeçalho ordena a coluna; clicar de novo inverte. Número começa
 * do maior para o menor (ND, XP, PV) e texto de A a Z. Vale para o Bestiário
 * ("bst"), a lista de criaturas dos Encontros ("enc") e a Tabela de Encontros
 * ("tab"); cada tabela diz como ler cada coluna em ORDEM_CHAVES.
 */
const ORDEM = { bst: { col: 'n', dir: 1 }, enc: { col: 'xp', dir: -1 }, tab: { col: 'pos', dir: 1 } };
const ORDEM_TEXTO = new Set(['n', 'tipo', 'local', 'nome']);
const ORDEM_CHAVES = {
  bst: { n: m => m.n, tipo: m => tipoTexto(m), nd: m => ndNumero(m.nd), ca: m => m.ca, pv: m => m.pv },
  enc: { n: m => m.n, tipo: m => tipoTexto(m), local: m => habitatTexto(m.hab), nd: m => ndNumero(m.nd), xp: m => Number(m.xp) || 0 }
};

/** Ordena uma lista pela coluna escolhida da tabela `tabela` (vazios sempre no fim) */
function ordenarPor(tabela, lista, chaves) {
  const { col, dir } = ORDEM[tabela];
  const ler = (chaves || ORDEM_CHAVES[tabela])[col];
  if (!ler) return lista;
  return lista.slice().sort((a, b) => {
    const va = ler(a), vb = ler(b);
    const vaz = v => v === null || v === undefined || v === '';
    if (vaz(va) || vaz(vb)) return vaz(va) - vaz(vb);
    const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'pt-BR');
    return r * dir || String(a.n || a.nome || '').localeCompare(String(b.n || b.nome || ''), 'pt-BR');
  });
}

/** Seta ▲▼ e aria-sort nos cabeçalhos da tabela */
function marcarCabecalhos(tabela) {
  document.querySelectorAll(`[data-ordem^="${tabela}:"]`).forEach(th => {
    const col = th.dataset.ordem.split(':')[1];
    const ativa = ORDEM[tabela].col === col;
    th.setAttribute('aria-sort', ativa ? (ORDEM[tabela].dir > 0 ? 'ascending' : 'descending') : 'none');
    th.querySelector('.th-seta').textContent = ativa ? (ORDEM[tabela].dir > 0 ? ' ▲' : ' ▼') : '';
  });
}

const RENDER_DA_TABELA = {};      // tabela → função que redesenha (os Encontros registram as deles)

document.addEventListener('click', e => {
  const th = e.target.closest('[data-ordem]');
  if (!th) return;
  const [tabela, col] = th.dataset.ordem.split(':');
  const o = ORDEM[tabela];
  if (o.col === col) o.dir = -o.dir;
  else { o.col = col; o.dir = ORDEM_TEXTO.has(col) || col === 'pos' ? 1 : -1; }
  marcarCabecalhos(tabela);
  if (RENDER_DA_TABELA[tabela]) RENDER_DA_TABELA[tabela]();
});

// ---------- lista e filtros ----------
/** Opções de tipo e de local, usadas no Bestiário e nos Encontros */
function opcoesDeTipo() {
  return [...new Set((window.SRD_MONSTROS || []).map(m => m.tipo))]
    .sort((a, b) => (BST_TIPOS[a] || a).localeCompare(BST_TIPOS[b] || b))
    .map(t => `<option value="${esc(t)}">${esc(BST_TIPOS[t] || t)}</option>`).join('');
}
function opcoesDeLocal() {
  return Object.keys(BST_HABITATS).filter(h => h !== 'Any')
    .sort((a, b) => BST_HABITATS[a].localeCompare(BST_HABITATS[b]))
    .map(h => `<option value="${h}">${BST_HABITATS[h]}</option>`).join('');
}
/** O monstro vive nesse local? "Qualquer" vale para todos */
function monstroNoLocal(m, local) {
  if (!local) return true;
  const hab = m.hab || [];
  return hab.includes(local) || hab.includes('Any');
}

function preencherFiltroDeTipos() {
  document.getElementById('bstLocal').innerHTML = '<option value="">Todos os locais</option>' + opcoesDeLocal();
  document.getElementById('bstTipo').innerHTML = '<option value="">Todos os tipos</option>' + opcoesDeTipo();
}

function monstrosFiltrados() {
  const busca = document.getElementById('bstBusca').value.trim().toLowerCase();
  const tipo = document.getElementById('bstTipo').value;
  const fonte = document.getElementById('bstFonte').value;
  const local = document.getElementById('bstLocal').value;
  const min = ndNumero(document.getElementById('bstNdMin').value);
  const max = ndNumero(document.getElementById('bstNdMax').value);
  return todosOsMonstros().filter(m => {
    if (fonte && m.origem !== fonte) return false;
    if (tipo && m.tipo !== tipo) return false;
    if (!monstroNoLocal(m, local)) return false;
    const nd = ndNumero(m.nd);
    if (min !== null && (nd === null || nd < min)) return false;
    if (max !== null && (nd === null || nd > max)) return false;
    if (busca) {
      const alvo = `${m.n} ${m.ingles || ''} ${tipoTexto(m)}`.toLowerCase();
      if (!alvo.includes(busca)) return false;
    }
    return true;
  });
}

function renderBestiario() {
  const lista = ordenarPor('bst', monstrosFiltrados());
  marcarCabecalhos('bst');
  const tb = document.getElementById('bstTableBody');
  document.getElementById('bstTotal').textContent = `${lista.length} de ${todosOsMonstros().length}`;
  if (!lista.length) {
    tb.innerHTML = '<tr><td colspan="6" class="fichas-ajuda">Nenhum monstro com esses filtros.</td></tr>';
    return;
  }
  tb.innerHTML = lista.map(m => {
    const link = linkAidedd(m);
    return `<tr class="${bst.aberto === m.id ? 'bst-aberto' : ''}">
      <td><span class="col-clickable" data-bst-ver="${esc(m.id)}">${esc(m.n)}</span>${m.origem === 'meus' ? ' <span class="bst-selo">importado</span>' : ''}</td>
      <td>${esc(tipoTexto(m))}</td>
      <td>${ndTexto(m.nd)}</td>
      <td>${m.ca ?? '—'}</td>
      <td>${m.pv ?? '—'}${m.dv ? ` <span class="ficha-sub bst-inline">(${esc(m.dv)})</span>` : ''}</td>
      <td><div class="action-cell bst-acoes">
        <button class="btn btn-repair" data-bst-ini="${esc(m.id)}" title="Pôr no Combate (primeira aba)">⚔️ Iniciativa</button>
        ${link ? `<a class="btn btn-secondary btn-sm" href="${link}" target="_blank" rel="noopener" title="Página completa no AideDD">🔗 AideDD</a>` : ''}
      </div></td>
    </tr>`;
  }).join('');
}

// ---------- bloco de estatísticas ----------
function secaoDoBloco(titulo, itens) {
  if (!itens || !itens.length) return '';
  return `<h4 class="sb-secao">${titulo}</h4>` +
    itens.map(([nome, desc]) => `<p><strong><em>${esc(nome)}.</em></strong> ${esc(desc)}</p>`).join('');
}

function renderDetalhe() {
  const box = document.getElementById('bstDetalhe');
  const m = bst.aberto ? acharMonstro(bst.aberto) : null;
  if (!m) { box.hidden = true; box.innerHTML = ''; return; }

  const linha = (rot, val) => val ? `<p class="sb-linha"><strong>${rot}</strong> ${esc(val)}</p>` : '';
  const ini = iniciativaDe(m);
  const link = linkAidedd(m);
  const atributos = m.at ? `<div class="sb-atributos">${m.at.map((v, i) =>
    `<div><span>${BST_ATRIBUTOS[i]}</span><strong>${v}</strong><em>${comSinalBst(modDe(v))}</em></div>`).join('')}</div>` : '';

  const cabecalho = m.origem === 'srd'
    ? `${esc(BST_TIPOS[m.tipo] || m.tipo)} ${esc(BST_TAMANHOS[m.tam] || m.tam)}, ${esc(BST_ALINHAMENTOS[m.al] || m.al)}`
    : esc(m.tipoTexto || '');

  const corpo = m.origem === 'srd' ? `
      ${atributos}
      ${linha('Salvaguardas', m.salv)}
      ${linha('Perícias', m.per)}
      ${linha('Vulnerabilidades', m.vul)}
      ${linha('Resistências', m.res)}
      ${linha('Imunidades', [m.imu, m.imuc].filter(Boolean).join('; '))}
      ${linha('Equipamento', m.equip)}
      ${linha('Sentidos', m.sent)}
      ${linha('Habitat', habitatTexto(m.hab))}
      ${linha('Tesouro', (m.tes || []).map(t => TES_TEMAS[t] || t).join(', '))}
      ${linha('Idiomas', m.idi || '—')}
      ${linha('ND', `${ndTexto(m.nd)} (XP ${Number(m.xp || 0).toLocaleString('pt-BR')}${m.xpc ? `, ou ${Number(m.xpc).toLocaleString('pt-BR')} no covil` : ''}; BP ${comSinalBst(m.bp || 2)})`)}
      ${secaoDoBloco('Traços', m.tr)}
      ${secaoDoBloco('Ações', m.ac)}
      ${secaoDoBloco('Ações Bônus', m.ab)}
      ${secaoDoBloco('Reações', m.re)}
      ${secaoDoBloco('Ações Lendárias', m.le)}`
    : `${atributos}
      ${linha('Habitat', habitatTexto(m.hab))}
      ${linha('Tesouro', (m.tes || []).map(t => TES_TEMAS[t] || t).join(', '))}
      ${linha('ND', m.nd !== null && m.nd !== undefined && m.nd !== '' ? `${ndTexto(m.nd)}${m.xp ? ` (XP ${Number(m.xp).toLocaleString('pt-BR')})` : ''}` : '')}
      ${m.texto ? `<div class="sb-texto">${esc(m.texto)}</div>` : ''}`;

  box.hidden = false;
  box.innerHTML = `
    <div class="sb-topo">
      <div>
        <h2 class="card-title sb-nome">${esc(m.n)}${m.ingles && m.ingles !== m.n ? ` <span class="ficha-sub bst-inline">(${esc(m.ingles)})</span>` : ''}</h2>
        <p class="sb-sub">${cabecalho}${m.categoria === 'NPC' ? ' · NPC' : ''}</p>
      </div>
      <div class="action-cell bst-acoes">
        <button class="btn btn-repair" data-bst-ini="${esc(m.id)}">⚔️ Iniciativa</button>
        ${link ? `<a class="btn btn-secondary btn-sm" href="${link}" target="_blank" rel="noopener">🔗 AideDD</a>` : ''}
        ${m.origem === 'meus' ? `<button class="btn btn-danger" data-bst-del="${esc(m.id)}">Excluir</button>` : ''}
        <button class="btn btn-secondary btn-sm" data-bst-fechar>✕</button>
      </div>
    </div>
    <div class="sb-destaques">
      <span><strong>CA</strong> ${m.ca ?? '—'}</span>
      <span><strong>Iniciativa</strong> ${comSinalBst(ini)} (${10 + ini})</span>
      <span><strong>PV</strong> ${m.pv ?? '—'}${m.dv ? ` (${esc(m.dv)})` : ''}</span>
      <span><strong>Deslocamento</strong> ${esc(m.desl || '—')}</span>
    </div>
    ${corpo}`;
}

function abrirMonstro(id) {
  bst.aberto = id;
  renderDetalhe();
  renderBestiario();
  document.getElementById('bstDetalhe').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Chamado da aba Combate (📖): troca de aba e abre o bloco */
function verMonstroNoBestiario(id) {
  document.getElementById('tab-bestiario').click();
  abrirMonstro(id);
}

// ---------- iniciativa ----------
const d = lados => 1 + Math.floor(Math.random() * lados);

/** "3d6", "20d10 + 40" → total rolado; null se não houver dado */
function rolarDadosDeVida(txt) {
  const m = String(txt || '').replace(/[−–]/g, '-').match(/(\d+)\s*d\s*(\d+)\s*(?:([+-])\s*(\d+))?/i);
  if (!m) return null;
  let total = 0;
  for (let i = 0; i < +m[1]; i++) total += d(+m[2]);
  if (m[3]) total += (m[3] === '-' ? -1 : 1) * +m[4];
  return Math.max(1, total);
}

/** Nomes das cópias, numerados a partir do último do mesmo nome no Combate (Goblin 3, 4...) */
function nomesDasCopias(m, qtd) {
  const re = new RegExp('^' + m.n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?: (\\d+))?$');
  let ultimo = 0;
  state.entities.forEach(e => { const r = e.name.match(re); if (r) ultimo = Math.max(ultimo, +(r[1] || 1)); });
  const numerar = qtd > 1 || ultimo > 0;
  return Array.from({ length: qtd }, (_, i) => numerar ? `${m.n} ${ultimo + i + 1}` : m.n);
}

/**
 * Põe `qtd` cópias do monstro na aba Combate. Usado pela caixa de iniciativa
 * do Bestiário (que manda os valores digitados em `iniciativas`) e pelos
 * Encontros (que deixam o app rolar). Devolve a iniciativa do grupo, ou null.
 */
function monstroParaIniciativa(id, op) {
  const m = acharMonstro(id);
  if (!m) return null;
  const qtd = Math.max(1, Math.min(30, op.qtd || 1));
  const bonus = iniciativaDe(m);
  const valores = op.iniciativas || [];
  const rolar = () => d(20) + bonus;
  const iniGrupo = Number.isFinite(valores[0]) ? valores[0] : rolar();

  const acoes = [...(m.ac || []), ...(m.ab || [])].map(a => a[0].replace(/\s*\(.*\)$/, ''))
    .filter(n => n !== 'Multiattack').slice(0, 6);

  nomesDasCopias(m, qtd).forEach((nome, i) => {
    const pv = (op.rolarPv && rolarDadosDeVida(m.dv)) || m.pv || 1;
    state.entities.push({
      id: Date.now() + Math.random(),
      name: nome,
      type: m.categoria === 'NPC' ? 'NPC' : 'Monster',
      maxHp: pv, hp: pv,
      initiative: op.grupo ? iniGrupo : (Number.isFinite(valores[i]) ? valores[i] : rolar()),
      armor: m.ca || 0,
      conditions: [],
      abilities: acoes,
      ref: m.id,
      turn_info: ''
    });
  });
  state.entities.sort((a, b) => b.initiative - a.initiative);
  renderEntities(); saveData();
  return op.grupo ? iniGrupo : null;
}

// ---------- caixa de iniciativa ----------
/*
 * O ⚔️ do Bestiário abre esta caixa em vez de mandar direto: o mestre digita
 * a iniciativa que rolou na mesa (ou fica com a sugerida, d20 + bônus), escolhe
 * quantas cópias e como os PV saem, e só então a criatura vai para o Combate.
 */
const iniCaixa = { id: null, valores: [] };

/** Aviso que some sozinho; tipo 'dif' (âmbar) marca mudança de dificuldade */
function avisoRapido(msg, tipo) {
  const el = document.getElementById('avisoRapido');
  if (!el) return;
  el.textContent = msg;
  el.className = 'aviso-rapido' + (tipo ? ' aviso-' + tipo : '');
  el.hidden = false;
  clearTimeout(avisoRapido._t);
  avisoRapido._t = setTimeout(() => { el.hidden = true; }, 3500);
}

function abrirCaixaIniciativa(id) {
  const m = acharMonstro(id);
  if (!m) return;
  const bonus = iniciativaDe(m);
  iniCaixa.id = id;
  iniCaixa.valores = [d(20) + bonus];
  document.getElementById('bstQtd').value = 1;
  document.getElementById('iniModalTitulo').textContent = `⚔️ ${m.n}`;
  document.getElementById('iniModalInfo').innerHTML =
    `Bônus de Iniciativa <strong>${comSinalBst(bonus)}</strong> · CA ${m.ca ?? '—'} · PV ${m.pv ?? '—'}${m.dv ? ` (${esc(m.dv)})` : ''}`;
  renderValoresIniciativa();
  document.getElementById('iniModal').hidden = false;
  const primeiro = document.querySelector('#iniModalValores input');
  if (primeiro) { primeiro.focus(); primeiro.select(); }
}

function fecharCaixaIniciativa() {
  document.getElementById('iniModal').hidden = true;
  iniCaixa.id = null;
}

/** Um campo por cópia (iniciativa individual) ou um só para o grupo */
function renderValoresIniciativa() {
  const m = acharMonstro(iniCaixa.id);
  if (!m) return;
  const qtd = Math.max(1, Math.min(30, +document.getElementById('bstQtd').value || 1));
  const grupo = document.getElementById('bstIniGrupo').checked;
  const campos = grupo ? 1 : qtd;
  const bonus = iniciativaDe(m);
  while (iniCaixa.valores.length < campos) iniCaixa.valores.push(d(20) + bonus);
  const nomes = nomesDasCopias(m, qtd);
  document.getElementById('iniModalValores').innerHTML = Array.from({ length: campos }, (_, i) => `
    <label class="ini-linha">
      <span>${grupo ? (qtd > 1 ? `Iniciativa do grupo (${qtd})` : 'Iniciativa') : esc(nomes[i])}</span>
      <input type="number" min="-10" max="99" data-ini="${i}" value="${iniCaixa.valores[i]}" required>
      <button type="button" class="btn btn-secondary btn-sm" data-ini-rolar="${i}" title="Rolar d20 ${comSinalBst(bonus)}">🎲</button>
    </label>`).join('');
}

function confirmarCaixaIniciativa(e) {
  e.preventDefault();
  const m = acharMonstro(iniCaixa.id);
  if (!m) return fecharCaixaIniciativa();
  const qtd = Math.max(1, Math.min(30, +document.getElementById('bstQtd').value || 1));
  const grupo = document.getElementById('bstIniGrupo').checked;
  const iniciativas = [...document.querySelectorAll('#iniModalValores [data-ini]')].map(i => parseInt(i.value, 10));
  monstroParaIniciativa(m.id, {
    qtd, grupo, iniciativas,
    rolarPv: document.getElementById('bstPv').value === 'rolado'
  });
  fecharCaixaIniciativa();
  avisoRapido(`${qtd > 1 ? qtd + '× ' : ''}${m.n} no Combate (iniciativa ${grupo ? iniciativas[0] : iniciativas.join(', ')}).`);
}

// ---------- importar colando o bloco ----------
/*
 * Lê um bloco de estatísticas colado como texto. Aceita o formato de 2024 em
 * inglês (AideDD, D&D Beyond) e em português (livro): só os números que a
 * mesa usa a toda hora. O texto inteiro vai junto para consulta.
 */
function lerBlocoDeEstatisticas(texto) {
  const t = String(texto || '').replace(/[−–]/g, '-').replace(/\r/g, '');
  const plano = t.replace(/\s+/g, ' ');
  const num = re => { const m = plano.match(re); return m ? m : null; };

  const tamanhos = 'Tiny|Small|Medium|Large|Huge|Gargantuan|Miúdo|Miúda|Pequeno|Pequena|Médio|Média|Grande|Enorme|Imenso|Imensa';
  const linhas = t.split('\n').map(l => l.trim()).filter(Boolean);
  let nome = linhas[0] || '';
  const corte = nome.search(new RegExp(`\\s(?:${tamanhos})\\b`));
  if (corte > 0) nome = nome.slice(0, corte);
  // Tamanho e tipo: a linha que cita o tamanho ("Small Fey (Goblinoid), ..." ou
  // "Feérico Pequeno (Goblinoide), ..."); no texto corrido, o trecho a partir dele.
  const reTam = new RegExp(`\\b(?:${tamanhos})\\b`);
  const linhaTipo = linhas.slice(1, 4).find(l => reTam.test(l));
  const mTipo = linhaTipo ? [null, linhaTipo.split(',')[0]]
    : plano.match(new RegExp(`\\b((?:${tamanhos})\\b[^,]{0,60}?)(?:,|\\s(?:AC|CA|Armor Class|Classe de Armadura)\\b)`));

  const ca = num(/\b(?:AC|CA|Armor Class|Classe de Armadura)\s*(\d+)/);
  const pv = num(/\b(?:HP|PV|Hit Points|Pontos de Vida)\s*(\d+)\s*(?:\(([^)]+)\))?/);
  const ini = num(/\b(?:Initiative|Iniciativa)\s*([+-]?\s*\d+)/);
  const nd = num(/\b(?:CR|Challenge|ND|Nível de Desafio)\s*(\d+\s*\/\s*\d+|\d+)/);
  const xp = num(/\bXP\s*([\d.,]+)/) || num(/([\d.,]+)\s*XP\b/);
  const desl = num(/\b(?:Speed|Deslocamento)\s*(.+?)(?=\s+(?:STR|Str|FOR|For|MOD|Mod)\b|$)/);

  const at = [];
  const rotulos = [['STR', 'FOR'], ['DEX', 'DES'], ['CON'], ['INT'], ['WIS', 'SAB'], ['CHA', 'CAR']];
  rotulos.forEach(alts => {
    const m = plano.match(new RegExp(`\\b(?:${alts.join('|')})\\b\\s*(\\d{1,2})\\b`, 'i'));
    at.push(m ? +m[1] : null);
  });

  return {
    n: nome.trim(),
    tipoTexto: mTipo ? mTipo[1].trim() : '',
    ca: ca ? +ca[1] : null,
    pv: pv ? +pv[1] : null,
    dv: pv && pv[2] ? pv[2].trim() : '',
    ini: ini ? parseInt(ini[1].replace(/\s/g, ''), 10) : null,
    nd: nd ? nd[1].replace(/\s/g, '') : '',
    xp: xp ? parseInt(xp[1].replace(/[.,]/g, ''), 10) : null,
    desl: desl ? desl[1].trim().slice(0, 80) : '',
    at: at.every(v => v !== null) ? at : null,
    texto: t.trim()
  };
}

let _bstLido = null;

function preencherFormularioDeImportacao(m) {
  _bstLido = m;
  const set = (id, v) => { document.getElementById(id).value = v ?? ''; };
  set('bstFNome', m.n);
  set('bstFIngles', /^[\x00-\x7F]+$/.test(m.n) ? m.n : '');
  set('bstFTipo', m.tipoTexto);
  set('bstFCa', m.ca);
  set('bstFPv', m.pv);
  set('bstFDv', m.dv);
  set('bstFIni', m.ini ?? (m.at ? modDe(m.at[1]) : ''));
  set('bstFNd', m.nd);
  set('bstFDesl', m.desl);
  set('bstFHab', '');
  document.getElementById('bstFCategoria').value = /humanoid|humanoide/i.test(m.tipoTexto) ? 'NPC' : 'Monster';
  document.getElementById('bstForm').hidden = false;
}

function salvarMonstroImportado(e) {
  e.preventDefault();
  const v = id => document.getElementById(id).value.trim();
  const nome = v('bstFNome');
  if (!nome) return;
  const ndTxt = v('bstFNd');
  const m = {
    id: 'meu-' + Date.now().toString(36),
    n: nome,
    ingles: v('bstFIngles'),
    categoria: v('bstFCategoria'),
    tipoTexto: v('bstFTipo'),
    ca: v('bstFCa') === '' ? null : +v('bstFCa'),
    pv: v('bstFPv') === '' ? null : +v('bstFPv'),
    dv: v('bstFDv'),
    ini: v('bstFIni') === '' ? null : +v('bstFIni'),
    nd: ndNumero(ndTxt) ?? '',
    xp: _bstLido && _bstLido.xp,
    desl: v('bstFDesl'),
    hab: v('bstFHab').split(',').map(chaveDeHabitat).filter(Boolean),
    tes: [v('bstFTes')],
    at: _bstLido && _bstLido.at,
    texto: _bstLido ? _bstLido.texto : ''
  };
  bst.meus.push(m);
  salvarBestiario();
  document.getElementById('bstForm').hidden = true;
  document.getElementById('bstColar').value = '';
  _bstLido = null;
  document.getElementById('bstFonte').value = '';
  abrirMonstro(m.id);
}

function excluirMonstro(id) {
  const m = bst.meus.find(x => x.id === id);
  if (!m || !confirm(`Excluir "${m.n}" do bestiário?`)) return;
  bst.meus = bst.meus.filter(x => x.id !== id);
  salvarBestiario();
  bst.aberto = null;
  renderDetalhe(); renderBestiario();
}

// ---------- eventos ----------
(function iniciarBestiario() {
  if (!document.getElementById('content-bestiario')) return;
  preencherFiltroDeTipos();
  RENDER_DA_TABELA.bst = renderBestiario;

  ['bstBusca', 'bstNdMin', 'bstNdMax'].forEach(id =>
    document.getElementById(id).addEventListener('input', renderBestiario));
  ['bstTipo', 'bstFonte', 'bstLocal'].forEach(id =>
    document.getElementById(id).addEventListener('change', renderBestiario));

  document.getElementById('content-bestiario').addEventListener('click', e => {
    const ver = e.target.closest('[data-bst-ver]');
    if (ver) return abrirMonstro(ver.dataset.bstVer);
    const ini = e.target.closest('[data-bst-ini]');
    if (ini) return abrirCaixaIniciativa(ini.dataset.bstIni);
    const del = e.target.closest('[data-bst-del]');
    if (del) return excluirMonstro(del.dataset.bstDel);
    if (e.target.closest('[data-bst-fechar]')) { bst.aberto = null; renderDetalhe(); renderBestiario(); }
  });

  // Caixa de iniciativa
  const caixa = document.getElementById('iniModal');
  document.getElementById('iniForm').addEventListener('submit', confirmarCaixaIniciativa);
  document.getElementById('iniCancelar').addEventListener('click', fecharCaixaIniciativa);
  caixa.addEventListener('click', e => { if (e.target === caixa) fecharCaixaIniciativa(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !caixa.hidden) fecharCaixaIniciativa(); });
  ['bstQtd', 'bstIniGrupo'].forEach(id => document.getElementById(id).addEventListener('input', renderValoresIniciativa));
  document.getElementById('bstIniGrupo').addEventListener('change', renderValoresIniciativa);
  document.getElementById('iniModalValores').addEventListener('input', e => {
    const campo = e.target.closest('[data-ini]');
    if (campo) iniCaixa.valores[+campo.dataset.ini] = parseInt(campo.value, 10);
  });
  document.getElementById('iniModalValores').addEventListener('click', e => {
    const btn = e.target.closest('[data-ini-rolar]');
    if (!btn) return;
    const i = +btn.dataset.iniRolar;
    iniCaixa.valores[i] = d(20) + iniciativaDe(acharMonstro(iniCaixa.id));
    btn.previousElementSibling.value = iniCaixa.valores[i];
  });

  document.getElementById('bstLerBtn').addEventListener('click', () => {
    const texto = document.getElementById('bstColar').value;
    if (!texto.trim()) { alert('Cole o bloco de estatísticas primeiro.'); return; }
    preencherFormularioDeImportacao(lerBlocoDeEstatisticas(texto));
  });
  document.getElementById('bstForm').addEventListener('submit', salvarMonstroImportado);

  document.getElementById('bstExportarBtn').addEventListener('click', () => {
    if (!bst.meus.length) { alert('Nenhum monstro importado para exportar.'); return; }
    const blob = new Blob([JSON.stringify({ bestiario: bst.meus }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bestiario.json';
    a.click(); URL.revokeObjectURL(a.href);
  });

  document.getElementById('bstImportar').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const dados = JSON.parse(ev.target.result);
        const lista = Array.isArray(dados) ? dados : dados.bestiario;
        if (!Array.isArray(lista)) throw new Error('o arquivo não tem a lista "bestiario"');
        let novos = 0;
        lista.filter(m => m && m.n).forEach(m => {
          const id = m.id && String(m.id).startsWith('meu-') ? m.id : 'meu-' + Date.now().toString(36) + novos;
          const j = bst.meus.findIndex(x => x.id === id);
          if (j >= 0) bst.meus[j] = { ...m, id }; else { bst.meus.push({ ...m, id }); novos++; }
        });
        salvarBestiario(); renderBestiario();
        alert(`${lista.length} monstro(s) importado(s).`);
      } catch (err) { alert('Erro ao importar: ' + err.message); }
      e.target.value = '';
    };
    reader.readAsText(file);
  });

  renderBestiario();
})();
