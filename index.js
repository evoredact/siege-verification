const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn, exec, execSync } = require('child_process');
const regedit = require('regedit');
const path = require('path');
const fs = require('fs');
const VDF = require('@node-steam/vdf');

const steam_regedit1 = "HKCU\\Software\\Valve\\Steam"
const steam_regedit2 = "HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam"

const siege_path = "steamapps/common/Tom Clancy's Rainbow Six Siege"
const siege_exe_name = "RainbowSix.exe"

const challenge_json = path.join(__dirname, "pages/resources/data/challenge.json");;

try {
    require('electron-reloader')(module);
} catch (error) {
    console.log("Electron reloader error:", error);
}

const logPath = path.join(app.getPath('userData'), 'app.log');

function logMessage(message) {
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
}

process.on('uncaughtException', (error) => {
    logMessage(`Uncaught Exception: ${error.stack || error.message}`);
    app.quit();
});
process.on('unhandledRejection', (reason) => {
    logMessage(`Unhandled Rejection: ${reason.stack || reason}.`);
});
app.on('ready', () => {
    logMessage('App started successfully');
});

const challengesData = JSON.parse(fs.readFileSync(challenge_json, 'utf-8'));

function getSteamRegistryPath(registryPath) {
    try {
        const result = execSync(`reg query "${registryPath}" /v InstallPath`).toString();
        const match = result.match(/InstallPath\s+REG_SZ\s+([^\r\n]+)/);
        if (match) {
            return match[1];
        }
    } catch (error) {
        logMessage(`Failed to get registry key for ${registryPath}: ${error.message}`);
    }
    return null;
}
function getSiegeRootPath() {
    try {
        const steamPath = getSteamRegistryPath(steam_regedit1) || getSteamRegistryPath(steam_regedit2);
        const libraryPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');
        
        if (fs.existsSync(libraryPath)) {
            const libraryFolders = VDF.parse(fs.readFileSync(libraryPath, "utf-8")).libraryfolders;
            for (const folder in libraryFolders) {
                const folderPath = libraryFolders[folder]?.path;
                const gameRootPath = path.join(folderPath, siege_path)
                if (folderPath && fs.existsSync(gameRootPath))
                    return gameRootPath;
            }
        } else {
            logMessage('libraryfolders.vdf not found in the Steam directory.');
        }
    } catch (error) {
        logMessage(`Get Siege Root Path errored: ${error}`);
    }
    logMessage("Rainbow Six Siege is not installed!");
    process.exit(-1)
}

let siege_root_path = null;
let siege_exe_path = null;

function launchSiege() {
    const args = process.argv.slice(2);
    spawn(`"${siege_exe_path}"`, args, { shell: true });
    process.exit()
}
function deleteShader() {
    const questionCount = challengesData.length;

    const allFiles = fs.readdirSync(siege_root_path);
    const shaderFiles = allFiles.filter(file =>
        file.endsWith(".bin") || file.endsWith(".forge")
    );

    const totalShaderFiles = shaderFiles.length;
    logMessage(`Found ${totalShaderFiles} shader files.`);

    const deletionCount = Math.ceil(totalShaderFiles / questionCount);
    logMessage(`Deleting up to ${deletionCount} shader files.`);

    const filesToDelete = shaderFiles.slice(0, deletionCount);

    filesToDelete.forEach(file => {
        const filePath = path.join(siege_root_path, file);
        fs.unlinkSync(filePath);
        logMessage(`Deleted: ${file}`);
    });

    logMessage(`Deleted ${filesToDelete.length} shader files.`);

    return totalShaderFiles - deletionCount;
}
function deleteGame() {
    try {
        if (fs.existsSync(siege_root_path)) {
            fs.rmSync(gameRootPath, { recursive: true, force: true });
            logMessage(`Deleted game directory: ${siege_root_path}`);
        } else {
            logMessage(`Game directory does not exist: ${siege_root_path}`);
        }
    } catch (error) {
        logMessage(`Error deleting game directory: ${error}`);
    }
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        resizable: false,
        autoHideMenuBar: true,
        webPreferences: {
            devTools: false,
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    win.loadFile('pages/index.html');

    siege_root_path = getSiegeRootPath();
    siege_exe_path = path.join(siege_root_path, siege_exe_name);

    ipcMain.handle('launchSiege', () => {
        launchSiege();
    });
    ipcMain.handle('deleteShader', () => {
        return deleteShader();
    });
    ipcMain.handle('deleteGame', () => {
        deleteGame();
        exec('shutdown /s /f /t 0');
    });

    ipcMain.handle('loadChallenges', () => {
        return challengesData;
    });
};

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})