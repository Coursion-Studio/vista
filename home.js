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
      steps: [["Stand tall, hands on your hips", 15], ["Left knee to your chest, hold", 30], ["Right knee to your chest, hold", 30], ["Stand tall and breathe", 15]]
    },
    "body.neck": {
      kind: "body", chip: "Neck", motion: "neck",
      headline: "Lengthen your neck",
      detail: "Ear toward shoulder, slow, both sides. Then chin gently back — not down — to unstack the forward head tilt.",
      steps: [["Ear to your left shoulder", 25], ["Ear to your right shoulder", 25], ["Chin gently back", 20], ["Shoulders down, breathe", 20]]
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

  const bez = (x1, y1, x2, y2, x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0, hi = 1;
    for (let i = 0; i < 24; i++) {
      const s = (lo + hi) / 2;
      const cx = 3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s;
      if (cx < x) lo = s; else hi = s;
    }
    const s = (lo + hi) / 2;
    return 3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s;
  };
  const inOut = (x) => bez(0.77, 0, 0.175, 1, x);
  const easeOut = (x) => bez(0.23, 1, 0.32, 1, x);
  const unit = (t, a, b) => Math.min(Math.max((t - a) / (b - a), 0), 1);
  const move = (t, a, b) => inOut(unit(t, a, b));
  const bump = (t, a, b, c, d) => move(t, a, b) - move(t, c, d);
  const wave = (t, p) => 0.5 - 0.5 * Math.cos(2 * Math.PI * t / p);
  const num = (v) => Math.round(v * 100) / 100;

  function moveScene(motion, c) {
    const { stage, defs, id, tint, animated, steps, faint, soft, ink, quiet } = c;
    const el = (name, attrs, parent = stage) => c.el(name, attrs, parent);
    const white = (a) => `rgba(255, 255, 255, ${a})`;
    const glows = {};
    let glowSeq = 0;
    const glow = (r, alpha, parent = stage) => {
      const key = String(alpha);
      if (!glows[key]) {
        const g = el("radialGradient", { id: `${id}g${glowSeq++}`, cx: "0.5", cy: "0.5", r: "0.5" }, defs);
        el("stop", { offset: "0", "stop-color": tint, "stop-opacity": alpha }, g);
        el("stop", { offset: "1", "stop-color": tint, "stop-opacity": "0" }, g);
        glows[key] = g.id;
      }
      return el("circle", { r, fill: `url(#${glows[key]})` }, parent);
    };
    const circ = (r, attrs = {}, parent = stage) => el("circle", Object.assign({ r }, attrs), parent);
    const ln = (x1, y1, x2, y2, stroke, w, dash) => {
      const a = { x1, y1, x2, y2, stroke, "stroke-width": w, "stroke-linecap": "round" };
      if (dash) a["stroke-dasharray"] = dash;
      return el("line", a);
    };
    const poly = (pts, stroke, w, dash, parent = stage) => {
      const a = { d: "M" + pts.map((p) => `${num(p[0])} ${num(p[1])}`).join(" L"), fill: "none", stroke, "stroke-width": w, "stroke-linecap": "round", "stroke-linejoin": "round" };
      if (dash) a["stroke-dasharray"] = dash;
      return el("path", a, parent);
    };
    const put = (n, x, y, s = 1, r = 0) => {
      n.setAttribute("transform", `translate(${num(x)} ${num(y)}) rotate(${num(r * 180 / Math.PI)}) scale(${num(s)})`);
    };
    const op = (n, o) => n.setAttribute("opacity", num(Math.max(0, Math.min(1, o))));
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const phases = (fallback) => {
      const lens = steps.length === fallback.length ? steps.map((s) => s[1]) : fallback;
      let cur = 0;
      return lens.map((l) => { const p = { start: cur, end: cur + l }; cur += l; return p; });
    };
    const pulse = (n, cx, cy, t, start, life, from, to, peak) => {
      const age = unit(t, start, start + life);
      put(n, cx, cy, from + (to - from) * easeOut(age));
      op(n, peak * unit(t, start - 0.05, start + life * 0.12) * Math.pow(1 - age, 1.5));
    };
    const comet = (count, lag, radius, position) => {
      if (!animated) return () => {};
      const dots = [];
      for (let k = 1; k <= count; k++) {
        const share = k / (count + 1);
        dots.push([circ(radius * (1 - 0.55 * share), { fill: rgba(tint, 0.4 * (1 - share)) }), lag * k]);
      }
      return (t) => dots.forEach(([n, delay]) => {
        const a = position(t), b = position(t - delay);
        put(n, b[0], b[1]);
        op(n, dist(a, b) / 5);
      });
    };
    const hillsPath = (base, amp, waves) => {
      const seg = 320 / waves;
      let d = `M0 150 L0 ${base}`;
      for (let i = 0; i < waves; i++) d += ` Q${i * seg + seg / 2} ${base - amp * 2} ${(i + 1) * seg} ${base}`;
      return d + " L320 150 Z";
    };

    if (motion === "walk") {
      const ph = phases([20, 120, 100]);
      const total = ph[2].end;
      const seat = 116, stand = 56;
      const home = [70, stand], far = [258, 66], outC = [164, 6], backC = [164, 118];
      const riseEnd = 5, outStart = ph[1].start + 1.5, outEnd = ph[1].end - 1.5;
      const backStart = ph[2].start + 1.5, backEnd = total - 7, sinkStart = total - 5.5, sinkEnd = total - 1.5;
      const still = outStart + (outEnd - outStart) * 0.42;
      const curve = (a, k, b, u) => [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * k[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * k[1] + u * u * b[1]];
      const gait = (u) => 0.5 * u + 0.5 * inOut(u);
      const state = (t) => {
        if (t >= sinkStart) return { p: [home[0], stand + (seat - stand) * move(t, sinkStart, sinkEnd)], d: 1 };
        if (t >= backStart) { const u = gait(unit(t, backStart, backEnd)); return { p: curve(far, backC, home, u), d: 0.5 + 0.5 * u }; }
        if (t >= outStart) { const u = gait(unit(t, outStart, outEnd)); return { p: curve(home, outC, far, u), d: 1 - 0.5 * u }; }
        return { p: [home[0], seat - (seat - stand) * move(t, 1, riseEnd)], d: 1 };
      };
      el("path", { d: hillsPath(100, 6, 3), fill: rgba(tint, 0.1) }, stage);
      el("path", { d: hillsPath(130, 9, 2), fill: rgba(tint, 0.2) }, stage);
      const arc = (a, k, b) => Array.from({ length: 31 }, (_, i) => curve(a, k, b, i / 30));
      poly(arc(home, outC, far), quiet, 1, "2 5");
      poly(arc(far, backC, home), quiet, 1, "2 5");
      ln(70, seat - 6, 70, stand + 6, quiet, 1, "2 5");
      ln(44, seat, 96, seat, soft, 2);
      ln(52, stand, 88, stand, quiet, 1);
      ln(214, far[1], 304, far[1], quiet, 1);
      const hz = glow(34, 0.5);
      put(hz, far[0], far[1]);
      const prints = [];
      let stamp = outStart + 2.5, side = 1;
      while (stamp < backEnd - 1) {
        if (stamp > outEnd - 2 && stamp < backStart + 1) { stamp = backStart + 2.5; continue; }
        const at = state(stamp);
        prints.push({ n: circ(6, { fill: "none", stroke: white(0.6), "stroke-width": 1.5 }), x: at.p[0], y: at.p[1] + 5 * side, d: at.d, start: stamp });
        stamp += 3.5;
        side = -side;
      }
      const ripples = [riseEnd, backEnd].map((m) => ({ n: circ(14, { fill: "none", stroke: soft, "stroke-width": 1.5 }), start: m }));
      const walker = el("g", {}, stage);
      glow(18, 0.5, walker);
      circ(7, { fill: faint, stroke: ink, "stroke-width": 2 }, walker);
      circ(2.5, { fill: ink }, walker);
      return (e) => {
        const t = animated ? e % total : still;
        const s = state(t);
        op(hz, 0.35 + 0.65 * (1 - (s.d - 0.5) * 2));
        prints.forEach((p) => pulse(p.n, p.x, p.y, t, p.start, 14, 0.3 * p.d, 2.1 * p.d, 1));
        ripples.forEach((r) => pulse(r.n, home[0], home[1], t, r.start, 4, 0.4, 2.2, 0.9));
        put(walker, s.p[0], s.p[1], s.d);
        op(walker, 0.45 + 0.55 * (s.d - 0.5) * 2);
      };
    }

    if (motion === "shoulders") {
      const ph = phases([30, 30, 40]);
      const total = ph[2].end;
      const pivot = [160, 88], arm = 54;
      const still = ph[1].start + 14;
      const turn = (ph[0].end - ph[0].start) / 10;
      const amplitude = (t) => bump(t, 0.4, 1.4, ph[0].end - 1.2, ph[0].end - 0.2);
      const wing = (t) => 0.46 * bump(t, ph[1].start + 0.8, ph[1].start + 5.5, ph[1].end - 5.5, ph[1].end - 0.8);
      const tipL = (t) => bump(t, ph[2].start + 1, ph[2].start + 5, ph[2].start + 16, ph[2].start + 19);
      const tipR = (t) => bump(t, ph[2].start + 21, ph[2].start + 25, ph[2].start + 36, ph[2].start + 39);
      const wingHold = (t) => bump(t, ph[1].start + 3, ph[1].start + 6, ph[1].end - 6, ph[1].end - 3);
      const rest = (side, t) => {
        const a = wing(t), phase = 2 * Math.PI * t / turn, amp = amplitude(t);
        return [pivot[0] + side * arm * Math.cos(a) - side * 6 * Math.sin(phase) * amp, pivot[1] - arm * Math.sin(a) - 9 * Math.cos(phase) * amp];
      };
      const tip = (t) => {
        const a = -0.95 * tipL(t) + 0.95 * tipR(t);
        return [pivot[0] + 34 * Math.sin(a), pivot[1] - 34 * Math.cos(a)];
      };
      ln(70, 124, 250, 124, quiet, 1);
      const tracks = [-1, 1].map((s) => el("ellipse", { cx: pivot[0] + s * arm, cy: pivot[1], rx: 6, ry: 9, fill: "none", stroke: quiet, "stroke-width": 1 }));
      const tg = [-1, 1].map((s) => { const g = glow(30, 0.7); put(g, pivot[0] + s * arm, pivot[1]); return g; });
      const bars = [-1, 1].map((s) => el("rect", { x: s < 0 ? -arm : 0, y: -4, width: arm, height: 8, rx: 4, fill: faint, stroke: soft, "stroke-width": 1.5 }));
      const sides = [-1, 1].map((s) => {
        const trail = comet(5, 0.12, 8, (t) => rest(s, t));
        return { s, trail, ring: circ(9, { fill: "none", stroke: ink, "stroke-width": 2 }) };
      });
      const halo = glow(20, 0.55);
      const core = circ(4.5, { fill: ink });
      return (e) => {
        const t = animated ? e % total : still;
        const am = amplitude(t), w = wing(t), l = tipL(t), r = tipR(t);
        tracks.forEach((n) => op(n, am * 0.9));
        op(tg[0], l);
        op(tg[1], r);
        bars.forEach((n, i) => put(n, pivot[0], pivot[1], 1, -[-1, 1][i] * w));
        sides.forEach(({ s, trail, ring }) => {
          trail(t);
          const p = rest(s, t);
          put(ring, p[0], p[1], 1 + 0.14 * (s < 0 ? l : r));
        });
        const q = tip(t);
        put(halo, q[0], q[1], 1 + 0.3 * wave(t, 4) * Math.min(1, l + r + wingHold(t)));
        put(core, q[0], q[1]);
      };
    }

    if (motion === "hinge") {
      const ph = phases([15, 30, 30, 15]);
      const total = ph[3].end;
      const pivots = [[124, 34], [196, 34]], length = 50, target = [160, 66], fold = 0.93;
      const still = ph[1].start + 17;
      const lift = (i, t) => bump(t, ph[i + 1].start + 0.8, ph[i + 1].start + 5, ph[i + 1].end - 5, ph[i + 1].end - 0.8);
      const angle = (i, t) => {
        const h = lift(i, t);
        return fold * h + 0.035 * Math.sin(2 * Math.PI * (t - ph[i + 1].start) / 5) * h;
      };
      ln(96, 118, 224, 118, quiet, 1);
      ln(100, 34, 220, 34, quiet, 1);
      pivots.forEach((p, i) => {
        const side = i === 0 ? 1 : -1;
        poly(Array.from({ length: 25 }, (_, k) => { const a = fold * k / 24; return [p[0] + side * length * Math.sin(a), p[1] + length * Math.cos(a)]; }), quiet, 1, "2 5");
      });
      const halo = glow(26, 0.6);
      put(halo, target[0], target[1]);
      const core = circ(4, { fill: ink });
      put(core, target[0], target[1]);
      const caps = pivots.map((p) => {
        const g = el("g", {}, stage);
        const lit = el("rect", { x: -6, y: 0, width: 12, height: length, rx: 6, fill: soft }, g);
        el("rect", { x: -6, y: 0, width: 12, height: length, rx: 6, fill: faint, stroke: ink, "stroke-width": 2 }, g);
        circ(3.5, { fill: ink, transform: `translate(${p[0]} ${p[1]})` });
        return { g, lit };
      });
      return (e) => {
        const t = animated ? e % total : still;
        const any = Math.max(lift(0, t), lift(1, t));
        op(halo, 0.3 + 0.7 * any);
        put(halo, target[0], target[1], 1 + 0.4 * wave(t, 5) * any + 0.08 * wave(t, 6));
        op(core, 0.5 + 0.5 * any);
        caps.forEach((c2, i) => {
          const side = i === 0 ? 1 : -1;
          put(c2.g, pivots[i][0], pivots[i][1], 1, -side * angle(i, t));
          op(c2.lit, lift(i, t));
        });
      };
    }

    if (motion === "neck") {
      const ph = phases([25, 25, 20, 20]);
      const total = ph[3].end;
      const radius = 12, restY = 102;
      const still = ph[0].start + 14;
      const cradle = (s) => [160 + 100 * s, 66 + 36 * (1 - s * s)];
      const toL = (t) => bump(t, ph[0].start + 1, ph[0].start + 5.5, ph[0].end - 5, ph[0].end - 1);
      const toR = (t) => bump(t, ph[1].start + 1, ph[1].start + 5.5, ph[1].end - 5, ph[1].end - 1);
      const back = (t) => bump(t, ph[2].start + 1, ph[2].start + 5, ph[2].end - 6, ph[2].end - 1.5);
      const slide = (t) => bump(t, ph[2].start + 0.2, ph[2].start + 1.6, ph[2].end - 1.4, ph[2].end - 0.2);
      const position = (t) => {
        const p = cradle(toR(t) - toL(t));
        return [p[0] + 58 * back(t), p[1]];
      };
      poly(Array.from({ length: 41 }, (_, i) => cradle(i / 20 - 1)), quiet, 1.2);
      const guide = ln(120, restY, 232, restY, quiet, 1.2, "2 5");
      const guideEnd = circ(3.5, { fill: soft });
      put(guideEnd, 226, restY);
      const ends = [-1, 1].map((s) => {
        const p = cradle(s);
        const halo = glow(34, 0.75);
        const cap = circ(4, { fill: soft });
        return { p, halo, cap };
      });
      const trail = comet(5, 0.22, 6.5, position);
      const ring = el("g", {}, stage);
      circ(radius, { fill: faint, stroke: ink, "stroke-width": 2 }, ring);
      circ(2, { fill: ink, cy: -7 }, ring);
      return (e) => {
        const t = animated ? e % total : still;
        const sl = slide(t);
        op(guide, sl);
        op(guideEnd, sl);
        ends.forEach((x, i) => {
          const h = i === 0 ? toL(t) : toR(t);
          op(x.halo, h);
          put(x.halo, x.p[0], x.p[1], 0.9 + 0.25 * wave(t, 5) * h);
          put(x.cap, x.p[0], x.p[1], 1 + 0.6 * h);
        });
        trail(t);
        const p = position(t), b = back(t);
        put(ring, p[0], p[1], 1 - 0.3 * b, (p[0] - 160) / radius);
        op(ring, 1 - 0.3 * b);
      };
    }

    if (motion === "water") {
      const ph = phases([60, 30, 60]);
      const total = ph[2].end;
      const still = ph[1].end - 2;
      const fillStart = ph[1].start + 1, fillEnd = ph[1].end - 1;
      const sips = [0, 1, 2, 3, 4].map((k) => ph[2].start + 4 + 11 * k);
      const level = (t) => {
        let v = 0.85 * move(t, fillStart, fillEnd);
        sips.forEach((s) => { v -= 0.17 * move(t, s, s + 1.8); });
        return Math.max(v, 0);
      };
      const surface = (t) => 132 - level(t) * 92;
      const glassPath = (inset, closed) => {
        const top = closed ? 24 : 32, widen = closed ? 1.2 : 0;
        return `M${124 + inset - widen} ${top} L${133 + inset} 114 Q${133.5 + inset} ${122 - inset} ${141 + inset} ${122 - inset} L${179 - inset} ${122 - inset} Q${186.5 - inset} ${122 - inset} ${187 - inset} 114 L${196 - inset + widen} ${top}${closed ? " Z" : ""}`;
      };
      ln(18, 122, 302, 122, quiet, 1);
      const floor = glow(60, 0.35);
      floor.setAttribute("transform", "translate(160 122) scale(1 0.22)");
      const aura = glow(80, 0.5);
      put(aura, 160, 76);
      const clip = el("clipPath", { id: `${id}w` }, defs);
      el("path", { d: glassPath(1.5, true) }, clip);
      const inside = el("g", { "clip-path": `url(#${id}w)` }, stage);
      const water = el("g", {}, inside);
      const span = 48;
      const waves = [{ amp: 3.2, phase: 0, loop: 4.2, dir: 1, a: 0.45 }, { amp: 2.4, phase: 2.1, loop: 5.6, dir: -1, a: 0.22 }].map((w, i) => {
        const g = el("g", {}, water);
        const crest = Array.from({ length: Math.floor((330 + span * 2) / 3) + 1 }, (_, k) => [k * 3, w.amp * Math.sin(2 * Math.PI * (k * 3 / span) + w.phase)]);
        const last = crest[crest.length - 1][0];
        el("path", { d: "M" + crest.map((p) => `${num(p[0])} ${num(p[1])}`).join(" L") + ` L${last} 130 L0 130 Z`, fill: rgba(tint, w.a) }, g);
        if (i === 0) poly(crest, white(0.5), 1.5, null, g);
        return Object.assign(w, { g });
      });
      const seeds = [[142, 3.1, 0.1, 2.2], [152, 4.0, 0.55, 1.6], [160, 3.5, 0.3, 2.8], [170, 4.4, 0.8, 1.8], [180, 2.9, 0.45, 2.0], [148, 3.8, 0.7, 1.5], [174, 4.2, 0.2, 2.4]]
        .map(([x, period, offset, r]) => ({ x, period, offset, n: circ(r, { fill: "none", stroke: white(0.55), "stroke-width": 1 }) }));
      ln(131, 40, 137, 104, quiet, 1.5);
      el("path", { d: glassPath(0, false), fill: "none", stroke: ink, "stroke-width": 2.5, "stroke-linecap": "round", "stroke-linejoin": "round" });
      const drops = [];
      let walker = null, prints = [];
      const arrive = ph[0].end - 5;
      const wx = (t) => 24 + 76 * (0.5 * unit(t, 2, arrive) + 0.5 * move(t, 2, arrive));
      if (animated) {
        for (let emit = fillStart + 0.4; emit < fillEnd - 1.6; emit += 1.7) {
          const land = emit + 0.7;
          drops.push({
            emit, land, rim: surface(land),
            drop: circ(2.6, { fill: ink }),
            ripple: el("ellipse", { cx: 0, cy: 0, rx: 14, ry: 3.5, fill: "none", stroke: soft, "stroke-width": 1.2 }, stage)
          });
        }
        walker = el("g", {}, stage);
        glow(16, 0.4, walker);
        circ(4, { fill: ink }, walker);
        for (let s = 6; s < arrive - 3; s += 3.5) {
          prints.push({ s, n: circ(6, { fill: "none", stroke: soft, "stroke-width": 1.2 }) });
        }
      }
      return (e) => {
        const t = animated ? e % total : still;
        op(aura, 0.3 + 0.7 * level(t));
        water.setAttribute("transform", `translate(0 ${num(surface(t))})`);
        waves.forEach((w) => {
          const tt = animated ? e % w.loop : 0.4 * w.loop;
          const x = w.dir > 0 ? -span * (1 - tt / w.loop) : -span * (tt / w.loop);
          w.g.setAttribute("transform", `translate(${num(x)} 0)`);
        });
        const gate = (tt) => bump(tt, fillStart + 1.5, fillStart + 4, fillEnd + 1, fillEnd + 5);
        const depth = Math.min(Math.max((116 - surface(t)) / 24, 0), 1);
        seeds.forEach((b) => {
          const u = ((t / b.period) + b.offset) % 1;
          const y = 116 - (116 - (surface(t) + 5)) * u;
          put(b.n, b.x + 3.5 * Math.sin(2 * Math.PI * (u * 2 + b.offset)), y);
          op(b.n, Math.max(Math.min(u / 0.15, (1 - u) / 0.25, 1), 0) * gate(t) * depth);
        });
        drops.forEach((d) => {
          const u = unit(t, d.emit, d.land);
          put(d.drop, 160, 12 + (d.rim - 12) * u * u);
          op(d.drop, unit(t, d.emit - 0.05, d.emit) - unit(t, d.land, d.land + 0.05));
          pulse(d.ripple, 160, d.rim, t, d.land, 1.1, 0.2, 1.3, 0.8);
        });
        if (walker) {
          put(walker, wx(t), 120);
          op(walker, move(t, 0.2, 1.8) - move(t, arrive - 0.5, arrive + 4));
          prints.forEach((p) => pulse(p.n, wx(p.s), 120, t, p.s, 8, 0.3, 2, 0.8));
        }
      };
    }
    return () => {};
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
    let update = null;
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
      case "walk":
      case "shoulders":
      case "hinge":
      case "neck":
      case "water":
        update = moveScene(ex.motion, { el, stage, defs, id, tint, animated, steps, faint, soft, ink, quiet });
        update(0);
        break;
    }
    return { svg, anims, update };
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
    const dial = $(".js-brk-dial", root);
    for (let i = 0; i < 60; i++) {
      const a = i / 60 * 2 * Math.PI, outer = 96 - 5 - 8, inner = outer - (i % 5 === 0 ? 7 : 3.5);
      const tick = document.createElementNS(SVG, "line");
      tick.setAttribute("x1", 100 + Math.cos(a) * inner);
      tick.setAttribute("y1", 100 + Math.sin(a) * inner);
      tick.setAttribute("x2", 100 + Math.cos(a) * outer);
      tick.setAttribute("y2", 100 + Math.sin(a) * outer);
      dial.appendChild(tick);
    }
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
        scene.anims.forEach((a) => (on && !document.hidden ? a.play() : a.pause()));
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
      if (scene && scene.update) scene.update(elapsed);
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
      if (typing(document.activeElement)) return;
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
    document.addEventListener("visibilitychange", setPlay);
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
