const app = document.querySelector('#app');
const onboardingTemplate = document.querySelector('#onboardingTemplate');
const homeTemplate = document.querySelector('#homeTemplate');
const sessionTemplate = document.querySelector('#sessionTemplate');
const ratingTemplate = document.querySelector('#ratingTemplate');

const STORAGE_KEY = 'nit-session-v1';
const DB_NAME = 'nit-recordings';
const DB_VERSION = 1;

const goalProfiles = {
  conversation: {
    label: 'Свободное общение',
    baselineTitle: 'Расскажи о деле, которое тебе нравится',
    baselinePrompt: 'Какое занятие тебе нравится и почему ты возвращаешься к нему?',
    threadPrompt: 'Почему это занятие важно для тебя?',
    anchors: ['тема', 'причина', 'пример', 'вывод'],
    shortenPrompt: 'Объясни тремя предложениями, почему ты ценишь это занятие.',
    shortenAnchors: ['мне нравится…', 'потому что…', 'поэтому…'],
    sprintPrompt: 'Сделать подарок, ужин, выбор, вывод… Какие действия точнее?',
  },
  words: {
    label: 'Точные слова',
    baselineTitle: 'Расскажи о полезном навыке',
    baselinePrompt: 'Какой навык недавно появился у тебя и где он пригодился?',
    threadPrompt: 'Как ты осваивала этот навык и что изменилось?',
    anchors: ['навык', 'трудность', 'действие', 'результат'],
    shortenPrompt: 'Передай эту историю тремя точными предложениями.',
    shortenAnchors: ['раньше…', 'затем…', 'теперь…'],
    sprintPrompt: 'Сделать выбор, проект, упражнение, вывод… Какие действия точнее?',
  },
  speaker: {
    label: 'Лекции и занятия',
    baselineTitle: 'Расскажи, чему ты хочешь научить людей',
    baselinePrompt: 'Чему ты хочешь научить людей на своих занятиях и почему это для них важно?',
    threadPrompt: 'Как ты создаёшь обучение, которое приносит практический результат?',
    anchors: ['задача', 'затруднение', 'обучение', 'результат'],
    shortenPrompt: 'Объясни свой подход к обучению тремя короткими предложениями.',
    shortenAnchors: ['я выясняю…', 'на занятии человек…', 'после обучения он…'],
    sprintPrompt: 'Сделать ассистента, программу, упражнение, вывод… Какие действия точнее?',
  },
  work: {
    label: 'Речь для работы',
    baselineTitle: 'Расскажи о рабочей задаче',
    baselinePrompt: 'Какую рабочую задачу ты умеешь решать особенно хорошо и почему?',
    threadPrompt: 'Как ты обычно подходишь к сложной рабочей задаче?',
    anchors: ['задача', 'подход', 'пример', 'результат'],
    shortenPrompt: 'Объясни свой рабочий подход тремя короткими предложениями.',
    shortenAnchors: ['сначала…', 'затем…', 'в результате…'],
    sprintPrompt: 'Сделать отчёт, проект, встречу, вывод… Какие действия точнее?',
  },
  creator: {
    label: 'Видео и блог',
    baselineTitle: 'Расскажи об идее для публикации',
    baselinePrompt: 'О какой теме тебе хочется рассказать аудитории и почему?',
    threadPrompt: 'Какую пользу получит аудитория от этой темы?',
    anchors: ['тема', 'польза', 'пример', 'вывод'],
    shortenPrompt: 'Сформулируй идею публикации тремя короткими предложениями.',
    shortenAnchors: ['эта тема…', 'она полезна…', 'главная мысль…'],
    sprintPrompt: 'Сделать видео, пост, кадр, вывод… Какие действия точнее?',
  },
};

