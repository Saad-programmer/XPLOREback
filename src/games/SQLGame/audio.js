(() => {
  const MENU_ITEM = '.menu .menu-row';
  const FEEDBACK = '.notice.is-good, .notice.is-bad';
  const playedFeedback = new WeakSet();
  let context = null;
  let master = null;
  let musicStarted = false;
  let lastHover = null;
  let lastHoverAt = 0;
  let noteIndex = 0;

  function volume() {
    try {
      const settings = JSON.parse(localStorage.getItem('settings') || '{}');
      return typeof settings.sound === 'number'
        ? Math.max(0, Math.min(1, settings.sound))
        : 0.7;
    } catch {
      return 0.7;
    }
  }

  function audio() {
    if (!window.AudioContext || volume() === 0) return null;
    if (context === null) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = volume();
      master.connect(context.destination);
    }
    if (context.state === 'suspended') void context.resume().catch(() => {});
    return context;
  }

  function tone(frequency, duration, options = {}) {
    const ctx = audio();
    if (!ctx || !master) return;

    const start = ctx.currentTime + (options.delay || 0);
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = options.wave || 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(options.gain || 0.045, start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope).connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function playNotes(notes, spacing, duration, gain, wave = 'sine') {
    notes.forEach((frequency, index) => {
      tone(frequency, duration, { delay: index * spacing, gain, wave });
    });
  }

  function startMusic() {
    if (musicStarted || !audio()) return;
    musicStarted = true;

    const ctx = context;
    const filter = ctx.createBiquadFilter();
    const hum = ctx.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = 230;
    hum.gain.value = 0.12;
    filter.connect(hum).connect(master);

    [55, 82.41].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = index === 0 ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index === 0 ? -3 : 4;
      oscillator.connect(filter);
      oscillator.start();
    });

    const lfo = ctx.createOscillator();
    const lfoDepth = ctx.createGain();
    lfo.frequency.value = 0.08;
    lfoDepth.gain.value = 22;
    lfo.connect(lfoDepth).connect(filter.frequency);
    lfo.start();

    const motif = [220, 261.63, 196, 233.08, 174.61, 196];
    function step() {
      if (document.hidden || volume() === 0) return;
      tone(motif[noteIndex % motif.length], 1.25, {
        gain: 0.022,
        wave: noteIndex % 3 === 0 ? 'triangle' : 'sine',
      });
      noteIndex += 1;
    }
    step();
    window.setInterval(step, 2400);
  }

  function unlockAudio() {
    if (volume() === 0) return;
    const ctx = audio();
    if (!ctx) return;
    startMusic();
  }

  function menuItem(target) {
    return target instanceof Element ? target.closest(MENU_ITEM) : null;
  }

  function playHover(item) {
    const now = performance.now();
    if (item === lastHover && now - lastHoverAt < 140) return;
    lastHover = item;
    lastHoverAt = now;
    playNotes([740, 988], 0.035, 0.075, 0.028, 'triangle');
  }

  document.addEventListener('pointerover', (event) => {
    const item = menuItem(event.target);
    if (!item || (event.relatedTarget instanceof Node && item.contains(event.relatedTarget))) return;
    playHover(item);
  });

  document.addEventListener('focusin', (event) => {
    const item = menuItem(event.target);
    if (item) playHover(item);
  });

  document.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    unlockAudio();
    if (menuItem(event.target)) playNotes([523.25, 783.99], 0.045, 0.11, 0.055, 'triangle');
  });

  document.addEventListener('click', (event) => {
    if (event.detail !== 0 || !menuItem(event.target)) return;
    unlockAudio();
    playNotes([523.25, 783.99], 0.045, 0.11, 0.055, 'triangle');
  });

  function playFeedback(node) {
    if (!(node instanceof Element)) return;
    const notice = node.matches(FEEDBACK) ? node : node.closest(FEEDBACK);
    if (!notice || playedFeedback.has(notice)) return;
    playedFeedback.add(notice);

    if (notice.classList.contains('is-good')) {
      playNotes([659.25, 783.99, 987.77, 1174.66], 0.075, 0.2, 0.065);
    } else {
      playNotes([220, 174.61, 146.83], 0.1, 0.22, 0.055, 'triangle');
    }
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes') playFeedback(record.target);
      for (const node of record.addedNodes) {
        playFeedback(node);
        if (node instanceof Element) node.querySelectorAll(FEEDBACK).forEach(playFeedback);
      }
    }
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
    subtree: true,
  });

  document.addEventListener('keydown', unlockAudio, { once: true });
  document.addEventListener('pointerdown', unlockAudio, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (!context) return;
    if (document.hidden) void context.suspend().catch(() => {});
    else if (volume() > 0) void context.resume().catch(() => {});
  });

  window.setInterval(() => {
    if (!context || !master) return;
    master.gain.setTargetAtTime(volume(), context.currentTime, 0.08);
  }, 500);
})();
