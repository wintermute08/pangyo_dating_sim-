(() => {
  'use strict';

  const ASSETS = {
    bg01_gate_morning: 'assets/bg01_gate_morning.png',
    bg02_classroom_noon: 'assets/bg02_classroom_noon.png',
    bg03_corridor_day: 'assets/bg03_corridor_day.png',
    bg04_window_afternoon: 'assets/bg04_window_afternoon.png',
    bg05_gate_sunset: 'assets/bg05_gate_sunset.png',
    cg01_desk_closeup: 'assets/cg01_desk_closeup.png',
    cg02_gate_sunset: 'assets/cg02_gate_sunset.png',
    cg03_face_blush: 'assets/cg03_face_blush.png'
  };

  const LOOKS = {
    calm: { src: 'assets/ch_stand_calm.png', crop: 'full' },
    serious: { src: 'assets/ch_full_calm.png', crop: 'full' },
    smile: { src: 'assets/ch_waist_smile.png', crop: 'waist' },
    shy: { src: 'assets/ch_waist_blush.png', crop: 'waist' },
    blush: { src: 'assets/ch_bust_blush.png', crop: 'bust' }
  };

  const PRELOAD_ASSETS = [
    ...Object.values(ASSETS),
    ...Object.values(LOOKS).map((look) => look.src),
    'assets/title-logo-v2.png'
  ];

  const STORAGE = {
    config: 'pangyo-vn:config:v2',
    autosave: 'pangyo-vn:autosave:v2',
    slot: (number) => `pangyo-vn:slot:${number}:v2`,
    unlocks: 'pangyo-vn:unlocks:v2'
  };

  const DEFAULT_CONFIG = {
    textSpeed: 26,
    autoDelay: 2600,
    bgmVolume: 34,
    sfxVolume: 62,
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
      reducedMotion: $('#reduced-motion'),
      textSpeedValue: $('#text-speed-value'),
      autoDelayValue: $('#auto-delay-value'),
      bgmVolumeValue: $('#bgm-volume-value'),
      sfxVolumeValue: $('#sfx-volume-value')
    }
  };

  let config = { ...DEFAULT_CONFIG, ...readJSON(STORAGE.config, {}) };
  let state = freshState('도윤');
  let activeBg = 'a';
  let typeTimer = 0;
  let transitionTimer = 0;
  let autoTimer = 0;
  let toastTimer = 0;
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

  function freshState(playerName) {
    return {
      version: 2,
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
    typeTimer = 0;
    transitionTimer = 0;
    autoTimer = 0;
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
    setBackground(scene.bg, immediate);
    setCg(null, immediate);
    setCharacter(false, state.character.look || 'calm');
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
      return line;
    }
    return { t: 'end' };
  }

  function advanceStory() {
    if (busy || currentModal || state.awaiting === 'choice' || state.ended) return;
    window.clearTimeout(autoTimer);
    autoTimer = 0;
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
      case 'bg':
        setBackground(line.to);
        continueAfter(Math.min(line.fade || 450, 700));
        break;
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

    dom.speaker.hidden = !speaker;
    dom.speaker.textContent = speaker || '';
    dom.dialogueText.classList.toggle('is-narration', line.t === 'narr');
    dom.dialoguePanel.hidden = false;
    dom.dialogueText.textContent = '';
    fullText = text;

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

  function setBackground(key, immediate = false) {
    if (!ASSETS[key]) return;
    state.bg = key;
    const visible = activeBg === 'a' ? dom.bgA : dom.bgB;
    const next = activeBg === 'a' ? dom.bgB : dom.bgA;
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

  function setCharacter(visible, look = 'calm') {
    const selected = LOOKS[look] || LOOKS.calm;
    state.character = { visible, look: LOOKS[look] ? look : 'calm' };
    dom.character.hidden = !visible;
    if (!visible) return;
    dom.character.src = selected.src;
    dom.character.dataset.look = selected.crop;
    dom.character.alt = `${window.STORY.heroineName} · ${look}`;
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
    autoTimer = window.setTimeout(() => {
      state.awaiting = 'none';
      advanceStory();
    }, config.autoDelay + Math.min(fullText.length * 24, 1800));
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
    dom.config.reducedMotion.checked = config.reducedMotion;
    updateConfigLabels();
  }

  function updateConfigLabels() {
    const speedLabels = config.textSpeed <= 16 ? '빠름' : config.textSpeed >= 38 ? '느림' : '보통';
    dom.config.textSpeedValue.textContent = speedLabels;
    dom.config.autoDelayValue.textContent = `${(config.autoDelay / 1000).toFixed(2)}초`;
    dom.config.bgmVolumeValue.textContent = config.bgmVolume;
    dom.config.sfxVolumeValue.textContent = config.sfxVolume;
  }

  function applyConfig() {
    document.body.classList.toggle('reduce-motion', config.reducedMotion);
    soundscape.updateVolumes();
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
      [dom.config.sfxVolume, 'sfxVolume']
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
      image.addEventListener('load', done, { once: true });
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
    initParallax();
    bindEvents();
    updateContinueButton();
    await preload();
    showTitle();
  }

  init();
})();
