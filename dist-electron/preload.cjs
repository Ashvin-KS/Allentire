// electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("nexusAPI", {
  platform: process.platform,
  // Generic IPC
  send: (channel, data) => {
    const validChannels = ["toMain"];
    if (validChannels.includes(channel)) {
      import_electron.ipcRenderer.send(channel, data);
    }
  },
  on: (channel, func) => {
    const validChannels = ["fromMain"];
    if (validChannels.includes(channel)) {
      import_electron.ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  // ========== NOTES API ==========
  notes: {
    selectVault: () => import_electron.ipcRenderer.invoke("notes:selectVault"),
    getFileTree: (vaultPath) => import_electron.ipcRenderer.invoke("notes:getFileTree", vaultPath),
    readFile: (filePath) => import_electron.ipcRenderer.invoke("notes:readFile", filePath),
    writeFile: (filePath, content) => import_electron.ipcRenderer.invoke("notes:writeFile", filePath, content),
    createFile: (dirPath, fileName) => import_electron.ipcRenderer.invoke("notes:createFile", dirPath, fileName),
    createFolder: (dirPath, folderName) => import_electron.ipcRenderer.invoke("notes:createFolder", dirPath, folderName),
    delete: (itemPath) => import_electron.ipcRenderer.invoke("notes:delete", itemPath),
    rename: (oldPath, newName) => import_electron.ipcRenderer.invoke("notes:rename", oldPath, newName),
    moveFile: (sourcePath, destinationPath) => import_electron.ipcRenderer.invoke("notes:moveFile", sourcePath, destinationPath)
  },
  // ========== GOOGLE API ==========
  google: {
    checkAuth: () => import_electron.ipcRenderer.invoke("google:checkAuth"),
    signIn: () => import_electron.ipcRenderer.invoke("google:signin"),
    signOut: () => import_electron.ipcRenderer.invoke("google:signout"),
    listEvents: (timeMin, timeMax) => import_electron.ipcRenderer.invoke("google:listEvents", timeMin, timeMax),
    addEvent: (event) => import_electron.ipcRenderer.invoke("google:addEvent", event),
    updateEvent: (id, event) => import_electron.ipcRenderer.invoke("google:updateEvent", id, event),
    deleteEvent: (id) => import_electron.ipcRenderer.invoke("google:deleteEvent", id),
    tasks: {
      list: (tasklistId) => import_electron.ipcRenderer.invoke("google:tasks:list", tasklistId),
      getLists: () => import_electron.ipcRenderer.invoke("google:tasks:getLists"),
      add: (tasklistId, taskData) => import_electron.ipcRenderer.invoke("google:tasks:add", tasklistId, taskData),
      update: (tasklistId, taskId, task) => import_electron.ipcRenderer.invoke("google:tasks:update", tasklistId, taskId, task),
      delete: (tasklistId, taskId) => import_electron.ipcRenderer.invoke("google:tasks:delete", tasklistId, taskId)
    }
  }
});
