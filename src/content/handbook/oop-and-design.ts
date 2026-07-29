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

The definition ("bundling data with methods, hiding internals") misses the point. The point is that an object is responsible for staying in a valid state, and the only way to guarantee that is to make invalid states unreachable through the API callers actually use.

\`\`\`python
# No encapsulation: every caller can corrupt the balance.
class Account:
    def __init__(self) -> None:
        self.balance_cents = 0


account.balance_cents = -5_000        # nothing stopped this


# Encapsulated: the invariant "balance >= 0" is enforced in one place.
class Account:
    def __init__(self) -> None:
        self._balance_cents = 0       # leading _ means "not part of the API"

    @property
    def balance_cents(self) -> int:
        return self._balance_cents    # read-only: no setter exists

    def deposit(self, cents: int) -> None:
        if cents <= 0:
            raise ValueError("deposit must be positive")
        self._balance_cents += cents

    def withdraw(self, cents: int) -> None:
        if cents > self._balance_cents:
            raise InsufficientFunds(shortfall_cents=cents - self._balance_cents)
        self._balance_cents -= cents
\`\`\`

The payoff: when the balance goes wrong, there are exactly two places to look. Without encapsulation, the suspect list is every line in the codebase that touches \`.balance_cents\`.

Be accurate about what Python enforces here, because interviewers coming from Java will probe it. **Python has no \`private\`.** A leading underscore is a convention meaning "not part of the public API"; nothing physically stops \`account._balance_cents = -5000\`. Double underscores only trigger *name mangling* (\`__x\` becomes \`_Account__x\`), which exists to avoid accidental collisions in subclasses, not to enforce access. So encapsulation in Python is about what the class *offers* — a \`deposit\`/\`withdraw\` vocabulary — rather than what the language forbids. That is enough, because the goal was never to defeat a determined caller; it was to make the invariant's owner obvious and give the reviewer one place to look.

The failure mode to name: **a class with a getter and setter for every field is not encapsulated.** It is a struct with extra typing. Encapsulation means exposing *behavior*, not fields. Python makes this easy to get right: start with a plain public attribute, and promote it to a \`@property\` only when access genuinely needs behavior — validation, laziness, a computed value. Because a property is source-compatible with an attribute, that change costs callers nothing, which is exactly why the pre-emptive Java-style getter pair is pure waste in Python.

### Abstraction — a stable contract over a changeable implementation

Abstraction is about what callers are allowed to depend on. \`repository.find_user(user_id)\` lets you swap Postgres for a cache for an HTTP call without touching a single caller.

The cost, which candidates rarely mention: **every abstraction is a bet that the implementation will change.** A \`Protocol\` with exactly one implementation, that never gets a second, is pure indirection — it makes the code harder to read and nothing easier to change. Do not abstract speculatively; abstract when you have the second implementation or a concrete reason to expect it.

### Inheritance — shared implementation via an is-a relationship

Inheritance is the most overused and most dangerous of the four. It creates the tightest coupling available in an object-oriented language: a subclass depends on the *internals* of its parent, so a change inside the parent can break a subclass that never touched that code. This is the "fragile base class" problem.

The test is not "does this share code." It is **Liskov substitution**: can every instance of the subclass be used anywhere the parent is expected, with no caller having to know the difference? If a caller needs a type check, the hierarchy is wrong.

### Polymorphism — one call site, many behaviors

This is the pillar that actually earns its keep, because it is how you delete conditionals:

\`\`\`python
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Protocol, assert_never


# Every new shape means editing this function. It grows forever.
@dataclass(frozen=True)
class CircleData:
    radius: float


@dataclass(frozen=True)
class SquareData:
    side: float


ShapeData = CircleData | SquareData


def area_of(shape: ShapeData) -> float:
    match shape:
        case CircleData(radius=r):
            return math.pi * r**2
        case SquareData(side=s):
            return s**2
        case _:
            assert_never(shape)


# Each shape owns its own answer. Adding a shape touches no existing code.
class Shape(Protocol):
    def area(self) -> float: ...


@dataclass(frozen=True)
class Circle:
    radius: float

    def area(self) -> float:
        return math.pi * self.radius**2


@dataclass(frozen=True)
class Square:
    side: float

    def area(self) -> float:
        return self.side**2


total = sum(shape.area() for shape in shapes)
\`\`\`

Note that \`Circle\` and \`Square\` never mention \`Shape\`. \`typing.Protocol\` is **structural**: conformance is decided by shape, checked statically by mypy or pyright, so you can make a third-party class satisfy your protocol without touching it. Use \`abc.ABC\` with \`@abstractmethod\` instead when you want the opposite properties — a **nominal** relationship the runtime enforces (instantiating an incomplete subclass raises \`TypeError\`), or shared implementation to inherit. The rule of thumb: **\`Protocol\` for "anything shaped like this," \`ABC\` for "everything in this family, and here is the code they share."**

The honest caveat cuts both ways here. The \`match\` version has a real advantage: add a variant and \`assert_never\` makes the type checker flag *every* function that needs updating, whereas the polymorphic version can silently miss a required method if you add an *operation* rather than a *type*. This is the **expression problem**: OO makes adding types easy and adding operations hard; functional/match style makes adding operations easy and adding types hard. Naming that tradeoff is a strong senior-level signal. (Python's caveat-on-the-caveat: exhaustiveness is checked by the type checker, never at runtime — at runtime a missing \`case\` just falls through, so keep the \`case _\` arm.)`,
    },
    {
      id: "composition-over-inheritance",
      heading: "Composition over inheritance: a concrete refactor",
      markdown: `The advice is famous; the reasoning usually is not. Here is the failure in full.

### The inheritance version

We are modeling employees. Managers are employees who also approve expenses.

\`\`\`python
from __future__ import annotations


class Employee:
    def __init__(self, name: str, salary_cents: int) -> None:
        self.name = name
        self._salary_cents = salary_cents

    def monthly_pay_cents(self) -> int:
        return round(self._salary_cents / 12)


class Manager(Employee):
    def approve(self, expense: Expense) -> None:
        expense.approved_by = self.name
\`\`\`

Fine so far. Then reality arrives:

- Contractors get paid hourly, not monthly.
- Some contractors approve expenses.
- Interns have a mentor and cannot approve anything.
- A tech lead codes *and* manages.
- Someone converts from contractor to full-time — the same person, a different class.

Every one of these needs a new subclass, and the combinations multiply: \`SalariedManager\`, \`ContractorApprover\`, \`SalariedTechLead\`. This is the **class explosion**. Worse, the last bullet is impossible to model well. Python will technically let you reassign \`person.__class__\`, which is exactly the kind of trick that proves the design is wrong: you are mutating an object's identity to work around a hierarchy that mismatched the domain.

The deeper problem is that inheritance forced a **single** axis of variation (what kind of person you are) onto a domain that has **several independent** axes (how you are paid, what you can approve, who you report to).

### The composition version

Model each axis as its own thing, and let a person hold them.

\`\`\`python
from __future__ import annotations

from typing import Protocol


# --- Axis 1: compensation ---------------------------------------------
class Compensation(Protocol):
    def monthly_pay_cents(self, period: Period) -> int: ...


class Salaried:
    def __init__(self, annual_cents: int) -> None:
        self._annual_cents = annual_cents

    def monthly_pay_cents(self, period: Period) -> int:
        return round(self._annual_cents / 12)


class Hourly:
    def __init__(self, rate_cents: int) -> None:
        self._rate_cents = rate_cents

    def monthly_pay_cents(self, period: Period) -> int:
        return self._rate_cents * period.hours_worked


# --- Axis 2: approval authority ---------------------------------------
class ApprovalPolicy(Protocol):
    def can_approve(self, expense: Expense) -> bool: ...


class NoApproval:
    def can_approve(self, expense: Expense) -> bool:
        return False


class LimitedApproval:
    def __init__(self, limit_cents: int) -> None:
        self._limit_cents = limit_cents

    def can_approve(self, expense: Expense) -> bool:
        return expense.amount_cents <= self._limit_cents


# --- The person holds one of each -------------------------------------
class Person:
    def __init__(
        self,
        name: str,
        compensation: Compensation,
        approval: ApprovalPolicy,
    ) -> None:
        self.name = name
        self._compensation = compensation
        self._approval = approval

    def pay_for(self, period: Period) -> int:
        return self._compensation.monthly_pay_cents(period)

    def can_approve(self, expense: Expense) -> bool:
        return self._approval.can_approve(expense)

    # The thing inheritance could not do at all:
    def convert_to_salaried(self, annual_cents: int) -> None:
        self._compensation = Salaried(annual_cents)


intern = Person("Sam", Hourly(2_500), NoApproval())
lead = Person("Ada", Salaried(18_000_000), LimitedApproval(50_000))
\`\`\`

Notice that \`Salaried\` and \`Hourly\` do not inherit from anything. Because \`Compensation\` is a \`Protocol\`, they conform by having the right method — the type checker verifies it at every call site that passes one in. That is the structural-typing payoff: the policy classes stay independent of the abstraction that consumes them, and a test double is just a tiny class (or even a \`Mock\`) with one method.

### What actually improved

| | Inheritance | Composition |
| --- | --- | --- |
| New combination | new subclass (n × m classes) | new object (n + m classes) |
| Change at runtime | reassign \`__class__\` (a red flag) | assign a new component |
| Testing one axis | construct the whole subclass | test \`Hourly\` in three lines |
| Coupling | subclass depends on parent internals | depends only on a one-method protocol |
| Where behavior lives | scattered up an MRO | one named, findable class |

The rule of thumb: **inheritance for is-a, composition for has-a or behaves-like.** A manager *is* a person, but a salary policy is something a person *has*. When in doubt, compose — you can always extract a base class later, but unwinding a deep hierarchy is a rewrite.

The one thing you lose is the tiny bit of boilerplate that delegation costs (\`pay_for\` forwarding to \`_compensation\`). That is a genuinely cheap price for the flexibility above.`,
    },
    {
      id: "solid",
      heading: "SOLID, each with before and after",
      markdown: `SOLID is five heuristics for keeping code changeable. Every one of them is really about **isolating the reason a file has to change**.

## S — Single Responsibility

*A class should have one reason to change.* "Reason" means "stakeholder or concern," not "one method."

\`\`\`python
from dataclasses import dataclass


# BEFORE: three reasons to change — business rules, HTML, and SMTP.
@dataclass
class Invoice:
    lines: list[Line]

    def total_cents(self) -> int:
        return sum(line.qty * line.unit_cents for line in self.lines)

    def to_html(self) -> str:
        return f"<h1>Invoice</h1><p>{self.total_cents()}</p>"

    def email(self, to: str) -> None:
        smtp.send(to, "Your invoice", self.to_html())
\`\`\`

A designer changing the template edits the same file as an accountant changing tax rules, and the class cannot be unit-tested without an SMTP server.

\`\`\`python
from dataclasses import dataclass
from typing import Protocol


# AFTER: each concern is separately changeable and separately testable.
@dataclass
class Invoice:
    lines: list[Line]

    def total_cents(self) -> int:
        return sum(line.qty * line.unit_cents for line in self.lines)


class InvoiceHtmlRenderer:
    def render(self, invoice: Invoice) -> str:
        return f"<h1>Invoice</h1><p>{invoice.total_cents()}</p>"


class MailSender(Protocol):
    def send(self, to: str, subject: str, body: str) -> None: ...


class InvoiceMailer:
    def __init__(self, mail: MailSender, renderer: InvoiceHtmlRenderer) -> None:
        self._mail = mail
        self._renderer = renderer

    def send(self, invoice: Invoice, to: str) -> None:
        self._mail.send(to, "Your invoice", self._renderer.render(invoice))
\`\`\`

The counter-pressure worth mentioning: taken to an extreme, SRP produces a hundred one-method classes and you cannot find anything. In Python the extreme is even easier to avoid — a "class" with one method and no state should usually just be a function, and \`render_invoice_html(invoice)\` in a \`rendering\` module is a perfectly good unit of separation. The test is whether two concerns change *at different times, for different people*. If they always change together, they belong together.

## O — Open/Closed

*Open for extension, closed for modification.* You should be able to add behavior without editing tested, working code.

\`\`\`python
# BEFORE: every new payment method edits this method. Regression risk on
# existing methods every single time.
class PaymentProcessor:
    def pay(self, method: str, cents: int) -> Receipt:
        if method == "card":
            return self._charge_card(cents)
        if method == "paypal":
            return self._charge_paypal(cents)
        raise ValueError(f"unsupported payment method: {method}")
\`\`\`

\`\`\`python
from typing import Protocol


# AFTER: adding Apple Pay is a new module. PaymentProcessor is never reopened.
class PaymentMethod(Protocol):
    async def pay(self, cents: int) -> Receipt: ...


class CardPayment:
    def __init__(self, gateway: CardGateway) -> None:
        self._gateway = gateway

    async def pay(self, cents: int) -> Receipt:
        return await self._gateway.charge(cents)


class PayPalPayment:
    def __init__(self, client: PayPalClient) -> None:
        self._client = client

    async def pay(self, cents: int) -> Receipt:
        return await self._client.create_payment(cents)


class PaymentProcessor:
    def __init__(self, method: PaymentMethod) -> None:
        self._method = method

    async def pay(self, cents: int) -> Receipt:
        return await self._method.pay(cents)
\`\`\`

Note that this only pays off along the axis you predicted. If the next change is "every method needs a refund," you have to edit every implementation — you were closed for the wrong thing. Open/closed is not free; it is a bet on where change will come from, which is why it is worth applying *after* you have seen the change happen twice.

## L — Liskov Substitution

*A subtype must be usable anywhere its supertype is, without callers knowing.*

\`\`\`python
# BEFORE: the textbook violation, and it's a real bug.
class Rectangle:
    def __init__(self, width: float, height: float) -> None:
        self._width = width
        self._height = height

    def set_width(self, width: float) -> None:
        self._width = width

    def set_height(self, height: float) -> None:
        self._height = height

    def area(self) -> float:
        return self._width * self._height


class Square(Rectangle):
    def set_width(self, width: float) -> None:
        self._width = self._height = width       # must stay square

    def set_height(self, height: float) -> None:
        self._width = self._height = height


def resize(rect: Rectangle) -> None:
    rect.set_width(5)
    rect.set_height(4)
    assert rect.area() == 20                     # fails for Square: area is 16
\`\`\`

A square *is* a rectangle in geometry, but a *mutable* square is not a substitutable *mutable* rectangle, because it breaks the caller's reasonable assumption that width and height are independent.

\`\`\`python
from __future__ import annotations

from dataclasses import dataclass, replace
from typing import Protocol


# AFTER: immutable value types. No setters means no contradictory invariant.
class Shape(Protocol):
    def area(self) -> float: ...


@dataclass(frozen=True)
class Rectangle:
    width: float
    height: float

    def area(self) -> float:
        return self.width * self.height

    def with_width(self, width: float) -> Rectangle:
        return replace(self, width=width)


@dataclass(frozen=True)
class Square:
    side: float

    def area(self) -> float:
        return self.side**2
\`\`\`

Dropping the inheritance costs nothing here precisely because \`Shape\` is a \`Protocol\`: \`Rectangle\` and \`Square\` are unrelated classes that both satisfy it, and every function taking a \`Shape\` accepts both.

The practical smell for LSP: a subclass that raises \`NotImplementedError\`, silently ignores a call, or tightens a precondition. If callers need \`isinstance\` checks to work out what they are holding, substitutability is already broken.

## I — Interface Segregation

*No client should be forced to depend on methods it does not use.*

\`\`\`python
from typing import Protocol


# BEFORE: a fat protocol. A read-only report screen must satisfy writes too.
class UserStore(Protocol):
    async def find_by_id(self, user_id: str) -> User: ...
    async def save(self, user: User) -> None: ...
    async def delete(self, user_id: str) -> None: ...
    async def export_csv(self) -> str: ...
\`\`\`

\`\`\`python
from typing import Protocol


# AFTER: small, role-based protocols. Consumers depend on exactly what
# they use, and test doubles become trivial.
class UserReader(Protocol):
    async def find_by_id(self, user_id: str) -> User: ...


class UserWriter(Protocol):
    async def save(self, user: User) -> None: ...
    async def delete(self, user_id: str) -> None: ...


class UserExporter(Protocol):
    async def export_csv(self) -> str: ...


class PostgresUserStore:
    """Satisfies all three structurally — it never names them."""

    def __init__(self, pool: Pool) -> None:
        self._pool = pool

    async def find_by_id(self, user_id: str) -> User: ...
    async def save(self, user: User) -> None: ...
    async def delete(self, user_id: str) -> None: ...
    async def export_csv(self) -> str: ...


class ProfileScreen:
    def __init__(self, users: UserReader) -> None:   # cannot write. By construction.
        self._users = users
\`\`\`

The under-appreciated benefit: a narrow protocol makes the *dependency* legible. \`ProfileScreen\` taking a \`UserReader\` documents that it never mutates users, and the type checker enforces it. This is where \`Protocol\` beats \`ABC\` decisively — the concrete store does not have to inherit from three base classes to be usable as three roles, and a fake in a test only needs the one method that role requires.

## D — Dependency Inversion

*High-level policy should not depend on low-level detail; both depend on abstractions.*

\`\`\`python
import os

from myapp.infra.postgres import PostgresClient


# BEFORE: business logic reaches out and constructs its own infrastructure.
class OrderService:
    def __init__(self) -> None:
        self._db = PostgresClient(os.environ["DATABASE_URL"])   # hard-wired

    async def place(self, order: Order) -> None:
        await self._db.execute("INSERT INTO orders ...", order.id)
\`\`\`

You cannot test \`place\` without a Postgres instance, and you cannot swap the store. Note that the arrow points the wrong way: the *policy* (ordering rules) depends on the *detail* (Postgres), and the \`import\` at the top of the file is the proof.

\`\`\`python
from typing import Protocol


# AFTER: the protocol lives in the domain module; the adapter conforms to it.
# Now the detail depends on the policy.
class OrderRepository(Protocol):
    async def save(self, order: Order) -> None: ...
    async def find_by_id(self, order_id: str) -> Order | None: ...


class OrderService:
    def __init__(self, orders: OrderRepository) -> None:
        self._orders = orders

    async def place(self, order: Order) -> None:
        await self._orders.save(order)


# --- infrastructure module: imports the domain, never the reverse ------
class PostgresOrderRepository:
    def __init__(self, pool: Pool) -> None:
        self._pool = pool

    async def save(self, order: Order) -> None: ...
    async def find_by_id(self, order_id: str) -> Order | None: ...


class InMemoryOrderRepository:
    """The whole point: a real implementation for fast tests."""

    def __init__(self) -> None:
        self._orders: dict[str, Order] = {}

    async def save(self, order: Order) -> None:
        self._orders[order.id] = order

    async def find_by_id(self, order_id: str) -> Order | None:
        return self._orders.get(order_id)


# Composition root — the one place that knows about concrete types.
service = OrderService(PostgresOrderRepository(pool))
\`\`\`

The detail that separates a strong answer from a memorized one: **it is not "inverted" merely because you injected something.** The inversion is that \`OrderRepository\` is defined next to \`OrderService\`, in the domain module, expressing what the domain needs — and the database adapter conforms to it. If the protocol lives in the database package and just describes what Postgres can do, you have injection but not inversion. In Python the import graph is the tell: draw it, and every arrow should point from infrastructure toward the domain, never out of it.`,
    },
    {
      id: "patterns",
      heading: "Design patterns interns actually get asked about",
      markdown: `Patterns are shared vocabulary, not a checklist. Introducing a pattern that solves a problem you do not have is worse than the duplication it replaced. The right time to reach for one is when you recognize the *problem* it names.

Python deserves one caveat up front: several Gang-of-Four patterns exist to work around limitations Python does not have. Functions are first-class objects, so Strategy and Command often collapse into "pass a function." Modules are singletons, so Singleton mostly evaporates. Duck typing means Adapter needs no declared interface. Know the patterns by name — interviewers ask about them — but reach for the smallest form that solves the problem.

## Strategy — swap an algorithm at runtime

\`\`\`python
from typing import Protocol


class ShippingStrategy(Protocol):
    def cost_cents(self, order: Order) -> int: ...


class StandardShipping:
    def cost_cents(self, order: Order) -> int:
        return 500 + round(order.weight_kg * 100)


class ExpressShipping:
    def cost_cents(self, order: Order) -> int:
        return 1_500 + round(order.weight_kg * 250)


class FreeShipping:
    def cost_cents(self, order: Order) -> int:
        return 0


class Checkout:
    def __init__(self, shipping: ShippingStrategy) -> None:
        self.shipping = shipping        # public attribute: swap it directly

    def total_cents(self, order: Order) -> int:
        return order.subtotal_cents + self.shipping.cost_cents(order)


checkout = Checkout(StandardShipping())
checkout.shipping = ExpressShipping()   # runtime swap; no setter needed
\`\`\`

Note there is no \`set_shipping\` method. A plain public attribute *is* the setter in Python, and adding a one-line setter that only assigns is the Java habit worth unlearning — if the assignment later needs validation, you turn \`shipping\` into a \`@property\` and no caller changes.

When a strategy is stateless and single-method, the honest Python version is even smaller:

\`\`\`python
from collections.abc import Callable

ShippingStrategy = Callable[[Order], int]


def standard_shipping(order: Order) -> int:
    return 500 + round(order.weight_kg * 100)


def express_shipping(order: Order) -> int:
    return 1_500 + round(order.weight_kg * 250)


class Checkout:
    def __init__(self, shipping: ShippingStrategy) -> None:
        self.shipping = shipping

    def total_cents(self, order: Order) -> int:
        return order.subtotal_cents + self.shipping(order)
\`\`\`

Use the class form when the strategy has configuration (\`ExpressShipping(surcharge_cents=200)\`) or more than one method; use the function form when it is a single pure computation. Being able to say *why* you picked one is better signal than reciting the pattern.

**Use when**: you have an if/else or match selecting between interchangeable algorithms. Strategy is the pattern behind the open/closed refactor above, and it is the single most useful pattern at intern level.

## Factory — centralize object creation

\`\`\`python
from enum import StrEnum
from typing import assert_never


class Channel(StrEnum):
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"


def create_notifier(channel: Channel, config: Config) -> Notifier:
    """The caller names what it wants, not how it is built."""
    match channel:
        case Channel.EMAIL:
            return EmailNotifier(config.smtp)
        case Channel.SMS:
            return SmsNotifier(config.twilio)
        case Channel.PUSH:
            return PushNotifier(config.fcm)
        case _:
            assert_never(channel)
\`\`\`

A module-level function is the Pythonic factory. A class containing nothing but one \`@staticmethod\` is a Java import — say that out loud if you write \`NotifierFactory\`, because recognizing it is signal. When the choice is a straight lookup with no logic, a dict is smaller still:

\`\`\`python
from collections.abc import Callable

_BUILDERS: dict[Channel, Callable[[Config], Notifier]] = {
    Channel.EMAIL: lambda c: EmailNotifier(c.smtp),
    Channel.SMS: lambda c: SmsNotifier(c.twilio),
    Channel.PUSH: lambda c: PushNotifier(c.fcm),
}


def create_notifier(channel: Channel, config: Config) -> Notifier:
    return _BUILDERS[channel](config)
\`\`\`

The other Pythonic factory is the **alternative constructor**: a \`@classmethod\` such as \`Money.from_string("12.50")\` or \`datetime.fromisoformat(...)\`, which keeps construction logic on the class it builds.

**Use when**: construction is nontrivial (dependencies, validation, choosing an implementation) and you do not want that logic duplicated at every call site. The honest caveat: a factory whose only job is \`return Thing()\` is ceremony. Add it when construction actually has logic.

## Observer — one-to-many notification

\`\`\`python
from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Generic, TypeVar

T = TypeVar("T")
Listener = Callable[[T], None]


class EventEmitter(Generic[T]):
    def __init__(self) -> None:
        self._listeners: list[Listener[T]] = []

    def subscribe(self, fn: Listener[T]) -> Callable[[], None]:
        self._listeners.append(fn)

        def unsubscribe() -> None:
            if fn in self._listeners:
                self._listeners.remove(fn)

        return unsubscribe                       # return the unsubscribe

    def emit(self, event: T) -> None:
        for fn in list(self._listeners):         # copy: listeners may unsubscribe
            fn(event)


@dataclass(frozen=True)
class OrderPlaced:
    order_id: str


orders: EventEmitter[OrderPlaced] = EventEmitter()
off = orders.subscribe(lambda e: send_confirmation_email(e.order_id))
orders.subscribe(lambda e: analytics.track("order_placed", e))
orders.emit(OrderPlaced(order_id="o_1"))
off()
\`\`\`

**Use when**: a subject must notify an unknown number of interested parties without knowing who they are. This is the model behind GUI events, \`logging\` handlers, and pub/sub messaging.

Three details worth saying. **Always return an unsubscribe callable**, because forgotten listeners are the classic memory leak — the emitter holds a strong reference to the listener, and through a bound method, to its whole object. **Iterate a copy** of the listener list, since a listener that unsubscribes during \`emit\` would otherwise mutate the list you are iterating. And if you want listeners not to keep their owners alive, \`weakref.WeakSet\` is the tool — but note that a bound method is a fresh object each time you access it, so you need \`weakref.WeakMethod\`, which is exactly the kind of specific detail that reads as experience.

## Singleton — and why it is usually an anti-pattern

\`\`\`python
from __future__ import annotations


# The Java-style Singleton, transliterated. You will be asked to critique this.
class Config:
    _instance: Config | None = None

    def __init__(self, values: dict[str, str]) -> None:
        self.values = values

    @classmethod
    def get_instance(cls) -> Config:
        if cls._instance is None:
            cls._instance = cls(load_from_env())
        return cls._instance
\`\`\`

The Python-specific opening move, and the one most candidates miss: **a module is already a singleton.** It is executed once and cached in \`sys.modules\`, so the whole ceremony above buys nothing.

\`\`\`python
# config.py — imported once, cached forever. This IS a singleton, with no
# class, no lock, and no get_instance().
VALUES: dict[str, str] = load_from_env()

# anywhere else:
from myapp.config import VALUES
\`\`\`

That is worth saying because it *strengthens* the argument against the pattern: if you genuinely want process-global state, Python already gives it to you for free, so the class-based Singleton is pure ceremony on top of a design decision you should be scrutinizing anyway. And every objection to Singletons applies to the module version too.

Be ready to argue against both, because that is the actual question:

1. **It is global mutable state in a costume.** Any code anywhere can reach it, so you cannot reason locally about what changes it.
2. **It destroys testability.** Tests share the instance, so they leak state into each other and become order-dependent. Patching a module global with \`monkeypatch\` works but is a smell you are paying for every test.
3. **It hides dependencies.** A class that calls \`Config.get_instance()\` has a dependency that does not appear in \`__init__\`, so you cannot tell what it needs by reading its signature.
4. **Thread-safety is easy to get wrong.** The GIL does not save you: \`if cls._instance is None\` and the assignment that follows are separate bytecodes, so two threads can both construct one. Module import *is* protected by the import lock, which is another point for modules; where you need laziness, \`functools.cache\` on a zero-argument factory is the idiomatic, correct form.
5. **Lifetime is unmanaged.** You cannot dispose it or scope it per request — and note that with modules it is worse, since state persists for the life of the process and across tests in the same run.

The better answer nearly every time: create **one instance** at the composition root and inject it. You get the same "one shared object" property without global access, and your tests can pass a different one. Say it that way — "I want a single instance, not a Singleton" — and you have shown you understand the distinction.

\`\`\`python
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    database_url: str
    retries: int = 3


class OrderService:
    def __init__(self, config: Config) -> None:   # the dependency is visible
        self._config = config


# main.py — one instance, created once, passed down.
config = Config(database_url=os.environ["DATABASE_URL"])
service = OrderService(config)
\`\`\`

Legitimate uses do exist: stateless caches, connection pools, loggers — things where the shared instance genuinely has no meaningful per-caller state. Note that \`logging.getLogger(name)\` is exactly this, and it is fine.

## Adapter — make an incompatible interface fit

\`\`\`python
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class Receipt:
    id: str
    amount_cents: int


# What our domain wants:
class PaymentGateway(Protocol):
    async def charge(self, cents: int, token: str) -> Receipt: ...


# What the vendor SDK gives us (different names, different units, its own errors):
class StripeSdk:
    async def create_charge(
        self, *, amount: int, currency: str, source: str
    ) -> dict[str, str]: ...


# The adapter translates between them — and is the ONLY module that imports Stripe.
class StripeGateway:
    def __init__(self, sdk: StripeSdk) -> None:
        self._sdk = sdk

    async def charge(self, cents: int, token: str) -> Receipt:
        res = await self._sdk.create_charge(
            amount=cents, currency="usd", source=token
        )
        if res["status"] != "succeeded":
            raise PaymentDeclined(res["id"])
        return Receipt(id=res["id"], amount_cents=cents)
\`\`\`

**Use when**: integrating a third-party library or legacy code. The strategic value is containment — swapping Stripe for Adyen becomes one new module, and your tests fake *your* protocol instead of guessing at the vendor's response shape. In Python the containment is literal and checkable: \`grep -r "import stripe"\` should return exactly one file.

## Decorator — add behavior by wrapping

This one needs disambiguating in Python, because two different things share the name. The **Decorator pattern** wraps an *object* that implements the same interface. Python's **\`@decorator\` syntax** wraps a *function or class* at definition time. They rhyme — both add behavior without editing the thing being wrapped — but they are not interchangeable, and knowing which one an interviewer means is worth stating explicitly.

### The pattern: wrap an object

\`\`\`python
from __future__ import annotations

import time
from typing import Protocol


class DataSource(Protocol):
    async def read(self, key: str) -> str: ...


class HttpDataSource:
    def __init__(self, client: HttpClient) -> None:
        self._client = client

    async def read(self, key: str) -> str:
        response = await self._client.get(f"/api/{key}")
        return response.text


# Each decorator satisfies the same protocol and wraps another instance.
class CachingDataSource:
    def __init__(self, inner: DataSource) -> None:
        self._inner = inner
        self._cache: dict[str, str] = {}

    async def read(self, key: str) -> str:
        if key in self._cache:
            return self._cache[key]
        value = await self._inner.read(key)
        self._cache[key] = value
        return value


class LoggingDataSource:
    def __init__(self, inner: DataSource) -> None:
        self._inner = inner

    async def read(self, key: str) -> str:
        start = time.perf_counter()
        try:
            return await self._inner.read(key)
        finally:
            elapsed_ms = (time.perf_counter() - start) * 1_000
            logger.info("read %s in %.1fms", key, elapsed_ms)


# Compose freely; order is meaningful (this logs cache hits too).
source = LoggingDataSource(CachingDataSource(HttpDataSource(client)))
\`\`\`

### The syntax: wrap a callable

\`\`\`python
from __future__ import annotations

import functools
import time
from collections.abc import Awaitable, Callable
from typing import ParamSpec, TypeVar

P = ParamSpec("P")
R = TypeVar("R")


def timed(fn: Callable[P, Awaitable[R]]) -> Callable[P, Awaitable[R]]:
    """A Python decorator: it wraps a function, not an object."""

    @functools.wraps(fn)                 # keeps __name__, __doc__, signature
    async def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        start = time.perf_counter()
        try:
            return await fn(*args, **kwargs)
        finally:
            elapsed_ms = (time.perf_counter() - start) * 1_000
            logger.info("%s took %.1fms", fn.__name__, elapsed_ms)

    return wrapper


class HttpDataSource:
    @timed
    async def read(self, key: str) -> str:
        response = await self._client.get(f"/api/{key}")
        return response.text
\`\`\`

The difference that matters in design terms: the \`@\` form is fixed at definition time and applies to every instance, so it cannot be composed or reordered per object, and it edits the class it decorates. The object form is chosen at wiring time, so the same core class can be cached in production and uncached in tests. Reach for \`@\` for uniform cross-cutting concerns (\`@functools.cache\`, \`@retry\`, timing); reach for wrapping objects when the composition is a deployment decision. \`functools.wraps\` is not optional — without it the wrapper loses its name and docstring, which breaks introspection, tracebacks, and most test frameworks' reporting.

**Use the pattern when**: you want to layer orthogonal concerns — caching, logging, retries, rate limiting, auth — without touching the core class or exploding into \`CachingLoggingRetryingHttpSource\` subclasses. This is composition over inheritance applied to cross-cutting behavior, and it is exactly how WSGI/ASGI middleware works.

## Repository — a collection-like interface over persistence

\`\`\`python
from datetime import datetime
from typing import Protocol


class OrderRepository(Protocol):
    async def find_by_id(self, order_id: str) -> Order | None: ...
    async def find_pending_older_than(self, cutoff: datetime) -> list[Order]: ...
    async def save(self, order: Order) -> None: ...
\`\`\`

**Use when**: you want domain code to express *what* it needs, not *how* it is stored. It gives you an in-memory implementation for fast tests, a single place where queries live, and the freedom to change the storage layer.

The caveat: a repository that is a thin passthrough over an ORM that is already a repository — a SQLAlchemy \`Session\`, a Django \`Manager\` — is a wasted layer. It earns its place when the interface is expressed in domain terms (\`find_pending_older_than\`) rather than data terms (\`execute(sql)\`).

Note the return type: \`Order | None\`. Python has exactly one absent value, so "not found" is unambiguous and the type checker forces the caller to narrow it before use — no null/undefined split to reason about.`,
    },
    {
      id: "coupling-cohesion",
      heading: "Coupling and cohesion",
      markdown: `These two ideas underlie every other guideline in this chapter. If you can only remember one design principle, remember: **low coupling, high cohesion.**

**Coupling** is how much one module depends on another's details. **Cohesion** is how strongly the things inside a module belong together.

\`\`\`python
# High coupling: OrderService knows the shape of the DB row, the email
# template, AND the tax table. A change to any of the three breaks it.
class OrderService:
    async def place(self, order: Order) -> None:
        await db.execute(
            "INSERT INTO orders (id, total_cents, tax_v2) VALUES ($1, $2, $3)",
            order.id,
            order.total_cents,
            order.tax_cents,
        )
        smtp.send(
            order.email,
            "Thanks!",
            f"<p>You paid {order.total_cents / 100:.2f}</p>",
        )


# Low coupling: three named collaborators, each behind a narrow protocol.
class OrderService:
    def __init__(
        self,
        orders: OrderRepository,
        taxes: TaxCalculator,
        notifier: OrderNotifier,
    ) -> None:
        self._orders = orders
        self._taxes = taxes
        self._notifier = notifier

    async def place(self, order: Order) -> None:
        total = self._taxes.apply_to(order)
        await self._orders.save(order.with_total(total))
        await self._notifier.confirmed(order)
\`\`\`

In Python the coupling is visible in the import graph before you read a line of logic. A domain module that imports \`psycopg\`, \`smtplib\`, and \`requests\` has told you its problem already.

### Recognizing bad coupling

- **Feature envy**: a method that spends most of its time reading another object's data. The behavior belongs on that object.
- **Inappropriate intimacy**: two modules that each reach into the other's private (\`_\`-prefixed) names — and in Python nothing stops them, so this is a review-discipline problem, not a compiler-enforced one.
- **Train wrecks**: \`order.customer.address.country.tax_rate\` — you are now coupled to four classes and any of them can break you. The **Law of Demeter** ("only talk to your immediate collaborators") says ask \`order.tax_rate()\` instead.
- **Shotgun surgery**: one conceptual change forces edits in eight files. The concept is smeared across the codebase.
- **Circular imports**: Python's specific tell. If two modules import each other, they are one module pretending to be two, and the \`ImportError\` is the design telling you so.

### Recognizing bad cohesion

- A module named \`utils.py\`, \`helpers.py\`, \`common.py\`, or a class named \`Manager\`. These names mean "I could not describe what this does," which is a cohesion failure by definition.
- A class where one group of methods touches attributes A and B and another group touches C and D. That is two classes wearing one name.
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
| **Long function** | Doing several things at once | Extract Function |
| **Large class** | Multiple responsibilities | Extract Class |
| **Long parameter list** | A missing concept | Introduce Parameter Object (a \`@dataclass\`) |
| **Duplicated code** | A concept lacking a home | Extract Function / Pull Up Method |
| **Feature envy** | Behavior on the wrong class | Move Method |
| **Data clumps** | Fields that always travel together | Extract Class |
| **Primitive obsession** | Domain concepts encoded as \`str\`/\`int\` | Replace Primitive with Value Object |
| **Match/if-chain on type** | Missing polymorphism | Replace Conditional with Polymorphism |
| **Temporary field** | An attribute only set sometimes | Extract Class / rethink lifecycle |
| **Message chains** | Law of Demeter violation | Hide Delegate |
| **Speculative generality** | Abstractions built for imagined futures | Inline / Collapse Hierarchy |
| **Comments explaining *how*** | The code is not clear enough | Extract Function with a naming comment |
| **Mutable default argument** | \`def f(items=[])\` — Python's own classic | Default to \`None\`, build inside |

### The moves that matter most

**Extract Function** — the highest-value refactoring there is, because a well-named function replaces a comment with something a reader can trust:

\`\`\`python
# Before
def checkout(cart: Cart, user: User) -> int:
    total = 0
    for item in cart.items:
        total += item.unit_cents * item.qty
    if user.is_member:
        total = round(total * 0.9)
    if total > 5_000:
        total -= 500
    return total


# After — the top-level function now reads as the business rule
def checkout(cart: Cart, user: User) -> int:
    subtotal = sum_line_items(cart)
    return apply_bulk_discount(apply_membership_discount(subtotal, user))


def sum_line_items(cart: Cart) -> int:
    return sum(item.unit_cents * item.qty for item in cart.items)


def apply_membership_discount(total_cents: int, user: User) -> int:
    return round(total_cents * 0.9) if user.is_member else total_cents


def apply_bulk_discount(total_cents: int) -> int:
    return total_cents - 500 if total_cents > 5_000 else total_cents
\`\`\`

**Replace Primitive with Value Object** — the fix for the most common design failure in real code:

\`\`\`python
from __future__ import annotations

import re
from dataclasses import dataclass
from enum import StrEnum


# Before: nothing stops you swapping these two arguments.
def transfer(from_account: str, to_account: str, amount: int) -> None: ...


# After: the type checker enforces what the names only suggested.
class Currency(StrEnum):
    USD = "USD"
    EUR = "EUR"


class CurrencyMismatch(ValueError):
    pass


_ACCOUNT_ID = re.compile(r"acct_[a-z0-9]{16}")


@dataclass(frozen=True)
class AccountId:
    value: str

    @classmethod
    def parse(cls, raw: str) -> AccountId:
        if not _ACCOUNT_ID.fullmatch(raw):
            raise ValueError(f"bad account id: {raw!r}")
        return cls(raw)


@dataclass(frozen=True, order=True)
class Money:
    cents: int
    currency: Currency

    def __post_init__(self) -> None:
        if not isinstance(self.cents, int):
            raise TypeError("money must be integer cents")

    def __add__(self, other: Money) -> Money:
        if other.currency is not self.currency:
            raise CurrencyMismatch(f"{self.currency} + {other.currency}")
        return Money(self.cents + other.cents, self.currency)


def transfer(source: AccountId, target: AccountId, amount: Money) -> None: ...
\`\`\`

Validation now happens once, at the boundary, instead of defensively in every function — and because \`@dataclass(frozen=True)\` runs \`__post_init__\` on every construction, there is no way to build an invalid \`Money\` at all. "Add USD to EUR" raises instead of silently producing a wrong number, and \`transfer(target, source, amount)\` is at least a type error rather than a bank incident.

\`Money\` as integer cents rather than a float is worth saying out loud too: \`0.1 + 0.2 == 0.30000000000000004\` in binary floating point, so currency should never be a \`float\`. Integer cents is the usual answer; \`decimal.Decimal\` is the alternative when you need fractional cents or configurable rounding, and knowing that \`Decimal("0.1") + Decimal("0.2") == Decimal("0.3")\` is exactly true is a good detail to have ready.

### How to refactor safely

1. **Have tests first.** Refactoring without tests is just editing and hoping. If there are no tests, write characterization tests that pin down current behavior — even the behavior you think is wrong.
2. **One move at a time**, running tests after each. If something breaks you know exactly which move did it. Python gives you no compiler to catch a mistyped attribute name, so the tests are doing double duty — this is a real argument for running mypy or pyright in CI as well.
3. **Never mix refactoring with behavior change** in the same commit. A reviewer can skim a pure rename; a rename hiding a logic change is how bugs ship.
4. **Follow the rule of three.** Duplication once is fine. Twice, note it. Three times, extract. Premature extraction of two things that merely *look* alike creates a false abstraction, and coupling two unrelated things through a shared function is worse than duplication.`,
    },
    {
      id: "immutability-and-functional",
      heading: "Immutability, pure functions, and where functional beats OOP",
      markdown: `### Pure functions

A pure function's output depends only on its inputs, and it has no side effects — no mutation of arguments, no I/O, no reading a clock or a global.

\`\`\`python
from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import datetime


# Impure: mutates its argument, reads a global clock, and writes a log.
def apply_discount(order: Order) -> None:
    order.total_cents = round(order.total_cents * 0.9)
    order.discounted_at = datetime.now()
    logger.info("discount applied")


# Pure: same input, same output, no observable effects.
def with_discount(order: Order, rate: float, now: datetime) -> Order:
    return replace(
        order,
        total_cents=round(order.total_cents * (1 - rate)),
        discounted_at=now,
    )
\`\`\`

\`dataclasses.replace\` is the Python idiom for "the same object but with these fields changed" — it re-runs \`__post_init__\`, so validation still applies to the copy.

What purity buys, concretely:

- **Trivial testing.** No fixtures, no mocks, no teardown — call it and assert. This alone changes how much of a codebase you can afford to test well.
- **Local reasoning.** You can understand the function by reading it, without knowing what else in the program has run.
- **Safe to cache and parallelize.** \`functools.cache\` is only *correct* for pure functions, and pure functions have no data races — which matters more now that free-threaded builds are removing the GIL's accidental protection.
- **Time travel and replay.** Undo/redo and event sourcing fall out naturally.

### Immutability

An immutable object cannot change after construction; "modifying" it produces a new one.

\`\`\`python
from __future__ import annotations

from dataclasses import dataclass, FrozenInstanceError


@dataclass(frozen=True)
class Money:
    cents: int
    currency: Currency

    def plus(self, other: Money) -> Money:
        return Money(self.cents + other.cents, self.currency)   # new instance


coffee = Money(500, Currency.USD)

try:
    coffee.cents = 600
except FrozenInstanceError:
    pass                      # frozen=True is enforced at runtime, not just by mypy

# frozen=True also generates __hash__, so value objects work as dict keys
# and set members — mutable classes do not get that for free.
menu: dict[Money, str] = {coffee: "americano"}
\`\`\`

Two Python specifics to state accurately:

- \`frozen=True\` **is** runtime enforcement — assignment raises \`FrozenInstanceError\`. That is stronger than a checker-only annotation such as \`typing.Final\`, which mypy enforces and the interpreter ignores.
- But it is **shallow**. A frozen dataclass holding a \`list\` still hands out a mutable list, and it will blow up when hashed. Use \`tuple\`, \`frozenset\`, or \`Mapping\` for the fields, and it holds all the way down.

Why immutability matters:

- **Thread safety for free.** No shared mutable state means no locks and no race conditions.
- **Safe sharing.** You can pass an immutable object anywhere without defensive copying, because no callee can corrupt it.
- **Valid dict keys and set members.** Python requires \`__hash__\` and \`__eq__\` to stay consistent; mutate a field used in \`__hash__\` while the object is a key and the entry becomes unreachable — the dict looks in the wrong bucket. Immutable keys make that impossible, which is exactly why \`tuple\` is hashable and \`list\` is not.
- **Cheap change detection.** Identity comparison is enough — the basis of React-style rendering and of most memoization.
- **The invariant is checked once**, in \`__post_init__\`, and holds forever.

The cost is allocation. It is usually irrelevant, and when it is not, persistent data structures (\`pyrsistent\`, \`immutables\`, Clojure's vectors) give you structural sharing so a "copy" shares most of its memory with the original.

### Where functional style wins

Not everything should be an object. Reach for a functional approach when:

- **The problem is a data transformation.** A comprehension or a pipeline of \`map\`/\`filter\`/\`itertools\` over a collection is clearer than a class hierarchy.
- **You are writing business rules.** \`calculate_tax(order, jurisdiction)\` as a pure function is far easier to test and reason about than a \`TaxCalculator\` holding mutable state.
- **Correctness is critical.** No hidden state means far fewer places for a bug to hide.
- **You are adding operations, not types.** Recall the expression problem: if new *operations* over a fixed set of types are the common change, a pure function with a \`match\` is easier than adding a method to every class. (\`functools.singledispatch\` is the middle road — it adds operations from outside without editing the classes.)

### Where OOP wins

- **Real entities with identity and a lifecycle.** A \`User\` is not a value — two users with identical fields are still different users, and identity is exactly what objects model. The dataclass tell: entities want \`eq=False\` (identity comparison), value objects want \`frozen=True\`.
- **You need pluggable implementations.** Strategy, adapter, repository — protocols plus polymorphism are the cleanest tool for swapping behavior.
- **State genuinely belongs together** and must be kept consistent. A connection pool, a game entity, a stateful parser.
- **You are adding types, not operations.** New shapes, new payment methods, new notification channels.

The mature position, and the one to give in an interview: **objects at the edges, functions in the middle.** Objects and protocols manage state, identity, and I/O at the boundaries of the system; pure functions do the actual computation in a core that has no dependencies and is trivially testable. Almost every well-designed modern codebase looks like this, whatever it calls itself — and Python, which is happy to have module-level functions next to classes, makes it easier to do than most languages.`,
    },
    {
      id: "error-handling",
      heading: "Error handling design: exceptions vs result types",
      markdown: `Error handling is a design decision, not an afterthought, and it is a question that separates people who have maintained software from people who have only written it.

### The first distinction: expected vs exceptional

- **Expected**: a user typed an invalid email. A record was not found. A payment was declined. These are *outcomes*, part of the normal flow, and callers should be forced to handle them.
- **Exceptional**: the database connection dropped. A required config key is missing. An invariant was violated. These usually should propagate to a boundary that logs and returns a 500.

Using an exception for the first category means callers routinely forget to handle a case that will definitely happen. Using a silently-ignorable return value for the second means the error gets dropped and the program continues in a corrupt state.

Python's own bias is worth stating up front: **exceptions are the default here, and that is idiomatic, not lazy.** The language is built around EAFP ("easier to ask forgiveness than permission"), the standard library raises for missing keys and missing files, and control flow such as \`StopIteration\` is an exception. There is no native \`Result\` type. So the question in Python is not "exceptions or results" as a global choice — it is which of three tools fits each failure.

### Option 1 — exceptions, with a real exception hierarchy

\`\`\`python
class BankingError(Exception):
    """Base class, so callers can catch the whole family."""


class InsufficientFunds(BankingError):
    def __init__(self, shortfall_cents: int) -> None:
        super().__init__(f"short by {shortfall_cents} cents")
        self.shortfall_cents = shortfall_cents


try:
    account.withdraw(cents)
except InsufficientFunds as err:
    offer_overdraft(err.shortfall_cents)
\`\`\`

Note what Python gives you that a \`catch (err)\` plus type test does not: \`except InsufficientFunds\` already selects the one exception you understand, so anything else propagates automatically — you get "don't swallow what you don't understand" by default rather than by discipline. Defining a package-level base class (\`BankingError\`) is the move that makes this scale: callers can be as specific or as broad as they need without listing every subclass.

Pros: the happy path stays uncluttered, errors propagate without every intermediate frame handling them, and tracebacks are excellent for debugging.

Cons: they are invisible in the signature. Python type checkers do not model exceptions at all, so nothing tells you — or verifies — what \`withdraw\` can raise; you are relying on the docstring. They are a non-local goto, which makes control flow hard to follow. And they invite the worst error-handling bug there is:

\`\`\`python
try:
    do_thing()
except Exception:
    pass                          # never do this

try:
    do_thing()
except Exception as e:
    print(e)                      # barely better: no traceback, no context

try:
    do_thing()
except Exception:
    logger.exception("do_thing failed")   # logs the full traceback
    raise                                 # ...and lets it propagate
\`\`\`

One Python-specific trap to name: a bare \`except:\` catches \`BaseException\`, which includes \`KeyboardInterrupt\` and \`SystemExit\` — so it swallows Ctrl-C and makes a process unkillable. Always write \`except Exception\` at minimum.

### Option 2 — a result union of dataclasses, matched exhaustively

Python has no built-in \`Result\`, but a two-variant union plus \`match\` gets you most of the way:

\`\`\`python
from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Generic, TypeVar, assert_never

T = TypeVar("T")
E = TypeVar("E")


@dataclass(frozen=True)
class Ok(Generic[T]):
    value: T


@dataclass(frozen=True)
class Err(Generic[E]):
    error: E


Result = Ok[T] | Err[E]


class ParseError(StrEnum):
    EMPTY = "empty"
    TOO_LONG = "too_long"
    BAD_FORMAT = "bad_format"


def parse_email(raw: str) -> Result[Email, ParseError]:
    if not raw:
        return Err(ParseError.EMPTY)
    if len(raw) > 254:
        return Err(ParseError.TOO_LONG)
    if "@" not in raw:
        return Err(ParseError.BAD_FORMAT)
    return Ok(Email(raw))


def register(raw: str) -> Response:
    match parse_email(raw):
        case Ok(value=email):
            send_welcome(email)                       # narrowed to Email here
            return created()
        case Err(error=reason):
            return bad_request(message_for(reason))   # the checker forces this branch
        case unreachable:
            assert_never(unreachable)
\`\`\`

Pros: failures are in the type signature, so callers cannot forget them; the type checker enforces handling; the error set is enumerated and exhaustively checkable. This is Rust's \`Result\`, Go's \`(value, error)\`, and Haskell's \`Either\`.

Cons, and they are heavier in Python than in Rust: there is no \`?\` operator, so every intermediate layer must unwrap and re-wrap by hand, which is noise when ten frames just pass it upward. Nothing at *runtime* forces the caller to check — a colleague who never runs mypy gets no protection at all, whereas an unhandled exception is impossible to ignore. And it reads as un-Pythonic to reviewers, so it needs to earn its place. Reserve it for a genuinely closed set of expected outcomes at a boundary — parsing, validation, a payment decision — where enumerating the failures is the point.

### Option 3 — \`None\` for "not found"

For the single most common expected failure, Python already has the answer, and reaching for a \`Result\` here is over-engineering:

\`\`\`python
class InMemoryUserRepository:
    def __init__(self) -> None:
        self._users: dict[str, User] = {}

    def find_by_id(self, user_id: str) -> User | None:
        """'Not found' is an outcome, not an error — and it is in the signature."""
        return self._users.get(user_id)

    def get_by_id(self, user_id: str) -> User:
        """The strict twin: absence here means a bug or a bad URL."""
        user = self._users.get(user_id)
        if user is None:
            raise UserNotFound(user_id)
        return user


user = repo.find_by_id(uid)
if user is None:
    return not_found()
send_welcome(user.email)          # the checker narrowed it to User
\`\`\`

The \`find_x\` / \`get_x\` naming pair is a convention worth adopting and worth naming in an interview: \`find\` returns \`| None\` and expects you to handle absence, \`get\` raises. \`dict.get\` versus \`dict[key]\` is the same distinction in the standard library. \`None\` only works when there is exactly one way to fail, though — the moment you need to say *why*, you are back to Option 1 or 2.

### The pragmatic policy

1. **\`None\` for a single expected absence**, with the \`find\`/\`get\` naming making the choice explicit at the call site.
2. **A result union for a closed set of expected, domain-level failures** at a boundary — validation, parsing, business rule violations — where the caller must distinguish the cases.
3. **Exceptions for everything else**, including most domain errors in ordinary Python code: infrastructure failure, bugs, violated invariants. Give the package one base exception class so callers can catch a family.
4. **Never swallow an error.** Handle it, or add context and re-raise. A bare \`except Exception: pass\` turns a crash you could have debugged into corrupt data you cannot.
5. **Add context as you re-raise**: \`raise OrderFailed(f"order {order_id}") from err\`. The \`from\` clause sets \`__cause__\`, so the traceback shows both the new message and the original failure. Omitting \`from\` inside an \`except\` block still chains implicitly via \`__context__\`, but \`from\` states the intent — and \`from None\` deliberately hides an internal cause you do not want to leak.
6. **Fail fast.** Validate at the boundary and construct only valid objects — that is the value-object argument again. An error caught at the entry point is a 400; the same bad data caught three layers deep is a mystery.
7. **One handler at the top** — a framework exception handler or a \`try\` around \`main()\` — that logs with \`logger.exception\` and maps the error to a response. Do not scatter presentation logic through the domain.`,
    },
    {
      id: "lld-method",
      heading: "How to answer 'design a parking lot' questions",
      markdown: `Low-level design (LLD) questions — parking lot, elevator, deck of cards, vending machine, chess, library, ATM — are testing something different from system design. There is no QPS, no sharding, no CAP theorem. They want to see whether you can turn an ambiguous description into clean classes with clear responsibilities, in about 35 minutes.

### What is actually being scored

1. Did you clarify scope before designing?
2. Did you find the right nouns, and give each one a single clear job?
3. Are your abstractions sensible, and did you define one where extension is likely?
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

**Step 3 — Model the core entities**, with the enums first. Prefer \`Enum\` over strings, and \`@dataclass\` value objects over loose primitives.

**Step 4 — Find the axes of variation and put a \`Protocol\` there.** Pricing changes → \`PricingStrategy\`. Spot assignment policy changes → \`SpotAssignmentStrategy\`. Payment method changes → \`PaymentProcessor\`. That is where the interviewer's follow-up questions will land, and pre-empting them is exactly the signal you want.

**Step 5 — Write the main flows** as methods on a coordinating service, and say out loud where the concurrency is.

**Step 6 — Discuss extensions**: what breaks with monthly passes? Multiple lots? Reservations? A good answer here is what turns a passing grade into a strong one.

### Things that separate strong answers

- **Enums, not strings**, for closed sets. \`SpotSize.COMPACT\`, not \`"compact"\`. Use \`IntEnum\` when the members have a meaningful order (sizes), \`StrEnum\` when they are serialized as text (statuses).
- **Money as integer cents**, never a float.
- **A strategy protocol for pricing**, always. Every one of these problems eventually asks "what if weekend rates differ."
- **Say where the race condition is.** Two cars arriving at once must not get the same spot. Naming the atomic operation — a compare-and-set under a \`threading.Lock\`, or a conditional \`UPDATE\` in a transaction — is a strong signal, and most candidates never mention it. Be precise: the GIL makes individual bytecodes atomic, not a check-then-act sequence.
- **Prefer composition.** A \`Vehicle\` dataclass with a \`size\` field beats \`Car(Vehicle)\` and \`Motorcycle(Vehicle)\` when the only difference is one value.
- **Do not gold-plate.** A \`ParkingLotFactoryBuilderProvider\` reads as pattern-fluent but design-naive — and in Python it reads as someone writing Java.`,
    },
    {
      id: "lld-worked-example",
      heading: "Worked example: parking lot, in full",
      markdown: `Scope agreed with the interviewer: one lot, multiple levels, three vehicle sizes, spot-size-based fit, hourly pricing with a pluggable rate, cash/card payment, concurrent entry gates. No reservations, no monthly passes (discussed at the end).

### Value objects and enums

\`\`\`python
from __future__ import annotations

from dataclasses import dataclass
from enum import IntEnum, StrEnum


class VehicleSize(IntEnum):
    """IntEnum so "a bigger spot fits a smaller vehicle" is a plain comparison."""

    MOTORCYCLE = 0
    COMPACT = 1
    LARGE = 2


class SpotSize(IntEnum):
    MOTORCYCLE = 0
    COMPACT = 1
    LARGE = 2


@dataclass(frozen=True, order=True)
class Money:
    """Integer cents. Never use a float for currency."""

    cents: int

    def __post_init__(self) -> None:
        if not isinstance(self.cents, int) or isinstance(self.cents, bool):
            raise TypeError("money must be an integer number of cents")
        if self.cents < 0:
            raise ValueError("money must be non-negative")

    def __add__(self, other: Money) -> Money:
        return Money(self.cents + other.cents)

    def __mul__(self, count: int) -> Money:
        return Money(self.cents * count)
\`\`\`

Python has no private constructor, so the TypeScript/Java trick of hiding \`new\` behind a validating \`fromCents\` factory is unnecessary: \`__post_init__\` runs on *every* construction, including \`dataclasses.replace\`, so there is no path that skips validation. \`order=True\` gives \`Money\` its comparisons for free, which is what lets the price cap below be a one-line \`min\`.

### Entities

\`\`\`python
from __future__ import annotations

import threading
from dataclasses import dataclass
from enum import StrEnum


@dataclass(frozen=True)
class Vehicle:
    license_plate: str
    size: VehicleSize


class SpotStatus(StrEnum):
    FREE = "FREE"
    OCCUPIED = "OCCUPIED"
    OUT_OF_SERVICE = "OUT_OF_SERVICE"


class ParkingSpot:
    def __init__(self, spot_id: str, level_number: int, size: SpotSize) -> None:
        self.id = spot_id
        self.level_number = level_number
        self.size = size
        self._status = SpotStatus.FREE
        self._vehicle: Vehicle | None = None
        self._lock = threading.Lock()

    def fits(self, vehicle: Vehicle) -> bool:
        """A vehicle fits a spot of its own size or larger."""
        return self.size >= vehicle.size        # both are IntEnums

    def is_free(self) -> bool:
        return self._status is SpotStatus.FREE

    def try_occupy(self, vehicle: Vehicle) -> bool:
        """
        Returns False if the spot was taken between the search and this call.
        The caller MUST treat False as "try another spot" — this compare-and-set
        under a lock is what makes concurrent gates safe. The GIL is not enough:
        the check and the assignment are separate bytecodes.
        """
        with self._lock:
            if self._status is not SpotStatus.FREE or not self.fits(vehicle):
                return False
            self._status = SpotStatus.OCCUPIED
            self._vehicle = vehicle
            return True

    def release(self) -> None:
        with self._lock:
            self._status = SpotStatus.FREE
            self._vehicle = None

    @property
    def occupied_by(self) -> Vehicle | None:
        return self._vehicle
\`\`\`

\`ParkingSpot\` is deliberately *not* a dataclass: it has identity and a lifecycle, and two spots with the same size are not the same spot. \`Vehicle\` and \`Money\` are frozen dataclasses because they are values. Making that split explicit is worth a sentence in the interview.

### The ticket

\`\`\`python
from __future__ import annotations

import math
from datetime import datetime


class TicketAlreadyClosed(Exception):
    pass


class Ticket:
    def __init__(
        self,
        ticket_id: str,
        vehicle: Vehicle,
        spot_id: str,
        entry_at: datetime,
    ) -> None:
        self.id = ticket_id
        self.vehicle = vehicle
        self.spot_id = spot_id
        self.entry_at = entry_at
        self._exit_at: datetime | None = None

    def close(self, at: datetime) -> None:
        if self._exit_at is not None:
            raise TicketAlreadyClosed(f"ticket {self.id} already closed")
        self._exit_at = at

    @property
    def is_closed(self) -> bool:
        return self._exit_at is not None

    def duration_minutes(self, now: datetime) -> int:
        end = self._exit_at if self._exit_at is not None else now
        return math.ceil((end - self.entry_at).total_seconds() / 60)
\`\`\`

### The two strategy protocols — the axes of variation

\`\`\`python
from __future__ import annotations

import math
from collections.abc import Sequence
from datetime import datetime
from typing import Protocol


class PricingStrategy(Protocol):
    def price_for(self, ticket: Ticket, now: datetime) -> Money: ...


class HourlyPricing:
    """First hour flat, then per started hour."""

    def __init__(self, first_hour: Money, per_additional_hour: Money) -> None:
        self._first_hour = first_hour
        self._per_additional_hour = per_additional_hour

    def price_for(self, ticket: Ticket, now: datetime) -> Money:
        hours = max(1, math.ceil(ticket.duration_minutes(now) / 60))
        return self._first_hour + self._per_additional_hour * (hours - 1)


class CappedPricing:
    """Everything after the daily cap is free. Added without touching anything else."""

    def __init__(self, inner: PricingStrategy, daily_cap: Money) -> None:
        self._inner = inner
        self._daily_cap = daily_cap

    def price_for(self, ticket: Ticket, now: datetime) -> Money:
        return min(self._inner.price_for(ticket, now), self._daily_cap)


class SpotAssignmentStrategy(Protocol):
    def choose(
        self, spots: Sequence[ParkingSpot], vehicle: Vehicle
    ) -> ParkingSpot | None: ...


class BestFitAssignment:
    """Smallest spot the vehicle fits in, so large spots stay available."""

    def choose(
        self, spots: Sequence[ParkingSpot], vehicle: Vehicle
    ) -> ParkingSpot | None:
        usable = [s for s in spots if s.is_free() and s.fits(vehicle)]
        return min(usable, key=lambda s: s.size, default=None)
\`\`\`

Note that \`CappedPricing\` is a **decorator** over \`PricingStrategy\` — the object-wrapping kind, not the \`@\` kind. That composition is the answer to "what if we add a daily maximum," and it costs zero changes to existing code. Note also that neither strategy class inherits from its protocol: \`Protocol\` is structural, so a plain function wrapped in a tiny adapter, a \`Mock\`, or a third-party class all satisfy it too, which is what makes the test doubles here one-liners.

### Level and lot

\`\`\`python
from __future__ import annotations

import itertools
import threading
from collections.abc import Callable, Sequence
from datetime import datetime
from typing import Protocol


class Level:
    def __init__(self, number: int, spots: Sequence[ParkingSpot]) -> None:
        self.number = number
        self._spots = tuple(spots)

    @property
    def spots(self) -> tuple[ParkingSpot, ...]:
        return self._spots

    def free_spots(self) -> list[ParkingSpot]:
        return [s for s in self._spots if s.is_free()]

    def free_count(self, size: SpotSize) -> int:
        return sum(1 for s in self._spots if s.is_free() and s.size is size)


class ParkingLotError(Exception):
    """Base class so callers can catch the whole family."""


class LotFullError(ParkingLotError):
    def __init__(self, size: VehicleSize) -> None:
        super().__init__(f"no free spot for vehicle size {size.name}")
        self.size = size


class UnknownTicketError(ParkingLotError):
    pass


class PaymentProcessor(Protocol):
    def charge(self, amount: Money) -> None: ...


class ParkingLot:
    def __init__(
        self,
        levels: Sequence[Level],
        assignment: SpotAssignmentStrategy,
        pricing: PricingStrategy,
        clock: Callable[[], datetime] = datetime.now,
    ) -> None:
        self._levels = tuple(levels)
        self._assignment = assignment
        self._pricing = pricing
        self._clock = clock
        self._spots_by_id = {
            spot.id: spot for level in self._levels for spot in level.spots
        }
        self._active_tickets: dict[str, Ticket] = {}
        self._ticket_numbers = itertools.count(1)
        self._lock = threading.Lock()

    def park(self, vehicle: Vehicle) -> Ticket:
        """
        Retries on lost races: another gate may claim the chosen spot between
        choose() and try_occupy(). In a real system the compare-and-set is a
        conditional UPDATE inside a transaction; the retry loop is the same
        shape either way.
        """
        for _attempt in range(3):
            candidates = [s for level in self._levels for s in level.free_spots()]
            spot = self._assignment.choose(candidates, vehicle)
            if spot is None:
                raise LotFullError(vehicle.size)

            if not spot.try_occupy(vehicle):
                continue                      # lost the race; pick again

            ticket = Ticket(
                ticket_id=f"T-{next(self._ticket_numbers)}",
                vehicle=vehicle,
                spot_id=spot.id,
                entry_at=self._clock(),
            )
            with self._lock:
                self._active_tickets[ticket.id] = ticket
            return ticket

        raise LotFullError(vehicle.size)

    def quote(self, ticket_id: str) -> Money:
        """Quote the price without ending the stay — needed by pay-on-foot kiosks."""
        ticket = self._require_active(ticket_id)
        return self._pricing.price_for(ticket, self._clock())

    def leave(self, ticket_id: str, processor: PaymentProcessor) -> Money:
        """Free the spot only after payment succeeds. Order matters."""
        now = self._clock()
        ticket = self._require_active(ticket_id)
        amount = self._pricing.price_for(ticket, now)

        processor.charge(amount)              # raises PaymentDeclined on failure

        ticket.close(now)
        self._spots_by_id[ticket.spot_id].release()
        with self._lock:
            self._active_tickets.pop(ticket_id, None)
        return amount

    def availability(self, size: SpotSize) -> int:
        return sum(level.free_count(size) for level in self._levels)

    def _require_active(self, ticket_id: str) -> Ticket:
        with self._lock:
            ticket = self._active_tickets.get(ticket_id)
        if ticket is None:
            raise UnknownTicketError(f"unknown or already-closed ticket {ticket_id}")
        return ticket
\`\`\`

### Wiring it up

\`\`\`python
levels = [
    Level(
        number=n,
        spots=[
            ParkingSpot(f"L{n}-{i}", n, size)
            for i, size in enumerate([SpotSize.MOTORCYCLE] * 5 + [SpotSize.COMPACT] * 20 + [SpotSize.LARGE] * 5)
        ],
    )
    for n in range(1, 4)
]

lot = ParkingLot(
    levels=levels,
    assignment=BestFitAssignment(),
    pricing=CappedPricing(
        HourlyPricing(first_hour=Money(300), per_additional_hour=Money(200)),
        daily_cap=Money(2_500),
    ),
)

ticket = lot.park(Vehicle("7ABC123", VehicleSize.COMPACT))
# ... later ...
paid = lot.leave(ticket.id, card_processor)
\`\`\`

Testing it is the payoff, and showing this is worth 30 seconds:

\`\`\`python
from datetime import datetime, timedelta


class FakeProcessor:
    def __init__(self) -> None:
        self.charged: list[Money] = []

    def charge(self, amount: Money) -> None:
        self.charged.append(amount)


def test_three_hours_costs_first_hour_plus_two() -> None:
    now = datetime(2026, 1, 1, 9, 0)
    clock = lambda: now                       # frozen time, no sleeping
    lot = ParkingLot(
        levels=[Level(1, [ParkingSpot("s1", 1, SpotSize.COMPACT)])],
        assignment=BestFitAssignment(),
        pricing=HourlyPricing(Money(300), Money(200)),
        clock=clock,
    )

    ticket = lot.park(Vehicle("7ABC123", VehicleSize.COMPACT))
    now = now + timedelta(hours=3)
    processor = FakeProcessor()

    assert lot.leave(ticket.id, processor) == Money(700)
    assert lot.availability(SpotSize.COMPACT) == 1
\`\`\`

\`FakeProcessor\` satisfies the \`PaymentProcessor\` protocol without importing it — that is structural typing paying rent in the test suite.

### The decisions worth defending out loud

- **\`clock\` is injected** as a \`Callable[[], datetime]\`, so pricing is testable without waiting three hours. Never call \`datetime.now()\` deep inside logic you want to test.
- **\`try_occupy\` returns a bool rather than raising**, because losing a race is an expected outcome, not an exceptional one — that is the error-handling principle applied. \`LotFullError\` *is* an exception, because the caller cannot retry its way out of a full lot.
- **The lock is on the spot, not the lot.** A single global lock would serialize every gate; per-spot compare-and-set lets them proceed in parallel and only contend on the same spot.
- **\`Vehicle\` is a frozen dataclass with a \`size\` field instead of \`Car\`/\`Motorcycle\` subclasses**, because the only variation is one value. Subclasses would be inheritance for its own sake.
- **Payment happens before the spot is released.** If it happened after, a declined card would leave the barrier open. Say why the order matters.
- **Pricing and assignment are protocols**, so weekend rates, EV surcharges, and "park near the elevator" are new classes rather than edits.

### Extensions to raise before the interviewer does

- **Monthly passes**: a \`Subscription\` and a \`SubscriptionPricing\` decorator returning \`Money(0)\` for valid passes.
- **Reservations**: \`SpotStatus\` gains \`RESERVED\` and a hold with an expiry; \`BestFitAssignment\` must skip held spots.
- **Multiple lots**: \`ParkingLot\` becomes an aggregate behind a \`LotRegistry\`; \`Ticket\` gains a \`lot_id\`.
- **Persistence**: \`_active_tickets\` and spot status move behind a \`TicketRepository\` and a \`SpotRepository\`, and \`try_occupy\` becomes \`UPDATE spots SET status='OCCUPIED' WHERE id = %s AND status='FREE'\`, checking the affected row count — the same compare-and-set, enforced by the database instead of a \`threading.Lock\`, which is also what makes it correct across multiple processes.
- **Lost ticket**: a flat penalty rate, which is just another \`PricingStrategy\`.`,
    },
    {
      id: "other-lld-problems",
      heading: "Applying the method to the other classic LLD problems",
      markdown: `The same six steps, sketched for the problems you are most likely to be handed.

### Deck of cards

Nouns: \`Suit\` and \`Rank\` (enums), \`Card\` (immutable value object), \`Deck\`, \`Shoe\` (multiple decks, as in blackjack), \`Hand\`, \`Game\`.

\`\`\`python
from __future__ import annotations

import random
from dataclasses import dataclass
from enum import IntEnum, StrEnum


class Suit(StrEnum):
    HEARTS = "H"
    DIAMONDS = "D"
    CLUBS = "C"
    SPADES = "S"


class Rank(IntEnum):
    TWO = 2
    THREE = 3
    FOUR = 4
    FIVE = 5
    SIX = 6
    SEVEN = 7
    EIGHT = 8
    NINE = 9
    TEN = 10
    JACK = 11
    QUEEN = 12
    KING = 13
    ACE = 14


@dataclass(frozen=True, order=True)
class Card:
    rank: Rank
    suit: Suit                       # frozen: hashable, so it works in a set


class Deck:
    def __init__(self, rng: random.Random | None = None) -> None:
        self._rng = rng if rng is not None else random.Random()
        self._cards = [Card(rank, suit) for suit in Suit for rank in Rank]
        self._dealt = 0

    def shuffle(self) -> None:
        """Fisher-Yates: each permutation equally likely, O(n)."""
        for i in range(len(self._cards) - 1, 0, -1):
            j = self._rng.randrange(i + 1)          # note: [0, i], not [0, n-1]
            self._cards[i], self._cards[j] = self._cards[j], self._cards[i]
        self._dealt = 0

    def deal(self) -> Card:
        if self._dealt >= len(self._cards):
            raise IndexError("deck exhausted")
        card = self._cards[self._dealt]
        self._dealt += 1
        return card

    def remaining(self) -> int:
        return len(self._cards) - self._dealt
\`\`\`

The points interviewers look for: **the shuffle must be Fisher-Yates** (the naive "sort by a random key" is biased, and drawing \`j\` from the full range rather than \`[0, i]\` is the classic off-by-one that skews the distribution); the **RNG is injected**, so \`Deck(random.Random(42))\` makes tests deterministic; and in real code you would write \`self._rng.shuffle(self._cards)\`, because \`random.shuffle\` *is* Fisher-Yates — say that, then write the loop out because the interviewer is asking for the algorithm. Finally, keep \`Deck\` game-agnostic and put scoring in a \`BlackjackHand\` or \`PokerHand\`, because rank values differ per game (an ace is 1 or 11 in blackjack, always high in poker).

### Elevator system

Nouns: \`Elevator\`, \`Request\` (with \`source_floor\` and \`direction\` for a hall call vs \`destination_floor\` for a car call), \`ElevatorController\`, \`SchedulingStrategy\`.

The design decisions:

- \`Elevator\` holds \`current_floor\`, a \`Direction\` enum (UP / DOWN / IDLE), a \`DoorState\`, and a **sorted set of stops** — not a queue, because you serve floors in travel order, not request order. Python has no built-in sorted set; a \`heapq\` (one min-heap for up-stops, one max-heap for down-stops) or the \`sortedcontainers\` package is the honest answer, and knowing that the standard library lacks one is itself worth saying.
- \`SchedulingStrategy\` is the axis of variation: \`NearestCar\`, \`Scan\` (the elevator algorithm — keep going in one direction, serving stops, then reverse), \`Fcfs\` for a baseline. Being able to name SCAN and note it is the same idea as a disk-arm scheduler is a genuinely strong moment.
- The state machine matters: IDLE → MOVING → DOOR_OPENING → DOOR_OPEN → DOOR_CLOSING → IDLE. Draw it, and model it as an \`Enum\` with an explicit transition table rather than a pile of booleans.
- Edge cases to raise: door obstruction, overload sensor, emergency stop, a hall call arriving for a floor you are about to pass.

### Vending machine

This one is really a **state machine**, and the expected answer is the State pattern.

States: \`Idle\`, \`HasMoney\`, \`Dispensing\`, \`OutOfStock\`. Each state class implements \`insert_coin\`, \`select_item\`, \`dispense\`, \`refund\`, and returns the next state. Define the shared shape as an \`abc.ABC\` here rather than a \`Protocol\`: the states form a genuine closed family, several of them share "reject this transition" behavior worth inheriting as a default method, and you want the runtime to refuse a half-implemented state — that is exactly the nominal, enforced relationship \`ABC\` provides and \`Protocol\` does not. Either way it beats a nested \`match\` over \`(state, event)\`, and adding a state does not touch the others.

Details that earn credit: money in integer cents, a change-making algorithm that is greedy over available denominations *and* checks it can actually make change before accepting the sale, and an inventory check before taking money rather than after.

### Chess

Nouns: \`Board\` (8×8 of \`Square\`), \`Piece\` (with \`Pawn\`/\`Knight\`/... subclasses), \`Move\`, \`Player\`, \`Game\`.

- \`Piece\` is the rare case where \`abc.ABC\` beats \`Protocol\`: every piece shares state (colour, whether it has moved) and helper code worth inheriting, the set of piece types is closed, and \`@abstractmethod\` on \`legal_moves\` means a half-finished \`Bishop\` fails loudly at construction instead of at move generation.
- \`Piece.legal_moves(board, origin)\` is the polymorphic core: each piece type answers for itself, and \`Game\` never branches on type. (Note \`origin\`, not \`from\` — \`from\` is a Python keyword, so the naming choice is forced.)
- Represent a move as a **frozen dataclass** with enough information to undo it (piece moved, piece captured, castling rights before, en passant square before). That is what makes move/undo — and therefore any search — possible.
- The special rules are where candidates fall down, so name them proactively: castling, en passant, promotion, and the fact that a legal move must not leave your own king in check, which means "generate pseudo-legal moves, then filter by simulating."

### General reminders

- **Draw the class diagram** even roughly. Boxes with names and arrows for relationships communicate faster than talking.
- **Write real method signatures** with type hints. "It has a park method" is much weaker than \`def park(self, vehicle: Vehicle) -> Ticket:\`.
- **Say the tradeoff out loud** whenever you make a choice. "I'm using best-fit rather than first-fit so large spots stay available for large vehicles; first-fit is faster but wastes big spots" is worth more than either choice alone.`,
    },
  ],
  questions: [
    {
      q: "Explain encapsulation. Is a class with getters and setters for every field encapsulated?",
      a: "No — that's a struct with extra typing. Encapsulation isn't about hiding fields for its own sake; it's about the object owning its invariants. If an Account guarantees the balance is never negative, the way to get that guarantee is to make it unreachable through the API callers use: a `_balance_cents` attribute plus `deposit` and `withdraw` methods that enforce the rule. Then when the balance is wrong, there are two places to look instead of every line that touches `.balance_cents`. I'd be precise about Python here: there's no `private` keyword, a leading underscore is a convention meaning 'not part of the API', and double underscores only name-mangle to avoid subclass collisions — so nothing physically stops a caller. That's fine, because the goal was never to defeat an attacker; it's to make the invariant's owner obvious. And Python specifically argues against the getter/setter habit: start with a plain public attribute, and promote it to a `@property` only when access needs behavior. Because a property is source-compatible with an attribute, you can do that later without touching a single caller, so writing the pair up front buys nothing. The real principle is expose behavior, not data.",
      weak: "Encapsulation means making fields private and providing getters and setters to access them safely.",
    },
    {
      q: "Why prefer composition over inheritance? Give me a concrete example.",
      a: "Inheritance forces a single axis of variation onto a domain that usually has several. Take employees: pay model, approval authority, and reporting structure vary independently. With inheritance you need SalariedManager, ContractorApprover, SalariedTechLead — the combinations multiply, that's class explosion. And an object can't sensibly change class, so 'contractor converts to full-time' is a hole; Python will let you reassign `__class__`, which is exactly the hack that proves the hierarchy was wrong. With composition, a Person holds a Compensation and an ApprovalPolicy. New combinations are new objects, not new classes, so it's n + m classes instead of n × m. Conversion is just assigning a new component. Each policy is testable in three lines. In Python I'd declare those axes as `Protocol`s, which means Salaried and Hourly don't inherit from anything and don't even import the abstraction — structural typing keeps the coupling at zero. Inheritance, by contrast, gives you the tightest coupling available: a subclass depends on the parent's internals, so a change inside the parent breaks subclasses that never touched that code. My rule is inheritance for is-a, composition for has-a or behaves-like, and when in doubt compose, because you can always extract a base class later but unwinding a deep hierarchy is a rewrite.",
    },
    {
      q: "What is the Liskov Substitution Principle? Give a violation.",
      a: "A subtype must be usable anywhere its supertype is expected, with no caller needing to know the difference. The classic violation is Square subclassing Rectangle. Geometrically a square is a rectangle, but a *mutable* square isn't a substitutable mutable rectangle: Rectangle's contract implies width and height are independent, so a caller can call `set_width(5)` then `set_height(4)` and expect area 20 — and a Square that keeps itself square returns 16. The subclass broke an assumption the caller was entitled to make. The fix is to drop the inheritance and make both frozen dataclasses that satisfy a `Shape` protocol with an `area` method; with no setters there's no contradictory invariant, and because Protocol is structural they don't need a common base class at all. The practical smells for LSP violations: a subclass that raises `NotImplementedError`, silently ignores a call, tightens a precondition, or forces callers to write `isinstance` checks. That last one is the giveaway — if callers need to know the concrete type, substitutability is already gone.",
    },
    {
      q: "What does the Dependency Inversion Principle actually mean? Isn't it just dependency injection?",
      a: "They're related but not the same, and the difference is the interesting part. Injection is a mechanism — passing a dependency in rather than constructing it. Inversion is about which module *owns the abstraction*. Normally high-level policy depends on low-level detail: OrderService imports PostgresClient, so the business rules point at the database. Inversion means OrderService defines an `OrderRepository` protocol in the domain module, expressed in terms of what the domain needs, and PostgresOrderRepository in the infrastructure module conforms to it. Now the arrow points the other way — the detail depends on the policy. You can inject something and still not have inverted anything: if the protocol lives in the database package and just describes what Postgres can do, you have injection without inversion, and your domain is still coupled to the storage model. In Python the import graph is the giveaway, and it's easy to check — the domain package should import nothing from infrastructure. The practical payoff is an in-memory implementation for fast tests and the freedom to change storage without touching business logic.",
      weak: "It means you should inject your dependencies through the constructor instead of creating them with new.",
    },
    {
      q: "Why is Singleton often considered an anti-pattern?",
      a: "In Python I'd start somewhere most answers don't: a module is already a singleton. It's executed once and cached in `sys.modules`, so a class with `get_instance` and a `_instance` class attribute is ceremony on top of something the language gives you free. That actually strengthens the case against the pattern, because every objection applies to the module version too. It's global mutable state in a costume — anything anywhere can reach it, so you can't reason locally about what changes it. It destroys testability, since tests share the one instance, leak state into each other, and become order-dependent; monkeypatching a global works but you're paying for it in every test. It hides dependencies: a class calling `Config.get_instance()` has a dependency that doesn't appear in `__init__`, so you can't tell what it needs from its signature. Thread-safety is easy to get wrong — the GIL doesn't save you, because the None check and the assignment are separate bytecodes, so two threads can both construct one; if you truly need lazy init, `functools.cache` on a zero-argument factory is the correct idiom. And the lifetime is unmanaged: you can't dispose it or scope it per request, and with a module it persists for the whole process. The better answer nearly always is 'I want a single instance, not a Singleton' — create one at the composition root and inject it. Same shared-object property, no global access, and tests can pass a different one. Legitimate cases exist: stateless caches, connection pools, loggers — `logging.getLogger` is exactly this and it's fine.",
    },
    {
      q: "When would you use the Strategy pattern? How is it different from just using an if/else?",
      a: "You use it when an if/else or match is selecting between interchangeable algorithms and that set keeps growing — shipping costs, pricing rules, sort orders, compression schemes. The difference is what happens when you add the sixth option. With a branch you reopen and re-test a working function every time, risking regressions in the five cases that already worked; with Strategy you add a class and touch nothing existing. It also lets you swap behavior at runtime and test each algorithm in isolation. In Python I'd size the strategy to the job: if it's a single pure computation, the strategy is just a function and the type is `Callable[[Order], int]` — functions are first-class, so there's no need for a class with one method. I'd use a class when the strategy carries configuration or has more than one method, and a `Protocol` to type it so implementations don't inherit anything. It's the concrete mechanism behind open/closed. The honest caveat is that it only pays off along the axis you predicted: if the next change is 'every strategy needs a refund method', you now edit every implementation, so you were closed for the wrong thing. That's why I'd apply it after seeing the change happen twice, not speculatively — two branches that will never grow are better as an if/else than as three files.",
    },
    {
      q: "Explain coupling and cohesion.",
      a: "Coupling is how much one module depends on another's details; cohesion is how strongly the things inside a module belong together. You want low coupling and high cohesion, and honestly every other principle here is a tactic for getting there. In Python you can often see coupling before reading any logic — a domain module that imports psycopg, smtplib, and requests has told you its problem, and a circular import is two modules admitting they're really one. High coupling also shows up as feature envy, a method that mostly reads another object's data; inappropriate intimacy, where two modules reach into each other's underscore-prefixed names; train wrecks like `order.customer.address.country.tax_rate`, where you're now coupled to four classes; and shotgun surgery, where one conceptual change forces edits in eight files. Low cohesion shows up as modules named utils.py, helpers.py, or common.py, which literally mean 'I couldn't describe what this does', and as classes where one set of methods touches attributes A and B while another set touches C and D — that's two classes sharing a name. Stated plainly: low coupling means you can change one thing without a cascade; high cohesion means when you need to change something, you can find it in one place.",
    },
    {
      q: "What's a code smell? Name a few and how you'd fix them.",
      a: "A surface symptom that usually indicates a deeper design problem — it's a place to look, not proof of a bug. Long function: it's doing several things, so extract functions with names that replace the comments. Primitive obsession: domain concepts encoded as str and int, so `def transfer(from_account: str, to_account: str, amount: int)` lets you silently swap arguments — replace with value objects like AccountId and Money as frozen dataclasses, which moves validation into `__post_init__` at one boundary and makes 'add USD to EUR' raise instead of quietly producing a wrong number. Branching on type: that's missing polymorphism, replace the conditional with a method on each type. Feature envy: move the method to the class whose data it uses. Data clumps: fields that always travel together want to be a dataclass. Speculative generality — abstractions built for imagined futures — where the fix is deletion. And a Python-specific one worth naming: a mutable default argument like `def f(items=[])`, which is created once at definition time and shared across every call; default to None and build inside. On process: I refactor only with tests in place, one move at a time, and never mix a refactor with a behavior change in the same commit, because a reviewer can skim a pure rename but a rename hiding a logic change is how bugs ship. With no compiler to catch a mistyped attribute, running mypy in CI is doing real work here too.",
    },
    {
      q: "Why does immutability matter?",
      a: "Several concrete payoffs. Thread safety for free — nothing can change, so there are no races and no locks, which matters more as free-threaded Python removes the GIL's accidental protection. Safe sharing: you can hand an immutable object to anything without a defensive copy, because no callee can corrupt it. Valid hash keys: Python requires `__hash__` and `__eq__` to stay consistent, so mutating a field used in the hash while an object is a dict key makes the entry unreachable — the lookup checks the wrong bucket. That's exactly why tuple is hashable and list isn't, and `@dataclass(frozen=True)` generates a `__hash__` for you while a mutable dataclass doesn't get one. Cheap change detection, since identity comparison is enough. And the invariant is checked once in `__post_init__` and holds forever, instead of being re-checked defensively everywhere. Two Python specifics I'd state precisely: `frozen=True` is real runtime enforcement — assignment raises FrozenInstanceError — unlike `typing.Final`, which only mypy sees; but it's shallow, so a frozen dataclass holding a list still hands out a mutable list, and you want tuple, frozenset, or Mapping for the fields. The cost is allocation, usually irrelevant; when it isn't, persistent structures like pyrsistent give you structural sharing so a copy shares most of its memory.",
    },
    {
      q: "When is a functional style better than OOP?",
      a: "When the problem is a data transformation, when you're writing business rules, when correctness is critical, and when the common change is adding *operations* rather than types. A pure function — output depends only on inputs, no side effects — is trivially testable with no fixtures or mocks, can be reasoned about locally, and is safe to cache and parallelize; `functools.cache` is only correct on a pure function. OOP wins when you have real entities with identity and a lifecycle, where two objects with identical fields are still different things; when you need pluggable implementations behind a protocol; when state genuinely belongs together and must stay consistent; and when the common change is adding types. The dataclass tell is useful here: value objects want `frozen=True`, entities want `eq=False` so identity is what comparison means. That's the expression problem: OO makes adding types easy and operations hard, functional style makes operations easy and types hard — and `functools.singledispatch` is the middle road, letting you add an operation across a fixed set of types without editing any of them. The position I'd actually argue for is objects at the edges, functions in the middle — objects and protocols manage state, identity, and I/O at the boundaries; pure functions do the computation in a dependency-free, trivially testable core. Python makes that easy because module-level functions are first-class citizens, not things you have to hide inside a class.",
    },
    {
      q: "Exceptions or result types?",
      a: "Both, split by whether the failure is expected or exceptional — but I'd start by noting Python has no native Result type and is built around EAFP, so exceptions are the default and that's idiomatic rather than lazy. That gives three tools. For a single expected absence, `User | None` is the answer, and the `find_x` versus `get_x` naming convention makes the choice explicit — `find` returns None and forces the caller to narrow, `get` raises, exactly like `dict.get` versus `dict[key]`. For a closed set of expected domain failures at a boundary — validation, parsing, a payment decision — a result union of two frozen dataclasses, Ok and Err, matched with `match` plus `assert_never`, puts the failures in the signature and makes the type checker enforce the branch. For everything else — dropped connections, missing config, violated invariants — exceptions, with one package-level base class so callers can catch a family. The costs are real on both sides: Python type checkers don't model exceptions at all, so nothing tells you what a function raises; and a Result has no `?` operator, so every layer unwraps and re-wraps by hand, and nothing at runtime forces the caller to check. Getting the split backwards is the actual failure: an exception for an expected case means callers forget something that will definitely happen; a quietly ignorable return value for a real failure means the program continues corrupt. Whichever you use, never swallow an error — `except Exception: pass` turns a crash you could have debugged into corrupt data you can't, and a bare `except:` is worse because it eats KeyboardInterrupt. Add context and re-raise with `raise OrderFailed(...) from err` so `__cause__` preserves the original traceback, and validate at the boundary so failures happen where the context still exists.",
      weak: "I'd use exceptions because that's what the language provides and it keeps the happy path clean.",
    },
    {
      q: "Design a parking lot. How do you start?",
      a: "I'd spend the first three minutes clarifying before writing anything, because jumping to classes is the common failure. What are the core use cases — park, unpark, pay, versus reservations and monthly passes? One lot or a chain? Do multiple gates operate concurrently? What varies: vehicle types, spot types, pricing models? Then I'd state the scope back so we agree. Next I'd pull the nouns out of the problem — lot, level, spot, vehicle, ticket, gate, payment, rate — and the verbs become methods. I'd model entities with enums rather than strings, using IntEnum for sizes so 'a bigger spot fits a smaller vehicle' is a plain comparison, money as integer cents in a frozen dataclass, and ParkingSpot as a regular class because it has identity and a lifecycle while Vehicle and Money are values. Then the key step: find the axes of variation and put a Protocol there. Pricing definitely varies, so PricingStrategy. Spot assignment varies — best-fit versus first-fit versus nearest-to-elevator — so SpotAssignmentStrategy. Those are exactly where the follow-up questions will land. Then I'd write the main flows and call out the concurrency: two gates must not assign the same spot, so occupying a spot is a compare-and-set that can fail and be retried. In-process that's a `threading.Lock` around the check-and-set — and I'd be precise that the GIL doesn't make a check-then-act atomic — and once it's in a database it becomes a conditional UPDATE with `WHERE status='FREE'` checking the affected row count, which is also what makes it correct across processes. Most candidates never mention that race, so naming it is worth real credit.",
    },
    {
      q: "In your parking lot design, why is the price calculated before the spot is released?",
      a: "Ordering around side effects is a design decision. The sequence has to be: compute the price, charge the card, and only then close the ticket and release the spot. If you release the spot first and the payment is declined, the barrier opens and the car leaves without paying — you've made the irreversible change before confirming the reversible one. It's the same reasoning as doing the fallible thing first in any transaction. Related choices I'd defend: the clock is injected as a `Callable[[], datetime]` so pricing is testable without waiting three hours — never call `datetime.now()` deep inside logic you want to test; `try_occupy` returns a bool rather than raising, because losing a race for a spot is an expected outcome, not an exceptional one, while LotFullError is genuinely an exception because no retry helps; the lock lives on the spot rather than the lot, so gates only contend when they pick the same spot instead of serializing everything; and Vehicle is a frozen dataclass with a size field rather than Car and Motorcycle subclasses, because the only difference is one value, so subclassing would be inheritance for its own sake.",
    },
    {
      q: "How would you shuffle a deck of cards?",
      a: "Fisher-Yates, and I'd inject the RNG. Iterate from the last index down to 1, pick j uniformly in [0, i] with `rng.randrange(i + 1)`, and swap positions i and j. That's O(n), in place, and every permutation is equally likely. Two things interviewers watch for: picking j from the full range instead of [0, i] is the classic bug — it produces a biased distribution that looks random but isn't — and sorting by a random key is also biased. I'd also say out loud that `random.shuffle` is already Fisher-Yates, so in production code you'd call it and only write the loop out because the question is about the algorithm. Injecting the RNG matters because otherwise the shuffle can't be tested deterministically: the Deck takes an optional `random.Random`, and tests pass `random.Random(42)`. I'd keep Deck game-agnostic too: Card is a frozen dataclass of rank and suit — frozen so it's hashable and usable in a set — and scoring goes in a BlackjackHand or PokerHand, because rank values are game-specific, an ace being 1 or 11 in blackjack and always high in poker. Baking scoring into Card would couple a general structure to one game.",
    },
    {
      q: "What's the Decorator pattern and when would you use it over inheritance?",
      a: "First I'd disambiguate, because in Python the word is overloaded: the Decorator *pattern* wraps an object that satisfies the same interface and delegates to it, while `@decorator` *syntax* wraps a function or class at definition time. They rhyme, but they're not interchangeable. The pattern: a class holds an inner instance satisfying the same Protocol and adds behavior before or after delegating — caching, logging, retries, rate limiting, auth. Over inheritance the win is combinatorial: with subclasses you'd need CachingLoggingRetryingHttpSource and every other combination, whereas decorators compose at wiring time, so three of them give you every ordering for free, and you can cache in production but not in tests. It's also the answer to 'add a daily price cap' in the parking lot: CappedPricing wrapping any PricingStrategy, with zero changes to existing code. The `@` form is fixed at definition time and applies to every instance, so use it for uniform cross-cutting concerns like `@functools.cache` or a timing decorator — and always use `functools.wraps` inside, or the wrapper loses its name, docstring, and signature, which breaks introspection and test reporting. Two cautions for both forms: order is meaningful — logging outside caching logs cache hits, logging inside doesn't — and a deep stack makes tracebacks harder to read. ASGI middleware is the most familiar example most people have already used.",
    },
    {
      q: "How do you decide when to introduce an abstraction versus keeping code concrete?",
      a: "Every abstraction is a bet that the implementation will change, and it's not free — a Protocol with exactly one implementation that never gets a second is pure indirection, making the code harder to read and nothing easier to change. So I default to concrete and abstract when I have evidence. The rule of three is the practical guide: duplication once is fine, twice you note it, three times you extract. Premature extraction of two things that merely look alike creates a false abstraction, and coupling two unrelated concepts through a shared function is worse than the duplication it replaced — the next change makes one caller need a flag, then another, and you get a function with four booleans. The signals that justify abstracting are: you actually have the second implementation, you need a test double at a boundary like the database or a payment gateway, or you've now edited the same branch three times. Python lowers the cost of waiting, which is part of the argument: because Protocols are structural, you can introduce one later and existing classes satisfy it without being edited, so there's no upfront cost to deferring. And when you do abstract, pick deliberately — Protocol when you want 'anything shaped like this' and easy test doubles, ABC when you want a closed family with enforced implementation and shared code. 'Speculative generality' is in the standard code-smell catalogue for a reason; the fix for it is deletion.",
    },
  ],
};
