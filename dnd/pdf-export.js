/* ============================================================================
 * EXPORTAÇÃO PARA A FICHA OFICIAL EM PDF (AcroForm)
 * ----------------------------------------------------------------------------
 * Transfere tudo o que está na ficha do app para o PDF oficial editável
 * ("D&D 5.5 - Ficha editável.pdf"), preenchendo os campos de formulário.
 * O PDF gerado continua editável — nada é achatado.
 *
 * A fonte dos valores é a ficha renderizada (DOM) + os arrays de linhas em
 * character.sheet, ou seja: sai no PDF exatamente o que está na tela, incluindo
 * o que o jogador digitou por cima do cálculo automático.
 *
 * Os campos do PDF têm nomes gerados ("text_57zdom", "checkbox_162oonu"), então
 * o mapa abaixo usa só o NÚMERO do campo — a busca por número é feita em
 * tempo de execução, em indexPdfFields().
 * ========================================================================== */

const OFFICIAL_PDF_FILE = "D&D 5.5 - Ficha editável.pdf";
/* Onde procurar cada ficha em branco servida por http. O nome ASCII vem
   primeiro: "D&D 5.5 - Ficha editável.pdf" tem &, espaço e acento, que nem toda
   hospedagem serve direito.

   A versão leve é a mesma ficha sem as três imagens de fundo — 499 KB no lugar
   de 11,9 MB, com as legendas, as molduras e os 411 campos intactos. Ela é o
   padrão do botão Imprimir / PDF: baixa rápido e gasta muito menos tinta.
   Veja tools/gerar-ficha-leve.js. */
const OFFICIAL_PDF_URLS = ["ficha-oficial.pdf", OFFICIAL_PDF_FILE];
const LIGHT_PDF_URLS = ["ficha-oficial-leve.pdf"];
const PDF_LIB_FILE = "pdf-lib.min.js";
const FICHA_EMBED_FILE = "ficha-oficial-embed.js";
/* A versão é declarada uma única vez, no index.html (var APP_VERSION). Declarar
   um `const APP_VERSION` aqui seria redeclaração no mesmo escopo global: o
   arquivo inteiro morre com SyntaxError e nenhum botão chega a ser ligado. */
function appVersion() {
  return window.APP_VERSION || "0";
}

/* Cache da sessão: bytes do PDF em branco e promessas de carga dos scripts */
let _officialPdfBytes = null;
let _lightPdfBytes = null;
let _pdfLibPromise = null;
let _fichaEmbedPromise = null;

/* ------------------------------------------------- MAPA DE CAMPOS DO PDF */

/** Campos de texto simples: chave lógica -> número do campo no PDF */
const PDF_TEXT = {
  charName: 1, origin: 2, className: 3, species: 4, subclass: 5,
  level: 6, xp: 7, ac: 8,
  hpCurrent: 9, hpTemp: 10, hpMax: 11, hitDiceSpent: 12, hitDiceMax: 13,
  pb: 14, initiative: 21, speed: 22, size: 23, passivePerception: 24,
  weaponProfs: 55, toolProfs: 56,
  classFeatures: 118, classFeatures2: 119, speciesTraits: 120, featsText: 121,
  // Página 2
  spellAbility: 209, spellMod: 122, spellDC: 123, spellAttack: 124,
  appearance: 125, backstory: 126, alignment: 287, languages: 128, equipment: 127
};

/** Blocos de atributo: modificador, valor e a linha de salvaguarda */
const PDF_ABILITY = {
  str: { mod: 16, score: 50, saveMark: 161, saveVal: 31 },
  dex: { mod: 18, score: 52, saveMark: 163, saveVal: 33 },
  con: { mod: 20, score: 53, saveMark: 173, saveVal: 43 },
  int: { mod: 15, score: 49, saveMark: 155, saveVal: 25 },
  wis: { mod: 17, score: 51, saveMark: 167, saveVal: 37 },
  cha: { mod: 19, score: 54, saveMark: 175, saveVal: 44 }
};

/** Perícias: bolinha de proficiência + caixa do bônus */
const PDF_SKILL = {
  athletics:       { mark: 162, val: 32 },
  acrobatics:      { mark: 164, val: 34 },
  sleight_of_hand: { mark: 165, val: 35 },
  stealth:         { mark: 166, val: 36 },
  arcana:          { mark: 156, val: 26 },
  history:         { mark: 157, val: 27 },
  investigation:   { mark: 158, val: 28 },
  nature:          { mark: 159, val: 29 },
  religion:        { mark: 160, val: 30 },
  animal_handling: { mark: 168, val: 38 },
  insight:         { mark: 169, val: 39 },
  medicine:        { mark: 170, val: 40 },
  perception:      { mark: 171, val: 41 },
  survival:        { mark: 172, val: 42 },
  deception:       { mark: 176, val: 45 },
  intimidation:    { mark: 177, val: 46 },
  performance:     { mark: 178, val: 47 },
  persuasion:      { mark: 179, val: 48 }
};

