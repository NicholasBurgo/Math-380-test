# Math 223 crash course: §2.10 quantifiers, the four laws, and rewriting sentences

Built from your class notes (Ch2A.pdf §2.1-2.9, Ch2B.pdf §2.10). Three parts, each one is: the rules, the notes examples worked out, the traps, then practice with answers at the bottom.

Symbols: ∀ for all, ∃ there exists, ∼ not, ∧ and, ∨ or, ⇒ implies, ⇔ if and only if, ≡ logically equivalent.

---

# Part 1. §2.10 Quantified statements and the proof writing that goes with them

## 1.1 The two quantifiers

**Universal.** "∀x ∈ D, Q(x)" means Q(x) holds for *every* x in D.
- True exactly when Q(x) is true for every single x in D.
- False exactly when Q(x) fails for **at least one** x. That one x is a **counterexample**.

**Existential.** "∃x ∈ D such that Q(x)" means Q(x) holds for *at least one* x in D.
- True exactly when some x in D works. That x is a **witness**.
- False exactly when Q(x) fails for every x in D.

That asymmetry is the whole section. One statement needs an argument about an arbitrary element, the other needs one concrete object.

| Statement | To PROVE it | To DISPROVE it |
|---|---|---|
| ∀x ∈ D, Q(x) | general argument about an arbitrary x | one counterexample |
| ∃x ∈ D, Q(x) | one witness | general argument that all x fail (or check every x if D is finite) |

## 1.2 Rewriting into standard quantified form

Just like you rewrite into standard if-then form, you rewrite into standard ∀/∃ form.

- "All cats have nine lives." → "For every cat x, x has nine lives."
- "Every odd integer has an odd 4th power." → "For every integer n, if n is odd, then n⁴ is odd."
- "Some rational number has an integer square root." → "There exists q ∈ Q such that √q ∈ Z."

Note from the notes: in real written proofs you normally spell out "for every" and "there exists" in words. The symbols ∀ and ∃ are for scratch work and truth tables, not for the final write-up.

## 1.3 The notes examples, worked

**Universal statements, true or false?**

**a. For all x ∈ R, x⁴ ≥ x.** FALSE.
Counterexample: x = 1/2. Then x⁴ = 1/16 and 1/16 < 1/2.
(Write-up: "Consider x = 1/2 ∈ R. Then x⁴ = 1/16 < 1/2 = x, so the statement is false.")

**b. For all A ∈ P({a, b}), |A ∪ {c}| ≥ 1.** TRUE.
P({a,b}) = {∅, {a}, {b}, {a,b}}. For any such A, the set A ∪ {c} contains c, so it has at least one element. Note this even works for A = ∅, since ∅ ∪ {c} = {c}, which has size 1.

**c. For every x ∈ R, −x² + 5x − 2 < 5.** TRUE.
The inequality is equivalent to 0 < x² − 5x + 7. That quadratic has discriminant 25 − 28 = −3 < 0 and opens upward, so it is positive for every real x. (Or: the max of −x²+5x−2 is at x = 5/2, giving 17/4 = 4.25 < 5.)
This is the trap in the set. It looks false, and you cannot settle it by trying numbers, because trying numbers can never prove a ∀ statement.

**Existential statements, true or false?**

**a. There exists q ∈ Q such that √q ∈ Z.** TRUE. Witness q = 4, since √4 = 2 ∈ Z.
**b. There exists n ∈ {0, 2, 3} such that n² + 2n + 3 = 0.** FALSE. n=0 gives 3, n=2 gives 11, n=3 gives 18. Domain is finite, so checking all three is a complete proof (proof by exhaustion).
**c. There exists A ∈ P({1,2,3,4}) such that A ∪ {2,3} ≠ A.** TRUE. Witness A = ∅, since ∅ ∪ {2,3} = {2,3} ≠ ∅. (Any A missing a 2 or a 3 works.)
**d. There exist sets A and B such that |A × B| = 5.** TRUE. Since |A × B| = |A|·|B|, take A = {1} and B = {1,2,3,4,5}: |A × B| = 1·5 = 5.

