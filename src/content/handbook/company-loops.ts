import type { HandbookChapter } from "./types";

export const chapter: HandbookChapter = {
  slug: "company-loops",
  title: "Company-by-Company Interview Loops",
  track: "process",
  order: 2,
  summary:
    "A reference on how intern interview loops are generally reported to run at major employers — stages, question flavor, behavioral weighting, and how to prepare for each. Structural knowledge only, and hedged on purpose.",
  estMinutes: 50,
  tags: [
    "interview loops",
    "big tech",
    "quant",
    "startups",
    "company research",
    "process",
    "behavioral",
  ],
  sections: [
    {
      id: "read-this-first",
      heading: "Read this first: what this chapter is and isn't",
      markdown: `**Interview processes change constantly.** Companies reorganize recruiting,
swap assessment vendors, add and remove rounds, and run different loops for
different orgs *within the same company in the same cycle*. A team in one
business unit can have a completely different intern process from a team two
floors away.

So here is the contract for this chapter:

**What it contains.** Structural knowledge that has been stable across multiple
recent cycles: roughly how many rounds a loop has, what kinds of rounds they are,
what flavor of question the company is known to favor, how heavily the behavioral
component is weighted, and what that implies for how you prepare.

**What it deliberately does not contain.** Specific interview questions attributed
to a company, pass rates, "the bar is X," precise cutoff scores, or anything else
that would be a number invented for the sake of sounding authoritative. Where you
see a range, read it as "commonly reported," not "guaranteed."

### Verify before you rely on any of it

Do these three things for every company you're seriously prepping for, ideally in
the week before your loop:

| Source | What to get from it |
| --- | --- |
| The company's own careers / university-recruiting page | The official stage list, which they usually publish. This overrides everything here. |
| Your recruiter — ask them directly | The single best source. Recruiters answer "what does the loop look like and what should I focus on?" freely; it's their job. Ask on the screening call. |
| Recent candidate reports (last 6-12 months only) | Blind, r/csMajors, Glassdoor, your school's Discord, and anyone in your network who interviewed there. Weight recency heavily and discount emotional posts. |

Also: **ask your recruiter what the rounds are and how long each is.** People
skip this out of some vague fear it looks unprepared. It does not. It looks
organized, and it's the fastest way to make everything below unnecessary.

### One more caveat about intern loops specifically

Intern loops are almost always **shorter and more coding-weighted** than the
full-time loops these companies are famous for. Intern candidates generally do
*not* get a full system design round, do not get a deep architecture interview,
and often get one or two technical rounds where a full-time candidate would get
four or five. When you read prep material online, check whether it describes the
intern loop or the new-grad/experienced loop — conflating them is the most common
way people over-prepare for the wrong thing.`,
    },
    {
      id: "anatomy-of-a-loop",
      heading: "The anatomy of a loop, and where to spend prep time",
      markdown: `Nearly every intern process is drawn from the same small set of building blocks.
Once you can name the blocks, a new company's process is just a different
ordering of things you already know how to prepare for.

| Block | Typical length | What it's testing |
| --- | --- | --- |
| Resume screen | — | Keywords, relevance, school/experience heuristics, sometimes a human |
| Online assessment (OA) | 60-120 min | Speed and correctness under time pressure, unassisted |
| One-way video (HireVue-style) | 20-40 min | Communication, basic motivation fit; common at banks and large non-tech firms |
| Recruiter screen | 15-30 min | Logistics, availability, work authorization, interest |
| Technical phone/video screen | 45-60 min | Core coding with an interviewer; the most common single round in existence |
| Full loop (2-4 back-to-back rounds) | 2-4 hours | Coding depth, fundamentals, behavioral, sometimes light design |
| Take-home | 2-6 hours of work | Judgment, code organization, communication |
| Behavioral / values round | 30-45 min | Culture fit as that company defines it |
| Hiring committee / calibration | — | A separate group reviewing packets; you never see it |
| Team match | 1-8 weeks | Whether a specific team wants you and has headcount |

### The cross-company shape at a glance

Everything below is a rough characterization of intern loops as commonly
reported. Treat the numbers as typical ranges, not commitments.

| Company | OA? | Technical rounds (intern) | Behavioral weight | The distinctive thing |
| --- | --- | --- | --- | --- |
| Google | Sometimes | ~2 | Low-medium | Algorithmic depth; hiring committee decides, not the interviewer |
| Meta | Sometimes | ~2 | Medium | Speed — expect to solve more than one problem per round |
| Amazon | Usually | ~1-2 | **Very high** | Leadership Principles are scored explicitly in every round |
| Microsoft | Sometimes | ~2-4 | Medium | Conversational; often the most collaborative feel of the big five |
| Apple | Rarely | ~2-4 | Medium | Team-specific — no single Apple loop exists |
| Netflix | Rarely | ~2-3 | High | Culture memo alignment; very small intern cohort |
| Nvidia | Sometimes | ~2-3 | Low-medium | Domain-specific: CUDA/systems/hardware depth over generic LeetCode |
| AI labs | Sometimes | ~3-4 | Medium-high | Practical ML/engineering; research-track and engineering-track loops differ |
| Stripe | Sometimes | ~2-4 | Medium | Practical/applied — real code, real APIs, integration tasks over puzzles |
| Databricks | Usually | ~2-3 | Low-medium | Algorithmic plus data-systems awareness |
| Snowflake | Usually | ~2-3 | Low-medium | Algorithms plus database/systems fundamentals |
| Palantir | Sometimes | ~2-4 | Medium | The decomposition round: model a messy real-world problem |
| Bloomberg | Usually | ~2-3 | Medium | Strong C++/data structures emphasis, plus practical coding |
| Salesforce | Sometimes | ~2-3 | Medium-high | Values-forward behavioral; large, structured program |
| Uber | Usually | ~2-3 | Medium | Standard algorithms, practical bent |
| Airbnb | Sometimes | ~2-3 | **High** | Explicit values-based round; code quality over cleverness |
| Quant firms | Usually | ~3-5 | Low | Probability, mental math, and brutal implementation speed |
| Startups | Sometimes | ~2-3 | Medium | Take-homes, pairing, shipping ability, and "would I sit next to this person" |

### Where to spend prep time

If you have a fixed number of hours, this is roughly how they should be
allocated for a generic big-tech intern loop:

| Area | Share of prep | Why |
| --- | --- | --- |
| Core coding patterns (arrays/hashing, two pointers, sliding window, binary search, trees, graphs/BFS-DFS, heaps, intervals, basic DP) | 55% | This is the overwhelming majority of what intern loops test |
| Talking while coding, out loud, with a human or a timer | 20% | The most under-practiced and most heavily scored skill |
| Behavioral story bank | 15% | Cheap to build, and the reason many technically strong candidates get dinged |
| Company-specific quirks (this chapter) | 5% | Real but marginal — it changes emphasis, not substance |
| CS fundamentals (OS, concurrency, networking, databases) | 5% | Rarely decisive for interns except at systems-flavored companies |

The one adjustment worth making: if you're interviewing at Amazon, move
behavioral from 15% to 30%, and take it from coding. If you're interviewing at a
quant firm, add probability and mental math as a whole separate track.`,
    },
    {
      id: "google",
      heading: "Google",
      markdown: `**Distinctive thing:** algorithmic depth, and the fact that **your interviewers do
not make the decision**. Interviewers write detailed structured feedback, and a
separate hiring committee reviews the written packet. This has real consequences
for how you should behave in the room.

### Typical intern process

| Stage | Notes |
| --- | --- |
| Application / resume screen | Rolling; volume is enormous |
| Online assessment | Has been used in some cycles and skipped in others; don't assume either way |
| Technical interviews | Commonly two rounds of ~45 minutes for interns |
| Host/team matching | Separate from the interviews. You can pass interviews and still not get an offer if no host takes you — this is a well-known and frustrating part of the process |

### Question flavor

Classic data-structures-and-algorithms, generally well-posed and clean. Expect
trees, graphs, recursion, hashing, and dynamic programming to show up more than
at most companies. Interviewers tend to care about optimal complexity and will
usually push you toward it if your first solution isn't there. Follow-ups often
extend the problem ("now what if the input doesn't fit in memory," "now make it
work for a stream").

### Behavioral component

Comparatively light for interns — often folded into a few minutes at the start of
a technical round ("tell me about this project"). Googleyness is assessed, but
for intern loops it rarely carries the weight it does at Amazon.

### How to prepare

1. **Practice writing the packet, not just solving the problem.** Because a
   committee reads the interviewer's notes, everything you want credited has to
   be *said out loud* so it can be written down. Silent brilliance is invisible.
2. **State complexity unprompted**, for both time and space, and state it again
   after you optimize.
3. **Go deep on graphs and trees.** These are disproportionately represented.
4. **Practice the follow-up.** Getting the first solution is often only half the
   round; the differentiator is what you do when they extend it.
5. **Write compilable code.** Handwritten-quality code with real syntax matters
   more here than at companies that treat the code as a whiteboard sketch.
6. **Expect the host-matching gap.** If you get "we'd like to keep your packet
   active for matching," that's a genuine state, not a soft rejection — but keep
   interviewing elsewhere while it resolves.`,
    },
    {
      id: "meta",
      heading: "Meta",
      markdown: `**Distinctive thing:** **speed**. Meta rounds are commonly reported to include
more than one problem in a 45-minute slot, which means the implicit expectation
is that you recognize the pattern quickly, implement without fumbling, and move
on. A candidate who solves one problem beautifully in 40 minutes can score worse
than one who solves two adequately.

### Typical intern process

| Stage | Notes |
| --- | --- |
| Resume screen / referral | — |
| Online assessment | Used in some cycles |
| Technical interviews | Commonly two rounds of ~45 minutes for interns, often labeled around coding ability |
| Team matching | Meta does team matching after the interview decision for many roles |

### Question flavor

Medium-difficulty, high-frequency algorithm problems rather than exotic ones.
Strings, arrays, hashing, trees, graphs, and the standard interval and
two-pointer patterns. Meta tends to favor problems with clean, well-known optimal
solutions — which is exactly what makes speed the discriminator, because the
interviewer expects you to have seen the shape before.

### Behavioral component

Moderate. Sometimes a dedicated portion, more often woven in. Meta's culture
language around moving fast and having impact is worth being able to speak to
credibly with a real example.

### How to prepare

1. **Practice with a hard timer at ~20 minutes per problem**, including writing
   working code. This is the single highest-yield Meta-specific adjustment.
2. **Do volume on the well-known medium problems.** Breadth of recognized
   patterns beats depth on any single one here.
3. **Clarify fast, then commit.** Long open-ended requirement-gathering eats the
   clock. Two crisp clarifying questions, state your assumption, start.
4. **Don't over-optimize prematurely.** State the brute force in one sentence,
   state the optimal approach, get agreement, code the optimal one.
5. **Have a "moved fast and shipped" story** ready for the behavioral portion, and
   ideally one about a tradeoff you knowingly took to ship sooner.`,
    },
    {
      id: "amazon",
      heading: "Amazon",
      markdown: `**Distinctive thing:** the **Leadership Principles**, which are not a soft
add-on. They are published publicly, interviewers are assigned specific
principles to probe, and behavioral answers are scored with the same weight as
code. It is entirely possible to write correct code at Amazon and be rejected for
thin LP answers — this happens constantly.

### Typical intern process

| Stage | Notes |
| --- | --- |
| Application | Opens very early in the cycle; Amazon is often among the first big employers to post |
| Online assessment | Almost always. Commonly reported as coding problems plus a work-styles/behavioral survey and sometimes a work-simulation section |
| Technical + behavioral interview(s) | Commonly one or two rounds for interns, each mixing coding with LP questions |

### Question flavor

Coding is generally standard and not exotic — arrays, hashing, trees, graphs,
sorting, BFS/DFS. Amazon's coding bar for interns is usually described as
approachable relative to Google or Meta; the filtering happens on the behavioral
side. The OA's non-coding sections are scored, so clicking through the work-styles
survey carelessly is a real way to fail.

### The Leadership Principles

They are public — read the current list on Amazon's site, because it has changed
over time. The ones that come up most often for interns tend to be **Customer
Obsession, Ownership, Dive Deep, Bias for Action, Learn and Be Curious, Deliver
Results,** and **Earn Trust**.

### How to prepare

1. **Build a story bank of 8-12 stories mapped to principles**, where each story
   can serve two or three principles. You do not need one story per principle;
   you need stories with enough substance to be angled.
2. **STAR, strictly**, and spend most of the time on **Action** — what *you*
   specifically did. Amazon interviewers are trained to dig, and "we did X" gets
   interrupted with "what did *you* do?"
3. **Have numbers.** "Reduced page load from 4s to 900ms" is worth ten times "made
   it faster." Dive Deep in particular is about whether you know the details of
   your own work.
4. **Prepare failure stories.** Several principles are best served by things that
   went wrong, and candidates who only have wins come across as either
   inexperienced or unreflective.
5. **Expect drill-down.** For every story, know: why you chose that approach, what
   the alternative was, what the data said, what you'd do differently, and what
   happened afterwards.
6. **Don't neglect the OA.** Take it seriously including the non-coding parts, and
   note Amazon often shows the debugging/test-case behavior of your code, so
   handle edge cases explicitly.`,
    },
    {
      id: "microsoft",
      heading: "Microsoft",
      markdown: `**Distinctive thing:** the loop is generally reported as the most
**conversational and collaborative** of the big five. Interviewers frequently
treat the round as a working session, offering hints and discussing tradeoffs, and
the signal being read is substantially "would this person be good to work with."

### Typical intern process

| Stage | Notes |
| --- | --- |
| Application | Opens early; Microsoft is often among the first postings of the cycle |
| Online assessment / Codility-style screen | Used in some cycles and regions |
| Campus or first-round interview | Common where Microsoft recruits on-campus |
| Final loop | Commonly two to four rounds, mixing coding, fundamentals, and behavioral |

### Question flavor

Solid mid-difficulty data structures and algorithms, often with a practical or
implementation flavor rather than a competitive-programming flavor: string
manipulation, linked lists, trees, hash maps, and design-a-simple-class problems.
Microsoft asks OOP and API design questions more often than most ("design a class
that supports these operations") and is comfortable with questions about your
actual project work.

### Behavioral component

Moderate and genuinely conversational. Expect real interest in your projects,
your learning process, and how you handle disagreement or ambiguity. Microsoft's
"growth mindset" language is part of the culture and worth being able to speak to
with an actual example of learning from failure.

### How to prepare

1. **Practice explaining while coding.** The collaborative style rewards people
   who narrate; interviewers here will engage with your reasoning.
2. **Take the hints.** Interviewers offer them deliberately, and refusing to
   engage with a hint reads much worse than needing one.
3. **Be able to design a small class or API cleanly** — constructor, methods,
   invariants, error cases. This shows up more here than at algorithm-heavy shops.
4. **Know one project deeply enough to be interrogated about it**, including
   what you'd redesign.
5. **Have a growth-mindset story**: something you were bad at, what you did, and
   the evidence it improved.`,
    },
    {
      id: "apple",
      heading: "Apple",
      markdown: `**Distinctive thing:** there is **no single Apple loop**. Apple hires into
specific teams, and each team runs its own process with its own emphasis. Two
Apple intern candidates in the same cycle can have almost nothing in common in
their experiences. This makes generic Apple prep advice unusually unreliable and
makes asking your recruiter unusually valuable.

### Typical intern process

| Stage | Notes |
| --- | --- |
| Resume screen | Often team-driven; a hiring manager pulls resumes for a specific req |
| Recruiter or manager phone screen | Frequently the manager themselves, and frequently technical |
| Technical rounds | Commonly two to four, varying widely by team; sometimes back-to-back on one day |
| Occasional take-home or domain exercise | Depends entirely on the team |

### Question flavor

Depends on the org. Broad patterns commonly reported:

| Team type | Emphasis |
| --- | --- |
| Embedded / silicon / low-level | C, memory, pointers, bit manipulation, concurrency, RTOS concepts |
| iOS / macOS application teams | Swift or Objective-C, UIKit/SwiftUI knowledge, memory management (ARC, retain cycles), practical app architecture |
| Services / backend | More conventional algorithms and distributed-systems-lite discussion |
| ML / data | Applied ML plus solid coding |

Across teams, Apple interviewers are widely described as asking **detail-level
follow-ups about the technology you claim to know**. If your resume says C++,
expect to be asked about C++ specifically and in depth.

### Behavioral component

Moderate and team-flavored. Genuine enthusiasm for the product area matters here
more than at most large companies, and interviewers frequently probe whether you
actually care about the domain rather than just wanting the logo.

### How to prepare

1. **Find out which team you're interviewing with and prepare for that domain.**
   This is the whole game at Apple. Ask the recruiter directly.
2. **Be ready to be interrogated on your resume's technology claims** — do not
   list a language you can't discuss at depth.
3. **If it's an embedded or systems team**, review pointers, memory layout, bit
   manipulation, and concurrency primitives specifically; generic LeetCode alone
   is poor preparation.
4. **If it's an app team**, know the platform's memory model and lifecycle
   concepts, not just the language syntax.
5. **Have a real reason you care about the product area.** "I want to work at
   Apple" is not one.`,
    },
    {
      id: "netflix-nvidia",
      heading: "Netflix and Nvidia",
      markdown: `Grouped because both run small, specialized intern cohorts where **domain fit
matters more than generic algorithm grinding** — but for very different reasons.

## Netflix

**Distinctive thing:** an unusually explicit culture, published at length, and an
interview process that takes it seriously. Netflix's intern program is small, and
the company's well-known preference for high autonomy and directness shows up in
how interviews are conducted — expect candor, expect to be asked what you think
rather than what you know, and expect judgment questions.

| Stage | Notes |
| --- | --- |
| Recruiter screen | Often includes real discussion of the culture document |
| Technical rounds | Commonly two to three; practical coding with an emphasis on clean, maintainable solutions |
| Culture / values round | Frequently a distinct and heavily weighted conversation |

**How to prepare:** read the current Netflix culture memo and form an actual
opinion about it — being able to say "the part about context over control
resonates because of X in my own experience" is the expected register. Practice
speaking directly about tradeoffs and about times you disagreed with someone.
Technically, favor practical, production-flavored coding over puzzle work.

## Nvidia

**Distinctive thing:** the loop is **domain-specific to a degree most software
companies aren't**. Nvidia intern roles span GPU architecture, CUDA and kernel
work, compilers, drivers, deep learning frameworks, and conventional software —
and the interview reflects whichever one you applied to.

| Stage | Notes |
| --- | --- |
| OA or technical screen | Used variably; sometimes domain-flavored rather than generic |
| Technical rounds | Commonly two to three, often with the team you'd join |
| Manager conversation | Fit, project interest, and often deeper domain probing |

**Question flavor:** C and C++ come up heavily. For systems and GPU roles, expect
memory hierarchy, parallelism, concurrency, pointer-level questions, bit
manipulation, and performance reasoning. For deep-learning roles, expect Python,
framework internals, and applied ML understanding. Generic LeetCode is necessary
but not sufficient.

**How to prepare:** identify the org, then prepare its fundamentals — for GPU and
systems roles that means memory, caching, parallel execution models, and being
able to reason about why code is slow. Be genuinely comfortable in C/C++ if you
claim it. Have a story about optimizing something and be able to explain how you
measured it.

**Behavioral component for both:** lighter than at Amazon, but at Netflix the
values round is real and at Nvidia genuine domain enthusiasm carries weight.`,
    },
    {
      id: "ai-labs",
      heading: "OpenAI, Anthropic, and AI-lab-tier companies",
      markdown: `**Distinctive thing:** these companies generally run **at least two different
kinds of loop** — a research-oriented one and an engineering-oriented one — and
the engineering loop is usually more practical and less puzzle-driven than
big-tech's. Cohorts are small, processes change frequently (this section is the
most likely in the chapter to go stale), and the bar on "can you actually build
things" tends to be high relative to "can you recall an algorithm."

### Typical process

| Stage | Notes |
| --- | --- |
| Application / referral | Small cohorts, so referrals and demonstrated work matter disproportionately |
| Recruiter screen | Often includes real discussion of your interest in the domain and the company's mission |
| Technical screen | Practical coding, sometimes in a real editor with real tooling rather than a whiteboard-style pad |
| Technical rounds | Commonly two to four; may include a longer practical/applied exercise, debugging, or working with an existing codebase |
| Research-track variants | For research-flavored roles, expect discussion of papers, ML fundamentals, and possibly a research-taste conversation |
| Values / mission alignment | Frequently a real round, particularly at labs with explicit safety or mission commitments |

### Question flavor

Commonly reported to lean **applied**: write working code that does a real thing,
debug something, extend an existing implementation, reason about a system you'd
actually build. ML-flavored roles ask about fundamentals (how backprop works, why
a training run diverges, what you'd check when a model underperforms) more than
about exotic architectures. Some loops are conducted with normal editors,
documentation access, and sometimes AI tooling allowed — check with the recruiter,
because the norms here vary more than anywhere else.

### Behavioral / values component

Weighted more heavily than at most tech companies. These organizations tend to
care whether you have thought seriously about the implications of the work, not
just whether you find it technically exciting. Vague enthusiasm reads poorly;
having an actual, defensible view — including reservations — reads well.

### How to prepare

1. **Build and ship something in the domain.** A real project using the relevant
   tools is worth more here than fifty extra LeetCode problems.
2. **Be fluent in Python** and comfortable moving quickly in a real codebase.
3. **Solidify ML fundamentals** if you're targeting anything ML-adjacent: the
   training loop, overfitting, evaluation, and how you'd debug a model that isn't
   learning.
4. **Read what the company publishes.** These organizations write a lot publicly,
   and having read it is both an advantage and a basic signal of interest.
5. **Form a real opinion on the mission**, including tensions in it. Prepare to
   discuss it like an adult rather than like a fan.
6. **Ask the recruiter about tooling rules** for the technical rounds — whether
   you can use documentation, your own editor, or AI assistance. The answer
   varies and it changes how you should practice.`,
    },
    {
      id: "stripe",
      heading: "Stripe",
      markdown: `**Distinctive thing:** the loop is famously **practical and applied** rather than
algorithmic. Stripe's interviews are widely described as resembling actual work:
integrate with an API, parse and process real-looking data, debug an existing
program, implement a feature in a small provided codebase. Puzzle-style
algorithm questions are comparatively rare.

### Typical intern process

| Stage | Notes |
| --- | --- |
| Application / referral | — |
| Online assessment or take-home | Used in some cycles; practical in flavor |
| Technical screen | Often an implementation task in a real editor, with documentation and internet access commonly permitted |
| Loop | Commonly two to four rounds: more implementation, debugging, sometimes an integration or API-design conversation, plus behavioral |

### Question flavor

Expect to write code that runs. Common shapes include: consume a paginated API
and aggregate results; implement a small state machine or transaction-like
behavior; extend a partially built program; find and fix a bug in code you didn't
write; handle errors, retries, and edge cases correctly. Correctness, error
handling, and readable code are the scored dimensions much more than asymptotic
optimality.

### Behavioral component

Moderate and substantive. Stripe cares about clarity of communication and written
thinking — the company has a strong internal writing culture — so being able to
explain a decision crisply matters.

### How to prepare

1. **Practice in a real dev environment**, not a coding pad. Set up a project,
   run it, use a debugger, read errors. If you only ever practice in LeetCode's
   editor, this loop will feel alien.
2. **Get comfortable reading unfamiliar code fast.** Clone a mid-size open source
   project and fix a small bug in it, on a timer.
3. **Practice consuming an HTTP API** in your language of choice: auth, pagination,
   rate limits, retries, and error handling. This is the archetypal Stripe task.
4. **Handle errors explicitly.** Silent failure paths are the most commonly cited
   miss in practical loops.
5. **Write tests or at least verify your work by running it.** "It should work" is
   a poor answer when you have a terminal in front of you.
6. **Know something real about payments** — idempotency, why retries are dangerous
   with money, what a webhook is. It's not required, and it's noticeable.`,
    },
    {
      id: "databricks-snowflake",
      heading: "Databricks and Snowflake",
      markdown: `Grouped because both are data-infrastructure companies whose intern loops
combine **conventional algorithmic rigor with an expectation that you understand
data systems** at least conceptually.

## Databricks

| Stage | Notes |
| --- | --- |
| Online assessment | Commonly used, and commonly reported as on the harder end for an intern OA |
| Technical rounds | Commonly two to three; algorithms plus discussion of your projects |
| Sometimes a domain or design conversation | Lightweight for interns |

**Distinctive thing:** the algorithmic bar is generally described as high, with a
competitive-programming flavor in the OA specifically. Beyond that, Databricks is
a Spark/data-platform company, and interviewers appreciate candidates who
understand what distributed data processing actually involves.

**Question flavor:** solid medium-to-hard algorithms — graphs, DP, heaps,
intervals — plus implementation-heavy problems where getting a correct, efficient
solution written in the time is the challenge.

## Snowflake

| Stage | Notes |
| --- | --- |
| Online assessment | Commonly used |
| Technical rounds | Commonly two to three; algorithms with a systems and database flavor |
| Manager / fit round | Common |

**Distinctive thing:** a database company that expects you to know something about
databases. Alongside standard algorithms, questions about SQL, indexing, query
behavior, transactions, and concurrency come up more than at a generic product
company.

**Question flavor:** standard data structures and algorithms, plus SQL and
database fundamentals. Systems questions (concurrency, memory, caching) appear for
some teams.

### How to prepare for both

1. **Do the algorithmic work properly.** These are not loops where practical
   charm substitutes for getting the optimal solution.
2. **Learn the data-systems vocabulary**: partitioning, shuffling, joins, columnar
   vs row storage, why a distributed join is expensive.
3. **For Snowflake specifically, be able to write real SQL** — joins, group by,
   window functions — and explain what an index does and when it doesn't help.
4. **Have a project involving data at some scale** if you can, and be able to
   explain the bottleneck you hit and how you diagnosed it.
5. **Practice hard OAs on a timer**, since for Databricks in particular the OA is
   a meaningful filter rather than a formality.`,
    },
    {
      id: "palantir",
      heading: "Palantir",
      markdown: `**Distinctive thing:** the **decomposition round**. Palantir is well known for an
interview that isn't a LeetCode problem and isn't a classic system design
question either: you're given a messy, real-world, ambiguous problem and asked to
model it — identify the entities, the relationships, the operations, the edge
cases, and the data structures you'd use, out loud, collaboratively.

### Typical intern process

| Stage | Notes |
| --- | --- |
| Application / OA | An assessment is used in some cycles |
| Technical screen | Coding, generally practical |
| Decomposition round | The signature round; modeling an open-ended problem with the interviewer |
| Additional technical / behavioral rounds | Commonly totalling two to four rounds overall |

### Question flavor

**Coding:** practical rather than exotic. Clean implementation, sensible data
structures, working code.

**Decomposition:** deliberately underspecified problems drawn from realistic
domains — modeling something operational, messy, and full of exceptions. The
interviewer will feed you complications as you go. What's being scored:

| Signal | What good looks like |
| --- | --- |
| Clarifying | You ask what the system is *for* before designing it |
| Structure | You decompose into entities and operations rather than jumping to code |
| Data modeling | You choose representations and can justify them |
| Handling ambiguity | You state assumptions explicitly instead of freezing |
| Iteration | When they add a complication, you adapt the model rather than defending it |
| Communication | The interviewer can follow you without effort |

### Behavioral component

Moderate. Palantir cares about how you think about the problems the company works
on, and mission questions are genuine rather than decorative. Given the nature of
their customers, having thought about the work honestly is worth doing.

### How to prepare

1. **Practice modeling out loud with a whiteboard and no code.** Take everyday
   systems — a parking garage, a hospital's shift scheduler, a library's holds
   queue, an airline's baggage tracking — and model them in 30 minutes. Entities,
   relationships, operations, failure cases.
2. **Ask what the system is for, first, every time.** Requirements before design
   is most of the score.
3. **State assumptions aloud** rather than silently choosing.
4. **Expect the goalposts to move**, and treat that as the point of the exercise
   rather than as unfairness.
5. **Don't reach for a framework.** Canned system-design templates (load
   balancers, caches, sharding) land badly here — this round is about domain
   modeling, not infrastructure diagrams.
6. **Be prepared to discuss the company's work seriously**, including the parts
   people have opinions about.`,
    },
    {
      id: "bloomberg",
      heading: "Bloomberg",
      markdown: `**Distinctive thing:** a large, well-organized intern program with a
**strong C++ and core-data-structures emphasis**, and a process that tends to be
more structured and more communicative than most. Bloomberg is also one of the
more reliable large employers for interns in New York and one of the earlier
movers in the cycle.

### Typical intern process

| Stage | Notes |
| --- | --- |
| Application | Opens early; on-campus recruiting is significant |
| Online assessment | Commonly used, often HackerRank-style |
| Phone / video technical screen | Coding plus fundamentals |
| Final rounds | Commonly two technical conversations, sometimes on the same day, plus a fit/behavioral discussion |
| Team placement | Bloomberg places interns onto teams; a general offer followed by placement is common |

### Question flavor

Classic data structures and algorithms with an implementation emphasis: strings,
arrays, linked lists, hash maps, trees, and heaps. Bloomberg interviewers are
known for **follow-up questions about how things work underneath** — how a hash
map handles collisions, what happens when a vector resizes, the difference
between a reference and a pointer, what virtual dispatch costs. If you list C++,
expect real C++ questions (memory management, RAII, smart pointers, const
correctness).

Practical and product-flavored questions come up too — Bloomberg builds a huge
real-time financial product, and questions about designing a small piece of
something like that are common at the fit-round level.

### Behavioral component

Moderate and genuine. Expect real interest in why finance/fintech, what you know
about the Terminal business, and how you work with others. Bloomberg's engineering
culture is collaborative and the interviews reflect it.

### How to prepare

1. **Know the internals, not just the API.** Be able to explain how the data
   structures you use are implemented and what their real costs are.
2. **If you claim C++, know it properly** — this is one of the last large
   employers where C++ depth is routinely tested for interns.
3. **Practice standard medium problems with clean implementation.** Bloomberg
   values correct, readable code over clever tricks.
4. **Have an answer for "why Bloomberg / why finance."** It's asked, and "I want a
   big company in New York" is not an answer.
5. **Be ready for light design at the fit round**: how would you build a system
   that streams updates to many subscribers, at a conceptual level.`,
    },
    {
      id: "salesforce-uber-airbnb",
      heading: "Salesforce, Uber, and Airbnb",
      markdown: `Grouped as large product companies with conventional loops, distinguished mainly
by **how much weight each puts on values and code quality versus raw algorithms**.

## Salesforce

| Stage | Notes |
| --- | --- |
| Application / OA | An assessment is used in some cycles |
| Recruiter screen | Structured; the program is large and well-organized |
| Technical rounds | Commonly two to three: coding, sometimes an OOP/design discussion |
| Behavioral / values round | Weighted meaningfully |

**Distinctive thing:** a values-forward culture (their "Ohana" framing) that shows
up as a real behavioral component, plus a large and structured intern program.
Technically, expect standard data structures and algorithms at a moderate bar,
with more object-oriented design and API discussion than at algorithm-obsessed
companies. Java and OOP fluency is useful.

**How to prepare:** solid mediums, a genuine story bank around collaboration and
values, an ability to design a clean class hierarchy, and a real reason for
wanting enterprise software (the honest one — building things used by huge
organizations — is fine).

## Uber

| Stage | Notes |
| --- | --- |
| Online assessment | Commonly used |
| Technical rounds | Commonly two to three; algorithms with a practical bent |
| Fit / behavioral | Usually folded in |

**Distinctive thing:** a fairly conventional big-tech-style loop with a practical
flavor — Uber's problems often have a real-world framing (matching, routing,
scheduling, rate limiting) even when the underlying question is a standard
algorithm. Graph and geospatial-flavored problems come up more than average, which
follows naturally from the business.

**How to prepare:** strong graph and heap work, standard mediums, and the ability
to translate a real-world framing into the underlying data structure quickly.
Being able to talk about a system you built that had a real constraint (latency,
scale, concurrency) plays well.

## Airbnb

| Stage | Notes |
| --- | --- |
| Technical screen | Practical coding |
| Loop | Commonly two to three technical rounds plus a distinct values round |
| Values / "core values" round | Explicit, and genuinely weighted |

**Distinctive thing:** Airbnb runs an explicit values-based interview and is known
for weighting **code quality and craftsmanship** unusually highly. Their technical
rounds are frequently described as favoring clean, well-structured, working code
in a real editor over whiteboard-optimal solutions — closer to Stripe's style than
Google's.

**How to prepare:** practice writing genuinely clean code — good names, small
functions, handled edge cases — because it's scored. Practice in a real editor.
For the values round, prepare thoughtful answers about why you want to work there
specifically, how you handle disagreement, and what kind of environment you do
your best work in; canned corporate answers land badly.`,
    },
    {
      id: "quant-firms",
      heading: "Quant and trading firms (Jane Street, Citadel, Two Sigma, Jump, HRT)",
      markdown: `**Distinctive thing:** a fundamentally different loop from software companies.
Expect **probability, combinatorics, mental math, estimation, and market/game
puzzles** alongside coding, plus an implementation-speed bar that is generally
higher than big tech's. The cycle also runs earliest of anyone — often opening in
early summer and largely concluding by autumn.

### Typical intern process

| Stage | Notes |
| --- | --- |
| Application | Very early; some firms are effectively done hiring before big tech's peak |
| Online assessment | Commonly used and commonly hard: timed math, probability, pattern/sequence, and coding sections. Some firms use specialized platforms with unusual formats |
| Phone/video rounds | Commonly two to four, mixing probability, mental math, and coding |
| Final round / superday | Multiple back-to-back interviews, sometimes on-site, sometimes including games, trading exercises, or estimation problems |

### Round flavors

| Round type | What it contains |
| --- | --- |
| Probability & combinatorics | Conditional probability, expectation, variance, random walks, card/dice/coin setups, and gambler's-ruin-flavored reasoning |
| Mental math / speed arithmetic | Timed arithmetic under pressure; some firms use a dedicated timed test |
| Brainteasers & estimation | Fermi estimation and logic puzzles; the process of reasoning is scored, not just the answer |
| Coding | Algorithms with an emphasis on speed and correctness; C++ and Python are the common languages; some firms use OCaml-flavored or functional-style questions |
| Market/game exercises | Trading games, betting/pricing exercises, or repeated games designed to reveal how you update on information |
| Fit | Lighter than at tech companies, but they do assess how you handle being wrong |

### Behavioral component

Comparatively light on conventional STAR behavioral questions. What *is* assessed
heavily is **how you behave when you're wrong or stuck**: whether you update on
new information, whether you can say "I don't know," whether you get flustered.
Interviewers frequently apply pressure deliberately to see this.

### How to prepare

1. **Probability is a separate study track**, not a footnote. Work through a
   standard interview-probability text and do problems until conditional
   expectation feels natural.
2. **Drill mental math daily** if you're targeting trading roles specifically —
   there are dedicated tools for this and the timed tests are genuinely hard cold.
3. **Practice thinking out loud under pressure**, including being told you're
   wrong mid-answer and recovering gracefully.
4. **Get fast at implementation.** For coding rounds, the bar is often less about
   exotic algorithms and more about writing correct code very quickly.
5. **Start early.** If you begin quant applications in October you have largely
   missed the cycle.
6. **Know which role you're applying for.** Quant trader, quant researcher, and
   software engineer loops at the same firm differ substantially — the SWE loop is
   usually closer to a normal (if hard) tech loop with some probability sprinkled
   in.`,
    },
    {
      id: "early-stage-startups",
      heading: "Early-stage startups",
      markdown: `**Distinctive thing:** the process is **short, fast, idiosyncratic, and heavily
weighted toward whether you can actually build things**. There's no hiring
committee, no calibrated rubric, and often no HR — the person interviewing you is
frequently the person you'd work for, and they're deciding on instinct as much as
on a score.

### Typical process

| Stage | Notes |
| --- | --- |
| Application or (much more often) a warm intro | Referrals and direct outreach dominate. Cold applications to a 20-person company frequently go unread |
| Founder or engineer call | 30 minutes, informal, often part pitch and part screen |
| Take-home or pairing session | Extremely common — building something small, or working through a real problem together |
| One or two technical conversations | Deep dive on your projects, practical coding, sometimes light design |
| Decision | Often within days. Startups move fast and expect you to as well |

### Question flavor

Practical to the point of being mundane: build a small feature, debug something,
extend a script, talk through how you'd architect a small service. Startups rarely
ask hard algorithm questions, partly because they don't need them and partly
because their engineers know the questions don't predict much for the work.

The heaviest-weighted signal is usually your **portfolio**: things you've built,
shipped, and can talk about in detail. A deployed side project with real users is
worth more at a 15-person startup than at any large company.

### Behavioral component

Informal but decisive. What's actually being evaluated:

- Would I enjoy sitting next to this person for three months?
- Will they ship without being managed closely?
- Do they ask when stuck instead of disappearing for a week?
- Are they interested in *this problem*, or do they just want an internship?

### The tradeoffs to go in with your eyes open about

| Upside | Downside |
| --- | --- |
| Real ownership; you'll ship to production in week one | Mentorship is often thin or nonexistent |
| Enormous learning surface across the stack | Less structure; you must self-direct |
| Direct access to founders and to how a business actually works | Compensation is usually below big tech; equity for an intern is generally not meaningful |
| Referenceable, concrete accomplishments | Company risk — startups fold, and internships have been cancelled |
| Hiring is late in the cycle, which makes it a real fallback lane | Return offers depend on the company still existing and having money |

### How to prepare

1. **Have a portfolio that works.** Deployed, linked from your resume, with a
   README. Assume the founder will click it — at a startup, they usually do.
2. **Reach out directly.** Email founders or engineers with a short note and
   something you built. This works far better here than anywhere else, because
   there is no ATS between you and the decision-maker.
3. **Practice pairing.** Being able to code while talking with someone watching is
   the exact skill the pairing round tests.
4. **Know their product.** Use it. Have an opinion. At a small company this is
   both easy and genuinely differentiating.
5. **Ask real questions**: runway, what the intern would own, who would mentor
   you, what happens if the project you're on gets deprioritized. These are
   legitimate and asking them signals maturity.
6. **Get the specifics in writing** — dates, pay, and what you'll be working on.
   Small companies are informal, and informality is where misunderstandings live.`,
    },
  ],
  questions: [
    {
      q: "How should you prepare differently for Amazon versus Google?",
      a: `Shift the time allocation, not the fundamentals.

For **Google**, weight algorithmic depth: graphs, trees, recursion, and DP show
up disproportionately, optimal complexity is expected, and follow-ups that extend
the problem are common. The structural quirk that matters is that your
interviewer doesn't decide — a hiring committee reads their written notes. So
everything you want credited must be said out loud: state your approach, state
the complexity unprompted, state the tradeoff you're making. Silent brilliance is
invisible to a committee.

For **Amazon**, move roughly half your prep from coding to behavioral. The
Leadership Principles are published, interviewers are assigned specific ones to
probe, and they're scored with the same weight as code. The coding bar for
interns is generally described as more approachable than Google's; the rejections
happen on thin LP answers. Build 8-12 STAR stories with real numbers, spend most
of each answer on what *you* personally did, and prepare failure stories, because
several principles are best served by things that went wrong.`,
      weak: `Preparing identically for both, which usually means over-preparing DP for Amazon
and under-preparing behavioral stories entirely. The second failure is having LP
stories that are all successes — interviewers dig, and a candidate with no
failures reads as either inexperienced or unreflective.`,
    },
    {
      q: "Meta's rounds are known for speed. How do you actually adapt to that?",
      a: `Practice with a hard timer at around 20 minutes per problem, including writing
working code — because the commonly reported format fits more than one problem
into a 45-minute round.

Three concrete behavioral adjustments follow from that. **Clarify fast and
commit:** two crisp clarifying questions, state your assumption out loud, start.
Long open-ended requirements gathering is a good habit at some companies and a
clock-killer here. **State the brute force in one sentence**, then state the
optimal approach and get a nod before coding — don't spend ten minutes exploring.
**Favor breadth over depth in prep:** Meta tends toward well-known
medium-difficulty problems with clean optimal solutions, so pattern recognition
speed is the discriminator, not your ability to derive something novel.

A candidate who solves one problem beautifully in 40 minutes can genuinely score
below one who solves two adequately.`,
    },
    {
      q: "What is Palantir's decomposition round and how do you prepare for it?",
      a: `It's an open-ended modeling interview: you're handed a messy, underspecified,
real-world problem and asked to model it aloud with the interviewer — entities,
relationships, operations, data structures, edge cases — while they progressively
add complications.

What's scored: whether you ask what the system is *for* before designing it,
whether you decompose into structure rather than jumping to code, whether you
state assumptions out loud instead of silently choosing, whether you adapt when
they move the goalposts, and whether the interviewer can follow you effortlessly.

To prepare, take everyday systems — a parking garage, a hospital shift scheduler,
a library holds queue, airline baggage tracking — and model each in 30 minutes on
a whiteboard, no code. Requirements first, then entities and operations, then
representations with justifications.

The most important thing *not* to do is reach for a system-design template. Load
balancers, caches, and sharding diagrams land badly here — this round is about
domain modeling, not infrastructure.`,
      weak: `Treating it as a coding question and starting to write classes in minute two, or
treating it as a distributed-systems design question and drawing boxes. Both miss
that the moving goalposts are the point of the exercise, not an unfairness to be
resisted.`,
    },
    {
      q: "How is a quant firm's loop different from a tech company's?",
      a: `Different in kind, not just difficulty. Alongside coding, expect whole rounds of
**probability and combinatorics** (conditional probability, expectation, variance,
random walks), **timed mental math**, **estimation and brainteasers**, and at
trading firms **market or game exercises** designed to see how you update on
information. The coding rounds themselves usually emphasize implementation speed
and correctness over exotic algorithms, commonly in C++ or Python.

Two structural differences matter as much as the content. First, **the cycle runs
earliest of anyone** — often opening in early summer and largely concluding by
autumn — so starting in October means you've mostly missed it. Second, the
behavioral assessment is unusual: conventional STAR questions are light, but how
you behave when you're wrong or stuck is watched closely, and interviewers apply
pressure deliberately to see it.

Also check which role you applied for: quant trader, quant researcher, and
software engineer loops at the same firm differ substantially, and the SWE loop is
usually closest to a hard but normal tech loop.`,
    },
    {
      q: "Why is generic LeetCode prep insufficient for Apple and Nvidia?",
      a: `Because neither runs one loop. Both hire into specific orgs, and the interview
follows the org's domain.

At **Apple**, an embedded or silicon team will probe C, pointers, memory layout,
bit manipulation, and concurrency; an iOS team will probe Swift, memory
management, and platform lifecycle concepts; a services team looks more
conventional. Apple interviewers are also widely reported to interrogate the
technology claims on your resume in depth, so listing a language you can't discuss
properly is actively dangerous.

At **Nvidia**, roles span GPU architecture, CUDA and kernel work, compilers,
drivers, deep learning frameworks, and ordinary software. Systems and GPU roles
lean on C/C++, memory hierarchy, parallelism, and performance reasoning; DL
framework roles lean on Python and applied ML.

The practical move at both is the same: **ask the recruiter which team or org you
are interviewing with**, then prepare that domain's fundamentals on top of your
baseline algorithm work. This one question is worth more than any generic Apple or
Nvidia prep list.`,
    },
    {
      q: "What does a 'practical' loop like Stripe's or Airbnb's actually test?",
      a: `Whether you can write code that runs, in an environment resembling real work.

Common shapes: consume a paginated HTTP API and aggregate the results; extend a
partially built program; find and fix a bug in code you didn't write; implement
something with real error handling, retries, and edge cases. The scored dimensions
are correctness, error handling, and readable structure — not asymptotic
optimality.

The preparation is genuinely different from algorithm prep. Practice in a real dev
environment with a debugger and real error messages rather than a coding pad. Do a
timed exercise where you clone a mid-size open source project and fix a small bug
in it, which is the closest available proxy. Get comfortable with HTTP APIs:
auth, pagination, rate limits, retries. And handle error paths explicitly — silent
failure is the most commonly cited miss in this style of loop.

At Airbnb specifically, code quality is weighted unusually highly: good names,
small functions, handled edge cases. Write it as if it were going into review,
because effectively it is.`,
      weak: `Optimizing for the asymptotically best solution and leaving the code half-written
and unrun. In a practical loop, a working O(n log n) solution with handled errors
beats an unfinished O(n) one, which is the opposite of the instinct algorithm prep
trains.`,
    },
    {
      q: "Tell me about a time you took ownership of something outside your assigned responsibility.",
      a: `A strong Amazon-flavored Ownership answer, in STAR, weighted heavily toward
Action.

**Situation:** "On my team's capstone project, our CI was broken for about two
weeks. Nobody owned it — it wasn't anyone's assigned component — so people just
ran tests locally and pushed anyway."

**Task:** "Two bad merges made it to main in one week, and we lost about a day
recovering. I decided to fix it even though it wasn't my piece."

**Action:** "I spent an evening reproducing the failure and found the test suite
depended on a database fixture that was being torn down inconsistently between
parallel runs. I made the fixtures per-test rather than shared, added a
\`docker-compose\` file so everyone's environment matched, and wrote a one-page
doc on how to run the suite locally. Then I set up a branch protection rule so
main couldn't be pushed to with a red build, which I raised with the team first
because it added friction to their workflow and I wanted buy-in rather than
imposing it."

**Result:** "CI went from broken to green and stayed green for the remaining six
weeks. We had no bad merges after that. Two teammates told me the local setup doc
saved them hours, and one of them extended it later for the deployment step."

Note what makes it work: a real problem with a cost, a specific technical
diagnosis, an "I" throughout, a decision that involved other people, and a result
with evidence.`,
      weak: `"I noticed our team wasn't communicating well so I started organizing meetings
and everyone appreciated it." No technical content, no specific action, no
measurable outcome, and the word "we" doing all the work. An Amazon interviewer
will immediately ask what *you* did, and there won't be an answer.`,
    },
    {
      q: "Why do you want to work here, and how should that answer differ by company?",
      a: `The structure is constant — one specific, non-transferable thing plus a
connection to something you've actually done — but the emphasis should shift.

| Company type | What lands |
| --- | --- |
| Google, Meta | A specific technical interest; the bar here is mostly "not a canned answer" |
| Amazon | Frame it through a Leadership Principle honestly — e.g. customer obsession with a real example of you caring about users |
| Apple | Genuine interest in the *product area* of the team you're interviewing with |
| Netflix, Airbnb | Engagement with the published culture/values, including a real reaction to it |
| AI labs | A defensible view on the mission, including tensions in it — not fandom |
| Palantir | Having thought honestly about the kind of work the company does |
| Stripe, Databricks, Snowflake | Interest in the technical domain: payments, data infrastructure, databases |
| Bloomberg | Why finance/fintech specifically, not just "a big company in New York" |
| Startups | Their actual product. Use it. Have an opinion about it. |

The universal test: **if your answer could be pasted into an application for a
competitor without editing, it is not an answer.**`,
      weak: `"You're an industry leader with great culture and I'd learn a lot." Also weak in
the other direction: reciting the company's own marketing back at them. What you
want is one concrete thing — a product decision, an engineering blog post, an API
you've used — plus why it connects to something you built.`,
    },
    {
      q: "Should you ask your recruiter what the interview loop looks like?",
      a: `Yes, always, on the screening call. People skip it out of a vague fear that it
looks unprepared. It looks organized, and it's the single highest-value question
you can ask.

Ask specifically: How many rounds, and how long is each? What does each round
cover — coding, fundamentals, design, behavioral? What language should I be ready
to work in, and can I choose? Will it be a shared editor, a whiteboard, or my own
environment — and can I use documentation? Is there a behavioral component, and
is it a separate round? Is there anything you'd suggest I focus on?

Recruiters answer these freely; getting you through the process is literally their
job, and a well-prepared candidate makes them look good. The answers also override
everything in this chapter, since processes change constantly and vary by org
within the same company. At Apple and Nvidia in particular, "which team am I
interviewing with?" changes your entire prep plan.`,
    },
    {
      q: "How much do interview processes vary within a single company?",
      a: `More than most candidates expect, which is why hedged structural knowledge is
useful and specific claims are not.

Variation comes from several directions at once. **By org:** Apple is the extreme
case — teams run their own loops, so two Apple interns in the same cycle can have
almost nothing in common in their experience. Nvidia varies similarly by domain.
**By cycle:** companies add and drop online assessments year to year, swap
assessment vendors, and change round counts. **By region and school:** on-campus
processes often differ from general applications, sometimes with an extra campus
round or a compressed loop. **By role:** intern loops are shorter and more
coding-weighted than the full-time loops the same company is famous for — interns
generally don't get a full system design round.

That last one causes the most wasted preparation. Most published prep material
describes new-grad or experienced loops, so check which one you're reading about
before you spend three weeks on distributed system design for a loop that won't
contain any.`,
    },
    {
      q: "You're asked to design a class that supports a small set of operations. How do you approach it?",
      a: `This shape shows up often at Microsoft, Salesforce, and Bloomberg, and it's
scored differently from an algorithm question — they want clean modeling and
sound invariants more than a clever trick.

The approach: **clarify the operations and their expected complexity first**
("should lookup be O(1)? how often is insert called relative to query?"), because
the access pattern determines the representation. Then state the internal
representation and *why* — "I'll keep a hash map from key to node plus a doubly
linked list, so insert and lookup are O(1) and I can evict from the tail." Then
write the public interface before the bodies, so the interviewer can object early
and cheaply.

While implementing, name the **invariant** you're maintaining and say when it
holds. Handle the error and edge cases explicitly: empty structure, duplicate
key, capacity zero, operation on a missing element. Finish by stating the
complexity of every public method and what you'd change if one of the assumptions
flipped.

The mistake to avoid is writing the methods first and discovering halfway through
that your data structure can't support one of them efficiently.`,
    },
    {
      q: "How do you handle an interviewer telling you that you're wrong?",
      a: `Take it seriously, check it, and update visibly — because at several companies
this is being tested on purpose.

The sequence: pause, restate what they said to confirm you understood it, then
actually check. If they're right, say so plainly — "you're right, my
initialization is off by one, that fails when the array has a single element" —
fix it, and move on without spiralling into apology. If you think you're right,
say so with reasoning rather than with confidence: "I think it holds because of
X — can you show me the case you're thinking of?" A good interviewer respects that
and will either produce the case or concede.

At quant firms this is close to explicit: interviewers apply pressure deliberately
to see whether you update on new information, whether you can say "I don't know,"
and whether you get flustered. At Microsoft and other collaborative loops,
refusing to engage with a hint scores worse than needing the hint in the first
place.

The two losing responses are stubbornness and collapse. Neither has anything to do
with whether you were actually right.`,
      weak: `Instantly abandoning a correct solution because the interviewer sounded skeptical
— which happens constantly and reads as having no conviction in your own
reasoning. Some interviewers push on correct answers specifically to see if you
fold.`,
    },
    {
      q: "What should you do in the week before a loop at a specific company?",
      a: `Five things, in this order.

**One: verify the process.** Check the company's university-recruiting page, ask
your recruiter directly, and skim candidate reports from the last six to twelve
months only. This overrides any general guidance.

**Two: adjust emphasis, don't restart.** Company-specific quirks are worth maybe
5% of prep time. If it's Amazon, build the LP story bank. If it's Meta, move to
timed two-problems-per-session practice. If it's Apple or Nvidia, find out the
team and study that domain. If it's Stripe or Airbnb, practice in a real editor.
If it's Palantir, do modeling drills out loud.

**Three: do two mock interviews out loud** with a human or at minimum a recording.
Talking while coding is the most under-practiced and most heavily scored skill.

**Four: prepare three questions per interviewer type** — process questions for
recruiters, work questions for engineers, expectation questions for managers.

**Five: logistics.** Test the video platform and the shared editor, have a backup
internet plan and a phone number for your recruiter, have your resume and project
links open, and have water and paper. A technical failure at the start of a loop
costs you ten minutes of composure you can't get back.`,
    },
    {
      q: "How should you talk about a project when the interviewer asks about your resume?",
      a: `Two minutes by default, structured as **problem → your specific role → one hard
technical detail → outcome**, and then stop so they can pick where to dig.

"It's a scheduling service for my university's student orgs — the problem was that
room bookings were being double-assigned because three groups were editing a
shared spreadsheet. I built the backend: a Go service with Postgres. The hard part
was concurrent booking; my first version had a check-then-insert race that I only
found because I wrote a test that fired fifty concurrent requests. I fixed it with
a unique constraint plus serializable transactions and retry on conflict. It's
been used by about forty orgs since the spring."

Then stop. The stopping is what makes it work — you've planted three threads
(concurrency, Postgres isolation levels, testing) and let them choose.

Be ready to go three levels deeper on anything you said, because Bloomberg, Apple,
and Amazon interviewers in particular will. Know what you'd redesign, what the
alternative approach was, and what broke in production. And never list a
technology on your resume you can't be interrogated about.`,
      weak: `A five-minute feature tour with no technical difficulty in it — "it has login,
a dashboard, and email notifications, and I used React and Node." Nothing in that
tells the interviewer anything about your engineering, and it gives them nothing
to follow up on. The other failure is claiming a technology you used shallowly and
getting caught two questions in.`,
    },
    {
      q: "Is a big tech internship always better than a startup internship?",
      a: `No, and the honest answer depends on what you need next.

**Big tech gives you:** brand that opens doors for the next two cycles,
structured mentorship, an actual intern program with a defined project, a real
codebase at scale, higher pay, and a comparatively reliable return-offer pipeline.
The costs are narrow scope (you may own a small slice of one system) and slower
pace.

**A startup gives you:** ownership from week one, breadth across the whole stack,
proximity to how a business actually works, and concrete accomplishments you can
describe in detail. The costs are thin or absent mentorship, less structure, lower
pay, meaningful company risk, and a return offer that depends on the company still
existing and having money.

The decision rule I'd use: if you have no prior internship, the structured program
and the brand are worth more, because they make the *next* cycle dramatically
easier. If you already have experience and know you want breadth and ownership, a
good startup can be the better summer. And a real internship anywhere beats an
empty summer by a very wide margin — that comparison isn't close.

One practical note: startups hire late, February through April, which makes them a
genuine fallback lane rather than only a first choice.`,
    },
    {
      q: "What's the most common way candidates fail loops at these companies, technical skill aside?",
      a: `Silence. Solving the problem entirely in your head and then writing code.

Every one of these loops scores communication, and at Google it's structurally
critical because a hiring committee reads the interviewer's written notes rather
than watching you work — anything you didn't say out loud effectively didn't
happen. In collaborative loops like Microsoft's, not engaging with an offered hint
reads worse than needing one.

The close second is failing to adapt to the company's actual format: optimizing
for asymptotic elegance in a practical loop like Stripe's where a working solution
with handled errors is what's scored; spending fifteen minutes on requirements at
Meta where the clock demands two problems; or arriving at Amazon with strong code
and three thin behavioral stories.

The third is preparing from material that describes the wrong loop — new-grad or
experienced-hire content rather than the intern loop, which is shorter, more
coding-weighted, and usually contains no system design round at all.`,
    },
  ],
  relatedProblems: [],
};
