// ==================== COMBATE ====================
// A primeira aba, feita para a mesa: o cartão do turno atual (PV, condições,
// Concentração, testes contra a morte e as ações do monstro com rolagem) e a
// ordem de iniciativa com barras de PV e dano/cura num campo só.
// Carrega antes de app.js: usa `state`, `saveData` e `esc` só dentro das
// funções, e app.js chama renderEntities() no fim da carga.

// Condições do Livro do Jogador 2024: as mesmas do Criador de Ficha
// (../dnd/data.js), com o texto de cada efeito para o "i"
const CB_COND_DADOS = (typeof DND5E_DATA !== 'undefined' && DND5E_DATA.conditions) || [];
const nomeCurto = nome => String(nome).split(' (')[0];
const CB_CONDICOES = CB_COND_DADOS.length ? CB_COND_DADOS.map(c => nomeCurto(c.name))
  : ['Amedrontado', 'Atordoado', 'Caído', 'Cego', 'Contido', 'Enfeitiçado', 'Envenenado', 'Exaustão',
     'Imobilizado', 'Incapacitado', 'Inconsciente', 'Invisível', 'Paralisado', 'Petrificado', 'Surdo'];
// Nomes que a mesa também usa para a mesma condição
const CB_COND_SINONIMOS = { agarrado: 'imobilizado', grappled: 'imobilizado', prone: 'caido', frightened: 'amedrontado' };

const semAcento = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
/** Dados da condição pelo nome digitado ("Caído", "caido", "Agarrado") */
function dadosDaCondicao(nome) {
  const chave = semAcento(nome).replace(/\s+\d+$/, '');
  const id = CB_COND_SINONIMOS[chave] || chave;
  return CB_COND_DADOS.find(c => c.id === id || semAcento(nomeCurto(c.name)) === chave) || null;
}

/** Texto da condição como no Criador de Ficha: abertura e um item por efeito */
function conditionHtml(c) {
  const itens = (c.effects || []).map(e => `<li><strong>${esc(e.title)}.</strong> ${esc(e.text)}</li>`).join('');
  return `<strong class="cond-titulo">${esc(c.name)}</strong>
    <p class="cond-intro">${esc(c.intro || '')}</p>
    ${itens ? `<ul class="cond-efeitos">${itens}</ul>` : `<p>${esc(c.desc || '')}</p>`}`;
}
const CB_DANO_PT = {
  Slashing: 'Cortante', Piercing: 'Perfurante', Bludgeoning: 'Contundente', Fire: 'Ígneo', Cold: 'Gélido',
  Lightning: 'Elétrico', Thunder: 'Trovejante', Acid: 'Ácido', Poison: 'Venenoso', Necrotic: 'Necrótico',
  Radiant: 'Radiante', Psychic: 'Psíquico', Force: 'Energético'
};
const CB_ATRIB_PT = { Strength: 'FOR', Dexterity: 'DES', Constitution: 'CON', Intelligence: 'INT', Wisdom: 'SAB', Charisma: 'CAR' };

const cb = { ultimaRolagem: '', condAberta: null, info: null };   // info: { i, id } da condição aberta no "i"

// ---------- dados da criatura ----------
/** Completa os campos novos em criaturas que vieram de versões anteriores */
function normEnt(e) {
  e.conditions = (e.conditions || []).map(c => typeof c === 'string' ? { n: c, r: null } : c).filter(c => c && c.n);
  e.tmp = +e.tmp || 0;
  e.conc = !!e.conc;
  if (!e.ds) e.ds = { s: 0, f: 0 };
  if (!Array.isArray(e.abilities)) e.abilities = [];
  return e;
}
/** Monstro ou NPC caído não joga mais: o turno passa direto por ele */
const foraDeCombate = e => e.type !== 'PC' && e.hp <= 0;
const ehHeroi = e => e.type === 'PC';
const sinalCb = n => (n >= 0 ? "+" : "") + n;

