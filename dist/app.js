const app = document.querySelector('#app');
const onboardingTemplate = document.querySelector('#onboardingTemplate');
const weekTemplate = document.querySelector('#weekTemplate');
const homeTemplate = document.querySelector('#homeTemplate');
const sessionTemplate = document.querySelector('#sessionTemplate');
const ratingTemplate = document.querySelector('#ratingTemplate');

const STORAGE_KEY = 'nit-session-v1';
const DB_NAME = 'nit-recordings';
const DB_VERSION = 1;
const SESSION_FORMAT = 2;
const PREVIEW_SECONDS = 30;
const days = window.NIT_WEEK_DAYS || [];
const readingVariants = window.NIT_READING_VARIANTS || {};

const rehearsalFocusOptions = [
  { id: 'start', label: 'Начать яснее', tip: 'Скажи главную мысль уже в первой фразе.' },
  { id: 'thread', label: 'Не терять нить', tip: 'Держись трёх опор: мысль, пример, вывод.' },
  { id: 'shorter', label: 'Говорить короче', tip: 'Убери повторения и оставь только важные детали.' },
  { id: 'words', label: 'Точнее подобрать слова', tip: 'Замени одно общее слово более конкретным.' },
  { id: 'finish', label: 'Увереннее завершить', tip: 'Закрой ответ одной ясной итоговой фразой.' },
];

const rehearsalSuggestions = {
  conversation: 'Расскажи о ситуации, когда ты изменила своё решение, и объясни почему.',
  words: 'Объясни простыми словами навык, который недавно тебе пригодился.',
  speaker: 'Объясни, чему ты хочешь научить людей и какой результат они смогут получить.',
  work: 'Расскажи о рабочем решении: какая была задача, что ты сделала и что получилось.',
  creator: 'Расскажи идею будущего видео или публикации и объясни, чем она полезна аудитории.',
};

const warmupVariants = [
  {
    breath: 'Спокойно вдохни носом. На выдохе мягко тяни «с-с-с», не выжимая воздух до конца.',
    speech: 'Пять раз чередуй губами «у–и», затем дважды скажи: «Дело мастера боится».',
  },
  {
    breath: 'Опусти плечи. Сделай удобный вдох носом и длинный тихий выдох через слегка сомкнутые губы.',
    speech: 'Мягко произнеси «м-м-м», затем дважды чётко: «Тише едешь — дальше будешь».',
  },
  {
    breath: 'Вдохни без усилия. На одном спокойном выдохе посчитай от одного до пяти обычным голосом.',
    speech: 'Трижды произнеси «па–ба–ма», затем дважды: «Семь раз отмерь — один раз отрежь».',
  },
  {
    breath: 'Сделай два спокойных вдоха носом. Каждый выдох отпусти на тихом «ф-ф-ф».',
    speech: 'Скажи три раза — медленно, обычно и чуть быстрее: «Шесть мышат в камышах шуршат».',
  },
  {
    breath: 'Расслабь челюсть. Вдохни носом и выдохни со свободным тихим вздохом «ха-а».',
    speech: 'Произнеси «да–та–ла» три раза, затем дважды: «Утро вечера мудренее».',
  },
  {
    breath: 'Вдохни спокойно. На выдохе сделай лёгкую вибрацию губ «бр-р-р» на удобной высоте.',
    speech: 'Медленно произнеси «тра–дра», затем дважды: «Поспешишь — людей насмешишь».',
  },
  {
    breath: 'Положи ладонь на нижние рёбра. Вдохни свободно, а выдох отпусти на мягком «ш-ш-ш».',
    speech: 'Скажи три раза — медленно, обычно и чуть быстрее: «Три сороки-тараторки тараторили на горке».',
  },
];

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
    attempts: {},
  };
}

