#!/usr/bin/env python3
"""무대 배경을 미리 흐리게 만든다.

인물과 배경을 다른 평면으로 읽히게 하려면 배경을 아웃포커스로 날려야
하는데, CSS filter: blur() 를 실행 중에 걸면 장면이 바뀔 때마다 전체
화면을 다시 그린다. 실측(모바일 세로, 빠르게 넘기기)으로 프레임 중앙값이
35ms -> 46ms 로, 50ms 초과 프레임이 9~12% -> 38~42% 로 올랐다. 두 번
측정해서 같게 나왔으므로 편차가 아니다.

흐림을 파일에 구워 두면 실행 비용이 0 이 된다. 흐린 그림에는 고주파가
없으므로 절반 크기로 줄여 JPEG 로 저장해도 화면에서 차이가 없다.
실측으로 배경 영역 픽셀 차이가 255 중 평균 0.91, 95퍼센타일 2.0 이었다.

흐림 반지름은 화면에서 4px 이 되도록 잡았다. .stage-bg 는 뷰포트의
104% 크기에 object-fit: cover 라, 2752x1536 원본이 화면에 들어갈 때
배율이 데스크탑 가로에서 0.54, 모바일 세로에서 0.57 이다(둘 다 세로가
기준이 된다). 그래서 원본 기준으로는 4 / 0.55 = 7.2px 이고, 절반으로
줄인 뒤에 걸므로 3.6px 이다.

밝기 0.965 도 함께 굽는다. 배경을 조금 눌러야 인물이 앞으로 나온다.

원본 PNG 는 그대로 둔다. 흐림 정도를 바꾸려면 여기서 다시 만든다.
타이틀 화면과 CG 는 선명한 원본을 계속 쓴다.
"""
import glob
import os

from PIL import Image, ImageEnhance, ImageFilter

BLUR_SCREEN_PX = 4.0      # 화면에서 목표로 하는 흐림
COVER_SCALE = 0.55        # 원본 -> 화면 배율 (데스크탑 0.54 ~ 모바일 0.57)
DOWNSCALE = 2             # 저장할 때 줄이는 배수
BRIGHTNESS = 0.965
QUALITY = 88


def soften(path):
    im = Image.open(path).convert('RGB')
    size = (im.width // DOWNSCALE, im.height // DOWNSCALE)
    out = im.resize(size, Image.LANCZOS)
    out = out.filter(ImageFilter.GaussianBlur(BLUR_SCREEN_PX / COVER_SCALE / DOWNSCALE))
    out = ImageEnhance.Brightness(out).enhance(BRIGHTNESS)
    target = path.replace('.png', '_soft.jpg')
    out.save(target, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
    return target


if __name__ == '__main__':
    src_total = out_total = 0
    for path in sorted(glob.glob('assets/bg*.png')):
        target = soften(path)
        src_total += os.path.getsize(path)
        out_total += os.path.getsize(target)
        print(f'{os.path.basename(path):30s} -> {os.path.basename(target):32s}'
              f' {os.path.getsize(target) / 1024:6.1f} KB')
    print(f'\n합계 {src_total / 1048576:.1f} MB -> {out_total / 1024:.0f} KB')
