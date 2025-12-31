(function () {
  if (window.hasRunpromptManagerSpotlight) {
    return;
  }
  window.hasRunpromptManagerSpotlight = true;
  window.promptManager = window.promptManager || {};

  let prompts = [],
    globalVars = [],
    activeIndex = 0,
    filteredPrompts = [],
    currentLang = "en";
  // 新增狀態：是否正在填寫變數模式
  let isVarMode = false;
  let currentPendingPrompt = null; // 暫存等待填寫的 Prompt
  let manualVars = []; // 需要填寫的變數列表

  function t(key) {
    const locales = window.promptManagerLocales;
    if (!locales) return key;
    if (locales[currentLang] && locales[currentLang][key])
      return locales[currentLang][key];
    return locales["en"][key] || key;
  }

  const cssStyles = `
    :host { all: initial; position: fixed; top: 0; left: 0; z-index: 2147483647; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; }
    #overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: transparent; display: none; pointer-events: none; }
    #card { position: fixed; top: 15vh; left: 50vw; transform: translateX(-50%); width: 600px; max-width: 90%; background: #fff; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.1); display: flex; flex-direction: column; overflow: hidden; pointer-events: auto; color: #333; font-size: 14px; }
    
    /* Header & Search */
    .header { padding: 16px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 12px; cursor: move; user-select: none; background: #fff; }
    .search-icon { font-size: 18px; color: #999; }
    input.main-search { flex: 1; border: none; outline: none; font-size: 18px; color: #333; background: transparent; padding: 0; margin: 0; font-family: inherit; cursor: text; }
    input.main-search::placeholder { color: #ccc; }
    .settings-btn { background: none; border: none; cursor: pointer; color: #999; padding: 6px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: all 0.2s; }
    .settings-btn:hover { color: #333; background: #f5f5f5; }
    .settings-btn svg { width: 20px; height: 20px; fill: currentColor; }
    
    /* List View */
    ul { max-height: 400px; overflow-y: auto; padding: 8px; margin: 0; list-style: none; background: #fff; }
    li { padding: 10px 12px; border-radius: 6px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.1s; border-left: 3px solid transparent; }
    li.active, li:hover { background: #f5f5f5; border-left-color: #000; }
    .item-content { flex: 1; min-width: 0; }
    .item-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-preview { font-size: 12px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-tags { margin-top: 4px; display: flex; gap: 4px; overflow: hidden; }
    .item-tag { font-size: 10px; color: #555; background: #eee; padding: 2px 6px; border-radius: 4px; white-space: nowrap; }
    
    /* Variable Form View */
    #var-form { padding: 16px; max-height: 400px; overflow-y: auto; background: #fff; display: none; }
    .var-form-title { font-weight: 600; margin-bottom: 12px; font-size: 15px; color: #333; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px; }
    .var-group { margin-bottom: 12px; }
    .var-label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; font-weight: 500; }
    .var-input { width: 100%; padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box; outline: none; transition: border-color 0.2s; }
    .var-input:focus { border-color: #000; background: #fafafa; }
    
    /* Footer */
    .footer { padding: 8px 16px; background: #fafafa; border-top: 1px solid #eee; display: flex; justify-content: space-between; font-size: 11px; color: #888; }
    .key { font-weight: bold; background: #eee; padding: 1px 4px; border-radius: 3px; color: #555; border: 1px solid #ddd; }
    
    .create-first-btn { padding: 16px; color: #2e7d32; text-align: center; cursor: pointer; font-weight: bold; transition: background 0.2s; }
    .create-first-btn:hover { background: #e8f5e9; }
    
    .toast-container { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 8px; pointer-events: none; width: 90%; max-width: 300px; z-index: 999; }
    .toast { background: #000; color: #fff; padding: 10px 16px; border-radius: 4px; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); opacity: 0; transform: translateY(10px); transition: all 0.3s ease; text-align: center; }
    .toast.visible { opacity: 1; transform: translateY(0); }
    .toast.error { background: #d32f2f; }
    
    .hidden { display: none !important; }
  `;

  const host = document.createElement("div");
  host.id = "promptManager-host";
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });
  const styleEl = document.createElement("style");
  styleEl.textContent = cssStyles;
  shadow.appendChild(styleEl);
  const overlay = document.createElement("div");
  overlay.id = "overlay";
  shadow.appendChild(overlay);

  let card, header, input, list, varForm, settingsBtn, footer;
  let isDragging = false,
    dragStartX,
    dragStartY,
    initialLeft,
    initialTop;

  async function init() {
    attachGlobalListeners();
  }

  function renderUI() {
    overlay.innerHTML = `
        <div id="card">
          <div class="header">
            <span class="search-icon">🔍</span>
            <input type="text" class="main-search" placeholder="${t(
              "spotlightSearchPlaceholder"
            )}" autocomplete="off">
            <button class="settings-btn" title="${t(
              "spotlightSettings"
            )}"><svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg></button>
          </div>
          
          <ul id="list"></ul>
          
          <div id="var-form"></div>

          <div class="footer">
            <span id="footer-nav"><span class="key">↑</span> <span class="key">↓</span> ${t(
              "spotlightNavigate"
            )}</span>
            <span><span class="key">↵</span> <span id="footer-action">${t(
              "spotlightInsert"
            )}</span></span>
            <span><span class="key">Esc</span> ${t("spotlightClose")}</span>
          </div>
          <div class="toast-container"></div>
          <iframe id="sandbox-frame" src="${chrome.runtime.getURL(
            "sandbox.html"
          )}" style="display:none;"></iframe>
        </div>
      `;

    card = shadow.getElementById("card");
    header = shadow.querySelector(".header");
    input = shadow.querySelector("input.main-search");
    list = shadow.querySelector("ul");
    varForm = shadow.getElementById("var-form");
    settingsBtn = shadow.querySelector(".settings-btn");
    footer = shadow.querySelector(".footer");
  }

  function showToast(msg, type = "info") {
    const container = shadow.querySelector(".toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("visible"));
    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function attachElementListeners() {
    // Header Dragging
    header.addEventListener("mousedown", (e) => {
      if (e.target === input || e.composedPath().includes(settingsBtn)) return;
      if (e.button !== 0) return;
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      const rect = card.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      card.style.transform = "none";
      card.style.left = `${initialLeft}px`;
      card.style.top = `${initialTop}px`;
      card.style.right = "auto";
      e.preventDefault();
    });

    overlay.addEventListener("click", (e) => {
      if (e.composedPath().includes(card)) return;
      closeSpotlight();
    });

    settingsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      chrome.runtime.sendMessage({ action: "OPEN_SIDEPANEL" });
      closeSpotlight();
    });

    // Main Input Logic
    input.addEventListener("input", () => {
      activeIndex = 0;
      renderList(input.value);
    });

    input.addEventListener("keydown", (e) => {
      if (isVarMode) return; // Ignore main input keys if in var mode (though input should be hidden)

      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, filteredPrompts.length - 1);
        updateActiveItem();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        updateActiveItem();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredPrompts.length > 0)
          prepareInsertion(filteredPrompts[activeIndex]);
      } else if (e.key === "Escape") {
        closeSpotlight();
      }
    });
  }

  function attachGlobalListeners() {
    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      card.style.left = `${initialLeft + dx}px`;
      card.style.top = `${initialTop + dy}px`;
    });
    window.addEventListener("mouseup", () => {
      isDragging = false;
    });

    // Global Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.style.display === "block") {
        if (isVarMode) {
          // Back to list
          exitVarMode();
        } else {
          closeSpotlight();
        }
      }
    });

    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === "TOGGLE_SPOTLIGHT") toggleSpotlight();
    });
  }

  function renderList(query) {
    list.innerHTML = "";
    const q = query.toLowerCase();

    // Add create button if empty
    if (prompts.length === 0) {
      list.innerHTML = `<li class="create-first-btn">+ ${t(
        "spotlightCreateFirst"
      )}</li>`;
      list
        .querySelector(".create-first-btn")
        .addEventListener("click", async () => {
          await chrome.storage.local.set({ openInCreateMode: true });
          chrome.runtime.sendMessage({ action: "OPEN_SIDEPANEL" });
          closeSpotlight();
        });
      return;
    }

    filteredPrompts = prompts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
    );

    if (filteredPrompts.length === 0) {
      list.innerHTML = `<li style="padding:12px; color:#999; text-align:center;">${t(
        "spotlightNoMatch"
      )}</li>`;
      return;
    }

    filteredPrompts.forEach((p, index) => {
      const li = document.createElement("li");
      li.className = index === activeIndex ? "active" : "";
      const tagsHtml =
        p.tags && p.tags.length > 0
          ? `<div class="item-tags">${p.tags
              .map((t) => `<span class="item-tag">#${escapeHtml(t)}</span>`)
              .join("")}</div>`
          : "";
      li.innerHTML = `<div class="item-content">
                        <div class="item-title">${escapeHtml(p.title)}</div>
                        <div class="item-preview">${escapeHtml(p.content)}</div>
                        ${tagsHtml}
                      </div>`;
      li.addEventListener("click", () => prepareInsertion(p));
      li.addEventListener("mouseenter", () => {
        activeIndex = index;
        updateActiveItem();
      });
      list.appendChild(li);
    });
    updateActiveItem();
  }

  function updateActiveItem() {
    const items = list.querySelectorAll("li");
    if (items.length === 1 && items[0].classList.contains("create-first-btn"))
      return;
    items.forEach((item, idx) => {
      if (idx === activeIndex) {
        item.classList.add("active");
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.classList.remove("active");
      }
    });
  }

  function toggleSpotlight() {
    loadDataAndRender().then(() => {
      if (overlay.style.display === "none" || overlay.style.display === "") {
        // Capture last focused element to restore later or insert into
        if (
          document.activeElement &&
          document.activeElement !== document.body &&
          document.activeElement !== host
        ) {
          window.promptManager.lastFocused = document.activeElement;
        }
        overlay.style.display = "block";
        exitVarMode(); // Reset view
        input.value = "";
        input.focus();
      } else {
        closeSpotlight();
      }
    });
  }

  function closeSpotlight() {
    overlay.style.display = "none";
    exitVarMode();
    if (window.promptManager.lastFocused) {
      window.promptManager.lastFocused.focus();
    }
  }

  async function loadDataAndRender() {
    const data = await chrome.storage.local.get([
      "prompts",
      "globalVars",
      "lang",
    ]);
    prompts = data.prompts || [];
    globalVars = data.globalVars || [];
    if (data.lang) currentLang = data.lang;

    renderUI();
    attachElementListeners();
    activeIndex = 0;
    renderList("");
  }

  // --- Logic for Manual Variable Insertion ---

  function prepareInsertion(prompt) {
    // 1. Check for manual variables (Regex: {{ varName }})
    const regex = /\{\{(.*?)\}\}/g;
    const vars = new Set();
    let match;

    // Get stored local variables for this prompt
    const storedVars = prompt.variables || {};

    while ((match = regex.exec(prompt.content)) !== null) {
      const varName = match[1].trim();

      // Conditions to ask user for input:
      // 1. Not defined in Global Variables AND
      // 2. Not defined in Prompt's Stored Variables
      const isGlobal = globalVars.some((gv) => gv.name === varName);
      const isStoredLocal =
        storedVars[varName] !== undefined && storedVars[varName] !== "";

      if (!isGlobal && !isStoredLocal) {
        vars.add(varName);
      }
    }

    manualVars = Array.from(vars);

    if (manualVars.length > 0) {
      // If manual variables exist, enter Var Mode
      currentPendingPrompt = prompt;
      enterVarMode();
    } else {
      // If no manual variables needed, insert directly
      executeInsertion(prompt.content, prompt.variables || {}, {});
    }
  }

  function enterVarMode() {
    isVarMode = true;
    list.style.display = "none";
    header.style.display = "none"; // Hide search bar
    varForm.style.display = "block";

    // Update Footer
    const footerNav = shadow.querySelector("#footer-nav");
    if (footerNav) footerNav.style.display = "none";

    // Render Form
    varForm.innerHTML = `<div class="var-form-title">${t("varFilling")}</div>`;

    manualVars.forEach((v, index) => {
      const group = document.createElement("div");
      group.className = "var-group";
      group.innerHTML = `
            <label class="var-label">${escapeHtml(v)}</label>
            <input type="text" class="var-input" data-var="${escapeHtml(
              v
            )}" autocomplete="off">
          `;
      varForm.appendChild(group);
    });

    // Attach Form Listeners
    const inputs = varForm.querySelectorAll("input");
    if (inputs.length > 0) inputs[0].focus();

    inputs.forEach((inp, idx) => {
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (idx === inputs.length - 1) {
            // Submit
            submitVarForm();
          } else {
            // Next input
            inputs[idx + 1].focus();
          }
        }
      });
    });
  }

  function exitVarMode() {
    isVarMode = false;
    currentPendingPrompt = null;
    manualVars = [];

    list.style.display = "block";
    header.style.display = "flex";
    varForm.style.display = "none";
    varForm.innerHTML = "";

    const footerNav = shadow.querySelector("#footer-nav");
    if (footerNav) footerNav.style.display = "inline";

    if (input) input.focus();
  }

  function submitVarForm() {
    const inputs = varForm.querySelectorAll("input");
    const values = {};
    inputs.forEach((inp) => {
      values[inp.dataset.var] = inp.value;
    });

    // Reconstruct content
    executeInsertion(
      currentPendingPrompt.content,
      currentPendingPrompt.variables || {},
      values
    );
  }

  async function resolveVariableValue(variableDef) {
    if (!variableDef) return "";
    if (variableDef.type === "selector") {
      // Direct DOM access since we are in Content Script
      try {
        const el = document.querySelector(variableDef.value);
        if (!el) return "";
        const attr = variableDef.attribute || "innerText";
        if (attr === "innerText") return el.innerText || el.textContent;
        else if (attr === "innerHTML") return el.innerHTML;
        else if (attr === "value") return el.value;
        else return el.getAttribute(attr) || "";
      } catch (e) {
        console.error(e);
        return "";
      }
    } else if (variableDef.type === "script") {
      const script = variableDef.script || variableDef.value;
      if (!script) return "";

      // Fetch Page Context for Spotlight (Title is easy, URL is tougher if not in extension context?)
      // Since Spotlight is a content script (or overlay), it has direct access to window!
      // We also pass the full HTML for DOM Parsing in Sandbox
      let pageContext = {
        title: document.title,
        url: window.location.href,
        html: document.documentElement.outerHTML,
      };

      return new Promise((resolve) => {
        const iframe = shadow.getElementById("sandbox-frame");
        if (!iframe) {
          resolve("[Error: Sandbox missing]");
          return;
        }
        const id = Math.random().toString();
        const handler = (event) => {
          if (event.data.id === id) {
            window.removeEventListener("message", handler);
            resolve(
              event.data.error
                ? `[Error: ${event.data.error}]`
                : event.data.result
            );
          }
        };
        window.addEventListener("message", handler);
        iframe.contentWindow.postMessage(
          { action: "execute", code: script, context: pageContext, id },
          "*"
        );
        setTimeout(() => {
          window.removeEventListener("message", handler);
          resolve("[Script Timeout]");
        }, 2000);
      });
    } else {
      return variableDef.value || "";
    }
  }

  async function executeInsertion(rawContent, storedLocalVars, manualValues) {
    let text = rawContent;

    const regex = /\{\{(.*?)\}\}/g;
    let match;
    const matches = [];
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        full: match[0],
        content: match[1].trim(),
        index: match.index,
      });
    }

    const replacements = await Promise.all(
      matches.map(async (m) => {
        const varName = m.content;

        // Priority 1: Manual Input
        if (manualValues.hasOwnProperty(varName))
          return { ...m, replacement: manualValues[varName] };

        // Priority 2: Stored Local
        if (
          storedLocalVars.hasOwnProperty(varName) &&
          storedLocalVars[varName] !== ""
        )
          return { ...m, replacement: storedLocalVars[varName] };

        // Priority 3: Global Variable (Async Resolve)
        const globalVar = globalVars.find((gv) => gv.name === varName);
        if (globalVar) {
          return { ...m, replacement: await resolveVariableValue(globalVar) };
        }

        return { ...m, replacement: m.full };
      })
    );

    let result = text;
    for (let i = replacements.length - 1; i >= 0; i--) {
      const r = replacements[i];
      const before = result.substring(0, r.index);
      const after = result.substring(r.index + r.full.length);
      result = before + r.replacement + after;
    }
    text = result;

    const target = window.promptManager.lastFocused;
    if (!target) {
      showToast(t("spotlightNoFocus"), "error");
      return;
    }

    try {
      window.promptManager.insertText(text);
      closeSpotlight(); // Close & Reset
    } catch (e) {
      console.error(e);
      if (e.message === "no_target") showToast(t("spotlightNoFocus"), "error");
      else showToast(t("spotlightInsertFailed"), "error");
    }
  }

  function escapeHtml(t) {
    return t
      ? t
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
      : "";
  }

  init();
})();
