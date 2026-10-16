# Requirements Document

## Introduction

Life Dashboard is a single-page personal productivity web app built with plain HTML, CSS, and vanilla JavaScript. It runs entirely in the browser with no backend, using `localStorage` to persist all user data. The dashboard provides a live clock and date, a time-based personalised greeting, a to-do list with duplicate prevention, a fixed 25-minute focus (Pomodoro) timer, and a quick-links bookmarks panel. A light/dark mode toggle and a fully responsive layout round out the experience. The three chosen challenges are: (1) Light/Dark mode with persisted preference, (2) Custom name in greeting stored in `localStorage`, and (3) Duplicate task prevention with user feedback.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Clock**: The live HH:MM:SS time display in the masthead.
- **Greeting**: The `<h1>` element that displays a time-based salutation and the user's name.
- **Name_Form**: The inline form that lets the user enter or change their display name.
- **Theme_Toggle**: The button that switches between light and dark colour schemes.
- **Focus_Timer**: The 25-minute countdown timer in the side column.
- **Task_List**: The ordered collection of to-do items managed by the user.
- **Task_Form**: The form used to add a new task.
- **Task_Item**: A single entry in the Task_List, containing text, a completion checkbox, and action buttons.
- **Edit_Form**: The inline form that replaces a Task_Item row when the user edits a task.
- **Link_List**: The collection of quick-link bookmarks shown in the side column.
- **Link_Form**: The form used to add a new quick link.
- **localStorage**: The browser-native key–value storage API used to persist all user data client-side.
- **FOCUS_MS**: The constant 25-minute duration (1 500 000 ms) used by the Focus_Timer.
- **Validator**: The logic component that checks task and URL input for correctness.

---

## Requirements

### Requirement 1: Live Clock and Date Display

**User Story:** As a user, I want to see the current time and date at a glance, so that I always know when it is without leaving the page.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Clock SHALL display the current time in HH:MM:SS 24-hour format derived from the device's local system clock.
2. WHILE the Dashboard is open, THE Clock SHALL update the displayed time at intervals of 1 second, with each update occurring no more than 500 milliseconds early or late relative to the previous update.
3. WHEN the Dashboard loads, THE Dashboard SHALL display the current date including the full weekday name, full month name, numeric day of month, and four-digit year.
4. WHILE the Dashboard is open, THE Dashboard SHALL re-evaluate and update the displayed date on every 1-second clock tick, so that a date change at midnight is reflected without a page reload.
5. IF the Clock's 1-second update interval fails to fire within 3 seconds of the last successful update, THEN THE Dashboard SHALL display a visible indicator showing that the time display may be out of date.

---

### Requirement 2: Time-Based Greeting

**User Story:** As a user, I want to see a greeting that matches the time of day, so that the dashboard feels contextual and personal.

#### Acceptance Criteria

1. WHEN the local device hour is between 05:00 and 11:59 inclusive, THE Greeting SHALL display "Good morning".
2. WHEN the local device hour is between 12:00 and 16:59 inclusive, THE Greeting SHALL display "Good afternoon".
3. WHEN the local device hour is between 17:00 and 20:59 inclusive, THE Greeting SHALL display "Good evening".
4. WHEN the local device hour is between 21:00 and 23:59 or between 00:00 and 04:59 inclusive, THE Greeting SHALL display "Good night".
5. WHILE the Dashboard is open, THE Greeting SHALL re-evaluate the current local device hour at the same 1-second interval as the clock and update the salutation if it has changed.
6. WHEN the salutation changes due to an hour boundary being crossed, THE Greeting SHALL update without a page reload.

---

### Requirement 3: Custom Name in Greeting

**User Story:** As a user, I want to add or change my name in the greeting, so that the dashboard feels personalised to me.

#### Acceptance Criteria

