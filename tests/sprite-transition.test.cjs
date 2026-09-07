const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require('node:path').join(__dirname, '../js/sprite-transition.js'), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

function setup() {
  const downloads = new Map();
  const animations = [];
  class Element {
    constructor() {
      this.style = { opacity: '1' };
      this.dataset = { look: 'full' };
      this.hidden = true;
      this.src = 'calm';
      this.alt = 'calm';
    }
    getAttribute(key) { return this[key]; }
    decode() { return this.decoding || Promise.resolve(); }
    animate(frames, timing) {
      const done = deferred();
      const animation = {
        element: this, frames, timing, cancelled: false, finished: done.promise,
        cancel() { this.cancelled = true; done.reject(new Error('cancelled')); },
        finish() { done.resolve(); }
      };
      animations.push(animation);
      return animation;
    }
  }
  class Image {
    set src(value) {
      const ready = downloads.get(value);
      (ready ? ready.promise : Promise.resolve()).then(() => this.onload(), () => this.onerror());
    }
    decode() { return Promise.resolve(); }
  }
  const context = { window: {}, Image, getComputedStyle: el => ({ opacity: el.style.opacity }) };
  vm.runInNewContext(source, context);
  const stage = new Element();
  const current = new Element();
  const ghost = new Element();
  current.hidden = false;
  const controller = new context.window.SpriteTransition(stage, current, ghost);
  const show = (src, reduced = false) => controller.set(true, { src, crop: 'full' }, src, reduced);
  const finish = async () => {
    controller.animations.forEach(animation => animation.finish());
    await tick();
  };
  return { controller, stage, current, ghost, show, finish, downloads, animations };
}

test('rapid changes finish the active blend and only display the latest queued expression', async () => {
  const s = setup();
  s.show('smile');
  await tick();
  const first = [...s.controller.animations];
  s.show('shy');
  s.show('blush');
  await tick();
  assert.equal(s.current.src, 'smile');
  assert.equal(s.ghost.src, 'calm');
  assert.ok(first.every(animation => !animation.cancelled));
  await s.finish();
  assert.equal(s.current.src, 'blush');
  assert.equal(s.ghost.src, 'smile');
  await s.finish();
  assert.equal(s.ghost.hidden, true);
  assert.equal(s.current.style.opacity, '1');
});

test('repeating the same expression does not restart or extend the blend', async () => {
  const s = setup();
  s.show('smile');
  await tick();
  const first = s.controller.animations;
  s.show('smile');
  await tick();
  assert.equal(s.controller.animations, first);
  await s.finish();
  assert.equal(s.animations.length, 2);
  assert.equal(s.controller.running, false);
});

test('keeps the old sprite visible until download and both decode steps finish', async () => {
  const s = setup();
  const download = deferred();
  const decode = deferred();
  s.downloads.set('smile', download);
  s.current.decoding = decode.promise;
  s.show('smile');
  await tick();
  assert.equal(s.current.src, 'calm');
  assert.equal(s.current.style.opacity, '1');
  download.resolve();
  await tick();
  assert.equal(s.ghost.src, 'calm');
  assert.equal(s.ghost.hidden, false);
  assert.equal(s.current.style.opacity, '0');
  assert.equal(s.animations.length, 0);
  decode.resolve();
  await tick();
  assert.equal(s.controller.animations.length, 2);
  await s.finish();
});

test('late downloads from an old route cannot replace the new route sprite', async () => {
  const s = setup();
  const old = deferred();
  s.downloads.set('old-route', old);
  s.show('old-route');
  await tick();
  s.controller.reset();
  s.show('new-route', true);
  await tick();
  old.resolve();
  await tick();
  assert.equal(s.current.src, 'new-route');
  assert.equal(s.current.hidden, false);
  assert.equal(s.ghost.hidden, true);
});

test('a failed image leaves the current expression intact and can be retried', async () => {
  const s = setup();
  const failed = deferred();
  s.downloads.set('smile', failed);
  s.show('smile');
  failed.reject(new Error('network'));
  await tick();
  assert.equal(s.current.src, 'calm');
  assert.equal(s.current.hidden, false);
  s.downloads.delete('smile');
  s.show('smile', true);
  await tick();
  assert.equal(s.current.src, 'smile');
});

test('scene fade keeps both sprites until its completion and cancels pending expressions', async () => {
  const s = setup();
  s.show('smile');
  await tick();
  s.show('shy');
  s.controller.set(false, {}, '', false, 900);
  const exit = s.controller.visibility;
  assert.equal(s.ghost.hidden, false);
  assert.ok(s.controller.animations.every(animation => !animation.cancelled));
  await s.finish();
  assert.equal(s.current.src, 'smile');
  exit.finish();
  await tick();
  assert.equal(s.current.hidden, true);
  assert.equal(s.ghost.hidden, true);
  assert.equal(s.stage.style.opacity, '0');
});

test('reduced motion switches decoded sprites without starting animations', async () => {
  const s = setup();
  s.show('smile', true);
  await tick();
  assert.equal(s.current.src, 'smile');
  assert.equal(s.current.style.opacity, '1');
  assert.equal(s.ghost.hidden, true);
  assert.equal(s.animations.length, 0);
});

test('reset during element decoding cannot show a stale sprite or stop a newer transition', async () => {
  const s = setup();
  const decode = deferred();
  s.current.decoding = decode.promise;
  s.show('old-route');
  await tick();
  s.controller.reset();
  s.current.decoding = null;
  s.show('new-route');
  await tick();
  const active = s.controller.animations;
  decode.resolve();
  await tick();
  assert.equal(s.current.src, 'new-route');
  assert.equal(s.controller.animations, active);
  assert.equal(s.controller.running, true);
  await s.finish();
});

test('returning during a scene fade cancels its hide callback', async () => {
  const s = setup();
  s.controller.set(false, {}, '', false, 900);
  const exit = s.controller.visibility;
  s.show('smile');
  await tick();
  assert.equal(exit.cancelled, true);
  exit.finish();
  await tick();
  assert.equal(s.current.hidden, false);
  await s.finish();
  assert.equal(s.current.src, 'smile');
  assert.equal(s.stage.style.opacity, '1');
});
