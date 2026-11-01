"""
Gera rpg/mm24-monstros.js: os monstros do Manual dos Monstros 2024 que não
estão no SRD 5.2, em versão resumida para o combate.

Fonte: as páginas do AideDD (aidedd.org/monster/<nome>) e a lista
aidedd.org/monster/, que trazem o bloco de cada monstro.

O texto do Manual dos Monstros não é de licença livre como o SRD, então o
resumo guarda só os números do bloco: CA, PV, Deslocamento, atributos,
salvaguardas, perícias, resistências, imunidades, sentidos, ND e Iniciativa.
Também guarda o nome de cada traço e de cada ação e, das ações, a parte
mecânica: bônus de ataque, alcance, dano, CD da salvaguarda, área, Recarga,
quantos ataques o Multiataque faz e as magias da Conjuração. Os efeitos
descritos em texto ficam no link 🔗 AideDD.

Uso:  python3 tools/gerar-monstros-mm24.py <lista.html> <pasta-com-as-paginas>
A lista é aidedd.org/monster/ salva em arquivo. A pasta tem uma página
<slug>.html por monstro. Ficam de fora os monstros que já estão em srd-monstros.js.
"""
import html
import json
import os
import re
import sys

PASTA = os.path.dirname(__file__)
SAIDA = os.path.join(PASTA, "..", "mm24-monstros.js")
SRD = os.path.join(PASTA, "..", "srd-monstros.js")

PES_EM_METROS = {5: "1,5", 10: "3", 15: "4,5", 20: "6", 25: "7,5", 30: "9", 35: "10,5", 40: "12", 45: "13,5",
                 50: "15", 60: "18", 70: "21", 80: "24", 90: "27", 100: "30", 120: "36", 150: "45"}
TIPOS_DE_DANO = {"acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing",
                 "poison", "psychic", "radiant", "slashing", "thunder"}
SENTIDOS = {"darkvision": "Visão no Escuro", "blindsight": "Percepção às Cegas",
            "truesight": "Visão Verdadeira", "tremorsense": "Sentido Sísmico"}
ATRIB = {"Str": "STR", "Dex": "DEX", "Con": "CON", "Int": "INT", "Wis": "WIS", "Cha": "CHA"}


def texto(h):
    """HTML -> texto corrido"""
    t = re.sub(r"<br\s*/?>", "\n", h)
    t = re.sub(r"<[^>]+>", "", t)
    return re.sub(r"[\xa0\u2009\u202f]", " ", html.unescape(t)).strip()


def metros(pes):
    pes = int(pes)
    return (PES_EM_METROS.get(pes) or str(round(pes * 0.3, 1)).replace(".", ",")) + " m"


def deslocamento(txt):
    """'30 ft., Fly 15 ft. (hover)' -> '9 m, Voo 4,5 m (pairar)'"""
    rot = {"fly": "Voo ", "swim": "Natação ", "climb": "Escalada ", "burrow": "Escavação "}
    partes = []
    for p in txt.split(","):
        m = re.match(r"\s*([A-Za-z]+)?\s*(\d+) ft\.(.*)", p)
        if not m:
            continue
        tipo = (m.group(1) or "").lower()
        partes.append(rot.get(tipo, "") + metros(m.group(2)) + (" (pairar)" if "hover" in m.group(3) else ""))
    return ", ".join(partes)


def sentidos(txt):
    partes = []
    for p in txt.split(","):
        p = p.strip()
        m = re.match(r"(\w+) (\d+) ft\.", p)
        if m and m.group(1).lower() in SENTIDOS:
            partes.append(f"{SENTIDOS[m.group(1).lower()]} {metros(m.group(2))}")
        m = re.match(r"Passive Perception (\d+)", p)
        if m:
            partes.append(f"Percepção Passiva {m.group(1)}")
    return ", ".join(partes)


def uso_no_nome(nome):
    """'Mind Blast (Recharge 5–6)' -> 'Mind Blast (Recarga 5–6)', como em srd-monstros.js"""
    nome = re.sub(r"\(Recharge (\d)[–-]6\)", r"(Recarga \1–6)", nome)
    nome = nome.replace("(Recharge 6)", "(Recarga 6)")
    nome = re.sub(r"(\d+)/Day, or (\d+)/Day in Lair", r"\1/Dia, \2/Dia no covil", nome)
    nome = re.sub(r"(\d+)/Day", r"\1/Dia", nome)
    nome = nome.replace("Recharges after a Short or Long Rest", "Recarrega após Descanso Curto ou Longo")
    return nome


DANO = r"\d+ \(\d+d\d+(?: [+−-] \d+)?\) [A-Z][a-z]+ damage"


