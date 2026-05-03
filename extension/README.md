# UPI Scam Checker Extension

This browser extension adds on-page scanning and quick checks using the same keyword + pattern engine as the web app.

## Load Unpacked (Chrome/Edge)

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `extension/` folder.
4. Click the extension icon and run a scan.

## Features

- Paste a message for local analysis.
- Scan the current page text (conservative text collection).
- Context-menu check for selected text.
- Optional deep check via the `/analyze` API.

## Privacy

- Local analysis runs fully on-device.
- Page scans only read visible text elements (not input fields).
- Server checks are opt-in and use the configured API endpoint.

## Testing Checklist

1. Open the popup and run **Analyze** on a known scam sample.
2. Toggle **Enable deep check** and confirm the result updates.
3. Use **Scan Page** on a page with readable text.
4. Select text on a page and use the context menu check.
5. Reopen the popup to confirm the last analysis is shown.

Sample scam message (English):
"Urgent! Your account blocked due to KYC pending. Verify immediately at bit.ly/upi-help and share OTP."

Sample scam message (Hindi):
"आपका खाता ब्लॉक हो गया है, तुरंत ओटीपी साझा करें।"

## Publish (Chrome / Edge)

1. Generate the extension zip (exclude node_modules and repo root files).
2. Create a developer account in the Chrome Web Store or Edge Add-ons.
3. Upload the zip, add listing details, screenshots, and privacy notes.
4. Submit for review and share the store link with friends.

Example PowerShell packaging from repo root:

```powershell
$target = "extension-release.zip"
if (Test-Path $target) { Remove-Item $target }
Compress-Archive -Path .\extension\* -DestinationPath $target
```