**Universal conditional.** "∀x, if P(x), then Q(x)." The notes example: "For each real number x, if x > 0, then |x| = x." Informal rewrites:
- "For every positive real number x, |x| = x."
- "The absolute value of a positive real number is the number itself."
- "If a real number is positive, then it equals its own absolute value."

## 1.4 Negating quantified statements

**Theorem.** ∼(∀x ∈ D, Q(x)) ≡ ∃x ∈ D such that ∼Q(x).
**Theorem.** ∼(∃x ∈ D such that Q(x)) ≡ ∀x ∈ D, ∼Q(x).

Rule of thumb: **flip the quantifier, negate the inside.** Never leave a ∼ sitting in front of a quantifier in a final answer.

Notes examples:
- **a.** ∼(For all real x, x² ≥ 0) = "There exists a real number x such that x² < 0."
- **b.** ∼(There exists a rectangle R such that no angle of R is a right angle) = "For every rectangle R, R has at least one right angle." (Watch the inner negation: "no angle is right" negates to "some angle is right.")
- **c.** ∼(All math professors are dorks) = "There is a math professor who is not a dork." NOT "all math professors are not dorks."

**Theorem.** ∼(∀x, if P(x), then Q(x)) ≡ ∃x such that P(x) ∧ ∼Q(x).

Why: the negation flips ∀ to ∃, and by Theorem 2.25(a), ∼(P ⇒ Q) ≡ P ∧ ∼Q. So the negation of a universal conditional is exactly "a counterexample exists": something that satisfies the hypothesis and fails the conclusion.

- **a.** ∼(For all persons p, if p is blond, then p has blue eyes) = "There is a blond person who does not have blue eyes."
- **b.** ∼(If a computer program has more than 100,000 lines, then it contains a bug) = "There is a computer program with more than 100,000 lines that contains no bug."

## 1.5 Proof writing: the four templates

These cover HW #70 and #72, where every part needs a proof or a counterexample.

**Template A. Prove ∀x ∈ D, Q(x).**
```
Let x ∈ D be arbitrary.          <- an arbitrary element, never a specific number
[work, each step justified]
Therefore Q(x) holds.
Since x was arbitrary, Q(x) holds for every x ∈ D.
```

**Template B. Disprove ∀x ∈ D, Q(x).**
```
The statement is false.
Consider x = (the counterexample), which is in D.   <- say why it is in D
Then [verify Q(x) fails, with actual numbers].
So x is a counterexample, and the statement is false.
```

**Template C. Prove ∃x ∈ D such that Q(x).**
```
Consider x = (the witness), which is in D.
Then [verify Q(x) holds, with actual numbers].
Hence there exists x ∈ D with Q(x), as claimed.
```
You never have to say where the witness came from. Scratch work stays in scratch.

**Template D. Disprove ∃x ∈ D such that Q(x).**
```
The statement is false.
[Finite D: check every element, showing each computation.]
[Infinite D: argue for an arbitrary x ∈ D that Q(x) fails.]
Since Q(x) fails for every x ∈ D, no such x exists.
```

**Universal conditional.** To prove "∀x, if P(x) then Q(x)": *Let x be arbitrary and assume P(x).* Then derive Q(x). To disprove it, produce one x with P(x) true and Q(x) false.

## 1.6 "Criticize the following solutions," answered

This is the part the test actually punishes. Each flawed solution below has a named disease.

**1. "For all real numbers x, if x(x+1) > 0, then x > 0."** (The statement is false: x = −2 gives (−2)(−1) = 2 > 0 but −2 is not > 0.)

*Solution 1:* "Let x = −2 which is ∈ Z. Then x(x+1) > 0 = (−2)(−2+1) > 0 = 2 > 0."
Problems: (i) the equals signs chain together whole inequalities, which is meaningless. "=" joins numbers, not statements. (ii) It says x ∈ Z when the domain is R (true but sloppy: say it is a real number). (iii) It never states the conclusion, that the statement is false, or that x = −2 is a counterexample. (iv) It never checks the second half, that −2 is not greater than 0, which is the actual point.
Fixed: "The statement is false. Consider x = −2 ∈ R. Then x(x+1) = (−2)(−1) = 2 > 0, so the hypothesis holds, but x = −2 is not greater than 0, so the conclusion fails. Thus x = −2 is a counterexample."

