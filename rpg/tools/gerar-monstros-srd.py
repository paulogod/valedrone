"""
Gera rpg/srd-monstros.js a partir dos monstros do SRD 5.2 (D&D 2024).

Fonte dos dados: 5e-bits/5e-database (MIT), src/2024/en/5e-SRD-Monsters.json,
que estrutura o SRD 5.2 da Wizards of the Coast (CC-BY-4.0).

Complementos em tools/srd52-extras.json, que o JSON da 5e-bits não traz:
- "iniciativa": o bônus de Iniciativa de cada monstro, lido do PDF oficial do
  SRD 5.2.1 (linha "AC 19 Initiative +12 (22)" do bloco de estatísticas);
- "habitat" e "tesouro": o Habitat e o tema de Tesouro do Manual dos Monstros
  2024, como o AideDD mostra na página de cada monstro (aidedd.org/monster/<nome>).

Uso:  python3 tools/gerar-monstros-srd.py [caminho/5e-SRD-Monsters.json]
Sem argumento, baixa o arquivo do GitHub.
"""
import json
import os
import re
import sys
import urllib.request

URL = "https://raw.githubusercontent.com/5e-bits/5e-database/main/src/2024/en/5e-SRD-Monsters.json"
SAIDA = os.path.join(os.path.dirname(__file__), "..", "srd-monstros.js")
EXTRAS = os.path.join(os.path.dirname(__file__), "srd52-extras.json")

# Formas do Vampiro e dos licantropos: no AideDD é uma página só, a da criatura
FORMAS = ("vampire", "werebear", "wereboar", "wererat", "weretiger", "werewolf")
# Endereços do AideDD que não seguem o índice do SRD
SLUG_AIDEDD = {"will-o-wisp": "will-o--wisp"}

PES_EM_METROS = {5: "1,5", 10: "3", 15: "4,5", 20: "6", 25: "7,5", 30: "9", 35: "10,5", 40: "12", 45: "13,5",
                 50: "15", 60: "18", 70: "21", 80: "24", 90: "27", 100: "30", 120: "36", 150: "45"}


def metros(txt):
    """'30 ft.' -> '9 m'. O texto das ações continua em pés, como no SRD."""
    try:
        pes = int(str(txt).split()[0])
    except (ValueError, IndexError):
        return str(txt)
    return (PES_EM_METROS.get(pes) or str(round(pes * 0.3, 1)).replace(".", ",")) + " m"


def uso(a):
    u = a.get("usage")
    if not u:
        return ""
    if u["type"] == "recharge on roll":
        return f" (Recarga {u['min_value']}–6)" if u["min_value"] < 6 else " (Recarga 6)"
    if u["type"] == "per day":
        lair = f", {u['times_in_lair']}/Dia no covil" if u.get("times_in_lair") else ""
        return f" ({u['times']}/Dia{lair})"
    if u["type"] == "recharge after rest":
        return " (Recarrega após Descanso Curto ou Longo)"
    return ""


def lista(blocos):
    return [[a["name"] + uso(a), a.get("desc", "")] for a in (blocos or [])]


def habitats(txt):
    """'Forest, Hill, Planar (Acheron, Feywild)' -> ['Forest', 'Hill', 'Planar']"""
    sem_parenteses = re.sub(r"\([^)]*\)", "", txt or "")
    return [h.strip() for h in sem_parenteses.split(",") if h.strip()]


