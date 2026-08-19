/**
 * Exports the handbook as a single self-contained, phone-readable HTML file.
 *
 * Emits two files:
 *   dist/handbook.html          — complete standalone document (transfer to a phone)
 *   dist/handbook.fragment.html — same payload without the doctype/head/body
 *                                 wrapper, for publishing tools that add their own.
 *
 * Run: npm run handbook:export
 */
import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { CHAPTERS, neighbors } from "../src/content/handbook";
import { TRACKS } from "../src/content/handbook/types";

const pipeline = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeStringify);

/** Markdown → HTML, with tables wrapped so they scroll in their own container. */
function md(markdown: string): string {
  const html = String(pipeline.processSync(markdown));
  return html
    .replaceAll("<table>", '<div class="table-wrap"><table>')
    .replaceAll("</table>", "</table></div>");
}

/** Markdown → phrasing content for <summary>: strip a sole <p> wrapper. */
function mdInline(markdown: string): string {
  const html = String(pipeline.processSync(markdown)).trim();
  const sole = /^<p>([\s\S]*)<\/p>$/.exec(html);
  return sole && !sole[1].includes("<p>") ? sole[1] : html;
}

/** Entity-escape a plain string for HTML text or attribute context. */
function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderHome(): string {
  const groups = TRACKS.map((track) => {
    const cards = CHAPTERS.filter((c) => c.track === track.id)
      .map((c) => {
        const search = [c.title, c.summary, ...c.tags].join(" ").toLowerCase();
        return `<a class="card" href="#${esc(c.slug)}" data-slug="${esc(c.slug)}" data-min="${c.estMinutes}" data-search="${esc(search)}">
<h3>${esc(c.title)}</h3>
<p>${esc(c.summary)}</p>
<span class="meta">${c.estMinutes} min · ${c.tags.map(esc).join(" · ")}</span>
</a>`;
      })
      .join("\n");
    return `<div class="track">
<h2>${esc(track.label)}</h2>
<p class="blurb">${esc(track.blurb)}</p>
<div class="cards">
${cards}
</div>
</div>`;
  }).join("\n");

  const totalMinutes = CHAPTERS.reduce((sum, c) => sum + c.estMinutes, 0);
  return `<section id="home" class="view active">
<div class="masthead">
<p class="eyebrow">CS Interview Prep</p>
<h1>The Handbook</h1>
<p class="standfirst">${CHAPTERS.length} chapters · ${Math.round(totalMinutes / 60)} hours of reading · ${CHAPTERS.reduce((n, c) => n + c.questions.length, 0)} drill questions</p>
<p id="progress" hidden></p>
</div>
<div id="resume" hidden><a id="resume-link" href="#"></a><button id="resume-dismiss" type="button" aria-label="Dismiss">×</button></div>
<input id="filter" type="search" placeholder="Filter chapters…" autocomplete="off">
${groups}
</section>`;
}

function renderChapter(c: (typeof CHAPTERS)[number]): string {
  const track = TRACKS.find((t) => t.id === c.track)!;

  const sectionNav = c.sections
    .map((s) => `<a href="#${esc(c.slug)}/${esc(s.id)}">${esc(s.heading)}</a>`)
    .join("\n");

  const sections = c.sections
    .map(
      (s) => `<article id="sec-${esc(c.slug)}-${esc(s.id)}">
<h2>${esc(s.heading)}</h2>
${md(s.markdown)}
</article>`,
    )
    .join("\n");

  const questions = c.questions
    .map((q) => {
      const weak = q.weak
        ? `<div class="weak">${md(q.weak)}</div>`
        : "";
      return `<details><summary>${mdInline(q.q)}</summary>
<div class="answer">${md(q.a)}</div>
${weak}</details>`;
    })
    .join("\n");

  const { prev, next } = neighbors(c.slug);
  const pager = `<nav class="pager">
${prev ? `<a class="prev" href="#${esc(prev.slug)}"><span>Previous</span>${esc(prev.title)}</a>` : `<a class="prev" href="#"><span>Back to</span>Contents</a>`}
${next ? `<a class="next" href="#${esc(next.slug)}"><span>Next</span>${esc(next.title)}</a>` : `<a class="next" href="#"><span>Back to</span>Contents</a>`}
</nav>`;

  return `<section class="view chapter" id="ch-${esc(c.slug)}" data-title="${esc(c.title)}">
<header class="chapter-head">
<p class="eyebrow">${esc(track.label)} · ${c.estMinutes} min</p>
<h1>${esc(c.title)}</h1>
<p class="standfirst">${esc(c.summary)}</p>
</header>
<details class="section-nav"><summary>Sections (${c.sections.length})</summary>
<nav>
${sectionNav}
</nav>
</details>
${sections}
<div class="questions">
<h2>Drill questions (${c.questions.length})</h2>
${questions}
</div>
<button class="mark-read" type="button" data-slug="${esc(c.slug)}">Mark chapter as read</button>
${pager}
</section>`;
}

