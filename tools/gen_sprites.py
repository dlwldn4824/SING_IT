# LAST SONG! sprite factory
# Gameplay pixels are born here. Do not generate sprites with an image model.
# Palette must stay in lockstep with src/palette.js

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "sprites"
OUT.mkdir(parents=True, exist_ok=True)

PAL = {
    "BG_NIGHT": (26, 21, 32, 255),
    "BG_AUDIENCE": (42, 36, 51, 255),
    "BG_RAIL": (61, 53, 72, 255),
    "BG_SHADOW": (14, 11, 18, 255),
    "STAGE_WOOD": (107, 74, 50, 255),
    "STAGE_WOOD_DK": (74, 50, 36, 255),
    "STAGE_WOOD_LT": (138, 98, 68, 255),
    "METAL": (110, 106, 104, 255),
    "METAL_DK": (58, 56, 54, 255),
    "SKIN": (240, 200, 160, 255),
    "SKIN_SH": (196, 146, 108, 255),
    "HAIR_P1": (28, 20, 16, 255),
    "HAIR_P2": (106, 58, 34, 255),
    "SHIRT_P1": (58, 92, 255, 255),
    "SHIRT_P1_DK": (36, 56, 176, 255),
    "SHIRT_P2": (232, 200, 74, 255),
    "SHIRT_P2_DK": (176, 144, 32, 255),
    "WHITE": (244, 240, 232, 255),
    "BLACK": (20, 18, 16, 255),
    "GUITAR_RED": (196, 60, 60, 255),
    "GUITAR_SUN": (212, 160, 74, 255),
    "MIC_SILVER": (208, 212, 216, 255),
    "DRUM_WHITE": (232, 224, 212, 255),
    "BOX_KRAFT": (196, 160, 106, 255),
    "PEDAL_BLUE": (60, 140, 220, 255),
    "DANGER_RED": (240, 48, 48, 255),
    "DANGER_ORANGE": (240, 120, 32, 255),
    "SPARK_YEL": (255, 224, 64, 255),
    "SMOKE": (138, 132, 144, 255),
    "SUCCESS_GOLD": (255, 232, 106, 255),
    "SUCCESS_STAR": (255, 246, 200, 255),
    "TENSION_PINK": (255, 90, 138, 255),
    0: (0, 0, 0, 0),
}

DIRS = ("down", "up", "left", "right")
CHAR_W, CHAR_H = 16, 24
FRAMES = ("idle0", "idle1", "idle2", "idle3", "walk0", "walk1", "walk2", "walk3", "act0", "act1", "act2", "panic0", "panic1")


def new_img(w, h):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def put(im, x, y, key):
    if key == 0:
        return
    if 0 <= x < im.width and 0 <= y < im.height:
        im.putpixel((x, y), PAL[key])


def rect(im, x, y, w, h, key):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            put(im, xx, yy, key)


def stamp(im, ox, oy, rows, cmap):
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            key = cmap.get(ch, 0)
            if key:
                put(im, ox + x, oy + y, key)


def shadow(im, ox, oy):
    # 2px foot ellipse
    for x, y in ((5, 22), (6, 22), (7, 22), (8, 22), (9, 22), (10, 22), (6, 23), (7, 23), (8, 23), (9, 23)):
        put(im, ox + x, oy + y, "BG_SHADOW")


def crew_cmap(who):
    if who == "p1":
        return {
            "H": "HAIR_P1",
            "S": "SKIN",
            "s": "SKIN_SH",
            "T": "SHIRT_P1",
            "t": "SHIRT_P1_DK",
            "L": "HAIR_P1",
            "F": "BLACK",
            "W": "WHITE",
            "e": "BLACK",
            "m": "SKIN_SH",
            ".": 0,
        }
    return {
        "H": "HAIR_P2",
        "S": "SKIN",
        "s": "SKIN_SH",
        "T": "SHIRT_P2",
        "t": "SHIRT_P2_DK",
        "L": "HAIR_P2",
        "F": "BLACK",
        "W": "WHITE",
        "e": "BLACK",
        "m": "SKIN_SH",
        "P": "HAIR_P2",
        ".": 0,
    }