const steps = [
  {
    id: 'baseline',
    name: 'Контрольная запись',
    tag: 'Без подсказок',
    title: 'Скажи, чему ты хочешь научить людей',
    description: 'Не стремись говорить идеально. Нам важна честная стартовая точка.',
    prompt: 'Чему я хочу научить людей на своих занятиях и почему это для них важно?',
    prep: 15,
    duration: 90,
    record: true,
  },
  {
    id: 'reading',
    name: 'Чтение вслух',
    tag: 'Одна страница',
    title: 'Прочитай, не ускоряясь',
    description: 'Сохраняй спокойный темп. В конце каждого предложения делай короткую смысловую паузу.',
    prompt: `Когда человек выступает без заметок, ему кажется, что главное — помнить каждое слово. Но слушатель не знает подготовленного текста и не заметит, если одна формулировка заменит другую. Гораздо важнее удерживать направление мысли.

Представьте, что выступление — это маршрут с несколькими остановками. Сначала вы называете тему, затем раскрываете две или три основные идеи, приводите пример и завершаете выводом. Между остановками можно выбирать разные слова, делать паузы и уточнять сказанное. Пока маршрут остаётся понятным, речь не рассыпается.

Пауза часто пугает самого говорящего сильнее, чем аудиторию. Выступающему кажется, что молчание затянулось, хотя слушатель в этот момент успевает осмыслить услышанное. Поэтому не обязательно заполнять каждую секунду словами «вот», «как бы» или «то есть». Иногда достаточно остановиться, вдохнуть и продолжить с простой фразы: «Вернусь к главной мысли».

Если во время выступления вы забыли точное слово, не задерживайте всю фразу. Назовите предмет или действие проще, опишите смысл другими словами и двигайтесь дальше. Точную формулировку можно вернуть позднее. Для аудитории уверенное продолжение обычно важнее идеального слова, найденного после долгой мучительной паузы. Так сохраняются и контакт со слушателями, и собственная нить рассуждения.

Уверенная речь рождается не из безошибочности. Она появляется, когда человек умеет заметить сбой, не ругать себя и снова найти направление. Это навык, который развивается постепенно: от одной ясной фразы — к абзацу, от абзаца — к целому выступлению.`,
    reading: true,
    prep: 10,
    duration: 120,
    record: true,
  },
  {
    id: 'thread',
    name: 'Удержи нить',
    tag: 'Опорная структура',
    title: 'Проведи мысль по четырём точкам',
    description: 'Опорные слова — это маршрут, а не готовый текст.',
    prompt: 'Как я создаю обучение, которое приносит практический результат?',
    anchors: ['задача', 'затруднение', 'обучение', 'результат'],
    rescue: 'Если мысль потерялась: «Покажу это на примере».',
    prep: 20,
    duration: 60,
    record: true,
  },
  {
    id: 'shorten',
    name: 'Скажи короче',
    tag: 'Три предложения',
    title: 'Сохрани конкретику',
    description: 'Сократи ответ, но не превращай его в общую фразу.',
    prompt: 'Объясни свой подход к обучению тремя короткими предложениями.',
    anchors: ['я выясняю…', 'на занятии человек…', 'после обучения он…'],
    rescue: 'Избегай слов: «какой-то», «то есть», «вот».',
    prep: 10,
    duration: 20,
    record: true,
  },
  {
    id: 'sprint',
    name: 'Точные слова',
    tag: 'Словесный спринт',
    title: 'Замени слово «сделать»',
    description: 'Произнеси как можно больше точных глаголов. После таймера запиши те, которые вспомнила.',
    prompt: 'Сделать ассистента, программу, упражнение, вывод… Какие действия точнее?',
    prep: 0,
    duration: 30,
    sprint: true,
  },
  {
    id: 'rating',
    name: 'Самооценка',
    tag: 'Стартовая точка',
    title: 'Как было сегодня?',
    description: 'Оцени не качество речи, а субъективную лёгкость выполнения.',
    rating: true,
  },
];

let state = loadState();
let mediaRecorder = null;
let mediaStream = null;
let chunks = [];
let timerHandle = null;
let countdownResolve = null;
let currentPhase = 'idle';
let secondsLeft = 0;
let audioContext = null;
let soundsEnabled = true;

function freshState() {
  return {
    profile: null,
    startedAt: null,
    completedAt: null,
    stepIndex: 0,
    recordings: [],
    sprintWords: [],
    ratings: { thread: null, words: null },
    skipped: [],
  };
}

