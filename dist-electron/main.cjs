var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron3 = require("electron");
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);

// node_modules/electron-is-dev/index.js
var import_electron = __toESM(require("electron"), 1);
if (typeof import_electron.default === "string") {
  throw new TypeError("Not running in an Electron environment!");
}
var { env } = process;
var isEnvSet = "ELECTRON_IS_DEV" in env;
var getFromEnv = Number.parseInt(env.ELECTRON_IS_DEV, 10) === 1;
var isDev = isEnvSet ? getFromEnv : !import_electron.default.app.isPackaged;
var electron_is_dev_default = isDev;

// electron/main.ts
var import_config = require("dotenv/config");

// electron/services/GoogleAuthService.ts
var import_electron2 = require("electron");
var import_googleapis = require("googleapis");
var import_http = __toESM(require("http"), 1);
var import_url = __toESM(require("url"), 1);
var import_electron_store = __toESM(require("electron-store"), 1);
var store = new import_electron_store.default({
  name: "google-tokens",
  encryptionKey: "nexus-os-encryption-key"
  // Simple obfuscation
});
var GoogleAuthService = class {
  constructor() {
    this.server = null;
    // These will be loaded from process.env or a config file
    this.clientId = process.env.GOOGLE_CLIENT_ID || "";
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
    this.redirectUri = "http://localhost:3000/oauth2callback";
    this.oauth2Client = new import_googleapis.google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );
    const refresh_token = store.get("refresh_token");
    if (refresh_token) {
      this.oauth2Client.setCredentials({
        refresh_token,
        access_token: store.get("access_token"),
        expiry_date: store.get("expiry_date")
      });
    }
  }
  // Update credentials (can be called after user inputs them in settings)
  setCredentials(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.oauth2Client = new import_googleapis.google.auth.OAuth2(
      clientId,
      clientSecret,
      this.redirectUri
    );
    const refresh_token = store.get("refresh_token");
    if (refresh_token) {
      this.oauth2Client.setCredentials({
        refresh_token,
        access_token: store.get("access_token"),
        expiry_date: store.get("expiry_date")
      });
    }
  }
  getAuthClient() {
    return this.oauth2Client;
  }
  isAuthenticated() {
    return !!store.get("refresh_token");
  }
  async signIn(mainWindow2) {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    return new Promise((resolve, reject) => {
      this.server = import_http.default.createServer(async (req, res) => {
        try {
          if (req.url?.startsWith("/oauth2callback")) {
            const qs = new import_url.default.URL(req.url, "http://localhost:3000").searchParams;
            const code = qs.get("code");
            if (code) {
              const { tokens } = await this.oauth2Client.getToken(code);
              this.oauth2Client.setCredentials(tokens);
              store.set({
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expiry_date: tokens.expiry_date
              });
              res.end("Authentication successful! You can close this window and return to the app.");
              if (this.server) {
                this.server.close();
                this.server = null;
              }
              resolve(true);
            } else {
              res.end("Authentication failed: No code received.");
              resolve(false);
            }
          }
        } catch (e) {
          console.error("Error during OAuth callback:", e);
          res.end("Authentication failed.");
          reject(e);
        }
      });
      this.server.on("error", (e) => {
        if (e.code === "EADDRINUSE") {
          console.error("Error: Port 3000 is already in use.");
          reject(new Error("Port 3000 is already in use. Please close other potential instances or wait a moment."));
        } else {
          reject(e);
        }
      });
      this.server.listen(3e3, () => {
        const authUrl = this.oauth2Client.generateAuthUrl({
          access_type: "offline",
          // Critical for getting a refresh token
          scope: [
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/tasks"
          ]
        });
        console.log("Opening auth URL:", authUrl);
        import_electron2.shell.openExternal(authUrl);
      });
    });
  }
  async signOut() {
    try {
      const token = store.get("access_token");
      if (token) {
        await this.oauth2Client.revokeToken(token);
      }
    } catch (error) {
      console.warn("Error revoking token:", error);
    }
    store.clear();
    this.oauth2Client.setCredentials({});
    return true;
  }
};

