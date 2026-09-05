#!/usr/bin/env python3
"""script/story.js 에서 판교하 대사를 뽑아 음성 매니페스트를 만든다.

키는 대사 원문(치환 전)의 FNV-1a 32bit 해시다. 인덱스가 아니라 내용으로
키를 잡아야 시나리오 순서를 바꿔도 기존 음성 파일이 계속 붙는다.
js/game.js 의 voiceKey() 와 같은 해시여야 한다.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_NAME = '도윤'


def fnv1a(text):
    h = 0x811c9dc5
    for b in text.encode('utf-8'):
        h = ((h ^ b) * 0x01000193) & 0xFFFFFFFF
    return f'{h:08x}'


def vocative(name):
    """받침이 있으면 '아', 없으면 '야'."""
    last = name[-1]
    if not ('가' <= last <= '힣'):
        return name + '아'
    return name + ('아' if (ord(last) - 0xAC00) % 28 else '야')


def extract():
    src = (ROOT / 'script' / 'story.js').read_text(encoding='utf-8')
    pattern = (r"\{\s*t:\s*'say',\s*who:\s*'(\w+)'"
               r"(?:,\s*look:\s*'(\w+)')?,\s*text:\s*'((?:[^'\\]|\\.)*)'")
    out = []
    for who, look, text in re.findall(pattern, src):
        if who not in ('unknown', 'heroine'):
            continue
        text = text.replace("\\'", "'")
        out.append({
            'key': fnv1a(text),
            'look': look or 'calm',
            'raw': text,
            # 녹음용: 이름 자리는 기본 이름으로 채운다
            'spoken': text.replace('{name_a}', vocative(DEFAULT_NAME))
                          .replace('{name}', DEFAULT_NAME),
            'hasName': '{name' in text,
        })
    return out


def main():
    lines = extract()
    keys = [l['key'] for l in lines]
    dupes = {k for k in keys if keys.count(k) > 1}
    if dupes:
        # 같은 대사가 두 번 나오면 파일 하나를 공유한다. 충돌이 아니라 중복이다.
        print(f'참고: 동일 대사 {len(dupes)}건이 음성 파일을 공유합니다', file=sys.stderr)

    manifest = {l['key']: {'file': f"assets/voice/{l['key']}.mp3",
                           'hasName': l['hasName']} for l in lines}
    js = ('/* 자동 생성 파일. tools/build_voice_manifest.py 로 다시 만든다. */\n'
          'window.VOICE_MANIFEST = ' + json.dumps(manifest, ensure_ascii=False, indent=1) + ';\n'
          f'window.VOICE_DEFAULT_NAME = {json.dumps(DEFAULT_NAME, ensure_ascii=False)};\n')
    (ROOT / 'script' / 'voice-manifest.js').write_text(js, encoding='utf-8')

    # 생성용 작업목록 (레포에 넣지 않는다)
    jobs = [{'key': l['key'], 'text': l['spoken'], 'look': l['look']} for l in lines]
    seen, uniq = set(), []
    for j in jobs:
        if j['key'] not in seen:
            seen.add(j['key'])
            uniq.append(j)
    Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/voice_jobs.json').write_text(
        json.dumps(uniq, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'대사 {len(lines)}줄 -> 고유 음성 {len(uniq)}개, 이름 치환 포함 '
          f"{sum(1 for l in lines if l['hasName'])}줄")


if __name__ == '__main__':
    main()
