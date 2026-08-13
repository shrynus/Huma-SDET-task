# Tic-Tac-Toe — SDET Take-Home Task

QA deliverables for the Tic-Tac-Toe application supplied with the task: a test
plan, test cases, defect reports and an automated regression suite.

**Stack:** Playwright + TypeScript.

| Folder | What is in it |
|---|---|
| [Manual/](Manual) | Test plan, test cases, bug reports, exploratory notes |
| [Automation/](Automation) | The Playwright suite, the system under test, and how to run everything |

---

## Manual

| Document | Format | What is in it |
|---|---|---|
| [TEST_PLAN.docx](Manual/TEST_PLAN.docx) | Word | Scope, risk analysis, approach, test data strategy, entry/exit criteria |
| [TEST_CASES.xlsx](Manual/TEST_CASES.xlsx) | Excel | 61 test cases with steps and expected results, plus the coverage matrix |
| [BUG_REPORTS.xlsx](Manual/BUG_REPORTS.xlsx) | Excel | 6 defects with reproduction steps, evidence and impact |
| [EXPLORATORY_NOTES.md](Manual/EXPLORATORY_NOTES.md) | Markdown | The exploratory sessions that found the defects, including what was checked and found healthy |

> The plan, cases and defects are Office documents, so GitHub offers them for
> download rather than rendering them in the browser. The exploratory notes are
> Markdown and read inline.

Both defects worth reporting were found by the manual pass first — the suite was
written afterwards to pin them down.

---

## Automation

```bash
cd Automation
npm install
npx playwright install
npm test
```

54 tests per browser on Chromium, Firefox and WebKit. The suite starts its own
static server, so nothing else needs to be running.

**Three tests fail on purpose.** They reproduce the two open defects rather than
working around them, and are tagged `@known-issue`:

| Failing test | Defect |
|---|---|
| `the computer never plays a cell the human already took` | **BUG-001** — on Hard the computer places O on a cell already holding X |
| `the board keeps a valid turn order for a whole game` | **BUG-001** — the same defect seen through the X/O count invariant |
| `only ever suggests a free cell` | **BUG-002** — *Get Hint* points at occupied cells |

`npm run test:stable` excludes them and is the green regression gate:
**153 / 153** across the three engines.

Full details — commands, architecture and design notes — in
[Automation/README.md](Automation/README.md).

---

## Layout

```
Manual/                   the manual QA deliverables
Automation/               the Playwright project
  app/index.html          the system under test, unmodified
  tests/                  specs, page objects, fixtures, domain helpers
  tools/                  dependency-free static server
.github/workflows/ci.yml  runs the regression gate on every push
INSTRUCTIONS.md           the task brief, as supplied
```
