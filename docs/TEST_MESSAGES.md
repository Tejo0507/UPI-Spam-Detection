# Test Message Bank

Use these samples to validate detection behavior.

## Benign Samples

1. "Please send me the meeting notes before 4 PM."
2. "Electricity bill paid successfully. Thank you."
3. "Your order is out for delivery and will arrive today."

## Suspicious Samples

1. "Urgent! Verify account now at bit.ly/upi-safe or account will be blocked."
2. "Congratulations winner! Claim cashback reward immediately and share OTP."
3. "Final warning: UPI PIN reset required in 10 minutes. Click here to confirm identity."

## Expected Behavior

- Benign samples should score low with few or no risk drivers.
- Suspicious samples should score medium/high with multiple risk drivers.
- Messages containing OTP/PIN/link pressure should carry stronger risk weight.