const LIGHT_VARS = `--bg:#faf9f6;--fg:#1c2733;--muted:#5b6a78;--border:#e4e1d8;
--card:#ffffff;--accent:#0e7490;--accent-fg:#0e7490;--code-bg:#f0f0ea;
--warn-bg:#fdf4e7;--warn-border:#d97706;--warn-label:#92600a;--shadow:rgba(28,39,51,.06);`;

const DARK_VARS = `--bg:#12161b;--fg:#d7dde3;--muted:#8b98a5;--border:#2a323c;
--card:#1a2027;--accent:#2ab5cf;--accent-fg:#4cc3da;--code-bg:#171d24;
--warn-bg:#2a2118;--warn-border:#b45309;--warn-label:#e0a04c;--shadow:rgba(0,0,0,.3);`;

const CSS = `
:root{${LIGHT_VARS}}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${DARK_VARS}}}
:root[data-theme="dark"]{${DARK_VARS}}
:root[data-theme="light"]{${LIGHT_VARS}}

*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);overflow-x:hidden;
  font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
  font-size:1.0625rem;line-height:1.65}
h1,h2,h3,h4,.topbar,.meta,.eyebrow,.blurb,.card p,.section-nav,.pager,summary,#filter,#resume{
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:42rem;margin:0 auto;padding:0 1.125rem 5rem}
h1{font-size:1.75rem;line-height:1.2;letter-spacing:-.015em;text-wrap:balance;margin:.25rem 0 .5rem}
h2{font-size:1.3rem;line-height:1.25;letter-spacing:-.01em;text-wrap:balance;margin:2.25rem 0 .75rem}
h3{font-size:1.08rem;margin:1.5rem 0 .5rem}
h4{font-size:1rem;margin:1.25rem 0 .4rem}
p{margin:.75rem 0}
ul,ol{padding-left:1.4rem;margin:.75rem 0}
li{margin:.3rem 0}
hr{border:0;border-top:1px solid var(--border);margin:2rem 0}
blockquote{margin:1rem 0;padding:.1rem 1rem;border-left:3px solid var(--accent);
  background:var(--code-bg);border-radius:0 6px 6px 0;color:var(--muted)}
strong{color:var(--fg)}
a{color:var(--accent-fg)}

.topbar{position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:.75rem;
  padding:.6rem 1.125rem;background:color-mix(in srgb,var(--bg) 85%,transparent);
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
  border-bottom:1px solid var(--border)}
.topbar a{color:var(--accent-fg);text-decoration:none;font-weight:600;font-size:.9rem;
  white-space:nowrap}
#bar-title{flex:1;min-width:0;border:0;background:none;text-align:left;padding:.2rem 0;
  font-size:.9rem;font-weight:600;color:var(--muted);cursor:pointer;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
#bar-title::after{content:" ▾";color:var(--accent-fg)}
.fontctl{display:flex;gap:.3rem;margin-left:auto}
.fontctl button{border:1px solid var(--border);background:var(--card);color:var(--fg);
  border-radius:8px;font-size:.72rem;font-weight:600;padding:.3rem .55rem;cursor:pointer;
  white-space:nowrap}
#bar-menu{position:fixed;top:3rem;left:.75rem;right:.75rem;z-index:20;
  background:var(--card);border:1px solid var(--border);border-radius:12px;
  box-shadow:0 8px 24px var(--shadow);max-height:60vh;overflow-y:auto;
  padding:.4rem;display:flex;flex-direction:column;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
#bar-menu[hidden]{display:none}
#bar-menu a{padding:.5rem .6rem;border-radius:8px;text-decoration:none;color:var(--fg);
  font-size:.9rem}
#bar-menu a:active{background:var(--code-bg)}

.view{display:none}
.view.active{display:block}

.masthead{padding:2.25rem 0 .5rem}
.eyebrow{text-transform:uppercase;letter-spacing:.09em;font-size:.72rem;font-weight:700;
  color:var(--accent-fg);margin:0 0 .25rem}
.masthead h1{font-size:2.1rem;margin:0}
.standfirst{color:var(--muted);font-size:.95rem;margin:.5rem 0 0}

#filter{width:100%;margin:1.25rem 0 .5rem;padding:.65rem .9rem;font-size:1rem;
  border:1px solid var(--border);border-radius:10px;background:var(--card);color:var(--fg)}
#filter:focus{outline:2px solid var(--accent);outline-offset:1px;border-color:transparent}

#resume{display:flex;align-items:center;gap:.25rem;margin-top:1rem;
  border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:8px;
  background:var(--card)}
#resume[hidden]{display:none}
#resume a{flex:1;padding:.6rem .9rem;text-decoration:none;color:var(--fg);font-size:.9rem}
#resume a b{color:var(--accent-fg)}
#resume button{border:0;background:none;color:var(--muted);font-size:1.2rem;
  padding:.5rem .8rem;cursor:pointer}

.track{margin-top:2rem}
.track h2{margin:0}
.blurb{color:var(--muted);font-size:.9rem;margin:.25rem 0 .9rem}
.cards{display:flex;flex-direction:column;gap:.7rem}
.card{display:block;padding:.9rem 1rem;border:1px solid var(--border);border-radius:12px;
  background:var(--card);text-decoration:none;color:var(--fg);
  box-shadow:0 1px 2px var(--shadow)}
.card h3{margin:0;font-size:1.02rem}
.card p{margin:.3rem 0 .45rem;font-size:.88rem;color:var(--muted);line-height:1.45}
.card .meta{font-size:.75rem;color:var(--accent-fg);font-weight:600}
.card.done{opacity:.72}
.card.done h3::after{content:" ✓";color:var(--accent-fg)}
#progress{color:var(--accent-fg);font-size:.85rem;font-weight:600;margin:.4rem 0 0;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
#progress[hidden]{display:none}
.card[hidden]{display:none}
.track[hidden]{display:none}

.chapter-head{padding:1.75rem 0 .25rem;border-bottom:1px solid var(--border);
  margin-bottom:1rem}
.section-nav{margin:1rem 0;border:1px solid var(--border);border-radius:10px;
  background:var(--card)}
.section-nav>summary{padding:.65rem 1rem;font-weight:600;font-size:.92rem;cursor:pointer}
.section-nav nav{display:flex;flex-direction:column;padding:.25rem .5rem .6rem}
.section-nav nav a{padding:.42rem .5rem;text-decoration:none;font-size:.9rem;
  border-radius:6px;color:var(--fg)}
.section-nav nav a:active{background:var(--code-bg)}

article{scroll-margin-top:3.4rem}
article>h2{padding-top:1rem;border-top:1px solid var(--border);margin-top:2.5rem}

pre{background:var(--code-bg);border:1px solid var(--border);border-radius:10px;
  padding:.8rem 1rem;overflow-x:auto;font-size:.82rem;line-height:1.5}
code{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:.86em;
  background:var(--code-bg);padding:.1em .35em;border-radius:4px}
pre code{background:none;padding:0;font-size:inherit;white-space:pre}

.table-wrap{overflow-x:auto;margin:1rem 0;border:1px solid var(--border);border-radius:10px}
table{border-collapse:collapse;font-size:.85rem;min-width:100%;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
th,td{padding:.5rem .75rem;border-bottom:1px solid var(--border);text-align:left;
  vertical-align:top}
th{background:var(--code-bg);font-weight:650;white-space:nowrap}
tr:last-child td{border-bottom:0}
td{font-variant-numeric:tabular-nums}

.questions{margin-top:3rem}
.questions>h2{border-top:1px solid var(--border);padding-top:1rem}
.questions details{border:1px solid var(--border);border-radius:10px;background:var(--card);
  margin:.6rem 0}
.questions summary{padding:.75rem 1rem;font-weight:600;font-size:.95rem;cursor:pointer;
  line-height:1.4}
.questions .answer,.questions .weak{padding:0 1rem .75rem;font-size:.97rem}
.questions .weak{margin:.25rem 1rem 1rem;padding:.1rem 1rem .6rem;
  background:var(--warn-bg);border-left:3px solid var(--warn-border);border-radius:0 8px 8px 0}
.questions .weak::before{content:"Weak answer";display:block;margin-top:.6rem;
  text-transform:uppercase;letter-spacing:.08em;font-size:.68rem;font-weight:700;
  color:var(--warn-label);font-family:system-ui,-apple-system,sans-serif}

.mark-read{display:block;width:100%;margin-top:2.25rem;padding:.75rem 1rem;
  border:1px solid var(--accent);border-radius:12px;background:var(--card);
  color:var(--accent-fg);font-weight:600;font-size:.9rem;cursor:pointer}
.mark-read.done{border-color:var(--border);color:var(--muted)}

.pager{display:flex;gap:.7rem;margin-top:2.5rem}
.mark-read+.pager{margin-top:.7rem}
.pager a{flex:1;padding:.8rem 1rem;border:1px solid var(--border);border-radius:12px;
  background:var(--card);text-decoration:none;color:var(--fg);font-weight:600;
  font-size:.9rem;line-height:1.35}
.pager a span{display:block;font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;
  color:var(--muted);font-weight:700;margin-bottom:.15rem}
.pager .next{text-align:right}

article p,article li,.answer p,.answer li,.weak p,.weak li{
  -webkit-hyphens:auto;hyphens:auto}
img,svg{max-width:100%}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
`;