/** Caixas de marcação avulsas */
const PDF_CHECK = {
  shield: 148, inspiration: 174,
  armorLight: 180, armorMedium: 181, armorHeavy: 182, armorShields: 183,
  deathSucc: [149, 150, 151],
  deathFail: [152, 153, 154],
  attune: [284, 285, 286]
};

/** Moedas e sintonização (página 2) */
const PDF_COIN = { pc: 352, pp: 353, pe: 354, po: 355, pl: 356 };
const PDF_ATTUNE = [349, 350, 351];

/** ARMAS & TRUQUES DE DANO — 6 linhas na ficha oficial */
const PDF_WEAPON_ROWS = [
  { name: 57, atk: 75, damage: 69, notes: 63 },
  { name: 58, atk: 76, damage: 70, notes: 64 },
  { name: 59, atk: 77, damage: 71, notes: 65 },
  { name: 60, atk: 78, damage: 72, notes: 66 },
  { name: 61, atk: 79, damage: 73, notes: 67 },
  { name: 62, atk: 80, damage: 74, notes: 68 }
];

/** TRUQUES & MAGIAS PREPARADAS — 30 linhas na ficha oficial */
const PDF_SPELL_ROWS = [
  { level: 318, name: 288, time: 357, range: 404, notes: 443, c: 206, r: 207, m: 208 },
  { level: 319, name: 289, time: 358, range: 405, notes: 444, c: 211, r: 212, m: 213 },
  { level: 320, name: 290, time: 359, range: 406, notes: 445, c: 216, r: 215, m: 214 },
  { level: 321, name: 291, time: 360, range: 407, notes: 446, c: 217, r: 218, m: 219 },
  { level: 322, name: 292, time: 361, range: 408, notes: 447, c: 220, r: 221, m: 222 },
  { level: 323, name: 293, time: 362, range: 409, notes: 448, c: 223, r: 224, m: 225 },
  { level: 324, name: 294, time: 364, range: 410, notes: 449, c: 228, r: 227, m: 226 },
  { level: 325, name: 295, time: 365, range: 411, notes: 450, c: 229, r: 230, m: 231 },
  { level: 326, name: 296, time: 366, range: 412, notes: 451, c: 234, r: 233, m: 232 },
  { level: 327, name: 297, time: 367, range: 413, notes: 452, c: 235, r: 236, m: 237 },
  { level: 329, name: 298, time: 368, range: 414, notes: 453, c: 238, r: 239, m: 240 },
  { level: 330, name: 299, time: 369, range: 415, notes: 454, c: 241, r: 242, m: 243 },
  { level: 331, name: 300, time: 370, range: 416, notes: 455, c: 246, r: 245, m: 244 },
  { level: 332, name: 301, time: 371, range: 417, notes: 456, c: 247, r: 403, m: 402 },
  { level: 333, name: 302, time: 372, range: 418, notes: 457, c: 248, r: 399, m: 400 },
  { level: 334, name: 303, time: 373, range: 419, notes: 458, c: 249, r: 395, m: 398 },
  { level: 335, name: 304, time: 374, range: 420, notes: 459, c: 250, r: 394, m: 397 },
  { level: 336, name: 305, time: 375, range: 421, notes: 460, c: 251, r: 393, m: 396 },
  { level: 337, name: 306, time: 376, range: 422, notes: 461, c: 252, r: 390, m: 392 },
  { level: 338, name: 307, time: 377, range: 423, notes: 462, c: 253, r: 388, m: 389 },
  { level: 339, name: 308, time: 378, range: 424, notes: 463, c: 254, r: 264, m: 265 },
  { level: 340, name: 309, time: 379, range: 425, notes: 464, c: 255, r: 266, m: 267 },
  { level: 341, name: 310, time: 380, range: 426, notes: 465, c: 256, r: 268, m: 269 },
  { level: 342, name: 311, time: 381, range: 427, notes: 466, c: 257, r: 270, m: 271 },
  { level: 343, name: 312, time: 382, range: 428, notes: 467, c: 258, r: 272, m: 273 },
  { level: 344, name: 313, time: 383, range: 429, notes: 468, c: 259, r: 274, m: 275 },
  { level: 345, name: 314, time: 384, range: 430, notes: 469, c: 260, r: 277, m: 276 },
  { level: 346, name: 315, time: 385, range: 431, notes: 470, c: 261, r: 278, m: 279 },
  { level: 347, name: 316, time: 386, range: 432, notes: 471, c: 262, r: 281, m: 280 },
  { level: 348, name: 317, time: 387, range: 433, notes: 472, c: 263, r: 282, m: 283 }
];

