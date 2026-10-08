# Player Book PDF fonts

DejaVu Sans 2.37 regular/bold, distributed under the accompanying LICENSE.txt.
The generated TypeScript files contain base64 TTF subsets. They are loaded only
with the PDF export module and require no external font request.

Reproduce with fontTools `pyftsubset` from the original DejaVu Sans TTF files:

```sh
pyftsubset DejaVuSans.ttf --unicodes=U+0020-024F,U+0300-052F,U+1E00-1EFF,U+2000-206F,U+20A0-20CF,U+2190-21FF --output-file=normal.ttf
pyftsubset DejaVuSans-Bold.ttf --unicodes=U+0020-024F,U+0300-052F,U+1E00-1EFF,U+2000-206F,U+20A0-20CF,U+2190-21FF --output-file=bold.ttf
```

Encode each result as base64 in a default string export. `coverage.json` is the
sorted intersection of both fonts' `getBestCmap()` keys. The renderer normalizes
text to NFC and refuses characters outside that set, without changing names or
silently dropping characters. CJK, emoji and complex right-to-left scripts are
not covered; the UI directs the user to XLSX when necessary.
