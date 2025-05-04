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

// Function to process submit buttons
function processSubmitButtons() {
    chrome.storage.local.get(['extensionEnabled'], (result) => {
        if (result.extensionEnabled === false) {
            // If extension is disabled, restore any disabled buttons
            restoreSubmitButtons();
            return;
        }
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            if (button.textContent.includes('Submit') && !isButtonDisabled(button)) {
                const disabledButton = createDisabledButton(button);
                // Replace the button with the disabled div
                button.parentNode.insertBefore(disabledButton, button);
                button.style.display = 'none';
                
                // Store original button reference
                disabledButton.dataset.originalButtonId = Date.now();
                button.dataset.disabledButtonId = disabledButton.dataset.originalButtonId;
            }
        });
        updateBadge();
        // Notify popup that processing is complete
        chrome.runtime.sendMessage({ action: 'buttonsProcessed' });
    });
}

// Function to restore submit buttons
function restoreSubmitButtons() {
    const disabledButtons = document.querySelectorAll('.disabled-submit-button');
    disabledButtons.forEach(disabledButton => {
        const originalButton = document.querySelector(`button[data-disabled-button-id="${disabledButton.dataset.originalButtonId}"]`);
        if (originalButton) {
            originalButton.style.display = '';
            disabledButton.remove();
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
            sendResponse({ total, disabled, enabled });
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
});

// Process buttons when the page loads
processSubmitButtons(); 