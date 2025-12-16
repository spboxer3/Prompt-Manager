// 1. 設定點擊圖標時 *不* 自動開啟側邊欄，以便我們可以手動控制開啟 Spotlight
chrome.sidePanel
	.setPanelBehavior({ openPanelOnActionClick: false })
	.catch((error) => console.error(error));

// 封裝 Spotlight 注入邏輯 (共用函式)
async function injectAndToggleSpotlight(tab) {
	if (!tab || !tab.id) return;
	// 排除系統頁面
	if (
		tab.url.startsWith("chrome://") ||
		tab.url.startsWith("edge://") ||
		tab.url.startsWith("about:")
	)
		return;

	try {
		// 1. 先注入多語系定義檔
		await chrome.scripting.executeScript({
			target: { tabId: tab.id },
			files: ["locales.js"],
		});

		// 2. 注入核心引擎 (content.js) - 負責實際的 DOM 操作與焦點追蹤
		await chrome.scripting.executeScript({
			target: { tabId: tab.id },
			files: ["content.js"],
		});

		// 3. 注入 Spotlight UI
		await chrome.scripting.executeScript({
			target: { tabId: tab.id },
			files: ["spotlight.js"],
		});

		// 4. 發送切換訊號
		chrome.tabs
			.sendMessage(tab.id, { action: "TOGGLE_SPOTLIGHT" })
			.catch(() => {
				// 忽略發送失敗 (通常是因為腳本剛注入還在初始化)
			});
	} catch (err) {
		console.error("Spotlight injection failed:", err);
	}
}

// 2. 監聽圖標點擊事件 -> 開啟 Spotlight
chrome.action.onClicked.addListener((tab) => {
	injectAndToggleSpotlight(tab);
});

// 3. 監聽快捷鍵指令
chrome.commands.onCommand.addListener(async (command) => {
	// 無論是點擊圖標的快捷鍵 (_execute_action) 還是自定義的 toggle_spotlight
	// 我們都統一開啟 Spotlight
	if (command === "toggle_spotlight" || command === "_execute_action") {
		const [tab] = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});
		injectAndToggleSpotlight(tab);
	}
});

// 4. 監聽訊息 (僅保留開啟 SidePanel)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	// 處理開啟 Side Panel 指令 (來自 Spotlight 的齒輪按鈕)
	if (message.action === "OPEN_SIDEPANEL") {
		if (sender.tab && sender.tab.id) {
			chrome.sidePanel
				.open({ tabId: sender.tab.id })
				.catch((error) => console.error("Failed to open side panel:", error));
		} else if (sender.tab && sender.tab.windowId) {
			chrome.sidePanel
				.open({ windowId: sender.tab.windowId })
				.catch((error) => console.error("Failed to open side panel:", error));
		}
	}
});
