# Modificações — Criador & Ficha de D&D 5.5 (2024)

Documento de referência das mudanças feitas no projeto e de como o código funciona
depois delas. Escrito para quem for mexer no projeto daqui pra frente.

- **Data:** 04/09/2026 (rodadas 1 e 2) · 05/09/2026 (rodadas 3 a 7)
- **Arquivos alterados:** `app.js`, `index.html`, `sheet.css`, `style.css`
- **Arquivos novos (rodada 6):** `pdf-export.js`, `bio-random.js`, `pdf-lib.min.js` (biblioteca)
- **Arquivo não alterado:** `data.js` (base de dados de classes, espécies, antecedentes, perícias, talentos, magias, armas, ferramentas — só é lida)
- **Backups do estado anterior:** `app.js.bak`, `index.html.bak`, `sheet.css.bak`, `style.css.bak`

O trabalho aconteceu em cinco rodadas: a **Rodada 1** corrigiu os cinco defeitos
funcionais do criador; a **Rodada 2** reescreveu a ficha inteira para o padrão do
PDF oficial e tornou todos os campos editáveis; a **Rodada 3** ajustou a
nomenclatura do Passo 4; a **Rodada 4** deu escolhas reais aos talentos e fez os
Estilos de Luta mexerem nos números da arma e da armadura; a **Rodada 5** deu
nome próprio ao antecedente personalizado e levou esse nome até a ficha; a
**Rodada 6** passou a exportar a ficha para o PDF oficial editável, fez o app
abrir com tudo em branco e colocou um dado de sorteio em cada campo da
biografia; a **Rodada 7** adaptou a página inteira ao celular, no modelo
*mobile first*.

---

## Sumário

