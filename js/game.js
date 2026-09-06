(() => {
  'use strict';

  const ASSETS = {
    bg01_gate_morning: 'assets/bg01_gate_morning.png',
    bg02_classroom_noon: 'assets/bg02_classroom_noon.png',
    bg03_corridor_day: 'assets/bg03_corridor_day.png',
    bg04_window_afternoon: 'assets/bg04_window_afternoon.png',
    bg05_gate_sunset: 'assets/bg05_gate_sunset.png',
    bg06_gym_afternoon: 'assets/bg06_gym_afternoon.png',
    cg01_desk_closeup: 'assets/cg01_desk_closeup.png',
    cg02_gate_sunset: 'assets/cg02_gate_sunset.png',
    cg03_face_blush: 'assets/cg03_face_blush.png'
  };

  const LOOKS = {
    calm: { src: 'assets/ch_stand_calm.png', crop: 'full' },
    serious: { src: 'assets/ch_full_calm.png', crop: 'full' },
    smile: { src: 'assets/ch_waist_smile.png', crop: 'waist' },
    shy: { src: 'assets/ch_waist_blush.png', crop: 'waist' },
    blush: { src: 'assets/ch_bust_blush.png', crop: 'bust' },
    // 체육시간(씬 04) 전용. 교복 스탠딩을 기준 이미지로 의상만 바꿔 만든 컷이라
    // 얼굴·머리·비율·포즈가 다른 컷과 같다. 미소 컷은 무표정 컷을 다시
    // 기준 이미지로 삼아 표정만 바꿨고, 정렬 오차는 최대 18px 이다.
    hoodie_calm: { src: 'assets/ch_stand_hoodie_calm.png', crop: 'full' },
    hoodie_smile: { src: 'assets/ch_stand_hoodie_smile.png', crop: 'full' }
  };

  const PRELOAD_ASSETS = [
    ...Object.values(ASSETS),
    ...Object.values(LOOKS).map((look) => look.src),
    'assets/title-logo-v2.png'
  ];

  /*
   * 스토리지 키에 붙은 버전은 씬 구성이 바뀔 때 올린다.
   * 씬을 중간에 끼워 넣으면 저장된 sceneIndex 가 다른 장면을 가리켜
   * 엉뚱한 곳에서 재개된다. 키를 올리면 옛 기록은 읽히지 않는다.
   * v3: 체육시간 씬(04)을 추가하면서 뒤 씬 인덱스가 하나씩 밀렸다.
   */
  const STORAGE = {
    config: 'pangyo-vn:config:v3',
    autosave: 'pangyo-vn:autosave:v3',
    slot: (number) => `pangyo-vn:slot:${number}:v3`,
    unlocks: 'pangyo-vn:unlocks:v3'
  };

  // 배경 크로스페이드 길이. 진행 대기도 같은 값을 쓴다.
  const BG_FADE = 700;
  const SCENE_FADE = 900;

  const DEFAULT_CONFIG = {
    textSpeed: 26,
    autoDelay: 2600,
    bgmVolume: 34,
    sfxVolume: 62,
    voiceVolume: 78,
    reducedMotion: false,
    muted: false
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const dom = {
    app: $('#app'),
    screens: $$('.screen'),
    loading: $('#loading-screen'),
    loadingProgress: $('#loading-progress'),
    loadingCount: $('#loading-count'),
    title: $('#title-screen'),
    game: $('#game-screen'),
    ending: $('#ending-screen'),
    start: $('#start-button'),
    continue: $('#continue-button'),
    stage: $('#stage'),
    bgA: $('#stage-bg-a'),
    bgB: $('#stage-bg-b'),
    characterGhost: $('#character-ghost'),
    character: $('#character'),
    cgLayer: $('#cg-layer'),
    cgImage: $('#cg-image'),
    sceneNumber: $('#scene-number'),
    sceneChapter: $('#scene-chapter'),
    sceneTitle: $('#scene-title'),
    sceneProgress: $('#scene-progress'),
    dialoguePanel: $('#dialogue-panel'),
    dialogueHitbox: $('#dialogue-hitbox'),
    dialogueText: $('#dialogue-text'),
    dialogueGhost: $('#dialogue-ghost'),
    speaker: $('#speaker-name'),
    next: $('#next-indicator'),
    choicePanel: $('#choice-panel'),
    choicePrompt: $('#choice-prompt'),
    choiceList: $('#choice-list'),
    choiceNote: $('#choice-note'),
    dateCard: $('#date-card'),
    dateMain: $('#date-card-main'),
    dateSub: $('#date-card-sub'),
    storyTitleCard: $('#story-title-card'),
    auto: $('#auto-button'),
    sound: $('#sound-toggle'),
    fullscreen: $('#fullscreen-toggle'),
    modalRoot: $('#modal-root'),
    nameForm: $('#name-form'),
    nameInput: $('#player-name'),
    saveSlots: $('#save-slots'),
    loadSlots: $('#load-slots'),
    logList: $('#log-list'),
    galleryGrid: $('#gallery-grid'),
    toast: $('#toast'),
    endingBg: $('#ending-bg'),
    endingCode: $('#ending-code'),
    endingTitle: $('#ending-title'),
    endingSubtitle: $('#ending-subtitle'),
    endingEpilogue: $('#ending-epilogue'),
    endingMeta: $('#ending-meta'),
    replay: $('#replay-button'),
    titleButton: $('#title-button'),
    endingTitleButton: $('#ending-title-button'),
    config: {
      textSpeed: $('#text-speed'),
      autoDelay: $('#auto-delay'),
      bgmVolume: $('#bgm-volume'),
      sfxVolume: $('#sfx-volume'),
      voiceVolume: $('#voice-volume'),
      reducedMotion: $('#reduced-motion'),
      textSpeedValue: $('#text-speed-value'),
      autoDelayValue: $('#auto-delay-value'),
      bgmVolumeValue: $('#bgm-volume-value'),
      sfxVolumeValue: $('#sfx-volume-value'),
      voiceVolumeValue: $('#voice-volume-value')
    }
  };

  let config = { ...DEFAULT_CONFIG, ...readJSON(STORAGE.config, {}) };
  let state = freshState('도윤');
  let activeBg = 'a';
  let typeTimer = 0;
  let voiceLine = '';
  let lineGhostTimer = 0;
  let reactTimer = 0;
  let transitionTimer = 0;
  let autoTimer = 0;
  let toastTimer = 0;
  let characterTimer = 0;
  let isTyping = false;
  let fullText = '';
  let busy = false;
  let autoMode = false;
  let currentModal = null;
  let transitionToken = 0;

  class Soundscape {
    constructor() {
      this.ctx = null;
      this.bgmGain = null;
      this.sfxGain = null;
      this.track = [];
      this.theme = null;
      this.muted = config.muted;
    }

    ensure() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        return true;
      }
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      try {
        this.ctx = new AudioContext();
        this.bgmGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.bgmGain.connect(this.ctx.destination);
        this.sfxGain.connect(this.ctx.destination);
        this.updateVolumes();
        return true;
      } catch (_) {
        return false;
      }
    }

    updateVolumes() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const bgm = this.muted ? 0 : (config.bgmVolume / 100) * .18;
      const sfx = this.muted ? 0 : (config.sfxVolume / 100) * .24;
      this.bgmGain.gain.cancelScheduledValues(now);
      this.sfxGain.gain.cancelScheduledValues(now);
      this.bgmGain.gain.linearRampToValueAtTime(bgm, now + .08);
      this.sfxGain.gain.linearRampToValueAtTime(sfx, now + .08);
    }

    setMuted(value) {
      this.muted = value;
      config.muted = value;
      this.updateVolumes();
      voice.updateVolume();
      updateSoundButton();
      saveConfig();
    }

    playBgm(theme = 'morning') {
      if (!this.ensure() || this.theme === theme) return;
      this.stopBgm();
      this.theme = theme;
      const chords = {
        morning: [261.63, 329.63, 392.00],
        day: [293.66, 369.99, 440.00],
        walk: [246.94, 311.13, 369.99],
        sunset: [220.00, 277.18, 329.63],
        ending: [261.63, 392.00, 493.88]
      };
      const frequencies = chords[theme] || chords.morning;
      const now = this.ctx.currentTime;
      const filter = this.ctx.createBiquadFilter();
      const localGain = this.ctx.createGain();
      filter.type = 'lowpass';
      filter.frequency.value = theme === 'sunset' ? 720 : 920;
      filter.Q.value = .4;
      localGain.gain.setValueAtTime(0, now);
      localGain.gain.linearRampToValueAtTime(.2, now + 2.4);
      localGain.connect(filter);
      filter.connect(this.bgmGain);

      frequencies.forEach((frequency, index) => {
        const oscillator = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        oscillator.type = index === 0 ? 'sine' : 'triangle';
        oscillator.frequency.value = frequency / (index === 0 ? 2 : 1);
        oscillator.detune.value = index * 2 - 2;
        gain.gain.value = index === 0 ? .13 : .055;
        oscillator.connect(gain);
        gain.connect(localGain);
        oscillator.start();
        this.track.push(oscillator);
      });

      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = .075;
      lfoGain.gain.value = .035;
      lfo.connect(lfoGain);
      lfoGain.connect(localGain.gain);
      lfo.start();
      this.track.push(lfo, localGain, filter);
    }

    stopBgm() {
      this.track.forEach((node) => {
        try { if (typeof node.stop === 'function') node.stop(); } catch (_) {}
        try { node.disconnect(); } catch (_) {}
      });
      this.track = [];
      this.theme = null;
    }

    tone(frequency, duration = .18, delay = 0, volume = .7, type = 'sine') {
      if (!this.ensure() || this.muted) return;
      const start = this.ctx.currentTime + delay;
      const oscillator = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + .012);
      gain.gain.exponentialRampToValueAtTime(.001, start + duration);
      oscillator.connect(gain);
      gain.connect(this.sfxGain);
      oscillator.start(start);
      oscillator.stop(start + duration + .03);
    }

    noise(duration = .25, volume = .12) {
      if (!this.ensure() || this.muted) return;
      const length = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < length; index += 1) {
        data[index] = (Math.random() * 2 - 1) * (1 - index / length);
      }
      const source = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 900;
      gain.gain.value = volume;
      source.buffer = buffer;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      source.start();
    }

    play(id) {
      const patterns = {
        school_bell: () => [659, 523, 587, 392].forEach((f, i) => this.tone(f, .7, i * .42, .42, 'sine')),
        can_drop: () => { this.tone(164, .13, 0, .45, 'triangle'); this.tone(220, .18, .11, .3, 'sine'); },
        keychain_tinkle: () => [1047, 1319, 1568].forEach((f, i) => this.tone(f, .45, i * .1, .28, 'sine')),
        footstep_01: () => { this.noise(.12, .12); window.setTimeout(() => this.noise(.1, .09), 190); },
        cloth_bag: () => this.noise(.3, .1),
        wind_soft: () => this.noise(.8, .055),
        ui: () => this.tone(720, .08, 0, .16, 'sine'),
        choice: () => { this.tone(587, .16, 0, .25); this.tone(880, .22, .08, .2); }
      };
      (patterns[id] || patterns.ui)();
    }
  }

  const soundscape = new Soundscape();

  /*
   * 대사 의성음 (모동숲 방식).
   *
   * 녹음본 대신 글자마다 짧은 소리를 합성한다. 한글 중성을 실제 모음
   * 포먼트로 매핑해서, 무작위 삑 소리가 아니라 그 문장을 말하는 것처럼
   * 들리게 한다. 에셋이 없으니 대사를 늘려도 그대로 따라오고,
   * 플레이어가 이름을 바꿔도 문제가 없다.
   */

  // 중성 21개 -> (F1, F2). 여성 화자 기준 대략값.
  // ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ
  const VOWEL_FORMANTS = [
    [900, 1400], [600, 2100], [880, 1500], [600, 2150], [700, 1150],
    [520, 2100], [690, 1250], [520, 2150], [500, 900], [800, 1300],
    [600, 2000], [500, 1900], [500, 1000], [400, 800], [650, 1200],
    [520, 2050], [380, 2200], [400, 900], [420, 1500], [400, 1900], [330, 2600]
  ];
  const HANGUL_BASE = 0xac00;
  const HANGUL_LAST = 0xd7a3;

  const voice = {
    gain: null,
    pitch: 330,
    // 한 대사 안에서의 진행도. 문장 끝 억양을 그리는 데 쓴다.
    spoken: 0,
    total: 0,
    ending: '',

    ensure() {
      if (!soundscape.ensure()) return false;
      if (!this.gain) {
        this.gain = soundscape.ctx.createGain();
        this.gain.connect(soundscape.ctx.destination);
      }
      this.updateVolume();
      return true;
    },

    updateVolume() {
      if (!this.gain) return;
      const value = Number.isFinite(config.voiceVolume) ? config.voiceVolume : DEFAULT_CONFIG.voiceVolume;
      this.gain.gain.value = config.muted ? 0 : (value / 100) * .12;
    },

    /** 대사 하나를 시작할 때 억양 계산에 필요한 정보를 잡아 둔다. */
    begin(text) {
      this.spoken = 0;
      this.total = 0;
      for (const ch of text) {
        const code = ch.codePointAt(0);
        if (code >= HANGUL_BASE && code <= HANGUL_LAST) this.total += 1;
      }
      const trimmed = text.trim();
      this.ending = trimmed ? trimmed[trimmed.length - 1] : '';
    },

    /** 글자 하나에 대응하는 소리. 한글이 아니면 조용히 넘어간다. */
    say(ch) {
      const code = ch ? ch.codePointAt(0) : 0;
      if (code < HANGUL_BASE || code > HANGUL_LAST) return;
      if (!this.ensure() || config.muted) return;

      const index = code - HANGUL_BASE;
      const [f1, f2] = VOWEL_FORMANTS[Math.floor(index / 28) % 21];
      const hasFinal = index % 28 !== 0;

      // 문장 끝 억양: 물음표면 올라가고, 마침표나 말줄임이면 내려간다.
      const progress = this.total > 1 ? this.spoken / (this.total - 1) : 0;
      let contour = 1;
      if (this.ending === '?') contour = 1 + .16 * progress * progress;
      else if (this.ending === '.' || this.ending === '…') contour = 1 - .10 * progress;
      // 글자마다 살짝 흔들지 않으면 기계적으로 들린다.
      const f0 = this.pitch * contour * (1 + (Math.random() - .5) * .14);
      this.spoken += 1;

      const ctx = soundscape.ctx;
      const now = ctx.currentTime;
      // 받침이 있으면 더 빨리 닫는다. 「듣」이 「드」보다 짧게 끊긴다.
      const dur = hasFinal ? .062 : .085;

      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f0;

      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(1, now + .006);
      envelope.gain.exponentialRampToValueAtTime(.001, now + dur);

      // 포먼트 두 개를 밴드패스로 근사한다.
      [[f1, 1], [f2, .5]].forEach(([frequency, level]) => {
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = frequency;
        filter.Q.value = 5;
        const trim = ctx.createGain();
        trim.gain.value = level;
        osc.connect(filter);
        filter.connect(trim);
        trim.connect(envelope);
      });

      envelope.connect(this.gain);
      osc.start(now);
      osc.stop(now + dur + .02);
    },

    stop() {
      this.spoken = this.total;
    }
  };

  function freshState(playerName) {
    return {
      version: 3,
      playerName: playerName || '도윤',
      sceneIndex: 0,
      lineIndex: 0,
      queue: [],
      variables: {
        affection: 0,
        drink_choice: null,
        school_answer: null,
        final_choice: null
      },
      history: [],
      bg: 'bg01_gate_morning',
      cg: null,
      character: { visible: false, look: 'calm' },
      current: null,
      awaiting: 'none',
      currentEnding: null,
      ended: false,
      startedAt: Date.now(),
      elapsed: 0
    };
  }

  function readJSON(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  function saveConfig() {
    writeJSON(STORAGE.config, config);
  }

  function snapshotState() {
    const copy = JSON.parse(JSON.stringify(state));
    copy.elapsed = getElapsed();
    copy.savedAt = Date.now();
    return copy;
  }

  function getElapsed() {
    return (state.elapsed || 0) + (state.startedAt ? Date.now() - state.startedAt : 0);
  }

  function saveAutosave() {
    if (!state.current && state.lineIndex === 0) return;
    writeJSON(STORAGE.autosave, snapshotState());
    updateContinueButton();
  }

  function updateContinueButton() {
    dom.continue.disabled = !readJSON(STORAGE.autosave);
  }

  function setScreen(id) {
    dom.screens.forEach((screen) => screen.classList.toggle('is-active', screen.id === id));
  }

  function showTitle(message = '') {
    if (dom.game.classList.contains('is-active')) saveAutosave();
    cancelAllTimers();
    autoMode = false;
    dom.auto.classList.remove('is-active');
    soundscape.playBgm('morning');
    setScreen('title-screen');
    updateContinueButton();
    if (message) showToast(message);
  }

  function newGame(name) {
    cancelAllTimers();
    state = freshState((name || '도윤').trim().slice(0, 8) || '도윤');
    activeBg = 'a';
    dom.bgA.src = ASSETS.bg01_gate_morning;
    dom.bgB.src = ASSETS.bg01_gate_morning;
    dom.bgA.classList.add('is-visible');
    dom.bgB.classList.remove('is-visible');
    setCg(null, true);
    setCharacter(false, 'calm');
    setScreen('game-screen');
    enterScene(0, true);
    soundscape.ensure();
    advanceStory();
  }

  function cancelAllTimers() {
    window.clearInterval(typeTimer);
    window.clearTimeout(transitionTimer);
    window.clearTimeout(autoTimer);
    window.clearTimeout(characterTimer);
    typeTimer = 0;
    transitionTimer = 0;
    autoTimer = 0;
    characterTimer = 0;
    window.clearTimeout(reactTimer);
    reactTimer = 0;
    voice.stop();
    dom.character.classList.remove('reacts-back', 'reacts-forward');
    dom.character.style.transition = '';
    dom.character.style.opacity = '';
    dom.character.style.transform = '';
    dom.characterGhost.hidden = true;
    dom.characterGhost.style.transition = '';
    dom.characterGhost.style.opacity = '';
    isTyping = false;
    busy = false;
    transitionToken += 1;
  }

  function enterScene(index, immediate = false) {
    const scene = window.STORY.scenes[index];
    if (!scene) return;
    state.sceneIndex = index;
    dom.sceneNumber.textContent = scene.number || String(index + 1).padStart(2, '0');
    dom.sceneChapter.textContent = scene.chapter || '';
    dom.sceneTitle.textContent = scene.title;
    setBackground(scene.bg, immediate, SCENE_FADE);
    setCg(null, immediate);
    setCharacter(false, state.character.look || 'calm', immediate ? 0 : SCENE_FADE);
    if (!immediate) {
      // 장면이 바뀌는 동안에는 이전 대사를 남겨두지 않는다.
      dom.dialoguePanel.hidden = true;
      dom.dialogueText.textContent = '';
      dom.dialogueGhost.textContent = '';
      dom.speaker.hidden = true;
    }
    soundscape.playBgm(scene.bgm || 'day');
    updateProgress();
  }

  function getNextLine() {
    if (state.queue.length) return state.queue.shift();
    let scene = window.STORY.scenes[state.sceneIndex];
    if (!scene) return { t: 'end' };
    if (state.lineIndex < scene.lines.length) {
      const line = scene.lines[state.lineIndex];
      state.lineIndex += 1;
      return line;
    }
    if (state.sceneIndex < window.STORY.scenes.length - 1) {
      state.sceneIndex += 1;
      state.lineIndex = 0;
      state.current = null;
      state.awaiting = 'none';
      enterScene(state.sceneIndex);
      scene = window.STORY.scenes[state.sceneIndex];
      const line = scene.lines[state.lineIndex];
      state.lineIndex += 1;
      /*
       * 배경이 다 넘어간 뒤에 첫 줄을 낸다. 곧바로 내면 인물이 사라진
       * 화면에 새 대사만 튀어나와서 장면이 끊겨 보인다.
       */
      state.queue.unshift(line);
      return { t: 'wait', ms: SCENE_FADE + 120 };
    }
    return { t: 'end' };
  }

  function advanceStory() {
    if (busy || currentModal || state.awaiting === 'choice' || state.ended) return;
    window.clearTimeout(autoTimer);
    autoTimer = 0;
    voice.stop();
    dom.next.classList.remove('is-visible');
    const line = getNextLine();
    handleLine(line);
  }

  function handleLine(line) {
    if (!line) return;
    state.current = line;
    updateProgress();

    switch (line.t) {
      case 'say':
      case 'narr':
        displayTextLine(line);
        break;
      case 'choice':
        showChoices(line);
        break;
      case 'bg': {
        const fade = Math.min(line.fade || BG_FADE, 1200);
        setBackground(line.to, false, fade);
        // 배경이 다 넘어간 뒤에 다음 대사가 시작하도록 같은 값을 쓴다.
        continueAfter(fade + 60);
        break;
      }
      case 'cg':
        if (line.hide) setCg(null);
        else setCg(line.show);
        continueAfter(Math.min(line.fade || 500, 850));
        break;
      case 'chara':
        setCharacter(Boolean(line.show), line.look || state.character.look || 'calm');
        continueAfter(120);
        break;
      case 'face':
        setCharacter(true, line.look || line.id || 'calm');
        continueAfter(100);
        break;
      case 'bgm':
        soundscape.playBgm(line.id || 'day');
        continueAfter(50);
        break;
      case 'sfx':
        soundscape.play(line.id);
        continueAfter(80);
        break;
      case 'wait':
        continueAfter(line.ms || 500);
        break;
      case 'datecard':
        showDateCard(line);
        break;
      case 'title':
        showStoryTitle(line);
        break;
      case 'end':
        showEnding();
        break;
      default:
        continueAfter(0);
    }
  }

  function continueAfter(milliseconds) {
    busy = true;
    const token = ++transitionToken;
    transitionTimer = window.setTimeout(() => {
      if (token !== transitionToken) return;
      busy = false;
      advanceStory();
    }, milliseconds);
  }

  function displayTextLine(line, immediate = false, addHistory = true) {
    state.awaiting = 'text';
    const text = formatText(line.text || '');
    const speaker = resolveSpeaker(line);

    if ((line.who === 'heroine' || line.who === 'unknown') && line.look) {
      setCharacter(true, line.look);
    }

    /*
     * 이전 문장을 잔상으로 남겨 크로스페이드한다.
     * 지우고 곧바로 타이핑을 시작하면 문장이 툭 끊겨 보인다.
     * 배경(1초)·인물(0.52초)은 페이드하는데 글자만 즉시 바뀌면
     * 전환 전체가 거칠게 느껴진다.
     */
    const previousText = dom.dialogueText.textContent;
    const softSwap = Boolean(previousText) && !immediate && !config.reducedMotion;

    window.clearTimeout(lineGhostTimer);
    dom.dialogueGhost.classList.remove('is-leaving');
    dom.dialogueText.classList.remove('is-entering');
    dom.speaker.classList.remove('is-entering');

    if (softSwap) {
      dom.dialogueGhost.textContent = previousText;
      dom.dialogueGhost.classList.toggle('is-narration', dom.dialogueText.classList.contains('is-narration'));
    } else {
      dom.dialogueGhost.textContent = '';
    }

    /*
     * 인물을 상시로 움직이지 않는다.
     *
     * 호흡(4.6초 주기 2px)과 말하기 기울임(대사마다 3px, 0.5초 트랜지션)을
     * 둘 다 돌렸더니, 가만히 있어야 할 상태에서 프레임 간 이동이 70건
     * 넘게 잡혔다. 개별 이동은 최대 2.5px 로 작지만 끊이지 않아서
     * 시야 가장자리에서 계속 흔들리는 것으로 읽힌다.
     *
     * 감정 리액션(playReaction)만 남긴다. 그건 컷이 바뀌는 순간에만
     * 한 번 일어나고 크로스페이드에 가려진다.
     */
    const heroineSpeaking = line.t === 'say' && line.who !== 'mc';
    // 히로인이 말할 때만 의성음을 낸다. 독백과 주인공 대사는 조용히.
    voiceLine = heroineSpeaking ? text : '';
    voice.begin(voiceLine);

    dom.speaker.hidden = !speaker;
    dom.speaker.textContent = speaker || '';
    dom.dialogueText.classList.toggle('is-narration', line.t === 'narr');
    dom.dialoguePanel.hidden = false;
    dom.dialogueText.textContent = '';
    fullText = text;

    if (softSwap) {
      void dom.dialoguePanel.offsetWidth;
      dom.dialogueGhost.classList.add('is-leaving');
      dom.dialogueText.classList.add('is-entering');
      if (speaker) dom.speaker.classList.add('is-entering');
      lineGhostTimer = window.setTimeout(() => {
        dom.dialogueGhost.classList.remove('is-leaving');
        dom.dialogueGhost.textContent = '';
        dom.dialogueText.classList.remove('is-entering');
        dom.speaker.classList.remove('is-entering');
        lineGhostTimer = 0;
      }, 320);
    }

    if (addHistory) {
      state.history.push({
        speaker: speaker || '독백',
        text,
        narr: line.t === 'narr',
        scene: window.STORY.scenes[state.sceneIndex].title
      });
      if (state.history.length > 180) state.history.shift();
    }

    if (immediate || config.reducedMotion) {
      dom.dialogueText.textContent = text;
      completeTyping();
      return;
    }

    const characters = Array.from(text);
    let index = 0;
    isTyping = true;
    typeTimer = window.setInterval(() => {
      index += 1;
      dom.dialogueText.textContent = characters.slice(0, index).join('');
      if (voiceLine) voice.say(characters[index - 1]);
      if (index >= characters.length) completeTyping();
    }, config.textSpeed);
  }

  function completeTyping() {
    window.clearInterval(typeTimer);
    typeTimer = 0;
    isTyping = false;
    dom.dialogueText.textContent = fullText;
    dom.next.classList.add('is-visible');
    saveAutosave();
    scheduleAuto();
  }

  function skipOrAdvance() {
    if (currentModal || busy || state.awaiting === 'choice' || state.ended) return;
    soundscape.ensure();
    if (isTyping) {
      completeTyping();
      return;
    }
    if (state.awaiting === 'text') {
      state.awaiting = 'none';
      advanceStory();
    }
  }

  function resolveSpeaker(line) {
    if (line.t !== 'say') return '';
    if (line.who === 'mc') return state.playerName;
    if (line.who === 'heroine') return window.STORY.heroineName;
    return window.STORY.unknownName;
  }

  function formatText(text) {
    const name = state.playerName || '도윤';
    return String(text)
      .replaceAll('{name_a}', vocative(name))
      .replaceAll('{name}', name);
  }

  function vocative(name) {
    const last = name.codePointAt(name.length - 1);
    if (last >= 0xac00 && last <= 0xd7a3) {
      return `${name}${(last - 0xac00) % 28 === 0 ? '야' : '아'}`;
    }
    return `${name}아`;
  }

  function showChoices(line) {
    state.awaiting = 'choice';
    autoTimer = window.clearTimeout(autoTimer);
    dom.choicePrompt.textContent = line.prompt || '어떻게 대답할까?';
    dom.choiceNote.textContent = line.note || '';
    dom.choiceNote.hidden = !line.note;
    dom.choiceList.replaceChildren();

    line.options.forEach((option, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice-button';
      button.dataset.number = String(index + 1).padStart(2, '0');
      button.textContent = formatText(option.text);
      button.addEventListener('click', () => chooseOption(option));
      dom.choiceList.append(button);
    });

    dom.choicePanel.hidden = false;
    saveAutosave();
    window.setTimeout(() => $('.choice-button', dom.choiceList)?.focus(), 120);
  }

  function chooseOption(option) {
    soundscape.play('choice');
    state.variables.affection += Number(option.affection || 0);
    if (option.set) Object.assign(state.variables, option.set);
    if (option.react?.length) state.queue = [...option.react, ...state.queue];
    state.awaiting = 'none';
    state.current = null;
    dom.choicePanel.hidden = true;
    dom.choiceList.replaceChildren();
    saveAutosave();
    advanceStory();
  }

  /*
   * 배경 크로스페이드.
   *
   * CSS 는 opacity 1s 로 고정돼 있었는데 진행 대기는 최대 700ms 였다.
   * 시나리오가 fade: 700 이라고 적어도 실제로는 1000ms 가 걸려서, 배경이
   * 아직 바뀌는 중에 다음 대사가 타이핑되기 시작했다. 길이를 인라인으로
   * 지정해 대기 시간과 맞춘다.
   */
  function setBackground(key, immediate = false, duration = BG_FADE) {
    if (!ASSETS[key]) return;
    state.bg = key;
    const visible = activeBg === 'a' ? dom.bgA : dom.bgB;
    const next = activeBg === 'a' ? dom.bgB : dom.bgA;
    [visible, next].forEach((el) => {
      el.style.transitionDuration = immediate ? '0s' : `.8s, ${duration}ms`;
    });
    if (immediate) {
      visible.src = ASSETS[key];
      next.src = ASSETS[key];
      visible.classList.add('is-visible');
      next.classList.remove('is-visible');
      return;
    }
    if (visible.src.endsWith(ASSETS[key])) return;
    next.src = ASSETS[key];
    next.classList.add('is-visible');
    visible.classList.remove('is-visible');
    activeBg = activeBg === 'a' ? 'b' : 'a';
  }

  /*
   * 표정이 바뀔 때 한 번만 주는 반응. 감정 방향만 아주 얕게 표현한다.
   * 여기 없는 표정은 반응하지 않는다. 매 줄 움직이면 산만해진다.
   */
  const LOOK_REACTIONS = {
    shy: 'reacts-back',
    blush: 'reacts-back',
    smile: 'reacts-forward',
    hoodie_smile: 'reacts-forward'
  };

  function playReaction(look) {
    const cls = LOOK_REACTIONS[look];
    window.clearTimeout(reactTimer);
    dom.character.classList.remove('reacts-back', 'reacts-forward');
    if (!cls || config.reducedMotion) return;
    // 인라인 transform 이 남아 있으면 클래스가 묻힌다. 등장 직후가 그렇다.
    if (dom.character.style.transform) return;
    dom.character.classList.add(cls);
    reactTimer = window.setTimeout(() => {
      dom.character.classList.remove('reacts-back', 'reacts-forward');
      reactTimer = 0;
    }, 320);
  }

  function setCharacter(visible, look = 'calm', fadeOut = 0) {
    const selected = LOOKS[look] || LOOKS.calm;
    const nextLook = LOOKS[look] ? look : 'calm';
    const changed = dom.character.getAttribute('src') !== selected.src;
    const wasVisible = !dom.character.hidden;
    const previous = {
      src: dom.character.getAttribute('src'),
      crop: dom.character.dataset.look || 'full',
      emotion: dom.character.dataset.emotion || 'calm'
    };
    state.character = { visible, look: nextLook };

    if (!visible) {
      window.clearTimeout(characterTimer);
      characterTimer = 0;
      dom.characterGhost.hidden = true;
      dom.characterGhost.style.transition = '';
      dom.characterGhost.style.opacity = '';

      /*
       * 장면이 바뀔 때는 배경과 함께 서서히 사라진다.
       *
       * 즉시 감추면 인물이 툭 없어졌다가 1~2초 뒤 다시 나타나서 깜박이는
       * 것처럼 보인다. 실측으로 전환마다 2.4초·1.0초씩 완전히 비어 있었다.
       * 배경 크로스페이드와 같은 길이로 함께 흐려지면 화면 전체가 한 번에
       * 넘어가는 것으로 읽힌다.
       */
      if (fadeOut > 0 && !config.reducedMotion && !dom.character.hidden) {
        dom.character.style.transition = `opacity ${fadeOut}ms ease`;
        dom.character.style.opacity = '0';
        characterTimer = window.setTimeout(() => {
          dom.character.hidden = true;
          dom.character.style.transition = '';
          dom.character.style.opacity = '';
          dom.character.style.transform = '';
          characterTimer = 0;
        }, fadeOut);
        return;
      }

      /*
       * 장면이 바뀔 때 enterScene 이 여기를 부른다. 그냥 감춘다.
       *
       * 서서히 사라지게 해 봤지만 오히려 나빴다. 인물이 흐려지는
       * 420ms 뒤에 다음 장면에서 다시 나타나는 페이드가 이어져,
       * 인물이 옅게 보이는 시간이 두 배로 늘었다. 실측으로 흐린
       * 프레임 비율이 2.0% 에서 6.9% 로 올랐다.
       * 장면 전환에는 배경 크로스페이드(1초)가 함께 돌기 때문에
       * 즉시 감추는 편이 덜 눈에 띈다.
       */
      dom.character.hidden = true;
      dom.character.style.transition = '';
      dom.character.style.opacity = '';
      dom.character.style.transform = '';
      return;
    }

    // 진행 중이던 페이드가 있었는지. 있으면 함부로 걷어내지 않는다.
    const wasFading = characterTimer !== 0;
    window.clearTimeout(characterTimer);
    characterTimer = 0;

    const crossfade = changed && wasVisible && !config.reducedMotion;

    if (crossfade) {
      /*
       * 진행 중이던 페이드를 끊을 때 인물이 깜빡이지 않게 한다.
       *
       * 두 가지를 지킨다.
       *
       * 1. 잔상은 화면에 더 많이 남아 있는 쪽을 쓴다.
       *    페이드 초반에 끊기면 새 그림은 거의 안 보이고 이전 그림이
       *    대부분을 차지한다. 그때는 이전 그림을 잔상으로 넘겨야 한다.
       * 2. 잔상은 항상 완전히 보이는 상태에서 사라지기 시작한다.
       *    끊긴 시점의 낮은 투명도를 물려받으면 새 그림(0)과 겹쳐
       *    둘 다 흐려진다. 실측으로 총량이 0 까지 떨어져 인물이
       *    잠깐 사라졌다. 전체 프레임의 17%.
       */
      const ghost = dom.characterGhost;
      const charOpacity = parseFloat(window.getComputedStyle(dom.character).opacity);
      const ghostOpacity = ghost.hidden
        ? 0
        : parseFloat(window.getComputedStyle(ghost).opacity) || 0;
      const keepOlder = !ghost.hidden
        && ghostOpacity > (Number.isFinite(charOpacity) ? charOpacity : 1);

      ghost.style.transition = 'none';
      if (!keepOlder) {
        ghost.src = previous.src;
        ghost.dataset.look = previous.crop;
        ghost.dataset.emotion = previous.emotion;
      }
      ghost.hidden = false;
      ghost.style.opacity = '1';

      dom.character.style.transition = 'none';
      dom.character.style.opacity = '0';
      dom.character.style.transform = '';
    } else if (wasFading) {
      /*
       * 같은 컷으로 다시 호출됐는데 페이드가 진행 중이면 그대로 둔다.
       *
       * 여기서 잔상을 숨겨 버리면 새 그림이 아직 흐린 상태라 화면에서
       * 인물이 순간적으로 옅어진다. 실측으로 총량이 0.87 에서 0.34 로
       * 떨어졌다. 정리 타이머만 다시 걸어 준다.
       */
      dom.character.style.transition = '';
      dom.character.style.opacity = '1';
      characterTimer = window.setTimeout(() => {
        dom.characterGhost.hidden = true;
        dom.characterGhost.style.opacity = '';
        dom.character.style.opacity = '';
        characterTimer = 0;
      }, 480);
    } else {
      dom.characterGhost.hidden = true;
      dom.characterGhost.style.transition = '';
      dom.characterGhost.style.opacity = '';
      dom.character.style.transition = '';
      dom.character.style.opacity = '';
    }

    /*
     * 크롭(data-look)은 height 와 bottom 을 바꾸고 이 둘에는 트랜지션이 없다.
     * 보이는 상태에서 바꾸면 그대로 튄다(실측 91.65px). 기하를 먼저
     * 확정하고 그 다음에 화면에 올린다.
     */
    dom.character.src = selected.src;
    dom.character.dataset.look = selected.crop;
    dom.character.dataset.emotion = nextLook;
    dom.character.alt = `${window.STORY.heroineName} · ${look}`;
    dom.character.hidden = false;

    if (crossfade) {
      void dom.stage.offsetWidth;   // 위에서 준 시작값을 확정시킨다
      dom.character.style.transition = '';
      dom.character.style.opacity = '1';
      dom.characterGhost.style.transition = '';
      dom.characterGhost.style.opacity = '0';
      characterTimer = window.setTimeout(() => {
        dom.characterGhost.hidden = true;
        dom.characterGhost.style.opacity = '';
        dom.character.style.opacity = '';
        characterTimer = 0;
        playReaction(nextLook);
      }, 480);
    } else if (!wasVisible && !config.reducedMotion) {
      /*
       * 첫 등장도 animation 이 아니라 transition 으로 한다.
       * animation 은 도중에 클래스를 떼면 값이 기본값으로 튄다.
       * 등장이 끝나기 전에 다음 대사로 넘어가면 그 튐이 보인다.
       */
      /*
       * 등장은 위치를 옮기지 않고 투명도만 올린다.
       *
       * 예전에는 translateY(24px) 에서 미끄러져 들어왔는데, transform
       * 트랜지션이 0.5초인 반면 opacity 는 0.38초라 이미 불투명해진
       * 뒤에도 120ms 동안 계속 움직였다. 장면이 바뀔 때마다 인물이
       * 미세하게 흔들리는 원인이었다. 장면 전환에는 배경 크로스페이드가
       * 함께 돌기 때문에 위치 이동이 없어도 등장이 밋밋하지 않다.
       */
      dom.character.style.transition = 'none';
      dom.character.style.opacity = '0';
      dom.character.style.transform = '';
      void dom.stage.offsetWidth;
      dom.character.style.transition = '';
      dom.character.style.opacity = '1';
      characterTimer = window.setTimeout(() => {
        dom.character.style.opacity = '';
        characterTimer = 0;
      }, 460);
    }
  }

  function setCg(key, immediate = false) {
    state.cg = key || null;
    if (!key || !ASSETS[key]) {
      dom.cgLayer.classList.remove('is-visible');
      if (immediate) {
        dom.cgLayer.hidden = true;
      } else {
        window.setTimeout(() => {
          if (!state.cg) dom.cgLayer.hidden = true;
        }, 720);
      }
      return;
    }
    unlock(key);
    dom.cgImage.src = ASSETS[key];
    dom.cgLayer.hidden = false;
    if (immediate) dom.cgLayer.classList.add('is-visible');
    else requestAnimationFrame(() => dom.cgLayer.classList.add('is-visible'));
  }

  function showDateCard(line) {
    busy = true;
    dom.dialoguePanel.hidden = true;
    dom.dateMain.textContent = line.text;
    dom.dateSub.textContent = line.sub || '';
    dom.dateCard.hidden = false;
    soundscape.tone(880, .45, .2, .14);
    continueCard(dom.dateCard, 2300);
  }

  function showStoryTitle(line) {
    busy = true;
    dom.dialoguePanel.hidden = true;
    dom.storyTitleCard.hidden = false;
    continueCard(dom.storyTitleCard, 2500);
  }

  function continueCard(card, delay) {
    const token = ++transitionToken;
    transitionTimer = window.setTimeout(() => {
      if (token !== transitionToken) return;
      card.hidden = true;
      dom.dialoguePanel.hidden = false;
      busy = false;
      advanceStory();
    }, config.reducedMotion ? 250 : delay);
  }

  function updateProgress() {
    const scene = window.STORY.scenes[state.sceneIndex];
    if (!scene) return;
    const sceneFraction = Math.min(1, state.lineIndex / Math.max(scene.lines.length, 1));
    const progress = ((state.sceneIndex + sceneFraction) / window.STORY.scenes.length) * 100;
    dom.sceneProgress.style.width = `${Math.max(1, progress)}%`;
  }

  function determineEnding() {
    const { affection, final_choice: finalChoice } = state.variables;
    if (affection >= 2 && (finalChoice === 'yes' || finalChoice === 'tease')) return 'good';
    if (affection >= 0 || finalChoice !== 'hesitate') return 'normal';
    return 'other';
  }

  function showEnding(forcedKey = null) {
    cancelAllTimers();
    const key = forcedKey || state.currentEnding || determineEnding();
    const ending = window.ENDINGS[key];
    state.currentEnding = key;
    state.ended = true;
    state.awaiting = 'none';
    unlock(`ending:${key}`);
    if (key === 'good') unlock('cg03_face_blush');
    dom.endingBg.src = ASSETS[ending.cg];
    dom.endingCode.textContent = ending.code;
    dom.endingTitle.textContent = ending.title;
    dom.endingSubtitle.textContent = ending.subtitle;
    dom.endingEpilogue.replaceChildren(...ending.epilogue.map((text) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      return paragraph;
    }));
    const unlockedEndings = getUnlocks().filter((item) => item.startsWith('ending:')).length;
    dom.endingMeta.textContent = `엔딩 ${unlockedEndings} / 3 해금 · 플레이 시간 ${formatDuration(getElapsed())}`;
    soundscape.playBgm('ending');
    setScreen('ending-screen');
    saveAutosave();
  }

  function formatDuration(milliseconds) {
    const seconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(seconds / 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function scheduleAuto() {
    window.clearTimeout(autoTimer);
    if (!autoMode || currentModal || state.awaiting !== 'text' || isTyping) return;
    const byText = config.autoDelay + Math.min(fullText.length * 24, 1800);
    const wait = byText;
    autoTimer = window.setTimeout(() => {
      state.awaiting = 'none';
      advanceStory();
    }, wait);
  }

  function toggleAuto() {
    autoMode = !autoMode;
    dom.auto.classList.toggle('is-active', autoMode);
    showToast(autoMode ? '자동 진행을 시작합니다.' : '자동 진행을 멈췄습니다.');
    if (autoMode) scheduleAuto();
    else window.clearTimeout(autoTimer);
  }

  function openModal(name) {
    window.clearTimeout(autoTimer);
    currentModal = name;
    dom.modalRoot.hidden = false;
    $$('[data-modal]', dom.modalRoot).forEach((modal) => {
      modal.hidden = modal.dataset.modal !== name;
    });
    if (name === 'save') renderSlots('save');
    if (name === 'load') renderSlots('load');
    if (name === 'log') renderLog();
    if (name === 'gallery') renderGallery();
    if (name === 'config') syncConfigControls();
    window.setTimeout(() => {
      const modal = $(`[data-modal="${name}"]`);
      (name === 'name' ? dom.nameInput : $('button, input', modal))?.focus();
    }, 80);
  }

  function closeModal() {
    if (!currentModal) return;
    const wasName = currentModal === 'name';
    currentModal = null;
    dom.modalRoot.hidden = true;
    $$('[data-modal]', dom.modalRoot).forEach((modal) => { modal.hidden = true; });
    if (wasName && !dom.game.classList.contains('is-active')) dom.start.focus();
    scheduleAuto();
  }

  function renderSlots(mode) {
    const container = mode === 'save' ? dom.saveSlots : dom.loadSlots;
    container.replaceChildren();
    for (let index = 1; index <= 6; index += 1) {
      const saved = readJSON(STORAGE.slot(index));
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `save-slot${saved ? '' : ' is-empty'}`;

      if (!saved) {
        button.textContent = mode === 'save' ? `SLOT ${String(index).padStart(2, '0')} · 빈 기록` : `SLOT ${String(index).padStart(2, '0')} · 기록 없음`;
        button.disabled = mode === 'load';
      } else {
        const scene = window.STORY.scenes[saved.sceneIndex] || window.STORY.scenes[0];
        const thumbKey = saved.cg || saved.bg || scene.bg;
        const excerpt = saved.current?.text ? formatSavedText(saved.current.text, saved.playerName) : scene.title;
        button.innerHTML = `
          <span class="save-slot-thumb"><img src="${ASSETS[thumbKey] || ASSETS[scene.bg]}" alt=""><span>${String(index).padStart(2, '0')}</span></span>
          <span class="save-slot-copy"><strong>SLOT ${String(index).padStart(2, '0')} · ${escapeHTML(scene.title)}</strong><time>${formatDate(saved.savedAt)}</time><p>${escapeHTML(excerpt)}</p></span>
        `;
      }

      button.addEventListener('click', () => {
        soundscape.play('ui');
        if (mode === 'save') {
          writeJSON(STORAGE.slot(index), snapshotState());
          renderSlots('save');
          showToast(`${String(index).padStart(2, '0')}번 슬롯에 기록했습니다.`);
        } else if (saved) {
          closeModal();
          restoreState(saved);
          showToast(`${String(index).padStart(2, '0')}번 기록을 불러왔습니다.`);
        }
      });
      container.append(button);
    }
  }

  function formatSavedText(text, savedName) {
    const name = savedName || '도윤';
    return String(text).replaceAll('{name_a}', vocative(name)).replaceAll('{name}', name);
  }

  function formatDate(timestamp) {
    if (!timestamp) return '날짜 정보 없음';
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    }).format(new Date(timestamp));
  }

  function restoreState(saved) {
    cancelAllTimers();
    const base = freshState(saved.playerName || '도윤');
    state = {
      ...base,
      ...saved,
      variables: { ...base.variables, ...(saved.variables || {}) },
      character: { ...base.character, ...(saved.character || {}) },
      queue: Array.isArray(saved.queue) ? saved.queue : [],
      history: Array.isArray(saved.history) ? saved.history : [],
      startedAt: Date.now(),
      elapsed: saved.elapsed || 0
    };
    const restoredView = {
      bg: state.bg,
      cg: state.cg,
      character: { ...state.character }
    };
    setScreen('game-screen');
    enterScene(state.sceneIndex, true);
    setBackground(restoredView.bg, true);
    setCharacter(restoredView.character.visible, restoredView.character.look);
    setCg(restoredView.cg, true);
    updateProgress();

    if (state.ended && state.currentEnding) {
      showEnding(state.currentEnding);
      return;
    }

    if (state.awaiting === 'choice' && state.current?.t === 'choice') {
      showChoices(state.current);
    } else if (state.current && (state.current.t === 'say' || state.current.t === 'narr')) {
      displayTextLine(state.current, true, false);
    } else {
      state.awaiting = 'none';
      advanceStory();
    }
    const scene = window.STORY.scenes[state.sceneIndex];
    soundscape.playBgm(scene.bgm || 'day');
  }

  function renderLog() {
    dom.logList.replaceChildren();
    if (!state.history.length) {
      const empty = document.createElement('p');
      empty.className = 'log-empty';
      empty.textContent = '아직 남은 대화가 없습니다.';
      dom.logList.append(empty);
      return;
    }
    state.history.forEach((entry) => {
      const row = document.createElement('article');
      row.className = `log-entry${entry.narr ? ' is-narr' : ''}`;
      const speaker = document.createElement('strong');
      const text = document.createElement('p');
      speaker.textContent = entry.speaker;
      text.textContent = entry.text;
      row.append(speaker, text);
      dom.logList.append(row);
    });
    requestAnimationFrame(() => { dom.logList.scrollTop = dom.logList.scrollHeight; });
  }

  function getUnlocks() {
    const unlocked = readJSON(STORAGE.unlocks, ['bg01_gate_morning']);
    return Array.isArray(unlocked) ? unlocked : ['bg01_gate_morning'];
  }

  function unlock(key) {
    const unlocked = getUnlocks();
    if (!unlocked.includes(key)) {
      unlocked.push(key);
      writeJSON(STORAGE.unlocks, unlocked);
      if (key.startsWith('cg')) showToast('새로운 추억이 열렸습니다.');
    }
  }

  function renderGallery() {
    const unlocked = getUnlocks();
    const items = [
      { key: 'bg01_gate_morning', image: 'bg01_gate_morning', title: '처음의 아침', always: true },
      { key: 'cg01_desk_closeup', image: 'cg01_desk_closeup', title: '평범한 것들의 이름' },
      { key: 'cg02_gate_sunset', image: 'cg02_gate_sunset', title: '해질녘 교문' },
      { key: 'cg03_face_blush', image: 'cg03_face_blush', title: '내일도, 같은 시간에' },
      { key: 'ending:normal', image: 'bg04_window_afternoon', title: 'ENDING B · 벚꽃이 지기 전에' },
      { key: 'ending:other', image: 'bg05_gate_sunset', title: 'ENDING C · 조금 늦은 인사' }
    ];
    dom.galleryGrid.replaceChildren();
    items.forEach((item) => {
      const open = item.always || unlocked.includes(item.key);
      const figure = document.createElement('figure');
      figure.className = `gallery-item${open ? '' : ' is-locked'}`;
      const image = document.createElement('img');
      image.src = ASSETS[item.image];
      image.alt = open ? item.title : '';
      const caption = document.createElement('figcaption');
      caption.textContent = open ? item.title : 'LOCKED';
      figure.append(image, caption);
      dom.galleryGrid.append(figure);
    });
  }

  function syncConfigControls() {
    dom.config.textSpeed.value = config.textSpeed;
    dom.config.autoDelay.value = config.autoDelay;
    dom.config.bgmVolume.value = config.bgmVolume;
    dom.config.sfxVolume.value = config.sfxVolume;
    dom.config.voiceVolume.value = config.voiceVolume;
    dom.config.reducedMotion.checked = config.reducedMotion;
    updateConfigLabels();
  }

  function updateConfigLabels() {
    const speedLabels = config.textSpeed <= 16 ? '빠름' : config.textSpeed >= 38 ? '느림' : '보통';
    dom.config.textSpeedValue.textContent = speedLabels;
    dom.config.autoDelayValue.textContent = `${(config.autoDelay / 1000).toFixed(2)}초`;
    dom.config.bgmVolumeValue.textContent = config.bgmVolume;
    dom.config.sfxVolumeValue.textContent = config.sfxVolume;
    dom.config.voiceVolumeValue.textContent = config.voiceVolume;
  }

  function applyConfig() {
    document.body.classList.toggle('reduce-motion', config.reducedMotion);
    soundscape.updateVolumes();
    voice.updateVolume();
    updateConfigLabels();
    saveConfig();
  }

  function updateSoundButton() {
    dom.sound.classList.toggle('is-muted', config.muted);
    dom.sound.setAttribute('aria-label', config.muted ? '소리 켜기' : '소리 끄기');
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => showToast('이 브라우저에서는 전체 화면을 사용할 수 없습니다.'));
    } else {
      document.exitFullscreen?.();
    }
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    dom.toast.textContent = message;
    dom.toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => dom.toast.classList.remove('is-visible'), 2300);
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
  }

  function createPetals(container, count) {
    if (!container) return;
    for (let index = 0; index < count; index += 1) {
      const petal = document.createElement('i');
      petal.className = 'petal';
      petal.style.left = `${Math.random() * 104 - 2}%`;
      petal.style.setProperty('--size', `${7 + Math.random() * 10}px`);
      petal.style.setProperty('--duration', `${9 + Math.random() * 10}s`);
      petal.style.setProperty('--delay', `${Math.random() * -18}s`);
      petal.style.setProperty('--drift', `${-70 + Math.random() * 150}px`);
      petal.style.setProperty('--opacity', `${.28 + Math.random() * .55}`);
      container.append(petal);
    }
  }

  function createLightMotes(container, count) {
    if (!container) return;
    for (let index = 0; index < count; index += 1) {
      const mote = document.createElement('i');
      mote.className = 'light-mote';
      mote.style.left = `${8 + Math.random() * 84}%`;
      mote.style.top = `${10 + Math.random() * 66}%`;
      mote.style.setProperty('--mote-size', `${2 + Math.random() * 4}px`);
      mote.style.setProperty('--mote-duration', `${8 + Math.random() * 9}s`);
      mote.style.setProperty('--mote-delay', `${Math.random() * -14}s`);
      mote.style.setProperty('--mote-x', `${-18 + Math.random() * 36}px`);
      mote.style.setProperty('--mote-y', `${-34 - Math.random() * 28}px`);
      container.append(mote);
    }
  }

  function initParallax() {
    window.addEventListener('pointermove', (event) => {
      if (config.reducedMotion) return;
      const x = (event.clientX / window.innerWidth - .5) * 2;
      const y = (event.clientY / window.innerHeight - .5) * 2;
      dom.app.style.setProperty('--mx', x.toFixed(3));
      dom.app.style.setProperty('--my', y.toFixed(3));
    }, { passive: true });
  }

  function bindEvents() {
    dom.start.addEventListener('click', () => {
      soundscape.ensure();
      soundscape.play('ui');
      dom.nameInput.value = '도윤';
      openModal('name');
    });

    dom.continue.addEventListener('click', () => {
      const autosave = readJSON(STORAGE.autosave);
      if (autosave) {
        soundscape.ensure();
        soundscape.play('ui');
        restoreState(autosave);
      }
    });

    dom.nameForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = dom.nameInput.value.trim() || '도윤';
      closeModal();
      soundscape.play('choice');
      newGame(name);
    });

    dom.dialogueHitbox.addEventListener('click', skipOrAdvance);
    dom.auto.addEventListener('click', toggleAuto);
    dom.sound.addEventListener('click', () => {
      soundscape.ensure();
      soundscape.setMuted(!config.muted);
      if (!config.muted) soundscape.play('ui');
    });
    dom.fullscreen.addEventListener('click', toggleFullscreen);
    dom.titleButton.addEventListener('click', () => showTitle('진행 상황을 자동 저장했습니다.'));
    dom.endingTitleButton.addEventListener('click', () => showTitle());
    dom.replay.addEventListener('click', () => newGame(state.playerName));

    $$('[data-open-modal]').forEach((button) => {
      button.addEventListener('click', () => {
        soundscape.ensure();
        soundscape.play('ui');
        openModal(button.dataset.openModal);
      });
    });
    $$('[data-close-modal]').forEach((button) => button.addEventListener('click', closeModal));

    const configBindings = [
      [dom.config.textSpeed, 'textSpeed'],
      [dom.config.autoDelay, 'autoDelay'],
      [dom.config.bgmVolume, 'bgmVolume'],
      [dom.config.sfxVolume, 'sfxVolume'],
      [dom.config.voiceVolume, 'voiceVolume']
    ];
    configBindings.forEach(([input, key]) => {
      input.addEventListener('input', () => {
        config[key] = Number(input.value);
        applyConfig();
      });
    });
    dom.config.reducedMotion.addEventListener('change', () => {
      config.reducedMotion = dom.config.reducedMotion.checked;
      applyConfig();
    });
    $('#reset-config').addEventListener('click', () => {
      config = { ...DEFAULT_CONFIG };
      syncConfigControls();
      applyConfig();
      updateSoundButton();
      showToast('설정을 기본값으로 되돌렸습니다.');
    });

    document.addEventListener('keydown', (event) => {
      const target = event.target;
      const isFormField = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
      if (event.key === 'Escape' && currentModal && currentModal !== 'name') {
        closeModal();
        return;
      }
      if (currentModal || isFormField) return;
      if (state.awaiting === 'choice' && /^[1-3]$/.test(event.key)) {
        $$('.choice-button', dom.choiceList)[Number(event.key) - 1]?.click();
        return;
      }
      if ((event.key === 'Enter' || event.key === ' ') && dom.game.classList.contains('is-active')) {
        event.preventDefault();
        skipOrAdvance();
      }
      if (event.key.toLowerCase() === 'a' && dom.game.classList.contains('is-active')) toggleAuto();
    });

    window.addEventListener('beforeunload', () => {
      if (dom.game.classList.contains('is-active')) saveAutosave();
    });
  }

  async function preload() {
    const unique = [...new Set(PRELOAD_ASSETS)];
    let loaded = 0;
    const update = () => {
      dom.loadingProgress.style.width = `${(loaded / unique.length) * 100}%`;
      dom.loadingCount.textContent = `${loaded} / ${unique.length}`;
    };
    update();
    await Promise.allSettled(unique.map((src) => new Promise((resolve) => {
      const image = new Image();
      const done = () => { loaded += 1; update(); resolve(); };
      const ready = () => {
        // load 는 내려받기 완료일 뿐이다. 스탠딩은 1536x2752 짜리
        // 큰 PNG 라 처음 그릴 때 디코딩이 일어나 한 박자 늦게 나타난다.
        // 여기서 미리 디코딩해 두면 교체가 즉시 이뤄진다.
        if (typeof image.decode === 'function') image.decode().then(done, done);
        else done();
      };
      image.addEventListener('load', ready, { once: true });
      image.addEventListener('error', done, { once: true });
      image.src = src;
    })));
    await new Promise((resolve) => window.setTimeout(resolve, config.reducedMotion ? 50 : 450));
  }

  async function init() {
    if (!window.STORY || !window.ENDINGS) {
      dom.loadingCount.textContent = '이야기 데이터를 불러오지 못했습니다.';
      return;
    }
    applyConfig();
    updateSoundButton();
    syncConfigControls();
    createPetals($('#title-petals'), 24);
    createPetals($('#game-petals'), 13);
    createLightMotes($('#game-motes'), window.matchMedia('(max-width: 620px)').matches ? 6 : 10);
    initParallax();
    bindEvents();
    updateContinueButton();
    await preload();
    showTitle();
  }

  init();
})();
