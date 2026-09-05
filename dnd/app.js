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
    background: "none",
    alignment: "",
    xp: "",
    heroicInspiration: false,

    // Idiomas
    languages: [],
    customLanguages: "",

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
    backgroundBonusMode: "+2/+1",
    backgroundBonuses: { primary: "none", secondary: "none", tertiary: "none" },

    // Subclasses & Talentos
    subclass1: "none",
    subclass2: "none",
    trainedSkills: [],
    expertSkills: [],
    selectedFeats: [],
    customFeats: [],
    customFeatures: [],

    // Escolhas exigidas por cada talento (atributo +1, magias, perícias, opções)
    featChoices: {},

    // Overrides da ficha oficial editável (campos digitados à mão pelo jogador)
    sheet: {},

    // Magias Conhecidas / Preparadas
    spellsKnown: [],
    spellSlotsExpended: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },

    // Equipamentos, Armaduras & Itens Customizados
    equippedArmor: "none",
    equippedShield: "none",
    weapons: [],
    customItems: [],
    customAttacks: [],
    inventory: "",
    coins: { po: 0, pp: 0, pe: 0, pc: 0, pl: 0 },

    // Vitals de Combate
    currentHp: 0,
    tempHp: 0,
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

// Inicialização ao carregar o DOM
document.addEventListener("DOMContentLoaded", () => {
  initUI();
  bindEvents();
  loadFromLocalStorage();
  syncWizardControls();
  populateDropdowns();
  recalculateCharacter();
  fitSheetToViewport();
  requestAnimationFrame(fitSheetToViewport);
  window.addEventListener("resize", fitSheetToViewport);
  window.addEventListener("orientationchange", () => setTimeout(fitSheetToViewport, 150));
});

/**
 * Inicializa a interface e preenche os seletores básicos
 */
function initUI() {
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

  // Preencher Armas (1, 2, 3)
  ["selectWeapon1", "selectWeapon2", "selectWeapon3"].forEach(id => {
    const el = document.getElementById(id);
    el.innerHTML = '<option value="none">Nenhuma Arma</option>';
    DND5E_DATA.weapons.forEach(w => {
      const opt = document.createElement("option");
      opt.value = w.id;
      opt.textContent = `${w.name} [${w.damage} ${w.damageType}] • Maestria: ${w.masteryName}`;
      el.appendChild(opt);
    });
  });

  renderAbilityInputs();
  renderSpellsCatalog();
  renderCustomItemsList();
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
  ["selectWeapon1", "selectWeapon2", "selectWeapon3"].forEach((id, i) => set(id, character.weapons[i] || "none"));
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
}

/* Objetos aninhados do personagem: precisam de merge chave a chave para uma
   ficha antiga (sem `customBg.name`, sem `featChoices`...) não chegar capenga */
const CHARACTER_NESTED_KEYS = ["customBg", "baseScores", "backgroundBonuses", "coins",
  "bio", "deathSaves", "spellSlotsExpended", "sheet", "featChoices"];

