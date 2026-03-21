# OCR Transcripts Plan

This document tracks the transcript/search rollout for the archival JPG corpus under `images/pages/`. It is intended to survive session loss and serve as the operational checklist for the remaining offline OCR work.

## Goal

Extract searchable Spanish text from the scanned document pages, commit only the resulting transcript artifacts to this repository, and expose that content in the site so users can:

- search document content
- open the matching page directly in the viewer
- read the page image and transcript together at `/documentos/ver/?id=...`

## Current Status

### Completed

- [x] Defined the repository-side transcript artifact layout:
  - `data/transcripts/<doc-id>.json`
  - `data/transcripts-md/<doc-id>.md`
  - `data/search-index.json`
- [x] Added transcript support to the document viewer.
- [x] Added page deep-link support with `?page=<n>`.
- [x] Added a visible transcript panel with toggle and copy actions.
- [x] Added transcript-aware search result rendering in the catalog page.
- [x] Added placeholder data directories and empty search index.
- [x] Documented the transcript/search contract in `README.md`.
- [x] Installed local baseline OCR dependencies on the laptop:
  - `tesseract 5.5.2`
  - Spanish language data `spa`
  - `ImageMagick 7.1.2-17`
  - `python3.12`
- [x] Created the external OCR workspace at `~/ocr-side/`.
- [x] Created the predefined 18-page sample set for engine comparison.
- [x] Ran preprocessing on the sample set.
- [x] Ran the first `Tesseract` sample pass.
- [x] Created and verified the `PaddleOCR` Python 3.12 environment.

### Not Yet Implemented

- [ ] Decide whether to accept `Tesseract` as the production OCR engine or spend another round debugging `PaddleOCR`.
- [ ] Generate real transcript artifacts for the full corpus.
- [ ] Generate the real `data/search-index.json`.
- [ ] Spot-check transcript/page alignment in the browser with real data.
- [ ] Tune search result snippets after real transcript text exists.

## Local Environment Snapshot

Checked on March 20, 2026 in the current workspace:

- `python3`: available (`Python 3.14.2`)
- `brew`: available (`/opt/homebrew/bin/brew`)
- `tesseract`: installed (`5.5.2`)
- `ImageMagick` (`magick`): installed (`7.1.2-17`)
- `python3.12`: installed (`3.12.13`)
- `PaddleOCR` venv: created at `~/ocr-side/.venv-paddle`

Implication:

- `Tesseract` is ready for full-corpus execution.
- `PaddleOCR` must continue to use the isolated Python 3.12 environment rather than the system Python 3.14 environment.

## Files Already Prepared In The Repo

- `README.md`
- `data/search-index.json`
- `data/transcripts/`
- `data/transcripts-md/`
- `documentos/index.html`
- `documentos/ver/index.html`
- `js/app.js`
- `js/documents.js`
- `js/viewer.js`
- `css/styles.css`

## Artifact Contract

### Runtime JSON

One file per document:

`data/transcripts/doc-12.json`

```json
{
  "id": "doc-12",
  "title": "Titulo del documento",
  "page_count": 14,
  "pages": [
    {
      "page": 1,
      "global_page": 123,
      "text": "texto extraido..."
    }
  ]
}
```

### Human-readable Markdown

One file per document:

`data/transcripts-md/doc-12.md`

```md
# doc-12

## Titulo
Titulo del documento

## Pagina 1
texto extraido...
```

### Search Index

Single static file:

`data/search-index.json`

```json
[
  {
    "docId": "doc-12",
    "title": "Titulo del documento",
    "page": 4,
    "globalPage": 126,
    "text": "texto normalizado para busqueda"
  }
]
```

## Editorial Rules

- Preserve page boundaries.
- Preserve line breaks when they add documentary context.
- Omit repeated headers and footers if they do not add useful meaning.
- Do not aggressively rewrite OCR output.
- Assume Spanish only.
- Ignore OCR noise tokens when generating the search index.

## Recommended Offline Workflow

The OCR workflow should run outside this repository.

Suggested local workspace:

```text
~/ocr-side/
```

Suggested structure:

```text
~/ocr-side/
├── input-pages/              # copy or symlink from repo images/pages
├── preprocessed-pages/
├── raw-ocr/
├── assembled/
│   ├── transcripts/
│   ├── transcripts-md/
│   └── search-index.json
└── notes/
```

## OCR Engine Bakeoff

Do not commit to a full run before comparing engines on a sample.