def npc_cmap(who):
    base = {
        "H": "HAIR_P1",
        "S": "SKIN",
        "s": "SKIN_SH",
        "L": "BLACK",
        "F": "BLACK",
        "W": "WHITE",
        "e": "BLACK",
        "m": "SKIN_SH",
        "G": "GUITAR_RED",
        "g": "GUITAR_SUN",
        "M": "MIC_SILVER",
        "D": "DRUM_WHITE",
        "d": "METAL_DK",
        ".": 0,
    }
    if who == "vocal":
        base["T"] = "GUITAR_RED"
        base["t"] = "DANGER_RED"
        base["H"] = "HAIR_P2"
    elif who == "guitar":
        base["T"] = "METAL_DK"
        base["t"] = "BLACK"
        base["H"] = "HAIR_P1"
    else:
        base["T"] = "PEDAL_BLUE"
        base["t"] = "METAL_DK"
        base["H"] = "HAIR_P1"
    return base


def frame_down(who, kind, n, bob=0, panic=False, act=False):
    # 16x24 chibi, big head
    pony = who == "p2"
    open_mouth = panic
    arm = "T"
    if act:
        arm = "T"
    mouth = "m" if not open_mouth else "e"
    eye = "e"
    # head / body / legs. bob shifts body+legs
    rows = [
        "................",
        "....HHHHHH......",
        "...HHHHHHHH.....",
        "...HHSSSSHH.....",
        f"...HSeSSeSH.....",
        "...HSSSSSSH.....",
        f"...HSS{mouth}{mouth}SSH.....",
        "....HSSSHs......",
        ".....HssH.......",
        "......tt........",
        "....TTTTTT......",
        "...TTTTTTTT.....",
        f"...T{arm}TWWT{arm}T.....",
        "...TTTTTTTT.....",
        "....TT..TT......",
        "....LL..LL......",
        "....LL..LL......",
        "....LL..LL......",
        "...FFF..FFF.....",
        "................",
        "................",
        "................",
        "................",
        "................",
    ]
    if pony:
        rows[1] = "...PHHHHHH......"
        rows[2] = "..PPHHHHHHHH...."
        rows[3] = "...PHHSSSSHH...."
        rows[8] = ".....HssHP......"
        rows[9] = "......tt.P......"
    if panic:
        rows[10] = "..T..TTTT..T...."
        rows[11] = ".TT.TTTTTT.TT..."
        rows[12] = "TT..TTWWTT..TT.."
        rows[4] = "...HSeSSeSH....."
        rows[6] = "...HSSeeeSH....."
    if act:
        rows[10] = "....TTTTTT......"
        rows[11] = "...TTTTTTTT....."
        rows[12] = "...TTTTWWTTT...."
        rows[13] = "...TTTTTTTTTT..."
    if kind == "walk":
        if n % 2 == 0:
            rows[15] = "....LL...LL....."
            rows[16] = "...LL.....L....."
            rows[17] = "...LL.....LL...."
            rows[18] = "..FFF.....FFF..."
        else:
            rows[15] = ".....LL.LL......"
            rows[16] = ".....L...LL....."
            rows[17] = "....LL...LL....."
            rows[18] = "...FFF...FFF...."
    # apply bob by prepending empty / cropping — handled at blit
    return rows, bob


def frame_up(who, kind, n, panic=False, act=False):
    pony = who == "p2"
    rows = [
        "................",
        "....HHHHHH......",
        "...HHHHHHHH.....",
        "...HHHHHHHH.....",
        "...HHHHHHHH.....",
        "...HHHHHHHH.....",
        "....HHHHHH......",
        ".....HHHH.......",
        "......HH........",
        "......tt........",
        "....TTTTTT......",
        "...TTTTTTTT.....",
        "...TTTTTTTT.....",
        "...TTTTTTTT.....",
        "....TT..TT......",
        "....LL..LL......",
        "....LL..LL......",
        "....LL..LL......",
        "...FFF..FFF.....",
        "................",
        "................",
        "................",
        "................",
        "................",
    ]
    if pony:
        rows[1] = "...HHHHHHHP....."
        rows[2] = "...HHHHHHHHPP..."
        rows[8] = ".....HHHH.P....."
        rows[9] = "......tt.P......"
    if who in ("p1", "p2"):
        num = "W"
        rows[12] = f"...TTT{num}{num}TTT....."
    if panic:
        rows[10] = "..T..TTTT..T...."
        rows[11] = ".TT.TTTTTT.TT..."
    if kind == "walk":
        if n % 2 == 0:
            rows[15] = "....LL...LL....."
            rows[17] = "...LL.....LL...."
            rows[18] = "..FFF.....FFF..."
        else:
            rows[15] = ".....LL.LL......"
            rows[17] = "....LL...LL....."
            rows[18] = "...FFF...FFF...."
    if act:
        rows[12] = "...TTTTTTTTTT..."
        rows[13] = "...TTTTTTTTTT..."
    return rows


