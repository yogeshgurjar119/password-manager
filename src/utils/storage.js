// Storage utility functions for managing credentials

/**
 * Get the domain from a URL
 */
export function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
}

/**
 * Save a credential for a specific domain
 */
export async function saveCredential(domain, username, password) {
  const data = await chrome.storage.local.get(['credentials']);
  const credentials = data.credentials || {};
  
  if (!credentials[domain]) {
    credentials[domain] = [];
  }
  
  // Check if credential already exists
  const existingIndex = credentials[domain].findIndex(
    cred => cred.username === username
  );
  
  if (existingIndex !== -1) {
    // Update existing credential
    credentials[domain][existingIndex] = {
      username,
      password,
      lastUsed: Date.now()
    };
  } else {
    // Add new credential
    credentials[domain].push({
      username,
      password,
      lastUsed: Date.now()
    });
  }
  
  await chrome.storage.local.set({ credentials });
  return true;
}

/**
 * Get all credentials for a specific domain
 */
export async function getCredentials(domain) {
  const data = await chrome.storage.local.get(['credentials']);
  const credentials = data.credentials || {};
  return credentials[domain] || [];
}

/**
 * Get all credentials
 */
export async function getAllCredentials() {
  const data = await chrome.storage.local.get(['credentials']);
  return data.credentials || {};
}

/**
 * Update last used timestamp for a credential
 */
export async function updateLastUsed(domain, username) {
  const data = await chrome.storage.local.get(['credentials']);
  const credentials = data.credentials || {};
  
  if (credentials[domain]) {
    const cred = credentials[domain].find(c => c.username === username);
    if (cred) {
      cred.lastUsed = Date.now();
      await chrome.storage.local.set({ credentials });
    }
  }
}

/**
 * Delete a credential
 */
export async function deleteCredential(domain, username) {
  const data = await chrome.storage.local.get(['credentials']);
  const credentials = data.credentials || {};
  
  if (credentials[domain]) {
    credentials[domain] = credentials[domain].filter(
      cred => cred.username !== username
    );
    
    if (credentials[domain].length === 0) {
      delete credentials[domain];
    }
    
    await chrome.storage.local.set({ credentials });
  }
}

/**
 * Update a credential
 */
export async function updateCredential(domain, oldUsername, newUsername, newPassword) {
  const data = await chrome.storage.local.get(['credentials']);
  const credentials = data.credentials || {};
  
  if (credentials[domain]) {
    const index = credentials[domain].findIndex(c => c.username === oldUsername);
    if (index !== -1) {
      credentials[domain][index] = {
        username: newUsername,
        password: newPassword,
        lastUsed: Date.now()
      };
      await chrome.storage.local.set({ credentials });
      return true;
    }
  }
  return false;
}
