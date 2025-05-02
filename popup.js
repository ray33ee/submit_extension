function updateStatus(count) {
    const status = document.getElementById('status');
    if (count > 0) {
        status.textContent = `${count} submit button${count === 1 ? '' : 's'} disabled`;
    } else {
        status.textContent = 'No buttons disabled';
    }
}

function requestCountAndUpdate() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'getDisabledCount'}, (response) => {
            updateStatus(response && typeof response.count === 'number' ? response.count : 0);
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
                    chrome.tabs.sendMessage(tabId, {action: 'restore'}, () => {
                        requestCountAndUpdate();
                    });
                }
            });
        } else {
            chrome.tabs.sendMessage(tabId, {action: 'restore'}, () => {
                requestCountAndUpdate();
            });
        }
    });
});

// Update status when popup opens
requestCountAndUpdate(); 