function freshSession() {
  return {
    formatVersion: SESSION_FORMAT,
    contentVariant: null,
    startedAt: null,
    completedAt: null,
    stepIndex: 0,
    recordings: [],
    sprintWords: [],
    ratings: { thread: null, words: null },
    skipped: [],
    practiceFormat: 1,
    customSpeechText: '',
    customSpeechMode: null,
    rehearsalFocus: null,
  };
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (stored.sessions) {
      const loaded = { ...freshState(), ...stored };
      Object.values(loaded.sessions).forEach((session) => {
        if (!session.formatVersion && !session.startedAt && !session.completedAt) {
          session.formatVersion = SESSION_FORMAT;
          session.contentVariant = null;
        }
        if (!session.startedAt && !session.completedAt) session.practiceFormat ??= 1;
        session.customSpeechText ??= '';
        session.customSpeechMode ??= null;
        session.rehearsalFocus ??= null;
      });
      return loaded;
    }

    const migrated = { ...freshState(), profile: stored.profile || null };
    if (stored.startedAt || stored.completedAt || stored.stepIndex || stored.recordings?.length) {
      migrated.sessions['1'] = {
        ...freshSession(),
        formatVersion: 1,
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

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character]);
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function readingTag(step, text) {
  const count = countWords(text);
  if (/^\d+\s+слов/.test(step.tag)) return `${count} слов`;
  const label = step.tag.replace(/\s*·\s*\d+\s+слов.*$/, '');
  return `${label} · ${count} слов`;
}

function resolveReading(step, day = currentDay(), session = sessionFor(day.id)) {
  const options = [step.prompt, ...(readingVariants[day.id] || [])];
  const index = Number(session.contentVariant || 0) % options.length;
  const prompt = options[index];
  return { ...step, prompt, tag: readingTag(step, prompt) };
}

function warmupStep(day, session) {
  const index = (day.id - 1 + Number(session.contentVariant || 0)) % warmupVariants.length;
  const variant = warmupVariants[index];
  return {
    id: 'warmup',
    name: 'Разогрев',
    tag: '40 секунд · без записи',
    title: 'Разбуди дыхание и речь',
    description: 'Два мягких упражнения перед основной тренировкой.',
    rescue: 'Делай без усилия. Если появляется боль или неприятное ощущение — пропусти разогрев.',
    warmup: true,
    parts: [
      { label: 'Дыхание и голос', instruction: variant.breath, duration: 20 },
      { label: 'Губы и дикция', instruction: variant.speech, duration: 20 },
    ],
  };
}

function daySevenPracticeSteps(day) {
  const reading = day.steps.find((step) => step.reading);
  return [
    reading,
    {
      id: 'd7-topic', name: 'Тема репетиции', tag: 'Своя или готовая тема',
      title: 'Выбери, о чём говорить',
      description: 'Вставь готовый текст или напиши тему и опорные мысли. Если своей задачи сейчас нет, возьми тему от приложения.',
      speechSetup: true,
    },
    {
      id: 'd7-rehearsal-1', name: 'Первая попытка', tag: '90 секунд',
      title: 'Скажи так, как получается сейчас',
      description: 'Не исправляй себя на ходу. Задача первой попытки — услышать текущую версию.',
      rehearsal: true, attempt: 1, prep: 15, duration: 90, record: true,
    },
    {
      id: 'd7-review', name: 'Одно улучшение', tag: 'Перед второй попыткой',
      title: 'Что изменишь сейчас?',
      description: 'Выбери только один элемент. Так разницу между попытками будет легче заметить.',
      rehearsalReview: true,
    },
    {
      id: 'd7-rehearsal-2', name: 'Вторая попытка', tag: '90 секунд',
      title: 'Повтори ту же речь',
      description: 'Сохрани тему и измени только выбранный элемент.',
      rehearsal: true, attempt: 2, prep: 10, duration: 90, record: true,
    },
    {
      id: 'd7-rehearsal-short', name: 'Короткая версия', tag: '30 секунд',
      title: 'Оставь самое важное',
      description: 'Передай ту же мысль короче: главная фраза, один пример и вывод.',
      rehearsal: true, shortVersion: true, prep: 5, duration: 30, record: true,
    },
    {
      id: 'd7-rating', name: 'Самооценка', tag: 'Итог недели',
      title: 'Как изменилась речь?',
      description: 'Оцени лёгкость второй попытки, а не идеальность результата.',
      rating: true,
    },
  ];
}

function stepsForSession(day = currentDay(), session = sessionFor(day.id)) {
  if (session.formatVersion !== SESSION_FORMAT) return day.steps;
  const baseSteps = day.id === 7 && session.practiceFormat === 1
    ? daySevenPracticeSteps(day)
    : day.steps;
  return [warmupStep(day, session), ...baseSteps];
}

function resolveStep(step) {
  const profile = goalProfiles[state.profile] || goalProfiles.conversation;
  const session = sessionFor();
  const tailoredPrompt = step.profilePrompts?.[state.profile];
  let tailored = tailoredPrompt ? { ...step, prompt: tailoredPrompt } : step;
  if (tailored.rehearsal) {
    const focus = rehearsalFocusOptions.find((item) => item.id === session.rehearsalFocus);
    return {
      ...tailored,
      prompt: session.customSpeechText || rehearsalSuggestions[state.profile] || rehearsalSuggestions.conversation,
      userText: true,
      helpTitle: tailored.attempt === 2 ? 'Твой фокус' : tailored.shortVersion ? 'Структура' : null,
      helpText: tailored.attempt === 2 ? focus?.tip : tailored.shortVersion ? 'Главная мысль → один пример → вывод.' : null,
    };
  }
  if (tailored.reuseReading) {
    const readingStep = currentDay().steps.find((item) => item.reading);
    const resolvedReading = readingStep ? resolveReading(readingStep) : null;
    return { ...tailored, prompt: resolvedReading?.prompt || tailored.prompt, reading: true };
  }
  if (tailored.reading) tailored = resolveReading(tailored);
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
  currentPhase = 'idle';
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
  currentPhase = 'idle';
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
  currentPhase = 'idle';
  app.replaceChildren(homeTemplate.content.cloneNode(true));
  const day = currentDay();
  const session = sessionFor();
  const start = document.querySelector('#startSession');
  const resumeNote = document.querySelector('#resumeNote');
  const changeGoal = document.querySelector('#changeGoal');
  const hasProgress = session.startedAt && !session.completedAt;
  const completed = Boolean(session.completedAt);
  const sessionSteps = stepsForSession(day, session);

  document.querySelector('#backWeek').addEventListener('click', renderWeek);
  document.querySelector('#dayEyebrow').textContent = `День ${day.id} · ${day.focus}`;
  document.querySelector('#homeTitle').textContent = day.title;
  document.querySelector('#dayLead').textContent = day.lead;
  document.querySelector('#dayMinutes').textContent = day.minutes;
  document.querySelector('#dayExerciseCount').textContent = sessionSteps.filter((step) => !step.rating).length;
  document.querySelector('#dayRecordingCount').textContent = sessionSteps.filter((step) => step.record).length;

  changeGoal.textContent = `Цель: ${goalProfiles[state.profile].label} · изменить`;
  changeGoal.addEventListener('click', renderOnboarding);
  renderSavedRecordings(day, session);

  if (hasProgress) {
    start.querySelector('span').textContent = 'Продолжить тренировку';
    resumeNote.hidden = false;
    resumeNote.textContent = session.stepIndex === 0
      ? 'Тренировка начата'
      : `Пройдено: ${session.stepIndex} из ${sessionSteps.length} этапов`;
  }

  if (completed) {
    start.querySelector('span').textContent = 'Пройти ещё раз';
    resumeNote.hidden = false;
    resumeNote.textContent = 'Предыдущая тренировка сохранена на устройстве';
  }

  start.addEventListener('click', () => {
    const dayKey = String(day.id);
    if (completed) {
      state.attempts[dayKey] = Number(state.attempts[dayKey] || 0) + 1;
      state.sessions[dayKey] = {
        ...freshSession(),
        recordings: [...session.recordings],
      };
    }
    const activeSession = sessionFor(day.id);
    activeSession.contentVariant ??= Number(state.attempts[dayKey] || 0);
    activeSession.startedAt ||= new Date().toISOString();
    saveState();
    renderSession();
  });
  focusMain();
}

function renderSession() {
  stopTimer();
  clearPlayback();
  currentPhase = 'idle';
  app.replaceChildren(sessionTemplate.content.cloneNode(true));

  const day = currentDay();
  const session = sessionFor();
  const sessionSteps = stepsForSession(day, session);
  const step = resolveStep(sessionSteps[session.stepIndex]);
  document.querySelector('#stepLabel').textContent = `День ${day.id} · этап ${session.stepIndex + 1} из ${sessionSteps.length}`;
  document.querySelector('#stepName').textContent = step.name;
  document.querySelector('#progressBar').style.width = `${((session.stepIndex + 1) / sessionSteps.length) * 100}%`;
  document.querySelector('#backHome').addEventListener('click', renderHome);
  const skip = document.querySelector('#skipStep');
  skip.hidden = Boolean(step.rating || step.speechSetup || step.rehearsalReview);
  if (!skip.hidden) {
    skip.addEventListener('click', () => {
      session.skipped = [...new Set([...session.skipped, step.id])];
      nextStep();
    });
  }

  const card = document.querySelector('#exerciseCard');
  if (step.rating) renderRatings(card, step);
  else if (step.warmup) renderWarmup(card, step);
  else if (step.speechSetup) renderSpeechSetup(card, step);
  else if (step.rehearsalReview) renderRehearsalReview(card, step);
  else if (step.sprint) renderSprint(card, step);
  else renderRecording(card, step);
  focusMain();
}

function exerciseHeader(step) {
  const promptClass = step.reading ? ' reading-text' : step.userText ? ' user-speech-text' : '';
  const prompt = step.prompt
    ? `<div class="prompt-box${promptClass}">${step.reading
      ? step.prompt.split('\n\n').map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')
      : escapeHtml(step.prompt)}</div>`
    : '';
  return `
    <div class="stage-tag">${escapeHtml(step.tag)}</div>
    <h2>${escapeHtml(step.title)}</h2>
    <p>${escapeHtml(step.description)}</p>
    ${prompt}
    ${step.helpText ? `<div class="learning-card"><strong>${escapeHtml(step.helpTitle || 'Как выполнить')}</strong><span>${escapeHtml(step.helpText)}</span></div>` : ''}
    ${step.anchors ? `<div class="anchors">${step.anchors.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>` : ''}
    ${step.rescue ? `<p class="status-message">${escapeHtml(step.rescue)}</p>` : ''}
  `;
}

function renderSpeechSetup(card, step) {
  const session = sessionFor();
  const suggested = rehearsalSuggestions[state.profile] || rehearsalSuggestions.conversation;
  card.innerHTML = `
    ${exerciseHeader(step)}
    <label class="input-label" for="customSpeechText">Текст, тема или опорные мысли</label>
    <textarea class="word-input speech-input" id="customSpeechText" maxlength="2000" placeholder="Например: объяснить новый проект — проблема, решение, результат"></textarea>
    <div class="input-meta"><span>Сохраняется только в этом браузере</span><span id="speechCharacterCount">0 / 2000</span></div>
    <div class="suggested-topic">
      <span>Готовая тема</span>
      <p>${escapeHtml(suggested)}</p>
    </div>
    <div class="button-stack">
      <button class="secondary-button" id="useSuggestedSpeech" type="button">Взять готовую тему</button>
      <button class="primary-button" id="saveCustomSpeech" type="button" disabled><span>Продолжить со своей темой</span><span aria-hidden="true">→</span></button>
    </div>
  `;

  const input = document.querySelector('#customSpeechText');
  const count = document.querySelector('#speechCharacterCount');
  const save = document.querySelector('#saveCustomSpeech');
  input.value = session.customSpeechMode === 'own' ? session.customSpeechText : '';

  const refresh = () => {
    const length = input.value.trim().length;
    count.textContent = `${input.value.length} / 2000`;
    save.disabled = length < 5;
  };
  refresh();
  input.addEventListener('input', refresh);
  save.addEventListener('click', () => {
    session.customSpeechText = input.value.trim();
    session.customSpeechMode = 'own';
    saveState();
    nextStep();
  });
  document.querySelector('#useSuggestedSpeech').addEventListener('click', () => {
    session.customSpeechText = suggested;
    session.customSpeechMode = 'suggested';
    saveState();
    nextStep();
  });
  input.focus();
}

function renderRehearsalReview(card, step) {
  const session = sessionFor();
  card.innerHTML = `
    ${exerciseHeader(step)}
    <div class="focus-options" role="radiogroup" aria-label="Что улучшить во второй попытке">
      ${rehearsalFocusOptions.map((option) => `
        <button class="focus-option${session.rehearsalFocus === option.id ? ' selected' : ''}" type="button" role="radio" aria-checked="${session.rehearsalFocus === option.id}" data-focus="${option.id}">
          <strong>${escapeHtml(option.label)}</strong>
          <span>${escapeHtml(option.tip)}</span>
        </button>
      `).join('')}
    </div>
    <div class="button-stack">
      <button class="primary-button" id="saveRehearsalFocus" type="button" ${session.rehearsalFocus ? '' : 'disabled'}><span>Перейти ко второй попытке</span><span aria-hidden="true">→</span></button>
    </div>
  `;

  const save = document.querySelector('#saveRehearsalFocus');
  document.querySelectorAll('.focus-option').forEach((button) => {
    button.addEventListener('click', () => {
      session.rehearsalFocus = button.dataset.focus;
      document.querySelectorAll('.focus-option').forEach((item) => {
        const selected = item === button;
        item.classList.toggle('selected', selected);
        item.setAttribute('aria-checked', String(selected));
      });
      save.disabled = false;
      saveState();
    });
  });
  save.addEventListener('click', nextStep);
}

function renderWarmup(card, step) {
  const total = step.parts.reduce((sum, part) => sum + part.duration, 0);
  card.innerHTML = `
    ${exerciseHeader(step)}
    <div class="warmup-list">
      ${step.parts.map((part, index) => `
        <div class="warmup-item">
          <span>${index + 1}</span>
          <div><strong>${part.label}</strong><p>${part.instruction}</p></div>
        </div>
      `).join('')}
    </div>
    <div class="timer-zone">
      <div class="timer" id="timer">${formatTime(total)}</div>
      <div class="timer-caption" id="timerCaption">Два упражнения · ${total} сек</div>
      <button class="primary-button" id="warmupAction" type="button"><span>Начать разогрев</span><span aria-hidden="true">→</span></button>
      <div class="status-message" id="warmupStatus">Запись не включается</div>
    </div>
  `;

  const action = document.querySelector('#warmupAction');
  const status = document.querySelector('#warmupStatus');
  action.addEventListener('click', async () => {
    action.disabled = true;
    currentPhase = 'warmup';
    for (const part of step.parts) {
      status.textContent = part.instruction;
      const completed = await runCountdown(part.duration, part.label, false);
      if (!completed) return;
    }
    currentPhase = 'done';
    action.remove();
    document.querySelector('#timerCaption').textContent = 'Разогрев завершён';
    status.textContent = 'Готово. Переходи к основной тренировке.';
    const buttons = document.createElement('div');
    buttons.className = 'button-stack warmup-continue';
    buttons.innerHTML = '<button class="primary-button" id="continueAfterWarmup" type="button"><span>Продолжить</span><span aria-hidden="true">→</span></button>';
    document.querySelector('.timer-zone').append(buttons);
    document.querySelector('#continueAfterWarmup').addEventListener('click', nextStep);
  });
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
  const step = resolveStep(stepsForSession(day, session)[session.stepIndex]);
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
    ${savedBlob ? `<button class="secondary-button" id="previewRecording" type="button">Прослушать до ${PREVIEW_SECONDS} секунд · необязательно</button>` : ''}
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
    playbackAudio.addEventListener('ended', () => {
      clearTimeout(playbackTimer);
      preview.textContent = `Прослушать до ${PREVIEW_SECONDS} секунд ещё раз`;
      status.textContent = 'Запись закончилась. Проверь только, понятна ли мысль.';
    });
    preview.addEventListener('click', async () => {
      if (!playbackAudio.paused) {
        playbackAudio.pause();
        clearTimeout(playbackTimer);
        preview.textContent = `Прослушать до ${PREVIEW_SECONDS} секунд · необязательно`;
        status.textContent = 'Прослушивание остановлено. Можно сразу продолжить.';
        return;
      }
      playbackAudio.currentTime = 0;
      try {
        await playbackAudio.play();
        preview.textContent = 'Остановить прослушивание';
        status.textContent = `Звучит запись — не дольше ${PREVIEW_SECONDS} секунд. Остановить можно в любой момент.`;
        playbackTimer = setTimeout(() => {
          playbackAudio.pause();
          preview.textContent = `Прослушать первые ${PREVIEW_SECONDS} секунд ещё раз`;
          status.textContent = 'Готово. Не оценивай голос — проверь только, понятна ли мысль.';
        }, PREVIEW_SECONDS * 1000);
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
  const focus = rehearsalFocusOptions.find((item) => item.id === session.rehearsalFocus);
  const rehearsalRecordings = session.recordings.filter((recording) =>
    ['d7-rehearsal-1', 'd7-rehearsal-2'].includes(recording.stepId)).length;
  const completionText = day.id === 7 && session.practiceFormat === 1
    ? rehearsalRecordings >= 2
      ? 'Ты выбрала материал, записала две версии одной речи и сократила её до главной мысли. Результат сохранён на этом устройстве.'
      : 'Ты выбрала материал и прошла весь сценарий репетиции. Сохранённые записи доступны на этом устройстве.'
    : 'Ты прочитала текст вслух и перенесла навык в самостоятельную речь. Результат сохранён на этом устройстве.';
  const mainResult = day.id === 7 && session.practiceFormat === 1
    ? rehearsalRecordings >= 2
      ? `Ты не просто записала речь, а повторила её с конкретной задачей: ${focus?.label.toLowerCase() || 'сделать следующую попытку яснее'}.`
      : `Ты выбрала один конкретный фокус для следующей попытки: ${focus?.label.toLowerCase() || 'говорить яснее'}.`
    : 'Ты закончила мысль, даже если говорила неидеально.';
  const secondSummaryCard = day.id === 7 && session.practiceFormat === 1
    ? `<div class="summary-card"><strong>${session.rehearsalFocus ? '1' : '0'}</strong><span>выбранный фокус</span></div>`
    : `<div class="summary-card"><strong>${session.sprintWords.length}</strong><span>слов в спринте</span></div>`;
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
    <p>${escapeHtml(completionText)}</p>
    <div class="summary-grid">
      <div class="summary-card"><strong>${session.recordings.length}</strong><span>голосовые записи</span></div>
      ${secondSummaryCard}
      <div class="summary-card"><strong>${session.ratings.thread}/5</strong><span>удерживать нить</span></div>
      <div class="summary-card"><strong>${session.ratings.words}/5</strong><span>находить слова</span></div>
    </div>
    <div class="rescue-card"><span>Главный результат</span><strong>${escapeHtml(mainResult)}</strong></div>
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
  const sessionSteps = stepsForSession(day, session);
  session.stepIndex = Math.min(session.stepIndex + 1, sessionSteps.length - 1);
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