def mecanica(desc):
    """Só a parte mecânica de uma ação: ataque, alcance, dano, CD e área"""
    d = desc.replace("−", "-")
    partes = []
    atk = re.search(r"((?:Melee|Ranged|Melee or Ranged) Attack Roll: [+-]\d+.*?)\s*(?=Hit:|$)", d)
    if atk:
        partes.append(atk.group(1))
        hit = re.search(r"Hit: ((?:%s)(?:,? (?:plus|and) %s)*)" % (DANO, DANO), d)
        if hit:
            partes.append(f"Hit: {hit.group(1)}.")
        elif re.search(r"Hit: (\d+) [A-Z][a-z]+ damage", d):
            partes.append(re.search(r"Hit: (\d+ [A-Z][a-z]+ damage)", d).group(0) + ".")
    salva = re.search(r"((?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) Saving Throw: DC \d+)", d)
    if salva:
        area = re.search(r"(\d+-foot(?:-radius|-tall|-long|-wide)? (?:Cone|Line|Cube|Sphere|Emanation|Cylinder)[^.:]*?)(?:\.|$| originating)", d)
        alvo = re.search(r"Saving Throw: DC \d+, ([^.]*?)(?:\. |$)", d)
        quem = area.group(1) if area else (alvo.group(1) if alvo and len(alvo.group(1)) <= 60 else "")
        partes.append(salva.group(1) + (f", {quem}" if quem else "") + ".")
        falha = re.search(r"Failure: ((?:%s)(?:,? (?:plus|and) %s)*)" % (DANO, DANO), d)
        if falha:
            partes.append(f"Failure: {falha.group(1)}.")
        if re.search(r"Success: Half damage", d):
            partes.append("Success: Half damage.")
    return " ".join(partes)


def multiataque(desc):
    """'The X makes two Claw attacks and uses Y.' fica como está: é a rotina do turno"""
    frase = desc.split(". ")[0].rstrip(".")
    return frase + "." if re.search(r"\bmakes\b|\buses\b", frase) else ""


def conjuracao(p_html, depois):
    """Conjuração: CD, ataque e a lista das magias (nomes)"""
    d = texto(p_html)
    cd = re.search(r"spell save DC (\d+)", d)
    atk = re.search(r"([+-]\d+) to hit with spell attacks", d)
    cab = ", ".join(x for x in [f"spell save DC {cd.group(1)}" if cd else "",
                                f"{atk.group(1)} to hit with spell attacks" if atk else ""] if x)
    linhas = [l.strip() for l in texto(depois).split("\n") if ":" in l]
    return "; ".join(x for x in [cab] + linhas if x)


def secoes(corpo):
    """{'Traits': [(nome, desc_html, html_após_o_p)], 'Actions': [...], ...}"""
    out = {}
    pedacos = re.split(r"<h2 class='rub'>([^<]+)</h2>", corpo)
    for i in range(1, len(pedacos), 2):
        titulo, conteudo = pedacos[i].strip().title(), pedacos[i + 1]
        itens = []
        intro = re.match(r"\s*([^<]*?)(?=<p>|$)", conteudo)
        for m in re.finditer(r"<p><strong><em>(.*?)</em></strong>\.?(.*?)</p>(.*?)(?=<p>|$)", conteudo, re.S):
            itens.append((texto(m.group(1)), m.group(2), m.group(3)))
        if not itens:
            # Alguns blocos o AideDD mostra só com os nomes: "Bite.<br>Eye Rays.<br>"
            sem_lead = re.sub(r"<div class='legend'>.*?</div>", "", conteudo, flags=re.S)
            itens = [(n.strip().rstrip("."), "", "") for n in texto(sem_lead).split("\n") if n.strip()]
        lead = re.search(r"Legendary Action Uses: [^.]*\.", texto(conteudo))
        out[titulo] = (itens, lead.group(0) if lead else "")
    return out


def lista_de_acoes(itens, so_nome=False):
    res = []
    for nome, desc_html, depois in itens:
        desc = texto(desc_html).lstrip(". ")
        if so_nome:
            res.append([uso_no_nome(nome), ""])
        elif nome.startswith("Multiattack"):
            res.append([nome, multiataque(desc)])
        elif nome.startswith("Spellcasting"):
            res.append([uso_no_nome(nome), conjuracao(desc_html, depois)])
        else:
            res.append([uso_no_nome(nome), mecanica(desc)])
    return res


