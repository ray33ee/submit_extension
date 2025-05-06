// Function to create disabled button replacement
function createDisabledButton(originalButton, buttonId) {
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
    
    // Create balloon tooltip function
    disabledDiv.addEventListener('click', (e) => {
        // Remove any existing tooltips first
        const existingTooltips = document.querySelectorAll('.submit-disabled-tooltip');
        existingTooltips.forEach(tooltip => removeTooltip(tooltip));
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'submit-disabled-tooltip';
        tooltip.textContent = 'This button is disabled by the Submit Button Disabler extension. Click the extension icon to enable or find more information on the extension.';
        
        // Position the tooltip near the click
        const buttonRect = disabledDiv.getBoundingClientRect();
        const tooltipWidth = 250; // Match the maxWidth we'll set below
        
        // Calculate position to center the tooltip above the button
        const leftPosition = buttonRect.left + (buttonRect.width / 2) - (tooltipWidth / 2);
        // Make sure the tooltip stays within the viewport
        const adjustedLeft = Math.max(10, Math.min(leftPosition, window.innerWidth - tooltipWidth - 10));
        
        // Add tooltip to DOM first so we can measure its height
        document.body.appendChild(tooltip);
        
        // Style the tooltip
        Object.assign(tooltip.style, {
            position: 'fixed',
            left: `${adjustedLeft}px`,
            backgroundColor: '#333',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            zIndex: '9999',
            width: 'auto',
            maxWidth: `${tooltipWidth}px`,
            fontSize: '14px',
            textAlign: 'center',
            opacity: '0', // Start transparent for animation
            pointerEvents: 'none' // Allows clicking through the tooltip
        });
        
        // Get tooltip height after styling and position it so the bottom of tooltip aligns with top of button
        const tooltipHeight = tooltip.offsetHeight;
        tooltip.style.top = `${buttonRect.top + window.scrollY - tooltipHeight - 10}px`; // 10px for the arrow
        
        // Add animation class after position is set
        requestAnimationFrame(() => {
            tooltip.style.opacity = '1';
            tooltip.style.transition = 'opacity 0.3s, transform 0.3s';
            tooltip.style.transform = 'translateY(0)';
        });
        
        // Calculate arrow position to point at the center of the button
        const arrowOffset = ((buttonRect.left + buttonRect.width / 2) - adjustedLeft) / tooltipWidth * 100;
        // Keep the arrow within reasonable bounds (5% to 95% of the tooltip width)
        const boundedArrowOffset = Math.min(Math.max(arrowOffset, 5), 95);
        
        // Add animation CSS if it doesn't exist
        if (!document.getElementById('submit-disabled-tooltip-style')) {
            const style = document.createElement('style');
            style.id = 'submit-disabled-tooltip-style';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .submit-disabled-tooltip {
                    animation: fadeIn 0.3s;
                    position: relative;
                }
                .submit-disabled-tooltip:after {
                    content: '';
                    position: absolute;
                    bottom: -10px;
                    left: var(--arrow-left-pos, 50%);
                    margin-left: -5px;
                    border-width: 5px;
                    border-style: solid;
                    border-color: #333 transparent transparent transparent;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Set the arrow position to point at the button
        tooltip.style.setProperty('--arrow-left-pos', `${boundedArrowOffset}%`);
        
        // Function to remove the tooltip with animation
        function removeTooltip(tooltipElement) {
            if (!tooltipElement) return;
            tooltipElement.style.opacity = '0';
            tooltipElement.style.transform = 'translateY(10px)';
            tooltipElement.style.transition = 'opacity 0.3s, transform 0.3s';
            setTimeout(() => tooltipElement.remove(), 300);
        }
        
        // Event listener to close tooltip when clicking elsewhere
        function documentClickHandler(event) {
            // Don't close if clicking on the disabled button
            if (event.target === disabledDiv) return;
            
            // Remove the tooltip and clean up the event listener
            removeTooltip(tooltip);
            document.removeEventListener('click', documentClickHandler);
        }
        
        // Add click event listener to close when clicking elsewhere
        // Use setTimeout to avoid the current click event from triggering it immediately
        setTimeout(() => {
            document.addEventListener('click', documentClickHandler);
        }, 0);
        
        // Auto-remove tooltip after a delay
        const timeoutId = setTimeout(() => {
            removeTooltip(tooltip);
            document.removeEventListener('click', documentClickHandler);
        }, 7000);
        
        // Store the timeout ID on the tooltip so we can cancel it if needed
        tooltip.dataset.timeoutId = timeoutId;
    });
    
    // Set the ID for the disabled div
    disabledDiv.dataset.originalButtonId = buttonId;
    
    return disabledDiv;
}

// Create a storage object to remember buttons we've processed
const processedButtons = new Map();
// Counter for truly sequential IDs
let buttonIdCounter = 0;

// Function to generate a true sequential ID
function generateButtonId(button) {
    // If the button already has our ID, return it
    if (button.dataset.ourButtonId) {
        return button.dataset.ourButtonId;
    }
    
    // Generate a new sequential ID using a counter
    const newId = `submit-btn-${buttonIdCounter++}`;
    
    // Store it on the button for future reference
    button.dataset.ourButtonId = newId;
    
    return newId;
}

// Helper function to get a simplified DOM path for a button
// Not used with sequential IDs, but keeping in case we need to switch back
function getButtonPath(element) {
    return '';
}

// Modified version of isButtonDisabled that uses our tracking
function isButtonDisabled(button) {
    // Generate a unique ID for this button
    const buttonId = generateButtonId(button);
    
    // Check if we've processed this button
    if (processedButtons.has(buttonId)) {
        return true;
    }
    
    // Legacy check - look if it has a data attribute
    if (button.dataset.disabledButtonId) {
        // Remember this button for future checks
        processedButtons.set(buttonId, button.dataset.disabledButtonId);
        return true;
    }
    
    return false;
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

// Modified version of processSubmitButtons that uses our tracking
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

            // Get all potential submit elements (buttons and input[type=submit])
            const potentialSubmitElements = [...document.querySelectorAll('button, input[type=submit]')];
            const submitButtons = [];
            
            // First collect all submit buttons that aren't already disabled
            potentialSubmitElements.forEach(element => {
                if (isSubmitButton(element) && !isButtonDisabled(element)) {
                    submitButtons.push(element);
                }
            });
            
            // Then disable them with sequential IDs
            submitButtons.forEach((button, index) => {
                const buttonId = generateButtonId(button);
                
                // Create the disabled button with the ID
                const disabledButton = createDisabledButton(button, buttonId);
                
                // Replace the button with the disabled div
                button.parentNode.insertBefore(disabledButton, button);
                button.style.display = 'none';
                
                // Store ID on the original button
                button.dataset.disabledButtonId = buttonId;
                
                // Remember this button for future checks
                processedButtons.set(buttonId, buttonId);
            });
            
            updateBadge();
            // Notify popup that processing is complete
            chrome.runtime.sendMessage({ action: 'buttonsProcessed' });
        });
    });
}