function loadState() {
  try {
    return { ...freshState(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return freshState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatTime(total) {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function focusMain() {
  requestAnimationFrame(() => app.focus());
}

function resolveStep(step) {
  const profile = goalProfiles[state.profile] || goalProfiles.conversation;
  if (step.id === 'baseline') {
    return { ...step, title: profile.baselineTitle, prompt: profile.baselinePrompt };
  }
  if (step.id === 'thread') {
    return { ...step, prompt: profile.threadPrompt, anchors: profile.anchors };
  }
  if (step.id === 'shorten') {
    return { ...step, prompt: profile.shortenPrompt, anchors: profile.shortenAnchors };
  }
  if (step.id === 'sprint') {
    return { ...step, prompt: profile.sprintPrompt };
  }
  return step;
}

function renderEntry() {
  if (!state.profile || !goalProfiles[state.profile]) renderOnboarding();
  else renderHome();
}

function renderOnboarding() {
  stopTimer();
  stopStream();
  app.replaceChildren(onboardingTemplate.content.cloneNode(true));
  const save = document.querySelector('#saveGoal');
  const warning = document.querySelector('#changeWarning');
  let selectedGoal = state.profile;

  warning.hidden = !(state.profile && state.startedAt && !state.completedAt);

  document.querySelectorAll('.goal-option').forEach((option) => {
    const selected = option.dataset.goal === selectedGoal;
    option.classList.toggle('selected', selected);
    option.setAttribute('aria-checked', String(selected));
    option.addEventListener('click', () => {
      selectedGoal = option.dataset.goal;
      document.querySelectorAll('.goal-option').forEach((item) => {
        const isSelected = item === option;
        item.classList.toggle('selected', isSelected);
        item.setAttribute('aria-checked', String(isSelected));
      });
      save.disabled = false;
    });
  });

  save.disabled = !selectedGoal;
  save.addEventListener('click', () => {
    if (state.profile !== selectedGoal || !state.profile) {
      state = { ...freshState(), profile: selectedGoal };
    } else {
      state.profile = selectedGoal;
    }
    saveState();
    renderHome();
  });
  focusMain();
}

function renderHome() {
  if (!state.profile || !goalProfiles[state.profile]) {
    renderOnboarding();
    return;
  }
  stopTimer();
  stopStream();
  app.replaceChildren(homeTemplate.content.cloneNode(true));
  const start = document.querySelector('#startSession');
  const resumeNote = document.querySelector('#resumeNote');
  const changeGoal = document.querySelector('#changeGoal');
  const hasProgress = state.startedAt && !state.completedAt;
  const completed = Boolean(state.completedAt);

  changeGoal.textContent = `Цель: ${goalProfiles[state.profile].label} · изменить`;
  changeGoal.addEventListener('click', renderOnboarding);

  if (hasProgress) {
    start.querySelector('span').textContent = 'Продолжить тренировку';
    resumeNote.hidden = false;
    resumeNote.textContent = state.stepIndex === 0
      ? 'Тренировка начата'
      : `Пройдено: ${state.stepIndex} из ${steps.length} этапов`;
  }

  if (completed) {
    start.querySelector('span').textContent = 'Пройти ещё раз';
    resumeNote.hidden = false;
    resumeNote.textContent = 'Предыдущая тренировка сохранена на устройстве';
  }

  start.addEventListener('click', () => {
    if (completed) state = { ...freshState(), profile: state.profile };
    state.startedAt ||= new Date().toISOString();
    saveState();
    renderSession();
  });
  focusMain();
}

function renderSession() {
  stopTimer();
  app.replaceChildren(sessionTemplate.content.cloneNode(true));

  const step = resolveStep(steps[state.stepIndex]);
  document.querySelector('#stepLabel').textContent = `Этап ${state.stepIndex + 1} из ${steps.length}`;
  document.querySelector('#stepName').textContent = step.name;
  document.querySelector('#progressBar').style.width = `${((state.stepIndex + 1) / steps.length) * 100}%`;
  document.querySelector('#backHome').addEventListener('click', renderHome);
  document.querySelector('#skipStep').addEventListener('click', () => {
    state.skipped = [...new Set([...state.skipped, step.id])];
    nextStep();
  });

  const card = document.querySelector('#exerciseCard');
  if (step.rating) renderRatings(card, step);
  else if (step.sprint) renderSprint(card, step);
  else renderRecording(card, step);
  focusMain();
}

function exerciseHeader(step) {
  return `
    <div class="stage-tag">${step.tag}</div>
    <h2>${step.title}</h2>
    <p>${step.description}</p>
    ${step.prompt ? `<div class="prompt-box${step.reading ? ' reading-text' : ''}">${step.reading ? step.prompt.split('\n\n').map((paragraph) => `<p>${paragraph}</p>`).join('') : step.prompt}</div>` : ''}
    ${step.anchors ? `<div class="anchors">${step.anchors.map((item) => `<span>${item}</span>`).join('')}</div>` : ''}
    ${step.rescue ? `<p class="status-message">${step.rescue}</p>` : ''}
  `;
}

function renderRecording(card, step) {
  card.innerHTML = `
    ${exerciseHeader(step)}
    <div class="timer-zone">
      <div class="timer" id="timer">${formatTime(step.prep || step.duration)}</div>
      <div class="timer-caption" id="timerCaption">${step.prep ? `Подготовка · ${step.prep} сек` : `Ответ · ${step.duration} сек`}</div>
      <button class="record-button" id="recordAction" type="button">
        <span class="record-dot" aria-hidden="true"></span>
        <span>${step.prep ? 'Начать подготовку' : 'Начать запись'}</span>
      </button>
      <div class="status-message" id="recordStatus">Запись начнётся после подготовки</div>
    </div>
  `;

  const action = document.querySelector('#recordAction');
  action.addEventListener('click', async () => {
    if (currentPhase === 'recording') {
      finishRecording();
      return;
    }
    if (currentPhase !== 'idle') return;
    await beginExercise(step);
  });
}

async function beginExercise(step) {
  const status = document.querySelector('#recordStatus');
  const action = document.querySelector('#recordAction');
  let canRecord = true;

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    canRecord = false;
    status.textContent = 'Микрофон недоступен. Таймер продолжит работать без записи.';
  }

  action.disabled = true;
  if (step.prep > 0) {
    currentPhase = 'prep';
    const prepComplete = await runCountdown(step.prep, 'Подготовка', true);
    if (!prepComplete) return;
  }
  action.disabled = false;
  await startResponse(step, canRecord);
}

async function startResponse(step, canRecord) {
  currentPhase = 'recording';
  const action = document.querySelector('#recordAction');
  const status = document.querySelector('#recordStatus');
  action.classList.add('recording');
  action.querySelector('span:last-child').textContent = 'Закончить раньше';
  status.textContent = canRecord ? 'Идёт запись. Если собьёшься — продолжай.' : 'Говори вслух. Запись не сохраняется.';

  if (canRecord && mediaStream) {
    chunks = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : '';
    mediaRecorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);
    mediaRecorder.addEventListener('dataavailable', (event) => {
      if (event.data.size) chunks.push(event.data);
    });
    mediaRecorder.start();
  }

  const elapsed = await runCountdown(step.duration, 'Ответ', false);
  if (elapsed && currentPhase === 'recording') finishRecording();
}

function runCountdown(total, label, prepTone) {
  stopTimer();
  secondsLeft = total;
  updateTimer(label);
  return new Promise((resolve) => {
    countdownResolve = resolve;
    timerHandle = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 3 && secondsLeft > 0) beep(prepTone ? 520 : 410, 0.045);
      updateTimer(label);
      if (secondsLeft <= 0) {
        clearInterval(timerHandle);
        timerHandle = null;
        countdownResolve = null;
        beep(prepTone ? 720 : 310, 0.12);
        resolve(true);
      }
    }, 1000);
  });
}