/** ESPAÇOS DE MAGIA — total por círculo + bolinhas de "Gastos" */
const PDF_SLOTS = {
  1: { total: 434, dots: [184, 185, 186, 187] },
  2: { total: 435, dots: [188, 189, 190] },
  3: { total: 436, dots: [191, 192, 193] },
  4: { total: 437, dots: [194, 195, 196] },
  5: { total: 438, dots: [197, 198, 199] },
  6: { total: 439, dots: [200, 201] },
  7: { total: 440, dots: [202, 203] },
  8: { total: 441, dots: [204] },
  9: { total: 442, dots: [205] }
};

/** Rótulo humano das áreas de texto, para o aviso de "não coube" */
const PDF_AREA_LABELS = {
  55: "Treino em armas", 56: "Ferramentas",
  118: "Características de classe", 119: "Características de classe (2ª coluna)",
  120: "Características raciais", 121: "Talentos",
  125: "Aparência", 126: "História e Personalidade",
  127: "Equipamento", 128: "Idiomas"
};

/* ------------------------------------------------ LEITURA DA FICHA (DOM) */

/** Valor de um campo da ficha na tela (input, textarea ou texto solto) */
function ofVal(id) {
  const el = document.getElementById(id);
  if (!el) return "";
  if (el.type === "checkbox") return el.checked ? "x" : "";
  const v = el.value !== undefined ? el.value : el.textContent;
  return (v === null || v === undefined) ? "" : String(v).trim();
}

function ofChecked(id) {
  const el = document.getElementById(id);
  return !!(el && el.checked);
}

/** Bolinha de proficiência + bônus de uma linha de salvaguarda/perícia */
function ofProfLine(selector) {
  const mark = document.querySelector(selector);
  if (!mark) return { on: false, bonus: "" };
  const row = mark.closest(".of-prof-line-item");
  const bonusEl = row ? row.querySelector(".of-prof-bonus") : null;
  return {
    on: mark.classList.contains("is-prof") || mark.classList.contains("is-expert"),
    bonus: bonusEl ? bonusEl.textContent.trim() : ""
  };
}

/** Os overrides da ficha (linhas de arma e magia moram aqui) */
function pdfSheetOv() {
  if (typeof sheetOv === "function") return sheetOv();
  return (character && character.sheet) || {};
}

function rowHasContent(r, fields) {
  return fields.some(f => String(r[f] || "").trim() !== "");
}

/**
 * Junta tudo o que vai para o PDF.
 * Devolve { texts: {nº: string}, checks: {nº: bool}, warnings: [string] }.
 */
