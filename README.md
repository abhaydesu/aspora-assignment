# TeamPulse — Frontend Intern Assignment

A React + TypeScript team activity dashboard. The task was to find and fix bugs in the existing codebase, then build a fully functional Search Comments feature from scratch.

---

## Getting Started

```bash
npm install
npm run dev
```

The app will open at `http://localhost:5173`.

---

## Approach

### Bug Fixing

I started by running the app and methodically working through each layer:

1. **Console-first:** Opened DevTools on page load. The infinite re-render (`Header` greeting) and the uncontrolled input warning surfaced immediately..
2. **Interaction testing:** Clicked every interactive element and observed for crashes, stale state, or incorrect behaviour. This uncovered the filter mutation bug, notification `var` scoping, modal crash on null teams, and the bookmark count issue.
3. **Checked Behaviour:** The intended behaviour of various components listed in the Assignment doc acted as a good reference point to help find bugs.
4. **Responsive check:** Resized the viewport to mobile widths, revealing the hardcoded 3-column grid and the stats cards layout spec violation.
5. **Edge-case probing:** While solving exisitng bugs, new edge cases came forward which needed solving.


### Search Feature

The search was built entirely from scratch with three files:

| File | Purpose |
|------|---------|
| `src/hooks/useDebounce.ts` | Generic debounce hook 
| `src/hooks/useCommentSearch.ts` | Fetches all 500 comments once from JSONPlaceholder, filters client-side|
| `src/components/Search/SearchOverlay.tsx` + `.css` | Full search UI: input, results list, keyboard navigation, match highlighting, loading/error/empty states |


## Key Design Choices

### Debounce over throttle
Debouncing (with delay as 300ms) was chosen over throttling because search should wait for the user to finish typing, not fire mid-word.

### Module-level comment cache
The 500-comment payload is stored in a module-scoped variable, not React state or Context. It survives overlay open/close cycles without re-fetching, and doesn't trigger unnecessary re-renders.

### Progressive rendering instead of virtual scroll
Results render in pages of 50 items, expanding on scroll or keyboard navigation. This avoids the complexity of a full virtual-scroll implementation while keeping the DOM lightweight for broad queries.

### `React.memo` on result items
Each `ResultItem` is memoised so that keyboard navigation only re-renders the previously-active and newly-active items — not all 50+ visible items.

### Safe highlighting via React elements
`highlightMatch()` splits text with `indexOf` and returns `<mark>` elements — no `dangerouslySetInnerHTML`, no XSS risk.

---

## Trade-offs

| Decision | Upside | Downside |
|----------|--------|----------|
| Fetch all 500 comments upfront | Simple client-side search, no repeated network calls, instant subsequent queries | Higher initial payload (~180 KB JSON). Would not scale to 50 K+ comments. |
| 300 ms debounce | Avoids redundant filtering work | Very fast typists may perceive a slight delay before results appear |
| Progressive rendering (50-item pages) | Simple, no library needed, keeps DOM small | Not as smooth as true virtualisation for very rapid scrolling |
| Module-level cache (not Context) | Zero re-render overhead, survives unmounts | Cache never invalidates — stale if comments change server-side (irrelevant for a static API) |
| Hard-coded CSS hex values in overlay | Pixel-perfect match to reference screenshot | Doesn't auto-adapt if the app's CSS custom properties change |
| `setTimeout(…, 0)` yield before filtering | Keeps input responsive during heavy filtering | Adds one frame of latency to search results |

---

## What I'd Improve With More Time

1. **Server-side / paginated search** — Replace the "fetch all 500" approach with a real search API that supports query params and pagination. This would scale to millions of comments.
2. **True virtual scrolling** — Implement a custom virtualised list (fixed-height rows, translate offsets) so that even 10 K results render only ~20 visible DOM nodes.
4. **Fuzzy / ranked search** — Instead of exact substring matching, implement a basic scoring algorithm (e.g., TF-IDF or character-distance) so that near-matches still surface.
5. **Accessibility audit** — Add `aria-live` regions for result count announcements, trap focus inside the overlay, and ensure screen-reader compatibility for all states.
8. **Search history / recent searches** — Persist the last 5 queries in `localStorage` and show them as suggestions in the idle state.
9. **URL-synced search state** — Encode the query in the URL (`?q=voluptatem`) so search results are shareable and survive page refreshes.

---

## Bugs Fixed

18 bugs were identified and fixed. Full details with root causes, reproduction steps, and explanations are in [`BUG_REPORT.md`](./BUG_REPORT.md).

| # | Bug | Commit |
|---|-----|--------|
| 1 | Header infinite re-render | `12ecfb1` |
| 2 | Infinite API calls (object in dep array) | `ab0eadf` |
| 3 | Filters not updating dashboard (state mutation) | `ab0eadf` |
| 4 | Standup timer freezes after first tick | `05cc9f4` |
| 5 | Hardcoded 3-column grid on mobile | `1ad4634` |
| 6 | Window resize event listener leak | `1ad4634` |
| 7 | Keyboard shortcut duplicate listeners | `1ad4634` |
| 8 | Search debouncing & uncontrolled input | `d36dc9a` |
| 9 | Notification click handler (`var` scope) | `aa94063` |
| 10 | Crash on null team member modal | `520f3da` |
| 11 | Activity feed duplication on mount | `520f3da` |
| 12 | Array index used as React key | `520f3da` |
| 13 | Batch assign false success | `1592b98` |
| 14 | Bookmark count ignores filters | `1592b98` |
| 15 | Stats cards 2-column on mobile | `3915327` |
| 16 | Toast animation fails to play | `35e2334` |
| 17 | Toast ID collisions across re-renders | `1ba67ed` |
| 18 | Missing loading/error lifecycle states | `1ba67ed` |

---

## Time Log

| Task | Approx. Time |
|------|-------------|
| Initial exploration & understanding the codebase | ~0.5 hr |
| Bug hunting & fixing (18 bugs) | ~3.5 hrs |
| Search feature (hooks, component, CSS) | ~2.5 hrs |
| UI polish & bug-report write-up | ~1 hr |
| README, docs & final review | ~1 hr |
| **Total** | **~9 hrs** |

---

## Stack

- React
- TypeScript 
- Raw CSS 

