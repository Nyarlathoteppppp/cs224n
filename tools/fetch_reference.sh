#!/usr/bin/env bash
# Download the CS224N (Winter 2026) course materials into reference/ (git-ignored).
#
#   tools/fetch_reference.sh files   # slides, notes, assignments, project docs from the course site
#   tools/fetch_reference.sh subs    # English subtitles of the Spring 2024 lecture playlist (no video)
#   tools/fetch_reference.sh all     # both
#
# Re-running skips files that are already complete. Results are listed in reference/raw/MANIFEST.tsv.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="https://web.stanford.edu/class/cs224n/"
RAW="$ROOT/reference/raw"
SUBS="$ROOT/reference/transcripts/spr2024"
PLAYLIST="https://www.youtube.com/playlist?list=PLoROMvodv4rOaMFbaqxPDoLWjDaRAdP9D"   # CS224N Spring 2024
PLAYLIST_W21="https://www.youtube.com/playlist?list=PLoROMvodv4rMFqRtEuo6SGjY4XbRIVRd4"  # CS224N 2021/2023 mix

# Every PDF / zip linked from the Winter 2026 course page (2026-10-13).
# Links inside HTML comments are leftovers from older offerings, NOT part of Winter 2026:
#   slides/cs224n-spr2024-lecture15-life-after-dpo-lambert.pdf  (kept as optional extra reading, key L15)
#   materials/gensim_2024.zip                                   (kept, unused)
#   readings/cs224n-python-review-code-updated.{zip,pdf}        (404, left out)
FILES=(
  slides_w26/cs224n-2026-lecture01-intro.pdf
  slides_w26/cs224n-2026-lecture01-history.pdf
  slides_w26/cs224n-2026-lecture02-wordvecs.pdf
  slides_w26/cs224n-2026-lecture03-neuralnets.pdf
  slides_w26/cs224n-2026-lecture04-rnnlm.pdf
  slides_w26/cs224n-2026-lecture05-transformers.pdf
  slides_w26/cs224n-2026-lecture06-final-project.pdf
  slides_w26/cs224n-2026-lecture07-pretraining.pdf
  slides_w26/cs224n-2026-lecture08-posttraining.pdf
  slides_w26/cs224n-2026-lecture09-peft.pdf
  slides_w26/cs224n-2026-lecture10-rag-agents.pdf
  slides_w26/cs224n-2026-lecture11-evaluation.pdf
  slides_w26/cs224n-2026-lecture12-reasoning-part1.pdf
  slides_w26/cs224n-2026-lecture13-reasoning-part2.pdf
  slides_w26/cs224n-2026-lecture14-guest-julie-tokenization-multilinguality.pdf
  slides/cs224n-spr2024-lecture15-life-after-dpo-lambert.pdf
  slides_w26/cs224n-2026-lecture16-impact-on-humanity.pdf
  slides_w26/cs224n-2026-lecture19-open-questions.pdf
  "slides_w25/2024 CS224N Python Review Session Slides.pptx.pdf"
  readings/cs224n_winter2023_lecture1_notes_draft.pdf
  readings/cs224n-2019-notes02-wordvecs2.pdf
  readings/cs224n-2019-notes03-neuralnets.pdf
  readings/gradient-notes.pdf
  readings/review-differential-calculus.pdf
  readings/cs224n-2019-notes05-LM_RNN.pdf
  readings/cs224n-self-attention-transformers-2023_draft.pdf
  assignments_w26/a1.zip
  assignments_w26/a2.pdf
  assignments_w26/a2.zip
  assignments_w26/a2_tex.zip
  assignments_w26/a3.pdf
  assignments_w26/a3.zip
  assignments_w26/a3_tex.zip
  assignments_w26/a4.pdf
  assignments_w26/a4.zip
  assignments_w26/a4_tex.zip
  project/custom-final-project-tips.pdf
  project/Project_Proposal_Instructions.pdf
  project/DFP_Instructions.pdf
  project/Project_Milestone_Instructions.pdf
  project/Project_Report_Instructions.pdf
  project_w25/CS_224n__Default_Final_Project__Build_GPT_2.pdf
  materials/gensim_2024.zip
  materials/hf_transformers_tutorial.pdf
  # Official CS224N notes still on the course site but not linked from the W26 page. Dependency parsing is examined
  # in A2 yet has no W26 lecture, and the attention notes back up Lecture 5.
  readings/cs224n-2019-notes04-dependencyparsing.pdf
  readings/cs224n-2019-notes06-NMT_seq2seq_attention.pdf
)