function collectOfficialPdfPayload() {
  const texts = {};
  const checks = {};
  const warnings = [];
  const put = (num, value) => {
    if (num === undefined || num === null) return;
    const v = value === null || value === undefined ? "" : String(value);
    if (v.trim() !== "") texts[num] = v;
  };

  /* --- identidade e faixa de status (página 1) --- */
  put(PDF_TEXT.charName, ofVal("sheetCharName"));
  put(PDF_TEXT.origin, ofVal("sheetOrigin"));
  put(PDF_TEXT.className, ofVal("sheetClassName"));
  put(PDF_TEXT.species, ofVal("sheetSpecies"));
  put(PDF_TEXT.subclass, ofVal("sheetSubclass"));
  put(PDF_TEXT.level, ofVal("sheetLevel"));
  put(PDF_TEXT.xp, ofVal("sheetXP"));
  put(PDF_TEXT.ac, ofVal("sheetAC"));
  put(PDF_TEXT.hpCurrent, ofVal("sheetHpCurrent"));
  put(PDF_TEXT.hpTemp, ofVal("sheetHpTemp"));
  put(PDF_TEXT.hpMax, ofVal("sheetHpMax"));
  put(PDF_TEXT.hitDiceSpent, ofVal("sheetHitDiceSpent"));
  put(PDF_TEXT.hitDiceMax, ofVal("sheetHitDiceMax"));
  put(PDF_TEXT.pb, ofVal("sheetPB"));
  put(PDF_TEXT.initiative, ofVal("sheetInitiative"));
  put(PDF_TEXT.speed, ofVal("sheetSpeed"));
  put(PDF_TEXT.size, ofVal("sheetSize"));
  put(PDF_TEXT.passivePerception, ofVal("sheetPassivePerception"));

  checks[PDF_CHECK.shield] = ofChecked("sheetShieldCheck");
  const insp = document.getElementById("sheetInspiration");
  checks[PDF_CHECK.inspiration] = !!(insp && insp.classList.contains("is-on"));

  /* --- testes de resistência de morte --- */
  [1, 2, 3].forEach((i, idx) => {
    checks[PDF_CHECK.deathSucc[idx]] = ofChecked(`ds_succ_${i}`);
    checks[PDF_CHECK.deathFail[idx]] = ofChecked(`ds_fail_${i}`);
  });

  /* --- atributos, salvaguardas e perícias --- */
  Object.keys(PDF_ABILITY).forEach(ab => {
    const map = PDF_ABILITY[ab];
    const modEl = document.querySelector(`[data-ability-mod="${ab}"]`);
    const scoreEl = document.querySelector(`[data-ability-score="${ab}"]`);
    if (modEl) put(map.mod, modEl.value);
    if (scoreEl) put(map.score, scoreEl.value);
    const save = ofProfLine(`[data-save-mark="${ab}"]`);
    put(map.saveVal, save.bonus);
    checks[map.saveMark] = save.on;
  });

  Object.keys(PDF_SKILL).forEach(sk => {
    const map = PDF_SKILL[sk];
    const line = ofProfLine(`[data-skill-mark="${sk}"]`);
    put(map.val, line.bonus);
    checks[map.mark] = line.on;
  });

  /* --- treino de armadura, armas e ferramentas --- */
  checks[PDF_CHECK.armorLight] = ofChecked("sheetArmorLight");
  checks[PDF_CHECK.armorMedium] = ofChecked("sheetArmorMedium");
  checks[PDF_CHECK.armorHeavy] = ofChecked("sheetArmorHeavy");
  checks[PDF_CHECK.armorShields] = ofChecked("sheetArmorShields");
  put(PDF_TEXT.weaponProfs, ofVal("sheetWeaponProfs"));
  put(PDF_TEXT.toolProfs, ofVal("sheetToolProfs"));

  /* --- armas & truques de dano --- */
  const ov = pdfSheetOv();
  const weaponRows = (ov.weaponRows || []).filter(r => rowHasContent(r, ["name", "atk", "damage", "notes"]));
  weaponRows.slice(0, PDF_WEAPON_ROWS.length).forEach((r, i) => {
    const slot = PDF_WEAPON_ROWS[i];
    put(slot.name, r.name);
    put(slot.atk, r.atk);
    put(slot.damage, r.damage);
    put(slot.notes, r.notes);
  });
  if (weaponRows.length > PDF_WEAPON_ROWS.length) {
    warnings.push(`${weaponRows.length - PDF_WEAPON_ROWS.length} linha(s) de arma não couberam (a ficha oficial tem ${PDF_WEAPON_ROWS.length}).`);
  }

  /* --- características, espécie e talentos --- */
  put(PDF_TEXT.classFeatures, ofVal("sheetClassFeatures"));
  put(PDF_TEXT.classFeatures2, ofVal("sheetClassFeatures2"));
  put(PDF_TEXT.speciesTraits, ofVal("sheetSpeciesTraits"));
  put(PDF_TEXT.featsText, ofVal("sheetFeatsText"));

  /* --- página 2: conjuração --- */
  put(PDF_TEXT.spellAbility, ofVal("sheetSpellAbility"));
  put(PDF_TEXT.spellMod, ofVal("sheetSpellMod"));
  put(PDF_TEXT.spellDC, ofVal("sheetSpellDC"));
  put(PDF_TEXT.spellAttack, ofVal("sheetSpellAttack"));

  for (let lvl = 1; lvl <= 9; lvl++) {
    const slot = PDF_SLOTS[lvl];
    const totalEl = document.querySelector(`[data-slot-total="${lvl}"]`);
    const total = totalEl ? parseInt(totalEl.value, 10) || 0 : 0;
    if (total > 0) put(slot.total, total);
    const used = (character.spellSlotsExpended && character.spellSlotsExpended[lvl]) || 0;
    slot.dots.forEach((num, i) => { checks[num] = i < used; });
  }

  /* --- página 2: truques & magias preparadas --- */
  const spellRows = (ov.spellRows || []).filter(r =>
    rowHasContent(r, ["level", "name", "time", "range", "notes"]) || r.c || r.r || r.m);
  spellRows.slice(0, PDF_SPELL_ROWS.length).forEach((r, i) => {
    const slot = PDF_SPELL_ROWS[i];
    put(slot.level, r.level);
    put(slot.name, r.name);
    put(slot.time, r.time);
    put(slot.range, r.range);
    put(slot.notes, r.notes);
    checks[slot.c] = !!r.c;
    checks[slot.r] = !!r.r;
    checks[slot.m] = !!r.m;
  });
  if (spellRows.length > PDF_SPELL_ROWS.length) {
    warnings.push(`${spellRows.length - PDF_SPELL_ROWS.length} linha(s) de magia não couberam (a ficha oficial tem ${PDF_SPELL_ROWS.length}).`);
  }

  /* --- página 2: história, equipamento, idiomas e moedas --- */
  put(PDF_TEXT.appearance, ofVal("sheetAppearance"));
  put(PDF_TEXT.backstory, ofVal("sheetBackstoryDisplay"));
  put(PDF_TEXT.alignment, ofVal("sheetAlignment"));
  put(PDF_TEXT.languages, ofVal("sheetLanguages"));
  put(PDF_TEXT.equipment, ofVal("sheetEquipment"));

  [1, 2, 3].forEach((i, idx) => {
    put(PDF_ATTUNE[idx], ofVal(`sheetAttune_${i}`));
    checks[PDF_CHECK.attune[idx]] = ofChecked(`sheetAttuneChk_${i}`);
  });

  Object.keys(PDF_COIN).forEach(c => {
    const v = ofVal(`sheetCoin${c.toUpperCase()}`);
    if (v && v !== "0") put(PDF_COIN[c], v);
  });

  return { texts, checks, warnings };
}

