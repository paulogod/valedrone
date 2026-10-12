// ==================== PAINEL DO COMBATE ====================
// Vida dos dois lados, dano esperado por rodada, heróis em perigo e o risco
// de TPK. O risco sai de uma simulação: o app joga o resto do combate mil
// vezes a partir dos PV atuais, com dados de verdade, e conta em quantas o
// grupo inteiro fica com 0 PV ao mesmo tempo.
//
// O que a simulação sabe: CA e PV de todos, os ataques das fichas (tabela de
// ataques do Criador) e as ações dos monstros do SRD (Multiattack, ataques e
// sopros com Recarga). O que ela não sabe: magias de área e de cura dos
// heróis, táticas, terreno e sorte do mestre. Por isso é uma estimativa.
// Depende de combate.js (lerAcao, rolarExpressao) e de bestiario.js.

const PN_SIMULACOES = 1000;
const PN_RODADAS_MAX = 30;

// ---------- dados ----------
const pnD = lados => 1 + Math.floor(Math.random() * lados);

/** "2d6+5" → { n: 2, d: 6, mod: 5 } */
function lerExpr(txt) {
  const m = String(txt || '').replace(/[−–]/g, '-').replace(/\s+/g, '').match(/(\d+)d(\d+)([+-]\d+)?/i);
  return m ? { n: +m[1], d: +m[2], mod: m[3] ? +m[3] : 0 } : null;
}
const mediaExpr = e => e ? e.n * (e.d + 1) / 2 + e.mod : 0;
function rolarExpr(e, critico) {
  if (!e) return 0;
  let t = e.mod;
  const q = e.n * (critico ? 2 : 1);
  for (let i = 0; i < q; i++) t += pnD(e.d);
  return Math.max(0, t);
}
/** Chance de acertar (o 1 sempre erra, o 20 sempre acerta) */
const chanceDeAcerto = (atk, ca) => Math.min(0.95, Math.max(0.05, (21 - (ca - atk)) / 20));

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
  return {
    id: e.id, nome: e.name, pv: Math.max(0, e.hp), pvMax: e.maxHp, ca: +e.armor || 10,
    ataque: melhor, n: melhor.truque ? 1 : n, furtivo, estimado,
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
  const t = String(desc || '');
  const rotina = [];
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
  return {
    id: e.id, nome: e.name, pv: Math.max(0, e.hp), pvMax: e.maxHp, ca: +e.armor || 10,
    rotina, aoe, estimado
  };
}

// ---------- contas rápidas (sem dados) ----------
function danoEsperadoHeroi(h, ca) {
  const p = chanceDeAcerto(h.ataque.atk, ca);
  let dano = h.n * (p * mediaExpr(h.ataque.dados) + 0.05 * h.ataque.dados.n * (h.ataque.dados.d + 1) / 2);
  if (h.furtivo) dano += (1 - Math.pow(1 - p, h.n)) * mediaExpr(h.furtivo);
  return dano;
}
function danoEsperadoMonstro(mo, ca, alvos) {
  let rotina = mo.rotina.reduce((s, a) => s + chanceDeAcerto(a.atk, ca) * a.danos.reduce((t, x) => t + mediaExpr(x), 0), 0);
  if (mo.aoe) {
    // Recarga 5–6: em média um uso a cada 3 rodadas, em até 2 alvos, metade na salvaguarda
    const freq = 1 / (1 + 6 / (7 - mo.aoe.min));
    const sopro = mo.aoe.danos.reduce((t, x) => t + mediaExpr(x), 0) * 0.75 * Math.min(2, alvos);
    rotina = rotina * (1 - freq) + sopro * freq;
  }
  return rotina;
}
/** Dano de um turno se tudo acertar (para "pode cair num turno") */
function danoMaximoDeUmTurno(mo) {
  const rotina = mo.rotina.reduce((s, a) => s + a.danos.reduce((t, x) => t + mediaExpr(x), 0), 0);
  const sopro = mo.aoe ? mo.aoe.danos.reduce((t, x) => t + mediaExpr(x), 0) : 0;
  return Math.max(rotina, sopro);
}