// electron/services/GoogleCalendarService.ts
var import_googleapis2 = require("googleapis");
var GoogleCalendarService = class {
  constructor(authService) {
    this.authService = authService;
    this.calendar = import_googleapis2.google.calendar({ version: "v3", auth: authService.getAuthClient() });
  }
  async listEvents(timeMin, timeMax) {
    if (!this.authService.isAuthenticated()) {
      throw new Error("Not authenticated");
    }
    try {
      const response = await this.calendar.events.list({
        calendarId: "primary",
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: "startTime"
      });
      const events = response.data.items || [];
      return events.map((event) => ({
        id: event.id || "",
        title: event.summary || "No Title",
        start: event.start?.dateTime || event.start?.date || "",
        end: event.end?.dateTime || event.end?.date || "",
        description: event.description || "",
        isGoogleEvent: true
      })).filter((e) => e.id && e.start);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      if (error.code === 401) {
        throw new Error("Authentication expired. Please sign in again.");
      }
      throw error;
    }
  }
  async insertEvent(event) {
    if (!this.authService.isAuthenticated()) throw new Error("Not authenticated");
    const resource = {
      summary: event.title,
      description: event.description,
      start: { dateTime: event.start },
      end: { dateTime: event.end }
    };
    const response = await this.calendar.events.insert({
      calendarId: "primary",
      requestBody: resource
    });
    return response.data.id || "";
  }
  async updateEvent(eventId, event) {
    if (!this.authService.isAuthenticated()) throw new Error("Not authenticated");
    const resource = {
      summary: event.title,
      description: event.description,
      start: { dateTime: event.start },
      end: { dateTime: event.end }
    };
    await this.calendar.events.update({
      calendarId: "primary",
      eventId,
      requestBody: resource
    });
    return true;
  }
  async deleteEvent(eventId) {
    if (!this.authService.isAuthenticated()) throw new Error("Not authenticated");
    await this.calendar.events.delete({
      calendarId: "primary",
      eventId
    });
    return true;
  }
};

// electron/services/GoogleTasksService.ts
var import_googleapis3 = require("googleapis");
var GoogleTasksService = class {
  constructor(authService) {
    this.authService = authService;
    this.tasks = import_googleapis3.google.tasks({ version: "v1", auth: authService.getAuthClient() });
  }
  async listTaskLists() {
    if (!this.authService.isAuthenticated()) throw new Error("Not authenticated");
    const response = await this.tasks.tasklists.list();
    return response.data.items || [];
  }
  async listTasks(tasklistId = "@default") {
    if (!this.authService.isAuthenticated()) throw new Error("Not authenticated");
    try {
      const response = await this.tasks.tasks.list({
        tasklist: tasklistId,
        showCompleted: true,
        showHidden: true
      });
      const tasks = response.data.items || [];
      return tasks.map((t) => ({
        id: t.id || "",
        title: t.title || "No Title",
        notes: t.notes || void 0,
        due: t.due || void 0,
        status: t.status,
        webViewLink: t.webViewLink || void 0
      }));
    } catch (error) {
      console.error("Error fetching tasks:", error);
      throw error;
    }
  }
  async insertTask(tasklistId = "@default", taskData) {
    if (!this.authService.isAuthenticated()) throw new Error("Not authenticated");
    const requestBody = {
      title: taskData.title
    };
    if (taskData.notes) {
      requestBody.notes = taskData.notes;
    }
    if (taskData.due) {
      requestBody.due = taskData.due.includes("T") ? taskData.due : `${taskData.due}T00:00:00.000Z`;
    }
    const response = await this.tasks.tasks.insert({
      tasklist: tasklistId,
      requestBody
    });
    return response.data.id || "";
  }
  async updateTask(tasklistId = "@default", taskId, task) {
    if (!this.authService.isAuthenticated()) throw new Error("Not authenticated");
    const requestBody = {};
    if (task.title !== void 0) requestBody.title = task.title;
    if (task.notes !== void 0) requestBody.notes = task.notes;
    if (task.due !== void 0) {
      requestBody.due = task.due.includes("T") ? task.due : `${task.due}T00:00:00.000Z`;
    }
    if (task.status !== void 0) requestBody.status = task.status;
    await this.tasks.tasks.patch({
      tasklist: tasklistId,
      task: taskId,
      requestBody
    });
    return true;
  }
  async deleteTask(tasklistId = "@default", taskId) {
    if (!this.authService.isAuthenticated()) throw new Error("Not authenticated");
    await this.tasks.tasks.delete({
      tasklist: tasklistId,
      task: taskId
    });
    return true;
  }
};