function corDoPv(e) {
  if (e.hp <= 0) return 'cb-pv-0';
  const p = e.maxHp > 0 ? e.hp / e.maxHp : 0;
  return p <= 0.25 ? 'cb-pv-critico' : p <= 0.5 ? 'cb-pv-ferido' : 'cb-pv-ok';
}
function barraDePv(e, grande) {
  const pct = e.maxHp > 0 ? Math.max(0, Math.min(100, (e.hp / e.maxHp) * 100)) : 0;
  const tmp = e.tmp ? Math.min(100, (e.tmp / Math.max(1, e.maxHp)) * 100) : 0;
  return `<div class="cb-barra-pv ${grande ? 'cb-barra-grande' : ''} ${corDoPv(e)}" role="img" aria-label="${e.hp} de ${e.maxHp} PV">
      <span class="cb-barra-cheia" style="width:${pct}%"></span>
      ${tmp ? `<span class="cb-barra-tmp" style="width:${tmp}%"></span>` : ''}
    </div>
    <div class="cb-pv-texto"><strong>${e.hp}</strong> / ${e.maxHp} PV${e.tmp ? ` <span class="cb-tmp">+${e.tmp} temp.</span>` : ''}${e.hp <= 0 ? (ehHeroi(e) ? ` · <span class="cb-caido">${e.ds && e.ds.f >= 3 ? 'morto' : e.ds && e.ds.s >= 3 ? 'estável' : 'caído'}</span>${e.ds && (e.ds.s || e.ds.f) ? ` <span class="cb-ds-mini" title="Testes contra a morte">✓${e.ds.s} ✗${e.ds.f}</span>` : ''}` : ' · <span class="cb-caido">derrotado</span>') : ''}</div>`;
}

// ---------- dano, cura, Concentração, morte ----------
/** "8" ou "-8" = dano, "+8" = cura */
function lerEntradaDePv(txt) {
  const t = String(txt || '').trim().replace(/[−–]/g, '-');
  const m = t.match(/^([+-]?)\s*(\d+)$/);
  if (!m) return null;
  return { cura: m[1] === '+', v: +m[2] };
}

/** Guarda o dano/cura com a rodada: o Painel monta o gráfico e o resumo com isso */
function registrar(e, tipo, v) {
  if (!v) return;
  if (!Array.isArray(state.registro)) state.registro = [];
  state.registro.push({ r: state.round || 1, n: e.name, lado: ehHeroi(e) ? 'heroi' : 'criatura', tipo, v });
  if (state.registro.length > 500) state.registro.splice(0, state.registro.length - 500);
}

function aplicarDano(i, v) {
  const e = state.entities[i];
  if (!e || !v) return;
  registrar(e, 'dano', v);
  const nome = e.name;
  if (ehHeroi(e) && e.hp <= 0) {
    // Dano em quem já está com 0 PV: uma falha no teste contra a morte
    e.ds.f = Math.min(3, e.ds.f + 1);
    avisoRapido(`${nome} sofreu dano caído: falha no teste contra a morte (${e.ds.f}/3).`, 'dif');
    return;
  }
  let resto = v;
  if (e.tmp) { const usa = Math.min(e.tmp, resto); e.tmp -= usa; resto -= usa; }
  e.hp = Math.max(0, e.hp - resto);
  const avisos = [`${nome} −${v} PV`];
  if (e.hp <= 0) {
    e.conc = false;
    avisos.push(ehHeroi(e) ? 'caiu (testes contra a morte)' : 'derrotado');
    if (ehHeroi(e)) e.ds = { s: 0, f: 0 };
  } else if (e.conc) {
    avisos.push(`teste de Concentração CD ${Math.min(30, Math.max(10, Math.floor(v / 2)))} (CON)`);
  }
  avisoRapido(avisos.join(' · '), e.hp <= 0 || e.conc ? 'dif' : 'neutro');
}

function aplicarCura(i, v) {
  const e = state.entities[i];
  if (!e || !v) return;
  const estavaCaido = e.hp <= 0;
  const antes = e.hp;
  e.hp = Math.min(e.maxHp, e.hp + v);
  registrar(e, 'cura', e.hp - antes);
  if (estavaCaido) e.ds = { s: 0, f: 0 };
  avisoRapido(`${e.name} +${v} PV${estavaCaido ? ' · levantou' : ''}`, 'neutro');
}

function aplicarEntradaDePv(i, txt) {
  const r = lerEntradaDePv(txt);
  if (!r) { avisoRapido('Use 8 ou -8 para dano e +8 para cura.', 'neutro'); return false; }
  if (r.cura) aplicarCura(i, r.v); else aplicarDano(i, r.v);
  renderEntities(); saveData();
  return true;
}

