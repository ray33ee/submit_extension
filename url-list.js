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
        
        window.location.href = 'settings.html';
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

    // Load saved settings
    chrome.storage.sync.get(['listMode', 'urlList'], function(result) {
        listModeDisplay.textContent = result.listMode === 'allowlist' ? 'Allowlist' : 'Blocklist';
        updateUrlList(result.urlList || []);
    });

    // Function to normalize URL - only converts domain to lowercase
    function normalizeUrl(url) {
        url = url.trim();
        
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
        textSpan.innerHTML = '';
        textSpan.appendChild(input);
        
        // Add edit controls
        const actionsDiv = element.querySelector('.url-actions');
        actionsDiv.innerHTML = `
            <button class="save-url-button" title="Save URL">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                </svg>
            </button>
            <button class="cancel-edit-button" title="Cancel">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        `;
        
        // Add event listeners
        const saveButton = actionsDiv.querySelector('.save-url-button');
        saveButton.addEventListener('click', () => finishEdit(element));
        
        const cancelButton = actionsDiv.querySelector('.cancel-edit-button');
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
        let content = '';
        
        // Add URL items if any exist
        if (urls.length > 0) {
            content = urls.map(url => `
                <div class="url-item" data-url="${url}">
                    <span class="url-text">${url}</span>
                    <div class="url-actions">
                        <button class="edit-url-button" title="Edit URL">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </button>
                        <button class="remove-url-button" title="Remove URL">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        // Always add the "Add new URL" item
        content += `
            <div class="add-url-item">
                <input type="text" class="add-url-input" placeholder="Enter new URL (e.g., example.com)">
                <div class="url-actions">
                    <button class="save-url-button" title="Add URL">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        urlList.innerHTML = content;

        // Add click handlers for remove buttons
        urlList.querySelectorAll('.url-item .remove-url-button').forEach((button, index) => {
            button.addEventListener('click', () => removeUrl(urls[index]));
        });

        // Add click handlers for edit buttons
        urlList.querySelectorAll('.url-item .edit-url-button').forEach((button, index) => {
            button.addEventListener('click', () => {
                const urlItem = button.closest('.url-item');
                const url = urls[index];
                startEdit(urlItem, url);
            });
        });

        // Add double-click on URL text to edit
        urlList.querySelectorAll('.url-text').forEach((textSpan, index) => {
            textSpan.addEventListener('dblclick', () => {
                const urlItem = textSpan.closest('.url-item');
                const url = urls[index];
                startEdit(urlItem, url);
            });
        });
        
        // Add new URL functionality
        const addUrlInput = urlList.querySelector('.add-url-input');
        const addUrlButton = urlList.querySelector('.add-url-item .save-url-button');
        
        addUrlButton.addEventListener('click', () => {
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