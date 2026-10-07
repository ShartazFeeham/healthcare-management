import sys, glob
from PIL import Image
src, out, ms = sys.argv[1], sys.argv[2], float(sys.argv[3])
frames = [Image.open(f).convert("RGB") for f in sorted(glob.glob(src + "/*.png"))]
pal = [f.quantize(colors=96, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE) for f in frames]
pal[0].save(out, save_all=True, append_images=pal[1:], duration=int(ms), loop=0, optimize=True, disposal=1)