def converter(x, extras):
    desl = []
    for k, v in x["speed"].items():
        if k == "hover":
            continue
        rot = {"walk": "", "fly": "Voo ", "swim": "Natação ", "climb": "Escalada ", "burrow": "Escavação "}.get(k, k + " ")
        extra = " (pairar)" if k == "fly" and x["speed"].get("hover") else ""
        desl.append(rot + metros(v) + extra)

    sent = []
    for k, v in x["senses"].items():
        if k == "passive_perception":
            continue
        rot = {"darkvision": "Visão no Escuro", "blindsight": "Percepção às Cegas",
               "truesight": "Visão Verdadeira", "tremorsense": "Sentido Sísmico"}.get(k, k)
        sent.append(f"{rot} {metros(v)}")
    sent.append(f"Percepção Passiva {x['senses'].get('passive_perception', 10)}")

    salv, peric = [], []
    for p in x.get("proficiencies", []):
        nome = p["proficiency"]["name"]
        bonus = f"{'+' if p['value'] >= 0 else ''}{p['value']}"
        if nome.startswith("Saving Throw: "):
            salv.append(f"{nome[14:]} {bonus}")
        elif nome.startswith("Skill: "):
            peric.append(f"{nome[7:]} {bonus}")

    ca = x["armor_class"][0]
    m = {
        "id": x["index"],
        "n": x["name"],
        "tam": x["size"],
        "tipo": x["type"],
        "al": x["alignment"],
        "ca": ca["value"],
        "pv": x["hit_points"],
        "dv": x.get("hit_points_roll") or x.get("hit_dice", ""),
        "desl": ", ".join(desl),
        "at": [x["strength"], x["dexterity"], x["constitution"], x["intelligence"], x["wisdom"], x["charisma"]],
        "nd": x["challenge_rating"],
        "xp": x.get("xp", 0),
        "bp": x.get("proficiency_bonus", 2),
        "sent": ", ".join(sent),
        "idi": x.get("languages", ""),
    }
    opcionais = {
        "xpc": x.get("xp_in_lair"),
        "salv": ", ".join(salv),
        "per": ", ".join(peric),
        "vul": ", ".join(x.get("damage_vulnerabilities", [])),
        "res": ", ".join(x.get("damage_resistances", [])),
        "imu": ", ".join(x.get("damage_immunities", [])),
        "imuc": ", ".join(c["name"] for c in x.get("condition_immunities", [])),
        "equip": x.get("gear", ""),
        "tr": lista(x.get("special_abilities")),
        "ac": lista(x.get("actions")),
        "ab": lista(x.get("bonus_actions")),
        "re": lista(x.get("reactions")),
        "le": lista(x.get("legendary_actions")),
    }
    m.update({k: v for k, v in opcionais.items() if v})

    ini = extras.get("iniciativa", {}).get(x["index"])
    if ini is not None:
        m["ini"] = ini
    hab = habitats(extras.get("habitat", {}).get(x["index"]))
    if hab:
        m["hab"] = hab
    tes = habitats(extras.get("tesouro", {}).get(x["index"]))
    if tes:
        m["tes"] = tes
    base = x["index"].split("-")[0]
    if base in FORMAS and x["index"] != base:
        m["slug"] = base
    if x["index"] in SLUG_AIDEDD:
        m["slug"] = SLUG_AIDEDD[x["index"]]
    return m


def main():
    if len(sys.argv) > 1:
        dados = json.load(open(sys.argv[1], encoding="utf-8"))
    else:
        with urllib.request.urlopen(URL) as r:
            dados = json.load(r)
    extras = json.load(open(EXTRAS, encoding="utf-8")) if os.path.exists(EXTRAS) else {}
    monstros = [converter(x, extras) for x in dados]
    monstros.sort(key=lambda m: m["n"])
    corpo = ",\n".join(json.dumps(m, ensure_ascii=False, separators=(",", ":")) for m in monstros)
    with open(SAIDA, "w", encoding="utf-8") as f:
        f.write("/*\n"
                " * Monstros do SRD 5.2 (D&D 2024). Gerado por tools/gerar-monstros-srd.py — não editar à mão.\n"
                " *\n"
                " * This work includes material from the System Reference Document 5.2 (\"SRD 5.2\") by\n"
                " * Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is\n"
                " * licensed under the Creative Commons Attribution 4.0 International License,\n"
                " * available at https://creativecommons.org/licenses/by/4.0/legalcode.\n"
                " * Estrutura dos dados: 5e-bits/5e-database (MIT).\n"
                " */\n"
                f"window.SRD_MONSTROS = [\n{corpo}\n];\n")
    print(f"{len(monstros)} monstros -> {os.path.normpath(SAIDA)}")


if __name__ == "__main__":
    main()
