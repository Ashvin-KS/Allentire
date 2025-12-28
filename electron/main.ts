import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import isDev from 'electron-is-dev';
import 'dotenv/config';

import { GoogleAuthService } from './services/GoogleAuthService';
import { GoogleCalendarService } from './services/GoogleCalendarService';
import { GoogleTasksService } from './services/GoogleTasksService';

let mainWindow: BrowserWindow | null = null;
const googleAuthService = new GoogleAuthService();
const googleCalendarService = new GoogleCalendarService(googleAuthService);
const googleTasksService = new GoogleTasksService(googleAuthService);

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: 'NEXUS /// OS',
        backgroundColor: '#0a0a0a',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs'),
            webviewTag: true,
        },
        titleBarStyle: 'hiddenInset',
        autoHideMenuBar: true,
    });

    const startURL = isDev
        ? 'http://localhost:5180'
        : `file://${path.join(__dirname, '../dist/index.html')}`;

    mainWindow.loadURL(startURL);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => (mainWindow = null));
}

// ========== FILE SYSTEM IPC HANDLERS FOR NOTES APP ==========

// Open folder dialog to select vault
ipcMain.handle('notes:selectVault', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Notes Vault Folder'
    });
    if (result.canceled) return null;
    return result.filePaths[0];
});

// Get all files and folders in a directory (recursive)
interface FileNode {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileNode[];
}

function getDirectoryTree(dirPath: string): FileNode[] {
    const items: FileNode[] = [];

    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            // Skip hidden files and folders
            if (entry.name.startsWith('.')) continue;

            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                items.push({
                    name: entry.name,
                    path: fullPath,
                    isDirectory: true,
                    children: getDirectoryTree(fullPath)
                });
            } else if (entry.name.endsWith('.md')) {
                items.push({
                    name: entry.name,
                    path: fullPath,
                    isDirectory: false
                });
            }
        }
    } catch (err) {
        console.error('Error reading directory:', err);
    }

    // Sort: folders first, then files, alphabetically
    items.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
    });

    return items;
}

ipcMain.handle('notes:getFileTree', async (_, vaultPath: string) => {
    return getDirectoryTree(vaultPath);
});

// Read file content
ipcMain.handle('notes:readFile', async (_, filePath: string) => {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
        console.error('Error reading file:', err);
        return null;
    }
});

// Write file content
ipcMain.handle('notes:writeFile', async (_, filePath: string, content: string) => {
    try {
        fs.writeFileSync(filePath, content, 'utf-8');
        return true;
    } catch (err) {
        console.error('Error writing file:', err);
        return false;
    }
});

