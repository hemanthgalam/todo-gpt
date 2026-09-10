const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const TodoGPT = require('./src/index.js');

// Instantiate and start the Express backend server
const todoGPTApp = new TodoGPT();
todoGPTApp.start();

ipcMain.handle('select-directory', async () => {
    if (!mainWindow) return null;
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Project Directory',
        properties: ['openDirectory']
    });
    if (!canceled && filePaths.length > 0) {
        return filePaths[0];
    }
    return null;
});

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1300,
        height: 900,
        title: 'SprintOps - Autonomous Agile & Development Agent',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: true
    });

    // We load the main dashboard which now includes the agent overlay!
    mainWindow.loadURL('http://localhost:3000/');

    // Handle close
    mainWindow.on('closed', function () {
        mainWindow = null;
        app.quit();
    });
}

// Request needed permissions for speech recognition
app.commandLine.appendSwitch('enable-speech-dispatcher');

app.whenReady().then(() => {
    console.log('Electron app is ready. Creating window...');
    try {
        createWindow();
        console.log('Window created successfully.');
    } catch (err) {
        console.error('Error creating window:', err);
    }

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
}).catch(err => {
    console.error('Failed to initialize electron app:', err);
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
        process.exit(0); // forcibly exit to close express server as well
    }
});
