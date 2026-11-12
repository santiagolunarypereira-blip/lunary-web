"""Recursos de la landing /alarico/ a partir de los presskits y las artes oficiales.
Uso: python build/alarico_assets.py "<carpeta Landing page Alarico>"
Fotos: gradient map rojo del flyer (negro -> rojo #C21616 -> rosado claro), 4:5 800x1000 y 16:9 para Alarico.
"""
import os, sys, subprocess
import numpy as np
from PIL import Image, ImageOps
Image.MAX_IMAGE_PIXELS = None
import imageio_ffmpeg
FF = imageio_ffmpeg.get_ffmpeg_exe()

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "eventos-assets", "alarico")
SRC = sys.argv[1]
PK = os.path.join(SRC, "Presskit Djs"); ART = os.path.join(SRC, "Artes oficiales y recursos")

stops = [(0, (0, 0, 0)), (.30, (58, 4, 6)), (.58, (194, 22, 22)), (.82, (236, 122, 112)), (1, (246, 222, 214))]
lut = np.zeros((256, 3))
for i in range(256):
    t = i / 255
    for (a, ca), (b, cb) in zip(stops, stops[1:]):
        if a <= t <= b: k = (t - a) / (b - a); lut[i] = [ca[j] + (cb[j] - ca[j]) * k for j in range(3)]; break
lut = lut.astype(np.uint8)


def grade(im, gamma=1.0):
    g = ImageOps.autocontrast(im.convert("L"), cutoff=1)
    if gamma != 1: g = g.point(lambda v: int(255 * (v / 255) ** gamma))
    return Image.fromarray(lut[np.asarray(g)], "RGB")


def crop(im, ratio, oy, zoom=1.0):
    W0, H0 = im.size; w = int(W0 * zoom); h = int(w / ratio)
    if h > H0: h = H0; w = int(h * ratio)
    x0 = (W0 - w) // 2; y0 = int(min(H0 - h, H0 * oy))
    return im.crop((x0, y0, x0 + w, y0 + h))


# (archivo, slug, y del recorte, zoom, gamma)
P = [("Alarico/Alarico1.jpg", "alarico", .06, .72, 1.0),
     ("Sons Of Hidden/Photo 10-06-26, 1 46 10 PM.jpg", "sons-of-hidden", .06, .9, 1.0),
     ("TARAB/TARAB-7 EDIT.jpeg", "tarab", .08, 1, 1.0),
     ("EV-1/DSC03281.jpg", "ev-1", .10, 1, 1.0)]
for f, slug, oy, z, gm in P:
    im = ImageOps.exif_transpose(Image.open(os.path.join(PK, f))).convert("RGB")
    c = crop(im, .8, oy, z); c.thumbnail((1600, 2000)); grade(c.resize((800, 1000), Image.LANCZOS), gm).save(os.path.join(OUT, f"{slug}.webp"), "WEBP", quality=80, method=6)
    print("ok", slug)
# Alarico ancho (tarjeta principal): foto del hoodie, la misma del flyer
im = ImageOps.exif_transpose(Image.open(os.path.join(PK, "Alarico/Alarico3.jpg"))).convert("RGB")
c = crop(im, 16 / 9, .25); c.thumbnail((3200, 1800)); grade(c.resize((1600, 900), Image.LANCZOS)).save(os.path.join(OUT, "alarico-wide.webp"), "WEBP", quality=78, method=6)
# Sons of Hidden ancho (support headliner)
im = ImageOps.exif_transpose(Image.open(os.path.join(PK, "Sons Of Hidden/Photo 10-06-26, 1 46 10 PM.jpg"))).convert("RGB")
c = crop(im, 16 / 10, .22); c.thumbnail((2400, 1500)); grade(c.resize((1280, 800), Image.LANCZOS)).save(os.path.join(OUT, "sons-of-hidden-wide.webp"), "WEBP", quality=78, method=6)
print("ok anchos")

# Flyer animado 4:5 para el hero (con audio: arranca en silencio y se activa con un botón)
subprocess.run([FF, "-v", "error", "-y", "-i", os.path.join(ART, "GrvLun_Alarico_Flyer 4x5.mp4"), "-vf", "scale=720:-2", "-c:v", "libx264",
                "-preset", "slow", "-crf", "25", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart",
                os.path.join(OUT, "flyer-4x5.mp4")], check=True)
Image.open(os.path.join(ART, "GrvLun_Alarico_4x5.png")).convert("RGB").resize((720, 900), Image.LANCZOS).save(os.path.join(OUT, "flyer-4x5.webp"), "WEBP", quality=82, method=6)
# Imagen para compartir: el flyer 1:1, igual que Human Safari (720x720)
Image.open(os.path.join(ART, "GrvLun_Alarico_1x1.png")).convert("RGB").resize((720, 720), Image.LANCZOS).save(os.path.join(ROOT, "public", "eventos-assets", "og-alarico.jpg"), quality=86)
print("listo")

# Versiones verticales para celular de las tarjetas grandes (Alarico y Sons of Hidden):
# más aire arriba de la cabeza y el rostro en el tercio superior.
# (archivo, slug, y del recorte, zoom, x: corrimiento horizontal del recorte en fracción del ancho)
for f, slug, oy, z, ox in (("Alarico/Alarico3.jpg", "alarico-m", .0, .9, 0), ("Sons Of Hidden/Photo 10-06-26, 1 46 10 PM.jpg", "sons-of-hidden-m", .04, .78, .13)):
    im = ImageOps.exif_transpose(Image.open(os.path.join(PK, f))).convert("RGB")
    W0 = im.width; dx = int(W0 * ox)
    im = im.crop((max(0, dx), 0, min(W0, W0 + dx), im.height))
    c = crop(im, .9, oy, z); c.thumbnail((1800, 2000)); grade(c.resize((900, 1000), Image.LANCZOS)).save(os.path.join(OUT, f"{slug}.webp"), "WEBP", quality=80, method=6)
    print("ok", slug)
