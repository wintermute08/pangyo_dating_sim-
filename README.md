# 판교고 미연시 — PANGYO HIGH

10분짜리 학원 비주얼노벨. 2000년대 일본 PC 미연시 감성 × 판교고 로고 모에화.

> 방과 후, 처음 보는 여학생이 잃어버린 '교표 모티브 키링'을 함께 찾으면서
> 가까워지는 하루.

기준 문서는 기획서 **`CONCEPT DOCUMENT v1.0 — 10 MINUTE VERTICAL SLICE`** (16p).
아래 내용은 전부 그 문서에서 나온 것이며, 임의로 만든 설정은 없다.

## 현재 상태

| 항목 | 상태 |
| --- | --- |
| 시나리오 데이터 (`script/story.js`) | ✅ 6개 씬 전체 |
| 엔딩 데이터 (`script/ending.js`) | ⬜ |
| 엔진 (`js/`) | ⬜ |
| UI (`css/`, `index.html`) | ⬜ |
| 아트 에셋 (`assets/`) | ⬜ 외부 제작 |

## 게임 사양

| 항목 | 값 |
| --- | --- |
| 플레이타임 | 첫 회차 8~12분 (목표 10분) |
| 화면 | 16:9, 1920×1080 마스터 |
| 엔딩 | GOOD / NORMAL / OTHER |
| 보이스 | 없음 |

### 게임 상태 변수

| 변수 | 범위 | 역할 |
| --- | --- | --- |
| `affection` | -2 ~ +3 | 핵심 선택의 누적 호감 |
| `drink_choice` | 3종 | 대사 차이만 발생, 엔딩 영향 없음 |
| `school_answer` | positive / neutral / negative | 감정씬 대사 분기 |
| `final_choice` | yes / tease / hesitate | 엔딩 판정의 최종 조건 |

### 엔딩 판정

```
GOOD    affection >= 2 AND final_choice ∈ {yes, tease}
NORMAL  affection ∈ {0,1} OR final_choice = hesitate
OTHER   affection < 0 AND final_choice = hesitate
```

## 팔레트

판교고 로고에서 추출. 최종 일러스트에서는 채도를 5~15% 낮춰 맞춘다.

| 용도 | HEX | 적용 |
| --- | --- | --- |
| Deep Navy Purple | `#33273F` | 머리·교복 외곽·텍스트박스 |
| Red | `#CE2418` | 리본의 작은 포인트 |
| Orange | `#E37B33` | 선택지 하이라이트·따뜻한 강조 |
| Blue | `#4A82B9` | 눈·머리핀·보조 UI |
| Ivory | `#E9E8E6` | 블라우스·배경 카드·밝은 면 |

## 에셋 파일명 규칙

에셋은 아직 없다. 아래 경로에 파일을 넣으면 그대로 붙는다.

```
assets/bg01_gate_morning.png       교문 / 맑은 아침
assets/bg02_classroom_noon.png     교실 / 낮
assets/bg03_corridor_day.png       긴 복도·계단 / 낮→오후
assets/bg04_window_afternoon.png   운동장 보이는 창가 / 늦은 오후
assets/bg05_gate_sunset.png        교문 / 해질녘

assets/ch_pangyo_{포즈}_{표정}.png  예: ch_pangyo_PA_F01.png
assets/cg01_collision.png          첫 충돌
assets/cg02_window_talk.png        창가 대화
assets/cg03_gate_sunset.png        해질녘 교문
```

포즈는 `PA`(양팔 아래) / `PB`(한 손 가방 끈) / `PC`(두 손 뒤로),
표정은 `F01`~`F10`. 시나리오에서 실제로 쓰는 조합만 만들면 된다.

## 라이선스 / 사용 범위

배포 전 확인이 필요한 항목:

- 학교명·로고 사용 허용 여부
- AI 생성 이미지·음악 서비스의 해당 플랜 이용 조건
