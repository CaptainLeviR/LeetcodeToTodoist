type GetProblemDataRequest = {
  type: 'getProblemData';
};

type GetProblemDataResponse = {
  ok: boolean;
  data?: {
    title: string;
    url: string;
  };
  message?: string;
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if ((message as GetProblemDataRequest)?.type === 'getProblemData') {
    retrieveProblemData()
      .then(sendResponse)
      .catch((error: unknown) => {
        const response: GetProblemDataResponse = {
          ok: false,
          message:
            error instanceof Error ? error.message : 'Unable to read the problem right now.',
        };
        sendResponse(response);
      });
    return true;
  }
  return undefined;
});

async function retrieveProblemData(): Promise<GetProblemDataResponse> {
  if (!isProblemPage()) {
    return { ok: false, message: 'Open a LeetCode problem to create a task.' };
  }

  const data = await pollForProblemData(6, 250);
  if (!data) {
    return { ok: false, message: 'Still loading the problem. Try again in a moment.' };
  }

  return { ok: true, data };
}

async function pollForProblemData(attempts: number, delayMs: number) {
  for (let i = 0; i < attempts; i += 1) {
    const data = extractProblemData();
    if (data) {
      return data;
    }
    await sleep(delayMs);
  }
  return null;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function extractProblemData(): { title: string; url: string } | null {
  const title = extractProblemTitle();
  if (!title) {
    return null;
  }

  const cleanUrl = window.location.href.split('#')[0];
  return { title, url: cleanUrl };
}

function extractProblemTitle(): string | null {
  const selectors = [
    'div[data-cy="question-title"]',
    'h1[data-cy="challenge-editor-title"]',
    'div[data-key="description-title"]',
    'div.text-title-large',
    'h1',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    const text = element?.textContent?.trim();
    if (text) {
      return text.replace(/\s+/g, ' ');
    }
  }

  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
  if (ogTitle) {
    return ogTitle.replace(/\s*-\s*LeetCode\s*$/, '').trim();
  }

  const docTitle = document.title.replace(/\s*-\s*LeetCode\s*$/, '').trim();
  return docTitle || null;
}

function isProblemPage(): boolean {
  return /leetcode\.com\/problems\//.test(window.location.href);
}
