"""Bakes the derived textures in public/fx from the source artwork.

Run once with:  python3 scripts/make-fx.py   (needs Pillow + numpy)
The outputs are committed, so this is only needed if the artwork changes.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
OUT = ROOT / "public" / "fx"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1296, 2304  # 1.2x of 1080x1920 so the camera can drift

# 1. Sky plate cropped from the inside of the window artwork (9.png).
window = Image.open(ASSETS / "9.png").convert("RGB")
sky = window.crop((380, 462, 746, 1112)).resize((W, H), Image.LANCZOS)
sky = sky.filter(ImageFilter.GaussianBlur(3))
sky.save(OUT / "sky-dawn.jpg", quality=92)

# Dusk grade: deeper, cooler, less exposed version of the same plate.
arr = np.asarray(sky).astype(np.float32) / 255.0
tint = np.array([0.34, 0.22, 0.58], dtype=np.float32)  # plum-indigo
dusk = arr ** 1.9 * 0.5 + tint * 0.2
dusk = np.clip(dusk, 0, 1)
Image.fromarray((dusk * 255).astype(np.uint8)).save(OUT / "sky-dusk.jpg", quality=92)

# Very soft, defocused version used for depth-of-field layers.
sky.resize((W // 4, H // 4), Image.LANCZOS).filter(ImageFilter.GaussianBlur(10)).resize(
    (W // 2, H // 2), Image.LANCZOS
).save(OUT / "sky-soft.jpg", quality=90)

# 2. Glow halos for every artwork: blurred, brightened alpha silhouettes.
for i in range(1, 11):
    im = Image.open(ASSETS / f"{i}.png").convert("RGBA")
    im.thumbnail((420, 420), Image.LANCZOS)
    pad = 90
    canvas = Image.new("RGBA", (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
    canvas.alpha_composite(im, (pad, pad))
    glow = canvas.filter(ImageFilter.GaussianBlur(26))
    glow = ImageEnhance.Brightness(glow).enhance(1.35)
    glow.save(OUT / f"glow-{i}.png", optimize=True)

    # Defocused copy for background / foreground parallax layers.
    soft = Image.open(ASSETS / f"{i}.png").convert("RGBA")
    soft.thumbnail((360, 360), Image.LANCZOS)
    soft = soft.filter(ImageFilter.GaussianBlur(7))
    soft.save(OUT / f"soft-{i}.png", optimize=True)

# 3. Film grain tile.
rng = np.random.default_rng(7)
noise = rng.normal(128, 38, (256, 256)).clip(0, 255).astype(np.uint8)
alpha = np.full((256, 256), 255, np.uint8)
Image.fromarray(np.dstack([noise, noise, noise, alpha]), "RGBA").save(OUT / "grain.png", optimize=True)

print("fx written to", OUT)