1. WHEN no name is stored, THE Dashboard SHALL display an "Add your name" button next to the Greeting.
2. WHEN a name is stored, THE Dashboard SHALL display a "Change name" button next to the Greeting.
3. WHEN the user activates the "Add your name" or "Change name" button, THE Name_Form SHALL become visible and receive keyboard focus on the text input within 100 ms.
4. WHEN the Name_Form is visible, THE Dashboard SHALL hide the "Add your name" / "Change name" button.
5. WHEN the user submits the Name_Form with a non-empty value, THE Greeting SHALL display the salutation followed by a comma, the trimmed name, and a full stop (e.g. "Good morning, Alex.").
6. WHEN the user submits the Name_Form with a value that is empty or contains only whitespace characters, THE Dashboard SHALL remove the name from the Greeting so that only the salutation and a full stop are shown (e.g. "Good morning.").
7. WHEN the user submits the Name_Form, THE Dashboard SHALL save the processed name string to localStorage under the key `lifeDashboard.name`, overwriting any previously stored value.
8. WHEN the user submits the Name_Form with a blank value, THE Dashboard SHALL remove the `lifeDashboard.name` entry from localStorage.
9. WHEN the Dashboard loads and a non-empty name string is stored in localStorage under the key `lifeDashboard.name`, THE Greeting SHALL immediately display the saved name without user interaction.
10. WHEN the user activates the Cancel button inside the Name_Form, THE Name_Form SHALL close and keyboard focus SHALL return to the "Add your name" / "Change name" button within 100 ms.
11. WHEN the user presses the Escape key while the Name_Form text input is focused, THE Name_Form SHALL close without saving changes and the previously stored name SHALL remain unchanged.
12. THE Dashboard SHALL trim leading and trailing whitespace and collapse internal whitespace runs to a single space before saving or displaying the name.
13. IF the name after trimming and collapsing whitespace exceeds 50 characters, THEN THE Dashboard SHALL reject the submission, keep the Name_Form visible, and display an error message indicating the name is too long.

---

### Requirement 4: Light/Dark Mode Toggle

**User Story:** As a user, I want to switch between light and dark colour schemes, so that the dashboard is comfortable to read in any lighting condition.

#### Acceptance Criteria

1. WHEN the Dashboard loads for the first time with no stored preference, THE Theme_Toggle SHALL set the `data-theme` attribute on the `<html>` element to `"dark"` if the system `prefers-color-scheme` media query resolves to `dark`, and to `"light"` otherwise.
2. WHEN the Dashboard loads and a theme preference stored in localStorage under the key `lifeDashboard.theme` is exactly `"light"` or `"dark"`, THE Theme_Toggle SHALL set the `data-theme` attribute on the `<html>` element to the stored value, ignoring the system preference.
3. IF the Dashboard loads and the value stored in localStorage under the key `lifeDashboard.theme` is present but is neither `"light"` nor `"dark"`, THEN THE Theme_Toggle SHALL discard the stored value and apply the same default logic as criterion 1.
4. WHEN the current theme is light and the user activates the Theme_Toggle, THE Dashboard SHALL set the `data-theme` attribute on the `<html>` element to `"dark"`.
5. WHEN the current theme is dark and the user activates the Theme_Toggle, THE Dashboard SHALL set the `data-theme` attribute on the `<html>` element to `"light"`.
6. WHEN the theme changes, THE Theme_Toggle SHALL save the new theme value (`"light"` or `"dark"`) to localStorage under the key `lifeDashboard.theme`.
7. WHEN the theme is light, THE Theme_Toggle button SHALL display the label "Switch to dark mode" and set its `aria-pressed` attribute to `false`.
8. WHEN the theme is dark, THE Theme_Toggle button SHALL display the label "Switch to light mode" and set its `aria-pressed` attribute to `true`.

---

### Requirement 5: Focus Timer

