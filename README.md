# LeetCode to Todoist

A Chrome extension that displays a Todoist shortcut on LeetCode problem pages so you can schedule a revisit reminder in Todoist with one click.

## Development

```bash
npm install
npm run build
```

The compiled extension lives in the `dist/` folder. Load it in Chrome via **chrome://extensions** → **Load unpacked** and select the `dist` directory.

## Usage

1. Open the extension options page and paste your Todoist REST API token (Todoist → Settings → Integrations).
2. Visit any LeetCode problem such as `https://leetcode.com/problems/two-sum/`.
3. Click the extension icon in the Chrome toolbar to open the Todoist scheduler popup.
4. Choose when you want to revisit the problem and add the task; the extension sends the problem title and URL to Todoist.

## Building Again

- `npm run watch` keeps TypeScript files compiling as you work.
- `npm run clean` removes the generated `dist/` folder.
