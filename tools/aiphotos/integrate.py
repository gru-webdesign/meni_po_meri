# Iseca AI fotografije (1024x768) na 720x540 za aplikaciju i pise credits.js
import sys, os, glob, json, re
from PIL import Image
src = sys.argv[1]; dst = 'www/img/meals'
ids = []
for f in sorted(glob.glob(os.path.join(src, '*.jpg'))):
    i = os.path.basename(f).split('_')[0]
    im = Image.open(f).convert('RGB')
    w, h = 880, 660; cx, cy = 512, 410          # malo bliže, jelo je obično u donjoj sredini
    box = (cx - w//2, min(768 - h, cy - h//2), cx + w//2, min(768, cy - h//2 + h))
    im.crop(box).resize((720, 540), Image.LANCZOS).save(f'{dst}/{i}.jpg', quality=82, optimize=True, progressive=True)
    ids.append(i)
p = f'{dst}/credits.js'
old = json.loads(re.search(r'=(\{.*\})', open(p).read(), re.S).group(1))
for i in ids: old[i] = {'ai': 1}
open(p, 'w').write('const MEAL_CREDITS=' + json.dumps(old, ensure_ascii=False) + ';\n')
print(len(ids), 'slika;', sum(1 for v in old.values() if not v.get('ai')), 'preuzetih ostaje')
