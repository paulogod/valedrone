"""
Gera dnd/itens-magicos.js: o catálogo de itens mágicos do SRD 5.2 (D&D 2024)
para o Passo 5 do criador — nome em português, raridade, sintonização, onde o
item é vestido e, quando o item mexe em número da ficha, o bônus pronto
(CA, atributo, salvaguarda, teste, acerto e dano, magia).

Fonte: 5e-bits/5e-database (MIT), src/2024/en/5e-SRD-Magic-Items.json, que
estrutura o SRD 5.2 da Wizards of the Coast (CC-BY-4.0). Os nomes em
português, os resumos e os bônus são deste arquivo. O "i" de cada item abre a
página dele no AideDD (texto inteiro de 2024).

- Itens com variantes (+1/+2/+3, Trompa de Valhala) entram pelas variantes;
  os de raridade variável que o SRD descreve num texto só (Cinturão de Força
  do Gigante, Pedra Ioun, Poções de Cura, Pergaminho) viram uma entrada por
  versão.

Uso:  python3 dnd/tools/gerar-itens-magicos.py [caminho/5e-SRD-Magic-Items.json]
"""
import json
import os
import re
import sys
import urllib.request

URL = "https://raw.githubusercontent.com/5e-bits/5e-database/main/src/2024/en/5e-SRD-Magic-Items.json"
SAIDA = os.path.join(os.path.dirname(__file__), "..", "itens-magicos.js")
RARIDADES = ["Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact", "Varies"]

ABS = ["str", "dex", "con", "int", "wis", "cha"]


# ---------------------------------------------------------------- bônus
def arma(n):
    """Arma +N: acerto e dano deste item"""
    return [{"target": "this_weapon", "atk": f"+{n}", "dmg": f"+{n}"}]


def atributo(ab, n, maximo):
    return {"target": "ability", "ref": ab, "atk": f"+{n}", "max": maximo}


def fixa(ab, valor):
    return {"target": "ability_set", "ref": ab, "atk": str(valor)}


def resist(ref, n):
    return {"target": "save", "ref": ref, "atk": f"+{n}"}


def teste(ref, n):
    return {"target": "check", "ref": ref, "atk": f"+{n}"}


def magia(alvo, n):
    return {"target": alvo, "atk": f"+{n}"}


