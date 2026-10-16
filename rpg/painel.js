// ==================== PAINEL DO COMBATE ====================
// Vida dos dois lados, DPR de cada um e o veredito de TPK pelo TTK (Time to
// Kill): quantas rodadas cada lado leva para zerar o outro.
//
//   P_acerto = (21 − (CA − bônus)) / 20, entre 0,05 e 0,95
//     Vantagem: 1 − (1 − P)²   ·   Desvantagem: P²
//   DPR = P × dano médio + 0,05 × dano extra do crítico (os dados de novo),
//         ataque por ataque do Multiattack, somados
//   TTK do Grupo    = Σ PV dos monstros / Σ DPR dos heróis
//   TTK dos Monstros = Σ PV dos heróis  / Σ DPR dos monstros
//
//   TTK dos Monstros < TTK do Grupo → alerta de TPK iminente
//   TTK do Grupo ≤ 3                → fácil/moderado (padrão de 2024)
//   TTK dos Monstros ≤ 2            → perigo extremo de morte súbita
//
// Vantagem e Desvantagem saem das condições marcadas no Combate. Heróis usam
// a tabela de ataques da ficha; monstros, as ações do SRD (combate.js e
// bestiario.js).

/** "2d6+5" → { n: 2, d: 6, mod: 5 } */
function lerExpr(txt) {
  const m = String(txt || '').replace(/[−–]/g, '-').replace(/\s+/g, '').match(/(\d+)d(\d+)([+-]\d+)?/i);
  return m ? { n: +m[1], d: +m[2], mod: m[3] ? +m[3] : 0 } : null;
}
const mediaExpr = e => e ? e.n * (e.d + 1) / 2 + e.mod : 0;
/** Média só dos dados: é o que um crítico soma */
const mediaDosDados = e => e ? e.n * (e.d + 1) / 2 : 0;

/** P_acerto = (21 − (CA − bônus)) / 20, entre 5% (o 1 natural) e 95% (o 20 natural) */
const chanceDeAcerto = (atk, ca) => Math.min(0.95, Math.max(0.05, (21 - (ca - atk)) / 20));
/** modo 1 = Vantagem, −1 = Desvantagem, 0 = normal */
function chanceComModo(p, modo) {
  if (modo > 0) return 1 - Math.pow(1 - p, 2);
  if (modo < 0) return p * p;
  return p;
}

// ---------- condições: Vantagem, Desvantagem e quem não age ----------
const PN_DESV_ATACANTE = /^(amedrontado|envenenado|cego|contido|ca[ií]do)$/i;
const PN_VANT_ATACANTE = /^invis[ií]vel$/i;
const PN_VANT_CONTRA = /^(cego|contido|paralisado|atordoado|inconsciente|petrificado|ca[ií]do)$/i;
const PN_DESV_CONTRA = /^invis[ií]vel$/i;
const PN_NAO_AGE = /^(incapacitado|atordoado|paralisado|inconsciente|petrificado)$/i;

/** Condições da criatura no Combate, já com o nível de Exaustão */
function condicoesDe(e) {
  const lista = (e.conditions || []).map(c => typeof c === 'string' ? { n: c } : c).filter(c => c && c.n);
  const exaustao = lista.find(c => /^exaust/i.test(c.n));
  return { nomes: lista.map(c => c.n.trim()), exaustao: exaustao ? (exaustao.nivel || 1) : 0 };
}
/** Vantagem e Desvantagem se anulam, como na regra */
function modoDoAtaque(atacante, alvo) {
  const tem = (lista, re) => lista.some(n => re.test(n));
  const vant = tem(atacante.conds, PN_VANT_ATACANTE) || tem(alvo.conds, PN_VANT_CONTRA);
  const desv = tem(atacante.conds, PN_DESV_ATACANTE) || tem(alvo.conds, PN_DESV_CONTRA);
  return vant === desv ? 0 : vant ? 1 : -1;
}
const naoAge = c => c.conds.some(n => PN_NAO_AGE.test(n));

/** DPR de um ataque: P × dano médio + 0,05 × dano extra do crítico */
function dprDoAtaque(bonus, danos, ca, modo) {
  const p = chanceComModo(chanceDeAcerto(bonus, ca), modo);
  const medio = danos.reduce((s, d) => s + mediaExpr(d), 0);
  const extraCritico = danos.reduce((s, d) => s + mediaDosDados(d), 0);
  return { dpr: p * medio + 0.05 * extraCritico, p };
}

// ---------- lado de cada criatura ----------
/** NPC entra como inimigo; o Painel deixa trocar para aliado */
const pnHeroi = e => e.type === 'PC' || !!e.aliado;

// ---------- perfil dos heróis ----------
function fichaDoHeroi(e) {
  const fichas = state.fichas || [];
  return fichas.find(f => f.id === e.id) || fichas.find(f => (f.nome || '').trim() === (e.name || '').trim()) || null;
}

