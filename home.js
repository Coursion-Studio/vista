(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SVG = "http://www.w3.org/2000/svg";
  const IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)";
  const OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
  const EASE_IN = "cubic-bezier(0.42, 0, 1, 1)";
  const TINT = { eyes: "#3A9EFF", body: "#2ECC71" };
  const typing = (el) => el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);

  function onView(el, enter, leave, threshold = 0.25) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { enter(); return; }
    new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? enter() : leave()));
    }, { threshold }).observe(el);
  }

  function rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }

  function clock(seconds) {
    const s = Math.max(0, Math.ceil(seconds - 1e-6));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  const EXERCISES = {
    "eyes.distance": {
      kind: "eyes", chip: "Look far", motion: "horizon",
      headline: "Look out the window",
      detail: "Find the furthest thing you can see and rest on it. Six metres or more lets the focusing muscle finally let go.",
      steps: [["Find the furthest thing you can see", 6], ["Let your eyes rest on it", 8], ["Soften your jaw and shoulders", 6]]
    },
    "eyes.blink": {
      kind: "eyes", chip: "Blink", motion: "blink",
      headline: "Blink it out",
      detail: "Twenty slow, full blinks. Screens cut your blink rate by half, which is why your eyes feel dry by evening.",
      steps: [["Blink slowly with the dot", 20]]
    },
    "eyes.palm": {
      kind: "eyes", chip: "Palming", motion: "palm",
      headline: "Cup your eyes",
      detail: "Rest your palms over closed eyes and let it go completely dark. No pressure on the eyeball — just warmth.",
      steps: [["Cup your palms over closed eyes", 5], ["Let it go completely dark", 10], ["Breathe out slowly", 5]]
    },
    "eyes.shift": {
      kind: "eyes", chip: "Near and far", motion: "nearFar",
      headline: "Near and far",
      detail: "Thumb at arm's length, then something across the room. Swap focus between them ten times.",
      steps: [["Focus on your thumb", 5], ["Now something across the room", 5]]
    },
    "breathe": {
      kind: "eyes", chip: "Breathe", motion: "breathe",
      headline: "Breathe with the ring",
      detail: "In for four, out for six.",
      steps: [["Breathe in, then hold", 6], ["Breathe out slowly", 6]]
    },
    "body.stand": {
      kind: "body", chip: "Stand and walk", motion: "walk",
      headline: "Stand up and walk",
      detail: "All the way up, out of the room and back. The point is leaving the chair, not stretching in it.",
      steps: [["Stand all the way up", 20], ["Walk out of the room", 120], ["Come back the long way", 100]]
    },
    "body.shoulders": {
      kind: "body", chip: "Shoulder rolls", motion: "shoulders",
      headline: "Open your chest",
      detail: "Hands behind your head, elbows wide, look up. Hold thirty seconds. Undoes an hour of hunching over a keyboard.",
      steps: [["Roll your shoulders back, ten times", 30], ["Open your chest, hands behind you", 30], ["Drop your ears to each shoulder", 40]]
    },
    "body.hips": {
      kind: "body", chip: "Hips", motion: "hinge",
      headline: "Wake your hips",
      detail: "Stand, pull one knee to your chest, hold, swap. Sitting shortens the hip flexors; this gives them back.",
      steps: [["Stand and hinge forward gently", 30], ["Lunge, left side", 30], ["Lunge, right side", 30], ["Stand tall and breathe", 20]]
    },
    "body.neck": {
      kind: "body", chip: "Neck", motion: "neck",
      headline: "Lengthen your neck",
      detail: "Ear toward shoulder, slow, both sides. Then chin gently back — not down — to unstack the forward head tilt.",
      steps: [["Chin to chest, slowly", 20], ["Ear to left shoulder", 25], ["Ear to right shoulder", 25], ["Look up, jaw loose", 20]]
    },
    "body.water": {
      kind: "body", chip: "Glass of water", motion: "water",
      headline: "Refill your glass",
      detail: "Walk to the tap. It moves you and it hydrates you, and you will forget otherwise.",
      steps: [["Walk to the kitchen", 60], ["Fill a glass", 30], ["Drink it before you sit", 60]]
    }
  };
  const ORDER = {
    eyes: ["eyes.distance", "eyes.blink", "eyes.palm", "eyes.shift", "breathe"],
    body: ["body.stand", "body.shoulders", "body.hips", "body.neck", "body.water"]
  };
  const DURATION = { eyes: 20, body: 300 };

  function stepAt(steps, elapsed) {
    const cycle = steps.reduce((a, s) => a + s[1], 0);
    if (cycle <= 0) return steps[0];
    let offset = elapsed % cycle;
    for (const s of steps) {
      if (offset < s[1]) return s;
      offset -= s[1];
    }
    return steps[steps.length - 1];
  }

  let sceneSeq = 0;

  function buildScene(ex, tint, animated) {
    const id = `sc${++sceneSeq}`;
    const anims = [];
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", "0 0 320 150");
    svg.setAttribute("width", "320");
    svg.setAttribute("height", "150");
    const el = (name, attrs = {}, parent) => {
      const n = document.createElementNS(SVG, name);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(n);
      return n;
    };
    const faint = rgba(tint, 0.22);
    const soft = rgba(tint, 0.45);
    const ink = "rgba(255, 255, 255, 0.82)";
    const quiet = "rgba(255, 255, 255, 0.18)";
    const defs = el("defs", {}, svg);
    const edge = el("radialGradient", { id: `${id}e`, cx: "0.5", cy: "0.5", r: "0.5" }, defs);
    el("stop", { offset: "0", "stop-color": "#fff" }, edge);
    el("stop", { offset: "0.62", "stop-color": "#fff" }, edge);
    el("stop", { offset: "1", "stop-color": "#fff", "stop-opacity": "0" }, edge);
    const mask = el("mask", { id: `${id}m`, maskUnits: "userSpaceOnUse", x: "0", y: "0", width: "320", height: "150" }, defs);
    el("rect", { width: "320", height: "150", fill: `url(#${id}e)` }, mask);
    const stage = el("g", { mask: `url(#${id}m)` }, svg);
    const steps = ex.steps;
    const total = steps.reduce((a, s) => a + s[1], 0);

    const animate = (node, frames, times, duration, easing, opts = {}) => {
      if (!animated) return;
      const kf = frames.map((f, i) => Object.assign({ offset: times[i], easing }, f));
      anims.push(node.animate(kf, Object.assign({ duration: duration * 1000, iterations: Infinity }, opts)));
    };
    const circle = (cx, cy, r, attrs, parent = stage) => el("circle", Object.assign({ cx, cy, r }, attrs), parent);
    const at = (x, y, s = 1) => ({ transform: `translate(${x}px, ${y}px) scale(${s})` });
    const line = (x1, y1, x2, y2, stroke, w, parent = stage) => el("line", { x1, y1, x2, y2, stroke, "stroke-width": w, "stroke-linecap": "round" }, parent);
    const hills = (base, amp, waves) => {
      const seg = 320 / waves;
      let d = `M0 150 L0 ${base}`;
      for (let i = 0; i < waves; i++) d += ` Q${i * seg + seg / 2} ${base - amp * 2} ${(i + 1) * seg} ${base}`;
      return d + " L320 150 Z";
    };
    const shoulderPath = (lift, roll) =>
      `M${98 + roll} ${104 - lift} Q120 ${84 - lift} 160 82 Q200 ${84 - lift} ${222 - roll} ${104 - lift}`;
    const posesAnim = (node, poses) => {
      if (!animated || total <= 0) return;
      const times = [0], rot = [0], drop = [0];
      let t = 0;
      steps.forEach((s, i) => {
        if (i >= poses.length) return;
        const ease = Math.min(1.6, s[1] / 4);
        times.push((t + ease) / total, (t + s[1] - ease) / total, (t + s[1]) / total);
        rot.push(poses[i][0], poses[i][0], 0);
        drop.push(poses[i][1], poses[i][1], 0);
        t += s[1];
      });
      if (t < total) { times.push(1); rot.push(0); drop.push(0); }
      const frames = times.map((_, i) => ({ transform: `translate(0px, ${drop[i]}px) rotate(${rot[i] * 180 / Math.PI}deg)` }));
      animate(node, frames, times, total, IN_OUT);
    };

    function eye(cycle, closeAt, openAt, holdClosed) {
      const almond = "M-75 0 Q0 -74 75 0 Q0 74 -75 0 Z";
      const shut = 2 / 74;
      const clip = el("clipPath", { id: `${id}c` }, defs);
      const clipPath = el("path", { d: almond }, clip);
      clipPath.style.transform = "translate(160px, 75px)";
      const inner = el("g", { "clip-path": `url(#${id}c)` }, stage);
      circle(160, 75, 24, { fill: soft }, inner);
      const pupilWrap = el("g", { transform: "translate(160 75)" }, inner);
      const pupil = circle(0, 0, 10, { fill: tint }, pupilWrap);
      circle(167, 67, 4, { fill: ink }, inner);
      const outline = el("path", { d: almond, fill: "none", stroke: ink, "stroke-width": "2.5", "vector-effect": "non-scaling-stroke" }, stage);
      outline.style.transform = "translate(160px, 75px)";
      const lid = (s) => ({ transform: `translate(160px, 75px) scaleY(${s})` });
      const times = holdClosed ? [0, closeAt, openAt, 1] : [0, closeAt, closeAt + 0.03, openAt, 1];
      const vals = holdClosed ? [1, shut, shut, 1] : [1, 1, shut, 1, 1];
      [clipPath, outline].forEach((n) => animate(n, vals.map(lid), times, cycle, IN_OUT));
      animate(pupil, [1, 1.18, 1, 1].map((s) => ({ transform: `scale(${s})` })), [0, 0.4, 0.8, 1], cycle * 2, IN_OUT);
    }

    switch (ex.motion) {
      case "horizon": {
        el("path", { d: hills(92, 7, 3), fill: rgba(tint, 0.12) }, stage);
        el("path", { d: hills(124, 12, 2), fill: rgba(tint, 0.24) }, stage);
        const sunWrap = el("g", { transform: "translate(112 42)" }, stage);
        const sun = circle(0, 0, 10, { fill: faint }, sunWrap);
        const ring = circle(0, 0, 14, { fill: "none", stroke: ink, "stroke-width": "2" });
        const near = [96, 130], far = [226, 80];
        const times = [0, 0.3, 0.82, 0.9, 1];
        if (animated) {
          animate(ring, [at(...near, 1.5), at(...far, 0.55), at(...far, 0.55), at(...far, 0.55), at(...near, 1.5)], times, 8, IN_OUT);
          animate(ring, [0, 1, 1, 0, 0].map((o) => ({ opacity: o })), times, 8, OUT);
          animate(sun, [1, 1, 1.18, 1, 1].map((s) => ({ transform: `scale(${s})` })), times, 8, IN_OUT);
        } else {
          Object.assign(ring.style, at(...far, 0.55));
        }
        break;
      }
      case "blink":
        eye(3, 0.06, 0.16, false);
        break;
      case "palm": {
        const cycle = Math.max(total, 1);
        const closeEnd = total > 0 ? steps[0][1] / total : 0.25;
        const openStart = total > 0 ? 1 - steps[steps.length - 1][1] / total : 0.75;
        eye(cycle, closeEnd, openStart, true);
        const g = el("radialGradient", { id: `${id}d`, cx: "0.5", cy: "0.5", r: "0.6" }, defs);
        el("stop", { offset: "0", "stop-color": "#000", "stop-opacity": "0.85" }, g);
        el("stop", { offset: "1", "stop-color": "#000", "stop-opacity": "0" }, g);
        const fade = el("rect", { width: "320", height: "150", fill: `url(#${id}d)` }, stage);
        fade.style.opacity = animated ? "0" : "0.85";
        animate(fade, [0, 0.85, 0.85, 0].map((o) => ({ opacity: o })), [0, closeEnd, openStart, 1], cycle, IN_OUT);
        break;
      }
      case "nearFar": {
        line(150, 60, 310, 60, quiet, 1);
        circle(240, 60, 4, { fill: soft });
        el("rect", { x: 78, y: 104, width: 16, height: 46, rx: 8, fill: faint }, stage);
        circle(86, 104, 16, { fill: "none", stroke: soft, "stroke-width": "2" });
        const ring = circle(0, 0, 18, { fill: "none", stroke: ink, "stroke-width": "2" });
        const near = [86, 104], far = [240, 60];
        Object.assign(ring.style, at(...near, 1));
        const cycle = Math.max(total, 6);
        animate(ring, [at(...near, 1.2), at(...near, 1.2), at(...near, 1.2), at(...far, 0.4), at(...far, 0.4), at(...near, 1.2)], [0, 0.08, 0.42, 0.58, 0.92, 1], cycle, IN_OUT);
        break;
      }
      case "breathe": {
        [0.12, 0.22, 0.5].forEach((a, i) => {
          const r = 58 - i * 14;
          const c = circle(0, 0, r, { fill: rgba(tint, a) });
          Object.assign(c.style, at(160, 75, animated ? 0.6 : 1));
          animate(c, [0.6, 1.05, 1.05, 0.6].map((s) => at(160, 75, s)), [0, 4 / 12, 6 / 12, 1], 12, IN_OUT, { delay: i * 120, fill: "backwards" });
        });
        break;
      }
      case "walk": {
        el("path", { d: "M40 108 Q160 40 280 108", fill: "none", stroke: quiet, "stroke-width": "1", "stroke-dasharray": "3 6", "stroke-linecap": "round" }, stage);
        const count = 8;
        for (let i = 0; i < count; i++) {
          const t = i / (count - 1);
          const x = 40 + t * 240;
          const y = 108 - Math.sin(t * Math.PI) * 34 + (i % 2 === 0 ? -9 : 9);
          const deg = (i % 2 === 0 ? -0.25 : 0.25) * 180 / Math.PI;
          const g = el("g", { transform: `rotate(${deg} ${x} ${y})`, fill: soft }, stage);
          el("ellipse", { cx: x, cy: y - 3, rx: 7, ry: 10 }, g);
          el("ellipse", { cx: x, cy: y + 14.5, rx: 6, ry: 4.5 }, g);
          g.style.opacity = animated ? "0" : "1";
          const start = i / count;
          const peak = Math.min(start + 0.06, 0.99);
          const gone = Math.min(start + 0.5, 1);
          animate(g, [0, 0, 1, 0, 0].map((o) => ({ opacity: o })), [0, start, peak, gone, 1], 4, "linear");
        }
        break;
      }
      case "shoulders": {
        circle(98, 96, 12, { fill: "none", stroke: faint, "stroke-width": "1.5" });
        circle(222, 96, 12, { fill: "none", stroke: faint, "stroke-width": "1.5" });
        line(160, 61, 160, 80, ink, 3);
        const frames = [];
        for (let s = 0; s <= 12; s++) {
          const a = s / 12 * 2 * Math.PI;
          frames.push(shoulderPath(Math.sin(a) * 9, Math.cos(a) * 6));
        }
        const p = el("path", { d: frames[0], fill: "none", stroke: ink, "stroke-width": "3", "stroke-linecap": "round", "stroke-linejoin": "round" }, stage);
        if (animated) {
          el("animate", { attributeName: "d", values: frames.join(";"), dur: "3s", repeatCount: "indefinite", calcMode: "linear" }, p);
        }
        const head = circle(160, 44, 17, { fill: soft });
        animate(head, [0, -4, 0, 2, 0].map((y) => ({ transform: `translateY(${y}px)` })), [0, 0.25, 0.5, 0.75, 1], 3, IN_OUT);
        break;
      }
      case "neck": {
        el("path", { d: shoulderPath(0, 0), fill: "none", stroke: ink, "stroke-width": "3", "stroke-linecap": "round" }, stage);
        const head = el("g", {}, stage);
        head.style.transformOrigin = "160px 80px";
        line(160, 61, 160, 80, ink, 3, head);
        circle(160, 44, 17, { fill: soft }, head);
        circle(153, 41, 2, { fill: ink }, head);
        circle(167, 41, 2, { fill: ink }, head);
        posesAnim(head, [[0, 10], [-0.42, 0], [0.42, 0], [0, -8]]);
        break;
      }
      case "hinge": {
        line(90, 146, 230, 146, quiet, 1);
        el("path", { d: "M146 146 L160 96 L174 146", fill: "none", stroke: ink, "stroke-width": "3", "stroke-linecap": "round", "stroke-linejoin": "round" }, stage);
        const torso = el("g", {}, stage);
        torso.style.transformOrigin = "160px 96px";
        line(160, 96, 160, 50, ink, 3, torso);
        line(160, 58, 140, 82, ink, 2.5, torso);
        line(160, 58, 180, 82, ink, 2.5, torso);
        circle(160, 36, 13, { fill: soft }, torso);
        posesAnim(torso, [[0.9, 0], [-0.22, 6], [0.22, 6], [0, -2]]);
        break;
      }
      case "water": {
        const glass = "M130 28 L137 132 L183 132 L190 28";
        for (let i = 0; i < 3; i++) {
          const d = circle(160, 14, 2.5, { fill: soft });
          if (animated) {
            anims.push(d.animate([{ transform: "translateY(-6px)" }, { transform: "translateY(46px)" }], { duration: 700, iterations: Infinity, easing: EASE_IN, delay: i * 230 }));
          } else d.style.opacity = "0";
        }
        const clip = el("clipPath", { id: `${id}g` }, defs);
        el("path", { d: glass }, clip);
        const fill = el("g", { "clip-path": `url(#${id}g)` }, stage);
        const body = el("rect", { x: 120, y: 30, width: 80, height: 104, fill: soft }, fill);
        body.style.transformOrigin = "160px 134px";
        body.style.transform = `scaleY(${animated ? 0.1 : 0.78})`;
        animate(body, [0.08, 0.8, 0.8, 0.08].map((s) => ({ transform: `scaleY(${s})` })), [0, 0.55, 0.88, 1], 7, OUT);
        el("path", { d: glass, fill: "none", stroke: ink, "stroke-width": "2.5", "stroke-linecap": "round", "stroke-linejoin": "round" }, stage);
        break;
      }
    }
    return { svg, anims };
  }

  function makeRing(circle, seconds, playing) {
    const a = circle.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: 1 }], { duration: seconds * 1000, easing: "linear", fill: "forwards" });
    if (!playing) a.pause();
    return a;
  }

  (() => {
    const root = $(".js-brk");
    if (!root) return;
    const sec = root.closest("section");
    const ui = {
      clock: $(".js-brk-clock", root), msg: $(".js-brk-msg", root), kind: $(".js-brk-kind", root),
      head: $(".js-brk-head", root), detail: $(".js-brk-detail", root), scene: $(".js-brk-scene", root),
      step: $(".js-brk-step", root), prog: $(".js-brk-prog", root), time: $(".js-brk-time", root),
      pips: $(".js-brk-pips", root), dot: $(".js-brk-head-dot", root),
      snooze: $(".js-brk-snooze", root), skip: $(".js-brk-skip", root), skipLabel: $(".js-brk-skip-label", root),
      lock: $(".js-brk-lock", root), done: $(".js-brk-done", root), foot: $(".js-brk-foot", root), esc: $(".js-brk-esc", root),
      off: $(".js-brk-off", root), offMsg: $(".js-brk-off-msg", root), again: $(".js-brk-again", root),
      chips: $(".js-brk-chips", sec), status: $(".js-brk-status", sec), kinds: $$(".kind", sec)
    };
    const skipIcon = ui.skip.querySelector("svg").outerHTML;
    const checkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
    let ex = null, exId = null, ring = null, scene = null, live = false, touched = false;
    let armed = false, armTimer = 0, raf = 0, lastStep = "", mode = "run", endTimer = 0, skipMode = "";
    let head = null, timeText = "", pipBars = [], pipFill = [];
    const swapMs = still ? 200 : 400;
    const swapEase = still ? "ease" : OUT;

    const playing = () => live && mode === "run";
    function setPlay() {
      const on = playing();
      if (ring) on ? ring.play() : ring.pause();
      if (head) {
        if (ring) head.currentTime = ring.currentTime;
        on ? head.play() : head.pause();
      }
      if (scene) {
        scene.anims.forEach((a) => (on ? a.play() : a.pause()));
        if (scene.svg.pauseAnimations) on ? scene.svg.unpauseAnimations() : scene.svg.pauseAnimations();
      }
      cancelAnimationFrame(raf);
      if (on) raf = requestAnimationFrame(tick);
    }

    function renderChips(kind) {
      ui.chips.style.setProperty("--tint", TINT[kind]);
      ui.chips.innerHTML = "";
      ORDER[kind].forEach((id) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip-q";
        b.dataset.id = id;
        b.textContent = EXERCISES[id].chip;
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", () => { touched = true; start(id); });
        ui.chips.appendChild(b);
      });
    }
    function markChips() {
      $$(".chip-q", ui.chips).forEach((b) => {
        const on = b.dataset.id === exId;
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      ui.kinds.forEach((k) => k.setAttribute("aria-checked", k.dataset.kind === ex.kind ? "true" : "false"));
    }

    function line(text) {
      const span = document.createElement("span");
      span.className = "brk-line";
      span.textContent = text;
      return span;
    }

    function setTip(text, swap) {
      const cur = ui.step.querySelector(".brk-line:not([data-out])");
      if (!swap || !cur) { ui.step.replaceChildren(line(text)); return; }
      const next = line(text);
      cur.dataset.out = "1";
      cur.setAttribute("aria-hidden", "true");
      ui.step.appendChild(next);
      const out = still ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(-6px)" }];
      const inn = still ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "translateY(0)" }];
      cur.animate(out, { duration: swapMs, easing: swapEase, fill: "forwards" }).onfinish = () => cur.remove();
      next.animate(inn, { duration: swapMs, easing: swapEase, fill: "backwards" });
    }

    function buildPips() {
      const steps = ex.steps;
      ui.pips.replaceChildren();
      pipBars = [];
      pipFill = [];
      if (steps.length < 2) { ui.pips.dataset.single = ""; return; }
      delete ui.pips.dataset.single;
      steps.forEach(() => {
        const track = document.createElement("i");
        const bar = document.createElement("b");
        track.appendChild(bar);
        ui.pips.appendChild(track);
        pipBars.push(bar);
        pipFill.push(0);
      });
    }

    function paintPips(elapsed) {
      if (pipBars.length < 2 || pipBars.length !== ex.steps.length) return;
      const total = ex.steps.reduce((a, s) => a + s[1], 0);
      let off = total > 0 ? (still ? Math.floor(elapsed + 1e-6) : elapsed) % total : 0;
      ex.steps.forEach((s, i) => {
        const f = Math.max(0, Math.min(1, off / s[1]));
        off -= s[1];
        if (f === pipFill[i]) return;
        pipFill[i] = f;
        pipBars[i].style.transform = `scaleX(${f})`;
      });
    }

    function digit(ch) {
      const span = document.createElement("span");
      span.textContent = ch;
      return span;
    }

    function setTime(text, remaining) {
      ui.time.classList.toggle("urgent", remaining <= 5);
      if (text === timeText) return;
      const prev = timeText;
      timeText = text;
      const slots = Array.from(ui.time.children);
      if (prev.length !== text.length || slots.length !== text.length) {
        ui.time.replaceChildren(...Array.from(text, (ch) => {
          const slot = document.createElement("span");
          slot.className = "brk-d";
          slot.appendChild(digit(ch));
          return slot;
        }));
        return;
      }
      Array.from(text).forEach((ch, i) => {
        if (ch === prev[i]) return;
        const slot = slots[i];
        const cur = slot.querySelector("span:not([data-out])");
        const next = digit(ch);
        slot.appendChild(next);
        const ms = still ? 200 : 350;
        if (cur) {
          cur.dataset.out = "1";
          cur.setAttribute("aria-hidden", "true");
          const out = still ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(-0.42em)" }];
          cur.animate(out, { duration: ms, easing: swapEase, fill: "forwards" }).onfinish = () => cur.remove();
        }
        const inn = still ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: "translateY(0.42em)" }, { opacity: 1, transform: "translateY(0)" }];
        next.animate(inn, { duration: ms, easing: swapEase, fill: "backwards" });
      });
    }

    function makeDrain(seconds) {
      const timing = { duration: seconds * 1000, easing: still ? `steps(${Math.round(seconds)}, end)` : "linear", fill: "forwards" };
      if (ring) ring.cancel();
      if (head) head.cancel();
      ring = ui.prog.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: 1 }], timing);
      head = ui.dot.animate([{ transform: "rotate(360deg)" }, { transform: "rotate(0deg)" }], timing);
      ring.pause();
      head.pause();
    }

    function fill() {
      ui.kind.textContent = ex.kind === "eyes" ? "Eye break" : "Move break";
      ui.head.textContent = ex.headline;
      ui.detail.textContent = ex.detail;
      if (scene) scene.anims.forEach((a) => a.cancel());
      scene = buildScene(ex, TINT[ex.kind], !still);
      ui.scene.replaceChildren(scene.svg);
      lastStep = ex.steps[0][0];
      setTip(lastStep, false);
      buildPips();
      paintPips(0);
    }

    function start(id, fresh = true) {
      const prevKind = ex && ex.kind;
      exId = id;
      ex = EXERCISES[id];
      clearTimeout(endTimer);
      disarm();
      mode = "run";
      root.dataset.kind = ex.kind;
      if (prevKind !== ex.kind) renderChips(ex.kind);
      markChips();
      makeDrain(DURATION[ex.kind]);
      root.classList.remove("is-done");
      const wasOff = root.classList.contains("is-off");
      root.classList.remove("is-off");
      hideOff();
      if (fresh && !wasOff && !still && ui.msg.dataset.ready) {
        ui.msg.classList.add("swap");
        setTimeout(() => { fill(); ui.msg.classList.remove("swap"); setPlay(); }, 280);
      } else {
        fill();
      }
      ui.msg.dataset.ready = "1";
      ui.status.textContent = "";
      controls(0);
      setPlay();
    }

    function controls(elapsed) {
      const dur = DURATION[ex.kind];
      const finished = mode === "done";
      const left = finished ? 0 : dur - elapsed;
      setTime(clock(left), Math.max(0, Math.ceil(left - 1e-6)));
      ui.snooze.hidden = finished;
      ui.lock.hidden = finished;
      ui.skip.hidden = finished;
      ui.done.hidden = !finished;
      ui.foot.style.visibility = finished ? "hidden" : "visible";
      if (finished) return;
      const wait = Math.ceil(5 - elapsed);
      if (elapsed / dur >= 0.75) {
        if (skipMode !== "end") { ui.skip.innerHTML = checkIcon + '<span class="js-brk-skip-label">End break</span>'; skipMode = "end"; }
        ui.skip.disabled = false;
      } else {
        if (skipMode !== "skip") { ui.skip.innerHTML = skipIcon + '<span class="js-brk-skip-label"></span>'; skipMode = "skip"; }
        const label = ui.skip.querySelector("span");
        label.textContent = wait > 0 ? `Skip in ${wait}` : "Skip break";
        ui.skip.disabled = wait > 0;
      }
      if (!armed) ui.esc.textContent = wait > 0 ? "twice to snooze the break" : "twice to skip the break";
    }

    function tick() {
      raf = 0;
      if (!ring || !playing()) return;
      const dur = DURATION[ex.kind];
      const elapsed = Math.min(dur, (ring.currentTime || 0) / 1000);
      const s = stepAt(ex.steps, elapsed)[0];
      if (s !== lastStep) {
        lastStep = s;
        setTip(s, true);
      }
      paintPips(elapsed);
      if (elapsed >= dur) { finish(); return; }
      controls(elapsed);
      raf = requestAnimationFrame(tick);
    }

    function finish() {
      mode = "done";
      disarm();
      root.classList.add("is-done");
      controls(DURATION[ex.kind]);
      if (scene) scene.anims.forEach((a) => a.pause());
      if (!touched && live) {
        endTimer = setTimeout(() => {
          if (touched || mode !== "done") return;
          const list = ORDER.eyes.concat(ORDER.body);
          start(list[(list.indexOf(exId) + 1) % list.length]);
        }, 2600);
      }
    }

    function showOff(text, button) {
      mode = "off";
      disarm();
      clearTimeout(endTimer);
      setPlay();
      root.classList.add("is-off");
      ui.offMsg.textContent = text;
      ui.again.querySelector("span").textContent = button;
      ui.off.hidden = false;
      ui.off.classList.add("enter");
      requestAnimationFrame(() => requestAnimationFrame(() => ui.off.classList.remove("enter")));
    }
    function hideOff() { ui.off.hidden = true; }

    function elapsedNow() { return ring ? (ring.currentTime || 0) / 1000 : 0; }
    function skip() {
      touched = true;
      showOff("Skipped. Your desktop is back.", "Start it again");
      ui.status.textContent = "In the app, a skipped break still shows up in your day, so the week stays honest.";
    }
    function snooze() {
      touched = true;
      showOff("Snoozed for five minutes.", "Bring it back now");
      ui.status.textContent = "Snoozes have a daily budget. Once it runs out, Snooze disappears until tomorrow.";
    }
    function disarm() {
      armed = false;
      clearTimeout(armTimer);
      ui.foot.classList.remove("armed");
    }

    ui.skip.addEventListener("click", () => {
      if (skipMode === "end") { touched = true; mode = "done"; showOff("Break done. It counts.", "Another one"); ui.status.textContent = "Once three quarters are done, End break replaces Skip and still counts."; return; }
      skip();
    });
    ui.snooze.addEventListener("click", snooze);
    ui.lock.addEventListener("click", () => { touched = true; ui.status.textContent = "In the app, this locks your Mac. Here it would only lock you out of the website."; });
    ui.done.addEventListener("click", () => {
      touched = true;
      showOff("Break done. Back to work.", "Another one");
      ui.status.textContent = "";
    });
    ui.again.addEventListener("click", () => {
      touched = true;
      const label = ui.again.textContent.trim();
      if (label === "Another one") {
        const list = ORDER[ex.kind];
        start(list[(list.indexOf(exId) + 1) % list.length], false);
      } else start(exId, false);
    });
    ui.kinds.forEach((k) => k.addEventListener("click", () => { touched = true; if (ex.kind !== k.dataset.kind) start(ORDER[k.dataset.kind][0]); }));
    ui.kinds.forEach((k, i) => k.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const next = ui.kinds[(i + 1) % ui.kinds.length];
      next.focus();
      next.click();
    }));

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !live || mode !== "run" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (typing(document.activeElement) || document.querySelector(".bar.open")) return;
      e.preventDefault();
      touched = true;
      const canSkip = elapsedNow() >= 5;
      if (!armed) {
        armed = true;
        ui.foot.classList.add("armed");
        ui.esc.textContent = canSkip ? "again to skip" : "again to snooze";
        clearTimeout(armTimer);
        armTimer = setTimeout(() => { disarm(); if (ex) controls(elapsedNow()); }, 2500);
        return;
      }
      disarm();
      canSkip ? skip() : snooze();
    });

    function pick(kind) {
      touched = true;
      start(ORDER[kind][0], false);
    }
    document.addEventListener("vista:pick", (e) => pick(e.detail));
    $$("[data-pick]").forEach((a) => a.addEventListener("click", () => pick(a.dataset.pick)));

    const tickClock = () => { ui.clock.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); };
    tickClock();
    setInterval(tickClock, 15000);

    start(ORDER.eyes[0], false);
    onView(root, () => { live = true; setPlay(); }, () => { live = false; setPlay(); }, 0.3);
  })();

  (() => {
    const root = $(".js-rhy");
    if (!root) return;
    const SPAN = 240;
    const BODY_LEN = 5;
    const EYE_LEN = 20 / 60;
    const cfg = {
      eyes: { v: 20, min: 5, max: 60, step: 5 },
      body: { v: 45, min: 15, max: 180, step: 15 },
      gap: { v: 10, min: 0, max: 20, step: 5 }
    };
    const lanes = { eyes: $(".js-rhy-eyes", root), body: $(".js-rhy-body", root) };
    const sum = $(".js-rhy-sum", root);
    const head = $(".js-rhy-head", root);
    const hours = $(".js-rhy-hours", root);
    ["9:00", "10:00", "11:00", "12:00", "13:00"].forEach((h, i) => {
      const s = document.createElement("span");
      s.textContent = h;
      s.style.left = `${i * 25}%`;
      hours.appendChild(s);
    });

    function plan() {
      const E = cfg.eyes.v, B = cfg.body.v, G = cfg.gap.v;
      let eyeDue = E, bodyDue = B, bodyFrom = null, eyeFrom = null;
      const out = [];
      let guard = 0;
      while (Math.min(eyeDue, bodyDue) < SPAN && guard++ < 200) {
        if (bodyDue <= eyeDue) {
          const t = bodyDue, end = t + BODY_LEN;
          out.push({ kind: "body", t, end, from: bodyFrom });
          out.push({ kind: "rest", t: end });
          bodyFrom = null;
          eyeDue = end + E;
          eyeFrom = null;
          bodyDue = end + B;
        } else {
          const t = eyeDue, end = t + EYE_LEN;
          out.push({ kind: "eyes", t, end, from: eyeFrom });
          eyeFrom = null;
          eyeDue = end + E;
          if (G > 0 && bodyDue < end + G) { bodyFrom = bodyFrom == null ? bodyDue : bodyFrom; bodyDue = end + G; }
        }
      }
      return out.filter((e) => e.t < SPAN);
    }

    const pool = { eyes: [], body: [], extra: [] };
    function get(list, i, parent, cls) {
      let n = list[i];
      if (!n) {
        n = document.createElement("span");
        n.className = `rm ${cls}${still ? "" : " rm-new"}`;
        n.innerHTML = '<span class="rm-in"></span>';
        parent.appendChild(n);
        list[i] = n;
      }
      return n;
    }
    function render() {
      const evs = plan();
      const pct = (t) => (t / SPAN) * 100;
      let ei = 0, bi = 0;
      const marks = [];
      pool.extra.forEach((n) => n.remove());
      pool.extra = [];
      let moved = 0, close = 0, rested = 0, eyes = 0, bodies = 0;
      evs.forEach((e) => {
        if (e.kind === "body") {
          const n = get(pool.body, bi++, lanes.body, "rm-body");
          n.style.setProperty("--x", pct(e.t));
          n.style.setProperty("--w", pct(BODY_LEN));
          marks.push([pct(e.t), n]);
          bodies++;
          if (e.from != null) { moved++; extra(lanes.body, "rm-moved", pct(e.from), pct(e.t)); }
        } else if (e.kind === "rest") {
          const n = get(pool.eyes, ei++, lanes.eyes, "rm-eye");
          n.classList.add("rested");
          n.style.setProperty("--x", pct(e.t));
          marks.push([pct(e.t), n]);
          rested++;
        } else {
          const n = get(pool.eyes, ei++, lanes.eyes, "rm-eye");
          n.classList.remove("rested");
          n.style.setProperty("--x", pct(e.t));
          marks.push([pct(e.t), n]);
          eyes++;
        }
      });
      const real = evs.filter((e) => e.kind !== "rest");
      for (let i = 1; i < real.length; i++) {
        const a = real[i - 1], b = real[i];
        if (a.kind !== b.kind && b.t - a.end < 10) {
          close++;
          extra(b.kind === "body" ? lanes.body : lanes.eyes, "rm-close", pct(a.end), pct(b.t));
        }
      }
      pool.eyes.splice(ei).forEach((n) => n.remove());
      pool.body.splice(bi).forEach((n) => n.remove());
      root._marks = marks;
      const g = cfg.gap.v;
      let text = `<b>${eyes} eye breaks</b> and <b>${bodies} move breaks</b> before lunch. Each move break rests your eyes too (the open circles), so the eye clock starts over.`;
      if (moved) text += ` ${moved === 1 ? "One move break was" : `${moved} move breaks were`} pushed back to keep ${g} minutes clear.`;
      if (close) text += ` <span class="warn">${close === 1 ? "Two breaks land" : `${close} pairs of breaks land`} under ten minutes apart.</span>`;
      sum.innerHTML = text;
    }
    function extra(parent, cls, from, x) {
      const n = document.createElement("span");
      n.className = cls;
      n.style.setProperty("--from", from);
      n.style.setProperty("--x", x);
      parent.appendChild(n);
      pool.extra.push(n);
    }

    $$(".rhy-step", root).forEach((row) => {
      const key = row.dataset.kind;
      const c = cfg[key];
      const out = $(".js-rhy-val", row);
      const dec = $(".js-rhy-dec", row), inc = $(".js-rhy-inc", row);
      const show = () => {
        out.textContent = key === "gap" && c.v === 0 ? "Off" : c.v >= 60 && key === "body" ? `${Math.floor(c.v / 60)} h${c.v % 60 ? ` ${c.v % 60}` : ""}` : `${c.v} min`;
        dec.disabled = c.v <= c.min;
        inc.disabled = c.v >= c.max;
      };
      dec.addEventListener("click", () => { c.v = Math.max(c.min, c.v - c.step); show(); render(); });
      inc.addEventListener("click", () => { c.v = Math.min(c.max, c.v + c.step); show(); render(); });
      show();
    });
    render();

    if (still) return;
    let live = false, raf = 0, t0 = 0, lastP = 0;
    const LOOP = 14000;
    function frame(now) {
      if (!live) return;
      if (!t0) t0 = now;
      const p = ((now - t0) % LOOP) / LOOP;
      head.style.setProperty("--px", `${p * head.clientWidth}px`);
      const pc = p * 100;
      (root._marks || []).forEach(([x, n]) => {
        if ((lastP <= x && x < pc) || (pc < lastP && x < pc)) {
          n.classList.remove("hit");
          void n.offsetWidth;
          n.classList.add("hit");
        }
      });
      lastP = pc;
      raf = requestAnimationFrame(frame);
    }
    onView(root, () => { if (live) return; live = true; t0 = 0; lastP = 0; raf = requestAnimationFrame(frame); }, () => { live = false; cancelAnimationFrame(raf); }, 0.3);
  })();

  (() => {
    const root = $(".js-sp");
    if (!root) return;
    const sec = root.closest("section");
    const START_H = 10, START_M = 10, SPAN = 50, DUE = 10, STEP_MS = 380;
    const ICONS = {
      call: '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h8A2.5 2.5 0 0 1 16 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-8A2.5 2.5 0 0 1 3 16.5zm14.5 2.8 3-2.1a.9.9 0 0 1 1.5.7v6.2a.9.9 0 0 1-1.5.7l-3-2.1z" fill="currentColor"/>',
      calendar: '<rect x="3.5" y="5" width="17" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      focus: '<path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z" fill="currentColor"/>',
      full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
      video: '<rect x="3" y="4.5" width="18" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 9v6l5-3z" fill="currentColor"/>',
      typing: '<rect x="2.5" y="6" width="19" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 10h1M9.5 10h1M13 10h1M16.5 10h1M7.5 14h9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    };
    const SENSORS = [
      { key: "call", name: "In a call", sub: "Asks macOS which app has the mic", c: "#5E8BFF", icon: "call" },
      { key: "calendar", name: "Busy in your calendar", sub: "Times only, never titles", c: "#FF6B6B", icon: "calendar" },
      { key: "focus", name: "A Focus is on", sub: "With Vista's filter", c: "#A78BFA", icon: "focus" },
      { key: "full", name: "Something full screen", sub: "Waits up to 45 minutes", c: "#34C7B5", icon: "full" },
      { key: "video", name: "Video playing", sub: "Waits up to 15 minutes", c: "#FF9F0A", icon: "video" },
      { key: "typing", name: "Typing", sub: "Lands at the next pause", c: "#9AA4B2", icon: "typing" }
    ];
    const WHY = {
      inCall: "You're in a call — it lands when the call ends.",
      focusMode: "A Focus with Vista's filter is on.",
      calendar: "Your calendar says you're busy.",
      settling: "Giving you a moment after that — it lands shortly.",
      fullScreen: "Something is full screen — up to 45 minutes.",
      watching: "Something is playing or presenting — up to 15 minutes.",
      typing: "You're mid-thought — it lands at the next pause."
    };
    const list = $(".js-sp-list", root);
    const rows = {};
    SENSORS.forEach((s) => {
      const li = document.createElement("li");
      li.innerHTML = `<button type="button" class="sp-row" role="switch" aria-checked="false" style="--c:${s.c}"><span class="sp-ic"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[s.icon]}</svg></span><span class="sp-tx"><b></b><small></small></span><span class="sp-sw" aria-hidden="true"><i></i></span></button>`;
      const b = li.firstChild;
      $("b", b).textContent = s.name;
      $("small", b).textContent = s.sub;
      b.addEventListener("click", () => { touched = true; set(s.key, !state.on[s.key]); draw(); });
      rows[s.key] = b;
      list.appendChild(li);
    });
    const ui = {
      menu: $(".js-sp-menu", root), clock: $(".js-sp-clock", root), card: $(".js-sp-card", root),
      title: $(".js-sp-title", root), why: $(".js-sp-why", root), axis: $(".js-sp-axis", root),
      track: $(".js-sp-track", root), due: $(".js-sp-due", root), play: $(".js-sp-play", root),
      prog: $(".js-sp-prog", root), count: $(".js-sp-count", root),
      status: $(".js-sp-status", sec), replay: $(".js-sp-replay", sec)
    };
    for (let i = 0; i <= 5; i++) {
      const s = document.createElement("span");
      s.textContent = fmt(i * 10);
      s.style.left = `${i * 20}%`;
      ui.axis.appendChild(s);
    }
    ui.due.style.setProperty("--d", (DUE / SPAN) * 100);

    function fmt(min) {
      const total = START_H * 60 + START_M + Math.floor(min);
      return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
    }

    let state, touched, live = false, timer = 0, raf = 0, ringAnim = null;
    function reset() {
      state = { t: 0, on: {}, since: {}, callEnd: null, busyEnded: null, lastBusy: false, landed: null, done: false, segs: [] };
      touched = false;
      SENSORS.forEach((s) => { rows[s.key].setAttribute("aria-checked", "false"); });
      $$(".sp-seg", ui.track).forEach((n) => n.remove());
      root.classList.remove("landed", "holding", "mic");
      ui.status.textContent = "";
      if (ringAnim) ringAnim.cancel();
      draw();
    }
    function set(key, on) {
      if (!!state.on[key] === on) return;
      state.on[key] = on;
      rows[key].setAttribute("aria-checked", on ? "true" : "false");
      if (key === "call") {
        if (on) { state.callEnd = null; state.segs.push({ cls: "call", a: state.t, b: null }); }
        else {
          state.callEnd = state.t;
          const seg = state.segs.filter((s) => s.cls === "call").pop();
          if (seg) seg.b = state.t;
          state.segs.push({ cls: "grace", a: state.t, b: state.t + 10 });
        }
      }
    }
    function decide() {
      const t = state.t;
      const held = t - DUE;
      const on = state.on;
      if (on.focus) return "focusMode";
      const inCall = on.call || (state.callEnd != null && t - state.callEnd < 10);
      if (inCall && held < 180) return "inCall";
      if (on.calendar && held < 180) return "calendar";
      if (on.full && held < 45) return "fullScreen";
      if (on.video && held < 15) return "watching";
      if (state.busyEnded != null && t - state.busyEnded < 1 && held < 180) return "settling";
      if (on.typing && held < 2) return "typing";
      return null;
    }
    const busy = (r) => r && r !== "typing" && r !== "settling";

    function draw() {
      const t = state.t;
      ui.clock.textContent = fmt(t);
      ui.play.style.setProperty("--p", Math.min(100, (t / SPAN) * 100));
      root.classList.toggle("mic", !!state.on.call);
      state.segs.forEach((s) => {
        if (!s.el) {
          s.el = document.createElement("span");
          s.el.className = `sp-seg ${s.cls}`;
          ui.track.insertBefore(s.el, ui.due);
        }
        const b = s.b == null ? t : Math.min(s.b, t);
        s.el.style.setProperty("--a", (s.a / SPAN) * 100);
        s.el.style.setProperty("--b", (Math.max(b, s.a) / SPAN) * 100);
      });
      if (state.landed != null) {
        ui.card.dataset.state = "landing";
        root.classList.remove("holding");
        ui.title.textContent = state.done ? `Eye break done at ${fmt(state.landed)}` : "Eye break, now";
        ui.why.textContent = state.done ? `Held for ${Math.round(state.landed - DUE)} minutes, then landed in a quiet moment. The next one is due at ${fmt(state.landed + 20)}.` : "A quiet moment. Look out the window.";
        ui.menu.textContent = state.done ? "20:00" : "0:20";
        return;
      }
      const reason = decide();
      if (t < DUE) {
        root.classList.remove("holding");
        ui.card.dataset.state = "waiting";
        const left = Math.ceil(DUE - t);
        ui.title.textContent = `Eye break in ${left} min`;
        ui.why.textContent = reason ? `If it were due now, it would wait. ${WHY[reason]}` : "Nothing in the way.";
        const secs = Math.max(0, (DUE - t) * 60);
        ui.menu.textContent = clock(secs);
      } else {
        root.classList.add("holding");
        ui.card.dataset.state = "holding";
        ui.title.textContent = "Holding your eye break";
        const held = Math.floor(t - DUE);
        ui.why.textContent = WHY[reason || "settling"] + (held >= 1 ? ` Held ${held} min so far.` : "");
        ui.menu.textContent = "Held";
      }
    }

    function land() {
      state.landed = state.t;
      state.segs.forEach((s) => { if (s.cls === "hold" && s.b == null) s.b = state.t; });
      state.segs.push({ cls: "land", a: state.t, b: state.t + 0.6 });
      draw();
      root.classList.add("landed");
      const dur = still ? 2500 : 5000;
      ringAnim = makeRing(ui.prog, dur / 1000, true);
      const t0 = performance.now();
      const count = () => {
        const p = Math.min(1, (performance.now() - t0) / dur);
        ui.count.textContent = clock(20 * (1 - p));
        if (p < 1 && root.classList.contains("landed")) raf = requestAnimationFrame(count);
      };
      raf = requestAnimationFrame(count);
      setTimeout(() => {
        root.classList.remove("landed");
        state.done = true;
        state.t = Math.min(SPAN, state.t + 0.4);
        draw();
        ui.status.textContent = touched ? "Flip the switches and replay to see what holds a break, and for how long." : "That was a call, a muted stretch after it, a moment to settle, then the break.";
      }, dur + 400);
    }

    function step() {
      if (!live || state.landed != null) return;
      const t = state.t + 0.5;
      state.t = t;
      if (!touched) {
        if (Math.abs(t - 2) < 0.01) set("call", true);
        if (Math.abs(t - 19) < 0.01) set("call", false);
        if (Math.abs(t - 8) < 0.01) set("typing", true);
        if (Math.abs(t - 9) < 0.01) set("typing", false);
      }
      if (t >= DUE) {
        const reason = decide();
        if (busy(state.lastBusy) && !busy(reason)) state.busyEnded = t;
        state.lastBusy = reason;
        const r2 = decide();
        if (r2) {
          let hold = state.segs.filter((s) => s.cls === "hold" && s.b == null).pop();
          if (!hold) state.segs.push({ cls: "hold", a: Math.max(DUE, t - 0.5), b: null });
        } else {
          land();
          return;
        }
      }
      draw();
      if (t >= SPAN) {
        ui.status.textContent = "The morning ran out before the break could land.";
        return;
      }
      timer = setTimeout(step, STEP_MS);
    }
    function run() { clearTimeout(timer); if (live && state.landed == null && state.t < SPAN) timer = setTimeout(step, STEP_MS); }

    ui.replay.addEventListener("click", () => { clearTimeout(timer); cancelAnimationFrame(raf); reset(); run(); });
    reset();
    onView(root, () => { live = true; run(); }, () => { live = false; clearTimeout(timer); }, 0.35);
  })();

  (() => {
    const root = $(".js-watch");
    if (!root) return;
    const prog = $(".js-watch-prog", root);
    const title = $(".js-watch-title", root);
    const steps = $(".js-watch-steps", root);
    const ripple = $(".watch-ripple", root);
    const watch = $(".watch", root);
    const btns = $$(".watch-pick button", root);
    let live = false, touched = false, raf = 0, cycle = 0, anims = [];
    const GOAL = 240, WALK = 5200;

    function show(view) {
      root.dataset.view = view;
      btns.forEach((b) => b.setAttribute("aria-checked", b.dataset.view === view ? "true" : "false"));
      cancelAnimationFrame(raf);
      anims.forEach((a) => a.cancel());
      anims = [];
      clearTimeout(cycle);
      if (view === "walk") walk();
      else tap();
    }
    function walk() {
      if (still || !live) {
        prog.style.strokeDasharray = "1 1";
        title.textContent = "Walked it off";
        steps.textContent = `${GOAL} steps · break done`;
        if (live && !touched) cycle = setTimeout(() => show("tap"), 4000);
        return;
      }
      title.textContent = "Move break";
      const t0 = performance.now();
      const f = (now) => {
        const p = Math.min(1, (now - t0) / WALK);
        const e = 1 - Math.pow(1 - p, 2);
        prog.style.strokeDasharray = `${e} 1`;
        steps.textContent = `${Math.round(e * GOAL)} steps`;
        if (p < 1) { raf = requestAnimationFrame(f); return; }
        title.textContent = "Walked it off";
        steps.textContent = `${GOAL} steps · break done`;
        if (!touched) cycle = setTimeout(() => show("tap"), 2400);
      };
      raf = requestAnimationFrame(f);
    }
    function tap() {
      if (!still && live) {
        anims.push(ripple.animate([{ opacity: 0.9, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.14)" }], { duration: 900, easing: "cubic-bezier(0.23, 1, 0.32, 1)", iterations: 2, delay: 300 }));
        anims.push(watch.animate([{ transform: "translateX(0)" }, { transform: "translateX(-1.5px)" }, { transform: "translateX(1.5px)" }, { transform: "translateX(-1px)" }, { transform: "translateX(0)" }], { duration: 260, delay: 300, iterations: 2, endDelay: 640, easing: "linear" }));
      }
      if (live && !touched) cycle = setTimeout(() => show("walk"), 4200);
    }
    btns.forEach((b) => b.addEventListener("click", () => { touched = true; show(b.dataset.view); }));
    onView(root, () => { if (live) return; live = true; show(root.dataset.view || "walk"); }, () => { live = false; clearTimeout(cycle); cancelAnimationFrame(raf); }, 0.4);
    prog.style.strokeDasharray = "1 1";
    steps.textContent = `${GOAL} steps · break done`;
    title.textContent = "Walked it off";
  })();

  (() => {
    const box = $(".js-swatches");
    if (!box) return;
    const name = $(".js-swatch-name");
    const panel = $(".js-mb");
    const PALETTES = [
      { id: "plum", label: "Plum", base: "#100B1C", accent: "#FF7A59", second: "#3B2A6B" },
      { id: "ember", label: "Ember", base: "#0B0A0C", accent: "#FF7A59", second: "#5A2A1E" },
      { id: "midnight", label: "Midnight", base: "#0B1325", accent: "#5AAEFF", second: "#1E3A70" },
      { id: "forest", label: "Forest", base: "#0D1A14", accent: "#3FD485", second: "#14532D" },
      { id: "eclipse", label: "Eclipse", base: "#07050F", accent: "#9D4EDD", second: "#4B0082" },
      { id: "sunset", label: "Sunset", base: "#1F0F14", accent: "#FFB347", second: "#C13B7A" },
      { id: "aurora", label: "Aurora", base: "#070A1C", accent: "#FF3D88", second: "#5B3BFF" },
      { id: "candy", label: "Candy", base: "#1A0E1C", accent: "#FF6BB5", second: "#2E6E9E" },
      { id: "graphite", label: "Graphite", base: "#1C1C1E", accent: "#4287F5", second: "#24324A" }
    ];
    const lum = (hex) => {
      const n = parseInt(hex.slice(1), 16);
      const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const rootStyle = document.documentElement.style;
    function apply(p, announce) {
      rootStyle.setProperty("--pal-accent", p.accent);
      rootStyle.setProperty("--pal-second", p.second);
      rootStyle.setProperty("--pal-base", p.base);
      rootStyle.setProperty("--on-accent", lum(p.accent) > 0.3 ? "#1A0B06" : "#FFFFFF");
      $$(".swatch", box).forEach((s) => s.setAttribute("aria-checked", s.dataset.id === p.id ? "true" : "false"));
      if (announce) name.innerHTML = `<b>${p.label}</b> — the page follows along.`;
      else name.innerHTML = `<b>${p.label}</b> is Vista's default.`;
    }
    PALETTES.forEach((p, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "swatch";
      b.dataset.id = p.id;
      b.setAttribute("role", "radio");
      b.setAttribute("aria-label", p.label);
      b.setAttribute("aria-checked", i === 0 ? "true" : "false");
      b.style.setProperty("--a", p.accent);
      b.style.setProperty("--b", p.second);
      b.addEventListener("click", () => apply(p, true));
      box.appendChild(b);
    });
    name.innerHTML = "<b>Plum</b> is Vista's default.";
    $$(".mat").forEach((m) => m.addEventListener("click", () => {
      $$(".mat").forEach((x) => x.setAttribute("aria-checked", x === m ? "true" : "false"));
      panel.dataset.mat = m.dataset.style;
    }));
  })();
})();
