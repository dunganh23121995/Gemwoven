"""Extract original generated themed atlas pixels and normalize runtime sockets."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects, binary_dilation

ROOT = Path(__file__).resolve().parent
GROUPS = {
    "group-b1": ["reaper", "roc", "briar"],
    "group-b2": ["seraph", "eclipse", "elderbloom"],
    "group-b3": ["cinderheart", "frostregent"],
}


def extract(path, rows):
    image = Image.open(path).convert("RGBA")
    pixels = np.asarray(image).copy()
    regions, _ = label(pixels[:, :, 3] > 64)
    counts = np.bincount(regions.ravel())
    ids = sorted(range(1, len(counts)), key=lambda i: counts[i], reverse=True)[:rows * 3]
    slices = find_objects(regions)
    ids.sort(key=lambda i: (
        int(((slices[i-1][0].start+slices[i-1][0].stop)/2)/image.height*rows),
        slices[i-1][1].start
    ))
    output = []
    for region_id in ids:
        selected = binary_dilation(regions == region_id, iterations=2)
        part = pixels.copy()
        part[~selected] = 0
        # Clear hidden RGB, preserving the generated alpha and edge colors.
        part[part[:, :, 3] == 0] = 0
        subject = Image.fromarray(part)
        bbox = subject.getbbox()
        output.append((subject.crop(bbox), list(bbox)))
    return output


def row_bounds(image, y):
    xs = np.where(np.asarray(image)[y, :, 3] > 128)[0]
    return int(xs[0]), int(xs[-1] + 1)


def stem_export(source):
    # Remove the generated cut-cap faces; the two strands then continue across tiles.
    cap = max(10, round(source.height * .045))
    source = source.crop((0, cap, source.width, source.height-cap))
    widths = [row_bounds(source, y)[1]-row_bounds(source, y)[0]
              for y in range(source.height//4, source.height*3//4)]
    resized = source.resize((round(source.width*114/np.median(widths)), 512), Image.Resampling.LANCZOS)
    base = Image.new("RGBA", (384, 512))
    base.paste(resized, ((384-resized.width)//2, 0))
    registered = Image.new("RGBA", base.size)
    for y in range(512):
        distance = min(y, 511-y)
        row = base.crop((0, y, 384, y+1))
        if distance < 64:
            t = max(0, min(1, (64-distance)/32))
            weight = t*t*(3-2*t)
            left, right = row_bounds(base, y)
            center = (left+right)/2
            scale = 1+weight*(114/(right-left)-1)
            translate = center+weight*(192-center)-scale*center
            row = row.transform((384, 1), Image.Transform.AFFINE,
                                (1/scale, 0, -translate/scale, 0, 1, 0), Image.Resampling.BICUBIC)
        registered.paste(row, (0, y))
    overlap = 32
    top = np.asarray(registered.crop((0, 0, 384, overlap))).astype(float)
    bottom = np.asarray(registered.crop((0, 512-overlap, 384, 512))).astype(float)
    blended = np.zeros_like(top)
    for y in range(overlap):
        t = y/(overlap-1)
        t = t*t*(3-2*t)
        a, b = top[y, :, 3:4]/255, bottom[y, :, 3:4]/255
        alpha = t*a+(1-t)*b
        rgb = t*top[y, :, :3]*a+(1-t)*bottom[y, :, :3]*b
        blended[y, :, :3] = np.divide(rgb, alpha, out=np.zeros_like(rgb), where=alpha > 0)
        blended[y, :, 3:4] = alpha*255
    registered.paste(Image.fromarray(np.rint(blended).astype(np.uint8)), (0, 512-overlap))
    result = registered.crop((0, overlap, 384, 512)).resize((384, 512), Image.Resampling.LANCZOS)
    # Exact same socket pixel row prevents a one-pixel alpha gap at vertical repeats.
    result.paste(result.crop((0, 0, 384, 1)), (0, 511))
    return result, {"sockets": {"start": [192, 0], "end": [192, 512]},
                    "repeat": {"axis": "vertical", "overlapSourcePixels": 1},
                    "endpointOpaqueBounds": [row_bounds(result, y) for y in (0, 511)]}


def leaf_export(source):
    subject = source.resize((492, 190), Image.Resampling.LANCZOS)
    alpha = np.asarray(subject)[:, :, 3]
    ys, xs = np.where(alpha[:, :16] > 128)
    attach_y = int(np.median(ys))
    offset = 162-attach_y
    result = Image.new("RGBA", (512, 320))
    result.paste(subject, (10, offset))
    return result, {"floorAnchor": [256, 142], "sockets": {"attach": [14, 162]},
                    "actorSafeArea": {"shape": "ellipse", "center": [256, 142], "radii": [100, 30]},
                    "occlusionClass": "low", "occupantPolicy": "none",
                    "defaultDirection": "petiole-left, leaf-tip-right"}


def branch_export(source):
    subject = source.resize((240, 64), Image.Resampling.LANCZOS)
    result = Image.new("RGBA", (256, 96))
    result.paste(subject, (8, 16))
    alpha = np.asarray(result)[:, :, 3]
    points = []
    for x in (20, 240):
        ys = np.where(alpha[:, x] > 128)[0]
        points.append([x, int(np.median(ys))])
    return result, {"sockets": {"start": points[0], "end": points[1]}}


catalog = {"schema": "gemwoven.beanstalk-themes.v1", "themes": {}, "items": {},
           "generation": {"tool": "built-in image_gen", "artAgentModel": "gpt-6-astra",
                          "artAgentReasoning": "high", "rawPreserved": True}}
extraction = {}
for group, themes in GROUPS.items():
    parts = extract(ROOT/"raw"/group/"raw.png", len(themes))
    extraction[group] = {}
    for row, theme in enumerate(themes):
        (ROOT/theme).mkdir(parents=True, exist_ok=True)
        catalog["themes"][theme] = {}
        extraction[group][theme] = {}
        for col, (kind, exporter) in enumerate([("stem", stem_export), ("leaf", leaf_export), ("branch", branch_export)]):
            source, bbox = parts[row*3+col]
            result, metadata = exporter(source)
            result.save(ROOT/theme/f"{kind}.png")
            result.save(ROOT/theme/f"{kind}.webp", lossless=True, method=6)
            key = f"bean-{theme}-{kind}"
            catalog["themes"][theme][kind] = key
            catalog["items"][key] = {"file": f"beanstalk/themes/{theme}/{kind}.png",
                                    "width": result.width, "height": result.height,
                                    **metadata}
            extraction[group][theme][kind] = {"sourceCrop": bbox, "sourceSize": list(source.size),
                                             "alphaBounds": result.getbbox(),
                                             "alphaExtrema": result.getchannel("A").getextrema()}
    (ROOT/"art-catalog-b.json").write_text(json.dumps(catalog, indent=2)+"\n", encoding="utf-8")
(ROOT/"raw"/"group-b-extraction.json").write_text(json.dumps(extraction, indent=2)+"\n", encoding="utf-8")
print(f"Exported {len(catalog['themes'])} themes, {len(catalog['items'])} assets")
