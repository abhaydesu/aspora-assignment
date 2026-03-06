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

## Bug 3 — Filters Not Updating Dashboard

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

## Bug 4 — Standup Timer Freezes

- **Exact error / console output:** no console error 
- **Steps to reproduce:**
  1. Open the app at `localhost:5173`.
  2. Locate the "Next Standup" timer on the dashboard.
  3. Watch the timer for a few seconds.
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** The countdown timer goes down by one second and then doesn't change. 
- **Root cause — the why:** The `useEffect` had an empty dependency array but referenced the `timeLeft` state inside the `setInterval`. The interval captured the initial value of `timeLeft` when the component mounted, and kept redundantly setting the state to `initialState - 1` every single second. Also, the interval lacked a cleanup function, leaving a timer running in the background.
- **Fix and why it works:** Updated the `useEffect` to recalculate the absolute time difference every second (`setTimeLeft(getSecondsUntilStandup())`) instead of doing relative math (`timeLeft - 1`). Added `return () => clearInterval(clockTimer);` to properly clean the interval when the component unmounts.
- **Connected to another bug?** no

## Bug 5 — Harcoded grid state

- **Exact error / console output:** no console error, visual UX issue.
- **Steps to reproduce:**
  1. Open the app at `localhost:5173` using a mobile device or a narrow browser window (< 768px).
  2. Observe the number of columns in the member grid on the initial load.
- **Viewport / device tested:** Mobile (< 768px)
- **Symptom — what you saw:** The grid forces 3 columns instead of 1 on the initial load.
- **Root cause — the why:** The initial state was hardcoded (`useState(3)`), meaning the component always painted 3 columns on the first render regardless of the actual screen size.
- **Fix and why it works:** Created a `calculateColumns` helper function and Used lazy initialization (`useState(() => calculateColumns())`) so the component instantly calculates the correct layout on the very first render.
- **Connected to another bug?** no

---

## Bug 6 — Window Resize Event Memory Leak

- **Exact error / console output:** no console error.
- **Steps to reproduce:**
  1. Open the app at `localhost:5173`.
  2. Navigate away from the Dashboard to another page, and then back again multiple times.
  3. Resize the window and observe the console logs or memory usage.
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** Navigating away and back to the component trioggers duplicate background event listeners. 
- **Root cause — the why:** The `useEffect` attached a `window.addEventListener` didn't have a cleanup function. So the event listener persisted in memory even after the `<Dashboard>` component was destroyed.
- **Fix and why it works:** Inside the `useEffect`, a cleanup function was implemented.
- **Connected to another bug?** no

## Bug 7 — Keyboard Shortcut Duplicate Listeners

- **Exact error / console output:** no console error
- **Steps to reproduce:**
  1. Open the app at `localhost:5173`.
  2. Navigate back and forth between the 'Dashboard' and 'Activity' pages several times.
  3. Press `Cmd + K` (Mac) or `Ctrl + K` (Windows).
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** Navigating between pages silently duplicates the global `keydown` event listener. A single keystroke eventually triggers the state update multiple times simultaneously, degrading performance.
- **Root cause — the why:** The `useEffect` managing the keydown event listener lacked a cleanup function. Additionally, `currentPage` was unnecessarily included in the dependency array. 
- **Fix and why it works:** Implemented a cleanup function. Changed the dependency array to be empty `[]`. Added `.toLowerCase()` to the key check to ensure the shortcut runs even if Caps Lock or Shift is active.
- **Connected to another bug?** no

## Bug 8 — Search Debouncing & Uncontrolled Input

- **Exact error / console output:** `Warning: A component is changing an uncontrolled input to be controlled.` (Console warning for the input). No console error for the API race condition.
- **Steps to reproduce:**
  1. Open the app at `localhost:5173`.
  2. Open the browser console (to see the uncontrolled input warning).
  3. Type rapidly into the "Search members..." input field.
  4. Observe the browser's Network tab.
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** The console threw a red warning on the very first keystroke. Furthermore, typing rapidly spawned a massive spike of concurrent API requests. Because network speeds vary, older search requests could resolve *after* newer ones, causing the UI to display outdated or mismatched search results.
- **Root cause — the why:** There were two mainly issues here. First, the `query` state was initialized without a default value, causing React to treat the HTML input as "uncontrolled" until the user typed the first character. Second, the search `useEffect` utilized a `setTimeout` to delay the API call, but failed to return a cleanup function. So the pending timers were not cancelled when the `query` changed.
- **Fix and why it works:** Initialized the `query` state with an empty string to ensure React fully controls the input from the initial render, eliminating the console warning. In the `useEffect`a cleanup function was implemented. Now, if a user types a new character before the 300ms window closes, React automatically destroys the old timer, ensuring only one API call is made after the user stops typing.
- **Connected to another bug?** no

## Bug 9 — Notification Click Handler

- **Exact error / console output:** no console error.
- **Steps to reproduce:**
  1. Open the app at `localhost:5173`.
  2. Open the notification dropdown in the header.
  3. Click on the first or second notification in the list.
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** Clicking any notification always showed the notification #-1 in the dropdown.
- **Root cause — the why:** The `bindNotificationHandlers` function used  `var` for declaration inside the loop to generate click handlers. Because `var` is function-scoped, only one `i` variable was created in memory for the entire loop. By the time the user actually clicked a button, the loop had already finished running, meaning `i` was locked at `notifications.length`.
- **Fix and why it works:** Changed `var` to `let i = 0` in the loop signature. Because `let` is strict block-scoped, JavaScript generates a brand-new, distinct `i` variable in memory for every single iteration of the loop.
- **Connected to another bug?** no