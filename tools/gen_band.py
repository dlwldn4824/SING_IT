# Drop band photos into assets/band/ then run:
#   python tools/gen_band.py
# Writes assets/band/looks.json for the game (palette keys only).
# 16x24 cannot copy a real face. This samples hair / skin / shirt / guitar colors.
#
# Files:
#   vocal.png
#   guitar1.png
#   drum.png
#   guitar2.png  OR  bass.png  OR  keys.png   (one 4th member)

from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BAND = ROOT / "assets" / "band"
BAND.mkdir(parents=True, exist_ok=True)

PAL = {
    "BLACK": (20, 18, 16),
    "HAIR_P1": (28, 20, 16),
    "HAIR_P2": (106, 58, 34),
    "METAL_DK": (58, 56, 54),
    "STAGE_WOOD_DK": (74, 50, 36),
    "BOX_KRAFT": (196, 160, 106),
    "GUITAR_SUN": (212, 160, 74),
    "SMOKE": (138, 132, 144),
    "WHITE": (244, 240, 232),
    "SKIN": (240, 200, 160),
    "SKIN_SH": (196, 146, 108),
    "SHIRT_P1": (58, 92, 255),
    "SHIRT_P1_DK": (36, 56, 176),
    "SHIRT_P2": (232, 200, 74),
    "SHIRT_P2_DK": (176, 144, 32),
    "GUITAR_RED": (196, 60, 60),
    "DANGER_RED": (240, 48, 48),
    "PEDAL_BLUE": (60, 140, 220),
    "DRUM_WHITE": (232, 224, 212),
    "TENSION_PINK": (255, 90, 138),
    "METAL": (110, 106, 104),
    "STAGE_WOOD": (107, 74, 50),
    "DANGER_ORANGE": (240, 120, 32),
}

HAIR = ["BLACK", "HAIR_P1", "HAIR_P2", "METAL_DK", "STAGE_WOOD_DK", "BOX_KRAFT", "GUITAR_SUN", "SMOKE", "WHITE"]
SKIN = ["SKIN", "SKIN_SH", "BOX_KRAFT", "GUITAR_SUN", "WHITE"]
SHIRT = [
    "SHIRT_P1", "SHIRT_P1_DK", "SHIRT_P2", "SHIRT_P2_DK", "GUITAR_RED", "DANGER_RED",
    "PEDAL_BLUE", "METAL_DK", "BLACK", "WHITE", "DRUM_WHITE", "TENSION_PINK", "GUITAR_SUN",
]
GUITAR = [
    "GUITAR_RED", "GUITAR_SUN", "BLACK", "METAL", "METAL_DK", "WHITE",
    "STAGE_WOOD", "PEDAL_BLUE", "DANGER_ORANGE", "BOX_KRAFT",
]

CORE = (("vocal", "vocal"), ("guitar1", "guitar1"), ("drum", "drum"))
CORE_ALIAS = {"guitar": "guitar1"}
FLEX = (("guitar2", "guitar2"), ("bass", "bass"), ("keys", "keys"), ("keyboard", "keys"))


def nearest(rgb, keys):
    best, best_d = keys[0], 10 ** 9
    for key in keys:
        pr, pg, pb = PAL[key]
        d = (rgb[0] - pr) ** 2 + (rgb[1] - pg) ** 2 + (rgb[2] - pb) ** 2
        if d < best_d:
            best, best_d = key, d
    return best


def avg(im, box):
    x0, y0, x1, y1 = box
    r = g = b = n = 0
    for y in range(y0, y1):
        for x in range(x0, x1):
            px = im.getpixel((x, y))
            if len(px) == 4 and px[3] < 80:
                continue
            lum = px[0] * 0.3 + px[1] * 0.59 + px[2] * 0.11
            if lum < 18 or lum > 245:
                continue
            r += px[0]
            g += px[1]
            b += px[2]
            n += 1
    if not n:
        return (160, 120, 90)
    return (r // n, g // n, b // n)


def long_hair(im):
    w, h = im.size
    dark = total = 0
    for x in (2, 3, w - 4, w - 3):
        for y in range(int(h * 0.35), int(h * 0.72)):
            px = im.getpixel((x, y))
            if len(px) == 4 and px[3] < 80:
                continue
            total += 1
            lum = px[0] * 0.3 + px[1] * 0.59 + px[2] * 0.11
            if lum < 90:
                dark += 1
    return total > 8 and dark / total > 0.42


def look_from(path, kind):
    im = Image.open(path).convert("RGBA").resize((48, 64), Image.BILINEAR)
    skin = avg(im, (16, 14, 32, 30))
    hair = avg(im, (10, 2, 38, 16))
    shirt = avg(im, (12, 38, 36, 60))
    guitar = avg(im, (8, 44, 40, 62))
    look = {
        "hair": nearest(hair, HAIR),
        "skin": nearest(skin, SKIN),
        "skinDk": nearest((max(0, skin[0] - 36), max(0, skin[1] - 40), max(0, skin[2] - 40)), SKIN),
        "shirt": nearest(shirt, SHIRT),
        "longHair": long_hair(im),
    }
    shirt_rgb = PAL[look["shirt"]]
    look["shirtDk"] = nearest(
        (max(0, shirt_rgb[0] - 40), max(0, shirt_rgb[1] - 40), max(0, shirt_rgb[2] - 40)),
        SHIRT,
    )
    if kind in ("guitar1", "guitar2", "bass"):
        look["guitar"] = nearest(guitar, GUITAR)
        look["guitarHi"] = nearest(
            (min(255, guitar[0] + 28), min(255, guitar[1] + 22), min(255, guitar[2] + 10)),
            GUITAR,
        )
    return look


def find_photo(stem):
    for ext in (".png", ".jpg", ".jpeg", ".webp"):
        p = BAND / f"{stem}{ext}"
        if p.exists():
            return p
    return None


def main():
    looks = {}
    for stem, key in CORE:
        path = find_photo(stem)
        if not path:
            continue
        looks[key] = look_from(path, key)
        print("sampled", key, "from", path.name, looks[key])

    for alias, key in CORE_ALIAS.items():
        if key in looks:
            continue
        path = find_photo(alias)
        if not path:
            continue
        looks[key] = look_from(path, key)
        print("sampled", key, "from", path.name, looks[key])

    found_flex = []
    for stem, role in FLEX:
        path = find_photo(stem)
        if path:
            found_flex.append((role, path))
    if len(found_flex) > 1:
        names = ", ".join(p.name for _, p in found_flex)
        print("4th member: using", found_flex[0][1].name, "(also found", names + ")")
    if found_flex:
        role, path = found_flex[0]
        looks["flex"] = look_from(path, role)
        looks["flex"]["role"] = role
        looks["flexRole"] = role
        print("sampled flex", role, "from", path.name, looks["flex"])
    else:
        looks["flexRole"] = "bass"

    out = BAND / "looks.json"
    out.write_text(json.dumps(looks, indent=2), encoding="utf-8")
    print("wrote", out)


if __name__ == "__main__":
    main()
