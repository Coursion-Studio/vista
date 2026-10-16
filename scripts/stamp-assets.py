#!/usr/bin/env python3
"""Stamp local .css/.js references in every *.html with a content hash (?v=…).

    python3 stamp-assets.py [SITE_DIR]

Static hosts without a build step serve new HTML with old cached CSS, so a page
renders markup its stylesheet has never seen. Run after any CSS/JS change; the
hash only moves when the file does.
"""
import hashlib
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
pattern = re.compile(r'(href|src)="([^":?#]+\.(?:css|js))(?:\?v=[0-9a-f]+)?"')
digests = {}


def digest(name):
    if name not in digests:
        path = root / name
        digests[name] = hashlib.sha256(path.read_bytes()).hexdigest()[:10] if path.is_file() else None
    return digests[name]


changed = []
for page in sorted(root.glob("*.html")):
    text = page.read_text()

    def stamp(m):
        d = digest(m.group(2))
        return f'{m.group(1)}="{m.group(2)}?v={d}"' if d else m.group(0)

    stamped = pattern.sub(stamp, text)
    if stamped != text:
        page.write_text(stamped)
        changed.append(page.name)

for name, d in sorted(digests.items()):
    print(f"{name} -> {'v=' + d if d else 'missing, left as is'}")
print("stamped:", ", ".join(changed) if changed else "nothing (already current)")
