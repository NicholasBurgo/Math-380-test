// Independent audit of every generator in every class.
//
// For each generated problem, a per-class checker re-derives the answer FROM
// THE DISPLAYED QUESTION (text/latex/ask/options) using separate math -
// brute-force enumeration where feasible - and compares it to the generator's
// stored answer. It also parses answerLatex (the solution shown on a miss) and
// confirms it equals the checked answer, checks that typed-answer acceptors
// accept the answer and reject every wrong option, and that Choices mode gets
// a sane option set. A mismatch anywhere means the app would drill something
// wrong.
//
// Run: npm run verify

import katex from 'katex'
import { classes } from '../src/classes/index.js'
import { buildChoices } from '../src/engine/choices.js'
import { checkAnswer } from '../src/engine/check.js'
import * as math3800 from './audit/math3800.mjs'
import * as math223 from './audit/math223.mjs'

const AUDITS = { math3800, math223 }

const failures = []
const results = []

function katexOk(latex) {
  try {
    katex.renderToString(String(latex), { throwOnError: true })
    return true
  } catch {
    return false
  }
}

function latexValue(al) {
  if (typeof al !== 'string') return null
  const frac = al.match(/\\frac\{(-?[\d.]+)\}\{(-?[\d.]+)\}/)
  if (frac) return parseFloat(frac[1]) / parseFloat(frac[2])
  const eq = al.match(/= (-?[\d.]+)\s*$/)
  if (eq) return parseFloat(eq[1])
  const lone = al.match(/^(-?[\d.]+)$/)
  if (lone) return parseFloat(lone[1])
  return null
}

const same = (expected, actual) =>
  typeof expected === 'string'
    ? expected === actual
    : Number.isInteger(expected) && Number.isInteger(actual)
      ? expected === actual
      : Math.abs(expected - actual) < 1e-9

for (const cls of classes) {
  const audit = AUDITS[cls.id]
  if (!audit) {
    failures.push(`${cls.id}: NO AUDIT MODULE - class not audited`)
    continue
  }
  for (const topic of cls.units.flatMap(u => u.topics)) {
    for (const t of topic.templates) {
      const key = `${topic.id}/${t.id}`
      const label = `${cls.id}/${key}`
      const checker = audit.derive[key]
      if (!checker) {
        failures.push(`${label}: NO INDEPENDENT CHECKER - not audited`)
        continue
      }
      const n = audit.SAMPLES?.[key] ?? 2000
      let bad = 0
      const fail = msg => {
        bad++
        if (bad <= 3) failures.push(`${label}: ${msg}`)
      }
      for (let i = 0; i < n; i++) {
        const p = t.generate()
        const where = () => `:: ${p.text ?? ''} :: ${p.latex}`
        let expected
        try {
          expected = checker(p)
        } catch (e) {
          fail(`checker error "${e.message}" ${where()}`)
          continue
        }
        if (!same(expected, p.answer)) {
          fail(`expected ${JSON.stringify(expected)}, generator says ${JSON.stringify(p.answer)} ${where()}`)
        }
        // answerLatex (the solution shown on a miss) must equal the answer
        const shown = latexValue(p.answerLatex)
        if (shown !== null && typeof p.answer === 'number') {
          const tol = Math.max(1e-6, Math.abs(p.answer) * 1e-3)
          if (Math.abs(shown - p.answer) > tol) fail(`answerLatex shows ${shown} but answer is ${p.answer}`)
        }
        // every template must teach on a miss
        if (!p.hint || !p.hint.text) fail('missing hint')
        else if (p.hint.latex && !katexOk(p.hint.latex)) fail('hint latex does not parse')
        if (!katexOk(p.latex) || (p.answerLatex && !katexOk(p.answerLatex))) fail('problem/answer latex does not parse')
        for (const o of p.options ?? []) if (typeof o !== 'string' && !katexOk(o.latex)) fail(`option latex does not parse: ${o.latex}`)
        // typed mode: the stored answer must pass its own check, wrong options must not
        const typedAnswer = typeof p.answer === 'string' ? p.answer : String(p.answer)
        if (!checkAnswer(typedAnswer, p)) fail(`typed answer "${typedAnswer}" is rejected by its own checker`)
        if (p.accept) {
          for (const c of p.choices ?? []) if (p.accept(c)) fail(`wrong choice "${c}" is accepted by the typed checker`)
          for (const d of p.distractors ?? []) if (p.accept(String(d))) fail(`distractor ${d} is accepted by the typed checker`)
        }
        if (p.options) {
          const idx = 'abcdefgh'.indexOf(p.answer)
          if (idx < 0 || idx >= p.options.length) fail(`answer letter ${p.answer} outside options`)
          const keys = p.options.map(o => (typeof o === 'string' ? o : o.latex))
          if (new Set(keys).size !== keys.length) fail(`duplicate options ${JSON.stringify(keys)}`)
          if (p.options.length < 2) fail('fewer than two options')
        }
        // multiple-choice options: right count, unique labels, exactly one correct
        const ch = buildChoices(p)
        let wantCount = 4
        if (typeof p.answer === 'string') {
          if (p.options) wantCount = p.options.length
          else if (p.choices) wantCount = 1 + Math.min(3, new Set(p.choices.filter(c => c !== p.answer)).size)
          else wantCount = 2
        }
        const labels = new Set(ch.map(c => c.label))
        if (ch.length !== wantCount || labels.size !== wantCount || ch.filter(c => c.correct).length !== 1) {
          fail(`bad choice set ${JSON.stringify(ch.map(c => c.label))}`)
        }
        if (wantCount < 2) fail('choice mode would have a single option')
      }
      results.push({ key: label, samples: n, mismatches: bad })
    }
  }

  // learn blocks: every topic teaches, and its formulas parse
  for (const topic of cls.units.flatMap(u => u.topics)) {
    if (!topic.learn?.formulas?.length || !topic.learn?.how?.length) {
      failures.push(`${cls.id}/${topic.id}: missing learn block (formulas + how)`)
      continue
    }
    for (const f of topic.learn.formulas) {
      if (!f.label || !katexOk(f.latex)) failures.push(`${cls.id}/${topic.id}: bad learn formula "${f.label}"`)
    }
  }
}

for (const r of results) {
  console.log(`${r.mismatches === 0 ? 'PASS' : 'FAIL'}  ${r.key}  (${r.samples} samples, ${r.mismatches} mismatches)`)
}
if (failures.length) {
  console.log('\nFailures:')
  for (const f of failures) console.log('  - ' + f)
  process.exit(1)
}
console.log(`\nAll ${results.length} templates verified against independent re-derivation.`)
