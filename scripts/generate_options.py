import os
from PIL import Image, ImageDraw

os.makedirs("public/icon-options", exist_ok=True)

# 1. OPTION 1: The Classic Echo Wave (3 expanding acoustic arcs)
svg_opt1 = """<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="102.4" fill="#f97316"/>
  <g transform="translate(64, 64) scale(16)" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <rect x="4.5" y="2.5" width="6" height="10" rx="3" />
    <path d="M 1.5 9.5 a 6 6 0 0 0 12 0" />
    <line x1="7.5" y1="15.5" x2="7.5" y2="20.5" />
    <line x1="4.5" y1="20.5" x2="10.5" y2="20.5" />
    <path d="M 15 8 a 4.5 4.5 0 0 1 0 6.5" />
    <path d="M 18 5.5 a 8 8 0 0 1 0 11.5" />
    <path d="M 21 3 a 11.5 11.5 0 0 1 0 16.5" />
  </g>
</svg>"""

# 2. OPTION 2: The Equalizer Frequency Wave (Vertical audio tracks)
svg_opt2 = """<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="102.4" fill="#f97316"/>
  <g transform="translate(64, 64) scale(16)" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <rect x="3" y="3" width="5.5" height="9.5" rx="2.75" />
    <path d="M 0.5 9.5 a 5.25 5.25 0 0 0 10.5 0" />
    <line x1="5.75" y1="15" x2="5.75" y2="20" />
    <line x1="3" y1="20" x2="8.5" y2="20" />
    <line x1="13" y1="9" x2="13" y2="13" />
    <line x1="15.5" y1="6" x2="15.5" y2="16" />
    <line x1="18" y1="3.5" x2="18" y2="18.5" />
    <line x1="20.5" y1="6.5" x2="20.5" y2="15.5" />
    <line x1="23" y1="9.5" x2="23" y2="12.5" />
  </g>
</svg>"""

# 3. OPTION 3: Fluid Voice Sine Wave (Continuous speech frequency wave)
svg_opt3 = """<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="102.4" fill="#f97316"/>
  <g transform="translate(64, 64) scale(16)" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <rect x="4" y="2.5" width="6" height="10" rx="3" />
    <path d="M 1.5 9.5 a 5.5 5.5 0 0 0 11 0" />
    <line x1="7" y1="15.5" x2="7" y2="20.5" />
    <line x1="4" y1="20.5" x2="10" y2="20.5" />
    <path d="M 14 11 Q 16 6, 18 11 T 22 11" stroke-width="2.2" />
    <path d="M 14 15 Q 16 13, 18 15 T 22 15" stroke-width="1.8" opacity="0.75" />
    <path d="M 14 7 Q 16 9, 18 7 T 22 7" stroke-width="1.8" opacity="0.75" />
  </g>
</svg>"""

# 4. OPTION 4: Stereo Omni Pulse (Symmetric Dual-Side Voice Waves)
svg_opt4 = """<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="102.4" fill="#f97316"/>
  <g transform="translate(64, 64) scale(16)" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <rect x="9" y="3" width="6" height="10" rx="3" />
    <path d="M 6.5 10 a 5.5 5.5 0 0 0 11 0" />
    <line x1="12" y1="15.5" x2="12" y2="20.5" />
    <line x1="9" y1="20.5" x2="15" y2="20.5" />
    <path d="M 4 8 a 4.5 4.5 0 0 0 0 6" />
    <path d="M 1.5 5.5 a 8 8 0 0 0 0 11" />
    <path d="M 20 8 a 4.5 4.5 0 0 1 0 6" />
    <path d="M 22.5 5.5 a 8 8 0 0 1 0 11" />
  </g>
</svg>"""