*Solution 2:* "Let x ∈ R. Then x = −2 ..."
Problem: "Let x ∈ R" declares an arbitrary real number, and the very next sentence forces it to be −2. You cannot do both. This confusion between *arbitrary* and *particular* is the most common proof error in this course. For a counterexample you want a particular x, so open with "Consider x = −2."

**2. "There exists a positive integer x such that 4x⁴ − 124x³ = 0."** (True.)

*Solution 1:* takes x = 31 and verifies 4(31⁴) − 124(31³) = 3694084 − 3694084 = 0. The mathematics is right and this is the correct shape for an existence proof: exhibit, verify, conclude. Wording nit: "Let x be an integer such that x = 31" should be "Consider x = 31, a positive integer," and it should say the "positive" part explicitly, since that is part of the domain.

*Solution 2:* "Let 4x⁴ − 124x³ = 0. So 4x³(x − 31) = 0. So x = 0 or x = 31. So it is true."
Problems: (i) It *assumes* the equation, which is what you were asked to produce, so the logic runs backwards. That scratch work is how you *find* the witness, not how you prove it. (ii) x = 0 is not a positive integer, so the root list does not by itself finish the job. (iii) It never verifies anything. Convert it: solve on scratch, then write "Consider x = 31 ..." and verify.

**3. "There exists w ∈ {1,3,4,6} such that w² − 2w + 2 = 0."** (False.)

*Solution 1:* "Plugging w into the formula doesn't work, so the result is false by exhaustion."
Problem: exhaustion means showing *every* case, in writing. A claim that it does not work is not a computation. No work shown, no proof.

*Solution 2:* shows all four computations. That is the right idea and the arithmetic is right (1, 5, 10, 26, none are 0). Polish: say what the domain is and close with a sentence, for example "Since w² − 2w + 2 ≠ 0 for every w ∈ {1,3,4,6}, no such w exists, and the statement is false."

**4. "There exist integers x and y such that x² + y² = 25."** (True.)

Both given solutions have correct witnesses ((−5, 0) and (3, 4)). The first is the cleaner model: name the objects, say they are integers, verify, conclude. The second buries the conclusion in a stack of equations and opens with the awkward "Let x, y ∈ Z be x = 3 and y = 4." Write "Consider x = 3 and y = 4, both integers. Then x² + y² = 9 + 16 = 25, as required."

**The five rules that fall out of all of this**
1. "Let x ∈ D" means arbitrary. Never assign it a value later.
2. "=" connects numbers. "⇒", "≡", and English connect statements.
3. Verify the witness or counterexample with real arithmetic, both the hypothesis and the failed conclusion.
4. Never assume the thing you are proving.
5. End with a sentence that says what you proved. A proof ends in English, not in a number.

---

# Part 2. The four laws (Theorem 2.22)

Know them **by name**, the notes say so explicitly.

**(1) Commutative Laws**
- P ∨ Q ≡ Q ∨ P
- P ∧ Q ≡ Q ∧ P

**(2) Associative Laws**
- P ∨ (Q ∨ R) ≡ (P ∨ Q) ∨ R
- P ∧ (Q ∧ R) ≡ (P ∧ Q) ∧ R

**(3) Distributive Laws**
- P ∨ (Q ∧ R) ≡ (P ∨ Q) ∧ (P ∨ R)
- P ∧ (Q ∨ R) ≡ (P ∧ Q) ∨ (P ∧ R)

**(4) DeMorgan's Laws**
- ∼(P ∨ Q) ≡ (∼P) ∧ (∼Q)
- ∼(P ∧ Q) ≡ (∼P) ∨ (∼Q)

Plus the supporting cast you are expected to use without being asked:
- **Double Negative Law:** ∼(∼P) ≡ P
- **Theorem 2.21:** P ⇒ Q ≡ (∼P) ∨ Q  (an implication is really an "or")
- **Theorem 2.25(a):** ∼(P ⇒ Q) ≡ P ∧ (∼Q)  (negating an implication kills the arrow)
- **§2.7 simplifications:** P ∧ C ≡ C, P ∧ T ≡ P, P ∨ T ≡ T, P ∨ C ≡ P, where T is a tautology and C a contradiction. Also P ∨ ∼P ≡ T and P ∧ ∼P ≡ C.

