# Math 3800 Test 2 crash course: §3.4-3.8 and §4.1-4.4

Built from your class notes (Chapter 3 Notes part 2, Chapter 4 Notes) and the Test 2 study guide. Every example from the notes is worked out here with its numbers. Four parts: the discrete distributions, the continuous ones, the derivations written the way to write them on the test, then practice with answers at the bottom.

Notation, as in the notes: q = 1 − p. f(x) is the pdf, F(x) = P(X ≤ x) the cdf, m_X(t) the moment generating function. Poisson parameter k = λs. Hypergeometric: population N with r successes, sample of size n. z_r and χ²_r have area r to their RIGHT.

---

# Part 0. What you get on test day, and what you don't

**On the formula sheet for sure:** both geometric series (Σ ar^(k−1) = a/(1 − r) and the finite one a(1 − rⁿ)/(1 − r)), the Poisson pdf e^(−k)kˣ/x!, the normal pdf, Γ(α) = ∫₀^∞ z^(α−1)e^(−z) dz, Γ(n + 1) = n!, the gamma pdf and the exponential pdf.

**Possibly on it:** the geometric, binomial, negative binomial and hypergeometric pdfs. Do not count on them: the study guide says anything you are asked to DERIVE will not be on the sheet, and deriving those four pdfs is on the list.

**Tables:** the cumulative binomial table (n = 20), the standard normal table, the chi-squared table.

**Not on the sheet, know these cold:**
- a pdf: f(x) ≥ 0 and Σ f(x) = 1 (or ∫ f(x) dx = 1)
- F(x) = ∫ from −∞ to x of f(t) dt, and f(x) = F′(x)
- uniform on [a, b]: f(x) = 1/(b − a)
- E[H(X)] = ∫ H(x) f(x) dx, Var X = E[X²] − (E[X])²
- m_X(t) = E[e^(tX)], and E[Xᵏ] = the k-th derivative of m_X at t = 0
- geometric: F(x) = 1 − qˣ, E[X] = 1/p, Var X = q/p², m_X(t) = pe^t/(1 − qe^t)
- binomial: E[X] = np, Var X = npq, m_X(t) = (q + pe^t)ⁿ, and the binomial theorem
- Poisson: k = λs, E[X] = Var X = k; the Maclaurin series e^z = Σ zᵏ/k!
- gamma: μ = αβ, σ² = αβ², m_X(t) = (1 − βt)^(−α)
- exponential = gamma with α = 1: μ = β, σ² = β². First event of a Poisson process with rate λ: β = 1/λ
- chi-squared = gamma with α = γ/2, β = 2: μ = γ, σ² = 2γ
- normal: Z = (X − μ)/σ, m_X(t) = e^(μt + σ²t²/2)

In the app, a Test 2 drill has a "Formula sheet" button (the given and possibly given formulas) and a "Tables" button (the three tables, with the same rounding as the printed ones). Practice with them open, the way the test will be. The study guide checklist on the home screen opens the same sheet with the "know these cold" list as tap-to-check flashcards.

---

# Part 1. Discrete distributions (§3.4-3.8)

## 1.1 Geometric (§3.4)

**Setup.** Independent trials, each a success with the same probability p. X = the number of trials needed to get the FIRST success. Values: x = 1, 2, 3, ...

**pdf.** f(x) = q^(x−1) p. (x − 1 failures, then the success.)

**cdf.** F(x) = 1 − qˣ. Equivalently P(X > x) = qˣ: "more than x trials" means the first x all failed. Quick versions:
- P(X ≤ x) = 1 − qˣ
- P(X > x) = qˣ
- P(X ≥ x) = q^(x−1)
- P(X < x) = 1 − q^(x−1)
- P(a ≤ X ≤ b) = q^(a−1) − q^b

**Mean and variance.** E[X] = 1/p, Var X = q/p².

**Notes example: choosing digits until the first zero.** p = 1/10, so E[X] = 1/p = **10 trials**.

