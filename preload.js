const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    launchSiege: () => ipcRenderer.invoke('launchSiege'),
    deleteShader: () => ipcRenderer.invoke('deleteShader'),
    deleteGame: () => ipcRenderer.invoke('deleteGame'),

    loadChallenges: () => ipcRenderer.invoke('loadChallenges')
});
