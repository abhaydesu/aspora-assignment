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

## Bug 10 — Application Crash on Unassigned Member Modal

- **Exact error / console output:** `Uncaught TypeError: Cannot read properties of null (reading 'name') at getTeamDisplay (helpers.ts:5:46)`
- **Steps to reproduce:**
  1. Open the app at `localhost:5173`.
  2. Locate a member on the dashboard who is "Unassigned".
  3. Click their card to open the Member Modal.
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** The entire React application crashed to a white screen the moment the card was clicked.
- **Root cause — the why:** The `getTeamDisplay` helper function checked if the member's team was an object using `typeof member.team === 'object'`. But, `typeof null` evaluates to `'object'`. Therefore, for unassigned members, the condition passed, and the code attempted to access the `.name` property on a `null` value, triggering a `TypeError`.
- **Fix and why it works:** Updated the conditional logic to also check if `member.team` exists. Since `null` is a falsy value, the condition fails immediately for unassigned members.
- **Connected to another bug?** no

## Bug 11 — Activity Feed Duplicates on Mount

- **Exact error / console output:** no console error (visual data duplication).
- **Steps to reproduce:**
  1. Open the app at `localhost:5173`.
  2. Navigate to the Activity Feed page.
  3. Observe the list of activities on initial load.
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** Every item in the activity feed was duplicated. 
- **Root cause — the why:** The `useEffect` responsible for fetching initial data used a state update to append incoming data: `setActivities(prev => [...prev, ...data])`. In development, React 18's `<StrictMode>` intentionally double-mounts components. This fired two concurrent API requests. When both resolved, the second request appended its data directly onto the results of the first, causing duplication.
- **Fix and why it works:** Changed the state update logic to `setActivities(data)`. Because this is an initial page load, replacing the entire array instead of appending guarantees that even if Strict Mode fetches the data twice, the state is simply overwritten with the exact same correct array.
- **Connected to another bug?** no

## Bug 12 — Activity Feed - Index as Key

- **Exact error / console output:** no console error (visual state mismatch).
- **Steps to reproduce:**
  1. Open the app and navigate to the Activity Feed page.
  2. Type a unique message into the "Add note..." input field of the very first activity in the list.
  3. Change the Sort dropdown from "Newest First" to "Oldest First" (or use the filter text input).
  4. Observe the text in the input fields after the list reorders.
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** The text typed into an activity's input field did not stay with the correct activity when the list was reordered. Instead, the text stayed permanently locked to its physical position on the screen.
- **Root cause — the why:** The `.map()` function rendering the activity list used the array `index` as the React `key` prop (`key={index}`). When the array was sorted or filtered, the data objects changed positions, but the index sequence (0, 1, 2...) remained identical, leaving the input's internal state stranded in the wrong row.
- **Fix and why it works:** Changed the `key` prop to use  `activity.id`. By giving React a unique ID instead of an index, React is forced to track the specific DOM node tied to that exact data object, moving the input state along with the item whenever the array is reordered.
- **Connected to another bug?** no

## Bug 13 — Batch Assignment False Success

- **Exact error / console output:** no console error.
- **Steps to reproduce:**
  1. Open the app and navigate to the Activity Feed page.
  2. Select multiple activities using the checkboxes.
  4. Click the "Batch Assign Role" button.
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** The "All roles updated!" success toast appeared instantly on the screen. If any request failed, the UI ignored it entirely and still declared a success.
- **Root cause — the why:** The `batchAssignRole` utility function used `forEach` to iterate over the member IDs and trigger the `async` update functions. Because `forEach` is strictly synchronous, it does not `await` promises. It simply fired moved to the next line of code, triggering the `onSuccess()` callback in a `setTimeout` before the server had actually processed the updates.
- **Fix and why it works:** Refactored the iteration to use `.map()` instead of `.forEach()`, which transforms the array of IDs into an array of pending Promises. Wrapped this in `await Promise.allSettled(...)` to force JavaScript to pause execution until every single request finishes. Finally, added logic to count the rejected promises in the results array.
- **Connected to another bug?** no

## Bug 14 — Bookmarks Count with Filters