**Notes example: describe the distribution with m_X(t) = 0.4e^t/(1 − 0.6e^t).** It matches pe^t/(1 − qe^t) with p = 0.4, q = 0.6. An MGF pins down the distribution, so X is **geometric with p = 0.4** (mean 2.5, variance 0.6/0.16 = 3.75).

## 1.2 Moment generating functions (§3.4, used all through Chapter 4)

m_X(t) = E[e^(tX)], when that is finite for t in some interval around 0.

**The rule:** E[Xᵏ] = (k-th derivative of m_X)(0). So
- E[X] = m′(0)
- E[X²] = m″(0)
- Var X = m″(0) − (m′(0))²

Two traps: m″(0) is E[X²], NOT the variance. And (m′(0))² is (E[X])², not E[X²].

**Notes example: mean and variance of the geometric from its MGF.** m(t) = pe^t(1 − qe^t)^(−1).
- m′(t) = pe^t/(1 − qe^t)² (quotient rule: the numerator simplifies to pe^t). m′(0) = p/p² = **1/p**.
- m″(t) = pe^t(1 + qe^t)/(1 − qe^t)³. m″(0) = p(1 + q)/p³ = (1 + q)/p².
- Var X = (1 + q)/p² − 1/p² = **q/p²**.

**Uniqueness.** If an MGF matches a known one, X has that distribution. (1 − 2t)^(−3) is gamma with α = 3, β = 2, which is also chi-squared with γ = 6.

## 1.3 Binomial (§3.5)

**Setup.** A FIXED number n of independent trials, success probability p each time. X = the number of successes. Values 0, 1, ..., n.

**pdf.** f(x) = C(n, x) pˣ q^(n−x).

**Binomial theorem.** (a + b)ⁿ = Σ C(n, k) aᵏ b^(n−k). Notes example: (x + 1)⁴ = x⁴ + 4x³ + 6x² + 4x + 1 (coefficients C(4,k) = 1, 4, 6, 4, 1).

**Notes example: a 0.9 chance of identifying a signal; exactly 7 of the next 10.**
P(X = 7) = C(10, 7)(0.9)⁷(0.1)³ = 120 × 0.4783 × 0.001 = **0.0574**.

**MGF, mean, variance.** m_X(t) = (q + pe^t)ⁿ, so m′(0) = np and Var X = npq. For the signals: m_X(t) = (0.1 + 0.9e^t)¹⁰, E[X] = **9**, Var X = 10(0.9)(0.1) = **0.9**.

**The table.** It lists F(x) = P(X ≤ x) for n = 20: row x, column p. Everything else is built from those entries. Notes example, n = 20, p = 0.4:
- P(X ≤ 8) = F(8) = **0.5956**
- P(X < 8) = P(X ≤ 7) = F(7) = **0.4159**
- P(X ≥ 8) = 1 − P(X ≤ 7) = 1 − 0.4159 = **0.5841**
- P(X > 8) = 1 − F(8) = 1 − 0.5956 = **0.4044**
- P(X = 8) = F(8) − F(7) = 0.5956 − 0.4159 = **0.1797**

The whole skill is turning < and ≥ into ≤: "fewer than 8" stops at 7, "at least 8" is 1 minus "at most 7". Between a and b inclusive is F(b) − F(a − 1).

## 1.4 Negative binomial (§3.6)

**Setup.** Independent trials, success probability p, keep going until EXACTLY r successes. X = the number of trials needed. Values r, r + 1, r + 2, ...

**pdf.** f(x) = C(x − 1, r − 1) p^r q^(x−r).

**Notes example: 10% of lots are defective; the probability that 20 lots are produced to get the third defective.**
r = 3, p = 0.1, x = 20: C(19, 2)(0.1)³(0.9)¹⁷ = 171 × 0.001 × 0.1668 = **0.0285**.

Geometric is the case r = 1. X can never be less than r.

## 1.5 Hypergeometric (§3.7)

**Setup.** A sample of size n drawn WITHOUT replacement from a population of N, of which r are successes. X = the number of successes in the sample.