def frame_side(who, kind, n, facing="right", panic=False, act=False):
    pony = who == "p2"
    mouth = "e" if panic else "m"
    rows = [
        "................",
        "...HHHHHH.......",
        "..HHHHHHHH......",
        "..HHHSSSSH......",
        "..HHSeSSSH......",
        "..HHSSSSSH......",
        f"..HHSS{mouth}SSH......",
        "...HSSSsH.......",
        "....HssH........",
        ".....tt.........",
        "...TTTTTT.......",
        "..TTTTTTTT......",
        "..TTTTTTTT......",
        "..TTTTTTTT......",
        "...TT..TT.......",
        "...LL..LL.......",
        "...LL..LL.......",
        "...LL..LL.......",
        "..FFF..FFF......",
        "................",
        "................",
        "................",
        "................",
        "................",
    ]
    if pony:
        rows[1] = "..PHHHHHH......."
        rows[2] = ".PPHHHHHHHH....."
        rows[8] = "....HssHP......."
        rows[9] = ".....tt.P......."
    if panic:
        rows[10] = "T..TTTTTT......."
        rows[11] = "TT.TTTTTTTT....."
        rows[4] = "..HHSeSSSH......"
    if act:
        rows[11] = "..TTTTTTTTTT...."
        rows[12] = "..TTTTTTTTTT...."
        rows[13] = "..TTTTTTTTTTT..."
    if kind == "walk":
        if n % 2 == 0:
            rows[15] = "...LL....L......"
            rows[16] = "..LL.....LL....."
            rows[17] = "..LL......L....."
            rows[18] = ".FFF.....FFF...."
        else:
            rows[15] = "....L..LL......."
            rows[16] = "...LL...LL......"
            rows[17] = "...L....LL......"
            rows[18] = "..FFF...FFF....."
    if facing == "left":
        rows = [row[::-1] for row in rows]
    return rows


def char_rows(who, direction, kind, n):
    panic = kind == "panic"
    act = kind == "act"
    bob = 0
    if kind == "idle":
        bob = 1 if n in (2,) else 0
    if direction == "down":
        rows, _ = frame_down(who, kind, n, bob, panic, act)
    elif direction == "up":
        rows = frame_up(who, kind, n, panic, act)
    else:
        rows = frame_side(who, kind, n, direction, panic, act)
    if bob:
        rows = ["................"] + rows[:-1]
    return rows


def draw_character_sheet():
    who_list = ["p1", "p2", "vocal", "guitar", "drum"]
    cols = len(FRAMES)
    rows_n = len(who_list) * len(DIRS)
    im = new_img(cols * CHAR_W, rows_n * CHAR_H)
    atlas = {}
    for ci, who in enumerate(who_list):
        cmap = crew_cmap(who) if who in ("p1", "p2") else npc_cmap(who)
        for di, direction in enumerate(DIRS):
            ry = (ci * len(DIRS) + di) * CHAR_H
            for fi, fname in enumerate(FRAMES):
                if fname.startswith("idle"):
                    kind, n = "idle", int(fname[-1])
                elif fname.startswith("walk"):
                    kind, n = "walk", int(fname[-1])
                elif fname.startswith("act"):
                    kind, n = "act", int(fname[-1])
                else:
                    kind, n = "panic", int(fname[-1])
                rx = fi * CHAR_W
                shadow(im, rx, ry)
                stamp(im, rx, ry, char_rows(who, direction, kind, n), cmap)
                atlas[f"{who}/{direction}/{fname}"] = {"x": rx, "y": ry, "w": CHAR_W, "h": CHAR_H}
    im.save(OUT / "chars.png")
    return atlas


