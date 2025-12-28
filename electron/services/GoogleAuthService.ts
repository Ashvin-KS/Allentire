import { BrowserWindow, shell } from 'electron';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import http from 'http';
import url from 'url';
import Store from 'electron-store';

// Define the shape of our stored tokens
interface TokenStore {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
}

const store = new Store<TokenStore>({
  name: 'google-tokens',
  encryptionKey: 'nexus-os-encryption-key' // Simple obfuscation
}) as any;

export class GoogleAuthService {
  private oauth2Client: OAuth2Client;
  private server: http.Server | null = null;

  // These will be loaded from process.env or a config file
  private clientId = process.env.GOOGLE_CLIENT_ID || '';
  private clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  private redirectUri = 'http://localhost:3000/oauth2callback';

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );

    // Load saved tokens if they exist
    const refresh_token = store.get('refresh_token');
    if (refresh_token) {
      this.oauth2Client.setCredentials({
        refresh_token,
        access_token: store.get('access_token'),
        expiry_date: store.get('expiry_date')
      });
    }
  }

  // Update credentials (can be called after user inputs them in settings)
  public setCredentials(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      this.redirectUri
    );

    // Re-apply tokens if we have them
    const refresh_token = store.get('refresh_token');
    if (refresh_token) {
      this.oauth2Client.setCredentials({
        refresh_token,
        access_token: store.get('access_token'),
        expiry_date: store.get('expiry_date')
      });
    }
  }

  public getAuthClient() {
    return this.oauth2Client;
  }

  public isAuthenticated(): boolean {
    return !!store.get('refresh_token'); // We consider authenticated if we have a refresh token
  }

  public async signIn(mainWindow: BrowserWindow): Promise<boolean> {
    // 0. Ensure any previous server is closed to avoid EADDRINUSE
    if (this.server) {
      this.server.close();
      this.server = null;
    }

    return new Promise((resolve, reject) => {
      // 1. Start a local server to handle the callback
      this.server = http.createServer(async (req, res) => {
        try {
          if (req.url?.startsWith('/oauth2callback')) {
            const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
            const code = qs.get('code');

            if (code) {
              // 3. Exchange code for tokens
              const { tokens } = await this.oauth2Client.getToken(code);
              this.oauth2Client.setCredentials(tokens);

              // 4. Store tokens securely
              store.set({
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expiry_date: tokens.expiry_date
              });

              res.end('Authentication successful! You can close this window and return to the app.');

              if (this.server) {
                this.server.close();
                this.server = null;
              }

              resolve(true);
            } else {
              res.end('Authentication failed: No code received.');
              resolve(false);
            }
          }
        } catch (e) {
          console.error('Error during OAuth callback:', e);
          res.end('Authentication failed.');
          reject(e);
        }
      });

      this.server.on('error', (e: any) => {
        if (e.code === 'EADDRINUSE') {
          console.error('Error: Port 3000 is already in use.');
          // Attempt to fail gracefully or notify
          reject(new Error('Port 3000 is already in use. Please close other potential instances or wait a moment.'));
        } else {
          reject(e);
        }
      });

      this.server.listen(3000, () => {
        // 2. Open the browser to the authorization URL
        const authUrl = this.oauth2Client.generateAuthUrl({
          access_type: 'offline', // Critical for getting a refresh token
          scope: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/tasks'
          ],
        });

        console.log('Opening auth URL:', authUrl);
        shell.openExternal(authUrl);
      });
    });
  }

  public async signOut() {
    // Revoke token if possible (optional but good practice)
    try {
      const token = store.get('access_token');
      if (token) {
        await this.oauth2Client.revokeToken(token);
      }
    } catch (error) {
      console.warn('Error revoking token:', error);
    }

    // Clear local store
    store.clear();

    // Reset client credentials
    this.oauth2Client.setCredentials({});

    return true;
  }
}
