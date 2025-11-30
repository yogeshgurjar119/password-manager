// Authentication logic for master password

// Simple encryption/decryption (for demo - use proper encryption in production)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Check if user is already set up
async function checkSetup() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['userProfile', 'isAuthenticated'], (data) => {
            resolve({
                hasProfile: !!data.userProfile,
                isAuthenticated: !!data.isAuthenticated,
                profile: data.userProfile
            });
        });
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    const status = await checkSetup();

    if (!status.hasProfile) {
        // Show setup view
        document.getElementById('setupView').classList.add('active');
        setupSetupForm();
    } else if (!status.isAuthenticated) {
        // Show login view
        document.getElementById('loginView').classList.add('active');
        displayUserProfile(status.profile);
        setupLoginForm();
    } else {
        // Already authenticated, redirect to popup
        window.location.href = '../popup/index.html';
    }
});

// Setup form handler
function setupSetupForm() {
    const form = document.getElementById('setupForm');
    const errorDiv = document.getElementById('errorMessage');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDiv.classList.remove('show');

        const name = document.getElementById('setupName').value.trim();
        const email = document.getElementById('setupEmail').value.trim();
        const password = document.getElementById('setupPassword').value;
        const confirmPassword = document.getElementById('setupConfirmPassword').value;

        // Validation
        if (password.length < 8) {
            errorDiv.textContent = 'Master password must be at least 8 characters long';
            errorDiv.classList.add('show');
            return;
        }

        if (password !== confirmPassword) {
            errorDiv.textContent = 'Passwords do not match';
            errorDiv.classList.add('show');
            return;
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user profile
        const userProfile = {
            name,
            email,
            passwordHash,
            createdAt: Date.now()
        };

        // Save to storage
        chrome.storage.local.set({
            userProfile,
            isAuthenticated: true,
            credentials: {} // Initialize empty credentials
        }, () => {
            // Redirect to popup
            window.location.href = '../popup/index.html';
        });
    });
}

// Login form handler
function setupLoginForm() {
    const form = document.getElementById('loginForm');
    const errorDiv = document.getElementById('loginError');
    const successDiv = document.getElementById('loginSuccess');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDiv.classList.remove('show');
        successDiv.classList.remove('show');

        const password = document.getElementById('loginPassword').value;

        // Get stored profile
        chrome.storage.local.get(['userProfile'], async (data) => {
            if (!data.userProfile) {
                errorDiv.textContent = 'User profile not found';
                errorDiv.classList.add('show');
                return;
            }

            const passwordHash = await hashPassword(password);

            if (passwordHash === data.userProfile.passwordHash) {
                // Correct password
                successDiv.textContent = 'Authentication successful!';
                successDiv.classList.add('show');

                chrome.storage.local.set({ isAuthenticated: true }, () => {
                    setTimeout(() => {
                        window.location.href = '../popup/index.html';
                    }, 500);
                });
            } else {
                // Wrong password
                errorDiv.textContent = 'Incorrect master password';
                errorDiv.classList.add('show');
                document.getElementById('loginPassword').value = '';
                document.getElementById('loginPassword').focus();
            }
        });
    });
}

// Display user profile
function displayUserProfile(profile) {
    if (!profile) return;

    const initial = profile.name.charAt(0).toUpperCase();
    document.getElementById('userAvatar').textContent = initial;
    document.getElementById('userName').textContent = profile.name;
    document.getElementById('userEmail').textContent = profile.email;
}
