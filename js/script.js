'use strict';

const STORAGE_KEYS = {
  tasks: 'lifeDashboard.tasks',
  links: 'lifeDashboard.links',
  name: 'lifeDashboard.name',
  theme: 'lifeDashboard.theme',
};

const FOCUS_MINUTES = 25;
const FOCUS_MS = FOCUS_MINUTES * 60 * 1000;
const MAX_TASK_LENGTH = 120;
const DEFAULT_TITLE = 'Life Dashboard';

const DEFAULT_LINKS = [
  { id: 'link-google', name: 'Google', url: 'https://www.google.com/' },
  { id: 'link-github', name: 'GitHub', url: 'https://github.com/' },
  { id: 'link-youtube', name: 'YouTube', url: 'https://www.youtube.com/' },
];

const byId = (id) => document.getElementById(id);

const els = {
  date: byId('date'),
  clock: byId('clock'),
  greeting: byId('greeting'),
  themeToggle: byId('theme-toggle'),
  nameOpen: byId('name-open'),
  nameForm: byId('name-form'),
  nameInput: byId('name-input'),
  nameCancel: byId('name-cancel'),
  timerDisplay: byId('timer-display'),
  timerStart: byId('timer-start'),
  timerStop: byId('timer-stop'),
  timerReset: byId('timer-reset'),
  timerStatus: byId('timer-status'),
  taskForm: byId('task-form'),
  taskInput: byId('task-input'),
  taskMessage: byId('task-message'),
  taskList: byId('task-list'),
  taskEmpty: byId('task-empty'),
  taskCount: byId('task-count'),
  linkList: byId('link-list'),
  linkEmpty: byId('link-empty'),
  linkForm: byId('link-form'),
  linkName: byId('link-name'),
  linkUrl: byId('link-url'),
  linkMessage: byId('link-message'),
};

function loadText(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function saveText(key, value) {
  try {
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  } catch (error) {
  }
}

function loadList(key, fallback) {
  const raw = loadText(key);
  if (raw === null) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveList(key, list) {
  saveText(key, JSON.stringify(list));
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function cleanText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function makeButton(label, className, action, id, ariaLabel) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = id;
  if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
  return button;
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  els.themeToggle.textContent =
    theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
}

function initTheme() {
  const saved = loadText(STORAGE_KEYS.theme);
  const prefersDark =
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved === 'dark' || saved === 'light' ? saved : prefersDark ? 'dark' : 'light');
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  saveText(STORAGE_KEYS.theme, next);
}

let userName = cleanText(loadText(STORAGE_KEYS.name) || '');

function getGreeting(hour) {
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function renderGreeting(hour) {
  const base = getGreeting(hour);
  const text = userName ? `${base}, ${userName}.` : `${base}.`;
  if (els.greeting.textContent !== text) els.greeting.textContent = text;
  els.nameOpen.textContent = userName ? 'Change name' : 'Add your name';
}

function updateClock() {
  const now = new Date();
  els.clock.textContent = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  els.date.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  renderGreeting(now.getHours());
}

function openNameForm() {
  els.nameInput.value = userName;
  els.nameForm.hidden = false;
  els.nameOpen.hidden = true;
  els.nameInput.focus();
  els.nameInput.select();
}

function closeNameForm() {
  els.nameForm.hidden = true;
  els.nameOpen.hidden = false;
  els.nameOpen.focus();
}

function saveName(event) {
  event.preventDefault();
  userName = cleanText(els.nameInput.value);
  saveText(STORAGE_KEYS.name, userName);
  renderGreeting(new Date().getHours());
  closeNameForm();
}


const timer = { remainingMs: FOCUS_MS, endsAt: 0, intervalId: null };

function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function isTimerRunning() {
  return timer.intervalId !== null;
}

function renderTimer() {
  const text = formatTime(timer.remainingMs);
  els.timerDisplay.textContent = text;
  document.title = isTimerRunning() ? `${text} - Focus` : DEFAULT_TITLE;
  els.timerStart.disabled = isTimerRunning();
  els.timerStop.disabled = !isTimerRunning();
}

function setTimerStatus(text) {
  els.timerStatus.textContent = text;
}

function playBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.value = 880;
    gain.gain.value = 0.08;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.onended = () => ctx.close();
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
  } catch (error) {
  }
}

function clearTimerInterval() {
  clearInterval(timer.intervalId);
  timer.intervalId = null;
}

