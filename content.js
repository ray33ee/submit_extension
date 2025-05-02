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
    const disabledButtons = document.querySelectorAll('.disabled-submit-button');
    const count = disabledButtons.length;
    chrome.runtime.sendMessage({
        action: 'updateBadge',
        count: count
    });
}

// Function to process submit buttons
function processSubmitButtons() {
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
    }
    if (request.action === 'getDisabledCount') {
        const count = document.querySelectorAll('.disabled-submit-button').length;
        sendResponse({ count });
    }
    // Return true to indicate async response if needed
    return true;
});

// Process buttons when the page loads
processSubmitButtons(); 