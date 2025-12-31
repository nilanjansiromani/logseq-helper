# Logseq Helper

A browser extension to capture text to Logseq and view related blocks from any webpage.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285f4?style=flat&logo=googlechrome&logoColor=white)
![Firefox Extension](https://img.shields.io/badge/Firefox-Extension-FF7139?style=flat&logo=firefox&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green?style=flat)
![Material Design](https://img.shields.io/badge/Material-Design-757575?style=flat&logo=materialdesign&logoColor=white)

## Features

### 🖱️ Quick Capture
Select any text on a webpage and capture it to Logseq with customizable formats:
- **TODO** - Capture as a task with optional deadline (calendar picker)
- **Quote** - Capture as a blockquote
- **Note** - Capture as a simple note
- **Code** - Capture as a code block
- Create your own custom formats!

### 📋 Overlay Panel
Press `Ctrl+Shift+L` (or `Cmd+Shift+L` on Mac) to open the overlay panel showing:
- **TODOs** - Checklist of captured tasks with links to Logseq
- **User Notes** - Write and insert notes manually
- **Captured** - All captured content from the current page

### 🔗 Highlight URLs
Captures include "Copy link to Highlight" style URLs that scroll directly to the selected text when clicked.

### 📅 Deadline Calendar
When capturing TODOs, a calendar popup lets you set a deadline in Logseq's format.

### ⚙️ Settings Panel
- Configure Logseq API connection (host, token)
- Choose capture destination (Today's Journal or specific page)
- Select journal date format
- Customize capture formats with variables

## Project Structure

```
logseq-helper/
├── chrome-extension/     # Chrome/Chromium extension
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── content.css
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   ├── icons/
│   └── lib/
│       └── marked.min.js
│
├── firefox-extension/    # Firefox extension
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── content.css
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   ├── icons/
│   └── lib/
│       └── marked.min.js
│
├── package.json
└── README.md
```

## Installation

### Prerequisites

1. Enable Logseq HTTP APIs server:
   - Open Logseq
   - Go to **Settings** → **Features**
   - Enable **HTTP APIs server**
   - Note the **Authorization token**

### Chrome / Chromium

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `chrome-extension` folder

### Firefox

1. Open Firefox and go to `about:debugging`
2. Click **This Firefox** in the sidebar
3. Click **Load Temporary Add-on**
4. Select any file in the `firefox-extension` folder (e.g., `manifest.json`)

**For permanent installation in Firefox:**
1. Go to `about:addons`
2. Click the gear icon → **Install Add-on From File**
3. Select the packaged `.xpi` file (see Packaging section)

## Setup

1. Click the extension icon to open settings
2. Enter your Logseq API settings:
   - **API Host**: Usually `http://127.0.0.1:12315`
   - **API Token**: From Logseq settings
   - **Graph Name**: Auto-detected or enter manually
3. Select your **Journal Date Format** to match Logseq
4. Click **Save Settings**

## Usage

### Capturing Text

1. Select any text on a webpage
2. A popup will appear with capture options (TODO, Quote, Note, Code)
3. For TODO: Select a deadline from the calendar (or skip)
4. The text is captured to Logseq!

### Viewing & Taking Notes

1. Press `Ctrl+Shift+L` (or `Cmd+Shift+L` on Mac)
2. The overlay panel opens on the left
3. View TODOs, write notes, or see captured content
4. Click links to open blocks in Logseq

## Packaging

### Chrome Web Store

```bash
cd chrome-extension
zip -r ../logseq-helper-chrome.zip . -x "*.DS_Store"
```

### Firefox Add-ons

```bash
cd firefox-extension
zip -r ../logseq-helper-firefox.xpi . -x "*.DS_Store"
```

Or use `web-ext`:

```bash
cd firefox-extension
npx web-ext build
```

## Template Variables

Use these in your custom capture formats:

| Variable | Description |
|----------|-------------|
| `{{content}}` | Selected text |
| `{{url}}` | Page URL |
| `{{title}}` | Page title |
| `{{highlightUrl}}` | Text fragment URL |
| `{{date}}` | Current date (YYYY-MM-DD) |
| `{{time}}` | Current time |

## Tech Stack

- **Manifest V3** - Latest extension standard
- **Material Design** - Clean, modern UI
- **Logseq HTTP API** - Direct integration
- **marked.js** - Markdown rendering
- **Text Fragments** - Highlight URLs

## License

MIT License

## Acknowledgments

Inspired by [logseq-copilot](https://github.com/EINDEX/logseq-copilot).