def draw_tiles():
    im = new_img(96, 48)

    def wood(ox, oy, a, b, c):
        rect(im, ox, oy, 16, 16, a)
        for x in range(16):
            put(im, ox + x, oy + 4, b)
            put(im, ox + x, oy + 11, b)
        put(im, ox + 3, oy + 1, c)
        put(im, ox + 12, oy + 8, c)
        put(im, ox, oy, b)
        put(im, ox + 15, oy + 15, b)

    wood(0, 0, "STAGE_WOOD", "STAGE_WOOD_DK", "STAGE_WOOD_LT")
    wood(16, 0, "STAGE_WOOD_DK", "BG_SHADOW", "STAGE_WOOD")
    wood(32, 0, "STAGE_WOOD_LT", "STAGE_WOOD", "STAGE_WOOD_DK")
    # backstage darker
    rect(im, 48, 0, 16, 16, "STAGE_WOOD_DK")
    for x in range(16):
        put(im, 48 + x, 5, "BG_SHADOW")
        put(im, 48 + x, 12, "BG_SHADOW")
    # audience floor
    rect(im, 64, 0, 16, 16, "BG_AUDIENCE")
    for y in range(0, 16, 2):
        put(im, 64 + (y % 4), y, "BG_NIGHT")
    # rail
    rect(im, 80, 0, 16, 16, "BG_AUDIENCE")
    rect(im, 80, 6, 16, 3, "METAL")
    rect(im, 80, 2, 2, 10, "METAL_DK")
    rect(im, 87, 2, 2, 10, "METAL_DK")
    rect(im, 94, 2, 2, 10, "METAL_DK")

    # extra row: night, shadow tile
    rect(im, 0, 16, 16, 16, "BG_NIGHT")
    rect(im, 16, 16, 16, 16, "BG_SHADOW")
    im.save(OUT / "tiles.png")


def draw_props():
    im = new_img(160, 48)

    # guitar 16x24 at 0,0 (red)
    g = [
        "......WW........",
        ".....WggW.......",
        ".....WggW.......",
        "......WW........",
        "......WW........",
        "......WW........",
        "......WW........",
        "....WWWWWW......",
        "...WGGGGGGW.....",
        "...WGGGGGGW.....",
        "...WGGWWGGW.....",
        "...WGGGGGGW.....",
        "....WGGGGw......",
        ".....WWWW.......",
        "................",
        "................",
    ]
    stamp(im, 0, 0, g, {"W": "WHITE", "g": "GUITAR_SUN", "G": "GUITAR_RED", "w": "METAL", ".": 0})

    # spare guitar sunburst 16x24
    stamp(im, 16, 0, g, {"W": "WHITE", "g": "SUCCESS_GOLD", "G": "GUITAR_SUN", "w": "METAL", ".": 0})

    # amp 16x16
    rect(im, 32, 8, 16, 16, "METAL_DK")
    rect(im, 34, 10, 12, 8, "BLACK")
    rect(im, 36, 12, 8, 4, "METAL")
    put(im, 35, 20, "DANGER_RED")
    put(im, 38, 20, "SPARK_YEL")
    put(im, 41, 20, "PEDAL_BLUE")
    rect(im, 34, 21, 12, 2, "BLACK")

    # mic stand 16x24
    for y in range(4, 22):
        put(im, 56, y, "METAL_DK")
    rect(im, 54, 20, 5, 2, "METAL")
    rect(im, 54, 2, 5, 4, "MIC_SILVER")
    put(im, 56, 1, "WHITE")
    put(im, 55, 3, "BLACK")

    # drum kit 32x24 — bass + snare + cymbal, not a keyboard
    rect(im, 66, 12, 18, 10, "DRUM_WHITE")
    rect(im, 68, 14, 14, 6, "WHITE")
    put(im, 67, 13, "METAL")
    put(im, 82, 13, "METAL")
    rect(im, 66, 21, 3, 3, "METAL_DK")
    rect(im, 81, 21, 3, 3, "METAL_DK")
    rect(im, 70, 7, 8, 6, "DRUM_WHITE")
    rect(im, 72, 9, 4, 3, "WHITE")
    rect(im, 64, 4, 1, 10, "METAL")
    rect(im, 62, 3, 5, 2, "SUCCESS_GOLD")
    put(im, 64, 2, "SPARK_YEL")
    rect(im, 86, 8, 6, 8, "DRUM_WHITE")
    rect(im, 87, 10, 4, 4, "METAL")
    rect(im, 88, 4, 1, 6, "METAL")
    put(im, 88, 3, "MIC_SILVER")

    # cable coil 16x8
    for x, y in ((2, 2), (3, 1), (4, 1), (5, 2), (6, 3), (7, 3), (8, 2), (9, 1), (10, 2), (11, 3), (12, 2)):
        put(im, 96 + x, 16 + y, "BLACK")
        put(im, 96 + x, 17 + y, "METAL_DK")
    put(im, 96 + 13, 16 + 3, "METAL")

    # sticks 16x8
    for i in range(10):
        put(im, 112 + i, 18, "BOX_KRAFT")
        put(im, 114 + i, 20, "STAGE_WOOD_LT")
    put(im, 112, 18, "WHITE")
    put(im, 114, 20, "WHITE")

    # box 16x16
    rect(im, 128, 8, 16, 16, "BOX_KRAFT")
    rect(im, 128, 8, 16, 3, "GUITAR_SUN")
    for x in range(16):
        put(im, 128 + x, 16, "STAGE_WOOD_DK")
    put(im, 135, 14, "BLACK")
    put(im, 136, 14, "BLACK")

    # pedal 16x8
    rect(im, 144, 16, 14, 8, "PEDAL_BLUE")
    rect(im, 146, 18, 4, 3, "BLACK")
    put(im, 154, 19, "SPARK_YEL")

    # bang 8x12
    bang = [
        "..RRRR..",
        ".RRWWRR.",
        ".RWWWWR.",
        ".RWWWWWR",
        ".RWWWWR.",
        "..RWRR..",
        "...RR...",
        "...RR...",
        "........",
        "...RR...",
        "...RR...",
        "........",
    ]
    stamp(im, 48, 24, bang, {"R": "DANGER_RED", "W": "WHITE", ".": 0})

    im.save(OUT / "props.png")