### Candidate Engines

- `Tesseract` with Spanish model `spa`
- `PaddleOCR`

### Sample Set

Use 15-20 representative pages spanning:

- clean typed pages
- lower-contrast scans
- stamps/seals
- forms or tabular pages
- damaged or marginally annotated pages

### Concrete Sample Pages

Use this 18-page sample set for the bakeoff:

| Global page | File | Document | Why include it |
|---|---|---|---|
| 1 | `page-0001.jpg` | `doc-01` | opening resolution page |
| 10 | `page-0010.jpg` | `doc-01` | later page in same short document |
| 19 | `page-0019.jpg` | `doc-02` | longer document, likely denser body text |
| 48 | `page-0048.jpg` | `doc-04` | mid-70s administrative page |
| 52 | `page-0052.jpg` | `doc-03` | short annex/organizational material |
| 74 | `page-0074.jpg` | `doc-06` | annex content near the beginning |
| 120 | `page-0120.jpg` | `doc-06` | longer annex, deeper page |
| 235 | `page-0235.jpg` | `doc-07` | coding/numeric content candidate |
| 268 | `page-0268.jpg` | `doc-08` | large 1979 file, early section |
| 385 | `page-0385.jpg` | `doc-08` | large 1979 file, interior page |
| 464 | `page-0464.jpg` | `doc-10` | 1983 organizational update |
| 502 | `page-0502.jpg` | `doc-11` | long 1983 missions/tasks file |
| 601 | `page-0601.jpg` | `doc-12` | manual page from carpeta 2 |
| 707 | `page-0707.jpg` | `doc-13` | short directive |
| 745 | `page-0745.jpg` | `doc-14` | circular, likely concise official text |
| 762 | `page-0762.jpg` | `doc-18` | CAA-related material |
| 802 | `page-0802.jpg` | `doc-23` | 1982 ESC material |
| 905 | `page-0905.jpg` | `doc-26` | late 1983 document near corpus end |

If any page turns out to be unusually blank or non-representative, replace it with another page from the same document range.

### Evaluation Criteria

- body text readability
- heading accuracy
- layout preservation
- handling of degraded scans
- effort required for cleanup

## Preprocessing Recommendations

For historical scans, test preprocessing before OCR:

- grayscale conversion
- contrast normalization
- thresholding / binarization
- deskew if needed
- border cleanup

## Concrete macOS Runbook

This section is intended to be executable on the laptop directly.

### 1. Create the external workspace

```bash
mkdir -p ~/ocr-side/{input-pages,preprocessed-pages,raw-ocr/tesseract,raw-ocr/paddle,assembled/transcripts,assembled/transcripts-md,notes}
```

Use symlinks instead of copying the entire corpus:

```bash
ln -s /Users/daniel/src/memoria/side.com.ar/images/pages ~/ocr-side/input-pages/repo-pages
```

### 2. Install Tesseract baseline on macOS

Official references used for this section:

- Homebrew formula for `tesseract`: https://formulae.brew.sh/formula/tesseract
- OCRmyPDF installation docs noting `brew install tesseract-lang`: https://github.com/ocrmypdf/OCRmyPDF
- Tesseract quality guidance: https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html

Install the OCR engine and preprocessing tool:

```bash
brew install tesseract imagemagick
brew install tesseract-lang
```

Verify installation:

```bash
tesseract --version
tesseract --list-langs | grep '^spa$'
magick --version
```

If Spanish is still missing, inspect the tessdata directory:

```bash
export TESSDATA_PREFIX="$(brew --prefix tesseract)/share/tessdata"
ls "$TESSDATA_PREFIX" | grep '^spa'
```

### 3. Prepare the 18-page sample set

```bash
mkdir -p ~/ocr-side/input-pages/sample
for n in 0001 0010 0019 0048 0052 0074 0120 0235 0268 0385 0464 0502 0601 0707 0745 0762 0802 0905; do
  ln -sf "/Users/daniel/src/memoria/side.com.ar/images/pages/page-$n.jpg" "$HOME/ocr-side/input-pages/sample/page-$n.jpg"
done
```

### 4. Preprocess the sample with ImageMagick

The exact preprocessing values may need tuning, but start with this conservative baseline:

```bash
mkdir -p ~/ocr-side/preprocessed-pages/sample
for img in ~/ocr-side/input-pages/sample/*.jpg; do
  base="$(basename "$img" .jpg)"
  magick "$img" \
    -colorspace Gray \
    -deskew 40% \
    -contrast-stretch 1%x1% \
    -sharpen 0x1 \
    -threshold 55% \
    -bordercolor white -border 10 \
    "~/ocr-side/preprocessed-pages/sample/${base}.png"
done
```

