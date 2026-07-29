import type { HandbookChapter } from "./types";

export const chapter: HandbookChapter = {
  slug: "git-testing-devops",
  title: "Git, Testing & Shipping Code",
  track: "fundamentals",
  order: 1,
  summary:
    "The daily-engineering competence interviewers probe to find out whether you have actually worked on a team: Git beyond add/commit/push, tests that catch real bugs, and the pipeline that puts code in front of users.",
  estMinutes: 75,
  tags: [
    "git",
    "version-control",
    "testing",
    "ci-cd",
    "docker",
    "deployment",
    "monitoring",
  ],
  sections: [
    {
      id: "why-this-matters",
      heading: "Why interviewers ask about this at all",
      markdown: `Algorithm rounds tell an interviewer whether you can think. This material tells them whether you can be *left alone with the repo*.

Almost every intern who has genuinely shipped something on a team has a story about a merge conflict that ate an afternoon, a test suite that failed only in CI, or a deploy they had to roll back. Almost every intern who has only done coursework does not. That asymmetry is exactly why these questions get asked — they are cheap to ask and very hard to fake.

What is actually being scored:

- **Mental models over memorized commands.** "What does \`git rebase\` do?" is really "do you know a branch is a pointer and a commit is a snapshot?" If you have the model, you can derive the command. If you only have the command, you fall apart the moment something goes wrong.
- **Judgment.** Not "can you write a test" but "do you know which tests are worth writing." Not "do you know Docker" but "do you know why we containerize at all."
- **Recovery instincts.** Everyone breaks things. Interviewers care much more about "I checked \`git reflog\`" than about you never having needed it.

A concrete tell: candidates who have worked on a team say "we" and describe a workflow ("we squash-merged into main, CI ran on the PR, and a green build auto-deployed to staging"). Candidates who have not say "you would probably use Git for that." Do not be the second candidate.`,
    },
    {
      id: "git-mental-model",
      heading: "The Git mental model, and the commands that follow from it",
      markdown: `Nearly all Git confusion comes from having the wrong model. Fix the model and the commands stop being magic.

## Snapshots, pointers, and HEAD

### A commit is a full snapshot, not a diff

Git stores, for each commit: a tree (the complete state of every tracked file), a pointer to its parent commit(s), author, timestamp, and message. All of that is hashed into a SHA-1/SHA-256 id. Diffs are *computed* on demand by comparing two snapshots — they are not what is stored.

Consequence: because the id hashes the parent, changing any commit changes the id of every commit after it. That single fact explains why rebase "rewrites history," why force-push exists, and why rewriting shared branches hurts other people.

### A branch is a 41-byte file containing a commit id

\`main\` is not a container of commits. It is a movable label. Look at it directly:

\`\`\`bash
cat .git/refs/heads/main       # 9c1f0a3e... a single commit id
\`\`\`

Committing on a branch does two things: it writes a new commit whose parent is the current one, and it moves the label forward. That is the entire operation. Creating a branch is writing a new 41-byte file — which is why branching in Git is instant and why long-lived branches are a social problem, not a technical one.

### HEAD is a pointer to *what you have checked out*

Normally \`HEAD\` points at a branch name, which points at a commit:

\`\`\`text
HEAD -> refs/heads/feature -> 4a9f2c1 -> 8d3e0b7 -> ...
\`\`\`

"Detached HEAD" means \`HEAD\` points straight at a commit with no branch in between. Commits you make there are real, but nothing references them, so they are garbage-collected eventually. That is the whole mystery.

### The three areas

\`\`\`text
working tree  --git add-->  index (staging area)  --git commit-->  repository
\`\`\`

Almost every "how do I undo this" question is answered by asking *which of the three areas do I want to change*:

| Goal | Command |
| --- | --- |
| Unstage a file, keep edits | \`git restore --staged file.py\` |
| Throw away uncommitted edits to a file | \`git restore file.py\` |
| Undo last commit, keep changes staged | \`git reset --soft HEAD~1\` |
| Undo last commit, keep changes unstaged | \`git reset HEAD~1\` (mixed, the default) |
| Undo last commit, destroy the changes | \`git reset --hard HEAD~1\` |
| Undo a commit that is already pushed | \`git revert <sha>\` |

The last row is the important one. \`reset\` rewrites history and is fine on your own unpushed work. \`revert\` creates a *new* commit that undoes an old one, leaving history intact — that is what you use on a shared branch.

## The commands you must know cold

You should be able to type these without thinking. An interviewer will not ask you to recite them, but they will notice when you fumble a live exercise.

### Daily loop

\`\`\`bash
git status                        # read this constantly; it tells you the answer
git switch -c feat/rate-limiter   # create + check out a branch (modern; not checkout -b)
git add -p                        # stage hunk by hunk — forces you to review your own diff
git commit -m "Add token bucket rate limiter to the API gateway"
git push -u origin feat/rate-limiter
\`\`\`

\`git add -p\` is a small habit with an outsized effect: you read every line you are about to commit, so debug prints and commented-out code stop leaking into PRs.

### Inspecting

\`\`\`bash
git log --oneline --graph --decorate --all   # the only log invocation worth memorizing
git log -p src/auth.py                       # history of one file, with diffs
git log -S "TokenBucket"                     # commits that added/removed that string ("pickaxe")
git diff                                     # working tree vs index
git diff --staged                            # index vs last commit (what you're about to commit)
git diff main...feature                      # what the feature branch adds since it diverged
git blame -L 40,60 src/auth.py               # who last touched these lines, and in which commit
git show 4a9f2c1                             # full commit: message + diff
\`\`\`

Note the three dots in \`git diff main...feature\`. Two dots compares the two tips; three dots compares \`feature\` against the *merge base*, which is what a PR shows you. Getting this wrong makes a diff look full of unrelated changes just because \`main\` moved.

### Syncing

\`\`\`bash
git fetch origin                  # download refs; changes nothing in your working tree
git pull --rebase origin main     # fetch + replay your local commits on top of origin/main
\`\`\`

\`fetch\` is always safe. \`pull\` is \`fetch\` plus a merge (or, with \`--rebase\`, a rebase). Defaulting to \`--rebase\` keeps a linear history and avoids the "Merge branch 'main' into main" noise commits that make a log unreadable. Set it once:

\`\`\`bash
git config --global pull.rebase true
\`\`\`

### Parking work

\`\`\`bash
git stash push -m "half-done pagination"
git stash list
git stash pop                     # apply and drop
git stash apply stash@{1}         # apply and keep
\`\`\`

Stash is for interruptions ("prod is down, I need to be on main in 10 seconds"). It is not a place to store work for days — stashes are invisible, unpushed, and easy to lose. Commit to a scratch branch instead.`,
    },
    {
      id: "merge-vs-rebase",
      heading: "Merge vs rebase, and when each is right",
      markdown: `This is the single most common Git interview question. A strong answer covers what each does to the commit graph, then gives a rule for choosing.

### Merge

\`\`\`bash
git switch main
git merge feature
\`\`\`

Creates a new commit with **two parents** — one from \`main\`, one from \`feature\`. Nothing is rewritten; every original commit id survives.

\`\`\`text
      A---B---C  feature
     /         \\
D---E---F---G---M  main      (M is the merge commit)
\`\`\`

Pros: non-destructive, safe on shared branches, preserves the true story of when work happened. Cons: on a busy repo the graph turns into a braid and \`git log\` becomes hard to read; bisecting through merge commits is more awkward.

### Rebase

\`\`\`bash
git switch feature
git rebase main
\`\`\`

Replays each of your commits, one at a time, on top of the new base. Because each replayed commit has a **new parent**, each gets a **new SHA**. The old commits are orphaned.

\`\`\`text
D---E---F---G  main
               \\
                A'---B'---C'  feature   (new ids)
\`\`\`

Pros: linear history, clean \`git log\`, every commit's diff is genuinely "what this change adds relative to current main." Cons: rewrites history, so it is dangerous on branches other people have pulled; and if there are conflicts you may resolve the *same* conflict once per replayed commit.

### The rule

> **Rebase your own unpushed/unshared work. Merge (or squash-merge) into shared branches. Never rebase a branch someone else has based work on.**

This is often called the golden rule of rebasing. The reason is concrete: rebasing creates new commits, so a collaborator who already has the old ones ends up with both copies and a mess of duplicate-looking history.

In practice, most teams land on:

1. Work on a feature branch.
2. \`git pull --rebase origin main\` regularly, so your branch stays close to main and conflicts stay small.
3. Open a PR. CI runs.
4. **Squash-merge** the PR into main, so main gets one clean, revertable commit per change.

Squash-merge is a good default for intern-sized changes because it makes \`main\` readable and makes \`git revert\` a one-liner. It loses granular history inside the branch, which matters more for large, long-lived work — that is when a plain merge commit earns its keep.

### The \`--force-with-lease\` detail

After rebasing a branch you have already pushed, the remote will reject a normal push. Do not use \`--force\`:

\`\`\`bash
git push --force-with-lease
\`\`\`

\`--force-with-lease\` refuses to push if the remote has commits you have not seen — so if a teammate pushed to your branch in the meantime, you get an error instead of silently destroying their work. Mentioning this flag by name is a strong signal in an interview.`,
    },
    {
      id: "conflicts",
      heading: "Resolving conflicts without panicking",
      markdown: `A conflict means two branches changed overlapping lines and Git will not guess. It is not an error state; it is Git asking a question.

\`\`\`text
<<<<<<< HEAD
TIMEOUT_MS = 5000
=======
TIMEOUT_MS = 30000
>>>>>>> feature/slow-uploads
\`\`\`

During a **merge**, \`HEAD\` is the branch you are on (the target, e.g. \`main\`) and the bottom is the branch being merged in. During a **rebase**, this flips — \`HEAD\` is the upstream you are replaying onto, and the bottom chunk is *your* commit. This reversal trips up nearly everyone; when in doubt run \`git status\`, which spells out which operation is in progress.

### The procedure

\`\`\`bash
git status                       # lists "both modified" files — this is your worklist
# open each file, resolve, delete all conflict markers
git add src/config.py            # staging a conflicted file marks it resolved
git status                       # confirm nothing is left unmerged
git merge --continue             # or: git rebase --continue
\`\`\`

Bail out at any time:

\`\`\`bash
git merge --abort
git rebase --abort
\`\`\`

Both restore the pre-operation state exactly. Knowing you can always abort is what removes the panic.

### Things that make conflicts easier

- **Resolve by intent, not by picking a side.** The right answer is often neither version — both changes need to coexist. Read both, understand what each was trying to do, write the code that does both.
- **Run the tests after resolving.** A resolution that compiles is not a resolution that is correct. This is where real bugs get introduced.
- \`git checkout --ours file\` / \`--theirs file\` takes one side wholesale. Useful for generated files (lockfiles, snapshots) that you should regenerate anyway, and almost never right for hand-written code.
- \`git rerere\` ("reuse recorded resolution") remembers how you resolved a conflict and replays it automatically next time. On a long rebase where the same conflict recurs per commit, this saves real time: \`git config --global rerere.enabled true\`.
- **Prevention beats cure.** Small PRs, merged quickly, rebased often. A branch that lives for three weeks will conflict; a branch that lives two days usually will not.`,
    },
    {
      id: "history-surgery",
      heading: "Interactive rebase, cherry-pick, and cleaning up before review",
      markdown: `Your local commit history is a draft. The history you ask someone to review should be edited. Interactive rebase is the editor.

\`\`\`bash
git rebase -i HEAD~4
\`\`\`

Opens the last four commits, oldest first:

\`\`\`text
pick 3f1a2b7 Add rate limiter skeleton
pick 8c4d0e2 wip
pick 1b9f3a4 fix typo
pick 5e2c8d1 Add tests for rate limiter
\`\`\`

Change the verbs:

| Verb | Effect |
| --- | --- |
| \`pick\` | keep as-is |
| \`reword\` | keep the change, edit the message |
| \`squash\` | fold into the previous commit, combine messages |
| \`fixup\` | fold into the previous commit, discard this message |
| \`edit\` | stop here so you can amend the content |
| \`drop\` | delete the commit entirely |

Reordering the lines reorders the commits. Deleting a line drops the commit.

The cleanup above becomes:

\`\`\`text
pick   3f1a2b7 Add rate limiter skeleton
fixup  8c4d0e2 wip
fixup  1b9f3a4 fix typo
pick   5e2c8d1 Add tests for rate limiter
\`\`\`

Four messy commits become two meaningful ones: the implementation and the tests.

### Amending the most recent commit

\`\`\`bash
git commit --amend                 # edit message and/or add staged changes
git commit --amend --no-edit       # "I forgot a file" — add it, keep the message
\`\`\`

Amend rewrites the commit, so the same force-push rule applies if it was already pushed.

### The autosquash workflow

While iterating on review feedback:

\`\`\`bash
git commit --fixup 3f1a2b7         # creates a commit titled "fixup! Add rate limiter skeleton"
# ... more review rounds ...
git rebase -i --autosquash HEAD~6  # fixups are auto-placed next to their targets
\`\`\`

This is how experienced engineers keep a branch reviewable across many review rounds without hand-editing rebase todo lists.

### Cherry-pick

Copies a single commit's *change* onto your current branch as a new commit with a new id.

\`\`\`bash
git switch release/1.4
git cherry-pick 9a3f1c2            # backport one bugfix without merging all of main
git cherry-pick 9a3f1c2^..4d8e0a1  # a range
git cherry-pick -x 9a3f1c2         # records "(cherry picked from commit ...)" in the message
\`\`\`

The legitimate use is backporting a fix to a release branch. Use \`-x\` so anyone reading the release branch can trace the commit back to its origin.

Cherry-pick as a routine substitute for merging is a smell — you end up with the same change duplicated under two ids, which makes future merges conflict for no good reason.`,
    },
    {
      id: "git-recovery",
      heading: "Reflog, and getting out of trouble",
      markdown: `Interviewers love recovery questions because they separate people who have actually broken something from people who have not.

### Reflog is the undo button

Every time \`HEAD\` moves — commit, checkout, reset, rebase, merge — Git appends a line to the reflog. That is a local log of where you *were*, even if no branch points there anymore.

\`\`\`bash
git reflog
\`\`\`

\`\`\`text
4d8e0a1 HEAD@{0}: reset: moving to HEAD~3
9a3f1c2 HEAD@{1}: commit: Add retry with exponential backoff
3f1a2b7 HEAD@{2}: commit: Add rate limiter skeleton
\`\`\`

You did a \`--hard\` reset and destroyed three commits. They are still there:

\`\`\`bash
git reset --hard HEAD@{1}          # back to exactly where you were
# or, non-destructively:
git switch -c rescue 9a3f1c2
\`\`\`

**Nothing that was ever committed is truly lost for ~90 days** (the default \`gc.reflogExpire\`). Uncommitted work is a different story — that is the real argument for committing early and often, even garbage commits you will squash later.

### Scenario: I committed to \`main\` instead of my feature branch

Nothing pushed yet. Move the commits, then rewind main.

\`\`\`bash
git switch -c feat/rate-limiter    # branch here — it points at your commits
git switch main
git reset --hard origin/main       # rewind main to match the remote
git switch feat/rate-limiter       # your work is safe on the new branch
\`\`\`

If you already pushed to \`main\` and it is protected/shared, do **not** reset and force-push. Revert instead:

\`\`\`bash
git revert <sha>                   # or: git revert <oldest>^..<newest> for a range
git push
\`\`\`

Then re-apply the work properly on a branch. The principle: *rewriting history is for private branches; forward-fixing is for shared ones.*

### Scenario: I pushed a secret

Say the honest sequence, in order:

1. **Rotate the credential immediately.** It is public the moment it hits the remote — assume it is scraped. Revoking the key is the fix; scrubbing Git is cleanup.
2. **Then** purge it from history, because rewriting alone does not un-leak it. Use \`git filter-repo\` (or the BFG); \`filter-branch\` is deprecated and slow.

\`\`\`bash
git filter-repo --replace-text secrets.txt      # patterns to redact across all history
git push --force --all
git push --force --tags
\`\`\`

3. Tell everyone to re-clone. Rewritten history plus stale local clones re-introduces the old objects.
4. On GitHub, note that forks and cached PR views can retain the blob — open a support request if it was a serious credential.
5. **Prevent the recurrence:** \`.gitignore\` for \`.env\`, a pre-commit secret scanner (gitleaks, trufflehog), and push protection enabled on the repo.

A candidate who leads with "rotate the key first" has clearly lived through it. A candidate who leads with \`filter-branch\` has read about it.

### Scenario: I need to find which commit broke it

\`\`\`bash
git bisect start
git bisect bad                     # current commit is broken
git bisect good v1.3.0             # this tag was fine
# Git checks out a midpoint; test it, then say:
git bisect good     # or: git bisect bad
# ... repeat, ~log2(n) steps ...
git bisect reset
\`\`\`

With a scriptable test you can automate the whole thing: \`git bisect run pytest -q\`. Binary search over 1,000 commits is ten steps.`,
    },
    {
      id: "pr-workflow",
      heading: "A sane PR workflow: commits, messages, reviewable diffs",
      markdown: `Being good at code review — on both sides — is one of the fastest ways for an intern to look senior.

### Commit messages

The widely used convention:

\`\`\`text
<type>(<scope>): <imperative summary, <=72 chars, no trailing period>

Why this change exists. What problem it solves. What you considered and
rejected. Wrap at 72 columns.

Fixes #482
\`\`\`

Real example:

\`\`\`text
fix(auth): refresh tokens before expiry instead of on 401

We were only refreshing after a request failed with 401, which meant every
session hit one guaranteed failure per hour and users saw a flash of the
login screen. Now we refresh when the token is within 60s of expiring.

Considered a background timer but it doesn't survive tab suspension, so
the check happens on the request path instead.

Fixes #482
\`\`\`

Rules that actually matter:

- **Imperative mood**: "add", "fix", "remove" — not "added" or "adds". The convention is that the message completes the sentence "If applied, this commit will \\_\\_\\_".
- **The subject says what; the body says why.** The diff already tells a reader what changed. It can never tell them why. Six months later, "why" is the only thing anyone needs.
- **One logical change per commit.** A commit that both renames a module and changes its behavior cannot be reviewed or reverted cleanly.

### Making a diff reviewable

- **Keep PRs small.** Review quality falls off a cliff past a few hundred lines — past that, reviewers start rubber-stamping. Two 200-line PRs get better review than one 400-line PR.
- **Separate refactors from behavior changes.** "Pure move, no behavior change" in one PR, the actual change in the next. Mixing them hides a real change inside 800 lines of noise.
- **Write a real PR description**: what, why, how you tested it, screenshots for UI, and anything you want the reviewer to look at hardest.
- **Review your own diff first**, on the PR page. You will catch the stray \`print()\` and the debug branch you left in. It takes two minutes and saves a review round trip.

### Receiving review

- Assume good intent; comments are about the code. Disagreement is fine — reply with reasoning, do not just re-push.
- Push fixups rather than force-pushing over the branch mid-review, so reviewers can see incremental changes. Squash at merge time.
- Resolve threads only after actually addressing them.

### Giving review

- Distinguish blocking from non-blocking. Prefix optional comments with \`nit:\` and mean it.
- Ask questions instead of issuing verdicts: "what happens if \`items\` is empty here?" beats "this is broken."
- Praise good things out loud. It costs nothing and makes review feel collaborative rather than adversarial.`,
    },
    {
      id: "testing-pyramid",
      heading: "The testing pyramid: unit, integration, end-to-end",
      markdown: `Tests differ along two axes that trade off against each other: **confidence** (how much of the real system did this exercise?) and **cost** (how slow, flaky, and hard to debug is it?).

\`\`\`text
        /\\        e2e  — few, slow, high confidence, flakiest
       /  \\             (real browser, real API, real DB)
      /----\\     integration — some; several units + a real dependency
     /      \\           (route handler + real Postgres in a container)
    /--------\\   unit — many, milliseconds, one function/class in isolation
\`\`\`

| | Unit | Integration | E2E |
| --- | --- | --- | --- |
| Scope | one function/class | a few modules + a real dependency | the whole system |
| Runtime | <10ms | 10ms–1s | seconds to minutes |
| Failure tells you | exactly which line | roughly which seam | "checkout is broken" |
| Flakiness | ~none | low | the main source |
| Count | hundreds/thousands | dozens | a handful |

### What actually goes where

- **Unit**: business logic, pure computation, edge cases, error branches. Pricing rules, date math, parsing, state machines. This is where you get exhaustive coverage cheaply.
- **Integration**: the seams. Does the ORM query actually return what the code expects? Does the migration apply? Does the route return 400 on bad input? Real Postgres in Docker, not a mock — mocking a database mostly tests your mock.
- **E2E**: a few critical user journeys only. Sign up, log in, buy the thing. If E2E breaks and you cannot tell which layer failed, that is expected — that is what the lower layers are for.

### The inversions to name

- **Ice cream cone**: mostly E2E, few unit tests. Symptoms: a 40-minute suite, constant reruns for flakes, engineers who stop trusting red builds. That last one is the real damage — a suite you do not trust is worse than no suite, because it burns time without providing signal.
- **Hourglass**: lots of unit and E2E, nothing in between. The integration seams — serialization, DB queries, HTTP contracts — are exactly where bugs live, and nothing covers them.

The pyramid is a heuristic, not a law. For a thin CRUD service that is mostly glue, integration tests carry most of the value and a strict pyramid would leave you testing framework code.`,
    },
    {
      id: "good-tests",
      heading: "What makes a good test",
      markdown: `A test's job is to fail — loudly, specifically, and only when something is actually wrong.

### Arrange / Act / Assert

\`\`\`python
def test_applies_the_bulk_discount_at_exactly_10_items() -> None:
    # Arrange — set up the world
    cart = Cart()
    cart.add(sku="WIDGET", unit_price_cents=1000, quantity=10)

    # Act — exactly one call, the thing under test
    total = cart.total_cents()

    # Assert — one behavior
    assert total == 9000  # 10% off at the 10-item threshold
\`\`\`

Three blocks, in that order, visually separated. If Act is more than one line, you are probably testing two things. Note that pytest needs nothing but a bare \`assert\` — it rewrites the expression so a failure prints both sides, which is why a custom \`assertEqual\`-style API is unnecessary.

### Test behavior, not implementation

\`\`\`python
# Bad: couples the test to how the code works internally.
# Refactoring the cache breaks the test even though behavior is identical.
def test_caches_the_user(service: UserService) -> None:
    service.get_user("u1")
    assert "u1" in service._cache


# Good: asserts the observable contract.
def test_fetches_a_given_user_only_once(mocker, service: UserService) -> None:
    fetch_spy = mocker.spy(service.repo, "find_by_id")

    service.get_user("u1")
    service.get_user("u1")

    assert fetch_spy.call_count == 1
\`\`\`

The rule of thumb: **a pure refactor should not break a single test.** If refactoring breaks tests, the tests were describing implementation, and they will fight every future change instead of protecting it.

### Names that read as specifications

\`\`\`python
def test_1(): ...                                                   # useless
def test_cart(): ...                                                # useless
def test_returns_0_for_an_empty_cart(): ...                         # good
def test_raises_insufficient_stock_when_quantity_exceeds_inventory(): ...  # good
\`\`\`

Long snake_case names look odd at first and are exactly right here — pytest prints the function name on failure, so the name is the report.

When CI fails at 2am, the test name is the entire bug report you get. Write it for that moment.

### The other properties

- **Deterministic.** No real clocks, no real randomness, no network, no reliance on test execution order. Inject a clock; seed the RNG.
- **Isolated.** Each test creates its own data and cleans up. Tests that pass alone and fail in a suite are a shared-state bug.
- **Fast.** Slow unit tests do not get run locally, and tests you do not run do not protect you.
- **One reason to fail.** Ten assertions in one test means the first failure hides the other nine.
- **Test the boundaries.** Empty, one, many, exactly-at-limit, one-over-limit, \`None\`, negative, duplicate, unicode. Off-by-one bugs live at exactly the boundary — assert at 9, 10, and 11, not just at 5.

### Table-driven tests for boundaries

\`\`\`python
import pytest


@pytest.mark.parametrize(
    ("quantity", "expected_cents"),
    [
        pytest.param(9, 9000, id="below-threshold-no-discount"),
        pytest.param(10, 9000, id="at-threshold-10-percent-off"),
        pytest.param(11, 9900, id="above-threshold"),
    ],
)
def test_bulk_discount_thresholds(quantity: int, expected_cents: int) -> None:
    cart = Cart()
    cart.add(sku="WIDGET", unit_price_cents=1000, quantity=quantity)

    assert cart.total_cents() == expected_cents
\`\`\`

\`parametrize\` generates one independent test per row, so a failure at quantity 11 does not hide the result at 9 and 10 — which is the whole point of asserting at the boundary. Give each row an \`id\`; it becomes the name in the failure output.

### Fixtures instead of setup methods

\`\`\`python
import pytest


@pytest.fixture
def cart() -> Cart:
    """A fresh cart per test — pytest re-runs this for every test that asks for it."""
    return Cart()


@pytest.fixture
def stocked_cart(cart: Cart) -> Cart:
    """Fixtures compose: this one requests the previous one by name."""
    cart.add(sku="WIDGET", unit_price_cents=1000, quantity=1)
    return cart


def test_empty_cart_costs_nothing(cart: Cart) -> None:
    assert cart.total_cents() == 0


def test_single_item_is_charged_at_full_price(stocked_cart: Cart) -> None:
    assert stocked_cart.total_cents() == 1000
\`\`\`

A fixture is requested by naming it as a parameter, which makes each test's dependencies explicit in its signature rather than hidden in a base class. Use \`yield\` instead of \`return\` when you need teardown, and keep the default function scope unless a resource is genuinely expensive — a \`scope="session"\` fixture is shared mutable state and the classic source of order-dependent tests.

### Asserting on failure

\`\`\`python
def test_raises_insufficient_stock_when_quantity_exceeds_inventory(cart: Cart) -> None:
    with pytest.raises(InsufficientStock, match="only 3 left"):
        cart.add(sku="WIDGET", unit_price_cents=1000, quantity=4)
\`\`\`

\`pytest.raises\` asserts both that the block raised and that it raised the right type; \`match\` is a regex against the message, which stops the test from passing on a *different* \`InsufficientStock\`. A bare \`try\`/\`except\` that swallows the exception passes even when nothing is raised.`,
    },
    {
      id: "mocks-and-doubles",
      heading: "Test doubles, mocking, and when it becomes a trap",
      markdown: `"Mock" gets used for all of these. Knowing the distinctions is a genuine signal.

| Double | What it is | Use when |
| --- | --- | --- |
| **Dummy** | Filler passed to satisfy a signature, never used | You need an argument you do not care about |
| **Stub** | Returns canned answers, no assertions | You need the dependency to return something |
| **Spy** | A real (or stub) object that records calls | You want to assert an interaction happened |
| **Mock** | Pre-programmed with expectations; fails if not met | The interaction *is* the behavior under test |
| **Fake** | A working lightweight implementation | In-memory repository, SQLite for Postgres |

\`\`\`python
from unittest.mock import Mock


# Stub: the payment gateway always approves. We are testing order logic, not Stripe.
class ApprovingGateway:
    def charge(self, amount_cents: int) -> Charge:
        return Charge(ok=True, id="ch_123")


# Spy: assert we actually notified the user.
def test_places_an_order_and_notifies_the_customer() -> None:
    notifier = Mock(spec=Notifier)  # spec= makes a typo'd method name fail loudly

    place_order(ApprovingGateway(), notifier, order)

    notifier.send.assert_called_once_with("u1", "order_confirmed")


# Fake: a real, working, in-memory implementation of the repository protocol.
class InMemoryOrderRepo:
    def __init__(self) -> None:
        self._rows: dict[str, Order] = {}

    def save(self, order: Order) -> None:
        self._rows[order.id] = order

    def find_by_id(self, order_id: str) -> Order | None:
        return self._rows.get(order_id)
\`\`\`

Two Python-specific notes worth saying in an interview. \`Mock(spec=Notifier)\` (or \`autospec=True\` with \`patch\`) is the difference between a double that catches a renamed method and one that cheerfully accepts \`notifier.snd(...)\` and returns another \`Mock\` — a plain \`Mock\` asserts nothing about the interface it is standing in for. And **patch where the name is looked up, not where it is defined**: if \`orders.py\` does \`from billing import charge\`, you patch \`orders.charge\`, not \`billing.charge\`. That single rule accounts for most "my patch did nothing" bugs.

\`\`\`python
def test_charges_the_card(monkeypatch: pytest.MonkeyPatch) -> None:
    # monkeypatch is pytest's built-in patcher; it undoes itself at teardown.
    monkeypatch.setattr("orders.charge", lambda cents: Charge(ok=True, id="ch_1"))

    assert place_order(order).status == "paid"
\`\`\`

### When mocking is a trap

**1. Mocking what you do not own.** If you mock Stripe's SDK based on your belief about its response shape, your test passes forever — including when Stripe changes the shape and production breaks. Wrap third-party APIs in your own thin interface, mock *that*, and cover the real integration with a small number of contract tests against a sandbox.

**2. Over-mocking until you test the mocks.** A test where every collaborator is mocked asserts only that the code calls the functions you told it to call, in the order you expected. It cannot catch a wrong result. If setup is 30 lines of mocks for 3 lines of assertion, the design is telling you the unit has too many dependencies.

**3. Mocking the database.** A mocked query returns whatever you decided it returns, so it validates nothing about your SQL, your schema, or your migrations. Use a real Postgres in a container (Testcontainers, or a compose service in CI). It is fast enough and it actually finds bugs.

**4. Brittle strict mocks.** Asserting the exact sequence of six internal calls means every refactor is a test rewrite. Assert on outcomes; assert on interactions only when the interaction is the point (an email *was* sent, a payment was *not* double-charged).

The heuristic: **mock at the process boundary — network, clock, filesystem, randomness — and use real objects inside it.**`,
    },
    {
      id: "coverage-tdd-flakes",
      heading: "Coverage, TDD, async tests, and flakiness",
      markdown: `### Coverage: a useful floor, a terrible target

Coverage measures which lines *executed* during the suite. It says nothing about whether you asserted anything meaningful:

\`\`\`python
# 100% line coverage of apply_discount. Zero value.
def test_does_not_crash(cart: Cart) -> None:
    apply_discount(cart)  # no assertion; any return value passes
\`\`\`

Run it with \`pytest --cov=shop --cov-branch --cov-report=term-missing\` (that is \`pytest-cov\` wrapping \`coverage.py\`). \`--cov-branch\` is the flag that matters: without it, an \`if\` whose body always runs counts as covered even though the false branch was never taken, and \`term-missing\` prints the specific uncovered line numbers rather than a percentage you cannot act on.

Why 100% is a bad goal:

- It rewards writing tests for trivial code (properties, dataclasses, generated protobuf stubs) because that is the cheapest way to move the number.
- The last 10% is usually defensive branches that are hard to trigger and low-risk, so you spend disproportionate effort for near-zero payoff.
- Once it becomes a gate, people write assertion-free tests to pass it. You now have a worse suite *and* a green metric.

Better practice: use coverage as a **diff-level flag** ("this PR added 200 lines with no tests — is that deliberate?") rather than a global target. Branch coverage (\`--cov-branch\`) is more informative than line coverage, and mutation testing (\`mutmut\`, \`cosmic-ray\`) measures what you actually want: it changes your code and checks whether a test notices.

### TDD, honestly

Red → green → refactor: write a failing test, write the least code to pass, then clean up.

Where it genuinely pays:
- Pure logic with a clear contract — parsers, pricing, validation, algorithms.
- Bug fixes. Reproduce the bug as a failing test *first*; that is the only way to know your fix works and that the bug stays fixed. This one is close to non-negotiable.
- When you are unsure of the API you want. Writing the test first is designing the call site from the caller's perspective.

Where it gets in the way:
- Exploratory work where you do not yet know the design. Ten tests written against an API you are about to throw away is ten tests you throw away.
- UI layout, integrations with unfamiliar third-party APIs, anything where the spec is "I'll know it when I see it."

The honest interview answer: "I don't do strict TDD for everything, but I always write a failing test first for a bug fix, and I use it for anything with tricky logic. What I actually insist on is that the test exists before the PR merges." That is far stronger than either "TDD always" (dogma) or "I write tests after" (no rigor).

### Testing async code

\`pytest\` cannot await a coroutine on its own — an \`async def\` test without a plugin is collected, never awaited, and reported as passing. Install \`pytest-asyncio\` and set \`asyncio_mode = "auto"\` in \`pyproject.toml\`, or mark each test explicitly.

\`\`\`python
import asyncio

import pytest


# A forgotten await is the classic false pass: verify(...) returns a coroutine,
# which is truthy, so an assertion on it succeeds without running anything.
@pytest.mark.asyncio
async def test_rejects_an_expired_token() -> None:
    with pytest.raises(TokenExpiredError):
        await verify(expired_token)


# Control time instead of sleeping: patch the thing that sleeps.
@pytest.mark.asyncio
async def test_retries_after_backoff(monkeypatch: pytest.MonkeyPatch) -> None:
    slept: list[float] = []

    async def fake_sleep(seconds: float) -> None:
        slept.append(seconds)

    monkeypatch.setattr(asyncio, "sleep", fake_sleep)

    result = await fetch_with_retry(url)

    assert result == {"ok": True}
    assert slept == [1.0, 2.0]  # the backoff schedule is part of the contract


# Wait for the condition, with a timeout, rather than for a fixed duration.
@pytest.mark.asyncio
async def test_worker_drains_the_queue() -> None:
    worker = Worker(queue)
    task = asyncio.create_task(worker.run())

    await asyncio.wait_for(worker.idle.wait(), timeout=5)

    task.cancel()
    assert queue.empty()
\`\`\`

Never \`time.sleep(0.5)\` and hope. That is simultaneously slow (it always waits) and flaky (sometimes 500ms is not enough on a loaded CI box). Wait for the *condition* with a generous timeout, not for the clock. The same rule applies to synchronous code: freeze the clock with \`freezegun\` or inject a \`now()\` callable rather than asserting against \`datetime.now()\`.

### Flaky tests

A flaky test passes and fails on identical code. The usual causes:

- **Time**: real clocks, timezone assumptions, tests that break at midnight or in February.
- **Order dependence**: shared mutable state between tests — a module-level global, a \`scope="session"\` fixture, a mutable default argument. Detect it with \`pytest-randomly\`, which shuffles order and reseeds the RNG every run.
- **Concurrency**: races between async operations with no synchronization point.
- **Environment**: unseeded randomness, port collisions, leftover DB rows, network calls.
- **Waiting on the clock instead of the condition**, per above.

The organizational point matters as much as the technical one: **a flaky test is a broken test.** Quarantine it out of the required build immediately — a \`@pytest.mark.quarantine\` marker plus \`pytest -m "not quarantine"\` in CI does it — so it stops training the team to ignore red, file a ticket, and fix or delete it. Note that \`pytest-rerunfailures\` hides flakes rather than fixing them; retrying is a stopgap, not a resolution. Teams that let flakes accumulate stop believing CI, and then CI stops working — not technically, socially.`,
    },
    {
      id: "ci-cd",
      heading: "CI/CD: what the pipeline actually does",
      markdown: `**Continuous Integration**: everyone merges to a shared main frequently, and every push is automatically built and tested. The point is to catch integration problems in hours rather than at the end of a three-week branch.

**Continuous Delivery**: every green build produces an artifact that is *deployable*; a human clicks deploy.
**Continuous Deployment**: every green build deploys itself, no human in the loop.

Know the difference — it is a common quick question.

### A real pipeline

\`\`\`yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready --health-interval 10s --health-retries 5
        ports: ["5432:5432"]
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v5
        with:
          enable-cache: true        # caches the resolved dependency set
      - run: uv sync --frozen       # not "uv sync" alone — see below
      - run: uv run ruff check .    # lint
      - run: uv run ruff format --check .
      - run: uv run mypy src        # static type check
      - run: uv run pytest --cov=src --cov-branch --cov-report=xml
      - run: uv build               # produce the wheel that gets deployed
\`\`\`

Details worth knowing:

- \`uv sync --frozen\` installs exactly what \`uv.lock\` says and fails if the lockfile is out of date with respect to \`pyproject.toml\`. Without \`--frozen\`, the resolver may pick up newer versions, which means CI is not testing what you tested. The \`pip\` equivalent is \`pip install --require-hashes -r requirements.lock\`, generated by \`pip-compile\` or \`uv pip compile\`. **The lockfile is the contract; installing anything else makes the build non-reproducible.**
- Ordering is cheapest-first: \`ruff\` finishes in well under a second and \`mypy\` in a few, so do not make people wait five minutes for a test run to discover an unused import.
- A real Postgres service container, not a mock.
- Caching dependencies is usually the single biggest pipeline speedup.

### What "the build" actually does

For a compiled language: resolve dependencies → compile to object code → link → produce a binary/JAR. For Python there is no compile step to speak of, which changes what "build" means rather than removing it: resolve and lock dependencies → run the type checker (the closest thing Python has to a compiler telling you no) → package the source into a wheel with \`uv build\` or \`python -m build\` → and, in practice, bake that wheel plus a pinned interpreter into a container image, because the image is the only artifact that pins the interpreter and the C libraries your wheels link against.

The output of the build is an **artifact**: an immutable, versioned thing (a JAR, a binary, a Docker image, a folder of static files). The one rule everything else depends on: **build once, deploy that same artifact to every environment.** If you rebuild per environment you can no longer claim that what you tested in staging is what runs in prod.

### The other jobs a mature pipeline runs

- Dependency vulnerability scan (\`pip-audit\`, Dependabot, Snyk).
- Secret scanning on the diff.
- Build the Docker image and push it to a registry, tagged with the commit SHA.
- Deploy to staging automatically; production on approval or on a tag.
- Run DB migrations as an explicit, separately-observable step — never as a silent side effect of app startup.`,
    },
    {
      id: "docker",
      heading: "Docker: images, containers, layers, and a real Dockerfile",
      markdown: `### The problem it solves

"Works on my machine" is a dependency problem: your laptop has Python 3.12, OpenSSL 3, and the \`libpq\` that \`psycopg\` links against — the server has none of them, or has different versions. A container packages the application *and* its userland dependencies into one immutable image, so the thing that ran in CI is byte-identical to the thing running in production.

### Image vs container

An **image** is a read-only template — a stack of filesystem layers plus metadata (entrypoint, env, exposed ports). It is a class.
A **container** is a running instance of an image with a thin writable layer on top. It is an object. One image, many containers.

Containers are *not* VMs. A VM virtualizes hardware and runs a full guest kernel; a container is a set of processes on the **host kernel**, isolated via namespaces (PID, network, mount, user) and limited via cgroups (CPU, memory). That is why a container starts in milliseconds and a VM takes 30 seconds — and also why a Linux container cannot run on a Windows kernel without a Linux VM underneath.

### Layers and caching

Each instruction that changes the filesystem creates a layer. Layers are content-addressed and cached; on rebuild, Docker reuses cached layers until the first one whose inputs changed, then rebuilds everything after it. **Order instructions from least- to most-frequently-changing.** That single principle is why the Dockerfile below copies \`pyproject.toml\` and the lockfile before the source code: your source changes every commit, your dependencies do not, so dependency installation stays cached.

### A real, production-shaped Dockerfile

\`\`\`dockerfile
# syntax=docker/dockerfile:1

# ---- Stage 1: build a self-contained virtualenv ----------------------------
# The builder is allowed to be fat: it carries gcc and the -dev headers that
# any package without a prebuilt wheel needs in order to compile.
FROM python:3.12-slim AS builder

# PYTHONDONTWRITEBYTECODE: .pyc files are dead weight in a layer.
# PYTHONUNBUFFERED: without it your logs sit in a buffer and vanish on crash.
# UV_PROJECT_ENVIRONMENT: build the venv at /opt/venv instead of ./.venv, so a
# bind-mounted source tree in local development cannot shadow it, and so the
# whole environment is one directory to copy into the runtime stage.
ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1 \\
    UV_PROJECT_ENVIRONMENT=/opt/venv \\
    PATH="/opt/venv/bin:$PATH"

RUN apt-get update \\
 && apt-get install -y --no-install-recommends build-essential libpq-dev \\
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only the manifests first. This layer's cache key is these two files,
# so editing src/ does NOT invalidate the (slow) dependency install below.
COPY pyproject.toml uv.lock ./
# --frozen installs exactly the locked versions and fails if the lock is stale.
# --no-install-project installs dependencies only, so the app's own source
# staying out of this layer is what keeps the cache hit rate high.
RUN pip install --no-cache-dir uv \\
 && uv sync --frozen --no-dev --no-install-project

# Now the source, which changes every commit, and only then the app itself.
COPY src/ ./src/
RUN uv sync --frozen --no-dev

# ---- Stage 2: the runtime image that actually ships ------------------------
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1 \\
    PATH="/opt/venv/bin:$PATH"

# Runtime needs the shared library only — not the -dev headers or the compiler.
RUN apt-get update \\
 && apt-get install -y --no-install-recommends libpq5 curl \\
 && rm -rf /var/lib/apt/lists/*

# Run as a non-root user. If the process is compromised, the blast radius is
# a user with no privileges rather than root inside the container.
RUN groupadd --system app && useradd --system --gid app --no-create-home app

WORKDIR /app

# Copy only what the runtime needs. gcc, the -dev headers, the test suite,
# and the build cache never enter this image.
COPY --from=builder --chown=app:app /opt/venv /opt/venv
COPY --from=builder --chown=app:app /app/src  /app/src

USER app
EXPOSE 8000

# HEALTHCHECK lets the orchestrator know when this container is actually
# serving, not merely running — that is what makes rolling deploys safe.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \\
  CMD curl -fsS http://localhost:8000/healthz || exit 1

# Exec form (JSON array), not shell form: the process becomes PID 1 and
# receives SIGTERM directly, so it can drain connections and shut down
# gracefully. With shell form a /bin/sh wrapper is PID 1, swallows the
# signal, and you get SIGKILLed 30 seconds later mid-request.
CMD ["gunicorn", "app.main:app", \\
     "--worker-class", "uvicorn.workers.UvicornWorker", \\
     "--bind", "0.0.0.0:8000", \\
     "--workers", "4"]
\`\`\`

Why the multi-stage build matters: a single-stage image carrying \`build-essential\`, the \`-dev\` headers, and the test suite is often over 1 GB. This one is a few hundred MB. Smaller images pull faster (which is deploy latency and rollback latency) and have a much smaller CVE surface, because half a gigabyte of build tooling is half a gigabyte of things a scanner can flag.

The Python-specific trick is that the artifact you copy between stages is the **virtualenv**. It is a self-contained directory, so \`COPY --from=builder /opt/venv /opt/venv\` moves every installed package — including compiled C extensions — in one instruction, and putting it on \`PATH\` is all the "activation" a container needs. Two caveats to have ready: the stages must share a base image so the compiled extensions are ABI-compatible, and \`python:3.12-alpine\` is a trap for Python specifically — musl means many packages have no prebuilt wheel, so builds get slower and images can end up *larger* than the Debian slim equivalent.

Other points to have ready:

- **\`.dockerignore\` is not optional.** Without it, \`COPY . .\` ships \`.venv\`, \`.git\`, and \`.env\` into the image — slow, and a secret leak. Worse, a copied \`.venv\` built on macOS contains binaries that will not run on Linux. It should contain at minimum \`.venv\`, \`__pycache__\`, \`*.pyc\`, \`.git\`, \`.env*\`, \`.pytest_cache\`, \`.mypy_cache\`.
- **\`CMD\` vs \`ENTRYPOINT\`**: \`ENTRYPOINT\` is the executable; \`CMD\` provides default arguments and is what \`docker run <image> <args>\` overrides.
- **\`COPY\` vs \`ADD\`**: use \`COPY\`. \`ADD\` also fetches URLs and auto-extracts archives, which is surprising behavior you rarely want.
- **Never bake secrets into an image.** Layers are permanent — \`ENV API_KEY=...\` is readable by anyone who pulls the image, even if a later layer unsets it. Inject secrets at runtime.
- **Tag with the commit SHA**, not just \`latest\`. \`latest\` is mutable, so "roll back to the previous latest" is not a thing you can do.

### Useful commands

\`\`\`bash
docker build -t api:sha-4a9f2c1 .
docker run --rm -p 8000:8000 --env-file .env api:sha-4a9f2c1
docker ps                                  # running containers
docker logs -f <container>                 # follow logs
docker exec -it <container> sh             # shell into a running container
docker image history api:sha-4a9f2c1       # per-layer sizes — where the bloat is
docker compose up --build                  # multi-service local stack
\`\`\``,
    },
    {
      id: "deploying",
      heading: "Environments, feature flags, deploy strategies, rollback",
      markdown: `### Environments

\`\`\`text
local -> CI -> staging (prod-like, real deps, fake/anonymized data) -> production
\`\`\`

The same artifact moves right through this chain. Only **configuration** changes between environments — database URLs, API keys, log levels — injected as environment variables or from a secrets manager, never compiled in. This is the config half of the Twelve-Factor App idea, and it is the reason "build once, deploy many" works at all.

### Feature flags

A flag decouples *deploying* code from *releasing* a feature:

\`\`\`python
async def checkout(order: Order, user_id: str) -> Receipt:
    if await flags.is_enabled("new-checkout", user_id=user_id):
        return await new_checkout(order)
    return await legacy_checkout(order)
\`\`\`

What that buys you:

- **Trunk-based development.** Merge unfinished work to main behind a flag instead of running a three-week branch that will conflict catastrophically.
- **Gradual rollout.** 1% of users, then 10%, then 50%, watching error rates at each step.
- **Instant kill switch.** Turning a flag off is a config change measured in seconds. A rollback deploy is minutes.
- **A/B testing** falls out of the same mechanism.

The cost is real: every flag is a branch in the code, and \`2^n\` flags is \`2^n\` untested combinations. Flags must have owners and expiry dates, and removing a flag after full rollout is part of finishing the feature, not optional cleanup.

### Deploy strategies

| Strategy | How it works | Trade-off |
| --- | --- | --- |
| **Recreate** | Stop v1, start v2 | Simple; causes downtime. Fine for internal tools |
| **Rolling** | Replace instances a few at a time | No downtime, no extra capacity; v1 and v2 run simultaneously, so both must be compatible; slow to roll back |
| **Blue-green** | Two full environments; flip the load balancer from blue to green | Instant cutover, instant rollback (flip back); costs 2x capacity, and shared state like the DB still has to be handled |
| **Canary** | Route 1% → 5% → 25% → 100%, watching metrics | Smallest blast radius, catches real-traffic-only bugs; needs good metrics and automation |

The thing that makes all of them work is **backward compatibility**, because during any zero-downtime deploy both versions are live at once. That is why schema changes use the expand/contract pattern:

1. **Expand**: add the new nullable column. Old code ignores it; new code can use it.
2. **Migrate**: deploy code that writes both old and new; backfill existing rows.
3. **Contract**: once no running code reads the old column, drop it — in a *later* deploy.

Renaming a column in one migration takes the site down the instant old and new pods coexist. This is a favorite senior-interviewer probe because it separates people who have deployed from people who have only migrated a local database.

### Rollback

Have a rollback plan before you deploy, and make rollback the *first* response to a production incident — diagnose after the bleeding stops.

\`\`\`bash
kubectl rollout undo deployment/api            # previous ReplicaSet
kubectl rollout status deployment/api
\`\`\`

- **Roll back, do not roll forward**, unless the fix is genuinely trivial and already tested. Writing a hotfix under incident pressure is how one outage becomes two.
- Immutable, SHA-tagged artifacts are what make rollback a one-liner.
- **Migrations are the hard part**: code rolls back, data does not. Additive, backward-compatible migrations keep rollback possible; a destructive migration means the previous version can no longer run.

### Monitoring and alerting

The three signals to name:

- **Metrics** — cheap numeric time series (request rate, error rate, p50/p95/p99 latency, saturation). Aggregate; good for dashboards and alerts.
- **Logs** — discrete events with context. Structured JSON, not \`print()\` or f-string messages, so they are queryable — \`structlog\` or the stdlib \`logging\` module with a JSON formatter. Include a request/trace id on every line.
- **Traces** — one request's path across services, with timing per hop. This is how you answer "which of these eleven services made checkout slow."

Two frameworks worth naming:

- **The four golden signals**: latency, traffic, errors, saturation.
- **RED for services**: Rate, Errors, Duration.

**Alert on symptoms, not causes.** "p99 checkout latency > 2s for 5 minutes" is a user-visible symptom worth waking someone for. "CPU > 80%" is not — CPU can be 90% while everything is fine, and pages that are usually noise train people to ignore the pager. Every alert should be actionable and should link to a runbook. Alert fatigue is the failure mode that makes a monitoring stack worthless.

Use **percentiles, not averages**. An average latency of 200ms is compatible with 1% of users waiting 10 seconds. p99 is the number your angriest users experience.`,
    },
  ],
  questions: [
    {
      q: "What is the difference between merge and rebase, and when would you use each?",
      a: "Merge creates a new commit with two parents, joining the histories; nothing is rewritten and every original commit id survives. Rebase replays your commits one at a time onto a new base, giving each a new parent and therefore a new SHA — the originals are orphaned. Merge is non-destructive and safe on shared branches but produces a braided graph. Rebase gives a linear, readable history but rewrites it. My rule: rebase my own unpushed work to keep it current with main and keep conflicts small; merge or squash-merge into shared branches; never rebase a branch someone else has based work on, because they'd end up with duplicate commits. After rebasing a pushed branch I push with `--force-with-lease`, not `--force`, so I can't clobber a teammate's push I haven't seen.",
      weak: "Merge combines branches and rebase moves your branch on top of another one. I usually just use merge because rebase is dangerous.",
    },
    {
      q: "You accidentally committed three times to main instead of your feature branch. Nothing is pushed. What do you do?",
      a: "Branch first, then rewind. `git switch -c feat/thing` creates a branch pointing at my current commits, so the work is now safe on a named branch. Then `git switch main` and `git reset --hard origin/main` moves main back to match the remote. Then `git switch feat/thing` and continue. The key insight is that a branch is just a pointer, so 'moving commits to another branch' is really just creating a label here and moving the other label back. If those commits had already been pushed to a shared main, I would not reset and force-push — I'd `git revert` them, which adds new commits undoing the change and leaves everyone else's history valid.",
    },
    {
      q: "What is git reflog and when have you needed it?",
      a: "The reflog is a local log of everywhere HEAD has been — every commit, checkout, reset, rebase, merge. It's the safety net for 'I destroyed something.' The classic case is a `git reset --hard` that threw away commits: the commits still exist, nothing just points at them. `git reflog` shows entries like `HEAD@{1}: commit: ...`, and `git reset --hard HEAD@{1}` or `git switch -c rescue <sha>` gets them back. The takeaway is that anything ever committed is recoverable for about 90 days, but uncommitted work is not — which is the real argument for committing early and often even if the commits are messy, since you can always clean them up with an interactive rebase later.",
      weak: "Reflog shows the log of your commits, kind of like git log. I haven't really used it.",
    },
    {
      q: "Walk me through resolving a merge conflict.",
      a: "First `git status` to get the list of 'both modified' files — that's my worklist. For each file I open it, read both sides of the conflict markers, and resolve by intent rather than by picking a side; often the correct result is neither version, because both changes need to coexist. Then I delete the markers, `git add` the file to mark it resolved, and when `git status` shows nothing unmerged, `git merge --continue` or `git rebase --continue`. Then I run the tests, because a resolution that compiles isn't necessarily correct — resolution is a common place to introduce real bugs. Worth knowing: during a merge, HEAD is the branch you're on; during a rebase, that's inverted — HEAD is the upstream and the bottom chunk is your commit. And I can always `git merge --abort` to get back to exactly where I started. Mostly though, the fix is prevention: small PRs, merged fast, rebased on main often.",
    },
    {
      q: "You just realized you pushed a file containing an API key. What now?",
      a: "Rotate the key first. The moment it hit a remote it should be assumed compromised — bots scrape public commits within minutes — so revoking and reissuing the credential is the actual fix, and everything else is cleanup. Then purge it from history with `git filter-repo` or the BFG (not `filter-branch`, which is deprecated and slow), force-push all branches and tags, and tell everyone to re-clone, because stale clones will push the old objects right back. On GitHub I'd also remember that forks and cached PR views can still hold the blob, so for a serious credential I'd contact support. Finally, prevent recurrence: `.env` in `.gitignore`, a pre-commit secret scanner like gitleaks, and push protection on the repo.",
      weak: "I'd delete the file and commit the deletion, then force-push so it's gone from the repo.",
    },
    {
      q: "Explain the testing pyramid. Where do you spend your effort?",
      a: "It's a heuristic about the ratio between test types, driven by the tradeoff between confidence and cost. Lots of unit tests: milliseconds, isolated, they tell you the exact line that broke, so that's where I get exhaustive edge-case coverage cheaply. A moderate number of integration tests covering the seams — a route handler against a real Postgres in a container, because mocking a database mostly tests your mock. And a handful of end-to-end tests for critical journeys only; they're slow and the main source of flakiness, so they cover 'can a user actually check out,' not edge cases. The classic anti-pattern is the ice cream cone — mostly E2E — where the suite takes 40 minutes, flakes constantly, and the team stops trusting red builds. That last part is the real damage. I'd also say the pyramid isn't a law: for a thin CRUD service that's mostly glue, integration tests carry most of the value.",
    },
    {
      q: "What makes a good unit test?",
      a: "It tests one observable behavior, it's readable as a specification, and it fails only when something is genuinely wrong. Structurally: arrange/act/assert with one call in the act step — in pytest that's a plain `assert`, since pytest rewrites the expression and prints both sides on failure. The name states the behavior — `test_raises_insufficient_stock_when_quantity_exceeds_inventory`, not `test_cart` — because when CI fails at 2am the test name is the entire bug report. It asserts on the contract, not internals: my rule of thumb is that a pure refactor should not break a single test, and if it does, the tests were describing implementation and will fight every future change. It's deterministic — injected clock, seeded randomness, no network, no dependence on execution order, which I'd verify with `pytest-randomly` — and it covers boundaries, so I use `@pytest.mark.parametrize` to assert at 9, 10, and 11 rather than at 5, because off-by-one bugs live exactly at the boundary, and parametrize gives me one independent test per row so the first failure doesn't hide the rest.",
      weak: "A good unit test tests one function and gets high coverage of it.",
    },
    {
      q: "When is mocking a mistake?",
      a: "Four cases. Mocking something you don't own — if I mock the Stripe SDK based on my belief about its response shape, my test passes forever including when Stripe changes it; better to wrap third-party APIs in my own interface and mock that, with a few real contract tests against a sandbox. Over-mocking, where every collaborator is faked so the test only asserts that the code called the functions I told it to call, in the order I expected — if setup is 30 lines of mocks for 3 lines of assertion, that's the design telling me the unit has too many dependencies. Mocking the database, which validates nothing about my SQL, schema, or migrations — use a real Postgres in a container. And strict mocks asserting an exact sequence of internal calls, which makes every refactor a test rewrite. My heuristic is to mock at the process boundary — network, clock, filesystem, randomness — and use real objects inside it. Two Python specifics I'd mention: always pass `spec=` or use `autospec=True`, because a bare `Mock` happily accepts a misspelled method and returns another `Mock`, so the test passes after you rename something; and patch where the name is looked up, not where it's defined — if `orders.py` does `from billing import charge`, you patch `orders.charge`. I prefer `monkeypatch` in pytest since it undoes itself at teardown.",
    },
    {
      q: "Should you aim for 100% test coverage?",
      a: "No. Coverage measures which lines executed, not whether you asserted anything meaningful — a test that calls the function with no assertion at all can hit 100% and be worthless. Chasing 100% has specific failure modes: it rewards writing tests for trivial properties and dataclasses because that's the cheapest way to move the number, the last 10% is usually low-risk defensive branches that cost disproportionate effort, and once it's a hard gate people write assertion-free tests to pass it, so you end up with a worse suite and a green metric. I use coverage as a diff-level flag — 'this PR added 200 lines with no tests, is that deliberate?' — rather than a global target. Practically that's `pytest --cov=src --cov-branch --cov-report=term-missing`: branch coverage tells you more than line coverage, because an `if` whose body always runs counts as covered even though the false branch never executed, and `term-missing` gives you actionable line numbers instead of a percentage. Mutation testing with `mutmut` measures the thing you actually care about: it mutates your code and checks whether any test notices.",
      weak: "Yes, 100% coverage means the code is fully tested and there are no bugs.",
    },
    {
      q: "What is a flaky test and how do you deal with one?",
      a: "A test that passes and fails on identical code. Usual causes: real clocks and timezone assumptions, order dependence from shared mutable state — a module-level global, a session-scoped fixture, a mutable default argument — races between async operations, unseeded randomness, port collisions, leftover database rows, and sleeping for a fixed duration instead of waiting for a condition. That last one is both slow and flaky, since the sleep always waits and sometimes still isn't long enough on a loaded CI box; the fix is `asyncio.wait_for` on the actual condition, or freezing the clock with `freezegun`. I'd run `pytest-randomly` to surface order dependence rather than guessing. The organizational answer matters as much as the technical one: a flaky test is a broken test. I'd quarantine it out of the required build immediately — a marker plus `pytest -m \"not quarantine\"` — so it stops training people to ignore red, file a ticket, and fix or delete it. Reaching for `pytest-rerunfailures` instead just hides it. Teams that let flakes accumulate stop believing CI, and then CI stops working — not technically, socially.",
    },
    {
      q: "What is the difference between an image and a container? And how is a container different from a VM?",
      a: "An image is a read-only template: a stack of filesystem layers plus metadata like the entrypoint and exposed ports. A container is a running instance of an image with a thin writable layer on top — image is to container as class is to object, and one image can back many containers. Against a VM: a VM virtualizes hardware and runs a full guest kernel, so it's heavy and takes tens of seconds to boot. A container is just processes on the host kernel, isolated with namespaces for PID, network, mount, and user, and resource-limited with cgroups. That's why containers start in milliseconds and why a Linux container needs a Linux VM underneath to run on macOS or Windows — there's no Linux kernel to share.",
    },
    {
      q: "Why do Dockerfiles copy package.json before copying the source code?",
      a: "Layer caching — and the same reasoning applies to `pyproject.toml` and `uv.lock` in a Python image. Each instruction creates a layer, and on rebuild Docker reuses cached layers until the first one whose inputs changed, then rebuilds everything after it. Source files change every commit; dependencies rarely do. If I `COPY . .` before installing, then any one-character source edit invalidates the copy layer and forces a full reinstall on every build — which for Python means recompiling any package without a prebuilt wheel. By copying only the manifests, running `uv sync --frozen --no-install-project` (or `pip install -r requirements.lock`), and copying source afterwards, the expensive install layer stays cached until the lockfile actually changes. It's a specific instance of the general rule: order Dockerfile instructions from least- to most-frequently-changing. I'd pair that with a multi-stage build where the builder carries `build-essential` and the `-dev` headers and the runtime stage only receives the finished virtualenv — that's often the difference between a 1 GB image and a few hundred MB, which matters for pull time and CVE surface.",
    },
    {
      q: "What does a CI pipeline do, and what's the difference between continuous delivery and continuous deployment?",
      a: "CI means everyone merges to a shared main frequently and every push is automatically built and tested, so integration problems surface in hours instead of at the end of a long branch. A typical pipeline checks out, installs from the lockfile — `uv sync --frozen`, or `pip install --require-hashes -r requirements.lock` — rather than resolving fresh, because a frozen install fails loudly if the lock is stale instead of silently testing different versions than you did. Then it lints with `ruff`, typechecks with `mypy`, runs unit and integration tests with `pytest` against a real Postgres service container, and builds the artifact. Cheapest checks first, so an unused import doesn't cost five minutes. Continuous delivery means every green build produces an artifact that is deployable and a human clicks deploy. Continuous deployment means it deploys automatically with no human in the loop. Both depend on building the artifact once and promoting that same immutable image through environments, so staging tests something byte-identical to production.",
    },
    {
      q: "Compare blue-green and canary deployments.",
      a: "Blue-green runs two full production environments. Blue serves traffic while you deploy to green, verify it, then flip the load balancer. Cutover is instant and rollback is just flipping back, which is why it's popular for high-stakes releases. The costs are 2x capacity and the fact that shared state, mainly the database, is still shared — so the schema has to work for both versions. Canary routes a small slice of real traffic to the new version — 1%, then 5%, 25%, 100% — watching error rate and latency at each step, and rolls back automatically if a threshold trips. Smallest blast radius and it catches bugs that only appear under real traffic, but it needs good metrics and automation to be more than theater. Both require the two versions to coexist safely, which is why schema changes use expand/contract: add the nullable column, deploy code that writes both, backfill, and only drop the old column in a later deploy once nothing reads it.",
    },
    {
      q: "Production is broken after a deploy. Walk me through what you do.",
      a: "Stop the bleeding first, diagnose second. Roll back to the last known-good artifact — `kubectl rollout undo` or flipping the blue-green router — rather than writing a hotfix under pressure, because that's how one outage becomes two. If the change is behind a feature flag, flipping the flag off is even faster: seconds instead of minutes. While that's in flight I'd communicate: post in the incident channel so people stop guessing, and confirm recovery on the dashboards rather than assuming. Then investigate with the deploy diff, logs, and traces, and write a blameless postmortem with concrete action items. The one thing that complicates rollback is migrations — code rolls back, data doesn't — which is why migrations should be additive and backward-compatible, so the previous version can still run against the new schema.",
      weak: "I'd look at the logs, find the bug, fix it, and push the fix as fast as possible.",
    },
    {
      q: "What would you monitor for a web service, and what would you page someone for?",
      a: "The four golden signals: latency, traffic, errors, and saturation — or RED for a service: rate, errors, duration. Concretely: request rate, error rate split by 4xx and 5xx, latency at p50/p95/p99, and resource saturation. Percentiles, not averages: a 200ms average is entirely compatible with 1% of users waiting 10 seconds, and p99 is what your angriest users experience. Alongside metrics I want structured JSON logs with a request id on every line so they're queryable, and distributed traces so I can tell which of eleven services made checkout slow. For paging, the rule is alert on symptoms, not causes. 'p99 checkout latency above 2 seconds for 5 minutes' is user-visible and worth waking someone for. 'CPU above 80%' is not — CPU can be 90% while everything is fine, and alerts that are usually noise train people to ignore the pager. Every alert should be actionable and link to a runbook.",
    },
  ],
};
