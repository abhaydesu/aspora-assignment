## Bug 1 — `<Header>` Infinite Re-render

- **Exact error / console output:** `Uncaught Error: Too many re-renders. React limits the number of renders to prevent an infinite loop.`
- **Steps to reproduce:**
  1. Open the app at `localhost:5173`.
  2. Wait for the initial page load.
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** Blank white screen on load.
- **Root cause — the why:** Calling `setGreeting()` directly in the component body caused a synchronous state update on every render, triggering an endless loop.
- **Fix and why it works:** Refactored to lazy initialization (`useState(() => computeGreeting())`) so the greeting calculates strictly once on the initial mount. 
- **Connected to another bug?** yes. Greeting text improvement- The greeting text was only generated initially, if the user stays on dashboard and the time interval for one greeting passes, the greeting wouldn't change until explicitly refreshed.Fixed simultaneously by adding a `setInterval` to periodically check and update the greeting only when the time boundary crosses.

---

## Bug 2 — Infinite API Calls in `fetchMembers`

- **Exact error / console output:** no console error
- **Steps to reproduce:**
  1. Open the app at `localhost:5173`.
  2. Navigate to the members list view.
  3. Observe the browser's Network tab.
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** Continuous `fetchMembers` network requests silently spamming the backend.
- **Root cause — the why:** The `useEffect` dependency array contained a newly created object literal (`[{ status: filters.status, role: filters.role }]`). React checks referential equality, so it saw a "new" object on every render and re-ran the effect endlessly.
- **Fix and why it works:** Extracted the primitive values directly into the array (`[filters.status, filters.role]`). React correctly compares string/boolean primitives across renders, breaking the loop.
- **Connected to another bug?** Yes, Bug 3. The infinite re-render forced the component to update and masked the improper state updating.

# Bug 3 — Filters Not Updating Dashboard (Direct State Mutation)

- **Exact error / console output:** no console error
- **Steps to reproduce:**
  1. Open the app at `localhost:5173`.
  2. Click on a filter dropdown (e.g., status or role) and select a new value.
  3. Observe the dashboard member-grid.
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** The UI remained completely stagnant. Changing filters did not update the grid.
- **Root cause — the why:** The `updateFilter` function in `FilterContext` was directly mutating the state object using a forced override: `(filters as unknown as Record<string, string>)[key] = value;`. and passing that same object reference back into `setFilters`. Because of which React did not re-render, leaving the UI stale.
- **Fix and why it works:** Replaced the state updation logic using the spread operator. This generates a brand-new object in memory, forcing React to re-render.
- **Connected to another bug?** Yes. Connected to Bug 2, which previously masked this issue via forced, continuous re-renders.