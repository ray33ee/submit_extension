document.addEventListener('DOMContentLoaded', function() {
    // Add a flag to track when actions are in progress
    let actionInProgress = false;
    
    // Debounce function to prevent rapid clicks
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    
    // Back button functionality
    const backButton = document.getElementById('backButton');
    backButton.addEventListener('click', function() {
        if (actionInProgress) return;
        
        actionInProgress = true;
        backButton.disabled = true;
        
        window.location.href = '../settings/settings.html';
        // No need to reset flags as we're navigating away
    });

    // Help modal functionality
    const helpButton = document.getElementById('helpButton');
    const helpModal = document.getElementById('helpModal');
    const closeModal = document.getElementById('closeModal');
    
    helpButton.addEventListener('click', function() {
        helpModal.style.display = 'flex';
    });
    
    closeModal.addEventListener('click', function() {
        helpModal.style.display = 'none';
    });
    
    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === helpModal) {
            helpModal.style.display = 'none';
        }
    });
    
    // Close modal on escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && helpModal.style.display === 'flex') {
            helpModal.style.display = 'none';
        }
    });

    // URL Management
    const urlList = document.getElementById('urlList');
    const listModeDisplay = document.getElementById('listModeDisplay');
    let currentEditingElement = null;

    // Load saved settings with explicit default for listMode
    chrome.storage.sync.get(['listMode', 'urlList'], function(result) {
        // Explicitly set default to 'blocklist' if not defined
        const mode = result.listMode || 'blocklist';
        listModeDisplay.textContent = mode === 'allowlist' ? 'Allowlist' : 'Blocklist';
        updateUrlList(result.urlList || []);
    });

    // Function to normalize URL - only converts domain to lowercase
    function normalizeUrl(url) {
        url = url.trim();
        
        // Check if the URL has wildcards (*, ?) or other pattern characters
        if (url.includes('*') || url.includes('?')) {
            // For wildcard patterns, just trim and return
            return url;
        }
        
        try {
            // Check if the URL has any scheme
            const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(url);
            
            // Only prepend with a URL scheme if one is not provided
            if (!hasScheme) {
                url = 'http://' + url;
            }
            
            // For URLs that can be parsed with URL constructor
            try {
                const urlObj = new URL(url);
                
                // Convert only the hostname to lowercase
                urlObj.hostname = urlObj.hostname.toLowerCase();
                
                return urlObj.toString();
            } catch (e) {
                // If URL parsing fails, return the original with just the scheme added
                return url;
            }
        } catch (e) {
            // If anything goes wrong, return the original URL with http:// if needed
            return hasScheme ? url : 'http://' + url;
        }
    }

    // Add URL
    function addUrl(url) {
        if (!url) return;
        
        // Normalize the URL - only domain to lowercase
        url = normalizeUrl(url);

        chrome.storage.sync.get(['urlList'], function(result) {
            const urls = result.urlList || [];
            
            // Case-insensitive check to avoid duplicates
            const urlExists = urls.some(existingUrl => {
                // Check if either URL contains wildcards
                if (existingUrl.includes('*') || existingUrl.includes('?') || 
                    url.includes('*') || url.includes('?')) {
                    // For wildcard patterns, do a simple case-insensitive comparison
                    return existingUrl.toLowerCase() === url.toLowerCase();
                }
                
                try {
                    const existingUrlObj = new URL(existingUrl);
                    const newUrlObj = new URL(url);
                    
                    // Compare hostnames case-insensitive, and the rest of the URL case-sensitive
                    return existingUrlObj.hostname.toLowerCase() === newUrlObj.hostname.toLowerCase() &&
                           existingUrlObj.pathname === newUrlObj.pathname &&
                           existingUrlObj.search === newUrlObj.search &&
                           existingUrlObj.hash === newUrlObj.hash;
                } catch (e) {
                    // Fallback to simple equality if URL parsing fails
                    return existingUrl === url;
                }
            });
            
            if (!urlExists) {
                urls.push(url);
                chrome.storage.sync.set({ urlList: urls }, function() {
                    updateUrlList(urls);
                });
            }
        });
    }

    // Remove URL
    function removeUrl(url) {
        chrome.storage.sync.get(['urlList'], function(result) {
            const urls = result.urlList || [];
            const index = urls.indexOf(url);
            if (index > -1) {
                urls.splice(index, 1);
                chrome.storage.sync.set({ urlList: urls }, function() {
                    updateUrlList(urls);
                });
            }
        });
    }

    // Add a function to safely escape HTML
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Start editing a URL
    function startEdit(element, url) {
        // If already editing another element, save that edit first
        if (currentEditingElement && currentEditingElement !== element) {
            finishEdit(currentEditingElement);
        }

        // Mark this element as being edited
        currentEditingElement = element;
        
        // Create an input field
        const input = document.createElement('input');
        input.type = 'text';
        input.value = url;
        input.className = 'edit-url-input';
        
        // Replace the text with the input
        const textSpan = element.querySelector('.url-text');
        // Clear the text span safely
        while (textSpan.firstChild) {
            textSpan.removeChild(textSpan.firstChild);
        }
        textSpan.appendChild(input);
        
        // Add edit controls - create DOM elements instead of using innerHTML
        const actionsDiv = element.querySelector('.url-actions');
        // Clear existing content
        while (actionsDiv.firstChild) {
            actionsDiv.removeChild(actionsDiv.firstChild);
        }
        
        // Create save button
        const saveButton = document.createElement('button');
        saveButton.className = 'save-url-button';
        saveButton.title = 'Save URL';
        saveButton.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>';
        actionsDiv.appendChild(saveButton);
        
        // Create cancel button
        const cancelButton = document.createElement('button');
        cancelButton.className = 'cancel-edit-button';
        cancelButton.title = 'Cancel';
        cancelButton.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
        actionsDiv.appendChild(cancelButton);
        
        // Add event listeners
        saveButton.addEventListener('click', () => finishEdit(element));
        cancelButton.addEventListener('click', () => cancelEdit(element, url));
        
        // Add key listeners to input
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                finishEdit(element);
            } else if (e.key === 'Escape') {
                cancelEdit(element, url);
            }
        });
        
        // Focus the input
        input.focus();
    }

    // Finish editing and save
    function finishEdit(element) {
        const input = element.querySelector('.edit-url-input');
        const newUrl = input.value.trim();
        
        if (newUrl) {
            // Normalize the URL - only domain to lowercase
            let normalizedUrl = normalizeUrl(newUrl);
            
            // Get the old URL
            const oldUrl = element.getAttribute('data-url');
            
            // Update URLs list
            chrome.storage.sync.get(['urlList'], function(result) {
                const urls = result.urlList || [];
                const index = urls.indexOf(oldUrl);
                
                if (index > -1) {
                    urls[index] = normalizedUrl;
                    chrome.storage.sync.set({ urlList: urls }, function() {
                        updateUrlList(urls);
                    });
                }
            });
        }
        
        // No longer editing
        currentEditingElement = null;
    }

    // Cancel edit
    function cancelEdit(element, originalUrl) {
        // Re-render the URL list
        chrome.storage.sync.get(['urlList'], function(result) {
            updateUrlList(result.urlList || []);
        });
        
        // No longer editing
        currentEditingElement = null;
    }

    // Update URL list display
    function updateUrlList(urls) {
        // Clear existing content
        while (urlList.firstChild) {
            urlList.removeChild(urlList.firstChild);
        }
        
        // Add URL items if any exist
        if (urls.length > 0) {
            urls.forEach((url, index) => {
                // Create URL item container
                const urlItem = document.createElement('div');
                urlItem.className = 'url-item';
                urlItem.setAttribute('data-url', escapeHTML(url));
                
                // Create text span
                const textSpan = document.createElement('span');
                textSpan.className = 'url-text';
                textSpan.textContent = url; // textContent is safe from XSS
                urlItem.appendChild(textSpan);
                
                // Create actions div
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'url-actions';
                
                // Create edit button
                const editButton = document.createElement('button');
                editButton.className = 'edit-url-button';
                editButton.title = 'Edit URL';
                editButton.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
                actionsDiv.appendChild(editButton);
                
                // Create remove button
                const removeButton = document.createElement('button');
                removeButton.className = 'remove-url-button';
                removeButton.title = 'Remove URL';
                removeButton.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
                actionsDiv.appendChild(removeButton);
                
                urlItem.appendChild(actionsDiv);
                urlList.appendChild(urlItem);
                
                // Add event listeners
                editButton.addEventListener('click', () => {
                    startEdit(urlItem, url);
                });
                
                removeButton.addEventListener('click', () => {
                    removeUrl(url);
                });
                
                textSpan.addEventListener('dblclick', () => {
                    startEdit(urlItem, url);
                });
            });
        }
        
        // Create "Add new URL" item
        const addUrlItem = document.createElement('div');
        addUrlItem.className = 'add-url-item';
        
        // Create input
        const addUrlInput = document.createElement('input');
        addUrlInput.type = 'text';
        addUrlInput.className = 'add-url-input';
        addUrlInput.placeholder = 'Enter new URL (e.g., example.com)';
        addUrlItem.appendChild(addUrlInput);
        
        // Create actions div
        const addActionDiv = document.createElement('div');
        addActionDiv.className = 'url-actions';
        
        // Create save button
        const addButton = document.createElement('button');
        addButton.className = 'save-url-button';
        addButton.title = 'Add URL';
        addButton.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>';
        addActionDiv.appendChild(addButton);
        
        addUrlItem.appendChild(addActionDiv);
        urlList.appendChild(addUrlItem);
        
        // Add event listeners
        addButton.addEventListener('click', () => {
            addUrl(addUrlInput.value);
            addUrlInput.value = '';
            addUrlInput.focus();
        });
        
        addUrlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                addUrl(addUrlInput.value);
                addUrlInput.value = '';
            }
        });
    }

    // Listen for storage changes
    chrome.storage.onChanged.addListener(function(changes, namespace) {
        if (namespace === 'sync' && changes.listMode) {
            listModeDisplay.textContent = changes.listMode.newValue === 'allowlist' ? 'Allowlist' : 'Blocklist';
        }
    });
}); 