/** Teste contra a morte (2024): 1 = duas falhas, 20 = volta com 1 PV, 10+ = sucesso */
function rolarTesteDeMorte(i) {
  const e = state.entities[i];
  if (!e) return;
  const d20 = 1 + Math.floor(Math.random() * 20);
  let msg;
  if (d20 === 20) { e.hp = 1; e.ds = { s: 0, f: 0 }; msg = `${e.name}: 20 natural — volta com 1 PV!`; }
  else if (d20 === 1) { e.ds.f = Math.min(3, e.ds.f + 2); msg = `${e.name}: 1 natural — duas falhas (${e.ds.f}/3)`; }
  else if (d20 >= 10) { e.ds.s = Math.min(3, e.ds.s + 1); msg = `${e.name}: ${d20} — sucesso (${e.ds.s}/3)`; }
  else { e.ds.f = Math.min(3, e.ds.f + 1); msg = `${e.name}: ${d20} — falha (${e.ds.f}/3)`; }
  if (e.ds.s >= 3) msg += ' · estável';
  if (e.ds.f >= 3) msg += ' · morreu';
  cb.ultimaRolagem = `☠️ ${msg}`;
  avisoRapido(msg, 'dif');
  renderEntities(); saveData();
}

// ---------- condições ----------
function adicionarCondicao(i, nome, rodadas) {
  const e = state.entities[i];
  const n = String(nome || '').trim();
  if (!e || !n) return;
  const r = +rodadas > 0 ? +rodadas : null;
  const dados = dadosDaCondicao(n);
  const nomeFinal = dados ? nomeCurto(dados.name) : n;          // "agarrado" vira "Imobilizado", como no livro
  const ja = e.conditions.find(c => semAcento(c.n) === semAcento(nomeFinal));
  if (ja) ja.r = r; else e.conditions.push(dados && dados.id === 'exaustao' ? { n: nomeFinal, r, nivel: 1 } : { n: nomeFinal, r });
  cb.condAberta = null;
  renderEntities(); saveData();
}
function removerCondicao(i, k) {
  const e = state.entities[i];
  if (!e) return;
  e.conditions.splice(k, 1);
  renderEntities(); saveData();
}
function chipsDeCondicao(e, i) {
  const chips = e.conditions.map((c, k) => {
    const dados = dadosDaCondicao(c.n);
    const exaustao = dados && dados.id === 'exaustao';
    return `<span class="cb-cond ${dados ? 'cb-cond-regra' : ''}">${esc(c.n)}${exaustao ? ` ${c.nivel || 1}` : ''}${c.r ? ` <em>${c.r}r</em>` : ''}
      ${exaustao ? `<button type="button" data-cb-exaustao="${i}:${k}:-1" aria-label="Baixar Exaustão">−</button><button type="button" data-cb-exaustao="${i}:${k}:1" aria-label="Subir Exaustão">+</button>` : ''}
      ${dados ? `<button type="button" class="cb-cond-i" data-cb-cond-info="${i}:${dados.id}" aria-label="O que faz ${esc(c.n)}" title="O que diz o livro">i</button>` : ''}
      <button type="button" data-cb-cond-tirar="${i}:${k}" aria-label="Tirar ${esc(c.n)}">×</button></span>`;
  });
  if (e.conc) chips.unshift(`<span class="cb-cond cb-conc">🧠 Concentrando<button type="button" data-cb-conc="${i}" aria-label="Encerrar Concentração">×</button></span>`);
  return chips.join('');
}

/** Caixa com o texto da condição aberta no "i" (logo abaixo das etiquetas) */
function detalheDeCondicao(i) {
  if (!cb.info || cb.info.i !== i) return '';
  const c = CB_COND_DADOS.find(x => x.id === cb.info.id);
  return c ? `<div class="cond-detalhe">${conditionHtml(c)}</div>` : '';
}
function formCondicao(i) {
  return `<form class="cb-cond-form" data-cb-cond-form="${i}">
      <input list="cbCondLista" placeholder="Condição" aria-label="Condição" required>
      <input type="number" min="1" max="100" placeholder="rodadas" aria-label="Duração em rodadas">
      <button type="submit" class="btn btn-heal btn-sm">Pôr</button>
    </form>`;
}

// ---------- turnos ----------
/** Mantém o turno na mesma criatura quando a lista é reordenada ou cresce */
function sincronizarTurno() {
  const n = state.entities.length;
  if (!n) { state.currentTurn = 0; state.turnoId = null; return; }
  const idx = state.turnoId != null ? state.entities.findIndex(e => e.id === state.turnoId) : -1;
  if (idx >= 0) state.currentTurn = idx;
  state.currentTurn = Math.min(Math.max(0, state.currentTurn), n - 1);
  state.turnoId = state.entities[state.currentTurn].id;
}

