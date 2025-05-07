# Submit Button Disabler Extension

![Submit Button Disabler Logo](../graphics/logo-small.png)

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [How It Works](#how-it-works)
- [Features](#features)
- [User Interface](#user-interface)
- [URL Management](#url-management)
- [Security & Privacy](#security--privacy)
- [Troubleshooting](#troubleshooting)
- [Testing](#testing)
- [Development](#development)
- [Contributing](#contributing)
- [FAQs](#faqs)
- [License](#license)

## Overview

Submit Button Disabler is a browser extension that automatically disables submit buttons on web pages to prevent accidental form submissions. The extension replaces submit buttons with visually distinct disabled versions and provides clear visual cues when buttons have been disabled.

**Use Cases:**
- Prevent accidentally submitting forms before you're ready
- Avoid unintended form submissions when navigating websites with sensitive data
- Give yourself time to review form inputs before submission
- Protect against accidental double-clicks on submit buttons
- Reduce errors in multi-step forms or workflows

## Installation

### Chrome / Edge

1. Clone or download this repository
2. Rename `manifest-chrome.json` to `manifest.json`
3. Open your browser's extension management page
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
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

## How It Works

The Submit Button Disabler extension:

1. Scans web pages for submit buttons (buttons containing "Submit" text)
2. Replaces these buttons with visually distinct disabled versions
3. When a disabled button is clicked, shows a tooltip message explaining the button is disabled
4. Provides a way to re-enable buttons when needed through the extension popup

### Technical Implementation

The extension uses several technologies to achieve its functionality:

- **Content Scripts**: Identify and replace submit buttons directly in the webpage
- **Chrome Storage API**: Persists settings and preferences across browser sessions
- **Message Passing**: Communicates between background scripts, content scripts, and the popup UI
- **CSS Styling**: Creates visually distinct disabled buttons with clear visual indicators

### Detection Methods

The extension identifies submit buttons using the following criteria:

- Button elements with text content containing "Submit"
- Input elements with type="submit" and value="Submit"

## Features

### Core Functionality

- **Automatic Detection**: Identifies and disables buttons containing "Submit" text
- **Visual Replacement**: Replaces submit buttons with distinctly styled disabled versions
- **Tooltip Guidance**: Shows a helpful tooltip when disabled buttons are clicked
- **One-Click Re-enabling**: Easily re-enable buttons through the extension popup
- **Global Toggle**: Turn the extension on/off with a single click

### Advanced Features

- **URL Management**: Control which websites the extension works on using allowlist/blocklist
- **Confirmation Dialog**: Optional confirmation before re-enabling buttons
- **Visual Status Indicators**: Clear status icons showing the current protection state
- **Badge Counter**: Shows the number of disabled submit buttons on the current page
- **Safe DOM Modification**: Avoids infinite loops and unintended side effects when modifying the page

## User Interface

### Popup Interface

The extension popup provides a simple interface with:

- **Status Icon**: Visual indicator showing the current protection state
  - 🟢 Green checkmark: All submit buttons are disabled (Protected)
  - 🟡 Yellow exclamation: Submit buttons are enabled (Warning)
  - ⚪ Gray dash: No submit buttons on page (Safe)
  - 🔵 Blue circle with line: Page is ignored due to allowlist/blocklist settings
  - 🔴 Red cross: Extension has been turned off by the user
  
- **Status Text**: Description of the current submit button status
- **Enable Button**: Quickly re-enable submit buttons on the current page
- **Toggle Switch**: Turn the extension on/off globally
- **Settings Button**: Access extension settings

### Settings Page

The settings page provides additional configuration options:

- **URL Management Mode**:
  - **Blocklist Mode** (default): Disable buttons on all sites EXCEPT those in your list
  - **Allowlist Mode**: Disable buttons ONLY on sites in your list
  
- **Confirmation Option**: Toggle whether to show a confirmation dialog before re-enabling buttons
- **URL Management**: Access the URL list management interface

## URL Management

The extension allows for flexible URL management to control where the extension operates.

### URL List Management

- **Add URLs**: Easily add new URLs to your allowlist or blocklist
- **Edit URLs**: Modify existing entries with a simple edit interface
- **Remove URLs**: Delete URLs you no longer want in your list
- **URL Patterns**: Support for different URL formats:
  - Simple domains: `example.com`
  - Specific paths: `example.com/specific-page`
  - Wildcards: `*.example.com`, `example.com/*`
  - Subdomain matching: Adding `example.com` will match all subdomains

### Switching Modes

1. Click the settings icon in the popup
2. In URL Management, select either "Blocklist Mode" or "Allowlist Mode"
3. Configure your URL list accordingly
4. Changes take effect immediately

### URL Matching Logic

The extension uses the following logic to determine if the current page matches an entry in your URL list:

1. Exact match: The page URL exactly matches an entry in your list
2. Domain match: The domain part of the URL matches an entry (subdomains are considered)
3. Wildcard match: The URL matches a wildcard pattern in your list

## Security & Privacy

The Submit Button Disabler extension is designed with security and privacy in mind:

### Permissions Used

- **activeTab**: Allows the extension to access the currently active tab, but only when you interact with the extension
- **storage**: Enables the extension to save your settings and preferences

### Data Collection

- **No Data Collection**: The extension does not collect or transmit any personal data
- **Local Storage Only**: All settings are stored locally in your browser
- **No External Communications**: The extension does not communicate with any external servers

### Security Considerations

- **Content Script Isolation**: The extension's content scripts run in an isolated environment
- **No External Dependencies**: The extension does not load any external scripts or resources
- **Safe DOM Modifications**: Special care is taken to avoid conflicts with website functionality

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Submit buttons not being disabled | Check if the extension is enabled, or if the site is in your blocklist |
| Extension not working on a specific site | Try adding the site to your allowlist in allowlist mode, or removing it from your blocklist |
| Submit buttons not re-enabling | Try refreshing the page or temporarily disabling the extension |
| Extension conflicts with site functionality | Add the site to your blocklist and report the issue |

### Performance Impact

The extension is designed to have minimal impact on page performance:

- **Efficient DOM Monitoring**: The MutationObserver is configured to ignore irrelevant changes
- **Smart Processing**: Only processes relevant DOM changes to avoid unnecessary work
- **Flag System**: Prevents infinite loops when modifying the DOM

### Reporting Problems

If you encounter issues with the extension, please:

1. Check the Troubleshooting section
2. Try disabling and re-enabling the extension
3. Refresh the page
4. If problems persist, [open an issue](https://github.com/yourusername/submit-button-disabler/issues) with details about:
   - The browser you're using
   - The website where the issue occurs
   - Steps to reproduce the problem
   - What you expected to happen

## Testing

The extension includes several test pages to verify functionality:

### Test Pages

- **[Contact Form](../testpages/test-page.html)**: A simple contact form with a submit button
- **[Dual Forms](../testpages/dual-forms.html)**: Two different forms on the same page
- **[Button Gallery](../testpages/button-gallery.html)**: Collection of different submit button styles
- **[Dynamic Wizard](../testpages/dynamic-wizard.html)**: Multi-step form with dynamically created buttons

Access these pages through the [Test Pages Index](../testpages/index.html).

### Testing Your Own Sites

To test the extension on your own websites:

1. Enable the extension
2. Navigate to your website
3. Check if submit buttons are disabled
4. If not, check if your site is in the blocklist
5. Try clicking on disabled buttons to see the tooltip
6. Test re-enabling buttons through the popup

## Development

### Project Structure

```
submit-button-disabler/
├── icons/             # Extension icons in various sizes
├── src/
│   ├── background.js  # Background script
│   ├── content/       # Content scripts for button detection and replacement
│   │   ├── content.js # Main content script for button handling
│   │   └── content.css# Styles for disabled buttons
│   ├── popup/         # Extension popup UI
│   │   ├── popup.html # Popup HTML structure
│   │   ├── popup.js   # Popup functionality
│   │   └── popup.css  # Popup styling
│   ├── settings/      # Settings page
│   └── url-list/      # URL management interface
├── testpages/         # Test pages for verifying functionality
├── manifest-chrome.json # Chrome/Edge manifest
├── manifest-firefox.json # Firefox manifest
└── README.md          # Project readme
```

### Technical Overview

- The extension uses **content scripts** to identify and replace submit buttons
- **Background scripts** handle badge updates and communication between components
- **Storage API** is used to persist settings across browser sessions
- **URL matching** uses pattern matching for flexible site configuration

### Key Components

- **DOM Manipulation**: The content script creates disabled versions of submit buttons
- **Event Listeners**: Handle user interactions with disabled buttons
- **Messaging System**: Enables communication between extension components
- **Storage Management**: Saves and retrieves user preferences

## Contributing

Contributions to the Submit Button Disabler extension are welcome!

### How to Contribute

1. Fork the repository
2. Create a new branch for your feature or bugfix
3. Make your changes
4. Test your changes with the test pages
5. Submit a pull request

### Code Style Guidelines

- Follow the existing code style in the project
- Use meaningful variable and function names
- Add comments for complex functionality
- Test your changes on multiple browsers if possible

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

*Submit Button Disabler Extension © 2023* 