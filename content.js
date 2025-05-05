// Function to create disabled button replacement
function createDisabledButton(originalButton) {
    const disabledDiv = document.createElement('div');
    
    disabledDiv.className = 'disabled-submit-button';
    disabledDiv.style.width = originalButton.offsetWidth + 'px';
    disabledDiv.style.height = originalButton.offsetHeight + 'px';
    disabledDiv.textContent = 'DISABLED';
    
    disabledDiv.addEventListener('click', () => {
        alert('Submit button is disabled by extension. Click extension to enable');
    });
    
    return disabledDiv;
}

// Function to check if a button is already disabled
function isButtonDisabled(button) {
    // Check if the button has a disabled button ID
    if (!button.dataset.disabledButtonId) return false;
    
    // Look for the associated disabled div in the DOM
    const disabledDiv = document.querySelector(`.disabled-submit-button[data-original-button-id="${button.dataset.disabledButtonId}"]`);
    return disabledDiv !== null;
}

// Function to update the badge
function updateBadge() {
    chrome.storage.local.get(['extensionEnabled'], (result) => {
        if (result.extensionEnabled === false) {
            // If extension is disabled, show no badge
            chrome.runtime.sendMessage({
                action: 'updateBadge',
                count: 0
            });
            return;
        }
    const disabledButtons = document.querySelectorAll('.disabled-submit-button');
    const count = disabledButtons.length;
    chrome.runtime.sendMessage({
        action: 'updateBadge',
        count: count
        });
    });
}

// Function to check if current URL matches any in the list
function isUrlInList(urlList, currentUrl) {
    return urlList.some(pattern => {
        try {
            // Handle wildcard patterns
            if (pattern.includes('*')) {
                const regexPattern = pattern
                    .replace(/\./g, '\\.') // Escape dots
                    .replace(/\*/g, '.*'); // Convert * to .*
                const regex = new RegExp(`^${regexPattern}$`);
                return regex.test(currentUrl);
            }

            // Handle normal URLs
            const patternUrl = new URL(pattern);
            const currentUrlObj = new URL(currentUrl);
            
            // Check if hostname matches (including subdomains)
            const patternHostname = patternUrl.hostname;
            const currentHostname = currentUrlObj.hostname;
            
            // If pattern is a subdomain, match exactly
            if (patternHostname.split('.').length > 2) {
                if (currentHostname !== patternHostname) return false;
            } else {
                // If pattern is a main domain, match domain and all subdomains
                if (currentHostname !== patternHostname && !currentHostname.endsWith('.' + patternHostname)) {
                    return false;
                }
            }

            // Check path matching
            const patternPath = patternUrl.pathname.replace(/\/$/, ''); // Remove trailing slash
            const currentPath = currentUrlObj.pathname.replace(/\/$/, ''); // Remove trailing slash

            // If pattern has no path, match any path
            if (patternPath === '' || patternPath === '/') {
                return true;
            }

            // Exact path match (ignoring trailing slashes)
            return currentPath === patternPath;

        } catch (e) {
            console.warn('Invalid URL pattern:', pattern);
            return false;
        }
    });
}

// Function to process submit buttons
function processSubmitButtons() {
    chrome.storage.local.get(['extensionEnabled'], (result) => {
        if (result.extensionEnabled === false) {
            // If extension is disabled, restore any disabled buttons
            restoreSubmitButtons();
            return;
        }

        // Get current URL and list settings
        const currentUrl = window.location.href;
        chrome.storage.sync.get(['listMode', 'urlList'], (settings) => {
            const listMode = settings.listMode || 'blocklist';
            const urlList = settings.urlList || [];
            const shouldProcess = listMode === 'allowlist' ? 
                isUrlInList(urlList, currentUrl) : 
                !isUrlInList(urlList, currentUrl);

            if (!shouldProcess) {
                restoreSubmitButtons();
                return;
            }

            // First restore any existing buttons to avoid duplication
            restoreSubmitButtons();

            const buttons = document.querySelectorAll('button');
            const submitButtons = [];
            
            // First collect all submit buttons
            buttons.forEach(button => {
                if (button.textContent.includes('Submit') && !isButtonDisabled(button)) {
                    submitButtons.push(button);
                }
            });
            
            // Then disable them with sequential IDs
            submitButtons.forEach((button, index) => {
                const disabledButton = createDisabledButton(button);
                
                // Use a simple sequential ID scheme
                const uniqueId = `submit-btn-${index}`;
                
                // Replace the button with the disabled div
                button.parentNode.insertBefore(disabledButton, button);
                button.style.display = 'none';
                
                // Store original button reference
                disabledButton.dataset.originalButtonId = uniqueId;
                button.dataset.disabledButtonId = uniqueId;
            });
            
            updateBadge();
            // Notify popup that processing is complete
            chrome.runtime.sendMessage({ action: 'buttonsProcessed' });
        });
    });
}