**User Story:** As a user, I want a fixed 25-minute countdown timer, so that I can time focused work sessions using the Pomodoro technique.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Focus_Timer SHALL display a remaining time of 25:00.
2. THE Focus_Timer panel header meta text SHALL statically read "25 minutes" at all times.
3. WHEN the user activates the Start button and the timer is not running, THE Focus_Timer SHALL begin counting down from the current remaining time at one-second intervals.
4. WHILE the Focus_Timer is running, THE Dashboard browser tab title SHALL display the remaining time in `MM:SS - Focus` format.
5. WHILE the Focus_Timer is not running, THE Dashboard browser tab title SHALL display the default title "Life Dashboard".
6. WHEN the user activates the Stop button while the Focus_Timer is running, THE Focus_Timer SHALL pause and preserve the remaining time.
7. WHEN the user activates the Reset button, THE Focus_Timer SHALL stop if running, reset the remaining time to 25:00, enable the Start button, and disable the Stop button.
8. WHEN the remaining time reaches 00:00, THE Focus_Timer SHALL stop automatically and THE Dashboard SHALL play an audio beep no more than 1 second in duration using the Web Audio API.
9. IF the Web Audio API is unavailable in the browser, THEN THE Focus_Timer SHALL complete silently without throwing an error.
10. WHILE the Focus_Timer is running, THE Start button SHALL be disabled.
11. WHILE the Focus_Timer is not running, THE Stop button SHALL be disabled.
12. WHILE the Focus_Timer is running, THE Dashboard SHALL display the status message "Focus session running." in the timer status area.
13. WHILE the Focus_Timer is paused (stopped before reaching 00:00), THE Dashboard SHALL display the status message "Paused. Press Start to continue." in the timer status area.
14. WHEN the Focus_Timer is reset, THE Dashboard SHALL display the status message "Ready when you are." in the timer status area.
15. WHEN the Focus_Timer reaches 00:00, THE Dashboard SHALL display the status message "Time's up. Take a short break." in the timer status area.
16. WHEN the Dashboard loads, THE Dashboard SHALL display the initial status message "Ready when you are." in the timer status area.

---

### Requirement 6: To-Do List — Add, View, and Complete Tasks

**User Story:** As a user, I want to add tasks to a list and mark them as done, so that I can track what I need to accomplish.

#### Acceptance Criteria

1. WHEN the user submits the Task_Form with a non-empty task text of no more than 120 characters after whitespace normalisation, THE Task_List SHALL append a new Task_Item with the entered text, a completion checkbox, an Edit button, and a Delete button.
2. WHEN the user submits the Task_Form successfully, THE Dashboard SHALL clear the task input field and set keyboard focus back to it.
3. WHEN the user submits the Task_Form with an empty or whitespace-only value, THE Dashboard SHALL display the inline error message "Write a task before adding it." and SHALL NOT add a Task_Item.
4. WHEN the user modifies the task input field after an empty-submission error is shown, THE Dashboard SHALL clear the inline error message.
5. WHEN the user checks the checkbox on a Task_Item, THE Task_Item SHALL apply a strikethrough decoration and reduce the text opacity to indicate completion, and the done state SHALL be saved to localStorage.
6. WHEN the user unchecks the checkbox on a Task_Item, THE Task_Item SHALL remove the strikethrough and restore full text opacity, and the done state SHALL be saved to localStorage.
7. WHEN at least one task exists, THE Dashboard SHALL display a count in the format "X of Y done" where X is the number of completed tasks and Y is the total number of tasks.
8. WHEN no tasks exist, THE Dashboard SHALL display the empty-state message "Nothing planned yet. Add your first task above." and the task count SHALL be hidden.
9. WHEN the Dashboard loads, THE Task_List SHALL restore all previously saved tasks from localStorage under the key `lifeDashboard.tasks`, skipping any entries that are missing a string `id`, string `text`, or boolean `done` field.

---

### Requirement 7: To-Do List — Edit and Delete Tasks

**User Story:** As a user, I want to edit and delete individual tasks, so that I can keep my list accurate.

#### Acceptance Criteria

