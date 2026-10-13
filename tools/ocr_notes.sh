#!/usr/bin/env bash
# OCR the LooperXX note PDFs (reference/community/looperxx/pdf/NN.pdf) into reference/community/looperxx/ocr/NN.md.
# Their text layer is unusable, so each page is rendered at 2× with PyMuPDF and read with macOS Vision (zh-Hans + en).
# Chinese prose comes out well; formulas do not — take formulas from the official slides, never from here.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/reference/community/looperxx/pdf" OUT="$ROOT/reference/community/looperxx/ocr"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
swiftc -O -o "$TMP/ocr" "$ROOT/tools/ocr_vision.swift"
mkdir -p "$OUT"
for pdf in "$SRC"/*.pdf; do
  n="$(basename "$pdf" .pdf)"
  [ -s "$OUT/$n.md" ] && continue
  mkdir -p "$TMP/$n"
  "$ROOT/.venv/bin/python" -I -c 'import sys, pymupdf
doc = pymupdf.open(sys.argv[1])
for i, p in enumerate(doc): p.get_pixmap(matrix=pymupdf.Matrix(2, 2)).save("%s/p%02d.png" % (sys.argv[2], i + 1))' "$pdf" "$TMP/$n" 2>/dev/null
  "$TMP/ocr" "$TMP/$n"/p*.png > "$OUT/$n.md"
  echo "$n: $(ls "$TMP/$n" | wc -l | tr -d ' ') pages -> $OUT/$n.md"
done
