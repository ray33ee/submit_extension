document.addEventListener('DOMContentLoaded', function() {
    // Back button functionality
    const backButton = document.getElementById('backButton');
    backButton.addEventListener('click', function() {
        window.location.href = 'popup.html';
    });

    // Load saved settings
    chrome.storage.sync.get(['listMode', 'confirmEnable'], function(result) {
        // Set the appropriate tab based on listMode
        const listMode = result.listMode || 'blocklist';
        setActiveTab(listMode);
        
        document.getElementById('confirmEnable').checked = result.confirmEnable ?? true;
    });

    // Save confirm enable setting to sync storage
    document.getElementById('confirmEnable').addEventListener('change', function(e) {
        chrome.storage.sync.set({ confirmEnable: e.target.checked });
    });

    // URL Management
    const listModeControl = document.getElementById('listModeControl');
    const blocklistTab = document.getElementById('blocklistTab');
    const allowlistTab = document.getElementById('allowlistTab');
    const urlListButton = document.getElementById('urlListButton');

    // Function to set the active tab
    function setActiveTab(mode) {
        // Remove active class from all tabs
        blocklistTab.classList.remove('active');
        allowlistTab.classList.remove('active');
        
        // Add active class to the selected tab
        if (mode === 'allowlist') {
            allowlistTab.classList.add('active');
        } else {
            blocklistTab.classList.add('active');
        }
    }

    // Tab click handler
    listModeControl.addEventListener('click', function(e) {
        const target = e.target;
        if (target.classList.contains('tab-option')) {
            const mode = target.dataset.mode;
            setActiveTab(mode);
            chrome.storage.sync.set({ listMode: mode });
        }
    });

    // URL List button click handler
    urlListButton.addEventListener('click', function() {
        window.location.href = 'url-list.html';
    });
}); 