/** Fim do turno de quem estava jogando: as condições com duração perdem uma rodada */
function fimDoTurno(e) {
  const acabaram = [];
  e.conditions = e.conditions.filter(c => {
    if (!c.r) return true;
    c.r -= 1;
    if (c.r <= 0) { acabaram.push(c.n); return false; }
    return true;
  });
  if (acabaram.length) avisoRapido(`${e.name}: acabou ${acabaram.join(', ')}`, 'dif');
}

function proximoTurno() {
  const n = state.entities.length;
  if (!n) return;
  sincronizarTurno();
  fimDoTurno(state.entities[state.currentTurn]);
  let i = state.currentTurn;
  for (let passo = 0; passo < n; passo++) {
    i = (i + 1) % n;
    if (i === 0) state.round = (state.round || 1) + 1;
    if (!foraDeCombate(state.entities[i])) break;
  }
  state.currentTurn = i;
  state.turnoId = state.entities[i].id;
  cb.ultimaRolagem = '';
  renderEntities(); saveData();
}

function turnoAnterior() {
  const n = state.entities.length;
  if (!n) return;
  sincronizarTurno();
  let i = state.currentTurn;
  for (let passo = 0; passo < n; passo++) {
    if (i === 0) state.round = Math.max(1, (state.round || 1) - 1);
    i = (i - 1 + n) % n;
    if (!foraDeCombate(state.entities[i])) break;
  }
  state.currentTurn = i;
  state.turnoId = state.entities[i].id;
  cb.ultimaRolagem = '';
  renderEntities(); saveData();
}

function proximosNaFila(qtd) {
  const n = state.entities.length;
  const fila = [];
  for (let k = 1; k < n && fila.length < qtd; k++) {
    const e = state.entities[(state.currentTurn + k) % n];
    if (!foraDeCombate(e)) fila.push(e);
  }
  return fila;
}

// ---------- links da criatura ----------
/** Botões 📖 (Bestiário) e 🔗 AideDD de quem veio do Bestiário ou dos Encontros */
function linksDaCriatura(e, rotuloCompleto) {
  if (!e.ref) return '';
  const m = typeof acharMonstro === 'function' ? acharMonstro(e.ref) : null;
  const url = m && typeof linkAidedd === 'function' ? linkAidedd(m) : '';
  return `<button type="button" class="btn-lupa" onclick="verMonstroNoBestiario('${esc(e.ref)}')" title="Bloco completo no Bestiário" aria-label="Ver ${esc(e.name)} no Bestiário">📖</button>` +
    (url ? `<a class="cb-aidedd" href="${url}" target="_blank" rel="noopener" title="Página da criatura no AideDD" aria-label="Abrir ${esc(m.n)} no AideDD">🔗${rotuloCompleto ? ' AideDD' : ''}</a>` : '');
}

// ---------- ações do monstro ----------
/** "Melee Attack Roll: +14 ... Hit: 13 (1d10 + 8) Slashing damage plus 5 (2d4) Fire damage" → números */
function lerAcao(desc) {
  const t = String(desc || '').replace(/[−–]/g, '-');
  const atk = t.match(/Attack Roll:\s*([+-]\d+)/);
  const salva = t.match(/(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) Saving Throw:\s*DC\s*(\d+)/);
  const danos = [...t.matchAll(/(\d+)\s*\((\d+d\d+(?:\s*[+-]\s*\d+)?)\)\s*([A-Z][a-z]+)/g)]
    .map(m => ({ media: +m[1], dados: m[2].replace(/\s+/g, ''), tipo: m[3] }));
  return { atk: atk ? +atk[1] : null, cd: salva ? { v: +salva[2], at: CB_ATRIB_PT[salva[1]] } : null, danos };
}

/** Rola "2d6+5" (dobrando os dados num crítico) */
function rolarExpressao(expr, critico) {
  const m = String(expr).match(/(\d+)d(\d+)([+-]\d+)?/);
  if (!m) return { total: 0, dados: [] };
  const qtd = +m[1] * (critico ? 2 : 1);
  const dados = Array.from({ length: qtd }, () => 1 + Math.floor(Math.random() * +m[2]));
  return { total: Math.max(0, dados.reduce((a, b) => a + b, 0) + (m[3] ? +m[3] : 0)), dados };
}

