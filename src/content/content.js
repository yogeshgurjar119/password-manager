// Content script for detecting and autofilling login forms

let passwordFields = [];
let detectedForms = new Set();

// Initialize
init();

function init() {
    // Scan page for login forms
    scanForLoginForms();

    // Monitor DOM changes
    const observer = new MutationObserver(() => {
        scanForLoginForms();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Monitor form submissions
    monitorFormSubmissions();
}

// Scan for login forms
function scanForLoginForms() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    passwordInputs.forEach(passwordField => {
        if (passwordFields.includes(passwordField)) {
            return; // Already processed
        }

        passwordFields.push(passwordField);

        // Find associated username field
        const usernameField = findUsernameField(passwordField);

        if (usernameField) {
            addAutofillButton(usernameField, passwordField);
        }
    });
}

// Find username field associated with password field
function findUsernameField(passwordField) {
    const form = passwordField.closest('form');

    // Common selectors for username/email fields
    const selectors = [
        'input[type="text"]',
        'input[type="email"]',
        'input[name*="user"]',
        'input[name*="email"]',
        'input[name*="login"]',
        'input[id*="user"]',
        'input[id*="email"]',
        'input[id*="login"]',
        'input[autocomplete="username"]',
        'input[autocomplete="email"]'
    ];

    // Try to find in same form
    if (form) {
        for (const selector of selectors) {
            const field = form.querySelector(selector);
            if (field && field !== passwordField) {
                return field;
            }
        }
    }

    // Try to find nearby (before password field)
    const allInputs = Array.from(document.querySelectorAll('input'));
    const passwordIndex = allInputs.indexOf(passwordField);

    for (let i = passwordIndex - 1; i >= 0; i--) {
        const input = allInputs[i];
        if (input.type === 'text' || input.type === 'email') {
            return input;
        }
    }

    return null;
}

// Add autofill button to username field
function addAutofillButton(usernameField, passwordField) {
    // Check if button already exists
    if (usernameField.dataset.pmEnhanced) {
        return;
    }

    usernameField.dataset.pmEnhanced = 'true';

    // Create button container
    const button = document.createElement('div');
    button.className = 'pm-autofill-btn';
    button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zm3 8H9V7c0-1.654 1.346-3 3-3s3 1.346 3 3v3z" fill="currentColor"/>
    </svg>
  `;

    // Position button
    const rect = usernameField.getBoundingClientRect();
    const parent = usernameField.offsetParent || document.body;

    // Make parent position relative if needed
    const parentPosition = window.getComputedStyle(parent).position;
    if (parentPosition === 'static') {
        parent.style.position = 'relative';
    }

    button.style.position = 'absolute';
    button.style.top = `${usernameField.offsetTop + (usernameField.offsetHeight - 32) / 2}px`;
    button.style.left = `${usernameField.offsetLeft + usernameField.offsetWidth - 40}px`;

    parent.appendChild(button);

    // Button click handler
    button.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await showAccountSelector(button, usernameField, passwordField);
    });

    // Focus handler
    usernameField.addEventListener('focus', async () => {
        const domain = getDomain(window.location.href);
        const credentials = await getStoredCredentials(domain);

        if (credentials.length > 0) {
            await showAccountSelector(button, usernameField, passwordField);
        }
    });
}

// Show account selector dropdown
async function showAccountSelector(button, usernameField, passwordField) {
    // Remove existing dropdown
    const existing = document.querySelector('.pm-dropdown');
    if (existing) {
        existing.remove();
    }

    const domain = getDomain(window.location.href);
    const credentials = await getStoredCredentials(domain);

    if (credentials.length === 0) {
        return;
    }

    // Create dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'pm-dropdown';

    dropdown.innerHTML = `
    <div class="pm-dropdown-header">
      <span>Choose an account</span>
      <button class="pm-close-btn">×</button>
    </div>
    <div class="pm-dropdown-list">
      ${credentials.map((cred, index) => `
        <div class="pm-dropdown-item" data-index="${index}">
          <div class="pm-account-avatar">${cred.username.charAt(0).toUpperCase()}</div>
          <div class="pm-account-info">
            <div class="pm-account-username">${escapeHtml(cred.username)}</div>
            <div class="pm-account-domain">${domain}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

    // Position dropdown
    const buttonRect = button.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${buttonRect.bottom + 8}px`;
    dropdown.style.left = `${buttonRect.left - 280}px`;

    document.body.appendChild(dropdown);

    // Close button
    dropdown.querySelector('.pm-close-btn').addEventListener('click', () => {
        dropdown.remove();
    });

    // Account selection
    dropdown.querySelectorAll('.pm-dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            const credential = credentials[index];

            // Fill fields
            usernameField.value = credential.username;
            passwordField.value = credential.password;

            // Trigger events
            usernameField.dispatchEvent(new Event('input', { bubbles: true }));
            usernameField.dispatchEvent(new Event('change', { bubbles: true }));
            passwordField.dispatchEvent(new Event('input', { bubbles: true }));
            passwordField.dispatchEvent(new Event('change', { bubbles: true }));

            // Update last used
            updateLastUsed(domain, credential.username);

            dropdown.remove();
        });
    });

    // Close on outside click
    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && e.target !== button) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 100);
}

