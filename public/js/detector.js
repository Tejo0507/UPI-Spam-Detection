(function () {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function debounce(fn, wait) {
    let timer = null;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function setMessage(container, text, kind) {
    container.textContent = text;
    container.classList.remove('hidden', 'error', 'success');
    container.classList.add(kind);
  }

  function clearMessage(container) {
    container.textContent = '';
    container.classList.add('hidden');
    container.classList.remove('error', 'success');
  }

  function animateNumber(element, targetValue, suffix, duration) {
    const target = Number(targetValue) || 0;
    const start = Number(element.dataset.currentValue || 0);
    const startTime = performance.now();

    function frame(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * eased);
      element.textContent = `${current}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        element.dataset.currentValue = String(target);
      }
    }

    requestAnimationFrame(frame);
  }

  function animateResultPanels(elements) {
    elements.forEach((element) => {
      if (!element) {
        return;
      }
      element.classList.add('is-updating');
      setTimeout(() => {
        element.classList.remove('is-updating');
      }, 300);
    });
  }

  function renderDetectedKeywords(container, items) {
    if (!items.length) {
      container.innerHTML = '<div class="keyword-item"><span>No suspicious keywords detected</span><span>0</span></div>';
      return;
    }

    container.innerHTML = items
      .map((item) => `<div class="keyword-item"><span>${item.keyword}</span><strong>${item.count}</strong></div>`)
      .join('');
  }

  function renderRiskDrivers(container, items) {
    if (!items.length) {
      container.innerHTML = '<div class="keyword-item"><span>No additional risk drivers detected</span><span>0</span></div>';
      return;
    }

    container.innerHTML = items
      .map((item) => {
        const score = Number(item.weight || 0) * Number(item.count || 0);
        return `<div class="keyword-item"><span>${item.label} (${item.count})</span><strong>+${score}</strong></div>`;
      })
      .join('');
  }

  function renderAdvice(container, items) {
    if (!container) {
      return;
    }

    if (!items.length) {
      container.innerHTML = '<li>No additional recommendations for this message.</li>';
      return;
    }

    container.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  }

  function buildReport(inputText, result) {
    const lines = [];
    lines.push('UPI Spam Detection Report');
    lines.push(`Generated At: ${new Date().toLocaleString()}`);
    lines.push(`Risk Score: ${result.riskScore}% (${result.riskLabel})`);
    lines.push(`Total Keyword Matches: ${result.totalMatches}`);
    lines.push(`Unique Keywords: ${result.detectedKeywords.length}`);
    lines.push('');

    lines.push('Detected Keywords:');
    if (result.detectedKeywords.length) {
      result.detectedKeywords.forEach((item) => lines.push(`- ${item.keyword}: ${item.count}`));
    } else {
      lines.push('- None');
    }

    lines.push('');
    lines.push('Risk Drivers:');
    if (result.riskDrivers && result.riskDrivers.length) {
      result.riskDrivers.forEach((item) => lines.push(`- ${item.label} (${item.count})`));
    } else {
      lines.push('- None');
    }

    lines.push('');
    lines.push('Safety Recommendations:');
    if (result.advice && result.advice.length) {
      result.advice.forEach((tip) => lines.push(`- ${tip}`));
    } else {
      lines.push('- Verify sender and avoid urgent payment approvals.');
    }

    lines.push('');
    lines.push('Message Input:');
    lines.push(inputText || '(empty)');

    return lines.join('\n');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const highlightedOutput = document.getElementById('highlighted-output');
    const keywordList = document.getElementById('keyword-list');
    const riskScore = document.getElementById('risk-score');
    const keywordCount = document.getElementById('keyword-count');
    const matchCount = document.getElementById('match-count');
    const statsPanel = document.querySelector('.stats');
    const riskLabel = document.getElementById('risk-label');
    const detectorMessage = document.getElementById('detector-message');
    const riskDriverList = document.getElementById('risk-driver-list');
    const safetyAdvice = document.getElementById('safety-advice');
    const sampleBtn = document.getElementById('sample-btn');
    const copyReportBtn = document.getElementById('copy-report-btn');

    let latestResult = {
      highlightedHtml: '',
      detectedKeywords: [],
      totalMatches: 0,
      riskScore: 0,
      riskLabel: 'Low',
      riskDrivers: [],
      advice: []
    };

    if (!messageInput || !analyzeBtn || !window.UPIDetectorCore || !window.FRAUD_KEYWORDS) {
      return;
    }

    function renderResult(result) {
      animateResultPanels([highlightedOutput, keywordList, statsPanel]);
      highlightedOutput.innerHTML = result.highlightedHtml || '';
      renderDetectedKeywords(keywordList, result.detectedKeywords);
      renderRiskDrivers(riskDriverList, result.riskDrivers || []);
      renderAdvice(safetyAdvice, result.advice || []);
      animateNumber(riskScore, result.riskScore, '%', 440);
      animateNumber(keywordCount, result.detectedKeywords.length, '', 360);
      animateNumber(matchCount, result.totalMatches, '', 360);
      riskLabel.textContent = `Risk Level: ${result.riskLabel}`;
      riskLabel.classList.remove('risk-low', 'risk-medium', 'risk-high');
      if (result.riskLabel === 'High') {
        riskLabel.classList.add('risk-high');
      } else if (result.riskLabel === 'Medium') {
        riskLabel.classList.add('risk-medium');
      } else {
        riskLabel.classList.add('risk-low');
      }

      latestResult = result;
    }

    function runAnalysis(showValidationError) {
      const value = messageInput.value || '';

      if (!value.trim()) {
        renderResult({
          highlightedHtml: '',
          detectedKeywords: [],
          totalMatches: 0,
          riskScore: 0,
          riskLabel: 'Low'
        });
        if (showValidationError) {
          setMessage(detectorMessage, 'Please enter a message before analysis.', 'error');
        } else {
          clearMessage(detectorMessage);
        }
        return;
      }

      if (value.trim().length < 5) {
        renderResult({
          highlightedHtml: escapeHtml(value),
          detectedKeywords: [],
          totalMatches: 0,
          riskScore: 0,
          riskLabel: 'Low'
        });
        if (showValidationError) {
          setMessage(detectorMessage, 'Input is too short for meaningful analysis.', 'error');
        } else {
          clearMessage(detectorMessage);
        }
        return;
      }

      const result = window.UPIDetectorCore.analyzeMessage(value, window.FRAUD_KEYWORDS);
      renderResult(result);

      if (result.riskScore >= 60) {
        setMessage(detectorMessage, 'High risk patterns detected. Treat this message as potentially fraudulent.', 'error');
      } else if (result.riskScore >= 30) {
        setMessage(detectorMessage, 'Moderate risk patterns detected. Verify source before taking action.', 'success');
      } else {
        setMessage(detectorMessage, 'Low keyword risk based on current dataset scan.', 'success');
      }
    }

    const realTimeAnalyze = debounce(() => runAnalysis(false), 180);

    messageInput.addEventListener('input', realTimeAnalyze);
    analyzeBtn.addEventListener('click', () => runAnalysis(true));

    if (sampleBtn) {
      sampleBtn.addEventListener('click', () => {
        messageInput.value = 'Urgent! Your account blocked due to KYC pending. Verify immediately at bit.ly/upi-help and share OTP to avoid service termination.';
        runAnalysis(true);
      });
    }

    if (copyReportBtn && navigator.clipboard) {
      copyReportBtn.addEventListener('click', async () => {
        const report = buildReport(messageInput.value, latestResult);
        try {
          await navigator.clipboard.writeText(report);
          setMessage(detectorMessage, 'Analysis report copied to clipboard.', 'success');
        } catch (_err) {
          setMessage(detectorMessage, 'Unable to copy report. Please copy manually.', 'error');
        }
      });
    }

    riskScore.dataset.currentValue = '0';
    keywordCount.dataset.currentValue = '0';
    matchCount.dataset.currentValue = '0';
    renderDetectedKeywords(keywordList, []);
    renderRiskDrivers(riskDriverList, []);
    renderAdvice(safetyAdvice, []);
  });
})();
