const { app, BrowserWindow, Tray, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');

let tray = null;
let mainWindow = null;

// Hide the dock icon (standard for menu bar apps)
if (process.platform === 'darwin') {
  app.dock.hide();
}

// Generate a simple circular icon programmatically so the app works without external assets
function createDefaultIcon() {
  const size = 22;
  const buffer = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    // simple circle mask logic could go here, but a solid block is safer for a quick fix
    // Let's just make a simple data URI checkmark or circle
    // Actually, nativeImage.createFromDataURL is easier
  }
  // A simple white circle 16x16 base64
  const iconBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAFqADAAQAAAABAAAAFgAAAABNmzVCAAABKUlEQVQ4Ee3SMU7DQAwF0CflDlVIKJkiCxIHYB0OwBE4AAdgQeIAnIAFcQSKQAuCDUiUg8SVmzwtvxzHSUul+C+2/5/t/hK2f4Ud/riW3Z2w7/sHk8nkaZZlT9Pp9C2iH9fD4fBuv98/OueOIoLrut6macqyLGs6OTdNs3HOXW02m8cQwntE9FwUxa219jzGeJ1z7hAR31sE11ov0jRdhhBerbVPCCH8KOaJMa6I6LXf79+KomhFBFdKPY5Go5d5nrfFvEUE11o/xBjP8jxvRfQdwbXWrzHGszzPWxFD+Cj2jTG+lGV5J6L/0F9r/RBCeM3zvBURXCm1JaJ7a+2YiC6I6DkiuFLqgYiutNZ3IroxsyK4UuptPp+/iOiRiC6Z2Qj+A149x/lW5LeKAAAAAElFTkSuQmCC';
  return nativeImage.createFromDataURL(iconBase64);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 320,
    height: 600,
    show: false,
    frame: false,
    resizable: false, // We control resize via IPC
    transparent: true,
    hasShadow: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // PRODUCTION VS DEV LOADING
  if (app.isPackaged) {
    // If built (npm run dist), load the index.html from the dist folder
    // 'dist' is usually at the same level as 'electron' folder in the bundle
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load local index.html', err);
    });
  } else {
    // If dev, load localhost
    const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
    mainWindow.loadURL(startUrl);
    // Open DevTools in dev mode
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Hide window when losing focus
  mainWindow.on('blur', () => {
    if (!mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.hide();
    }
  });
}

function createTray() {
  try {
    // Try to load from file, fallback to generated if missing
    const iconPath = path.join(__dirname, '..', 'public', 'iconTemplate.png');
    
    // Create native image
    let icon = createDefaultIcon();
    try {
        // Attempt to create from path, but don't crash if fails
        const fileIcon = nativeImage.createFromPath(iconPath);
        if (!fileIcon.isEmpty()) {
            icon = fileIcon;
        }
    } catch (e) {
        console.log("Could not load icon file, using default.");
    }

    icon.setTemplateImage(true); // macOS dark/light mode compatible
    
    tray = new Tray(icon);
    tray.setTitle(''); // Empty title to just show icon
    tray.setToolTip('FocusFlow');

    tray.on('click', (event, bounds) => {
      toggleWindow(bounds);
    });

    tray.on('right-click', () => {
      app.quit();
    });
  } catch (error) {
    console.error("Error creating tray:", error);
  }
}

function toggleWindow(trayBounds) {
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    showWindow(trayBounds);
  }
}

function showWindow(trayBounds) {
  const windowBounds = mainWindow.getBounds();
  
  // Calculate position (center under tray icon)
  let x, y;
  if (trayBounds) {
     x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
     y = Math.round(trayBounds.y + trayBounds.height + 4);
  } else {
      // Fallback center
      const { width, height } = screen.getPrimaryDisplay().workAreaSize;
      x = (width / 2) - (windowBounds.width / 2);
      y = (height / 2) - (windowBounds.height / 2);
  }

  mainWindow.setPosition(x, y, false);
  mainWindow.show();
  mainWindow.focus();
}

app.whenReady().then(() => {
  createMainWindow();
  createTray();

  ipcMain.on('resize-window', (event, { width, height, isCompact }) => {
    if (mainWindow) {
        mainWindow.setSize(width, height, true);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});