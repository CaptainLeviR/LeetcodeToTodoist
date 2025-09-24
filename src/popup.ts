import type {
  CreateTaskRequest,
  CreateTaskResponse,
  DueSelection,
  GetProblemDataResponse,
} from './types.js';

interface ProblemData {
  title: string;
  url: string;
}

let currentProblem: ProblemData | null = null;

const views = {
  loading: document.querySelector('[data-view="loading"]') as HTMLDivElement | null,
  error: document.querySelector('[data-view="error"]') as HTMLDivElement | null,
  content: document.querySelector('[data-view="content"]') as HTMLDivElement | null,
};

const errorMessage = document.querySelector('[data-role="error-message"]') as HTMLParagraphElement | null;
const retryButton = document.querySelector('[data-action="retry"]') as HTMLButtonElement | null;
const titleEl = document.querySelector('[data-role="problem-title"]') as HTMLElement | null;
const urlEl = document.querySelector('[data-role="problem-url"]') as HTMLAnchorElement | null;
const form = document.getElementById('todoist-form') as HTMLFormElement | null;
const dueSelect = document.getElementById('due-option') as HTMLSelectElement | null;
const customDateWrapper = document.querySelector('[data-role="custom-date"]') as HTMLDivElement | null;
const customDateInput = document.getElementById('custom-date') as HTMLInputElement | null;
const statusEl = document.querySelector('[data-role="status"]') as HTMLDivElement | null;
const configureButtons = document.querySelectorAll<HTMLButtonElement>('[data-action="configure"]');
const calendarEl = document.querySelector('[data-role="calendar"]') as HTMLDivElement | null;
const calendarMonthLabel = calendarEl?.querySelector('[data-role="calendar-month"]') as HTMLSpanElement | null;
const calendarGrid = calendarEl?.querySelector('[data-role="calendar-grid"]') as HTMLDivElement | null;
const calendarToggle = document.querySelector('[data-action="toggle-calendar"]') as HTMLButtonElement | null;
const prevMonthBtn = calendarEl?.querySelector('[data-action="prev-month"]') as HTMLButtonElement | null;
const nextMonthBtn = calendarEl?.querySelector('[data-action="next-month"]') as HTMLButtonElement | null;

initialize();

let calendarVisible = false;
let calendarMonth = startOfMonth(new Date());

function initialize() {
  retryButton?.addEventListener('click', () => {
    loadProblemData();
  });

  configureButtons.forEach((button) => {
    button.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  });

  dueSelect?.addEventListener('change', () => {
    if (!customDateWrapper) {
      return;
    }
    const show = dueSelect.value === 'custom';
    customDateWrapper.style.display = show ? 'block' : 'none';
    if (!show) {
      closeCalendar();
    }
  });

  calendarToggle?.addEventListener('click', (event) => {
    event.preventDefault();
    if (calendarVisible) {
      closeCalendar();
    } else {
      openCalendar();
    }
  });

  customDateInput?.addEventListener('click', (event) => {
    event.preventDefault();
    openCalendar();
  });

  prevMonthBtn?.addEventListener('click', () => {
    calendarMonth = addMonths(calendarMonth, -1);
    renderCalendar();
  });

  nextMonthBtn?.addEventListener('click', () => {
    calendarMonth = addMonths(calendarMonth, 1);
    renderCalendar();
  });

  calendarGrid?.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (!target || target.tagName !== 'BUTTON') {
      return;
    }
    const day = Number((target as HTMLButtonElement).dataset.day);
    if (!Number.isFinite(day) || !customDateInput) {
      return;
    }
    const selectedDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    customDateInput.value = formatDate(selectedDate);
    closeCalendar();
  });

  document.addEventListener('mousedown', (event) => {
    if (!calendarVisible) {
      return;
    }
    const target = event.target as Node;
    if (
      calendarEl?.contains(target) ||
      customDateWrapper?.contains(target)
    ) {
      return;
    }
    closeCalendar();
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentProblem || !dueSelect) {
      return;
    }

    const due = resolveDueSelection(dueSelect.value, customDateInput?.value ?? '');
    if (!due) {
      renderStatus('Please pick when you want Todoist to remind you.', 'error');
      return;
    }

    setFormBusy(true);
    renderStatus('', undefined);

    const request: CreateTaskRequest = {
      type: 'createTodoistTask',
      title: currentProblem.title,
      url: currentProblem.url,
      due,
    };

    const response = await sendCreateTaskMessage(request);
    handleTaskResponse(response);
  });

  loadProblemData();
}

function showView(target: keyof typeof views) {
  Object.entries(views).forEach(([name, element]) => {
    if (!element) {
      return;
    }
    if (name === target) {
      element.removeAttribute('hidden');
    } else {
      element.setAttribute('hidden', 'true');
    }
  });
}

async function loadProblemData() {
  showView('loading');
  renderStatus('', undefined);
  setFormBusy(false);

  try {
    const response = await requestProblemData();
    if (response?.ok && response.data) {
      currentProblem = response.data;
      populateProblemDetails(response.data);
      resetForm();
      showView('content');
      return;
    }

    const message = response?.message ?? 'Unable to find a LeetCode problem on this tab.';
    showError(message);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to read problem details from this page.';
    showError(message);
  }
}

