import type { HandbookChapter } from "./types";

export const chapter: HandbookChapter = {
  slug: "behavioral-star",
  title: "Behavioral Interviews & Your Story Bank",
  track: "behavioral",
  order: 1,
  summary:
    "How behavioral rounds are actually scored, STAR done properly with weak-vs-strong rewrites, and a reusable story bank built from student-scale experience.",
  estMinutes: 55,
  tags: [
    "behavioral",
    "star",
    "story bank",
    "leadership principles",
    "googleyness",
    "tell me about yourself",
    "resume deep dive",
  ],
  sections: [
    {
      id: "how-behavioral-is-scored",
      heading: "How behavioral rounds are actually scored",
      markdown: `Most candidates think the behavioral round is a vibe check. It isn't. At any company with a structured process, the interviewer is filling in a form with named competencies and is required to attach *evidence* to each rating. The form differs by company, but the competencies barely do:

- **Collaboration / working with others** — do you make the people around you more effective, or do you route around them?
- **Ownership / drive** — do you finish things nobody asked you to finish? Do you chase down a problem past the point it stopped being your fault?
- **Handling ambiguity** — when the spec is bad and nobody answers your message, what do you do in the next hour?
- **Learning and self-awareness** — can you name a real mistake, in your own words, without a defensive frame?
- **Communication** — can a stranger follow your story without asking three clarifying questions?

The write-up an interviewer produces looks roughly like this, and it is the *only* thing the debrief sees:

\`\`\`text
Signal: Ownership — POSITIVE
Evidence: Candidate's teammate stopped responding 6 days before a group
project deadline. Candidate did not escalate to the professor immediately;
first re-scoped the missing module to a stub so the build stayed green, then
messaged teammate privately, then escalated with a written status. Shipped
on time. Could articulate why they chose that order.

Signal: Self-awareness — MIXED
Evidence: When asked what they'd do differently, gave a generic "communicate
earlier" answer. No specific mechanism. Did not identify their own
contribution to the problem.
\`\`\`

Three things follow from this and they should change how you prepare:

1. **Specificity is the currency.** "I'm a good team player" produces zero evidence lines. "I noticed our stand-up notes were only in one person's head so I started a shared doc, and by week three three other people were writing in it" produces one.
2. **The interviewer must be able to write it down while you talk.** If your story takes four minutes to reach the point, they stop transcribing and start summarizing, and summaries lose you signal. Two minutes is the target. Three is the ceiling.
3. **You are graded on what you *did*, not what happened.** Stories where the team succeeded and your role is fuzzy are worth almost nothing. The single most common failure is the word "we."

One more thing nobody tells you: a bad behavioral round rarely gets you rejected on its own if the coding rounds were strong — but a *great* behavioral round is one of the few things that can rescue a borderline coding performance, because it gives the debrief something concrete to argue with. It is the cheapest round to get good at and the one candidates prepare least.`,
    },
    {
      id: "star-done-properly",
      heading: "STAR, done properly",
      markdown: `STAR — Situation, Task, Action, Result. Everyone knows the acronym. Almost nobody allocates the time correctly. Here is the budget for a two-minute answer:

| Part | Time | What it's for |
| --- | --- | --- |
| Situation | 15-20s | Just enough context for the Action to make sense |
| Task | 10-15s | Your specific responsibility, and the constraint |
| Action | 60-75s | What *you* personally did, in steps, with the reasoning |
| Result | 20-30s | Outcome, quantified, plus what you took from it |

Candidates typically spend 60 seconds on Situation, 45 on Task, 20 on Action, and forget Result. That's exactly inverted.

**Situation.** One or two sentences. Who, where, what was at stake, when. "Last spring, on a four-person team in my operating systems course, we had three weeks to build a user-level thread library." Done. Do not explain what a thread library is. Do not name your teammates. Do not describe the grading rubric.

**Task.** Name *your* piece and the constraint that made it hard. "I owned the scheduler. Two weeks in, our context switch was corrupting the stack about one run in twenty, and it was my code." The constraint is what turns a story into a story.

**Action.** This is the whole answer. Rules:

- Use "I" as the subject of the verbs. When you genuinely need "we," immediately follow it with what your slice was.
- Narrate it as a sequence: *first I..., that told me..., so then I...*. Sequence proves it happened. Summaries don't.
- Include at least one **decision with an alternative you rejected**. "I could have added a lock around the whole switch, which would have hidden it, but I wanted to know why it was happening, so instead I..." This one move separates strong candidates from average ones more reliably than anything else, because it shows judgment rather than activity.
- Include one thing that failed or a false start. Stories with no friction sound rehearsed and are less believable.

**Result.** Covered in its own section below, because it's where everyone leaks points.

**A note on "STAR vs. natural conversation."** Do not announce the structure. Saying "So, the *situation* was..." makes you sound like you read a listicle on the train. STAR is a skeleton, not a script. The interviewer should experience a well-organized story, not a form being filled out.`,
    },
    {
      id: "weak-vs-strong",
      heading: "The same question, weak and strong",
      markdown: `Question: **"Tell me about a time you had a conflict with a teammate."**

### The weak answer

> "So in one of my classes we had a group project and one of my teammates wasn't really pulling his weight. It was kind of frustrating because we all had a lot going on that semester. We tried to talk to him about it a few times but it didn't really change much. Eventually we just kind of divided up his work between the rest of us and got it done. We ended up getting a good grade on it. I learned that communication is really important in a team and that you have to be flexible."

Read what an interviewer can actually write down from that: *nothing*. Let's be precise about the failures:

- **No stakes and no timeline.** How long was left? What was actually at risk?
- **"We tried to talk to him."** Who talked? When? What was said? What did *he* say back?
- **The action is passive and collective.** "We just kind of divided up his work" — the candidate did nothing identifiable.
- **The teammate is a villain with no interiority.** Strong candidates find out *why* someone went quiet. Weak ones assume laziness. Interviewers notice this instantly, because they've all been the person who went quiet.
- **The result is the grade**, which is not a result the candidate caused.
- **The lesson is a fortune cookie.** "Communication is important" is what you say when you didn't learn anything.

### The strong answer

> "Third year, distributed systems course. Four of us, five weeks to build a replicated key-value store, and I owned the client library and the test harness.
>
> About ten days out, the teammate who had the replication layer stopped pushing commits and went quiet in our group chat for four days. We were blocked — my test harness had nothing to run against.
>
> First thing I did was check the assumption. I looked at his branch and there *was* work there, just half-finished and not passing. So this wasn't someone who'd checked out; it was someone who was stuck and had gone silent about it. That changed my approach — I messaged him one-on-one instead of in the group chat, and I didn't lead with the deadline. I asked what he was hitting. Turned out he'd gotten wedged on leader election, had been rewriting it for a week, and was embarrassed to say so in front of everyone.
>
> So I made two calls. One: I offered to pair with him for two hours that evening rather than take the work away, because taking it away would have made the silence worse and I'd have been learning that code from scratch under deadline anyway. Two: I wrote a stub replication layer — single node, no election — and pointed my harness at it, so the rest of the team was unblocked that same afternoon regardless of how the pairing went.
>
> In the pairing session we found he was trying to implement full Raft when the spec only needed a fixed leader. We cut it, and he had it working in two days.
>
> We submitted on time with all seven required behaviors passing. But the thing I actually took from it: my instinct when someone goes quiet used to be to assume they'd bailed and to route around them. That's usually wrong, and routing around someone is expensive — it costs you the context they have. Now when someone goes dark my first move is a private message that doesn't mention the deadline, and my second is to unblock myself in parallel so I'm not negotiating from a position of panic. I've used that twice since."

### What changed, line by line

| Weak | Strong |
| --- | --- |
| "one of my classes" | named course, team size, timeline, and the candidate's specific ownership |
| "wasn't pulling his weight" | checked the branch first, discovered he was stuck, not absent |
| "we tried to talk to him" | private DM, deliberately not leading with the deadline, with a stated reason |
| no alternatives considered | explicitly rejected taking the work away, and said why |
| one action | two parallel actions — fix the person *and* unblock the team |
| "we got a good grade" | shipped on time, seven behaviors passing, plus a durable behavior change |
| "communication is important" | a specific, reusable rule the candidate has applied since |

Same underlying events. One is a hire signal; the other is filler. The difference is not that the strong candidate had a better semester — it's that they prepared.`,
    },
    {
      id: "the-result-problem",
      heading: "Why Result is the part you'll skip, and the part that scores",
      markdown: `Watch yourself in a mock interview and you'll find the same shape every time: the Action section runs long because it's the part you actually remember, you feel the interviewer's attention drifting, and you land the plane with "...and yeah, it worked out." That's the Result. That's the part being scored.

Result is where the interviewer decides whether your Action was *good judgment* or just *activity*. Without it, everything you said is unfalsifiable.

A complete Result has three components. Most candidates give zero or one.

**1. The outcome, stated as a fact.** Shipped or didn't. Passed or didn't. Merged or closed. Number of users, tests, milliseconds, dollars, people. If it failed, say it failed — a failure with a clear-eyed account beats a vague success every time.

**2. The second-order effect.** What happened *after*, because of what you did. "The stub harness we built for that project is still what the TAs hand out as the starter kit." "Two other teams copied the doc format." "The maintainer asked me to review the follow-up PR." This is the single strongest signal in a behavioral interview, because it's proof the work outlived the moment.

**3. The transferable lesson, stated as a rule.** Not "I learned teamwork matters." A rule you now apply: "Now I don't start a group project without one shared doc that has the interfaces in it before anyone writes code." Rules are checkable; sentiments aren't. And if you can add "I did that again on the next project and here's what happened," you've closed the loop entirely.

**Landing it without trailing off.** Weak endings drift: "...so, yeah, that was pretty much it." Strong endings are a full stop. Pick one of these shapes and end there:

- "Net result: [outcome]. And the thing I carry from it is [rule]."
- "It shipped. What I'd do differently is [specific thing], and I did exactly that on [next project]."
- "It didn't work. [Honest cause]. What I got out of it was [rule], and that's why I now [behavior]."

Then **stop talking**. Silence after a landed Result is fine. Filling it is how you talk yourself out of a good answer.

**When the result was genuinely bad.** Say so plainly, early in the Result, then spend your remaining time on cause and change. Interviewers are far more suspicious of a story where everything worked than one where something didn't. What they will not forgive is a bad outcome you blame entirely on other people.`,
    },
    {
      id: "quantifying-as-a-student",
      heading: "Quantifying impact when you have no production metrics",
      markdown: `"Quantify your impact" is advice written for people with dashboards. You have a class project and a GitHub repo. That's fine — student-scale numbers still count, as long as they're *real*. Here is where to find them.

**Numbers you already have and haven't looked for:**

| Source | Number you can state |
| --- | --- |
| Your repo | commits, files, lines in the module *you* owned, test count, coverage % |
| Timing anything | runtime before/after, build time, page load, query latency |
| CI | test suite duration, flake rate, number of PRs, review turnaround |
| Course project | team size, weeks, required features passing, grade percentile if strong |
| Hackathon | hours, team size, submissions competed against, placement |
| Club / org | attendance, events run, budget, members recruited, retention week 1 → week 8 |
| Open source | PRs merged, issues closed, stars/downloads on the *project* (not yours), review rounds |
| Part-time job | tickets/hour, customers/shift, error rate, time saved per week by something you automated |
| TA / tutoring | students supported, sessions run, office hours per week, assignments graded |

**Measure the thing you improved, even retroactively.** If you sped something up and never timed it, you can often still recover the number: check out the old commit, run it, time it. Ten minutes of work turns "I made it faster" into "I cut the batch job from about 40 seconds to under 3." Do this *before* the interview, not during.

**When you truly can't get a number, quantify the scope instead.** These are all legitimate:

- "It was about 2,000 lines and four of us depended on it."
- "It saved each of us roughly an hour a week for the rest of the semester — call it 30 hours across the team."
- "Before, deploying meant nine manual steps and someone got one wrong most weeks. After, it was one command."
- "Forty people used it during the event; six kept using it afterward."

**Rules for staying honest:**

- **Hedge language is your friend, not a weakness.** "Roughly," "about," "on the order of" are what real engineers say. Precise fake numbers ("improved performance by 47%") are a red flag, because the follow-up is always "how did you measure that?" and you need an answer.
- **Never quote a number you can't defend for two more questions.** Assume every number gets "how did you measure it?" and "why was it slow before?"
- **Don't inflate scope.** "Used by thousands of students" for a tool your study group used is the kind of thing that gets caught, and getting caught on one number invalidates the whole interview.
- **Percentages need a base.** "Reduced errors 50%" from 2 to 1 is not a result. Give the absolute numbers when they're small.

**Also count the non-numeric evidence.** "The maintainer merged it without changes." "My TA started using my debugging script in office hours." "Two teammates adopted the pattern in their own modules." These are proof of quality from a third party, which is often worth more than a metric you produced yourself.`,
    },
    {
      id: "building-a-story-bank",
      heading: "Building a story bank of 6-8 stories",
      markdown: `You do not prepare 30 answers for 30 questions. You prepare **6-8 stories** and learn to re-aim them. Interviewers ask the same twelve questions in a hundred phrasings; a good story bank covers the space with heavy overlap.

**What makes a story bank-worthy?** It has to have at least three of these:

- A decision you made where a reasonable person could have chosen differently
- Friction — something broke, someone disagreed, the deadline moved
- A clear boundary around *your* contribution
- A result you can state and defend
- A lesson you've since applied somewhere else

A story with none of these is an anecdote, not evidence. "I built a portfolio site in React" is an anecdote.

**Cover these slots.** Aim for one story per slot; a couple of your stories will cover two.

1. **The conflict** — a disagreement with a person, ideally one you resolved without authority.
2. **The failure** — something you owned that went badly. Not "my weakness is perfectionism." A real one.
3. **The leadership** — you moved a group without a title. Organizing counts.
4. **The ambiguity** — no spec, no answer, you decided anyway.
5. **The technical depth** — the hardest thing you've debugged or designed, in detail.
6. **The learning sprint** — you learned something unfamiliar fast, under pressure.
7. **The initiative** — you did something nobody asked for and it stuck.
8. **The pressure/deadline** — you cut scope or triaged when time ran out.

**Where student-scale stories come from.** All of these are legitimate and interviewers know what an intern candidate's life looks like. They are not expecting production incidents.

- **Class projects** — the richest source, especially group ones. Teammates, deadlines, conflicting designs, real constraints.
- **Hackathons** — compressed, so the decisions are sharp. Scope cuts under a 36-hour clock are excellent ambiguity/pressure stories.
- **Clubs and orgs** — running a workshop series, recruiting, handing over a role. Best leadership-without-authority material you have.
- **Part-time and non-technical jobs** — retail, food service, help desk, campus job. Do not discount these. "Handled an angry customer" and "noticed the closing checklist was wrong and fixed it" are real conflict and initiative stories, and interviewers often find them *more* credible than another group project.
- **Open source** — a PR that got rejected and reworked is a gift: it's feedback, learning, and communication in one story.
- **Personal projects** — usable if there was a real user or a real hard problem. "I built a CRUD app from a tutorial" is not a story.
- **Research / TA / tutoring** — explaining to non-experts, ambiguity (research is nothing but ambiguity), and long-horizon persistence.

**How to write each one up.** For each story, write a single page with: a five-word title, the situation in two sentences, your task, four to six action beats, the result with numbers, the lesson as a rule, and — critically — a **facts appendix**: names of technologies, dates, sizes, the exact bug, what you'd do differently. You will not recite the appendix. It's there so that when an interviewer drills ("wait, why did that corrupt the stack?") you're not caught out. Getting drilled on your own story and going vague is one of the fastest ways to lose credibility.

**Then practice out loud.** Not in your head — out loud, timed, to a recording. Your written version is 90 seconds; your spoken version will be 3:30 the first time. The gap is filler, backtracking, and over-explaining the setup. Cut it until you're at two minutes without rushing.`,
    },
    {
      id: "story-mapping-table",
      heading: "Mapping stories to questions",
      markdown: `Here's a worked example bank so you can see the remapping. These are deliberately student-scale.

| # | Story | One-line summary |
| --- | --- | --- |
| S1 | **Silent teammate, replicated KV store** | Teammate went quiet 10 days out; found he was stuck, not absent; paired with him and stubbed the layer in parallel |
| S2 | **Hackathon scope cut at hour 20** | Team was building three features at 36-hour hackathon; called it, cut two, shipped one that demoed |
| S3 | **Help desk ticket triage** | Campus IT job; noticed the same 5 issues were 60% of tickets; wrote a self-serve doc and a triage macro |
| S4 | **Rejected open source PR** | First PR to a mid-size library closed with "this doesn't handle the async path"; reworked over 3 review rounds; merged |
| S5 | **ACM workshop series** | Took over a club workshop track with 6 attendees; changed format and scheduling; ended at 40+ |
| S6 | **The three-day heisenbug** | Personal project corrupting data under concurrent writes ~1 in 50; bisected, found a non-atomic read-modify-write |
| S7 | **TA office hours** | Explaining pointers to students who'd been told the same thing three times; built a visual model that worked |
| S8 | **Research project with no spec** | Advisor said "see if this approach helps"; no success criteria; defined the benchmark myself before building |

Now the mapping. Note how often the same story answers structurally different questions — because you re-aim which beat you emphasize.

| Question | Primary | Backup | What you emphasize |
| --- | --- | --- | --- |
| Conflict with a teammate | S1 | S4 | the private DM, and why not escalating first |
| Difficult person / disagreement with a decision | S4 | S1 | you disagreed with the reviewer, then tested and found them right |
| Biggest failure | S6 | S2 | you shipped a design that couldn't survive concurrency |
| Time you made a mistake | S6 | S1 | the non-atomic write was your code, in your own PR |
| Leadership without authority | S5 | S2 | you had no power to make anyone attend |
| Led a team | S5 | S1 | recruiting speakers, handing the track over |
| Handled ambiguity | S8 | S2 | you wrote the success criteria before the code |
| No clear direction from a manager | S8 | S3 | you proposed a definition and got it confirmed cheaply |
| Learned something fast | S4 | S6 | async internals in a codebase you'd never seen |
| Taught / explained something complex | S7 | S4 | the visual model, checked by asking them to explain it back |
| Took initiative | S3 | S5 | nobody asked for the triage macro |
| Went beyond what was required | S3 | S6 | you fixed the class of problem, not the ticket |
| Worked under a tight deadline | S2 | S1 | the hour-20 decision, and the two features you killed |
| Prioritized under constraints | S2 | S3 | demo-ability as the ranking criterion |
| Received difficult feedback | S4 | S7 | the closed PR and what you did in the next 48 hours |
| Gave difficult feedback | S1 | S5 | how you framed it privately |
| Disagreed with your manager/professor | S8 | S4 | you proposed a different benchmark and why |
| Most technically challenging thing | S6 | S1 | bisection method, the hypothesis you disproved |
| Persuaded someone | S2 | S5 | how you got the team to abandon their favorite feature |
| Team member not contributing | S1 | S5 | same story, emphasize the diagnosis |
| Handled pressure / stress | S2 | S6 | you narrowed scope rather than working faster |
| Worked with someone very different from you | S7 | S3 | students with no CS background |
| Something you're proud of | S5 | S3 | the second-order effect — it outlived you |
| Ethical judgment call | S3 | S4 | a user asked you to bypass a policy; what you did |
| Why this company / why software | opener | — | see the "tell me about yourself" section |

**How to use this table.** Build your own version. Then, when a question lands that you didn't rehearse, don't panic-search your whole life — ask yourself which *slot* the question is in (conflict? initiative? ambiguity?) and go to the story you assigned it. Two seconds of "let me think of a good example" out loud is completely normal and buys you the time.

**Do not use the same story twice in one loop.** Interviewers compare notes. If three of them heard about the hackathon, the debrief note is "narrow experience." Track which story you used in which round — literally write it down between interviews.`,
    },
    {
      id: "amazon-lps",
      heading: "Amazon's Leadership Principles, mapped",
      markdown: `Amazon is the one company where behavioral questions are the *majority* of the loop, not a formality. Every interviewer is assigned specific Leadership Principles to probe, they take near-verbatim notes, and they ask relentless follow-ups. If you're interviewing at Amazon, the story bank isn't optional prep — it's the interview.

**How it actually runs.** You'll get a question like "tell me about a time you took on something significant outside your responsibility." Then you get drilled: *Why did you do that? What did your teammate say? What data did you have? What was the result? What would you do differently? What did you learn?* The follow-ups are where the score is set. This is why the facts appendix matters.

**The principles you'll realistically be asked about as an intern**, and what a student-scale story for each looks like:

| Principle | What they're checking | Student-scale story that works |
| --- | --- | --- |
| Customer Obsession | Do you start from the user, or from the tech you wanted to use? | S3 help desk — you looked at what users kept hitting, not what was fun to build |
| Ownership | Do you stop at "not my job"? | S1 — you unblocked the team even though the replication layer wasn't yours |
| Invent and Simplify | Do you reach for the simpler mechanism? | S2 — cutting two features; S3 — a doc instead of a tool |
| Are Right, A Lot | Judgment under incomplete info, and updating when wrong | S6 — the hypothesis you disproved before finding the real cause |
| Learn and Be Curious | Do you go learn things without being assigned them? | S4 — async internals of an unfamiliar codebase |
| Insist on the Highest Standards | Do you ship things you know are bad? | S4 — three review rounds instead of arguing it through |
| Bias for Action | Speed with reversible decisions | S2 — the hour-20 call rather than deciding at hour 30 |
| Dive Deep | Will you go to the actual cause? | S6 — the bisection, the exact race |
| Have Backbone; Disagree and Commit | Will you push back, then genuinely commit? | S8 — proposed a different benchmark, and what you did when overruled |
| Deliver Results | Did it actually ship? | S2, S5 |
| Earn Trust | Candor, credit, admitting fault | S1 — private not public; S6 — it was your bug |

**Mapping mechanics.** Take your 8 stories and tag each with the 2-4 principles it demonstrates. Most stories cover three. You want every principle in the left column covered by at least one story, and Ownership / Dive Deep / Bias for Action covered by at least two, because those come up most.

**The two follow-ups that catch people:**

- *"What would you do differently?"* — You must have a real answer. "Nothing, it went well" scores badly. Have a specific, non-trivial thing you'd change, and it should not be "communicate more."
- *"What was the hardest part for you personally?"* — This is a self-awareness probe. Answering with a technical difficulty dodges it. Answer with the actual human part: "Sending that first message. I'd built up a story where he'd bailed on us and I was annoyed, and I had to decide to not open with that."

**Write it down before the interview.** Amazon-style loops reward candidates who have, literally, a one-page-per-story document they've re-read that morning. Not to recite — to have the details loaded.

**A word on "Disagree and Commit."** Candidates tell the disagree half and skip the commit half. The principle is about what you do *after you lose the argument*. If your story ends with "and they realized I was right," you've answered a different question. The strong version ends with you executing the plan you argued against, fully, without sandbagging — and ideally noticing something you'd been wrong about.`,
    },
    {
      id: "googleyness",
      heading: 'Google\'s "Googleyness and Leadership" round',
      markdown: `Google runs a dedicated non-coding round, historically called "Googleyness and Leadership" (you may see it labeled just "Leadership" or folded into a general round now — the content is stable regardless of the name). It's typically 30-45 minutes, one interviewer, no whiteboard.

**What they're actually assessing.** Google's rubric here is less about heroics and more about whether you're a functional, low-drama, intellectually honest collaborator:

- **Comfort with ambiguity** — Google problems are underspecified by design. Do you freeze, or do you scope?
- **Bias to action** — do you do the small useful thing now, or wait for permission?
- **Collaboration** — specifically, do you give credit accurately and take responsibility accurately?
- **Intellectual humility** — can you say "I was wrong" without theater? This one is weighted heavily and is the most common place candidates lose points, usually by turning every story into one where they were right.
- **Doing the right thing** — ethics, but also: will you raise the uncomfortable thing?
- **Emergent leadership** — stepping up when the situation needs it, and stepping *back* when someone else is better placed. The step-back half is real and rarely demonstrated.

**How the questions sound.** Less "tell me about a time" drill-down than Amazon, more conversational and sometimes hypothetical:

- "Tell me about a project where the goal wasn't clear."
- "Tell me about a time you changed your mind about something important."
- "How do you decide what to work on when everything seems urgent?"
- "Tell me about a time you worked with someone whose working style was very different from yours."
- "What's something you believe about software that most people you work with disagree with?"
- "Tell me about a time you had to say no."

**How to prepare differently for it.** Two adjustments from the Amazon prep:

1. **Have a genuine "I was wrong" story.** Not a small one. Something where you advocated for an approach, it was chosen, and it turned out worse — and you're the one who noticed and said so. This is disproportionately valuable at Google and most candidates don't have one loaded.
2. **Have a step-back story.** A time you handed something off, or deferred to someone who knew more, and why. Candidates over-index on stories where they took charge. A round full of those reads as someone who won't be a good teammate on a team of strong engineers.

**On hypotheticals.** Google asks more "what would you do if..." than most. Answer these by immediately anchoring to a real experience: "I'd probably do what I did when [real situation] — here's what happened." Pure hypothetical answers are worth almost nothing because they can't be verified, and the interviewer knows it.

**Note on process:** Google decisions go to a hiring committee that reads written packets, not to the interviewers in the room. This means your interviewer is writing for an audience who wasn't there. Clean, quotable, specific answers survive the write-up. Rambling ones get compressed into one flat sentence and lose all their signal. Talk in a way that's easy to transcribe.`,
    },
    {
      id: "tell-me-about-yourself",
      heading: 'The "tell me about yourself" opener, scripted',
      markdown: `This is the first 90 seconds of nearly every interview, it sets the interviewer's prior on you, and most candidates improvise it. Don't. Script it, memorize the beats (not the words), and deliver it in **60-90 seconds**.

**What it is not:** your life story, your high school, your GPA, a list of every language you've touched, or a narration of your resume top to bottom. The interviewer has your resume. Reading it aloud wastes your best 90 seconds.

**The four-beat structure:**

1. **Where you are now** (1 sentence). Year, school, major, and one orienting fact.
2. **The through-line** (2-3 sentences). What kind of engineering you've gravitated toward, with one concrete piece of evidence. Not "I'm passionate about technology" — a specific pull.
3. **The most relevant recent thing** (2-3 sentences). One project or role, what it did, what was hard, what came of it. Choose the one closest to the team you're interviewing with. This is the hook you *want* them to drill into.
4. **Why you're here** (1-2 sentences). Why this company/team specifically, tied to the through-line. Then hand the conversation back.

**A worked example (about 80 seconds spoken):**

> "I'm a third-year CS student at [University], and most of what I've done outside coursework has been backend and infrastructure — I like the part of the problem where you find out the thing you built doesn't survive contact with real traffic.
>
> That started with a scheduling tool I built for my ACM chapter. It worked fine for the twelve of us, and then about 200 people used it during club fair week and it fell over, because I'd done a read-modify-write on the signup counts with no transaction. Debugging that — reproducing a race that showed up one in fifty times — was the most I've ever learned in three days, and it's why I went and took distributed systems the next semester.
>
> Since then I've been the person on my project teams who ends up owning the data layer and the test harness. Last spring that was a replicated key-value store; I wrote the client library and the harness the rest of the team developed against.
>
> I'm interested in [Company] specifically because the internship sits on infrastructure rather than product surface, and the failure modes I find interesting are the ones that only show up at scale. That's the thing I can't get from a class project."

**Why this works:** it gives the interviewer three hooks (the race condition, the KV store, the infra interest), it demonstrates a *trajectory* rather than a list, it admits a real bug of the candidate's own making inside the first 30 seconds — which reads as confident — and it ends with a specific reason for being in the room that isn't "you're a great company."

**Common failures:**

- **Chronological from childhood.** "I first got into computers when I was twelve..." Cut it. Start where you are now.
- **Listing technologies.** "I know Python, Java, C++, React, Node, SQL, Docker..." That's the resume. It signals nothing and burns 20 seconds.
- **Ending flat.** "...and yeah, that's me." End on why you're here, then stop.
- **No specifics.** If your opener contains no number, no name of a thing, and no problem, rewrite it.
- **Running four minutes.** Time yourself. Ninety seconds.

**Variant: "Walk me through your resume."** Same structure but explicitly ordered, and you may go item by item — just keep each item to two sentences and add a *why* for each transition. The transitions are the interesting part: why you moved from X to Y.`,
    },
    {
      id: "resume-deep-dive",
      heading: "When they drill into a project on your resume",
      markdown: `Some interviewers spend 20-30 minutes on one resume line. This is a real technical round wearing a behavioral costume, and it's often the most discriminating part of an intern loop — because it's the one part you can't grind on a problem site.

**The escalation you should expect.** It goes in this order, roughly:

1. "Tell me about [project]." — 90 seconds, what and why.
2. "What was the hardest part?" — the real entry point.
3. "How did you [specific mechanism]?" — architecture, data model, protocol.
4. "Why did you choose [X] over [Y]?" — the judgment question.
5. "What happens if [scale/failure/concurrency]?" — pressure-testing your understanding.
6. "What would you do differently?" — self-awareness.
7. "Show me / draw it." — sometimes a whiteboard appears.

**Rule zero: only put things on your resume you can survive step 5 on.** If you used a library and don't know what it does, either learn it before the interview or take the line off. "I used Redis for caching" invites "what's your eviction policy and what happens on a cache miss under load?" If you don't know, that's a bigger negative than never having mentioned Redis.

**Prepare each headline project with a one-page brief:**

- **The 90-second pitch** — problem, who it was for, what you built, outcome.
- **A diagram you can draw from memory** — boxes and arrows, request path, data store. Practice drawing it. Being able to sketch your own architecture in 60 seconds is a strong signal and it's shockingly rare.
- **Your slice, explicitly.** On team projects, be ruthless about what was yours. "I owned the ingestion pipeline; the frontend was two teammates" is a *good* answer, not a weak one. Claiming the whole thing and then failing a frontend question is the bad outcome.
- **Three design decisions with the alternative.** Postgres vs. Mongo. Polling vs. websockets. Monolith vs. split. For each, why you chose, and what you'd have gotten from the other. Saying "honestly, Postgres because I knew it and the data was relational" is a fine answer — it's honest and correct. Saying "Mongo because it scales better" when you can't explain sharding is a bad one.
- **The hardest bug, in full detail.** What the symptom was, what you thought it was, how you were wrong, how you found it. This is the highest-value 3 minutes in the whole round.
- **The known weaknesses.** "It has no auth, the search is a LIKE query, and it would fall over past a few hundred concurrent users because everything's synchronous." Naming your own weaknesses before they find them converts a potential gotcha into a maturity signal.
- **The scale-up answer.** "If this had 100x users, the first thing to break would be X, and I'd fix it by Y." Even a rough answer beats a blank.

**On saying "I don't know."** You will hit a question you can't answer. The correct move: say you don't know, then say what you'd do to find out, then — if you can — reason toward a partial answer out loud. "I don't know what the default isolation level is. I'd check the docs. But I know we were seeing lost updates, which means it wasn't serializable, so it was probably read committed." That answer scores *better* than a confident wrong one. Interviewers are calibrated to detect bluffing and it is one of the few things that reliably tanks a round.

**On group projects and honesty.** If you contributed 20% of a project, present 20% of it as yours and be interested in the rest. Every interviewer has met the candidate who put the team's project on their resume as if they'd built it alone; the tell is that they can describe *what* it does but not *why* any decision was made.`,
    },
    {
      id: "questions-you-ask",
      heading: "The questions you ask them",
      markdown: `Every interview ends with "do you have questions for me?" and you get 5-10 minutes. This is scored — not heavily, but it's the last impression, and it's one of the few places you can actively move a lean-no to a lean-yes. It's also the only real information you'll get about whether the job is any good.

**What good questions signal:** that you've thought about the work, that you're evaluating them too, and that you'll be a curious teammate. What bad questions signal: that you're going through a motion.

**Questions that land**

Ask about the *work*, and ask things only this person can answer.

- "What's an intern project from last summer that actually shipped? What happened to it after the intern left?" — the single best question. Tells you if interns do real work or busywork.
- "What does the first two weeks look like? What's the ramp-up?"
- "What's the most annoying part of your development loop right now?" — engineers love this and answer honestly. You learn a lot.
- "How does code get from my machine to production? How long does that take?"
- "What's something the team is working on that you disagree with, or think is harder than people expect?"
- "How do you decide what an intern works on? Is it scoped in advance or picked when I arrive?"
- "What separates an intern who gets a return offer from one who doesn't?" — direct and appropriate. The answer is often literally the rubric.
- "What's the biggest technical debt the team is carrying?"
- "How much of your week is writing code versus everything else?"
- "What surprised you about this team when you joined?"

To a **recruiter**, ask process questions instead: timeline, number of rounds, what each round covers, team matching, when decisions get made, whether there's a re-interview policy. Recruiters answer these gladly and it costs you nothing.

To a **hiring manager**, ask about direction: what the team owns, what changes in the next year, how success is measured, how they think about intern mentorship.

**Questions that fall flat**

- **Anything on the careers page.** "What's the company culture like?" "What are the values?" You could have read this. It reads as unprepared.
- **"What's a typical day like?"** Too generic. Everyone gets asked this and everyone gives the same non-answer.
- **"Do you like working here?"** They will say yes. You've learned nothing and burned a question.
- **"What are the growth opportunities?"** For a 12-week internship, this sounds like you're planning your promotion before you've done any work.
- **Compensation, WFH policy, or vacation with an interviewing engineer.** Legitimate questions — ask the recruiter, not the person scoring you.
- **"How did I do?"** Puts them in an awkward position and they can't answer honestly.
- **Nothing at all.** "No, I think you covered everything" is the worst option available. It reads as disengaged even when you're just being polite. Always have two.

**Mechanics:**

- Prepare **five**, expect to ask **two or three**. Some get answered during the interview; if they all do, say so — "I had a question about the deploy pipeline but you covered it, so instead let me ask..." — that itself signals you were listening.
- **Tailor at least one to the person.** If they mentioned they work on the storage layer, ask about the storage layer. Generic questions to a specific person are a wasted opportunity.
- **Actually listen to the answer and follow up once.** A question you don't engage with was performance, and it shows.
- **Don't interrogate.** Two to three good questions in a real conversation beats a list of ten.`,
    },
    {
      id: "delivery-and-failure-modes",
      heading: "Delivery mechanics and the failure modes to kill",
      markdown: `The content can be right and the delivery still costs you the round. These are the recurring ones.

**"We" instead of "I."** The number one killer. Record yourself and count. Every "we decided" needs to become "I proposed X, and the team went with it" or "we agreed on X — my part was Y." You are not being arrogant; the interviewer literally cannot score a group.

**No timeline.** Stories without dates or durations feel invented. "Ten days out," "over one evening," "three review rounds across two weeks" — cheap to add, big credibility gain.

**Rambling setup.** If you're 45 seconds in and haven't said what you did, you've lost the room. Practice cutting straight to the tension.

**The unresolved story.** Some candidates narrate a problem and never say how it ended. Always land the Result.

**Blaming.** "My teammate was lazy," "the professor's spec was terrible," "management didn't know what they wanted." Even when true, this reads as someone who will be difficult. State the situation neutrally and spend your time on what you did about it.

**The fake weakness.** "I care too much." "I work too hard." Interviewers have heard these thousands of times and it costs you the self-awareness signal permanently. Give a real one with a real mitigation: "I default to building rather than asking, and I've lost days to that — I built a whole feature for a class project that the spec didn't want. Now I write a two-line summary of what I think I'm building and send it to someone before I start."

**Over-rehearsal.** A memorized-word-for-word answer sounds like one and interviewers dislike it. Memorize the *beats*, improvise the sentences. The tell is that you can't handle a mid-story interruption.

**Not answering the question asked.** Interviewers often ask something slightly different from what you rehearsed ("a time you disagreed with *your own* earlier decision"). Answer *that*. If you're bending a prepared story to fit, say so honestly: "The closest thing I have is..." — that's fine.

**Not asking for a moment.** "Let me think about that for a second" is completely acceptable and much better than talking while you search. Take five seconds. Interviewers do not penalize it; they penalize four minutes of meandering.

**Remote-specific:** look at the camera, not the thumbnail of your own face. Have your story bank open in a doc off-screen — a glance is fine, reading is not. Kill the notifications.

**A four-week practice plan:**

- Week 1 — write the 8 stories, one page each with the facts appendix.
- Week 2 — record each one out loud, timed. Cut every one to under 2:15.
- Week 3 — have someone ask you the 25 questions in random order and drill you with three follow-ups each. This is where you find the stories that fall apart under pressure.
- Week 4 — mock interviews with someone who'll be blunt, plus the opener and the resume deep-dive rehearsed cold.`,
    },
    {
      id: "question-bank-by-theme",
      heading: "The question bank, by theme",
      markdown: `Here are the questions you'll actually hear, grouped, with what's being tested. The starred ones have full model answers in the drill deck for this chapter.

**Conflict**
1. ★ Tell me about a conflict with a teammate. — *Testing: can you separate the person from the problem, and do you act without needing authority?*
2. Tell me about a time you disagreed with a decision the group made. — *Do you push back with reasons, then commit?*
3. ★ Tell me about a time you had to give someone difficult feedback. — *Directness plus care. Did you go private first?*
4. How do you handle someone who isn't contributing? — *Diagnosis before judgment.*
5. Tell me about working with someone whose style was very different from yours. — *Adaptability, not tolerance-as-suffering.*

**Failure**
6. ★ Tell me about your biggest failure. — *Do you own something real, and did you change behavior?*
7. ★ Tell me about a time you made a mistake that affected other people. — *Accountability and repair, specifically: did you tell them?*
8. Tell me about a time a project didn't work out. — *Can you diagnose causes without blaming?*
9. What's the last thing you were wrong about? — *Intellectual humility, recency (a stale answer means you're not reflecting).*

**Leadership**
10. ★ Tell me about a time you led without having authority. — *Influence mechanisms: clarity, example, removing friction.*
11. Tell me about a time you motivated a group. — *Did you find out what they wanted, or just push harder?*
12. Tell me about a time you delegated. — *Trust and follow-up, not dumping.*
13. Tell me about a time you stepped back and let someone else lead. — *Ego. Rarely prepared, highly valued.*

**Ambiguity**
14. ★ Tell me about a project with no clear requirements. — *Do you produce a definition and confirm it cheaply?*
15. What do you do when you're blocked and nobody's responding? — *Parallel unblocking, escalation timing.*
16. Tell me about a decision you made without enough information. — *Reversibility reasoning.*

**Learning**
17. ★ Tell me about learning something difficult quickly. — *Method, not just effort.*
18. Tell me about a time you had to work in an unfamiliar codebase or language. — *Navigation strategy.*
19. ★ Tell me about a time you taught someone something complex. — *Do you check for understanding?*

**Initiative**
20. ★ Tell me about something you did that nobody asked you to do. — *Did it stick? Second-order effects.*
21. Tell me about a time you went beyond the requirements. — *Judgment: was it worth doing, or gold-plating?*
22. Tell me about a process you improved. — *Did you measure before and after?*

**Teamwork**
23. Tell me about the best team you've been on and why. — *What you value in collaborators, indirectly.*
24. Tell me about a time you helped a struggling teammate. — *Did you help or take over?*
25. How do you make sure everyone's heard in a group? — *Concrete mechanisms.*

**Deadline pressure**
26. ★ Tell me about a time you couldn't finish everything. — *Prioritization criteria, and communication of the cut.*
27. Tell me about a time you had to cut scope. — *Who did you tell, and when?*
28. How do you handle multiple competing deadlines? — *A real system, not "I make lists."*

**Feedback**
29. ★ Tell me about difficult feedback you received. — *What you did in the next 48 hours.*
30. Tell me about a time you asked for feedback. — *Do you seek it proactively?*

**Ethics / judgment**
31. ★ Tell me about a time you saw something being done wrong. — *Will you raise it, and how?*
32. Tell me about a time you had to say no. — *Boundaries with reasons.*
33. What would you do if you found a serious bug the day before a demo? — *Honesty over optics.*

**Motivation**
34. ★ Tell me about yourself. — *Trajectory and self-editing.*
35. Why this company? Why this team? — *Did you do 20 minutes of homework?*
36. What are you looking to get out of this internship? — *Do you have goals, or do you just want a brand?*`,
    },
  ],
  questions: [
    {
      q: "Tell me about a conflict you had with a teammate.",
      a: `Use a real disagreement, not a personality complaint, and show diagnosis before action.

**Model (S1):** "Third year, distributed systems, four of us, five weeks to build a replicated key-value store. I owned the client library and test harness.

Ten days from the deadline the teammate who had the replication layer stopped pushing and went quiet for four days. My harness had nothing to run against.

The first thing I did was check my assumption — I looked at his branch, and there *was* work there, half-finished and failing. So this wasn't someone who'd checked out; it was someone stuck and going quiet about it. That changed my approach: I messaged him one-on-one instead of in the group chat, and I deliberately didn't lead with the deadline. He'd gotten wedged on leader election, spent a week rewriting it, and was embarrassed to say so in front of everyone.

I made two calls. I offered to pair for two hours that evening rather than take the work away — taking it would have made the silence worse and I'd have been learning that code cold under deadline. And in parallel I stubbed a single-node replication layer so the rest of the team was unblocked that afternoon regardless of how the pairing went. Pairing, we found he was implementing full Raft when the spec only needed a fixed leader. We cut it; he had it working in two days.

We shipped on time with all seven required behaviors passing. The durable thing for me: my instinct used to be to assume someone had bailed and route around them. Routing around someone is expensive — you lose their context. Now my first move is a private message that doesn't mention the deadline, and my second is to unblock myself in parallel so I'm not negotiating from panic."`,
      weak: `"We had a group project and a teammate wasn't pulling his weight. We tried talking to him a few times but it didn't change much, so we divided up his work and got it done. We got a good grade. I learned communication is really important."

Nothing here is scoreable. No timeline, no stakes, no diagnosis, no individual action ("we tried"), the result is a grade the candidate didn't cause, and the lesson is a platitude. The teammate is also a flat villain — strong candidates find out *why* someone went silent.`,
    },
    {
      q: "Tell me about your biggest failure.",
      a: `Pick something genuinely yours, state the damage plainly, and spend your time on cause and change.

**Model (S6):** "I built a signup tool for my ACM chapter. Twelve of us used it for a semester with no problems. Club fair week, about 200 people hit it in an afternoon, and it started handing out duplicate slots — two people assigned the same interview time, roughly a dozen collisions before someone flagged it.

It was my code and it was a design mistake, not a typo. I was reading the current signup count, incrementing it in application code, and writing it back — a read-modify-write with no transaction and no unique constraint. With twelve users the window never opened. With 200 concurrent, it did.

What made it a failure rather than a bug is that I couldn't reproduce it for two days. I was convinced it was a frontend double-submit because that was the explanation I *wanted*, and I spent a day adding debounce logic that did nothing. What actually found it was writing a script that fired 50 concurrent signups at a local instance — it reproduced in one run. Fix was a unique constraint on the slot plus letting the database reject the conflict rather than checking first.

Damage: I had to manually reconcile about a dozen double-bookings and email people to reschedule, which was genuinely embarrassing since I'd told the club it was ready.

Two things I actually changed. One: I don't hand-roll a check-then-write anymore — if uniqueness matters, the constraint goes in the schema, because the database is the only thing that can enforce it. Two, and this is the bigger one: I now write the load test *before* I believe my own theory about a bug. I lost a day to a hypothesis I liked. It's why I took distributed systems the next semester."`,
      weak: `"My biggest failure is probably that I take on too much. In one project I said yes to a lot of tasks and got overwhelmed and had to ask for help, which was hard for me. But I learned to manage my time better."

This is a humblebrag wearing a failure costume — "I work too hard" restated. No concrete incident, no consequence to anyone else, no technical content, no mechanism that changed. Interviewers read this as either unwilling to admit fault or not self-aware enough to have noticed one.`,
    },
    {
      q: "Tell me about a time you led a team or took the lead without having authority.",
      a: `Leadership without a title is the intern-appropriate version. Show what mechanism you used, since you had no power to compel anyone.

**Model (S5):** "I took over the workshop track for my university's ACM chapter in my second year. It had been running for two years and attendance was down to about six people a session, mostly the officers.

I had no authority — I couldn't make anyone show up or make anyone teach. So the first thing I did was find out why people weren't coming rather than assume it was marketing. I asked around at a chapter meeting and DM'd about fifteen people who'd come once and not returned. Two things came back consistently: the sessions were Thursday at 7pm, which collided with two big lab deadlines, and the topics were things people felt they should already know, so showing up felt like admitting a gap.

Three changes. Moved to Sunday afternoons, which nobody was competing for. Reframed the topics from 'Intro to Git' to 'Git problems you'll actually hit and how to get out of them' — same content, no implied deficiency in attending. And instead of recruiting officers to present, I asked people who'd just finished the relevant course, because they remembered what was confusing and it was a lower ask.

Attendance went from six to the high teens within three sessions and was over forty by the end of the semester, which meant we had to change rooms. The part I'm actually proud of: I handed the track to a second-year at the end of the year with a written playbook — the scheduling logic, the speaker pitch, the topic framing — and it kept running at that level after I left. That's the test of whether you actually built something or just personally carried it."`,
      weak: `"I was the leader of my group project. I made sure everyone knew what they had to do and I checked in with them regularly. I also did a lot of the work myself when people fell behind. We finished the project and got a good grade."

Being assigned "group leader" is not leadership, "checked in regularly" is not a mechanism, and "did the work myself when people fell behind" is the anti-signal — it says the candidate absorbs rather than resolves, which does not scale to a real team.`,
    },
    {
      q: "Tell me about a time you worked on something with no clear requirements.",
      a: `The test is whether you produce a definition and get it confirmed cheaply, rather than either freezing or building for three weeks in the wrong direction.

**Model (S8):** "I did a semester of undergraduate research. My advisor's brief was, essentially, 'see if this sampling approach helps on our dataset.' No success criteria, no baseline, no deadline other than end of term, and she was traveling for the first three weeks.

I could have started implementing immediately, which was tempting. Instead I spent the first week deciding what 'helps' would mean, because I realized I could build the whole thing and still not be able to say whether it worked. I wrote a one-page doc: the baseline I'd compare against — the existing method, run by me on the same data so it was apples to apples — the two metrics I'd report, and a threshold I'd call meaningful. Then I sent it to her with a specific ask: 'I'm going to proceed on these assumptions unless you object; here are the two I'm least sure about.'

That framing mattered. Asking an unavailable person an open question gets you nothing for two weeks. Giving them something to veto got me a reply in a day — she corrected one of the metrics, which would have made my results uninterpretable, and confirmed the rest.

The result was mixed and that's the honest answer: the approach gave about a 4% improvement on one metric and was slightly worse on the other, and I said so. But because I'd fixed the criteria before building, that was a *usable* result — she used the benchmark harness for the next student's project. If I'd started coding week one I'd have had a working implementation and no way to say whether it was any good.

The rule I took from it: when the spec is vague, write down your interpretation and send it as something to veto, not as a question. It's a five-minute cost and it either gets corrected or becomes the spec."`,
      weak: `"The requirements weren't clear so I asked my advisor for clarification and then built what she said. When I wasn't sure about something I'd ask. It worked out fine in the end."

This describes someone who needs to be told what to do. Ambiguity questions exist to find people who can operate when nobody answers. There's no decision, no artifact, and no result.`,
    },
    {
      q: "Tell me about a time you received difficult or critical feedback.",
      a: `The score is set by what you did in the next 48 hours, not by how gracefully you felt about it.

**Model (S4):** "My first real open source contribution was to a Python HTTP client library — a few thousand stars, active maintainers. I'd hit a bug where retries dropped custom headers, fixed it, wrote a test, opened a PR, and felt pretty good about it.

The maintainer closed it. Not 'requested changes' — closed, with a comment along the lines of: this only fixes the sync path, the async path has the same bug and a different code path, and the test doesn't actually exercise the retry, it just asserts the header is present on a first request.

My honest first reaction was that it was harsh and I nearly left it. I gave it a day, then reread it and realized both criticisms were straightforwardly correct and I'd have made the same call. The test in particular — I'd written a test that would have passed before my fix, which is the most embarrassing kind.

So I did three things. I asked one clarifying question and only one, because I'd already burned their patience: whether they wanted the async fix in the same PR or separate. Separate, they said. I read the async path properly, which meant actually learning how the library's transport abstraction worked rather than pattern-matching my sync fix onto it. And I rewrote the test so it failed on the old code — I verified that by checking out main and running it.

Three review rounds over about two weeks and it merged. The follow-up is the part I care about: the maintainer tagged me on a related issue a month later and asked if I wanted to take it.

What changed permanently: I now check that a regression test fails before the fix. Every time. That's a thirty-second habit that came out of one closed PR."`,
      weak: `"I got some critical feedback on a project once. At first I was frustrated but I took a step back and realized they had a point, and I used it to improve. I think feedback is a gift and I always try to be open to it."

All emotion-management, no action. What was the feedback? What did you change? Did the outcome improve? "Feedback is a gift" is a phrase from a poster. The interviewer cannot write a single evidence line from this.`,
    },
    {
      q: "Tell me about a time you took initiative on something nobody asked you to do.",
      a: `Initiative only counts if it stuck. Lead with the observation, and land on the second-order effect.

**Model (S3):** "I worked at my university's IT help desk, about 12 hours a week — password resets, printer problems, wifi, VPN.

After a couple of months I noticed I was answering the same handful of things constantly, so I started keeping a tally on paper for two weeks. Five issue types were roughly 60% of everything walking in the door, and four of those had a fixed sequence of steps.

Nobody asked me to fix this. What I did first was cheap: I wrote up those four as short step-by-step docs with screenshots and asked my supervisor if I could put them on the tickets we already emailed people. He said try it for the VPN one and see. VPN ticket volume for that issue visibly dropped over the next few weeks — students were solving it before coming in.

Then I did the second, bigger thing: our ticketing system supported canned responses, and nobody had set any up. I wrote five, got them reviewed by the full-time staff member so I wasn't putting my own wording in front of students, and got them added.

Two effects. Our average handle time on those categories dropped enough that my supervisor mentioned it in a staff meeting, and the docs got folded into the student-worker onboarding packet — I found out later they were still using them a year after I left.

The general lesson: before I built anything I spent two weeks counting. If I'd guessed at the top issues I'd have picked wrong — I would have said printers, and printers were fourth. The counting cost nothing and it's why the fix was aimed at the right thing."`,
      weak: `"At my job I always tried to go above and beyond. If I saw something that needed doing I would just do it without being asked, like helping other people with their tickets or staying late if we were busy. My manager appreciated that I was proactive."

Working harder is not initiative. There's no specific act, no diagnosis, no artifact, and nothing that outlived the shift. "My manager appreciated it" is the only result offered and it's secondhand.`,
    },
    {
      q: "Tell me about a time you had to work under a tight deadline and couldn't finish everything.",
      a: `The signal is your prioritization *criterion* and whether you communicated the cut early.

**Model (S2):** "36-hour hackathon, team of four. We'd pitched an app with three features: real-time collaborative editing, an ML tagging model, and an export/sharing flow. By hour 20 we had three things half-built and none demo-able. Two of us were still context-switching between them.

I called it. What I said was: in sixteen hours we finish one thing well or we finish nothing, and judging is a four-minute live demo, so the ranking criterion isn't which feature is most impressive on paper — it's which one *survives a live demo on conference wifi*. That reframing did most of the work in the conversation, because the ML tagging was the feature everyone was attached to and it was also the one most likely to hang for eleven seconds in front of a judge.

So we killed the ML model and the export flow. Collaborative editing stayed, because it demos itself — two laptops, one document, the judges can see it work. I also insisted on one thing that felt like a waste at the time: we spent an hour at hour 30 recording a local video fallback of the demo, in case the wifi died. It didn't die, but I'd rather spend an hour on insurance than lose the demo.

We finished with eight hours to spare, which we spent on the demo script and on fixing a reconnect bug we'd never have found otherwise. Placed second out of about forty teams.

What I'd do differently: the call was right, but I made it at hour 20 and the evidence was there at hour 12 — we'd had three unfinished things and no integration for eight hours. I now put a hard checkpoint at the one-third mark of anything time-boxed where the only question is 'what are we cutting,' because the default is to keep hoping."`,
      weak: `"We had a really tight deadline for a hackathon so we all worked really hard and pulled an all-nighter. It was stressful but we managed to get it done in time and we were happy with what we built."

Working harder is not a strategy, and this is the answer to a different question. There is no decision, no tradeoff, no criterion, and no result beyond "we were happy." Deadline questions exist to find out whether you can triage; this candidate has shown they cannot.`,
    },
    {
      q: "Tell me about a time you had to give someone difficult feedback.",
      a: `Show the mechanics: private first, specific behavior not character, and a concrete ask.

**Model:** "On a four-person capstone team, one teammate was reviewing PRs by approving them within about a minute of them going up — including a 400-line one of mine that had a bug he'd have caught. Meanwhile he'd hold his own PRs open waiting on all three of us.

I sat on it for a few days because I didn't want to be the person policing process. What made me act was realizing the bug he'd rubber-stamped had cost me an afternoon, so this had an actual cost, not just an aesthetic one.

I did it privately, over coffee after a class we shared, not in the group chat and not in a PR comment. I opened with the specific behavior rather than a characterization: 'When you approved the sync PR in about a minute, I shipped a bug that you'd probably have caught — I want to figure out what's making review feel like a formality.' I deliberately did not say 'you're not taking review seriously,' because that's a claim about him and he'd have had to defend it.

What came out was that he didn't feel qualified to critique our code and thought approving was the polite default — he genuinely didn't know that 'I read this and here are two questions' was an acceptable review. That was not what I'd assumed.

So the ask was concrete and small: leave at least one comment or question on every PR, even if it's just asking why something is the way it is, and don't approve anything you haven't run locally. That's checkable, unlike 'review more carefully.'

It held for the rest of the semester, and his questions caught two real problems. The thing I took from it: I'd assumed carelessness and it was uncertainty, and if I'd opened with the characterization I'd never have found that out. Lead with the observable behavior and its cost, then ask, then propose something specific."`,
      weak: `"I told my teammate that he needed to do a better job on his part of the project. I tried to be nice about it and he said okay. After that he did better, so I think it went well."

No mechanism, no specifics, no evidence the feedback landed rather than the person just wanting the conversation to end, and "do a better job" is not actionable feedback. This is a description of an awkward exchange, not of a skill.`,
    },
    {
      q: "Tell me about a time you learned something difficult very quickly.",
      a: `Interviewers want your *method*, not your work ethic. Everybody can say they stayed up late.

**Model (S4/S6 hybrid):** "Two weeks before a class project deadline my team decided we needed the thing to work across multiple processes, which meant I had to understand our database's locking behavior — and I'd been treating the database as a box that stores rows. I had roughly four days around other coursework.

What I did *not* do was read the manual front to back, which is my instinct and which wastes days. Instead I worked backwards from a failure I could reproduce. I wrote a twenty-line script that opened two connections and did an interleaved read-modify-write, and I ran it until it corrupted. Then I had something concrete to explain, and every doc page I read had a job: does this explain what I just watched happen?

Second thing: I forced myself to make predictions before running. I'd write down 'if I add SELECT FOR UPDATE here, connection two should block for the duration of connection one's transaction' and then check. Getting a prediction wrong is the fastest way to find out what you actually misunderstand — I'd assumed row locks were taken on read, and they weren't, and I'd never have surfaced that by reading.

Third: I found the shortest authoritative source rather than the most popular. The Postgres docs on transaction isolation are about six pages and answered more than an hour of blog posts had.

By day three I could explain the isolation levels to my teammate well enough that he caught a place in *his* code with the same problem, and that's my actual evidence that I'd learned it rather than memorized it. The project shipped.

The method generalizes and I use it deliberately now: reproduce the confusion in the smallest possible program, predict before running, and read primary sources. Effort was maybe fifteen hours; the structure is what made fifteen hours enough."`,
      weak: `"I had to learn React really quickly for a project. I watched a bunch of YouTube tutorials and read the docs and practiced a lot, and after about a week I was comfortable enough to build what we needed. I'm a fast learner."

"I watched tutorials and practiced" is what everyone does; it contains no method and no evidence. "I'm a fast learner" is an assertion, and the answer offers no way to check it — no artifact, no test of understanding, no result.`,
    },
    {
      q: "Tell me about a time you taught or explained something complex to someone.",
      a: `The differentiator is whether you *checked* that it landed, and whether you adapted when it didn't.

**Model (S7):** "I TA'd the intro systems course for two semesters. Pointers, and specifically pointer-to-pointer, is where a chunk of the class falls off — and by the time they get to office hours they've usually been told the same box-and-arrow explanation three times by three people and it hasn't taken.

The thing I changed was that I stopped explaining first. I'd ask them to explain to me what they thought was happening — and about half the time the misunderstanding wasn't pointers at all. It was that they didn't have a model of the stack: they thought a local variable in a function was the same storage as the variable in the caller. Explaining pointers to someone with that gap does nothing, because the explanation is built on a foundation they don't have.

Once I knew that, I'd do it concretely instead of abstractly. I'd have them draw memory as a numbered table on paper — addresses on the left, values on the right — and then hand-execute the program line by line, writing values into cells themselves. I held the pen only if they got stuck. The key was that *they* did the writing, because pointing at my drawing lets you nod along without understanding.

Then the check: I'd give them a small variant they hadn't seen — usually 'now write a swap function that actually swaps' — and have them predict the output before running it. If they could predict correctly, it landed. If not, we'd find where the table diverged from what they expected, and that spot was the misunderstanding.

Two semesters of this, and the concrete outcome I can point to is that the professor asked me to write it up as a standard office-hours walkthrough for the other TAs. The general lesson: diagnose before you explain, make them do the writing, and always end with a prediction they can be wrong about — otherwise you've confirmed nothing."`,
      weak: `"I tutored students in intro CS and I'd explain things in simpler terms and use analogies until they got it. I'm good at breaking down complex topics. Most of them ended up doing well in the class."

"Explain in simpler terms until they get it" is the definition of the task, not a technique. No diagnosis, no check for understanding, no adaptation, and the result is attributed loosely to students who may have done fine anyway.`,
    },
    {
      q: "Tell me about a time you saw something being done wrong, or had to raise an uncomfortable issue.",
      a: `Ethics questions are testing whether you'll say the inconvenient thing, and whether you do it proportionately rather than dramatically.

**Model:** "At the help desk, part of the job was verifying identity before a password reset — university ID, or two pieces of information from the account record. It's the entire point of the process.

I noticed one of the other student workers routinely skipping it for people he recognized. Not strangers — friends, people from his dorm. His framing was that it was obviously fine and the policy was for people we don't know.

It was uncomfortable because he was senior to me and we got along. But it's the exact process that stops someone from resetting an ex-partner's password by claiming to be them, and being recognized isn't authentication — I'd have had to be certain, and he wasn't checking, he was pattern-matching a face.

I went to him first, once, privately, and low-key: I said I'd noticed it, that I got why it felt like overkill, and that I wasn't comfortable with it because the whole control is that it applies to everyone. He didn't take it badly but he also didn't change — I saw it again the following week.

At that point I told the full-time staff member who ran the desk. I framed it as a process issue rather than as a report on a person: I said I'd seen ID verification getting skipped for familiar faces, that I'd raised it directly and it was still happening, and that I thought we needed the expectation restated to everyone rather than me policing it shift by shift. She handled it that way — restated it at the next staff meeting, no names — and it stopped.

What I'd defend about that: escalating first would have been disproportionate for something that might have been a misunderstanding, and never escalating would have meant I'd decided my comfort mattered more than the control. Going direct once, then up, is the sequence I'd use again."`,
      weak: `"I saw a coworker doing something against policy so I reported it to my manager. I think it's important to always follow the rules and do the right thing."

Skipping straight to escalation with no direct conversation reads as either conflict-averse or willing to burn a colleague for a small thing, and "always follow the rules" is a value statement rather than judgment. The interviewer learns nothing about how you weigh proportionality — which is the actual thing being tested.`,
    },
    {
      q: "Tell me about yourself.",
      a: `Ninety seconds, four beats: where you are now, the through-line, the most relevant recent thing, why you're here. Plant hooks you want drilled.

**Model:** "I'm a third-year CS student, and most of what I've done outside coursework has ended up on the backend and infrastructure side — I like the part of the problem where the thing you built doesn't survive contact with real traffic.

That started with a signup tool I built for my ACM chapter. It worked fine for the twelve of us, then about 200 people used it during club fair week and it started double-booking slots, because I'd done a read-modify-write on the counts with no transaction. Reproducing a race that only showed up one run in fifty was the most I've learned in three days, and it's why I took distributed systems the next semester.

Since then I've been the person on project teams who ends up owning the data layer and the test harness — last spring that was a replicated key-value store, where I wrote the client library and the harness everyone else developed against.

I'm interested in this internship specifically because it sits on infrastructure rather than product surface, and the failure modes I find interesting only show up at scale. That's the thing I can't get from a class project."

Note what this does: three drillable hooks, a trajectory rather than a list, an admitted bug of your own inside 30 seconds (which reads as confidence), and a specific reason for being in the room.`,
      weak: `"Sure! So I'm originally from [city], I got into computers when I was about twelve because my dad had an old laptop I took apart. I went to [high school] and then came here for CS. I've taken data structures, algorithms, operating systems, databases... I know Python, Java, C++, JavaScript, React, Node, some SQL and Docker. I did a project last year building a full-stack web app. I'm a hard worker and a fast learner and I'm really passionate about technology, and I'd love the opportunity to work at a great company like yours."

Chronological from childhood, a coursework list the resume already covers, a technology list that signals nothing, one vague project with no problem in it, three unfalsifiable adjectives, and a closer that would work for any company on earth. Ninety seconds spent, zero hooks planted.`,
    },
    {
      q: "Walk me through the project on your resume — and why did you choose that database?",
      a: `Own your slice precisely, then give the alternative you rejected and the honest reason. Honest and correct beats impressive and unsupportable.

**Model:** "The signup tool — it's a scheduling app for club events. Members pick interview slots, officers see a live roster, and it handles the waitlist when a slot frees up. Four of us built it; I owned the data model, the slot-assignment logic, and the API. The frontend was two teammates and I can tell you what it does but not why they structured components the way they did.

On the database: Postgres. Two reasons, and one of them is unglamorous. The real reason is that the data is relational — members, events, slots, and assignments with foreign keys in every direction, and the query I run constantly is 'give me every unfilled slot for this event with the member on the waitlist,' which is a join. Modeling that in a document store would have meant either duplicating member data into slots or doing the join in application code, and I'd have had to keep it consistent myself.

The second reason is that I knew it, and under a four-week deadline that's a legitimate input.

I considered Mongo, mostly because it was what the tutorials I'd seen used. What I'd have gotten is easier schema evolution early on, which genuinely would have helped in week one when I changed the slot model three times. What I'd have lost is the thing that ended up mattering most: the unique constraint on (event, slot) is what makes double-booking impossible, and I found that out the hard way after shipping a version that checked-then-wrote in application code and handed out duplicate slots under load.

Known weaknesses: there's no connection pooling tuned for anything, the officer roster view does an N+1 on the member lookup that I never fixed, and the whole thing is synchronous, so past a few hundred concurrent users the first thing to fall over would be the connection count. If I scaled it, that's where I'd start — pool the connections, then fix the N+1, and only then think about caching the roster."`,
      weak: `"I used MongoDB because it's more scalable and it's easier to work with than SQL databases. It's NoSQL so it can handle more data and you don't need to define a schema upfront, which was good for moving fast."

Every clause here is a repeated slogan the candidate can't defend, and the follow-up — "scalable how? what's your shard key? what happens when two writes hit the same document?" — will end badly. Claiming a technical reason you can't support is worse than saying "I picked it because I knew it," which is an answer no interviewer holds against a student.`,
    },
    {
      q: "What's your biggest weakness?",
      a: `Real weakness, real cost, real mechanism. The mechanism is the whole answer.

**Model:** "I default to building instead of asking. When something's unclear my instinct is to pick the interpretation I like and start writing code, because writing code feels like progress and asking feels like an interruption.

It's cost me. On a class project I built a whole caching layer for a spec that turned out not to want one — I'd read 'responses should be fast' and decided what that meant. That was most of a week, and I threw it away.

What I do now: before I start anything that's more than about half a day, I write two or three lines saying what I think I'm building and what I'm assuming, and I send it to whoever owns the requirement. Not a question — a statement they can veto, because that gets answered faster. It costs five minutes.

It's better, not fixed. I still catch myself doing it on small things where I decide the check isn't worth it, and I'm sometimes wrong about that. But the week-long version hasn't happened again."`,
      weak: `"I'd say my biggest weakness is that I'm a perfectionist — I sometimes spend too long making sure things are exactly right. I've been working on knowing when something is good enough."

Every interviewer has heard this hundreds of times and it is universally read as either "I have not reflected on this" or "I'm not going to tell you." Its siblings — "I work too hard," "I care too much," "I take on too much" — score identically. Give a real weakness; the self-awareness signal is worth far more than the imagined damage of admitting a flaw.`,
    },
    {
      q: "Why do you want to work here?",
      a: `Twenty minutes of homework, connected to something specific about you. Specificity is the entire test.

**Model:** "Two things, one about the work and one about how the internship is set up.

On the work: the team this role sits on owns [specific system/product area], and the reason that's interesting to me is that it's a problem where the hard part is [specific property — data volume, latency, correctness under concurrency, whatever is true]. I've only ever hit the toy version of that. When my club signup tool broke under 200 concurrent users, I found the whole class of problem fascinating and I could only go so far with it on a project nobody depends on.

On the internship structure: I looked into how interns here get projects, and what stood out is that they're scoped as things that actually ship rather than side experiments. I've read a few writeups from past interns and the projects were real. That matters to me more than the brand, honestly — I'd rather own one real thing end to end than shadow a team for twelve weeks.

I'd also say I'm interested in the engineering culture around [something specific and checkable — a public engineering blog post, an open source project they maintain, a technical decision they've written about]. I read [specific thing] and it changed how I think about [specific thing]."

Rule: if you could paste your answer into an application for a different company and it would still make sense, it's not an answer. Delete it and go read their engineering blog for twenty minutes.`,
      weak: `"I've always admired your company — you're a leader in the industry and you work on really impactful problems at massive scale. I'd love the opportunity to learn from such talented engineers and grow my skills in a fast-paced environment. I think the culture here would be a great fit for me."

Not one clause is specific to this company. It's a template with a name dropped in, and interviewers spot it instantly. It also says the only thing you know about them is that they're big.`,
    },
    {
      q: "Do you have any questions for me?",
      a: `Always have two. Ask about the work, and ask things only this person can answer.

**Strong openers:**

- "What's an intern project from last summer that actually shipped — and what happened to it after the intern left?" The single most informative question you can ask. It tells you whether interns do real work.
- "What's the most annoying part of your development loop right now?" Engineers answer this honestly and at length, and you learn more about the job than from anything on the careers page.
- "What separates an intern who gets a return offer from one who doesn't?" Direct, appropriate, and the answer is frequently the literal rubric.
- "How does code get from your machine to production, and how long does that take?"
- "What's something the team is doing that you'd argue with, or that's harder than people outside the team think?"

**Mechanics:** prepare five, ask two or three. Tailor at least one to the person — if they mentioned they work on storage, ask about storage. Follow up on the answer at least once; a question you don't engage with was theater. If everything got covered during the interview, say so and pivot: "I was going to ask about the deploy pipeline but you covered it — so instead, what surprised you about this team when you joined?"

**Route by role:** process and timeline questions go to the recruiter; team direction and what success looks like go to the hiring manager; day-to-day engineering reality goes to the engineers.`,
      weak: `"No, I think you covered everything, thanks!"

The worst available answer, and extremely common because it feels polite. It reads as disengaged, and it wastes the one segment of the interview you control. Nearly as weak: "What's the company culture like?" (on the careers page), "What's a typical day like?" (generic, gets a generic answer), "Do you enjoy working here?" (they will say yes), and asking an interviewing engineer about vacation policy or remote days — legitimate questions, wrong person, ask the recruiter.`,
    },
    {
      q: "Tell me about a time you disagreed with a decision and had to go along with it anyway.",
      a: `This is Amazon's "Have Backbone; Disagree and Commit," and most candidates only tell the disagree half. The commit half is the question.

**Model:** "On the capstone project, we had to pick between building our own auth or using a hosted provider. I argued hard for the hosted one — my case was that we had ten weeks, auth is the thing you most want to not get subtly wrong, and every hour on it was an hour not on the actual project. Two teammates wanted to build it, partly to learn and partly because they didn't want an external dependency in a demo.

I made the case once properly — I wrote out the estimate, listed the specific things we'd have to get right (password storage, session expiry, reset flow, rate limiting) and asked whether we wanted to be defending those in a demo. And then I lost, 3-1.

What I did after: I took the session management piece myself. That was deliberate. If I'd sat it out or been visibly reluctant, I'd have made the decision worse than it needed to be, and I'd also have been sniping from the sidelines every time it slipped. So I built the piece I'd been most worried about, which meant my concerns turned into working code rather than commentary.

Honest outcome: it took roughly the two weeks I'd estimated, which was longer than they'd expected, but it worked and the demo was fine. And one thing I was wrong about — I'd assumed the learning value was zero, and it wasn't. Two of us understand session handling properly now in a way we wouldn't have from reading a provider's SDK docs, and one of them caught a real cookie-scoping bug because of it.

What I'd do differently: I made my argument in a group conversation where two people had already stated a position, and positions harden once they're public. I'd have talked to them individually first. That's not about winning — it's that I'd have learned the 'we want to learn this' motivation earlier, and I'd have argued a different case."`,
      weak: `"I disagreed with my team about a technical decision but I went along with it since I was outvoted. It turned out I was right and we ran into the problems I predicted, so next time they listened to me more."

The story exists to prove the candidate was right, which is the opposite of the signal. There's no evidence of genuine commitment after the decision, no acknowledgment of anything they got wrong, and the ending is quietly smug. Interviewers hear "I told you so" and write down "may be difficult to work with."`,
    },
    {
      q: "What are you hoping to get out of this internship?",
      a: `Have actual goals. This question separates people who want a brand on their resume from people who want to do work.

**Model:** "Three things, roughly in order.

First, I want to work in a codebase I can't hold in my head. Everything I've built, I wrote most of or could read in a weekend. I don't know what it's like to make a change in a system where I have to figure out who else depends on the thing I'm touching, and I think that's the biggest single gap between me and someone who's been doing this professionally. That's not something I can manufacture on my own.

Second, I want to find out what production actually demands. I've had one thing break under load, and it taught me more than the six months before it. I want to see what monitoring, on-call, code review, and rollback look like when there are real consequences — including the parts that are tedious.

Third, honestly, I want to find out whether infrastructure work is what I think it is. I've oriented myself toward it based on class projects and one bad race condition, which is not much evidence. Twelve weeks doing it for real is the cheapest way to find out if I'm right about myself.

What I'd want on the other side is one thing I own end to end that's still running after I leave. I'd rather have that than have touched five things."`,
      weak: `"I'm hoping to learn as much as I can, gain real-world experience, and grow as an engineer. I'd also love to network and learn from senior engineers, and hopefully get a return offer at the end."

Interchangeable with every other candidate's answer. "Learn as much as I can" is not a goal — it's the absence of one. The return offer mention is fine to want and slightly odd to lead with; it frames the internship as an audition rather than as work you want to do.`,
    },
  ],
};
