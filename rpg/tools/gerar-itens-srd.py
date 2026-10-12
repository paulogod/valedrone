"""
Gera rpg/srd-itens.js: os itens mágicos do SRD 5.2 (D&D 2024) para o tesouro
sugerido nos Encontros.

Fonte: 5e-bits/5e-database (MIT), src/2024/en/5e-SRD-Magic-Items.json, que
estrutura o SRD 5.2 da Wizards of the Coast (CC-BY-4.0).

- Itens com raridade variável viram uma entrada por raridade (Poções de Cura,
  Pergaminho de Magia); os +1/+2/+3 já vêm separados nas variantes.
- Itens amaldiçoados ficam de fora: o tesouro sugerido não arma armadilhas.
- "temas" agrupa cada item pelos temas de tesouro do Manual dos Monstros 2024
  (Arcana, Armaments, Implements, Relics), para o tesouro combinar com quem o
  guardava.

Uso:  python3 tools/gerar-itens-srd.py [caminho/5e-SRD-Magic-Items.json]
"""
import json
import os
import re
import sys
import urllib.request

URL = "https://raw.githubusercontent.com/5e-bits/5e-database/main/src/2024/en/5e-SRD-Magic-Items.json"
SAIDA = os.path.join(os.path.dirname(__file__), "..", "srd-itens.js")
RARIDADES = ["Common", "Uncommon", "Rare", "Very Rare", "Legendary"]

# Raridade variável que o SRD define por versão do item
EXPANDIDOS = {
    "potions-of-healing": [("Potion of Healing", "Common"), ("Potion of Greater Healing", "Uncommon"),
                           ("Potion of Superior Healing", "Rare"), ("Potion of Supreme Healing", "Very Rare")],
    "spell-scroll": [("Spell Scroll (Cantrip or Level 1)", "Common"), ("Spell Scroll (Level 2 or 3)", "Uncommon"),
                     ("Spell Scroll (Level 4 or 5)", "Rare"), ("Spell Scroll (Level 6, 7, or 8)", "Very Rare"),
                     ("Spell Scroll (Level 9)", "Legendary")],
}
FORA = {"potion-of-poison"}   # parece poção de cura, mas é armadilha

RE_ARCANA = re.compile(r"Tome|Manual|Crystal Ball|Pearl of Power|Robe|Ioun|Rod|Orb|Scroll|Cape of the Mountebank|Hat of", re.I)
RE_RELICS = re.compile(r"Amulet|Talisman|Necklace|Periapt|Medallion|Brooch|Scarab|Crown|Circlet|Censer|Bowl|Brazier|"
                       r"Stone of|Horn|Sphere|Mirror|Candle|Holy|Rope of|Ring", re.I)


def temas(nome, cat):
    if cat in ("Weapons", "Armor") or re.search(r"Ammunition|Shield|Arrow|Bolt", nome):
        return ["Armaments"]
    if cat in ("Wands", "Staffs") or RE_ARCANA.search(nome):
        return ["Arcana"]
    if cat == "Rings" or RE_RELICS.search(nome):
        return ["Relics"]
    return ["Implements"]


def main():
    if len(sys.argv) > 1:
        dados = json.load(open(sys.argv[1], encoding="utf-8"))
    else:
        with urllib.request.urlopen(URL) as r:
            dados = json.load(r)

    pai_de = {}
    for x in dados:
        for v in x.get("variants", []):
            pai_de[v["index"]] = x

    itens = []
    for x in dados:
        idx, cat = x["index"], x["equipment_category"]["name"]
        if idx in FORA or re.search(r"\bCurse\.", x.get("desc", "")):
            continue
        if idx in EXPANDIDOS:
            for i, (nome, rar) in enumerate(EXPANDIDOS[idx]):
                itens.append({"id": f"{idx}-{i}", "n": nome, "rar": rar, "cat": cat, "slug": idx,
                              "sint": False, "temas": temas(nome, cat)})
            continue
        rar = x["rarity"]["name"]
        if " or " in rar or "," in rar:
            continue                     # pai de variantes: "Uncommon (+1), Rare (+2), or ..."
        rar = re.sub(r"\s*\([^)]*\)$", "", rar)
        if rar not in RARIDADES:
            continue                     # pai de variantes ("Rare (+1), ...") ou "Rarity Varies"
        pai = pai_de.get(idx)
        if pai and re.search(r"\+1\), .*\+2\)", pai["rarity"]["name"]):
            slug = pai["index"] + "-1-2-or-3"
        else:
            slug = pai["index"] if pai else idx
        itens.append({"id": idx, "n": x["name"], "rar": rar, "cat": cat, "slug": slug,
                      "sint": bool(x.get("attunement")), "temas": temas(x["name"], cat)})

    itens.sort(key=lambda i: (RARIDADES.index(i["rar"]), i["n"]))
    corpo = ",\n".join(json.dumps(i, ensure_ascii=False, separators=(",", ":")) for i in itens)
    with open(SAIDA, "w", encoding="utf-8") as f:
        f.write("/*\n"
                " * Itens mágicos do SRD 5.2 (D&D 2024). Gerado por tools/gerar-itens-srd.py — não editar à mão.\n"
                " *\n"
                " * This work includes material from the System Reference Document 5.2 (\"SRD 5.2\") by\n"
                " * Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is\n"
                " * licensed under the Creative Commons Attribution 4.0 International License,\n"
                " * available at https://creativecommons.org/licenses/by/4.0/legalcode.\n"
                " * Estrutura dos dados: 5e-bits/5e-database (MIT).\n"
                " */\n"
                f"window.SRD_ITENS = [\n{corpo}\n];\n")
    por = {r: sum(1 for i in itens if i["rar"] == r) for r in RARIDADES}
    print(f"{len(itens)} itens -> {os.path.normpath(SAIDA)} {por}")


if __name__ == "__main__":
    main()
