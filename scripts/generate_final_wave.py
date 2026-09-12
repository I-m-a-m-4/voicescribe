from PIL import Image, ImageDraw

def render_wave_icon(size=512):
    scale = 4
    canvas_size = size * scale
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Orange rounded background
    radius = int(canvas_size * 0.2)
    draw.rounded_rectangle([0, 0, canvas_size - 1, canvas_size - 1], radius=radius, fill="#f97316")
    
    tx = lambda x: int((64 + x * 16) * scale)
    ty = lambda y: int((64 + y * 16) * scale)
    
    sw = int(2.2 * 16 * scale)
    bars = [
        (6, 9, 15),
        (9, 6, 18),
        (12, 3.5, 20.5),
        (15, 6, 18),
        (18, 9, 15),
    ]
        
    for bx, by1, by2 in bars:
        p1 = (tx(bx), ty(by1))
        p2 = (tx(bx), ty(by2))
        draw.line([p1, p2], fill="white", width=sw)
        r = sw // 2
        draw.ellipse([p1[0] - r, p1[1] - r, p1[0] + r, p1[1] + r], fill="white")
        draw.ellipse([p2[0] - r, p2[1] - r, p2[0] + r, p2[1] + r], fill="white")
        
    return img.resize((size, size), Image.Resampling.LANCZOS)

icon_512 = render_wave_icon(512)
icon_512.save("public/icon.png")
icon_512.save("public/logo.png")
icon_512.convert("RGB").save("public/logo.jpg")

icon_512.save("extension/icon.png")
icon_512.convert("RGB").save("extension/icon.jpg")

icon_128 = render_wave_icon(128)
icon_128.save("extension/icon-128.png")

icon_48 = render_wave_icon(48)
icon_48.save("extension/icon-48.png")

icon_16 = render_wave_icon(16)
icon_16.save("extension/icon-16.png")

print("Generated wave icons across all folders and formats!")
