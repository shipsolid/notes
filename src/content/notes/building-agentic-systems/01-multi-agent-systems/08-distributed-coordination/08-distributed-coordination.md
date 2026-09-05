---
title: "8. Distributed Coordination"
description: "Covers coordinating agent state and actions across distributed processes, including the partial failure, message loss, and race condition modes borrowed from distributed systems theory."
tags: ["building-agentic-systems", "multi-agent-systems", "book"]
hidden: false
updated: 2026-08-08
zettelId: "202607191037-95"
relations:
  - slug: building-agentic-systems/01-multi-agent-systems/03-communication-protocols/03-communication-protocols
    kind: related
  - slug: agentic-ai-engineering/04-tools-and-environment-interaction/13-agents-in-ci-cd-and-sdlc-workflows/13-agents-in-ci-cd-and-sdlc-workflows
    kind: related
  - slug: building-agentic-systems/01-multi-agent-systems/09-supervisor-architectures/09-supervisor-architectures
    kind: related
  - slug: production-agent-systems/00-production-infrastructure/05-message-queues/05-message-queues
    kind: depends_on
---

## Distributed Coordination

> Chapter of [[building-agentic-systems/readme#01 — Multi-Agent Systems|Multi-Agent Systems]], part
> of [[building-agentic-systems/readme|Building & Evaluating Agents]].

## What you will understand at the end

- Why concurrently-running agents need **isolated working state**, not shared mutable state, and the
  concrete isolation mechanisms (branches, scratch namespaces, sandboxes) that provide it
- How to reason about **partial failure** in a parallel agent batch — when one agent's crash should
  fail the whole batch versus when the surviving results are still usable
- The **message-loss** problem when agents coordinate via queues or events, and why at-least-once
  delivery forces every agent handler to be idempotent
- How to **detect** the three concrete conflict types between concurrently-working agents —
  overlapping edits, duplicated effort, contradictory outputs — and the resolution strategy that
  fits each
- How GitHub Copilot's parallel coding agents map every one of these abstractions onto real,
  observable repo mechanics: branches, merge conflicts, and issue assignment

---

## The mental model

Single-agent reliability is about one execution loop not falling over. Distributed coordination is a
different problem class entirely: it's about **N agents, each running their own loop, sharing a
world** — a codebase, a task queue, a knowledge base — where nothing guarantees their actions arrive
in the order you imagined, or arrive at all.

This is not a new problem. It is the distributed-systems partial-failure/message-loss/race-condition
triad, wearing an agent costume. The reason it deserves its own chapter instead of a footnote on
"just use a message queue" is that agent actions are **expensive, semantically loaded, and hard to
undo** — a lost message between two microservices might mean a retried HTTP call; a lost message
between two agents might mean an agent silently abandons a code review, or two agents each spend $4
of LLM calls solving the same subtask.

Think of the four failure modes as a funnel — each one only becomes visible once the previous one is
handled:

```mermaid
flowchart TD
    A["Agents run concurrently"] --> B{"Do they share\nmutable state directly?"}
    B -->|"Yes"| C["Isolation failure:\nrace conditions on shared state"]
    B -->|"No — isolated workspaces"| D{"Does every agent\nin the batch finish?"}
    D -->|"No"| E["Partial failure:\nfail-batch vs. best-effort"]
    D -->|"Yes"| F{"Did every message\narrive exactly once?"}
    F -->|"No"| G["Message loss:\nat-least-once + idempotency"]
    F -->|"Yes"| H{"Did two agents act on\nthe same target?"}
    H -->|"Yes"| I["Conflict:\noverlap · duplication · contradiction"]
    H -->|"No"| J["Coordinated outcome\nmerged safely"]

    C -.->|"fix: isolate first"--> B
    I -->|"detect + resolve"| J
```

Read the diagram as a checklist, not a diagram to admire: if you can't answer "no race conditions,
no unhandled partial failure, no silent message loss" for your system, conflict detection downstream
is decoration on a broken foundation.

---

## 1. Agent isolation for parallel execution

**The core mistake:** letting two concurrently-running agents read and write the _same_ mutable
state — the same in-memory object, the same file, the same working-memory namespace, the same
branch. This isn't a hypothetical: it is the natural failure mode of "spin up N agents against the
same repo" if nobody explicitly engineers isolation in.

**Why isolation, not locking, is the default answer:** you could make shared state safe with locks —
a mutex around the shared scratchpad, an advisory lock on the file. But locking a resource that an
_LLM-driven_ agent might hold for an unbounded, unpredictable amount of time (a tool call can hang,
a model can go into a long reasoning loop) turns every other agent in the batch into a queue behind
a stall you can't estimate. Distributed systems learned this lesson with distributed locks decades
ago: prefer to **partition state so there's nothing to lock**.

Three isolation mechanisms, escalating in strength:

| Isolation level         | What's isolated                                   | Mechanism                                                                                            | Failure it prevents                                                                                                | Cost                                                                          |
| ----------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **Branch isolation**    | Version-controlled artifacts (code, docs, config) | Each agent works on its own git branch, cut from a common base                                       | Two agents' edits to the same file silently overwriting each other in place                                        | Cheap; merge still required at the end                                        |
| **Namespace isolation** | Scratch/working memory, intermediate results      | Each agent gets a keyed sub-tree (`agent_id/task_id/*`) in the shared store, never writes outside it | One agent's intermediate state corrupting another's in a shared vector store or key-value store                    | Cheap; requires discipline in key design                                      |
| **Sandbox isolation**   | Code execution, filesystem, network               | Each agent runs its tool-execution step in its own container/VM/ephemeral environment                | One agent's side effects (installed packages, mutated files, network calls) leaking into another agent's execution | Most expensive; needed only when agents execute untrusted or destructive code |

**The rule of thumb:** isolate first, merge later, and make the merge step an explicit, observable
part of the workflow — not an implicit side effect of two agents happening to write to the same
place at slightly different times. This is exactly the reasoning behind why coding-agent platforms
default every parallel agent onto its own branch (§4) and why sandboxed code execution
([[08-code-execution|Chapter 8, Part 04 of Agentic AI Engineering]]) is a hard requirement once
agents can run arbitrary code concurrently.

**What isolation does _not_ solve:** two isolated agents can still both decide to do the same work
(duplicated effort, §3.2) or reach opposite conclusions (contradictory outputs, §3.3). Isolation
prevents corruption of shared state; it does not prevent wasted effort or disagreement. Those need
separate detection mechanisms, covered in §3.

---

## 2. Partial failure — when one agent in a batch dies

You fan out a task across five agents — say, five specialist reviewers analyzing different files in
a PR, or five sub-agents each researching one facet of a question. Agent 3 times out, or its tool
call throws, or the model returns a malformed response after retries are exhausted. What now?

This is the same question distributed systems has always asked about partial failure, applied to a
fan-out/fan-in agent topology: **does the failure of one unit invalidate the whole batch, or is the
batch's value separable per-unit?**

Two policies, and the choice is a design decision — not a default you inherit by accident:

**Fail-fast (all-or-nothing).** If agent 3's output is a dependency for the final synthesis — e.g.
its finding changes how the other four findings should be interpreted — a partial result is actively
misleading. Better to fail the whole batch, surface the error, and let a supervisor decide whether
to retry agent 3 alone or restart the batch. Silent partial success here produces a confidently
wrong final answer, which is worse than an explicit failure.

**Best-effort (partial success).** If the five agents' outputs are independent — five files reviewed
separately, five research questions answered separately — agent 3's failure doesn't poison agents 1,
2, 4, 5's results. The right move is to return four good results plus an explicit gap marker ("file
X was not reviewed — timeout"), not to discard everything or, worse, to silently present four
results as if they were the complete five.

The determining factor is **whether downstream synthesis assumes completeness**. A supervisor agent
that aggregates N specialist outputs into one report ([[09-supervisor-architectures|Chapter 9]])
must know which of its N is missing — an aggregation step that can't tell "four inputs because
that's what shipped" from "four inputs because one silently vanished" is a correctness bug, not a
resilience feature.

**Practical mechanics that make best-effort safe:**

- Every fan-out task carries a **task ID and a required status** (`succeeded` / `failed` /
  `timed_out`) in its result envelope — never just the payload
- The fan-in step counts results against the expected N and treats a short count as a _finding_, not
  an assumption to paper over
- Retries are bounded and reported — a task retried 3 times before succeeding should say so, because
  that's a reliability signal even when the eventual result looks clean

This is the same discipline covered generally for durable, resumable workflows in
[[03-state-persistence|Production Infrastructure, Chapter 3]] and [[06-workflow-engines|Chapter 6]]
— distributed coordination is where that discipline gets tested under concurrency instead of a
single sequential loop.

---

## 3. Message loss and delivery semantics

Once agents coordinate through anything other than a direct, synchronous function call — a task
queue, a pub/sub event bus, a shared blackboard another agent polls — you inherit the same delivery
semantics tradeoff every distributed messaging system has:

| Delivery guarantee | What it means                                                         | What it costs you                                                                            | What agent coordination needs                                                                                                                                                                                |
| ------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **At-most-once**   | A message is delivered zero or one times — never retried              | Silent message loss on any transient failure                                                 | Almost never acceptable — a dropped "task claimed" or "task complete" event corrupts coordination state invisibly                                                                                            |
| **At-least-once**  | A message is delivered one or more times — retried until acknowledged | Duplicate deliveries are guaranteed to happen eventually                                     | The default for agent task queues and event buses — but only safe if every handler is idempotent                                                                                                             |
| **Exactly-once**   | A message is delivered precisely once, no drops, no duplicates        | Requires distributed transactions or dedup-by-ID infrastructure most agent stacks don't have | Rarely achievable end-to-end when the last hop is "an LLM decides what to do with this message" — treat exactly-once semantics as a _design goal achieved via idempotency_, not a _delivery-layer guarantee_ |

**The practical takeaway:** design every agent-facing message handler to be idempotent, and treat
at-least-once + idempotent-handler as the achievable equivalent of exactly-once. Concretely, that
means:

- Every task message carries a stable **idempotency key** (task ID, not a random UUID minted per
  delivery attempt)
- An agent that receives "review PR #482" a second time (because the first ack was lost, not because
  the work was actually lost) checks whether it already produced output for that key before re-doing
  the work
- State transitions are **commutative or dedup-checked** — "mark task complete" should be safe to
  apply twice; "increment retry counter" is _not_ safe to apply twice without a dedup key, because
  now you've silently double-counted a signal you use for backoff decisions

This is the same idempotency discipline the book's message-queue chapter covers for agent task
offloading generally ([[05-message-queues|Production Infrastructure, Chapter 5]]) and that the
event-driven architecture pattern formalizes for pub/sub coordination
([[07-event-driven-pattern|Part 03 of Production Agent Systems, Chapter 7]]) — distributed
coordination is the reason that discipline exists, not an optional refinement of it.

---

## 4. Detecting and resolving agent conflicts

This is the part of the chapter that maps directly onto the GH-600 exam skill "Detect and resolve
agent conflicts, including overlapping code changes, duplicated effort, and contradictory outputs."
Isolation (§1) prevents _corruption_. It does not prevent agents from independently arriving at
incompatible, redundant, or contradictory outcomes — that needs its own detection and resolution
layer, on top of isolation, not instead of it.

### 4.1 Overlapping code changes

**What it looks like:** two agents, each on their own isolated branch (per §1), both modify the same
file — sometimes the same function — because their task boundaries weren't disjoint. Isolation
guaranteed neither agent corrupted the other's _in-flight_ work; it did not guarantee their
_finished_ work is compatible.

**Detection:** a diff/overlap check at merge time — before attempting an automatic merge, compute
the set of files (or, more precisely, the set of changed line ranges) each agent touched and
intersect them. A non-empty intersection is a flagged overlap, whether or not the eventual merge
would be textually clean.

**Resolution ladder, cheapest first:**

1. **Auto-merge** — if the overlap is a false positive (same file, disjoint line ranges, no semantic
   dependency) a standard three-way merge resolves it with no agent or human involvement
2. **Rerun with updated context** — if one agent's change logically supersedes the other (e.g. agent
   A refactored the function agent B was patching), discard B's patch and rerun agent B against A's
   already-merged result, so it edits the current file, not a stale one
3. **Escalate to a supervisor agent or human** — if the overlap is a genuine semantic conflict (both
   agents made incompatible design choices in the same function) auto-resolution risks silently
   picking the wrong one; this is exactly the aggregation-with-conflict-resolution role a supervisor
   agent plays ([[09-supervisor-architectures|Chapter 9]]), or, for high-stakes code, a human
   reviewer

The ladder matters because escalating everything to a human defeats the point of parallelizing
agents in the first place, and auto-merging everything silently ships incompatible logic.

### 4.2 Duplicated effort

**What it looks like:** two agents independently pick up and solve the _same_ subtask — not because
either one made a mistake, but because task claims weren't atomic. Agent A and agent B both poll a
shared task list, both see "investigate the null-pointer bug in `checkout.py`" as unclaimed, and
both start working before either one's claim is recorded.

**This is a classic distributed-systems race condition**, and the fix is the classic distributed-
systems fix: **make the claim atomic**. A task claim needs to be a single atomic operation —
compare-and-swap on a task's status field ("claim only if status is currently `unclaimed`"), a
row-level lock in a task table, or an equivalent primitive — not a read-then-write sequence an agent
performs across two separate steps, which is exactly wide enough for a race.

**Detection when prevention fails (or wasn't in place yet):** a periodic reconciliation pass that
groups in-flight and completed tasks by target (same file, same issue, same question) and flags
groups with more than one active or completed entry.

**Resolution:** once detected, duplicated effort resolves cheaply compared to overlapping edits —
because by definition the two agents' outputs address the _same_ thing, you can usually keep the
better one (faster, more complete, higher-confidence) and discard the other, rather than needing a
true merge. The expensive fix is architectural: tighten the claim mechanism so this doesn't recur,
because detecting duplication after the fact means you already paid for the wasted agent-run.

### 4.3 Contradictory outputs

**What it looks like:** two agents reach opposite conclusions about the same question — one research
agent says "the root cause is a connection pool exhaustion," another says "the root cause is a
downstream timeout" — and both are internally well-reasoned. Unlike §4.1/§4.2, there's no code diff
or duplicate task ID to mechanically detect; the conflict is _semantic_.

**Detection strategies:**

- **Output cross-validation** — when two agents answer overlapping questions, run a lightweight
  comparison pass (a cheaper model, or a rule-based check on structured fields) that flags
  disagreement on shared claims before either output reaches the user
- **Confidence + evidence comparison** — if both agents attach confidence scores and cited evidence
  (which any production agent answering a factual question should — see
  [[01-ai-evaluation-frameworks|Observability & Evaluation, Chapter 8]]), a contradiction with a
  large confidence gap or an evidence-quality gap is much cheaper to auto-resolve than one where
  both agents are equally confident and equally well-cited
- **Structural voting** — for the same question answered N ways (self-consistency style, see
  [[03-self-consistency|Planning & Reasoning Algorithms, Chapter 3]]), a majority-vote or consensus
  mechanism ([[06-consensus-mechanisms|Chapter 6]]) turns contradiction detection into a counting
  problem instead of a semantic one

**Resolution:** contradictory outputs are the case where "just merge it" is actively wrong — you
cannot average two incompatible root-cause hypotheses into a third, worse one. The realistic options
are: **escalate to a supervisor** that has visibility into both agents' full reasoning traces and
can weigh evidence quality directly, **rerun** one or both agents with the other's finding injected
as additional context (does agent A's hypothesis survive being shown agent B's evidence?), or
**surface both to a human** with the disagreement made explicit rather than silently picking one.
Silently picking one — e.g. "last agent to finish wins" — is the failure mode to design against; it
looks like resolution but is actually just coin-flipping dressed up as a decision.

**Summary table — the three conflict types side by side:**

| Conflict type            | Root cause                                  | Detection                                               | Cheapest resolution                       | When cheapest resolution is wrong                                                    |
| ------------------------ | ------------------------------------------- | ------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| Overlapping code changes | Task boundaries weren't disjoint            | Diff/line-range intersection at merge time              | Auto-merge (disjoint ranges)              | Semantic dependency between the two changes — needs supervisor/human                 |
| Duplicated effort        | Task claim wasn't atomic                    | Reconciliation pass grouping tasks by target            | Keep the better result, discard the other | Neither agent's output is clearly better — needs a rerun with a tiebreaker           |
| Contradictory outputs    | Genuine disagreement on a semantic question | Output cross-validation, confidence/evidence comparison | Confidence- or evidence-weighted pick     | Confidence/evidence roughly equal — needs supervisor or human, never silent tiebreak |

---

## 5. GitHub Copilot in practice

This section grounds the abstractions above in the environment GH-600 tests most directly: GitHub
Copilot's coding agents operating against a real repository. Where I'm confident in documented
platform behavior I state it as fact; where I'm generalizing from how the underlying git/GitHub
mechanics necessarily work, I flag it explicitly.

**Isolation via branches.** When Copilot's coding agent takes on an issue or task, it works on its
own branch cut from the target branch, pushes commits there, and opens a pull request from that
branch — it does not commit directly to the shared base branch mid-task. Run several Copilot coding
agents in parallel against the same repository and each one gets its own branch. This is exactly the
**branch isolation** mechanism from §1: every agent's in-flight edits live in a namespace nothing
else touches, so two agents working concurrently cannot corrupt each other's uncommitted state no
matter how their work overlaps in target files. The isolation boundary is the branch, not the
working tree of a single shared checkout.

**Merge conflicts are overlapping code changes, made visible.** Branch isolation solves the
in-flight corruption problem; it deliberately does not solve the "do these two finished branches
agree" problem — that surfaces at PR-merge time, as an ordinary git merge conflict, exactly per the
overlap-detection logic in §4.1. If agent A's PR and agent B's PR both touch the same lines of
`checkout.py`, whichever PR merges second hits a conflict that GitHub reports the same way it
reports a conflict between two human contributors. This is the mechanical, observable form of
"overlapping code changes" the exam skill names: it is not an abstract concept you have to detect
with custom tooling — the platform's own merge machinery _is_ the detector. What Copilot's agent
does with a conflict on its own PR (attempt a rebase/resolution pass, or surface the conflict for a
human) is the resolution-ladder decision from §4.1 playing out concretely: auto-resolve where the
conflict is textually trivial, escalate to the human reviewer where it is not — I'd treat the exact
threshold for "attempts auto-resolution vs. surfaces to human" as an implementation detail worth
verifying against current product docs rather than a fact to memorize, since agent platforms tune
this behavior over time.

**Duplicated effort shows up as near-identical PRs for the same issue.** If two Copilot coding agent
sessions are both pointed at the same issue — or two team members both assign the coding agent to
overlapping issues — you get two branches, two PRs, addressing the same problem, exactly the
duplicated-effort failure mode from §4.2. The governance fix is the same atomic-claim discipline
that distributed task queues use, expressed in GitHub's native primitives: **an agent (or the person
delegating to it) claims an issue by assigning it before work starts**, and team convention treats
"already assigned" as the signal that stops a second agent or teammate from independently starting
the same work. This is a process/governance control, not a platform-enforced lock — GitHub issue
assignment does not _prevent_ a second person from opening a competing PR, it just makes the
existing claim visible enough that duplicated effort becomes a discipline failure (someone ignored
the assignment) rather than an invisible race. Treat this as the practical, repo-native
implementation of the atomic task-claim principle from §4.2 — same mechanism, git vocabulary instead
of task-queue vocabulary.

**Where this leaves the exam-skill mapping:** "configure agent isolation for parallel execution" is
answered concretely by branch-per-agent (§1 + this section); "detect and resolve agent conflicts" is
answered concretely by merge-conflict-as-overlap-detector (§4.1) plus issue-assignment-as-claim-
discipline (§4.2) — with contradictory outputs (§4.3) being the one conflict type that has no native
git mechanic to lean on, because git has no concept of "these two changes are semantically opposed
but don't touch the same lines." That gap is exactly why a supervisor-agent or human-review step
still earns its place even in a fully branch-isolated, merge-conflict-detected workflow.

---

## Concept check

| Question                                                                          | Answer hint                                                                                                                                               |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Why prefer isolation over locking for parallel agents?                            | Locks held by an LLM-driven agent can stall for an unbounded, unpredictable time; partitioning state removes the need to lock at all                      |
| When should a partial batch failure fail the whole batch?                         | When downstream synthesis assumes completeness — one agent's missing output would change how the others should be interpreted                             |
| Why does at-least-once delivery require idempotent handlers?                      | At-least-once guarantees retries on failure, which guarantees eventual duplicate deliveries — the handler, not the transport, must absorb the duplication |
| What's the mechanical fix for duplicated effort?                                  | An atomic task-claim operation (compare-and-swap / assignment) instead of a read-then-write claim sequence that leaves a race window                      |
| Why can't contradictory outputs be "merged" the way overlapping code changes can? | Averaging two incompatible semantic conclusions produces a third, worse one — resolution requires weighing evidence, not blending text                    |
| In GitHub Copilot's coding agent, what makes overlapping edits visible?           | A standard git merge conflict at PR-merge time — the platform's existing merge machinery is the overlap detector, not custom tooling                      |
| What governance control prevents duplicate Copilot PRs for the same issue?        | Claiming the issue via assignment before work starts, treated as a team convention GitHub doesn't enforce automatically                                   |

---

## Metadata

|        |                          |
| ------ | ------------------------ |
| Author | Amit Singh               |
| Scope  | building-agentic-systems |