# --------------------------------------------------- nome em português
# índice do SRD -> (nome, resumo, extras). extras: ca, b (bônus), tipo,
# slot, dano, dt (tipo de dano), cond.
PT = {
    "adamantine-armor": ("Armadura de Adamante", "Acerto Crítico contra você vira acerto normal."),
    "ammunition-1": ("Munição +1", "+1 no acerto e no dano com esta munição.", {"b": [{"target": "weapons_ranged", "atk": "+1", "dmg": "+1"}]}),
    "ammunition-2": ("Munição +2", "+2 no acerto e no dano com esta munição.", {"b": [{"target": "weapons_ranged", "atk": "+2", "dmg": "+2"}]}),
    "ammunition-3": ("Munição +3", "+3 no acerto e no dano com esta munição.", {"b": [{"target": "weapons_ranged", "atk": "+3", "dmg": "+3"}]}),
    "ammunition-of-slaying": ("Munição da Matança", "Contra o tipo de criatura escolhido: +6d10 de dano (salvaguarda de CON CD 17 para metade)."),
    "amulet-of-health": ("Amuleto da Saúde", "Sua Constituição é 19 enquanto o usa (sem efeito se já for 19 ou mais).", {"b": [fixa("con", 19)]}),
    "amulet-of-proof-against-detection-and-location": ("Amuleto contra Detecção e Localização", "Você não pode ser alvo de Adivinhação nem percebido por sensores mágicos."),
    "amulet-of-the-planes": ("Amuleto dos Planos", "Conjura Viagem Planar (teste de INT CD 15)."),
    "animated-shield": ("Escudo Animado", "Ação Bônus: o escudo flutua e protege você por 1 minuto, deixando as mãos livres."),
    "apparatus-of-the-crab": ("Aparato do Caranguejo", "Veículo submarino em forma de lagosta gigante."),
    "armor-1": ("Armadura +1", "+1 na CA. Escolha a armadura base em Armadura Equipada.", {"ca": 1}),
    "armor-2": ("Armadura +2", "+2 na CA. Escolha a armadura base em Armadura Equipada.", {"ca": 2}),
    "armor-3": ("Armadura +3", "+3 na CA. Escolha a armadura base em Armadura Equipada.", {"ca": 3}),
    "armor-of-invulnerability": ("Armadura da Invulnerabilidade", "Resistência a dano Concussivo, Cortante e Perfurante; 1/dia, Imunidade por 10 minutos."),
    "armor-of-resistance": ("Armadura de Resistência", "Resistência a um tipo de dano."),
    "armor-of-vulnerability": ("Armadura da Vulnerabilidade", "Amaldiçoada: Resistência a um tipo físico e Vulnerabilidade aos outros dois."),
    "arrow-catching-shield": ("Escudo Apanha-Flechas", "+2 na CA contra ataques à distância (além do escudo); pode desviar ataques de aliados."),
    "bag-of-beans": ("Bolsa de Feijões", "Feijões que, plantados, criam efeitos aleatórios."),
    "bag-of-devouring": ("Bolsa Devoradora", "Parece uma Bolsa Guardiã, mas devora o que entra."),
    "bag-of-holding": ("Bolsa Guardiã", "Guarda até 250 kg em 2 m³ e pesa sempre 7,5 kg."),
    "bag-of-tricks": ("Bolsa de Truques", "Tira uma bolinha que vira um animal aliado (3 cargas)."),
    "bead-of-force": ("Conta de Força", "Explode em uma esfera de força: 5d4 de dano de Força e prende criaturas."),
    "belt-of-dwarvenkind": ("Cinto dos Anões", "+2 em Constituição (máximo 20), Anão, Visão no Escuro e Resistência a Veneno.", {"b": [atributo("con", 2, 20)]}),
    "berserker-axe": ("Machado do Berserker", "+1 no acerto e no dano, +1 PV por nível. Amaldiçoado.", {"b": arma(1), "dano": "1d12", "dt": "Cortante"}),
    "boots-of-elvenkind": ("Botas Élficas", "Seus passos não fazem som; Vantagem em Furtividade (Destreza)."),
    "boots-of-levitation": ("Botas da Levitação", "Conjura Levitação em si à vontade."),
    "boots-of-speed": ("Botas da Velocidade", "Ação Bônus: Deslocamento dobrado e ataques de Oportunidade com Desvantagem por 10 minutos."),
    "boots-of-striding-and-springing": ("Botas de Andar e Saltar", "Deslocamento mínimo de 9 m e salto triplicado."),
    "boots-of-the-winterlands": ("Botas das Terras Invernais", "Resistência a Gélido e ignora terreno difícil de gelo e neve."),
    "bowl-of-commanding-water-elementals": ("Tigela de Comando de Elementais da Água", "Invoca um Elemental da Água."),
    "bracers-of-archery": ("Braçadeiras do Arqueiro", "Proficiência com Arco Longo e Arco Curto e +2 no dano com eles.", {"b": [{"target": "weapons_ranged", "atk": "", "dmg": "+2"}]}),
    "bracers-of-defense": ("Braçadeiras de Defesa", "+2 na CA se estiver sem armadura e sem escudo.", {"ca": 2, "cond": "sem_armadura_escudo"}),
    "brazier-of-commanding-fire-elementals": ("Braseiro de Comando de Elementais do Fogo", "Invoca um Elemental do Fogo."),
    "brooch-of-shielding": ("Broche de Proteção", "Resistência a dano de Força e imunidade a Mísseis Mágicos."),
    "broom-of-flying": ("Vassoura Voadora", "Voa com Deslocamento de 15 m."),
    "candle-of-invocation": ("Vela da Invocação", "Bênçãos para criaturas da mesma tendência; pode conjurar Portal."),
    "cape-of-the-mountebank": ("Capa do Charlatão", "Conjura Porta Dimensional 1/dia."),
    "carpet-of-flying": ("Tapete Voador", "Tapete que voa carregando passageiros."),
    "censer-of-controlling-air-elementals": ("Incensário de Controle de Elementais do Ar", "Invoca um Elemental do Ar."),
    "chime-of-opening": ("Sino da Abertura", "Abre fechaduras e trancas a até 36 m (10 cargas)."),
    "circlet-of-blasting": ("Diadema Explosivo", "Conjura Raio Ardente (+5 no acerto) 1/dia."),
    "cloak-of-arachnida": ("Manto da Aracnídea", "Resistência a Veneno, escalada de aranha e Teia 1/dia."),
    "cloak-of-displacement": ("Manto do Deslocamento", "Ataques contra você têm Desvantagem até você sofrer dano."),
    "cloak-of-elvenkind": ("Manto Élfico", "Testes de Sabedoria (Percepção) para vê-lo têm Desvantagem; Vantagem em Furtividade."),
    "cloak-of-protection": ("Manto de Proteção", "+1 na CA e +1 em todas as salvaguardas.", {"ca": 1, "b": [resist("all", 1)]}),
    "cloak-of-the-bat": ("Manto do Morcego", "Vantagem em Furtividade, voo no escuro e forma de morcego."),
    "cloak-of-the-manta-ray": ("Manto da Arraia", "Respira debaixo d'água e nada a 18 m."),
    "crystal-ball": ("Bola de Cristal", "Conjura Vidência (CD 17)."),
    "crystal-ball-of-mind-reading": ("Bola de Cristal da Leitura Mental", "Vidência e Detectar Pensamentos no alvo."),
    "crystal-ball-of-telepathy": ("Bola de Cristal da Telepatia", "Vidência e comunicação telepática com o alvo."),
    "crystal-ball-of-true-seeing": ("Bola de Cristal da Visão Verdadeira", "Vidência com Visão Verdadeira."),
    "cube-of-force": ("Cubo de Força", "Cria uma barreira cúbica de força (36 cargas)."),
    "cubic-gate": ("Portal Cúbico", "Cada face abre um portal para outro plano."),
    "dagger-of-venom": ("Adaga do Veneno", "+1 no acerto e no dano; 1/dia, veneno de 2d10 e Envenenado.", {"b": arma(1), "dano": "1d4", "dt": "Perfurante"}),
    "dancing-sword": ("Espada Dançante", "Ação Bônus: a espada flutua e ataca sozinha."),
    "deck-of-illusions": ("Baralho das Ilusões", "Cartas que criam ilusões de criaturas."),
    "decanter-of-endless-water": ("Decantador de Água Infinita", "Jorra água doce ou salgada."),
    "defender": ("Defensora", "+3 no acerto e no dano; pode passar parte do bônus para a CA.", {"b": arma(3)}),
    "demon-armor": ("Armadura Demoníaca", "+1 na CA, Abissal e desarmado de 1d8 Cortante com +1. Amaldiçoada.", {"ca": 1, "b": [{"target": "unarmed", "atk": "+1", "dmg": "+1"}]}),
    "dimensional-shackles": ("Algemas Dimensionais", "Impedem teletransporte e viagem planar de quem as usa."),
    "dragon-orb": ("Orbe do Dragão", "Artefato que controla dragões."),
    "dragon-scale-mail": ("Cota de Escamas de Dragão", "+1 na CA, Vantagem contra sopro de dragão e Resistência ao tipo do dragão.", {"ca": 1}),
    "dragon-slayer": ("Matadora de Dragões", "+1 no acerto e no dano; +3d6 contra dragões.", {"b": arma(1)}),
    "dust-of-disappearance": ("Pó do Desaparecimento", "Deixa Invisível por 2d4 minutos quem estiver na nuvem."),
    "dust-of-dryness": ("Pó da Secura", "Absorve até 4,5 m³ de água numa pastilha."),
    "dust-of-sneezing-and-choking": ("Pó de Espirrar e Engasgar", "Parece Pó do Desaparecimento; quem respira fica Incapacitado."),
    "dwarven-plate": ("Placas Anãs", "+2 na CA; reduz empurrões em 3 m.", {"ca": 2}),
    "dwarven-thrower": ("Arremessadora Anã", "+3 no acerto e no dano; volta à mão ao ser arremessada.", {"b": arma(3), "dano": "1d8", "dt": "Concussão"}),
    "efficient-quiver": ("Aljava Eficiente", "Três compartimentos que guardam dezenas de flechas e virotes."),
    "efreeti-bottle": ("Garrafa do Efreeti", "Libera um Efreeti que pode servir ou atacar."),
    "elemental-gem": ("Gema Elemental", "Quebrada, invoca um elemental."),
    "elven-chain": ("Cota Élfica", "+1 na CA e conta como armadura leve para proficiência.", {"ca": 1}),
    "eversmoking-bottle": ("Garrafa da Fumaça Eterna", "Solta uma nuvem de fumaça que escurece a área."),
    "eyes-of-charming": ("Olhos do Encanto", "Conjura Enfeitiçar Pessoa (CD 13), 3 cargas."),
    "eyes-of-minute-seeing": ("Olhos da Visão Minuciosa", "Vantagem em Investigação a até 30 cm."),
    "eyes-of-the-eagle": ("Olhos da Águia", "Vantagem em Percepção (Sabedoria) pela visão."),
    "feather-token": ("Símbolo de Pena", "Pena de uso único: âncora, pássaro, leque, barco, árvore ou chicote."),
    "figurine-of-wondrous-power": ("Estatueta de Poder Maravilhoso", "Vira uma criatura aliada por algumas horas."),
    "flame-tongue": ("Língua de Fogo", "Ação Bônus: lâmina em chamas, +2d6 de dano de Fogo e luz.", {"b": [{"target": "this_weapon", "atk": "", "dmg": "2d6 Fogo"}]}),
    "folding-boat": ("Barco Dobrável", "Caixa que vira barco ou navio."),
    "frost-brand": ("Marca Gélida", "+1d6 de dano Gélido, Resistência a Fogo e apaga chamas.", {"b": [{"target": "this_weapon", "atk": "", "dmg": "1d6 Gélido"}]}),
    "gauntlets-of-ogre-power": ("Manoplas da Força do Ogro", "Sua Força é 19 enquanto as usa (sem efeito se já for 19 ou mais).", {"b": [fixa("str", 19)]}),
    "gem-of-brightness": ("Gema do Brilho", "Luz, raio cegante e clarão (50 cargas)."),
    "gem-of-seeing": ("Gema da Visão", "Visão Verdadeira por 10 minutos (3 cargas)."),
    "giant-slayer": ("Matadora de Gigantes", "+1 no acerto e no dano; +2d6 contra gigantes.", {"b": arma(1)}),
    "glamoured-studded-leather": ("Couro Batido Encantado", "+1 na CA e muda de aparência.", {"ca": 1}),
    "gloves-of-missile-snaring": ("Luvas Apanha-Projéteis", "Reação: reduz o dano de um ataque à distância."),
    "gloves-of-swimming-and-climbing": ("Luvas de Natação e Escalada", "Escalada e natação iguais ao Deslocamento; +5 em Atletismo para escalar e nadar."),
    "goggles-of-night": ("Óculos da Noite", "Visão no Escuro de 18 m."),
    "hammer-of-thunderbolts": ("Martelo dos Raios", "+1 no acerto e no dano; com Cinturão e Manoplas fica muito mais forte.", {"b": arma(1), "dano": "2d6", "dt": "Concussão"}),
    "handy-haversack": ("Mochila Prática", "Bolsos extradimensionais; o item procurado sempre está por cima."),
    "hat-of-disguise": ("Chapéu do Disfarce", "Conjura Disfarçar-se à vontade."),
    "headband-of-intellect": ("Tiara do Intelecto", "Sua Inteligência é 19 enquanto a usa (sem efeito se já for 19 ou mais).", {"b": [fixa("int", 19)]}),
    "helm-of-brilliance": ("Elmo do Brilho", "Gemas que conjuram Bola de Fogo, Luz do Dia e outras."),
    "helm-of-comprehending-languages": ("Elmo da Compreensão de Idiomas", "Conjura Compreender Idiomas à vontade."),
    "helm-of-telepathy": ("Elmo da Telepatia", "Detectar Pensamentos e Sugestão."),
    "helm-of-teleportation": ("Elmo do Teletransporte", "Conjura Teletransporte (3 cargas)."),
    "holy-avenger": ("Vingadora Sagrada", "+3 no acerto e no dano; +2d10 Radiante contra Corruptores e Mortos-vivos; aura de Vantagem em salvaguardas contra magias.", {"b": arma(3)}),
    "horn-of-blasting": ("Trompa da Explosão", "Cone de 9 m: 5d6 Trovejante e Surdo."),
    "horn-of-valhalla-1": ("Trompa de Valhala (Prata)", "Invoca guerreiros espirituais."),
    "horn-of-valhalla-2": ("Trompa de Valhala (Latão)", "Invoca guerreiros espirituais."),
    "horn-of-valhalla-3": ("Trompa de Valhala (Bronze)", "Invoca guerreiros espirituais."),
    "horn-of-valhalla-4": ("Trompa de Valhala (Ferro)", "Invoca guerreiros espirituais."),
    "horseshoes-of-a-zephyr": ("Ferraduras do Zéfiro", "A montaria anda sobre o ar e não cansa."),
    "horseshoes-of-speed": ("Ferraduras da Velocidade", "+9 m no Deslocamento da montaria."),
    "immovable-rod": ("Bastão Imóvel", "Fica preso no ar ao apertar o botão."),
    "instant-fortress": ("Fortaleza Instantânea", "Cubo que vira uma torre de pedra."),
    "iron-bands": ("Faixas de Ferro", "Prendem uma criatura (Contido)."),
    "iron-flask": ("Frasco de Ferro", "Aprisiona uma criatura de outro plano."),
    "javelin-of-lightning": ("Azagaia do Relâmpago", "Arremessada vira um raio: 4d6 Elétrico em linha.", {"dano": "1d6", "dt": "Perfurante"}),
    "lantern-of-revealing": ("Lanterna Reveladora", "A luz revela criaturas e objetos Invisíveis."),
    "luck-blade": ("Lâmina da Sorte", "+1 no acerto e no dano, +1 nas salvaguardas, rerrolar 1/dia e Desejos.", {"b": arma(1) + [resist("all", 1)]}),
    "mace-of-disruption": ("Maça da Ruptura", "+2d6 Radiante contra Corruptores e Mortos-vivos; pode destruí-los.", {"dano": "1d6", "dt": "Concussão"}),
    "mace-of-smiting": ("Maça do Golpe", "+1 no acerto e no dano (+3 contra Constructos).", {"b": arma(1), "dano": "1d6", "dt": "Concussão"}),
    "mace-of-terror": ("Maça do Terror", "Emana terror: criaturas ficam Amedrontadas (3 cargas).", {"dano": "1d6", "dt": "Concussão"}),
    "mantle-of-spell-resistance": ("Manto de Resistência a Magia", "Vantagem em salvaguardas contra magias."),
    "manual-of-bodily-health": ("Manual da Saúde Corporal", "Estudado por 48 h: +2 em Constituição (máximo 30) para sempre.", {"b": [atributo("con", 2, 30)]}),
    "manual-of-gainful-exercise": ("Manual do Exercício Proveitoso", "Estudado por 48 h: +2 em Força (máximo 30) para sempre.", {"b": [atributo("str", 2, 30)]}),
    "manual-of-golems": ("Manual dos Golens", "Ensina a construir um golem."),
    "manual-of-quickness-of-action": ("Manual da Rapidez de Ação", "Estudado por 48 h: +2 em Destreza (máximo 30) para sempre.", {"b": [atributo("dex", 2, 30)]}),
    "marvelous-pigments": ("Pigmentos Maravilhosos", "O que é pintado vira real."),
    "medallion-of-thoughts": ("Medalhão dos Pensamentos", "Conjura Detectar Pensamentos (3 cargas)."),
    "mirror-of-life-trapping": ("Espelho Aprisionador", "Prende criaturas que olham para ele."),
    "mithral-armor": ("Armadura de Mitral", "Sem Desvantagem em Furtividade e sem Força mínima."),
    "mysterious-deck": ("Baralho Misterioso", "Cartas com efeitos imprevisíveis (o Baralho das Muitas Coisas)."),
    "necklace-of-adaptation": ("Colar da Adaptação", "Respira em qualquer ambiente; Vantagem contra gases."),
    "necklace-of-fireballs": ("Colar de Bolas de Fogo", "Contas que viram Bola de Fogo."),
    "necklace-of-prayer-beads": ("Colar de Contas de Oração", "Contas que conjuram magias de clérigo."),
    "nine-lives-stealer": ("Ladra de Nove Vidas", "+2 no acerto e no dano; no crítico pode matar na hora.", {"b": arma(2)}),
    "oathbow": ("Arco do Juramento", "Inimigo jurado: Vantagem e +3d6 de dano.", {"dano": "1d8", "dt": "Perfurante"}),
    "oil-of-etherealness": ("Óleo da Etereidade", "Efeito de Forma Etérea por 1 hora."),
    "oil-of-sharpness": ("Óleo da Afiação", "Arma ou munição ganha +3 por 1 hora."),
    "oil-of-slipperiness": ("Óleo da Escorregadia", "Efeito de Movimentação Livre ou de Graxa."),
    "pearl-of-power": ("Pérola do Poder", "Recupera um espaço de magia de até 3º círculo 1/dia."),
    "periapt-of-health": ("Periapto da Saúde", "Imune a doenças; Vantagem contra Envenenado."),
    "periapt-of-proof-against-poison": ("Periapto contra Veneno", "Imunidade a Veneno e a Envenenado."),
    "periapt-of-wound-closure": ("Periapto do Fechamento de Feridas", "Testes de morte com 9 ou menos viram 10; Dados de Vida curam o dobro."),
    "philter-of-love": ("Filtro do Amor", "Enfeitiçado pela primeira criatura que vir."),
    "pipes-of-haunting": ("Flauta Assombrada", "Amedronta quem ouvir (3 cargas)."),
    "pipes-of-the-sewers": ("Flauta dos Esgotos", "Atrai e comanda ratos."),
    "plate-armor-of-etherealness": ("Armadura de Placas da Etereidade", "Conjura Forma Etérea 1/dia."),
    "portable-hole": ("Buraco Portátil", "Pano que vira um buraco extradimensional de 3 m de profundidade."),
    "potion-of-animal-friendship": ("Poção da Amizade Animal", "Conjura Amizade Animal por 24 horas."),
    "potion-of-clairvoyance": ("Poção da Clarividência", "Efeito de Clarividência."),
    "potion-of-climbing": ("Poção da Escalada", "Deslocamento de escalada por 1 hora."),
    "potion-of-diminution": ("Poção da Diminuição", "Efeito de Aumentar/Reduzir (reduzir) por 1d4 horas."),
    "potion-of-flying": ("Poção do Voo", "Deslocamento de voo igual ao normal por 1 hora."),
    "potion-of-growth": ("Poção do Crescimento", "Efeito de Aumentar/Reduzir (aumentar) por 1d4 horas."),
    "potion-of-gaseous-form": ("Poção da Forma Gasosa", "Efeito de Forma Gasosa por 1 hora."),
    "potion-of-heroism": ("Poção do Heroísmo", "10 PV temporários e Bênção por 1 hora."),
    "potion-of-invisibility": ("Poção da Invisibilidade", "Invisível por 1 hora (acaba ao atacar ou conjurar)."),
    "potion-of-mind-reading": ("Poção da Leitura Mental", "Efeito de Detectar Pensamentos (CD 13)."),
    "potion-of-poison": ("Poção do Veneno", "Parece Poção de Cura; causa dano de Veneno."),
    "potion-of-resistance": ("Poção da Resistência", "Resistência a um tipo de dano por 1 hora."),
    "potion-of-speed": ("Poção da Velocidade", "Efeito de Velocidade por 1 minuto."),
    "potion-of-water-breathing": ("Poção da Respiração Aquática", "Respira debaixo d'água por 24 horas."),
    "ring-of-animal-influence": ("Anel da Influência Animal", "Amizade Animal, Medo e Falar com Animais."),
    "ring-of-djinni-summoning": ("Anel de Invocação de Djinni", "Invoca um Djinni."),
    "ring-of-elemental-command": ("Anel de Comando Elemental", "Comanda elementais de um tipo."),
    "ring-of-evasion": ("Anel da Evasão", "Reação: sucesso em salvaguarda de DES (3 cargas)."),
    "ring-of-feather-falling": ("Anel da Queda Suave", "Cai devagar e sem dano."),
    "ring-of-free-action": ("Anel da Movimentação Livre", "Terreno difícil e Paralisia mágica não o afetam."),
    "ring-of-invisibility": ("Anel da Invisibilidade", "Fica Invisível à vontade."),
    "ring-of-jumping": ("Anel do Salto", "Conjura Salto à vontade."),
    "ring-of-mind-shielding": ("Anel do Escudo Mental", "Imune a leitura de pensamentos e mentiras detectadas."),
    "ring-of-protection": ("Anel de Proteção", "+1 na CA e +1 em todas as salvaguardas.", {"ca": 1, "b": [resist("all", 1)]}),
    "ring-of-regeneration": ("Anel da Regeneração", "Recupera 1d6 PV a cada 10 minutos e regenera membros."),
    "ring-of-resistance": ("Anel da Resistência", "Resistência a um tipo de dano."),
    "ring-of-shooting-stars": ("Anel das Estrelas Cadentes", "Globos de luz, raios e estrelas cadentes."),
    "ring-of-spell-storing": ("Anel de Armazenar Magias", "Guarda até 5 círculos de magias."),
    "ring-of-spell-turning": ("Anel de Reflexão de Magias", "Vantagem contra magias e reflete magias de alvo único."),
    "ring-of-swimming": ("Anel da Natação", "Deslocamento de natação de 12 m."),
    "ring-of-telekinesis": ("Anel da Telecinese", "Conjura Telecinese à vontade."),
    "ring-of-the-ram": ("Anel do Carneiro", "Cabeça de carneiro espectral: 2d10 de Força por carga."),
    "ring-of-three-wishes": ("Anel dos Três Desejos", "Conjura Desejo (3 cargas)."),
    "ring-of-warmth": ("Anel do Calor", "Resistência a Gélido; confortável no frio."),
    "ring-of-water-walking": ("Anel de Andar na Água", "Anda sobre líquidos."),
    "ring-of-x-ray-vision": ("Anel da Visão de Raio X", "Enxerga através de matéria sólida."),
    "robe-of-eyes": ("Túnica dos Olhos", "Vê em todas as direções, Visão no Escuro e vê o Invisível."),
    "robe-of-scintillating-colors": ("Túnica das Cores Cintilantes", "Luzes que deixam inimigos Atordoados."),
    "robe-of-stars": ("Túnica das Estrelas", "+1 nas salvaguardas; estrelas que conjuram Mísseis Mágicos.", {"b": [resist("all", 1)]}),
    "robe-of-the-archmagi": ("Túnica do Arquimago", "CA base 15 + DES sem armadura; Vantagem contra magias e +2 na CD e no ataque de magia.", {"b": [magia("spell_all", 2)]}),
    "robe-of-useful-items": ("Túnica dos Itens Úteis", "Remendos que viram objetos de verdade."),
    "rod-of-absorption": ("Cetro da Absorção", "Absorve magias de alvo único e guarda os círculos."),
    "rod-of-alertness": ("Cetro do Alerta", "Vantagem em Percepção e Iniciativa; aura de +1 na CA e salvaguardas."),
    "rod-of-lordly-might": ("Cetro do Poder Senhorial", "Maça +3 que vira outras armas e ferramentas.", {"b": arma(3), "dano": "1d6", "dt": "Concussão"}),
    "rod-of-rulership": ("Cetro do Comando", "Enfeitiça criaturas a 36 m 1/dia."),
    "rod-of-security": ("Cetro da Segurança", "Leva o grupo para um paraíso seguro."),
    "rope-of-climbing": ("Corda da Escalada", "Corda que se move e se amarra sozinha."),
    "rope-of-entanglement": ("Corda do Enredamento", "Prende uma criatura (Contida)."),
    "scarab-of-protection": ("Escaravelho de Proteção", "+1 na CA, Vantagem contra magias e proteção contra necromancia.", {"ca": 1}),
    "scimitar-of-speed": ("Cimitarra da Velocidade", "+2 no acerto e no dano; ataque extra como Ação Bônus.", {"b": arma(2), "dano": "1d6", "dt": "Cortante"}),
    "shield-1": ("Escudo +1", "+1 na CA além do escudo. Escolha o escudo em Escudo Equipado.", {"ca": 1}),
    "shield-2": ("Escudo +2", "+2 na CA além do escudo. Escolha o escudo em Escudo Equipado.", {"ca": 2}),
    "shield-3": ("Escudo +3", "+3 na CA além do escudo. Escolha o escudo em Escudo Equipado.", {"ca": 3}),
    "shield-of-missile-attraction": ("Escudo de Atração de Projéteis", "Resistência a ataques à distância, mas atrai os disparos. Amaldiçoado."),
    "slippers-of-spider-climbing": ("Sapatilhas da Escalada de Aranha", "Anda em paredes e tetos."),
    "sovereign-glue": ("Cola Soberana", "Une dois objetos para sempre."),
    "spellguard-shield": ("Escudo Guarda-Magias", "Vantagem contra magias; ataques mágicos contra você com Desvantagem."),
    "sphere-of-annihilation": ("Esfera da Aniquilação", "Esfera de vazio que destrói o que toca."),
    "staff-of-charming": ("Cajado do Encantamento", "Enfeitiçar Pessoa, Comando e Compreender Idiomas."),
    "staff-of-fire": ("Cajado do Fogo", "Resistência a Fogo; Mãos Flamejantes, Bola de Fogo e Muralha de Fogo."),
    "staff-of-frost": ("Cajado do Gelo", "Resistência a Gélido; Cone de Frio e Tempestade de Gelo."),
    "staff-of-healing": ("Cajado da Cura", "Curar Ferimentos, Restauração Menor e Curar Ferimentos em Massa."),
    "staff-of-power": ("Cajado do Poder", "Bordão +2; +2 na CA, nas salvaguardas e no ataque mágico.", {"tipo": "weapon", "ca": 2, "dano": "1d6", "dt": "Concussão", "b": arma(2) + [resist("all", 2), magia("spell_attack", 2)]}),
    "staff-of-striking": ("Cajado do Golpe", "Bordão +3; gasta cargas para +1d6 de Força por carga.", {"tipo": "weapon", "dano": "1d6", "dt": "Concussão", "b": arma(3)}),
    "staff-of-swarming-insects": ("Cajado dos Insetos", "Nuvem de insetos e Praga de Insetos."),
    "staff-of-the-magi": ("Cajado do Mago", "Bordão +2; +2 no ataque mágico, Vantagem contra magias e muitas magias.", {"tipo": "weapon", "dano": "1d6", "dt": "Concussão", "b": arma(2) + [magia("spell_attack", 2)]}),
    "staff-of-the-python": ("Cajado da Píton", "Vira uma Cobra Constritora Gigante."),
    "staff-of-the-woodlands": ("Cajado dos Bosques", "Bordão +2; +2 no ataque mágico e magias da natureza.", {"tipo": "weapon", "dano": "1d6", "dt": "Concussão", "b": arma(2) + [magia("spell_attack", 2)]}),
    "staff-of-thunder-and-lightning": ("Cajado do Trovão e Relâmpago", "Bordão +2; relâmpago, trovão e tempestade.", {"tipo": "weapon", "dano": "1d6", "dt": "Concussão", "b": arma(2)}),
    "staff-of-withering": ("Cajado do Definhamento", "Gasta carga para +2d10 Necrótico.", {"tipo": "weapon", "dano": "1d6", "dt": "Concussão"}),
    "stone-of-controlling-earth-elementals": ("Pedra de Controle de Elementais da Terra", "Invoca um Elemental da Terra."),
    "stone-of-good-luck-(luckstone)": ("Pedra da Sorte", "+1 em testes de atributo e salvaguardas.", {"b": [teste("all", 1), resist("all", 1)]}),
    "sun-blade": ("Lâmina Solar", "+2 no acerto e no dano, dano Radiante; +1d8 contra Mortos-vivos.", {"b": arma(2), "dano": "1d8", "dt": "Radiante"}),
    "sword-of-life-stealing": ("Espada Rouba-Vida", "No 20: +10 Necrótico e você ganha 10 PV temporários."),
    "sword-of-sharpness": ("Espada Afiada", "No 20: +14 Cortante e pode decepar um membro."),
    "sword-of-wounding": ("Espada Ferina", "Feridas que sangram 1d4 Necrótico por turno."),
    "talisman-of-pure-good": ("Talismã do Bem Supremo", "+2 no ataque mágico; pode destruir Corruptores.", {"b": [magia("spell_attack", 2)]}),
    "talisman-of-the-sphere": ("Talismã da Esfera", "Controla a Esfera da Aniquilação."),
    "talisman-of-ultimate-evil": ("Talismã do Mal Supremo", "+2 no ataque mágico; pode destruir quem é Bom.", {"b": [magia("spell_attack", 2)]}),
    "tome-of-clear-thought": ("Tomo do Pensamento Claro", "Estudado por 48 h: +2 em Inteligência (máximo 30) para sempre.", {"b": [atributo("int", 2, 30)]}),
    "tome-of-leadership-and-influence": ("Tomo da Liderança e Influência", "Estudado por 48 h: +2 em Carisma (máximo 30) para sempre.", {"b": [atributo("cha", 2, 30)]}),
    "tome-of-understanding": ("Tomo da Compreensão", "Estudado por 48 h: +2 em Sabedoria (máximo 30) para sempre.", {"b": [atributo("wis", 2, 30)]}),
    "trident-of-fish-command": ("Tridente do Comando dos Peixes", "Conjura Dominar Fera em feras nadadoras.", {"dano": "1d8", "dt": "Perfurante"}),
    "universal-solvent": ("Solvente Universal", "Dissolve qualquer adesivo."),
    "vicious-weapon": ("Arma Cruel", "+2d6 de dano no Acerto Crítico."),
    "vorpal-sword": ("Espada Vorpal", "+3 no acerto e no dano; no 20 decapita.", {"b": arma(3)}),
    "wand-of-binding": ("Varinha da Imobilização", "Imobilizar Pessoa e Imobilizar Monstro."),
    "wand-of-enemy-detection": ("Varinha de Detectar Inimigos", "Aponta inimigos a até 18 m."),
    "wand-of-fear": ("Varinha do Medo", "Comando (fugir) e cone de Medo."),
    "wand-of-fireballs": ("Varinha de Bolas de Fogo", "Conjura Bola de Fogo (CD 15)."),
    "wand-of-lightning-bolts": ("Varinha de Relâmpagos", "Conjura Relâmpago (CD 15)."),
    "wand-of-magic-detection": ("Varinha de Detectar Magia", "Conjura Detectar Magia."),
    "wand-of-magic-missiles": ("Varinha de Mísseis Mágicos", "Conjura Mísseis Mágicos (7 cargas)."),
    "wand-of-paralysis": ("Varinha da Paralisia", "Raio que deixa Paralisado (CD 15)."),
    "wand-of-polymorph": ("Varinha da Metamorfose", "Conjura Metamorfose (CD 15)."),
    "wand-of-secrets": ("Varinha dos Segredos", "Aponta portas secretas e armadilhas."),
    "wand-of-the-war-mage-1": ("Varinha do Mago de Guerra +1", "+1 nas jogadas de ataque mágico.", {"b": [magia("spell_attack", 1)]}),
    "wand-of-the-war-mage-2": ("Varinha do Mago de Guerra +2", "+2 nas jogadas de ataque mágico.", {"b": [magia("spell_attack", 2)]}),
    "wand-of-the-war-mage-3": ("Varinha do Mago de Guerra +3", "+3 nas jogadas de ataque mágico.", {"b": [magia("spell_attack", 3)]}),
    "wand-of-web": ("Varinha da Teia", "Conjura Teia (CD 13)."),
    "wand-of-wonder": ("Varinha das Maravilhas", "Efeitos mágicos aleatórios."),
    "weapon-1": ("Arma +1", "+1 no acerto e no dano. Informe o dado de dano da arma base.", {"b": arma(1)}),
    "weapon-2": ("Arma +2", "+2 no acerto e no dano. Informe o dado de dano da arma base.", {"b": arma(2)}),
    "weapon-3": ("Arma +3", "+3 no acerto e no dano. Informe o dado de dano da arma base.", {"b": arma(3)}),
    "weapon-of-warning": ("Arma de Alerta", "Você e aliados a 9 m têm Vantagem na Iniciativa e não são surpreendidos dormindo."),
    "well-of-many-worlds": ("Poço dos Muitos Mundos", "Pano que abre um portal para outro mundo."),
    "wind-fan": ("Leque do Vento", "Conjura Lufada de Vento."),
    "winged-boots": ("Botas Aladas", "Deslocamento de voo igual ao normal por até 4 horas."),
    "wings-of-flying": ("Asas Voadoras", "Asas com voo de 18 m por 1 hora."),
}

