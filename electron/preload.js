const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  resize: (width, height, isCompact) => ipcRenderer.send('resize-window', { width, height, isCompact }),
});