/*
 * 판교고 미연시 — 본편 시나리오 데이터
 *
 * 새 UI 목업의 "고3의 봄 / 판교하" 설정을 중심으로, 기존 기획서의
 * 6개 장면·키링 찾기·학교에 대한 질문만 가볍게 재구성했다.
 * 이 파일에는 표시 로직을 넣지 않는다.
 */
window.STORY = {
  heroineName: '판교하',
  unknownName: '???',

  scenes: [
    {
      id: 's01',
      number: '01',
      title: '봄이 오래 머무는 복도',
      chapter: 'APRIL, MONDAY',
      bg: 'bg01_gate_morning',
      bgm: 'morning',
      lines: [
        { t: 'datecard', text: '4월 15일, 월요일', sub: '졸업까지 321일 · 맑음' },
        { t: 'sfx', id: 'school_bell' },
        { t: 'narr', text: '아침 여덟 시. 햇빛은 아직 옅고, 교문 앞의 목소리들은 조금 졸려 있었다.' },
        { t: 'narr', text: '고3이 되었다고 해서 등굣길이 달라지는 건 없었다. 적어도 오늘 아침까지는.' },
        { t: 'bg', to: 'bg03_corridor_day', fade: 700 },
        { t: 'narr', text: '2층 복도 끝에서, 한 여학생이 창가 벤치 아래를 한참 들여다보고 있었다.' },
        { t: 'chara', show: true, look: 'calm' },
        { t: 'say', who: 'unknown', look: 'calm', text: '저기, 혹시 분홍색 꽃 키링 못 봤어?' },
        { t: 'say', who: 'mc', text: '키링?' },
        { t: 'say', who: 'unknown', look: 'serious', text: '손바닥보다 작고, 가운데에 학교 마크가 있어. 아침까진 가방에 달려 있었는데.' },
        { t: 'narr', text: '처음 보는 얼굴은 아니었다. 같은 층에서 몇 번 스쳐 지나간 적은 있었다.' },
        { t: 'say', who: 'unknown', look: 'smile', text: '{name_a}, 너도 오늘 일찍 왔네.' },
        { t: 'say', who: 'mc', text: '잠깐. 내 이름은 어떻게 알아?' },
        { t: 'say', who: 'unknown', look: 'smile', text: '실내화 주머니에 크게 쓰여 있잖아.' },
        { t: 'narr', text: '그 애가 가리킨 곳에는, 어머니가 써 준 내 이름이 유난히 반듯하게 남아 있었다.' },
        { t: 'say', who: 'unknown', look: 'shy', text: '…웃어서 미안. 지금은 키링 때문에 좀 정신이 없어서.' },
        { t: 'title', text: '봄은, 열 걸음 늦게 온다' }
      ]
    },

    {
      id: 's02',
      number: '02',
      title: '이름을 건 약속',
      chapter: 'BEFORE FIRST PERIOD',
      bg: 'bg02_classroom_noon',
      bgm: 'day',
      lines: [
        { t: 'narr', text: '빈 교실로 돌아와 그 애의 가방과 책상 주변부터 다시 살폈다.' },
        { t: 'chara', show: true, look: 'serious' },
        { t: 'sfx', id: 'cloth_bag' },
        { t: 'say', who: 'unknown', look: 'serious', text: '없어. 진짜로 떨어뜨렸나 봐.' },
        { t: 'say', who: 'mc', text: '마지막으로 본 곳은?' },
        { t: 'say', who: 'unknown', look: 'calm', text: '교문, 자판기, 이 복도. 그리고 여기.' },
        { t: 'say', who: 'unknown', look: 'shy', text: '수업 시작 전까지만… 같이 찾아줄 수 있을까?' },
        {
          t: 'choice',
          prompt: '어떻게 대답할까?',
          options: [
            {
              text: '당연하지. 같이 찾아보자.',
              affection: 1,
              react: [
                { t: 'say', who: 'unknown', look: 'smile', text: '정말? 고마워. 생각보다 다정하네, {name_a}.' },
                { t: 'narr', text: '아침 햇빛이 그 애의 꽃 모양 머리핀 위에 잠깐 머물렀다.' }
              ]
            },
            {
              text: '대신 네 이름부터 알려줘.',
              affection: 0,
              react: [
                { t: 'say', who: 'unknown', look: 'smile', text: '찾으면 알려줄게. 이름을 건 약속, 어때?' },
                { t: 'say', who: 'mc', text: '생각보다 조건이 까다롭네.' }
              ]
            },
            {
              text: '종 치기 전까지만이야.',
              affection: -1,
              react: [
                { t: 'say', who: 'unknown', look: 'serious', text: '응. 그것만으로도 충분해.' },
                { t: 'narr', text: '대답은 씩씩했지만, 눈빛은 아주 조금 가라앉았다.' }
              ]
            }
          ]
        },
        { t: 'say', who: 'unknown', look: 'calm', text: '참, 3학년 2반이야. 도망가진 않을 테니까 걱정 마.' },
        { t: 'narr', text: '그 말과 함께 우리는 아침의 동선을 거꾸로 걷기 시작했다.' }
      ]
    },

    {
      id: 's03',
      number: '03',
      title: '찾는 김에',
      chapter: 'A SMALL DETOUR',
      bg: 'bg03_corridor_day',
      bgm: 'walk',
      lines: [
        { t: 'chara', show: true, look: 'calm' },
        { t: 'narr', text: '계단, 복도 모퉁이, 신발장. 고개를 숙이고 걷다 보니 평소엔 지나치던 것들이 하나씩 보였다.' },
        { t: 'sfx', id: 'footstep_01' },
        { t: 'say', who: 'unknown', look: 'smile', text: '저 게시판, 아직도 작년 축제 포스터가 붙어 있네.' },
        { t: 'say', who: 'mc', text: '매일 지나가면서도 처음 봤어.' },
        { t: 'say', who: 'unknown', look: 'calm', text: '익숙한 건 원래 잘 안 보이는 것 같아.' },
        { t: 'narr', text: '자판기 앞에 도착했을 때, 그 애가 갑자기 걸음을 멈췄다.' },
        { t: 'say', who: 'unknown', look: 'smile', text: '찾는 사람에게는 당이 필요합니다. 뭐 마실래?' },
        {
          t: 'choice',
          prompt: '자판기에서 하나를 고른다.',
          note: '취향 선택 · 엔딩에는 영향이 없습니다',
          options: [
            {
              text: '따뜻한 코코아',
              set: { drink_choice: 'cocoa' },
              react: [
                { t: 'sfx', id: 'can_drop' },
                { t: 'say', who: 'unknown', look: 'smile', text: '4월에 코코아라. 의외로 낭만파네.' }
              ]
            },
            {
              text: '차가운 탄산수',
              set: { drink_choice: 'water' },
              react: [
                { t: 'sfx', id: 'can_drop' },
                { t: 'say', who: 'unknown', look: 'calm', text: '깔끔한 취향. 기억해 둘게.' }
              ]
            },
            {
              text: '네가 고르는 걸로',
              set: { drink_choice: 'same' },
              react: [
                { t: 'sfx', id: 'can_drop' },
                { t: 'say', who: 'unknown', look: 'shy', text: '그런 말, 아무렇지 않게 하는구나.' },
                { t: 'narr', text: '결국 같은 복숭아 소다가 두 캔 떨어졌다.' }
              ]
            }
          ]
        },
        { t: 'say', who: 'unknown', look: 'smile', text: '우리, 키링보다 다른 얘기를 더 많이 찾고 있는 것 같지 않아?' },
        { t: 'say', who: 'mc', text: '찾는 김에 얘기하는 거지.' },
        { t: 'say', who: 'unknown', look: 'shy', text: '그럼 찾고 나면 얘기 안 할 거야?' },
        { t: 'narr', text: '대답을 고르는 사이, 예비종이 울렸다.' }
      ]
    },

    {
      id: 's04',
      number: '04',
      title: '평범한 것들의 이름',
      chapter: 'AFTER SCHOOL',
      bg: 'bg04_window_afternoon',
      bgm: 'sunset',
      lines: [
        { t: 'narr', text: '방과 후. 우리는 아침에 못 본 운동장 쪽 교실부터 다시 살피기로 했다.' },
        { t: 'cg', show: 'cg01_desk_closeup', fade: 850 },
        { t: 'say', who: 'unknown', look: 'calm', text: '3학년이 되니까, 여기도 전부 마지막인 것처럼 보여.' },
        { t: 'say', who: 'mc', text: '아직 4월인데 벌써?' },
        { t: 'say', who: 'unknown', look: 'smile', text: '그러니까 더 이상하지. 끝은 멀었는데, 마음만 먼저 아쉬워.' },
        { t: 'sfx', id: 'wind_soft' },
        { t: 'say', who: 'unknown', look: 'serious', text: '있잖아. 너는 이 학교, 좋아해?' },
        {
          t: 'choice',
          prompt: '창밖의 운동장을 바라본다.',
          options: [
            {
              text: '좋아해. 아직 여기 있고 싶어.',
              affection: 1,
              set: { school_answer: 'positive' },
              react: [
                { t: 'say', who: 'unknown', look: 'smile', text: '다행이다. 나만 그런 줄 알았거든.' },
                { t: 'narr', text: '서로 같은 것을 아쉬워한다는 사실이, 생각보다 따뜻했다.' }
              ]
            },
            {
              text: '좋은 날도, 싫은 날도 있었지.',
              affection: 0,
              set: { school_answer: 'neutral' },
              react: [
                { t: 'say', who: 'unknown', look: 'calm', text: '그게 제일 솔직한 대답일지도 몰라.' }
              ]
            },
            {
              text: '솔직히 빨리 졸업하고 싶어.',
              affection: -1,
              set: { school_answer: 'negative' },
              react: [
                { t: 'say', who: 'unknown', look: 'serious', text: '…응. 그래도 언젠가 한 번쯤은 생각나겠지.' }
              ]
            }
          ]
        },
        { t: 'cg', hide: true, fade: 500 },
        { t: 'chara', show: true, look: 'calm' },
        { t: 'say', who: 'unknown', look: 'calm', text: '키링은 언니가 입학식 날 준 거야. 여기서 좋은 기억 많이 만들라고.' },
        { t: 'say', who: 'unknown', look: 'shy', text: '그래서 잃어버렸다는 말을 못 하겠더라.' },
        { t: 'say', who: 'mc', text: '그럼 오늘 안에 꼭 찾아야겠네.' },
        { t: 'say', who: 'unknown', look: 'smile', text: '응. 오늘을 좋은 기억으로 만들려면.' }
      ]
    },

    {
      id: 's05',
      number: '05',
      title: '찾았다',
      chapter: 'THE LAST PLACE',
      bg: 'bg03_corridor_day',
      bgm: 'sunset',
      lines: [
        { t: 'narr', text: '해가 기울 무렵, 우리는 처음 만났던 복도까지 돌아왔다.' },
        { t: 'chara', show: true, look: 'serious' },
        { t: 'say', who: 'unknown', look: 'serious', text: '여기도 없으면… 오늘은 포기해야 하나 봐.' },
        { t: 'say', who: 'mc', text: '잠깐. 아침에 여기 앉아 있었지?' },
        { t: 'narr', text: '벤치를 옆으로 조금 밀자, 벽과 바닥 사이에서 작은 금속빛이 반짝였다.' },
        { t: 'sfx', id: 'keychain_tinkle' },
        { t: 'say', who: 'unknown', look: 'blush', text: '…찾았다.' },
        { t: 'narr', text: '분홍색 꽃잎 한가운데 작은 교표가 달린 키링이었다.' },
        { t: 'say', who: 'unknown', look: 'smile', text: '진짜 있었네. 오늘 하루가 이제야 제자리로 돌아온 것 같아.' },
        { t: 'say', who: 'mc', text: '평범한 건 없어지고 나서야 눈에 들어오는 건가 봐.' },
        { t: 'say', who: 'unknown', look: 'shy', text: '너, 가끔 너무 그럴듯한 말을 해.' },
        { t: 'say', who: 'mc', text: '그런데 약속은?' },
        { t: 'say', who: 'unknown', look: 'calm', text: '약속?' },
        { t: 'say', who: 'mc', text: '이름 알려주기로 했잖아.' },
        { t: 'say', who: 'heroine', look: 'smile', text: '판교하. 3학년 2반 판교하.' },
        { t: 'say', who: 'heroine', look: 'shy', text: '이제 복도에서 마주치면 모른 척하면 안 돼, {name_a}.' },
        { t: 'narr', text: '이름을 알고 나자, 오늘의 장면들이 조금 더 선명해졌다.' }
      ]
    },

    {
      id: 's06',
      number: '06',
      title: '내일도, 같은 시간에',
      chapter: 'TEN MINUTES, ONE SPRING',
      bg: 'bg05_gate_sunset',
      bgm: 'ending',
      lines: [
        { t: 'narr', text: '해질녘 교문. 아침보다 길어진 그림자가 우리 사이에 나란히 누웠다.' },
        { t: 'cg', show: 'cg02_gate_sunset', fade: 900 },
        { t: 'say', who: 'heroine', look: 'smile', text: '오늘 정말 고마웠어.' },
        { t: 'say', who: 'mc', text: '찾아서 다행이네.' },
        { t: 'say', who: 'heroine', look: 'calm', text: '키링도 그렇지만… 네가 같이 있어 줘서.' },
        { t: 'say', who: 'heroine', look: 'shy', text: '평범한 하루가 조금 특별해지는 데는, 열 걸음이면 충분한가 봐.' },
        { t: 'narr', text: '교하는 키링을 가방에 단단히 매달고, 두 손으로 끈을 꼭 잡았다.' },
        { t: 'say', who: 'heroine', look: 'blush', text: '{name_a}. 내일도… 아침에 같이 걸을래?' },
        {
          t: 'choice',
          prompt: '봄바람이 대답을 기다린다.',
          options: [
            { text: '응. 내일은 내가 기다릴게.', affection: 1, set: { final_choice: 'yes' } },
            { text: '왜, 벌써 내가 보고 싶어?', set: { final_choice: 'tease' } },
            { text: '내일 일은 내일 생각할게.', set: { final_choice: 'hesitate' } }
          ]
        },
        { t: 'end' }
      ]
    }
  ]
};
