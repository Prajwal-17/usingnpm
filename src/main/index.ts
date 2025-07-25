import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { db } from './db'
import { users } from './db/schema'

app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-setuid-sandbox')

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  // ==================== START: MODIFIED CODE ====================
  // All database and startup logic is now wrapped in a try...catch block.
  try {
    console.log('App is ready. Initializing database...')

    // Perform database operations here, BEFORE creating the window.
    db.insert(users).values({ name: 'Alice', email: 'alice@example.com' }).run()
    console.log('Database insert successful.')

    const allUsers = db.select().from(users).all()
    console.log('Users:', allUsers)
    console.log('Database select successful.')

    // If the database code succeeds, then create the main window.
    console.log('Database initialized. Creating window...')
    createWindow()
  } catch (error) {
    // This will catch the crash and print the error to your terminal.
    console.error('!!!!!!!! A FATAL ERROR OCCURRED !!!!!!!!')
    console.error(error) // Log the full error object.
    // Quit the app gracefully.
    app.quit()
  }
  // ===================== END: MODIFIED CODE =====================

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
