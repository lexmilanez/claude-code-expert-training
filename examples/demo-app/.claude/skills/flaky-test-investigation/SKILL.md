---
name: flaky-test-investigation
description: Investigate a test that passes and fails non-deterministically. Use when a test is intermittent, "flaky", passes locally but fails in CI, or fails only under load/ordering/retries. Confirms flakiness, isolates the root cause (timing, shared state, ordering, randomness, external deps), and proposes a deterministic fix.
---

# Flaky test investigation

A flaky test passes on some runs and fails on others with no code change. The goal is to find *why* it is non-deterministic and make it deterministic — not to add a retry and move on.

## Required Inputs

Before investigating, make sure you have (ask for any that are missing):
- **Failing command** — the exact command that was run.
- **Test name or file** — which test is flaky.
- **Relevant CI/local output** — the failure excerpt (assertion, stack, or error), ideally from the environment where it fails.

## Workflow

### 1. Capture exact command and failure excerpt
Record the command verbatim and the relevant failure lines (not the whole log). Note where it failed — local vs. CI — and any difference between them. This project uses **vitest** (`npx vitest run <file> -t "<test name>"`).

### 2. Classify the failure mode
Map the trigger to a flakiness class:

| Symptom | Likely cause |
|---|---|
| Fails only in a certain order | **Shared/global state** leaking between tests (module singletons, DB rows, env, the session store) |
| Fails under parallelism | **Resource contention** — shared files, ports, fixtures, in-memory stores |
| Fails intermittently regardless of order | **Timing**: races, missing `await`, `setTimeout` waits, real clocks |
| Different value each run | **Nondeterminism**: `Math.random`, `Date.now`, unstable iteration, uuid |
| Fails on slow network/CI only | **External dependency** not stubbed; real I/O, real time |

### 3. Identify dynamic evidence needed
State what would confirm the hypothesis, then gather it:
- **Repeated runs** to establish a failure rate (loop the test 20–50×; vary order with `--sequence.shuffle`, vary concurrency with `--no-file-parallelism`).
- **Logs / retries** — CI retry records, timing logs, the suspected nondeterministic value.
- **Git history** — `git log`/`git blame` on the test and code under test: did a recent change introduce shared state, remove an `await`, or add a real-time/random dependency?

### 4. Produce Explore Findings
Summarize what was found, with evidence and `path:line` references:
- Confirmed failure rate + the conditions that trigger it.
- Root-cause class and the **specific mechanism** (which state leaks, which race, which random value).
- Supporting evidence (the repeated-run counts, the offending line, the introducing commit).

### 5. Propose the next narrow action
Recommend **one** concrete next step — not a list. Prefer removing the nondeterminism over masking it:
- **State leakage** → reset in `beforeEach`/`afterEach`; fresh instances per test.
- **Timing** → `await` the real signal; `vi.useFakeTimers()`; no wall-clock assertions.
- **Randomness** → seed or inject the value; mock `Date.now`/`Math.random`/uuid.
- **External deps** → stub at the boundary.
- **Ordering** → make tests independent.

Do **not** propose `test.retry()`, longer timeouts, or `skip` as a fix unless explicitly accepted as temporary — and then leave a TODO with the reason and a tracking reference.

After any fix, re-run the loop from step 3 with the same N and conditions; report the before/after failure rate. A single green run does not prove the flake is gone.
