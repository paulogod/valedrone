/* ============================================================================
 * SORTEIO DA BIOGRAFIA (PASSO 6)
 * ----------------------------------------------------------------------------
 * Cada campo do Passo 6 nasce vazio e tem um dado ao lado do rótulo. Clicar no
 * dado preenche aquele campo com uma opção sorteada — nada mais é tocado, então
 * dá para sortear só o que faltou e continuar escrevendo o resto à mão.
 *
 * O valor é escrito no input e o evento "input" é disparado na sequência: quem
 * grava em character.bio e repinta a ficha continua sendo o listener do app.js.
 * ========================================================================== */

/** Faixas de idade, altura e peso por espécie (fallback = humano) */
const BIO_BODY_BY_SPECIES = {
  human:      { age: [16, 70],  height: [1.55, 1.95], weight: [55, 105] },
  elf:        { age: [80, 700], height: [1.55, 1.90], weight: [50, 80] },
  dwarf:      { age: [40, 320], height: [1.25, 1.50], weight: [60, 100] },
  halfling:   { age: [20, 140], height: [0.85, 1.05], weight: [17, 25] },
  gnome:      { age: [40, 480], height: [0.90, 1.15], weight: [18, 30] },
  dragonborn: { age: [15, 80],  height: [1.75, 2.10], weight: [90, 140] },
  tiefling:   { age: [16, 95],  height: [1.60, 1.95], weight: [55, 100] },
  orc:        { age: [14, 70],  height: [1.80, 2.15], weight: [90, 150] },
  goliath:    { age: [16, 80],  height: [2.10, 2.45], weight: [130, 190] },
  aasimar:    { age: [16, 160], height: [1.60, 1.95], weight: [55, 100] },
  half_elf:   { age: [18, 180], height: [1.60, 1.90], weight: [55, 90] },
  half_orc:   { age: [14, 75],  height: [1.75, 2.05], weight: [80, 130] }
};