function updateTimer(label) {
  const timer = document.querySelector('#timer');
  const caption = document.querySelector('#timerCaption');
  if (timer) timer.textContent = formatTime(Math.max(0, secondsLeft));
  if (caption) caption.textContent = label;
}

async function finishRecording() {
  if (currentPhase !== 'recording') return;
  currentPhase = 'done';
  stopTimer();
  const step = resolveStep(steps[state.stepIndex]);
  const action = document.querySelector('#recordAction');
  const status = document.querySelector('#recordStatus');
  action.disabled = true;

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    await new Promise((resolve) => {
      mediaRecorder.addEventListener('stop', resolve, { once: true });
      mediaRecorder.stop();
    });
    const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
    const recordId = `${step.id}-${Date.now()}`;
    try {
      await saveRecording(recordId, blob, { stepId: step.id, createdAt: new Date().toISOString() });
      state.recordings.push({ id: recordId, stepId: step.id, seconds: step.duration });
      status.textContent = 'Запись сохранена на этом устройстве.';
    } catch {
      status.textContent = 'Запись завершена, но сохранить её не удалось.';
    }
  } else {
    status.textContent = 'Этап завершён без записи.';
  }

  stopStream();
  saveState();
  action.remove();
  const buttons = document.createElement('div');
  buttons.className = 'button-stack';
  buttons.innerHTML = `<button class="primary-button" type="button"><span>Продолжить</span><span aria-hidden="true">→</span></button>`;
  document.querySelector('.timer-zone').append(buttons);
  buttons.querySelector('button').addEventListener('click', nextStep);
}

