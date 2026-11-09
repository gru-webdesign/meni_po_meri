import json,os,sys,time,urllib.parse,urllib.request,io
from PIL import Image,ImageDraw,ImageFont,ImageOps
UA={'User-Agent':'MeniPoMeri/1.0 (github.com/gru-webdesign/meni_po_meri)'}
def get(url,binary=False):
    r=urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=30);d=r.read();return d if binary else json.loads(d)
def openverse(q):
    u='https://api.openverse.org/v1/images/?'+urllib.parse.urlencode({'q':q,'license':'cc0,pdm,by,by-sa','category':'photograph','page_size':10,'mature':'false'})
    try:return [{'src':'ov','id':x['id'],'thumb':x.get('thumbnail'),'url':x['url'],'title':x.get('title'),'creator':x.get('creator'),'license':x['license'],'lv':x.get('license_version'),'page':x.get('foreign_landing_url'),'w':x.get('width'),'h':x.get('height')} for x in get(u).get('results',[])]
    except Exception as e:print('ov err',q,e);return []
def commons(q):
    u='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode({'action':'query','format':'json','generator':'search','gsrsearch':q+' filetype:bitmap','gsrnamespace':6,'gsrlimit':8,'prop':'imageinfo','iiprop':'url|extmetadata|size','iiurlwidth':900})
    out=[]
    try:
        for p in (get(u).get('query',{}).get('pages',{}) or {}).values():
            ii=p['imageinfo'][0];m=ii.get('extmetadata',{});lic=(m.get('LicenseShortName',{}).get('value','')).lower()
            if not any(k in lic for k in ['cc0','public domain','cc by']) or 'nc' in lic or 'nd' in lic:continue
            out.append({'src':'wm','id':str(p['pageid']),'thumb':ii.get('thumburl'),'url':ii.get('thumburl') or ii['url'],'title':p['title'],'creator':m.get('Artist',{}).get('value',''),'license':lic,'lv':'','page':ii.get('descriptionurl'),'w':ii.get('width'),'h':ii.get('height')})
    except Exception as e:print('wm err',q,e)
    return out
mode=sys.argv[1];Q=json.load(open('tools/photos/queries.json'));os.makedirs('out',exist_ok=True)
if mode=='candidates':
    cand={}
    for mid,qs in Q.items():
        res=[];seen=set()
        for q in qs:
            for r in openverse(q)+commons(q):
                if r['url'] in seen:continue
                seen.add(r['url']);res.append(r)
            time.sleep(2)
        cand[mid]=res[:12];print(mid,len(cand[mid]))
    json.dump(cand,open('out/candidates.json','w'),indent=1)
    font=ImageFont.load_default()
    ids=list(Q.keys());TW,TH=200,150
    for s in range(0,len(ids),8):
        sheet=Image.new('RGB',(90+12*(TW+6),8*(TH+24)),'white');dr=ImageDraw.Draw(sheet)
        for row,mid in enumerate(ids[s:s+8]):
            y=row*(TH+24);dr.text((4,y+60),mid,fill='black',font=font)
            for j,r in enumerate(cand[mid]):
                try:
                    im=Image.open(io.BytesIO(get(r['thumb'] or r['url'],True))).convert('RGB');im=ImageOps.fit(im,(TW,TH));sheet.paste(im,(90+j*(TW+6),y))
                except Exception as e:print('thumb err',mid,j,e)
                dr.text((90+j*(TW+6)+3,y+TH+4),f"{j} {r['src']} {r['license']}",fill='black',font=font)
        sheet.save(f'out/sheet_{s//8:02d}.jpg',quality=80)
elif mode=='final':
    cand=json.load(open('tools/photos/candidates.json'));picks=json.load(open('tools/photos/picks.json'));os.makedirs('out/meals',exist_ok=True);credits={}
    for mid,j in picks.items():
        r=cand[mid][j]
        try:
            im=Image.open(io.BytesIO(get(r['url'],True))).convert('RGB');im=ImageOps.fit(im,(720,540),centering=(0.5,0.5));im.save(f'out/meals/{mid}.jpg',quality=76,optimize=True,progressive=True)
            credits[mid]={k:r.get(k) for k in ['title','creator','license','lv','page','src']}
        except Exception as e:print('final err',mid,e)
    json.dump(credits,open('out/meals/credits.json','w'),ensure_ascii=False,indent=1)
