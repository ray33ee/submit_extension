# Submit Button Disabler Extension

This browser extension automatically disables submit buttons on webpages by replacing them with disabled buttons, helping to prevent accidental form submissions.

## Features

- Automatically detects and disables buttons containing the text "Submit"
- Replaces submit buttons with disabled buttons showing "DISABLED" text
- Clicking disabled buttons shows an alert message with instructions
- Modern, clean UI with dark theme
- Extension popup shows real-time status of buttons on the current page
- Badge shows the number of disabled submit buttons
- Toggle to enable/disable the extension instantly
- URL management with allowlist/blocklist capabilities:
  - Blocklist mode: Disables buttons on all sites EXCEPT those in your list
  - Allowlist mode: Disables buttons ONLY on sites in your list
- Optional confirmation before re-enabling buttons
- Visual indicators for different states (protected, warning, ignored, etc.)

## Installation

### Chrome / Edge

1. Clone or download this repository
2. Rename `manifest-chrome.json` to `manifest.json`
3. Open your browser's extension management page
   - Chrome: chrome://extensions/
   - Edge: edge://extensions/
4. Enable "Developer mode"
5. Click "Load unpacked" and select this directory

### Firefox

1. Clone or download this repository
2. Rename `manifest-firefox.json` to `manifest.json`
3. Open Firefox
4. Go to `about:debugging`
5. Click on "This Firefox" in the left sidebar
6. Click "Load Temporary Add-on..."
7. Select the `manifest.json` file in this directory

**Note:**
- This will install the extension temporarily in Firefox. It will be removed when you close Firefox.
- Eventually this project will be available in browser extension stores for easier installation.

## Usage

### Basic Usage
- The extension automatically disables submit buttons on all webpages (unless configured otherwise)
- Click the extension icon in your browser toolbar to open the popup
- Click "Enable Submit Buttons" to temporarily restore buttons on the current page
- Use the main toggle at the top-right to quickly turn the extension on/off

### URL Management
- Click the settings icon in the popup to access settings
- In URL Management, choose between Blocklist and Allowlist mode
- Click the "..." button to manage your URL list
- Add, edit or remove URLs from your list
- URL patterns support:
  - Wildcards (e.g., `*.example.com`, `example.com/*`)
  - Subdomain matching (adding `example.com` will match all subdomains)
  - Path matching (e.g., `example.com/specific-page`)

### Status Indicators
- Green checkmark: All submit buttons are disabled (Protected)
- Yellow exclamation: Submit buttons are enabled (Warning)
- Gray dash: No submit buttons on page (Safe)
- Blue circle with line: Page is ignored due to allowlist/blocklist settings
- Red cross: Extension has meen turned off by the user

## Future Plans

- Modify the code to work on dynamic websites - rewrite the entire code based on strat.txt
- Add extension to official extension stores:
  - Microsoft Edge Add-ons
  - Safari Extensions