import type { HandbookChapter } from "./types";

export const chapter: HandbookChapter = {
  slug: "oop-and-design",
  title: "OOP & Code Design",
  track: "fundamentals",
  order: 3,
  summary:
    "The design vocabulary interviewers expect: the OOP pillars with real motivation, composition over inheritance, SOLID with before/after code, the patterns interns actually get asked about, and a fully worked low-level design.",
  estMinutes: 90,
  tags: [
    "oop",
    "solid",
    "design-patterns",
    "refactoring",
    "low-level-design",
    "immutability",
    "error-handling",
  ],
  sections: [
    {
      id: "four-pillars",
      heading: "The four pillars, with actual motivation",
      markdown: `Everyone can recite "encapsulation, abstraction, inheritance, polymorphism." That recitation is worth nothing in an interview. What earns signal is being able to say *what problem each one solves* and *what it costs*.

### Encapsulation — the object owns its invariants

The definition ("bundling data with methods, hiding internals") misses the point. The point is that an object is responsible for staying in a valid state, and the only way to guarantee that is to make invalid states unreachable from outside.

\`\`\`ts
// No encapsulation: every caller can corrupt the balance.
class Account {
  balance = 0;
}
account.balance = -5000;         // nothing stopped this

// Encapsulated: the invariant "balance >= 0" is enforced in one place.
class Account {
  #balanceCents = 0;             // truly private (# is enforced at runtime)

  get balanceCents(): number {
    return this.#balanceCents;
  }

  deposit(cents: number): void {
    if (cents <= 0) throw new RangeError("deposit must be positive");
    this.#balanceCents += cents;
  }

  withdraw(cents: number): void {
    if (cents > this.#balanceCents) throw new InsufficientFunds();
    this.#balanceCents -= cents;
  }
}
\`\`\`

The payoff: when the balance goes wrong, there are exactly two places to look. Without encapsulation, the suspect list is every line in the codebase that touches \`.balance\`.

The failure mode to name: **a class with a getter and setter for every field is not encapsulated.** It is a struct with extra typing. Encapsulation means exposing *behavior*, not fields.

### Abstraction — a stable contract over a changeable implementation

Abstraction is about what callers are allowed to depend on. \`repository.findUser(id)\` lets you swap Postgres for a cache for an HTTP call without touching a single caller.

The cost, which candidates rarely mention: **every abstraction is a bet that the implementation will change.** An interface with exactly one implementation, that never gets a second, is pure indirection — it makes the code harder to read and nothing easier to change. Do not abstract speculatively; abstract when you have the second implementation or a concrete reason to expect it.

### Inheritance — shared implementation via an is-a relationship

Inheritance is the most overused and most dangerous of the four. It creates the tightest coupling available in an object-oriented language: a subclass depends on the *internals* of its parent, so a change inside the parent can break a subclass that never touched that code. This is the "fragile base class" problem.

The test is not "does this share code." It is **Liskov substitution**: can every instance of the subclass be used anywhere the parent is expected, with no caller having to know the difference? If a caller needs a type check, the hierarchy is wrong.

### Polymorphism — one call site, many behaviors

This is the pillar that actually earns its keep, because it is how you delete conditionals:

\`\`\`ts
// Every new shape means editing this function. It grows forever.
function area(shape: Shape): number {
  if (shape.kind === "circle") return Math.PI * shape.r ** 2;
  if (shape.kind === "square") return shape.side ** 2;
  throw new Error("unknown shape");
}

// Each shape owns its own answer. Adding a shape touches no existing code.
interface Shape {
  area(): number;
}
class Circle implements Shape {
  constructor(private readonly r: number) {}
  area() { return Math.PI * this.r ** 2; }
}
class Square implements Shape {
  constructor(private readonly side: number) {}
  area() { return this.side ** 2; }
}

const total = shapes.reduce((sum, s) => sum + s.area(), 0);
\`\`\`

Note the honest caveat: in a language with discriminated unions and exhaustiveness checking, the switch version has a real advantage — adding a variant produces a compile error at *every* place that needs updating, whereas the polymorphic version can silently miss a required method if you add an operation instead of a type. This is the **expression problem**: OO makes adding types easy and adding operations hard; functional/switch style makes adding operations easy and adding types hard. Naming that tradeoff is a strong senior-level signal.`,
    },
    {
      id: "composition-over-inheritance",
      heading: "Composition over inheritance: a concrete refactor",
      markdown: `The advice is famous; the reasoning usually is not. Here is the failure in full.

### The inheritance version

We are modeling employees. Managers are employees who also approve expenses.

\`\`\`ts
class Employee {
  constructor(protected readonly name: string, protected salaryCents: number) {}
  pay(): number { return this.salaryCents / 12; }
}

class Manager extends Employee {
  approve(expense: Expense): void { /* ... */ }
}
\`\`\`

Fine so far. Then reality arrives:

- Contractors get paid hourly, not monthly.
- Some contractors approve expenses.
- Interns have a mentor and cannot approve anything.
- A tech lead codes *and* manages.
- Someone converts from contractor to full-time — the same person, a different class.

Every one of these needs a new subclass, and the combinations multiply: \`SalariedManager\`, \`ContractorApprover\`, \`SalariedTechLead\`. This is the **class explosion**. Worse, the last bullet is impossible to model well: an object cannot change its class at runtime, so "contractor becomes an employee" means constructing a new object and fixing up every reference to the old one.

The deeper problem is that inheritance forced a **single** axis of variation (what kind of person you are) onto a domain that has **several independent** axes (how you are paid, what you can approve, who you report to).

### The composition version

Model each axis as its own thing, and let a person hold them.

\`\`\`ts
// --- Axis 1: compensation ---------------------------------------------
interface Compensation {
  monthlyPayCents(period: Period): number;
}

class Salaried implements Compensation {
  constructor(private readonly annualCents: number) {}
  monthlyPayCents() { return Math.round(this.annualCents / 12); }
}

class Hourly implements Compensation {
  constructor(private readonly rateCents: number) {}
  monthlyPayCents(period: Period) { return this.rateCents * period.hoursWorked; }
}

// --- Axis 2: approval authority ---------------------------------------
interface ApprovalPolicy {
  canApprove(expense: Expense): boolean;
}

class NoApproval implements ApprovalPolicy {
  canApprove() { return false; }
}

class LimitedApproval implements ApprovalPolicy {
  constructor(private readonly limitCents: number) {}
  canApprove(expense: Expense) { return expense.amountCents <= this.limitCents; }
}

// --- The person holds one of each -------------------------------------
class Person {
  constructor(
    readonly name: string,
    private compensation: Compensation,
    private approval: ApprovalPolicy,
  ) {}

  payFor(period: Period): number {
    return this.compensation.monthlyPayCents(period);
  }

  canApprove(expense: Expense): boolean {
    return this.approval.canApprove(expense);
  }

  // The thing inheritance could not do at all:
  convertToSalaried(annualCents: number): void {
    this.compensation = new Salaried(annualCents);
  }
}

const intern = new Person("Sam", new Hourly(2500), new NoApproval());
const lead   = new Person("Ada", new Salaried(18_000_000), new LimitedApproval(500_00));
\`\`\`

### What actually improved

| | Inheritance | Composition |
| --- | --- | --- |
| New combination | new subclass (n × m classes) | new object (n + m classes) |
| Change at runtime | impossible | assign a new component |
| Testing one axis | construct the whole subclass | test \`Hourly\` in three lines |
| Coupling | subclass depends on parent internals | depends only on a small interface |
| Where behavior lives | scattered up an inheritance chain | one named, findable class |

The rule of thumb: **inheritance for is-a, composition for has-a or behaves-like.** A manager *is* a person, but a salary policy is something a person *has*. When in doubt, compose — you can always extract a base class later, but unwinding a deep hierarchy is a rewrite.

The one thing you lose is the tiny bit of boilerplate that delegation costs (\`payFor\` forwarding to \`compensation\`). That is a genuinely cheap price for the flexibility above.`,
    },
    {
      id: "solid",
      heading: "SOLID, each with before and after",
      markdown: `SOLID is five heuristics for keeping code changeable. Every one of them is really about **isolating the reason a file has to change**.

## S — Single Responsibility

*A class should have one reason to change.* "Reason" means "stakeholder or concern," not "one method."

\`\`\`ts
// BEFORE: three reasons to change — business rules, HTML, and SMTP.
class Invoice {
  constructor(readonly lines: Line[]) {}

  totalCents(): number {
    return this.lines.reduce((s, l) => s + l.qty * l.unitCents, 0);
  }

  toHtml(): string {
    return \`<h1>Invoice</h1><p>\${this.totalCents()}</p>\`;
  }

  email(to: string): void {
    smtp.send(to, "Your invoice", this.toHtml());
  }
}
\`\`\`

A designer changing the template edits the same file as an accountant changing tax rules, and the class cannot be unit-tested without an SMTP server.

\`\`\`ts
// AFTER: each concern is separately changeable and separately testable.
class Invoice {
  constructor(readonly lines: Line[]) {}
  totalCents(): number {
    return this.lines.reduce((s, l) => s + l.qty * l.unitCents, 0);
  }
}

class InvoiceHtmlRenderer {
  render(invoice: Invoice): string {
    return \`<h1>Invoice</h1><p>\${invoice.totalCents()}</p>\`;
  }
}

class InvoiceMailer {
  constructor(private readonly mail: MailSender,
              private readonly renderer: InvoiceHtmlRenderer) {}
  send(invoice: Invoice, to: string): void {
    this.mail.send(to, "Your invoice", this.renderer.render(invoice));
  }
}
\`\`\`

The counter-pressure worth mentioning: taken to an extreme, SRP produces a hundred one-method classes and you cannot find anything. The test is whether two concerns change *at different times, for different people*. If they always change together, they belong together.

## O — Open/Closed

*Open for extension, closed for modification.* You should be able to add behavior without editing tested, working code.

\`\`\`ts
// BEFORE: every new payment method edits this method. Regression risk on
// existing methods every single time.
class PaymentProcessor {
  pay(method: string, cents: number): Receipt {
    if (method === "card") return this.card(cents);
    if (method === "paypal") return this.paypal(cents);
    throw new Error("unsupported");
  }
}
\`\`\`

\`\`\`ts
// AFTER: adding Apple Pay is a new file. PaymentProcessor is never reopened.
interface PaymentMethod {
  pay(cents: number): Promise<Receipt>;
}

class CardPayment implements PaymentMethod { async pay(cents: number) { /* ... */ } }
class PayPalPayment implements PaymentMethod { async pay(cents: number) { /* ... */ } }

class PaymentProcessor {
  constructor(private readonly method: PaymentMethod) {}
  pay(cents: number) { return this.method.pay(cents); }
}
\`\`\`

Note that this only pays off along the axis you predicted. If the next change is "every method needs a refund," you have to edit every implementation — you were closed for the wrong thing. Open/closed is not free; it is a bet on where change will come from, which is why it is worth applying *after* you have seen the change happen twice.

## L — Liskov Substitution

*A subtype must be usable anywhere its supertype is, without callers knowing.*

\`\`\`ts
// BEFORE: the textbook violation, and it's a real bug.
class Rectangle {
  constructor(protected w: number, protected h: number) {}
  setWidth(w: number) { this.w = w; }
  setHeight(h: number) { this.h = h; }
  area() { return this.w * this.h; }
}

class Square extends Rectangle {
  setWidth(w: number) { this.w = w; this.h = w; }   // must stay square
  setHeight(h: number) { this.w = h; this.h = h; }
}

function resize(r: Rectangle) {
  r.setWidth(5);
  r.setHeight(4);
  console.assert(r.area() === 20);   // fails for Square: area is 16
}
\`\`\`

A square *is* a rectangle in geometry, but a *mutable* square is not a substitutable *mutable* rectangle, because it breaks the caller's reasonable assumption that width and height are independent.

\`\`\`ts
// AFTER: immutable value types. No setters means no contradictory invariant.
interface Shape { area(): number; }

class Rectangle implements Shape {
  constructor(readonly w: number, readonly h: number) {}
  area() { return this.w * this.h; }
  withWidth(w: number) { return new Rectangle(w, this.h); }
}

class Square implements Shape {
  constructor(readonly side: number) {}
  area() { return this.side ** 2; }
}
\`\`\`

The practical smell for LSP: a subclass that throws \`UnsupportedOperationException\`, silently ignores a call, or tightens a precondition. If callers need \`instanceof\` checks, substitutability is already broken.

## I — Interface Segregation

*No client should be forced to depend on methods it does not use.*

\`\`\`ts
// BEFORE: a fat interface. A read-only report screen must implement writes.
interface UserStore {
  findById(id: string): Promise<User>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
  exportCsv(): Promise<string>;
}
\`\`\`

\`\`\`ts
// AFTER: small, role-based interfaces. Consumers depend on exactly what
// they use, and test doubles become trivial.
interface UserReader { findById(id: string): Promise<User>; }
interface UserWriter { save(user: User): Promise<void>;
                       delete(id: string): Promise<void>; }
interface UserExporter { exportCsv(): Promise<string>; }

class PostgresUserStore implements UserReader, UserWriter, UserExporter { /* ... */ }

class ProfileScreen {
  constructor(private readonly users: UserReader) {}   // cannot write. By construction.
}
\`\`\`

The under-appreciated benefit: a narrow interface makes the *dependency* legible. \`ProfileScreen\` taking a \`UserReader\` documents that it never mutates users, and the compiler enforces it.

## D — Dependency Inversion

*High-level policy should not depend on low-level detail; both depend on abstractions.*

\`\`\`ts
// BEFORE: business logic reaches out and constructs its own infrastructure.
import { PostgresClient } from "./postgres";

class OrderService {
  private db = new PostgresClient(process.env.DATABASE_URL!);   // hard-wired

  async place(order: Order) {
    await this.db.query("INSERT INTO orders ...", [order.id]);
  }
}
\`\`\`

You cannot test \`place\` without a Postgres instance, and you cannot swap the store. Note that the arrow points the wrong way: the *policy* (ordering rules) depends on the *detail* (Postgres).

\`\`\`ts
// AFTER: the interface is owned by the high-level module; the adapter
// implements it. Now the detail depends on the policy.
interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order | null>;
}

class OrderService {
  constructor(private readonly orders: OrderRepository) {}
  async place(order: Order) {
    await this.orders.save(order);
  }
}

class PostgresOrderRepository implements OrderRepository { /* ... */ }
class InMemoryOrderRepository implements OrderRepository { /* ... for tests */ }

// Composition root — the one place that knows about concrete types.
const service = new OrderService(new PostgresOrderRepository(pool));
\`\`\`

The detail that separates a strong answer from a memorized one: **it is not "inverted" merely because you injected something.** The inversion is that \`OrderRepository\` is defined next to \`OrderService\`, in the domain layer, expressing what the domain needs — and the database adapter conforms to it. If the interface is defined in the database package and just describes what Postgres can do, you have injection but not inversion.`,
    },
    {
      id: "patterns",
      heading: "Design patterns interns actually get asked about",
      markdown: `Patterns are shared vocabulary, not a checklist. Introducing a pattern that solves a problem you do not have is worse than the duplication it replaced. The right time to reach for one is when you recognize the *problem* it names.

## Strategy — swap an algorithm at runtime

\`\`\`ts
interface ShippingStrategy {
  costCents(order: Order): number;
}

class StandardShipping implements ShippingStrategy {
  costCents(order: Order) { return 500 + order.weightKg * 100; }
}
class ExpressShipping implements ShippingStrategy {
  costCents(order: Order) { return 1500 + order.weightKg * 250; }
}
class FreeShipping implements ShippingStrategy {
  costCents() { return 0; }
}

class Checkout {
  constructor(private shipping: ShippingStrategy) {}
  setShipping(s: ShippingStrategy) { this.shipping = s; }   // runtime swap
  totalCents(order: Order) {
    return order.subtotalCents + this.shipping.costCents(order);
  }
}
\`\`\`

**Use when**: you have an if/else or switch selecting between interchangeable algorithms. Strategy is the pattern behind the open/closed refactor above, and it is the single most useful pattern at intern level.

## Factory — centralize object creation

\`\`\`ts
// Factory method: the caller names what it wants, not how it's built.
class NotifierFactory {
  static create(channel: Channel, config: Config): Notifier {
    switch (channel) {
      case "email": return new EmailNotifier(config.smtp);
      case "sms":   return new SmsNotifier(config.twilio);
      case "push":  return new PushNotifier(config.fcm);
    }
  }
}
\`\`\`

**Use when**: construction is nontrivial (dependencies, validation, choosing an implementation) and you do not want that logic duplicated at every call site. It also gives you one place to change when construction changes.

The honest caveat: a factory whose only job is \`return new Thing()\` is ceremony. Add it when construction actually has logic.

## Observer — one-to-many notification

\`\`\`ts
type Listener<T> = (event: T) => void;

class EventEmitter<T> {
  private listeners = new Set<Listener<T>>();

  subscribe(fn: Listener<T>): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);   // return the unsubscribe
  }

  emit(event: T): void {
    for (const fn of [...this.listeners]) fn(event);   // copy: listeners may unsubscribe
  }
}

const orders = new EventEmitter<OrderPlaced>();
const off = orders.subscribe((e) => sendConfirmationEmail(e.orderId));
orders.subscribe((e) => analytics.track("order_placed", e));
orders.emit({ orderId: "o_1" });
off();
\`\`\`

**Use when**: a subject must notify an unknown number of interested parties without knowing who they are. This is the model behind DOM events, React state subscriptions, and pub/sub messaging.

Two details worth saying: **always return an unsubscribe function**, because forgotten listeners are the classic memory leak; and iterate a *copy* of the listener set, since a listener that unsubscribes during \`emit\` would otherwise mutate the collection you are iterating.

## Singleton — and why it is usually an anti-pattern

\`\`\`ts
class Config {
  private static instance: Config | null = null;
  private constructor(readonly values: Record<string, string>) {}
  static getInstance(): Config {
    if (!Config.instance) Config.instance = new Config(loadFromEnv());
    return Config.instance;
  }
}
\`\`\`

Be ready to argue against it, because that is the actual question:

1. **It is global mutable state in a costume.** Any code anywhere can reach it, so you cannot reason locally about what changes it.
2. **It destroys testability.** Tests share the instance, so they leak state into each other and become order-dependent. There is usually no clean way to substitute a test double.
3. **It hides dependencies.** A class that calls \`Config.getInstance()\` has a dependency that does not appear in its constructor, so you cannot tell what it needs by reading its signature.
4. **Thread-safety is easy to get wrong** in languages where it matters (the double-checked locking bug is a classic; in Java the fix is a \`static final\` holder class or an enum).
5. **Lifetime is unmanaged.** You cannot dispose it or scope it per request.

The better answer nearly every time: create **one instance** and inject it. You get the same "one shared object" property without global access, and your tests can pass a different one. Say it that way — "I want a single instance, not a Singleton" — and you have shown you understand the distinction.

Legitimate uses do exist: stateless caches, connection pools, loggers — things where the shared instance genuinely has no meaningful per-caller state.

## Adapter — make an incompatible interface fit

\`\`\`ts
// What our domain wants:
interface PaymentGateway {
  charge(cents: number, token: string): Promise<Receipt>;
}

// What the vendor SDK gives us (different names, different units, its own errors):
class StripeSdk {
  createCharge(opts: { amount: number; currency: string; source: string }):
    Promise<{ id: string; status: string }> { /* ... */ }
}

// The adapter translates between them — and is the ONLY file that knows Stripe exists.
class StripeGateway implements PaymentGateway {
  constructor(private readonly sdk: StripeSdk) {}

  async charge(cents: number, token: string): Promise<Receipt> {
    const res = await this.sdk.createCharge({
      amount: cents, currency: "usd", source: token,
    });
    if (res.status !== "succeeded") throw new PaymentDeclined(res.id);
    return { id: res.id, amountCents: cents };
  }
}
\`\`\`

**Use when**: integrating a third-party library or legacy code. The strategic value is containment — swapping Stripe for Adyen becomes one new file, and your tests mock *your* interface instead of guessing at the vendor's response shape.

## Decorator — add behavior by wrapping

\`\`\`ts
interface DataSource {
  read(key: string): Promise<string>;
}

class HttpDataSource implements DataSource {
  async read(key: string) { return (await fetch(\`/api/\${key}\`)).text(); }
}

// Each decorator implements the same interface and wraps another instance.
class CachingDataSource implements DataSource {
  private cache = new Map<string, string>();
  constructor(private readonly inner: DataSource) {}
  async read(key: string) {
    const hit = this.cache.get(key);
    if (hit !== undefined) return hit;
    const value = await this.inner.read(key);
    this.cache.set(key, value);
    return value;
  }
}

class LoggingDataSource implements DataSource {
  constructor(private readonly inner: DataSource) {}
  async read(key: string) {
    const start = performance.now();
    try {
      return await this.inner.read(key);
    } finally {
      logger.info({ key, ms: performance.now() - start }, "read");
    }
  }
}

// Compose freely; order is meaningful (this logs cache hits too).
const source = new LoggingDataSource(new CachingDataSource(new HttpDataSource()));
\`\`\`

**Use when**: you want to layer orthogonal concerns — caching, logging, retries, rate limiting, auth — without touching the core class or exploding into \`CachingLoggingRetryingHttpSource\` subclasses. This is composition over inheritance applied to cross-cutting behavior, and it is exactly how HTTP middleware works.

## Repository — a collection-like interface over persistence

\`\`\`ts
interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findPendingOlderThan(d: Date): Promise<Order[]>;
  save(order: Order): Promise<void>;
}
\`\`\`

**Use when**: you want domain code to express *what* it needs, not *how* it is stored. It gives you an in-memory implementation for fast tests, a single place where queries live, and the freedom to change the storage layer.

The caveat: a repository that is a thin passthrough over an ORM that is already a repository is a wasted layer. It earns its place when the interface is expressed in domain terms (\`findPendingOlderThan\`) rather than data terms (\`query(sql)\`).`,
    },
    {
      id: "coupling-cohesion",
      heading: "Coupling and cohesion",
      markdown: `These two ideas underlie every other guideline in this chapter. If you can only remember one design principle, remember: **low coupling, high cohesion.**

**Coupling** is how much one module depends on another's details. **Cohesion** is how strongly the things inside a module belong together.

\`\`\`ts
// High coupling: OrderService knows the shape of the DB row, the email
// template, AND the tax table. A change to any of the three breaks it.
class OrderService {
  place(o: Order) {
    db.query("INSERT INTO orders (id, total_cents, tax_v2) VALUES ($1,$2,$3)", [...]);
    smtp.send(o.email, "Thanks!", \`<p>You paid \${o.total / 100}</p>\`);
  }
}

// Low coupling: three named collaborators, each behind a narrow interface.
class OrderService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly taxes: TaxCalculator,
    private readonly notify: OrderNotifier,
  ) {}
  async place(o: Order) {
    const total = this.taxes.applyTo(o);
    await this.orders.save(o.withTotal(total));
    await this.notify.confirmed(o);
  }
}
\`\`\`

### Recognizing bad coupling

- **Feature envy**: a method that spends most of its time reading another object's data. The behavior belongs on that object.
- **Inappropriate intimacy**: two classes that each reach into the other's internals.
- **Train wrecks**: \`order.getCustomer().getAddress().getCountry().getTaxRate()\` — you are now coupled to four classes and any of them can break you. The **Law of Demeter** ("only talk to your immediate collaborators") says ask \`order.taxRate()\` instead.
- **Shotgun surgery**: one conceptual change forces edits in eight files. The concept is smeared across the codebase.

### Recognizing bad cohesion

- A class named \`Utils\`, \`Helpers\`, \`Manager\`, or \`Common\`. These names mean "I could not describe what this does," which is a cohesion failure by definition.
- A class where one group of methods touches fields A and B and another group touches C and D. That is two classes wearing one name.
- **Divergent change**: one file changes for many unrelated reasons — the flip side of shotgun surgery.

### Why it matters, stated plainly

Low coupling means you can change one thing without a cascade. High cohesion means when you need to change something, you can find it in one place. Every other principle here — SRP, dependency inversion, interface segregation, composition — is a specific tactic for achieving those two properties.`,
    },
    {
      id: "smells-and-refactoring",
      heading: "Code smells and the refactoring moves that fix them",
      markdown: `A smell is a surface symptom that usually indicates a deeper problem. It is not proof — it is a place to look.

| Smell | What it suggests | The move |
| --- | --- | --- |
| **Long method** | Doing several things at once | Extract Method |
| **Large class** | Multiple responsibilities | Extract Class |
| **Long parameter list** | A missing concept | Introduce Parameter Object |
| **Duplicated code** | A concept lacking a home | Extract Method / Pull Up Method |
| **Feature envy** | Behavior on the wrong class | Move Method |
| **Data clumps** | Fields that always travel together | Extract Class |
| **Primitive obsession** | Domain concepts encoded as strings/ints | Replace Primitive with Value Object |
| **Switch on type** | Missing polymorphism | Replace Conditional with Polymorphism |
| **Temporary field** | A field only set sometimes | Extract Class / rethink lifecycle |
| **Message chains** | Law of Demeter violation | Hide Delegate |
| **Speculative generality** | Abstractions built for imagined futures | Inline / Collapse Hierarchy |
| **Comments explaining *how*** | The code is not clear enough | Extract Method with a naming comment |

### The moves that matter most

**Extract Method** — the highest-value refactoring there is, because a well-named method replaces a comment with something the compiler checks:

\`\`\`ts
// Before
function checkout(cart: Cart, user: User) {
  let total = 0;
  for (const item of cart.items) total += item.price * item.qty;
  if (user.isMember) total *= 0.9;
  if (total > 5000) total -= 500;
  // ... 30 more lines
}

// After — the top-level function now reads as the business rule
function checkout(cart: Cart, user: User) {
  const subtotal = sumLineItems(cart);
  const total = applyBulkDiscount(applyMembershipDiscount(subtotal, user));
  // ...
}
\`\`\`

**Replace Primitive with Value Object** — the fix for the most common design failure in real code:

\`\`\`ts
// Before: nothing stops you swapping these two arguments.
function transfer(fromAccount: string, toAccount: string, amount: number) {}

// After: the type system enforces what the names only suggested.
class AccountId {
  private constructor(readonly value: string) {}
  static parse(raw: string): AccountId {
    if (!/^acct_[a-z0-9]{16}$/.test(raw)) throw new TypeError("bad account id");
    return new AccountId(raw);
  }
}
class Money {
  private constructor(readonly cents: number, readonly currency: Currency) {}
  static of(cents: number, currency: Currency) {
    if (!Number.isInteger(cents)) throw new TypeError("money must be integer cents");
    return new Money(cents, currency);
  }
  plus(other: Money): Money {
    if (other.currency !== this.currency) throw new CurrencyMismatch();
    return new Money(this.cents + other.cents, this.currency);
  }
}

function transfer(from: AccountId, to: AccountId, amount: Money) {}
\`\`\`

Validation now happens once, at the boundary, instead of defensively in every function. And "add USD to EUR" becomes a type error rather than a silent wrong number. \`Money\` as integer cents rather than a float is worth saying out loud too — \`0.1 + 0.2 !== 0.3\` in binary floating point, so currency should never be a \`double\`.

### How to refactor safely

1. **Have tests first.** Refactoring without tests is just editing and hoping. If there are no tests, write characterization tests that pin down current behavior — even the behavior you think is wrong.
2. **One move at a time**, running tests after each. If something breaks you know exactly which move did it.
3. **Never mix refactoring with behavior change** in the same commit. A reviewer can skim a pure rename; a rename hiding a logic change is how bugs ship.
4. **Follow the rule of three.** Duplication once is fine. Twice, note it. Three times, extract. Premature extraction of two things that merely *look* alike creates a false abstraction, and coupling two unrelated things through a shared function is worse than duplication.`,
    },
    {
      id: "immutability-and-functional",
      heading: "Immutability, pure functions, and where functional beats OOP",
      markdown: `### Pure functions

A pure function's output depends only on its inputs, and it has no side effects — no mutation of arguments, no I/O, no reading a clock or a global.

\`\`\`ts
// Impure: mutates its argument, reads a global clock, and writes a log.
function applyDiscount(order: Order): void {
  order.total = order.total * 0.9;
  order.discountedAt = new Date();
  logger.info("discount applied");
}

// Pure: same input, same output, no observable effects.
function withDiscount(order: Order, rate: number, now: Date): Order {
  return { ...order, total: order.total * (1 - rate), discountedAt: now };
}
\`\`\`

What purity buys, concretely:

- **Trivial testing.** No setup, no mocks, no teardown — call it and assert. This alone changes how much of a codebase you can afford to test well.
- **Local reasoning.** You can understand the function by reading it, without knowing what else in the program has run.
- **Safe to cache and parallelize.** Memoization is only correct for pure functions, and pure functions have no data races.
- **Time travel and replay.** Undo/redo and event sourcing fall out naturally.

### Immutability

An immutable object cannot change after construction; "modifying" it produces a new one.

\`\`\`ts
class Money {
  constructor(readonly cents: number, readonly currency: Currency) {}
  plus(other: Money): Money {
    return new Money(this.cents + other.cents, this.currency);   // new instance
  }
}

// TypeScript's readonly is compile-time only; freeze for runtime enforcement.
const CONFIG = Object.freeze({ retries: 3, timeoutMs: 5000 });
\`\`\`

Why it matters:

- **Thread safety for free.** No shared mutable state means no locks and no race conditions.
- **Safe sharing.** You can pass an immutable object anywhere without defensive copying, because no callee can corrupt it.
- **Valid map keys and set members.** Recall the Java rule: mutating a field used in \`hashCode\` while the object is a key makes the entry unreachable. Immutable keys make that impossible.
- **Cheap change detection.** Reference equality is enough — this is the entire basis of React's rendering model.
- **The invariant is checked once**, in the constructor, and holds forever.

The cost is allocation. It is usually irrelevant, and when it is not, persistent data structures (Immutable.js, Clojure's vectors) give you structural sharing so a "copy" shares most of its memory with the original.

### Where functional style wins

Not everything should be an object. Reach for a functional approach when:

- **The problem is a data transformation.** A pipeline of \`map\`/\`filter\`/\`reduce\` over a collection is clearer than a class hierarchy.
- **You are writing business rules.** \`calculateTax(order, jurisdiction)\` as a pure function is far easier to test and reason about than a \`TaxCalculator\` holding mutable state.
- **Correctness is critical.** No hidden state means far fewer places for a bug to hide.
- **You are adding operations, not types.** Recall the expression problem: if new *operations* over a fixed set of types are the common change, a pure function with a switch is easier than adding a method to every class.

### Where OOP wins

- **Real entities with identity and a lifecycle.** A \`User\` is not a value — two users with identical fields are still different users, and identity is exactly what objects model.
- **You need pluggable implementations.** Strategy, adapter, repository — interfaces plus polymorphism are the cleanest tool for swapping behavior.
- **State genuinely belongs together** and must be kept consistent. A connection pool, a game entity, a stateful parser.
- **You are adding types, not operations.** New shapes, new payment methods, new notification channels.

The mature position, and the one to give in an interview: **objects at the edges, functions in the middle.** Objects and interfaces manage state, identity, and I/O at the boundaries of the system; pure functions do the actual computation in a core that has no dependencies and is trivially testable. Almost every well-designed modern codebase looks like this, whatever it calls itself.`,
    },
    {
      id: "error-handling",
      heading: "Error handling design: exceptions vs result types",
      markdown: `Error handling is a design decision, not an afterthought, and it is a question that separates people who have maintained software from people who have only written it.

### The first distinction: expected vs exceptional

- **Expected**: a user typed an invalid email. A record was not found. A payment was declined. These are *outcomes*, part of the normal flow, and callers should be forced to handle them.
- **Exceptional**: the database connection dropped. A required config key is missing. An invariant was violated. These usually should propagate to a boundary that logs and returns a 500.

Using an exception for the first category means callers routinely forget to handle a case that will definitely happen. Using a return code for the second means the error gets ignored and the program continues in a corrupt state.

### Exceptions

\`\`\`ts
class InsufficientFunds extends Error {
  constructor(readonly shortfallCents: number) {
    super(\`short by \${shortfallCents} cents\`);
    this.name = "InsufficientFunds";
  }
}

try {
  account.withdraw(cents);
} catch (err) {
  if (err instanceof InsufficientFunds) {
    return offerOverdraft(err.shortfallCents);
  }
  throw err;                         // don't swallow what you don't understand
}
\`\`\`

Pros: the happy path stays uncluttered, errors propagate automatically without every intermediate frame handling them, and stack traces are excellent for debugging.

Cons: they are invisible in the type signature (in most languages), so you cannot tell from a function's signature what it can throw. They are a non-local goto, which makes control flow hard to follow. And they invite the worst error-handling bug there is:

\`\`\`ts
try { doThing(); } catch (e) { }                     // never do this
try { doThing(); } catch (e) { console.log(e); }     // barely better
\`\`\`

### Result types

\`\`\`ts
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

type ParseError = "empty" | "too_long" | "bad_format";

function parseEmail(raw: string): Result<Email, ParseError> {
  if (raw.length === 0) return { ok: false, error: "empty" };
  if (raw.length > 254) return { ok: false, error: "too_long" };
  if (!raw.includes("@")) return { ok: false, error: "bad_format" };
  return { ok: true, value: raw as Email };
}

const result = parseEmail(input);
if (!result.ok) {
  return badRequest(messageFor(result.error));   // compiler forces this branch
}
sendWelcome(result.value);                       // narrowed to Email here
\`\`\`

Pros: failures are in the type signature, so callers cannot forget them; the compiler enforces handling; the set of possible errors is enumerated and exhaustively checkable. This is Rust's \`Result\`, Go's \`(value, error)\`, and Haskell's \`Either\`.

Cons: verbose without language support for propagation (Rust's \`?\` operator); errors must be threaded manually through every layer, which is noise when ten frames just pass it upward.

### The pragmatic policy

1. **Result types for expected, domain-level failures** — validation, parsing, "not found," business rule violations. Make the failure part of the API.
2. **Exceptions for genuinely exceptional conditions** — infrastructure failure, bugs, violated invariants. Let them propagate to one boundary handler.
3. **Never swallow an error.** Handle it, or wrap it with context and rethrow. An empty catch block turns a crash you could have debugged into corrupt data you cannot.
4. **Add context as you rethrow**: \`throw new OrderFailed("order " + id, { cause: err })\`. The \`cause\` chain preserves the original stack while making the message useful.
5. **Fail fast.** Validate at the boundary and construct only valid objects — that is the value-object argument again. An error caught at the entry point is a 400; the same bad data caught three layers deep is a mystery.
6. **One handler at the top** — middleware or a global handler — that logs with full context and maps the error to a response. Do not scatter presentation logic through the domain.`,
    },
    {
      id: "lld-method",
      heading: "How to answer 'design a parking lot' questions",
      markdown: `Low-level design (LLD) questions — parking lot, elevator, deck of cards, vending machine, chess, library, ATM — are testing something different from system design. There is no QPS, no sharding, no CAP theorem. They want to see whether you can turn an ambiguous description into clean classes with clear responsibilities, in about 35 minutes.

### What is actually being scored

1. Did you clarify scope before designing?
2. Did you find the right nouns, and give each one a single clear job?
3. Are your interfaces sensible, and did you use an interface where extension is likely?
4. Did you handle edge cases and concurrency where it matters?
5. Can you justify a decision and discuss its alternative?

### The method

**Step 1 — Clarify (3-5 minutes). Do not skip this.** Jumping straight to classes is the most common failure. Ask:

- What are the core use cases? (park, unpark, pay — vs. reservations, memberships, EV charging)
- Scale? One lot or a chain? Concurrent users?
- What varies? (vehicle types, spot types, pricing models)
- What is out of scope? Get the interviewer to say it.

Then **state the scope back** before you write anything: "So: a single lot, multiple levels, three vehicle sizes, hourly pricing, no reservations. Concurrency matters because multiple entry gates assign spots simultaneously."

**Step 2 — Nouns and verbs.** Underline the nouns in the problem statement; those are your candidate classes. The verbs are your methods.

Parking lot: *lot, level, spot, vehicle, ticket, gate, payment, rate*. Verbs: *park, leave, pay, find a spot*.

**Step 3 — Model the core entities**, with the enums first. Prefer enums over strings, value objects over primitives.

**Step 4 — Find the axes of variation and put interfaces there.** Pricing changes → \`PricingStrategy\`. Spot assignment policy changes → \`SpotAssignmentStrategy\`. Payment method changes → \`PaymentProcessor\`. That is where the interviewer's follow-up questions will land, and pre-empting them is exactly the signal you want.

**Step 5 — Write the main flows** as methods on a coordinating service, and say out loud where the concurrency is.

**Step 6 — Discuss extensions**: what breaks with monthly passes? Multiple lots? Reservations? A good answer here is what turns a passing grade into a strong one.

### Things that separate strong answers

- **Enums, not strings**, for closed sets. \`SpotSize.COMPACT\`, not \`"compact"\`.
- **Money as integer cents**, never a float.
- **A strategy interface for pricing**, always. Every one of these problems eventually asks "what if weekend rates differ."
- **Say where the race condition is.** Two cars arriving at once must not get the same spot. Naming the atomic operation — a compare-and-set on the spot's status, or a transaction — is a strong signal, and most candidates never mention it.
- **Prefer composition.** \`Vehicle\` with a \`size\` field beats \`Car extends Vehicle\`, \`Motorcycle extends Vehicle\` when the only difference is one value.
- **Do not gold-plate.** A \`ParkingLotFactoryBuilderProvider\` reads as pattern-fluent but design-naive.`,
    },
    {
      id: "lld-worked-example",
      heading: "Worked example: parking lot, in full",
      markdown: `Scope agreed with the interviewer: one lot, multiple levels, three vehicle sizes, spot-size-based fit, hourly pricing with a pluggable rate, cash/card payment, concurrent entry gates. No reservations, no monthly passes (discussed at the end).

### Value objects and enums

\`\`\`ts
export enum VehicleSize {
  MOTORCYCLE = 0,
  COMPACT = 1,
  LARGE = 2,
}

export enum SpotSize {
  MOTORCYCLE = 0,
  COMPACT = 1,
  LARGE = 2,
}

/** Integer cents. Never use a float for currency. */
export class Money {
  private constructor(readonly cents: number) {}

  static fromCents(cents: number): Money {
    if (!Number.isInteger(cents) || cents < 0) {
      throw new RangeError("money must be a non-negative integer number of cents");
    }
    return new Money(cents);
  }

  plus(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  times(n: number): Money {
    return Money.fromCents(Math.round(this.cents * n));
  }
}
\`\`\`

### Entities

\`\`\`ts
export class Vehicle {
  constructor(
    readonly licensePlate: string,
    readonly size: VehicleSize,
  ) {}
}

export enum SpotStatus {
  FREE = "FREE",
  OCCUPIED = "OCCUPIED",
  OUT_OF_SERVICE = "OUT_OF_SERVICE",
}

export class ParkingSpot {
  private status: SpotStatus = SpotStatus.FREE;
  private vehicle: Vehicle | null = null;

  constructor(
    readonly id: string,
    readonly levelNumber: number,
    readonly size: SpotSize,
  ) {}

  /** A vehicle fits a spot of its own size or larger. */
  fits(vehicle: Vehicle): boolean {
    return (this.size as number) >= (vehicle.size as number);
  }

  isFree(): boolean {
    return this.status === SpotStatus.FREE;
  }

  /**
   * Returns false if the spot was taken between the search and this call.
   * The caller MUST treat false as "try another spot" — this is the
   * check-and-set that makes concurrent gates safe.
   */
  tryOccupy(vehicle: Vehicle): boolean {
    if (this.status !== SpotStatus.FREE) return false;
    if (!this.fits(vehicle)) return false;
    this.status = SpotStatus.OCCUPIED;
    this.vehicle = vehicle;
    return true;
  }

  release(): void {
    this.status = SpotStatus.FREE;
    this.vehicle = null;
  }

  occupiedBy(): Vehicle | null {
    return this.vehicle;
  }
}
\`\`\`

### The ticket

\`\`\`ts
export class Ticket {
  private exitAt: Date | null = null;

  constructor(
    readonly id: string,
    readonly vehicle: Vehicle,
    readonly spotId: string,
    readonly entryAt: Date,
  ) {}

  close(at: Date): void {
    if (this.exitAt) throw new Error(\`ticket \${this.id} already closed\`);
    this.exitAt = at;
  }

  isClosed(): boolean {
    return this.exitAt !== null;
  }

  durationMinutes(now: Date): number {
    const end = this.exitAt ?? now;
    return Math.ceil((end.getTime() - this.entryAt.getTime()) / 60_000);
  }
}
\`\`\`

### The two strategy interfaces — the axes of variation

\`\`\`ts
export interface PricingStrategy {
  priceFor(ticket: Ticket, now: Date): Money;
}

/** First hour flat, then per started hour. */
export class HourlyPricing implements PricingStrategy {
  constructor(
    private readonly firstHour: Money,
    private readonly perAdditionalHour: Money,
  ) {}

  priceFor(ticket: Ticket, now: Date): Money {
    const hours = Math.max(1, Math.ceil(ticket.durationMinutes(now) / 60));
    return this.firstHour.plus(this.perAdditionalHour.times(hours - 1));
  }
}

/** Everything after the daily cap is free. Added without touching anything else. */
export class CappedPricing implements PricingStrategy {
  constructor(
    private readonly inner: PricingStrategy,
    private readonly dailyCap: Money,
  ) {}

  priceFor(ticket: Ticket, now: Date): Money {
    const base = this.inner.priceFor(ticket, now);
    return base.cents <= this.dailyCap.cents ? base : this.dailyCap;
  }
}

export interface SpotAssignmentStrategy {
  choose(spots: readonly ParkingSpot[], vehicle: Vehicle): ParkingSpot | null;
}

/** Smallest spot the vehicle fits in, so large spots stay available. */
export class BestFitAssignment implements SpotAssignmentStrategy {
  choose(spots: readonly ParkingSpot[], vehicle: Vehicle): ParkingSpot | null {
    let best: ParkingSpot | null = null;
    for (const spot of spots) {
      if (!spot.isFree() || !spot.fits(vehicle)) continue;
      if (best === null || (spot.size as number) < (best.size as number)) best = spot;
    }
    return best;
  }
}
\`\`\`

Note that \`CappedPricing\` is a **decorator** over \`PricingStrategy\` — that composition is the answer to "what if we add a daily maximum," and it costs zero changes to existing code.

### Level and lot

\`\`\`ts
export class Level {
  constructor(
    readonly number: number,
    private readonly spots: readonly ParkingSpot[],
  ) {}

  freeSpots(): readonly ParkingSpot[] {
    return this.spots.filter((s) => s.isFree());
  }

  freeCount(size: SpotSize): number {
    return this.spots.filter((s) => s.isFree() && s.size === size).length;
  }
}

export class LotFullError extends Error {
  constructor(size: VehicleSize) {
    super(\`no free spot for vehicle size \${VehicleSize[size]}\`);
    this.name = "LotFullError";
  }
}

export class ParkingLot {
  private readonly activeTickets = new Map<string, Ticket>();
  private readonly spotsById = new Map<string, ParkingSpot>();
  private nextTicketNumber = 1;

  constructor(
    private readonly levels: readonly Level[],
    private readonly assignment: SpotAssignmentStrategy,
    private readonly pricing: PricingStrategy,
    private readonly clock: () => Date = () => new Date(),
  ) {
    for (const level of levels) {
      for (const spot of level.freeSpots()) this.spotsById.set(spot.id, spot);
    }
  }

  /**
   * Retries on lost races: another gate may claim the chosen spot between
   * choose() and tryOccupy(). In a real system this is a DB transaction or
   * a compare-and-set; the retry loop is the same shape either way.
   */
  park(vehicle: Vehicle): Ticket {
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidates = this.levels.flatMap((l) => [...l.freeSpots()]);
      const spot = this.assignment.choose(candidates, vehicle);
      if (spot === null) throw new LotFullError(vehicle.size);

      if (!spot.tryOccupy(vehicle)) continue;   // lost the race; pick again

      const ticket = new Ticket(
        \`T-\${this.nextTicketNumber++}\`,
        vehicle,
        spot.id,
        this.clock(),
      );
      this.activeTickets.set(ticket.id, ticket);
      return ticket;
    }
    throw new LotFullError(vehicle.size);
  }

  /** Quote the price without ending the stay — needed by pay-on-foot kiosks. */
  quote(ticketId: string): Money {
    const ticket = this.requireActive(ticketId);
    return this.pricing.priceFor(ticket, this.clock());
  }

  /** Free the spot only after payment succeeds. Order matters. */
  leave(ticketId: string, processor: PaymentProcessor): Money {
    const now = this.clock();
    const ticket = this.requireActive(ticketId);
    const amount = this.pricing.priceFor(ticket, now);

    processor.charge(amount);        // throws PaymentDeclined on failure

    ticket.close(now);
    this.spotsById.get(ticket.spotId)?.release();
    this.activeTickets.delete(ticketId);
    return amount;
  }

  availability(size: SpotSize): number {
    return this.levels.reduce((n, l) => n + l.freeCount(size), 0);
  }

  private requireActive(ticketId: string): Ticket {
    const ticket = this.activeTickets.get(ticketId);
    if (!ticket) throw new Error(\`unknown or already-closed ticket \${ticketId}\`);
    return ticket;
  }
}

export interface PaymentProcessor {
  charge(amount: Money): void;
}
\`\`\`

### Wiring it up

\`\`\`ts
const lot = new ParkingLot(
  levels,
  new BestFitAssignment(),
  new CappedPricing(
    new HourlyPricing(Money.fromCents(300), Money.fromCents(200)),
    Money.fromCents(2500),
  ),
);

const ticket = lot.park(new Vehicle("7ABC123", VehicleSize.COMPACT));
// ... later ...
const paid = lot.leave(ticket.id, cardProcessor);
\`\`\`

### The decisions worth defending out loud

- **\`clock\` is injected**, so pricing is testable without waiting three hours. Never call \`new Date()\` deep inside logic you want to test.
- **\`tryOccupy\` returns a boolean rather than throwing**, because losing a race is an expected outcome, not an exceptional one — that is the error-handling principle applied.
- **\`Vehicle\` has a \`size\` field instead of \`Car\`/\`Motorcycle\` subclasses**, because the only variation is one value. Subclasses would be inheritance for its own sake.
- **Payment happens before the spot is released.** If it happened after, a declined card would leave the barrier open. Say why the order matters.
- **Pricing and assignment are interfaces**, so weekend rates, EV surcharges, and "park near the elevator" are new classes rather than edits.

### Extensions to raise before the interviewer does

- **Monthly passes**: a \`Subscription\` and a \`SubscriptionPricing\` decorator returning \`Money.fromCents(0)\` for valid passes.
- **Reservations**: spots need a \`RESERVED\` status and a hold with an expiry; \`BestFitAssignment\` must skip held spots.
- **Multiple lots**: \`ParkingLot\` becomes an aggregate behind a \`LotRegistry\`; \`Ticket\` gains a \`lotId\`.
- **Persistence**: \`activeTickets\` and spot status move behind a \`TicketRepository\` and a \`SpotRepository\`, and \`tryOccupy\` becomes \`UPDATE spots SET status='OCCUPIED' WHERE id=$1 AND status='FREE'\` — the same compare-and-set, enforced by the database.
- **Lost ticket**: a flat penalty rate, which is just another \`PricingStrategy\`.`,
    },
    {
      id: "other-lld-problems",
      heading: "Applying the method to the other classic LLD problems",
      markdown: `The same six steps, sketched for the problems you are most likely to be handed.

### Deck of cards

Nouns: \`Suit\` and \`Rank\` (enums), \`Card\` (immutable value object), \`Deck\`, \`Shoe\` (multiple decks, as in blackjack), \`Hand\`, \`Game\`.

\`\`\`ts
enum Suit { HEARTS, DIAMONDS, CLUBS, SPADES }
enum Rank { TWO = 2, THREE, /* ... */ JACK = 11, QUEEN, KING, ACE }

class Card {
  constructor(readonly rank: Rank, readonly suit: Suit) {}   // immutable
}

class Deck {
  private cards: Card[] = [];
  private dealt = 0;

  constructor(private readonly rng: () => number = Math.random) {
    for (const suit of [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES]) {
      for (let r = Rank.TWO; r <= Rank.ACE; r++) this.cards.push(new Card(r, suit));
    }
  }

  /** Fisher-Yates: each permutation equally likely, O(n). */
  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    this.dealt = 0;
  }

  deal(): Card {
    if (this.dealt >= this.cards.length) throw new Error("deck exhausted");
    return this.cards[this.dealt++];
  }

  remaining(): number { return this.cards.length - this.dealt; }
}
\`\`\`

The two points interviewers look for: **the shuffle must be Fisher-Yates** (the naive "sort by random" is biased, and \`swap with any index\` rather than \`any remaining index\` is the classic off-by-one that skews the distribution), and the **RNG is injected** so tests are deterministic. Then: keep \`Deck\` game-agnostic and put scoring in a \`BlackjackHand\` or \`PokerHand\`, because rank values differ per game (an ace is 1 or 11 in blackjack, always high in poker).

### Elevator system

Nouns: \`Elevator\`, \`Request\` (with \`sourceFloor\`, \`direction\` for a hall call vs \`destinationFloor\` for a car call), \`ElevatorController\`, \`SchedulingStrategy\`.

The design decisions:

- \`Elevator\` holds \`currentFloor\`, \`Direction\` (UP / DOWN / IDLE), \`DoorState\`, and a **sorted set of stops** — not a queue, because you serve floors in travel order, not request order.
- \`SchedulingStrategy\` is the axis of variation: \`NearestCar\`, \`SCAN\` (the elevator algorithm — keep going in one direction, serving stops, then reverse), \`FCFS\` for a baseline. Being able to name SCAN and note it is the same idea as a disk-arm scheduler is a genuinely strong moment.
- The state machine matters: IDLE → MOVING → DOOR_OPENING → DOOR_OPEN → DOOR_CLOSING → IDLE. Draw it.
- Edge cases to raise: door obstruction, overload sensor, emergency stop, a hall call arriving for a floor you are about to pass.

### Vending machine

This one is really a **state machine**, and the expected answer is the State pattern.

States: \`Idle\`, \`HasMoney\`, \`Dispensing\`, \`OutOfStock\`. Each state class implements \`insertCoin\`, \`selectItem\`, \`dispense\`, \`refund\`, and returns the next state. That is much cleaner than a nested switch over \`(state, event)\`, and adding a state does not touch the others.

Details that earn credit: money in integer cents, a change-making algorithm that is greedy over available denominations *and* checks it can actually make change before accepting the sale, and an inventory check before taking money rather than after.

### Chess

Nouns: \`Board\` (8×8 of \`Square\`), \`Piece\` (abstract, with \`Pawn\`/\`Knight\`/... subclasses — this is a rare case where inheritance genuinely fits, since movement rules differ fundamentally per type), \`Move\`, \`Player\`, \`Game\`.

- \`Piece.legalMoves(board, from)\` is the polymorphic core: each piece type answers for itself, and \`Game\` never switches on type.
- Represent a move as a **value object** with enough information to undo it (piece moved, piece captured, castling rights before, en passant square before). That is what makes move/undo — and therefore any search — possible.
- The special rules are where candidates fall down, so name them proactively: castling, en passant, promotion, and the fact that a legal move must not leave your own king in check, which means "generate pseudo-legal moves, then filter by simulating."

### General reminders

- **Draw the class diagram** even roughly. Boxes with names and arrows for relationships communicate faster than talking.
- **Write real method signatures** with types. "It has a park method" is much weaker than \`park(vehicle: Vehicle): Ticket\`.
- **Say the tradeoff out loud** whenever you make a choice. "I'm using best-fit rather than first-fit so large spots stay available for large vehicles; first-fit is faster but wastes big spots" is worth more than either choice alone.`,
    },
  ],
  questions: [
    {
      q: "Explain encapsulation. Is a class with getters and setters for every field encapsulated?",
      a: "No — that's a struct with extra typing. Encapsulation isn't about hiding fields for its own sake; it's about the object owning its invariants. If an Account guarantees the balance is never negative, the only way to actually guarantee that is to make it unreachable from outside: a private balance, plus deposit and withdraw methods that enforce the rule. Then when the balance is wrong, there are two places to look instead of every line in the codebase that touches `.balance`. A getter/setter pair for every field re-exposes exactly the mutation you were trying to control, so no invariant is protected. The real principle is expose behavior, not data — the methods should express what callers want to do, not give them raw access to state.",
      weak: "Encapsulation means making fields private and providing getters and setters to access them safely.",
    },
    {
      q: "Why prefer composition over inheritance? Give me a concrete example.",
      a: "Inheritance forces a single axis of variation onto a domain that usually has several. Take employees: pay model, approval authority, and reporting structure vary independently. With inheritance you need SalariedManager, ContractorApprover, SalariedTechLead — the combinations multiply, that's class explosion. And you can't change class at runtime, so 'contractor converts to full-time' is impossible to model; you have to construct a new object and fix up every reference. With composition, a Person holds a Compensation and an ApprovalPolicy. New combinations are new objects, not new classes, so it's n + m classes instead of n × m. Conversion is just assigning a new component. Each policy is testable in three lines. Inheritance also gives you the tightest coupling available — a subclass depends on the parent's internals, so a change inside the parent breaks subclasses that never touched that code. My rule is inheritance for is-a, composition for has-a or behaves-like, and when in doubt compose, because you can always extract a base class later but unwinding a deep hierarchy is a rewrite.",
    },
    {
      q: "What is the Liskov Substitution Principle? Give a violation.",
      a: "A subtype must be usable anywhere its supertype is expected, with no caller needing to know the difference. The classic violation is Square extending Rectangle. Geometrically a square is a rectangle, but a *mutable* square isn't a substitutable mutable rectangle: Rectangle's contract implies width and height are independent, so a caller can setWidth(5), setHeight(4), and expect area 20 — and a Square that keeps itself square returns 16. The subclass broke an assumption the caller was entitled to make. The fix is to drop the inheritance and make both immutable implementations of a Shape interface with an area method; with no setters there's no contradictory invariant. The practical smells for LSP violations: a subclass that throws UnsupportedOperationException, silently ignores a call, tightens a precondition, or forces callers to write instanceof checks. That last one is the giveaway — if callers need to know the concrete type, substitutability is already gone.",
    },
    {
      q: "What does the Dependency Inversion Principle actually mean? Isn't it just dependency injection?",
      a: "They're related but not the same, and the difference is the interesting part. Injection is a mechanism — passing a dependency in rather than constructing it. Inversion is about which module *owns the interface*. Normally high-level policy depends on low-level detail: OrderService imports PostgresClient, so the business rules point at the database. Inversion means OrderService defines an OrderRepository interface in the domain layer, expressed in terms of what the domain needs, and PostgresOrderRepository in the infrastructure layer implements it. Now the arrow points the other way — the detail depends on the policy. You can inject something and still not have inverted anything: if the interface lives in the database package and just describes what Postgres can do, you have injection without inversion, and your domain is still coupled to the storage model. The practical payoff is an in-memory implementation for fast tests and the freedom to change storage without touching business logic.",
      weak: "It means you should inject your dependencies through the constructor instead of creating them with new.",
    },
    {
      q: "Why is Singleton often considered an anti-pattern?",
      a: "Five reasons. It's global mutable state in a costume — anything anywhere can reach it, so you can't reason locally about what changes it. It destroys testability, since tests share the one instance, leak state into each other, and become order-dependent, usually with no clean way to substitute a double. It hides dependencies: a class calling Config.getInstance() has a dependency that doesn't appear in its constructor, so you can't tell what it needs from its signature. Thread-safety is easy to get wrong where it matters — double-checked locking is a famous bug, and in Java the right answers are a static holder class or an enum. And the lifetime is unmanaged: you can't dispose it or scope it per request. The better answer nearly always is 'I want a single instance, not a Singleton' — create one at the composition root and inject it. Same shared-object property, no global access, and tests can pass a different one. There are legitimate cases: stateless caches, connection pools, loggers, where there's no meaningful per-caller state.",
    },
    {
      q: "When would you use the Strategy pattern? How is it different from just using an if/else?",
      a: "You use it when an if/else or switch is selecting between interchangeable algorithms and that set keeps growing — shipping cost calculations, pricing rules, sort orders, compression schemes. The difference is what happens when you add the sixth option. With a switch you reopen and re-test a working method every time, risking regressions in the five cases that already worked; with Strategy you add a class and touch nothing existing. It also lets you swap behavior at runtime and test each algorithm in isolation without constructing the surrounding object. It's the concrete mechanism behind the open/closed principle. The honest caveat is that it only pays off along the axis you predicted: if the next change is 'every strategy needs a refund method,' you now edit every implementation, so you were closed for the wrong thing. That's why I'd apply it after seeing the change happen twice, not speculatively — two branches that will never grow are better as an if/else than as three files.",
    },
    {
      q: "Explain coupling and cohesion.",
      a: "Coupling is how much one module depends on another's details; cohesion is how strongly the things inside a module belong together. You want low coupling and high cohesion, and honestly every other principle here is a tactic for getting there. High coupling shows up as feature envy — a method that mostly reads another object's data — inappropriate intimacy, train wrecks like order.getCustomer().getAddress().getCountry() where you're now coupled to four classes, and shotgun surgery, where one conceptual change forces edits in eight files. Low cohesion shows up as classes named Utils, Helpers, or Manager, which literally mean 'I couldn't describe what this does,' and as classes where one set of methods touches fields A and B while another set touches C and D — that's two classes sharing a name. Stated plainly: low coupling means you can change one thing without a cascade; high cohesion means when you need to change something, you can find it in one place.",
    },
    {
      q: "What's a code smell? Name a few and how you'd fix them.",
      a: "A surface symptom that usually indicates a deeper design problem — it's a place to look, not proof of a bug. Long method: it's doing several things, so extract methods with names that replace the comments. Primitive obsession: domain concepts encoded as strings and ints, so `transfer(from: string, to: string, amount: number)` lets you silently swap arguments — replace with value objects like AccountId and Money, which moves validation to one boundary and makes 'add USD to EUR' a type error. Switch on type: that's missing polymorphism, replace the conditional with a method on each type. Feature envy: move the method to the class whose data it uses. Data clumps: fields that always travel together want to be a class. And speculative generality — abstractions built for imagined futures — where the fix is deletion. On process: I refactor only with tests in place, one move at a time, and never mix a refactor with a behavior change in the same commit, because a reviewer can skim a pure rename but a rename hiding a logic change is how bugs ship.",
    },
    {
      q: "Why does immutability matter?",
      a: "Several concrete payoffs. Thread safety for free — nothing can change, so there are no races and no locks. Safe sharing: you can hand an immutable object to anything without a defensive copy, because no callee can corrupt it. Valid hash keys: mutating a field used in hashCode while an object is a map key makes the entry permanently unreachable, and immutability makes that impossible. Cheap change detection, since reference equality is enough — that's the whole basis of React's rendering model. And the invariant is checked once in the constructor and holds forever, instead of being re-checked defensively everywhere. The cost is allocation, which is usually irrelevant; when it isn't, persistent data structures give you structural sharing so a 'copy' shares most of its memory. In TypeScript, `readonly` is compile-time only, so `Object.freeze` is the runtime enforcement.",
    },
    {
      q: "When is a functional style better than OOP?",
      a: "When the problem is a data transformation, when you're writing business rules, when correctness is critical, and when the common change is adding *operations* rather than types. A pure function — output depends only on inputs, no side effects — is trivially testable with no mocks or setup, can be reasoned about locally, and is safe to cache and parallelize. OOP wins when you have real entities with identity and a lifecycle, where two objects with identical fields are still different things; when you need pluggable implementations via interfaces; when state genuinely belongs together and must stay consistent; and when the common change is adding types. That's the expression problem: OO makes adding types easy and operations hard, functional style makes operations easy and types hard. The position I'd actually argue for is objects at the edges, functions in the middle — objects and interfaces manage state, identity, and I/O at the boundaries; pure functions do the computation in a dependency-free, trivially testable core.",
    },
    {
      q: "Exceptions or result types?",
      a: "Both, split by whether the failure is expected or exceptional. Expected failures — invalid input, not found, payment declined — are outcomes in the normal flow, and callers should be forced to handle them, so a Result type is right: the failure appears in the signature, the compiler enforces the branch, and the error set is exhaustively checkable. Exceptional conditions — a dropped database connection, a missing config key, a violated invariant — should be exceptions that propagate to a single boundary handler that logs and returns a 500. Getting it backwards is the problem: an exception for an expected case means callers routinely forget something that will definitely happen; a return code for a real failure means it gets ignored and the program continues corrupt. Whichever you use, never swallow an error — an empty catch turns a crash you could have debugged into corrupt data you can't. Wrap and rethrow with context using the `cause` chain so you keep the original stack, and validate at the boundary so failures happen where the context still exists.",
      weak: "I'd use exceptions because that's what the language provides and it keeps the happy path clean.",
    },
    {
      q: "Design a parking lot. How do you start?",
      a: "I'd spend the first three minutes clarifying before writing anything, because jumping to classes is the common failure. What are the core use cases — park, unpark, pay, versus reservations and monthly passes? One lot or a chain? Do multiple gates operate concurrently? What varies: vehicle types, spot types, pricing models? Then I'd state the scope back so we agree. Next I'd pull the nouns out of the problem — lot, level, spot, vehicle, ticket, gate, payment, rate — and the verbs become methods. I'd model entities with enums rather than strings and money as integer cents. Then the key step: find the axes of variation and put interfaces there. Pricing definitely varies, so PricingStrategy. Spot assignment varies — best-fit versus first-fit versus nearest-to-elevator — so SpotAssignmentStrategy. Those are exactly where the follow-up questions will land. Then I'd write the main flows and call out the concurrency: two gates must not assign the same spot, so occupying a spot is a compare-and-set that can fail and be retried, which becomes a conditional UPDATE with a WHERE status='FREE' once it's in a database. Most candidates never mention that race, so naming it is worth real credit.",
    },
    {
      q: "In your parking lot design, why is the price calculated before the spot is released?",
      a: "Ordering around side effects is a design decision. The sequence has to be: compute the price, charge the card, and only then close the ticket and release the spot. If you release the spot first and the payment is declined, the barrier opens and the car leaves without paying — you've made the irreversible change before confirming the reversible one. It's the same reasoning as doing the fallible thing first in any transaction. Related choices I'd defend: the clock is injected as a function so pricing is testable without waiting three hours — never call `new Date()` deep inside logic you want to test; `tryOccupy` returns a boolean rather than throwing, because losing a race for a spot is an expected outcome, not an exceptional one; and Vehicle has a size field rather than Car and Motorcycle subclasses, because the only difference is one value, so subclassing would be inheritance for its own sake.",
    },
    {
      q: "How would you shuffle a deck of cards?",
      a: "Fisher-Yates, and I'd inject the RNG. Iterate from the last index down to 1, pick j uniformly in [0, i], and swap positions i and j. That's O(n), in place, and every permutation is equally likely. Two things interviewers watch for: picking j from the full range [0, n-1] instead of [0, i] is the classic bug — it produces a biased distribution that looks random but isn't — and 'sort by a random comparator' is also biased and, in some engines, undefined behavior since the comparator isn't consistent. Injecting the RNG matters because otherwise the shuffle can't be tested deterministically. I'd also keep Deck game-agnostic: Card is an immutable value object of rank and suit, and scoring goes in a BlackjackHand or PokerHand, because rank values are game-specific — an ace is 1 or 11 in blackjack and always high in poker. Baking scoring into Card would couple a general structure to one game.",
    },
    {
      q: "What's the Decorator pattern and when would you use it over inheritance?",
      a: "A decorator implements the same interface as the thing it wraps and holds an instance of it, adding behavior before or after delegating. You use it for orthogonal cross-cutting concerns — caching, logging, retries, rate limiting, auth — layered over a core implementation. Over inheritance, the win is combinatorial: with subclasses you'd need CachingLoggingRetryingHttpSource and every other combination, whereas decorators compose at runtime, so three decorators give you every ordering for free. It's also the answer to 'add a daily price cap' in the parking lot: a CappedPricing wrapping any PricingStrategy, with zero changes to existing code. Two things to be careful about: order is meaningful — logging outside caching logs cache hits, logging inside doesn't — and a deep stack of decorators makes stack traces and debugging harder. It's the same idea as HTTP middleware, which is the most familiar example most people have already used.",
    },
    {
      q: "How do you decide when to introduce an abstraction versus keeping code concrete?",
      a: "Every abstraction is a bet that the implementation will change, and it's not free — an interface with exactly one implementation that never gets a second is pure indirection, making the code harder to read and nothing easier to change. So I default to concrete and abstract when I have evidence. The rule of three is the practical guide: duplication once is fine, twice you note it, three times you extract. Premature extraction of two things that merely look alike creates a false abstraction, and coupling two unrelated concepts through a shared function is worse than the duplication it replaced — the next change makes one caller need a flag, then another, and you get a function with four booleans. The signals that justify abstracting are: you actually have the second implementation, you need a test double at a boundary like the database or a payment gateway, or you've now edited the same switch statement three times. 'Speculative generality' is in the standard code-smell catalogue for a reason — the fix for it is deletion.",
    },
  ],
};
