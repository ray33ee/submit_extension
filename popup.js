function updateStatus(total, disabled, enabled) {
    const status = document.getElementById('status');
    const iconCheck = document.getElementById('icon-check');
    const iconMinus = document.getElementById('icon-minus');
    const iconExclamation = document.getElementById('icon-exclamation');
    const mainTitle = document.querySelector('.main-title');

    // Hide all icons first
    iconCheck.style.display = 'none';
    iconMinus.style.display = 'none';
    iconExclamation.style.display = 'none';

    if (total === 0) {
        status.textContent = 'No submit buttons in page';
        iconMinus.style.display = '';
        mainTitle.textContent = 'Safe';
    } else if (disabled === total) {
        status.textContent = 'All submit buttons disabled';
        iconCheck.style.display = '';
        mainTitle.textContent = 'Protected';
    } else if (enabled > 0) {
        status.textContent = 'NO submit buttons disabled';
        iconExclamation.style.display = '';
        mainTitle.textContent = 'WARNING';
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
                            requestCountAndUpdate();
                        }
                    });
                }
            });
        } else {
            chrome.tabs.sendMessage(tabId, {action: 'restore'}, (restoreResponse) => {
                if (restoreResponse && restoreResponse.restored) {
                    requestCountAndUpdate();
                }
            });
        }
    });
});

// Update status when popup opens
requestCountAndUpdate(); 