/* --------------------------------------------------- PREENCHIMENTO DO PDF */

/**
 * A Helvetica padrão do PDF só escreve WinAnsi. Acentos passam; travessão,
 * bolinha e aspas curvas viram equivalentes ASCII para nunca quebrar o export.
 */
function pdfSafeText(str) {
  return String(str)
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/•/g, "-")
    .replace(/…/g, "...")
    .replace(/ /g, " ")
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "");
}

/** Indexa os campos do formulário pelo número no nome ("text_57zdom" -> 57) */
function indexPdfFields(form) {
  const byNum = {};
  form.getFields().forEach(f => {
    const m = f.getName().match(/_(\d+)/);
    if (m) byNum[parseInt(m[1], 10)] = f;
  });
  return byNum;
}

/* Corpo de letra das áreas de texto: começa no maior e desce até caber. */
const PDF_AREA_MAX = 6;        // acima disso o texto fica solto na caixa
const PDF_AREA_MIN = 3.5;      // abaixo disso não dá para ler impresso
const PDF_AREA_STEP = 0.25;
const PDF_LINE_FACTOR = 1.11;  // entrelinha que a pdf-lib usa ao redesenhar
const PDF_AREA_PADDING = 1.72; // margem interna do widget, em pontos

/** Em quantas linhas o texto quebra dentro de uma caixa de `maxWidth` pontos */
function pdfWrapCount(text, font, size, maxWidth) {
  let lines = 0;
  String(text).split(/\r?\n/).forEach(paragrafo => {
    lines++;
    let linha = "";
    paragrafo.split(/\s+/).filter(Boolean).forEach(palavra => {
      const tentativa = linha ? `${linha} ${palavra}` : palavra;
      if (font.widthOfTextAtSize(tentativa, size) <= maxWidth) { linha = tentativa; return; }
      if (linha) lines++;
      // palavra sozinha maior que a caixa: a pdf-lib parte no meio dela
      let sobra = font.widthOfTextAtSize(palavra, size);
      while (sobra > maxWidth) { lines++; sobra -= maxWidth; }
      linha = palavra;
    });
  });
  return lines;
}

/**
 * Maior corpo de letra em que o texto inteiro cabe na área.
 *
 * Antes as áreas iam num 6 fixo: a caixa de História e Personalidade tem 169 x
 * 132 pontos, ou seja 19 linhas, e tudo o que passava disso era recortado sem
 * avisar — o jogador com uma história mais comprida via o texto sumir. Agora a
 * letra encolhe até caber, e só avisa quando nem no menor tamanho coube.
 */
function pdfAreaFontSize(field, text, font) {
  const widget = field.acroField.getWidgets()[0];
  if (!widget) return { size: PDF_AREA_MAX, coube: true };
  const { width, height } = widget.getRectangle();
  const larguraUtil = width - PDF_AREA_PADDING * 2;
  const alturaUtil = height - PDF_AREA_PADDING * 2;
  for (let size = PDF_AREA_MAX; size >= PDF_AREA_MIN; size -= PDF_AREA_STEP) {
    const linhas = pdfWrapCount(text, font, size, larguraUtil);
    if (linhas * size * PDF_LINE_FACTOR <= alturaUtil) return { size, coube: true };
  }
  return { size: PDF_AREA_MIN, coube: false };
}

/**
 * O corpo de letra vai no campo E na DA de cada widget. O campo é o que a
 * pdf-lib usa ao redesenhar (com 0 ela mesma calcula quanto cabe); a DA é o que
 * o Acrobat usa se o jogador editar o campo depois, já que a ficha continua
 * editável. /Helv é o nome que existe no DR do formulário — apontar para
 * qualquer outro deixa o campo sem fonte na hora da edição.
 */
function setPdfFieldFontSize(field, size) {
  try { field.setFontSize(size); } catch (err) { /* campo sem DA própria */ }
  field.acroField.getWidgets().forEach(widget => {
    if (typeof widget.setDefaultAppearance === "function") {
      widget.setDefaultAppearance(`/Helv ${size} Tf 0 g`);
    }
  });
}

