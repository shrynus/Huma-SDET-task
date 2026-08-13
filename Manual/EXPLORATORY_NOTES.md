# Exploratory Test Notes

A record of the manual pass that preceded the automation. Both critical
defects in [BUG_REPORTS.xlsx](BUG_REPORTS.xlsx) were found here, not by the suite —
the suite was written afterwards to pin them down.

Negative results are included on purpose: knowing what was checked and found
healthy is as useful as the defect list.

---

## Session 1 — Charter: play the game on all three difficulties

**Approach.** Free play first, then structured play: exercise every opening
move on each difficulty, and after each move compare the board against the
board before it.

**Findings**

- On **Hard** the player's X sometimes vanished and an O appeared in its place.
  -> **BUG-001**.
- Narrowing this down took two passes, and the first conclusion was wrong.
  Inside a single browser session the opponent's opening reply looked like a
  fixed cell — nine openings, the same answer every time — so the first
  reproduction simply hard-coded that cell. It then failed to reproduce from a
  clean page load. The accurate description is that **the opponent keeps
  replaying the cell it chose in the first game of the session**, ignoring the
  current board; on a genuinely fresh load it does compute a valid move.
  The reliable recipe is therefore *probe, then contest*: play one game to
  learn which cell it wants, start a new game, and take that cell first.
  Six out of six page loads reproduced the overwrite that way.
- The same corruption occurs mid-game, not only on the opening move — an X
  already on the board turned into an O several moves in.
- The consequence is measurable without judging AI quality: the board reaches
  states impossible under the rules, e.g. 2 X against 4 O. This became the
  invariant the automated integrity spec asserts.
- Hard was lost **8 times out of 8** in the sample. Easy and Medium behave
  normally and are winnable.

**Checked and healthy**

- The reverse of BUG-001 is *not* possible: a player cannot overwrite an O.
  Occupied cells are `disabled`, and clicking one does nothing and does not
  consume a turn. The defect is one-directional — only the opponent writes over
  an occupied square.
- Rapidly clicking several cells while the computer is thinking does not queue
  moves or corrupt the board; the whole grid is disabled during that phase.
- Win detection highlights exactly the three winning cells and locks the board.
- A draw is reported on a full board with no winning line and no highlight.

---

## Session 2 — Charter: the Get Hint feature

**Approach.** Request a hint on every turn of several games and compare it
against what a correct hint would be: take the win, else block, else any free
cell.

**Findings**

- 4 of 14 hints pointed at a cell that was **already occupied**. -> **BUG-002**.
- 2 of 14 ignored an immediate threat and would have lost the game on the
  opponent's next move.

**Checked and healthy**

- The hint highlight is cleared correctly once any move is played.
- Hint is disabled while the computer is thinking and after the game ends.

---

## Session 3 — Charter: accounts, profile and history

**Findings**

- Renaming to a 200-character name is accepted and breaks the header layout;
  the input carries no `maxlength`. -> **BUG-004**.
- A stale *"Saved."* message remains on screen when the next save fails
  validation, showing success and failure together. -> **BUG-005**.

**Checked and healthy**

- Registration rejects blank and whitespace-only names, and rejects a name that
  already exists with *"This name is already taken. Try logging in."*
- Log in rejects an unknown name with *"No account with this name. Please
  register."*
- Log in trims surrounding spaces and ignores letter case: `"   sArA   "`
  signs in as `Sara`.
- Renaming preserves the full history (verified against `localStorage`: 60
  records survived a rename) and updates the session key.
- Renaming onto another account's name is refused with *"Another account
  already uses this name."*
- The profile tally always matched the history table — 12 wins / 33 losses /
  8 draws against 53 rows in one check, and 0/0/0 on a fresh account.
- Both destructive actions are guarded by a native `confirm()`; dismissing
  leaves the data untouched, accepting works. Deleting the account signs the
  user out and removes the record.
- History shows *"No games yet. Play one!"* when empty, and hides the clear
  button in that state.
- Abandoning a game — via **New Game** or **Reset** — correctly records nothing.
- A name containing HTML is escaped, not rendered: `<img src=x onerror=…>`
  appears as text and the handler never fires.

---

## Session 4 — Charter: preferences, persistence, i18n and accessibility

**Findings**

- Changing difficulty mid-game silently reverts the dropdown, with no message
  and no disabled state. -> **BUG-003**.
- The subtitle and the *Language* label stay in English under Persian. ->
  **BUG-006**.

**Checked and healthy**

- Persian switches `dir` to `rtl` and translates navigation, status, difficulty
  options, profile, history headers and result words, with Jalali dates in
  Persian digits.
- Language, theme, session and difficulty all survive a reload
  (`ttt:lang`, `ttt:theme`, `ttt:session`, and `difficulty` on the user record).
- An unfinished game is *not* restored after a reload — the board starts empty.
  Intentional as far as can be told, and now pinned by a test.
- Accessibility: the board is `role="grid"` with `role="gridcell"` buttons,
  labelled `row 1, column 1, empty` and updated to `row 1, column 1, X` after a
  move; the status pill is `role="status"` with `aria-live="polite"`; cells are
  real `<button>` elements, so keyboard play works and the tab order runs from
  the difficulty selector into the grid.

---

## Notes for whoever picks this up next

- The bundle is minified and obfuscated. Everything above is black-box; no
  conclusion here depends on reading the source, and the wording of BUG-001
  deliberately describes *behaviour* rather than claiming a root cause.
- `localStorage` is the whole backend. `ttt:users` is keyed by the lower-cased
  name, which is why the case-folding tests matter — two accounts differing
  only in case cannot coexist.
- The opponent is not deterministic on Easy and Medium, so any test needing a
  specific outcome must replay games rather than assume one. Hard, by contrast,
  is deterministic enough that BUG-001 reproduces every time.