def draw_fx():
    im = new_img(64, 32)
    # star 8x8
    star = [
        "...Y....",
        "...Y....",
        "....Y...",
        "YYYYYYYY",
        "...Y....",
        "..Y.Y...",
        ".Y...Y..",
        "........",
    ]
    stamp(im, 0, 0, star, {"Y": "SUCCESS_STAR", ".": 0})
    stamp(im, 8, 0, star, {"Y": "SUCCESS_GOLD", ".": 0})
    # spark
    put(im, 18, 2, "SPARK_YEL")
    put(im, 17, 3, "DANGER_ORANGE")
    put(im, 19, 3, "WHITE")
    put(im, 18, 4, "SPARK_YEL")
    put(im, 18, 1, "WHITE")
    # smoke 4 frames
    for i, dots in enumerate(((1, 2, 2, 1), (2, 0, 1, 2), (0, 1, 2, 0), (1, 0, 0, 2))):
        ox = 24 + i * 8
        put(im, ox + 2, dots[0], "SMOKE")
        put(im, ox + 3, dots[1], "METAL")
        put(im, ox + 1, dots[2] + 1, "SMOKE")
        put(im, ox + 4, dots[3] + 2, "METAL")
    # sweat
    put(im, 58, 2, "PEDAL_BLUE")
    put(im, 58, 3, "MIC_SILVER")
    put(im, 59, 4, "WHITE")
    # dust
    put(im, 2, 12, "WHITE")
    put(im, 4, 13, "STAGE_WOOD_LT")
    put(im, 1, 14, "WHITE")
    im.save(OUT / "fx.png")


def draw_crowd():
    # 8x12, 4 moods: cheer, mid, sad, ears
    im = new_img(32, 12)
    cheer = [
        "..HHHH..",
        ".HSSSSH.",
        ".HeSSeH.",
        ".HSSSSH.",
        "..HssH..",
        "T.TTTT.T",
        "TTTWTTT.",
        ".TTTTT..",
        "..L.L...",
        "..L.L...",
        ".FF.FF..",
        "........",
    ]
    mid = [
        "..HHHH..",
        ".HSSSSH.",
        ".HeSSeH.",
        ".HSssSH.",
        "..HssH..",
        "..TTTT..",
        "..TWTT..",
        "..TTTT..",
        "..L.L...",
        "..L.L...",
        ".FF.FF..",
        "........",
    ]
    sad = [
        "..HHHH..",
        ".HSSSSH.",
        ".HeSSeH.",
        ".HSmmSH.",
        "..HssH..",
        "..TTTT..",
        "..TTTT..",
        "..TTTT..",
        "..L.L...",
        "..L.L...",
        ".FF.FF..",
        "........",
    ]
    ears = [
        "..HHHH..",
        ".HSSSSH.",
        "THeSSeHT",
        "THSssSHT",
        "..HssH..",
        "..TTTT..",
        "..TTTT..",
        "..TTTT..",
        "..L.L...",
        "..L.L...",
        ".FF.FF..",
        "........",
    ]
    cmap = {
        "H": "HAIR_P1",
        "S": "SKIN",
        "s": "SKIN_SH",
        "e": "BLACK",
        "m": "SKIN_SH",
        "T": "PEDAL_BLUE",
        "W": "WHITE",
        "L": "METAL_DK",
        "F": "BLACK",
        ".": 0,
    }
    stamp(im, 0, 0, cheer, cmap)
    stamp(im, 8, 0, mid, {**cmap, "T": "METAL", "H": "HAIR_P2"})
    stamp(im, 16, 0, sad, {**cmap, "T": "BG_RAIL", "H": "BLACK"})
    stamp(im, 24, 0, ears, {**cmap, "T": "GUITAR_RED"})
    im.save(OUT / "crowd.png")


