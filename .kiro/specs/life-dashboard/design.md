  # Design Document: Life Dashboard

## Overview

Life Dashboard is a single-page personal productivity web application built with plain HTML, CSS, and vanilla JavaScript. It runs entirely in the browser with zero server-side dependencies and uses `localStorage` for all persistence. The design covers the full, already-implemented feature set plus six specific gaps that need to be fixed to satisfy the requirements document.

The three source files are strictly separated by concern:

- `index.html` — semantic document structure, ARIA roles, element IDs that the JS references
- `css/style.css` — all visual presentation via CSS custom properties; never touched by JS except that JS toggles `data-theme` on `<html>`
- `js/script.js` — all runtime behaviour: state, event handling, DOM mutation, localStorage I/O, timers, Web Audio

No build step, no modules, no transpilation. The script is loaded with `defer` so it runs after the DOM is parsed.

---

## Architecture

### File relationships

```
index.html
 ├─ <link rel="stylesheet" href="css/style.css">   (visual layer)
 └─ <script src="js/script.js" defer>              (behaviour layer)
```

The HTML establishes element IDs that `script.js` caches at startup into the `els` object. The CSS exposes theme tokens via `--bg`, `--ink`, `--accent`, etc. on `:root`, with a `[data-theme="dark"]` override block. JavaScript never writes inline styles; it only sets `document.documentElement.dataset.theme`.

### Module structure inside `script.js`

Because the project uses no ES modules, the single script is organised by convention into sequential, co-located sections:

| Section | Responsibility |
|---|---|
| Constants & storage keys | `STORAGE_KEYS`, limits, defaults |
| Storage helpers | `loadText`, `saveText`, `loadList`, `saveList` |
| Utilities | `makeId`, `cleanText`, `makeButton`, `normalizeUrl` |
| Theme | `applyTheme`, `initTheme`, `toggleTheme` |
| Clock / Greeting | `updateClock`, `getGreeting`, `renderGreeting` |
| Name form | `openNameForm`, `closeNameForm`, `saveName` |
| Focus Timer | `formatTime`, `startTimer`, `stopTimer`, `resetTimer`, `tickTimer`, `renderTimer` |
| Task List | `buildTaskRow`, `buildEditRow`, `renderTasks`, `addTask`, `startEdit`, `cancelEdit`, `saveEdit`, `toggleTask`, `deleteTask`, event handlers |
| Quick Links | `renderLinks`, `addLink`, event handlers |
| `init()` | Wires all event listeners, calls first-render functions |

### Initialisation order

```
init()
  1. initTheme()           ← must run first to avoid theme flash
  2. updateClock()         → setInterval(updateClock, 1000)
  3. renderTimer()
  4. renderTasks()
  5. renderLinks()
  6. attach all event listeners
```

---

## Components and Interfaces

### 1. Masthead (Clock, Date, Greeting, Name Form, Theme Toggle)

**Elements:** `#date`, `#clock`, `#greeting`, `#name-open`, `#name-form`, `#name-input`, `#name-cancel`, `#theme-toggle`

**Behaviour:**
- `updateClock()` runs every 1 000 ms via `setInterval`. It writes to `#date` and `#clock`, then calls `renderGreeting(now.getHours())`.
- `renderGreeting(hour)` reads the module-level `userName` variable, delegates to `getGreeting(hour)` for the salutation, and composes the final string. It avoids unnecessary DOM writes by comparing the new text to the current `textContent`.
- The Name Form is toggled via `openNameForm()` / `closeNameForm()`. Focus is managed explicitly: `openNameForm` calls `nameInput.focus()` + `nameInput.select()`; `closeNameForm` returns focus to `nameOpen`.
- `saveName(event)` calls `cleanText()`, enforces the 50-character limit (Gap 1), saves to `localStorage`, then calls `closeNameForm()`.

**Gap 1 — Name max-length (Req 3 AC 13):**

The HTML attribute `maxlength="30"` on `#name-input` must be raised to `50`. The JS `saveName()` function must also add a character-limit guard:

