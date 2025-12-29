<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1J4aGURSNWheclaEWJfOaguGDCDci0CXs

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the interactive setup to configure your environment:
   `python setup.py`
3. Run the app:
   `npm run dev`

## Environment Variables

The `python setup.py` script will automatically create a `.env` file for you. The following variables are required:

- `VITE_A4F_API_KEY`: Token for Brain View AI.
- `GOOGLE_CLIENT_ID`: OAuth Client ID for Google Calendar/Tasks.
- `GOOGLE_CLIENT_SECRET`: OAuth Client Secret for Google Calendar/Tasks.

## Run as Desktop App (Electron)

You can also run this application as a standalone desktop app using Electron.

### Development Mode
To run the desktop app in development mode:
`npm run electron:dev`

### Build Desktop App
To build the application for your operating system:
`npm run electron:build`

The build artifacts will be located in the `dist` and `dist-electron` folders.
