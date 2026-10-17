(() => {
  "use strict";

  const NOTIFY_URL = "mailto:support@coursion.studio?subject=Vista";
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const root = document.documentElement;

  clearTimeout(window.__rv);
  $$("[data-notify]").forEach((a) => { a.href = NOTIFY_URL; });

  function watch(el, enter, leave, threshold = 0.12) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { enter(); return; }
    new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? enter() : leave && leave()));
    }, { threshold }).observe(el);
  }

  $$(".reveal").forEach((el) => {
    if (el.classList.contains("hero")) {
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("in")));
      return;
    }
    watch(el, () => el.classList.add("in"));
  });

  const nav = $(".js-nav");
  const sky = $(".sky");
  const hero = $(".hero");
  const bands = $$(".sky, .nav-sky");
  const marks = $$("[data-sky]");
  const darkFrom = $(".js-dark-from");
  let tops = [], darkTop = Infinity, heroH = 0, navH = 54, vh = innerHeight, ticking = false, lastT = -1, lastY = -1;

  const live = !!(sky && marks.length > 1 && !still);
  if (live) root.classList.add("sky-live");

  function measure() {
    vh = innerHeight;
    tops = marks.map((m) => m.getBoundingClientRect().top + scrollY);
    tops.push(document.documentElement.scrollHeight);
    heroH = hero ? hero.offsetHeight : 0;
    navH = nav ? nav.offsetHeight : 54;
    darkTop = darkFrom ? darkFrom.getBoundingClientRect().top + scrollY : Infinity;
    paint();
  }

  function paint() {
    ticking = false;
    const y = scrollY;
    if (nav) {
      nav.classList.toggle("scrolled", y > 8);
      nav.classList.toggle("dark", y + navH / 2 > darkTop);
    }
    if (!live) return;
    const c = y + vh / 2;
    const n = marks.length;
    let k = 0;
    while (k < n - 1 && c >= tops[k + 1]) k++;
    const span = Math.max(1, tops[k + 1] - tops[k]);
    const f = Math.min(1, Math.max(0, (c - tops[k]) / span));
    const t = Math.min(1, (k + f) / (n - 1));
    if (Math.abs(t - lastT) > 0.0004) {
      lastT = t;
      const v = t.toFixed(4);
      bands.forEach((b) => b.style.setProperty("--t", v));
    }
    if (hero && y <= heroH + 40) {
      const hy = Math.round(Math.min(y, heroH));
      if (hy !== lastY) { lastY = hy; hero.style.setProperty("--y", hy); }
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(paint);
  }

  if (nav || live) {
    addEventListener("scroll", onScroll, { passive: true });
    let rz = 0;
    const remeasure = () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(measure); };
    addEventListener("resize", remeasure);
    addEventListener("load", remeasure);
    if (document.fonts) document.fonts.ready.then(remeasure);
    if ("ResizeObserver" in window) new ResizeObserver(remeasure).observe(document.body);
    measure();
  }

  if (nav) {
    const links = $$("a[data-spy]", nav);
    const targets = links.map((a) => document.getElementById(a.dataset.spy)).filter(Boolean);
    if ("IntersectionObserver" in window && targets.length) {
      const seen = new Map();
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => seen.set(e.target.id, e.isIntersecting));
        const hit = targets.find((t) => seen.get(t.id));
        links.forEach((l) => l.classList.toggle("on", !!hit && l.dataset.spy === hit.id));
      }, { rootMargin: "-45% 0px -50% 0px" });
      targets.forEach((t) => io.observe(t));
    }
  }

  (() => {
    const pill = $(".js-pill");
    const look = $(".js-look");
    if (!pill || !look) return;
    const time = $(".js-pill-time", pill);
    const label = $(".js-pill-lbl", pill);
    const lookTime = $(".js-look-time", look);
    const title = $(".js-look-title", look);
    const detail = $(".js-look-d", look);
    const close = $(".js-look-close", look);
    const RHYTHM = 20 * 60, REST = 20;
    let due = Date.now() + RHYTHM * 1000, restEnd = 0, mode = "wait", hideTimer = 0, awayAt = 0, shownMin = -1, holdUntil = 0;

    const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

    function setLabel(text, aria) {
      if (label.textContent !== text) label.textContent = text;
      pill.setAttribute("aria-label", aria);
    }

    function render() {
      const now = Date.now();
      if (mode === "wait") {
        const left = Math.max(0, Math.ceil((due - now) / 1000));
        time.textContent = fmt(left);
        pill.classList.toggle("soon", left <= 10);
        const min = Math.ceil(left / 60);
        if (min !== shownMin && now >= holdUntil) {
          shownMin = min;
          setLabel("Next eye break", `Next eye break in ${min} minute${min === 1 ? "" : "s"}. Take it now.`);
        }
        if (left <= 0) begin();
      } else if (mode === "rest") {
        const left = Math.max(0, Math.ceil((restEnd - now) / 1000));
        lookTime.textContent = `0:${String(left).padStart(2, "0")}`;
        time.textContent = `0:${String(left).padStart(2, "0")}`;
        if (left <= 0) finish();
      }
    }

    function show() {
      clearTimeout(hideTimer);
      look.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => look.classList.add("on")));
    }
    function hide() {
      look.classList.remove("on");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => { look.hidden = true; }, 360);
    }

    function begin() {
      mode = "rest";
      restEnd = Date.now() + REST * 1000;
      pill.classList.remove("soon");
      setLabel("Look away", "Eye break in progress. Look away for 20 seconds.");
      title.textContent = "Look away for 20 seconds";
      detail.textContent = "Find the furthest thing you can see and rest your eyes on it. This page will wait.";
      lookTime.hidden = false;
      look.classList.remove("done");
      show();
      render();
    }

    function reset() {
      mode = "wait";
      due = Date.now() + RHYTHM * 1000;
      shownMin = -1;
      render();
    }

    function finish() {
      reset();
      title.textContent = "Welcome back";
      detail.textContent = "That counts. The next one is in twenty minutes.";
      lookTime.hidden = true;
      look.classList.add("done");
      hideTimer = setTimeout(hide, 4200);
    }

    function dismiss() {
      if (look.hidden) return;
      if (mode === "rest") reset();
      hide();
    }

    pill.addEventListener("click", () => { if (mode === "rest") dismiss(); else begin(); });
    close.addEventListener("click", dismiss);
    addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || look.hidden || !look.classList.contains("on")) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      dismiss();
    }, true);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { awayAt = Date.now(); return; }
      if (awayAt && Date.now() - awayAt >= REST * 1000 && mode === "wait") {
        holdUntil = Date.now() + 5000;
        reset();
        setLabel("Time away counted", "You were away for a while, so that counts as an eye break. Next one in 20 minutes.");
      }
      awayAt = 0;
    });

    render();
    setInterval(render, 1000);
  })();
})();