function renderSprint(card, step) {
  card.innerHTML = `
    ${exerciseHeader(step)}
    <div class="timer-zone">
      <div class="timer" id="timer">${formatTime(step.duration)}</div>
      <div class="timer-caption" id="timerCaption">Спринт · ${step.duration} сек</div>
      <button class="record-button" id="sprintAction" type="button">
        <span class="record-dot" aria-hidden="true"></span>
        <span>Начать спринт</span>
      </button>
      <div class="status-message" id="sprintStatus">Говори вслух, не оценивая слова во время спринта</div>
    </div>
  `;

  document.querySelector('#sprintAction').addEventListener('click', async (event) => {
    event.currentTarget.disabled = true;
    currentPhase = 'sprint';
    await runCountdown(step.duration, 'Словесный спринт', false);
    currentPhase = 'done';
    renderSprintInput(card, step);
  });
}

function renderSprintInput(card, step) {
  card.innerHTML = `
    ${exerciseHeader(step)}
    <label for="sprintWords">Запиши глаголы через запятую</label>
    <textarea class="word-input" id="sprintWords" placeholder="создать, разработать…"></textarea>
    <div class="word-count" id="wordCount">0 разных слов</div>
    <div class="button-stack">
      <button class="primary-button" id="saveSprint" type="button" disabled><span>Сохранить результат</span><span aria-hidden="true">→</span></button>
    </div>
  `;
  const input = document.querySelector('#sprintWords');
  const count = document.querySelector('#wordCount');
  const save = document.querySelector('#saveSprint');
  input.addEventListener('input', () => {
    const words = parseWords(input.value);
    count.textContent = `${words.length} ${wordForm(words.length)}`;
    save.disabled = words.length === 0;
  });
  save.addEventListener('click', () => {
    state.sprintWords = parseWords(input.value);
    saveState();
    nextStep();
  });
  input.focus();
}

function parseWords(value) {
  return [...new Set(value.toLowerCase().split(/[,;\n]+/).map((word) => word.trim()).filter(Boolean))];
}

function wordForm(number) {
  if (number % 10 === 1 && number % 100 !== 11) return 'слово';
  if ([2, 3, 4].includes(number % 10) && ![12, 13, 14].includes(number % 100)) return 'слова';
  return 'слов';
}