def ler_pagina(slug, h, linha_da_lista):
    corpo = h[h.find("<div class='jaune'>"):h.find("<div class='description'>") if "<div class='description'>" in h else h.find("<div class='habitat'>")]
    nome = texto(re.search(r"<h1>(.*?)</h1>", corpo).group(1))
    tipo_txt = texto(re.search(r"<div class='type'>(.*?)</div>", corpo).group(1))
    # "Medium or Small Humanoid (Wizard), Neutral" / "Large Swarm of Tiny Fiends, Chaotic Evil"
    m = re.match(r"(Tiny|Small|Medium|Large|Huge|Gargantuan)(?: or (Tiny|Small|Medium|Large|Huge|Gargantuan))? (.+?), ([^,]+)$", tipo_txt)
    tam = m.group(1) + (f" or {m.group(2).lower()}" if m.group(2) else "")
    tipo = re.sub(r"\s*\(.*\)", "", m.group(3)).lower()
    al = m.group(4).lower()

    bloco = texto(corpo)
    def campo(rot):
        r = re.search(rf"(?:^|\n){rot} (.+)", bloco)
        return r.group(1).strip() if r else ""

    ca = int(re.search(r"AC (\d+)", bloco).group(1))
    pv = re.search(r"HP (\d+)(?: \(([^)]+)\))?", bloco)
    ini = re.search(r"Initiative ([+-−]?\d+)", bloco)
    cr = re.search(r"CR ([\d/]+) \(XP ([\d  ,]+)(?:, or ([\d  ,]+) in lair)?; PB ?\+(\d+)\)", bloco, re.I)
    nd_txt = cr.group(1)
    nd = {"1/8": 0.125, "1/4": 0.25, "1/2": 0.5}.get(nd_txt) or int(nd_txt)
    num = lambda s: int(re.sub(r"\D", "", s)) if s else None

    atrib = re.findall(r"<div class='car[14]'>(\w+)</div><div class='car[25]'>(\d+)</div><div class='car[36]'>([^<]+)</div><div class='car[36]'>([^<]+)</div>", corpo)
    at = [int(v) for _, v, _, _ in atrib]
    salv = ", ".join(f"{ATRIB[a]} {s.replace('−', '-')}" for a, _, mod, s in atrib if mod != s)

    imu_dano, imu_cond = [], []
    for parte in re.split(r"[;,]", campo("Immunities")):
        p = parte.strip()
        if not p:
            continue
        (imu_dano if p.lower() in TIPOS_DE_DANO else imu_cond).append(p)

    sec = secoes(corpo)
    hab = re.search(r"<strong>Habitat</strong>: ([^<]+)", h)
    tes = re.search(r"<strong>Treasure</strong>: ([^<]+)", h)

    mon = {
        "id": slug, "n": nome, "tam": tam, "tipo": tipo, "al": al, "ca": ca,
        "pv": int(pv.group(1)), "dv": (pv.group(2) or "").replace("−", "-"),
        "desl": deslocamento(campo("Speed")), "at": at, "nd": nd,
        "xp": num(cr.group(2)) or 0, "bp": int(cr.group(4)),
        "sent": sentidos(campo("Senses")), "idi": campo("Languages"),
    }
    opcionais = {
        "xpc": num(cr.group(3)),
        "salv": salv,
        "per": campo("Skills"),
        "vul": campo("Vulnerabilities").lower(),
        "res": campo("Resistances").lower(),
        "imu": ", ".join(imu_dano).lower(),
        "imuc": ", ".join(imu_cond),
        "equip": campo("Gear"),
        "tr": lista_de_acoes(sec.get("Traits", ([], ""))[0], so_nome=True),
        "ac": lista_de_acoes(sec.get("Actions", ([], ""))[0]),
        "ab": lista_de_acoes(sec.get("Bonus Actions", ([], ""))[0]),
        "re": lista_de_acoes(sec.get("Reactions", ([], ""))[0]),
        "le": lista_de_acoes(sec.get("Legendary Actions", ([], ""))[0]),
        "leu": sec.get("Legendary Actions", ([], ""))[1],
    }
    mon.update({k: v for k, v in opcionais.items() if v})
    if ini:
        mon["ini"] = int(ini.group(1).replace("−", "-"))
    if hab:
        mon["hab"] = [x.strip() for x in re.sub(r"\([^)]*\)", "", hab.group(1)).split(",") if x.strip()]
    if tes:
        mon["tes"] = [x.strip() for x in tes.group(1).split(",") if x.strip()]
    return mon


def main():
    lista_html = open(sys.argv[1], encoding="utf-8").read()
    pasta = sys.argv[2]
    srd = open(SRD, encoding="utf-8").read()
    no_srd = set(re.findall(r'"id":"([^"]+)"', srd)) | set(re.findall(r'"slug":"([^"]+)"', srd))
    slugs = sorted(set(re.findall(r"href='/monster/([a-z0-9-]+)'", lista_html)) - no_srd)
    monstros, falhas = [], []
    for s in slugs:
        arq = os.path.join(pasta, s + ".html")
        if not os.path.exists(arq):
            falhas.append(s + " (sem página)")
            continue
        try:
            monstros.append(ler_pagina(s, open(arq, encoding="utf-8").read(), None))
        except Exception as e:  # noqa: BLE001 — avisa e segue com os outros
            falhas.append(f"{s} ({e})")
    monstros.sort(key=lambda m: m["n"])
    corpo = ",\n".join(json.dumps(m, ensure_ascii=False, separators=(",", ":")) for m in monstros)
    with open(SAIDA, "w", encoding="utf-8") as f:
        f.write("/*\n"
                " * Monstros do Manual dos Monstros 2024 que não estão no SRD 5.2, em resumo para o combate.\n"
                " * Gerado por tools/gerar-monstros-mm24.py a partir do AideDD — não editar à mão.\n"
                " * Só os números do bloco e a parte mecânica das ações; o texto completo fica no AideDD.\n"
                " */\n"
                f"window.MM24_MONSTROS = [\n{corpo}\n];\n")
    print(f"{len(monstros)} monstros -> {os.path.normpath(SAIDA)}")
    for x in falhas:
        print("  falhou:", x)


if __name__ == "__main__":
    main()
