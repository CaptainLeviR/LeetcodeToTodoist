document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('todoist-token-form') as HTMLFormElement | null;
  const tokenInput = document.getElementById('todoist-token') as HTMLInputElement | null;
  const statusEl = document.querySelector('[data-role="status"]') as HTMLDivElement | null;

  if (!form || !tokenInput) {
    return;
  }

  loadExistingToken(tokenInput, statusEl);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const token = tokenInput.value.trim();

    if (!token) {
      renderStatus(statusEl, 'Please enter your Todoist API token.', 'error');
      return;
    }

    chrome.storage.sync.set({ todoistApiToken: token }, () => {
      if (chrome.runtime.lastError) {
        renderStatus(statusEl, chrome.runtime.lastError.message ?? 'Unable to save token.', 'error');
        return;
      }
      renderStatus(statusEl, 'Saved! You can now add problems to Todoist.', 'success');
    });
  });
});

function loadExistingToken(input: HTMLInputElement, statusEl: HTMLDivElement | null) {
  chrome.storage.sync.get('todoistApiToken', (items) => {
    if (chrome.runtime.lastError) {
      renderStatus(statusEl, chrome.runtime.lastError.message ?? 'Unable to load token.', 'error');
      return;
    }

    if (items.todoistApiToken) {
      input.value = items.todoistApiToken;
      renderStatus(statusEl, 'Your Todoist token is stored securely in the browser.', 'info');
    }
  });
}

function renderStatus(
  statusEl: HTMLDivElement | null,
  message: string,
  tone: 'success' | 'error' | 'info'
) {
  if (!statusEl) {
    return;
  }
  statusEl.dataset.tone = tone;
  statusEl.textContent = message;
}
