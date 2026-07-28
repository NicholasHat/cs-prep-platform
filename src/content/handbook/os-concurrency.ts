import type { HandbookChapter } from "./types";

export const chapter: HandbookChapter = {
  slug: "os-concurrency",
  title: "Operating Systems & Concurrency",
  track: "systems",
  order: 2,
  summary:
    "Processes, threads, memory, and scheduling — then the concurrency material interviewers actually probe: races and how to spot them, deadlock, memory visibility, thread pools, the JavaScript event loop in real detail, and Python's GIL.",
  estMinutes: 85,
  tags: [
    "operating systems",
    "concurrency",
    "threads",
    "deadlock",
    "race conditions",
    "event loop",
    "async",
    "GIL",
    "virtual memory",
  ],
  sections: [
    {
      id: "processes-vs-threads",
      heading: "Processes vs threads, and what is actually shared",
      markdown: `A **process** is an instance of a running program plus everything the OS gives it: a private virtual address space, file descriptors, and a security context. A **thread** is a unit of scheduling inside a process. One process can have many threads; the kernel schedules threads, not processes.

The whole distinction reduces to one table. Learn it precisely, because "threads share memory" alone is not an answer.

| Resource | Shared between threads? | Shared between processes? |
| --- | --- | --- |
| Code / text segment | Yes | No (separate copies, though pages may be shared read-only) |
| Global and static variables | **Yes** | No |
| Heap | **Yes** | No |
| Open file descriptors | Yes | No (unless inherited across \`fork\`) |
| Signal handlers | Yes | No |
| Current working directory, umask, uid | Yes | No |
| **Stack** | **No — each thread gets its own** | No |
| Registers, program counter | No | No |
| Thread-local storage (\`thread_local\`, \`ThreadLocal\`) | No | No |
| Errno | No (it's thread-local) | No |

So: the heap and globals are shared, and each thread has its own stack and registers. That is why a local variable inside a function is automatically thread-safe, and why a global counter is not.

### Cost

Creating a process means creating a new address space and page tables — on Linux \`fork\` is cheap because of copy-on-write (pages are shared read-only and duplicated only when written), but it's still tens to hundreds of microseconds. Creating a thread only allocates a stack and a kernel task struct: roughly 10-100x cheaper, and each thread costs ~1 MB of virtual stack (reserved, not committed).

Context-switching between threads of the same process is cheaper than between processes, because the page tables and therefore the **TLB** (translation lookaside buffer) stay valid. A process switch flushes or tags the TLB, and the new process starts with cold caches.

### When to choose which

- **Threads:** work that shares a lot of mutable state and needs cheap communication — a web server handling requests against a shared cache, parallel computation over one big array.
- **Processes:** isolation and fault tolerance. A crash in one process cannot corrupt another's memory. This is why Chrome puts each tab in its own process, why Postgres uses one process per connection, and why nginx and Gunicorn run worker processes. It's also how Python gets real CPU parallelism (see the GIL section).

### Threading models

- **1:1 (kernel threads)** — every user thread maps to a kernel thread. Linux \`pthread\`s, Java threads (pre-Loom), Rust \`std::thread\`. True parallelism, but every thread costs kernel resources and every block is a syscall.
- **N:1 (green threads)** — many user threads on one kernel thread, scheduled in userspace. Cheap, but one blocking syscall stalls all of them.
- **M:N (hybrid)** — Go goroutines, Java virtual threads, Erlang processes. The runtime multiplexes many cheap user threads onto a small pool of kernel threads and moves a thread off when it blocks. This is why you can have a million goroutines and not a million OS threads.`,
    },
    {
      id: "context-switching-scheduling",
      heading: "Context switching and scheduling",
      markdown: `### What a context switch actually does

1. The current thread stops — because its timeslice expired (timer interrupt), it blocked on I/O, it yielded, or a higher-priority thread became runnable.
2. The kernel saves its **context**: program counter, stack pointer, general-purpose registers, and floating-point/vector state.
3. The scheduler picks the next thread.
4. If it belongs to a different process, the kernel swaps the page-table base register, which invalidates TLB entries.
5. It restores the new thread's registers and jumps back to userspace.

Direct cost is ~1-5 microseconds. The **indirect** cost is usually larger and is what people forget: the new thread starts with cold L1/L2 caches and a cold TLB, so its first thousands of instructions run at memory speed instead of cache speed. This is why spawning a thread per request stops helping past a certain point, and why thread pools sized near the core count usually beat huge pools.

**Thrashing** is the pathological version: so many runnable threads that the CPU spends more time switching and refilling caches than executing work. Symptom: high context-switch rate, high system CPU, low throughput.

### Thread states

\`\`\`text
              admitted            scheduler dispatch
  [new] ────────────────▶ [ready] ─────────────────▶ [running] ──▶ [terminated]
                             ▲                          │
                             │   interrupt / timeslice  │
                             └──────────────────────────┤
                             ▲                          │ I/O request, lock wait,
              I/O completes  │                          ▼ sleep, condvar wait
                             └────────────────────── [blocked]
\`\`\`

The critical distinction: **ready** means "wants CPU, waiting for a core" — more of these means you are CPU-bound. **Blocked** means "waiting for something external, will not use CPU" — more of these means you are I/O-bound, and adding threads can genuinely help because they're not competing for cores.

### Scheduling algorithms

| Algorithm | Idea | Problem |
| --- | --- | --- |
| FCFS | Run to completion in arrival order | Convoy effect: one long job blocks everyone |
| SJF / SRTF | Shortest job first | Optimal average wait, but job length is unknown and long jobs starve |
| Round robin | Fixed timeslice, rotate | Fair and simple; timeslice too small = switch overhead, too large = poor latency |
| Priority | Highest priority runs | Starvation — fixed with **aging** (raise priority the longer you wait) |
| Multilevel feedback queue | Multiple queues; jobs that use their whole slice drop to a lower-priority, longer-slice queue | Approximates SJF without knowing job lengths; classic Unix design |
| CFS (Linux) | Track each task's virtual runtime, always run the one with the least | Fair by construction; weights implement nice levels |

**Preemptive** (the kernel takes the CPU back on a timer) vs **cooperative** (a task runs until it yields). Cooperative is simpler and has no preemption races, but one runaway task freezes the system — which is exactly the failure mode of a blocking call inside a JavaScript event loop or a Python \`asyncio\` coroutine.

Two terms worth using correctly: **priority inversion** is when a high-priority thread waits on a lock held by a low-priority thread that a medium-priority thread keeps preempting (this bricked Mars Pathfinder); the fix is **priority inheritance**, where the lock holder temporarily inherits the waiter's priority.

### Kernel mode, user mode, and syscalls

The CPU runs in user mode (restricted) or kernel mode (full access). A **syscall** is a controlled trap into kernel mode: the thread puts a syscall number and arguments in registers, executes \`syscall\`/\`svc\`, the kernel validates and performs the operation, then returns. Cost is on the order of 100 ns-1 µs — cheap individually, expensive at a million per second, which is why high-performance I/O batches (\`io_uring\`, \`epoll\`) rather than issuing one syscall per byte.

A **blocking** syscall (\`read\` on a socket with no data) puts the thread in the blocked state and schedules someone else. A **non-blocking** one returns \`EAGAIN\` immediately — the foundation of event loops.`,
    },
    {
      id: "memory-model",
      heading: "Memory: stack, heap, virtual memory, and what a segfault really is",
      markdown: `### Process address space

\`\`\`text
high addresses
  ┌───────────────────────────┐
  │ kernel space (mapped, not accessible from user mode)
  ├───────────────────────────┤
  │ stack        ↓ grows down │  locals, parameters, return addresses, saved registers
  │                           │  one per thread; fixed max size (often 8 MB)
  │        (unmapped gap)     │  ← touching this is your segfault
  │                           │
  │ mmap region               │  shared libraries, large mallocs, memory-mapped files
  │                           │
  │ heap         ↑ grows up   │  malloc/new; managed by the allocator via brk/mmap
  ├───────────────────────────┤
  │ BSS                       │  uninitialized globals and statics (zeroed at load)
  ├───────────────────────────┤
  │ data                      │  initialized globals and statics
  ├───────────────────────────┤
  │ text                      │  machine code, read-only + executable
  └───────────────────────────┘
low addresses (page 0 unmapped, so *NULL faults)
\`\`\`

**Stack:** allocation is one instruction (move the stack pointer). Deallocation is automatic on return. Contiguous and cache-friendly. Bounded — infinite recursion overflows it, which the OS detects with a **guard page**. Objects cannot outlive their frame; returning a pointer to a local is a classic use-after-free.

**Heap:** allocation is a call into the allocator, which searches free lists, may fragment, and may call \`mmap\`/\`brk\` for more memory. Objects live until explicitly freed (C/C++/Rust) or until the GC proves they're unreachable (Java/Go/JS/Python). Two orders of magnitude slower than a stack bump, and scattered, so it's less cache-friendly.

In practice: locals and small fixed-size values on the stack; anything large, variable-sized, or outliving its frame on the heap. In Java, primitives and references live on the stack, objects always on the heap. In Go, the compiler does **escape analysis** — a value that doesn't outlive the function stays on the stack even if you took its address.

### Virtual memory and paging

Every process sees a private, contiguous virtual address space. The MMU translates virtual addresses to physical ones through **page tables**, in fixed-size **pages** (4 KB typically, plus 2 MB/1 GB huge pages).

Why it exists:

- **Isolation:** a process literally cannot name another process's memory.
- **Simplicity:** every program can be compiled as if it starts at the same address.
- **Overcommit:** total virtual memory can exceed physical RAM; the OS pages inactive data out to disk.
- **Sharing:** the same physical page can be mapped into many processes (shared libraries, copy-on-write after \`fork\`).

Translation on every memory access would be ruinous, so the **TLB** caches recent translations. A TLB hit costs ~1 cycle; a miss requires walking the page table (multiple memory accesses). This is the real reason context switches are expensive and why huge pages help database and JVM workloads — fewer entries to cover the same memory.

**Page fault:** the CPU traps because the page isn't currently in physical memory.

- *Minor fault:* the page is in memory but not mapped into this process's table yet (e.g. shared library already resident, or a copy-on-write page being written). Cheap.
- *Major fault:* the page must be read from disk. ~100 µs on SSD — roughly a thousand times slower than a hit. A process taking constant major faults is **thrashing**, and the machine will feel dead while showing low CPU.

Page replacement policies: LRU (approximated with a clock/second-chance algorithm, because true LRU is too expensive), plus working-set tracking.

### What a segfault really is

A segmentation fault is the CPU raising a hardware fault because a program accessed a virtual address that is either **not mapped at all** or mapped **without the permission being used** (writing a read-only page, executing a non-executable page). The kernel catches the fault, finds no valid mapping to fix up, and delivers \`SIGSEGV\`, whose default action kills the process.

Concretely, it means one of:

- Dereferencing \`NULL\` — page 0 is deliberately left unmapped so this fails loudly instead of corrupting memory.
- Dereferencing a dangling pointer after \`free\`, or a pointer into a returned stack frame.
- Running off the end of an array far enough to leave the mapped region (a small overrun usually corrupts silently instead — worse).
- Stack overflow hitting the guard page.
- Writing to a string literal in the read-only text segment.

The key insight for interviews: **a segfault is not "you touched memory you don't own" in the moral sense — it's "you touched an address the MMU has no valid mapping for."** Most memory bugs do *not* segfault; they quietly corrupt data that happens to be mapped. That's why tools like ASan and Valgrind exist.`,
    },
    {
      id: "ipc",
      heading: "Inter-process communication",
      markdown: `Processes have isolated address spaces, so they need an explicit channel. The choices differ mainly in throughput, whether they're local-only, and how much copying happens.

| Mechanism | Shape | Notes |
| --- | --- | --- |
| **Pipe** (\`\|\`) | Unidirectional byte stream | Anonymous, between related processes; kernel-buffered (~64 KB); writer blocks when full, reader blocks when empty — natural backpressure |
| **Named pipe (FIFO)** | Same, but has a filesystem name | Unrelated processes can connect |
| **Unix domain socket** | Bidirectional, stream or datagram | Local-only, faster than TCP (no checksums, no TCP stack); can pass file descriptors between processes; how Docker and most local daemons talk |
| **TCP/UDP socket** | Bidirectional over the network | Works across machines; the general case |
| **Shared memory** (\`shm_open\`+\`mmap\`) | A region mapped into both address spaces | **Fastest** — zero copies, no syscall per access. But *no synchronization is included*; you must add a semaphore or mutex yourself |
| **Message queue** | Kernel-managed queue of discrete messages | Preserves message boundaries and priorities |
| **Signal** | A number delivered asynchronously | Notification only, no payload; handlers may only call async-signal-safe functions |
| **Memory-mapped file** | File pages mapped into memory | Shares data and persists it; the OS handles paging |

Two points that come up:

**Why is shared memory fastest?** Everything else copies data from the sender's address space into a kernel buffer and then out into the receiver's — two copies plus two syscalls per message. Shared memory maps the same physical pages into both processes, so a write is just a store instruction. The price is that you own correctness: you need a mutex or semaphore in that shared region, and you need to think about memory visibility across cores.

**Why do pipes give you backpressure for free?** The kernel buffer has a fixed size. A fast producer eventually fills it and blocks in \`write\` until the consumer drains it. That's a flow-control mechanism you'd otherwise have to build.

Signals deserve one warning: a handler can fire between any two instructions, on any thread, so it can interrupt \`malloc\` mid-update. Calling \`malloc\` or \`printf\` from a handler can deadlock. The safe pattern is to set a \`volatile sig_atomic_t\` flag (or write a byte to a self-pipe) and do the real work in the main loop.`,
    },
    {
      id: "concurrency-vs-parallelism",
      heading: "Concurrency vs parallelism",
      markdown: `**Concurrency** is a structuring property: multiple tasks are *in progress* over the same period, and the system can make progress on one while another waits. **Parallelism** is an execution property: multiple tasks execute *at the same instant*, which requires multiple cores.

Rob Pike's phrasing is the one to use: *concurrency is about dealing with many things at once; parallelism is about doing many things at once.* Concurrency is a program-design idea; parallelism is a hardware capability.

\`\`\`text
Concurrent, not parallel (1 core, interleaved):
  core 0:  [A][B][A][B][A][B]

Parallel (2 cores):
  core 0:  [A A A A A A]
  core 1:  [B B B B B B]

Concurrent AND parallel (2 cores, 4 tasks):
  core 0:  [A][C][A][C]
  core 1:  [B][D][B][D]
\`\`\`

A single-threaded Node.js server is **concurrent but not parallel**: it juggles ten thousand connections, but only one line of JavaScript runs at a time. Two threads doing matrix multiplication on a dual-core machine are parallel. Goroutines are a concurrency construct; \`GOMAXPROCS\` decides how parallel they get.

### Which one does your problem need?

- **I/O-bound** (network calls, disk, database): the CPU is idle while waiting. You need **concurrency** — async I/O or more threads than cores, since blocked threads use no CPU. A single event-loop thread can saturate a network link.
- **CPU-bound** (hashing, image processing, compression): the CPU is the bottleneck. You need **parallelism** — real cores, meaning threads in a language without a GIL, or multiple processes. Adding concurrency to a CPU-bound workload adds overhead and no throughput.

Getting this diagnosis right is the most practically useful thing in this chapter. "Should I use async or threads?" is really "am I waiting, or am I computing?"

**Amdahl's law** bounds the payoff: if a fraction \`s\` of the work is inherently serial, the maximum speedup with \`N\` processors is \`1 / (s + (1-s)/N)\`. With 5% serial work, the ceiling is 20x no matter how many cores you buy. Its counterweight, **Gustafson's law**, notes that in practice people scale the problem size with the machine, so the serial fraction shrinks — which is why big data processing parallelizes well in reality.`,
    },
    {
      id: "race-conditions",
      heading: "Race conditions: what they are, and how to spot one",
      markdown: `A **race condition** exists when the correctness of a program depends on the relative timing of operations that the system does not guarantee. The most common form is a **data race**: two threads access the same memory location concurrently, at least one writes, and there is no synchronization between them.

### The canonical race

\`\`\`python
import threading

counter = 0

def increment():
    global counter
    for _ in range(100_000):
        counter += 1          # NOT atomic

threads = [threading.Thread(target=increment) for _ in range(4)]
for t in threads: t.start()
for t in threads: t.join()

print(counter)   # expected 400000; prints something less, and it varies
\`\`\`

\`counter += 1\` compiles to three steps — **load, add, store** — and a thread can be preempted between any two:

\`\`\`text
  counter = 5
  T1: load  counter -> 5
  T2: load  counter -> 5          (T1 preempted here)
  T2: add   1       -> 6
  T2: store 6                     counter = 6
  T1: add   1       -> 6
  T1: store 6                     counter = 6   ← one increment vanished
\`\`\`

This is a **lost update**, and it is the shape of most real races: a read-modify-write that isn't atomic.

### The fix: make the critical section atomic

\`\`\`python
import threading

counter = 0
lock = threading.Lock()

def increment():
    global counter
    for _ in range(100_000):
        with lock:            # acquire on enter, release on exit (even if we raise)
            counter += 1

threads = [threading.Thread(target=increment) for _ in range(4)]
for t in threads: t.start()
for t in threads: t.join()

print(counter)   # always 400000
\`\`\`

The lock does two things people often only credit it with one of: it provides **mutual exclusion** (only one thread in the critical section) *and* a **memory barrier** (writes made before a release are visible to a thread that subsequently acquires). Both matter — see the atomicity and visibility section.

Same bug and fix in Java, where the atomic version is worth knowing:

\`\`\`java
// Broken
class Counter {
    private int count = 0;
    void increment() { count++; }          // load-add-store, unsynchronized
    int get() { return count; }
}

// Fixed with a lock — coarse, but correct and composable
class SyncCounter {
    private int count = 0;
    synchronized void increment() { count++; }
    synchronized int get() { return count; }
}

// Fixed lock-free — a single CAS instruction, faster under contention
import java.util.concurrent.atomic.AtomicInteger;
class AtomicCounter {
    private final AtomicInteger count = new AtomicInteger();
    void increment() { count.incrementAndGet(); }
    int get() { return count.get(); }
}
\`\`\`

\`AtomicInteger\` uses **compare-and-swap**: read the value, compute the new one, and atomically swap only if the memory still holds the value you read; retry if it doesn't. One instruction, no kernel involvement, no blocking — but it only protects a single variable. The moment you need two fields consistent with each other, you need a lock (or a single immutable object swapped atomically).

### Beyond data races

Not every race is a data race. **Time-of-check to time-of-use (TOCTOU)** races involve an external resource:

\`\`\`python
# Broken: the file can be deleted or replaced between the check and the open
if os.path.exists(path):
    with open(path) as f:      # may raise, or open a different file entirely
        data = f.read()

# Fixed: don't check, just do it, and handle failure
try:
    with open(path) as f:
        data = f.read()
except FileNotFoundError:
    data = None
\`\`\`

The same shape appears in \`SELECT ... then INSERT if not found\` (fix with a unique constraint and \`INSERT ... ON CONFLICT\`), and in "check the balance, then withdraw" (fix with a transaction and row-level locking, or a conditional update).

### How to spot a race in a code review

Look for **shared mutable state** — a global, a field on an object handed to multiple threads, a module-level cache, a static, a file, a database row. Then ask three questions:

1. Is there a **read-modify-write** on it? \`x += 1\`, \`if not in dict: dict[k] = v\`, \`list.append\` on some runtimes, lazy initialization (\`if self._conn is None: self._conn = connect()\`).
2. Is there an **invariant across multiple fields** that must hold together? Updating \`balance\` and \`last_updated\` separately is two writes; a reader can see one and not the other.
3. Is a **check separated from an action** by any gap at all?

Symptoms in production: tests that pass locally and fail in CI, bugs that vanish when you add logging (logging changes timing), counts that drift slowly, "impossible" states in the database. Tools: Go's \`-race\` flag, Java's jcstress, C/C++ ThreadSanitizer, Python's \`faulthandler\` plus stress loops. If you can, reproduce with a loop that runs the operation from N threads a million times.`,
    },
    {
      id: "sync-primitives",
      heading: "Synchronization primitives, with code",
      markdown: `### Mutex

Mutual exclusion: one holder at a time, and **only the holder may release it**. Use for protecting a critical section.

\`\`\`python
lock = threading.Lock()

with lock:              # always prefer the context manager / RAII form
    shared.append(item) # so an exception can't leak the lock
\`\`\`

A **reentrant** mutex (\`threading.RLock\`, Java's \`synchronized\`) lets the same thread acquire it again without deadlocking — necessary when a locked method calls another locked method on the same object. A plain \`Lock\` deadlocks on itself in that situation.

**Spinlock vs blocking mutex:** a spinlock busy-waits in a loop; a mutex parks the thread in the kernel. Spinning wins only when the critical section is shorter than the ~1-5 µs of a context switch, and only with a real core to spin on. Most production mutexes are adaptive: spin briefly, then sleep.

### Semaphore

A counter with atomic \`acquire\` (decrement, block at zero) and \`release\` (increment, wake a waiter). Two distinct uses:

- **Counting semaphore** = a permit pool, for limiting concurrency: at most N in flight.
- **Binary semaphore** = a signal between threads. Unlike a mutex, **any** thread may release it, which makes it the right tool for producer/consumer signalling and the wrong tool for mutual exclusion (there's no ownership, so no reentrancy, no priority inheritance, and no way to detect "released by someone who never acquired").

\`\`\`python
# Cap concurrent outbound requests at 10, no matter how many workers exist.
sem = threading.Semaphore(10)

def fetch(url):
    with sem:
        return requests.get(url, timeout=5)
\`\`\`

### Condition variable

For waiting on a **predicate** ("the queue is non-empty") rather than on a lock. Always paired with a mutex. The rule that matters: **wait in a loop, never an \`if\`.**

\`\`\`python
import threading
from collections import deque

class BoundedQueue:
    def __init__(self, capacity):
        self._q = deque()
        self._capacity = capacity
        self._lock = threading.Lock()
        self._not_empty = threading.Condition(self._lock)
        self._not_full = threading.Condition(self._lock)

    def put(self, item):
        with self._lock:
            while len(self._q) >= self._capacity:   # while, not if
                self._not_full.wait()               # atomically releases the lock
            self._q.append(item)
            self._not_empty.notify()                # wake one waiting consumer

    def get(self):
        with self._lock:
            while not self._q:
                self._not_empty.wait()
            item = self._q.popleft()
            self._not_full.notify()
            return item
\`\`\`

Why \`while\` and not \`if\`: (1) **spurious wakeups** are permitted by the spec on most platforms; (2) with \`notify_all\`, several threads wake and race, and only the first finds the queue non-empty; (3) between the \`notify\` and the woken thread reacquiring the lock, another thread may have consumed the item. \`wait()\` atomically releases the mutex and blocks — that atomicity is the whole point, since checking the predicate and going to sleep must not have a gap.

\`notify\` wakes one waiter (cheaper, correct when all waiters are interchangeable); \`notify_all\` wakes everyone (necessary when different waiters wait on different predicates sharing one condition).

### Read-write lock

Many concurrent readers **or** one exclusive writer. Worth it when reads massively outnumber writes and the critical section is long enough to amortize the extra bookkeeping — a read-write lock is meaningfully more expensive than a plain mutex, so for a short section a mutex often wins.

\`\`\`java
import java.util.concurrent.locks.ReentrantReadWriteLock;

class ConfigStore {
    private final ReentrantReadWriteLock rw = new ReentrantReadWriteLock();
    private Map<String, String> config = Map.of();

    String get(String key) {
        rw.readLock().lock();
        try { return config.get(key); }
        finally { rw.readLock().unlock(); }
    }

    void replace(Map<String, String> next) {
        rw.writeLock().lock();
        try { config = Map.copyOf(next); }
        finally { rw.writeLock().unlock(); }
    }
}
\`\`\`

Watch for **writer starvation**: with a steady stream of readers, a naive implementation never lets the writer in. Fair/write-preferring modes fix it at some throughput cost. Note also that for this specific example — an immutable map replaced wholesale — an \`AtomicReference\` or a \`volatile\` field would be simpler and faster than any lock.

### Barrier and latch

A **barrier** blocks N threads until all N arrive, then releases them all — used in phased parallel algorithms. A **latch** (\`CountDownLatch\`) blocks until a counter hits zero and does not reset — used for "wait until initialization is done" or "wait for all workers to finish."

### Choosing

- Protecting a few lines of shared state → **mutex**.
- Limiting how many things happen at once → **counting semaphore**.
- Waiting for a state change → **condition variable**.
- Read-dominated, expensive critical section → **read-write lock**.
- A single number or reference → **atomic**, no lock at all.
- Best of all: **don't share mutable state.** Immutable values, thread confinement, or message passing over a channel eliminate the problem instead of managing it.`,
    },
    {
      id: "deadlock",
      heading: "Deadlock: four conditions, four ways out",
      markdown: `Deadlock is a cycle of threads each holding a resource the next one needs, so none can proceed. It requires **all four** Coffman conditions simultaneously — which is useful, because breaking any one prevents it.

1. **Mutual exclusion** — the resource can't be shared.
2. **Hold and wait** — a thread holds one resource while requesting another.
3. **No preemption** — resources can't be forcibly taken from a holder.
4. **Circular wait** — a cycle exists in the wait-for graph.

### The classic reproduction

\`\`\`java
class Account {
    final Object lock = new Object();
    long balance;
}

// DEADLOCKS: transfer(a, b) on thread 1 and transfer(b, a) on thread 2
void transfer(Account from, Account to, long amount) {
    synchronized (from.lock) {
        synchronized (to.lock) {
            from.balance -= amount;
            to.balance   += amount;
        }
    }
}
\`\`\`

Thread 1 holds \`a\` and wants \`b\`; thread 2 holds \`b\` and wants \`a\`. Both wait forever.

### Fix 1: break circular wait with lock ordering (the usual answer)

Impose a **global total order** on locks and always acquire in that order. Any stable ordering works as long as everyone agrees.

\`\`\`java
class Account {
    final long id;                 // unique, immutable
    final Object lock = new Object();
    long balance;
}

void transfer(Account from, Account to, long amount) {
    Account first  = from.id < to.id ? from : to;
    Account second = from.id < to.id ? to   : from;
    synchronized (first.lock) {
        synchronized (second.lock) {
            from.balance -= amount;
            to.balance   += amount;
        }
    }
}
\`\`\`

Now no cycle can form: every thread that holds a lower-id lock is only ever waiting on a higher-id one, and "wait for a strictly larger id" cannot be circular. (Guard against \`from.id == to.id\` — a self-transfer would try to acquire the same lock twice.)

### Fix 2: break hold-and-wait

Acquire everything at once or nothing:

\`\`\`java
while (true) {
    if (first.lock.tryLock()) {
        try {
            if (second.lock.tryLock()) {
                try { /* transfer */ return; }
                finally { second.lock.unlock(); }
            }
        } finally { first.lock.unlock(); }
    }
    Thread.sleep(ThreadLocalRandom.current().nextInt(1, 10)); // random backoff
}
\`\`\`

This works, but note the **livelock** risk: two threads can repeatedly grab, fail, and release in lockstep, making no progress while burning CPU. The randomized backoff is what makes it terminate — the same reason Ethernet uses random backoff.

### Fix 3: break no-preemption with timeouts

\`tryLock(500, MILLISECONDS)\` gives up, releases what it holds, and retries. Turns a hang into a retryable error, which is usually the right operational tradeoff.

### Fix 4: break mutual exclusion

Remove the shared resource. Use immutable data, per-thread copies, a single-threaded owner that others send messages to, or an optimistic/lock-free algorithm. Structurally the best answer where it applies.

### Related failure modes

- **Livelock** — threads are actively running and responding to each other, but no work completes. Two people stepping aside in a corridor.
- **Starvation** — a thread is perpetually denied a resource because others keep winning. Fix with fairness or aging.
- **Priority inversion** — covered in the scheduling section; fix with priority inheritance.

### Detection and prevention in practice

**Avoidance** (banker's algorithm) needs advance knowledge of maximum resource claims and is essentially never used in application code — know the name, don't propose it. **Detection** is realistic: databases build a wait-for graph, find cycles, and kill the cheapest victim (that's what Postgres's \`deadlock detected\` error is; the application should just retry the transaction). **Prevention** by lock ordering is what you actually do in code.

Diagnosing a suspected deadlock: take a thread dump (\`jstack\`, \`kill -3\`, \`py-spy dump\`, \`SIGQUIT\` for Go). It shows each thread's stack and what it's blocked on; the JVM will even name a detected deadlock cycle for you. The tell is threads blocked in lock acquisition with 0% CPU — versus livelock, where CPU is pegged.

**Best practical advice:** hold as few locks as possible, hold them for as short a time as possible, and never call into unknown code (a callback, a virtual method, an RPC) while holding a lock — you have no idea what locks it takes.`,
    },
    {
      id: "atomicity-visibility",
      heading: "Atomicity, memory visibility, and reordering",
      markdown: `Concurrency has two independent problems, and conflating them is a common interview mistake.

**Atomicity** — an operation completes indivisibly; no other thread can observe a half-done state. \`counter++\` is not atomic.

**Visibility** — when one thread writes, when (if ever) does another thread see it? This one is invisible in source code and surprises people.

### Why visibility is a real problem

Each core has its own store buffer and caches. A write may sit in a store buffer for a while before it becomes visible to other cores. Worse, both the **compiler** and the **CPU** reorder operations that are provably equivalent *for a single thread* — hoisting a loop-invariant read into a register, or executing independent instructions out of order. Neither reordering considers other threads.

\`\`\`java
// This can loop forever, even after another thread sets running = false.
class Worker extends Thread {
    private boolean running = true;          // NOT volatile

    public void run() {
        while (running) { doWork(); }        // JIT may hoist the read out of the loop:
    }                                        //   if (running) while (true) doWork();

    public void stop_() { running = false; } // may never be observed by run()
}
\`\`\`

The fix is to establish a **happens-before** relationship:

\`\`\`java
class Worker extends Thread {
    private volatile boolean running = true;   // volatile: every read hits memory,
                                               // every write is published
    public void run() { while (running) doWork(); }
    public void stop_() { running = false; }
}
\`\`\`

\`volatile\` in Java guarantees visibility and prevents reordering across the access. It does **not** provide atomicity: \`volatileCounter++\` is still a broken read-modify-write. That distinction — *volatile fixes visibility, not atomicity* — is a frequent interview question.

(Note: \`volatile\` in C and C++ means something entirely different — "don't optimize away this access", intended for memory-mapped hardware registers. It is **not** a threading tool there; use \`std::atomic\`.)

### Happens-before

A memory model defines which writes a read is guaranteed to see. In Java, happens-before edges are created by: program order within a thread; unlocking a monitor before another thread locks it; writing a \`volatile\` before another thread reads it; \`Thread.start()\` before anything in the new thread; everything in a thread before another thread's \`join()\` returns; and final-field initialization before the constructor returns. C++ has the same idea via \`std::memory_order\`; Go states it as "a send on a channel happens before the corresponding receive completes."

The practical consequence: **a mutex is not only mutual exclusion, it is also a memory barrier.** Data written while holding a lock is guaranteed visible to the next thread that acquires the same lock. If you protect all access to a variable with the same lock, you never need to think about visibility.

### Atomic operations and CAS

\`\`\`java
AtomicInteger n = new AtomicInteger();
n.incrementAndGet();       // atomic RMW, implemented as a CAS retry loop

// What a CAS loop looks like when you write it yourself:
AtomicReference<State> ref = new AtomicReference<>(initial);
State cur, next;
do {
    cur  = ref.get();
    next = compute(cur);       // must be a pure function of cur
} while (!ref.compareAndSet(cur, next));
\`\`\`

CAS is a single CPU instruction (\`lock cmpxchg\` on x86) that atomically swaps a value only if memory still holds the expected one. It's the basis of lock-free algorithms: no blocking, no context switch, no deadlock — at the cost of retries under contention and only ever covering one word.

The **ABA problem** is the classic gotcha: a value changes A → B → A between your read and your CAS, so the CAS succeeds even though the world moved underneath you (typically fatal for lock-free linked structures, where the node was freed and reallocated). Fix with a version-tagged pointer (\`AtomicStampedReference\`) or hazard pointers.

### False sharing

Two threads updating *different* variables that happen to live in the same 64-byte cache line will fight over that line, ping-ponging it between cores and destroying performance despite there being no logical contention. Fix by padding hot per-thread counters onto separate cache lines (\`@Contended\` in Java). Worth mentioning if asked why a parallel version got slower.`,
    },
    {
      id: "thread-pools",
      heading: "Thread pools",
      markdown: `Creating a thread per task is wasteful (allocation, kernel setup, ~1 MB of stack) and, worse, unbounded — a traffic spike creates 50,000 threads and the machine dies of context switching. A **thread pool** creates N worker threads once, and they pull tasks from a shared queue.

\`\`\`java
ExecutorService pool = new ThreadPoolExecutor(
    8,                                   // core pool size
    8,                                   // max pool size
    60L, TimeUnit.SECONDS,               // idle keepalive for threads above core
    new ArrayBlockingQueue<>(1000),      // BOUNDED queue — this matters
    new ThreadFactoryBuilder().setNameFormat("worker-%d").build(),
    new ThreadPoolExecutor.CallerRunsPolicy()  // backpressure when saturated
);

Future<Integer> f = pool.submit(() -> compute(x));
int result = f.get(2, TimeUnit.SECONDS);   // always with a timeout
\`\`\`

### Sizing

- **CPU-bound:** \`threads ≈ number of cores\` (sometimes cores + 1 to cover the occasional page fault). More threads only add switching overhead — there's no more CPU to hand out.
- **I/O-bound:** \`threads ≈ cores × (1 + wait_time / compute_time)\`. If a task waits 90 ms on the network per 10 ms of CPU, that's cores × 10. Threads blocked on I/O don't consume CPU, so oversubscription is correct here.
- Measure rather than trusting the formula, and use **separate pools for separate workloads** — one pool shared between fast and slow tasks means the slow ones starve the fast ones (head-of-line blocking). Bulkheading like this is one of the cheapest reliability wins there is.

### The details that actually cause outages

- **Bound the queue.** \`Executors.newFixedThreadPool\` uses an *unbounded* \`LinkedBlockingQueue\`: under overload it accepts work forever until you run out of heap, converting a latency problem into an \`OutOfMemoryError\`. A bounded queue plus a rejection policy gives you backpressure. Never use \`Executors.newCachedThreadPool\` for untrusted load — its max pool size is \`Integer.MAX_VALUE\`.
- **Rejection policy:** \`AbortPolicy\` (throw — the caller decides), \`CallerRunsPolicy\` (run it on the submitting thread, which naturally slows the producer down), \`DiscardPolicy\` (drop silently — almost always wrong).
- **Never block a pool thread on a task submitted to the same pool.** If all N threads are waiting for work that's queued behind them, nothing can ever run. This is **thread pool deadlock**, and it's why nested \`submit().get()\` is a bug.
- **Name your threads.** \`pool-1-thread-7\` in a stack trace tells you nothing; \`image-resize-3\` tells you everything.
- **Catch exceptions inside tasks.** With \`submit\`, an uncaught exception is captured in the \`Future\` and vanishes silently unless someone calls \`get()\`.
- **Shut down cleanly:** \`shutdown()\` then \`awaitTermination(...)\` then \`shutdownNow()\`. Non-daemon pool threads will otherwise keep the JVM alive forever.

### Work stealing

\`ForkJoinPool\` gives each worker its own deque and lets idle workers steal from the *tail* of a busy worker's deque. Because each worker pushes and pops from its own head, the common case needs no synchronization at all, and stealing from the opposite end minimizes contention. This is how Java parallel streams, Go's scheduler, and Rust's Rayon get good load balancing on recursive, unevenly-sized tasks.`,
    },
    {
      id: "event-loop",
      heading: "The JavaScript event loop, in detail",
      markdown: `This trips up almost every candidate, and it is very easy to get right if you learn the actual mechanism instead of "JavaScript is asynchronous."

JavaScript runs on **one thread** with **one call stack**. It never runs two lines of your code at once. Concurrency comes from the runtime handing slow work (timers, sockets, file I/O) to the host — libuv's thread pool and the OS in Node, browser-internal threads in a browser — and queueing a **callback** to run when that work finishes.

### The machinery

\`\`\`text
   ┌─────────────┐
   │  Call stack │  one frame per active function call. If this isn't empty,
   │             │  NOTHING else runs. Ever.
   └──────┬──────┘
          │ calls setTimeout / fetch / fs.readFile
          ▼
   ┌──────────────────────┐
   │ Web APIs / libuv     │  timers, sockets, DNS, fs — these run OFF the JS thread
   └──────┬───────────────┘
          │ when complete, push the callback
          ├────────────────────────────────┐
          ▼                                ▼
   ┌────────────────────┐        ┌─────────────────────────┐
   │ Macrotask queue    │        │ Microtask queue         │
   │ (task queue)       │        │ (job queue)             │
   │ setTimeout,        │        │ Promise .then/.catch,   │
   │ setInterval, I/O,  │        │ await continuations,    │
   │ MessageChannel,    │        │ queueMicrotask,         │
   │ UI events          │        │ MutationObserver        │
   └────────┬───────────┘        └───────────┬─────────────┘
            │                                │
            └──────────► Event loop ◄────────┘
\`\`\`

**The loop's rule, stated exactly:**

1. If the call stack is non-empty, run it to completion. The loop does nothing.
2. When the stack empties, **drain the entire microtask queue** — and microtasks added *during* this drain are also run, before moving on.
3. (In a browser) render if it's time to paint.
4. Take **one** macrotask from the task queue, push it onto the stack, run it to completion.
5. Go to step 2.

Two consequences that explain nearly every quiz question: **microtasks always run before the next macrotask**, and **an infinite chain of microtasks starves the loop permanently** — timers never fire, the page never paints.

### The canonical ordering question

\`\`\`js
console.log("1: script start");

setTimeout(() => console.log("2: setTimeout"), 0);

Promise.resolve()
  .then(() => console.log("3: promise then"))
  .then(() => console.log("4: chained then"));

queueMicrotask(() => console.log("5: queueMicrotask"));

(async () => {
  console.log("6: async fn body (synchronous!)");
  await null;
  console.log("7: after await");
})();

console.log("8: script end");
\`\`\`

Output:

\`\`\`text
1: script start
6: async fn body (synchronous!)
8: script end
3: promise then
5: queueMicrotask
7: after await
4: chained then
2: setTimeout
\`\`\`

Walk it: lines 1, 6, and 8 are synchronous — an \`async\` function body runs **immediately and synchronously** up to its first \`await\`. \`setTimeout\` goes to the macrotask queue. Then the stack empties and microtasks drain in FIFO order: \`3\` was queued first, then \`5\`, then \`7\` (queued when the \`await\` yielded). Running \`3\` queues \`4\` as a *new* microtask, which is appended after \`5\` and \`7\` and still runs in this same drain. Only when the microtask queue is completely empty does the loop take the single macrotask, \`2\`.

### Node's phases

Node's loop (libuv) is a macrotask queue split into ordered phases, cycled each iteration:

1. **timers** — expired \`setTimeout\`/\`setInterval\` callbacks.
2. **pending callbacks** — deferred system callbacks (some TCP errors).
3. **idle/prepare** — internal.
4. **poll** — retrieve new I/O events and run their callbacks; this is where the loop *blocks* waiting for work if there's nothing else to do.
5. **check** — \`setImmediate\` callbacks.
6. **close callbacks** — \`socket.on('close')\`.

Microtasks drain **between every callback**, not just between phases. Node also has \`process.nextTick\`, which has its own queue that drains **before** the promise microtask queue — so \`nextTick\` beats \`Promise.then\`. Avoid recursive \`nextTick\`; it starves I/O completely.

\`setTimeout(fn, 0)\` vs \`setImmediate(fn)\` from the main module is genuinely nondeterministic (it depends on how long process startup took relative to the 1 ms timer floor); called from within an I/O callback, \`setImmediate\` always wins, because the check phase comes right after poll.

### Blocking the loop

Because there is one thread, any synchronous work blocks everything — every request, every timer, every socket:

\`\`\`js
// Every other connection to this server stalls for the duration.
app.get("/hash", (req, res) => {
  const h = crypto.pbkdf2Sync(req.query.pw, "salt", 1_000_000, 64, "sha512");
  res.send(h.toString("hex"));
});

// Fixed: hand it to libuv's thread pool (async crypto/fs/zlib use it)
app.get("/hash", (req, res) => {
  crypto.pbkdf2(req.query.pw, "salt", 1_000_000, 64, "sha512", (err, h) => {
    if (err) return res.status(500).end();
    res.send(h.toString("hex"));
  });
});
\`\`\`

For pure-JS CPU work there's no pool to escape to, so use \`worker_threads\` (real OS threads with their own isolate and event loop, communicating by message passing and \`SharedArrayBuffer\`) or a separate process. Node's default libuv thread pool is only **4 threads** (\`UV_THREADPOOL_SIZE\`) and is shared by \`fs\`, \`dns.lookup\`, \`crypto\`, and \`zlib\` — a detail that explains a lot of mysterious latency. Note that network I/O does **not** use the pool; it uses epoll/kqueue directly.

### Why this design

One thread means no data races on JS objects, no locks, and no per-connection stack — which is why Node handles tens of thousands of idle connections in a fraction of the memory a thread-per-connection server needs. The trade is that you get **concurrency without parallelism**, and one bad \`while\` loop takes down the whole process.`,
    },
    {
      id: "async-await",
      heading: "async/await: what it compiles to and where it bites",
      markdown: `\`async\`/\`await\` is syntax over promises and continuations, not a new concurrency model. Understanding the desugaring removes most of the confusion.

- An \`async\` function **always returns a promise**. \`return 5\` resolves it with 5; a \`throw\` rejects it.
- Its body runs **synchronously** until the first \`await\`.
- \`await x\` suspends the function, schedules the rest of the body as a **microtask** on \`x\`'s resolution, and returns control to the caller. It does **not** block a thread.

\`\`\`js
// These are equivalent.
async function load(id) {
  const user = await getUser(id);
  const posts = await getPosts(user.id);
  return { user, posts };
}

function load(id) {
  return getUser(id).then((user) =>
    getPosts(user.id).then((posts) => ({ user, posts })),
  );
}
\`\`\`

### The mistake interviewers watch for: accidental sequencing

\`\`\`js
// 3 seconds — each await waits for the previous one, though nothing depends on it.
const a = await fetchA();   // 1s
const b = await fetchB();   // 1s
const c = await fetchC();   // 1s

// 1 second — start all three, then wait.
const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()]);
\`\`\`

The promises start executing the moment they're created; \`await\` only decides when you collect the result. Sequential awaits are correct only when a later call genuinely needs an earlier result.

The same bug hides inside loops:

\`\`\`js
// Sequential: N round trips end to end.
for (const id of ids) results.push(await fetchItem(id));

// Parallel, but unbounded — 10,000 ids means 10,000 concurrent sockets.
const results = await Promise.all(ids.map(fetchItem));

// Parallel with a concurrency cap — what you actually want.
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}
const results = await mapLimit(ids, 10, fetchItem);
\`\`\`

Note \`next++\` is safe here despite looking like a race — JavaScript's single thread means no other code runs between the read and the write. The same code in Java or Python would need an atomic.

### Promise combinators

- \`Promise.all\` — resolves with all results; **rejects as soon as any one rejects** (the others keep running, unobserved).
- \`Promise.allSettled\` — never rejects; gives you \`{status, value|reason}\` per input. Use when partial failure is acceptable.
- \`Promise.race\` — settles with the first to settle, success or failure. The standard timeout idiom.
- \`Promise.any\` — first *fulfilled*; rejects with an \`AggregateError\` only if all reject.

### Error handling

A rejected promise with no \`.catch\` and no \`await\` in a \`try\` is an **unhandled rejection**; in modern Node it crashes the process by default. Two specific traps:

\`\`\`js
// 1. Errors thrown inside an async callback are NOT caught by the outer try.
try {
  setTimeout(async () => { throw new Error("boom"); }, 0);
} catch (e) { /* never runs — the stack is long gone by then */ }

// 2. Forgetting to await swallows the failure and defeats the try/catch.
try {
  doWorkAsync();          // BUG: missing await; the rejection escapes
} catch (e) { /* never runs */ }
\`\`\`

### Cancellation

Promises are not cancellable. Use \`AbortController\`, which all modern APIs accept:

\`\`\`js
const ac = new AbortController();
const timer = setTimeout(() => ac.abort(), 5000);
try {
  const res = await fetch(url, { signal: ac.signal });
  return await res.json();
} catch (e) {
  if (e.name === "AbortError") throw new Error("timed out after 5s");
  throw e;
} finally {
  clearTimeout(timer);
}
\`\`\`

### The general lesson

Async/await gives you **cooperative** concurrency: a task holds the thread until it explicitly yields at an \`await\`. That's the same tradeoff as cooperative scheduling — no preemption races and no locks, but any function that computes for 200 ms without awaiting blocks everything. Python's \`asyncio\` works the same way, which is why calling \`requests.get\` (blocking) inside a coroutine instead of \`aiohttp\` silently destroys your concurrency.`,
    },
    {
      id: "gil",
      heading: "Python's GIL",
      markdown: `The **Global Interpreter Lock** is a single mutex in CPython that must be held to execute Python bytecode. It means **only one thread executes Python bytecode at a time, per interpreter, no matter how many cores you have.**

### Why it exists

CPython uses reference counting for memory management. Every object has a refcount incremented and decremented constantly, and those updates would need to be atomic — which would mean an atomic operation on essentially every operation in the language, slowing single-threaded code substantially. One coarse lock is far cheaper for the common case, and it also makes C extension modules trivially thread-safe by default. It's a pragmatic bargain: fast single-threaded performance and a simple C API, at the cost of multi-core Python threads.

### What it actually breaks

\`\`\`python
import time, threading

def burn(n):
    while n > 0:
        n -= 1

# One thread
t0 = time.perf_counter(); burn(50_000_000)
print("serial:  ", time.perf_counter() - t0)

# Four threads — on a 4-core machine this is NOT faster. It's slightly slower,
# because the threads hand the GIL back and forth.
t0 = time.perf_counter()
threads = [threading.Thread(target=burn, args=(12_500_000,)) for _ in range(4)]
for t in threads: t.start()
for t in threads: t.join()
print("threads: ", time.perf_counter() - t0)
\`\`\`

### What it does *not* break

The GIL is **released** around blocking I/O — socket reads, file reads, \`time.sleep\` — and by well-written C extensions during heavy computation (NumPy releases it for large array operations, and so do zlib and hashlib). So:

- **I/O-bound work threads just fine in Python.** A thread waiting on a socket isn't holding the GIL, so 50 threads doing HTTP requests genuinely overlap. This is the single most misunderstood point.
- **NumPy-heavy numeric code parallelizes** across threads, because the time is spent in C with the GIL dropped.

### Getting real CPU parallelism

\`\`\`python
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor

# CPU-bound: separate processes, each with its own interpreter and GIL.
with ProcessPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(expensive_pure_function, chunks))

# I/O-bound: threads are fine and much cheaper.
with ThreadPoolExecutor(max_workers=32) as pool:
    pages = list(pool.map(requests.get, urls))
\`\`\`

\`multiprocessing\` costs you process startup (~50 ms), and arguments and results must be **pickled** and copied between processes — so it wins only when the work per task substantially exceeds the serialization cost. Share large arrays via \`multiprocessing.shared_memory\` rather than passing them.

Other escapes: write the hot loop in C/Rust/Cython and release the GIL; use NumPy/Polars so the loop happens in native code; or use \`asyncio\` for I/O concurrency without threads at all. As of Python 3.13 there is an experimental free-threaded build (PEP 703) with the GIL removed, and 3.12 added per-interpreter GILs (PEP 684) — mentioning that the GIL is a *CPython implementation detail*, not a language rule (Jython and IronPython never had one), is a good closing note.

### The one-line answer

*"The GIL means CPython can only execute bytecode on one thread at a time, so threads give you no speedup for CPU-bound work — use processes for that. But the GIL is released during I/O, so threads work perfectly well for I/O-bound work, which is what most people actually need."*`,
    },
  ],
  questions: [
    {
      q: "What's the difference between a process and a thread? Be specific about what's shared.",
      a: "A process owns a private virtual address space and OS resources; a thread is a unit of scheduling inside a process. Threads of one process share the heap, globals and statics, open file descriptors, signal handlers, and the working directory. Each thread has its own stack, registers, program counter, and thread-local storage. That's why a function's locals are automatically thread-safe and a global counter is not. Threads are roughly 10-100x cheaper to create than processes, and switching between threads of the same process keeps the page tables and TLB valid, so it's cheaper too. You choose processes when you want isolation — a crash or memory corruption can't cross the boundary, which is why Chrome uses a process per tab and why Python uses processes for CPU parallelism.",
      weak: "A process is a running program and a thread is a lightweight process. Threads share memory and processes don't.",
    },
    {
      q: "What actually happens during a context switch, and why does it cost more than you'd think?",
      a: "The kernel saves the running thread's registers, program counter, and stack pointer, picks the next thread, swaps the page-table base register if it's a different process, and restores the new thread's registers. Direct cost is a few microseconds. The bigger cost is indirect: the incoming thread starts with cold L1/L2 caches and, on a process switch, a flushed TLB, so its first stretch of execution runs at memory speed rather than cache speed. That's why a huge thread pool can be slower than a small one, and why thrashing — more time switching and refilling caches than executing — is a real failure mode you can see as high context-switch rate with low throughput.",
    },
    {
      q: "Stack or heap — which does what, and how do you decide?",
      a: "The stack holds locals, parameters, and return addresses; allocation is a single pointer bump, deallocation is automatic on return, and it's contiguous so it's cache-friendly. It's bounded — typically 8 MB per thread — and nothing on it can outlive its frame. The heap holds anything large, variably sized, or longer-lived than the frame that created it; allocation involves the allocator's free lists, can fragment, and is roughly two orders of magnitude slower. Rule: small, fixed-size, frame-scoped goes on the stack; everything else on the heap. In Java, primitives and references are on the stack while objects are always on the heap. Go's compiler does escape analysis and keeps values on the stack when it can prove they don't outlive the function.",
    },
    {
      q: "What is a segmentation fault, mechanically?",
      a: "The CPU's MMU tried to translate a virtual address and either found no mapping or found one whose permissions don't allow the access — writing a read-only page, executing a non-executable one. That raises a hardware fault; the kernel sees there's no legitimate mapping to fill in and delivers SIGSEGV, which by default kills the process. Common causes: dereferencing NULL (page 0 is deliberately unmapped so it fails loudly), using a pointer after free, returning a pointer to a stack local, overrunning an array far enough to leave the mapping, or hitting the stack's guard page via runaway recursion. The important nuance is that most memory bugs don't segfault at all — a small overrun lands in memory that is mapped, so it silently corrupts data. A segfault is the lucky case.",
      weak: "It's when your program tries to access memory it doesn't own.",
    },
    {
      q: "Explain the difference between concurrency and parallelism, and tell me which one my problem needs.",
      a: "Concurrency is structuring a program so multiple tasks are in progress and progress can be made on one while another waits; parallelism is literally executing multiple tasks at the same instant, which requires multiple cores. A single-threaded Node server is concurrent but not parallel. The practical question is whether you're waiting or computing. I/O-bound work — network, disk, database — leaves the CPU idle, so you want concurrency: async I/O or more threads than cores, since blocked threads cost no CPU. CPU-bound work needs actual parallelism: real cores, so threads in a language without a GIL, or multiple processes. Adding concurrency to CPU-bound work just adds context-switch overhead. Amdahl's law bounds the payoff — 5% serial work caps you at 20x however many cores you add.",
    },
    {
      q: "Show me a race condition and fix it. Why is `counter += 1` not atomic?",
      a: "It's three machine steps: load the value, add one, store it back. A thread can be preempted between any two. Two threads both load 5, both compute 6, both store 6 — one increment is lost. Any read-modify-write on shared state has this shape. Fixes, in increasing sophistication: wrap it in a mutex, which gives both mutual exclusion and a memory barrier so the write is visible to the next acquirer; or use an atomic (AtomicInteger.incrementAndGet), which is a single compare-and-swap instruction — faster under contention and lock-free, but it only covers one variable. The moment two fields must be consistent with each other, you need a lock or an immutable object swapped atomically.",
      weak: "It's not atomic because multiple threads run at the same time, so you add a lock around it.",
    },
    {
      q: "How would you spot a race condition reviewing someone's code?",
      a: "Find the shared mutable state first — globals, statics, module-level caches, fields on an object handed to multiple threads, a file, a database row. Then ask three things. Is there a read-modify-write on it, like x += 1, lazy initialization, or check-then-insert into a dict? Is there an invariant spanning multiple fields that must hold together, so a reader could see one write but not the other? And is a check separated from the action it guards — the TOCTOU shape, like os.path.exists then open, or SELECT then INSERT? Symptoms in production are the tell too: tests that only fail in CI, bugs that disappear when you add logging because logging changes timing, and counters that drift slowly. Tools: Go's -race, ThreadSanitizer, Java's jcstress.",
    },
    {
      q: "What's the difference between a mutex, a semaphore, and a condition variable?",
      a: "A mutex is ownership-based mutual exclusion: one holder, and only the holder can release. Use it to protect a critical section. A semaphore is a counter with atomic acquire and release, and crucially has no owner — any thread can release it. That makes a counting semaphore the right tool for limiting concurrency to N permits, and a binary semaphore right for signalling between threads, but the wrong tool for mutual exclusion, since with no ownership you get no reentrancy, no priority inheritance, and no way to detect a release by a thread that never acquired. A condition variable lets you wait on a predicate rather than on a lock; it's always paired with a mutex, and wait() atomically releases the mutex and sleeps, which is the whole point — checking the predicate and going to sleep must have no gap.",
    },
    {
      q: "Why must you wait on a condition variable in a `while` loop rather than an `if`?",
      a: "Three reasons. Spurious wakeups are explicitly permitted by the spec on most platforms, so a wakeup doesn't prove the predicate is true. With notify_all, several waiters wake and race, and only the first one to reacquire the lock actually gets the item. And even with notify_one, between the notify and the woken thread reacquiring the mutex, some other thread can slip in and consume what it was woken for. In all three cases the thread must re-check the predicate, which is exactly what the while loop does.",
      weak: "Because of spurious wakeups.",
    },
    {
      q: "What are the four conditions for deadlock, and how do you break them?",
      a: "Mutual exclusion, hold-and-wait, no preemption, and circular wait — all four must hold simultaneously, so breaking any one prevents deadlock. In practice you break circular wait by imposing a global total order on locks and always acquiring in that order; in a bank transfer, sort the two accounts by id before locking, and no cycle can form. You break hold-and-wait with tryLock on everything and releasing all if you can't get them all — but then add randomized backoff, or two threads livelock grabbing and releasing in lockstep. You break no-preemption with lock timeouts, turning a hang into a retryable error. And you break mutual exclusion structurally by removing shared state — immutability, thread confinement, or message passing. Diagnose one with a thread dump: threads blocked on lock acquisition at 0% CPU.",
      weak: "Deadlock is when two threads wait for each other's locks. You avoid it by using timeouts.",
    },
    {
      q: "What's the difference between deadlock, livelock, and starvation?",
      a: "In deadlock, threads are blocked and nothing is running — you'd see zero CPU and threads parked on lock acquisition. In livelock, threads are actively running and reacting to each other but no work completes — CPU is pegged and throughput is zero; the classic cause is a retry loop with no randomized backoff where two threads keep releasing and re-grabbing in lockstep. In starvation, the system as a whole makes progress but one thread is perpetually denied a resource because others keep winning — a writer that never gets in because readers keep arriving, or a low-priority thread that's always preempted. Fix starvation with fairness policies or aging, which raises a waiter's priority the longer it has waited.",
    },
    {
      q: "In Java, what does `volatile` guarantee, and what does it not?",
      a: "It guarantees visibility and ordering: a read always goes to memory rather than a cached register, a write is published to other threads, and the compiler and CPU may not reorder across the access. That's what fixes the classic bug where a worker loops forever on a non-volatile boolean flag because the JIT hoisted the read out of the loop. It does not guarantee atomicity — volatileCounter++ is still a broken load-add-store. So volatile is right for a single-writer flag or an immutable reference swapped wholesale, and wrong for anything read-modify-write, where you need an atomic or a lock. Worth adding: a mutex is also a memory barrier, so if all access to a variable goes through the same lock, you never have to reason about visibility separately.",
      weak: "Volatile makes a variable thread-safe by making reads and writes atomic.",
    },
    {
      q: "How do you size a thread pool, and what's the most common way people misconfigure one?",
      a: "For CPU-bound work, roughly one thread per core — more just adds context-switch overhead since there's no extra CPU to hand out. For I/O-bound work, cores times (1 + wait time / compute time), so something waiting 90 ms per 10 ms of CPU wants about ten threads per core. Then measure. The most common misconfiguration is an unbounded queue: Executors.newFixedThreadPool uses an unbounded LinkedBlockingQueue, so under overload it accepts work until the heap dies, turning a latency problem into an OutOfMemoryError. Use a bounded queue plus a rejection policy — CallerRunsPolicy is a neat trick because running the task on the submitting thread naturally throttles the producer. Also: separate pools per workload so slow tasks can't head-of-line-block fast ones, name your threads, and never block a pool thread on a task submitted to the same pool.",
    },
    {
      q: "Walk me through what the JavaScript event loop does, and predict the output of a mixed setTimeout / promise / async example.",
      a: "One thread, one call stack. While the stack is non-empty nothing else runs. When it empties, the loop drains the entire microtask queue — promise callbacks, await continuations, queueMicrotask — including microtasks queued during that drain. Then it may render, then it takes exactly one macrotask (setTimeout, I/O, UI event), runs it to completion, and repeats. So: synchronous code first, including an async function's body up to its first await; then all microtasks in FIFO order; then one timer callback. Two consequences fall out: microtasks always beat the next macrotask, and an infinite chain of microtasks starves the loop entirely so timers never fire and the page never paints. In Node the macrotask side is split into ordered phases — timers, pending, poll, check (setImmediate), close — with microtasks draining between every callback, and process.nextTick draining before promises.",
      weak: "JavaScript is asynchronous and non-blocking, so setTimeout callbacks and promises run later, after the main code finishes.",
    },
    {
      q: "You have a CPU-heavy computation in a Node request handler. What happens and what do you do?",
      a: "It blocks the single event-loop thread for its entire duration, so every other request, timer, and socket callback stalls — a 500 ms computation adds up to 500 ms of latency to every concurrent request. First, check whether an async version exists: crypto, zlib, and fs have async APIs that run on libuv's thread pool, which is only 4 threads by default and shared between them, so that pool is itself a bottleneck worth knowing about. For pure-JS computation there's no pool to escape to, so move it to worker_threads — real OS threads with their own isolate, communicating by message passing or SharedArrayBuffer — or to a separate process or job queue if it's genuinely heavy. Note that network I/O doesn't touch the thread pool at all; it uses epoll/kqueue directly.",
    },
    {
      q: "These three awaits in a row take three seconds. Why, and how do you fix it?",
      a: "Because each await suspends until that call resolves before the next one is even started, so the latencies add. Promises begin executing when they're created, not when they're awaited, so if the calls are independent you create all three first and then await them together with Promise.all — one second total. The same bug hides in loops: awaiting inside a for loop is fully sequential. But don't overcorrect to Promise.all over ten thousand items, because that opens ten thousand concurrent sockets; use a bounded map with a concurrency limit. And pick the right combinator: Promise.all rejects on the first failure, allSettled gives you per-item outcomes when partial failure is acceptable, race is the timeout idiom, and any takes the first success.",
      weak: "Because await blocks, so you should use Promise.all to run them on separate threads.",
    },
    {
      q: "What is the GIL and when does it actually matter?",
      a: "The Global Interpreter Lock is a mutex in CPython that a thread must hold to execute Python bytecode, so only one thread runs Python at a time regardless of core count. It exists because CPython uses reference counting, and making every refcount update atomic would slow single-threaded code substantially; one coarse lock is cheaper and makes C extensions thread-safe by default. It matters for CPU-bound work: four threads burning CPU on four cores are no faster than one, and usually slightly slower from handing the GIL back and forth. It does not matter for I/O-bound work, because the GIL is released around blocking I/O — 50 threads doing HTTP requests genuinely overlap. It's also released by well-written C extensions, so NumPy-heavy code parallelizes. For real CPU parallelism use ProcessPoolExecutor, accepting process startup cost and pickling of arguments and results. And it's a CPython implementation detail — Jython never had one, 3.12 added per-interpreter GILs, and 3.13 ships an experimental free-threaded build.",
      weak: "The GIL means Python can't do multithreading, so you always have to use multiprocessing.",
    },
  ],
};
