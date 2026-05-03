# UPI Spam Detection

A practical web app for screening suspicious UPI/payment-related messages using a transparent, explainable rule-based engine built on Rabin-Karp pattern matching.

## Why This Project Matters

UPI scams rely on urgency, fake rewards, phishing links, and credential theft prompts. This repo helps users and teams:

- quickly triage suspicious messages,
- understand why a message was flagged,
- apply a safety checklist before taking action.

## What Users Get

- Real-time message scanning with keyword highlighting.
- Weighted risk scoring based on suspicious terms and high-risk patterns.
- Additional signal detection for links, urgency language, sensitive data requests, and UPI-handle mentions.
- Risk drivers panel that explains the major contributors to the score.
- Safety recommendations generated from analysis output.
- One-click copyable analysis report for support/escalation workflows.
- Rabin-Karp step visualization for learning and demos.
- Browser extension for quick checks and page scanning.

## Screens and Flow

- Home: product overview and capabilities.
- Detector: analyze text, inspect score, copy report.
- How It Works: detection pipeline and response checklist.
- Algorithm Explanation: Rabin-Karp simulation with step controls.
- Authentication: simple local demo auth for protected access.

## Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js, Express
- Security/ops middleware: Helmet, Compression

## Local Setup

1. Clone repository:
```bash
git clone https://github.com/Tejo0507/UPI-Spam-Detection.git
cd UPI-Spam-Detection
```

2. Install dependencies:
```bash
npm install
```

3. Start server:
```bash
npm start
```

4. Open app:
```text
http://localhost:3000
```

5. Health check endpoint:
```text
http://localhost:3000/health
```

## Browser Extension (Quick Check)

The extension lives in [extension](extension) and supports:

- Paste-in analysis in the popup.
- Page scan for visible text.
- Context-menu analysis for selected text.
- Optional deep check via the `/analyze` API.

Load unpacked (Chrome/Edge):

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `extension/` folder.

## API: Deep Analysis

POST `/analyze`

```json
{
	"message": "Urgent! Your account blocked due to KYC pending.",
	"language": "both"
}
```

Response:

```json
{
	"status": "ok",
	"cached": false,
	"analysis": {
		"riskScore": 78,
		"riskLabel": "High",
		"detectedKeywords": [],
		"totalMatches": 0,
		"riskDrivers": [],
		"advice": [],
		"language": "both"
	},
	"meta": {
		"version": "1.0.0",
		"language": "both"
	}
}
```

## Suggested Use Cases

- Customer-support triage for suspicious payment messages.
- Awareness training for students, families, and new digital payment users.
- Demonstrations of explainable rule-based fraud screening.
- Pre-filtering before escalation to advanced fraud analysis tools.

## Known Limitations

- Detection is rule/keyword/pattern based, not ML-powered.
- No sender reputation, device fingerprinting, or transaction telemetry.
- Client-side demo auth with local storage is not production authentication.

Use this project as an early-warning layer, not as the only decision system.

## Improving the Keyword Bank

Update [public/js/keywords.js](public/js/keywords.js) with:

- new scam phrases,
- weighted terms for severe signals,
- category and reason metadata for explainability.

Recommended approach:

1. Add 10 to 20 new phrases from current scam trends.
2. Assign higher weights to OTP/PIN/credential coercion language.
3. Test on both benign and malicious example messages.
4. Tune thresholds only after evaluating false positives.

## Contribution Ideas

- Add multilingual scam phrase packs (Hindi/Tamil/Telugu/etc.).
- Add import/export of detection profiles.
- Add benchmark page for algorithm performance by input size.
- Add unit tests for scoring logic and boundary matching.
- Add optional backend API mode for centralized scanning.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make focused changes with clear commit messages.
4. Run and verify locally.
5. Open a pull request with before/after behavior notes.

## License

Distributed under the MIT License. See `LICENSE` for more information.

---
<div align="center">
Made with care for safer digital payments.
</div>