# Vista — website and releases

The public site for Vista, eye and movement breaks for the Mac, served at
[vista.coursion.studio](https://vista.coursion.studio/) by GitHub Pages.

- `index.html` — the home page: a day at the desk told in six chapters under a sky
  that moves from dawn to night as you scroll, with a live copy of the break screen
  (ten guided scenes), a rhythm planner, a smart-pause demo, the watch and the themes.
- `privacy.html`, `404.html` — the privacy page and the not-found page.
- `site.css`, `site.js` — shared styles, the sky, the top bar with its live eye-break
  countdown, the night footer, and the privacy and not-found layouts.
  `home.css`, `home.js` — the home page and its demos.
- `fonts/` — Instrument Serif, self-hosted (SIL Open Font License, see `fonts/OFL.txt`).
- `img/` — the app icon, the glyphs from the app's asset catalogue, and `og.png`.
- `appcast.xml` — the Sparkle feed the app checks daily. Written by the release pipeline.
- `CNAME` — serves this repo at vista.coursion.studio.

No build step. After changing any CSS or JS, run `python3 scripts/stamp-assets.py`
so browsers fetch the new files instead of a cached copy.