function renderRatings(card, step) {
  card.innerHTML = `${exerciseHeader(step)}`;
  const ratings = [
    { key: 'thread', title: 'Насколько легко было удерживать нить?' },
    { key: 'words', title: 'Насколько легко было находить слова?' },
  ];

  ratings.forEach(({ key, title }) => {
    const block = document.createElement('div');
    block.className = 'rating-block';
    block.innerHTML = `<h3>${title}</h3>`;
    const row = ratingTemplate.content.cloneNode(true);
    row.querySelectorAll('button').forEach((button) => {
      if (Number(button.dataset.rating) === state.ratings[key]) button.classList.add('selected');
      button.addEventListener('click', () => {
        state.ratings[key] = Number(button.dataset.rating);
        block.querySelectorAll('button').forEach((item) => item.classList.toggle('selected', item === button));
        finish.disabled = !state.ratings.thread || !state.ratings.words;
        saveState();
      });
    });
    block.append(row);
    block.insertAdjacentHTML('beforeend', '<div class="rating-scale"><span>сложно</span><span>легко</span></div>');
    card.append(block);
  });

  const buttons = document.createElement('div');
  buttons.className = 'button-stack';
  buttons.innerHTML = '<button class="primary-button" id="finishSession" type="button" disabled><span>Завершить тренировку</span><span aria-hidden="true">→</span></button>';
  card.append(buttons);
  const finish = document.querySelector('#finishSession');
  finish.disabled = !state.ratings.thread || !state.ratings.words;
  finish.addEventListener('click', finishSession);
}

function finishSession() {
  state.completedAt = new Date().toISOString();
  saveState();
  document.querySelector('#skipStep').hidden = true;
  document.querySelector('#stepLabel').textContent = 'Тренировка завершена';
  document.querySelector('#stepName').textContent = 'Стартовая точка сохранена';
  document.querySelector('#progressBar').style.width = '100%';
  const card = document.querySelector('#exerciseCard');
  card.innerHTML = `
    <div class="stage-tag">День 1 готов</div>
    <h2>Нить найдена</h2>
    <p>Стартовая речь сохранена, а три способа удержать мысль проверены на практике.</p>
    <div class="summary-grid">
      <div class="summary-card"><strong>${state.recordings.length}</strong><span>голосовые записи</span></div>
      <div class="summary-card"><strong>${state.sprintWords.length}</strong><span>точных глаголов</span></div>
      <div class="summary-card"><strong>${state.ratings.thread}/5</strong><span>удерживать нить</span></div>
      <div class="summary-card"><strong>${state.ratings.words}/5</strong><span>находить слова</span></div>
    </div>
    <div class="rescue-card"><span>Фраза на случай паузы</span><strong>«Покажу это на примере»</strong></div>
    <div class="button-stack">
      <button class="primary-button" id="finishHome" type="button"><span>На главную</span><span aria-hidden="true">→</span></button>
    </div>
  `;
  document.querySelector('#finishHome').addEventListener('click', renderHome);
}

function nextStep() {
  stopTimer();
  stopStream();
  currentPhase = 'idle';
  state.stepIndex = Math.min(state.stepIndex + 1, steps.length - 1);
  saveState();
  renderSession();
}

function stopTimer() {
  if (timerHandle) clearInterval(timerHandle);
  timerHandle = null;
  if (countdownResolve) countdownResolve(false);
  countdownResolve = null;
}

function stopStream() {
  if (mediaStream) mediaStream.getTracks().forEach((track) => track.stop());
  mediaStream = null;
  mediaRecorder = null;
}

function beep(frequency, duration) {
  if (!soundsEnabled) return;
  try {
    audioContext ||= new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.045, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {
    // Звук — дополнительная функция; таймер продолжает работать без него.
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.addEventListener('upgradeneeded', () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('recordings')) db.createObjectStore('recordings', { keyPath: 'id' });
    });
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error));
  });
}

async function saveRecording(id, blob, metadata) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('recordings', 'readwrite');
    transaction.objectStore('recordings').put({ id, blob, ...metadata });
    transaction.addEventListener('complete', resolve);
    transaction.addEventListener('error', () => reject(transaction.error));
  });
}

document.querySelector('#soundToggle').addEventListener('click', (event) => {
  soundsEnabled = !soundsEnabled;
  event.currentTarget.setAttribute('aria-label', soundsEnabled ? 'Выключить звуки' : 'Включить звуки');
  event.currentTarget.style.opacity = soundsEnabled ? '1' : '0.45';
});

window.addEventListener('beforeunload', () => {
  stopTimer();
  stopStream();
});

renderEntry();