function tickTimer() {
  const left = timer.endsAt - Date.now();
  if (left <= 0) {
    clearTimerInterval();
    timer.remainingMs = 0;
    setTimerStatus("Time's up. Take a short break.");
    playBeep();
  } else {
    timer.remainingMs = left;
  }
  renderTimer();
}

function startTimer() {
  if (isTimerRunning()) return;
  if (timer.remainingMs <= 0) timer.remainingMs = FOCUS_MS;
  timer.endsAt = Date.now() + timer.remainingMs;
  timer.intervalId = setInterval(tickTimer, 250);
  setTimerStatus('Focus session running.');
  renderTimer();
}

function stopTimer() {
  if (!isTimerRunning()) return;
  timer.remainingMs = Math.max(0, timer.endsAt - Date.now());
  clearTimerInterval();
  setTimerStatus('Paused. Press Start to continue.');
  renderTimer();
}

function resetTimer() {
  clearTimerInterval();
  timer.remainingMs = FOCUS_MS;
  setTimerStatus('Ready when you are.');
  renderTimer();
}

function isValidTask(task) {
  return (
    task &&
    typeof task.id === 'string' &&
    typeof task.text === 'string' &&
    typeof task.done === 'boolean'
  );
}

let tasks = loadList(STORAGE_KEYS.tasks, []).filter(isValidTask);
let editingId = null;
let pendingFocus = null;

function saveTasks() {
  saveList(STORAGE_KEYS.tasks, tasks);
}

function setTaskMessage(text) {
  els.taskMessage.textContent = text;
}

function isDuplicateTask(text, ignoreId) {
  const key = cleanText(text).toLowerCase();
  return tasks.some((task) => task.id !== ignoreId && cleanText(task.text).toLowerCase() === key);
}

function buildTaskRow(task) {
  const item = document.createElement('li');
  item.className = task.done ? 'task-item is-done' : 'task-item';

  const label = document.createElement('label');
  label.className = 'task-main';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.done;
  checkbox.dataset.action = 'toggle';
  checkbox.dataset.id = task.id;

  const text = document.createElement('span');
  text.className = 'task-text';
  text.textContent = task.text; 

  label.append(checkbox, text);

  const actions = document.createElement('div');
  actions.className = 'task-actions';
  actions.append(
    makeButton('Edit', 'btn btn-small', 'edit', task.id, `Edit task: ${task.text}`),
    makeButton('Delete', 'btn btn-small btn-danger', 'delete', task.id, `Delete task: ${task.text}`)
  );

  item.append(label, actions);
  return item;
}

function buildEditRow(task) {
  const item = document.createElement('li');
  item.className = 'task-item';

  const form = document.createElement('form');
  form.className = 'edit-form';
  form.dataset.id = task.id;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'edit-input';
  input.value = task.text;
  input.maxLength = MAX_TASK_LENGTH;
  input.setAttribute('aria-label', 'Edit task');

  const save = document.createElement('button');
  save.type = 'submit';
  save.className = 'btn btn-primary btn-small';
  save.textContent = 'Save';

  const cancel = makeButton('Cancel', 'btn btn-small', 'cancel', task.id);

  form.append(input, save, cancel);
  item.append(form);
  return item;
}

function renderTasks() {
  els.taskList.textContent = '';
  tasks.forEach((task) => {
    els.taskList.appendChild(task.id === editingId ? buildEditRow(task) : buildTaskRow(task));
  });

  const doneCount = tasks.filter((task) => task.done).length;
  els.taskEmpty.hidden = tasks.length > 0;
  els.taskCount.textContent = tasks.length ? `${doneCount} of ${tasks.length} done` : '';

  if (pendingFocus) {
    const target = els.taskList.querySelector(pendingFocus);
    if (target) target.focus();
    pendingFocus = null;
  }
}

function addTask(event) {
  event.preventDefault();
  const text = cleanText(els.taskInput.value);

  if (!text) {
    setTaskMessage('Write a task before adding it.');
    els.taskInput.focus();
    return;
  }
  if (isDuplicateTask(text)) {
    setTaskMessage('That task is already on your list.');
    els.taskInput.focus();
    return;
  }

  tasks.push({ id: makeId(), text, done: false });
  saveTasks();
  els.taskInput.value = '';
  setTaskMessage('');
  renderTasks();
}

function startEdit(id) {
  editingId = id;
  pendingFocus = '.edit-input';
  setTaskMessage('');
  renderTasks();
}

function cancelEdit(id) {
  editingId = null;
  pendingFocus = `[data-action="edit"][data-id="${id}"]`;
  setTaskMessage('');
  renderTasks();
}