Distributive is the one people get backwards. Both versions distribute the *outside* connective over the inside one, exactly like a(b+c) = ab + ac, except that in logic it works both ways round (∨ over ∧ *and* ∧ over ∨), which arithmetic does not do.

## 2.1 Using DeMorgan in words

- "Either x = 0 or y = 0" negates to "x ≠ 0 **and** y ≠ 0."
- "The integers a and b are both even" negates to "a is odd **or** b is odd." (Not "both are odd." And for integers, "not even" is "odd," so say odd.)

Translation habit: and/or flip under a negation, and every piece gets negated.

## 2.2 Negating implications

By Theorem 2.25(a), ∼(P ⇒ Q) ≡ P ∧ ∼Q. Its proof is one line of the two theorems above:
∼(P ⇒ Q) ≡ ∼((∼P) ∨ Q) ≡ ∼(∼P) ∧ ∼Q ≡ P ∧ ∼Q, using 2.21, DeMorgan, and the double negative.

The negation of an if-then is **not** an if-then. It is an "and."
- ∼("If John studies, then he will pass the exam") = "John studies **and** he will not pass the exam."
- ∼("If x, y > 0, then x² > 0 and y² > 0") = "x > 0 and y > 0, and (x² ≤ 0 or y² ≤ 0)." (The conclusion is itself an ∧, so DeMorgan turns it into an ∨.)

## 2.3 Verifying an equivalence with the laws

Two legal methods. A truth table is always allowed unless the problem says "use Theorem 2.22." A law chain looks like this (the notes example):

Show ∼(P ∨ ∼Q) ∨ (∼P ∧ ∼Q) ≡ ∼P.
```
∼(P ∨ ∼Q) ∨ (∼P ∧ ∼Q)
≡ (∼P ∧ ∼(∼Q)) ∨ (∼P ∧ ∼Q)     DeMorgan
≡ (∼P ∧ Q) ∨ (∼P ∧ ∼Q)         Double Negative
≡ ∼P ∧ (Q ∨ ∼Q)                Distributive (read right to left)
≡ ∼P ∧ T                        Q ∨ ∼Q is a tautology
≡ ∼P                            P ∧ T ≡ P
```
Name the law on every line. That is where the points are.

And the distributive verification by table, property (3b), P ∧ (Q ∨ R) ≡ (P ∧ Q) ∨ (P ∧ R):

| P | Q | R | Q∨R | P∧(Q∨R) | P∧Q | P∧R | (P∧Q)∨(P∧R) |
|---|---|---|---|---|---|---|---|
| T | T | T | T | T | T | T | T |
| T | T | F | T | T | T | F | T |
| T | F | T | T | T | F | T | T |
| T | F | F | F | F | F | F | F |
| F | T | T | T | F | F | F | F |
| F | T | F | T | F | F | F | F |
| F | F | T | T | F | F | F | F |
| F | F | F | F | F | F | F | F |

Columns 5 and 8 match in all eight rows, so the two statements are logically equivalent. Say that sentence at the end; the table alone is not the answer.

---

# Part 3. Rewriting sentences, including the "if and only if" ones

## 3.1 The if-then dictionary (§2.4)

All of these mean **P ⇒ Q**:

| English | Meaning |
|---|---|
| If P, then Q | P ⇒ Q |
| Q, if P | P ⇒ Q |
| P implies Q | P ⇒ Q |
| **P only if Q** | **P ⇒ Q** |
| P is sufficient for Q | P ⇒ Q |
| **Q is necessary for P** | **P ⇒ Q** |
| Whenever P, Q | P ⇒ Q |
| Every P is a Q | P ⇒ Q |

The two bolded rows are the whole game:
- **sufficient = the hypothesis.** "R is sufficient for S" means R ⇒ S. Having R is enough to get S.
- **necessary = the conclusion.** "R is necessary for S" means **S ⇒ R**. It flips. You cannot have S without R.
- **"only if" points forward:** "P only if Q" is P ⇒ Q, even though "if" alone points backward. "Q if P" is also P ⇒ Q. So "if" and "only if" put the arrow in opposite directions, which is why "if and only if" gives you both.

