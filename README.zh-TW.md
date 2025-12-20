<p align="center"><img src="https://github.com/spboxer3/Prompt-Manager/blob/main/icons/icon128.png"></p>
<h1 align="center">Prompt Manager (專業提示詞管理器)</h1>
<p align="center"><img src="icons/chrome-web-store-badge.png" width="260"></p>
<p align="center"><a href="https://github.com/spboxer3/Prompt-Manager/blob/main/README.md">English</a> | 繁體中文</p>

**Prompt Manager** 是一款專為 Prompt Engineering 設計的專業級 Google Chrome 擴充功能。採用最新的 **Manifest V3** 標準，結合了用於管理的 **Side Panel (側邊欄)** 與用於快速執行的 **Spotlight (懸浮視窗)**，提供跨平台（ChatGPT, Claude, Gemini 等）一致且高效的 AI 工作流體驗。


## 🚀 核心功能


- **本地優先 (Local-First)**：所有 Prompt 與設定皆儲存於您瀏覽器的本地端 (`chrome.storage.local`)。我們絕不會將您的資料傳送至任何外部伺服器，確保隱私安全。
- **Spotlight 懸浮視窗 (快速啟動)**：
  - 透過快捷鍵 (`Alt+P` / `Option+P`) 或點擊擴充功能圖示即可喚醒。
  - 在當前網頁上直接懸浮顯示，不需切換視窗。
  - 支援快速搜尋、變數填寫，並直接將內容「插入」網頁對話框。
- **Side Panel 管理器**：專屬的後台介面，用於新增、編輯與分類您的 Prompt 庫。
- **智慧變數系統**：
  - **全域變數 (Global)**：在設定中以英文定義固定的數值（如 `{{tone}}`, `{{topic}}`），一次設定，自動填入。
  - **手動變數 (Manual)**：在 Prompt 中使用如 `{{topic}}` 的動態佔位符。執行時，系統會自動產生輸入框供您當場填寫。
- **一鍵插入**：無論是在 Side Panel 還是 Spotlight，編譯完成後點擊按鈕即可將內容輸入至網頁。
- **資料備份**：支援完整的 JSON 匯入/匯出功能（檔名包含時間戳記），方便備份或轉移。
- **多語言支援**：內建繁體中文、英文、日文、韓文、西班牙文與葡萄牙文。


## 📦 安裝說明


由於這是開發者版本，請依照以下步驟安裝：


1. 下載本專案或將程式碼複製到您的電腦資料夾中。
2. 開啟 Google Chrome 瀏覽器，前往 `chrome://extensions/`。
3. 開啟右上角的 **「開發人員模式」 (Developer mode)**。
4. 點擊左上角的 **「載入未封裝項目」 (Load unpacked)**。
5. 選擇包含擴充功能檔案（`manifest.json` 等）的資料夾。
6. 安裝完成！


## 🛠️ 使用指南


### 1. Spotlight (日常使用)


這是您與網頁互動的主要介面。


- **開啟**：點擊瀏覽器工具列圖示，或按下 **`Alt+P`** (Mac: `Option+P`)。
- **搜尋**：輸入關鍵字篩選標題、內容或標籤。
- **導航**：使用鍵盤 `↑` `↓` 選擇 Prompt。
- **插入**：按下 `Enter` 鍵，Prompt 會自動填入變數並輸入到網頁的對話框中。
- **設定**：點擊 Spotlight 右上角的齒輪圖示，即可打開 Side Panel 進行管理。


### 2. Side Panel (後台管理)


透過 Spotlight 的齒輪按鈕進入，用於維護您的資料庫。


- **建立 Prompt**：點擊 `+` 按鈕。
  - 語法範例：`請以 {{tone}} 的風格，寫一篇關於 {{topic}} 的文章。`
- **設定全域變數**：前往 **設定** > **全域變數管理**。
  - 例如設定 `tone` = `專業`。
  - 以後 Prompt 中的 `{{tone}}` 都會自動被替換為 `專業`。
- **備份**：在設定頁面中可匯出或匯入 JSON 資料。


### 3. 變數系統


- **全域變數**：如 `{{name}}` - 系統自動帶入設定好的固定值。
- **手動變數**：如 `{{topic}}` - 若未在全域定義，執行時會跳出輸入框讓您手動輸入。


## ⚙️ 設定


- **語言**：可在 Side Panel 設定頁面切換介面語言。
- **快捷鍵**：可在 `chrome://extensions/shortcuts` 中自定義開啟 Spotlight 的快捷鍵（預設為 `Alt+P`）。


## 🔒 隱私權政策


Prompt Manager 完全在您的瀏覽器**離線**運行。


- **無追蹤**：我們不收集任何使用數據。
- **無雲端儲存**：您的資料永遠儲存在您的裝置上。
- **權限使用**：我們僅在您主動操作時，使用 `activeTab` 與 `scripting` 權限將文字填入您當前瀏覽的網頁。

詳情請見<a href="https://github.com/spboxer3/Prompt-Manager/blob/main/PrivacyPolicy.zh-TW.md">隱私權政策</a>

## 📄 授權


MIT License
