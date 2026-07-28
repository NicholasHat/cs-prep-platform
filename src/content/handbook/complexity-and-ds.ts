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

\`\`\`ts
for (let i = 0; i < n; i++) {
  for (let j = 0; j < m; j++) {
    work(); // O(1)
  }
}
\`\`\`

O(n * m). If m === n, O(n^2). Say "n times m" rather than "n squared" when the two bounds are different variables — grid problems are O(rows * cols), and calling that O(n^2) hides which dimension is large.

### Multiplicative increments give logs

\`\`\`ts
for (let i = 1; i < n; i *= 2) {
  work();
}
\`\`\`

i takes the values 1, 2, 4, ..., so the loop runs log2(n) times: O(log n). The general rule — if the loop variable is *multiplied* or *divided* by a constant factor each step, you get a log; if it's incremented by a constant, you get a linear count.

Combine them and you get the n log n shape:

\`\`\`ts
for (let i = 1; i <= n; i *= 2) {   // O(log n) iterations
  for (let j = 0; j < n; j++) {     // O(n) each
    work();
  }
}
\`\`\`

O(n log n).

### Inner bound depending on the outer index

\`\`\`ts
for (let i = 0; i < n; i++) {
  for (let j = i; j < n; j++) {
    work();
  }
}
\`\`\`

The inner loop runs n, then n-1, then n-2, ... down to 1. The total is

n + (n-1) + ... + 1 = n(n+1)/2 = (n^2 + n)/2

which is Theta(n^2). This is the arithmetic-series argument and you should be able to produce it on demand — interviewers love it precisely because the naive answer ("half of n^2, so O(n)?") is wrong. **Halving a quadratic is still quadratic.** The constant 1/2 drops.

The same sum appears when the *inner* loop is bounded by i rather than starting at i: 0 + 1 + 2 + ... + (n-1) = n(n-1)/2, also Theta(n^2).

### Sequential blocks add, then the max wins

\`\`\`ts
sortInput(a);          // O(n log n)
for (const x of a) {}  // O(n)
\`\`\`

O(n log n + n) = O(n log n). Addition then domination — this matters when you're tempted to say "I sort and then do a linear pass, so it's O(n)."

### The hidden linear operation inside a loop

This is where most wrong answers come from. The loop body *looks* O(1) and isn't:

| Written | Actual cost per call | Loop becomes |
| --- | --- | --- |
| \`out += s[i]\` in a loop (immutable strings) | O(len(out)) copy | O(n^2) |
| \`arr.shift()\` / \`arr.unshift(x)\` | O(n) reindex | O(n^2) |
| \`arr.includes(x)\` / \`arr.indexOf(x)\` | O(n) scan | O(n^2) |
| \`arr.slice(i)\` / \`str.substring(i)\` | O(n) copy | O(n^2) |
| \`new Set(arr)\` built inside the loop | O(n) | O(n^2) |
| \`Math.max(...arr)\` | O(n) plus a spread allocation | O(n^2) |
| \`arr.splice(i, 1)\` | O(n) shift | O(n^2) |

\`\`\`ts
// O(n^2): a fresh Set per iteration.
for (let i = 0; i < n; i++) {
  if (new Set(a).has(a[i])) count++;
}

// O(n): hoist the Set out.
const seen = new Set(a);
for (let i = 0; i < n; i++) {
  if (seen.has(a[i])) count++;
}
\`\`\`

The fix for string building is always the same: push to an array and \`join("")\` once, which is O(n) total.

\`\`\`ts
const parts: string[] = [];
for (const ch of s) parts.push(transform(ch));
const out = parts.join("");
\`\`\`

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

Grow by a **fixed +1** slot instead and you resize on every push, copying 1 + 2 + ... + n = n(n+1)/2 elements: **O(n) amortized per push**, O(n^2) total. Grow by a fixed +k and it's still O(n^2), just with a 1/k constant. Any constant factor > 1 works; real implementations use 2 (Java, V8's backing stores) or 1.5 (C++ libstdc++, Python's list uses ~1.125 with an offset) trading memory overhead against copy frequency.

Note the asymmetry: growth is amortized O(1), but a *single* push still has O(n) worst case. That matters for latency-sensitive systems, which is why some real-time allocators use incremental copying instead.

### "Each element enters and leaves at most once"

This is the accounting argument you actually use in interviews, and it justifies most of the O(n) solutions in the pattern catalog. If every element can be added to a structure at most once and removed at most once, the total work across the whole run is O(n) even though a single iteration can do O(n) work.

**Monotonic stack** (daily-temperatures, largest-rectangle-in-histogram):

\`\`\`ts
function dailyTemperatures(temps: number[]): number[] {
  const res = new Array<number>(temps.length).fill(0);
  const stack: number[] = []; // indices, temperatures decreasing
  for (let i = 0; i < temps.length; i++) {
    while (stack.length > 0 && temps[i] > temps[stack[stack.length - 1]]) {
      const j = stack.pop() as number;
      res[j] = i - j;
    }
    stack.push(i);
  }
  return res;
}
\`\`\`

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

The Morris traversal exists specifically to get a genuinely O(1)-space in-order tree walk by temporarily rewiring null right pointers. Worth knowing it exists; rarely worth writing.

Also: deep recursion on JS engines throws \`RangeError: Maximum call stack size exceeded\` around 10^4 frames. If n can be 10^5, a recursive DFS will blow the stack — convert to an explicit stack. That is a real correctness argument, not just an efficiency one, and mentioning it scores well.

### JavaScript-specific space notes

- **Closures capture their enclosing scope.** A closure returned from a function keeps the whole variable environment alive, so a callback that references one field of a large object can pin the entire object. Capture the field, not the object, when you care.
- **Memo maps are sized by state count.** \`new Map()\` keyed by \`(i, j)\` on an n x m DP is O(n * m) space, and every key is a boxed string or number plus Map overhead — often 40+ bytes per entry. A 2D typed array (\`Int32Array\`) is dramatically smaller when the state space is dense. Sparse states favor the Map; dense states favor the array.
- **Rolling arrays.** Most 2D DPs only read the previous row, so you can drop from O(n * m) to O(m) by keeping two rows. Offer this as an optimization after your correct solution — it's a reliable follow-up question.
- \`Array.prototype.slice\`, \`concat\`, spread, \`map\`, and \`filter\` all allocate. A chain of four of them over n elements is 4n allocation, still O(n) but with a real constant.`,
    },
    {
      id: "operations-master-table",
      heading: "The operations-complexity master table",
      markdown: `Average case unless noted; **worst case in bold** where it diverges. "Access" means by index or key.

| Structure | Access | Search | Insert front | Insert end | Insert arbitrary | Delete | Space | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Static array | O(1) | O(n) | n/a | n/a | n/a | n/a | O(n) | contiguous; unbeatable cache locality |
| Sorted array | O(1) | O(log n) | O(n) | O(n) | O(n) | O(n) | O(n) | binary search, expensive mutation |
| Dynamic array | O(1) | O(n) | O(n) | O(1) amortized (**O(n)** single push) | O(n) | O(n) | O(n) | JS \`Array\`, \`ArrayList\`, \`vector\` |
| Singly linked list | O(n) | O(n) | O(1) | O(1) with tail ptr, else O(n) | O(1) *given the prior node* | O(1) given prior node, else O(n) | O(n) | no random access; pointer overhead |
| Doubly linked list | O(n) | O(n) | O(1) | O(1) | O(1) given the node | O(1) given the node | O(n) | 2 pointers/node; the LRU workhorse |
| Stack (array-backed) | — | — | — | push O(1) amort. | — | pop O(1) | O(n) | LIFO |
| Queue (linked/ring buffer) | — | — | — | enqueue O(1) | — | dequeue O(1) | O(n) | never back a queue with \`Array.shift()\` |
| Deque | O(1) (ring buffer) | O(n) | O(1) | O(1) | O(n) | O(1) both ends | O(n) | sliding-window maximum |
| Hash map | O(1), **O(n)** | O(1), **O(n)** | — | O(1) amortized | O(1) | O(1), **O(n)** | O(n) | unordered; rehash on load factor |
| Hash set | — | O(1), **O(n)** | — | O(1) | O(1) | O(1) | O(n) | membership only |
| Binary heap | peek O(1) | O(n) | — | push O(log n) | O(log n) | pop-min O(log n); arbitrary delete O(n) to find | O(n) | build-heap O(n); no sorted iteration |
| Unbalanced BST | O(log n), **O(n)** | O(log n), **O(n)** | O(log n), **O(n)** | — | O(log n), **O(n)** | O(log n), **O(n)** | O(n) | degenerates to a list on sorted input |
| Balanced BST (AVL / red-black) | O(log n) | O(log n) | O(log n) | O(log n) | O(log n) | O(log n) | O(n) | worst case, not average; ordered ops |
| Trie | O(L) | O(L) | O(L) | O(L) | O(L) | O(L) | O(total chars * alphabet) | L = key length, independent of n |
| Adjacency list | — | edge check O(deg(v)) | — | add edge O(1) | — | remove edge O(deg(v)) | O(V + E) | neighbor iteration O(deg(v)) |
| Adjacency matrix | — | edge check O(1) | — | add edge O(1) | — | remove edge O(1) | O(V^2) | neighbor iteration O(V) always |
| Edge list | — | O(E) | — | O(1) | — | O(E) | O(E) | good for Kruskal, bad for traversal |

Things this table is trying to teach:

- **Balanced BSTs quote worst case; hash maps quote average.** That asymmetry is the answer to "when would you use a tree over a hash map" under latency requirements.
- **Linked-list O(1) insert is conditional on already holding the node.** Getting to the node is the O(n) part, and candidates quietly drop that clause.
- **A heap does not support search.** Finding an arbitrary element in a heap is O(n); only the min (or max) is cheap. If you need "delete this specific element," you need a heap plus an index map, or a balanced BST.
- **Deleting from a hash map is O(1); deleting from a heap is not.** This drives the "lazy deletion" trick in problems like find-median-from-data-stream and task scheduling.`,
    },
    {
      id: "arrays-and-dynamic-arrays",
      heading: "Arrays and dynamic arrays",
      markdown: `An array is a contiguous block of memory. Element i lives at \`base + i * elementSize\`, so indexing is one multiply and one load — genuinely O(1), and cheap in constant terms too.

### Cache locality is why arrays win

Memory is fetched in cache lines, typically 64 bytes. Reading \`a[0]\` pulls \`a[0..15]\` (for 4-byte elements) into L1 for free, so a linear scan gets ~15 free hits per miss and the hardware prefetcher recognizes the stride and runs ahead of you. A linked list or tree scatters nodes across the heap; every hop is a potential cache miss at ~100x the cost of an L1 hit.

Practical consequence: **an O(n) array scan routinely beats an O(log n) pointer-chasing structure for small n.** Linear search on a 100-element array often outruns a binary search tree with 100 nodes. This is why B-trees exist (wide, cache-line-sized nodes), why real sorts fall back to insertion sort under ~16 elements, and why "just use an array" is a defensible answer at small scale. Say it as a constant-factor argument, not as a claim about asymptotics.

### Capacity vs length

A dynamic array tracks two numbers: **length** (elements you've stored) and **capacity** (slots allocated). Push writes at index length and increments it; when length === capacity, it allocates a bigger buffer and copies. Length is what you see; capacity is what you pay for. Doubling means average memory overhead is ~1.5x the live data, with a transient 3x spike during the copy (old buffer + new buffer both live).

If you know the final size, preallocate — it eliminates every intermediate copy and every reallocation:

\`\`\`ts
const res = new Array<number>(n).fill(0);   // one allocation
for (let i = 0; i < n; i++) res[i] = f(i);
\`\`\`

For numeric work, typed arrays (\`Int32Array\`, \`Float64Array\`) are genuinely contiguous, unboxed, and fixed-size — worth reaching for on hot loops over 10^6+ numbers.

### JavaScript arrays specifically

A JS \`Array\` is an object whose keys happen to be integer-like strings. V8 optimizes this hard, keeping a real contiguous backing store with an "elements kind" (packed smis -> packed doubles -> packed elements -> holey variants), but you can knock it off the fast path:

\`\`\`ts
const a = [1, 2, 3];
a[100] = 4;         // creates holes: HOLEY_SMI_ELEMENTS, slower access
delete a[1];        // also creates a hole; use splice or a sentinel instead
a.length = 0;       // fine — truncates
\`\`\`

Elements kinds only ever transition in the lossy direction; once an array is holey it stays holey. Never build an array by assigning past the end, and never \`delete\` an element.

Cost of the methods people assume are free:

| Method | Cost | Why |
| --- | --- | --- |
| \`push\` / \`pop\` | O(1) amortized | writes at the end |
| \`shift\` / \`unshift\` | **O(n)** | every element reindexes |
| \`splice(i, k)\` | **O(n)** | shifts the tail |
| \`slice(i, j)\` | O(j - i) | allocates a copy |
| \`concat\`, spread | O(n) | allocates |
| \`indexOf\`, \`includes\`, \`find\` | O(n) | linear scan |
| \`sort\` | O(n log n) | TimSort in V8 |
| \`Array.prototype.at(-1)\` | O(1) | preferred over \`a[a.length - 1]\` for readability |

The \`shift\` one is the single most common accidental O(n^2) in JS interview code: implementing a BFS queue as \`const q = []\` plus \`q.shift()\` turns an O(V + E) traversal into O(V^2 + VE). Use a head index instead:

\`\`\`ts
const q: number[] = [start];
for (let head = 0; head < q.length; head++) {
  const node = q[head];              // O(1) dequeue
  for (const next of adj[node]) q.push(next);
}
\`\`\`

That pattern is O(1) per dequeue at the cost of not reclaiming the front of the array — fine for a single traversal, and it is what interviewers expect to see in JS.`,
    },
    {
      id: "linked-lists",
      heading: "Linked lists",
      markdown: `A node holds a value and one or two pointers. Nothing is contiguous, so there is no index arithmetic and no random access: reaching the k-th element means k hops.

\`\`\`ts
class ListNode {
  next: ListNode | null = null;
  constructor(public val: number) {}
}
\`\`\`

### The O(1) insert claim comes with a clause

Inserting after a node you already hold is genuinely O(1) — rewire two pointers, no shifting, no reallocation. **Finding** that node is O(n). So a linked list beats an array for insertion only when your traversal already put you at the insertion point, or when something else hands you the node (a hash map, an iterator). That is precisely the LRU cache setup, and it is why "linked lists are better for insertion" is only half a sentence.

Deleting a node from a *singly* linked list needs the **previous** node; from a doubly linked list you need only the node itself, since it knows its predecessor. That single difference is why every real cache and every \`LinkedHashMap\` uses doubly linked lists.

### Dummy head

Half of linked-list bugs are "what if the change is at the head." A dummy (sentinel) node removes the special case entirely: the real head becomes just another \`next\` pointer, so insertion and deletion code has exactly one branch.

\`\`\`ts
function removeElements(head: ListNode | null, val: number): ListNode | null {
  const dummy = new ListNode(0);
  dummy.next = head;
  let prev = dummy;
  while (prev.next !== null) {
    if (prev.next.val === val) prev.next = prev.next.next;
    else prev = prev.next;
  }
  return dummy.next;   // correct even if the original head was removed
}
\`\`\`

Use it for merge, remove-nth-from-end, partition, and anything that might delete the first node. Reaching for it unprompted reads as experience.

### Doubly linked list + hash map = LRU cache

The canonical composition, and the reason to understand both structures at once. You need two things at O(1): *look up a key* and *move its node to the most-recently-used end*. Neither structure gives you both.

- Hash map: key -> node reference. O(1) lookup, but no ordering.
- Doubly linked list: recency order, O(1) unlink and O(1) move-to-front — **but only because the map handed you the node**, so you never search the list.

Evict from the tail, insert at the head, use dummy head *and* tail nodes so unlinking never touches null. Every operation is O(1); space is O(capacity). If you can explain why a singly linked list fails here (you can't unlink in O(1) without the predecessor) you've answered the real question.

### The gotchas interviewers watch for

- **Losing the head.** Reversal in particular: save \`next\` before you overwrite \`node.next\`, or you drop the rest of the list.
- **Empty and single-node inputs.** \`head === null\` and \`head.next === null\` break most naive two-pointer code. Check them first.
- **Off-by-one on fast/slow pointers.** For the middle of the list, \`while (fast !== null && fast.next !== null)\` lands slow on the second middle for even lengths; \`while (fast.next !== null && fast.next.next !== null)\` lands on the first. Know which one the problem wants.
- **Cycle detection.** Floyd's tortoise and hare: slow moves 1, fast moves 2; they meet inside a cycle. O(n) time, O(1) space. To find the cycle's *entry*, reset one pointer to the head and advance both by 1 — they meet at the start of the cycle. The alternative, a hash set of visited nodes, is O(n) time and O(n) space; mention both and name the tradeoff.
- **A cycle makes any traversal infinite.** If cycles are possible, your \`while (node !== null)\` never terminates.

\`\`\`ts
function hasCycle(head: ListNode | null): boolean {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = (slow as ListNode).next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}
\`\`\``,
    },
    {
      id: "hash-maps-and-sets",
      heading: "Hash maps and hash sets",
      markdown: `A hash map is an array of buckets plus a hash function mapping keys to bucket indices. \`get(k)\` computes \`hash(k) % numBuckets\`, jumps straight to that bucket, and searches within it. The array index is O(1); the whole structure is O(1) *only if buckets stay short*.

### Collisions

Two keys can hash to the same bucket — guaranteed by pigeonhole once you have more keys than buckets. Two strategies:

**Separate chaining.** Each bucket holds a list (or, in Java 8+, a tree once a bucket exceeds 8 entries). Simple, degrades gracefully, tolerates load factors above 1, but every lookup costs a pointer dereference and the chain nodes hurt cache locality.

**Open addressing** (linear probing, quadratic probing, double hashing). All entries live in the bucket array itself; on collision you probe subsequent slots until you find the key or an empty slot. Better cache behavior — probing walks contiguous memory — and no per-entry allocation, which is why most modern implementations (Python's dict, Rust's \`HashMap\`, Google's Swiss tables) use it. The costs: deletion needs tombstones (you can't just empty a slot or you break the probe chain for keys past it), and performance falls off a cliff as load factor approaches 1 because of primary clustering.

### Load factor and rehashing

Load factor = entries / buckets. When it crosses a threshold (0.75 in Java, 0.66 in Python, ~0.875 for Swiss tables), the map allocates a bucket array of double the size and **rehashes every key** — bucket index depends on the array size, so nothing can just be copied. That's O(n) for one insert, amortized O(1) by the same geometric argument as the dynamic array.

Corollary: if you know the size up front, preallocate. Building a 10^6-entry map from empty performs ~20 rehashes and copies ~2 x 10^6 entries.

### Why the worst case is O(n) and why it matters

If every key lands in one bucket, lookup degenerates to a linear scan. Causes:

- **A bad hash function** for your key distribution (hashing only the first character of a string; using an integer key modulo a power of two when your keys are all multiples of that power).
- **An adversary.** If the hash function is deterministic and public, an attacker can compute thousands of colliding keys and POST them as form fields or JSON keys, turning every insert into O(n) and the request into O(n^2). This is **hash flooding**, a real DoS class that hit PHP, Java, Python, and Node around 2011-2012. The fix is a per-process random seed (SipHash in Python/Rust, a random seed in V8), which makes collisions unpredictable across runs. This is also why Java's HashMap trees over-full buckets: it caps the degenerate case at O(log n).

So the honest statement is: **O(1) average, O(n) worst, with the worst case being unreachable in practice for non-adversarial input under a randomized hash.** That full sentence is what separates a memorized answer from an understood one.

### Iteration order

Do not rely on it — except where the spec guarantees it, and JavaScript is the notable place it does.

- **\`Map\`** iterates in **insertion order**, guaranteed by the spec. Safe to depend on.
- **\`Set\`** likewise, insertion order.
- **Plain objects** follow a stranger rule: **integer-like keys first, in ascending numeric order**, then string keys in insertion order, then symbols. So \`{ b: 1, 2: 2, a: 3, 1: 4 }\` iterates as \`1, 2, b, a\`. This bites people building ordered maps keyed by numeric ids.
- Java's \`HashMap\` and Python's \`set\` give no order guarantee; Python's \`dict\` has guaranteed insertion order since 3.7.

### Key equality in JavaScript

\`Map\` and \`Set\` compare keys with SameValueZero — essentially \`===\` with \`NaN\` equal to itself. For objects that means **reference identity**:

\`\`\`ts
const m = new Map<number[], string>();
m.set([1, 2], "a");
m.get([1, 2]);   // undefined — different array, different reference
\`\`\`

There is no structural equality and no way to supply a custom hash or comparator. So when your logical key is a tuple, **encode it into a primitive**:

\`\`\`ts
// String key: readable, works for any values, allocates a string per lookup.
const key = \`\${r},\${c}\`;

// Numeric key: faster, no allocation, requires a known bound on one dimension.
const key2 = r * numCols + c;
\`\`\`

Pick the numeric encoding in hot loops and say why — it avoids a string allocation and a string hash on every access. And watch the separator in the string form: without the comma, \`(1, 23)\` and \`(12, 3)\` both become \`"123"\`.

### \`Map\` vs plain object

| | \`Map\` | plain object |
| --- | --- | --- |
| Key types | any value, including objects | strings and symbols (numbers are coerced) |
| Iteration order | insertion order | integer-like keys first, ascending |
| Size | \`.size\`, O(1) | \`Object.keys(o).length\`, O(n) and allocates |
| Inherited keys | none | \`__proto__\`, \`toString\`, \`constructor\` collide unless you use \`Object.create(null)\` |
| Frequent add/delete | optimized for it | delete transitions the object to dictionary mode |
| JSON | needs conversion | serializes directly |

Default to \`Map\` for a genuine dynamic dictionary — especially with numeric keys or user-controlled keys, where a plain object's prototype chain is both a correctness and a security hazard (prototype pollution). Use a plain object for fixed-shape records and anything you're about to \`JSON.stringify\`.`,
    },
    {
      id: "heaps-and-priority-queues",
      heading: "Heaps and priority queues",
      markdown: `A binary heap is a **complete** binary tree (every level full except possibly the last, which fills left to right) satisfying the **heap property**: every node is <= both children (min-heap) or >= both (max-heap). Note what it does *not* say — there is no ordering between siblings, and no ordering across subtrees. A heap is far weaker than a BST, which is exactly why it's cheaper to maintain.

Completeness means it packs into an array with no pointers and no holes:

- left child of i: \`2 * i + 1\`
- right child of i: \`2 * i + 2\`
- parent of i: \`(i - 1) >> 1\`

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

### JavaScript has no built-in priority queue

Java has \`PriorityQueue\`, Python has \`heapq\`, C++ has \`priority_queue\`. JavaScript has nothing. So in a JS interview you either write one or justify a fallback — and because writing one costs several minutes, most interviewers will explicitly accept "I'd use a heap here; with no built-in I'll sort and take the first k, which is O(n log n) instead of O(n log k)." Say the tradeoff out loud and offer to implement it. Here is the implementation worth having memorized:

\`\`\`ts
/**
 * Binary min-heap over an arbitrary comparator.
 * \`compare(a, b) < 0\` means \`a\` comes out first.
 */
export class MinHeap<T> {
  private readonly data: T[] = [];

  constructor(private readonly compare: (a: T, b: T) => number) {}

  get size(): number {
    return this.data.length;
  }

  peek(): T | undefined {
    return this.data[0];
  }

  push(value: T): void {
    this.data.push(value);
    this.siftUp(this.data.length - 1);
  }

  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop() as T;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  /** O(n) bottom-up heapify, not n successive pushes. */
  static from<T>(items: Iterable<T>, compare: (a: T, b: T) => number): MinHeap<T> {
    const heap = new MinHeap<T>(compare);
    heap.data.push(...items);
    for (let i = (heap.data.length >> 1) - 1; i >= 0; i--) heap.siftDown(i);
    return heap;
  }

  private siftUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.compare(this.data[i], this.data[parent]) >= 0) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  private siftDown(i: number): void {
    const n = this.data.length;
    for (;;) {
      const left = 2 * i + 1;
      const right = left + 1;
      let smallest = i;
      if (left < n && this.compare(this.data[left], this.data[smallest]) < 0) {
        smallest = left;
      }
      if (right < n && this.compare(this.data[right], this.data[smallest]) < 0) {
        smallest = right;
      }
      if (smallest === i) return;
      this.swap(i, smallest);
      i = smallest;
    }
  }

  private swap(i: number, j: number): void {
    const tmp = this.data[i];
    this.data[i] = this.data[j];
    this.data[j] = tmp;
  }
}
\`\`\`

A max-heap is the same class with the comparator flipped — \`new MinHeap<number>((a, b) => b - a)\`. Never write two classes.

Top-k with it, O(n log k) time and O(k) space:

\`\`\`ts
function topK(nums: number[], k: number): number[] {
  const heap = new MinHeap<number>((a, b) => a - b);
  for (const x of nums) {
    heap.push(x);
    if (heap.size > k) heap.pop();   // evict the smallest
  }
  const out: number[] = [];
  while (heap.size > 0) out.push(heap.pop() as number);
  return out.reverse();
}
\`\`\`

Note the direction: to keep the k *largest*, you hold a **min**-heap so the weakest survivor is the one you can cheaply evict. Getting that backwards is a common slip.

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

\`\`\`ts
function inorder(root: TreeNode | null, out: number[] = []): number[] {
  if (root === null) return out;
  inorder(root.left, out);
  out.push(root.val);
  inorder(root.right, out);
  return out;
}
\`\`\`

O(n) time, O(h) stack. This is the engine behind kth-smallest-element-in-a-bst: traverse in order and stop at the k-th element, giving O(h + k) rather than O(n) — because you can **stop early**, which is only possible in an ordered structure.

The iterative form with an explicit stack is worth knowing since it lets you pause mid-traversal (a BST iterator) and avoids stack overflow on skewed trees:

\`\`\`ts
function kthSmallest(root: TreeNode | null, k: number): number {
  const stack: TreeNode[] = [];
  let node = root;
  while (node !== null || stack.length > 0) {
    while (node !== null) {
      stack.push(node);
      node = node.left;
    }
    node = stack.pop() as TreeNode;
    if (--k === 0) return node.val;
    node = node.right;
  }
  throw new Error("k exceeds tree size");
}
\`\`\`

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

So: **hash map for membership and counting, balanced BST when you need order, ranges, or a worst-case latency bound.** Concrete cases where the tree is the right call — a leaderboard needing "rank of this score", a calendar needing "next meeting after time t" (meeting-rooms-ii, my-calendar), rate limiting by timestamp window, and any interval or sweep-line problem. Java exposes this as \`TreeMap\` (\`floorKey\`, \`ceilingKey\`, \`subMap\`), C++ as \`std::map\` with \`lower_bound\`. JavaScript ships **neither** a TreeMap nor a sorted container, so in JS you fall back to a sorted array with binary search (O(n) insert, fine when writes are rare) or you write a skip list. Saying that out loud is a strong signal — most candidates assume \`Map\` is ordered by key. It isn't; it's ordered by insertion.`,
    },
    {
      id: "tries",
      heading: "Tries (prefix trees)",
      markdown: `A trie stores keys along **paths** rather than in nodes. The root is the empty prefix; each edge is a character; each node marks whether the path to it forms a complete word. Every string sharing a prefix shares the nodes for that prefix.

\`\`\`ts
class TrieNode {
  readonly children = new Map<string, TrieNode>();
  isWord = false;
}

export class Trie {
  private readonly root = new TrieNode();

  /** O(L) where L is word.length. */
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

  search(word: string): boolean {
    const node = this.walk(word);
    return node !== undefined && node.isWord;
  }

  startsWith(prefix: string): boolean {
    return this.walk(prefix) !== undefined;
  }

  private walk(s: string): TrieNode | undefined {
    let node: TrieNode | undefined = this.root;
    for (const ch of s) {
      node = node.children.get(ch);
      if (node === undefined) return undefined;
    }
    return node;
  }
}
\`\`\`

A fixed-alphabet variant swaps the \`Map\` for \`Array<TrieNode | null>(26)\` indexed by \`ch.charCodeAt(0) - 97\` — faster and more compact for lowercase-only inputs, wasteful for sparse alphabets or Unicode. The \`isWord\` flag is load-bearing: without it, inserting "apple" would make \`search("app")\` return true.

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

\`\`\`ts
type Edge = [from: number, to: number];

function buildAdjacency(n: number, edges: Edge[], directed = false): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    if (!directed) adj[v].push(u);
  }
  return adj;
}
\`\`\`

Note \`Array.from({ length: n }, () => [])\` rather than \`new Array(n).fill([])\` — \`fill\` puts **the same array reference** in every slot, so pushing to one pushes to all. That bug is silent, fast to write, and catastrophic; interviewers do notice when you avoid it.

Weighted graphs carry the weight in the entry:

\`\`\`ts
type WeightedEdge = [from: number, to: number, weight: number];

function buildWeighted(n: number, edges: WeightedEdge[]): Array<Array<[number, number]>> {
  const adj: Array<Array<[number, number]>> = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  return adj;
}
\`\`\`

When vertices are labeled by strings rather than dense integers, use \`Map<string, string[]>\` — or map labels to indices once and keep the array form, which is faster and lets you use a plain boolean array for \`visited\`.

Also track in-degree while building when the problem is topological sort (course-schedule): one extra array, computed in the same pass, saves a second traversal.`,
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
| TimSort | O(n) | O(n log n) | O(n log n) | O(n) | yes | no | real-world partially-ordered data; Python, Java objects, V8 |
| Bucket sort | O(n + k) | O(n + k) | O(n^2) | O(n + k) | yes | no | uniformly distributed floats |

### Stability

A sort is **stable** if elements comparing equal keep their original relative order. It only matters when equal elements are distinguishable — that is, when the comparison key is not the whole record.

The concrete case: sort employees by department, then by salary within each department. With a stable sort you do it in **two passes, secondary key first**:

\`\`\`ts
// Stable sorts compose: sort by the least significant key first.
employees.sort((a, b) => a.salary - b.salary);          // secondary
employees.sort((a, b) => a.dept.localeCompare(b.dept)); // primary
// Within each department, salary order survives — because the sort is stable.
\`\`\`

With an unstable sort the second pass scrambles the salary order and you have to write one combined comparator instead. Stability is also what makes **radix sort work at all** — LSD radix sorts digit by digit from least significant, and each pass must preserve the order established by the previous ones.

Real-world consequences: click a table column header twice and a stable sort gives you an intuitive sub-ordering; an unstable one shuffles rows that look identical. Java uses TimSort (stable) for objects and dual-pivot quicksort (unstable) for primitives — because primitives are indistinguishable when equal, so stability is unobservable.

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

- **Python** \`sorted\` / \`list.sort\`: TimSort — merge sort that detects existing sorted runs, extends short runs with insertion sort, and merges with galloping. O(n) on already-sorted input, stable, and very fast on real data, which is rarely random.
- **Java**: TimSort for objects (stability is part of the contract), dual-pivot quicksort for primitives.
- **C++** \`std::sort\`: introsort, not stable. \`std::stable_sort\` is a separate function.
- **V8 / JavaScript** \`Array.prototype.sort\`: TimSort since V8 7.0 (2018), and **stability is guaranteed by the spec** since ES2019. Before that it was implementation-defined and V8 used an unstable quicksort for arrays over 10 elements.

### The JavaScript comparator trap

\`\`\`ts
[10, 9, 1].sort();              // [1, 10, 9]  — WRONG
[10, 9, 1].sort((a, b) => a - b); // [1, 9, 10] — right
\`\`\`

With no comparator, \`sort\` converts every element to a string and compares UTF-16 code units, so "10" < "9". This bites people in interviews constantly, and \`sort()\` on numbers with no comparator is the single most common silent bug in JS interview code. Two more: \`sort\` mutates the receiver (use \`toSorted()\` or \`[...a].sort()\` if the caller still needs the original), and the comparator must return a **number**, not a boolean — \`(a, b) => a > b\` is broken because \`true\`/\`false\` coerce to 1/0 and the "a before b" case is never expressed.

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
      a: "Amortized means the average cost per operation over a worst-case sequence of operations — it's still a worst-case guarantee, just spread across the sequence rather than per call. That's different from average case, which averages over a distribution of inputs and can be broken by an adversary. For a dynamic array: most pushes write into spare capacity in O(1). When capacity runs out you allocate double and copy, which is O(n) for that one push. But resizes happen at sizes 1, 2, 4, 8, ..., so the total copying across n pushes is 1 + 2 + 4 + ... + n/2, which is less than n. Total work for n pushes is under 2n, so amortized O(1) each. The doubling is load-bearing: if you grew by one slot each time you'd copy 1 + 2 + ... + n = n(n+1)/2 elements, which is O(n) amortized per push. Any constant growth factor above 1 works; the geometric series is what makes the expensive operations get rare exactly as fast as they get expensive.",
      weak: "It means it's usually O(1) but sometimes O(n), so on average it's basically O(1). The array just grows when it needs more room.",
    },
    {
      q: "This solution has a while loop nested inside a for loop over n elements. Isn't that O(n^2)?",
      a: "Not necessarily — it depends on whether the inner loop's total work is bounded across all iterations. For a monotonic stack, a single outer iteration can pop n-1 elements, so the worst single iteration really is O(n). But every index is pushed exactly once and popped at most once over the whole run, so the total number of pops across all iterations is at most n. That makes it O(n) total, amortized O(1) per iteration. Same argument for a sliding window: the left and right pointers each only move forward and each is bounded by n, so total pointer movement is at most 2n no matter how the inner while is shaped. The test is whether the inner loop's work is bounded independently of the outer loop or whether it consumes a shared budget — if it's a shared budget that only depletes, you add instead of multiply.",
      weak: "There's a loop inside a loop, so it's O(n^2). To be safe I'd say O(n^2) worst case.",
    },
    {
      q: "Why is a hash map lookup O(1) if it has to handle collisions?",
      a: "The array indexing is genuinely O(1) — hash the key, mod by the bucket count, jump straight to that slot. The O(1) claim then rests on buckets staying short, which holds because the map maintains a load factor: once entries/buckets crosses about 0.75 it doubles the bucket array and rehashes everything, so the expected chain length stays constant. Rehashing is O(n) but only after O(n) inserts, so it's amortized O(1). The honest full statement is O(1) average, O(n) worst — if every key hashes to the same bucket, lookup degenerates to a linear scan. That's not just theoretical: hash flooding attacks work by computing colliding keys and sending them as JSON keys or form fields, turning a request into O(n^2). The defense is a randomized per-process hash seed, which is why Python and V8 randomize; Java additionally converts an over-full bucket into a red-black tree to cap it at O(log n).",
      weak: "Hash maps are O(1) because they compute the index directly. Collisions are handled by chaining, which basically never happens with a good hash function.",
    },
    {
      q: "Walk me through why building a heap is O(n) and not O(n log n).",
      a: "You build bottom-up: start at the last internal node and sift down toward the leaves, working backwards to the root. The naive count says n nodes times O(log n) per sift-down equals O(n log n), but that overcounts badly, because sift-down cost is proportional to a node's height, not the tree's height, and almost every node is near the bottom. Half the nodes are leaves and cost zero. A quarter are one level up and cost at most 1. An eighth cost at most 2. Summing, there are at most n/2^(h+1) nodes at height h, each costing O(h), so the total is n/2 times the sum of h/2^h, and that series converges to 2 — giving at most n. The direction matters: if you build by n successive pushes instead, each push sifts *up*, whose cost is proportional to depth, and most nodes are deep — that really is O(n log n). Same tree, opposite answer, purely because of which way you traverse.",
      weak: "Building a heap is O(n) because you only sift down half the nodes — the leaves are already valid heaps, so you skip them and it comes out to n/2 times log n, which is O(n).",
    },
    {
      q: "When would you use a balanced BST over a hash map?",
      a: "When I need order, or when I need a worst-case guarantee. A hash map beats a tree on point lookups — O(1) average versus O(log n) — so for pure get/put/has I'd use the hash map. But hashing destroys ordering by design, so anything order-dependent is O(n) on a hash map and O(log n) on a tree: min and max, predecessor and successor, floor and ceiling, range queries over [lo, hi], and sorted iteration without a sort. Concretely: a leaderboard that answers 'what's the rank of this score', a scheduler answering 'what's the next event after time t', interval and sweep-line problems. The second reason is latency — a balanced BST is O(log n) worst case, whereas a hash map's O(1) is average with an O(n) tail on a bad rehash or an adversarial input, which matters if you have a p99 budget. Worth adding: JavaScript ships no TreeMap. Map is ordered by insertion, not by key. So in JS I'd use a sorted array with binary search if writes are rare, or accept O(n log n) by sorting when I need order.",
      weak: "Hash maps are O(1) and trees are O(log n), so hash maps are basically always better. I'd use a tree if I needed the data sorted, since JavaScript's Map keeps things in order anyway.",
    },
    {
      q: "What's the space complexity of your recursive solution?",
      a: "O(h) auxiliary, where h is the tree height — the recursion stack holds one frame per level on the current root-to-leaf path. If the tree is balanced that's O(log n), but I can't assume balance unless the problem guarantees it, so the worst case is a fully skewed tree at O(n). I'm not counting the output array; if you want total space including the result it's O(n + h). Worth flagging for this input size: JS engines blow the stack somewhere around 10^4 frames, so if n can reach 10^5 I'd convert this to an explicit stack — that's a correctness issue, not just an efficiency one.",
      weak: "It's O(1) space — I'm not allocating any extra data structures, I'm just recursing.",
    },
    {
      q: "You said your quicksort is in-place. So it's O(1) space?",
      a: "In-place describes the data movement — I'm swapping within the input array and never allocating a second buffer. But the recursion stack is still space, and quicksort recurses to depth O(log n) if I always recurse on the smaller partition first, so it's O(log n) auxiliary. If I recurse naively and the pivots are bad, the depth is O(n) and so is the space. Heapsort is the one that's genuinely O(1) auxiliary — iterative sift-down, no recursion. Merge sort is neither: O(n) for the merge buffer plus O(log n) of stack.",
      weak: "Yes, in-place means O(1) extra space by definition — that's what in-place means.",
    },
    {
      q: "Is quicksort or merge sort better? Defend your answer.",
      a: "For sorting an in-memory array of primitives, quicksort, and by a decent constant factor. Partitioning sweeps two pointers linearly through contiguous memory, so it prefetches nearly perfectly, while merge sort reads two separate runs and writes to a third buffer, roughly tripling memory traffic. Quicksort is also in place — no O(n) allocation, no GC pressure — and its inner loop is a compare plus a conditional swap. Merge sort wins in four situations: linked lists, where there's no random access to partition on but merging is trivial and needs no extra space; external sorting where the data exceeds RAM and you want sequential streaming; when you need stability; and when you need a hard O(n log n) guarantee. Quicksort's O(n^2) case is real but engineered away in practice — randomized or median-of-three pivots kill the sorted-input case, and introsort switches to heapsort past a depth of about 2 log n, which is what C++ std::sort does. That gets you quicksort's constant with heapsort's guarantee.",
      weak: "Merge sort, because it's O(n log n) in the worst case and quicksort is O(n^2). Guaranteed performance is better than average performance.",
    },
    {
      q: "What does stability mean in a sort, and when do you actually need it?",
      a: "A stable sort keeps elements that compare equal in their original relative order. It only matters when equal elements are distinguishable — that is, when your comparison key isn't the whole record. The concrete case is multi-key sorting: to sort employees by department and then by salary within department, a stable sort lets me do two passes, secondary key first — sort by salary, then sort by department — and the salary ordering survives inside each department group. With an unstable sort I'd have to write one combined comparator. It's also what makes LSD radix sort work at all, since each digit pass has to preserve the ordering from the previous passes. In UI terms it's why clicking a second column header gives an intuitive sub-ordering rather than reshuffling rows. Java uses stable TimSort for objects but unstable dual-pivot quicksort for primitives, precisely because equal primitives are indistinguishable so stability is unobservable.",
      weak: "Stable means the algorithm has consistent performance and doesn't degrade on bad inputs — like how merge sort is stable at O(n log n) but quicksort can go quadratic.",
    },
    {
      q: "You're calling sort here on an array of numbers. Anything you want to check?",
      a: "Yes — I need to pass a comparator. Array.prototype.sort with no arguments converts every element to a string and compares UTF-16 code units, so [10, 9, 1].sort() gives [1, 10, 9] because '10' sorts before '9'. It needs to be (a, b) => a - b. Two related things: the comparator has to return a number, not a boolean — (a, b) => a > b is broken because true and false coerce to 1 and 0, so 'a comes first' is never expressed — and sort mutates the receiver, so if the caller still needs the original order I'd use toSorted() or spread it first.",
      weak: "That looks fine — sort on an array of numbers sorts them ascending by default.",
    },
    {
      q: "Prove that no comparison-based sort can beat O(n log n).",
      a: "Decision-tree argument. Model the algorithm as a binary tree: each internal node is one comparison, each branch is the yes/no outcome, each leaf is the permutation the algorithm outputs. For the algorithm to be correct, every one of the n! possible input orderings has to end at its own distinct leaf — if two different orderings landed on the same leaf, the algorithm would produce the same output for both and be wrong on at least one. A binary tree with n! leaves has height at least log2(n!), and by Stirling that's Theta(n log n). Height is the worst-case number of comparisons on some root-to-leaf path, so some input forces Omega(n log n) comparisons. Merge sort and heapsort therefore hit the bound and are asymptotically optimal. Counting and radix sort get under it because they don't compare — they use the key directly as an array index, which is a strictly more powerful operation, and it costs them an assumption: keys have to be small integers or decompose into a bounded number of small-integer digits. Counting sort is O(n + k) and only wins when k is O(n).",
      weak: "You can't beat n log n because you have to look at every element, and doing that log n times is the minimum. Counting sort beats it because it's O(n), so it's a special case.",
    },
    {
      q: "Design an LRU cache. What data structures, and why those?",
      a: "A hash map from key to node, plus a doubly linked list holding the nodes in recency order, with dummy head and tail sentinels. The map gives O(1) lookup but has no ordering; the list gives O(1) unlink and move-to-front but would need O(n) to find the node. Composing them gets both: the map hands you the node reference directly, so you never search the list. On get, look up the node in the map and unlink-and-reinsert it at the head. On put, insert at the head, and if you're over capacity, evict from the tail and delete that key from the map. Everything is O(1), space is O(capacity). It has to be a doubly linked list — with a singly linked list you can't unlink a node in O(1) because you don't have its predecessor, which would drag every operation back to O(n). The sentinels are so unlinking never has to null-check the ends.",
      weak: "I'd use a hash map for the values plus an array to track the order. On access I remove the key from the array and push it to the end, and evict from the front when it's full.",
    },
    {
      q: "Find the top k frequent elements in an array of n elements. What's your complexity, and can you do better than sorting?",
      a: "Count frequencies with a hash map in O(n). Then three options. Sorting the distinct entries by count is O(m log m) where m is the number of distinct values — simplest, and fine when m is small. Better is a size-k min-heap keyed on frequency: push each entry, pop when the size exceeds k, so it's O(m log k) time and O(k) space. Note the direction — to keep the k largest you hold a min-heap, so the weakest survivor is the cheapest one to evict. Best is bucket sort: frequencies are bounded by n, so make an array of n+1 buckets indexed by count, drop each value into its bucket, and scan from the high end until you've collected k. That's O(n) time and O(n) space, and it beats the n log n bound only because the keys are bounded integers. In JS I'd mention that there's no built-in heap, so I'd either write one or use the bucket approach, which is both faster and less code here.",
      weak: "Count with a hash map, then sort the entries by frequency descending and take the first k. That's O(n log n), which is optimal for this kind of problem.",
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
