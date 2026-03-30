const state = {
  basePath: '',
  changedPath: '',
  isBusy: false,
  isWindows: false
};

const environmentPill = document.getElementById('environment-pill');
const baseName = document.getElementById('base-name');
const basePath = document.getElementById('base-path');
const changedName = document.getElementById('changed-name');
const changedPath = document.getElementById('changed-path');
const statusPanel = document.getElementById('status-panel');
const compareButton = document.getElementById('compare-button');
const swapButton = document.getElementById('swap-button');
const pickBaseButton = document.getElementById('pick-base');
const pickChangedButton = document.getElementById('pick-changed');
const baseDropZone = document.getElementById('base-drop-zone');
const changedDropZone = document.getElementById('changed-drop-zone');

function renderFiles() {
  baseName.textContent = state.basePath ? getFileName(state.basePath) : 'No file selected';
  basePath.textContent = state.basePath || 'Select the original document.';

  changedName.textContent = state.changedPath ? getFileName(state.changedPath) : 'No file selected';
  changedPath.textContent = state.changedPath || 'Select the revised document.';
}

function renderButtons() {
  const disabled = state.isBusy || !state.isWindows;
  compareButton.disabled = disabled;
  swapButton.disabled = state.isBusy || (!state.basePath && !state.changedPath);
  pickBaseButton.disabled = state.isBusy;
  pickChangedButton.disabled = state.isBusy;
}

function setStatus(kind, message) {
  statusPanel.className = `status-panel status-panel--${kind}`;
  statusPanel.textContent = message;
}

function getFileName(filePath) {
  const pieces = filePath.split(/[/\\]/);
  return pieces[pieces.length - 1] || filePath;
}

function isDocxPath(filePath) {
  return /\.docx$/i.test(filePath || '');
}

function setFile(target, filePath) {
  if (target === 'base') {
    state.basePath = filePath;
  } else {
    state.changedPath = filePath;
  }

  renderFiles();
  renderButtons();
}

async function pickFile(target) {
  const result = await window.rdlnPrototype.pickDocx();
  if (result.canceled) {
    return;
  }

  setFile(target, result.filePath);
  setStatus('neutral', 'Files selected. Ready to launch Word compare.');
}

function markDropState(element) {
  element.classList.add('input-card--drag-over');
}

function clearDropState(element) {
  element.classList.remove('input-card--drag-over');
}

function handleDrop(target, event) {
  event.preventDefault();

  if (state.isBusy) {
    return;
  }

  const file = event.dataTransfer?.files?.[0];
  const filePath = file ? window.rdlnPrototype.getPathForFile(file) : '';

  clearDropState(event.currentTarget);

  if (!filePath) {
    setStatus('error', 'The dropped item did not provide a usable local file path.');
    return;
  }

  if (!isDocxPath(filePath)) {
    setStatus('error', 'This prototype accepts DOCX files only.');
    return;
  }

  setFile(target, filePath);
  setStatus('neutral', 'Files selected. Ready to launch Word compare.');
}

function swapFiles() {
  const nextBase = state.changedPath;
  const nextChanged = state.basePath;
  state.basePath = nextBase;
  state.changedPath = nextChanged;
  renderFiles();
  renderButtons();
  setStatus('neutral', 'Original and revised files swapped.');
}

async function compareInWord() {
  state.isBusy = true;
  renderButtons();
  setStatus('working', 'Launching Word compare...');

  const result = await window.rdlnPrototype.compareInWord({
    basePath: state.basePath,
    changedPath: state.changedPath
  });

  state.isBusy = false;
  renderButtons();

  if (result.ok) {
    setStatus('success', result.message);
    return;
  }

  setStatus('error', result.message);
}

async function bootstrap() {
  const environment = await window.rdlnPrototype.getEnvironment();
  state.isWindows = Boolean(environment.isWindows);

  if (state.isWindows) {
    environmentPill.textContent = 'Windows desktop detected';
    environmentPill.classList.add('hero__status--good');
  } else {
    environmentPill.textContent = 'Non-Windows environment';
    environmentPill.classList.add('hero__status--bad');
    setStatus('error', 'This prototype is designed for Windows only.');
  }

  renderFiles();
  renderButtons();
}

pickBaseButton.addEventListener('click', () => {
  pickFile('base');
});

pickChangedButton.addEventListener('click', () => {
  pickFile('changed');
});

swapButton.addEventListener('click', () => {
  swapFiles();
});

compareButton.addEventListener('click', () => {
  compareInWord();
});

[
  [baseDropZone, 'base'],
  [changedDropZone, 'changed']
].forEach(([element, target]) => {
  element.addEventListener('dragover', event => {
    event.preventDefault();
    if (!state.isBusy) {
      markDropState(element);
    }
  });

  element.addEventListener('dragenter', event => {
    event.preventDefault();
    if (!state.isBusy) {
      markDropState(element);
    }
  });

  element.addEventListener('dragleave', event => {
    if (event.currentTarget === element) {
      clearDropState(element);
    }
  });

  element.addEventListener('drop', event => {
    handleDrop(target, event);
  });
});

bootstrap();
