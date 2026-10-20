"""Deterministic extraction/normalization of ImageGen structural theme atlases."""
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects, binary_dilation

ROOT = Path(__file__).resolve().parents[2]
GROUPS = {"group-a1": ["fire", "ice", "lightning"],
          "group-a2": ["mire", "scarab", "leviathan"],
          "group-a3": ["colossus", "prism"]}


def extract(raw, count):
    pixels = np.asarray(raw).copy()
    regions, _ = label(pixels[:, :, 3] > 128)
    counts = np.bincount(regions.ravel())
    counts[0] = 0
    ids = np.argsort(counts)[-count:]
    slices = find_objects(regions)
    entries = []
    for idx in ids:
        sl = slices[idx - 1]
        keep = binary_dilation(regions == idx, iterations=2)
        data = pixels.copy()
        data[~keep] = 0
        im = Image.fromarray(data)
        box = im.getbbox()
        entries.append((box, im.crop(box)))
    # Atlas bands are identified by stem center Y; objects share band centers.
    stems = sorted([e for e in entries if e[0][0] < raw.width * .2
                    and e[1].height > e[1].width * 1.4], key=lambda e: e[0][1])
    assert len(stems) == count // 3, [(e[0], e[1].size) for e in entries]
    groups = []
    for stem in stems:
        cy = (stem[0][1] + stem[0][3]) / 2
        remaining = [e for e in entries if e not in stems]
        nearest = sorted(remaining, key=lambda e: abs((e[0][1] + e[0][3]) / 2 - cy))[:2]
        groups.append([stem] + sorted(nearest, key=lambda e: e[0][0]))
    return groups


def bounds(im, y):
    xs = np.flatnonzero(np.asarray(im)[y, :, 3] > 128)
    return int(xs[0]), int(xs[-1] + 1)


def normalize_stem(im):
    # Remove generated end-cap faces, then register two substantial strands.
    im = im.crop((0, 6, im.width, im.height - 6))
    scaled = im.resize((160, 512), Image.Resampling.LANCZOS)
    base = Image.new("RGBA", (384, 512))
    base.paste(scaled, (112, 0))
    registered = Image.new("RGBA", base.size)
    for y in range(512):
        row = base.crop((0, y, 384, y + 1))
        d = min(y, 511 - y)
        if d < 64:
            left, right = bounds(base, y)
            center = (left + right) / 2
            t = max(0, min(1, (64 - d) / 32))
            weight = t*t*(3-2*t)
            scale = 1 + weight * (114 / (right-left) - 1)
            shift = center + weight*(192-center) - scale*center
            row = row.transform((384, 1), Image.Transform.AFFINE,
                                (1/scale, 0, -shift/scale, 0, 1, 0),
                                Image.Resampling.BICUBIC)
        registered.paste(row, (0, y))
    arr = np.asarray(registered).astype(float).copy()
    # Premultiplied crossfade from generated lower rows toward upper continuation.
    for i in range(32):
        t = i / 31
        t = t*t*(3-2*t)
        upper, lower = arr[i].copy(), arr[480+i].copy()
        aa, ab = upper[:, 3:4]/255, lower[:, 3:4]/255
        alpha = t*aa + (1-t)*ab
        rgb = t*upper[:, :3]*aa + (1-t)*lower[:, :3]*ab
        arr[480+i, :, :3] = np.divide(rgb, alpha, out=np.zeros_like(rgb), where=alpha>0)
        arr[480+i, :, 3:4] = alpha*255
    out = Image.fromarray(np.rint(arr).astype("uint8"))
    out = out.crop((0, 31, 384, 512)).resize((384, 512), Image.Resampling.LANCZOS)
    # Exact repeat boundary: row 511 is the same generated seam as row zero.
    data = np.asarray(out).copy()
    data[-1] = data[0]
    return Image.fromarray(data)


def socket_y(im, x):
    a = np.asarray(im)[:, max(0, x-2):min(im.width, x+3), 3]
    ys = np.flatnonzero(a.max(axis=1) > 128)
    return int(round((ys[0]+ys[-1])/2))


def normalize_leaf(im):
    out = Image.new("RGBA", (512, 320))
    out.paste(im.resize((500, 188), Image.Resampling.LANCZOS), (6, 62))
    return out