// Plain string concat only (no template literals) so nothing here needs
// escaping inside the outer TS template, and no "</script>" appears.
const JS = `
(function () {
  var views = document.querySelectorAll(".view");
  var barTitle = document.getElementById("bar-title");
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  function loadJSON(k) {
    var v = store.get(k);
    if (!v) return {};
    try { return JSON.parse(v); } catch (e) { return {}; }
  }
  function saveJSON(k, obj) { store.set(k, JSON.stringify(obj)); }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var currentSlug = null;
  var restoreNext = false;
  var positions = loadJSON("handbook:pos");
  var readState = loadJSON("handbook:read");

  function setMarkLabel(slug) {
    var btn = document.querySelector('.mark-read[data-slug="' + slug + '"]');
    if (!btn) return;
    var done = !!readState[slug];
    btn.textContent = done ? "✓ Read — tap to unmark" : "Mark chapter as read";
    btn.classList.toggle("done", done);
  }

  function updateHome() {
    var cards = document.querySelectorAll(".card");
    var done = 0, minutesLeft = 0;
    for (var i = 0; i < cards.length; i++) {
      var isRead = !!readState[cards[i].getAttribute("data-slug")];
      cards[i].classList.toggle("done", isRead);
      if (isRead) done++;
      else minutesLeft += parseInt(cards[i].getAttribute("data-min"), 10) || 0;
    }
    var el = document.getElementById("progress");
    if (!done) { el.hidden = true; return; }
    var left = minutesLeft >= 90
      ? "~" + Math.round(minutesLeft / 60) + " h to go"
      : minutesLeft + " min to go";
    el.textContent = done + " of " + cards.length + " chapters read · " +
      (minutesLeft ? left : "all done");
    el.hidden = false;
  }

  function route(animate) {
    var behavior = animate && !reduced ? "smooth" : "instant";
    var hash = decodeURIComponent(location.hash.slice(1));
    var parts = hash.split("/");
    var chapter = parts[0] ? document.getElementById("ch-" + parts[0]) : null;
    var i;
    // Persist the outgoing chapter's tracked position. Never read scrollY here:
    // navigating to "#" natively scrolls to top before hashchange fires.
    if (currentSlug) persistPos();
    for (i = 0; i < views.length; i++) views[i].classList.remove("active");
    closeMenu();
    if (!chapter) {
      currentSlug = null;
      document.getElementById("home").classList.add("active");
      barTitle.hidden = true;
      showResume();
      updateHome();
      window.scrollTo(0, 0);
      return;
    }
    currentSlug = parts[0];
    chapter.classList.add("active");
    barTitle.textContent = chapter.getAttribute("data-title");
    barTitle.hidden = false;
    setMarkLabel(currentSlug);
    store.set("handbook:last", parts[0]);
    store.set("handbook:lastTitle", chapter.getAttribute("data-title"));
    var section = parts[1] ? document.getElementById("sec-" + parts[0] + "-" + parts[1]) : null;
    if (section) {
      section.scrollIntoView({ behavior: behavior });
    } else if ((restoreNext || !animate) && positions[currentSlug]) {
      window.scrollTo(0, positions[currentSlug]);
    } else {
      window.scrollTo(0, 0);
    }
    restoreNext = false;
  }

  var lastSavedY = 0;
  function persistPos() { saveJSON("handbook:pos", positions); }
  function flushExact() {
    if (!currentSlug) return;
    positions[currentSlug] = Math.round(window.scrollY);
    persistPos();
  }
  window.addEventListener("scroll", function () {
    if (!currentSlug) return;
    var y = Math.round(window.scrollY);
    positions[currentSlug] = y;
    if (Math.abs(y - lastSavedY) > 300) { lastSavedY = y; persistPos(); }
    if (y + window.innerHeight >= document.documentElement.scrollHeight - 400 &&
        !readState[currentSlug]) {
      readState[currentSlug] = true;
      saveJSON("handbook:read", readState);
      setMarkLabel(currentSlug);
    }
  }, { passive: true });
  window.addEventListener("pagehide", flushExact);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flushExact();
  });

  var barMenu = document.getElementById("bar-menu");
  function closeMenu() {
    barMenu.hidden = true;
    barTitle.setAttribute("aria-expanded", "false");
  }
  barTitle.addEventListener("click", function () {
    if (!barMenu.hidden) { closeMenu(); return; }
    if (!currentSlug) return;
    var nav = document.querySelector("#ch-" + currentSlug + " .section-nav nav");
    if (!nav) return;
    barMenu.innerHTML = nav.innerHTML;
    barMenu.hidden = false;
    barTitle.setAttribute("aria-expanded", "true");
  });
  barMenu.addEventListener("click", closeMenu);
  document.addEventListener("click", function (e) {
    if (barMenu.hidden) return;
    if (e.target === barTitle || barMenu.contains(e.target)) return;
    closeMenu();
  });

  var FONT_MIN = 14, FONT_MAX = 21;
  var fontPx = parseInt(store.get("handbook:font"), 10);
  if (fontPx >= FONT_MIN && fontPx <= FONT_MAX) {
    document.documentElement.style.fontSize = fontPx + "px";
  } else {
    fontPx = 16;
  }
  function nudgeFont(delta) {
    fontPx = Math.min(FONT_MAX, Math.max(FONT_MIN, fontPx + delta));
    document.documentElement.style.fontSize = fontPx + "px";
    store.set("handbook:font", String(fontPx));
  }
  document.getElementById("font-dec").addEventListener("click", function () { nudgeFont(-1); });
  document.getElementById("font-inc").addEventListener("click", function () { nudgeFont(1); });

  var marks = document.querySelectorAll(".mark-read");
  for (var mi = 0; mi < marks.length; mi++) {
    marks[mi].addEventListener("click", function () {
      var slug = this.getAttribute("data-slug");
      if (readState[slug]) delete readState[slug]; else readState[slug] = true;
      saveJSON("handbook:read", readState);
      setMarkLabel(slug);
    });
  }

  function showResume() {
    var pill = document.getElementById("resume");
    var last = store.get("handbook:last");
    var title = store.get("handbook:lastTitle");
    if (!last || !title) { pill.hidden = true; return; }
    var link = document.getElementById("resume-link");
    link.href = "#" + last;
    link.innerHTML = "Resume reading: <b></b>";
    link.querySelector("b").textContent = title;
    pill.hidden = false;
  }

  document.getElementById("resume-link").addEventListener("click", function () {
    restoreNext = true;
  });

  document.getElementById("resume-dismiss").addEventListener("click", function () {
    store.del("handbook:last");
    store.del("handbook:lastTitle");
    document.getElementById("resume").hidden = true;
  });

  var filter = document.getElementById("filter");
  filter.addEventListener("input", function () {
    var q = filter.value.trim().toLowerCase();
    var tracks = document.querySelectorAll(".track");
    var i, j;
    for (i = 0; i < tracks.length; i++) {
      var cards = tracks[i].querySelectorAll(".card");
      var visible = 0;
      for (j = 0; j < cards.length; j++) {
        var hit = !q || cards[j].getAttribute("data-search").indexOf(q) !== -1;
        cards[j].hidden = !hit;
        if (hit) visible++;
      }
      tracks[i].hidden = visible === 0;
    }
  });

  window.addEventListener("hashchange", function () { route(true); });
  route(false);
})();
`;

