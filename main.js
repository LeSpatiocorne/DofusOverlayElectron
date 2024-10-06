const { app, BrowserWindow, screen, ipcMain, globalShortcut } = require('electron')
const path = require('path')

let win;
let isAlwaysOnTop = false;
let isToggling = false;
let toggleTimeout;

function createWindow () {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  win = new BrowserWindow({
    width: Math.min(1200, width * 0.8),
    height: Math.min(800, height * 0.8),
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true, // Ajoutez cette ligne pour activer les webviews
      webSecurity: false,
      enableRemoteModule: true,
      alwaysOnTop: isAlwaysOnTop,
      enablePreferredSizeMode: true
    },
    icon: path.join(__dirname, 'assets', 'appicon', process.platform === 'win32' ? 'icon.ico' : 'icon.png')
  })

  win.loadFile('index.html')
  
  // Supprimez cette ligne pour ne pas ouvrir automatiquement les DevTools
  // win.webContents.openDevTools()

  win.webContents.on('did-finish-load', () => {
    console.log('Application chargée et prête');
  });

  win.on('always-on-top-changed', (event, isOnTop) => {
    isAlwaysOnTop = isOnTop;
    win.webContents.send('pin-status-changed', isOnTop);
  });

  win.on('minimize', () => {
    if (!isToggling) {
      win.webContents.send('window-state-changed', true);
    }
  });

  win.on('restore', () => {
    if (!isToggling) {
      win.webContents.send('window-state-changed', false);
    }
  });

  // Empêcher la fermeture de l'application avec Ctrl+W
  win.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.key.toLowerCase() === 'w') {
      event.preventDefault();
      toggleWindowState();
    }
  });

  win.on('blur', () => {
    if (isAlwaysOnTop) {
      win.setAlwaysOnTop(true, 'pop-up-menu');
      setTimeout(() => {
        win.focus();
      }, 10);
    }
  });
}

function toggleWindowState() {
  if (win && !isToggling) {
    isToggling = true;
    clearTimeout(toggleTimeout);

    if (win.isMinimized() || !win.isVisible()) {
      win.restore();
      win.show();
      win.focus();
    } else {
      win.minimize();
    }

    toggleTimeout = setTimeout(() => {
      isToggling = false;
      if (win) {
        const isMinimized = win.isMinimized();
        win.webContents.send('window-state-changed', isMinimized);
        console.log(`Fenêtre ${isMinimized ? 'minimisée' : 'restaurée'}`);
      }
    }, 300);
  }
}

function togglePinWindow() {
  if (win) {
    isAlwaysOnTop = !isAlwaysOnTop;
    win.setAlwaysOnTop(isAlwaysOnTop, 'pop-up-menu');
    console.log(`Fenêtre ${isAlwaysOnTop ? 'épinglée' : 'désépinglée'}`);
    win.webContents.send('pin-status-changed', isAlwaysOnTop);
    
    if (isAlwaysOnTop) {
      win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      win.setFullScreenable(false);
    } else {
      win.setVisibleOnAllWorkspaces(false);
      win.setFullScreenable(true);
    }
  }
}

let alwaysOnTopCheckInterval;

function checkAlwaysOnTopStatus() {
  clearInterval(alwaysOnTopCheckInterval);
  alwaysOnTopCheckInterval = setInterval(() => {
    if (win && isAlwaysOnTop && !win.isAlwaysOnTop()) {
      console.log('Correction de l\'état always-on-top');
      win.setAlwaysOnTop(true, 'floating');
    }
  }, 1000);
}

function setupIpcHandlers() {
  console.log('Configuration des gestionnaires IPC');

  ipcMain.on('minimize-window', () => {
    if (win) {
      if (win.isMinimized()) {
        win.restore();
      } else {
        win.minimize();
      }
    }
  });

  ipcMain.on('maximize-window', () => {
    console.log('Événement maximize-window reçu');
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
        console.log('Fenêtre restaurée');
      } else {
        win.maximize();
        console.log('Fenêtre maximisée');
      }
    } else {
      console.error('Fenêtre non définie lors de la tentative de maximisation/restauration');
    }
  });

  ipcMain.on('close-window', () => {
    console.log('Événement close-window reçu');
    if (win) {
      win.close();
      console.log('Fenêtre fermée');
    } else {
      console.error('Fenêtre non définie lors de la tentative de fermeture');
    }
  });

  ipcMain.on('toggle-pin-window', togglePinWindow);

  ipcMain.on('get-pin-status', (event) => {
    event.reply('pin-status', isAlwaysOnTop);
  });

  ipcMain.on('toggle-window-state', toggleWindowState);
}

app.whenReady().then(() => {
  console.log('Application prête, création de la fenêtre');
  createWindow();
  setupIpcHandlers();

  // Ajout du raccourci clavier pour ouvrir les DevTools
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (win && win.webContents) {
      win.webContents.toggleDevTools();
    }
  });

  // Ajout du raccourci global pour Ctrl+W
  globalShortcut.register('CommandOrControl+W', () => {
    toggleWindowState();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('will-quit', () => {
  // Désenregistrer tous les raccourcis globaux
  globalShortcut.unregisterAll();
})

app.on('window-all-closed', () => {
  clearInterval(alwaysOnTopCheckInterval);
  if (process.platform !== 'darwin') {
    app.quit();
  }
})
