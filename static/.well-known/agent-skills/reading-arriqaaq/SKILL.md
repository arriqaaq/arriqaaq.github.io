---
name: reading-arriqaaq
description: How to consume arriqaaq.com programmatically
---

# Reading arriqaaq.com as an agent

Arriqaaq is a fully prerendered static site — every page is complete HTML with
no client-side rendering required. Machine-friendly entry points:

1. **Start at [`/llms.txt`](https://arriqaaq.com/llms.txt)** — a curated index
   of every page and post with one-line summaries.
2. **Full corpus in one request:**
   [`/llms-full.txt`](https://arriqaaq.com/llms-full.txt) — all posts and pages
   as markdown, each prefixed with a metadata header carrying its canonical URL.
3. **Per-document markdown:** every post or page at
   `https://arriqaaq.com/<slug>/` has a markdown mirror at
   `https://arriqaaq.com/<slug>/index.md`. HTML pages also advertise it via
   `<link rel="alternate" type="text/markdown">`.
4. **URL inventory:** [`/sitemap.xml`](https://arriqaaq.com/sitemap.xml) lists
   every page with last-modified dates.
5. **Recent content:** [`/rss.xml`](https://arriqaaq.com/rss.xml) — the 20
   newest posts with full HTML content.

Content usage signals are declared in
[`/robots.txt`](https://arriqaaq.com/robots.txt) (Content-Signal directives).
