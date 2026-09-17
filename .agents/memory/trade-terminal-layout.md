---
name: Single-window terminal layout
description: Layout rule for focused trading terminal pages and responsive overflow behavior.
---

Focused trading pages should present the full terminal as one viewport-contained composition rather than combining a fixed inner scroller with a scrolling document or navigation rail.

**Why:** Nested scroll containers made the terminal feel like two separate boxes and pushed its detail controls below the visible trading surface.

**How to apply:** Keep global navigation/status compact, remove unrelated page chrome on the focused terminal route, fit the primary panels and detail tabs into the desktop viewport, and restore normal document flow on mobile.