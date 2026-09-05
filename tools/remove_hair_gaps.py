from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage

def find_gaps(path):
    """머리카락에 둘러싸여 테두리 flood fill 이 닿지 못한 배경 조각을 찾는다.

    구분 기준 두 가지를 같이 쓴다.
      1) 조각 바깥 한 겹이 대부분 어두운가  -> 머리카락에 둘러싸였다
      2) 실루엣 바깥(투명)까지 거리가 가까운가 -> 가장자리의 얇은 틈이다
    드로우코드도 1)은 만족하지만 몸 한가운데라 2)에서 걸러진다.
    """
    im = Image.open(path).convert('RGBA')
    a = np.asarray(im); rgb = a[:,:,:3].astype(int); al = a[:,:,3]
    h, w = al.shape
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    white = (al > 200) & (mx >= 236) & ((mx - mn) <= 10)
    lab, n = ndimage.label(white)
    dist = ndimage.distance_transform_edt(al > 200)

    gaps = np.zeros((h, w), bool)
    for i in range(1, n + 1):
        m = lab == i
        area = int(m.sum())
        if area < 60:
            continue
        ring = ndimage.binary_dilation(m, iterations=3) & ~m & (al > 200)
        if ring.sum() < 20:
            continue
        dark = (rgb[ring].mean(axis=1) < 100).mean()
        ys, _ = np.where(m)
        if dark > 0.55 and dist[m].min() < 70 and ys.max() / h < 0.50:
            gaps |= m
    return im, a, gaps

def apply(path, out):
    im, a, gaps = find_gaps(path)
    if gaps.sum() == 0:
        return 0
    # 조각을 살짝 넓혀 가장자리의 반투명 흰 테두리까지 제거한다
    grown = ndimage.binary_dilation(gaps, iterations=2)
    alpha = a[:, :, 3].astype(np.float32)
    alpha[grown] = 0
    # 잘린 자리의 계단현상을 부드럽게
    am = Image.fromarray(alpha.astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(0.8))
    alpha = np.clip((np.asarray(am).astype(np.float32) - 60) * (255 / (255 - 60)), 0, 255)
    # 원래 불투명했던 인물 내부는 다시 완전 불투명으로
    keep = (a[:, :, 3] > 250) & ~grown
    alpha[keep] = 255
    out_arr = np.dstack([a[:, :, :3], alpha.astype(np.uint8)])
    Image.fromarray(out_arr, 'RGBA').save(out, optimize=True)
    return int(gaps.sum())
