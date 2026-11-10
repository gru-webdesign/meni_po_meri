import os, glob, json
from PIL import Image, ImageDraw
fs = sorted(glob.glob('out/*.jpg'))
os.makedirs('tools/aiphotos/review', exist_ok=True)
by = {}
for f in fs:
    i, s = os.path.basename(f)[:-4].split('_'); by.setdefault(i, []).append(f)
ids = sorted(by, key=lambda x: (x[0], int(x[1:])))
W, H = 384, 288
for n in range(0, len(ids), 8):
    chunk = ids[n:n+8]; cols = max(len(by[i]) for i in chunk)
    sh = Image.new('RGB', (W*cols, (H+22)*len(chunk)), 'white'); dr = ImageDraw.Draw(sh)
    for r, i in enumerate(chunk):
        for c, f in enumerate(sorted(by[i])):
            sh.paste(Image.open(f).resize((W, H)), (c*W, r*(H+22)+22))
            dr.text((c*W+6, r*(H+22)+5), os.path.basename(f)[:-4], fill='black')
    sh.save(f'tools/aiphotos/review/sheet{n//8:02d}.jpg', quality=80)
