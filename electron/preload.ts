import { contextBridge, ipcRenderer } from 'electron';

// File node type for notes
interface FileNode {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileNode[];
}

contextBridge.exposeInMainWorld('nexusAPI', {
    platform: process.platform,

    // Generic IPC
    send: (channel: string, data: any) => {
        const validChannels = ['toMain'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    on: (channel: string, func: any) => {
        const validChannels = ['fromMain'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },

    // ========== NOTES API ==========
    notes: {
        selectVault: (): Promise<string | null> =>
            ipcRenderer.invoke('notes:selectVault'),

        getFileTree: (vaultPath: string): Promise<FileNode[]> =>
            ipcRenderer.invoke('notes:getFileTree', vaultPath),

        readFile: (filePath: string): Promise<string | null> =>
            ipcRenderer.invoke('notes:readFile', filePath),

        writeFile: (filePath: string, content: string): Promise<boolean> =>
            ipcRenderer.invoke('notes:writeFile', filePath, content),

        createFile: (dirPath: string, fileName: string): Promise<{ success: boolean; path?: string; error?: string }> =>
            ipcRenderer.invoke('notes:createFile', dirPath, fileName),

        createFolder: (dirPath: string, folderName: string): Promise<{ success: boolean; path?: string; error?: string }> =>
            ipcRenderer.invoke('notes:createFolder', dirPath, folderName),

        delete: (itemPath: string): Promise<{ success: boolean; error?: string }> =>
            ipcRenderer.invoke('notes:delete', itemPath),

        rename: (oldPath: string, newName: string): Promise<{ success: boolean; newPath?: string; error?: string }> =>
            ipcRenderer.invoke('notes:rename', oldPath, newName),

        moveFile: (sourcePath: string, destinationPath: string): Promise<{ success: boolean; newPath?: string; error?: string }> =>
            ipcRenderer.invoke('notes:moveFile', sourcePath, destinationPath),

        ensureDir: (dirPath: string): Promise<{ success: boolean; error?: string }> =>
            ipcRenderer.invoke('notes:ensureDir', dirPath),
    },

    // ========== GOOGLE API ==========
    google: {
        checkAuth: (): Promise<boolean> => ipcRenderer.invoke('google:checkAuth'),
        signIn: (): Promise<boolean> => ipcRenderer.invoke('google:signin'),
        signOut: (): Promise<boolean> => ipcRenderer.invoke('google:signout'),
        listEvents: (timeMin: string, timeMax: string): Promise<any> => ipcRenderer.invoke('google:listEvents', timeMin, timeMax),
        addEvent: (event: any): Promise<string | { error: string }> => ipcRenderer.invoke('google:addEvent', event),
        updateEvent: (id: string, event: any): Promise<boolean | { error: string }> => ipcRenderer.invoke('google:updateEvent', id, event),
        deleteEvent: (id: string): Promise<boolean | { error: string }> => ipcRenderer.invoke('google:deleteEvent', id),

        tasks: {
            list: (tasklistId?: string): Promise<any[]> => ipcRenderer.invoke('google:tasks:list', tasklistId),
            getLists: (): Promise<any[]> => ipcRenderer.invoke('google:tasks:getLists'),
            add: (tasklistId: string | undefined, taskData: { title: string, notes?: string, due?: string }): Promise<string> => ipcRenderer.invoke('google:tasks:add', tasklistId, taskData),
            update: (tasklistId: string | undefined, taskId: string, task: any): Promise<boolean> => ipcRenderer.invoke('google:tasks:update', tasklistId, taskId, task),
            delete: (tasklistId: string | undefined, taskId: string): Promise<boolean> => ipcRenderer.invoke('google:tasks:delete', tasklistId, taskId)
        }
    },

    // ========== LEETCODE API ==========
    leetcode: {
        readCsv: (): Promise<string | null> => ipcRenderer.invoke('leetcode:readCsv'),
    }
});

// Declare types for window.nexusAPI
declare global {
    interface Window {
        nexusAPI: {
            platform: string;
            send: (channel: string, data: any) => void;
            on: (channel: string, func: any) => void;
            notes: {
                selectVault: () => Promise<string | null>;
                getFileTree: (vaultPath: string) => Promise<FileNode[]>;
                readFile: (filePath: string) => Promise<string | null>;
                writeFile: (filePath: string, content: string) => Promise<boolean>;
                createFile: (dirPath: string, fileName: string) => Promise<{ success: boolean; path?: string; error?: string }>;
                createFolder: (dirPath: string, folderName: string) => Promise<{ success: boolean; path?: string; error?: string }>;
                delete: (itemPath: string) => Promise<{ success: boolean; error?: string }>;
                rename: (oldPath: string, newName: string) => Promise<{ success: boolean; newPath?: string; error?: string }>;
                moveFile: (sourcePath: string, destinationPath: string) => Promise<{ success: boolean; newPath?: string; error?: string }>;
                ensureDir: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
            };
            leetcode: {
                readCsv: () => Promise<string | null>;
            };
            google: {
                checkAuth: () => Promise<boolean>;
                signIn: () => Promise<boolean>;
                signOut: () => Promise<boolean>;
                listEvents: (timeMin: string, timeMax: string) => Promise<any[]>;
                addEvent: (event: any) => Promise<string | { error: string }>;
                updateEvent: (id: string, event: any) => Promise<boolean | { error: string }>;
                deleteEvent: (id: string) => Promise<boolean | { error: string }>;

                tasks: {
                    list: (tasklistId?: string) => Promise<any[]>;
                    getLists: () => Promise<any[]>;
                    add: (tasklistId: string | undefined, taskData: { title: string, notes?: string, due?: string }) => Promise<string>;
                    update: (tasklistId: string | undefined, taskId: string, task: any) => Promise<boolean>;
                    delete: (tasklistId: string | undefined, taskId: string) => Promise<boolean>;
                };
            };
        };
    }
}
