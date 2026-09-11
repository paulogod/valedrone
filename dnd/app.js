/**
 * D&D 5.5 (2024) Character Creator & Sheet Engine
 * Vale Drone RPG • Baseado no Livro do Jogador Oficial (2024)
 * Suporte a Ficha 100% Editável, Itens Customizados, Multiclasse, Grimório Completo e Rolador de Dados
 */

// Estado Global do Personagem
let character = createBlankCharacter();

/**
 * Estado inicial: ficha em branco. Nada de personagem de exemplo — todos os
 * campos começam vazios e o jogador preenche do zero. As únicas exceções são
 * estruturais: nível 1, modo de atributos (compra por pontos, que começa com
 * 8 em tudo) e os contadores zerados.
 */
function createBlankCharacter() {
  return {
    id: "char_" + Date.now(),
    schemaVersion: 2,
    appMode: "wizard", // 'wizard' ou 'sheet'
    name: "",
    playerName: "",
    class1: "none",
    level1: 1,
    class2: "none",
    level2: 1,
    species: "none",
    lineage: "none",

    // Talento de Origem extra do traço Versátil do Humano. Fica em campo
    // próprio porque não vem do antecedente: o Humano acumula os dois.
    humanOriginFeat: "none",

    // Talentos de Origem avulsos, adicionados à mão. Nem toda origem de
    // talento cabe nas duas regras acima: variantes de mesa, prêmios de
    // aventura e o Mestre que simplesmente concede um. Lista, e não campo
    // único, porque não há limite fixo para quantos podem vir.
    extraOriginFeats: [],
    background: "none",

    // Classe e espécie personalizadas: só nome e um texto livre. O jogador que
    // usa material caseiro escreve aqui o que a mesa combinou; o app não tenta
    // adivinhar mecânica nenhuma a partir disso.
    // Classe personalizada: o que a mesa combinou, nos mesmos termos que o app
    // já entende — dado de vida vira PV, habilidades entram na ficha no nível
    // em que forem ganhas e o tipo de conjurador puxa a tabela oficial de
    // espaços de magia. `spellLists` diz de quais listas ela tira magias.
    customClass1: { name: "", about: "", hitDie: 8, casterType: "none", casterAbility: "cha", spellLists: [], features: [] },
    customClass2: { name: "", about: "", hitDie: 8, casterType: "none", casterAbility: "cha", spellLists: [], features: [] },
    customSpecies: {
      name: "", about: "", size: "Médio", speed: 9, darkvision: 0,
      languages: "", weaponProfs: "", toolProfs: "", traits: []
    },
    alignment: "",
    xp: "",
    heroicInspiration: false,

    // Idiomas
    languages: [],
    customLanguages: "",

    // Magias que um talento, o antecedente ou a espécie deixam conjurar uma vez
    // por Descanso Longo sem gastar espaço. Guarda só o que já foi usado.
    freeCasts: {},

    // Antecedente Customizado
    customBg: {
      name: "",
      feat: "magic_initiate_wizard",
      skill1: "arcana",
      skill2: "history",
      tool: "calligrapher_supplies",
      toolCustom: "",
      bonusMode: "+2/+1",
      bonusPrimary: "int",
      bonusSecondary: "con",
      bonusTertiary: "wis"
    },

    // Atributos
    abilityMode: "pointbuy", // 'pointbuy', 'standard', 'roll', 'manual'
    baseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },

    // Como contar os Pontos de Vida dos níveis a partir do 2º:
    //   "average" — metade do dado + 1, o padrão do Livro do Jogador
    //   "max"     — dado cheio a cada nível (mesas que jogam com vida completa)
    //   "manual"  — o jogador digita o que rolou em cada nível
    // O 1º nível é sempre o dado cheio nas três: isso é regra, não opção.
    hpMode: "average",
    hpRolls: {},
    backgroundBonusMode: "+2/+1",
    backgroundBonuses: { primary: "none", secondary: "none", tertiary: "none" },

    // Subclasses & Talentos
    subclass1: "none",
    subclass2: "none",
    trainedSkills: [],
    expertSkills: [],
    selectedFeats: [],
    customFeats: [],
    // Marca de que os talentos personalizados desta ficha já foram passados
    // para a lista de escolhidos (ver mergeIntoBlankCharacter)
    customFeatsMigrados: true,
    customFeatures: [],

    // Escolhas exigidas por cada talento (atributo +1, magias, perícias, opções)
    featChoices: {},

    // Overrides da ficha oficial editável (campos digitados à mão pelo jogador)
    sheet: {},

    // Magias Conhecidas / Preparadas
    spellsKnown: [],
    spellSlotsExpended: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },

    // Armas cuja propriedade de maestria está ativa (ids). A maestria não é
    // automática: a classe define quantas o personagem consegue manter.
    activeMasteries: [],

    // Equipamentos, Armaduras & Itens Customizados
    equippedArmor: "none",
    equippedShield: "none",
    weapons: [],
    customItems: [],

    // Magias de regra da casa: mesmos campos das oficiais, guardadas na ficha
    // (não no catálogo) e reinjetadas em DND5E_DATA.spells a cada carga.
    customSpells: [],
    customAttacks: [],
    inventory: "",
    coins: { po: 0, pp: 0, pe: 0, pc: 0, pl: 0 },

    // Vitals de Combate
    currentHp: 0,
    tempHp: 0,
    // Dados de Vida já gastos, por tipo de dado ("d10": 2). Guardado assim
    // porque o multiclasse mistura dados diferentes e cada um se gasta e se
    // recupera por conta.
    hitDiceSpent: {},
    // Condições ativas: ids das que estão marcadas. A Exaustão é a única com
    // níveis, guardada à parte porque vai de 1 a 6.
    conditions: [],
    exhaustionLevel: 0,

    // Usos gastos de característica, por id ("fighter_uses": 1)
    featureUses: {},

    // Últimos acontecimentos de vida (dano, cura, temporários, descansos).
    // Serve para reconstruir o que houve na sessão — "levei 12, curei 7" é o
    // que se esquece primeiro quando a mesa acelera.
    hpLog: [],
    deathSaves: { succ1: false, succ2: false, succ3: false, fail1: false, fail2: false, fail3: false },

    // Biografia & Interpretação (em branco; o dado de cada campo sorteia)
    bio: {
      age: "", height: "", weight: "", eyes: "", skin: "", hair: "",
      personality: "", ideals: "", bonds: "", flaws: "", backstory: ""
    }
  };
}

/* ---------------------------------------------------------------------------
 * FICHA EM BRANCO
 * Enquanto o jogador não escolhe classe, espécie e antecedente, não existe nada
 * a calcular. Os três objetos abaixo entram no lugar dos dados do `data.js` e
 * fazem todo o cálculo rodar sem quebrar, com resultado vazio.
 * ------------------------------------------------------------------------- */

const EMPTY_CLASS = {
  id: "none", name: "", hitDie: 0, primaryAbility: [], savingThrows: [],
  armorProficiencies: [], weaponProficiencies: [], toolProficiencies: [],
  skillChoices: { count: 0, list: [] }, spellcasting: null,
  subclassLevel: 3, asiLevels: [], featuresByLevel: {}, subclasses: []
};

const EMPTY_SPECIES = {
  id: "none", name: "", speed: 0, size: "", darkvision: 0, traits: [], lineages: []
};

const EMPTY_BACKGROUND = {
  id: "none", name: "", abilityOptions: [], feat: null, featName: "",
  skills: [], tools: [], equipmentDesc: "", startingGold: 0, isCustom: false
};

/** Nada escolhido ainda: a ficha inteira fica vazia, pronta para preencher */
function isBlankSheet() {
  return character.class1 === "none" &&
         character.species === "none" &&
         character.background === "none";
}

/* Ligado por recalculateCharacter(); lido por syncOfField/syncOfCheck */
let _ofBlank = true;

/* Modificadores finais da última conta, para o painel de jogo reaproveitar */
let _ultimosMods = {};

// Inicialização ao carregar o DOM
document.addEventListener("DOMContentLoaded", () => {
  initUI();
  bindEvents();
  refreshSessionRestoreButton();
  syncWizardControls();
  populateDropdowns();
  recalculateCharacter();
  fitSheetToViewport();
  requestAnimationFrame(fitSheetToViewport);
  window.addEventListener("resize", fitSheetToViewport);
  window.addEventListener("orientationchange", () => setTimeout(fitSheetToViewport, 150));
});

/* Classe e espécie "Personalizada" existem como entradas de verdade nas listas
   do jogo, sem mecânica alguma: assim todo `find(...)` espalhado pelo app acha
   o objeto e segue reto, em vez de precisar de um caso especial em cada conta.
   O nome e o texto que o jogador digita entram na hora de exibir, via
   resolveClassObj()/resolveSpeciesObj(), porque as duas classes (primária e
   multiclasse) compartilham a mesma entrada da lista. */
const CUSTOM_CLASS_ENTRY = {
  id: "custom", name: "⭐ Personalizada (Custom)", isCustom: true,
  hitDie: 8, primaryAbility: [], savingThrows: [],
  armorProficiencies: [], weaponProficiencies: [], toolProficiencies: [],
  skillChoices: { count: 0, list: [] }, spellcasting: null,
  subclassLevel: 99, asiLevels: [], featuresByLevel: {}, subclasses: []
};
const CUSTOM_SPECIES_ENTRY = {
  id: "custom", name: "⭐ Personalizada (Custom)", isCustom: true,
  speed: 9, size: "Médio", darkvision: 0, traits: [], lineages: []
};

function registerCustomOrigins() {
  if (!DND5E_DATA.classes.some(c => c.id === "custom")) DND5E_DATA.classes.unshift(CUSTOM_CLASS_ENTRY);
  if (!DND5E_DATA.species.some(s => s.id === "custom")) DND5E_DATA.species.unshift(CUSTOM_SPECIES_ENTRY);
}

/** Estado da classe personalizada de um slot (1 = primária, 2 = multiclasse) */
function customClassState(slot) {
  return (slot === 2 ? character.customClass2 : character.customClass1) || {};
}

/* As tabelas de truques e magias preparadas do conjurador personalizado são as
   oficiais: em vez de inventar números, empresta as da primeira classe do livro
   que conjura daquele mesmo jeito (completo, meio ou pacto). */
function tabelaOficialDeConjuracao(tipo) {
  const modelo = DND5E_DATA.classes.find(c => !c.isCustom && c.spellcasting && c.spellcasting.type === tipo);
  return modelo ? modelo.spellcasting : null;
}

/** Objeto de classe já com tudo o que o jogador preencheu no painel (slot 1 ou 2) */
function resolveClassObj(id, slot) {
  const base = DND5E_DATA.classes.find(c => c.id === id);
  if (!base || !base.isCustom) return base;
  const st = customClassState(slot);

  const featuresByLevel = {};
  (st.features || []).forEach(f => {
    const nivel = Math.min(20, Math.max(1, parseInt(f.level, 10) || 1));
    const texto = [f.name, f.desc].filter(t => (t || "").trim()).join(": ");
    if (!texto) return;
    if (!featuresByLevel[nivel]) featuresByLevel[nivel] = [];
    featuresByLevel[nivel].push(texto);
  });

  let spellcasting = null;
  if (st.casterType && st.casterType !== "none") {
    const modelo = tabelaOficialDeConjuracao(st.casterType);
    spellcasting = {
      type: st.casterType,
      ability: st.casterAbility || "cha",
      cantripsKnown: (modelo && modelo.cantripsKnown) || {},
      preparedSpells: (modelo && modelo.preparedSpells) || {}
    };
  }

  return {
    ...base,
    name: (st.name || "").trim() || "Classe Personalizada",
    about: (st.about || "").trim(),
    hitDie: parseInt(st.hitDie, 10) || 8,
    spellLists: st.spellLists || [],
    featuresByLevel,
    spellcasting
  };
}

/** Idem para a espécie: traços por nível, visão no escuro, idiomas, proficiências */
function resolveSpeciesObj(id) {
  const base = DND5E_DATA.species.find(s => s.id === id);
  if (!base || !base.isCustom) return base;
  const st = character.customSpecies || {};

  const darkvision = parseInt(st.darkvision, 10) || 0;
  const traits = [];
  if (darkvision > 0) {
    traits.push({ name: "Visão no Escuro", desc: `${darkvision} metros.`, level: 1 });
  }
  (st.traits || []).forEach(t => {
    const nome = (t.name || "").trim();
    const desc = (t.desc || "").trim();
    if (!nome && !desc) return;
    traits.push({ name: nome || "Traço", desc, level: Math.min(20, Math.max(1, parseInt(t.level, 10) || 1)) });
  });

  const listaDeTexto = (txt) => String(txt || "").split(",").map(x => x.trim()).filter(Boolean);

  return {
    ...base,
    name: (st.name || "").trim() || "Espécie Personalizada",
    about: (st.about || "").trim(),
    size: st.size || "Médio",
    speed: parseFloat(st.speed) || 9,
    darkvision,
    traits,
    languages: listaDeTexto(st.languages),
    weaponProficiencies: listaDeTexto(st.weaponProfs),
    armorProficiencies: listaDeTexto(st.weaponProfs),
    toolProficiencies: listaDeTexto(st.toolProfs)
  };
}

/** Só os traços da espécie que o personagem já alcançou pelo nível total */
function traitsDaEspecieNoNivel(speciesObj, nivelTotal) {
  return (speciesObj.traits || []).filter(t => !t.level || t.level <= nivelTotal);
}

/**
 * Inicializa a interface e preenche os seletores básicos
 */
function initUI() {
  registerCustomOrigins();
  // Preencher seletores de Classes
  const selectClass1 = document.getElementById("selectClass1");
  const selectMulticlass = document.getElementById("selectMulticlass");
  
  selectClass1.innerHTML = '<option value="none">— Selecione a Classe —</option>';
  selectMulticlass.innerHTML = '<option value="none">Nenhuma (Classe Pura)</option>';
  
  DND5E_DATA.classes.forEach(cls => {
    const opt1 = document.createElement("option");
    opt1.value = cls.id;
    opt1.textContent = cls.name;
    selectClass1.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = cls.id;
    opt2.textContent = cls.name;
    selectMulticlass.appendChild(opt2);
  });

  // Preencher níveis (1 a 20)
  const selectLevel1 = document.getElementById("selectLevel1");
  const selectLevel2 = document.getElementById("selectLevel2");
  selectLevel1.innerHTML = "";
  selectLevel2.innerHTML = "";

  for (let i = 1; i <= 20; i++) {
    const optLvl1 = document.createElement("option");
    optLvl1.value = i;
    optLvl1.textContent = `Nível ${i}`;
    selectLevel1.appendChild(optLvl1);

    const optLvl2 = document.createElement("option");
    optLvl2.value = i;
    optLvl2.textContent = `Nível ${i}`;
    selectLevel2.appendChild(optLvl2);
  }

  // Preencher Espécies
  const selectSpecies = document.getElementById("selectSpecies");
  selectSpecies.innerHTML = '<option value="none">— Selecione a Espécie —</option>';
  DND5E_DATA.species.forEach(spc => {
    const opt = document.createElement("option");
    opt.value = spc.id;
    opt.textContent = spc.name;
    selectSpecies.appendChild(opt);
  });

  // Preencher Antecedentes
  const selectBackground = document.getElementById("selectBackground");
  selectBackground.innerHTML = '<option value="none">— Selecione o Antecedente —</option>';
  DND5E_DATA.backgrounds.forEach(bg => {
    const opt = document.createElement("option");
    opt.value = bg.id;
    opt.textContent = bg.isCustom ? `⭐ ${getBackgroundLabel(bg)}` : `${bg.name} (${bg.featName})`;
    selectBackground.appendChild(opt);
  });

  // Preencher seletores do Antecedente Customizado
  const selectCustomBgFeat = document.getElementById("selectCustomBgFeat");
  const selectCustomBgSkill1 = document.getElementById("selectCustomBgSkill1");
  const selectCustomBgSkill2 = document.getElementById("selectCustomBgSkill2");

  if (selectCustomBgFeat) {
    selectCustomBgFeat.innerHTML = "";
    DND5E_DATA.feats.filter(f => f.type === "origin").forEach(f => {
      const opt = document.createElement("option");
      opt.value = f.id;
      opt.textContent = f.name;
      selectCustomBgFeat.appendChild(opt);
    });
  }

  if (selectCustomBgSkill1 && selectCustomBgSkill2) {
    selectCustomBgSkill1.innerHTML = "";
    selectCustomBgSkill2.innerHTML = "";
    DND5E_DATA.skills.forEach(sk => {
      const opt1 = document.createElement("option");
      opt1.value = sk.id;
      opt1.textContent = sk.name;
      selectCustomBgSkill1.appendChild(opt1);

      const opt2 = document.createElement("option");
      opt2.value = sk.id;
      opt2.textContent = sk.name;
      selectCustomBgSkill2.appendChild(opt2);
    });
    selectCustomBgSkill2.selectedIndex = 1;
  }

  // Preencher Armaduras & Escudos
  const selectEquippedArmor = document.getElementById("selectEquippedArmor");
  selectEquippedArmor.innerHTML = "";
  DND5E_DATA.armors.forEach(arm => {
    const opt = document.createElement("option");
    opt.value = arm.id;
    opt.textContent = `${arm.name} (CA ${arm.baseAC}${arm.dexMod === 'full' ? ' + DES' : arm.dexMod === 'cap2' ? ' + DES máx 2' : ''})`;
    selectEquippedArmor.appendChild(opt);
  });

  const selectEquippedShield = document.getElementById("selectEquippedShield");
  selectEquippedShield.innerHTML = "";
  DND5E_DATA.shields.forEach(sh => {
    const opt = document.createElement("option");
    opt.value = sh.id;
    opt.textContent = sh.name;
    selectEquippedShield.appendChild(opt);
  });

  renderWeaponSlots();

  renderAbilityInputs();
  renderSpellsCatalog();
  renderCustomItemsList();
  renderWeaponMasteryButtons();
}

/**
 * Espelha o estado do personagem nos controles do criador
 * (sem isso os selects ficam no 1º item enquanto o personagem é outro)
 */
function syncWizardControls() {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  set("inputCharName", character.name || "");
  set("inputPlayerName", character.playerName || "");
  set("selectClass1", character.class1);
  set("selectLevel1", character.level1);
  set("selectMulticlass", character.class2 || "none");
  set("selectLevel2", character.level2);
  set("selectSpecies", character.species);
  set("selectBackground", character.background);
  set("selectAlignment", character.alignment);
  set("selectEquippedArmor", character.equippedArmor);
  set("selectEquippedShield", character.equippedShield);
  set("textInventory", character.inventory || "");
  set("inputCustomBgName", (character.customBg && character.customBg.name) || "");
  set("inputCustomLanguagesExtra", character.customLanguages || "");
  set("inputGoldPO", character.coins.po || 0);
  set("inputSilverPP", character.coins.pp || 0);
  set("inputCopperPC", character.coins.pc || 0);
  ["Age", "Height", "Weight", "Eyes", "Skin", "Hair"].forEach(f => set(`input${f}`, character.bio[f.toLowerCase()] || ""));
  ["Personality", "Ideals", "Bonds", "Flaws", "Backstory"].forEach(f => set(`text${f}`, character.bio[f.toLowerCase()] || ""));

  // Modo de atributos (Passo 2): botão ativo e seção de rolagem
  document.querySelectorAll(".ability-mode-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-mode") === character.abilityMode);
  });
  const rollSec = document.getElementById("rollDiceSection");
  if (rollSec) rollSec.style.display = character.abilityMode === "roll" ? "block" : "none";

  const mcRow = document.getElementById("multiclassLevelRow");
  if (mcRow) mcRow.style.display = character.class2 && character.class2 !== "none" ? "grid" : "none";

  renderHumanOriginFeat();
  renderHpPorNivel();
  updateCustomOriginPanels();
}

/* Objetos aninhados do personagem: precisam de merge chave a chave para uma
   ficha antiga (sem `customBg.name`, sem `featChoices`...) não chegar capenga */
const CHARACTER_NESTED_KEYS = ["customBg", "customClass1", "customClass2", "customSpecies", "freeCasts", "baseScores", "backgroundBonuses", "coins",
  "bio", "deathSaves", "spellSlotsExpended", "sheet", "featChoices", "hpRolls"];

/** Ficha carregada de fora (JSON, localStorage, lista de salvos) sobre a base vazia */
function mergeIntoBlankCharacter(data) {
  const base = createBlankCharacter();
  const merged = { ...base, ...data };

  // Talento personalizado passou a ser marcado como os oficiais. Numa ficha
  // salva antes disso ele valia sempre, então continua valendo: sem isso o
  // personagem perderia, na abertura, o que já estava em uso.
  if (!data.customFeatsMigrados && Array.isArray(merged.customFeats) && merged.customFeats.length) {
    merged.selectedFeats = Array.isArray(merged.selectedFeats) ? merged.selectedFeats.slice() : [];
    merged.customFeats.forEach(cf => {
      if (cf && cf.id && !merged.selectedFeats.includes(cf.id)) merged.selectedFeats.push(cf.id);
    });
  }
  merged.customFeatsMigrados = true;
  CHARACTER_NESTED_KEYS.forEach(k => {
    if (base[k] && typeof base[k] === "object" && !Array.isArray(base[k])) {
      merged[k] = { ...base[k], ...(data[k] || {}) };
    }
  });
  return merged;
}

/**
 * Aplica uma ficha carregada e repinta TUDO: os controles do assistente passo a
 * passo (Passos 1 a 6) e a ficha oficial. Importar um JSON, carregar da lista de
 * salvos e restaurar do localStorage passam todos por aqui — antes cada um
 * atualizava um pedaço diferente da tela, e os campos do assistente ficavam com
 * o conteúdo antigo.
 */
function applyLoadedCharacter(data) {
  _ofWeaponsSig = null;
  _ofSpellsSig = null;
  character = mergeIntoBlankCharacter(data);
  migrateLegacyCharacter(data);

  syncWizardControls();      // Passos 1, 2, 5 e 6 (campos digitáveis e selects)
  populateDropdowns();       // linhagem, subclasse, bônus, perícias e talentos
  renderLanguagesCheckboxes();
  renderAbilityInputs();
  renderSpellsCatalog();
  renderCustomItemsList();
  renderDeathSaves();
  renderWeaponMasteryButtons();
  recalculateCharacter();    // ficha oficial + todos os derivados
}

/**
 * Ajusta a escala da ficha para caber na largura do painel sem cortar o A4
 */
/* Zoom escolhido à mão pelo jogador; null = ajustar à largura disponível.
   No celular a ficha A4 cabe inteira em ~40%: dá para ver a página toda, mas
   para digitar num campo é preciso aproximar — daí o controle na barra. */
let _sheetZoom = null;
const SHEET_ZOOM_MIN = 0.3;
const SHEET_ZOOM_MAX = 2;

/** Escala que faz a página A4 caber na largura do painel */
function sheetFitScale() {
  const viewport = document.querySelector(".sheet-render-viewport");
  if (!viewport) return null;
  const style = getComputedStyle(viewport);
  const available = viewport.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const pageWidth = 793.7; // 210mm em px a 96dpi
  if (!(available > 0)) return null;
  return Math.min(1, available / pageWidth);
}

/**
 * Com as duas páginas abertas, o ajuste continua sendo pela largura: a altura
 * cresce e o painel rola, que é o comportamento esperado de uma ficha de duas
 * folhas empilhadas.
 */
function fitSheetToViewport() {
  const container = document.getElementById("sheetContainer");
  if (!container) return;
  const fit = sheetFitScale();
  if (fit === null && _sheetZoom === null) return;   // painel escondido
  const scale = _sheetZoom !== null ? _sheetZoom : fit;
  container.style.zoom = scale > 0 ? scale.toFixed(4) : 1;

  const label = document.getElementById("btnSheetZoomFit");
  if (label) label.textContent = _sheetZoom === null ? "Ajustar" : `${Math.round(scale * 100)}%`;

  ajustarTextoDaFicha();
}

/** delta em pontos percentuais; null volta para o ajuste automático */
function changeSheetZoom(delta) {
  if (delta === null) {
    _sheetZoom = null;
  } else {
    const atual = _sheetZoom !== null ? _sheetZoom : (sheetFitScale() || 1);
    _sheetZoom = Math.min(SHEET_ZOOM_MAX, Math.max(SHEET_ZOOM_MIN, atual + delta));
  }
  fitSheetToViewport();
}

/**
 * Preenche e atualiza selects dependentes
 */
function populateDropdowns() {
  updateLineagesDropdown();
  updateSubclassesDropdown();
  updateBackgroundBonusSelectors();
  initCustomBackgroundPanel();
  updateCustomOriginPanels();
  updateSkillsSelector();
  updateFeatsList();
}

/**
 * Atualiza o dropdown de Linhagens baseado na Espécie selecionada
 */
function updateLineagesDropdown() {
  const selectSpecies = document.getElementById("selectSpecies").value;
  const selectLineage = document.getElementById("selectLineage");
  const lineageGroup = document.getElementById("lineageGroup");
  const currentSpeciesObj = DND5E_DATA.species.find(s => s.id === selectSpecies);

  selectLineage.innerHTML = "";

  if (currentSpeciesObj && currentSpeciesObj.lineages && currentSpeciesObj.lineages.length > 0) {
    lineageGroup.style.display = "flex";
    currentSpeciesObj.lineages.forEach(lin => {
      const opt = document.createElement("option");
      opt.value = lin.id;
      opt.textContent = lin.name;
      selectLineage.appendChild(opt);
    });
    if (!character.lineage || !currentSpeciesObj.lineages.find(l => l.id === character.lineage)) {
      character.lineage = currentSpeciesObj.lineages[0].id;
    }
    selectLineage.value = character.lineage;
  } else {
    lineageGroup.style.display = "none";
    character.lineage = "none";
  }

  // Sincroniza idioma natural da espécie
  if (currentSpeciesObj) {
    const defaultLangMap = {
      elf: "Élfico (Elvish)",
      dwarf: "Anão (Dwarvish)",
      dragonborn: "Dracônico (Draconic)",
      gnome: "Gnômico (Gnomish)",
      tiefling: "Infernal",
      orc: "Órquico (Orc)",
      aasimar: "Celestial",
      goliath: "Gigante (Giant)",
      halfling: "Halfling"
    };
    const specLang = defaultLangMap[character.species];
    if (specLang && !character.languages.includes(specLang)) {
      character.languages.push(specLang);
    }
  }

  renderLanguagesCheckboxes();
  renderSpeciesBackgroundSummary();
}

/**
 * Atualiza o dropdown de Subclasses baseado na Classe 1 e Nível
 */
function updateSubclassesDropdown() {
  const classObj = DND5E_DATA.classes.find(c => c.id === character.class1);
  const selectSubclass1 = document.getElementById("selectSubclass1");
  const subclass1Desc = document.getElementById("subclass1Desc");
  
  selectSubclass1.innerHTML = "";

  if (character.level1 < 3) {
    selectSubclass1.innerHTML = '<option value="none">Disponível a partir do 3º Nível</option>';
    selectSubclass1.disabled = true;
    subclass1Desc.innerHTML = `<p><em>No D&D 5.5 (2024), a escolha de Subclasse é desbloqueada no <strong>3º nível</strong>. Ao evoluir para o nível 3, você poderá escolher entre as 4 especializações da classe.</em></p>`;
  } else {
    selectSubclass1.disabled = false;
    if (classObj && classObj.subclasses) {
      classObj.subclasses.forEach(sub => {
        const opt = document.createElement("option");
        opt.value = sub.id;
        opt.textContent = sub.name;
        selectSubclass1.appendChild(opt);
      });
      if (!character.subclass1 || character.subclass1 === "none" || !classObj.subclasses.find(s => s.id === character.subclass1)) {
        character.subclass1 = classObj.subclasses[0].id;
      }
      selectSubclass1.value = character.subclass1;
      const curSub = classObj.subclasses.find(s => s.id === character.subclass1);
      
      const bonusSpellsHtml = subclassSpellsHtml(curSub, character.level1)
                             + landSpellsHtml(curSub, character.level1);

      if (curSub) {
        subclass1Desc.innerHTML = `<h4><i class="fa-solid fa-khanda"></i> ${curSub.name}</h4><p>${curSub.desc}</p>${bonusSpellsHtml}`;
      }
    }
  }
}

/* Painéis de Classe/Multiclasse/Espécie personalizadas: aparecem só quando a
   opção "Personalizada" está escolhida no seletor correspondente. Cada campo
   simples é declarado aqui e ligado ao estado por bindCustomOriginPanels();
   as listas de habilidades por nível têm renderização própria mais abaixo. */
const CUSTOM_ORIGIN_PANELS = [
  {
    chave: "class1", panel: "customClass1Panel", select: "selectClass1",
    state: () => character.customClass1,
    campos: [
      { id: "inputCustomClass1Name", prop: "name" },
      { id: "textCustomClass1About", prop: "about" },
      { id: "selectCustomClass1HitDie", prop: "hitDie", tipo: "int" },
      { id: "selectCustomClass1Caster", prop: "casterType" },
      { id: "selectCustomClass1Ability", prop: "casterAbility" }
    ],
    listas: { grid: "customclass1SpellListsGrid", prop: "spellLists" },
    linhas: { container: "customclass1FeaturesRows", prop: "features", botao: "btnAddCustomClass1Feature", rotulo: "habilidade" }
  },
  {
    chave: "class2", panel: "customClass2Panel", select: "selectMulticlass",
    state: () => character.customClass2,
    campos: [
      { id: "inputCustomClass2Name", prop: "name" },
      { id: "textCustomClass2About", prop: "about" },
      { id: "selectCustomClass2HitDie", prop: "hitDie", tipo: "int" },
      { id: "selectCustomClass2Caster", prop: "casterType" },
      { id: "selectCustomClass2Ability", prop: "casterAbility" }
    ],
    listas: { grid: "customclass2SpellListsGrid", prop: "spellLists" },
    linhas: { container: "customclass2FeaturesRows", prop: "features", botao: "btnAddCustomClass2Feature", rotulo: "habilidade" }
  },
  {
    chave: "species", panel: "customSpeciesPanel", select: "selectSpecies",
    state: () => character.customSpecies,
    campos: [
      { id: "inputCustomSpeciesName", prop: "name" },
      { id: "textCustomSpeciesAbout", prop: "about" },
      { id: "selectCustomSpeciesSize", prop: "size" },
      { id: "inputCustomSpeciesSpeed", prop: "speed", tipo: "float" },
      { id: "selectCustomSpeciesDarkvision", prop: "darkvision", tipo: "int" },
      { id: "inputCustomSpeciesLanguages", prop: "languages" },
      { id: "inputCustomSpeciesWeaponProfs", prop: "weaponProfs" },
      { id: "inputCustomSpeciesToolProfs", prop: "toolProfs" }
    ],
    linhas: { container: "customspeciesTraitsRows", prop: "traits", botao: "btnAddCustomSpeciesTrait", rotulo: "traço" }
  }
];

/** Mostra/esconde os painéis personalizados e espelha o que já está guardado */
function updateCustomOriginPanels() {
  CUSTOM_ORIGIN_PANELS.forEach(cfg => {
    const panel = document.getElementById(cfg.panel);
    const select = document.getElementById(cfg.select);
    if (!panel || !select) return;
    const ativo = select.value === "custom";
    panel.style.display = ativo ? "block" : "none";
    if (!ativo) return;

    const st = cfg.state() || {};
    cfg.campos.forEach(c => {
      const el = document.getElementById(c.id);
      if (el && document.activeElement !== el) el.value = st[c.prop] !== undefined && st[c.prop] !== null ? st[c.prop] : "";
    });

    // Atributo e listas de magia só fazem sentido se a classe conjura
    if (cfg.chave !== "species") {
      const conjura = st.casterType && st.casterType !== "none";
      const grpAb = document.getElementById(`groupCustomClass${cfg.chave.slice(-1)}Ability`);
      const grpLi = document.getElementById(`groupCustomClass${cfg.chave.slice(-1)}SpellLists`);
      if (grpAb) grpAb.style.display = conjura ? "block" : "none";
      if (grpLi) grpLi.style.display = conjura ? "block" : "none";
      if (conjura) renderCustomSpellListsGrid(cfg);
      atualizarDicaDeVida(cfg);
    }

    renderCustomOriginRows(cfg);
  });
}

/** Quanto de PV o dado de vida escolhido rende, para a escolha não ser às cegas */
function atualizarDicaDeVida(cfg) {
  const dica = document.getElementById(`customclass${cfg.chave.slice(-1)}HpHint`);
  if (!dica) return;
  const st = cfg.state() || {};
  const d = parseInt(st.hitDie, 10) || 8;
  const nivel = cfg.chave === "class2" ? character.level2 : character.level1;
  dica.textContent = `1º nível: ${d} + mod. de Constituição. Cada nível seguinte: ${Math.floor(d / 2) + 1} + mod. (${nivel} nível${nivel > 1 ? "is" : ""} nesta classe).`;
}

/** Caixas de seleção das listas de magia de origem da classe personalizada */
function renderCustomSpellListsGrid(cfg) {
  const grid = document.getElementById(cfg.listas.grid);
  if (!grid) return;
  const st = cfg.state() || {};
  const marcadas = st[cfg.listas.prop] || [];

  const fontes = DND5E_DATA.classes.filter(c => !c.isCustom && c.spellcasting);
  grid.innerHTML = fontes.map(c => `
    <label class="lang-checkbox-item">
      <input type="checkbox" value="${c.id}"${marcadas.includes(c.id) ? " checked" : ""}>
      <span>${c.name.split(" (")[0]}</span>
    </label>`).join("") + `
    <label class="lang-checkbox-item">
      <input type="checkbox" value="custom"${marcadas.includes("custom") ? " checked" : ""}>
      <span>⭐ Magias personalizadas</span>
    </label>`;

  if (grid.dataset.ligado !== "1") {
    grid.dataset.ligado = "1";
    grid.addEventListener("change", () => {
      const st2 = cfg.state();
      if (!st2) return;
      st2[cfg.listas.prop] = [...grid.querySelectorAll("input:checked")].map(i => i.value);
      renderSpellsCatalog();
      recalculateCharacter();
    });
  }
}

/* Habilidades por nível: nível + nome + descrição, uma linha por habilidade.
   Redesenha só quando a lista muda de tamanho, para não roubar o cursor de
   quem está digitando dentro de uma linha. */
function renderCustomOriginRows(cfg) {
  const box = document.getElementById(cfg.linhas.container);
  if (!box) return;
  const st = cfg.state();
  if (!st) return;
  if (!Array.isArray(st[cfg.linhas.prop])) st[cfg.linhas.prop] = [];
  const lista = st[cfg.linhas.prop];

  if (box.dataset.qtd === String(lista.length) && box.children.length === lista.length) return;
  box.dataset.qtd = String(lista.length);

  if (lista.length === 0) {
    box.innerHTML = `<p class="custom-rows-empty">Nenhuma ${cfg.linhas.rotulo} ainda. Use o botão abaixo ou uma sugestão.</p>`;
    return;
  }

  box.innerHTML = lista.map((item, i) => `
    <div class="custom-row" data-i="${i}">
      <select class="form-control custom-row-level" data-campo="level" title="Nível em que é ganha">
        ${Array.from({ length: 20 }, (_, n) => `<option value="${n + 1}"${(parseInt(item.level, 10) || 1) === n + 1 ? " selected" : ""}>Nvl ${n + 1}</option>`).join("")}
      </select>
      <input type="text" class="form-control custom-row-name" data-campo="name" placeholder="Nome" value="${String(item.name || "").replace(/"/g, "&quot;")}">
      <input type="text" class="form-control custom-row-desc" data-campo="desc" placeholder="O que faz" value="${String(item.desc || "").replace(/"/g, "&quot;")}">
      <button type="button" class="of-row-del custom-row-del" title="Remover"><i class="fa-solid fa-xmark"></i></button>
    </div>`).join("");

  if (box.dataset.ligado !== "1") {
    box.dataset.ligado = "1";

    const alterou = (e) => {
      const linha = e.target.closest(".custom-row");
      if (!linha) return;
      const i = parseInt(linha.getAttribute("data-i"), 10);
      const campo = e.target.getAttribute("data-campo");
      const alvo = (cfg.state() || {})[cfg.linhas.prop];
      if (!alvo || !alvo[i] || !campo) return;
      alvo[i][campo] = campo === "level" ? parseInt(e.target.value, 10) : e.target.value;
      recalculateCharacter();
    };
    box.addEventListener("input", alterou);
    box.addEventListener("change", alterou);

    box.addEventListener("click", (e) => {
      const del = e.target.closest(".custom-row-del");
      if (!del) return;
      const i = parseInt(del.closest(".custom-row").getAttribute("data-i"), 10);
      const alvo = (cfg.state() || {})[cfg.linhas.prop];
      if (!alvo) return;
      alvo.splice(i, 1);
      renderCustomOriginRows(cfg);
      recalculateCharacter();
    });
  }
}

/** Acrescenta uma linha vazia (ou já preenchida, vinda de uma sugestão) */
function addCustomOriginRow(cfg, dados) {
  const st = cfg.state();
  if (!st) return;
  if (!Array.isArray(st[cfg.linhas.prop])) st[cfg.linhas.prop] = [];
  st[cfg.linhas.prop].push({ level: 1, name: "", desc: "", ...(dados || {}) });
  renderCustomOriginRows(cfg);
  recalculateCharacter();
}

/* Sugestões de preenchimento: a página em branco é o que trava quem cria
   material próprio. Cada chip escreve um exemplo pronto no campo — nome
   substitui, texto longo acrescenta uma linha — e dá para editar depois. */
const SUGESTOES_NOME_CLASSE = ["Feiticeiro de Sangue", "Cavaleiro Rúnico", "Caçador de Sombras", "Alquimista de Guerra", "Guardião das Marés"];
const SUGESTOES_SOBRE_CLASSE = [
  "Conceito: guerreiro que canaliza o próprio sangue como fonte de magia.",
  "Atributo principal: Carisma. Salvaguardas com proficiência: Constituição e Carisma.",
  "Proficiências: armaduras leves, armas simples e um kit à escolha; 2 perícias da lista da classe.",
  "Aumentos de Atributo nos níveis 4, 8, 12, 16 e 19; subclasse à escolha no nível 3.",
  "Equipamento inicial: combinado com o Mestre no lugar da lista oficial."
];
const SUGESTOES_HABILIDADE_CLASSE = [
  { level: 1, name: "Característica de Assinatura", desc: "Efeito principal da classe, utilizável PROF vezes por descanso longo." },
  { level: 2, name: "Estilo de Combate", desc: "Escolha um Estilo de Combate à sua escolha." },
  { level: 3, name: "Subclasse", desc: "Escolha uma subclasse; ela concede características nos níveis 3, 6, 10 e 14." },
  { level: 5, name: "Ataque Extra", desc: "Você ataca duas vezes ao usar a ação de Ataque." },
  { level: 11, name: "Golpe Aprimorado", desc: "Adicione 1d8 de dano do seu tipo mágico uma vez por turno." }
];
const SUGESTOES_NOME_ESPECIE = ["Filho das Marés", "Ferrogrim", "Semi-elemental do Fogo", "Corvino", "Nascido da Bruma"];
const SUGESTOES_SOBRE_ESPECIE = [
  "Origem: povo nascido nas cidades submersas, de pele fria e olhos claros.",
  "Idade: amadurece por volta dos 20 anos e vive cerca de 120.",
  "Tipo de Criatura: Humanoide.",
  "Cultura: clãs pequenos, ligados por juramentos de hospitalidade."
];
const SUGESTOES_IDIOMAS_ESPECIE = ["Comum, Aquan", "Comum, Anão (Dwarvish)", "Comum, Élfico (Elvish)", "Comum, Infernal", "Comum, Primordial"];
const SUGESTOES_PROF_ARMAS = ["Armas Simples", "Armas Simples, Armaduras Leves", "Armas Marciais", "Escudos"];
const SUGESTOES_PROF_FERRAMENTAS = ["Ferramentas de Ferreiro", "Kit de Herborista", "Instrumento Musical à escolha", "Perícia: Percepção", "Perícia: Furtividade"];
const SUGESTOES_TRACO_ESPECIE = [
  { level: 1, name: "Resistência Ancestral", desc: "Você tem Resistência a um tipo de dano à sua escolha." },
  { level: 1, name: "Anfíbio", desc: "Você respira debaixo d'água e tem deslocamento de natação igual ao seu deslocamento." },
  { level: 1, name: "Talento Racial", desc: "Você tem proficiência em uma perícia à sua escolha." },
  { level: 3, name: "Dádiva do Sangue", desc: "Você pode conjurar uma magia de 1º círculo à escolha, uma vez por descanso longo." },
  { level: 5, name: "Sopro Ancestral", desc: "Ação: todas as criaturas em um cone de 4,5 m fazem salvaguarda de Destreza ou sofrem 2d6 de dano." }
];
const SUGESTOES_DESC_MAGIA = [
  "Escolha uma criatura que você possa ver no alcance. Ela deve ser bem-sucedida em uma salvaguarda de Destreza ou sofrerá 3d6 de dano de fogo, ou metade se for bem-sucedida.",
  "Aprimoramento em Círculo Superior. O dano aumenta em 1d6 para cada círculo acima do 1º usado na conjuração.",
  "Aprimoramento de Truque. O dano aumenta em 1d8 nos níveis 5, 11 e 17.",
  "Você ganha 1d4 + seu modificador de conjuração em Pontos de Vida Temporários enquanto a magia durar.",
  "Um alvo Grande ou menor deve ser bem-sucedido em uma salvaguarda de Força ou ficará com a condição Caído."
];

/**
 * Desenha os chips de sugestão de um campo. `modo` diz o que o clique faz:
 * "substituir" (nomes) ou "acrescentar" (textos que se somam em linhas).
 */
function renderSuggestionChips(containerId, targetId, sugestoes, modo = "acrescentar") {
  const box = document.getElementById(containerId);
  const alvo = document.getElementById(targetId);
  if (!box || !alvo || box.dataset.pronto === "1") return;
  box.dataset.pronto = "1";

  box.innerHTML = `<span class="suggestion-label"><i class="fa-solid fa-lightbulb"></i> Sugestões:</span>` +
    sugestoes.map((t, i) => {
      const rotulo = modo === "substituir" ? t : `${t.split(/[:.]/)[0]}…`;
      return `<button type="button" class="suggestion-chip" data-i="${i}" title="${t.replace(/"/g, "&quot;")}">${rotulo}</button>`;
    }).join("");

  box.addEventListener("click", (e) => {
    const chip = e.target.closest(".suggestion-chip");
    if (!chip) return;
    const texto = sugestoes[parseInt(chip.getAttribute("data-i"), 10)];
    if (modo === "substituir") {
      alvo.value = texto;
    } else {
      const atual = alvo.value.trim();
      if (atual.includes(texto)) return;
      alvo.value = atual ? `${atual}\n${texto}` : texto;
    }
    alvo.dispatchEvent(new Event("input", { bubbles: true }));
    alvo.focus();
  });
}

/** Chips que criam uma linha inteira de habilidade/traço já preenchida */
function renderRowSuggestionChips(containerId, cfg, sugestoes) {
  const box = document.getElementById(containerId);
  if (!box || box.dataset.pronto === "1") return;
  box.dataset.pronto = "1";

  box.innerHTML = `<span class="suggestion-label"><i class="fa-solid fa-lightbulb"></i> Sugestões:</span>` +
    sugestoes.map((sug, i) => `<button type="button" class="suggestion-chip" data-i="${i}" title="Nvl ${sug.level} — ${sug.desc.replace(/"/g, "&quot;")}">Nvl ${sug.level} · ${sug.name}</button>`).join("");

  box.addEventListener("click", (e) => {
    const chip = e.target.closest(".suggestion-chip");
    if (!chip) return;
    addCustomOriginRow(cfg, { ...sugestoes[parseInt(chip.getAttribute("data-i"), 10)] });
  });
}

/** Liga os campos dos painéis personalizados ao estado */
function bindCustomOriginPanels() {
  const porChave = (k) => CUSTOM_ORIGIN_PANELS.find(c => c.chave === k);

  [["class1", 1], ["class2", 2]].forEach(([chave, n]) => {
    const cfg = porChave(chave);
    renderSuggestionChips(`inputCustomClass${n}NameSuggestions`, `inputCustomClass${n}Name`, SUGESTOES_NOME_CLASSE, "substituir");
    renderSuggestionChips(`textCustomClass${n}AboutSuggestions`, `textCustomClass${n}About`, SUGESTOES_SOBRE_CLASSE);
    renderRowSuggestionChips(`customclass${n}FeatureSuggestions`, cfg, SUGESTOES_HABILIDADE_CLASSE);
  });

  const cfgEsp = porChave("species");
  renderSuggestionChips("inputCustomSpeciesNameSuggestions", "inputCustomSpeciesName", SUGESTOES_NOME_ESPECIE, "substituir");
  renderSuggestionChips("textCustomSpeciesAboutSuggestions", "textCustomSpeciesAbout", SUGESTOES_SOBRE_ESPECIE);
  renderSuggestionChips("inputCustomSpeciesLanguagesSuggestions", "inputCustomSpeciesLanguages", SUGESTOES_IDIOMAS_ESPECIE, "substituir");
  renderSuggestionChips("inputCustomSpeciesWeaponProfsSuggestions", "inputCustomSpeciesWeaponProfs", SUGESTOES_PROF_ARMAS, "substituir");
  renderSuggestionChips("inputCustomSpeciesToolProfsSuggestions", "inputCustomSpeciesToolProfs", SUGESTOES_PROF_FERRAMENTAS, "substituir");
  renderRowSuggestionChips("customspeciesTraitSuggestions", cfgEsp, SUGESTOES_TRACO_ESPECIE);

  CUSTOM_ORIGIN_PANELS.forEach(cfg => {
    cfg.campos.forEach(campo => {
      const el = document.getElementById(campo.id);
      if (!el) return;
      const evento = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(evento, (e) => {
        const st = cfg.state();
        if (!st) return;
        st[campo.prop] = campo.tipo === "int" ? (parseInt(e.target.value, 10) || 0)
          : campo.tipo === "float" ? (parseFloat(e.target.value) || 0)
          : e.target.value;

        // O nome digitado também rotula a opção "Personalizada" no seletor,
        // para o jogador reconhecer o que escolheu sem abrir o painel.
        if (campo.prop === "name") {
          const opt = document.querySelector(`#${cfg.select} option[value="custom"]`);
          if (opt) opt.textContent = `⭐ ${(e.target.value || "").trim() || "Personalizada (Custom)"}`;
        }
        if (campo.prop === "casterType" || campo.prop === "hitDie") updateCustomOriginPanels();
        if (campo.prop === "casterType") renderSpellsCatalog();

        renderSpeciesBackgroundSummary();
        recalculateCharacter();
      });
    });

    const btn = cfg.linhas && document.getElementById(cfg.linhas.botao);
    if (btn) btn.addEventListener("click", () => addCustomOriginRow(cfg));
  });
}

/**
 * Inicializa e sincroniza os seletores do painel de Antecedente Customizado
 */
function initCustomBackgroundPanel() {
  const customPanel = document.getElementById("customBackgroundPanel");
  if (!customPanel) return;

  const bgObj = DND5E_DATA.backgrounds.find(b => b.id === character.background);
  customPanel.style.display = (bgObj && bgObj.isCustom) ? "block" : "none";

  const inputName = document.getElementById("inputCustomBgName");
  if (inputName && document.activeElement !== inputName) {
    inputName.value = character.customBg.name || "";
  }

  const selectMode = document.getElementById("selectCustomBgBonusMode");
  const groupAttr3 = document.getElementById("groupCustomBgAttr3");
  const labelAttr1 = document.getElementById("labelCustomBgAttr1");
  const labelAttr2 = document.getElementById("labelCustomBgAttr2");

  if (selectMode) {
    selectMode.value = character.backgroundBonusMode;
    if (character.backgroundBonusMode === "+2/+1") {
      if (groupAttr3) groupAttr3.style.display = "none";
      if (labelAttr1) labelAttr1.textContent = "Atributo Primário (+2)";
      if (labelAttr2) labelAttr2.textContent = "Atributo Secundário (+1)";
    } else {
      if (groupAttr3) groupAttr3.style.display = "block";
      if (labelAttr1) labelAttr1.textContent = "Primeiro (+1)";
      if (labelAttr2) labelAttr2.textContent = "Segundo (+1)";
    }
  }

  const populateAttr = (id, curVal) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = "";
    DND5E_DATA.abilities.forEach(ab => {
      const opt = document.createElement("option");
      opt.value = ab.id;
      opt.textContent = `${ab.name} (${ab.abbr})`;
      if (ab.id === curVal) opt.selected = true;
      el.appendChild(opt);
    });
  };

  populateAttr("selectCustomBgAttr1", character.backgroundBonuses.primary);
  populateAttr("selectCustomBgAttr2", character.backgroundBonuses.secondary);
  populateAttr("selectCustomBgAttr3", character.backgroundBonuses.tertiary);

  const selectFeat = document.getElementById("selectCustomBgFeat");
  if (selectFeat) {
    selectFeat.innerHTML = "";
    const originFeats = DND5E_DATA.feats.filter(f => f.type === "origin");
    originFeats.forEach(f => {
      const opt = document.createElement("option");
      opt.value = f.id;
      opt.textContent = `${f.name}`;
      if (f.id === character.customBg.feat) opt.selected = true;
      selectFeat.appendChild(opt);
    });
    updateCustomBgFeatPreview();
  }

  const populateSkill = (id, curVal) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = "";
    DND5E_DATA.skills.forEach(sk => {
      const opt = document.createElement("option");
      opt.value = sk.id;
      const abObj = DND5E_DATA.abilities.find(a => a.id === sk.ability);
      opt.textContent = `${sk.name} (${abObj ? abObj.abbr : ''})`;
      if (sk.id === curVal) opt.selected = true;
      el.appendChild(opt);
    });
  };

  populateSkill("selectCustomBgSkill1", character.customBg.skill1);
  populateSkill("selectCustomBgSkill2", character.customBg.skill2);

  const selectTool = document.getElementById("selectCustomBgTool");
  if (selectTool) {
    selectTool.innerHTML = "";
    DND5E_DATA.tools.forEach(cat => {
      const group = document.createElement("optgroup");
      group.label = cat.category;
      cat.items.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = t.name;
        if (t.id === character.customBg.tool) opt.selected = true;
        group.appendChild(opt);
      });
      selectTool.appendChild(group);
    });
    const optCustom = document.createElement("option");
    optCustom.value = "custom";
    optCustom.textContent = "✨ Outra / Personalizada...";
    if (character.customBg.tool === "custom") optCustom.selected = true;
    selectTool.appendChild(optCustom);

    const groupToolOther = document.getElementById("groupCustomBgToolOther");
    const inputToolOther = document.getElementById("inputCustomBgToolOther");
    if (groupToolOther) {
      groupToolOther.style.display = character.customBg.tool === "custom" ? "block" : "none";
    }
    if (inputToolOther) {
      inputToolOther.value = character.customBg.toolCustom || "";
    }
  }

  renderLanguagesCheckboxes();
}

/**
 * Atualiza o card de preview do talento de origem selecionado
 */
function updateCustomBgFeatPreview() {
  const preview = document.getElementById("customBgFeatPreview");
  if (!preview) return;
  const feat = DND5E_DATA.feats.find(f => f.id === character.customBg.feat);
  if (feat) {
    preview.innerHTML = `<strong>${feat.name}:</strong> ${feat.desc}`;
  } else {
    preview.innerHTML = `<em>Talento de nível 1 concedido pelo antecedente.</em>`;
  }
}

/**
 * Renderiza checkboxes de idiomas conhecidos
 */
function renderLanguagesCheckboxes() {
  const container = document.getElementById("customBgLanguagesGrid");
  if (!container) return;
  container.innerHTML = "";

  DND5E_DATA.languages.forEach(lang => {
    const isCommon = lang.id === "common" || lang.name.startsWith("Comum (Common)") || lang.name.startsWith("Comum");
    const isChecked = isCommon || character.languages.includes(lang.name) || character.languages.includes(lang.id);

    const label = document.createElement("label");
    label.className = "lang-checkbox-item";
    label.innerHTML = `
      <input type="checkbox" value="${lang.name}" ${isChecked ? "checked" : ""} ${isCommon ? "disabled" : ""}>
      <span>${lang.name}</span>
    `;

    const input = label.querySelector("input");
    if (!isCommon) {
      input.addEventListener("change", (e) => {
        if (e.target.checked) {
          if (!character.languages.includes(lang.name)) character.languages.push(lang.name);
        } else {
          character.languages = character.languages.filter(l => l !== lang.name && l !== lang.id);
        }
        renderSpeciesBackgroundSummary();
        recalculateCharacter();
      });
    }
    container.appendChild(label);
  });

  const inputExtra = document.getElementById("inputCustomLanguagesExtra");
  if (inputExtra) {
    inputExtra.value = character.customLanguages || "";
  }
}

/**
 * Nome a exibir para um antecedente. No personalizado vale o nome digitado
 * pelo jogador; sem nome, cai no rótulo genérico "Personalizado".
 */
function getBackgroundLabel(bgObj) {
  if (!bgObj) return "Personalizado";
  if (!bgObj.isCustom) return bgObj.name;
  const typed = ((character.customBg && character.customBg.name) || "").trim();
  return typed || "Personalizado";
}

/**
 * Lista os níveis do personagem, na ordem, dizendo de qual classe cada um veio.
 *
 * O app guarda só quantos níveis o personagem tem em cada classe, não a ordem
 * em que foram ganhos. A convenção aqui é a mesma que o cálculo de vida já
 * usava: primeiro todos os da classe principal, depois os da segunda. Serve
 * tanto para a conta automática quanto para rotular os campos do modo manual.
 */
function listarNiveis(class1Obj, class2Obj) {
  const niveis = [];
  for (let i = 0; i < (character.level1 || 0); i++) {
    niveis.push({ classe: class1Obj, dado: class1Obj.hitDie });
  }
  if (class2Obj && character.level2 > 0) {
    for (let i = 0; i < character.level2; i++) {
      niveis.push({ classe: class2Obj, dado: class2Obj.hitDie });
    }
  }
  return niveis.map((n, i) => ({ ...n, nivel: i + 1 }));
}

/**
 * Pontos de Vida máximos, no modo escolhido no Passo 2.
 *
 * O 1º nível é sempre o dado cheio — o livro não dá opção ali. Do 2º em diante
 * é que entra o modo: metade+1 (padrão), dado cheio (vida completa) ou o valor
 * que o jogador digitou para aquele nível.
 *
 * O modificador de Constituição entra em TODOS os níveis, inclusive nos
 * digitados à mão: o campo manual guarda a rolagem do dado, não o total, senão
 * mudar a Constituição depois deixaria a ficha errada e calada.
 */
function somarPontosDeVida(class1Obj, class2Obj, conMod) {
  const niveis = listarNiveis(class1Obj, class2Obj);
  if (!niveis.length) return 0;

  const modo = character.hpMode || "average";
  let total = 0;

  niveis.forEach((n, i) => {
    if (!n.dado) return;
    let dado;
    if (i === 0) {
      dado = n.dado;                                  // 1º nível: sempre cheio
    } else if (modo === "max") {
      dado = n.dado;
    } else if (modo === "manual") {
      const digitado = parseInt((character.hpRolls || {})[n.nivel], 10);
      dado = Number.isFinite(digitado)
        ? Math.min(n.dado, Math.max(1, digitado))
        : Math.floor(n.dado / 2) + 1;                 // ainda não digitado
    } else {
      dado = Math.floor(n.dado / 2) + 1;
    }
    total += dado + conMod;
  });

  return Math.max(niveis.length, total);   // nunca menos de 1 PV por nível
}

/**
 * Retorna o ID do Talento de Origem concedido pelo Antecedente atual
 * (oficial => bg.feat; personalizado => escolha do jogador no painel custom)
 */
function getOriginFeatId() {
  const bgObj = DND5E_DATA.backgrounds.find(b => b.id === character.background);
  if (!bgObj) return null;
  return (bgObj.isCustom ? character.customBg.feat : bgObj.feat) || null;
}

/**
 * Retorna o objeto do Talento de Origem concedido pelo Antecedente atual
 */
function getOriginFeatObj() {
  const id = getOriginFeatId();
  return id ? (DND5E_DATA.feats.find(f => f.id === id) || null) : null;
}

/**
 * ID do Talento de Origem extra do Humano (traço Versátil), ou null.
 *
 * Guardado separado do talento do antecedente porque o Humano fica com os
 * dois, e trocar de espécie não pode levar junto o talento que veio do
 * antecedente — nem o contrário.
 */
function getHumanOriginFeatId() {
  if (character.species !== "human") return null;
  const id = character.humanOriginFeat;
  if (!id || id === "none") return null;
  return DND5E_DATA.feats.some(f => f.id === id && f.type === "origin") ? id : null;
}

function getHumanOriginFeatObj() {
  const id = getHumanOriginFeatId();
  return id ? (DND5E_DATA.feats.find(f => f.id === id) || null) : null;
}

/** Talentos de Origem adicionados à mão, já resolvidos em objeto */
function getExtraOriginFeatObjs() {
  return (character.extraOriginFeats || [])
    .map(id => DND5E_DATA.feats.find(f => f.id === id && f.type === "origin"))
    .filter(Boolean);
}

/**
 * Adiciona um Talento de Origem avulso.
 *
 * Recusa o que já está valendo por outro caminho — o do antecedente, o do
 * Humano ou um já adicionado: repetir o mesmo talento não dobra efeito nenhum,
 * e a lista ficaria dizendo uma coisa que a ficha não faz.
 */
function addExtraOriginFeat(id) {
  const f = DND5E_DATA.feats.find(x => x.id === id && x.type === "origin");
  if (!f) return;

  if (getActiveFeatIds().includes(id)) {
    showToast(`${f.name} já está valendo nesta ficha.`);
    return;
  }

  if (!Array.isArray(character.extraOriginFeats)) character.extraOriginFeats = [];
  character.extraOriginFeats.push(id);

  renderHumanOriginFeat();
  updateFeatsList();
  renderSpellsCatalog();
  recalculateCharacter();
  saveToLocalStorage();
  showToast(`✨ ${f.name} adicionado como Talento de Origem.`);
}

function removeExtraOriginFeat(id) {
  character.extraOriginFeats = (character.extraOriginFeats || []).filter(x => x !== id);
  updateFeatsList();
  renderSpellsCatalog();
  recalculateCharacter();
  saveToLocalStorage();
}

/**
 * Mostra (ou esconde) o seletor do Talento de Origem extra do Humano e
 * preenche a lista com os talentos de origem do livro.
 */
function renderHumanOriginFeat() {
  const bloco = document.getElementById("humanFeatGroup");
  const select = document.getElementById("selectHumanOriginFeat");
  if (!bloco || !select) return;

  const ehHumano = character.species === "human";
  bloco.style.display = ehHumano ? "" : "none";
  if (!ehHumano) return;

  const originFeats = DND5E_DATA.feats.filter(f => f.type === "origin");
  select.innerHTML = "";

  const vazio = document.createElement("option");
  vazio.value = "none";
  vazio.textContent = "— Escolha o talento extra —";
  select.appendChild(vazio);

  const doAntecedente = getOriginFeatId();
  originFeats.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f.id;
    // O antecedente já concede um: repetir o mesmo talento não dobra nada,
    // então ele fica marcado para o jogador não gastar a escolha à toa.
    opt.textContent = f.id === doAntecedente
      ? `${f.name} — já vem do antecedente`
      : f.name;
    select.appendChild(opt);
  });

  select.value = character.humanOriginFeat || "none";

  const previa = document.getElementById("humanFeatPreview");
  if (previa) {
    const escolhido = getHumanOriginFeatObj();
    previa.innerHTML = escolhido
      ? `<strong style="color:#fbbf24;">${escolhido.name}</strong><br>${escolhido.desc}`
      : "";
  }
}

/**
 * Campos de vida por nível do modo "editável por nível".
 *
 * Um campo por nível a partir do 2º, rotulado com o dado daquela classe, para
 * o jogador digitar o que rolou de verdade na mesa. O 1º fica só como leitura:
 * é sempre o dado cheio.
 */
function renderHpPorNivel() {
  const grade = document.getElementById("hpPorNivelGrid");
  const resumo = document.getElementById("hpModeResumo");
  const select = document.getElementById("selectHpMode");
  if (!grade) return;

  if (select) select.value = character.hpMode || "average";

  const class1Obj = resolveClassObj(character.class1, 1);
  const class2Obj = resolveClassObj(character.class2, 2);
  const niveis = class1Obj ? listarNiveis(class1Obj, class2Obj || null) : [];

  const manual = (character.hpMode || "average") === "manual";
  grade.style.display = manual && niveis.length ? "" : "none";

  if (!niveis.length) {
    grade.innerHTML = "";
    _assinaturaHpPorNivel = null;
    if (resumo) resumo.textContent = "Escolha a classe no Passo 1 para o app saber o Dado de Vida.";
    return;
  }

  // Refazer o HTML a cada tecla tiraria o foco do campo que está sendo
  // digitado — e recalculateCharacter roda a cada tecla. Só remonta quando a
  // ESTRUTURA muda: modo, classes ou níveis.
  const assinatura = [character.hpMode, character.class1, character.level1,
                      character.class2, character.level2].join("|");
  if (assinatura === _assinaturaHpPorNivel) {
    atualizarResumoHp(resumo);
    return;
  }
  _assinaturaHpPorNivel = assinatura;

  if (manual) {
    grade.innerHTML = niveis.map((n, i) => {
      const nome = (n.classe.name || "").split(" (")[0];
      if (i === 0) {
        return `
          <label class="hp-nivel-campo is-fixo" title="O 1º nível é sempre o dado cheio">
            <span class="hp-nivel-rotulo">Nív. 1 · d${n.dado}</span>
            <input type="number" class="form-control" value="${n.dado}" disabled>
          </label>`;
      }
      const val = (character.hpRolls || {})[n.nivel];
      return `
        <label class="hp-nivel-campo" title="${nome} — role 1d${n.dado}">
          <span class="hp-nivel-rotulo">Nív. ${n.nivel} · d${n.dado}</span>
          <input type="number" class="form-control hp-nivel-input" data-nivel="${n.nivel}"
                 min="1" max="${n.dado}" inputmode="numeric" placeholder="${Math.floor(n.dado / 2) + 1}"
                 value="${val === undefined || val === "" ? "" : val}">
        </label>`;
    }).join("");
  } else {
    grade.innerHTML = "";
  }

  atualizarResumoHp(resumo);
}

/** Assinatura da última grade montada, para não remontar a cada tecla */
let _assinaturaHpPorNivel = null;

function atualizarResumoHp(resumo) {
  if (!resumo) return;
  const porModo = {
    average: "Cada nível depois do 1º vale metade do Dado de Vida + 1, somado ao seu modificador de Constituição.",
    max: "Cada nível vale o Dado de Vida cheio. Vida bem mais alta — combine com a mesa antes.",
    manual: "Digite o resultado do dado de cada nível. O modificador de Constituição continua sendo somado por fora, então mudar Constituição depois já corrige a ficha sozinho. Campo vazio conta como metade + 1."
  };
  resumo.textContent = porModo[character.hpMode || "average"];
}

/**
 * Retorna o nome amigável da ferramenta do antecedente personalizado
 */
function getCustomBgToolName() {
  if (character.customBg.tool === "custom") {
    return character.customBg.toolCustom || "Ferramenta Personalizada";
  }
  for (const cat of DND5E_DATA.tools) {
    const found = cat.items.find(i => i.id === character.customBg.tool);
    if (found) return found.name;
  }
  return character.customBg.tool || "Ferramentas de Ladrão";
}

/**
 * Retorna a lista de idiomas formatada do personagem
 */
function getFormattedLanguages() {
  const list = [...character.languages];

  // Idiomas concedidos por uma espécie personalizada entram junto dos demais.
  const spCustom = resolveSpeciesObj(character.species);
  if (spCustom && spCustom.isCustom) {
    (spCustom.languages || []).forEach(l => { if (!list.includes(l)) list.push(l); });
  }
  // Comum entra de brinde só depois que o jogador marcou algum idioma — numa
  // ficha ainda em branco o campo tem que ficar vazio.
  if (list.length && !list.some(l => l.startsWith("Comum"))) {
    list.unshift("Comum (Common)");
  }
  if (character.customLanguages && character.customLanguages.trim()) {
    const extras = character.customLanguages.split(",").map(s => s.trim()).filter(Boolean);
    extras.forEach(ext => {
      if (!list.includes(ext)) list.push(ext);
    });
  }
  return list.join(", ");
}

/**
 * Atualiza os seletores de bônus de atributo (+2/+1 ou +1/+1/+1) do Antecedente (Passo 2)
 */
function updateBackgroundBonusSelectors() {
  const bgObj = DND5E_DATA.backgrounds.find(b => b.id === character.background);
  const container = document.getElementById("backgroundBonusSelectors");
  const customPanel = document.getElementById("customBackgroundPanel");

  if (!container || !bgObj) return;

  if (bgObj.isCustom) {
    if (customPanel) customPanel.style.display = "block";
  } else {
    if (customPanel) customPanel.style.display = "none";
  }

  const validAbilities = bgObj.abilityOptions || [];

  // O personagem começa sem bônus escolhido ("none"). Assim que um antecedente
  // entra, o estado passa a apontar para opções que existem no seletor.
  const bonuses = character.backgroundBonuses;
  if (validAbilities.length && !validAbilities.includes(bonuses.primary)) {
    bonuses.primary = validAbilities[0];
    bonuses.secondary = validAbilities[1] || validAbilities[0];
    bonuses.tertiary = validAbilities[2] || validAbilities[0];
  }
  
  let html = `
    <div class="form-group">
      <label class="form-label">Modo de Distribuição</label>
      <select class="form-control" id="selectBgBonusMode">
        <option value="+2/+1" ${character.backgroundBonusMode === '+2/+1' ? 'selected' : ''}>+2 em um / +1 em outro</option>
        <option value="+1/+1/+1" ${character.backgroundBonusMode === '+1/+1/+1' ? 'selected' : ''}>+1 em três atributos</option>
      </select>
    </div>
  `;

  if (character.backgroundBonusMode === "+2/+1") {
    html += `
      <div class="form-group">
        <label class="form-label">Atributo Primário (+2)</label>
        <select class="form-control" id="selectBgPrimary">
          ${validAbilities.map(a => `<option value="${a}" ${character.backgroundBonuses.primary === a ? 'selected' : ''}>+2 em ${DND5E_DATA.abilities.find(ab => ab.id === a).name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Atributo Secundário (+1)</label>
        <select class="form-control" id="selectBgSecondary">
          ${validAbilities.map(a => `<option value="${a}" ${character.backgroundBonuses.secondary === a ? 'selected' : ''}>+1 em ${DND5E_DATA.abilities.find(ab => ab.id === a).name}</option>`).join('')}
        </select>
      </div>
    `;
  } else {
    html += `
      <div class="form-group">
        <label class="form-label">Primeiro (+1)</label>
        <select class="form-control" id="selectBgPrimary">
          ${validAbilities.map(a => `<option value="${a}" ${character.backgroundBonuses.primary === a ? 'selected' : ''}>+1 em ${DND5E_DATA.abilities.find(ab => ab.id === a).name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Segundo (+1)</label>
        <select class="form-control" id="selectBgSecondary">
          ${validAbilities.map(a => `<option value="${a}" ${character.backgroundBonuses.secondary === a ? 'selected' : ''}>+1 em ${DND5E_DATA.abilities.find(ab => ab.id === a).name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Terceiro (+1)</label>
        <select class="form-control" id="selectBgTertiary">
          ${validAbilities.map(a => `<option value="${a}" ${character.backgroundBonuses.tertiary === a ? 'selected' : ''}>+1 em ${DND5E_DATA.abilities.find(ab => ab.id === a).name}</option>`).join('')}
        </select>
      </div>
    `;
  }

  container.innerHTML = html;

  document.getElementById("selectBgBonusMode").addEventListener("change", (e) => {
    character.backgroundBonusMode = e.target.value;
    updateBackgroundBonusSelectors();
    initCustomBackgroundPanel();
    renderSpeciesBackgroundSummary();
    recalculateCharacter();
  });

  document.getElementById("selectBgPrimary").addEventListener("change", (e) => {
    character.backgroundBonuses.primary = e.target.value;
    initCustomBackgroundPanel();
    renderSpeciesBackgroundSummary();
    recalculateCharacter();
  });

  document.getElementById("selectBgSecondary").addEventListener("change", (e) => {
    character.backgroundBonuses.secondary = e.target.value;
    initCustomBackgroundPanel();
    renderSpeciesBackgroundSummary();
    recalculateCharacter();
  });

  const tertiaryEl = document.getElementById("selectBgTertiary");
  if (tertiaryEl) {
    tertiaryEl.addEventListener("change", (e) => {
      character.backgroundBonuses.tertiary = e.target.value;
      initCustomBackgroundPanel();
      renderSpeciesBackgroundSummary();
      recalculateCharacter();
    });
  }
}

/**
 * Renderiza o resumo de Espécie e Antecedente no Passo 1
 */
function renderSpeciesBackgroundSummary() {
  const container = document.getElementById("speciesBackgroundSummary");
  const speciesObj = resolveSpeciesObj(character.species);
  const bgObj = DND5E_DATA.backgrounds.find(b => b.id === character.background);

  // Antes das escolhas o resumo não tem o que mostrar — fica vazio, não velho.
  if (!container) return;
  if (!speciesObj || !bgObj) { container.innerHTML = ""; return; }

  let traitsHtml = speciesObj.traits.map(t => `<strong>${t.name}:</strong> ${t.desc}`).join("<br>");

  // Espécie personalizada não tem traços de tabela: o resumo mostra o texto
  // que o jogador escreveu, que é tudo o que o app sabe sobre ela.
  if (speciesObj.isCustom) {
    const nivelTotal = character.level1 + (character.class2 && character.class2 !== "none" ? character.level2 : 0);
    const linhas = traitsDaEspecieNoNivel(speciesObj, nivelTotal)
      .map(t => `<strong>${t.level > 1 ? `[Nvl ${t.level}] ` : ""}${t.name}:</strong> ${t.desc}`);
    const sobre = (speciesObj.about || "").replace(/\n/g, "<br>");
    traitsHtml = [sobre, ...linhas].filter(Boolean).join("<br>")
      || "<em>Descreva a espécie nos campos acima: “Sobre”, visão no escuro, idiomas, proficiências e traços por nível.</em>";
  }
  
  if (character.lineage && character.lineage !== "none") {
    const linObj = speciesObj.lineages.find(l => l.id === character.lineage);
    if (linObj) {
      traitsHtml += `<br><strong>Linhagem (${linObj.name}):</strong> ${linObj.desc}`;
    }
  }

  let featDesc = "";
  let featName = bgObj.featName;
  let skillsDesc = "";
  let toolsDesc = bgObj.tools ? bgObj.tools.join(", ") : "";
  let bonusDesc = "";

  if (bgObj.isCustom) {
    const chosenFeat = DND5E_DATA.feats.find(f => f.id === character.customBg.feat);
    featName = chosenFeat ? chosenFeat.name : "Talento Customizado";
    featDesc = chosenFeat ? chosenFeat.desc : "";
    const s1 = DND5E_DATA.skills.find(s => s.id === character.customBg.skill1);
    const s2 = DND5E_DATA.skills.find(s => s.id === character.customBg.skill2);
    skillsDesc = `${s1 ? s1.name : character.customBg.skill1}, ${s2 ? s2.name : character.customBg.skill2}`;
    toolsDesc = getCustomBgToolName();

    if (character.backgroundBonusMode === "+2/+1") {
      const pName = DND5E_DATA.abilities.find(a => a.id === character.backgroundBonuses.primary)?.abbr || "FOR";
      const sName = DND5E_DATA.abilities.find(a => a.id === character.backgroundBonuses.secondary)?.abbr || "CON";
      bonusDesc = `+2 em ${pName}, +1 em ${sName}`;
    } else {
      const pName = DND5E_DATA.abilities.find(a => a.id === character.backgroundBonuses.primary)?.abbr || "FOR";
      const sName = DND5E_DATA.abilities.find(a => a.id === character.backgroundBonuses.secondary)?.abbr || "DES";
      const tName = DND5E_DATA.abilities.find(a => a.id === character.backgroundBonuses.tertiary)?.abbr || "CON";
      bonusDesc = `+1 em ${pName}, +1 em ${sName}, +1 em ${tName}`;
    }
  } else {
    const featObj = DND5E_DATA.feats.find(f => f.id === bgObj.feat);
    featDesc = featObj ? featObj.desc : "";
    skillsDesc = bgObj.skills.map(s => DND5E_DATA.skills.find(sk => sk.id === s)?.name || s).join(", ");
  }

  const langsStr = getFormattedLanguages();

  container.innerHTML = `
    <h4><i class="fa-solid fa-dna"></i> Traços da Espécie (${speciesObj.name})</h4>
    <p style="margin-bottom: 0.6rem;">${traitsHtml}</p>
    <h4><i class="fa-solid fa-scroll"></i> Antecedente (${getBackgroundLabel(bgObj)}) • Talento de Origem: ${featName}</h4>
    <p>${featDesc}</p>
    <p style="margin-top: 0.3rem; font-size: 0.8rem; color: #94a3b8;">
      <strong>Perícias:</strong> ${skillsDesc} | 
      <strong>Ferramentas:</strong> ${toolsDesc}
      ${bonusDesc ? ` | <strong>Bônus de Atributos:</strong> ${bonusDesc}` : ''}<br>
      <strong>Idiomas Conhecidos:</strong> ${langsStr}
    </p>
  `;
}

/**
 * Renderiza a grade de inputs de atributos no Passo 2
 */
function renderAbilityInputs() {
  const container = document.getElementById("abilityInputsGrid");
  container.innerHTML = "";

  DND5E_DATA.abilities.forEach(ab => {
    const val = character.baseScores[ab.id] || 10;
    const mod = Math.floor((val - 10) / 2);
    const modStr = mod >= 0 ? `+${mod}` : `${mod}`;

    const box = document.createElement("div");
    box.className = "ability-input-box";
    box.id = `box_attr_${ab.id}`;
    box.innerHTML = `
      <span class="ability-name-tag">${ab.abbr}</span>
      <div class="ability-spinner">
        <button class="spin-btn" data-attr="${ab.id}" data-delta="-1" ${character.abilityMode === 'pointbuy' && val <= 8 ? 'disabled' : ''}>-</button>
        <span class="ability-val-display" id="val_attr_${ab.id}">${val}</span>
        <button class="spin-btn" data-attr="${ab.id}" data-delta="1" ${character.abilityMode === 'pointbuy' && val >= 15 ? 'disabled' : ''}>+</button>
      </div>
      <span class="ability-mod-tag" id="mod_attr_${ab.id}">Mod: ${modStr}</span>
      <span class="ability-bonus-sub" id="bonus_sub_${ab.id}">+0 bônus</span>
    `;
    container.appendChild(box);
  });

  container.querySelectorAll(".spin-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const attr = e.target.getAttribute("data-attr");
      const delta = parseInt(e.target.getAttribute("data-delta"));
      modifyBaseScore(attr, delta);
    });
  });

  updatePointBuyBudgetDisplay();
}

/**
 * Modifica o valor base de um atributo
 */
function modifyBaseScore(attr, delta) {
  const current = character.baseScores[attr] || 10;
  const target = current + delta;

  if (character.abilityMode === "pointbuy") {
    if (target < 8 || target > 15) return;
    const newScores = { ...character.baseScores, [attr]: target };
    const cost = calculatePointBuyTotal(newScores);
    if (cost > 27) {
      showToast("⚠️ Pontos insuficientes para esta compra (máximo 27 pontos)!");
      return;
    }
  } else if (character.abilityMode === "manual" || character.abilityMode === "roll") {
    if (target < 3 || target > 30) return;
  }

  character.baseScores[attr] = target;
  renderAbilityInputs();
  recalculateCharacter();
}

/**
 * Calcula o custo de point buy
 */
function calculatePointBuyTotal(scores) {
  let total = 0;
  for (const key in scores) {
    const val = scores[key];
    total += DND5E_DATA.pointBuyCosts[val] !== undefined ? DND5E_DATA.pointBuyCosts[val] : 0;
  }
  return total;
}

/**
 * Atualiza a exibição da barra de orçamento do Point Buy
 */
function updatePointBuyBudgetDisplay() {
  const budgetBar = document.getElementById("pointBuyBudgetBar");
  const budgetVal = document.getElementById("pointBuyRemaining");
  
  if (character.abilityMode === "pointbuy") {
    budgetBar.style.display = "flex";
    const spent = calculatePointBuyTotal(character.baseScores);
    const remaining = 27 - spent;
    budgetVal.textContent = `${remaining} / 27`;
    budgetVal.style.color = remaining === 0 ? "#10b981" : remaining < 0 ? "#ef4444" : "#c084fc";
  } else {
    budgetBar.style.display = "none";
  }
}

/**
 * Rola 4d6 (descarta menor) para os 6 atributos
 */
function roll4d6Stats() {
  const historyEl = document.getElementById("rollResultsHistory");
  const results = [];
  const rolledScores = {};
  const attrs = ["str", "dex", "con", "int", "wis", "cha"];

  attrs.forEach(a => {
    const dice = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ];
    dice.sort((x, y) => x - y);
    const dropped = dice[0];
    const sum = dice[1] + dice[2] + dice[3];
    rolledScores[a] = sum;
    results.push(`<strong>${DND5E_DATA.abilities.find(ab => ab.id === a).abbr}:</strong> [${dice.join(", ")} drop ${dropped}] = <strong>${sum}</strong>`);
  });

  character.baseScores = rolledScores;
  historyEl.innerHTML = results.join(" | ");
  renderAbilityInputs();
  recalculateCharacter();
  showToast("🎲 Atributos rolados com sucesso via 4d6!");
}

/**
 * Atualiza o seletor de perícias no Passo 3
 */
function updateSkillsSelector() {
  const container = document.getElementById("skillsSelectorGrid");
  const classObj = resolveClassObj(character.class1, 1) || EMPTY_CLASS;
  const bgObj = DND5E_DATA.backgrounds.find(b => b.id === character.background) || EMPTY_BACKGROUND;

  if (!container) return;

  container.innerHTML = "";

  const allowedSkills = classObj.skillChoices ? classObj.skillChoices.list : [];
  const maxChoiceCount = classObj.skillChoices ? classObj.skillChoices.count : 2;
  const bgSkills = bgObj.isCustom ? [character.customBg.skill1, character.customBg.skill2] : (bgObj.skills || []);

  document.getElementById("skillsChoiceLabel").textContent = `Perícias da Classe (Escolha até ${maxChoiceCount} opções da lista da classe):`;

  DND5E_DATA.skills.forEach(sk => {
    const isBgSkill = bgSkills.includes(sk.id);
    const isAllowed = allowedSkills.includes(sk.id);
    const isChecked = character.trainedSkills.includes(sk.id) || isBgSkill;

    const item = document.createElement("label");
    item.className = "skill-select-item";
    item.innerHTML = `
      <input type="checkbox" value="${sk.id}" ${isChecked ? 'checked' : ''} ${isBgSkill ? 'disabled' : ''}>
      <span><strong>${sk.name}</strong> <small style="color: #94a3b8;">(${DND5E_DATA.abilities.find(a => a.id === sk.ability).abbr})${isBgSkill ? ' [Antecedente]' : isAllowed ? ' [Classe]' : ''}</small></span>
    `;

    const checkbox = item.querySelector("input");
    checkbox.addEventListener("change", (e) => {
      const skId = e.target.value;
      if (e.target.checked) {
        if (!character.trainedSkills.includes(skId)) {
          character.trainedSkills.push(skId);
        }
      } else {
        character.trainedSkills = character.trainedSkills.filter(s => s !== skId);
      }
      recalculateCharacter();
    });

    container.appendChild(item);
  });
}

/**
 * Atualiza a lista de talentos oficiais e customizados no Passo 3
 */
/* Filtros da lista de talentos. Ficam fora do `character` de propósito: são
   estado da tela, não escolha do personagem, e não devem ir para a ficha salva. */
let _featFilterState = { busca: "", tipo: "all", soMeus: false };

/* ------------------------------------------- USOS DE CARACTERÍSTICA */

/**
 * Características de uso limitado que a classe concede no nível atual.
 *
 * Os números saem da coluna própria de cada tabela de classe (Fúrias,
 * Recuperar Fôlego, Canalizar Divindade, Inimigo Favorito, Forma Selvagem,
 * Pontos de Foco, Pontos de Feitiçaria) e a recuperação vem do texto da
 * característica: umas voltam no Descanso Curto, outras só no Longo.
 */
function getLimitedUses() {
  const lista = [];

  // Uma classe pode ter mais de uma característica contada. O modelo antigo
  // guardava só uma (`limitedUse`, singular) e por isso o Guerreiro aparecia
  // com Recuperar Fôlego mas sem Surto de Ação, e Bardo, Ladino, Bruxo e Mago
  // apareciam sem característica nenhuma. Agora é lista (`limitedUses`); o
  // campo antigo continua sendo lido para não quebrar uma ficha salva com uma
  // versão de data.js anterior.
  const daClasse = (classId, nivel) => {
    const c = DND5E_DATA.classes.find(x => x.id === classId);
    if (!c || nivel < 1) return;

    const usos = Array.isArray(c.limitedUses) ? c.limitedUses
               : (c.limitedUse ? [c.limitedUse] : []);

    usos.forEach(u => {
      // Inspiração de Bardo e afins não têm tabela por nível: são "tantos
      // quanto o seu modificador", e mudam quando o atributo muda.
      const max = u.perAbilityMod
        ? Math.max(u.min || 1, (_ultimosMods || {})[u.perAbilityMod] || 0)
        : (u.byLevel && u.byLevel[nivel]) || 0;
      if (!max) return;

      lista.push({
        id: u.id,
        name: u.name,
        classe: c.name.split(" (")[0],
        max,
        recovery: u.recovery,
        gastos: (character.featureUses && character.featureUses[u.id]) || 0
      });
    });
  };
  daClasse(character.class1, character.level1);
  if (character.class2 && character.class2 !== "none") daClasse(character.class2, character.level2);
  return lista;
}

/** Gasta ou devolve um uso, sem passar dos limites. */
function changeFeatureUse(id, delta) {
  const item = getLimitedUses().find(u => u.id === id);
  if (!item) return;
  const novo = Math.max(0, Math.min(item.max, item.gastos + delta));
  if (novo === item.gastos) {
    if (delta > 0) showToast(`Sem usos de ${item.name.split(" (")[0]} disponíveis.`);
    return;
  }
  character.featureUses = character.featureUses || {};
  character.featureUses[id] = novo;
  logHpEvent("uso", `${item.name.split(" (")[0]}: ${item.max - novo} de ${item.max}`,
             character.currentHp || 0);
}

/** Devolve os usos que recuperam no descanso indicado ("curto" ou "longo"). */
function recoverFeatureUses(tipo) {
  const devolvidos = [];
  getLimitedUses().forEach(u => {
    // o que volta no Descanso Curto também volta no Longo
    const volta = u.recovery === "curto" || tipo === "longo";
    if (!volta || !u.gastos) return;
    character.featureUses[u.id] = 0;
    devolvidos.push(u.name.split(" (")[0]);
  });
  return devolvidos;
}

function renderFeatureUses() {
  const box = document.getElementById("featureUsesList");
  if (!box) return;
  const lista = getLimitedUses();
  box.innerHTML = lista.length
    ? lista.map(u => {
        const restam = u.max - u.gastos;
        const bolinhas = Array.from({ length: u.max }, (_, i) =>
          `<span class="uso-ponto${i < restam ? " is-cheio" : ""}"></span>`).join("");
        return `<div class="uso-linha">
          <span class="uso-nome">${u.name.split(" (")[0]}
            <small>${u.classe} • volta no Descanso ${u.recovery === "curto" ? "Curto" : "Longo"}</small>
          </span>
          <span class="uso-pontos" title="${restam} de ${u.max}">${bolinhas}</span>
          <span class="uso-botoes">
            <button type="button" class="uso-btn" data-uso="${u.id}" data-delta="1"
                    ${restam <= 0 ? "disabled" : ""} title="Gastar um uso">−</button>
            <button type="button" class="uso-btn" data-uso="${u.id}" data-delta="-1"
                    ${u.gastos <= 0 ? "disabled" : ""} title="Devolver um uso">+</button>
          </span>
        </div>`;
      }).join("")
    : '<p class="hp-dado-vazio">Esta classe não tem característica de uso limitado com contador.</p>';
}

/* ------------------------------------------------- ESPAÇOS DE MAGIA */

/**
 * Espaços de magia por círculo, do 1º ao 9º.
 *
 * Sai da mesma fonte da ficha: a tabela da classe, com o total que o jogador
 * tiver escrito à mão por cima. Sem isso, o painel e a ficha discordariam.
 */
/**
 * A linha de nove círculos da tabela oficial, no nível pedido.
 *
 * A Magia de Pacto do Bruxo não tem uma linha de nove círculos: são N espaços,
 * todos do mesmo círculo, e a tabela guarda isso como { count, level }. Quem
 * tratava toda tabela como vetor chamava .map num objeto — qualquer Bruxo
 * derrubava o painel de espaços, e a ficha A4 mostrava nove zeros. Aqui a forma
 * do pacto vira o mesmo vetor de nove posições que as outras usam.
 */
function linhaDeEspacosDaTabela(tipo, nivel) {
  const tabela = DND5E_DATA.spellSlotsTable[tipo] || DND5E_DATA.spellSlotsTable.full;
  const bruta = tabela[nivel];
  if (!bruta) return [0, 0, 0, 0, 0, 0, 0, 0, 0];
  return Array.isArray(bruta)
    ? bruta.slice()
    : Array.from({ length: 9 }, (_, i) => (i + 1 === bruta.level ? bruta.count : 0));
}

/**
 * Total de espaços de um círculo: o que o jogador escreveu na ficha vence a
 * tabela — mas só se for número.
 *
 * O campo da ficha guarda texto. Uma ficha ainda em branco guardava "" em todos
 * os círculos, e o painel de jogo descartava a linha inteira — texto vazio não
 * é zero, mas também não é um total: sobrava só o 1º círculo, o único com
 * número. Um zero guardado como texto fazia o contrário, desenhando linhas de
 * "0 de 0" para círculos que o personagem nem tem.
 */
function totalDeEspacos(auto, manual) {
  const n = parseInt(manual, 10);
  return Number.isFinite(n) ? n : auto;
}

function getSpellSlotRow() {
  const c1 = resolveClassObj(character.class1, 1);
  const c2 = character.class2 !== "none" ? resolveClassObj(character.class2, 2) : null;
  const conj = (c1 && c1.spellcasting) ? c1 : (c2 && c2.spellcasting ? c2 : null);
  const nivel = (character.level1 || 0) + (c2 ? (character.level2 || 0) : 0);
  const tipo = conj && conj.spellcasting ? conj.spellcasting.type : "full";
  const linha = conj ? linhaDeEspacosDaTabela(tipo, nivel) : [0, 0, 0, 0, 0, 0, 0, 0, 0];

  const ov = sheetOv();
  return linha.map((auto, i) => {
    const manual = ov.slots && ov.slots[i + 1] ? ov.slots[i + 1].total : undefined;
    return totalDeEspacos(auto, manual);
  });
}

function changeSpellSlot(nivel, delta) {
  const totais = getSpellSlotRow();
  const total = totais[nivel - 1] || 0;
  if (!total) return;
  const gastos = character.spellSlotsExpended[nivel] || 0;
  const novo = Math.max(0, Math.min(total, gastos + delta));
  if (novo === gastos) {
    if (delta > 0) showToast(`Sem espaços de ${nivel}º círculo disponíveis.`);
    return;
  }
  character.spellSlotsExpended[nivel] = novo;
  logHpEvent("magia", `Espaço de ${nivel}º círculo: ${total - novo} de ${total}`, character.currentHp || 0);
}

/**
 * De onde vem cada magia que o personagem tem sem gastar escolha da classe.
 * O antecedente aparece separado do talento comum: no livro de 2024 ele concede
 * um talento de Origem, e é essa a diferença que o jogador quer ver.
 */
function getGrantedSpellsBySource() {
  const grupos = {};
  getGrantedSpellEntries().forEach(g => {
    const sp = DND5E_DATA.spells.find(x => x.id === g.id);
    const tipo = g.tipo || "Espécie";
    (grupos[tipo] = grupos[tipo] || []).push({
      id: g.id,
      nome: sp ? sp.name.split(" (")[0] : g.id,
      circulo: sp ? sp.level : 0,
      fonte: g.source
    });
  });
  return grupos;
}

/* Como uma magia concedida vai para a mesa. Truque é à vontade; o que vem de
   talento, antecedente ou espécie o livro de 2024 deixa conjurar uma vez por
   Descanso Longo sem gastar espaço (e com espaço, se o personagem tiver); o que
   a classe ou a subclasse concede já vem preparado e gasta espaço do círculo. */
function comoSeConjura(tipo, circulo) {
  if (circulo === 0) return { chave: "livre", rotulo: "à vontade" };
  if (tipo === "Talento" || tipo === "Antecedente" || tipo === "Espécie") {
    return { chave: "gratis", rotulo: "1x por descanso longo" };
  }
  return { chave: "espaco", rotulo: `espaço de ${circulo}º` };
}

/**
 * As magias que podem ser conjuradas de graça, uma vez por Descanso Longo.
 *
 * Elas não aparecem na tabela de espaços — o Passo Nebuloso do talento é de 2º
 * círculo num Paladino de 3º nível, que não tem espaço de 2º — e sem um lugar
 * para marcar o uso, a única conta que a mesa tinha era a memória do jogador.
 */
function getFreeCastSpells() {
  return getGrantedSpellEntries().map(g => {
    const sp = DND5E_DATA.spells.find(x => x.id === g.id);
    const circulo = sp ? sp.level : 0;
    const modo = comoSeConjura(g.tipo || "Espécie", circulo);
    if (modo.chave !== "gratis") return null;
    return {
      id: g.id,
      nome: sp ? sp.name.split(" (")[0] : g.id,
      circulo,
      fonte: g.source,
      tipo: g.tipo || "Espécie",
      gastos: (character.freeCasts && character.freeCasts[g.id]) || 0
    };
  }).filter(Boolean);
}

/** Gasta ou devolve a conjuração grátis de uma magia */
function changeFreeCast(id, delta) {
  const item = getFreeCastSpells().find(m => m.id === id);
  if (!item) return;
  const novo = Math.max(0, Math.min(1, item.gastos + delta));
  if (novo === item.gastos) {
    if (delta > 0) showToast(`${item.nome} já foi conjurada de graça neste descanso.`);
    return;
  }
  character.freeCasts = character.freeCasts || {};
  character.freeCasts[id] = novo;
  logHpEvent("magia", `${item.nome}: conjuração grátis ${novo ? "gasta" : "de volta"}`, character.currentHp || 0);
}

function renderSpellSlots() {
  const box = document.getElementById("spellSlotsPanel");
  if (!box) return;
  const totais = getSpellSlotRow();
  const temAlgum = totais.some(t => t > 0);

  /* Até onde mostrar as linhas de círculo: o maior círculo com espaço, ou o
     maior círculo de magia que está na ficha. Um Paladino de 3º nível com Passo
     Nebuloso pelo talento precisa ver que não tem espaço de 2º — antes a linha
     simplesmente não existia, e a magia aparecia na lista de origem sem nada
     acima dizendo com o que se conjura. */
  const circuloDeMagiaNaFicha = () => {
    const ids = [...(character.spellsKnown || []), ...getGrantedSpellEntries().map(g => g.id)];
    return ids.reduce((maior, id) => {
      const sp = DND5E_DATA.spells.find(x => x.id === id);
      return sp && sp.level > maior ? sp.level : maior;
    }, 0);
  };
  const ultimoCirculo = Math.max(
    totais.reduce((m, t, i) => (t > 0 ? i + 1 : m), 0),
    circuloDeMagiaNaFicha()
  );

  const linhas = totais.map((total, i) => {
    const nivel = i + 1;
    if (!total) {
      if (nivel > ultimoCirculo) return "";
      return `<div class="uso-linha is-vazia">
        <span class="uso-nome">${nivel}º Círculo <small>sem espaços neste nível</small></span>
      </div>`;
    }
    const gastos = character.spellSlotsExpended[nivel] || 0;
    const restam = total - gastos;
    const bolinhas = Array.from({ length: total }, (_, k) =>
      `<span class="uso-ponto${k < restam ? " is-cheio is-magia" : ""}"></span>`).join("");
    return `<div class="uso-linha">
      <span class="uso-nome">${nivel}º Círculo <small>${restam} de ${total}</small></span>
      <span class="uso-pontos" title="${restam} de ${total}">${bolinhas}</span>
      <span class="uso-botoes">
        <button type="button" class="uso-btn" data-slot="${nivel}" data-delta="1"
                ${restam <= 0 ? "disabled" : ""} title="Gastar um espaço">−</button>
        <button type="button" class="uso-btn" data-slot="${nivel}" data-delta="-1"
                ${gastos <= 0 ? "disabled" : ""} title="Devolver um espaço">+</button>
      </span>
    </div>`;
  }).join("");

  // Conjurações grátis (talento, antecedente, espécie): uma por Descanso Longo,
  // sem gastar espaço. Ficam junto dos espaços porque é ali que se conta o que
  // ainda dá para conjurar hoje.
  const gratis = getFreeCastSpells().map(m => {
    const restam = 1 - m.gastos;
    return `<div class="uso-linha">
      <span class="uso-nome">${m.nome}
        <small>${m.circulo === 0 ? "truque" : `${m.circulo}º círculo`} • ${m.tipo.toLowerCase()}, sem gastar espaço • volta no Descanso Longo</small>
      </span>
      <span class="uso-pontos" title="${restam} de 1"><span class="uso-ponto${restam ? " is-cheio is-magia" : ""}"></span></span>
      <span class="uso-botoes">
        <button type="button" class="uso-btn" data-freecast="${m.id}" data-delta="1"
                ${restam <= 0 ? "disabled" : ""} title="Gastar a conjuração grátis">−</button>
        <button type="button" class="uso-btn" data-freecast="${m.id}" data-delta="-1"
                ${m.gastos <= 0 ? "disabled" : ""} title="Devolver a conjuração grátis">+</button>
      </span>
    </div>`;
  }).join("");

  const grupos = getGrantedSpellsBySource();
  // "Classe" entrou junto das outras: sem ela, as magias concedidas pela
  // própria classe (Destruição Divina, Marca do Predador...) eram contadas na
  // capacidade mas não apareciam em nenhuma linha de origem.
  const ordem = ["Classe", "Subclasse", "Espécie", "Talento", "Antecedente"];

  // Uma linha por origem. Capacidade (o que dá para escolher) e concessão (o que
  // já vem pronto) são coisas diferentes e aparecem separadas: um Paladino com
  // Iniciado em Magia tem truques pelo talento, não pela classe.
  const cap = getSpellCapacityInfo(_ultimosMods || {});
  const idsConcedidos = new Set(cap.grantedSpells.map(g => g.id));
  const escolhidas = (character.spellsKnown || []).filter(id => !idsConcedidos.has(id));
  const spellDe = (id) => DND5E_DATA.spells.find(x => x.id === id);
  const ehTruque = (id) => {
    const sp = spellDe(id);
    return sp && sp.level === 0;
  };
  const truquesEscolhidos = escolhidas.filter(ehTruque).length;
  const magiasEscolhidas = escolhidas.length - truquesEscolhidos;

  // O que sobra de capacidade vem sempre da classe; o talento entra como folga
  const capClasse = cap.breakdown.filter(b => b.detalhe !== "talento");
  const capTalento = cap.breakdown.filter(b => b.detalhe === "talento");
  const somaT = (arr, campo) => arr.reduce((a, b) => a + b[campo], 0);

  const porCirculo = (a, b) => (a.circulo - b.circulo) || a.nome.localeCompare(b.nome);

  /* Um item da lista aberta: nome, círculo e o "i" que abre a descrição inteira
     — a mesma do catálogo, para não haver duas versões do mesmo texto. */
  const itemHtml = (m) => {
    const sp = spellDe(m.id);
    const aberta = _magiaInfoAberta.has(m.id);
    const modo = comoSeConjura(m.tipo, m.circulo);
    return `<div class="magia-item">
      <span class="magia-item-nome"${m.fonte ? ` title="${String(m.fonte).replace(/"/g, "&quot;")}"` : ""}>
        ${m.nome} <small>${m.circulo === 0 ? "truque" : `${m.circulo}º`}</small>
      </span>
      <span class="magia-item-modo is-${modo.chave}">${modo.rotulo}</span>
      ${sp ? `<button type="button" class="magia-item-info${aberta ? " is-open" : ""}" data-magia-info="${m.id}"
                      title="Ver a descrição da magia"><i class="fa-solid fa-info"></i></button>` : ""}
      ${sp ? `<div class="magia-item-desc" data-magia-desc="${m.id}"${aberta ? "" : " hidden"}>${buildSpellInfoHtml(sp)}</div>` : ""}
    </div>`;
  };

  /* Uma linha de contagem. Quando há magias por trás do número, ganha o "+"
     que abre a lista; o estado de aberto/fechado mora fora do render porque o
     painel se redesenha a cada espaço gasto. */
  const linhaConta = (chave, tipo, texto, magias, alerta) => {
    const lista = (magias || []).slice().sort(porCirculo);
    const temLista = lista.length > 0;
    const aberto = temLista && _magiaOrigemAberta.has(chave);
    return `<div class="magia-conta${alerta ? " is-alerta" : ""}">
         ${temLista
           ? `<button type="button" class="magia-conta-exp" data-origem="${chave}"
                      title="${aberto ? "Fechar" : "Ver as magias"}">${aberto ? "−" : "+"}</button>`
           : `<span class="magia-conta-exp is-vazio"></span>`}
         <span class="magia-conta-tipo">${tipo}</span>
         <span class="magia-conta-num">${texto}</span>
       </div>
       ${temLista ? `<div class="magia-conta-lista" data-origem-lista="${chave}"${aberto ? "" : " hidden"}>${lista.map(itemHtml).join("")}</div>` : ""}`;
  };

  const contas = [];
  if (capClasse.length) {
    contas.push(linhaConta("cap-classe", "Classe (capacidade)",
      `${somaT(capClasse, "truques")} truques · ${somaT(capClasse, "preparadas")} preparadas`));
  }
  capTalento.forEach((b, i) => {
    contas.push(linhaConta(`cap-talento-${i}`, `${b.origem || "Talento"} (capacidade)`,
      `${b.fonte}: ${b.truques ? `${b.truques} truque(s)` : ""}${b.truques && b.preparadas ? " · " : ""}${b.preparadas ? `${b.preparadas} magia(s)` : ""} para escolher`));
  });

  // As escolhidas são as magias da classe: saem da capacidade dela e é por isso
  // que aparecem como fração. As concedidas, abaixo, não gastam nada.
  contas.push(linhaConta("escolhidas", "Classe (escolhidas)",
    `${truquesEscolhidos} / ${cap.maxCantrips} truques · ${magiasEscolhidas} / ${cap.maxPrepared} preparadas`,
    escolhidas.map(id => {
      const sp = spellDe(id);
      return { id, nome: sp ? sp.name.split(" (")[0] : id, circulo: sp ? sp.level : 0, fonte: "Escolhida no catálogo", tipo: "Classe" };
    }),
    truquesEscolhidos > cap.maxCantrips || magiasEscolhidas > cap.maxPrepared));

  ordem.filter(k => grupos[k]).forEach(k => {
    const truques = grupos[k].filter(m => m.circulo === 0).length;
    const magias = grupos[k].length - truques;
    const partes = [];
    if (truques) partes.push(`${truques} truque(s)`);
    if (magias) partes.push(`${magias} magia(s)`);
    contas.push(linhaConta(`concedidas-${k}`, `${k} (concedidas)`,
      `${partes.join(" · ")} — sempre prontas`, grupos[k].map(m => ({ ...m, tipo: k }))));
  });

  // Um personagem que não conjura nada não precisa ver "Esta classe não tem
  // espaços de magia" nem uma linha "Escolhidas 0 / 0 truques · 0 / 0
  // preparadas": são três avisos dizendo a mesma coisa, e a mesma coisa é
  // "isto aqui não é para você". O bloco inteiro sai do painel.
  const temMagia = temAlgum
    || cap.maxCantrips > 0
    || cap.maxPrepared > 0
    || cap.grantedSpells.length > 0
    || escolhidas.length > 0;

  const bloco = document.getElementById("blocoMagias");
  if (bloco) bloco.style.display = temMagia ? "" : "none";

  if (!temMagia) {
    box.innerHTML = "";
    return;
  }

  // Aqui já se sabe que o personagem lida com magia de alguma forma. Se ainda
  // assim não tem espaços (um Bruxo de truque só, um Guerreiro com Iniciado em
  // Magia), a frase explica a ausência em vez de deixar um vazio sem motivo.
  box.innerHTML = (temAlgum || linhas ? linhas : '<p class="hp-dado-vazio">Esta classe não tem espaços de magia neste nível.</p>')
    + gratis
    + `<div class="magia-contas">
         <div class="cond-cabeca"><span>Magias por origem</span></div>
         <p class="magia-contas-dica">Toque no <strong>+</strong> para ver as magias de cada origem e no <strong>i</strong> para a descrição.</p>
         ${contas.join("")}
       </div>`;
}

/* Quais origens e quais descrições estão abertas. Fica fora do render porque o
   painel se redesenha inteiro a cada espaço de magia gasto, e fechar na cara do
   jogador o que ele acabou de abrir no meio do turno é perder a informação. */
const _magiaOrigemAberta = new Set();
const _magiaInfoAberta = new Set();

/** Abre/fecha uma origem ou a descrição de uma magia no painel de jogo */
function toggleMagiaPainel(e) {
  const exp = e.target.closest("[data-origem]");
  if (exp) {
    const chave = exp.getAttribute("data-origem");
    const lista = document.querySelector(`[data-origem-lista="${chave}"]`);
    if (!lista) return true;
    const abrir = lista.hidden;
    lista.hidden = !abrir;
    exp.textContent = abrir ? "−" : "+";
    exp.title = abrir ? "Fechar" : "Ver as magias";
    if (abrir) _magiaOrigemAberta.add(chave); else _magiaOrigemAberta.delete(chave);
    return true;
  }

  const info = e.target.closest("[data-magia-info]");
  if (info) {
    const id = info.getAttribute("data-magia-info");
    const desc = document.querySelector(`[data-magia-desc="${id}"]`);
    if (!desc) return true;
    const abrir = desc.hidden;
    desc.hidden = !abrir;
    info.classList.toggle("is-open", abrir);
    if (abrir) _magiaInfoAberta.add(id); else _magiaInfoAberta.delete(id);
    return true;
  }

  return false;
}

/* ------------------------------------------------------------- CONDIÇÕES */

/**
 * Texto da condição na forma do livro: a frase de abertura e, abaixo, um item
 * por efeito com o título em destaque. O parágrafo corrido de antes escondia
 * exatamente a parte que se consulta no meio do turno.
 */
function conditionHtml(c) {
  const itens = (c.effects || []).map(e =>
    `<li><strong>${e.title}.</strong> ${e.text}</li>`).join("");
  return `<strong class="cond-titulo">${c.name}</strong>
    <p class="cond-intro">${c.intro || ""}</p>
    ${itens ? `<ul class="cond-efeitos">${itens}</ul>` : `<p>${c.desc}</p>`}`;
}

function hasCondition(id) {
  return (character.conditions || []).includes(id);
}

/**
 * Liga ou desliga uma condição. A Exaustão é diferente: em vez de ligar e
 * desligar, ela sobe de nível (1 a 6, e no 6 o personagem morre), então os
 * botões dela mexem no nível.
 */
function toggleCondition(id) {
  if (!Array.isArray(character.conditions)) character.conditions = [];
  const cond = DND5E_DATA.conditions.find(c => c.id === id);
  if (!cond) return;
  const i = character.conditions.indexOf(id);
  if (i >= 0) {
    character.conditions.splice(i, 1);
    if (id === "exaustao") character.exhaustionLevel = 0;
    logHpEvent("condicao", `Saiu de ${cond.name.split(" (")[0]}`, character.currentHp || 0);
  } else {
    character.conditions.push(id);
    if (id === "exaustao" && !character.exhaustionLevel) character.exhaustionLevel = 1;
    logHpEvent("condicao", `Ficou ${cond.name.split(" (")[0]}`, character.currentHp || 0);
  }
}

/** Sobe ou desce o nível de Exaustão, entre 0 e 6. */
function changeExhaustion(delta) {
  const antes = character.exhaustionLevel || 0;
  const novo = Math.max(0, Math.min(6, antes + delta));
  if (novo === antes) return;
  character.exhaustionLevel = novo;
  character.conditions = character.conditions || [];
  const marcada = character.conditions.includes("exaustao");
  if (novo > 0 && !marcada) character.conditions.push("exaustao");
  if (novo === 0 && marcada) character.conditions = character.conditions.filter(c => c !== "exaustao");
  logHpEvent("condicao", `Exaustão nível ${novo}`, character.currentHp || 0);
  if (novo === 6) showToast("💀 Exaustão nível 6: o personagem morre.");
}

/**
 * Painel de condições: uma etiqueta por condição, com o texto do livro no
 * clique do "i". As condições mudam rolagem e movimento, e ficar lembrando
 * quais estão ativas de cabeça é o que mais atrasa o turno.
 */
function renderConditions() {
  const box = document.getElementById("conditionsList");
  if (!box) return;
  box.innerHTML = (DND5E_DATA.conditions || []).map(c => {
    const on = hasCondition(c.id);
    const nivel = c.id === "exaustao" ? (character.exhaustionLevel || 0) : 0;
    return `
      <div class="cond-item${on ? " is-on" : ""}">
        <button type="button" class="cond-btn" data-cond="${c.id}" title="${c.name}">
          <i class="fa-solid ${c.icon}"></i>
          <span>${c.name.split(" (")[0]}${c.id === "exaustao" && nivel ? ` ${nivel}` : ""}</span>
        </button>
        ${c.id === "exaustao" ? `
          <span class="cond-niveis">
            <button type="button" class="cond-nivel" data-exaustao="-1" title="Baixar um nível">−</button>
            <button type="button" class="cond-nivel" data-exaustao="1" title="Subir um nível">+</button>
          </span>` : ""}
        <button type="button" class="cond-info" data-cond-info="${c.id}" title="O que diz o livro">
          <i class="fa-solid fa-circle-info"></i>
        </button>
      </div>`;
  }).join("");

  const ativas = (character.conditions || []).length;
  const resumo = document.getElementById("conditionsResumo");
  if (resumo) {
    resumo.textContent = ativas ? `${ativas} ativa(s)` : "nenhuma ativa";
  }
}

/* ---------------------------------------------- CONTROLE DE PONTOS DE VIDA */

const HP_LOG_ICONE = {
  dano: "fa-burst", cura: "fa-kit-medical", temp: "fa-shield-halved",
  dado: "fa-dice-d6", descanso: "fa-moon", condicao: "fa-triangle-exclamation",
  rolagem: "fa-dice-d20", uso: "fa-bolt-lightning",
  magia: "fa-wand-sparkles", arma: "fa-gavel", talento: "fa-star",
  edicao: "fa-pen-to-square"
};

/** Últimos acontecimentos de vida, do mais recente para o mais antigo. */
function renderHpLog() {
  const box = document.getElementById("hpLogLista");
  if (!box) return;
  const log = character.hpLog || [];
  if (!log.length) {
    box.innerHTML = '<p class="hp-log-vazio">Nada registrado ainda. Dano, cura, temporários e descansos aparecem aqui.</p>';
    return;
  }
  box.innerHTML = log.map(e => `
    <div class="hp-log-linha is-${e.tipo}">
      <i class="fa-solid ${HP_LOG_ICONE[e.tipo] || "fa-circle"}"></i>
      <span class="hp-log-texto">${e.texto}</span>
      <span class="hp-log-pv">${e.pv} PV</span>
      <span class="hp-log-hora">${e.hora}</span>
    </div>`).join("");
}

/* Quantos acontecimentos ficam guardados. O suficiente para reconstruir um
   combate sem inchar a ficha salva. */
const HP_LOG_MAX = 30;

/**
 * Anota um acontecimento de vida. `pv` é como o personagem ficou depois dele,
 * para a lista poder ser lida de cima para baixo sem refazer as contas.
 */
function logHpEvent(tipo, texto, pv) {
  if (!Array.isArray(character.hpLog)) character.hpLog = [];
  character.hpLog.unshift({
    tipo,
    texto,
    pv,
    hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  });
  character.hpLog = character.hpLog.slice(0, HP_LOG_MAX);
}

/**
 * Dados de Vida do personagem: um bloco por classe, com o dado e o total.
 * Em multiclasse são dois blocos, e cada um se gasta separado.
 */
function getHitDicePools() {
  const blocos = [];
  const add = (classId, nivel) => {
    const c = DND5E_DATA.classes.find(x => x.id === classId);
    if (!c || !c.hitDie || nivel < 1) return;
    const chave = `d${c.hitDie}`;
    const existente = blocos.find(b => b.chave === chave);
    if (existente) existente.total += nivel;
    else blocos.push({ chave, faces: c.hitDie, total: nivel, classe: c.name.split(" (")[0] });
  };
  add(character.class1, character.level1);
  if (character.class2 && character.class2 !== "none") add(character.class2, character.level2);
  return blocos;
}

function hitDiceSpentOf(chave) {
  return (character.hitDiceSpent && character.hitDiceSpent[chave]) || 0;
}

/**
 * Aplica dano. Os Pontos de Vida Temporários absorvem primeiro e não voltam
 * depois — é assim no livro, e era o erro mais fácil de cometer na mão.
 */
function applyDamage(valor) {
  const dano = Math.max(0, Math.floor(valor) || 0);
  if (!dano) return;
  const temp = character.tempHp || 0;
  const absorvido = Math.min(temp, dano);
  character.tempHp = temp - absorvido;
  character.currentHp = Math.max(0, (character.currentHp || 0) - (dano - absorvido));
  const resto = dano - absorvido;
  logHpEvent("dano", `−${dano}${absorvido ? ` (${absorvido} nos temporários)` : ""}`, character.currentHp);
  showToast(`💥 ${dano} de dano${absorvido ? ` (${absorvido} nos temporários)` : ""} — ${character.currentHp} PV`);
  if (character.currentHp === 0) showToast("💀 Você caiu a 0 PV: comece os testes de resistência de morte.");
  return resto;
}

/** Cura, sem passar do máximo. Não mexe nos temporários, que são à parte. */
function applyHealing(valor, maxHp) {
  const cura = Math.max(0, Math.floor(valor) || 0);
  if (!cura) return;
  const antes = character.currentHp || 0;
  character.currentHp = Math.min(maxHp, antes + cura);
  logHpEvent("cura", `+${character.currentHp - antes}`, character.currentHp);
  showToast(`💚 ${character.currentHp - antes} PV recuperados — ${character.currentHp} de ${maxHp}`);
}

/**
 * Pontos de Vida Temporários não somam: o livro manda escolher entre o valor
 * novo e o que já existe, e ficar com o maior.
 */
function applyTempHp(valor) {
  const novo = Math.max(0, Math.floor(valor) || 0);
  const atual = character.tempHp || 0;
  if (novo <= atual) {
    showToast(`🛡️ Você já tem ${atual} PV temporários — eles não se somam, fica o maior.`);
    return;
  }
  character.tempHp = novo;
  logHpEvent("temp", `${novo} temporários${atual ? ` (no lugar de ${atual})` : ""}`, character.currentHp || 0);
  showToast(`🛡️ ${novo} PV temporários${atual ? ` (substituindo ${atual})` : ""}`);
}

/** Gasta um Dado de Vida: rola o dado + modificador de Constituição e cura. */
function spendHitDie(chave, maxHp, conMod) {
  const bloco = getHitDicePools().find(b => b.chave === chave);
  if (!bloco) return;
  if (hitDiceSpentOf(chave) >= bloco.total) {
    showToast(`Sem Dados de Vida ${chave} disponíveis.`);
    return;
  }
  const rolagem = Math.floor(Math.random() * bloco.faces) + 1;
  const cura = Math.max(0, rolagem + conMod);
  character.hitDiceSpent = character.hitDiceSpent || {};
  character.hitDiceSpent[chave] = hitDiceSpentOf(chave) + 1;
  const antes = character.currentHp || 0;
  character.currentHp = Math.min(maxHp, antes + cura);
  const modStr = conMod >= 0 ? `+${conMod}` : `${conMod}`;
  logHpEvent("dado", `Dado de Vida ${chave}(${rolagem}) ${modStr} = +${character.currentHp - antes}`, character.currentHp);
  showToast(`🎲 Dado de Vida ${chave}(${rolagem}) ${modStr} = ${cura} — ${character.currentHp} de ${maxHp} PV`);
}

/**
 * Descanso Curto: não cura por si só. Quem recupera Pontos de Vida é gastar
 * Dado de Vida, e é isso que o registro deixa claro — anotar o descanso separa
 * um combate do outro na leitura do histórico.
 */
function shortRest() {
  const devolvidos = recoverFeatureUses("curto");
  logHpEvent("descanso", `Descanso Curto${devolvidos.length ? ` — ${devolvidos.join(", ")} de volta` : ""}`,
             character.currentHp || 0);
  showToast(`☕ Descanso Curto${devolvidos.length ? ` — ${devolvidos.join(", ")} recuperado(s)` : ""}. Gaste Dados de Vida para recuperar Pontos de Vida.`);
}

/**
 * Descanso Longo: PV cheios, temporários zerados e metade dos Dados de Vida de
 * volta (arredondando para baixo, no mínimo 1), como manda o livro.
 */
function longRest(maxHp) {
  character.currentHp = maxHp;
  character.tempHp = 0;
  const recuperados = [];
  getHitDicePools().forEach(b => {
    const gastos = hitDiceSpentOf(b.chave);
    if (!gastos) return;
    const volta = Math.max(1, Math.floor(b.total / 2));
    const novo = Math.max(0, gastos - volta);
    character.hitDiceSpent[b.chave] = novo;
    recuperados.push(`${gastos - novo} ${b.chave}`);
  });
  character.deathSaves = { succ1: false, succ2: false, succ3: false, fail1: false, fail2: false, fail3: false };
  // "Completar um Descanso Longo remove 1 dos seus níveis de Exaustão."
  if (character.exhaustionLevel > 0) changeExhaustion(-1);
  recoverFeatureUses("longo");
  // Conjurações grátis de talento, antecedente e espécie voltam no Longo
  const gratisGastas = Object.values(character.freeCasts || {}).filter(v => v > 0).length;
  if (gratisGastas) {
    character.freeCasts = {};
    recuperados.push(`${gratisGastas} conjuração(ões) grátis`);
  }

  // "Você recupera todos os espaços de magia gastos" no Descanso Longo
  const gastosAntes = Object.values(character.spellSlotsExpended || {}).reduce((a, b) => a + b, 0);
  if (gastosAntes) {
    for (let n = 1; n <= 9; n++) character.spellSlotsExpended[n] = 0;
    recuperados.push("todos os espaços de magia");
  }
  logHpEvent("descanso", `Descanso Longo${recuperados.length ? ` — ${recuperados.join(" e ")} de volta` : ""}`, maxHp);
  showToast(`🌙 Descanso Longo — ${maxHp} PV${recuperados.length ? `, ${recuperados.join(" e ")} de volta` : ""}`);
}

/**
 * Desenha o painel de vida. Os números vêm da própria ficha, para o painel e a
 * ficha nunca discordarem.
 */
/* Enquanto verdadeiro, o resumo do painel de vida vira os três campos
   editáveis. Um de cada vez, e sempre fechado depois de salvar ou cancelar. */
let _editandoPv = false;

/** Liga os eventos dos campos de edição de PV recém-criados */
function ligarEdicaoDePv() {
  const campos = document.getElementById("hpEditCampos");
  if (!campos) return;

  // O bloco todo mora dentro de um <summary>: qualquer clique que chegue lá
  // abre ou fecha o painel. Ele para aqui.
  campos.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); });

  campos.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") { e.preventDefault(); salvarEdicaoDePv(); }
    if (e.key === "Escape") { e.preventDefault(); fecharEdicaoDePv(); }
  });

  const ok = document.getElementById("btnHpEditOk");
  const cancelar = document.getElementById("btnHpEditCancelar");
  if (ok) ok.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); salvarEdicaoDePv(); });
  if (cancelar) cancelar.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); fecharEdicaoDePv(); });

  const atual = document.getElementById("hpEditAtual");
  if (atual) { atual.focus(); atual.select(); }
}

function fecharEdicaoDePv() {
  _editandoPv = false;
  renderHpTracker();
}

/**
 * Grava os três números digitados.
 *
 * O máximo entra como edição manual da ficha (o mesmo caminho de quem digita
 * direto no campo da ficha A4), e não como um valor solto: assim ele sobrevive
 * ao próximo recálculo em vez de ser reescrito pela conta automática.
 */
function salvarEdicaoDePv() {
  const ler = (id) => {
    const el = document.getElementById(id);
    if (!el) return null;
    const n = parseInt(el.value, 10);
    return Number.isFinite(n) ? n : null;
  };

  const campoMax = document.getElementById("sheetHpMax");
  const maxAntigo = parseInt(campoMax?.value, 10) || 0;

  let novoMax = ler("hpEditMax");
  if (novoMax === null || novoMax < 1) novoMax = Math.max(1, maxAntigo);

  let novoAtual = ler("hpEditAtual");
  if (novoAtual === null) novoAtual = novoMax;
  novoAtual = Math.max(0, Math.min(novoMax, novoAtual));

  let novoTemp = ler("hpEditTemp");
  novoTemp = novoTemp === null ? 0 : Math.max(0, novoTemp);

  if (campoMax && novoMax !== maxAntigo) {
    campoMax.value = novoMax;
    campoMax.dispatchEvent(new Event("input", { bubbles: true }));
  }

  character.currentHp = novoAtual;
  character.tempHp = novoTemp;

  _editandoPv = false;
  logHpEvent("edicao", `Vida ajustada à mão — ${novoAtual} / ${novoMax} PV` +
    (novoTemp ? ` +${novoTemp} temp` : ""), novoAtual);
  saveToLocalStorage();
  renderHpTracker();
  showToast(`✏️ ${novoAtual} / ${novoMax} PV${novoTemp ? ` +${novoTemp} temp` : ""}`);
}

function renderHpTracker() {
  const resumo = document.getElementById("hpTrackerResumo");
  const dados = document.getElementById("hpTrackerDados");
  if (!resumo || !dados) return;

  const maxHp = parseInt(document.getElementById("sheetHpMax")?.value, 10) || 0;
  const atual = character.currentHp !== null && character.currentHp !== undefined
    ? character.currentHp : maxHp;
  const temp = character.tempHp || 0;

  // O resumo é o que se vê com o painel recolhido: vida, temporários e as
  // condições ativas, que são o que muda a rolagem do turno.
  const nomesCond = (character.conditions || []).map(id => {
    const c = DND5E_DATA.conditions.find(x => x.id === id);
    if (!c) return null;
    const curto = c.name.split(" (")[0];
    return id === "exaustao" && character.exhaustionLevel
      ? `${curto} ${character.exhaustionLevel}`
      : curto;
  }).filter(Boolean);

  const botaoCaneta = document.getElementById("btnHpEditar");

  if (_editandoPv) {
    // Os três números editáveis ocupam o lugar do resumo. Ficam dentro do
    // <summary>, então tudo aqui precisa impedir a propagação do clique: sem
    // isso, mexer num campo abriria e fecharia o painel a cada toque.
    resumo.innerHTML = `
      <span class="hp-edit-campos" id="hpEditCampos">
        <input type="number" class="hp-edit-num" id="hpEditAtual" inputmode="numeric"
               value="${atual}" title="Pontos de Vida atuais" aria-label="Pontos de Vida atuais">
        <span class="hp-edit-sep">/</span>
        <input type="number" class="hp-edit-num" id="hpEditMax" inputmode="numeric" min="1"
               value="${maxHp}" title="Pontos de Vida máximos" aria-label="Pontos de Vida máximos">
        <span class="hp-edit-rotulo">PV</span>
        <span class="hp-edit-sep">+</span>
        <input type="number" class="hp-edit-num is-temp" id="hpEditTemp" inputmode="numeric" min="0"
               value="${temp}" title="Pontos de Vida Temporários" aria-label="Pontos de Vida Temporários">
        <span class="hp-edit-rotulo">temp</span>
        <button type="button" class="hp-edit-btn is-ok" id="btnHpEditOk" title="Salvar (Enter)">
          <i class="fa-solid fa-check"></i>
        </button>
        <button type="button" class="hp-edit-btn" id="btnHpEditCancelar" title="Cancelar (Esc)">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </span>`;
    if (botaoCaneta) botaoCaneta.style.display = "none";
    ligarEdicaoDePv();
  } else {
    if (botaoCaneta) botaoCaneta.style.display = "";
    resumo.innerHTML = `<strong>${atual}</strong> / ${maxHp} PV` +
      (temp ? ` <span class="hp-temp-tag">+${temp} temp</span>` : "") +
      (atual === 0 ? ' <span class="hp-caido-tag">caído</span>' : "") +
      nomesCond.map(n => ` <span class="hp-cond-tag">${n}</span>`).join("");
  }

  renderHpLog();
  renderConditions();
  renderFeatureUses();
  renderSpellSlots();

  const blocos = getHitDicePools();
  dados.innerHTML = blocos.length
    ? blocos.map(b => {
        const gastos = hitDiceSpentOf(b.chave);
        const restantes = b.total - gastos;
        return `<div class="hp-dado-linha">
          <span class="hp-dado-nome">${b.chave} <small>${b.classe}</small></span>
          <span class="hp-dado-conta">${restantes} de ${b.total}</span>
          <button type="button" class="btn btn-secondary btn-sm" data-gastar="${b.chave}"
                  ${restantes <= 0 ? "disabled" : ""} title="Rolar ${b.chave} + Constituição e curar">
            <i class="fa-solid fa-dice-d6"></i> Gastar
          </button>
        </div>`;
      }).join("")
    : '<p class="hp-dado-vazio">Escolha a classe no Passo 1 para o app saber os seus Dados de Vida.</p>';
}

/* ------------------------------------ MAGIAS NA TABELA DE ATAQUES */

const ATRIBUTO_CURTO = { "Força": "FOR", "Destreza": "DES", "Constituição": "CON",
                         "Inteligência": "INT", "Sabedoria": "SAB", "Carisma": "CAR" };

/**
 * O atributo de conjuração da classe do personagem, ou null se ele não conjura.
 */
function spellcastingAbilityOf() {
  const c1 = DND5E_DATA.classes.find(c => c.id === character.class1);
  const c2 = DND5E_DATA.classes.find(c => c.id === character.class2);
  const sc = (c1 && c1.spellcasting) || (c2 && c2.spellcasting);
  return sc ? sc.ability : null;
}

/**
 * Lê da descrição o que a magia pede: jogada de ataque, salvaguarda, ou nenhum
 * dos dois. O livro escreve isso em prosa, então a leitura é por padrão de
 * texto — o resultado vai para a ficha como apoio, não como regra fechada.
 */
/**
 * Uma magia exige jogada de ataque de QUEM CONJURA?
 *
 * Procurar só "jogada de ataque" no texto pega errado quase metade dos casos:
 * Bênção soma 1d4 "à jogada de ataque" do aliado, Marca do Predador dá dano
 * extra "sempre que o acertar com uma jogada de ataque", Santuário fala da
 * jogada de ataque do inimigo. Nenhuma delas se rola para acertar, e todas
 * ocupavam linha na tabela de ataques da ficha.
 *
 * O que separa é o sujeito e o modo do verbo: a magia de ataque manda VOCÊ
 * rolar ("Realize um ataque mágico à distância", "você realiza um ataque
 * mágico corpo a corpo"), enquanto as outras descrevem a jogada de outra
 * pessoa ou uma condição. De 43 magias que a regra antiga chamava de ataque,
 * 25 são ataque de verdade.
 */
const RE_ATAQUE_DE_MAGIA =
  /\b(?:realize|faça|você realiza|você faz|pode realizar|pode fazer)\s+(?:imediatamente\s+)?(?:um ataque mágico|uma jogada de ataque|um ataque corpo a corpo com magia|um ataque à distância com magia)/i;

function spellCombatInfo(sp) {
  const desc = sp.desc || "";
  const ataque = RE_ATAQUE_DE_MAGIA.test(desc);
  const mSalva = desc.match(/salvaguarda de (Força|Destreza|Constituição|Inteligência|Sabedoria|Carisma)/i);
  const mDano = desc.match(/(\d+d\d+)[^.]{0,40}?dano (?:de )?(\wÁ-ú+|[A-ZÀ-Ú][a-zà-ú]+)/);
  const dado = desc.match(/\d+d\d+/);
  return {
    ataque,
    salvaguarda: mSalva ? mSalva[1].charAt(0).toUpperCase() + mSalva[1].slice(1).toLowerCase() : null,
    dano: mDano ? `${mDano[1]} ${mDano[2]}` : (dado ? dado[0] : ""),
  };
}

/**
 * Maior círculo de espaço de magia que o personagem tem. Sai da tabela de
 * espaços, não do DOM: assim o cálculo também vale fora da tela renderizada.
 */
function highestSpellSlotLevel() {
  const daClasse = (classId, nivel) => {
    const c = DND5E_DATA.classes.find(x => x.id === classId);
    if (!c || !c.spellcasting || nivel < 1) return 0;
    const tabela = DND5E_DATA.spellSlotsTable[c.spellcasting.type] || DND5E_DATA.spellSlotsTable.full;
    const linha = tabela[nivel];
    if (!linha) return 0;
    for (let i = linha.length - 1; i >= 0; i--) if (linha[i] > 0) return i + 1;
    return 0;
  };
  return Math.max(1,
    daClasse(character.class1, character.level1),
    character.class2 !== "none" ? daClasse(character.class2, character.level2) : 0);
}

/**
 * Magias que mudam os números de uma arma em vez de atacar sozinhas.
 *
 * Elas não têm jogada de ataque nem salvaguarda na descrição, então a leitura
 * por texto não as pega — e são justamente as que o jogador precisa acompanhar
 * na tabela de ataques. Cada uma diz como calcular a linha resultante.
 */
const SPELL_WEAPON_BUFFS = {
  shillelagh: {
    // O dado cresce com o nível do personagem, não com o círculo do espaço.
    armas: ["quarterstaff", "clava"],
    linha(ctx) {
      const nivel = ctx.nivelTotal;
      const dado = nivel >= 17 ? "2d6" : nivel >= 11 ? "1d12" : nivel >= 5 ? "1d10" : "1d8";
      const arma = ctx.armaEquipada
        ? ctx.armaEquipada.name
        : "sem Cajado ou Clava equipado";

      // A CD da maestria é 8 + proficiência + o modificador DO ATAQUE, e sob
      // Bordão Místico o ataque passa a usar o atributo de conjuração. A linha
      // da arma normal continua com a CD pela Força, que é a certa quando se
      // ataca sem a magia: são dois ataques diferentes, cada um com a sua.
      const cdMaestria = ctx.armaEquipada && isMasteryActive(ctx.armaEquipada.id)
        ? masterySaveDC(ctx.armaEquipada, ctx.mod, ctx.pb)
        : null;

      return {
        atk: `${ctx.atkMagico >= 0 ? "+" : ""}${ctx.atkMagico}` +
             (cdMaestria ? ` / CD ${cdMaestria.cd} ${cdMaestria.atributo}` : ""),
        damage: `${dado}${ctx.mod ? (ctx.mod > 0 ? " +" + ctx.mod : " " + ctx.mod) : ""} Energético`,
        notes: `${arma} • usa o atributo de conjuração no ataque e no dano` +
               (cdMaestria ? " (e na CD da maestria)" : "") +
               ` • dano Energético ou o normal da arma`
      };
    }
  },
  magic_weapon: {
    linha(ctx) {
      // +1 no 2º círculo, +2 do 3º ao 5º, +3 do 6º em diante
      const maior = ctx.maiorCirculo;
      const bonus = maior >= 6 ? 3 : maior >= 3 ? 2 : 1;
      return {
        atk: `+${bonus}`,
        damage: `+${bonus} no dano`,
        notes: `Some no ataque e no dano da arma tocada • +${bonus} com espaço de ${maior}º círculo (+1 no 2º, +2 do 3º ao 5º, +3 do 6º em diante)`
      };
    }
  }
};

/**
 * Linhas de ataque vindas das magias que o personagem tem na ficha.
 *
 * Um truque de dano ocupa a mesma tabela que as armas na ficha oficial ("ARMAS
 * & TRUQUES DE DANO"), e magias como Bordão Místico ou Arma Mágica mudam os
 * números de um ataque — sem elas ali, o jogador ficava sem onde acompanhar.
 * Magias sem ataque nem salvaguarda ficam de fora: são utilidade, não ataque.
 */
function spellAttackRows(finalMods, pb) {
  const ability = spellcastingAbilityOf();
  if (!ability) return [];
  const mod = finalMods[ability] || 0;
  const cd = 8 + mod + pb;
  const atkMagico = mod + pb;

  const ids = [...new Set([
    ...(character.spellsKnown || []),
    ...getGrantedSpellEntries().map(g => g.id)
  ])];

  const nivelTotal = (character.level1 || 0) + (character.class2 !== "none" ? (character.level2 || 0) : 0);
  const maiorCirculo = highestSpellSlotLevel();

  return ids.map(id => {
    const sp = DND5E_DATA.spells.find(x => x.id === id);
    if (!sp) return null;

    const buff = SPELL_WEAPON_BUFFS[id];
    if (buff) {
      const armaEquipada = (buff.armas || [])
        .map(wid => DND5E_DATA.weapons.find(w => w.id === wid))
        .find(w => w && character.weapons.includes(w.id));
      const r = buff.linha({ mod, atkMagico, cd, pb, nivelTotal, maiorCirculo, armaEquipada });
      return { srcId: "spell:" + sp.id, name: sp.name.split(" (")[0], ...r };
    }

    // Esta tabela é de ATAQUE: entra o que precisa acertar. Magia de
    // salvaguarda pura (Bola de Fogo, Onda Trovejante) não tem jogada de
    // ataque — ficava aqui com "CD 15 Des" na coluna de bônus, misturando
    // duas mecânicas diferentes na mesma linha e enchendo as oito linhas da
    // ficha impressa com o que não se rola para acertar.
    const info = spellCombatInfo(sp);
    if (!info.ataque) return null;
    const notas = [
      formatSpellLevel(sp.level),
      sp.time,
      sp.range,
      spellNeedsConcentration(sp) ? "Concentração" : null
    ].filter(Boolean).join(" • ");
    return {
      srcId: "spell:" + sp.id,
      name: sp.name.split(" (")[0],
      atk: `${atkMagico >= 0 ? "+" : ""}${atkMagico}`,
      damage: info.dano,
      notes: notas
    };
  }).filter(Boolean);
}

/**
 * Quantas armas o personagem pode manter com a propriedade de maestria ativa.
 *
 * Vem da coluna "Maestria em Arma" das tabelas de Bárbaro e Guerreiro e do texto
 * da característica no Paladino, Guardião e Ladino (dois tipos, fixo). Quem não
 * tem a característica não usa maestria nenhuma — antes o app mostrava a
 * maestria de toda arma equipada, como se fosse sempre válida.
 */
function getWeaponMasteryLimit() {
  const conta = (classId, nivel) => {
    const c = DND5E_DATA.classes.find(x => x.id === classId);
    if (!c || !c.weaponMasteryByLevel || nivel < 1) return 0;
    return c.weaponMasteryByLevel[nivel] || 0;
  };
  // Em multiclasse vale a maior das duas, não a soma: a característica é a mesma.
  return Math.max(conta(character.class1, character.level1),
                  conta(character.class2, character.level2));
}

function isMasteryActive(weaponId) {
  return (character.activeMasteries || []).includes(weaponId);
}

/**
 * Liga ou desliga a maestria de uma arma, respeitando o limite da classe.
 */
function toggleWeaponMastery(weaponId) {
  if (!weaponId || weaponId === "none") return;
  character.activeMasteries = character.activeMasteries || [];
  const i = character.activeMasteries.indexOf(weaponId);
  if (i >= 0) {
    character.activeMasteries.splice(i, 1);
  } else {
    const limite = getWeaponMasteryLimit();
    if (character.activeMasteries.length >= limite) {
      showToast(limite === 0
        ? "Esta classe não tem a característica Maestria em Arma."
        : `Você já usa ${limite} maestria(s) — desative uma antes.`);
      return;
    }
    character.activeMasteries.push(weaponId);
  }
  const wm = DND5E_DATA.weapons.find(x => x.id === weaponId);
  if (wm) logHpEvent("arma", `${i >= 0 ? "Desligou" : "Ligou"} a maestria ${wm.masteryName.split(" (")[0]} (${wm.name.split(" (")[0]})`,
                     character.currentHp || 0);
  renderWeaponMasteryButtons();
  recalculateCharacter();
  saveToLocalStorage();
}

/**
 * Lista de armas equipadas: um select por arma, com o botão de maestria e o de
 * remover. A quantidade é livre — o jogador adiciona quantas quiser, e a ficha
 * oficial avisa se passarem das linhas que cabem no papel.
 */
function renderWeaponSlots() {
  const container = document.getElementById("weaponSlots");
  if (!container) return;
  if (!Array.isArray(character.weapons)) character.weapons = [];

  const limite = getWeaponMasteryLimit();
  const opcoes = (selecionado) => ['<option value="none">Nenhuma arma</option>']
    .concat(DND5E_DATA.weapons.map(w =>
      `<option value="${w.id}"${w.id === selecionado ? " selected" : ""}>` +
      `${w.name} [${w.damage} ${w.damageType}] • ${w.category} ${w.type}` +
      (w.mastery ? ` • Maestria: ${w.masteryName}` : "") +
      `</option>`)).join("");

  container.innerHTML = character.weapons.map((wId, i) => {
    const w = wId && wId !== "none" ? DND5E_DATA.weapons.find(x => x.id === wId) : null;
    const on = w && isMasteryActive(w.id);
    return `
      <div class="weapon-slot">
        <select class="form-control weapon-slot-select" data-slot="${i}" aria-label="Arma ${i + 1}">${opcoes(wId)}</select>
        ${w && w.mastery && limite > 0
          ? `<button type="button" class="btn btn-secondary btn-sm weapon-mastery-btn${on ? " is-on" : ""}" data-slot="${i}"
               title="${on ? "Maestria ativa" : "Ativar a maestria desta arma"}. ${masteryDesc(w.mastery).replace(/"/g, "&quot;")}">
               <i class="fa-solid ${on ? "fa-toggle-on" : "fa-toggle-off"}"></i> ${w.masteryName}
             </button>`
          : ""}
        <button type="button" class="btn btn-secondary btn-sm weapon-slot-remove" data-slot="${i}" title="Remover esta arma">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>`;
  }).join("") || '<p class="feat-empty-msg">Nenhuma arma equipada. Use "Adicionar arma".</p>';

  const ativas = (character.activeMasteries || []).filter(id => character.weapons.includes(id));
  const ajuda = document.getElementById("weaponMasteryHelp");
  if (ajuda) {
    ajuda.textContent = limite === 0
      ? "Esta classe não tem a característica Maestria em Arma — nenhuma propriedade de maestria se aplica."
      : `Maestria em Arma: ${ativas.length} de ${limite} ativa(s). Trocar de arma é livre a cada Descanso Longo.`;
    ajuda.classList.toggle("is-off", limite === 0);
  }
}

/* Nome antigo, mantido porque o resto do app ainda chama por ele */
function renderWeaponMasteryButtons() {
  renderWeaponSlots();
}

/**
 * CD da salvaguarda que a maestria da arma impõe, quando ela impõe alguma.
 *
 * O texto da maestria é a fonte: procura "salvaguarda de <Atributo>" na
 * descrição em vez de manter uma lista à parte, que sairia do lugar assim que
 * o data.js mudasse. Hoje só Derrubar (Topple) cai aqui; a fórmula é a do
 * livro, 8 + bônus de proficiência + o modificador do atributo do ataque.
 */
function masterySaveDC(w, atkAbilityMod, pb) {
  if (!w || !w.mastery) return null;
  const m = DND5E_DATA.weaponMasteries.find(x => x.id === w.mastery);
  if (!m) return null;
  const achou = String(m.desc || "")
    .match(/salvaguarda de (Força|Destreza|Constituição|Inteligência|Sabedoria|Carisma)/i);
  if (!achou) return null;
  const nome = achou[1].charAt(0).toUpperCase() + achou[1].slice(1).toLowerCase();
  return { cd: 8 + pb + atkAbilityMod, atributo: ATRIBUTO_CURTO[nome] || nome.slice(0, 3) };
}

function masteryDesc(id) {
  const m = DND5E_DATA.weaponMasteries.find(x => x.id === id);
  return m ? m.desc : "";
}

/**
 * Quantas escolhas de talento o personagem tem até o nível atual.
 *
 * `asiLevels` já estava no data.js e não era usado por ninguém: o app nunca
 * dizia ao jogador quantos talentos ele podia escolher, então passar do limite
 * não dava nenhum aviso.
 */
function getFeatSlotInfo() {
  const partes = [];
  let total = 0;

  const contar = (classObj, nivel, rotulo) => {
    if (!classObj || !classObj.asiLevels || nivel < 1) return;
    const niveis = classObj.asiLevels.filter(n => n <= nivel);
    if (!niveis.length) return;
    total += niveis.length;
    partes.push(`${rotulo} nível ${nivel}: ${niveis.length} (níveis ${niveis.join(", ")})`);
  };

  contar(DND5E_DATA.classes.find(c => c.id === character.class1), character.level1,
         classLabelOf(character.class1));
  if (character.class2 && character.class2 !== "none") {
    contar(DND5E_DATA.classes.find(c => c.id === character.class2), character.level2,
           classLabelOf(character.class2));
  }

  return {
    total,
    detalhe: partes.length
      ? partes.join(" · ")
      : "Escolha classe e nível no Passo 1 para o app calcular quantos talentos você tem."
  };
}

/** Nome curto de uma classe pelo id ("wizard" -> "Mago") */
function classLabelOf(id) {
  const c = DND5E_DATA.classes.find(x => x.id === id);
  return c ? c.name.split(" (")[0] : "Classe";
}

function updateFeatsList() {
  const container = document.getElementById("featsContainer");
  if (!container) return;

  container.innerHTML = "";

  const originFeat = getOriginFeatObj();
  const bgObj = DND5E_DATA.backgrounds.find(b => b.id === character.background);

  // Talentos de Origem são concedidos pelo Antecedente, nunca marcados à mão.
  // Limpa qualquer resquício de antecedente anterior salvo no personagem.
  //
  // O talento personalizado não está no catálogo do livro: quem filtrava só
  // pelo catálogo o apagava da lista de escolhidos a cada redesenho, e marcar a
  // caixa não tinha efeito nenhum — o talento voltava desmarcado.
  character.selectedFeats = character.selectedFeats.filter(id => {
    if ((character.customFeats || []).some(cf => cf.id === id)) return true;
    const f = DND5E_DATA.feats.find(x => x.id === id);
    return f && f.type !== "origin";
  });

  // ---------- 1. Talentos de Origem: do Antecedente e, no Humano, o extra ----
  // O Humano acumula os dois pelo traço Versátil. O extra dele é escolha do
  // jogador, então aqui ele vem com o próprio seletor em vez do cadeado.
  const humanFeat = getHumanOriginFeatObj();
  const ehHumano = character.species === "human";
  const originFeats = DND5E_DATA.feats.filter(f => f.type === "origin");

  // O seletor de adicionar só oferece o que ainda não está valendo: repetir um
  // talento não dobra efeito nenhum, e a lista passaria a prometer o que a
  // ficha não faz.
  const extraFeats = getExtraOriginFeatObjs();
  const jaValendo = new Set(getActiveFeatIds());
  const disponiveis = originFeats.filter(f => !jaValendo.has(f.id));

  const grantedSection = document.createElement("div");
  grantedSection.className = "feat-list-block";
  grantedSection.innerHTML = `
    <h4 class="feat-block-title" style="color: #fbbf24;">Talento de Origem (concedido pelo Antecedente)</h4>
    ${originFeat ? `
      <div class="feat-list">
        <div class="feat-row is-granted">
          <span class="feat-row-lock" title="Concedido automaticamente pelo antecedente"><i class="fa-solid fa-lock"></i></span>
          <span class="feat-row-name">${originFeat.name}</span>
          <span class="feat-row-tag tag-origin">Origem • ${bgObj ? getBackgroundLabel(bgObj) : "Antecedente"}</span>
          <button type="button" class="feat-info-btn" data-info="${originFeat.id}" title="Mais informações"><i class="fa-solid fa-info"></i></button>
        </div>
        <div class="feat-info-panel" data-panel="${originFeat.id}" hidden>${buildFeatInfoHtml(originFeat)}</div>
        ${buildFeatChoiceBoxHtml(originFeat, true)}
      </div>
    ` : `<p class="feat-empty-msg">Este antecedente ainda não define um talento de origem. Escolha um no painel de Antecedente Personalizado (Passo 1).</p>`}

    ${ehHumano ? `
      <h4 class="feat-block-title" style="color: #fbbf24; margin-top: 0.9rem;">
        Talento de Origem Extra (Versátil, do Humano)
      </h4>
      <div class="feat-choice-box">
        <div class="feat-choice-title"><i class="fa-solid fa-award"></i> Escolha o talento extra</div>
        <select class="form-control" id="selectHumanOriginFeatStep3">
          <option value="none">— Escolha o talento extra —</option>
          ${originFeats.map(f => `
            <option value="${f.id}"${f.id === (character.humanOriginFeat || "none") ? " selected" : ""}>
              ${f.id === getOriginFeatId() ? `${f.name} — já vem do antecedente` : f.name}
            </option>`).join("")}
        </select>
      </div>
      ${humanFeat ? `
        <div class="feat-list">
          <div class="feat-row is-granted">
            <span class="feat-row-lock" title="Concedido pelo traço Versátil do Humano"><i class="fa-solid fa-award"></i></span>
            <span class="feat-row-name">${humanFeat.name}</span>
            <span class="feat-row-tag tag-origin">Origem • Humano</span>
            <button type="button" class="feat-info-btn" data-info="${humanFeat.id}" title="Mais informações"><i class="fa-solid fa-info"></i></button>
          </div>
          <div class="feat-info-panel" data-panel="${humanFeat.id}" hidden>${buildFeatInfoHtml(humanFeat)}</div>
          ${buildFeatChoiceBoxHtml(humanFeat, true)}
        </div>
      ` : ""}
    ` : ""}

    <h4 class="feat-block-title" style="color: #fbbf24; margin-top: 0.9rem;">
      Talentos de Origem Extras (à mão)
    </h4>
    <p class="feat-slots-note">
      Para o que não vem do antecedente nem do traço do Humano: variante de mesa,
      prêmio de aventura ou concessão do Mestre. Não gasta vaga de talento.
    </p>
    ${extraFeats.length ? `
      <div class="feat-list">
        ${extraFeats.map(f => `
          <div class="feat-row is-granted">
            <span class="feat-row-lock" title="Talento de Origem adicionado à mão"><i class="fa-solid fa-plus"></i></span>
            <span class="feat-row-name">${f.name}</span>
            <span class="feat-row-tag tag-origin">Origem • Extra</span>
            <button type="button" class="feat-info-btn" data-info="${f.id}" title="Mais informações"><i class="fa-solid fa-info"></i></button>
            <button type="button" class="feat-del-btn" data-remove-extra-origin="${f.id}" title="Remover este talento de origem">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="feat-info-panel" data-panel="${f.id}" hidden>${buildFeatInfoHtml(f)}</div>
          ${buildFeatChoiceBoxHtml(f, true)}
        `).join("")}
      </div>
    ` : ""}
    <div class="feat-choice-box origem-extra-add">
      <div class="feat-choice-title"><i class="fa-solid fa-plus"></i> Adicionar Talento de Origem</div>
      <div class="origem-extra-linha">
        <select class="form-control" id="selectExtraOriginFeat" aria-label="Talento de origem a adicionar">
          ${disponiveis.length
            ? disponiveis.map(f => `<option value="${f.id}">${f.name}</option>`).join("")
            : '<option value="none">Todos os talentos de origem já estão na ficha</option>'}
        </select>
        <button type="button" class="btn btn-secondary btn-sm" id="btnAddExtraOriginFeat"
                ${disponiveis.length ? "" : "disabled"}>
          <i class="fa-solid fa-plus"></i> Adicionar
        </button>
      </div>
    </div>
  `;
  container.appendChild(grantedSection);

  const btnAddOrigem = grantedSection.querySelector("#btnAddExtraOriginFeat");
  if (btnAddOrigem) {
    btnAddOrigem.addEventListener("click", () => {
      const sel = grantedSection.querySelector("#selectExtraOriginFeat");
      if (sel && sel.value && sel.value !== "none") addExtraOriginFeat(sel.value);
    });
  }

  grantedSection.querySelectorAll("[data-remove-extra-origin]").forEach(btn => {
    btn.addEventListener("click", () => {
      removeExtraOriginFeat(btn.getAttribute("data-remove-extra-origin"));
    });
  });

  // O seletor do Passo 3 é o mesmo campo do Passo 1: escreve no mesmo lugar e
  // manda os dois se redesenharem, para não existirem duas verdades.
  const selStep3 = grantedSection.querySelector("#selectHumanOriginFeatStep3");
  if (selStep3) {
    selStep3.addEventListener("change", (e) => {
      character.humanOriginFeat = e.target.value;
      renderHumanOriginFeat();
      updateFeatsList();
      renderSpellsCatalog();
      recalculateCharacter();
    });
  }

  // ---------- 2. Demais talentos (lista + botão "i") ----------
  const selectable = DND5E_DATA.feats.filter(f => f.type !== "origin");
  // Estilo de Luta não gasta escolha de talento: vem de característica de classe.
  // Contá-lo junto fazia o painel mostrar coisas como "3 / 1" num Paladino de
  // nível 4. A quantidade fica livre de propósito — subclasses e variantes de
  // mesa concedem estilos extras, e travar isso atrapalharia mais que ajudaria.
  // O talento personalizado gasta escolha como qualquer outro: ele é um talento
  // do personagem, não um enfeite. Antes ficava fora da conta e o painel dizia
  // "0 / 1" com um talento já criado e em uso.
  const escolhidos = [
    ...selectable.filter(f => character.selectedFeats.includes(f.id) && f.type !== "fighting_style"),
    ...getSelectedCustomFeats()
  ];
  const estilos = selectable.filter(f =>
    character.selectedFeats.includes(f.id) && f.type === "fighting_style");
  const vagas = getFeatSlotInfo();
  // O Aumento no Valor de Atributo é repetível: ele gasta uma vaga por vez que
  // foi pego, e não uma só por estar marcado.
  const vagasUsadas = escolhidos.reduce((n, f) => n + vagasQueOTalentoUsa(f), 0);

  const busca = (_featFilterState.busca || "").toLowerCase().trim();
  const tipo = _featFilterState.tipo || "all";
  const soMeus = !!_featFilterState.soMeus;

  const visiveis = selectable.filter(f => {
    const meu = character.selectedFeats.includes(f.id);
    if (soMeus && !meu) return false;
    if (tipo !== "all" && f.type !== tipo) return false;
    if (!busca) return true;
    return f.name.toLowerCase().includes(busca) || (f.desc || "").toLowerCase().includes(busca);
  });

  const GRUPOS = [
    ["general", "Talentos Gerais"],
    ["fighting_style", "Estilos de Luta"],
    ["epic_boon", "Dádivas Épicas"]
  ];

  const linhaDoTalento = (f) => {
    const meu = character.selectedFeats.includes(f.id);
    return `
      <div class="feat-row${meu ? " is-selected" : ""}" data-row="${f.id}">
        <input type="checkbox" class="feat-check" id="featChk_${f.id}" value="${f.id}" ${meu ? "checked" : ""}>
        <label class="feat-row-name" for="featChk_${f.id}">${f.name}</label>
        ${f.prereq ? `<span class="feat-row-prereq" title="Pré-requisito: ${String(f.prereq).replace(/"/g, "&quot;")}"><i class="fa-solid fa-lock-open"></i> ${f.prereq}</span>` : ""}
        <span class="feat-row-tag tag-${f.type}">${featTypeLabel(f.type)}</span>
        <button type="button" class="feat-info-btn" data-info="${f.id}" title="Mais informações"><i class="fa-solid fa-info"></i></button>
      </div>
      <div class="feat-info-panel" data-panel="${f.id}" hidden>${buildFeatInfoHtml(f)}</div>
      ${buildFeatChoiceBoxHtml(f, meu)}`;
  };

  const officialSection = document.createElement("div");
  officialSection.className = "feat-list-block";
  officialSection.innerHTML = `
    <h4 class="feat-block-title">Talentos do Personagem</h4>

    <div class="feat-slots-card">
      <div class="feat-slots-line">
        <span class="feat-slots-num${vagasUsadas > vagas.total ? " is-over" : ""}">${vagasUsadas} / ${vagas.total}</span>
        <span class="feat-slots-label">escolhas de talento usadas</span>
      </div>
      <p class="feat-slots-note">${vagas.detalhe}</p>
      ${escolhidos.length
        ? `<p class="feat-slots-mine"><i class="fa-solid fa-check"></i> ${escolhidos.map(f => {
             const n = vagasQueOTalentoUsa(f);
             return `${f.name.split(" (")[0]}${n > 1 ? ` ×${n}` : ""}`;
           }).join(" · ")}</p>`
        : `<p class="feat-slots-mine is-empty">Nenhum talento escolhido ainda.</p>`}
      ${estilos.length
        ? `<p class="feat-slots-mine"><i class="fa-solid fa-shield"></i> Estilos de Luta (livres, não gastam escolha de talento): ${estilos.map(f => f.name.split(" (")[0]).join(" · ")}</p>`
        : ""}
    </div>

    <div class="feat-filter-bar">
      <input type="text" class="form-control" id="featSearchInput" placeholder="Buscar talento..." value="${busca.replace(/"/g, "&quot;")}">
      <select class="form-control" id="featFilterType">
        <option value="all"${tipo === "all" ? " selected" : ""}>Todos os tipos</option>
        <option value="general"${tipo === "general" ? " selected" : ""}>Gerais</option>
        <option value="fighting_style"${tipo === "fighting_style" ? " selected" : ""}>Estilos de Luta</option>
        <option value="epic_boon"${tipo === "epic_boon" ? " selected" : ""}>Dádivas Épicas</option>
      </select>
      <button type="button" class="btn btn-secondary feat-filter-toggle${soMeus ? " is-on" : ""}" id="featFilterMine"
              aria-pressed="${soMeus}" title="Mostrar só os talentos do personagem">
        <i class="fa-solid fa-list-check"></i> Só os meus${escolhidos.length + estilos.length ? ` (${escolhidos.length + estilos.length})` : ""}
      </button>
    </div>

    ${visiveis.length === 0
      ? `<p class="feat-empty-msg">Nenhum talento encontrado para esses filtros.</p>`
      : GRUPOS.map(([id, rotulo]) => {
          const doGrupo = visiveis.filter(f => f.type === id);
          if (!doGrupo.length) return "";
          const meus = doGrupo.filter(f => character.selectedFeats.includes(f.id)).length;
          return `
            <div class="feat-group">
              <h5 class="feat-group-head">
                <span>${rotulo}</span>
                <span class="feat-group-count">${doGrupo.length}${meus ? ` · ${meus} no personagem` : ""}</span>
              </h5>
              <div class="feat-list">${doGrupo.map(linhaDoTalento).join("")}</div>
            </div>`;
        }).join("")}
  `;
  container.appendChild(officialSection);

  // ---------- 3. Talentos Personalizados ----------
  const customSection = document.createElement("div");
  customSection.className = "feat-list-block";

  if (character.customFeats.length === 0) {
    customSection.innerHTML = `
      <h4 class="feat-block-title" style="color: #fbbf24;">Talentos Personalizados</h4>
      <p class="feat-empty-msg">Nenhum talento customizado adicionado ainda. Clique em "+ Novo Talento Personalizado".</p>
    `;
  } else {
    customSection.innerHTML = `
      <h4 class="feat-block-title" style="color: #fbbf24;">Talentos Personalizados</h4>
      <div class="feat-list">
        ${character.customFeats.map(cf => `
          <div class="feat-row${customFeatIsSelected(cf) ? " is-selected" : ""}" data-row="${cf.id}">
            <input type="checkbox" class="feat-check" id="featChk_${cf.id}" value="${cf.id}" ${customFeatIsSelected(cf) ? "checked" : ""}>
            <label class="feat-row-name" for="featChk_${cf.id}">${cf.name}</label>
            <span class="feat-row-tag tag-custom">${featTypeLabel(cf.type)}</span>
            <button type="button" class="feat-info-btn" data-info="${cf.id}" title="Mais informações"><i class="fa-solid fa-info"></i></button>
            <button type="button" class="feat-del-btn btn-delete-custom-feat" data-id="${cf.id}" title="Excluir talento"><i class="fa-solid fa-trash"></i></button>
          </div>
          <div class="feat-info-panel" data-panel="${cf.id}" hidden>
            <p>${cf.desc}</p>
            ${cf.abilityBonus && cf.abilityBonus !== 'none' ? `<p class="feat-info-meta"><strong>Bônus:</strong> +1 em ${DND5E_DATA.abilities.find(a => a.id === cf.abilityBonus)?.name || cf.abilityBonus}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }
  container.appendChild(customSection);

  // ---------- Eventos (delegação única no container, vinculada uma só vez) ----------
  if (!container.dataset.delegateBound) {
    container.dataset.delegateBound = "1";

    // A lista é redesenhada a cada tecla, então o foco e o cursor da busca
    // precisam ser devolvidos — sem isso digitar fica impossível.
    container.addEventListener("input", (e) => {
      if (e.target.id !== "featSearchInput") return;
      _featFilterState.busca = e.target.value;
      const pos = e.target.selectionStart;
      updateFeatsList();
      const novo = document.getElementById("featSearchInput");
      if (novo) { novo.focus(); novo.setSelectionRange(pos, pos); }
    });

    container.addEventListener("change", (e) => {
      if (e.target.id !== "featFilterType") return;
      _featFilterState.tipo = e.target.value;
      updateFeatsList();
    });

    container.addEventListener("click", (e) => {
      const btnMeus = e.target.closest("#featFilterMine");
      if (btnMeus) {
        _featFilterState.soMeus = !_featFilterState.soMeus;
        updateFeatsList();
        return;
      }

      const infoBtn = e.target.closest(".feat-info-btn");
      if (infoBtn) {
        const id = infoBtn.getAttribute("data-info");
        const panel = container.querySelector(`.feat-info-panel[data-panel="${id}"]`);
        if (panel) {
          panel.hidden = !panel.hidden;
          infoBtn.classList.toggle("is-open", !panel.hidden);
        }
        return;
      }

      const delBtn = e.target.closest(".btn-delete-custom-feat");
      if (delBtn) {
        const id = delBtn.getAttribute("data-id");
        character.customFeats = character.customFeats.filter(f => f.id !== id);
        character.selectedFeats = (character.selectedFeats || []).filter(f => f !== id);
        updateFeatsList();
        recalculateCharacter();
        showToast("Talento personalizado removido.");
      }
    });

    // Escolhas do talento (atributo, magia, perícia, opção)
    container.addEventListener("change", (e) => {
      const sel = e.target.closest(".feat-choice-input");
      if (!sel) return;
      const featId = sel.getAttribute("data-choice-feat");
      const kind = sel.getAttribute("data-choice-kind");
      const key = sel.getAttribute("data-choice-key");
      const ch = featChoicesFor(featId);
      const value = sel.value;

      if (kind === "ability") ch.ability = value || undefined;
      else if (kind === "expertise") ch.expertise = value || undefined;
      else if (kind === "spell") { if (value) ch.spells[key] = value; else delete ch.spells[key]; }
      else if (kind === "skill") { if (value) ch.skills[key] = value; else delete ch.skills[key]; }
      else if (kind === "option") { if (value) ch.options[key] = value; else delete ch.options[key]; }

      _ofSpellsSig = null;
      updateSkillsSelector();
      recalculateCharacter();
      // Mudar quantas vezes o aumento foi pego muda o número de caixas e a
      // contagem de vagas: aqui a lista precisa ser redesenhada mesmo.
      if (key === "asiVezes") updateFeatsList();

      const feat = DND5E_DATA.feats.find(f => f.id === featId);
      if (value && feat) showToast(`✔ ${feat.name}: escolha aplicada na ficha.`);
    });
  }

  container.querySelectorAll(".feat-check").forEach(chk => {
    chk.addEventListener("change", (e) => {
      const fId = e.target.value;
      const feat = DND5E_DATA.feats.find(f => f.id === fId)
        || (character.customFeats || []).find(f => f.id === fId);
      const nomeTalento = feat ? feat.name.split(" (")[0] : fId;
      if (e.target.checked) {
        if (!character.selectedFeats.includes(fId)) character.selectedFeats.push(fId);
        logHpEvent("talento", `Adicionou ${nomeTalento}`, character.currentHp || 0);
      } else {
        character.selectedFeats = character.selectedFeats.filter(f => f !== fId);
        logHpEvent("talento", `Removeu ${nomeTalento}`, character.currentHp || 0);
      }
      renderHpLog();
      const row = container.querySelector(`.feat-row[data-row="${fId}"]`);
      if (row) row.classList.toggle("is-selected", e.target.checked);
      const box = container.querySelector(`.feat-choice-box[data-choice-box="${fId}"]`);
      if (box) box.hidden = !e.target.checked;
      recalculateCharacter();
    });
  });
}

/**
 * ===========================================================================
 * ESCOLHAS DE TALENTO, ESTILOS DE LUTA E CONCESSÕES AUTOMÁTICAS
 * ---------------------------------------------------------------------------
 * Um talento raramente é só texto: quase todos concedem +1 em um atributo à
 * escolha, e vários concedem magias, perícias ou opções (elemento, resistência).
 * Este bloco descreve essas escolhas, desenha a caixa de seleção dentro da
 * linha do talento e aplica o resultado no personagem e na ficha.
 * ===========================================================================
 */

const ABBR_TO_ABILITY = { FOR: "str", DES: "dex", CON: "con", INT: "int", SAB: "wis", CAR: "cha" };
const ALL_ABILITY_IDS = ["str", "dex", "con", "int", "wis", "cha"];

/**
 * Lê a primeira frase da descrição do talento e devolve os atributos elegíveis
 * ao +1. Cobre "+1 em CAR", "+1 em FOR ou DES", "+1 em INT, SAB ou CAR",
 * "+1 no atributo escolhido (...)" e "+1 em um atributo".
 */
function parseFeatAbilityOptions(desc) {
  if (!desc) return [];
  const head = String(desc).split(".")[0];
  if (!/\+1/.test(head)) return [];
  const abbrs = head.match(/\b(FOR|DES|CON|INT|SAB|CAR)\b/g) || [];
  const ids = Array.from(new Set(abbrs.map(a => ABBR_TO_ABILITY[a])));
  if (ids.length) return ids;
  if (/atributo/i.test(head)) return ALL_ABILITY_IDS.slice();
  return [];
}

/** Atalho para montar as três escolhas de um talento Iniciado em Magia */
function magicInitiateSlots(classId, listLabel) {
  return [
    { key: "c1", label: `Truque 1 — lista de ${listLabel}`, level: 0, classes: [classId] },
    { key: "c2", label: `Truque 2 — lista de ${listLabel}`, level: 0, classes: [classId] },
    { key: "s1", label: `Magia de 1º Círculo — lista de ${listLabel}`, level: 1, classes: [classId] }
  ];
}

/* ------------------------------- AUMENTO NO VALOR DE ATRIBUTO (o talento) */

/**
 * No Livro do Jogador de 2024 o aumento de atributo é um talento como qualquer
 * outro — e o mais escolhido de todos, já que é o padrão das vagas de nível 4,
 * 8, 12, 16 e 19. Ele é o único repetível, e o único que dá +2 num atributo em
 * vez de +1, então não cabe na caixa de escolhas genérica.
 *
 * As escolhas moram em `featChoices.ability_score_improvement.options`, com as
 * chaves `asiVezes`, `asi0a`, `asi0b`, `asi1a`… Assim tudo continua sendo
 * `kind: "option"` para o mesmo ouvinte de sempre, e salva junto com o resto do
 * personagem sem nenhum formato novo.
 */
const ASI_FEAT_ID = "ability_score_improvement";
const ASI_MAX_VEZES = 5;   // as cinco vagas de talento de uma classe só

/** Quantas vezes o talento de aumento de atributo foi pego (1 a 5) */
function asiVezes() {
  const n = parseInt(featChoicesFor(ASI_FEAT_ID).options.asiVezes, 10);
  return Math.min(Math.max(n || 1, 1), ASI_MAX_VEZES);
}

/** Os dois +1 de cada vez que o talento foi pego; o mesmo atributo duas vezes é +2 */
function asiEscolhas() {
  const ch = featChoicesFor(ASI_FEAT_ID);
  const pares = [];
  for (let i = 0; i < asiVezes(); i++) {
    pares.push([ch.options[`asi${i}a`] || "", ch.options[`asi${i}b`] || ""]);
  }
  return pares;
}

/** Quantas escolhas de talento um talento consome (o aumento pode valer por vários) */
function vagasQueOTalentoUsa(feat) {
  return feat && feat.id === ASI_FEAT_ID ? asiVezes() : 1;
}

/**
 * Escolhas que não dá para deduzir da descrição.
 * `grants` = magias fixas que o talento concede (vão direto para a ficha).
 * `spells` = magias que o jogador escolhe. `skills` / `expertise` = perícias.
 * `options` = listas fechadas (elemento, tipo de dano).
 * `asi` = a caixa própria do Aumento no Valor de Atributo.
 */
const FEAT_EXTRA_CHOICES = {
  ability_score_improvement: { asi: true },

  magic_initiate_cleric: { spells: magicInitiateSlots("cleric", "Clérigo") },
  magic_initiate_druid: { spells: magicInitiateSlots("druid", "Druida") },
  magic_initiate_wizard: { spells: magicInitiateSlots("wizard", "Mago") },

  fey_touched: {
    grants: ["misty_step"],
    spells: [{ key: "s1", label: "Magia de 1º Círculo (Adivinhação ou Encantamento)", level: 1, schools: ["Adivinhação", "Encantamento"] }]
  },
  shadow_touched: {
    grants: ["invisibility"],
    spells: [{ key: "s1", label: "Magia de 1º Círculo (Ilusão ou Necromancia)", level: 1, schools: ["Ilusão", "Necromancia"] }]
  },
  telekinetic: { grants: ["mage_hand"] },
  telepathic: { grants: ["detect_thoughts"], grantNames: { detect_thoughts: "Detectar Pensamentos (Detect Thoughts)" } },
  spell_sniper: { spells: [{ key: "c1", label: "Truque com jogada de ataque", level: 0 }] },
  ritual_caster: {
    spells: [
      { key: "r1", label: "Magia de Ritual (1º Círculo)", level: 1, ritual: true },
      { key: "r2", label: "Segunda Magia de Ritual (1º Círculo)", level: 1, ritual: true }
    ]
  },

  skilled: {
    skills: [
      { key: "s1", label: "Perícia 1" },
      { key: "s2", label: "Perícia 2" },
      { key: "s3", label: "Perícia 3" }
    ]
  },
  skill_expert: {
    skills: [{ key: "s1", label: "Proficiência em 1 perícia" }],
    expertise: { key: "exp", label: "Especialização (dobro do PB) em 1 perícia treinada" }
  },

  elemental_adept: {
    options: [{ key: "element", label: "Tipo de dano", values: ["Fogo", "Frio", "Elétrico", "Ácido", "Trovão"] }]
  },
  boon_energy_resistance: {
    options: [
      { key: "res1", label: "Resistência 1", values: ["Ácido", "Elétrico", "Frio", "Fogo", "Necrótico", "Psíquico", "Radiante", "Trovão", "Veneno"] },
      { key: "res2", label: "Resistência 2", values: ["Ácido", "Elétrico", "Frio", "Fogo", "Necrótico", "Psíquico", "Radiante", "Trovão", "Veneno"] }
    ]
  }
};

/** Descreve tudo que um talento pede ao jogador */
function getFeatChoiceSpec(feat) {
  if (!feat) return { abilityOptions: [], spells: [], skills: [], options: [], grants: [], expertise: null, asi: false, hasChoices: false };
  const extra = FEAT_EXTRA_CHOICES[feat.id] || {};
  const abilityOptions = extra.abilityOptions || parseFeatAbilityOptions(feat.desc);
  const spells = extra.spells || [];
  const skills = extra.skills || [];
  const options = extra.options || [];
  const grants = extra.grants || [];
  const expertise = extra.expertise || null;
  const asi = !!extra.asi;
  const hasStyleEffect = !!FIGHTING_STYLE_EFFECTS[feat.id];
  return {
    abilityOptions, spells, skills, options, grants, expertise, asi, hasStyleEffect,
    hasChoices: !!(abilityOptions.length || spells.length || skills.length ||
                   options.length || grants.length || expertise || asi || hasStyleEffect)
  };
}

/** Escolhas já feitas para um talento (cria sob demanda) */
function featChoicesFor(featId) {
  if (!character.featChoices || typeof character.featChoices !== "object") character.featChoices = {};
  if (!character.featChoices[featId]) character.featChoices[featId] = {};
  const c = character.featChoices[featId];
  if (!c.spells || typeof c.spells !== "object") c.spells = {};
  if (!c.skills || typeof c.skills !== "object") c.skills = {};
  if (!c.options || typeof c.options !== "object") c.options = {};
  return c;
}

/**
 * Talentos que estão realmente valendo: os marcados, o de Origem do
 * antecedente e o extra do Humano.
 *
 * É por aqui que passam magias concedidas, escolhas de talento e os efeitos
 * mecânicos — quem entra nesta lista vale para tudo.
 */
/** Um talento personalizado está no personagem quando foi marcado, como os oficiais */
function customFeatIsSelected(cf) {
  return (character.selectedFeats || []).includes(cf.id);
}

/** Os talentos personalizados marcados */
function getSelectedCustomFeats() {
  return (character.customFeats || []).filter(customFeatIsSelected);
}

function getActiveFeatIds() {
  const ids = (character.selectedFeats || []).slice();
  [getOriginFeatId(), getHumanOriginFeatId(), ...(character.extraOriginFeats || [])]
    .forEach(id => {
      if (id && !ids.includes(id)) ids.push(id);
    });
  return ids;
}

/** Nome de exibição de uma magia pelo id, com fallback para talentos fora do catálogo */
function spellDisplayName(id, fallback) {
  const sp = DND5E_DATA.spells.find(s => s.id === id);
  if (sp) return sp.name;
  return fallback || id;
}

/** Magias elegíveis para um slot de escolha de talento */
function getFeatSpellOptions(slot) {
  return DND5E_DATA.spells
    .filter(sp => {
      if (slot.level !== undefined && sp.level !== slot.level) return false;
      if (slot.classes && !(sp.classes || []).some(c => slot.classes.includes(c))) return false;
      if (slot.schools && !slot.schools.some(s => String(sp.school || "").startsWith(s))) return false;
      if (slot.ritual && !/Ritual/i.test(`${sp.school} ${sp.time} ${sp.desc}`)) return false;
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Caixa de escolhas exibida dentro da linha do talento.
 * Fica no DOM mesmo com o talento desmarcado (apenas `hidden`), para que marcar
 * a caixa não exija reconstruir a lista inteira e perder o foco.
 */
function buildFeatChoiceBoxHtml(feat, isActive) {
  const spec = getFeatChoiceSpec(feat);
  if (!spec.hasChoices) return "";
  const ch = featChoicesFor(feat.id);
  const fields = [];

  const field = (label, inner) => `
    <label class="feat-choice-field">
      <span class="feat-choice-label">${label}</span>
      ${inner}
    </label>`;

  if (spec.abilityOptions.length) {
    const opts = spec.abilityOptions.map(id => {
      const ab = DND5E_DATA.abilities.find(a => a.id === id);
      return `<option value="${id}"${ch.ability === id ? " selected" : ""}>${ab ? `${ab.name} (${ab.abbr})` : id}</option>`;
    }).join("");
    fields.push(field("Atributo a aumentar (+1)",
      `<select class="feat-choice-input" data-choice-feat="${feat.id}" data-choice-kind="ability">
         <option value="">— escolher —</option>${opts}
       </select>`));
  }

  spec.spells.forEach(slot => {
    const opts = getFeatSpellOptions(slot).map(sp =>
      `<option value="${sp.id}"${ch.spells[slot.key] === sp.id ? " selected" : ""}>${sp.name}</option>`).join("");
    fields.push(field(slot.label,
      `<select class="feat-choice-input" data-choice-feat="${feat.id}" data-choice-kind="spell" data-choice-key="${slot.key}">
         <option value="">— escolher —</option>${opts}
       </select>`));
  });

  spec.skills.forEach(slot => {
    const opts = DND5E_DATA.skills.map(sk => {
      const ab = DND5E_DATA.abilities.find(a => a.id === sk.ability);
      return `<option value="${sk.id}"${ch.skills[slot.key] === sk.id ? " selected" : ""}>${sk.name} (${ab ? ab.abbr : ""})</option>`;
    }).join("");
    fields.push(field(slot.label,
      `<select class="feat-choice-input" data-choice-feat="${feat.id}" data-choice-kind="skill" data-choice-key="${slot.key}">
         <option value="">— escolher —</option>${opts}
       </select>`));
  });

  if (spec.expertise) {
    const trained = DND5E_DATA.skills.filter(sk => character.trainedSkills.includes(sk.id));
    const pool = trained.length ? trained : DND5E_DATA.skills;
    const opts = pool.map(sk =>
      `<option value="${sk.id}"${ch.expertise === sk.id ? " selected" : ""}>${sk.name}</option>`).join("");
    fields.push(field(spec.expertise.label,
      `<select class="feat-choice-input" data-choice-feat="${feat.id}" data-choice-kind="expertise">
         <option value="">— escolher —</option>${opts}
       </select>`));
  }

  spec.options.forEach(slot => {
    const opts = slot.values.map(v =>
      `<option value="${v}"${ch.options[slot.key] === v ? " selected" : ""}>${v}</option>`).join("");
    fields.push(field(slot.label,
      `<select class="feat-choice-input" data-choice-feat="${feat.id}" data-choice-kind="option" data-choice-key="${slot.key}">
         <option value="">— escolher —</option>${opts}
       </select>`));
  });

  if (spec.asi) {
    const vezes = asiVezes();
    const selAtributo = (chave) => `
      <select class="feat-choice-input" data-choice-feat="${feat.id}" data-choice-kind="option" data-choice-key="${chave}">
        <option value="">— escolher —</option>
        ${DND5E_DATA.abilities.map(a =>
          `<option value="${a.id}"${ch.options[chave] === a.id ? " selected" : ""}>${a.name} (${a.abbr})</option>`).join("")}
      </select>`;
    fields.push(field("Quantas vezes você pegou este talento",
      `<select class="feat-choice-input" data-choice-feat="${feat.id}" data-choice-kind="option" data-choice-key="asiVezes">
         ${Array.from({ length: ASI_MAX_VEZES }, (_, i) => i + 1).map(n =>
           `<option value="${n}"${vezes === n ? " selected" : ""}>${n}x</option>`).join("")}
       </select>`));
    for (let i = 0; i < vezes; i++) {
      const prefixo = vezes > 1 ? `${i + 1}º aumento — ` : "";
      fields.push(field(`${prefixo}primeiro +1`, selAtributo(`asi${i}a`)));
      fields.push(field(`${prefixo}segundo +1 (repita o atributo para +2)`, selAtributo(`asi${i}b`)));
    }
  }

  const grantLine = spec.grants.length
    ? `<p class="feat-choice-granted"><i class="fa-solid fa-wand-sparkles"></i> Vai direto para a ficha:
         ${spec.grants.map(id => spellDisplayName(id, (FEAT_EXTRA_CHOICES[feat.id]?.grantNames || {})[id])).join(", ")}</p>`
    : "";

  const styleNote = FIGHTING_STYLE_EFFECTS[feat.id]
    ? `<p class="feat-choice-granted"><i class="fa-solid fa-gears"></i> Aplicado na ficha: ${FIGHTING_STYLE_EFFECTS[feat.id].note}</p>`
    : "";

  return `
    <div class="feat-choice-box" data-choice-box="${feat.id}"${isActive ? "" : " hidden"}>
      <div class="feat-choice-title"><i class="fa-solid fa-sliders"></i> Escolhas deste talento</div>
      ${fields.length ? `<div class="feat-choice-grid">${fields.join("")}</div>` : ""}
      ${grantLine}${styleNote}
    </div>`;
}

/**
 * Resumo, em uma linha, do que as escolhas daquele talento aplicaram — é o
 * comentário que acompanha o talento na ficha.
 */
function describeFeatChoices(feat) {
  const spec = getFeatChoiceSpec(feat);
  if (!spec.hasChoices) return "";
  const ch = featChoicesFor(feat.id);

  const parts = [];

  if (ch.ability) {
    const ab = DND5E_DATA.abilities.find(a => a.id === ch.ability);
    parts.push(`+1 em ${ab ? ab.abbr : ch.ability}`);
  }
  const spells = [
    ...spec.grants,
    ...spec.spells.map(slot => ch.spells[slot.key]).filter(Boolean)
  ];
  if (spells.length) {
    const names = FEAT_EXTRA_CHOICES[feat.id]?.grantNames || {};
    parts.push(`magias: ${spells.map(id => spellDisplayName(id, names[id])).join(", ")}`);
  }
  const skills = Object.values(ch.skills || {}).filter(Boolean)
    .map(id => (DND5E_DATA.skills.find(s => s.id === id) || {}).name || id);
  if (skills.length) parts.push(`perícias: ${skills.join(", ")}`);
  if (ch.expertise) {
    const sk = DND5E_DATA.skills.find(s => s.id === ch.expertise);
    parts.push(`especialização: ${sk ? sk.name : ch.expertise}`);
  }
  if (spec.asi) {
    asiEscolhas().forEach((par, i) => {
      const soma = {};
      par.filter(Boolean).forEach(id => { soma[id] = (soma[id] || 0) + 1; });
      const txt = Object.keys(soma).map(id => {
        const ab = DND5E_DATA.abilities.find(a => a.id === id);
        return `+${soma[id]} em ${ab ? ab.abbr : id}`;
      }).join(", ");
      if (txt) parts.push(asiEscolhas().length > 1 ? `${i + 1}º aumento: ${txt}` : txt);
    });
  } else {
    Object.values(ch.options || {}).filter(Boolean).forEach(v => parts.push(v));
  }

  const styleEffect = FIGHTING_STYLE_EFFECTS[feat.id];
  if (styleEffect) parts.push(styleEffect.note);

  return parts.length ? ` [aplicado — ${parts.join("; ")}]` : "";
}

/** Perícias e especializações que vieram de escolhas de talento */
function getFeatGrantedSkills() {
  const trained = [];
  const expert = [];
  getActiveFeatIds().forEach(fid => {
    const ch = featChoicesFor(fid);
    Object.values(ch.skills || {}).forEach(s => { if (s) trained.push(s); });
    if (ch.expertise) expert.push(ch.expertise);
  });
  return { trained, expert };
}

/** +1 de atributo escolhido nos talentos ativos */
function getFeatAbilityBonus(abilityId) {
  let bonus = 0;
  getActiveFeatIds().forEach(fid => {
    if (featChoicesFor(fid).ability === abilityId) bonus += 1;
    // O Aumento no Valor de Atributo tem dois +1 por vez que foi pego, e os
    // dois podem cair no mesmo atributo (que é o +2 do livro).
    if (fid === ASI_FEAT_ID) {
      asiEscolhas().forEach(par => par.forEach(id => { if (id === abilityId) bonus += 1; }));
    }
  });
  return bonus;
}

/**
 * Todas as magias concedidas sem passar pelo catálogo do Passo 4:
 * subclasse, espécie/linhagem e talentos (fixas e escolhidas).
 */
/**
 * Tabelas de terreno do Círculo da Terra.
 *
 * É o único caso do livro em que as magias não são fixas: o Druida escolhe um
 * terreno a cada Descanso Longo e usa a tabela correspondente. O app não modela
 * essa escolha, então as quatro tabelas ficam só descritas — conceder as de um
 * terreno fixo daria magias que o personagem pode não ter.
 */
function landSpellsHtml(sub, nivel) {
  if (!sub || !sub.landSpells) return "";
  const nomeDaMagia = (id) => {
    const sp = DND5E_DATA.spells.find(s => s.id === id);
    return sp ? sp.name.split(" (")[0] : id;
  };
  const blocos = Object.keys(sub.landSpells).map(terreno => {
    const tab = sub.landSpells[terreno];
    const linhas = Object.keys(tab).map(Number).sort((a, b) => a - b).map(n => {
      const chegou = n <= nivel;
      return `<span style="opacity: ${chegou ? 1 : 0.45}">Nível ${n}: ${tab[n].map(nomeDaMagia).join(", ")}</span>`;
    });
    return `<div style="margin-top: 0.25rem;"><strong>${terreno}</strong><br>${linhas.join("<br>")}</div>`;
  });
  return `<div style="margin-top: 0.3rem; font-size: 0.8rem; color: #fbbf24; line-height: 1.5;">
    <strong>Magias de Círculo Druídico</strong> — escolha um terreno a cada Descanso Longo
    e prepare a lista dele até o seu nível. Como a escolha muda a cada descanso, o app não
    adiciona essas magias à ficha automaticamente.
    ${blocos.join("")}
  </div>`;
}

/**
 * Lista das magias da subclasse por nível, marcando o que ainda não chegou.
 * Mostrar a tabela inteira ajuda a planejar; marcar o que falta evita a
 * impressão de que a magia já está disponível.
 */
function subclassSpellsHtml(sub, nivel) {
  if (!sub || !sub.bonusSpells) return "";
  const niveis = Object.keys(sub.bonusSpells).map(Number).sort((a, b) => a - b);
  if (!niveis.length) return "";
  const nomeDaMagia = (id) => {
    const sp = DND5E_DATA.spells.find(s => s.id === id);
    return sp ? sp.name.split(" (")[0] : id;
  };
  const linhas = niveis.map(n => {
    const chegou = n <= nivel;
    return `<span style="opacity: ${chegou ? 1 : 0.45}">Nível ${n}: ${sub.bonusSpells[n].map(nomeDaMagia).join(", ")}${chegou ? "" : " (ainda não)"}</span>`;
  });
  return `<p style="margin-top: 0.3rem; font-size: 0.8rem; color: #fbbf24; line-height: 1.5;">
    <strong>Magias Concedidas:</strong><br>${linhas.join("<br>")}</p>`;
}

/**
 * Magias que a subclasse já concede até o nível informado.
 *
 * `bonusSpells` é um mapa nível -> ids, direto da tabela "Magias de <Subclasse>"
 * do capítulo 3. Subclasse sem tabela no livro (colégios de Bardo, escolas de
 * Mago, Caçador, Mestre das Feras, Círculo da Terra e Círculo das Estrelas) não
 * tem a chave — o Círculo da Terra tem, mas por tipo de terreno escolhido a cada
 * Descanso Longo, que o app não modela.
 */
function subclassSpellsUpTo(sub, nivel) {
  if (!sub || !sub.bonusSpells || nivel < 1) return [];
  return Object.keys(sub.bonusSpells)
    .map(Number)
    .filter(n => n <= nivel)
    .sort((a, b) => a - b)
    .flatMap(n => sub.bonusSpells[n]);
}

function getGrantedSpellEntries() {
  const out = [];
  // `tipo` é o rótulo curto da etiqueta; `source` é a frase completa do tooltip.
  // Antes só existia `source`, e quem precisava do rótulo o adivinhava com uma
  // expressão sobre o começo da frase, caindo em "Espécie" para tudo que não
  // reconhecia — foi assim que a Destruição Divina, concedida pelo Paladino,
  // apareceu etiquetada como espécie.
  const push = (id, source, name, tipo) => {
    if (!id) return;
    const found = out.find(e => e.id === id);
    if (found) { if (!found.source.includes(source)) found.source += `, ${source}`; return; }
    out.push({ id, source, tipo: tipo || "Espécie", name: name || spellDisplayName(id, name) });
  };

  const class1Obj = resolveClassObj(character.class1, 1);
  const class2Obj = character.class2 !== "none" ? resolveClassObj(character.class2, 2) : null;

  // As magias de subclasse chegam por nível, conforme a tabela do livro (3, 5, 7
  // e 9 no conjurador pleno; 3, 5, 9, 13 e 17 no Paladino e no Guardião). Antes
  // a lista era achatada e vinha inteira já no nível 3 — um Paladino de nível 4
  // aparecia com magias de 2º e 3º círculo.
  const somarSubclasse = (classObj, subId, nivel) => {
    if (!classObj || !classObj.subclasses) return;
    const sub = classObj.subclasses.find(x => x.id === subId);
    if (!sub || !sub.bonusSpells) return;
    subclassSpellsUpTo(sub, nivel).forEach(id => push(id, `Subclasse (${sub.name})`, null, "Subclasse"));
  };
  somarSubclasse(class1Obj, character.subclass1, character.level1);
  if (class2Obj) somarSubclasse(class2Obj, character.subclass2, character.level2);

  // Magias que a PRÓPRIA classe concede por característica, sempre preparadas.
  // Faltava este caminho: só subclasse, espécie e talento concediam. O
  // Paladino de nível 2 aparecia tendo de preparar a Destruição Divina, quando
  // ela vem de graça com a Destruição do Paladino — e ainda comia uma vaga do
  // limite de preparadas. Vale o mesmo para a Montaria Fiel do 5º, a Marca do
  // Caçador do Guardião e o Contatar Patrono do Bruxo.
  const somarClasse = (classObj, nivel) => {
    if (!classObj || !classObj.grantedSpells || nivel < 1) return;
    Object.keys(classObj.grantedSpells)
      .map(Number)
      .filter(n => n <= nivel)
      .sort((a, b) => a - b)
      .forEach(n => classObj.grantedSpells[n].forEach(g => {
        const classe = classObj.name.split(" (")[0];
        push(g.id, `${classe} (${g.feature})`, null, "Classe");
      }));
  };
  somarClasse(class1Obj, character.level1);
  if (class2Obj) somarClasse(class2Obj, character.level2);

  if (character.species === "elf" && character.lineage === "high_elf") {
    if (character.level1 >= 3) push("misty_step", "Alto Elfo", null, "Espécie");
  } else if (character.species === "tiefling") {
    push("thaumaturgy", "Tiefling", null, "Espécie");
  } else if (character.species === "aasimar") {
    push("light", "Aasimar", null, "Espécie");
  } else if (character.species === "gnome" && character.lineage === "forest_gnome") {
    push("minor_illusion", "Gnomo da Floresta", null, "Espécie");
  }

  // O talento de origem do antecedente aparece como "Antecedente": para o
  // jogador ele veio da escolha do Passo 1, não de uma escolha de talento.
  const featOrigem = getOriginFeatObj();
  getActiveFeatIds().forEach(fid => {
    const feat = DND5E_DATA.feats.find(f => f.id === fid);
    if (!feat) return;
    const tipo = featOrigem && featOrigem.id === fid ? "Antecedente" : "Talento";
    const spec = getFeatChoiceSpec(feat);
    const names = FEAT_EXTRA_CHOICES[fid]?.grantNames || {};
    spec.grants.forEach(id => push(id, `Talento (${feat.name})`, names[id], tipo));
    const ch = featChoicesFor(fid);
    spec.spells.forEach(slot => push(ch.spells[slot.key], `Talento (${feat.name})`, null, tipo));
  });

  return out;
}

/* ------------------------------------------------------ ESTILOS DE LUTA */

/**
 * Efeito mecânico de cada Estilo de Luta.
 * `atk` / `dmg` entram no cálculo das linhas de arma; `ac` entra na Classe de
 * Armadura; `note` é o comentário que acompanha o número na ficha.
 */
const FIGHTING_STYLE_EFFECTS = {
  fighting_style_archery: { applies: "ranged", atk: 2, note: "Arqueirismo: +2 no ataque à distância" },
  fighting_style_dueling: { applies: "melee_one_hand", dmg: 2, note: "Duelismo: +2 no dano (uma mão, sem outra arma)" },
  fighting_style_thrown_weapon: { applies: "thrown", dmg: 2, note: "Armas de Arremesso: +2 no dano" },
  fighting_style_great_weapon: { applies: "two_handed", note: "Grandes Armas: rerrola 1 e 2 no dado de dano" },
  fighting_style_two_weapon: { applies: "light", note: "Duas Armas: soma o modificador no ataque bônus" },
  fighting_style_unarmed: { applies: "none", note: "Combate Desarmado: 1d6+FOR desarmado (1d8 com as mãos livres)" },
  fighting_style_defense: { applies: "armor", ac: 1, note: "Defesa: +1 na CA usando armadura" },
  fighting_style_blind_fighting: { applies: "none", note: "Luta Cega: Percepção às Cegas de 3 m" },
  fighting_style_interception: { applies: "none", note: "Interceptação: Reação reduz 1d10+PB de dano" },
  fighting_style_protection: { applies: "none", note: "Proteção: Reação impõe Desvantagem no ataque" }
};

/** Estilos de luta ativos, na ordem em que aparecem na lista de talentos */
function getActiveFightingStyles() {
  return getActiveFeatIds()
    .filter(id => FIGHTING_STYLE_EFFECTS[id])
    .map(id => ({ id, feat: DND5E_DATA.feats.find(f => f.id === id), effect: FIGHTING_STYLE_EFFECTS[id] }));
}

/** Uma arma tem a propriedade? (compara pelo prefixo, pois há "Arremesso (alcance 6/18m)") */
/**
 * Dado de Artes Marciais do Monge no nível de monge informado (d6 → d12).
 *
 * Fica no data.js, junto da classe, porque é tabela de regra e não conta.
 * Devolve null para quem não é monge — é isso que separa o ataque desarmado do
 * monge (dado que cresce, atributo à escolha) do de todo mundo (1 de dano).
 */
function getMartialArtsDie(classId, nivel) {
  const c = DND5E_DATA.classes.find(x => x.id === classId);
  if (!c || !c.martialArtsByLevel || nivel < 1) return null;
  return c.martialArtsByLevel[Math.min(20, nivel)] || null;
}

/** O melhor dado de Artes Marciais entre as duas classes do personagem */
function getMonkMartialArtsDie() {
  const d1 = getMartialArtsDie(character.class1, character.level1 || 0);
  const d2 = getMartialArtsDie(character.class2, character.level2 || 0);
  if (!d1) return d2;
  if (!d2) return d1;
  const faces = (d) => parseInt(String(d).split("d")[1], 10) || 0;
  return faces(d1) >= faces(d2) ? d1 : d2;
}

/**
 * Linha de ataque desarmado ou de arma improvisada, que não seguem a conta das
 * armas comuns.
 *
 * Desarmado (Livro do Jogador 2024): 1 de dano Contundente mais o modificador
 * de Força, e todo personagem é proficiente. O Monge troca esse 1 pelo dado de
 * Artes Marciais e pode usar Destreza no lugar de Força — o app já entrega os
 * dois com o maior dos dois modificadores somado.
 *
 * Improvisada: 1d4 e SEM bônus de proficiência, salvo quando o objeto lembra
 * uma arma que o personagem sabe usar. Como isso depende do objeto na mão, a
 * linha sai sem o bônus e diz o motivo nas observações, em vez de somar um
 * número que pode estar errado na mesa.
 */
function linhaDeAtaqueSemArma(w, finalMods, pb) {
  const strMod = finalMods["str"] || 0;
  const dexMod = finalMods["dex"] || 0;

  if (w.id === "improvised") {
    const atkMod = strMod;
    return {
      srcId: "weapon:" + w.id,
      name: w.name,
      atk: `${atkMod >= 0 ? "+" : ""}${atkMod}`,
      damage: `1d4${strMod !== 0 ? (strMod > 0 ? " +" + strMod : " " + strMod) : ""} ${w.damageType}`,
      notes: "Sem proficiência (some o bônus se o objeto lembrar uma arma que você usa)"
    };
  }

  const dadoMonge = getMonkMartialArtsDie();
  const usaDex = !!dadoMonge && dexMod > strMod;
  const mod = usaDex ? dexMod : strMod;
  const atkMod = mod + pb;
  const dano = dadoMonge || "1";

  return {
    srcId: "weapon:" + w.id,
    name: dadoMonge ? "Ataque Desarmado (Artes Marciais)" : w.name,
    atk: `${atkMod >= 0 ? "+" : ""}${atkMod}`,
    damage: `${dano}${mod !== 0 ? (mod > 0 ? " +" + mod : " " + mod) : ""} ${w.damageType}`,
    notes: dadoMonge
      ? `Artes Marciais ${dadoMonge} • usa ${usaDex ? "Destreza" : "Força"} (o maior dos dois)`
      : "Proficiente"
  };
}

function weaponHasProp(w, prop) {
  return (w.properties || []).some(p => String(p).toLowerCase().startsWith(prop.toLowerCase()));
}

/** A arma é de ataque à distância? (o dado usa "Distância" / "Corpo a Corpo") */
function isRangedWeapon(w) {
  return /dist/i.test(String(w.type || ""));
}

/** O estilo se aplica a esta arma? */
function styleAppliesToWeapon(effect, w) {
  switch (effect.applies) {
    case "ranged": return isRangedWeapon(w);
    case "melee_one_hand": return !isRangedWeapon(w) && !weaponHasProp(w, "Duas Mãos");
    case "thrown": return weaponHasProp(w, "Arremesso");
    case "two_handed": return weaponHasProp(w, "Duas Mãos") || weaponHasProp(w, "Versátil");
    case "light": return weaponHasProp(w, "Leve");
    default: return false;
  }
}

/** Bônus e comentários que os estilos de luta somam a uma arma */
function getWeaponStyleMods(w) {
  const mods = { atk: 0, dmg: 0, notes: [] };
  if (!w) return mods;
  getActiveFightingStyles().forEach(({ effect }) => {
    if (!styleAppliesToWeapon(effect, w)) return;
    mods.atk += effect.atk || 0;
    mods.dmg += effect.dmg || 0;
    mods.notes.push(effect.note);
  });
  return mods;
}

/** Bônus e comentário que os estilos de luta somam à armadura */
function getArmorStyleMods(armorObj) {
  const mods = { ac: 0, notes: [] };
  getActiveFightingStyles().forEach(({ effect }) => {
    if (effect.applies !== "armor") return;
    if (!armorObj || armorObj.id === "none") return;
    mods.ac += effect.ac || 0;
    mods.notes.push(effect.note);
  });
  return mods;
}

/**
 * Painel do Passo 5 que explica, em texto, o que os estilos de luta mudaram
 * na armadura e em cada arma equipada.
 */
function renderStyleEffectsPanel(ctx) {
  const panel = document.getElementById("styleEffectsPanel");
  if (!panel) return;

  const styles = getActiveFightingStyles();
  if (!styles.length) {
    panel.hidden = true;
    panel.innerHTML = "";
    return;
  }

  const armorObj = DND5E_DATA.armors.find(a => a.id === character.equippedArmor) || DND5E_DATA.armors[0];
  const armorMods = getArmorStyleMods(armorObj);
  const lines = [];

  if (armorMods.ac) {
    lines.push(`<li><strong>${armorObj.name}:</strong> CA ${ctx.ac - armorMods.ac} → <strong>${ctx.ac}</strong> · ${armorMods.notes.join(" · ")}</li>`);
  } else if (styles.some(s => s.effect.applies === "armor")) {
    lines.push(`<li><strong>Sem armadura:</strong> o estilo Defesa só vale usando armadura — equipe uma para ganhar o +1 de CA.</li>`);
  }

  character.weapons.forEach(wId => {
    if (!wId || wId === "none") return;
    const w = DND5E_DATA.weapons.find(x => x.id === wId);
    if (!w) return;
    const m = getWeaponStyleMods(w);
    if (!m.notes.length) return;
    const deltas = [
      m.atk ? `ataque ${m.atk > 0 ? "+" : ""}${m.atk}` : "",
      m.dmg ? `dano ${m.dmg > 0 ? "+" : ""}${m.dmg}` : ""
    ].filter(Boolean).join(", ");
    lines.push(`<li><strong>${w.name}:</strong> ${deltas ? `${deltas} · ` : ""}${m.notes.join(" · ")}</li>`);
  });

  const inactive = styles.filter(s => s.effect.applies === "none");
  inactive.forEach(s => lines.push(`<li><strong>${s.feat ? s.feat.name : s.id}:</strong> ${s.effect.note} <em>(sem efeito numérico — vai como anotação na ficha)</em></li>`));

  panel.hidden = false;
  panel.innerHTML = `
    <h4><i class="fa-solid fa-hand-fist"></i> Efeitos dos Estilos de Luta aplicados</h4>
    <ul class="style-effects-list">${lines.join("") || "<li>Nenhum dos estilos ativos altera as armas ou a armadura equipadas.</li>"}</ul>`;
}

/**
 * Rótulo legível do tipo de talento
 */
function featTypeLabel(type) {
  if (type === "origin") return "Origem";
  if (type === "fighting_style") return "Estilo de Luta";
  if (type === "epic") return "Épico";
  if (type === "custom") return "Personalizado";
  return "Geral";
}

/**
 * Conteúdo do painel "i" de um talento
 */
function buildFeatInfoHtml(f) {
  return `
    <p class="feat-info-meta"><strong>Tipo:</strong> ${featTypeLabel(f.type)}${f.prereq ? ` &nbsp;•&nbsp; <strong>Pré-requisito:</strong> ${f.prereq}` : ''}</p>
    <p>${f.desc}</p>
  `;
}

/**
 * Renderiza e gerencia a lista de Itens Customizados (Armas Mágicas, Armaduras, Poções, etc.)
 */
function renderCustomItemsList() {
  const container = document.getElementById("customItemsContainer");
  if (!container) return;

  container.innerHTML = "";

  if (character.customItems.length === 0) {
    container.innerHTML = `<p style="grid-column: 1 / -1; color: #94a3b8; font-size: 0.82rem; font-style: italic;">Nenhum item customizado criado ainda. Crie armas mágicas, relíquias ou vestes clicando em "+ Novo Item Customizado".</p>`;
    return;
  }

  character.customItems.forEach(item => {
    const card = document.createElement("div");
    card.className = `custom-item-card ${item.equipped ? 'is-equipped' : ''}`;
    
    let typeName = "Item Mágico";
    if (item.type === "weapon") typeName = "Arma";
    else if (item.type === "armor") typeName = "Armadura";
    else if (item.type === "shield") typeName = "Escudo";
    else if (item.type === "potion") typeName = "Poção";
    else if (item.type === "scroll") typeName = "Pergaminho";
    else if (item.type === "ring") typeName = "Anel / Amuleto";
    else if (item.type === "wondrous") typeName = "Item Maravilhoso";

    card.innerHTML = `
      <div>
        <div class="custom-item-header">
          <span class="custom-item-title">${item.name}</span>
          <div style="display: flex; gap: 4px;">
            <button class="btn btn-sm ${item.equipped ? 'btn-gold' : 'btn-secondary'} btn-toggle-equip-item" data-id="${item.id}" title="${item.equipped ? 'Desequipar item' : 'Equipar item'}">
              <i class="fa-solid ${item.equipped ? 'fa-shield-halved' : 'fa-hand'}"></i> ${item.equipped ? 'Equipado' : 'Equipar'}
            </button>
            <button class="btn btn-secondary btn-sm btn-delete-custom-item" data-id="${item.id}" style="color: #f87171; padding: 2px 6px;" title="Excluir item">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="custom-item-meta" style="margin: 3px 0;">
          <span style="color: #fbbf24; font-weight: 600;">${typeName}</span>
          ${item.damage ? `<span>• Dano: ${item.damage} ${item.damageType || ''}</span>` : ''}
          ${item.acBonus > 0 ? `<span>• +${item.acBonus} CA</span>` : ''}
          ${item.mastery ? `<span>• Maestria: ${item.mastery}</span>` : ''}
          ${item.attunement === "true" || item.attunement === true ? '<span style="color: #a855f7;">• Sintonização</span>' : ''}
        </div>
        <p class="custom-item-desc">${item.desc || 'Sem descrição.'}</p>
      </div>
      <div style="font-size: 0.72rem; color: #94a3b8; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.25rem; margin-top: 0.25rem; display: flex; justify-content: space-between;">
        <span>Peso: ${item.weight || '-'}</span>
        <span>Valor: ${item.cost || '-'}</span>
      </div>
    `;

    card.querySelector(".btn-toggle-equip-item").addEventListener("click", () => {
      item.equipped = !item.equipped;
      renderCustomItemsList();
      recalculateCharacter();
      showToast(`${item.name} ${item.equipped ? 'equipado' : 'desequipado'}!`);
    });

    card.querySelector(".btn-delete-custom-item").addEventListener("click", () => {
      if (confirm(`Deseja excluir o item customizado "${item.name}"?`)) {
        character.customItems = character.customItems.filter(i => i.id !== item.id);
        renderCustomItemsList();
        recalculateCharacter();
        showToast("Item removido.");
      }
    });

    container.appendChild(card);
  });
}

/**
 * Calcula a capacidade de magias
 */
function getSpellCapacityInfo(finalMods) {
  const class1Obj = resolveClassObj(character.class1, 1);
  const class2Obj = character.class2 !== "none" ? resolveClassObj(character.class2, 2) : null;

  let maxCantrips = 0;
  let maxPrepared = 0;
  // Cada parcela da soma fica registrada aqui para o painel poder explicá-la.
  const breakdown = [];
  const soma = (fonte, truques, preparadas, detalhe, origem) => {
    if (!truques && !preparadas) return;
    maxCantrips += truques;
    maxPrepared += preparadas;
    breakdown.push({ fonte, truques, preparadas, detalhe, origem: origem || "Classe" });
  };

  const somaClasse = (classObj, nivel, rotuloNivel) => {
    if (!classObj || !classObj.spellcasting || nivel < 1) return;
    const sc = classObj.spellcasting;
    const truques = (sc.cantripsKnown && sc.cantripsKnown[nivel]) || 0;
    let preparadas = 0;
    if (sc.calcPrepared) {
      preparadas = sc.calcPrepared(nivel, finalMods[sc.ability] || 0);
    } else if (sc.preparedSpells) {
      preparadas = sc.preparedSpells[nivel] || 0;
    }
    soma(`${classObj.name} nível ${nivel}`, truques, preparadas, `tabela de ${rotuloNivel}`);
  };

  somaClasse(class1Obj, character.level1, "classe");
  somaClasse(class2Obj, character.level2, "multiclasse");

  if (character.species === "elf" && character.lineage === "high_elf") {
    soma("Alto Elfo", 1, 0, "linhagem");
  }

  const grantedSpells = getGrantedSpellEntries();

  // Talentos que dão magia (Iniciado em Magia, Tocado pelas Fadas…) têm caixas
  // próprias de escolha. O que o jogador escolheu ali chega como concedido e não
  // gasta nada. O que ele deixou em branco vira folga na capacidade, para poder
  // escolher pelo catálogo — sem isso, um Paladino com Iniciado em Magia ficava
  // com "2 / 0 truques", já que a classe dele não tem truques nenhum.
  // De onde o talento veio: o do antecedente é o Talento de Origem que ele
  // concede, o do Humano vem do traço Versátil. O painel de jogo mostra essas
  // capacidades em linhas separadas, que é a divisão que o jogador procura.
  const origemDoTalento = (fid) => {
    if (fid === getOriginFeatId()) return "Antecedente";
    if (fid === getHumanOriginFeatId()) return "Espécie";
    return "Talento";
  };

  getActiveFeatIds().forEach(fid => {
    const feat = DND5E_DATA.feats.find(f => f.id === fid);
    if (!feat) return;
    const spec = getFeatChoiceSpec(feat);
    if (!spec.spells.length) return;
    const escolhas = featChoicesFor(fid).spells || {};
    let truques = 0, preparadas = 0;
    spec.spells.forEach(slot => {
      if (escolhas[slot.key]) return;              // já veio como concedida
      if (slot.level === 0) truques++; else preparadas++;
    });
    soma(feat.name.split(" (")[0], truques, preparadas, "talento", origemDoTalento(fid));
  });

  // Magia concedida por subclasse, espécie ou talento não ocupa a capacidade da
  // classe. Uma ficha antiga pode ter a mesma magia nas duas listas — escolhida
  // antes de a subclasse concedê-la —, e aí ela era contada duas vezes.
  const idsConcedidos = new Set(grantedSpells.map(g => g.id));
  const contaPorNivel = (querTruque) => character.spellsKnown.filter(id => {
    if (idsConcedidos.has(id)) return false;
    const sp = DND5E_DATA.spells.find(s => s.id === id);
    return sp && (querTruque ? sp.level === 0 : sp.level > 0);
  }).length;

  return {
    maxCantrips,
    currentCantripsCount: contaPorNivel(true),
    maxPrepared,
    currentPreparedCount: contaPorNivel(false),
    grantedSpells,
    breakdown
  };
}

/**
 * Mostra de onde vem cada parcela dos limites de truques e magias preparadas.
 * Sem isso o painel dá só o total, e não há como o jogador conferir se o número
 * bate com a tabela da classe dele.
 */
function renderSpellCapacityBreakdown(capInfo) {
  const box = document.getElementById("spellCapacityBreakdown");
  if (!box) return;

  if (!capInfo.breakdown.length) {
    box.innerHTML = '<span class="cap-bd-empty">Nenhuma fonte de conjuração: esta combinação de classe e nível não concede truques nem magias preparadas.</span>';
    return;
  }

  const linha = (rotulo, detalhe, truques, preparadas, classe) => {
    const partes = [];
    if (truques) partes.push(`${truques > 0 ? "+" : ""}${truques} truque${Math.abs(truques) > 1 ? "s" : ""}`);
    if (preparadas) partes.push(`${preparadas > 0 ? "+" : ""}${preparadas} preparada${Math.abs(preparadas) > 1 ? "s" : ""}`);
    return `<div class="cap-bd-row ${classe || ""}">
      <span class="cap-bd-src">${rotulo}${detalhe ? ` <em>(${detalhe})</em>` : ""}</span>
      <span class="cap-bd-num">${partes.join(" · ")}</span>
    </div>`;
  };

  let html = capInfo.breakdown
    .map(b => linha(b.fonte, b.detalhe, b.truques, b.preparadas))
    .join("");

  html += linha("Total", "", capInfo.maxCantrips, capInfo.maxPrepared, "is-total")
    .replace(/\+(\d+)/g, "$1");

  if (capInfo.grantedSpells.length) {
    const fontes = [...new Set(capInfo.grantedSpells.map(g => g.source))].join("; ");
    html += `<div class="cap-bd-note">
      <i class="fa-solid fa-gift"></i> ${capInfo.grantedSpells.length} magia(s) concedida(s) por ${fontes} — elas já vêm preparadas e <strong>não ocupam</strong> os limites acima.
    </div>`;
  }

  box.innerHTML = html;
}

/**
 * Renderiza o catálogo de magias com filtros
 */
/* As magias personalizadas moram na ficha, mas o app inteiro procura magia em
   DND5E_DATA.spells (ficha, ataques, limites por círculo). Em vez de espalhar
   um "ou nas customizadas" por cada busca, elas são reinjetadas no catálogo. */
function syncCustomSpellsIntoCatalog() {
  const lista = character.customSpells || [];
  const semCustom = DND5E_DATA.spells.filter(sp => !sp.isCustom);
  DND5E_DATA.spells.length = 0;
  DND5E_DATA.spells.push(...semCustom, ...lista);
}

/* Marca em quais listas de classe a magia nova entra. Vem das classes
   conjuradoras do catálogo, para o filtro do Passo 4 continuar valendo. */
function renderCustomSpellClassesGrid() {
  const grid = document.getElementById("customSpellClassesGrid");
  if (!grid) return;

  // Refeita a cada abertura: a classe personalizada pode ter virado conjuradora
  // desde a última vez, e aí ela também é uma lista possível.
  const conjuradoras = DND5E_DATA.classes.filter(c => !c.isCustom && c.spellcasting);
  const custom1 = resolveClassObj(character.class1, 1);
  const custom2 = resolveClassObj(character.class2, 2);
  [custom1, custom2].forEach(c => {
    if (c && c.isCustom && c.spellcasting && !conjuradoras.some(x => x.id === "custom")) conjuradoras.push(c);
  });
  grid.innerHTML = conjuradoras.map(c => `
    <label class="lang-checkbox-item">
      <input type="checkbox" value="${c.id}"${c.id === character.class1 || c.id === character.class2 ? " checked" : ""}>
      <span>${c.name.split(" (")[0]}</span>
    </label>`).join("");
}

/** Todas as listas de magia de onde as classes personalizadas do personagem tiram magias */
function listasDaClassePersonalizada() {
  const listas = [];
  [["class1", character.class1], ["class2", character.class2]].forEach(([, id], i) => {
    if (id !== "custom") return;
    (customClassState(i + 1).spellLists || []).forEach(l => { if (!listas.includes(l)) listas.push(l); });
  });
  return listas;
}

function renderSpellsCatalog() {
  syncCustomSpellsIntoCatalog();
  const container = document.getElementById("spellsCatalogList");
  const filterClass = document.getElementById("spellFilterClass") ? document.getElementById("spellFilterClass").value : "all";
  const filterLevel = document.getElementById("spellFilterLevel") ? document.getElementById("spellFilterLevel").value : "all";
  const filterSchool = document.getElementById("spellFilterSchool") ? document.getElementById("spellFilterSchool").value : "all";
  const soSelecionadas = document.getElementById("spellFilterSelected")
    ? document.getElementById("spellFilterSelected").getAttribute("aria-pressed") === "true"
    : false;
  // "Selecionadas" mostra o que está na ficha: o que o jogador escolheu mais o
  // que subclasse, espécie e talentos concedem — que também aparece na ficha.
  const idsNaFicha = new Set([
    ...character.spellsKnown,
    ...getGrantedSpellEntries().map(g => g.id)
  ]);
  const searchQuery = (document.getElementById("spellSearchInput") ? document.getElementById("spellSearchInput").value : "").toLowerCase().trim();

  if (!container) return;
  container.innerHTML = "";

  const filteredSpells = DND5E_DATA.spells.filter(sp => {
    const matchClass = filterClass === "all"
      || (filterClass === "__custom__" ? !!sp.isCustom
      : filterClass === "__customclass__" ? ((sp.classes || []).includes("custom")
          || listasDaClassePersonalizada().some(l => l === "custom" ? !!sp.isCustom : (sp.classes || []).includes(l)))
      : (sp.classes && sp.classes.includes(filterClass)));
    const matchLevel = filterLevel === "all" || sp.level.toString() === filterLevel;
    const matchSchool = filterSchool === "all" || sp.school === filterSchool;
    const matchSearch = sp.name.toLowerCase().includes(searchQuery) || sp.desc.toLowerCase().includes(searchQuery);
    const matchSelected = !soSelecionadas || idsNaFicha.has(sp.id);
    return matchClass && matchLevel && matchSchool && matchSearch && matchSelected;
  });

  const btnSelecionadas = document.getElementById("spellFilterSelected");
  if (btnSelecionadas) {
    const total = idsNaFicha.size;
    btnSelecionadas.classList.toggle("is-on", soSelecionadas);
    const contador = btnSelecionadas.querySelector(".spell-selected-count");
    if (contador) contador.textContent = total ? ` (${total})` : "";
  }

  if (filteredSpells.length === 0) {
    container.innerHTML = `<p class="spells-empty-msg">${soSelecionadas
      ? "Nenhuma magia na ficha ainda. Use <strong>Adicionar</strong> para levar magias para lá."
      : "Nenhuma magia encontrada para os filtros selecionados."}</p>`;
    return;
  }

  const table = document.createElement("table");
  table.className = "spells-table";

  // De onde veio cada magia concedida, para a etiqueta na linha
  const origemPorId = {};
  getGrantedSpellEntries().forEach(g => { origemPorId[g.id] = { fonte: g.source, tipo: g.tipo }; });

  // Agrupado por círculo: 391 linhas corridas não se navegam sem um filtro.
  const porCirculo = new Map();
  filteredSpells.forEach(sp => {
    if (!porCirculo.has(sp.level)) porCirculo.set(sp.level, []);
    porCirculo.get(sp.level).push(sp);
  });

  const linhaDaMagia = (sp) => {
    const isKnown = character.spellsKnown.includes(sp.id);
    const origem = origemPorId[sp.id];
    return `
      <tr class="spell-row${isKnown ? " is-known" : ""}${origem ? " is-granted" : ""}" data-row="${sp.id}">
        <td class="col-name">
          <span class="spell-row-name">${sp.name}</span>
          ${spellTagsHtml(sp, origem)}
        </td>
        <td class="col-school">${spellSchoolHtml(sp.school)}</td>
        <td class="col-classes">${formatSpellClasses(sp)}</td>
        <td class="col-info">
          <button type="button" class="spell-info-btn" data-info="${sp.id}" title="Detalhes da magia"><i class="fa-solid fa-info"></i></button>
          ${sp.isCustom ? `<button type="button" class="spell-info-btn btn-del-custom-spell" data-del="${sp.id}" title="Excluir esta magia personalizada"><i class="fa-solid fa-trash"></i></button>` : ""}
        </td>
        <td class="col-action">
          ${origem
            ? `<span class="spell-granted-lock" title="Concedida por ${String(origem.fonte).replace(/"/g, "&quot;")} — já vem na ficha"><i class="fa-solid fa-gift"></i> Concedida</span>`
            : `<button type="button" class="btn btn-sm ${isKnown ? "btn-gold" : "btn-secondary"} btn-toggle-spell" data-id="${sp.id}">
                 <i class="fa-solid ${isKnown ? "fa-check" : "fa-plus"}"></i> ${isKnown ? "Na ficha" : "Adicionar"}
               </button>`}
        </td>
      </tr>
      <tr class="spell-info-row" data-panel="${sp.id}" hidden>
        <td colspan="5">${buildSpellInfoHtml(sp)}</td>
      </tr>`;
  };

  const corpo = [...porCirculo.keys()].sort((a, b) => a - b).map(nivel => {
    const magias = porCirculo.get(nivel);
    const naFicha = magias.filter(sp => idsNaFicha.has(sp.id)).length;
    return `
      <tr class="spell-group-row">
        <th colspan="5" class="spell-group-head">
          <span class="spell-group-title">${formatSpellLevel(nivel)}</span>
          <span class="spell-group-count">${magias.length} magia${magias.length > 1 ? "s" : ""}${naFicha ? ` · ${naFicha} na ficha` : ""}</span>
        </th>
      </tr>
      ${magias.map(linhaDaMagia).join("")}`;
  }).join("");

  table.innerHTML = `
    <thead>
      <tr>
        <th class="col-name">Magia</th>
        <th class="col-school">Escola</th>
        <th class="col-classes">Classes</th>
        <th class="col-info">Info</th>
        <th class="col-action">Ficha</th>
      </tr>
    </thead>
    <tbody>${corpo}</tbody>
  `;

  table.addEventListener("click", (e) => {
    const infoBtn = e.target.closest(".spell-info-btn");
    if (infoBtn) {
      const id = infoBtn.getAttribute("data-info");
      const panel = table.querySelector(`.spell-info-row[data-panel="${id}"]`);
      if (panel) {
        panel.hidden = !panel.hidden;
        infoBtn.classList.toggle("is-open", !panel.hidden);
      }
      return;
    }

    const delBtn = e.target.closest(".btn-del-custom-spell");
    if (delBtn) {
      const id = delBtn.getAttribute("data-del");
      const alvo = (character.customSpells || []).find(x => x.id === id);
      if (alvo && confirm(`Excluir a magia personalizada "${alvo.name}"?`)) {
        character.customSpells = character.customSpells.filter(x => x.id !== id);
        character.spellsKnown = character.spellsKnown.filter(x => x !== id);
        syncCustomSpellsIntoCatalog();
        renderSpellsCatalog();
        updateFeatsList();
        recalculateCharacter();
        showToast("Magia personalizada removida.");
      }
      return;
    }

    const toggleBtn = e.target.closest(".btn-toggle-spell");
    if (toggleBtn) {
      const spId = toggleBtn.getAttribute("data-id");
      const sp = DND5E_DATA.spells.find(x => x.id === spId);
      const nomeMagia = sp ? sp.name.split(" (")[0] : spId;
      if (character.spellsKnown.includes(spId)) {
        character.spellsKnown = character.spellsKnown.filter(id => id !== spId);
        logHpEvent("magia", `Removeu ${nomeMagia}`, character.currentHp || 0);
      } else {
        character.spellsKnown.push(spId);
        logHpEvent("magia", `Adicionou ${nomeMagia}`, character.currentHp || 0);
      }
      renderSpellsCatalog();
      renderHpLog();
      recalculateCharacter();
    }
  });

  container.appendChild(table);
}

/**
 * Ícone e cor de cada escola de magia. Ler "Evocação" em texto no meio da linha
 * é mais lento do que reconhecer o glifo, e a cor separa os grupos de relance.
 */
const SPELL_SCHOOLS = {
  "Abjuração":    { icon: "fa-shield-halved",   slug: "abjuracao" },
  "Adivinhação":  { icon: "fa-eye",             slug: "adivinhacao" },
  "Encantamento": { icon: "fa-wand-sparkles",   slug: "encantamento" },
  "Evocação":     { icon: "fa-fire",            slug: "evocacao" },
  "Ilusão":       { icon: "fa-masks-theater",   slug: "ilusao" },
  "Invocação":    { icon: "fa-hand-sparkles",   slug: "invocacao" },
  "Necromancia":  { icon: "fa-skull",           slug: "necromancia" },
  "Transmutação": { icon: "fa-arrows-spin",     slug: "transmutacao" }
};

function spellSchoolHtml(school) {
  const info = SPELL_SCHOOLS[school];
  if (!info) return school || "-";
  return `<span class="spell-school is-${info.slug}" title="${school}">
    <i class="fa-solid ${info.icon}"></i><span class="spell-school-name">${school}</span>
  </span>`;
}

/** Uma magia exige Concentração? (o livro põe isso na Duração) */
function spellNeedsConcentration(sp) {
  return /Concentração/i.test(sp.duration || "");
}

/** Pode ser conjurada como Ritual? (o livro põe isso no Tempo de Conjuração) */
function spellIsRitual(sp) {
  return /Ritual/i.test(sp.time || "");
}

/**
 * Etiquetas da linha da magia. Concentração e ritual decidem escolha e ficavam
 * enterrados no texto de duração e tempo de conjuração; a origem separa o que o
 * jogador escolheu do que a subclasse, a espécie ou um talento deram.
 */
function spellTagsHtml(sp, origem) {   // origem: { fonte, tipo } ou nada
  const tags = [];
  if (spellNeedsConcentration(sp)) {
    tags.push('<span class="spell-tag is-conc" title="Exige Concentração">C</span>');
  }
  if (spellIsRitual(sp)) {
    tags.push('<span class="spell-tag is-ritual" title="Pode ser conjurada como Ritual">R</span>');
  }
  if (/\bM\b/.test(sp.components || "") && /\(/.test(sp.components || "")) {
    tags.push('<span class="spell-tag is-mat" title="Componente Material específico: ' +
              String(sp.components).replace(/"/g, "&quot;") + '">M</span>');
  }
  if (sp.isCustom) {
    tags.push('<span class="spell-tag is-origin" title="Magia personalizada, criada por você">⭐ Personalizada</span>');
  }
  if (origem) {
    // A fonte completa é longa ("Subclasse (Domínio da Vida (Life Domain))") e
    // não cabe numa etiqueta: na linha vai só o tipo, o resto fica no tooltip.
    tags.push(`<span class="spell-tag is-origin" title="Concedida por ${String(origem.fonte).replace(/"/g, "&quot;")}">${origem.tipo}</span>`);
  }
  return tags.length ? `<span class="spell-tags">${tags.join("")}</span>` : "";
}

/**
 * "Truque" ou "Nº Círculo"
 */
function formatSpellLevel(level) {
  return level === 0 ? "Truque" : `${level}º Círculo`;
}

/**
 * Lista de classes de uma magia com nomes em português
 */
function formatSpellClasses(sp) {
  if (!sp.classes || sp.classes.length === 0) return "-";
  return sp.classes.map(c => {
    const cls = DND5E_DATA.classes.find(cl => cl.id === c);
    // Só a parte em português: "Bardo (Bard), Mago (Wizard)" não cabe na coluna
    return cls ? cls.name.split(" (")[0] : c;
  }).join(", ");
}

/**
 * Conteúdo do painel "i" de uma magia (mesmos campos da ficha editável)
 */
function buildSpellInfoHtml(sp) {
  return `
    <div class="spell-info-grid">
      <div><span class="spell-info-label">Escola</span><span class="spell-info-value">${sp.school}</span></div>
      <div><span class="spell-info-label">Tempo de Conjuração</span><span class="spell-info-value">${sp.time}</span></div>
      <div><span class="spell-info-label">Alcance</span><span class="spell-info-value">${sp.range}</span></div>
      <div><span class="spell-info-label">Componentes</span><span class="spell-info-value">${sp.components}</span></div>
      <div><span class="spell-info-label">Duração</span><span class="spell-info-value">${sp.duration}</span></div>
      <div><span class="spell-info-label">Classes</span><span class="spell-info-value">${formatSpellClasses(sp)}</span></div>
    </div>
    <p class="spell-info-desc">${sp.desc}</p>
  `;
}

/**
 * MOTOR CENTRAL DE RECÁLCULO REATIVO DO PERSONAGEM
 * Sincroniza Wizard + Ficha Editável 3-Páginas + LocalStorage
 */
function recalculateCharacter() {
  _ofBlank = isBlankSheet();
  syncCustomSpellsIntoCatalog();

  const class1Obj = resolveClassObj(character.class1, 1) || EMPTY_CLASS;
  const class2Obj = character.class2 !== "none" ? resolveClassObj(character.class2, 2) : null;
  const speciesObj = resolveSpeciesObj(character.species) || EMPTY_SPECIES;
  const bgObj = DND5E_DATA.backgrounds.find(b => b.id === character.background) || EMPTY_BACKGROUND;

  // 1. Nível Total e Bônus de Proficiência (PB)
  const totalLevel = character.level1 + (class2Obj ? character.level2 : 0);
  const pb = Math.floor((totalLevel - 1) / 4) + 2;

  const displayTotalLevel = document.getElementById("displayTotalLevel");
  if (displayTotalLevel) displayTotalLevel.value = totalLevel;

  // Mudou nível ou classe: a grade do modo manual ganha ou perde linhas, e o
  // dado de cada linha pode ter mudado junto.
  renderHpPorNivel();

  // 2. Atributos Finais
  const finalScores = {};
  const finalMods = {};

  DND5E_DATA.abilities.forEach(ab => {
    let score = character.baseScores[ab.id] || 10;
    
    // Bônus do Antecedente 2024
    if (character.backgroundBonusMode === "+2/+1") {
      if (character.backgroundBonuses.primary === ab.id) score += 2;
      if (character.backgroundBonuses.secondary === ab.id) score += 1;
    } else {
      if (character.backgroundBonuses.primary === ab.id) score += 1;
      if (character.backgroundBonuses.secondary === ab.id) score += 1;
      if (character.backgroundBonuses.tertiary === ab.id) score += 1;
    }

    // Bônus de Talentos Customizados (só os que estão no personagem)
    getSelectedCustomFeats().forEach(cf => {
      if (cf.abilityBonus === ab.id) score += 1;
    });

    // Bônus do atributo escolhido na caixa de escolhas de cada talento oficial
    score += getFeatAbilityBonus(ab.id);

    finalScores[ab.id] = score;
    finalMods[ab.id] = Math.floor((score - 10) / 2);

    const bonusSub = document.getElementById(`bonus_sub_${ab.id}`);
    if (bonusSub) {
      const diff = score - (character.baseScores[ab.id] || 10);
      bonusSub.textContent = diff > 0 ? `+${diff} bônus (Total: ${score})` : `(Total: ${score})`;
    }
  });

  // 3. Capacidade de Magias
  // Guardado para o painel de jogo poder recalcular a capacidade sem refazer a
  // conta de atributos inteira.
  _ultimosMods = finalMods;
  const capInfo = getSpellCapacityInfo(finalMods);
  const cantripsCountEl = document.getElementById("cantripsCapacityCount");
  const preparedCountEl = document.getElementById("preparedCapacityCount");
  const grantedCountEl = document.getElementById("grantedSpellsCount");
  const sourceLabel = document.getElementById("spellcastingSourceLabel");

  if (cantripsCountEl && preparedCountEl) {
    cantripsCountEl.textContent = `${capInfo.currentCantripsCount} / ${capInfo.maxCantrips}`;
    cantripsCountEl.style.color = capInfo.currentCantripsCount > capInfo.maxCantrips ? "#ef4444" : "#c084fc";

    preparedCountEl.textContent = `${capInfo.currentPreparedCount} / ${capInfo.maxPrepared}`;
    preparedCountEl.style.color = capInfo.currentPreparedCount > capInfo.maxPrepared ? "#ef4444" : "#c084fc";

    if (grantedCountEl) {
      grantedCountEl.textContent = `${capInfo.grantedSpells.length} concedidas`;
    }

    if (sourceLabel) {
      sourceLabel.textContent = class1Obj.id === "none"
        ? "Classe Conjuradora: — escolha a classe no Passo 1 —"
        : `Classe Conjuradora: ${class1Obj.name} (${class1Obj.spellcasting ? 'Conjurador ' + class1Obj.spellcasting.type : 'Não-conjurador'})`;
    }

    renderSpellCapacityBreakdown(capInfo);
  }

  // 4. Pontos de Vida (HP)
  const conMod = finalMods["con"];
  let maxHp = somarPontosDeVida(class1Obj, class2Obj, conMod);

  if (character.species === "dwarf") maxHp += totalLevel;
  if (getActiveFeatIds().includes("tough")) {
    maxHp += totalLevel * 2;
  }

  // 5. Classe de Armadura (CA) Dinâmica + Itens Customizados
  const dexMod = finalMods["dex"];
  const armorObj = DND5E_DATA.armors.find(a => a.id === character.equippedArmor) || DND5E_DATA.armors[0];
  const shieldObj = DND5E_DATA.shields.find(s => s.id === character.equippedShield) || DND5E_DATA.shields[0];
  let ac = 10 + dexMod;

  if (armorObj.id === "none") {
    if (character.class1 === "barbarian" || (class2Obj && class2Obj.id === "barbarian")) {
      ac = 10 + dexMod + finalMods["con"];
    } else if (character.class1 === "monk" || (class2Obj && class2Obj.id === "monk")) {
      ac = 10 + dexMod + finalMods["wis"];
    }
  } else {
    if (armorObj.dexMod === "full") ac = armorObj.baseAC + dexMod;
    else if (armorObj.dexMod === "cap2") ac = armorObj.baseAC + Math.min(dexMod, 2);
    else ac = armorObj.baseAC;
  }

  ac += shieldObj.acBonus;

  // Adicionar bônus de itens customizados equipados
  character.customItems.filter(i => i.equipped && i.acBonus > 0).forEach(i => {
    ac += parseInt(i.acBonus) || 0;
  });

  // Estilos de Luta que alteram a armadura (ex.: Defesa +1 CA)
  const armorStyleMods = getArmorStyleMods(armorObj);
  ac += armorStyleMods.ac;

  // 6. Iniciativa & Deslocamento
  let init = dexMod;
  if (getActiveFeatIds().includes("alert")) {
    init += pb;
  }

  let speed = speciesObj.speed || 9;
  if (character.species === "elf" && character.lineage === "wood_elf") speed = 10.5;
  if (character.class1 === "barbarian" && character.level1 >= 5) speed += 3;
  if (character.class1 === "monk" && character.level1 >= 2) speed += 3;

  // 7. Salvaguardas & Perícias
  const proficientSaves = class1Obj.savingThrows || ["str", "con"];
  const bgSkills = bgObj.isCustom ? [character.customBg.skill1, character.customBg.skill2] : (bgObj.skills || []);
  const featSkills = getFeatGrantedSkills();
  const allTrainedSkills = Array.from(new Set([
    ...character.trainedSkills, ...bgSkills, ...featSkills.trained, ...featSkills.expert
  ]));
  const allExpertSkills = Array.from(new Set([...character.expertSkills, ...featSkills.expert]));
  
  const hasPerception = allTrainedSkills.includes("perception");
  const passivePerception = 10 + finalMods["wis"] + (hasPerception ? pb : 0);
  
  const hasInsight = allTrainedSkills.includes("insight");
  const passiveInsight = 10 + finalMods["wis"] + (hasInsight ? pb : 0);
  
  const hasInvestigation = allTrainedSkills.includes("investigation");
  const passiveInvestigation = 10 + finalMods["int"] + (hasInvestigation ? pb : 0);

  // 8. Magias & CD de Conjuração
  let spellCastingClass = class1Obj.spellcasting ? class1Obj : class2Obj && class2Obj.spellcasting ? class2Obj : null;
  let spellAbility = spellCastingClass ? spellCastingClass.spellcasting.ability : "int";
  let spellMod = finalMods[spellAbility] || 0;
  let spellDC = 8 + pb + spellMod;
  let spellAtk = pb + spellMod;

  // =========================================================================
  // FICHA OFICIAL EDITÁVEL (2 PÁGINAS) — espelho da ficha editável do PDF
  // =========================================================================
  renderOfficialSheet({
    class1Obj, class2Obj, speciesObj, bgObj,
    totalLevel, pb, finalScores, finalMods, dexMod,
    maxHp, ac, init, speed,
    allTrainedSkills, allExpertSkills, passivePerception, passiveInsight, passiveInvestigation,
    spellCastingClass, spellAbility, spellMod, spellDC, spellAtk, capInfo,
    armorObj, armorStyleMods
  });

  renderStyleEffectsPanel({ ac, armorStyleMods });
  renderDeathSaves();

  saveToLocalStorage();
}

/**
 * ===========================================================================
 * FICHA OFICIAL EDITÁVEL (2 PÁGINAS) — espelho da "D&D 5.5 - Ficha editável"
 * ---------------------------------------------------------------------------
 * Todo campo do PDF existe aqui e é editável. Os valores são preenchidos
 * automaticamente a partir do criador; ao digitar em um campo, o texto vira
 * um "override" do jogador e deixa de ser sobrescrito pelo recálculo.
 * O botão "Recalcular Campos" limpa os overrides.
 * ===========================================================================
 */

/** Acesso ao objeto de overrides da ficha (cria sob demanda) */
function sheetOv() {
  if (!character.sheet || typeof character.sheet !== "object") character.sheet = {};
  const sh = character.sheet;
  if (!Array.isArray(sh.weaponRows)) sh.weaponRows = [];
  if (!Array.isArray(sh.spellRows)) sh.spellRows = [];
  if (!Array.isArray(sh.attunement)) sh.attunement = ["", "", ""];
  if (!Array.isArray(sh.attunementChecks)) sh.attunementChecks = [false, false, false];
  if (!sh.slots || typeof sh.slots !== "object") sh.slots = {};
  return sh;
}

/** Um campo tem override quando o jogador digitou algo nele */
function hasOv(key) {
  const v = sheetOv()[key];
  return v !== undefined && v !== null;
}

/** Preenche um input da ficha respeitando o override do jogador */
/**
 * Campos que são texto do próprio jogador (nome, tendência, bio, inventário,
 * moedas...). Eles aparecem sempre: o modo em branco só apaga o que seria
 * *derivado* de classe, espécie ou antecedente.
 */
const OF_PLAYER_FIELDS = new Set([
  "sheetCharName", "sheetPlayerNameDisplay", "sheetXP", "sheetAlignment",
  "sheetAppearance", "sheetBackstoryDisplay", "sheetLanguages", "sheetEquipment",
  "sheetHpCurrent", "sheetHpTemp", "sheetAttune_1", "sheetAttune_2", "sheetAttune_3",
  "sheetCoinPC", "sheetCoinPP", "sheetCoinPE", "sheetCoinPO", "sheetCoinPL"
]);

function syncOfField(id, autoValue, key) {
  const el = document.getElementById(id);
  if (!el) return;
  if (document.activeElement === el) return;
  const hasManual = key && hasOv(key);
  const blank = _ofBlank && !OF_PLAYER_FIELDS.has(id);
  const val = hasManual ? sheetOv()[key] : (blank ? "" : autoValue);
  el.value = val === undefined || val === null ? "" : val;
}

/** Preenche um checkbox da ficha respeitando o override do jogador */
function syncOfCheck(id, autoValue, key) {
  const el = document.getElementById(id);
  if (!el) return;
  el.checked = key && hasOv(key) ? !!sheetOv()[key] : (_ofBlank ? false : !!autoValue);
}

/** Identificador estável de linha de tabela da ficha */
function newRowUid() {
  return "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Ponto de entrada: repinta as duas páginas da ficha oficial
 */
/* Menor letra tolerada num campo da ficha, em fração do tamanho de projeto.
   Abaixo disso o texto cabe mas não se lê, o que não é ganho nenhum. */
const FICHA_LETRA_MIN = 0.62;

/**
 * Encolhe a letra dos campos da ficha cujo valor não cabe na largura do papel.
 *
 * A ficha é uma réplica do A4 oficial: as larguras vêm da folha impressa e não
 * podem crescer. Quando o texto passa, o navegador simplesmente esconde o
 * excedente — "Escola de Abjuração (School of Abjuration)" virava "Escola de
 * Abjuraçã" na tela e no PDF, sem nenhum sinal de que havia mais.
 *
 * São duas passadas porque a relação entre tamanho da letra e largura do texto
 * não é exatamente linear: a primeira chega perto, a segunda fecha a conta.
 */
function ajustarTextoDeUmCampo(campo) {
  campo.style.fontSize = "";
  if (!campo.value) return;

  for (let passada = 0; passada < 2; passada++) {
    const cabe = campo.clientWidth;
    const precisa = campo.scrollWidth;
    if (!cabe || precisa <= cabe + 1) return;

    const atual = parseFloat(getComputedStyle(campo).fontSize);
    const base = parseFloat(campo.dataset.letraBase || atual);
    const alvo = Math.max(base * FICHA_LETRA_MIN, atual * (cabe / precisa));
    if (alvo >= atual - 0.05) return;

    campo.dataset.letraBase = base;
    campo.style.fontSize = alvo.toFixed(2) + "px";
  }
}

/* Largura da ficha na última vez que o ajuste rodou: enquanto ela não muda,
   refazer a conta dá o mesmo resultado e só custa layout. */
let _larguraDoUltimoAjuste = null;

function ajustarTextoDaFicha() {
  const pagina = document.querySelector(".sheet-page.active-page");
  if (!pagina) return;

  const largura = pagina.clientWidth;
  if (!largura) return;                       // painel escondido: nada a medir
  if (largura === _larguraDoUltimoAjuste) return;
  _larguraDoUltimoAjuste = largura;

  const campos = document.querySelectorAll(".sheet-page .of-input");

  campos.forEach(campo => { campo.style.fontSize = ""; });

  // Ler e escrever em blocos separados: intercalar as duas coisas obriga o
  // navegador a recalcular o layout a cada campo, e são mais de cem.
  for (let passada = 0; passada < 2; passada++) {
    const ajustes = [];

    campos.forEach(campo => {
      if (!campo.value) return;
      const cabe = campo.clientWidth;
      const precisa = campo.scrollWidth;
      if (!cabe || precisa <= cabe + 1) return;

      const atual = parseFloat(getComputedStyle(campo).fontSize);
      const base = parseFloat(campo.dataset.letraBase || atual);
      const alvo = Math.max(base * FICHA_LETRA_MIN, atual * (cabe / precisa));
      if (alvo < atual - 0.05) ajustes.push([campo, base, alvo]);
    });

    if (!ajustes.length) break;
    ajustes.forEach(([campo, base, alvo]) => {
      campo.dataset.letraBase = base;
      campo.style.fontSize = alvo.toFixed(2) + "px";
    });
  }

  // O que continua sem caber no menor tamanho legível leva o texto inteiro na
  // dica: cortado na tela, mas nunca perdido.
  campos.forEach(campo => {
    const cortado = campo.value && campo.scrollWidth > campo.clientWidth + 1;
    if (cortado) campo.title = campo.value;
    else if (campo.title === campo.value) campo.removeAttribute("title");
  });
}

function renderOfficialSheet(ctx) {
  renderOfSheetHeader(ctx);
  renderOfAbilities(ctx);
  renderOfProficienciesBox(ctx);
  renderOfStatStrip(ctx);
  syncSheetWeaponRows(ctx);
  renderOfWeaponsTable();
  renderOfFeatureAreas(ctx);
  renderOfCastingHeader(ctx);
  renderOfSpellSlots(ctx);
  syncSheetSpellRows();
  renderOfSpellsTable();
  renderOfSideColumn(ctx);
  _larguraDoUltimoAjuste = null;   // valores novos: refazer mesmo sem redimensionar
  ajustarTextoDaFicha();
}

/* ---------------------------------------------------------------- CABEÇALHO */
function renderOfSheetHeader(ctx) {
  const { class1Obj, class2Obj, speciesObj, bgObj, totalLevel, maxHp, ac } = ctx;

  syncOfField("sheetCharName", character.name || "");
  syncOfField("sheetPlayerNameDisplay", character.playerName || "");
  syncOfField("sheetOrigin", getBackgroundLabel(bgObj), "origin");
  syncOfField("sheetClassName", class2Obj ? `${class1Obj.name} / ${class2Obj.name}` : class1Obj.name, "className");
  syncOfField("sheetLevel", class2Obj ? `${character.level1}/${character.level2}` : String(character.level1), "levelText");
  syncOfField("sheetSpecies", getLineageLabel(speciesObj), "speciesText");
  syncOfField("sheetSubclass", getSubclassLabel(class1Obj), "subclassText");
  syncOfField("sheetXP", character.xp);

  syncOfField("sheetAC", ac, "ac");
  syncOfCheck("sheetShieldCheck", character.equippedShield && character.equippedShield !== "none", "shieldEquipped");

  const hpEl = document.getElementById("sheetHpCurrent");
  if (hpEl && document.activeElement !== hpEl) {
    hpEl.value = character.currentHp !== null && character.currentHp !== undefined ? character.currentHp : maxHp;
  }
  syncOfField("sheetHpTemp", character.tempHp || 0);
  renderHpTracker();
  syncOfField("sheetHpMax", maxHp, "hpMax");

  syncOfField("sheetHitDiceSpent", 0, "hitDiceSpent");
  const hitDiceAuto = class2Obj
    ? `${character.level1}d${class1Obj.hitDie} + ${character.level2}d${class2Obj.hitDie}`
    : `${totalLevel}d${class1Obj.hitDie}`;
  syncOfField("sheetHitDiceMax", hitDiceAuto, "hitDiceMax");
}

function getLineageLabel(speciesObj) {
  if (!speciesObj) return "";
  const lin = speciesObj.lineages ? speciesObj.lineages.find(l => l.id === character.lineage) : null;
  return lin ? `${speciesObj.name} (${lin.name})` : speciesObj.name;
}

function getSubclassLabel(class1Obj) {
  if (character.level1 < 3 || !class1Obj || !class1Obj.subclasses) return "";
  const sub = class1Obj.subclasses.find(s => s.id === character.subclass1);
  return sub ? sub.name : "";
}

/* ------------------------------------------------- ATRIBUTOS, SALVAS E PERÍCIAS */

/** Salvaguardas proficientes (override do jogador tem prioridade) */
function getSaveProfs(class1Obj) {
  const ov = sheetOv();
  if (Array.isArray(ov.saveProfs)) return ov.saveProfs;
  return class1Obj && class1Obj.savingThrows ? class1Obj.savingThrows : ["str", "con"];
}

function renderOfAbilities(ctx) {
  const { finalScores, finalMods, pb, class1Obj, allTrainedSkills } = ctx;
  const allExpertSkills = ctx.allExpertSkills || character.expertSkills;
  const colA = document.getElementById("sheetAbilitiesColA");
  const colB = document.getElementById("sheetAbilitiesColB");
  if (!colA || !colB) return;

  const saveProfs = getSaveProfs(class1Obj);
  const layout = [["str", "dex", "con"], ["int", "wis", "cha"]];

  [colA, colB].forEach((col, ci) => {
    col.querySelectorAll(".of-ability").forEach(el => el.remove());
    layout[ci].forEach(abId => {
      const ab = DND5E_DATA.abilities.find(a => a.id === abId);
      const mod = finalMods[abId];
      const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
      const isSaveProf = saveProfs.includes(abId);
      const saveBonus = mod + (isSaveProf ? pb : 0);
      const skills = DND5E_DATA.skills.filter(sk => sk.ability === abId);

      const show = v => _ofBlank ? "" : v;   // ficha em branco: caixas vazias

      const block = document.createElement("div");
      block.className = "of-ability";
      block.innerHTML = `
        <div class="of-ability-name">${ab.name}</div>
        <div class="of-ability-scores">
          <div class="of-field of-ability-mod">
            <input type="text" class="of-input of-input-center" data-ability-mod="${abId}" value="${show(modStr)}">
            <span class="of-label">Modificador</span>
          </div>
          <div class="of-field">
            <input type="number" class="of-input of-input-center" data-ability-score="${abId}" value="${show(finalScores[abId])}">
            <span class="of-label">Valor</span>
          </div>
        </div>
        <div class="of-prof-line-item is-save">
          <button type="button" class="of-prof-mark ${isSaveProf && !_ofBlank ? 'is-prof' : ''}" data-save-mark="${abId}" title="Proficiência em salvaguarda"></button>
          <span class="of-prof-name" data-roll="Salvaguarda de ${ab.name}" data-mod="${saveBonus}">Salvaguarda</span>
          <span class="of-prof-bonus" data-roll="Salvaguarda de ${ab.name}" data-mod="${saveBonus}">${show(`${saveBonus >= 0 ? '+' : ''}${saveBonus}`)}</span>
        </div>
        ${skills.map(sk => {
          const isExpert = allExpertSkills.includes(sk.id);
          const isProf = allTrainedSkills.includes(sk.id);
          const bonus = mod + (isExpert ? pb * 2 : isProf ? pb : 0);
          return `
            <div class="of-prof-line-item">
              <button type="button" class="of-prof-mark ${_ofBlank ? '' : isExpert ? 'is-expert' : isProf ? 'is-prof' : ''}" data-skill-mark="${sk.id}" title="Clique: nenhum → proficiente → especialista"></button>
              <span class="of-prof-name" data-roll="${sk.name}" data-mod="${bonus}">${sk.name}</span>
              <span class="of-prof-bonus" data-roll="${sk.name}" data-mod="${bonus}">${show(`${bonus >= 0 ? '+' : ''}${bonus}`)}</span>
            </div>
          `;
        }).join('')}
      `;
      col.appendChild(block);
    });
  });

  const insp = document.getElementById("sheetInspiration");
  if (insp) insp.classList.toggle("is-on", !!character.heroicInspiration);

  syncOfField("sheetPB", `+${pb}`, "pb");
}

/* --------------------------------------- EQUIPAMENTO, TREINO & PROFICIÊNCIAS */
function renderOfProficienciesBox(ctx) {
  const { class1Obj, class2Obj, bgObj, speciesObj } = ctx;
  const armorProfs = [
    ...(class1Obj.armorProficiencies || []),
    ...(class2Obj ? class2Obj.armorProficiencies || [] : []),
    ...(speciesObj && speciesObj.isCustom ? speciesObj.armorProficiencies || [] : [])
  ].join(" ").toLowerCase();

  syncOfCheck("sheetArmorLight", armorProfs.includes("leve"), "armorLight");
  syncOfCheck("sheetArmorMedium", armorProfs.includes("média") || armorProfs.includes("media"), "armorMedium");
  syncOfCheck("sheetArmorHeavy", armorProfs.includes("pesada"), "armorHeavy");
  syncOfCheck("sheetArmorShields", armorProfs.includes("escudo"), "armorShields");

  const weaponAuto = [
    ...(class1Obj.weaponProficiencies || []),
    ...(class2Obj ? class2Obj.weaponProficiencies || [] : []),
    ...(speciesObj && speciesObj.isCustom ? speciesObj.weaponProficiencies || [] : [])
  ].join(", ");
  syncOfField("sheetWeaponProfs", weaponAuto, "weaponProfs");

  const toolAuto = [
    ...(class1Obj.toolProficiencies || []),
    ...(speciesObj && speciesObj.isCustom ? speciesObj.toolProficiencies || [] : []),
    ...(bgObj.isCustom ? [getCustomBgToolName()] : bgObj.tools || [])
  ].filter(Boolean).join(", ");
  syncOfField("sheetToolProfs", toolAuto, "toolProfs");
}

/* --------------------------------------------------------- FAIXA DE STATUS */
function renderOfStatStrip(ctx) {
  const { init, speed, speciesObj, passivePerception } = ctx;
  syncOfField("sheetInitiative", init >= 0 ? `+${init}` : `${init}`, "initiative");
  syncOfField("sheetSpeed", `${speed} m`, "speed");
  syncOfField("sheetSize", speciesObj && speciesObj.size ? speciesObj.size : "Médio", "size");
  syncOfField("sheetPassivePerception", passivePerception, "passivePerception");
}

/* -------------------------------------------------- ARMAS & TRUQUES DE DANO */
const OF_WEAPON_MIN_ROWS = 8;

function syncSheetWeaponRows(ctx) {
  const { finalMods, pb, dexMod } = ctx;
  const ov = sheetOv();
  if (!Array.isArray(ov.weaponRows)) ov.weaponRows = [];

  const auto = [];

  character.weapons.forEach(wId => {
    if (!wId || wId === "none") return;
    const w = DND5E_DATA.weapons.find(wep => wep.id === wId);
    if (!w) return;

    // Desarmado e improvisada têm conta própria e saem por outro caminho.
    if (w.id === "unarmed" || w.id === "improvised") {
      auto.push(linhaDeAtaqueSemArma(w, finalMods, pb));
      return;
    }

    const isFinesse = weaponHasProp(w, "Acuidade");
    const atkAbility = isRangedWeapon(w) || (isFinesse && dexMod > finalMods["str"]) ? "dex" : "str";
    const style = getWeaponStyleMods(w);
    const atkMod = finalMods[atkAbility] + pb + style.atk;
    const dmgMod = finalMods[atkAbility] + style.dmg;

    // Maestria que faz o alvo rolar salvaguarda (hoje só Derrubar) precisa da
    // CD na ficha: sem ela o jogador acerta o golpe e para a mesa para
    // recalcular 8 + PB + atributo no meio do turno.
    const cdMaestria = isMasteryActive(w.id) ? masterySaveDC(w, finalMods[atkAbility], pb) : null;

    auto.push({
      srcId: "weapon:" + w.id,
      name: w.name,
      atk: `${atkMod >= 0 ? '+' : ''}${atkMod}` + (cdMaestria ? ` / CD ${cdMaestria.cd} ${cdMaestria.atributo}` : ""),
      damage: `${w.damage}${dmgMod !== 0 ? (dmgMod > 0 ? ' +' + dmgMod : ' ' + dmgMod) : ''} ${w.damageType}`,
      notes: [isMasteryActive(w.id) ? `Maestria: ${w.masteryName}` : null, ...style.notes]
        .filter(Boolean).join(" • ")
    });
  });

  // O Monge sempre luta desarmado: a linha entra sozinha, sem ele precisar
  // "equipar" um punho na lista de armas. Se ele já tiver escolhido o Ataque
  // Desarmado na lista, o laço acima já a criou e esta não se repete.
  if (getMonkMartialArtsDie() && !character.weapons.includes("unarmed")) {
    const punho = DND5E_DATA.weapons.find(w => w.id === "unarmed");
    if (punho) auto.push(linhaDeAtaqueSemArma(punho, finalMods, pb));
  }

  character.customItems.filter(i => i.equipped && (i.type === "weapon" || i.damage)).forEach(item => {
    const atkAbility = dexMod > finalMods["str"] ? "dex" : "str";
    const atkMod = finalMods[atkAbility] + pb;
    auto.push({
      srcId: "item:" + item.id,
      name: item.name,
      atk: `${atkMod >= 0 ? '+' : ''}${atkMod}`,
      damage: `${item.damage || "1d6"} ${item.damageType || "Cortante"}`,
      notes: item.mastery ? `Maestria: ${item.mastery}` : "Item mágico"
    });
  });

  character.customAttacks.forEach(ca => {
    auto.push({ srcId: "atk:" + ca.id, name: ca.name, atk: ca.bonus || "", damage: ca.damage || "", notes: "" });
  });

  // Tudo acima é arma; as magias vêm à parte porque disputam as mesmas linhas e
  // perdem a disputa. Uma arma equipada é escolha já feita pelo jogador; uma
  // magia de ataque ele pode conjurar sem estar na folha.
  const armas = auto.slice();
  const magiasTodas = spellAttackRows(finalMods, pb);

  const vagas = Math.max(0, OF_WEAPON_MIN_ROWS - armas.length);
  const magias = escolherMagiasDeAtaque(magiasTodas, vagas);
  _magiasDeAtaqueDeFora = magiasTodas.length - magias.length;

  // O modal de escolha precisa refazer as linhas das magias para mostrá-las
  // com bônus e dano; guardamos o contexto do último cálculo em vez de
  // recalcular a ficha inteira só para abrir uma janela.
  _ultimosCtxAtaque = { finalMods, pb };
  _vagasParaMagias = vagas;

  // Insere as novas, atualiza as que o jogador não editou, remove as que saíram
  const linhas = [...armas, ...magias];
  linhas.forEach(a => {
    const existing = ov.weaponRows.find(r => r.srcId === a.srcId);
    if (!existing) {
      ov.weaponRows.push({ uid: newRowUid(), edited: false, ...a });
    } else if (!existing.edited) {
      Object.assign(existing, a);
    }
  });
  const autoIds = linhas.map(a => a.srcId);
  ov.weaponRows = ov.weaponRows.filter(r => !r.srcId || autoIds.includes(r.srcId));

  padSheetRows(ov.weaponRows, OF_WEAPON_MIN_ROWS, () => ({ uid: newRowUid(), name: "", atk: "", damage: "", notes: "" }));
  ordenarLinhasDeAtaque(ov.weaponRows);
  atualizarAvisoDeMagias();
}

/* ---------------------------------------------- ORDEM DA TABELA DE ATAQUES */

/** Quantas magias de ataque não couberam na ficha */
let _magiasDeAtaqueDeFora = 0;
/** Vagas que sobraram para magias depois das armas, no último cálculo */
let _vagasParaMagias = 0;
/** Modificadores e bônus de proficiência do último cálculo da ficha */
let _ultimosCtxAtaque = null;

/**
 * Quais magias de ataque entram, quando não cabem todas.
 *
 * A escolha do jogador (`sheet.spellAttackPicks`) manda; o que ela não
 * preencher é completado na ordem em que as magias aparecem, para a ficha
 * nunca ficar com linha vazia sobrando enquanto há magia de fora.
 */
function escolherMagiasDeAtaque(magias, vagas) {
  if (vagas <= 0) return [];
  if (magias.length <= vagas) return magias;

  const escolhidas = sheetOv().spellAttackPicks || [];
  const preferidas = magias.filter(m => escolhidas.includes(m.srcId));
  const resto = magias.filter(m => !escolhidas.includes(m.srcId));
  return [...preferidas, ...resto].slice(0, vagas);
}

/**
 * Põe as armas encostadas no topo e as magias encostadas na base, com as
 * linhas livres no meio.
 *
 * Numa ficha impressa isso importa: quem procura um ataque de arma olha para o
 * começo do bloco e quem procura magia olha para o fim, sem varrer a lista
 * inteira. As linhas que o jogador digitou à mão ficam logo depois das armas,
 * que é onde ele as escreveu.
 */
function ordenarLinhasDeAtaque(rows) {
  const ehMagia = r => String(r.srcId || "").startsWith("spell:");
  const ehVazia = r => !r.srcId && !(r.name || "").trim() && !(r.atk || "").trim() &&
                       !(r.damage || "").trim() && !(r.notes || "").trim();

  const armas = rows.filter(r => r.srcId && !ehMagia(r));
  const magias = rows.filter(ehMagia);
  const aMao = rows.filter(r => !r.srcId && !ehVazia(r));
  const vazias = rows.filter(ehVazia);

  // As linhas em branco ficam no meio, e o padSheetRows só sabe aparar as do
  // FIM — que agora são magia. Sem cortar aqui, cada troca de arma ou de
  // classe deixava mais um vazio encalhado no meio e a tabela crescia sem
  // parar. O tamanho é o das oito linhas da folha, ou o que o conteúdo exigir.
  const ocupadas = armas.length + aMao.length + magias.length;
  const brancosNecessarios = Math.max(0, OF_WEAPON_MIN_ROWS - ocupadas);

  rows.length = 0;
  rows.push(...armas, ...aMao, ...vazias.slice(0, brancosNecessarios), ...magias);
}

/**
 * Monta o modal de escolha das magias de ataque que entram na ficha.
 *
 * Mostra todas as magias de ataque do personagem e quantas vagas sobraram
 * depois das armas. Marcar além do limite não é bloqueado no clique — o
 * excedente é cortado ao aplicar, na ordem da lista, e o contador avisa antes.
 */
function abrirEscolhaDeMagiasDeAtaque() {
  const modal = document.getElementById("spellAttackPickModal");
  const lista = document.getElementById("spellAttackPickLista");
  const ajuda = document.getElementById("spellAttackPickAjuda");
  if (!modal || !lista) return;

  const ctx = _ultimosCtxAtaque || {};
  const magias = spellAttackRows(ctx.finalMods || _ultimosMods || {}, ctx.pb || 2);
  const vagas = _vagasParaMagias;
  const escolhidas = new Set(sheetOv().spellAttackPicks || []);

  if (ajuda) {
    ajuda.textContent = vagas > 0
      ? `As armas ocupam o resto das oito linhas da ficha. Sobraram ${vagas} vaga(s) para magias — escolha quais entram.`
      : "As armas ocupam as oito linhas da ficha. Para pôr uma magia ali, remova uma arma no Passo 5 ou use o + da tabela para abrir outra linha.";
  }

  lista.innerHTML = magias.map(m => `
    <label class="skill-select-item">
      <input type="checkbox" data-pick="${m.srcId}"${escolhidas.has(m.srcId) ? " checked" : ""}${vagas > 0 ? "" : " disabled"}>
      <span>${m.name} <small style="color:#94a3b8">${m.atk} • ${m.damage || "—"}</small></span>
    </label>`).join("") ||
    '<p class="feat-empty-msg">Nenhuma magia de ataque na ficha ainda.</p>';

  modal.classList.add("active");
}

/**
 * Avisa quando sobrou magia de fora e oferece a escolha.
 *
 * A ficha oficial tem oito linhas e elas não esticam: se as armas as ocupam,
 * as magias ficam de fora, e o jogador precisa saber disso e decidir quais
 * quer ali — não é decisão do app.
 */
function atualizarAvisoDeMagias() {
  const caixa = document.getElementById("avisoMagiasAtaque");
  const texto = document.getElementById("avisoMagiasTexto");
  if (!caixa || !texto) return;

  caixa.hidden = _magiasDeAtaqueDeFora <= 0;
  if (caixa.hidden) return;

  texto.textContent = _magiasDeAtaqueDeFora === 1
    ? "1 magia de ataque não coube: as armas têm preferência."
    : `${_magiasDeAtaqueDeFora} magias de ataque não couberam: as armas têm preferência.`;
}

/** Mantém a tabela com o número de linhas em branco da ficha impressa */
function padSheetRows(rows, minRows, factory) {
  const isBlank = r => !r.srcId && !r.spellId && !(r.name || "").trim() && !(r.notes || "").trim();
  while (rows.length && isBlank(rows[rows.length - 1]) && rows.length > minRows) rows.pop();
  while (rows.length < minRows) rows.push(factory());
}

let _ofWeaponsSig = null;
function renderOfWeaponsTable() {
  const body = document.getElementById("sheetWeaponsTableBody");
  if (!body) return;
  const rows = sheetOv().weaponRows;
  const sig = rows.map(r => r.uid).join("|");
  const dirty = rows.some(r => r._dirty);

  if (sig === _ofWeaponsSig && body.children.length && !dirty) {
    rows.forEach(r => {
      const tr = body.querySelector(`tr[data-uid="${r.uid}"]`);
      if (!tr) return;
      ["name", "atk", "damage", "notes"].forEach(f => {
        const input = tr.querySelector(`[data-field="${f}"]`);
        if (input && document.activeElement !== input) input.value = r[f] || "";
      });
    });
    return;
  }

  _ofWeaponsSig = sig;
  rows.forEach(r => delete r._dirty);
  body.innerHTML = rows.map(r => `
    <tr data-uid="${r.uid}">
      <td><input type="text" class="of-input" data-field="name" value="${escAttr(r.name)}"></td>
      <td><input type="text" class="of-input of-input-center" data-field="atk" value="${escAttr(r.atk)}"></td>
      <td><input type="text" class="of-input" data-field="damage" value="${escAttr(r.damage)}"></td>
      <td><input type="text" class="of-input" data-field="notes" value="${escAttr(r.notes)}"></td>
      <td class="of-row-actions">
        <button type="button" class="of-row-del of-row-roll" title="Rolar ataque e dano"><i class="fa-solid fa-dice-d20"></i></button>
        <button type="button" class="of-row-del" title="Limpar linha"><i class="fa-solid fa-xmark"></i></button>
      </td>
    </tr>
  `).join('');
}

/* ------------------------------------------- CARACTERÍSTICAS, RAÇA E TALENTOS */

/**
 * Nome da característica de classe seguido do resumo de uma linha.
 *
 * `featuresByLevel` só guarda o nome ("Fúria (Rage)"), e o jogador ficava sem
 * saber o que a característica faz — na tela e, pior, no PDF impresso, longe do
 * livro. O resumo vem de `DND5E_DATA.featureSummaries`; o que não estiver lá
 * sai só com o nome, como antes.
 */
function comResumoDaCaracteristica(nome) {
  const resumo = (DND5E_DATA.featureSummaries || {})[nome];
  return resumo ? `${nome}: ${resumo}` : nome;
}

function renderOfFeatureAreas(ctx) {
  const { class1Obj, class2Obj, speciesObj, totalLevel } = ctx;

  const classFeatures = [];
  for (let l = 1; l <= character.level1; l++) {
    if (class1Obj.featuresByLevel && class1Obj.featuresByLevel[l]) {
      class1Obj.featuresByLevel[l].forEach(f => classFeatures.push(`[Nvl ${l}] ${comResumoDaCaracteristica(f)}`));
    }
  }
  if (class2Obj) {
    for (let l = 1; l <= character.level2; l++) {
      if (class2Obj.featuresByLevel && class2Obj.featuresByLevel[l]) {
        class2Obj.featuresByLevel[l].forEach(f => classFeatures.push(`[${class2Obj.name} ${l}] ${comResumoDaCaracteristica(f)}`));
      }
    }
  }
  // O texto livre da classe personalizada entra junto das características:
  // é o único lugar da ficha onde essa descrição tem onde caber.
  if (class1Obj.isCustom && class1Obj.about) classFeatures.push(`${class1Obj.name}: ${class1Obj.about}`);
  if (class2Obj && class2Obj.isCustom && class2Obj.about) classFeatures.push(`${class2Obj.name}: ${class2Obj.about}`);

  const subObj = class1Obj.subclasses ? class1Obj.subclasses.find(s => s.id === character.subclass1) : null;
  if (character.level1 >= 3 && subObj) classFeatures.push(`Subclasse — ${subObj.name}: ${subObj.desc}`);
  character.customFeatures.forEach(cf => classFeatures.push(`${cf.title}: ${cf.desc}`));

  const half = Math.ceil(classFeatures.length / 2);
  syncOfField("sheetClassFeatures", classFeatures.slice(0, half).join("\n"), "classFeatures");
  syncOfField("sheetClassFeatures2", classFeatures.slice(half).join("\n"), "classFeatures2");

  // Traço de espécie com nível só aparece depois que o personagem chega lá —
  // é o mesmo critério das características de classe, logo acima.
  const traitLines = traitsDaEspecieNoNivel(speciesObj, totalLevel)
    .map(t => `${t.level > 1 ? `[Nvl ${t.level}] ` : ""}${t.name}: ${t.desc}`);
  if (speciesObj.isCustom && speciesObj.about) traitLines.unshift(speciesObj.about);
  const traits = traitLines.join("\n");
  syncOfField("sheetSpeciesTraits", traits, "speciesTraits");

  const featLines = [];
  const originFeat = getOriginFeatObj();
  if (originFeat) featLines.push(`[Origem] ${originFeat.name}: ${originFeat.desc}${describeFeatChoices(originFeat)}`);

  const humanFeat = getHumanOriginFeatObj();
  if (humanFeat) featLines.push(`[Origem • Humano] ${humanFeat.name}: ${humanFeat.desc}${describeFeatChoices(humanFeat)}`);

  getExtraOriginFeatObjs().forEach(f => {
    featLines.push(`[Origem • Extra] ${f.name}: ${f.desc}${describeFeatChoices(f)}`);
  });
  character.selectedFeats.forEach(fId => {
    const f = DND5E_DATA.feats.find(x => x.id === fId);
    if (f) featLines.push(`${f.name}: ${f.desc}${describeFeatChoices(f)}`);
  });
  getSelectedCustomFeats().forEach(cf => featLines.push(`[Custom] ${cf.name}: ${cf.desc}`));
  syncOfField("sheetFeatsText", featLines.join("\n"), "featsText");
}

/* ------------------------------------------------------ PÁGINA 2: CONJURAÇÃO */
function renderOfCastingHeader(ctx) {
  const { spellAbility, spellMod, spellDC, spellAtk } = ctx;
  const abObj = DND5E_DATA.abilities.find(a => a.id === spellAbility);
  syncOfField("sheetSpellAbility", abObj ? abObj.abbr : "INT", "spellAbility");
  syncOfField("sheetSpellMod", spellMod >= 0 ? `+${spellMod}` : `${spellMod}`, "spellMod");
  syncOfField("sheetSpellDC", spellDC, "spellDC");
  syncOfField("sheetSpellAttack", spellAtk >= 0 ? `+${spellAtk}` : `${spellAtk}`, "spellAttack");
}

/** Máximo de espaços por círculo na ficha oficial (nº de bolinhas "Gastos") */
const OF_SLOT_BOXES = { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 };

function renderOfSpellSlots(ctx) {
  const { spellCastingClass, totalLevel } = ctx;
  const grid = document.getElementById("sheetSpellSlotsGrid");
  if (!grid) return;

  const type = spellCastingClass && spellCastingClass.spellcasting ? spellCastingClass.spellcasting.type : "full";
  const slotsRow = linhaDeEspacosDaTabela(type, totalLevel);

  const ov = sheetOv();
  if (!ov.slots || typeof ov.slots !== "object") ov.slots = {};

  grid.innerHTML = "";
  for (let lvl = 1; lvl <= 9; lvl++) {
    const auto = slotsRow[lvl - 1] || 0;
    const st = ov.slots[lvl] || {};
    const total = totalDeEspacos(auto, st.total);
    const used = character.spellSlotsExpended[lvl] || 0;

    const cell = document.createElement("div");
    cell.className = "of-slot-cell";
    cell.innerHTML = `
      <span class="of-slot-lvl">Nível ${lvl}</span>
      <input type="text" class="of-input of-input-center" data-slot-total="${lvl}" value="${_ofBlank ? "" : total}" title="Total de espaços">
      <span class="of-slot-used">
        ${Array(OF_SLOT_BOXES[lvl]).fill(0).map((_, i) =>
          `<input type="checkbox" class="of-dot" data-slot-used="${lvl}" data-idx="${i}" ${i < used ? 'checked' : ''} title="Espaço gasto">`
        ).join('')}
      </span>
    `;
    grid.appendChild(cell);
  }
}

/* ---------------------------------------- PÁGINA 2: TRUQUES & MAGIAS PREPARADAS */
const OF_SPELL_MIN_ROWS = 24;

function buildSpellRowFromData(sp) {
  return {
    uid: newRowUid(),
    spellId: sp.id,
    edited: false,
    level: sp.level === 0 ? "T" : String(sp.level),
    name: sp.name,
    time: sp.time,
    range: sp.range,
    c: /Concentração/i.test(sp.duration),
    // só o tempo de conjuração diz se a magia é ritual ("Ação ou Ritual"); a
    // descrição pode citar a palavra sem que a magia tenha a marca.
    r: /Ritual/i.test(sp.time || ""),
    m: /M/.test((sp.components || "").split(",").map(s => s.trim()).join(",")),
    notes: `${sp.school} • ${sp.components} • ${sp.duration}`
  };
}

/** Acrescenta o comentário de origem à anotação da linha, sem duplicar */
function withGrantNote(notes, source) {
  const tag = `Concedida: ${source}`;
  const base = String(notes || "").split(" • ").filter(t => t && !t.startsWith("Concedida: "));
  base.push(tag);
  return base.join(" • ");
}

function syncSheetSpellRows() {
  const ov = sheetOv();
  if (!Array.isArray(ov.spellRows)) ov.spellRows = [];

  character.spellsKnown.forEach(id => {
    if (ov.spellRows.some(r => r.spellId === id)) return;
    const sp = DND5E_DATA.spells.find(s => s.id === id);
    if (sp) ov.spellRows.push(buildSpellRowFromData(sp));
  });

  // Magias que a subclasse, a espécie ou um talento concedem entram sozinhas
  const granted = getGrantedSpellEntries();
  const grantedIds = granted.map(g => g.id);
  granted.forEach(g => {
    const existing = ov.spellRows.find(r => r.spellId === g.id);
    if (existing) {
      existing.grantSrc = g.source;
      if (!existing.edited) existing.notes = withGrantNote(existing.notes, g.source);
      return;
    }
    const sp = DND5E_DATA.spells.find(x => x.id === g.id);
    const row = sp ? buildSpellRowFromData(sp) : {
      uid: newRowUid(), spellId: g.id, edited: false,
      level: "", name: g.name || g.id, time: "", range: "", c: false, r: false, m: false, notes: ""
    };
    row.grantSrc = g.source;
    row.notes = withGrantNote(row.notes, g.source);
    ov.spellRows.push(row);
  });

  ov.spellRows.forEach(r => {
    if (r.grantSrc && !grantedIds.includes(r.spellId)) delete r.grantSrc;
  });

  ov.spellRows = ov.spellRows.filter(r =>
    !r.spellId || character.spellsKnown.includes(r.spellId) || grantedIds.includes(r.spellId));

  ov.spellRows.sort((a, b) => {
    const rank = r => (r.spellId ? 0 : 1);
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    if (!a.spellId) return 0;
    const lv = r => (r.level === "T" ? -1 : parseInt(r.level) || 0);
    return lv(a) - lv(b) || (a.name || "").localeCompare(b.name || "");
  });

  padSheetRows(ov.spellRows, OF_SPELL_MIN_ROWS, () => ({
    uid: newRowUid(), level: "", name: "", time: "", range: "", c: false, r: false, m: false, notes: ""
  }));
}

let _ofSpellsSig = null;
function renderOfSpellsTable() {
  const body = document.getElementById("sheetSpellsTableBody");
  if (!body) return;
  const rows = sheetOv().spellRows;
  const sig = rows.map(r => r.uid).join("|");

  if (sig === _ofSpellsSig && body.children.length) {
    rows.forEach(r => {
      const tr = body.querySelector(`tr[data-uid="${r.uid}"]`);
      if (!tr) return;
      ["level", "name", "time", "range", "notes"].forEach(f => {
        const input = tr.querySelector(`[data-field="${f}"]`);
        if (input && document.activeElement !== input) input.value = r[f] || "";
      });
      // C / R / M também: sem isto a linha que o app atualizou sozinha (uma
      // magia concedida, por exemplo) ficava com as bolinhas da renderização
      // anterior, e a ficha discordava do que ia para o PDF.
      ["c", "r", "m"].forEach(f => {
        const box = tr.querySelector(`[data-field="${f}"]`);
        if (box) box.checked = !!r[f];
      });
    });
    return;
  }

  _ofSpellsSig = sig;
  body.innerHTML = rows.map(r => `
    <tr data-uid="${r.uid}"${r.spellId ? ` data-spell="${r.spellId}"` : ''}>
      <td><input type="text" class="of-input of-input-center" data-field="level" value="${escAttr(r.level)}"></td>
      <td><input type="text" class="of-input" data-field="name" value="${escAttr(r.name)}"></td>
      <td><input type="text" class="of-input" data-field="time" value="${escAttr(r.time)}"></td>
      <td><input type="text" class="of-input" data-field="range" value="${escAttr(r.range)}"></td>
      <td class="of-crm-cell">
        <input type="checkbox" class="of-dot" data-field="c" ${r.c ? 'checked' : ''} title="Concentração">
        <input type="checkbox" class="of-dot" data-field="r" ${r.r ? 'checked' : ''} title="Ritual">
        <input type="checkbox" class="of-dot" data-field="m" ${r.m ? 'checked' : ''} title="Material necessário">
      </td>
      <td><input type="text" class="of-input" data-field="notes" value="${escAttr(r.notes)}"></td>
      <td class="of-row-actions"><button type="button" class="of-row-del" title="Limpar linha"><i class="fa-solid fa-xmark"></i></button></td>
    </tr>
  `).join('');
}

/* ----------------------------------------------- PÁGINA 2: COLUNA DA DIREITA */
function renderOfSideColumn(ctx) {
  const { bgObj } = ctx;
  const b = character.bio || {};

  const appearance = [
    b.age ? `Idade: ${b.age}` : "",
    b.height ? `Altura: ${b.height}` : "",
    b.weight ? `Peso: ${b.weight}` : "",
    b.eyes ? `Olhos: ${b.eyes}` : "",
    b.skin ? `Pele: ${b.skin}` : "",
    b.hair ? `Cabelo: ${b.hair}` : ""
  ].filter(Boolean).join("\n");
  syncOfField("sheetAppearance", appearance, "appearance");

  const history = [
    b.personality ? `Traços: ${b.personality}` : "",
    b.ideals ? `Ideais: ${b.ideals}` : "",
    b.bonds ? `Vínculos: ${b.bonds}` : "",
    b.flaws ? `Defeitos: ${b.flaws}` : "",
    b.backstory ? `\n${b.backstory}` : ""
  ].filter(Boolean).join("\n");
  syncOfField("sheetBackstoryDisplay", history, "history");

  syncOfField("sheetAlignment", character.alignment);
  syncOfField("sheetLanguages", getFormattedLanguages(), "languages");

  const equipment = [
    character.inventory || "",
    bgObj && bgObj.equipmentDesc ? `\n${getBackgroundLabel(bgObj)}: ${bgObj.equipmentDesc}` : "",
    character.customItems.length
      ? "\n" + character.customItems.map(i => `${i.name}${i.equipped ? " (equipado)" : ""}`).join(", ")
      : ""
  ].filter(Boolean).join("\n");
  syncOfField("sheetEquipment", equipment, "equipment");

  const attune = character.customItems.filter(i => i.attunement === true || i.attunement === "true");
  const ov = sheetOv();
  if (!Array.isArray(ov.attunement)) ov.attunement = ["", "", ""];
  if (!Array.isArray(ov.attunementChecks)) ov.attunementChecks = [false, false, false];
  [1, 2, 3].forEach(i => {
    const auto = attune[i - 1] ? attune[i - 1].name : "";
    const el = document.getElementById(`sheetAttune_${i}`);
    if (el && document.activeElement !== el) el.value = ov.attunement[i - 1] || auto;
    const chk = document.getElementById(`sheetAttuneChk_${i}`);
    if (chk) chk.checked = !!ov.attunementChecks[i - 1];
  });

  ["PC", "PP", "PE", "PO", "PL"].forEach(c => syncOfField(`sheetCoin${c}`, character.coins[c.toLowerCase()] || 0));
}

/** Escapa aspas para uso em atributos HTML */
function escAttr(v) {
  return String(v === undefined || v === null ? "" : v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/**
 * Liga (uma única vez) todos os eventos da ficha oficial editável
 */
function bindOfficialSheetEvents() {
  const page1 = document.getElementById("sheetPage1");
  const page2 = document.getElementById("sheetPage2");
  if (!page1 || !page2) return;

  // Texto digitado à mão na ficha também encolhe para caber: sem isto o ajuste
  // só valeria para o que vem do criador. Um campo por vez, que é o que mudou.
  [page1, page2].forEach(pagina => {
    pagina.addEventListener("input", (e) => {
      const campo = e.target;
      if (!campo.classList || !campo.classList.contains("of-input")) return;
      ajustarTextoDeUmCampo(campo);
    });
  });

  // ---- Campos simples com override (id -> chave em character.sheet) ----
  const OVERRIDABLE = {
    sheetOrigin: "origin", sheetClassName: "className", sheetLevel: "levelText",
    sheetSpecies: "speciesText", sheetSubclass: "subclassText", sheetAC: "ac",
    sheetHpMax: "hpMax", sheetHitDiceSpent: "hitDiceSpent", sheetHitDiceMax: "hitDiceMax",
    sheetPB: "pb", sheetInitiative: "initiative", sheetSpeed: "speed", sheetSize: "size",
    sheetPassivePerception: "passivePerception", sheetWeaponProfs: "weaponProfs",
    sheetToolProfs: "toolProfs", sheetClassFeatures: "classFeatures",
    sheetClassFeatures2: "classFeatures2", sheetSpeciesTraits: "speciesTraits",
    sheetFeatsText: "featsText", sheetSpellAbility: "spellAbility", sheetSpellMod: "spellMod",
    sheetSpellDC: "spellDC", sheetSpellAttack: "spellAttack", sheetAppearance: "appearance",
    // História e Personalidade ficou de fora daqui até 11/09/2026: das quatro
    // caixas da coluna da direita, era a única sem override. Quem escrevia a
    // história direto na ficha via o texto desaparecer na próxima repintura
    // (qualquer mudança no criador, ou só recarregar a página) — e, como o PDF
    // lê a ficha, ele saía com a caixa vazia.
    sheetBackstoryDisplay: "history",
    sheetLanguages: "languages", sheetEquipment: "equipment"
  };
  Object.entries(OVERRIDABLE).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => { sheetOv()[key] = el.value; saveToLocalStorage(); });
  });

  const OV_CHECKS = {
    sheetShieldCheck: "shieldEquipped", sheetArmorLight: "armorLight",
    sheetArmorMedium: "armorMedium", sheetArmorHeavy: "armorHeavy", sheetArmorShields: "armorShields"
  };
  Object.entries(OV_CHECKS).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("change", () => { sheetOv()[key] = el.checked; saveToLocalStorage(); });
  });

  // ---- Campos espelhados no criador ----
  bindSheetMirror("sheetCharName", "input", v => { character.name = v; setVal("inputCharName", v); });
  bindSheetMirror("sheetPlayerNameDisplay", "input", v => { character.playerName = v; setVal("inputPlayerName", v); });
  bindSheetMirror("sheetAlignment", "input", v => { character.alignment = v; setVal("selectAlignment", v); });
  bindSheetMirror("sheetXP", "input", v => { character.xp = v; });
  bindSheetMirror("sheetHpCurrent", "change", v => { character.currentHp = parseInt(v) || 0; });
  bindSheetMirror("sheetHpTemp", "change", v => { character.tempHp = parseInt(v) || 0; });
  ["PC", "PP", "PE", "PO", "PL"].forEach(c => {
    bindSheetMirror(`sheetCoin${c}`, "change", v => { character.coins[c.toLowerCase()] = parseInt(v) || 0; });
  });
  [1, 2, 3].forEach(i => {
    const el = document.getElementById(`sheetAttune_${i}`);
    if (el) el.addEventListener("input", () => { sheetOv().attunement[i - 1] = el.value; saveToLocalStorage(); });
    const chk = document.getElementById(`sheetAttuneChk_${i}`);
    if (chk) chk.addEventListener("change", () => { sheetOv().attunementChecks[i - 1] = chk.checked; saveToLocalStorage(); });
  });

  // ---- Salvaguardas contra a morte ----
  ["1", "2", "3"].forEach(i => {
    const s = document.getElementById(`ds_succ_${i}`);
    const f = document.getElementById(`ds_fail_${i}`);
    if (s) s.addEventListener("change", e => { character.deathSaves[`succ${i}`] = e.target.checked; saveToLocalStorage(); });
    if (f) f.addEventListener("change", e => { character.deathSaves[`fail${i}`] = e.target.checked; saveToLocalStorage(); });
  });

  // ---- Inspiração Heroica ----
  const inspBox = document.getElementById("sheetInspirationBox");
  if (inspBox) inspBox.addEventListener("click", () => {
    character.heroicInspiration = !character.heroicInspiration;
    recalculateCharacter();
    showToast(character.heroicInspiration ? "⭐ Inspiração Heroica concedida!" : "Inspiração Heroica gasta.");
  });

  // ---- Iniciativa clicável ----
  const initBadge = document.getElementById("sheetInitiativeBadge");
  if (initBadge) initBadge.addEventListener("dblclick", () => {
    rollDiceCheck("Iniciativa", parseInt(document.getElementById("sheetInitiative").value) || 0);
  });

  // ---- Atributos, salvaguardas e perícias (delegação) ----
  page1.addEventListener("click", (e) => {
    const saveMark = e.target.closest("[data-save-mark]");
    if (saveMark) {
      const abId = saveMark.getAttribute("data-save-mark");
      const cls = DND5E_DATA.classes.find(c => c.id === character.class1);
      const current = getSaveProfs(cls).slice();
      const idx = current.indexOf(abId);
      if (idx >= 0) current.splice(idx, 1); else current.push(abId);
      sheetOv().saveProfs = current;
      recalculateCharacter();
      return;
    }

    const skillMark = e.target.closest("[data-skill-mark]");
    if (skillMark) {
      const skId = skillMark.getAttribute("data-skill-mark");
      const isProf = character.trainedSkills.includes(skId);
      const isExpert = character.expertSkills.includes(skId);
      if (!isProf && !isExpert) {
        character.trainedSkills.push(skId);
      } else if (isProf && !isExpert) {
        character.expertSkills.push(skId);
      } else {
        character.trainedSkills = character.trainedSkills.filter(s => s !== skId);
        character.expertSkills = character.expertSkills.filter(s => s !== skId);
      }
      updateSkillsSelector();
      recalculateCharacter();
      return;
    }

    const roll = e.target.closest("[data-roll]");
    if (roll) rollDiceCheck(roll.getAttribute("data-roll"), parseInt(roll.getAttribute("data-mod")) || 0);
  });

  page1.addEventListener("change", (e) => {
    const score = e.target.closest("[data-ability-score]");
    if (score) {
      const abId = score.getAttribute("data-ability-score");
      const desired = parseInt(score.value);
      if (!isNaN(desired)) {
        const shown = getDisplayedAbilityScore(abId);
        character.baseScores[abId] = (character.baseScores[abId] || 10) + (desired - shown);
      }
      renderAbilityInputs();
      recalculateCharacter();
      return;
    }

    const modEl = e.target.closest("[data-ability-mod]");
    if (modEl) {
      const abId = modEl.getAttribute("data-ability-mod");
      const desiredMod = parseInt(modEl.value);
      if (!isNaN(desiredMod)) {
        const shown = getDisplayedAbilityScore(abId);
        character.baseScores[abId] = (character.baseScores[abId] || 10) + ((10 + desiredMod * 2) - shown);
      }
      renderAbilityInputs();
      recalculateCharacter();
    }
  });

  // ---- Tabela de armas ----
  const weaponsBody = document.getElementById("sheetWeaponsTableBody");
  if (weaponsBody) {
    weaponsBody.addEventListener("input", (e) => {
      const input = e.target.closest("[data-field]");
      if (!input) return;
      const row = findSheetRow(sheetOv().weaponRows, input.closest("tr"));
      if (!row) return;
      row[input.getAttribute("data-field")] = input.value;
      row.edited = true;
      saveToLocalStorage();
    });
    weaponsBody.addEventListener("click", (e) => {
      const rollBtn = e.target.closest(".of-row-roll");
      if (rollBtn) {
        const tr = rollBtn.closest("tr");
        const row = findSheetRow(sheetOv().weaponRows, tr);
        if (row && row.name) {
          rollAttackAndDamage(row.name, parseInt(row.atk) || 0, row.damage || "1d6", 0, "");
        }
        return;
      }
      const delBtn = e.target.closest(".of-row-del");
      if (!delBtn) return;
      const tr = delBtn.closest("tr");
      const rows = sheetOv().weaponRows;
      const row = findSheetRow(rows, tr);
      if (!row) return;
      if (row.srcId) {
        showToast("Esta arma vem do criador — remova-a no Passo 5 para tirá-la da ficha.");
        return;
      }
      Object.assign(row, { name: "", atk: "", damage: "", notes: "" });
      row._dirty = true;
      renderOfWeaponsTable();
      saveToLocalStorage();
    });
  }

  // ---- Tabela de magias ----
  const spellsBody = document.getElementById("sheetSpellsTableBody");
  if (spellsBody) {
    const commit = (e) => {
      const input = e.target.closest("[data-field]");
      if (!input) return;
      const row = findSheetRow(sheetOv().spellRows, input.closest("tr"));
      if (!row) return;
      const f = input.getAttribute("data-field");
      row[f] = input.type === "checkbox" ? input.checked : input.value;
      row.edited = true;
      saveToLocalStorage();
    };
    spellsBody.addEventListener("input", commit);
    spellsBody.addEventListener("change", commit);
    spellsBody.addEventListener("click", (e) => {
      const delBtn = e.target.closest(".of-row-del");
      if (!delBtn) return;
      const row = findSheetRow(sheetOv().spellRows, delBtn.closest("tr"));
      if (!row) return;
      if (row.grantSrc && !character.spellsKnown.includes(row.spellId)) {
        showToast(`Esta magia vem de ${row.grantSrc} — mude a origem no Passo 3 para tirá-la da ficha.`);
        return;
      }
      if (row.spellId) {
        character.spellsKnown = character.spellsKnown.filter(id => id !== row.spellId);
        renderSpellsCatalog();
        recalculateCharacter();
        return;
      }
      Object.assign(row, { level: "", name: "", time: "", range: "", c: false, r: false, m: false, notes: "" });
      _ofSpellsSig = null;
      renderOfSpellsTable();
      saveToLocalStorage();
    });
  }

  // ---- Espaços de magia ----
  const slotsGrid = document.getElementById("sheetSpellSlotsGrid");
  if (slotsGrid) {
    slotsGrid.addEventListener("input", (e) => {
      const t = e.target.closest("[data-slot-total]");
      if (!t) return;
      const lvl = t.getAttribute("data-slot-total");
      if (!sheetOv().slots) sheetOv().slots = {};
      sheetOv().slots[lvl] = { ...(sheetOv().slots[lvl] || {}), total: t.value };
      saveToLocalStorage();
    });
    slotsGrid.addEventListener("change", (e) => {
      const u = e.target.closest("[data-slot-used]");
      if (!u) return;
      const lvl = u.getAttribute("data-slot-used");
      const count = slotsGrid.querySelectorAll(`[data-slot-used="${lvl}"]:checked`).length;
      character.spellSlotsExpended[lvl] = count;
      saveToLocalStorage();
    });
  }

  // ---- Botões de adicionar linha ----
  const addWeapon = document.getElementById("btnAddSheetWeaponRow");
  if (addWeapon) addWeapon.addEventListener("click", () => {
    sheetOv().weaponRows.push({ uid: newRowUid(), name: "", atk: "", damage: "", notes: "" });
    _ofWeaponsSig = null;
    renderOfWeaponsTable();
    saveToLocalStorage();
  });

  const addSpell = document.getElementById("btnAddSheetSpellRow");
  if (addSpell) addSpell.addEventListener("click", () => {
    sheetOv().spellRows.push({ uid: newRowUid(), level: "", name: "", time: "", range: "", c: false, r: false, m: false, notes: "" });
    _ofSpellsSig = null;
    renderOfSpellsTable();
    saveToLocalStorage();
  });

  // ---- Recalcular campos (limpa overrides) ----
  const btnReset = document.getElementById("btnResetSheetOverrides");
  if (btnReset) btnReset.addEventListener("click", () => {
    if (!confirm("Isso descarta as edições feitas diretamente na ficha e volta a preencher tudo a partir do criador. Continuar?")) return;
    character.sheet = {};
    _ofWeaponsSig = null;
    _ofSpellsSig = null;
    recalculateCharacter();
    showToast("🔄 Campos da ficha recalculados a partir do criador.");
  });
}

/** Valor de atributo atualmente exibido na ficha (base + bônus aplicados) */
function getDisplayedAbilityScore(abId) {
  let score = character.baseScores[abId] || 10;
  if (character.backgroundBonusMode === "+2/+1") {
    if (character.backgroundBonuses.primary === abId) score += 2;
    if (character.backgroundBonuses.secondary === abId) score += 1;
  } else {
    if (character.backgroundBonuses.primary === abId) score += 1;
    if (character.backgroundBonuses.secondary === abId) score += 1;
    if (character.backgroundBonuses.tertiary === abId) score += 1;
  }
  getSelectedCustomFeats().forEach(cf => { if (cf.abilityBonus === abId) score += 1; });
  return score;
}

function findSheetRow(rows, tr) {
  if (!tr || !Array.isArray(rows)) return null;
  return rows.find(r => r.uid === tr.getAttribute("data-uid")) || null;
}

function bindSheetMirror(id, evt, apply) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener(evt, () => { apply(el.value); saveToLocalStorage(); });
}

function setVal(id, v) {
  const el = document.getElementById(id);
  if (el) el.value = v;
}

/**
 * Renderiza Salvaguardas da Morte
 */
function renderDeathSaves() {
  ["1", "2", "3"].forEach(i => {
    const succ = document.getElementById(`ds_succ_${i}`);
    const fail = document.getElementById(`ds_fail_${i}`);
    if (succ) succ.checked = !!character.deathSaves[`succ${i}`];
    if (fail) fail.checked = !!character.deathSaves[`fail${i}`];
  });
}

/**
 * Rolador de Dados Interativo com Toast
 */
function rollDiceCheck(label, modifier) {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const total = d20 + modifier;
  const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
  
  let tag = "";
  if (d20 === 20) tag = " 🌟 CRÍTICO!";
  else if (d20 === 1) tag = " 💀 FALHA CRÍTICA!";

  showToast(`🎯 <strong>${label}:</strong> d20(${d20}) ${modStr} = <strong>${total}</strong>${tag}`);
}

/**
 * Lê uma expressão de dados: "2d6+3", "d20", "1d8+1d6-2", "4d6 + 2".
 *
 * Devolve os termos separados para o resultado poder mostrar cada dado, que é o
 * que se confere na mesa — só o total não deixa ninguém checar a rolagem.
 * Devolve null se a expressão não fizer sentido.
 */
function parseDiceExpression(texto) {
  const limpo = String(texto || "").replace(/\s+/g, "").toLowerCase();
  if (!limpo) return null;
  // cada termo é "+2d6", "-d8" ou "+3"; o primeiro pode vir sem sinal
  const termos = limpo.match(/[+-]?(\d*d\d+|\d+)/g);
  if (!termos || termos.join("") !== limpo) return null;

  const dados = [];
  let fixo = 0;
  for (const t of termos) {
    const sinal = t.startsWith("-") ? -1 : 1;
    const corpo = t.replace(/^[+-]/, "");
    const m = corpo.match(/^(\d*)d(\d+)$/);
    if (m) {
      const qtd = m[1] === "" ? 1 : parseInt(m[1], 10);
      const faces = parseInt(m[2], 10);
      if (qtd < 1 || qtd > 100 || faces < 2 || faces > 1000) return null;
      dados.push({ qtd, faces, sinal });
    } else {
      fixo += sinal * parseInt(corpo, 10);
    }
  }
  if (!dados.length && !fixo) return null;
  return { dados, fixo };
}

/**
 * Rola a expressão e devolve o total com o detalhe de cada dado.
 */
function rollDiceExpression(texto) {
  const exp = parseDiceExpression(texto);
  if (!exp) return null;
  let total = exp.fixo;
  const partes = [];
  for (const d of exp.dados) {
    const valores = [];
    for (let i = 0; i < d.qtd; i++) {
      const v = Math.floor(Math.random() * d.faces) + 1;
      valores.push(v);
      total += d.sinal * v;
    }
    partes.push(`${d.sinal < 0 ? "−" : ""}${d.qtd}d${d.faces} [${valores.join(", ")}]`);
  }
  if (exp.fixo) partes.push(`${exp.fixo > 0 ? "+" : "−"}${Math.abs(exp.fixo)}`);
  // d20 sozinho ainda merece o destaque de crítico
  const soUmD20 = exp.dados.length === 1 && exp.dados[0].qtd === 1 && exp.dados[0].faces === 20;
  const bruto = soUmD20 ? total - exp.fixo : null;
  return {
    total,
    detalhe: partes.join(" "),
    tag: bruto === 20 ? " 🌟 CRÍTICO!" : bruto === 1 ? " 💀 FALHA CRÍTICA!" : ""
  };
}

function rollAttackAndDamage(weaponName, atkBonus, dmgFormula, dmgBonus, dmgType) {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const atkTotal = d20 + atkBonus;
  const atkStr = atkBonus >= 0 ? `+${atkBonus}` : `${atkBonus}`;

  const match = dmgFormula.match(/(\d+)d(\d+)/);
  let dmgRollSum = 0;
  if (match) {
    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);
    for (let i = 0; i < count; i++) {
      dmgRollSum += Math.floor(Math.random() * sides) + 1;
    }
  } else {
    dmgRollSum = parseInt(dmgFormula) || 4;
  }

  const finalDmg = Math.max(1, dmgRollSum + dmgBonus);
  const dmgBonusStr = dmgBonus !== 0 ? (dmgBonus >= 0 ? `+${dmgBonus}` : `${dmgBonus}`) : '';

  showToast(`⚔️ <strong>Ataque (${weaponName}):</strong> d20(${d20}) ${atkStr} = <strong>${atkTotal}</strong><br>💥 <strong>Dano:</strong> [${dmgFormula}](${dmgRollSum}) ${dmgBonusStr} = <strong>${finalDmg} ${dmgType}</strong>`);
}

/**
 * Exibe notificação Toast
 */
function showToast(msg) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Vincula todos os eventos de formulários, botões e navegação
 */
function bindEvents() {
  // Alternador de Modo do Aplicativo (Wizard vs Ficha Direta)
  const btnWizard = document.getElementById("btnModeWizard");
  const btnSheet = document.getElementById("btnModeSheet");
  const workspace = document.getElementById("mainWorkspace");

  if (btnWizard && btnSheet) {
    btnWizard.addEventListener("click", () => {
      btnWizard.classList.add("active");
      btnSheet.classList.remove("active");
      workspace.classList.remove("mode-sheet");
      character.appMode = "wizard";
      fitSheetToViewport();
    });

    btnSheet.addEventListener("click", () => {
      btnSheet.classList.add("active");
      btnWizard.classList.remove("active");
      workspace.classList.add("mode-sheet");
      character.appMode = "sheet";
      fitSheetToViewport();
    });
  }

  // Zoom da ficha (barra de ferramentas da ficha)
  const zoomIn = document.getElementById("btnSheetZoomIn");
  const zoomOut = document.getElementById("btnSheetZoomOut");
  const zoomFit = document.getElementById("btnSheetZoomFit");
  if (zoomIn) zoomIn.addEventListener("click", () => changeSheetZoom(0.15));
  if (zoomOut) zoomOut.addEventListener("click", () => changeSheetZoom(-0.15));
  if (zoomFit) zoomFit.addEventListener("click", () => changeSheetZoom(null));

  // Navegação do Wizard (Passos 1 a 6)
  const wizardTabs = document.querySelectorAll(".step-tab-btn");
  wizardTabs.forEach(btn => {
    btn.addEventListener("click", () => {
      const step = btn.getAttribute("data-step");
      setWizardStep(parseInt(step));
    });
  });

  document.getElementById("btnPrevStep").addEventListener("click", () => {
    const currentStep = parseInt(document.querySelector(".step-tab-btn.active").getAttribute("data-step"));
    if (currentStep > 1) setWizardStep(currentStep - 1);
  });

  document.getElementById("btnNextStep").addEventListener("click", () => {
    const currentStep = parseInt(document.querySelector(".step-tab-btn.active").getAttribute("data-step"));
    if (currentStep < 6) setWizardStep(currentStep + 1);
  });

  // As duas páginas ficam abertas, uma embaixo da outra. Os botões deixaram de
  // trocar de página e passaram a ligar e desligar cada uma — dá para ver as
  // duas ao mesmo tempo ou esconder a que não interessa agora.
  const pageTabs = document.querySelectorAll(".page-tab-btn");
  pageTabs.forEach(btn => {
    btn.addEventListener("click", () => {
      const page = btn.getAttribute("data-page");
      const alvo = document.getElementById(`sheetPage${page}`);
      if (!alvo) return;

      const visiveis = [...document.querySelectorAll(".sheet-page.active-page")];
      const ligada = alvo.classList.contains("active-page");
      // esconder a última visível deixaria o painel vazio sem motivo
      if (ligada && visiveis.length === 1) {
        showToast("Deixe ao menos uma página visível.");
        return;
      }

      alvo.classList.toggle("active-page", !ligada);
      btn.classList.toggle("active", !ligada);
      btn.setAttribute("aria-pressed", String(!ligada));
      fitSheetToViewport();
    });
    btn.setAttribute("aria-pressed", String(btn.classList.contains("active")));
  });

  // Ficha oficial editável (2 páginas): todos os campos, tabelas e marcações
  bindOfficialSheetEvents();

  // Inputs Básicos (Passo 1 do Wizard)
  document.getElementById("inputCharName").addEventListener("input", (e) => {
    character.name = e.target.value;
    recalculateCharacter();
  });

  document.getElementById("inputPlayerName").addEventListener("input", (e) => {
    character.playerName = e.target.value;
    recalculateCharacter();
  });

  document.getElementById("selectClass1").addEventListener("change", (e) => {
    character.class1 = e.target.value;
    updateCustomOriginPanels();
    updateSubclassesDropdown();
    updateSkillsSelector();
    renderSpellsCatalog();
    recalculateCharacter();
  });

  document.getElementById("selectLevel1").addEventListener("change", (e) => {
    character.level1 = parseInt(e.target.value);
    updateCustomOriginPanels();
    updateSubclassesDropdown();
    renderSpellsCatalog();
    recalculateCharacter();
  });

  // Botões "+" e "−" de nível. Reaproveitam o próprio <select>: mudam o valor
  // e disparam o "change" que já existe, para não haver dois caminhos
  // diferentes para a mesma mudança.
  document.querySelectorAll(".level-step-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const passo = parseInt(btn.getAttribute("data-level-step"), 10);
      const alvo = btn.getAttribute("data-level-target");
      const select = document.getElementById(`selectLevel${alvo}`);
      if (!select) return;

      const atual = parseInt(select.value, 10) || 1;
      const novo = atual + passo;
      const existe = [...select.options].some(o => parseInt(o.value, 10) === novo);
      if (!existe) {
        showToast(passo > 0 ? "Já está no nível máximo (20)." : "O nível mínimo é 1.");
        return;
      }

      select.value = String(novo);
      select.dispatchEvent(new Event("change", { bubbles: true }));
      showToast(passo > 0 ? `⬆️ Nível ${novo}` : `Nível ${novo}`);
    });
  });

  document.getElementById("selectMulticlass").addEventListener("change", (e) => {
    character.class2 = e.target.value;
    const row = document.getElementById("multiclassLevelRow");
    row.style.display = character.class2 !== "none" ? "grid" : "none";
    updateCustomOriginPanels();
    renderSpellsCatalog();
    recalculateCharacter();
  });

  document.getElementById("selectLevel2").addEventListener("change", (e) => {
    character.level2 = parseInt(e.target.value);
    updateCustomOriginPanels();
    renderSpellsCatalog();
    recalculateCharacter();
  });

  document.getElementById("selectSpecies").addEventListener("change", (e) => {
    character.species = e.target.value;
    // Sair do Humano descarta o talento extra: ele vem do traço Versátil e não
    // teria de onde vir em outra espécie.
    if (character.species !== "human") character.humanOriginFeat = "none";
    updateCustomOriginPanels();
    updateLineagesDropdown();
    renderHumanOriginFeat();
    updateFeatsList();
    recalculateCharacter();
  });

  const selHumanFeat = document.getElementById("selectHumanOriginFeat");
  if (selHumanFeat) {
    selHumanFeat.addEventListener("change", (e) => {
      character.humanOriginFeat = e.target.value;
      renderHumanOriginFeat();
      updateFeatsList();
      renderSpellsCatalog();
      recalculateCharacter();
    });
  }

  // ---- Modo de Pontos de Vida (Passo 2) ----
  const selHpMode = document.getElementById("selectHpMode");
  if (selHpMode) {
    selHpMode.addEventListener("change", (e) => {
      character.hpMode = e.target.value;
      renderHpPorNivel();
      recalculateCharacter();
    });
  }

  const gradeHp = document.getElementById("hpPorNivelGrid");
  if (gradeHp) {
    gradeHp.addEventListener("input", (e) => {
      const campo = e.target;
      if (!campo.classList || !campo.classList.contains("hp-nivel-input")) return;

      const nivel = campo.getAttribute("data-nivel");
      const bruto = campo.value.trim();
      if (!character.hpRolls) character.hpRolls = {};

      if (bruto === "") delete character.hpRolls[nivel];
      else {
        const teto = parseInt(campo.getAttribute("max"), 10) || 12;
        character.hpRolls[nivel] = Math.min(teto, Math.max(1, parseInt(bruto, 10) || 1));
      }
      recalculateCharacter();
    });
  }

  document.getElementById("selectLineage").addEventListener("change", (e) => {
    character.lineage = e.target.value;
    renderSpeciesBackgroundSummary();
    recalculateCharacter();
  });

  document.getElementById("selectBackground").addEventListener("change", (e) => {
    character.background = e.target.value;
    initCustomBackgroundPanel();
    updateBackgroundBonusSelectors();
    renderSpeciesBackgroundSummary();
    updateSkillsSelector();
    renderHumanOriginFeat();
    updateFeatsList();
    recalculateCharacter();
  });

  bindCustomOriginPanels();

  // Painel de Antecedente Personalizado (Passo 1)
  const bindCustomBg = (id, evt, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(evt, handler);
  };

  bindCustomBg("selectCustomBgBonusMode", "change", (e) => {
    character.backgroundBonusMode = e.target.value;
    character.customBg.bonusMode = e.target.value;
    initCustomBackgroundPanel();
    updateBackgroundBonusSelectors();
    recalculateCharacter();
  });

  [["selectCustomBgAttr1", "primary"], ["selectCustomBgAttr2", "secondary"], ["selectCustomBgAttr3", "tertiary"]].forEach(([id, key]) => {
    bindCustomBg(id, "change", (e) => {
      character.backgroundBonuses[key] = e.target.value;
      updateBackgroundBonusSelectors();
      recalculateCharacter();
    });
  });

  bindCustomBg("inputCustomBgName", "input", (e) => {
    character.customBg.name = e.target.value;
    // O nome aparece no select do Passo 1, no resumo, na lista de talentos e no
    // campo Origem da ficha — todos passam por getBackgroundLabel().
    const label = getBackgroundLabel({ isCustom: true });
    const opt = document.querySelector('#selectBackground option[value="custom"]');
    if (opt) opt.textContent = `⭐ ${label}`;
    const originTag = document.querySelector("#featsContainer .tag-origin");
    if (originTag) originTag.textContent = `Origem • ${label}`;
    renderSpeciesBackgroundSummary();
    recalculateCharacter();
  });

  bindCustomBg("selectCustomBgFeat", "change", (e) => {
    character.customBg.feat = e.target.value;
    updateCustomBgFeatPreview();
    renderSpeciesBackgroundSummary();
    updateFeatsList();
    recalculateCharacter();
  });

  bindCustomBg("selectCustomBgSkill1", "change", (e) => {
    character.customBg.skill1 = e.target.value;
    updateSkillsSelector();
    recalculateCharacter();
  });

  bindCustomBg("selectCustomBgSkill2", "change", (e) => {
    character.customBg.skill2 = e.target.value;
    updateSkillsSelector();
    recalculateCharacter();
  });

  bindCustomBg("selectCustomBgTool", "change", (e) => {
    character.customBg.tool = e.target.value;
    const groupToolOther = document.getElementById("groupCustomBgToolOther");
    if (groupToolOther) groupToolOther.style.display = e.target.value === "custom" ? "block" : "none";
    recalculateCharacter();
  });

  bindCustomBg("inputCustomBgToolOther", "input", (e) => {
    character.customBg.toolCustom = e.target.value;
    recalculateCharacter();
  });

  bindCustomBg("inputCustomLanguagesExtra", "input", (e) => {
    character.customLanguages = e.target.value;
    recalculateCharacter();
  });

  // Modos de Atributos (Passo 2)
  document.querySelectorAll(".ability-mode-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".ability-mode-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      character.abilityMode = btn.getAttribute("data-mode");

      const rollSec = document.getElementById("rollDiceSection");
      rollSec.style.display = character.abilityMode === "roll" ? "block" : "none";

      if (character.abilityMode === "standard") {
        character.baseScores = { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 };
      } else if (character.abilityMode === "pointbuy") {
        character.baseScores = { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 };
      }

      renderAbilityInputs();
      recalculateCharacter();
    });
  });

  document.getElementById("btnRollAllStats").addEventListener("click", roll4d6Stats);

  // Subclasse (Passo 3)
  document.getElementById("selectSubclass1").addEventListener("change", (e) => {
    character.subclass1 = e.target.value;
    const classObj = DND5E_DATA.classes.find(c => c.id === character.class1);
    const subObj = classObj ? classObj.subclasses.find(s => s.id === character.subclass1) : null;
    if (subObj) {
      const bonusSpellsHtml = subclassSpellsHtml(subObj, character.level1)
                             + landSpellsHtml(subObj, character.level1);
      document.getElementById("subclass1Desc").innerHTML = `<h4><i class="fa-solid fa-khanda"></i> ${subObj.name}</h4><p>${subObj.desc}</p>${bonusSpellsHtml}`;
    }
    recalculateCharacter();
  });

  // Filtros de Magias (Passo 4)
  const spellFilterClass = document.getElementById("spellFilterClass");
  if (spellFilterClass) spellFilterClass.addEventListener("change", renderSpellsCatalog);

  const spellFilterLevel = document.getElementById("spellFilterLevel");
  if (spellFilterLevel) spellFilterLevel.addEventListener("change", renderSpellsCatalog);

  const spellFilterSchool = document.getElementById("spellFilterSchool");
  if (spellFilterSchool) spellFilterSchool.addEventListener("change", renderSpellsCatalog);

  const spellFilterSelected = document.getElementById("spellFilterSelected");
  if (spellFilterSelected) spellFilterSelected.addEventListener("click", () => {
    const ligado = spellFilterSelected.getAttribute("aria-pressed") === "true";
    spellFilterSelected.setAttribute("aria-pressed", ligado ? "false" : "true");
    renderSpellsCatalog();
  });

  const spellSearchInput = document.getElementById("spellSearchInput");
  if (spellSearchInput) spellSearchInput.addEventListener("input", renderSpellsCatalog);

  // Equipamentos (Passo 5)
  document.getElementById("selectEquippedArmor").addEventListener("change", (e) => {
    character.equippedArmor = e.target.value;
    recalculateCharacter();
  });

  document.getElementById("selectEquippedShield").addEventListener("change", (e) => {
    character.equippedShield = e.target.value;
    recalculateCharacter();
  });

  const listaArmas = document.getElementById("weaponSlots");
  if (listaArmas) {
    listaArmas.addEventListener("change", (e) => {
      const sel = e.target.closest(".weapon-slot-select");
      if (!sel) return;
      const i = Number(sel.getAttribute("data-slot"));
      const anterior = character.weapons[i];
      character.weapons[i] = sel.value;
      const nomeDe = (id) => {
        const w = DND5E_DATA.weapons.find(x => x.id === id);
        return w ? w.name.split(" (")[0] : null;
      };
      const saiuNome = nomeDe(anterior), entrouNome = nomeDe(sel.value);
      if (saiuNome !== entrouNome) {
        logHpEvent("arma", entrouNome
          ? `Equipou ${entrouNome}${saiuNome ? ` no lugar de ${saiuNome}` : ""}`
          : `Desequipou ${saiuNome}`, character.currentHp || 0);
      }
      // trocar a arma do espaço solta a maestria que estava presa a ela
      if (anterior && anterior !== sel.value && !character.weapons.includes(anterior)) {
        character.activeMasteries = (character.activeMasteries || []).filter(w => w !== anterior);
      }
      renderWeaponSlots();
      recalculateCharacter();
    });

    listaArmas.addEventListener("click", (e) => {
      const btnMaestria = e.target.closest(".weapon-mastery-btn");
      if (btnMaestria) {
        toggleWeaponMastery(character.weapons[Number(btnMaestria.getAttribute("data-slot"))]);
        return;
      }
      const btnRemover = e.target.closest(".weapon-slot-remove");
      if (btnRemover) {
        const i = Number(btnRemover.getAttribute("data-slot"));
        const saiu = character.weapons[i];
        const wSaiu = DND5E_DATA.weapons.find(x => x.id === saiu);
        if (wSaiu) logHpEvent("arma", `Removeu ${wSaiu.name.split(" (")[0]}`, character.currentHp || 0);
        character.weapons.splice(i, 1);
        if (saiu && !character.weapons.includes(saiu)) {
          character.activeMasteries = (character.activeMasteries || []).filter(w => w !== saiu);
        }
        renderWeaponSlots();
        recalculateCharacter();
      }
    });
  }

  // ---- painel de Pontos de Vida ----
  const hpValor = () => {
    const el = document.getElementById("hpTrackerValor");
    const v = parseInt(el?.value, 10) || 0;
    if (el) el.value = "";
    return v;
  };
  const hpMaximo = () => parseInt(document.getElementById("sheetHpMax")?.value, 10) || 0;
  const hpDepois = () => { renderHpTracker(); recalculateCharacter(); saveToLocalStorage(); };

  const btnDano = document.getElementById("btnHpDano");
  if (btnDano) btnDano.addEventListener("click", () => { applyDamage(hpValor()); hpDepois(); });

  const btnCura = document.getElementById("btnHpCura");
  if (btnCura) btnCura.addEventListener("click", () => { applyHealing(hpValor(), hpMaximo()); hpDepois(); });

  const btnTemp = document.getElementById("btnHpTemp");
  if (btnTemp) btnTemp.addEventListener("click", () => { applyTempHp(hpValor()); hpDepois(); });

  // ---- usos de característica ----
  const listaUsos = document.getElementById("featureUsesList");
  if (listaUsos) listaUsos.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-uso]");
    if (!btn) return;
    changeFeatureUse(btn.getAttribute("data-uso"), Number(btn.getAttribute("data-delta")));
    renderFeatureUses(); renderHpLog(); recalculateCharacter(); saveToLocalStorage();
  });

  // ---- espaços de magia ----
  const painelEspacos = document.getElementById("spellSlotsPanel");
  if (painelEspacos) painelEspacos.addEventListener("click", (e) => {
    // Abrir uma origem ou uma descrição não muda nada do personagem: mexe só
    // no DOM e sai, sem o redesenho que fecharia o que acabou de abrir.
    if (toggleMagiaPainel(e)) return;

    const gratis = e.target.closest("[data-freecast]");
    if (gratis) {
      changeFreeCast(gratis.getAttribute("data-freecast"), Number(gratis.getAttribute("data-delta")));
      renderSpellSlots(); renderHpLog(); recalculateCharacter(); saveToLocalStorage();
      return;
    }

    const btn = e.target.closest("[data-slot]");
    if (!btn) return;
    changeSpellSlot(Number(btn.getAttribute("data-slot")), Number(btn.getAttribute("data-delta")));
    renderSpellSlots(); renderHpLog(); recalculateCharacter(); saveToLocalStorage();
  });

  // ---- condições ----
  const listaCond = document.getElementById("conditionsList");
  if (listaCond) listaCond.addEventListener("click", (e) => {
    const nivel = e.target.closest("[data-exaustao]");
    if (nivel) {
      changeExhaustion(Number(nivel.getAttribute("data-exaustao")));
      renderConditions(); recalculateCharacter(); saveToLocalStorage();
      return;
    }
    const info = e.target.closest("[data-cond-info]");
    if (info) {
      const c = DND5E_DATA.conditions.find(x => x.id === info.getAttribute("data-cond-info"));
      const box = document.getElementById("conditionsDetalhe");
      if (c && box) {
        const jaAberta = !box.hidden && box.dataset.cond === c.id;
        box.hidden = jaAberta;
        box.dataset.cond = c.id;
        box.innerHTML = conditionHtml(c);
      }
      return;
    }
    const btn = e.target.closest("[data-cond]");
    if (btn) {
      toggleCondition(btn.getAttribute("data-cond"));
      renderConditions(); renderHpLog(); recalculateCharacter(); saveToLocalStorage();
    }
  });

  const btnCurto = document.getElementById("btnDescansoCurto");
  if (btnCurto) btnCurto.addEventListener("click", () => { shortRest(); hpDepois(); });

  // Caneta do painel de vida. O botão mora dentro do <summary>, então precisa
  // barrar o clique: sem isso, abrir a edição fecharia o painel junto.
  // ---- Escolha das magias de ataque que entram na ficha ----
  const btnEscolherMagias = document.getElementById("btnEscolherMagiasAtaque");
  const modalMagias = document.getElementById("spellAttackPickModal");
  if (btnEscolherMagias && modalMagias) {
    btnEscolherMagias.addEventListener("click", abrirEscolhaDeMagiasDeAtaque);

    const fechar = () => modalMagias.classList.remove("active");
    document.getElementById("closeSpellAttackPickModal").addEventListener("click", fechar);

    document.getElementById("btnSpellAttackPickOk").addEventListener("click", () => {
      const marcadas = [...modalMagias.querySelectorAll("[data-pick]:checked")]
        .map(c => c.getAttribute("data-pick"));
      // Guarda a escolha inteira, mesmo além das vagas: se o jogador remover
      // uma arma depois, as magias que ele já tinha marcado entram sozinhas.
      sheetOv().spellAttackPicks = marcadas;
      fechar();
      recalculateCharacter();
      saveToLocalStorage();
      showToast(marcadas.length
        ? `✨ ${marcadas.length} magia(s) de ataque priorizada(s) na ficha.`
        : "Escolha limpa: o app volta a preencher as vagas na ordem da lista.");
    });

    document.getElementById("btnSpellAttackPickAuto").addEventListener("click", () => {
      sheetOv().spellAttackPicks = [];
      fechar();
      recalculateCharacter();
      saveToLocalStorage();
      showToast("O app volta a preencher as vagas na ordem da lista.");
    });

    modalMagias.addEventListener("click", (e) => { if (e.target === modalMagias) fechar(); });
  }

  const btnHpEditar = document.getElementById("btnHpEditar");
  if (btnHpEditar) {
    btnHpEditar.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      const painel = document.getElementById("hpTracker");
      if (painel) painel.open = true;   // editar de painel fechado seria às cegas
      _editandoPv = true;
      renderHpTracker();
    });
  }

  const btnLimpar = document.getElementById("btnHpLogLimpar");
  if (btnLimpar) btnLimpar.addEventListener("click", () => {
    character.hpLog = [];
    hpDepois();
    showToast("Histórico de vida limpo.");
  });

  const btnLongo = document.getElementById("btnDescansoLongo");
  if (btnLongo) btnLongo.addEventListener("click", () => { longRest(hpMaximo()); hpDepois(); });

  const listaDados = document.getElementById("hpTrackerDados");
  if (listaDados) listaDados.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-gastar]");
    if (!btn) return;
    // O modificador vem da ficha, que já tem os bônus de espécie e talentos —
    // os baseScores são só o que o jogador digitou na compra por pontos.
    const conEl = document.querySelector('[data-ability-mod="con"]');
    const conMod = conEl ? (parseInt(conEl.value, 10) || 0)
                         : Math.floor(((character.baseScores?.con || 10) - 10) / 2);
    spendHitDie(btn.getAttribute("data-gastar"), hpMaximo(), conMod);
    hpDepois();
  });

  const btnAddArma = document.getElementById("btnAddWeaponSlot");
  if (btnAddArma) btnAddArma.addEventListener("click", () => {
    character.weapons.push("none");
    renderWeaponSlots();
    recalculateCharacter();
  });

  document.getElementById("textInventory").addEventListener("input", (e) => {
    character.inventory = e.target.value;
    recalculateCharacter();
  });

  document.getElementById("inputGoldPO").addEventListener("input", (e) => {
    character.coins.po = parseInt(e.target.value) || 0;
    recalculateCharacter();
  });
  document.getElementById("inputSilverPP").addEventListener("input", (e) => {
    character.coins.pp = parseInt(e.target.value) || 0;
    recalculateCharacter();
  });
  document.getElementById("inputCopperPC").addEventListener("input", (e) => {
    character.coins.pc = parseInt(e.target.value) || 0;
    recalculateCharacter();
  });

  // Biografia (Passo 6)
  ["Age", "Height", "Weight", "Eyes", "Skin", "Hair"].forEach(f => {
    document.getElementById(`input${f}`).addEventListener("input", (e) => {
      character.bio[f.toLowerCase()] = e.target.value;
      recalculateCharacter();
    });
  });

  ["Personality", "Ideals", "Bonds", "Flaws", "Backstory"].forEach(f => {
    document.getElementById(`text${f}`).addEventListener("input", (e) => {
      character.bio[f.toLowerCase()] = e.target.value;
      recalculateCharacter();
    });
  });

  // Botões do Cabeçalho e Ações Globais
  document.getElementById("btnNewChar").addEventListener("click", resetCharacter);
  document.getElementById("btnRandomChar").addEventListener("click", generateRandomCharacter);
  const btnRestore = document.getElementById("btnRestoreSession");
  if (btnRestore) btnRestore.addEventListener("click", restoreCachedSession);
  document.getElementById("btnExportJson").addEventListener("click", exportCharacterJson);
  document.getElementById("inputImportJson").addEventListener("change", importCharacterJson);
  // "Imprimir / PDF" é ligado em pdf-export.js: ele gera a ficha oficial preenchida
  // e abre a impressão dela, em vez de imprimir o HTML da tela.
  // Rolador de expressão: "2d6+3", "d20", "4d6-1". Substituiu os dois botões
  // de d20 fixo — na mesa se rola de tudo, não só d20.
  const rolarExpressao = (origem) => {
    const el = document.getElementById(origem);
    const texto = (el?.value || "").trim() || "1d20";
    const r = rollDiceExpression(texto);
    if (!r) {
      showToast(`⚠️ Não entendi "${texto}". Use algo como 2d6+3, d20 ou 1d8-1.`);
      return;
    }
    // O texto vem do campo, então é escapado antes de virar HTML no histórico
    const expEscapada = texto.replace(/[&<>"]/g, ch =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
    logHpEvent("rolagem", `${expEscapada}: ${r.detalhe} = <strong>${r.total}</strong>${r.tag}`,
               character.currentHp || 0);
    renderHpLog();
    saveToLocalStorage();
    showToast(`🎲 <strong>${texto}:</strong> ${r.detalhe} = <strong>${r.total}</strong>${r.tag}`);
  };
  const inputDados = document.getElementById("diceInputGlobal");
  if (inputDados) inputDados.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); rolarExpressao("diceInputGlobal"); }
  });

  const btnRolarGlobal = document.getElementById("btnRollDiceGlobal");
  if (btnRolarGlobal) btnRolarGlobal.addEventListener("click", () => rolarExpressao("diceInputGlobal"));

  // Modal: Magia Personalizada
  const customSpellModal = document.getElementById("customSpellModal");
  const btnAddCustomSpell = document.getElementById("btnAddCustomSpellModalBtn");
  if (customSpellModal && btnAddCustomSpell) {
    const fecharMagia = () => customSpellModal.classList.remove("active");

    btnAddCustomSpell.addEventListener("click", () => {
      renderCustomSpellClassesGrid();
      renderSuggestionChips("customSpellDescSuggestions", "customSpellDesc", SUGESTOES_DESC_MAGIA);
      customSpellModal.classList.add("active");
      document.getElementById("customSpellName").focus();
    });
    document.getElementById("closeCustomSpellModal").addEventListener("click", fecharMagia);
    document.getElementById("btnCancelCustomSpell").addEventListener("click", fecharMagia);

    document.getElementById("customSpellForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const val = (id) => (document.getElementById(id).value || "").trim();
      const name = val("customSpellName");
      const desc = val("customSpellDesc");
      if (!name || !desc) return;

      const classes = [...document.querySelectorAll("#customSpellClassesGrid input:checked")].map(i => i.value);

      character.customSpells.push({
        id: "customspell_" + Date.now(),
        isCustom: true,
        name,
        level: parseInt(document.getElementById("customSpellLevel").value, 10),
        school: document.getElementById("customSpellSchool").value,
        time: val("customSpellTime"),
        range: val("customSpellRange"),
        components: val("customSpellComponents"),
        duration: val("customSpellDuration"),
        classes,
        desc
      });

      fecharMagia();
      document.getElementById("customSpellForm").reset();
      document.getElementById("customSpellClassesGrid").innerHTML = "";
      syncCustomSpellsIntoCatalog();
      renderSpellsCatalog();
      // As caixas de escolha de magia dos talentos (Iniciado em Magia, Tocado
      // pelas Fadas...) montam as opções a partir do catálogo: sem redesenhar,
      // a magia nova só apareceria lá na próxima vez que a lista fosse montada.
      updateFeatsList();
      recalculateCharacter();
      showToast(`✨ Magia personalizada "${name}" criada! Use "Adicionar" para levá-la à ficha.`);
    });
  }

  // Modal: Talento Customizado
  const customFeatModal = document.getElementById("customFeatModal");
  document.getElementById("btnAddCustomFeatModalBtn").addEventListener("click", () => {
    customFeatModal.classList.add("active");
  });
  document.getElementById("closeCustomFeatModal").addEventListener("click", () => {
    customFeatModal.classList.remove("active");
  });
  document.getElementById("btnCancelCustomFeat").addEventListener("click", () => {
    customFeatModal.classList.remove("active");
  });

  document.getElementById("customFeatForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("customFeatName").value.trim();
    const type = document.getElementById("customFeatType").value;
    const abilityBonus = document.getElementById("customFeatAbilityBonus").value;
    const desc = document.getElementById("customFeatDesc").value.trim();

    if (name && desc) {
      const idNovo = "custom_" + Date.now();
      character.customFeats.push({ id: idNovo, name, type, abilityBonus, desc });
      // Quem acabou de criar o talento quer usá-lo: entra já marcado, e a caixa
      // de seleção na lista serve para tirar depois, se for o caso.
      if (!character.selectedFeats.includes(idNovo)) character.selectedFeats.push(idNovo);
      customFeatModal.classList.remove("active");
      document.getElementById("customFeatForm").reset();
      updateFeatsList();
      recalculateCharacter();
      showToast(`✨ Talento personalizado "${name}" adicionado!`);
    }
  });

  // Modal: Item Customizado
  const customItemModal = document.getElementById("customItemModal");
  const btnAddCustomItem = document.getElementById("btnAddCustomItemModalBtn");
  if (btnAddCustomItem) {
    btnAddCustomItem.addEventListener("click", () => {
      customItemModal.classList.add("active");
    });
  }
  document.getElementById("closeCustomItemModal").addEventListener("click", () => {
    customItemModal.classList.remove("active");
  });
  document.getElementById("btnCancelCustomItem").addEventListener("click", () => {
    customItemModal.classList.remove("active");
  });

  const selectCustomItemType = document.getElementById("customItemType");
  const weaponFields = document.getElementById("customItemWeaponFields");
  const protectionFields = document.getElementById("customItemProtectionFields");

  selectCustomItemType.addEventListener("change", (e) => {
    const t = e.target.value;
    weaponFields.style.display = t === "weapon" ? "grid" : "none";
    protectionFields.style.display = (t === "armor" || t === "shield" || t === "ring" || t === "wondrous") ? "grid" : "none";
  });

  document.getElementById("customItemForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("customItemName").value.trim();
    const type = document.getElementById("customItemType").value;
    const damage = document.getElementById("customItemDamage").value.trim();
    const damageType = document.getElementById("customItemDamageType").value;
    const mastery = document.getElementById("customItemMastery").value.trim();
    const acBonus = parseInt(document.getElementById("customItemAcBonus").value) || 0;
    const attunement = document.getElementById("customItemAttunement").value;
    const weight = document.getElementById("customItemWeight").value.trim();
    const cost = document.getElementById("customItemCost").value.trim();
    const desc = document.getElementById("customItemDesc").value.trim();
    const equipped = document.getElementById("customItemEquipNow").checked;

    if (name) {
      character.customItems.push({
        id: "item_" + Date.now(),
        name,
        type,
        damage,
        damageType,
        mastery,
        acBonus,
        attunement,
        weight,
        cost,
        desc,
        equipped
      });

      customItemModal.classList.remove("active");
      document.getElementById("customItemForm").reset();
      renderCustomItemsList();
      recalculateCharacter();
      showToast(`🛡️ Item customizado "${name}" criado com sucesso!`);
    }
  });

  // Modal: Ataque Personalizado na Ficha
  const customAttackModal = document.getElementById("customAttackModal");
  const btnAddSheetAttack = document.getElementById("btnAddSheetAttackRowBtn");
  if (btnAddSheetAttack) {
    btnAddSheetAttack.addEventListener("click", () => {
      customAttackModal.classList.add("active");
    });
  }
  document.getElementById("closeCustomAttackModal").addEventListener("click", () => {
    customAttackModal.classList.remove("active");
  });
  document.getElementById("btnCancelCustomAttack").addEventListener("click", () => {
    customAttackModal.classList.remove("active");
  });

  document.getElementById("customAttackForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("customAtkName").value.trim();
    const bonus = document.getElementById("customAtkBonus").value.trim();
    const damage = document.getElementById("customAtkDamage").value.trim();

    if (name) {
      character.customAttacks.push({
        id: "atk_" + Date.now(),
        name,
        bonus,
        damage
      });
      customAttackModal.classList.remove("active");
      document.getElementById("customAttackForm").reset();
      recalculateCharacter();
      showToast(`⚔️ Ataque "${name}" adicionado à ficha!`);
    }
  });

  // Modal: Característica Personalizada na Ficha
  const customFeatureModal = document.getElementById("customFeatureModal");
  const btnAddSheetFeature = document.getElementById("btnAddSheetFeatureBtn");
  if (btnAddSheetFeature) {
    btnAddSheetFeature.addEventListener("click", () => {
      customFeatureModal.classList.add("active");
    });
  }
  document.getElementById("closeCustomFeatureModal").addEventListener("click", () => {
    customFeatureModal.classList.remove("active");
  });
  document.getElementById("btnCancelCustomFeature").addEventListener("click", () => {
    customFeatureModal.classList.remove("active");
  });

  document.getElementById("customFeatureForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("customFeatureTitle").value.trim();
    const desc = document.getElementById("customFeatureDesc").value.trim();

    if (title) {
      character.customFeatures.push({
        id: "feat_" + Date.now(),
        title,
        desc
      });
      customFeatureModal.classList.remove("active");
      document.getElementById("customFeatureForm").reset();
      recalculateCharacter();
      showToast(`📜 Característica "${title}" adicionada à ficha!`);
    }
  });

  // Gerenciador de Fichas Salvas
  const manageModal = document.getElementById("manageCharsModal");
  document.getElementById("btnManageChars").addEventListener("click", () => {
    renderSavedCharsList();
    manageModal.classList.add("active");
  });
  document.getElementById("closeManageCharsModal").addEventListener("click", () => {
    manageModal.classList.remove("active");
  });
  document.getElementById("btnCloseSavedChars").addEventListener("click", () => {
    manageModal.classList.remove("active");
  });
  document.getElementById("btnSaveCurrentChar").addEventListener("click", () => {
    saveToLocalStorage(true);
    renderSavedCharsList();
    showToast("💾 Ficha salva com sucesso no navegador!");
  });
}

/**
 * Altera o passo ativo do Wizard
 */
function setWizardStep(stepNum) {
  document.querySelectorAll(".step-tab-btn").forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.getAttribute("data-step")) === stepNum);
  });
  document.querySelectorAll(".step-content").forEach(content => {
    content.classList.toggle("active", content.id === `step${stepNum}`);
  });

  document.getElementById("btnPrevStep").disabled = stepNum === 1;
  document.getElementById("btnNextStep").innerHTML = stepNum === 6 ? 'Finalizar <i class="fa-solid fa-check"></i>' : 'Próximo <i class="fa-solid fa-chevron-right"></i>';

  // Revalida o conteúdo dependente de classe/nível/antecedente ao entrar no passo
  if (stepNum === 3) {
    updateSubclassesDropdown();
    updateSkillsSelector();
    updateFeatsList();
  } else if (stepNum === 4) {
    renderSpellsCatalog();
  }
}

/**
 * Reseta o personagem para o padrão
 */
function resetCharacter() {
  if (confirm("Deseja criar um novo personagem? As alterações não salvas serão perdidas.")) {
    _ofWeaponsSig = null;
    _ofSpellsSig = null;
    character = createBlankCharacter();

    localStorage.removeItem("dnd55_active_character");
    hideSessionRestoreButton();
    syncWizardControls();
    populateDropdowns();
    renderAbilityInputs();
    renderSpellsCatalog();
    renderCustomItemsList();
    updateFeatsList();
    renderDeathSaves();
    recalculateCharacter();
    showToast("✨ Ficha nova em branco — pode preencher do zero!");
  }
}

function generateRandomCharacter() {
  const classes = DND5E_DATA.classes;
  const speciesList = DND5E_DATA.species;
  const bgs = DND5E_DATA.backgrounds;

  const randClass = classes[Math.floor(Math.random() * classes.length)];
  const randSpecies = speciesList[Math.floor(Math.random() * speciesList.length)];
  const randBg = bgs[Math.floor(Math.random() * bgs.length)];

  character.name = `Herói de ${randSpecies.name}`;
  character.class1 = randClass.id;
  character.level1 = Math.floor(Math.random() * 5) + 1;
  character.class2 = "none";
  character.species = randSpecies.id;
  character.lineage = randSpecies.lineages.length > 0 ? randSpecies.lineages[0].id : "none";
  character.background = randBg.id;

  character.baseScores = { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 };

  if (character.level1 >= 3 && randClass.subclasses.length > 0) {
    character.subclass1 = randClass.subclasses[Math.floor(Math.random() * randClass.subclasses.length)].id;
  } else {
    character.subclass1 = "none";
  }

  character.trainedSkills = randClass.skillChoices ? randClass.skillChoices.list.slice(0, randClass.skillChoices.count) : ["athletics", "perception"];
  character.weapons = ["longsword", "dagger", "shortbow"];

  document.getElementById("inputCharName").value = character.name;
  document.getElementById("selectClass1").value = character.class1;
  document.getElementById("selectLevel1").value = character.level1;
  document.getElementById("selectMulticlass").value = "none";
  document.getElementById("selectSpecies").value = character.species;
  document.getElementById("selectBackground").value = character.background;

  populateDropdowns();
  renderAbilityInputs();
  renderSpellsCatalog();
  renderCustomItemsList();
  recalculateCharacter();
  showToast(`🎲 Personagem aleatório gerado: ${randSpecies.name} ${randClass.name} Nvl ${character.level1}!`);
}

/**
 * Exporta JSON
 */
/* ------------------------------------------------ NOME DO ARQUIVO EXPORTADO */

/** Tira do nome o que nenhum sistema de arquivos aceita */
function limparNomeDeArquivo(nome) {
  return String(nome || "").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * "Rhogar - Nível 5": o padrão de todo arquivo que o app exporta.
 *
 * `nomeAlternativo` existe para a exportação do PDF, que prefere o nome que
 * está na ficha da tela — o jogador pode ter trocado por lá.
 */
function nomePadraoDeArquivo(nomeAlternativo) {
  const nome = limparNomeDeArquivo(nomeAlternativo || character.name) || "Personagem";
  const multi = character.class2 && character.class2 !== "none";
  const nivel = (character.level1 || 1) + (multi ? (character.level2 || 0) : 0);
  return `${nome} - Nível ${nivel}`;
}

/**
 * Pergunta o nome do arquivo antes de exportar e devolve o nome escolhido, já
 * limpo e sem extensão — ou `null` se o jogador cancelar.
 *
 * Os `on*` no lugar de addEventListener são de propósito: o diálogo é um só,
 * reaproveitado pelos três botões de exportação, e com addEventListener cada
 * abertura deixaria mais um ouvinte pendurado no mesmo formulário.
 */
function pedirNomeDeArquivo(opcoes) {
  const { titulo, extensao } = opcoes || {};
  const sugestao = (opcoes && opcoes.nome) || nomePadraoDeArquivo();
  const modal = document.getElementById("exportNameModal");
  const form = document.getElementById("exportNameForm");
  const input = document.getElementById("exportNameInput");
  const btnCancelar = document.getElementById("btnCancelExportName");
  const btnFechar = document.getElementById("closeExportNameModal");
  // Sem o diálogo (uma página antiga em cache, por exemplo) exporta com o nome
  // padrão em vez de travar o botão.
  if (!modal || !form || !input) return Promise.resolve(sugestao);

  const elTitulo = document.getElementById("exportNameTitle");
  const elExt = document.getElementById("exportNameExt");
  if (elTitulo) elTitulo.textContent = titulo || "Salvar arquivo";
  if (elExt) elExt.textContent = extensao || "";
  input.value = sugestao;
  modal.classList.add("active");
  setTimeout(() => { input.focus(); input.select(); }, 50);

  return new Promise(resolve => {
    const fechar = (valor) => {
      modal.classList.remove("active");
      form.onsubmit = null;
      if (btnCancelar) btnCancelar.onclick = null;
      if (btnFechar) btnFechar.onclick = null;
      resolve(valor);
    };
    form.onsubmit = (e) => {
      e.preventDefault();
      const limpo = limparNomeDeArquivo(input.value);
      if (!limpo) { input.focus(); return; }
      fechar(limpo);
    };
    if (btnCancelar) btnCancelar.onclick = () => fechar(null);
    if (btnFechar) btnFechar.onclick = () => fechar(null);
  });
}

async function exportCharacterJson() {
  const nome = await pedirNomeDeArquivo({
    titulo: "Exportar ficha (JSON)", extensao: ".json"
  });
  if (!nome) return;
  const jsonStr = JSON.stringify(character, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nome}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`💾 Ficha exportada como "${nome}.json".`);
}

/**
 * Importa JSON
 */
function importCharacterJson(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (data && data.class1) {
        applyLoadedCharacter(data);
        saveToLocalStorage();
        showToast(`✅ Ficha "${character.name || "sem nome"}" importada — assistente e ficha preenchidos!`);
      } else {
        alert("Formato de arquivo JSON inválido para ficha de D&D.");
      }
    } catch (err) {
      alert("Erro ao ler o arquivo JSON: " + err.message);
    }
  };
  reader.readAsText(file);
}

/**
 * Persistência no LocalStorage.
 *
 * `forceSlot` é o que separa salvar de digitar: só os botões "Salvar Ficha"
 * criam uma entrada nova na lista de fichas salvas. Sem isso, cada tecla
 * digitada empurrava mais um rascunho sem nome para dentro de Salvos.
 * Uma ficha que já está na lista continua sendo atualizada a cada mudança —
 * quem já salvou não precisa salvar de novo a cada campo.
 *
 * "dnd55_active_character" é o cache da sessão: gravado a cada mudança, nunca
 * restaurado sozinho. Quem o traz de volta é o botão do cabeçalho.
 * Veja getCachedSession().
 */
function saveToLocalStorage(forceSlot = false) {
  try {
    localStorage.setItem("dnd55_active_character", JSON.stringify(character));
    // A partir da primeira edição o cache é o trabalho em andamento, não uma
    // sessão anterior — oferecer "restaurar" aqui só confundiria.
    hideSessionRestoreButton();

    const savedList = JSON.parse(localStorage.getItem("dnd55_saved_characters") || "[]");
    const existingIndex = savedList.findIndex(c => c.id === character.id);
    if (existingIndex >= 0) {
      savedList[existingIndex] = character;
    } else if (forceSlot) {
      savedList.push(character);
    } else {
      return;                       // rascunho ainda não salvo: não vira entrada
    }
    localStorage.setItem("dnd55_saved_characters", JSON.stringify(savedList));
  } catch (err) {
    console.error("Erro ao salvar no LocalStorage:", err);
  }
}

/**
 * Migração de fichas antigas: remove as escolhas que o app costumava pré-marcar
 * (magias e talento de origem embutidos no estado inicial) sem apagar escolhas reais.
 */
function migrateLegacyCharacter(parsed) {
  if (parsed && parsed.schemaVersion >= 2) return;

  const LEGACY_SPELLS = ["fire_bolt", "mage_hand", "minor_illusion", "magic_missile", "shield", "detect_magic"];
  const known = character.spellsKnown || [];
  const isLegacyPreset = known.length === LEGACY_SPELLS.length && LEGACY_SPELLS.every(id => known.includes(id));
  if (isLegacyPreset) character.spellsKnown = [];

  // Talentos de Origem passam a vir do antecedente, nunca da lista marcável.
  // Os personalizados não estão no catálogo e ficam.
  character.selectedFeats = (character.selectedFeats || []).filter(id => {
    if ((character.customFeats || []).some(cf => cf.id === id)) return true;
    const f = DND5E_DATA.feats.find(x => x.id === id);
    return f && f.type !== "origin";
  });

  character.schemaVersion = 2;
}

/**
 * A página abre sempre em branco, mas a sessão anterior não é jogada fora.
 *
 * O app restaurava "dnd55_active_character" sozinho no carregamento, e a ficha
 * de outra sessão reaparecia para quem só queria começar do zero. Agora ela
 * fica guardada e só volta se o jogador pedir, pelo botão que aparece no
 * cabeçalho quando há algo para restaurar.
 */
function getCachedSession() {
  try {
    const bruto = localStorage.getItem("dnd55_active_character");
    if (!bruto) return null;
    const dados = JSON.parse(bruto);
    // Uma ficha intocada não vale um botão: só conta se tiver algo preenchido.
    const temConteudo = (dados.name || "").trim() !== ""
      || (dados.class1 && dados.class1 !== "none")
      || (dados.species && dados.species !== "none")
      || (dados.spellsKnown || []).length > 0;
    return temConteudo ? dados : null;
  } catch (err) {
    console.error("Erro ao ler a sessão anterior:", err);
    return null;
  }
}

function hideSessionRestoreButton() {
  const btn = document.getElementById("btnRestoreSession");
  if (btn) btn.hidden = true;
}

/**
 * Mostra o botão de restaurar quando há sessão guardada. Só é chamado na
 * abertura da página: depois disso o cache já é a sessão atual.
 */
function refreshSessionRestoreButton() {
  const btn = document.getElementById("btnRestoreSession");
  if (!btn) return;
  const sessao = getCachedSession();
  if (!sessao) {
    btn.hidden = true;
    return;
  }
  const nome = (sessao.name || "").trim() || "sem nome";
  btn.hidden = false;
  btn.title = `Voltar para a ficha da sessão anterior (${nome})`;
  const rotulo = btn.querySelector(".restore-session-name");
  if (rotulo) rotulo.textContent = nome;
}

function restoreCachedSession() {
  const sessao = getCachedSession();
  if (!sessao) {
    showToast("Não há sessão anterior guardada neste navegador.");
    hideSessionRestoreButton();
    return;
  }
  applyLoadedCharacter(sessao);
  hideSessionRestoreButton();
  showToast(`↩️ Sessão anterior restaurada${sessao.name ? `: ${sessao.name}` : ""}.`);
}

function renderSavedCharsList() {
  const container = document.getElementById("savedCharsList");
  const savedList = JSON.parse(localStorage.getItem("dnd55_saved_characters") || "[]");

  if (!container) return;
  container.innerHTML = "";

  if (savedList.length === 0) {
    container.innerHTML = '<p style="color: #94a3b8; font-size: 0.85rem; text-align: center;">Nenhuma ficha salva no histórico local.</p>';
    return;
  }

  savedList.forEach(c => {
    const item = document.createElement("div");
    item.className = "info-selection-card";
    item.style.display = "flex";
    item.style.justifyContent = "space-between";
    item.style.alignItems = "center";
    item.innerHTML = `
      <div>
        <strong style="color: #f3e8ff;">${c.name}</strong>
        <p style="font-size: 0.78rem; color: #94a3b8;">${c.species} • ${c.class1} Nvl ${c.level1}</p>
      </div>
      <div style="display: flex; gap: 0.4rem;">
        <button class="btn btn-primary btn-sm btn-load-char" data-id="${c.id}">Carregar</button>
        <button class="btn btn-secondary btn-sm btn-del-char" data-id="${c.id}" style="color: #f87171;"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;

    item.querySelector(".btn-load-char").addEventListener("click", () => {
      applyLoadedCharacter(c);
      document.getElementById("manageCharsModal").classList.remove("active");
      showToast(`Ficha "${c.name}" carregada!`);
    });

    item.querySelector(".btn-del-char").addEventListener("click", () => {
      if (confirm(`Deseja excluir a ficha "${c.name}"?`)) {
        let list = JSON.parse(localStorage.getItem("dnd55_saved_characters") || "[]");
        list = list.filter(item => item.id !== c.id);
        localStorage.setItem("dnd55_saved_characters", JSON.stringify(list));
        renderSavedCharsList();
        showToast("Ficha excluída.");
      }
    });

    container.appendChild(item);
  });
}
