#!/usr/bin/env python3
"""눈 깜박임 오버레이 스트립을 만든다.

전신 변형을 저장하면 스탠딩 7종(23.6MB)에 47MB 가 더 붙어서 못 쓴다.
눈 부분만 잘라 작은 PNG 로 저장하고, 게임에서 인물 위에 겹친다.

깜박임 자체는 원본 그림을 아래로 납작하게 눌러 만든다. 생성 모델에
"눈만 감겨 달라"고 하면 얼굴을 통째로 다시 그려서(눈썹 정렬 ZNCC 0.99
에서도 눈은 아래로 밀렸다) 합성이 안 된다. 애니메이션 깜박임이 원래
눈을 눌러 놓은 모양이라, 원본을 누르면 화풍이 저절로 맞는다.

완전히 감기지는 않는다(최대 0.8). 다 누르면 눈이 3px 밖에 안 남아
속눈썹 선이 뭉개지고 평평한 자국이 보인다.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'assets'
OUT = ASSETS / 'blink'
LEVELS = (0.45, 0.8)
PAD = 6          # 스트립 여백. 경계가 딱 떨어지면 이음매가 보인다.


def skin_fill(a, box):
    """눈 아래 볼에서 피부색을 뽑는다. 위쪽은 앞머리라 쓰면 안 된다."""
    x0, y0, x1, y1 = box
    strip = a[y1 + 6:y1 + 20, x0 + 10:x1 - 10]
    m = strip[..., 3] > 200
    if m.sum() < 20:
        return np.array([250, 226, 222, 255], np.uint8)
    return np.concatenate([np.median(strip[..., :3][m], 0), [255]]).astype(np.uint8)


def hair_depth(a, box, dark=170):
    """열마다 상자 위에서 내려온 앞머리 두께. 안 세면 피부색이 머리를 덮는다."""
    x0, y0, x1, y1 = box
    depth = np.zeros(x1 - x0, int)
    for i in range(x1 - x0):
        col = a[y0:y1, x0 + i]
        d = 0
        while d < col.shape[0] and col[d, 0] < dark and col[d, 3] > 100:
            d += 1
        depth[i] = d
    return depth


def squash(a, box, t):
    x0, y0, x1, y1 = box
    h, w = y1 - y0, x1 - x0
    eye = a[y0:y1, x0:x1].copy()
    keep = max(3, int(round(h * (1.0 - t))))
    small = np.array(Image.fromarray(eye).resize((w, keep), Image.LANCZOS))
    block = np.tile(skin_fill(a, box), (h, w, 1)).astype(np.uint8)
    block[h - keep:] = small
    for i, d in enumerate(hair_depth(a, box)):
        if d:
            block[:min(d, h - keep), i] = eye[:min(d, h - keep), i]
    block[..., 3] = a[y0:y1, x0:x1, 3]      # 실루엣은 그대로
    return block


def main(eyes_json):
    spec = json.load(open(eyes_json, encoding='utf-8'))
    OUT.mkdir(exist_ok=True)
    manifest = {}
    for look, info in spec.items():
        img = Image.open(ASSETS / info['src']).convert('RGBA')
        a = np.array(img)
        boxes = [tuple(b) for b in info['eyes']]
        ux0 = min(b[0] for b in boxes) - PAD
        uy0 = min(b[1] for b in boxes) - PAD
        ux1 = max(b[2] for b in boxes) + PAD
        uy1 = max(b[3] for b in boxes) + PAD
        files = []
        for n, t in enumerate(LEVELS, 1):
            frame = a.copy()
            for box in boxes:
                frame[box[1]:box[3], box[0]:box[2]] = squash(a, box, t)
            strip = Image.fromarray(frame[uy0:uy1, ux0:ux1])
            name = f'{look}_{n}.png'
            strip.save(OUT / name, optimize=True)
            files.append(f'assets/blink/{name}')
        manifest[look] = {'x': ux0, 'y': uy0, 'w': ux1 - ux0, 'h': uy1 - uy0,
                          'nw': img.width, 'nh': img.height, 'frames': files}
        kb = sum((OUT / Path(f).name).stat().st_size for f in files) / 1024
        print(f'{look:13s} 스트립 {ux1-ux0}x{uy1-uy0}  {kb:6.1f} KB')
    js = ('/* 자동 생성 파일. tools/make_blink_strips.py 로 다시 만든다. */\n'
          'window.BLINK = ' + json.dumps(manifest, indent=1) + ';\n')
    (ROOT / 'script' / 'blink.js').write_text(js, encoding='utf-8')
    total = sum(f.stat().st_size for f in OUT.glob('*.png')) / 1024
    print(f'\n합계 {total:.0f} KB  -> script/blink.js 저장')


if __name__ == '__main__':
    main(sys.argv[1])