This intentionally follows Tesseract’s documented improvement areas: binarization, deskewing, borders, and image cleanup.

### 5. Run Tesseract on the sample

Use `--oem 1` and start with `--psm 6` for full text pages. Tesseract’s docs note that page segmentation mode materially affects output quality.

```bash
mkdir -p ~/ocr-side/raw-ocr/tesseract/sample
for img in ~/ocr-side/preprocessed-pages/sample/*.png; do
  base="$(basename "$img" .png)"
  tesseract "$img" "$HOME/ocr-side/raw-ocr/tesseract/sample/$base" \
    -l spa \
    --oem 1 \
    --psm 6 \
    txt
done
```

Optional comparison pass with default page segmentation:

```bash
mkdir -p ~/ocr-side/raw-ocr/tesseract/sample-psm3
for img in ~/ocr-side/preprocessed-pages/sample/*.png; do
  base="$(basename "$img" .png)"
  tesseract "$img" "$HOME/ocr-side/raw-ocr/tesseract/sample-psm3/$base" \
    -l spa \
    --oem 1 \
    --psm 3 \
    txt
done
```

### 6. Prepare PaddleOCR comparison environment

Official references used for this section:

- PaddleOCR installation: https://paddlepaddle.github.io/PaddleOCR/main/en/version3.x/installation.html
- PaddleOCR CLI usage: https://www.paddleocr.ai/v3.3.0/en/version3.x/pipeline_usage/OCR.html
- PaddleX quick start noting supported Python versions: https://www.paddleocr.ai/latest/en/version3.x/paddlex/quick_start.html

Important:

- Current official docs indicate Python 3.8-3.12 support.
- Do not use the system Python 3.14 environment for PaddleOCR.

Install a compatible Python first if needed:

```bash
brew install python@3.12
```

Create the isolated environment:

```bash
/opt/homebrew/bin/python3.12 -m venv ~/ocr-side/.venv-paddle
source ~/ocr-side/.venv-paddle/bin/activate
python -m pip install --upgrade pip
python -m pip install paddlepaddle==3.2.0 -i https://www.paddlepaddle.org.cn/packages/stable/cpu/
python -m pip install paddleocr
```

Verify:

```bash
python -c "import paddle; print(paddle.__version__)"
python -c "import paddleocr; print('paddleocr ok')"
```

### 7. Run PaddleOCR on the same sample

Run against the original sample first to avoid biasing the comparison too early:

```bash
mkdir -p ~/ocr-side/raw-ocr/paddle/sample-output
paddleocr ocr \
  -i ~/ocr-side/input-pages/sample \
  --use_doc_orientation_classify False \
  --use_doc_unwarping False \
  --use_textline_orientation False \
  --save_path ~/ocr-side/raw-ocr/paddle/sample-output \
  --device cpu
```

If needed, run a second pass against the preprocessed sample:

```bash
mkdir -p ~/ocr-side/raw-ocr/paddle/sample-output-preprocessed
paddleocr ocr \
  -i ~/ocr-side/preprocessed-pages/sample \
  --use_doc_orientation_classify False \
  --use_doc_unwarping False \
  --use_textline_orientation False \
  --save_path ~/ocr-side/raw-ocr/paddle/sample-output-preprocessed \
  --device cpu
```

### 8. Compare the engines

Review the 18 sample pages and score each engine on:

- readability of the body text
- handling of headings and official formatting
- damage from preprocessing
- missed lines or broken layout
- cleanup effort required before repository ingestion

Record the winner in the `Decision Log` section below before running the full corpus.

## Execution Notes From This Session

### Tesseract sample status

- Sample output directory: `~/ocr-side/raw-ocr/tesseract/sample/`
- Files generated: 18 `.txt` files
- Early quality signal:
  - `page-0001`: usable, though noisy
  - `page-0802`: reasonably readable
  - `page-0235`: poor
  - `page-0601`: mixed
- Tesseract emitted some warnings about tiny lines being too small to scale and not recognized.

### PaddleOCR sample status

- Venv verified successfully:
  - `import paddle` worked
  - `import paddleocr` worked
  - `paddleocr --help` worked with `PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True`
- First sample run command:

```bash
export PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True
source ~/ocr-side/.venv-paddle/bin/activate
paddleocr ocr \
  -i ~/ocr-side/input-pages/sample \
  --use_doc_orientation_classify False \
  --use_doc_unwarping False \
  --use_textline_orientation False \
  --save_path ~/ocr-side/raw-ocr/paddle/sample-output \
  --device cpu
```

- First run outcome:
  - model downloads succeeded
  - result files were written for at least:
    - `page-0001`
    - `page-0010`
  - the process ended with a multiprocessing semaphore warning before producing all 18 outputs
- Second run strategy:
  - reran one file at a time into `~/ocr-side/raw-ocr/paddle/sample-output-single/`
  - only `page-0001` and `page-0010` completed
  - pages such as `page-0019`, `page-0048`, `page-0052`, `page-0074`, and `page-0120` failed or hung after model initialization
  - isolated debug run for `page-0019` reached model startup and then hung without producing output

### Current recommendation

- Recommended production engine right now: `Tesseract`
- Reason:
  - it completed the sample set end-to-end
  - output quality is mixed but usable on a meaningful subset of pages
  - the current `PaddleOCR` path is operationally unreliable on this corpus and environment
- If higher quality is still required later, revisit `PaddleOCR` only after a focused debugging round or by testing a different model profile/environment.

### Resume instruction for PaddleOCR

When resuming, inspect the current output count first:

```bash
find ~/ocr-side/raw-ocr/paddle/sample-output -type f | wc -l
```

If the directory is incomplete, rerun the sample command above and capture whether the process stops on the same page each time.

## Full Execution Checklist

### Phase 1: Sample Evaluation

- [ ] Create the external OCR workspace.
- [ ] Install `Tesseract`, `ImageMagick`, and Spanish language data.
- [ ] Create the predefined 18-page sample set.
- [ ] Run preprocessing on the sample set.
- [ ] Run `Tesseract` on the sample set.
- [ ] Install a Python 3.12 environment for `PaddleOCR`.
- [ ] Run `PaddleOCR` on the same sample set.
- [ ] Compare results and choose the engine.
- [ ] Record the decision in this file.

Current completion:

- [x] Create the external OCR workspace.
- [x] Install `Tesseract`, `ImageMagick`, and Spanish language data.
- [x] Create the predefined 18-page sample set.
- [x] Run preprocessing on the sample set.
- [x] Run `Tesseract` on the sample set.
- [x] Install a Python 3.12 environment for `PaddleOCR`.
- [ ] Run `PaddleOCR` on the same sample set.
- [ ] Compare results and choose the engine.
- [ ] Record the decision in this file.

### Phase 2: Full Extraction

- [ ] OCR the full page corpus.
- [ ] Assemble document-level JSON files under `assembled/transcripts/`.
- [ ] Assemble document-level Markdown files under `assembled/transcripts-md/`.
- [ ] Build `assembled/search-index.json`.
- [ ] Spot-check page numbering against `data/documents.json`.

### Phase 3: Repo Ingestion

- [ ] Copy final JSON files into `data/transcripts/`.
- [ ] Copy final Markdown files into `data/transcripts-md/`.
- [ ] Replace `data/search-index.json` with the generated index.
- [ ] Review diffs for encoding and formatting issues.

### Phase 4: Browser Verification

- [ ] Open `/documentos/` and verify transcript search results render.
- [ ] Open `/documentos/ver/?id=<doc-id>&page=<n>` and verify:
  - [ ] correct image page loads
  - [ ] correct transcript page loads
  - [ ] transcript toggle works
  - [ ] copy action works
- [ ] Check mobile layout.

## Decision Log

### Transcript UX

- Transcript visible by default: yes
- Transcript toggle: yes
- Transcript position: left on desktop, below image on mobile
- Search target: both document-level and page-level
- Human-readable artifact: yes
- Runtime artifact: yes

### OCR Policy

- OCR tooling committed to repo: no
- Language: Spanish
- Preserve layout as much as practical: yes
- Repeated headers/footers: omit if not useful

### Engine Selection

- Final OCR engine: pending user confirmation
- Current practical recommendation: `Tesseract`
- Reason: completed sample successfully; `PaddleOCR` currently hangs/fails on many sample pages

## Resume From Here

If work resumes in a new session, start with:

1. Read this file.
2. Verify the repo-side files listed above are still present.
3. Begin at `Phase 1: Sample Evaluation`.
4. Once the OCR engine is chosen, continue through full extraction and repo ingestion.
