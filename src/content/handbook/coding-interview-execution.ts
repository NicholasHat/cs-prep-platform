import type { HandbookChapter } from "./types";

export const chapter: HandbookChapter = {
  slug: "coding-interview-execution",
  title: "Running the 45 Minutes",
  track: "coding",
  order: 3,
  summary:
    "How to actually run a live coding round: the minute-by-minute time budget, what to say, when to stop talking and start typing, and what the interviewer is scoring while you do it. Assumes you already know the patterns — this is about execution.",
  estMinutes: 55,
  tags: [
    "interview-execution",
    "time-management",
    "communication",
    "clarifying-questions",
    "brute-force",
    "testing",
    "hints",
    "debugging",
    "rubric",
    "transcript",
  ],
  sections: [
    {
      id: "the-time-budget",
      heading: "The Minute-by-Minute Map of a 45-Minute Round",
      markdown: `Most people who fail a coding round did not fail because they could not write the algorithm. They failed because they spent 22 minutes flailing toward an approach and then had 8 minutes to write 40 lines. The round has a shape. Learn the shape.

Assume a 45-minute slot. Some companies give you 60, a few give you 35 — scale proportionally, but the ratios hold.

| Clock | What you should be doing | You are behind if... |
| --- | --- | --- |
| 0:00 – 3:00 | Intro, environment setup, read the problem carefully (twice) | You are still fumbling with the editor, or you started talking before finishing the prompt |
| 3:00 – 8:00 | Clarify constraints, restate the problem in one sentence, work a small example by hand | You have asked six questions and none of them changed anything |
| 8:00 – 15:00 | State brute force + its complexity, propose the optimal approach, get explicit buy-in | You have no named approach at 15:00 |
| 15:00 – 33:00 | Write the code, narrating structure but not every keystroke | You have not written a function signature by 20:00 |
| 33:00 – 40:00 | Trace a real example line by line, fix what you find, state time and space complexity | You are still writing new logic at 38:00 |
| 40:00 – 45:00 | Follow-ups from the interviewer, then your questions for them | You never got to ask anything |

## The two failure modes are mirror images

**Typing at minute 3.** The most common junior mistake is treating silence as failure and code as progress. You read the problem, you recognize "oh, sliding window," and your hands are moving before minute four. Then at minute 25 you discover the window has to shrink from both ends and your whole loop shape is wrong. Rewriting under time pressure with an interviewer watching is where people melt down. Approach failures are far more expensive than typing failures, because typing is 300 words a minute and rethinking is not.

**Still talking at minute 20.** The mirror mistake is treating the discussion phase as the interview. You explore three approaches, you compare them elegantly, the interviewer is nodding — and there is no code on the screen. A brilliant unwritten solution scores below a working one. Interviewers are explicitly asked "did the candidate produce working code?" and "I ran out of time" is not a mark in your favor unless the problem was genuinely oversized.

The fix for both is the same: treat 15:00 as a hard commit deadline. At 15:00 you say out loud, *"I want to start coding — I'll go with the hash-map approach, and I'll flag it if I hit a wall."* You can still be wrong. You just cannot still be undecided.

## Recovering time

- **Behind at 8:00** (still clarifying): stop asking. Say *"I think I have enough — let me state my understanding and move on."* Restate in one sentence and go.
- **Behind at 15:00** (no approach): fall back deliberately. Say *"I don't have the optimal approach yet. I'm going to code the O(n²) version so we have something correct, and then optimize if there's time."* This is a respectable move, not a surrender. A working brute force plus a described optimization beats a half-written optimal solution.
- **Behind at 33:00** (code not done): stop adding features. Get the main path correct, then say *"I haven't handled the empty-input case — it's a two-line guard at the top, here's what it'd be."* Interviewers accept described-but-unwritten edge cases far more readily than unfinished core logic.
- **Behind at 40:00** (no testing done): pick one input and trace it fast. Ten seconds of *"n equals 3, best ends at 2, returns 2 — correct"* is worth more than zero verification.

Keep an eye on the actual clock. Ask at the start: *"Do you mind if I keep an eye on the time?"* Nobody has ever said no.`,
    },
    {
      id: "clarifying-questions",
      heading: "Clarifying Questions Worth Asking (and the Ones That Waste the Clock)",
      markdown: `Clarifying questions are scored, but not by count. The interviewer is inferring one thing: *does this person figure out what they're building before they build it, or do they guess?* Six shallow questions signal the opposite of what you intend.

## The filter: does the answer change what I write?

Before you ask, finish this sentence in your head: *"If they say yes I'll do X, if they say no I'll do Y."* If you cannot name both branches, the question is decoration. Cut it.

| Worth asking | Why it changes your code |
| --- | --- |
| "How large can n get?" | n ≤ 20 permits exponential; n ≈ 10⁵ means O(n log n) at worst; n ≈ 10⁹ means you cannot even store it |
| "Can the values be negative? Zero?" | Kills or saves prefix-sum, two-pointer, and greedy approaches outright |
| "Can there be duplicates?" | Changes set-vs-map, changes whether you dedupe results, changes tie-breaking |
| "Is the input sorted, or can I sort it?" | Sorting costs O(n log n) — worth knowing if you're already paying it |
| "Am I allowed to mutate the input?" | Decides in-place vs O(n) extra space, and whether the caller's array is safe |
| "What do I return if there's no valid answer?" | -1, null, empty array, throw — this is a real branch in your code |
| "Is the whole input in memory, or is it a stream?" | Streaming forbids two passes and random access |
| "What character set — ASCII, lowercase only, full Unicode?" | Decides fixed 26-slot array vs a Map; affects your space claim |
| "Any memory constraint I should design against?" | Occasionally the actual point of the question |

| Wasteful | Why it costs you |
| --- | --- |
| Anything the prompt already stated | Reads as "did not read carefully" — the single cheapest way to lose points |
| "Should I handle null?" asked separately for five parameters | One question covers it: "Should I assume inputs are well-formed?" |
| "Can I use built-in sort / a hash map?" | Yes. Always yes, unless the problem is obviously about implementing one |
| "What language should I use?" | Asked and answered in the scheduling email |
| Trivia with no branch — "are the strings long?" with no threshold in mind | You have no plan for either answer |
| Asking about a follow-up variant before solving the base problem | Reads as stalling |

## Ask them in a bundle, not a drip

Drip-feeding questions across ten minutes fragments the round. Read the problem, think for twenty seconds, then ask three or four in one breath:

> *"A few things before I dig in: how large can \`nums\` get, can the values be negative, and what should I return if no pair sums to the target? Also, is it safe to assume the input is well-formed — no nulls?"*

That is one exchange, thirty seconds, and it has fully specified your target complexity, your arithmetic edge cases, your return contract, and your guard clauses.

## Then confirm the problem back in one sentence

This is the highest-value-per-second thing you will say all round. After the answers land:

> *"Okay — so given an array of up to 10⁵ integers that may be negative and may repeat, I need to return the indices of the two that sum to \`target\`, or an empty array if there is no such pair. Is that right?"*

Two reasons this earns points. First, it catches misreads while they are still free — roughly one in five candidates has a subtly wrong model of the problem at minute five, and this is where it surfaces. Second, in a real job you will be handed ambiguous tickets forever, and "restates the requirement back before starting" is exactly the habit that gets scored under *problem solving* and *communication* at the same time.`,
    },
    {
      id: "work-an-example",
      heading: "Work an Example by Hand Before You Code",
      markdown: `After you restate the problem and before you propose an approach, write down one small input and its expected output. By hand. On the shared screen where the interviewer can see it.

\`\`\`text
Input:  "abcabcbb"
Output: 3        // "abc"
\`\`\`

Thirty seconds. Four things happen:

**1. It catches misread problems.** You cannot produce the expected output for a concrete input if you have misunderstood the question. This is where you discover that "longest substring" means contiguous and you were thinking subsequence, or that the function returns the length and not the substring itself. Finding that at minute six costs nothing. Finding it at minute 30 costs the round.

**2. It surfaces the structure.** Working \`"abcabcbb"\` by hand, you feel yourself extending a window and then hitting a repeat and having to pull the left edge forward. That felt experience is the algorithm. Many candidates who "can't find the trick" have simply never touched the data.

**3. It seeds your tests.** At minute 35 you need an input to trace. If you invented one at minute six, you already know the answer, so tracing is verification instead of a second derivation. Candidates who skip this step end up at 35 minutes computing the expected output and the actual output simultaneously, which verifies nothing.

**4. It gives the interviewer a shared object.** From here on, both of you can point at \`"abcabcbb"\`. Hints get concrete — *"what does your window look like when you reach the second \`a\`?"* — instead of abstract.

## Pick an example that is small but not degenerate

The example has to be small enough to trace by hand — 4 to 8 elements — and rich enough to exercise the thing that makes the problem non-trivial.

| Bad example | Why | Better |
| --- | --- | --- |
| \`[]\` or \`""\` | Degenerate. Tests your guard clause, not your algorithm | Save it for the edge-case pass |
| \`"abc"\` | No repeats — never exercises the shrink | \`"abcabcbb"\` |
| \`[1,2,3,4]\` for a two-sum | Every answer is at the front | \`[3,3,-1,8]\` — duplicates, negatives, answer not at index 0 |
| A 20-element array | You will spend three minutes tracing it and make an arithmetic error | Trim to 6 |

One extra move worth the ten seconds: write a *second* example that is almost the same but flips one property — \`"abba"\` next to \`"abcabcbb"\`, or \`[2,2]\` next to \`[2,7,11]\`. The near-miss pair is where off-by-one bugs go to die, and you now have your hardest test case ready before you have written a line.`,
    },
    {
      id: "brute-force-first",
      heading: "State the Brute Force First — and Why It Earns Points",
      markdown: `A large fraction of candidates skip straight to the optimal solution because they think naming the obvious approach makes them look slow. It does the opposite. Interviewers are trained to reward it, and here is the mechanical reason why.

**It proves you understand the problem.** If you can describe an O(n³) procedure that returns the right answer, you have demonstrated you know what "the right answer" means. Candidates who leap to "use a hash map" sometimes have not internalized the problem at all, and the interviewer cannot tell yet whether you understood or pattern-matched.

**It establishes a correctness baseline.** The brute force is the definition of correct. Later, when you're not sure whether your optimized version handles a tie, the question becomes "what would the brute force return here?" — which is answerable.

**It sets the ceiling you're beating.** "O(n²), and I think we can get to O(n)" is a claim with a target. It also lets the interviewer calibrate: if you say O(n²) and they know the answer is O(n log n), they can steer you before you burn ten minutes chasing an impossible bound.

**It gives the interviewer a hook.** Interviewers steer by responding to what you say. Silence gives them nothing to grab. A stated brute force is an invitation: *"could you avoid recomputing that sum every time?"* is a hint they can only offer once you have said the thing being recomputed.

**It is your fallback.** If you're at minute 20 with no optimal insight, you already have a described, complexity-analyzed solution to fall back on. Coding it is a decision, not a defeat.

## The sentence to use

Do not improvise this. It is the same shape every time:

> *"The brute force is to check every pair of indices and keep the best — that's O(n²) time, O(1) space. I think we can do better by trading space for time: one pass with a hash map of values we've already seen, which should get us O(n) time and O(n) space. Do you want me to go straight to the optimal, or would you like me to code the brute force first?"*

Four things happened in fifteen seconds: you proved comprehension, you gave complexities unprompted, you named the mechanism of the optimization (not just its name), and you handed the pacing decision to the interviewer. That last part matters — many interviewers will say "go straight to optimal," and now you have their explicit permission, which means nobody is going to ding you at debrief for skipping the baseline.

## Two traps

**Never start typing the brute force without announcing your intent.** If you silently begin writing nested loops, the interviewer's honest read is "this candidate doesn't see the optimization." They will start hinting, you will get flustered, and you will have lost points for a solution you were about to improve anyway. One sentence prevents this entirely: *"I'll write the O(n²) version first so we have something correct, then optimize."*

**Never spend five minutes describing it.** The brute force is thirty seconds of speech, maximum. It is a checkpoint, not a destination. If you find yourself explaining the loop bounds of a solution you don't intend to write, you are burning the clock that your real solution needs. Name it, price it, move.`,
    },
    {
      id: "thinking-out-loud",
      heading: "Thinking Out Loud Without Rambling",
      markdown: `"Think out loud" is the most-repeated and least-explained interview advice in existence. The useful version: **narrate your reasoning, not your confusion.**

Reasoning is structured — it has a claim, a test, and a conclusion. Confusion is a stream of half-formed reactions. Both are audible, and interviewers distinguish them instantly, because one of them can be written down in their notes and the other cannot.

## What to actually say

**State a hypothesis, then test it aloud.** This is the core move. *"I think a single pass with a hash map works here. Let me check that against \`[3, 3]\` — first 3 goes in the map, second 3 finds it, returns [0,1]. Yeah, that holds."* The interviewer can now write "forms and validates hypotheses" in their notes.

**Say what you're ruling out and why.** *"I considered sorting first, but I need the original indices back, so sorting costs me more than it saves. Skipping that."* Eliminated options are evidence of breadth. Unspoken eliminated options are evidence of nothing.

**Announce transitions.** *"Let me think quietly for about thirty seconds."* Then actually be quiet, then come back with something. Framed silence reads as composure. Unframed silence reads as being stuck, and the interviewer will interrupt you to check — which breaks the thought you were about to finish.

**Announce your plan before you write it.** *"I'm going to write the signature and the return statement first, then fill in the loop."* Now your typing is legible, and you don't have to narrate every line.

## What rambling sounds like

Rambling is unfiltered output: every reaction, no commitment. *"Okay so we could maybe sort it, or actually a hash map might, hmm, but then the indices, wait — or two pointers? Two pointers needs sorted though. Hmm. Maybe... let me think. A set maybe?"*

Two things are being inferred from that, and neither is good. First, **low confidence** — nothing was asserted, so nothing can be credited. Second, **no filter** — in a real design review, this person will not be able to compress their thinking into a recommendation, and their teammates will have to do it for them. Senior interviewers care about this a lot more than juniors expect.

## Same thought, rambled vs structured

**Rambled:**

> *"Okay so brute force is like two loops I guess, that's n squared, which is probably too slow? Or maybe it's fine, I don't know how big n is. Hmm, we could sort — no wait, we need indices. A hash map maybe? But what do I put in it, the value? Or the index? I think the value... or maybe both. Let me think. Hmm."*

**Structured:**

> *"Brute force is nested loops, O(n²). With n up to 10⁵ that's 10¹⁰ operations, so it's too slow — we need better than quadratic. Sorting would let me use two pointers, but I need the original indices, so that costs me a re-map. Instead I'll trade space for time: one pass, hash map from value to index, and at each element I look up \`target - nums[i]\`. That's O(n) time, O(n) space. Let me sanity-check it on \`[3, 3]\` with target 6 — yes, that works. I'll go with that."*

Same brain, same twenty seconds of thought, same conclusion. The second version contains four scorable statements: a complexity estimate tied to the actual constraint, a rejected alternative with a reason, a named mechanism, and a validated example. The first contains zero.

The compression trick: **do not speak the search, speak the results of the search.** Think for five seconds, then say the sentence. Five seconds of silence per sentence is invisible; five sentences of visible searching is not.`,
    },
    {
      id: "getting-buy-in",
      heading: "Choosing an Approach and Getting Buy-In Before You Type",
      markdown: `Buy-in is a checkpoint, and it is the cheapest insurance in the entire round. Fifteen seconds of "does this sound right to you?" can save you from fifteen minutes coding the wrong data structure. Skipping it is the single most expensive optimization candidates make.

## Present options with a tradeoff, then commit

Do not present a menu and wait. Present two options, state which one you prefer and why, and ask.

> *"I see two ways. One: sort the intervals by start and sweep — O(n log n) time, O(1) extra space if I can mutate the input. Two: a counting approach over the timeline — that's O(n + range) and only wins if the coordinate range is small, which we don't know. I'd go with sorting; it doesn't depend on the value range. Does that sound reasonable, or is there something about the input I should be weighing?"*

Note the structure: two named approaches, each with a complexity, an explicit preference, an explicit reason for the preference, and an open door. You have shown judgment (you chose) and humility (you asked) in one breath. Presenting five options and no preference shows neither — it reads as pushing the decision onto the interviewer.

## Ask for buy-in explicitly

The failure mode is asking implicitly. You describe your approach, pause, the interviewer says "mm-hm," and you interpret that as approval. "Mm-hm" means "I heard you." Use a question that requires an actual answer:

- *"Does that approach sound right to you before I start coding?"*
- *"Any concerns with that before I commit to it?"*
- *"Is there a constraint I'm not accounting for?"*

Then wait. The silence is two seconds and it is not awkward.

## Read the reaction — hesitation is a hint

Interviewers are usually instructed not to hand you the answer, so their disagreement arrives encoded. Learn the encodings:

| What they say | What it usually means | What to do |
| --- | --- | --- |
| "Sure, go ahead." | Approved. Type. | Type. |
| "Okay... what's the complexity of that?" | The complexity is worse than you think | Derive it out loud, carefully, right now |
| "That'll work. Is it the best you can do?" | It works and is not optimal | Do not start coding. Spend 60 more seconds looking |
| "Walk me through that on the example again." | They think it is wrong | Trace it. You will probably find the hole yourself |
| "Why a heap and not sorting?" | Your choice is unjustified or wrong | Justify it honestly; if you can't, say so and reconsider |
| A pause, then "...okay." | Real hesitation | Ask directly: "You paused — is there a case you're worried about?" |

That last row is the one to internalize. Asking *"you hesitated — is there something you're seeing that I'm not?"* is not weakness. It reads as high-signal self-awareness, and interviewers will almost always tell you, because at that point saying nothing would be sandbagging you.

## What buy-in is actually buying

It converts a 15-minute risk into a 15-second one. If your approach is wrong, you find out now, when the cost is rethinking. If you find out at minute 30, the cost is rethinking *plus* deleting code *plus* recovering your composure with eight minutes left. The candidates who blow up in the back half of a round are almost never the ones who asked at minute 14.`,
    },
    {
      id: "clean-code-under-pressure",
      heading: "Writing Clean Code Under Pressure",
      markdown: `The coding dimension is not scored on whether the code runs. It is scored on the question *would I want to review this person's pull requests?* Everything below is downstream of that question.

## Naming

Single letters cost you for free. \`a\`, \`b\`, \`tmp\`, \`res2\`, \`x\` force the interviewer to hold a mental symbol table while also evaluating your logic, and people who are spending attention on that are not enjoying reading your code.

Exceptions that are fine: \`i\`, \`j\` for plain indices, \`n\` for input size, \`node\` in a traversal, and problem-native symbols (\`k\` when the problem says "k").

| Instead of | Use |
| --- | --- |
| \`l\`, \`r\` | \`left\`, \`right\` |
| \`s\`, \`e\` | \`windowStart\`, \`windowEnd\` |
| \`m\`, \`map\`, \`d\` | \`seen\`, \`freq\`, \`lastIndex\`, \`indexOf\` |
| \`res\`, \`ans\`, \`out\` | \`best\`, \`longest\`, \`matches\`, \`result\` (\`result\` is fine) |
| \`tmp\` | \`carry\`, \`previous\`, \`swapBuffer\` — or delete the variable |
| \`f\`, \`helper\` | \`isValid\`, \`neighborsOf\`, \`expandAround\` |

A good name is documentation you do not have to write and the interviewer does not have to decode.

## Signature and return first

Write the function signature and the return statement before the body. Three seconds, and it forces you to decide the contract — what type comes back, what "no answer" looks like — before you are deep in loop logic. It also means that if you run out of time, the shape of your solution is on the screen.

\`\`\`ts
function lengthOfLongestSubstring(s: string): number {
  let best = 0;
  // ... window logic goes here
  return best;
}
\`\`\`

## Extract a helper instead of nesting four levels

If you are at four levels of indentation, the interviewer has lost the thread. Pull the inner block into a named function. This costs eight seconds and buys legibility plus a name that explains what the block does. It is also a direct signal for the coding dimension: candidates who factor under time pressure are the ones who will factor on the job.

## Edge cases where they belong

A wall of six guard clauses at the top before you have written the algorithm is defensive noise, and half of them will turn out to be unnecessary once the loop exists. Write the main path, then handle edges at the point where they actually arise. Usually you will find the loop already handles the empty case, because it just doesn't execute — and being able to say *"empty input falls out naturally here, the loop body never runs and we return 0"* is stronger than a guard clause that proves you didn't check.

Genuine preconditions (null input, invalid \`k\`) do belong at the top. The test is whether the guard prevents a crash or merely restates the loop's behavior.

## The off-by-one discipline

Off-by-one errors are the single most common bug in live coding, and they are almost entirely preventable by making one decision explicitly instead of implicitly. When you write a loop or an interval, **say the convention out loud and then obey it**:

> *"My window is inclusive on both ends — \`[windowStart, right]\` — so the length is \`right - windowStart + 1\`. And I'm looping \`right\` from 0 to \`s.length - 1\`."*

Now every length computation and every boundary check in the rest of the function has a rule to be checked against, including by the interviewer. The candidates who get bitten are the ones who use half-open intervals in one place and inclusive in another because they never decided.

Corollary: when you compare adjacent elements, you loop to \`n - 1\`, and you should say why — *"I stop at \`n - 1\` because I read \`i + 1\` inside the loop."* Interviewers watch for exactly this line and it takes two seconds.

## Comments should be rare and load-bearing

A comment that restates the code (\`// increment i\`) is worse than nothing. A comment that explains a non-obvious *why* is worth writing: what a map's keys and values mean, why a bound is what it is, what invariant a loop maintains. One or two per solution.

## Do not golf

Chained ternaries, clever bit tricks, one-liners with three operations in them — these read as showing off and they make bugs invisible, including to you. Consistency beats cleverness: if you used \`for...of\` above, use \`for...of\` below.

## Before and after

Same algorithm, both correct:

\`\`\`ts
// Sloppy — correct, and unpleasant to review.
function f(a: number[], b: number): number[] {
  let m = new Map<number, number>();
  for (let i = 0; i < a.length; i++) {
    let t = b - a[i];
    if (m.has(t)) { return [m.get(t)!, i]; }
    m.set(a[i], i);
  }
  return [];
}
\`\`\`

\`\`\`ts
// Clean — same complexity, obviously correct on a first read.
function twoSum(nums: number[], target: number): number[] {
  // Value -> index of an earlier element with that value.
  const seen = new Map<number, number>();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    const matchIndex = seen.get(complement);
    if (matchIndex !== undefined) return [matchIndex, i];
    seen.set(nums[i], i);
  }

  return [];
}
\`\`\`

What changed and why it is scored: the function and parameters say what they are; \`const\` where nothing is reassigned, so the reader knows what moves; the map's contents are documented in one line; \`seen.get\` is called once and stored instead of \`has\` + \`get\` + a non-null assertion (the \`!\` was hiding a type hole); and the "no answer" return is visible at the bottom instead of implied. None of this took extra time. All of it is the difference between "works" and "hire."`,
    },
    {
      id: "testing-your-own-code",
      heading: "Testing Your Own Code by Walking a Real Example",
      markdown: `When you finish typing, do not say "that looks right" and lean back. Verification is one of the four scored dimensions, and "looks right" scores zero on it. There is no compiler, no test runner, and no green checkmark — you are the test runner.

## The discipline: real values, spoken aloud

Put your cursor on line one and walk down it with an actual input, saying the state of every variable as it changes. Not "then we loop through and update the max" — that is describing your intent, and your intent is not the bug. The bug is in the gap between your intent and the characters on the screen, and only literal execution finds it.

The audible version sounds like: *"windowStart is 0, best is 0. right is 0, character is 'a', not in the map, so we set lastSeen a to 0, best becomes max of 0 and 1, so 1. right is 1, character 'b'..."*

Yes, it feels slow. It takes ninety seconds and it is the highest-yield ninety seconds in the round.

## A trace table is faster than prose

For anything with more than two moving variables, write the table. It is faster to produce, far easier to scan, and the interviewer can follow along and catch things with you.

Tracing \`maxProfit([7, 1, 5, 3, 6, 4])\`:

| i | price | minSoFar (before) | price − minSoFar | best (after) |
| --- | --- | --- | --- | --- |
| 0 | 7 | ∞ | — | 0 |
| 1 | 1 | 7 | −6 | 0 |
| 2 | 5 | 1 | 4 | 4 |
| 3 | 3 | 1 | 2 | 4 |
| 4 | 6 | 1 | 5 | 5 |
| 5 | 4 | 1 | 3 | 5 |

Returns 5. Expected 5. Done — and the table is now a durable artifact both of you can point at when discussing a follow-up.

## Which cases to run

You have five to seven minutes. Spend it on four inputs, in this order:

1. **Your worked example from minute six.** You already know the answer, so this is verification rather than a fresh derivation.
2. **Empty or single-element input.** Usually five seconds: *"empty string — \`s.length\` is 0, the loop never runs, we return \`best\` which is 0. Correct."* This is where guard-clause bugs and \`arr[0]\` accesses die.
3. **A duplicate / tie / all-same case.** \`"abba"\`, \`[2, 2, 2]\`, two paths of equal length. This is where the subtle bugs live, because duplicates are where "have I seen this?" and "is it still relevant?" stop being the same question.
4. **The branch you trust least.** You know which one it is — the condition you wrote twice, the \`>=\` you had to think about. Construct an input that reaches it and run it.

## Find your own bug before they point at it

This matters more than avoiding the bug. Two candidates ship the same off-by-one. Candidate A traces, spots it, says *"I have a bug — my window never shrinks when the repeat is outside the current window, so \`\"abba\"\` returns 3 instead of 2. I need to check whether the last-seen index is still inside the window,"* and fixes it in one line. Candidate B says "looks good," and the interviewer says "try \`abba\`."

Candidate A demonstrated self-verification — the exact behavior that makes someone trustworthy without supervision, which is the whole question being answered about an intern. Candidate B demonstrated that their code is correct only when someone is watching. A scores higher, and it is not close.

So say it plainly when you find one. No apologizing, no "oh god, sorry." State the symptom, state the cause, state the fix:

> *"There's a bug here. On \`\"abba\"\`, when I reach the second \`a\`, its last-seen index is 0, which is behind my window start, so I move \`windowStart\` backwards to 1 and the window becomes invalid. The fix is to only jump forward — take the max of the current start and \`lastIndex + 1\`."*

That sentence, delivered calmly, is worth more than a clean first draft.`,
    },
    {
      id: "handling-hints",
      heading: "Handling a Hint Gracefully",
      markdown: `Getting a hint is normal. Interviewers are calibrated on problems they have watched thirty people solve, and most of those thirty needed a nudge somewhere. A hint is not automatically a downgrade — **what you do with it is scored more heavily than the fact you got it**, because coachability is one of the loudest signals available about an intern.

## The four-step response

1. **Take it.** Stop talking and listen to the whole thing. Do not talk over the second half because you think you've got it from the first half — you often haven't, and interrupting a hint is memorable in a bad way.
2. **Say it back in your own words.** *"So you're asking whether I need to move the left pointer one step at a time — if I stored the last index of each character, I could jump straight past the duplicate."* This proves you understood the idea rather than the words, and it gives them a chance to correct your interpretation before you spend five minutes on it.
3. **Integrate it visibly.** Change the code or the plan on the screen, and narrate the change. A hint that produces no visible change reads as ignored.
4. **Credit it and move.** *"Good call, that removes the inner loop."* One clause. Do not thank them three times, do not apologize for missing it, do not spiral. Then keep going.

## What actually kills you

**Arguing with it.** Interviewers give hints because they know the answer. If a hint contradicts your plan, your plan is wrong roughly nine times out of ten. Pushing back reads as un-coachable, which is disqualifying at intern level regardless of how well you code. If you genuinely think the hint doesn't apply, the acceptable phrasing is a question, not a rebuttal: *"I want to make sure I'm following — with the map approach, wouldn't I still need to handle the case where the duplicate is outside the window? Or does that fall out?"* You may still be wrong, but you asked instead of asserted.

**Ignoring it and continuing.** The classic version: interviewer says "what if you sorted first?", candidate says "yeah, maybe" and keeps typing the unsorted approach. The interviewer now has to escalate, the clock burns, and their note says "did not respond to guidance."

**Nodding without understanding.** "Right, yes, of course" followed by code that does not reflect the hint is the worst outcome — you have signalled comprehension you don't have, and now they cannot tell where you actually are. If you did not follow it, say so immediately: *"I don't think I've got it yet — when you say precompute, do you mean before the loop, or per element?"* Asking for a clarification of a hint costs almost nothing. Faking comprehension costs a lot.

## The escalation ladder

Hints come in levels, and each level tells you where you stand. Knowing the ladder lets you self-correct — if you notice the hints getting more specific, you are burning your score and you should ask for help explicitly rather than let them keep escalating.

| Level | Sounds like | What it means for your score |
| --- | --- | --- |
| 0 — Prompt | "What's the complexity of that?" / "Walk me through the example again." | Neutral. Standard interviewer behavior. Costs nothing |
| 1 — Nudge | "Is there work you're repeating across iterations?" | Essentially free. Nearly everyone gets one. Take it and go |
| 2 — Direction | "What if you kept track of what you've already seen?" | Minor. Still comfortably in hire range if you run with it well |
| 3 — Structure | "Try a hash map from character to index." | Real cost. The core insight was handed to you, so you are now being scored on execution — write it cleanly and test it thoroughly |
| 4 — Implementation | "You'll want \`windowStart = Math.max(windowStart, lastIndex + 1)\`." | Significant. Recoverable only by flawless execution plus strong performance on the follow-up |
| 5 — Rescue | Walking you through the whole algorithm | Usually below bar for this round. Salvage what you can; loops are multi-round and other interviewers may not have seen this |

The practical takeaway: **a level-1 or level-2 hint on a medium, handled well, is a normal hire.** Do not tank your composure over it. But if you are receiving level-3 hints on the second problem in a row, the diagnosis is preparation, not nerves.`,
    },
    {
      id: "when-you-go-blank",
      heading: "When You're Stuck or You Go Blank",
      markdown: `You will go blank at some point in some round. The variable being measured is not whether it happens — it is what you do in the next ninety seconds. There is a protocol. Learn it cold, so that you can run it when your working memory is gone.

## Say it out loud first

*"I'm stuck. Let me back up and re-approach."*

Being stuck is not a penalty. Being *silently* stuck for four minutes is a large one, because from the outside it is indistinguishable from having nothing, and it also removes the interviewer's ability to help you. Naming it converts dead air into a visible, deliberate reset — and it usually breaks the panic loop, because you have just given yourself permission to stop pretending.

## The protocol, in order

1. **Restate the problem.** Out loud, in one sentence, from scratch. A surprising number of stuck moments are actually a corrupted problem model from ten minutes ago.
2. **Go back to the concrete example.** Abstract thought is what jammed. Take \`"abcabcbb"\` and solve it by hand, by whatever method a human would use. Then ask what your hand was doing.
3. **Solve a smaller or simpler version.** What if the array were sorted? What if there were no duplicates? What if k were always 1? Solve that, then ask what breaks when you relax the assumption. The relaxation is often the whole algorithm.
4. **Enumerate data structures and ask what each buys you.** Literally walk the list: array, hash map, hash set, stack, queue, heap, sorted array, two pointers, tree, graph. For each: *what does this give me in O(1) that I currently pay O(n) for?* This is mechanical, it works when you are blank, and it can be said out loud as reasoning rather than flailing.
5. **Look for the invariant.** What is true at every step of a correct solution? "The window always contains distinct characters." "The stack is always increasing." Naming the invariant frequently produces the algorithm, because the algorithm is just "restore the invariant when it breaks."
6. **Ask for a nudge.** If two minutes have passed with no movement, ask. *"I've been going in circles on how to shrink the window efficiently. Could I get a nudge?"* This costs you a level-2 hint. Silence costs you more than that, and it costs the clock too.

## The single most reliable unsticking move

> **"What does the brute force do, and what work is it repeating?"**

Nearly every optimization in an interview problem is the elimination of repeated work. The brute force recomputes a sum you could have carried (prefix sums), rescans a window you could have slid (two pointers), re-searches a range you could have halved (binary search), re-solves a subproblem you could have stored (memoization), or re-sorts something already ordered (heap).

So: describe the brute force concretely, then point at the exact operation happening more than once, then ask what structure would let you do it once. This question has a much higher hit rate than staring at the problem hoping for recognition, and — crucially — it is *audible reasoning*, so even the failed attempts earn communication and problem-solving credit.

## Panic management

The physical part is real and it is manageable. When you go blank, your working memory has narrowed, which is exactly the resource the problem needs.

- **Stop typing.** Hands off the keyboard. Typing while blank produces code you will delete.
- **Breathe out, slowly, twice.** The long exhale is the part that works. It takes eight seconds and nobody notices.
- **Write something down.** Move the problem out of working memory and onto the screen: the example, the constraints, the two things you have ruled out. External state is state you don't have to hold.
- **Say the true thing.** *"Give me twenty seconds to reset."* Then take them.
- **Remember who is on the other side.** The interviewer scheduled this, prepared for it, and would rather write a hire than a no-hire — a no-hire means the loop continues and they do this again next week. They are not trying to trap you. When they ask "are you sure about that line?", it is because they want you to catch it.`,
    },
    {
      id: "debugging-live",
      heading: "Debugging Live",
      markdown: `Your code will be wrong on the screen at some point. This is not a bad moment — it is an opportunity, because debugging is the only part of the interview that resembles the actual job, and interviewers know it. A candidate who debugs methodically under observation is showing you exactly what they will be like on their third week when a test fails in CI.

The scored quality is **method**, not speed.

## Reproduce with the smallest failing input

Do not debug against \`"abcabcbb"\` if \`"abba"\` also fails. Shrink the input until it is the smallest thing that still breaks, then trace that. Every character you remove removes state you have to hold. If you don't have a failing input yet — if you only have a feeling — get one first. "I think something's wrong here" is not debuggable.

## Form a hypothesis before you change anything

This is the rule that separates the two kinds of candidates. Before your hands touch the keyboard:

> *"My hypothesis is that \`windowStart\` is moving backwards when the duplicate is outside the current window. If that's true, then on \`\"abba\"\` at index 3, \`windowStart\` should be 1 when it ought to be 2. Let me check that specific value."*

Now the trace has a yes/no question to answer, which takes fifteen seconds. Confirmed, you fix the actual cause. Refuted, you have eliminated a possibility and learned something — also progress.

## Do not shotgun-edit

The anti-pattern, and it is extremely visible from the other side of the screen: change \`<\` to \`<=\`, re-run mentally, doesn't work, change it back, add a \`+ 1\`, move a line, swap two conditions. Random perturbation until the symptom disappears is not debugging. Even when it lands, you cannot explain why your code is correct, so the interviewer cannot credit correctness — and worse, they have now seen how you handle a failing test.

If you catch yourself doing it: stop, hands off, say *"let me stop guessing and trace this properly."* Reclaiming the method out loud after slipping is itself decent signal.

## Binary-search the failure

When you cannot see the bug by reading, bisect the pipeline. Pick a point halfway through the computation and check whether the state is correct *there*. Correct at the midpoint means the bug is downstream; wrong means it is upstream. Two or three bisections localize a bug in a 30-line function.

In a live round the "print statement" is you saying values aloud, or writing them beside the code:

\`\`\`ts
for (let right = 0; right < s.length; right++) {
  const ch = s[right];
  const prev = lastSeen.get(ch);
  if (prev !== undefined) windowStart = prev + 1;
  lastSeen.set(ch, right);
  // Checkpoint: for s = "abba", is [windowStart, right] always distinct?
  // right=3 -> windowStart=1, window "bba" -> NOT distinct. Bug is above this line.
  best = Math.max(best, right - windowStart + 1);
}
\`\`\`

The invariant check at the midpoint localized it in one step: the window is already invalid before \`best\` is computed, so \`best\` is not the problem — the \`windowStart\` update is.

## Narrate the hypothesis, not the anxiety

There is a large difference between *"hmm, that's weird, why isn't that working, oh no"* and *"the output is 3 and should be 2, so I'm over-counting by one — that means my window is one wider than it should be, which points at either the length formula or the start pointer."* Same confusion, opposite signal. The second one is a person you would put on a production incident.

## Stay calm — this part is literally scored

Interviewers watch what happens to you when your code is visibly wrong, because it is a cheap proxy for how you will behave when something breaks with real stakes. Candidates who get flustered, start apologizing, or go quiet and start mashing keys lose points that have nothing to do with the bug. Candidates who say *"okay, it's wrong — let me find out why"* and then proceed in an orderly fashion frequently end up scoring **higher than they would have without the bug**, because they got to demonstrate something the clean path never would have shown.`,
    },
    {
      id: "complexity-analysis",
      heading: "Complexity Analysis at the End",
      markdown: `State time and space complexity without being asked, right after you finish testing. Waiting to be prompted converts something you volunteered into something they had to extract.

## Derive, don't recite

"It's O(n)" is a memorized label. Interviewers can't tell whether you understand it. Derive it in one sentence by pointing at the code:

> *"Each character enters the window once and leaves at most once, so the total pointer movement is bounded by 2n — that's O(n) time. The map holds at most one entry per distinct character, so space is O(min(n, k)) where k is the alphabet size; for ASCII that's O(1) in practice, but I'd state it as O(n) if the alphabet is unbounded."*

That is a derivation. It names the quantity being counted, ties it to a loop or a structure in the code, and it is checkable.

Watch for the specific traps:

- **A loop inside a loop is not automatically O(n²).** In amortized structures — sliding window, monotonic stack — the inner loop's *total* work across the whole outer loop is O(n). Say the word "amortized" and explain: *"the inner while looks quadratic, but each element is pushed and popped at most once, so it's O(n) overall."* This is one of the highest-value sentences in the coding round; a lot of candidates report O(n²) for a linear algorithm and get marked down for analysis they could have done.
- **Sorting is O(n log n) and it dominates a linear pass.** If you sorted, your answer is O(n log n), full stop.
- **Built-ins have costs.** \`Array.prototype.includes\` is O(n). String concatenation in a loop can be O(n²). Slicing copies.

## Always give space, and count the stack

Space is the half candidates forget. Cover three sources:

1. **Auxiliary structures** — maps, sets, arrays you allocated.
2. **The recursion stack** — depth × frame size. A DFS on a tree is O(h), which is O(log n) balanced and O(n) in the degenerate case; on a graph with n nodes it is O(n). Naming the recursion stack unprompted is a reliable signal that you have thought about this before.
3. **The output** — usually excluded by convention, but say so: *"O(n) for the output, O(1) auxiliary."*

## Say what dominates and why

When the analysis has parts, don't just add them — say which term wins:

> *"Building the graph is O(V + E), the BFS is also O(V + E), and the sort at the end is O(V log V). So overall it's O(V log V + E) — the sort dominates unless the graph is dense, in which case E does."*

That sentence shows you can reason about which input regime you are in, which is most of what "complexity analysis" means in practice.

## Be ready for "can you do better?"

This question is not always a hint. Sometimes it is a test of whether you know your bound is optimal. Have an answer in one of these three shapes:

- **"No, and here's the argument."** *"Any correct solution has to look at every element at least once — if it skipped one, an adversary could change that element and flip the answer. So O(n) is a lower bound, and we're at O(n)."* This is the strongest possible answer and it is worth being able to produce.
- **"Yes, in this dimension, at this cost."** *"Time is already linear, but I could drop space from O(n) to O(1) if the alphabet is fixed by using a 26-slot array instead of a map."*
- **"I'm not sure — here's what I'd look at."** *"I don't see how to beat O(n log n). The only lever I see is avoiding the sort, which would need the values to be bounded so I could count them. Is that the direction?"* Honest and directed beats a confident guess.

Never answer "can you do better?" with a flat "no" and nothing else. If it turns out you can, you have just claimed something false about your own solution.`,
    },
    {
      id: "the-rubric",
      heading: "The Rubric: What Is Actually Being Scored",
      markdown: `Nearly every large company's coding round scores the same four dimensions, under slightly different names. Your interviewer fills these in within about ten minutes of the round ending, from notes they took while you talked. Knowing the dimensions tells you where your minutes should go.

| Dimension | What it is really measuring |
| --- | --- |
| **Problem solving** | Can you get from an ambiguous statement to a correct approach, and do you know *why* it works? Not "did you already know this problem" |
| **Coding** | Would I review this person's PRs happily? Structure, naming, correctness, translating an idea into syntax without thrashing |
| **Verification** | Do you check your own work? Do you find your own bugs before someone else does? Do you know what to test? |
| **Communication** | Can I follow your thinking in real time, can you take input, can you disagree productively, would I want to pair with you for six hours? |

They are scored independently. You can be strong-hire on problem solving and no-hire on verification, and the debrief will say exactly that.

## What each level looks like — problem solving

| Level | Observable behavior |
| --- | --- |
| No hire | No viable approach by minute 25; cannot state a brute force; guesses at patterns without checking them against the example |
| Lean no hire | Reaches an approach only after level-3+ hints; cannot explain why it is correct; complexity claims are wrong and stay wrong |
| Lean hire | Gets there with one or two nudges; correct approach, shaky justification; identifies the right complexity when asked |
| Hire | Independently reaches an optimal or near-optimal approach; states the brute force and the mechanism of the optimization; complexity derived unprompted and correct |
| Strong hire | Reaches optimal quickly, justifies correctness via an invariant, compares alternatives with real tradeoffs, anticipates the follow-up before it is asked |

## What each level looks like — coding

| Level | Observable behavior |
| --- | --- |
| No hire | Does not produce running code; can't translate a stated plan into syntax; large sections deleted and rewritten repeatedly |
| Lean no hire | Code roughly works with several bugs; single-letter names throughout; deep nesting; heavy fumbling with basic language constructs |
| Lean hire | Working code with one or two small bugs; readable but unpolished; some awkward structure that they can explain |
| Hire | Clean, correct, idiomatic; sensible names; helper extracted where nesting would have gotten deep; wrote it in roughly one pass |
| Strong hire | Reads like reviewed production code on the first draft; edge cases handled where they belong; no golfing, no dead code, comments only where load-bearing |

## What each level looks like — verification

| Level | Observable behavior |
| --- | --- |
| No hire | Declares done without any check; asserts correctness when the code is visibly wrong; cannot construct a failing input when told one exists |
| Lean no hire | "Looks right to me"; only tests the happy path; interviewer finds every bug; when given a failing input, shotgun-edits |
| Lean hire | Traces the main example properly; catches an issue or two; misses an obvious edge case (empty, duplicate) until prompted |
| Hire | Traces line by line with real values; deliberately picks empty/single/duplicate cases; finds and fixes their own bug calmly, with a stated cause |
| Strong hire | Enumerates edge cases before being asked, tests the branch they trust least, states the loop invariant, explains why the fix is correct and not just why the symptom went away |

## What each level looks like — communication

| Level | Observable behavior |
| --- | --- |
| No hire | Long unexplained silences; ignores hints; argues with correct corrections; interviewer cannot tell what they are doing |
| Lean no hire | Rambles without conclusions; narrates confusion rather than reasoning; needs to be interrupted to be redirected |
| Lean hire | Generally followable; some unframed silence; takes hints but doesn't restate them; explains after the fact rather than during |
| Hire | States hypotheses and tests them aloud; frames silences; restates and integrates hints; asks for buy-in before coding |
| Strong hire | The interviewer never has to ask what they are thinking; disagrees with reasons and updates when shown; the round feels like a good pairing session |

## Intern-specific calibration

The intern bar is different from the new-grad bar in ways that are worth internalizing, because candidates routinely optimize for the wrong thing:

- **Trajectory and coachability outweigh raw speed.** Interviewers are predicting what you'll be like in twelve weeks with a mentor, not what you can do cold today. A candidate who takes a hint, visibly integrates it, and gets faster over the round is scored *up* — improvement inside 45 minutes is the closest thing to direct evidence of learning rate.
- **A clean medium solved with one hint is a solid hire.** This is the single most useful calibration point to hold in your head. It is not "optimal in 20 minutes with no help." It is: correct approach, readable code, you tested it, you took a nudge well.
- **Hards are usually not expected.** If you get one, you are being scored on how far you get and how you think, not on finishing. Say the brute force, say the direction, code what you can.
- **Communication is weighted heavily for interns** because you will spend the summer asking questions and receiving code review. A candidate who codes a little slower but is obviously easy to work with beats a faster candidate who is hard to follow, and this comes up in debriefs constantly.
- **Verification is where interns most often fall short.** It is also the cheapest dimension to fix — it costs five minutes of discipline at the end of every round. Most people leave points on the table here for no reason.`,
    },
    {
      id: "worked-transcript",
      heading: "A Full Transcript: Longest Substring Without Repeating Characters",
      markdown: `What follows is a strong candidate running a 45-minute round end to end on a classic medium. Timestamps are approximate. Italic annotations mark what was just earned; they are not spoken.

---

**[0:00]**

**Interviewer:** Hi — I'm Priya, I'm on the payments platform team, been here about four years. Today's just one coding problem, about 40 minutes, and we'll leave time at the end for your questions. Sound good?

**Candidate:** Sounds good. I'm Marcus, I'm a junior studying CS. Quick thing before we start — do you mind if I keep an eye on the clock? I want to make sure I leave time to test.

**Interviewer:** Please do. Okay — given a string, return the length of the longest substring without repeating characters.

**Candidate:** Got it, let me read it once more and think for a few seconds.

*(Ten seconds of silence, framed. He also just told the interviewer he intends to test, which sets an expectation he will meet.)*

**[1:20]**

**Candidate:** Okay, a few clarifying questions, and then I'll say the problem back to you. First — how long can the string get? Second, what's the character set: lowercase English, ASCII, full Unicode? Third, I want to make sure substring means contiguous here, not subsequence. And what do I return for an empty string — zero?

**Interviewer:** Up to about 10⁵. Assume ASCII, so printable characters, digits, symbols, spaces. Yes, contiguous. And zero for empty is fine.

**Candidate:** Great. So: given a string of up to 10⁵ ASCII characters, I return the *length* — an integer, not the substring itself — of the longest contiguous run in which no character repeats, and zero for the empty string. Is that right?

**Interviewer:** That's right.

*(Four questions, bundled, each with a branch behind it: 10⁵ rules out quadratic, ASCII decides array-vs-map, contiguous-vs-subsequence is the classic misread, and the return type is now unambiguous. Then a one-sentence confirmation. Total elapsed: about forty seconds.)*

**[2:10]**

**Candidate:** Let me write down an example so we're looking at the same thing.

\`\`\`text
s = "abcabcbb"   ->  3     ("abc")
s = "abba"       ->  2     ("ab" or "ba")
\`\`\`

**Candidate:** The first one's the standard case. I picked the second one deliberately because the repeated character comes back after a gap — I suspect that's where the interesting bug is. Let me walk the first one by hand: a, b, c are all new so I'm at three. Then I hit \`a\` again, which is already in my current run, so the run has to break. It restarts from just after the first \`a\` — so \`bca\`, still three. Then \`b\` repeats, and so on. Best stays three.

**Interviewer:** Good.

*(He chose a non-degenerate example, and a second one targeting the known hard case, before writing a line. The \`"abba"\` case is going to matter in about fifteen minutes.)*

**[3:30]**

**Candidate:** Brute force first. I'd take every start index, extend to the right while tracking characters I've seen in a set, and stop when I hit a repeat, keeping the best length. That's O(n²) time — n starts, up to n extensions each — and O(k) space for the set, where k is the alphabet size, so O(1) for ASCII. With n at 10⁵ that's 10¹⁰ operations, way too slow, so we need better.

**Candidate:** I think we can get to linear. The observation is that the brute force redoes work: when I restart at index one, I re-scan almost the same characters I just scanned. Instead I can keep a window \`[windowStart, right]\` that always contains distinct characters, extend \`right\` one step at a time, and when the new character is already inside the window, move \`windowStart\` forward past the previous occurrence. Every index enters and leaves the window once, so it's O(n).

**Candidate:** Do you want me to code the brute force first, or go straight to the sliding window?

**Interviewer:** Go straight to the window. Before you do — when you say "move \`windowStart\` forward past the previous occurrence," how do you find that occurrence?

*(A textbook brute force statement: the procedure, the complexity, the repeated work it does, and the mechanism of the fix. Then he handed the pacing decision over. The interviewer's follow-up is a level-1 nudge aimed at the exact hole in his plan.)*

**[5:40]**

**Candidate:** Right — good question, I hadn't pinned that down. Two options. One: keep a \`Set\` of the characters in the window, and when I hit a duplicate, remove characters from the left one at a time until the duplicate is gone. That's still O(n) overall because each character is removed at most once, but it's an inner while loop. Two: keep a \`Map\` from character to its most recent index, and when I see a duplicate I jump \`windowStart\` straight past it in one step — no inner loop.

**Candidate:** I'd go with the map. Same complexity but the code is flatter, and it makes the jump explicit instead of implicit. My one worry is that the stored index might be *behind* my current window start — from a character that already left the window — and then jumping to it would move the start backwards. I'll need to guard that. Does the map approach sound right to you before I start?

**Interviewer:** It does. Go ahead.

*(He took the nudge, said the idea back in his own words, produced two concrete options with a stated preference and a reason, flagged the exact hazard he was worried about, and asked for explicit buy-in. He will still get this bug wrong in a minute — which is realistic, and which is fine.)*

**[7:30]**

**Candidate:** I'll write the signature and the return first, then fill in the loop.

\`\`\`ts
function lengthOfLongestSubstring(s: string): number {
  // Character -> the most recent index at which we saw it.
  const lastSeen = new Map<string, number>();
  let windowStart = 0;
  let best = 0;

  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    const previousIndex = lastSeen.get(ch);
    if (previousIndex !== undefined) {
      windowStart = previousIndex + 1;
    }
    lastSeen.set(ch, right);
    best = Math.max(best, right - windowStart + 1);
  }

  return best;
}
\`\`\`

**Candidate:** One thing I want to state explicitly: my window is inclusive on both ends, \`[windowStart, right]\`, so its length is \`right - windowStart + 1\`. And \`right\` runs to \`s.length - 1\` because I'm indexing \`s[right]\` directly, not \`s[right + 1]\`.

*(The interval convention is now on the record, which is what makes the bug findable in ninety seconds instead of five minutes. Names are real words. \`const\` where nothing is reassigned.)*

**[12:00]**

**Interviewer:** Okay. Want to walk me through it?

**Candidate:** Let me trace \`"abcabcbb"\` first, since I know that should return 3.

| right | ch | previousIndex | windowStart | best |
| --- | --- | --- | --- | --- |
| 0 | a | — | 0 | 1 |
| 1 | b | — | 0 | 2 |
| 2 | c | — | 0 | 3 |
| 3 | a | 0 | 1 | 3 |
| 4 | b | 1 | 2 | 3 |
| 5 | c | 2 | 3 | 3 |
| 6 | b | 4 | 5 | 3 |
| 7 | b | 6 | 7 | 3 |

**Candidate:** Returns 3. Correct. Now the one I was worried about — \`"abba"\`, which should be 2.

| right | ch | previousIndex | windowStart | best |
| --- | --- | --- | --- | --- |
| 0 | a | — | 0 | 1 |
| 1 | b | — | 0 | 2 |
| 2 | b | 1 | 2 | 2 |
| 3 | a | 0 | **1** | **3** |

**Candidate:** There's the bug. At \`right = 3\` the character is \`a\`, whose last index is 0 — but that \`a\` already fell out of the window when \`windowStart\` moved to 2. So I set \`windowStart\` *backwards* from 2 to 1, the window becomes \`"bba"\`, which has a repeat in it, and I return 3 instead of 2. This is exactly the case I flagged before coding and then forgot to actually guard.

**Candidate:** The fix is that \`windowStart\` must never move backwards. I'll only jump when the previous index is inside the current window — or equivalently, take the max.

\`\`\`ts
if (previousIndex !== undefined && previousIndex >= windowStart) {
  windowStart = previousIndex + 1;
}
\`\`\`

**Candidate:** Re-tracing the last row: \`right = 3\`, \`previousIndex\` is 0, \`windowStart\` is 2, and 0 is not ≥ 2, so we don't move. Length is \`3 - 2 + 1\`, which is 2, and \`best\` stays 2. Correct.

**Interviewer:** Nice catch. Is there a reason you preferred the explicit condition over \`Math.max\`?

**Candidate:** Mostly readability — the condition names the actual rule, which is "only jump if the duplicate is still inside the window." \`Math.max(windowStart, previousIndex + 1)\` is one line shorter and identical in behavior, and I'd be happy with either. I'll keep the explicit version since it documents the invariant.

*(This is the highest-value stretch of the round. He found his own bug, on an input he constructed at minute two, before the interviewer said anything. He stated the symptom, the cause, and the fix separately, then re-verified the specific failing row rather than the whole trace. And he defended a style choice with a reason instead of caving or getting defensive.)*

**[19:00]**

**Candidate:** Let me finish the edge cases. Empty string: \`s.length\` is 0, the loop body never runs, \`best\` is still 0, we return 0 — matches what we agreed. Single character \`"a"\`: one iteration, \`previousIndex\` is undefined, \`best\` becomes 1. All-same, \`"bbbb"\`: at each step the previous index is exactly \`windowStart\`, so the window slides one at a time and \`best\` stays 1. That's the branch I was least sure of, and it's the one that goes through the new \`>=\` comparison at equality, so I wanted to check it specifically.

**Interviewer:** Good. What about a string with spaces or symbols?

**Candidate:** Nothing special — I'm keying the map on the character itself, so \`" "\` and \`"!"\` behave like any other character. It'd only matter if I'd optimized to a 128-slot array indexed by char code, in which case I'd need to be sure the input really is ASCII. Which is actually a reasonable optimization here: since you said ASCII, I could swap the \`Map\` for a \`Int32Array(128)\` of last-seen indices initialized to -1. Same time complexity, lower constant factor, and space becomes strictly O(1). I'd probably keep the map for clarity unless this were on a hot path.

*(Unprompted alternative implementation with an explicit tradeoff and a stated default. This is the difference between hire and strong hire on problem solving.)*

**[22:30]**

**Interviewer:** Give me the complexity.

**Candidate:** Time is O(n). \`right\` advances exactly n times, and \`windowStart\` only ever moves forward, so across the whole run it advances at most n times total — the two pointers together do at most 2n steps of work, and everything inside the loop is a constant-time map operation. So linear, and the map lookups are O(1) average case.

**Candidate:** Space is O(min(n, k)) where k is the alphabet size. The map holds at most one entry per *distinct* character, so with ASCII it's capped at 128 entries, which is O(1) for this problem. If the alphabet were unbounded — full Unicode, say — I'd state it as O(n). No recursion, so no stack cost, and the output is a single integer.

**Interviewer:** Can you do better than O(n)?

**Candidate:** Not on time, and I think that's provable rather than just "I can't see it." Any correct algorithm has to read every character at least once: if it skipped index \`i\`, I could change the character at \`i\` and change the answer, and the algorithm couldn't tell. So O(n) is a lower bound and we're at it. On space, as I mentioned, I can go from a map to a fixed 128-slot array, which is a constant-factor win rather than an asymptotic one — but it does turn the bound from "O(min(n, k))" into a hard O(1).

*(He derived instead of reciting, gave the amortized argument for why two nested pointers are still linear, gave space with the alphabet caveat, mentioned the absent recursion stack, and answered "can you do better" with an adversary argument. That last answer is what separates candidates who know the bound from candidates who memorized the number.)*

**[26:00]**

**Interviewer:** Last thing — suppose I asked you to return the substring itself, not the length.

**Candidate:** I'd track the start index of the best window alongside the length. Right now when \`right - windowStart + 1\` beats \`best\` I only update \`best\`; I'd add a \`bestStart = windowStart\` in that same branch, which means switching from \`Math.max\` to an explicit \`if\` so I can update both together. Then at the end, \`s.slice(bestStart, bestStart + best)\`. Same time complexity; space goes to O(n) because the returned substring is up to n characters — though by convention we usually exclude output space. Want me to write it?

**Interviewer:** No, that's exactly right. Let's stop there. Any questions for me?

**[29:00]**

**Candidate:** Yeah, two. First — you mentioned payments platform. What does an intern actually own there over twelve weeks? I'm curious whether interns ship to production or work on something more sandboxed.

**Interviewer:** Interns ship. You'd get a scoped service or feature with a mentor who reviews everything...

**Candidate:** That's good to hear. Second one: what's the thing that most surprises people about the codebase when they join?

*(Two real questions. The first is about the work, which is the question a person who wants the job asks. The second gets an honest answer and makes the last three minutes a conversation rather than a formality.)*

---

## What the debrief said

> **Problem solving — Hire.** Stated brute force with complexity and identified the repeated work driving the optimization. Needed one small nudge on how to locate the previous occurrence; ran with it immediately and produced two options with a real tradeoff. Volunteered the fixed-array optimization unprompted. Correct adversary argument for the linear lower bound.
>
> **Coding — Strong hire.** Clean first draft. Real variable names, one load-bearing comment, no nesting, stated the interval convention out loud before writing the length formula.
>
> **Verification — Strong hire.** Constructed the adversarial input at minute two, before coding. Traced with a table and real values, found his own bug, separated symptom from cause, re-verified only the failing row. Covered empty, single, and all-same deliberately, and named which branch he trusted least.
>
> **Communication — Strong hire.** Never had to ask what he was thinking. Bundled the clarifying questions, restated the problem, asked for buy-in before coding. Defended a style choice with a reason without getting defensive.
>
> **Overall: Hire, leaning strong.** One nudge on a medium, everything after it was self-driven. Would work with him.

Note what is not in that debrief: he was not fast, he wrote a bug, and he needed a hint. All three are normal. What he did was run the process.`,
    },
  ],
  questions: [
    {
      q: "Walk me through exactly what you'd say in the first three minutes of a coding round.",
      a: "Read the problem twice without talking. Then ask three or four clarifying questions in one bundle — input size, value ranges (negatives, duplicates, empty), what to return when there's no valid answer, and any mutation or memory constraints. Then restate the problem back in one sentence and get confirmation: \"So given up to 10⁵ integers that may repeat, I return the indices of the pair summing to target, or an empty array if none exists — is that right?\" Then write one small non-degenerate example and its expected output where they can see it. That's about ninety seconds of talking and it has locked down my target complexity, my edge cases, my return contract, and my first test case.",
      weak: "I'd introduce myself, read the problem, and ask if I can use any language I want and whether I should handle null inputs. Then I'd start coding so I don't run out of time — I can figure out the details as I go.",
    },
    {
      q: "Why should you state the brute force before optimizing, even when you already see the optimal solution?",
      a: "It does four things in thirty seconds. It proves I understand the problem — I can produce a procedure that returns the right answer. It establishes a correctness baseline I can check my optimized version against later. It sets the complexity ceiling I'm claiming to beat, which lets the interviewer correct me before I chase an impossible bound. And it gives them a hook to hint on, since \"can you avoid recomputing that sum?\" is only askable once I've named the sum. It's also my fallback if I stall. I say it in one sentence with the complexity, then explicitly ask whether they want me to code it or go straight to optimal.",
      weak: "I usually skip it and go straight to the optimal solution to save time — the brute force is obvious and describing it makes me look like I don't know the pattern.",
    },
    {
      q: "You're fifteen minutes in with no working approach. What do you do?",
      a: "I say it out loud — \"I don't have the optimal approach yet\" — and then I make a deliberate choice rather than continuing to flail. Usually that's: \"I'm going to code the O(n²) version so we have something correct, and optimize after if there's time.\" Before I commit, I run one unsticking pass: describe the brute force concretely and ask what work it repeats, because almost every optimization here is eliminating repeated work. If two minutes of that produces nothing, I ask for a nudge explicitly. Staying silently stuck past fifteen minutes is much more expensive than either a brute force or a hint.",
      weak: "I'd keep thinking about it — I don't want to waste time writing a solution that isn't the one they're looking for, and asking for help would signal I couldn't get it on my own.",
    },
    {
      q: "Your interviewer says \"are you sure about that line?\" What does that mean and how do you respond?",
      a: "It means there's a bug on that line. Interviewers don't ask that about correct code. So I don't defend it and I don't just stare — I trace that specific line with real values out loud: \"Let me run it — if s is 'abba' and right is 3, previousIndex is 0 and windowStart is 2, so I'd set windowStart to 1, which moves it backwards. Yeah, that's wrong.\" Then I state the cause and the fix. Finding it myself after the pointer still counts for a lot; arguing that the line is fine costs me on both verification and communication.",
      weak: "I'd re-read it and say \"yeah, I think that's right\" unless I could see something wrong, then wait for them to tell me what they meant.",
    },
    {
      q: "Is it bad if you need a hint?",
      a: "No, and it's the normal case — interviewers run these problems dozens of times and most candidates need a nudge somewhere. What's scored is what I do with it: take the whole hint without interrupting, say it back in my own words to prove I understood the idea rather than the words, visibly change the code or plan, credit it in one clause, and move. Hints do have levels — a nudge like \"is there repeated work here?\" is essentially free, while being handed the actual line of code is a real cost. But a clean medium solved with one hint is a solid hire, especially for an intern, because coachability is one of the things they're explicitly measuring.",
      weak: "It means I couldn't solve it on my own, so I try to avoid needing one. If I get a hint I usually say thanks and keep going with my own approach unless it clearly won't work.",
    },
    {
      q: "How do you avoid rambling while still thinking out loud?",
      a: "Narrate reasoning, not confusion. The rule is: don't speak the search, speak the results of the search. I think for five seconds, then say a sentence with a claim in it — a hypothesis, a rejected alternative with a reason, or a conclusion. \"I considered sorting, but I need the original indices, so it costs more than it saves\" is scorable. \"Maybe sorting? Or a hash map? Hmm, wait\" is not. I also announce transitions — \"let me think quietly for thirty seconds\" — because framed silence reads as composure while unframed silence reads as being stuck.",
      weak: "I try to say everything I'm thinking so the interviewer can see my thought process and give me credit for it even if I don't finish.",
    },
    {
      q: "How do you test your code when there's no compiler and no test runner?",
      a: "I become the test runner: cursor on line one, walk down with a literal input, saying every variable's value as it changes. For anything with more than two moving variables I write a trace table with a row per iteration — it's faster to produce and the interviewer can follow along. I run four inputs in order: the example I worked out at minute six (I already know its answer, so this is verification not derivation), an empty or single-element input, a duplicate or tie case, and whichever branch I trust least. Saying \"this looks right\" scores zero on the verification dimension.",
      weak: "I read back through the code and check the logic makes sense, and I mention the edge cases I'd test if I had more time.",
    },
    {
      q: "You find a bug in your own code while tracing. What exactly do you say?",
      a: "Symptom, cause, fix — calmly, no apologizing. \"There's a bug here. On 'abba', when I reach the second 'a', its last index is 0, which is already behind my window start, so I move windowStart backwards and the window becomes invalid — it returns 3 instead of 2. The fix is to only jump forward, so I'll guard on previousIndex being at least windowStart.\" Then I re-trace just the failing row to confirm. Finding my own bug scores higher than never having written it, because it proves my code is correct when nobody's watching — which is the actual question about an intern.",
      weak: "I'd say \"oh sorry, that's wrong, let me fix that\" and change the line, then move on quickly so it doesn't take up too much time.",
    },
    {
      q: "What's the space complexity of your solution?",
      a: "I answer in three parts and I volunteer it without being asked. Auxiliary structures: the map holds at most one entry per distinct character, so O(min(n, k)) where k is the alphabet size — for ASCII that's a hard cap of 128, so O(1) in practice. Recursion stack: none here, but for a DFS I'd say O(h), which is O(log n) on a balanced tree and O(n) in the degenerate case. Output: a single integer, and I'd note when the output itself is O(n) even though convention usually excludes it. Forgetting the recursion stack is the most common miss.",
      weak: "It's O(n) because I'm using a hash map.",
    },
    {
      q: "The interviewer asks \"can you do better?\" after you've given a correct O(n) solution. What's going on?",
      a: "It's not always a hint — often it's testing whether I know my bound is optimal. So I answer with an argument rather than a guess. Here: any correct algorithm has to read every character at least once, because if it skipped index i, an adversary could change the character at i and flip the answer without the algorithm noticing. So O(n) is a lower bound and I'm at it. Then I offer the dimension where I *can* improve: swapping the map for a fixed 128-slot array makes space a hard O(1). If I genuinely don't know, I say what I'd look at and ask if that's the direction — but I never just say \"no\" with nothing behind it.",
      weak: "I'd say no, this is already linear and you can't do better than that.",
    },
    {
      q: "Which clarifying questions actually matter, and how do you decide?",
      a: "The filter is: can I name both branches? \"If they say yes I do X, if they say no I do Y.\" If I can't finish that sentence, the question is decoration and I cut it. The ones that almost always pass are input size (sets my target complexity), value ranges — negatives, duplicates, empty (kills or saves whole approaches), whether I can mutate the input (in-place vs O(n) extra), and what to return when there's no answer (that's a real branch in my code). The ones that fail are anything the prompt already said, asking about null five separate times instead of \"can I assume well-formed input\", and \"can I use a hash map\" — the answer is always yes.",
      weak: "I try to ask as many as I can think of to show I'm thorough about requirements and I don't make assumptions.",
    },
    {
      q: "You've explained your approach and the interviewer pauses and says \"...okay.\" What do you do?",
      a: "I stop and ask directly: \"You paused — is there a case you're worried about that I'm not seeing?\" Interviewers are usually told not to hand over the answer, so their disagreement arrives encoded — hesitation, \"is that the best you can do?\", \"walk me through the example again\". All of those mean something is wrong. Asking about the hesitation costs fifteen seconds and reads as self-awareness; ignoring it and typing for fifteen minutes on the wrong approach costs the round. They'll almost always tell you, because at that point staying silent would be sandbagging you.",
      weak: "I'd take it as approval and start coding — if there were a real problem they would have said something specific.",
    },
    {
      q: "Your code produces the wrong output on a test case. Walk me through how you debug it live.",
      a: "Shrink first: find the smallest input that still fails, so there's less state to hold. Then form a hypothesis *before* touching anything — \"I think windowStart is moving backwards when the duplicate is outside the window; if so, on 'abba' at index 3 it should be 1 when it ought to be 2.\" Then check that one value. Confirmed means I fix the actual cause; refuted means I've eliminated something. If reading doesn't find it, I bisect: check whether the state is correct halfway through the loop body, which tells me if the bug is upstream or downstream. What I don't do is shotgun-edit — flipping < to <= and moving lines until the symptom disappears is very visible from the other side and leaves me unable to explain why the code is correct.",
      weak: "I'd look at the line where it goes wrong and try changing the condition — usually it's an off-by-one, so adjusting the bounds and re-checking the example is fastest.",
    },
    {
      q: "How do you decide when to stop discussing and start typing?",
      a: "Minute fifteen is a hard commit deadline in a 45-minute round. I can still be wrong at fifteen; I can't still be undecided. Coding takes about eighteen minutes and testing takes seven, so anything past fifteen eats into the part where I demonstrate verification. The trigger sentence is: \"I want to start coding — I'll go with the hash-map approach and I'll flag it if I hit a wall.\" The mirror-image mistake is worse than people think though: starting to type at minute three because silence feels like failure. Approach failures cost far more than typing failures, because typing is fast and rethinking with an interviewer watching is not.",
    },
    {
      q: "What are interviewers actually scoring, and where do interns most often lose points?",
      a: "Four independent dimensions: problem solving (can you get from an ambiguous statement to a correct approach and say why it works), coding (would I enjoy reviewing this person's PRs), verification (do you check your own work and find your own bugs), and communication (can I follow you in real time and would I want to pair with you). Interns lose points most often on verification, because it's the one people skip when the clock is tight — and it's the cheapest to fix, it's five minutes of discipline at the end of every round. The intern calibration is also worth knowing: trajectory and coachability outweigh raw speed, and a clean medium solved with one hint is a solid hire.",
      weak: "Mostly whether you get the optimal solution and how fast. Communication helps but the code is what really counts.",
    },
    {
      q: "You go completely blank mid-problem. What's your recovery protocol?",
      a: "Say it out loud first — \"I'm stuck, let me back up\" — because silent stalling is the actual penalty and it also stops the interviewer from helping. Then, in order: hands off the keyboard, restate the problem from scratch (a lot of stuck moments are a corrupted problem model), go back to the concrete example and solve it by hand, solve a smaller version and ask what breaks when I relax the assumption, walk the data structures out loud asking what each buys me in O(1) that I'm currently paying O(n) for, and look for the invariant. The single most reliable move is \"what does the brute force do and what work is it repeating?\" — almost every optimization here is eliminating repeated work. If two minutes pass with no movement, I ask for a nudge.",
      weak: "I'd stay quiet and think until I figure it out — I don't want to say something wrong and make it worse, and I'd rather come back with the right answer than think out loud badly.",
    },
  ],
  relatedProblems: [
    "longest-substring-without-repeating-characters",
    "two-sum",
    "best-time-to-buy-and-sell-stock",
    "valid-parentheses",
    "group-anagrams",
    "product-of-array-except-self",
    "binary-search",
    "course-schedule",
    "number-of-islands",
    "merge-intervals",
    "coin-change",
    "validate-binary-search-tree",
    "lru-cache",
    "longest-repeating-character-replacement",
  ],
};