# Raridade variável num texto só: uma entrada por versão
EXPANDIDOS = {
    "potions-of-healing": [
        ("potion-of-healing", "Poção de Cura", "Potion of Healing", "Common", "Recupera 2d4 + 2 PV.", {}),
        ("potion-of-greater-healing", "Poção de Cura Maior", "Potion of Greater Healing", "Uncommon", "Recupera 4d4 + 4 PV.", {}),
        ("potion-of-superior-healing", "Poção de Cura Superior", "Potion of Superior Healing", "Rare", "Recupera 8d4 + 8 PV.", {}),
        ("potion-of-supreme-healing", "Poção de Cura Suprema", "Potion of Supreme Healing", "Very Rare", "Recupera 10d4 + 20 PV.", {}),
    ],
    "spell-scroll": [
        ("spell-scroll-1", "Pergaminho de Magia (Truque ou 1º)", "Spell Scroll (Level 1)", "Common", "CD 13, ataque +5.", {}),
        ("spell-scroll-3", "Pergaminho de Magia (2º ou 3º)", "Spell Scroll (Level 3)", "Uncommon", "CD 15, ataque +7.", {}),
        ("spell-scroll-5", "Pergaminho de Magia (4º ou 5º)", "Spell Scroll (Level 5)", "Rare", "CD 17, ataque +9.", {}),
        ("spell-scroll-7", "Pergaminho de Magia (6º a 8º)", "Spell Scroll (Level 7)", "Very Rare", "CD 18, ataque +10.", {}),
        ("spell-scroll-9", "Pergaminho de Magia (9º)", "Spell Scroll (Level 9)", "Legendary", "CD 19, ataque +11.", {}),
    ],
    "belt-of-giant-strength": [
        ("belt-of-hill-giant-strength", "Cinturão da Força do Gigante da Colina", "Belt of Hill Giant Strength", "Rare", "Sua Força é 21 enquanto o usa.", {"b": [fixa("str", 21)]}),
        ("belt-of-frost-giant-strength", "Cinturão da Força do Gigante do Gelo / da Pedra", "Belt of Frost (Stone) Giant Strength", "Very Rare", "Sua Força é 23 enquanto o usa.", {"b": [fixa("str", 23)]}),
        ("belt-of-fire-giant-strength", "Cinturão da Força do Gigante do Fogo", "Belt of Fire Giant Strength", "Very Rare", "Sua Força é 25 enquanto o usa.", {"b": [fixa("str", 25)]}),
        ("belt-of-cloud-giant-strength", "Cinturão da Força do Gigante das Nuvens", "Belt of Cloud Giant Strength", "Legendary", "Sua Força é 27 enquanto o usa.", {"b": [fixa("str", 27)]}),
        ("belt-of-storm-giant-strength", "Cinturão da Força do Gigante da Tempestade", "Belt of Storm Giant Strength", "Legendary", "Sua Força é 29 enquanto o usa.", {"b": [fixa("str", 29)]}),
    ],
    "potion-of-giant-strength": [
        ("potion-of-hill-giant-strength", "Poção da Força do Gigante da Colina", "Potion of Hill Giant Strength", "Uncommon", "Força 21 por 1 hora. Marque Em uso ao beber.", {"b": [fixa("str", 21)]}),
        ("potion-of-frost-giant-strength", "Poção da Força do Gigante do Gelo / da Pedra", "Potion of Frost (Stone) Giant Strength", "Rare", "Força 23 por 1 hora. Marque Em uso ao beber.", {"b": [fixa("str", 23)]}),
        ("potion-of-fire-giant-strength", "Poção da Força do Gigante do Fogo", "Potion of Fire Giant Strength", "Rare", "Força 25 por 1 hora. Marque Em uso ao beber.", {"b": [fixa("str", 25)]}),
        ("potion-of-cloud-giant-strength", "Poção da Força do Gigante das Nuvens", "Potion of Cloud Giant Strength", "Very Rare", "Força 27 por 1 hora. Marque Em uso ao beber.", {"b": [fixa("str", 27)]}),
        ("potion-of-storm-giant-strength", "Poção da Força do Gigante da Tempestade", "Potion of Storm Giant Strength", "Legendary", "Força 29 por 1 hora. Marque Em uso ao beber.", {"b": [fixa("str", 29)]}),
    ],
    "ioun-stone": [
        ("ioun-stone-absorption", "Pedra Ioun da Absorção", "Ioun Stone (Absorption)", "Very Rare", "Reação: anula magia de até 4º círculo (20 círculos no total).", {}),
        ("ioun-stone-agility", "Pedra Ioun da Agilidade", "Ioun Stone (Agility)", "Very Rare", "+2 em Destreza (máximo 20).", {"b": [atributo("dex", 2, 20)]}),
        ("ioun-stone-awareness", "Pedra Ioun da Percepção", "Ioun Stone (Awareness)", "Rare", "Vantagem na Iniciativa e em Percepção (Sabedoria).", {}),
        ("ioun-stone-fortitude", "Pedra Ioun da Fortitude", "Ioun Stone (Fortitude)", "Very Rare", "+2 em Constituição (máximo 20).", {"b": [atributo("con", 2, 20)]}),
        ("ioun-stone-greater-absorption", "Pedra Ioun da Absorção Maior", "Ioun Stone (Greater Absorption)", "Legendary", "Reação: anula magia de até 8º círculo (20 círculos no total).", {}),
        ("ioun-stone-insight", "Pedra Ioun da Intuição", "Ioun Stone (Insight)", "Very Rare", "+2 em Sabedoria (máximo 20).", {"b": [atributo("wis", 2, 20)]}),
        ("ioun-stone-intellect", "Pedra Ioun do Intelecto", "Ioun Stone (Intellect)", "Very Rare", "+2 em Inteligência (máximo 20).", {"b": [atributo("int", 2, 20)]}),
        ("ioun-stone-leadership", "Pedra Ioun da Liderança", "Ioun Stone (Leadership)", "Very Rare", "+2 em Carisma (máximo 20).", {"b": [atributo("cha", 2, 20)]}),
        ("ioun-stone-mastery", "Pedra Ioun da Maestria", "Ioun Stone (Mastery)", "Legendary", "+1 no Bônus de Proficiência (ajuste à mão na ficha).", {}),
        ("ioun-stone-protection", "Pedra Ioun da Proteção", "Ioun Stone (Protection)", "Rare", "+1 na CA.", {"ca": 1}),
        ("ioun-stone-regeneration", "Pedra Ioun da Regeneração", "Ioun Stone (Regeneration)", "Legendary", "Recupera 15 PV a cada hora.", {}),
        ("ioun-stone-reserve", "Pedra Ioun da Reserva", "Ioun Stone (Reserve)", "Rare", "Guarda até 4 círculos de magias.", {}),
        ("ioun-stone-strength", "Pedra Ioun da Força", "Ioun Stone (Strength)", "Very Rare", "+2 em Força (máximo 20).", {"b": [atributo("str", 2, 20)]}),
        ("ioun-stone-sustenance", "Pedra Ioun do Sustento", "Ioun Stone (Sustenance)", "Rare", "Não precisa comer nem beber.", {}),
    ],
}
# Raridade variável sem tabela que mude a ficha: uma entrada só
VARIA = {"feather-token", "figurine-of-wondrous-power"}