- **Exact error / console output:** no console error (logical UI mismatch).
- **Steps to reproduce:**
  1. Open the app at `localhost:5173`.
  2. Bookmark 3 different members.
  3. Use the sidebar to filter the dashboard by a specific role (e.g., "Designer") so that only 1 of your bookmarked members is visible on the screen.
  4. Look at the "Bookmarked" counter at the top of the grid.
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** The "Bookmarked" count always displayed the total number of bookmarks, regardless of current filters.
- **Root cause — the why:** The UI was hardcoded to render `{bookmarks.size}`, the counter remained static when filters were applied.
- **Fix and why it works:** Replaced `{bookmarks.size}` with derived state logic. Created a `visibleBookmarkedCount` variable that filters the currently displayed array. So the count now dynamically stays perfectly in sync with whatever data is actively on the screen.
- **Connected to another bug?** no

## Bug 15 — Stats Cards Layout Breaks Spec on Mobile 

- **Exact error / console output:** no console error.
- **Steps to reproduce:**
  1. Open the app at `localhost:5173`.
  2. Resize the browser window to a mobile width (768px or smaller) or use Chrome DevTools device simulation.
  3. Look at the Stats Cards at the top of the dashboard.
- **Viewport / device tested:** Mobile (< 768px)
- **Symptom — what you saw:** On mobile screens, the stats cards scrunched together into 2 columns. This violates the spec, which dictates they should be in a single column.
- **Root cause — the why:** The CSS media query for the stats grid was incorrectly written to apply `grid-template-columns: 1fr 1fr;`. This forced the browser to show two columns in mobile viewport.
- **Fix and why it works:** Updated the CSS media query for the `.stats-cards` container at the `768px` breakpoint to use `grid-template-columns: 1fr;`. This ensures that on mobile devices, each card takes up 100% of the available fractional space,in a single column.
- **Connected to another bug?** no

## Bug 16 — Toast Animation Fails to Play

- **Exact error / console output:** no console error
- **Steps to reproduce:**
  1. Open the app at `localhost:5173`.
  2. Trigger a toast notification
  3. Observe how the toast notification enters the screen.
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** The toast notification instantly snapped onto the screen instead of sliding in smoothly. The CSS transition completely failed to execute.
- **Root cause — the why:** The `ToastItem` component was hardcoded to mount with the `toast--visible` class already applied. A CSS `transition` requires the browser to paint an initial "before" state and then detect a change to the "after" state . Because the component was injected into the DOM already holding the final state class, the browser skipped the transition entirely and painted it at its final position.
- **Fix and why it works:** Replaced the CSS `transition` and `.toast--visible` class logic with a pure CSS `@keyframes` `animation` applied directly to the base `.toast` class, resulting in a smooth slide-in effect.
- **Connected to another bug?** no

## Bug 17 — Toast ID Collisions

- **Exact error / console output:** no console error
- **Steps to reproduce:**
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** nextId was defined as a standard local variable within a functional component, it would re-initialize to 0 every time React re-rendered the provider.
- **Root cause — the why:** Aunctional components in React are functions that re-run entirely on every render. Any variable declared with let or const inside the function body does not persist its value.
- **Fix and why it works:** Replaced the local variable with `useRef()` hook, because values decalred using useRef persist through re-renders.
- **Connected to another bug?** no

## Bug 18 — Missing Data Lifecycle States (Loading/Error)

- **Exact error / console output:** No console error
- **Steps to reproduce:**
    1. Open the app and navigate to the Dashboard.
    2. Simulate a slow network (Throttling: Slow 3G) in the browser's Network tab.
    3. Observe the `MemberGrid` area while the data is fetching.
    4. Simulate an API failure and observe the result.
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** On initial load or when filters were changed, the grid immediately displayed the "No members found" message even while the data was still being fetched.
- **Root cause — the why:** The `MemberGrid` and `ActivityFeed` components only handled the "Success" state of the `fetch` promise. 
- **Fix and why it works:** Introduced `isLoading` and `error` states to the data-fetching components. 
    1. Added `setIsLoading(true)` at the start of the `useEffect` and `false` after the promise settles.
    2. Added a `.catch()` block to capture API failures and update the `error` state.
    3. Implemented conditional early returns to display a loading indicator or error message, ensuring the "No members found" message only appears if the API successfully returns an empty array.
- **Connected to another bug?** No

## Bug 19 — Header Search & Notification Dropdowns Don't Close