// Update the restore function to also use our tracking
function restoreSubmitButtons() {
    // Get all disabled buttons
    const disabledButtons = document.querySelectorAll('.disabled-submit-button');
    
    // Restore each disabled button
    disabledButtons.forEach(disabledButton => {
        const id = disabledButton.dataset.originalButtonId;
        
        // Find any button with this ID
        const originalButton = document.querySelector(`[data-disabled-button-id="${id}"]`);
        
        if (originalButton) {
            // Found the original button, restore it
            originalButton.style.display = '';
            originalButton.removeAttribute('data-disabled-button-id');
            disabledButton.remove();
            
            // Remove from our tracking
            const buttonId = generateButtonId(originalButton);
            processedButtons.delete(buttonId);
        } else {
            // Just remove the disabled placeholder
            disabledButton.remove();
        }
    });
    
    // Final pass: Find any buttons that might have been missed
    document.querySelectorAll('button[data-disabled-button-id], input[data-disabled-button-id]').forEach(element => {
        element.style.display = '';
        
        // Remove from our tracking
        const buttonId = generateButtonId(element);
        processedButtons.delete(buttonId);
        
        element.removeAttribute('data-disabled-button-id');
    });
    
    // Clear all tracking in case we missed anything
    processedButtons.clear();
    
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

// Flag to indicate when our extension is making changes
let isExtensionModifying = false;

// Function to set up MutationObserver to detect page changes
function setupMutationObserver() {
    // Create a MutationObserver instance
    const observer = new MutationObserver((mutations) => {
        // Skip if our extension is currently modifying the DOM
        if (isExtensionModifying) return;
        
        // Check if any mutations are relevant to our extension
        const relevantMutation = mutations.some(mutation => {
            // We care about added nodes that might be submit buttons
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    // Skip non-element nodes like text nodes
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;
                    
                    // Check if the added node is a submit button
                    if ((node.tagName === 'BUTTON' || 
                         (node.tagName === 'INPUT' && node.type === 'submit')) && 
                        isSubmitButton(node)) {
                        return true;
                    }
                    
                    // Check if the added node contains submit buttons
                    if (node.querySelectorAll) {
                        const containsSubmit = node.querySelectorAll('button, input[type=submit]');
                        if (containsSubmit.length > 0) {
                            for (const el of containsSubmit) {
                                if (isSubmitButton(el)) return true;
                            }
                        }
                    }
                }
            }
            return false;
        });
        
        // If we found relevant mutations, reprocess the submit buttons
        if (relevantMutation) {
            chrome.storage.local.get(['extensionEnabled'], (result) => {
                if (result.extensionEnabled !== false) {
                    // Set flag before making modifications
                    isExtensionModifying = true;
                    processSubmitButtons();
                    // Reset flag after a small delay to ensure our changes are complete
                    setTimeout(() => {
                        isExtensionModifying = false;
                    }, 50);
                }
            });
        }
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, {
        childList: true,     // observe direct children
        subtree: true,       // and lower descendants too
        attributes: false,   // don't care about attribute changes
        characterData: false // don't care about text content changes
    });
    
    return observer;
}

