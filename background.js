// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateBadge') {
        const text = request.count > 0 ? request.count.toString() : '';
        chrome.action.setBadgeText({
            text: text,
            tabId: sender.tab.id
        });
        if (request.count > 0) {
            // Set badge background color to #666666 and text color to white
            chrome.action.setBadgeBackgroundColor({
                color: '#666666',
                tabId: sender.tab.id
            });
            chrome.action.setBadgeTextColor && chrome.action.setBadgeTextColor({
                color: '#FFFFFF',
                tabId: sender.tab.id
            });
        }
    }
}); 