// Create new file
ipcMain.handle('notes:createFile', async (_, dirPath: string, fileName: string) => {
    try {
        const filePath = path.join(dirPath, fileName.endsWith('.md') ? fileName : `${fileName}.md`);
        if (fs.existsSync(filePath)) return { success: false, error: 'File already exists' };
        fs.writeFileSync(filePath, `# ${fileName.replace('.md', '')}\n\n`, 'utf-8');
        return { success: true, path: filePath };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
});

// Create new folder
ipcMain.handle('notes:createFolder', async (_, dirPath: string, folderName: string) => {
    try {
        const folderPath = path.join(dirPath, folderName);
        if (fs.existsSync(folderPath)) return { success: false, error: 'Folder already exists' };
        fs.mkdirSync(folderPath);
        return { success: true, path: folderPath };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
});

// Delete file or folder
ipcMain.handle('notes:delete', async (_, itemPath: string) => {
    try {
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
            fs.rmSync(itemPath, { recursive: true });
        } else {
            fs.unlinkSync(itemPath);
        }
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
});

// Rename file or folder
ipcMain.handle('notes:rename', async (_, oldPath: string, newName: string) => {
    try {
        const dir = path.dirname(oldPath);
        const newPath = path.join(dir, newName);
        fs.renameSync(oldPath, newPath);
        return { success: true, newPath };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
});

// Move file or folder
ipcMain.handle('notes:moveFile', async (_, sourcePath: string, destinationPath: string) => {
    try {
        const fileName = path.basename(sourcePath);
        const newPath = path.join(destinationPath, fileName);

        // Prevent moving into itself
        if (destinationPath.startsWith(sourcePath)) {
            return { success: false, error: 'Cannot move a folder into itself' };
        }

        // Check if destination already exists
        if (fs.existsSync(newPath)) {
            return { success: false, error: 'Destination already exists' };
        }

        fs.renameSync(sourcePath, newPath);
        return { success: true, newPath };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
});

// ========== GOOGLE CALENDAR IPC HANDLERS ==========

// Check if already signed in
ipcMain.handle('google:checkAuth', () => {
    return googleAuthService.isAuthenticated();
});

// Start Sign In Flow
ipcMain.handle('google:signin', async () => {
    if (!mainWindow) return false;
    // IMPORTANT: Ideally, we would fetch these from a secure config or env vars
    // For now, we'll rely on the default placeholders in the service
    // or you can implement a method to set them here via another IPC call
    return await googleAuthService.signIn(mainWindow);
});

// Sign Out
ipcMain.handle('google:signout', async () => {
    return await googleAuthService.signOut();
});

// Fetch Events
ipcMain.handle('google:listEvents', async (_, timeMinStr: string, timeMaxStr: string) => {
    try {
        const timeMin = new Date(timeMinStr);
        const timeMax = new Date(timeMaxStr);
        return await googleCalendarService.listEvents(timeMin, timeMax);
    } catch (error: any) {
        console.error('IPC google:listEvents error:', error);
        return { error: error.message };
    }
});

// Add Event
ipcMain.handle('google:addEvent', async (_, event) => {
    try {
        return await googleCalendarService.insertEvent(event);
    } catch (error: any) {
        console.error('IPC google:addEvent error:', error);
        return { error: error.message };
    }
});

// Update Event
ipcMain.handle('google:updateEvent', async (_, id, event) => {
    try {
        return await googleCalendarService.updateEvent(id, event);
    } catch (error: any) {
        console.error('IPC google:updateEvent error:', error);
        return { error: error.message };
    }
});

// Delete Event
ipcMain.handle('google:deleteEvent', async (_, id) => {
    try {
        return await googleCalendarService.deleteEvent(id);
    } catch (error: any) {
        console.error('IPC google:deleteEvent error:', error);
        return { error: error.message };
    }
});

// ========== GOOGLE TASKS IPC HANDLERS ==========

ipcMain.handle('google:tasks:list', async (_, tasklistId) => {
    try {
        return await googleTasksService.listTasks(tasklistId);
    } catch (error: any) {
        console.error('IPC google:tasks:list error:', error);
        return { error: error.message };
    }
});

ipcMain.handle('google:tasks:getLists', async () => {
    try {
        return await googleTasksService.listTaskLists();
    } catch (error: any) {
        console.error('IPC google:tasks:getLists error:', error);
        return { error: error.message };
    }
});

ipcMain.handle('google:tasks:add', async (_, tasklistId, taskData) => {
    try {
        return await googleTasksService.insertTask(tasklistId, taskData);
    } catch (error: any) {
        console.error('IPC google:tasks:add error:', error);
        return { error: error.message };
    }
});

ipcMain.handle('google:tasks:update', async (_, tasklistId, taskId, task) => {
    try {
        return await googleTasksService.updateTask(tasklistId, taskId, task);
    } catch (error: any) {
        console.error('IPC google:tasks:update error:', error);
        return { error: error.message };
    }
});

ipcMain.handle('google:tasks:delete', async (_, tasklistId, taskId) => {
    try {
        return await googleTasksService.deleteTask(tasklistId, taskId);
    } catch (error: any) {
        console.error('IPC google:tasks:delete error:', error);
        return { error: error.message };
    }
});

// ========== APP LIFECYCLE ==========

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