function showError(message: string) {
  if (errorMessage) {
    errorMessage.textContent = message;
  }
  showView('error');
}

function populateProblemDetails(problem: ProblemData) {
  titleEl && (titleEl.textContent = problem.title);
  if (urlEl) {
    urlEl.textContent = problem.url;
    urlEl.setAttribute('href', problem.url);
  }
}

function resetForm() {
  if (dueSelect) {
    dueSelect.selectedIndex = 0;
    dueSelect.dispatchEvent(new Event('change'));
  }
  if (customDateInput) {
    customDateInput.value = '';
  }
  closeCalendar();
  renderStatus('', undefined);
  setFormBusy(false);
}

function renderStatus(message: string, tone: 'success' | 'error' | undefined) {
  if (!statusEl) {
    return;
  }
  statusEl.textContent = message;
  if (tone) {
    statusEl.dataset.tone = tone;
  } else {
    delete statusEl.dataset.tone;
  }
}

function setFormBusy(isBusy: boolean) {
  if (!form) {
    return;
  }
  const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
  if (submitButton) {
    submitButton.disabled = isBusy;
    submitButton.textContent = isBusy ? 'Adding…' : 'Add to Todoist';
  }
  dueSelect && (dueSelect.disabled = isBusy);
  customDateInput && (customDateInput.disabled = isBusy);
}

function openCalendar() {
  if (!calendarEl) {
    return;
  }
  const initial = parseDate(customDateInput?.value ?? '') ?? new Date();
  calendarMonth = startOfMonth(initial);
  calendarEl.hidden = false;
  calendarVisible = true;
  renderCalendar();
}

function closeCalendar() {
  if (!calendarEl) {
    return;
  }
  calendarEl.hidden = true;
  calendarVisible = false;
}

function renderCalendar() {
  if (!calendarGrid || !calendarMonthLabel) {
    return;
  }
  calendarMonthLabel.textContent = calendarMonth.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
  calendarGrid.innerHTML = '';

  const firstDay = startOfMonth(calendarMonth);
  const leadingSpaces = firstDay.getDay();
  for (let i = 0; i < leadingSpaces; i += 1) {
    const span = document.createElement('span');
    calendarGrid.appendChild(span);
  }

  const totalDays = daysInMonth(calendarMonth);
  const selected = parseDate(customDateInput?.value ?? '');

  for (let day = 1; day <= totalDays; day += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = String(day);
    button.dataset.day = String(day);

    if (
      selected &&
      selected.getFullYear() === calendarMonth.getFullYear() &&
      selected.getMonth() === calendarMonth.getMonth() &&
      selected.getDate() === day
    ) {
      button.dataset.state = 'selected';
    }

    calendarGrid.appendChild(button);
  }
}

function resolveDueSelection(option: string, customDateValue: string): DueSelection | null {
  switch (option) {
    case 'tomorrow':
      return { type: 'string', value: 'tomorrow' };
    case 'twoDays':
      return { type: 'string', value: 'in 2 days' };
    case 'threeDays':
      return { type: 'string', value: 'in 3 days' };
    case 'fourDays':
      return { type: 'string', value: 'in 4 days' };
    case 'fiveDays':
      return { type: 'string', value: 'in 5 days' };
    case 'sixDays':
      return { type: 'string', value: 'in 6 days' };
    case 'oneWeek':
      return { type: 'string', value: 'in 1 week' };
    case 'custom':
      if (!customDateValue) {
        return null;
      }
      return { type: 'date', value: customDateValue };
    default:
      return null;
  }
}

async function sendCreateTaskMessage(message: CreateTaskRequest): Promise<CreateTaskResponse> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: CreateTaskResponse) => {
      resolve(response);
    });
  });
}

function handleTaskResponse(response: CreateTaskResponse) {
  if (response.ok) {
    renderStatus('Task created in Todoist!', 'success');
    setFormBusy(false);
    return;
  }

  if (response.error === 'missing_token') {
    renderStatus('Add your Todoist API token in the extension options.', 'error');
    setFormBusy(false);
    return;
  }

  renderStatus(response.message ?? 'Unable to create the task. Try again.', 'error');
  setFormBusy(false);
}

async function requestProblemData(): Promise<GetProblemDataResponse | undefined> {
  const activeTab = await queryActiveTab();
  if (!activeTab?.id) {
    return { ok: false, message: 'No active tab detected.' };
  }

  try {
    return await sendMessageToTab<GetProblemDataResponse>(activeTab.id, { type: 'getProblemData' });
  } catch (error) {
    if (error instanceof Error && /Receiving end does not exist/.test(error.message)) {
      return {
        ok: false,
        message: 'Open a LeetCode problem page and try again.',
      };
    }
    throw error;
  }
}

function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }
  return candidate;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function queryActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]);
    });
  });
}

function sendMessageToTab<T>(tabId: number, message: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response: T) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}
