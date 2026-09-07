/* 두 컷의 전환을 끝까지 이어 가고, 대기 중인 표정은 최신 것만 표시한다. */
(() => {
  'use strict';

  class SpriteTransition {
    constructor(stage, current, ghost) {
      this.stage = stage;
      this.current = current;
      this.ghost = ghost;
      this.images = new Map();
      this.epoch = 0;
      this.request = 0;
      this.running = false;
      this.pending = null;
      this.animations = [];
      this.visibility = null;
    }

    prepare(src) {
      if (this.images.has(src)) return this.images.get(src);
      const image = new Image();
      const ready = new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error(`Sprite unavailable: ${src}`));
        image.src = src;
      }).then(async () => {
        if (image.decode) await image.decode();
        return image; // 디코딩한 이미지를 보관해 다음 표정에서도 재사용한다.
      }).catch((error) => {
        this.images.delete(src);
        throw error;
      });
      this.images.set(src, ready);
      return ready;
    }

    reset() {
      this.epoch += 1;
      this.request += 1;
      this.pending = null;
      this.running = false;
      this.animations.forEach((animation) => animation.cancel());
      this.animations = [];
      this.visibility?.cancel();
      this.visibility = null;
      this.stage.style.opacity = '1';
      for (const image of [this.current, this.ghost]) {
        image.hidden = true;
        image.style.opacity = '1';
      }
    }

    set(visible, selected, alt, reducedMotion, fadeOut = 0) {
      const request = ++this.request;
      this.pending = visible ? { ...selected, alt, reducedMotion, request } : null;
      // 장면 퇴장과 표정 교체를 분리한다. 퇴장 중에도 두 컷의 합성을 유지한다.
      const opacity = getComputedStyle(this.stage).opacity;
      this.visibility?.cancel();
      this.visibility = null;
      const duration = reducedMotion ? 0 : (visible ? 180 : fadeOut);
      this.stage.style.opacity = visible ? '1' : '0';
      if (duration && Number(opacity) !== Number(visible)) {
        const animation = this.stage.animate(
          [{ opacity }, { opacity: visible ? 1 : 0 }],
          { duration, easing: 'ease', fill: 'forwards' }
        );
        this.visibility = animation;
        animation.finished.then(() => {
          if (this.visibility !== animation) return;
          this.visibility = null;
          animation.cancel();
          if (!visible) this.resetHidden();
        }).catch(() => {});
      } else if (!visible) {
        this.resetHidden();
      }
      if (visible) this.drain();
    }

    resetHidden() {
      this.reset();
      this.stage.style.opacity = '0';
    }

    async drain() {
      if (this.running) return;
      this.running = true;
      const epoch = this.epoch;
      try {
        while (this.pending && epoch === this.epoch) {
          const next = this.pending;
          this.pending = null;
          // 현재 컷을 그대로 보여 주면서 다운로드와 디코딩을 끝낸다.
          try { await this.prepare(next.src); } catch (_) { continue; }
          if (epoch !== this.epoch) return;
          if (next.request !== this.request) continue;
          const current = this.current;
          const ghost = this.ghost;
          if (!current.hidden && current.getAttribute('src') === next.src) continue;

          const wasVisible = !current.hidden;
          const previousAlt = current.alt;
          if (wasVisible) {
            ghost.src = current.getAttribute('src');
            ghost.dataset.look = current.dataset.look;
            ghost.alt = '';
            try { if (ghost.decode) await ghost.decode(); } catch (_) { continue; }
            if (epoch !== this.epoch) return;
            if (next.request !== this.request) continue;
            ghost.style.opacity = '1';
            ghost.hidden = false;
          }
          // 새 이미지의 실제 표시 요소도 디코딩한다. 그동안 이전 컷은 유지한다.
          current.style.opacity = '0';
          current.src = next.src;
          current.dataset.look = next.crop;
          current.alt = next.alt;
          current.hidden = false;
          try {
            if (current.decode) await current.decode();
          } catch (_) {
            if (epoch !== this.epoch) return;
            if (wasVisible) {
              current.src = ghost.getAttribute('src');
              current.dataset.look = ghost.dataset.look;
              current.alt = previousAlt;
            }
            current.hidden = !wasVisible;
            current.style.opacity = '1';
            ghost.hidden = true;
            continue;
          }
          if (epoch !== this.epoch) return;
          if (!next.reducedMotion) {
            const timing = { duration: 320, easing: 'ease-in-out', fill: 'forwards' };
            this.animations = [current.animate([{ opacity: 0 }, { opacity: 1 }], timing)];
            if (wasVisible) this.animations.push(ghost.animate([{ opacity: 1 }, { opacity: 0 }], timing));
            // 같은 표정의 재요청이나 연타로 진행 중인 전환을 초기화하지 않는다.
            await Promise.allSettled(this.animations.map((animation) => animation.finished));
            if (epoch !== this.epoch) return;
          }
          current.style.opacity = '1';
          ghost.hidden = true;
          this.animations.forEach((animation) => animation.cancel());
          this.animations = [];
        }
      } finally {
        if (epoch === this.epoch) this.running = false;
      }
    }
  }

  window.SpriteTransition = SpriteTransition;
})();
