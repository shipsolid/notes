---
title: "RFC: Editor & Agentic IDE Selection — VS Code vs. Google Antigravity"
tags:
  - devx
  - tooling
  - ide
  - vscode
  - antigravity
  - ai-agents
  - claude-code
  - ShipSolid
updated: "2026-07-06"
zettelId: "202607060112-10"
relations:
  - slug: projects/platform-shipsolid/01-platform-architecture/rfcs/_template
    kind: related
  - slug: projects/platform-shipsolid/01-platform-architecture/rfcs/rfc-adopt-grafana-cloud-for-centralized-observability
    kind: related
---

## RFC: Editor & Agentic IDE Selection — VS Code vs. Google Antigravity

- **RFC ID**: rfc-2026-07-ide-vscode-vs-antigravity-ShipSolid
- **Authors**: Amit Singh, Observability Architect
- **Status**: Draft
- **Created**: 2026-07-06
- **Last Updated**: 2026-07-06
- **Target Release**: N/A — tooling decision, no release train
- **Supersedes**: —
- **Related Docs**:
  - `n-devx/01-runway` (infra repo, not published on this site) — IDP the team already develops
    against
  - Google Antigravity: [Pricing](https://antigravity.google/pricing) ·
    [Terms of Service](https://antigravity.google/terms)
  - [TechCrunch — Antigravity 2.0 launch, I/O 2026](https://techcrunch.com/2026/05/19/google-launches-antigravity-2-0-with-an-updated-desktop-app-and-cli-tool-at-io-2026/)
  - [simonwillison.net — Google Antigravity Exfiltrates Data](https://simonwillison.net/2025/Nov/25/google-antigravity-exfiltrates-data/)
  - [Dark Reading — Google fixes critical RCE flaw in Antigravity](https://www.darkreading.com/vulnerabilities-threats/google-fixes-critical-rce-flaw-ai-based-antigravity-tool)
  - [[projects/platform-shipsolid/01-platform-architecture/rfcs/_template|RFC Template]] — the
    template this RFC follows.
  - [[projects/platform-shipsolid/01-platform-architecture/rfcs/rfc-adopt-grafana-cloud-for-centralized-observability|RFC-001: Adopt Grafana Cloud]]
    — prior RFC in this series.

---

## 1. Summary

This RFC evaluates whether to adopt **Google Antigravity** — Google's agent-first IDE, relaunched as
a full platform ("Antigravity 2.0") at I/O 2026 — as a day-to-day editor alongside or instead of
**VS Code**, our current default across the lab and ShipSolid platform-architecture work.

**Recommendation: keep VS Code + Claude Code as the required default. Do not adopt Antigravity
team-wide.** Permit a single-person, timeboxed, sandboxed pilot (Amit only, `l-labs/` only, no
ShipSolid/platform credentials in scope) to re-evaluate once Antigravity's enterprise security and
compliance posture stabilizes. Revisit this RFC in Q4 2026.

The driver is not a feature gap — Antigravity's multi-agent "Mission Control" and
browser-verification workflow are genuinely interesting — it's that the platform is seven months
old, has already shipped a disclosed prompt-injection data-exfiltration vulnerability that Google
classified partly as "intended behavior," and its non-training data-handling guarantee is contingent
on Google Workspace/GCP-authenticated access — which ShipSolid, an Azure-native shop, does not
currently have.

---

## 2. Background & Motivation

No incident is driving this — it's a proactive tooling review triggered by Google Antigravity's
relaunch at I/O 2026 (2026-05-19) as a full platform: desktop IDE, CLI, SDK, a Managed Agents tier
in the Gemini API, and an enterprise deployment path via the Gemini Enterprise Agent Platform.
That's a materially bigger surface than the November 2025 preview, and it raises the question of
whether it belongs in the standard toolchain next to VS Code + Claude Code.

Today, the team (Amit, Amlan, Ansh, Archit) standardizes on VS Code across every pillar in this repo
— `n-devx/01-runway`, the Terraform/Helm workloads in `c-platform` and `f-observability`, and the
application code in `d-apps` — with Claude Code as the agentic layer on top. That combination is a
known quantity: it works through the corporate Zscaler proxy (cert injection is already solved for
Docker/k3d, and VS Code itself is a long-vetted enterprise binary), and its extension/marketplace
behavior is well understood.

Antigravity is also a VS Code fork (built substantially by the former Windsurf team, which Google
absorbed in 2025), so the switching cost isn't "learn a new editor" — it's "trust a new
agent-execution model with repo access, terminal access, and (via its browser tool) network access."

---

## 3. Goals & Non-Goals

### Goals

- Decide the default editor/agent stack for day-to-day work across the lab and ShipSolid
  platform-architecture workstreams.
- Establish an explicit security and data-handling bar that any AI-agentic IDE must clear before it
  touches ShipSolid-adjacent code (especially anything near OT/plant, GxP, or SignalForge surfaces).
- Define a bounded, low-risk path to keep evaluating Antigravity without exposing production
  credentials or regulated data.

### Non-Goals

- Not a bake-off of every VS Code fork (Cursor, Windsurf, Zed, JetBrains + AI plugins are out of
  scope; noted briefly under Alternatives).
- Not a model-quality comparison between Gemini 3 and Claude — that's a separate, faster-moving
  question and shouldn't gate an editor decision.
- Not a decision about ShipSolid's org-wide approved-tools list — that's IT/Security's call; this
  RFC only governs Amit's/the team's own lab and platform-architecture repos.

---

## 4. Scope

- **In scope:** editor/IDE choice for work in this monorepo — all pillars (`a-governance` through
  `n-devx`) and the ShipSolid platform-architecture project docs.
- **Out of scope:** OT plant-node terminals and any air-gapped or network-constrained environment —
  these aren't edited via a cloud-agentic IDE regardless of this decision.
- **Explicitly excluded from any Antigravity usage, pilot or otherwise:** `b-security/`, anything
  touching plant/OT credentials, GxP-adjacent code paths, and any repo holding real
  (non-lab-scaffolding) secrets.

---

## 5. Proposed Solution

### 5.1 Overview

Two-tier model, not a switch:

1. **Default (required):** VS Code + Claude Code. No change from current practice.
2. **Exploration (optional, gated):** a single-user Antigravity pilot under the guardrails in §5.3,
   feeding a go/no-go decision at the Q4 2026 review.

No team-wide Antigravity adoption is proposed in this RFC.

### 5.2 Comparison

| Dimension                               | VS Code (+ Copilot/Claude Code)                                               | Google Antigravity 2.0                                                                                                                                                                                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Maturity                                | ~11 years, ubiquitous enterprise deployment                                   | Public preview Nov 2025 → platform relaunch May 2026; ~7 months old                                                                                                                                                                                      |
| Base                                    | Native                                                                        | VS Code fork (ex-Windsurf team)                                                                                                                                                                                                                          |
| Agent model                             | Inline chat / CLI agent (Claude Code) driving editor + terminal               | "Mission Control" — multiple asynchronous agents across workspaces, background task scheduling, browser-driven self-verification (screenshots, recordings as review artifacts)                                                                           |
| Model flexibility                       | Model-agnostic (Claude Code, Copilot, any CLI-based agent)                    | Gemini-centric; broader model support unclear at platform tier                                                                                                                                                                                           |
| Remote/enclave dev                      | Mature — SSH, containers, WSL; proven in this repo's k3d/Zscaler workflow     | Not established for this repo's Zscaler-proxied, k3d-based workflow                                                                                                                                                                                      |
| Extension ecosystem                     | Massive, vetted marketplace                                                   | Inherits VS Code compatibility in principle; ecosystem maturity as a fork unverified here                                                                                                                                                                |
| Enterprise admin controls               | Mature — Copilot Enterprise policies, per-file suppression, long track record | Enterprise tier exists (~$40–60/user/mo per one source; ~$19+/user/mo per another — pricing not yet consistent across sources) with SSO (Okta/Azure AD) and agent-action audit logs, but no compliance certifications (SOC 2, ISO) surfaced publicly yet |
| Security track record                   | Long-vetted                                                                   | Disclosed prompt-injection → data-exfiltration vulnerability within ~1 week of launch (PromptArmor, Nov 2025); separate critical RCE patched (Dark Reading); Google classified part of the exfiltration path as "intended" default behavior              |
| Data/training policy                    | Copilot Enterprise: no training on private code (contractual)                 | Interactions used for training by default **unless** accessed via Google Workspace/GCP-authenticated login — ShipSolid has no confirmed GCP/Workspace tenant                                                                                             |
| Pricing (individual)                    | Free (editor) + existing Copilot/Claude Code spend                            | Free tier, Pro $20/mo, Ultra $100/mo, Ultra Max $200/mo                                                                                                                                                                                                  |
| Corporate proxy (Zscaler) compatibility | Proven in this repo today                                                     | Unverified — new Electron app, not literally VS Code's binary; cert trust store behavior needs its own validation                                                                                                                                        |

### 5.3 Guardrails for the Antigravity pilot (if run)

- Pilot is **single-user (Amit), lab-only** — scoped to `l-labs/` directories with no production,
  ShipSolid-platform, or OT credentials ever loaded into the workspace.
- Work in a disposable git worktree/branch; treat every agent-authored change as untrusted until
  reviewed, same bar as any AI-authored diff.
- Disable or tightly scope the browser tool's URL allowlist — the disclosed exfiltration path relied
  on a permissive default allowlist (it included `webhook.site`). Don't accept the shipped defaults.
- No login via a personal Google account against a corpus containing anything sensitive — if there's
  ever a business justification to go further, that must go through a Workspace/GCP-authenticated
  path first, specifically to get out from under the default train-on-interactions terms.
- No plant/OT-adjacent, GxP-adjacent, or `b-security/` content in any workspace opened in
  Antigravity, full stop.

### 5.4 Rollout

- **Phase 0 (now):** No change. VS Code + Claude Code remains the required default for all team
  members.
- **Phase 1 (optional, 60-day timebox):** Amit runs the guarded pilot above on a handful of bounded
  `l-labs/` tasks and logs friction/wins.
- **Phase 2 (conditional):** Only if Phase 1 surfaces a clear capability advantage **and**
  Antigravity has, by the Q4 2026 review, (a) a named compliance certification (SOC 2 Type II or
  equivalent) and (b) no further disclosed critical CVEs in the interim — reopen this RFC for a
  scoped team pilot with 1–2 other volunteers, still lab-only.
- **Rollback:** trivial at every phase — uninstall the app; nothing ShipSolid-scoped was ever placed
  in it.

---

## 6. Security & Compliance

- **Disclosed vulnerability:** researchers at PromptArmor demonstrated indirect prompt injection via
  content hidden in a web page (tiny/invisible font-size tricks), which manipulated an Antigravity
  agent into exfiltrating local data through its browser tool to an attacker-controlled endpoint —
  enabled in part by a default browser URL allowlist that included a public request-bin service
  (`webhook.site`). Google's own classification treated part of this as intended tool behavior
  rather than a bug, which means the residual risk isn't fully "patched" — it's a standing
  default-configuration hazard. A separate, unrelated critical RCE was patched by Google (per Dark
  Reading).
- **Training-data exposure:** per Antigravity's Additional Terms of Service, Interactions (which
  include your code, prompts, and agent activity) are used for Google/Alphabet product-improvement
  and training **unless** access is via Google Workspace or GCP-authenticated login. ShipSolid's
  stack is Azure-native (see Context.md tech stack) with no confirmed GCP/Workspace tenant, so any
  ShipSolid-adjacent use today would default to the consumer terms — i.e., code potentially used for
  training. This alone is disqualifying for anything beyond personal lab experimentation
  until/unless ShipSolid stands up a Workspace/GCP-authenticated path.
- **No compliance certification surfaced:** unlike the VS Code + Copilot Enterprise baseline
  (established enterprise policies, documented data handling), Antigravity has no SOC 2/ISO
  certification visible in public materials as of this writing. Treat it as unaudited for anything
  regulated (GxP-adjacent, OT).
- **Zscaler/corporate proxy:** not yet validated in this environment. Before any pilot, confirm the
  Antigravity desktop app trusts the corporate CA the way VS Code and other Electron/Chromium-based
  dev tools in this repo already do (see the `zcert.crt` injection pattern used elsewhere in the
  repo) — don't assume it "just works" because it's VS Code-based.

---

## 7. Testing & Validation Plan

- Before the pilot starts: confirm Zscaler CA trust in the Antigravity desktop app (open an
  internal/corporate HTTPS endpoint and verify no TLS interception errors).
- During the pilot: run 2–3 bounded, repeatable tasks (e.g., a lab-scoped bug fix, a small feature
  in `l-labs/`) once in VS Code + Claude Code and once in Antigravity; compare
  time-to-review-ready-PR and the quality of the review artifacts each produces.
- Security check before opening any workspace: confirm no plant/OT, GxP, or `b-security/` paths are
  present, and confirm the browser tool's allowlist has been tightened from shipped defaults.

---

## 8. Rollout Plan

### 8.1 Phases

See §5.4.

### 8.2 Rollback Plan

Uninstall the Antigravity desktop app; no ShipSolid-platform or production credentials are ever
placed in scope, so rollback has no cleanup burden beyond removing the binary.

---

## 9. Success Criteria

Phase 1 pilot is judged a success (→ proceed to Phase 2 conditions) if, over the 60-day window:

- Zero security guardrail violations (no credential/OT/GxP exposure, allowlist stayed tightened).
- At least one bounded task shows a clear, reproducible speed or quality advantage over the VS
  Code + Claude Code baseline.
- No new critical CVE disclosed against Antigravity during the window.

If any guardrail is violated, the pilot ends immediately regardless of capability findings.

---

## 10. Alternatives Considered

- **Cursor** — also a VS Code fork with agentic features; SOC 2 Type II certified with a public
  trust portal, a materially stronger compliance starting point than Antigravity's current public
  posture. Not evaluated in depth here; worth its own RFC if Antigravity's Phase 2 doesn't clear the
  bar.
- **Windsurf** — same lineage as Antigravity (the team Google acquired); not separately evaluated
  since Antigravity is the successor investment.
- **JetBrains + AI plugins** — not adopted; the team's existing tooling, extensions, and muscle
  memory are VS Code-based, and none of the pillars in this repo need JetBrains-specific tooling.
- **Status quo (VS Code + Claude Code only, no pilot at all)** — rejected in favor of a guarded
  pilot: the capability direction (multi-agent orchestration, browser-verified changes) is worth
  tracking even if not yet adoptable, and a bounded pilot costs nothing if the guardrails hold.

---

## 11. Risks & Mitigations

- **Risk:** Prompt-injection-driven data exfiltration via Antigravity's browser tool →
  **Mitigation:** pilot is lab-only, no sensitive data in scope, allowlist tightened before first
  use (§5.3, §6).
- **Risk:** ShipSolid/personal code used for Google model training by default → **Mitigation:** no
  ShipSolid-platform content enters any Antigravity workspace until a Workspace/GCP-authenticated
  path exists; pilot is lab-only under Amit's personal account.
- **Risk:** Vendor lock-in to the Gemini stack if adoption proceeds → **Mitigation:** VS Code +
  Claude Code remains the required default; Antigravity stays additive/optional, never the only
  agentic surface.
- **Risk:** Tooling fragmentation if team members self-adopt Antigravity ad hoc without this review
  → **Mitigation:** this RFC is the documented decision; anything beyond the Phase 1 single-user
  pilot requires a Phase 2 reopening.
- **Risk:** Platform immaturity — Antigravity shipped a major architecture change (1.0 → 2.0) within
  six months, suggesting continued API/behavior churn → **Mitigation:** the Q4 2026 review
  checkpoint exists precisely to avoid committing to a moving target.

---

## 12. Open Questions

- Does ShipSolid IT/Security already have an approved- or blocked-tools list that resolves this
  question independently of this RFC?
- Is a Google Workspace/GCP-authenticated tenant something ShipSolid would ever stand up, given the
  org is Azure-native? If never, Antigravity's non-training data path may simply never be available
  to us, which would harden the "lab-only, indefinitely" conclusion rather than it being a temporary
  gap.
- Should the same guardrail framework (§5.3) be applied retroactively to any other AI-agentic tool
  with browser/network tool-use, not just Antigravity?

---

## 13. Stakeholders & Reviewers

| Name                                | Role                                                   | Responsibility                                              |
| ----------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| Amit Singh                          | Observability Architect, RFC author                    | Decision owner, runs the Phase 1 pilot                      |
| Amlan                               | Team collaborator                                      | Feedback if/when Phase 2 is reopened                        |
| Ansh                                | Team collaborator                                      | Feedback if/when Phase 2 is reopened                        |
| Archit                              | Team collaborator                                      | Feedback if/when Phase 2 is reopened                        |
| ShipSolid IT/Security (TBD contact) | Approver for any tool touching ShipSolid-adjacent code | Confirm approved-tools status; own the Open Questions above |

---

## 14. References

- [Google Antigravity — Pricing](https://antigravity.google/pricing)
- [Google Antigravity — Additional Terms of Service](https://antigravity.google/terms)
- [TechCrunch — Google launches Antigravity 2.0 with an updated desktop app and CLI tool at I/O 2026](https://techcrunch.com/2026/05/19/google-launches-antigravity-2-0-with-an-updated-desktop-app-and-cli-tool-at-io-2026/)
- [simonwillison.net — Google Antigravity Exfiltrates Data](https://simonwillison.net/2025/Nov/25/google-antigravity-exfiltrates-data/)
- [bdtechtalks — Antigravity prompt injection vulnerability highlights security threats of AI-powered coding tools](https://bdtechtalks.com/2025/11/27/google-antigravity-prompt-injection/)
- [CSO Online — Prompt injection turned Google's Antigravity file search into RCE](https://www.csoonline.com/article/4161382/prompt-injection-turned-googles-antigravity-file-search-into-rce.html)
- [Dark Reading — Google Fixes Critical RCE Flaw in AI-Based 'Antigravity' Tool](https://www.darkreading.com/vulnerabilities-threats/google-fixes-critical-rce-flaw-ai-based-antigravity-tool)
- [Augment Code — Cursor vs Google Antigravity: Which Fits Your Enterprise Team's Reality?](https://www.augmentcode.com/tools/cursor-vs-google-antigravity)
