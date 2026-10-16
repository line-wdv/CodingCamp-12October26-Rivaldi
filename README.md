# Life Dashboard

A small browser dashboard that helps organize the day: live clock and greeting, a focus timer, a to-do list, and quick links. Built with plain HTML, CSS, and vanilla JavaScript. No backend, no build step.

**Live site:** _paste your GitHub Pages URL here_

## Features

**Required**
- Current time and date, with a greeting that changes through the day
- 25-minute focus timer with Start, Stop, and Reset
- To-do list: add, edit, mark done, delete (saved in Local Storage)
- Quick links that open favorite websites (saved in Local Storage)

**Challenges (3 chosen)**
- Light / dark mode (remembers your choice, follows system theme on first visit)
- Custom name in the greeting
- Prevent duplicate tasks (ignores case and extra spaces, also when editing)

## Folder structure

```
.
├── .kiro/            Kiro specs and steering used while building
├── css/style.css     the only stylesheet
├── js/script.js      the only script
├── index.html
└── README.md
```

## Run locally

Open `index.html` in any modern browser. Nothing to install.

## Notes on decisions

- Data lives in the browser's Local Storage only, under keys that start with `lifeDashboard.`
- The timer stores an end timestamp instead of counting ticks, so it stays accurate when the tab is in the background.
- User text is always inserted with `textContent`, and quick links accept only `http(s)` addresses.