/** Ataques por turno pela classe e nível (Ataque Extra; o Monge ainda tem o golpe de Artes Marciais) */
function ataquesPorTurno(classe, nivel) {
  const c = String(classe || '');
  if (/Guerreiro|Fighter/i.test(c)) return nivel >= 20 ? 4 : nivel >= 11 ? 3 : nivel >= 5 ? 2 : 1;
  if (/Monge|Monk/i.test(c)) return (nivel >= 5 ? 2 : 1) + 1;
  if (/B[aá]rbaro|Barbarian|Paladino|Paladin|Patrulheiro|Guardi[aã]o|Ranger/i.test(c)) return nivel >= 5 ? 2 : 1;
  return 1;
}

/** Linhas da tabela de ataques da ficha ("+5", "1d8 +3 Cortante") viram ataques */
function ataquesDaFicha(ficha) {
  const linhas = (ficha && ficha.json && ficha.json.sheet && ficha.json.sheet.weaponRows) || [];
  const nivel = +ficha.nivel || 1;
  return linhas.map(r => {
    const atk = String(r.atk || '').replace(/[−–]/g, '-').match(/^\s*([+-]?\d+)/);
    const dados = lerExpr(r.damage);
    if (!atk || !dados || !r.name) return null;
    // Truque de dano cresce nos níveis 5, 11 e 17; a ficha mostra o dado base
    if (/Truque/i.test(r.notes || '')) dados.n *= nivel >= 17 ? 4 : nivel >= 11 ? 3 : nivel >= 5 ? 2 : 1;
    return { nome: r.name, atk: parseInt(atk[1], 10), dados, truque: /Truque/i.test(r.notes || '') };
  }).filter(Boolean);
}

function perfilDoHeroi(e, caInimiga) {
  const ficha = fichaDoHeroi(e);
  const nivel = ficha ? (+ficha.nivel || 1) : null;
  let ataques = ficha ? ataquesDaFicha(ficha) : [];
  let estimado = false;
  if (!ataques.length) {
    ataques = [{ nome: 'ataque estimado', atk: 5, dados: { n: 1, d: 8, mod: 3 } }];
    estimado = true;
  }
  const n = ficha ? ataquesPorTurno(ficha.classe, nivel) : 1;
  // Escolhe o ataque que mais rende contra a CA média dos inimigos; truque não usa Ataque Extra
  const rende = a => (a.truque ? 1 : n) * chanceDeAcerto(a.atk, caInimiga) * mediaExpr(a.dados);
  const melhor = ataques.slice().sort((a, b) => rende(b) - rende(a))[0];
  const furtivo = ficha && /Ladino|Rogue/i.test(ficha.classe || '') ? { n: Math.ceil(nivel / 2), d: 6, mod: 0 } : null;
  const c = condicoesDe(e);
  return {
    id: e.id, nome: e.name, pv: Math.max(0, e.hp), pvMax: e.maxHp, ca: +e.armor || 10,
    pvEfetivo: e.hp > 0 ? e.hp + (+e.tmp || 0) : 0,             // os temporários também aguentam dano
    ataque: melhor, n: melhor.truque ? 1 : n, furtivo, estimado, nivel: nivel || 1,
    conds: c.nomes, exaustao: c.exaustao,
    ds: e.ds || { s: 0, f: 0 }
  };
}

// ---------- perfil dos monstros ----------
const PN_NUMEROS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };

/** Ataques de um bloco de texto (monstro importado): inglês e português */
function ataquesDoTexto(texto) {
  const t = String(texto || '').replace(/[−–]/g, '-');
  const re = /(?:Attack Roll|Jogada de Ataque)[^:]*:\s*([+-]\d+)[\s\S]{0,160}?(?:Hit|Acerto):\s*\d+\s*\((\d+d\d+(?:\s*[+-]\s*\d+)?)\)/gi;
  return [...t.matchAll(re)].map((m, i) => ({ nome: `ataque ${i + 1}`, atk: +m[1], danos: [lerExpr(m[2])] }));
}

/** Rotina do turno a partir do Multiattack ("makes three Rend attacks", "makes two attacks, using Scimitar or Shortbow") */
function rotinaDoMulti(desc, ataques) {
  let t = String(desc || '');
  const rotina = [];
  const qtdDe = w => PN_NUMEROS[w.toLowerCase()] || +w || 1;
  const porNome = nome => ataques.find(a => a.nome.toLowerCase() === nome.trim().toLowerCase());
  // "makes two Claw or Nightmare Ray attacks": a quantidade vale para a melhor das opções
  t = t.replace(/\b(one|two|three|four|five|six|\d+)\s+([A-Z][\w' -]*?)\s+or\s+([A-Z][\w' -]*?)\s+attacks?/g, (trecho, qtd, a1, a2) => {
    const opcoes = [porNome(a1), porNome(a2)].filter(Boolean).sort((x, y) => y.media - x.media);
    if (!opcoes.length) return trecho;
    for (let i = 0; i < qtdDe(qtd); i++) rotina.push(opcoes[0]);
    return '';
  });
  ataques.forEach(a => {
    const nome = a.nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = t.match(new RegExp(`\\b(one|two|three|four|five|six|\\d+)\\s+${nome}\\s+attacks?`, 'i'));
    if (m) for (let i = 0; i < (PN_NUMEROS[m[1].toLowerCase()] || +m[1]); i++) rotina.push(a);
  });
  if (rotina.length) return rotina;
  const generico = t.match(/makes\s+(one|two|three|four|five|six|\d+)\s+attacks?/i);
  if (generico && ataques.length) {
    const melhor = ataques.slice().sort((a, b) => b.media - a.media)[0];
    return Array(PN_NUMEROS[generico[1].toLowerCase()] || +generico[1]).fill(melhor);
  }
  return null;
}