function rolarAcao(refId, secao, k) {
  const m = acharMonstro(refId);
  const acao = m && (m[secao] || [])[k];
  if (!acao) return;
  const info = lerAcao(acao[1]);
  const partes = [];
  let critico = false;
  if (info.atk !== null) {
    const d20 = 1 + Math.floor(Math.random() * 20);
    critico = d20 === 20;
    partes.push(`${d20 + info.atk} para acertar (d20 ${d20}${d20 === 20 ? ' CRÍTICO' : d20 === 1 ? ' erro automático' : ''})`);
  }
  if (info.cd) partes.push(`CD ${info.cd.v} ${info.cd.at}`);
  info.danos.forEach(dn => {
    const r = rolarExpressao(dn.dados, critico);
    partes.push(`${r.total} ${CB_DANO_PT[dn.tipo] || dn.tipo}`);
  });
  cb.ultimaRolagem = `🎲 ${acao[0]}: ${partes.join(' · ') || 'sem rolagem'}`;
  renderTurnoAtual();
}

function acoesDoMonstro(m) {
  const linha = (secao, a, k) => {
    const info = lerAcao(a[1]);
    const chips = [
      info.atk !== null ? `<span class="cb-chip">${sinalCb(info.atk)} acerto</span>` : '',
      info.cd ? `<span class="cb-chip">CD ${info.cd.v} ${info.cd.at}</span>` : '',
      ...info.danos.map(dn => `<span class="cb-chip">${dn.media} (${dn.dados}) ${CB_DANO_PT[dn.tipo] || dn.tipo}</span>`)
    ].join('');
    const rolavel = info.atk !== null || info.danos.length;
    return `<div class="cb-acao">
        <div class="cb-acao-topo">
          <strong>${esc(a[0])}</strong>${chips}
          ${rolavel ? `<button type="button" class="btn btn-repair btn-sm" data-cb-rolar="${esc(m.id)}:${secao}:${k}">🎲 Rolar</button>` : ''}
        </div>
        <details><summary>texto</summary><p>${esc(a[1])}</p></details>
      </div>`;
  };
  const bloco = (titulo, secao, aberto) => (m[secao] || []).length
    ? `<details class="cb-secao" ${aberto ? 'open' : ''}><summary>${titulo}</summary>${m[secao].map((a, k) => linha(secao, a, k)).join('')}</details>` : '';
  return bloco('Ações', 'ac', true) + bloco('Ações Bônus', 'ab', true) + bloco('Reações', 're', false) +
    bloco('Ações Lendárias', 'le', false) + bloco('Traços', 'tr', false);
}