const BIO_TABLES = {
  eyes: ["Castanhos", "Castanho-escuros", "Âmbar", "Mel", "Verdes", "Verde-musgo",
    "Azuis", "Azul-gelo", "Cinzentos", "Violeta", "Negros como piche", "Dourados",
    "Um de cada cor", "Avermelhados", "Cor de tempestade"],

  skin: ["Clara", "Pálida", "Rosada", "Morena clara", "Morena", "Bronzeada",
    "Oliva", "Negra retinta", "Acinzentada", "Cor de cobre", "Sardenta",
    "Marcada por cicatrizes antigas", "Coberta de tatuagens tribais", "Azulada", "Cor de argila"],

  hair: ["Castanho curto", "Castanho comprido e liso", "Preto trançado", "Preto espetado",
    "Ruivo cacheado", "Loiro comprido", "Loiro raspado nas laterais", "Grisalho",
    "Branco como neve", "Prateado preso em coque", "Careca", "Rastafári",
    "Cobre, sempre desalinhado", "Preto com mecha branca", "Trançado com fios de metal"],

  personality: [
    "Falo pouco e observo muito antes de decidir qualquer coisa.",
    "Encho todo silêncio com piadas — principalmente quando estou com medo.",
    "Anoto tudo o que vejo num caderno surrado que nunca deixo ninguém ler.",
    "Trato estranhos com uma cortesia exagerada, quase suspeita.",
    "Perco a paciência com burocracia, hierarquia e gente que fala demais.",
    "Sou incapaz de recusar um desafio, por mais idiota que seja.",
    "Falo com meus objetos e armas como se eles respondessem.",
    "Prefiro resolver na conversa; a briga é sempre o último recurso.",
    "Estou sempre calculando saídas, rotas de fuga e o preço das coisas.",
    "Repito ditados do lugar onde cresci, mesmo quando não vêm ao caso.",
    "Sou o primeiro a levantar acampamento e o último a dormir.",
    "Não confio em quem sorri fácil demais."
  ],

  ideals: [
    "Liberdade: ninguém deveria viver de joelhos por causa do que nasceu.",
    "Conhecimento: entender o mundo é a única forma honesta de mudá-lo.",
    "Honra: minha palavra vale mais do que minha vida.",
    "Poder: quem manda escreve as regras — e eu pretendo escrever as minhas.",
    "Comunidade: a gente só chega longe carregando os outros junto.",
    "Fé: existe um plano maior, e eu sou uma peça dele.",
    "Justiça: a lei falha, mas alguém precisa acertar as contas.",
    "Mudança: o que está de pé há tempo demais precisa cair.",
    "Beleza: o mundo merece uma boa história, e eu vou contá-la.",
    "Sobrevivência: idealismo é luxo de quem nunca passou fome.",
    "Redenção: todo mundo merece uma segunda chance, inclusive eu.",
    "Curiosidade: prefiro a pergunta perigosa à resposta confortável."
  ],

  bonds: [
    "Devo minha vida a alguém que desapareceu sem explicação — e vou encontrá-la.",
    "Carrego um objeto de família que não vale nada para ninguém, exceto para mim.",
    "Minha aldeia foi destruída; reconstruí-la é a dívida que me sustenta.",
    "Protejo um irmão mais novo que nem sabe do perigo que corre.",
    "Fiz um juramento diante de um altar e ainda não cumpri metade dele.",
    "Alguém do meu passado me odeia com razão, e um dia teremos essa conversa.",
    "Meu mestre me ensinou tudo e morreu antes de terminar a lição.",
    "Uma carta não entregue queima no fundo da minha bolsa há anos.",
    "Guardo o segredo de uma cidade inteira e ele me custa o sono.",
    "Um animal me salvou uma vez; desde então nunca ando sozinho.",
    "Preciso limpar o nome da minha família, custe o que custar.",
    "Meus companheiros de estrada são a única família que ainda me resta."
  ],

  flaws: [
    "Não sei recuar: se abrir a boca, vou até o fim, mesmo perdendo.",
    "Minto por reflexo, até quando a verdade seria mais fácil.",
    "Confio demais em quem me elogia.",
    "Bebo quando me lembro do que fiz — e me lembro sempre.",
    "Guardo rancor de coisas que os outros nem lembram ter feito.",
    "Sou incapaz de deixar tesouro para trás, mesmo com a masmorra desabando.",
    "Congelo quando alguém chora na minha frente.",
    "Acho que sou o mais inteligente da sala. Costumo estar errado.",
    "Fujo de qualquer conversa que envolva sentimentos.",
    "Gasto tudo o que ganho na mesma noite em que ganho.",
    "Não consigo obedecer a uma ordem sem perguntar o porquê.",
    "Tenho um medo antigo que ainda me faz acordar gritando."
  ],

  /* A história é montada em quatro pedaços: origem, virada, motivo e segredo */
  backstoryOrigin: [
    "Cresci nos becos de uma cidade portuária, entre marinheiros e contrabandistas",
    "Fui criado numa aldeia de fronteira que ninguém marca nos mapas",
    "Passei a infância numa biblioteca de templo, varrendo chão e lendo escondido",
    "Nasci numa caravana que nunca ficava mais de duas semanas no mesmo lugar",
    "Fui aprendiz numa oficina de ferreiro até o dia em que a forja apagou",
    "Cresci num acampamento militar, aprendendo a marchar antes de aprender a ler",
    "Vim de uma família rica que perdeu tudo numa única noite",
    "Fui achado ainda bebê na estrada, sem nome e sem história"
  ],
  backstoryTurn: [
    "até que uma noite tudo virou cinzas e eu fui o único a sair de pé.",
    "até cruzar com uma criatura que não deveria existir e sobreviver por sorte.",
    "até um estranho me oferecer um trato que eu não tive coragem de recusar.",
    "até descobrir que a pessoa em quem eu mais confiava me vendia havia anos.",
    "até que uma profecia mal traduzida colocou meu nome onde não devia.",
    "até o dia em que roubei a coisa errada da pessoa errada.",
    "até que a guerra chegou e não pediu licença.",
    "até encontrar um livro que ninguém deveria ter aberto."
  ],
  backstoryDrive: [
    "Desde então ando pelo mundo atrás de respostas que ninguém quer me dar.",
    "Saí em estrada porque ficar parado é o mesmo que aceitar o que aconteceu.",
    "Hoje vendo minha espada e minha coragem para quem paga — e para quem precisa.",
    "Sigo viagem tentando reparar um estrago que talvez não tenha conserto.",
    "Procuro um nome, um rosto e uma dívida antiga.",
    "Quero provar, para mim antes de todos, que aquilo não me definiu.",
    "Ando com quem me aceita, e isso já é mais do que eu tinha antes.",
    "Persigo o tipo de história que se conta em taverna depois que a gente morre."
  ],
  backstorySecret: [
    "Ninguém do grupo sabe da parte que eu deixei de fora.",
    "Guardo comigo uma prova que poderia enforcar gente poderosa.",
    "Ainda sonho com aquela noite, e nos sonhos eu faço tudo diferente.",
    "Uma parte de mim tem medo de encontrar o que procura.",
    "Escrevo cartas que nunca envio para alguém que talvez nem esteja vivo.",
    "Prometi voltar. Ainda não voltei.",
    "Se me perguntarem de onde vim, provavelmente vou mentir.",
    "Carrego um nome que não é o meu de nascença."
  ]
};

