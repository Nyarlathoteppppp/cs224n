"""Turn reference/raw into files an author (or a delegate model) can read.

    .venv/bin/python tools/extract_reference.py

Writes (all under reference/, git-ignored):
    text/<KEY>.md            PDF text, one "## pN" section per page
    pages/<KEY>/pNN.jpg      every page rendered (read the image whenever a page has maths, tables or figures)
    text/index.tsv           KEY, pages, source file, per-page flags (img = little text / big images)
    raw/assignments/<name>/  assignment zips unpacked (data only; nothing is executed)
    text/A1.md               the A1 notebook's markdown and code cells
    transcripts/clean/NN.txt YouTube auto-captions with the rolling duplicates removed, ~30 s per paragraph
"""
import html
import json
import os
import re
import sys
import zipfile

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, 'reference')
RAW = os.path.join(REF, 'raw')
TEXT = os.path.join(REF, 'text')
PAGES = os.path.join(REF, 'pages')

# KEY -> PDF under reference/raw. Lecture numbers follow the Winter 2026 schedule.
DOCS = {
    'L01a': 'slides/cs224n-2026-lecture01-intro.pdf',
    'L01b': 'slides/cs224n-2026-lecture01-history.pdf',
    'L02': 'slides/cs224n-2026-lecture02-wordvecs.pdf',
    'L03': 'slides/cs224n-2026-lecture03-neuralnets.pdf',
    'L04': 'slides/cs224n-2026-lecture04-rnnlm.pdf',
    'L05': 'slides/cs224n-2026-lecture05-transformers.pdf',
    'L06': 'slides/cs224n-2026-lecture06-final-project.pdf',
    'L07': 'slides/cs224n-2026-lecture07-pretraining.pdf',
    'L08': 'slides/cs224n-2026-lecture08-posttraining.pdf',
    'L09': 'slides/cs224n-2026-lecture09-peft.pdf',
    'L10': 'slides/cs224n-2026-lecture10-rag-agents.pdf',
    'L11': 'slides/cs224n-2026-lecture11-evaluation.pdf',
    'L12': 'slides/cs224n-2026-lecture12-reasoning-part1.pdf',
    'L13': 'slides/cs224n-2026-lecture13-reasoning-part2.pdf',
    'L14': 'slides/cs224n-2026-lecture14-guest-julie-tokenization-multilinguality.pdf',
    'L15': 'slides/cs224n-spr2024-lecture15-life-after-dpo-lambert.pdf',   # Spring 2024 deck, commented out on the
                                                                           # W26 page: optional extra, not W26 content
    'L16': 'slides/cs224n-2026-lecture16-impact-on-humanity.pdf',
    'L19': 'slides/cs224n-2026-lecture19-open-questions.pdf',
    'N01': 'notes/cs224n_winter2023_lecture1_notes_draft.pdf',
    'N02': 'notes/cs224n-2019-notes02-wordvecs2.pdf',
    'N03': 'notes/cs224n-2019-notes03-neuralnets.pdf',
    'N04': 'notes/gradient-notes.pdf',
    'N05': 'notes/review-differential-calculus.pdf',
    'N06': 'notes/cs224n-2019-notes05-LM_RNN.pdf',
    'N07': 'notes/cs224n-self-attention-transformers-2023_draft.pdf',
    'N08': 'notes/cs224n-2019-notes04-dependencyparsing.pdf',            # not linked from W26; backs up A2 Q3
    'N09': 'notes/cs224n-2019-notes06-NMT_seq2seq_attention.pdf',        # not linked from W26; backs up L05
    'A2': 'assignments/a2.pdf',
    'A3': 'assignments/a3.pdf',
    'A4': 'assignments/a4.pdf',
    'T1': 'slides/2024 CS224N Python Review Session Slides.pptx.pdf',
    'T3': 'materials/hf_transformers_tutorial.pdf',
    'P1': 'project/CS_224n__Default_Final_Project__Build_GPT_2.pdf',
    'P2': 'project/DFP_Instructions.pdf',
}

IMG_WIDTH = 1100        # px of rendered pages: enough to read subscripts on slides
LOW_TEXT = 120          # chars; below this a page is mostly picture


def extract_pdfs():
    os.makedirs(TEXT, exist_ok=True)
    rows = ['key\tpages\tpicture_pages\tsource']
    for key, rel in DOCS.items():
        doc = pymupdf.open(os.path.join(RAW, rel))
        out_dir = os.path.join(PAGES, key)
        os.makedirs(out_dir, exist_ok=True)
        parts, picture = [], []
        for i, page in enumerate(doc, start=1):
            text = page.get_text('text').strip()
            big_images = sum(1 for im in page.get_image_info() if
                             (im['bbox'][2] - im['bbox'][0]) * (im['bbox'][3] - im['bbox'][1]) > 0.15 * page.rect.width * page.rect.height)
            flag = len(text) < LOW_TEXT or big_images > 0
            if flag:
                picture.append(i)
            parts.append('## p%d%s\n\n%s\n' % (i, '  [picture]' if flag else '', text))
            img = os.path.join(out_dir, 'p%02d.jpg' % i)
            if not os.path.exists(img):
                zoom = IMG_WIDTH / page.rect.width
                page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom)).save(img, jpg_quality=72)
        with open(os.path.join(TEXT, key + '.md'), 'w') as f:
            f.write('# %s — %s (%d pages)\n\n' % (key, rel, doc.page_count) + '\n'.join(parts))
        rows.append('%s\t%d\t%s\t%s' % (key, doc.page_count, ','.join(map(str, picture)), rel))
        print('%-5s %3d pages, %3d picture pages' % (key, doc.page_count, len(picture)))
    with open(os.path.join(TEXT, 'index.tsv'), 'w') as f:
        f.write('\n'.join(rows) + '\n')


