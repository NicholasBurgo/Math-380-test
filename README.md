# MathReps

Notebook-style math drill app. Repetition-first: problem → answer → instant feedback → Enter → next rep. Misses re-enter the queue two reps later and keep coming back until you beat them twice in a row.

## Run

```
npm install
npm run dev
```

## How it works

- **Drill loop**: type the answer, Enter checks, Enter again advances. Or switch to **Choices** mode: four options built from common mistakes (keys 1-4 answer). Word answers (true/false, yes/no, a set, a truth-table column, a symbolic formula) get their own option sets; lettered (a)-(d) questions take the letter.
- **Scratch pad**: toggle ✎ Scratch for a finger/mouse drawing area under the problem; it clears itself each rep.
- **Hints on a miss**: every wrong answer shows the governing formula and a one-line how-to.
- **Learn mode**: every topic has a Learn page: formulas, how to attack it, and worked examples with fresh numbers.
- **Miss recycling**: a missed problem returns 2 reps later; it retires only after 2 clean hits in a row.
- **Sets**: you drill in sets of 20 reps; each set ends with a summary page (accuracy, best streak, the problems that cost you the most). Summaries are saved as dated "pages" you can see on the class screen.
- **Mastery heat**: every topic has a temperature (cold / warm / hot / mastered) driven by your current streak on it. Each unit's **Mixed set** feeds you more of whatever is cold.
- **Spaced return**: a mastered topic untouched for 3+ days gets a "review due" badge.

All stats live in `localStorage`: no server, no account.

## Structure

```
src/
  classes/          one folder per class (math3800: probability; math223: sets & logic)
  components/       Home, Drill, Learn, Options, MathText (KaTeX)
  engine/           drill queue, answer checking, stats/heat, topic picking, propositional logic
scripts/
  verify.mjs        generator audit harness (npm run verify)
  audit/            one independent re-derivation module per class
```

- A **class** = `{ id, name, term, units: [...] }`
- A **unit** = one test's material = `{ id, name, detail?, topics: [...] }`: each unit gets its own Mixed set button
- A **topic** = one skill = `{ id, name, description, learn, templates: [...] }`
  - `learn` = `{ formulas: [{ label, latex }], how: [lines] }` powers the Learn page
- A **template** = one problem generator:
  `generate() -> { latex, answer, answerLatex?, ask?, text?, placeholder?, tolerance?, size?, hint?, distractors? }`
  - `latex`: the problem, rendered with KaTeX
  - `answer`: a number (fraction input like `7/6` is accepted automatically), `'yes'`/`'no'`, `'true'`/`'false'`, or any word
  - `accept(raw)`: optional custom checker for typed input (sets in any order, `TFTT` columns, intervals, any logically equivalent formula)
  - `choices`: wrong word answers for Choices mode when the answer is a word (`distractors` is the numeric equivalent)
  - `options`: lettered (a)-(d) options shown under the problem, as text or `{ latex }`; the answer is then the letter
  - `answerLatex`: how to display the answer when missed
  - `ask` / `text`: instruction line and word-problem body above the math
  - `hint`: `{ latex, text }` shown on a miss (required; the audit enforces it)
  - `distractors`: wrong options for Choices mode, built from common mistakes (generic perturbations fill any gaps)

## Adding a class

1. Copy `src/classes/math3800/` to a new folder (e.g. `src/classes/calc1/`).
2. Turn the class notes into topics/templates: each worked example becomes a generator with constrained random numbers so answers stay clean.
3. Register the class in `src/classes/index.js`.
4. Add an audit module in `scripts/audit/<class>.mjs` with one independent checker per template; `npm run verify` refuses to pass an unaudited template.

`src/engine/logic.js` parses typed propositional formulas (`~P ^ Q`, `not P or Q`, `P => Q`, `P <=> Q`, unicode too), evaluates truth tables, and renders KaTeX; the Math 223 logic topics are built on it.

No need to copy the repo per class: classes live side by side in the app.
