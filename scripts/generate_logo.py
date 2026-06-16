#!/usr/bin/env python3
"""
NexusViewer logo generator.

Produces a geometric, developer-friendly mark: three connected nodes
forming a triangular network. The center node is larger and slightly
inset, suggesting both 'nexus' (link) and 'viewer' (focus).

Outputs:
  - src/assets/logo.svg      (used as the in-app header mark and favicon)
  - build/icon.png           (master 512x512, used for .ico and build assets)
  - build/icon.ico           (multi-resolution Windows icon)
"""

from __future__ import annotations

import math
import os
import struct
import zlib
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SVG_OUT = ROOT / "src" / "assets" / "logo.svg"
PNG_OUT = ROOT / "build" / "icon.png"
ICO_OUT = ROOT / "build" / "icon.ico"

ACCENT = "#00f2ff"
ACCENT_DEEP = "#0b0f19"
GLOW = "#7dd3fc"


def build_canvas(size: int = 512) -> Image.Image:
    """Render the logo onto a transparent RGBA canvas at the given size."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    cx = cy = size / 2
    radius = size * 0.42
    node_radius = size * 0.085
    center_radius = size * 0.13

    # Three outer nodes, equally spaced at 12, 4, and 8 o'clock
    angles = [-math.pi / 2, math.pi / 6, 5 * math.pi / 6]
    nodes = []
    for angle in angles:
        x = cx + radius * math.cos(angle)
        y = cy + radius * math.sin(angle)
        nodes.append((x, y))

    # Connecting lines (drawn first so nodes overlap them)
    line_width = max(2, int(size * 0.022))
    for i in range(3):
        a = nodes[i]
        b = nodes[(i + 1) % 3]
        draw.line([a, b], fill=ACCENT, width=line_width)

    # Soft outer-glow halo behind the center
    halo = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    halo_draw = ImageDraw.Draw(halo)
    halo_r = size * 0.28
    halo_draw.ellipse(
        (cx - halo_r, cy - halo_r, cx + halo_r, cy + halo_r),
        fill=(125, 211, 252, 110),
    )
    halo = halo.filter(ImageFilter.GaussianBlur(radius=size * 0.04))
    canvas.alpha_composite(halo)

    # Outer nodes (solid discs with a faint inner ring)
    for (x, y) in nodes:
        draw.ellipse(
            (x - node_radius, y - node_radius, x + node_radius, y + node_radius),
            fill=ACCENT,
        )
        inner_r = node_radius * 0.45
        draw.ellipse(
            (x - inner_r, y - inner_r, x + inner_r, y + inner_r),
            fill=ACCENT_DEEP,
        )

    # Center node (larger, hollow ring)
    ring_width = max(2, int(size * 0.03))
    draw.ellipse(
        (cx - center_radius, cy - center_radius, cx + center_radius, cy + center_radius),
        outline=ACCENT,
        width=ring_width,
    )
    dot_r = size * 0.045
    draw.ellipse(
        (cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r),
        fill=ACCENT,
    )

    return canvas


def write_svg(path: Path) -> None:
    """Write a clean, hand-built SVG variant for use in the header/favicon."""
    size = 64
    cx = cy = size / 2
    radius = size * 0.42
    node_radius = size * 0.085
    center_radius = size * 0.13

    angles = [-90, 30, 150]
    nodes = [
        (cx + radius * math.cos(math.radians(a)), cy + radius * math.sin(math.radians(a)))
        for a in angles
    ]

    lines = "\n    ".join(
        f'<line x1="{nodes[i][0]:.3f}" y1="{nodes[i][1]:.3f}" '
        f'x2="{nodes[(i + 1) % 3][0]:.3f}" y2="{nodes[(i + 1) % 3][1]:.3f}" '
        f'stroke="{ACCENT}" stroke-width="1.5" stroke-linecap="round" />'
        for i in range(3)
    )

    outer_dots = "\n    ".join(
        f'<circle cx="{x:.3f}" cy="{y:.3f}" r="{node_radius:.3f}" fill="{ACCENT}" />'
        f'<circle cx="{x:.3f}" cy="{y:.3f}" r="{node_radius * 0.45:.3f}" fill="{ACCENT_DEEP}" />'
        for (x, y) in nodes
    )

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}" role="img" aria-label="NexusViewer">
  <title>NexusViewer</title>
  {lines}
  {outer_dots}
  <circle cx="{cx:.3f}" cy="{cy:.3f}" r="{center_radius:.3f}" fill="none" stroke="{ACCENT}" stroke-width="1.5" />
  <circle cx="{cx:.3f}" cy="{cy:.3f}" r="2.5" fill="{ACCENT}" />
</svg>
"""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(svg, encoding="utf-8")


def write_ico(path: Path, base: Image.Image) -> None:
    """Encode `base` as a multi-resolution .ico (256, 128, 64, 32, 16)."""
    sizes = [256, 128, 64, 32, 16]
    images: list[tuple[Image.Image, int]] = []
    for s in sizes:
        img = base.resize((s, s), Image.LANCZOS)
        images.append((img, s))

    # Hand-roll an .ico: a 6-byte header + one 16-byte ICONDIRENTRY per image,
    # then the PNG payload for each (Vista+ supports PNG-in-ICO).
    header = struct.pack("<HHH", 0, 1, len(images))
    offset = 6 + 16 * len(images)
    entries = b""
    payloads = b""
    for img, s in images:
        png_bytes = _png_bytes(img)
        entries += struct.pack(
            "<BBBBHHII",
            s if s < 256 else 0,
            s if s < 256 else 0,
            0,
            0,
            1,
            32,
            len(png_bytes),
            offset,
        )
        payloads += png_bytes
        offset += len(png_bytes)

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(header + entries + payloads)


def _png_bytes(img: Image.Image) -> bytes:
    """Serialize an RGBA PIL image to PNG bytes (no on-disk write)."""
    import io

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def main() -> None:
    PNG_OUT.parent.mkdir(parents=True, exist_ok=True)
    ICO_OUT.parent.mkdir(parents=True, exist_ok=True)

    master = build_canvas(512)
    master.save(PNG_OUT, format="PNG")
    write_ico(ICO_OUT, master)
    write_svg(SVG_OUT)

    print(f"wrote {SVG_OUT.relative_to(ROOT)}")
    print(f"wrote {PNG_OUT.relative_to(ROOT)}")
    print(f"wrote {ICO_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
