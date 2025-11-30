// Background service worker

chrome.runtime.onInstalled.addListener(() => {
    console.log('Password Manager Extension Installed');

    // Initialize storage if needed
    chrome.storage.local.get(['credentials'], (data) => {
        if (!data.credentials) {
            chrome.storage.local.set({ credentials: {} });
        }
    });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openOptions') {
        chrome.runtime.openOptionsPage();
    }

    return true;
});
