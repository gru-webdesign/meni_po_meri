# Generise fotografije jela lokalno modelom SDXL base 1.0 (CreativeML Open RAIL++-M, dozvoljena komercijalna upotreba).
import json, sys, os, torch
from diffusers import StableDiffusionXLPipeline, DPMSolverMultistepScheduler
shard, nsh = int(sys.argv[1]), int(sys.argv[2])
only = sys.argv[3].split(',') if len(sys.argv) > 3 and sys.argv[3] else None
seeds = [int(s) for s in os.environ.get('SEEDS', '11,23').split(',')]
steps = int(os.environ.get('STEPS', '28'))
d = json.load(open('tools/aiphotos/dishes.json'))
extra = json.load(open('tools/aiphotos/extra.json')) if os.path.exists('tools/aiphotos/extra.json') else {}
ids = only or list(d)
ids = [i for k, i in enumerate(ids) if k % nsh == shard]
STYLE = ("professional editorial food photography, {dish}, served on a matte off-white ceramic plate on a light natural linen tablecloth "
         "and pale oak table, soft diffused daylight from a window, gentle shadows, 45 degree angle, shallow depth of field, "
         "natural realistic colors, fresh and appetizing, homemade, high detail, sharp focus, magazine quality")
NEG = ("text, letters, watermark, logo, signature, hands, people, fork in food, cartoon, illustration, painting, 3d render, cgi, "
       "plastic, oversaturated, neon, blurry, lowres, deformed, duplicate plate, messy, burnt, dark, harsh flash, frame, border")
torch.set_num_threads(os.cpu_count())
pipe = StableDiffusionXLPipeline.from_pretrained('stabilityai/stable-diffusion-xl-base-1.0', torch_dtype=torch.float32, use_safetensors=True)
pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config, use_karras_sigmas=True)
pipe.set_progress_bar_config(disable=True)
os.makedirs('out', exist_ok=True)
for i in ids:
    p = STYLE.format(dish=extra.get(i, d[i]))
    for s in seeds:
        img = pipe(p, negative_prompt=NEG, width=1024, height=768, num_inference_steps=steps, guidance_scale=6.5,
                   generator=torch.Generator().manual_seed(s)).images[0]
        img.save(f'out/{i}_{s}.jpg', quality=92)
        print(i, s, flush=True)