- **Exact error / console output:** No console error
- **Steps to reproduce:**
    1. Open the app at `localhost:5173`.
    2. Type in the member search box to see search results dropdown.
    3. Click outside the search box or elsewhere on the page.
    4. Observe that the dropdown stays open.
    5. Repeat with the notification bell — toggle it open, then click elsewhere.
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** Both dropdowns persist on screen indefinitely. Only way to close them is to clear the search query or toggle the bell again.
- **Root cause — the why:** The `Header` component had no click-outside handlers for the search results dropdown, and the notification dropdown click-outside handler did not cover the search dropdown. Additionally, clicking on a search result item did nothing, leaving the results visible after selection.
- **Fix and why it works:** 
    1. Added a `searchRef` to the search container and included it in the existing click-outside handler.
    2. Updated `handleClickOutside` to check both `notificationRef` and `searchRef`, closing whichever dropdown the user clicked outside.
    3. Added an `onClick` handler to search result items that clears the query and results when a result is selected.
- **Connected to another bug?** No

---

## Bug 20 — MemberModal Tag Addition Mutates Original Array

- **Exact error / console output:** No console error
- **Steps to reproduce:**
  1. Open the app at `localhost:5173`.
  2. Click on a member card to open the modal.
  3. Add a new tag.
  4. Open the same member's modal again and observe the tag count.
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** Tags appeared to add correctly in the modal, but the mutation could cause stale renders and subtle state inconsistencies — the original member object in the grid's state array was silently modified in place.
- **Root cause — the why:** `{ ...selectedMember }` is a shallow copy. The `tags` property is an array (a reference type), so `updated.tags` and `selectedMember.tags` pointed to the same array in memory. Calling `.push()` on `updated.tags` mutated the original directly, bypassing React's immutability contract.
- **Fix and why it works:** Replaced the spread-then-push pattern with `{ ...selectedMember, tags: [...selectedMember.tags, newTag.trim()] }`. This creates a fresh array in the same spread operation, so the original member's tag array is never touched.
- **Connected to another bug?** Yes — Bug 25 (tag persistence regression).

---

## Bug 21 — API Bookmarks Ignored on Load

- **Exact error / console output:** No console error (visual state mismatch)
- **Steps to reproduce:**
  1. Open the app at `localhost:5173`.
  2. Observe members that have `bookmarked: true` in the seed data (e.g., Aisha Patel).
  3. Check whether their bookmark star is golden on initial load.
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** Members seeded with `bookmarked: true` appeared un-bookmarked (empty star) until the user manually clicked the star.
- **Root cause — the why:** The local `bookmarks` Set was initialised as `new Set()` (empty). The `displayMembers` derivation overrode every member's `bookmarked` field with `bookmarks.has(m.id)`, so the API value was discarded entirely on every render.
- **Fix and why it works:** After fetching, the Set is seeded from the returned data: `data.forEach(m => { if (m.bookmarked) seeded.add(m.id) })`. Using the functional updater form preserves any bookmarks the user has toggled in a previous filter-refresh cycle.
- **Connected to another bug?** No

---

## Bug 22 — Activity Feed Checkboxes Track Member, Not Activity

- **Exact error / console output:** No console error (incorrect UX behaviour)
- **Steps to reproduce:**
  1. Open the app and navigate to the Activity Feed.
  2. Find two activities that belong to the same member.
  3. Check the checkbox on one of them.
  4. Observe the other activity's checkbox.
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** Checking one activity auto-checked all other activities from the same member. Unchecking either one unchecked all of them simultaneously. Additionally, checking two separate activities from the same member created duplicate `memberId` entries in `selectedIds`.
- **Root cause — the why:** The checkbox state was keyed on `activity.memberId` instead of `activity.id`. Multiple activities can share the same `memberId`, so they shared a single checked state.
- **Fix and why it works:** Changed `selectedIds` to track `activity.id` (unique per activity). When "Batch Assign Role" is triggered, the handler derives unique member IDs from the selected activity IDs using `new Set(activities.filter(a => selectedIds.includes(a.id)).map(a => a.memberId))`, so each member is only updated once even if multiple of their activities were selected.
- **Connected to another bug?** No

## Bug 23 — Tag Persistence Regression + No Tag Removal

