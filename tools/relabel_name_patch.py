from PIL import Image, ImageDraw, ImageFont
import numpy as np
from scipy import ndimage

FONT = '/usr/share/fonts/truetype/nanum/NanumGothic.ttf'
INK  = (41, 40, 41)
PAPER = (251, 250, 250)

def find_patch(a):
    """가슴 높이의 밝은 가로 직사각형 = 명찰."""
    rgb, al = a[:,:,:3].astype(int), a[:,:,3]
    h, w = al.shape
    band = np.zeros_like(al, bool); band[int(h*0.25):int(h*0.36), :] = True
    bright = (al > 200) & (rgb.min(axis=2) >= 225) & band
    lab, n = ndimage.label(bright)
    best = None
    for i in range(1, n+1):
        m = lab == i; area = int(m.sum())
        if area < 800: continue
        ys, xs = np.where(m)
        bw, bh = xs.max()-xs.min()+1, ys.max()-ys.min()+1
        if 1.6 < bw/bh < 3.4 and area/(bw*bh) > 0.55:
            if best is None or area > best[0]:
                best = (area, int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max()))
    return best

def measure_angle(a, x0, x1, y0, y1):
    lum = a[y0-6:y1+6, x0-6:x1+6, :3].mean(axis=2)
    dark = lum < 120
    cols, tops = [], []
    for cx in range(dark.shape[1]):
        ys = np.where(dark[:, cx])[0]
        if len(ys): cols.append(cx); tops.append(ys.min())
    cols, tops = np.array(cols), np.array(tops)
    m = (cols > 8) & (cols < dark.shape[1]-8)
    if m.sum() < 8: return 0.0
    return float(np.degrees(np.arctan(np.polyfit(cols[m], tops[m], 1)[0])))

def relabel(path, out, text='판교하'):
    im = Image.open(path).convert('RGBA')
    a = np.asarray(im).copy()
    found = find_patch(a)
    if not found: raise SystemExit('명찰 못 찾음: ' + path)
    _, x0, x1, y0, y1 = found
    angle = measure_angle(a, x0, x1, y0, y1)

    pw, ph = x1-x0+1, y1-y0+1
    # 테두리를 남기고 안쪽만 새로 칠한다
    pad = max(3, int(round(ph*0.16)))
    ix0, ix1 = x0+pad, x1-pad
    iy0, iy1 = y0+pad, y1-pad

    # 안쪽을 바탕색으로 지운다 (기존 글자 제거)
    a[iy0:iy1+1, ix0:ix1+1, :3] = PAPER

    # 새 글자를 4배로 그린 뒤 축소해 부드럽게
    S = 4
    tw, th = (ix1-ix0+1)*S, (iy1-iy0+1)*S
    layer = Image.new('RGBA', (tw, th), (0,0,0,0))
    d = ImageDraw.Draw(layer)
    size = int(th*0.86)
    while size > 6:
        f = ImageFont.truetype(FONT, size)
        bb = d.textbbox((0,0), text, font=f)
        if bb[2]-bb[0] <= tw*0.92 and bb[3]-bb[1] <= th*0.92: break
        size -= 2
    f = ImageFont.truetype(FONT, size)
    bb = d.textbbox((0,0), text, font=f)
    d.text(((tw-(bb[2]-bb[0]))/2 - bb[0], (th-(bb[3]-bb[1]))/2 - bb[1]),
           text, font=f, fill=INK+(255,))
    layer = layer.rotate(-angle, resample=Image.BICUBIC, expand=False)
    layer = layer.resize((ix1-ix0+1, iy1-iy0+1), Image.LANCZOS)

    base = Image.fromarray(a, 'RGBA')
    region = base.crop((ix0, iy0, ix1+1, iy1+1))
    region.alpha_composite(layer)
    base.paste(region, (ix0, iy0))
    base.save(out, optimize=True)
    return dict(x=(x0,x1), y=(y0,y1), angle=round(angle,2), font_px=size//S)
