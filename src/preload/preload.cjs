const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mh", {
  app: {
    bootstrap: () => ipcRenderer.invoke("app:bootstrap"),
    onProgress: (callback) => { const listener = (_, payload) => callback(payload); ipcRenderer.on("scan:progress", listener); return () => ipcRenderer.removeListener("scan:progress", listener); }
  },
  library: {
    addFolder: () => ipcRenderer.invoke("library:add-folder"),
    roots: () => ipcRenderer.invoke("library:roots"),
    tree: (rootId) => ipcRenderer.invoke("library:tree", rootId),
    rescan: (rootId) => ipcRenderer.invoke("library:rescan", rootId),
    cancel: (rootId) => ipcRenderer.invoke("library:cancel", rootId)
  },
  samples: {
    search: (params) => ipcRenderer.invoke("samples:search", params),
    get: (id) => ipcRenderer.invoke("samples:get", id),
    update: (id, patch) => ipcRenderer.invoke("samples:update", id, patch),
    setTags: (id, tags) => ipcRenderer.invoke("samples:set-tags", id, tags),
    previewed: (id) => ipcRenderer.send("samples:previewed", id),
    openFolder: (id) => ipcRenderer.invoke("samples:open-folder", id),
    copyPath: (id) => ipcRenderer.invoke("samples:copy-path", id),
    startDrag: (id, projectId) => ipcRenderer.send("samples:start-drag", { id, projectId }),
    saveTrimmed: (id, wavBytes, suffix) => ipcRenderer.invoke("samples:save-trimmed", { id, wavBytes, suffix }),
    saveLicense: (id, data) => ipcRenderer.invoke("samples:save-license", id, data)
  },
  projects: {
    list: () => ipcRenderer.invoke("projects:list"),
    create: (data) => ipcRenderer.invoke("projects:create", data),
    memories: (filters) => ipcRenderer.invoke("memories:list", filters),
    addMemory: (data) => ipcRenderer.invoke("memories:add", data)
  },
  safety: { duplicates: () => ipcRenderer.invoke("safety:duplicates") },
  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    update: (patch) => ipcRenderer.invoke("settings:update", patch),
    backup: () => ipcRenderer.invoke("settings:backup"),
    exportSnapshot: () => ipcRenderer.invoke("settings:export")
  }
});
