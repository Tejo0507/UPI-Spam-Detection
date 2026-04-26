# Scoring Model Overview

The detector computes risk score using a weighted rule-based model.

## Inputs

- Keyword matches from the curated fraud term bank.
- Additional pattern signals from regex-based checks.
- Match density relative to message length.

## Score Components

1. Unique keyword coverage.
2. Weighted keyword frequency.
3. Match density multiplier.
4. Pattern signal bonuses.

Final score is clamped to 0-100 and mapped to labels:

- 0-29: Low
- 30-59: Medium
- 60-100: High

## Design Intent

- Improve explainability over black-box scoring.
- Prioritize social-engineering and credential-theft indicators.
- Reduce false positives with standalone word boundary checks.
