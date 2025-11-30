# Quick Installation Guide

## Step-by-Step Installation

### 1. Open Chrome Extensions Page
- Open Google Chrome
- Type `chrome://extensions/` in the address bar and press Enter
- OR click the three dots menu (⋮) → More Tools → Extensions

### 2. Enable Developer Mode
- Look for the "Developer mode" toggle in the top-right corner
- Click to enable it (it should turn blue/on)

### 3. Load the Extension
- Click the "Load unpacked" button that appears
- A file browser will open
- Navigate to: `E:\NODEJS\elctron-js-password-manager`
- Click "Select Folder"

### 4. Verify Installation
- You should see "Secure Password Manager" appear in your extensions list
- The extension should show as "Enabled"
- Look for the purple lock icon in your Chrome toolbar

### 5. Pin the Extension (Optional but Recommended)
- Click the puzzle piece icon in Chrome toolbar
- Find "Secure Password Manager"
- Click the pin icon to keep it visible

## Testing the Extension

### Test 1: Save a Password
1. Visit any website with a login form (e.g., https://example.com or create a test HTML page)
2. Enter a username and password
3. Submit the form
4. Look for a save prompt in the top-right corner
5. Click "Save"

### Test 2: View Saved Passwords
1. Click the extension icon in your toolbar
2. You should see the popup with your saved credentials
3. Click the menu icon (☰) to open the dashboard

### Test 3: Autofill
1. Reload the login page
2. Click on the username field
3. A dropdown should appear with your saved account
4. Click it to autofill

## Troubleshooting

### Extension Not Loading?
- Make sure you selected the correct folder (the one containing `manifest.json`)
- Check that all files are present
- Look for errors in the extension card

### No Save Prompt Appearing?
- Check if the content script is loading (open DevTools → Console)
- Make sure the page has password fields
- Try refreshing the page

### Popup Not Working?
- Right-click the extension icon → Inspect Popup
- Check the console for errors
- Make sure storage permissions are granted

### Icons Not Showing?
- The icons should be in `src/icons/` folder
- If missing, the extension will still work but show a default icon

## Next Steps

Once installed, you can:
1. **Add passwords manually** via the dashboard
2. **Import existing passwords** (if you implement import feature)
3. **Customize settings** (if you add a settings page)
4. **Test on different websites** to ensure compatibility

## Uninstalling

To remove the extension:
1. Go to `chrome://extensions/`
2. Find "Secure Password Manager"
3. Click "Remove"
4. Confirm removal

---

**Need Help?** Check the main README.md for detailed documentation.