/**
 * Monstro sem ações legíveis: números típicos pelo ND. Bônus de ataque de
 * 3 + BP, e o dano por rodada cresce com o ND (~6 por ND, mais 4), dividido em
 * dois ataques a partir do ND 5. Sem ND, um ataque modesto (+4, 1d8+2).
 */
function rotinaEstimada(nd) {
  const n = ndNumero(nd);
  if (n === null) return [{ nome: 'ataque estimado', atk: 4, danos: [{ n: 1, d: 8, mod: 2 }] }];
  const bp = n >= 29 ? 9 : n >= 25 ? 8 : n >= 21 ? 7 : n >= 17 ? 6 : n >= 13 ? 5 : n >= 9 ? 4 : n >= 5 ? 3 : 2;
  const qtd = n >= 5 ? 2 : 1;
  const porAtaque = Math.max(3, Math.round(6 * n + 4)) / qtd;
  const mod = Math.round(porAtaque / 2);
  const dados = Math.max(1, Math.round((porAtaque - mod) / 3.5));
  return Array.from({ length: qtd }, () => ({ nome: 'ataque estimado', atk: 3 + bp, danos: [{ n: dados, d: 6, mod }] }));
}

/** Dano que sempre entra: "plus 2 (1d4) Slashing damage if the attack roll had Advantage" fica de fora */
function danosSemCondicao(desc) {
  const t = String(desc || '').replace(/[−–]/g, '-');
  return [...t.matchAll(/(\d+)\s*\((\d+d\d+(?:\s*[+-]\s*\d+)?)\)\s*[A-Z][a-z]+ damage/g)]
    .filter(m => {
      // A condição deste dano vai até o próximo "plus" ou o fim da frase
      const resto = t.slice(m.index + m[0].length).split(/\.|\bplus\b/)[0];
      return !/\bif\b/i.test(resto);
    })
    .map(m => lerExpr(m[2])).filter(Boolean);
}

function perfilDoMonstro(e) {
  const m = e.ref && typeof acharMonstro === 'function' ? acharMonstro(e.ref) : null;
  let ataques = [];
  let rotina = null;
  let aoe = null;
  let estimado = false;

  if (m && (m.ac || []).length) {
    ataques = m.ac.map(a => {
      const info = lerAcao(a[1]);
      return { nome: a[0].replace(/\s*\(.*\)$/, ''), atk: info.atk, danos: danosSemCondicao(a[1]), cd: info.cd, rotulo: a[0] };
    });
    // Sopro e afins: salvaguarda com dano e Recarga
    const sopro = ataques.filter(a => a.cd && a.danos.length && /Recarga (\d)/.test(a.rotulo))
      .sort((a, b) => b.danos.reduce((s, x) => s + mediaExpr(x), 0) - a.danos.reduce((s, x) => s + mediaExpr(x), 0))[0];
    if (sopro) aoe = { nome: sopro.nome, cd: sopro.cd.v, danos: sopro.danos, min: +sopro.rotulo.match(/Recarga (\d)/)[1] };
    ataques = ataques.filter(a => a.atk !== null && a.danos.length)
      .map(a => ({ ...a, media: a.danos.reduce((s, x) => s + mediaExpr(x), 0) }));
    const multi = m.ac.find(a => /^Multiattack/i.test(a[0]));
    rotina = multi ? rotinaDoMulti(multi[1], ataques) : null;
    if (!rotina && ataques.length) rotina = [ataques.slice().sort((a, b) => b.media - a.media)[0]];
  } else if (m && m.texto) {
    ataques = ataquesDoTexto(m.texto).map(a => ({ ...a, media: mediaExpr(a.danos[0]) }));
    const multi = String(m.texto).match(/makes\s+(two|three|four|five|\d+)\s+attacks?|faz\s+(dois|duas|tr[eê]s|quatro)\s+ataques/i);
    const qtd = multi ? (PN_NUMEROS[(multi[1] || '').toLowerCase()] || +multi[1] || { dois: 2, duas: 2, tres: 3, 'três': 3, quatro: 4 }[(multi[2] || '').toLowerCase()] || 1) : 1;
    if (ataques.length) rotina = Array(qtd).fill(ataques.slice().sort((a, b) => b.media - a.media)[0]);
  }
  if (!rotina || !rotina.length) {
    if (!aoe) { rotina = rotinaEstimada(m && m.nd); estimado = true; } else rotina = [];
  }
  const c = condicoesDe(e);
  return {
    id: e.id, nome: e.name, pv: Math.max(0, e.hp), pvMax: e.maxHp, ca: +e.armor || 10,
    pvEfetivo: e.hp > 0 ? e.hp + (+e.tmp || 0) : 0,
    rotina, aoe, estimado, conds: c.nomes, exaustao: c.exaustao
  };
}

