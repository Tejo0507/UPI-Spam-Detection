function collectVisibleText(maxChars) {
  const limit = maxChars || 20000;
  const textParts = [];
  let total = 0;

  const candidates = document.querySelectorAll('p, li, span, div, article, section');
  candidates.forEach((element) => {
    if (total >= limit) {
      return;
    }
    if (!element || element.closest('input, textarea, [contenteditable="true"]')) {
      return;
    }
    if (element.offsetParent === null) {
      return;
    }
    const text = (element.innerText || '').trim();
    if (!text || text.length < 12) {
      return;
    }
    const remaining = limit - total;
    textParts.push(text.slice(0, remaining));
    total += text.length;
  });

  return {
    text: textParts.join(' '),
    truncated: total >= limit
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || !message.type) {
    return;
  }

  if (message.type === 'SCAN_PAGE') {
    const result = collectVisibleText(20000);
    sendResponse(result);
    return true;
  }

  if (message.type === 'ANALYZE_TEXT') {
    const text = String(message.text || '');
    const keywords = window.FRAUD_KEYWORDS || [];
    const analysis = window.UPIDetectorCore.analyzeMessage(text, keywords, { includeHighlight: false });
    sendResponse({ analysis });
    return true;
  }
});