# Course-site path -> local folder.
dest_dir() {
  case "$1" in
    slides*)      echo slides ;;
    readings/*)   echo notes ;;
    assignments*) echo assignments ;;
    project*)     echo project ;;
    *)            echo materials ;;
  esac
}

urlencode() { python3 -I -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$1"; }

fetch_files() {
  mkdir -p "$RAW"
  curl -sSfL --retry 3 "$BASE" -o "$RAW/course_page.html"
  local manifest="$RAW/MANIFEST.tsv" failed=0
  printf 'local_path\tbytes\tsha256\tsource_url\n' > "$manifest"
  for p in "${FILES[@]}"; do
    local url dir out remote
    url="$BASE$(urlencode "$p")"
    dir="$RAW/$(dest_dir "$p")"
    out="$dir/$(basename "$p")"
    mkdir -p "$dir"
    remote="$(curl -sIL --retry 3 "$url" | grep -i '^content-length' | tail -1 | tr -dc '0-9')"
    if [[ -f "$out" && -n "$remote" && "$(stat -f %z "$out")" == "$remote" ]]; then
      echo "skip  $p"
    elif curl -sSfL --retry 3 "$url" -o "$out.part"; then
      mv "$out.part" "$out"
      echo "ok    $p"
    else
      rm -f "$out.part"
      echo "FAIL  $p" >&2
      failed=$((failed + 1))
      continue
    fi
    printf '%s\t%s\t%s\t%s\n' "${out#"$ROOT"/}" "$(stat -f %z "$out")" "$(shasum -a 256 "$out" | cut -d' ' -f1)" "$url" >> "$manifest"
  done
  echo "files: $(($(wc -l < "$manifest") - 1)) ok, $failed failed -> $manifest"
}

fetch_subs() {
  # Manual English captions when they exist, YouTube auto captions otherwise. --ignore-errors keeps going
  # past single videos that fail. YouTube answers some subtitle requests with HTTP 429 for hours; re-run later,
  # files already present are skipped.
  get_subs "$PLAYLIST" "$SUBS" ""
  # Winter 2021 lectures by the same lecturer for topics whose Spring 2024 captions were refused:
  # 1 word vectors, 2 word vectors 2, 4 dependency parsing, 5 RNN language models, 6 LSTMs.
  get_subs "$PLAYLIST_W21" "$ROOT/reference/transcripts/w2021" "1,2,4,5,6"
}

get_subs() {
  local playlist="$1" dir="$2" items="$3"
  mkdir -p "$dir"
  yt-dlp "$playlist" ${items:+--playlist-items "$items"} \
    --skip-download --write-subs --write-auto-subs --sub-langs en --sub-format vtt \
    --sleep-requests 2 --sleep-subtitles 5 --ignore-errors --no-overwrites \
    -o "$dir/%(playlist_index)02d_%(id)s.%(ext)s" \
    --print-to-file "%(playlist_index)02d	%(id)s	%(title)s" "$dir/index.tsv"
  echo "subtitles: $(ls "$dir"/*.vtt 2>/dev/null | wc -l | tr -d ' ') vtt files -> $dir"
}

case "${1:-all}" in
  files) fetch_files ;;
  subs)  fetch_subs ;;
  all)   fetch_files; fetch_subs ;;
  *)     echo "usage: $0 [files|subs|all]" >&2; exit 2 ;;
esac
