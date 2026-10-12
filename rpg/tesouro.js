// ==================== TESOURO SUGERIDO ====================
// Sugestão de tesouro por encontro. Não é a tabela do Livro do Mestre (que não
// está no SRD): é uma regra própria do app, pensada para render algo coerente
// com a mesa e fácil de ajustar.
//
// - Moedas: cada criatura com tesouro carrega cerca de 10% do próprio XP em PO
//   (varia de metade a uma vez e meia), então o valor acompanha o perigo.
// - Objetos de valor (gemas e obras de arte): um por criatura de ND 1+ cujo
//   tema não é só "Individual", até quatro; o valor sobe com o nível do grupo.
// - Item mágico: a chance cresce com a dificuldade do encontro, a raridade
//   segue o nível do grupo e o tipo segue o tema de tesouro de quem o guardava
//   (Manual dos Monstros 2024): Arcana, Armaments, Implements, Relics ou Any.
// Os itens vêm de srd-itens.js; o tema de cada monstro, de srd-monstros.js.

const TES_TEMAS = {
  Any: 'Qualquer', Arcana: 'Arcano', Armaments: 'Armamentos', Implements: 'Implementos',
  Individual: 'Individual', Relics: 'Relíquias', None: 'Nenhum'
};
const TES_RARIDADES = {
  Common: 'Comum', Uncommon: 'Incomum', Rare: 'Raro', 'Very Rare': 'Muito Raro', Legendary: 'Lendário'
};

// Chance de item mágico pela dificuldade que o encontro atingiu
const TES_CHANCE_ITEM = { baixa: 0.15, moderada: 0.3, alta: 0.5, acima: 0.75 };

// Raridade pelo nível do grupo: [raridade, peso]
function raridadesDoNivel(nivel) {
  if (nivel <= 4) return [['Common', 2], ['Uncommon', 3]];
  if (nivel <= 10) return [['Uncommon', 3], ['Rare', 2]];
  if (nivel <= 16) return [['Rare', 3], ['Very Rare', 2]];
  return [['Very Rare', 3], ['Legendary', 2]];
}

// Objetos de valor por faixa de nível: valores em PO
function valoresDoNivel(nivel) {
  if (nivel <= 4) return [10, 25, 50];
  if (nivel <= 10) return [50, 100, 250];
  if (nivel <= 16) return [250, 750, 1000];
  return [750, 2500, 7500];
}
const TES_GEMAS = {
  10: ['Ágata', 'Hematita', 'Quartzo azul', 'Turquesa'],
  25: ['Cornalina', 'Calcedônia', 'Ônix', 'Pedra-da-lua'],
  50: ['Ametista', 'Granada', 'Jade', 'Pérola'],
  100: ['Âmbar', 'Coral', 'Turmalina', 'Espinélio'],
  250: ['Água-marinha', 'Topázio', 'Pérola negra', 'Alexandrita'],
  750: ['Esmeralda', 'Opala de fogo', 'Safira azul', 'Granada estelar'],
  1000: ['Safira estrela', 'Rubi', 'Opala negra', 'Esmeralda pura'],
  2500: ['Diamante', 'Jacinto', 'Rubi estrela', 'Safira negra'],
  7500: ['Diamante azul', 'Rubi-sangue', 'Esmeralda real', 'Pérola do abismo']
};
const TES_ARTE = {
  10: ['Cálice de prata simples', 'Dados de osso entalhados', 'Pente de marfim'],
  25: ['Estatueta de bronze', 'Espelho de mão com moldura de prata', 'Pulseira de cobre gravada'],
  50: ['Taça de prata com relevos', 'Broche de prata com pedras', 'Máscara cerimonial pintada'],
  100: ['Tapeçaria de seda bordada', 'Cálice de ouro', 'Anel de prata com selo'],
  250: ['Coroa de prata com pedras', 'Ídolo de ouro maciço', 'Colar de ouro trabalhado'],
  750: ['Cetro de ouro com gemas', 'Pintura de mestre em moldura dourada', 'Bracelete de platina'],
  1000: ['Estatueta de jade e ouro', 'Tiara cravejada', 'Relicário de ouro e esmalte'],
  2500: ['Coroa de ouro cravejada', 'Ídolo de platina com olhos de gema', 'Manto real com fios de ouro'],
  7500: ['Trono portátil de ouro e gemas', 'Coroa de um rei esquecido', 'Esfera de cristal com núcleo de platina']
};

// ---------- sorteios ----------
const tesSorteia = lista => lista[Math.floor(Math.random() * lista.length)];
function tesPeso(pares) {
  const total = pares.reduce((s, [, p]) => s + p, 0);
  let r = Math.random() * total;
  for (const [v, p] of pares) { if ((r -= p) < 0) return v; }
  return pares[pares.length - 1][0];
}

/** Temas de tesouro do monstro; quem não tem nenhum não carrega nada */
function temasDoMonstro(m) {
  if (!m) return [];
  if (m.origem === 'meus') return m.tes && m.tes.length ? m.tes : ['Individual'];
  return (m.tes || []).filter(t => t !== 'None');
}

/** Valor em PO → moedas: o grosso em PO, um pouco em PL nas somas altas e o troco em PP */
function emMoedas(valor) {
  const pl = valor >= 500 ? Math.floor(valor * 0.3 / 10) : 0;
  const resto = valor - pl * 10;
  const po = Math.floor(resto);
  const pp = Math.round((resto - po) * 10);
  return { pl, po, pp };
}

