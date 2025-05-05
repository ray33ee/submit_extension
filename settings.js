document.addEventListener('DOMContentLoaded', function() {
    // Back button functionality
    const backButton = document.getElementById('backButton');
    backButton.addEventListener('click', function() {
        window.location.href = 'popup.html';
    });

    // Load saved settings
    chrome.storage.sync.get(['listMode', 'confirmEnable'], function(result) {
        document.getElementById('listModeToggle').checked = result.listMode === 'allowlist';
        document.getElementById('confirmEnable').checked = result.confirmEnable ?? true;
    });

    // Save confirm enable setting to sync storage
    document.getElementById('confirmEnable').addEventListener('change', function(e) {
        chrome.storage.sync.set({ confirmEnable: e.target.checked });
    });

    // URL Management
    const listModeToggle = document.getElementById('listModeToggle');
    const urlListButton = document.getElementById('urlListButton');

    // Save list mode when changed
    listModeToggle.addEventListener('change', function(e) {
        const mode = e.target.checked ? 'allowlist' : 'blocklist';
        chrome.storage.sync.set({ listMode: mode });
    });

    // URL List button click handler
    urlListButton.addEventListener('click', function() {
        window.location.href = 'url-list.html';
    });
}); 