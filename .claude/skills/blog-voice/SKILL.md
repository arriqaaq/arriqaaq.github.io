---
name: blog-voice
description: |
  Use when drafting, editing, or reviewing blog posts for the Arriqaaq site
  (content/posts/). Covers the site's voice per post type, Islamic writing
  conventions, the frontmatter schema, and the custom markdown directives.
  Also use when asked to "write a post", "humanize a draft", or prepare
  content for this blog.
---

# Arriqaaq blog voice

This blog is the Arriqaaq site (Islamic education: courses, books, podcasts, and
teaching series). Posts live in `content/posts/` as markdown with YAML
frontmatter, rendered by a SvelteKit build with custom remark directives.

The author supplies the substance: the topic, the points, the personal
experience, and any Quran/hadith texts. Your job is drafting and editing in the
house voice, never inventing content.

## Post types and their voices

Match the voice to the post type. Read the named example before drafting.

**Announcements** (book launches, new courses, events) — example:
`my-first-hajj.md`, `book-launch-blissful-union-now-available-in-urdu.md`.
First-person plural ("we"), warm and direct, addresses the reader as part of
the community. Genuine excitement and exclamation marks are house style, as are
emojis in the title and some section headings (🎨 📕 ⌛). Free resources are
announced plainly ("completely free, no strings attached"). Ends with a
concrete ask (download, register, share) or a du'a, never a generic outlook.

**Teaching series** (usul al-fiqh, tafseer, hadith sciences) — example:
`usul-al-fiqh-made-easy-introduction-part-1.md`. Opens with the basmalah line
in italics: `*In the Name of Allah, The Most Gracious, The Most Merciful…*`.
Hooks with a rhetorical question to the reader. Defines Arabic terms by their
root and linguistic meaning before the technical meaning. Quotes Quran and
hadith in blockquotes with citations. Uses `> **Note**:` blockquotes to
reassure beginners. Series posts carry "(Part N)" in the title. Patient,
explanatory register; simplifies without dumbing down.

**Personal essays and magazine pieces** (Unfurl) — example: `time-unfurled.md`.
First-person singular, reflective, contributor-credited ("Compiled by ...").
Emotional honesty, mixed feelings, and Arabic phrases woven in naturally.
Sections separated by `* * *`, each credited to its writer.

## Frontmatter schema

```yaml
---
title: Title Here (emojis allowed for announcements)
slug: kebab-case-slug
type: post
published: "2026-08-23T00:00:00.000Z"
updated: "2026-08-23T00:00:00.000Z"
excerpt: >-
  One to three sentences. Written for humans, not SEO.
feature_image: /images/2026/08/filename.png
tags:
  - fiqh
authors:
  - arriqaaq
featured: false
reading_time: 8
---
```

`reading_time` is minutes, roughly words / 200. Images live under
`/images/YYYY/MM/`. Authors are keys from `content/authors.yaml`.

## Custom directives and formatting

- Images: `::image{src="/images/2026/08/x.png"}`, optionally `width=full` or
  `width=wide`. Plain `![](...)` also appears in older posts; prefer the
  directive in new posts.
- Link cards: `::bookmark{url="..." title="..." description="..." author="..."
  publisher="..." icon="..." thumbnail="..."}`.
- Section breaks: `---` between major sections.
- Headings: `#`/`##`, sometimes bolded. Emoji prefixes only in announcements.

## Islamic conventions (non-negotiable)

- Honorific `(ﷺ)` after mentions of the Prophet; "(peace be upon him)" is also
  used. Keep whichever the author's draft uses.
- Phrases like InshaAllah, Alhamdulillah, "by Allah's grace", "Ahlan wa
  sahlan" are part of the voice. Keep them; never translate them away or
  add them where the author didn't.
- **Never fabricate or paraphrase-as-quotation an ayah, hadith, or scholarly
  quote.** Use only texts the author supplies or that carry a real citation
  (quran.com, sunnah.com reference, or book/number). Never invent a hadith
  grading, narrator, or attribution. If the draft needs a supporting text,
  leave a `<!-- TODO: citation -->` marker and tell the author.
- Quran quotes go in blockquotes with the reference, e.g. `(Quran, 14:24)`.
  Hadith quotes include the collection and number, linked to sunnah.com when
  available.
- Transliteration follows the site's existing casual style (usul al-fiqh,
  Sunnah, madhab). Do not add academic diacritics (ḥadīth, uṣūl).

## Voice rules and anti-AI editing

Draft only from the author's outline, notes, or bullet points. If there is no
substance to work from, ask for it; padding a thin outline into a long post is
the failure mode, not a service.

After drafting, run the **humanizer** skill as an editing pass, giving it 2-3
existing posts of the same type (see examples above) as the voice sample.
These house-style overrides take priority over humanizer's defaults:

- Emojis in titles/headings of announcements are house style (overrides its
  emoji rule).
- Warm exclamations and direct reader address are house style in
  announcements.
- Occasional em dashes and parenthetical asides match the existing corpus.
- Rhetorical-question openers are the established hook for teaching posts.

Still enforce these (the corpus is human, keep it that way):

- No sales-brochure adjectives ("stunning", "vibrant", "breathtaking") except
  when literally describing artwork or illustrations.
- No stock AI vocabulary: delve, tapestry, testament, pivotal, landscape
  (abstract), underscores, fostering.
- No "It's not just X, it's Y", no forced groups of three, no generic
  optimistic endings. End with a du'a, a concrete next step, or the last
  useful fact.
- No heading that is restated by its first sentence.
- Vary sentence length. The existing posts mix long flowing sentences with
  short ones; an even mid-length cadence reads as AI.

For the full write → verify → publish pipeline (statistical lint, prose
pass, frontmatter validation, confirm-before-push), use the `blog-publish`
skill with this repo's `.claude/blog-publish.config.md`; this skill remains
the voice authority it defers to.

## Checklist before saving

1. Frontmatter complete and valid YAML; `reading_time` estimated.
2. Voice matches the post type's example post.
3. Every ayah/hadith has a real citation or a TODO marker.
4. Humanizer pass done with voice samples.
5. File saved as `content/posts/<slug>.md`.
