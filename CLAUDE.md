# Project Guidelines

## Design changes — mobile is a first-class target

Any design or UI change must be verified to render correctly on mobile, not just desktop. This applies every session and to every plan executed in this repo.

- Test or reason about layouts at mobile viewport widths (≈375px) before considering a UI change complete.
- Use responsive units, fluid typography, and breakpoint-aware styles by default. Avoid fixed widths/heights that break on small screens.
- Animations, hover states, and pointer-only interactions must have sensible mobile equivalents (tap, scroll, or graceful no-op).
- When proposing a design change, explicitly state how it will behave on mobile.
