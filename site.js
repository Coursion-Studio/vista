(() => {
  "use strict";

  const NOTIFY_URL = "mailto:support@coursion.studio?subject=Vista";
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const typing = (el) => el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);

  clearTimeout(window.__rv);
  $$("[data-notify]").forEach((a) => { a.href = NOTIFY_URL; });

  function watch(el, enter, leave, threshold = 0.35) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { enter(); return; }
    new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? enter() : leave && leave()));
    }, { threshold }).observe(el);
  }

  $$(".reveal").forEach((el) => {
    if (el.classList.contains("stage-hero") || el.classList.contains("page-stage")) {
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("in")));
      watch(el, () => el.classList.add("live"), () => el.classList.remove("live"), 0);
      return;
    }
    watch(el, () => el.classList.add("in"), null, 0.12);
  });
  $$(".js-live").forEach((el) => watch(el, () => el.classList.add("live"), () => el.classList.remove("live"), 0.2));

  const PALETTE = `
    <div class="palette" role="dialog" aria-modal="true" aria-label="Search this site">
      <div class="palette-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M16 16l5 5"/></svg>
        <input class="js-palette-input" type="text" placeholder="Jump to anything…" aria-label="Search this site" autocomplete="off" spellcheck="false" />
        <kbd>esc</kbd>
      </div>
      <ul class="palette-results js-palette-results" role="listbox"></ul>
      <div class="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd>Navigate</span><span><kbd>↩</kbd>Open</span><span class="spacer"></span><span>Look away from the screen once you've found it.</span></div>
    </div>`;

  (() => {
    if (!$(".js-palette-open")) return;
    let back = $(".js-palette");
    if (!back) {
      back = document.createElement("div");
      back.className = "palette-backdrop js-palette";
      back.hidden = true;
      back.innerHTML = PALETTE;
      document.body.prepend(back);
    }
    const input = $(".js-palette-input", back);
    const list = $(".js-palette-results", back);
    const ITEMS = [
      { g: "Try it", mk: "◉", t: "An eye break, live", h: "Try it", go: "#break", pick: "eyes" },
      { g: "Try it", mk: "↟", t: "A move break, live", h: "Try it", go: "#break", pick: "body" },
      { g: "Try it", mk: "∥", t: "Smart pause — breaks that wait", h: "Try it", go: "#pause" },
      { g: "Try it", mk: "≡", t: "Two rhythms, two clocks", h: "Try it", go: "#rhythms" },
      { g: "Go", mk: "▦", t: "Everything Vista does", h: "Section", go: "#features" },
      { g: "Go", mk: "◷", t: "With Apple Watch and iPhone", h: "Section", go: "#watch" },
      { g: "Go", mk: "◐", t: "Themes and styles", h: "Section", go: "#themes" },
      { g: "Go", mk: "✉", t: "Get notified when it's out", h: "Email", act: "notify" },
      { g: "Pages", mk: "§", t: "Privacy", h: "Page", go: "privacy.html" },
      { g: "Pages", mk: "@", t: "Send feedback", h: "Email", go: "mailto:feedback@coursion.studio?subject=Vista" },
      { g: "Pages", mk: "@", t: "@kuraydev on X", h: "External", go: "https://x.com/kuraydev" }
    ];
    let shown = [], sel = 0, lastFocus = null;
    const hit = (q, text) => {
      const t = text.toLowerCase();
      let n = 0;
      for (const ch of q) { n = t.indexOf(ch, n); if (n < 0) return false; n++; }
      return true;
    };
    function draw() {
      const q = input.value.trim().toLowerCase();
      shown = ITEMS.filter((it) => hit(q, it.t + " " + it.g));
      sel = 0;
      list.innerHTML = "";
      if (!shown.length) {
        const e = document.createElement("li");
        e.className = "palette-empty";
        e.textContent = "Nothing here. Maybe rest your eyes for twenty seconds.";
        list.appendChild(e);
        return;
      }
      let group = null;
      shown.forEach((it, n) => {
        if (it.g !== group) {
          group = it.g;
          const h = document.createElement("li");
          h.className = "group";
          h.textContent = group;
          list.appendChild(h);
        }
        const li = document.createElement("li");
        li.className = "item";
        li.setAttribute("role", "option");
        li.dataset.n = n;
        li.innerHTML = '<span class="mk"></span><span class="lb"></span><span class="hint"></span>';
        $(".mk", li).textContent = it.mk;
        $(".lb", li).textContent = it.t;
        $(".hint", li).textContent = it.h;
        li.addEventListener("mousemove", () => { sel = n; mark(); });
        li.addEventListener("click", () => { sel = n; go(); });
        list.appendChild(li);
      });
      mark();
    }
    function mark() {
      $$(".item", list).forEach((n) => {
        const on = +n.dataset.n === sel;
        n.setAttribute("aria-selected", on ? "true" : "false");
        if (on) n.scrollIntoView({ block: "nearest" });
      });
    }
    function go() {
      const it = shown[sel];
      if (!it) return;
      close();
      if (it.act === "notify") { location.href = NOTIFY_URL; return; }
      if (/^mailto:/.test(it.go)) { location.href = it.go; return; }
      if (/^https?:/.test(it.go)) { open(it.go, "_blank", "noopener"); return; }
      if (it.go[0] === "#") {
        const t = $(it.go);
        if (t) {
          if (it.pick) document.dispatchEvent(new CustomEvent("vista:pick", { detail: it.pick }));
          t.scrollIntoView({ behavior: still.matches ? "auto" : "smooth", block: "start" });
        } else location.href = "index.html" + it.go;
        return;
      }
      location.href = it.go;
    }
    function openPalette() {
      lastFocus = document.activeElement;
      back.hidden = false;
      requestAnimationFrame(() => back.classList.add("on"));
      input.value = "";
      draw();
      input.focus();
    }
    function close() {
      back.classList.remove("on");
      setTimeout(() => { back.hidden = true; }, 170);
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    $$(".js-palette-open").forEach((b) => b.addEventListener("click", openPalette));
    input.addEventListener("input", draw);
    back.addEventListener("mousedown", (e) => { if (e.target === back) close(); });
    addEventListener("keydown", (e) => {
      const isOpen = !back.hidden;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); isOpen ? close() : openPalette(); return; }
      if (!isOpen && e.key === "/" && !typing(document.activeElement)) { e.preventDefault(); openPalette(); return; }
      if (!isOpen) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); close(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, shown.length - 1); mark(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); mark(); }
      else if (e.key === "Enter") { e.preventDefault(); go(); }
    }, true);
  })();

  (() => {
    const bar = $(".js-bar");
    if (!bar) return;
    const nav = $(".js-bar-nav", bar);
    const ink = $(".bar-ink", bar);
    const menu = $(".js-bar-menu", bar);
    const sheet = $(".js-bar-sheet", bar);
    const links = $$("a[data-spy]", bar);

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; bar.classList.toggle("scrolled", scrollY > 12); });
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    let active = (links.find((a) => a.getAttribute("aria-current") === "page") || {}).dataset;
    active = active ? active.spy : null;
    function place() {
      const a = active && $(`a[data-spy="${active}"]`, nav);
      links.forEach((l) => l.classList.toggle("on", l.dataset.spy === active));
      if (!a || !a.offsetWidth) { ink.classList.remove("on"); return; }
      const inset = 12;
      ink.style.transform = `translateX(${a.offsetLeft + inset}px) scaleX(${Math.max(1, a.offsetWidth - inset * 2)})`;
      ink.classList.add("on");
    }
    if (!$("body.page")) {
      const seen = new Map();
      const targets = links.map((a) => document.getElementById(a.dataset.spy)).filter(Boolean);
      if ("IntersectionObserver" in window && targets.length) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((e) => seen.set(e.target.id, e.isIntersecting));
          const hit = targets.find((t) => seen.get(t.id));
          const next = hit ? hit.id : null;
          if (next !== active) { active = next; place(); }
        }, { rootMargin: "-40% 0px -55% 0px" });
        targets.forEach((t) => io.observe(t));
      }
    }
    place();
    addEventListener("resize", place);
    if (document.fonts) document.fonts.ready.then(place);

    const focusable = () => [menu, ...$$("a, button", sheet)];
    function openSheet() {
      sheet.hidden = false;
      bar.classList.add("open");
      menu.setAttribute("aria-expanded", "true");
      menu.setAttribute("aria-label", "Close menu");
      sheet.classList.add("enter");
      requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.remove("enter")));
      $("a", sheet).focus();
    }
    function closeSheet(refocus = true) {
      if (sheet.hidden) return;
      bar.classList.remove("open");
      menu.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-label", "Menu");
      sheet.hidden = true;
      if (refocus) menu.focus();
    }
    menu.addEventListener("click", () => (sheet.hidden ? openSheet() : closeSheet()));
    $$("a", sheet).forEach((a) => a.addEventListener("click", () => closeSheet(false)));
    const search = $(".js-bar-search", sheet);
    if (search) search.addEventListener("click", () => { closeSheet(); const k = $(".bar-k", bar); if (k) k.click(); });
    document.addEventListener("keydown", (e) => {
      if (sheet.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); closeSheet(); return; }
      if (e.key !== "Tab") return;
      const f = focusable();
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    });
    document.addEventListener("pointerdown", (e) => { if (!sheet.hidden && !bar.contains(e.target)) closeSheet(false); });
    matchMedia("(min-width: 761px)").addEventListener("change", (m) => { if (m.matches) closeSheet(false); });
  })();
})();