```
const MAX_NAME_LENGTH = 50;

function saveName(event) {
  event.preventDefault();
  const cleaned = cleanText(els.nameInput.value);
  if (cleaned.length > MAX_NAME_LENGTH) {
    setNameMessage(`Name must be ${MAX_NAME_LENGTH} characters or fewer.`);
    return;
  }
  userName = cleaned;
  saveText(STORAGE_KEYS.name, userName);
  renderGreeting(new Date().getHours());
  closeNameForm();
}
```

This requires a `#name-message` element in the HTML and a `setNameMessage()` helper, analogous to the existing `setTaskMessage()`.

**Gap 2 — `aria-pressed` on Theme Toggle (Req 4 AC 7–8):**

`applyTheme(theme)` must set `aria-pressed` on `#theme-toggle` alongside the label text:

```
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  els.themeToggle.textContent =
    theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  els.themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
}
```

**Gap 6 — Theme flash prevention (Req 13 AC 2):**

`initTheme()` already runs as the first call inside `init()`, which runs synchronously on `DOMContentLoaded` (the `defer` attribute ensures this). Because `script.js` is deferred there is a window between HTML parse and script execution where `data-theme="light"` (the default set in `index.html`) may cause a brief wrong-theme render in dark-mode environments.

The fix is to inline a minimal theme-detection snippet in `<head>` before the stylesheet link:

```html
<script>
  (function(){
    var s = localStorage.getItem('lifeDashboard.theme');
    var t = s === 'dark' || s === 'light' ? s
          : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = t;
  })();
</script>
```

This runs synchronously before the first paint, eliminating the flash. The deferred `initTheme()` in `script.js` will then re-read the same value and no double-paint occurs, since the DOM attribute is already correct.

---

### 2. Focus Timer

**Elements:** `#timer-display`, `#timer-start`, `#timer-stop`, `#timer-reset`, `#timer-status`

**State object:**

```js
const timer = {
  remainingMs: FOCUS_MS,  // current remaining milliseconds
  endsAt: 0,              // absolute timestamp when timer will reach 0
  intervalId: null,       // setInterval handle; null when not running
};
```

**Tick algorithm:**

`tickTimer()` computes `left = timer.endsAt - Date.now()`. This wall-clock subtraction makes the timer robust to tab throttling and sleep/wake cycles — the displayed time always reflects reality rather than counting ticks. If `left <= 0` the timer completes; otherwise `timer.remainingMs = left` and `renderTimer()` updates the display.

**`formatTime(ms)` algorithm:**

```
totalSeconds = Math.ceil(ms / 1000)
minutes = Math.floor(totalSeconds / 60)
seconds = totalSeconds % 60
return zero-padded MM:SS
```

`Math.ceil` is used so that the display shows `25:00` at the start and `00:01` for the last second rather than jumping to `00:00` while time remains.

---

### 3. Task List

**Elements:** `#task-form`, `#task-input`, `#task-message`, `#task-list`, `#task-empty`, `#task-count`

**In-memory state:**

```js
let tasks = [];       // Task[]
let editingId = null; // string | null — ID of task currently being edited
let pendingFocus = null; // CSS selector string for post-render focus target
```

**Task object shape:**

```ts
{ id: string, text: string, done: boolean }
```

**Duplicate detection algorithm (`isDuplicateTask`):**

```
key = cleanText(input).toLowerCase()
return tasks.some(task => task.id !== ignoreId
                       && cleanText(task.text).toLowerCase() === key)
```

The `ignoreId` parameter allows the edit path to compare against all *other* tasks without falsely flagging a no-change save.

**`cleanText(value)` algorithm:**

```
value.replace(/\s+/g, ' ').trim()
```

Collapses all whitespace runs to a single space and strips leading/trailing whitespace.

**Event delegation pattern:**

Rather than attaching listeners to individual task rows (which are rebuilt on every render), all events on `#task-list` are handled by three delegated listeners:

- `click` → `onTaskListClick` dispatches to `startEdit`, `cancelEdit`, `deleteTask`
- `change` → `onTaskListChange` dispatches to `toggleTask`
- `submit` → `onTaskListSubmit` dispatches to `saveEdit`
- `keydown` → `onTaskListKeydown` handles Escape to cancel edit

**Render cycle:**

`renderTasks()` rebuilds the entire list DOM on every state change. This is acceptable given the small expected list size (no more than a few dozen items) and eliminates the complexity of incremental DOM patching.

---

### 4. Quick Links

**Elements:** `#link-list`, `#link-empty`, `#link-form`, `#link-name`, `#link-url`, `#link-message`

**Link object shape:**

```ts
{ id: string, name: string, url: string }
```

**`normalizeUrl(input)` algorithm:**

```
1. Trim whitespace
2. If empty → return null
3. If no http(s):// prefix → prepend "https://"
4. Try new URL(value)
5. If protocol not http: or https: → return null
6. If hostname has no "." → return null
7. Return url.href (normalised absolute URL)
```

**Gap 4 — Max 50 links (Req 9 AC 12):**

A constant `MAX_LINKS = 50` and a guard in `addLink()`:

```
const MAX_LINKS = 50;

function addLink(event) {
  // ... existing URL validation ...
  if (links.length >= MAX_LINKS) {
    setLinkMessage(`You can save up to ${MAX_LINKS} links.`);
    return;
  }
  // ... rest of add logic ...
}
```

**Gap 3 — Link form fields cleared after add (Req 9 AC 7):**

The existing `addLink()` already clears both `els.linkName.value` and `els.linkUrl.value` on success. This gap is confirmed as already handled; no change needed.

**Gap 5 — Focus after link removal (Req 11 AC 9):**

`onLinkListClick` must move focus to `#link-url` after removing a link:

```
function onLinkListClick(event) {
  const button = event.target.closest('button[data-action="remove-link"]');
  if (!button) return;
  links = links.filter((link) => link.id !== button.dataset.id);
  saveLinks();
  renderLinks();
  els.linkUrl.focus();  // ← add this line
}
```

---

## Data Models

### localStorage schema

| Key | Type | Description |
|---|---|---|
| `lifeDashboard.name` | `string \| absent` | Trimmed, collapsed user display name. Absent means no name set. |
| `lifeDashboard.theme` | `"light" \| "dark" \| absent` | Persisted theme preference. Absent means use system preference. |
| `lifeDashboard.tasks` | JSON array of Task | Ordered list of task objects. Invalid entries are skipped on load. |
| `lifeDashboard.links` | JSON array of Link | Ordered list of link objects. Invalid entries are skipped on load. |

### Task object

```json
{
  "id": "lca3k2x7f",
  "text": "Buy groceries",
  "done": false
}
```

### Link object

```json
{
  "id": "lca3k2abc",
  "name": "GitHub",
  "url": "https://github.com/"
}
```

### ID generation

`makeId()` concatenates `Date.now().toString(36)` with a random alphanumeric suffix. This produces collision-resistant IDs without a library:

```js
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
```

### Validation predicates

`isValidTask(task)` — returns true iff `task.id`, `task.text` are strings and `task.done` is boolean.

`isValidLink(link)` — returns true iff `link.id`, `link.name`, `link.url` are strings and `normalizeUrl(link.url) !== null`.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Greeting salutation coverage

*For any* integer hour in the range 0–23, `getGreeting(hour)` returns exactly one of the four strings `"Good morning"`, `"Good afternoon"`, `"Good evening"`, or `"Good night"`, and returns the correct salutation for the hour ranges defined in the requirements.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 2: Non-empty name greeting format

*For any* non-empty, non-whitespace-only name string `n` and any hour 0–23, `renderGreeting(hour, n)` produces a string equal to `getGreeting(hour) + ", " + cleanText(n) + "."`.

**Validates: Requirements 3.5**

### Property 3: Whitespace name produces salutation-only greeting

