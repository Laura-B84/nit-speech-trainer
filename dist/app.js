const app = document.querySelector('#app');
const onboardingTemplate = document.querySelector('#onboardingTemplate');
const weekTemplate = document.querySelector('#weekTemplate');
const homeTemplate = document.querySelector('#homeTemplate');
const sessionTemplate = document.querySelector('#sessionTemplate');
const ratingTemplate = document.querySelector('#ratingTemplate');

const STORAGE_KEY = 'nit-session-v1';
const DB_NAME = 'nit-recordings';
const DB_VERSION = 1;
const days = window.NIT_WEEK_DAYS || [];

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
let playbackUrl = null;
let playbackTimer = null;
let playbackAudio = null;
let soundsEnabled = true;

function freshState() {
  return {
    profile: null,
    selectedDay: 1,
    sessions: {},
  };
}

function freshSession() {
  return {
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
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (stored.sessions) return { ...freshState(), ...stored };

    const migrated = { ...freshState(), profile: stored.profile || null };
    if (stored.startedAt || stored.completedAt || stored.stepIndex || stored.recordings?.length) {
      migrated.sessions['1'] = {
        ...freshSession(),
        startedAt: stored.startedAt || null,
        completedAt: stored.completedAt || null,
        stepIndex: stored.stepIndex || 0,
        recordings: stored.recordings || [],
        sprintWords: stored.sprintWords || [],
        ratings: { ...freshSession().ratings, ...(stored.ratings || {}) },
        skipped: stored.skipped || [],
      };
    }
    return migrated;
  } catch {
    return freshState();
  }
}

function currentDay() {
  return days.find((day) => day.id === Number(state.selectedDay)) || days[0];
}

function sessionFor(dayId = state.selectedDay) {
  const key = String(dayId);
  if (!state.sessions[key]) state.sessions[key] = freshSession();
  return state.sessions[key];
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
  const tailoredPrompt = step.profilePrompts?.[state.profile];
  const tailored = tailoredPrompt ? { ...step, prompt: tailoredPrompt } : step;
  if (tailored.reuseReading) {
    const readingStep = currentDay().steps.find((item) => item.reading);
    return { ...tailored, prompt: readingStep?.prompt || tailored.prompt, reading: true };
  }
  if (tailored.id === 'baseline') {
    return { ...tailored, title: profile.baselineTitle, prompt: profile.baselinePrompt };
  }
  if (tailored.id === 'thread') {
    return { ...tailored, prompt: profile.threadPrompt, anchors: profile.anchors };
  }
  if (tailored.id === 'shorten') {
    return { ...tailored, prompt: profile.shortenPrompt, anchors: profile.shortenAnchors };
  }
  if (tailored.id === 'sprint') {
    return { ...tailored, prompt: profile.sprintPrompt };
  }
  return tailored;
}

function renderEntry() {
  if (!state.profile || !goalProfiles[state.profile]) renderOnboarding();
  else renderWeek();
}

function renderOnboarding() {
  stopTimer();
  stopStream();
  clearPlayback();
  app.replaceChildren(onboardingTemplate.content.cloneNode(true));
  const save = document.querySelector('#saveGoal');
  const warning = document.querySelector('#changeWarning');
  let selectedGoal = state.profile;

  warning.hidden = !Object.values(state.sessions).some((session) => session.startedAt && !session.completedAt);

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
    renderWeek();
  });
  focusMain();
}

