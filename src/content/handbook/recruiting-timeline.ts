import type { HandbookChapter } from "./types";

export const chapter: HandbookChapter = {
  slug: "recruiting-timeline",
  title: "The Internship Recruiting Playbook",
  track: "process",
  order: 1,
  summary:
    "The full campaign for a US software engineering internship: when the cycle actually opens, how many applications to send, where listings come from, referrals, OAs, loops, offers, and what to do if you strike out.",
  estMinutes: 55,
  tags: [
    "recruiting",
    "timeline",
    "applications",
    "referrals",
    "online assessment",
    "offers",
    "negotiation",
    "internships",
  ],
  sections: [
    {
      id: "how-hiring-actually-works",
      heading: "How intern hiring actually works",
      markdown: `Most people lose this game before they write a line of code, because they
model internship recruiting as a **deadline** ("applications are due in the
spring") when it is actually a **race** ("applications are reviewed the day they
arrive, and the seats disappear").

Three structural facts drive almost every piece of advice in this chapter:

**1. Headcount is fixed and allocated before you apply.** A company decides in
the summer that it will take, say, 400 interns next year, distributed across
orgs. Recruiters fill that number and stop. There is no second wave when better
candidates show up in February — the seats are gone.

**2. Review is rolling, not batched.** Applications are read, screened, and
converted to online assessments continuously. This is why applying in the first
week of a posting is worth more than almost any resume improvement you could
make in that time. The same resume submitted in September and in January is two
completely different applications, because in September it competes against 900
others and in January against 40,000 — for a fraction of the remaining seats.

**3. The funnel is brutal and mostly automatic at the top.** For a large company
the rough shape is: resume screen (often a keyword-and-heuristic first pass,
sometimes a human, sometimes both) → online assessment → one or two technical
interviews → decision. Each stage cuts hard. You are not being evaluated as a
person until roughly the third stage, so stages one and two are about *volume
and speed*, not about being interesting.

The strategic consequence is uncomfortable but simple: **treat this as a
logistics problem first and a skill problem second.** Skill determines whether
you convert the interviews you get. Logistics determines how many interviews you
get. Students who prepare beautifully and apply in November routinely lose to
students who prepare adequately and applied in August.

### The one-paragraph version

Start applying the moment postings open in late summer. Apply broadly (100-250
applications is normal, not desperate). Track everything in a spreadsheet.
Ask for referrals from anyone you have a genuine connection to. Grind LeetCode
patterns in parallel so you're ready when the OA lands 48 hours after you apply.
Never stop applying because you have one interview in flight. Have a fallback
plan by December.`,
    },
    {
      id: "the-annual-calendar",
      heading: "The annual calendar",
      markdown: `US SWE internship recruiting for **Summer N** effectively runs from **roughly
July of year N-1 through April of year N**, with the bulk of the decisions made
before the calendar year even flips. Different segments of the market run on
noticeably different clocks.

| Segment | Postings typically open | Peak hiring | Notes |
| --- | --- | --- | --- |
| Quant trading / HFT (Jane Street, Citadel, Two Sigma, Jump, HRT, Optiver, IMC, SIG) | Late June – August | Aug – Oct | Earliest of everyone. Often done hiring by October. Many are one-and-done for the cycle. |
| Big tech (Google, Meta, Amazon, Microsoft, Apple, Nvidia) | Aug – Sept, some as early as late July | Sept – Dec | Rolling. Amazon and Microsoft often open earliest; some Google/Meta postings appear in waves through winter. |
| Large fintech / banks (Jane Street excluded; think JPM, Goldman, Bloomberg, Capital One) | July – Sept, some with hard fall deadlines | Sept – Nov | Banks often have real *deadlines* plus HireVue-style video screens. |
| Mid-size tech (Stripe, Databricks, Snowflake, Datadog, Palantir, Airbnb, Uber) | Sept – Nov | Oct – Feb | More variable. Some skip a cycle or hire tiny cohorts. |
| Defense / government / national labs | Sept – Jan | Oct – Mar | Long clearance and paperwork lead times; apply early even though decisions are slow. |
| Startups (Series A–C) | Dec – April | Feb – May | Just-in-time hiring. They post when a team realizes in February that it needs help in June. |
| Non-profits, university research, local companies | Jan – April | Feb – May | The realistic late-cycle fallback lane. |

### What this means month by month

| Month (year N-1 unless noted) | What you should be doing |
| --- | --- |
| May – June | Resume finalized. Personal project shipped or nearly shipped. Start LeetCode fundamentals (arrays, hashing, two pointers). Quant applications if that's your lane. |
| July | Watch the aggregator repos daily. Quant postings live. Some big-tech postings appear. Resume reviewed by 2-3 humans. |
| **August** | **The critical month.** Big-tech postings open. Apply the day each one appears. 100+ patterns of LeetCode done. Referral asks going out. |
| September | Heaviest application volume. Career fairs on campus. First OAs arriving — you should already be interview-ready, not starting prep. |
| October | OAs and first-round interviews. Quant cycle mostly closing. Keep applying — new postings still appear weekly. |
| November | Onsites / virtual loops. First offers land. Mid-size tech opening. Keep applying. |
| December | Offers and deadlines. Decision season. If you have nothing, this is when you pivot to the fallback plan explicitly. |
| January (year N) | Second wave: companies that under-filled, plus mid-size and startup postings. Do not treat January as "too late" — treat it as a different market. |
| February – March | Startups, small companies, university research, off-cycle roles. Referrals matter more here than anywhere. |
| April – May | Just-in-time startup hiring. Local companies. Last-minute backfills when interns renege. |

### The hardest thing to internalize

The gap between "postings open" and "students start applying" is where the
advantage lives. Most students start in October because that's when their peers
start talking about it. If you are meaningfully applying in August, you are
competing against a much smaller and much more self-selected pool for a much
larger share of the seats.`,
    },
    {
      id: "sizing-the-campaign",
      heading: "Sizing the campaign and tiering your list",
      markdown: `### How many applications is realistic

There is no universal number, but the honest ranges reported cycle after cycle
look roughly like this:

| Your situation | Typical application count | Rough interview conversion to expect |
| --- | --- | --- |
| Target school, prior internship, strong projects | 40 – 100 | Reasonably high; you can be selective |
| Any school, no prior internship, decent projects | 150 – 300 | Low single-digit percent to first-round |
| Non-CS major, career switcher, or late start | 250 – 500 | Very low; volume plus referrals plus fallback lanes |
| International student requiring future sponsorship | Add 30-50% to the above | Many listings are effectively closed to you |

Two things to take from that table. First, **a 2% response rate is normal, not a
verdict on you** — it is the arithmetic of tens of thousands of applicants for
hundreds of seats. Second, **volume without targeting is wasted effort**; 300
identical shotgun applications convert worse than 150 tiered ones.

### Tier your list

Split every company you're considering into three buckets and give each a
different amount of effort per application.

| Tier | What it is | Roughly how many | Effort per application |
| --- | --- | --- | --- |
| **Reach** (10-15%) | Companies where you'd take the offer instantly and where the bar is above where you are today: top AI labs, quant firms, FAANG-tier, hot startups | 15 – 30 | High. Tailored resume bullet ordering, referral attempt, research the team, prep their specific loop |
| **Target** (50-60%) | Real companies with real engineering where your profile is plausibly in range: mid-size tech, well-funded startups, strong non-tech companies with big eng orgs (banks, retailers, healthcare, insurance, logistics) | 80 – 150 | Medium. Base resume, quick tailoring of the summary line, referral if you happen to have one |
| **Volume** (30%) | Everything else that is a legitimate SWE internship: regional companies, government contractors, small consultancies, less-known but real employers | 50 – 120 | Low. Base resume, 3 minutes per application, no cover letter unless required |

The volume tier is not beneath you. It is what produces the offer that means you
do not spend the spring panicking, and it is where the "boring" companies that
give interns real production work live. A great internship at a logistics
company with a serious backend team beats no internship at a company with a nice
logo, and it makes the *next* cycle dramatically easier.

### The one rule about stopping

**Do not stop applying because you have an interview.** Do not stop applying
because you have an offer you're 80% sure you'll take. Applications are cheap
and reversible; a February with no pipeline is not. Stop when you have signed.`,
    },
    {
      id: "where-listings-come-from",
      heading: "Where listings actually come from",
      markdown: `Job boards are mostly noise. The high-signal sources, in rough order of value:

### 1. GitHub aggregator repos (highest signal, fastest)

Community-maintained repos that track new-grad and internship postings in near
real time, usually with a table of company, role, location, date posted, and a
direct application link. The two most widely used for internships are:

- **SimplifyJobs / Summer20XX-Internships** — the largest and most-watched list.
  Updated continuously, marks closed roles, flags roles that don't sponsor.
- **vanshb03 / Summer20XX-Internships** — a parallel list many people cross-check
  against; often catches postings the other misses or lists them earlier.

There are others (Ouckah, Pitt CSC's list, and various niche lists for quant,
hardware, or ML). Use two or three, not one.

**How to actually use them:** star and *watch* the repos so you get notified on
commits, or check them once every morning. The listings are sorted by date added
— you only ever need to read the top of the table. The entire practice takes
five minutes a day and is the single highest-return habit in the whole campaign.

### 2. Company career pages

The authoritative source, and sometimes ahead of the aggregators. For your reach
tier, check the careers page directly every week or two; large companies post
intern reqs on their own site before anyone indexes them. Set up job alerts on
the pages that support it.

### 3. University career portal and career fairs

Your school's portal (Handshake, Symplicity, or a homegrown system) carries two
kinds of value: postings restricted to your school (much smaller applicant pool)
and on-campus interview slots. **School-restricted postings have by far the best
odds-per-application of anything you will do.** Check the portal weekly even
though the UI is bad.

### 4. Handshake

Useful mostly for the school-restricted and regional postings. The national
listings duplicate what's elsewhere. Keep your profile complete because some
recruiters source from it directly.

### 5. LinkedIn

Best used three ways, none of which is "click Easy Apply on 200 jobs":
- Set alerts for specific companies so you learn when a req opens.
- Find alumni at target companies for referrals (see the next section).
- Notice when a recruiter posts "my team is hiring interns" — those posts convert
  far better than the job board, because you can reply directly.

Easy Apply is not useless, but it is the lowest-yield channel per application.
Prefer applying on the company's own system when both exist.

### 6. Discords, subreddits, and Slack communities

r/csMajors and r/cscareerquestions surface postings and cycle information. Field-
specific Discords (ML, systems, game dev) surface small-company roles that never
hit the aggregators. Treat community sentiment about the market as unreliable —
it skews doom — but treat individual postings as real leads.

### 7. Your professors and labs

Underrated. Faculty get emails from companies and alumni that never become public
postings, and university research positions are a legitimate fallback (covered
later in this chapter).`,
    },
    {
      id: "tracking-hygiene",
      heading: "Application tracking hygiene",
      markdown: `A 200-application campaign collapses without a tracker. Not because you forget
to apply, but because you lose track of which company sent an OA with a 5-day
window, which recruiter you owe a reply, and which application you already
submitted (submitting twice looks careless and some ATS systems reject it).

### Minimum viable tracker

One spreadsheet. These columns, in this order:

| Column | Why it exists |
| --- | --- |
| Company | Obvious |
| Role / req title | Companies post several intern reqs; you need to know which |
| Tier | Reach / Target / Volume — lets you sort effort |
| Date applied | Drives follow-up timing and tells you if you're applying fast enough |
| Source | Aggregator / career page / referral / fair — tells you which channel actually works for you |
| Referral? | Who, and whether the referral was submitted |
| Status | See status vocabulary below |
| Next action + due date | The single most important column |
| Deadline | OA expiry, offer deadline, take-home due date |
| Contact | Recruiter name and email |
| Notes | Interviewer names, what was asked, what you promised to follow up on |

### Status vocabulary — keep it small and mutually exclusive

\`\`\`text
APPLIED        submitted, no response yet
OA_SENT        assessment received, not yet started   <- has a deadline
OA_DONE        assessment submitted, awaiting result
SCREEN         recruiter call scheduled or done
LOOP           technical interviews scheduled or in progress
OFFER          offer extended                          <- has a deadline
REJECTED       explicit no
GHOSTED        no response 6+ weeks after applying, treat as closed
WITHDRAWN      you pulled out
\`\`\`

Two of those statuses carry a hard clock. Those rows should be visually flagged
(conditional formatting on the deadline column) so they can never be missed
while scrolling past 180 rows.

### The rules that keep it alive

1. **Log the application within 60 seconds of submitting it.** Not "at the end of
   the day". You will not remember, and a tracker you trust only 90% of is a
   tracker you stop using.
2. **A dedicated email folder or label**, plus a filter, so recruiting mail never
   sits in a general inbox. Missing an OA email because it landed under
   promotions is a genuinely common way to lose an internship.
3. **Check spam weekly.** Assessment platform emails (HackerRank, Codility,
   CodeSignal, HireVue) are frequent false positives for spam filters.
4. **One weekly review, same day each week, 20 minutes.** Move GHOSTED rows out.
   Send the follow-ups that are due. Count applications sent this week against
   your target. This is the ritual that keeps the campaign from silently dying in
   November.
5. **Log what was asked after every interview, same day.** Company loops repeat
   question *types* across candidates and across years, and if you interview
   there again next cycle this file is worth more than any prep book.
6. **Never delete rows.** Rejections are data: after 60 applications you can see
   whether your resume is failing at the screen (few OAs) or your OA performance
   is failing (many OAs, no screens). Those are completely different problems
   with completely different fixes.

### The diagnostic that spreadsheet enables

| Symptom | Likely problem | Fix |
| --- | --- | --- |
| 100+ applications, almost no OAs | Resume or timing | Rewrite resume bullets to be quantified and technical; check whether you're applying within a week of posting |
| Plenty of OAs, few pass | Coding speed and correctness under time pressure | Timed practice, not untimed practice |
| Pass OAs, fail first technical round | Communication during problem solving, or shaky fundamentals | Mock interviews out loud, not silent solving |
| Reach final round, no offer | Behavioral depth, or bar is genuinely at the edge | Build a real story bank; widen the target tier |
| Everything stalls after recruiter screen | Availability, sponsorship, or location mismatch | Fix what you say in the screen (see the questions at the end) |`,
    },
    {
      id: "referrals",
      heading: "Referrals: who to ask and exactly what to say",
      markdown: `A referral does not get you hired. What it typically does is get your
application looked at by a human, sometimes flagged in the ATS, sometimes routed
past the automated screen. At large companies that is worth a lot at the top of
the funnel and nothing at all after the first interview.

### Who to ask, best to worst

1. **People who have actually worked with you** — former teammates, a manager
   from a previous internship, a hackathon partner, a project collaborator, a
   TA/student you've built something with. These referrals carry real content.
2. **Friends and friends-of-friends at the company.** Ask your immediate circle
   who they know before going to strangers. A warm intro from a mutual friend
   converts far better than a cold message.
3. **Alumni from your university.** Search LinkedIn for your school + the
   company. Alumni respond at a much higher rate than random employees and many
   are genuinely happy to help — they were you three years ago.
4. **Recruiters and engineers who posted publicly that they're hiring.** They
   have invited contact; take them up on it.
5. **Cold outreach to engineers on the team you'd join.** Lowest hit rate,
   nonzero. Keep it short and don't take silence personally.

Do not buy referrals, and be careful with "referral swap" threads — a referral
from someone who has never spoken to you is often weaker than none, and at some
companies referrers are scored on the quality of who they refer.

### The message that actually works

Keep it under 150 words. Make it trivially easy to say yes. Attach the resume in
the first message so there's no back-and-forth. Name the exact req.

**LinkedIn / cold-ish alumni message:**

\`\`\`text
Subject: [School] student — quick referral ask for the [Company] SWE Intern role

Hi [Name],

I'm a [year] CS student at [School] — I saw you're on the [team/org] team at
[Company] and wanted to reach out.

I'm applying for the Summer [YEAR] Software Engineering Internship (req
[ID / link]). I've been working on [one concrete, specific thing: "a Go service
that ingests ~2M events/day for my university's transit app" beats "several
projects"], and [Company]'s work on [specific product or engineering blog post]
is a big part of why it's my top choice.

Would you be open to submitting a referral? I've attached my resume, and I'm
happy to send anything else that would make it easier. Completely understand if
you'd rather not refer someone you haven't worked with.

Thanks either way,
[Your name] | [GitHub] | [Portfolio]
\`\`\`

**To someone who knows you (much shorter — do not over-formalize with friends):**

\`\`\`text
Hey [Name] — hope [specific thing you know about them] is going well.

I'm applying for [Company]'s Summer [YEAR] SWE internship (req [link]). Any
chance you'd be up for referring me? Resume attached, happy to fill in whatever
the form needs.

No pressure at all if it's awkward.
\`\`\`

### What happens after

- Most referral systems ask the employee for your email, resume, and sometimes a
  short justification. **Then you still apply normally**, or the referral link
  routes you to apply. Ask which order the company uses — getting this wrong can
  strand your application.
- Follow up **once**, about a week later, and then let it go. "Just checking if
  the referral went through — no worries either way, and thanks again."
- If they refer you, tell them the outcome, good or bad. It costs you one message
  and it's the difference between a one-time favor and a person who will refer
  you again next cycle.
- Referrals sometimes come with a bonus for the employee if you're hired. That is
  fine and normal; it is why cold asks work at all.

### Timing

Ask for the referral **before or within a few days of applying**, not a month
later. Once your application has been auto-rejected, a referral usually cannot
revive it in the same cycle.`,
    },
    {
      id: "career-fairs",
      heading: "Career fair strategy",
      markdown: `Career fairs are one of the last places where a human decision gets made about
you in under five minutes, which makes them disproportionately valuable if you
prepare and nearly worthless if you don't.

### Before

- **Get the employer list the week before** and triage it into three groups: must
  talk to (5-8 companies), worth talking to (10-15), and skip. You will not get
  through 40 booths.
- **Apply online before the fair** to your must-talk list, if the req is open.
  Then at the booth you say "I've already applied, req ID is X" — which converts
  a conversation into an action the recruiter can actually take.
- **Research 2-3 sentences per must-talk company.** Not corporate values — a
  product, a technology, an engineering blog post. This is the entire difference
  between memorable and forgettable.
- **Print 20 resumes.** Yes, still. Bring a folder so they aren't creased.
- **Have a digital fallback**: a short link or QR code to your resume, because
  many fairs are now partly virtual and many recruiters prefer a scan.

### The 45-second pitch

Structure: who you are → what you've built → what you want → the ask.

\`\`\`text
"Hi, I'm [Name], I'm a [year] CS major at [School]. Most of what I've been
doing lately is backend — I built [specific project] using [stack], and the
interesting part was [one concrete technical problem you solved].

I saw [Company] is hiring SWE interns for next summer, and I'm especially
interested because [specific, researched reason].

I've already applied — req [ID]. Is there anything else you'd suggest I do, or
anyone on the team it'd make sense for me to talk to?"
\`\`\`

Then **stop talking**. The most common failure at a fair booth is a monologue.
Ask them something real: what does an intern on your team actually work on? What
separates the interns who get return offers?

### Logistics that matter more than they should

- **Go early.** Recruiters at hour four have seen 200 people and are running on
  fumes. The first hour is worth double.
- **Long lines are not always the best use of time.** A 40-minute queue for a
  60-second scan of your resume is a bad trade if you could have had a real
  five-minute conversation at three less-mobbed booths.
- **Get a name and an email.** A business card, or their name spelled correctly
  in your notes. Without it you cannot follow up, and the follow-up is where the
  value is.
- **Write notes immediately after each booth** — one line about what you talked
  about. By booth ten you will not remember booth two.

### The follow-up email (send within 24 hours)

\`\`\`text
Subject: Great talking at the [School] career fair — [Your Name], SWE Intern

Hi [Name],

Thanks for taking the time at the fair yesterday. I enjoyed hearing about
[specific thing they said — this is what proves you were actually listening].

As mentioned, I've applied to the Summer [YEAR] SWE Internship (req [ID]).
I've attached my resume again for convenience. Quick recap of the fit: I've
been working on [one-line specific project], which lines up closely with the
[team/area] work you described.

If it's useful, I'm happy to send code or walk through the project. Thanks
again for your time.

Best,
[Name] | [email] | [GitHub]
\`\`\`

### Virtual fairs

Same rules, worse signal. The differentiator is showing up on time to your booked
slot, having a working camera and a quiet room, and having your one specific
project ready to describe in 30 seconds. Book slots the day registration opens —
they fill within hours for the desirable companies.`,
    },
    {
      id: "online-assessments",
      heading: "The online assessment stage",
      markdown: `For high-volume employers the OA is the real first filter, and it is a
substantially different skill from an interview: no interviewer, no hints, no
partial credit for explaining your thinking, and a clock.

### The common platforms and their flavors

| Platform | Typical format | What's distinctive |
| --- | --- | --- |
| **HackerRank** | 2-4 algorithmic problems, 60-120 min, hidden test cases | The most common. Problem statements can be long and poorly worded; parsing the question is part of the test. Often has a debugging or MCQ section too. |
| **CodeSignal** | Often the "General Coding Assessment" (GCA): 4 questions, 70 min, increasing difficulty | Produces a *portable score* some companies share, so one strong attempt can serve several applications. Question 1 is usually trivial implementation; question 4 is usually a real algorithm problem. Strictly proctored. |
| **Codility** | 2-3 problems, 90-120 min, heavy emphasis on edge cases and complexity | Grades correctness *and* performance separately — a solution that passes but is O(n²) scores partial. Edge cases (empty input, single element, overflow) are always tested. |
| **HireVue / one-way video** | Recorded answers to behavioral prompts, 30-60 sec think time | Common at banks and large non-tech employers. Sometimes paired with a coding section. |
| **Company-built** (Amazon, Google, some others) | Varies; often 2 coding questions plus a work-styles or behavioral survey | The non-coding sections are scored. Do not click through them. |

### Proctoring realities

Assume you are being monitored. Common measures: full-screen enforcement with
tab-switch logging, webcam and screen recording, paste detection, keystroke
timing, and plagiarism comparison against other submissions and public solutions.

- **Copy-pasting a solution is the single most reliable way to get blacklisted**
  at a company, sometimes permanently, sometimes across the whole cycle.
- Tab-switching is usually *logged*, not always *fatal*, but do not gamble.
- If your camera or connection fails mid-assessment, screenshot the error and
  email the recruiter immediately. Recruiters reissue assessments for genuine
  technical failures reasonably often; they do not reissue for "I ran out of time."

### How to prepare specifically for OAs

The mistake is preparing for interviews and assuming that covers OAs. It does
not. OA-specific practice means:

1. **Timed, cold, no hints.** Set a timer, open a problem you've never seen, and
   solve it in one sitting with no editor autocomplete help you wouldn't have.
2. **Practice in the platform's editor**, not your IDE. No autocomplete, no
   debugger, limited syntax help. HackerRank and CodeSignal both have free
   practice modes. The first time you use a bare editor should not be the real
   test.
3. **Know your language's I/O boilerplate cold.** Some OAs hand you a function
   signature; others make you parse stdin. Losing eight minutes to reading input
   is a real and common failure.
4. **Write the brute force first if you're stuck.** Hidden test cases usually
   include small inputs. A brute force that passes 6/15 cases scores more than an
   elegant half-finished solution that compiles into nothing.
5. **Test edge cases before submitting**, every time: empty input, one element,
   all-identical elements, maximum size, negative numbers, integer overflow. On
   Codility especially, this is where the marks are.
6. **Watch the complexity budget.** Constraints tell you the intended solution.
   n ≤ 10⁵ means roughly O(n log n). n ≤ 20 means exponential/bitmask is fine.
   n ≤ 10³ allows O(n²). Read the constraints before you design.

### Timing and logistics

- OAs commonly arrive **1-14 days after applying**, sometimes within hours from
  automated systems.
- The window to complete is usually **3-7 days** from receipt. Do it early in the
  window, not on the last night — you want the buffer for a technical failure.
- Take it when you're actually sharp. It is legitimate to start it on a Saturday
  morning rather than after a full day of classes.
- Some companies allow one retake in a cycle, most do not. Assume not.
- **Silence after an OA is normal.** Two to four weeks with no response is common
  and does not mean rejection. Many companies never send a rejection at all.`,
    },
    {
      id: "take-homes",
      heading: "Take-home projects",
      markdown: `Less common than OAs for interns, but used by startups, some mid-size companies,
and occasionally as a substitute for a full loop. They are usually scoped at
2-6 hours and given a 3-7 day window.

### What is actually being scored

Rarely raw cleverness. Almost always:

| Signal | What they look at |
| --- | --- |
| Does it work | Do the stated requirements run correctly from a clean clone? |
| Setup friction | Can a reviewer run it in under five minutes from the README? |
| Code organization | Is there structure, or is everything in one 400-line file? |
| Testing | Are there any tests at all, and do they test something meaningful? |
| Judgment on scope | Did you build what was asked, or gold-plate it into an unreviewable mess? |
| Communication | Is there a README explaining decisions, trade-offs, and what you'd do with more time? |

### How to do well

1. **Read the whole prompt twice and list the explicit requirements.** Then build
   exactly those. Unrequested features are neutral at best and often read as poor
   prioritization.
2. **Respect the stated time budget.** If it says four hours, spending twenty is
   not impressive — it distorts the signal and some reviewers can tell from commit
   timestamps. If you go over, say so honestly in the README.
3. **Write the README last but treat it as part of the deliverable.** Structure:
   how to run it, what you built, key decisions and why, known limitations, what
   you'd do with another day. This document is very often what separates two
   otherwise-equal submissions.
4. **Include tests.** Even three or four. Untested submissions get marked down
   almost universally, and "I ran out of time for tests" in the README is much
   better received than silence.
5. **Commit incrementally with real messages.** Reviewers do look at history, and
   a clean history reads as a professional habit.
6. **Handle errors and edge cases visibly.** A single guarded input validation
   demonstrates more than a feature.
7. **Ask clarifying questions by email if the prompt is ambiguous.** This is
   almost always allowed and usually scored positively.

### When to decline

A take-home that would take more than about eight hours for an *intern* position,
especially one that looks suspiciously like real product work, is a legitimate
thing to push back on. A polite "I'd love to do this — would it be possible to
scope it to the core requirement, or to do a live pairing session instead?" is a
reasonable message and rarely costs you the process at a serious company.`,
    },
    {
      id: "recruiter-screen",
      heading: "The recruiter screen",
      markdown: `A 15-30 minute call, usually non-technical, usually with a recruiter or
coordinator rather than an engineer. Students underestimate it constantly. It is
rarely where you *win*, and it is regularly where people quietly lose — on
logistics, not ability.

### What it's for

1. Confirming you're real, available, and legally employable for the term.
2. Confirming interest and rough fit.
3. Selling you on the company.
4. Scheduling the next stage.

### What they will ask

- Tell me about yourself. (Two minutes, not eight. See the questions section.)
- Walk me through a project on your resume.
- Why this company / why this team?
- What are you looking for in an internship?
- **Availability**: what dates can you start and end? Do you have a summer class,
  a lease, a graduation ceremony, an existing commitment?
- **Location**: which offices work for you? Are you open to relocating? Is remote
  a requirement?
- **Work authorization**: are you legally authorized to work in the US, and will
  you now or in the future require sponsorship? (Answer this accurately — see the
  visa section.)
- **Timeline**: are you in process with other companies, and where are you in
  those processes?
- Graduation date, degree, and whether you're returning to school after.

### The logistics traps

| Trap | What to do |
| --- | --- |
| Vague availability | Have exact dates ready: "I'm available May 18 through August 21, and I can be flexible on the end date." |
| Being coy about other processes | Say you're interviewing elsewhere without naming a company. It creates urgency and it's true. |
| Overstating flexibility on location | If you genuinely cannot relocate, say so early. Getting to a final round for a role you can't take wastes everyone's time and burns a company for next cycle. |
| Mishandling the sponsorship question | Answer factually and move on. Do not editorialize or apologize. |
| Salary question | For interns, this is usually informational. "I'm focused on the fit and the work; I'd expect the standard intern rate for the role." |

### Questions to ask them

Have three ready. Good ones for a recruiter (save the deep technical ones for
engineers):

- What does the intern project scoping process look like — are projects assigned
  before you arrive, or chosen once you're on a team?
- How does team matching work? Do I interview for a specific team or a general pool?
- What does the rest of the process look like and roughly what's the timeline?
- What distinguishes interns who get return offers here?
- Is the internship in person, hybrid, or remote, and is housing supported?

### After

Send a short thank-you within 24 hours, and **confirm anything logistical in
writing**. If the recruiter says "we'll get back to you in two weeks," a one-line
email restating that is how you earn the right to follow up on day fifteen
without seeming pushy.`,
    },
    {
      id: "the-loop",
      heading: "The interview loop, stage timing, and following up",
      markdown: `### The typical intern loop

Intern loops are shorter than full-time loops. The generic shape:

| Stage | Length | Content |
| --- | --- | --- |
| Technical round 1 | 45-60 min | One or two coding problems, usually LeetCode-easy/medium range, plus resume discussion |
| Technical round 2 | 45-60 min | Harder coding, or coding plus fundamentals (OS, concurrency, databases), sometimes a light design discussion |
| Behavioral / fit | 30-45 min | Sometimes standalone, more often folded into the technical rounds |
| Team match | Varies | At some companies happens after the loop; at others you interview directly with a team |

Most intern loops are **two technical rounds**. Some are one. A few (quant firms,
some AI labs, Palantir) run three to five. Chapter two of this track covers the
per-company specifics.

### Realistic timing between stages

Everything below is typical, not guaranteed, and everything runs slower in
November-December and around holidays.

| Transition | Typical wait | When to follow up |
| --- | --- | --- |
| Application → OA | 1-14 days (sometimes hours) | Don't. It's automated. |
| OA → result | 1-4 weeks | After 3 weeks, if you have a named contact |
| OA → recruiter screen | 1-3 weeks | Same |
| Screen → loop scheduled | 3-10 days | After 10 business days |
| Loop → decision | 3 days to 4 weeks | After 10 business days, or after whatever date they gave you |
| Offer → deadline | 1-4 weeks, occasionally less | Immediately, if the deadline is a problem |
| Team match | 1-8 weeks | Every 2 weeks |

**Peak-season reality:** in September and October, decisions can be fast (days).
In December and January, the same company can take a month because the recruiter
is buried and half the team is on vacation. Slowness is very rarely a signal
about you.

### Following up without being annoying

The rules: follow up **once per stage**, wait for the stated timeline plus a few
business days, keep it under 100 words, and always give them an easy out.

**Standard status check:**

\`\`\`text
Subject: Following up — [Your Name], SWE Intern [req ID]

Hi [Name],

Hope your week's going well. I wanted to check in on the [stage] for the
Summer [YEAR] SWE Internship — I interviewed on [date] and understood the
timeline was around [what they told you].

I'm still very interested, particularly after talking with [interviewer] about
[specific thing]. Happy to provide anything else that would help.

Thanks for your time,
[Name]
\`\`\`

**Nudging with a competing deadline (the one that actually moves things):**

\`\`\`text
Subject: Timeline update — [Your Name], SWE Intern

Hi [Name],

I wanted to flag a timing update. I've received an offer from another company
with a decision deadline of [date].

[Company] is my top choice, so before I make a decision I wanted to ask
whether it's possible to get an update on where I stand, or to accelerate the
remaining steps. Completely understand if that isn't feasible.

Thanks either way,
[Name]
\`\`\`

That email is unusually effective and is true leverage — but only use it if it is
literally true. Recruiters talk to each other and to your school.

**Thank-you notes after interviews:** optional, mildly positive, never
decisive. If you send one, send it within 24 hours, reference something specific
from the conversation, and keep it to four sentences. Do not send one to every
interviewer with the same text — they compare.

### Handling silence

If you have heard nothing eight weeks after applying with no interview contact,
mark it \`GHOSTED\` and move on emotionally. Companies routinely close reqs
without notifying applicants. It is not personal and it is not a reflection of
your resume — sometimes headcount was simply cut mid-cycle.`,
    },
    {
      id: "offers-and-deadlines",
      heading: "Offers, exploding deadlines, and negotiation",
      markdown: `### The first 24 hours after an offer

1. **Say thank you and express enthusiasm, immediately.** Do not accept on the
   call and do not decline on the call.
2. **Get it in writing**: base rate, hours per week, exact start and end dates,
   location, housing or relocation stipend, signing bonus if any, and the
   response deadline.
3. **Ask for the deadline explicitly** if they didn't give one: "When would you
   need a decision by?"
4. **Tell every other company in your pipeline within 24 hours.** This is the
   single most valuable thing an offer buys you — it accelerates every other
   process you're in.

### What is and isn't negotiable for an intern

This is where students waste credibility. Intern compensation is usually set by a
**level-and-location band** that a recruiter cannot move, especially at large
companies where every intern in a given office and year is paid identically for
fairness and legal reasons.

| Item | Negotiable? | Notes |
| --- | --- | --- |
| Hourly / monthly base rate | **Usually not** at big companies; sometimes at startups and mid-size firms | Big-tech intern pay is banded. Asking is not offensive, but expect "no". |
| Signing / relocation bonus | **Sometimes** | The most commonly flexible dollar amount, especially if you're relocating far. |
| Housing / stipend | **Sometimes** | Often a fixed program benefit, but occasionally adjustable. |
| Start and end dates | **Usually yes** | The easiest and most valuable thing to negotiate. Term length, late start for exams, early end for a lease. |
| Location / office | **Sometimes** | Depends entirely on where headcount sits. |
| Team or project | **Sometimes** | Especially where team matching is a separate step. Worth asking for. |
| Decision deadline | **Very often yes** | See below — this is the highest-return ask. |
| Return-offer guarantees | **No** | Nobody will promise this in writing. |

**The one genuine lever intern candidates have is a competing offer.** With a
written competing offer from a comparable company, a rate or bonus adjustment
becomes plausible at some employers. Without one, "I'd like more money" has
essentially no basis and mildly damages the relationship.

If you do negotiate: be warm, be specific, ask once, and make clear you're
enthusiastic regardless of the answer.

\`\`\`text
Hi [Name],

Thank you again — I'm genuinely excited about this offer and [Company] is at
the top of my list.

I wanted to ask about one piece. I've received an offer from [other company /
"another company in the same space"] at [rate], and while compensation isn't
my deciding factor, I'd love to know whether there's any flexibility on the
[rate / signing bonus / relocation support].

Either way I'm very interested, and I'd be glad to keep talking about next
steps.

Best,
[Name]
\`\`\`

### Exploding deadlines

An "exploding offer" is one with a very short fuse — sometimes 48-72 hours —
designed to stop you from shopping it. They are most common at firms that
interview early (notably parts of the quant and finance world) and at some
startups.

**Always ask for an extension.** The worst realistic outcome is "no". Asking is
routine and professional, and recruiters grant extensions far more often than
students expect.

\`\`\`text
Subject: Offer decision timeline — [Your Name]

Hi [Name],

Thank you again for the offer — I'm genuinely excited about it.

I want to give it the consideration a decision like this deserves, and I have
[one/two] interview processes that are scheduled to conclude by [date]. Would
it be possible to extend the decision deadline to [specific date you're
asking for]?

I'd rather accept with full confidence than rush the decision, and [Company]
is a strong contender either way. Let me know what's workable.

Thanks,
[Name]
\`\`\`

Notes on doing this well:
- **Ask for a specific date**, not "more time".
- **Give a real reason.** "I have processes concluding on the 12th" is a reason.
  "I want to think" is not.
- **Ask early**, not on the deadline day.
- If they refuse and the deadline genuinely forces your hand: take the offer.
  A real internship in hand beats a hypothetical better one. You can run the
  cycle again next year from a much stronger position.

### Reneging

Accepting an offer and then backing out to take another is legal in almost all
cases, and it is also genuinely damaging: some companies blacklist you
permanently, some university career centers sanction students for it, and the
recruiting world is small. Occasionally it is the right call (a life-changing
difference in opportunity, or a change in your circumstances), but treat it as a
serious act and not a strategy. The better plan is to not accept until you're
prepared to stop interviewing.

### Declining gracefully

\`\`\`text
Hi [Name],

Thank you so much for the offer and for the time you and the team put into
the process. After a lot of thought, I've decided to accept an offer
elsewhere that's a closer fit for [genuine, brief reason].

This was a hard decision — I really enjoyed talking with [interviewer/team],
and I hope our paths cross again. I'd welcome the chance to be considered in
a future cycle.

Thanks again,
[Name]
\`\`\`

Do it promptly. The seat goes to someone on the waitlist, the recruiter
remembers that you were straightforward, and you keep the door open.`,
    },
    {
      id: "return-offers",
      heading: "Return offers and how conversion actually works",
      markdown: `The main product of a summer internship is not the paycheck. It is the return
offer, which removes you from the full-time recruiting market entirely — the
single most valuable thing available to a CS student.

### How the decision is typically made

Late in the internship (commonly the last two to three weeks) your manager writes
an evaluation, often against a rubric roughly resembling the entry-level
engineer performance dimensions. It is frequently reviewed by a committee or a
skip-level rather than decided solely by your manager, and it is constrained by
next year's full-time headcount — which is why conversion rates fluctuate wildly
between companies and between years for reasons that have nothing to do with you.

Common outcomes: **return offer** (full-time upon graduation), **return
internship offer** (come back next summer, typical if you have more than a year
of school left), **no offer**, and occasionally **offer contingent on a team
match**.

### What the evaluation typically weighs

| Dimension | What "strong" looks like |
| --- | --- |
| Delivery | You shipped the core project, working, merged, and used |
| Independence | You unblocked yourself; your mentor spent less time on you as weeks passed |
| Code quality | Your PRs stopped needing the same corrections twice |
| Communication | Your updates were legible; you flagged risk early instead of surprising people |
| Collaboration | People liked working with you and would take you on their team |
| Growth rate | You were visibly better in week 10 than week 2 |

**Growth rate matters more than starting level.** Interns are not expected to be
productive in week one; they are expected to be productive by week six.

### What actually moves the needle during the internship

1. **Nail the scoping conversation in week one.** Write down what "done" means and
   confirm it with your manager. Interns most often fail by building the wrong
   thing competently.
2. **Ship something by the midpoint.** A working, merged, smaller version by week
   five beats an ambitious thing that lands in week eleven. Then iterate.
3. **Ask for a midpoint review explicitly**, in those words, and ask "what would
   I need to do differently for this to be a strong performance?" Then do it.
   There is no excuse for being surprised in week eleven.
4. **Timebox being stuck.** The healthy norm is roughly: struggle 30-45 minutes,
   document what you tried, then ask. Neither the intern who asks every ten
   minutes nor the one who silently burns three days scores well.
5. **Write things down.** A doc explaining your system, a runbook, a design note.
   It's visible, it outlives you, and it's the cheapest way to be remembered as
   someone who improved the team.
6. **Meet people outside your team.** Return-offer discussions involve people you
   didn't work with directly. Being known helps.
7. **Do the demo well.** Most programs end with an intern presentation. It is
   frequently the only exposure senior people have to your work. Practice it.

### If you don't get one

It happens for reasons including headcount freezes, org changes, and your manager
leaving. Ask directly and calmly for specific feedback ("what would I need to
change to be at the bar?") and get it in writing if you can — it's the most
actionable feedback you will ever receive. Then start the next cycle early; a
completed internship, even without a return offer, moves you from the "no
experience" pile to the "has experience" pile, which is the largest single jump
in this entire process.`,
    },
    {
      id: "international-students",
      heading: "Visa and sponsorship realities",
      markdown: `If you are an international student in the US, the recruiting process has an
extra filter on it, and understanding the mechanics saves an enormous amount of
wasted effort.

### The mechanics, briefly

- **CPT (Curricular Practical Training)** is what usually authorizes an F-1
  student to do an internship. It's tied to your program and authorized by your
  school's international office — not by the employer. Requirements vary by
  school, and some require the internship to be tied to a course or to have
  completed a full academic year first.
- **OPT** is post-completion work authorization, relevant to full-time roles
  after graduation, not typically to a mid-degree summer internship.
- **H-1B** is the sponsored work visa most relevant to converting an internship
  into a long-term full-time role. It is lottery-based, which is why some
  companies decline to invest in candidates who will need it.
- Timelines and rules change. **Your school's international student office is the
  authority**, not a recruiter and not the internet. Talk to them in the summer
  before you apply, not in April when you have an offer.

### What the application forms mean

Two questions appear on nearly every US application, and they are different:

1. "Are you legally authorized to work in the US?" — for a student with valid CPT
   eligibility, this is generally yes *for the internship*.
2. "Will you now or in the future require sponsorship?" — for most international
   students this is **yes**, because the full-time role would.

Answer both accurately. Lying on these forms is grounds for rescinding an offer
at any point, including after you've started.

### The practical strategy

| Do | Don't |
| --- | --- |
| Sort listings that explicitly say "no sponsorship" out of your list early — the aggregator repos flag many of these | Waste 40 applications on defense contractors and government roles that require citizenship |
| Apply earlier than domestic peers; you need more volume | Assume every rejection was about visa status |
| Target large companies with established immigration teams — they handle CPT paperwork routinely | Hide your status until the offer stage |
| Talk to your international office *before* the cycle to learn your CPT eligibility date | Accept an offer before confirming CPT is authorizable for those dates |
| Consider companies with offices outside the US as a fallback | |
| Consider research assistantships at your own university, which sidestep much of this | |

### Companies and the sponsorship question

Big tech generally handles interns on CPT without drama; they do it hundreds of
times a year. The friction is more common at smaller companies with no
immigration counsel, at anything touching defense or ITAR, and at some financial
firms. If a startup says "we don't sponsor," they usually mean H-1B for full-time
and may still be fine with CPT for a summer — it is worth one clarifying email,
because many recruiters conflate the two.

### The honest part

International students typically need to send more applications and start
earlier for the same outcome. That is unfair and it is also the environment.
Plan for it with volume, referrals, and an earlier start rather than discovering
it in November.`,
    },
    {
      id: "fallbacks",
      heading: "If you strike out: the fallback plan",
      markdown: `Have this plan written down **by December**, not in April. A student who pivots
in December gets a good fallback; a student who pivots in April gets nothing.

An empty summer is genuinely costly, because the biggest single advantage in next
year's cycle is having done *something* real. The good news is that "something
real" has many forms and most of them are attainable.

### Ranked fallbacks

**1. Research with a professor.** The most underrated option. Many faculty have
funding (or can find some), and even unfunded lab work is real engineering
experience with a strong reference attached. It's often the best available option
for international students because it can be arranged on-campus.

How to ask: email professors whose work you find genuinely interesting, in
January or February (before their funding is committed). Reference a specific
paper of theirs, state what you can do (concrete skills), and ask for 15 minutes.
Do not mass-email a template — faculty spot it instantly.

\`\`\`text
Subject: Undergrad interested in [specific research area] — summer research

Dear Professor [Name],

I'm a [year] CS student at [School]. I read your [paper / project name] on
[specific topic] and was particularly interested in [a genuinely specific
detail — a method, a result, an open question in the discussion].

I have experience with [concrete relevant skills: e.g. "PyTorch, CUDA
profiling, and building data pipelines in Python"], most recently on
[one-line project].

I'm looking for research experience this summer and would be glad to
contribute in whatever capacity is useful — funded or for credit. Would you
have 15 minutes to talk about whether there's a fit?

Thank you for your time,
[Name] | [GitHub] | [resume attached]
\`\`\`

**2. Smaller, local, and non-tech companies.** Hospitals, universities,
insurers, manufacturers, city government, logistics firms, regional banks — all
have software teams and hire far later in the cycle with far less competition.
Search by location rather than by company name.

**3. Off-cycle and fall internships.** Fall and spring internships exist and are
much less competitive than summer. If your degree allows a co-op semester or a
lighter course load, this is a genuinely strong path, and companies often like it
because their fall intern cohorts are undersubscribed.

**4. Serious open source contribution.** Not "fixed a typo". Pick one project you
actually use, spend a month understanding it, then take real issues. Google
Summer of Code and similar programs are structured, paid, and look like an
internship on a resume — note their application windows are usually in the late
winter/early spring, so this is a plan you must make by February.

**5. Freelance and contract work.** Upwork, local small businesses, a professor's
lab needing a tool, a campus organization needing an app. Lower prestige, real
experience, and it produces something you can describe in the STAR format next
year.

**6. A serious personal project.** The weakest fallback and still much better
than nothing — but only if it's *serious*: deployed, used by people who aren't
you, with tests and a README and real engineering decisions in it. A to-do app is
not this. A thing that solves a real problem for a real group of users, running
in production for three months, absolutely is.

**7. Teaching assistantships and tutoring.** Paid, on-campus, available late,
and demonstrably good for your own fundamentals.

### The mindset piece

Striking out one cycle is extremely common, including for people who go on to
work at the companies that rejected them. The cycle is high-variance and
enormously oversubscribed at the intern level. The only genuinely losing move is
to spend the summer doing nothing and arrive at next year's cycle with the same
resume you had this year.

### Your December checklist

- [ ] Applications still going out weekly to late-cycle postings
- [ ] Three professors emailed about summer research
- [ ] Ten local/non-tech companies identified and applied to
- [ ] One open-source project picked and first PR opened
- [ ] Personal project scoped with a deployment target
- [ ] Resume rewritten with everything learned this cycle
- [ ] A written note-to-self about what failed this cycle and what to change`,
    },
  ],
  questions: [
    {
      q: "Tell me about yourself.",
      a: `Two minutes, three beats: **now → evidence → why here**.

"I'm a third-year CS student at [School], focused on backend systems. Most of
what I've built recently is a course-scheduling service for my university's
student org — it's a Go API with Postgres behind it, and the interesting problem
was handling concurrent registration without double-booking, which pushed me into
learning about transaction isolation levels for real rather than from a lecture.
Before that I did a summer at [Company/lab] working on [one line].

What I want out of this summer is to work on a team where the thing I build
actually ships to users, and [Company]'s [specific product/area] is exactly that
kind of work — which is why I applied here first."

The structure is doing the work: one sentence of identity, one *specific*
technical story with a real problem in it, one sentence of prior experience, and
a why-here that names something real about the company.`,
      weak: `A chronological life story starting with "I've loved computers since I was
eight," followed by a list of every course and language on the resume. It's long,
it's undifferentiated, and it hands the interviewer nothing to follow up on. The
other failure mode is the 20-second version — "I'm a junior CS major and I like
coding" — which wastes the one moment you fully control.`,
    },
    {
      q: "Why do you want to work at our company?",
      a: `Name something specific that could not be copy-pasted to a competitor, then
connect it to something you've actually done.

"Two reasons. The concrete one is that I've been building on your API for a side
project since last spring, and the design of [specific thing] is genuinely better
than the alternatives I tried — I want to see how a team builds something at that
level of polish. The broader one is that I'm looking for a place where interns
work on production systems rather than a walled-off side project, and everyone
I've talked to here has described shipping to real users."

If you truly have no specific hook, engineering blogs and public repos are the
fastest way to find one, and reading one blog post is 15 minutes well spent for a
company you care about.`,
      weak: `"You're a leader in the industry, you have a great culture, and I'd learn a
lot." This applies to every company that has ever existed and signals you did
zero preparation. Nearly as weak: praising a product without saying anything
about it that isn't on the homepage.`,
    },
    {
      q: "When should I start applying for a summer internship?",
      a: `For big tech, **the moment postings open in late summer of the previous year** —
which in practice means watching the aggregator repos daily from July onward and
applying within days of a posting appearing.

The reason is that review is rolling against fixed headcount. The same resume is
worth dramatically more in August than in December, because in December most of
the seats are gone and the applicant pool is 30x larger. Quant firms run earliest
of all (June-August). Startups run latest and hire just-in-time, often February
through April — which is why they are the right target for a late start and the
wrong target for an early one.`,
      weak: `"In the spring semester before the internship." This is the intuition students
import from other industries and it is the single most common reason strong
candidates end up with nothing. By spring you are applying to a leftover market.`,
    },
    {
      q: "How many applications should I send?",
      a: `Between 100 and 300 for most candidates without prior internship experience,
tiered rather than uniform: roughly 10-15% reach companies with high effort per
application (tailoring, referral attempts, researched interest), 50-60% target
companies at medium effort, and the rest at volume with a base resume and three
minutes each.

The key numbers to keep in mind: a low-single-digit response rate is normal, and
a referral or a school-restricted posting improves per-application odds far more
than any amount of resume polish. So the correct strategy is high volume in the
cheap tiers *plus* concentrated effort where you have an actual edge.`,
      weak: `Either extreme. "I only applied to twelve companies I'd actually want to work
at" ignores the arithmetic of the funnel. "I applied to 600 with Easy Apply"
ignores that untargeted applications with an untailored resume convert near zero
and consume the time that referrals would have used better.`,
    },
    {
      q: "What's the right way to ask someone for a referral?",
      a: `Short, specific, easy to say yes to, and sent *before or right after* you apply
— not weeks later once the application has already been screened out.

The message should: name the exact req, give one concrete technical thing you've
built (not "I have several projects"), give one real reason you want this
company, attach the resume in the first message, and explicitly give them an out
("completely understand if you'd rather not refer someone you haven't worked
with"). Under 150 words.

Ask, in order: people who have actually worked with you, friends and
friends-of-friends, alumni from your school, people who publicly said they're
hiring, and then cold outreach. Follow up exactly once after about a week, then
let it go. And report back the outcome either way — that's what turns a one-time
favor into a repeat referrer.`,
      weak: `A three-paragraph message about your career journey, sent to a stranger, with no
req ID, no resume, and no specific reason for that company — ending in "let me
know if you can help." It forces the reader to do work to help you, so they
don't. Also weak: asking a stranger to "hop on a quick call to learn about your
experience" when what you actually want is a referral. Just ask.`,
    },
    {
      q: "How do I prepare for an online assessment specifically, as opposed to an interview?",
      a: `Treat it as a different skill. No interviewer means no hints and no partial
credit for reasoning aloud, so the things that matter are speed, correctness on
hidden tests, and edge cases.

Concretely: practice **timed and cold** in the actual platform's editor rather
than your IDE, since you lose autocomplete and a debugger. Know your language's
input parsing boilerplate by heart. Read the constraints first — n ≤ 10⁵ tells
you the intended solution is O(n log n), n ≤ 20 tells you exponential is fine.
Write the brute force if you're stuck, because partial test cases score. Before
submitting, always run empty input, single element, all-duplicates, maximum size,
and negatives; Codility in particular grades correctness and complexity
separately, so a passing but quadratic solution loses points.

And on logistics: take it early in the window rather than on the last night, and
never paste code from anywhere — plagiarism detection across submissions is
standard and getting flagged is usually permanent.`,
    },
    {
      q: "A recruiter asks: are you interviewing anywhere else?",
      a: `Say yes, without naming companies, and use it to signal timeline rather than to
posture.

"I am — I'm at various stages with a few other companies, and I have one process
that's likely to conclude in the next couple of weeks. You're a top choice for
me, so I wanted to flag that timing in case it's useful for scheduling."

This does two things: it creates mild urgency, and it gives the recruiter a
legitimate internal reason to accelerate you. Both are good. The only rule is
that it has to be true — recruiters at competing companies do talk, and your
career center does too.`,
      weak: `"No, you're the only company I'm interviewing with." It removes all urgency and
reads as either untrue or as a signal nobody else is interested. Equally bad is
the opposite: inventing a fake competing offer with a specific company and number.
That's checkable, it occasionally gets checked, and the downside is catastrophic.`,
    },
    {
      q: "Will you now or in the future require sponsorship to work in the United States?",
      a: `Answer factually, briefly, and without apology, then move to what's actionable.

"Yes. I'm on an F-1 visa, so I'd be doing the internship on CPT, which my
university's international office authorizes — I've already confirmed I'm
eligible for the summer term. For full-time later, I'd need sponsorship."

That's the whole answer. It's accurate, it demonstrates you've done the homework
(the CPT detail signals you won't create a paperwork emergency in April), and it
doesn't editorialize.`,
      weak: `Two failure modes. Hedging or answering inaccurately to get past the filter — the
offer can be rescinded at any point, including after you start. Or over-explaining
and apologizing for three minutes, which turns a routine compliance question into
an awkward negotiation and reads as low confidence.`,
    },
    {
      q: "You have an offer with a 72-hour deadline and two loops still in flight. What do you do?",
      a: `Three actions, all within the first day.

**One:** email the offering company asking for a specific extension date, with a
real reason. "I have two processes concluding by the 14th — would it be possible
to extend the decision to the 16th?" Asking is routine; recruiters grant
extensions much more often than students expect. Ask early, not on deadline day,
and ask for a date rather than "more time."

**Two:** email both other companies the same day telling them you have an offer
with a deadline and asking whether they can accelerate. A real deadline is the
single most effective accelerant that exists in this process.

**Three:** decide what you'd do if both answers are no — and if they are, take
the offer. A real internship in hand beats a hypothetical better one, and you'll
run the next cycle from a much stronger position with experience on your resume.`,
      weak: `Letting the deadline pass while waiting to hear back, or accepting and then
reneging later. Reneging is legal in most cases and genuinely damaging — some
companies blacklist permanently and many career centers sanction it. The way to
avoid ever needing to renege is to not accept until you're ready to stop
interviewing.`,
    },
    {
      q: "Can you negotiate an internship offer?",
      a: `Some of it. The mistake is negotiating the wrong thing.

**Usually not negotiable at large companies:** the hourly or monthly base rate.
Intern pay is banded by level and location, and every intern in that office and
year gets the same number. Asking isn't offensive but expect no.

**Often negotiable:** start and end dates (the easiest and most useful ask —
exam schedules, leases, a later start), signing or relocation bonus, sometimes
housing, sometimes team or location, and very often the decision deadline.

**The one real lever is a competing written offer.** With one, a rate or bonus
adjustment becomes plausible at some employers; without one, "I'd like more" has
no basis. If you do ask, ask once, be warm and specific, and make clear you're
enthusiastic regardless of the answer. And note that startups and mid-size
companies have far more flexibility on cash than big tech does, because they
don't have a rigid band to defend.`,
    },
    {
      q: "How long should you wait before following up, and what do you say?",
      a: `Wait for whatever timeline they gave you plus a few business days; absent a
stated timeline, roughly 10 business days after an interview and about 3 weeks
after an OA. Follow up **once per stage**.

The email is under 100 words: restate who you are and the req, state the date you
interviewed and the timeline you understood, reference one specific thing from
the conversation to prove you were engaged, reaffirm interest, offer to provide
anything else, and thank them. Never imply they're late.

The exception that genuinely moves things is a competing-deadline email — "I've
received an offer with a decision deadline of [date]; [Company] is my top choice,
so I wanted to ask whether it's possible to get an update or accelerate the
remaining steps." That one works, and it must be true.

Don't follow up on the application-to-OA transition at all; that's automated and
there's nobody reading it.`,
      weak: `Emailing every four days, emailing multiple people at the company in parallel,
or a follow-up whose subtext is impatience ("I haven't heard back and it's been a
while"). The second one in particular annoys recruiters, who can see the
duplicate threads.`,
    },
    {
      q: "What are you looking for in an internship?",
      a: `Answer with something a company can actually deliver or fail to deliver, so the
answer is informative rather than flattering.

"Three things. Work that ships — I'd much rather own a small piece of a
production system than a self-contained side project nobody uses afterward. A
mentor who'll actually review my code critically, because the fastest I've ever
improved was when someone told me exactly what was wrong with my PRs. And
exposure to a codebase big enough that I have to learn to navigate code I didn't
write, which is the thing school never teaches."

Then ask them how that maps to how their intern projects are scoped. It turns the
answer into a conversation and tells you something real about the internship.`,
      weak: `"I want to learn a lot and grow as an engineer." True of everyone, tells the
interviewer nothing, and misses the chance to find out whether this internship
actually offers what you want.`,
    },
    {
      q: "Do you have any questions for us?",
      a: `Always yes, always at least three, and tuned to who's in the room. Recruiters get
process and program questions; engineers get work questions; managers get team and
expectation questions.

Strong ones: *What does an intern actually work on here — is the project scoped
before they arrive, or chosen with the team?* *What separates the interns who get
return offers from the ones who don't?* *What's the code review culture like — how
long does a PR usually sit?* *What's the most frustrating part of the codebase
right now?* That last one is disproportionately good: it's honest, engineers enjoy
answering it, and the answer tells you a lot about what the summer would actually
feel like.

Ask about the timeline and next steps too, so you know when a follow-up is
warranted.`,
      weak: `"No, I think you covered everything." It reads as disinterest and wastes free
signal. Also weak: asking things a 30-second look at the careers page answers, or
leading with compensation and vacation policy in a first-round technical
interview.`,
    },
    {
      q: "It's December and you have zero offers. What now?",
      a: `Split it into diagnosis and pivot, and do both in the same week.

**Diagnose from the tracker.** If 100+ applications produced almost no OAs, the
problem is the resume or the timing, not your coding. If OAs came but didn't
convert, it's timed execution. If you're reaching final rounds and stopping, it's
behavioral depth or the bar. These are entirely different fixes and guessing
wrong wastes January.

**Pivot the target set.** January is not "too late" — it's a different market.
Mid-size companies that under-filled, startups (which hire just-in-time from
February through April), and school-restricted postings on the university portal
all live in this window.

**Start the fallback plan in parallel, now.** Email three professors about summer
research (before their funding commits), apply to ten local or non-tech companies
with real software teams, pick one open-source project and open a first PR, and
scope a serious personal project with a deployment target. Off-cycle fall
internships are also far less competitive than summer.

The only genuinely losing outcome is arriving at next year's cycle with the same
resume, so the goal is to guarantee that something real happens this summer.`,
      weak: `"Keep applying to the same companies and hope." Or waiting until April to start
the fallback plan, by which point research funding is committed and the
late-cycle postings are gone too.`,
    },
    {
      q: "How does an intern actually earn a return offer?",
      a: `The evaluation is mostly about **delivery and growth rate**, not raw brilliance.
Nobody expects an intern to be productive in week one; they expect it by week six.

Practically: nail the scoping conversation in week one and write down what "done"
means, because the most common intern failure is building the wrong thing
competently. Ship a working, merged, smaller version by the midpoint rather than
an ambitious thing that lands in week eleven. Ask explicitly for a midpoint
review — "what would I need to do differently for this to be a strong
performance?" — so you're never surprised at the end. Timebox being stuck at
roughly 30-45 minutes before asking, with notes on what you tried. Write
documentation nobody asked for; it's visible and it outlives you. Meet people
outside your immediate team, because the decision often involves people you
didn't work with. And prepare the final demo properly, since for many senior
people it's the only exposure they have to your work.

Also worth knowing: conversion is constrained by next year's full-time headcount,
so it partly depends on things that have nothing to do with you.`,
    },
    {
      q: "What's the single biggest mistake students make in this process?",
      a: `Starting in October, because that's when their friends start talking about it.

The cycle opens in late summer and runs rolling against fixed headcount, so a
resume submitted in August competes against a fraction of the applicants for a
much larger share of the seats. Nearly every other mistake — too few
applications, no tracker, no referrals, unprepared for the OA that arrives 48
hours later — is downstream of the late start.

The second biggest is treating it as a skill problem when the top of the funnel
is a logistics problem. Grinding LeetCode for three months while applying to
twenty companies is strictly worse than adequate preparation plus two hundred
well-tiered applications sent early, because you cannot convert interviews you
never got.`,
    },
  ],
  relatedProblems: [],
};
