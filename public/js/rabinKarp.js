(function () {
  const BASE = 256;
  const MOD = 1000000007;

  function charCodeAtSafe(text, index) {
    return text.charCodeAt(index) || 0;
  }

  function modPow(base, exponent, mod) {
    let result = 1;
    let b = base % mod;
    let e = exponent;
    while (e > 0) {
      if (e % 2 === 1) {
        result = (result * b) % mod;
      }
      b = (b * b) % mod;
      e = Math.floor(e / 2);
    }
    return result;
  }

  function computeHashForString(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = (hash * BASE + charCodeAtSafe(input, i)) % MOD;
    }
    return hash;
  }

  function rollHash(previousHash, leftCode, rightCode, highestBasePower) {
    let hash = previousHash;
    hash = (hash - (leftCode * highestBasePower) % MOD + MOD) % MOD;
    hash = (hash * BASE + rightCode) % MOD;
    return hash;
  }

  function rabinKarpSearch(text, pattern) {
    const matches = [];
    const n = text.length;
    const m = pattern.length;

    if (!m || m > n) {
      return matches;
    }

    const patternHash = computeHashForString(pattern);
    let windowHash = computeHashForString(text.slice(0, m));
    const highestBasePower = modPow(BASE, m - 1, MOD);

    for (let i = 0; i <= n - m; i += 1) {
      if (windowHash === patternHash) {
        let verified = true;
        for (let j = 0; j < m; j += 1) {
          if (text[i + j] !== pattern[j]) {
            verified = false;
            break;
          }
        }
        if (verified) {
          matches.push(i);
        }
      }

      if (i < n - m) {
        windowHash = rollHash(
          windowHash,
          charCodeAtSafe(text, i),
          charCodeAtSafe(text, i + m),
          highestBasePower
        );
      }
    }

    return matches;
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildHighlightedText(message, charFlags) {
    if (!message.length) {
      return '';
    }

    let html = '';
    let inMark = false;

    for (let i = 0; i < message.length; i += 1) {
      const active = Boolean(charFlags[i]);
      if (active && !inMark) {
        html += '<span class="keyword-mark">';
        inMark = true;
      }
      if (!active && inMark) {
        html += '</span>';
        inMark = false;
      }
      html += escapeHtml(message[i]);
    }

    if (inMark) {
      html += '</span>';
    }

    return html;
  }

  function getRiskLabel(score) {
    if (score >= 60) {
      return 'High';
    }
    if (score >= 30) {
      return 'Medium';
    }
    return 'Low';
  }

  function isBoundaryChar(charValue) {
    return !/[a-z0-9]/i.test(charValue || '');
  }

  function isStandaloneMatch(text, start, length) {
    const left = start > 0 ? text[start - 1] : '';
    const right = start + length < text.length ? text[start + length] : '';
    return isBoundaryChar(left) && isBoundaryChar(right);
  }

  function parseKeywordEntry(entry) {
    if (typeof entry === 'string') {
      return {
        keyword: entry.trim().toLowerCase(),
        weight: 1,
        category: 'keyword',
        reason: ''
      };
    }

    const keyword = String((entry && entry.keyword) || (entry && entry.term) || '').trim().toLowerCase();
    const weightValue = Number(entry && entry.weight);
    return {
      keyword,
      weight: Number.isFinite(weightValue) && weightValue > 0 ? weightValue : 1,
      category: String((entry && entry.category) || 'keyword').trim().toLowerCase(),
      reason: String((entry && entry.reason) || '').trim()
    };
  }

  function detectPatternSignals(message) {
    const rules = [
      {
        id: 'suspicious_link',
        label: 'Suspicious Link',
        category: 'link',
        weight: 7,
        regex: /(https?:\/\/|www\.|bit\.ly|tinyurl|shorturl)/gi,
        reason: 'Phishing messages often include links that redirect to fake payment or login pages.'
      },
      {
        id: 'upi_id_request',
        label: 'UPI Handle Mention',
        category: 'payment',
        weight: 5,
        regex: /\b[a-z0-9._-]{2,}@[a-z]{2,}\b/gi,
        reason: 'Direct payment handle mentions can be used to pressure immediate transfer.'
      },
      {
        id: 'urgent_tone',
        label: 'Urgent Tone',
        category: 'social-engineering',
        weight: 4,
        regex: /\b(urgent|immediately|act now|last chance|final warning|within \d+ (minutes|hours?))\b/gi,
        reason: 'Urgency language is a common social-engineering tactic.'
      },
      {
        id: 'sensitive_data_request',
        label: 'Sensitive Data Request',
        category: 'credential',
        weight: 8,
        regex: /\b(share otp|share pin|cvv|password|enter details|confirm identity)\b/gi,
        reason: 'Legitimate institutions do not ask for secret credentials through casual messages.'
      }
    ];

    const matchedSignals = [];

    for (let i = 0; i < rules.length; i += 1) {
      const rule = rules[i];
      const matches = message.match(rule.regex);
      if (!matches || !matches.length) {
        continue;
      }

      matchedSignals.push({
        id: rule.id,
        label: rule.label,
        category: rule.category,
        count: matches.length,
        weight: rule.weight,
        reason: rule.reason
      });
    }

    return matchedSignals;
  }

  function buildAdvice(score, matchedSignals) {
    const advice = [
      'Never share OTP, UPI PIN, CVV, or password over calls, chat, or links.',
      'Verify sender identity through official channels before taking any payment action.'
    ];

    if (score >= 60) {
      advice.unshift('Do not click links or approve collect requests from this message.');
    }

    const hasLinkSignal = matchedSignals.some((item) => item.category === 'link');
    if (hasLinkSignal) {
      advice.push('Avoid opening shortened or unknown links. Visit official apps or websites manually.');
    }

    return advice;
  }

  function analyzeMessage(message, keywords) {
    const cleanMessage = String(message || '');
    const normalizedMessage = cleanMessage.toLowerCase();

    if (!cleanMessage.trim()) {
      return {
        highlightedHtml: '',
        detectedKeywords: [],
        totalMatches: 0,
        riskScore: 0,
        riskLabel: 'Low'
      };
    }

    const frequency = new Map();
    const occurrences = [];
    const keywordSet = new Set();
    let weightedKeywordScore = 0;

    for (let i = 0; i < keywords.length; i += 1) {
      const parsedKeyword = parseKeywordEntry(keywords[i]);
      const keyword = parsedKeyword.keyword;
      if (!keyword || keywordSet.has(keyword)) {
        continue;
      }
      keywordSet.add(keyword);

      const rawPositions = rabinKarpSearch(normalizedMessage, keyword);
      const singleWordKeyword = !keyword.includes(' ');
      const positions = singleWordKeyword
        ? rawPositions.filter((position) => isStandaloneMatch(normalizedMessage, position, keyword.length))
        : rawPositions;
      if (!positions.length) {
        continue;
      }

      frequency.set(keyword, positions.length);
      weightedKeywordScore += positions.length * parsedKeyword.weight;
      for (let p = 0; p < positions.length; p += 1) {
        occurrences.push({
          keyword,
          weight: parsedKeyword.weight,
          category: parsedKeyword.category,
          reason: parsedKeyword.reason,
          start: positions[p],
          end: positions[p] + keyword.length
        });
      }
    }

    const charFlags = new Array(cleanMessage.length).fill(false);
    for (let i = 0; i < occurrences.length; i += 1) {
      const current = occurrences[i];
      for (let j = current.start; j < current.end && j < charFlags.length; j += 1) {
        charFlags[j] = true;
      }
    }

    const detectedKeywords = Array.from(frequency.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count || a.keyword.localeCompare(b.keyword));

    const patternSignals = detectPatternSignals(normalizedMessage);

    const totalMatches = occurrences.length;
    const uniqueKeywordMatches = detectedKeywords.length;
    const wordCount = cleanMessage.trim().split(/\s+/).length || 1;

    const scoreByUnique = uniqueKeywordMatches * 3;
    const scoreByCount = weightedKeywordScore * 2;
    const scoreByDensity = (totalMatches / wordCount) * 120;
    const scoreByPatternSignals = patternSignals.reduce((total, signal) => total + signal.weight * signal.count, 0);
    const rawScore = scoreByUnique + scoreByCount + scoreByDensity + scoreByPatternSignals;
    const riskScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    const riskDrivers = [];
    if (weightedKeywordScore > 0) {
      riskDrivers.push({
        label: 'Keyword Matches',
        category: 'keyword',
        weight: weightedKeywordScore,
        count: totalMatches,
        reason: 'Detected suspicious words and phrases from the fraud keyword bank.'
      });
    }
    for (let i = 0; i < patternSignals.length; i += 1) {
      const signal = patternSignals[i];
      riskDrivers.push({
        label: signal.label,
        category: signal.category,
        weight: signal.weight,
        count: signal.count,
        reason: signal.reason
      });
    }

    return {
      highlightedHtml: buildHighlightedText(cleanMessage, charFlags),
      detectedKeywords,
      totalMatches,
      riskScore,
      riskLabel: getRiskLabel(riskScore),
      riskDrivers,
      advice: buildAdvice(riskScore, patternSignals)
    };
  }

  function buildRabinKarpSteps(text, pattern) {
    const source = String(text || '');
    const target = String(pattern || '');
    const steps = [];

    if (!source.length || !target.length || target.length > source.length) {
      return {
        text: source,
        pattern: target,
        steps,
        patternHash: target.length ? computeHashForString(target) : 0
      };
    }

    const m = target.length;
    const patternHash = computeHashForString(target);
    let windowHash = computeHashForString(source.slice(0, m));
    const highestBasePower = modPow(BASE, m - 1, MOD);

    for (let i = 0; i <= source.length - m; i += 1) {
      const window = source.slice(i, i + m);
      const hashMatch = windowHash === patternHash;
      let verifiedMatch = false;

      if (hashMatch) {
        verifiedMatch = true;
        for (let j = 0; j < m; j += 1) {
          if (source[i + j] !== target[j]) {
            verifiedMatch = false;
            break;
          }
        }
      }

      steps.push({
        index: i,
        window,
        windowHash,
        patternHash,
        hashMatch,
        verifiedMatch,
        outgoingChar: i < source.length - m ? source[i] : '',
        incomingChar: i < source.length - m ? source[i + m] : ''
      });

      if (i < source.length - m) {
        windowHash = rollHash(
          windowHash,
          charCodeAtSafe(source, i),
          charCodeAtSafe(source, i + m),
          highestBasePower
        );
      }
    }

    return {
      text: source,
      pattern: target,
      steps,
      patternHash
    };
  }

  window.UPIDetectorCore = {
    BASE,
    MOD,
    computeHashForString,
    rabinKarpSearch,
    analyzeMessage,
    buildRabinKarpSteps
  };
})();