**pdf.** f(x) = C(r, x) C(N − r, n − x) / C(N, n).

**Possible values.** x runs from max(0, n − (N − r)) to min(n, r). You cannot draw more successes than there are (r), or more than the sample (n), and you are forced to take some successes when the failures run out (n − (N − r)).

**Notes example: N = 15, r = 6, n = 12.** There are only 9 failures, so at least 12 − 9 = 3 successes are forced, and at most 6 exist: X ∈ {3, 4, 5, 6}.
P(X = 4) = C(6, 4) C(9, 8) / C(15, 12) = 15 × 9 / 455 = **0.2967**.

**Notes example: 1000 bottles, 100 underfilled, check 20; P(at least 3 underfilled).**
Use the complement: P(X ≥ 3) = 1 − [f(0) + f(1) + f(2)] with N = 1000, r = 100, n = 20. That works out to **0.3228**. (With a population this large the binomial with p = 0.1 gives almost the same, 0.3231, because removing a few bottles barely changes the proportion.)

## 1.6 Poisson (§3.8)

**Setup.** X counts events in an interval of time, length or space, happening at random at an average rate.

**pdf.** f(x) = e^(−k) kˣ / x!, x = 0, 1, 2, ..., with k = λs: λ the average per unit, s the number of units.

**Mean and variance:** both k.

**Steps from the notes:** (1) the basic unit, (2) the average per unit λ, (3) the size of the interval s, (4) k = λs, then the pdf.

**Notes example: 6000 white blood cells per mm³; a 0.001 mm³ drop; P(at most 2 cells).**
k = 6000 × 0.001 = 6.
P(X ≤ 2) = e^(−6)(1 + 6 + 6²/2) = 25e^(−6) = **0.0620**.

Unit trap: "4 calls per hour" and a 30-minute window gives k = 4 × 0.5 = 2, not 4 × 30.

## 1.7 Which distribution? (the summary on p. 12)

- **Binomial:** number of successes in a FIXED number of independent trials.
- **Negative binomial:** number of TRIALS needed to reach r successes.
- **Geometric:** negative binomial with r = 1 (trials to the first success).
- **Hypergeometric:** number of successes in a sample WITHOUT replacement.
- **Poisson:** number of events in an INTERVAL (time, length, area, volume).

Decision questions, in order: Is the number of trials fixed? If yes, is the sampling without replacement from a small population (hypergeometric) or are the trials independent with the same p (binomial)? If no, are you counting events in an interval (Poisson) or counting trials until a success (geometric for the first, negative binomial for the r-th)?

Sampling WITH replacement is binomial, even though it "looks like" a sample.

---

# Part 2. Continuous distributions (§4.1-4.4)

## 2.1 Densities (§4.1)

f is a pdf when (1) f(x) ≥ 0 for every x, and (2) ∫ f(x) dx over everything = 1. Then P(a ≤ X ≤ b) = ∫ₐᵇ f(x) dx.

A single point has probability 0, so P(a ≤ X ≤ b) = P(a < X < b) = P(a ≤ X < b) = P(a < X ≤ b).

**Notes example: lead concentration f(x) = 12.5x − 1.25 for 0.1 ≤ x ≤ 0.5.**
- f ≥ 0: on [0.1, 0.5], 12.5x ≥ 1.25, so f(x) ≥ 0. ✓
- ∫ from 0.1 to 0.5 of (12.5x − 1.25) dx = [6.25x² − 1.25x] from 0.1 to 0.5 = (1.5625 − 0.625) − (0.0625 − 0.125) = 0.9375 + 0.0625 = 1. ✓
- P(0.2 < X < 0.3) = [6.25x² − 1.25x] from 0.2 to 0.3 = (0.5625 − 0.375) − (0.25 − 0.25) = **0.1875**.

**Finding the constant.** Set the total integral equal to 1 and solve. Example: f(x) = c(4 − x²) on [0, 2]: c(8 − 8/3) = c(16/3) = 1, so c = 3/16.

## 2.2 The cdf, and back (§4.1)

