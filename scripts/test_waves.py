from PIL import Image, ImageDraw

def render_wave_icon(bars_count=5, size=512):
    scale = 4
    canvas_size = size * scale
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Orange rounded background
    radius = int(canvas_size * 0.2)
    draw.rounded_rectangle([0, 0, canvas_size - 1, canvas_size - 1], radius=radius, fill="#f97316")
    
    tx = lambda x: int((64 + x * 16) * scale)
    ty = lambda y: int((64 + y * 16) * scale)
    
    if bars_count == 5:
        sw = int(2.4 * 16 * scale)
        bars = [
            (6, 9, 15),
            (9, 6, 18),
            (12, 3.5, 20.5),
            (15, 6, 18),
            (18, 9, 15),
        ]
    else: # 7 bars
        sw = int(1.8 * 16 * scale)
        bars = [
            (4.5, 10, 14),
            (7, 7.5, 16.5),
            (9.5, 5.5, 18.5),
            (12, 3.5, 20.5),
            (14.5, 5.5, 18.5),
            (17, 7.5, 16.5),
            (19.5, 10, 14),
        ]
        
    for bx, by1, by2 in bars:
        p1 = (tx(bx), ty(by1))
        p2 = (tx(bx), ty(by2))
        draw.line([p1, p2], fill="white", width=sw)
        # Rounded caps
        r = sw // 2
        draw.ellipse([p1[0] - r, p1[1] - r, p1[0] + r, p1[1] + r], fill="white")
        draw.ellipse([p2[0] - r, p2[1] - r, p2[0] + r, p2[1] + r], fill="white")
        
    return img.resize((size, size), Image.Resampling.LANCZOS)

# Generate both 5-bar and 7-bar to compare
img5 = render_wave_icon(5, 512)
img5.save("public/wave-5bars.png")

img7 = render_wave_icon(7, 512)
img7.save("public/wave-7bars.png")

print("Rendered wave test icons!")
