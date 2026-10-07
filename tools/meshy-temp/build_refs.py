from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, os

W=H=2048
BG=(242,241,236)
OUT="refs"
os.makedirs(OUT, exist_ok=True)

SERIF="/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
SANS="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def font(path,size):
    return ImageFont.truetype(path,size)

def text_center(draw, xy, txt, fnt, fill, spacing=0):
    x,y=xy
    if spacing<=0:
        b=draw.textbbox((0,0),txt,font=fnt)
        draw.text((x-(b[2]-b[0])/2,y-(b[3]-b[1])/2),txt,font=fnt,fill=fill)
        return
    widths=[draw.textlength(c,font=fnt) for c in txt]
    total=sum(widths)+spacing*(len(txt)-1)
    cur=x-total/2
    for c,w in zip(txt,widths):
        draw.text((cur,y-fnt.size*0.55),c,font=fnt,fill=fill)
        cur += w+spacing

def metallic_rect(im, box, base=(139,73,42), radius=40):
    x0,y0,x1,y1=map(int,box)
    ww=max(1,x1-x0); hh=max(1,y1-y0)
    layer=Image.new("RGBA",(ww,hh),(0,0,0,0))
    px=layer.load()
    for x in range(ww):
        t=x/max(1,ww-1)
        hi=0.40*math.exp(-((t-.18)/.11)**2)+0.18*math.exp(-((t-.78)/.16)**2)-0.16*math.exp(-((t-.52)/.23)**2)
        for y in range(hh):
            grain=2.0*math.sin(y*.17+x*.013)
            vals=[max(0,min(255,int(c*(1+hi)+grain))) for c in base]
            px[x,y]=(*vals,255)
    mask=Image.new("L",(ww,hh),0); md=ImageDraw.Draw(mask)
    md.rounded_rectangle((0,0,ww-1,hh-1),radius=radius,fill=255)
    layer.putalpha(mask)
    im.alpha_composite(layer,(x0,y0))

def glass_body(im, box, color, radius=80, alpha=245, frost=False):
    x0,y0,x1,y1=map(int,box); ww=x1-x0; hh=y1-y0
    layer=Image.new("RGBA",(ww,hh),(0,0,0,0)); px=layer.load()
    for x in range(ww):
        t=x/max(1,ww-1)
        edge=0.76 + 0.24*(math.sin(math.pi*t)**0.8)
        spec=0.25*math.exp(-((t-.22)/.10)**2)+0.12*math.exp(-((t-.72)/.16)**2)
        for y in range(hh):
            vy=y/max(1,hh-1)
            bottom=0.16*math.exp(-((vy-.93)/.075)**2)
            f=edge+spec+bottom
            if frost: f=0.94+spec*0.45+bottom*0.45
            vals=[max(0,min(255,int(c*f))) for c in color]
            px[x,y]=(*vals,alpha)
    mask=Image.new("L",(ww,hh),0); md=ImageDraw.Draw(mask)
    md.rounded_rectangle((0,0,ww-1,hh-1),radius=radius,fill=255)
    layer.putalpha(Image.eval(mask, lambda p:int(p*alpha/255)))
    im.alpha_composite(layer,(x0,y0))
    d=ImageDraw.Draw(im)
    d.rounded_rectangle((x0,y0,x1,y1),radius=radius,outline=(255,255,255,120),width=5)
    d.arc((x0+25,y1-115,x1-25,y1-15),0,180,fill=(255,255,255,130),width=5)

def shadow(im, box, blur=35, opacity=75):
    x0,y0,x1,y1=box
    sh=Image.new("RGBA",(W,H),(0,0,0,0)); sd=ImageDraw.Draw(sh)
    sd.ellipse((x0,y1-30,x1,y1+45),fill=(0,0,0,opacity))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))

def labels(draw,cx,brand_y,name_y,desc_y,vol_y,name,desc,vol,color,brand_size=70,name_size=74,desc_size=34):
    text_center(draw,(cx,brand_y),"ONYCX",font(SANS,brand_size),color,spacing=10)
    text_center(draw,(cx,name_y),name,font(SERIF,name_size),color,spacing=12)
    text_center(draw,(cx,desc_y),desc,font(SANS,desc_size),color,spacing=5)
    text_center(draw,(cx,vol_y),vol,font(SANS,31),color,spacing=4)