F(x) = ∫ from −∞ to x of f(t) dt. Write all three pieces: 0 before the range, the integral inside it, 1 after it.

**Notes example: the lead concentration cdf.** For 0.1 ≤ x ≤ 0.5:
F(x) = ∫ from 0.1 to x of (12.5t − 1.25) dt = 6.25x² − 1.25x − (0.0625 − 0.125) = **6.25x² − 1.25x + 0.0625**.
So F(x) = 0 for x < 0.1, 6.25x² − 1.25x + 0.0625 for 0.1 ≤ x ≤ 0.5, and 1 for x > 0.5. Check: F(0.5) = 1.5625 − 0.625 + 0.0625 = 1. ✓

**Notes example: the pdf from that cdf.** Differentiate each piece: f(x) = 12.5x − 1.25 on [0.1, 0.5], 0 elsewhere.

Trap: the lower limit matters. F(x) = 6.25x² − 1.25x without the + 0.0625 does not start at 0.

## 2.3 Uniform (§4.1)

Every value in [a, b] is equally likely, so f(x) = c, a constant. Total area: c(b − a) = 1, so **c = 1/(b − a)**. Probabilities are lengths: P(c < X < d) = (d − c)/(b − a) for [c, d] inside [a, b].

**Check your notes on this one.** The example reads "Show that f(x) = 5 for 1 ≤ x ≤ 6 is a pdf". As printed it is not: its area is 5 × 5 = 25. The constant that works on [1, 6] is 1/5 (almost certainly what was meant). With f(x) = 1/5: P(2 < X < 4) = 2/5 = **0.4**.

## 2.4 Expectation, variance and continuous MGFs (§4.2)

E[H(X)] = ∫ H(x) f(x) dx. In particular μ = E[X] = ∫ x f(x) dx, and Var X = E[X²] − μ².

**Notes example: mean lead concentration.**
E[X] = ∫ from 0.1 to 0.5 of x(12.5x − 1.25) dx = [12.5x³/3 − 0.625x²] from 0.1 to 0.5 = 11/30 ≈ **0.3667**.

**Notes example: variance of the lead concentration.**
E[X²] = ∫ x²(12.5x − 1.25) dx = [3.125x⁴ − 1.25x³/3] from 0.1 to 0.5 = 43/300 ≈ 0.14333.
Var X = 43/300 − (11/30)² = 8/900 ≈ **0.00889**.

**Notes example: f(x) = e^(−x) for x > 0.**
E[X] = ∫₀^∞ x e^(−x) dx = Γ(2) = **1**.
Its MGF: m_X(t) = ∫₀^∞ e^(tx) e^(−x) dx = ∫₀^∞ e^(−(1−t)x) dx = **1/(1 − t)**, for t < 1 (the integral only converges when 1 − t > 0).
Then m′(t) = 1/(1 − t)², m″(t) = 2/(1 − t)³: E[X] = 1, E[X²] = 2, Var X = 2 − 1 = **1**.

**Notes example: the Cauchy density f(x) = 1/(π(1 + x²)).** ∫ |x|/(π(1 + x²)) dx = ∞ (the antiderivative is a logarithm that grows without bound), so **the mean does not exist**. A density can be perfectly valid and still have no mean.

## 2.5 The gamma function and the gamma distribution (§4.3)

Γ(α) = ∫₀^∞ z^(α−1) e^(−z) dz. Γ(1) = 1, Γ(α + 1) = αΓ(α), Γ(n + 1) = n!.

**Notes example: ∫₀^∞ z³ e^(−z) dz.** That is Γ(4) = 3! = **6**.

**Notes example: ∫₀^∞ A x² e^(−x/3) dx, and the A that makes a pdf.**
Substitute z = x/3 (x = 3z, dx = 3 dz): ∫₀^∞ x² e^(−x/3) dx = 3³ Γ(3) = 27 × 2 = 54. So the integral is 54A, and A = **1/54**.
General shortcut: ∫₀^∞ x^(α−1) e^(−x/β) dx = Γ(α) β^α.

