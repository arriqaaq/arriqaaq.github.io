# Markdown for Agents — edge negotiation

Goal: `GET` any page with `Accept: text/markdown` returns the page as
markdown (`Content-Type: text/markdown` + `x-markdown-tokens`), while
browsers keep getting HTML on the same URL.

## What already works without any of this

The static build ships a markdown mirror next to every HTML page, and
GitHub Pages serves `.md` files as `text/markdown; charset=utf-8`:

- `https://arriqaaq.com/index.md` — home page
- `https://arriqaaq.com/<slug>/index.md` — every post and page
- `https://arriqaaq.com/tag/<slug>/index.md`, `/author/<slug>/index.md`,
  `/page/<n>/index.md` — listing pages
- `https://arriqaaq.com/llms.txt`, `/llms-full.txt`

What a static host **cannot** do is vary a response on the `Accept`
header — it always returns the same file for a URL. The negotiation
step needs compute at the edge. Every option below requires the same
one-time onboarding: add `arriqaaq.com` to a Cloudflare account (Free
plan works for A and B) and move the nameservers there from Wix
(`ns2/ns3.wixdns.net`).

## Option A — migrate hosting to Cloudflare Pages

Drafted in-tree already: `functions/_middleware.js` does the
negotiation (serving the `index.md` mirrors) and adds RFC 8288 `Link`
headers; `static/_routes.json` and `static/_headers` scope it;
`.github/workflows/deploy-cloudflare.yml` deploys `build/` to the
Pages project `arriqaaq` on push to main.

To go live: create the Pages project, add `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` repo secrets, commit those files, then point
the `arriqaaq.com` DNS record at the Pages project (and retire the
GitHub Pages deploy when satisfied).

## Option B — keep GitHub Pages, proxy through a Cloudflare zone Worker

`cloudflare/markdown-negotiation-worker.js` implements the same
negotiation as a zone Worker in front of the existing GitHub Pages
origin — no hosting migration. After onboarding the zone (keep the
four GitHub Pages A records `185.199.108–111.153`, Proxied/orange
cloud, SSL mode **Full**):

```sh
npx wrangler login
npx wrangler deploy -c cloudflare/wrangler.toml
```

The route `arriqaaq.com/*` is declared in `wrangler.toml`. Pages
without a mirror fall back to normal HTML, so the Worker can never
break a URL.

## Option C — built-in Markdown for Agents (no code)

On a **Pro or higher** zone, Cloudflare converts HTML to markdown at
the edge automatically: dashboard → zone → **AI Crawl Control** →
enable **Markdown for Agents**. Docs:
<https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/>

## Verify (any option)

```sh
# markdown negotiation
curl -sI -H "Accept: text/markdown" https://arriqaaq.com/ | grep -iE "content-type|x-markdown-tokens"
# → content-type: text/markdown; charset=utf-8
# → x-markdown-tokens: <estimate>

# browsers still get HTML
curl -sI https://arriqaaq.com/ | grep -i content-type
# → content-type: text/html; charset=utf-8

# full agent-readiness scan
curl -s -X POST https://isitagentready.com/api/scan \
  -H "Content-Type: application/json" -d '{"url":"https://arriqaaq.com"}' \
  | jq '.checks.contentAccessibility.markdownNegotiation.status'
# → "pass"
```