function saveEdit(id, rawText) {
  const text = cleanText(rawText);
  const task = tasks.find((item) => item.id === id);
  if (!task) return;

  if (!text) {
    setTaskMessage('A task cannot be empty. Delete it instead.');
    return;
  }
  if (isDuplicateTask(text, id)) {
    setTaskMessage('That task is already on your list.');
    return;
  }

  task.text = text;
  saveTasks();
  editingId = null;
  pendingFocus = `[data-action="edit"][data-id="${id}"]`;
  setTaskMessage('');
  renderTasks();
}

function toggleTask(id, done) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  task.done = done;
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  if (editingId === id) editingId = null;
  saveTasks();
  setTaskMessage('');
  renderTasks();
  els.taskInput.focus();
}

function onTaskListClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
  if (action === 'edit') startEdit(id);
  if (action === 'cancel') cancelEdit(id);
  if (action === 'delete') deleteTask(id);
}

function onTaskListChange(event) {
  const box = event.target;
  if (box.dataset && box.dataset.action === 'toggle') toggleTask(box.dataset.id, box.checked);
}

function onTaskListSubmit(event) {
  const form = event.target.closest('.edit-form');
  if (!form) return;
  event.preventDefault();
  saveEdit(form.dataset.id, form.querySelector('.edit-input').value);
}

function onTaskListKeydown(event) {
  if (event.key !== 'Escape') return;
  const form = event.target.closest('.edit-form');
  if (form) cancelEdit(form.dataset.id);
}

function isValidLink(link) {
  return (
    link &&
    typeof link.id === 'string' &&
    typeof link.name === 'string' &&
    typeof link.url === 'string' &&
    normalizeUrl(link.url) !== null
  );
}

function normalizeUrl(input) {
  let value = input.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname.includes('.')) return null;
    return url.href;
  } catch (error) {
    return null;
  }
}

let links = loadList(STORAGE_KEYS.links, DEFAULT_LINKS.slice()).filter(isValidLink);

function saveLinks() {
  saveList(STORAGE_KEYS.links, links);
}

function setLinkMessage(text) {
  els.linkMessage.textContent = text;
}

function renderLinks() {
  els.linkList.textContent = '';
  links.forEach((link) => {
    const item = document.createElement('li');
    item.className = 'link-item';

    const anchor = document.createElement('a');
    anchor.className = 'link-btn';
    anchor.href = link.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = link.name;

    const remove = makeButton('\u00d7', 'link-remove', 'remove-link', link.id, `Remove link: ${link.name}`);

    item.append(anchor, remove);
    els.linkList.appendChild(item);
  });
  els.linkEmpty.hidden = links.length > 0;
}

function addLink(event) {
  event.preventDefault();
  const url = normalizeUrl(els.linkUrl.value);

  if (!url) {
    setLinkMessage('Enter a valid website address, like example.com.');
    els.linkUrl.focus();
    return;
  }

  const typedName = cleanText(els.linkName.value);
  const name = typedName || new URL(url).hostname.replace(/^www\./, '');

  links.push({ id: makeId(), name, url });
  saveLinks();
  els.linkName.value = '';
  els.linkUrl.value = '';
  setLinkMessage('');
  renderLinks();
}

function onLinkListClick(event) {
  const button = event.target.closest('button[data-action="remove-link"]');
  if (!button) return;
  links = links.filter((link) => link.id !== button.dataset.id);
  saveLinks();
  renderLinks();
}

function init() {
  initTheme();
  els.themeToggle.addEventListener('click', toggleTheme);

  updateClock();
  setInterval(updateClock, 1000);
  els.nameOpen.addEventListener('click', openNameForm);
  els.nameCancel.addEventListener('click', closeNameForm);
  els.nameForm.addEventListener('submit', saveName);
  els.nameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeNameForm();
  });

  renderTimer();
  els.timerStart.addEventListener('click', startTimer);
  els.timerStop.addEventListener('click', stopTimer);
  els.timerReset.addEventListener('click', resetTimer);

  renderTasks();
  els.taskForm.addEventListener('submit', addTask);
  els.taskInput.addEventListener('input', () => setTaskMessage(''));
  els.taskList.addEventListener('click', onTaskListClick);
  els.taskList.addEventListener('change', onTaskListChange);
  els.taskList.addEventListener('submit', onTaskListSubmit);
  els.taskList.addEventListener('keydown', onTaskListKeydown);

  renderLinks();
  els.linkForm.addEventListener('submit', addLink);
  els.linkList.addEventListener('click', onLinkListClick);
}

init();