**Gamma pdf (on the sheet):** f(x) = x^(α−1)e^(−x/β) / (Γ(α)β^α), x > 0.

**Gamma MGF (notes example).** m(t) = ∫₀^∞ e^(tx) x^(α−1) e^(−x/β) dx / (Γ(α)β^α). Combine the exponentials: e^(−x(1/β − t)) = e^(−x(1 − βt)/β). That is the same integral with β replaced by β/(1 − βt), so it equals Γ(α)(β/(1 − βt))^α. Dividing: m_X(t) = **(1 − βt)^(−α)**, for t < 1/β.

**Mean and variance from it.** m′(t) = αβ(1 − βt)^(−α−1), so μ = **αβ**. m″(0) = α(α + 1)β², so σ² = α(α + 1)β² − α²β² = **αβ²**.

## 2.6 Exponential and the first event (§4.3)

Exponential = gamma with α = 1: f(x) = (1/β)e^(−x/β), x > 0. Mean β, variance β², cdf F(x) = 1 − e^(−x/β).

**Theorem (notes p. 8).** In a Poisson process with rate λ, the time W of the first event is exponential with β = 1/λ.
Proof: P(W > w) = P(no events in [0, w]) = Poisson with k = λw at x = 0 = e^(−λw). So F(w) = 1 − e^(−λw), and differentiating gives f(w) = λe^(−λw) = (1/β)e^(−w/β) with β = 1/λ.

**Notes example: 1 killer particle every 5 hours on average; P(wait at most 4 hours).**
β = 5 hours (λ = 1/5 per hour). P(W ≤ 4) = 1 − e^(−4/5) = 1 − e^(−0.8) = **0.5507**.

Unit trap: "6 per hour" and a 15-minute wait gives λw = 6 × 0.25 = 1.5.

## 2.7 Chi-squared and its table (§4.3)

Chi-squared with γ degrees of freedom = gamma with β = 2, α = γ/2. Mean γ, variance 2γ.

**Reading the table.** Rows: γ. Columns: the area to the LEFT. χ²_r has area r to the RIGHT, so it is in the column for 1 − r.

**Notes example, γ = 14:**
- χ²_0.005 (area 0.005 on the right): column 0.995, **31.3**.
- χ²_0.995 (area 0.995 on the right): column 0.005, **4.07**.

**Heads up on the rest of that example.** The notes then ask P(χ² > 19.8), P(χ² < 9.3) and P(4.11 < χ² < 27.7) "for γ = 14", but 19.8, 9.30, 4.11 and 27.7 are entries on the **γ = 13** row (columns 0.90, 0.25, 0.01, 0.99). Read on that row:
- P(χ² > 19.8) = 1 − 0.90 = **0.10**
- P(χ² < 9.3) = **0.25**
- P(4.11 < χ² < 27.7) = 0.99 − 0.01 = **0.98**

On the γ = 14 row those values fall between columns, so if your instructor really meant 14, you would only be able to bracket the answers. Ask, or use the row where the numbers actually appear.

## 2.8 Normal (§4.4)

f(x) = (1/(√(2π)σ)) e^(−(x−μ)²/2σ²) (on the sheet). μ is the mean, σ the standard deviation. MGF e^(μt + σ²t²/2).

**Notes example: show the mean is μ and the variance is σ² (from the MGF).**
m′(t) = (μ + σ²t)m(t), so m′(0) = μ. m″(t) = σ²m(t) + (μ + σ²t)²m(t), so m″(0) = σ² + μ², and Var X = σ² + μ² − μ² = σ².

**Standardizing.** Z = (X − μ)/σ is standard normal (mean 0, sd 1). The table gives P(Z < z) for z to two decimals: row = ones and tenths, column = hundredths.

**Notes examples, standard normal table:**
- P(Z < 1.42) = **0.9222**
- P(Z > 0.51) = 1 − 0.6950 = **0.3050**
- P(Z < −0.51) = **0.3050** (symmetry: the same as the right tail above +0.51)
- P(−0.13 < Z < 2.4) = 0.9918 − 0.4483 = **0.5435**
- P(Z < 3.99) ≈ **1.0000** (the table runs out; the true value is 0.99997)

