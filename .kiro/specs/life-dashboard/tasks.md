# Implementation Plan: Life Dashboard — Gap Fixes

## Overview

The core dashboard is already built. This plan covers the six gaps between the existing implementation and the requirements document. Tasks are grouped by gap, each targeting one file or one logical concern at a time. No existing working behaviour is to be rewritten — only the missing pieces are added or corrected.

## Tasks

- [ ] 1. Gap 6 — Prevent theme flash before first paint
  - [ ] 1.1 Add inline theme-detection script to `index.html`
    - In `<head>`, **before** the `<link rel="stylesheet">` tag, insert an inline `<script>` block that reads `localStorage.getItem('lifeDashboard.theme')`, validates it as `"light"` or `"dark"`, falls back to `window.matchMedia('(prefers-color-scheme: dark)')`, and sets `document.documentElement.dataset.theme` synchronously
    - The script must not reference any external file and must be self-contained in a single IIFE
    - Remove the hard-coded `data-theme="light"` attribute from the `<html>` tag (the inline script now sets it before first paint)
    - _Requirements: 13.2_

- [ ] 2. Gap 2 — `aria-pressed` on Theme Toggle
  - [ ] 2.1 Set `aria-pressed` inside `applyTheme()` in `js/script.js`
    - Add `els.themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false')` as the third statement inside `applyTheme(theme)`, after the label text assignment
    - Verify that both `initTheme()` (page load) and `toggleTheme()` (user click) call `applyTheme()` so the attribute is always in sync
    - _Requirements: 4.7, 4.8_
  - [ ]* 2.2 Write property test for `applyTheme` label and `aria-pressed`
    - **Property 6: Theme label and `aria-pressed`**
    - For each value in `{ "light", "dark" }`, after `applyTheme(theme)` the button `textContent` and `aria-pressed` must match requirements
    - **Validates: Requirements 4.7, 4.8**

- [ ] 3. Gap 1 — Name max-length 50 with error feedback
  - [ ] 3.1 Update `index.html` for name form max-length and error element
    - Raise `maxlength` on `#name-input` from `30` to `50`
    - Add `<p class="message" id="name-message" role="status"></p>` immediately after the name form's `</form>` closing tag, inside `.greeting-row`
    - _Requirements: 3.13_
  - [ ] 3.2 Add name validation logic in `js/script.js`
    - Add the constant `const MAX_NAME_LENGTH = 50;` near the other limit constants (`MAX_TASK_LENGTH`)
    - Add `nameMessage: byId('name-message')` to the `els` object
    - Add a `setNameMessage(text)` helper function modelled after the existing `setTaskMessage()`
    - In `saveName()`, after computing `cleaned = cleanText(els.nameInput.value)`, add a guard: if `cleaned.length > MAX_NAME_LENGTH` call `setNameMessage(...)` with an appropriate message and `return` early without saving or closing the form
    - Call `setNameMessage('')` at the start of a successful save (before `closeNameForm()`) to clear any previous error
    - _Requirements: 3.13_
  - [ ]* 3.3 Write property test for name length rejection
    - **Property 5: Name length rejection**
    - For any string `s` where `cleanText(s).length > 50`, submitting triggers an error message and leaves the stored name unchanged
    - **Validates: Requirements 3.13**

- [ ] 4. Gap 4 — Enforce maximum 50 quick links
  - [ ] 4.1 Add `MAX_LINKS` constant and guard in `js/script.js`
    - Add the constant `const MAX_LINKS = 50;` near the other limit constants
    - In `addLink()`, after URL validation passes and before `links.push(...)`, add: `if (links.length >= MAX_LINKS) { setLinkMessage(\`You can save up to ${MAX_LINKS} links.\`); return; }`
    - _Requirements: 9.12_
  - [ ]* 4.2 Write property test for max link count enforcement
    - **Property 16: Max link count enforced**
    - For a link list of length 50, calling `addLink` with a valid URL must leave the list at 50 and display an error message
    - **Validates: Requirements 9.12**

- [ ] 5. Gap 5 — Focus after quick link removal
  - [ ] 5.1 Move focus to `#link-url` after removing a link in `js/script.js`
    - At the end of `onLinkListClick()`, after `renderLinks()`, add `els.linkUrl.focus()`
    - _Requirements: 11.9_

- [ ] 6. Verification checkpoint
  - [ ] 6.1 Confirm Gap 3 is already resolved
    - Read `addLink()` in `js/script.js` and confirm both `els.linkName.value = ''` and `els.linkUrl.value = ''` are present after a successful add — no code change needed if they are
    - Confirm the timer panel static meta text reads "25 minutes" in `index.html` — no code change needed
    - Confirm `renderLinks()` sets `els.linkEmpty.hidden = links.length > 0` — no code change needed
    - _Requirements: 9.7, 5.2_
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster fix-only pass
- Gaps 3 (link form clear) and the timer meta text are confirmed already correct in the existing code; task 6.1 is a read-only verification step
- All changes target only `index.html` and `js/script.js`; `css/style.css` requires no modifications for these gaps
- The inline theme script (task 1.1) must appear before the stylesheet `<link>` to guarantee zero flash on any browser

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1", "4.1", "5.1"] },
    { "id": 1, "tasks": ["3.2", "6.1"] },
    { "id": 2, "tasks": ["2.2", "3.3", "4.2"] }
  ]
}
```