*For any* string `s` composed entirely of whitespace characters and any hour 0–23, the greeting display equals `getGreeting(hour) + "."`.

**Validates: Requirements 3.6**

### Property 4: `cleanText` invariant

*For any* string `s`, `cleanText(s)` has no leading whitespace, no trailing whitespace, and no run of two or more consecutive whitespace characters in the interior.

**Validates: Requirements 3.12**

### Property 5: Name length rejection

*For any* string `s` where `cleanText(s).length > 50`, submitting the Name Form rejects the input, displays an error message, and leaves the previously stored name unchanged.

**Validates: Requirements 3.13**

### Property 6: Theme toggle label and `aria-pressed`

*For any* theme value in `{"light", "dark"}`, after `applyTheme(theme)` is called, the Theme Toggle button's `textContent` is `"Switch to dark mode"` when theme is `"light"` and `"Switch to light mode"` when theme is `"dark"`, and `aria-pressed` is `"false"` when theme is `"light"` and `"true"` when theme is `"dark"`.

**Validates: Requirements 4.7, 4.8**

### Property 7: `formatTime` produces valid MM:SS

*For any* integer `ms` in the range `0` to `FOCUS_MS` (1 500 000), `formatTime(ms)` returns a string matching the pattern `/^\d{2}:\d{2}$/` where the minutes part is in 0–25 and the seconds part is in 0–59.

**Validates: Requirements 5.1, 5.3**

### Property 8: Adding a valid task grows the list by one

*For any* non-empty, non-duplicate task text of at most 120 characters and any initial task list, calling `addTask` with that text results in a task list whose length is exactly `initial.length + 1`, with the new task having `done: false` and `text` equal to `cleanText(input)`.

**Validates: Requirements 6.1**

### Property 9: Whitespace-only task is rejected

*For any* string composed entirely of whitespace characters, calling `addTask` with that input leaves the task list unchanged and produces an error message.

**Validates: Requirements 6.3**

### Property 10: Task toggle round trip

*For any* task and boolean value `done`, after `toggleTask(id, done)` is called, the task's `done` field equals `done`. Calling `toggleTask(id, !done)` then `toggleTask(id, done)` returns the task to its original `done` value.

**Validates: Requirements 6.5, 6.6**

### Property 11: `isValidTask` predicate completeness

*For any* JavaScript object `obj`, `isValidTask(obj)` returns `true` if and only if `typeof obj.id === 'string'` and `typeof obj.text === 'string'` and `typeof obj.done === 'boolean'`.

**Validates: Requirements 6.9**

### Property 12: Duplicate detection is symmetric and case-insensitive

*For any* task list containing a task with text `T` and any string `s` where `cleanText(s).toLowerCase() === cleanText(T).toLowerCase()`, `isDuplicateTask(s, null)` returns `true`. For any string `s` where no such match exists, `isDuplicateTask(s, null)` returns `false`.

**Validates: Requirements 8.1, 8.2**

### Property 13: Self-edit is not a duplicate