def draw_preview():
    # 320x180 mock of the locked layout, palette-only
    im = new_img(320, 180)
    rect(im, 0, 0, 320, 180, "BG_NIGHT")
    rect(im, 0, 0, 320, 44, "BG_AUDIENCE")
    rect(im, 0, 44, 320, 8, "BG_RAIL")
    for x in range(0, 320, 16):
        put(im, x + 4, 46, "METAL")
        put(im, x + 12, 46, "METAL")
        rect(im, x + 3, 45, 2, 6, "METAL_DK")
    rect(im, 24, 52, 272, 84, "STAGE_WOOD")
    for y in range(52, 136, 8):
        for x in range(24, 296):
            if (x + y) % 17 == 0:
                put(im, x, y, "STAGE_WOOD_DK")
            if (x + y * 3) % 29 == 0:
                put(im, x, y, "STAGE_WOOD_LT")
    rect(im, 0, 136, 320, 44, "STAGE_WOOD_DK")
    for y in range(136, 180, 6):
        for x in range(0, 320):
            if x % 18 == 0:
                put(im, x, y, "BG_SHADOW")

    tiles = Image.open(OUT / "tiles.png")
    props = Image.open(OUT / "props.png")
    chars = Image.open(OUT / "chars.png")
    crowd = Image.open(OUT / "crowd.png")

    for i, x in enumerate(range(28, 300, 10)):
        mood = 0 if i % 3 == 0 else (1 if i % 3 == 1 else 0)
        crop = crowd.crop((mood * 8, 0, mood * 8 + 8, 12))
        im.alpha_composite(crop, (x, 28 + (i % 2)))
        if i % 2 == 0:
            put(im, x + 3, 24, "TENSION_PINK")
            put(im, x + 3, 25, "TENSION_PINK")

    im.alpha_composite(props.crop((48, 0, 64, 24)), (86, 70))
    im.alpha_composite(props.crop((0, 0, 16, 24)), (148, 78))
    im.alpha_composite(props.crop((32, 8, 48, 24)), (148, 108))
    im.alpha_composite(props.crop((64, 0, 96, 24)), (210, 80))
    im.alpha_composite(props.crop((32, 8, 48, 24)), (208, 108))
    im.alpha_composite(props.crop((144, 16, 158, 24)), (176, 118))
    im.alpha_composite(props.crop((16, 0, 32, 24)), (36, 148))
    im.alpha_composite(props.crop((96, 16, 112, 24)), (80, 154))
    im.alpha_composite(props.crop((112, 16, 128, 24)), (120, 154))
    im.alpha_composite(props.crop((128, 8, 144, 24)), (250, 148))

    # bang over guitar
    im.alpha_composite(props.crop((48, 24, 56, 36)), (150, 64))

    # p1 run, p2 carry
    im.alpha_composite(chars.crop((4 * 16, 0, 5 * 16, 24)), (120, 100))
    im.alpha_composite(chars.crop((0, 96, 16, 120)), (200, 140))

    # npcs
    im.alpha_composite(chars.crop((0, 8 * 24, 16, 9 * 24)), (78, 78))
    im.alpha_composite(chars.crop((0, 12 * 24, 16, 13 * 24)), (164, 76))
    im.alpha_composite(chars.crop((0, 16 * 24, 16, 17 * 24)), (226, 72))

    im.save(OUT / "preview_stage.png")
    im.resize((320 * 4, 180 * 4), Image.NEAREST).save(OUT / "preview_stage_4x.png")


def main():
    atlas = draw_character_sheet()
    draw_tiles()
    draw_props()
    draw_fx()
    draw_crowd()
    draw_preview()
    (OUT / "atlas.json").write_text(
        __import__("json").dumps(atlas, indent=2),
        encoding="utf-8",
    )
    print("wrote", OUT)


if __name__ == "__main__":
    main()