def unpack_assignments():
    adir = os.path.join(RAW, 'assignments')
    for name in sorted(os.listdir(adir)):
        if not name.endswith('.zip'):
            continue
        dest = os.path.join(adir, name[:-4])
        if os.path.isdir(dest):
            continue
        with zipfile.ZipFile(os.path.join(adir, name)) as z:
            for m in z.infolist():
                path = os.path.normpath(os.path.join(dest, m.filename))
                if not path.startswith(dest + os.sep) or '__MACOSX' in m.filename:
                    continue                      # refuse paths that escape dest
                if m.is_dir():
                    os.makedirs(path, exist_ok=True)
                    continue
                os.makedirs(os.path.dirname(path), exist_ok=True)
                with z.open(m) as src, open(path, 'wb') as out:
                    out.write(src.read())
        print('unpacked', name)


def notebook_to_text():
    nb_path = os.path.join(RAW, 'assignments', 'a1', 'student', 'exploring_word_vectors.ipynb')
    with open(nb_path) as f:
        nb = json.load(f)
    out = ['# A1 — exploring_word_vectors.ipynb (markdown and code cells)\n']
    for i, cell in enumerate(nb['cells'], start=1):
        src = ''.join(cell.get('source', []))
        if not src.strip():
            continue
        if cell['cell_type'] == 'markdown':
            out.append('## cell %d (markdown)\n\n%s\n' % (i, src))
        else:
            out.append('## cell %d (code)\n\n```python\n%s\n```\n' % (i, src))
    with open(os.path.join(TEXT, 'A1.md'), 'w') as f:
        f.write('\n'.join(out))
    print('A1 notebook: %d cells' % len(nb['cells']))


def clean_vtt(path):
    """YouTube auto-captions repeat each line in the next cue; keep each line once, with its start time."""
    lines, last = [], None
    with open(path) as f:
        blocks = f.read().split('\n\n')
    for block in blocks:
        m = re.search(r'(\d+):(\d+):(\d+)\.\d+ -->', block)
        if not m:
            continue
        t = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(m.group(3))
        for raw in block.split('\n')[1:]:
            line = html.unescape(re.sub(r'<[^>]+>', '', raw)).strip()
            if line and line != last and '-->' not in line:
                lines.append((t, line))
                last = line
    paras, start, buf = [], -1, []          # start < 0: no paragraph open
    for t, line in lines:
        if start < 0:
            start = t
        buf.append(line)
        if t - start >= 30:
            paras.append('[%02d:%02d] %s' % (start // 60, start % 60, ' '.join(buf)))
            start, buf = -1, []
    if buf:
        paras.append('[%02d:%02d] %s' % (start // 60, start % 60, ' '.join(buf)))
    return '\n\n'.join(paras) + '\n'


TRANSCRIPT_SETS = {'spr2024': '', 'w2021': 'W'}   # folder -> prefix of the cleaned file name (clean/NN.txt, clean/WNN.txt)


def clean_transcripts():
    out = os.path.join(REF, 'transcripts', 'clean')
    os.makedirs(out, exist_ok=True)
    for folder, prefix in TRANSCRIPT_SETS.items():
        src = os.path.join(REF, 'transcripts', folder)
        if not os.path.isdir(src):
            continue
        titles = {}
        with open(os.path.join(src, 'index.tsv')) as f:
            for row in f:
                num, _, title = row.rstrip('\n').split('\t')
                titles[num] = title
        for name in sorted(os.listdir(src)):
            if not name.endswith('.vtt'):
                continue
            num = name[:2]
            with open(os.path.join(out, prefix + num + '.txt'), 'w') as f:
                f.write('# %s\n\n' % titles.get(num, name) + clean_vtt(os.path.join(src, name)))
    print('transcripts cleaned:', len([n for n in os.listdir(out) if n.endswith('.txt')]))


if __name__ == '__main__':
    steps = sys.argv[1:] or ['pdf', 'zip', 'nb', 'vtt']
    if 'pdf' in steps:
        extract_pdfs()
    if 'zip' in steps:
        unpack_assignments()
    if 'nb' in steps:
        notebook_to_text()
    if 'vtt' in steps:
        clean_transcripts()
