#!/usr/bin/env python3
"""Turn the AI-generated grids (baked checkerboard, no alpha) into individual,
correctly-named transparent PNGs for the game.

Method: for each cell, detect the checkerboard's gray shades from the border,
flood-fill the border-connected "gray-and-low-saturation" region to alpha 0,
then trim, lightly de-fringe, resize, and save.
"""
import os, glob, sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "assets", "raw")      # AI-generated source grids/images
OUT = os.path.join(ROOT, "assets", "sprites")  # game-ready named PNGs

SAT_T = 24      # max(RGB)-min(RGB) <= this  => "gray"
LUMA_TOL = 14   # widen the detected shade band by this on each side

# (folder substring, cols, rows, [names row-major])
GRIDS = [
    ("4x1_grid_of_distinct_rival", 2, 2, ["enemy-01", "enemy-02", "enemy-03", "enemy-04"]),
    ("boss_spaceships", 3, 2, ["boss-01", "boss-02", "boss-03", "boss-04", "boss-05", "boss-06"]),
    ("power_up_icons", 2, 2, ["powerup-rapid", "powerup-spread", "powerup-shield", "powerup-life"]),
    ("chocolate_bar_projectiles", 2, 2, ["shot-player", "shot-player-2", "shot-player-3", "shot-player-4"]),
    ("enemy_and_boss_projectiles", 2, 2, ["shot-enemy", "shot-enemy-2", "shot-boss", "shot-enemy-3"]),
    ("cute_spaceship", 1, 1, ["player-ship-choco"]),
    ("special_bonus_ufo", 1, 1, ["ufo"]),
]

TARGET_W = {
    "player-ship": 150, "player-ship-choco": 130,
    "enemy-01": 100, "enemy-02": 100, "enemy-03": 100, "enemy-04": 100,
    "ufo": 150,
    "boss-01": 380, "boss-02": 380, "boss-03": 380, "boss-04": 380, "boss-05": 380, "boss-06": 380,
    "shot-player": 72, "shot-player-2": 72, "shot-player-3": 72, "shot-player-4": 72,
    "shot-enemy": 60, "shot-enemy-2": 60, "shot-enemy-3": 60, "shot-boss": 92,
    "powerup-rapid": 84, "powerup-spread": 84, "powerup-shield": 84, "powerup-life": 84,
}


def find(sub):
    for p in glob.glob(os.path.join(RAW, "*", "screen.png")):
        if sub in os.path.basename(os.path.dirname(p)):
            return p
    return None


