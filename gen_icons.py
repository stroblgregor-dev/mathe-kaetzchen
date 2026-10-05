"""Erzeugt die App-Icons (Katzengesicht mit Plus-Zeichen) in static/icons/."""
import os

from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icons")
BG1, BG2 = (255, 214, 165), (255, 138, 92)
FUR, DARK, PINK, INK = (244, 162, 89), (217, 120, 47), (249, 168, 192), (43, 34, 51)


def icon(size):
    S = 4 * size  # supersampling
    img = Image.new("RGB", (S, S), BG1)
    d = ImageDraw.Draw(img)
    for y in range(S):
        t = y / S
        d.line([(0, y), (S, y)], fill=tuple(int(BG1[i] + (BG2[i] - BG1[i]) * t) for i in range(3)))
    u = S / 200
    P = lambda *pts: [(x * u, y * u) for x, y in pts]
    # Ohren
    d.polygon(P((42, 78), (50, 22), (92, 56)), fill=FUR)
    d.polygon(P((158, 78), (150, 22), (108, 56)), fill=FUR)
    d.polygon(P((54, 70), (57, 36), (82, 56)), fill=PINK)
    d.polygon(P((146, 70), (143, 36), (118, 56)), fill=PINK)
    # Kopf
    d.ellipse(P((30, 50), (170, 170)), fill=FUR)
    for x0, y0, x1, y1 in ((100, 54, 100, 76), (84, 58, 87, 76), (116, 58, 113, 76)):
        d.line(P((x0, y0), (x1, y1)), fill=DARK, width=int(8 * u))
    d.ellipse(P((72, 118), (128, 150)), fill=(253, 230, 200))
    # Augen
    for cx in (76, 124):
        d.ellipse(P((cx - 13, 96), (cx + 13, 126)), fill=(93, 174, 91))
        d.ellipse(P((cx - 6, 99), (cx + 6, 124)), fill=INK)
        d.ellipse(P((cx - 8, 100), (cx - 1, 107)), fill=(255, 255, 255))
    d.polygon(P((93, 122), (107, 122), (100, 130)), fill=(244, 124, 156))
    d.arc(P((88, 122), (100, 140)), 0, 180, fill=INK, width=int(3 * u))
    d.arc(P((100, 122), (112, 140)), 0, 180, fill=INK, width=int(3 * u))
    # Plus-Abzeichen
    d.ellipse(P((140, 140), (192, 192)), fill=(255, 255, 255))
    d.rectangle(P((162, 150), (170, 182)), fill=(34, 197, 94))
    d.rectangle(P((150, 162), (182, 170)), fill=(34, 197, 94))
    return img.resize((size, size), Image.LANCZOS)


os.makedirs(OUT, exist_ok=True)
for s in (180, 192, 512):
    icon(s).save(os.path.join(OUT, f"icon-{s}.png"))
    print("icon", s)
