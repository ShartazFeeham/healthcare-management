# Converts the recorded PNG frames to WebP and removes consecutive duplicates.
# usage: pack.py <frames dir> <out dir> -> writes <out dir>/map.json {original png -> final webp name}
import sys, os, json
from PIL import Image, ImageChops
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
for f in os.listdir(out):
    if f.endswith(".webp"): os.remove(os.path.join(out, f))
mapping, prev, prev_name, prev_chapter = {}, None, None, None
for name in sorted(os.listdir(src)):
    if not name.endswith(".png"): continue
    chapter = name.split("-")[0]
    im = Image.open(os.path.join(src, name)).convert("RGB")
    if chapter == prev_chapter and prev is not None and prev.size == im.size and ImageChops.difference(prev, im).getbbox() is None:
        mapping[name] = prev_name; continue
    final = name.replace(".png", ".webp")
    im.save(os.path.join(out, final), "WEBP", quality=72, method=6)
    mapping[name] = final; prev, prev_name, prev_chapter = im, final, chapter
json.dump(mapping, open(os.path.join(out, "map.json"), "w"))
size = sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out) if f.endswith(".webp"))
print(f"{len(set(mapping.values()))} unique frames of {len(mapping)}, {size/1e6:.1f} MB")