function renderWeek() {
  if (!state.profile || !goalProfiles[state.profile]) {
    renderOnboarding();
    return;
  }
  stopTimer();
  stopStream();
  clearPlayback();
  app.replaceChildren(weekTemplate.content.cloneNode(true));

  const completedDays = days.filter((day) => state.sessions[String(day.id)]?.completedAt).length;
  document.querySelector('#weekProgressValue').textContent = `${completedDays}/${days.length}`;

  const changeGoal = document.querySelector('#weekChangeGoal');
  changeGoal.textContent = `Цель: ${goalProfiles[state.profile].label} · изменить`;
  changeGoal.addEventListener('click', renderOnboarding);

  const list = document.querySelector('#dayList');
  days.forEach((day) => {
    const session = state.sessions[String(day.id)];
    const isComplete = Boolean(session?.completedAt);
    const isStarted = Boolean(session?.startedAt && !session?.completedAt);
    const button = document.createElement('button');
    button.className = `day-card${isComplete ? ' complete' : ''}${isStarted ? ' active' : ''}`;
    button.type = 'button';
    button.innerHTML = `
      <span class="day-number">${isComplete ? '✓' : day.id}</span>
      <span class="day-icon" aria-hidden="true">${day.icon}</span>
      <span class="day-copy">
        <strong>${day.title}</strong>
        <small>${day.focus} · ${day.minutes} мин</small>
      </span>
      <span class="day-status">${isComplete ? 'Готово' : isStarted ? 'Продолжить' : 'Открыть'} →</span>
    `;
    button.addEventListener('click', () => {
      state.selectedDay = day.id;
      saveState();
      renderHome();
    });
    list.append(button);
  });

  const resetTrigger = document.querySelector('#resetProgress');
  const resetPanel = document.querySelector('#resetPanel');
  const cancelReset = document.querySelector('#cancelReset');
  const confirmReset = document.querySelector('#confirmReset');
  const resetStatus = document.querySelector('#resetStatus');

  resetTrigger.addEventListener('click', () => {
    resetTrigger.hidden = true;
    resetPanel.hidden = false;
    confirmReset.focus();
  });
  cancelReset.addEventListener('click', () => {
    resetPanel.hidden = true;
    resetTrigger.hidden = false;
    resetTrigger.focus();
  });
  confirmReset.addEventListener('click', async () => {
    confirmReset.disabled = true;
    cancelReset.disabled = true;
    resetStatus.textContent = 'Удаляем прогресс и записи…';
    try {
      await clearAllRecordings();
      localStorage.removeItem(STORAGE_KEY);
      state = freshState();
      renderOnboarding();
    } catch {
      confirmReset.disabled = false;
      cancelReset.disabled = false;
      resetStatus.textContent = 'Не удалось удалить данные. Попробуй ещё раз.';
    }
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
  clearPlayback();
  app.replaceChildren(homeTemplate.content.cloneNode(true));
  const day = currentDay();
  const session = sessionFor();
  const start = document.querySelector('#startSession');
  const resumeNote = document.querySelector('#resumeNote');
  const changeGoal = document.querySelector('#changeGoal');
  const hasProgress = session.startedAt && !session.completedAt;
  const completed = Boolean(session.completedAt);

  document.querySelector('#backWeek').addEventListener('click', renderWeek);
  document.querySelector('#dayEyebrow').textContent = `День ${day.id} · ${day.focus}`;
  document.querySelector('#homeTitle').textContent = day.title;
  document.querySelector('#dayLead').textContent = day.lead;
  document.querySelector('#dayMinutes').textContent = day.minutes;
  document.querySelector('#dayExerciseCount').textContent = day.steps.filter((step) => !step.rating).length;
  document.querySelector('#dayRecordingCount').textContent = day.steps.filter((step) => step.record).length;

  changeGoal.textContent = `Цель: ${goalProfiles[state.profile].label} · изменить`;
  changeGoal.addEventListener('click', renderOnboarding);
  renderSavedRecordings(day, session);

  if (hasProgress) {
    start.querySelector('span').textContent = 'Продолжить тренировку';
    resumeNote.hidden = false;
    resumeNote.textContent = session.stepIndex === 0
      ? 'Тренировка начата'
      : `Пройдено: ${session.stepIndex} из ${day.steps.length} этапов`;
  }

  if (completed) {
    start.querySelector('span').textContent = 'Пройти ещё раз';
    resumeNote.hidden = false;
    resumeNote.textContent = 'Предыдущая тренировка сохранена на устройстве';
  }

  start.addEventListener('click', () => {
    if (completed) {
      state.sessions[String(day.id)] = {
        ...freshSession(),
        recordings: [...session.recordings],
      };
    }
    const activeSession = sessionFor(day.id);
    activeSession.startedAt ||= new Date().toISOString();
    saveState();
    renderSession();
  });
  focusMain();
}

function renderSession() {
  stopTimer();
  clearPlayback();
  app.replaceChildren(sessionTemplate.content.cloneNode(true));

  const day = currentDay();
  const session = sessionFor();
  const step = resolveStep(day.steps[session.stepIndex]);
  document.querySelector('#stepLabel').textContent = `День ${day.id} · этап ${session.stepIndex + 1} из ${day.steps.length}`;
  document.querySelector('#stepName').textContent = step.name;
  document.querySelector('#progressBar').style.width = `${((session.stepIndex + 1) / day.steps.length) * 100}%`;
  document.querySelector('#backHome').addEventListener('click', renderHome);
  const skip = document.querySelector('#skipStep');
  skip.hidden = Boolean(step.rating);
  if (!step.rating) {
    skip.addEventListener('click', () => {
      session.skipped = [...new Set([...session.skipped, step.id])];
      nextStep();
    });
  }

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
    ${step.helpText ? `<div class="learning-card"><strong>${step.helpTitle || 'Как выполнить'}</strong><span>${step.helpText}</span></div>` : ''}
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
  const day = currentDay();
  const session = sessionFor();
  const step = resolveStep(day.steps[session.stepIndex]);
  const action = document.querySelector('#recordAction');
  const status = document.querySelector('#recordStatus');
  const card = document.querySelector('#exerciseCard');
  action.disabled = true;
  let savedBlob = null;
  let savedMetadata = null;

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    await new Promise((resolve) => {
      mediaRecorder.addEventListener('stop', resolve, { once: true });
      mediaRecorder.stop();
    });
    const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
    const recordId = `${step.id}-${Date.now()}`;
    const createdAt = new Date().toISOString();
    try {
      savedMetadata = { id: recordId, dayId: day.id, stepId: step.id, createdAt };
      await saveRecording(recordId, blob, savedMetadata);
      session.recordings.push({ id: recordId, stepId: step.id, seconds: step.duration, createdAt });
      savedBlob = blob;
      status.textContent = 'Запись сохранена только в этом браузере. Слушать её необязательно.';
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
  buttons.innerHTML = `
    ${savedBlob ? '<button class="secondary-button" id="previewRecording" type="button">Прослушать первые 10 секунд · необязательно</button>' : ''}
    ${savedBlob ? '<button class="secondary-button" id="downloadRecording" type="button">Скачать запись</button>' : ''}
    <button class="secondary-button" id="repeatRecording" type="button">Записать ещё раз</button>
    <button class="primary-button" id="continueAfterRecording" type="button"><span>Продолжить без прослушивания</span><span aria-hidden="true">→</span></button>
  `;
  document.querySelector('.timer-zone').append(buttons);
  document.querySelector('#continueAfterRecording').addEventListener('click', nextStep);
  document.querySelector('#repeatRecording').addEventListener('click', () => {
    clearPlayback();
    currentPhase = 'idle';
    renderRecording(card, step);
  });

  if (savedBlob) {
    document.querySelector('#downloadRecording').addEventListener('click', () => {
      downloadBlob(savedBlob, savedMetadata);
      status.textContent = 'Запись скачана на устройство.';
    });
    clearPlayback();
    playbackUrl = URL.createObjectURL(savedBlob);
    const preview = document.querySelector('#previewRecording');
    playbackAudio = new Audio(playbackUrl);
    preview.addEventListener('click', async () => {
      if (!playbackAudio.paused) {
        playbackAudio.pause();
        clearTimeout(playbackTimer);
        preview.textContent = 'Прослушать первые 10 секунд · необязательно';
        status.textContent = 'Прослушивание остановлено. Можно сразу продолжить.';
        return;
      }
      playbackAudio.currentTime = 0;
      try {
        await playbackAudio.play();
        preview.textContent = 'Остановить прослушивание';
        status.textContent = 'Звучат первые 10 секунд. Остановить можно в любой момент.';
        playbackTimer = setTimeout(() => {
          playbackAudio.pause();
          preview.textContent = 'Прослушать первые 10 секунд ещё раз';
          status.textContent = 'Готово. Не оценивай голос — проверь только, понятна ли мысль.';
        }, 10000);
      } catch {
        status.textContent = 'Не удалось включить запись. Можно продолжить без прослушивания.';
      }
    });
  }
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
    sessionFor().sprintWords = parseWords(input.value);
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
  const session = sessionFor();
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
      if (Number(button.dataset.rating) === session.ratings[key]) button.classList.add('selected');
      button.addEventListener('click', () => {
        session.ratings[key] = Number(button.dataset.rating);
        block.querySelectorAll('button').forEach((item) => item.classList.toggle('selected', item === button));
        finish.disabled = !session.ratings.thread || !session.ratings.words;
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
  finish.disabled = !session.ratings.thread || !session.ratings.words;
  finish.addEventListener('click', finishSession);
}

function finishSession() {
  const day = currentDay();
  const session = sessionFor();
  session.completedAt = new Date().toISOString();
  saveState();
  document.querySelector('#skipStep').hidden = true;
  document.querySelector('#stepLabel').textContent = 'Тренировка завершена';
  document.querySelector('#stepName').textContent = `${day.title} — готово`;
  document.querySelector('#progressBar').style.width = '100%';
  const card = document.querySelector('#exerciseCard');
  card.innerHTML = `
    <div class="stage-tag">День ${day.id} готов</div>
    <h2>${day.title}</h2>
    <p>Ты прочитала текст вслух и перенесла навык в самостоятельную речь. Результат сохранён на этом устройстве.</p>
    <div class="summary-grid">
      <div class="summary-card"><strong>${session.recordings.length}</strong><span>голосовые записи</span></div>
      <div class="summary-card"><strong>${session.sprintWords.length}</strong><span>слов в спринте</span></div>
      <div class="summary-card"><strong>${session.ratings.thread}/5</strong><span>удерживать нить</span></div>
      <div class="summary-card"><strong>${session.ratings.words}/5</strong><span>находить слова</span></div>
    </div>
    <div class="rescue-card"><span>Главный результат</span><strong>Ты закончила мысль, даже если говорила неидеально.</strong></div>
    <div class="button-stack">
      <button class="primary-button" id="finishHome" type="button"><span>К неделе</span><span aria-hidden="true">→</span></button>
    </div>
  `;
  document.querySelector('#finishHome').addEventListener('click', renderWeek);
}

function nextStep() {
  stopTimer();
  stopStream();
  currentPhase = 'idle';
  const day = currentDay();
  const session = sessionFor();
  session.stepIndex = Math.min(session.stepIndex + 1, day.steps.length - 1);
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

function clearPlayback() {
  if (playbackTimer) clearTimeout(playbackTimer);
  playbackTimer = null;
  if (playbackAudio) playbackAudio.pause();
  playbackAudio = null;
  if (playbackUrl) URL.revokeObjectURL(playbackUrl);
  playbackUrl = null;
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
    transaction.addEventListener('complete', () => {
      db.close();
      resolve();
    });
    transaction.addEventListener('error', () => {
      db.close();
      reject(transaction.error);
    });
  });
}

async function getRecording(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('recordings', 'readonly');
    const request = transaction.objectStore('recordings').get(id);
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error));
    transaction.addEventListener('complete', () => db.close());
    transaction.addEventListener('error', () => db.close());
  });
}