1. [Visão geral da arquitetura](#1-visão-geral-da-arquitetura)
2. [Rodada 1 — correções no criador](#2-rodada-1--correções-no-criador)
3. [Rodada 2 — ficha oficial de 2 páginas](#3-rodada-2--ficha-oficial-de-2-páginas)
4. [Rodada 3 — ajustes de nomenclatura](#4-rodada-3--ajustes-de-nomenclatura)
5. [Rodada 4 — escolhas de talento e estilos de luta](#5-rodada-4--escolhas-de-talento-e-estilos-de-luta)
6. [Rodada 5 — antecedente personalizado com nome](#6-rodada-5--antecedente-personalizado-com-nome)
7. [Rodada 6 — PDF oficial, ficha em branco e dados da biografia](#7-rodada-6--pdf-oficial-ficha-em-branco-e-dados-da-biografia)
8. [Rodada 7 — adaptação para celular (mobile first)](#8-rodada-7--adaptação-para-celular-mobile-first)
9. [Como o código da ficha funciona](#9-como-o-código-da-ficha-funciona)
10. [Referência: chaves de `character.sheet`](#10-referência-chaves-de-charactersheet)
11. [Impressão e escala](#11-impressão-e-escala)
12. [Persistência e migração](#12-persistência-e-migração)
13. [Pontos em aberto](#13-pontos-em-aberto)

---

## 1. Visão geral da arquitetura

O app é HTML/CSS/JS puro, sem build e sem framework. São quatro arquivos de código:

| Arquivo | Papel |
|---|---|
| `data.js` | Banco de dados estático (`DND5E_DATA`): classes, subclasses, espécies, linhagens, antecedentes, perícias, talentos, magias, armas, armaduras, ferramentas, tabela de espaços de magia. Nunca é escrito. |
| `app.js` | Todo o comportamento: estado, recálculo, renderização do criador e da ficha, eventos, persistência. |
| `index.html` | Marcação do assistente de criação (esquerda) e das duas páginas da ficha (direita). |
| `style.css` / `sheet.css` | Estilo do app / estilo da ficha impressa, respectivamente. |
| `pdf-export.js` | Transferência da ficha para o PDF oficial editável (Rodada 6). |
| `bio-random.js` | Tabelas e sorteio dos campos da Biografia (Rodada 6). |
| `pdf-lib.min.js` | Biblioteca de manipulação de PDF, servida do próprio diretório. |

### O objeto `character`

Existe **uma única fonte de verdade**: o objeto global `character` (`app.js:8`).
Tudo o que o jogador escolhe mora nele, e ele é serializado inteiro para o
localStorage. Campos principais:

A partir da Rodada 6 o estado inicial vem de `createBlankCharacter()`
(`app.js:16`) — os campos abaixo nascem **vazios**, e o objeto só ganha conteúdo
conforme o jogador preenche:

```js
let character = createBlankCharacter();   // devolve o objeto abaixo, em branco

{
  id, schemaVersion: 2, appMode,          // identidade e versão do formato
  name, playerName, class1, level1,        // identidade do personagem
  class2, level2, species, lineage,
  background, alignment, xp,
  languages, customLanguages,              // idiomas
  customBg: { name, feat, skill1, ... },   // antecedente personalizado (name: Rodada 5)
  abilityMode, baseScores,                 // atributos antes de bônus
  backgroundBonusMode, backgroundBonuses,
  subclass1, subclass2,
  trainedSkills, expertSkills,
  selectedFeats, customFeats, customFeatures,
  featChoices: {},                         // ← escolhas dentro de cada talento (Rodada 4)
  sheet: {},                               // ← overrides digitados na ficha (Rodada 2)
  spellsKnown, spellSlotsExpended,
  equippedArmor, equippedShield, weapons,
  customItems, customAttacks, inventory, coins,
  currentHp, tempHp, deathSaves,
  bio: { ... }
};
```

### O ciclo de vida

```
DOMContentLoaded
  ├─ initUI()               monta os selects de classe/nível
  ├─ bindEvents()           liga todos os listeners do criador (uma vez)
  ├─ loadFromLocalStorage() traz o personagem salvo + migrateLegacyCharacter()
  ├─ syncWizardControls()   joga o estado carregado de volta nos controles
  ├─ populateDropdowns()    monta selects dependentes (linhagem, subclasse, ...)
  ├─ recalculateCharacter() recalcula tudo e repinta criador + ficha
  └─ fitSheetToViewport()   escala a folha A4 para caber no painel
```

`recalculateCharacter()` (`app.js:1992`) é o coração: deriva **tudo** que não é
escolha direta do jogador (nível total, bônus de proficiência, atributos finais,
modificadores, CA, PV, iniciativa, deslocamento, perícias treinadas, percepções
passivas, CD e bônus de ataque mágico) e passa esse pacote — o objeto `ctx` — para
`renderOfficialSheet(ctx)`. Nenhuma função de render recalcula regra: elas só
desenham o que veio no `ctx`.

---

## 2. Rodada 1 — correções no criador

### 2.1 Subclasse não era selecionável

**Sintoma:** escolher a subclasse era impossível; o campo aparecia desabilitado
mesmo em nível 5+, e a escolha salva sumia ao recarregar.

**Causa:** a ordem de inicialização era `populateDropdowns()` → `loadFromLocalStorage()`.
O dropdown de subclasse era montado com o nível padrão (1), portanto vinha
`disabled`, e `character.subclass1` era zerado para `"none"`. O nível 5 vindo do
storage chegava depois — tarde demais.

**Correção:** a ordem virou `loadFromLocalStorage()` → `syncWizardControls()` →
`populateDropdowns()` → `recalculateCharacter()`, e foi removida a linha que
apagava `character.subclass1` quando o nível era menor que 3. `setWizardStep()`
revalida os dropdowns ao entrar nos passos 3 e 4, e a linhagem salva é preservada
por `updateLineagesDropdown()` (`app.js:412`).

### 2.2 "Iniciado em Magia (Mago)" vinha sempre marcado

**Causa:** o talento estava fixo no estado inicial (`selectedFeats: ["magic_initiate_wizard"]`).

**Correção:** o talento de **Origem** deixou de ser marcável e passou a ser
*derivado do antecedente*:

- `getOriginFeatId()` (`app.js:689`) lê `bgObj.feat`, ou `character.customBg.feat`
  quando o antecedente é personalizado.
- `getOriginFeatObj()` (`app.js:698`) resolve o objeto do talento em `DND5E_DATA.feats`.
- Em `updateFeatsList()` (`app.js:1087`) ele aparece no topo, numa linha travada
  com cadeado 🔒, e todo talento de `type === "origin"` é filtrado da lista de
  marcáveis — inclusive resquícios de um antecedente escolhido antes.

**Bug adicional descoberto no caminho:** o painel de *Antecedente Personalizado*
não tinha **nenhum** listener — mexer nos selects não fazia nada. Foram ligados
todos (talento, perícias, ferramenta com opção "Outra/Personalizada", modo de
bônus +2/+1 vs +1/+1/+1, atributos e idiomas), e `initCustomBackgroundPanel()`
(`app.js:508`) passou a popular e sincronizar o painel inteiro a partir do estado.

### 2.3 Talentos: de cards para lista com botão "i"

`updateFeatsList()` foi reescrita. Cada talento virou uma linha compacta —
`checkbox · nome · tag de tipo · botão i` — com um painel de detalhes que abre
logo abaixo (`buildFeatInfoHtml()`, `app.js:1717`). São três blocos: **Origem**
(travado), **Gerais / Estilos de Luta / Épicos** (marcáveis), e **Personalizados**
(com botão de excluir).

Detalhe de implementação que vale notar: os cliques em "i" e em excluir usam
**uma única delegação no container**, presa uma vez só via
`container.dataset.delegateBound` — a lista é reconstruída a cada recálculo, e sem
isso os listeners se acumulariam a cada repintura.

### 2.4 e 2.5 Magias: catálogo em tabela e nada pré-selecionado

- `spellsKnown` passou a começar **vazio**.
- `renderSpellsCatalog()` (`app.js:1869`) virou uma tabela com as colunas
  **Magia | Nível | Classes | Info | Ficha**. O "i" abre uma linha de detalhes
  (escola, tempo de conjuração, alcance, componentes, duração, classes e texto)
  via `buildSpellInfoHtml()`; o botão da coluna "Ficha" alterna a magia entre
  conhecida e não conhecida, e a linha ganha destaque quando está na ficha.
- Os filtros de classe, nível e busca textual continuam funcionando sobre
  `DND5E_DATA.spells`.
- `getSpellCapacityInfo()` (`app.js:1802`) calcula quantos truques e magias
  preparadas o personagem comporta, somando classe, multiclasse, subclasse,
  espécie/linhagem (Alto Elfo, Tiefling, Aasimar, Gnomo da Floresta) e o talento
  Iniciado em Magia.

---

## 3. Rodada 2 — ficha oficial de 2 páginas

A ficha antiga tinha 3 páginas, layout próprio, e vários blocos eram texto morto —
**Talentos** e as linhas de **magia** não podiam ser editados.

O layout do `D&D 5.5 - Ficha editável.pdf` foi extraído com pdfjs (posições dos
420 campos e dos rótulos, página de 603×774pt) e a ficha foi reconstruída em cima
dele.

### Página 1 — Personagem & Combate

- **Cabeçalho:** Nome do Personagem, Origem, Classe, Nível, Espécie, Subclasse,
  EXP e Jogador.
- **Bloco de combate (direita do cabeçalho):** Classe de Armadura com checkbox de
  Escudo; Pontos de Vida (Atual / Temp / Máx); Dado de Vida (Gasto / Máx);
  Teste de Resistência de Morte.
- **Atributos:** os seis em duas colunas, no formato 2024 — **cada bloco contém o
  próprio Valor, Modificador, a Salvaguarda e as perícias daquele atributo**.
- **Inspiração Heroica** e a faixa **Iniciativa / Velocidade / Tamanho /
  Percepção Passiva**.
- **Armas & Truques de Dano** em tabela (Nome · Ataque · Dano · Anotações).
- **Características de Classe** em duas colunas, **Características Raciais** e
  **Talentos** lado a lado.
- **Equipamento, Treino & Proficiências** ancorado no rodapé da coluna
  (`#sheetPage1 .of-prof-box { margin-top: auto; }`), como no PDF.

### Página 2 — Magias & História

- Bloco de conjuração: atributo, modificador, CD e bônus de ataque.
- **Espaços de Magia** nos 9 círculos, com total editável e as bolinhas de gastos
  no número exato do PDF (`OF_SLOT_BOXES = {1:4, 2:3, 3:3, 4:3, 5:3, 6:2, 7:2, 8:1, 9:1}`).
- **Truques & Magias Preparadas** com as colunas exatas do PDF:
  **Nível · Nome · Tempo de Conjuração · Alcance · C R M · Anotações**
  (C = Concentração, R = Ritual, M = componente Material).
- Coluna lateral: Aparência, História & Personalidade, Alinhamento, Idiomas,
  Equipamento, Sintonização de Item Mágico (3 linhas) e Moedas (PC/PP/PE/PO/PL).

### Editabilidade total

Todo campo virou um `<input>` ou `<textarea>` real — inclusive Talentos e as
linhas de magia. Além disso ficaram interativos direto na ficha:

| Interação | Efeito |
|---|---|
| Clique na bolinha da perícia | cicla nenhum → proficiente → especialista |
| Clique na bolinha da salvaguarda | alterna proficiência |
| Editar Valor ou Modificador de atributo | ajusta `baseScores` e recalcula CA, PV, perícias… |
| Clique no nome/bônus de perícia ou salvaguarda | rola o teste |
| Dado 🎲 na linha da arma | rola ataque e dano |
| Bolinhas dos espaços de magia | marcam espaços gastos |
| Botão `+` nas tabelas | adiciona linha em branco |
| Botão `✕` na linha | limpa a linha (ou remove a magia da ficha) |
| Clique na Inspiração Heroica | alterna o estado |
| Duplo clique na Iniciativa | rola iniciativa |

### Dois bugs corrigidos no caminho

1. **Selects do criador dessincronizados:** mostravam sempre o primeiro item
   ("Bárbaro", "Personalizado") enquanto o personagem carregado era outro.
   Resolvido por `syncWizardControls()` (`app.js:279`), que reescreve todos os
   controles a partir do `character` logo depois do carregamento.
2. **Ficha estourando a largura da janela**, cortando o lado direito. Resolvido
   por `fitSheetToViewport()` (`app.js:374`) — ver [seção 11](#11-impressão-e-escala).

---

## 4. Rodada 3 — ajustes de nomenclatura

### 4.1 Passo 4 renomeado para "Magias"

O passo 4 se chamava **"Magias & Grimório"** na aba e **"4. Magias & Grimório Arcano"**
no título da seção. "Grimório" é um item de mago — o passo serve a todas as classes
conjuradoras, então os dois rótulos passaram a ser apenas **"Magias"**
(`index.html:106` e `index.html:397`, mais o comentário de bloco correspondente).

Nada de comportamento mudou: o `data-step="4"` e o `id="step4"` continuam iguais,
e nenhum seletor de `app.js` dependia desses textos. As menções restantes a
"Grimório Arcano" em `app.js` são o item de inventário padrão do mago-exemplo
(`app.js:79`) e o comentário de cabeçalho do arquivo — ambos permanecem.

---

## 5. Rodada 4 — escolhas de talento e estilos de luta

Três lacunas do Passo 3 foram fechadas: o que a subclasse e os talentos concediam
não chegava à ficha; os Estilos de Luta eram texto decorativo, sem efeito nos
números; e talentos que exigem escolha (o +1 de atributo, magias, perícias) não
tinham onde escolher.

Todo o código novo está no bloco `ESCOLHAS DE TALENTO, ESTILOS DE LUTA E
CONCESSÕES AUTOMÁTICAS` do `app.js`.

### 5.1 Magias e habilidades do Passo 3 vão para a ficha

Antes, `getSpellCapacityInfo()` até calculava as magias concedidas pela subclasse
e pela espécie, mas o resultado só alimentava o contador do Passo 4 — a tabela de
magias da ficha lia exclusivamente `character.spellsKnown`. Magia de subclasse,
de linhagem ou de talento simplesmente não existia na ficha.

`getGrantedSpellEntries()` passou a ser a fonte única dessas concessões,
reunindo em uma lista `{ id, source, name }`:

- **subclasse** — `bonusSpells` da subclasse primária (nível 3+) e da subclasse
  da multiclasse;
- **espécie / linhagem** — Alto Elfo, Tiefling, Aasimar, Gnomo da Floresta;
- **talentos** — as magias fixas (`grants`) e as que o jogador escolheu na caixa.

`syncSheetSpellRows()` agora reconcilia essas entradas junto com as magias do
catálogo, e o filtro de remoção passou a preservá-las:

```js
ov.spellRows = ov.spellRows.filter(r =>
  !r.spellId || character.spellsKnown.includes(r.spellId) || grantedIds.includes(r.spellId));
```

Cada linha concedida carrega `grantSrc` e ganha o comentário de origem na coluna
de anotações, via `withGrantNote()` — *"Concedida: Talento (Tocado pelo Reino
Feérico)"*. Se o jogador editar a linha (`edited`), o comentário deixa de ser
reescrito. O `✕` numa linha concedida recusa a remoção e explica onde desfazê-la,
igual ao que já acontecia com armas vindas do criador.

`getSpellCapacityInfo()` foi reescrita para consumir a mesma função, então o
contador do Passo 4 e a ficha nunca mais divergem.

As **habilidades** já chegavam à ficha e continuam chegando: características de
subclasse e personalizadas em `sheetClassFeatures`, talentos em `sheetFeatsText`.
O que mudou é que agora vão acompanhadas do comentário do que a escolha aplicou
(ver 5.3).

### 5.2 Estilos de Luta mudam arma e armadura

Cada estilo passou a ter um efeito declarado em `FIGHTING_STYLE_EFFECTS`:

```js
fighting_style_archery: { applies: "ranged", atk: 2, note: "Arqueirismo: +2 no ataque à distância" },
fighting_style_dueling: { applies: "melee_one_hand", dmg: 2, note: "Duelismo: +2 no dano (uma mão, sem outra arma)" },
fighting_style_defense: { applies: "armor", ac: 1, note: "Defesa: +1 na CA usando armadura" },
// ...
```

`styleAppliesToWeapon()` decide quais armas recebem o efeito lendo o campo `type`
e o array `properties` do `data.js` — `"Distância"`, `"Duas Mãos"`, `"Arremesso"`,
`"Leve"`, `"Acuidade"`. `getWeaponStyleMods(w)` devolve `{ atk, dmg, notes }` e
`syncSheetWeaponRows()` soma isso no cálculo da linha:

```js
const atkMod = finalMods[atkAbility] + pb + style.atk;
const dmgMod = finalMods[atkAbility] + style.dmg;
notes: [`Maestria: ${w.masteryName}`, ...style.notes].join(" • ")
```

O número muda e o **comentário aparece na própria linha da arma**, ao lado da
maestria. Na armadura, `getArmorStyleMods()` devolve o `+1` de Defesa (só com
armadura equipada) e `recalculateCharacter()` o soma à CA.

Além disso, o Passo 5 ganhou o painel `#styleEffectsPanel`
(`renderStyleEffectsPanel()`), que explica em texto o que cada estilo ativo fez —
*"Arco Longo: ataque +2 · Arqueirismo: +2 no ataque à distância"*, *"Cota de
Malha: CA 16 → 17 · Defesa: +1 na CA usando armadura"* — e avisa quando o estilo
não tem como valer (*"o estilo Defesa só vale usando armadura"*). Estilos sem
efeito numérico (Luta Cega, Proteção, Interceptação) são listados como anotação.

**Bug corrigido no caminho:** `syncSheetWeaponRows()` comparava `w.type` com
`"melee"` e `"ranged"`, mas o `data.js` usa `"Corpo a Corpo"` e `"Distância"` —
ou seja, *toda* arma à distância estava calculando ataque e dano com Força. E a
Acuidade era detectada por um regex no nome da arma (`/Adaga|Rapieira|.../`) em
vez da propriedade. Agora ambos usam os dados: `isRangedWeapon(w)` e
`weaponHasProp(w, "Acuidade")`. Sem isso o Arqueirismo somaria +2 sobre um ataque
já errado.

### 5.3 Caixa de escolhas dentro do talento

Cada talento agora declara o que pede ao jogador, via `getFeatChoiceSpec(feat)`:

- **Atributo (+1)** — deduzido da própria descrição por
  `parseFeatAbilityOptions()`, que lê a primeira frase e coleta as abreviações:
  `"+1 em CAR"` → CAR; `"+1 em FOR ou DES"` → as duas; `"+1 no atributo escolhido
  (FOR, DES, CON, INT, SAB ou CAR)"` e `"+1 em um atributo"` → as seis. Cobre os
  33 talentos gerais e os 10 dons épicos sem precisar de tabela manual.
- **Magias, perícias e opções fechadas** — em `FEAT_EXTRA_CHOICES`, porque não dá
  para deduzir do texto: as três escolhas dos *Iniciado em Magia*, a magia de 1º
  círculo de *Tocado pelo Reino Feérico* (Adivinhação/Encantamento) e de *Tocado
  pelas Sombras* (Ilusão/Necromancia), o truque do *Franco-Atirador Arcano*, os
  dois rituais do *Conjurador de Rituais*, as 3 perícias do *Habilidoso*, a
  perícia + especialização do *Especialista em Perícias*, o elemento do
  *Conjurador Elemental* e as duas resistências do dom *Resistência a Energia*.
  O campo `grants` lista as magias fixas (Passo Sombrio, Invisibilidade, Mãos
  Mágicas…) que vão direto para a ficha sem escolha.

`buildFeatChoiceBoxHtml()` desenha a caixa logo abaixo da linha do talento. Ela
**fica sempre no DOM**, apenas com o atributo `hidden` quando o talento está
desmarcado — assim marcar a caixa é um `box.hidden = false`, sem reconstruir a
lista inteira e perder o foco do que estava sendo editado.

As escolhas vivem em `character.featChoices`:

```js
character.featChoices = {
  fey_touched: { ability: "int", spells: { s1: "shield" }, skills: {}, options: {} }
};
```

E são aplicadas em quatro pontos:

| Escolha | Onde entra |
|---|---|
| Atributo | `getFeatAbilityBonus(abId)` soma +1 no laço de atributos de `recalculateCharacter()` — sem tocar em `baseScores`, então é derivado e reversível |
| Magias | `getGrantedSpellEntries()` → tabela de magias da ficha |
| Perícias / Especialização | `getFeatGrantedSkills()` entra em `allTrainedSkills` e no novo `allExpertSkills`, que a ficha passou a consumir pelo `ctx` em vez de ler `character.expertSkills` direto |
| Todas | `describeFeatChoices(feat)` acrescenta ao talento, na ficha, um comentário `[aplicado — +1 em INT; magias: Escudo; Defesa: +1 na CA usando armadura]` |

Só valem as escolhas de talentos ativos: `getActiveFeatIds()` = os marcados mais
o de Origem do antecedente. Desmarcar um talento remove o efeito na hora, mas as
escolhas ficam guardadas — remarcá-lo traz tudo de volta.

Estilos de Luta não pedem escolha nenhuma, mas também ganham caixa: ela mostra o
efeito que está sendo aplicado na ficha, para o jogador não precisar adivinhar.

### 5.4 Verificação

73 verificações automatizadas cobriram esta rodada, com um DOM falso mínimo
(sem dependências): o parser de atributos contra os 43 talentos gerais e épicos,
as magias concedidas entrando e saindo da ficha, o bônus de Arqueirismo e de
Defesa contra a linha-base sem estilo, Duelismo pegando a espada curta e não a
grande, perícias de talento sem sobrescrever `expertSkills`, o HTML da caixa, o
painel do Passo 5, e as regressões da Rodada 2 (mínimo de linhas, overrides
preservados, nada duplicado após cinco recálculos seguidos).

---

## 6. Rodada 5 — antecedente personalizado com nome

Duas queixas sobre o painel de Antecedente personalizado: o selo dizia
**"D&D 2024 / AideDD"** num painel que justamente *não* vem do livro, e o
antecedente inventado pelo jogador não tinha nome — aparecia como
"Personalizado" no Passo 1, no resumo e no campo **Origem** da ficha.

### 6.1 O selo virou "Personalizado"

`index.html:203` — o *badge* âmbar do cabeçalho do `#customBackgroundPanel`
passou de `D&D 2024 / AideDD` para `Personalizado`. Só o texto mudou; o estilo
(pílula âmbar) continua igual, e o selo dos painéis de antecedentes oficiais não
foi tocado.

### 6.2 Campo "Nome do Antecedente"

Uma nova `custom-bg-section` abre o painel, antes do bloco de atributos
(`index.html:210`):

```html
<div class="custom-bg-section-title">
  <i class="fa-solid fa-signature"></i> Nome do Antecedente
</div>
<input type="text" class="form-control" id="inputCustomBgName" maxlength="60"
       placeholder="Ex.: Caçador de Relíquias, Órfão das Docas, Erudito Exilado...">
```

O valor mora em `character.customBg.name` (string vazia por padrão), ao lado das
escolhas que já viviam ali (`feat`, `skill1`, `skill2`, `tool`, atributos).
Como é mais um campo do mesmo objeto já serializado, ele entra no localStorage e
no export sem nenhum código de persistência novo.

### 6.3 `getBackgroundLabel()` — uma função para todos os pontos de exibição

O nome do antecedente era lido em cinco lugares diferentes, cada um com sua
própria expressão. Todos passaram a chamar a mesma função (`app.js:678`):

```js
function getBackgroundLabel(bgObj) {
  if (!bgObj) return "Personalizado";
  if (!bgObj.isCustom) return bgObj.name;
  const typed = ((character.customBg && character.customBg.name) || "").trim();
  return typed || "Personalizado";
}
```

Os pontos que ela alimenta:

| Onde | Chamada |
|---|---|
| Opção `⭐` do select do Passo 1 | `app.js:203` (`initUI`) |
| Resumo de Espécie & Antecedente | `app.js:903` |
| Etiqueta "Origem •" na lista de talentos | `app.js:1113` |
| Campo **Origem** da ficha | `app.js:2257` (`syncOfField("sheetOrigin", ...)`) |
| Linha de equipamento do antecedente | `app.js:2732` |

Antecedente oficial devolve o nome do `data.js` como sempre; personalizado sem
nome digitado (ou só com espaços) cai no rótulo genérico `"Personalizado"`, que é
exatamente o que se via antes. Fichas salvas antes desta rodada não têm a chave
`name` — o `|| ""` cobre esse caso, então nada quebra e nada precisa de migração.

### 6.4 Digitar atualiza sem reconstruir a tela

O listener é de `input`, não de `change`, para a ficha acompanhar tecla a tecla
(`app.js:3278`):

```js
bindCustomBg("inputCustomBgName", "input", (e) => {
  character.customBg.name = e.target.value;
  const label = getBackgroundLabel({ isCustom: true });
  const opt = document.querySelector('#selectBackground option[value="custom"]');
  if (opt) opt.textContent = `⭐ ${label}`;
  const originTag = document.querySelector("#featsContainer .tag-origin");
  if (originTag) originTag.textContent = `Origem • ${label}`;
  renderSpeciesBackgroundSummary();
  recalculateCharacter();
});
```

A opção do select e a etiqueta de origem são atualizadas **no lugar**
(`textContent`), em vez de chamar `initUI()` ou `updateFeatsList()`: reconstruir
a lista de talentos a cada tecla apagaria o foco do campo que está sendo digitado
— o mesmo cuidado da caixa de escolhas da Rodada 4 (ver 5.3).

Pela mesma razão, `initCustomBackgroundPanel()` (`app.js:515`) só devolve o valor
ao input quando ele **não** está em foco:

```js
if (inputName && document.activeElement !== inputName) {
  inputName.value = character.customBg.name || "";
}
```

`syncWizardControls()` (`app.js:279`) restaura o campo ao carregar uma ficha
salva.

### 6.5 Verificação

Harness de DOM falso carregando `data.js` + `app.js` em `vm`: **28 verificações
passando**. Cobrem o selo (`AideDD` some do `index.html`, `Personalizado`
presente, campo com `maxlength`), `getBackgroundLabel()` nos seis casos (sem
nome, com nome, só espaços, espaços nas pontas, antecedente oficial, `bgObj`
nulo, save antigo sem a chave `name`), a propagação para o campo Origem da ficha
— incluindo troca de nome, override digitado direto na ficha vencendo o valor
derivado e volta para antecedente oficial —, o não-roubo do input em foco,
`syncWizardControls()`, a gravação no localStorage e uma regressão da Rodada 4
(efeitos dos Estilos de Luta, `getGrantedSpellEntries`, `getFeatChoiceSpec`,
`character.featChoices`).

---

## 7. Rodada 6 — PDF oficial, ficha em branco e dados da biografia

Quatro pedidos: transferir a ficha pronta para o **PDF oficial editável**
(`D&D 5.5 - Ficha editável.pdf`), apontar o botão *RPG Master* para
`valedrone.com.br/rpg`, abrir o app com **tudo em branco** e pôr um **dado** ao
lado de cada campo da biografia.

### 7.1 Exportação para o PDF oficial (`pdf-export.js`)

Botão **Ficha PDF Oficial** no cabeçalho, ao lado de *Imprimir / PDF*. Ele lê a
ficha que está na tela, preenche os campos de formulário (AcroForm) do PDF
oficial e baixa o arquivo — **sem achatar**, então o PDF continua editável em
qualquer leitor.

**De onde vêm os valores.** Do DOM da ficha, não de um segundo cálculo: campos
por `id` (`sheetAC`, `sheetOrigin`, `sheetSpellDC`…), atributos e perícias pelos
`data-ability-mod` / `data-ability-score` / `data-skill-mark`, e as linhas de arma
e magia direto de `character.sheet.weaponRows` / `spellRows`. Como a ficha na tela
já mistura cálculo automático e edição manual, o PDF sai igual ao que se vê —
inclusive com os overrides digitados à mão.

**O mapa de campos.** Os campos do PDF têm nome gerado (`text_57zdom`,
`checkbox_162oonu`), sem relação com o rótulo impresso. O mapa foi levantado
preenchendo cada campo com o próprio número, renderizando as duas páginas em
imagem e lendo onde cada número caiu. O resultado está em constantes no topo do
arquivo, usando **só o número** — `indexPdfFields()` casa número → campo em tempo
de execução:

| Constante | Cobre |
|---|---|
| `PDF_TEXT` | identidade, CA, PV, dado de vida, faixa de status, proficiências, características, conjuração, história, equipamento |
| `PDF_ABILITY` | modificador, valor e salvaguarda dos seis atributos |
| `PDF_SKILL` | as 18 perícias (bolinha + bônus) |
| `PDF_CHECK` | escudo, inspiração, treino de armadura, resistências de morte, sintonização |
| `PDF_WEAPON_ROWS` | as 6 linhas de *Armas & Truques de Dano* |
| `PDF_SPELL_ROWS` | as 30 linhas de magia, com as bolinhas C/R/M |
| `PDF_SLOTS` | total e "gastos" dos 9 círculos |
| `PDF_COIN` / `PDF_ATTUNE` | moedas (CP, PP, PE, PO, PL) e os 3 itens sintonizados |

**Corpo de letra.** O tamanho tem que ser gravado no campo **e em cada widget**:
o PDF traz um tamanho fixo por widget e é ele que vale ao redesenhar. Sem isso o
nome da magia saía cortado. `setPdfFieldFontSize()` grava `0` (automático) nos
campos de uma linha — a pdf-lib então diminui a letra até caber — e `6` nas áreas
de texto. A fonte é embutida com nome próprio (`HelvFicha`) para não colidir com
o `/Helv` do formulário original, que aponta para uma serifada mais larga e fazia
o texto ser medido com uma fonte e escrito com outra.

**De onde vem o PDF em branco.** Primeiro tenta `fetch` do arquivo ao lado do
app (funciona servido por http). Em `file://` o navegador bloqueia, e aí abre o
seletor de arquivo pedindo o `D&D 5.5 - Ficha editável.pdf`. O arquivo escolhido
fica em cache pela sessão; **Shift + clique** força escolher outro.

**Detalhes.** A `pdf-lib` (`pdf-lib.min.js`, no próprio diretório) só é carregada
no primeiro clique, então não pesa no carregamento da página. Acentos passam
direto; travessão, bolinha e aspas curvas viram equivalentes ASCII em
`pdfSafeText()`, porque a Helvetica padrão do PDF só escreve WinAnsi. Se sobrarem
linhas de arma (mais de 6) ou de magia (mais de 30), o que não coube é avisado
por *toast* em vez de sumir em silêncio.

### 7.2 Link do RPG Master

`index.html` — o botão do cabeçalho apontava para `../rpg/` (caminho relativo) e
agora vai para `https://valedrone.com.br/rpg`.

### 7.3 A ficha abre em branco

Antes o app abria com um mago de exemplo pronto. Agora abre vazio, para preencher
do zero.

- **`createBlankCharacter()`** (`app.js:16`) passou a ser a origem única do estado
  inicial: nome, tendência, XP, idiomas, perícias, talentos, magias, armas,
  inventário, moedas, PV e a bio inteira vazios; `class1`, `species`,
  `background` e `subclass1` em `"none"`. Sobram só as escolhas estruturais:
  nível 1 e compra por pontos começando com 8 em todos os atributos.
  `resetCharacter()` usa a mesma função (e limpa o `localStorage`), então "novo
  personagem" e "primeira visita" produzem exatamente o mesmo estado.
- **Seletores com placeholder**: `— Selecione a Classe —`, `— Selecione a
  Espécie —`, `— Selecione o Antecedente —` e `— Selecione a Tendência —`.
- **`EMPTY_CLASS` / `EMPTY_SPECIES` / `EMPTY_BACKGROUND`** entram no lugar dos
  dados do `data.js` enquanto nada foi escolhido. Antes o código caía em
  `DND5E_DATA.classes[0]` — ou seja, virava bárbaro sem ninguém pedir. Com os
  objetos neutros o cálculo roda inteiro e dá resultado vazio.
- **`isBlankSheet()` e `_ofBlank`**: com classe, espécie e antecedente ainda em
  `"none"`, `syncOfField()` e `syncOfCheck()` escrevem vazio em vez do valor
  derivado, e `renderOfAbilities()` deixa modificadores, valores, bônus e
  bolinhas em branco. Não é um caso especial espalhado pelo código: são os dois
  funis por onde toda a ficha passa.
- **`OF_PLAYER_FIELDS`**: nome, tendência, XP, aparência, história, idiomas,
  equipamento, PV atual/temporário, moedas e sintonização **não** são apagados
  pelo modo em branco — são texto do jogador, não valor derivado. É o que faz a
  biografia sorteada aparecer na ficha antes mesmo de escolher uma classe.
- Dois resquícios de "personagem de exemplo" saíram junto: o nome não cai mais
  em `"Novo Herói"` e o idioma Comum só é acrescentado depois que o jogador
  marca algum idioma.
- O Passo 3 continua utilizável antes das escolhas: `updateSkillsSelector()`
  usa os objetos neutros em vez de desistir, e o resumo de Espécie & Antecedente
  se limpa em vez de manter conteúdo velho.

### 7.4 Dado de sorteio na Biografia (`bio-random.js`)

Cada campo do Passo 6 tem um **d20** ao lado do rótulo (`.bio-roll`, encaixado no
`.form-label`, que já é flex com `space-between`). Clicar sorteia **só aquele
campo** — dá para sortear o que faltou e escrever o resto à mão.

O botão escreve no input e dispara o evento `input`; quem grava em
`character.bio`, salva e repinta a ficha continua sendo o listener do `app.js`.
Nenhuma duplicação de estado.

As tabelas cobrem olhos, pele, cabelo, personalidade, ideais, vínculos e defeitos
(12 a 15 entradas cada). Três campos não são sorteio simples:

- **Idade e altura** saem de faixas por espécie (`BIO_BODY_BY_SPECIES`) — um elfo
  sorteia entre 80 e 700 anos, um halfling entre 0,85 m e 1,05 m. Sem espécie
  escolhida, usa a faixa humana.
- **Peso** acompanha a altura que já está no campo (mesma posição relativa dentro
  da faixa da espécie), com variação de ±8% — não sai um gigante de 40 kg.
- **História** é montada em quatro pedaços: origem + virada + motivação +
  segredo, 8 opções cada — 4.096 combinações.

### 7.5 Importar uma ficha preenche o assistente também

Importar um JSON preenchia a ficha oficial, mas os campos do assistente (Passos 1
a 6) continuavam com o conteúdo anterior — a função de import repintava a ficha e
esquecia os controles. Carregar da lista de **Salvos** tinha o mesmo defeito, e
cada um dos três caminhos de carga atualizava um pedaço diferente da tela.

Agora os três passam por **`applyLoadedCharacter()`** (`app.js:337`):

```js
character = mergeIntoBlankCharacter(data);
migrateLegacyCharacter(data);
syncWizardControls();      // Passos 1, 2, 5 e 6
populateDropdowns();       // linhagem, subclasse, bônus, perícias e talentos
renderLanguagesCheckboxes(); renderAbilityInputs(); renderSpellsCatalog();
renderCustomItemsList(); renderDeathSaves();
recalculateCharacter();    // ficha oficial + derivados
```

- **`mergeIntoBlankCharacter()`** (`app.js:319`) monta a ficha sobre o objeto
  em branco e faz merge chave a chave dos objetos aninhados (`customBg`,
  `baseScores`, `coins`, `bio`, `sheet`, `featChoices`…). Sem isso, uma ficha
  exportada antes da Rodada 5 chegava sem `customBg.name` e um save antigo sem
  `featChoices` quebrava a caixa de escolhas dos talentos.
- **`syncWizardControls()`** ganhou o que faltava: idiomas extras, as três caixas
  de moedas, o botão ativo do modo de atributos e a seção de rolagem 4d6.
- O import agora também grava no `localStorage` — recarregar a página mantém a
  ficha importada — e aceita ficha sem nome (o nome pode estar em branco desde a
  Rodada 6).

### 7.6 Verificação

Dois conjuntos, rodando o app de verdade num DOM (jsdom) com `data.js`, `app.js`,
`bio-random.js` e `pdf-export.js` carregados como o navegador carrega:

- **61 verificações** da ficha em branco e dos dados: todos os campos derivados
  vazios na carga, nenhuma proficiência marcada, seletores em `"none"`, moedas
  zeradas, os 11 dados sorteando com formato certo (`"37 anos"`, `"1,72 m"`,
  `"68 kg"`), sorteio variando entre cliques, a bio chegando à ficha, e o
  recálculo voltando ao normal (classe, CA, PB, deslocamento, modificadores)
  assim que classe, espécie e antecedente são escolhidos.
- **34 verificações** da importação, usando um JSON real exportado antes destas
  mudanças (`asd_DND55.json`, paladino nível 4 com antecedente personalizado):
  arquivo entregue ao `<input type="file">` como o navegador entrega, e depois
  conferidos nome, classe, nível, espécie, antecedente, tendência, subclasse,
  atributos, idiomas, perícias, talentos, armadura, escudo, armas, inventário,
  moedas e os cinco campos de bio **nos controles do assistente**, além da ficha
  oficial (CA 21 = placas 18 + escudo 2 + Estilo Defesa 1).
- **Exportação**: preenchimento real do PDF oficial a partir de um personagem
  montado no app, com as duas páginas renderizadas em imagem e conferidas —
  identidade, atributos, perícias marcadas, armas, características, magias com
  C/R/M, espaços gastos, moedas e bio nos lugares certos, sem texto cortado.

---

## 8. Rodada 7 — adaptação para celular (mobile first)

A página era desenhada para monitor: duas colunas fixas, cabeçalho numa linha só,
seis atributos lado a lado, filtros em fileira. No celular isso virava rolagem
lateral e botões pequenos demais para o dedo. Esta rodada refez o CSS de layout
**começando pela tela pequena**.

### 8.1 A regra: base é o celular

Todas as regras de layout agora descrevem o celular **sem media query**; as telas
maiores entram por `min-width` e vão *acrescentando*. As antigas
`@media (max-width: ...)` que desfaziam o desktop saíram. Sobraram três blocos
`max-width`, e eles não desfazem nada: são refinamentos que só existem no
celular (área de toque das caixinhas, subtítulo do cabeçalho abaixo de 480px e
o aperto das colunas do catálogo de magias).

| Ponto de quebra | O que muda |
|---|---|
| base (< 640px) | uma coluna, ações roláveis, alvos de toque de 40px |
| >= 640px | formulários em 2 colunas, filtros de magia lado a lado |
| >= 768px | cabeçalho em linha, rótulos longos das abas voltam, barras horizontais |
| >= 900px | seis atributos por linha, coluna "Classes" no catálogo de magias |
| >= 1024px | formulários em 3 colunas, selo de sincronização |
| >= 1300px | assistente e ficha lado a lado, ficha grudada no topo (sticky) |

### 8.2 Um painel por vez no celular

No desktop o assistente fica à esquerda e a ficha à direita, atualizando ao vivo.
Numa tela estreita os dois empilhados obrigam a rolar uma página A4 inteira para
voltar ao formulário. Como o app já tem as abas **Assistente / Ficha Editável**,
elas passaram a ser a navegação no celular:

```css
.main-workspace:not(.mode-sheet) .sheet-viewer-panel { display: none; }

@media (min-width: 1300px) {
  .main-workspace { grid-template-columns: 1.15fr 1fr; }
  .main-workspace:not(.mode-sheet) .sheet-viewer-panel { display: flex; }
}
```

A impressão não foi afetada: as regras de `@media print` do `sheet.css` já
forçavam `display: block !important` na ficha. Imprimir do celular, mesmo com a
ficha escondida na tela, continua gerando as duas páginas A4.

### 8.3 Cabeçalho, passos e rótulos

- **Ações do cabeçalho**: os sete botões viraram uma faixa que rola na horizontal
  (`overflow-x: auto` + `min-width: 0`, que é o que impede o item flex de esticar
  a página inteira). A partir de 768px voltam a quebrar em linhas.
- **Passos do assistente**: trilha rolável com `scroll-snap-type: x proximity`,
  cada passo encaixando na borda.
- **Rótulos longos**: `<span class="tab-long-label">` embrulha o excedente —
  *"Página 1: Personagem & Combate"* vira *"Página 1"*, *"Assistente Passo a
  Passo (Wizard)"* vira *"Assistente"*. Abaixo de 480px o subtítulo do cabeçalho
  também sai de cena.

### 8.4 Formulários e toque

- `.form-grid-2/3/4` nascem em uma coluna e crescem para 2 e depois 3 ou 4.
- Campos de texto com **16px** na base: abaixo disso o Safari do iPhone dá zoom
  sozinho ao focar o campo e desalinha a página. Da tabuleta para cima voltam a
  0,88rem.
- `.btn` com `min-height: 40px` (38px nos pequenos) no celular; caixas de seleção
  de perícia, idioma e talento com 18px e linha de 38px.
- A grade de atributos ficou com **3 por linha** no celular e 6 no desktop.

### 8.5 A ficha no celular

A folha A4 cabe inteira em cerca de 45% de zoom num aparelho de 390px — dá para
ver a página, mas não para digitar. A barra da ficha ganhou um controle de zoom
(`- Ajustar +`, `changeSheetZoom()` em `app.js:387`):

- **Ajustar** (padrão) recalcula a escala a cada `resize`/`orientationchange`
  para a página caber na largura;
- **+ / -** mudam de 15 em 15 pontos, entre 30% e 200%, e o rótulo passa a
  mostrar a porcentagem;
- acima do encaixe, o container da ficha rola na horizontal — é assim que se
  chega perto o bastante para preencher um campo com o dedo.

A barra empilha em duas linhas no celular, as duas abas de página dividem a
largura, e o selo "Sincronização Ativa" (informação secundária) só aparece a
partir de 1024px.

### 8.6 Bug encontrado: classes sem estilo

Auditando as classes do HTML contra as duas folhas apareceram **nove
contêineres sem nenhuma regra** — a folha conhecia nomes antigos:

| Marcação usa | CSS tinha |
|---|---|
| `.ability-inputs-grid` | `.attributes-input-grid` |
| `.languages-grid` | `.lang-checkbox-grid` |
| `.point-buy-budget` | `.pointbuy-budget-bar` |
| `.ability-modes-bar` | `.ability-mode-selector` |
| `.spells-filter-bar`, `.spell-capacity-card`, `.feature-preview-box`, `.roll-section`, `.btn-block` | — |

O efeito era visível **em qualquer tela**: os seis atributos vinham empilhados um
por linha, os quatro modos de geração idem, e os filtros do catálogo desciam em
coluna. Agora os seletores cobrem os dois nomes e os contêineres que faltavam
ganharam regra própria, também mobile first.

### 8.7 Verificação

**32 verificações** rodando no Chrome de verdade (puppeteer), além das capturas
de tela conferidas a olho em 320, 390, 820 e 1600px:

- nenhuma rolagem horizontal da página em 320, 390, 414, 768, 1024 e 1600px
  (`window.scrollX` continua 0 depois de tentar rolar para o lado);
- no celular, ficha escondida no modo assistente e assistente escondido no modo
  ficha; no desktop, os dois lado a lado;
- grades: 1 coluna de formulário, 3 atributos por linha, filtros em coluna única
  e modos de atributo em duas colunas no celular — 3 colunas de formulário e 6
  atributos por linha no desktop;
- campo de texto com ao menos 16px, alvos de toque com 38px ou mais, cabeçalho e
  trilha de passos rolando na horizontal sem esticar a página;
- zoom da ficha: encaixe inicial entre 30% e 70%, botão + aumentando e rótulo
  virando porcentagem, botão *Ajustar* voltando ao encaixe;
- impressão a partir do celular (modo assistente) gerando as duas páginas da
  ficha, sem nada do assistente no papel.

---

## 9. Como o código da ficha funciona

Toda a ficha vive no bloco marcado em `app.js` como
`FICHA OFICIAL EDITÁVEL (2 PÁGINAS)` (a partir da linha ~1520).

### 9.1 O sistema de override

O problema central: os campos são preenchidos automaticamente pelo criador, mas o
jogador precisa poder digitar por cima **sem que o próximo recálculo apague o que
ele escreveu**.

A solução é `character.sheet` — um dicionário de overrides. Três funções o operam:

```js
function sheetOv()          // acessa character.sheet, criando as sub-estruturas sob demanda
function hasOv(key)         // true se o jogador digitou algo naquele campo
function syncOfField(id, autoValue, key)  // preenche o input respeitando o override
```

`syncOfField()` (`app.js:2211`) é a peça-chave e tem três guardas:

```js
function syncOfField(id, autoValue, key) {
  const el = document.getElementById(id);
  if (!el) return;                          // 1. campo não existe → sai
  if (document.activeElement === el) return; // 2. usuário está digitando → não pisa
  const val = key && hasOv(key) ? sheetOv()[key] : autoValue;  // 3. override vence
  el.value = val === undefined || val === null ? "" : val;
}
```

A guarda 2 é o que impede o cursor de pular enquanto se digita: um recálculo
disparado no meio da digitação simplesmente não toca no campo focado.

Do outro lado, `bindOfficialSheetEvents()` (`app.js:2762`) registra o override.
O mapa `OVERRIDABLE` liga cada `id` de input à sua chave em `character.sheet`:

```js
const OVERRIDABLE = {
  sheetOrigin: "origin", sheetClassName: "className", sheetAC: "ac", /* ... */
};
Object.entries(OVERRIDABLE).forEach(([id, key]) => {
  document.getElementById(id).addEventListener("input", () => {
    sheetOv()[key] = el.value;   // a partir daqui este campo é do jogador
    saveToLocalStorage();
  });
});
```

Campos passados a `syncOfField` **sem** a terceira argumento (a chave) não aceitam
override — são espelhos puros do criador, como `sheetAlignment`.

O botão **Recalcular Campos** (`#btnResetSheetOverrides`) faz `character.sheet = {}`,
zera os caches de assinatura das tabelas e chama `recalculateCharacter()` — tudo
volta a ser derivado do criador.

### 9.2 Campos espelhados

Alguns campos não são override: editá-los na ficha deve alterar o **criador**.
`bindSheetMirror(id, evento, apply)` (`app.js:3044`) cobre esse caso — nome do
personagem, nome do jogador, alinhamento, EXP, PV atual e temporário, e as cinco
moedas. Escrever "Aurelio" no nome dentro da ficha atualiza `character.name` *e* o
campo do assistente.

### 9.3 O pipeline de renderização

`renderOfficialSheet(ctx)` (`app.js:2236`) é só uma sequência de chamadas:

```js
renderOfSheetHeader(ctx);      // cabeçalho + CA/PV/DV/morte
renderOfAbilities(ctx);        // 6 atributos + salvaguardas + perícias
renderOfProficienciesBox(ctx); // armaduras, armas, ferramentas
renderOfStatStrip(ctx);        // iniciativa, velocidade, tamanho, percepção passiva
syncSheetWeaponRows(ctx);      // reconcilia o modelo de linhas de arma
renderOfWeaponsTable();        // desenha a tabela de armas
renderOfFeatureAreas(ctx);     // características de classe, raciais e talentos
renderOfCastingHeader(ctx);    // atributo/CD/ataque de conjuração
renderOfSpellSlots(ctx);       // 9 círculos de espaços
syncSheetSpellRows();          // reconcilia o modelo de linhas de magia
renderOfSpellsTable();         // desenha a tabela de magias
renderOfSideColumn(ctx);       // aparência, história, idiomas, equipamento, moedas
```

Repare no par **sync… / render…** nas tabelas: `sync` mexe só no *modelo*
(`character.sheet.weaponRows` / `spellRows`), `render` mexe só no *DOM*.

### 9.4 Atributos e perícias

`renderOfAbilities()` (`app.js:2302`) monta os seis blocos a partir de
`layout = [["str","dex","con"], ["int","wis","cha"]]`. Para cada atributo ele
resolve o modificador, a proficiência da salvaguarda e as perícias daquele
atributo (`DND5E_DATA.skills.filter(sk => sk.ability === abId)`), e calcula o
bônus de cada perícia:

```js
const bonus = mod + (isExpert ? pb * 2 : isProf ? pb : 0);
```

O DOM é anotado com atributos `data-*` que os handlers leem depois:
`data-ability-score`, `data-ability-mod`, `data-save-mark`, `data-skill-mark`,
`data-roll` e `data-mod`. Isso permite **um único listener delegado** na página
inteira, em vez de um por elemento — o que importa porque esses blocos são
recriados a cada recálculo.

A proficiência de salvaguarda tem override próprio: `getSaveProfs()` (`app.js:2296`)
devolve `character.sheet.saveProfs` se o jogador marcou algo à mão, senão os
`savingThrows` da classe.

Editar o **Valor** de um atributo não escreve direto no valor final — ele é
derivado. O handler calcula o delta contra o valor exibido e aplica esse delta na
base, de forma que os bônus de antecedente continuem somando corretamente:

```js
const shown = getDisplayedAbilityScore(abId);
character.baseScores[abId] = (character.baseScores[abId] || 10) + (desired - shown);
```

Editar o **Modificador** faz o mesmo caminho de volta, convertendo modificador em
valor pela fórmula `10 + mod * 2`.

### 9.5 Tabelas de armas e magias: reconciliação por `uid`

Cada linha das tabelas é um objeto no modelo, com identidade estável:

```js
{ uid: "rl8x2k9abc",   // gerado por newRowUid(), estável entre repinturas
  srcId: "weapon:dagger", // origem no criador (ausente se o jogador criou a linha)
  edited: false,        // true depois que o jogador digitou na linha
  name, atk, damage, notes }
```

`syncSheetWeaponRows()` (`app.js:2404`) monta a lista `auto` a partir das armas
equipadas, dos itens customizados com dano e dos ataques personalizados —
calculando ataque e dano com a habilidade correta (arma à distância ou de acuidade
com Destreza maior que Força usa DES) — e então **reconcilia**:

```js
auto.forEach(a => {
  const existing = ov.weaponRows.find(r => r.srcId === a.srcId);
  if (!existing)             ov.weaponRows.push({ uid: newRowUid(), edited: false, ...a });
  else if (!existing.edited) Object.assign(existing, a);   // ← linha editada é preservada
});
ov.weaponRows = ov.weaponRows.filter(r => !r.srcId || autoIds.includes(r.srcId));
```

Ou seja: linha nova entra, linha automática não editada é atualizada, linha
editada pelo jogador fica intacta, e linha cuja arma saiu do criador é removida.
Linhas soltas (sem `srcId`) nunca são removidas automaticamente.

`padSheetRows()` (`app.js:2461`) mantém o número mínimo de linhas em branco da
ficha impressa (8 para armas, 24 para magias), aparando o excesso de linhas vazias
no fim e completando o que faltar.

`renderOfWeaponsTable()` (`app.js:2468`) evita repintar o DOM sem necessidade —
repintar destruiria o foco e a seleção de texto. Ele compara uma **assinatura** das
linhas (`rows.map(r => r.uid).join("|")`) com a última renderizada:

```js
if (sig === _ofWeaponsSig && body.children.length && !dirty) {
  // mesmo conjunto de linhas: só atualiza os valores dos inputs não focados
  return;
}
_ofWeaponsSig = sig;
body.innerHTML = rows.map(r => `<tr data-uid="${r.uid}">…</tr>`).join('');
```

A tabela de magias segue o mesmo padrão, com duas diferenças: as linhas vindas do
criador carregam `spellId`, e `buildSpellRowFromData()` (`app.js:2592`) deriva as
colunas C/R/M do próprio texto da magia:

```js
c: /Concentração/i.test(sp.duration),
r: /Ritual/i.test(sp.desc) || /Ritual/i.test(sp.time),
m: /M/.test((sp.components || "").split(",").map(s => s.trim()).join(",")),
```

`syncSheetSpellRows()` ainda ordena as linhas — magias do criador primeiro, por
círculo e depois alfabeticamente, com truques (`"T"`) na frente — e deixa as linhas
em branco no fim.

Clicar no `✕` de uma linha se comporta conforme a origem da linha:

- linha de **arma** vinda do criador → recusa e avisa (*"remova-a no Passo 5"*),
  porque ela voltaria no próximo recálculo;
- linha de **magia** vinda do criador → remove a magia de `spellsKnown` de verdade;
- linha solta → apenas esvazia os campos.

### 9.6 Espaços de magia

`renderOfSpellSlots()` (`app.js:2555`) lê a tabela oficial em
`DND5E_DATA.spellSlotsTable[type][totalLevel]` (`type` = `full`, `half`, `third`…),
mas o **total** de cada círculo é um input com override
(`character.sheet.slots[lvl].total`). Os gastos são checkboxes; ao marcar, o
handler conta os marcados daquele círculo e grava o número em
`character.spellSlotsExpended[lvl]` — armazenar a contagem, e não quais caixas
estão marcadas, evita estado inconsistente quando o total muda.

### 9.7 Segurança na montagem do HTML

As tabelas são montadas por interpolação de string, então todo valor que entra em
atributo passa por `escAttr()` (`app.js:2755`), que escapa `&`, `"` e `<`. Nomes de
arma e anotações digitados pelo jogador não conseguem quebrar a marcação.

---

## 10. Referência: chaves de `character.sheet`

Todo campo com override guarda o valor digitado sob uma dessas chaves. Chave
ausente significa "ainda automático".

**Cabeçalho e combate**
`origin`, `className`, `levelText`, `speciesText`, `subclassText`, `ac`,
`shieldEquipped`, `hpMax`, `hitDiceSpent`, `hitDiceMax`, `pb`

**Faixa de status**
`initiative`, `speed`, `size`, `passivePerception`

**Proficiências**
`armorLight`, `armorMedium`, `armorHeavy`, `armorShields`, `weaponProfs`, `toolProfs`

**Blocos de texto**
`classFeatures`, `classFeatures2`, `speciesTraits`, `featsText`, `appearance`,
`history`, `languages`, `equipment`

**Conjuração**
`spellAbility`, `spellMod`, `spellDC`, `spellAttack`, `slots` (`{ [1..9]: { total } }`)

**Estruturas**
`saveProfs` (array de ids de atributo), `weaponRows`, `spellRows`,
`attunement` (3 strings), `attunementChecks` (3 booleanos)

---

## 11. Impressão e escala

### Escala na tela

A folha tem largura fixa de `210mm` — em painéis estreitos, o lado direito era
cortado. `fitSheetToViewport()` (`app.js:374`) mede o espaço útil e aplica um
`zoom` proporcional ao container:

```js
const pageWidth = 793.7;                    // 210mm em px a 96dpi
const scale = Math.min(1, available / pageWidth);
container.style.zoom = scale.toFixed(4);
```

`zoom` foi escolhido no lugar de `transform: scale()` porque reflui o layout e não
deixa o buraco de espaço que o `transform` deixaria. Nunca amplia (`Math.min(1, …)`).
Roda no load, num `requestAnimationFrame` seguinte (para pegar a largura já
estabilizada) e a cada `resize`.

### Impressão

O bloco `@media print` de `sheet.css` (linha ~526) faz o seguinte:

- esconde toda a interface do app — cabeçalho, painel do criador, barra da ficha,
  modais, toasts e os botões de linha;
- força **as duas páginas visíveis ao mesmo tempo** (na tela só uma aparece por
  vez, via `.active-page`);
- fixa cada `.sheet-page` em `210mm × 296mm` com `page-break-after: always` e
  `break-inside: avoid`, e libera a última (`:last-child`) para não gerar uma
  folha em branco no fim;
- deixa inputs e textareas transparentes, com só uma linha inferior — na
  impressão eles devem parecer campos de formulário, não caixas;
- `@page { size: A4 portrait; margin: 0 }` e `zoom: 1 !important` no container,
  para a escala de tela não vazar para o papel.

Resultado verificado: exatamente 2 páginas A4, uma por folha da ficha.

---

## 12. Persistência e migração

`saveToLocalStorage()` (`app.js:3771`) grava em duas chaves: `dnd55_active_character`
(o personagem atual) e `dnd55_saved_characters` (a lista, com upsert por `character.id`).
É chamado a cada mudança — inclusive a cada tecla digitada num campo da ficha.

`migrateLegacyCharacter()` (`app.js:3792`) roda no carregamento e limpa as escolhas
que o app antigo pré-marcava, sem apagar escolhas reais do jogador:

```js
if (parsed && parsed.schemaVersion >= 2) return;   // já migrado, sai

// só apaga as 6 magias se forem exatamente o preset antigo
const isLegacyPreset = known.length === LEGACY_SPELLS.length
                    && LEGACY_SPELLS.every(id => known.includes(id));
if (isLegacyPreset) character.spellsKnown = [];

// talentos de Origem agora vêm do antecedente, nunca da lista marcável
character.selectedFeats = character.selectedFeats.filter(id => { /* type !== "origin" */ });

character.schemaVersion = 2;
```

A checagem `isLegacyPreset` é deliberadamente estrita: se o jogador tivesse
escolhido as mesmas magias por conta própria mas em número diferente, nada é
apagado. O `schemaVersion` marca o personagem como migrado para a migração não
rodar de novo.

---

## 13. Pontos em aberto

- **Modais órfãos:** "Ataque Personalizado" e "Característica Personalizada"
  ficaram sem uso — agora se adiciona linha direto na tabela pelo botão `+`.
  O código continua no lugar, pronto para ser removido se for a decisão.
- **Card de capacidade de magias** no Passo 4 foi mantido de propósito (informa
  quantos truques e magias preparadas cabem); sair é uma linha no `index.html`.
- **Arquivos `.bak`** podem ser apagados assim que o estado atual for validado.
- **`pdf-lib.min.js`** está versionado junto do projeto de propósito: assim a
  exportação para o PDF oficial funciona offline e abrindo o `index.html` por
  `file://`. Trocar por CDN é uma linha em `pdf-export.js` (`PDF_LIB_FILE`).
- **Limites da ficha oficial**: 6 linhas de arma e 30 de magia. O que passa
  disso é avisado na exportação, mas não cabe no papel.