// electron/main.ts
var mainWindow = null;
var googleAuthService = new GoogleAuthService();
var googleCalendarService = new GoogleCalendarService(googleAuthService);
var googleTasksService = new GoogleTasksService(googleAuthService);
function createWindow() {
  mainWindow = new import_electron3.BrowserWindow({
    width: 1280,
    height: 800,
    title: "NEXUS /// OS",
    backgroundColor: "#0a0a0a",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: import_path.default.join(__dirname, "preload.cjs"),
      webviewTag: true
    },
    titleBarStyle: "hiddenInset",
    autoHideMenuBar: true
  });
  const startURL = electron_is_dev_default ? "http://localhost:5180" : `file://${import_path.default.join(__dirname, "../dist/index.html")}`;
  mainWindow.loadURL(startURL);
  if (electron_is_dev_default) {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on("closed", () => mainWindow = null);
}
import_electron3.ipcMain.handle("notes:selectVault", async () => {
  const result = await import_electron3.dialog.showOpenDialog({
    properties: ["openDirectory"],
    title: "Select Notes Vault Folder"
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});
function getDirectoryTree(dirPath) {
  const items = [];
  try {
    const entries = import_fs.default.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const fullPath = import_path.default.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        items.push({
          name: entry.name,
          path: fullPath,
          isDirectory: true,
          children: getDirectoryTree(fullPath)
        });
      } else if (entry.name.endsWith(".md")) {
        items.push({
          name: entry.name,
          path: fullPath,
          isDirectory: false
        });
      }
    }
  } catch (err) {
    console.error("Error reading directory:", err);
  }
  items.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
  return items;
}
import_electron3.ipcMain.handle("notes:getFileTree", async (_, vaultPath) => {
  return getDirectoryTree(vaultPath);
});
import_electron3.ipcMain.handle("notes:readFile", async (_, filePath) => {
  try {
    return import_fs.default.readFileSync(filePath, "utf-8");
  } catch (err) {
    console.error("Error reading file:", err);
    return null;
  }
});
import_electron3.ipcMain.handle("notes:writeFile", async (_, filePath, content) => {
  try {
    import_fs.default.writeFileSync(filePath, content, "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing file:", err);
    return false;
  }
});
import_electron3.ipcMain.handle("notes:createFile", async (_, dirPath, fileName) => {
  try {
    const filePath = import_path.default.join(dirPath, fileName.endsWith(".md") ? fileName : `${fileName}.md`);
    if (import_fs.default.existsSync(filePath)) return { success: false, error: "File already exists" };
    import_fs.default.writeFileSync(filePath, `# ${fileName.replace(".md", "")}

`, "utf-8");
    return { success: true, path: filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
import_electron3.ipcMain.handle("notes:createFolder", async (_, dirPath, folderName) => {
  try {
    const folderPath = import_path.default.join(dirPath, folderName);
    if (import_fs.default.existsSync(folderPath)) return { success: false, error: "Folder already exists" };
    import_fs.default.mkdirSync(folderPath);
    return { success: true, path: folderPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
import_electron3.ipcMain.handle("notes:delete", async (_, itemPath) => {
  try {
    const stat = import_fs.default.statSync(itemPath);
    if (stat.isDirectory()) {
      import_fs.default.rmSync(itemPath, { recursive: true });
    } else {
      import_fs.default.unlinkSync(itemPath);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
import_electron3.ipcMain.handle("notes:rename", async (_, oldPath, newName) => {
  try {
    const dir = import_path.default.dirname(oldPath);
    const newPath = import_path.default.join(dir, newName);
    import_fs.default.renameSync(oldPath, newPath);
    return { success: true, newPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
import_electron3.ipcMain.handle("notes:moveFile", async (_, sourcePath, destinationPath) => {
  try {
    const fileName = import_path.default.basename(sourcePath);
    const newPath = import_path.default.join(destinationPath, fileName);
    if (destinationPath.startsWith(sourcePath)) {
      return { success: false, error: "Cannot move a folder into itself" };
    }
    if (import_fs.default.existsSync(newPath)) {
      return { success: false, error: "Destination already exists" };
    }
    import_fs.default.renameSync(sourcePath, newPath);
    return { success: true, newPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
import_electron3.ipcMain.handle("google:checkAuth", () => {
  return googleAuthService.isAuthenticated();
});
import_electron3.ipcMain.handle("google:signin", async () => {
  if (!mainWindow) return false;
  return await googleAuthService.signIn(mainWindow);
});
import_electron3.ipcMain.handle("google:signout", async () => {
  return await googleAuthService.signOut();
});
import_electron3.ipcMain.handle("google:listEvents", async (_, timeMinStr, timeMaxStr) => {
  try {
    const timeMin = new Date(timeMinStr);
    const timeMax = new Date(timeMaxStr);
    return await googleCalendarService.listEvents(timeMin, timeMax);
  } catch (error) {
    console.error("IPC google:listEvents error:", error);
    return { error: error.message };
  }
});
import_electron3.ipcMain.handle("google:addEvent", async (_, event) => {
  try {
    return await googleCalendarService.insertEvent(event);
  } catch (error) {
    console.error("IPC google:addEvent error:", error);
    return { error: error.message };
  }
});
import_electron3.ipcMain.handle("google:updateEvent", async (_, id, event) => {
  try {
    return await googleCalendarService.updateEvent(id, event);
  } catch (error) {
    console.error("IPC google:updateEvent error:", error);
    return { error: error.message };
  }
});
import_electron3.ipcMain.handle("google:deleteEvent", async (_, id) => {
  try {
    return await googleCalendarService.deleteEvent(id);
  } catch (error) {
    console.error("IPC google:deleteEvent error:", error);
    return { error: error.message };
  }
});
import_electron3.ipcMain.handle("google:tasks:list", async (_, tasklistId) => {
  try {
    return await googleTasksService.listTasks(tasklistId);
  } catch (error) {
    console.error("IPC google:tasks:list error:", error);
    return { error: error.message };
  }
});
import_electron3.ipcMain.handle("google:tasks:getLists", async () => {
  try {
    return await googleTasksService.listTaskLists();
  } catch (error) {
    console.error("IPC google:tasks:getLists error:", error);
    return { error: error.message };
  }
});
import_electron3.ipcMain.handle("google:tasks:add", async (_, tasklistId, taskData) => {
  try {
    return await googleTasksService.insertTask(tasklistId, taskData);
  } catch (error) {
    console.error("IPC google:tasks:add error:", error);
    return { error: error.message };
  }
});
import_electron3.ipcMain.handle("google:tasks:update", async (_, tasklistId, taskId, task) => {
  try {
    return await googleTasksService.updateTask(tasklistId, taskId, task);
  } catch (error) {
    console.error("IPC google:tasks:update error:", error);
    return { error: error.message };
  }
});
import_electron3.ipcMain.handle("google:tasks:delete", async (_, tasklistId, taskId) => {
  try {
    return await googleTasksService.deleteTask(tasklistId, taskId);
  } catch (error) {
    console.error("IPC google:tasks:delete error:", error);
    return { error: error.message };
  }
});
import_electron3.app.on("ready", createWindow);
import_electron3.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron3.app.quit();
  }
});
import_electron3.app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
