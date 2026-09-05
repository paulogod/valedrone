/**
 * D&D 5.5 (2024 / 5e Revisado) - Banco de Dados em Português (PT-BR)
 * Baseado no Livro do Jogador Oficial e referências do sistema D&D 2024.
 */

const DND5E_DATA = {
  "version": "5.5 (2024)",
  "abilities": [
    {
      "id": "str",
      "name": "Força",
      "abbr": "FOR",
      "desc": "Mede o poder físico, capacidade de atletismo e força bruta."
    },
    {
      "id": "dex",
      "name": "Destreza",
      "abbr": "DES",
      "desc": "Mede a agilidade, reflexos, pontaria e equilíbrio."
    },
    {
      "id": "con",
      "name": "Constituição",
      "abbr": "CON",
      "desc": "Mede a saúde, resistência física e vigor vital."
    },
    {
      "id": "int",
      "name": "Inteligência",
      "abbr": "INT",
      "desc": "Mede a acuidade mental, conhecimento e raciocínio lógico."
    },
    {
      "id": "wis",
      "name": "Sabedoria",
      "abbr": "SAB",
      "desc": "Mede a percepção, intuição e sintonia com o mundo."
    },
    {
      "id": "cha",
      "name": "Carisma",
      "abbr": "CAR",
      "desc": "Mede a força de personalidade, persuasão e liderança."
    }
  ],
  "pointBuyCosts": {
    "8": 0,
    "9": 1,
    "10": 2,
    "11": 3,
    "12": 4,
    "13": 5,
    "14": 7,
    "15": 9
  },
  "skills": [
    {
      "id": "acrobatics",
      "name": "Acrobacia",
      "ability": "dex",
      "desc": "Manobras ágeis, equilíbrio e cambalhotas."
    },
    {
      "id": "animal_handling",
      "name": "Adestrar Animais",
      "ability": "wis",
      "desc": "Acalmar, guiar ou treinar animais."
    },
    {
      "id": "arcana",
      "name": "Arcanismo",
      "ability": "int",
      "desc": "Conhecimento sobre magias, itens mágicos e planos."
    },
    {
      "id": "athletics",
      "name": "Atletismo",
      "ability": "str",
      "desc": "Escalar, saltar, nadar e proezas físicas."
    },
    {
      "id": "deception",
      "name": "Enganação",
      "ability": "cha",
      "desc": "Mentir, disfarçar intenções e blefar."
    },
    {
      "id": "history",
      "name": "História",
      "ability": "int",
      "desc": "Lendas, guerras antigas, reis e civilizações."
    },
    {
      "id": "insight",
      "name": "Intuição",
      "ability": "wis",
      "desc": "Perceber mentiras e ler a linguagem corporal."
    },
    {
      "id": "intimidation",
      "name": "Intimidação",
      "ability": "cha",
      "desc": "Ameaçar e coagir através de presença ou força."
    },
    {
      "id": "investigation",
      "name": "Investigação",
      "ability": "int",
      "desc": "Procurar pistas, deduzir e achar detalhes ocultos."
    },
    {
      "id": "medicine",
      "name": "Medicina",
      "ability": "wis",
      "desc": "Estabilizar feridos, diagnosticar doenças e venenos."
    },
    {
      "id": "nature",
      "name": "Natureza",
      "ability": "int",
      "desc": "Plantas, animais, clima e terrenos selvagens."
    },
    {
      "id": "perception",
      "name": "Percepção",
      "ability": "wis",
      "desc": "Ouvir, avistar e notar perigos e detalhes ao redor."
    },
    {
      "id": "performance",
      "name": "Atuação",
      "ability": "cha",
      "desc": "Cantar, dançar, atuar e entreter um público."
    },
    {
      "id": "persuasion",
      "name": "Persuasão",
      "ability": "cha",
      "desc": "Negociar, convencer diplomaticamente e inspirar."
    },
    {
      "id": "religion",
      "name": "Religião",
      "ability": "int",
      "desc": "Deuses, cultos, rituais e símbolos sagrados."
    },
    {
      "id": "sleight_of_hand",
      "name": "Prestidigitação",
      "ability": "dex",
      "desc": "Furtar bolsos, truques manuais e esconder objetos."
    },
    {
      "id": "stealth",
      "name": "Furtividade",
      "ability": "dex",
      "desc": "Mover-se silenciosamente e esconder-se nas sombras."
    },
    {
      "id": "survival",
      "name": "Sobrevivência",
      "ability": "wis",
      "desc": "Rastrear, caçar, navegar e sobreviver no ermo."
    }
  ],
  "tools": [
    {
      "category": "Kits de Especialista & Ladinagem",
      "items": [
        {
          "id": "thieves_tools",
          "name": "Ferramentas de Ladrão"
        },
        {
          "id": "navigator_tools",
          "name": "Ferramentas de Navegador"
        },
        {
          "id": "disguise_kit",
          "name": "Kit de Disfarce"
        },
        {
          "id": "forgery_kit",
          "name": "Kit de Falsificação"
        },
        {
          "id": "herbalism_kit",
          "name": "Kit de Herbalismo"
        },
        {
          "id": "poisoners_kit",
          "name": "Kit de Venenos"
        }
      ]
    },
    {
      "category": "Ferramentas de Artesão",
      "items": [
        {
          "id": "alchemist_supplies",
          "name": "Suprimentos de Alquimista"
        },
        {
          "id": "brewer_supplies",
          "name": "Suprimentos de Cervejeiro"
        },
        {
          "id": "calligrapher_supplies",
          "name": "Kit de Caligrafia"
        },
        {
          "id": "carpenter_tools",
          "name": "Ferramentas de Carpinteiro"
        },
        {
          "id": "cartographer_tools",
          "name": "Ferramentas de Cartógrafo"
        },
        {
          "id": "cobbler_tools",
          "name": "Ferramentas de Sapateiro"
        },
        {
          "id": "cook_utensils",
          "name": "Utensílios de Cozinheiro"
        },
        {
          "id": "glassblower_tools",
          "name": "Ferramentas de Vidreiro"
        },
        {
          "id": "jeweler_tools",
          "name": "Ferramentas de Joalheiro"
        },
        {
          "id": "leatherworker_tools",
          "name": "Ferramentas de Coureiro"
        },
        {
          "id": "mason_tools",
          "name": "Ferramentas de Pedreiro"
        },
        {
          "id": "painter_supplies",
          "name": "Suprimentos de Pintor"
        },
        {
          "id": "potter_tools",
          "name": "Ferramentas de Oleiro"
        },
        {
          "id": "smith_tools",
          "name": "Ferramentas de Ferreiro"
        },
        {
          "id": "tinker_tools",
          "name": "Ferramentas de Funileiro"
        },
        {
          "id": "weaver_tools",
          "name": "Ferramentas de Tecelão"
        },
        {
          "id": "woodcarver_tools",
          "name": "Ferramentas de Entalhador"
        }
      ]
    },
    {
      "category": "Instrumentos Musicais",
      "items": [
        {
          "id": "lute",
          "name": "Alaúde"
        },
        {
          "id": "flute",
          "name": "Flauta"
        },
        {
          "id": "lyre",
          "name": "Lira"
        },
        {
          "id": "drum",
          "name": "Tambor"
        },
        {
          "id": "horn",
          "name": "Trombeta / Berrante"
        },
        {
          "id": "bagpipes",
          "name": "Gaita de Foles"
        },
        {
          "id": "viol",
          "name": "Viola"
        }
      ]
    },
    {
      "category": "Conjuntos de Jogos",
      "items": [
        {
          "id": "dice_set",
          "name": "Jogo de Dados"
        },
        {
          "id": "playing_card_set",
          "name": "Baralho de Cartas"
        },
        {
          "id": "dragonchess_set",
          "name": "Xadrez do Dragão"
        },
        {
          "id": "three_dragon_ante",
          "name": "Três Dragões (Three-Dragon Ante)"
        }
      ]
    }
  ],
  "languages": [
    {
      "id": "common",
      "name": "Comum (Common)",
      "type": "standard",
      "desc": "Idioma universal da maioria dos povos humanoides."
    },
    {
      "id": "common_sign",
      "name": "Língua dos Sinais Comum",
      "type": "standard",
      "desc": "Linguagem gestual padrão de D&D 2024."
    },
    {
      "id": "dwarvish",
      "name": "Anão (Dwarvish)",
      "type": "standard",
      "desc": "Alfabeto Rúnico de Davek."
    },
    {
      "id": "elvish",
      "name": "Élfico (Elvish)",
      "type": "standard",
      "desc": "Alfabeto Espiral de Espruar."
    },
    {
      "id": "giant",
      "name": "Gigante (Giant)",
      "type": "standard",
      "desc": "Língua ancestral dos gigantes."
    },
    {
      "id": "gnomish",
      "name": "Gnômico (Gnomish)",
      "type": "standard",
      "desc": "Rico em termos técnicos e científicos."
    },
    {
      "id": "goblin",
      "name": "Goblin",
      "type": "standard",
      "desc": "Língua áspera de goblins, hobgoblins e bugbears."
    },
    {
      "id": "halfling",
      "name": "Halfling",
      "type": "standard",
      "desc": "Dialeto acolhedor com rimas folclóricas."
    },
    {
      "id": "orc",
      "name": "Órquico (Orc)",
      "type": "standard",
      "desc": "Língua gutural com ênfase na força."
    },
    {
      "id": "abyssal",
      "name": "Abissal (Abyssal)",
      "type": "exotic",
      "desc": "Língua caótica e profana dos demônios."
    },
    {
      "id": "celestial",
      "name": "Celestial",
      "type": "exotic",
      "desc": "Língua sagrada e harmoniosa dos deuses e anjos."
    },
    {
      "id": "draconic",
      "name": "Dracônico (Draconic)",
      "type": "exotic",
      "desc": "Língua dos dragões e da magia arcana primal."
    },
    {
      "id": "deep_speech",
      "name": "Dialeto Subterrâneo (Undercommon)",
      "type": "exotic",
      "desc": "Falado nas profundezas do Subterrâneo."
    },
    {
      "id": "infernal",
      "name": "Infernal",
      "type": "exotic",
      "desc": "Língua leal e diabólica dos nove infernos."
    },
    {
      "id": "primordial",
      "name": "Primordial (Aquan, Auran, Ignan, Terran)",
      "type": "exotic",
      "desc": "Língua elemental dos quatro planos da matéria."
    },
    {
      "id": "sylvan",
      "name": "Silvestre (Sylvan)",
      "type": "exotic",
      "desc": "Língua mística dos seres feéricos e da natureza."
    }
  ],
  "classes": [
    {
      "id": "barbarian",
      "name": "Bárbaro",
      "hitDie": 12,
      "primaryAbility": [
        "str"
      ],
      "savingThrows": [
        "str",
        "con"
      ],
      "armorProficiencies": [
        "Leves",
        "Médias",
        "Escudos"
      ],
      "weaponProficiencies": [
        "Armas Simples",
        "Armas Marciais"
      ],
      "toolProficiencies": [],
      "skillChoices": {
        "count": 2,
        "list": [
          "animal_handling",
          "athletics",
          "intimidation",
          "nature",
          "perception",
          "survival"
        ]
      },
      "spellcasting": null,
      "subclassLevel": 3,
      "asiLevels": [
        4,
        8,
        12,
        16,
        19
      ],
      "featuresByLevel": {
        "1": [
          "Fúria (Rage)",
          "Defesa Sem Armadura (10 + DES + CON)",
          "Maestria em Armas (2 armas)"
        ],
        "2": [
          "Ataque Descuidado (Reckless Attack)",
          "Sentido de Perigo (Danger Sense)"
        ],
        "3": [
          "Subclasse de Bárbaro",
          "Conhecimento Primitivo (Primal Knowledge)"
        ],
        "4": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "5": [
          "Ataque Extra",
          "Movimento Rápido (+3m / +10ft)"
        ],
        "6": [
          "Característica de Subclasse"
        ],
        "7": [
          "Instinto Selvagem (Vantagem na Iniciativa)"
        ],
        "8": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "9": [
          "Crítico Brutal (+1 dado de dano)"
        ],
        "10": [
          "Característica de Subclasse"
        ],
        "11": [
          "Fúria Implacável"
        ],
        "12": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "13": [
          "Golpe Brutal aprimorado"
        ],
        "14": [
          "Característica de Subclasse"
        ],
        "15": [
          "Fúria Persistente"
        ],
        "16": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "17": [
          "Crítico Brutal (+2 dados)"
        ],
        "18": [
          "Força Indomável"
        ],
        "19": [
          "Aumento no Valor de Habilidade ou Talento Épico"
        ],
        "20": [
          "Campeão Primitivo (+4 FOR, +4 CON, Máx 25)"
        ]
      },
      "subclasses": [
        {
          "id": "berserker",
          "name": "Caminho do Berserker",
          "desc": "Guerreiro movido por pura fúria frenética, desferindo golpes avassaladores adicionais e ignorando o medo."
        },
        {
          "id": "wild_heart",
          "name": "Caminho do Coração Selvagem",
          "desc": "Canaliza espíritos totêmicos animais como Urso, Águia e Lobo para resistência e bônus em grupo."
        },
        {
          "id": "world_tree",
          "name": "Caminho da Árvore do Mundo",
          "desc": "Conecta-se às raízes de Yggdrasil, ganhando vitalidade temporal e teletransporte em combate."
        },
        {
          "id": "zealot",
          "name": "Caminho do Zelote",
          "desc": "Abraçado pelo furor divino de uma divindade guerreira, causando dano radiante/necrótico e desafiando a morte."
        }
      ]
    },
    {
      "id": "bard",
      "name": "Bardo",
      "hitDie": 8,
      "primaryAbility": [
        "cha"
      ],
      "savingThrows": [
        "dex",
        "cha"
      ],
      "armorProficiencies": [
        "Leves"
      ],
      "weaponProficiencies": [
        "Armas Simples"
      ],
      "toolProficiencies": [
        "Três instrumentos musicais à sua escolha"
      ],
      "skillChoices": {
        "count": 3,
        "list": [
          "acrobatics",
          "animal_handling",
          "arcana",
          "athletics",
          "deception",
          "history",
          "insight",
          "intimidation",
          "investigation",
          "medicine",
          "nature",
          "perception",
          "performance",
          "persuasion",
          "religion",
          "sleight_of_hand",
          "stealth",
          "survival"
        ]
      },
      "spellcasting": {
        "type": "full",
        "ability": "cha",
        "cantripsKnown": {
          "1": 2,
          "2": 2,
          "3": 2,
          "4": 3,
          "5": 3,
          "6": 3,
          "7": 3,
          "8": 3,
          "9": 3,
          "10": 4,
          "11": 4,
          "12": 4,
          "13": 4,
          "14": 4,
          "15": 4,
          "16": 4,
          "17": 4,
          "18": 4,
          "19": 4,
          "20": 4
        },
        "preparedSpells": {
          "1": 4,
          "2": 5,
          "3": 6,
          "4": 7,
          "5": 9,
          "6": 10,
          "7": 11,
          "8": 12,
          "9": 14,
          "10": 15,
          "11": 16,
          "12": 16,
          "13": 17,
          "14": 17,
          "15": 18,
          "16": 18,
          "17": 19,
          "18": 20,
          "19": 22,
          "20": 22
        }
      },
      "subclassLevel": 3,
      "asiLevels": [
        4,
        8,
        12,
        16,
        19
      ],
      "featuresByLevel": {
        "1": [
          "Conjuração de Bardo",
          "Inspiração de Bardo (d6)"
        ],
        "2": [
          "Pau pra Toda Obra (Jack of All Trades)",
          "Especialização (2 perícias)",
          "Canção de Descanso"
        ],
        "3": [
          "Subclasse de Bardo"
        ],
        "4": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "5": [
          "Fonte de Inspiração (Recupera inspiração em descanso curto)",
          "Inspiração de Bardo (d8)"
        ],
        "6": [
          "Contracanto",
          "Característica de Subclasse"
        ],
        "7": [
          "Magias de 4º Círculo"
        ],
        "8": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "9": [
          "Especialização (2 perícias adicionais)"
        ],
        "10": [
          "Segredos Mágicos (Magias de qualquer classe)",
          "Inspiração de Bardo (d10)"
        ],
        "11": [
          "Magias de 6º Círculo"
        ],
        "12": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "14": [
          "Segredos Mágicos adicionais",
          "Característica de Subclasse"
        ],
        "15": [
          "Inspiração de Bardo (d12)"
        ],
        "16": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "18": [
          "Segredos Mágicos Supremos"
        ],
        "19": [
          "Aumento no Valor de Habilidade ou Talento Épico"
        ],
        "20": [
          "Inspiração Suprema"
        ]
      },
      "subclasses": [
        {
          "id": "lore",
          "name": "Colégio do Conhecimento",
          "desc": "Mestres de perícias, palavras cortantes que sabotam inimigos e acesso antecipado a segredos mágicos de qualquer classe.",
          "bonusSpells": []
        },
        {
          "id": "valor",
          "name": "Colégio da Bravura",
          "desc": "Bardos marciais proficientes com armaduras médias, escudos e armas marciais, inspirando aliados em ataques de combate.",
          "bonusSpells": []
        },
        {
          "id": "dance",
          "name": "Colégio da Dança",
          "desc": "Guerreiros acrobáticos que lutam desarmados com agilidade cintilante e compartilham movimento com aliados.",
          "bonusSpells": []
        },
        {
          "id": "glamour",
          "name": "Colégio do Glamour",
          "desc": "Tocados pelo poder de Feywild, tecem ilusões e majestade feérica hipnotizante sobre multidões e inimigos.",
          "bonusSpells": [
            "command",
            "charm_person"
          ]
        }
      ]
    },
    {
      "id": "cleric",
      "name": "Clérigo",
      "hitDie": 8,
      "primaryAbility": [
        "wis"
      ],
      "savingThrows": [
        "wis",
        "cha"
      ],
      "armorProficiencies": [
        "Leves",
        "Médias",
        "Escudos"
      ],
      "weaponProficiencies": [
        "Armas Simples"
      ],
      "toolProficiencies": [],
      "skillChoices": {
        "count": 2,
        "list": [
          "history",
          "insight",
          "medicine",
          "persuasion",
          "religion"
        ]
      },
      "spellcasting": {
        "type": "full",
        "ability": "wis",
        "cantripsKnown": {
          "1": 3,
          "2": 3,
          "3": 3,
          "4": 4,
          "5": 4,
          "6": 4,
          "7": 4,
          "8": 4,
          "9": 4,
          "10": 5,
          "11": 5,
          "12": 5,
          "13": 5,
          "14": 5,
          "15": 5,
          "16": 5,
          "17": 5,
          "18": 5,
          "19": 5,
          "20": 5
        }
      },
      "subclassLevel": 3,
      "asiLevels": [
        4,
        8,
        12,
        16,
        19
      ],
      "featuresByLevel": {
        "1": [
          "Conjuração Divina",
          "Ordem Divina (Protetor ou Taumaturgo)"
        ],
        "2": [
          "Canalizar Divindade (Expulsar Mortos-Vivos, Centelha Divina)"
        ],
        "3": [
          "Subclasse de Clérigo"
        ],
        "4": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "5": [
          "Destruir Mortos-Vivos (CR 1/2)"
        ],
        "6": [
          "Característica de Subclasse",
          "Canalizar Divindade adicional"
        ],
        "7": [
          "Magias de 4º Círculo",
          "Abençoado pelos Deuses"
        ],
        "8": [
          "Aumento no Valor de Habilidade ou Talento",
          "Golpe Abençoado / Conjuração Poderosa"
        ],
        "9": [
          "Magias de 5º Círculo"
        ],
        "10": [
          "Intervenção Divina"
        ],
        "11": [
          "Destruir Mortos-Vivos (CR 2)"
        ],
        "12": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "14": [
          "Característica de Subclasse"
        ],
        "16": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "17": [
          "Característica de Subclasse"
        ],
        "19": [
          "Aumento no Valor de Habilidade ou Talento Épico"
        ],
        "20": [
          "Intervenção Divina Maior (Garante sucesso automático)"
        ]
      },
      "subclasses": [
        {
          "id": "life",
          "name": "Domínio da Vida",
          "desc": "Mestres absolutos da cura e restauração, maximizando pontos de vida restaurados a si e a seus companheiros.",
          "bonusSpells": [
            "bless",
            "cure_wounds",
            "lesser_restoration",
            "spiritual_weapon",
            "beacon_of_hope",
            "revivify",
            "death_ward",
            "mass_cure_wounds"
          ]
        },
        {
          "id": "light",
          "name": "Domínio da Luz",
          "desc": "Canalizam o fogo sagrado e radiância solar para queimar as trevas e cegar inimigos com clarões divinos.",
          "bonusSpells": [
            "burning_hands",
            "faerie_fire",
            "scorching_ray",
            "daylight",
            "fireball",
            "guardian_of_faith",
            "flame_strike"
          ]
        },
        {
          "id": "trickery",
          "name": "Domínio da Trapaça",
          "desc": "Seguidores de deuses da astúcia, criando cópias ilusórias, ficando invisíveis e enganando os oponentes.",
          "bonusSpells": [
            "charm_person",
            "disguise_self",
            "mirror_image",
            "pass_without_trace",
            "blink",
            "dimension_door",
            "dominate_person"
          ]
        },
        {
          "id": "war",
          "name": "Domínio da Guerra",
          "desc": "Campeões abençoados com proficiência em armas marciais e armaduras pesadas, desferindo ataques extras inspirados.",
          "bonusSpells": [
            "divine_favor",
            "shield_of_faith",
            "magic_weapon",
            "spiritual_weapon",
            "crusaders_mantle",
            "spirit_guardians",
            "freedom_of_movement",
            "hold_monster"
          ]
        }
      ]
    },
    {
      "id": "druid",
      "name": "Druida",
      "hitDie": 8,
      "primaryAbility": [
        "wis"
      ],
      "savingThrows": [
        "int",
        "wis"
      ],
      "armorProficiencies": [
        "Leves",
        "Médias",
        "Escudos"
      ],
      "weaponProficiencies": [
        "Armas Simples"
      ],
      "toolProficiencies": [
        "Kit de Herbalismo"
      ],
      "skillChoices": {
        "count": 2,
        "list": [
          "animal_handling",
          "arcana",
          "insight",
          "medicine",
          "nature",
          "perception",
          "religion",
          "survival"
        ]
      },
      "spellcasting": {
        "type": "full",
        "ability": "wis",
        "cantripsKnown": {
          "1": 2,
          "2": 2,
          "3": 2,
          "4": 3,
          "5": 3,
          "6": 3,
          "7": 3,
          "8": 3,
          "9": 3,
          "10": 4,
          "11": 4,
          "12": 4,
          "13": 4,
          "14": 4,
          "15": 4,
          "16": 4,
          "17": 4,
          "18": 4,
          "19": 4,
          "20": 4
        }
      },
      "subclassLevel": 3,
      "asiLevels": [
        4,
        8,
        12,
        16,
        19
      ],
      "featuresByLevel": {
        "1": [
          "Conjuração Primitiva",
          "Ordem Druídica (Mago ou Protetor)"
        ],
        "2": [
          "Forma Selvagem (Wild Shape)",
          "Companheiro Selvagem"
        ],
        "3": [
          "Subclasse de Druida"
        ],
        "4": [
          "Aumento no Valor de Habilidade ou Talento",
          "Formas Selvagens aquáticas"
        ],
        "5": [
          "Magias de 3º Círculo"
        ],
        "6": [
          "Característica de Subclasse"
        ],
        "7": [
          "Golpe Primitivo"
        ],
        "8": [
          "Aumento no Valor de Habilidade ou Talento",
          "Formas Selvagens voadoras"
        ],
        "10": [
          "Característica de Subclasse"
        ],
        "12": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "14": [
          "Característica de Subclasse"
        ],
        "16": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "18": [
          "Besta Mágica / Conjuração em Forma Selvagem"
        ],
        "19": [
          "Aumento no Valor de Habilidade ou Talento Épico"
        ],
        "20": [
          "Arquidruida (Forma Selvagem ilimitada)"
        ]
      },
      "subclasses": [
        {
          "id": "moon",
          "name": "Círculo da Lua",
          "desc": "Especialistas na Forma Selvagem em combate, transformando-se em feras vorazes e elementais com ação bônus.",
          "bonusSpells": [
            "cure_wounds",
            "moonbeam"
          ]
        },
        {
          "id": "land",
          "name": "Círculo da Terra",
          "desc": "Profundamente ligados aos biomas do mundo (Costas, Desertos, Florestas, Montanhas), recuperando magias no descanso.",
          "bonusSpells": [
            "barkskin",
            "misty_step",
            "lightning_bolt"
          ]
        },
        {
          "id": "sea",
          "name": "Círculo do Mar",
          "desc": "Manipulam tempestades, ondas oceânicas e névoas marinhas para infligir dano elétrico e de frio.",
          "bonusSpells": [
            "fog_cloud",
            "gust_of_wind",
            "water_walk",
            "control_water"
          ]
        },
        {
          "id": "stars",
          "name": "Círculo das Estrelas",
          "desc": "Mapeiam as constelações celestes em um mapa estelar, assumindo formas estelares (Arqueiro, Cálice, Dragão).",
          "bonusSpells": [
            "guiding_bolt"
          ]
        }
      ]
    },
    {
      "id": "fighter",
      "name": "Guerreiro",
      "hitDie": 10,
      "primaryAbility": [
        "str",
        "dex"
      ],
      "savingThrows": [
        "str",
        "con"
      ],
      "armorProficiencies": [
        "Leves",
        "Médias",
        "Pesadas",
        "Escudos"
      ],
      "weaponProficiencies": [
        "Armas Simples",
        "Armas Marciais"
      ],
      "toolProficiencies": [],
      "skillChoices": {
        "count": 2,
        "list": [
          "acrobatics",
          "animal_handling",
          "athletics",
          "history",
          "insight",
          "intimidation",
          "perception",
          "survival"
        ]
      },
      "spellcasting": null,
      "subclassLevel": 3,
      "asiLevels": [
        4,
        6,
        8,
        12,
        14,
        16,
        19
      ],
      "featuresByLevel": {
        "1": [
          "Estilo de Luta (Fighting Style)",
          "Retomar o Fôlego (Second Wind)",
          "Maestria em Armas (3 armas)"
        ],
        "2": [
          "Surto de Ação (Action Surge)",
          "Mente Tática"
        ],
        "3": [
          "Subclasse de Guerreiro"
        ],
        "4": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "5": [
          "Ataque Extra (1 ataque adicional)"
        ],
        "6": [
          "Aumento no Valor de Habilidade ou Talento Extra"
        ],
        "7": [
          "Característica de Subclasse"
        ],
        "8": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "9": [
          "Indomável (Indomitable - Rola novamente salvaguarda com bônus)"
        ],
        "10": [
          "Característica de Subclasse"
        ],
        "11": [
          "Ataque Extra (2 ataques adicionais - Total 3)"
        ],
        "12": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "13": [
          "Indomável (2 usos)",
          "Ataques Táticos"
        ],
        "14": [
          "Aumento no Valor de Habilidade ou Talento Extra"
        ],
        "15": [
          "Característica de Subclasse"
        ],
        "16": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "17": [
          "Surto de Ação (2 usos)",
          "Indomável (3 usos)"
        ],
        "18": [
          "Característica de Subclasse"
        ],
        "19": [
          "Aumento no Valor de Habilidade ou Talento Épico"
        ],
        "20": [
          "Ataque Extra (3 ataques adicionais - Total 4)"
        ]
      },
      "subclasses": [
        {
          "id": "champion",
          "name": "Campeão",
          "desc": "Atleta formidável com margem crítica expandida (crítico em 19-20), mobilidade sobre-humana e sobrevivência heroica."
        },
        {
          "id": "battle_master",
          "name": "Mestre da Batalha",
          "desc": "Tático de elite que emprega Dados de Superioridade (d8/d10) e Manobras marciais para controlar o campo de batalha."
        },
        {
          "id": "eldritch_knight",
          "name": "Cavaleiro Arcano",
          "desc": "Combina proezas marciais devastadoras com magias de abjuração e evocação, vinculando armas à sua mente."
        },
        {
          "id": "psi_warrior",
          "name": "Guerreiro Psiônico",
          "desc": "Canaliza a energia psíquica para impulsionar seus golpes, erguer barreiras telecinéticas e movimentar objetos."
        }
      ]
    },
    {
      "id": "monk",
      "name": "Monge",
      "hitDie": 8,
      "primaryAbility": [
        "dex",
        "wis"
      ],
      "savingThrows": [
        "str",
        "dex"
      ],
      "armorProficiencies": [],
      "weaponProficiencies": [
        "Armas Simples",
        "Armas Marciais Leves"
      ],
      "toolProficiencies": [
        "Um tipo de ferramenta de artesão ou instrumento musical"
      ],
      "skillChoices": {
        "count": 2,
        "list": [
          "acrobatics",
          "athletics",
          "history",
          "insight",
          "religion",
          "stealth"
        ]
      },
      "spellcasting": null,
      "subclassLevel": 3,
      "asiLevels": [
        4,
        8,
        12,
        16,
        19
      ],
      "featuresByLevel": {
        "1": [
          "Defesa Sem Armadura (10 + DES + SAB)",
          "Artes Marciais (d6)",
          "Ataque Desarmado com Ação Bônus"
        ],
        "2": [
          "Pontos de Foco (Ki)",
          "Rajada de Golpes (Flurry of Blows)",
          "Defesa Paciente",
          "Passo do Vento",
          "Movimento Sem Armadura (+3m)"
        ],
        "3": [
          "Subclasse de Monge",
          "Defletir Projéteis (Deflect Missiles)"
        ],
        "4": [
          "Aumento no Valor de Habilidade ou Talento",
          "Queda Lenta"
        ],
        "5": [
          "Ataque Extra",
          "Golpe Atordoante (Stunning Strike)"
        ],
        "6": [
          "Golpes com Foco (Dano de Energia)",
          "Característica de Subclasse"
        ],
        "7": [
          "Evasão",
          "Mente Tranquila"
        ],
        "8": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "9": [
          "Movimento Aprimorado (Andar sobre líquidos e paredes)"
        ],
        "10": [
          "Auto-Restauração",
          "Característica de Subclasse"
        ],
        "11": [
          "Característica de Subclasse"
        ],
        "12": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "13": [
          "Língua do Sol e da Lua"
        ],
        "14": [
          "Alma de Diamante (Proficiência em Todas as Salvaguardas)"
        ],
        "15": [
          "Corpo Intemporal"
        ],
        "16": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "17": [
          "Característica de Subclasse"
        ],
        "18": [
          "Corpo Vazio (Invisibilidade e Resistência)"
        ],
        "19": [
          "Aumento no Valor de Habilidade ou Talento Épico"
        ],
        "20": [
          "Corpo e Mente Perfeitos (+4 DES, +4 SAB)"
        ]
      },
      "subclasses": [
        {
          "id": "open_hand",
          "name": "Caminho da Palma Aberta",
          "desc": "Mestres do combate desarmado puro, derrubando, empurrando ou desabilitando reações inimigas com a Rajada de Golpes."
        },
        {
          "id": "shadow",
          "name": "Caminho da Sombra",
          "desc": "Ninjas e assassinos silenciosos que tecem trevas mágicas e se teletransportam entre as sombras."
        },
        {
          "id": "four_elements",
          "name": "Caminho dos Elementos",
          "desc": "Canalizam o fogo, água, terra e ar como extensões de seus corpos com alcances ampliados."
        },
        {
          "id": "mercy",
          "name": "Caminho da Misericórdia",
          "desc": "Manipuladores da força vital para curar ferimentos de aliados ou infligir toques necróticos debilitantes."
        }
      ]
    },
    {
      "id": "paladin",
      "name": "Paladino",
      "hitDie": 10,
      "primaryAbility": [
        "str",
        "cha"
      ],
      "savingThrows": [
        "wis",
        "cha"
      ],
      "armorProficiencies": [
        "Leves",
        "Médias",
        "Pesadas",
        "Escudos"
      ],
      "weaponProficiencies": [
        "Armas Simples",
        "Armas Marciais"
      ],
      "toolProficiencies": [],
      "skillChoices": {
        "count": 2,
        "list": [
          "athletics",
          "insight",
          "intimidation",
          "medicine",
          "persuasion",
          "religion"
        ]
      },
      "spellcasting": {
        "type": "half",
        "ability": "cha",
        "cantripsKnown": {
          "1": 0,
          "2": 0,
          "3": 0,
          "4": 0,
          "5": 0,
          "6": 0,
          "7": 0,
          "8": 0,
          "9": 0,
          "10": 0,
          "11": 0,
          "12": 0,
          "13": 0,
          "14": 0,
          "15": 0,
          "16": 0,
          "17": 0,
          "18": 0,
          "19": 0,
          "20": 0
        }
      },
      "subclassLevel": 3,
      "asiLevels": [
        4,
        8,
        12,
        16,
        19
      ],
      "featuresByLevel": {
        "1": [
          "Imposição das Mãos (Lay on Hands)",
          "Sentido Divino",
          "Maestria em Armas (2 armas)"
        ],
        "2": [
          "Estilo de Luta",
          "Conjuração de Paladino",
          "Golpe Divino (Paladin's Smite)"
        ],
        "3": [
          "Subclasse de Paladino (Juramento Sagrado)",
          "Canalizar Divindade"
        ],
        "4": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "5": [
          "Ataque Extra",
          "Montaria Fiel (Find Steed preparado automaticamente)"
        ],
        "6": [
          "Aura de Proteção (+CAR em todas as Salvaguardas próximas)"
        ],
        "7": [
          "Característica de Subclasse (Aura)"
        ],
        "8": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "9": [
          "Magias de 3º Círculo"
        ],
        "10": [
          "Aura de Coragem (Imunidade a Amedrontado)"
        ],
        "11": [
          "Golpes Radiantes (+1d8 de dano radiante em todos os acertos)"
        ],
        "12": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "14": [
          "Toque Purificador"
        ],
        "15": [
          "Característica de Subclasse"
        ],
        "16": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "18": [
          "Auras Expandidas (9 metros / 30ft)"
        ],
        "19": [
          "Aumento no Valor de Habilidade ou Talento Épico"
        ],
        "20": [
          "Avatar Sagrado do Juramento"
        ]
      },
      "subclasses": [
        {
          "id": "devotion",
          "name": "Juramento de Devoção",
          "desc": "O clássico cavaleiro da justiça e honra, imbuindo armas com luz sagrada e emanando aura de pureza.",
          "bonusSpells": [
            "protection_from_evil",
            "sanctuary",
            "lesser_restoration",
            "beacon_of_hope"
          ]
        },
        {
          "id": "ancients",
          "name": "Juramento dos Anciãos",
          "desc": "Guardiões da luz primordial e da natureza, criando trepadeiras místicas e concedendo resistência a dano de magias.",
          "bonusSpells": [
            "ensnaring_strike",
            "misty_step",
            "moonbeam",
            "plant_growth"
          ]
        },
        {
          "id": "vengeance",
          "name": "Juramento de Vingança",
          "desc": "Punição implacável para o mal, caçando alvos jurados com Voto de Inimizade para garantir Vantagem.",
          "bonusSpells": [
            "bane",
            "hunters_mark",
            "hold_person",
            "misty_step",
            "haste"
          ]
        },
        {
          "id": "glory",
          "name": "Juramento de Glória",
          "desc": "Heroísmo lendário e feitos atléticos épicos, inspirando aliados com velocidade e vigor inabaláveis.",
          "bonusSpells": [
            "guiding_bolt",
            "heroism",
            "enhance_ability"
          ]
        }
      ]
    },
    {
      "id": "ranger",
      "name": "Guardião (Patrulheiro)",
      "hitDie": 10,
      "primaryAbility": [
        "dex",
        "wis"
      ],
      "savingThrows": [
        "str",
        "dex"
      ],
      "armorProficiencies": [
        "Leves",
        "Médias",
        "Escudos"
      ],
      "weaponProficiencies": [
        "Armas Simples",
        "Armas Marciais"
      ],
      "toolProficiencies": [],
      "skillChoices": {
        "count": 3,
        "list": [
          "animal_handling",
          "athletics",
          "insight",
          "investigation",
          "nature",
          "perception",
          "stealth",
          "survival"
        ]
      },
      "spellcasting": {
        "type": "half",
        "ability": "wis",
        "cantripsKnown": {
          "1": 0,
          "2": 0,
          "3": 0,
          "4": 0,
          "5": 0,
          "6": 0,
          "7": 0,
          "8": 0,
          "9": 0,
          "10": 0,
          "11": 0,
          "12": 0,
          "13": 0,
          "14": 0,
          "15": 0,
          "16": 0,
          "17": 0,
          "18": 0,
          "19": 0,
          "20": 0
        }
      },
      "subclassLevel": 3,
      "asiLevels": [
        4,
        8,
        12,
        16,
        19
      ],
      "featuresByLevel": {
        "1": [
          "Conjuração de Guardião",
          "Marca do Caçador Gratuita",
          "Maestria em Armas (2 armas)"
        ],
        "2": [
          "Estilo de Luta",
          "Explorador Hábil (Deft Explorer - Especialização e Idiomas)"
        ],
        "3": [
          "Subclasse de Guardião"
        ],
        "4": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "5": [
          "Ataque Extra"
        ],
        "6": [
          "Andarilho Errante (+3m deslocamento, escalada e natação)"
        ],
        "7": [
          "Característica de Subclasse"
        ],
        "8": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "9": [
          "Magias de 3º Círculo"
        ],
        "10": [
          "Incansável (Tireless - Recupera exaustão e concede PV temporários)"
        ],
        "11": [
          "Característica de Subclasse"
        ],
        "12": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "13": [
          "Camuflagem da Natureza (Invisibilidade como Ação Bônus)"
        ],
        "14": [
          "Desaparecer"
        ],
        "15": [
          "Característica de Subclasse"
        ],
        "16": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "17": [
          "Magias de 5º Círculo"
        ],
        "18": [
          "Sentidos Selvagens"
        ],
        "19": [
          "Aumento no Valor de Habilidade ou Talento Épico"
        ],
        "20": [
          "Caçador Implacável (+SAB no ataque ou dano contra alvos marcados)"
        ]
      },
      "subclasses": [
        {
          "id": "hunter",
          "name": "Caçador",
          "desc": "Combatente letal adaptado para aniquilar hordas ou monstros gigantes com Colosso Caçador e Salva de Ataques.",
          "bonusSpells": [
            "hunters_mark"
          ]
        },
        {
          "id": "beast_master",
          "name": "Mestre das Feras",
          "desc": "Forma um elo espiritual inquebrável com uma Besta Primitiva da Terra, Ar ou Mar que combate ao seu lado.",
          "bonusSpells": [
            "animal_friendship",
            "beast_sense"
          ]
        },
        {
          "id": "gloom_stalker",
          "name": "Perseguidor Sombrio",
          "desc": "Predador das trevas do Subterrâneo, invisível para criaturas com visão no escuro e com ataques rápidos no 1º turno.",
          "bonusSpells": [
            "disguise_self",
            "rope_trick",
            "fear",
            "greater_invisibility"
          ]
        },
        {
          "id": "fey_wanderer",
          "name": "Andarilho Feérico",
          "desc": "Imbuído com os dons do Feywild, somando Sabedoria em testes de Carisma e aterrorizando ou encantando inimigos.",
          "bonusSpells": [
            "charm_person",
            "misty_step",
            "dimension_door"
          ]
        }
      ]
    },
    {
      "id": "rogue",
      "name": "Ladino",
      "hitDie": 8,
      "primaryAbility": [
        "dex"
      ],
      "savingThrows": [
        "dex",
        "int"
      ],
      "armorProficiencies": [
        "Leves"
      ],
      "weaponProficiencies": [
        "Armas Simples",
        "Armas Marciais com propriedade Acuidade ou Leve"
      ],
      "toolProficiencies": [
        "Ferramentas de Ladrão"
      ],
      "skillChoices": {
        "count": 4,
        "list": [
          "acrobatics",
          "athletics",
          "deception",
          "insight",
          "intimidation",
          "investigation",
          "perception",
          "performance",
          "persuasion",
          "sleight_of_hand",
          "stealth"
        ]
      },
      "spellcasting": null,
      "subclassLevel": 3,
      "asiLevels": [
        4,
        8,
        10,
        12,
        16,
        19
      ],
      "featuresByLevel": {
        "1": [
          "Especialização (2 perícias)",
          "Ataque Furtivo (1d6)",
          "Gíria de Ladrão (Thieves' Cant)",
          "Maestria em Armas (2 armas)"
        ],
        "2": [
          "Ação Astuta (Cunning Action - Desengajar, Disparar, Esconder com Ação Bônus)"
        ],
        "3": [
          "Subclasse de Ladino",
          "Ataque Furtivo (2d6)"
        ],
        "4": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "5": [
          "Esquiva Sobrenatural (Uncanny Dodge)",
          "Ataque Furtivo (3d6)"
        ],
        "6": [
          "Especialização (2 perícias adicionais)"
        ],
        "7": [
          "Evasão (Evasion)",
          "Ataque Furtivo (4d6)"
        ],
        "8": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "9": [
          "Característica de Subclasse",
          "Ataque Furtivo (5d6)"
        ],
        "10": [
          "Aumento no Valor de Habilidade ou Talento Extra"
        ],
        "11": [
          "Talento Confiável (Reliable Talent - Mínimo 10 no d20 para perícias proficientes)",
          "Ataque Furtivo (6d6)"
        ],
        "12": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "13": [
          "Característica de Subclasse",
          "Ataque Furtivo (7d6)"
        ],
        "14": [
          "Sentido Cego (Blindsense)"
        ],
        "15": [
          "Mente Escorregadia (Proficiência em Salvaguarda de Sabedoria)",
          "Ataque Furtivo (8d6)"
        ],
        "16": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "17": [
          "Característica de Subclasse",
          "Ataque Furtivo (9d6)"
        ],
        "18": [
          "Elusivo (Nenhum ataque tem vantagem contra você)"
        ],
        "19": [
          "Aumento no Valor de Habilidade ou Talento Épico"
        ],
        "20": [
          "Golpe de Sorte (Transforma erro em acerto ou teste em 20)",
          "Ataque Furtivo (10d6)"
        ]
      },
      "subclasses": [
        {
          "id": "thief",
          "name": "Ladrão",
          "desc": "Mãos rápidas para usar itens ou gazuas como ação bônus, escalada veloz e uso irrestrito de qualquer item mágico."
        },
        {
          "id": "assassin",
          "name": "Assassino",
          "desc": "Mestre dos disfarces, venenos e assassinatos fulminantes contra oponentes surpresos no primeiro turno."
        },
        {
          "id": "arcane_trickster",
          "name": "Trapaceiro Arcano",
          "desc": "Usa ilusão e encantamento para trapaças mágicas, controlando uma Mão Mágica invisível e furtiva."
        },
        {
          "id": "soulknife",
          "name": "Lâmina Psíquica",
          "desc": "Materializa adagas psíquicas de energia mental para atacar à distância e telepatia silenciosa com aliados."
        }
      ]
    },
    {
      "id": "sorcerer",
      "name": "Feiticeiro",
      "hitDie": 6,
      "primaryAbility": [
        "cha"
      ],
      "savingThrows": [
        "con",
        "cha"
      ],
      "armorProficiencies": [],
      "weaponProficiencies": [
        "Armas Simples"
      ],
      "toolProficiencies": [],
      "skillChoices": {
        "count": 2,
        "list": [
          "arcana",
          "deception",
          "insight",
          "intimidation",
          "persuasion",
          "religion"
        ]
      },
      "spellcasting": {
        "type": "full",
        "ability": "cha",
        "cantripsKnown": {
          "1": 4,
          "2": 4,
          "3": 4,
          "4": 5,
          "5": 5,
          "6": 5,
          "7": 5,
          "8": 5,
          "9": 5,
          "10": 6,
          "11": 6,
          "12": 6,
          "13": 6,
          "14": 6,
          "15": 6,
          "16": 6,
          "17": 6,
          "18": 6,
          "19": 6,
          "20": 6
        },
        "preparedSpells": {
          "1": 2,
          "2": 4,
          "3": 6,
          "4": 7,
          "5": 9,
          "6": 10,
          "7": 11,
          "8": 12,
          "9": 14,
          "10": 15,
          "11": 16,
          "12": 16,
          "13": 17,
          "14": 17,
          "15": 18,
          "16": 18,
          "17": 19,
          "18": 20,
          "19": 22,
          "20": 22
        }
      },
      "subclassLevel": 3,
      "asiLevels": [
        4,
        8,
        12,
        16,
        19
      ],
      "featuresByLevel": {
        "1": [
          "Conjuração Inata",
          "Fúria Feiticeira (Innate Sorcery - Vantagem em ataques mágicos e +1 na CD)"
        ],
        "2": [
          "Fonte de Magia (Pontos de Feitiçaria)",
          "Metamagia (2 opções)"
        ],
        "3": [
          "Subclasse de Feiticeiro"
        ],
        "4": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "5": [
          "Magias de 3º Círculo",
          "Restauração de Feitiçaria"
        ],
        "6": [
          "Característica de Subclasse"
        ],
        "7": [
          "Magias de 4º Círculo",
          "Metamagia Adicional"
        ],
        "8": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "9": [
          "Magias de 5º Círculo"
        ],
        "10": [
          "Metamagia Adicional",
          "Característica de Subclasse"
        ],
        "11": [
          "Magias de 6º Círculo"
        ],
        "12": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "14": [
          "Característica de Subclasse"
        ],
        "16": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "17": [
          "Metamagia Adicional"
        ],
        "18": [
          "Característica de Subclasse"
        ],
        "19": [
          "Aumento no Valor de Habilidade ou Talento Épico"
        ],
        "20": [
          "Feitiçaria Incarnada"
        ]
      },
      "subclasses": [
        {
          "id": "draconic",
          "name": "Linhagem Dracônica",
          "desc": "Herança de dragões ancestrais com escamas naturais (CA 13 + DES), +1 PV por nível e dano elemental aumentado.",
          "bonusSpells": [
            "fire_bolt",
            "dragon_breath",
            "fly"
          ]
        },
        {
          "id": "wild_magic",
          "name": "Magia Selvagem",
          "desc": "Canaliza o puro caos do cosmos, manipulando marés de sorte e desencadeando surtos de magia caótica e imprevisível.",
          "bonusSpells": [
            "chaos_bolt"
          ]
        },
        {
          "id": "aberrant",
          "name": "Mente Aberrante",
          "desc": "Poderes psiônicos do Reino Distante com conjuração sutil sem componentes e ataques telepáticos profundos.",
          "bonusSpells": [
            "mind_sliver",
            "dissonant_whispers",
            "detect_thoughts"
          ]
        },
        {
          "id": "clockwork",
          "name": "Alma Mecânica",
          "desc": "Conexão com a ordem perfeita de Mechanus, neutralizando vantagens e desvantagens com engrenagens cósmicas.",
          "bonusSpells": [
            "alarm",
            "protection_from_evil",
            "lesser_restoration"
          ]
        }
      ]
    },
    {
      "id": "warlock",
      "name": "Bruxo",
      "hitDie": 8,
      "primaryAbility": [
        "cha"
      ],
      "savingThrows": [
        "wis",
        "cha"
      ],
      "armorProficiencies": [
        "Leves"
      ],
      "weaponProficiencies": [
        "Armas Simples"
      ],
      "toolProficiencies": [],
      "skillChoices": {
        "count": 2,
        "list": [
          "arcana",
          "deception",
          "history",
          "intimidation",
          "investigation",
          "nature",
          "religion"
        ]
      },
      "spellcasting": {
        "type": "pact",
        "ability": "cha",
        "cantripsKnown": {
          "1": 2,
          "2": 2,
          "3": 2,
          "4": 3,
          "5": 3,
          "6": 3,
          "7": 3,
          "8": 3,
          "9": 3,
          "10": 4,
          "11": 4,
          "12": 4,
          "13": 4,
          "14": 4,
          "15": 4,
          "16": 4,
          "17": 4,
          "18": 4,
          "19": 4,
          "20": 4
        },
        "preparedSpells": {
          "1": 2,
          "2": 3,
          "3": 4,
          "4": 5,
          "5": 6,
          "6": 7,
          "7": 8,
          "8": 9,
          "9": 10,
          "10": 10,
          "11": 11,
          "12": 11,
          "13": 12,
          "14": 12,
          "15": 13,
          "16": 13,
          "17": 14,
          "18": 14,
          "19": 15,
          "20": 15
        }
      },
      "subclassLevel": 3,
      "asiLevels": [
        4,
        8,
        12,
        16,
        19
      ],
      "featuresByLevel": {
        "1": [
          "Magia de Pacto (Pact Magic)",
          "Invocação Mística (1 à escolha)",
          "Pacto do Bruxo (Lâmina, Tomo ou Corrente)"
        ],
        "2": [
          "Invocações Místicas adicionais (Total 3)"
        ],
        "3": [
          "Subclasse de Bruxo (Patrono Transcendental)"
        ],
        "4": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "5": [
          "Invocações Místicas (Total 5)",
          "Magias de Pacto de 3º Círculo"
        ],
        "6": [
          "Característica de Subclasse"
        ],
        "7": [
          "Magias de Pacto de 4º Círculo"
        ],
        "8": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "9": [
          "Magias de Pacto de 5º Círculo"
        ],
        "10": [
          "Característica de Subclasse"
        ],
        "11": [
          "Arcano Místico (Magia de 6º Círculo)"
        ],
        "12": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "13": [
          "Arcano Místico (Magia de 7º Círculo)"
        ],
        "14": [
          "Característica de Subclasse"
        ],
        "15": [
          "Arcano Místico (Magia de 8º Círculo)"
        ],
        "16": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "17": [
          "Arcano Místico (Magia de 9º Círculo)"
        ],
        "18": [
          "Invocações Místicas (Total 8)"
        ],
        "19": [
          "Aumento no Valor de Habilidade ou Talento Épico"
        ],
        "20": [
          "Mestre do Pacto (Recupera todos os espaços de magia em 1 minuto)"
        ]
      },
      "subclasses": [
        {
          "id": "fiend",
          "name": "O Demônio (Fiend)",
          "desc": "Pacto com lordes dos Nove Infernos ou Abismo, ganhando PV temporários ao abater inimigos e bênção da sorte infernal.",
          "bonusSpells": [
            "burning_hands",
            "command",
            "blindness_deafness",
            "scorching_ray",
            "fireball",
            "stinking_cloud",
            "fire_shield",
            "wall_of_fire",
            "flame_strike",
            "hallow"
          ]
        },
        {
          "id": "archfey",
          "name": "A Arquifada (Archfey)",
          "desc": "Pacto com seres caprichosos do Feywild com passos enevoados constantes, presenças aterrorizantes ou encantadoras.",
          "bonusSpells": [
            "faerie_fire",
            "sleep",
            "calm_emotions",
            "misty_step",
            "blink",
            "plant_growth",
            "dominate_beast",
            "greater_invisibility",
            "dominate_person",
            "seeming"
          ]
        },
        {
          "id": "celestial",
          "name": "O Celestial",
          "desc": "Pacto com anjos e seres das esferas superiores, concedendo luz e uma reserva de dados de cura por luz celestial.",
          "bonusSpells": [
            "light",
            "sacred_flame",
            "cure_wounds",
            "guiding_bolt",
            "flaming_sphere",
            "lesser_restoration",
            "daylight",
            "revivify",
            "guardian_of_faith",
            "wall_of_fire",
            "flame_strike",
            "greater_restoration"
          ]
        },
        {
          "id": "great_old_one",
          "name": "O Grande Antigo (Great Old One)",
          "desc": "Pacto com entidades cósmicas ancestrais alienígenas, projetando telepatia, pensamentos despertos e escudos psíquicos.",
          "bonusSpells": [
            "dissonant_whispers",
            "tashas_hideous_laughter",
            "detect_thoughts",
            "phantasmal_force",
            "clairvoyance",
            "hunger_of_hadar",
            "black_tentacles",
            "dominate_beast",
            "dominate_person",
            "telekinesis"
          ]
        }
      ]
    },
    {
      "id": "wizard",
      "name": "Mago",
      "hitDie": 6,
      "primaryAbility": [
        "int"
      ],
      "savingThrows": [
        "int",
        "wis"
      ],
      "armorProficiencies": [],
      "weaponProficiencies": [
        "Armas Simples"
      ],
      "toolProficiencies": [],
      "skillChoices": {
        "count": 2,
        "list": [
          "arcana",
          "history",
          "insight",
          "investigation",
          "medicine",
          "religion"
        ]
      },
      "spellcasting": {
        "type": "full",
        "ability": "int",
        "cantripsKnown": {
          "1": 3,
          "2": 3,
          "3": 3,
          "4": 4,
          "5": 4,
          "6": 4,
          "7": 4,
          "8": 4,
          "9": 4,
          "10": 5,
          "11": 5,
          "12": 5,
          "13": 5,
          "14": 5,
          "15": 5,
          "16": 5,
          "17": 5,
          "18": 5,
          "19": 5,
          "20": 5
        }
      },
      "subclassLevel": 3,
      "asiLevels": [
        4,
        8,
        12,
        16,
        19
      ],
      "featuresByLevel": {
        "1": [
          "Grimório de Magias",
          "Conjuração de Mago",
          "Recuperação Arcana (Arcane Recovery)",
          "Conjuração de Rituais"
        ],
        "2": [
          "Estudioso (Scholar - Especialização em 1 perícia acadêmica)"
        ],
        "3": [
          "Subclasse de Mago (Ordem Acadêmica)"
        ],
        "4": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "5": [
          "Magias de 3º Círculo"
        ],
        "6": [
          "Característica de Subclasse"
        ],
        "7": [
          "Magias de 4º Círculo"
        ],
        "8": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "9": [
          "Magias de 5º Círculo"
        ],
        "10": [
          "Característica de Subclasse"
        ],
        "11": [
          "Magias de 6º Círculo"
        ],
        "12": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "14": [
          "Característica de Subclasse"
        ],
        "16": [
          "Aumento no Valor de Habilidade ou Talento"
        ],
        "18": [
          "Domínio Mágico (Spell Mastery - Truque e Magia de 1º/2º círculo à vontade)"
        ],
        "19": [
          "Aumento no Valor de Habilidade ou Talento Épico"
        ],
        "20": [
          "Magias de Assinatura (Signature Spells)"
        ]
      },
      "subclasses": [
        {
          "id": "abjuration",
          "name": "Escola de Abjuração",
          "desc": "Especialistas em proteção e barreiras protetoras, erguendo um Égide Arcano que absorve dano direcionado ao mago e aliados.",
          "bonusSpells": [
            "shield",
            "counterspell"
          ]
        },
        {
          "id": "evocation",
          "name": "Escola de Evocação",
          "desc": "Mestres de explosões elementais devastadoras, moldando magias para criar bolsões de segurança para seus companheiros.",
          "bonusSpells": [
            "magic_missile",
            "fireball"
          ]
        },
        {
          "id": "divination",
          "name": "Escola de Adivinhação",
          "desc": "Clarividentes que preveem o futuro com Presságio (Portent), substituindo rolagens de dados de amigos ou inimigos.",
          "bonusSpells": [
            "detect_magic",
            "see_invisibility"
          ]
        },
        {
          "id": "illusion",
          "name": "Escola de Ilusão",
          "desc": "Mestres em enganar os sentidos, tornando ilusões palpáveis e manipulando a realidade visual do campo.",
          "bonusSpells": [
            "minor_illusion",
            "invisibility"
          ]
        }
      ]
    }
  ],
  "species": [
    {
      "id": "human",
      "name": "Humano",
      "speed": 9,
      "size": "Médio",
      "darkvision": 0,
      "traits": [
        {
          "name": "Versátil",
          "desc": "Ganha proficiência em uma perícia à sua escolha e um Talento de Origem adicional à sua escolha."
        },
        {
          "name": "Inspiração Heroica",
          "desc": "Ganha Inspiração Heroica no final de cada descanso longo."
        }
      ],
      "lineages": []
    },
    {
      "id": "elf",
      "name": "Elfo",
      "speed": 9,
      "size": "Médio",
      "darkvision": 18,
      "traits": [
        {
          "name": "Ancestralidade Feérica",
          "desc": "Vantagem em salvaguardas para evitar ou encerrar a condição Enfeitiçado."
        },
        {
          "name": "Sentidos Aguçados",
          "desc": "Proficiência gratuita na perícia Percepção."
        },
        {
          "name": "Transe",
          "desc": "Não precisa dormir; medita por 4 horas para ter os benefícios de um descanso longo."
        }
      ],
      "lineages": [
        {
          "id": "high_elf",
          "name": "Alto Elfo",
          "desc": "Ganha um Truque de Mago à sua escolha e pode trocá-lo a cada descanso longo. No 3º nível conjura Passo Nebuloso."
        },
        {
          "id": "wood_elf",
          "name": "Elfo da Floresta",
          "desc": "Deslocamento base aumentado para 10,5m (35 pés). No 3º nível conjura Passos Longos e no 5º Passos Sem Pegadas."
        },
        {
          "id": "drow",
          "name": "Drow (Elfo Negro)",
          "desc": "Visão no Escuro aumentada para 36 metros (120 pés). Conhece Globos de Luz, no 3º nível Escuridão e no 5º Fogo das Fadas."
        }
      ]
    },
    {
      "id": "dwarf",
      "name": "Anão",
      "speed": 9,
      "size": "Médio",
      "darkvision": 36,
      "traits": [
        {
          "name": "Resiliência Anã",
          "desc": "Resistência a dano de veneno e vantagem em salvaguardas contra veneno."
        },
        {
          "name": "Tenacidade Anã",
          "desc": "Seus pontos de vida máximos aumentam em 1 por nível."
        },
        {
          "name": "Sentido nas Rochas",
          "desc": "Visão no escuro ampliada e sentido sísmico em terreno de pedra."
        }
      ],
      "lineages": [
        {
          "id": "hill_dwarf",
          "name": "Anão da Colina",
          "desc": "Sabedoria afiada e intuição profunda com o mundo subterrâneo."
        },
        {
          "id": "mountain_dwarf",
          "name": "Anão da Montanha",
          "desc": "Físico portentoso talhado nas forjas e fortalezas montanhosas."
        }
      ]
    },
    {
      "id": "halfling",
      "name": "Halfling",
      "speed": 9,
      "size": "Pequeno",
      "darkvision": 0,
      "traits": [
        {
          "name": "Sortudo",
          "desc": "Ao tirar 1 em um d20 de ataque, teste ou salvaguarda, pode rolar novamente o dado."
        },
        {
          "name": "Bravura",
          "desc": "Vantagem em salvaguardas para evitar ou encerrar a condição Amedrontado."
        },
        {
          "name": "Agilidade Halfling",
          "desc": "Pode se mover através do espaço de qualquer criatura de tamanho maior que o seu."
        }
      ],
      "lineages": [
        {
          "id": "lightfoot",
          "name": "Pés-Leves",
          "desc": "Furtividade Natural: pode tentar se esconder mesmo estando atrás de uma criatura maior."
        },
        {
          "id": "stout",
          "name": "Robusto",
          "desc": "Resiliência robusta contra venenos herdada de ancestrais anões."
        }
      ]
    },
    {
      "id": "dragonborn",
      "name": "Draconato",
      "speed": 9,
      "size": "Médio",
      "darkvision": 18,
      "traits": [
        {
          "name": "Arma de Sopro",
          "desc": "Exala energia dracônica em cone de 4,5m ou linha de 9m (dano escala com o nível: 1d10 a 4d10)."
        },
        {
          "name": "Resistência Dracônica",
          "desc": "Resistência ao tipo de dano associado à sua cor ancestral."
        },
        {
          "name": "Voo Dracônico (Nível 5)",
          "desc": "Pode manifestar asas espectrais e voar com ação bônus por 10 minutos."
        }
      ],
      "lineages": [
        {
          "id": "red_dragon",
          "name": "Dragão Vermelho (Fogo)",
          "desc": "Sopro de Fogo em Cone (4,5m)."
        },
        {
          "id": "gold_dragon",
          "name": "Dragão Dourado (Fogo)",
          "desc": "Sopro de Fogo em Cone (4,5m)."
        },
        {
          "id": "blue_dragon",
          "name": "Dragão Azul (Elétrico)",
          "desc": "Sopro de Eletricidade em Linha (9m)."
        },
        {
          "id": "silver_dragon",
          "name": "Dragão Prateado (Frio)",
          "desc": "Sopro de Gelo em Cone (4,5m)."
        },
        {
          "id": "black_dragon",
          "name": "Dragão Negro (Ácido)",
          "desc": "Sopro de Ácido em Linha (9m)."
        },
        {
          "id": "green_dragon",
          "name": "Dragão Verde (Veneno)",
          "desc": "Sopro de Veneno em Cone (4,5m)."
        }
      ]
    },
    {
      "id": "gnome",
      "name": "Gnomo",
      "speed": 9,
      "size": "Pequeno",
      "darkvision": 18,
      "traits": [
        {
          "name": "Esperteza Gnômica",
          "desc": "Vantagem em todas as salvaguardas de Inteligência, Sabedoria e Carisma."
        }
      ],
      "lineages": [
        {
          "id": "forest_gnome",
          "name": "Gnomo da Floresta",
          "desc": "Conhece Ilusão Menor e pode falar com pequenos animais da floresta."
        },
        {
          "id": "rock_gnome",
          "name": "Gnomo das Rochas",
          "desc": "Conhece Prestidigitação e Ferramentas de Engenhoqueiro para criar artefatos mecânicos."
        }
      ]
    },
    {
      "id": "goliath",
      "name": "Golias",
      "speed": 10.5,
      "size": "Médio",
      "darkvision": 0,
      "traits": [
        {
          "name": "Porte Poderoso",
          "desc": "Conta como uma categoria de tamanho maior para capacidade de carga e arrasto."
        },
        {
          "name": "Forma de Gigante (Nível 5)",
          "desc": "Torna-se Grande como Ação Bônus por 10 minutos, ganhando vantagem em testes de Força e +3m de velocidade."
        }
      ],
      "lineages": [
        {
          "id": "cloud_giant",
          "name": "Ascendência de Gigante das Nuvens",
          "desc": "Salto Nebuloso: Teletransporta-se até 9 metros como Ação Bônus."
        },
        {
          "id": "fire_giant",
          "name": "Ascendência de Gigante do Fogo",
          "desc": "Golpe de Fogo: Causa 1d10 de dano de fogo adicional ao acertar um ataque."
        },
        {
          "id": "frost_giant",
          "name": "Ascendência de Gigante do Gelo",
          "desc": "Frio Cortante: Causa 1d6 de dano de frio e reduz a velocidade do alvo em 3m."
        },
        {
          "id": "stone_giant",
          "name": "Ascendência de Gigante da Pedra",
          "desc": "Resistência de Pedra: Reduz o dano recebido em 1d12 + CON como reação."
        }
      ]
    },
    {
      "id": "orc",
      "name": "Orc",
      "speed": 9,
      "size": "Médio",
      "darkvision": 36,
      "traits": [
        {
          "name": "Adrenalina (Rush)",
          "desc": "Pode Disparar como Ação Bônus e ganha pontos de vida temporários iguais ao Bônus de Proficiência."
        },
        {
          "name": "Resistência Implacável",
          "desc": "Ao ser reduzido a 0 PV mas não morrer imediatamente, fica com 1 PV (1 vez por descanso longo)."
        },
        {
          "name": "Físico Poderoso",
          "desc": "Capacidade de carga dobrada."
        }
      ],
      "lineages": []
    },
    {
      "id": "tiefling",
      "name": "Tiefling",
      "speed": 9,
      "size": "Médio",
      "darkvision": 18,
      "traits": [
        {
          "name": "Herança Sobrenatural",
          "desc": "Resistência a dano elemental e magias inatas conforme a linhagem."
        },
        {
          "name": "Taumaturgia",
          "desc": "Conhece o truque Taumaturgia gratuitamente."
        }
      ],
      "lineages": [
        {
          "id": "infernal",
          "name": "Linhagem Infernal",
          "desc": "Resistência a dano de Fogo. Conjura Repreensão Infernal no 3º nível e Escuridão no 5º nível."
        },
        {
          "id": "abyssal",
          "name": "Linhagem Abissal",
          "desc": "Resistência a dano de Veneno. Conjura Raio de Doença no 3º nível e Manter Pessoa no 5º nível."
        },
        {
          "id": "cthonic",
          "name": "Linhagem Ctoniana",
          "desc": "Resistência a dano Necrótico. Conjura Vitalidade Falsa no 3º nível e Raio do Enfraquecimento no 5º nível."
        }
      ]
    },
    {
      "id": "aasimar",
      "name": "Aasimar",
      "speed": 9,
      "size": "Médio",
      "darkvision": 18,
      "traits": [
        {
          "name": "Resistência Celestial",
          "desc": "Resistência a dano Necrótico e dano Radiante."
        },
        {
          "name": "Mãos Que Curam",
          "desc": "Com uma ação, toca uma criatura e restaura PV iguais a rolagens de d4s iguais ao seu Bônus de Proficiência."
        },
        {
          "name": "Luz Divina",
          "desc": "Conhece o truque Luz."
        }
      ],
      "lineages": [
        {
          "id": "necrotic_shroud",
          "name": "Mortalha Necrótica",
          "desc": "Asas esqueléticas e olhos negros, aterrorizando inimigos próximos e causando dano necrótico extra."
        },
        {
          "id": "radiant_consumption",
          "name": "Consumo Radiante",
          "desc": "Irradia calor solar intenso, causando dano radiante a si e aos inimigos no raio."
        },
        {
          "id": "radiant_soul",
          "name": "Alma Radiante",
          "desc": "Manifesta asas luminosas com velocidade de voo e dano radiante adicional em um ataque por turno."
        }
      ]
    }
  ],
  "backgrounds": [
    {
      "id": "custom",
      "name": "Personalizado (Custom)",
      "abilityOptions": [
        "str",
        "dex",
        "con",
        "int",
        "wis",
        "cha"
      ],
      "feat": "custom_origin",
      "featName": "Talento de Origem à Escolha",
      "skills": [],
      "tools": [
        "Uma ferramenta à escolha"
      ],
      "equipmentDesc": "Equipamento à sua escolha, 50 PO.",
      "startingGold": 50,
      "isCustom": true
    },
    {
      "id": "acolyte",
      "name": "Acólito",
      "abilityOptions": [
        "int",
        "wis",
        "cha"
      ],
      "feat": "magic_initiate_cleric",
      "featName": "Iniciado em Magia (Clérigo)",
      "skills": [
        "insight",
        "religion"
      ],
      "tools": [
        "Kit de Caligrafia"
      ],
      "equipmentDesc": "Símbolo Sagrado, Kit de Caligrafia, Livro de Orações, Manto de Cerimônia, 8 PO.",
      "startingGold": 50
    },
    {
      "id": "artisan",
      "name": "Artesão da Guilda",
      "abilityOptions": [
        "str",
        "dex",
        "int"
      ],
      "feat": "crafter",
      "featName": "Artesão (Crafter)",
      "skills": [
        "investigation",
        "persuasion"
      ],
      "tools": [
        "Um conjunto de Ferramentas de Artesão à escolha"
      ],
      "equipmentDesc": "Ferramentas de Artesão, Carta de Apresentação da Guilda, Roupas de Viagem, 15 PO.",
      "startingGold": 50
    },
    {
      "id": "charlatan",
      "name": "Charlatão",
      "abilityOptions": [
        "dex",
        "con",
        "cha"
      ],
      "feat": "skilled",
      "featName": "Habilidoso (Skilled)",
      "skills": [
        "deception",
        "sleight_of_hand"
      ],
      "tools": [
        "Kit de Disfarce",
        "Kit de Falsificação"
      ],
      "equipmentDesc": "Kit de Disfarce, Ferramentas de Trapaça (dados viciados), Roupas Finas, 15 PO.",
      "startingGold": 50
    },
    {
      "id": "criminal",
      "name": "Criminoso",
      "abilityOptions": [
        "dex",
        "con",
        "int"
      ],
      "feat": "alert",
      "featName": "Alerta (Alert)",
      "skills": [
        "stealth",
        "sleight_of_hand"
      ],
      "tools": [
        "Ferramentas de Ladrão",
        "Um jogo de dados"
      ],
      "equipmentDesc": "Ferramentas de Ladrão, Pé de Cabra, Roupas Escuras com Capuz, 16 PO.",
      "startingGold": 50
    },
    {
      "id": "entertainer",
      "name": "Artista",
      "abilityOptions": [
        "str",
        "dex",
        "cha"
      ],
      "feat": "musician",
      "featName": "Músico (Musician)",
      "skills": [
        "acrobatics",
        "performance"
      ],
      "tools": [
        "Kit de Disfarce",
        "Um instrumento musical"
      ],
      "equipmentDesc": "Instrumento Musical, Roupas Teatrais, Traje Elegante, 18 PO.",
      "startingGold": 50
    },
    {
      "id": "farmer",
      "name": "Fazendeiro",
      "abilityOptions": [
        "str",
        "con",
        "wis"
      ],
      "feat": "tough",
      "featName": "Duro de Matar (Tough)",
      "skills": [
        "animal_handling",
        "nature"
      ],
      "tools": [
        "Ferramentas de Carpinteiro"
      ],
      "equipmentDesc": "Ferramentas Agrícolas, Foice, Roupas de Trabalho Pesado, 15 PO.",
      "startingGold": 50
    },
    {
      "id": "guard",
      "name": "Guarda",
      "abilityOptions": [
        "str",
        "int",
        "wis"
      ],
      "feat": "alert",
      "featName": "Alerta (Alert)",
      "skills": [
        "athletics",
        "perception"
      ],
      "tools": [
        "Um conjunto de Jogos"
      ],
      "equipmentDesc": "Lança, Apito de Guarda, Manilhas, Roupas de Patrulha, 12 PO.",
      "startingGold": 50
    },
    {
      "id": "guide",
      "name": "Guia",
      "abilityOptions": [
        "dex",
        "con",
        "wis"
      ],
      "feat": "magic_initiate_druid",
      "featName": "Iniciado em Magia (Druida)",
      "skills": [
        "stealth",
        "survival"
      ],
      "tools": [
        "Kit de Navegação",
        "Kit de Cartógrafo"
      ],
      "equipmentDesc": "Bússola/Kit de Navegação, Roupas de Viagem para Todo Clima, Cajado, 12 PO.",
      "startingGold": 50
    },
    {
      "id": "hermit",
      "name": "Eremita",
      "abilityOptions": [
        "con",
        "wis",
        "cha"
      ],
      "feat": "healer",
      "featName": "Curandeiro (Healer)",
      "skills": [
        "medicine",
        "religion"
      ],
      "tools": [
        "Kit de Herbalismo"
      ],
      "equipmentDesc": "Kit de Herbalismo, Notas de Descoberta Espiritual, Cobertor de Inverno, 15 PO.",
      "startingGold": 50
    },
    {
      "id": "noble",
      "name": "Nobre",
      "abilityOptions": [
        "str",
        "int",
        "cha"
      ],
      "feat": "skilled",
      "featName": "Habilidoso (Skilled)",
      "skills": [
        "history",
        "persuasion"
      ],
      "tools": [
        "Um jogo de Xadrez do Dragão"
      ],
      "equipmentDesc": "Roupas da Alta Aristocracia, Anel com Selo de Brasão Nobre, Pergaminho Genealógico, 25 PO.",
      "startingGold": 50
    },
    {
      "id": "sailor",
      "name": "Marinheiro",
      "abilityOptions": [
        "str",
        "dex",
        "wis"
      ],
      "feat": "tavern_brawler",
      "featName": "Lutador de Taverna (Tavern Brawler)",
      "skills": [
        "athletics",
        "perception"
      ],
      "tools": [
        "Ferramentas de Navegador"
      ],
      "equipmentDesc": "Ferramentas de Navegador, Corda de Seda (15m), Amuleto da Sorte, 10 PO.",
      "startingGold": 50
    },
    {
      "id": "sage",
      "name": "Sábio",
      "abilityOptions": [
        "con",
        "int",
        "wis"
      ],
      "feat": "magic_initiate_wizard",
      "featName": "Iniciado em Magia (Mago)",
      "skills": [
        "arcana",
        "history"
      ],
      "tools": [
        "Kit de Caligrafia"
      ],
      "equipmentDesc": "Vidro de Tinta Preta, Pena, Pequena Faca, Carta com Pergunta Filosófica Não Respondida, 10 PO.",
      "startingGold": 50
    },
    {
      "id": "soldier",
      "name": "Soldado",
      "abilityOptions": [
        "str",
        "dex",
        "con"
      ],
      "feat": "savage_attacker",
      "featName": "Atacante Selvagem (Savage Attacker)",
      "skills": [
        "athletics",
        "intimidation"
      ],
      "tools": [
        "Um conjunto de Jogos (Cartas)"
      ],
      "equipmentDesc": "Insígnia de Posto Militar, Adaga, Troféu de Guerra, Baralho de Cartas, 14 PO.",
      "startingGold": 50
    },
    {
      "id": "urchin",
      "name": "Órfão / Moleque de Rua",
      "abilityOptions": [
        "dex",
        "con",
        "wis"
      ],
      "feat": "lucky",
      "featName": "Sortudo (Lucky)",
      "skills": [
        "sleight_of_hand",
        "stealth"
      ],
      "tools": [
        "Kit de Disfarce",
        "Ferramentas de Ladrão"
      ],
      "equipmentDesc": "Faca Pequena, Mapa da Cidade Natal, Rato de Estimação / Token Familiar, 10 PO.",
      "startingGold": 50
    }
  ],
  "feats": [
    {
      "id": "alert",
      "name": "Alerta (Alert)",
      "type": "origin",
      "prereq": "Nenhum (Talento de Origem)",
      "desc": "Soma seu Bônus de Proficiência na Iniciativa. Além disso, pode trocar sua iniciativa com um aliado voluntário no início do combate."
    },
    {
      "id": "crafter",
      "name": "Artesão (Crafter)",
      "type": "origin",
      "prereq": "Nenhum (Talento de Origem)",
      "desc": "Ganha proficiência em 3 ferramentas de artesão. Pode produzir itens rapidamente durante descansos com 20% de desconto nos custos de matéria-prima."
    },
    {
      "id": "healer",
      "name": "Curandeiro (Healer)",
      "type": "origin",
      "prereq": "Nenhum (Talento de Origem)",
      "desc": "Ao usar um Kit de Primeiros Socorros para estabilizar, a criatura recupera 1 PV. Pode gastar 1 uso do kit para curar 1d6 + 4 + PB de uma criatura uma vez por descanso."
    },
    {
      "id": "lucky",
      "name": "Sortudo (Lucky)",
      "type": "origin",
      "prereq": "Nenhum (Talento de Origem)",
      "desc": "Ganha Pontos de Sorte iguais ao seu Bônus de Proficiência por descanso longo. Gaste 1 ponto para ganhar Vantagem em uma jogada de d20 ou impor Desvantagem em um ataque contra você."
    },
    {
      "id": "magic_initiate_cleric",
      "name": "Iniciado em Magia (Clérigo)",
      "type": "origin",
      "prereq": "Nenhum (Talento de Origem)",
      "desc": "Aprende 2 Truques e 1 Magia de 1º círculo da lista do Clérigo (Sabedoria). A magia pode ser conjurada 1 vez grátis por descanso longo ou com espaços de magia."
    },
    {
      "id": "magic_initiate_druid",
      "name": "Iniciado em Magia (Druida)",
      "type": "origin",
      "prereq": "Nenhum (Talento de Origem)",
      "desc": "Aprende 2 Truques e 1 Magia de 1º círculo da lista do Druida (Sabedoria). A magia pode ser conjurada 1 vez grátis por descanso longo ou com espaços de magia."
    },
    {
      "id": "magic_initiate_wizard",
      "name": "Iniciado em Magia (Mago)",
      "type": "origin",
      "prereq": "Nenhum (Talento de Origem)",
      "desc": "Aprende 2 Truques e 1 Magia de 1º círculo da lista do Mago (Inteligência). A magia pode ser conjurada 1 vez grátis por descanso longo ou com espaços de magia."
    },
    {
      "id": "musician",
      "name": "Músico (Musician)",
      "type": "origin",
      "prereq": "Nenhum (Talento de Origem)",
      "desc": "Ao final de um descanso curto ou longo, toque uma canção para conceder Inspiração Heroica a um número de aliados igual ao seu Bônus de Proficiência."
    },
    {
      "id": "savage_attacker",
      "name": "Atacante Selvagem (Savage Attacker)",
      "type": "origin",
      "prereq": "Nenhum (Talento de Origem)",
      "desc": "Uma vez por turno ao acertar um ataque com arma, role o dano da arma duas vezes e use o maior resultado."
    },
    {
      "id": "skilled",
      "name": "Habilidoso (Skilled)",
      "type": "origin",
      "prereq": "Nenhum (Talento de Origem)",
      "desc": "Ganha proficiência em qualquer combinação de 3 perícias ou ferramentas à sua escolha."
    },
    {
      "id": "tavern_brawler",
      "name": "Lutador de Taverna (Tavern Brawler)",
      "type": "origin",
      "prereq": "Nenhum (Talento de Origem)",
      "desc": "Ataques desarmados causam 1d4 + FOR de dano. Pode empurrar alvos 1,5m após acertar um ataque desarmado e rolar novamente 1s no dano."
    },
    {
      "id": "tough",
      "name": "Duro de Matar (Tough)",
      "type": "origin",
      "prereq": "Nenhum (Talento de Origem)",
      "desc": "Seus pontos de vida máximos aumentam em uma quantidade igual a 2 vezes o seu nível total de personagem (retroativo)."
    },
    {
      "id": "fighting_style_archery",
      "name": "Estilo: Arqueirismo (Archery)",
      "type": "fighting_style",
      "prereq": "Característica Estilo de Luta",
      "desc": "+2 de bônus em jogadas de ataque feitas com armas de ataque à distância."
    },
    {
      "id": "fighting_style_blind_fighting",
      "name": "Estilo: Luta Cega (Blind Fighting)",
      "type": "fighting_style",
      "prereq": "Característica Estilo de Luta",
      "desc": "Ganha Percepção às Cegas (Blindsight) com alcance de 3 metros (10 pés)."
    },
    {
      "id": "fighting_style_defense",
      "name": "Estilo: Defesa (Defense)",
      "type": "fighting_style",
      "prereq": "Característica Estilo de Luta",
      "desc": "Ganha +1 de bônus na Classe de Armadura enquanto estiver usando qualquer armadura."
    },
    {
      "id": "fighting_style_dueling",
      "name": "Estilo: Duelismo (Dueling)",
      "type": "fighting_style",
      "prereq": "Característica Estilo de Luta",
      "desc": "+2 de bônus nas jogadas de dano ao empunhar uma arma corpo a corpo em uma mão e nenhuma outra arma."
    },
    {
      "id": "fighting_style_great_weapon",
      "name": "Estilo: Grandes Armas (Great Weapon)",
      "type": "fighting_style",
      "prereq": "Característica Estilo de Luta",
      "desc": "Ao rolar 1 ou 2 em dado de dano de ataque com arma de duas mãos, pode rolar o dado novamente."
    },
    {
      "id": "fighting_style_interception",
      "name": "Estilo: Interceptação (Interception)",
      "type": "fighting_style",
      "prereq": "Característica Estilo de Luta",
      "desc": "Quando uma criatura a 1,5m sofrer dano, use sua Reação com escudo ou arma para reduzir o dano em 1d10 + PB."
    },
    {
      "id": "fighting_style_protection",
      "name": "Estilo: Proteção (Protection)",
      "type": "fighting_style",
      "prereq": "Característica Estilo de Luta",
      "desc": "Quando um inimigo atacar um aliado a 1,5m de você, use sua Reação com escudo para impor Desvantagem no ataque."
    },
    {
      "id": "fighting_style_thrown_weapon",
      "name": "Estilo: Armas de Arremesso (Thrown Weapon)",
      "type": "fighting_style",
      "prereq": "Característica Estilo de Luta",
      "desc": "Pode sacar uma arma arremessável como parte do ataque e ganha +2 de bônus nas jogadas de dano."
    },
    {
      "id": "fighting_style_two_weapon",
      "name": "Estilo: Duas Armas (Two-Weapon Fighting)",
      "type": "fighting_style",
      "prereq": "Característica Estilo de Luta",
      "desc": "Ao realizar o ataque extra do combate com duas armas, adiciona seu modificador de atributo ao dano."
    },
    {
      "id": "fighting_style_unarmed",
      "name": "Estilo: Combate Desarmado (Unarmed Fighting)",
      "type": "fighting_style",
      "prereq": "Característica Estilo de Luta",
      "desc": "Ataques desarmados causam 1d6 + FOR (ou 1d8 se ambas as mãos estiverem livres). Causa 1d4 de dano automático no início do turno a quem agarrar."
    },
    {
      "id": "actor",
      "name": "Ator (Actor)",
      "type": "general",
      "prereq": "Nível 4+, Carisma 13+",
      "desc": "+1 em CAR. Vantagem em testes de Enganação e Atuação para se passar por outra pessoa; mimetiza vozes e sons de criaturas."
    },
    {
      "id": "athlete",
      "name": "Atleta (Athlete)",
      "type": "general",
      "prereq": "Nível 4+, Força ou Destreza 13+",
      "desc": "+1 em FOR ou DES. Levantar do chão custa apenas 1,5m de deslocamento, escalar não custa movimento extra e salto em distância requer apenas 1,5m de corrida."
    },
    {
      "id": "charger",
      "name": "Investida Poderosa (Charger)",
      "type": "general",
      "prereq": "Nível 4+, Força ou Destreza 13+",
      "desc": "+1 em FOR ou DES. Se mover pelo menos 3 metros em linha reta antes de atacar, causa +1d8 de dano extra ou empurra o alvo 3 metros."
    },
    {
      "id": "chef",
      "name": "Chef de Cozinha (Chef)",
      "type": "general",
      "prereq": "Nível 4+, Constituição ou Sabedoria 13+",
      "desc": "+1 em CON ou SAB. Prepara refeições especiais em descanso curto que curam 1d8 PV adicionais, e produz guloseimas que concedem PV temporários iguais a PB."
    },
    {
      "id": "crossbow_expert",
      "name": "Especialista em Besta (Crossbow Expert)",
      "type": "general",
      "prereq": "Nível 4+, Destreza 13+",
      "desc": "+1 em DES. Ignora a propriedade de recarga de bestas, pode atirar corpo a corpo sem desvantagem e dispara besta de mão com Ação Bônus."
    },
    {
      "id": "crusher",
      "name": "Esmagador (Crusher)",
      "type": "general",
      "prereq": "Nível 4+, Força ou Constituição 13+",
      "desc": "+1 em FOR ou CON. 1x/turno ao causar dano de concussão empurra o alvo 1,5m; crítico concede Vantagem em todos os ataques contra o alvo até seu próximo turno."
    },
    {
      "id": "defensive_duelist",
      "name": "Duelista Defensivo (Defensive Duelist)",
      "type": "general",
      "prereq": "Nível 4+, Destreza 13+",
      "desc": "+1 em DES. Ao empunhar arma com Acuidade e ser atingido corpo a corpo, use sua Reação para somar seu PB na CA contra aquele ataque."
    },
    {
      "id": "elemental_adept",
      "name": "Conjurador Elemental (Elemental Adept)",
      "type": "general",
      "prereq": "Nível 4+, Conjurador",
      "desc": "+1 em INT, SAB ou CAR. Suas magias do elemento escolhido (Fogo, Frio, Elétrico, Ácido ou Trovão) ignoram resistência e tratam 1s no dano como 2s."
    },
    {
      "id": "fey_touched",
      "name": "Tocado pelo Reino Feérico (Fey Touched)",
      "type": "general",
      "prereq": "Nível 4+",
      "desc": "+1 em INT, SAB ou CAR. Aprende Passo Sombrio (Misty Step) e 1 magia de 1º círculo (Adivinhação/Encantamento), conjuráveis 1x grátis por descanso longo."
    },
    {
      "id": "grappler",
      "name": "Especialista em Agarrar (Grappler)",
      "type": "general",
      "prereq": "Nível 4+, Força ou Destreza 13+",
      "desc": "+1 em FOR ou DES. Vantagem em jogadas de ataque contra criatura agarrada por você; seu deslocamento não é reduzido ao arrastar criaturas agarradas."
    },
    {
      "id": "great_weapon_master",
      "name": "Mestre em Armas Grandes (Great Weapon Master)",
      "type": "general",
      "prereq": "Nível 4+, Força 13+",
      "desc": "+1 em FOR. Soma seu PB ao dano com armas pesadas. Ao acertar um acerto crítico ou reduzir criatura a 0 PV, desfere um ataque adicional com Ação Bônus."
    },
    {
      "id": "heavy_armor_master",
      "name": "Mestre em Armaduras Pesadas (Heavy Armor Master)",
      "type": "general",
      "prereq": "Nível 4+, Proficiência com Armaduras Pesadas",
      "desc": "+1 em FOR. Reduz todo dano não-mágico cortante, perfurante e de concussão recebido em valor igual ao seu Bônus de Proficiência."
    },
    {
      "id": "inspiring_leader",
      "name": "Líder Inspirador (Inspiring Leader)",
      "type": "general",
      "prereq": "Nível 4+, Sabedoria ou Carisma 13+",
      "desc": "+1 em SAB ou CAR. Discurso de 10 min concede PV temporários iguais a Nível + Modificador a até 6 aliados por descanso."
    },
    {
      "id": "mage_slayer",
      "name": "Matador de Magos (Mage Slayer)",
      "type": "general",
      "prereq": "Nível 4+, Força ou Destreza 13+",
      "desc": "+1 em FOR ou DES. Reação para atacar criatura que conjurar magia adjacente a você, impõe desvantagem na concentração e ganha vantagem em salvaguardas mágicas."
    },
    {
      "id": "medium_armor_master",
      "name": "Mestre em Armaduras Médias (Medium Armor Master)",
      "type": "general",
      "prereq": "Nível 4+, Proficiência com Armaduras Médias",
      "desc": "+1 em FOR ou DES. Permite somar até +3 de Destreza na CA usando armadura média e elimina a desvantagem em testes de Furtividade."
    },
    {
      "id": "mounted_combatant",
      "name": "Combatente Montado (Mounted Combatant)",
      "type": "general",
      "prereq": "Nível 4+",
      "desc": "+1 em FOR, DES ou SAB. Vantagem em ataques corpo a corpo contra criaturas menores que sua montaria, e pode forçar ataques contra a montaria a mirarem em você."
    },
    {
      "id": "observant",
      "name": "Observador (Observant)",
      "type": "general",
      "prereq": "Nível 4+, Inteligência ou Sabedoria 13+",
      "desc": "+1 em INT ou SAB. Ganha +5 de bônus permanente em Percepção Passiva e Investigação Passiva; leitura labial precisa."
    },
    {
      "id": "piercer",
      "name": "Perfurador (Piercer)",
      "type": "general",
      "prereq": "Nível 4+, Força ou Destreza 13+",
      "desc": "+1 em FOR ou DES. 1x/turno rola novamente um dado de dano perfurante; no acerto crítico adiciona 1 dado extra de dano da arma."
    },
    {
      "id": "poisoner",
      "name": "Mestre dos Venenos (Poisoner)",
      "type": "general",
      "prereq": "Nível 4+, Destreza ou Inteligência 13+",
      "desc": "+1 em DES ou INT. Seus danos de veneno ignoram resistência; aplica veneno em armas como Ação Bônus e produz venenos potentes."
    },
    {
      "id": "polearm_master",
      "name": "Mestre de Armas de Haste (Polearm Master)",
      "type": "general",
      "prereq": "Nível 4+, Força ou Destreza 13+",
      "desc": "+1 em FOR ou DES. Ao atacar com alabarda, glaive ou bordão, faz ataque bônus com a outra ponta (1d4) e ataca criaturas que entram no seu alcance."
    },
    {
      "id": "resilient",
      "name": "Resiliente (Resilient)",
      "type": "general",
      "prereq": "Nível 4+",
      "desc": "+1 no atributo escolhido (FOR, DES, CON, INT, SAB ou CAR) e ganha Proficiência nas Salvaguardas desse atributo."
    },
    {
      "id": "ritual_caster",
      "name": "Conjurador de Rituais (Ritual Caster)",
      "type": "general",
      "prereq": "Nível 4+, Inteligência ou Sabedoria 13+",
      "desc": "+1 em INT, SAB ou CAR. Ganha um Grimório de Rituais podendo conjurar magias com a tag Ritual sem gastar espaços de magia."
    },
    {
      "id": "sentinel",
      "name": "Sentinela (Sentinel)",
      "type": "general",
      "prereq": "Nível 4+, Força ou Destreza 13+",
      "desc": "+1 em FOR ou DES. Acertar ataque de oportunidade reduz a velocidade do alvo para 0. Desfere ataques de oportunidade mesmo se o alvo Desengajar."
    },
    {
      "id": "shadow_touched",
      "name": "Tocado pelas Sombras (Shadow Touched)",
      "type": "general",
      "prereq": "Nível 4+",
      "desc": "+1 em INT, SAB ou CAR. Aprende Invisibilidade e 1 magia de 1º círculo (Ilusão/Necromancia), conjuráveis 1x grátis por descanso longo."
    },
    {
      "id": "sharpshooter",
      "name": "Atirador Aguçado (Sharpshooter)",
      "type": "general",
      "prereq": "Nível 4+, Destreza 13+",
      "desc": "+1 em DES. Ataques à distância ignoram meia e 3/4 de cobertura, alcance longo não impõe desvantagem e pode disparar corpo a corpo sem penalidade."
    },
    {
      "id": "shield_master",
      "name": "Mestre em Escudos (Shield Master)",
      "type": "general",
      "prereq": "Nível 4+, Proficiência com Escudos",
      "desc": "+1 em FOR. Empurra ou derruba inimigos com escudo como Ação Bônus, soma bônus do escudo em salvaguardas de DES e usa Reação para anular dano em sucesso de DES."
    },
    {
      "id": "skill_expert",
      "name": "Especialista em Perícias (Skill Expert)",
      "type": "general",
      "prereq": "Nível 4+",
      "desc": "+1 no atributo à sua escolha, ganha Proficiência em 1 perícia e Especialização (dobro do PB) em 1 perícia já treinada."
    },
    {
      "id": "slasher",
      "name": "Cortador (Slasher)",
      "type": "general",
      "prereq": "Nível 4+, Força ou Destreza 13+",
      "desc": "+1 em FOR ou DES. 1x/turno ao causar dano cortante reduz a velocidade do alvo em 3 metros; acerto crítico impõe Desvantagem em todos os ataques dele."
    },
    {
      "id": "speedster",
      "name": "Velocista / Mobilidade (Speedster)",
      "type": "general",
      "prereq": "Nível 4+, Destreza ou Constituição 13+",
      "desc": "+1 em DES ou CON. Seu deslocamento aumenta em +3 metros; ao correr em Disparada ignora terreno difícil e atacar uma criatura impede ataques de oportunidade dela."
    },
    {
      "id": "spell_sniper",
      "name": "Franco-Atirador Arcano (Spell Sniper)",
      "type": "general",
      "prereq": "Nível 4+, Conjurador",
      "desc": "+1 em INT, SAB ou CAR. Dobra o alcance de magias com jogadas de ataque, ignora meia e 3/4 de cobertura e pode conjurar ataques mágicos corpo a corpo sem desvantagem."
    },
    {
      "id": "telekinetic",
      "name": "Telecinético (Telekinetic)",
      "type": "general",
      "prereq": "Nível 4+",
      "desc": "+1 em INT, SAB ou CAR. Aprende Mãos Mágicas invisível com alcance dobrado e usa Ação Bônus para empurrar ou puxar criaturas a até 9 metros."
    },
    {
      "id": "telepathic",
      "name": "Telepata (Telepathic)",
      "type": "general",
      "prereq": "Nível 4+",
      "desc": "+1 em INT, SAB ou CAR. Fala telepaticamente com criaturas a até 18 metros e conjura Detectar Pensamentos 1x ao dia sem gastar espaços de magia."
    },
    {
      "id": "war_caster",
      "name": "Conjurador de Guerra (War Caster)",
      "type": "general",
      "prereq": "Nível 4+, Conjurador",
      "desc": "+1 em INT, SAB ou CAR. Vantagem em salvaguardas de CON para concentração, realiza componentes somáticos com armas em mãos e conjura magias como Reação de oportunidade."
    },
    {
      "id": "boon_combat_prowess",
      "name": "Dádiva da Proeza de Combate",
      "type": "epic_boon",
      "prereq": "Nível 19+",
      "desc": "+1 em um atributo (máximo 30). 1 vez por turno, ao errar uma jogada de ataque, você pode transformá-la em um acerto."
    },
    {
      "id": "boon_dimensional_travel",
      "name": "Dádiva da Viagem Dimensional",
      "type": "epic_boon",
      "prereq": "Nível 19+",
      "desc": "+1 em um atributo (máximo 30). Imediatamente após realizar a ação de Ataque ou Magia, pode se teletransportar até 9 metros sem gastar movimento."
    },
    {
      "id": "boon_energy_resistance",
      "name": "Dádiva da Resistência Energética",
      "type": "epic_boon",
      "prereq": "Nível 19+",
      "desc": "+1 em um atributo (máximo 30). Ganha resistência permanente a 2 tipos de dano elemental à sua escolha (podendo trocar ao fim de descanso longo)."
    },
    {
      "id": "boon_fate",
      "name": "Dádiva do Destino",
      "type": "epic_boon",
      "prereq": "Nível 19+",
      "desc": "+1 em um atributo (máximo 30). Quando você ou criatura a 18m rolar um d20, pode adicionar ou subtrair 2d4 do resultado final como Reação."
    },
    {
      "id": "boon_fortitude",
      "name": "Dádiva da Fortitude Épica",
      "type": "epic_boon",
      "prereq": "Nível 19+",
      "desc": "+1 em um atributo (máximo 30). Seus PV máximos aumentam em 40; ao receber qualquer cura, recupera PV adicionais iguais ao seu modificador de Constituição."
    },
    {
      "id": "boon_irresistible_offense",
      "name": "Dádiva da Ofensiva Irresistível",
      "type": "epic_boon",
      "prereq": "Nível 19+",
      "desc": "+1 em um atributo (máximo 30). Todos os seus ataques e danos ignoram completamente resistências a dano; em acerto crítico causa dano extra igual ao seu valor de atributo."
    },
    {
      "id": "boon_night_spirit",
      "name": "Dádiva do Espírito Noturno",
      "type": "epic_boon",
      "prereq": "Nível 19+",
      "desc": "+1 em um atributo (máximo 30). Enquanto estiver em penumbra ou escuridão, fica Invisível como Ação Bônus e ganha resistência a todos os danos exceto psíquico e radiante."
    },
    {
      "id": "boon_recovery",
      "name": "Dádiva da Recuperação Heroica",
      "type": "epic_boon",
      "prereq": "Nível 19+",
      "desc": "+1 em um atributo (máximo 30). Ao cair a 0 PV, você pode recuperar instantaneamente metade dos seus pontos de vida máximos (1 vez por descanso longo)."
    },
    {
      "id": "boon_speed",
      "name": "Dádiva da Velocidade Suprema",
      "type": "epic_boon",
      "prereq": "Nível 19+",
      "desc": "+1 em um atributo (máximo 30). Seu deslocamento aumenta em +9 metros; você pode realizar a ação de Desengajar como Ação Bônus."
    },
    {
      "id": "boon_truesight",
      "name": "Dádiva da Visão Verdadeira",
      "type": "epic_boon",
      "prereq": "Nível 19+",
      "desc": "+1 em um atributo (máximo 30). Você ganha Visão da Verdade (Truesight) permanente com alcance de 18 metros."
    }
  ],
  "weaponMasteries": [
    {
      "id": "vex",
      "name": "Irritar (Vex)",
      "desc": "Se você atingir uma criatura e causar dano com esta arma, você ganha Vantagem na sua próxima jogada de ataque contra essa mesma criatura antes do final do seu próximo turno."
    },
    {
      "id": "nick",
      "name": "Corte Ágil (Nick)",
      "desc": "Permite que o ataque adicional do Combate com Duas Armas seja feito como parte da ação de Ataque em vez de gastar uma Ação Bônus (1 vez por turno)."
    },
    {
      "id": "push",
      "name": "Empurrar (Push)",
      "desc": "Se você atingir uma criatura, você pode empurrá-la até 3 metros (10 pés) em linha reta para longe de você, se ela for de tamanho Grande ou menor."
    },
    {
      "id": "topple",
      "name": "Derrubar (Topple)",
      "desc": "Se você atingir uma criatura, você pode forçá-la a fazer uma salvaguarda de Constituição (CD 8 + PB + Mod do Atributo de Ataque). Se falhar, ela fica Derrubada (Caída)."
    },
    {
      "id": "sap",
      "name": "Debilitar (Sap)",
      "desc": "Se você atingir uma criatura, ela tem Desvantagem na próxima jogada de ataque que fizer antes do início do seu próximo turno."
    },
    {
      "id": "slow",
      "name": "Abrandar (Slow)",
      "desc": "Se você atingir uma criatura e causar dano, o deslocamento dela é reduzido em 3 metros (10 pés) até o início do seu próximo turno."
    },
    {
      "id": "graze",
      "name": "Arranhão (Graze)",
      "desc": "Se você errar uma jogada de ataque contra uma criatura, você ainda causa dano igual ao modificador de habilidade usado no ataque."
    },
    {
      "id": "cleave",
      "name": "Trespassar (Cleave)",
      "desc": "Se você atingir uma criatura, pode fazer um ataque adicional contra uma segunda criatura adjacente a ela a até 1,5m de você (causa apenas o dano da arma sem modificador de atributo)."
    }
  ],
  "weapons": [
    {
      "id": "dagger",
      "name": "Adaga",
      "category": "Simples",
      "type": "Corpo a Corpo",
      "cost": "2 PO",
      "damage": "1d4",
      "damageType": "Perfurante",
      "mastery": "nick",
      "masteryName": "Corte Ágil (Nick)",
      "properties": [
        "Acuidade",
        "Leve",
        "Arremesso (alcance 6/18m)"
      ],
      "weight": 0.5
    },
    {
      "id": "quarterstaff",
      "name": "Bordão",
      "category": "Simples",
      "type": "Corpo a Corpo",
      "cost": "2 PP",
      "damage": "1d6",
      "damageType": "Contundente",
      "mastery": "topple",
      "masteryName": "Derrubar (Topple)",
      "properties": [
        "Versátil (1d8)"
      ],
      "weight": 2
    },
    {
      "id": "spear",
      "name": "Lança",
      "category": "Simples",
      "type": "Corpo a Corpo",
      "cost": "1 PO",
      "damage": "1d6",
      "damageType": "Perfurante",
      "mastery": "sap",
      "masteryName": "Debilitar (Sap)",
      "properties": [
        "Arremesso (alcance 6/18m)",
        "Versátil (1d8)"
      ],
      "weight": 1.5
    },
    {
      "id": "mace",
      "name": "Maça",
      "category": "Simples",
      "type": "Corpo a Corpo",
      "cost": "5 PO",
      "damage": "1d6",
      "damageType": "Contundente",
      "mastery": "sap",
      "masteryName": "Debilitar (Sap)",
      "properties": [],
      "weight": 2
    },
    {
      "id": "handaxe",
      "name": "Machadinha",
      "category": "Simples",
      "type": "Corpo a Corpo",
      "cost": "5 PO",
      "damage": "1d6",
      "damageType": "Cortante",
      "mastery": "vex",
      "masteryName": "Irritar (Vex)",
      "properties": [
        "Leve",
        "Arremesso (alcance 6/18m)"
      ],
      "weight": 1
    },
    {
      "id": "light_crossbow",
      "name": "Besta Leve",
      "category": "Simples",
      "type": "Distância",
      "cost": "25 PO",
      "damage": "1d8",
      "damageType": "Perfurante",
      "mastery": "slow",
      "masteryName": "Abrandar (Slow)",
      "properties": [
        "Munição (alcance 24/96m)",
        "Recarga",
        "Duas Mãos"
      ],
      "weight": 2.5
    },
    {
      "id": "shortbow",
      "name": "Arco Curto",
      "category": "Simples",
      "type": "Distância",
      "cost": "25 PO",
      "damage": "1d6",
      "damageType": "Perfurante",
      "mastery": "vex",
      "masteryName": "Irritar (Vex)",
      "properties": [
        "Munição (alcance 24/96m)",
        "Duas Mãos"
      ],
      "weight": 1
    },
    {
      "id": "greatsword",
      "name": "Espada Grande (Montante)",
      "category": "Marcial",
      "type": "Corpo a Corpo",
      "cost": "50 PO",
      "damage": "2d6",
      "damageType": "Cortante",
      "mastery": "graze",
      "masteryName": "Arranhão (Graze)",
      "properties": [
        "Pesada",
        "Duas Mãos"
      ],
      "weight": 3
    },
    {
      "id": "longsword",
      "name": "Espada Longa",
      "category": "Marcial",
      "type": "Corpo a Corpo",
      "cost": "15 PO",
      "damage": "1d8",
      "damageType": "Cortante",
      "mastery": "sap",
      "masteryName": "Debilitar (Sap)",
      "properties": [
        "Versátil (1d10)"
      ],
      "weight": 1.5
    },
    {
      "id": "rapier",
      "name": "Rapieira",
      "category": "Marcial",
      "type": "Corpo a Corpo",
      "cost": "25 PO",
      "damage": "1d8",
      "damageType": "Perfurante",
      "mastery": "vex",
      "masteryName": "Irritar (Vex)",
      "properties": [
        "Acuidade"
      ],
      "weight": 1
    },
    {
      "id": "shortsword",
      "name": "Espada Curta",
      "category": "Marcial",
      "type": "Corpo a Corpo",
      "cost": "10 PO",
      "damage": "1d6",
      "damageType": "Perfurante",
      "mastery": "vex",
      "masteryName": "Irritar (Vex)",
      "properties": [
        "Acuidade",
        "Leve"
      ],
      "weight": 1
    },
    {
      "id": "scimitar",
      "name": "Cimitarra",
      "category": "Marcial",
      "type": "Corpo a Corpo",
      "cost": "25 PO",
      "damage": "1d6",
      "damageType": "Cortante",
      "mastery": "nick",
      "masteryName": "Corte Ágil (Nick)",
      "properties": [
        "Acuidade",
        "Leve"
      ],
      "weight": 1.5
    },
    {
      "id": "greataxe",
      "name": "Machado Grande",
      "category": "Marcial",
      "type": "Corpo a Corpo",
      "cost": "30 PO",
      "damage": "1d12",
      "damageType": "Cortante",
      "mastery": "cleave",
      "masteryName": "Trespassar (Cleave)",
      "properties": [
        "Pesada",
        "Duas Mãos"
      ],
      "weight": 3.5
    },
    {
      "id": "battleaxe",
      "name": "Machado de Batalha",
      "category": "Marcial",
      "type": "Corpo a Corpo",
      "cost": "10 PO",
      "damage": "1d8",
      "damageType": "Cortante",
      "mastery": "topple",
      "masteryName": "Derrubar (Topple)",
      "properties": [
        "Versátil (1d10)"
      ],
      "weight": 2
    },
    {
      "id": "halberd",
      "name": "Alabarda",
      "category": "Marcial",
      "type": "Corpo a Corpo",
      "cost": "20 PO",
      "damage": "1d10",
      "damageType": "Cortante",
      "mastery": "cleave",
      "masteryName": "Trespassar (Cleave)",
      "properties": [
        "Pesada",
        "Alcance",
        "Duas Mãos"
      ],
      "weight": 3
    },
    {
      "id": "maul",
      "name": "Malho (Marreta de Guerra)",
      "category": "Marcial",
      "type": "Corpo a Corpo",
      "cost": "10 PO",
      "damage": "2d6",
      "damageType": "Contundente",
      "mastery": "topple",
      "masteryName": "Derrubar (Topple)",
      "properties": [
        "Pesada",
        "Duas Mãos"
      ],
      "weight": 4.5
    },
    {
      "id": "warhammer",
      "name": "Martelo de Guerra",
      "category": "Marcial",
      "type": "Corpo a Corpo",
      "cost": "15 PO",
      "damage": "1d8",
      "damageType": "Contundente",
      "mastery": "push",
      "masteryName": "Empurrar (Push)",
      "properties": [
        "Versátil (1d10)"
      ],
      "weight": 2
    },
    {
      "id": "longbow",
      "name": "Arco Longo",
      "category": "Marcial",
      "type": "Distância",
      "cost": "50 PO",
      "damage": "1d8",
      "damageType": "Perfurante",
      "mastery": "slow",
      "masteryName": "Abrandar (Slow)",
      "properties": [
        "Munição (alcance 45/180m)",
        "Pesada",
        "Duas Mãos"
      ],
      "weight": 1
    },
    {
      "id": "heavy_crossbow",
      "name": "Besta Pesada",
      "category": "Marcial",
      "type": "Distância",
      "cost": "50 PO",
      "damage": "1d10",
      "damageType": "Perfurante",
      "mastery": "push",
      "masteryName": "Empurrar (Push)",
      "properties": [
        "Munição (alcance 30/120m)",
        "Pesada",
        "Recarga",
        "Duas Mãos"
      ],
      "weight": 4
    }
  ],
  "armors": [
    {
      "id": "none",
      "name": "Nenhuma (Sem Armadura)",
      "category": "Nenhuma",
      "baseAC": 10,
      "dexMod": "full",
      "maxDex": null,
      "minStr": 0,
      "stealthDisadv": false,
      "weight": 0,
      "cost": "0 PO"
    },
    {
      "id": "padded",
      "name": "Acolchoada",
      "category": "Leve",
      "baseAC": 11,
      "dexMod": "full",
      "maxDex": null,
      "minStr": 0,
      "stealthDisadv": true,
      "weight": 4,
      "cost": "5 PO"
    },
    {
      "id": "leather",
      "name": "Couro",
      "category": "Leve",
      "baseAC": 11,
      "dexMod": "full",
      "maxDex": null,
      "minStr": 0,
      "stealthDisadv": false,
      "weight": 5,
      "cost": "10 PO"
    },
    {
      "id": "studded_leather",
      "name": "Couro Batido",
      "category": "Leve",
      "baseAC": 12,
      "dexMod": "full",
      "maxDex": null,
      "minStr": 0,
      "stealthDisadv": false,
      "weight": 6,
      "cost": "45 PO"
    },
    {
      "id": "hide",
      "name": "Gibão de Peles",
      "category": "Média",
      "baseAC": 12,
      "dexMod": "cap2",
      "maxDex": 2,
      "minStr": 0,
      "stealthDisadv": false,
      "weight": 6,
      "cost": "10 PO"
    },
    {
      "id": "chain_shirt",
      "name": "Camisa de Cota de Malha",
      "category": "Média",
      "baseAC": 13,
      "dexMod": "cap2",
      "maxDex": 2,
      "minStr": 0,
      "stealthDisadv": false,
      "weight": 10,
      "cost": "50 PO"
    },
    {
      "id": "scale_mail",
      "name": "Cota de Escamas",
      "category": "Média",
      "baseAC": 14,
      "dexMod": "cap2",
      "maxDex": 2,
      "minStr": 0,
      "stealthDisadv": true,
      "weight": 20,
      "cost": "50 PO"
    },
    {
      "id": "breastplate",
      "name": "Peitoral de Aço",
      "category": "Média",
      "baseAC": 14,
      "dexMod": "cap2",
      "maxDex": 2,
      "minStr": 0,
      "stealthDisadv": false,
      "weight": 10,
      "cost": "400 PO"
    },
    {
      "id": "half_plate",
      "name": "Meia-Armadura",
      "category": "Média",
      "baseAC": 15,
      "dexMod": "cap2",
      "maxDex": 2,
      "minStr": 0,
      "stealthDisadv": true,
      "weight": 18,
      "cost": "750 PO"
    },
    {
      "id": "ring_mail",
      "name": "Cota de Anéis",
      "category": "Pesada",
      "baseAC": 14,
      "dexMod": "none",
      "maxDex": 0,
      "minStr": 0,
      "stealthDisadv": true,
      "weight": 18,
      "cost": "30 PO"
    },
    {
      "id": "chain_mail",
      "name": "Cota de Malha Completa",
      "category": "Pesada",
      "baseAC": 16,
      "dexMod": "none",
      "maxDex": 0,
      "minStr": 13,
      "stealthDisadv": true,
      "weight": 25,
      "cost": "75 PO"
    },
    {
      "id": "splint",
      "name": "Armadura de Talas",
      "category": "Pesada",
      "baseAC": 17,
      "dexMod": "none",
      "maxDex": 0,
      "minStr": 15,
      "stealthDisadv": true,
      "weight": 27,
      "cost": "200 PO"
    },
    {
      "id": "plate",
      "name": "Placas Completas (Armadura Completa)",
      "category": "Pesada",
      "baseAC": 18,
      "dexMod": "none",
      "maxDex": 0,
      "minStr": 15,
      "stealthDisadv": true,
      "weight": 30,
      "cost": "1500 PO"
    }
  ],
  "shields": [
    {
      "id": "none",
      "name": "Nenhum Escudo",
      "acBonus": 0,
      "weight": 0,
      "cost": "0 PO"
    },
    {
      "id": "shield",
      "name": "Escudo (+2 CA)",
      "acBonus": 2,
      "weight": 3,
      "cost": "10 PO"
    }
  ],
  "spellSlotsTable": {
    "full": {
      "1": [
        2,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "2": [
        3,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "3": [
        4,
        2,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "4": [
        4,
        3,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "5": [
        4,
        3,
        2,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "6": [
        4,
        3,
        3,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "7": [
        4,
        3,
        3,
        1,
        0,
        0,
        0,
        0,
        0
      ],
      "8": [
        4,
        3,
        3,
        2,
        0,
        0,
        0,
        0,
        0
      ],
      "9": [
        4,
        3,
        3,
        3,
        1,
        0,
        0,
        0,
        0
      ],
      "10": [
        4,
        3,
        3,
        3,
        2,
        0,
        0,
        0,
        0
      ],
      "11": [
        4,
        3,
        3,
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "12": [
        4,
        3,
        3,
        3,
        2,
        1,
        0,
        0,
        0
      ],
      "13": [
        4,
        3,
        3,
        3,
        2,
        1,
        1,
        0,
        0
      ],
      "14": [
        4,
        3,
        3,
        3,
        2,
        1,
        1,
        0,
        0
      ],
      "15": [
        4,
        3,
        3,
        3,
        2,
        1,
        1,
        1,
        0
      ],
      "16": [
        4,
        3,
        3,
        3,
        2,
        1,
        1,
        1,
        0
      ],
      "17": [
        4,
        3,
        3,
        3,
        2,
        1,
        1,
        1,
        1
      ],
      "18": [
        4,
        3,
        3,
        3,
        3,
        1,
        1,
        1,
        1
      ],
      "19": [
        4,
        3,
        3,
        3,
        3,
        2,
        1,
        1,
        1
      ],
      "20": [
        4,
        3,
        3,
        3,
        3,
        2,
        2,
        1,
        1
      ]
    },
    "half": {
      "1": [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "2": [
        2,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "3": [
        3,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "4": [
        3,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "5": [
        4,
        2,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "6": [
        4,
        2,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "7": [
        4,
        3,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "8": [
        4,
        3,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "9": [
        4,
        3,
        2,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "10": [
        4,
        3,
        2,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "11": [
        4,
        3,
        3,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "12": [
        4,
        3,
        3,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "13": [
        4,
        3,
        3,
        1,
        0,
        0,
        0,
        0,
        0
      ],
      "14": [
        4,
        3,
        3,
        1,
        0,
        0,
        0,
        0,
        0
      ],
      "15": [
        4,
        3,
        3,
        2,
        0,
        0,
        0,
        0,
        0
      ],
      "16": [
        4,
        3,
        3,
        2,
        0,
        0,
        0,
        0,
        0
      ],
      "17": [
        4,
        3,
        3,
        3,
        1,
        0,
        0,
        0,
        0
      ],
      "18": [
        4,
        3,
        3,
        3,
        1,
        0,
        0,
        0,
        0
      ],
      "19": [
        4,
        3,
        3,
        3,
        2,
        0,
        0,
        0,
        0
      ],
      "20": [
        4,
        3,
        3,
        3,
        2,
        0,
        0,
        0,
        0
      ]
    },
    "pact": {
      "1": {
        "count": 1,
        "level": 1
      },
      "2": {
        "count": 2,
        "level": 1
      },
      "3": {
        "count": 2,
        "level": 2
      },
      "4": {
        "count": 2,
        "level": 2
      },
      "5": {
        "count": 2,
        "level": 3
      },
      "6": {
        "count": 2,
        "level": 3
      },
      "7": {
        "count": 2,
        "level": 4
      },
      "8": {
        "count": 2,
        "level": 4
      },
      "9": {
        "count": 2,
        "level": 5
      },
      "10": {
        "count": 2,
        "level": 5
      },
      "11": {
        "count": 3,
        "level": 5
      },
      "12": {
        "count": 3,
        "level": 5
      },
      "13": {
        "count": 3,
        "level": 5
      },
      "14": {
        "count": 3,
        "level": 5
      },
      "15": {
        "count": 3,
        "level": 5
      },
      "16": {
        "count": 3,
        "level": 5
      },
      "17": {
        "count": 4,
        "level": 5
      },
      "18": {
        "count": 4,
        "level": 5
      },
      "19": {
        "count": 4,
        "level": 5
      },
      "20": {
        "count": 4,
        "level": 5
      }
    }
  },
  "spells": [
    {
      "id": "fire_bolt",
      "name": "Raio de Fogo (Fire Bolt)",
      "level": 0,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "36 metros (120ft)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "wizard",
        "sorcerer"
      ],
      "desc": "Arremessa um caco flamejante em criatura ou objeto. Causa 1d10 de dano de Fogo (2d10 no nvl 5, 3d10 no 11, 4d10 no 17)."
    },
    {
      "id": "sacred_flame",
      "name": "Chama Sagrada (Sacred Flame)",
      "level": 0,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "18 metros (60ft)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "cleric"
      ],
      "desc": "Radiação flamejante desce sobre o alvo. Salvaguarda de Destreza ou sofre 1d8 de dano Radiante (ignora cobertura)."
    },
    {
      "id": "guidance",
      "name": "Orientação (Guidance)",
      "level": 0,
      "school": "Adivinhação",
      "time": "1 Ação Bônus",
      "range": "Toque",
      "components": "V, S",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "cleric",
        "druid"
      ],
      "desc": "Toca uma criatura disposta. Ela adiciona 1d4 em um teste de habilidade à sua escolha antes da magia terminar."
    },
    {
      "id": "vicious_mockery",
      "name": "Zombaria Viciosa (Vicious Mockery)",
      "level": 0,
      "school": "Encantamento",
      "time": "1 Ação",
      "range": "18 metros (60ft)",
      "components": "V",
      "duration": "Instantânea",
      "classes": [
        "bard"
      ],
      "desc": "Insultos imbuídos de magia corrosiva. Salvaguarda de Sabedoria ou 1d4 de dano Psíquico e Desvantagem no próximo ataque."
    },
    {
      "id": "minor_illusion",
      "name": "Ilusão Menor (Minor Illusion)",
      "level": 0,
      "school": "Ilusão",
      "time": "1 Ação",
      "range": "9 metros (30ft)",
      "components": "S, M (velo)",
      "duration": "1 minuto",
      "classes": [
        "bard",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Cria um som ou uma imagem estática de um objeto de até 1,5m de lado no alcance pela duração."
    },
    {
      "id": "mage_hand",
      "name": "Mão Mágica (Mage Hand)",
      "level": 0,
      "school": "Conjuração",
      "time": "1 Ação",
      "range": "9 metros (30ft)",
      "components": "V, S",
      "duration": "1 minuto",
      "classes": [
        "bard",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Uma mão espectral e flutuante manipula objetos, abre portas desdestrancadas e carrega até 5 kg."
    },
    {
      "id": "prestidigitation",
      "name": "Prestidigitação (Prestidigitation)",
      "level": 0,
      "school": "Transmutação",
      "time": "1 Ação",
      "range": "3 metros (10ft)",
      "components": "V, S",
      "duration": "Até 1 hora",
      "classes": [
        "bard",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Pequenos truques mágicos: faíscas, limpar/sujar objetos, esquentar/esfriar comida, acender velas ou criar marcas sensoriais."
    },
    {
      "id": "thaumaturgy",
      "name": "Taumaturgia (Thaumaturgy)",
      "level": 0,
      "school": "Transmutação",
      "time": "1 Ação",
      "range": "9 metros (30ft)",
      "components": "V",
      "duration": "Até 1 minuto",
      "classes": [
        "cleric"
      ],
      "desc": "Manifesta sinais de poder divino: voz estrondosa 3x mais alta, tremer o solo, fazer chamas cintilarem e abrir/fechar portas."
    },
    {
      "id": "ray_of_frost",
      "name": "Raio de Gelo (Ray of Frost)",
      "level": 0,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "18 metros (60ft)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Feixe gélido de luz azulada. Causa 1d8 de dano de Frio e reduz o deslocamento do alvo em 3 metros."
    },
    {
      "id": "shocking_grasp",
      "name": "Toque Chocante (Shocking Grasp)",
      "level": 0,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "Toque",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Relâmpagos irrompem das suas mãos. Causa 1d8 de dano Elétrico e impede o alvo de realizar Reações até o seu próximo turno."
    },
    {
      "id": "toll_the_dead",
      "name": "Badalar dos Mortos (Toll the Dead)",
      "level": 0,
      "school": "Necromancia",
      "time": "1 Ação",
      "range": "18 metros (60ft)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "cleric",
        "warlock",
        "wizard"
      ],
      "desc": "O som de um sino fúnebre ecoa. Salvaguarda de Sabedoria ou 1d8 de dano Necrótico (1d12 se já estiver ferido)."
    },
    {
      "id": "druidcraft",
      "name": "Artifício Druídico (Druidcraft)",
      "level": 0,
      "school": "Transmutação",
      "time": "1 Ação",
      "range": "9 metros (30ft)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "druid"
      ],
      "desc": "Sussurra aos espíritos da natureza para prever o clima nas próximas 24h, fazer flores desabrocharem ou produzir brisas aromáticas."
    },
    {
      "id": "thorn_whip",
      "name": "Chicote de Espinhos (Thorn Whip)",
      "level": 0,
      "school": "Transmutação",
      "time": "1 Ação",
      "range": "9 metros (30ft)",
      "components": "V, S, M (caule)",
      "duration": "Instantânea",
      "classes": [
        "druid"
      ],
      "desc": "Chicote de trepadeiras com espinhos. Ataque corpo a corpo mágico. Causa 1d6 de dano Perfurante e puxa o alvo 3m em sua direção."
    },
    {
      "id": "eldritch_blast",
      "name": "Rajada Mística (Eldritch Blast)",
      "level": 0,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "36 metros (120ft)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "warlock"
      ],
      "desc": "Feixe crepitante de energia pura. Ataque mágico à distância. Causa 1d10 de dano de Energia/Força (+1 feixe nos nvls 5, 11 e 17)."
    },
    {
      "id": "poison_spray",
      "name": "Borrifo Venenoso (Poison Spray)",
      "level": 0,
      "school": "Necromancia",
      "time": "1 Ação",
      "range": "9 metros (30ft)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "druid",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Lança gás tóxico no alvo. Ataque mágico à distância ou salvaguarda de CON, causando 1d12 de dano de Veneno."
    },
    {
      "id": "true_strike",
      "name": "Ataque Certeiro (True Strike 2024)",
      "level": 0,
      "school": "Adivinhação",
      "time": "1 Ação",
      "range": "Alcance da Arma",
      "components": "S, M (uma arma)",
      "duration": "Instantânea",
      "classes": [
        "bard",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Desfere um ataque com arma usando seu atributo de conjuração no acerto e no dano (que se torna dano Radiante), com +1d6 extra no nvl 5."
    },
    {
      "id": "acid_splash",
      "name": "Borrifo Ácido (Acid Splash)",
      "level": 0,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "18 metros (60ft)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Arremessa uma bolha de ácido em uma ou duas criaturas a 1,5m uma da outra. Salvaguarda de DES ou 1d6 de dano Ácido."
    },
    {
      "id": "chill_touch",
      "name": "Toque Macabro (Chill Touch)",
      "level": 0,
      "school": "Necromancia",
      "time": "1 Ação",
      "range": "Toque",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Toque gélido do túmulo. Ataque corpo a corpo mágico causando 1d10 de dano Necrótico e impede o alvo de recuperar PV até o próximo turno."
    },
    {
      "id": "dancing_lights",
      "name": "Globos de Luz (Dancing Lights)",
      "level": 0,
      "school": "Ilusão",
      "time": "1 Ação",
      "range": "36 metros (120ft)",
      "components": "V, S, M (fósforo)",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "bard",
        "sorcerer",
        "wizard"
      ],
      "desc": "Cria até 4 luzes flutuantes que iluminam penumbra em raio de 3 metros e podem ser movidas até 18m como Ação Bônus."
    },
    {
      "id": "light",
      "name": "Luz (Light)",
      "level": 0,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "Toque",
      "components": "V, M (pirilampo)",
      "duration": "1 hora",
      "classes": [
        "bard",
        "cleric",
        "sorcerer",
        "wizard"
      ],
      "desc": "Toca um objeto que emite luz plena em raio de 6 metros e penumbra por mais 6 metros na cor que desejar."
    },
    {
      "id": "message",
      "name": "Mensagem (Message)",
      "level": 0,
      "school": "Transmutação",
      "time": "1 Ação",
      "range": "36 metros (120ft)",
      "components": "V, S, M (fio de cobre)",
      "duration": "1 rodada",
      "classes": [
        "bard",
        "sorcerer",
        "wizard"
      ],
      "desc": "Aponta para uma criatura e sussurra uma mensagem audível apenas para ela, que pode responder num sussurro."
    },
    {
      "id": "mending",
      "name": "Consertar (Mending)",
      "level": 0,
      "school": "Transmutação",
      "time": "1 minuto",
      "range": "Toque",
      "components": "V, S, M (dois ímãs)",
      "duration": "Instantânea",
      "classes": [
        "bard",
        "cleric",
        "druid",
        "sorcerer",
        "wizard"
      ],
      "desc": "Repara uma única fenda ou rasgão em um objeto tocado de até 30 centímetros."
    },
    {
      "id": "produce_flame",
      "name": "Produzir Chama (Produce Flame)",
      "level": 0,
      "school": "Conjuração",
      "time": "1 Ação Bônus",
      "range": "Pessoal (ou arremesso 18m)",
      "components": "V, S",
      "duration": "10 minutos",
      "classes": [
        "druid"
      ],
      "desc": "Uma chama tremeluzente surge na sua mão iluminando 6 metros; pode ser arremessada com 1 Ação causando 1d8 de dano de Fogo."
    },
    {
      "id": "resistance",
      "name": "Resistência (Resistance)",
      "level": 0,
      "school": "Abjuração",
      "time": "1 Ação Bônus",
      "range": "Toque",
      "components": "V, S",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "cleric",
        "druid"
      ],
      "desc": "Toca uma criatura disposta. Uma vez antes da magia terminar, ela pode adicionar 1d4 em uma Salvaguarda."
    },
    {
      "id": "shillelagh",
      "name": "Bordão Místico (Shillelagh)",
      "level": 0,
      "school": "Transmutação",
      "time": "1 Ação Bônus",
      "range": "Toque",
      "components": "V, S, M (visco)",
      "duration": "1 minuto",
      "classes": [
        "druid"
      ],
      "desc": "Imbui um bordão ou clava com magia da natureza. O dado de dano passa a ser 1d8 e usa seu modificador de conjuração no ataque e dano."
    },
    {
      "id": "spare_the_dying",
      "name": "Poupar os Moribundos (Spare the Dying)",
      "level": 0,
      "school": "Necromancia",
      "time": "1 Ação",
      "range": "4,5 metros (15ft)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "cleric",
        "druid"
      ],
      "desc": "Toca uma criatura viva com 0 pontos de vida, estabilizando-a instantaneamente."
    },
    {
      "id": "word_of_radiance",
      "name": "Palavra Radiante (Word of Radiance)",
      "level": 0,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "1,5 metros (5ft)",
      "components": "V, M (símbolo)",
      "duration": "Instantânea",
      "classes": [
        "cleric"
      ],
      "desc": "Profere uma palavra santa. Cada criatura escolhida a até 1,5m deve passar em salvaguarda de CON ou sofrer 1d6 de dano Radiante."
    },
    {
      "id": "blade_ward",
      "name": "Proteção Contra Lâminas (Blade Ward 2024)",
      "level": 0,
      "school": "Abjuração",
      "time": "1 Ação Bônus",
      "range": "Pessoal",
      "components": "V, S",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "bard",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Quando uma criatura fizer uma jogada de ataque contra você, subtrai 1d4 do ataque dela pela duração."
    },
    {
      "id": "magic_missile",
      "name": "Mísseis Mágicos (Magic Missile)",
      "level": 1,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "36 metros (120ft)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Dispara 3 dardos brilhantes que acertam infalivelmente seus alvos. Cada dardo causa 1d4 + 1 de dano de Força/Energia."
    },
    {
      "id": "shield",
      "name": "Escudo Arcano (Shield)",
      "level": 1,
      "school": "Abjuração",
      "time": "1 Reação",
      "range": "Pessoal",
      "components": "V, S",
      "duration": "1 rodada",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Barreira mágica invisível ergue-se em reação a um ataque. Concede +5 de bônus na CA e imunidade a Mísseis Mágicos até seu próximo turno."
    },
    {
      "id": "cure_wounds",
      "name": "Curar Ferimentos (Cure Wounds 2024)",
      "level": 1,
      "school": "Abjuração",
      "time": "1 Ação",
      "range": "Toque",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "bard",
        "cleric",
        "druid",
        "paladin",
        "ranger"
      ],
      "desc": "Toca uma criatura viva restaurando 2d8 + Modificador de Conjuração pontos de vida (+2d8 por círculo superior no D&D 2024)."
    },
    {
      "id": "healing_word",
      "name": "Palavra Curativa (Healing Word 2024)",
      "level": 1,
      "school": "Abjuração",
      "time": "1 Ação Bônus",
      "range": "18 metros (60ft)",
      "components": "V",
      "duration": "Instantânea",
      "classes": [
        "bard",
        "cleric",
        "druid"
      ],
      "desc": "Profere uma palavra de cura à distância com ação bônus, restaurando 2d4 + Modificador de Conjuração PV a um aliado visível."
    },
    {
      "id": "detect_magic",
      "name": "Detectar Magia (Detect Magic)",
      "level": 1,
      "school": "Adivinhação (Ritual)",
      "time": "1 Ação",
      "range": "Pessoal (raio 9m)",
      "components": "V, S",
      "duration": "Concentração, até 10 minutos",
      "classes": [
        "bard",
        "cleric",
        "druid",
        "paladin",
        "ranger",
        "sorcerer",
        "wizard"
      ],
      "desc": "Sente a presença de auras mágicas e aprende a escola de magia de qualquer criatura ou objeto visível no alcance."
    },
    {
      "id": "thunderwave",
      "name": "Onda Trovejante (Thunderwave)",
      "level": 1,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "Pessoal (cubo de 4,5m)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "bard",
        "druid",
        "sorcerer",
        "wizard"
      ],
      "desc": "Uma onda retumbante empurra criaturas a 3 metros e causa 2d8 de dano de Trovão em falha de CON (metade em sucesso)."
    },
    {
      "id": "burning_hands",
      "name": "Mãos Flamejantes (Burning Hands)",
      "level": 1,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "Pessoal (cone de 4,5m)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Cone de chamas consome criaturas na área causando 3d6 de dano de Fogo em falha de DES (metade no sucesso)."
    },
    {
      "id": "armor_of_agathys",
      "name": "Armadura de Agathys (Armor of Agathys)",
      "level": 1,
      "school": "Abjuração",
      "time": "1 Ação",
      "range": "Pessoal",
      "components": "V, S, M (copo de água)",
      "duration": "1 hora",
      "classes": [
        "warlock"
      ],
      "desc": "Ganha 5 PV temporários. Enquanto mantiver esses PV, qualquer criatura que acertar você corpo a corpo sofre 5 de dano de Frio."
    },
    {
      "id": "hex",
      "name": "Bruxaria (Hex)",
      "level": 1,
      "school": "Encantamento",
      "time": "1 Ação Bônus",
      "range": "27 metros (90ft)",
      "components": "V, S, M (olho)",
      "duration": "Concentração, até 1 hora",
      "classes": [
        "warlock"
      ],
      "desc": "Amaldiçoa um alvo, causando 1d6 de dano Necrótico adicional em cada acerto e impondo desvantagem em testes de 1 atributo."
    },
    {
      "id": "hunters_mark",
      "name": "Marca do Caçador (Hunter's Mark)",
      "level": 1,
      "school": "Adivinhação",
      "time": "1 Ação Bônus",
      "range": "27 metros (90ft)",
      "components": "V",
      "duration": "Concentração, até 1 hora",
      "classes": [
        "ranger"
      ],
      "desc": "Marca uma presa misticamente. Seus ataques com arma causam 1d6 de dano de Energia/Força extra e você ganha vantagem para rastreá-la."
    },
    {
      "id": "guiding_bolt",
      "name": "Raio Guiador (Guiding Bolt)",
      "level": 1,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "36 metros (120ft)",
      "components": "V, S",
      "duration": "1 rodada",
      "classes": [
        "cleric"
      ],
      "desc": "Feixe de luz radiante deslumbrante. Ataque à distância mágico. Causa 4d6 de dano Radiante e concede Vantagem no próximo ataque contra o alvo."
    },
    {
      "id": "inflict_wounds",
      "name": "Infligir Ferimentos (Inflict Wounds)",
      "level": 1,
      "school": "Necromancia",
      "time": "1 Ação",
      "range": "Toque",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "cleric"
      ],
      "desc": "Toque putrefato mortal. Ataque mágico corpo a corpo causando devastadores 3d10 de dano Necrótico."
    },
    {
      "id": "bless",
      "name": "Bênção (Bless)",
      "level": 1,
      "school": "Encantamento",
      "time": "1 Ação",
      "range": "9 metros (30ft)",
      "components": "V, S, M (água benta)",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "cleric",
        "paladin"
      ],
      "desc": "Abençoa até 3 criaturas. Cada uma adiciona 1d4 em todas as jogadas de ataque e salvaguardas pela duração."
    },
    {
      "id": "bane",
      "name": "Perdição (Bane)",
      "level": 1,
      "school": "Encantamento",
      "time": "1 Ação",
      "range": "9 metros (30ft)",
      "components": "V, S, M (gota de sangue)",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "bard",
        "cleric"
      ],
      "desc": "Até 3 criaturas devem fazer Salvaguarda de Carisma. Em falha, subtraem 1d4 de todas as jogadas de ataque e salvaguardas."
    },
    {
      "id": "command",
      "name": "Comando (Command)",
      "level": 1,
      "school": "Encantamento",
      "time": "1 Ação",
      "range": "18 metros (60ft)",
      "components": "V",
      "duration": "1 rodada",
      "classes": [
        "cleric",
        "paladin"
      ],
      "desc": "Profere uma ordem de uma palavra (Aproxime-se, Largue, Caia, Fuja, Pare). Salvaguarda de SAB ou o alvo obedece em seu turno."
    },
    {
      "id": "divine_smite",
      "name": "Destruição Divina (Divine Smite 2024)",
      "level": 1,
      "school": "Evocação",
      "time": "1 Ação Bônus (ao acertar)",
      "range": "Pessoal",
      "components": "V",
      "duration": "Instantânea",
      "classes": [
        "paladin"
      ],
      "desc": "Imediatamente após acertar um ataque com arma, consome o espaço para causar 2d8 de dano Radiante extra (+1d8 contra mortos-vivos/fadas/aberrações)."
    },
    {
      "id": "thunderous_smite",
      "name": "Destruição Trovejante (Thunderous Smite)",
      "level": 1,
      "school": "Evocação",
      "time": "1 Ação Bônus",
      "range": "Pessoal",
      "components": "V",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "paladin"
      ],
      "desc": "Seu ataque ressoa trovão: causa +2d6 de dano de Trovão e empurra o alvo 3 metros, derrubando-o se falhar em FOR."
    },
    {
      "id": "wrathful_smite",
      "name": "Destruição Colérica (Wrathful Smite)",
      "level": 1,
      "school": "Evocação",
      "time": "1 Ação Bônus",
      "range": "Pessoal",
      "components": "V",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "paladin"
      ],
      "desc": "Seu ataque causa +1d6 de dano Psíquico e força o alvo a fazer Salvaguarda de SAB ou fica Amedrontado até a magia terminar."
    },
    {
      "id": "mage_armor",
      "name": "Armadura Arcana (Mage Armor)",
      "level": 1,
      "school": "Abjuração",
      "time": "1 Ação",
      "range": "Toque",
      "components": "V, S, M (couro curtido)",
      "duration": "8 horas",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Toca uma criatura sem armadura. Sua CA base torna-se 13 + Modificador de Destreza pela duração."
    },
    {
      "id": "sleep",
      "name": "Sono (Sleep 2024)",
      "level": 1,
      "school": "Encantamento",
      "time": "1 Ação",
      "range": "18 metros (esfera 6m)",
      "components": "V, S, M (areia)",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "bard",
        "sorcerer",
        "wizard"
      ],
      "desc": "Criaturas na área fazem Salvaguarda de Sabedoria ou caem na condição Incapacitado e Adormecido até sofrerem dano ou serem acordadas."
    },
    {
      "id": "charm_person",
      "name": "Enfeitiçar Pessoa (Charm Person)",
      "level": 1,
      "school": "Encantamento",
      "time": "1 Ação",
      "range": "9 metros (30ft)",
      "components": "V, S",
      "duration": "1 hora",
      "classes": [
        "bard",
        "druid",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Um humanoide faz Salvaguarda de SAB com vantagem se estiver em combate. Em falha, fica Enfeitiçado e considera você amigo leal."
    },
    {
      "id": "disguise_self",
      "name": "Disfarçar-se (Disguise Self)",
      "level": 1,
      "school": "Ilusão",
      "time": "1 Ação",
      "range": "Pessoal",
      "components": "V, S",
      "duration": "1 hora",
      "classes": [
        "bard",
        "sorcerer",
        "wizard"
      ],
      "desc": "Altera magicamente sua aparência visual, roupas, armas e equipamentos em até 30 cm de altura."
    },
    {
      "id": "feather_fall",
      "name": "Queda Suave (Feather Fall)",
      "level": 1,
      "school": "Transmutação",
      "time": "1 Reação",
      "range": "18 metros (60ft)",
      "components": "V, M (pena)",
      "duration": "1 minuto",
      "classes": [
        "bard",
        "sorcerer",
        "wizard"
      ],
      "desc": "Em reação à queda, reduz a taxa de descida de até 5 criaturas para 18m por rodada, anulando completamente o dano de queda."
    },
    {
      "id": "fog_cloud",
      "name": "Nuvem de Névoa (Fog Cloud)",
      "level": 1,
      "school": "Conjuração",
      "time": "1 Ação",
      "range": "36 metros (esfera 6m)",
      "components": "V, S",
      "duration": "Concentração, até 1 hora",
      "classes": [
        "druid",
        "ranger",
        "sorcerer",
        "wizard"
      ],
      "desc": "Cria uma densa esfera de névoa que bloqueia totalmente a visão, obscurecendo a área."
    },
    {
      "id": "sanctuary",
      "name": "Santuário (Sanctuary)",
      "level": 1,
      "school": "Abjuração",
      "time": "1 Ação Bônus",
      "range": "9 metros (30ft)",
      "components": "V, S, M (espelho)",
      "duration": "1 minuto",
      "classes": [
        "cleric"
      ],
      "desc": "Protege um aliado. Qualquer criatura que tentar atacar o protegido deve passar em Salvaguarda de SAB ou perder o ataque ou redirecioná-lo."
    },
    {
      "id": "shield_of_faith",
      "name": "Escudo da Fé (Shield of Faith)",
      "level": 1,
      "school": "Abjuração",
      "time": "1 Ação Bônus",
      "range": "18 metros (60ft)",
      "components": "V, S, M (pergaminho)",
      "duration": "Concentração, até 10 minutos",
      "classes": [
        "cleric",
        "paladin"
      ],
      "desc": "Um campo reluzente cerca uma criatura concedendo +2 de bônus na CA pela duração."
    },
    {
      "id": "tashas_hideous_laughter",
      "name": "Riso Histérico de Tasha",
      "level": 1,
      "school": "Encantamento",
      "time": "1 Ação",
      "range": "9 metros (30ft)",
      "components": "V, S, M (penas)",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "bard",
        "wizard"
      ],
      "desc": "Alvo acha tudo hilário e cai no chão dando gargalhadas incontroláveis, ficando Incapacitado e Caído em falha de SAB."
    },
    {
      "id": "witch_bolt",
      "name": "Raio de Bruxa (Witch Bolt 2024)",
      "level": 1,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "18 metros (60ft)",
      "components": "V, S, M (galho)",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Ataque à distância mágico causando 2d12 de dano Elétrico; pode usar Ação Bônus nos turnos seguintes para causar dano automático."
    },
    {
      "id": "faerie_fire",
      "name": "Fogo das Fadas (Faerie Fire)",
      "level": 1,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "18 metros (cubo 6m)",
      "components": "V",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "bard",
        "druid"
      ],
      "desc": "Contorna objetos e criaturas com luz colorida em falha de DES. Concede Vantagem em todos os ataques contra os alvos contornados."
    },
    {
      "id": "entangle",
      "name": "Constrição (Entangle)",
      "level": 1,
      "school": "Conjuração",
      "time": "1 Ação",
      "range": "27 metros (quadrado 6m)",
      "components": "V, S",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "druid"
      ],
      "desc": "Plantas e trepadeiras brotam do chão. Terreno difícil; criaturas na área que falharem em FOR ficam Presas e Contidas."
    },
    {
      "id": "dissonant_whispers",
      "name": "Sussurros Dissonantes (Dissonant Whispers)",
      "level": 1,
      "school": "Encantamento",
      "time": "1 Ação",
      "range": "18 metros (60ft)",
      "components": "V",
      "duration": "Instantânea",
      "classes": [
        "bard"
      ],
      "desc": "Uma melodia discordante que só o alvo ouve. Causa 3d6 de dano Psíquico e força o alvo a fugir usando sua Reação em falha de SAB."
    },
    {
      "id": "misty_step",
      "name": "Passo Sombrio (Misty Step)",
      "level": 2,
      "school": "Conjuração",
      "time": "1 Ação Bônus",
      "range": "Pessoal",
      "components": "V",
      "duration": "Instantânea",
      "classes": [
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Cercado por névoa prateada, você se teletransporta instantaneamente até 9 metros para um espaço desocupado que possa ver."
    },
    {
      "id": "scorching_ray",
      "name": "Raio Ardente (Scorching Ray)",
      "level": 2,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "36 metros (120ft)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Dispara 3 raios de fogo em alvos iguais ou diferentes. Cada raio requer um ataque mágico à distância e causa 2d6 de dano de Fogo."
    },
    {
      "id": "invisibility",
      "name": "Invisibilidade (Invisibility)",
      "level": 2,
      "school": "Ilusão",
      "time": "1 Ação",
      "range": "Toque",
      "components": "V, S, M (pestana)",
      "duration": "Concentração, até 1 hora",
      "classes": [
        "bard",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Uma criatura tocada torna-se Invisível até a magia terminar, ou até atacar ou conjurar uma magia."
    },
    {
      "id": "hold_person",
      "name": "Imobilizar Pessoa (Hold Person)",
      "level": 2,
      "school": "Encantamento",
      "time": "1 Ação",
      "range": "18 metros (60ft)",
      "components": "V, S, M (ferro)",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "bard",
        "cleric",
        "druid",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Um humanoide visível faz Salvaguarda de Sabedoria. Em falha, fica Paralisado pela duração (ataques a 1,5m são críticos automáticos)."
    },
    {
      "id": "mirror_image",
      "name": "Reflexos (Mirror Image)",
      "level": 2,
      "school": "Ilusão",
      "time": "1 Ação",
      "range": "Pessoal",
      "components": "V, S",
      "duration": "1 minuto",
      "classes": [
        "bard",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Cria 3 duplicatas ilusórias de si mesmo que confundem atacantes e absorvem ataques direcionados a você (sem concentração)."
    },
    {
      "id": "spiritual_weapon",
      "name": "Arma Espiritual (Spiritual Weapon)",
      "level": 2,
      "school": "Evocação",
      "time": "1 Ação Bônus",
      "range": "18 metros (60ft)",
      "components": "V, S",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "cleric"
      ],
      "desc": "Cria uma arma espectral flutuante. Ataca com Ação Bônus causando 1d8 + Modificador de Conjuração de dano de Energia/Força."
    },
    {
      "id": "shatter",
      "name": "Estilhaçar (Shatter)",
      "level": 2,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "18 metros (esfera 3m)",
      "components": "V, S, M (mica)",
      "duration": "Instantânea",
      "classes": [
        "bard",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Um ruído ensurdecedor despedaça o local. Causa 3d8 de dano de Trovão em falha de CON (desvantagem para criaturas inorgânicas)."
    },
    {
      "id": "lesser_restoration",
      "name": "Restauração Menor (Lesser Restoration)",
      "level": 2,
      "school": "Abjuração",
      "time": "1 Ação Bônus",
      "range": "Toque",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "bard",
        "cleric",
        "druid",
        "paladin",
        "ranger"
      ],
      "desc": "Toca uma criatura curando uma doença ou removendo uma das condições: Cego, Surdo, Paralisado ou Envenenado."
    },
    {
      "id": "pass_without_trace",
      "name": "Passo Sem Pegadas (Pass Without Trace)",
      "level": 2,
      "school": "Abjuração",
      "time": "1 Ação",
      "range": "Pessoal (raio 9m)",
      "components": "V, S, M (cinzas)",
      "duration": "Concentração, até 1 hora",
      "classes": [
        "druid",
        "ranger"
      ],
      "desc": "Uma névoa de sombras oculta você e aliados no raio, concedendo +10 de bônus em testes de Furtividade e impedindo rastreamento."
    },
    {
      "id": "spike_growth",
      "name": "Crescimento de Espinhos (Spike Growth)",
      "level": 2,
      "school": "Transmutação",
      "time": "1 Ação",
      "range": "45 metros (raio 6m)",
      "components": "V, S, M (espinhos)",
      "duration": "Concentração, até 10 minutos",
      "classes": [
        "druid",
        "ranger"
      ],
      "desc": "O chão se enche de espinhos camuflados. Terreno difícil; qualquer criatura que se mover na área sofre 2d4 de dano Perfurante a cada 1,5m."
    },
    {
      "id": "web",
      "name": "Teia (Web)",
      "level": 2,
      "school": "Conjuração",
      "time": "1 Ação",
      "range": "18 metros (cubo 6m)",
      "components": "V, S, M (teia)",
      "duration": "Concentração, até 1 hora",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Cria uma massa densa de teias pegajosas. Terreno difícil; criaturas na área que falharem em DES ficam Presas e Contidas."
    },
    {
      "id": "darkness",
      "name": "Escuridão (Darkness)",
      "level": 2,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "18 metros (esfera 4,5m)",
      "components": "V, M (piche)",
      "duration": "Concentração, até 10 minutos",
      "classes": [
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Cria escuridão mágica impenetrável que anula visão no escuro comum e desfaz luzes mágicas de 2º círculo ou menor."
    },
    {
      "id": "see_invisibility",
      "name": "Ver o Invisível (See Invisibility)",
      "level": 2,
      "school": "Adivinhação",
      "time": "1 Ação",
      "range": "Pessoal",
      "components": "V, S, M (talco)",
      "duration": "1 hora",
      "classes": [
        "bard",
        "sorcerer",
        "wizard"
      ],
      "desc": "Você enxerga criaturas e objetos invisíveis como se fossem visíveis, e percebe o Plano Etéreo."
    },
    {
      "id": "suggestion",
      "name": "Sugestão (Suggestion)",
      "level": 2,
      "school": "Encantamento",
      "time": "1 Ação",
      "range": "9 metros (30ft)",
      "components": "V, M (gota de mel)",
      "duration": "Concentração, até 8 horas",
      "classes": [
        "bard",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Implanta uma sugestão razoável na mente de um alvo. Em falha de SAB, ele segue a atividade pelo tempo estipulado."
    },
    {
      "id": "levitate",
      "name": "Levitação (Levitate)",
      "level": 2,
      "school": "Transmutação",
      "time": "1 Ação",
      "range": "18 metros (60ft)",
      "components": "V, S, M (alça)",
      "duration": "Concentração, até 10 minutos",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Uma criatura ou objeto de até 250 kg levita verticalmente até 6 metros no ar e permanece flutuando."
    },
    {
      "id": "find_steed",
      "name": "Encontrar Montaria (Find Steed 2024)",
      "level": 2,
      "school": "Conjuração",
      "time": "1 Ação",
      "range": "9 metros (30ft)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "paladin"
      ],
      "desc": "Convoca um espírito leal celestial, feérico ou infernal que assume a forma de uma montaria de combate inteligente."
    },
    {
      "id": "flaming_sphere",
      "name": "Esfera Flamejante (Flaming Sphere)",
      "level": 2,
      "school": "Conjuração",
      "time": "1 Ação",
      "range": "18 metros (esfera 1,5m)",
      "components": "V, S, M (enxofre)",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "druid",
        "wizard"
      ],
      "desc": "Esfera de fogo rola pelo campo com Ação Bônus, causando 2d6 de dano de Fogo a quem terminar o turno adjacente a ela."
    },
    {
      "id": "moonbeam",
      "name": "Raio Lunar (Moonbeam)",
      "level": 2,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "36 metros (cilindro 1,5m)",
      "components": "V, S, M (sementes)",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "druid"
      ],
      "desc": "Um raio de luz prateada causa 2d10 de dano Radiante em falha de CON (e força metamorfos a reverterem à forma original)."
    },
    {
      "id": "aid",
      "name": "Ajuda (Aid)",
      "level": 2,
      "school": "Abjuração",
      "time": "1 Ação",
      "range": "9 metros (30ft)",
      "components": "V, S, M (tira de pano)",
      "duration": "8 horas",
      "classes": [
        "cleric",
        "paladin",
        "ranger"
      ],
      "desc": "Fortalece até 3 aliados, aumentando seus pontos de vida máximos e atuais em +5 PV cada pela duração."
    },
    {
      "id": "silence",
      "name": "Silêncio (Silence)",
      "level": 2,
      "school": "Ilusão (Ritual)",
      "time": "1 Ação",
      "range": "36 metros (esfera 6m)",
      "components": "V, S",
      "duration": "Concentração, até 10 minutos",
      "classes": [
        "bard",
        "cleric",
        "ranger"
      ],
      "desc": "Nenhum som pode ser criado ou passar pela esfera; criaturas na área ficam Imunes a dano de Trovão e impedidas de conjurar magias com componente Verbal."
    },
    {
      "id": "fireball",
      "name": "Bola de Fogo (Fireball)",
      "level": 3,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "45 metros (esfera 6m)",
      "components": "V, S, M (guano)",
      "duration": "Instantânea",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Uma explosão devastadora de chamas consome a área. Causa impressionantes 8d6 de dano de Fogo em falha de DES (metade em sucesso)."
    },
    {
      "id": "lightning_bolt",
      "name": "Relâmpago (Lightning Bolt)",
      "level": 3,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "Pessoal (linha de 30m)",
      "components": "V, S, M (pelo)",
      "duration": "Instantânea",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Um raio elétrico perfura uma linha de 30 metros de comprimento e 1,5m de largura, causando 8d6 de dano Elétrico em falha de DES."
    },
    {
      "id": "counterspell",
      "name": "Contra-Mágica (Counterspell 2024)",
      "level": 3,
      "school": "Abjuração",
      "time": "1 Reação",
      "range": "18 metros (60ft)",
      "components": "S",
      "duration": "Instantânea",
      "classes": [
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Interrompe a conjuração de uma magia visível. O conjurador alvo deve passar em Salvaguarda de Constituição ou a magia falha e o espaço é perdido."
    },
    {
      "id": "dispel_magic",
      "name": "Dissipar Magia (Dispel Magic)",
      "level": 3,
      "school": "Abjuração",
      "time": "1 Ação",
      "range": "36 metros (120ft)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "bard",
        "cleric",
        "druid",
        "paladin",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Encerra automaticamente magias de 3º círculo ou menor em um alvo. Para círculos maiores, faça teste com CD 10 + círculo da magia."
    },
    {
      "id": "fly",
      "name": "Voo (Fly)",
      "level": 3,
      "school": "Transmutação",
      "time": "1 Ação",
      "range": "Toque",
      "components": "V, S, M (pena)",
      "duration": "Concentração, até 10 minutos",
      "classes": [
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Toca uma criatura disposta concedendo deslocamento de voo de 18 metros (60 pés) com manobrabilidade total."
    },
    {
      "id": "haste",
      "name": "Velocidade (Haste)",
      "level": 3,
      "school": "Transmutação",
      "time": "1 Ação",
      "range": "9 metros (30ft)",
      "components": "V, S, M (raiz)",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Dobra o deslocamento de um aliado, concede +2 na CA, vantagem em salvaguardas de DES e uma Ação adicional a cada turno."
    },
    {
      "id": "slow",
      "name": "Lentidão (Slow)",
      "level": 3,
      "school": "Transmutação",
      "time": "1 Ação",
      "range": "36 metros (cubo 12m)",
      "components": "V, S, M (melaço)",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "bard",
        "sorcerer",
        "wizard"
      ],
      "desc": "Até 6 criaturas na área têm velocidade reduzida pela metade, -2 na CA e salvaguardas de DES, e não podem fazer reações."
    },
    {
      "id": "hypnotic_pattern",
      "name": "Padrão Hipnótico (Hypnotic Pattern)",
      "level": 3,
      "school": "Ilusão",
      "time": "1 Ação",
      "range": "36 metros (cubo 9m)",
      "components": "S, M (bastão incandescente)",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "bard",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Padrão caleidoscópico no ar. Criaturas que olharem e falharem em SAB ficam Incapacitadas e Enfeitiçadas com velocidade 0."
    },
    {
      "id": "revivify",
      "name": "Reviver (Revivify)",
      "level": 3,
      "school": "Necromancia",
      "time": "1 Ação",
      "range": "Toque",
      "components": "V, S, M (diamantes de 300 PO)",
      "duration": "Instantânea",
      "classes": [
        "cleric",
        "druid",
        "paladin",
        "ranger"
      ],
      "desc": "Toca uma criatura morta no último minuto. Sua alma retorna ao corpo e ela revive instantaneamente com 1 ponto de vida."
    },
    {
      "id": "spirit_guardians",
      "name": "Guardiões Espirituais (Spirit Guardians)",
      "level": 3,
      "school": "Conjuração",
      "time": "1 Ação",
      "range": "Pessoal (raio 4,5m)",
      "components": "V, S, M (símbolo)",
      "duration": "Concentração, até 10 minutos",
      "classes": [
        "cleric"
      ],
      "desc": "Espíritos angelicais ou féricos orbitam você. Inimigos na área têm deslocamento reduzido pela metade e sofrem 3d8 de dano Radiante/Necrótico."
    },
    {
      "id": "call_lightning",
      "name": "Convocar Relâmpagos (Call Lightning)",
      "level": 3,
      "school": "Conjuração",
      "time": "1 Ação",
      "range": "36 metros (nuvem 18m)",
      "components": "V, S",
      "duration": "Concentração, até 10 minutos",
      "classes": [
        "druid"
      ],
      "desc": "Nuvem de tempestade se forma. A cada turno pode gastar 1 Ação para fazer cair um raio causando 3d10 de dano Elétrico."
    },
    {
      "id": "vampiric_touch",
      "name": "Toque Vampírico (Vampiric Touch)",
      "level": 3,
      "school": "Necromancia",
      "time": "1 Ação",
      "range": "Pessoal",
      "components": "V, S",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "warlock",
        "wizard"
      ],
      "desc": "Ataques corpo a corpo mágicos causam 3d6 de dano Necrótico e recuperam metade do dano causado em pontos de vida para você."
    },
    {
      "id": "blink",
      "name": "Piscar (Blink)",
      "level": 3,
      "school": "Transmutação",
      "time": "1 Ação",
      "range": "Pessoal",
      "components": "V, S",
      "duration": "1 minuto",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Ao final do seu turno, role 1d20: com 11 ou mais você viaja para o Plano Etéreo até o próximo turno, sumindo do combate."
    },
    {
      "id": "mass_healing_word",
      "name": "Palavra Curativa em Massa (Mass Healing Word)",
      "level": 3,
      "school": "Abjuração",
      "time": "1 Ação Bônus",
      "range": "18 metros (60ft)",
      "components": "V",
      "duration": "Instantânea",
      "classes": [
        "cleric"
      ],
      "desc": "Com uma ação bônus rápida, restaura 2d4 + Modificador de Conjuração PV a até 6 aliados visíveis no alcance."
    },
    {
      "id": "fear",
      "name": "Medo (Fear)",
      "level": 3,
      "school": "Ilusão",
      "time": "1 Ação",
      "range": "Pessoal (cone 9m)",
      "components": "V, S, M (pena)",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "bard",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Projeta imagem aterrorizante. Criaturas no cone que falharem em SAB largam o que seguram e fogem Amedrontadas."
    },
    {
      "id": "crusaders_mantle",
      "name": "Manto do Cruzado (Crusader's Mantle)",
      "level": 3,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "Pessoal (raio 9m)",
      "components": "V",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "paladin"
      ],
      "desc": "Irradia poder sagrado. Todos os ataques com arma de aliados dentro de 9 metros causam +1d4 de dano Radiante extra."
    },
    {
      "id": "greater_invisibility",
      "name": "Invisibilidade Maior (Greater Invisibility)",
      "level": 4,
      "school": "Ilusão",
      "time": "1 Ação",
      "range": "Toque",
      "components": "V, S",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "bard",
        "sorcerer",
        "wizard"
      ],
      "desc": "Torna o alvo completamente Invisível por 1 minuto, e NÃO encerra mesmo se ele atacar ou conjurar magias!"
    },
    {
      "id": "polymorph",
      "name": "Polimorfia (Polymorph)",
      "level": 4,
      "school": "Transmutação",
      "time": "1 Ação",
      "range": "18 metros (60ft)",
      "components": "V, S, M (casulo)",
      "duration": "Concentração, até 1 hora",
      "classes": [
        "bard",
        "druid",
        "sorcerer",
        "wizard"
      ],
      "desc": "Transforma uma criatura em qualquer Fera de ND igual ou menor que o nível dela (ex: Tiranossauro Rex, Mamute ou Macaco Gigante)."
    },
    {
      "id": "dimension_door",
      "name": "Porta Dimensional (Dimension Door)",
      "level": 4,
      "school": "Conjuração",
      "time": "1 Ação",
      "range": "150 metros (500ft)",
      "components": "V",
      "duration": "Instantânea",
      "classes": [
        "bard",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Teletransporta você e até uma criatura voluntária adjacente instantaneamente para qualquer lugar a até 150 metros."
    },
    {
      "id": "wall_of_fire",
      "name": "Muralha de Fogo (Wall of Fire)",
      "level": 4,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "36 metros (18m x 6m)",
      "components": "V, S, M (fósforo)",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "druid",
        "sorcerer",
        "wizard"
      ],
      "desc": "Cria uma muralha impenetrável de chamas. Causa 5d8 de dano de Fogo a quem passar ou terminar o turno no lado quente."
    },
    {
      "id": "banishment",
      "name": "Banimento (Banishment)",
      "level": 4,
      "school": "Abjuração",
      "time": "1 Ação",
      "range": "18 metros (60ft)",
      "components": "V, S, M (ferro)",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "cleric",
        "paladin",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Expulsa uma criatura para outro plano dimensional em falha de CAR. Se ela for nativa de outro plano e a magia durar 1 min, fica banida."
    },
    {
      "id": "blight",
      "name": "Definhar (Blight)",
      "level": 4,
      "school": "Necromancia",
      "time": "1 Ação",
      "range": "9 metros (30ft)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "druid",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Drena a umidade e vitalidade de um alvo causando 8d8 de dano Necrótico em falha de CON (dano máximo contra plantas)."
    },
    {
      "id": "ice_storm",
      "name": "Tempestade de Gelo (Ice Storm)",
      "level": 4,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "90 metros (cilindro 6m)",
      "components": "V, S, M (pedra e água)",
      "duration": "Instantânea",
      "classes": [
        "druid",
        "sorcerer",
        "wizard"
      ],
      "desc": "Chuva de granizo massivo causa 2d8 de Concussão e 4d6 de Frio em falha de DES, tornando a área terreno difícil."
    },
    {
      "id": "death_ward",
      "name": "Proteção Contra a Morte (Death Ward)",
      "level": 4,
      "school": "Abjuração",
      "time": "1 Ação",
      "range": "Toque",
      "components": "V, S",
      "duration": "8 horas",
      "classes": [
        "cleric",
        "paladin"
      ],
      "desc": "Na primeira vez que a criatura tocada cairia a 0 PV, ela cai a 1 PV em vez disso, anulando também efeitos de morte instantânea."
    },
    {
      "id": "guardian_of_faith",
      "name": "Guardião da Fé (Guardian of Faith)",
      "level": 4,
      "school": "Conjuração",
      "time": "1 Ação",
      "range": "9 metros (30ft)",
      "components": "V",
      "duration": "8 horas",
      "classes": [
        "cleric"
      ],
      "desc": "Guardião espectral armado ataca qualquer criatura hostil que entrar a até 3m dele, causando 20 de dano Radiante automático."
    },
    {
      "id": "evards_black_tentacles",
      "name": "Tentáculos Negros de Evard",
      "level": 4,
      "school": "Conjuração",
      "time": "1 Ação",
      "range": "27 metros (quadrado 6m)",
      "components": "V, S, M (tentáculo)",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "wizard"
      ],
      "desc": "Tentáculos viscosos brotam do chão causando 3d6 de Concussão e deixando criaturas Contidas e sofrendo dano contínuo."
    },
    {
      "id": "cone_of_cold",
      "name": "Cone de Frio (Cone of Cold)",
      "level": 5,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "Pessoal (cone 18m)",
      "components": "V, S, M (cone de vidro)",
      "duration": "Instantânea",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Rajada congelante polar em cone de 18 metros. Causa devastadores 8d8 de dano de Frio em falha de CON."
    },
    {
      "id": "wall_of_force",
      "name": "Muralha de Força (Wall of Force)",
      "level": 5,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "36 metros (10 painéis)",
      "components": "V, S, M (pó de vidro)",
      "duration": "Concentração, até 10 minutos",
      "classes": [
        "wizard"
      ],
      "desc": "Cria uma barreira de força invisível e absolutamente indestrutível que bloqueia qualquer passagem e magia."
    },
    {
      "id": "teleportation_circle",
      "name": "Círculo de Teletransporte",
      "level": 5,
      "school": "Conjuração",
      "time": "1 minuto",
      "range": "3 metros (círculo 3m)",
      "components": "V, M (tintas raras de 50 PO)",
      "duration": "1 rodada",
      "classes": [
        "bard",
        "sorcerer",
        "wizard"
      ],
      "desc": "Abre um portal instantâneo para qualquer círculo de teletransporte permanente conhecido em qualquer lugar do mesmo plano."
    },
    {
      "id": "greater_restoration",
      "name": "Restauração Maior (Greater Restoration)",
      "level": 5,
      "school": "Abjuração",
      "time": "1 Ação",
      "range": "Toque",
      "components": "V, S, M (pó de diamante 100 PO)",
      "duration": "Instantânea",
      "classes": [
        "bard",
        "cleric",
        "druid"
      ],
      "desc": "Remove Encantamento, Petrificação, Maldições, redução de atributos ou redução de PV máximo de uma criatura."
    },
    {
      "id": "mass_cure_wounds",
      "name": "Curar Ferimentos em Massa (Mass Cure Wounds 2024)",
      "level": 5,
      "school": "Abjuração",
      "time": "1 Ação",
      "range": "18 metros (esfera 9m)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "bard",
        "cleric",
        "druid"
      ],
      "desc": "Ondas de energia curativa restauram 5d8 + Modificador de Conjuração PV a até 6 criaturas escolhidas."
    },
    {
      "id": "flame_strike",
      "name": "Coluna de Chamas (Flame Strike)",
      "level": 5,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "18 metros (cilindro 3m)",
      "components": "V, S, M (rubi)",
      "duration": "Instantânea",
      "classes": [
        "cleric"
      ],
      "desc": "Uma coluna de fogo divino desce dos céus causando 4d6 de dano de Fogo e 4d6 de dano Radiante (Total 8d6) em falha de DES."
    },
    {
      "id": "scrying",
      "name": "Vidência (Scrying)",
      "level": 5,
      "school": "Adivinhação",
      "time": "10 minutos",
      "range": "Pessoal",
      "components": "V, S, M (espelho de 1000 PO)",
      "duration": "Concentração, até 10 minutos",
      "classes": [
        "bard",
        "cleric",
        "druid",
        "warlock",
        "wizard"
      ],
      "desc": "Cria um sensor invisível que espiona e ouve qualquer criatura ou local escolhido no mesmo plano de existência."
    },
    {
      "id": "raise_dead",
      "name": "Reviver os Mortos (Raise Dead)",
      "level": 5,
      "school": "Necromancia",
      "time": "1 hora",
      "range": "Toque",
      "components": "V, S, M (diamante de 500 PO)",
      "duration": "Instantânea",
      "classes": [
        "bard",
        "cleric",
        "paladin"
      ],
      "desc": "Traz de volta à vida uma criatura morta há no máximo 10 dias, curando ferimentos mortais e venenos."
    },
    {
      "id": "telekinesis",
      "name": "Telecinese (Telekinesis)",
      "level": 5,
      "school": "Transmutação",
      "time": "1 Ação",
      "range": "18 metros (60ft)",
      "components": "V, S",
      "duration": "Concentração, até 10 minutos",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Move e arremessa criaturas (teste resistido de FOR) ou manipula objetos pesados de até 500 kg com a força da mente."
    },
    {
      "id": "hold_monster",
      "name": "Imobilizar Monstro (Hold Monster)",
      "level": 5,
      "school": "Encantamento",
      "time": "1 Ação",
      "range": "27 metros (90ft)",
      "components": "V, S, M (ferro)",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "bard",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Paralisa qualquer criatura (monstro, dragão, gigante) que falhe em Salvaguarda de Sabedoria pela duração."
    },
    {
      "id": "banishing_smite",
      "name": "Destruição Banidora (Banishing Smite)",
      "level": 5,
      "school": "Abjuração",
      "time": "1 Ação Bônus",
      "range": "Pessoal",
      "components": "V",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "paladin"
      ],
      "desc": "Seu ataque causa +5d10 de dano de Energia/Força. Se o ataque reduzir o alvo a 50 PV ou menos, ele é banido para outro plano."
    },
    {
      "id": "cloudkill",
      "name": "Nuvem Assassina (Cloudkill)",
      "level": 5,
      "school": "Conjuração",
      "time": "1 Ação",
      "range": "36 metros (esfera 6m)",
      "components": "V, S",
      "duration": "Concentração, até 10 minutos",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Nuvem de gás venenoso e denso causa 5d8 de dano de Veneno em falha de CON e se move 3m para longe de você a cada rodada."
    },
    {
      "id": "disintegrate",
      "name": "Desintegrar (Disintegrate)",
      "level": 6,
      "school": "Transmutação",
      "time": "1 Ação",
      "range": "18 metros (60ft)",
      "components": "V, S, M (lodestone)",
      "duration": "Instantânea",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Feixe verde desintegrador. Causa 10d6 + 40 de dano de Energia/Força em falha de DES. Se reduzir o alvo a 0 PV, ele vira pó!"
    },
    {
      "id": "chain_lightning",
      "name": "Corrente de Relâmpagos (Chain Lightning)",
      "level": 6,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "45 metros (150ft)",
      "components": "V, S, M (pele e âmbar)",
      "duration": "Instantânea",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Arco elétrico atinge um alvo e salta para mais 3 alvos a até 9 metros, causando 10d8 de dano Elétrico em cada um."
    },
    {
      "id": "heal",
      "name": "Cura Suprema (Heal)",
      "level": 6,
      "school": "Abjuração",
      "time": "1 Ação",
      "range": "18 metros (60ft)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "cleric",
        "druid"
      ],
      "desc": "Inunda um alvo com energia vital restaurando massivos 70 pontos de vida e curando cegueira, surdez e qualquer doença."
    },
    {
      "id": "globe_of_invulnerability",
      "name": "Globo de Invulnerabilidade",
      "level": 6,
      "school": "Abjuração",
      "time": "1 Ação",
      "range": "Pessoal (esfera 3m)",
      "components": "V, S, M (vidro)",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Esfera cintilante anula completamente qualquer magia de 5º círculo ou menor conjurada de fora para dentro da barreira."
    },
    {
      "id": "harm",
      "name": "Prejudicar (Harm)",
      "level": 6,
      "school": "Necromancia",
      "time": "1 Ação",
      "range": "18 metros (60ft)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "cleric"
      ],
      "desc": "Infesta o alvo com doença necrosante causando 14d6 de dano Necrótico e reduzindo seus PV máximos na mesma quantia."
    },
    {
      "id": "sunbeam",
      "name": "Feixe Solar (Sunbeam)",
      "level": 6,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "Pessoal (linha 18m)",
      "components": "V, S, M (lupa)",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "cleric",
        "druid",
        "sorcerer",
        "wizard"
      ],
      "desc": "Feixe brilhante de luz solar causa 6d8 de dano Radiante e impõe Cegueira em falha de CON a cada rodada."
    },
    {
      "id": "heroes_feast",
      "name": "Banquete dos Heróis (Heroes' Feast)",
      "level": 6,
      "school": "Conjuração",
      "time": "10 minutos",
      "range": "Pessoal",
      "components": "V, S, M (taça de 1000 PO)",
      "duration": "Instantânea (24h de efeito)",
      "classes": [
        "cleric",
        "druid"
      ],
      "desc": "Banquete magnífico para até 12 pessoas concede cura de doenças, imunidade a veneno/medo, vantagem em testes de SAB e +2d10 PV máximos por 24h."
    },
    {
      "id": "true_seeing",
      "name": "Visão da Verdade (True Seeing)",
      "level": 6,
      "school": "Adivinhação",
      "time": "1 Ação",
      "range": "Toque",
      "components": "V, S, M (unguento 250 PO)",
      "duration": "1 hora",
      "classes": [
        "bard",
        "cleric",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Concede Visão da Verdade a 36m: enxerga no escuro mágico, vê criaturas invisíveis e etéreas e detecta ilusões automaticamente."
    },
    {
      "id": "finger_of_death",
      "name": "Dedo da Morte (Finger of Death)",
      "level": 7,
      "school": "Necromancia",
      "time": "1 Ação",
      "range": "18 metros (60ft)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Energia necrótica causa 7d8 + 30 de dano Necrótico em falha de CON. Se matar um humanoide, ele ergue-se como Zumbi sob seu comando permanente."
    },
    {
      "id": "fire_storm",
      "name": "Tempestade de Fogo (Fire Storm)",
      "level": 7,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "45 metros (10 cubos 3m)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "cleric",
        "druid",
        "sorcerer"
      ],
      "desc": "Uma tempestade de fogo queima até 10 cubos conectados, causando 7d10 de dano de Fogo em falha de DES."
    },
    {
      "id": "teleport",
      "name": "Teletransporte (Teleport)",
      "level": 7,
      "school": "Conjuração",
      "time": "1 Ação",
      "range": "3 metros (10ft)",
      "components": "V",
      "duration": "Instantânea",
      "classes": [
        "bard",
        "sorcerer",
        "wizard"
      ],
      "desc": "Teletransporta você e até 8 criaturas voluntárias instantaneamente para qualquer destino no mesmo plano de existência."
    },
    {
      "id": "forcecage",
      "name": "Prisão de Energia (Forcecage)",
      "level": 7,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "30 metros (cubo 6m)",
      "components": "V, S, M (pó de rubi 1500 PO)",
      "duration": "1 hora (sem concentração)",
      "classes": [
        "bard",
        "warlock",
        "wizard"
      ],
      "desc": "Prende uma criatura em uma jaula mágica impenetrável sem salvaguarda inicial; teletransporte para escapar exige teste de CAR."
    },
    {
      "id": "plane_shift",
      "name": "Viagem Planar (Plane Shift)",
      "level": 7,
      "school": "Conjuração",
      "time": "1 Ação",
      "range": "Toque",
      "components": "V, S, M (diapasão sintonizado 250 PO)",
      "duration": "Instantânea",
      "classes": [
        "cleric",
        "druid",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Transporta você e até 8 criaturas voluntárias para outro plano de existência (ou bane um inimigo em ataque corpo a corpo)."
    },
    {
      "id": "resurrection",
      "name": "Ressurreição (Resurrection)",
      "level": 7,
      "school": "Necromancia",
      "time": "1 hora",
      "range": "Toque",
      "components": "V, S, M (diamante de 1000 PO)",
      "duration": "Instantânea",
      "classes": [
        "bard",
        "cleric"
      ],
      "desc": "Revive uma criatura morta há até um século, restaurando todos os órgãos perdidos e neutralizando venenos."
    },
    {
      "id": "dominate_monster",
      "name": "Dominar Monstro (Dominate Monster)",
      "level": 8,
      "school": "Encantamento",
      "time": "1 Ação",
      "range": "18 metros (60ft)",
      "components": "V, S",
      "duration": "Concentração, até 1 hora",
      "classes": [
        "bard",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Assume controle telepático total de qualquer criatura que falhe em Salvaguarda de Sabedoria."
    },
    {
      "id": "sunburst",
      "name": "Explosão Solar (Sunburst)",
      "level": 8,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "45 metros (esfera 18m)",
      "components": "V, S, M (pedra solar)",
      "duration": "Instantânea",
      "classes": [
        "cleric",
        "druid",
        "sorcerer",
        "wizard"
      ],
      "desc": "Luz solar brilhante cega e queima inimigos. Causa 12d6 de dano Radiante e impõe Cegueira por 1 minuto em falha de CON."
    },
    {
      "id": "earthquake",
      "name": "Terremoto (Earthquake)",
      "level": 8,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "150 metros (raio 30m)",
      "components": "V, S, M (argila)",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "cleric",
        "druid",
        "sorcerer"
      ],
      "desc": "Tremor sísmico colossal destrói estruturas, abre fissuras no solo e causa 50 de dano por rodada a construções."
    },
    {
      "id": "holy_aura",
      "name": "Aura Sagrada (Holy Aura)",
      "level": 8,
      "school": "Abjuração",
      "time": "1 Ação",
      "range": "Pessoal (raio 9m)",
      "components": "V, S, M (relicário de 1000 PO)",
      "duration": "Concentração, até 1 minuto",
      "classes": [
        "cleric"
      ],
      "desc": "Luz sagrada envolve aliados dentro de 9 metros concedendo Vantagem em todas as salvaguardas e impondo Desvantagem em ataques inimigos."
    },
    {
      "id": "antimagic_field",
      "name": "Campo Antimagia (Antimagic Field)",
      "level": 8,
      "school": "Abjuração",
      "time": "1 Ação",
      "range": "Pessoal (esfera 3m)",
      "components": "V, S, M (ferro)",
      "duration": "Concentração, até 1 hora",
      "classes": [
        "cleric",
        "wizard"
      ],
      "desc": "Uma esfera invisível de 3 metros anula absolutamente qualquer efeito mágico, feitiço ou item mágico que entre nela."
    },
    {
      "id": "maze",
      "name": "Labirinto (Maze)",
      "level": 8,
      "school": "Conjuração",
      "time": "1 Ação",
      "range": "18 metros (60ft)",
      "components": "V, S",
      "duration": "Concentração, até 10 minutos",
      "classes": [
        "wizard"
      ],
      "desc": "Bane uma criatura sem salvaguarda para um labirinto extradimensional; para escapar precisa passar em teste de INT CD 20."
    },
    {
      "id": "wish",
      "name": "Desejo (Wish)",
      "level": 9,
      "school": "Conjuração",
      "time": "1 Ação",
      "range": "Pessoal",
      "components": "V",
      "duration": "Instantânea",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "A magia mais poderosa do multiverso. Duplica qualquer magia de 8º círculo ou menor sem componentes ou altera a própria realidade."
    },
    {
      "id": "meteor_swarm",
      "name": "Chuva de Meteoros (Meteor Swarm)",
      "level": 9,
      "school": "Evocação",
      "time": "1 Ação",
      "range": "1,5 km (4 esferas 12m)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Quatro meteoros caem do céu causando 20d6 de dano de Fogo e 20d6 de dano de Concussão (Total 40d6!) em falha de DES."
    },
    {
      "id": "power_word_kill",
      "name": "Palavra de Poder: Matar (Power Word Kill)",
      "level": 9,
      "school": "Encantamento",
      "time": "1 Ação",
      "range": "18 metros (60ft)",
      "components": "V",
      "duration": "Instantânea",
      "classes": [
        "bard",
        "sorcerer",
        "warlock",
        "wizard"
      ],
      "desc": "Você profere uma palavra arcana suprema. Se o alvo tiver 100 pontos de vida ou menos, morre instantaneamente sem teste."
    },
    {
      "id": "mass_heal",
      "name": "Cura em Massa (Mass Heal)",
      "level": 9,
      "school": "Abjuração",
      "time": "1 Ação",
      "range": "18 metros (60ft)",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "cleric"
      ],
      "desc": "Inunda o campo com luz divina, distribuindo uma reserva massiva de 700 pontos de vida entre criaturas no alcance."
    },
    {
      "id": "time_stop",
      "name": "Parar o Tempo (Time Stop)",
      "level": 9,
      "school": "Transmutação",
      "time": "1 Ação",
      "range": "Pessoal",
      "components": "V",
      "duration": "1d4 + 1 rodadas",
      "classes": [
        "sorcerer",
        "wizard"
      ],
      "desc": "Para o fluxo do tempo para todos exceto você, ganhando 1d4 + 1 rodadas seguidas para agir e conjurar magias."
    },
    {
      "id": "foresight",
      "name": "Previdência / Sexto Sentido (Foresight)",
      "level": 9,
      "school": "Adivinhação",
      "time": "1 minuto",
      "range": "Toque",
      "components": "V, S, M (pena de beija-flor)",
      "duration": "8 horas",
      "classes": [
        "bard",
        "druid",
        "warlock",
        "wizard"
      ],
      "desc": "Concede clarividência sobre o futuro imediato: vantagem em todas as jogadas de d20 e impõe desvantagem em ataques inimigos por 8h."
    },
    {
      "id": "true_polymorph",
      "name": "Metamorfose Verdadeira (True Polymorph)",
      "level": 9,
      "school": "Transmutação",
      "time": "1 Ação",
      "range": "9 metros (30ft)",
      "components": "V, S, M (gota de mercúrio)",
      "duration": "Concentração, até 1 hora (ou permanente)",
      "classes": [
        "bard",
        "warlock",
        "wizard"
      ],
      "desc": "Transforma criatura em criatura, objeto em criatura ou criatura em objeto permanentemente se mantiver concentração por 1h."
    },
    {
      "id": "true_resurrection",
      "name": "Ressurreição Verdadeira (True Resurrection)",
      "level": 9,
      "school": "Necromancia",
      "time": "1 hora",
      "range": "Toque",
      "components": "V, S, M (diamantes de 25.000 PO)",
      "duration": "Instantânea",
      "classes": [
        "cleric",
        "druid"
      ],
      "desc": "Toca um falecido há até 200 anos recriando um novo corpo perfeito caso o original tenha sido desintegrado ou destruído."
    },
    {
      "id": "prismatic_wall",
      "name": "Muralha Prismática (Prismatic Wall)",
      "level": 9,
      "school": "Abjuração",
      "time": "1 Ação",
      "range": "18 metros (9m x 9m)",
      "components": "V, S",
      "duration": "10 minutos",
      "classes": [
        "wizard"
      ],
      "desc": "Muralha de 7 camadas de cores multicoloridas com efeitos de dano elemental devastador, petrificação e cegueira."
    },
    {
      "id": "power_word_heal",
      "name": "Palavra de Poder: Curar (Power Word Heal)",
      "level": 9,
      "school": "Abjuração",
      "time": "1 Ação",
      "range": "Toque",
      "components": "V, S",
      "duration": "Instantânea",
      "classes": [
        "bard"
      ],
      "desc": "Toca uma criatura restaurando instantaneamente TODOS os seus pontos de vida máximos e removendo todas as condições negativas."
    }
  ]
};

// Exportar para Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DND5E_DATA;
}