/**
 * Redesenha o visto de uma caixa marcada para ele ocupar a caixa inteira.
 *
 * A ficha da Wizards desenha o visto com a ZapfDingbats em corpo 10 dentro de
 * um recorte de 3 x 3 pontos, numa caixinha de 5 x 5: sobra um tracinho no
 * canto, e no papel quase não dá para dizer se a caixa está marcada — era o que
 * acontecia com as colunas C / R / M das magias. Aqui a aparência "ligada" vira
 * um visto vetorial que preenche a caixa, mantendo a moldura original.
 *
 * A mesma aparência serve às duas entradas (/N e /D) porque a ficha aponta as
 * duas para o mesmo dicionário.
 */
function drawBoldCheck(pdfDoc, field) {
  field.acroField.getWidgets().forEach(widget => {
    const aparencias = widget.getAppearances();
    const normal = aparencias && aparencias.normal;
    if (!normal || typeof normal.keys !== "function") return;  // aparência única, sem estados
    const ligado = normal.keys().find(k => String(k) !== "/Off");
    if (!ligado) return;

    const { width, height } = widget.getRectangle();
    if (!(width > 0 && height > 0)) return;
    const traco = Math.max(0.7, Math.min(width, height) * 0.22);
    const ops = [
      "0.4 0.4 0.4 RG 0.72 w",
      `0.5 0.5 ${(width - 1).toFixed(2)} ${(height - 1).toFixed(2)} re S`,
      `0 0 0 RG ${traco.toFixed(2)} w 1 J 1 j`,
      `${(width * 0.20).toFixed(2)} ${(height * 0.52).toFixed(2)} m`,
      `${(width * 0.42).toFixed(2)} ${(height * 0.26).toFixed(2)} l`,
      `${(width * 0.82).toFixed(2)} ${(height * 0.76).toFixed(2)} l S`
    ].join("\n");

    // Sem compactar: são 84 bytes por caixa, e assim dá para ler a aparência
    // direto no arquivo quando algo sai errado.
    const stream = pdfDoc.context.stream(ops, {
      Type: "XObject", Subtype: "Form",
      BBox: [0, 0, width, height], Matrix: [1, 0, 0, 1, 0, 0]
    });
    normal.set(ligado, pdfDoc.context.register(stream));
  });
}

/** Preenche o formulário e devolve os bytes do PDF resultante */
async function fillOfficialPdf(srcBytes, payload) {
  const { PDFDocument, StandardFonts } = window.PDFLib;
  const pdfDoc = await PDFDocument.load(srcBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const byNum = indexPdfFields(form);
  // Sem customName de propósito: a pdf-lib usa esse nome como /BaseFont, e um
  // BaseFont que não é uma das 14 fontes padrão nem traz FontDescriptor faz o
  // Acrobat reclamar ("a fonte contém /BBox inválida"). Com Helvetica pura, o
  // updateFieldAppearances() abaixo ainda troca o /Helv do DR do formulário
  // pela fonte que ele mede, então o texto não sai cortado.
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  let filled = 0;
  const missing = [];
  const overflow = [];
  const marcadas = [];

  Object.keys(payload.texts).forEach(num => {
    const field = byNum[num];
    if (!field || typeof field.setText !== "function") { missing.push(num); return; }
    try {
      const texto = pdfSafeText(payload.texts[num]);
      field.setText(texto);
      // Área de texto: a letra encolhe até o texto inteiro caber na caixa.
      // Campo de uma linha: 0 = automático, a única forma de o nome da magia ou
      // da arma não sair cortado na caixa estreita da ficha oficial.
      if (field.getName().startsWith("textarea")) {
        const { size, coube } = pdfAreaFontSize(field, texto, helvetica);
        setPdfFieldFontSize(field, size);
        if (!coube) overflow.push(PDF_AREA_LABELS[num] || field.getName());
      } else {
        setPdfFieldFontSize(field, 0);
      }
      filled++;
    } catch (err) {
      console.warn("Campo de texto não preenchido:", num, err);
    }
  });

  Object.keys(payload.checks).forEach(num => {
    const field = byNum[num];
    if (!field || typeof field.check !== "function") { missing.push(num); return; }
    try {
      if (payload.checks[num]) { field.check(); marcadas.push(field); filled++; }
      else { field.uncheck(); }
    } catch (err) {
      console.warn("Caixa de marcação não preenchida:", num, err);
    }
  });

  if (missing.length) console.warn("Campos não encontrados no PDF:", missing.join(", "));

  form.updateFieldAppearances(helvetica);

  // Depois do updateFieldAppearances de propósito: marcar a caixa a deixa
  // "suja" e a pdf-lib redesenharia por cima do visto vetorial.
  marcadas.forEach(field => {
    try { drawBoldCheck(pdfDoc, field); }
    catch (err) { console.warn("Visto não redesenhado:", field.getName(), err); }
  });

  return { bytes: await pdfDoc.save(), filled, overflow };
}

/* --------------------------------------------- CARGA DA pdf-lib E DO PDF */

/**
 * O GitHub Pages serve estes arquivos com max-age=600, então sem o ?v= o
 * navegador fica até 10 minutos rodando a versão anterior depois de uma
 * publicação. Em file:// a query não entra: alguns navegadores a tratam como
 * parte do nome do arquivo e não acham nada.
 */
function versionado(src) {
  const porHttp = location.protocol === "http:" || location.protocol === "https:";
  return porHttp ? `${src}?v=${appVersion()}` : src;
}

/** Carrega um script uma única vez, sob demanda, e resolve quando ele terminar */
function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = versionado(src);
    tag.onload = () => resolve();
    tag.onerror = () => reject(new Error(`não foi possível carregar ${src}`));
    document.head.appendChild(tag);
  });
}