// ---------- cartão do turno ----------
function renderTurnoAtual() {
  const box = document.getElementById('cbTurno');
  if (!box) return;
  const e = state.entities[state.currentTurn];
  if (!e) {
    box.innerHTML = `<h2 class="card-title">Turno atual</h2>
      <p class="fichas-ajuda">Ninguém no combate ainda. Use "➕ Adicionar ao Combate", envie fichas da aba Personagens ou monstros do Bestiário e dos Encontros.</p>`;
    return;
  }
  const i = state.currentTurn;
  const m = e.ref && typeof acharMonstro === 'function' ? acharMonstro(e.ref) : null;
  const fila = proximosNaFila(3);
  const morte = ehHeroi(e) && e.hp <= 0 ? `
    <div class="cb-morte">
      <strong>Testes contra a morte</strong>
      <span>Sucessos ${[0, 1, 2].map(k => `<button type="button" class="cb-bolinha ${k < e.ds.s ? 'cb-ok' : ''}" data-cb-ds="${i}:s:${k}" aria-label="Sucesso ${k + 1}"></button>`).join('')}</span>
      <span>Falhas ${[0, 1, 2].map(k => `<button type="button" class="cb-bolinha ${k < e.ds.f ? 'cb-falha' : ''}" data-cb-ds="${i}:f:${k}" aria-label="Falha ${k + 1}"></button>`).join('')}</span>
      <button type="button" class="btn btn-accent btn-sm" data-cb-ds-rolar="${i}">🎲 Rolar teste</button>
    </div>` : '';

  box.innerHTML = `
    <div class="cb-turno-topo">
      <span class="cb-turno-rotulo">Turno de</span>
      <h2 class="cb-turno-nome">${esc(e.name)}</h2>
      <span class="cb-tipo cb-tipo-${esc(e.type)}">${{ PC: 'Herói', NPC: 'NPC', Monster: 'Monstro' }[e.type] || esc(e.type)}</span>
      ${linksDaCriatura(e, true)}
    </div>
    <div class="cb-turno-stats">
      <span><strong>CA</strong> ${e.armor || '—'}</span>
      <span><strong>Iniciativa</strong> ${e.initiative}</span>
      ${m ? `<span><strong>Desl.</strong> ${esc(m.desl || '—')}</span>` : ''}
    </div>
    ${barraDePv(e, true)}
    <form class="cb-pv-form" data-cb-pv="${i}">
      <input type="text" inputmode="numeric" id="cbPvTurno" placeholder="dano (8) ou cura (+8)" aria-label="Dano ou cura em ${esc(e.name)}" autocomplete="off">
      <button type="submit" class="btn btn-dmg" data-cb-modo="dano">Dano</button>
      <button type="button" class="btn btn-heal" data-cb-curar="${i}">Curar</button>
      <button type="button" class="btn btn-secondary btn-sm" data-cb-tmp="${i}" title="PV temporários">+ temp.</button>
    </form>
    ${morte}
    <div class="cb-conds">
      ${chipsDeCondicao(e, i)}
      ${e.conc ? '' : `<button type="button" class="btn btn-secondary btn-sm" data-cb-conc="${i}">🧠 Concentrando</button>`}
    </div>
    ${detalheDeCondicao(i)}
    ${formCondicao(i)}
    ${cb.ultimaRolagem ? `<div class="cb-rolagem">${esc(cb.ultimaRolagem)}</div>` : ''}
    ${m ? acoesDoMonstro(m) : (e.abilities.length ? `<p class="cb-habilidades"><strong>Habilidades:</strong> ${esc(e.abilities.join(', '))}</p>` : '')}
    ${fila.length ? `<div class="cb-fila"><span>Próximos:</span> ${fila.map(f => `<span class="cb-fila-item">${esc(f.name)} <em>${f.initiative}</em></span>`).join('<span aria-hidden="true">→</span>')}</div>` : ''}`;
}

// ---------- lista de iniciativa ----------
function renderLista() {
  const box = document.getElementById('cbLista');
  if (!box) return;
  if (!state.entities.length) { box.innerHTML = '<p class="fichas-ajuda">A ordem aparece aqui.</p>'; return; }
  box.innerHTML = state.entities.map((e, i) => {
    if (state.editingIndex === i) return editorDaLinha(e, i);
    const atual = i === state.currentTurn;
    return `<div class="cb-linha ${atual ? 'cb-atual' : ''} ${foraDeCombate(e) ? 'cb-fora' : ''} cb-linha-${esc(e.type)}">
        <span class="cb-ini" title="Iniciativa">${e.initiative}</span>
        <div class="cb-quem">
          <div class="cb-nome">
            ${atual ? '<span class="cb-seta" aria-label="Turno atual">▶</span>' : ''}
            <button type="button" class="cb-nome-btn" data-cb-ir="${i}" title="Ir para o turno de ${esc(e.name)}">${esc(e.name)}</button>
            ${linksDaCriatura(e, false)}
            <span class="cb-ca" title="Classe de Armadura">🛡 ${e.armor || '—'}</span>
          </div>
          <div class="cb-conds">${chipsDeCondicao(e, i)}<button type="button" class="cb-cond-mais" data-cb-cond-abrir="${i}" title="Pôr condição">＋</button></div>
          ${atual ? '' : detalheDeCondicao(i)}
          ${cb.condAberta === i ? formCondicao(i) : ''}
        </div>
        <div class="cb-pv">${barraDePv(e, false)}</div>
        <form class="cb-pv-form cb-pv-mini" data-cb-pv="${i}">
          <input type="text" inputmode="numeric" placeholder="8 / +8" aria-label="Dano ou cura em ${esc(e.name)}" autocomplete="off">
          <button type="submit" class="btn btn-dmg" aria-label="Aplicar">✓</button>
        </form>
        <div class="cb-menu">
          <button type="button" class="btn btn-secondary btn-sm" data-cb-editar="${i}" aria-label="Editar ${esc(e.name)}">✏️</button>
          <button type="button" class="btn btn-danger" data-cb-remover="${i}" aria-label="Remover ${esc(e.name)}">✕</button>
        </div>
      </div>`;
  }).join('');
}