- **Exact error / console output:** No console error (silent data loss)
- **Steps to reproduce:**
  1. Open the app and click a member card.
  2. Add a tag in the modal, then close it.
  3. Re-open the same member's modal.
  4. Observe whether the added tag is still present.
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** Newly added tags disappeared when the modal was closed and reopened. Additionally, there was no way to remove existing tags — no delete button existed.
- **Root cause — the why:** `onUpdateMember` in Dashboard only updated `selectedMember` (the modal's local state) — the `members` array inside `MemberGrid` was never updated. When the modal was reopened, `MemberGrid` passed the original stale member object back, discarding any tag changes.
- **Fix and why it works:**
  1. **Persistence:** `Dashboard` now passes `updatedMember={selectedMember}` to `MemberGrid`. A new `useEffect` in `MemberGrid` watches `updatedMember` and syncs it into the `members` array: `setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m))`.
  2. **Removal:** Added `handleRemoveTag` in `MemberModal` using immutable `.filter()`. Each tag chip now renders a `×` button (`.member-modal__tag-remove`) that calls the handler on click.
- **Connected to another bug?** Yes — Bug 20 (shallow copy mutation).

---

## Bug 24 — Header Search Result Click Does Nothing

- **Exact error / console output:** No console error (broken navigation)
- **Steps to reproduce:**
  1. Open the app at `localhost:5173`.
  2. Type a member name into the header search box.
  3. Click on any result in the dropdown.
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** Clicking a search result closed the dropdown (after the Bug 19 fix) but did not navigate to the Dashboard or open the member's detail modal. The user had no way to act on a result.
- **Root cause — the why:** The result items had no `onClick` wired to any navigation or member-selection logic. `Header` also had no `onSelectMember` prop, so there was no channel to propagate a selection upward.
- **Fix and why it works:** Lifted member selection state to `App.tsx` as `pendingMember`. `Header` now accepts `onSelectMember`, which sets `pendingMember` and navigates to `dashboard`. `Dashboard` accepts `initialMember` and a `useEffect` syncs it into local `selectedMember` state, opening the modal immediately. `onMemberModalClosed` clears `pendingMember` so re-navigating later doesn't accidentally re-open the modal.
- **Connected to another bug?** Yes — Bug 19 (search dropdown not closing).

---

## Bug 25 — No Way to Reset All Filters at Once

- **Exact error / console output:** No console error (UX gap)
- **Steps to reproduce:**
  1. Open the app and set both a Status filter and a Role filter in the sidebar.
  2. Try to clear both filters with a single interaction.
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** There was no "Clear filters" button. The user had to manually reset the Status radio back to "All Statuses" and the Role select back to "All Roles" — two separate interactions.
- **Root cause — the why:** `FilterContext` only exposed `updateFilter` (one key at a time). No bulk-reset function existed, and the Sidebar had no UI for it.
- **Fix and why it works:** Added `clearFilters: () => setFilters({ status: '', role: '' })` to `FilterContext`. In the Sidebar, the "Filters" heading row is now a flex container with a conditionally rendered "Clear" button that appears only when `filters.status || filters.role` is truthy, and disappears once both are reset.
- **Connected to another bug?** No

---

## Bug 26 — Keyboard Shortcut Label Hardcoded to `⌘K` on All Platforms

- **Exact error / console output:** No console error (incorrect UI label)
- **Steps to reproduce:**
  1. Open the app on a Windows or Linux machine.
  2. Observe the keyboard shortcut hint next to "Search Comments" in the sidebar.
- **Viewport / device tested:** Windows Chrome, Linux Chrome
- **Symptom — what you saw:** The shortcut badge always displayed `⌘K` (Mac symbol) even on Windows/Linux where the correct shortcut is `Ctrl+K`.
- **Root cause — the why:** The `<kbd>` element in `Sidebar.tsx` had the label hardcoded to `⌘K`. The keyboard handler in `App.tsx` already correctly accepted both `e.metaKey` and `e.ctrlKey`, but the visual label never reflected this.
- **Fix and why it works:** Added a module-level `isMac` constant using `navigator.platform` (`/mac/i` test). The `<kbd>` now renders `{isMac ? '⌘K' : 'Ctrl+K'}` — evaluated once at load time with no re-render cost.
- **Connected to another bug?** No