// ---------- DPR ----------
/** DPR do herói contra um alvo: n ataques (Ataque Extra) + Ataque Furtivo uma vez por turno */
function dprHeroiContra(h, alvo) {
  if (h.pv <= 0 || naoAge(h)) return 0;
  const bonus = h.ataque.atk - 2 * h.exaustao;               // Exaustão: −2 por nível no d20
  const um = dprDoAtaque(bonus, [h.ataque.dados], alvo.ca, modoDoAtaque(h, alvo));
  let dpr = h.n * um.dpr;
  if (h.furtivo) dpr += (1 - Math.pow(1 - um.p, h.n)) * mediaExpr(h.furtivo) + 0.05 * mediaDosDados(h.furtivo);
  return dpr;
}

/** Frequência de uso de uma ação com Recarga X–6: usa, recarrega com chance (7−X)/6 por turno */
const frequenciaDeRecarga = min => 1 / (1 + 6 / (7 - min));

/** DPR do monstro contra um alvo: cada ataque da rotina do Multiattack, somados */
function dprMonstroContra(mo, alvo) {
  if (mo.pv <= 0 || naoAge(mo)) return 0;
  const modo = modoDoAtaque(mo, alvo);
  return mo.rotina.reduce((s, a) => s + dprDoAtaque(a.atk - 2 * mo.exaustao, a.danos, alvo.ca, modo).dpr, 0);
}

/**
 * DPR total da criatura no turno: a média do DPR contra cada inimigo de pé
 * (ninguém sabe em quem ela vai bater). Sopro com Recarga entra pela
 * frequência de uso, em até 2 alvos, com metade das salvaguardas passando
 * (0,75 do dano médio por alvo).
 */
function dprTotal(atacante, inimigos, ehHeroi) {
  const vivos = inimigos.filter(x => x.pv > 0);
  if (!vivos.length) return 0;
  const contra = ehHeroi ? dprHeroiContra : dprMonstroContra;
  const rotina = vivos.reduce((s, alvo) => s + contra(atacante, alvo), 0) / vivos.length;
  if (ehHeroi || !atacante.aoe || atacante.pv <= 0 || naoAge(atacante)) return rotina;
  const freq = frequenciaDeRecarga(atacante.aoe.min);
  const sopro = atacante.aoe.danos.reduce((t, x) => t + mediaExpr(x), 0) * 0.75 * Math.min(2, vivos.length);
  return rotina * (1 - freq) + sopro * freq;
}

/** Dano de um turno se tudo acertar (para "pode cair num turno") */
function danoMaximoDeUmTurno(mo) {
  const rotina = mo.rotina.reduce((s, a) => s + a.danos.reduce((t, x) => t + mediaExpr(x), 0), 0);
  const sopro = mo.aoe ? mo.aoe.danos.reduce((t, x) => t + mediaExpr(x), 0) : 0;
  return Math.max(rotina, sopro);
}

// ---------- TTK e veredito ----------
const media = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
const pct = p => `${Math.round(p * 100)}%`;
const rodadasTexto = t => !isFinite(t) ? 'nunca' : t < 1 ? '< 1' : t.toFixed(1).replace('.', ',');
/** "cai em ~2,1 rodadas" / "cai em menos de 1 rodada" */
const caiEm = t => !isFinite(t) ? 'não cai' : t < 1 ? 'cai em menos de 1 rodada' : `cai em ~${rodadasTexto(t)} rodadas`;

/**
 * Veredito pelas três regras (sempre com ícone e texto, nunca só a cor):
 *   TTK dos Monstros < TTK do Grupo → TPK iminente
 *   TTK dos Monstros ≤ 2            → perigo extremo de morte súbita
 *   TTK do Grupo ≤ 3                → fácil/moderado
 */
function veredito(ttkG, ttkM, heroisDePe, monstrosDePe) {
  if (!heroisDePe) return { id: 'critico', icone: '☠️', nome: 'Grupo caído', texto: 'Todos os heróis estão com 0 PV.' };
  if (!monstrosDePe) return { id: 'baixo', icone: '🏆', nome: 'Combate vencido', texto: 'Nenhuma criatura inimiga de pé.' };
  const tpk = ttkM < ttkG;
  const subita = ttkM <= 2;
  if (tpk && subita) return { id: 'critico', icone: '☠️', nome: 'TPK iminente', texto: 'Os monstros derrubam o grupo antes de cair, e rápido (TTK dos Monstros ≤ 2): perigo extremo de morte súbita.' };
  if (tpk) return { id: 'alto', icone: '🔶', nome: 'Alerta de TPK', texto: 'TTK dos Monstros menor que o do Grupo: os monstros derrubam os heróis antes de morrer.' };
  if (subita) return { id: 'moderado', icone: '⚠️', nome: 'Morte súbita', texto: 'O grupo vence, mas os monstros derrubam heróis rápido demais (TTK dos Monstros ≤ 2).' };
  if (ttkG <= 3) return { id: 'baixo', icone: '✅', nome: 'Fácil/moderado', texto: 'O grupo vence em até 3 rodadas, o padrão de D&D 2024.' };
  return { id: 'neutro', icone: '⏳', nome: 'Combate longo', texto: 'O grupo vence, mas leva mais de 3 rodadas: os recursos vão pesar.' };
}

