"""Generate PWA icons as simple PNG files using only standard library."""
import struct
import zlib
import os

def create_png(width, height, color=(0, 184, 148)):
    """Create a simple solid-color PNG with a letter 'N' pattern."""
    r, g, b = color

    # Create pixel data - solid green background with white "NT" area
    rows = []
    for y in range(height):
        row = []
        for x in range(width):
            # Create a simple "NT" logo shape
            cx, cy = width // 2, height // 2
            # Background
            pr, pg, pb = r, g, b

            # White circle in center (70% of size)
            radius = int(width * 0.35)
            dx = x - cx
            dy = y - cy
            if dx*dx + dy*dy < radius*radius:
                # Inside circle - make lighter
                pr, pg, pb = 255, 255, 255

                # Draw "N" letter
                letter_left = int(width * 0.3)
                letter_right = int(width * 0.7)
                letter_top = int(height * 0.3)
                letter_bottom = int(height * 0.7)
                letter_width = int(width * 0.08)

                in_letter = False
                # Left vertical bar of N
                if letter_left <= x <= letter_left + letter_width and letter_top <= y <= letter_bottom:
                    in_letter = True
                # Right vertical bar of N
                if letter_right - letter_width <= x <= letter_right and letter_top <= y <= letter_bottom:
                    in_letter = True
                # Diagonal of N
                n_height = letter_bottom - letter_top
                n_width = letter_right - letter_left
                if n_height > 0 and letter_top <= y <= letter_bottom:
                    progress = (y - letter_top) / n_height
                    diag_x = letter_left + int(progress * n_width)
                    if abs(x - diag_x) <= letter_width // 2 + 1:
                        in_letter = True

                if in_letter:
                    pr, pg, pb = r, g, b

            row.append(bytes([pr, pg, pb]))
        rows.append(b'\x00' + b''.join(row))  # Filter byte + pixel data

    raw_data = b''.join(rows)
    compressed = zlib.compress(raw_data)

    # Build PNG file
    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)

    png = b'\x89PNG\r\n\x1a\n'
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    png += chunk(b'IHDR', ihdr_data)
    # IDAT
    png += chunk(b'IDAT', compressed)
    # IEND
    png += chunk(b'IEND', b'')

    return png


# Generate icons at different sizes
sizes = [72, 96, 128, 144, 152, 192, 384, 512]
icon_dir = os.path.dirname(os.path.abspath(__file__))

for size in sizes:
    png_data = create_png(size, size)
    filename = os.path.join(icon_dir, f'icon-{size}.png')
    with open(filename, 'wb') as f:
        f.write(png_data)
    print(f'Created icon-{size}.png ({len(png_data)} bytes)')

print('Done! All icons generated.')
