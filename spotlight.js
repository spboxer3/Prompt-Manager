(function() {
  if (window.hasRunpromptManagerSpotlight) { return; }
  window.hasRunpromptManagerSpotlight = true;
  window.promptManager = window.promptManager || {};
  
  let prompts = [], globalVars = [], activeIndex = 0, filteredPrompts = [], currentLang = 'en'; 

  function t(key) {
      const locales = window.promptManagerLocales;
      if (!locales) return key;
      if (locales[currentLang] && locales[currentLang][key]) return locales[currentLang][key];
      return locales['en'][key] || key; 
  }

  const cssStyles = `
    /* ... (Existing styles) ... */
    :host { all: initial; position: fixed; top: 0; left: 0; z-index: 2147483647; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; }
    #overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: transparent; display: none; pointer-events: none; }
    #card { position: fixed; top: 15vh; left: 50vw; transform: translateX(-50%); width: 600px; max-width: 90%; background: #fff; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.1); display: flex; flex-direction: column; overflow: hidden; pointer-events: auto; color: #333; font-size: 14px; }
    .header { padding: 16px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 12px; cursor: move; user-select: none; background: #fff; }
    .search-icon { font-size: 18px; color: #999; }
    input { flex: 1; border: none; outline: none; font-size: 18px; color: #333; background: transparent; padding: 0; margin: 0; font-family: inherit; cursor: text; }
    input::placeholder { color: #ccc; }
    .settings-btn { background: none; border: none; cursor: pointer; color: #999; padding: 6px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: all 0.2s; }
    .settings-btn:hover { color: #333; background: #f5f5f5; }
    .settings-btn svg { width: 20px; height: 20px; fill: currentColor; }
    ul { max-height: 400px; overflow-y: auto; padding: 8px; margin: 0; list-style: none; background: #fff; }
    li { padding: 10px 12px; border-radius: 6px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.1s; border-left: 3px solid transparent; }
    li.active, li:hover { background: #f5f5f5; border-left-color: #000; }
    .item-content { flex: 1; min-width: 0; }
    .item-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-preview { font-size: 12px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .footer { padding: 8px 16px; background: #fafafa; border-top: 1px solid #eee; display: flex; justify-content: space-between; font-size: 11px; color: #888; }
    .key { font-weight: bold; background: #eee; padding: 1px 4px; border-radius: 3px; color: #555; border: 1px solid #ddd; }
    .create-first-btn { padding: 16px; color: #2e7d32; text-align: center; cursor: pointer; font-weight: bold; transition: background 0.2s; }
    .create-first-btn:hover { background: #e8f5e9; }
    
    /* TOAST IN SHADOW DOM */
    .toast-container { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 8px; pointer-events: none; width: 90%; max-width: 300px; z-index: 999; }
    .toast { background: #000; color: #fff; padding: 10px 16px; border-radius: 4px; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); opacity: 0; transform: translateY(10px); transition: all 0.3s ease; text-align: center; }
    .toast.visible { opacity: 1; transform: translateY(0); }
    .toast.error { background: #d32f2f; }
  `;

  const host = document.createElement('div'); host.id = 'promptManager-host'; document.documentElement.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const styleEl = document.createElement('style'); styleEl.textContent = cssStyles; shadow.appendChild(styleEl);
  const overlay = document.createElement('div'); overlay.id = 'overlay'; shadow.appendChild(overlay);

  let card, header, input, list, settingsBtn;
  let isDragging = false, dragStartX, dragStartY, initialLeft, initialTop;

  async function init() {
    const data = await chrome.storage.local.get(['prompts', 'globalVars', 'lang']);
    prompts = data.prompts || []; globalVars = data.globalVars || [];
    if (data.lang) currentLang = data.lang;
    renderUI();
    card = shadow.getElementById('card'); header = shadow.querySelector('.header'); input = shadow.querySelector('input'); list = shadow.querySelector('ul'); settingsBtn = shadow.querySelector('.settings-btn');
    attachListeners(); renderList('');
  }

  function renderUI() {
      overlay.innerHTML = `
        <div id="card">
          <div class="header">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="${t('spotlightSearchPlaceholder')}" autocomplete="off">
            <button class="settings-btn" title="${t('spotlightSettings')}"><svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg></button>
          </div>
          <ul id="list"></ul>
          <div class="footer"><span><span class="key">↑</span> <span class="key">↓</span> ${t('spotlightNavigate')}</span><span><span class="key">↵</span> ${t('spotlightInsert')}</span><span><span class="key">Esc</span> ${t('spotlightClose')}</span></div>
          <div class="toast-container"></div>
        </div>
      `;
  }

  function showToast(msg, type='info') {
      const container = shadow.querySelector('.toast-container');
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.textContent = msg;
      container.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add('visible'));
      setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 300); }, 3000);
  }

  function attachListeners() {
      header.addEventListener('mousedown', (e) => { if (e.target === input || e.composedPath().includes(settingsBtn)) return; if (e.button !== 0) return; isDragging = true; dragStartX = e.clientX; dragStartY = e.clientY; const rect = card.getBoundingClientRect(); initialLeft = rect.left; initialTop = rect.top; card.style.transform = 'none'; card.style.left = `${initialLeft}px`; card.style.top = `${initialTop}px`; card.style.right = 'auto'; e.preventDefault(); });
      window.addEventListener('mousemove', (e) => { if (!isDragging) return; const dx = e.clientX - dragStartX; const dy = e.clientY - dragStartY; card.style.left = `${initialLeft + dx}px`; card.style.top = `${initialTop + dy}px`; });
      window.addEventListener('mouseup', () => { isDragging = false; });
      overlay.addEventListener('click', (e) => { if (e.composedPath().includes(card)) return; closeSpotlight(); });
      settingsBtn.addEventListener('click', (e) => { e.stopPropagation(); chrome.runtime.sendMessage({ action: "OPEN_SIDEPANEL" }); closeSpotlight(); });
      input.addEventListener('input', () => { activeIndex = 0; renderList(input.value); });
      input.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, filteredPrompts.length - 1); updateActiveItem(); } else if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); updateActiveItem(); } else if (e.key === 'Enter') { e.preventDefault(); if(filteredPrompts.length > 0) confirmInsertion(filteredPrompts[activeIndex]); } else if (e.key === 'Escape') closeSpotlight(); });
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.style.display === 'block') closeSpotlight(); });
  chrome.runtime.onMessage.addListener((msg) => { if (msg.action === "TOGGLE_SPOTLIGHT") toggleSpotlight(); });

  function renderList(query) {
    list.innerHTML = ''; const q = query.toLowerCase();
    if (prompts.length === 0) {
        list.innerHTML = `<li class="create-first-btn">+ ${t('spotlightCreateFirst')}</li>`;
        list.querySelector('.create-first-btn').addEventListener('click', async () => { await chrome.storage.local.set({ openInCreateMode: true }); chrome.runtime.sendMessage({ action: "OPEN_SIDEPANEL" }); closeSpotlight(); });
        return;
    }
    filteredPrompts = prompts.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q)));
    if (filteredPrompts.length === 0) { list.innerHTML = `<li style="padding:12px; color:#999; text-align:center;">${t('spotlightNoMatch')}</li>`; return; }
    filteredPrompts.forEach((p, index) => {
      const li = document.createElement('li'); li.className = index === activeIndex ? 'active' : '';
      li.innerHTML = `<div class="item-content"><div class="item-title">${escapeHtml(p.title)}</div><div class="item-preview">${escapeHtml(p.content)}</div></div>`;
      li.addEventListener('click', () => confirmInsertion(p));
      li.addEventListener('mouseenter', () => { activeIndex = index; updateActiveItem(); });
      list.appendChild(li);
    });
    updateActiveItem();
  }

  function updateActiveItem() { const items = list.querySelectorAll('li'); if (items.length === 1 && items[0].classList.contains('create-first-btn')) return; items.forEach((item, idx) => { if (idx === activeIndex) { item.classList.add('active'); item.scrollIntoView({ block: 'nearest' }); } else item.classList.remove('active'); }); }
  function toggleSpotlight() { loadDataAndRender().then(() => { if (overlay.style.display === 'none' || overlay.style.display === '') { if (document.activeElement && document.activeElement !== document.body && document.activeElement !== host) { window.promptManager.lastFocused = document.activeElement; } overlay.style.display = 'block'; input.value = ''; input.focus(); } else { closeSpotlight(); } }); }
  function closeSpotlight() { overlay.style.display = 'none'; if (window.promptManager.lastFocused) { window.promptManager.lastFocused.focus(); } }
  async function loadDataAndRender() { const data = await chrome.storage.local.get(['prompts', 'globalVars', 'lang']); prompts = data.prompts || []; globalVars = data.globalVars || []; if (data.lang) currentLang = data.lang; renderUI(); card = shadow.getElementById('card'); header = shadow.querySelector('.header'); input = shadow.querySelector('input'); list = shadow.querySelector('ul'); settingsBtn = shadow.querySelector('.settings-btn'); attachListeners(); activeIndex = 0; renderList(''); }
  function compileText(rawText) { let compiled = rawText; globalVars.forEach(gv => { compiled = compiled.split(`{{${gv.name}}}`).join(gv.value); }); return compiled; }
  
  function confirmInsertion(prompt) {
    const text = compileText(prompt.content);
    // Don't close immediately to show error toast if needed
    
    const target = window.promptManager.lastFocused;
    if (!target) { showToast(t('spotlightNoFocus'), 'error'); return; }

    try {
        window.promptManager.insertText(text);
        closeSpotlight(); // Close on success
    } catch (e) {
        console.error(e);
        if (e.message === "no_target") showToast(t('spotlightNoFocus'), 'error');
        else showToast(t('spotlightInsertFailed'), 'error');
    }
  }
  
  function escapeHtml(t) { return t ? t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;") : ''; }
  init();
})();