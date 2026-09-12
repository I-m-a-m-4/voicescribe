from PIL import Image, ImageDraw

def create_icon(size=512):
    # Scale factor for supersampling (4x for super crisp edges)
    scale = 4
    canvas_size = size * scale
    
    # Create image with transparent background
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 1. Vibrant Orange Rounded Rectangle
    # In user's SVG: rx = 102.4 for 512, which is 20% of size
    radius = int(canvas_size * 0.2)
    draw.rounded_rectangle(
        [0, 0, canvas_size - 1, canvas_size - 1],
        radius=radius,
        fill="#f97316"
    )
    
    # Line width (scale(16) * stroke-width 2 * scale 4 = 128px)
    stroke_w = int(2 * 16 * scale * 0.9)
    
    # Transform: translate(68, 64), scale(16)
    def tx(x):
        return int((68 + x * 16) * scale)
    
    def ty(y):
        return int((64 + y * 16) * scale)
    
    # 2. Microphone Capsule: rect x="5", y="2.5", width="6", height="10", rx="3"
    capsule_box = [tx(5), ty(2.5), tx(11), ty(12.5)]
    capsule_r = int(3 * 16 * scale)
    draw.rounded_rectangle(capsule_box, radius=capsule_r, outline="white", width=stroke_w)
    
    # 3. Microphone Cradle: arc under the capsule
    # arc centered at x=8, y=9.5, radius=6
    cradle_box = [tx(2), ty(3.5), tx(14), ty(15.5)]
    draw.arc(cradle_box, start=0, end=180, fill="white", width=stroke_w)
    
    # 4. Stand Stem & Base Line
    stem_top = (tx(8), ty(15.5))
    stem_bot = (tx(8), ty(20))
    draw.line([stem_top, stem_bot], fill="white", width=stroke_w)
    
    base_left = (tx(5), ty(20))
    base_right = (tx(11), ty(20))
    draw.line([base_left, base_right], fill="white", width=stroke_w)
    
    # 5. Audio Wave 1 (Inner Arc): around x=11, y=11, radius=4.5
    wave1_box = [tx(10.5), ty(6.5), tx(19.5), ty(15.5)]
    draw.arc(wave1_box, start=-65, end=65, fill="white", width=stroke_w)
    
    # 6. Audio Wave 2 (Outer Arc): around x=11, y=11, radius=8
    wave2_box = [tx(7), ty(3), tx(23), ty(19)]
    draw.arc(wave2_box, start=-65, end=65, fill="white", width=stroke_w)
    
    # Downsample with high quality Lanczos anti-aliasing
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

if __name__ == "__main__":
    icon_512 = create_icon(512)
    icon_512.save("public/icon.png")
    icon_512.save("extension/icon.png")
    icon_512.convert("RGB").save("extension/icon.jpg")
    
    icon_128 = create_icon(128)
    icon_128.save("extension/icon-128.png")
    
    icon_48 = create_icon(48)
    icon_48.save("extension/icon-48.png")
    
    icon_16 = create_icon(16)
    icon_16.save("extension/icon-16.png")
    
    print("Successfully generated icons!")
