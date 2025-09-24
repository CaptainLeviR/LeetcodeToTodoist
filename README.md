# LeetCode to Todoist

A Chrome extension that lets you capture LeetCode problems into Todoist straight from the problem page. Open the toolbar popup, pick a revisit schedule, and a Todoist task is created with the problem title and link.

## Development

```bash
npm install
npm run build
```

The compiled extension lives in the `dist/` folder. Load it in Chrome via **chrome://extensions** → **Load unpacked** and select the `dist` directory.

## Usage

1. Open the extension options page and paste your Todoist REST API token (Todoist → Settings → Integrations). If you already saved it, the footer button in the popup shows “Edit API token”; otherwise it reads “Add Todoist API token”.
2. Visit any LeetCode problem such as `https://leetcode.com/problems/two-sum/`.
3. Click the extension icon in the Chrome toolbar to open the popup.
4. Choose one of the quick reminders (tomorrow, in 2–6 days, in 1 week) or pick a custom date from the inline calendar, then press “Add to Todoist”.
5. The task is created in Todoist with the problem title as the content and the URL in the description.

### Managing your Todoist token

- To update the token, use the **Edit API token** button in the popup or open the options page directly via the Chrome extensions menu.
- To remove the token from this browser, use the **Remove API token** button on the options page.

## Building Again

- `npm run watch` keeps TypeScript files compiling as you work.
- `npm run clean` removes the generated `dist/` folder.
- `npm run release` bumps the extension version (patch by default), rebuilds, and outputs `release/leetcode-to-todoist-vX.Y.Z.zip` ready for the Chrome Web Store. Use `npm run release -- minor` or `-- major` to bump different segments.

## Features

- Toolbar popup with light/dark theme that follows your system setting.
- Automatic detection of the active LeetCode problem (title + URL).
- Quick natural-language due options plus a custom date picker.
- Background service worker integrates with the Todoist REST API.
- Options page to store or remove your Todoist API token securely in Chrome sync storage.