/** Ficha carregada de fora (JSON, localStorage, lista de salvos) sobre a base vazia */
function mergeIntoBlankCharacter(data) {
  const base = createBlankCharacter();
  const merged = { ...base, ...data };
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

function fitSheetToViewport() {
  const container = document.getElementById("sheetContainer");
  if (!container) return;
  const fit = sheetFitScale();
  if (fit === null && _sheetZoom === null) return;   // painel escondido
  const scale = _sheetZoom !== null ? _sheetZoom : fit;
  container.style.zoom = scale > 0 ? scale.toFixed(4) : 1;

  const label = document.getElementById("btnSheetZoomFit");
  if (label) label.textContent = _sheetZoom === null ? "Ajustar" : `${Math.round(scale * 100)}%`;
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
      
      let bonusSpellsHtml = "";
      if (curSub && curSub.bonusSpells && curSub.bonusSpells.length > 0) {
        const spellNames = curSub.bonusSpells.map(sid => {
          const sp = DND5E_DATA.spells.find(s => s.id === sid);
          return sp ? sp.name : sid;
        }).join(", ");
        bonusSpellsHtml = `<p style="margin-top: 0.3rem; font-size: 0.8rem; color: #fbbf24;"><strong>Magias Concedidas:</strong> ${spellNames}</p>`;
      }

      if (curSub) {
        subclass1Desc.innerHTML = `<h4><i class="fa-solid fa-khanda"></i> ${curSub.name}</h4><p>${curSub.desc}</p>${bonusSpellsHtml}`;
      }
    }
  }
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
  const speciesObj = DND5E_DATA.species.find(s => s.id === character.species);
  const bgObj = DND5E_DATA.backgrounds.find(b => b.id === character.background);

  // Antes das escolhas o resumo não tem o que mostrar — fica vazio, não velho.
  if (!container) return;
  if (!speciesObj || !bgObj) { container.innerHTML = ""; return; }

  let traitsHtml = speciesObj.traits.map(t => `<strong>${t.name}:</strong> ${t.desc}`).join("<br>");
  
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
  const classObj = DND5E_DATA.classes.find(c => c.id === character.class1) || EMPTY_CLASS;
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
function updateFeatsList() {
  const container = document.getElementById("featsContainer");
  if (!container) return;

  container.innerHTML = "";

  const originFeat = getOriginFeatObj();
  const bgObj = DND5E_DATA.backgrounds.find(b => b.id === character.background);

  // Talentos de Origem são concedidos pelo Antecedente, nunca marcados à mão.
  // Limpa qualquer resquício de antecedente anterior salvo no personagem.
  character.selectedFeats = character.selectedFeats.filter(id => {
    const f = DND5E_DATA.feats.find(x => x.id === id);
    return f && f.type !== "origin";
  });

  // ---------- 1. Talento de Origem concedido pelo Antecedente ----------
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
  `;
  container.appendChild(grantedSection);

  // ---------- 2. Demais talentos (lista + botão "i") ----------
  const selectable = DND5E_DATA.feats.filter(f => f.type !== "origin");
  const officialSection = document.createElement("div");
  officialSection.className = "feat-list-block";
  officialSection.innerHTML = `
    <h4 class="feat-block-title">Talentos Gerais, Estilos de Luta e Épicos (${selectable.length})</h4>
    <div class="feat-list">
      ${selectable.map(f => `
        <div class="feat-row${character.selectedFeats.includes(f.id) ? ' is-selected' : ''}" data-row="${f.id}">
          <input type="checkbox" class="feat-check" id="featChk_${f.id}" value="${f.id}" ${character.selectedFeats.includes(f.id) ? 'checked' : ''}>
          <label class="feat-row-name" for="featChk_${f.id}">${f.name}</label>
          <span class="feat-row-tag tag-${f.type}">${featTypeLabel(f.type)}</span>
          <button type="button" class="feat-info-btn" data-info="${f.id}" title="Mais informações"><i class="fa-solid fa-info"></i></button>
        </div>
        <div class="feat-info-panel" data-panel="${f.id}" hidden>${buildFeatInfoHtml(f)}</div>
        ${buildFeatChoiceBoxHtml(f, character.selectedFeats.includes(f.id))}
      `).join('')}
    </div>
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
          <div class="feat-row is-selected" data-row="${cf.id}">
            <span class="feat-row-lock" style="color: #fbbf24;"><i class="fa-solid fa-star"></i></span>
            <span class="feat-row-name">${cf.name}</span>
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
    container.addEventListener("click", (e) => {
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

      const feat = DND5E_DATA.feats.find(f => f.id === featId);
      if (value && feat) showToast(`✔ ${feat.name}: escolha aplicada na ficha.`);
    });
  }

  container.querySelectorAll(".feat-check").forEach(chk => {
    chk.addEventListener("change", (e) => {
      const fId = e.target.value;
      if (e.target.checked) {
        if (!character.selectedFeats.includes(fId)) character.selectedFeats.push(fId);
      } else {
        character.selectedFeats = character.selectedFeats.filter(f => f !== fId);
      }
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

/**
 * Escolhas que não dá para deduzir da descrição.
 * `grants` = magias fixas que o talento concede (vão direto para a ficha).
 * `spells` = magias que o jogador escolhe. `skills` / `expertise` = perícias.
 * `options` = listas fechadas (elemento, tipo de dano).
 */
const FEAT_EXTRA_CHOICES = {
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
  if (!feat) return { abilityOptions: [], spells: [], skills: [], options: [], grants: [], expertise: null, hasChoices: false };
  const extra = FEAT_EXTRA_CHOICES[feat.id] || {};
  const abilityOptions = extra.abilityOptions || parseFeatAbilityOptions(feat.desc);
  const spells = extra.spells || [];
  const skills = extra.skills || [];
  const options = extra.options || [];
  const grants = extra.grants || [];
  const expertise = extra.expertise || null;
  const hasStyleEffect = !!FIGHTING_STYLE_EFFECTS[feat.id];
  return {
    abilityOptions, spells, skills, options, grants, expertise, hasStyleEffect,
    hasChoices: !!(abilityOptions.length || spells.length || skills.length ||
                   options.length || grants.length || expertise || hasStyleEffect)
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

/** Talentos que estão realmente valendo: os marcados + o de Origem do antecedente */
function getActiveFeatIds() {
  const ids = (character.selectedFeats || []).slice();
  const origin = getOriginFeatId();
  if (origin && !ids.includes(origin)) ids.push(origin);
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
  Object.values(ch.options || {}).filter(Boolean).forEach(v => parts.push(v));

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
  });
  return bonus;
}

/**
 * Todas as magias concedidas sem passar pelo catálogo do Passo 4:
 * subclasse, espécie/linhagem e talentos (fixas e escolhidas).
 */
function getGrantedSpellEntries() {
  const out = [];
  const push = (id, source, name) => {
    if (!id) return;
    const found = out.find(e => e.id === id);
    if (found) { if (!found.source.includes(source)) found.source += `, ${source}`; return; }
    out.push({ id, source, name: name || spellDisplayName(id, name) });
  };

  const class1Obj = DND5E_DATA.classes.find(c => c.id === character.class1);
  const class2Obj = character.class2 !== "none" ? DND5E_DATA.classes.find(c => c.id === character.class2) : null;

  if (character.level1 >= 3 && class1Obj && class1Obj.subclasses) {
    const sub = class1Obj.subclasses.find(s => s.id === character.subclass1);
    if (sub && sub.bonusSpells) sub.bonusSpells.forEach(id => push(id, `Subclasse (${sub.name})`));
  }
  if (class2Obj && character.level2 >= 3 && class2Obj.subclasses) {
    const sub2 = class2Obj.subclasses.find(s => s.id === character.subclass2);
    if (sub2 && sub2.bonusSpells) sub2.bonusSpells.forEach(id => push(id, `Subclasse (${sub2.name})`));
  }

  if (character.species === "elf" && character.lineage === "high_elf") {
    if (character.level1 >= 3) push("misty_step", "Alto Elfo");
  } else if (character.species === "tiefling") {
    push("thaumaturgy", "Tiefling");
  } else if (character.species === "aasimar") {
    push("light", "Aasimar");
  } else if (character.species === "gnome" && character.lineage === "forest_gnome") {
    push("minor_illusion", "Gnomo da Floresta");
  }

  getActiveFeatIds().forEach(fid => {
    const feat = DND5E_DATA.feats.find(f => f.id === fid);
    if (!feat) return;
    const spec = getFeatChoiceSpec(feat);
    const names = FEAT_EXTRA_CHOICES[fid]?.grantNames || {};
    spec.grants.forEach(id => push(id, `Talento (${feat.name})`, names[id]));
    const ch = featChoicesFor(fid);
    spec.spells.forEach(slot => push(ch.spells[slot.key], `Talento (${feat.name})`));
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
  const class1Obj = DND5E_DATA.classes.find(c => c.id === character.class1);
  const class2Obj = character.class2 !== "none" ? DND5E_DATA.classes.find(c => c.id === character.class2) : null;
  const speciesObj = DND5E_DATA.species.find(s => s.id === character.species);
  const bgObj = DND5E_DATA.backgrounds.find(b => b.id === character.background);

  let maxCantrips = 0;
  let maxPrepared = 0;
  let grantedSpells = [];

  if (class1Obj && class1Obj.spellcasting) {
    const sc = class1Obj.spellcasting;
    maxCantrips += (sc.cantripsKnown ? sc.cantripsKnown[character.level1] || 0 : 0);
    
    if (sc.calcPrepared) {
      const mod = finalMods[sc.ability] || 0;
      maxPrepared += sc.calcPrepared(character.level1, mod);
    } else if (sc.preparedSpells) {
      maxPrepared += (sc.preparedSpells[character.level1] || 0);
    }
  }

  if (class2Obj && class2Obj.spellcasting) {
    const sc2 = class2Obj.spellcasting;
    maxCantrips += (sc2.cantripsKnown ? sc2.cantripsKnown[character.level2] || 0 : 0);
    if (sc2.calcPrepared) {
      const mod2 = finalMods[sc2.ability] || 0;
      maxPrepared += sc2.calcPrepared(character.level2, mod2);
    } else if (sc2.preparedSpells) {
      maxPrepared += (sc2.preparedSpells[character.level2] || 0);
    }
  }

  if (character.species === "elf" && character.lineage === "high_elf") maxCantrips += 1;

  // Subclasse, espécie e talentos são resolvidos num lugar só, o mesmo que
  // alimenta a tabela de magias da ficha.
  grantedSpells = getGrantedSpellEntries();

  const originFeatId = getOriginFeatId();
  if (originFeatId && originFeatId.startsWith("magic_initiate")) {
    maxCantrips += 2;
    maxPrepared += 1;
  }

  const currentCantripsCount = character.spellsKnown.filter(id => {
    const sp = DND5E_DATA.spells.find(s => s.id === id);
    return sp && sp.level === 0;
  }).length;

  const currentPreparedCount = character.spellsKnown.filter(id => {
    const sp = DND5E_DATA.spells.find(s => s.id === id);
    return sp && sp.level > 0;
  }).length;

  return {
    maxCantrips,
    currentCantripsCount,
    maxPrepared,
    currentPreparedCount,
    grantedSpells
  };
}

/**
 * Renderiza o catálogo de magias com filtros
 */
function renderSpellsCatalog() {
  const container = document.getElementById("spellsCatalogList");
  const filterClass = document.getElementById("spellFilterClass") ? document.getElementById("spellFilterClass").value : "all";
  const filterLevel = document.getElementById("spellFilterLevel") ? document.getElementById("spellFilterLevel").value : "all";
  const searchQuery = (document.getElementById("spellSearchInput") ? document.getElementById("spellSearchInput").value : "").toLowerCase().trim();

  if (!container) return;
  container.innerHTML = "";

  const filteredSpells = DND5E_DATA.spells.filter(sp => {
    const matchClass = filterClass === "all" || (sp.classes && sp.classes.includes(filterClass));
    const matchLevel = filterLevel === "all" || sp.level.toString() === filterLevel;
    const matchSearch = sp.name.toLowerCase().includes(searchQuery) || sp.desc.toLowerCase().includes(searchQuery);
    return matchClass && matchLevel && matchSearch;
  });

  if (filteredSpells.length === 0) {
    container.innerHTML = `<p class="spells-empty-msg">Nenhuma magia encontrada para os filtros selecionados.</p>`;
    return;
  }

  const table = document.createElement("table");
  table.className = "spells-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th class="col-name">Magia</th>
        <th class="col-level">Nível</th>
        <th class="col-classes">Classes</th>
        <th class="col-info">Info</th>
        <th class="col-action">Ficha</th>
      </tr>
    </thead>
    <tbody>
      ${filteredSpells.map(sp => {
        const isKnown = character.spellsKnown.includes(sp.id);
        return `
          <tr class="spell-row${isKnown ? ' is-known' : ''}" data-row="${sp.id}">
            <td class="col-name">${sp.name}</td>
            <td class="col-level">${formatSpellLevel(sp.level)}</td>
            <td class="col-classes">${formatSpellClasses(sp)}</td>
            <td class="col-info"><button type="button" class="spell-info-btn" data-info="${sp.id}" title="Detalhes da magia"><i class="fa-solid fa-info"></i></button></td>
            <td class="col-action">
              <button type="button" class="btn btn-sm ${isKnown ? 'btn-gold' : 'btn-secondary'} btn-toggle-spell" data-id="${sp.id}">
                <i class="fa-solid ${isKnown ? 'fa-check' : 'fa-plus'}"></i> ${isKnown ? 'Na ficha' : 'Adicionar'}
              </button>
            </td>
          </tr>
          <tr class="spell-info-row" data-panel="${sp.id}" hidden>
            <td colspan="5">${buildSpellInfoHtml(sp)}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
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

    const toggleBtn = e.target.closest(".btn-toggle-spell");
    if (toggleBtn) {
      const spId = toggleBtn.getAttribute("data-id");
      if (character.spellsKnown.includes(spId)) {
        character.spellsKnown = character.spellsKnown.filter(id => id !== spId);
      } else {
        character.spellsKnown.push(spId);
      }
      renderSpellsCatalog();
      recalculateCharacter();
    }
  });

  container.appendChild(table);
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
    return cls ? cls.name : c;
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

  const class1Obj = DND5E_DATA.classes.find(c => c.id === character.class1) || EMPTY_CLASS;
  const class2Obj = character.class2 !== "none" ? DND5E_DATA.classes.find(c => c.id === character.class2) : null;
  const speciesObj = DND5E_DATA.species.find(s => s.id === character.species) || EMPTY_SPECIES;
  const bgObj = DND5E_DATA.backgrounds.find(b => b.id === character.background) || EMPTY_BACKGROUND;

  // 1. Nível Total e Bônus de Proficiência (PB)
  const totalLevel = character.level1 + (class2Obj ? character.level2 : 0);
  const pb = Math.floor((totalLevel - 1) / 4) + 2;

  const displayTotalLevel = document.getElementById("displayTotalLevel");
  if (displayTotalLevel) displayTotalLevel.value = totalLevel;

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

    // Bônus de Talentos Customizados
    character.customFeats.forEach(cf => {
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
  }

  // 4. Pontos de Vida (HP)
  const conMod = finalMods["con"];
  let maxHp = class1Obj.hitDie + conMod;
  
  if (character.level1 > 1) {
    const avgDie1 = Math.floor(class1Obj.hitDie / 2) + 1;
    maxHp += (character.level1 - 1) * (avgDie1 + conMod);
  }

  if (class2Obj && character.level2 > 0) {
    const avgDie2 = Math.floor(class2Obj.hitDie / 2) + 1;
    maxHp += character.level2 * (avgDie2 + conMod);
  }

  if (character.species === "dwarf") maxHp += totalLevel;
  if (character.selectedFeats.includes("tough") || getOriginFeatId() === "tough") {
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
  if (character.selectedFeats.includes("alert") || getOriginFeatId() === "alert") {
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
  const { class1Obj, class2Obj, bgObj } = ctx;
  const armorProfs = [
    ...(class1Obj.armorProficiencies || []),
    ...(class2Obj ? class2Obj.armorProficiencies || [] : [])
  ].join(" ").toLowerCase();

  syncOfCheck("sheetArmorLight", armorProfs.includes("leve"), "armorLight");
  syncOfCheck("sheetArmorMedium", armorProfs.includes("média") || armorProfs.includes("media"), "armorMedium");
  syncOfCheck("sheetArmorHeavy", armorProfs.includes("pesada"), "armorHeavy");
  syncOfCheck("sheetArmorShields", armorProfs.includes("escudo"), "armorShields");

  const weaponAuto = [
    ...(class1Obj.weaponProficiencies || []),
    ...(class2Obj ? class2Obj.weaponProficiencies || [] : [])
  ].join(", ");
  syncOfField("sheetWeaponProfs", weaponAuto, "weaponProfs");

  const toolAuto = [
    ...(class1Obj.toolProficiencies || []),
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
    const isFinesse = weaponHasProp(w, "Acuidade");
    const atkAbility = isRangedWeapon(w) || (isFinesse && dexMod > finalMods["str"]) ? "dex" : "str";
    const style = getWeaponStyleMods(w);
    const atkMod = finalMods[atkAbility] + pb + style.atk;
    const dmgMod = finalMods[atkAbility] + style.dmg;
    auto.push({
      srcId: "weapon:" + w.id,
      name: w.name,
      atk: `${atkMod >= 0 ? '+' : ''}${atkMod}`,
      damage: `${w.damage}${dmgMod !== 0 ? (dmgMod > 0 ? ' +' + dmgMod : ' ' + dmgMod) : ''} ${w.damageType}`,
      notes: [`Maestria: ${w.masteryName}`, ...style.notes].join(" • ")
    });
  });

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

  // Insere as novas, atualiza as que o jogador não editou, remove as que saíram
  auto.forEach(a => {
    const existing = ov.weaponRows.find(r => r.srcId === a.srcId);
    if (!existing) {
      ov.weaponRows.push({ uid: newRowUid(), edited: false, ...a });
    } else if (!existing.edited) {
      Object.assign(existing, a);
    }
  });
  const autoIds = auto.map(a => a.srcId);
  ov.weaponRows = ov.weaponRows.filter(r => !r.srcId || autoIds.includes(r.srcId));

  padSheetRows(ov.weaponRows, OF_WEAPON_MIN_ROWS, () => ({ uid: newRowUid(), name: "", atk: "", damage: "", notes: "" }));
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
function renderOfFeatureAreas(ctx) {
  const { class1Obj, class2Obj, speciesObj } = ctx;

  const classFeatures = [];
  for (let l = 1; l <= character.level1; l++) {
    if (class1Obj.featuresByLevel && class1Obj.featuresByLevel[l]) {
      class1Obj.featuresByLevel[l].forEach(f => classFeatures.push(`[Nvl ${l}] ${f}`));
    }
  }
  if (class2Obj) {
    for (let l = 1; l <= character.level2; l++) {
      if (class2Obj.featuresByLevel && class2Obj.featuresByLevel[l]) {
        class2Obj.featuresByLevel[l].forEach(f => classFeatures.push(`[${class2Obj.name} ${l}] ${f}`));
      }
    }
  }
  const subObj = class1Obj.subclasses ? class1Obj.subclasses.find(s => s.id === character.subclass1) : null;
  if (character.level1 >= 3 && subObj) classFeatures.push(`Subclasse — ${subObj.name}: ${subObj.desc}`);
  character.customFeatures.forEach(cf => classFeatures.push(`${cf.title}: ${cf.desc}`));

  const half = Math.ceil(classFeatures.length / 2);
  syncOfField("sheetClassFeatures", classFeatures.slice(0, half).join("\n"), "classFeatures");
  syncOfField("sheetClassFeatures2", classFeatures.slice(half).join("\n"), "classFeatures2");

  const traits = (speciesObj.traits || []).map(t => `${t.name}: ${t.desc}`).join("\n");
  syncOfField("sheetSpeciesTraits", traits, "speciesTraits");

  const featLines = [];
  const originFeat = getOriginFeatObj();
  if (originFeat) featLines.push(`[Origem] ${originFeat.name}: ${originFeat.desc}${describeFeatChoices(originFeat)}`);
  character.selectedFeats.forEach(fId => {
    const f = DND5E_DATA.feats.find(x => x.id === fId);
    if (f) featLines.push(`${f.name}: ${f.desc}${describeFeatChoices(f)}`);
  });
  character.customFeats.forEach(cf => featLines.push(`[Custom] ${cf.name}: ${cf.desc}`));
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
  const table = DND5E_DATA.spellSlotsTable[type] || DND5E_DATA.spellSlotsTable.full;
  const slotsRow = (table && table[totalLevel]) || [0, 0, 0, 0, 0, 0, 0, 0, 0];

  const ov = sheetOv();
  if (!ov.slots || typeof ov.slots !== "object") ov.slots = {};

  grid.innerHTML = "";
  for (let lvl = 1; lvl <= 9; lvl++) {
    const auto = slotsRow[lvl - 1] || 0;
    const st = ov.slots[lvl] || {};
    const total = st.total !== undefined && st.total !== null ? st.total : auto;
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
    r: /Ritual/i.test(sp.desc) || /Ritual/i.test(sp.time),
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
  character.customFeats.forEach(cf => { if (cf.abilityBonus === abId) score += 1; });
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

  // Navegação das Páginas da Ficha
  const pageTabs = document.querySelectorAll(".page-tab-btn");
  pageTabs.forEach(btn => {
    btn.addEventListener("click", () => {
      pageTabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const page = btn.getAttribute("data-page");
      document.querySelectorAll(".sheet-page").forEach(p => p.classList.remove("active-page"));
      document.getElementById(`sheetPage${page}`).classList.add("active-page");
    });
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
    updateSubclassesDropdown();
    updateSkillsSelector();
    renderSpellsCatalog();
    recalculateCharacter();
  });

  document.getElementById("selectLevel1").addEventListener("change", (e) => {
    character.level1 = parseInt(e.target.value);
    updateSubclassesDropdown();
    renderSpellsCatalog();
    recalculateCharacter();
  });

  document.getElementById("selectMulticlass").addEventListener("change", (e) => {
    character.class2 = e.target.value;
    const row = document.getElementById("multiclassLevelRow");
    row.style.display = character.class2 !== "none" ? "grid" : "none";
    renderSpellsCatalog();
    recalculateCharacter();
  });

  document.getElementById("selectLevel2").addEventListener("change", (e) => {
    character.level2 = parseInt(e.target.value);
    renderSpellsCatalog();
    recalculateCharacter();
  });

  document.getElementById("selectSpecies").addEventListener("change", (e) => {
    character.species = e.target.value;
    updateLineagesDropdown();
    recalculateCharacter();
  });

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
    updateFeatsList();
    recalculateCharacter();
  });

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
      let bonusSpellsHtml = "";
      if (subObj.bonusSpells && subObj.bonusSpells.length > 0) {
        const spellNames = subObj.bonusSpells.map(sid => {
          const sp = DND5E_DATA.spells.find(s => s.id === sid);
          return sp ? sp.name : sid;
        }).join(", ");
        bonusSpellsHtml = `<p style="margin-top: 0.3rem; font-size: 0.8rem; color: #fbbf24;"><strong>Magias Concedidas:</strong> ${spellNames}</p>`;
      }
      document.getElementById("subclass1Desc").innerHTML = `<h4><i class="fa-solid fa-khanda"></i> ${subObj.name}</h4><p>${subObj.desc}</p>${bonusSpellsHtml}`;
    }
    recalculateCharacter();
  });

  // Filtros de Magias (Passo 4)
  const spellFilterClass = document.getElementById("spellFilterClass");
  if (spellFilterClass) spellFilterClass.addEventListener("change", renderSpellsCatalog);

  const spellFilterLevel = document.getElementById("spellFilterLevel");
  if (spellFilterLevel) spellFilterLevel.addEventListener("change", renderSpellsCatalog);

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

  document.getElementById("selectWeapon1").addEventListener("change", (e) => {
    character.weapons[0] = e.target.value;
    recalculateCharacter();
  });
  document.getElementById("selectWeapon2").addEventListener("change", (e) => {
    character.weapons[1] = e.target.value;
    recalculateCharacter();
  });
  document.getElementById("selectWeapon3").addEventListener("change", (e) => {
    character.weapons[2] = e.target.value;
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
  document.getElementById("btnExportJson").addEventListener("click", exportCharacterJson);
  document.getElementById("inputImportJson").addEventListener("change", importCharacterJson);
  document.getElementById("btnPrintSheet").addEventListener("click", () => window.print());
  document.getElementById("btnQuickRollD20").addEventListener("click", () => rollDiceCheck("D20 Rápido", 0));
  
  const btnGlobalRoll = document.getElementById("btnGlobalRollD20");
  if (btnGlobalRoll) btnGlobalRoll.addEventListener("click", () => rollDiceCheck("D20 Rápido", 0));
  
  const btnQuickSave = document.getElementById("btnQuickSave");
  if (btnQuickSave) btnQuickSave.addEventListener("click", () => {
    saveToLocalStorage(true);
    showToast("💾 Ficha salva com sucesso!");
  });

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
      character.customFeats.push({
        id: "custom_" + Date.now(),
        name,
        type,
        abilityBonus,
        desc
      });
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
function exportCharacterJson() {
  const jsonStr = JSON.stringify(character, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${character.name.replace(/\s+/g, '_')}_DND55.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("💾 Arquivo JSON exportado com sucesso!");
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
 * Persistência no LocalStorage
 */
function saveToLocalStorage(forceSlot = false) {
  try {
    localStorage.setItem("dnd55_active_character", JSON.stringify(character));
    
    let savedList = JSON.parse(localStorage.getItem("dnd55_saved_characters") || "[]");
    const existingIndex = savedList.findIndex(c => c.id === character.id);
    if (existingIndex >= 0) {
      savedList[existingIndex] = character;
    } else {
      savedList.push(character);
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

  // Talentos de Origem passam a vir do antecedente, nunca da lista marcável
  character.selectedFeats = (character.selectedFeats || []).filter(id => {
    const f = DND5E_DATA.feats.find(x => x.id === id);
    return f && f.type !== "origin";
  });

  character.schemaVersion = 2;
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem("dnd55_active_character");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Só o estado: quem repinta a tela é a sequência do DOMContentLoaded logo
      // abaixo (syncWizardControls + populateDropdowns + recalculateCharacter).
      character = mergeIntoBlankCharacter(parsed);
      migrateLegacyCharacter(parsed);
    }
  } catch (err) {
    console.error("Erro ao carregar do LocalStorage:", err);
  }
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
