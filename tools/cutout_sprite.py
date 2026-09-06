#!/usr/bin/env python3
"""생성된 스탠딩에서 흰 배경을 제거한다.

생성 결과는 알파가 없는 흰 배경 위 그림으로 나온다. 테두리에서
flood fill 로 바깥 흰색만 지운다. 단순히 '흰색이면 지우기'로 하면
셔츠와 눈 흰자까지 사라진다.

머리카락에 둘러싸여 테두리와 이어지지 않은 흰 조각은 이 단계에서
남는다. remove_hair_gaps.py 가 그걸 따로 처리한다.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, binary_erosion, label


def cutout(path, out_path, white=238, feather=1):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(np.int16)
    near_white = (a.min(axis=2) >= white)

    # 테두리와 이어진 흰 영역만 배경이다
    lab, n = label(near_white)
    border = set(lab[0].tolist()) | set(lab[-1].tolist()) \
        | set(lab[:, 0].tolist()) | set(lab[:, -1].tolist())
    border.discard(0)
    bg = np.isin(lab, list(border))

    alpha = np.where(bg, 0, 255).astype(np.uint8)
    if feather:
        # 한 겹 깎아 흰 테두리를 없애고, 경계를 부드럽게 만든다
        solid = binary_erosion(alpha > 0, iterations=feather)
        edge = (alpha > 0) & ~solid
        alpha = np.where(solid, 255, np.where(edge, 128, 0)).astype(np.uint8)

    out = np.dstack([np.asarray(im), alpha])
    Image.fromarray(out, 'RGBA').save(out_path)
    return (alpha > 0).mean(), (alpha == 128).mean()


if __name__ == '__main__':
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    files = sorted(src.glob('*.png')) if src.is_dir() else [src]
    dst.mkdir(parents=True, exist_ok=True) if src.is_dir() else None
    for f in files:
        o = (dst / f.name) if src.is_dir() else dst
        keep, edge = cutout(f, o)
        print(f'  {f.name:20s} 실루엣 {keep*100:5.1f}%  경계 {edge*100:4.2f}%')
