(function () {
  const CELL_WIDTH = 34;
  const CELL_GAP = 4;
  const MAX_LOG_ITEMS = 8;

  let state = {
    text: '',
    pattern: '',
    steps: [],
    timeline: [],
    cursor: -1,
    started: false,
    isPlaying: false,
    playTimer: null
  };

  function stopPlayback() {
    if (state.playTimer) {
      clearInterval(state.playTimer);
      state.playTimer = null;
    }
    state.isPlaying = false;
  }

  function setFeedback(refs, text, kind) {
    refs.feedback.textContent = text;
    refs.feedback.classList.remove('hidden', 'error', 'success');
    refs.feedback.classList.add(kind);
  }

  function clearFeedback(refs) {
    refs.feedback.textContent = '';
    refs.feedback.classList.add('hidden');
    refs.feedback.classList.remove('error', 'success');
  }

  function toDisplayChar(charValue) {
    return charValue === ' ' ? '\u00A0' : charValue;
  }

  function renderPatternLine(pattern, container) {
    container.innerHTML = '';
    for (let i = 0; i < pattern.length; i += 1) {
      const span = document.createElement('span');
      span.className = 'rk-char-cell rk-pattern-cell';
      span.textContent = toDisplayChar(pattern[i]);
      container.appendChild(span);
    }
  }

  function renderTextLine(text, container) {
    container.innerHTML = '';
    for (let i = 0; i < text.length; i += 1) {
      const span = document.createElement('span');
      span.className = 'rk-char-cell';
      span.dataset.index = String(i);
      span.textContent = toDisplayChar(text[i]);
      container.appendChild(span);
    }
  }

  function createTimeline(steps) {
    const events = [];

    for (let i = 0; i < steps.length; i += 1) {
      const step = steps[i];
      const isLast = i === steps.length - 1;

      events.push({
        type: 'compute',
        stepIndex: i,
        step
      });

      events.push({
        type: 'compare',
        stepIndex: i,
        step
      });

      if (step.hashMatch && step.verifiedMatch) {
        events.push({
          type: 'match',
          stepIndex: i,
          step
        });
      } else {
        events.push({
          type: 'mismatch',
          stepIndex: i,
          step
        });
      }

      if (!isLast) {
        events.push({
          type: 'shift',
          stepIndex: i,
          step,
          nextStep: steps[i + 1],
          displayIndex: i + 1
        });
      }
    }

    if (steps.length) {
      events.push({
        type: 'complete',
        stepIndex: steps.length - 1,
        step: steps[steps.length - 1]
      });
    }

    return events;
  }

  function actionDetails(event) {
    const step = event.step;

    if (event.type === 'compute') {
      return {
        title: 'Computing Hash',
        text: `Computing rolling hash for window "${step.window}" at text index ${step.index}.`,
        log: `Compute hash for window at index ${step.index}.`
      };
    }

    if (event.type === 'compare') {
      const hashResult = step.hashMatch ? 'equal' : 'different';
      return {
        title: 'Comparing Hash Values',
        text: `Comparing current window hash with pattern hash. The values are ${hashResult}.`,
        log: `Compare window hash and pattern hash at index ${step.index}.`
      };
    }

    if (event.type === 'match') {
      return {
        title: 'Match Found',
        text: 'Hashes matched and character verification confirmed the keyword match.',
        log: `Verified keyword match at index ${step.index}.`
      };
    }

    if (event.type === 'mismatch') {
      const reason = step.hashMatch
        ? 'Hashes matched but character verification rejected the window.'
        : 'Hashes did not match, so this window is rejected directly.';
      return {
        title: 'Mismatch Identified',
        text: reason,
        log: `Window at index ${step.index} rejected.`
      };
    }

    if (event.type === 'shift') {
      return {
        title: 'Shifting Window',
        text: `Sliding window right by one character. Outgoing: "${step.outgoingChar || ' '}" | Incoming: "${step.incomingChar || ' '}".`,
        log: `Shift window from index ${step.index} to index ${step.index + 1}.`
      };
    }

    return {
      title: 'Visualization Complete',
      text: 'All windows were processed. The Rabin-Karp scan reached the end of the input text.',
      log: 'Reached end of scan.'
    };
  }

  function getWindowStateClass(event) {
    if (!event) {
      return '';
    }
    if (event.type === 'match') {
      return 'state-match';
    }
    if (event.type === 'mismatch') {
      return 'state-mismatch';
    }
    return 'state-window';
  }

  function setHashStatus(refs, event) {
    refs.hashStatus.classList.remove('rk-status-neutral', 'rk-status-match', 'rk-status-mismatch');

    if (!event || event.type === 'compute' || event.type === 'shift') {
      refs.hashStatus.textContent = 'Computing';
      refs.hashStatus.classList.add('rk-status-neutral');
      return;
    }

    if (event.type === 'compare' || event.type === 'match' || event.type === 'mismatch') {
      if (event.step.hashMatch) {
        refs.hashStatus.textContent = 'Hash Match';
        refs.hashStatus.classList.add('rk-status-match');
      } else {
        refs.hashStatus.textContent = 'Hash Mismatch';
        refs.hashStatus.classList.add('rk-status-mismatch');
      }
      return;
    }

    refs.hashStatus.textContent = 'Complete';
    refs.hashStatus.classList.add('rk-status-neutral');
  }

  function highlightWindow(refs, event) {
    const allCells = refs.charLine.querySelectorAll('.rk-char-cell');
    allCells.forEach((cell) => {
      cell.classList.remove('is-window', 'is-match', 'is-mismatch');
    });

    if (!event) {
      refs.windowFrame.className = 'rk-window-frame hidden';
      return;
    }

    const start = typeof event.displayIndex === 'number' ? event.displayIndex : event.step.index;
    const end = start + state.pattern.length;

    for (let i = start; i < end; i += 1) {
      const cell = refs.charLine.querySelector(`[data-index="${i}"]`);
      if (!cell) {
        continue;
      }
      cell.classList.add('is-window');
      if (event.type === 'match') {
        cell.classList.add('is-match');
      } else if (event.type === 'mismatch') {
        cell.classList.add('is-mismatch');
      }
    }

    const left = start * (CELL_WIDTH + CELL_GAP);
    const width = state.pattern.length * CELL_WIDTH + (state.pattern.length - 1) * CELL_GAP;
    refs.windowFrame.className = `rk-window-frame ${getWindowStateClass(event)}`;
    refs.windowFrame.style.left = `${left}px`;
    refs.windowFrame.style.width = `${Math.max(width, CELL_WIDTH)}px`;
  }

  function updateTrace(refs) {
    refs.log.innerHTML = '';

    if (!state.started || state.cursor < 0) {
      return;
    }

    const start = Math.max(0, state.cursor - (MAX_LOG_ITEMS - 1));
    for (let i = start; i <= state.cursor; i += 1) {
      const event = state.timeline[i];
      const details = actionDetails(event);
      const item = document.createElement('li');
      item.textContent = `${i + 1}. ${details.log}`;
      refs.log.appendChild(item);
    }
  }

  function updateButtons(refs) {
    const hasTimeline = state.started && state.timeline.length > 0;
    refs.prevBtn.disabled = !hasTimeline || state.cursor <= 0 || state.isPlaying;
    refs.nextBtn.disabled = !hasTimeline || state.cursor >= state.timeline.length - 1 || state.isPlaying;
    refs.resetBtn.disabled = !hasTimeline;
    refs.startBtn.disabled = state.isPlaying;
  }

  function resetView(refs) {
    refs.charLine.innerHTML = '';
    refs.patternLine.innerHTML = '';
    refs.windowFrame.className = 'rk-window-frame hidden';
    refs.windowHash.textContent = '-';
    refs.patternHash.textContent = '-';
    refs.windowIndex.textContent = '-';
    refs.hashStatus.textContent = 'Not started';
    refs.hashStatus.className = 'rk-status-badge rk-status-neutral';
    refs.stepCounter.textContent = 'Step: -';
    refs.actionTitle.textContent = 'Awaiting start';
    refs.actionText.textContent = 'Click Start Visualization to initialize the first window and run automatic progression.';
    refs.windowText.textContent = 'Current Window: -';
    refs.shiftText.textContent = 'Shift Detail: -';
    refs.log.innerHTML = '';
    updateButtons(refs);
  }

  function renderCurrentEvent(refs) {
    if (!state.started || state.cursor < 0 || !state.timeline.length) {
      resetView(refs);
      return;
    }

    const event = state.timeline[state.cursor];
    const details = actionDetails(event);

    const activeHash = event.type === 'shift' && event.nextStep
      ? event.nextStep.windowHash
      : event.step.windowHash;
    const activeIndex = event.type === 'shift' && typeof event.displayIndex === 'number'
      ? event.displayIndex
      : event.step.index;
    const activeWindowText = event.type === 'shift' && event.nextStep
      ? event.nextStep.window
      : event.step.window;

    refs.stepCounter.textContent = `Step: ${state.cursor + 1} of ${state.timeline.length}`;
    refs.actionTitle.textContent = details.title;
    refs.actionText.textContent = details.text;
    refs.windowText.textContent = `Current Window: "${activeWindowText}"`;
    refs.shiftText.textContent = event.type === 'shift'
      ? `Shift Detail: Out "${event.step.outgoingChar || ' '}" | In "${event.step.incomingChar || ' '}"`
      : 'Shift Detail: No shift action in this step';

    refs.windowHash.textContent = String(activeHash);
    refs.patternHash.textContent = String(event.step.patternHash);
    refs.windowIndex.textContent = String(activeIndex);

    setHashStatus(refs, event);
    highlightWindow(refs, event);
    updateTrace(refs);
    updateButtons(refs);
  }

  function startVisualization(refs) {
    stopPlayback();
    clearFeedback(refs);

    const text = String(refs.textInput.value || '').trim();
    const pattern = String(refs.patternInput.value || '').trim();

    if (!text || !pattern) {
      setFeedback(refs, 'Text and pattern are required to start visualization.', 'error');
      return;
    }
    if (pattern.length > text.length) {
      setFeedback(refs, 'Pattern length must be less than or equal to text length.', 'error');
      return;
    }

    const output = window.UPIDetectorCore.buildRabinKarpSteps(text, pattern);
    if (!output.steps.length) {
      setFeedback(refs, 'Unable to generate simulation steps for the provided input.', 'error');
      return;
    }

    state = {
      text: output.text,
      pattern: output.pattern,
      steps: output.steps,
      timeline: createTimeline(output.steps),
      cursor: 0,
      started: true
    };

    renderTextLine(state.text, refs.charLine);
    renderPatternLine(state.pattern, refs.patternLine);
    renderCurrentEvent(refs);
    setFeedback(refs, 'Visualization started. Running automatic simulation.', 'success');
    startAutoPlayback(refs);
  }

  function startAutoPlayback(refs) {
    stopPlayback();
    if (!state.started || !state.timeline.length) {
      return;
    }

    state.isPlaying = true;
    updateButtons(refs);

    state.playTimer = setInterval(() => {
      if (state.cursor >= state.timeline.length - 1) {
        stopPlayback();
        updateButtons(refs);
        setFeedback(refs, 'Visualization complete. You can review steps using Previous or Reset.', 'success');
        return;
      }

      state.cursor += 1;
      renderCurrentEvent(refs);
    }, 900);
  }

  function nextStep(refs) {
    if (!state.started || !state.timeline.length) {
      return;
    }
    if (state.cursor < state.timeline.length - 1) {
      state.cursor += 1;
      renderCurrentEvent(refs);
    }
  }

  function prevStep(refs) {
    if (!state.started || !state.timeline.length) {
      return;
    }
    if (state.cursor > 0) {
      state.cursor -= 1;
      renderCurrentEvent(refs);
    }
  }

  function resetSimulation(refs) {
    stopPlayback();
    state = {
      text: '',
      pattern: '',
      steps: [],
      timeline: [],
      cursor: -1,
      started: false,
      isPlaying: false,
      playTimer: null
    };
    clearFeedback(refs);
    resetView(refs);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const refs = {
      textInput: document.getElementById('viz-text'),
      patternInput: document.getElementById('viz-pattern'),
      startBtn: document.getElementById('viz-start'),
      prevBtn: document.getElementById('viz-prev'),
      nextBtn: document.getElementById('viz-next'),
      resetBtn: document.getElementById('viz-reset'),
      charLine: document.getElementById('viz-char-line'),
      patternLine: document.getElementById('viz-pattern-line'),
      windowFrame: document.getElementById('viz-window-frame'),
      windowHash: document.getElementById('viz-window-hash'),
      patternHash: document.getElementById('viz-pattern-hash'),
      hashStatus: document.getElementById('viz-hash-status'),
      windowIndex: document.getElementById('viz-window-index'),
      stepCounter: document.getElementById('viz-step-counter'),
      actionTitle: document.getElementById('viz-action-title'),
      actionText: document.getElementById('viz-action-text'),
      windowText: document.getElementById('viz-window-text'),
      shiftText: document.getElementById('viz-shift-text'),
      log: document.getElementById('viz-log'),
      feedback: document.getElementById('viz-feedback')
    };

    if (!window.UPIDetectorCore || !refs.startBtn) {
      return;
    }

    refs.startBtn.addEventListener('click', () => startVisualization(refs));
    refs.nextBtn.addEventListener('click', () => nextStep(refs));
    refs.prevBtn.addEventListener('click', () => prevStep(refs));
    refs.resetBtn.addEventListener('click', () => resetSimulation(refs));

    resetView(refs);
  });
})();
