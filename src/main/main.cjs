const { app, BrowserWindow, dialog, ipcMain, shell, clipboard, protocol, net, nativeImage } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const { pathToFileURL } = require("node:url");
const { MhDatabase } = require("./database.cjs");
const { LibraryIndexer } = require("./indexer.cjs");

protocol.registerSchemesAsPrivileged([{ scheme: "mh-audio", privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);

let mainWindow; let database; let indexer;

function appPaths() {
  const base = app.getPath("userData");
  return { base, database: path.join(base, "mh-sample-fl.sqlite"), backups: path.join(base, "backups"), exports: path.join(base, "exports") };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500, height: 920, minWidth: 1080, minHeight: 680, backgroundColor: "#070a0d",
    title: "MH Sample FL",
    webPreferences: { preload: path.join(__dirname, "../preload/preload.cjs"), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) mainWindow.loadURL(devUrl); else mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));
}

function registerIpc() {
  ipcMain.handle("app:bootstrap", () => ({ roots: database.listRoots(), stats: database.stats(), projects: database.listProjects(), settings: settingsView() }));
  ipcMain.handle("library:roots", () => database.listRoots());
  ipcMain.handle("library:add-folder", async () => {
    const result = await dialog.showOpenDialog(mainWindow, { properties: ["openDirectory"], title: "Chọn thư mục sample" });
    if (result.canceled || !result.filePaths[0]) return null;
    const root = database.addRoot(path.resolve(result.filePaths[0]));
    indexer.scanRoot(root.id);
    return root;
  });
  ipcMain.handle("library:rescan", (_, rootId) => indexer.scanRoot(Number(rootId)));
  ipcMain.handle("library:cancel", (_, rootId) => indexer.cancel(Number(rootId)));

  ipcMain.handle("samples:search", (_, params) => database.searchSamples(params));
  ipcMain.handle("samples:get", (_, id) => database.getSample(Number(id)));
  ipcMain.handle("samples:update", (_, id, patch) => database.updateSample(Number(id), patch));
  ipcMain.handle("samples:set-tags", (_, id, tags) => database.setTags(Number(id), tags));
  ipcMain.on("samples:previewed", (_, id) => database.incrementPreview(Number(id)));
  ipcMain.handle("samples:open-folder", async (_, id) => {
    const sample = database.getSample(Number(id)); if (!sample) throw new Error("SAMPLE_NOT_FOUND");
    return shell.showItemInFolder(sample.path);
  });
  ipcMain.handle("samples:copy-path", (_, id) => {
    const sample = database.getSample(Number(id)); if (!sample) throw new Error("SAMPLE_NOT_FOUND");
    clipboard.writeText(sample.path); return true;
  });
  ipcMain.on("samples:start-drag", (event, { id, projectId }) => {
    const sample = database.getSample(Number(id)); if (!sample || !sample.available) return;
    const icon = nativeImage.createFromDataURL("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=");
    event.sender.startDrag({ file: sample.path, icon });
    if (projectId) database.addMemory({ project_id: Number(projectId), sample_id: sample.id, event_type: "sent_to_fl", source: "desktop_drag_accepted", confidence: 0.8 });
  });
  ipcMain.handle("samples:save-license", (_, id, data) => database.upsertLicense(Number(id), data));

  ipcMain.handle("projects:list", () => database.listProjects());
  ipcMain.handle("projects:create", (_, data) => database.createProject(data));
  ipcMain.handle("memories:list", (_, filters) => database.listMemories(filters || {}));
  ipcMain.handle("memories:add", (_, data) => database.addMemory(data));
  ipcMain.handle("safety:duplicates", () => database.duplicateGroups());

  ipcMain.handle("settings:get", () => settingsView());
  ipcMain.handle("settings:update", (_, patch) => { for (const [key, value] of Object.entries(patch || {})) database.setSetting(key, value); return settingsView(); });
  ipcMain.handle("settings:backup", async () => {
    const dirs = appPaths(); await fs.mkdir(dirs.backups, { recursive: true });
    const target = path.join(dirs.backups, `mh-sample-fl-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite`);
    await database.backup(target); return target;
  });
  ipcMain.handle("settings:export", async () => {
    const dirs = appPaths(); await fs.mkdir(dirs.exports, { recursive: true });
    const target = path.join(dirs.exports, `mh-sample-fl-export-${Date.now()}.json`);
    await fs.writeFile(target, JSON.stringify(database.exportSnapshot(), null, 2), "utf8");
    shell.showItemInFolder(target); return target;
  });
}

function settingsView() {
  return { language: database.getSetting("language", "vi"), autoplay: database.getSetting("autoplay", false), theme: "dark", paths: appPaths() };
}

app.whenReady().then(() => {
  const paths = appPaths();
  database = new MhDatabase(paths.database);
  indexer = new LibraryIndexer(database, (payload) => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("scan:progress", payload); });
  protocol.handle("mh-audio", (request) => {
    const url = new URL(request.url); const id = Number(url.pathname.replace(/^\//, ""));
    const sample = database.getSample(id);
    if (!sample || !sample.available) return new Response("Không tìm thấy sample", { status: 404 });
    return net.fetch(pathToFileURL(sample.path).toString());
  });
  registerIpc(); createWindow();
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("before-quit", () => { indexer?.close(); database?.close(); });

