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
  });
}

function renderCandidatos() {
  const lista = ordenarPor('enc', candidatosFiltrados());
  marcarCabecalhos('enc');
  const tb = document.getElementById('encCandidatos');
  if (!lista.length) {
    tb.innerHTML = '<tr><td colspan="7" class="fichas-ajuda">Nada com esses filtros (ou o orçamento acabou).</td></tr>';
    return;
  }
  tb.innerHTML = lista.map(m => `<tr>
      <td><span class="col-clickable" data-enc-ver="${esc(m.id)}">${esc(m.n)}</span></td>
      <td>${esc(tipoTexto(m))}</td>
      <td class="enc-local">${esc(habitatTexto(m.hab)) || '—'}</td>
      <td>${ndTexto(m.nd)}</td>
      <td>${formatarXp(xpDe(m))}</td>
      <td>${pilulaDif(xpDe(m))}</td>
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

  const tema = enc.atual.length && enc.tema ? `<p class="enc-tema">🏷 ${esc(enc.tema)}</p>` : '';
  box.innerHTML = tema + (enc.atual.length ? enc.atual.map((c, i) => {
    const m = acharMonstro(c.id);
    if (!m) return '';
    return `<div class="enc-item">
        <span class="col-clickable" data-enc-ver="${esc(m.id)}">${esc(m.n)}</span>
        <span class="ficha-sub bst-inline">ND ${ndTexto(m.nd)} · ${formatarXp(xpDe(m))} XP</span>
        <span class="enc-qtd">
          <button class="btn btn-secondary btn-sm" data-enc-menos="${i}" aria-label="Menos um" title="Tirar um: ${ENC_DIF_NOME[difComDelta(-xpDe(m))]}">−</button>
          <strong>${c.qtd}</strong>
          <button class="btn btn-secondary btn-sm" data-enc-mais="${i}" aria-label="Mais um" title="Mais um: ${ENC_DIF_NOME[difComDelta(xpDe(m))]}">+</button>
          <button class="btn btn-danger btn-sm enc-tirar" data-enc-tirar="${i}" aria-label="Tirar do encontro" title="Tirar ${esc(m.n)} do encontro">✕</button>
        </span>
        <span class="enc-xp">${formatarXp(xpDe(m) * c.qtd)} XP</span>
        <span class="enc-efeito">
          <span>+1 ${pilulaDif(xpDe(m))}</span>
          <span>−1 ${enc.atual.length === 1 && c.qtd === 1 ? '<span class="enc-pill">vazio</span>' : pilulaDif(-xpDe(m))}</span>
          ${c.qtd > 1 ? `<span>sem eles ${enc.atual.length === 1 ? '<span class="enc-pill">vazio</span>' : pilulaDif(-xpDe(m) * c.qtd)}</span>` : ''}
        </span>
      </div>`;
  }).join('') : '<p class="fichas-ajuda">Adicione criaturas da lista ou use 🎲 Sortear.</p>');

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
    </div>
    ${typeof riscoDoEncontroHtml === 'function' ? riscoDoEncontroHtml(enc.atual) : ''}`;
}

function renderMontagem() {
  renderEncontroAtual();
  renderSugestoes();
  renderCandidatos();
  renderTesouroAtual();
}

// ---------- efeito na dificuldade ----------
/** Dificuldade se o total de XP mudar em `delta` */
function difComDelta(delta) {
  return dificuldadeDoTotal(Math.max(0, totalDoEncontro(enc.atual) + delta), limitesDoGrupo(enc.n, enc.nivel));
}
/** Selo "→ Alta"; contornado quando a dificuldade muda */
function pilulaDif(delta) {
  const nova = difComDelta(delta);
  const muda = enc.atual.length && nova !== difAtual();
  return `<span class="enc-pill enc-txt-${nova}${muda ? ' enc-muda' : ''}" title="${muda ? 'Muda a dificuldade' : 'Mantém a dificuldade'}">→ ${ENC_DIF_NOME[nova]}</span>`;
}

/** Última dificuldade mostrada, para avisar quando ela muda */
let _difAnterior = null;

/**
 * Avisa a nova dificuldade depois de uma mudança. `acao` descreve o que o
 * mestre fez ("+1 Goblin Warrior"); sem ação, só avisa se a dificuldade mudou
 * (troca de nível ou de número de personagens).
 */
function avisarDificuldade(acao) {
  const nova = enc.atual.length ? difAtual() : null;
  const antes = _difAnterior;
  _difAnterior = nova;
  const mudou = antes && nova && antes !== nova;
  if (mudou) {
    const medidor = document.getElementById('encMedidor');
    medidor.classList.remove('enc-pulso'); void medidor.offsetWidth; medidor.classList.add('enc-pulso');
  }
  if (!acao && !mudou) return;
  if (!nova) return avisoRapido(`${acao} · encontro vazio`, 'neutro');
  const texto = mudou
    ? `Dificuldade mudou: ${ENC_DIF_NOME[antes]} → ${ENC_DIF_NOME[nova]}`
    : `Dificuldade continua ${ENC_DIF_NOME[nova]}`;
  avisoRapido(acao ? `${acao} · ${texto}` : texto, mudou ? 'dif' : 'neutro');
}

// ---------- sugestões por tipo de criatura ----------
/*
 * Olha os tipos que já estão no encontro (ou o tipo escolhido no filtro) e
 * propõe o que completa o orçamento da dificuldade escolhida: quantas cópias
 * de cada criatura do mesmo tipo cabem no XP que falta. Se o encontro passou
 * do orçamento, propõe o que tirar para voltar a ele.
 */
function renderSugestoes() {
  const box = document.getElementById('encSugestoes');
  const orc = orcamentoAtual();
  const total = totalDoEncontro(enc.atual);
  const alvo = ENC_DIF_NOME[enc.dif];
  const local = document.getElementById('encLocal').value;
  const titulo = `<h3 class="enc-sub">💡 Sugestões para ${alvo}</h3>`;

  // Passou do orçamento: o que tirar, ou o que trocar por algo mais fraco do mesmo tipo
  if (total > orc) {
    const tirar = enc.atual.map((c, i) => {
      const m = acharMonstro(c.id);
      const xp = xpDe(m);
      if (!xp) return null;
      const r = Math.ceil((total - orc) / xp);
      if (r > c.qtd || r >= 7 || total - xp * r <= 0) return null;   // tirar tudo não é sugestão
      return { i, m, r, delta: -xp * r };
    }).filter(Boolean).sort((a, b) => b.delta - a.delta);

    const trocas = enc.atual.map((c, i) => {
      const m = acharMonstro(c.id);
      const xp = xpDe(m);
      if (!xp || !m.tipo) return null;
      const cabe = orc - (total - xp);                 // XP disponível para o substituto
      const opcoes = todosOsMonstros().filter(o => o.tipo === m.tipo && o.id !== m.id &&
        xpDe(o) > 0 && xpDe(o) <= cabe && monstroNoLocal(o, local));
      if (!opcoes.length) return null;
      const melhor = opcoes.sort((a, b) => xpDe(b) - xpDe(a))[0];
      return { i, m, por: melhor, delta: xpDe(melhor) - xp };
    }).filter(Boolean).sort((a, b) => b.delta - a.delta).slice(0, 3);

    const linhasTirar = tirar.map(t => `<div class="enc-sug">
        <span>−${t.r}× <strong>${esc(t.m.n)}</strong></span> ${pilulaDif(t.delta)}
        <button class="btn btn-danger btn-sm" data-enc-sug-tirar="${t.i}:${t.r}">Tirar</button>
      </div>`).join('');
    const linhasTrocar = trocas.map(t => `<div class="enc-sug">
        <span>Trocar 1× <strong>${esc(t.m.n)}</strong> por <span class="col-clickable" data-enc-ver="${esc(t.por.id)}">${esc(t.por.n)}</span>
          <span class="ficha-sub bst-inline">ND ${ndTexto(t.por.nd)} · ${formatarXp(xpDe(t.por))} XP</span></span>
        ${pilulaDif(t.delta)}
        <button class="btn btn-secondary btn-sm" data-enc-sug-trocar="${t.i}:${esc(t.por.id)}">Trocar</button>
      </div>`).join('');
    box.innerHTML = titulo + `<p class="fichas-ajuda">O encontro passou do orçamento de ${alvo} (${formatarXp(total)} de ${formatarXp(orc)} XP).</p>` +
      (linhasTirar || linhasTrocar
        ? linhasTirar + linhasTrocar
        : '<p class="fichas-ajuda">Nenhuma troca simples volta ao orçamento: tire a criatura mais forte ou suba a dificuldade.</p>');
    return;
  }

  // O líder do encontro (a criatura de mais XP) decide quem combina; sem
  // ninguém no encontro, vale o tipo escolhido no filtro
  const lider = enc.atual.map(c => acharMonstro(c.id)).filter(Boolean).sort((a, b) => xpDe(b) - xpDe(a))[0];
  const filtro = document.getElementById('encTipo').value;
  if (!lider && !filtro) {
    box.innerHTML = titulo + '<p class="fichas-ajuda">Adicione uma criatura ou escolha um tipo no filtro para receber sugestões de quem combina com ela.</p>';
    return;
  }

  const resta = orc - total;
  const noEncontro = new Set(enc.atual.map(c => c.id));
  const combina = m => lider ? afinidade(lider, m) : (m.tipo === filtro ? 1 : 0);
  const candidatas = todosOsMonstros().filter(m => xpDe(m) > 0 && xpDe(m) <= resta && monstroNoLocal(m, local) && combina(m) > 0);
  const opcoes = candidatas
    .map(m => {
      const k = Math.min(6, Math.floor(resta / xpDe(m)));
      // Mais afim primeiro; depois, quanto do orçamento preenche (já estar no encontro desempata)
      return { m, k, nota: combina(m) + (k * xpDe(m)) / resta + (noEncontro.has(m.id) ? 0.05 : 0) - k * 0.01 };
    })
    .sort((a, b) => b.nota - a.nota)
    .slice(0, 5);
  const familia = lider && familiaDe(lider);
  const grupos = [{ rotulo: familia ? familia.nome : (BST_TIPOS[lider ? lider.tipo : filtro] || filtro), opcoes }];

  const corpo = grupos.map(g => `<div class="enc-sug-grupo">${esc(g.rotulo)}${lider ? ` · combinam com ${esc(lider.n)}` : ''}</div>` +
    (g.opcoes.length ? g.opcoes.map(o => `<div class="enc-sug">
        <span>+${o.k}× <span class="col-clickable" data-enc-ver="${esc(o.m.id)}">${esc(o.m.n)}</span>
          <span class="ficha-sub bst-inline">ND ${ndTexto(o.m.nd)} · ${formatarXp(xpDe(o.m) * o.k)} XP</span></span>
        ${pilulaDif(xpDe(o.m) * o.k)}
        <button class="btn btn-heal btn-sm" data-enc-sug="${esc(o.m.id)}:${o.k}">Adicionar</button>
      </div>`).join('') : `<p class="fichas-ajuda">Nada que combine cabe nos ${formatarXp(resta)} XP que faltam.</p>`)
  ).join('');
  box.innerHTML = titulo + `<p class="fichas-ajuda">Faltam ${formatarXp(resta)} XP para o teto de ${alvo}.</p>` + corpo;
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
function encontroMudou(acao) {
  if (!enc.atual.length) enc.tema = '';
  enc.tesouro = enc.atual.length ? sortearTesouro(enc.atual, enc.nivel, difAtual()) : null;
  salvarEncontros(); renderMontagem();
  avisarDificuldade(acao);
}

function adicionarAoEncontro(id, qtd = 1) {
  const c = enc.atual.find(x => x.id === id);
  if (c) c.qtd += qtd; else enc.atual.push({ id, qtd });
  encontroMudou(`+${qtd} ${(acharMonstro(id) || {}).n || id}`);
}

function tirarDoEncontro(i, qtd) {
  const c = enc.atual[i];
  if (!c) return;
  const nome = (acharMonstro(c.id) || {}).n || c.id;
  const r = Math.min(qtd, c.qtd);
  c.qtd -= r;
  if (c.qtd <= 0) enc.atual.splice(i, 1);
  encontroMudou(`−${r} ${nome}`);
}

// ---------- afinidades: quem anda com quem ----------
/*
 * O SRD diz o tipo e o habitat de cada criatura, mas não o "bando". Esta
 * tabela agrupa quem costuma lutar junto (goblinoides com worgs, o vampiro
 * com seus servos, o culto com diabos ou demônios, o dragão com a própria
 * prole e kobolds) para o sorteio não juntar um urso, um diabo e um fantasma.
 * Cada família tem quem a compõe (`re` no nome em inglês, ou `tipo`) e os
 * aliados que a acompanham.
 */
const ENC_FAMILIAS = [
  { id: 'goblinoides', nome: 'Bando goblinoide', re: /goblin|hobgoblin|bugbear/i, aliados: /^worg$|^wolf$|dire wolf|giant spider|giant wolf spider/i },
  { id: 'gnolls', nome: 'Matilha de gnolls', re: /gnoll/i, aliados: /hyena/i, familias: ['demonios'] },
  { id: 'vampiro', nome: 'Corte do vampiro', re: /vampire/i, aliados: /swarm of bats|swarm of rats|^wolf$|giant bat|giant rat|^bat$|^rat$/i },
  { id: 'licantropos', nome: 'Licantropos', re: /^were/i, aliados: /^wolf$|dire wolf|^rat$|giant rat|swarm of rats|^boar$|giant boar|^tiger$|panther|bear$/i },
  { id: 'diabos', nome: 'Legião infernal', re: /devil|^imp$|lemure|hell hound|erinyes|nightmare|pit fiend/i, familias: ['culto'] },
  { id: 'demonios', nome: 'Horda demoníaca', re: /balor|dretch|glabrezu|hezrou|marilith|nalfeshnee|quasit|vrock|succubus|incubus/i, familias: ['culto', 'gnolls'] },
  { id: 'mortos', nome: 'Mortos-vivos', tipo: /undead/i, aliados: /swarm of crawling claws|swarm of rats|swarm of bats/i, familias: ['culto'] },
  { id: 'culto', nome: 'Culto', re: /cultist|priest|fanatic/i },
  { id: 'bruxas', nome: 'Círculo de bruxas', re: /hag$/i, aliados: /^ogre$|troll|harpy|giant toad|will-o/i },
  { id: 'gigantes', nome: 'Gigantes e ogros', tipo: /giant/i, aliados: /dire wolf|winter wolf|mammoth|giant goat|giant elk|hell hound|^ogre zombie$/i },
  { id: 'aranhas', nome: 'Ninho de aranhas', re: /spider|ettercap|drider/i },
  { id: 'bandidos', nome: 'Bandidos', re: /bandit|^tough|^scout$|^spy$|assassin|pirate/i, aliados: /mastiff/i },
  { id: 'guarda', nome: 'Guarda e cavaleiros', re: /^guard\b|knight|^noble$|warrior infantry|warrior veteran|gladiator|priest acolyte/i, aliados: /mastiff|^warhorse$|riding horse/i },
  { id: 'conjuradores', nome: 'Conjurador e criações', re: /^mage$|archmage/i, aliados: /golem|shield guardian|homunculus|animated|gargoyle|.*mephit/i },
  { id: 'dragoes', nome: 'Covil de dragão', tipo: /dragon/i },
  { id: 'aquaticos', nome: 'Ameaça das profundezas', re: /sahuagin|merrow|shark|piranha|kraken|sea hag|giant octopus/i },
  { id: 'subterraneo', nome: 'Horrores do Subterrâneo', re: /aboleth|chuul|cloaker|grimlock|darkmantle|gibbering|grick|roper|otyugh/i },
  { id: 'elementais', nome: 'Fúria elemental', tipo: /elemental/i }
];
// Dragões andam com a própria cor (e com kobolds); elementais, com o próprio elemento
const ENC_CORES = /\b(black|blue|brass|bronze|copper|gold|green|red|silver|white)\b/i;
// Partes e formas que não entram sozinhas no sorteio
const ENC_FORA_DO_SORTEIO = /troll limb|^vampire, (bat|mist) form/i;
// Licantropo anda com o próprio animal: Werewolf com lobos, Wererat com ratos...
const ENC_LICANTROPO_ANIMAL = { wolf: /^wolf$|dire wolf/i, rat: /^rat$|giant rat|swarm of rats/i, boar: /^boar$|giant boar/i,
  tiger: /^tiger$|panther|saber-toothed/i, bear: /black bear|brown bear/i };
const ENC_ELEMENTOS = { fogo: /fire|magma|magmin|salamander|azer|efreeti|steam/i, agua: /water|merfolk|steam|ice/i,
  ar: /air|djinni|invisible stalker|dust/i, terra: /earth|xorn|gargoyle|dust|magma/i };

function familiaDe(m) {
  if (!m) return null;
  return ENC_FAMILIAS.find(f => f.re && (f.re.test(m.n) || f.re.test(m.ingles || ''))) ||
    ENC_FAMILIAS.find(f => f.tipo && f.tipo.test(m.tipo || '')) || null;
}
/** Habitats que contam como "o mesmo lugar" (Qualquer e Outros Planos não dizem nada) */
const habitatsReais = m => (m.hab || []).filter(h => h !== 'Any' && h !== 'Planar');

/**
 * Quão bem `m` combina com a âncora: 3 = mesma família (ou a mesma criatura),
 * 2 = aliado dela, 1 = mesmo tipo e mesmo habitat, 0 = não combina.
 */
function afinidade(ancora, m) {
  if (m.id === ancora.id) return 3;
  const fa = familiaDe(ancora), fm = familiaDe(m);
  if (fa && fa.id === 'dragoes') {
    const cor = (ancora.n.match(ENC_CORES) || [])[1];
    if (/kobold|half-dragon/i.test(m.n)) return 2;
    return cor && fm && fm.id === 'dragoes' && new RegExp(`\\b${cor}\\b`, 'i').test(m.n) ? 3 : 0;
  }
  if (fa && fa.id === 'licantropos') {
    const base = (ancora.n.match(/^were(\w+)/i) || [])[1];
    if (!base) return 0;
    if (new RegExp(`^were${base}\\b`, 'i').test(m.n)) return 3;
    return ENC_LICANTROPO_ANIMAL[base.toLowerCase()] && ENC_LICANTROPO_ANIMAL[base.toLowerCase()].test(m.n) ? 2 : 0;
  }
  if (fa && fa.id === 'elementais') {
    const comuns = Object.values(ENC_ELEMENTOS).some(re => re.test(ancora.n) && re.test(m.n));
    return comuns ? 3 : 0;
  }
  if (ancora.tipo === 'beast' || (ancora.tipo || '').startsWith('swarm')) {
    // Fera anda com a própria espécie: Wolf, Dire Wolf, Swarm of Rats e Giant Rat...
    const especie = n => n.toLowerCase().replace(/^(giant|dire|swarm of)\s+/, '').replace(/s$/, '').split(' ').pop();
    if (especie(ancora.n) === especie(m.n)) return 3;
  }
  if (fa && fm && fa.id === fm.id) return 3;
  if (fa && ((fa.aliados && fa.aliados.test(m.n)) || (fm && (fa.familias || []).includes(fm.id)))) return 2;
  if (fm && ((fm.aliados && fm.aliados.test(ancora.n)) || (fm.familias || []).includes(fa && fa.id))) return 2;
  // Família definida, fera ou monstruosidade (bichos solitários): estranhos não entram
  if (fa || ancora.tipo === 'beast' || ancora.tipo === 'monstrosity') return 0;
  const ha = habitatsReais(ancora), hm = habitatsReais(m);
  const mesmoLugar = !ha.length || !hm.length || ha.some(h => hm.includes(h));
  return m.tipo === ancora.tipo && mesmoLugar ? 1 : 0;
}

/** Nome do tema: a família, ou o tipo com o habitat em comum */
function temaDoEncontro(ancora, local) {
  const f = familiaDe(ancora);
  const lugar = local ? BST_HABITATS[local] : (habitatsReais(ancora)[0] ? BST_HABITATS[habitatsReais(ancora)[0]] : '');
  const nome = f ? f.nome : (BST_TIPOS[ancora.tipo] || ancora.tipo || 'Criaturas');
  return lugar ? `${nome} · ${lugar}` : nome;
}

/**
 * Sorteia criaturas com os filtros da lista até chegar perto do orçamento.
 * Começa por uma âncora (o líder, que ocupa boa parte do orçamento) e só
 * completa com quem combina com ela pela tabela de afinidades: a mesma
 * família, os aliados dela ou, sem família, o mesmo tipo no mesmo habitat.
 * No máximo três criaturas diferentes e oito no total, como os exemplos do
 * SRD: um chefe com capangas ou um bando, e não dez avulsos.
 */
function sortearEncontro() {
  const orc = orcamentoAtual();
  const cabe = document.getElementById('encCabe');
  const antes = cabe.checked;
  cabe.checked = false;                          // o sorteio olha o orçamento inteiro
  const pool = candidatosFiltrados().filter(m => xpDe(m) <= orc && !ENC_FORA_DO_SORTEIO.test(m.n));
  cabe.checked = antes;
  if (!pool.length) { alert('Nenhuma criatura cabe nesse orçamento com esses filtros.'); return; }

  const sorteia = lista => lista[Math.floor(Math.random() * lista.length)];
  // A âncora é quem lidera: ocupa boa parte do orçamento e tem com quem andar
  const fortes = pool.filter(m => xpDe(m) >= orc * 0.25);
  const comBando = fortes.filter(m => pool.some(o => o.id !== m.id && afinidade(m, o) >= 2 && xpDe(o) <= orc - xpDe(m)));
  const ancora = sorteia(comBando.length && Math.random() < 0.7 ? comBando : (fortes.length ? fortes : pool));

  const escolhidos = [];
  let resta = orc, total = 0;
  const pegar = m => {
    const c = escolhidos.find(x => x.id === m.id);
    if (c) c.qtd++; else escolhidos.push({ id: m.id, qtd: 1 });
    resta -= xpDe(m); total++;
  };
  pegar(ancora);

  // Companheiros: só quem combina com a âncora, do mais afim para o menos
  const notas = new Map(pool.map(m => [m.id, afinidade(ancora, m)]));
  const melhorNivel = Math.max(...pool.filter(m => m.id !== ancora.id).map(m => notas.get(m.id)), 0);
  const companheiros = pool.filter(m => m.id === ancora.id || (notas.get(m.id) >= Math.min(2, melhorNivel) && notas.get(m.id) > 0));

  for (let tentativas = 0; tentativas < 40 && total < 8; tentativas++) {
    const ids = escolhidos.map(c => c.id);
    const opcoes = (escolhidos.length >= 3 ? companheiros.filter(m => ids.includes(m.id)) : companheiros)
      .filter(m => xpDe(m) <= resta && xpDe(m) >= orc / 16);
    if (!opcoes.length) break;
    // Repetir quem já está forma bandos; o líder raramente vem repetido
    const repetidos = opcoes.filter(m => ids.includes(m.id) && m.id !== ancora.id);
    pegar(repetidos.length && Math.random() < 0.5 ? sorteia(repetidos)
      : sorteia(opcoes.filter(m => m.id !== ancora.id).length ? opcoes.filter(m => m.id !== ancora.id) : opcoes));
    if (resta < orc * 0.1) break;
  }
  enc.atual = escolhidos;
  enc.tema = temaDoEncontro(ancora, document.getElementById('encLocal').value);
  _difAnterior = null;                  // encontro novo: não é "mudança"
  encontroMudou(`🎲 ${enc.tema}`);
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
  alert('No Combate:\n' + partes.join('\n'));
}

// ---------- tabela de encontros ----------
function salvarNaTabela() {
  if (!enc.atual.length) { alert('Monte o encontro antes de salvar.'); return; }
  const nome = document.getElementById('encNome').value.trim() || enc.tema ||
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
    tema: enc.tema || '',
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

// Como ler cada coluna da Tabela de Encontros
const ENC_ORDEM_DIF = { baixa: 1, moderada: 2, alta: 3, acima: 4 };
const TAB_CHAVES = {
  pos: e => enc.salvos.indexOf(e), nome: e => e.nome, local: e => BST_HABITATS[e.local] || e.local || '',
  dif: e => ENC_ORDEM_DIF[e.dif] || 0, criaturas: e => e.criaturas.reduce((s, c) => s + c.qtd, 0),
  xp: e => e.xp, tesouro: e => (e.tesouro && e.tesouro.total) || 0
};

function renderTabela() {
  const lista = ordenarPor('tab', encontrosFiltrados(), TAB_CHAVES);
  marcarCabecalhos('tab');
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
  const lista = ordenarPor('tab', encontrosFiltrados(), TAB_CHAVES);   // a mesma ordem da tela
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
    avisarDificuldade();               // mudar o grupo pode mudar a dificuldade do mesmo encontro
  };
  ['encN', 'encNivel'].forEach(id => document.getElementById(id).addEventListener('input', grupo));
  document.getElementById('encDif').addEventListener('change', grupo);

  document.getElementById('encDasFichas').addEventListener('click', () => {
    const fichas = (state.fichas || []).filter(f => f.nivel);
    if (!fichas.length) { alert('Nenhuma ficha carregada na aba Personagens.'); return; }
    enc.n = fichas.length;
    enc.nivel = Math.round(fichas.reduce((s, f) => s + (+f.nivel || 1), 0) / fichas.length);
    sincronizarGrupo(); salvarEncontros(); renderMontagem();
    avisarDificuldade();
  });

  ['encBusca'].forEach(id => document.getElementById(id).addEventListener('input', renderCandidatos));
  ['encTipo', 'encLocal', 'encCabe'].forEach(id => document.getElementById(id).addEventListener('change', () => { renderCandidatos(); renderSugestoes(); }));
  ['tabBusca'].forEach(id => document.getElementById(id).addEventListener('input', renderTabela));
  ['tabDif', 'tabTipo', 'tabLocal'].forEach(id => document.getElementById(id).addEventListener('change', renderTabela));

  document.getElementById('encSortear').addEventListener('click', sortearEncontro);
  document.getElementById('encIniciativa').addEventListener('click', () => encontroParaIniciativa(enc.atual));
  document.getElementById('encLimpar').addEventListener('click', () => { enc.atual = []; enc.tema = ''; _difAnterior = null; encontroMudou(); });
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
    if ((v = alvo('data-enc-mais')) !== null) return adicionarAoEncontro(enc.atual[+v].id, 1);
    if ((v = alvo('data-enc-menos')) !== null) return tirarDoEncontro(+v, 1);
    if ((v = alvo('data-enc-tirar')) !== null) return tirarDoEncontro(+v, Infinity);
    if ((v = alvo('data-enc-sug')) !== null) { const [id, k] = v.split(':'); return adicionarAoEncontro(id, +k); }
    if ((v = alvo('data-enc-sug-tirar')) !== null) { const [i, r] = v.split(':'); return tirarDoEncontro(+i, +r); }
    if ((v = alvo('data-enc-sug-trocar')) !== null) {
      const [i, por] = v.split(':');
      const c = enc.atual[+i];
      if (!c) return;
      const de = (acharMonstro(c.id) || {}).n || c.id;
      if (--c.qtd <= 0) enc.atual.splice(+i, 1);
      const ja = enc.atual.find(x => x.id === por);
      if (ja) ja.qtd++; else enc.atual.push({ id: por, qtd: 1 });
      return encontroMudou(`${de} → ${(acharMonstro(por) || {}).n || por}`);
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
      enc.tema = s.tema || '';
      document.getElementById('encNome').value = s.nome;
      document.getElementById('encSalvarLocal').value = s.local || '';
      sincronizarGrupo(); salvarEncontros(); renderMontagem();
      _difAnterior = enc.atual.length ? difAtual() : null;
      return raiz.scrollIntoView({ behavior: 'smooth' });
    }
    if ((v = alvo('data-tab-del')) !== null) {
      const s = enc.salvos.find(x => x.id === v);
      if (!s || !confirm(`Excluir o encontro "${s.nome}"?`)) return;
      enc.salvos = enc.salvos.filter(x => x.id !== v);
      salvarEncontros(); renderTabela();
    }
  });

  RENDER_DA_TABELA.enc = renderCandidatos;
  RENDER_DA_TABELA.tab = renderTabela;
  renderMontagem();
  renderTabela();
  _difAnterior = enc.atual.length ? difAtual() : null;
})();