// ---------- simulação ----------
/**
 * Joga o combate `n` vezes. `ordem` é a fila de turnos a partir de quem joga
 * agora: [{ lado: 'h' | 'm', i }]. Heróis batem no inimigo mais ferido;
 * monstros escolhem um herói de pé ao acaso; quem cai faz testes contra a morte.
 */
function simularCombate(herois, monstros, ordem, n = PN_SIMULACOES) {
  const res = { tpk: 0, vitoria: 0, indefinido: 0, rodadas: [], caiu: herois.map(() => 0), morreu: herois.map(() => 0) };
  if (!herois.length || !monstros.length) return null;

  for (let s = 0; s < n; s++) {
    const hp = herois.map(h => h.pv);
    const ds = herois.map(h => ({ s: h.ds.s || 0, f: h.ds.f || 0 }));
    const mhp = monstros.map(m => m.pv);
    const recarga = monstros.map(() => true);
    const caiu = herois.map(() => false);
    let fim = null, rodada = 0;

    const heroisDePe = () => hp.some(v => v > 0);
    const monstrosDePe = () => mhp.some(v => v > 0);

    for (rodada = 1; rodada <= PN_RODADAS_MAX && !fim; rodada++) {
      for (const slot of ordem) {
        if (slot.lado === 'h') {
          const h = herois[slot.i];
          if (hp[slot.i] <= 0) {
            const t = ds[slot.i];
            if (t.f >= 3 || t.s >= 3) continue;
            const r = pnD(20);
            if (r === 20) { hp[slot.i] = 1; t.s = 0; t.f = 0; }
            else if (r === 1) t.f += 2;
            else if (r >= 10) t.s += 1; else t.f += 1;
            continue;
          }
          let furtivoUsado = false;
          for (let k = 0; k < h.n; k++) {
            let alvo = -1;
            mhp.forEach((v, j) => { if (v > 0 && (alvo < 0 || v < mhp[alvo])) alvo = j; });
            if (alvo < 0) break;
            const d20 = pnD(20);
            if (d20 !== 1 && (d20 === 20 || d20 + h.ataque.atk >= monstros[alvo].ca)) {
              let dano = rolarExpr(h.ataque.dados, d20 === 20);
              if (h.furtivo && !furtivoUsado) { dano += rolarExpr(h.furtivo, d20 === 20); furtivoUsado = true; }
              mhp[alvo] -= dano;
            }
          }
          if (!monstrosDePe()) { fim = 'vitoria'; break; }
        } else {
          const mo = monstros[slot.i];
          if (mhp[slot.i] <= 0) continue;
          const vivos = () => hp.map((v, j) => v > 0 ? j : -1).filter(j => j >= 0);
          if (!recarga[slot.i] && mo.aoe && pnD(6) >= mo.aoe.min) recarga[slot.i] = true;
          const ferir = (j, dano) => {
            hp[j] -= dano;
            if (hp[j] <= 0) { hp[j] = 0; caiu[j] = true; ds[j] = { s: 0, f: 0 }; }
          };
          if (mo.aoe && recarga[slot.i] && vivos().length) {
            recarga[slot.i] = false;
            vivos().sort(() => Math.random() - 0.5).slice(0, 2).forEach(j => {
              const total = mo.aoe.danos.reduce((t, x) => t + rolarExpr(x), 0);
              ferir(j, Math.random() < 0.5 ? Math.floor(total / 2) : total);
            });
          } else {
            for (const a of mo.rotina) {
              const v = vivos();
              if (!v.length) break;
              const j = v[Math.floor(Math.random() * v.length)];
              const d20 = pnD(20);
              if (d20 !== 1 && (d20 === 20 || d20 + a.atk >= herois[j].ca)) {
                ferir(j, a.danos.reduce((t, x) => t + rolarExpr(x, d20 === 20), 0));
              }
            }
          }
          if (!heroisDePe()) { fim = 'tpk'; break; }
        }
      }
    }
    if (fim === 'tpk') res.tpk++; else if (fim === 'vitoria') res.vitoria++; else res.indefinido++;
    res.rodadas.push(rodada - 1);
    caiu.forEach((c, j) => { if (c) res.caiu[j]++; });
    ds.forEach((t, j) => { if (t.f >= 3) res.morreu[j]++; });
  }
  res.rodadas.sort((a, b) => a - b);
  return {
    tpk: res.tpk / n, vitoria: res.vitoria / n, indefinido: res.indefinido / n,
    rodadas: res.rodadas[Math.floor(n / 2)],
    caiu: res.caiu.map(c => c / n), morreu: res.morreu.map(c => c / n)
  };
}

