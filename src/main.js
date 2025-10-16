const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialize electron-store for data persistence
const store = new Store();

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    resizable: true,
    maximizable: true,
    minimizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png'), // Optional: add an icon
    titleBarStyle: 'default',
    show: false // Don't show until ready
  });

  // Load the app
  mainWindow.loadFile('src/index.html');

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App event listeners
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for data management
ipcMain.handle('get-journal-entries', () => {
  return store.get('journalEntries', []);
});

ipcMain.handle('save-journal-entry', (event, entry) => {
  const entries = store.get('journalEntries', []);
  entries.push(entry);
  store.set('journalEntries', entries);
  return true;
});

ipcMain.handle('get-entry-by-date', (event, date) => {
  const entries = store.get('journalEntries', []);
  return entries.find(entry => entry.date === date);
});

ipcMain.handle('can-write-today', () => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const entries = store.get('journalEntries', []);
  const todayEntry = entries.find(entry => entry.date === today);
  return !todayEntry; // Can write if no entry exists for today
});

ipcMain.handle('get-today-entry', () => {
  const today = new Date().toISOString().split('T')[0];
  const entries = store.get('journalEntries', []);
  return entries.find(entry => entry.date === today);
});