def normalize_branch(im):
    out = Image.new("RGBA", (256, 96))
    out.paste(im.resize((240, 64), Image.Resampling.LANCZOS), (8, 16))
    return out


def main(group):
    rawdir = ROOT / "raw" / group
    raw = Image.open(rawdir / "raw-sheet.png").convert("RGBA")
    themes = GROUPS[group]
    groups = extract(raw, len(themes)*3)
    catalog_path = ROOT / "art-catalog-a.json"
    catalog = json.loads(catalog_path.read_text()) if catalog_path.exists() else {
        "schema": "gemwoven.beanstalk-theme-art.v1",
        "generation": {"tool": "built-in image_gen", "artAgentModel": "gpt-6-astra",
                       "artAgentReasoning": "high", "rawPreserved": True},
        "themes": {}, "items": {}}
    extraction = []
    for theme, parts in zip(themes, groups):
        dest = ROOT / theme
        dest.mkdir(exist_ok=True)
        catalog["themes"][theme] = {}
        for name, (source_box, source), normalizer in zip(
                ("stem", "leaf", "branch"), parts,
                (normalize_stem, normalize_leaf, normalize_branch)):
            if theme == "colossus":
                # This material has no violet pigment. Remove residual key fringe
                # without applying that rule to the legitimately violet prism art.
                data = np.asarray(source).copy()
                rgb = data[:, :, :3].astype(float)
                key_spill = ((rgb[:, :, 0] > rgb[:, :, 1] * 1.45 + 10)
                             & (rgb[:, :, 2] > rgb[:, :, 1] * 1.25 + 10))
                data[key_spill] = 0
                source = Image.fromarray(data)
            source.save(rawdir / f"{theme}-{name}-extracted.png")
            im = normalizer(source)
            im.save(dest / f"{name}.png")
            im.save(dest / f"{name}.webp", lossless=True, method=6)
            key = f"bean-{theme}-{name}"
            item = {"file": f"beanstalk/themes/{theme}/{name}.webp",
                    "png": f"beanstalk/themes/{theme}/{name}.png",
                    "width": im.width, "height": im.height,
                    "size": list(im.size), "raw": f"beanstalk/themes/raw/{group}/raw-sheet.png",
                    "prompt": f"beanstalk/themes/raw/{group}/prompt-used.txt",
                    "renderLayer": "behind-actors"}
            if group == "group-a3":
                item.update(raw=f"beanstalk/themes/raw/{group}/raw-sheet-magenta.png",
                            cleanedSource=f"beanstalk/themes/raw/{group}/raw-sheet.png",
                            cleanupPrompt=f"beanstalk/themes/raw/{group}/magenta-clean.prompt.txt",
                            postprocess="Hard magenta key tolerance30; 1px edge contraction; component extraction; Lanczos normalization. Hard key preserves genuine violet crystal facets.",
                            rejectedRaw=f"beanstalk/themes/raw/{group}/raw-sheet-rejected-glow.png")
            if name == "stem":
                item.update(sockets={"start": [192, 0], "end": [192, 512]},
                            repeat={"axis": "vertical", "overlapSourcePixels": 1},
                            endpointOpaqueWidths=[bounds(im, y)[1]-bounds(im, y)[0] for y in (0, 511)])
            elif name == "leaf":
                item.update(floorAnchor=[256, 142],
                            sockets={"attach": [14, socket_y(im, 14)]},
                            actorSafeArea={"shape": "ellipse", "center": [256, 142], "radii": [110, 35]},
                            occlusionClass="low", occupantPolicy="none",
                            defaultDirection="petiole-left, leaf-tip-right")
            else:
                item.update(sockets={"start": [23, socket_y(im, 23)], "end": [242, socket_y(im, 242)]})
            catalog["themes"][theme][name] = key
            catalog["items"][key] = item
            extraction.append({"theme": theme, "part": name, "sourceBox": source_box,
                               "size": list(im.size), "alphaBounds": im.getbbox(),
                               "alphaRange": im.getchannel("A").getextrema(),
                               "sockets": item["sockets"]})
    catalog_path.write_text(json.dumps(catalog, indent=2)+"\n")
    (rawdir/"extraction.json").write_text(json.dumps(extraction, indent=2)+"\n")
    print(json.dumps(extraction, indent=2))


if __name__ == "__main__":
    main(sys.argv[1])
