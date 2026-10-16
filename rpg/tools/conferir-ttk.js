/*
 * Confere o veredito de TPK do Painel (TTK) em encontros do SRD.
 *
 * Roda o cálculo do próprio app (painel.js, combate.js, bestiario.js e os
 * monstros do SRD) fora do navegador, para um grupo típico de 2024
 * (Guerreiro, Clérigo, Ladino e Mago) nos níveis 1, 3, 5, 10 e 15, contra
 * encontros que gastam exatamente o orçamento de XP de cada dificuldade do
 * SRD (os 3 monstros de maior XP que cabem sozinhos, em dupla e em quarteto).
 * Mostra o TTK de cada lado e quantas vezes deu cada veredito.
 *
 * Uso (na pasta rpg):  node tools/conferir-ttk.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const NIVEIS = [1, 3, 5, 10, 15];
const DIFS = ['baixa', 'moderada', 'alta'];
const ORCAMENTO = { 1: [50, 75, 100], 3: [150, 225, 400], 5: [500, 750, 1100], 10: [1600, 2300, 3100], 15: [3300, 5400, 7800] };

const semDom = { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {},
  createElement: () => ({ style: {}, appendChild() {} }), body: { appendChild() {} } };
const contexto = { console, document: semDom, localStorage: { getItem: () => null, setItem() {} }, setTimeout: () => 0, clearTimeout() {}, alert() {}, confirm: () => true };
contexto.window = contexto;
vm.createContext(contexto);
const carregar = arq => vm.runInContext(fs.readFileSync(path.join(RAIZ, arq), 'utf8'), contexto, { filename: arq });
carregar('srd-monstros.js');
vm.runInContext(`const state = { entities: [], fichas: [] }; function esc(s) { return String(s == null ? '' : s); }
  function saveData() {} function renderEntities() {} function avisoRapido() {} this.__state = state;`, contexto);
carregar('bestiario.js');
carregar('combate.js');
carregar('painel.js');

function grupo(L) {
  const pb = L >= 17 ? 6 : L >= 13 ? 5 : L >= 9 ? 4 : L >= 5 ? 3 : 2;
  const mod = L >= 8 ? 5 : L >= 4 ? 4 : 3;
  const ficha = (id, classe, dv, ca, arma, dano, notas) => ({ id, nome: id, classe, nivel: L, ca, pvMax: dv + 2 + (L - 1) * (dv / 2 + 3),
    json: { sheet: { weaponRows: [{ name: arma, atk: `+${pb + mod}`, damage: dano, notes: notas || '' }] } } });
  return [ficha('Guerreiro', 'Guerreiro (Fighter)', 10, 18, 'Espada Longa', `1d8 +${mod}`), ficha('Clerigo', 'Clérigo (Cleric)', 8, 18, 'Maça', `1d6 +${mod}`),
    ficha('Ladino', 'Ladino (Rogue)', 8, 15, 'Rapieira', `1d8 +${mod}`), ficha('Mago', 'Mago (Wizard)', 6, 12, 'Raio de Fogo', '1d10', 'Truque')];
}
const MONSTROS = contexto.SRD_MONSTROS.filter(m => m.xp > 0 && (m.ac || []).length);
const encontros = orc => [1, 2, 4].flatMap(qtd => MONSTROS.filter(m => m.xp * qtd <= orc)
  .sort((a, b) => b.xp - a.xp || a.n.localeCompare(b.n)).slice(0, 3).map(m => ({ m, qtd })));

const fmt = t => !isFinite(t) ? '  ∞ ' : t.toFixed(1).padStart(4);
NIVEIS.forEach(L => DIFS.forEach((dif, k) => {
  const fichas = grupo(L);
  contexto.__state.fichas = fichas;
  const resultados = encontros(ORCAMENTO[L][k] * 4).map(enc => {
    const ents = Array.from({ length: enc.qtd }, (_, i) => ({ id: `${enc.m.id}-${i}`, name: enc.m.n, hp: enc.m.pv, maxHp: enc.m.pv, armor: enc.m.ca, ref: enc.m.id, type: 'Monster' }));
    const caI = ents.reduce((s, e) => s + e.armor, 0) / ents.length;
    const herois = fichas.map(f => contexto.perfilDoHeroi({ id: f.id, name: f.nome, hp: f.pvMax, maxHp: f.pvMax, armor: f.ca, type: 'PC' }, caI));
    const t = contexto.calcularTtk(herois, ents.map(contexto.perfilDoMonstro));
    return { nome: `${enc.qtd > 1 ? enc.qtd + '× ' : ''}${enc.m.n}`, ...t };
  });
  const contagem = {};
  resultados.forEach(r => { contagem[r.veredito.nome] = (contagem[r.veredito.nome] || 0) + 1; });
  const med = key => resultados.reduce((s, r) => s + (isFinite(r[key]) ? r[key] : 0), 0) / resultados.length;
  console.log(`Nv${String(L).padStart(2)} ${dif.padEnd(8)} TTK Grupo ${fmt(med('ttkG'))} · TTK Monstros ${fmt(med('ttkM'))} | ` +
    Object.entries(contagem).map(([n, q]) => `${n} ${q}`).join(' · '));
}));
