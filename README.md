# Vista — releases

Hosts the Sparkle appcast and the download page for [Vista](https://github.com/Coursion-Studio/vista-app),
eye and movement breaks for the Mac.

- `appcast.xml` — the Sparkle feed the app checks daily. Written by the release pipeline.
- `CNAME` — serves this repo at vista.coursion.studio via GitHub Pages.

Releases are cut from the app repo with `~/.claude/skills/macos-release/release.sh`,
which reads `release.config.json` there.

**This repo is private until the first release.** Sparkle fetches the feed over
plain HTTPS with no credentials, so it has to be public — and Pages will not
serve a private repo — before anything ships.
