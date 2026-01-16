# Gmail Integration with LLM Email Filtering - Setup Guide

This guide will help you set up the new Gmail integration feature that uses AI to filter important emails from spam.

## Overview

The Email Gatekeeper feature uses:
1. **Gmail API** - To fetch and manage your emails
2. **LLM (OpenAI GPT)** - To intelligently classify emails as urgent, important, normal, or spam

## Prerequisites

1. **Google Cloud Project** - You already have this for Calendar/Tasks
2. **OpenAI API Key** - Required for email classification
3. **Node.js and npm** - Already installed

## Step 1: Enable Gmail API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your existing project (the one you're using for Calendar/Tasks)
3. Navigate to **APIs & Services** > **Library**
4. Search for "Gmail API"
5. Click **Enable**

## Step 2: Update OAuth Scopes

The Gmail scopes have already been added to the code:
- `https://www.googleapis.com/auth/gmail.readonly` - Read emails
- `https://www.googleapis.com/auth/gmail.modify` - Modify emails (mark as read, archive, etc.)

You'll need to update your OAuth consent screen:
1. Go to **APIs & Services** > **OAuth consent screen**
2. Click **Edit App**
3. In the **Scopes** section, add the Gmail scopes if not already added
4. Save changes

**Important**: If you've already connected your Google account, you'll need to disconnect and reconnect to grant the new Gmail permissions.

## Step 3: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (you won't be able to see it again!)
6. Optionally, add credit to your account (the feature uses GPT-4o-mini which is very cost-effective)

### Cost Estimation

The email classifier uses GPT-4o-mini which costs:
- **Input**: $0.15 per 1M tokens
- **Output**: $0.60 per 1M tokens

For 50 emails analyzed:
- Estimated cost: **~$0.01 - $0.03** per scan
- Monthly estimate (daily scans): **~$0.30 - $1.00**

Very affordable! 🎉

## Step 4: Install Dependencies

No new dependencies are needed! Everything uses the existing packages:
- `googleapis` - Already installed for Calendar/Tasks
- `google-auth-library` - Already installed
- `electron-store` - Already installed

## Step 5: How to Use

### First Time Setup

1. **Start the app**: `npm run electron:dev`

2. **Navigate to Dashboard**: The Email Gatekeeper card is in the bottom row

3. **Click the card** to open the full Email Gatekeeper view

4. **Configure LLM API Key**:
   - Click the settings icon (⚙️)
   - Enter your OpenAI API key
   - Click Save

5. **Connect Gmail**:
   - Click "Connect Gmail Account"
   - You'll be redirected to Google OAuth
   - Grant permissions for Gmail access
   - You'll be redirected back to the app

6. **First Scan**:
   - The app will automatically fetch your recent emails
   - If you've configured the LLM key, it will classify them automatically
   - Otherwise, click "Refresh & Classify"

### Daily Usage

The Email Gatekeeper will:
- ✅ Show urgent emails requiring immediate attention
- 📧 Highlight important emails from key contacts
- 🗑️ Filter out spam and promotional content
- 📊 Give you stats on your inbox

**Filter Options**:
- **All**: See all scanned emails
- **Urgent**: Time-sensitive actions required
- **Important**: Work-related, needs attention
- **Normal**: General correspondence
- **Spam**: Filtered promotional emails

## Features

### In the Dashboard Card
- Quick stats (urgent count, important count)
- Total emails scanned
- Spam filtered count
- One-click refresh
- Quick access to full view

### In the Full View
- **Search**: Find emails by subject, sender, or content
- **Filter**: View by category (urgent, important, normal, spam)
- **AI Analysis**: See why each email was classified
- **Actions**: Archive, delete, or open in Gmail
- **Email Detail View**: Read full email content

## Configuration Files Created

The feature creates the following new files:

```
electron/services/
├── GmailService.ts              # Gmail API interactions
├── EmailClassifierService.ts    # LLM email classification

components/dashboard/
├── EmailGatekeeperCard.tsx      # Dashboard card component
├── EmailGatekeeperView.tsx      # Full email management view

store/
└── useEmailGatekeeperStore.ts   # State management
```

## Troubleshooting

### "Gmail service not initialized"
- Make sure you've clicked "Connect Gmail Account"
- Try disconnecting and reconnecting

### "Classification failed"
- Check your OpenAI API key is correct
- Ensure you have credits in your OpenAI account
- Check browser console for error details

### No emails showing up
- Check the query filter (default: emails from last 7 days)
- Try clicking "Refresh & Classify"
- Make sure you have emails in your Gmail inbox

### OAuth Error
- Make sure Gmail API is enabled in Google Cloud Console
- Check that OAuth consent screen includes Gmail scopes
- Try clearing browser cache and reconnecting

## Privacy & Security

- ✅ **All API keys are stored locally** using electron-store with encryption
- ✅ **Emails are processed locally** and sent only to OpenAI for classification
- ✅ **No emails are stored permanently** - they're cached in memory only
- ✅ **OAuth tokens are stored securely** using electron-store
- ✅ **You maintain full control** - disconnect anytime

## Advanced Configuration

### Change LLM Model

Edit `electron/services/EmailClassifierService.ts`:

```typescript
this.model = config.model || 'gpt-4o-mini'; // Change to 'gpt-4o' for better accuracy
```

### Adjust Email Fetch Count

In the store or view, change `maxResults`:

```typescript
await window.electron.invoke('fetch-emails', { 
  maxResults: 100, // Increase to fetch more emails
  query: 'newer_than:30d' // Change time range
});
```

### Custom Classification Criteria

Edit the system prompt in `EmailClassifierService.ts` to match your needs.

## Example Gmail Queries

You can customize what emails to fetch:

- `newer_than:7d` - Last 7 days (default)
- `is:unread` - Only unread emails
- `from:example.com` - From specific domain
- `has:attachment` - With attachments
- `is:important` - Gmail's important flag
- `newer_than:1d is:unread` - Unread from last day

## Support

If you encounter issues:
1. Check the Electron console for errors
2. Verify all API keys are correct
3. Ensure Gmail API is enabled
4. Check your OpenAI account has credits

## Next Steps

Want to enhance the feature? Consider:
- [ ] Email templates for common responses
- [ ] Auto-reply to spam emails
- [ ] Smart notification system
- [ ] Email digest summary (already implemented!)
- [ ] Integration with Tasks (mark emails as tasks)
- [ ] Calendar event creation from emails

Enjoy your AI-powered email management! 🚀