Reminder on truth values: P ⇒ Q is false in exactly one case, P true and Q false. When P is false the implication is **vacuously true**.

## 3.2 The notes' rewriting examples, worked

§2.4, into "If A, then B":
- **a.** "Squareness of this figure is a sufficient condition for it to be rectangular." → **If this figure is a square, then it is a rectangle.**
- **b.** "A necessary condition for this program to be correct is that it not produce error messages during translation." → necessary flips, so → **If this program is correct, then it does not produce error messages during translation.**
- **c.** "John cooks dinner only if he has the right ingredients." → **If John cooks dinner, then he has the right ingredients.** (Not the reverse: having the ingredients does not force him to cook.)
- **d.** "Sally's having a cat implies that she is a librarian." → **If Sally has a cat, then she is a librarian.**
- **e.** "Vicki goes to the movies if she has enough money." → "Q if P" → **If Vicki has enough money, then she goes to the movies.**

§2.5 #102, the less structured ones. The trick is to find the hidden hypothesis. A "let," a "suppose," a "whenever," an "every," or a bare object with a property all hide one.
- **b.** "Let C be a circle of diameter √(2/π). Then the area of C is 1/2." → **If C is a circle of diameter √(2/π), then the area of C is 1/2.** (True: r = √(2/π)/2, so πr² = π(2/π)/4 = 1/2.)
- **c.** "The 4th power of every odd integer is odd." → **If n is an odd integer, then n⁴ is odd.**
- **d.** "Suppose that the slope of a line l is 2. Then the equation of l is y = 2x + b for some real number b." → **If the slope of a line l is 2, then l has equation y = 2x + b for some real number b.**
- **e.** "Whenever a and b are nonzero rational numbers, a/b is a nonzero rational number." → **If a and b are nonzero rational numbers, then a/b is a nonzero rational number.**
- **f.** "For every three integers, there exist two of them whose sum is even." → **If a, b, and c are integers, then some two of them have an even sum.**
- **h.** "The number √3 is irrational." → there is no visible hypothesis, so invent one that names the object: **If x = √3, then x is irrational.** (Equally fine: "If x is a real number with x > 0 and x² = 3, then x is irrational.")

## 3.3 Biconditionals (§2.6), the "bi ones"

**Definition.** P ⇔ Q is **(P ⇒ Q) ∧ (Q ⇒ P)**. Two implications, and both must hold.

The converse of P ⇒ Q is Q ⇒ P. A conditional and its converse have **independent** truth values, which is exactly why a biconditional is a real claim and not just restating one arrow.

All of these mean **P ⇔ Q**:
- P if and only if Q
- P iff Q
- P is equivalent to Q
- **P is a necessary and sufficient condition for Q**
- If P then Q, and conversely
- If P then Q, and if Q then P

**How to split "P if and only if Q" without guessing:**
```
P if Q            =  Q ⇒ P        (the "if" half, backward arrow)
P only if Q       =  P ⇒ Q        (the "only if" half, forward arrow)
P if and only if Q = both = P ⇔ Q
```
"necessary and sufficient" splits the same way: **sufficient** gives you one arrow, **necessary** gives you the other, so together you get ⇔. Careful with the direction of the phrase: "a necessary and sufficient condition for A is B" means B is that condition, so B ⇔ A. Because it is a ⇔, the direction does not change the truth value, only the wording.

**Truth table.**

| P | Q | P ⇔ Q |
|---|---|---|
| T | T | T |
| T | F | F |
| F | T | F |
| F | F | **T** |

P ⇔ Q is true exactly when P and Q have the **same** truth value. Both false counts as true. That last row is the one that gets missed.

Order of operations note from §2.6 and §2.8: do ⇔ (and ≡) **last**. So "P ∧ ∼R ⇔ Q ∨ R" means (P ∧ ∼R) ⇔ (Q ∨ R).

**Negation.** ∼(P ⇔ Q) ≡ (P ∧ ∼Q) ∨ (Q ∧ ∼P). In words: exactly one of them is true.

**Proving a biconditional.** Two directions, labeled:
```
(⇒) Assume P. ... Therefore Q.
(⇐) Assume Q. ... Therefore P.
Since both implications hold, P if and only if Q.
```
Do not try to prove both at once unless every step is genuinely reversible (a chain of ≡ or ⇔). If you write a chain, it must be ⇔ at every link, not ⇒.