/** TTK e DPR de dois lados já montados em perfis */
function calcularTtk(herois, monstros) {
  const dprH = herois.reduce((s, h) => s + dprTotal(h, monstros, true), 0);
  const dprM = monstros.reduce((s, m) => s + dprTotal(m, herois, false), 0);
  const pvH = herois.reduce((s, h) => s + h.pvEfetivo, 0);
  const pvM = monstros.reduce((s, m) => s + m.pvEfetivo, 0);
  const ttkG = dprH > 0 ? pvM / dprH : Infinity;
  const ttkM = dprM > 0 ? pvH / dprM : Infinity;
  return { dprH, dprM, pvH, pvM, ttkG, ttkM,
    veredito: veredito(ttkG, ttkM, herois.some(h => h.pv > 0), monstros.some(m => m.pv > 0)) };
}

// ---------- análise do combate atual ----------
function analisarCombate() {
  const ents = state.entities || [];
  const inimigosVivos = ents.filter(e => !pnHeroi(e) && e.hp > 0);
  const caInimiga = media(inimigosVivos.map(e => +e.armor || 10)) || 13;
  const herois = ents.filter(pnHeroi).map(e => perfilDoHeroi(e, caInimiga));
  const monstros = ents.filter(e => !pnHeroi(e)).map(perfilDoMonstro);
  return { herois, monstros, caInimiga, ...calcularTtk(herois, monstros) };
}

// ---------- desenho ----------
function barraDoLado(rotulo, classe, atual, max, vivos, total) {
  const p = max > 0 ? Math.max(0, Math.min(1, atual / max)) : 0;
  return `<div class="pn-lado">
      <div class="pn-lado-topo"><span class="pn-marca ${classe}" aria-hidden="true"></span><strong>${rotulo}</strong>
        <span class="pn-lado-num">${atual} / ${max} PV · ${pct(p)}</span><span class="pn-lado-sub">${vivos} de ${total} de pé</span></div>
      <div class="pn-barra" role="img" aria-label="${rotulo}: ${atual} de ${max} PV"><span class="${classe}" style="width:${p * 100}%"></span></div>
    </div>`;
}

/** Avisa quando uma condição muda o DPR: "com Vantagem", "Desvantagem", "não age" */
function modos(atacante, inimigos, ehHeroi) {
  if (atacante.pv <= 0) return '';
  if (naoAge(atacante)) return ' · <strong class="pn-perigo-txt">não age (condição)</strong>';
  const vivos = inimigos.filter(x => x.pv > 0);
  const m = vivos.map(alvo => modoDoAtaque(atacante, alvo));
  const vant = m.filter(x => x > 0).length, desv = m.filter(x => x < 0).length;
  const partes = [];
  if (vant) partes.push(`Vantagem contra ${vant === vivos.length ? 'todos' : vant}`);
  if (desv) partes.push(`Desvantagem contra ${desv === vivos.length ? 'todos' : desv}`);
  if (atacante.exaustao) partes.push(`Exaustão ${atacante.exaustao} (−${2 * atacante.exaustao})`);
  return partes.length ? ` · ${partes.join(', ')}` : '';
}

function blocoDeHerois(a) {
  if (!a.herois.length) return '<p class="fichas-ajuda">Nenhum herói no combate.</p>';
  const ameacas = a.monstros.filter(m => m.pv > 0).map(m => ({ m, max: danoMaximoDeUmTurno(m) }));
  return a.herois.map((h, j) => {
    const perigo = h.pv > 0 && ameacas.filter(x => x.max >= h.pv).sort((x, y) => y.max - x.max)[0];
    const atq = h.ataque;
    return `<div class="pn-linha">
        <div class="pn-linha-topo"><strong>${esc(h.nome)}</strong><span class="ficha-sub bst-inline">CA ${h.ca}</span>
          ${h.pv > 0 && a.dprM > 0 ? `<span class="pn-chance" title="Se todos os monstros focarem nele: PV ÷ DPR total dos monstros">${caiEm(h.pvEfetivo / a.dprM)} se focado</span>` : ''}</div>
        ${barraDePv({ hp: h.pv, maxHp: h.pvMax, tmp: 0, type: 'PC', ds: h.ds }, false)}
        <p class="pn-detalhe">${h.estimado ? '⚠ sem ficha com ataques: ataque estimado (+5, 1d8+3)' :
          `${esc(atq.nome)} ${atq.atk >= 0 ? '+' : ''}${atq.atk}, ${atq.dados.n}d${atq.dados.d}${atq.dados.mod ? (atq.dados.mod > 0 ? '+' : '') + atq.dados.mod : ''}${h.n > 1 ? ` ×${h.n}` : ''}${h.furtivo ? ` + Ataque Furtivo ${h.furtivo.n}d6` : ''}`}
          · DPR ${dprTotal(h, a.monstros, true).toFixed(1).replace('.', ',')}${modos(h, a.monstros, true)}</p>
        ${perigo ? `<p class="pn-perigo">⚠️ Pode cair num turno de ${esc(perigo.m.nome)} (até ~${Math.round(perigo.max)} de dano)</p>` : ''}
      </div>`;
  }).join('');
}