/** Faixa do risco: sempre com ícone e texto, nunca só a cor */
function faixaDeRisco(p) {
  if (p >= 0.5) return { id: 'critico', icone: '☠️', nome: 'Crítico' };
  if (p >= 0.25) return { id: 'alto', icone: '🔶', nome: 'Alto' };
  if (p >= 0.1) return { id: 'moderado', icone: '⚠️', nome: 'Moderado' };
  return { id: 'baixo', icone: '✅', nome: 'Baixo' };
}
const pct = p => `${Math.round(p * 100)}%`;
const media = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

// ---------- análise do combate atual ----------
function analisarCombate() {
  const ents = state.entities || [];
  const lado = ents.map(e => pnHeroi(e) ? 'h' : 'm');
  const inimigosVivos = ents.filter((e, k) => lado[k] === 'm' && e.hp > 0);
  const caInimiga = media(inimigosVivos.map(e => +e.armor || 10)) || 13;
  const herois = [], monstros = [], idx = [];
  ents.forEach((e, k) => {
    if (lado[k] === 'h') { idx[k] = { lado: 'h', i: herois.length }; herois.push(perfilDoHeroi(e, caInimiga)); }
    else { idx[k] = { lado: 'm', i: monstros.length }; monstros.push(perfilDoMonstro(e)); }
  });
  // Fila a partir do turno atual
  const ordem = [];
  for (let k = 0; k < ents.length; k++) ordem.push(idx[(state.currentTurn + k) % ents.length]);

  const vivosH = herois.filter(h => h.pv > 0);
  const vivosM = monstros.filter(m => m.pv > 0);
  const caHerois = media(vivosH.map(h => h.ca)) || 14;
  const dprH = vivosH.reduce((s, h) => s + danoEsperadoHeroi(h, caInimiga), 0);
  const dprM = vivosM.reduce((s, m) => s + danoEsperadoMonstro(m, caHerois, vivosH.length), 0);
  const sim = vivosH.length && vivosM.length ? simularCombate(herois, monstros, ordem) : null;
  return { herois, monstros, dprH, dprM, caHerois, caInimiga, sim };
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

function blocoDeHerois(a) {
  if (!a.herois.length) return '<p class="fichas-ajuda">Nenhum herói no combate.</p>';
  const ameacas = a.monstros.filter(m => m.pv > 0).map(m => ({ m, max: danoMaximoDeUmTurno(m) }));
  return a.herois.map((h, j) => {
    const perigo = h.pv > 0 && ameacas.filter(x => x.max >= h.pv).sort((x, y) => y.max - x.max)[0];
    const atq = h.ataque;
    return `<div class="pn-linha">
        <div class="pn-linha-topo"><strong>${esc(h.nome)}</strong><span class="ficha-sub bst-inline">CA ${h.ca}</span>
          ${a.sim ? `<span class="pn-chance" title="Chance de cair até o fim do combate">cai em ${pct(a.sim.caiu[j])}</span>` : ''}</div>
        ${barraDePv({ hp: h.pv, maxHp: h.pvMax, tmp: 0, type: 'PC', ds: h.ds }, false)}
        <p class="pn-detalhe">${h.estimado ? '⚠ sem ficha com ataques: ataque estimado (+5, 1d8+3)' :
          `${esc(atq.nome)} ${atq.atk >= 0 ? '+' : ''}${atq.atk}, ${atq.dados.n}d${atq.dados.d}${atq.dados.mod ? (atq.dados.mod > 0 ? '+' : '') + atq.dados.mod : ''}${h.n > 1 ? ` ×${h.n}` : ''}${h.furtivo ? ` + Ataque Furtivo ${h.furtivo.n}d6` : ''}`}
          · ~${Math.round(danoEsperadoHeroi(h, a.caInimiga))} de dano/rodada</p>
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
    const rodadas = a.dprH > 0 && m.pv > 0 ? Math.max(1, Math.ceil(m.pv / a.dprH)) : null;
    return `<div class="pn-linha ${m.pv <= 0 ? 'pn-fora' : ''}">
        <div class="pn-linha-topo"><strong>${esc(m.nome)}</strong><span class="ficha-sub bst-inline">CA ${m.ca}</span>
          ${e && e.type === 'NPC' ? `<button type="button" class="btn btn-secondary btn-sm" data-pn-aliado="${esc(String(m.id))}" title="Contar como aliado dos heróis">↔ aliado</button>` : ''}
          ${rodadas ? `<span class="pn-chance" title="Se o grupo focar nela">cai em ~${rodadas} rodada${rodadas > 1 ? 's' : ''}</span>` : ''}</div>
        ${barraDePv({ hp: m.pv, maxHp: m.pvMax, tmp: 0, type: 'Monster' }, false)}
        <p class="pn-detalhe">${m.estimado ? '⚠ ações estimadas pelo ND · ' : ''}${rotina ? esc(rotina) : ''}${m.aoe ? `${rotina ? ' · ' : ''}${esc(m.aoe.nome)} (Recarga ${m.aoe.min}–6, CD ${m.aoe.cd})` : ''}
          · ~${Math.round(danoEsperadoMonstro(m, a.caHerois, a.herois.filter(h => h.pv > 0).length))} de dano/rodada</p>
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
  const risco = a.sim ? faixaDeRisco(a.sim.tpk) : null;
  const rodH = a.dprM > 0 ? soma(H, 'pv') / a.dprM : null;
  const rodM = a.dprH > 0 ? soma(M, 'pv') / a.dprH : null;

  box.innerHTML = `
    <div class="card pn-lados">
      ${barraDoLado('Heróis', 'pn-cor-h', soma(H, 'pv'), soma(H, 'pvMax'), H.filter(h => h.pv > 0).length, H.length)}
      ${barraDoLado('Criaturas', 'pn-cor-m', soma(M, 'pv'), soma(M, 'pvMax'), M.filter(m => m.pv > 0).length, M.length)}
    </div>

    <div class="pn-tiles">
      <div class="pn-tile pn-risco-${risco ? risco.id : 'nenhum'}">
        <span class="pn-tile-rotulo">Risco de TPK</span>
        <strong class="pn-tile-valor">${a.sim ? pct(a.sim.tpk) : '—'}</strong>
        <span class="pn-tile-sub">${risco ? `${risco.icone} ${risco.nome}` : (H.some(h => h.pv > 0) ? 'sem inimigos de pé' : 'todos os heróis caídos')}</span>
      </div>
      <div class="pn-tile">
        <span class="pn-tile-rotulo">Vitória dos heróis</span>
        <strong class="pn-tile-valor">${a.sim ? pct(a.sim.vitoria) : '—'}</strong>
        <span class="pn-tile-sub">${a.sim && a.sim.indefinido > 0.01 ? `${pct(a.sim.indefinido)} sem fim em ${PN_RODADAS_MAX} rodadas` : `em ${PN_SIMULACOES.toLocaleString('pt-BR')} simulações`}</span>
      </div>
      <div class="pn-tile">
        <span class="pn-tile-rotulo">Rodadas até o fim</span>
        <strong class="pn-tile-valor">${a.sim ? `~${a.sim.rodadas}` : '—'}</strong>
        <span class="pn-tile-sub">mediana, a partir de agora</span>
      </div>
      <div class="pn-tile">
        <span class="pn-tile-rotulo">Dano esperado por rodada</span>
        <strong class="pn-tile-valor pn-tile-par"><span><i class="pn-marca pn-cor-h"></i>${Math.round(a.dprH)}</span><span><i class="pn-marca pn-cor-m"></i>${Math.round(a.dprM)}</span></strong>
        <span class="pn-tile-sub">heróis · criaturas${rodH && rodM ? ` — heróis caem em ~${Math.ceil(rodH)}, criaturas em ~${Math.ceil(rodM)} rodadas` : ''}</span>
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

    <p class="tes-regra">Como é calculado: a simulação joga o resto do combate ${PN_SIMULACOES.toLocaleString('pt-BR')} vezes a partir dos PV atuais, na ordem de iniciativa. Heróis usam o melhor ataque da ficha (com Ataque Extra e Ataque Furtivo) no inimigo mais ferido; monstros usam o Multiattack e os sopros com Recarga do SRD (até 2 alvos, metade do dano em metade das vezes) em heróis de pé escolhidos ao acaso. Magias de área e de cura dos heróis, táticas e terreno não entram: trate como estimativa. TPK = todos os heróis com 0 PV ao mesmo tempo.</p>`;
}

// ---------- risco nos Encontros ----------
/** Risco de TPK do encontro em montagem contra as fichas carregadas (PV cheios) */
function riscoDoEncontroHtml(lista) {
  const fichas = (state.fichas || []).filter(f => f.pvMax);
  if (!lista.length) return '';
  if (!fichas.length) return '<p class="pn-enc-risco">Carregue as fichas na aba Personagens para estimar o risco de TPK.</p>';
  const monstrosEnts = [];
  lista.forEach(c => {
    const m = acharMonstro(c.id);
    for (let k = 0; k < c.qtd; k++) monstrosEnts.push({ id: `${c.id}-${k}`, name: m ? m.n : c.id, hp: m ? m.pv : 10, maxHp: m ? m.pv : 10, armor: m ? m.ca : 12, ref: c.id, type: 'Monster' });
  });
  const caInimiga = media(monstrosEnts.map(e => e.armor)) || 13;
  const herois = fichas.map(f => perfilDoHeroi({ id: f.id, name: f.nome, hp: f.pvMax, maxHp: f.pvMax, armor: f.ca || 12, type: 'PC' }, caInimiga));
  const monstros = monstrosEnts.map(perfilDoMonstro);
  // Ordem média: iniciativa de cada um + 10
  const fila = [
    ...fichas.map((f, i) => ({ lado: 'h', i, v: (f.iniciativa || 0) + 10 + Math.random() })),
    ...monstrosEnts.map((e, i) => ({ lado: 'm', i, v: iniciativaDe(acharMonstro(e.ref) || {}) + 10 + Math.random() }))
  ].sort((x, y) => y.v - x.v);
  const sim = simularCombate(herois, monstros, fila, 400);
  if (!sim) return '';
  const r = faixaDeRisco(sim.tpk);
  return `<p class="pn-enc-risco">Risco de TPK com as ${fichas.length} fichas carregadas: <strong class="pn-risco-txt-${r.id}">${r.icone} ${pct(sim.tpk)} (${r.nome})</strong> · vitória em ${pct(sim.vitoria)}</p>`;
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