function editorDaLinha(e, i) {
  const campo = (rot, id, val, tipo = 'number') => `<label>${rot}<input type="${tipo}" id="${id}${i}" value="${esc(String(val ?? ''))}"></label>`;
  return `<form class="cb-linha cb-editor" data-cb-salvar="${i}">
      ${campo('Nome', 'editName', e.name, 'text')}
      <label>Tipo<select id="editType${i}">${['PC', 'NPC', 'Monster'].map(t => `<option ${e.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      ${campo('PV', 'editHp', e.hp)}${campo('PV máx.', 'editMaxHp', e.maxHp)}${campo('Temp.', 'editTmp', e.tmp)}
      ${campo('Iniciativa', 'editInit', e.initiative)}${campo('CA', 'editArmor', e.armor)}
      ${campo('Habilidades', 'editAbil', e.abilities.join(', '), 'text')}
      <div class="cb-editor-botoes">
        <button type="submit" class="btn btn-repair">✅ Salvar</button>
        <button type="button" class="btn btn-secondary" data-cb-cancelar>Cancelar</button>
      </div>
    </form>`;
}

// ---------- render geral (chamado por todo o app) ----------
function renderEntities() {
  state.entities.forEach(normEnt);
  sincronizarTurno();
  const rodada = document.getElementById('cbRodada');
  if (rodada) rodada.textContent = state.round || 1;
  const cont = document.getElementById('turnCounter');
  if (cont) cont.textContent = state.entities.length ? `${state.currentTurn + 1}/${state.entities.length}` : '0/0';
  const marcador = document.getElementById('turnMarker');
  const atual = state.entities[state.currentTurn];
  if (marcador && document.activeElement !== marcador) marcador.value = atual ? (atual.turn_info || '') : '';
  renderTurnoAtual();
  renderLista();
}
/** Nome antigo, ainda usado em app.js */
function updateTurnCounter() { renderEntities(); }
function toggleEdit(i) { state.editingIndex = i; renderEntities(); }
function saveEdit(i) {
  const e = state.entities[i];
  const v = id => document.getElementById(id + i).value;
  e.name = v('editName').trim() || e.name;
  e.type = v('editType');
  e.maxHp = Math.max(1, +v('editMaxHp') || 1);
  e.hp = Math.max(0, Math.min(e.maxHp, +v('editHp') || 0));
  e.tmp = Math.max(0, +v('editTmp') || 0);
  e.initiative = +v('editInit') || 0;
  e.armor = +v('editArmor') || 0;
  e.abilities = v('editAbil').split(',').map(s => s.trim()).filter(Boolean);
  state.entities.sort((a, b) => b.initiative - a.initiative);
  state.editingIndex = -1;
  renderEntities(); saveData();
}

// ---------- eventos ----------
(function iniciarCombate() {
  const raiz = document.getElementById('content-personagens');
  if (!raiz) return;

  // Sugestões de condição no campo
  const lista = document.createElement('datalist');
  lista.id = 'cbCondLista';
  lista.innerHTML = CB_CONDICOES.map(c => `<option value="${c}">`).join('');
  document.body.appendChild(lista);

  document.getElementById('nextTurnBtn').addEventListener('click', proximoTurno);
  document.getElementById('cbAnterior').addEventListener('click', turnoAnterior);
  document.getElementById('cbReiniciar').addEventListener('click', () => {
    if (!confirm('Voltar para a rodada 1, no primeiro da iniciativa?')) return;
    state.round = 1; state.currentTurn = 0; state.turnoId = state.entities[0] ? state.entities[0].id : null;
    renderEntities(); saveData();
  });
  document.getElementById('cbLimparMortos').addEventListener('click', () => {
    const fora = state.entities.filter(foraDeCombate);
    if (!fora.length) { avisoRapido('Nenhum monstro ou NPC com 0 PV.', 'neutro'); return; }
    if (!confirm(`Tirar do combate: ${fora.map(e => e.name).join(', ')}?`)) return;
    state.entities = state.entities.filter(e => !foraDeCombate(e));
    renderEntities(); saveData();
  });
  document.getElementById('turnMarker').addEventListener('input', e => {
    const atual = state.entities[state.currentTurn];
    if (atual) { atual.turn_info = e.target.value; saveData(); }
  });

  raiz.addEventListener('submit', ev => {
    const f = ev.target;
    if (f.dataset.cbPv !== undefined) {
      ev.preventDefault();
      const campo = f.querySelector('input');
      if (aplicarEntradaDePv(+f.dataset.cbPv, campo.value)) {
        const turno = document.getElementById('cbPvTurno');
        if (f.closest('#cbTurno') && turno) turno.focus();
      }
      return;
    }
    if (f.dataset.cbCondForm !== undefined) {
      ev.preventDefault();
      const [nome, rod] = f.querySelectorAll('input');
      adicionarCondicao(+f.dataset.cbCondForm, nome.value, rod.value);
      return;
    }
    if (f.dataset.cbSalvar !== undefined) { ev.preventDefault(); saveEdit(+f.dataset.cbSalvar); }
  });

  raiz.addEventListener('click', ev => {
    const alvo = attr => { const el = ev.target.closest(`[${attr}]`); return el ? el.getAttribute(attr) : null; };
    let v;
    if ((v = alvo('data-cb-curar')) !== null) {
      const campo = document.getElementById('cbPvTurno');
      const n = parseInt(String(campo.value).replace(/[^\d]/g, ''), 10);
      if (n) { aplicarCura(+v, n); renderEntities(); saveData(); } else campo.focus();
      return;
    }
    if ((v = alvo('data-cb-tmp')) !== null) {
      const n = parseInt(prompt('PV temporários (substituem os atuais se forem maiores):', '5'), 10);
      const e = state.entities[+v];
      if (e && n > 0) { e.tmp = Math.max(e.tmp, n); renderEntities(); saveData(); }
      return;
    }
    if ((v = alvo('data-cb-conc')) !== null) {
      const e = state.entities[+v]; e.conc = !e.conc; renderEntities(); saveData(); return;
    }
    if ((v = alvo('data-cb-cond-info')) !== null) {
      const [i, id] = v.split(':');
      cb.info = cb.info && cb.info.i === +i && cb.info.id === id ? null : { i: +i, id };
      return renderEntities();
    }
    if ((v = alvo('data-cb-exaustao')) !== null) {
      const [i, k, d] = v.split(':');
      const e = state.entities[+i]; const c = e && e.conditions[+k];
      if (!c) return;
      c.nivel = Math.max(0, Math.min(6, (c.nivel || 1) + +d));
      if (c.nivel === 0) e.conditions.splice(+k, 1);
      else if (c.nivel === 6) avisoRapido(`${e.name}: Exaustão 6 — morre.`, 'dif');
      renderEntities(); saveData(); return;
    }
    if ((v = alvo('data-cb-cond-tirar')) !== null) { const [i, k] = v.split(':'); cb.info = null; return removerCondicao(+i, +k); }
    if ((v = alvo('data-cb-cond-abrir')) !== null) {
      cb.condAberta = cb.condAberta === +v ? null : +v; renderLista();
      const campo = document.querySelector(`[data-cb-cond-form="${v}"] input`);
      if (campo) campo.focus();
      return;
    }
    if ((v = alvo('data-cb-ds')) !== null) {
      const [i, tipo, k] = v.split(':'); const e = state.entities[+i];
      e.ds[tipo] = e.ds[tipo] > +k ? +k : +k + 1;          // clicar na última marcada desmarca
      renderEntities(); saveData(); return;
    }
    if ((v = alvo('data-cb-ds-rolar')) !== null) return rolarTesteDeMorte(+v);
    if ((v = alvo('data-cb-rolar')) !== null) { const [id, secao, k] = v.split(':'); return rolarAcao(id, secao, +k); }
    if ((v = alvo('data-cb-ir')) !== null) {
      state.currentTurn = +v; state.turnoId = state.entities[+v].id; cb.ultimaRolagem = '';
      renderEntities(); saveData(); return;
    }
    if ((v = alvo('data-cb-editar')) !== null) return toggleEdit(+v);
    if (alvo('data-cb-cancelar') !== null) return toggleEdit(-1);
    if ((v = alvo('data-cb-remover')) !== null) {
      const e = state.entities[+v];
      if (!confirm(`Remover "${e.name}"?`)) return;
      state.entities.splice(+v, 1);
      renderEntities(); saveData();
    }
  });

  // Atalhos: só na aba Combate e fora de campos de texto
  document.addEventListener('keydown', ev => {
    if (!raiz.classList.contains('active') || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const modal = document.getElementById('iniModal');
    if (modal && !modal.hidden) return;
    if (ev.key === ' ' || ev.key === 'n' || ev.key === 'N') { ev.preventDefault(); proximoTurno(); }
    else if (ev.key === 'd' || ev.key === 'D') {
      const campo = document.getElementById('cbPvTurno');
      if (campo) { ev.preventDefault(); campo.focus(); }
    }
  });
})();