// Monitor form submissions to save credentials
function monitorFormSubmissions() {
    document.addEventListener('submit', async (e) => {
        const form = e.target;

        if (detectedForms.has(form)) {
            return;
        }

        const passwordField = form.querySelector('input[type="password"]');
        if (!passwordField || !passwordField.value) {
            return;
        }

        const usernameField = findUsernameField(passwordField);
        if (!usernameField || !usernameField.value) {
            return;
        }

        detectedForms.add(form);

        const domain = getDomain(window.location.href);
        const username = usernameField.value;
        const password = passwordField.value;

        // Check if credential already exists
        const credentials = await getStoredCredentials(domain);
        const exists = credentials.some(cred => cred.username === username);

        if (!exists) {
            // Show save prompt
            showSavePrompt(domain, username, password);
        }
    }, true);
}

// Show save credential prompt
function showSavePrompt(domain, username, password) {
    // Remove existing prompt
    const existing = document.querySelector('.pm-save-prompt');
    if (existing) {
        existing.remove();
    }

    const prompt = document.createElement('div');
    prompt.className = 'pm-save-prompt';
    prompt.innerHTML = `
    <div class="pm-prompt-content">
      <div class="pm-prompt-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zm3 8H9V7c0-1.654 1.346-3 3-3s3 1.346 3 3v3z" fill="currentColor"/>
        </svg>
      </div>
      <div class="pm-prompt-text">
        <div class="pm-prompt-title">Save password?</div>
        <div class="pm-prompt-subtitle">Save password for ${escapeHtml(username)} on ${domain}</div>
      </div>
      <div class="pm-prompt-actions">
        <button class="pm-btn-secondary" id="pmDismiss">Not now</button>
        <button class="pm-btn-primary" id="pmSave">Save</button>
      </div>
    </div>
  `;

    document.body.appendChild(prompt);

    // Save button
    prompt.querySelector('#pmSave').addEventListener('click', async () => {
        await saveCredential(domain, username, password);
        prompt.classList.add('pm-fade-out');
        setTimeout(() => prompt.remove(), 300);
    });

    // Dismiss button
    prompt.querySelector('#pmDismiss').addEventListener('click', () => {
        prompt.classList.add('pm-fade-out');
        setTimeout(() => prompt.remove(), 300);
    });

    // Auto dismiss after 10 seconds
    setTimeout(() => {
        if (document.body.contains(prompt)) {
            prompt.classList.add('pm-fade-out');
            setTimeout(() => prompt.remove(), 300);
        }
    }, 10000);
}

// Helper functions
function getDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch (e) {
        return url;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function getStoredCredentials(domain) {
    return new Promise((resolve) => {
        try {
            if (!chrome || !chrome.storage || !chrome.storage.local) {
                console.warn('Chrome storage API not available');
                resolve([]);
                return;
            }

            chrome.storage.local.get(['credentials'], (data) => {
                if (chrome.runtime.lastError) {
                    console.error('Storage error:', chrome.runtime.lastError);
                    resolve([]);
                    return;
                }
                const credentials = data.credentials || {};
                resolve(credentials[domain] || []);
            });
        } catch (error) {
            console.error('Error getting credentials:', error);
            resolve([]);
        }
    });
}

async function saveCredential(domain, username, password) {
    return new Promise((resolve) => {
        try {
            if (!chrome || !chrome.storage || !chrome.storage.local) {
                console.warn('Chrome storage API not available');
                resolve(false);
                return;
            }

            chrome.storage.local.get(['credentials'], (data) => {
                if (chrome.runtime.lastError) {
                    console.error('Storage error:', chrome.runtime.lastError);
                    resolve(false);
                    return;
                }

                const credentials = data.credentials || {};

                if (!credentials[domain]) {
                    credentials[domain] = [];
                }

                const existingIndex = credentials[domain].findIndex(
                    cred => cred.username === username
                );

                if (existingIndex !== -1) {
                    // Update existing - keep old password for comparison
                    const oldPassword = credentials[domain][existingIndex].password;
                    credentials[domain][existingIndex] = {
                        username,
                        password,
                        lastUsed: Date.now(),
                        previousPassword: oldPassword !== password ? oldPassword : undefined
                    };
                } else {
                    credentials[domain].push({
                        username,
                        password,
                        lastUsed: Date.now()
                    });
                }

                chrome.storage.local.set({ credentials }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Storage error:', chrome.runtime.lastError);
                        resolve(false);
                        return;
                    }
                    resolve(true);
                });
            });
        } catch (error) {
            console.error('Error saving credential:', error);
            resolve(false);
        }
    });
}

async function updateLastUsed(domain, username) {
    return new Promise((resolve) => {
        try {
            if (!chrome || !chrome.storage || !chrome.storage.local) {
                resolve(false);
                return;
            }

            chrome.storage.local.get(['credentials'], (data) => {
                if (chrome.runtime.lastError) {
                    resolve(false);
                    return;
                }

                const credentials = data.credentials || {};

                if (credentials[domain]) {
                    const cred = credentials[domain].find(c => c.username === username);
                    if (cred) {
                        cred.lastUsed = Date.now();
                        chrome.storage.local.set({ credentials }, () => {
                            resolve(!chrome.runtime.lastError);
                        });
                    } else {
                        resolve(false);
                    }
                } else {
                    resolve(false);
                }
            });
        } catch (error) {
            console.error('Error updating last used:', error);
            resolve(false);
        }
    });
}