# 5. OPTION 5: Bold Solid Pro (Filled Capsule with Dual Accent Waves)
svg_opt5 = """<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="102.4" fill="#f97316"/>
  <g transform="translate(64, 64) scale(16)">
    <rect x="4.5" y="2.5" width="6" height="10" rx="3" fill="white" />
    <line x1="6.5" y1="5.5" x2="8.5" y2="5.5" stroke="#f97316" stroke-width="1" stroke-linecap="round" />
    <line x1="6.5" y1="7.5" x2="8.5" y2="7.5" stroke="#f97316" stroke-width="1" stroke-linecap="round" />
    <path d="M 1.5 9.5 a 6 6 0 0 0 12 0" stroke="white" stroke-width="2" stroke-linecap="round" fill="none" />
    <line x1="7.5" y1="15.5" x2="7.5" y2="20.5" stroke="white" stroke-width="2" stroke-linecap="round" />
    <line x1="4.5" y1="20.5" x2="10.5" y2="20.5" stroke="white" stroke-width="2" stroke-linecap="round" />
    <path d="M 15.5 7.5 a 5 5 0 0 1 0 7" stroke="white" stroke-width="2.2" stroke-linecap="round" fill="none" />
    <path d="M 19 4.5 a 9.5 9.5 0 0 1 0 13" stroke="white" stroke-width="2.2" stroke-linecap="round" fill="none" />
  </g>
</svg>"""

options = [
    ("opt1", svg_opt1),
    ("opt2", svg_opt2),
    ("opt3", svg_opt3),
    ("opt4", svg_opt4),
    ("opt5", svg_opt5),
]

for name, content in options:
    with open(f"public/icon-options/{name}.svg", "w") as f:
        f.write(content)

# Render PNGs using PIL with 4x supersampling
def render_canvas():
    scale = 4
    canvas_size = 512 * scale
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = int(canvas_size * 0.2)
    draw.rounded_rectangle([0, 0, canvas_size - 1, canvas_size - 1], radius=radius, fill="#f97316")
    return img, draw, scale

# Option 1 PNG
img1, draw1, s = render_canvas()
sw = int(2 * 16 * s * 0.9)
tx = lambda x, ox=64: int((ox + x * 16) * s)
ty = lambda y, oy=64: int((oy + y * 16) * s)
draw1.rounded_rectangle([tx(4.5), ty(2.5), tx(10.5), ty(12.5)], radius=int(3*16*s), outline="white", width=sw)
draw1.arc([tx(1.5), ty(3.5), tx(13.5), ty(15.5)], start=0, end=180, fill="white", width=sw)
draw1.line([(tx(7.5), ty(15.5)), (tx(7.5), ty(20.5))], fill="white", width=sw)
draw1.line([(tx(4.5), ty(20.5)), (tx(10.5), ty(20.5))], fill="white", width=sw)
draw1.arc([tx(10.5), ty(6.5), tx(19.5), ty(15.5)], start=-65, end=65, fill="white", width=sw)
draw1.arc([tx(8), ty(3.5), tx(24), ty(19.5)], start=-65, end=65, fill="white", width=sw)
draw1.arc([tx(5.5), ty(0.5), tx(28.5), ty(23.5)], start=-65, end=65, fill="white", width=sw)
img1.resize((512, 512), Image.Resampling.LANCZOS).save("public/icon-options/opt1.png")

# Option 2 PNG (Equalizer)
img2, draw2, s = render_canvas()
draw2.rounded_rectangle([tx(3), ty(3), tx(8.5), ty(12.5)], radius=int(2.75*16*s), outline="white", width=sw)
draw2.arc([tx(0.5), ty(4.25), tx(11), ty(14.75)], start=0, end=180, fill="white", width=sw)
draw2.line([(tx(5.75), ty(14.75)), (tx(5.75), ty(20))], fill="white", width=sw)
draw2.line([(tx(3), ty(20)), (tx(8.5), ty(20))], fill="white", width=sw)
bars = [(13, 9, 13), (15.5, 6, 16), (18, 3.5, 18.5), (20.5, 6.5, 15.5), (23, 9.5, 12.5)]
for bx, by1, by2 in bars:
    draw2.line([(tx(bx), ty(by1)), (tx(bx), ty(by2))], fill="white", width=sw)
img2.resize((512, 512), Image.Resampling.LANCZOS).save("public/icon-options/opt2.png")

