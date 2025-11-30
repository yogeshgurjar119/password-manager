import { getAllCredentials, saveCredential, deleteCredential, updateCredential } from '../utils/storage.js';

let allCredentials = {};
let currentView = 'all';
let editingDomain = null;
let editingUsername = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadAllCredentials();
    setupEventListeners();
});

// Load all credentials
async function loadAllCredentials() {
    allCredentials = await getAllCredentials();
    updateStats();
    renderPasswords();
}

// Update statistics
function updateStats() {
    const domains = Object.keys(allCredentials);
    const totalAccounts = domains.reduce((sum, domain) => sum + allCredentials[domain].length, 0);

    document.getElementById('siteCount').textContent = domains.length;
    document.getElementById('accountCount').textContent = totalAccounts;
    document.getElementById('totalCount').textContent = totalAccounts;
}

// Render passwords
function renderPasswords() {
    const passwordsList = document.getElementById('passwordsList');
    const emptyState = document.getElementById('emptyState');

    const domains = Object.keys(allCredentials);

    if (domains.length === 0) {
        passwordsList.style.display = 'none';
        emptyState.classList.add('show');
        return;
    }

    passwordsList.style.display = 'grid';
    emptyState.classList.remove('show');

    // Filter based on current view
    let filteredDomains = domains;
    if (currentView === 'recent') {
        // Sort by most recently used
        filteredDomains = domains.sort((a, b) => {
            const aMax = Math.max(...allCredentials[a].map(c => c.lastUsed || 0));
            const bMax = Math.max(...allCredentials[b].map(c => c.lastUsed || 0));
            return bMax - aMax;
        });
    }

    passwordsList.innerHTML = filteredDomains.map(domain => {
        const accounts = allCredentials[domain];
        const initial = domain.charAt(0).toUpperCase();

        return `
      <div class="password-card" data-domain="${escapeHtml(domain)}">
        <div class="card-header">
          <div class="site-favicon">${initial}</div>
          <div class="card-info">
            <div class="site-name">${escapeHtml(domain)}</div>
            <div class="account-count">${accounts.length} account${accounts.length > 1 ? 's' : ''}</div>
          </div>
          <div class="card-actions">
            <button class="action-btn add-account-btn" title="Add account" data-domain="${escapeHtml(domain)}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="accounts-list">
          ${accounts.map(account => {
            const avatarInitial = account.username.charAt(0).toUpperCase();
            const lastUsed = account.lastUsed ? formatLastUsed(account.lastUsed) : 'Never used';

            return `
              <div class="account-item" data-username="${escapeHtml(account.username)}">
                <div class="account-avatar">${avatarInitial}</div>
                <div class="account-details">
                  <div class="account-username">${escapeHtml(account.username)}</div>
                  <div class="account-last-used">${lastUsed}</div>
                </div>
                <div class="account-actions">
                  <button class="account-btn copy-btn" title="Copy password" data-password="${escapeHtml(account.password)}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.602-1.43L16.083 2.57A2 2 0 0014.685 2H10a2 2 0 00-2 2z" stroke="currentColor" stroke-width="2"/>
                      <path d="M16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </button>
                  <button class="account-btn edit-btn" title="Edit" data-domain="${escapeHtml(domain)}" data-username="${escapeHtml(account.username)}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </button>
                  <button class="account-btn delete-btn" title="Delete" data-domain="${escapeHtml(domain)}" data-username="${escapeHtml(account.username)}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            `;
        }).join('')}
        </div>
      </div>
    `;
    }).join('');

    // Add event listeners
    attachCardEventListeners();
}

// Attach event listeners to cards
function attachCardEventListeners() {
    // Copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const password = btn.dataset.password;
            await copyToClipboard(password);

            // Visual feedback
            const originalHTML = btn.innerHTML;
            btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;
            setTimeout(() => {
                btn.innerHTML = originalHTML;
            }, 1500);
        });
    });

    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const domain = btn.dataset.domain;
            const username = btn.dataset.username;
            openEditModal(domain, username);
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const domain = btn.dataset.domain;
            const username = btn.dataset.username;

            if (confirm(`Delete password for ${username} on ${domain}?`)) {
                await deleteCredential(domain, username);
                await loadAllCredentials();
            }
        });
    });

    // Add account buttons
    document.querySelectorAll('.add-account-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const domain = btn.dataset.domain;
            openAddModal(domain);
        });
    });
}

// Open add modal
function openAddModal(domain = '') {
    editingDomain = null;
    editingUsername = null;

    document.getElementById('modalTitle').textContent = 'Add New Password';
    document.getElementById('website').value = domain;
    document.getElementById('usernameModal').value = '';
    document.getElementById('passwordModal').value = '';
    document.getElementById('website').disabled = !!domain;
    document.getElementById('passwordModal').type = 'password';

    document.getElementById('passwordModal').classList.add('show');
}

// Open edit modal
function openEditModal(domain, username) {
    const credential = allCredentials[domain]?.find(c => c.username === username);
    if (!credential) return;

    editingDomain = domain;
    editingUsername = username;

    document.getElementById('modalTitle').textContent = 'Edit Password';
    document.getElementById('website').value = domain;
    document.getElementById('usernameModal').value = username;
    document.getElementById('passwordModal').value = credential.password;
    document.getElementById('website').disabled = true;
    document.getElementById('passwordModal').type = 'text'; // Show password when editing

    document.getElementById('passwordModal').classList.add('show');
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            currentView = item.dataset.view;
            renderPasswords();
        });
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        filterPasswords(query);
    });

    // Add password buttons
    document.getElementById('addPasswordBtn').addEventListener('click', () => openAddModal());
    document.getElementById('addFirstPasswordBtn').addEventListener('click', () => openAddModal());

    // Modal close
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);

    // Toggle password
    document.getElementById('togglePasswordModal').addEventListener('click', () => {
        const passwordInput = document.getElementById('passwordModal');
        passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    });

    // Generate password
    document.getElementById('generatePassword').addEventListener('click', () => {
        const password = generateRandomPassword();
        document.getElementById('passwordModal').value = password;
        document.getElementById('passwordModal').type = 'text';
    });

    // Form submit
    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const domain = document.getElementById('website').value.trim();
        const username = document.getElementById('usernameModal').value.trim();
        const password = document.getElementById('passwordModal').value;

        if (domain && username && password) {
            if (editingDomain && editingUsername) {
                // Update existing
                if (editingDomain !== domain) {
                    // Domain changed - delete old and create new
                    await deleteCredential(editingDomain, editingUsername);
                    await saveCredential(domain, username, password);
                } else {
                    // Same domain - update
                    await updateCredential(domain, editingUsername, username, password);
                }
            } else {
                // Create new
                await saveCredential(domain, username, password);
            }

            closeModal();
            await loadAllCredentials();
        }
    });

    // Close modal on background click
    document.getElementById('passwordModal').addEventListener('click', (e) => {
        if (e.target.id === 'passwordModal') {
            closeModal();
        }
    });
}

// Filter passwords
function filterPasswords(query) {
    if (!query) {
        renderPasswords();
        return;
    }

    const cards = document.querySelectorAll('.password-card');
    cards.forEach(card => {
        const domain = card.dataset.domain.toLowerCase();
        const accountItems = card.querySelectorAll('.account-item');
        let hasMatch = false;

        if (domain.includes(query)) {
            hasMatch = true;
            accountItems.forEach(item => item.style.display = 'flex');
        } else {
            accountItems.forEach(item => {
                const username = item.dataset.username.toLowerCase();
                if (username.includes(query)) {
                    item.style.display = 'flex';
                    hasMatch = true;
                } else {
                    item.style.display = 'none';
                }
            });
        }

        card.style.display = hasMatch ? 'block' : 'none';
    });
}

// Close modal
function closeModal() {
    document.getElementById('passwordModal').classList.remove('show');
    document.getElementById('website').disabled = false;
}

// Generate random password
function generateRandomPassword(length = 16) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const all = uppercase + lowercase + numbers + symbols;
    let password = '';

    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest
    for (let i = password.length; i < length; i++) {
        password += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (error) {
        console.error('Error copying to clipboard:', error);
    }
}

// Format last used
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
