function setBadgeForRisk(riskLabel) {
  let text = '';
  let color = '#0f8a7a';
  if (riskLabel === 'High') {
    text = 'HIGH';
    color = '#c0392b';
  } else if (riskLabel === 'Medium') {
    text = 'MED';
    color = '#d96c22';
  } else {
    text = 'LOW';
    color = '#0f8a7a';
  }

  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'upi-check-selection',
    title: 'Check selection for UPI scam risk',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'upi-check-selection' || !tab || !tab.id) {
    return;
  }

  const selectionText = String(info.selectionText || '').trim();
  if (!selectionText) {
    return;
  }

  chrome.tabs.sendMessage(
    tab.id,
    { type: 'ANALYZE_TEXT', text: selectionText },
    (response) => {
      if (chrome.runtime.lastError || !response || !response.analysis) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'UPI Scam Checker',
          message: 'Unable to analyze selection.'
        });
        return;
      }

      const analysis = response.analysis;
      setBadgeForRisk(analysis.riskLabel);
      chrome.storage.session.set({
        lastAnalysis: {
          ...analysis,
          source: 'selection'
        }
      });

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: `Risk: ${analysis.riskLabel} (${analysis.riskScore}%)`,
        message: 'Open the extension to view drivers and advice.'
      });
    }
  );
});