function blocoDeCriaturas(a) {
  if (!a.monstros.length) return '<p class="fichas-ajuda">Nenhuma criatura inimiga no combate.</p>';
  const ents = state.entities || [];
  return a.monstros.map(m => {
    const e = ents.find(x => x.id === m.id);
    const rotina = m.rotina.map(r => r.nome).join(' + ');
    const rodadas = a.dprH > 0 && m.pv > 0 ? m.pvEfetivo / a.dprH : null;
    return `<div class="pn-linha ${m.pv <= 0 ? 'pn-fora' : ''}">
        <div class="pn-linha-topo"><strong>${esc(m.nome)}</strong><span class="ficha-sub bst-inline">CA ${m.ca}</span>
          ${e && e.type === 'NPC' ? `<button type="button" class="btn btn-secondary btn-sm" data-pn-aliado="${esc(String(m.id))}" title="Contar como aliado dos heróis">↔ aliado</button>` : ''}
          ${rodadas ? `<span class="pn-chance" title="Se o grupo focar nela: PV ÷ DPR total dos heróis">${caiEm(rodadas)} se focada</span>` : ''}</div>
        ${barraDePv({ hp: m.pv, maxHp: m.pvMax, tmp: 0, type: 'Monster' }, false)}
        <p class="pn-detalhe">${m.estimado ? '⚠ ações estimadas pelo ND · ' : ''}${rotina ? esc(rotina) : ''}${m.aoe ? `${rotina ? ' · ' : ''}${esc(m.aoe.nome)} (Recarga ${m.aoe.min}–6, CD ${m.aoe.cd})` : ''}
          · DPR ${dprTotal(m, a.herois, false).toFixed(1).replace('.', ',')}${modos(m, a.herois, false)}</p>
      </div>`;
  }).join('');
}

function blocoDeAliados() {
  const aliados = (state.entities || []).filter(e => e.type === 'NPC' && e.aliado);
  return aliados.length ? `<p class="pn-detalhe">NPCs aliados: ${aliados.map(e =>
    `${esc(e.name)} <button type="button" class="btn btn-secondary btn-sm" data-pn-aliado="${esc(String(e.id))}">↔ inimigo</button>`).join(' ')}</p>` : '';
}

/** Dano causado por rodada, de cada lado, a partir do registro do Combate */
function graficoPorRodada() {
  const reg = (state.registro || []).filter(r => r.tipo === 'dano');
  if (!reg.length) return '<p class="fichas-ajuda">O gráfico aparece quando houver dano registrado na aba Combate.</p>';
  const rodadas = Math.max(...reg.map(r => r.r));
  const dados = Array.from({ length: rodadas }, (_, k) => ({
    r: k + 1,
    herois: reg.filter(x => x.r === k + 1 && x.lado === 'criatura').reduce((s, x) => s + x.v, 0),   // dano que os heróis causaram
    criaturas: reg.filter(x => x.r === k + 1 && x.lado === 'heroi').reduce((s, x) => s + x.v, 0)
  })).slice(-12);
  const max = Math.max(1, ...dados.map(d => Math.max(d.herois, d.criaturas)));
  const L = 560, A = 180, base = 150, topo = 12, grupo = (L - 40) / dados.length, barra = Math.min(22, (grupo - 10) / 2);
  const altura = v => (v / max) * (base - topo);
  const barras = dados.map((d, k) => {
    const x0 = 34 + k * grupo + (grupo - (barra * 2 + 2)) / 2;
    const b = (v, x, cls, quem) => v ? `<path class="${cls}" d="M${x},${base} V${base - altura(v) + 4} q0,-4 4,-4 h${barra - 8} q4,0 4,4 V${base} Z"
        data-pn-dica="Rodada ${d.r} · ${quem}: ${v} de dano"></path>
        <rect class="pn-alvo" x="${x - 2}" y="${topo}" width="${barra + 4}" height="${base - topo}" data-pn-dica="Rodada ${d.r} · ${quem}: ${v} de dano"></rect>` : '';
    return b(d.herois, x0, 'pn-cor-h', 'heróis causaram') + b(d.criaturas, x0 + barra + 2, 'pn-cor-m', 'criaturas causaram') +
      `<text x="${34 + k * grupo + grupo / 2}" y="${base + 16}" class="pn-eixo" text-anchor="middle">R${d.r}</text>`;
  }).join('');
  const grade = [0, 0.5, 1].map(f => `<line x1="30" x2="${L}" y1="${base - f * (base - topo)}" y2="${base - f * (base - topo)}" class="pn-grade"></line>
      <text x="26" y="${base - f * (base - topo) + 4}" class="pn-eixo" text-anchor="end">${Math.round(f * max)}</text>`).join('');
  return `<div class="pn-legenda"><span><i class="pn-marca pn-cor-h"></i>Dano causado pelos heróis</span><span><i class="pn-marca pn-cor-m"></i>Dano causado pelas criaturas</span></div>
    <div class="pn-grafico">
      <svg viewBox="0 0 ${L} ${A}" role="img" aria-label="Dano causado por rodada, heróis e criaturas">${grade}${barras}</svg>
      <div class="pn-dica" hidden></div>
    </div>
    <details class="pn-tabela"><summary>Ver como tabela</summary>
      <table><thead><tr><th>Rodada</th><th>Heróis causaram</th><th>Criaturas causaram</th></tr></thead>
      <tbody>${dados.map(d => `<tr><td>${d.r}</td><td>${d.herois}</td><td>${d.criaturas}</td></tr>`).join('')}</tbody></table>
    </details>`;
}

