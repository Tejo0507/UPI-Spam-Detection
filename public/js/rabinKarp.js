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

    for (let i = 0; i < keywords.length; i += 1) {
      const keyword = String(keywords[i] || '').trim().toLowerCase();
      if (!keyword || keywordSet.has(keyword)) {
        continue;
      }
      keywordSet.add(keyword);

      const positions = rabinKarpSearch(normalizedMessage, keyword);
      if (!positions.length) {
        continue;
      }

      frequency.set(keyword, positions.length);
      for (let p = 0; p < positions.length; p += 1) {
        occurrences.push({
          keyword,
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

    const totalMatches = occurrences.length;
    const uniqueKeywordMatches = detectedKeywords.length;
    const wordCount = cleanMessage.trim().split(/\s+/).length || 1;

    const scoreByUnique = uniqueKeywordMatches * 4;
    const scoreByCount = totalMatches * 2;
    const scoreByDensity = (totalMatches / wordCount) * 120;
    const rawScore = scoreByUnique + scoreByCount + scoreByDensity;
    const riskScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    return {
      highlightedHtml: buildHighlightedText(cleanMessage, charFlags),
      detectedKeywords,
      totalMatches,
      riskScore,
      riskLabel: getRiskLabel(riskScore)
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