RAR_DA_VARIANTE = {"Uncommon (+1)": "Uncommon", "Rare (+2)": "Rare", "Very Rare (+3)": "Very Rare"}

# Onde o item é vestido. O livro (Usando Itens Mágicos) só deixa um de cada:
# um par de botas, de luvas, de braçadeiras, uma armadura, um item na cabeça e
# um manto. Pedras Ioun: até três orbitando.
SLOTS = [
    (r"\bRing\b", "anel"),
    (r"Boots|Slippers|Horseshoes", "pes"),
    (r"Gauntlets|Gloves", "maos"),
    (r"Bracers", "bracos"),
    (r"Belt", "cintura"),
    (r"Helm|Headband|Hat of|Circlet", "cabeca"),
    (r"Cloak|Cape|Mantle|Wings of", "manto"),
    (r"Robe", "corpo"),
    (r"Amulet|Necklace|Periapt|Medallion|Brooch|Scarab", "pescoco"),
    (r"Eyes of|Goggles", "olhos"),
    (r"Ioun", "ioun"),
]


def slot_de(nome_en, cat):
    if cat == "Armor":
        return "escudo" if re.search(r"Shield", nome_en) else "armadura"
    for rx, s in SLOTS:
        if re.search(rx, nome_en):
            return s
    return ""


