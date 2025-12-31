window.promptManager = window.promptManager || {};

if (!window.promptManager.isInitialized) {
  window.promptManager.isInitialized = true;
  window.promptManager.lastFocused = null;

  // 1. Focus Tracking
  document.addEventListener(
    "focusin",
    (e) => {
      if (e.target && isInput(e.target)) {
        window.promptManager.lastFocused = e.target;
      }
    },
    true
  );

  if (document.activeElement && isInput(document.activeElement)) {
    window.promptManager.lastFocused = document.activeElement;
  }

  function isInput(el) {
    if (!el) return false;
    const tag = el.tagName;
    return (
      (tag === "INPUT" &&
        el.type !== "hidden" &&
        el.type !== "submit" &&
        el.type !== "button") ||
      tag === "TEXTAREA" ||
      el.isContentEditable ||
      el.getAttribute("contenteditable") === "true" ||
      el.getAttribute("role") === "textbox"
    );
  }

  function isVisibleAndInteractive(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      (el.offsetWidth > 0 || el.offsetHeight > 0)
    );
  }

  function findFallbackTarget() {
    const candidates = [
      ...document.querySelectorAll(
        'textarea, [contenteditable], [role="textbox"]'
      ),
    ];
    const valid = candidates.filter((el) => {
      if (el.getAttribute("contenteditable") === "false") return false;
      if (!isVisibleAndInteractive(el)) return false;
      if (el.readOnly || el.disabled) return false;
      return true;
    });
    if (valid.length === 1) return valid[0];
    if (valid.length > 1) {
      return valid.reduce((prev, curr) =>
        calculateScore(curr) > calculateScore(prev) ? curr : prev
      );
    }
    const inputs = Array.from(
      document.querySelectorAll('input[type="text"], input:not([type])')
    );
    const visibleInputs = inputs.filter((i) => isVisibleAndInteractive(i));
    if (visibleInputs.length > 0) return visibleInputs[0];
    return null;
  }

  function calculateScore(el) {
    let score = 0;
    if (el.getAttribute("role") === "textbox") score += 100;
    if (el.tagName === "TEXTAREA") score += 50;
    const rect = el.getBoundingClientRect();
    score += (rect.width * rect.height) / 1000;
    return score;
  }

  // Shared Insert Function
  window.promptManager.insertText = function (text) {
    let target = window.promptManager.lastFocused;

    // Try active element if focus lost
    if (!target && isInput(document.activeElement))
      target = document.activeElement;

    // Try fallback
    if (!target || !document.body.contains(target))
      target = findFallbackTarget();

    if (!target) throw new Error("no_target");

    target.focus();

    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
      const start = target.selectionStart || target.value.length;
      const end = target.selectionEnd || target.value.length;
      const val = target.value;
      target.value = val.substring(0, start) + text + val.substring(end);
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      // ContentEditable
      const success = document.execCommand("insertText", false, text);
      if (!success) {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(text));
        } else {
          target.textContent += text;
        }
        target.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    return true;
  };

  // Listener for Sidebar (still needed if sidebar sends messages)
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "insertText") {
      try {
        window.promptManager.insertText(request.text);
        sendResponse({ success: true });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
      return true;
    }

    if (request.action === "QUERY_SELECTOR") {
      try {
        const el = document.querySelector(request.selector);
        if (!el) {
          sendResponse({ value: null, error: "Element not found" });
        } else {
          let val = "";
          const attr = request.attribute || "innerText";
          if (attr === "innerText") val = el.innerText || el.textContent;
          else if (attr === "innerHTML") val = el.innerHTML;
          else if (attr === "value") val = el.value;
          else val = el.getAttribute(attr);

          sendResponse({ value: val });
        }
      } catch (e) {
        sendResponse({ value: null, error: e.toString() });
      }
      return true;
    }
  });
}