/** Carrega a pdf-lib do arquivo local, uma única vez, e só quando é usada */
function loadPdfLibrary() {
  if (window.PDFLib) return Promise.resolve(window.PDFLib);
  if (!_pdfLibPromise) {
    _pdfLibPromise = loadScriptOnce(PDF_LIB_FILE).then(() => {
      if (!window.PDFLib) throw new Error("pdf-lib carregou sem expor PDFLib");
      return window.PDFLib;
    });
  }
  return _pdfLibPromise;
}

/**
 * Ficha oficial em branco embutida no app (Base64, em ficha-oficial-embed.js).
 * É o caminho normal: funciona em file:// e dispensa o jogador importar o PDF.
 * O script tem ~16 MB, então só é carregado na primeira exportação.
 */
function loadEmbeddedFicha() {
  if (window.FICHA_OFICIAL_B64) return Promise.resolve(window.FICHA_OFICIAL_B64);
  if (!_fichaEmbedPromise) {
    _fichaEmbedPromise = loadScriptOnce(FICHA_EMBED_FILE).then(() => {
      if (!window.FICHA_OFICIAL_B64) throw new Error("ficha embutida carregou vazia");
      return window.FICHA_OFICIAL_B64;
    });
  }
  return _fichaEmbedPromise;
}

/** Base64 -> Uint8Array (byte a byte: String.fromCharCode.apply estoura com 16 MB) */
function base64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Abre o seletor de arquivo e devolve os bytes do PDF escolhido */
function pickOfficialPdf() {
  return new Promise((resolve, reject) => {
    const input = document.getElementById("inputOfficialPdf");
    if (!input) { reject(new Error("seletor de PDF ausente")); return; }
    input.value = "";
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) { reject(new Error("nenhum arquivo escolhido")); return; }
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result));
      reader.onerror = () => reject(new Error("falha ao ler o PDF"));
      reader.readAsArrayBuffer(file);
    };
    input.click();
  });
}

/**
 * Bytes de uma ficha em branco. A ordem importa para o peso da página:
 *
 *   1. fetch do arquivo ao lado do app — servido por http, é o caminho normal e
 *      não custa nada a quem nunca exporta;
 *   2. a cópia embutida em ficha-oficial-embed.js (~16 MB) — só entra quando o
 *      fetch é bloqueado, ou seja, abrindo o index.html por file://;
 *   3. o seletor de arquivo, se as duas falharem.
 *
 * O resultado fica em cache pela sessão, um cache por versão.
 */
async function fetchFirstAvailable(urls) {
  for (const url of urls) {
    try {
      const resp = await fetch(encodeURI(url));
      if (resp.ok) return new Uint8Array(await resp.arrayBuffer());
    } catch (err) {
      /* file:// bloqueia fetch — quem chama decide o que fazer */
    }
  }
  return null;
}

/** Ficha leve: sem as imagens de fundo, 499 KB. Cai para a oficial se faltar. */
async function getLightPdfBytes() {
  if (_lightPdfBytes) return _lightPdfBytes;
  const bytes = await fetchFirstAvailable(LIGHT_PDF_URLS);
  if (bytes) { _lightPdfBytes = bytes; return _lightPdfBytes; }
  return getOfficialPdfBytes(false);
}

/** Ficha oficial completa, com o pergaminho. */
async function getOfficialPdfBytes(forcePick) {
  if (_officialPdfBytes && !forcePick) return _officialPdfBytes;
  if (!forcePick) {
    const bytes = await fetchFirstAvailable(OFFICIAL_PDF_URLS);
    if (bytes) { _officialPdfBytes = bytes; return _officialPdfBytes; }
    try {
      _officialPdfBytes = base64ToBytes(await loadEmbeddedFicha());
      return _officialPdfBytes;
    } catch (err) {
      console.warn("Ficha embutida indisponível:", err);
    }
    showPdfToast(`📄 Selecione o arquivo "${OFFICIAL_PDF_FILE}".`);
  }
  _officialPdfBytes = await pickOfficialPdf();
  return _officialPdfBytes;
}

/* ------------------------------------------------------------------ AÇÃO */

function showPdfToast(msg) {
  if (typeof showToast === "function") showToast(msg);
  else console.log(msg);
}

function downloadPdfBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Nome do arquivo de saída, a partir do nome do personagem */
function officialPdfFilename(mode) {
  const name = (ofVal("sheetCharName") || character.name || "Personagem")
    .replace(/[\\/:*?"<>|]/g, "")
    .trim() || "Personagem";
  return `Ficha D&D 5.5 - ${name}${mode === "print" ? " (leve)" : ""}.pdf`;
}

/**
 * Baixa os bytes como arquivo, com o nome do personagem.
 *
 * Os dois botões terminam aqui. Já tentei três formas de mandar direto para a
 * impressora — <iframe> escondido, aba com print() automático e aba sem
 * print() — e nenhuma imprimiu a ficha: o Chrome ignora o print() de PDF em
 * silêncio ou imprime antes de o visualizador montar os quase 12 MB, saindo uma
 * folha só com o cabeçalho do navegador. Baixar o arquivo e imprimir por ele é
 * o caminho que funciona, e é o que o jogador pediu de volta.
 */
/**
 * Fluxo completo: carrega a lib, pega a ficha oficial em branco, preenche com
 * o que está na tela e entrega — baixando o arquivo ("download") ou abrindo a
 * caixa de impressão do navegador ("print"), de onde dá para salvar em PDF.
 */
async function exportToOfficialPdf(forcePick, mode) {
  const btnId = mode === "print" ? "btnPrintSheet" : "btnExportOfficialPdf";
  const btn = document.getElementById(btnId);
  const originalHtml = btn ? btn.innerHTML : "";
  try {
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gerando...'; }
    // Em paralelo: a ficha em branco tem quase 12 MB e a pdf-lib mais 500 KB.
    // Em série, um esperava o outro sem precisar.
    // "print" usa a ficha leve (499 KB, sem o pergaminho); "download" usa a
    // oficial completa. Em paralelo com a pdf-lib: em série, um esperava o
    // outro sem precisar.
    const [, srcBytes] = await Promise.all([
      loadPdfLibrary(),
      mode === "print" && !forcePick ? getLightPdfBytes() : getOfficialPdfBytes(forcePick)
    ]);
    const payload = collectOfficialPdfPayload();
    const { bytes, filled, overflow } = await fillOfficialPdf(srcBytes, payload);
    const filename = officialPdfFilename(mode);
    downloadPdfBytes(bytes, filename);
    showPdfToast(`📄 Ficha salva como "${filename}" — ${filled} campos preenchidos.`);
    if (mode === "print") showPdfToast("🖨️ Versão leve, sem o fundo decorativo: abra o arquivo e imprima por ele.");
    payload.warnings.forEach(w => showPdfToast(`⚠️ ${w}`));
    if (overflow && overflow.length) {
      showPdfToast(`⚠️ Texto demais para a caixa da ficha oficial, o fim foi cortado: ${overflow.join(", ")}.`);
    }
  } catch (err) {
    console.error("Falha ao exportar para o PDF oficial:", err);
    showPdfToast(`⚠️ Não deu para gerar o PDF: ${err.message}`);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
  }
}

/**
 * Baixa a ficha em branco e a pdf-lib assim que o navegador fica ocioso.
 *
 * São quase 12,5 MB somados. Buscando só no clique, o jogador esperava tudo
 * isso de uma vez com a tela parada; buscando antes, o clique aproveita o que
 * já está em memória. Só vale por http — em file:// a ficha vem do arquivo
 * embutido, que é grande e não faz sentido carregar sem necessidade.
 */
function prefetchPdfResources() {
  const porHttp = location.protocol === "http:" || location.protocol === "https:";
  if (!porHttp) return;   // em file:// a ficha vem do arquivo embutido de 16 MB
  const ocioso = window.requestIdleCallback || ((fn) => setTimeout(fn, 3000));
  ocioso(() => {
    loadPdfLibrary().catch(() => { /* tenta de novo no clique */ });
    // só a leve: baixar 11,9 MB por antecipação, para quem talvez nem exporte,
    // custaria mais do que economiza.
    getLightPdfBytes().catch(() => { /* idem */ });
  });
}

function initOfficialPdfExport() {
  const btnDownload = document.getElementById("btnExportOfficialPdf");
  if (btnDownload) {
    // Clique normal usa a ficha embutida; com Shift escolhe outro arquivo.
    btnDownload.addEventListener("click", (e) => exportToOfficialPdf(e.shiftKey, "download"));
  }
  // "Imprimir / PDF" também sai na ficha oficial: nada de importar o PDF nem de
  // imprimir o HTML da tela.
  const btnPrint = document.getElementById("btnPrintSheet");
  if (btnPrint) {
    btnPrint.addEventListener("click", (e) => exportToOfficialPdf(e.shiftKey, "print"));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initOfficialPdfExport();
  prefetchPdfResources();
});