function renderContent(): string {
  const chapterViews = CHAPTERS.map(renderChapter).join("\n");
  return `<style>${CSS}</style>
<header class="topbar">
<a class="home-link" href="#">☰ Contents</a>
<button id="bar-title" type="button" hidden aria-expanded="false"></button>
<div class="fontctl"><button id="font-dec" type="button" aria-label="Smaller text">A−</button><button id="font-inc" type="button" aria-label="Larger text">A+</button></div>
</header>
<nav id="bar-menu" hidden></nav>
<main>
${renderHome()}
${chapterViews}
</main>
<script>${JS}<\/script>`;
}

function standaloneWrap(content: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#faf9f6">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#12161b">
<title>CS Interview Handbook</title>
</head>
<body>
${content}
</body>
</html>
`;
}

const outDir = join(import.meta.dirname, "..", "dist");
mkdirSync(outDir, { recursive: true });

const content = renderContent();
const standalonePath = join(outDir, "handbook.html");
const fragmentPath = join(outDir, "handbook.fragment.html");
writeFileSync(standalonePath, standaloneWrap(content));
writeFileSync(fragmentPath, content);

for (const p of [standalonePath, fragmentPath]) {
  console.log(`${p}  ${(statSync(p).size / 1024 / 1024).toFixed(2)} MB`);
}
