// Function to create disabled button replacement
function createDisabledButton(originalButton, index) {
    const disabledDiv = document.createElement('div');
    
    disabledDiv.className = 'disabled-submit-button';
    disabledDiv.style.width = originalButton.offsetWidth + 'px';
    disabledDiv.style.height = originalButton.offsetHeight + 'px';
    disabledDiv.textContent = 'DISABLED';
    
    // Ensure text fits properly while preserving yellow background and original size
    // Note: some styles are already in styles.css but we set critical ones inline to ensure consistency
    disabledDiv.style.overflow = 'hidden';
    disabledDiv.style.textAlign = 'center';
    disabledDiv.style.display = 'flex'; // Override in case display is changed elsewhere
    disabledDiv.style.alignItems = 'center'; // Ensure vertical centering
    disabledDiv.style.justifyContent = 'center'; // Ensure horizontal centering
    
    // Get the computed style of the original button to match its font
    const computedStyle = window.getComputedStyle(originalButton);
    const originalFontSize = computedStyle.fontSize;
    
    // Scale down the font size slightly since "DISABLED" is longer than typical button text
    // Extract the numeric part and unit from the fontSize
    const fontSizeMatch = originalFontSize.match(/^([\d.]+)(\D+)$/);
    if (fontSizeMatch) {
        const numericSize = parseFloat(fontSizeMatch[1]);
        const unit = fontSizeMatch[2]; // px, em, rem, etc.
        // Apply a 0.80 scale factor to make sure the text fits
        const adjustedSize = (numericSize * 0.80).toFixed(2);
        disabledDiv.style.fontSize = adjustedSize + unit;
    } else {
        // Fallback if parsing fails
        disabledDiv.style.fontSize = originalFontSize;
    }
    
    disabledDiv.style.fontWeight = 'bold';
    disabledDiv.style.lineHeight = '1';
    disabledDiv.style.padding = '0'; // Override any padding to ensure text stays centered
    
    disabledDiv.addEventListener('click', () => {
        alert('Submit button is disabled by extension. Click extension to enable');
    });
    
    
    // Set the ID for the disabled div
    disabledDiv.dataset.originalButtonId = `submit-btn-${index}`;
    
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

// Function to check if a button is a submit button
function isSubmitButton(button) {
    // Check for button elements that contain "Submit" text
    if (button.tagName === 'BUTTON' && button.textContent.includes('Submit')) {
        return true;
    }
    
    // Check for input elements with type="submit"
    if (button.tagName === 'INPUT' && button.type === 'submit' && button.value === 'Submit') {
        return true;
    }
    
    return false;
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

            // Get all potential submit elements (buttons and input[type=submit])
            const potentialSubmitElements = [...document.querySelectorAll('button, input[type=submit]')];
            const submitButtons = [];
            
            // First collect all submit buttons
            potentialSubmitElements.forEach(element => {
                if (isSubmitButton(element) && !isButtonDisabled(element)) {
                    submitButtons.push(element);
                }
            });
            
            // Then disable them with sequential IDs
            submitButtons.forEach((button, index) => {
                
                // Create the disabled button with the ID
                const disabledButton = createDisabledButton(button, index);
                
                // Replace the button with the disabled div
                button.parentNode.insertBefore(disabledButton, button);
                button.style.display = 'none';
                
                // Store ID on the original button
                button.dataset.disabledButtonId = index;
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
    document.querySelectorAll('button[data-disabled-button-id], input[data-disabled-button-id]').forEach(btn => {
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
    document.querySelectorAll('button, input[type=submit]').forEach(element => {
        if ((element.tagName === 'BUTTON' && element.textContent.includes('Submit') && element.style.display === 'none') ||
            (element.tagName === 'INPUT' && element.type === 'submit' && element.style.display === 'none')) {
            element.style.display = '';
            element.removeAttribute('data-disabled-button-id');
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

                const allSubmitElements = Array.from(document.querySelectorAll('button, input[type=submit]')).filter(el => isSubmitButton(el));
                const total = allSubmitElements.length;
                let disabled = 0;
                let enabled = 0;
                allSubmitElements.forEach(el => {
                    if (el.style.display === 'none') {
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