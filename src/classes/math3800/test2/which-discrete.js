import { choice, randInt, shuffle } from '../../../engine/rand.js'
import { dec, lettered, someP } from './util.js'

// Label the scenario: binomial, negative binomial, geometric, hypergeometric or
// Poisson (the notes' summary on p. 12). Every story states the cue that
// decides it, so a careful student can defend the label.

const BIN = 'binomial'
const NEG = 'negative binomial'
const GEO = 'geometric'
const HYP = 'hypergeometric'
const POI = 'Poisson'
const LABELS = [BIN, NEG, GEO, HYP, POI]

const P = () => dec(someP([0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.6, 0.65, 0.7, 0.75, 0.8]))
const ord = r => `${r}${r === 1 ? 'st' : r === 2 ? 'nd' : r === 3 ? 'rd' : 'th'}`
const WORD = { 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth' }
const FACES = ['one', 'two', 'three', 'four', 'five', 'six']
const an = n => (/^(8|1[18](?!\d))/.test(String(n)) ? 'an' : 'a')
const An = n => (an(n) === 'an' ? 'An' : 'A')

const HINTS = {
  [BIN]: {
    latex: 'f(x) = \\binom{n}{x}p^xq^{n-x}',
    text: 'A fixed number n of independent trials with the same p, and X counts the successes: binomial.',
  },
  [NEG]: {
    latex: 'f(x) = \\binom{x-1}{r-1}p^rq^{x-r}',
    text: 'The number of successes (r ≥ 2) is fixed, and X counts the trials needed to get them: negative binomial.',
  },
  [GEO]: {
    latex: 'f(x) = q^{x-1}p',
    text: 'X counts the trials up to and including the first success: geometric (the negative binomial with r = 1).',
  },
  [HYP]: {
    latex: 'f(x) = \\frac{\\binom{r}{x}\\binom{N-r}{n-x}}{\\binom{N}{n}}',
    text: 'A sample drawn without replacement from a finite group that holds r successes, and X counts the successes in it: hypergeometric.',
  },
  [POI]: {
    latex: 'f(x) = \\frac{e^{-k}k^x}{x!}, \\quad k = \\lambda s',
    text: 'Events happen at an average rate per unit of time, length or space, and X counts them in an interval: Poisson.',
  },
}

// ---------- whole scenarios ----------

const SCENARIOS = [
  // binomial: a fixed number of independent trials, X counts successes
  { label: BIN, make: () => `A basketball player makes each free throw with probability ${P()}, independently of her other shots. She takes ${randInt(8, 20)} free throws. X is the number she makes.` },
  { label: BIN, make: () => `A quiz has ${randInt(10, 25)} multiple-choice questions with ${choice([4, 5])} choices each, and a student guesses on every one. X is the number of questions the student gets right.` },
  { label: BIN, make: () => `Each chip from an assembly line is defective with probability ${P()}, independently of the others. An inspector checks the next ${randInt(10, 40)} chips. X is the number of defective chips among them.` },
  { label: BIN, make: () => `A fair die is rolled ${randInt(6, 30)} times. X is the number of rolls that show a ${choice(FACES)}.` },
  { label: BIN, make: () => `Each seed in a packet sprouts with probability ${P()}, independently. A gardener plants ${randInt(10, 30)} seeds. X is the number that sprout.` },
  { label: BIN, make: () => `A coin is flipped ${randInt(10, 50)} times. X is the number of heads.` },
  {
    label: BIN,
    make: () => `A card is drawn from a standard 52-card deck, its suit is noted, and the card is put back and the deck reshuffled. This is done ${randInt(5, 12)} times. X is the number of hearts drawn.`,
    why: 'The card goes back each time, so every draw has the same chance 13/52 and the draws are independent: binomial, not hypergeometric.',
  },
  {
    label: BIN,
    make: () => `A jar holds ${randInt(3, 9)} red and ${randInt(3, 9)} blue marbles. A marble is drawn, its color noted, and it is put back. This is repeated ${randInt(5, 15)} times. X is the number of red marbles drawn.`,
    why: 'With replacement every draw has the same chance of red, so this is a fixed number of independent trials: binomial.',
  },
  {
    label: BIN,
    make: () => `A help desk will handle exactly ${randInt(15, 40)} tickets today. Each ticket needs escalation with probability ${P()}, independently. X is the number of tickets escalated.`,
    why: 'The number of tickets is fixed in advance and each is an independent trial with the same p: binomial, not Poisson.',
  },

  // negative binomial: trials until the r-th success, r >= 2
  { label: NEG, make: () => `A basketball player makes each free throw with probability ${P()}, independently. She keeps shooting until she has made ${randInt(2, 5)} free throws. X is the number of shots she takes.` },
  { label: NEG, make: () => `Of the lots a factory produces, ${choice([5, 10, 15, 20, 25])}% are defective, independently of each other. Lots are produced until the ${ord(randInt(2, 5))} defective lot. X is the number of lots produced.` },
  { label: NEG, make: () => `Each well an oil company drills strikes oil with probability ${P()}, independently. X is the number of wells drilled to get the ${ord(randInt(2, 5))} strike.` },
  { label: NEG, make: () => `A telemarketer makes a sale on each call with probability ${P()}, independently. X is the number of calls needed to make ${randInt(2, 6)} sales.` },
  { label: NEG, make: () => `A fair die is rolled until the ${ord(randInt(2, 4))} ${choice(FACES)} appears. X is the number of rolls.` },
  { label: NEG, make: () => `A coin is flipped until heads has come up ${randInt(2, 6)} times. X is the number of flips.` },
  {
    label: NEG,
    make: () => {
      const r = randInt(2, 6)
      return `A researcher needs ${r} left-handed volunteers. Each person she asks is left-handed with probability ${P()}, independently. X is the number of people she must ask to find ${r}.`
    },
    why: 'The number of successes she needs is fixed and X counts the people asked (the trials): negative binomial.',
  },
  {
    label: NEG,
    make: () => `A quality engineer tests chips one at a time, and each is defective with probability ${P()}, independently. Testing stops at the ${WORD[randInt(2, 5)]} defective chip. X is the number of chips tested.`,
    why: 'Testing stops at a fixed number (r ≥ 2) of defective chips and X counts the chips tested: negative binomial.',
  },

  // geometric: trials until the first success
  { label: GEO, make: () => `A basketball player makes each free throw with probability ${P()}, independently. X is the number of shots she takes until she makes her first one.` },
  { label: GEO, make: () => `Digits are chosen at random from 0 to 9, one at a time. X is the number of digits chosen until the first ${randInt(0, 9)} appears.` },
  { label: GEO, make: () => `A salesperson makes a sale on each call with probability ${P()}, independently. X is the number of calls needed to make the first sale.` },
  { label: GEO, make: () => `A fair die is rolled until the first ${choice(FACES)} appears. X is the number of rolls.` },
  { label: GEO, make: () => `Each scratch ticket wins with probability ${P()}, independently. X is the number of tickets bought until the first winner.` },
  { label: GEO, make: () => `A machine part fails on each use with probability ${P()}, independently. X is the number of uses up to and including the first failure.` },
  {
    label: GEO,
    make: () => `An archer hits the bullseye with probability ${P()} on each arrow, independently. She shoots until she hits it once. X is the number of arrows she shoots.`,
    why: 'Shooting until one hit is shooting until the first success: geometric.',
  },
  {
    label: GEO,
    make: () => `A website shows an ad to one visitor at a time, and each visitor clicks with probability ${P()}, independently. X is the number of visitors who see the ad up to and including the first click.`,
    why: 'X counts the trials (visitors) through the first success (a click): geometric.',
  },

  // hypergeometric: a sample without replacement from a finite group
  {
    label: HYP,
    make: () => {
      const N = randInt(15, 40)
      return `A shipment of ${N} parts contains ${randInt(3, 8)} defective ones. An inspector tests ${randInt(3, 8)} of the parts, chosen at random without replacement. X is the number of defective parts tested.`
    },
  },
  { label: HYP, make: () => `A committee of ${randInt(3, 6)} is chosen at random from a club of ${randInt(5, 12)} women and ${randInt(5, 12)} men. X is the number of women on the committee.` },
  {
    label: HYP,
    make: () => {
      const n = randInt(4, 13)
      return `${An(n)} ${n}-card hand is dealt from a standard 52-card deck. X is the number of hearts in the hand.`
    },
  },
  { label: HYP, make: () => `A pond has ${randInt(20, 60)} fish, and ${randInt(5, 15)} of them are tagged. A biologist nets ${randInt(4, 10)} different fish. X is the number of tagged fish in the net.` },
  {
    label: HYP,
    make: () => {
      const N = choice([500, 1000, 2000])
      return `A machine fills ${N} bottles, and ${N / 10} of them are underfilled. A sample of ${choice([10, 15, 20])} bottles is chosen at random and checked. X is the number of underfilled bottles in the sample.`
    },
  },
  {
    label: HYP,
    make: () => `A jar of ${randInt(30, 60)} jelly beans has ${randInt(6, 15)} cherry ones. You grab ${randInt(4, 8)} jelly beans at once. X is the number of cherry jelly beans you grab.`,
    why: 'Grabbing a handful is a sample without replacement from a jar with a known number of cherry beans: hypergeometric.',
  },
  {
    label: HYP,
    make: () => `A lottery draws 6 different numbers from 1 to ${choice([40, 45, 49])}. Your ticket has 6 numbers. X is how many of your numbers are drawn.`,
    why: 'The 6 numbers drawn are all different: a sample without replacement from N numbers, r = 6 of which are yours.',
  },
  {
    label: HYP,
    make: () => {
      const N = randInt(20, 35)
      return `A class of ${N} students includes ${randInt(6, N - 8)} who did the reading. The professor calls on ${randInt(3, 6)} different students at random. X is the number of students called on who did the reading.`
    },
    why: 'The professor calls on different students, so nobody is picked twice: sampling without replacement, hypergeometric.',
  },

  // Poisson: events in an interval at an average rate
  {
    label: POI,
    make: () => {
      const w = choice([10, 15, 20, 30, 45])
      return `A help line gets an average of ${choice([6, 9, 12, 18, 24])} calls per hour. X is the number of calls in ${an(w)} ${w}-minute window.`
    },
  },
  {
    label: POI,
    make: () => {
      const s = choice([5, 8, 10, 12, 20])
      return `A textbook has an average of ${choice([0.1, 0.2, 0.25, 0.4])} typos per page. X is the number of typos in ${an(s)} ${s}-page chapter.`
    },
  },
  { label: POI, make: () => `The average white blood cell count is ${choice([5000, 6000, 7000])} per cubic millimeter of blood. A 0.001 cubic millimeter drop is taken. X is the number of white blood cells in the drop.` },
  { label: POI, make: () => `Radioactive gas is released at a power plant an average of ${randInt(2, 6)} times per year. X is the number of releases in the next ${choice([3, 4, 6])} months.` },
  { label: POI, make: () => `Customers arrive at a store at an average rate of ${choice([12, 20, 30, 45])} per hour. X is the number of customers who arrive in the next ${choice([5, 10, 15, 20])} minutes.` },
  {
    label: POI,
    make: () => {
      const s = choice([2, 3, 4, 8])
      return `A highway has an average of ${choice([0.5, 1.5, 2, 3])} potholes per mile. X is the number of potholes on ${an(s)} ${s}-mile stretch.`
    },
  },
  {
    label: POI,
    make: () => `A website averages ${randInt(10, 60)} purchases every hour, at random times. X is the number of purchases in a ${choice([2, 3, 4])}-hour period.`,
    why: 'There are no trials and no fixed n: purchases come at random times at an average rate, and X counts them in an interval: Poisson.',
  },
  {
    label: POI,
    make: () => {
      const s = choice([2, 3, 4, 8])
      return `Flaws in a roll of fabric are scattered at random, about ${choice([1, 2, 3])} per square meter on average. X is the number of flaws in ${an(s)} ${s}-square-meter piece.`
    },
    why: 'Flaws at an average rate per unit of area, counted over a piece of a given size: Poisson.',
  },
]

// ---------- one setting, several random variables ----------

const SETTINGS = [
  () => {
    const p = P()
    return {
      context: `A player makes each free throw with probability ${p}, independently.`,
      xs: {
        [BIN]: `the number of free throws she makes in her next ${randInt(8, 20)} attempts`,
        [NEG]: `the number of attempts she needs to make ${randInt(2, 5)} free throws`,
        [GEO]: 'the number of attempts until her first made free throw',
        [HYP]: `the number of made shots among ${randInt(4, 8)} chosen without replacement from her last ${randInt(30, 50)} shots, of which she made ${randInt(15, 25)}`,
        [POI]: `the number of free throws she attempts in a game, if she averages ${randInt(3, 9)} attempts per game`,
      },
    }
  },
  () => ({
    context: `A machine makes parts, and each part is defective with probability ${P()}, independently.`,
    xs: {
      [BIN]: `the number of defective parts among the next ${randInt(10, 40)} made`,
      [NEG]: `the number of parts made until the ${ord(randInt(2, 5))} defective one`,
      [GEO]: 'the number of parts made until the first defective one',
      [HYP]: `the number of defective parts among ${randInt(4, 8)} drawn without replacement from a bin of ${randInt(20, 40)} that holds exactly ${randInt(3, 9)} defective ones`,
      [POI]: `the number of breakdowns of the machine in an 8-hour shift, if it averages ${choice([0.25, 0.5, 0.75])} breakdowns per hour`,
    },
  }),
  () => ({
    context: `Each caller to a sales line buys with probability ${P()}, independently.`,
    xs: {
      [BIN]: `the number of buyers among the next ${randInt(10, 40)} callers`,
      [NEG]: `the number of callers until the ${ord(randInt(2, 5))} sale`,
      [GEO]: 'the number of callers until the first sale',
      [HYP]: `the number of buyers among ${randInt(4, 8)} call records drawn without replacement from yesterday's ${randInt(30, 60)} calls, ${randInt(5, 15)} of which were sales`,
      [POI]: `the number of calls in a ${choice([10, 15, 20, 30])}-minute window, if calls average ${choice([12, 20, 30])} per hour`,
    },
  }),
  () => {
    const hand = randInt(5, 8)
    return {
    context: 'A standard 52-card deck has 13 hearts.',
    xs: {
      [BIN]: `the number of hearts in ${randInt(5, 12)} draws, putting the card back and shuffling after each draw`,
      [NEG]: `the number of cards drawn, with replacement, until the ${ord(randInt(2, 4))} heart`,
      [GEO]: 'the number of cards drawn, with replacement, until the first heart',
      [HYP]: `the number of hearts in ${an(hand)} ${hand}-card hand dealt from the deck`,
    },
    }
  },
  () => ({
    context: `Each visitor to a website signs up with probability ${P()}, independently.`,
    xs: {
      [BIN]: `the number of sign-ups among the next ${randInt(20, 60)} visitors`,
      [NEG]: `the number of visitors until the ${ord(randInt(2, 5))} sign-up`,
      [GEO]: 'the number of visitors until the first sign-up',
      [HYP]: `the number of fake accounts among ${randInt(5, 10)} audited, chosen without replacement from the ${randInt(40, 80)} accounts made yesterday, ${randInt(5, 12)} of which are fake`,
      [POI]: `the number of sign-ups in a ${choice([2, 3, 4])}-hour period, if sign-ups average ${randInt(5, 20)} per hour`,
    },
  }),
  () => ({
    context: `Each seed of a certain kind sprouts with probability ${P()}, independently.`,
    xs: {
      [BIN]: `the number that sprout when ${randInt(10, 30)} seeds are planted`,
      [NEG]: `the number of seeds planted until the ${ord(randInt(2, 5))} one sprouts`,
      [GEO]: 'the number of seeds planted until the first one sprouts',
      [HYP]: `the number of sprouted seedlings among ${randInt(4, 8)} picked without replacement from a tray of ${randInt(20, 40)}, ${randInt(8, 15)} of which sprouted`,
      [POI]: `the number of weeds in a ${choice([2, 3, 4])}-square-meter bed, if weeds average ${randInt(2, 9)} per square meter`,
    },
  }),
]

// The other labels to offer. A geometric X is also a negative binomial with
// r = 1, so "negative binomial" is never offered as wrong for a geometric X.
const wrongFor = right => shuffle(LABELS.filter(l => l !== right && !(right === GEO && l === NEG)))

// ---------- label with parameters, and the possible values ----------

const pfrac = (a, b) => `${a}/${b}`
// A hypergeometric sample's population and its possible values: at least the
// successes forced once the failures run out, at most min(n, r).
const hyper = (N, r, n) => ({ N, r, n, support: [Math.max(0, n - (N - r)), Math.min(n, r)] })
const PARAMS = [
  () => {
    const p = P()
    const n = randInt(8, 30)
    return {
      label: BIN,
      text: `Each chip from an assembly line is defective with probability ${p}, independently of the others. An inspector checks the next ${n} chips. X is the number of defective chips among them.`,
      right: `${BIN}: n = ${n}, p = ${p}`,
      wrong: [`${BIN}: n = ${n}, p = ${dec(1 - p)}`, `${NEG}: r = ${n}, p = ${p}`, `${POI}: k = ${dec(n * p)}`],
      support: [0, n],
    }
  },
  () => {
    const p = P()
    const n = randInt(8, 20)
    return {
      label: BIN,
      text: `A basketball player makes each free throw with probability ${p}, independently of her other shots. She takes ${n} free throws. X is the number she makes.`,
      right: `${BIN}: n = ${n}, p = ${p}`,
      wrong: [`${BIN}: n = ${n}, p = ${dec(1 - p)}`, `${NEG}: r = ${n}, p = ${p}`, `${GEO}: p = ${p}`],
      support: [0, n],
    }
  },
  () => {
    const R = randInt(3, 9)
    let B = randInt(3, 9)
    while (B === R) B = randInt(3, 9)
    const n = randInt(5, 15)
    return {
      label: BIN,
      text: `A jar holds ${R} red and ${B} blue marbles. A marble is drawn, its color noted, and it is put back. This is repeated ${n} times. X is the number of red marbles drawn.`,
      right: `${BIN}: n = ${n}, p = ${pfrac(R, R + B)}`,
      wrong: [`${HYP}: N = ${R + B}, r = ${R}, n = ${n}`, `${BIN}: n = ${n}, p = ${pfrac(B, R + B)}`, `${BIN}: n = ${R + B}, p = ${pfrac(R, R + B)}`],
      why: 'The marble is put back, so every draw has the same chance of red: binomial, not hypergeometric.',
      support: [0, n],
    }
  },
  () => {
    const p = P()
    const r = randInt(2, 5)
    return {
      label: NEG,
      text: `Each well an oil company drills strikes oil with probability ${p}, independently. X is the number of wells drilled to get the ${ord(r)} strike.`,
      right: `${NEG}: r = ${r}, p = ${p}`,
      wrong: [`${BIN}: n = ${r}, p = ${p}`, `${GEO}: p = ${p}`, `${NEG}: r = ${r}, p = ${dec(1 - p)}`],
      support: [r, Infinity],
    }
  },
  () => {
    const pct = choice([5, 10, 15, 20, 25])
    const r = randInt(2, 5)
    return {
      label: NEG,
      text: `Of the lots a factory produces, ${pct}% are defective, independently of each other. Lots are produced until the ${ord(r)} defective lot. X is the number of lots produced.`,
      right: `${NEG}: r = ${r}, p = ${dec(pct / 100)}`,
      wrong: [`${BIN}: n = ${r}, p = ${dec(pct / 100)}`, `${NEG}: r = ${r}, p = ${dec(1 - pct / 100)}`, `${GEO}: p = ${dec(pct / 100)}`],
      support: [r, Infinity],
    }
  },
  () => {
    const N = randInt(15, 40)
    const r = randInt(3, 8)
    const n = randInt(3, 8)
    return {
      label: HYP,
      text: `A shipment of ${N} parts contains ${r} defective ones. An inspector tests ${n} of the parts, chosen at random without replacement. X is the number of defective parts tested.`,
      right: `${HYP}: N = ${N}, r = ${r}, n = ${n}`,
      wrong: [`${BIN}: n = ${n}, p = ${pfrac(r, N)}`, `${HYP}: N = ${N}, r = ${N - r}, n = ${n}`, `${HYP}: N = ${N - r}, r = ${r}, n = ${n}`],
      ...hyper(N, r, n),
    }
  },
  () => {
    const W = randInt(5, 12)
    let M = randInt(5, 12)
    while (M === W) M = randInt(5, 12)
    const n = randInt(3, 6)
    return {
      label: HYP,
      text: `A committee of ${n} is chosen at random from a club of ${W} women and ${M} men. X is the number of women on the committee.`,
      right: `${HYP}: N = ${W + M}, r = ${W}, n = ${n}`,
      wrong: [`${HYP}: N = ${W + M}, r = ${M}, n = ${n}`, `${HYP}: N = ${M}, r = ${W}, n = ${n}`, `${BIN}: n = ${n}, p = ${pfrac(W, W + M)}`],
      ...hyper(W + M, W, n),
    }
  },
  () => {
    const N = choice([500, 1000, 2000])
    const r = N / 10
    const n = choice([10, 15, 20])
    return {
      label: HYP,
      text: `A machine fills ${N} bottles, and ${r} of them are underfilled. A sample of ${n} bottles is chosen at random and checked. X is the number of underfilled bottles in the sample.`,
      right: `${HYP}: N = ${N}, r = ${r}, n = ${n}`,
      wrong: [`${BIN}: n = ${n}, p = ${pfrac(r, N)}`, `${HYP}: N = ${N}, r = ${N - r}, n = ${n}`, `${POI}: k = ${dec((n * r) / N)}`],
      why: 'The sample is checked without putting bottles back, so it is hypergeometric (the binomial is only an approximation here).',
      ...hyper(N, r, n),
    }
  },
  () => {
    // a sample big enough that some successes are forced, like the notes' N = 15, r = 6, n = 12
    let N
    let r
    let n
    do {
      N = randInt(12, 20)
      r = randInt(4, 8)
      n = randInt(N - r + 1, N - 2)
    } while (N - n === n)
    return {
      label: HYP,
      text: `A box of ${N} batteries holds ${r} dead ones. Then ${n} of them are taken out at random, without replacement. X is the number of dead batteries taken out.`,
      right: `${HYP}: N = ${N}, r = ${r}, n = ${n}`,
      wrong: [`${HYP}: N = ${N}, r = ${N - r}, n = ${n}`, `${BIN}: n = ${n}, p = ${pfrac(r, N)}`, `${HYP}: N = ${N}, r = ${r}, n = ${N - n}`],
      ...hyper(N, r, n),
    }
  },
  () => {
    for (;;) {
      const l = choice([6, 9, 12, 15, 18, 24, 30])
      const w = choice([10, 15, 20, 30, 40, 45])
      const k = (l * w) / 60
      if (Math.abs(k * 100 - Math.round(k * 100)) > 1e-9) continue
      return {
        label: POI,
        text: `A help line gets an average of ${l} calls per hour. X is the number of calls in ${an(w)} ${w}-minute window.`,
        right: `${POI}: k = ${dec(k)}`,
        wrong: [`${POI}: k = ${l}`, `${POI}: k = ${l * w}`, `${POI}: k = ${w}/60`],
        support: [0, Infinity],
        cap: l,
      }
    }
  },
  () => {
    const l = choice([2, 4, 5, 6, 8, 10])
    const w = choice([200, 250, 300, 400, 500, 600])
    const k = (l * w) / 1000
    return {
      label: POI,
      text: `A copper wire has an average of ${l} flaws per km. X is the number of flaws in ${an(w)} ${w} m piece of the wire.`,
      right: `${POI}: k = ${dec(k)}`,
      wrong: [`${POI}: k = ${l}`, `${POI}: k = ${l * w}`, `${POI}: k = ${dec(w / 1000)}`],
      support: [0, Infinity],
      cap: l,
    }
  },
  () => {
    const l = choice([0.1, 0.2, 0.25, 0.4, 0.5])
    const s = choice([4, 5, 6, 10, 12, 20])
    return {
      label: POI,
      text: `A textbook has an average of ${l} typos per page. X is the number of typos in ${an(s)} ${s}-page chapter.`,
      right: `${POI}: k = ${dec(l * s)}`,
      wrong: [`${POI}: k = ${l}`, `${POI}: k = ${s}`, `${BIN}: n = ${s}, p = ${l}`],
      support: [0, Infinity],
      cap: s,
    }
  },
]

// A set of whole numbers as it would be written: {0, 1, …, 12}, {3, 4, 5, 6}, {2, 3, 4, …}
function setTex([lo, hi]) {
  if (hi === Infinity) return `\\{${lo}, ${lo + 1}, ${lo + 2}, \\ldots\\}`
  if (hi - lo <= 4) return `\\{${Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).join(', ')}\\}`
  return `\\{${lo}, ${lo + 1}, \\ldots, ${hi}\\}`
}

// Wrong sets of values, the usual mix-ups first: starting at 1, no end (or an
// end) where there is none, the sample size or the successes as the only limit.
function valueSlips(s) {
  const [lo, hi] = s.support
  if (s.label === BIN) return [[1, hi], [0, Infinity], [0, hi - 1]]
  if (s.label === NEG) return [[0, Infinity], [1, Infinity], [0, lo]]
  if (s.label === POI) return [[1, Infinity], [0, s.cap], [1, s.cap]]
  return [[0, s.n], [0, s.r], [lo, s.n], [1, hi], [0, s.N], [lo + 1, hi]]
}

// Why X runs over exactly these values.
function valuesHint(s) {
  const [lo, hi] = s.support
  if (s.label === BIN) {
    return { latex: 'x = 0, 1, \\ldots, n', text: `A fixed n = ${hi} trials: X can be anything from 0 (no successes) to ${hi} (all of them).` }
  }
  if (s.label === NEG) {
    return {
      latex: 'x = r, r + 1, r + 2, \\ldots',
      text: `X counts trials. Getting ${lo} successes takes at least ${lo} trials, and there is no upper limit on how long it can take.`,
    }
  }
  if (s.label === POI) {
    return {
      latex: 'x = 0, 1, 2, \\ldots',
      text: 'X counts events in an interval: 0, 1, 2, ... with no upper limit. The rate is an average, not a cap.',
    }
  }
  return {
    latex: '\\max(0,\\, n-(N-r)) \\le x \\le \\min(n,\\, r)',
    text:
      lo > 0
        ? `N = ${s.N}, r = ${s.r}, n = ${s.n}. Only N − r = ${s.N - s.r} failures exist, so a sample of ${s.n} holds at least ${s.n} − ${s.N - s.r} = ${lo} successes; at most min(${s.n}, ${s.r}) = ${hi}.`
        : `N = ${s.N}, r = ${s.r}, n = ${s.n}. There are enough failures to fill the sample, so X can be 0; at most min(${s.n}, ${s.r}) = ${hi}.`,
  }
}

export default {
  id: 'which-discrete',
  name: 'Which distribution?',
  description: '§3.4–3.8: label the scenario (binomial, negative binomial, hypergeometric, Poisson), its parameters, and the possible values of X.',
  learn: {
    formulas: [
      { label: 'Binomial: successes in a fixed number n of independent trials', latex: 'f(x) = \\binom{n}{x}p^xq^{n-x}' },
      { label: 'Negative binomial: trials needed to reach r successes', latex: 'f(x) = \\binom{x-1}{r-1}p^rq^{x-r}' },
      { label: 'Geometric: negative binomial with r = 1, trials to the first success', latex: 'f(x) = q^{x-1}p' },
      { label: 'Hypergeometric: successes in a sample drawn without replacement', latex: 'f(x) = \\frac{\\binom{r}{x}\\binom{N-r}{n-x}}{\\binom{N}{n}}' },
      { label: 'Poisson: events in an interval, k = λs', latex: 'f(x) = \\frac{e^{-k}k^x}{x!}' },
      {
        label: 'Possible values of X',
        latex: '\\begin{gathered} \\text{binomial: } 0, \\ldots, n \\qquad \\text{negative binomial: } r, r+1, \\ldots \\\\ \\text{hypergeometric: } \\max(0, n-(N-r)), \\ldots, \\min(n, r) \\qquad \\text{Poisson: } 0, 1, 2, \\ldots \\end{gathered}',
      },
    ],
    how: [
      'Ask two questions: what does X count, and what is fixed in advance?',
      'n trials fixed, X counts successes: binomial. Drawing with replacement keeps the trials independent with the same p, so that is binomial too.',
      'Successes fixed, X counts the trials needed: negative binomial for the r-th success, geometric for the first (r = 1).',
      'A sample from a finite group, without replacement (a hand of cards, a committee, a batch inspected), X counts the successes in it: hypergeometric.',
      'An average rate per hour, per page, per mile, and X counts events in an interval: Poisson, with k = λs.',
      'Watch the words: "until" or "needed to" means trials are counted; "out of the next n" means n is fixed; "different" or "at once" means no replacement.',
      'Possible values (HW 6): binomial 0, 1, …, n; negative binomial r, r + 1, … with no end; hypergeometric from max(0, n − (N − r)) to min(n, r); Poisson 0, 1, 2, … with no end.',
    ],
  },
  templates: [
    {
      id: 'label',
      generate() {
        const s = choice(SCENARIOS)
        const pick = lettered(s.label, wrongFor(s.label))
        const h = HINTS[s.label]
        return {
          ask: 'Which distribution does X have?',
          text: s.make(),
          latex: 'X \\sim \\,?',
          ...pick,
          placeholder: 'a, b, c or d',
          hint: { latex: h.latex, text: s.why ?? h.text },
        }
      },
    },
    {
      id: 'spot',
      generate() {
        for (;;) {
          const set = choice(SETTINGS)()
          const target = choice(Object.keys(set.xs))
          // a geometric X is also negative binomial (r = 1): keep it out when asking for negative binomial
          const pool = Object.keys(set.xs).filter(l => l !== target && !(target === NEG && l === GEO))
          if (pool.length < 3) continue
          const wrong = shuffle(pool).slice(0, 3)
          const pick = lettered(set.xs[target], wrong.map(l => set.xs[l]))
          const h = HINTS[target]
          return {
            ask: `Which X is ${target}?`,
            text: set.context,
            latex: `X \\sim \\text{${target}}`,
            ...pick,
            // the options stay on screen; their long wording would not wrap inside KaTeX
            answerLatex: `\\text{(${pick.answer})}`,
            placeholder: 'a, b, c or d',
            hint: { latex: h.latex, text: h.text },
          }
        }
      },
    },
    {
      id: 'params',
      generate() {
        let s = choice(PARAMS)()
        let wrong = [...new Set(s.wrong)].filter(w => w !== s.right)
        while (wrong.length < 3) {
          s = choice(PARAMS)()
          wrong = [...new Set(s.wrong)].filter(w => w !== s.right)
        }
        const pick = lettered(s.right, shuffle(wrong))
        const h = HINTS[s.label]
        return {
          ask: 'Which distribution, with which parameters, does X have?',
          text: s.text,
          latex: 'X \\sim \\,?',
          ...pick,
          placeholder: 'a, b, c or d',
          hint: { latex: h.latex, text: s.why ?? h.text },
        }
      },
    },
    {
      id: 'values',
      generate() {
        for (;;) {
          const s = choice(PARAMS)()
          const right = setTex(s.support)
          const wrong = [...new Set(valueSlips(s).filter(([lo, hi]) => lo <= hi).map(setTex))].filter(w => w !== right)
          if (wrong.length < 3) continue
          return {
            ask: 'What are the possible values of X?',
            text: s.text,
            latex: 'X \\in \\,?',
            ...lettered({ latex: right }, shuffle(wrong.slice(0, 3)).map(latex => ({ latex }))),
            placeholder: 'a, b, c or d',
            hint: valuesHint(s),
          }
        }
      },
    },
  ],
}
