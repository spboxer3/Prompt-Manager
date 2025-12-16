<p align="center"><img src="https://github.com/spboxer3/Prompt-Manager/blob/main/icons/icon128.png"></p>
<h1 align="center">Prompt Manager</h1>

<p align="center">English|<a href="https://github.com/spboxer3/Prompt-Manager/blob/main/README.zh-TW.md">繁體中文</a></p>

**Prompt Manager** is a professional-grade Google Chrome Extension designed for efficient Prompt Engineering. Built on the **Manifest V3** standard, it combines a **Side Panel** for management and a **Spotlight Overlay** for rapid execution, ensuring a seamless workflow across any AI platform (ChatGPT, Claude, Gemini, etc.).


## 🚀 Key Features


- **Local-First Privacy**: All data is stored locally in your browser (`chrome.storage.local`). No data is ever sent to external servers.
- **Spotlight Overlay (Quick Insert)**:
  - Activate via shortcut (`Alt+P` / `Option+P`) or by clicking the extension icon.
  - A floating command palette appears directly over your webpage.
  - Search, fill variables, and insert prompts into the active input field without losing context.
- **Side Panel Manager**: A dedicated workspace for creating, editing, and organizing your prompt library.
- **Smart Variable System**:
  - **Global Variables**: Define constant values (e.g., `{{name}}`, `{{language}}`) in Settings once, and they are auto-filled everywhere.
  - **Manual Variables**: Use dynamic placeholders like `{{topic}}` in your prompts. The extension generates input fields for you to fill in at runtime.
- **One-Click Insertion**: Whether from the Side Panel or Spotlight, insert compiled prompts directly into the webpage's text area.
- **Data Portability**: Full JSON Import/Export support with timestamped backups.
- **Multi-Language Support**: Available in English, Traditional Chinese, Japanese, Korean, Spanish, and Portuguese.


## 📦 Installation


Since this is a developer version, please follow these steps to install:


1. Download or clone this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked**.
5. Select the folder containing the extension files (`manifest.json`, etc.).
6. The extension is now installed!


## 🛠️ Usage Guide


### 1. The Spotlight (Quick Action)


The Spotlight is your primary tool for daily usage. It floats over your current page.


- **Open**: Click the extension icon in the toolbar or press **`Alt+P`** (Mac: `Option+P`).
- **Search**: Type to filter your prompts by title, content, or tags.
- **Navigate**: Use `↑` and `↓` arrow keys to select a prompt.
- **Insert**: Press `Enter` to compile and insert the prompt into the active input field (e.g., the chat box).
- **Settings**: Click the gear icon in the Spotlight header to open the Side Panel manager.


### 2. The Side Panel (Management)


Use the Side Panel to manage your library. Open it via the gear icon in Spotlight.


- **Create Prompt**: Click `+` to add a new prompt.
  - Syntax: `Write a {{tone}} email about {{topic}}.`
- **Global Variables**: Go to **Settings** > **Global Variables**.
  - Define `tone` = `professional`.
  - Now, `{{tone}}` will be automatically replaced with `professional` whenever you use it.
- **Import/Export**: Backup your data in the Settings tab.


### 3. Variable System


- **Global**: `{{my_name}}` - Auto-replaced by the value defined in Settings.
- **Manual**: `{{topic}}` - If not defined in Global, an input box will appear for you to type manually before insertion.


## ⚙️ Configuration


- **Language**: Switch interface language in the Side Panel Settings.
- **Shortcuts**: Customize the activation shortcut in `chrome://extensions/shortcuts` (Default: `Alt+J`).


## 🔒 Privacy Policy


Prompt Manager operates entirely **offline** within your browser.


- **No Analytics**: We do not track your usage.
- **No Cloud Storage**: Your prompts never leave your device unless you manually export them.
- **Permissions**: We use `activeTab` and `scripting` solely to inject the text you selected into the page you are currently viewing.

For details, please see our <a href="https://github.com/spboxer3/Prompt-Manager/blob/main/PrivacyPolicy.md">Privacy Policy</a>

## 📄 License


MIT License