/**
 * Sorteia o tesouro de um encontro.
 * lista: [{ id, qtd }]; nivel: nível do grupo; dif: dificuldade atingida.
 */
function sortearTesouro(lista, nivel, dif) {
  let moedas = 0;
  const objetos = [];
  const temasPeso = {};
  let fontes = 0;
  const valores = valoresDoNivel(nivel);

  lista.forEach(c => {
    const m = acharMonstro(c.id);
    const temas = temasDoMonstro(m);
    if (!temas.length) return;
    for (let i = 0; i < c.qtd; i++) {
      moedas += (Number(m.xp) || 0) * 0.1 * (0.5 + Math.random());
      fontes++;
      const guardiao = temas.some(t => t !== 'Individual');
      if (guardiao && ndNumero(m.nd) >= 1 && objetos.length < 4) {
        const valor = tesSorteia(valores);
        const gema = Math.random() < 0.5;
        objetos.push({ nome: tesSorteia((gema ? TES_GEMAS : TES_ARTE)[valor]), valor, tipo: gema ? 'gema' : 'arte' });
      }
      temas.filter(t => t !== 'Individual').forEach(t => { temasPeso[t] = (temasPeso[t] || 0) + 1; });
    }
  });

  // Item mágico: só quem guarda algo além das moedas de bolso
  const itens = [];
  const temasItem = Object.entries(temasPeso);
  if (temasItem.length && Math.random() < (TES_CHANCE_ITEM[dif] || 0.3)) {
    const rar = tesPeso(raridadesDoNivel(nivel));
    const tema = tesPeso(temasItem);
    const todos = window.SRD_ITENS || [];
    const doTema = todos.filter(i => i.rar === rar && (tema === 'Any' || i.temas.includes(tema)));
    const item = tesSorteia(doTema.length ? doTema : todos.filter(i => i.rar === rar));
    if (item) itens.push({ id: item.id, n: item.n, rar: item.rar, slug: item.slug, sint: item.sint, tema });
  }

  const valorMoedas = Math.round(moedas * 10) / 10;
  return {
    moedas: emMoedas(valorMoedas),
    objetos,
    itens,
    total: Math.round(valorMoedas + objetos.reduce((s, o) => s + o.valor, 0)),
    vazio: !fontes
  };
}

// ---------- texto ----------
function moedasTexto(m) {
  return [m.pl && `${m.pl.toLocaleString('pt-BR')} PL`, m.po && `${m.po.toLocaleString('pt-BR')} PO`, m.pp && `${m.pp} PP`]
    .filter(Boolean).join(', ') || '—';
}
function linkItem(i) {
  return `https://www.aidedd.org/magic-item/${i.slug}`;
}

/** Bloco HTML do tesouro, para o encontro atual e para a tabela */
function tesouroHtml(t) {
  if (!t) return '';
  if (t.vazio) return '<p class="fichas-ajuda">Essas criaturas não carregam tesouro (feras, constructos e afins).</p>';
  const objetos = t.objetos.map(o => `<li>${o.tipo === 'gema' ? '💎' : '🏺'} ${esc(o.nome)} <span class="ficha-sub bst-inline">(${o.valor.toLocaleString('pt-BR')} PO)</span></li>`).join('');
  const itens = t.itens.map(i => `<li>✨ <a href="${linkItem(i)}" target="_blank" rel="noopener">${esc(i.n)}</a>
      <span class="ficha-sub bst-inline">(${TES_RARIDADES[i.rar] || i.rar}${i.sint ? ', exige Sintonização' : ''} · tema ${TES_TEMAS[i.tema] || i.tema})</span></li>`).join('');
  return `<ul class="tes-lista">
      <li>🪙 ${moedasTexto(t.moedas)}</li>
      ${objetos}${itens}
    </ul>
    <p class="tes-total">Valor em moedas e objetos: <strong>${t.total.toLocaleString('pt-BR')} PO</strong>${t.itens.length ? ' + item mágico' : ''}</p>`;
}

/** Linha curta para a tabela de encontros */
function tesouroResumo(t) {
  if (!t) return '—';
  if (t.vazio) return 'Nenhum';
  const partes = [`${t.total.toLocaleString('pt-BR')} PO`];
  if (t.objetos.length) partes.push(`${t.objetos.length} objeto(s) de valor`);
  t.itens.forEach(i => partes.push(`✨ <a href="${linkItem(i)}" target="_blank" rel="noopener">${esc(i.n)}</a>`));
  return partes.join(' · ');
}

/** Texto simples, para copiar para as Notas */
function tesouroTexto(t, titulo) {
  if (!t || t.vazio) return `${titulo}: sem tesouro.`;
  const linhas = [`${titulo}:`, `- Moedas: ${moedasTexto(t.moedas)}`];
  t.objetos.forEach(o => linhas.push(`- ${o.nome} (${o.valor} PO)`));
  t.itens.forEach(i => linhas.push(`- ${i.n} (${TES_RARIDADES[i.rar] || i.rar}${i.sint ? ', Sintonização' : ''})`));
  linhas.push(`Total: ${t.total} PO${t.itens.length ? ' + item mágico' : ''}`);
  return linhas.join('\n');
}