function blocoDoRegistro() {
  const reg = (state.registro || []).slice(-15).reverse();
  if (!reg.length) return '<p class="fichas-ajuda">Nada registrado ainda.</p>';
  return `<ul class="pn-registro">${reg.map(r => `<li><span class="pn-rod">R${r.r}</span>
      <span class="pn-marca ${r.lado === 'heroi' ? 'pn-cor-h' : 'pn-cor-m'}" aria-hidden="true"></span>
      ${esc(r.n)} ${r.tipo === 'dano' ? `<strong class="pn-dano">−${r.v}</strong>` : `<strong class="pn-cura">+${r.v}</strong>`}</li>`).join('')}</ul>`;
}

function renderPainel() {
  const box = document.getElementById('pnConteudo');
  if (!box) return;
  const ents = state.entities || [];
  if (!ents.length) {
    box.innerHTML = '<div class="card"><p class="fichas-ajuda">Ponha heróis e criaturas na aba Combate para ver o painel.</p></div>';
    return;
  }
  const a = analisarCombate();
  const H = a.herois, M = a.monstros;
  const soma = (l, k) => l.reduce((s, x) => s + x[k], 0);
  const v = a.veredito;

  box.innerHTML = `
    <div class="card pn-lados">
      ${barraDoLado('Heróis', 'pn-cor-h', soma(H, 'pv'), soma(H, 'pvMax'), H.filter(h => h.pv > 0).length, H.length)}
      ${barraDoLado('Criaturas', 'pn-cor-m', soma(M, 'pv'), soma(M, 'pvMax'), M.filter(m => m.pv > 0).length, M.length)}
    </div>

    <div class="pn-tiles">
      <div class="pn-tile pn-risco-${v.id}">
        <span class="pn-tile-rotulo">Veredito de TPK</span>
        <strong class="pn-tile-valor pn-tile-veredito">${v.icone} ${v.nome}</strong>
        <span class="pn-tile-sub">${v.texto}</span>
      </div>
      <div class="pn-tile">
        <span class="pn-tile-rotulo"><i class="pn-marca pn-cor-h"></i>TTK do Grupo</span>
        <strong class="pn-tile-valor">${rodadasTexto(a.ttkG)}</strong>
        <span class="pn-tile-sub">rodadas para os heróis zerarem os monstros (${a.pvM} PV ÷ ${a.dprH.toFixed(1).replace('.', ',')} DPR)</span>
      </div>
      <div class="pn-tile">
        <span class="pn-tile-rotulo"><i class="pn-marca pn-cor-m"></i>TTK dos Monstros</span>
        <strong class="pn-tile-valor">${rodadasTexto(a.ttkM)}</strong>
        <span class="pn-tile-sub">rodadas para os monstros zerarem os heróis (${a.pvH} PV ÷ ${a.dprM.toFixed(1).replace('.', ',')} DPR)</span>
      </div>
      <div class="pn-tile">
        <span class="pn-tile-rotulo">DPR total</span>
        <strong class="pn-tile-valor pn-tile-par"><span><i class="pn-marca pn-cor-h"></i>${Math.round(a.dprH)}</span><span><i class="pn-marca pn-cor-m"></i>${Math.round(a.dprM)}</span></strong>
        <span class="pn-tile-sub">heróis · criaturas, dano esperado por rodada</span>
      </div>
    </div>

    <div class="pn-cols">
      <div class="card"><h3 class="enc-sub">🛡 Heróis</h3>${blocoDeHerois(a)}${blocoDeAliados()}</div>
      <div class="card"><h3 class="enc-sub">👹 Criaturas</h3>${blocoDeCriaturas(a)}</div>
    </div>

    <div class="pn-cols">
      <div class="card"><h3 class="enc-sub">Dano por rodada</h3>${graficoPorRodada()}</div>
      <div class="card"><div class="tes-topo"><h3 class="enc-sub">Registro</h3>
        <button type="button" class="btn btn-secondary btn-sm" id="pnLimparRegistro">Limpar registro</button></div>${blocoDoRegistro()}</div>
    </div>

    <p class="tes-regra">Como é calculado: P_acerto = (21 − (CA − bônus)) ÷ 20, entre 5% e 95%; com Vantagem 1 − (1 − P)², com Desvantagem P² (vindas das condições do Combate; Exaustão tira 2 por nível). DPR = P × dano médio + 0,05 × dano extra do crítico, ataque por ataque do Multiattack, na média contra os inimigos de pé; sopro com Recarga entra pela frequência de uso, em até 2 alvos. TTK do Grupo = PV dos monstros ÷ DPR dos heróis; TTK dos Monstros = PV dos heróis ÷ DPR dos monstros. Veredito: TTK dos Monstros menor que o do Grupo = TPK iminente; TTK dos Monstros ≤ 2 = morte súbita; TTK do Grupo ≤ 3 = fácil/moderado. Heróis usam só a tabela de ataques da ficha (magias de área e cura não entram).</p>`;
}

