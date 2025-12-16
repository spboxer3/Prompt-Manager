# Privacy Policy for Prompt Manager


**Last Updated:** December 16, 2025


**Prompt Manager** ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how our Chrome Extension operates, how it handles your data, and the permissions it requires.


## Core Principle: Local-First & Private


Prompt Manager is architected as a **"Local-First"** application. This means:


1. **No Cloud Sync**: We do not operate any backend servers, databases, or cloud storage.
2. **No Analytics**: We do not include any tracking scripts (e.g., Google Analytics, Mixpanel) to monitor your usage.
3. **No Data Collection**: We do not collect, store, share, or sell your personal data, prompts, or browsing history.


All data you create within the extension remains exclusively on your local device.


## 1. Data Storage


### User-Generated Content


Your prompts, variables, settings, and tags are stored locally in your browser using the `chrome.storage.local` API. This data is sandboxed within your Chrome profile and is not accessible to us or any third parties.


### Data Backup


Since we do not store your data on our servers, you are responsible for your own backups. We provide an "Export JSON" feature in the settings that allows you to save a copy of your data to your local hard drive.


## 2. Permissions Usage


To provide its functionality, Prompt Manager requires specific permissions. We adhere to the **Principle of Least Privilege**:


- **`activeTab`**:
  - **Why we need it**: To allow the "Spotlight" feature (opened via `Alt+P` or clicking the icon) to appear over your current webpage.
  - **How it works**: This permission grants the extension temporary access to the currently active tab *only when you explicitly invoke the extension*. It does not allow us to monitor your browsing history in the background.
- **`scripting`**:
  - **Why we need it**: To verify if the text insertion logic (`content.js`) is loaded and to execute it when necessary.
  - **How it works**: When you use the "Insert" function from the Spotlight overlay or Side Panel, the extension programmatically inserts your text into the active input field of the webpage. This requires script injection capabilities.
- **`sidePanel`**:
  - **Why we need it**: To display the main management interface in the browser's side panel.
- **`storage`**:
  - **Why we need it**: To save your prompts and settings locally on your device.


## 3. Interaction with Webpages


The extension interacts with webpages (DOM) only under the following strict conditions:


1. **Spotlight Overlay**: When you press the shortcut or click the extension icon, we inject a temporary UI (`spotlight.js`) into the page to allow you to search and select prompts.
2. **Text Insertion**: When you confirm an action, we insert the text into the currently focused input field.


The extension **does not** passively read, record, or transmit page content from websites you visit.


## 4. Changes to This Policy


We may update our Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify users of any material changes by updating the "Last Updated" date at the top of this policy.


## 5. Contact Us


If you have any questions about this Privacy Policy or our privacy practices, please contact us via the Chrome Web Store support page.