def pump_bottle(filename, body_color, name, desc, vol, text_color, body=(690,470,1358,1765), frost=False):
    im=Image.new("RGBA",(W,H),BG+(255,))
    shadow(im,body)
    glass_body(im,body,body_color,radius=92,alpha=250,frost=frost)
    x0,y0,x1,y1=body
    metallic_rect(im,(805,305,1248,535),(116,64,41),radius=40)
    metallic_rect(im,(885,170,1165,345),(126,70,44),radius=48)
    metallic_rect(im,(620,155,1125,235),(126,70,44),radius=32)
    d=ImageDraw.Draw(im)
    d.polygon([(620,176),(620,236),(820,236),(820,190)],fill=(112,61,39,255))
    labels(d,(x0+x1)//2,840,1150,1230,1600,name,desc,vol,text_color,brand_size=65,name_size=61,desc_size=30)
    im.convert("RGB").save(f"{OUT}/{filename}.jpg",quality=96,subsampling=0)

def jar(filename, body_color, name, desc, vol, text_color, frost=False):
    im=Image.new("RGBA",(W,H),BG+(255,))
    body=(350,850,1698,1535); lid=(430,540,1618,900)
    shadow(im,body)
    glass_body(im,body,body_color,radius=120,alpha=245,frost=frost)
    metallic_rect(im,lid,(137,72,39),radius=55)
    d=ImageDraw.Draw(im)
    d.rounded_rectangle((390,820,1658,930),radius=40,fill=(64,30,18,105))
    labels(d,1024,1040,1195,1300,1430,name,desc,vol,text_color,brand_size=62,name_size=78,desc_size=38)
    im.convert("RGB").save(f"{OUT}/{filename}.jpg",quality=96,subsampling=0)

def slim_bottle(filename, body_color, name, desc, vol, text_color, frost=True):
    im=Image.new("RGBA",(W,H),BG+(255,))
    body=(720,580,1328,1735); cap=(745,210,1303,650)
    shadow(im,body)
    glass_body(im,body,body_color,radius=74,alpha=248,frost=frost)
    metallic_rect(im,cap,(139,77,48),radius=56)
    d=ImageDraw.Draw(im)
    labels(d,1024,880,1195,1270,1570,name,desc,vol,text_color,brand_size=58,name_size=58,desc_size=29)
    d.line((980,1380,1068,1380),fill=text_color,width=3)
    im.convert("RGB").save(f"{OUT}/{filename}.jpg",quality=96,subsampling=0)

def tube(filename):
    im=Image.new("RGBA",(W,H),BG+(255,))
    shadow(im,(660,335,1390,1770))
    layer=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(layer)
    d.polygon([(720,245),(1328,245),(1390,1480),(1290,1590),(758,1590),(658,1480)],fill=(238,220,203,255))
    d.polygon([(725,260),(820,260),(790,1460),(730,1510),(680,1450)],fill=(255,248,239,105))
    # top crimp ribs
    for x in range(730,1318,18):
        d.line((x,248,x,300),fill=(178,147,126,210),width=4)
    im.alpha_composite(layer)
    metallic_rect(im,(690,1535,1358,1840),(118,61,38),radius=50)
    d=ImageDraw.Draw(im)
    text_center(d,(1024,570),"ONYCX",font(SERIF,72),(125,65,40),spacing=10)
    # botanical/lotus mark
    d.arc((968,695,1034,780),200,20,fill=(125,65,40),width=3)
    d.arc((1014,695,1080,780),160,340,fill=(125,65,40),width=3)
    d.arc((988,675,1060,772),55,125,fill=(125,65,40),width=3)
    text_center(d,(1024,900),"SOLENNE",font(SERIF,70),(125,65,40),spacing=10)
    text_center(d,(1024,985),"UV VEIL",font(SERIF,49),(125,65,40),spacing=8)
    text_center(d,(1024,1240),"SPF 50",font(SERIF,47),(125,65,40),spacing=6)
    d.line((980,1315,1068,1315),fill=(125,65,40),width=3)
    text_center(d,(1024,1445),"50 ML",font(SERIF,35),(125,65,40),spacing=4)
    im.convert("RGB").save(f"{OUT}/{filename}.jpg",quality=96,subsampling=0)

def dropper(filename):
    im=Image.new("RGBA",(W,H),BG+(255,))
    body=(465,670,1245,1670)
    shadow(im,body)
    glass_body(im,body,(176,72,22),radius=85,alpha=250,frost=False)
    d=ImageDraw.Draw(im)
    d.rounded_rectangle((625,540,1085,765),radius=50,fill=(155,65,22,255),outline=(240,142,55,255),width=5)
    labels(d,855,920,1120,1210,1515,"VESPER","PEPTIDE CONCENTRATE","30 ML",(250,246,235),brand_size=54,name_size=78,desc_size=35)
    drop=Image.new("RGBA",(W,H),(0,0,0,0))
    metallic_rect(drop,(1170,510,1545,765),(130,70,44),radius=55)
    dd=ImageDraw.Draw(drop)
    dd.rounded_rectangle((1270,205,1455,560),radius=88,fill=(66,31,25,255))
    dd.rounded_rectangle((1340,720,1435,1450),radius=42,fill=(236,160,67,90),outline=(255,196,110,255),width=6)
    dd.ellipse((1357,1392,1418,1490),fill=(224,126,28,210),outline=(255,186,77,255),width=5)
    im.alpha_composite(drop.rotate(-18,resample=Image.Resampling.BICUBIC,center=(1360,760)))
    im.convert("RGB").save(f"{OUT}/{filename}.jpg",quality=96,subsampling=0)

pump_bottle("veyr-silk-conditioner",(100,105,22),"VEYR","SILK CONDITIONER","250 ML",(250,247,232))
jar("aurel-barrier-creme",(166,67,22),"AUREL","BARRIER CRÈME","50 ML",(252,247,238),False)
slim_bottle("lune-lip-veil",(245,222,181),"LUNE","LIP VEIL","15 ML",(122,61,41),True)
jar("mire-melt-cleansing-balm",(239,213,177),"MIRE","MELT CLEANSING BALM","100 ML",(112,54,34),True)
slim_bottle("nacre-treatment-essence",(239,211,162),"NACRE","TREATMENT ESSENCE","150 ML",(248,247,238),True)
slim_bottle("oriel-eye-contour",(245,225,191),"ORIEL","EYE CONTOUR","20 ML",(117,59,39),True)
pump_bottle("sable-body-cleanser",(235,194,125),"SABLE","BODY CLEANSER","250 ML",(121,55,35),body=(675,470,1373,1765),frost=True)
pump_bottle("serein-amino-cleanser",(132,59,24),"SEREIN","AMINO CLEANSER","200 ML",(249,243,232),body=(690,470,1358,1765),frost=False)
tube("solenne-uv-veil-spf-50")
jar("suede-body-creme",(235,212,179),"SUEDE","BODY CRÈME","200 ML",(123,60,38),True)
dropper("vesper-peptide-concentrate")
pump_bottle("veyr-rich-shampoo",(86,92,16),"VEYR","RICH SHAMPOO","250 ML",(250,247,232))

print("Generated 12 ONYCX clean references in", OUT)
