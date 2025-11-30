import { getDomain, getCredentials, saveCredential, updateLastUsed } from '../utils/storage.js';

let currentDomain = '';

// Check authentication first
async function checkAuth() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['isAuthenticated', 'userProfile'], (data) => {
            if (!data.userProfile) {
                // No user profile, redirect to setup
                window.location.href = '../auth/index.html';
                resolve(false);
            } else if (!data.isAuthenticated) {
                // Not authenticated, redirect to login
                window.location.href = '../auth/index.html';
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    const isAuth = await checkAuth();
    if (!isAuth) return;

    await loadCurrentSite();
    await loadCredentials();
    setupEventListeners();
});

// Load current site information
async function loadCurrentSite() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
            currentDomain = getDomain(tab.url);
            document.getElementById('siteName').textContent = currentDomain;
            document.getElementById('siteUrl').textContent = tab.url;
        } else {
            document.getElementById('siteName').textContent = 'No active site';
            document.getElementById('siteUrl').textContent = '';
        }
    } catch (error) {
        console.error('Error loading current site:', error);
        document.getElementById('siteName').textContent = 'Error loading site';
    }
}

// Load credentials for current site
async function loadCredentials() {
    const credentialsList = document.getElementById('credentialsList');
    const emptyState = document.getElementById('emptyState');
    const accountCount = document.getElementById('accountCount');

    try {
        const credentials = await getCredentials(currentDomain);

        if (credentials.length === 0) {
            credentialsList.style.display = 'none';
            emptyState.classList.add('show');
            accountCount.textContent = '0';
            return;
        }

        credentialsList.style.display = 'flex';
        emptyState.classList.remove('show');
        accountCount.textContent = credentials.length;

        credentialsList.innerHTML = credentials.map((cred, index) => {
            const initial = cred.username.charAt(0).toUpperCase();
            const lastUsed = cred.lastUsed ? formatLastUsed(cred.lastUsed) : 'Never used';

            return `
        <div class="credential-item" data-index="${index}">
          <div class="credential-avatar">${initial}</div>
          <div class="credential-info">
            <div class="credential-username">${escapeHtml(cred.username)}</div>
            <div class="credential-last-used">${lastUsed}</div>
          </div>
          <div class="credential-actions">
            <button class="action-btn copy-btn" title="Copy password" data-password="${escapeHtml(cred.password)}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.602-1.43L16.083 2.57A2 2 0 0014.685 2H10a2 2 0 00-2 2z" stroke="currentColor" stroke-width="2"/>
                <path d="M16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
        </div>
      `;
        }).join('');

        // Add click handlers for credential items
        document.querySelectorAll('.credential-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                if (e.target.closest('.copy-btn')) {
                    return; // Let copy button handle its own click
                }

                const index = parseInt(item.dataset.index);
                const credential = credentials[index];
                await autofillCredential(credential);
            });
        });

        // Add click handlers for copy buttons
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const password = btn.dataset.password;
                await copyToClipboard(password);

                // Visual feedback
                const originalHTML = btn.innerHTML;
                btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        `;
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                }, 1500);
            });
        });

    } catch (error) {
        console.error('Error loading credentials:', error);
    }
}

// Autofill credential
async function autofillCredential(credential) {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (username, password) => {
                // Find username/email field
                const usernameField = document.querySelector('input[type="text"], input[type="email"], input[name*="user"], input[name*="email"], input[id*="user"], input[id*="email"]');
                // Find password field
                const passwordField = document.querySelector('input[type="password"]');

                if (usernameField) {
                    usernameField.value = username;
                    usernameField.dispatchEvent(new Event('input', { bubbles: true }));
                    usernameField.dispatchEvent(new Event('change', { bubbles: true }));
                }

                if (passwordField) {
                    passwordField.value = password;
                    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                    passwordField.dispatchEvent(new Event('change', { bubbles: true }));
                }
            },
            args: [credential.username, credential.password]
        });

        // Update last used
        await updateLastUsed(currentDomain, credential.username);

        // Close popup
        window.close();

    } catch (error) {
        console.error('Error autofilling:', error);
    }
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (error) {
        console.error('Error copying to clipboard:', error);
    }
}

// Format last used timestamp
function formatLastUsed(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Setup event listeners
function setupEventListeners() {
    // Open dashboard
    document.getElementById('openDashboard').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // Add account button
    document.getElementById('addAccountBtn').addEventListener('click', () => {
        document.getElementById('addAccountModal').classList.add('show');
        document.getElementById('username').focus();
    });

    // Close modal
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);

    // Toggle password visibility
    document.getElementById('togglePassword').addEventListener('click', () => {
        const passwordInput = document.getElementById('password');
        passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    });

    // Add account form
    document.getElementById('addAccountForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (username && password) {
            await saveCredential(currentDomain, username, password);
            closeModal();
            await loadCredentials();

            // Clear form
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
        }
    });

    // Close modal on background click
    document.getElementById('addAccountModal').addEventListener('click', (e) => {
        if (e.target.id === 'addAccountModal') {
            closeModal();
        }
    });
}

function closeModal() {
    document.getElementById('addAccountModal').classList.remove('show');
}