/** Sorteio simples numa lista */
function bioPick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function bioRandBetween(min, max) {
  return min + Math.random() * (max - min);
}

/** Faixas físicas da espécie escolhida (ou as humanas, se ainda não escolheu) */
function bioBody() {
  return BIO_BODY_BY_SPECIES[character.species] || BIO_BODY_BY_SPECIES.human;
}

/** Sorteia o valor de um campo da biografia */
function rollBioValue(field) {
  const body = bioBody();
  switch (field) {
    case "age": {
      const anos = Math.round(bioRandBetween(body.age[0], body.age[1]));
      return `${anos} anos`;
    }
    case "height": {
      const m = bioRandBetween(body.height[0], body.height[1]);
      return `${m.toFixed(2).replace(".", ",")} m`;
    }
    case "weight": {
      // O peso acompanha a altura sorteada, com uma variação de ±8%
      const alturaEl = document.getElementById("inputHeight");
      const alturaTxt = alturaEl ? alturaEl.value.replace(",", ".") : "";
      const altura = parseFloat(alturaTxt);
      const [minA, maxA] = body.height;
      const [minP, maxP] = body.weight;
      const t = (altura && altura >= minA && altura <= maxA)
        ? (altura - minA) / (maxA - minA || 1)
        : Math.random();
      const kg = (minP + t * (maxP - minP)) * bioRandBetween(0.92, 1.08);
      return `${Math.round(kg)} kg`;
    }
    case "backstory":
      return `${bioPick(BIO_TABLES.backstoryOrigin)}, ${bioPick(BIO_TABLES.backstoryTurn)} ` +
             `${bioPick(BIO_TABLES.backstoryDrive)} ${bioPick(BIO_TABLES.backstorySecret)}`;
    default:
      return BIO_TABLES[field] ? bioPick(BIO_TABLES[field]) : "";
  }
}

/** id do input de cada campo da bio no Passo 6 */
const BIO_FIELD_INPUT = {
  age: "inputAge", height: "inputHeight", weight: "inputWeight",
  eyes: "inputEyes", skin: "inputSkin", hair: "inputHair",
  personality: "textPersonality", ideals: "textIdeals",
  bonds: "textBonds", flaws: "textFlaws", backstory: "textBackstory"
};

/**
 * Preenche um campo com um valor sorteado. Escreve no input e dispara "input"
 * para o app.js gravar em character.bio, salvar e repintar a ficha.
 */
function rollBioField(field) {
  const el = document.getElementById(BIO_FIELD_INPUT[field]);
  if (!el) return;
  el.value = rollBioValue(field);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function initBioRandomizers() {
  document.querySelectorAll("[data-bio-roll]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      rollBioField(btn.getAttribute("data-bio-roll"));
    });
  });
}

document.addEventListener("DOMContentLoaded", initBioRandomizers);