// Function to restore submit buttons
function restoreSubmitButtons() {
    // Get all disabled buttons
    const disabledButtons = document.querySelectorAll('.disabled-submit-button');
    
    // Create a map of ID to button for faster lookup
    const originalButtons = {};
    document.querySelectorAll('button[data-disabled-button-id]').forEach(btn => {
        originalButtons[btn.dataset.disabledButtonId] = btn;
    });
    
    // Restore each disabled button
    disabledButtons.forEach(disabledButton => {
        const id = disabledButton.dataset.originalButtonId;
        if (id && originalButtons[id]) {
            // Found the original button, restore it
            const originalButton = originalButtons[id];
            originalButton.style.display = '';
            originalButton.removeAttribute('data-disabled-button-id');
            disabledButton.remove();
        } else {
            // Just remove the disabled placeholder
            disabledButton.remove();
        }
    });
    
    // Final pass: Find any buttons that might have been missed
    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.includes('Submit') && btn.style.display === 'none') {
            btn.style.display = '';
            btn.removeAttribute('data-disabled-button-id');
        }
    });
    
    updateBadge();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'restore') {
        restoreSubmitButtons();
        sendResponse({ restored: true });
        // Notify popup that restore is complete
        chrome.runtime.sendMessage({ action: 'buttonsProcessed' });
    }
    if (request.action === 'getDisabledCount') {
        chrome.storage.local.get(['extensionEnabled'], (result) => {
            if (result.extensionEnabled === false) {
                sendResponse({ total: 0, disabled: 0, enabled: 0 });
                return;
            }

            // Get current URL and list settings
            const currentUrl = window.location.href;
            chrome.storage.sync.get(['listMode', 'urlList'], (settings) => {
                const listMode = settings.listMode || 'blocklist';
                const urlList = settings.urlList || [];
                const shouldProcess = listMode === 'allowlist' ? 
                    isUrlInList(urlList, currentUrl) : 
                    !isUrlInList(urlList, currentUrl);

                if (!shouldProcess) {
                    sendResponse({ 
                        total: 0, 
                        disabled: 0, 
                        enabled: 0,
                        ignored: true,
                        listMode: listMode
                    });
                    return true; // Keep the message channel open
                }

                const allSubmitButtons = Array.from(document.querySelectorAll('button')).filter(btn => btn.textContent.includes('Submit'));
                const total = allSubmitButtons.length;
                let disabled = 0;
                let enabled = 0;
                allSubmitButtons.forEach(btn => {
                    if (btn.style.display === 'none') {
                        disabled++;
                    } else {
                        enabled++;
                    }
                });
                sendResponse({ 
                    total, 
                    disabled, 
                    enabled, 
                    ignored: false,
                    listMode: listMode
                });
            });
        });
        return true; // Keep the message channel open for async response
    }
    if (request.action === 'confirmEnable') {
        const confirmed = confirm('Are you sure you want to reenable submit buttons?');
        sendResponse({ confirmed });
    }
    return true;
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.extensionEnabled) {
        if (changes.extensionEnabled.newValue === false) {
            // If extension is disabled, restore all buttons
            restoreSubmitButtons();
        } else {
            // If extension is enabled, process buttons
            processSubmitButtons();
        }
    }
    // Also reprocess buttons when URL list or mode changes
    if (namespace === 'sync' && (changes.listMode || changes.urlList)) {
        processSubmitButtons();
    }
});

// Process buttons when the page loads
processSubmitButtons(); 