def remove_checker(rgb):
    """rgb: HxWx3 uint8 -> alpha HxW uint8 (0 = background)."""
    h, w, _ = rgb.shape
    f = rgb.astype(np.int16)
    sat = f.max(2) - f.min(2)
    luma = f.mean(2)
    gray = sat <= SAT_T

    # detect shade band from low-sat border pixels
    border = np.zeros((h, w), bool)
    b = max(2, min(h, w) // 80)
    border[:b, :] = border[-b:, :] = border[:, :b] = border[:, -b:] = True
    bl = luma[border & gray]
    if bl.size < 50:
        return np.full((h, w), 255, np.uint8)  # no detectable bg
    lo, hi = np.percentile(bl, 3) - LUMA_TOL, np.percentile(bl, 97) + LUMA_TOL
    cand = gray & (luma >= lo) & (luma <= hi)

    # flood fill border-connected candidate via iterative 4-conn dilation
    filled = border & cand
    while True:
        d = filled.copy()
        d[1:, :] |= filled[:-1, :]
        d[:-1, :] |= filled[1:, :]
        d[:, 1:] |= filled[:, :-1]
        d[:, :-1] |= filled[:, 1:]
        d &= cand
        if d.sum() == filled.sum():
            break
        filled = d
    return np.where(filled, 0, 255).astype(np.uint8)


def refine_and_trim(img):
    """img RGBA -> de-fringed, trimmed, padded RGBA (or None if empty)."""
    a = img.split()[3]
    a = a.filter(ImageFilter.MinFilter(3))      # erode 1px -> kill gray fringe
    a = a.filter(ImageFilter.GaussianBlur(0.6))  # soft anti-alias
    img.putalpha(a)
    bbox = img.getbbox()
    if not bbox:
        return None
    img = img.crop(bbox)
    pad = max(2, int(0.04 * max(img.size)))
    out = Image.new("RGBA", (img.width + 2 * pad, img.height + 2 * pad), (0, 0, 0, 0))
    out.paste(img, (pad, pad), img)
    return out


def fit(img, name):
    tw = TARGET_W.get(name)
    if tw and img.width > tw:
        nh = max(1, round(img.height * tw / img.width))
        img = img.resize((tw, nh), Image.LANCZOS)
    return img


def process_image(im, name):
    rgb = np.array(im.convert("RGB"))
    alpha = remove_checker(rgb)
    out = Image.fromarray(np.dstack([rgb, alpha]), "RGBA")
    out = refine_and_trim(out)
    if out is None:
        print(f"  !! {name}: empty after keying")
        return None
    out = fit(out, name)
    dst = os.path.join(OUT, name + ".png")
    out.save(dst)
    print(f"  -> {name}.png  {out.size}")
    return dst


def run():
    saved = []
    for sub, cols, rows, names in GRIDS:
        p = find(sub)
        if not p:
            print(f"MISSING source for '{sub}'")
            continue
        print(f"[{sub}] {cols}x{rows}")
        im = Image.open(p).convert("RGB")
        W, H = im.size
        cw, ch = W // cols, H // rows
        for r in range(rows):
            for c in range(cols):
                idx = r * cols + c
                if idx >= len(names):
                    continue
                cell = im.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
                d = process_image(cell, names[idx])
                if d:
                    saved.append(names[idx])

    # face-rocket -> player-ship (chosen player ship)
    face = glob.glob(os.path.join(RAW, "Replace_the_man*"))
    if face:
        print("[face-rocket] -> player-ship")
        if process_image(Image.open(face[0]), "player-ship"):
            saved.append("player-ship")

    # background: just flatten to PNG (no alpha needed)
    bg = find("deep_space_background")
    if bg:
        Image.open(bg).convert("RGB").save(os.path.join(OUT, "background.png"))
        print("  -> background.png (passthrough)")
        saved.append("background")

    return saved


def contact_sheet(names):
    names = [n for n in names if n != "background"]
    cell = 150
    cols = 6
    rows = (len(names) + cols - 1) // cols
    pad, label_h = 12, 18
    cw = cell + pad
    chh = cell + label_h + pad
    sheet = Image.new("RGB", (cols * cw + pad, rows * chh + pad), (15, 15, 50))
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 13)
    except Exception:
        font = ImageFont.load_default()
    dr = ImageDraw.Draw(sheet)
    for i, n in enumerate(sorted(names)):
        r, c = divmod(i, cols)
        x, y = pad + c * cw, pad + r * chh
        try:
            sp = Image.open(os.path.join(OUT, n + ".png")).convert("RGBA")
        except FileNotFoundError:
            continue
        sp.thumbnail((cell, cell), Image.LANCZOS)
        ox, oy = x + (cell - sp.width) // 2, y + (cell - sp.height) // 2
        sheet.paste(sp, (ox, oy), sp)
        dr.text((x, y + cell + 2), n, fill=(225, 223, 255), font=font)
    out = os.path.join(ROOT, "docs", "asset_preview.png")
    sheet.save(out)
    print("contact sheet ->", out)


def composite_face(face_path, out_name="player-ship"):
    """Circle-crop a portrait into the rocket porthole of the processed ship."""
    rocket = Image.open(os.path.join(OUT, out_name + ".png")).convert("RGBA")
    W, H = rocket.size
    d = int(W * 0.52)                      # porthole diameter
    cx, cy = W // 2, int(H * 0.305)        # porthole center (upper-middle)
    face = Image.open(face_path).convert("RGBA")
    s = min(face.size)
    face = face.crop(((face.width - s) // 2, (face.height - s) // 2,
                      (face.width + s) // 2, (face.height + s) // 2)).resize((d, d), Image.LANCZOS)
    mask = Image.new("L", (d, d), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, d, d), fill=255)
    rocket.paste(face, (cx - d // 2, cy - d // 2), mask)
    rocket = rocket.crop((0, 0, W, int(H * 0.66)))   # drop the detached exhaust + gap below the ship
    bb = rocket.getbbox()
    if bb:
        rocket = rocket.crop(bb)
    rocket.save(os.path.join(OUT, out_name + ".png"))
    print(f"  composited face -> {out_name}.png (cropped to {rocket.size})")


if __name__ == "__main__":
    s = run()
    fp = os.path.join(RAW, "anna-face.jpg")
    if os.path.exists(fp):
        composite_face(fp)
    print(f"\nsaved {len(s)} sprites")
    contact_sheet(s)