# Option 3 PNG (Fluid Sine Wave)
img3, draw3, s = render_canvas()
draw3.rounded_rectangle([tx(4), ty(2.5), tx(10), ty(12.5)], radius=int(3*16*s), outline="white", width=sw)
draw3.arc([tx(1.5), ty(4), tx(12.5), ty(15)], start=0, end=180, fill="white", width=sw)
draw3.line([(tx(7), ty(15)), (tx(7), ty(20.5))], fill="white", width=sw)
draw3.line([(tx(4), ty(20.5)), (tx(10), ty(20.5))], fill="white", width=sw)
# Sine wave arcs
draw3.arc([tx(12), ty(6), tx(18), ty(16)], start=-90, end=90, fill="white", width=sw)
draw3.arc([tx(16), ty(6), tx(22), ty(16)], start=90, end=270, fill="white", width=sw)
draw3.arc([tx(13), ty(2.5), tx(19), ty(11.5)], start=-90, end=90, fill="white", width=int(sw*0.75))
draw3.arc([tx(17), ty(2.5), tx(23), ty(11.5)], start=90, end=270, fill="white", width=int(sw*0.75))
draw3.arc([tx(13), ty(10.5), tx(19), ty(19.5)], start=-90, end=90, fill="white", width=int(sw*0.75))
draw3.arc([tx(17), ty(10.5), tx(23), ty(19.5)], start=90, end=270, fill="white", width=int(sw*0.75))
img3.resize((512, 512), Image.Resampling.LANCZOS).save("public/icon-options/opt3.png")

# Option 4 PNG (Stereo Omni Pulse)
img4, draw4, s = render_canvas()
draw4.rounded_rectangle([tx(9), ty(3), tx(15), ty(13)], radius=int(3*16*s), outline="white", width=sw)
draw4.arc([tx(6.5), ty(4.5), tx(17.5), ty(15.5)], start=0, end=180, fill="white", width=sw)
draw4.line([(tx(12), ty(15.5)), (tx(12), ty(20.5))], fill="white", width=sw)
draw4.line([(tx(9), ty(20.5)), (tx(15), ty(20.5))], fill="white", width=sw)
# Left waves
draw4.arc([tx(1), ty(6.5), tx(7), ty(15.5)], start=115, end=245, fill="white", width=sw)
draw4.arc([tx(-2), ty(4), tx(6), ty(18)], start=115, end=245, fill="white", width=sw)
# Right waves
draw4.arc([tx(17), ty(6.5), tx(23), ty(15.5)], start=-65, end=65, fill="white", width=sw)
draw4.arc([tx(18), ty(4), tx(26), ty(18)], start=-65, end=65, fill="white", width=sw)
img4.resize((512, 512), Image.Resampling.LANCZOS).save("public/icon-options/opt4.png")

# Option 5 PNG (Solid Pro)
img5, draw5, s = render_canvas()
draw5.rounded_rectangle([tx(4.5), ty(2.5), tx(10.5), ty(12.5)], radius=int(3*16*s), fill="white")
# orange slits
draw5.line([(tx(6.5), ty(5.5)), (tx(8.5), ty(5.5))], fill="#f97316", width=int(sw*0.5))
draw5.line([(tx(6.5), ty(7.5)), (tx(8.5), ty(7.5))], fill="#f97316", width=int(sw*0.5))
draw5.arc([tx(1.5), ty(3.5), tx(13.5), ty(15.5)], start=0, end=180, fill="white", width=sw)
draw5.line([(tx(7.5), ty(15.5)), (tx(7.5), ty(20.5))], fill="white", width=sw)
draw5.line([(tx(4.5), ty(20.5)), (tx(10.5), ty(20.5))], fill="white", width=sw)
draw5.arc([tx(10.5), ty(6.5), tx(19.5), ty(15.5)], start=-65, end=65, fill="white", width=int(sw*1.1))
draw5.arc([tx(8), ty(3.5), tx(24), ty(19.5)], start=-65, end=65, fill="white", width=int(sw*1.1))
img5.resize((512, 512), Image.Resampling.LANCZOS).save("public/icon-options/opt5.png")

print("Generated all 5 SVGs and PNG previews!")
