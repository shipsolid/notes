---
title: "Pre-commit Hooks"
description: "This repo uses [pre-commit](https://pre-commit."
tags: ["ShipSolid", "CI/CD"]
updated: 2026-05-01
hidden: false
zettelId: "202605011913"
relations:
  - slug: projects/platform-shipsolid/06-build-release/code-standards
    kind: related
  - slug: projects/platform-shipsolid/06-build-release/terraform-driver-styles
    kind: related
---

## Pre-commit Hooks

This repo uses [pre-commit](https://pre-commit.com) to run linters and formatters automatically
before each commit. The wiring lives in three places:

| Path                    | What it controls                                                  |
| ----------------------- | ----------------------------------------------------------------- |
| .pre-commit-config.yaml | Master hook list — which tools run, in what order, with what args |
| .markdownlint.jsonc     | Markdownlint rule overrides                                       |
| .prettierrc.json        | Prettier formatting options                                       |
| .yamllint               | Yamllint rules                                                    |
| ruff.toml               | Ruff rule selection + per-file ignores                            |

Tool-specific ignore files: `.markdownlintignore`, `.prettierignore`.

## Scope: Option A

Hooks run **on staged files only** when you `git commit`. Existing files in the repo are left alone
until they're next edited.

To lint or format the entire repo manually:

```bash
pre-commit run --all-files            # all hooks
pre-commit run prettier --all-files   # one hook
pre-commit run --files path/to/file   # one or more files
```

## Installation

Once per clone:

```bash
brew install pre-commit shellcheck    # shellcheck only needed for shell hooks
pre-commit install                    # writes .git/hooks/pre-commit
```

The first commit after install will download the hook environments (~2-5 minutes, cached in
`~/.cache/pre-commit/`).

## Hook inventory

| Order | Hook                      | What it does                                          | Files it touches         |
| ----- | ------------------------- | ----------------------------------------------------- | ------------------------ |
| 1     | `prettier (markdown)`     | Format markdown (lists, tables, fences)               | `*.md`, `*.markdown`     |
| 2     | `markdownlint (fix)`      | Lint markdown structure                               | `*.md`, `*.markdown`     |
| 3     | `trailing-whitespace`     | Strip trailing spaces                                 | All text files           |
| 4     | `end-of-file-fixer`       | Ensure files end in single `\n`                       | All text files           |
| 5     | `check-yaml`              | Validate YAML syntax                                  | `*.yaml`, `*.yml`        |
| 6     | `check-json`              | Validate JSON syntax                                  | `*.json`                 |
| 7     | `check-merge-conflict`    | Detect leftover `<<<<<<<` markers                     | All text files           |
| 8     | `check-added-large-files` | Block files > 2 MB                                    | All staged files         |
| 9     | `check-case-conflict`     | Detect filename case clashes                          | All staged files         |
| 10    | `yamllint`                | Lint YAML structure (indent, duplicates, line-length) | `*.yaml`, `*.yml`        |
| 11    | `ruff`                    | Lint Python (style, imports, real bugs)               | `*.py`                   |
| 12    | `ruff-format`             | Format Python                                         | `*.py`                   |
| 13    | `shellcheck`              | Lint shell scripts                                    | `*.sh` + shebang scripts |
| 14    | `terraform_fmt`           | Format Terraform                                      | `*.tf`                   |

Hooks 1-2 (markdown) run first because their auto-fixes can change file content
prettier-vs-markdownlint converges before universal hygiene runs.

---

## Hook reference

### 1. prettier (markdown)

**Repo:** `rbubley/mirrors-prettier@v3.3.3` **Tool:** [Prettier](https://prettier.io) — opinionated
formatter

**What it does:** rewrites markdown to a canonical form — consistent list markers (`-` vs `*`),
table column alignment, fenced-code spacing, hard line breaks.

**Why first:** Prettier is structural; markdownlint is lint-on-top. Running prettier first means
markdownlint sees the canonical form.

**Config:** .prettierrc.json

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf",
  "overrides": [
    { "files": ["*.md", "*.markdown"],
      "options": { "proseWrap": "preserve", "embeddedLanguageFormatting": "off" } }
  ]
}
```

`proseWrap: preserve` is load-bearing — it stops prettier from rewrapping paragraph text, which
would create huge churn diffs.

**Per-file disable:** put `<!-- prettier-ignore -->` on the line above the content you want left
alone, or add the path to .prettierignore.

### 2. markdownlint-cli2

**Repo:** `DavidAnson/markdownlint-cli2@v0.14.0` **Tool:**
[markdownlint](https://github.com/DavidAnson/markdownlint)

**What it does:** enforces structural rules (heading levels, link validity, no empty links, table
column counts) that prettier doesn't cover.

**Config:** .markdownlint.jsonc — disables many rules to match repo conventions:

| Disabled because of repo conventions | Disabled because Prettier owns it |
| ------------------------------------ | --------------------------------- |
| MD001 heading-increment              | MD004 ul-style                    |
| MD013 line-length                    | MD007 ul-indent                   |
| MD024 no-duplicate-heading           | MD035 hr-style                    |
| MD025 single-H1                      | MD040 fenced-code-language        |
| MD028 no-blanks-blockquote           | MD045 no-alt-text                 |
| MD029 ol-prefix                      | MD046 code-block-style            |
| MD033 no-inline-html                 | MD048 code-fence-style            |
| MD036 no-emphasis-as-heading         | MD049 emphasis-style              |
| MD041 first-line-h1                  | MD050 strong-style                |
| MD042 no-empty-links                 |                                   |
| MD056 table-column-count             |                                   |

**Rules kept on:** MD009 trailing-spaces, MD010 hard-tabs, MD012 multiple-blanks, MD022
blanks-around-headings, MD031 blanks-around-fences, MD034 bare-urls.

**Per-file disable:** add `&lt;!-- markdownlint-disable --&gt;` and
`&lt;!-- markdownlint-enable --&gt;` around the block, or per rule:
`&lt;!-- markdownlint-disable MD013 --&gt;`.

> Written as HTML entities, not a literal `<!-- -->` comment: markdownlint's inline-directive
> scanner matches these on raw text regardless of code-span/fence boundaries, so a literal
> disable+enable pair here would silently re-enable every rule (including MD013) for the rest of the
> file, overriding `.markdownlint.jsonc`.

### 3. trailing-whitespace

**Repo:** `pre-commit/pre-commit-hooks@v5.0.0`

**What it does:** strips trailing spaces from lines.

**Markdown exception:** the hook is invoked with `--markdown-linebreak-ext=md,markdown`, which
preserves the two-trailing-spaces idiom that markdown uses for hard line breaks.

### 4. end-of-file-fixer

**Repo:** `pre-commit/pre-commit-hooks@v5.0.0`

**What it does:** ensures every text file ends in exactly one `\n`. Strips extra trailing newlines
and adds one if missing.

**Why it matters:** POSIX tools (`cat`, `sort`, `wc -l`) and many parsers assume files end in `\n`.
Missing trailing newlines break diffs and tools inconsistently.

### 5. check-yaml

**Repo:** `pre-commit/pre-commit-hooks@v5.0.0`

**What it does:** parses each YAML file with PyYAML; fails on syntax errors (duplicate keys, bad
indentation, malformed anchors).

**Config:** invoked with `--allow-multiple-documents` so multi-doc K8s manifests (`---` separated)
parse correctly.

**Helm exclusion:** Helm chart `templates/` directories are excluded at the top of
`.pre-commit-config.yaml` because Go template syntax (`{{ .Values.foo }}`) is not valid YAML on its
own.

### 6. check-json

**Repo:** `pre-commit/pre-commit-hooks@v5.0.0`

**What it does:** parses each JSON file; fails on syntax errors.

**Note:** does not check JSONC (JSON-with-comments). Files like `.markdownlint.jsonc` are excluded
by extension automatically.

### 7. check-merge-conflict

**Repo:** `pre-commit/pre-commit-hooks@v5.0.0`

**What it does:** fails if any staged file contains git conflict markers (`<<<<<<<`, `=======`,
`>>>>>>>`).

### 8. check-added-large-files

**Repo:** `pre-commit/pre-commit-hooks@v5.0.0`

**What it does:** blocks any newly-added file over 2 MB (`--maxkb=2000`).

**Why 2 MB and not the default 500 KB:** a few legitimate vendored Helm values files and Grafana
dashboards exceed 500 KB. True binaries (`*.gz`, `*.dump`, `*.pem`, `*.key`) are git-ignored anyway.

**Override for one commit:** `git commit --no-verify` (avoid this — see "Bypass" section).

### 9. check-case-conflict

**Repo:** `pre-commit/pre-commit-hooks@v5.0.0`

**What it does:** fails if a new file would case-conflict with an existing one on case-insensitive
filesystems (Windows, macOS default). Catches `Readme.md` vs `README.md`.

### 10. yamllint

**Repo:** `adrienverge/yamllint@v1.35.1` **Tool:** [yamllint](https://yamllint.readthedocs.io)

**What it does:** structural linting beyond syntax — duplicate keys, indentation consistency, line
length, truthy-value warnings, comment formatting.

**Config:** .yamllint, starts from the `relaxed` preset with these tweaks:

- `line-length`: 200 chars, warning level (Alloy regex / dashboard JSON)
- `indentation`: `indent-sequences: consistent` (don't fight repo style)
- `document-start`: disabled (single-doc files don't need leading `---`)
- `truthy`: keys excluded from check (GHA `on:` is intentional)

**Strict mode:** invoked with `--strict`, which means yamllint warnings become hook failures.
Tighten or loosen by editing `.yamllint`.

**Per-file disable:** `# yamllint disable-file` at the top of the file, or
`# yamllint disable rule:line-length` before a single line.

### 11. ruff (lint)

**Repo:** `astral-sh/ruff-pre-commit@v0.7.4` **Tool:** [Ruff](https://docs.astral.sh/ruff/) —
Rust-based Python linter that replaces flake8, isort, pyupgrade, bandit (subset), and more.

**What it does:** lints Python for style, imports, real bugs, modernisation hints. Auto-fixes what
it can (`--fix`).

**Config:** ruff.toml

| Setting          | Value          | Why                                                |
| ---------------- | -------------- | -------------------------------------------------- |
| `target-version` | `py310`        | Lowest supported across the repo's Python projects |
| `line-length`    | `100`          | Matches Prettier's `printWidth`                    |
| `lint.select`    | `E F I W UP B` | Real bugs + import order + modernisation           |
| `lint.ignore`    | `E501 B008`    | Long-line escape hatch + FastAPI Depends() pattern |

**Per-file ignores** (`[lint.per-file-ignores]` in `ruff.toml`):

| Glob               | Ignored          | Reason                        |
| ------------------ | ---------------- | ----------------------------- |
| `**/tests/**/*.py` | `F401 F403 F405` | Pytest fixtures, star imports |
| `**/conftest.py`   | `F401 F403 F405` | Fixtures                      |
| `**/cli.py`        | `E402`           | argparse setup before imports |

**Per-line disable:** `# noqa: E501` after the offending line.

**Project override:** any project's `pyproject.toml` with `[tool.ruff]` will override the repo
`ruff.toml` for that subtree.

### 12. ruff-format

**Repo:** `astral-sh/ruff-pre-commit@v0.7.4`

**What it does:** Python formatter, drop-in replacement for `black`. Reads the same `ruff.toml`.

**Why separate from `ruff` lint:** ruff splits lint and format because formatting is structural
(always rewrites) while linting can be advisory. You can disable `ruff-format` while keeping `ruff`
lint, or vice versa.

### 13. shellcheck

**Hook type:** `local` (calls system `shellcheck` binary)

**Why local instead of `shellcheck-py`:** `shellcheck-py` downloads the shellcheck binary during
`pip install`, which fails behind Zscaler. The local hook delegates to a system install
(`brew install shellcheck`).

**What it does:** lints shell scripts for common bugs — unquoted variables, broken `set -e`, wrong
test operators, unreachable code.

**Severity:** invoked with `--severity=warning`, which suppresses `info` and `style` levels. Real
bugs (`error`, `warning`) still block.

**Per-line disable:** `# shellcheck disable=SC2086` above the line.

**File-level disable:** `# shellcheck disable=SC2086` at the top of the file.

### 14. terraform_fmt

**Repo:** `antonbabenko/pre-commit-terraform@v1.96.1`

**What it does:** runs `terraform fmt` on `*.tf` files. Pure formatting — no validation, no provider
plugins, no cloud creds needed.

**Why no `terraform_validate`:** validation requires `terraform init` per module. The repo has
multi-env modules (`f-observability/06-grafana-cloud-v2`) and Makefile-driven workloads
(`c-platform/01-terraform-samples`) — the two
[[projects/platform-shipsolid/06-build-release/terraform-driver-styles|Terraform Driver Styles]] —
where the init dance doesn't fit pre-commit cleanly. Validate runs in CI instead.

---

## Excludes

The top of .pre-commit-config.yaml has a single exclude regex that applies to **every** hook:

```regex
.*/site/.*                            # mkdocs build output (k-docs/site/)
.*/generated/.*                       # registry-generated files
.*/gen-tf/.*                          # Terraform render output
.*/grafana-k8s-monitoring-[^/]+/.*    # vendored Helm chart
.*/node_modules/.*
.*/\.venv/.*                          # Python venvs
.*/wwwroot/lib/.*                     # vendored bootstrap/jquery
.*/\.terraform/.*                     # Terraform provider plugins
.*/charts/[^/]+/templates/.*          # Helm Go templates (not valid YAML)
```

Hook-specific ignore files extend this:

- .markdownlintignore
- .prettierignore
- `ignore:` block in .yamllint
- `extend-exclude` in ruff.toml

## Common workflows

### Run all hooks on the whole repo

```bash
pre-commit run --all-files
```

### Run one hook on the whole repo

```bash
pre-commit run ruff --all-files
pre-commit run yamllint --all-files
```

### Skip one hook for one commit

```bash
SKIP=ruff git commit -m "skip ruff for this WIP commit"
SKIP=ruff,yamllint git commit -m "skip multiple"
```

### Update hook versions

```bash
pre-commit autoupdate            # bump all hook revs to latest
pre-commit autoupdate --repo https://github.com/astral-sh/ruff-pre-commit  # one tool
```

After autoupdate, run `--all-files` and verify nothing new breaks before committing the bumped
`.pre-commit-config.yaml`.

### Bypass

`git commit --no-verify` skips ALL hooks. Reserved for genuine emergencies. The repo's engineering
principles prohibit `--no-verify` without explicit sign-off — fix the underlying issue or use
`SKIP=...` to scope the bypass.

## Adding a new hook

1. Find the upstream repo (most tools publish a pre-commit recipe in their README).
2. Pin the `rev:` to a specific tagged release.
3. Add a per-tool config file at the repo root if the hook supports one.
4. Update the master `exclude:` regex if the tool will choke on vendored/generated paths.
5. Run `pre-commit run <hook-id> --all-files` and triage the noise.
6. Document the hook in this file (purpose, config, scope, gotchas).

## Troubleshooting

### "Stashed changes conflicted with hook auto-fixes"

A hook auto-fixed a file in a way that conflicts with your unstaged changes. Pre-commit rolls back
to keep your work safe.

Fix:

1. `git diff` — review your unstaged changes
2. `git stash` — set them aside
3. Retry the commit (hooks run, auto-fixes stick)
4. `git stash pop` — reapply your changes manually if they survive

### "An unexpected error has occurred: CalledProcessError"

A hook environment failed to install. Check `~/.cache/pre-commit/pre-commit.log`. Most common cause
in this repo: corporate Zscaler TLS interception breaking pip downloads. See
`feedback_zscaler_env_var_consistency` — ensure `CURL_CA_BUNDLE`, `GIT_SSL_CAINFO`, `SSL_CERT_FILE`,
and `REQUESTS_CA_BUNDLE` all point at `custom-ca-bundle.crt`.

### A hook keeps "flapping" (auto-fixing the same file every commit)

Two hooks disagree about formatting. Most often Prettier vs markdownlint on malformed Notion
exports. Find the conflicting line, normalise the content (wrap in code fence, fix broken HTML
comment), and the flap stops. Documented examples: `k-docs/_landing/exports/ee38b724-*.md` and
`k-docs/_landing/exports/202b7ae1-*.md` (broken HTML comment around list items).

### Hook environments take forever on first commit

Normal — first run downloads ~5 isolated tool environments to `~/.cache/pre-commit/`. Subsequent
runs are cached. Pre-warm with:

```bash
pre-commit install --install-hooks
```

## Related

- [[projects/platform-shipsolid/06-build-release/code-standards|Code Standards]] — the enforcement
  section there points back here.
- Repo-root CLAUDE.md — monorepo conventions
- scripts/fix-markdown-lint.py — bulk-fix utility for MD028/MD035 errors that markdownlint can't
  auto-fix
