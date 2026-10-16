(() => {
  "use strict";

  const S = window.Stage || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const frozen = new URLSearchParams(location.search).has("static");
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const calm = () => frozen || still.matches;
  const watch = S.watch || ((el, enter, leave, threshold = 0.35) => {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { enter(); return; }
    new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? enter() : leave && leave())), { threshold }).observe(el);
  });
  const clock = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const span = (s) => (s < 60 ? `${s} s` : `${Math.round(s / 60)} min`);
  const arc = (el, circumference, f) => {
    if (el) el.style.strokeDashoffset = (circumference * (1 - Math.max(0, Math.min(1, f)))).toFixed(1) + "px";
  };

  // Two rhythms ------------------------------------------------------------
  const PRESETS = {
    balanced: { summary: "20-20-20 for the eyes, up every 45 minutes.", eyes: [1200, 20], body: [2700, 300] },
    deepFocus: { summary: "Longer stretches, fewer interruptions.", eyes: [2700, 30], body: [5400, 300] },
    eyeCare: { summary: "For tired or dry eyes: often and short.", eyes: [900, 15], body: [3600, 180] },
    wellness: { summary: "Pomodoro-shaped: 25 minutes on, a real stretch every 50.", eyes: [1500, 45], body: [3000, 300] }
  };

  $$('[data-stage="rhythms"]').forEach((section) => {
    const dials = { eyes: $('[data-dial="eyes"]', section), body: $('[data-dial="body"]', section) };
    const rules = $$(".rhythm-rule", section);
    const note = $(".preset-note", section);
    const chips = $$(".preset", section);
    let preset = "balanced";
    const left = { eyes: 42, body: 725 };
    let timer = 0;

    function paintRule() {
      const p = PRESETS[preset];
      rules[0].textContent = `Every ${span(p.eyes[0])} for ${span(p.eyes[1])}`;
      rules[1].textContent = `Every ${span(p.body[0])} for ${span(p.body[1])}`;
      if (note) note.textContent = p.summary;
    }
    function paint(kind) {
      const dial = dials[kind];
      const total = PRESETS[preset][kind][0];
      const rest = left[kind];
      arc($(".arc", dial), 339.3, 1 - rest / total);
      dial.classList.toggle("due", rest <= 0);
      $(".dial-time", dial).textContent = rest <= 0 ? "now" : clock(rest);
    }
    function tick() {
      ["eyes", "body"].forEach((kind) => {
        const total = PRESETS[preset][kind][0];
        left[kind] = left[kind] <= -2 ? total : left[kind] - 1;
        paint(kind);
      });
    }
    function pick(chip) {
      preset = chip.dataset.preset;
      chips.forEach((c) => {
        c.setAttribute("aria-checked", String(c === chip));
        c.tabIndex = c === chip ? 0 : -1;
      });
      ["eyes", "body"].forEach((kind) => { left[kind] = PRESETS[preset][kind][0]; paint(kind); });
      paintRule();
    }
    chips.forEach((chip, n) => {
      chip.tabIndex = chip.dataset.preset === preset ? 0 : -1;
      chip.addEventListener("click", () => pick(chip));
      chip.addEventListener("keydown", (e) => {
        const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!d) return;
        e.preventDefault();
        const to = chips[(n + d + chips.length) % chips.length];
        to.focus();
        pick(to);
      });
    });

    paintRule();
    paint("eyes");
    paint("body");
    if (calm()) return;
    watch(section, () => { clearInterval(timer); timer = setInterval(tick, 1000); }, () => clearInterval(timer), 0.25);
  });

  // It waits for a good moment ---------------------------------------------
  $$('[data-stage="hold"]').forEach((section) => {
    const signals = $$(".signal", section);
    const pill = $(".hold-pill", section);
    const text = $(".hold-text", section);
    const note = $(".hold-note", section);
    const clearNote = "Nothing in the way. Vista waits one more minute after the last reason clears, then the break lands.";
    let step = 0, loop = 0, hold = 0;

    function paint() {
      const on = signals.filter((s) => s.classList.contains("on"));
      signals.forEach((s) => { $(".signal-state", s).textContent = s.classList.contains("on") ? "holding" : "clear"; });
      pill.classList.toggle("ready", on.length === 0);
      text.textContent = on.length ? "Eye break, holding" : "Eye break, now";
      note.textContent = on.length ? on[0].dataset.note : clearNote;
    }
    function show(n) {
      signals.forEach((s, i) => s.classList.toggle("on", i === n));
      paint();
    }
    function advance() {
      step = (step + 1) % (signals.length + 1);
      show(step === signals.length ? -1 : step);
    }
    signals.forEach((s) => {
      s.addEventListener("click", () => {
        s.classList.toggle("on");
        paint();
        clearInterval(loop);
        clearTimeout(hold);
        if (calm()) return;
        hold = setTimeout(() => { step = 0; show(0); loop = setInterval(advance, 2100); }, 9000);
      });
    });

    show(0);
    if (calm()) return;
    watch(section, () => { clearInterval(loop); loop = setInterval(advance, 2100); }, () => clearInterval(loop), 0.3);
  });

  // A break you can see past ------------------------------------------------
  $$('[data-stage="break"]').forEach((section) => {
    const fit = $(".scene-fit", section);
    const scene = $(".scene", section);
    const status = $(".scene-status", section);
    const ring = $(".break-ring .arc", scene);
    const time = $(".break-time", scene);
    const pointerRing = $(".pointer-ring .arc", scene);
    const pointerN = $(".pointer-n", scene);
    const LENGTH = 20;
    let timers = [], seen = false, rest = LENGTH;

    function fitScene() {
      const w = fit.clientWidth;
      const base = w < 470 ? 430 : 560;
      const s = Math.min(1, w / base);
      scene.style.setProperty("--s", s.toFixed(4));
      fit.style.setProperty("--s", s.toFixed(4));
      scene.style.left = `${Math.round((w - 560 * s) / 2)}px`;
      fit.classList.toggle("crop", base !== 560);
    }
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    function stop() { timers.forEach(clearTimeout); timers = []; }
    function phase(name) { scene.dataset.phase = name; }
    function say(line) { status.textContent = line; }
    function drain(fraction, seconds) {
      ring.style.transitionDuration = `${seconds}s`;
      arc(ring, 339.3, fraction);
    }

    function calmPhase() {
      phase("calm");
      say("Working.");
      drain(1, 0);
      time.textContent = clock(LENGTH);
    }
    function headsUp() {
      phase("headsup");
      say("A minute's warning, with the chance to push it back.");
    }
    function countdown(then) {
      phase("countdown");
      say("Five seconds, following the cursor.");
      let n = 5;
      pointerN.textContent = n;
      arc(pointerRing, 113.1, 1);
      const beat = () => {
        n -= 1;
        pointerN.textContent = Math.max(n, 1);
        arc(pointerRing, 113.1, n / 5);
        if (n > 0) at(600, beat); else at(400, then);
      };
      at(600, beat);
    }
    function takeBreak() {
      phase("break");
      say("Twenty seconds, looking as far away as the room allows.");
      rest = LENGTH;
      time.textContent = clock(rest);
      drain(1, 0);
      requestAnimationFrame(() => drain(0, LENGTH));
      const beat = () => {
        rest -= 1;
        time.textContent = clock(Math.max(rest, 0));
        if (rest > 0) at(1000, beat); else at(400, done);
      };
      at(1000, beat);
    }
    function done() {
      phase("back");
      say("Counted. The next eye break is in 20 minutes.");
      at(2400, cycle);
    }
    function cycle() {
      stop();
      calmPhase();
      at(2200, headsUp);
      at(6400, () => countdown(takeBreak));
    }
    function pauseAfter(line) {
      stop();
      calmPhase();
      say(line);
      if (!calm()) at(7000, cycle);
    }

    $$("[data-act]", scene).forEach((btn) => {
      btn.addEventListener("click", () => {
        const act = btn.dataset.act;
        if (act === "now") { stop(); countdown(takeBreak); return; }
        if (act === "snooze") return pauseAfter("Snoozed. Five more minutes, then it asks again.");
        if (act === "skip") return pauseAfter("Skipped. Vista tries again in 20 minutes — and remembers that you skipped.");
        if (act === "lock") return pauseAfter("Locked. Time away from the keyboard counts as a break.");
        pauseAfter(`Pushed back ${act} minute${act === "1" ? "" : "s"}.`);
      });
    });

    fitScene();
    addEventListener("resize", fitScene);
    if (calm()) {
      phase("break");
      drain(0.62, 0);
      time.textContent = "00:12";
      say("Twenty seconds, looking as far away as the room allows.");
      return;
    }
    calmPhase();
    watch(section, () => { if (!seen) { seen = true; at(900, cycle); } }, null, 0.4);
  });

  // The rhythm coach --------------------------------------------------------
  $$(".advice").forEach((card) => {
    const head = $(".advice-head", card);
    const detail = $(".advice-detail", card);
    $$("[data-advice]", card).forEach((btn) => {
      btn.addEventListener("click", () => {
        const yes = btn.dataset.advice === "yes";
        card.classList.add("done");
        head.textContent = yes ? "Eye breaks every 25 minutes" : "Left as it was";
        detail.textContent = yes
          ? "Changed. Vista reads the next fortnight and only speaks up if something else stands out."
          : "Nothing changed. Vista will mention it again if the pattern holds.";
      });
    });
  });
})();
