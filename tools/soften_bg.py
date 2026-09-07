#!/usr/bin/env python3
"""무대 배경을 미리 흐리게 만든다.

CSS filter: blur() 를 실행 중에 걸면 장면이 바뀔 때마다 전체
화면을 다시 그린다. 이전 실측(모바일 세로, 빠르게 넘기기)으로 프레임 중앙값이
35ms -> 46ms 로, 50ms 초과 프레임이 9~12% -> 38~42% 로 올랐다. 두 번
측정해서 같게 나왔으므로 편차가 아니다.

흐림을 파일에 구워 두면 실행 중 블러 연산이 필요 없다.
절반 크기 JPEG 를 사용해 원본 PNG 대비 전송량도 줄인다.

흐림 반지름은 화면에서 약 1.5px 이 되도록 잡는다. 기존 4px 은 창틀과
바닥 선까지 지워 인물만 선명하게 분리되는 문제가 있었다. .stage-bg 는 뷰포트의
104% 크기에 object-fit: cover 라, 2752x1536 원본이 화면에 들어갈 때
배율이 데스크탑 가로에서 0.54, 모바일 세로에서 0.57 이다(둘 다 세로가
기준이 된다). 원본 기준 1.5 / 0.55 = 2.73px 이고, 절반으로
줄인 뒤에 걸므로 약 1.36px 이다. 화면 크기에 따라 체감 흐림은 달라진다.

밝기 0.985 도 함께 굽는다. 강한 명암 차이 대신 약한 심도로 인물을 구분한다.

원본 PNG 는 그대로 둔다. 흐림 정도를 바꾸려면 여기서 다시 만든다.
타이틀 화면과 CG 는 선명한 원본을 계속 쓴다.
"""
import glob
import os

from PIL import Image, ImageEnhance, ImageFilter

BLUR_SCREEN_PX = 1.5      # 화면에서 목표로 하는 흐림
COVER_SCALE = 0.55        # 원본 -> 화면 배율 (데스크탑 0.54 ~ 모바일 0.57)
DOWNSCALE = 2             # 저장할 때 줄이는 배수
BRIGHTNESS = 0.985
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
