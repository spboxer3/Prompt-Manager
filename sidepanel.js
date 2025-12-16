document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const promptListEl = document.getElementById('prompt-list');
  const emptyStateEl = document.getElementById('empty-state');
  const searchInput = document.getElementById('search-input');
  const tagFiltersEl = document.getElementById('tag-filters');
  
  // Views
  const mainView = document.getElementById('main-view');
  const editorView = document.getElementById('editor-view');
  const settingsView = document.getElementById('settings-view');
  const helpView = document.getElementById('help-view');
  
  // ... (Buttons references remain same) ...
  const btnAdd = document.getElementById('btn-add');
  const btnCreateFirst = document.getElementById('btn-create-first');
  const btnSettings = document.getElementById('btn-settings');
  const btnBack = document.getElementById('btn-back');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  
  const btnOpenHelp = document.getElementById('btn-open-help');
  const btnCloseHelp = document.getElementById('btn-close-help');

  const btnSave = document.getElementById('btn-save');
  const btnDelete = document.getElementById('btn-delete');
  const btnCopy = document.getElementById('btn-copy');
  const btnInsert = document.getElementById('btn-insert'); 
  const btnRefreshVars = document.getElementById('btn-refresh-vars');
  const editTitle = document.getElementById('edit-title');
  const editContent = document.getElementById('edit-content');
  const editTags = document.getElementById('edit-tags');
  const runnerSection = document.getElementById('runner-section');
  const variablesContainer = document.getElementById('variables-container');
  const insertVarSelect = document.getElementById('insert-var-select');

  const btnExport = document.getElementById('btn-export');
  const fileImport = document.getElementById('file-import');
  const btnClearAll = document.getElementById('btn-clear-all');
  const languageSelect = document.getElementById('language-select');
  
  const globalVarsListEl = document.getElementById('global-vars-list');
  const btnShowAddVar = document.getElementById('btn-show-add-var');
  const varFormContainer = document.getElementById('variable-form-container');
  const varFormTitle = document.getElementById('var-form-title');
  const newVarName = document.getElementById('new-var-name');
  const newVarValue = document.getElementById('new-var-value');
  const btnCancelVar = document.getElementById('btn-cancel-var');
  const btnSaveVar = document.getElementById('btn-save-var');

  // --- State ---
  let prompts = [];
  let globalVars = []; 
  let currentPromptId = null;
  let activeTagFilter = null;
  let editingVarIndex = null; 
  let currentLang = 'en'; 

  // --- Initialization ---
  initUI();
  loadData();

  // --- Helper: UI Initialization (Toast/Modal) ---
  function initUI() {
      // 1. Create Toast Container
      const toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      toastContainer.id = 'app-toast-container';
      document.body.appendChild(toastContainer);

      // 2. Create Modal Backdrop
      const modalBackdrop = document.createElement('div');
      modalBackdrop.className = 'modal-backdrop';
      modalBackdrop.id = 'app-modal-backdrop';
      modalBackdrop.innerHTML = `
          <div class="modal-card">
              <div class="modal-title">Confirm</div>
              <div class="modal-message"></div>
              <div class="modal-actions">
                  <button class="btn-outline" id="modal-btn-cancel">Cancel</button>
                  <button class="btn-solid" id="modal-btn-confirm">Confirm</button>
              </div>
          </div>
      `;
      document.body.appendChild(modalBackdrop);
  }

  // --- Helper: Show Toast ---
  function showToast(message, type = 'info') {
      const container = document.getElementById('app-toast-container');
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.textContent = message;
      
      container.appendChild(toast);
      
      // Animation cycle
      requestAnimationFrame(() => toast.classList.add('visible'));
      
      setTimeout(() => {
          toast.classList.remove('visible');
          setTimeout(() => toast.remove(), 300); // Wait for fade out
      }, 3000);
  }

  // --- Helper: Show Confirm Modal ---
  function showConfirm(message) {
      return new Promise((resolve) => {
          const backdrop = document.getElementById('app-modal-backdrop');
          const msgEl = backdrop.querySelector('.modal-message');
          const btnConfirm = backdrop.querySelector('#modal-btn-confirm');
          const btnCancel = backdrop.querySelector('#modal-btn-cancel');
          
          // Update Text
          backdrop.querySelector('.modal-title').textContent = t('appTitle'); // Or generic title
          msgEl.textContent = message;
          btnConfirm.textContent = t('save').replace('Save', 'Confirm'); // Quick hack or add to locales
          btnConfirm.textContent = "Confirm"; // Or use "OK"
          btnCancel.textContent = t('cancel');

          // Open
          backdrop.classList.remove('hidden');
          requestAnimationFrame(() => backdrop.classList.add('visible'));

          const close = (result) => {
              backdrop.classList.remove('visible');
              setTimeout(() => backdrop.classList.add('hidden'), 200);
              resolve(result);
              cleanup();
          };

          const onConfirm = () => close(true);
          const onCancel = () => close(false);

          const cleanup = () => {
              btnConfirm.removeEventListener('click', onConfirm);
              btnCancel.removeEventListener('click', onCancel);
          };

          btnConfirm.addEventListener('click', onConfirm);
          btnCancel.addEventListener('click', onCancel);
      });
  }

  // --- Helper: Inject Script Early ---
  async function tryInjectContentScript() {
      try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
              await chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  files: ['content.js']
              }).catch(() => {}); 
          }
      } catch (e) { console.log("Pre-injection skipped:", e); }
  }

  // --- I18n System ---
  function t(key) {
      const locales = window.promptManagerLocales;
      if (!locales) return key;
      if (locales[currentLang] && locales[currentLang][key]) {
          return locales[currentLang][key];
      }
      return locales['en'][key] || key; 
  }

  function applyTranslations() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
          const key = el.getAttribute('data-i18n');
          el.textContent = t(key);
      });
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
          const key = el.getAttribute('data-i18n-placeholder');
          el.placeholder = t(key);
      });
      renderInsertVarOptions(); 
      renderGlobalVars(); 
      if (currentPromptId && !runnerSection.classList.contains('hidden')) {
          updateVariableInputs(editContent.value);
      }
      renderPrompts(searchInput.value);
  }

  // --- Event Listeners ---
  languageSelect.addEventListener('change', async (e) => {
      currentLang = e.target.value;
      await chrome.storage.local.set({ lang: currentLang });
      applyTranslations();
  });

  btnAdd.addEventListener('click', () => openEditor());
  if (btnCreateFirst) btnCreateFirst.addEventListener('click', () => openEditor());
  btnBack.addEventListener('click', () => closeEditor());
  
  btnSettings.addEventListener('click', () => openSettings());
  btnCloseSettings.addEventListener('click', () => closeSettings());
  
  btnOpenHelp.addEventListener('click', () => {
      settingsView.classList.add('hidden');
      helpView.classList.remove('hidden');
  });
  btnCloseHelp.addEventListener('click', () => {
      helpView.classList.add('hidden');
      settingsView.classList.remove('hidden');
  });

  btnShowAddVar.addEventListener('click', () => { showVarForm(null); });
  btnCancelVar.addEventListener('click', hideVarForm);
  btnSaveVar.addEventListener('click', saveGlobalVar);

  btnSave.addEventListener('click', savePrompt);
  btnDelete.addEventListener('click', () => deletePrompt(currentPromptId));
  btnCopy.addEventListener('click', copyToClipboard);
  
  if (btnInsert) {
      btnInsert.addEventListener('click', insertToPage);
  }
  
  btnRefreshVars.addEventListener('click', () => updateVariableInputs(editContent.value));
  
  if (insertVarSelect) {
      insertVarSelect.addEventListener('change', (e) => {
          const varName = e.target.value;
          if (varName) {
              const textToInsert = `{{${varName}}}`;
              const start = editContent.selectionStart;
              const end = editContent.selectionEnd;
              const text = editContent.value;
              editContent.value = text.substring(0, start) + textToInsert + text.substring(end);
              editContent.selectionStart = editContent.selectionEnd = start + textToInsert.length;
              editContent.focus();
              e.target.value = '';
              editContent.dispatchEvent(new Event('input'));
          }
      });
  }

  searchInput.addEventListener('input', (e) => renderPrompts(e.target.value));
  editContent.addEventListener('input', () => {
    if (currentPromptId) updateVariableInputs(editContent.value);
  });
  
  btnExport.addEventListener('click', exportData);
  fileImport.addEventListener('change', importData);
  btnClearAll.addEventListener('click', clearAllData);

  // --- Data Loading ---
  async function loadData() {
    const data = await chrome.storage.local.get(['prompts', 'globalVars', 'lang', 'openInCreateMode']);
    prompts = data.prompts || [];
    globalVars = data.globalVars || [];
    if (!Array.isArray(prompts)) prompts = [];
    if (!Array.isArray(globalVars)) globalVars = [];
    
    if (data.lang && window.promptManagerLocales && window.promptManagerLocales[data.lang]) {
        currentLang = data.lang;
    }
    languageSelect.value = currentLang;
    applyTranslations();

    if (data.openInCreateMode) {
        await chrome.storage.local.remove('openInCreateMode');
        openEditor();
    }

    renderTagFilters();
    renderPrompts(searchInput.value);
    renderInsertVarOptions();
    tryInjectContentScript();
  }

  // --- Render Functions ---
  function renderInsertVarOptions() {
      if (!insertVarSelect) return;
      insertVarSelect.innerHTML = '';
      const defaultOption = document.createElement('option');
      defaultOption.value = "";
      defaultOption.textContent = t('insertVarPlaceholder');
      insertVarSelect.appendChild(defaultOption);
      if (!globalVars || globalVars.length === 0) {
          const option = document.createElement('option');
          option.disabled = true;
          option.textContent = `(${t('noGlobalVars')})`;
          insertVarSelect.appendChild(option);
      } else {
          globalVars.forEach(gv => {
              const option = document.createElement('option');
              option.value = gv.name;
              option.textContent = `{{${gv.name}}}`;
              insertVarSelect.appendChild(option);
          });
      }
  }

  function renderGlobalVars() {
    globalVarsListEl.innerHTML = '';
    if (globalVars.length === 0) {
        globalVarsListEl.innerHTML = `<p style="text-align:center; color:#999; font-size:12px; padding:10px;">${t('noGlobalVars')}</p>`;
    }
    globalVars.forEach((gv, index) => {
        const item = document.createElement('div');
        item.className = 'global-var-item';
        item.style.cursor = 'pointer'; 
        item.innerHTML = `
            <div class="global-var-info" style="pointer-events: none;">
                <h4>{{${escapeHtml(gv.name)}}}</h4>
                <p style="color:#666; font-size:11px;">${escapeHtml(gv.value)}</p>
            </div>
            <button class="btn-delete-var" title="${t('delete')}">×</button>
        `;
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-delete-var')) return;
            showVarForm(index);
        });
        item.querySelector('.btn-delete-var').addEventListener('click', (e) => {
            e.stopPropagation(); deleteGlobalVar(index);
        });
        globalVarsListEl.appendChild(item);
    });
  }

  function showVarForm(index = null) {
      editingVarIndex = index;
      varFormContainer.classList.remove('hidden'); 
      btnShowAddVar.classList.add('hidden');       
      varFormContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      if (index !== null) {
          const gv = globalVars[index];
          varFormTitle.textContent = t('varFormEdit');
          newVarName.value = gv.name;
          newVarValue.value = gv.value; 
          btnSaveVar.textContent = t('update');
      } else {
          varFormTitle.textContent = t('varFormAdd');
          newVarName.value = '';
          newVarValue.value = '';
          btnSaveVar.textContent = t('save');
      }
  }

  function hideVarForm() {
      varFormContainer.classList.add('hidden'); 
      btnShowAddVar.classList.remove('hidden'); 
      editingVarIndex = null;
      newVarName.value = '';
      newVarValue.value = '';
  }

  async function saveGlobalVar() {
      const name = newVarName.value.trim();
      const value = newVarValue.value; 
      if (!name) return showToast(t('errorVarName'), 'error'); // Replaced Alert
      if (!/^[a-zA-Z0-9_]+$/.test(name)) return showToast(t('errorVarFormat'), 'error'); // Replaced Alert
      const newVar = { name, value }; 
      if (editingVarIndex !== null) {
          globalVars[editingVarIndex] = newVar;
      } else {
          if (globalVars.some(v => v.name === name)) return showToast(t('errorVarExists'), 'error'); // Replaced Alert
          globalVars.push(newVar);
      }
      await chrome.storage.local.set({ globalVars });
      renderGlobalVars();
      renderInsertVarOptions();
      hideVarForm();
      showToast(t('saved')); // Replaced Alert
  }

  async function deleteGlobalVar(index) {
      if(await showConfirm(t('confirmDelete'))) { // Replaced confirm()
          globalVars.splice(index, 1);
          await chrome.storage.local.set({ globalVars });
          renderGlobalVars();
          renderInsertVarOptions();
          if (editingVarIndex === index) hideVarForm();
          showToast('Deleted');
      }
  }

  // --- Runner Logic ---
  function updateVariableInputs(text) {
    const vars = extractVariables(text);
    variablesContainer.innerHTML = '';
    
    if (vars.length === 0) return;
    
    for (const v of vars) {
        const div = document.createElement('div');
        div.className = 'form-group';
        const globalDef = globalVars.find(gv => gv.name === v);
        
        div.innerHTML = `
          <label class="variable-label" style="color:var(--color-gray-dark); display:flex; justify-content:space-between;">
            <span>${escapeHtml(v)}</span>
            ${globalDef ? `<span style="font-size:10px; color:#1976d2;">${t('autoFillLabel')}</span>` : ''}
          </label>
          <div style="position:relative">
            <input type="text" class="input-outline variable-input" data-var="${escapeHtml(v)}" placeholder="...">
          </div>
        `;
        variablesContainer.appendChild(div);
        
        if (globalDef) {
            const input = div.querySelector('input');
            input.value = globalDef.value;
            input.style.backgroundColor = "#f0f7ff"; 
        }
    }
  }
  
  function compileText(rawText) {
      let compiled = rawText;
      globalVars.forEach(gv => {
          compiled = compiled.split(`{{${gv.name}}}`).join(gv.value);
      });
      return compiled;
  }

  async function insertToPage(textToInsert) {
      const content = (typeof textToInsert === 'string') ? textToInsert : compilePrompt();
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if(!tab) return showToast("No active tab found.", 'error');
      
      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://'))) {
          return showToast("Cannot insert into system pages.", 'error'); // Replaced Alert
      }
      
      const executeInjection = async () => {
          await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js']
          });
          return await chrome.tabs.sendMessage(tab.id, { action: "insertText", text: content });
      };

      try {
          const response = await executeInjection();
          handleInsertResponse(response);
      } catch(err) {
          console.error("Injection error:", err);
          
          if (err.message.includes("Cannot access contents") || err.message.includes("Extension manifest")) {
              if (tab.url) {
                  try {
                      const urlObj = new URL(tab.url);
                      const origin = urlObj.origin + "/*";
                      const granted = await chrome.permissions.request({ origins: [origin] });
                      if (granted) {
                          const response = await executeInjection();
                          handleInsertResponse(response);
                          return;
                      }
                  } catch (permErr) { console.error(permErr); }
              }
              // Toast instead of alert for permission request
              showToast("Permission required. Click extension icon.", 'error');
          } else {
              showToast("Insert failed: " + err.message, 'error');
          }
      }
  }

  function handleInsertResponse(response) {
      if (response && response.success) {
          // Success Feedback
          const btn = document.getElementById('btn-insert');
          if (btn && !btn.closest('.hidden')) {
              const originalHtml = btn.innerHTML;
              const originalBg = btn.style.backgroundColor;
              const originalColor = btn.style.color;
              const originalBorder = btn.style.borderColor;

              btn.textContent = t('insertSuccess');
              btn.style.backgroundColor = "#dcedc8";
              btn.style.color = "#000";
              btn.style.borderColor = "#dcedc8";
              
              setTimeout(() => { 
                  btn.innerHTML = originalHtml; 
                  btn.style.backgroundColor = originalBg; 
                  btn.style.color = originalColor; 
                  btn.style.borderColor = originalBorder;
              }, 1000);
          }
          showToast(t('insertSuccess'), 'success'); // Also show toast
      } else {
          if (response && response.error === "no_target") {
              showToast(t('insertFail'), 'error'); // Replaced Alert
          } else if (response && response.error === "not_supported") {
              showToast("Target field not supported.", 'error');
          } else {
              showToast("Insert failed.", 'error');
          }
      }
  }

  // --- Render Functions ---
  function renderTagFilters() {
      const allTags = new Set();
      prompts.forEach(p => p.tags.forEach(t => allTags.add(t)));
      tagFiltersEl.innerHTML = '';
      if (allTags.size === 0) { tagFiltersEl.classList.add('hidden'); return; }
      tagFiltersEl.classList.remove('hidden');
      Array.from(allTags).sort().forEach(tag => {
          const chip = document.createElement('button');
          chip.className = `filter-chip ${activeTagFilter === tag ? 'active' : ''}`;
          chip.textContent = tag;
          chip.onclick = () => { activeTagFilter = activeTagFilter===tag ? null : tag; renderTagFilters(); renderPrompts(searchInput.value); };
          tagFiltersEl.appendChild(chip);
      });
  }

  function renderPrompts(filter = '') {
      promptListEl.innerHTML = '';
      const filtered = prompts.filter(p => {
          const matchText = p.title.toLowerCase().includes(filter.toLowerCase()) || 
                            p.content.toLowerCase().includes(filter.toLowerCase()) || 
                            p.tags.some(t => t.toLowerCase().includes(filter.toLowerCase()));
          const matchTag = activeTagFilter ? p.tags.includes(activeTagFilter) : true;
          return matchText && matchTag;
      });
      
      if (filtered.length === 0 && !filter && !activeTagFilter) {
          emptyStateEl.classList.remove('hidden'); promptListEl.classList.add('hidden');
      } else {
          emptyStateEl.classList.add('hidden'); promptListEl.classList.remove('hidden');
          filtered.forEach(p => {
              const card = document.createElement('div');
              card.className = 'prompt-card';
              
              card.innerHTML = `
                  <div class="card-header">
                    <h3>${escapeHtml(p.title)}</h3>
                    <button class="btn-card-delete" title="${t('delete')}">×</button>
                  </div>
                  <p>${escapeHtml(p.content)}</p>
                  <div class="tags">${p.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
                  
                  <div class="card-actions">
                    <button class="btn-card-action primary btn-quick-insert" style="background-color: #000; color: #fff; border-color: #000;">
                        ↳ ${t('btnInsert')}
                    </button>
                    <button class="btn-card-action btn-quick-copy">
                        ❐ ${t('btnCopy')}
                    </button>
                  </div>
              `;
              
              card.addEventListener('click', (e) => { 
                  if(e.target.closest('button')) return;
                  openRunner(p); 
              });
              
              card.querySelector('.btn-card-delete').addEventListener('click', (e) => { 
                  e.stopPropagation(); 
                  deletePrompt(p.id); 
              });

              const btnInsert = card.querySelector('.btn-quick-insert');
              btnInsert.addEventListener('click', (e) => {
                  e.stopPropagation();
                  const compiled = compileText(p.content);
                  insertToPage(compiled);
                  
                  // Visual Feedback logic preserved inside insertToPage mainly, 
                  // but card buttons also need direct feedback sometimes.
                  // Since insertToPage is async, we can do basic visual here:
                  const originalHtml = btnInsert.innerHTML;
                  btnInsert.textContent = "✓";
                  btnInsert.style.backgroundColor = "#dcedc8";
                  btnInsert.style.color = "#000";
                  btnInsert.style.borderColor = "#dcedc8";
                  setTimeout(() => {
                      btnInsert.innerHTML = originalHtml;
                      btnInsert.style.backgroundColor = "#000";
                      btnInsert.style.color = "#fff";
                      btnInsert.style.borderColor = "#000";
                  }, 1000);
              });

              const btnCopy = card.querySelector('.btn-quick-copy');
              btnCopy.addEventListener('click', async (e) => {
                  e.stopPropagation();
                  const compiled = compileText(p.content);
                  try {
                      await navigator.clipboard.writeText(compiled);
                      const originalHtml = btnCopy.innerHTML;
                      btnCopy.textContent = "✓";
                      btnCopy.style.background = "#dcedc8";
                      setTimeout(() => {
                          btnCopy.innerHTML = originalHtml;
                          btnCopy.style.background = "";
                      }, 1000);
                      showToast(t('copied'), 'success'); // Replaced alert
                  } catch(err) { showToast("Failed to copy", 'error'); }
              });

              promptListEl.appendChild(card);
          });
      }
  }

  function openEditor(prompt = null) {
      currentPromptId = prompt ? prompt.id : Date.now().toString();
      editTitle.value = prompt ? prompt.title : '';
      editContent.value = prompt ? prompt.content : '';
      editTags.value = prompt ? prompt.tags.join(', ') : '';
      
      const modeText = prompt ? 'editMode' : 'newPrompt';
      document.getElementById('editor-title-display').textContent = t(modeText);
      
      runnerSection.classList.add('hidden');
      mainView.classList.add('hidden'); settingsView.classList.add('hidden'); editorView.classList.remove('hidden');
      renderInsertVarOptions();
  }

  function openRunner(prompt) {
      currentPromptId = prompt.id;
      editTitle.value = prompt.title; editContent.value = prompt.content; editTags.value = prompt.tags.join(', ');
      document.getElementById('editor-title-display').textContent = t('executeMode');
      runnerSection.classList.remove('hidden');
      mainView.classList.add('hidden'); settingsView.classList.add('hidden'); editorView.classList.remove('hidden');
      updateVariableInputs(prompt.content);
  }

  function closeEditor() { mainView.classList.remove('hidden'); editorView.classList.add('hidden'); currentPromptId = null; loadData(); }
  
  function openSettings() { 
      mainView.classList.add('hidden'); editorView.classList.add('hidden'); settingsView.classList.remove('hidden'); 
      renderGlobalVars(); 
      hideVarForm(); 
  }
  function closeSettings() { mainView.classList.remove('hidden'); settingsView.classList.add('hidden'); }

  function extractVariables(text) { const regex = /\{\{(.*?)\}\}/g; const s = new Set(); let m; while(m=regex.exec(text)) s.add(m[1].trim()); return Array.from(s); }
  function compilePrompt() { let c = editContent.value; document.querySelectorAll('.variable-input').forEach(i => c = c.split(`{{${i.dataset.var}}}`).join(i.value)); return c; }
  
  async function copyToClipboard() {
      try { 
          await navigator.clipboard.writeText(compilePrompt()); 
          // Button feedback
          const txt = btnCopy.textContent; 
          btnCopy.textContent = t('copied'); 
          btnCopy.style.background = '#333'; 
          btnCopy.style.color = '#fff'; 
          setTimeout(()=>{btnCopy.textContent=txt; btnCopy.style.background=''; btnCopy.style.color='';}, 1000);
          showToast(t('copied'), 'success');
      } catch(e){ showToast('Copy Failed', 'error'); }
  }
  
  async function savePrompt() {
      const title = editTitle.value.trim(); 
      if(!title) return showToast(t('errorTitle'), 'error'); // Replaced Alert
      
      const p = { 
          id: currentPromptId, 
          title, 
          content: editContent.value, 
          tags: editTags.value.split(',').map(t => t.trim()).filter(t => t), 
          lastUpdated: new Date().toISOString() 
      };
      
      const idx = prompts.findIndex(x=>x.id===currentPromptId); 
      if(idx>=0) prompts[idx]=p; 
      else prompts.push(p);
      
      await chrome.storage.local.set({ prompts });
      
      // UX Feedback
      btnSave.textContent = t('saved'); 
      btnSave.style.backgroundColor = '#333';
      btnSave.disabled = true;
      btnSave.style.cursor = 'not-allowed';
      
      setTimeout(() => {
          btnSave.textContent = t('save'); 
          btnSave.style.backgroundColor = ''; 
          btnSave.disabled = false;
          btnSave.style.cursor = 'pointer';
      }, 1000); 
      
      showToast(t('saved'), 'success');
  }

  async function deletePrompt(id) { 
      if(await showConfirm(t('confirmDelete'))) { // Replaced confirm
          prompts=prompts.filter(p=>p.id!==id); 
          await chrome.storage.local.set({prompts}); 
          loadData(); 
          closeEditor(); 
          showToast('Deleted', 'info');
      } 
  }
  
  function exportData() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ prompts, globalVars, lang: currentLang }));
      const link = document.createElement('a');
      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
      link.href = dataStr; 
      link.download = `prompt_Manager_backup_${timestamp}.json`;
      document.body.appendChild(link); link.click(); link.remove();
  }
  
  function importData(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              const data = JSON.parse(e.target.result);
              const newPrompts = Array.isArray(data) ? data : (data.prompts || []);
              const newVars = data.globalVars || [];
              const importedLang = data.lang;

              if(await showConfirm(t('importConfirm'))) { // Replaced confirm
                  const pMap = new Map(prompts.map(p => [p.id, p]));
                  newPrompts.forEach(p => pMap.set(p.id, p));
                  prompts = Array.from(pMap.values());
                  const vMap = new Map(globalVars.map(v => [v.name, v]));
                  newVars.forEach(v => {
                      if (v.script && !v.value) v.value = v.script;
                      vMap.set(v.name, v);
                  });
                  globalVars = Array.from(vMap.values());
                  
                  if (importedLang && translations[importedLang]) {
                      currentLang = importedLang;
                      await chrome.storage.local.set({ lang: currentLang });
                  }

                  await chrome.storage.local.set({ prompts, globalVars });
                  loadData(); 
                  showToast(t('importSuccess'), 'success'); // Replaced Alert
                  closeSettings();
              }
          } catch (err) { showToast(t('fileError'), 'error'); } // Replaced Alert
      };
      reader.readAsText(file);
      event.target.value = '';
  }
  async function clearAllData() { 
      if(await showConfirm(t('confirmClear'))){ // Replaced confirm
          prompts=[]; globalVars=[]; await chrome.storage.local.set({prompts, globalVars}); 
          loadData(); 
          showToast('All Data Cleared', 'info');
      } 
  }
  
  function escapeHtml(t) { return t ? t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;") : ''; }
});