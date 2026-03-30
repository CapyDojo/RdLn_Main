const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1260,
    height: 860,
    minWidth: 1040,
    minHeight: 720,
    backgroundColor: '#e7ddd0',
    title: 'RdLn Mock Prototype - External Word Compare',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

function isDocx(filePath) {
  return path.extname(filePath || '').toLowerCase() === '.docx';
}

function validateInputPair(basePath, changedPath) {
  if (!basePath || !changedPath) {
    return {
      ok: false,
      code: 'MISSING_FILES',
      message: 'Choose both an original and revised DOCX file.'
    };
  }

  if (!fs.existsSync(basePath) || !fs.existsSync(changedPath)) {
    return {
      ok: false,
      code: 'FILE_NOT_FOUND',
      message: 'One or both selected files do not exist on disk anymore.'
    };
  }

  if (!isDocx(basePath) || !isDocx(changedPath)) {
    return {
      ok: false,
      code: 'UNSUPPORTED_FILE_TYPE',
      message: 'This prototype supports DOCX to DOCX comparison only.'
    };
  }

  if (path.resolve(basePath) === path.resolve(changedPath)) {
    return {
      ok: false,
      code: 'SAME_FILE',
      message: 'Choose two different files.'
    };
  }

  return { ok: true };
}

function escapeForPowerShell(value) {
  return String(value).replace(/'/g, "''");
}

function buildInlineWordCompareScript(basePath, changedPath) {
  const base = escapeForPowerShell(basePath);
  const changed = escapeForPowerShell(changedPath);

  return `
$ErrorActionPreference = 'Stop'
$baseFile = '${base}'
$changedFile = '${changed}'

if (-not (Test-Path -LiteralPath $baseFile)) { throw 'Base file not found.' }
if (-not (Test-Path -LiteralPath $changedFile)) { throw 'Changed file not found.' }

$baseItem = Get-Item -LiteralPath $baseFile
if ($baseItem.IsReadOnly) {
  $baseItem.IsReadOnly = $false
}

$wdDoNotSaveChanges = 0
$wdCompareTargetNew = 2

$word = $null
$document = $null

try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $true
  $document = $word.Documents.Open($baseFile, $false, $false)
  $null = $document.Compare($changedFile, [ref]'RdLn Prototype Comparison', [ref]$wdCompareTargetNew, [ref]$true, [ref]$true)
  $word.ActiveDocument.Saved = 1
  $document.Close([ref]$wdDoNotSaveChanges)
}
finally {
  if ($document -ne $null) {
    try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($document) | Out-Null } catch {}
  }
  if ($word -ne $null) {
    try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null } catch {}
  }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
`.trim();
}

function launchWordCompare(basePath, changedPath) {
  return new Promise((resolve) => {
    const script = buildInlineWordCompareScript(basePath, changedPath);
    const child = spawn(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        script
      ],
      {
        windowsHide: true
      }
    );

    let stderr = '';
    let stdout = '';

    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    child.on('error', error => {
      resolve({
        ok: false,
        code: 'PROCESS_START_FAILED',
        message: `Failed to start Word automation bridge: ${error.message}`
      });
    });

    child.on('close', code => {
      if (code === 0) {
        resolve({
          ok: true,
          code: 'WORD_COMPARE_LAUNCHED',
          message: 'Microsoft Word compare launched. The comparison result should now be open in Word.'
        });
        return;
      }

      const detail = (stderr || stdout || '').trim();
      const normalizedDetail = detail || 'Unknown Word automation error.';

      resolve({
        ok: false,
        code: 'WORD_COMPARE_FAILED',
        message: normalizedDetail
      });
    });
  });
}

ipcMain.handle('prototype:pick-docx', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Choose DOCX File',
    properties: ['openFile'],
    filters: [
      { name: 'Word Documents', extensions: ['docx'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const filePath = result.filePaths[0];

  return {
    canceled: false,
    filePath,
    fileName: path.basename(filePath)
  };
});

ipcMain.handle('prototype:compare-in-word', async (_event, payload) => {
  const basePath = payload?.basePath || '';
  const changedPath = payload?.changedPath || '';

  const validation = validateInputPair(basePath, changedPath);
  if (!validation.ok) {
    return validation;
  }

  return launchWordCompare(basePath, changedPath);
});

ipcMain.handle('prototype:get-environment', async () => {
  return {
    platform: process.platform,
    isWindows: process.platform === 'win32'
  };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