async function clearAllRecordings() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('recordings', 'readwrite');
    transaction.objectStore('recordings').clear();
    transaction.addEventListener('complete', () => {
      db.close();
      resolve();
    });
    transaction.addEventListener('error', () => {
      db.close();
      reject(transaction.error);
    });
  });
}

function audioExtension(blob) {
  const type = blob?.type || '';
  if (type.includes('ogg')) return 'ogg';
  if (type.includes('mp4') || type.includes('m4a')) return 'm4a';
  if (type.includes('wav')) return 'wav';
  return 'webm';
}

function downloadBlob(blob, metadata = {}) {
  const dayId = metadata.dayId || state.selectedDay;
  const stepId = metadata.stepId || 'recording';
  const date = String(metadata.createdAt || new Date().toISOString()).slice(0, 10);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nit-day-${dayId}-${stepId}-${date}.${audioExtension(blob)}`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderSavedRecordings(day, session) {
  const section = document.querySelector('#savedRecordings');
  const list = document.querySelector('#recordingList');
  const status = document.querySelector('#downloadStatus');
  if (!section || !session.recordings.length) return;

  section.hidden = false;
  session.recordings.forEach((recording, index) => {
    const step = day.steps.find((item) => item.id === recording.stepId);
    const button = document.createElement('button');
    button.className = 'secondary-button recording-download';
    button.type = 'button';
    button.textContent = `Скачать ${index + 1} · ${step?.name || 'Запись'}`;
    button.addEventListener('click', async () => {
      button.disabled = true;
      status.textContent = 'Готовим файл…';
      try {
        const saved = await getRecording(recording.id);
        if (!saved?.blob) throw new Error('Recording not found');
        downloadBlob(saved.blob, saved);
        status.textContent = 'Запись скачана на устройство.';
      } catch {
        status.textContent = 'Не удалось найти запись в этом браузере.';
      } finally {
        button.disabled = false;
      }
    });
    list.append(button);
  });
}

document.querySelector('#soundToggle').addEventListener('click', (event) => {
  soundsEnabled = !soundsEnabled;
  event.currentTarget.setAttribute('aria-label', soundsEnabled ? 'Выключить звуки' : 'Включить звуки');
  event.currentTarget.style.opacity = soundsEnabled ? '1' : '0.45';
});

document.querySelector('.brand').addEventListener('click', (event) => {
  event.preventDefault();
  if (state.profile) renderWeek();
  else renderOnboarding();
});

window.addEventListener('beforeunload', () => {
  stopTimer();
  stopStream();
});

renderEntry();
