# Submit Button Disabler Extension

This browser extension automatically disables submit buttons on webpages by replacing them with yellow disabled buttons.

## Features

- Automatically detects and disables buttons containing the text "Submit"
- Replaces submit buttons with yellow disabled buttons
- Clicking the disabled button shows an alert message
- Extension popup allows re-enabling submit buttons
- Badge shows the number of disabled submit buttons
- Optional confirmation before reenabling buttons

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
- This will install the extension temporarily. It will be removed when you close Firefox.
- Eventually this project will be added to the Firefox extension store so this won't be an issue.

## Usage

- The extension automatically disables submit buttons on all webpages
- Click the extension icon in your browser toolbar to open the popup
- Click "Enable Submit Buttons" to restore the original submit buttons
- Use the checkbox in the popup to require confirmation before reenabling

## Todo

- Maybe add enable/disable for specific websites and domains? 
   - blocklist/allowlist
   - Show a special icon when on a blocked website - maybe a blue icon 
- Add extension to extension stores (chrome, firefox, etc.)