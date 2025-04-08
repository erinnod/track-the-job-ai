# JobTrakr Browser Extension

A browser extension that allows you to save job listings directly from LinkedIn and Indeed to your JobTrakr account.

## Features

- **Quick Job Saving**: Save job listings directly from LinkedIn and Indeed with one click
- **Job Data Extraction**: Automatically extracts job title, company, location, description, and more
- **Authentication**: Securely connect to your JobTrakr account
- **Visual Notifications**: Clear visual feedback when jobs are saved

## Installation

### Development Mode

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the `browser-extension` directory
5. The JobTrakr extension is now installed and should appear in your extensions list

### From Chrome Web Store (Coming Soon)

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore)
2. Search for "JobTrakr"
3. Click "Add to Chrome"

## Usage

1. **Sign In**: Click the JobTrakr extension icon and sign in to your JobTrakr account
2. **Browse Jobs**: Visit job listings on LinkedIn or Indeed
3. **Save Jobs**: Click the "Save to JobTrakr" button that appears on supported job pages
4. **View Saved Jobs**: Access all your saved jobs in your JobTrakr dashboard

## Supported Job Sites

- LinkedIn Jobs (`linkedin.com/jobs/*`)
- Indeed Jobs (`indeed.com/viewjob*`, `indeed.com/job/*`)

More job sites will be added in future updates.

## Configuration

The extension connects to the JobTrakr backend API. If you're running your own instance of JobTrakr, you'll need to update the API URL in the following files:

- `background/background.js`
- `popup/popup.js`

## Privacy

The JobTrakr extension only accesses data on LinkedIn and Indeed job pages. It does not track your browsing history or collect any personal information outside of job-related pages. All data is securely transmitted to your JobTrakr account using authentication tokens.

## Development

### Project Structure

- `manifest.json`: Extension configuration
- `background/`: Background service worker scripts
- `content/`: Content scripts for job sites
- `popup/`: Extension popup UI
- `icons/`: Extension icons

### Building for Production

To build the extension for production:

1. Update all API URLs to point to the production backend
2. Remove any development or debugging code
3. Zip the contents of the `browser-extension` directory
4. Submit to the Chrome Web Store Developer Dashboard

## Support

If you encounter any issues or have questions about the JobTrakr extension, please contact support at support@jobtrakr.com or open an issue in the GitHub repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