**Backwards: z from an area.** Find the area in the BODY of the table, read off z.
- P(Z < z₀) = 0.2413: **z₀ = −0.70**.
- P(Z > z₀) = 0.1382: the left area is 0.8618, so **z₀ = 1.09**.
- P(−z₀ < Z < z₀) = 0.9000: each tail is 0.05, so the left area at z₀ is 0.95, between 0.9495 (1.64) and 0.9505 (1.65): **z₀ = 1.645**.
- P(−1.28 < Z < z₀) = 0.74: P(Z < z₀) = 0.74 + P(Z < −1.28) = 0.74 + 0.1003 = 0.8403. The closest entry is 0.8413 at **z₀ = 1.00** (0.99 gives 0.8389).

**Notes example: hydrocarbons, μ = 1 g, σ = 0.25 g; P(between 0.9 and 1.54).**
z = (0.9 − 1)/0.25 = −0.40 and z = (1.54 − 1)/0.25 = 2.16.
P = Φ(2.16) − Φ(−0.40) = 0.9846 − 0.3446 = **0.6400**.
(Why only "approximately" normal: a normal can take negative values, and grams of hydrocarbons cannot.)

**Notes example: radiation, μ = 500, σ = 150; above what dosage do only 5% survive?**
You want the x with 5% of the area to its right: z_0.05 = 1.645, so x = μ + zσ = 500 + 1.645(150) = **746.75 roentgens** (about 747).

**The chain for every word problem:** x ↔ z ↔ left area ↔ probability. Going forward: z = (x − μ)/σ (round to two decimals), table gives the left area, then turn it into what was asked (right tail = 1 − left, between = left minus left). Going backward: turn the probability into a left area, find z in the body of the table, then x = μ + zσ.

---

# Part 3. The derivations, written the way to write them

The study guide lists these. Write each as a short chain of lines, with the reason on the line where you use it. The app's "Geometric derivations" and "Deriving discrete pdfs" topics drill these line by line.

**Geometric pdf.** X = x means the first x − 1 trials are failures and trial x is a success. The trials are independent, so
f(x) = q · q ⋯ q · p (x − 1 factors of q) = q^(x−1) p, x = 1, 2, 3, ...

**Geometric pdf sums to 1.** Every f(x) ≥ 0. Σ from x = 1 to ∞ of q^(x−1)p is a geometric series with a = p, r = q, |r| < 1, so it equals a/(1 − r) = p/(1 − q) = p/p = 1.

**Geometric cdf.** F(x) = P(X ≤ x) = Σ from k = 1 to x of q^(k−1)p, a finite geometric series with a = p, r = q:
F(x) = p(1 − qˣ)/(1 − q) = p(1 − qˣ)/p = 1 − qˣ.

**Geometric MGF.**
m_X(t) = E[e^(tX)] = Σ from x = 1 to ∞ of e^(tx) q^(x−1) p
= (p/q) Σ (qe^t)ˣ (pull out what does not depend on x)
= (p/q) · qe^t/(1 − qe^t) (geometric series with a = r = qe^t, converges when qe^t < 1, i.e. t < −ln q)
= pe^t/(1 − qe^t), t < −ln q.

**Binomial pdf.** Any one particular sequence with x successes and n − x failures has probability pˣ q^(n−x) (independence). The number of such sequences is C(n, x): choose which x of the n positions are successes. The sequences are mutually exclusive, so add them up: f(x) = C(n, x) pˣ q^(n−x), x = 0, 1, ..., n.

**Binomial pdf sums to 1.** Every term is ≥ 0, and by the binomial theorem Σ C(n, x) pˣ q^(n−x) = (p + q)ⁿ = 1ⁿ = 1.

