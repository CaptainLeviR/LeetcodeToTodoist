import type { CreateTaskRequest, CreateTaskResponse, DueSelection } from './types.js';

const TODOIST_TASKS_ENDPOINT = 'https://api.todoist.com/rest/v2/tasks';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if ((message as CreateTaskRequest)?.type === 'createTodoistTask') {
    handleCreateTask(message as CreateTaskRequest)
      .then(sendResponse)
      .catch((error: unknown) => {
        console.error('Failed to create Todoist task', error);
        const response: CreateTaskResponse = {
          ok: false,
          error: 'network_error',
          message: error instanceof Error ? error.message : String(error),
        };
        sendResponse(response);
      });
    return true;
  }
  return undefined;
});

async function handleCreateTask(request: CreateTaskRequest): Promise<CreateTaskResponse> {
  const token = await getTodoistToken();
  if (!token) {
    return { ok: false, error: 'missing_token', message: 'Todoist API token not set.' };
  }

  const payload = buildTodoistPayload(request.title, request.url, request.due);

  const response = await fetch(TODOIST_TASKS_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Request-Id': crypto.randomUUID(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await safeReadText(response);
    return {
      ok: false,
      error: 'todoist_error',
      message: `Todoist API responded with ${response.status}: ${errorText}`,
    };
  }

  return { ok: true };
}

async function getTodoistToken(): Promise<string | undefined> {
  return new Promise((resolve) => {
    chrome.storage.sync.get('todoistApiToken', (items) => {
      resolve(items.todoistApiToken);
    });
  });
}

function buildTodoistPayload(title: string, url: string, due: DueSelection) {
  const basePayload: Record<string, unknown> = {
    content: title,
    description: url,
  };

  if (due.type === 'string') {
    basePayload.due_string = due.value;
  } else if (due.type === 'date') {
    basePayload.due_date = due.value;
  }

  return basePayload;
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch (error) {
    console.warn('Could not read response text', error);
    return '<no response body>';
  }
}
