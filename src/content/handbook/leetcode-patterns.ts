import type { HandbookChapter } from "./types";

export const chapter: HandbookChapter = {
  slug: "leetcode-patterns",
  title: "The LeetCode Pattern Catalog",
  track: "coding",
  order: 1,
  summary:
    "Every pattern that shows up in an internship coding round, with the trigger signals that tell you to reach for it, a working TypeScript template, the complexity, and the mistakes that cost people offers.",
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

**1. Read the constraints before the story.** The input bound is a complexity budget, and the budget names the algorithm. Assume roughly 10^8 simple operations per second.

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

\`\`\`ts
function twoSumSorted(nums: number[], target: number): [number, number] | null {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return null;
}
\`\`\`

### Template: fixed anchor plus two pointers (3Sum)

\`\`\`ts
function threeSum(nums: number[]): number[][] {
  const sorted = [...nums].sort((a, b) => a - b);
  const out: number[][] = [];

  for (let i = 0; i < sorted.length - 2; i++) {
    if (sorted[i] > 0) break; // sorted, so no triple can still sum to zero
    if (i > 0 && sorted[i] === sorted[i - 1]) continue; // skip duplicate anchors

    let left = i + 1;
    let right = sorted.length - 1;
    while (left < right) {
      const sum = sorted[i] + sorted[left] + sorted[right];
      if (sum < 0) {
        left++;
      } else if (sum > 0) {
        right--;
      } else {
        out.push([sorted[i], sorted[left], sorted[right]]);
        left++;
        right--;
        while (left < right && sorted[left] === sorted[left - 1]) left++;
        while (left < right && sorted[right] === sorted[right + 1]) right--;
      }
    }
  }
  return out;
}
\`\`\`

### Template: fast & slow pointers

\`\`\`ts
interface ListNode {
  val: number;
  next: ListNode | null;
}

function hasCycle(head: ListNode | null): boolean {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow!.next; // safe: fast is ahead of slow, so slow is non-null here
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}

function middleNode(head: ListNode | null): ListNode | null {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow!.next;
    fast = fast.next.next;
  }
  return slow; // on even length this is the second middle
}
\`\`\`

Floyd's second phase — finding *where* the cycle starts — is the version people forget. After the pointers meet, reset one to the head and advance both one step at a time; they meet at the cycle entrance. This is the trick behind Find the Duplicate Number, where the array itself is the linked list (\`i -> nums[i]\`):

\`\`\`ts
function findDuplicate(nums: number[]): number {
  let slow = nums[0];
  let fast = nums[0];
  do {
    slow = nums[slow];
    fast = nums[nums[fast]];
  } while (slow !== fast);

  slow = nums[0];
  while (slow !== fast) {
    slow = nums[slow];
    fast = nums[fast];
  }
  return slow;
}
\`\`\`

### Complexity

O(n) for a single converging pass, O(n log n) if you had to sort first (3Sum is O(n^2) because of the outer anchor loop). Space is O(1) beyond the output, or O(n) if you copy the array rather than sorting in place — say which one you're doing.

### Pitfalls

- **\`left < right\` vs \`left <= right\`.** If the two pointers are indexing *different* things (pair selection), you want \`<\`; if you're scanning a whole range and each pointer can land on the same element (binary search style), you want \`<=\`. Decide out loud before you write the loop.
- **Duplicate handling.** 3Sum's entire difficulty is de-duplication. Skipping duplicates at the anchor *and* after recording a hit are two separate skips; forgetting either produces duplicate triples.
- **Mutating the caller's array.** \`nums.sort()\` sorts in place. If the problem says the input must be unchanged, copy first. Mention it either way.
- **Forgetting that sorting destroys indices.** If the answer must be *original* indices (Two Sum I), you cannot sort — that problem is a hash map problem, not a two-pointer problem. Recognizing that distinction is the point of the first two problems on every list.
- **Null checks on fast pointers.** \`fast.next.next\` throws if you only checked \`fast !== null\`. Both conditions, always.

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

\`\`\`ts
function maxSumOfSizeK(nums: number[], k: number): number {
  if (nums.length < k) return 0;

  let windowSum = 0;
  for (let i = 0; i < k; i++) windowSum += nums[i];

  let best = windowSum;
  for (let right = k; right < nums.length; right++) {
    windowSum += nums[right] - nums[right - k]; // add entering, remove leaving
    best = Math.max(best, windowSum);
  }
  return best;
}
\`\`\`

The whole idea is that entering and leaving are O(1), so the window slides in O(n) instead of O(n·k).

### Template: variable window, longest valid

Grow on the right unconditionally; shrink from the left only while the window is invalid. Record the answer after the shrink loop, when the window is guaranteed valid.

\`\`\`ts
function longestWithAtMostKDistinct(s: string, k: number): number {
  const freq = new Map<string, number>();
  let left = 0;
  let best = 0;

  for (let right = 0; right < s.length; right++) {
    const entering = s[right];
    freq.set(entering, (freq.get(entering) ?? 0) + 1);

    while (freq.size > k) {
      const leaving = s[left];
      const remaining = freq.get(leaving)! - 1;
      if (remaining === 0) freq.delete(leaving);
      else freq.set(leaving, remaining);
      left++;
    }

    best = Math.max(best, right - left + 1);
  }
  return best;
}
\`\`\`

Longest Substring Without Repeating Characters is the same skeleton, but you can jump \`left\` straight past the previous occurrence instead of shrinking one step at a time:

\`\`\`ts
function lengthOfLongestSubstring(s: string): number {
  const lastSeen = new Map<string, number>();
  let left = 0;
  let best = 0;

  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    const prev = lastSeen.get(ch);
    if (prev !== undefined && prev >= left) {
      left = prev + 1; // only jump forward; never move left backwards
    }
    lastSeen.set(ch, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
\`\`\`

### Template: variable window, shortest valid

Flip it: shrink *while* the window is valid, and record inside the shrink loop.

\`\`\`ts
function minWindow(s: string, t: string): string {
  if (t.length === 0 || s.length < t.length) return "";

  const need = new Map<string, number>();
  for (const ch of t) need.set(ch, (need.get(ch) ?? 0) + 1);

  let missing = t.length; // total characters still owed, counting multiplicity
  let left = 0;
  let bestStart = 0;
  let bestLen = Infinity;

  for (let right = 0; right < s.length; right++) {
    const entering = s[right];
    const want = need.get(entering);
    if (want !== undefined) {
      if (want > 0) missing--; // only counts if we still owed this character
      need.set(entering, want - 1); // may go negative: surplus
    }

    while (missing === 0) {
      if (right - left + 1 < bestLen) {
        bestLen = right - left + 1;
        bestStart = left;
      }
      const leaving = s[left];
      const back = need.get(leaving);
      if (back !== undefined) {
        need.set(leaving, back + 1);
        if (back + 1 > 0) missing++; // we just gave up a needed character
      }
      left++;
    }
  }

  return bestLen === Infinity ? "" : s.slice(bestStart, bestStart + bestLen);
}
\`\`\`

### Complexity

O(n) time: \`right\` advances n times and \`left\` advances at most n times total across the whole run, so the inner \`while\` is not a nested loop. Say that out loud — "the inner loop looks quadratic but each index is only consumed once, so it's amortized O(n)" — because interviewers specifically probe it. Space is O(k) or O(alphabet) for the frequency map.

### Pitfalls

- **Recording the answer in the wrong place.** Longest: after shrinking. Shortest: inside the shrink loop. Getting this backwards produces answers that are almost right, which is worse than obviously wrong.
- **Off-by-one on window length.** It is \`right - left + 1\` for an inclusive window. Write that once, correctly, and reuse it.
- **Using a window where negatives break monotonicity.** Check whether shrinking always helps before you commit.
- **Deleting vs zeroing map entries.** If your validity check is \`freq.size > k\`, you must \`delete\` at zero, not leave a zero-valued key. This is the single most common sliding-window bug.
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

Use a length \`n + 1\` array with a leading zero. It removes every boundary special case.

\`\`\`ts
function buildPrefix(nums: number[]): number[] {
  const prefix = new Array<number>(nums.length + 1).fill(0);
  for (let i = 0; i < nums.length; i++) {
    prefix[i + 1] = prefix[i] + nums[i];
  }
  return prefix;
}

// Sum of nums[l..r] inclusive, in O(1):
function rangeSum(prefix: number[], l: number, r: number): number {
  return prefix[r + 1] - prefix[l];
}
\`\`\`

### Template: prefix sum + hash map (the money combination)

Counting subarrays that sum to \`k\`: a subarray \`(l, r]\` sums to k exactly when \`prefix[r] - prefix[l] === k\`, i.e. \`prefix[l] === prefix[r] - k\`. So as you sweep, ask how many earlier prefixes equal \`running - k\`.

\`\`\`ts
function subarraySum(nums: number[], k: number): number {
  const seen = new Map<number, number>([[0, 1]]); // empty prefix seen once
  let running = 0;
  let count = 0;

  for (const num of nums) {
    running += num;
    count += seen.get(running - k) ?? 0;
    seen.set(running, (seen.get(running) ?? 0) + 1);
  }
  return count;
}
\`\`\`

The \`[[0, 1]]\` seed is what makes subarrays that start at index 0 count. Omitting it is the classic bug, and it only shows up on inputs where the answer includes a prefix of the array — so your happy-path test passes and you ship a wrong answer.

### Template: prefix and suffix passes

When "everything except me" is the ask, sweep forward accumulating, then sweep backward accumulating, and multiply.

\`\`\`ts
function productExceptSelf(nums: number[]): number[] {
  const n = nums.length;
  const out = new Array<number>(n).fill(1);

  let prefix = 1;
  for (let i = 0; i < n; i++) {
    out[i] = prefix;
    prefix *= nums[i];
  }

  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    out[i] *= suffix;
    suffix *= nums[i];
  }
  return out;
}
\`\`\`

Note the deliberate choice: the output array doesn't count as extra space by the problem's own statement, so this is O(1) auxiliary. Say that; don't let the interviewer wonder whether you noticed.

### Template: hash map counting

\`\`\`ts
function countOf<T>(items: Iterable<T>): Map<T, number> {
  const freq = new Map<T, number>();
  for (const item of items) freq.set(item, (freq.get(item) ?? 0) + 1);
  return freq;
}

function groupAnagrams(strs: string[]): string[][] {
  const groups = new Map<string, string[]>();
  for (const word of strs) {
    const counts = new Array<number>(26).fill(0);
    for (let i = 0; i < word.length; i++) {
      counts[word.charCodeAt(i) - 97]++;
    }
    const key = counts.join(","); // O(1) key build, beats sorting each word
    const bucket = groups.get(key);
    if (bucket) bucket.push(word);
    else groups.set(key, [word]);
  }
  return [...groups.values()];
}
\`\`\`

### Template: hash set for O(n) sequence detection

Longest Consecutive Sequence is the canonical "hash set removes the need to sort" problem. Only start counting from a value that has no predecessor, and the total work is linear even though there's a nested loop.

\`\`\`ts
function longestConsecutive(nums: number[]): number {
  const set = new Set(nums);
  let best = 0;

  for (const num of set) {
    if (set.has(num - 1)) continue; // not a sequence head, someone else will count it
    let length = 1;
    while (set.has(num + length)) length++;
    best = Math.max(best, length);
  }
  return best;
}
\`\`\`

The interviewer will ask why this isn't O(n^2). Answer: the inner loop only runs for sequence heads, and across all heads it visits each element exactly once — O(n) total.

### Complexity

Prefix build O(n) time / O(n) space, then O(1) per query. Hash map counting is O(n) average time, O(k) space for k distinct keys. **Average** is the operative word: hashing is O(1) expected, O(n) worst case under collisions. Interviewers rarely care, but knowing it is a differentiator.

### Pitfalls

- **Forgetting the \`{0: 1}\` seed** in the prefix + hash map counting template.
- **Prefix sums on a mutable array.** If the array changes between queries, prefix sums are wrong; you need a Fenwick/segment tree. Recognize and name the limitation.
- **Overflow.** Not a JS concern below 2^53, but say "in Java or C++ I'd worry about int overflow here" if the numbers are large — it shows you think beyond the language.
- **Objects as hash keys in JS.** \`new Map()\` keyed by an object uses reference identity, so two structurally identical coordinate objects are different keys. Serialize to a string or encode as \`r * cols + c\`.
- **Plain object vs \`Map\`.** A plain object coerces keys to strings and orders integer-like keys numerically. Use \`Map\` for anything non-trivial; it preserves insertion order and accepts any key type.

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

The recipe: define \`feasible(x): boolean\`, confirm it's monotonic (false…false, true…true), then binary search the *answer space* for the boundary.

### Template: the only one you need

\`\`\`ts
/**
 * Returns the smallest x in [lo, hi] with pred(x) === true,
 * or hi + 1 if no such x exists. pred must be monotonic:
 * false, false, ..., false, true, true, ..., true.
 */
function firstTrue(lo: number, hi: number, pred: (x: number) => boolean): number {
  let answer = hi + 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1); // avoids overflow in other languages; habit worth keeping
    if (pred(mid)) {
      answer = mid;
      hi = mid - 1; // a smaller x might also work
    } else {
      lo = mid + 1;
    }
  }
  return answer;
}
\`\`\`

Everything else falls out of this. Exact search: \`firstTrue(0, n - 1, i => nums[i] >= target)\` then check the hit. Last-true: search for first-false and subtract one, or negate the predicate.

If you prefer the classic form, here it is written so the loop invariant is explicit:

\`\`\`ts
function binarySearch(nums: number[], target: number): number {
  let lo = 0;
  let hi = nums.length - 1; // invariant: if target exists, it is in [lo, hi]
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
\`\`\`

The rule that keeps you out of infinite loops: with \`hi = nums.length - 1\` you must use \`lo <= hi\` and both branches must *move past* mid (\`mid + 1\` / \`mid - 1\`). With \`hi = nums.length\` (exclusive) you use \`lo < hi\` and the shrinking branch is \`hi = mid\`. Never mix the two.

### Template: binary search on the answer (Koko Eating Bananas)

\`\`\`ts
function minEatingSpeed(piles: number[], h: number): number {
  const hoursNeeded = (speed: number): number => {
    let total = 0;
    for (const pile of piles) total += Math.ceil(pile / speed);
    return total;
  };

  // Monotonic: faster speed never needs more hours.
  return firstTrue(1, Math.max(...piles), (speed) => hoursNeeded(speed) <= h);
}
\`\`\`

The search space is \`1 .. max(piles)\` — speeds, not indices. That reframing *is* the insight. Getting the bounds right matters: lo must be a speed that could conceivably be needed (1), hi must be one that definitely works (eat the biggest pile in one hour).

### Template: rotated sorted array

Each step, one half is guaranteed sorted. Identify it, test whether the target lies inside it, and discard accordingly.

\`\`\`ts
function searchRotated(nums: number[], target: number): number {
  let lo = 0;
  let hi = nums.length - 1;

  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] === target) return mid;

    if (nums[lo] <= nums[mid]) {
      // left half [lo, mid] is sorted
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {
      // right half [mid, hi] is sorted
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}
\`\`\`

### Template: 2D matrix as a flat sorted array

When each row is sorted and the first element of each row exceeds the last of the previous, treat the matrix as one array of length \`rows * cols\` and convert the index.

\`\`\`ts
function searchMatrix(matrix: number[][], target: number): boolean {
  const rows = matrix.length;
  const cols = matrix[0].length;
  let lo = 0;
  let hi = rows * cols - 1;

  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    const value = matrix[Math.floor(mid / cols)][mid % cols];
    if (value === target) return true;
    if (value < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return false;
}
\`\`\`

### Complexity

O(log n) for index search. For binary search on the answer it's **O(log(range) × cost of the feasibility check)** — you must state both factors. Koko is O(n log(max pile)). Space O(1).

### Pitfalls

- **\`(lo + hi) / 2\` without \`Math.floor\`** gives a fractional index in JavaScript and silently misbehaves. Use \`>> 1\` or \`Math.floor\`.
- **Infinite loops** from \`hi = mid\` paired with \`lo <= hi\`. Pick one convention and stick to it for the whole interview.
- **Searching the wrong space.** In "binary search on the answer" problems, candidates instinctively binary search the input array. Say out loud: "I'm searching over possible answers, not over indices."
- **Not verifying monotonicity.** If \`feasible\` isn't monotonic, binary search is simply wrong, not just slow. Prove it in one sentence before coding.
- **Bad bounds.** \`lo\` must be feasible-or-below, \`hi\` must be definitely-feasible. Off-by-one bounds produce answers that are right on most tests and wrong on the extremes.
- **Duplicates in a rotated array** break the "one half is sorted" test (\`nums[lo] === nums[mid]\` is ambiguous) and degrade to O(n). Mention it if duplicates are allowed.

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

### Template: merge overlapping intervals

\`\`\`ts
function mergeIntervals(intervals: number[][]): number[][] {
  if (intervals.length === 0) return [];

  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: number[][] = [[...sorted[0]]];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const [start, end] = sorted[i];
    if (start <= last[1]) {
      last[1] = Math.max(last[1], end); // Math.max matters: intervals can nest
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}
\`\`\`

\`Math.max(last[1], end)\` is the line people skip. Without it, \`[[1, 10], [2, 3]]\` merges to \`[[1, 3]]\`.

### Template: maximum non-overlapping set (sort by end)

\`\`\`ts
function eraseOverlapIntervals(intervals: number[][]): number {
  if (intervals.length === 0) return 0;

  const sorted = [...intervals].sort((a, b) => a[1] - b[1]);
  let kept = 1;
  let lastEnd = sorted[0][1];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i][0] >= lastEnd) {
      kept++;
      lastEnd = sorted[i][1];
    }
  }
  return sorted.length - kept;
}
\`\`\`

The exchange argument: the interval that finishes earliest leaves the most room for everything after it, so there is always an optimal solution containing it. That is the sentence to say.

### Template: maximum concurrency (sweep line)

\`\`\`ts
function minMeetingRooms(intervals: number[][]): number {
  const starts = intervals.map((i) => i[0]).sort((a, b) => a - b);
  const ends = intervals.map((i) => i[1]).sort((a, b) => a - b);

  let rooms = 0;
  let best = 0;
  let e = 0;

  for (let s = 0; s < starts.length; s++) {
    while (e < ends.length && ends[e] <= starts[s]) {
      rooms--; // a meeting freed a room before this one starts
      e++;
    }
    rooms++;
    best = Math.max(best, rooms);
  }
  return best;
}
\`\`\`

Decoupling the start and end arrays is legitimate because you only care about *how many* are active, never *which*. If you do need to know which, use a min-heap of end times instead.

### Template: greedy reachability

\`\`\`ts
function canJump(nums: number[]): boolean {
  let reach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > reach) return false; // there's a gap we can never cross
    reach = Math.max(reach, i + nums[i]);
  }
  return true;
}
\`\`\`

### Template: Kadane's algorithm

The bridge between greedy and DP — at each index you greedily decide whether the prefix behind you is worth keeping.

\`\`\`ts
function maxSubArray(nums: number[]): number {
  let best = nums[0];
  let current = nums[0];
  for (let i = 1; i < nums.length; i++) {
    current = Math.max(nums[i], current + nums[i]); // start fresh, or extend
    best = Math.max(best, current);
  }
  return best;
}
\`\`\`

### Complexity

Dominated by the sort: **O(n log n)** time, O(n) space for the sorted copy (or O(log n) if you sort in place and count the sort's own stack). Pure greedy sweeps with no sort are O(n) / O(1).

### Pitfalls

- **\`arr.sort()\` with no comparator sorts lexicographically.** \`[10, 9, 1].sort()\` gives \`[1, 10, 9]\`. Always pass \`(a, b) => a - b\`. This is the most common language-level bug in JavaScript interviews and interviewers notice it instantly.
- **Touching vs overlapping.** Does \`[1, 2]\` overlap \`[2, 3]\`? Ask. It flips \`<\` to \`<=\` in your merge condition and changes the answer.
- **Sorting by the wrong key.** Sorting by start for activity selection gives a wrong answer that looks right on small examples.
- **Asserting greedy without proof.** If you can't articulate the exchange argument, say "I think greedy works because…, but if that doesn't hold, the DP fallback is…". Naming the fallback is a strong signal.
- **Mutating the input.** \`sort\` is in place. Copy if the caller's array matters.

### Representative problems

Merge Intervals · Insert Interval · Non-overlapping Intervals · Meeting Rooms II · Jump Game · Maximum Subarray · Partition Labels · Gas Station · Hand of Straights`,
    },
    {
      id: "linked-lists",
      heading: "Linked List Manipulation",
      markdown: `Linked list problems are not about cleverness. They are a test of whether you can hold three pointers in your head without dropping one, and whether you reach for the two techniques that eliminate almost all edge cases: **the dummy head** and **reverse-in-place**.

### Trigger signals

- The input is a list and the constraint says **O(1) extra space** — you must rewire pointers, not copy to an array.
- "Reverse", "reorder", "merge", "remove the nth from the end", "detect a cycle", "group in k".
- You need the middle, or you need to compare the first half to the second half.

If the problem allows O(n) space, dumping the list into an array is often legitimate and much faster to write. Say so, then ask whether they want the O(1) version. Sometimes they'll accept the array.

### Technique 1: the dummy head

Any time the *head itself* might be removed or replaced, allocate a fake node in front of the list. Every node then has a predecessor, so you never need an "is this the head?" branch.

\`\`\`ts
interface ListNode {
  val: number;
  next: ListNode | null;
}

function mergeTwoLists(a: ListNode | null, b: ListNode | null): ListNode | null {
  const dummy: ListNode = { val: 0, next: null };
  let tail = dummy;

  while (a !== null && b !== null) {
    if (a.val <= b.val) {
      tail.next = a;
      a = a.next;
    } else {
      tail.next = b;
      b = b.next;
    }
    tail = tail.next;
  }

  tail.next = a ?? b; // whichever still has nodes; both null is fine
  return dummy.next;
}
\`\`\`

### Technique 2: reverse in place

Three pointers, one loop. Write this from memory; it appears inside half of all list problems (palindrome check, reorder, reverse in k-groups, add two numbers).

\`\`\`ts
function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let curr = head;

  while (curr !== null) {
    const next: ListNode | null = curr.next; // save before you clobber it
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev; // prev is the new head
}
\`\`\`

The \`const next = curr.next\` line is the entire trick: you're about to overwrite \`curr.next\`, so you have to stash it first or you lose the rest of the list.

### Technique 3: gap pointers

To find the nth node from the end in one pass, put two pointers \`n + 1\` apart and walk them together until the leader falls off.

\`\`\`ts
function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {
  const dummy: ListNode = { val: 0, next: head };
  let lead: ListNode | null = dummy;
  let trail = dummy;

  for (let i = 0; i <= n; i++) lead = lead!.next; // open a gap of n + 1
  while (lead !== null) {
    lead = lead.next;
    trail = trail.next!;
  }

  trail.next = trail.next!.next; // trail sits just before the target
  return dummy.next;
}
\`\`\`

The dummy is what makes "remove the head" work without a special case, and the \`i <= n\` (not \`i < n\`) is what puts \`trail\` on the *predecessor*. Trace it on a two-node list before you claim it works.

### Composite example: reorder list

Most hard list problems are three easy techniques stacked. Reorder List = find the middle, reverse the second half, interleave.

\`\`\`ts
function reorderList(head: ListNode | null): void {
  if (head === null || head.next === null) return;

  // 1. Find the middle.
  let slow = head;
  let fast: ListNode | null = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next!;
    fast = fast.next.next;
  }

  // 2. Split and reverse the second half.
  let second = slow.next;
  slow.next = null;
  let prev: ListNode | null = null;
  while (second !== null) {
    const next: ListNode | null = second.next;
    second.next = prev;
    prev = second;
    second = next;
  }

  // 3. Interleave the two halves.
  let first: ListNode | null = head;
  let back: ListNode | null = prev;
  while (back !== null) {
    const firstNext: ListNode | null = first!.next;
    const backNext: ListNode | null = back.next;
    first!.next = back;
    back.next = firstNext;
    first = firstNext;
    back = backNext;
  }
}
\`\`\`

Announcing that decomposition before you write anything — "this is three sub-problems I already know" — is worth more than the code.

### Complexity

O(n) time for all of the above; O(1) space for pointer rewiring, O(n) if you copy to an array or recurse (the call stack counts, and a recursive list reversal is O(n) stack — mention it).

### Pitfalls

- **Losing the rest of the list.** Always save \`next\` before you overwrite it.
- **Not cutting the list when you split.** In Reorder List, forgetting \`slow.next = null\` leaves a cycle and your interleave loop never terminates.
- **Off-by-one on the middle.** For even lengths, \`slow\` lands on the *second* middle with the loop above. Decide which one you need and check it on a 4-node list.
- **Missing base cases.** Empty list, single node, and (for k-group problems) a final partial group. Every list problem should start with "let me handle null and single-node".
- **TypeScript non-null assertions.** \`!\` is fine and idiomatic in list code where you've already proven non-null by loop condition, but use it deliberately, not as a way to silence the compiler you don't understand.

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

### Template: plain stack

\`\`\`ts
function isValid(s: string): boolean {
  const closers: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const stack: string[] = [];

  for (const ch of s) {
    if (ch === "(" || ch === "[" || ch === "{") {
      stack.push(ch);
    } else if (stack.pop() !== closers[ch]) {
      return false; // also covers popping from an empty stack (undefined)
    }
  }
  return stack.length === 0; // leftovers mean unclosed brackets
}
\`\`\`

The final \`stack.length === 0\` is the check people forget: \`"((("\` has no mismatches, but it isn't valid.

### Template: stack carrying auxiliary state (Min Stack)

When you need O(1) access to an aggregate over the stack, push the aggregate alongside the value.

\`\`\`ts
class MinStack {
  private values: number[] = [];
  private mins: number[] = [];

  push(val: number): void {
    this.values.push(val);
    const currentMin =
      this.mins.length === 0 ? val : Math.min(val, this.mins[this.mins.length - 1]);
    this.mins.push(currentMin);
  }

  pop(): void {
    this.values.pop();
    this.mins.pop();
  }

  top(): number {
    return this.values[this.values.length - 1];
  }

  getMin(): number {
    return this.mins[this.mins.length - 1];
  }
}
\`\`\`

### Template: monotonic stack (next greater element)

\`\`\`ts
function dailyTemperatures(temps: number[]): number[] {
  const answer = new Array<number>(temps.length).fill(0);
  const stack: number[] = []; // indices; their temperatures strictly decrease

  for (let i = 0; i < temps.length; i++) {
    while (stack.length > 0 && temps[i] > temps[stack[stack.length - 1]]) {
      const j = stack.pop()!;
      answer[j] = i - j; // i is the first day warmer than day j
    }
    stack.push(i);
  }
  return answer; // anything still on the stack never found a warmer day: 0
}
\`\`\`

Store **indices**, not values, so you can compute distances. That's the single most useful habit in this pattern.

### Template: monotonic stack with sentinel (Largest Rectangle in Histogram)

\`\`\`ts
function largestRectangleArea(heights: number[]): number {
  const stack: number[] = []; // indices with increasing heights
  let best = 0;

  for (let i = 0; i <= heights.length; i++) {
    const current = i === heights.length ? 0 : heights[i]; // sentinel drains the stack
    while (stack.length > 0 && heights[stack[stack.length - 1]] >= current) {
      const height = heights[stack.pop()!];
      const leftBoundary = stack.length === 0 ? -1 : stack[stack.length - 1];
      best = Math.max(best, height * (i - leftBoundary - 1));
    }
    stack.push(i);
  }
  return best;
}
\`\`\`

Two ideas worth stating aloud: the sentinel iteration at \`i === heights.length\` forces every remaining bar to be resolved, and \`leftBoundary\` is whatever is *below* the popped bar on the stack — which is by construction the nearest shorter bar to its left.

### Template: monotonic deque (Sliding Window Maximum)

A window's maximum can't be maintained with a plain stack, because the max can leave the window. A deque holding indices in decreasing value order handles both ends.

\`\`\`ts
function maxSlidingWindow(nums: number[], k: number): number[] {
  const deque: number[] = []; // indices, values decreasing
  const out: number[] = [];
  let head = 0; // manual head index; avoids O(n) Array.shift()

  for (let i = 0; i < nums.length; i++) {
    while (deque.length > head && nums[deque[deque.length - 1]] <= nums[i]) {
      deque.pop(); // smaller values can never be the max again
    }
    deque.push(i);

    if (deque[head] <= i - k) head++; // front slid out of the window

    if (i >= k - 1) out.push(nums[deque[head]]);
  }
  return out;
}
\`\`\`

### Complexity

O(n) for every template here, even though there's a nested \`while\`. The accounting argument: **each index is pushed at most once and popped at most once**, so total stack operations are bounded by 2n. Say exactly that when asked — it's the same amortized reasoning as sliding window.

Space is O(n) worst case (a strictly increasing input never pops).

### Pitfalls

- **Pushing values instead of indices**, then being unable to compute a distance.
- **\`>\` vs \`>=\` in the pop condition.** With duplicates, one choice gives you the *nearest* boundary and the other the *farthest*. For Largest Rectangle either works (equal bars resolve each other correctly), but for "count of distinct next-greater" problems it changes the answer. Decide and justify.
- **Forgetting the drain.** Elements left on the stack at the end still need their default answer, or you need a sentinel pass.
- **\`Array.prototype.shift()\` in a queue/deque.** It's O(n) in JavaScript, turning your O(n) algorithm into O(n^2). Use a head index or swap in a real deque.
- **Empty-stack access.** \`stack[stack.length - 1]\` on an empty array is \`undefined\`, and comparisons against \`undefined\` are always false — a bug that silently produces wrong output rather than throwing.

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

### JavaScript has no built-in priority queue

This is a real constraint, not trivia. Python has \`heapq\`, Java has \`PriorityQueue\`, C++ has \`priority_queue\`. In TypeScript you write one. Interviewers know this and most will let you assume a heap exists — **ask**: *"I'd use a min-heap here. Do you want me to implement it, or can I assume a standard priority queue?"* That question alone reads as experienced. If they say implement it, this is the code:

\`\`\`ts
class MinHeap<T> {
  private items: T[] = [];

  constructor(private readonly compare: (a: T, b: T) => number) {}

  get size(): number {
    return this.items.length;
  }

  peek(): T | undefined {
    return this.items[0];
  }

  push(item: T): void {
    this.items.push(item);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.compare(this.items[i], this.items[parent]) >= 0) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  pop(): T | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0];
    const last = this.items.pop()!;

    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      const n = this.items.length;
      for (;;) {
        const left = 2 * i + 1;
        const right = left + 1;
        let smallest = i;
        if (left < n && this.compare(this.items[left], this.items[smallest]) < 0) {
          smallest = left;
        }
        if (right < n && this.compare(this.items[right], this.items[smallest]) < 0) {
          smallest = right;
        }
        if (smallest === i) break;
        this.swap(i, smallest);
        i = smallest;
      }
    }
    return top;
  }

  private swap(a: number, b: number): void {
    const tmp = this.items[a];
    this.items[a] = this.items[b];
    this.items[b] = tmp;
  }
}
\`\`\`

The index math is the part to memorize: children of \`i\` are \`2i + 1\` and \`2i + 2\`; the parent of \`i\` is \`(i - 1) >> 1\`.

### Template: top-k with a bounded heap

The counterintuitive move: to find the k **largest**, keep a **min**-heap of size k. The smallest of your current best-k sits at the top, ready to be evicted.

\`\`\`ts
function topKFrequent(nums: number[], k: number): number[] {
  const freq = new Map<number, number>();
  for (const num of nums) freq.set(num, (freq.get(num) ?? 0) + 1);

  const heap = new MinHeap<[number, number]>((a, b) => a[1] - b[1]); // by count
  for (const entry of freq) {
    heap.push(entry);
    if (heap.size > k) heap.pop(); // evict the weakest of the current top-k
  }

  const out: number[] = [];
  while (heap.size > 0) out.push(heap.pop()![0]);
  return out.reverse(); // heap drains ascending; caller usually wants descending
}
\`\`\`

Also know the **bucket sort** alternative for this specific problem: counts are bounded by \`n\`, so you can bucket by frequency and read the buckets from the top for O(n) total. Offering both, and naming the tradeoff (O(n) time but O(n) extra buckets, and it only works because the key is a bounded integer) is a strong-hire moment.

### Template: two heaps for a running median

Max-heap for the lower half, min-heap for the upper half, kept balanced within one element. The median is either the top of the larger heap or the average of both tops.

\`\`\`ts
class MedianFinder {
  private lower = new MinHeap<number>((a, b) => b - a); // max-heap via inverted comparator
  private upper = new MinHeap<number>((a, b) => a - b);

  addNum(num: number): void {
    if (this.lower.size === 0 || num <= this.lower.peek()!) this.lower.push(num);
    else this.upper.push(num);

    // Rebalance so that lower.size is equal to or one greater than upper.size.
    if (this.lower.size > this.upper.size + 1) {
      this.upper.push(this.lower.pop()!);
    } else if (this.upper.size > this.lower.size) {
      this.lower.push(this.upper.pop()!);
    }
  }

  findMedian(): number {
    if (this.lower.size > this.upper.size) return this.lower.peek()!;
    return (this.lower.peek()! + this.upper.peek()!) / 2;
  }
}
\`\`\`

Inverting the comparator to turn a min-heap into a max-heap is worth pointing out explicitly — it's the cheapest way to avoid writing two classes.

### Complexity

| Operation | Cost |
| --- | --- |
| \`push\` / \`pop\` | O(log n) |
| \`peek\` | O(1) |
| Build heap from n items (heapify) | O(n), not O(n log n) |
| Top-k with a size-k heap | O(n log k) time, O(k) space |
| Top-k by full sort | O(n log n) time |
| Merge k sorted lists of total N nodes | O(N log k) |

When k is small relative to n, \`n log k\` beats \`n log n\` meaningfully, and the O(k) space matters if the stream doesn't fit in memory. That's the argument for a heap over sorting — make it explicitly rather than asserting "heaps are faster".

### Pitfalls

- **Wrong heap polarity.** k largest wants a min-heap; k smallest wants a max-heap. Getting it backwards works on the first test case and fails on the second.
- **Assuming ordered iteration.** A heap's array is *not* sorted beyond the root invariant. \`heap.items\` is not the answer; you must pop repeatedly.
- **Comparator sign errors.** \`(a, b) => a - b\` is a min-heap on numbers. For tuples, be explicit about which field and which direction.
- **Not handling ties.** "K most frequent" with ties usually accepts any valid answer — confirm rather than over-engineering a tiebreak.
- **Reaching for a heap when a sort or quickselect is better.** If the data is static and you need all of it ordered, sort. If you need only the kth element once, quickselect is O(n) average.
- **Mutating heap entries in place.** Changing a value already inside the heap breaks the invariant. Push a new entry and skip stale ones on pop (this is exactly what Dijkstra does).

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

\`\`\`ts
interface TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
}
\`\`\`

### Trigger signals

- The word **tree**, **subtree**, **ancestor**, **depth**, **path**.
- **BST specifically:** the problem mentions sorted order, kth smallest, search, or "valid BST". BST means *use the ordering* — if your solution would work on any binary tree, you've left the log factor on the table.
- **Levels:** "level order", "each row", "closest to the root", "width".
- **Trie:** the input is a set of **words** and the queries are about **prefixes**.

### Template: the three DFS traversals

\`\`\`ts
function inorder(node: TreeNode | null, out: number[] = []): number[] {
  if (node === null) return out;
  inorder(node.left, out);
  out.push(node.val); // preorder: push before the recursion; postorder: after both
  inorder(node.right, out);
  return out;
}
\`\`\`

Know what each is *for*, not just the order: **preorder** serializes a tree (root first, so you can rebuild top-down), **inorder on a BST yields sorted values**, **postorder** processes children before parents (deletion, and any bottom-up aggregation).

The iterative inorder is worth memorizing because it's the basis of Kth Smallest in a BST and of the BST iterator:

\`\`\`ts
function inorderIterative(root: TreeNode | null): number[] {
  const out: number[] = [];
  const stack: TreeNode[] = [];
  let curr = root;

  while (curr !== null || stack.length > 0) {
    while (curr !== null) {
      stack.push(curr);
      curr = curr.left; // dive left, remembering the way back
    }
    curr = stack.pop()!;
    out.push(curr.val);
    curr = curr.right;
  }
  return out;
}
\`\`\`

### Template: bottom-up DFS with a captured accumulator

The pattern: the recursive function returns one thing (height), while a closure variable accumulates a different thing (the best answer seen anywhere).

\`\`\`ts
function diameterOfBinaryTree(root: TreeNode | null): number {
  let best = 0;

  const height = (node: TreeNode | null): number => {
    if (node === null) return 0;
    const left = height(node.left);
    const right = height(node.right);
    best = Math.max(best, left + right); // path through this node
    return 1 + Math.max(left, right); // height reported to the parent
  };

  height(root);
  return best;
}
\`\`\`

Binary Tree Maximum Path Sum is the same skeleton with one extra rule — a child contributes only if its contribution is positive:

\`\`\`ts
function maxPathSum(root: TreeNode | null): number {
  let best = -Infinity;

  const gain = (node: TreeNode | null): number => {
    if (node === null) return 0;
    const left = Math.max(gain(node.left), 0); // drop negative branches
    const right = Math.max(gain(node.right), 0);
    best = Math.max(best, node.val + left + right);
    return node.val + Math.max(left, right); // a path can only use one side going up
  };

  gain(root);
  return best;
}
\`\`\`

The line to say out loud: *"a path through this node can use both children, but the value I return upward can only use one, because the parent needs a single chain."* That distinction is the entire problem.

### Template: BFS by level

\`\`\`ts
function levelOrder(root: TreeNode | null): number[][] {
  if (root === null) return [];

  const levels: number[][] = [];
  let queue: TreeNode[] = [root];

  while (queue.length > 0) {
    const values: number[] = [];
    const next: TreeNode[] = [];
    for (const node of queue) {
      values.push(node.val);
      if (node.left !== null) next.push(node.left);
      if (node.right !== null) next.push(node.right);
    }
    levels.push(values);
    queue = next; // swap generations instead of shift()-ing
  }
  return levels;
}
\`\`\`

Building a fresh \`next\` array per level avoids \`Array.prototype.shift()\`, which is O(n) in JavaScript and would make this O(n^2). It also gives you level boundaries for free — you don't need to snapshot \`queue.length\` before the loop. Right Side View is this function taking the last element of each \`values\`.

### Template: BST validation with bounds

The instinct is to compare each node to its immediate children. That's wrong: a node deep in the left subtree can still violate the root's bound. Carry the interval down.

\`\`\`ts
function isValidBST(root: TreeNode | null): boolean {
  const check = (node: TreeNode | null, low: number, high: number): boolean => {
    if (node === null) return true;
    if (node.val <= low || node.val >= high) return false;
    return check(node.left, low, node.val) && check(node.right, node.val, high);
  };
  return check(root, -Infinity, Infinity);
}
\`\`\`

### Using BST ordering

The two moves that separate a BST solution from a generic tree solution:

\`\`\`ts
// LCA in a BST: descend while both targets are on the same side. O(h), not O(n).
function lowestCommonAncestor(root: TreeNode, p: number, q: number): TreeNode {
  let node = root;
  for (;;) {
    if (p < node.val && q < node.val) node = node.left!;
    else if (p > node.val && q > node.val) node = node.right!;
    else return node; // the split point, or one of the targets
  }
}

// Kth smallest: inorder is sorted, so stop as soon as you've counted k.
function kthSmallest(root: TreeNode | null, k: number): number {
  const stack: TreeNode[] = [];
  let curr = root;
  let remaining = k;

  while (curr !== null || stack.length > 0) {
    while (curr !== null) {
      stack.push(curr);
      curr = curr.left;
    }
    curr = stack.pop()!;
    remaining--;
    if (remaining === 0) return curr.val;
    curr = curr.right;
  }
  return -1;
}
\`\`\`

### Template: trie

A trie moves the cost of lookup from "size of the dictionary" to "length of the key", and it's the only structure that makes *prefix* queries cheap.

\`\`\`ts
class TrieNode {
  readonly children = new Map<string, TrieNode>();
  isWord = false;
}

class Trie {
  private readonly root = new TrieNode();

  insert(word: string): void {
    let node = this.root;
    for (const ch of word) {
      let next = node.children.get(ch);
      if (next === undefined) {
        next = new TrieNode();
        node.children.set(ch, next);
      }
      node = next;
    }
    node.isWord = true;
  }

  private walk(prefix: string): TrieNode | null {
    let node = this.root;
    for (const ch of prefix) {
      const next = node.children.get(ch);
      if (next === undefined) return null;
      node = next;
    }
    return node;
  }

  search(word: string): boolean {
    const node = this.walk(word);
    return node !== null && node.isWord;
  }

  startsWith(prefix: string): boolean {
    return this.walk(prefix) !== null;
  }
}
\`\`\`

The \`isWord\` flag is what distinguishes "this is a stored word" from "this is a prefix of one". Wildcard search (\`.\` matching any character) is the same walk with a branch: on \`.\`, recurse into every child.

### Complexity

| Operation | Cost |
| --- | --- |
| Tree DFS / BFS | O(n) time |
| DFS recursion space | O(h) — O(log n) balanced, **O(n) skewed** |
| BFS space | O(w), the maximum level width — up to n/2 for a full tree |
| BST search / insert / LCA | O(h): O(log n) balanced, O(n) degenerate |
| Trie insert / search / startsWith | O(L) in the key length, independent of dictionary size |
| Trie space | O(total characters × alphabet branching) |

Always state the recursion stack as part of space complexity. "O(1) extra space" is wrong for a recursive traversal.

### Pitfalls

- **Comparing only to immediate children** when validating a BST.
- **Assuming a BST is balanced.** Unless the problem guarantees it, h can be n. Say "O(h), which is O(log n) if balanced and O(n) in the worst case".
- **\`shift()\` on the BFS queue** — O(n) per call.
- **Forgetting the null base case**, or checking \`node.left === null && node.right === null\` when you meant \`node === null\`. Leaf-vs-null confusion is the reason Minimum Depth trips people up: a node with one child is not a leaf.
- **Mutating a shared path array without undoing.** In root-to-leaf path collection, \`path.push(...)\` must be paired with \`path.pop()\`, and you must copy (\`[...path]\`) when recording a result.
- **Using a trie when a hash set would do.** If there are no prefix queries, a \`Set\` is simpler, faster, and less memory. Choosing a trie you don't need is a design mistake, not a flourish.

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

Every backtracking solution is the same four lines wrapped around a loop: **choose, explore, un-choose**.

\`\`\`ts
function subsets(nums: number[]): number[][] {
  const out: number[][] = [];
  const path: number[] = [];

  const backtrack = (start: number): void => {
    out.push([...path]); // copy! path keeps mutating underneath you

    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]); // choose
      backtrack(i + 1); // explore, from i + 1 so we never look backwards
      path.pop(); // un-choose
    }
  };

  backtrack(0);
  return out;
}
\`\`\`

The \`start\` parameter is what makes this generate *combinations* (order-insensitive) rather than permutations. Change \`i + 1\` to \`i\` and the same element can be reused — that's Combination Sum:

\`\`\`ts
function combinationSum(candidates: number[], target: number): number[][] {
  const out: number[][] = [];
  const path: number[] = [];

  const backtrack = (start: number, remaining: number): void => {
    if (remaining === 0) {
      out.push([...path]);
      return;
    }
    if (remaining < 0) return; // prune: overshooting can never recover

    for (let i = start; i < candidates.length; i++) {
      path.push(candidates[i]);
      backtrack(i, remaining - candidates[i]); // i, not i + 1: reuse allowed
      path.pop();
    }
  };

  backtrack(0, target);
  return out;
}
\`\`\`

### Template: permutations (used-set instead of a start index)

Permutations care about order, so every unused element is a candidate at every level.

\`\`\`ts
function permute(nums: number[]): number[][] {
  const out: number[][] = [];
  const path: number[] = [];
  const used = new Array<boolean>(nums.length).fill(false);

  const backtrack = (): void => {
    if (path.length === nums.length) {
      out.push([...path]);
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(nums[i]);
      backtrack();
      path.pop();
      used[i] = false; // both undos, in reverse order
    }
  };

  backtrack();
  return out;
}
\`\`\`

### Handling duplicates

When the input contains duplicates and you must not emit duplicate results: **sort first**, then skip a candidate that equals its predecessor *at the same decision level*.

\`\`\`ts
function subsetsWithDup(nums: number[]): number[][] {
  const sorted = [...nums].sort((a, b) => a - b);
  const out: number[][] = [];
  const path: number[] = [];

  const backtrack = (start: number): void => {
    out.push([...path]);
    for (let i = start; i < sorted.length; i++) {
      if (i > start && sorted[i] === sorted[i - 1]) continue; // same level, same value
      path.push(sorted[i]);
      backtrack(i + 1);
      path.pop();
    }
  };

  backtrack(0);
  return out;
}
\`\`\`

\`i > start\` (not \`i > 0\`) is the crux: you're skipping repeats among *siblings*, not among ancestors. Getting this wrong drops legitimate answers like \`[1, 1]\`.

### Template: backtracking on a grid

Mark the cell as visited by mutating it, then restore it. This avoids allocating a visited set per path.

\`\`\`ts
function exist(board: string[][], word: string): boolean {
  const rows = board.length;
  const cols = board[0].length;

  const dfs = (r: number, c: number, i: number): boolean => {
    if (i === word.length) return true;
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    if (board[r][c] !== word[i]) return false;

    const saved = board[r][c];
    board[r][c] = "#"; // mark visited for this path only
    const found =
      dfs(r + 1, c, i + 1) ||
      dfs(r - 1, c, i + 1) ||
      dfs(r, c + 1, i + 1) ||
      dfs(r, c - 1, i + 1);
    board[r][c] = saved; // restore on the way out

    return found;
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (dfs(r, c, 0)) return true;
    }
  }
  return false;
}
\`\`\`

Note the ordering: the \`i === word.length\` success check comes *before* the bounds check, so a word ending on the last cell still succeeds.

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

Distinguish auxiliary space (recursion depth) from output space, and say which you're quoting.

### Pitfalls

- **Pushing \`path\` instead of \`[...path]\`.** You end up with an array of references to the same array, which by the end is empty. This is the number-one backtracking bug and it produces spectacularly confusing output.
- **Forgetting to un-choose**, or un-choosing in the wrong order when there are two pieces of state.
- **\`i > 0\` instead of \`i > start\`** in duplicate skipping.
- **Recursing before checking bounds** on grid problems, causing an index error rather than a clean false.
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

\`\`\`ts
function buildAdjacency(n: number, edges: number[][], directed: boolean): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    if (!directed) adj[v].push(u); // forgetting this is the classic bug
  }
  return adj;
}

const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
\`\`\`

Hoisting the direction vectors out of the loop keeps grid code readable and stops you from writing four near-identical recursive calls.

### Template: grid DFS (flood fill / connected components)

\`\`\`ts
function numIslands(grid: string[][]): number {
  const rows = grid.length;
  if (rows === 0) return 0;
  const cols = grid[0].length;

  const sink = (r: number, c: number): void => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    if (grid[r][c] !== "1") return;
    grid[r][c] = "0"; // mark visited by mutation; no separate visited set needed
    for (const [dr, dc] of DIRECTIONS) sink(r + dr, c + dc);
  };

  let islands = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === "1") {
        islands++;
        sink(r, c);
      }
    }
  }
  return islands;
}
\`\`\`

Mutating the grid to mark visited is standard and worth flagging: *"I'm sinking the island as I go instead of keeping a visited set — that's O(1) extra space, but it destroys the input. Is that acceptable?"*

### Template: BFS with levels (multi-source works too)

Seed the queue with *every* source and the same code computes the minimum distance from the nearest source — that's Rotting Oranges, Walls and Gates, and 01-Matrix in one template.

\`\`\`ts
function minutesToRotAll(grid: number[][]): number {
  const rows = grid.length;
  const cols = grid[0].length;

  let queue: Array<[number, number]> = [];
  let fresh = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) queue.push([r, c]); // every rotten orange is a source
      else if (grid[r][c] === 1) fresh++;
    }
  }

  let minutes = 0;
  while (queue.length > 0 && fresh > 0) {
    const next: Array<[number, number]> = [];
    for (const [r, c] of queue) {
      for (const [dr, dc] of DIRECTIONS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (grid[nr][nc] !== 1) continue;
        grid[nr][nc] = 2;
        fresh--;
        next.push([nr, nc]);
      }
    }
    queue = next;
    minutes++;
  }

  return fresh === 0 ? minutes : -1;
}
\`\`\`

**Mark visited when you enqueue, not when you dequeue.** Marking on dequeue lets the same node enter the queue several times and the complexity degrades.

### Template: topological sort (Kahn's algorithm)

\`\`\`ts
function topoSort(n: number, prerequisites: number[][]): number[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  const indegree = new Array<number>(n).fill(0);

  for (const [course, prereq] of prerequisites) {
    adj[prereq].push(course); // edge points prereq -> course
    indegree[course]++;
  }

  const order: number[] = [];
  for (let i = 0; i < n; i++) {
    if (indegree[i] === 0) order.push(i);
  }

  // Treat the output array as the queue; head walks forward, no shift() needed.
  for (let head = 0; head < order.length; head++) {
    for (const next of adj[order[head]]) {
      indegree[next]--;
      if (indegree[next] === 0) order.push(next);
    }
  }

  return order.length === n ? order : []; // short order means a cycle
}
\`\`\`

The cycle detection falls out for free: if you can't drain every node, some nodes never reached indegree zero, which means they're in a cycle. Course Schedule is \`topoSort(...).length === n\`.

### Template: union-find (disjoint set union)

\`\`\`ts
class UnionFind {
  private readonly parent: number[];
  private readonly rank: number[];
  count: number;

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array<number>(n).fill(0);
    this.count = n;
  }

  find(x: number): number {
    let node = x;
    while (this.parent[node] !== node) {
      this.parent[node] = this.parent[this.parent[node]]; // path halving
      node = this.parent[node];
    }
    return node;
  }

  /** Returns false if a and b were already connected (this edge closes a cycle). */
  union(a: number, b: number): boolean {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) return false;

    if (this.rank[rootA] < this.rank[rootB]) {
      this.parent[rootA] = rootB;
    } else if (this.rank[rootA] > this.rank[rootB]) {
      this.parent[rootB] = rootA;
    } else {
      this.parent[rootB] = rootA;
      this.rank[rootA]++;
    }
    this.count--;
    return true;
  }
}
\`\`\`

Both optimizations matter: **union by rank** keeps trees shallow, **path compression** flattens them on lookup. Together they give near-constant amortized time (inverse Ackermann, α(n), which is at most 4 for any input you'll ever see). Without them, \`find\` degrades to O(n).

The \`union\` return value is the whole answer to Redundant Connection and Graph Valid Tree: the first edge that returns \`false\` is the one creating a cycle.

### Template: Dijkstra

\`\`\`ts
/** adj[u] holds [neighbor, weight] pairs. Weights must be non-negative. */
function dijkstra(n: number, adj: Array<Array<[number, number]>>, source: number): number[] {
  const dist = new Array<number>(n).fill(Infinity);
  dist[source] = 0;

  const heap = new MinHeap<[number, number]>((a, b) => a[0] - b[0]); // [distance, node]
  heap.push([0, source]);

  while (heap.size > 0) {
    const [d, node] = heap.pop()!;
    if (d > dist[node]) continue; // stale entry: we already found something better

    for (const [next, weight] of adj[node]) {
      const candidate = d + weight;
      if (candidate < dist[next]) {
        dist[next] = candidate;
        heap.push([candidate, next]);
      }
    }
  }
  return dist;
}
\`\`\`

The \`if (d > dist[node]) continue\` line is how you avoid needing a decrease-key operation: you push duplicates and skip the outdated ones. Explaining that is a genuine differentiator.

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
- **Recursive DFS blowing the stack** on a 10^5-node graph or a large grid. If depth could be huge, use an explicit stack and say why.
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

In an interview, write the recursion first. It's easier to derive, easier to explain, and the tabulation is a mechanical rewrite if you have time. Interviewers accept memoized recursion as a complete answer.

\`\`\`ts
function wordBreak(s: string, wordDict: string[]): boolean {
  const words = new Set(wordDict);
  const memo = new Map<number, boolean>(); // state: the start index

  const canBreak = (start: number): boolean => {
    if (start === s.length) return true;
    const cached = memo.get(start);
    if (cached !== undefined) return cached;

    let result = false;
    for (let end = start + 1; end <= s.length; end++) {
      if (words.has(s.slice(start, end)) && canBreak(end)) {
        result = true;
        break;
      }
    }
    memo.set(start, result);
    return result;
  };

  return canBreak(0);
}
\`\`\`

State count is n, each state does O(n) slices, so O(n^2) states-times-transitions (plus the cost of the substring hashing).

### 1D DP: rolling variables

When the recurrence only reaches back a fixed number of cells, you don't need the array at all.

\`\`\`ts
function rob(nums: number[]): number {
  let skip = 0; // best total if we did NOT take the previous house
  let take = 0; // best total if we DID take the previous house

  for (const value of nums) {
    const nextTake = skip + value; // taking now requires having skipped before
    const nextSkip = Math.max(skip, take); // skipping now: keep the better history
    take = nextTake;
    skip = nextSkip;
  }
  return Math.max(take, skip);
}
\`\`\`

Naming the two variables after what they *mean* rather than \`dp1\`/\`dp2\` is worth real communication points — the interviewer can now follow you without asking.

### 1D DP with a full table: unbounded knapsack

Coin Change is the canonical "min cost to reach a target, unlimited items" problem.

\`\`\`ts
function coinChange(coins: number[], amount: number): number {
  const dp = new Array<number>(amount + 1).fill(Infinity);
  dp[0] = 0; // zero coins make zero

  for (let target = 1; target <= amount; target++) {
    for (const coin of coins) {
      if (coin <= target && dp[target - coin] + 1 < dp[target]) {
        dp[target] = dp[target - coin] + 1;
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
\`\`\`

O(amount × coins) time, O(amount) space. Note this is *not* greedy — taking the largest coin first fails on \`coins = [1, 3, 4], amount = 6\` (greedy gives 4+1+1 = 3 coins; the answer is 3+3 = 2). Having that counterexample ready is how you shut down "why not just be greedy?"

### 0/1 knapsack: the loop direction is the whole trick

Each item may be used once. Iterate the capacity **descending** so an item can't be re-consumed within the same pass.

\`\`\`ts
function canPartition(nums: number[]): boolean {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % 2 !== 0) return false;

  const target = total / 2;
  const dp = new Array<boolean>(target + 1).fill(false);
  dp[0] = true;

  for (const num of nums) {
    for (let sum = target; sum >= num; sum--) {
      // Descending: dp[sum - num] still refers to the previous item's row.
      if (dp[sum - num]) dp[sum] = true;
    }
  }
  return dp[target];
}
\`\`\`

**Ascending capacity = unbounded knapsack (reuse allowed). Descending = 0/1 knapsack (each item once.)** That one line of understanding covers Coin Change, Coin Change II, Target Sum, and Partition Equal Subset Sum.

### 2D DP: the grid recurrence

Two sequences, or a grid, means a 2D table where \`dp[i][j]\` answers "the prefix of length i against the prefix of length j".

\`\`\`ts
function longestCommonSubsequence(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1 // characters match: extend the diagonal
          : Math.max(dp[i - 1][j], dp[i][j - 1]); // drop one character from either side
    }
  }
  return dp[a.length][b.length];
}
\`\`\`

The \`+1\` row and column of zeros is the same trick as the prefix-sum sentinel: it removes every boundary special case. Edit Distance is this table with three transitions instead of two (insert, delete, replace), and it's worth writing both so you see they're the same machine.

### State machine DP

When the problem has *modes* — holding a stock, in cooldown, free to buy — make the mode part of the state and write one transition per mode.

\`\`\`ts
function maxProfitWithCooldown(prices: number[]): number {
  let holding = -Infinity; // best profit while holding a share
  let justSold = -Infinity; // best profit on the day we sold (tomorrow is cooldown)
  let resting = 0; // best profit while free to buy

  for (const price of prices) {
    const prevHolding = holding;
    const prevJustSold = justSold;
    const prevResting = resting;

    holding = Math.max(prevHolding, prevResting - price); // keep holding, or buy today
    justSold = prevHolding + price; // sell today
    resting = Math.max(prevResting, prevJustSold); // stay free, or come off cooldown
  }
  return Math.max(justSold, resting); // never end still holding
}
\`\`\`

Snapshotting the previous values before updating is mandatory — using the freshly-updated \`holding\` inside the \`justSold\` line silently lets you buy and sell on the same day.

### When DP meets binary search: LIS in O(n log n)

The O(n^2) LIS DP is fine to state, but knowing the patience-sorting version is a real differentiator.

\`\`\`ts
function lengthOfLIS(nums: number[]): number {
  // tails[k] = the smallest possible tail of an increasing subsequence of length k + 1
  const tails: number[] = [];

  for (const num of nums) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = lo + ((hi - lo) >> 1);
      if (tails[mid] < num) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = num; // replace the first tail >= num, or append
  }
  return tails.length;
}
\`\`\`

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
- **Optimizing space before the recurrence is right.** Get the 2D table correct, verify it, *then* roll it to 1D if there's time. Rolling early hides bugs.
- **\`Array(n).fill([])\`** creates n references to the *same* array. Use \`Array.from({ length: n }, () => [])\`. This bites people in 2D DP constantly.
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

\`\`\`ts
const isBitSet = (x: number, i: number): boolean => (x & (1 << i)) !== 0;
const setBit = (x: number, i: number): number => x | (1 << i);
const clearBit = (x: number, i: number): number => x & ~(1 << i);
const toggleBit = (x: number, i: number): number => x ^ (1 << i);
const lowestSetBit = (x: number): number => x & -x; // isolates it
const dropLowestSetBit = (x: number): number => x & (x - 1); // clears it
const isPowerOfTwo = (x: number): boolean => x > 0 && (x & (x - 1)) === 0;
\`\`\`

The XOR identities carry most of the problems: \`a ^ a === 0\`, \`a ^ 0 === a\`, and XOR is commutative and associative. Therefore XOR-ing an entire array where every value appears twice except one leaves exactly the odd one out.

\`\`\`ts
function singleNumber(nums: number[]): number {
  let accumulator = 0;
  for (const num of nums) accumulator ^= num;
  return accumulator;
}

function hammingWeight(n: number): number {
  let count = 0;
  let x = n;
  while (x !== 0) {
    x &= x - 1; // clears the lowest set bit, so this loops once per set bit
    count++;
  }
  return count;
}

function countBits(n: number): number[] {
  const dp = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    dp[i] = dp[i >> 1] + (i & 1); // i's bits = (i without its last bit) + that bit
  }
  return dp;
}
\`\`\`

\`countBits\` is worth studying: it's a DP recurrence expressed in bit operations, and the \`i >> 1\` subproblem is always already computed.

### Bitmask subset enumeration

For n ≤ 20, every subset is an integer from 0 to 2^n − 1.

\`\`\`ts
function subsetsByBitmask(nums: number[]): number[][] {
  const out: number[][] = [];
  const total = 1 << nums.length;

  for (let mask = 0; mask < total; mask++) {
    const subset: number[] = [];
    for (let i = 0; i < nums.length; i++) {
      if ((mask & (1 << i)) !== 0) subset.push(nums[i]);
    }
    out.push(subset);
  }
  return out;
}
\`\`\`

### JavaScript-specific gotchas

These matter, and interviewers who know JS will check:

- **Bitwise operators coerce to 32-bit signed integers.** \`1 << 31\` is negative, and any value above 2^31 − 1 wraps. If you need the top bit as unsigned, use \`>>> 0\`.
- **\`>>\` is arithmetic (sign-preserving), \`>>>\` is logical (zero-filling).** For Reverse Bits and any loop over 32 bits of a possibly-negative number, use \`>>>\`.
- **\`Number\` is a float.** Bit tricks silently break above 2^32, so say "this assumes 32-bit integers, which the constraints guarantee."

## Matrix traversal

### Trigger signals

- The input is a 2D grid and the answer is about **geometry** — rotate, transpose, spiral, diagonal — rather than search. (Search on a grid is a graph problem; see the graphs section.)
- An **in-place** or **O(1) extra space** constraint on a matrix operation.

### Template: layer-by-layer spiral

Four boundaries, shrink after each edge, and re-check the boundaries before the two return passes.

\`\`\`ts
function spiralOrder(matrix: number[][]): number[] {
  const out: number[] = [];
  if (matrix.length === 0) return out;

  let top = 0;
  let bottom = matrix.length - 1;
  let left = 0;
  let right = matrix[0].length - 1;

  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) out.push(matrix[top][c]);
    top++;

    for (let r = top; r <= bottom; r++) out.push(matrix[r][right]);
    right--;

    if (top <= bottom) {
      for (let c = right; c >= left; c--) out.push(matrix[bottom][c]);
      bottom--;
    }

    if (left <= right) {
      for (let r = bottom; r >= top; r--) out.push(matrix[r][left]);
      left++;
    }
  }
  return out;
}
\`\`\`

The two guarded blocks are not optional. On a single-row matrix, without \`if (top <= bottom)\` you walk the same row back and emit duplicates.

### Template: rotate in place = transpose + reverse

\`\`\`ts
function rotate(matrix: number[][]): void {
  const n = matrix.length;

  // Transpose: swap across the main diagonal. c starts at r + 1 so you
  // don't swap every pair twice and undo yourself.
  for (let r = 0; r < n; r++) {
    for (let c = r + 1; c < n; c++) {
      const tmp = matrix[r][c];
      matrix[r][c] = matrix[c][r];
      matrix[c][r] = tmp;
    }
  }

  for (const row of matrix) row.reverse(); // reflect horizontally
}
\`\`\`

Two reflections compose into a rotation. Counter-clockwise is transpose plus *reverse the column order* (i.e. \`matrix.reverse()\`).

### Template: using the matrix itself as scratch space (Set Matrix Zeroes)

The O(1)-space version uses row 0 and column 0 as the flag arrays, with two booleans to remember their own original state.

\`\`\`ts
function setZeroes(matrix: number[][]): void {
  const rows = matrix.length;
  const cols = matrix[0].length;

  let firstRowHasZero = false;
  let firstColHasZero = false;
  for (let c = 0; c < cols; c++) if (matrix[0][c] === 0) firstRowHasZero = true;
  for (let r = 0; r < rows; r++) if (matrix[r][0] === 0) firstColHasZero = true;

  // Pass 1: record which rows and columns need zeroing, in the margins.
  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      if (matrix[r][c] === 0) {
        matrix[r][0] = 0;
        matrix[0][c] = 0;
      }
    }
  }

  // Pass 2: apply, interior first — the margins are still holding flags.
  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      if (matrix[r][0] === 0 || matrix[0][c] === 0) matrix[r][c] = 0;
    }
  }

  if (firstRowHasZero) for (let c = 0; c < cols; c++) matrix[0][c] = 0;
  if (firstColHasZero) for (let r = 0; r < rows; r++) matrix[r][0] = 0;
}
\`\`\`

The ordering is the whole problem: zero the margins first and you've destroyed the flags you were about to read.

### Complexity

Every template here is O(rows × cols) time. Space is O(1) for in-place versions, O(rows × cols) for the output when one is required. Bit operations are O(1); bitmask enumeration is O(2^n · n).

### Pitfalls

- **Assuming the matrix is square.** \`matrix.length\` is rows, \`matrix[0].length\` is columns, and they differ. Rotate-in-place only works on a square.
- **Not checking for an empty matrix** — \`matrix[0].length\` throws on \`[]\`.
- **Transposing with \`c\` from 0**, which swaps each pair twice and leaves the matrix unchanged.
- **Row/column index swaps.** Use \`r\`/\`c\` rather than \`i\`/\`j\`; the naming alone prevents a whole class of bug and reads better.
- **Bitwise operators on values above 2^31 in JavaScript.**
- **Using \`Math.pow(2, i)\` where \`1 << i\` is meant** — fine numerically, but it signals you don't actually think in bits.

### Representative problems

Single Number · Number of 1 Bits · Counting Bits · Reverse Bits · Missing Number · Sum of Two Integers · Rotate Image · Spiral Matrix · Set Matrix Zeroes`,
    },
  ],
  questions: [
    {
      q: "The array has up to 10^5 elements. What does that tell you before you've even read the problem?",
      a: "That O(n^2) is out — 10^10 operations won't finish — so I'm targeting O(n log n) or O(n). Practically that means sorting, a heap, binary search, a hash map, or a single pass with two pointers or a sliding window. I'd say that out loud early, because it prunes the search space for both of us and shows I'm reasoning from constraints instead of guessing.",
      weak: "It means it's a big input so I should try to be efficient.",
    },
    {
      q: "When is a sliding window the wrong tool for a 'longest subarray' problem?",
      a: "When the validity condition isn't monotonic under shrinking. A window works because if a window is invalid, extending it further can't fix it, and shrinking eventually makes it valid. 'Longest subarray with sum exactly k' with negative numbers breaks that: shrinking can move the sum either direction, so there's no direction to slide. That one is prefix sums plus a hash map. The check I run is: does removing an element from the left always move me toward validity?",
      weak: "You can always use a sliding window on a subarray problem, you just have to be careful with the pointers.",
    },
    {
      q: "Your sliding window has a while loop inside a for loop. Isn't that O(n^2)?",
      a: "No — it's O(n). The left pointer only ever moves forward and it can move at most n times across the entire run, so the total work of the inner loop is bounded by n regardless of how it's distributed. That's an amortized argument: each index enters the window once and leaves once. The same reasoning applies to monotonic stacks, where every index is pushed once and popped once.",
      weak: "It looks like O(n^2) but in practice the inner loop doesn't run much, so it's closer to O(n).",
    },
    {
      q: "Explain how you'd recognize a 'binary search on the answer' problem, and how you'd set it up.",
      a: "Two signals: the problem asks me to minimize a maximum or maximize a minimum, and I can't compute the answer directly but I *can* cheaply check whether a given candidate works. Koko Eating Bananas is the archetype — I can't derive the right eating speed, but given a speed I can total the hours in O(n). Setup is: write a boolean `feasible(x)`, convince myself it's monotonic (if speed 5 works, so does 6), pick bounds where lo is definitely too small or the minimum legal value and hi is definitely large enough, then binary search for the boundary. Complexity is log of the range times the cost of the check.",
    },
    {
      q: "You write `const mid = (lo + hi) / 2` in a JavaScript binary search. What's wrong?",
      a: "It produces a fraction, so `nums[mid]` is `undefined` and every comparison silently goes false. I'd write `lo + ((hi - lo) >> 1)`. The shift floors it, and the `lo + (hi - lo)` form is a habit from languages where `lo + hi` can overflow a 32-bit int — it costs nothing to keep the habit here.",
      weak: "It should be `Math.floor((lo + hi) / 2)` because of integer overflow.",
    },
    {
      q: "Why is `arr.sort()` a bug in JavaScript?",
      a: "The default comparator converts elements to strings and sorts lexicographically, so `[10, 9, 1].sort()` gives `[1, 10, 9]`. You need `arr.sort((a, b) => a - b)` for numbers. It's also in place, so if the caller's array matters I copy first with `[...arr].sort(...)`. And the sort is stable in modern V8, which matters if I'm sorting by a secondary key first.",
      weak: "It sorts ascending by default, which is usually what you want.",
    },
    {
      q: "What's the difference between a monotonic stack and a plain stack, and what problems does it solve?",
      a: "A plain stack just gives last-in-first-out. A monotonic stack additionally maintains an ordering invariant — say indices whose values strictly decrease. The payoff is that when a new element breaks the invariant, every element it pops has just found its 'next greater element,' so you resolve them in O(1) each. It turns the O(n^2) 'for each element, scan right until something bigger' brute force into O(n). Signals are next greater/smaller, span, and histogram problems. I always store indices, not values, so I can compute distances.",
    },
    {
      q: "You need the k largest elements. Would you use a max-heap or a min-heap, and why?",
      a: "A min-heap of size k. It sounds backwards, but the point is that the *smallest* of my current best-k sits at the root where I can evict it in O(log k) as better candidates arrive. A max-heap of everything would work but costs O(n) space and O(n log n) to drain. The min-heap version is O(n log k) time and O(k) space, which matters when k is small or the data is a stream that doesn't fit in memory. For Top K Frequent specifically I'd also mention bucket sort by frequency, which is O(n).",
      weak: "A max-heap, because I want the largest elements and a max-heap gives you the largest one first.",
    },
    {
      q: "Why can't you use DFS to find the shortest path in an unweighted graph?",
      a: "DFS commits to a branch and goes deep, so the first time it reaches the target it has found *a* path, not the shortest — it might have wandered a long way around. BFS explores in order of distance from the source, so the first time it touches a node, that's the minimum number of edges. If I wanted DFS to give the shortest path I'd have to explore every path and take the minimum, which is exponential. For weighted graphs BFS stops working too, and I'd go to Dijkstra.",
      weak: "You can use DFS, you just have to track the depth and keep the minimum — it's the same complexity.",
    },
    {
      q: "Walk me through why union-find is nearly O(1) per operation.",
      a: "Two optimizations. Union by rank always hangs the shorter tree under the taller one, so depth grows logarithmically at worst rather than linearly. Path compression flattens the path on every `find` — each node you walk past gets repointed closer to the root, so the work amortizes across future calls. Together the amortized cost is O(α(n)), the inverse Ackermann function, which is at most 4 for any n that fits in memory. Without either optimization, `find` degrades to O(n) on a chain.",
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
      a: "Because it decides whether an item can be reused. Iterating capacity ascending means `dp[sum - coin]` may already include the current coin, so the coin can be taken multiple times — that's unbounded knapsack, which is what Coin Change wants. Iterating descending means `dp[sum - coin]` still refers to the state before this item was considered, so each item is used at most once — that's 0/1 knapsack, which is what Partition Equal Subset Sum wants. Same three lines of code, opposite meaning.",
    },
    {
      q: "How do you compute the complexity of a memoized recursion?",
      a: "Number of distinct states times the work per state. For Word Break the state is a single start index, so n states, and each state loops over the remaining suffix doing a set lookup — O(n) work — giving O(n^2). For a 2D DP over two strings it's m·n states with O(1) transitions, so O(m·n). Space is the memo size plus the recursion depth, and I make sure to mention the recursion stack separately because people forget it.",
      weak: "It's exponential without memoization and polynomial with it — probably O(n^2) or so.",
    },
    {
      q: "What's the single most common backtracking bug you'd expect a candidate to hit?",
      a: "Pushing the path array into the results instead of a copy. `out.push(path)` stores a reference to an array that keeps mutating, so by the time the recursion unwinds every entry in the output is the same empty array. It has to be `out.push([...path])`. Second place is forgetting to undo state on the way out — the `path.pop()` or restoring a mutated grid cell — which leaks a branch's choices into its siblings.",
    },
    {
      q: "The problem is a grid. Is that an array problem or a graph problem?",
      a: "Usually a graph problem in disguise: cells are nodes, and adjacent cells are edges. If the question is about connectivity, reachability, flood fill, or shortest path, I treat it as a graph and reach for DFS or BFS with a direction vector array. If it's about geometry — rotate, spiral, transpose — it's a traversal problem instead. For a grid, V is rows×cols and E is about 4V, so I'd quote the complexity as O(rows × cols) rather than O(V + E), because that's the form that actually communicates.",
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