**Negative binomial pdf.** X = x means trial x is the r-th success. So the first x − 1 trials contain exactly r − 1 successes, which is a binomial probability C(x − 1, r − 1) p^(r−1) q^(x−r), and then trial x is a success, probability p, independent of the rest. Multiply: f(x) = C(x − 1, r − 1) p^r q^(x−r), x = r, r + 1, ...

**Hypergeometric pdf.** All C(N, n) samples of size n are equally likely. A sample with exactly x successes chooses x of the r successes and n − x of the N − r failures: C(r, x) C(N − r, n − x) ways. So f(x) = C(r, x) C(N − r, n − x) / C(N, n).

**Poisson pdf sums to 1.** Every term e^(−k)kˣ/x! ≥ 0 since k > 0. Σ e^(−k)kˣ/x! = e^(−k) Σ kˣ/x! = e^(−k) e^k = 1, using the Maclaurin series e^k = Σ kˣ/x!.

**Uniform pdf.** f(x) = c on [a, b], 0 elsewhere. It must integrate to 1: ∫ₐᵇ c dx = c(b − a) = 1, so c = 1/(b − a).

**A continuous cdf.** Integrate from the left end of the support to x, then state all three pieces (see the lead example in 2.2).

**A continuous MGF.** Write m_X(t) = ∫ e^(tx) f(x) dx, combine the exponentials, integrate, and say which t make it converge (see e^(−x) in 2.4 and the gamma in 2.5). Example with rate λ: m(t) = ∫₀^∞ e^(tx) λe^(−λx) dx = λ ∫₀^∞ e^(−(λ−t)x) dx = λ/(λ − t), for t < λ.

**Show a continuous f is a pdf.** Two checks, both written: f(x) ≥ 0 on its range (say why), and the integral over the range equals 1 (show the antiderivative and the evaluation).

---

# Practice

Work these cold (tables and the formula sheet allowed), then check below.

**Discrete**
1. A salesperson closes each call with probability 0.2, independently. X = calls to the first sale. Find (a) P(X = 4), (b) P(X > 5), (c) E[X] and Var X.
2. X is geometric with p = 0.3. Derive m_X(t), and say for which t it exists.
3. m_X(t) = (0.6 + 0.4e^t)¹⁵. Find E[X] and Var X.
4. m_X(t) = (1 − 3t)^(−4). Find E[X] and Var X.
5. A player makes each free throw with probability 0.75. P(exactly 10 of 12)?
6. X is binomial, n = 20, p = 0.3. With the table: (a) P(X ≥ 5), (b) P(X = 6).
7. A player shoots until making 3 free throws, p = 0.7. P(it takes exactly 5 shots)?
8. 10 laptops, 3 with faulty batteries; 4 are chosen at random to test. (a) Possible values of X. (b) P(X = 1).
9. Calls arrive at 4 per hour. P(at least 2 calls in a 30-minute window)?
10. Name the distribution: (a) red cards in a 5-card hand, (b) rolls until the second six, (c) typos on a page, (d) heads in 20 flips, (e) tickets bought until the first winner.

**Continuous**
11. Show f(x) = 3x²/8 for 0 ≤ x ≤ 2 (0 elsewhere) is a pdf.
12. Find c so that f(x) = c(4 − x²) on [0, 2] is a pdf.
13. For f(x) = 3x²/8 on [0, 2]: derive F(x), then find P(1 < X ≤ 2).
14. F(x) = 1 − e^(−x²/4) for x ≥ 0. Find f(x).
15. X is uniform on [2, 12]. Derive f(x); find P(X > 7) and P(3 < X < 5).
16. For f(x) = 3x²/8 on [0, 2]: E[X], E[X²], Var X.
17. f(x) = 2e^(−2x), x > 0. Derive m_X(t) and use it for the mean and variance.
18. Evaluate ∫₀^∞ x³ e^(−x/2) dx, and find A so that A x³ e^(−x/2) (x > 0) is a pdf.
19. Buses arrive at random at 6 per hour. P(the wait for the first bus is more than 15 minutes)?
20. γ = 10. Find χ²_0.05, P(χ² > 16.0), and P(χ² < 3.94).
21. P(Z < −1.25), P(0.5 < Z < 1.5), and z₀ with P(Z > z₀) = 0.025.
22. Heights: μ = 170 cm, σ = 8 cm. P(height > 182 cm)? The 90th percentile?