def tipo_de(nome_en, cat):
    if cat == "Weapons":
        return "weapon"
    if cat == "Armor":
        return "shield" if re.search(r"Shield", nome_en) else "armor"
    if cat == "Rings" or re.search(r"Amulet|Necklace|Periapt|Medallion|Talisman", nome_en):
        return "ring"
    if cat == "Potions":
        return "potion"
    if re.search(r"Scroll", nome_en):
        return "scroll"
    return "wondrous"


# O SRD tira os nomes próprios (Kwalish, Heward...); o AideDD ainda os usa
AIDEDD_NOME = {
    "apparatus-of-the-crab": "apparatus-of-kwalish",
    "dragon-orb": "orb-of-dragonkind",
    "efficient-quiver": "quiver-of-ehlonna",
    "feather-token": "quaal-s-feather-token",
    "handy-haversack": "heward-s-handy-haversack",
    "instant-fortress": "daern-s-instant-fortress",
    "iron-bands": "iron-bands-of-bilarro",
    "marvelous-pigments": "nolzur-s-marvelous-pigments",
    "mysterious-deck": "deck-of-many-things",
}


def aidedd(idx):
    """Endereço do item no AideDD: os +1/+2/+3 ficam numa página só"""
    if idx in AIDEDD_NOME:
        return AIDEDD_NOME[idx]
    idx = re.sub(r"[()]", "", idx)
    m = re.match(r"(.+)-[123]$", idx)
    if m and m.group(1) in ("ammunition", "armor", "shield", "weapon", "wand-of-the-war-mage"):
        return m.group(1) + "-1-2-or-3"
    if idx.startswith("horn-of-valhalla"):
        return "horn-of-valhalla"
    return idx


