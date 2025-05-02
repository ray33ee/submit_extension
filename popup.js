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

document.getElementById('enableButton').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'restore'}, () => {
            // After restoring, update the status
            requestCountAndUpdate();
        });
    });
});

// Update status when popup opens
requestCountAndUpdate(); 