1. WHEN the user activates the Edit button on a Task_Item, THE Edit_Form SHALL replace the Task_Item row inline and receive keyboard focus on the edit text input within 100 ms; any previously open Edit_Form SHALL close without saving first.
2. WHEN the user submits the Edit_Form with a valid non-empty, non-duplicate text of no more than 120 characters after whitespace normalisation, THE Task_List SHALL update the Task_Item text and collapse the Edit_Form back to the normal row view.
3. WHEN the user submits the Edit_Form with an empty or whitespace-only value, THE Dashboard SHALL display the inline error message "A task cannot be empty. Delete it instead." and SHALL NOT save the change.
4. WHEN the user activates the Cancel button inside the Edit_Form, THE Edit_Form SHALL close without saving changes and keyboard focus SHALL return to the Edit button of that task.
5. WHEN the user presses the Escape key while the Edit_Form is focused, THE Edit_Form SHALL close without saving changes.
6. WHEN the user activates the Delete button on a Task_Item, THE Task_List SHALL remove that Task_Item and keyboard focus SHALL move to the Task_Form input field.
7. WHEN a task is added, edited, or deleted, THE Dashboard SHALL save the updated Task_List to localStorage under the key `lifeDashboard.tasks`.

---

### Requirement 8: Duplicate Task Prevention

**User Story:** As a user, I want the dashboard to reject duplicate tasks, so that my list stays clean and I do not accidentally add the same item twice.

#### Acceptance Criteria

1. WHEN the user submits the Task_Form with text that, after trimming leading/trailing whitespace and collapsing internal whitespace runs to a single space, matches an existing task text in a case-insensitive comparison, THE Dashboard SHALL reject the submission and display the inline error message "That task is already on your list."
2. WHEN the user submits the Edit_Form with text that, after the same whitespace normalisation, matches any other existing task in a case-insensitive comparison, THE Dashboard SHALL reject the submission and display the inline error message "That task is already on your list."
3. WHEN the user edits a task and the normalised submitted text matches only that task's own current normalised text (case-insensitively), THE Dashboard SHALL accept the submission and save without displaying an error.
4. WHEN the user modifies the Task_Form input field after a duplicate error is shown, THE Dashboard SHALL clear the inline error message.
5. WHEN the user modifies the Edit_Form input field after a duplicate error is shown, THE Dashboard SHALL clear the inline error message.

---

### Requirement 9: Quick Links

**User Story:** As a user, I want to save and visit frequently used website links, so that I can open them quickly from the dashboard.

#### Acceptance Criteria

1. WHEN the Dashboard loads for the first time with no links stored, THE Link_List SHALL display three default links: Google (`https://www.google.com/`), GitHub (`https://github.com/`), and YouTube (`https://www.youtube.com/`).
2. WHEN the Dashboard loads and links are stored in localStorage under the key `lifeDashboard.links`, THE Link_List SHALL restore and display only those stored links, skipping any entries that fail URL validation.
3. WHEN the user submits the Link_Form with a valid URL and a non-empty name, THE Link_List SHALL append a new link item using the entered name and the normalised (https-prefixed, absolute) URL.
4. WHEN the user submits the Link_Form with a valid URL and an empty name field, THE Dashboard SHALL derive the link name from the URL hostname with any leading `www.` prefix stripped.
5. WHEN a submitted URL value does not begin with `http://` or `https://` (case-insensitive), THE Dashboard SHALL prepend `https://` before validation and storage.
6. WHEN the user submits the Link_Form with a value that cannot be parsed as a valid HTTP or HTTPS URL with a hostname containing at least one dot, THE Dashboard SHALL display the inline error message "Enter a valid website address, like example.com." and SHALL NOT add a link.
7. WHEN the user submits the Link_Form successfully, THE Dashboard SHALL clear both the name and URL input fields.
8. WHEN the user activates the remove button on a link item, THE Link_List SHALL remove that link.
9. WHEN a link is added or removed, THE Dashboard SHALL save the updated Link_List to localStorage under the key `lifeDashboard.links`.
10. WHEN the Link_List is empty, THE Dashboard SHALL display the empty-state message "No links yet. Add one below."; WHEN links are present, THE Dashboard SHALL hide this message.
11. WHEN the user activates a link, THE Dashboard SHALL open the URL in a new browser tab with `rel="noopener noreferrer"` applied.
12. THE Dashboard SHALL store no more than 50 links; IF adding a link would exceed this limit, THE Dashboard SHALL display an inline error and SHALL NOT add the link.

