# Tic-Tac-Toe — SDET Take-Home Task

Test plan, test cases, defect reports and an automated regression suite for the
Tic-Tac-Toe application supplied with the task.

**Stack:** Playwright + TypeScript.

The submission has two halves. The manual QA deliverables live in
[`../Manual/`](../Manual); this folder holds the automated suite. Both defects
worth reporting were found by the manual pass first — the suite was written
afterwards to pin them down.

---

## Documentation — `../Manual/`

| Document | Format | What is in it |
|---|---|---|
| [TEST_PLAN.docx](../Manual/TEST_PLAN.docx) | Word | Scope, risk analysis, approach, test data strategy, entry/exit criteria |
| [TEST_CASES.xlsx](../Manual/TEST_CASES.xlsx) | Excel | 61 test cases with steps and expected results, plus the coverage matrix |
| [BUG_REPORTS.xlsx](../Manual/BUG_REPORTS.xlsx) | Excel | 6 defects with reproduction steps, evidence and impact |
| [EXPLORATORY_NOTES.md](../Manual/EXPLORATORY_NOTES.md) | Markdown | The exploratory sessions that found the defects, including what was checked and found healthy |

> The plan, cases and defects are Office documents, so GitHub offers them for
> download rather than rendering them in the browser. The exploratory notes are
> Markdown and read inline.

---

## Running

```bash
npm install
npx playwright install
npm test
```

`npm test` starts the bundled static server automatically — nothing else needs
to be running. The report opens with `npm run report`.

| Command | What it runs |
|---|---|
| `npm test` | The whole suite on Chromium, Firefox and WebKit |
| `npm run test:stable` | Everything **except** the known-issue tests — this is the green regression gate |
| `npm run test:known-issues` | Only the tests that reproduce open defects |
| `npm run test:smoke` | The shortest path through the critical flows |
| `npm run test:critical` | Every P0/P1 case |
| `npm run test:ui` | Playwright's interactive UI mode |
| `npm run typecheck` | TypeScript, no emit |
| `npm run serve` | Just the SUT on <http://127.0.0.1:4173> for manual testing |

---

## Last run

| | Chromium | Firefox | WebKit |
|---|---|---|---|
| `npm run test:stable` | 51 / 51 | 51 / 51 | 51 / 51 |
| `npm test` | 51 pass, 3 known-issue failures | same | same |

**153 passing, 9 known-issue failures across the three engines** — the three
failing tests below, one run per engine. Both defects reproduce in all three.

## Expected result: 3 tests fail, on purpose

The suite reproduces two open defects rather than working around them:

| Failing test | Defect |
|---|---|
| `the computer never plays a cell the human already took` | **BUG-001** — on Hard the computer places O on a cell already holding X |
| `the board keeps a valid turn order for a whole game` | **BUG-001** — the same defect seen through the X/O count invariant |
| `only ever suggests a free cell` | **BUG-002** — *Get Hint* points at occupied cells |

Full reproduction steps and evidence for both are in
[Manual/BUG_REPORTS.xlsx](../Manual/BUG_REPORTS.xlsx).

They are tagged `@known-issue`. A failing test is the honest way to report a
defect: skipping it would make the suite green while the product is broken.
`npm run test:stable` is the gate that must be green — everything else passes.

---

## Layout

```
../Manual/                the manual QA deliverables
  TEST_PLAN.docx          scope, risks, approach
  TEST_CASES.xlsx         61 cases and the coverage matrix
  BUG_REPORTS.xlsx        6 defects
  EXPLORATORY_NOTES.md    the exploratory sessions

app/index.html            the system under test, unmodified
tools/static-server.mjs   dependency-free static server used by Playwright
tests/
  fixtures/app.ts         page-object fixtures and the sign-in helper
  pages/                  one page object per screen, plus a dialog helper
  utils/board.ts          tic-tac-toe rules — winning lines, invariants, a reference strategy
  utils/storage.ts        typed localStorage seeding and reading
  utils/outcomes.ts       replays games until a required outcome occurs
  specs/                  the tests, one file per feature area
```

### Notes on the design

**Preconditions are seeded, not clicked.** All application state lives in
`localStorage`. `seedLoggedInUser` writes it before the app boots, so a profile
test that needs "1 win, 2 losses, 1 draw" states exactly that instead of
playing four games and hoping the opponent cooperates.

**No sleeps, and no retries.** The status pill exposes
`data-status="computer-thinking"`, so every move waits on that state to clear.
`retries: 0` is deliberate: a retry budget would mask exactly the kind of race
this application is most likely to regress on.

**The rules of the game live outside the page objects.** `utils/board.ts` knows
what a winning line is and what a legal board looks like; the specs assert
against it. That is what makes the integrity tests meaningful — the expected
winning line is computed independently and then compared with what the UI
highlights.

**The opponent is not deterministic on Easy and Medium.** Tests that need a
specific outcome replay games through `playUntilOutcome`, which throws with a
clear message rather than passing silently if the outcome never happens.