**The notes example (#41), worked.** S = {1,2,3}. The claim is "A necessary and sufficient condition for (n³+n)/2 to be even is that (n²+n)/2 is odd," that is, P(n) ⇔ Q(n) where P(n): (n³+n)/2 is even, Q(n): (n²+n)/2 is odd.

| n | (n³+n)/2 | P: even? | (n²+n)/2 | Q: odd? | P ⇔ Q |
|---|---|---|---|---|---|
| 1 | 1 | F | 1 | T | **F** |
| 2 | 5 | F | 3 | T | **F** |
| 3 | 15 | F | 6 | F | **T** |

So the statement is true only for **n = 3**, and it is true there because both halves are false. That is the F ⇔ F = T row doing the work, and it is exactly the kind of case a test uses to check whether you know the definition or just the vibe.

---

# Practice

Work these cold, then check below.

**Quantifiers and proof**
1. True or false, with proof or counterexample: for all x ∈ R, x³ ≥ x.
2. True or false, with proof or counterexample: there exists n ∈ {2,3,5,7} such that n² + 1 is prime.
3. Negate: "For every integer n, if n² is even, then n is even."
4. Negate: "There exists a real number x such that for all real y, xy = y."
5. Write the first and last lines of a proof of "For every odd integer n, n² is odd."

**The four laws**
6. Name the law: (P ∧ Q) ∨ (P ∧ R) ≡ P ∧ (Q ∨ R).
7. Negate with DeMorgan, in words: "The function f is continuous and differentiable."
8. Negate: "If it rains, then the game is canceled and the refund is issued."
9. Simplify with the laws, naming each: (P ∧ Q) ∨ (P ∧ ∼Q).
10. Use Theorem 2.21 to rewrite ∼P ⇒ Q without an arrow.

**Rewriting**
11. Into if-then: "Differentiability is a sufficient condition for continuity."
12. Into if-then: "A necessary condition for n to be prime is that n ≥ 2."
13. Into if-then: "The product of two odd integers is odd."
14. Split into two implications: "An integer n is even if and only if n² is even."
15. True or false: P ⇔ Q when P is "3 > 5" and Q is "2 + 2 = 5."

---

# Answers

1. **False.** Consider x = 1/2 ∈ R. Then x³ = 1/8 < 1/2, so x = 1/2 is a counterexample. (x = −2 also works: −8 < −2.)
2. **True.** Consider n = 2 ∈ {2,3,5,7}. Then n² + 1 = 5, which is prime.
3. "There exists an integer n such that n² is even and n is odd." (∃, hypothesis kept, conclusion negated.)
4. "For every real number x, there exists a real number y such that xy ≠ y." (Flip both quantifiers, in order, and negate the inside.)
5. First line: "Let n be an arbitrary odd integer, so n = 2k + 1 for some integer k." Last line: "Therefore n² is odd, and since n was an arbitrary odd integer, the square of every odd integer is odd."
6. **Distributive Law** (3b), read right to left.
7. "f is not continuous **or** f is not differentiable."
8. "It rains **and** (the game is not canceled **or** the refund is not issued)." (2.25(a), then DeMorgan on the conclusion.)
9. (P ∧ Q) ∨ (P ∧ ∼Q) ≡ P ∧ (Q ∨ ∼Q) [Distributive] ≡ P ∧ T [tautology] ≡ **P** [P ∧ T ≡ P].
10. ∼P ⇒ Q ≡ ∼(∼P) ∨ Q ≡ **P ∨ Q** (Theorem 2.21, then Double Negative).
11. "If a function is differentiable, then it is continuous."
12. "If n is prime, then n ≥ 2." (necessary flips)
13. "If a and b are odd integers, then ab is odd."
14. (⇒) If n is even, then n² is even. (⇐) If n² is even, then n is even. Both must be proved.
15. **True.** Both are false, and F ⇔ F is true.

---

# Rewriting drill bank

Four sets of sentences to rewrite. Cover the answers, do a block of five, then check. Answers start after set D.

## Set A. Rewrite in the form "If A, then B"

Hunt for the hidden hypothesis first. A "let," "suppose," "whenever," "every," "any," or a bare object with a property is always the hypothesis.

A1. Being divisible by 4 is a sufficient condition for an integer to be even.
A2. A necessary condition for a quadrilateral to be a square is that it be a rhombus.
A3. Maria will graduate only if she passes Math 223.
A4. The team wins if the goalie plays.
A5. Being a multiple of 10 implies being a multiple of 5.
A6. Whenever x is a negative real number, x³ is negative.
A7. Every prime greater than 2 is odd.
A8. The sum of two even integers is even.
A9. Continuity is necessary for differentiability.
A10. A set with n elements has 2ⁿ subsets.
A11. Let x be a real number with x > 3. Then x² > 9.
A12. Suppose A ⊆ B. Then A ∪ B = B.
A13. No odd integer is divisible by 2.
A14. You cannot be in the club unless you pay dues.
A15. It is enough for n to be a multiple of 6 for n to be a multiple of 3.
A16. The number √2 is irrational.
A17. Only continuous functions are integrable on [0,1].
A18. Passing the final is required in order to pass the course.

## Set B. Rewrite in standard quantified form

Use "For every x ∈ D, ..." or "There exists x ∈ D such that ...". If there is a condition on x, use the universal conditional form "For every x, if P(x), then Q(x)."

B1. All squares are rectangles.
B2. Some integer is its own square.
B3. No real number has a negative square.
B4. Every nonzero rational number has a rational reciprocal.
B5. There is a smallest positive integer.
B6. Each subset of {1, 2} contains at most two elements.
B7. Some set has an empty Cartesian product with {1}.
B8. Any two distinct lines meet in at most one point.
B9. The equation x² = 2 has no rational solution.
B10. Every even integer greater than 2 is a sum of two primes.
B11. Some power set contains exactly four elements.
B12. The cube of every negative real number is negative.

## Set C. Biconditionals: split them, or build them

C1 through C7: split into the two implications it stands for.

C1. An integer n is odd if and only if n + 1 is even.
C2. A necessary and sufficient condition for a triangle to be equilateral is that all of its angles measure 60°.
C3. x = 0 iff x² = 0.
C4. A = B if and only if A ⊆ B and B ⊆ A.
C5. A function is invertible precisely when it is one-to-one and onto.
C6. An integer n is divisible by 6 if and only if n is divisible by 2 and by 3.
C7. A quadrilateral is a rhombus if and only if its diagonals bisect each other at right angles.

C8 through C11: go the other way, combine into a single "if and only if" sentence.

C8. If it is Tuesday, then the shop is closed. If the shop is closed, then it is Tuesday.
C9. If n is even, then n² is even, and conversely.
C10. Being a square is sufficient for being a rectangle with equal sides, and it is also necessary.
C11. A ⊆ B implies A ∪ B = B, and A ∪ B = B implies A ⊆ B.

C12. Rewrite C6 using the words "necessary and sufficient" instead of "if and only if."

## Set D. Negate the sentence

Write the negation as a clean positive-sounding sentence. No leftover "it is not the case that."

D1. All prime numbers are odd.
D2. Some student in the class owns a car.
D3. For every x ∈ R, there exists y ∈ R such that x + y = 0.
D4. If the light is green, then the car moves.
D5. x is positive and y is negative.
D6. Either the door is locked or the alarm is on.
D7. For all integers n, if n is prime, then n is odd.
D8. There is a set A such that A ⊆ ∅ and A ≠ ∅.
D9. Every continuous function is differentiable.
D10. An integer n is even if and only if n² is even.
D11. If it rains and the field is wet, then the game is postponed.
D12. Every student passed and no student cheated.

---

# Drill bank answers

## Set A

A1. If an integer is divisible by 4, then it is even. (sufficient = hypothesis)
A2. If a quadrilateral is a square, then it is a rhombus. (necessary = conclusion, so the arrow flips)
A3. If Maria graduates, then she passed Math 223. ("only if" points forward)
A4. If the goalie plays, then the team wins. ("Q if P" points backward)
A5. If n is a multiple of 10, then n is a multiple of 5.
A6. If x is a negative real number, then x³ is negative.
A7. If p is a prime and p > 2, then p is odd.
A8. If a and b are even integers, then a + b is even.
A9. If a function is differentiable, then it is continuous. (necessary flips)
A10. If A is a set with n elements, then A has 2ⁿ subsets.
A11. If x is a real number and x > 3, then x² > 9.
A12. If A ⊆ B, then A ∪ B = B.
A13. If n is an odd integer, then n is not divisible by 2.
A14. If you are in the club, then you pay dues. ("cannot ... unless" gives you the contrapositive, which rewrites to this)
A15. If n is a multiple of 6, then n is a multiple of 3. ("enough for" = sufficient)
A16. If x = √2, then x is irrational. (no hypothesis is visible, so invent one that names the object)
A17. If a function is integrable on [0,1], then it is continuous. ("only P are Q" reverses: Q ⇒ P. As mathematics this one is false, which is fine, the task is the rewrite.)
A18. If you pass the course, then you passed the final. ("required" = necessary, so it flips)

## Set B

B1. For every square x, x is a rectangle. Or in conditional form: for every quadrilateral x, if x is a square, then x is a rectangle.
B2. There exists n ∈ Z such that n² = n. (witnesses 0 and 1)
B3. For every x ∈ R, x² ≥ 0.
B4. For every q ∈ Q, if q ≠ 0, then 1/q ∈ Q.
B5. There exists n ∈ Z⁺ such that for every m ∈ Z⁺, n ≤ m. (two quantifiers, order matters)
B6. For every A ∈ P({1,2}), |A| ≤ 2.
B7. There exists a set A such that A × {1} = ∅. (witness A = ∅)
B8. For all lines l and m, if l ≠ m, then l and m have at most one point in common.
B9. For every q ∈ Q, q² ≠ 2.
B10. For every integer n, if n is even and n > 2, then there exist primes p and q such that n = p + q.
B11. There exists a set A such that |P(A)| = 4. (witness any two-element A)
B12. For every x ∈ R, if x < 0, then x³ < 0.

## Set C

C1. (⇒) If n is odd, then n + 1 is even. (⇐) If n + 1 is even, then n is odd.
C2. (⇒) If a triangle is equilateral, then all of its angles measure 60°. (⇐) If all angles of a triangle measure 60°, then the triangle is equilateral.
C3. (⇒) If x = 0, then x² = 0. (⇐) If x² = 0, then x = 0.
C4. (⇒) If A = B, then A ⊆ B and B ⊆ A. (⇐) If A ⊆ B and B ⊆ A, then A = B.
C5. (⇒) If a function is invertible, then it is one-to-one and onto. (⇐) If a function is one-to-one and onto, then it is invertible. ("precisely when" = iff)
C6. (⇒) If n is divisible by 6, then n is divisible by 2 and by 3. (⇐) If n is divisible by 2 and by 3, then n is divisible by 6.
C7. (⇒) If a quadrilateral is a rhombus, then its diagonals bisect each other at right angles. (⇐) If the diagonals of a quadrilateral bisect each other at right angles, then it is a rhombus.
C8. It is Tuesday if and only if the shop is closed.
C9. n is even if and only if n² is even.
C10. A quadrilateral is a square if and only if it is a rectangle with equal sides.
C11. A ⊆ B if and only if A ∪ B = B.
C12. A necessary and sufficient condition for an integer n to be divisible by 6 is that n be divisible by 2 and by 3.

## Set D

D1. There is a prime number that is not odd. (namely 2)
D2. No student in the class owns a car. Equivalently: every student in the class does not own a car.
D3. There exists x ∈ R such that for every y ∈ R, x + y ≠ 0. (flip both quantifiers, left to right, then negate the inside)
D4. The light is green and the car does not move.
D5. x is not positive or y is not negative. With inequalities: x ≤ 0 or y ≥ 0.
D6. The door is not locked and the alarm is not on.
D7. There is an integer n such that n is prime and n is not odd.
D8. For every set A, A is not a subset of ∅ or A = ∅.
D9. There is a continuous function that is not differentiable.
D10. Either n is even and n² is odd, or n² is even and n is odd. (∼(P ⇔ Q) means exactly one of the two holds)
D11. It rains, the field is wet, and the game is not postponed.
D12. Some student did not pass, or some student cheated.