---

### Requirement 10: Responsive Layout

**User Story:** As a user, I want the dashboard to be usable on any screen size, so that I can access it from desktop and mobile browsers alike.

#### Acceptance Criteria

1. WHEN the viewport width is below 56rem (896 px), THE Dashboard SHALL render all panels in a single-column layout.
2. WHEN the viewport width is 56rem or wider, THE Dashboard SHALL render the Task_List panel in a wider left column and the Focus_Timer and Link_List panels stacked in a narrower right column.
3. THE Dashboard SHALL use relative and fluid units so that no panel content is clipped or overflows horizontally at any viewport width between 320 px and 2560 px.

---

### Requirement 11: Accessibility

**User Story:** As a user relying on keyboard navigation or assistive technology, I want the dashboard to be accessible, so that I can use all features without a mouse.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a visually hidden `<label>` (using the `sr-only` class) for every form input that does not have a visible label adjacent to it.
2. THE Dashboard SHALL provide a descriptive `aria-label` on every icon-only or ambiguous button (e.g. Edit, Delete, and link-remove buttons) that includes the target item's text.
3. THE Focus_Timer display element SHALL carry `role="timer"` so that screen readers can announce countdown changes.
4. THE Dashboard SHALL mark all inline status and error message elements with `role="status"` so that screen readers announce updates without stealing focus.
5. THE Dashboard SHALL apply visible focus styles (3 px outline in the accent colour) to every interactive element when navigated by keyboard.
6. WHEN the user adds a task successfully, THE Dashboard SHALL move keyboard focus to the Task_Form input field.
7. WHEN the user deletes a task, THE Dashboard SHALL move keyboard focus to the Task_Form input field.
8. WHEN the user cancels editing a task, THE Dashboard SHALL move keyboard focus to the Edit button of that task.
9. WHEN the user removes a quick link, THE Dashboard SHALL move keyboard focus to the Link_Form URL input field.

---

### Requirement 12: Data Persistence and Technical Constraints

**User Story:** As a user, I want my data to survive page refreshes and browser restarts, so that I do not lose my tasks, links, name, or preferences.

#### Acceptance Criteria

1. THE Dashboard SHALL use only HTML, CSS, and vanilla JavaScript — no third-party frameworks, build tools, or external runtime dependencies are permitted.
2. THE Dashboard SHALL persist all user data (tasks, links, name, theme preference) exclusively via the browser localStorage API with no server-side calls.
3. IF localStorage is unavailable or throws an exception (e.g. in a private browsing context with storage blocked), THEN THE Dashboard SHALL catch the exception, continue to function in-memory for the current session, and keep the UI fully interactive without any uncaught exception propagating to the browser console.
4. THE Dashboard SHALL be served as a standalone static web app requiring no build step, no test configuration, and no installation.
5. THE Dashboard source SHALL be structured as exactly one CSS file (`css/style.css`) and exactly one JavaScript file (`js/script.js`), both referenced from `index.html`.
6. THE Dashboard SHALL function correctly in current stable releases of Chrome, Firefox, Edge, and Safari without polyfills or transpilation.

---

### Requirement 13: Performance and Visual Quality

**User Story:** As a user, I want the dashboard to load quickly and look clean, so that it is pleasant and efficient to use every day.

#### Acceptance Criteria

1. THE Dashboard SHALL render its initial view and start the clock within one second when loaded locally or over a network-idle connection with no artificial throttling.
2. THE Dashboard SHALL apply the correct saved theme before the first paint to prevent a flash of the wrong colour scheme.
3. THE Dashboard SHALL use a clear visual hierarchy with a large clock as the dominant element, section headings, and supporting meta text at a smaller scale.
4. THE Dashboard SHALL apply CSS transitions of between 150 ms and 400 ms on background-colour and colour changes so that theme switches appear smooth rather than abrupt.
5. WHERE the user has enabled `prefers-reduced-motion`, THE Dashboard SHALL disable all CSS transitions and animations.
