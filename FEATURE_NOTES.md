# Search Comments Implementation

## Overview

A full-screen search overlay that fetches 500 comments from `https://jsonplaceholder.typicode.com/comments`, performs client-side filtering, and displays results with highlighted matches, keyboard navigation, and proper loading/error states.

Opened via the **"Search Comments"** sidebar button or the `Ctrl+K` / `⌘K` shortcut. Built entirely with React, TypeScript, and standard DOM APIs — no external libraries.

---

## File Breakdown

| File | Role |
|------|------|
| `src/hooks/useDebounce.ts` | Generic debounce hook — emits a value only after N ms of inactivity |
| `src/hooks/useCommentSearch.ts` | Fetches comments once (cached), filters client-side, guards against race conditions |
| `src/components/Search/SearchOverlay.tsx` | UI component — input, result list, keyboard nav, highlighting, state display |
| `src/components/Search/SearchOverlay.css` | Styling — panel, items, highlight marks, spinner, responsive breakpoints |

---

## Data Flow

```
User types → rawQuery (instant, every keystroke)
                ↓
         useDebounce(300ms)
                ↓
         debouncedQuery
                ↓
         useCommentSearch()
                ↓
         { results, isLoading, error }
                ↓
         SearchOverlay renders visible slice (50 items at a time)
```

---

## Key Implementation Details

### 1. Debouncing (300 ms)

`rawQuery` is bound directly to the input — updates on every keystroke for zero input lag. `useDebounce` delays emitting the value by 300 ms. Only the debounced value triggers the search. If the user types another character before the timer expires, the old timer is cleared and a fresh one starts.

### 2. Fetch-Once, Filter Client-Side

All 500 comments are fetched from JSONPlaceholder on the first search. The response is stored in a **module-level variable** (`let cachedComments`), not React state, so it persists across overlay open/close cycles without triggering re-renders. Subsequent searches skip the network entirely and filter the cached array.

Filtering matches against the `body`, `name`, and `email` fields.

### 3. Race Condition Prevention

A `searchIdRef` is bumped every time the debounced query changes. Each search captures its own snapshot of the counter. After every async boundary (`await fetch`, `await setTimeout`), the search compares its snapshot to the current ref. If they differ, a newer search has started and the stale one is silently abandoned.


### 4. Event-Loop Yield

Before running the `.filter()` over 500 comments, the hook ensures pending React renders and input events are processed first, keeping typing smooth even during broad queries.

### 5. Highlight Algorithm

`highlightMatch(text, query)` walks through the text using `indexOf` (not regex — avoids escaping user-typed special characters) and produces an array of React nodes:

- Plain `string` segments for non-matching parts
- `<mark>` elements for matching substrings (using the original casing from the source text)

No `dangerouslySetInnerHTML` — all output is safe React elements.

### 6. Progressive Rendering

Results render in pages of `PAGE_SIZE = 50`. Only `results.slice(0, visibleCount)` is mounted in the DOM. More items load when:

- The user **scrolls** within 200 px of the list bottom
- The user **arrows down** near the edge of the current window

This keeps the DOM lightweight without requiring an external virtual-scroll library.

### 7. Keyboard Navigation

| Key | Action |
|-----|--------|
| `↓` | Move highlight to next result. Past the absolute last → wrap to first. |
| `↑` | Move highlight to previous result. Before the first → expand all pages, wrap to absolute last. |
| `Enter` | Toggle expand/collapse on the highlighted result (shows full body + metadata). |
| `Esc` | Close the overlay. |

Wrap boundaries check `results.length` (the full dataset), not `visibleResults.length` (the rendered page), so the user can arrow through all results regardless of pagination.

`scrollIntoView({ block: 'nearest' })` keeps the active item visible.

### 8. Result Item Memoisation

Each `ResultItem` is wrapped in `React.memo` + `React.forwardRef`. When the user arrows through the list, only the previously-active and newly-active items re-render — not all 50+ visible items. The `forwardRef` is needed so the parent can call `scrollIntoView` on each `<li>`.



## Constraints Followed

- ✅ No external UI libraries (no MUI, shadcn, Chakra, Radix)
- ✅ No external utility libraries (no lodash, no react-window)
- ✅ Only React, TypeScript, and standard browser/DOM APIs
- ✅ Raw CSS for styling
- ✅ Highlighting rendered as DOM elements, not injected HTML strings
