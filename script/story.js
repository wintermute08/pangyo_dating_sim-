/*
 * 판교고 미연시 — 시나리오 데이터
 * 기획서 §3 전체 스토리 설계 / §4 씬별 상세 시나리오 기준.
 *
 * 이 파일은 순수 데이터다. 여기에는 로직을 넣지 않는다.
 * 대사를 고치고 싶으면 이 파일만 건드리면 된다.
 *
 * 라인 타입
 *   narr      주인공 독백·지문. 이름창 없음
 *   say       대사. who = mc | heroine | unknown
 *   bg        배경 전환
 *   cg        이벤트 CG 표시/해제
 *   face      히로인 표정만 교체
 *   chara     히로인 스탠딩 등장/퇴장
 *   bgm       BGM 교체
 *   sfx       효과음 1회 재생
 *   wait      텍스트 없는 정지
 *   datecard  날짜 카드
 *   title     타이틀 회수
 *   choice    선택지
 *   end       엔딩 판정으로 이동
 *
 * ○○ 자리는 {name} / {name_a}(호격 조사 자동) 로 쓴다.
 */
window.STORY = {
  // 히로인 이름: 기획서 §4 SCENE 06 — 개발 단계 가칭 "판교"
  heroineName: '판교',
  unknownName: '???',

  scenes: [
    /* ── SCENE 01 ─ 평범한 월요일 ───────────────────────────── */
    {
      id: 's01',
      title: '평범한 월요일',
      bg: 'bg01_gate_morning',
      bgm: 'bgm01_title_morning',
      lines: [
        { t: 'datecard', text: '4월 15일 (월)  ·  맑음' },
        { t: 'sfx', id: 'school_bell' },
        { t: 'narr', text: '아침 여덟 시. 교문 앞은 늘 그렇듯 조금 시끄럽고, 조금 졸리다.' },
        { t: 'narr', text: '오늘도 특별한 일은 없을 것이다. 어제도 그랬고, 그저께도 그랬으니까.' },
        { t: 'narr', text: '그렇게 생각하면서 교실로 올라갔다.' },

        { t: 'bg', to: 'bg03_corridor_day', fade: 300 },
        { t: 'sfx', id: 'footstep_01' },
        { t: 'narr', text: '2층 복도 모퉁이. 아무 생각 없이 돌았을 때였다.' },
        { t: 'sfx', id: 'book_drop' },
        { t: 'cg', show: 'cg01_collision', fade: 700 },
        { t: 'narr', text: '누군가와 정면으로 부딪혔다. 책과 필기구가 바닥에 흩어졌다.' },
        { t: 'say', who: 'unknown', face: 'F03', text: '아…… 미안! 괜찮아?' },
        { t: 'narr', text: '처음 보는 얼굴이었다. 나는 반사적으로 떨어진 책을 주워 건넸다.' },
        { t: 'say', who: 'unknown', face: 'F01', text: '고마워, {name_a}.' },
        { t: 'wait', ms: 700 },
        { t: 'cg', hide: true, fade: 400 },
        { t: 'chara', show: true, pose: 'PA', face: 'F01' },
        { t: 'say', who: 'mc', text: '…내 이름, 알려준 적 없는 것 같은데.' },
        { t: 'say', who: 'heroine', face: 'F07', text: '같은 학교잖아?' },
        { t: 'narr', text: '그 말만 남기고, 그 애는 복도 저쪽으로 사라졌다.' },
        { t: 'wait', ms: 500 },
        { t: 'title' }
      ]
    },

    /* ── SCENE 02 ─ 잃어버린 것 ─────────────────────────────── */
    {
      id: 's02',
      title: '잃어버린 것',
      bg: 'bg02_classroom_noon',
      bgm: 'bgm02_daily_search',
      lines: [
        { t: 'narr', text: '점심시간. 창가 자리에서 그 애를 다시 만났다.' },
        { t: 'chara', show: true, pose: 'PB', face: 'F01' },
        { t: 'say', who: 'heroine', face: 'F01', text: '아, 아까 그.' },
        { t: 'narr', text: '가방을 뒤적이던 손이 점점 빨라졌다.' },
        { t: 'sfx', id: 'cloth_bag' },
        { t: 'say', who: 'heroine', face: 'F06', text: '…어라. 없다.' },
        { t: 'say', who: 'mc', text: '뭐가?' },
        { t: 'say', who: 'heroine', face: 'F06', text: '키링. 조그만 거. 가방에 항상 달아뒀는데.' },
        { t: 'say', who: 'heroine', face: 'F06', text: '아까 부딪혔을 때 떨어진 걸지도 몰라.' },
        { t: 'wait', ms: 400 },
        { t: 'say', who: 'heroine', face: 'F06', text: '…같이 찾아줄 수 있어?' },

        {
          t: 'choice',
          options: [
            {
              text: '그래. 같이 찾아보자.',
              affection: 1,
              react: [
                { t: 'say', who: 'heroine', face: 'F02', text: '진짜? 고마워!' },
                { t: 'narr', text: '표정이 바로 밝아졌다. 그렇게까지 좋아할 일인가 싶었다.' }
              ]
            },
            {
              text: '대신 이름부터 알려줘.',
              affection: 0,
              react: [
                { t: 'say', who: 'heroine', face: 'F05', text: '어? 그건… 찾고 나서.' },
                { t: 'say', who: 'heroine', face: 'F07', text: '먼저 찾아주면 알려줄게. 거래.' },
                { t: 'narr', text: '장난스럽게 흥정하는 얼굴이었다.' }
              ]
            },
            {
              text: '금방 찾을 수 있겠지?',
              affection: -1,
              react: [
                { t: 'say', who: 'heroine', face: 'F08', text: '…그러겠지.' },
                { t: 'narr', text: '살짝 서운한 기색이었지만, 그 애는 아무 말 없이 앞장섰다.' }
              ]
            }
          ]
        }
      ]
    },

    /* ── SCENE 03 ─ 찾는 김에 ───────────────────────────────── */
    {
      id: 's03',
      title: '찾는 김에',
      bg: 'bg03_corridor_day',
      bgm: 'bgm03_heroine_theme',
      lines: [
        { t: 'chara', show: true, pose: 'PA', face: 'F01' },
        { t: 'narr', text: '오전에 지나온 길을 거꾸로 되짚었다. 계단, 복도, 자판기 앞.' },
        { t: 'sfx', id: 'footstep_01' },
        { t: 'narr', text: '바닥만 보고 걷는데도 키링은 나오지 않았다.' },
        { t: 'say', who: 'heroine', face: 'F01', text: '여기 지나갔던 것 같기도 하고…' },
        { t: 'narr', text: '자판기 앞에서 그 애가 멈춰 섰다.' },
        { t: 'say', who: 'heroine', face: 'F07', text: '잠깐. 목말라. 뭐 마실래?' },

        {
          t: 'choice',
          // 취향 선택지 — 기획서 §10: 점수에 영향 없음
          note: '취향 선택지 (엔딩 영향 없음)',
          options: [
            {
              text: '따뜻한 코코아.',
              set: { drink_choice: 'cocoa' },
              react: [
                { t: 'sfx', id: 'can_drop' },
                { t: 'say', who: 'heroine', face: 'F07', text: '4월인데 코코아? …나쁘지 않네.' }
              ]
            },
            {
              text: '그냥 물.',
              set: { drink_choice: 'water' },
              react: [
                { t: 'sfx', id: 'can_drop' },
                { t: 'say', who: 'heroine', face: 'F05', text: '재미없어. 진짜 재미없어.' }
              ]
            },
            {
              text: '네가 마시는 걸로.',
              set: { drink_choice: 'same' },
              react: [
                { t: 'sfx', id: 'can_drop' },
                { t: 'say', who: 'heroine', face: 'F04', text: '…그런 거 아무렇지 않게 말하지 마.' }
              ]
            }
          ]
        },

        { t: 'narr', text: '캔을 하나씩 들고 다시 복도를 걸었다.' },
        { t: 'say', who: 'heroine', face: 'F07', text: '…우리 지금 찾는 것보다 딴 얘기를 더 많이 하는 것 같은데?' },
        { t: 'say', who: 'mc', text: '찾으면서 얘기하는 거지.' },
        { t: 'say', who: 'heroine', face: 'F01', text: '그럼 찾고 나면 얘기 안 할 거야?' },
        { t: 'wait', ms: 500 },
        { t: 'narr', text: '뭐라고 대답해야 할지 몰라서, 그냥 웃었다.' }
      ]
    },

    /* ── SCENE 04 ─ 너는 이 학교 좋아해? ────────────────────── */
    {
      id: 's04',
      title: '너는 이 학교 좋아해?',
      bg: 'bg04_window_afternoon',
      bgm: 'bgm04_sunset_window',
      lines: [
        { t: 'narr', text: '운동장이 내려다보이는 창가. 잠깐 쉬기로 했다.' },
        { t: 'chara', show: true, pose: 'PB', face: 'F01' },
        { t: 'sfx', id: 'wind_soft' },
        { t: 'narr', text: '창문 너머로 축구하는 소리가 멀게 들렸다.' },
        { t: 'cg', show: 'cg02_window_talk', fade: 700 },
        { t: 'say', who: 'heroine', face: 'F08', text: '있잖아.' },
        { t: 'say', who: 'heroine', face: 'F08', text: '너는 이 학교, 좋아해?' },

        {
          t: 'choice',
          options: [
            {
              text: '좋아해.',
              affection: 1,
              set: { school_answer: 'positive' },
              react: [
                { t: 'say', who: 'heroine', face: 'F01', text: '그렇구나.' },
                { t: 'narr', text: '안심한 듯한 웃음이었다.' }
              ]
            },
            {
              text: '그냥 그래.',
              affection: 0,
              set: { school_answer: 'neutral' },
              react: [
                { t: 'say', who: 'heroine', face: 'F07', text: '그게 제일 솔직한 답일지도.' }
              ]
            },
            {
              text: '빨리 졸업하고 싶어.',
              affection: -1,
              set: { school_answer: 'negative' },
              react: [
                { t: 'wait', ms: 800 },
                { t: 'say', who: 'heroine', face: 'F08', text: '…그래도 생각날 날이 오겠지.' }
              ]
            }
          ]
        },

        { t: 'cg', hide: true, fade: 400 },
        { t: 'narr', text: '그 애는 한참 운동장을 내려다봤다.' }
      ]
    },

    /* ── SCENE 05 ─ 찾았다 ──────────────────────────────────── */
    {
      id: 's05',
      title: '찾았다',
      bg: 'bg03_corridor_day',
      bgm: 'bgm04_sunset_window',
      lines: [
        { t: 'sfx', id: 'school_bell' },
        { t: 'narr', text: '종례가 끝났다. 키링은 여전히 나오지 않았다.' },
        { t: 'chara', show: true, pose: 'PA', face: 'F08' },
        { t: 'say', who: 'heroine', face: 'F08', text: '…오늘은 그냥 못 찾는 날인가 봐.' },
        { t: 'say', who: 'mc', text: '처음 부딪혔던 데부터 한 번만 더 보자.' },
        { t: 'say', who: 'heroine', face: 'F03', text: '…응.' },

        { t: 'bg', to: 'bg04_window_afternoon', fade: 400 },
        { t: 'narr', text: '해가 기울어 복도 바닥에 주황빛이 길게 드리웠다.' },
        { t: 'narr', text: '운동장 쪽 창가, 벤치 밑에서 아주 작은 반사가 보였다.' },
        { t: 'sfx', id: 'keychain_tinkle' },
        { t: 'wait', ms: 200 },
        { t: 'face', id: 'F09' },
        { t: 'say', who: 'heroine', face: 'F09', text: '…진짜 있었네.' },
        { t: 'narr', text: '그 애는 키링을 양손으로 감싸 쥐었다.' },
        { t: 'say', who: 'heroine', face: 'F02', text: '이상하지? 이거 하나 찾았다고 오늘 하루가 다 제대로 돌아온 것 같아.' },
        { t: 'wait', ms: 400 },
        { t: 'say', who: 'heroine', face: 'F08', text: '비싼 것도 아닌데… 없어진 줄 알았을 때 이상하게 엄청 허전했어. 매일 보던 건데도.' },
        { t: 'say', who: 'mc', text: '평범한 건, 없어지고 나서야 눈에 들어오는 걸지도 모르지.' },
        { t: 'wait', ms: 600 },
        { t: 'say', who: 'heroine', face: 'F04', text: '…너 가끔 그런 말 하더라.' }
      ]
    },

    /* ── SCENE 06 ─ 내일도 ──────────────────────────────────── */
    {
      id: 's06',
      title: '내일도',
      bg: 'bg05_gate_sunset',
      bgm: 'bgm04_sunset_window',
      lines: [
        { t: 'narr', text: '해질녘 교문. 하루가 거의 다 끝나 있었다.' },
        { t: 'chara', show: true, pose: 'PC', face: 'F01' },
        { t: 'sfx', id: 'wind_soft' },
        { t: 'say', who: 'heroine', face: 'F01', text: '오늘 진짜 고마웠어.' },
        { t: 'say', who: 'heroine', face: 'F04', text: '아, 맞다. 아직 이름 안 알려줬지.' },
        { t: 'wait', ms: 400 },
        { t: 'say', who: 'heroine', face: 'F01', text: '판교. 그렇게 불러.' },
        { t: 'say', who: 'mc', text: '…학교 이름이랑 똑같은데.' },
        { t: 'say', who: 'heroine', face: 'F07', text: '그러게. 외우기 쉽지?' },
        { t: 'wait', ms: 600 },
        { t: 'cg', show: 'cg03_gate_sunset', fade: 700 },
        { t: 'say', who: 'heroine', face: 'F10', text: '{name_a}. 내일도… 같이 가줄래?' },

        {
          t: 'choice',
          options: [
            { text: '물론이지.', set: { final_choice: 'yes' } },
            { text: '왜, 나 좋아해?', set: { final_choice: 'tease' } },
            { text: '글쎄.', set: { final_choice: 'hesitate' } }
          ]
        },

        { t: 'end' }
      ]
    }
  ]
};
