import type { HandbookChapter } from "./types";

export const chapter: HandbookChapter = {
  slug: "complexity-and-ds",
  title: "Complexity & Data Structures",
  track: "coding",
  order: 2,
  summary:
    "How to derive the time and space cost of code you just wrote, and the internals of every data structure an intern interview will touch. The reference you reach for when the interviewer says \"and what's the complexity?\"",
  estMinutes: 75,
  tags: [
    "big-o",
    "amortized-analysis",
    "recursion",
    "hash-maps",
    "heaps",
    "trees",
    "tries",
    "graphs",
    "sorting",
    "space-complexity",
  ],
  sections: [
    {
      id: "what-big-o-means",
      heading: "What Big-O actually means",
      markdown: `Big-O is a statement about how a function grows, not about how fast your code is. Given two functions on the input size n:

- **O(f(n))** — asymptotic **upper** bound. T(n) is O(f(n)) if there exist constants c > 0 and n0 such that T(n) <= c * f(n) for all n >= n0. "Grows no faster than."
- **Omega(f(n))** — asymptotic **lower** bound. T(n) >= c * f(n) beyond some n0. "Grows at least as fast as."
- **Theta(f(n))** — **tight** bound: both O and Omega. "Grows exactly like, up to constants."

Because O is only an upper bound, saying merge sort is O(n^2) is technically *true* and useless. What you mean is Theta(n log n). Interviewers say "big-O" and mean "tight bound" — that's fine, everyone does it — but know the difference, because it comes up the moment someone asks whether an algorithm is "at least" some cost.

### Worst case and big-O are orthogonal

This is the single most common conceptual error. **Big-O is about growth. Worst/average/best case is about which input you're measuring.** They are independent axes, and you can combine them freely:

| | best case | average case | worst case |
| --- | --- | --- | --- |
| quicksort | Theta(n log n) | Theta(n log n) | Theta(n^2) |
| hash map get | Theta(1) | Theta(1) | Theta(n) |
| insertion sort | Theta(n) | Theta(n^2) | Theta(n^2) |

"O(n^2) is the worst case of quicksort" conflates the two. The precise statement: *the worst-case running time of quicksort is Theta(n^2)*. You can also say the best case is Omega(n log n). When you state a complexity in an interview, name the case out loud — "O(n log n) average, O(n^2) worst if the pivots are adversarial" is a hire-signal sentence.

### Dropping constants and lower-order terms

3n^2 + 200n + 5000 is Theta(n^2). The 200n is dominated for large n, and the 3 is a constant factor that depends on your language, your CPU, and your compiler — asymptotics deliberately abstract it away so the analysis survives being ported from C to Python.

When constants actually matter:

- **Fixed n.** If n is always ~50, an O(n^2) array scan with tiny constants beats an O(n log n) structure with pointer chasing and allocation. This is why real sort implementations switch to insertion sort below ~16 elements.
- **Memory hierarchy.** A cache-friendly O(n) scan can outrun a cache-hostile O(log n) tree walk at surprisingly large n. A cache miss is ~100x an L1 hit.
- **Hidden constants in the notation.** A "O(n)" solution that allocates a new object per element is not the same O(n) as one that mutates in place.
- **Two solutions with the same big-O.** Once you've matched asymptotics, constants are the entire remaining conversation.

Don't lead with constants. Get the asymptotics right, then mention the constant factor as a refinement — that ordering is what signals you understand which one dominates.

### Growth-rate ordering

O(1) < O(log n) < O(sqrt n) < O(n) < O(n log n) < O(n^2) < O(n^3) < O(2^n) < O(n!)

Log base doesn't matter (change of base is a constant factor), which is why nobody writes log2.

### The "arithmetic is O(1)" assumption, and where Python breaks it

Every complexity claim above quietly assumes a comparison or an addition costs O(1). In C or Java that holds because integers are a fixed 32 or 64 bits. **Python's \`int\` is arbitrary precision**, which changes two things:

- **The classic overflow bugs do not exist.** \`(lo + hi) // 2\` in a binary search never overflows, so the famous \`lo + (hi - lo) // 2\` defensive rewrite is unnecessary in Python. Neither does a running sum, a factorial, or \`2 ** 1000\`. If an interviewer asks about overflow, the correct answer is that Python doesn't have it — and then that \`float\` very much does, because it is still an IEEE 754 double: 53 bits of mantissa, so \`10**16 + 1.0\` loses the 1, \`0.1 + 0.2 != 0.3\`, and converting a large \`int\` to \`float\` silently rounds. Mixing \`int\` and \`float\` in a comparison-heavy algorithm is where that bites.
- **In exchange, arithmetic is not free on big numbers.** Adding two d-digit integers is O(d) and multiplying is O(d^1.58) via Karatsuba. For the values in a normal interview problem, d is 1 machine word and the O(1) assumption is fine — but if the problem is "compute the 10^6-th Fibonacci number," the answer has ~200,000 digits and the additions dominate, so "O(n) with memoization" is wrong. Say "O(n) arithmetic operations" when the numbers can get large; it is the precise claim and it shows you noticed.

### Reading the constraints backwards

Competitive programmers and good interviewers both plant the intended complexity in the input bounds. Assume roughly 1e8 simple operations per second as a mental budget:

| max n | target complexity | what that usually means |
| --- | --- | --- |
| n <= 12 | O(n!) | enumerate permutations |
| n <= 20 | O(2^n), O(2^n * n) | subset enumeration, bitmask DP, backtracking |
| n <= 100 | O(n^4) / O(n^3) | 3D DP, all-pairs work |
| n <= 500 | O(n^3) | Floyd-Warshall, interval DP |
| n <= 3000 | O(n^2) | pairwise DP, 2D table, O(n^2) two-pointer |
| n <= 1e5 | O(n log n) | sort, heap, binary search, balanced tree |
| n <= 1e6 | O(n) or O(n log n) with a small constant | single pass, counting sort, hashing |
| n <= 1e7 | O(n) | one tight linear scan, no allocation per element |
| n >= 1e9 | O(log n) or O(1) | binary search on the answer, closed-form math |

Train the reflex: read the constraints *before* you start designing. "n is up to 10^5, so I need n log n or better — that rules out the O(n^2) pair loop and points at sorting or a hash map" is a sentence that buys you credit in the first two minutes.`,
    },
    {
      id: "deriving-complexity-from-loops",
      heading: "Deriving complexity from loops",
      markdown: `Complexity analysis of iterative code is counting: how many times does the innermost statement run, as a function of n?

### Independent nested loops multiply

\`\`\`python
for i in range(n):
    for j in range(m):
        work()  # O(1)
\`\`\`

O(n * m). If m == n, O(n^2). Say "n times m" rather than "n squared" when the two bounds are different variables — grid problems are O(rows * cols), and calling that O(n^2) hides which dimension is large.

### Multiplicative increments give logs

\`\`\`python
i = 1
while i < n:
    work()
    i *= 2
\`\`\`

i takes the values 1, 2, 4, ..., so the loop runs log2(n) times: O(log n). The general rule — if the loop variable is *multiplied* or *divided* by a constant factor each step, you get a log; if it's incremented by a constant, you get a linear count. Python has no C-style \`for\`, so a multiplicative loop is always a \`while\` — which is a useful tell when you're reading someone else's code for complexity.

Combine them and you get the n log n shape:

\`\`\`python
i = 1
while i <= n:            # O(log n) iterations
    for _ in range(n):   # O(n) each
        work()
    i *= 2
\`\`\`

O(n log n).

### Inner bound depending on the outer index

\`\`\`python
for i in range(n):
    for j in range(i, n):
        work()
\`\`\`

The inner loop runs n, then n-1, then n-2, ... down to 1. The total is

n + (n-1) + ... + 1 = n(n+1)/2 = (n^2 + n)/2

which is Theta(n^2). This is the arithmetic-series argument and you should be able to produce it on demand — interviewers love it precisely because the naive answer ("half of n^2, so O(n)?") is wrong. **Halving a quadratic is still quadratic.** The constant 1/2 drops.

The same sum appears when the *inner* loop is bounded by i rather than starting at i: 0 + 1 + 2 + ... + (n-1) = n(n-1)/2, also Theta(n^2).

### Sequential blocks add, then the max wins

\`\`\`python
a.sort()        # O(n log n)
for x in a:     # O(n)
    work(x)
\`\`\`

O(n log n + n) = O(n log n). Addition then domination — this matters when you're tempted to say "I sort and then do a linear pass, so it's O(n)."

### The hidden linear operation inside a loop

This is where most wrong answers come from. The loop body *looks* O(1) and isn't:

| Written | Actual cost per call | Loop becomes |
| --- | --- | --- |
| \`out += s[i]\` in a loop (strings are immutable) | O(len(out)) copy | O(n^2) |
| \`lst.pop(0)\` / \`lst.insert(0, x)\` | O(n) memmove | O(n^2) |
| \`x in lst\` / \`lst.index(x)\` / \`lst.count(x)\` | O(n) scan | O(n^2) |
| \`lst[i:]\` / \`s[i:]\` slicing | O(n) copy | O(n^2) |
| \`set(lst)\` / \`sorted(lst)\` built inside the loop | O(n) / O(n log n) | O(n^2) / O(n^2 log n) |
| \`max(lst)\` / \`min(lst)\` / \`sum(lst)\` | O(n) | O(n^2) |
| \`lst.remove(x)\` / \`del lst[i]\` | O(n) find plus O(n) shift | O(n^2) |

\`x in lst\` versus \`x in some_set\` is the one that catches people: the syntax is identical and the complexity is not. \`in\` on a \`list\` or \`tuple\` is a linear scan; \`in\` on a \`set\`, \`frozenset\`, or \`dict\` is a hash lookup.

\`\`\`python
# O(n^2): a fresh set per iteration.
for i in range(n):
    if a[i] in set(a):
        count += 1

# O(n): hoist the set out.
seen = set(a)
for i in range(n):
    if a[i] in seen:
        count += 1
\`\`\`

The fix for string building is always the same: append to a list and \`"".join(...)\` once, which is O(n) total.

\`\`\`python
parts: list[str] = []
for ch in s:
    parts.append(transform(ch))
out = "".join(parts)

# Or, idiomatically, skip the loop entirely.
out = "".join(transform(ch) for ch in s)
\`\`\`

CPython has a special case that sometimes makes \`out += ch\` look O(1): if the string has a refcount of 1 it can resize in place. It is an implementation detail, it disappears the moment anything else holds a reference, and it does not exist on PyPy or other runtimes. Never rely on it — \`join\` is the answer, and saying "\`+=\` in a loop is quadratic in the general case" is the answer an interviewer wants.

When you state a complexity, say the sentence "the body is O(1) because ..." out loud. If you can't finish that sentence, you have a hidden linear operation.`,
    },
    {
      id: "recursion-trees-and-master-theorem",
      heading: "Recursion: recursion trees and the Master Theorem",
      markdown: `A recursive function's cost is a recurrence. There are two ways to solve one in an interview: draw the tree, or pattern-match the Master Theorem.

### Recursion trees

Draw the call tree. At each level, ask two things: **how much work happens at this level in total**, and **how many levels are there?** Multiply, or sum if the per-level work varies.

Merge sort, T(n) = 2T(n/2) + O(n):

\`\`\`
level 0:  1 call  x  n work        = n
level 1:  2 calls x  n/2 work      = n
level 2:  4 calls x  n/4 work      = n
...
level k:  2^k calls x n/2^k work   = n
\`\`\`

Every level costs n. The tree has log2(n) + 1 levels because you halve until you hit size 1. Total: n * log n, so Theta(n log n).

Now change the merge to O(1) and it becomes T(n) = 2T(n/2) + O(1): levels cost 1, 2, 4, ..., n, dominated by the *leaves*, giving Theta(n). Same shape, completely different answer — which is exactly why you sum per level instead of guessing.

### Master Theorem

For T(n) = a * T(n/b) + f(n) with a >= 1, b > 1, compare f(n) against n^(log_b a) — the leaf work:

1. **f(n) grows polynomially slower** than n^(log_b a): T(n) = Theta(n^(log_b a)). Leaves dominate.
2. **f(n) = Theta(n^(log_b a))**: T(n) = Theta(n^(log_b a) * log n). Every level costs the same.
3. **f(n) grows polynomially faster** (plus a regularity condition): T(n) = Theta(f(n)). The root dominates.

Applied:

| Recurrence | a, b | n^(log_b a) | f(n) | Case | Result |
| --- | --- | --- | --- | --- | --- |
| merge sort: 2T(n/2) + O(n) | 2, 2 | n^1 | n | 2 | Theta(n log n) |
| binary search: T(n/2) + O(1) | 1, 2 | n^0 = 1 | 1 | 2 | Theta(log n) |
| binary tree traversal: 2T(n/2) + O(1) | 2, 2 | n | 1 | 1 | Theta(n) |
| naive multiply split: 4T(n/2) + O(n) | 4, 2 | n^2 | n | 1 | Theta(n^2) |
| Karatsuba: 3T(n/2) + O(n) | 3, 2 | n^1.585 | n | 1 | Theta(n^1.585) |
| Strassen: 7T(n/2) + O(n^2) | 7, 2 | n^2.807 | n^2 | 1 | Theta(n^2.807) |

The Karatsuba line is the payoff worth internalizing: doing *fewer subproblems of the same size* is what buys the speedup, not making the combine step cheaper. Going from 4 recursive multiplications to 3 changes the exponent.

### The recurrences the Master Theorem doesn't cover

The Master Theorem needs subproblems of size n/b. Interview recursion frequently subtracts instead:

| Recurrence | Shape | Solution | Typical source |
| --- | --- | --- | --- |
| T(n) = T(n-1) + O(1) | linear chain, constant work | Theta(n) | linked-list recursion, simple countdown |
| T(n) = T(n-1) + O(n) | linear chain, linear work | Theta(n^2) | recursive selection sort, string slicing per frame |
| T(n) = 2T(n-1) + O(1) | binary tree of depth n | Theta(2^n) | naive subsets, Towers of Hanoi |
| T(n) = T(n-1) + T(n-2) + O(1) | Fibonacci tree | Theta(phi^n) ~ Theta(1.618^n) | naive fib |
| T(n) = n * T(n-1) + O(n) | permutation tree | Theta(n!) | generating permutations |

For T(n) = 2T(n-1) + O(1): each level doubles the number of calls and there are n levels, so 1 + 2 + 4 + ... + 2^(n-1) = 2^n - 1.

### States times transitions — the DP complexity formula

This is the most useful single tool in the section. Memoization turns an exponential recursion into:

**total cost = (number of distinct states) x (work done per state, excluding recursive calls)**

Because each state's body runs exactly once; every later hit is an O(1) cache read. Space is (number of distinct states) for the memo, plus the recursion depth for the stack.

Apply it mechanically. Look at the parameters of your recursive function, bound the product of their ranges — that's the state count. Then count the work inside one call — usually the number of transitions (the branching factor of the loop over choices).

| Problem | State | State count | Work per state | Total |
| --- | --- | --- | --- | --- |
| Fibonacci | i | n | O(1) | O(n) |
| climbing-stairs | i | n | O(1) | O(n) |
| coin-change | remaining amount | A | O(coins) | O(A * coins) |
| 0/1 knapsack | (item index, capacity) | n * W | O(1) | O(n * W) |
| edit distance | (i, j) | n * m | O(1) | O(n * m) |
| longest increasing subsequence (DP) | i | n | O(n) inner scan | O(n^2) |
| TSP bitmask | (mask, last city) | 2^n * n | O(n) | O(2^n * n^2) |

Naive fib is Theta(1.618^n) because it has ~1.618^n *calls* over only n distinct states. Memoizing collapses it to n states x O(1) work = O(n). Saying "n states, O(1) transition, so O(n) time and O(n) space" is exactly how you're expected to phrase it.`,
    },
    {
      id: "amortized-analysis",
      heading: "Amortized analysis",
      markdown: `Amortized cost is the *average cost per operation over a worst-case sequence of operations*. It is not the average over random inputs. That distinction is the whole question when an interviewer asks about it.

| Term | What it averages over | Guarantee |
| --- | --- | --- |
| worst case | a single operation | holds always |
| average case | a probability distribution over inputs | holds in expectation; a bad input can break it |
| amortized | a sequence of operations, worst case over sequences | holds always, over the sequence |

Amortized is a *worst-case* statement. A hash map is O(1) *average* (an adversary can make it O(n)); a dynamic array push is O(1) *amortized* (no adversary can make n pushes cost more than O(n) total). Candidates use these interchangeably and it's an easy differentiator.

### Dynamic array push: the aggregate argument

A dynamic array holds a backing buffer with a capacity. Push writes into the next slot: O(1). When capacity is exhausted, allocate a buffer of **twice** the capacity, copy everything over, then write: O(n) for that one push.

Count the total copying across n pushes starting from capacity 1. Resizes happen at sizes 1, 2, 4, 8, ..., up to the largest power of two below n, and each copies that many elements:

1 + 2 + 4 + ... + n/2 < n

Total copy work across all n pushes is under n, so total work is under 2n, so **amortized O(1) per push**. The key fact is that the geometric series sums to a constant multiple of its largest term — doubling means the expensive operations get exponentially rarer at exactly the rate their cost grows.

The banker's version: charge each push 3 units of currency. 1 pays for writing the element; 2 go into savings on that slot. When the array doubles, every element in the old half has 2 saved units, which pays to copy itself and one element from the previous generation. Savings never go negative, so the true cost never exceeds 3n.

### Why the growth factor must be multiplicative

Grow by a **fixed +1** slot instead and you resize on every push, copying 1 + 2 + ... + n = n(n+1)/2 elements: **O(n) amortized per push**, O(n^2) total. Grow by a fixed +k and it's still O(n^2), just with a 1/k constant. Any constant factor > 1 works, and real implementations trade memory overhead against copy frequency: CPython's \`list\` over-allocates to roughly \`n + n // 8 + 6\` slots (a growth factor of about **1.125**, the most conservative of the mainstream implementations), C++ \`std::vector\` uses 1.5x on libstdc++ and 2x on MSVC, Java's \`ArrayList\` uses 1.5x.

The small factor is why the doubling story is worth stating as a *geometric series* argument rather than a doubling argument: 1.125 is nowhere near 2, and the analysis is identical because all that matters is that the factor exceeds 1.

Note the asymmetry: growth is amortized O(1), but a *single* push still has O(n) worst case. That matters for latency-sensitive systems, which is why some real-time allocators use incremental copying instead.

### "Each element enters and leaves at most once"

This is the accounting argument you actually use in interviews, and it justifies most of the O(n) solutions in the pattern catalog. If every element can be added to a structure at most once and removed at most once, the total work across the whole run is O(n) even though a single iteration can do O(n) work.

**Monotonic stack** (daily-temperatures, largest-rectangle-in-histogram):

\`\`\`python
def daily_temperatures(temps: list[int]) -> list[int]:
    res = [0] * len(temps)
    stack: list[int] = []  # indices, temperatures decreasing
    for i, t in enumerate(temps):
        while stack and t > temps[stack[-1]]:
            j = stack.pop()
            res[j] = i - j
        stack.append(i)
    return res
\`\`\`

A plain \`list\` is the correct stack in Python: \`append\` and \`pop()\` both act on the end, both are O(1) amortized. Reach for \`collections.deque\` only when you need the *other* end too.

The inner \`while\` can pop n-1 elements in one iteration, so the *worst single iteration* is O(n). But each index is pushed exactly once and popped at most once, so the total number of pops across the entire outer loop is at most n. Total: **O(n)**. Saying "the inner loop is O(n) so this is O(n^2)" is the classic wrong answer; saying "amortized O(1) per iteration because every element is pushed once and popped once" is the right one.

**Sliding window / two pointers**: \`left\` and \`right\` each only ever move forward, and each is bounded by n, so total pointer movement is at most 2n regardless of how the inner \`while\` loop is shaped. Same argument, same conclusion: O(n).

**Union-find with path compression + union by rank**: m operations on n elements cost O(m * alpha(n)), where alpha is the inverse Ackermann function — below 5 for any n you will ever see, so it's effectively O(1) amortized per operation. A single \`find\` can still walk a long path; the compression pays for it.

**Hash map rehashing**: same doubling argument as the dynamic array. Rehashing n elements costs O(n) but only happens after O(n) insertions since the last rehash.`,
    },
    {
      id: "space-complexity",
      heading: "Space complexity",
      markdown: `Space is scored the same way as time and forgotten twice as often. Two definitions:

- **Total space** — everything the program uses, including the input.
- **Auxiliary space** — everything *beyond* the input. This is what people mean by "the space complexity."

By convention the output is excluded too, but **say so out loud**: "O(1) auxiliary space, not counting the output array" is precise; "O(1) space" while you're building an n-element result is wrong on its face.

### The call stack is space

Every recursive frame holds parameters, locals, and a return address. Recursion depth is space.

| Recursion | Depth | Auxiliary space |
| --- | --- | --- |
| DFS on a balanced binary tree | O(log n) | O(log n) |
| DFS on a skewed / linked-list-shaped tree | O(n) | O(n) |
| DFS on a graph (path in the recursion) | O(V) | O(V) plus O(V) visited |
| binary search, recursive | O(log n) | O(log n) |
| binary search, iterative | — | O(1) |
| merge sort | O(log n) stack + O(n) merge buffer | O(n) |
| quicksort, recursing on the smaller side first | O(log n) | O(log n) |
| quicksort, naive | O(n) worst case | O(n) |

Two consequences interviewers probe:

1. **"Your recursive solution is O(1) space" is almost never true.** If it recurses to depth d, it is O(d). A recursive tree DFS is O(h) where h is the height — O(log n) if balanced, O(n) if not, and you don't get to assume balance unless the problem says so.
2. **In-place does not mean O(1) space.** Quicksort sorts in place — it swaps within the array and allocates no buffer — yet it is O(log n) space because of the recursion stack. "In-place" describes the data movement; the stack is separate.

The Morris traversal exists specifically to get a genuinely O(1)-space in-order tree walk by temporarily rewiring \`None\` right pointers. Worth knowing it exists; rarely worth writing.

Also: **Python's recursion limit is 1000 frames by default** (\`sys.getrecursionlimit()\`), and exceeding it raises \`RecursionError: maximum recursion depth exceeded\`. That is far lower than most people expect — a recursive DFS over a 10^4-node path-shaped graph dies, never mind 10^5. \`sys.setrecursionlimit(10**6)\` raises the *Python* guard but not the underlying C stack, so a deep enough recursion then segfaults the interpreter instead of raising. The safe move for large n is to convert to an explicit stack, and saying so is a correctness argument, not just an efficiency one.

### Python-specific space notes

- **Every object carries overhead.** \`sys.getsizeof(0)\` is 28 bytes; a \`list\` of a million ints is 8 MB of pointers *plus* ~28 bytes per distinct int object. A \`dict\` entry costs on the order of 100 bytes once you include the sparse index table and load-factor slack. "O(n) space" hides a constant of 100x between \`array.array("i", ...)\` and \`dict\`.
- **Memo tables are sized by state count.** \`functools.cache\` on an (i, j) DP holds n * m argument tuples plus dict overhead — correct, but heavy. A dense state space is much cheaper as a preallocated \`[[0] * m for _ in range(n)]\` (or an \`array.array\`); a sparse one genuinely wants the dict. Sparse favors the cache, dense favors the table.
- **Rolling arrays.** Most 2D DPs only read the previous row, so you can drop from O(n * m) to O(m) by keeping two rows. Offer this as an optimization after your correct solution — it's a reliable follow-up question.
- **Slicing copies.** \`lst[i:]\`, \`s[i:]\`, \`list(x)\`, \`sorted(x)\`, and every list comprehension allocate a new object. Recursing on \`s[1:]\` turns an O(n) recursion into O(n^2) time *and* O(n^2) space. Pass indices instead, or use \`itertools.islice\` / \`memoryview\` when you need a view rather than a copy.
- **Generators are the O(1)-space version of a comprehension.** \`sum(x * x for x in data)\` never materializes the sequence; \`sum([x * x for x in data])\` allocates the whole list first. Same asymptotic time, different space class.`,
    },
    {
      id: "operations-master-table",
      heading: "The operations-complexity master table",
      markdown: `Average case unless noted; **worst case in bold** where it diverges. "Access" means by index or key.

| Structure | Access | Search | Insert front | Insert end | Insert arbitrary | Delete | Space | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| \`array.array\` / \`bytes\` | O(1) | O(n) | n/a (fixed or O(n)) | O(1) amortized | O(n) | O(n) | O(n) | unboxed contiguous values; best cache locality |
| Sorted \`list\` + \`bisect\` | O(1) | **O(log n)** | O(n) | O(n) | O(n) (\`insort\`) | O(n) | O(n) | binary search cheap, mutation expensive |
| \`list\` (dynamic array) | O(1) | O(n) | **O(n)** (\`insert(0, x)\`) | O(1) amortized (**O(n)** on the resizing \`append\`) | O(n) | O(n) (\`pop()\` is O(1); \`pop(0)\` is **O(n)**) | O(n) | array of pointers, geometric over-allocation |
| \`collections.deque\` | **O(1)** at the ends, **O(n)** in the middle | O(n) | \`appendleft\` O(1) | \`append\` O(1) | \`insert\` O(n) | \`popleft\` / \`pop\` O(1) | O(n) | doubly linked list of 64-slot blocks; queues and sliding windows |
| Singly linked list (hand-rolled) | O(n) | O(n) | O(1) | O(1) with tail ptr, else O(n) | O(1) *given the prior node* | O(1) given prior node, else O(n) | O(n) | no random access; pointer overhead |
| Doubly linked list (hand-rolled) | O(n) | O(n) | O(1) | O(1) | O(1) given the node | O(1) given the node | O(n) | 2 pointers/node; the LRU workhorse |
| Stack (\`list\`) | — | — | — | \`append\` O(1) amort. | — | \`pop()\` O(1) | O(n) | LIFO; a plain \`list\` is correct here |
| Queue (\`deque\`) | — | — | — | \`append\` O(1) | — | \`popleft\` O(1) | O(n) | never back a queue with \`list.pop(0)\` |
| \`dict\` (hash map) | O(1), **O(n)** | O(1), **O(n)** | — | O(1) amortized | O(1) | O(1), **O(n)** (\`del\`, \`pop\`) | O(n) | insertion-ordered since 3.7; resizes past ~2/3 load |
| \`set\` / \`frozenset\` | — | O(1), **O(n)** | — | \`add\` O(1) | O(1) | \`discard\` O(1) | O(n) | membership plus set algebra; **no order guarantee** |
| \`heapq\` over a \`list\` | \`h[0]\` O(1) | O(n) | — | \`heappush\` O(log n) | O(log n) | \`heappop\` O(log n); arbitrary delete O(n) to find | O(n) | \`heapify\` O(n); **min-heap only**; no sorted iteration |
| Unbalanced BST (no stdlib) | O(log n), **O(n)** | O(log n), **O(n)** | O(log n), **O(n)** | — | O(log n), **O(n)** | O(log n), **O(n)** | O(n) | degenerates to a list on sorted input |
| Balanced BST / AVL / red-black (**no stdlib equivalent**) | O(log n) | O(log n) | O(log n) | O(log n) | O(log n) | O(log n) | O(n) | worst case, not average; ordered ops; third-party \`sortedcontainers\` |
| Trie (nested \`dict\`) | O(L) | O(L) | O(L) | O(L) | O(L) | O(L) | O(total chars) nodes | L = key length, independent of n |
| Adjacency list (\`list[list[int]]\` / \`defaultdict(list)\`) | — | edge check O(deg(v)) | — | add edge O(1) | — | remove edge O(deg(v)) | O(V + E) | neighbor iteration O(deg(v)) |
| Adjacency matrix (\`list[list[int]]\`) | — | edge check O(1) | — | add edge O(1) | — | remove edge O(1) | O(V^2) | neighbor iteration O(V) always |
| Edge list (\`list[tuple[int, int]]\`) | — | O(E) | — | O(1) | — | O(E) | O(E) | good for Kruskal, bad for traversal |

Things this table is trying to teach:

- **\`list.pop(0)\` is O(n); \`deque.popleft()\` is O(1).** This is the single most consequential row in the table for interview code. A BFS written as \`q = [start]\` plus \`q.pop(0)\` silently turns an O(V + E) traversal into O(V^2 + VE). Import \`deque\`.
- **Balanced BSTs quote worst case; \`dict\` and \`set\` quote average.** \`dict\` is O(1) *average* and O(n) *worst*, a tree is O(log n) *worst*. That asymmetry is the answer to "when would you use a tree over a hash map" under a latency budget.
- **Python ships no sorted map.** There is no \`TreeMap\`, no \`std::map\`. \`dict\` preserves *insertion* order, not key order. Your options are \`bisect\` over a sorted \`list\` (O(log n) to find, O(n) to insert — fine when writes are rare) or the third-party \`sortedcontainers\`.
- **Linked-list O(1) insert is conditional on already holding the node.** Getting to the node is the O(n) part, and candidates quietly drop that clause.
- **A heap does not support search.** Finding an arbitrary element in a heap is O(n); only the min is cheap, and \`heapq\` gives you *only* a min-heap. If you need "delete this specific element," you need a heap plus an index map, or a balanced BST.
- **Deleting from a \`dict\` is O(1); deleting from a heap is not.** This drives the "lazy deletion" trick in problems like find-median-from-data-stream and task scheduling.`,
    },
    {
      id: "arrays-and-dynamic-arrays",
      heading: "Arrays and dynamic arrays",
      markdown: `An array is a contiguous block of memory. Element i lives at \`base + i * elementSize\`, so indexing is one multiply and one load — genuinely O(1), and cheap in constant terms too.

A CPython \`list\` is exactly this, with one twist: the contiguous block holds **pointers**, not values. \`lst[i]\` is a bounds check plus a load from \`ob_item[i]\`, then a dereference to the actual object living somewhere else on the heap. That is still O(1); it just means a \`list\` gets you half the cache story, not all of it.

### Cache locality is why arrays win

Memory is fetched in cache lines, typically 64 bytes. Reading \`a[0]\` pulls \`a[0..15]\` (for 4-byte elements) into L1 for free, so a linear scan gets ~15 free hits per miss and the hardware prefetcher recognizes the stride and runs ahead of you. A linked list or tree scatters nodes across the heap; every hop is a potential cache miss at ~100x the cost of an L1 hit.

In Python, be honest about which half you get. Scanning a \`list\` walks the pointer block linearly — good — but each dereference lands on a separately allocated object — bad, unless the objects happen to have been allocated together, which for a freshly built list of small ints they often are. \`array.array\`, \`bytes\`, and NumPy arrays store **unboxed** values contiguously and get the full benefit; that is the entire performance argument for reaching for them on numeric hot loops.

Practical consequence: **an O(n) array scan routinely beats an O(log n) pointer-chasing structure for small n.** Linear search on a 100-element array often outruns a binary search tree with 100 nodes. This is why B-trees exist (wide, cache-line-sized nodes), why real sorts fall back to insertion sort under ~16 elements, and why "just use an array" is a defensible answer at small scale. Say it as a constant-factor argument, not as a claim about asymptotics.

### Capacity vs length

A dynamic array tracks two numbers: **length** (elements you've stored) and **capacity** (slots allocated). Appending writes at index length and increments it; when length == capacity, it allocates a bigger buffer and copies. Length is what you see; capacity is what you pay for.

\`\`\`python
import sys

a: list[int] = []
sizes = [(len(a), sys.getsizeof(a))]
for i in range(20):
    a.append(i)
    sizes.append((len(a), sys.getsizeof(a)))

# sys.getsizeof jumps in steps rather than growing per append:
# 56, 88, 88, 88, 88, 120, 120, 120, 120, 184, ...
# CPython over-allocates to roughly n + n // 8 + 6 slots, so the
# reallocations get exponentially rarer and append stays amortized O(1).
\`\`\`

If you know the final size, preallocate — it eliminates every intermediate copy and every reallocation:

\`\`\`python
res = [0] * n              # one allocation, n slots
for i in range(n):
    res[i] = f(i)

# Usually better: the comprehension preallocates from the iterator's
# length hint and runs the loop in C.
res = [f(i) for i in range(n)]
\`\`\`

For numeric work, \`array.array("i", ...)\` (unboxed, contiguous, one C type) or NumPy are worth reaching for on hot loops over 10^6+ numbers.

### CPython lists specifically

A \`list\` is a \`PyObject **ob_item\` block plus \`ob_size\` and \`allocated\`. There is no "holey" mode, no hidden class, no elements-kind transition — you cannot knock a Python list off a fast path the way you can a JS array, because there was never a slow path to fall onto. What you *can* do is pick the O(n) operation by accident:

\`\`\`python
a = [1, 2, 3]
a.append(4)       # O(1) amortized — writes into spare capacity
a.insert(0, 0)    # O(n) — memmove of every element
a.pop()           # O(1) — from the end
a.pop(0)          # O(n) — memmove again
del a[1]          # O(n) — same shift
a[len(a):] = [5]  # equivalent to append; slice assignment at the end is O(1) amortized
a.clear()         # O(n) decrefs, one allocation freed
\`\`\`

Cost of the operations people assume are free:

| Operation | Cost | Why |
| --- | --- | --- |
| \`append\` / \`pop()\` | O(1) amortized | writes/reads the end |
| \`insert(0, x)\` / \`pop(0)\` | **O(n)** | every element shifts |
| \`del lst[i]\` / \`lst.remove(x)\` | **O(n)** | shifts the tail; \`remove\` also scans to find |
| \`lst[i:j]\` | O(j - i) | allocates a copy |
| \`lst + other\`, \`lst * k\`, \`list(lst)\`, \`lst.copy()\` | O(n) | allocates |
| \`x in lst\`, \`lst.index(x)\`, \`lst.count(x)\` | O(n) | linear scan |
| \`lst.sort()\` / \`sorted(lst)\` | O(n log n) worst, **O(n)** on nearly-sorted | Timsort |
| \`lst.reverse()\` | O(n) | in place; \`reversed(lst)\` is O(1), it returns a view |
| \`lst[-1]\` | O(1) | negative indices are arithmetic, not a scan |
| \`len(lst)\` | O(1) | stored on the object, never counted |

The \`pop(0)\` one is the single most common accidental O(n^2) in Python interview code: implementing a BFS queue as \`q = [start]\` plus \`q.pop(0)\` turns an O(V + E) traversal into O(V^2 + VE). Unlike JavaScript, Python has the right structure in the standard library, so there is no excuse and no head-index trick to justify:

\`\`\`python
from collections import deque

q: deque[int] = deque([start])
visited = {start}
while q:
    node = q.popleft()            # O(1)
    for nxt in adj[node]:
        if nxt not in visited:
            visited.add(nxt)
            q.append(nxt)
\`\`\`

\`deque\` is a doubly linked list of fixed-size blocks (64 slots each), so both ends are O(1) and the block structure keeps the constant factor low. The tradeoff is that indexing into the *middle* is O(n) — if you need random access and both ends, you need two structures or a ring buffer. \`deque(maxlen=k)\` also gives you a fixed-size sliding window that evicts from the far end automatically.`,
    },
    {
      id: "linked-lists",
      heading: "Linked lists",
      markdown: `A node holds a value and one or two pointers. Nothing is contiguous, so there is no index arithmetic and no random access: reaching the k-th element means k hops.

\`\`\`python
from __future__ import annotations

from dataclasses import dataclass


@dataclass(eq=False)
class ListNode:
    val: int
    next: ListNode | None = None
\`\`\`

\`eq=False\` is deliberate and load-bearing. A plain \`@dataclass\` generates \`__eq__\` from the fields, which means \`a == b\` recursively compares the entire rest of both lists — O(n) instead of O(1), and an **infinite recursion** if the list has a cycle. Node comparison should be identity: \`is\`, not \`==\`.

### The O(1) insert claim comes with a clause

Inserting after a node you already hold is genuinely O(1) — rewire two pointers, no shifting, no reallocation. **Finding** that node is O(n). So a linked list beats an array for insertion only when your traversal already put you at the insertion point, or when something else hands you the node (a hash map, an iterator). That is precisely the LRU cache setup, and it is why "linked lists are better for insertion" is only half a sentence.

Deleting a node from a *singly* linked list needs the **previous** node; from a doubly linked list you need only the node itself, since it knows its predecessor. That single difference is why every real cache uses doubly linked lists — including CPython's own \`collections.OrderedDict\` and \`functools.lru_cache\`, both of which are a dict plus a circular doubly linked list.

### Dummy head

Half of linked-list bugs are "what if the change is at the head." A dummy (sentinel) node removes the special case entirely: the real head becomes just another \`next\` pointer, so insertion and deletion code has exactly one branch.

\`\`\`python
def remove_elements(head: ListNode | None, val: int) -> ListNode | None:
    dummy = ListNode(0, head)
    prev = dummy
    while prev.next is not None:
        if prev.next.val == val:
            prev.next = prev.next.next
        else:
            prev = prev.next
    return dummy.next   # correct even if the original head was removed
\`\`\`

Use it for merge, remove-nth-from-end, partition, and anything that might delete the first node. Reaching for it unprompted reads as experience.

### Doubly linked list + hash map = LRU cache

The canonical composition, and the reason to understand both structures at once. You need two things at O(1): *look up a key* and *move its node to the most-recently-used end*. Neither structure gives you both.

- Hash map: key -> node reference. O(1) lookup, but no ordering.
- Doubly linked list: recency order, O(1) unlink and O(1) move-to-front — **but only because the map handed you the node**, so you never search the list.

Evict from the tail, insert at the head, use dummy head *and* tail nodes so unlinking never has to check for \`None\`. Every operation is O(1); space is O(capacity). If you can explain why a singly linked list fails here (you can't unlink in O(1) without the predecessor) you've answered the real question.

### The gotchas interviewers watch for

- **Losing the head.** Reversal in particular: save \`next\` before you overwrite \`node.next\`, or you drop the rest of the list. Python's tuple assignment makes this a one-liner that is easy to get right: \`node.next, prev, node = prev, node, node.next\` — but read the evaluation order carefully, because the right-hand side is fully evaluated first.
- **Empty and single-node inputs.** \`head is None\` and \`head.next is None\` break most naive two-pointer code. Check them first.
- **\`is\` versus \`==\`.** Compare *nodes* with \`is\` and *values* with \`==\`. Using \`==\` on nodes invokes whatever \`__eq__\` the class defines, which for a dataclass is a recursive structural comparison — wrong answer, potentially infinite loop.
- **Truthiness is not a null check.** \`if node:\` is fine for a plain node, but \`if node.val:\` is not \`if node.val is not None:\` — \`0\` and \`""\` are falsy. On linked-list problems whose values include 0, this is a real bug.
- **Off-by-one on fast/slow pointers.** For the middle of the list, \`while fast is not None and fast.next is not None\` lands slow on the second middle for even lengths; \`while fast.next is not None and fast.next.next is not None\` lands on the first. Know which one the problem wants.
- **Cycle detection.** Floyd's tortoise and hare: slow moves 1, fast moves 2; they meet inside a cycle. O(n) time, O(1) space. To find the cycle's *entry*, reset one pointer to the head and advance both by 1 — they meet at the start of the cycle. The alternative, a set of visited nodes, is O(n) time and O(n) space — and note it only works because \`ListNode\` is hashable by identity; a \`@dataclass\` with \`eq=True\` is **unhashable**, so \`set()\` of nodes raises \`TypeError\`. Mention both and name the tradeoff.
- **A cycle makes any traversal infinite.** If cycles are possible, your \`while node is not None\` never terminates.

\`\`\`python
def has_cycle(head: ListNode | None) -> bool:
    slow = fast = head
    while fast is not None and fast.next is not None:
        assert slow is not None      # implied by fast being ahead of slow
        slow = slow.next
        fast = fast.next.next
        if slow is fast:             # identity, not equality
            return True
    return False
\`\`\``,
    },
    {
      id: "hash-maps-and-sets",
      heading: "Hash maps and hash sets",
      markdown: `A hash map is an array of slots plus a hash function mapping keys to slot indices. \`d[k]\` computes \`hash(k)\`, masks it down to a table index, jumps straight to that slot, and checks whether the key there is the one you asked for. The array index is O(1); the whole structure is O(1) *only if the probe sequence stays short*.

### Collisions

Two keys can hash to the same slot — guaranteed by pigeonhole once you have more keys than slots. Two strategies:

**Separate chaining.** Each bucket holds a list (or, in Java 8+, a tree once a bucket exceeds 8 entries). Simple, degrades gracefully, tolerates load factors above 1, but every lookup costs a pointer dereference and the chain nodes hurt cache locality.

**Open addressing** (linear probing, quadratic probing, or a pseudo-random probe). All entries live in the table itself; on collision you probe further slots until you find the key or an empty one. No per-entry allocation and much better cache behavior, which is why most modern implementations use it — **including CPython's \`dict\` and \`set\`**, plus Rust's \`HashMap\` and Google's Swiss tables. The costs: deletion needs tombstones (you can't just empty a slot or you break the probe chain for keys past it — CPython writes a \`DUMMY\` marker), and performance degrades sharply as the load factor approaches 1.

CPython's probe sequence is worth knowing because it is not the textbook linear probe. It mixes in the *high* bits of the hash that the table mask threw away:

\`\`\`python
# The shape of CPython's dict probe loop (Objects/dictobject.c), in Python.
def probe_sequence(hash_value: int, table_size: int) -> list[int]:
    mask = table_size - 1
    i = hash_value & mask
    perturb = hash_value
    order = [i]
    for _ in range(table_size - 1):
        perturb >>= 5
        i = (i * 5 + perturb + 1) & mask
        order.append(i)
    return order
\`\`\`

The consequence: keys that collide on the low bits scatter across the table instead of clustering behind each other, so CPython avoids the primary-clustering cliff that plain linear probing has. (\`set\` is a hybrid — it checks a few *linearly* adjacent slots first for cache reasons, then falls back to this jump.)

There is a second layer worth naming. Since 3.6 a \`dict\` is **two** arrays: a sparse array of small integer indices, and a dense, append-only array of (hash, key, value) entries. Only the sparse index array is oversized; the entries are packed. That is what makes \`dict\` both memory-compact and **insertion-ordered** — iteration just walks the dense array.

### Load factor and resizing

Load factor = entries / slots. When it crosses a threshold, the table allocates a larger one and **rehashes every key** — the slot index depends on the table size, so nothing can just be copied. That's O(n) for one insert, amortized O(1) by the same geometric argument as the dynamic array.

| | threshold | grows to |
| --- | --- | --- |
| CPython \`dict\` | 2/3 full | next power of two >= 3x the *live* entry count |
| CPython \`set\` | 3/5 full | 4x used (2x for large sets) |
| Java \`HashMap\` | 0.75 | 2x |
| Swiss tables | ~0.875 | 2x |

Note the "live entry count" detail: because a \`dict\` resize is sized from entries that are actually present, a dict that has had many deletions **shrinks** its entry array on the next resize rather than growing forever.

Corollary: if you know the size up front, build the dict in one shot (\`dict(pairs)\`, \`{k: v for ...}\`, \`dict.fromkeys(keys)\`) rather than inserting in a loop. Building a 10^6-entry map from empty performs ~20 resizes and rehashes ~2 x 10^6 entries. Python exposes no \`reserve\`, so one-shot construction from a sized iterable is the closest you get.

### Why the worst case is O(n) and why it matters

If every key lands on the same probe chain, lookup degenerates to a linear scan. Causes:

- **A bad hash function** for your key distribution. Python's own is a live example: \`hash(n) == n\` for any int small enough to fit (\`hash(7) == 7\`), so integer keys that are all multiples of a large power of two land on the same low bits. The perturbation in the probe loop is what keeps this from being catastrophic, but a custom \`__hash__\` that returns something like \`hash(self.x)\` while ignoring \`self.y\` has no such protection.
- **A broken \`__hash__\` / \`__eq__\` contract.** If \`a == b\` then \`hash(a)\` must equal \`hash(b)\`. Violate it and lookups silently miss. Also: mutating an object after using it as a key moves its hash out from under the table — the entry becomes unreachable. This is why the built-in mutable containers are unhashable by design.
- **An adversary.** If the hash function is deterministic and public, an attacker can compute thousands of colliding keys and POST them as form fields or JSON keys, turning every insert into O(n) and the request into O(n^2). This is **hash flooding**, a real DoS class that hit PHP, Java, Python, and Node around 2011-2012. Python's fix (CVE-2012-1150, shipped in 3.3) is a per-process random seed for \`str\` and \`bytes\` hashing — SipHash, seeded from the OS, controllable via \`PYTHONHASHSEED\`. Run \`python -c "print(hash('a'))"\` twice and you get two different numbers. Java went a different way and trees over-full buckets, capping the degenerate case at O(log n).

Note the scope of Python's defense: **only \`str\` and \`bytes\` are randomized.** \`hash(int)\` is still the identity function and is fully predictable.

So the honest statement is: **O(1) average, O(n) worst, with the worst case being unreachable in practice for non-adversarial string keys under a randomized hash.** That full sentence is what separates a memorized answer from an understood one.

### Iteration order

- **\`dict\`** iterates in **insertion order**. This was an implementation detail of the compact-dict rewrite in 3.6 and became a **language guarantee in 3.7**, so you may depend on it. Re-assigning an existing key keeps its original position; deleting and re-inserting moves it to the end.
- **\`set\` and \`frozenset\` guarantee nothing.** The apparent order is a function of the hash values and the insertion history, and because string hashing is randomized per process, **iterating a set of strings gives a different order on every run**. Never let set order leak into output. If you need determinism, \`sorted(s)\`.
- **\`collections.OrderedDict\`** still exists and is still useful: it has \`move_to_end\`, \`popitem(last=False)\`, and an order-*sensitive* \`__eq__\`. Plain \`dict\` equality ignores order.
- **\`collections.Counter\`** is a \`dict\` subclass; \`most_common()\` returns entries sorted by count, with insertion order breaking ties.

### Key equality and hashability

Python compares keys by \`hash\` first and \`==\` second, and both are user-overridable. That makes tuple keys *just work* — the JavaScript problem of "same contents, different reference" does not exist:

\`\`\`python
m: dict[tuple[int, int], str] = {}
m[(1, 2)] = "a"
m[(1, 2)]          # "a" — tuples hash structurally

m[[1, 2]] = "b"    # TypeError: unhashable type: 'list'
\`\`\`

The rule is **hashable means immutable-by-convention**: \`int\`, \`str\`, \`bytes\`, \`tuple\` (of hashables), \`frozenset\`, and any object that does not define \`__eq__\` (which then hashes by identity). \`list\`, \`dict\`, and \`set\` are deliberately unhashable. So when your logical key is a pair, the answer is a \`tuple\`, and the fallback question is only whether to flatten it:

\`\`\`python
# Tuple key: readable, structural, allocates a small tuple per lookup.
key = (r, c)

# Flattened int key: no allocation, needs a bound on one dimension.
key2 = r * num_cols + c
\`\`\`

Prefer the tuple. It is clearer, it is what a reviewer expects, and tuple hashing is C-level and fast; flatten only in a genuinely hot loop and say why. If you do use a string key like \`f"{r},{c}"\`, keep the separator — without it \`(1, 23)\` and \`(12, 3)\` both become \`"123"\`.

The equality trap Python does have is numeric: \`1 == 1.0 == True\`, and equal objects must hash equally, so they are **the same dict key**:

\`\`\`python
d = {1: "int", 1.0: "float", True: "bool"}
d            # {1: 'bool'} — one entry, first key kept, last value wins
\`\`\`

### \`dict\` and its relatives

| | \`dict\` | \`defaultdict\` | \`Counter\` | \`dataclass\` / \`NamedTuple\` |
| --- | --- | --- | --- | --- |
| Keys | any hashable | any hashable | any hashable | fixed attribute names |
| Missing key | \`KeyError\`; \`.get(k, default)\` to avoid | auto-creates via the factory | returns \`0\` | \`AttributeError\`, caught statically by a type checker |
| Best for | general mapping | grouping, adjacency lists, nested tables | frequency counting, \`most_common(k)\` | fixed-shape records |
| Gotcha | mutating during iteration raises \`RuntimeError\` | a plain **read** inserts the key | arithmetic silently drops non-positive counts | not a mapping; no dynamic keys |

Default to \`dict\`. Reach for \`defaultdict(list)\` when building adjacency lists or grouping, \`Counter\` when counting (it is a one-liner and \`most_common(k)\` is the top-k heap you were about to hand-roll), and a \`dataclass\` for fixed-shape records — a dict with a fixed key set is a struct wearing a costume, and the dataclass gets you attribute access, type checking, and less memory.

The \`defaultdict\` gotcha is worth stating explicitly because it is silent: \`counts[k]\` on a \`defaultdict(int)\` **creates** \`k\` with value 0, so a read-only membership check written as \`if counts[k]:\` grows the dict. Use \`if k in counts:\` or \`counts.get(k, 0)\`.`,
    },
    {
      id: "heaps-and-priority-queues",
      heading: "Heaps and priority queues",
      markdown: `A binary heap is a **complete** binary tree (every level full except possibly the last, which fills left to right) satisfying the **heap property**: every node is <= both children (min-heap) or >= both (max-heap). Note what it does *not* say — there is no ordering between siblings, and no ordering across subtrees. A heap is far weaker than a BST, which is exactly why it's cheaper to maintain.

Completeness means it packs into an array with no pointers and no holes:

- left child of i: \`2 * i + 1\`
- right child of i: \`2 * i + 2\`
- parent of i: \`(i - 1) >> 1\` (equivalently \`(i - 1) // 2\`)

Contiguous storage plus arithmetic navigation: no allocation per node, excellent cache behavior.

### Sift-up and sift-down

**push**: append at the end (preserving completeness), then **sift up** — swap with the parent while it violates the heap property. At most the height of the tree, so O(log n).

**pop**: the root is the answer. Move the last element to the root (completeness preserved), shrink by one, then **sift down** — swap with the smaller child while it violates the property. O(log n).

Both walk one root-to-leaf path, and a complete tree of n nodes has height floor(log2 n).

### Why build-heap is O(n), not O(n log n)

Heapify an existing array by sifting down every node from the last internal node backwards. The lazy analysis says n nodes x O(log n) = O(n log n). The real bound is O(n), and the argument is that **sift-down cost is proportional to the node's height, and almost every node is near the bottom**.

At height h there are at most n / 2^(h+1) nodes, each costing O(h):

sum over h of (n / 2^(h+1)) * h = (n/2) * sum(h / 2^h) <= (n/2) * 2 = n

The series sum(h / 2^h) converges to 2. Concretely: half the nodes are leaves and cost 0; a quarter are one level up and cost 1; an eighth cost 2. The expensive nodes are the rare ones.

Note this only works **bottom-up with sift-down**. Building by n successive pushes (sift-up) really is O(n log n), because sift-up cost is proportional to *depth*, and most nodes are deep. Same tree, opposite conclusion — that contrast is the whole insight.

### What a heap cannot do

- **No search.** Finding an arbitrary value is O(n); the heap property gives you no direction to search in.
- **No sorted iteration without destroying it.** The array is not sorted. Getting sorted output means popping n times: O(n log n), and you end up with an empty heap. Printing the backing array in order is a classic wrong answer.
- **No efficient arbitrary delete or decrease-key** unless you maintain a separate value -> index map (which Dijkstra implementations often skip in favor of lazy deletion: push duplicates, discard stale entries on pop).

Peek is O(1) — that's the entire point.

### When a heap beats sorting

Both give you the top k. Sorting is O(n log n) time and O(n) space; a size-k heap is **O(n log k) time and O(k) space**. When k is small relative to n, that's a large win, and more importantly the heap **streams**: it never needs the whole dataset in memory, so it works on an infinite feed where sorting simply doesn't apply. That's the real argument for kth-largest-element-in-a-stream and find-median-from-data-stream.

Quickselect is the third option: O(n) *average* for the k-th element, O(n^2) worst, in place, but it requires random access to all n elements and reorders them. Naming all three and picking based on whether the data streams is a strong answer.

### Python ships \`heapq\` — use it

This is one of the places Python hands you the win. Java has \`PriorityQueue\`, C++ has \`priority_queue\`, JavaScript has nothing at all — and Python has \`heapq\`, a set of **functions that operate on an ordinary \`list\`**. There is no wrapper class to learn and no conversion: the heap *is* a list in heap order, so \`h[0]\` is the minimum and \`len(h)\` is the size.

\`\`\`python
import heapq

heap: list[int] = []
heapq.heappush(heap, 5)          # O(log n)
heapq.heappush(heap, 1)
heap[0]                          # 1 — peek is O(1), no pop, no method call
heapq.heappop(heap)              # 1, O(log n)

nums = [5, 1, 9, 3]
heapq.heapify(nums)              # O(n) bottom-up, in place, no copy

# Push-then-pop and pop-then-push in one sift instead of two:
heapq.heappushpop(heap, 4)       # push 4, then pop the min
heapq.heapreplace(heap, 4)       # pop the min, then push 4 (heap must be non-empty)
\`\`\`

Three things to say out loud about it:

**1. \`heapq\` is a min-heap, and only a min-heap.** There is no \`max\` variant and no \`reverse=\` flag. For a max-heap you **negate on the way in and on the way out**:

\`\`\`python
import heapq

max_heap: list[int] = []
for x in [5, 1, 9, 3]:
    heapq.heappush(max_heap, -x)
largest = -heapq.heappop(max_heap)   # 9
\`\`\`

That works for numbers. For non-numeric keys, negate the *key* inside a tuple instead, or wrap the payload in a class with \`__lt__\` reversed.

**2. There is no \`key=\` parameter.** \`heapq\` compares the elements themselves with \`<\`. So you push tuples of \`(priority, payload)\` — and because tuples compare element-wise, Python will fall through to comparing the payloads on a tie, raising \`TypeError\` the moment two priorities match and the payload has no ordering. The fix is a monotonic tiebreaker in the middle:

\`\`\`python
import heapq
from itertools import count
from dataclasses import dataclass

@dataclass
class Task:
    name: str

tiebreak = count()
queue: list[tuple[int, int, Task]] = []
heapq.heappush(queue, (2, next(tiebreak), Task("write tests")))
heapq.heappush(queue, (2, next(tiebreak), Task("write docs")))

priority, _, task = heapq.heappop(queue)   # (2, 0, Task('write tests'))
\`\`\`

The counter also gives you FIFO ordering within a priority level, for free.

**3. \`heapq.nlargest(k, it, key=...)\` / \`nsmallest\` already are the size-k heap.** For a one-shot top-k they are the idiomatic answer and they do the O(n log k) algorithm internally. (\`queue.PriorityQueue\` also exists, but it is a lock-guarded wrapper for producer/consumer threading — slower, and not what you want in an algorithm.)

### Writing one from scratch

You will still be asked to implement it, because the implementation is where the O(log n) and the O(n) build come from. Keep this shape in your head:

\`\`\`python
from __future__ import annotations

from collections.abc import Callable, Iterable
from typing import Any, Generic, TypeVar

T = TypeVar("T")


def _identity(x: Any) -> Any:
    return x


class MinHeap(Generic[T]):
    """Binary min-heap over an arbitrary key function.

    \`key(a) < key(b)\` means \`a\` comes out first. This is what heapq does
    internally; write it to show the mechanism, use heapq in real code.
    """

    def __init__(self, key: Callable[[T], Any] = _identity) -> None:
        self._data: list[T] = []
        self._key = key

    def __len__(self) -> int:
        return len(self._data)

    def peek(self) -> T:
        """O(1). Raises IndexError when empty, like list and heapq."""
        return self._data[0]

    def push(self, value: T) -> None:
        self._data.append(value)
        self._sift_up(len(self._data) - 1)

    def pop(self) -> T:
        top = self._data[0]
        last = self._data.pop()
        if self._data:
            self._data[0] = last
            self._sift_down(0)
        return top

    @classmethod
    def heapify(cls, items: Iterable[T], key: Callable[[T], Any] = _identity) -> MinHeap[T]:
        """O(n) bottom-up heapify, not n successive pushes."""
        heap = cls(key)
        heap._data = list(items)
        for i in range(len(heap._data) // 2 - 1, -1, -1):
            heap._sift_down(i)
        return heap

    def _sift_up(self, i: int) -> None:
        data, key = self._data, self._key
        while i > 0:
            parent = (i - 1) >> 1
            if key(data[i]) >= key(data[parent]):
                break
            data[i], data[parent] = data[parent], data[i]
            i = parent

    def _sift_down(self, i: int) -> None:
        data, key, n = self._data, self._key, len(self._data)
        while True:
            left = 2 * i + 1
            right = left + 1
            smallest = i
            if left < n and key(data[left]) < key(data[smallest]):
                smallest = left
            if right < n and key(data[right]) < key(data[smallest]):
                smallest = right
            if smallest == i:
                return
            data[i], data[smallest] = data[smallest], data[i]
            i = smallest
\`\`\`

A max-heap is the same class with the key negated — \`MinHeap(key=lambda x: -x)\`. Never write two classes. Note that the \`key=\` parameter is the thing \`heapq\` doesn't give you; offering it is a reasonable answer to "how would you improve this."

Top-k, O(n log k) time and O(k) space:

\`\`\`python
import heapq


def top_k(nums: list[int], k: int) -> list[int]:
    """The k largest values, ascending."""
    heap: list[int] = []
    for x in nums:
        if len(heap) < k:
            heapq.heappush(heap, x)
        elif x > heap[0]:
            heapq.heapreplace(heap, x)   # one sift instead of a push plus a pop
    return sorted(heap)


# What you would actually write in an interview, same complexity:
def top_k_stdlib(nums: list[int], k: int) -> list[int]:
    return heapq.nlargest(k, nums)       # descending
\`\`\`

Note the direction: to keep the k *largest*, you hold a **min**-heap so the weakest survivor is the one you can cheaply evict and \`heap[0]\` is the bar a new candidate has to clear. Getting that backwards is a common slip.

**Heapsort**: build-heap in O(n), then repeatedly swap the root with the last element and sift down over the shrinking prefix — O(n log n) worst case, O(1) space, in place. Its weakness is cache behavior (sift-down jumps by powers of two) and instability, which is why quicksort usually wins in practice despite the worse bound. It survives as introsort's fallback, guaranteeing quicksort can never go quadratic.`,
    },
    {
      id: "trees-and-balanced-bsts",
      heading: "Trees, BSTs, and balanced BSTs",
      markdown: `The **BST invariant**: for every node, all keys in the left subtree are less than the node's key, and all keys in the right subtree are greater. It is a statement about entire subtrees, not just immediate children — which is why validate-binary-search-tree is a real problem and why checking \`node.left.val < node.val < node.right.val\` locally is wrong. Validate by passing down a (min, max) range, or by verifying that an in-order traversal is strictly increasing.

Search, insert, and delete all walk one root-to-leaf path: **O(h)** where h is the height. Everything about BSTs reduces to controlling h.

### Why the average is O(log n) and the worst is O(n)

A randomly built BST on n keys has expected height ~1.39 * log2(n) — good. But insert already-sorted keys and every new key goes right, producing a linked list of height n:

\`\`\`
insert 1, 2, 3, 4, 5:

1
 \\
  2
   \\
    3
     \\
      4
       \\
        5
\`\`\`

Sorted or reverse-sorted input is not exotic — it is the most likely real-world input, which is why unbalanced BSTs are a teaching structure rather than a production one. Every serious ordered map is self-balancing.

### What balancing buys you

Rotations are local O(1) pointer rearrangements that reduce height while preserving the in-order sequence. After each insert or delete the tree fixes up along the path back to the root, so height stays O(log n) and **every operation becomes O(log n) worst case, not average**.

| | AVL | Red-black |
| --- | --- | --- |
| Balance condition | subtree heights differ by <= 1 | no red node has a red child; equal black-height on all paths |
| Height bound | ~1.44 log n | ~2 log n |
| Lookups | faster (shallower) | slower |
| Rotations per insert | <= 2 | <= 2 |
| Rotations per delete | O(log n) | <= 3 |
| Used by | in-memory read-heavy indexes | Java \`TreeMap\`, C++ \`std::map\`, Linux CFS scheduler |

The tradeoff is one sentence: **stricter balance means shallower trees and faster reads, at the cost of more rebalancing work on writes.** AVL for read-heavy, red-black for write-heavy or mixed — which is why the standard libraries chose red-black. Interviewers rarely ask you to implement either; they ask you to state this tradeoff.

Related structures worth naming: **B-trees / B+ trees** (high fan-out so each node is a disk page or cache line — the reason every database index is a B+ tree, not a binary tree), and **skip lists** (probabilistic, O(log n) expected, much simpler to implement and to make concurrent, used by Redis sorted sets).

### In-order traversal gives sorted output

\`\`\`python
from __future__ import annotations

from dataclasses import dataclass


@dataclass(eq=False)
class TreeNode:
    val: int
    left: TreeNode | None = None
    right: TreeNode | None = None


def inorder(root: TreeNode | None, out: list[int] | None = None) -> list[int]:
    if out is None:
        out = []          # never write \`out: list[int] = []\` in the signature
    if root is None:
        return out
    inorder(root.left, out)
    out.append(root.val)
    inorder(root.right, out)
    return out
\`\`\`

The \`out is None\` dance is not noise. A default argument is evaluated **once, at function definition time**, so a mutable default is shared across every call — \`inorder(t)\` would return the concatenation of every traversal you have ever run. It is the most common Python-specific bug in otherwise-correct interview code.

O(n) time, O(h) stack. This is the engine behind kth-smallest-element-in-a-bst: traverse in order and stop at the k-th element, giving O(h + k) rather than O(n) — because you can **stop early**, which is only possible in an ordered structure.

The iterative form with an explicit stack is worth knowing since it lets you pause mid-traversal (a BST iterator) and avoids stack overflow on skewed trees:

\`\`\`python
def kth_smallest(root: TreeNode | None, k: int) -> int:
    stack: list[TreeNode] = []
    node = root
    while node is not None or stack:
        while node is not None:
            stack.append(node)
            node = node.left
        node = stack.pop()
        k -= 1
        if k == 0:
            return node.val
        node = node.right
    raise ValueError("k exceeds tree size")
\`\`\`

In Python you get the "pause mid-traversal" property for free: change \`return node.val\` to \`yield node.val\`, drop the \`k\` bookkeeping, and the function is a lazy in-order **generator**. \`next(it)\` becomes the BST iterator's \`next()\`, and \`itertools.islice(inorder_iter(root), k - 1, k)\` is the k-th smallest with the same O(h + k) early exit. Offering the generator form is a strong Python-specific signal.

### Balanced BST vs hash map — the comparison you will be asked

A hash map wins on raw point lookups: O(1) average versus O(log n). If all you do is \`get\`, \`put\`, and \`has\`, use the hash map. The tree earns its keep on everything that depends on **order**, which a hash map destroys by design:

| Operation | Balanced BST | Hash map |
| --- | --- | --- |
| get / put / delete | O(log n) worst | O(1) average, O(n) worst |
| min / max | O(log n) | O(n) |
| predecessor / successor | O(log n) | O(n) |
| floor / ceiling ("largest key <= x") | O(log n) | O(n) |
| range query [lo, hi] | O(log n + k) | O(n) |
| sorted iteration | O(n), no extra work | O(n log n), must sort |
| rank / select (k-th smallest) | O(log n) with subtree sizes | O(n) |
| Worst-case guarantee | yes | no |
| Memory per entry | lower, no load-factor slack | higher |
| Requires | a total order on keys | a hash function and equality |

So: **hash map for membership and counting, balanced BST when you need order, ranges, or a worst-case latency bound.** Concrete cases where the tree is the right call — a leaderboard needing "rank of this score", a calendar needing "next meeting after time t" (meeting-rooms-ii, my-calendar), rate limiting by timestamp window, and any interval or sweep-line problem. Java exposes this as \`TreeMap\` (\`floorKey\`, \`ceilingKey\`, \`subMap\`), C++ as \`std::map\` with \`lower_bound\`.

**Python ships neither.** There is no balanced BST and no sorted map in the standard library, and \`dict\` is ordered by *insertion*, not by key — assuming otherwise is the single most common wrong answer here. Your three real options:

1. **\`bisect\` over a sorted \`list\`.** O(log n) to locate, O(n) to insert because of the shift. This is the right call whenever reads dominate writes, or when you can sort once and then only query.
2. **\`sortedcontainers\`** (\`SortedList\`, \`SortedDict\`, \`SortedKeyList\`) — pure Python, a list of chunked lists rather than a tree, and empirically as fast as a C tree implementation. Not stdlib, but pre-installed on most interview platforms and generally accepted; say you'd reach for it and why.
3. **Roll the structure the problem actually needs** — two heaps for a running median, a Fenwick/BIT or segment tree for prefix sums and rank queries. Often the specific problem does not need a full ordered map.

\`bisect\` covers more ground than people expect, and it is the direct answer to \`TreeMap.floorKey\` / \`ceilingKey\`:

\`\`\`python
import bisect

scores = [10, 20, 30, 40]

bisect.insort(scores, 25)              # O(log n) to locate, O(n) to shift

i = bisect.bisect_left(scores, 30)     # first index with scores[i] >= 30  (lower_bound)
j = bisect.bisect_right(scores, 30)    # first index with scores[j] >  30  (upper_bound)
count_of_30s = j - i                   # O(log n) frequency query

floor_of_33 = scores[bisect.bisect_right(scores, 33) - 1]   # 30 — largest <= 33
ceil_of_33 = scores[bisect.bisect_left(scores, 33)]         # 40 — smallest >= 33

# Range query [lo, hi] in O(log n + k):
lo, hi = 20, 35
window = scores[bisect.bisect_left(scores, lo):bisect.bisect_right(scores, hi)]
\`\`\`

Since 3.10 \`bisect\` also takes \`key=\`, so you can binary-search a sorted list of objects without building a parallel key array. What it cannot do is give you O(log n) *insertion* — that is exactly the gap a balanced BST fills, and naming the gap is the answer.`,
    },
    {
      id: "tries",
      heading: "Tries (prefix trees)",
      markdown: `A trie stores keys along **paths** rather than in nodes. The root is the empty prefix; each edge is a character; each node marks whether the path to it forms a complete word. Every string sharing a prefix shares the nodes for that prefix.

\`\`\`python
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(eq=False)
class TrieNode:
    children: dict[str, TrieNode] = field(default_factory=dict)
    is_word: bool = False


class Trie:
    def __init__(self) -> None:
        self._root = TrieNode()

    def insert(self, word: str) -> None:
        """O(L) where L is len(word)."""
        node = self._root
        for ch in word:
            child = node.children.get(ch)
            if child is None:
                child = TrieNode()
                node.children[ch] = child
            node = child
        node.is_word = True

    def search(self, word: str) -> bool:
        node = self._walk(word)
        return node is not None and node.is_word

    def starts_with(self, prefix: str) -> bool:
        return self._walk(prefix) is not None

    def _walk(self, s: str) -> TrieNode | None:
        node = self._root
        for ch in s:
            child = node.children.get(ch)
            if child is None:
                return None
            node = child
        return node
\`\`\`

Two Python notes on this. \`field(default_factory=dict)\` rather than \`children: dict = {}\` — a mutable dataclass default raises \`ValueError\` at class-creation time precisely because it would be shared across every instance, the same trap as a mutable default argument. And the explicit \`get\`-then-create is deliberately not \`node.children.setdefault(ch, TrieNode())\`: \`setdefault\` constructs the argument **before** it checks, so the one-liner allocates a throwaway node on every hit.

A fixed-alphabet variant swaps the \`dict\` for \`[None] * 26\` indexed by \`ord(ch) - 97\` — more compact for lowercase-only inputs, wasteful for sparse alphabets or Unicode; in Python the \`dict\` version is usually the better default because a small dict is cheap and the C-level lookup is fast. There is also the golf version, \`Trie = lambda: defaultdict(Trie)\`, which builds an infinitely nested defaultdict and is genuinely useful for a throwaway prefix index — but it has nowhere to put \`is_word\`, so it needs a sentinel key. The \`is_word\` flag is load-bearing: without it, inserting "apple" would make \`search("app")\` return true.

### The complexity is in the key length, not the collection size

Insert, search, and prefix check are all **O(L)** where L is the length of the key. **n does not appear.** A trie holding ten words and a trie holding ten million words answer \`search("banana")\` in the same six steps. Space is O(total characters stored) nodes in the worst case (no shared prefixes), each node carrying a child map — which is where tries get expensive.

Compare against a hash set, which is also effectively O(L) since hashing a string reads all L characters, plus an O(L) equality check on a hit. So for pure exact-match membership, a hash set matches the trie on time and beats it substantially on space and constant factor. **Use a hash set for exact lookup. Use a trie when you need prefixes.**

### What only a trie gives you

- \`startsWith(prefix)\` in O(prefix length), independent of dictionary size — autocomplete, typeahead, routing tables.
- **Enumerating all words with a prefix**: walk to the prefix node, DFS the subtree, O(prefix + output size).
- **Wildcard search** (design-add-and-search-words-data-structure): on a \`.\` you branch to every child. Still bounded, and impossible to do efficiently with a hash set, which has no notion of partial keys.
- **Simultaneous multi-pattern matching against a grid or text** (word-search-ii): put all words in one trie, then run a single DFS over the board that walks the trie in lockstep, pruning the instant the current path isn't any word's prefix. Without the trie you re-scan the board once per word. This pruning is the entire reason the problem is tractable and is the canonical "why a trie" story.
- **Lexicographic ordering for free**: DFS with children visited in sorted order emits words in sorted order.

Space-optimized variants worth naming: a **radix tree / compressed trie** collapses single-child chains into one edge holding a substring (this is what IP routing tables and \`etcd\` use), and a **suffix automaton / suffix array** handles substring rather than prefix queries.

If the interviewer asks "would you use a trie here?" and the only operation is exact membership, the correct answer is no.`,
    },
    {
      id: "graph-representations",
      heading: "Graph representations",
      markdown: `A graph is V vertices and E edges. How you store the edges determines what is cheap, and the choice comes down to **density**.

| | Adjacency list | Adjacency matrix | Edge list |
| --- | --- | --- | --- |
| Space | O(V + E) | O(V^2) | O(E) |
| Edge exists? (u, v) | O(deg(u)) | **O(1)** | O(E) |
| Iterate neighbors of u | **O(deg(u))** | O(V) always | O(E) |
| Add edge | O(1) | O(1) | O(1) |
| Remove edge | O(deg(u)) | **O(1)** | O(E) |
| Add vertex | O(1) | O(V^2) rebuild | O(1) |
| Total for BFS / DFS | **O(V + E)** | O(V^2) | needs conversion first |
| Best for | sparse graphs, traversal | dense graphs, edge queries | sorting edges (Kruskal) |

### Density decides

E ranges from 0 to ~V^2. A graph is **sparse** when E is closer to V (social graphs, road networks, dependency graphs, grids — a grid cell has at most 4 neighbors regardless of size) and **dense** when E approaches V^2 (complete graphs, all-pairs distance matrices, small V).

For a sparse graph the matrix is catastrophic: V = 10^5 needs 10^10 matrix cells you'll never read, while the list needs ~2 * 10^5 entries. Traversal cost follows the same split — BFS/DFS on a list is O(V + E) because you visit each vertex once and each edge at most twice; on a matrix it's O(V^2) because finding the neighbors of every vertex means scanning a full row regardless of how few edges exist.

**Default to an adjacency list.** Nearly every interview graph is sparse. Reach for a matrix when V is small and bounded (V <= 500, e.g. Floyd-Warshall), when the graph is genuinely dense, or when the dominant operation is "is there an edge between u and v" rather than traversal. Note the grid special case: a 2D grid *is* an implicit adjacency structure — you don't build a graph at all, you compute neighbors as \`(r+1,c)\`, \`(r-1,c)\`, \`(r,c+1)\`, \`(r,c-1)\` on the fly, which is what number-of-islands does.

### Building an adjacency list from an edge list

Problems hand you edges; you build the list first. Memorize this — it appears in course-schedule, clone-graph, network-delay-time, and every other graph problem.

\`\`\`python
Edge = tuple[int, int]


def build_adjacency(n: int, edges: list[Edge], directed: bool = False) -> list[list[int]]:
    adj: list[list[int]] = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        if not directed:
            adj[v].append(u)
    return adj
\`\`\`

Note \`[[] for _ in range(n)]\` rather than \`[[]] * n\` — the \`*\` operator copies **the same list reference** into every slot, so appending to one appends to all. Exactly the same bug as JavaScript's \`Array(n).fill([])\`, silent, fast to write, and catastrophic; interviewers do notice when you avoid it. (The same trap applies to a 2D grid: \`[[0] * cols for _ in range(rows)]\` is correct, \`[[0] * cols] * rows\` is not. The inner \`[0] * cols\` is fine because \`int\` is immutable — only the *outer* multiplication is the problem.)

Weighted graphs carry the weight in the entry:

\`\`\`python
WeightedEdge = tuple[int, int, int]


def build_weighted(n: int, edges: list[WeightedEdge]) -> list[list[tuple[int, int]]]:
    adj: list[list[tuple[int, int]]] = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((v, w))
    return adj
\`\`\`

When vertices are labeled by strings rather than dense integers, \`defaultdict(list)\` builds the map in a single pass with no initialization step at all:

\`\`\`python
from collections import Counter, defaultdict


def build_labeled(edges: list[tuple[str, str]]) -> defaultdict[str, list[str]]:
    adj: defaultdict[str, list[str]] = defaultdict(list)
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    return adj


def build_with_indegree(n: int, edges: list[Edge]) -> tuple[list[list[int]], list[int]]:
    """Topological sort wants both, and both come from one pass."""
    adj: list[list[int]] = [[] for _ in range(n)]
    indegree = [0] * n
    for u, v in edges:
        adj[u].append(v)
        indegree[v] += 1
    return adj, indegree
\`\`\`

Two cautions on \`defaultdict\`. A **read** of a missing key inserts it, so checking \`if adj[x]\` during traversal quietly grows the graph — use \`adj.get(x, ())\` or \`if x in adj\`. And iterating a defaultdict while any lookup might insert raises \`RuntimeError: dictionary changed size during iteration\`. When labels are dense-ish, mapping them to indices once (\`{label: i for i, label in enumerate(labels)}\`) and keeping the list form is faster and lets \`visited\` be a plain \`[False] * n\` instead of a set.

Track in-degree while building when the problem is topological sort (course-schedule): one extra array, computed in the same pass, saves a second traversal. \`Counter(v for _, v in edges)\` is the one-liner version, but it omits the zero-degree vertices, which are exactly the ones you need to seed the queue — so the explicit array is usually the safer write.`,
    },
    {
      id: "sorting-comparison",
      heading: "Sorting algorithms compared",
      markdown: `| Algorithm | Best | Average | Worst | Space | Stable | In-place | Used in practice when |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Bubble sort | O(n) | O(n^2) | O(n^2) | O(1) | yes | yes | never; teaching only |
| Selection sort | O(n^2) | O(n^2) | O(n^2) | O(1) | no | yes | when writes are far costlier than reads (exactly n-1 swaps) |
| Insertion sort | O(n) | O(n^2) | O(n^2) | O(1) | yes | yes | tiny or nearly-sorted arrays; the base case inside TimSort and introsort |
| Merge sort | O(n log n) | O(n log n) | O(n log n) | O(n) | yes | no | linked lists, external/on-disk sort, when stability is required |
| Quicksort | O(n log n) | O(n log n) | **O(n^2)** | O(log n) stack | no | yes | the default in-memory sort for primitives |
| Heapsort | O(n log n) | O(n log n) | O(n log n) | O(1) | no | yes | hard worst-case guarantee, tight memory; introsort's fallback |
| Counting sort | O(n + k) | O(n + k) | O(n + k) | O(n + k) | yes | no | small integer range k (ages, ASCII, bucket ids) |
| Radix sort (LSD) | O(d * (n + k)) | same | same | O(n + k) | yes | no | fixed-width integers or strings, large n |
| **Timsort** | **O(n)** | O(n log n) | O(n log n) | O(n) | yes | no | **\`list.sort\` / \`sorted\` — the only sort you will actually call in Python**; also Java objects, V8, Rust's stable \`sort\` |
| Bucket sort | O(n + k) | O(n + k) | O(n^2) | O(n + k) | yes | no | uniformly distributed floats |

The Timsort row is the one that matters in a Python interview, because it is the only row you get to *use*. Everything else on the table is something you'd have to write. When you say "I'll sort, that's O(n log n)," the honest full statement is: **O(n log n) worst case, stable by guarantee (it is documented, not incidental), and O(n) on input that is already sorted, reverse-sorted, or made of a few long sorted runs** — which real data very often is.

### Stability

A sort is **stable** if elements comparing equal keep their original relative order. It only matters when equal elements are distinguishable — that is, when the comparison key is not the whole record.

The concrete case: sort employees by department, then by salary within each department. With a stable sort you do it in **two passes, secondary key first**:

\`\`\`python
from operator import attrgetter

# Stable sorts compose: sort by the least significant key first.
employees.sort(key=attrgetter("salary"))   # secondary
employees.sort(key=attrgetter("dept"))     # primary
# Within each department, salary order survives — because Timsort is stable.

# Usually you would just say it once with a tuple key:
employees.sort(key=lambda e: (e.dept, e.salary))

# Mixed directions are where the two-pass form earns its keep, since
# reverse=True applies to the whole key: dept ascending, salary descending.
employees.sort(key=attrgetter("salary"), reverse=True)
employees.sort(key=attrgetter("dept"))
\`\`\`

That last case is the one to remember: a tuple key can only flip direction on a numeric field (by negating it), so for a descending *string* key you need either two stable passes or \`functools.cmp_to_key\`. And note \`reverse=True\` is **not** "sort then reverse" — it preserves the original order among equal elements rather than flipping it, so stability survives.

Prefer \`key=\` over \`functools.cmp_to_key\` when you have the choice. \`key\` is decorate-sort-undecorate: it calls your function exactly **n** times and then compares the extracted keys in C. A comparator is called O(n log n) times, in Python, per comparison.

With an unstable sort the second pass scrambles the salary order and you have to write one combined comparator instead. Stability is also what makes **radix sort work at all** — LSD radix sorts digit by digit from least significant, and each pass must preserve the order established by the previous ones.

Real-world consequences: click a table column header twice and a stable sort gives you an intuitive sub-ordering; an unstable one shuffles rows that look identical. Python's sort is stable *by documented guarantee*, so you may rely on it. Java uses Timsort (stable) for objects and dual-pivot quicksort (unstable) for primitives — because primitives are indistinguishable when equal, so stability is unobservable.

### Quicksort vs merge sort

Both are O(n log n) average. Quicksort is usually 2-3x faster in practice for in-memory arrays:

- **Cache locality.** Partitioning sweeps two pointers linearly through a contiguous block — near-perfect prefetching. Merge sort reads two separate runs and writes to a third buffer, tripling the memory traffic.
- **In place.** No O(n) auxiliary buffer, so no allocation, no GC pressure, no copy back.
- **Smaller constant** in the inner loop: a compare and a conditional swap, versus a compare plus a copy plus index bookkeeping.

Merge sort wins where those advantages evaporate: **linked lists** (no random access, so partitioning is awkward, but merging is trivial and needs no extra space), **external sorting** (data larger than RAM — merging streams sequentially from disk is exactly right), **stability**, and **a hard O(n log n) guarantee**.

Quicksort's O(n^2) worst case happens when pivots are consistently extreme — a sorted array with a first-element pivot is the classic. Mitigations, all standard:

- **Randomized pivot** — makes the bad case require luck rather than an unlucky input.
- **Median-of-three** (first, middle, last) — cheap, kills the sorted-input case.
- **Introsort**: track recursion depth; past ~2 log n, switch to heapsort. Quicksort's speed in the common case, heapsort's O(n log n) guarantee in the tail. This is what C++ \`std::sort\` does.
- **Insertion sort under ~16 elements**, and **three-way partitioning** (Dutch national flag) when there are many duplicate keys.

The interview-safe answer: "Quicksort in practice for in-memory arrays — better cache behavior, in place, smaller constant — with a randomized pivot and a heapsort fallback so the O(n^2) case can't be triggered. Merge sort if I need stability, a hard worst-case bound, or I'm sorting a linked list or data that doesn't fit in memory."

### What runtimes actually do

- **Python** \`sorted\` / \`list.sort\`: **Timsort** — a merge sort that scans for runs that are already ascending or strictly descending (reversing the descending ones in place), extends any run shorter than the minrun (32-64) with binary insertion sort, then merges the run stack with **galloping** mode, which jumps exponentially ahead when one run is consistently winning. Result: O(n) on sorted, reverse-sorted, or few-run input, O(n log n) worst case, stable, O(n) auxiliary. Timsort was invented for Python in 2002 and then adopted by Java, Android, V8, Swift, and Rust — it is the rare case where the language you're interviewing in has the *best* teaching example. Since 3.11 CPython uses the **powersort** merge policy, which picks a provably near-optimal merge order; the interface and the bounds are unchanged.
- **Java**: Timsort for objects (stability is part of the contract), dual-pivot quicksort for primitives.
- **C++** \`std::sort\`: introsort, not stable. \`std::stable_sort\` is a separate function.
- **Rust**: \`sort\` is stable and Timsort-derived; \`sort_unstable\` is pattern-defeating quicksort and is faster when you don't need stability.
- **V8 / JavaScript** \`Array.prototype.sort\`: Timsort since V8 7.0 (2018), stability guaranteed by the spec since ES2019 — and it still string-coerces by default, which Python never does.

### The Python sorting traps

Python's default is the *correct* one — \`sorted([10, 9, 1])\` is \`[1, 9, 10]\`, because \`<\` on \`int\` is numeric and there is no string coercion anywhere. So the JavaScript comparator trap simply does not exist here. Python's traps are different:

\`\`\`python
# 1. sort() mutates in place and returns None. The classic silent bug:
nums = [3, 1, 2]
nums = nums.sort()          # nums is now None
nums.sort()                 # right: statement, not expression
ordered = sorted(nums)      # right: when the caller still needs the original

# 2. Numbers-as-strings sort lexicographically, by design:
sorted(["10", "9", "1"])        # ['1', '10', '9']
sorted(["10", "9", "1"], key=int)  # ['1', '9', '10']

# 3. Mixed types raise rather than coercing:
sorted([1, "a"])            # TypeError: '<' not supported between 'str' and 'int'

# 4. Descending is a flag, not a negated key — and it stays stable:
sorted(words, key=len, reverse=True)

# 5. Sorting a dict sorts its *keys*; you almost always wanted items:
sorted(counts)                                   # keys
sorted(counts.items(), key=lambda kv: -kv[1])    # by value, descending
\`\`\`

Number 1 is the one that actually costs people points, because \`nums = nums.sort()\` looks like every other language and then throws \`AttributeError: 'NoneType' object has no attribute ...\` three lines later. The convention is consistent across the language — \`list.reverse\`, \`list.append\`, \`random.shuffle\` all mutate and return \`None\` — so the rule is: **if it mutates, it returns \`None\`; if it returns a new object, it doesn't mutate.**

### The Omega(n log n) lower bound

Any sorting algorithm that only learns about the data through **pairwise comparisons** needs Omega(n log n) comparisons in the worst case. The decision-tree argument:

Model the algorithm as a binary tree where each internal node is a comparison and each leaf is a final permutation. For the algorithm to be correct, every one of the **n!** possible input orderings must reach its own leaf — otherwise two different inputs get the same output. A binary tree with n! leaves has height at least log2(n!), and by Stirling's approximation log2(n!) = Theta(n log n). Height is the worst-case number of comparisons, so no comparison sort can beat n log n. Merge sort and heapsort therefore hit the bound; they are asymptotically optimal.

**Counting sort and radix sort escape the bound because they never compare.** They use the key as an array index — a strictly more powerful operation than a yes/no comparison, and it requires an assumption comparison sorts don't make (keys are small integers, or decompose into a fixed number of small-integer digits). Counting sort is O(n + k) for keys in [0, k); it is only a win when k is O(n), since sorting 10 values with keys up to 10^9 allocates a billion counters. Radix sort applies counting sort digit by digit, giving O(d * (n + k)) for d digits.

If an interviewer says "sort this faster than n log n," they are telling you the keys are bounded. That's the whole hint.`,
    },
  ],
  questions: [
    {
      q: "What's the difference between big-O, big-Theta, and big-Omega? And is 'worst case' the same thing as big-O?",
      a: "O is an asymptotic upper bound, Omega is a lower bound, Theta is both — a tight bound. So merge sort is O(n^2) technically, since n log n grows no faster than n^2, but that's a useless statement; what I mean is Theta(n log n). Everyone says big-O and means tight bound, which is fine as long as you know the difference. Worst case is a separate axis entirely: O/Theta/Omega describe growth, while best/average/worst describe which input you're measuring. You can combine them freely — quicksort's average case is Theta(n log n) and its worst case is Theta(n^2). When I state a complexity I try to name the case, because 'O(1) hash lookup' and 'O(n) hash lookup' are both true depending on which case you mean.",
      weak: "Big-O is the worst case, big-Omega is the best case, and big-Theta is the average case.",
    },
    {
      q: "Give me the complexity of this nested loop: outer runs i from 0 to n, inner runs j from i to n.",
      a: "Quadratic. The inner loop runs n times, then n-1, then n-2, down to 1, so the total is n + (n-1) + ... + 1 = n(n+1)/2 = (n^2 + n)/2. Drop the constant and the lower-order term and it's Theta(n^2). The intuition people get wrong is that doing 'half the work' of a full double loop makes it faster asymptotically — it doesn't, the 1/2 is a constant factor. It's genuinely half the operations of the full nested loop, which matters for the wall clock, but not for the complexity class.",
      weak: "The inner loop doesn't run the full n times, it runs about half on average, so it's O(n) or maybe O(n log n).",
    },
    {
      q: "What does amortized O(1) mean, and why is a dynamic array push amortized O(1)?",
      a: "Amortized means the average cost per operation over a worst-case sequence of operations — it's still a worst-case guarantee, just spread across the sequence rather than per call. That's different from average case, which averages over a distribution of inputs and can be broken by an adversary. For a dynamic array: most appends write into spare capacity in O(1). When capacity runs out you allocate a bigger buffer and copy, which is O(n) for that one append. But the resizes happen at geometrically spaced sizes, so with doubling the total copying across n appends is 1 + 2 + 4 + ... + n/2, which is less than n. Total work for n appends is under 2n, so amortized O(1) each. The geometric growth is load-bearing: if you grew by one slot each time you'd copy 1 + 2 + ... + n = n(n+1)/2 elements, which is O(n) amortized per append. Any constant factor above 1 works — CPython's list actually over-allocates to about n + n//8 + 6 slots, a growth factor near 1.125, and the argument is identical because all that matters is that the series is geometric. What it buys is that the expensive operations get rare exactly as fast as they get expensive.",
      weak: "It means it's usually O(1) but sometimes O(n), so on average it's basically O(1). The list just grows when it needs more room.",
    },
    {
      q: "This solution has a while loop nested inside a for loop over n elements. Isn't that O(n^2)?",
      a: "Not necessarily — it depends on whether the inner loop's total work is bounded across all iterations. For a monotonic stack, a single outer iteration can pop n-1 elements, so the worst single iteration really is O(n). But every index is pushed exactly once and popped at most once over the whole run, so the total number of pops across all iterations is at most n. That makes it O(n) total, amortized O(1) per iteration. Same argument for a sliding window: the left and right pointers each only move forward and each is bounded by n, so total pointer movement is at most 2n no matter how the inner while is shaped. The test is whether the inner loop's work is bounded independently of the outer loop or whether it consumes a shared budget — if it's a shared budget that only depletes, you add instead of multiply.",
      weak: "There's a loop inside a loop, so it's O(n^2). To be safe I'd say O(n^2) worst case.",
    },
    {
      q: "Why is a hash map lookup O(1) if it has to handle collisions?",
      a: "The array indexing is genuinely O(1) — hash the key, mask it down to a table index, jump straight to that slot. The O(1) claim then rests on the probe sequence staying short, which holds because the table maintains a load factor: CPython's dict resizes once it's two-thirds full, to a power-of-two table at least three times the live entry count, rehashing every key. Rehashing is O(n) but only after O(n) inserts, so it's amortized O(1). CPython uses open addressing rather than chaining, and the probe isn't linear — it perturbs with the high bits of the hash that the mask discarded, so keys colliding on the low bits scatter instead of clustering. The honest full statement is O(1) average, O(n) worst: if every key lands on the same chain, lookup degenerates to a linear scan. That's not theoretical — hash flooding attacks compute colliding keys and send them as JSON keys or form fields, turning a request into O(n^2). Python's defense since 3.3 is a per-process random SipHash seed for str and bytes, which is why hash('a') differs between runs. Worth noting the limit of that defense: hash(int) is still the identity function and isn't randomized. Java went the other way and converts an over-full bucket into a red-black tree, capping it at O(log n).",
      weak: "Dicts are O(1) because they compute the index directly. Collisions are handled by chaining, which basically never happens with a good hash function.",
    },
    {
      q: "Walk me through why building a heap is O(n) and not O(n log n).",
      a: "You build bottom-up: start at the last internal node and sift down toward the leaves, working backwards to the root. That's what heapq.heapify does, in place, in O(n). The naive count says n nodes times O(log n) per sift-down equals O(n log n), but that overcounts badly, because sift-down cost is proportional to a node's height, not the tree's height, and almost every node is near the bottom. Half the nodes are leaves and cost zero. A quarter are one level up and cost at most 1. An eighth cost at most 2. Summing, there are at most n/2^(h+1) nodes at height h, each costing O(h), so the total is n/2 times the sum of h/2^h, and that series converges to 2 — giving at most n. The direction matters: if you build by n successive heappush calls instead, each push sifts *up*, whose cost is proportional to depth, and most nodes are deep — that really is O(n log n). Same tree, opposite answer, purely because of which way you traverse. So heapify(lst) and a loop of heappush are not interchangeable, and picking the wrong one is a free log factor.",
      weak: "Building a heap is O(n) because you only sift down half the nodes — the leaves are already valid heaps, so you skip them and it comes out to n/2 times log n, which is O(n).",
    },
    {
      q: "When would you use a balanced BST over a hash map?",
      a: "When I need order, or when I need a worst-case guarantee. A hash map beats a tree on point lookups — O(1) average versus O(log n) — so for pure get/put/has I'd use the hash map. But hashing destroys ordering by design, so anything order-dependent is O(n) on a hash map and O(log n) on a tree: min and max, predecessor and successor, floor and ceiling, range queries over [lo, hi], and sorted iteration without a sort. Concretely: a leaderboard that answers 'what's the rank of this score', a scheduler answering 'what's the next event after time t', interval and sweep-line problems. The second reason is latency — a balanced BST is O(log n) worst case, whereas a dict's O(1) is average with an O(n) tail on a resize or an adversarial input, which matters if you have a p99 budget. Worth adding: Python ships no balanced BST and no sorted map at all. dict is ordered by insertion, not by key, which people routinely confuse. So in Python I'd use bisect over a sorted list when reads dominate — O(log n) to find floor, ceiling, or a range, O(n) to insert — or sortedcontainers.SortedList if writes are frequent and the platform allows it. If the problem only needs one specific ordered operation I'd usually build that directly instead: two heaps for a running median, a Fenwick tree for rank queries.",
      weak: "Dicts are O(1) and trees are O(log n), so dicts are basically always better. I'd use a tree if I needed the data sorted, since Python's dict keeps things in order anyway.",
    },
    {
      q: "What's the space complexity of your recursive solution?",
      a: "O(h) auxiliary, where h is the tree height — the recursion stack holds one frame per level on the current root-to-leaf path. If the tree is balanced that's O(log n), but I can't assume balance unless the problem guarantees it, so the worst case is a fully skewed tree at O(n). I'm not counting the output list; if you want total space including the result it's O(n + h). Worth flagging for this input size: Python's default recursion limit is only 1000 frames, so a skewed tree of even 10^4 nodes raises RecursionError. I could call sys.setrecursionlimit, but that only raises Python's guard and not the C stack behind it, so past a certain depth you get a segfault instead of an exception. For anything near 10^5 I'd convert this to an explicit stack — that's a correctness issue, not just an efficiency one.",
      weak: "It's O(1) space — I'm not allocating any extra data structures, I'm just recursing.",
    },
    {
      q: "You said your quicksort is in-place. So it's O(1) space?",
      a: "In-place describes the data movement — I'm swapping within the input list and never allocating a second buffer. But the recursion stack is still space, and quicksort recurses to depth O(log n) if I always recurse on the smaller partition first, so it's O(log n) auxiliary. If I recurse naively and the pivots are bad, the depth is O(n) and so is the space — and in Python that's not just space, it's a RecursionError past 1000 frames. Heapsort is the one that's genuinely O(1) auxiliary — iterative sift-down, no recursion. Merge sort is neither: O(n) for the merge buffer plus O(log n) of stack, which is also why list.sort, being Timsort, is O(n) space rather than O(1).",
      weak: "Yes, in-place means O(1) extra space by definition — that's what in-place means.",
    },
    {
      q: "Is quicksort or merge sort better? Defend your answer.",
      a: "For sorting an in-memory array of primitives, quicksort, and by a decent constant factor. Partitioning sweeps two pointers linearly through contiguous memory, so it prefetches nearly perfectly, while merge sort reads two separate runs and writes to a third buffer, roughly tripling memory traffic. Quicksort is also in place — no O(n) allocation, no GC pressure — and its inner loop is a compare plus a conditional swap. Merge sort wins in four situations: linked lists, where there's no random access to partition on but merging is trivial and needs no extra space; external sorting where the data exceeds RAM and you want sequential streaming; when you need stability; and when you need a hard O(n log n) guarantee. Quicksort's O(n^2) case is real but engineered away in practice — randomized or median-of-three pivots kill the sorted-input case, and introsort switches to heapsort past a depth of about 2 log n, which is what C++ std::sort does. That gets you quicksort's constant with heapsort's guarantee. In Python specifically I'd never hand-roll either: list.sort is Timsort, which is a merge sort but an adaptive one — O(n log n) guaranteed, stable, and O(n) when the data already has long sorted runs, which beats both of them on the input distributions you actually see. The interesting version of this question in Python is quicksort versus Timsort, and Timsort wins because the constant-factor argument for quicksort is about C-level memory traffic that the interpreter overhead swamps anyway.",
      weak: "Merge sort, because it's O(n log n) in the worst case and quicksort is O(n^2). Guaranteed performance is better than average performance.",
    },
    {
      q: "What does stability mean in a sort, and when do you actually need it?",
      a: "A stable sort keeps elements that compare equal in their original relative order. It only matters when equal elements are distinguishable — that is, when your comparison key isn't the whole record. The concrete case is multi-key sorting: to sort employees by department and then by salary within department, a stable sort lets me do two passes, secondary key first — sort by salary, then sort by department — and the salary ordering survives inside each department group. Python's sort is stable by documented guarantee, so I can rely on that. Usually I'd just write one tuple key, key=lambda e: (e.dept, e.salary), and the two-pass form earns its keep only when the directions differ — a tuple key can flip a numeric field by negating it, but for a descending string key you need two stable passes or cmp_to_key. It's also what makes LSD radix sort work at all, since each digit pass has to preserve the ordering from the previous passes. In UI terms it's why clicking a second column header gives an intuitive sub-ordering rather than reshuffling rows. Java uses stable Timsort for objects but unstable dual-pivot quicksort for primitives, precisely because equal primitives are indistinguishable so stability is unobservable.",
      weak: "Stable means the algorithm has consistent performance and doesn't degrade on bad inputs — like how merge sort is stable at O(n log n) but quicksort can go quadratic.",
    },
    {
      q: "You're calling sort here on an array of numbers. Anything you want to check?",
      a: "In Python the numeric case is actually fine — sorted([10, 9, 1]) gives [1, 9, 10], because '<' on ints is numeric and Python never string-coerces the way JavaScript's Array.prototype.sort does. What I'd check instead is four things. First, list.sort() sorts in place and returns None, so 'nums = nums.sort()' silently binds None — either call nums.sort() as a statement or use sorted(nums) if the caller still needs the original order. Second, if these are numeric strings rather than ints they'd sort lexicographically — '10' before '9' — so key=int. Third, mixed types raise TypeError rather than doing something surprising, which is the good outcome but worth anticipating if the data is untrusted. Fourth, for anything non-trivial I'd pass key= rather than functools.cmp_to_key: key is decorate-sort-undecorate, so it's called exactly n times, whereas a comparator gets called O(n log n) times in Python. And descending is reverse=True, which stays stable — it doesn't reverse ties.",
      weak: "That looks fine — sorting a list of numbers gives ascending order by default. I'd just assign the result to a new variable so the original list is untouched.",
    },
    {
      q: "Prove that no comparison-based sort can beat O(n log n).",
      a: "Decision-tree argument. Model the algorithm as a binary tree: each internal node is one comparison, each branch is the yes/no outcome, each leaf is the permutation the algorithm outputs. For the algorithm to be correct, every one of the n! possible input orderings has to end at its own distinct leaf — if two different orderings landed on the same leaf, the algorithm would produce the same output for both and be wrong on at least one. A binary tree with n! leaves has height at least log2(n!), and by Stirling that's Theta(n log n). Height is the worst-case number of comparisons on some root-to-leaf path, so some input forces Omega(n log n) comparisons. Merge sort and heapsort therefore hit the bound and are asymptotically optimal. Counting and radix sort get under it because they don't compare — they use the key directly as an array index, which is a strictly more powerful operation, and it costs them an assumption: keys have to be small integers or decompose into a bounded number of small-integer digits. Counting sort is O(n + k) and only wins when k is O(n).",
      weak: "You can't beat n log n because you have to look at every element, and doing that log n times is the minimum. Counting sort beats it because it's O(n), so it's a special case.",
    },
    {
      q: "Design an LRU cache. What data structures, and why those?",
      a: "A dict from key to node, plus a doubly linked list holding the nodes in recency order, with dummy head and tail sentinels. The dict gives O(1) lookup but has no recency ordering; the list gives O(1) unlink and move-to-front but would need O(n) to find the node. Composing them gets both: the dict hands you the node reference directly, so you never search the list. On get, look up the node and unlink-and-reinsert it at the head. On put, insert at the head, and if you're over capacity, evict from the tail and delete that key from the dict. Everything is O(1), space is O(capacity). It has to be a doubly linked list — with a singly linked list you can't unlink a node in O(1) because you don't have its predecessor, which would drag every operation back to O(n). The sentinels are so unlinking never has to check for None at the ends. Worth saying that Python already has this: collections.OrderedDict is exactly a dict plus a circular doubly linked list, so od.move_to_end(key) and od.popitem(last=False) give the whole cache in about six lines, and functools.lru_cache is built on the same structure. A plain dict would also work today since it's insertion-ordered, but it has no O(1) move-to-end, so you'd have to del and reinsert.",
      weak: "I'd use a dict for the values plus a list to track the order. On access I remove the key from the list and append it to the end, and evict from the front when it's full.",
    },
    {
      q: "Find the top k frequent elements in an array of n elements. What's your complexity, and can you do better than sorting?",
      a: "Count frequencies with collections.Counter in O(n). Then three options. Sorting the distinct entries by count is O(m log m) where m is the number of distinct values — simplest, and fine when m is small. Better is a size-k min-heap keyed on frequency: push each entry, pop when the size exceeds k, so it's O(m log k) time and O(k) space. Note the direction — to keep the k largest you hold a min-heap, so the weakest survivor is the cheapest one to evict. In Python that's already written for me: Counter(nums).most_common(k) calls heapq.nlargest internally and is exactly that algorithm, and heapq.nlargest(k, counts.items(), key=itemgetter(1)) is the explicit form. Best is bucket sort: frequencies are bounded by n, so make a list of n+1 buckets indexed by count, drop each value into its bucket, and scan from the high end until you've collected k. That's O(n) time and O(n) space, and it beats the n log n bound only because the keys are bounded integers. I'd say most_common(k) is the answer I'd ship and the bucket version is the answer if the interviewer wants strict O(n).",
      weak: "Count with a dict, then sort the entries by frequency descending and take the first k. That's O(n log n), which is optimal for this kind of problem.",
    },
    {
      q: "When would you use a trie instead of a hash set?",
      a: "When I need prefixes. Both are effectively O(L) for exact membership — hashing a string reads all L characters anyway — and the hash set is smaller and has a much better constant, so for pure exact-match lookup the hash set is the right call and a trie is over-engineering. The trie earns its space when the query is about partial keys: startsWith in O(prefix length) regardless of dictionary size, enumerating every word under a prefix for autocomplete, wildcard matching where a '.' branches to all children. The strongest case is multi-pattern search — in word-search-ii you put all the words in one trie and run a single DFS over the board walking the trie in lockstep, pruning the moment the current path stops being any word's prefix. Without it you re-scan the board once per word. Notice the complexity is in the key length, not the collection size: a trie with ten words and one with ten million answer a six-character query in the same six steps.",
      weak: "Tries are faster than hash sets for strings because you don't have to hash anything, you just walk down the characters, and lookup is O(L) instead of O(n).",
    },
  ],
  relatedProblems: [
    "two-sum",
    "contains-duplicate",
    "group-anagrams",
    "top-k-frequent-elements",
    "product-of-array-except-self",
    "longest-consecutive-sequence",
    "daily-temperatures",
    "largest-rectangle-in-histogram",
    "binary-search",
    "reverse-linked-list",
    "linked-list-cycle",
    "lru-cache",
    "merge-k-sorted-lists",
    "kth-largest-element-in-a-stream",
    "k-closest-points-to-origin",
    "find-median-from-data-stream",
    "implement-trie-prefix-tree",
    "design-add-and-search-words-data-structure",
    "word-search-ii",
    "validate-binary-search-tree",
    "kth-smallest-element-in-a-bst",
    "course-schedule",
  ],
};
