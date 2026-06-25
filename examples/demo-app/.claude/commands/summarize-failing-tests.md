---
description: Run the test suite and summarize only the failing tests
allowed-tools: Bash(npm test:*), Bash(npx vitest:*), Read, Grep, Glob
---

Run the project's test suite and produce a concise summary of **failing tests only**.

## Steps

1. Run the tests, capturing output: `npm test` (this project uses `vitest run`).
   - If `$ARGUMENTS` is non-empty, treat it as a path/name filter: run `npx vitest run $ARGUMENTS`.
2. Parse the results. Ignore passing tests entirely.
3. If a test fails intermittently or the run reports retries, flag it as **possibly flaky**.
4. For each failing test, gather:
   - **Test name** and its file (`path:line` when available)
   - **Expected vs. actual** (the core assertion diff)
   - **Likely cause** — one line, based on the error and the relevant source (Read/Grep the file if needed)

## Output format

If everything passes, say exactly one line: `✅ All <n> tests passed.` and stop.

Otherwise group failures **by file**:

```
## Failing tests (<failed>/<total>)
_Command: <the exact command run>_

### <test file>
- **<test name>** (`:line`)
  - Expected: <...>
  - Actual: <...>
  - Likely cause: <...>  [possibly flaky]

## Summary
- <common theme across failures, if any>
- Suggested next step: <one action>
```

Keep it tight — no passing-test noise, no full stack traces unless a trace is the key evidence.