// ---------- risco nos Encontros ----------
/** Veredito de TPK do encontro em montagem contra as fichas carregadas (PV cheios) */
function riscoDoEncontroHtml(lista) {
  const fichas = (state.fichas || []).filter(f => f.pvMax);
  if (!lista.length) return '';
  if (!fichas.length) return '<p class="pn-enc-risco">Carregue as fichas na aba Personagens para ver o TTK e o veredito de TPK.</p>';
  const ents = [];
  lista.forEach(c => {
    const m = acharMonstro(c.id);
    for (let k = 0; k < c.qtd; k++) ents.push({ id: `${c.id}-${k}`, name: m ? m.n : c.id, hp: m ? m.pv : 10, maxHp: m ? m.pv : 10, armor: m ? m.ca : 12, ref: c.id, type: 'Monster' });
  });
  const caInimiga = media(ents.map(e => e.armor)) || 13;
  const herois = fichas.map(f => perfilDoHeroi({ id: f.id, name: f.nome, hp: f.pvMax, maxHp: f.pvMax, armor: f.ca || 12, type: 'PC' }, caInimiga));
  const t = calcularTtk(herois, ents.map(perfilDoMonstro));
  return `<p class="pn-enc-risco">Com as ${fichas.length} fichas: TTK do Grupo ${rodadasTexto(t.ttkG)} · TTK dos Monstros ${rodadasTexto(t.ttkM)} →
    <strong class="pn-risco-txt-${t.veredito.id}">${t.veredito.icone} ${t.veredito.nome}</strong></p>`;
}

// ---------- eventos ----------
(function iniciarPainel() {
  const raiz = document.getElementById('content-painel');
  if (!raiz) return;
  const ativo = () => raiz.classList.contains('active');

  // Redesenha junto com o Combate, mas só quando o Painel está à vista
  const renderOriginal = renderEntities;
  let agendado = null;
  window.renderEntities = function () {
    renderOriginal.apply(this, arguments);
    if (ativo()) { clearTimeout(agendado); agendado = setTimeout(renderPainel, 60); }
  };
  document.getElementById('tab-painel').addEventListener('click', () => setTimeout(renderPainel, 0));
  document.getElementById('pnRecalcular').addEventListener('click', renderPainel);
  // O Encontros desenhou antes deste arquivo carregar: redesenha para mostrar o risco
  if (typeof renderEncontroAtual === 'function') renderEncontroAtual();

  raiz.addEventListener('click', e => {
    const aliado = e.target.closest('[data-pn-aliado]');
    if (aliado) {
      const ent = state.entities.find(x => String(x.id) === aliado.dataset.pnAliado);
      if (ent) { ent.aliado = !ent.aliado; saveData(); renderPainel(); }
      return;
    }
    if (e.target.closest('#pnLimparRegistro')) {
      if (!confirm('Apagar o registro de dano e cura?')) return;
      state.registro = []; saveData(); renderPainel();
    }
  });

  // Dica ao passar o mouse nas barras do gráfico
  raiz.addEventListener('mousemove', e => {
    const alvo = e.target.closest('[data-pn-dica]');
    const caixa = raiz.querySelector('.pn-grafico');
    const dica = caixa && caixa.querySelector('.pn-dica');
    if (!dica) return;
    if (!alvo) { dica.hidden = true; return; }
    const r = caixa.getBoundingClientRect();
    dica.textContent = alvo.dataset.pnDica;
    dica.hidden = false;
    dica.style.left = `${Math.min(r.width - 170, Math.max(0, e.clientX - r.left + 12))}px`;
    dica.style.top = `${Math.max(0, e.clientY - r.top - 36)}px`;
  });
})();
