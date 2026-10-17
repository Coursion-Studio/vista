# Vista — website and releases

The public site for Vista, eye and movement breaks for the Mac, served at
[vista.coursion.studio](https://vista.coursion.studio/) by GitHub Pages.

- `index.html` — the home page, opening with a live copy of the break screen
  (ten guided scenes), a rhythm planner, a smart-pause demo and the feature cards.
- `privacy.html`, `404.html` — the privacy page and the not-found page.
- `styles.css`, `site.css` — base styles and the shared top bar, footer and page
  layouts, adapted from Hutch's site. `home.css`, `home.js` — the home page and its demos.
- `img/` — the app icon, the glyphs from the app's asset catalogue, and `og.png`.
- `appcast.xml` — the Sparkle feed the app checks daily. Written by the release pipeline.
- `CNAME` — serves this repo at vista.coursion.studio.

No build step. After changing any CSS or JS, run `python3 scripts/stamp-assets.py`
so browsers fetch the new files instead of a cached copy.
