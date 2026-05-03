const DEFAULT_SERVER_URL = 'http://localhost:3000';

const elements = {
  message: document.getElementById('message'),
  language: document.getElementById('language'),
  serverUrl: document.getElementById('server-url'),
  useServer: document.getElementById('use-server'),
  analyze: document.getElementById('analyze'),
  scan: document.getElementById('scan'),
  riskScore: document.getElementById('risk-score'),
  riskLabel: document.getElementById('risk-label'),
  riskDrivers: document.getElementById('risk-drivers'),
  advice: document.getElementById('advice'),
  status: document.getElementById('status'),
  badge: document.getElementById('badge-status')
};

function getKeywordBank(language) {
  if (language === 'en') {
    return window.FRAUD_KEYWORDS_EN || window.FRAUD_KEYWORDS || [];
  }
  if (language === 'hi') {
    return window.FRAUD_KEYWORDS_HI || window.FRAUD_KEYWORDS || [];
  }
  return window.FRAUD_KEYWORDS || [];
}

function setStatus(text, kind) {
  elements.status.textContent = text || '';
  elements.status.classList.remove('error', 'success');
  if (kind) {
    elements.status.classList.add(kind);
  }
}

function renderList(container, items, fallback) {
  const list = items && items.length ? items : [{ label: fallback, count: 0 }];
  container.innerHTML = list
    .map((item) => `<li>${item.label || item}</li>`)
    .join('');
}

function renderResult(result) {
  elements.riskScore.textContent = String(result.riskScore || 0);
  elements.riskLabel.textContent = result.riskLabel || 'Low';
  elements.riskLabel.classList.remove('medium', 'high');
  if (result.riskLabel === 'High') {
    elements.riskLabel.classList.add('high');
  } else if (result.riskLabel === 'Medium') {
    elements.riskLabel.classList.add('medium');
  }

  const drivers = (result.riskDrivers || []).slice(0, 4).map((item) => ({
    label: `${item.label} (${item.count})`
  }));
  renderList(elements.riskDrivers, drivers, 'No extra risk drivers');
  renderList(elements.advice, result.advice || [], 'Verify sender via official channels.');
}

function saveLastAnalysis(result, source) {
  if (!result) {
    return;
  }
  chrome.storage.session.set({
    lastAnalysis: {
      ...result,
      source
    }
  });
}

async function deepAnalyze(text, language) {
  const url = (elements.serverUrl.value || DEFAULT_SERVER_URL).replace(/\/$/, '');
  const response = await fetch(`${url}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: text,
      language
    })
  });

  if (!response.ok) {
    throw new Error(`Server returned ${response.status}`);
  }

  const payload = await response.json();
  if (!payload || !payload.analysis) {
    throw new Error('Invalid server response');
  }

  return payload.analysis;
}

async function runAnalysis(text, source) {
  const trimmed = String(text || '').trim();
  if (!trimmed) {
    setStatus('Add a message to analyze.', 'error');
    return;
  }

  const language = elements.language.value || 'both';
  const keywords = getKeywordBank(language);
  const localResult = window.UPIDetectorCore.analyzeMessage(trimmed, keywords, { includeHighlight: false });
  renderResult(localResult);
  saveLastAnalysis(localResult, source || 'manual');

  if (elements.useServer.checked) {
    try {
      setStatus('Running deep check...', 'success');
      const serverResult = await deepAnalyze(trimmed, language);
      renderResult(serverResult);
      saveLastAnalysis(serverResult, source || 'manual');
      setStatus('Deep check completed.', 'success');
    } catch (error) {
      setStatus('Deep check failed. Using local results.', 'error');
    }
  } else {
    setStatus(source === 'scan' ? 'Scanned page text.' : 'Local analysis complete.', 'success');
  }
}

function persistSettings() {
  chrome.storage.local.set({
    language: elements.language.value,
    serverUrl: elements.serverUrl.value,
    useServer: elements.useServer.checked
  });
}

function updateBadge() {
  elements.badge.textContent = elements.useServer.checked ? 'Local + server' : 'Local only';
}

async function loadSettings() {
  const data = await chrome.storage.local.get(['language', 'serverUrl', 'useServer']);
  elements.language.value = data.language || 'both';
  elements.serverUrl.value = data.serverUrl || DEFAULT_SERVER_URL;
  elements.useServer.checked = Boolean(data.useServer);
  updateBadge();
}

async function loadLastAnalysis() {
  const data = await chrome.storage.session.get(['lastAnalysis']);
  if (data.lastAnalysis) {
    renderResult(data.lastAnalysis);
    if (data.lastAnalysis.source) {
      setStatus(`Last check: ${data.lastAnalysis.source}`, 'success');
    }
  }
}

elements.analyze.addEventListener('click', () => {
  runAnalysis(elements.message.value, 'manual');
});

elements.scan.addEventListener('click', async () => {
  setStatus('Scanning page...', 'success');
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  if (!activeTab || !activeTab.id) {
    setStatus('No active tab found.', 'error');
    return;
  }

  chrome.tabs.sendMessage(
    activeTab.id,
    { type: 'SCAN_PAGE' },
    (response) => {
      if (chrome.runtime.lastError || !response) {
        setStatus('Unable to scan this page.', 'error');
        return;
      }
      elements.message.value = response.text || '';
      if (response.truncated) {
        setStatus('Page text truncated for safety.', 'success');
      }
      runAnalysis(response.text || '', 'scan');
    }
  );
});

elements.language.addEventListener('change', () => {
  persistSettings();
});

elements.serverUrl.addEventListener('change', () => {
  persistSettings();
});

elements.useServer.addEventListener('change', () => {
  updateBadge();
  persistSettings();
});

loadSettings();
loadLastAnalysis();