def entrada(idx, n, en, rar, cat, sint, slug, resumo, extra):
    e = {"id": idx, "n": n, "en": en, "rar": rar, "tipo": extra.get("tipo") or tipo_de(en, cat),
         "sint": bool(sint), "slug": slug}
    slot = slot_de(en, cat)
    if slot:
        e["slot"] = slot
    for k in ("ca", "b", "dano", "dt", "cond"):
        if extra.get(k):
            e[k] = extra[k]
    if resumo:
        e["d"] = resumo
    return e


def main():
    if len(sys.argv) > 1:
        dados = json.load(open(sys.argv[1], encoding="utf-8"))
    else:
        with urllib.request.urlopen(URL) as r:
            dados = json.load(r)

    itens = []
    for x in dados:
        idx, cat, en = x["index"], x["equipment_category"]["name"], x["name"]
        rar = x["rarity"]["name"]
        if x.get("variants"):
            continue                                  # entra pelas variantes
        if idx in EXPANDIDOS:
            for (vid, n, ven, vrar, resumo, extra) in EXPANDIDOS[idx]:
                itens.append(entrada(vid, n, ven, vrar, cat, x.get("attunement"), aidedd(idx), resumo, extra))
            continue
        rar = RAR_DA_VARIANTE.get(rar, rar)
        if idx in VARIA:
            rar = "Varies"
        if rar not in RARIDADES:
            print("raridade desconhecida:", idx, rar)
            continue
        pt = PT.get(idx)
        if not pt:
            print("sem nome em português:", idx)
            pt = (en, "")
        n, resumo = pt[0], pt[1]
        extra = pt[2] if len(pt) > 2 else {}
        itens.append(entrada(idx, n, en, rar, cat, x.get("attunement"), aidedd(idx), resumo, extra))

    itens.sort(key=lambda i: i["n"])
    corpo = ",\n".join(json.dumps(i, ensure_ascii=False, separators=(",", ":")) for i in itens)
    with open(SAIDA, "w", encoding="utf-8") as f:
        f.write("/*\n"
                " * Catálogo de itens mágicos do SRD 5.2 (D&D 2024) para o Passo 5.\n"
                " * Gerado por tools/gerar-itens-magicos.py — não editar à mão.\n"
                " *\n"
                " * This work includes material from the System Reference Document 5.2 (\"SRD 5.2\") by\n"
                " * Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is\n"
                " * licensed under the Creative Commons Attribution 4.0 International License,\n"
                " * available at https://creativecommons.org/licenses/by/4.0/legalcode.\n"
                " * Estrutura dos dados: 5e-bits/5e-database (MIT).\n"
                " *\n"
                " * n: nome em português · en: nome original · rar: raridade · tipo: tipo do item no criador\n"
                " * sint: exige Sintonização · slug: página no AideDD · slot: onde é vestido\n"
                " * ca: bônus na CA · b: bônus da ficha (mesmo formato do formulário) · d: resumo\n"
                " * cond: \"sem_armadura_escudo\" = a CA só vale sem armadura e sem escudo\n"
                " */\n"
                f"window.ITENS_MAGICOS = [\n{corpo}\n];\n")
    print(f"{len(itens)} itens -> {os.path.normpath(SAIDA)}")


if __name__ == "__main__":
    main()
