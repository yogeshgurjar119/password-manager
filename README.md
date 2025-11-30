# Chrome Extension Password Manager

A secure and modern password manager Chrome extension that stores credentials locally, offers autofill functionality, and provides a beautiful dashboard for managing your passwords.

## Features

✨ **Modern UI Design**
- Premium gradient design with smooth animations
- Dark sidebar with professional aesthetics
- Glassmorphism effects and micro-interactions

🔐 **Core Functionality**
- **Save Passwords**: Automatically detect login forms and prompt to save credentials
- **Autofill**: One-click autofill with account selection dropdown
- **Multi-Account Support**: Store multiple accounts per website
- **Password Generator**: Generate strong, random passwords
- **Search & Filter**: Quickly find saved passwords
- **Dashboard**: Full-featured management interface

🎯 **User Experience**
- Popup for quick access to current site credentials
- Content script that detects login forms automatically
- Account selector dropdown when multiple accounts exist
- Copy password to clipboard
- Edit and delete credentials
- View recently used passwords
- Statistics (total sites, total accounts)

## Installation

### Load Unpacked Extension (Development)

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Or click Menu (⋮) → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to the project folder: `e:/NODEJS/elctron-js-password-manager`
   - Select the folder and click "Select Folder"

4. **Verify Installation**
   - You should see "Secure Password Manager" in your extensions list
   - The extension icon should appear in your Chrome toolbar

## Usage

### Saving Passwords

1. Visit any website with a login form
2. Enter your username and password
3. Submit the form
4. A save prompt will appear in the top-right corner
5. Click "Save" to store the credentials

### Autofilling Passwords

**Method 1: Using the Popup**
1. Click the extension icon in your toolbar
2. View all saved accounts for the current site
3. Click on an account to autofill

**Method 2: Using the Content Script**
1. Visit a website with saved credentials
2. Click on the username field
3. A dropdown will appear with your saved accounts
4. Click an account to autofill

**Method 3: Using the Autofill Button**
1. Look for the purple lock icon next to username fields
2. Click it to see your saved accounts
3. Select an account to autofill

### Managing Passwords (Dashboard)

1. Click the extension icon
2. Click the menu icon (☰) or "Open Dashboard"
3. Or right-click the extension icon → Options

**Dashboard Features:**
- **View All Passwords**: See all saved credentials organized by website
- **Search**: Use the search bar to filter passwords
- **Add Password**: Click "Add Password" to manually add credentials
- **Edit Password**: Click the edit icon on any account
- **Delete Password**: Click the delete icon on any account
- **Copy Password**: Click the copy icon to copy password to clipboard
- **Add Multiple Accounts**: Click the + icon on a website card to add another account
- **Generate Password**: Use the password generator when adding/editing

### Adding Multiple Accounts for Same Website

1. Open the dashboard
2. Find the website card
3. Click the "+" icon in the card header
4. Enter the new account credentials
5. Click "Save Password"

## Project Structure

```
elctron-js-password-manager/
├── manifest.json                 # Extension configuration
├── src/
│   ├── background/
│   │   └── background.js        # Service worker
│   ├── content/
│   │   ├── content.js           # Login form detection & autofill
│   │   └── style.css            # Content script styles
│   ├── popup/
│   │   ├── index.html           # Popup interface
│   │   ├── style.css            # Popup styles
│   │   └── popup.js             # Popup logic
│   ├── options/
│   │   ├── index.html           # Dashboard interface
│   │   ├── style.css            # Dashboard styles
│   │   └── options.js           # Dashboard logic
│   ├── utils/
│   │   └── storage.js           # Storage utility functions
│   └── icons/
│       ├── icon16.png           # 16x16 icon
│       ├── icon48.png           # 48x48 icon
│       └── icon128.png          # 128x128 icon
└── README.md
```

## Technical Details

### Storage

- Uses `chrome.storage.local` API
- Data structure:
  ```json
  {
    "credentials": {
      "example.com": [
        {
          "username": "user@example.com",
          "password": "securePassword123",
          "lastUsed": 1234567890
        }
      ]
    }
  }
  ```

### Permissions

- `storage`: Store credentials locally
- `activeTab`: Access current tab information
- `scripting`: Inject content scripts
- `tabs`: Query tab information
- `<all_urls>`: Inject content script on all pages

### Security Notes

⚠️ **Important**: This extension stores passwords in `chrome.storage.local` which is **NOT encrypted** by default. This is suitable for development and learning purposes only.

**For Production Use:**
- Implement encryption (AES-256) with a master password
- Add password strength indicators
- Implement auto-lock after inactivity
- Add import/export functionality with encryption
- Consider using Chrome's built-in encryption APIs

## Browser Compatibility

- ✅ Chrome (Manifest V3)
- ✅ Edge (Chromium-based)
- ✅ Brave
- ✅ Opera

## Development

### Making Changes

1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon (🔄) on the extension card
4. Test your changes

### Debugging

- **Popup**: Right-click popup → Inspect
- **Options Page**: Right-click dashboard → Inspect
- **Content Script**: Open DevTools on any webpage → Console
- **Background**: Click "service worker" link in extension details

## Future Enhancements

- [ ] Master password encryption
- [ ] Password strength indicator
- [ ] Auto-lock feature
- [ ] Import/Export passwords
- [ ] Password history
- [ ] Secure notes
- [ ] Two-factor authentication support
- [ ] Cloud sync (optional)
- [ ] Browser fingerprinting protection
- [ ] Breach detection

## License

MIT License - Feel free to use and modify for your needs.

## Support

For issues or questions, please check:
1. Chrome DevTools Console for errors
2. Extension service worker logs
3. Ensure all files are in the correct directories

---

**Made with ❤️ using Manifest V3**
