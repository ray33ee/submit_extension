function updateStatusIcon(iconType) {
    const iconCheck = document.getElementById('icon-check');
    const iconMinus = document.getElementById('icon-minus');
    const iconExclamation = document.getElementById('icon-exclamation');
    const iconOff = document.getElementById('icon-off');

    // Hide all icons first
    iconCheck.style.display = 'none';
    iconMinus.style.display = 'none';
    iconExclamation.style.display = 'none';
    iconOff.style.display = 'none';

    // Show the requested icon
    switch(iconType) {
        case 'check':
            iconCheck.style.display = '';
            break;
        case 'minus':
            iconMinus.style.display = '';
            break;
        case 'exclamation':
            iconExclamation.style.display = '';
            break;
        case 'off':
            iconOff.style.display = '';
            break;
    }
}

function updateStatus(total, disabled, enabled) {
    if (!extensionToggle.checked) return;

    const status = document.getElementById('status');
    const mainTitle = document.querySelector('.main-title');

    if (total === 0) {
        status.textContent = 'No submit buttons in page';
        mainTitle.textContent = 'Safe';
        updateStatusIcon('minus');
    } else if (disabled === total) {
        status.textContent = 'All submit buttons disabled';
        mainTitle.textContent = 'Protected';
        updateStatusIcon('check');
    } else if (enabled > 0) {
        status.textContent = 'NO submit buttons disabled';
        mainTitle.textContent = 'WARNING';
        updateStatusIcon('exclamation');
    }
}

function requestCountAndUpdate() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'getDisabledCount'}, (response) => {
            if (response && typeof response.total === 'number' && typeof response.disabled === 'number' && typeof response.enabled === 'number') {
                updateStatus(response.total, response.disabled, response.enabled);
            } else {
                updateStatus(0, 0, 0);
            }
        });
    });
}

const confirmCheckbox = document.getElementById('confirmEnable');

// Restore checkbox state on popup open
chrome.storage.local.get(['confirmEnable'], (result) => {
    confirmCheckbox.checked = !!result.confirmEnable;
});

// Save checkbox state when changed
confirmCheckbox.addEventListener('change', () => {
    chrome.storage.local.set({ confirmEnable: confirmCheckbox.checked });
});

document.getElementById('enableButton').addEventListener('click', () => {
    const confirmChecked = confirmCheckbox.checked;
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const tabId = tabs[0].id;
        if (confirmChecked) {
            chrome.tabs.sendMessage(tabId, {action: 'confirmEnable'}, (response) => {
                if (response && response.confirmed) {
                    chrome.tabs.sendMessage(tabId, {action: 'restore'}, (restoreResponse) => {
                        if (restoreResponse && restoreResponse.restored) {
                            // Wait for the content script to finish restoring buttons
                            setTimeout(() => {
                                requestCountAndUpdate();
                            }, 100);
                        }
                    });
                }
            });
        } else {
            chrome.tabs.sendMessage(tabId, {action: 'restore'}, (restoreResponse) => {
                if (restoreResponse && restoreResponse.restored) {
                    // Wait for the content script to finish restoring buttons
                    setTimeout(() => {
                        requestCountAndUpdate();
                    }, 100);
                }
            });
        }
    });
});

// Handle extension toggle
const extensionToggle = document.getElementById('extensionToggle');
const card = document.querySelector('.card');

// Restore toggle state on popup open
chrome.storage.local.get(['extensionEnabled'], (result) => {
    extensionToggle.checked = result.extensionEnabled !== false; // default to true
    updateExtensionState(extensionToggle.checked);
});

// Save toggle state when changed
extensionToggle.addEventListener('change', () => {
    chrome.storage.local.set({ extensionEnabled: extensionToggle.checked });
    updateExtensionState(extensionToggle.checked);
});

function updateExtensionState(isEnabled) {
    const mainTitle = document.querySelector('.main-title');
    const status = document.getElementById('status');

    if (!isEnabled) {
        card.classList.add('extension-off');
        mainTitle.textContent = 'OFF';
        status.textContent = 'Extension is turned off';
        updateStatusIcon('off');
    } else {
        card.classList.remove('extension-off');
        // Wait for the content script to process buttons
        setTimeout(() => {
            requestCountAndUpdate();
        }, 100);
    }
}

// Listen for storage changes to update UI immediately
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.extensionEnabled) {
        updateExtensionState(changes.extensionEnabled.newValue);
    }
});

// Update status when popup opens
requestCountAndUpdate(); 