---

# Answers

1. (a) 0.8³(0.2) = **0.1024**. (b) 0.8⁵ = **0.3277**. (c) E[X] = 1/0.2 = **5**, Var X = 0.8/0.04 = **20**.
2. m_X(t) = **0.3e^t/(1 − 0.7e^t)**, for qe^t < 1, i.e. **t < −ln 0.7 ≈ 0.357**.
3. Binomial with n = 15, p = 0.4: E[X] = **6**, Var X = 15(0.4)(0.6) = **3.6**.
4. Gamma with α = 4, β = 3: E[X] = **12**, Var X = 4(9) = **36**. (By derivatives: m′(0) = 12, m″(0) = 180, 180 − 144 = 36.)
5. C(12, 10)(0.75)¹⁰(0.25)² = 66 × 0.0563 × 0.0625 = **0.2323**.
6. (a) 1 − F(4) = 1 − 0.2375 = **0.7625**. (b) F(6) − F(5) = 0.6080 − 0.4164 = **0.1916**.
7. C(4, 2)(0.7)³(0.3)² = 6 × 0.343 × 0.09 = **0.1852**.
8. (a) x = **0, 1, 2, 3** (max(0, 4 − 7) = 0 to min(4, 3) = 3). (b) C(3,1)C(7,3)/C(10,4) = 3 × 35 / 210 = **0.5**.
9. k = 4 × 0.5 = 2. P(X ≥ 2) = 1 − e^(−2)(1 + 2) = **0.5940**.
10. (a) **hypergeometric**, (b) **negative binomial** (r = 2), (c) **Poisson**, (d) **binomial**, (e) **geometric**.
11. f(x) = 3x²/8 ≥ 0 on [0, 2], and ∫₀² 3x²/8 dx = [x³/8]₀² = 8/8 = **1**. ✓
12. ∫₀² c(4 − x²) dx = c(8 − 8/3) = 16c/3 = 1, so **c = 3/16**.
13. F(x) = **x³/8** for 0 ≤ x ≤ 2 (0 below, 1 above). P(1 < X ≤ 2) = F(2) − F(1) = 1 − 1/8 = **7/8**.
14. f(x) = F′(x) = **(x/2) e^(−x²/4)** for x ≥ 0 (0 for x < 0).
15. f(x) = **1/10** on [2, 12]. P(X > 7) = 5/10 = **0.5**. P(3 < X < 5) = 2/10 = **0.2**.
16. E[X] = ∫₀² 3x³/8 dx = **1.5**. E[X²] = ∫₀² 3x⁴/8 dx = **2.4**. Var X = 2.4 − 2.25 = **0.15**.
17. m(t) = ∫₀^∞ 2e^(−(2−t)x) dx = **2/(2 − t)**, t < 2. m′(0) = 2/4 = **0.5**, m″(0) = 4/8 = 0.5, Var X = 0.5 − 0.25 = **0.25**.
18. Γ(4) 2⁴ = 6 × 16 = **96**, so **A = 1/96**.
19. λw = 6 × 0.25 = 1.5, P(W > 0.25 h) = e^(−1.5) = **0.2231**.
20. χ²_0.05: column 0.95, **18.3**. 16.0 is the 0.90 entry, so P(χ² > 16.0) = **0.10**. 3.94 is the 0.05 entry, so P(χ² < 3.94) = **0.05**.
21. **0.1056**. 0.9332 − 0.6915 = **0.2417**. Left area 0.975 gives **z₀ = 1.96**.
22. z = (182 − 170)/8 = 1.5, P = 1 − 0.9332 = **0.0668**. The 90th percentile: left area 0.90 is closest to 0.8997 at z = 1.28, so x = 170 + 1.28(8) = **180.24 cm**.
