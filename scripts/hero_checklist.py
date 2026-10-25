"""Check every hero against the hero checklist (docs/hero-checklist.json).

  python scripts/hero_checklist.py          -> prints the grid, writes assets/heroes/hero-checklist-status.json

The hero studio (tools/hero-gallery.html, "Hạng mục tướng") shows that status file as a grid: a red
cell is an item the hero still lacks. To add a new item for every hero, add an entry to the
checklist and run this script; the process is described in docs/HERO_PIPELINE.md.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHECKLIST = ROOT / "docs/hero-checklist.json"
STATUS = ROOT / "assets/heroes/hero-checklist-status.json"


def forms_of(scope, count):
    return {"all": list(range(1, count + 1)), "1": [1], "2-3": [f for f in (2, 3) if f <= count], "3": [3] if count >= 3 else []}[scope]


def fill(text, key, form, hero):
    formdir = hero["form1dir"] if form == 1 else f"assets/heroes/forms/{key}/form-{form}"
    for name, value in {"key": key, "form": form, "formdir": formdir, "kit": hero["kit"], "name": hero["name"]}.items():
        text = text.replace("{" + name + "}", str(value))   # plain replace: regexes keep their own braces
    return text


def check(item, key, form, hero):
    """(done, detail) for one hero form."""
    if "fidgets" in item:
        book = ROOT / f"assets/heroes/forms/{key}/form-{form}/showcase/fidgets.json"
        if not book.exists():
            return False, str(book.relative_to(ROOT))
        names = [f["name"] for f in json.loads(book.read_text(encoding="utf-8"))["fidgets"] if f["name"] not in ("entrance", "rift", "emerge")]
        return len(names) >= item["fidgets"], ", ".join(names) or "none"
    if "grep" in item:
        pattern, regex = (fill(part, key, form, hero) for part in item["grep"])
        for path in ROOT.glob(pattern):
            if re.search(regex, path.read_text(encoding="utf-8", errors="ignore")):
                return True, pattern
        return False, f"{pattern} ~ {regex}"
    paths = item["paths"]
    if isinstance(paths, dict):
        paths = paths["1" if form == 1 else "2-3"]
    for pattern in paths:
        found = next(ROOT.glob(fill(pattern, key, form, hero)), None)
        if found:
            return True, found.relative_to(ROOT).as_posix()
    return False, " | ".join(fill(p, key, form, hero) for p in paths)


def main():
    book = json.loads(CHECKLIST.read_text(encoding="utf-8"))
    status = {"items": [], "heroes": {}}
    for key, hero in book["heroes"].items():
        status["heroes"][key] = {"forms": hero.get("forms", 3), "locked": (ROOT / f"assets/heroes/forms/{key}/LOCKED.txt").exists()}
    for item in book["items"]:
        row = {k: item[k] for k in ("id", "group", "label") if k in item}
        row["optional"] = bool(item.get("optional"))
        row["cells"] = {}
        for key, hero in book["heroes"].items():
            rule = {**item, **item.get("byHero", {}).get(key, {})}
            if "paths" in rule and "grep" in rule and key in item.get("byHero", {}):
                rule.pop("grep" if "paths" in item["byHero"][key] else "paths")
            applies = forms_of(rule.get("forms", "all"), hero.get("forms", 3))
            row["cells"][key] = {str(f): dict(zip(("done", "detail"), check(rule, key, f, hero))) for f in applies}
        status["items"].append(row)
    STATUS.write_text(json.dumps(status, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    heroes = list(book["heroes"])
    print(f"{'item':22s}" + "".join(f"{k:>12s}" for k in heroes))
    missing = 0
    for row in status["items"]:
        line = f"{row['id']:22s}"
        for key in heroes:
            cells = row["cells"][key]
            text = "".join("✓" if c["done"] else ("·" if row["optional"] else "✗") for c in cells.values()) or "-"
            missing += sum(not c["done"] and not row["optional"] for c in cells.values())
            line += f"{text:>12s}"
        print(line)
    print(f"\n{missing} required item(s) missing -> {STATUS.relative_to(ROOT)}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
