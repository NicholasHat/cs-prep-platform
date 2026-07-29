import type { HandbookChapter } from "./types";

export const chapter: HandbookChapter = {
  slug: "leetcode-patterns",
  title: "The LeetCode Pattern Catalog",
  track: "coding",
  order: 1,
  summary:
    "Every pattern that shows up in an internship coding round, with the trigger signals that tell you to reach for it, a working Python template, the complexity, and the mistakes that cost people offers.",
  estMinutes: 180,
  tags: [
    "patterns",
    "algorithms",
    "two-pointers",
    "sliding-window",
    "binary-search",
    "graphs",
    "dynamic-programming",
    "templates",
  ],
  sections: [
    {
      id: "reading-the-constraints",
      heading: "Reading the Problem: Constraints to Pattern",
      markdown: `Interview problems are not puzzles you solve from scratch. There are roughly twenty shapes, and the problem statement almost always tells you which one it is — if you know what to listen for.

Two habits do most of the work.

**1. Read the constraints before the story.** The input bound is a complexity budget, and the budget names the algorithm. The table below assumes roughly 10^8 simple operations per second, which is a compiled-language number. CPython runs one to two orders of magnitude slower — call it 10^7 interpreted steps per second — so treat the budget as a statement about the *shape* of the algorithm, not a promise about the clock. The practical corollary in Python: pick the right complexity class first, then push the inner loop into C wherever you can (\`sum\`, \`sorted\`, \`set\`, \`collections.Counter\`, \`bisect\`, \`heapq\`, \`itertools\`) instead of hand-rolling it.

| Constraint on n | Budget | What that usually means |
| --- | --- | --- |
| n ≤ 12 | O(n!) | Permutations, brute-force backtracking |
| n ≤ 20 | O(2^n) | Subsets, bitmask DP |
| n ≤ 100 | O(n^3) | Interval DP, Floyd-Warshall |
| n ≤ 3,000 | O(n^2) | 2D DP, all-pairs on a small grid |
| n ≤ 10^5 | O(n log n) | Sorting, heap, binary search on the answer |
| n ≤ 10^6 | O(n) | Single pass, hash map, two pointers, sliding window |
| n ≥ 10^9 | O(log n) or O(1) | Binary search on the answer, math, bit tricks |

If n is 10^5 and you propose an O(n^2) approach, you have already told the interviewer the answer is wrong. Say the budget out loud: *"n goes up to 10^5, so I'm aiming for n log n or better — that rules out checking every pair."* That single sentence is worth real points.

**2. Map the vocabulary to the pattern.** Problem statements reuse phrases. Learn the mapping.

| Phrase in the problem | Reach for |
| --- | --- |
| "sorted array", "pair that sums to" | Two pointers |
| "cycle", "middle of the list", "no extra space" on a list | Fast & slow pointers |
| "contiguous subarray/substring of size k" | Fixed sliding window |
| "longest/shortest substring such that…" | Variable sliding window |
| "sum of a range", "subarray summing to k" | Prefix sums (+ hash map) |
| "count occurrences", "have we seen", "anagram", "duplicate" | Hash map / hash set |
| "sorted", "minimize the maximum", "find the smallest x such that" | Binary search (possibly on the answer) |
| "intervals", "meetings", "merge overlapping" | Sort by start or end, then sweep |
| "next greater/smaller element", "span", "histogram" | Monotonic stack |
| "top k", "k largest", "median of a stream" | Heap |
| "level by level", "shortest path in an unweighted graph" | BFS |
| "all paths", "generate every combination" | Backtracking |
| "prefix", "autocomplete", "dictionary of words" | Trie |
| "prerequisites", "ordering", "dependencies" | Topological sort |
| "connected components", "is it a valid tree", "union" | Union-find |
| "shortest path with weights/costs" | Dijkstra |
| "count the ways", "min/max cost to reach", "can we make" | Dynamic programming |
| "without using +/-", "exactly one number appears once" | Bit manipulation |

**3. When nothing matches, ask what the brute force repeats.** Almost every optimization in this catalog is the same move: the brute force recomputes something, so you cache it (hash map, prefix sum, memo), or you exploit an ordering so you never have to look backwards (two pointers, monotonic stack, sorting). If you can name the repeated work, you can usually name the pattern.

A note on the templates below: they are written to be *read and adapted*, not memorized character by character. What you should memorize is the loop skeleton and the invariant each one maintains. If you can state the invariant, you can rederive the code under pressure.`,
    },
    {
      id: "two-pointers",
      heading: "Two Pointers (and Fast & Slow)",
      markdown: `### Trigger signals

- The array is **sorted**, or sorting it doesn't destroy the answer.
- You're looking for a **pair or triple** satisfying a condition, and the brute force is a nested loop.
- The problem is about **the outside working inwards**: palindromes, container walls, trapping water.
- You need to **partition or compact in place** with O(1) extra space (move zeroes, remove duplicates).
- Linked list plus the words **cycle**, **middle**, **nth from the end**, or a constraint of O(1) space.

### Why it works

Two pointers converts a nested loop into a single pass by proving that when you move a pointer, you never need to revisit what it passed. That proof is the whole pattern. In sorted two-sum: if \`nums[left] + nums[right] < target\`, then \`nums[left]\` paired with *anything at or below* \`right\` is also too small, so \`left\` can never be part of a solution with a smaller right — advance it. Be ready to say that sentence; interviewers ask "why is it safe to move that pointer?"

### Template: converging pointers

\`\`\`python
def two_sum_sorted(nums: list[int], target: int) -> tuple[int, int] | None:
    left, right = 0, len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return (left, right)
        if total < target:
            left += 1
        else:
            right -= 1
    return None
\`\`\`

Name the running total \`total\`, not \`sum\` — \`sum\` is a builtin, and shadowing it inside a function that later wants \`sum(nums)\` is a genuinely common interview stumble.

### Template: fixed anchor plus two pointers (3Sum)

\`\`\`python
def three_sum(nums: list[int]) -> list[list[int]]:
    ordered = sorted(nums)  # sorted() copies; nums.sort() would mutate the caller's list
    out: list[list[int]] = []

    for i in range(len(ordered) - 2):
        if ordered[i] > 0:
            break  # sorted, so no triple can still sum to zero
        if i > 0 and ordered[i] == ordered[i - 1]:
            continue  # skip duplicate anchors

        left, right = i + 1, len(ordered) - 1
        while left < right:
            total = ordered[i] + ordered[left] + ordered[right]
            if total < 0:
                left += 1
            elif total > 0:
                right -= 1
            else:
                out.append([ordered[i], ordered[left], ordered[right]])
                left += 1
                right -= 1
                while left < right and ordered[left] == ordered[left - 1]:
                    left += 1
                while left < right and ordered[right] == ordered[right + 1]:
                    right -= 1
    return out
\`\`\`

### Template: fast & slow pointers

\`\`\`python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val = val
        self.next = next


def has_cycle(head: ListNode | None) -> bool:
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next  # safe: fast is ahead of slow, so slow is non-None here
        fast = fast.next.next
        if slow is fast:
            return True
    return False


def middle_node(head: ListNode | None) -> ListNode | None:
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
    return slow  # on even length this is the second middle
\`\`\`

Use \`slow is fast\`, not \`slow == fast\`. You are asking whether the two pointers are on the *same node*, which is identity. \`==\` falls back to identity for a plain class, but the moment the node type defines \`__eq__\` (or you're comparing values pulled out of the nodes) the two stop meaning the same thing.

Floyd's second phase — finding *where* the cycle starts — is the version people forget. After the pointers meet, reset one to the head and advance both one step at a time; they meet at the cycle entrance. This is the trick behind Find the Duplicate Number, where the array itself is the linked list (\`i -> nums[i]\`):

\`\`\`python
def find_duplicate(nums: list[int]) -> int:
    slow = fast = nums[0]
    while True:  # Python has no do-while; loop forever and break at the bottom
        slow = nums[slow]
        fast = nums[nums[fast]]
        if slow == fast:
            break

    slow = nums[0]
    while slow != fast:
        slow = nums[slow]
        fast = nums[fast]
    return slow
\`\`\`

### Complexity

O(n) for a single converging pass, O(n log n) if you had to sort first (3Sum is O(n^2) because of the outer anchor loop). Space is O(1) beyond the output if you use \`list.sort()\`, or O(n) if you use \`sorted()\`, which allocates a copy — say which one you're doing.

### Pitfalls

- **\`left < right\` vs \`left <= right\`.** If the two pointers are indexing *different* things (pair selection), you want \`<\`; if you're scanning a whole range and each pointer can land on the same element (binary search style), you want \`<=\`. Decide out loud before you write the loop.
- **Duplicate handling.** 3Sum's entire difficulty is de-duplication. Skipping duplicates at the anchor *and* after recording a hit are two separate skips; forgetting either produces duplicate triples.
- **Mutating the caller's list.** \`nums.sort()\` sorts in place and returns \`None\`; \`sorted(nums)\` returns a new list and leaves the input alone. \`ordered = nums.sort()\` binds \`None\` and the next line dies. Say which one you picked and why.
- **Forgetting that sorting destroys indices.** If the answer must be *original* indices (Two Sum I), you cannot sort — that problem is a hash map problem, not a two-pointer problem. Recognizing that distinction is the point of the first two problems on every list.
- **Negative indices don't raise.** \`nums[-1]\` is the last element, not an error. A pointer that walks off the left end silently wraps around and reads plausible garbage instead of crashing, so guard with \`while left >= 0\` rather than trusting an exception.
- **Missing the second condition on a fast pointer.** \`fast.next.next\` raises \`AttributeError: 'NoneType' object has no attribute 'next'\` if you only checked \`fast is not None\`. Both conditions, always — and \`and\` short-circuits, so the order matters.

### Representative problems

Valid Palindrome · Two Sum II · 3Sum · Container With Most Water · Trapping Rain Water · Linked List Cycle · Find the Duplicate Number`,
    },
    {
      id: "sliding-window",
      heading: "Sliding Window: Fixed and Variable",
      markdown: `### Trigger signals

- The words **contiguous**, **subarray**, or **substring** — non-contiguous means DP or greedy, not a window.
- **Fixed window:** "of size k", "every window of length k".
- **Variable window:** "longest/shortest … such that <condition>", where the condition is *monotonic* — if a window satisfies it, every sub-window does too (or vice versa).
- You're recomputing a sum/count/frequency over overlapping ranges.

The monotonicity requirement matters. "Longest substring with at most k distinct characters" works because shrinking a valid window keeps it valid. "Longest subarray whose sum is exactly k" does **not** work with a window when negatives are allowed — shrinking can make the sum go either direction. That one is a prefix-sum + hash map problem. Interviewers love this distinction.

### Template: fixed window

\`\`\`python
def max_sum_of_size_k(nums: list[int], k: int) -> int:
    if len(nums) < k:
        return 0

    window_sum = sum(nums[:k])  # the only slice; after this everything is O(1)
    best = window_sum

    for right in range(k, len(nums)):
        window_sum += nums[right] - nums[right - k]  # add entering, remove leaving
        best = max(best, window_sum)
    return best
\`\`\`

The whole idea is that entering and leaving are O(1), so the window slides in O(n) instead of O(n·k). Resist the temptation to write \`sum(nums[i : i + k])\` inside the loop: it looks tidy, it's one line, and it is exactly the O(n·k) you were trying to avoid.

### Template: variable window, longest valid

Grow on the right unconditionally; shrink from the left only while the window is invalid. Record the answer after the shrink loop, when the window is guaranteed valid.

\`\`\`python
from collections import defaultdict


def longest_with_at_most_k_distinct(s: str, k: int) -> int:
    freq: defaultdict[str, int] = defaultdict(int)
    left = 0
    best = 0

    for right, entering in enumerate(s):
        freq[entering] += 1

        while len(freq) > k:
            leaving = s[left]
            freq[leaving] -= 1
            if freq[leaving] == 0:
                del freq[leaving]  # delete, don't leave a zero: len(freq) is the check
            left += 1

        best = max(best, right - left + 1)
    return best
\`\`\`

Longest Substring Without Repeating Characters is the same skeleton, but you can jump \`left\` straight past the previous occurrence instead of shrinking one step at a time:

\`\`\`python
def length_of_longest_substring(s: str) -> int:
    last_seen: dict[str, int] = {}
    left = 0
    best = 0

    for right, ch in enumerate(s):
        prev = last_seen.get(ch)
        if prev is not None and prev >= left:
            left = prev + 1  # only jump forward; never move left backwards
        last_seen[ch] = right
        best = max(best, right - left + 1)
    return best
\`\`\`

\`last_seen.get(ch)\` returns \`None\` for a missing key instead of raising \`KeyError\`, which is why the guard is \`prev is not None\`. Don't write \`if prev:\` — index 0 is falsy, so a character last seen at position 0 would be ignored.

### Template: variable window, shortest valid

Flip it: shrink *while* the window is valid, and record inside the shrink loop.

\`\`\`python
from collections import Counter


def min_window(s: str, t: str) -> str:
    if not t or len(s) < len(t):
        return ""

    need = Counter(t)
    missing = len(t)  # total characters still owed, counting multiplicity
    left = 0
    best_start = 0
    best_len = len(s) + 1  # an integer sentinel beats float("inf") for a length

    for right, entering in enumerate(s):
        if entering in need:
            if need[entering] > 0:
                missing -= 1  # only counts if we still owed this character
            need[entering] -= 1  # may go negative: surplus

        while missing == 0:
            if right - left + 1 < best_len:
                best_len = right - left + 1
                best_start = left
            leaving = s[left]
            if leaving in need:
                need[leaving] += 1
                if need[leaving] > 0:
                    missing += 1  # we just gave up a needed character
            left += 1

    return "" if best_len > len(s) else s[best_start : best_start + best_len]
\`\`\`

Note the \`if entering in need\` guard. \`Counter\` returns \`0\` for a missing key rather than raising, which is convenient for reads — but \`need[entering] -= 1\` on an absent key *inserts* it, so without the guard the counter fills up with every character in \`s\` and the surplus bookkeeping stops meaning anything.

### Complexity

O(n) time: \`right\` advances n times and \`left\` advances at most n times total across the whole run, so the inner \`while\` is not a nested loop. Say that out loud — "the inner loop looks quadratic but each index is only consumed once, so it's amortized O(n)" — because interviewers specifically probe it. Space is O(k) or O(alphabet) for the frequency map.

### Pitfalls

- **Recording the answer in the wrong place.** Longest: after shrinking. Shortest: inside the shrink loop. Getting this backwards produces answers that are almost right, which is worse than obviously wrong.
- **Off-by-one on window length.** It is \`right - left + 1\` for an inclusive window. Write that once, correctly, and reuse it.
- **Using a window where negatives break monotonicity.** Check whether shrinking always helps before you commit.
- **Deleting vs zeroing dictionary entries.** If your validity check is \`len(freq) > k\`, you must \`del freq[ch]\` at zero, not leave a zero-valued key. This is the single most common sliding-window bug.
- **\`defaultdict\` inserts on read.** \`if freq[ch] == 0\` on a \`defaultdict(int)\` *creates* key \`ch\` with value 0, which silently inflates \`len(freq)\` and breaks the check above. Use \`freq.get(ch, 0)\` or \`ch in freq\` when you only mean to look.
- **Rebuilding the window instead of updating it.** \`s[left : right + 1]\` inside the loop is O(n) per step because Python strings are immutable and slicing copies. Maintain counters, and if you must build a result string, accumulate the pieces in a list and \`"".join(...)\` at the end.
- **Sliding Window Maximum is not a plain window.** Max over a window isn't maintainable by add/remove alone, because removing the max leaves you with no idea what the new max is. That needs a monotonic deque — see the stack section.

### Representative problems

Best Time to Buy and Sell Stock · Longest Substring Without Repeating Characters · Longest Repeating Character Replacement · Permutation in String · Minimum Window Substring · Sliding Window Maximum`,
    },
    {
      id: "prefix-sums-and-hashing",
      heading: "Prefix Sums & Hash Map Counting",
      markdown: `These are two patterns, but they show up together so often that it's worth learning the combination as one move: **precompute a running aggregate, then use a hash map to look up the complement in O(1).**

### Trigger signals — prefix sums

- Repeated **range sum / range product** queries over a static array.
- "Subarray that sums to k", "count subarrays with property X", "product of everything except self".
- The brute force is "for every start, for every end, sum the slice" — an O(n^3) or O(n^2) triple/double loop.
- 2D version: repeated rectangle sums over an immutable matrix.

### Trigger signals — hash map counting

- "Have I seen this before", "count occurrences", "duplicate", "anagram", "group by".
- You need O(1) membership on an unsorted collection.
- You need to remember the *index* or *first position* where something occurred, not just that it occurred.

### Template: prefix sums

Use a length \`n + 1\` list with a leading zero. It removes every boundary special case.

\`\`\`python
from itertools import accumulate


def build_prefix(nums: list[int]) -> list[int]:
    prefix = [0] * (len(nums) + 1)
    for i, num in enumerate(nums):
        prefix[i + 1] = prefix[i] + num
    return prefix


def build_prefix_stdlib(nums: list[int]) -> list[int]:
    """Same thing, but the loop runs in C."""
    return list(accumulate(nums, initial=0))


def range_sum(prefix: list[int], lo: int, hi: int) -> int:
    """Sum of nums[lo..hi] inclusive, in O(1)."""
    return prefix[hi + 1] - prefix[lo]
\`\`\`

### Template: prefix sum + hash map (the money combination)

Counting subarrays that sum to \`k\`: a subarray \`(l, r]\` sums to k exactly when \`prefix[r] - prefix[l] == k\`, i.e. \`prefix[l] == prefix[r] - k\`. So as you sweep, ask how many earlier prefixes equal \`running - k\`.

\`\`\`python
def subarray_sum(nums: list[int], k: int) -> int:
    seen: dict[int, int] = {0: 1}  # the empty prefix has been seen once
    running = 0
    count = 0

    for num in nums:
        running += num
        count += seen.get(running - k, 0)
        seen[running] = seen.get(running, 0) + 1
    return count
\`\`\`

The \`{0: 1}\` seed is what makes subarrays that start at index 0 count. Omitting it is the classic bug, and it only shows up on inputs where the answer includes a prefix of the array — so your happy-path test passes and you ship a wrong answer.

### Template: prefix and suffix passes

When "everything except me" is the ask, sweep forward accumulating, then sweep backward accumulating, and multiply.

\`\`\`python
def product_except_self(nums: list[int]) -> list[int]:
    n = len(nums)
    out = [1] * n

    prefix = 1
    for i in range(n):
        out[i] = prefix
        prefix *= nums[i]

    suffix = 1
    for i in range(n - 1, -1, -1):  # range's stop is exclusive, so -1 to reach index 0
        out[i] *= suffix
        suffix *= nums[i]
    return out
\`\`\`

Note the deliberate choice: the output list doesn't count as extra space by the problem's own statement, so this is O(1) auxiliary. Say that; don't let the interviewer wonder whether you noticed.

### Template: hash map counting

\`\`\`python
from collections import Counter, defaultdict


def count_of(items: list[str]) -> Counter[str]:
    return Counter(items)  # do not hand-roll a frequency dict; Counter is the answer


def group_anagrams(strs: list[str]) -> list[list[str]]:
    groups: defaultdict[tuple[int, ...], list[str]] = defaultdict(list)
    for word in strs:
        counts = [0] * 26
        for ch in word:
            counts[ord(ch) - ord("a")] += 1
        groups[tuple(counts)].append(word)  # tuple: hashable. A list is not.
    return list(groups.values())
\`\`\`

\`Counter\` also gives you \`most_common(k)\`, subtraction, and equality comparison — \`Counter(a) == Counter(b)\` *is* the Valid Anagram solution, and it's the answer an interviewer wants to hear before you write the 26-slot array.

### Template: hash set for O(n) sequence detection

Longest Consecutive Sequence is the canonical "hash set removes the need to sort" problem. Only start counting from a value that has no predecessor, and the total work is linear even though there's a nested loop.

\`\`\`python
def longest_consecutive(nums: list[int]) -> int:
    seen = set(nums)
    best = 0

    for num in seen:
        if num - 1 in seen:
            continue  # not a sequence head, someone else will count it
        length = 1
        while num + length in seen:
            length += 1
        best = max(best, length)
    return best
\`\`\`

The interviewer will ask why this isn't O(n^2). Answer: the inner loop only runs for sequence heads, and across all heads it visits each element exactly once — O(n) total.

### Complexity

Prefix build O(n) time / O(n) space, then O(1) per query. Hash map counting is O(n) average time, O(k) space for k distinct keys. **Average** is the operative word: hashing is O(1) expected, O(n) worst case under collisions. Interviewers rarely care, but knowing it is a differentiator.

### Pitfalls

- **Forgetting the \`{0: 1}\` seed** in the prefix + hash map counting template.
- **Prefix sums on a mutable list.** If the list changes between queries, prefix sums are wrong; you need a Fenwick/segment tree. Recognize and name the limitation.
- **Assuming arithmetic is free because Python ints never overflow.** They don't — an int grows to whatever size it needs, so there is no \`MAX_SAFE_INTEGER\` cliff and no wraparound. The cost is that arithmetic stops being O(1) once values exceed a machine word: multiplying two 10,000-digit prefix products is genuinely slower than multiplying two small ones. Worth one sentence, plus "in Java or C++ this would overflow a 32-bit int" if the numbers are large — it shows you think beyond one language.
- **Unhashable keys.** A \`list\`, \`dict\`, or \`set\` cannot be a dict key or a set member — \`TypeError: unhashable type: 'list'\`. Convert coordinates to a \`tuple\`, or encode as \`r * cols + c\`. And a tuple is only safely hashable if everything inside it is immutable too.
- **Relying on set ordering.** \`dict\` preserves insertion order (guaranteed since 3.7), so you never need anything special to remember what came first. \`set\` does **not** — iteration order is an implementation detail of the hash layout, and a solution that passes only because a set happened to iterate in a convenient order is a solution that fails on the next input.

### Representative problems

Two Sum · Contains Duplicate · Valid Anagram · Group Anagrams · Product of Array Except Self · Longest Consecutive Sequence · Valid Sudoku`,
    },
    {
      id: "binary-search",
      heading: "Binary Search, Including Binary Search on the Answer",
      markdown: `Binary search is the pattern with the widest gap between "I know what it is" and "I can write it correctly under pressure." Most people can describe it and most people write an off-by-one on the whiteboard. Fix that by memorizing **one** template and deriving everything from it.

### Trigger signals — plain binary search

- The array is **sorted**, or rotated-sorted, or sorted along both axes.
- The constraint is n ≤ 10^9 or the required complexity is O(log n).
- You need first/last occurrence, insertion position, floor/ceiling.

### Trigger signals — binary search on the answer

This is the one that separates people. Reach for it when:

- The problem says **"minimize the maximum"**, **"maximize the minimum"**, or **"find the smallest capacity/speed/size such that it works"**.
- You can't directly compute the answer, but given a *candidate* answer you can **cheaply check whether it's feasible**.
- Feasibility is **monotonic**: if speed 5 works, every speed above 5 works too.

The recipe: define \`feasible(x) -> bool\`, confirm it's monotonic (False…False, True…True), then binary search the *answer space* for the boundary.

### First: know what the standard library already gives you

On a plain sorted list, \`bisect\` is the expected answer and writing a loop instead looks like you don't know the language.

\`\`\`python
import bisect


def search_sorted(nums: list[int], target: int) -> int:
    i = bisect.bisect_left(nums, target)  # first index where nums[i] >= target
    return i if i < len(nums) and nums[i] == target else -1


def count_equal(nums: list[int], target: int) -> int:
    # bisect_right gives the first index where nums[i] > target.
    return bisect.bisect_right(nums, target) - bisect.bisect_left(nums, target)
\`\`\`

\`bisect_left\` is lower bound, \`bisect_right\` is upper bound, both are O(log n), and \`bisect.insort\` inserts while keeping order (O(n) for the shift, so don't build a sorted list one insort at a time). Since 3.10 both take a \`key=\` argument, which covers searching a list of objects by one field.

### Template: the only one you need

When the predicate isn't a plain value comparison — which is every "binary search on the answer" problem — write this.

\`\`\`python
from collections.abc import Callable


def first_true(lo: int, hi: int, pred: Callable[[int], bool]) -> int:
    """
    Returns the smallest x in [lo, hi] with pred(x) True, or hi + 1 if no
    such x exists. pred must be monotonic: False, ..., False, True, ..., True.
    """
    answer = hi + 1
    while lo <= hi:
        mid = (lo + hi) // 2  # // floors; / returns a float and floats can't index
        if pred(mid):
            answer = mid
            hi = mid - 1  # a smaller x might also work
        else:
            lo = mid + 1
    return answer
\`\`\`

Everything else falls out of this. Exact search: \`first_true(0, n - 1, lambda i: nums[i] >= target)\` then check the hit. Last-true: search for first-false and subtract one, or negate the predicate.

If you prefer the classic form, here it is written so the loop invariant is explicit:

\`\`\`python
def binary_search(nums: list[int], target: int) -> int:
    lo = 0
    hi = len(nums) - 1  # invariant: if target exists, it is in [lo, hi]
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
\`\`\`

The rule that keeps you out of infinite loops: with \`hi = len(nums) - 1\` you must use \`lo <= hi\` and both branches must *move past* mid (\`mid + 1\` / \`mid - 1\`). With \`hi = len(nums)\` (exclusive) you use \`lo < hi\` and the shrinking branch is \`hi = mid\`. Never mix the two.

### Template: binary search on the answer (Koko Eating Bananas)

\`\`\`python
def min_eating_speed(piles: list[int], h: int) -> int:
    def hours_needed(speed: int) -> int:
        # Integer ceiling. math.ceil(pile / speed) routes through a float and
        # loses precision once the values exceed 2^53; this never does.
        return sum((pile + speed - 1) // speed for pile in piles)

    # Monotonic: a faster speed never needs more hours.
    return first_true(1, max(piles), lambda speed: hours_needed(speed) <= h)
\`\`\`

The search space is \`1 .. max(piles)\` — speeds, not indices. That reframing *is* the insight. Getting the bounds right matters: lo must be a speed that could conceivably be needed (1), hi must be one that definitely works (eat the biggest pile in one hour).

### Template: rotated sorted array

Each step, one half is guaranteed sorted. Identify it, test whether the target lies inside it, and discard accordingly.

\`\`\`python
def search_rotated(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1

    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid

        if nums[lo] <= nums[mid]:
            # left half [lo, mid] is sorted
            if nums[lo] <= target < nums[mid]:  # chained comparison, evaluated once each
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            # right half [mid, hi] is sorted
            if nums[mid] < target <= nums[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1
\`\`\`

### Template: 2D matrix as a flat sorted array

When each row is sorted and the first element of each row exceeds the last of the previous, treat the matrix as one array of length \`rows * cols\` and convert the index.

\`\`\`python
def search_matrix(matrix: list[list[int]], target: int) -> bool:
    rows, cols = len(matrix), len(matrix[0])
    lo, hi = 0, rows * cols - 1

    while lo <= hi:
        mid = (lo + hi) // 2
        row, col = divmod(mid, cols)  # divmod gives quotient and remainder in one call
        value = matrix[row][col]
        if value == target:
            return True
        if value < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return False
\`\`\`

### Complexity

O(log n) for index search. For binary search on the answer it's **O(log(range) × cost of the feasibility check)** — you must state both factors. Koko is O(n log(max pile)). Space O(1).

### Pitfalls

- **\`/\` where you meant \`//\`.** \`(lo + hi) / 2\` is *always* a float in Python 3, and \`nums[2.0]\` raises \`TypeError: list indices must be integers or slices, not float\`. That one fails loudly, which is lucky; the same slip inside an arithmetic expression just silently converts your exact integer math to float and starts losing precision past 2^53. There is no overflow to guard against — Python ints are unbounded — so \`(lo + hi) // 2\` is safe, and \`lo + (hi - lo) // 2\` is a habit worth keeping only for when you switch languages.
- **Infinite loops** from \`hi = mid\` paired with \`lo <= hi\`. Pick one convention and stick to it for the whole interview.
- **Hand-rolling what \`bisect\` does.** On a plain sorted list, reach for \`bisect_left\`/\`bisect_right\` and save the loop for a real predicate.
- **Searching the wrong space.** In "binary search on the answer" problems, candidates instinctively binary search the input array. Say out loud: "I'm searching over possible answers, not over indices."
- **Not verifying monotonicity.** If \`feasible\` isn't monotonic, binary search is simply wrong, not just slow. Prove it in one sentence before coding.
- **Bad bounds.** \`lo\` must be feasible-or-below, \`hi\` must be definitely-feasible. Off-by-one bounds produce answers that are right on most tests and wrong on the extremes.
- **Duplicates in a rotated array** break the "one half is sorted" test (\`nums[lo] == nums[mid]\` is ambiguous) and degrade to O(n). Mention it if duplicates are allowed.

### Representative problems

Binary Search · Search a 2D Matrix · Koko Eating Bananas · Find Minimum in Rotated Sorted Array · Search in Rotated Sorted Array · Time Based Key-Value Store · Median of Two Sorted Arrays`,
    },
    {
      id: "sorting-greedy-intervals",
      heading: "Sorting, Greedy, and Intervals",
      markdown: `### Trigger signals

- The input is a set of **intervals**, **meetings**, **tasks with deadlines**, or **points on a line**.
- Order doesn't matter to the answer, so you're free to sort.
- You suspect a locally optimal choice is globally optimal — "take the earliest-finishing thing", "always jump as far as you can".
- The answer is a **count** or a **maximum/minimum** rather than an enumeration of every solution.

Greedy is the highest-risk pattern in an interview because it's the easiest to get *plausibly* wrong. Never say "greedy works here" without an exchange argument: *given any optimal solution, I can swap in my greedy choice without making it worse.* If you can't produce that argument in a sentence, it's probably DP.

### The interval sort rule

Which key you sort by determines which problem you can solve:

| Sort by | Solves |
| --- | --- |
| **start** ascending | Merging overlaps, inserting an interval, "can one person attend all meetings" |
| **end** ascending | Maximum non-overlapping set (activity selection), minimum removals |
| starts and ends **separately** | Maximum concurrency — how many rooms/CPUs at once |

Python's sort takes a \`key=\` function, not a two-argument comparator, so "sort by end" is \`key=lambda pair: pair[1]\` or \`key=operator.itemgetter(1)\`. For a multi-key sort, return a tuple: \`key=lambda x: (x[1], -x[0])\` sorts by end ascending then start descending. \`functools.cmp_to_key\` exists for the rare ordering that genuinely isn't expressible as a key, and reaching for it first is a signal you don't know \`key=\`.

### Template: merge overlapping intervals

\`\`\`python
def merge_intervals(intervals: list[list[int]]) -> list[list[int]]:
    if not intervals:
        return []

    ordered = sorted(intervals)  # tuples/lists compare element-wise, so this is by start
    merged: list[list[int]] = [list(ordered[0])]  # copy: we are about to mutate this entry

    for start, end in ordered[1:]:
        last = merged[-1]
        if start <= last[1]:
            last[1] = max(last[1], end)  # max matters: intervals can nest
        else:
            merged.append([start, end])
    return merged
\`\`\`

\`max(last[1], end)\` is the line people skip. Without it, \`[[1, 10], [2, 3]]\` merges to \`[[1, 3]]\`. And \`list(ordered[0])\` is not decoration: \`merged = [ordered[0]]\` stores a reference to the caller's inner list, and \`last[1] = ...\` then rewrites their data.

### Template: maximum non-overlapping set (sort by end)

\`\`\`python
def erase_overlap_intervals(intervals: list[list[int]]) -> int:
    if not intervals:
        return 0

    ordered = sorted(intervals, key=lambda pair: pair[1])  # by end
    kept = 1
    last_end = ordered[0][1]

    for start, end in ordered[1:]:
        if start >= last_end:
            kept += 1
            last_end = end
    return len(ordered) - kept
\`\`\`

The exchange argument: the interval that finishes earliest leaves the most room for everything after it, so there is always an optimal solution containing it. That is the sentence to say.

### Template: maximum concurrency (sweep line)

\`\`\`python
def min_meeting_rooms(intervals: list[list[int]]) -> int:
    starts = sorted(start for start, _ in intervals)
    ends = sorted(end for _, end in intervals)

    rooms = 0
    best = 0
    e = 0

    for start in starts:
        while e < len(ends) and ends[e] <= start:
            rooms -= 1  # a meeting freed a room before this one starts
            e += 1
        rooms += 1
        best = max(best, rooms)
    return best
\`\`\`

Decoupling the start and end arrays is legitimate because you only care about *how many* are active, never *which*. If you do need to know which, use a \`heapq\` min-heap of end times instead.

### Template: greedy reachability

\`\`\`python
def can_jump(nums: list[int]) -> bool:
    reach = 0
    for i, jump in enumerate(nums):
        if i > reach:
            return False  # there's a gap we can never cross
        reach = max(reach, i + jump)
    return True
\`\`\`

### Template: Kadane's algorithm

The bridge between greedy and DP — at each index you greedily decide whether the prefix behind you is worth keeping.

\`\`\`python
def max_sub_array(nums: list[int]) -> int:
    best = current = nums[0]
    for num in nums[1:]:
        current = max(num, current + num)  # start fresh, or extend
        best = max(best, current)
    return best
\`\`\`

### Complexity

Dominated by the sort: **O(n log n)** time. CPython uses Timsort, which is stable and degrades to O(n) on data that's already sorted or reverse-sorted — worth mentioning when the input is "meetings in chronological order". Space is O(n): both \`sorted()\` and \`list.sort()\` can allocate a linear temporary buffer, and \`sorted()\` allocates the copy on top. Pure greedy sweeps with no sort are O(n) / O(1).

### Pitfalls

- **\`list.sort()\` returns \`None\`.** \`ordered = intervals.sort()\` binds \`None\` and the next line raises \`TypeError: 'NoneType' object is not subscriptable\`. \`sort()\` mutates in place and returns nothing; \`sorted()\` returns a new list. Use \`sorted()\` unless you specifically want the in-place version, and remember that in-place also means you just rewrote the caller's data.
- **Copying only the outer list.** \`merged = intervals[:]\` and \`copy.copy(intervals)\` are *shallow*: the inner lists are shared, so mutating \`merged[0][1]\` mutates the input too. Copy each interval you intend to modify, or use \`copy.deepcopy\` and say why you're paying for it.
- **Late binding in a loop.** If you build key functions or callbacks in a loop — \`keys.append(lambda x: x[i])\` — every one of them closes over the *variable* \`i\`, not its value, so they all use the final \`i\`. Bind it explicitly: \`lambda x, i=i: x[i]\`.
- **Touching vs overlapping.** Does \`[1, 2]\` overlap \`[2, 3]\`? Ask. It flips \`<\` to \`<=\` in your merge condition and changes the answer.
- **Sorting by the wrong key.** Sorting by start for activity selection gives a wrong answer that looks right on small examples.
- **Asserting greedy without proof.** If you can't articulate the exchange argument, say "I think greedy works because…, but if that doesn't hold, the DP fallback is…". Naming the fallback is a strong signal.

### Representative problems

Merge Intervals · Insert Interval · Non-overlapping Intervals · Meeting Rooms II · Jump Game · Maximum Subarray · Partition Labels · Gas Station · Hand of Straights`,
    },
    {
      id: "linked-lists",
      heading: "Linked List Manipulation",
      markdown: `Linked list problems are not about cleverness. They are a test of whether you can hold three pointers in your head without dropping one, and whether you reach for the two techniques that eliminate almost all edge cases: **the dummy head** and **reverse-in-place**.

### Trigger signals

- The input is a list and the constraint says **O(1) extra space** — you must rewire pointers, not copy to a list.
- "Reverse", "reorder", "merge", "remove the nth from the end", "detect a cycle", "group in k".
- You need the middle, or you need to compare the first half to the second half.

If the problem allows O(n) space, dumping the nodes into a Python list is often legitimate and much faster to write. Say so, then ask whether they want the O(1) version. Sometimes they'll accept the list.

### Technique 1: the dummy head

Any time the *head itself* might be removed or replaced, allocate a fake node in front of the list. Every node then has a predecessor, so you never need an "is this the head?" branch.

\`\`\`python
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val = val
        self.next = next


def merge_two_lists(a: ListNode | None, b: ListNode | None) -> ListNode | None:
    dummy = ListNode()
    tail = dummy

    while a is not None and b is not None:
        if a.val <= b.val:
            tail.next = a
            a = a.next
        else:
            tail.next = b
            b = b.next
        tail = tail.next

    tail.next = a if a is not None else b  # whichever still has nodes; both None is fine
    return dummy.next
\`\`\`

LeetCode's own Python stub names the field \`next\`, which shadows the builtin \`next()\` *as an attribute only* — \`node.next\` is fine. What is not fine is naming a local variable \`next\`; call it \`nxt\`.

### Technique 2: reverse in place

Three pointers, one loop. Write this from memory; it appears inside half of all list problems (palindrome check, reorder, reverse in k-groups, add two numbers).

\`\`\`python
def reverse_list(head: ListNode | None) -> ListNode | None:
    prev: ListNode | None = None
    curr = head

    while curr is not None:
        nxt = curr.next  # save before you clobber it
        curr.next = prev
        prev = curr
        curr = nxt
    return prev  # prev is the new head
\`\`\`

The \`nxt = curr.next\` line is the entire trick: you're about to overwrite \`curr.next\`, so you have to stash it first or you lose the rest of the list.

Python can collapse the body to one line, because the whole right-hand side of a tuple assignment is evaluated *before* anything is rebound:

\`\`\`python
def reverse_list_terse(head: ListNode | None) -> ListNode | None:
    prev, curr = None, head
    while curr is not None:
        curr.next, prev, curr = prev, curr, curr.next
    return prev
\`\`\`

It's correct, and it's a nice thing to show — but only after you've written the explicit version and can explain the evaluation order out loud. Terse code you can't justify reads as luck.

### Technique 3: gap pointers

To find the nth node from the end in one pass, put two pointers \`n + 1\` apart and walk them together until the leader falls off.

\`\`\`python
def remove_nth_from_end(head: ListNode | None, n: int) -> ListNode | None:
    dummy = ListNode(0, head)
    lead: ListNode | None = dummy
    trail = dummy

    for _ in range(n + 1):  # open a gap of n + 1
        lead = lead.next
    while lead is not None:
        lead = lead.next
        trail = trail.next

    trail.next = trail.next.next  # trail sits just before the target
    return dummy.next
\`\`\`

The dummy is what makes "remove the head" work without a special case, and \`range(n + 1)\` (not \`range(n)\`) is what puts \`trail\` on the *predecessor*. Trace it on a two-node list before you claim it works.

### Composite example: reorder list

Most hard list problems are three easy techniques stacked. Reorder List = find the middle, reverse the second half, interleave.

\`\`\`python
def reorder_list(head: ListNode | None) -> None:
    if head is None or head.next is None:
        return

    # 1. Find the middle.
    slow = head
    fast: ListNode | None = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next

    # 2. Split and reverse the second half.
    second = slow.next
    slow.next = None  # cut, or step 3 loops forever
    prev: ListNode | None = None
    while second is not None:
        nxt = second.next
        second.next = prev
        prev = second
        second = nxt

    # 3. Interleave the two halves.
    first: ListNode | None = head
    back: ListNode | None = prev
    while back is not None:
        first_next = first.next
        back_next = back.next
        first.next = back
        back.next = first_next
        first = first_next
        back = back_next
\`\`\`

Announcing that decomposition before you write anything — "this is three sub-problems I already know" — is worth more than the code.

### Complexity

O(n) time for all of the above; O(1) space for pointer rewiring, O(n) if you copy the nodes into a list or recurse (the call stack counts). A recursive list reversal is O(n) stack — and in CPython that isn't just a space note, it's a correctness note: the default recursion limit is about 1000 frames, so recursing over a 10^5-node list raises \`RecursionError\` before it does anything useful. Write list algorithms iteratively and say why.

### Pitfalls

- **Losing the rest of the list.** Always save \`curr.next\` before you overwrite it.
- **Not cutting the list when you split.** In Reorder List, forgetting \`slow.next = None\` leaves a cycle and your interleave loop never terminates.
- **Off-by-one on the middle.** For even lengths, \`slow\` lands on the *second* middle with the loop above. Decide which one you need and check it on a 4-node list.
- **Missing base cases.** Empty list (\`head is None\`), single node, and (for k-group problems) a final partial group. Every list problem should start with "let me handle \`None\` and single-node".
- **\`is\` vs \`==\` on nodes.** Cycle detection compares *identity* — \`slow is fast\`. \`==\` happens to mean the same thing for a class with no \`__eq__\`, but relying on that is relying on a default you didn't choose.
- **Shadowing builtins.** \`next\`, \`list\`, \`sum\`, \`min\`, \`max\`, \`id\`, and \`input\` are all builtins that candidates cheerfully reassign. It runs, right up until the line where you actually wanted the builtin.

### Representative problems

Reverse Linked List · Merge Two Sorted Lists · Reorder List · Remove Nth Node From End of List · Copy List with Random Pointer · Merge K Sorted Lists · Reverse Nodes in k-Group · LRU Cache`,
    },
    {
      id: "stacks-and-monotonic-stack",
      heading: "Stacks and the Monotonic Stack",
      markdown: `### Trigger signals — plain stack

- **Matching and nesting**: parentheses, tags, nested encodings, expression evaluation.
- **Undo / most recent**: "the last unmatched…", "reverse Polish notation".
- You want to convert a recursive traversal to iterative.

### Trigger signals — monotonic stack

This is the pattern most interns have never heard of and it shows up constantly. Reach for it when:

- "**Next greater element**", "next smaller", "previous greater", "days until a warmer temperature".
- "**Span**" or "how far can this element extend before something bigger/smaller stops it" — histograms, rainwater, stock spans.
- The brute force is "for each i, scan right until I find something larger" — O(n^2) with lots of repeated scanning.

The invariant: the stack holds indices whose values are monotonically increasing (or decreasing). When a new element violates the order, everything it violates has just found its answer, so you pop and resolve.

A Python list *is* the stack: \`append\` is amortized O(1), \`pop()\` from the end is O(1), \`stack[-1]\` is the top. Never use \`pop(0)\` — that's the queue end, and it's O(n).

### Template: plain stack

\`\`\`python
def is_valid(s: str) -> bool:
    closers = {")": "(", "]": "[", "}": "{"}
    stack: list[str] = []

    for ch in s:
        if ch in "([{":
            stack.append(ch)
        elif not stack or stack.pop() != closers[ch]:
            return False  # unmatched closer, or a closer with nothing open
    return not stack  # leftovers mean unclosed brackets
\`\`\`

Two things carry their weight here. \`not stack\` is the Pythonic empty check — an empty list is falsy — and it has to come *first* in the \`or\`, because \`stack.pop()\` on an empty list raises \`IndexError\` rather than handing you a null. \`and\`/\`or\` short-circuit, so the guard works. And the final \`return not stack\` is the check people forget: \`"((("\` has no mismatches, but it isn't valid.

### Template: stack carrying auxiliary state (Min Stack)

When you need O(1) access to an aggregate over the stack, push the aggregate alongside the value.

\`\`\`python
class MinStack:
    def __init__(self) -> None:
        self._values: list[int] = []
        self._mins: list[int] = []

    def push(self, val: int) -> None:
        self._values.append(val)
        self._mins.append(val if not self._mins else min(val, self._mins[-1]))

    def pop(self) -> None:
        self._values.pop()
        self._mins.pop()

    def top(self) -> int:
        return self._values[-1]

    def get_min(self) -> int:
        return self._mins[-1]
\`\`\`

### Template: monotonic stack (next greater element)

\`\`\`python
def daily_temperatures(temps: list[int]) -> list[int]:
    answer = [0] * len(temps)
    stack: list[int] = []  # indices; their temperatures strictly decrease

    for i, temp in enumerate(temps):
        while stack and temps[stack[-1]] < temp:
            j = stack.pop()
            answer[j] = i - j  # i is the first day warmer than day j
        stack.append(i)
    return answer  # anything still on the stack never found a warmer day: 0
\`\`\`

Store **indices**, not values, so you can compute distances. That's the single most useful habit in this pattern.

### Template: monotonic stack with sentinel (Largest Rectangle in Histogram)

\`\`\`python
def largest_rectangle_area(heights: list[int]) -> int:
    stack: list[int] = []  # indices with increasing heights
    best = 0

    for i in range(len(heights) + 1):
        current = 0 if i == len(heights) else heights[i]  # sentinel drains the stack
        while stack and heights[stack[-1]] >= current:
            height = heights[stack.pop()]
            left_boundary = stack[-1] if stack else -1
            best = max(best, height * (i - left_boundary - 1))
        stack.append(i)
    return best
\`\`\`

Two ideas worth stating aloud: the sentinel iteration at \`i == len(heights)\` forces every remaining bar to be resolved, and \`left_boundary\` is whatever is *below* the popped bar on the stack — which is by construction the nearest shorter bar to its left. Note \`stack[-1] if stack else -1\`: on an empty list, \`stack[-1]\` raises \`IndexError\`, so the guard is doing real work.

### Template: monotonic deque (Sliding Window Maximum)

A window's maximum can't be maintained with a plain stack, because the max can leave the window. A deque holding indices in decreasing value order handles both ends.

\`\`\`python
from collections import deque


def max_sliding_window(nums: list[int], k: int) -> list[int]:
    window: deque[int] = deque()  # indices, values decreasing
    out: list[int] = []

    for i, num in enumerate(nums):
        while window and nums[window[-1]] <= num:
            window.pop()  # smaller values can never be the max again
        window.append(i)

        if window[0] <= i - k:
            window.popleft()  # front slid out of the window

        if i >= k - 1:
            out.append(nums[window[0]])
    return out
\`\`\`

\`collections.deque\` is a doubly linked list of blocks: \`append\`, \`appendleft\`, \`pop\`, and \`popleft\` are all O(1). This is exactly why you don't fake a queue with a list — \`list.pop(0)\` shifts every remaining element down, so it's O(n) and it turns this O(n) algorithm into O(n^2). The tradeoff is that \`deque\` indexing in the *middle* is O(n); at the ends (\`window[0]\`, \`window[-1]\`) it's O(1), which is all this needs.

### Complexity

O(n) for every template here, even though there's a nested \`while\`. The accounting argument: **each index is pushed at most once and popped at most once**, so total stack operations are bounded by 2n. Say exactly that when asked — it's the same amortized reasoning as sliding window.

Space is O(n) worst case (a strictly increasing input never pops).

### Pitfalls

- **Pushing values instead of indices**, then being unable to compute a distance.
- **\`>\` vs \`>=\` in the pop condition.** With duplicates, one choice gives you the *nearest* boundary and the other the *farthest*. For Largest Rectangle either works (equal bars resolve each other correctly), but for "count of distinct next-greater" problems it changes the answer. Decide and justify.
- **Forgetting the drain.** Elements left on the stack at the end still need their default answer, or you need a sentinel pass.
- **\`list.pop(0)\` as a queue.** O(n) per call, because every remaining element shifts down. Use \`collections.deque\`.
- **Indexing an empty stack.** \`stack[-1]\` and \`stack.pop()\` both raise \`IndexError\` on an empty list. Python fails loudly here rather than handing you a null that compares false against everything, which is a gift — but only if you write the guard: \`while stack and ...\`.

### Representative problems

Valid Parentheses · Min Stack · Evaluate Reverse Polish Notation · Daily Temperatures · Car Fleet · Largest Rectangle in Histogram · Sliding Window Maximum · Trapping Rain Water`,
    },
    {
      id: "heaps-and-top-k",
      heading: "Heaps and Top-K",
      markdown: `### Trigger signals

- "**Top k**", "**k largest/smallest**", "**k closest**", "the k most frequent".
- "**Median of a stream**", "running statistics", anything where data arrives incrementally and you must answer *now*.
- **Scheduling**: repeatedly take the largest/most-urgent item, modify it, put it back.
- Merging **k sorted** sequences.
- Dijkstra and other "always expand the cheapest frontier node" searches.

The key distinction from sorting: a heap gives you the *extreme* element in O(1) and lets you re-establish order in O(log n) after an insert or removal. If you need everything in order, sort. If you need one end, repeatedly, on changing data, use a heap.

### \`heapq\` is a min-heap over a plain list

Python's heap is not a class. \`heapq\` is a module of functions that maintain the heap invariant on an ordinary list, which means \`len(heap)\` is the size and \`heap[0]\` is the peek. Every one of these is worth having in your fingers:

\`\`\`python
import heapq

heap: list[int] = []
heapq.heappush(heap, 5)          # O(log n)
heapq.heappush(heap, 1)
smallest = heap[0]               # peek, O(1) — no function call needed
smallest = heapq.heappop(heap)   # O(log n)

values = [5, 1, 9, 3]
heapq.heapify(values)            # O(n) in place, NOT O(n log n)

# Push-then-pop in one operation, cheaper than doing both:
heapq.heappushpop(heap, 4)       # push 4, then pop the min
heapq.heapreplace(heap, 4)       # pop the min, then push 4 (heap must be non-empty)

# One-shot top-k over an existing iterable, done in C:
heapq.nlargest(3, values)
heapq.nsmallest(3, values)
\`\`\`

**There is no max-heap.** The universal fix is to negate on the way in and on the way out:

\`\`\`python
import heapq


def three_largest(values: list[int]) -> list[int]:
    max_heap = [-v for v in values]  # negate
    heapq.heapify(max_heap)
    return [-heapq.heappop(max_heap) for _ in range(min(3, len(max_heap)))]
\`\`\`

Negation only works on numbers. For anything else — strings, objects — push a tuple whose first element is a numeric key you can negate, or wrap the item in a class that defines \`__lt__\` the way you want.

**There is no \`key=\` parameter either.** Encode the ordering into what you push. \`heapq\` compares tuples element by element, which is exactly what you want for \`(priority, item)\` — until two priorities tie and Python falls through to comparing the items themselves, which raises \`TypeError: '<' not supported between instances of 'dict' and 'dict'\`. Insert a monotonic counter as a tiebreaker, or make the payload explicitly non-comparable:

\`\`\`python
import heapq
from dataclasses import dataclass, field
from itertools import count


@dataclass(order=True)
class Task:
    priority: int
    name: str = field(compare=False)  # excluded, so equal priorities never compare names


def drain_by_priority(tasks: list[tuple[int, str]]) -> list[str]:
    heap: list[tuple[int, int, str]] = []
    tiebreaker = count()  # 0, 1, 2, ... keeps every tuple comparable and stable

    for priority, name in tasks:
        heapq.heappush(heap, (priority, next(tiebreaker), name))

    out: list[str] = []
    while heap:
        _, _, name = heapq.heappop(heap)
        out.append(name)
    return out
\`\`\`

Interviewers know \`heapq\` exists, so unlike in a language without one, the interesting question isn't "can you build a heap" — it's "do you know its sharp edges." Naming the missing max-heap and the missing \`key=\` before you hit them reads as experience.

### Template: top-k with a bounded heap

The counterintuitive move: to find the k **largest**, keep a **min**-heap of size k. The smallest of your current best-k sits at the top, ready to be evicted.

\`\`\`python
import heapq
from collections import Counter


def top_k_frequent(nums: list[int], k: int) -> list[int]:
    freq = Counter(nums)

    heap: list[tuple[int, int]] = []  # (count, value) — count first so it sorts on count
    for value, cnt in freq.items():
        heapq.heappush(heap, (cnt, value))
        if len(heap) > k:
            heapq.heappop(heap)  # evict the weakest of the current top-k

    return [value for _, value in sorted(heap, reverse=True)]


def top_k_frequent_stdlib(nums: list[int], k: int) -> list[int]:
    """Counter.most_common(k) runs exactly this bounded heap, in C."""
    return [value for value, _ in Counter(nums).most_common(k)]
\`\`\`

Also know the **bucket sort** alternative for this specific problem: counts are bounded by \`n\`, so you can bucket by frequency and read the buckets from the top for O(n) total. Offering all three — bounded heap, \`most_common\`, bucket sort — and naming the tradeoff (bucket sort is O(n) time but O(n) extra buckets, and it only works because the key is a bounded integer) is a strong-hire moment.

### Template: two heaps for a running median

Max-heap for the lower half, min-heap for the upper half, kept balanced within one element. The median is either the top of the larger heap or the average of both tops.

\`\`\`python
import heapq


class MedianFinder:
    def __init__(self) -> None:
        self._lower: list[int] = []  # max-heap of the small half, stored negated
        self._upper: list[int] = []  # min-heap of the large half

    def add_num(self, num: int) -> None:
        if not self._lower or num <= -self._lower[0]:
            heapq.heappush(self._lower, -num)
        else:
            heapq.heappush(self._upper, num)

        # Rebalance so len(lower) is equal to or one greater than len(upper).
        if len(self._lower) > len(self._upper) + 1:
            heapq.heappush(self._upper, -heapq.heappop(self._lower))
        elif len(self._upper) > len(self._lower):
            heapq.heappush(self._lower, -heapq.heappop(self._upper))

    def find_median(self) -> float:
        if len(self._lower) > len(self._upper):
            return float(-self._lower[0])
        return (-self._lower[0] + self._upper[0]) / 2
\`\`\`

The negation appears twice per value — once pushing in, once reading out — and every \`-\` is load-bearing. Point at \`-self._lower[0]\` when you explain it; that single expression is "the largest element of the small half."

### Complexity

| Operation | Cost |
| --- | --- |
| \`heappush\` / \`heappop\` | O(log n) |
| \`heap[0]\` (peek) | O(1) |
| \`heapify\` on n items | O(n), not O(n log n) |
| \`heappushpop\` / \`heapreplace\` | O(log n), one sift instead of two |
| Top-k with a size-k heap | O(n log k) time, O(k) space |
| \`heapq.nlargest(k, xs)\` | O(n log k) — same algorithm, C loop |
| Top-k by full sort | O(n log n) time |
| Merge k sorted lists of total N nodes | O(N log k), which is what \`heapq.merge\` does |

When k is small relative to n, \`n log k\` beats \`n log n\` meaningfully, and the O(k) space matters if the stream doesn't fit in memory. That's the argument for a heap over sorting — make it explicitly rather than asserting "heaps are faster".

### Pitfalls

- **Wrong heap polarity.** k largest wants a min-heap; k smallest wants a max-heap. Getting it backwards works on the first test case and fails on the second.
- **Forgetting that there is no max-heap.** Negate the key on the way in *and* on the way out. Negating once and forgetting the other half produces answers that are the right shape and the wrong sign.
- **Assuming ordered iteration.** The list behind a heap is *not* sorted beyond the root invariant. Only \`heap[0]\` is meaningful; printing \`heap\` is not the answer, and you must pop repeatedly (or \`sorted(heap)\`) to get order.
- **Unorderable ties.** \`heappush(heap, (dist, node))\` where \`node\` is a list, dict, or custom class explodes with \`TypeError: '<' not supported\` the first time two distances tie. Add \`itertools.count()\` as the second tuple element, or use \`@dataclass(order=True)\` with \`field(compare=False)\`.
- **Not handling ties in the answer.** "K most frequent" with ties usually accepts any valid answer — confirm rather than over-engineering a tiebreak.
- **Reaching for a heap when a sort or quickselect is better.** If the data is static and you need all of it ordered, sort. If you need only the kth element once, quickselect is O(n) average.
- **Mutating heap entries in place.** Changing a value already inside the heap breaks the invariant, and \`heapq\` has no \`decrease-key\`. Push a new entry and skip stale ones on pop (this is exactly what Dijkstra does).

### Representative problems

Kth Largest Element in an Array · Kth Largest Element in a Stream · K Closest Points to Origin · Top K Frequent Elements · Task Scheduler · Find Median from Data Stream · Merge K Sorted Lists`,
    },
    {
      id: "trees",
      heading: "Trees: DFS Traversals, BFS Levels, BSTs, and Tries",
      markdown: `Almost every binary tree problem is one of three shapes. Identify the shape and the code writes itself.

1. **Top-down DFS** — carry information *into* the recursion (a path sum so far, a depth, valid value bounds).
2. **Bottom-up DFS** — return information *out of* the recursion and combine children's answers at each node. This is the one people underuse; "compute something for each subtree, combine at the parent" solves diameter, balance, LCA, and max path sum.
3. **BFS by level** — anything phrased "level by level", "right side view", "minimum depth", "zigzag".

\`\`\`python
class TreeNode:
    def __init__(
        self,
        val: int = 0,
        left: "TreeNode | None" = None,
        right: "TreeNode | None" = None,
    ) -> None:
        self.val = val
        self.left = left
        self.right = right
\`\`\`

### Trigger signals

- The word **tree**, **subtree**, **ancestor**, **depth**, **path**.
- **BST specifically:** the problem mentions sorted order, kth smallest, search, or "valid BST". BST means *use the ordering* — if your solution would work on any binary tree, you've left the log factor on the table.
- **Levels:** "level order", "each row", "closest to the root", "width".
- **Trie:** the input is a set of **words** and the queries are about **prefixes**.

### Template: the three DFS traversals

\`\`\`python
def inorder(node: TreeNode | None, out: list[int] | None = None) -> list[int]:
    if out is None:
        out = []  # see below: never put a mutable default in the signature
    if node is None:
        return out
    inorder(node.left, out)
    out.append(node.val)  # preorder: append before the recursion; postorder: after both
    inorder(node.right, out)
    return out
\`\`\`

The \`out=None\` dance is not decoration, and getting it wrong is the most famous footgun in the language. **A default argument is evaluated once, when the function is defined**, not on each call — so \`def inorder(node, out=[])\` creates a single list that is shared by every call for the lifetime of the program. The first call returns the right answer; the second returns the first call's values with its own appended. Mutable defaults (\`[]\`, \`{}\`, \`set()\`, a \`Counter\`) always become \`None\` plus a guard.

Know what each traversal is *for*, not just the order: **preorder** serializes a tree (root first, so you can rebuild top-down), **inorder on a BST yields sorted values**, **postorder** processes children before parents (deletion, and any bottom-up aggregation).

The iterative inorder is worth memorizing because it's the basis of Kth Smallest in a BST and of the BST iterator:

\`\`\`python
def inorder_iterative(root: TreeNode | None) -> list[int]:
    out: list[int] = []
    stack: list[TreeNode] = []
    curr = root

    while curr is not None or stack:
        while curr is not None:
            stack.append(curr)
            curr = curr.left  # dive left, remembering the way back
        curr = stack.pop()
        out.append(curr.val)
        curr = curr.right
    return out
\`\`\`

### Template: bottom-up DFS with a captured accumulator

The pattern: the recursive function returns one thing (height), while an enclosing variable accumulates a different thing (the best answer seen anywhere).

\`\`\`python
def diameter_of_binary_tree(root: TreeNode | None) -> int:
    best = 0

    def height(node: TreeNode | None) -> int:
        nonlocal best  # without this, assigning to best makes a fresh local and returns 0
        if node is None:
            return 0
        left = height(node.left)
        right = height(node.right)
        best = max(best, left + right)  # path through this node
        return 1 + max(left, right)  # height reported to the parent

    height(root)
    return best
\`\`\`

\`nonlocal\` is the line that trips people. Python decides at compile time that any name *assigned* inside a function is local to it, so \`best = max(...)\` without the declaration creates a brand-new local, shadows the outer \`best\`, and throws the result away when the frame exits — you get 0 and no error. (Reading an outer name works fine, which is why appending to an outer *list* needs no declaration but rebinding an outer *int* does. That asymmetry is worth saying out loud; it's the whole rule.)

Binary Tree Maximum Path Sum is the same skeleton with one extra rule — a child contributes only if its contribution is positive:

\`\`\`python
def max_path_sum(root: TreeNode | None) -> int:
    if root is None:
        return 0
    best = root.val  # a single node is always a valid path, so no sentinel needed

    def gain(node: TreeNode | None) -> int:
        nonlocal best
        if node is None:
            return 0
        left = max(gain(node.left), 0)  # drop negative branches
        right = max(gain(node.right), 0)
        best = max(best, node.val + left + right)
        return node.val + max(left, right)  # a path can only use one side going up

    gain(root)
    return best
\`\`\`

Seeding \`best\` with \`root.val\` sidesteps a small Python annoyance: there is no \`Integer.MIN_VALUE\` to reach for, because ints are unbounded. The sentinel would have to be \`float("-inf")\`, which compares correctly against ints but quietly turns your integer answer into a float. Seed with a value you know is achievable instead.

The line to say out loud: *"a path through this node can use both children, but the value I return upward can only use one, because the parent needs a single chain."* That distinction is the entire problem.

### Template: BFS by level

\`\`\`python
from collections import deque


def level_order(root: TreeNode | None) -> list[list[int]]:
    if root is None:
        return []

    levels: list[list[int]] = []
    queue: deque[TreeNode] = deque([root])

    while queue:
        values: list[int] = []
        for _ in range(len(queue)):  # snapshot the count: the loop appends to the queue
            node = queue.popleft()
            values.append(node.val)
            if node.left is not None:
                queue.append(node.left)
            if node.right is not None:
                queue.append(node.right)
        levels.append(values)
    return levels
\`\`\`

\`deque.popleft()\` is O(1). \`list.pop(0)\` is O(n), because every remaining element shifts down one slot — using a list here would silently make this O(n^2). Snapshotting \`len(queue)\` in the \`range(...)\` before the inner loop is what gives you level boundaries: \`range\` evaluates its argument once, so the nodes you append during the loop land in the *next* level. Right Side View is this function taking the last element of each \`values\`.

### Template: BST validation with bounds

The instinct is to compare each node to its immediate children. That's wrong: a node deep in the left subtree can still violate the root's bound. Carry the interval down.

\`\`\`python
def is_valid_bst(root: TreeNode | None) -> bool:
    def check(node: TreeNode | None, low: float, high: float) -> bool:
        if node is None:
            return True
        if not low < node.val < high:  # chained comparison, read exactly as written
            return False
        return check(node.left, low, node.val) and check(node.right, node.val, high)

    return check(root, float("-inf"), float("inf"))
\`\`\`

### Using BST ordering

The two moves that separate a BST solution from a generic tree solution:

\`\`\`python
def lowest_common_ancestor(root: TreeNode, p: int, q: int) -> TreeNode:
    """LCA in a BST: descend while both targets are on the same side. O(h), not O(n)."""
    node = root
    while True:
        if p < node.val and q < node.val:
            node = node.left
        elif p > node.val and q > node.val:
            node = node.right
        else:
            return node  # the split point, or one of the targets


def kth_smallest(root: TreeNode | None, k: int) -> int:
    """Inorder is sorted, so stop as soon as you've counted k."""
    stack: list[TreeNode] = []
    curr = root
    remaining = k

    while curr is not None or stack:
        while curr is not None:
            stack.append(curr)
            curr = curr.left
        curr = stack.pop()
        remaining -= 1
        if remaining == 0:
            return curr.val
        curr = curr.right
    return -1
\`\`\`

### Template: trie

A trie moves the cost of lookup from "size of the dictionary" to "length of the key", and it's the only structure that makes *prefix* queries cheap.

\`\`\`python
class TrieNode:
    __slots__ = ("children", "is_word")

    def __init__(self) -> None:
        self.children: dict[str, TrieNode] = {}
        self.is_word = False


class Trie:
    def __init__(self) -> None:
        self._root = TrieNode()

    def insert(self, word: str) -> None:
        node = self._root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.is_word = True

    def _walk(self, prefix: str) -> TrieNode | None:
        node = self._root
        for ch in prefix:
            nxt = node.children.get(ch)
            if nxt is None:
                return None
            node = nxt
        return node

    def search(self, word: str) -> bool:
        node = self._walk(word)
        return node is not None and node.is_word

    def starts_with(self, prefix: str) -> bool:
        return self._walk(prefix) is not None
\`\`\`

Two Python details in there. \`node.children.setdefault(ch, TrieNode())\` reads more tersely than the \`if ch not in\` pair, but it constructs a \`TrieNode\` on *every* character whether or not one is needed and throws most of them away — fine for a toy, wasteful on a large dictionary. And \`__slots__\` drops the per-instance \`__dict__\`, which matters here because a trie over a real word list allocates hundreds of thousands of nodes; mentioning it is a cheap way to show you think about memory.

The \`is_word\` flag is what distinguishes "this is a stored word" from "this is a prefix of one". Wildcard search (\`.\` matching any character) is the same walk with a branch: on \`.\`, recurse into every child.

### Complexity

| Operation | Cost |
| --- | --- |
| Tree DFS / BFS | O(n) time |
| DFS recursion space | O(h) — O(log n) balanced, **O(n) skewed** |
| BFS space | O(w), the maximum level width — up to n/2 for a full tree |
| BST search / insert / LCA | O(h): O(log n) balanced, O(n) degenerate |
| Trie insert / search / starts_with | O(L) in the key length, independent of dictionary size |
| Trie space | O(total characters × alphabet branching) |

Always state the recursion stack as part of space complexity. "O(1) extra space" is wrong for a recursive traversal — and in CPython the stack is a correctness concern, not just a space one, because the interpreter caps recursion at roughly 1000 frames.

### Pitfalls

- **Mutable default arguments.** \`def dfs(node, path=[])\` shares one list across every call to \`dfs\`, forever. Always \`path=None\` plus \`if path is None: path = []\`.
- **Forgetting \`nonlocal\`** when the recursion accumulates into an enclosing scalar. It fails silently with a plausible-looking zero.
- **Comparing only to immediate children** when validating a BST.
- **Assuming a BST is balanced.** Unless the problem guarantees it, h can be n. Say "O(h), which is O(log n) if balanced and O(n) in the worst case".
- **Recursion depth on a skewed tree.** A 10^5-node degenerate tree raises \`RecursionError\` at about a thousand levels. Convert to an explicit stack; \`sys.setrecursionlimit\` is a band-aid that trades a clean exception for a C-stack segfault, and saying so is better than using it.
- **\`list.pop(0)\` on the BFS queue** — O(n) per call. \`collections.deque\`, always.
- **Leaf-vs-\`None\` confusion.** \`node.left is None and node.right is None\` (a leaf) is not \`node is None\` (an empty subtree). This is exactly why Minimum Depth trips people up: a node with one child is not a leaf.
- **Mutating a shared path list without undoing.** \`path.append(...)\` must be paired with \`path.pop()\`, and you must copy (\`path[:]\` or \`list(path)\`) when recording a result. Note that copy is *shallow*: if the elements are themselves lists you keep mutating, you need \`copy.deepcopy\`.
- **Using a trie when a \`set\` would do.** If there are no prefix queries, a set is simpler, faster, and less memory. Choosing a trie you don't need is a design mistake, not a flourish.

### Representative problems

Invert Binary Tree · Diameter of Binary Tree · Binary Tree Level Order Traversal · Binary Tree Right Side View · Validate Binary Search Tree · Kth Smallest Element in a BST · Binary Tree Maximum Path Sum · Serialize and Deserialize Binary Tree · Implement Trie (Prefix Tree) · Design Add and Search Words Data Structure`,
    },
    {
      id: "backtracking",
      heading: "Backtracking",
      markdown: `### Trigger signals

- "**All** …", "**every** …", "generate/return **all possible** …" — you must enumerate, not count. (If it says *count*, think DP first; enumeration is exponential, counting often isn't.)
- **Small constraints**: n ≤ 20 for subsets, n ≤ 12 for permutations, an 8×8 board. Tiny bounds are the giveaway that exponential is expected.
- The answer is a **sequence of choices**: pick or skip, place or don't place, which character next.

### The universal skeleton

Every backtracking solution is the same three moves wrapped around a loop: **choose, explore, un-choose**.

\`\`\`python
def subsets(nums: list[int]) -> list[list[int]]:
    out: list[list[int]] = []
    path: list[int] = []

    def backtrack(start: int) -> None:
        out.append(path[:])  # copy! path keeps mutating underneath you

        for i in range(start, len(nums)):
            path.append(nums[i])  # choose
            backtrack(i + 1)  # explore, from i + 1 so we never look backwards
            path.pop()  # un-choose

    backtrack(0)
    return out
\`\`\`

Note what the nested function does *not* need: \`out\` and \`path\` are only ever mutated, never rebound, so no \`nonlocal\` is required. You'd need it only if you assigned \`out = ...\` inside.

The \`start\` parameter is what makes this generate *combinations* (order-insensitive) rather than permutations. Change \`i + 1\` to \`i\` and the same element can be reused — that's Combination Sum:

\`\`\`python
def combination_sum(candidates: list[int], target: int) -> list[list[int]]:
    out: list[list[int]] = []
    path: list[int] = []

    def backtrack(start: int, remaining: int) -> None:
        if remaining == 0:
            out.append(path[:])
            return
        if remaining < 0:
            return  # prune: overshooting can never recover

        for i in range(start, len(candidates)):
            path.append(candidates[i])
            backtrack(i, remaining - candidates[i])  # i, not i + 1: reuse allowed
            path.pop()

    backtrack(0, target)
    return out
\`\`\`

### Template: permutations (used-set instead of a start index)

Permutations care about order, so every unused element is a candidate at every level.

\`\`\`python
def permute(nums: list[int]) -> list[list[int]]:
    out: list[list[int]] = []
    path: list[int] = []
    used = [False] * len(nums)

    def backtrack() -> None:
        if len(path) == len(nums):
            out.append(path[:])
            return
        for i, num in enumerate(nums):
            if used[i]:
                continue
            used[i] = True
            path.append(num)
            backtrack()
            path.pop()
            used[i] = False  # both undos, in reverse order

    backtrack()
    return out
\`\`\`

\`itertools.permutations(nums)\` produces exactly this, in C, and \`itertools.combinations\` / \`combinations_with_replacement\` / \`product\` cover most of the rest. Say that first — "in real code I'd use \`itertools\`" — then write the loop, because what's being tested is whether you can build the recursion tree yourself.

### Handling duplicates

When the input contains duplicates and you must not emit duplicate results: **sort first**, then skip a candidate that equals its predecessor *at the same decision level*.

\`\`\`python
def subsets_with_dup(nums: list[int]) -> list[list[int]]:
    ordered = sorted(nums)
    out: list[list[int]] = []
    path: list[int] = []

    def backtrack(start: int) -> None:
        out.append(path[:])
        for i in range(start, len(ordered)):
            if i > start and ordered[i] == ordered[i - 1]:
                continue  # same level, same value
            path.append(ordered[i])
            backtrack(i + 1)
            path.pop()

    backtrack(0)
    return out
\`\`\`

\`i > start\` (not \`i > 0\`) is the crux: you're skipping repeats among *siblings*, not among ancestors. Getting this wrong drops legitimate answers like \`[1, 1]\`.

### Template: backtracking on a grid

Mark the cell as visited by mutating it, then restore it. This avoids allocating a visited set per path.

\`\`\`python
def exist(board: list[list[str]], word: str) -> bool:
    rows, cols = len(board), len(board[0])

    def dfs(r: int, c: int, i: int) -> bool:
        if i == len(word):
            return True
        if not (0 <= r < rows and 0 <= c < cols):
            return False  # must come before indexing: negative indices do NOT raise
        if board[r][c] != word[i]:
            return False

        saved = board[r][c]
        board[r][c] = "#"  # mark visited for this path only
        found = (
            dfs(r + 1, c, i + 1)
            or dfs(r - 1, c, i + 1)
            or dfs(r, c + 1, i + 1)
            or dfs(r, c - 1, i + 1)
        )
        board[r][c] = saved  # restore on the way out

        return found

    return any(dfs(r, c, 0) for r in range(rows) for c in range(cols))
\`\`\`

Note the ordering: the \`i == len(word)\` success check comes *before* the bounds check, so a word ending on the last cell still succeeds. And \`any(...)\` over a generator short-circuits — it stops calling \`dfs\` the moment one returns \`True\`, exactly like the explicit double loop with an early return.

### Pruning is the whole game

Raw enumeration is exponential and always will be. What earns points is showing you prune:

- **Feasibility pruning:** return early when the partial solution can no longer succeed (\`remaining < 0\` above).
- **Bound pruning:** sort candidates and \`break\` instead of \`continue\` once they're too large.
- **Symmetry pruning:** the duplicate-skip above; N-Queens' column/diagonal sets.
- **Constraint propagation:** N-Queens tracking attacked columns and diagonals in sets, so validity is O(1) instead of O(n).

Say which prunings you're applying and roughly what they buy. "Worst case is still O(2^n), but the \`remaining < 0\` cut means we never explore past the target, which in practice kills most of the tree."

### Complexity

Count it as **(number of nodes in the recursion tree) × (work per node)**:

| Problem shape | Time | Space |
| --- | --- | --- |
| Subsets | O(n · 2^n) — 2^n subsets, O(n) to copy each | O(n) recursion + O(n · 2^n) output |
| Permutations | O(n · n!) | O(n) recursion |
| Combination Sum | O(n^(target/min)) | O(target/min) depth |
| Word Search | O(rows · cols · 4^L) | O(L) recursion |
| N-Queens | O(n!) with pruning | O(n) |

Distinguish auxiliary space (recursion depth) from output space, and say which you're quoting. Backtracking depth is bounded by the problem size here — n ≤ 20 — so CPython's 1000-frame recursion limit is never the binding constraint in this pattern, unlike in DP over a long string.

### Pitfalls

- **\`out.append(path)\` instead of \`out.append(path[:])\`.** You end up with a list of references to the same list, which by the end is empty. This is the number-one backtracking bug and it produces spectacularly confusing output. \`path[:]\`, \`list(path)\`, and \`copy.copy(path)\` are equivalent here — but all three are *shallow*, so if \`path\` holds lists (Palindrome Partitioning building lists of lists), the inner objects are still shared and you may need \`copy.deepcopy\`.
- **Forgetting to un-choose**, or un-choosing in the wrong order when there are two pieces of state.
- **\`i > 0\` instead of \`i > start\`** in duplicate skipping.
- **Indexing a grid before bounds-checking.** \`board[-1][c]\` is perfectly legal Python — it reads the *last* row. A missing bounds check doesn't raise; it silently wraps around and returns a plausible wrong answer, which is far harder to find than a crash. Always \`0 <= r < rows and 0 <= c < cols\` first.
- **Reaching for backtracking when the problem says "count" or "how many ways".** If you don't need the actual arrangements, it's almost certainly DP.
- **Not restoring the mutated board.** The state leaks into sibling branches and the answer is wrong in ways that only show on larger inputs.

### Representative problems

Subsets · Subsets II · Combination Sum · Combination Sum II · Permutations · Word Search · Palindrome Partitioning · Letter Combinations of a Phone Number · N-Queens`,
    },
    {
      id: "graphs",
      heading: "Graphs: BFS, DFS, Topological Sort, Union-Find, Dijkstra",
      markdown: `Half of "graph problems" don't mention graphs. A grid is a graph (cells are nodes, adjacent cells are edges). Course prerequisites are a graph. Word transformations are a graph. Learning to *see* the graph is more valuable than any single algorithm here.

### Choosing the algorithm

| The question is | Use |
| --- | --- |
| Is there a path? / connected components / flood fill | DFS or BFS, either works |
| **Shortest** path, **unweighted** | BFS (and only BFS — DFS gives *a* path, not the shortest) |
| Shortest path with **non-negative weights** | Dijkstra |
| Valid ordering under dependencies / cycle in a directed graph | Topological sort (Kahn's BFS or DFS with colors) |
| Connectivity under incremental edges, "redundant connection", MST | Union-find |
| Minimum spanning tree | Kruskal (union-find) or Prim (heap) |

### Setup: building the graph

\`\`\`python
def build_adjacency(n: int, edges: list[list[int]], directed: bool) -> list[list[int]]:
    adj: list[list[int]] = [[] for _ in range(n)]  # NOT [[]] * n — that aliases one list
    for u, v in edges:
        adj[u].append(v)
        if not directed:
            adj[v].append(u)  # forgetting this is the classic bug
    return adj


DIRECTIONS: tuple[tuple[int, int], ...] = ((1, 0), (-1, 0), (0, 1), (0, -1))
\`\`\`

Hoisting the direction vectors out of the loop keeps grid code readable and stops you from writing four near-identical recursive calls. Make them a tuple of tuples rather than a list of lists: a module-level constant that nothing can accidentally append to is one less thing to reason about.

\`defaultdict(list)\` is the alternative when nodes aren't \`0..n-1\` — \`adj[u].append(v)\` just works on a missing key. Be aware that *reading* \`adj[u]\` for an unknown \`u\` also inserts it, so a \`len(adj)\` taken after a lookup loop can be larger than the node count.

### Template: grid DFS (flood fill / connected components)

\`\`\`python
def num_islands(grid: list[list[str]]) -> int:
    if not grid or not grid[0]:
        return 0
    rows, cols = len(grid), len(grid[0])

    def sink(start_r: int, start_c: int) -> None:
        # Explicit stack, not recursion: a 300x300 grid is 90,000 cells deep in the
        # worst case, and CPython raises RecursionError at about 1,000 frames.
        stack = [(start_r, start_c)]
        while stack:
            r, c = stack.pop()
            if not (0 <= r < rows and 0 <= c < cols):
                continue
            if grid[r][c] != "1":
                continue
            grid[r][c] = "0"  # mark visited by mutation; no separate visited set needed
            for dr, dc in DIRECTIONS:
                stack.append((r + dr, c + dc))

    islands = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                islands += 1
                sink(r, c)
    return islands
\`\`\`

Mutating the grid to mark visited is standard and worth flagging: *"I'm sinking the island as I go instead of keeping a visited set — that's O(1) extra space, but it destroys the input. Is that acceptable?"* Note this only works because LeetCode hands you a list of lists; if the rows were strings you couldn't assign into them, and you'd need a real \`visited\` set of \`(r, c)\` tuples.

### Template: BFS with levels (multi-source works too)

Seed the queue with *every* source and the same code computes the minimum distance from the nearest source — that's Rotting Oranges, Walls and Gates, and 01-Matrix in one template.

\`\`\`python
from collections import deque


def minutes_to_rot_all(grid: list[list[int]]) -> int:
    rows, cols = len(grid), len(grid[0])

    queue: deque[tuple[int, int]] = deque()
    fresh = 0

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                queue.append((r, c))  # every rotten orange is a source
            elif grid[r][c] == 1:
                fresh += 1

    minutes = 0
    while queue and fresh > 0:
        for _ in range(len(queue)):  # exactly one level = one minute
            r, c = queue.popleft()
            for dr, dc in DIRECTIONS:
                nr, nc = r + dr, c + dc
                if not (0 <= nr < rows and 0 <= nc < cols):
                    continue
                if grid[nr][nc] != 1:
                    continue
                grid[nr][nc] = 2  # mark on enqueue, not on dequeue
                fresh -= 1
                queue.append((nr, nc))
        minutes += 1

    return minutes if fresh == 0 else -1
\`\`\`

**Mark visited when you enqueue, not when you dequeue.** Marking on dequeue lets the same node enter the queue several times and the complexity degrades.

### Template: topological sort (Kahn's algorithm)

\`\`\`python
from collections import deque


def topo_sort(n: int, prerequisites: list[list[int]]) -> list[int]:
    adj: list[list[int]] = [[] for _ in range(n)]
    indegree = [0] * n

    for course, prereq in prerequisites:
        adj[prereq].append(course)  # edge points prereq -> course
        indegree[course] += 1

    queue = deque(i for i in range(n) if indegree[i] == 0)
    order: list[int] = []

    while queue:
        node = queue.popleft()
        order.append(node)
        for nxt in adj[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)

    return order if len(order) == n else []  # short order means a cycle
\`\`\`

The cycle detection falls out for free: if you can't drain every node, some nodes never reached indegree zero, which means they're in a cycle. Course Schedule is \`len(topo_sort(...)) == n\`.

### Template: union-find (disjoint set union)

\`\`\`python
class UnionFind:
    def __init__(self, n: int) -> None:
        self.parent = list(range(n))
        self.rank = [0] * n
        self.count = n

    def find(self, x: int) -> int:
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]  # path halving
            x = self.parent[x]
        return x

    def union(self, a: int, b: int) -> bool:
        """Returns False if a and b were already connected (this edge closes a cycle)."""
        root_a, root_b = self.find(a), self.find(b)
        if root_a == root_b:
            return False

        if self.rank[root_a] < self.rank[root_b]:
            self.parent[root_a] = root_b
        elif self.rank[root_a] > self.rank[root_b]:
            self.parent[root_b] = root_a
        else:
            self.parent[root_b] = root_a
            self.rank[root_a] += 1
        self.count -= 1
        return True
\`\`\`

Both optimizations matter: **union by rank** keeps trees shallow, **path compression** flattens them on lookup. Together they give near-constant amortized time (inverse Ackermann, α(n), which is at most 4 for any input you'll ever see). Without them, \`find\` degrades to O(n). Note that \`find\` is written iteratively — the recursive one-liner \`return self.find(self.parent[x])\` is prettier and blows the stack on a long chain before compression has had a chance to flatten it.

The \`union\` return value is the whole answer to Redundant Connection and Graph Valid Tree: the first edge that returns \`False\` is the one creating a cycle.

### Template: Dijkstra

\`\`\`python
import heapq


def dijkstra(n: int, adj: list[list[tuple[int, int]]], source: int) -> list[float]:
    """adj[u] holds (neighbor, weight) pairs. Weights must be non-negative."""
    dist: list[float] = [float("inf")] * n
    dist[source] = 0

    heap: list[tuple[int, int]] = [(0, source)]  # (distance, node); tuples sort on [0]

    while heap:
        d, node = heapq.heappop(heap)
        if d > dist[node]:
            continue  # stale entry: we already found something better

        for nxt, weight in adj[node]:
            candidate = d + weight
            if candidate < dist[nxt]:
                dist[nxt] = candidate
                heapq.heappush(heap, (candidate, nxt))
    return dist
\`\`\`

The \`if d > dist[node]: continue\` line is how you avoid needing a decrease-key operation — which \`heapq\` doesn't have at all, so this isn't optional style, it's the only way. You push duplicates and skip the outdated ones. Explaining that is a genuine differentiator.

Putting the distance first in the tuple is what makes \`heapq\` order by distance. Because both elements are ints here, a tie on distance falls through to comparing node ids, which is harmless — but the moment the payload is an unorderable object you need a counter in between (see the heaps section).

**Why Dijkstra needs non-negative weights:** it finalizes a node the first time it's popped, betting that no cheaper path exists. A negative edge could make a longer route cheaper later, breaking the bet. With negative weights you need Bellman-Ford — which is also the right answer for Cheapest Flights Within K Stops, since the "at most k stops" constraint maps naturally onto Bellman-Ford's k relaxation rounds.

### Complexity

| Algorithm | Time | Space |
| --- | --- | --- |
| DFS / BFS | O(V + E) | O(V) |
| Grid DFS / BFS | O(rows × cols) | O(rows × cols) |
| Topological sort | O(V + E) | O(V + E) |
| Union-find, m operations | O(m · α(n)) ≈ O(m) | O(n) |
| Dijkstra with a binary heap | O((V + E) log V) | O(V + E) |
| Bellman-Ford | O(V · E) | O(V) |
| Kruskal MST | O(E log E) | O(V) |

For grids, V is rows × cols and E is about 4V, so both collapse to O(rows × cols). Say it in grid terms — quoting O(V + E) for a grid problem sounds like recitation.

### Pitfalls

- **Using DFS for a shortest path in an unweighted graph.** It finds *a* path. BFS finds the shortest. This is the most consequential graph mistake in interviews.
- **Forgetting the reverse edge** on an undirected graph.
- **Marking visited on dequeue instead of enqueue.**
- **\`[[]] * n\` for an adjacency list.** That's n references to one list, so \`adj[0].append(v)\` appends to every node's neighbours at once. Use \`[[] for _ in range(n)]\`.
- **Recursive DFS hitting the recursion limit.** CPython caps recursion around 1,000 frames, so a 10^5-node graph or even a 40×40 grid can raise \`RecursionError\` long before memory is an issue. Convert to an explicit stack, the way \`sink\` above does, rather than raising the limit and hoping.
- **\`list.pop(0)\` for the BFS queue** — O(n) per dequeue turns O(V + E) into O(V^2). \`collections.deque\`.
- **Edge direction in topological sort.** LeetCode's Course Schedule gives \`[course, prerequisite]\`; the edge must run prerequisite → course. Reversing it produces a valid-looking but wrong order.
- **Union-find without path compression**, then claiming it's near-constant.
- **Dijkstra on negative weights**, or forgetting the stale-entry skip and re-relaxing nodes forever.
- **Not handling disconnected graphs.** "Count components" and "is it a valid tree" both require looping over every unvisited start node.

### Representative problems

Number of Islands · Clone Graph · Rotting Oranges · Pacific Atlantic Water Flow · Course Schedule · Course Schedule II · Graph Valid Tree · Number of Connected Components in an Undirected Graph · Redundant Connection · Word Ladder · Network Delay Time · Min Cost to Connect All Points · Cheapest Flights Within K Stops`,
    },
    {
      id: "dynamic-programming",
      heading: "Dynamic Programming: 1D, 2D, Knapsack, LCS, State Machine",
      markdown: `DP intimidates people because it's taught as a bag of tricks. It isn't. There are exactly three questions, and if you answer them in order you get the recurrence every time:

1. **What is the state?** The minimum set of variables that fully determines the rest of the problem. ("I'm at index i with j dollars left.")
2. **What is the transition?** From this state, what choices exist, and what state does each lead to?
3. **What are the base cases and the answer cell?**

Then complexity is mechanical: **(number of states) × (work per transition)**. Say that formula out loud when you analyze — it's exactly what the interviewer wants to hear.

### Trigger signals

- "**How many ways**", "**minimum/maximum cost** to…", "**can you reach/make**…", "**longest** subsequence".
- The brute force is recursive and **recomputes the same subproblem** with the same arguments.
- You want a greedy solution but you can't produce an exchange argument, and a counterexample exists.
- **Optimal substructure**: the best answer for n is built from best answers for smaller inputs.

### Start with memoized recursion, not tabulation

In an interview, write the recursion first. It's easier to derive, easier to explain, and the tabulation is a mechanical rewrite if you have time. Interviewers accept memoized recursion as a complete answer — and in Python the memo is one decorator.

\`\`\`python
from functools import cache


def word_break(s: str, word_dict: list[str]) -> bool:
    words = set(word_dict)  # stays in the closure: sets are unhashable, so not an argument

    @cache  # state: the start index. functools.cache memoizes on the argument tuple.
    def can_break(start: int) -> bool:
        if start == len(s):
            return True
        return any(
            s[start:end] in words and can_break(end)
            for end in range(start + 1, len(s) + 1)
        )

    return can_break(0)
\`\`\`

\`functools.cache\` (3.9+) is \`lru_cache(maxsize=None)\` and it is the fastest legitimate way to turn a recursion into a DP. Two rules come with it. Every argument must be **hashable**, so a list or set parameter raises \`TypeError: unhashable type\` — keep mutable state in the closure and let only indices be parameters. And the cache is attached to the function object, so a module-level cached function holds its entries (and everything they reference) until you call \`.cache_clear()\`; defining the helper *inside* the solver, as above, lets it be collected with the frame.

State count is n, each state does O(n) slices, so O(n^2) states-times-transitions — plus the cost of the slicing itself, which is real: \`s[start:end]\` builds a new string because Python strings are immutable, so each check is O(end - start) rather than O(1). Mentioning that, and that a trie over \`words\` removes it, is a strong follow-up.

### 1D DP: rolling variables

When the recurrence only reaches back a fixed number of cells, you don't need the array at all.

\`\`\`python
def rob(nums: list[int]) -> int:
    skip = 0  # best total if we did NOT take the previous house
    take = 0  # best total if we DID take the previous house

    for value in nums:
        # Tuple assignment evaluates the entire right-hand side first, so both new
        # values are computed from the old pair. No temporaries, no ordering bug.
        take, skip = skip + value, max(skip, take)
    return max(take, skip)
\`\`\`

Naming the two variables after what they *mean* rather than \`dp1\`/\`dp2\` is worth real communication points — the interviewer can now follow you without asking.

### 1D DP with a full table: unbounded knapsack

Coin Change is the canonical "min cost to reach a target, unlimited items" problem.

\`\`\`python
def coin_change(coins: list[int], amount: int) -> int:
    unreachable = amount + 1  # an integer sentinel: no real answer can exceed this
    dp = [unreachable] * (amount + 1)
    dp[0] = 0  # zero coins make zero

    for target in range(1, amount + 1):
        for coin in coins:
            if coin <= target:
                dp[target] = min(dp[target], dp[target - coin] + 1)
    return dp[amount] if dp[amount] != unreachable else -1
\`\`\`

\`float("inf")\` works as the sentinel too — \`inf + 1\` is still \`inf\`, so the arithmetic is safe — but it makes every cell a float and mixing floats into integer DP is how precision bugs start. An integer sentinel keeps the table honest.

O(amount × coins) time, O(amount) space. Note this is *not* greedy — taking the largest coin first fails on \`coins = [1, 3, 4], amount = 6\` (greedy gives 4+1+1 = 3 coins; the answer is 3+3 = 2). Having that counterexample ready is how you shut down "why not just be greedy?"

### 0/1 knapsack: the loop direction is the whole trick

Each item may be used once. Iterate the capacity **descending** so an item can't be re-consumed within the same pass.

\`\`\`python
def can_partition(nums: list[int]) -> bool:
    total = sum(nums)
    if total % 2 != 0:
        return False

    target = total // 2  # // not /: true division returns a float, and floats can't index
    dp = [False] * (target + 1)
    dp[0] = True

    for num in nums:
        for capacity in range(target, num - 1, -1):
            # Descending: dp[capacity - num] still refers to the previous item's row.
            if dp[capacity - num]:
                dp[capacity] = True
    return dp[target]
\`\`\`

**Ascending capacity = unbounded knapsack (reuse allowed). Descending = 0/1 knapsack (each item once.)** That one line of understanding covers Coin Change, Coin Change II, Target Sum, and Partition Equal Subset Sum.

Python has a party trick here that other languages don't: because ints are arbitrary precision, an int *is* a bitset of unlimited width, and the whole inner loop becomes one shift-or.

\`\`\`python
def can_partition_bitset(nums: list[int]) -> bool:
    total = sum(nums)
    if total % 2 != 0:
        return False

    reachable = 1  # bit i set means "sum i is reachable"; bit 0 = the empty subset
    for num in nums:
        reachable |= reachable << num  # every reachable sum, plus num, in one operation
    return bool((reachable >> (total // 2)) & 1)
\`\`\`

It's the same DP with the word size doing the inner loop, and it's genuinely faster in CPython because the shifting happens in C. Show it *after* the readable version and explain that it's the same recurrence — leading with it looks like you memorized a trick.

### 2D DP: the grid recurrence

Two sequences, or a grid, means a 2D table where \`dp[i][j]\` answers "the prefix of length i against the prefix of length j".

\`\`\`python
def longest_common_subsequence(a: str, b: str) -> int:
    # A comprehension per row. [[0] * (len(b) + 1)] * (len(a) + 1) would alias one row.
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]

    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1  # characters match: extend the diagonal
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])  # drop one from either side
    return dp[len(a)][len(b)]
\`\`\`

The \`+1\` row and column of zeros is the same trick as the prefix-sum sentinel: it removes every boundary special case. Edit Distance is this table with three transitions instead of two (insert, delete, replace), and it's worth writing both so you see they're the same machine.

### State machine DP

When the problem has *modes* — holding a stock, in cooldown, free to buy — make the mode part of the state and write one transition per mode.

\`\`\`python
def max_profit_with_cooldown(prices: list[int]) -> int:
    holding = float("-inf")  # best profit while holding a share
    just_sold = float("-inf")  # best profit on the day we sold (tomorrow is cooldown)
    resting = 0.0  # best profit while free to buy

    for price in prices:
        holding, just_sold, resting = (
            max(holding, resting - price),  # keep holding, or buy today
            holding + price,  # sell today
            max(resting, just_sold),  # stay free, or come off cooldown
        )
    return int(max(just_sold, resting))  # never end still holding
\`\`\`

In most languages you must snapshot the previous values into temporaries before updating, or the \`just_sold\` line reads a \`holding\` that already includes today's purchase and you can buy and sell on the same day. Python's tuple assignment does that snapshot for you — the entire right-hand side is built before a single name is rebound. Say that explicitly, because otherwise it looks like you got lucky rather than chose it.

\`float("-inf")\` is the sentinel of choice here precisely because Python ints have no minimum value to reach for. It compares correctly against ints, and the final \`int(...)\` converts back once a real profit has displaced it.

### When DP meets binary search: LIS in O(n log n)

The O(n^2) LIS DP is fine to state, but knowing the patience-sorting version is a real differentiator — and in Python it's four lines, because \`bisect\` does the search.

\`\`\`python
from bisect import bisect_left


def length_of_lis(nums: list[int]) -> int:
    # tails[k] = the smallest possible tail of an increasing subsequence of length k + 1
    tails: list[int] = []

    for num in nums:
        i = bisect_left(tails, num)  # first index with tails[i] >= num
        if i == len(tails):
            tails.append(num)  # num extends the longest run so far
        else:
            tails[i] = num  # num is a better (smaller) tail for that length
    return len(tails)
\`\`\`

Swap \`bisect_left\` for \`bisect_right\` and you get the longest *non-decreasing* subsequence, because equal values stop replacing each other. Knowing which one to reach for is the whole difference between the two problems.

Be honest about what \`tails\` is: it is **not** an actual increasing subsequence, only a record of the best tails per length. Its *length* is the answer. Candidates who claim otherwise get caught.

### Complexity

| Shape | States | Time | Space (optimized) |
| --- | --- | --- | --- |
| 1D over an index | n | O(n) or O(n · choices) | O(1) with rolling variables |
| Knapsack | n × capacity | O(n · capacity) | O(capacity) |
| Two sequences (LCS, Edit Distance) | m × n | O(m · n) | O(min(m, n)) with one row |
| Interval DP (Burst Balloons) | n^2 | O(n^3) | O(n^2) |
| Bitmask DP | 2^n × n | O(2^n · n^2) | O(2^n · n) |

Knapsack's O(n · capacity) is **pseudo-polynomial** — it's polynomial in the *value* of the capacity, not in its bit length. Saying that is a genuine senior-sounding observation.

### Pitfalls

- **Wrong state.** If your memo key doesn't capture everything that affects the future, memoization returns wrong answers rather than slow ones. Test: could two different situations share this key and need different answers?
- **Wrong iteration order.** Every cell you read must already be computed. Ascending vs descending in knapsack is the famous case; \`dp[i][j]\` depending on \`dp[i][j + 1]\` means you iterate j backwards.
- **Off-by-one on the sentinel row.** With a \`+1\` table, \`dp[i][j]\` uses \`a[i - 1]\`, not \`a[i]\`. Write the mapping in a comment.
- **\`[[0] * cols] * rows\`.** The outer \`*\` copies the *reference*, so all \`rows\` entries are the same list and \`dp[0][0] = 1\` writes a 1 into every row. Use \`[[0] * cols for _ in range(rows)]\`. The inner \`[0] * cols\` is fine because ints are immutable — the trap only exists one level up, which is exactly why it's so easy to miss.
- **Memoized recursion hitting the recursion limit.** A cached recursion over a 10^5-character string is 10^5 frames deep and raises \`RecursionError\`. That's a real, mechanical reason to convert to a bottom-up loop when n is large — not just a stylistic preference.
- **\`@cache\` on a function taking a list or dict.** Unhashable arguments raise immediately. Pass indices; keep the collection in the closure.
- **\`//\` vs \`/\`.** Any index, capacity, or midpoint computed with \`/\` is a float, and \`dp[total / 2]\` raises \`TypeError\`. Integer division everywhere in a DP table.
- **Optimizing space before the recurrence is right.** Get the 2D table correct, verify it, *then* roll it to 1D if there's time. Rolling early hides bugs.
- **Confusing subsequence and substring.** Subsequence allows gaps and is usually DP; substring is contiguous and is often a window or expand-around-center.
- **Reciting complexity instead of deriving it.** "It's O(n·m) because there are n·m states and each transition is O(1)" beats "it's O(n·m)" every time.

### Representative problems

Climbing Stairs · House Robber · Coin Change · Longest Increasing Subsequence · Word Break · Partition Equal Subset Sum · Unique Paths · Longest Common Subsequence · Edit Distance · Best Time to Buy and Sell Stock with Cooldown · Target Sum · Longest Palindromic Substring`,
    },
    {
      id: "bits-and-matrix",
      heading: "Bit Manipulation and Matrix Traversal",
      markdown: `Two small patterns that share a property: they're mostly about knowing a handful of exact mechanics, and fumbling them looks worse than not knowing the trick at all.

## Bit manipulation

### Trigger signals

- The problem forbids arithmetic operators, or asks for a result "without using \`+\`/\`-\`".
- "Exactly one number appears once, everything else twice."
- **n ≤ 20 and you need subsets** — bitmask enumeration or bitmask DP.
- Counting set bits, powers of two, swapping without a temp, or anything involving a fixed-size integer representation.

### The operations worth memorizing

\`\`\`python
def is_bit_set(x: int, i: int) -> bool:
    return (x & (1 << i)) != 0  # parentheses are mandatory — see the gotchas below


def set_bit(x: int, i: int) -> int:
    return x | (1 << i)


def clear_bit(x: int, i: int) -> int:
    return x & ~(1 << i)


def toggle_bit(x: int, i: int) -> int:
    return x ^ (1 << i)


def lowest_set_bit(x: int) -> int:
    return x & -x  # isolates it


def drop_lowest_set_bit(x: int) -> int:
    return x & (x - 1)  # clears it


def is_power_of_two(x: int) -> bool:
    return x > 0 and (x & (x - 1)) == 0
\`\`\`

The XOR identities carry most of the problems: \`a ^ a == 0\`, \`a ^ 0 == a\`, and XOR is commutative and associative. Therefore XOR-ing an entire array where every value appears twice except one leaves exactly the odd one out.

\`\`\`python
def single_number(nums: list[int]) -> int:
    accumulator = 0
    for num in nums:
        accumulator ^= num
    return accumulator


def hamming_weight(n: int) -> int:
    count = 0
    x = n
    while x:
        x &= x - 1  # clears the lowest set bit, so this loops once per set bit
        count += 1
    return count


def count_bits(n: int) -> list[int]:
    dp = [0] * (n + 1)
    for i in range(1, n + 1):
        dp[i] = dp[i >> 1] + (i & 1)  # i's bits = (i without its last bit) + that bit
    return dp
\`\`\`

The stdlib does two of those in one call: \`functools.reduce(operator.xor, nums, 0)\` is \`single_number\`, and \`n.bit_count()\` (3.10+, or \`bin(n).count("1")\` before that) is \`hamming_weight\`. Name the builtin, then write the loop — the loop is what's being tested, but not knowing the builtin exists is its own signal.

\`count_bits\` is worth studying: it's a DP recurrence expressed in bit operations, and the \`i >> 1\` subproblem is always already computed.

### Bitmask subset enumeration

For n ≤ 20, every subset is an integer from 0 to 2^n − 1.

\`\`\`python
def subsets_by_bitmask(nums: list[int]) -> list[list[int]]:
    out: list[list[int]] = []
    for mask in range(1 << len(nums)):
        out.append([num for i, num in enumerate(nums) if mask & (1 << i)])
    return out
\`\`\`

### Python-specific gotchas

These matter, and they are *different* from the ones you may have memorized for a fixed-width language:

- **Bitwise operators bind looser than comparisons.** \`x & 1 == 0\` parses as \`x & (1 == 0)\`, which is \`x & False\`, which is \`0\`, which is falsy — always. It doesn't raise; it just quietly answers the wrong question. Parenthesize every mixed expression: \`(x & 1) == 0\`.
- **There is no 32-bit wraparound and no overflow.** \`1 << 31\` is just \`2147483648\`, not a negative number, and \`1 << 200\` is a perfectly good integer. Python ints are arbitrary precision, so the classic "watch out, this overflows" pitfall doesn't exist here — but its mirror image does: for problems *defined* on 32-bit two's complement (Reverse Bits, Sum of Two Integers), you must impose the width yourself.
- **\`~x\` is \`-x - 1\`, and \`>>\` is arithmetic on a conceptually infinite sign extension.** So \`-1 >> 1\` is \`-1\`, and a loop that runs "until x becomes 0" never terminates on a negative input. Mask to 32 bits first.
- **The batteries are worth knowing:** \`int.bit_count()\`, \`int.bit_length()\`, \`bin(x)\`, \`format(x, "032b")\`, and \`int(s, 2)\`.

Masking looks like this — it's the whole answer to Sum of Two Integers:

\`\`\`python
MASK32 = 0xFFFFFFFF
SIGN_BIT = 1 << 31


def get_sum(a: int, b: int) -> int:
    """Add two 32-bit signed integers without + or -, on unbounded Python ints."""
    a &= MASK32
    b &= MASK32
    while b:
        carry = (a & b) << 1
        a = (a ^ b) & MASK32  # sum without carry, re-truncated to 32 bits
        b = carry & MASK32
    return a if a < SIGN_BIT else a - (1 << 32)  # reinterpret as signed
\`\`\`

The final line is the part candidates forget: after masking, a negative result is sitting in the range 2^31 … 2^32 − 1 and has to be mapped back down.

## Matrix traversal

### Trigger signals

- The input is a 2D grid and the answer is about **geometry** — rotate, transpose, spiral, diagonal — rather than search. (Search on a grid is a graph problem; see the graphs section.)
- An **in-place** or **O(1) extra space** constraint on a matrix operation.

### Template: layer-by-layer spiral

Four boundaries, shrink after each edge, and re-check the boundaries before the two return passes.

\`\`\`python
def spiral_order(matrix: list[list[int]]) -> list[int]:
    out: list[int] = []
    if not matrix or not matrix[0]:
        return out

    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1

    while top <= bottom and left <= right:
        for c in range(left, right + 1):
            out.append(matrix[top][c])
        top += 1

        for r in range(top, bottom + 1):
            out.append(matrix[r][right])
        right -= 1

        if top <= bottom:
            for c in range(right, left - 1, -1):  # stop is exclusive, so left - 1
                out.append(matrix[bottom][c])
            bottom -= 1

        if left <= right:
            for r in range(bottom, top - 1, -1):
                out.append(matrix[r][left])
            left += 1
    return out
\`\`\`

The two guarded blocks are not optional. On a single-row matrix, without \`if top <= bottom\` you walk the same row back and emit duplicates.

### Template: rotate in place = transpose + reverse

\`\`\`python
def rotate(matrix: list[list[int]]) -> None:
    n = len(matrix)

    # Transpose: swap across the main diagonal. c starts at r + 1 so you
    # don't swap every pair twice and undo yourself.
    for r in range(n):
        for c in range(r + 1, n):
            matrix[r][c], matrix[c][r] = matrix[c][r], matrix[r][c]

    for row in matrix:
        row.reverse()  # reflect horizontally, in place
\`\`\`

Two reflections compose into a rotation. The swap is one line because tuple assignment evaluates the right-hand side first — no temporary, and no chance of clobbering half of it. Counter-clockwise is transpose plus *reverse the row order* (\`matrix.reverse()\`), and note the difference between \`row.reverse()\` (in place, returns \`None\`) and \`reversed(row)\` (a lazy iterator) — assigning the return value of \`reverse()\` is a classic slip.

### Template: using the matrix itself as scratch space (Set Matrix Zeroes)

The O(1)-space version uses row 0 and column 0 as the flag arrays, with two booleans to remember their own original state.

\`\`\`python
def set_zeroes(matrix: list[list[int]]) -> None:
    rows, cols = len(matrix), len(matrix[0])

    first_row_has_zero = any(matrix[0][c] == 0 for c in range(cols))
    first_col_has_zero = any(matrix[r][0] == 0 for r in range(rows))

    # Pass 1: record which rows and columns need zeroing, in the margins.
    for r in range(1, rows):
        for c in range(1, cols):
            if matrix[r][c] == 0:
                matrix[r][0] = 0
                matrix[0][c] = 0

    # Pass 2: apply, interior first — the margins are still holding flags.
    for r in range(1, rows):
        for c in range(1, cols):
            if matrix[r][0] == 0 or matrix[0][c] == 0:
                matrix[r][c] = 0

    if first_row_has_zero:
        for c in range(cols):
            matrix[0][c] = 0
    if first_col_has_zero:
        for r in range(rows):
            matrix[r][0] = 0
\`\`\`

The ordering is the whole problem: zero the margins first and you've destroyed the flags you were about to read.

### Complexity

Every template here is O(rows × cols) time. Space is O(1) for in-place versions, O(rows × cols) for the output when one is required. Bit operations on values that fit in a machine word are O(1) — on genuinely huge integers they're O(number of words), which is the price of arbitrary precision. Bitmask enumeration is O(2^n · n).

### Pitfalls

- **Mixing bitwise and comparison operators without parentheses.** \`x & 1 == 0\` is the canonical wrong answer. This is the single most common Python bit-manipulation bug.
- **Forgetting to mask to 32 bits** on problems defined over fixed-width integers, then wondering why the loop never terminates on a negative input.
- **Using \`2 ** i\` where \`1 << i\` is meant** — fine numerically, but it signals you don't actually think in bits.
- **Assuming the matrix is square.** \`len(matrix)\` is rows, \`len(matrix[0])\` is columns, and they differ. Rotate-in-place only works on a square.
- **Not checking for an empty matrix** — \`matrix[0]\` raises \`IndexError\` on \`[]\`, and \`matrix[0][0]\` raises again on \`[[]]\`. Guard with \`if not matrix or not matrix[0]\`.
- **Negative indices wrap instead of raising.** \`matrix[-1]\` is the last row and \`matrix[r][-1]\` is the last column, so a boundary bug reads real data from the wrong end rather than crashing. Bound-check before you index.
- **Building the matrix with \`[[0] * cols] * rows\`**, which aliases one row object across every row.
- **Transposing with \`c\` from 0**, which swaps each pair twice and leaves the matrix unchanged.
- **Row/column index swaps.** Use \`r\`/\`c\` rather than \`i\`/\`j\`; the naming alone prevents a whole class of bug and reads better.

### Representative problems

Single Number · Number of 1 Bits · Counting Bits · Reverse Bits · Missing Number · Sum of Two Integers · Rotate Image · Spiral Matrix · Set Matrix Zeroes`,
    },
  ],
  questions: [
    {
      q: "The array has up to 10^5 elements. What does that tell you before you've even read the problem?",
      a: "That O(n^2) is out — 10^10 operations won't finish — so I'm targeting O(n log n) or O(n). Practically that means sorting, a heap, binary search, a hash map, or a single pass with two pointers or a sliding window. In Python I'd add that the constant factor matters more than usual: the interpreter runs maybe 10^7 steps a second, so once I've picked the right complexity class I want the inner loop to be a built-in — `sorted`, `sum`, `set`, `Counter`, `bisect`, `heapq` — rather than a hand-written loop. I'd say all of that out loud early, because it prunes the search space for both of us and shows I'm reasoning from constraints instead of guessing.",
      weak: "It means it's a big input so I should try to be efficient.",
    },
    {
      q: "When is a sliding window the wrong tool for a 'longest subarray' problem?",
      a: "When the validity condition isn't monotonic under shrinking. A window works because if a window is invalid, extending it further can't fix it, and shrinking eventually makes it valid. 'Longest subarray with sum exactly k' with negative numbers breaks that: shrinking can move the sum either direction, so there's no direction to slide. That one is prefix sums plus a hash map. The check I run is: does removing an element from the left always move me toward validity?",
      weak: "You can always use a sliding window on a subarray problem, you just have to be careful with the pointers.",
    },
    {
      q: "Your sliding window has a while loop inside a for loop. Isn't that O(n^2)?",
      a: "No — it's O(n). The left pointer only ever moves forward and it can move at most n times across the entire run, so the total work of the inner loop is bounded by n regardless of how it's distributed. That's an amortized argument: each index enters the window once and leaves once. The same reasoning applies to monotonic stacks, where every index is pushed once and popped once. The thing that would genuinely break it is doing O(k) work per step inside the loop — recomputing `sum(nums[left:right+1])` or slicing the string — because Python slices copy.",
      weak: "It looks like O(n^2) but in practice the inner loop doesn't run much, so it's closer to O(n).",
    },
    {
      q: "Explain how you'd recognize a 'binary search on the answer' problem, and how you'd set it up.",
      a: "Two signals: the problem asks me to minimize a maximum or maximize a minimum, and I can't compute the answer directly but I *can* cheaply check whether a given candidate works. Koko Eating Bananas is the archetype — I can't derive the right eating speed, but given a speed I can total the hours in O(n). Setup is: write a boolean `feasible(x)`, convince myself it's monotonic (if speed 5 works, so does 6), pick bounds where lo is definitely too small or the minimum legal value and hi is definitely large enough, then binary search for the boundary. Complexity is log of the range times the cost of the check. I'd also note that this is the case where I write the loop by hand rather than using `bisect` — `bisect` searches a sorted sequence, and here there's no sequence, just a predicate over a range of candidate answers.",
    },
    {
      q: "You write `mid = (lo + hi) / 2` in a Python binary search. What's wrong?",
      a: "In Python 3, `/` is true division and always returns a float, so `nums[mid]` raises `TypeError: list indices must be integers or slices, not float`. I'd write `mid = (lo + hi) // 2`. Floor division is exact on integers of any size, and there's no overflow to defend against — Python ints are arbitrary precision, so `lo + hi` can't wrap the way it can in Java or C++. I'd still mention `lo + (hi - lo) // 2` as the habit I'd carry into a fixed-width language. The reason this particular bug is survivable in Python is that it fails loudly at the index; the same `/` slip inside plain arithmetic just silently turns exact integer math into floats and starts losing precision past 2^53.",
      weak: "It should be `math.floor((lo + hi) / 2)` because of integer overflow.",
    },
    {
      q: "Why is `arr.sort()` a trap in Python?",
      a: "Not for the reason people expect — the default ordering is fine, since Python compares numbers numerically, so `[10, 9, 1]` sorts to `[1, 9, 10]`. The trap is that `list.sort()` sorts in place and returns `None`, so `ordered = intervals.sort()` binds `None` and the next line dies with a `TypeError`. Use `sorted(...)` when you want a value back, which also gives you the copy you need if the caller's list matters. Second thing: there's no comparator parameter, only `key=`, so a multi-key sort is a tuple key like `key=lambda x: (x[1], -x[0])`, and `functools.cmp_to_key` is the escape hatch for orderings that genuinely aren't expressible as a key. Both are Timsort — stable, O(n log n), and close to O(n) on data that's already mostly ordered, which is why sorting by the secondary key first works.",
      weak: "It sorts ascending by default, which is usually what you want.",
    },
    {
      q: "What's the difference between a monotonic stack and a plain stack, and what problems does it solve?",
      a: "A plain stack just gives last-in-first-out. A monotonic stack additionally maintains an ordering invariant — say indices whose values strictly decrease. The payoff is that when a new element breaks the invariant, every element it pops has just found its 'next greater element,' so you resolve them in O(1) each. It turns the O(n^2) 'for each element, scan right until something bigger' brute force into O(n). Signals are next greater/smaller, span, and histogram problems. I always store indices, not values, so I can compute distances. In Python a plain list is the stack — `append` and `pop()` are both O(1) at the end — and I guard every peek with `while stack and ...` because `stack[-1]` raises `IndexError` on an empty list rather than returning a null.",
    },
    {
      q: "You need the k largest elements. Would you use a max-heap or a min-heap, and why?",
      a: "A min-heap of size k. It sounds backwards, but the point is that the *smallest* of my current best-k sits at the root where I can evict it in O(log k) as better candidates arrive. A max-heap of everything would work but costs O(n) space and O(n log n) to drain. The min-heap version is O(n log k) time and O(k) space, which matters when k is small or the data is a stream that doesn't fit in memory. In Python that's `heapq`, which is a min-heap by design — for a max-heap you negate the keys going in and coming out. `heapq.nlargest(k, xs)` runs exactly this bounded-heap algorithm in C, and for Top K Frequent specifically `Counter(nums).most_common(k)` does it end to end. I'd also mention bucket sort by frequency, which is O(n).",
      weak: "A max-heap, because I want the largest elements and a max-heap gives you the largest one first.",
    },
    {
      q: "Why can't you use DFS to find the shortest path in an unweighted graph?",
      a: "DFS commits to a branch and goes deep, so the first time it reaches the target it has found *a* path, not the shortest — it might have wandered a long way around. BFS explores in order of distance from the source, so the first time it touches a node, that's the minimum number of edges. If I wanted DFS to give the shortest path I'd have to explore every path and take the minimum, which is exponential. For weighted graphs BFS stops working too, and I'd go to Dijkstra. One Python-specific note on DFS: I write it with an explicit stack on anything large, because the interpreter's recursion limit is about a thousand frames and a 10^5-node graph raises `RecursionError` well before it runs out of memory.",
      weak: "You can use DFS, you just have to track the depth and keep the minimum — it's the same complexity.",
    },
    {
      q: "Walk me through why union-find is nearly O(1) per operation.",
      a: "Two optimizations. Union by rank always hangs the shorter tree under the taller one, so depth grows logarithmically at worst rather than linearly. Path compression flattens the path on every `find` — each node you walk past gets repointed closer to the root, so the work amortizes across future calls. Together the amortized cost is O(α(n)), the inverse Ackermann function, which is at most 4 for any n that fits in memory. Without either optimization, `find` degrades to O(n) on a chain. I write `find` as a loop rather than the recursive one-liner, because the recursive version walks the un-compressed chain and can blow the recursion limit on exactly the input the compression was meant to fix.",
    },
    {
      q: "What breaks if you run Dijkstra on a graph with negative edge weights?",
      a: "Dijkstra finalizes a node's distance the first time it pops off the heap, betting that nothing cheaper can arrive later because all remaining edges only add cost. A negative edge invalidates that bet — a longer-looking route can become cheaper further on, and the finalized distance is wrong. Bellman-Ford handles negative weights in O(V·E) by relaxing every edge V−1 times, and it also detects negative cycles. Cheapest Flights Within K Stops is actually a natural Bellman-Ford, since 'at most k stops' maps directly onto k relaxation rounds.",
    },
    {
      q: "How do you decide between greedy and dynamic programming?",
      a: "I try to produce an exchange argument for greedy: given any optimal solution, can I swap in my greedy choice without making it worse? For activity selection that argument is easy — the earliest-finishing interval leaves the most room, so there's always an optimal solution containing it. If I can't produce that argument in one sentence, I look for a counterexample. Coin Change is the classic: greedy fails on coins [1, 3, 4] for amount 6, so it's DP. I'd rather state 'I think greedy works because X, and if that doesn't hold the DP fallback is Y' than assert greedy and be wrong.",
      weak: "Greedy is faster so I try greedy first, and if the test cases fail I switch to DP.",
    },
    {
      q: "You have a knapsack-shaped DP. Why does the direction of the inner loop matter?",
      a: "Because it decides whether an item can be reused. Iterating capacity ascending means `dp[capacity - coin]` may already include the current coin, so the coin can be taken multiple times — that's unbounded knapsack, which is what Coin Change wants. Iterating descending means `dp[capacity - coin]` still refers to the state before this item was considered, so each item is used at most once — that's 0/1 knapsack, which is what Partition Equal Subset Sum wants. Same three lines of code, opposite meaning. In Python the descending loop is `range(target, num - 1, -1)`, and the `num - 1` catches people because `range`'s stop is exclusive in both directions.",
    },
    {
      q: "How do you compute the complexity of a memoized recursion?",
      a: "Number of distinct states times the work per state. For Word Break the state is a single start index, so n states, and each state loops over the remaining suffix doing a set lookup — O(n) work — giving O(n^2). For a 2D DP over two strings it's m·n states with O(1) transitions, so O(m·n). Space is the memo size plus the recursion depth, and I make sure to mention the recursion stack separately because people forget it. In Python I'd memoize with `functools.cache`, and flag two things about it: every argument has to be hashable, so mutable state stays in the closure and only indices are parameters; and the recursion depth is capped near a thousand frames, so past that I convert to a bottom-up table rather than raising the limit.",
      weak: "It's exponential without memoization and polynomial with it — probably O(n^2) or so.",
    },
    {
      q: "What's the single most common backtracking bug you'd expect a candidate to hit?",
      a: "Appending the path list into the results instead of a copy. `out.append(path)` stores a reference to a list that keeps mutating, so by the time the recursion unwinds every entry in the output is the same empty list. It has to be `out.append(path[:])` — or `list(path)`, same thing. And that copy is shallow, so if the path holds lists rather than ints, the inner objects are still shared and I'd need `copy.deepcopy`. Second place is forgetting to undo state on the way out — the `path.pop()` or restoring a mutated grid cell — which leaks a branch's choices into its siblings.",
    },
    {
      q: "The problem is a grid. Is that an array problem or a graph problem?",
      a: "Usually a graph problem in disguise: cells are nodes, and adjacent cells are edges. If the question is about connectivity, reachability, flood fill, or shortest path, I treat it as a graph and reach for DFS or BFS with a direction vector tuple. If it's about geometry — rotate, spiral, transpose — it's a traversal problem instead. For a grid, V is rows×cols and E is about 4V, so I'd quote the complexity as O(rows × cols) rather than O(V + E), because that's the form that actually communicates. The one Python detail I'd call out while writing it: bounds must be checked with `0 <= r < rows and 0 <= c < cols` before indexing, because a negative index doesn't raise — it silently wraps to the far side of the grid.",
    },
  ],
  relatedProblems: [
    "two-sum",
    "contains-duplicate",
    "valid-anagram",
    "group-anagrams",
    "top-k-frequent-elements",
    "product-of-array-except-self",
    "longest-consecutive-sequence",
    "valid-palindrome",
    "two-sum-ii-input-array-is-sorted",
    "3sum",
    "container-with-most-water",
    "trapping-rain-water",
    "best-time-to-buy-and-sell-stock",
    "longest-substring-without-repeating-characters",
    "longest-repeating-character-replacement",
    "permutation-in-string",
    "minimum-window-substring",
    "sliding-window-maximum",
    "valid-parentheses",
    "min-stack",
    "daily-temperatures",
    "car-fleet",
    "largest-rectangle-in-histogram",
    "binary-search",
    "search-a-2d-matrix",
    "koko-eating-bananas",
    "find-minimum-in-rotated-sorted-array",
    "search-in-rotated-sorted-array",
    "reverse-linked-list",
    "merge-two-sorted-lists",
    "reorder-list",
    "remove-nth-node-from-end-of-list",
    "linked-list-cycle",
    "find-the-duplicate-number",
    "lru-cache",
    "merge-k-sorted-lists",
    "invert-binary-tree",
    "diameter-of-binary-tree",
    "binary-tree-level-order-traversal",
    "binary-tree-right-side-view",
    "validate-binary-search-tree",
    "kth-smallest-element-in-a-bst",
    "binary-tree-maximum-path-sum",
    "kth-largest-element-in-an-array",
    "k-closest-points-to-origin",
    "task-scheduler",
    "find-median-from-data-stream",
    "subsets",
    "subsets-ii",
    "combination-sum",
    "permutations",
    "word-search",
    "palindrome-partitioning",
    "n-queens",
    "implement-trie-prefix-tree",
    "design-add-and-search-words-data-structure",
    "number-of-islands",
    "clone-graph",
    "rotting-oranges",
    "pacific-atlantic-water-flow",
    "course-schedule",
    "course-schedule-ii",
    "graph-valid-tree",
    "number-of-connected-components-in-an-undirected-graph",
    "redundant-connection",
    "word-ladder",
    "network-delay-time",
    "min-cost-to-connect-all-points",
    "cheapest-flights-within-k-stops",
    "climbing-stairs",
    "house-robber",
    "coin-change",
    "word-break",
    "longest-increasing-subsequence",
    "partition-equal-subset-sum",
    "unique-paths",
    "longest-common-subsequence",
    "edit-distance",
    "best-time-to-buy-and-sell-stock-with-cooldown",
    "target-sum",
    "maximum-subarray",
    "jump-game",
    "gas-station",
    "partition-labels",
    "merge-intervals",
    "insert-interval",
    "non-overlapping-intervals",
    "meeting-rooms-ii",
    "rotate-image",
    "spiral-matrix",
    "set-matrix-zeroes",
    "single-number",
    "number-of-1-bits",
    "counting-bits",
    "reverse-bits",
    "missing-number",
    "sum-of-two-integers",
  ],
};