// Add a function to observe DOM changes for new buttons and wizard navigation
function setupButtonObserver() {
    const observer = new MutationObserver((mutations) => {
        let shouldProcess = false;
        
        // Look for relevant changes
        for (const mutation of mutations) {
            // Class changes that might show/hide wizard steps
            if (mutation.type === 'attributes' && 
                (mutation.attributeName === 'class' || mutation.attributeName === 'style')) {
                
                // Check if this could be a wizard step becoming active
                if (mutation.target.classList && 
                    (mutation.target.classList.contains('active') || 
                     mutation.target.classList.contains('show') || 
                     mutation.target.classList.contains('current'))) {
                    
                    shouldProcess = true;
                    break;
                }
            }
            
            // New elements added
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;
                    
                    if (isSubmitButton(node)) {
                        shouldProcess = true;
                        break;
                    }
                    
                    // Check for submit buttons in added content
                    if (node.querySelectorAll) {
                        const hasButtons = node.querySelectorAll('button, input[type=submit]');
                        if (hasButtons.length > 0) {
                            shouldProcess = true;
                            break;
                        }
                    }
                }
                
                if (shouldProcess) break;
            }
        }
        
        if (shouldProcess) {
            // Wait a moment for DOM to stabilize
            setTimeout(() => {
                chrome.storage.local.get(['extensionEnabled'], (result) => {
                    if (result.extensionEnabled !== false) {
                        processSubmitButtons();
                    }
                });
            }, 50);
        }
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'display']
    });
    
    return observer;
}

// Process buttons when the page loads
processSubmitButtons();

// Set flag before our extension makes changes
isExtensionModifying = true;

// Modify functions to set/reset the flag
const originalProcessSubmitButtons = processSubmitButtons;
processSubmitButtons = function() {
    isExtensionModifying = true;
    originalProcessSubmitButtons();
    setTimeout(() => {
        isExtensionModifying = false;
    }, 50);
};

const originalRestoreSubmitButtons = restoreSubmitButtons;
restoreSubmitButtons = function() {
    isExtensionModifying = true;
    originalRestoreSubmitButtons();
    setTimeout(() => {
        isExtensionModifying = false;
    }, 50);
};

// Initialize the MutationObserver after the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMutationObserver);
} else {
    setupMutationObserver();
}

// Reset the flag after initial processing
setTimeout(() => {
    isExtensionModifying = false;
}, 50);

// Initialize observer
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupButtonObserver);
} else {
    setupButtonObserver();
} 