*For any* task with id `id` and text `T`, `isDuplicateTask(T, id)` returns `false` (a task's own text is not a duplicate of itself when editing).

**Validates: Requirements 8.3**

### Property 14: `normalizeUrl` prepends https for bare hostnames

*For any* string `s` that does not begin with `http://` or `https://` (case-insensitively) and that forms a valid hostname containing at least one dot when wrapped in `https://`, `normalizeUrl(s)` returns a URL string beginning with `"https://"`.

**Validates: Requirements 9.5**

### Property 15: `normalizeUrl` rejects dotless hostnames

*For any* URL string whose hostname contains no `.` character, `normalizeUrl` returns `null`.

**Validates: Requirements 9.6**

### Property 16: Max link count enforced

*For any* link list of length 50, calling `addLink` with a valid URL results in rejection, the link list length remains 50, and an error message is displayed.

**Validates: Requirements 9.12**

---

## Error Handling

### localStorage unavailability

All reads and writes are wrapped in try/catch. On failure the app continues in-memory — `loadText` returns `null`, `saveText` silently swallows the error. No error is surfaced to the user and no exception reaches the console.

### Invalid persisted data

On load, `loadList` falls back to the provided default if the JSON is unparseable or not an array. Each item is then filtered through `isValidTask` / `isValidLink`, so corrupt or partially-written entries are silently dropped.

### Web Audio API unavailability

`playBeep()` wraps the entire Web Audio flow in try/catch and returns silently if `AudioContext` is absent or construction fails. The timer still completes and the status message still updates.

### URL parsing errors

`normalizeUrl` wraps `new URL(value)` in try/catch and returns `null` on any parsing exception.

### Name form validation errors

When `saveName` rejects a name (over 50 chars), it sets an error message in `#name-message`, keeps the form visible, and returns without clearing the input — so the user can edit the name in place.

---

## Testing Strategy

### Unit tests (example-based)

Focus on specific concrete scenarios, integration points, and edge cases:

- Clock: `updateClock()` with a mocked `Date` produces the expected `HH:MM:SS` string
- Theme: `initTheme()` with no stored preference and `prefers-color-scheme: dark` sets `data-theme="dark"`
- Theme: `initTheme()` with an invalid stored value falls back to system preference
- Name form: submitting an empty name removes the stored name and shows salutation-only greeting
- Name form: Escape key closes the form without saving
- Timer: `startTimer()` sets `timer.intervalId` to a non-null value
- Timer: `resetTimer()` restores `timer.remainingMs` to `FOCUS_MS`
- Tasks: adding a duplicate is rejected with the expected message
- Tasks: editing a task to its own text (same case) is accepted
- Links: adding a link with no name derives the name from hostname
- Links: removing a link moves focus to `#link-url`

### Property-based tests

Use a property-based testing library appropriate for the language/environment (e.g., **fast-check** for JavaScript). Configure each test to run a minimum of 100 iterations.

Each property test must be tagged with a comment:
`// Feature: life-dashboard, Property N: <property text>`

Properties to implement:

| Property | Function under test | Generator strategy |
|---|---|---|
| P1: Greeting salutation coverage | `getGreeting(hour)` | integer in 0–23 |
| P2: Non-empty name greeting format | `renderGreeting` / `getGreeting` + `cleanText` | arbitrary non-blank string, integer 0–23 |
| P3: Whitespace name → salutation only | greeting pipeline | whitespace-only string generator, integer 0–23 |
| P4: `cleanText` invariant | `cleanText` | arbitrary string |
| P5: Name length rejection | `saveName` logic | string where `cleanText(s).length > 50` |
| P6: Theme label + aria-pressed | `applyTheme` | `fc.constantFrom("light", "dark")` |
| P7: `formatTime` shape | `formatTime` | integer in 0–1 500 000 |
| P8: Task add grows list | `addTask` logic | valid task text + arbitrary initial list |
| P9: Whitespace task rejected | `addTask` validation | whitespace-only string |
| P10: Task toggle round trip | `toggleTask` | arbitrary task object + boolean |
| P11: `isValidTask` completeness | `isValidTask` | arbitrary object |
| P12: Duplicate detection | `isDuplicateTask` | task list + matching/non-matching strings |
| P13: Self-edit not a duplicate | `isDuplicateTask` | task object + its own text, same id |
| P14: `normalizeUrl` https prepend | `normalizeUrl` | valid bare hostname strings |
| P15: `normalizeUrl` dotless reject | `normalizeUrl` | strings with no dot in hostname |
| P16: Max link count | `addLink` guard | link list of exactly 50 + valid URL |

### Integration / smoke tests

- Page loads and clock starts within 1 second (Lighthouse / manual)
- Correct theme applied before first paint with the inline script in `<head>` (visual check)
- Responsive layout breakpoints at 896 px (browser DevTools)
- Keyboard-only navigation reaches every interactive element in tab order
- Screen reader announces timer countdown via `role="timer"` (manual with NVDA/VoiceOver)
