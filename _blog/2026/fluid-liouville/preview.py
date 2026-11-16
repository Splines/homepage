"""Renders th social media preview image.

uv pip install numpy matplotlib pillow
uv run _blog/2026/fluid-liouville/preview.py
"""

from pathlib import Path

import matplotlib
import numpy as np

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib import font_manager, patheffects  # noqa: E402
from matplotlib.colors import to_rgb  # noqa: E402
from matplotlib.patches import Polygon  # noqa: E402
from PIL import Image  # noqa: E402

HERE = Path(__file__).resolve().parent

# Fonts
FONTS = HERE.parents[2] / "assets" / "fonts"
for name in ["Vermiglione-SemiBold.otf", "Vermiglione-Medium.otf"]:
    font_manager.fontManager.addfont(str(FONTS / name))

# Palette
PAPER = "#fffdf9"
INK = "#2b231d"
ACCENT = "#88593a"
HIGHLIGHT_COLORS = ["#3c6a87", "#c0573f", "#c98b4f"]
GUIDE = "#ece1d3"
SEPARATRIX = "#dcc8b3"

# (1.91 : 1) ratio recommended for Open Graph images
WIDTH, HEIGHT = 1200, 630
RESOLUTION = 1.5
PALETTE_COLORS = 256  # reduce file size

# Text appearance
WASH_WIDTH = 680
WASH_OPACITY = 0.7
TEXT_LEFT = 112

# Simulation params
SCALE = 108
ORIGIN = (920, HEIGHT / 2)

# Integrator
STEP = 1 / 120
TIME = 26
REGION_CENTER = (1.4, 0.0)
REGION_RADIUS = 0.7
HIGHLIGHTS = [(0.9, 0.0), (1.4, 0.0), (1.9, 0.0)]
COPY_COUNT = 4200


def flow(q: np.ndarray, p: np.ndarray, t: float) -> tuple[np.ndarray, np.ndarray]:
    """Pendulum H = p²/2 − cos q, Strang splitting: kick, drift, kick."""
    q, p = q.copy(), p.copy()
    for _ in range(round(t / STEP)):
        p -= np.sin(q) * STEP / 2
        q += p * STEP
        p -= np.sin(q) * STEP / 2
    return q, p


def on_circle(
    angles: np.ndarray, radius: float | np.ndarray
) -> tuple[np.ndarray, np.ndarray]:
    return (
        REGION_CENTER[0] + radius * np.cos(angles),
        REGION_CENTER[1] + radius * np.sin(angles),
    )


def boundary_at(t: float) -> np.ndarray:
    """Boundary of the region at time t."""
    count = 4000
    while True:
        q, p = flow(
            *on_circle(np.linspace(0, 2 * np.pi, count, endpoint=False), REGION_RADIUS),
            t,
        )
        points = np.column_stack([q, p])
        gaps = np.hypot(*np.diff(np.vstack([points, points[:1]]), axis=0).T)
        if gaps.max() < 0.01:
            return points
        count *= 2


def copies_at(t: float) -> np.ndarray:
    """The highlighted copies first, then copies spread uniformly over the disk."""
    random = np.random.default_rng(5)
    q, p = on_circle(
        2 * np.pi * random.random(COPY_COUNT),
        REGION_RADIUS * np.sqrt(random.random(COPY_COUNT)),
    )
    highlights = np.array(HIGHLIGHTS)
    q, p = flow(
        np.concatenate([highlights[:, 0], q]), np.concatenate([highlights[:, 1], p]), t
    )
    return np.column_stack([q, p])


def main() -> None:
    fig = plt.figure(figsize=(WIDTH / 100, HEIGHT / 100), dpi=100)
    fig.patch.set_facecolor(PAPER)
    ax = fig.add_axes((0, 0, 1, 1))
    x_min, x_max = -ORIGIN[0] / SCALE, (WIDTH - ORIGIN[0]) / SCALE
    y_min, y_max = -ORIGIN[1] / SCALE, (HEIGHT - ORIGIN[1]) / SCALE
    ax.set_xlim(x_min, x_max)
    ax.set_ylim(y_min, y_max)
    ax.set_aspect("equal")
    ax.axis("off")

    # level sets of energy
    q, p = np.meshgrid(np.linspace(x_min, x_max, 1600), np.linspace(y_min, y_max, 900))
    energy = p**2 / 2 - np.cos(q)
    ax.contour(
        q,
        p,
        energy,
        levels=[-0.8, -0.45, -0.05, 0.4, 1.6, 2.5, 3.6],
        colors=GUIDE,
        linewidths=1.3,
        negative_linestyles="solid",
    )

    # cat's eye separatrix
    ax.contour(q, p, energy, levels=[1.0], colors=SEPARATRIX, linewidths=1.6)

    ramp = np.linspace(1, 0, 256)
    wash = np.ones((1, ramp.size, 4))
    wash[..., :3] = to_rgb(PAPER)
    wash[..., 3] = np.clip(1.6 * ramp, 0, 1) ** 1.5 * WASH_OPACITY
    ax.imshow(
        wash,
        extent=(x_min, x_min + WASH_WIDTH / SCALE, y_min, y_max),
        aspect="auto",
        zorder=2.5,
    )

    boundary = boundary_at(TIME)
    fill = 0.86 * np.array(to_rgb(PAPER)) + 0.14 * np.array(to_rgb(ACCENT))
    ax.add_patch(Polygon(boundary, facecolor=fill, edgecolor="none", zorder=3))
    ax.add_patch(
        Polygon(boundary, facecolor="none", edgecolor=ACCENT, linewidth=1.8, zorder=4)
    )
    copies = copies_at(TIME)
    ax.scatter(
        copies[len(HIGHLIGHTS) :, 0],
        copies[len(HIGHLIGHTS) :, 1],
        s=2.2,
        color=INK,
        alpha=0.7,
        linewidths=0,
        zorder=4,
    )
    for (q, p), color in zip(copies[: len(HIGHLIGHTS)], HIGHLIGHT_COLORS):
        ax.scatter([q], [p], s=150, color=PAPER, linewidths=0, zorder=5)
        ax.scatter([q], [p], s=75, color=color, linewidths=0, zorder=6)

    halo = [patheffects.withStroke(linewidth=9, foreground=PAPER)]
    title = dict(
        fontfamily="Vermiglione",
        fontweight="semibold",
        fontsize=36,
        color=INK,
        va="baseline",
        path_effects=halo,
    )
    left = TEXT_LEFT / WIDTH
    fig.text(left, 0.56, "A Fluid Dynamics View", **title)
    fig.text(left, 0.46, "on Liouville’s Theorem", **title)
    fig.text(
        left,
        0.365,
        "splines.me",
        fontfamily="Vermiglione",
        fontweight="medium",
        fontsize=19,
        color=ACCENT,
        va="baseline",
    )

    out = HERE / "preview.png"
    fig.savefig(out, dpi=100 * RESOLUTION, facecolor=PAPER)
    image = Image.open(out).convert("RGB")
    image.quantize(PALETTE_COLORS, method=Image.Quantize.FASTOCTREE).save(
        out, optimize=True
    )
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
