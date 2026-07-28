import type { HandbookChapter } from "./types";

export const chapter: HandbookChapter = {
  slug: "language-toolkit",
  title: "Language Toolkit: Python, Java, JS/TS, C++",
  track: "fundamentals",
  order: 2,
  summary:
    "Choosing your interview language, and the language-specific details that actually decide rounds — Python's standard library, Java's collections and equals/hashCode, JavaScript's closures and event loop, TypeScript's type system, and C++ memory semantics.",
  estMinutes: 80,
  tags: [
    "python",
    "java",
    "javascript",
    "typescript",
    "cpp",
    "language-trivia",
    "standard-library",
  ],
  sections: [
    {
      id: "choosing-a-language",
      heading: "Choosing your interview language",
      markdown: `Pick one language, get genuinely fluent in it, and use it for every coding round. Switching languages between rounds costs you the muscle memory that makes the difference between finishing the problem and running out of time.

The one hard rule: **you must be able to write correct code in it without an IDE, without autocomplete, and without running it.** That eliminates most people's second-best language.

| | Strengths | Costs |
| --- | --- | --- |
| **Python** | Least code per idea, batteries-included stdlib (\`Counter\`, \`deque\`, \`heapq\`, \`bisect\`), no type ceremony, fastest to write on a whiteboard | Slowest runtime, so tight TLE limits on some judges; the abstraction can hide whether you understand the underlying data structure |
| **Java** | Explicit and unambiguous; strong typing catches errors as you write; the interviewer sees exactly what you mean; ubiquitous in big-company backends | Verbose — \`Map<String, List<Integer>>\` twice per line; boxing gotchas; you burn minutes on boilerplate |
| **JavaScript / TypeScript** | Natural if you are a web candidate; async model is genuinely useful in some questions | Weak standard library: no built-in heap, no ordered map, no tuple; you may have to hand-roll a priority queue mid-interview |
| **C++** | Fast; \`std::\` containers are excellent (\`priority_queue\`, \`map\`, \`set\`); competitive-programming default | Easiest language to make a subtle memory or iterator-invalidation mistake in under pressure |

### Guidance

- **Default to Python** unless you have a reason not to. In a 45-minute round, code volume is the enemy, and a \`Counter\` plus a \`deque\` gets you through most problems. The tradeoff is real, though: interviewers sometimes probe harder to check you know what \`heapq\` is doing underneath, so be ready to say "this is a binary min-heap, sift-up on push, sift-down on pop, both O(log n)."
- **Use Java** if it is what your coursework used and you can write it fluently, or if you are interviewing somewhere Java-heavy and want the domain match.
- **Use JS/TS** only if you are strong in it. Know in advance that you may need to write your own heap; have a 20-line implementation memorized.
- **Use C++** if competitive programming is your background. Do not pick it up for interviews.

### A note on what interviewers are checking

Language questions are rarely trivia for its own sake. "What does \`==\` do on Java Strings" is really "have you been bitten by this, i.e. have you written enough Java to have debugged something." "What is a closure" is really "do you understand how JavaScript scoping works, or do you copy patterns." Answer with the mechanism and the consequence, not the definition.`,
    },
    {
      id: "python-stdlib",
      heading: "Python: the standard library an interviewer expects fluency in",
      markdown: `Reaching for the right stdlib tool immediately is a strong signal. Re-implementing \`Counter\` by hand is a mild negative one.

### \`collections.Counter\`

\`\`\`python
from collections import Counter

c = Counter("mississippi")
# Counter({'i': 4, 's': 4, 'p': 2, 'm': 1})
c.most_common(2)          # [('i', 4), ('s', 4)]  -- ties broken by insertion order
c["z"]                    # 0, not a KeyError

# Anagram check in one line:
Counter(a) == Counter(b)

# Counters support arithmetic, which is occasionally exactly what you need:
Counter("aab") - Counter("ab")     # Counter({'a': 1})
\`\`\`

### \`collections.defaultdict\`

\`\`\`python
from collections import defaultdict

graph = defaultdict(list)
for u, v in edges:
    graph[u].append(v)        # no "if u not in graph" needed

groups = defaultdict(list)
for word in words:
    groups[tuple(sorted(word))].append(word)   # group anagrams
\`\`\`

The gotcha: **accessing a missing key inserts it.** \`if graph[x]:\` silently creates \`x\` with an empty list, which can corrupt a later \`len(graph)\`. Use \`graph.get(x)\` for pure reads.

### \`collections.deque\`

\`\`\`python
from collections import deque

q = deque([1, 2, 3])
q.append(4); q.appendleft(0)
q.pop(); q.popleft()          # both O(1)
q = deque(maxlen=3)           # fixed-size sliding window; auto-evicts
\`\`\`

This is *the* BFS queue. Using a list with \`pop(0)\` is O(n) per operation because every element shifts, turning an O(V+E) BFS into O(V²). Interviewers notice.

### \`heapq\` — a binary **min**-heap

\`\`\`python
import heapq

h = []
heapq.heappush(h, 5)
heapq.heappop(h)                 # smallest
h[0]                             # peek, no pop
heapq.heapify(nums)              # in-place, O(n) -- not O(n log n)
heapq.heappushpop(h, x)          # push then pop, one sift
heapq.nlargest(3, nums)          # O(n log k)

# Tuples compare lexicographically -- (priority, item):
heapq.heappush(h, (dist, node))
# Add a tiebreaker counter when items aren't comparable, or the heap
# will try to compare them and raise TypeError:
heapq.heappush(h, (priority, next(counter), task))
\`\`\`

**Faking a max-heap.** Python has no max-heap. Two ways:

\`\`\`python
# 1. Negate on the way in, negate on the way out (numbers only):
heapq.heappush(h, -value)
largest = -heapq.heappop(h)

# 2. Use the private _max_heap functions -- works, but don't rely on it:
heapq._heapify_max(nums)

# For "k largest", the idiomatic trick is a min-heap of size k:
def k_largest(nums, k):
    h = []
    for n in nums:
        heapq.heappush(h, n)
        if len(h) > k:
            heapq.heappop(h)      # evict the smallest
    return h                       # O(n log k) time, O(k) space
\`\`\`

That last pattern — a bounded min-heap for top-k — comes up constantly and is worth having automatic.

### \`bisect\` — binary search on a sorted list

\`\`\`python
import bisect

i = bisect.bisect_left(arr, x)    # first index where arr[i] >= x
j = bisect.bisect_right(arr, x)   # first index where arr[j] > x
bisect.insort(arr, x)             # insert keeping sorted order (O(n) due to the shift)

count_of_x = bisect.bisect_right(arr, x) - bisect.bisect_left(arr, x)
\`\`\`

\`bisect_left\` vs \`bisect_right\` is the classic lower_bound/upper_bound distinction. Know which one you want for "first element >= target" (left) versus "insertion point after duplicates" (right).

### \`itertools\`

\`\`\`python
from itertools import (accumulate, combinations, permutations,
                       product, groupby, pairwise, chain)

list(accumulate([1, 2, 3, 4]))          # [1, 3, 6, 10] -- prefix sums
list(combinations([1, 2, 3], 2))        # [(1,2), (1,3), (2,3)]
list(permutations([1, 2, 3]))           # all 6 orderings
list(product([0, 1], repeat=3))         # 3-bit cartesian product
list(pairwise([1, 2, 3, 4]))            # [(1,2), (2,3), (3,4)] -- 3.10+
list(chain([1, 2], [3, 4]))             # [1, 2, 3, 4]

# groupby only groups *consecutive* equal keys -- sort first if you want
# global grouping. This trips people up constantly.
for key, grp in groupby(sorted(data, key=f), key=f):
    ...
\`\`\``,
    },
    {
      id: "python-gotchas",
      heading: "Python: the gotchas that get asked",
      markdown: `### Mutable default arguments

\`\`\`python
def add_item(item, basket=[]):      # BUG
    basket.append(item)
    return basket

add_item("a")     # ['a']
add_item("b")     # ['a', 'b']  <- same list!
\`\`\`

**Why**: default arguments are evaluated **once, when the function is defined**, and stored on the function object (\`add_item.__defaults__\`). Every call without an explicit argument shares that one list. The fix:

\`\`\`python
def add_item(item, basket=None):
    if basket is None:
        basket = []
    basket.append(item)
    return basket
\`\`\`

The same applies to \`{}\`, \`set()\`, and any mutable object — and to non-obvious cases like \`def f(t=datetime.now())\`, where the timestamp is frozen at import time.

### List vs generator

\`\`\`python
squares = [x * x for x in range(10**7)]     # builds all 10M in memory now
squares = (x * x for x in range(10**7))     # generator: lazy, O(1) memory
\`\`\`

A generator produces values on demand and can only be consumed once. Use one when you are streaming, short-circuiting, or the sequence is huge or infinite:

\`\`\`python
if any(is_valid(x) for x in huge_list):     # stops at the first True
    ...
total = sum(x.price for x in orders)        # never materializes a list
\`\`\`

Use a list when you need to index it, take its \`len()\`, or iterate more than once. The classic bug is iterating a generator twice and getting nothing the second time.

### Shallow vs deep copy

\`\`\`python
import copy

grid = [[0] * 3 for _ in range(3)]

a = grid                    # alias: same object
b = grid[:]                 # shallow: new outer list, SAME inner lists
c = copy.deepcopy(grid)     # fully independent

b[0][0] = 9
grid[0][0]                  # 9  -- shallow copy shared the row
\`\`\`

The related trap, which comes up in real interview code:

\`\`\`python
grid = [[0] * 3] * 3        # BUG: three references to ONE row
grid[0][0] = 1              # -> [[1,0,0], [1,0,0], [1,0,0]]

grid = [[0] * 3 for _ in range(3)]   # correct: three distinct rows
\`\`\`

\`[0] * 3\` is fine because ints are immutable; \`[row] * 3\` is not, because it copies the *reference* three times.

### String immutability, and why \`join\` beats \`+=\`

Strings are immutable, so \`s += x\` cannot modify \`s\` — it allocates a brand-new string and copies both operands. Doing that in a loop is O(n²):

\`\`\`python
# O(n^2): allocates and copies on every iteration
out = ""
for chunk in chunks:
    out += chunk

# O(n): one pass to size the buffer, one to fill it
out = "".join(chunks)
\`\`\`

(CPython has an in-place optimization for the special case where a string has exactly one reference, so this sometimes looks linear in a microbenchmark. Do not rely on it — it is an implementation detail, and it disappears the moment anything else holds a reference.)

The same reasoning is why you build a list of characters and join at the end when constructing a string incrementally.

### Comprehensions

\`\`\`python
[x * 2 for x in nums if x > 0]                  # list
{w: len(w) for w in words}                      # dict
{x % 3 for x in nums}                           # set
[[0] * cols for _ in range(rows)]               # 2D grid, correctly
[y for row in matrix for y in row]              # flatten: loops read left-to-right
[x if x > 0 else 0 for x in nums]               # ternary goes BEFORE the for
\`\`\`

The two syntax points people get backwards: in a nested comprehension the \`for\` clauses read in the same order you would write nested loops; and a filter (\`if\`) goes after the \`for\`, while a conditional *expression* goes before it.

### Sorting with keys

\`\`\`python
words.sort(key=len)                             # in place, returns None
ranked = sorted(words, key=len, reverse=True)   # returns a new list

# Multi-key: tuple. Ascending on both:
people.sort(key=lambda p: (p.last, p.first))

# Mixed directions with a numeric field -- negate it:
items.sort(key=lambda i: (-i.score, i.name))    # score desc, then name asc

# Sorting is stable, so you can also sort twice, least-significant first:
items.sort(key=lambda i: i.name)
items.sort(key=lambda i: i.score, reverse=True)
\`\`\`

Two things worth saying out loud in an interview: \`sort()\` mutates and returns \`None\` (so \`x = lst.sort()\` is a classic bug), and Python's sort is **stable**, which is what makes the sort-twice technique correct.`,
    },
    {
      id: "java-collections",
      heading: "Java: the collections framework",
      markdown: `\`\`\`text
Collection
├── List      ordered, duplicates allowed
│   ├── ArrayList     dynamic array. O(1) get, amortized O(1) add, O(n) insert/remove mid
│   └── LinkedList    doubly-linked. O(1) add/remove at ends, O(n) get. Also a Deque
├── Set       no duplicates
│   ├── HashSet       O(1) avg, unordered
│   ├── LinkedHashSet O(1) avg, preserves insertion order
│   └── TreeSet       O(log n), sorted; NavigableSet: floor/ceiling/higher/lower
└── Queue / Deque
    ├── ArrayDeque    the right choice for stack AND queue
    └── PriorityQueue binary min-heap by default

Map (not a Collection)
├── HashMap        O(1) avg, unordered, one null key allowed
├── LinkedHashMap  insertion (or access) order -- access-order mode gives you an LRU
└── TreeMap        O(log n), sorted by key; floorKey/ceilingKey/headMap/tailMap
\`\`\`

### Defaults to reach for

\`\`\`java
List<String> names = new ArrayList<>();
Map<String, Integer> counts = new HashMap<>();
Set<Integer> seen = new HashSet<>();
Deque<Integer> stack = new ArrayDeque<>();   // NOT java.util.Stack
Deque<Integer> queue = new ArrayDeque<>();   // NOT LinkedList
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
\`\`\`

Two things to be able to justify:

- **\`ArrayDeque\` over \`Stack\`**: \`Stack\` extends \`Vector\`, so every operation is synchronized (pure overhead when you are single-threaded) and it exposes index-based access that breaks the stack abstraction. \`ArrayDeque\` is faster and is the documented recommendation.
- **\`ArrayList\` over \`LinkedList\`** essentially always. \`LinkedList\`'s theoretical O(1) insertion requires that you already hold the node; getting there is O(n), and the pointer-chasing destroys cache locality. Real benchmarks favor \`ArrayList\` even for mid-list insertion at typical sizes.

### The idioms that save time

\`\`\`java
counts.merge(word, 1, Integer::sum);                    // frequency count
graph.computeIfAbsent(u, k -> new ArrayList<>()).add(v); // adjacency list
int c = counts.getOrDefault(key, 0);

for (Map.Entry<String, Integer> e : counts.entrySet()) {
    e.getKey(); e.getValue();
}

int[] arr = list.stream().mapToInt(Integer::intValue).toArray();
Arrays.sort(intervals, Comparator.comparingInt(a -> a[0]));
Arrays.sort(people, Comparator.comparing(Person::getLast)
                              .thenComparing(Person::getFirst));
\`\`\`

**A real trap**: \`Arrays.sort\` on a primitive \`int[]\` uses dual-pivot quicksort and is **not stable**; on an object array it uses TimSort and **is** stable. Also, \`(a, b) -> a - b\` as a comparator overflows for large values — use \`Integer.compare(a, b)\`.

### Boxing

\`\`\`java
Integer a = 127, b = 127;
a == b;                  // true  -- Integer cache covers -128..127

Integer c = 128, d = 128;
c == d;                  // false -- different objects
c.equals(d);             // true
\`\`\`

\`Map<String, Integer>\` boxes every value. In a hot loop that is real allocation cost, and \`==\` on the boxed values is a lurking bug. Compare with \`.equals()\` or unbox explicitly.`,
    },
    {
      id: "java-core",
      heading: "Java: HashMap internals, equals/hashCode, and the rest",
      markdown: `### How \`HashMap\` works

An array of buckets. \`put\` computes \`key.hashCode()\`, applies a spreading function (\`h ^ (h >>> 16)\`, so that high bits influence the low-bit index), and indexes into the array with \`(n - 1) & hash\`, which is a cheap modulo because capacity is always a power of two.

Collisions chain in a linked list within the bucket. Since Java 8, once a bucket exceeds **8** entries (and the table is at least 64 buckets), that bucket converts to a **red-black tree**, so worst-case lookup degrades to O(log n) instead of O(n). That change was a defense against hash-collision denial-of-service attacks.

When \`size > capacity * loadFactor\` (default 0.75), the table **resizes**: capacity doubles and every entry is rehashed. That is why passing an expected size to the constructor matters for large maps — you avoid repeated O(n) rehashes.

Average \`get\`/\`put\` is O(1); worst case is O(log n) post-Java-8.

### The equals/hashCode contract

\`\`\`java
public final class Point {
    private final int x, y;

    public Point(int x, int y) { this.x = x; this.y = y; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Point)) return false;
        Point p = (Point) o;
        return x == p.x && y == p.y;
    }

    @Override
    public int hashCode() {
        return Objects.hash(x, y);
    }
}
\`\`\`

The contract:

1. If \`a.equals(b)\`, then \`a.hashCode() == b.hashCode()\`. **Mandatory.**
2. Equal hash codes do *not* imply equality — collisions are legal.
3. Both must be consistent as long as the object is not mutated.

**Why it matters concretely**: \`HashMap\` finds the bucket by hash *first*, then calls \`equals\` only within that bucket. Override \`equals\` without \`hashCode\` and two equal objects land in different buckets, so \`map.get(equalKey)\` returns \`null\` and your set contains visible duplicates. This is the single most common Java bug in interview answers.

The corollary: **never mutate a field used in \`hashCode\` while the object is a key in a map.** Its hash changes, but it is still sitting in the old bucket, so it becomes permanently unreachable. Make map keys immutable.

Java \`record\`s generate a correct \`equals\`, \`hashCode\`, and \`toString\` from the components, which is the modern answer for value types.

### \`==\` vs \`.equals()\`

\`==\` compares primitives by value and references by identity. \`.equals()\` compares by whatever the class defines (identity, by default from \`Object\`).

\`\`\`java
String a = "hello";
String b = "hello";
a == b;                          // true -- both interned in the string pool

String c = new String("hello");
a == c;                          // false -- c is a distinct object
a.equals(c);                     // true

String d = "hel" + "lo";         // compile-time constant folding
a == d;                          // true
\`\`\`

The rule: **always \`.equals()\` for objects.** Use \`Objects.equals(a, b)\` when either side may be null.

### \`String\` vs \`StringBuilder\`

\`String\` is immutable, so \`s += x\` in a loop is O(n²) — each iteration allocates a new char array and copies everything. \`StringBuilder\` wraps a mutable, growable buffer:

\`\`\`java
StringBuilder sb = new StringBuilder();
for (String part : parts) sb.append(part);
String result = sb.toString();          // one allocation at the end
\`\`\`

Immutability is not an oversight — it makes \`String\` safe to share across threads, cacheable, safe as a map key, and internable. \`StringBuffer\` is the synchronized version and is essentially obsolete; use \`StringBuilder\`.

### Generics and type erasure

Generics are compile-time only. The compiler checks types, inserts casts, and then **erases** the type parameters — at runtime \`List<String>\` and \`List<Integer>\` are both just \`List\`.

Consequences you should be able to name:

\`\`\`java
list instanceof List<String>     // won't compile -- no runtime type info
new T[10]                        // can't do it -- T is erased
new ArrayList<int>()             // can't -- generics need reference types; use Integer

// Erasure is why an unchecked cast is required here:
@SuppressWarnings("unchecked")
T[] arr = (T[]) new Object[10];
\`\`\`

Erasure exists for backward compatibility: pre-generics code and generic code interoperate because they compile to the same bytecode.

Wildcards, via PECS — **Producer Extends, Consumer Super**:

\`\`\`java
void copy(List<? extends Number> src,   // producer: we read Numbers out
          List<? super Integer> dst) {  // consumer: we write Integers in
    for (Number n : src) dst.add((Integer) n);
}
\`\`\`

### Checked vs unchecked exceptions

**Checked** (extend \`Exception\`): the compiler forces you to catch or declare them. \`IOException\`, \`SQLException\`. The intent is recoverable, expected conditions — the file might not exist.

**Unchecked** (extend \`RuntimeException\`): no compiler requirement. \`NullPointerException\`, \`IllegalArgumentException\`, \`IndexOutOfBoundsException\`. These signal programming errors.

**Errors** (extend \`Error\`): \`OutOfMemoryError\`, \`StackOverflowError\`. Do not catch these.

The honest position: checked exceptions were a well-intentioned experiment that mostly produces \`catch (Exception e) {}\` swallowing and \`throws Exception\` propagating up every signature. Kotlin, C#, and Scala all declined to adopt them. Say that you use them for genuinely recoverable conditions at API boundaries and unchecked for programming errors — and that the cardinal sin is an empty catch block.

### Interface vs abstract class

| | Interface | Abstract class |
| --- | --- | --- |
| Multiple inheritance | Yes, a class can implement many | No, single \`extends\` |
| State | Only \`public static final\` constants | Instance fields allowed |
| Constructors | None | Yes |
| Method bodies | \`default\` and \`static\` methods (Java 8+) | Any |
| Access modifiers | Methods implicitly public | Any |

Choose an **interface** for a capability that unrelated types can have (\`Comparable\`, \`Serializable\`, \`Runnable\`) — and by default, because it keeps types loosely coupled. Choose an **abstract class** when subclasses genuinely share state and implementation, i.e. a real is-a hierarchy with common fields.

### Access modifiers and \`static\`

| Modifier | Class | Package | Subclass | World |
| --- | --- | --- | --- | --- |
| \`private\` | Y | – | – | – |
| (default/package) | Y | Y | – | – |
| \`protected\` | Y | Y | Y | – |
| \`public\` | Y | Y | Y | Y |

Default to \`private\` and widen only when a caller genuinely needs it. Every public member is a promise you have to keep.

\`static\` belongs to the class, not an instance: one copy shared by all instances, callable without an object, and unable to reference \`this\` or any instance field. Static methods are for stateless helpers (\`Math.max\`) and factories (\`List.of\`). Static *mutable* state is shared global state — a testing and thread-safety problem.`,
    },
    {
      id: "js-core",
      heading: "JavaScript: closures, `this`, and prototypes",
      markdown: `### Closures

A closure is a function bundled with the lexical environment it was defined in. The function keeps that environment alive after the outer function returns.

\`\`\`js
function makeCounter() {
  let count = 0;                 // not garbage collected: the returned fn references it
  return {
    increment: () => ++count,
    value: () => count,
  };
}

const c = makeCounter();
c.increment();                   // 1
c.increment();                   // 2
c.value();                       // 2
// \`count\` is genuinely private -- no outside access exists.
\`\`\`

Closures are the mechanism behind private state, function factories, memoization, and every callback that "remembers" something.

The interview classic:

\`\`\`js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);   // 3, 3, 3
}

for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);   // 0, 1, 2
}
\`\`\`

**Why**: \`var\` is function-scoped, so all three callbacks close over the *same* binding, which is 3 by the time the timers run. \`let\` is block-scoped and the spec creates a **fresh binding per loop iteration**, so each callback captures its own. Before \`let\`, the fix was an IIFE to create a new scope per iteration.

Memoization, which is closures doing real work:

\`\`\`js
function memoize(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) cache.set(key, fn(...args));
    return cache.get(key);
  };
}
\`\`\`

### \`this\`

In a normal function, \`this\` is determined by **how the function is called**, not where it is defined. The resolution order:

1. \`new Foo()\` → \`this\` is the newly constructed object.
2. \`fn.call(obj)\` / \`.apply(obj)\` / \`.bind(obj)\` → \`this\` is \`obj\`.
3. \`obj.method()\` → \`this\` is \`obj\` (the receiver).
4. Plain \`fn()\` → \`undefined\` in strict mode/modules, \`globalThis\` otherwise.

**Arrow functions have no \`this\` of their own.** They inherit it lexically from the enclosing scope at definition time, and \`.call\`/\`.bind\` cannot change it.

\`\`\`js
const user = {
  name: "Ada",
  greetBroken() {
    setTimeout(function () {
      console.log(this.name);      // undefined -- plain call
    }, 0);
  },
  greetFixed() {
    setTimeout(() => {
      console.log(this.name);      // "Ada" -- arrow inherits from greetFixed
    }, 0);
  },
};

const detached = user.greetFixed;
detached();                        // this is undefined: the receiver was lost
const bound = user.greetFixed.bind(user);   // fix
\`\`\`

"Losing \`this\` when a method is passed as a callback" is the single most common \`this\` bug, and the reason React class components needed \`bind\` in the constructor.

### Prototypes

JavaScript has **prototypal** inheritance: every object has a hidden link (\`[[Prototype]]\`, exposed as \`__proto__\`) to another object. Property lookup walks that chain until it finds the key or hits \`null\`.

\`\`\`js
const animal = {
  speak() { return \`\${this.name} makes a sound\`; },
};

const dog = Object.create(animal);
dog.name = "Rex";
dog.speak();                       // found on the prototype
Object.getPrototypeOf(dog) === animal;   // true
\`\`\`

\`class\` is syntax sugar over exactly this. Methods declared in a class body live on \`Constructor.prototype\`, shared by all instances rather than copied per instance:

\`\`\`js
class Animal {
  constructor(name) { this.name = name; }
  speak() { return \`\${this.name} makes a sound\`; }
}
class Dog extends Animal {
  speak() { return \`\${super.speak()} -- a bark\`; }
}

Object.getPrototypeOf(Dog.prototype) === Animal.prototype;  // true
\`\`\`

Say "sugar over prototypes, not a separate class system" — it demonstrates you know what is underneath.`,
    },
    {
      id: "js-async",
      heading: "JavaScript: the event loop, promises, async/await",
      markdown: `### The event loop

JavaScript runs on **one thread**. Concurrency comes from the runtime: long-running work (timers, network, file I/O) is handed to the host, which pushes a callback onto a queue when it finishes. The event loop takes callbacks from the queue and runs them — but only when the call stack is empty.

The critical detail is that there are **two queues with different priorities**:

- **Microtasks**: promise callbacks, \`queueMicrotask\`, \`MutationObserver\`.
- **Macrotasks**: \`setTimeout\`, \`setInterval\`, I/O, UI events.

After each macrotask, the loop **drains the entire microtask queue** before taking the next macrotask.

\`\`\`js
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");

// 1, 4, 3, 2
\`\`\`

\`1\` and \`4\` are synchronous. Then the stack empties, microtasks drain (\`3\`), and only then does the timer macrotask run (\`2\`). Being able to explain *why* — not just recite the order — is the point of this question.

Corollary: an infinite chain of microtasks starves the macrotask queue and freezes the page. And a long synchronous loop blocks everything, because there is one thread.

### Promises

A promise is an object representing a future value, in one of three states: pending → fulfilled or rejected. Once settled, it never changes.

\`\`\`js
const p = fetch(url).then((r) => r.json());

Promise.all([a, b, c]);          // all fulfilled, or reject on the FIRST rejection
Promise.allSettled([a, b, c]);   // never rejects; array of {status, value|reason}
Promise.race([a, b]);            // first to SETTLE, fulfilled or rejected
Promise.any([a, b]);             // first to FULFILL; rejects only if all reject
\`\`\`

\`Promise.all\` vs \`allSettled\` is a common question: use \`all\` when you need every result and a single failure invalidates the batch; use \`allSettled\` when you want partial success (a dashboard where one widget failing should not blank the page). Note that \`all\` rejecting does not cancel the other promises — they keep running, their results are just discarded.

### async/await

\`async\` functions always return a promise. \`await\` suspends the function and schedules the remainder as a microtask.

\`\`\`js
// Sequential -- 3 seconds if each takes 1s. Usually a bug.
const a = await fetchA();
const b = await fetchB();
const c = await fetchC();

// Concurrent -- 1 second. Start them all, then await.
const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()]);
\`\`\`

Spotting the accidental waterfall is a genuine signal — it is a real performance bug that appears in production code constantly.

Error handling:

\`\`\`js
try {
  const data = await risky();
} catch (err) {
  // catches both thrown errors and promise rejections
} finally {
  // always runs
}
\`\`\`

The trap: \`forEach\` does not await.

\`\`\`js
items.forEach(async (i) => { await save(i); });   // returns immediately, unhandled
for (const i of items) { await save(i); }         // sequential, awaited
await Promise.all(items.map((i) => save(i)));     // concurrent, awaited
\`\`\`

An unawaited async call inside \`forEach\` produces a floating promise: rejections become unhandled rejection warnings and the surrounding function proceeds before the work is done.`,
    },
    {
      id: "js-semantics",
      heading: "JavaScript: scoping, coercion, and the syntax you use constantly",
      markdown: `### \`var\`, \`let\`, \`const\`, and hoisting

| | Scope | Hoisted | Re-assignable | Re-declarable |
| --- | --- | --- | --- | --- |
| \`var\` | function | yes, initialized to \`undefined\` | yes | yes |
| \`let\` | block | yes, but in the TDZ | yes | no |
| \`const\` | block | yes, but in the TDZ | no | no |

\`\`\`js
console.log(a);   // undefined  -- declaration hoisted, assignment not
var a = 1;

console.log(b);   // ReferenceError: Cannot access 'b' before initialization
let b = 1;
\`\`\`

All three are hoisted; the difference is that \`let\`/\`const\` sit in the **temporal dead zone** from the top of the block until the declaration executes, so accessing them throws instead of silently giving \`undefined\`. That is a feature — it turns a silent bug into a loud one.

\`const\` prevents **re-binding**, not mutation:

\`\`\`js
const arr = [1, 2];
arr.push(3);       // fine -- the binding still points at the same array
arr = [];          // TypeError -- reassignment
\`\`\`

Use \`const\` by default, \`let\` when you must reassign, \`var\` never.

Function declarations are fully hoisted (callable before their definition); function *expressions* assigned to \`const\` are not.

### \`==\` vs \`===\`

\`===\` compares type and value with no coercion. \`==\` applies the abstract equality algorithm, which coerces:

\`\`\`js
0 == "";          // true
0 == "0";         // true
"" == "0";        // false   <- not transitive!
null == undefined;// true
null == 0;        // false   <- null only == undefined
NaN == NaN;       // false   -- use Number.isNaN or Object.is
[] == false;      // true
\`\`\`

Use \`===\` always, with one accepted exception: \`x == null\` as a concise check for "null or undefined."

Also worth knowing: \`typeof null === "object"\` (a bug preserved since 1995 for compatibility), and \`Object.is\` differs from \`===\` on exactly \`NaN\` and \`-0\`.

### Spread and destructuring

\`\`\`js
const merged = { ...defaults, ...overrides };     // later wins
const copy = [...arr];                            // shallow copy
const combined = [...a, ...b];

const { name, age = 0, ...rest } = user;
const { address: { city } = {} } = user;          // nested with a default
const [first, second, ...others] = arr;
[a, b] = [b, a];                                  // swap

function f({ id, verbose = false } = {}) {}       // named args with defaults
\`\`\`

Spread is **shallow**: nested objects are still shared by reference. For a deep clone use \`structuredClone(obj)\`.

### Array methods

\`\`\`js
arr.map(f)                    // transform, same length
arr.filter(p)                 // subset
arr.reduce((acc, x) => ..., init)
arr.find(p) / arr.findIndex(p)
arr.some(p) / arr.every(p)    // short-circuit
arr.flat(depth) / arr.flatMap(f)
arr.at(-1)                    // last element
arr.includes(x)               // handles NaN correctly, unlike indexOf
Array.from({ length: n }, (_, i) => i)   // range
\`\`\`

**Mutating vs non-mutating** matters:

| Mutates | Returns a new array |
| --- | --- |
| \`push\` \`pop\` \`shift\` \`unshift\` | \`map\` \`filter\` \`slice\` \`concat\` |
| \`splice\` \`sort\` \`reverse\` \`fill\` | \`toSorted\` \`toReversed\` \`toSpliced\` \`with\` |

\`sort\` mutating in place surprises people, and its default comparator converts to strings — \`[10, 9, 1].sort()\` gives \`[1, 10, 9]\`. For numbers you must pass \`(a, b) => a - b\`.`,
    },
    {
      id: "typescript",
      heading: "TypeScript: the type system essentials",
      markdown: `### Structural typing

TypeScript checks **shape**, not declared name. If it has the right members, it fits — no \`implements\` needed.

\`\`\`ts
interface Point { x: number; y: number; }

function dist(p: Point) { return Math.hypot(p.x, p.y); }

dist({ x: 3, y: 4 });                       // fine
const p3 = { x: 3, y: 4, z: 5 };
dist(p3);                                   // fine -- extra properties OK via a variable
dist({ x: 3, y: 4, z: 5 });                 // ERROR -- excess property check on a literal
\`\`\`

That last line is a deliberate exception: object literals get an excess-property check, because a stray property in a literal is almost always a typo.

### Unions and narrowing

\`\`\`ts
type Result =
  | { status: "ok"; data: string }
  | { status: "error"; message: string };

function handle(r: Result) {
  if (r.status === "ok") {
    r.data;         // narrowed to the ok variant
  } else {
    r.message;      // narrowed to the error variant
  }
}
\`\`\`

**Discriminated unions** — a union of object types sharing a literal-typed field — are the single most valuable TypeScript pattern. They make illegal states unrepresentable: you cannot construct a value with \`status: "ok"\` and a \`message\`.

Narrowing mechanisms: \`typeof\`, \`instanceof\`, \`in\`, literal comparison, truthiness, and custom type predicates:

\`\`\`ts
function isString(v: unknown): v is string {
  return typeof v === "string";
}
\`\`\`

Exhaustiveness checking, which is how you get a compile error when someone adds a variant:

\`\`\`ts
function label(r: Result): string {
  switch (r.status) {
    case "ok": return "Success";
    case "error": return r.message;
    default: {
      const _exhaustive: never = r;   // errors if a new variant is added
      return _exhaustive;
    }
  }
}
\`\`\`

### Generics

\`\`\`ts
function first<T>(items: T[]): T | undefined {
  return items[0];
}

// Constrain when you need to use a member:
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}

// keyof + indexed access for type-safe property lookup:
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
pluck({ name: "Ada", age: 36 }, "name");   // inferred as string
pluck({ name: "Ada", age: 36 }, "email");  // compile error
\`\`\`

### Utility types

\`\`\`ts
interface User { id: string; name: string; email: string; age: number; }

Partial<User>                  // every property optional
Required<User>                 // every property required
Readonly<User>                 // every property readonly
Pick<User, "id" | "name">      // subset
Omit<User, "email">            // everything except
Record<string, User>           // an index-signature map type
ReturnType<typeof fn>          // the return type of a function type
Awaited<ReturnType<typeof fn>> // unwrap a Promise
NonNullable<string | null>     // string
Parameters<typeof fn>          // tuple of parameter types
\`\`\`

They compose, which is where the value is: \`Partial<Omit<User, "id">>\` is the natural type for an update payload that cannot change the id.

### \`unknown\` vs \`any\` vs \`never\`

- \`any\` **disables** type checking. It is contagious — anything derived from an \`any\` is unchecked too — and one \`any\` at an API boundary can silently void the guarantees of a whole module.
- \`unknown\` is the type-safe top type: anything is assignable *to* it, but you can do nothing *with* it until you narrow.
- \`never\` is the bottom type: no value has it. It is what a function that always throws returns, and what a fully-narrowed union collapses to.

\`\`\`ts
function parse(json: string): unknown {
  return JSON.parse(json);            // the honest return type
}

const data = parse(input);
data.name;                            // ERROR -- must narrow first
if (typeof data === "object" && data !== null && "name" in data) {
  data.name;                          // OK
}
\`\`\`

The rule: **use \`unknown\` at every boundary where data comes from outside the program** — JSON, network responses, \`localStorage\`, user input — then validate it into a real type (with Zod or a hand-written type guard). \`JSON.parse\` returning \`any\` is the most common way a "fully typed" codebase lies to itself.

Also enable \`strict: true\`. Without \`strictNullChecks\`, \`null\` is assignable to every type, and TypeScript stops preventing the error class it is best at preventing.`,
    },
    {
      id: "cpp",
      heading: "C++: pointers, RAII, smart pointers, and the STL",
      markdown: `### Pointers vs references

\`\`\`cpp
int x = 10;
int* p = &x;        // pointer: can be null, can be reassigned, needs *p to read
int& r = x;         // reference: must be bound at creation, never rebinds, no deref syntax

*p = 20;            // x == 20
r = 30;             // x == 30  (assigns THROUGH the reference; does not rebind)
p = nullptr;        // legal
// int& r2;         // illegal -- a reference must be initialized
\`\`\`

Use a reference when the thing must exist. Use a pointer when absence is meaningful (or you need to reassign or do arithmetic). A reference is not "a safe pointer" — it can still dangle if the referent dies first.

### Pass by value, reference, and const reference

\`\`\`cpp
void byValue(std::vector<int> v);          // copies the whole vector -- usually wrong
void byRef(std::vector<int>& v);           // no copy, callee CAN modify
void byConstRef(const std::vector<int>& v);// no copy, callee CANNOT modify -- the default
void byMove(std::vector<int>&& v);         // takes ownership of a temporary
\`\`\`

Default to \`const&\` for anything larger than a pointer or two; pass small trivially-copyable types (\`int\`, \`double\`, a pointer) by value.

### RAII

Resource Acquisition Is Initialization: bind every resource's lifetime to an object's lifetime. The constructor acquires; the destructor releases. Because destructors run deterministically when an object leaves scope — including during stack unwinding from an exception — cleanup cannot be forgotten.

\`\`\`cpp
{
  std::lock_guard<std::mutex> lock(mtx);   // locks here
  doWork();                                // even if this throws...
}                                          // ...the destructor unlocks. Always.
\`\`\`

This is the single most important idea in modern C++, and it is why C++ does not need \`try/finally\`. \`std::vector\`, \`std::string\`, \`std::fstream\`, \`std::unique_ptr\`, and \`lock_guard\` are all RAII types.

### Smart pointers

\`\`\`cpp
#include <memory>

// Unique ownership: exactly one owner, zero runtime overhead. THE default.
auto a = std::make_unique<Widget>(args);
auto b = std::move(a);            // ownership transfers; a is now null. No copy exists.

// Shared ownership: reference-counted. Frees when the last owner dies.
auto s = std::make_shared<Widget>(args);
auto s2 = s;                      // refcount 2 (the count is atomic -> not free)

// Non-owning observer that breaks reference cycles.
std::weak_ptr<Widget> w = s;
if (auto locked = w.lock()) { locked->use(); }   // null if already destroyed
\`\`\`

Points to make:

- **Prefer \`unique_ptr\`.** Shared ownership should be a deliberate design decision, not a default. \`shared_ptr\` costs an atomic increment on every copy and makes lifetimes hard to reason about.
- Use \`make_unique\`/\`make_shared\` rather than raw \`new\`: exception-safe, and \`make_shared\` puts the control block and the object in one allocation.
- Two \`shared_ptr\`s pointing at each other never reach refcount zero — that is a leak. \`weak_ptr\` breaks the cycle (classic case: parent owns children with \`shared_ptr\`, children point back with \`weak_ptr\`).
- Raw pointers are still fine for **non-owning** parameters. \`void f(Widget* w)\` says "I observe this, I do not own it."

### STL containers

| Container | Backing | Access | Insert/erase | Notes |
| --- | --- | --- | --- | --- |
| \`vector\` | dynamic array | O(1) index | amortized O(1) back | Contiguous, cache-friendly. The default |
| \`deque\` | chunked array | O(1) index | O(1) both ends | Not contiguous |
| \`list\` | doubly linked | O(n) | O(1) with iterator | Rarely worth it |
| \`map\` / \`set\` | red-black tree | O(log n) | O(log n) | **Sorted** iteration |
| \`unordered_map\` / \`_set\` | hash table | O(1) avg | O(1) avg | No ordering |
| \`priority_queue\` | heap over a vector | O(1) top | O(log n) | **Max**-heap by default |

\`\`\`cpp
std::vector<int> v{3, 1, 2};
std::sort(v.begin(), v.end());
std::sort(v.begin(), v.end(), std::greater<int>());          // descending
std::sort(v.begin(), v.end(), [](int a, int b) { return a > b; });

std::unordered_map<std::string, int> counts;
counts["apple"]++;                       // default-constructs to 0, then increments

// Min-heap: the default is a MAX-heap, so invert the comparator.
std::priority_queue<int, std::vector<int>, std::greater<int>> minHeap;

auto it = std::lower_bound(v.begin(), v.end(), target);      // first >= target
\`\`\`

**Iterator invalidation** is the classic C++ interview trap: \`vector::push_back\` may reallocate, invalidating every iterator, pointer, and reference into it. Erasing while iterating requires the returned iterator:

\`\`\`cpp
for (auto it = v.begin(); it != v.end(); ) {
  if (shouldRemove(*it)) it = v.erase(it);   // erase returns the next valid iterator
  else ++it;
}
\`\`\`

### The rule of three / five / zero

If a class manages a resource and you write **one** of these, you almost certainly need all of them:

**Rule of three** (C++98): destructor, copy constructor, copy assignment.
**Rule of five** (C++11): plus move constructor and move assignment.

\`\`\`cpp
class Buffer {
  char* data_;
  size_t size_;
public:
  explicit Buffer(size_t n) : data_(new char[n]), size_(n) {}
  ~Buffer() { delete[] data_; }                                  // 1

  Buffer(const Buffer& o) : data_(new char[o.size_]), size_(o.size_) {   // 2 deep copy
    std::copy(o.data_, o.data_ + o.size_, data_);
  }
  Buffer& operator=(const Buffer& o) {                            // 3
    if (this != &o) { Buffer tmp(o); swap(tmp); }                 // copy-and-swap
    return *this;
  }
  Buffer(Buffer&& o) noexcept : data_(o.data_), size_(o.size_) {  // 4 steal
    o.data_ = nullptr; o.size_ = 0;                               // leave it destructible
  }
  Buffer& operator=(Buffer&& o) noexcept {                        // 5
    if (this != &o) { delete[] data_; data_ = o.data_; size_ = o.size_;
                      o.data_ = nullptr; o.size_ = 0; }
    return *this;
  }
  void swap(Buffer& o) noexcept { std::swap(data_, o.data_); std::swap(size_, o.size_); }
};
\`\`\`

**Why**: the compiler's default copy is a member-wise (shallow) copy, so two \`Buffer\`s would hold the same \`data_\` pointer and both would \`delete[]\` it — a double free.

**Rule of zero** is the modern answer and the better one: do not manage raw resources yourself. Hold a \`std::vector<char>\` or a \`unique_ptr\` and write none of the five — the compiler-generated versions are then correct. Say this after explaining the rule of five; it shows you know the current idiom, not just the historical one.`,
    },
    {
      id: "cheat-sheet",
      heading: "Cross-language cheat sheet",
      markdown: `Common interview operations, side by side.

### Hash map

| | |
| --- | --- |
| Python | \`d = {}\` / \`d = defaultdict(int)\` |
| Java | \`Map<String,Integer> m = new HashMap<>();\` |
| JS/TS | \`const m = new Map();\` (or \`{}\` for string keys) |
| C++ | \`std::unordered_map<std::string,int> m;\` |

### Increment a counter

| | |
| --- | --- |
| Python | \`counts[k] += 1\` (with \`defaultdict(int)\` or \`Counter\`) |
| Java | \`m.merge(k, 1, Integer::sum);\` |
| JS/TS | \`m.set(k, (m.get(k) ?? 0) + 1);\` |
| C++ | \`m[k]++;\` |

### Dynamic array / list

| | |
| --- | --- |
| Python | \`a = []\` ; \`a.append(x)\` ; \`a.pop()\` |
| Java | \`List<Integer> a = new ArrayList<>();\` ; \`a.add(x)\` ; \`a.remove(a.size()-1)\` |
| JS/TS | \`const a = [];\` ; \`a.push(x)\` ; \`a.pop()\` |
| C++ | \`std::vector<int> a;\` ; \`a.push_back(x)\` ; \`a.pop_back()\` |

### Sort with a custom comparator

| | |
| --- | --- |
| Python | \`items.sort(key=lambda i: (-i.score, i.name))\` |
| Java | \`items.sort(Comparator.comparingInt(I::getScore).reversed().thenComparing(I::getName));\` |
| JS/TS | \`items.sort((a, b) => b.score - a.score \\|\\| a.name.localeCompare(b.name));\` |
| C++ | \`std::sort(v.begin(), v.end(), [](auto& a, auto& b){ return a.score > b.score; });\` |

### Queue (FIFO)

| | |
| --- | --- |
| Python | \`q = deque()\` ; \`q.append(x)\` ; \`q.popleft()\` |
| Java | \`Deque<Integer> q = new ArrayDeque<>();\` ; \`q.offer(x)\` ; \`q.poll()\` |
| JS/TS | \`const q = [];\` \`q.push(x)\` ; \`q.shift()\` **(O(n)!)** — use two indices or a linked list |
| C++ | \`std::queue<int> q;\` ; \`q.push(x)\` ; \`q.front(); q.pop();\` |

### Stack (LIFO)

| | |
| --- | --- |
| Python | \`s = []\` ; \`s.append(x)\` ; \`s.pop()\` |
| Java | \`Deque<Integer> s = new ArrayDeque<>();\` ; \`s.push(x)\` ; \`s.pop()\` |
| JS/TS | \`const s = [];\` ; \`s.push(x)\` ; \`s.pop()\` |
| C++ | \`std::stack<int> s;\` ; \`s.push(x)\` ; \`s.top(); s.pop();\` |

### Min-heap / priority queue

| | |
| --- | --- |
| Python | \`heapq.heappush(h, x)\` ; \`heapq.heappop(h)\` — **min**-heap; negate for max |
| Java | \`PriorityQueue<Integer> pq = new PriorityQueue<>();\` — **min**; \`Comparator.reverseOrder()\` for max |
| JS/TS | **No built-in — write one** |
| C++ | \`priority_queue<int, vector<int>, greater<int>>\` — default is **max** |

### Set

| | |
| --- | --- |
| Python | \`s = set()\` ; \`s.add(x)\` ; \`x in s\` |
| Java | \`Set<Integer> s = new HashSet<>();\` ; \`s.add(x)\` ; \`s.contains(x)\` |
| JS/TS | \`const s = new Set();\` ; \`s.add(x)\` ; \`s.has(x)\` |
| C++ | \`std::unordered_set<int> s;\` ; \`s.insert(x)\` ; \`s.count(x)\` |

### Sorted map (ordered keys)

| | |
| --- | --- |
| Python | none built in — use \`sortedcontainers\` or keep a sorted list + \`bisect\` |
| Java | \`TreeMap\` — \`floorKey\`, \`ceilingKey\`, \`headMap\`, \`tailMap\` |
| JS/TS | none built in |
| C++ | \`std::map\` — \`lower_bound\`, \`upper_bound\` |

### String building

| | |
| --- | --- |
| Python | \`"".join(parts)\` |
| Java | \`StringBuilder sb; sb.append(x); sb.toString();\` |
| JS/TS | \`parts.join("")\` |
| C++ | \`std::string s; s += x;\` (already amortized O(1)) |

### Iterate with index

| | |
| --- | --- |
| Python | \`for i, x in enumerate(a):\` |
| Java | \`for (int i = 0; i < a.size(); i++)\` |
| JS/TS | \`a.forEach((x, i) => ...)\` or \`for (const [i, x] of a.entries())\` |
| C++ | \`for (size_t i = 0; i < a.size(); ++i)\` |

### Integer division and negative modulo

| | |
| --- | --- |
| Python | \`7 // 2 == 3\`, \`-7 // 2 == -4\` (floors); \`-7 % 3 == 2\` (**always non-negative**) |
| Java | \`-7 / 2 == -3\` (truncates); \`-7 % 3 == -1\` |
| JS/TS | \`Math.trunc(-7 / 2) === -3\`; \`-7 % 3 === -1\` |
| C++ | \`-7 / 2 == -3\` (truncates); \`-7 % 3 == -1\` |

Python's floored division and non-negative modulo is a real behavioral difference and a common source of wrong answers when porting an algorithm — especially in hashing and circular-array problems.

### Integer overflow

| | |
| --- | --- |
| Python | Arbitrary precision — never overflows |
| Java | \`int\` wraps silently at 2³¹−1; use \`long\` or \`Math.addExact\` |
| JS/TS | \`number\` is a double: exact only to 2⁵³−1; use \`BigInt\` beyond that |
| C++ | Signed overflow is **undefined behavior**; unsigned wraps |

Mentioning that \`(lo + hi) / 2\` can overflow in Java/C++ — and writing \`lo + (hi - lo) / 2\` instead — is a small detail that reliably impresses.`,
    },
  ],
  questions: [
    {
      q: "Which language would you use for this interview, and why?",
      a: "Python, because in a 45-minute round code volume is the enemy and the standard library does a lot of the work — Counter, defaultdict, deque, heapq, and bisect cover most of what these problems need, so I spend my time on the algorithm rather than boilerplate. The tradeoff I'd acknowledge is runtime: it's the slowest of the common choices, so on a very tight time limit I'd need to be more careful about constant factors, and I should be ready to explain what the library is doing underneath — heapq is a binary min-heap, push sifts up, pop sifts down, both O(log n). The general principle is to pick one language and be genuinely fluent, meaning I can write correct code with no IDE, no autocomplete, and no running it. Switching between rounds costs the muscle memory that decides whether you finish.",
    },
    {
      q: "What's wrong with `def f(items, seen=[])`?",
      a: "Default arguments are evaluated once, when the function is defined, and stored on the function object. So every call that omits `seen` shares the same list, and mutations accumulate across calls — the second call sees the first call's data. The fix is the sentinel pattern: default to None and build the list inside the function body. The same applies to `{}`, `set()`, and any mutable default, and also to non-obvious cases like `def f(t=datetime.now())`, where the timestamp is frozen at import time rather than evaluated per call. It's a good question because the mechanism — function objects hold their defaults — is the actual explanation, and knowing it means you also predict the datetime case.",
      weak: "Mutable default arguments are bad practice, you should use None instead.",
    },
    {
      q: "How would you implement a max-heap in Python?",
      a: "heapq is a min-heap only, so the standard trick is to negate on the way in and negate again on the way out: `heappush(h, -x)` and `-heappop(h)`. For tuples you negate the priority component, and since tuples compare lexicographically you often want a monotonic counter as a tiebreaker so the heap never tries to compare the payload objects and raise a TypeError. There's also a private `heapq._heapify_max`, but I wouldn't rely on an underscore API. Worth adding: for the very common 'k largest' problem you usually don't want a max-heap at all — you want a min-heap of bounded size k, pushing each element and popping when the size exceeds k. That's O(n log k) time and O(k) space instead of O(n log n).",
    },
    {
      q: "What's the difference between a shallow and a deep copy in Python? Show me a bug it causes.",
      a: "A shallow copy makes a new outer container whose elements are the same object references. A deep copy recursively copies everything. So with `b = grid[:]`, mutating `b[0][0]` also changes `grid[0][0]`, because both outer lists point at the same inner row objects. `copy.deepcopy` gives full independence. The related bug I see constantly in interview code is `grid = [[0] * 3] * 3` — that creates one row and three references to it, so setting `grid[0][0] = 1` appears to set the first column of every row. `[[0] * 3 for _ in range(3)]` is correct because the comprehension evaluates the inner expression fresh each iteration. Note `[0] * 3` is fine on its own, because ints are immutable, so sharing a reference is unobservable.",
    },
    {
      q: "Explain the equals/hashCode contract in Java and what breaks if you violate it.",
      a: "If two objects are equal by `.equals()`, they must return the same `hashCode()`. The reverse isn't required — collisions are legal. It matters because hash-based collections find the bucket by hash first, then call `.equals()` only within that bucket. If you override `equals` without `hashCode`, two equal objects get different hash codes, land in different buckets, and `map.get(equalKey)` returns null while a HashSet happily contains visible duplicates. The corollary is that you must never mutate a field used in `hashCode` while the object is a key in a map — the hash changes but the entry is still sitting in the old bucket, so it becomes permanently unreachable. That's the argument for immutable map keys. In modern Java, records generate both correctly from the components, which is the right answer for value types.",
      weak: "You should always override both equals and hashCode together, it's a Java convention.",
    },
    {
      q: "How does HashMap work internally?",
      a: "It's an array of buckets. On put, it takes `key.hashCode()`, spreads it with `h ^ (h >>> 16)` so the high bits influence the index, then indexes with `(n-1) & hash` — a cheap modulo because capacity is always a power of two. Collisions chain within a bucket. Since Java 8, a bucket that exceeds eight entries converts from a linked list to a red-black tree once the table is at least 64 buckets, so worst case is O(log n) instead of O(n); that was specifically a defense against hash-collision denial-of-service. When size exceeds capacity times the 0.75 load factor, the table doubles and everything is rehashed, which is why you pass an expected size for large maps. Average get and put are O(1).",
    },
    {
      q: "Why is `s += x` in a loop bad, and what do you do instead?",
      a: "Strings are immutable in both Java and Python, so `+=` can't modify in place — it allocates a new string and copies both operands. In a loop that's quadratic: n iterations each copying an average of n/2 characters. In Java you use a StringBuilder, which wraps a mutable growable buffer and does one allocation at `toString()`. In Python you accumulate into a list and `''.join()` it, which sizes the buffer in one pass and fills it in another, so it's linear. CPython does have an in-place optimization when a string has exactly one reference, which sometimes makes `+=` look linear in a microbenchmark, but it's an implementation detail that disappears as soon as anything else holds a reference — I wouldn't write code that depends on it.",
    },
    {
      q: "What is a closure? Why do `var` and `let` behave differently in a loop with setTimeout?",
      a: "A closure is a function together with the lexical environment it was defined in; the environment stays alive as long as the function references it, which is what gives you private state, factories, and memoization. In the loop case, `var` is function-scoped, so there is exactly one `i` binding and all three callbacks close over it — by the time the timers fire, the loop has finished and `i` is 3, so you get 3, 3, 3. `let` is block-scoped and the spec creates a fresh binding for each loop iteration, so each callback closes over its own copy and you get 0, 1, 2. Before `let` existed, the fix was wrapping the body in an IIFE to manufacture a new scope per iteration.",
      weak: "A closure is a function inside another function. `let` is block-scoped so it works and `var` doesn't.",
    },
    {
      q: "Explain the event loop. What does this log: `console.log(1); setTimeout(() => console.log(2)); Promise.resolve().then(() => console.log(3)); console.log(4);`",
      a: "1, 4, 3, 2. JavaScript is single-threaded; the runtime hands off long-running work and queues callbacks, and the event loop runs them only when the call stack is empty. The key detail is that there are two queues with different priorities. Microtasks — promise callbacks, queueMicrotask — and macrotasks — setTimeout, I/O, UI events. After each macrotask the loop drains the *entire* microtask queue before taking the next macrotask. So 1 and 4 run synchronously, then the stack empties, the promise callback (3) runs as a microtask, and only then the timer callback (2). Two consequences worth mentioning: an infinite chain of microtasks starves macrotasks and freezes the page, and a long synchronous loop blocks everything because there's only one thread.",
    },
    {
      q: "What's wrong with awaiting three independent fetches on separate lines?",
      a: "It serializes them. Each `await` suspends until that promise settles before the next call even starts, so three one-second requests take three seconds instead of one. If they're independent, you start them all first and await together: `const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()])`. This accidental waterfall is a real performance bug that shows up in production code constantly. Related trap: `items.forEach(async i => await save(i))` doesn't await anything — forEach ignores the returned promises, so the surrounding function proceeds immediately and rejections become unhandled. Use a `for...of` loop if you need sequential, or `Promise.all(items.map(...))` if you want concurrency.",
    },
    {
      q: "`==` versus `===` in JavaScript?",
      a: "`===` compares type and value with no coercion. `==` runs the abstract equality algorithm, which coerces first, and the results aren't intuitive: `0 == ''` and `0 == '0'` are both true but `'' == '0'` is false, so it isn't even transitive. `null == undefined` is true but `null == 0` is false — null is loosely equal only to undefined. And `NaN == NaN` is false under both, so you need `Number.isNaN` or `Object.is`. I use `===` always, with one accepted exception: `x == null` as a concise check for null-or-undefined. Two related bits of trivia: `typeof null` is `'object'`, a bug preserved since 1995 for backward compatibility, and `Object.is` differs from `===` on exactly `NaN` and `-0`.",
    },
    {
      q: "What's the difference between `any` and `unknown` in TypeScript?",
      a: "`any` switches type checking off for that value, and it's contagious — anything derived from it is also unchecked, so a single `any` at an API boundary can quietly void a whole module's guarantees. `unknown` is the type-safe top type: anything is assignable to it, but you can't do anything with it until you narrow it via `typeof`, `instanceof`, `in`, or a type predicate. The practical rule is to use `unknown` at every boundary where data enters the program — JSON, network responses, localStorage, user input — and validate it into a real type with something like Zod or a hand-written guard. `JSON.parse` returning `any` is the single most common way a supposedly fully-typed codebase lies to itself. I'd also mention `never`, the bottom type, which is what you use for exhaustiveness checks in a switch over a discriminated union so adding a variant becomes a compile error.",
      weak: "They're basically the same, `unknown` is just the newer safer version of `any`.",
    },
    {
      q: "What is structural typing?",
      a: "TypeScript checks whether a value has the right shape, not whether it declares a relationship to a named type. If an object has `x: number` and `y: number`, it satisfies a `Point` parameter with no `implements` clause anywhere — that's opposite to Java or C#, which are nominal, where a type has to explicitly declare that it implements an interface. It's what makes TypeScript work as a layer over existing JavaScript, since JS objects were never declared against interfaces. The one exception people trip on is excess property checking: passing an object *literal* with extra properties is an error, even though passing the same object through a variable is fine. That's deliberate — a stray property in a literal is almost always a typo, whereas a wider object flowing through a variable is normal structural subtyping.",
    },
    {
      q: "What is RAII, and how do smart pointers use it?",
      a: "Resource Acquisition Is Initialization: tie a resource's lifetime to an object's lifetime, acquiring in the constructor and releasing in the destructor. Because C++ destructors run deterministically when an object leaves scope — including during stack unwinding from an exception — cleanup can't be forgotten or skipped. That's why C++ doesn't need try/finally; `lock_guard` unlocks the mutex even if the body throws. Smart pointers apply it to heap memory. `unique_ptr` is single ownership with zero runtime overhead and should be the default; it's move-only, so ownership transfers explicitly. `shared_ptr` is reference-counted for genuinely shared ownership, but the count is atomic so copies aren't free and lifetimes get harder to reason about. `weak_ptr` is a non-owning observer that breaks reference cycles — two shared_ptrs pointing at each other never reach zero, which is a leak. Prefer `make_unique`/`make_shared` over raw `new` for exception safety.",
    },
    {
      q: "Explain the rule of three/five, and when you don't need it.",
      a: "If a class manages a raw resource, the compiler-generated copy is member-wise and therefore shallow — two objects would end up holding the same pointer and both would free it, a double free. So if you write any one of destructor, copy constructor, or copy assignment, you almost certainly need all three; that's the rule of three. C++11 adds move constructor and move assignment for stealing from temporaries, making it the rule of five, and a correct move implementation must leave the source in a valid destructible state, typically by nulling its pointer. But the better modern answer is the rule of zero: don't manage raw resources yourself. Hold a `std::vector` or a `unique_ptr` and write none of the five, because the compiler-generated versions are then correct by construction. Saying that last part is what shows you know the current idiom rather than just the historical rule.",
    },
    {
      q: "Why is `ArrayDeque` preferred over `Stack` and `LinkedList` in Java?",
      a: "`Stack` extends `Vector`, so every operation is synchronized — pure overhead in single-threaded code — and it inherits index-based access that breaks the stack abstraction; you can reach into the middle of it. The JDK docs themselves recommend `Deque` instead. Against `LinkedList` as a queue: `LinkedList` allocates a node per element and chases pointers, which destroys cache locality, whereas `ArrayDeque` is a circular array with O(1) amortized operations at both ends and much better constant factors. The same reasoning is why I use `ArrayList` over `LinkedList` essentially always — `LinkedList`'s theoretical O(1) insertion assumes you already hold the node, and getting there is O(n). So `ArrayDeque` for both stacks and queues, `ArrayList` for lists.",
    },
  ],
};
