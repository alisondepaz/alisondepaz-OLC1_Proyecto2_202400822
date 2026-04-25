let files   = [];
let current = null;

function getEditor() {
  return document.getElementById('editor');
}

function getEditorText() {
  return getEditor().innerText || '';
}

function setEditorText(text) {
  const el = getEditor();
  el.innerText = text;
  updateLineNumbers();
  updateStatusBar();
}

window.addEventListener('DOMContentLoaded', () => {
  const el = getEditor();

  el.addEventListener('input', onEditorInput);
  el.addEventListener('keydown', handleTab);
  el.addEventListener('scroll', syncScroll);
  el.addEventListener('click', updateStatusBar);
  el.addEventListener('keyup', updateStatusBar);

  newFile();
  updateLineNumbers();
  updateStatusBar();
});

function newFile() {
  const id   = Date.now();
  const name = `archivo${files.length + 1}.gst`;
  files.push({ id, name, content: '' });
  switchFile(id);
  renderTabs();
  renderFileList();
}

function switchFile(id) {
  if (current !== null) {
    const f = files.find(f => f.id === current);
    if (f) f.content = getEditorText();
  }
  current = id;
  const f = files.find(f => f.id === id);
  if (!f) return;

  setEditorText(f.content);
  document.getElementById('current-filename').textContent = f.name;
  renderTabs();
  renderFileList();
  clearPanels();
}

function closeFile(id, e) {
  e.stopPropagation();
  files = files.filter(f => f.id !== id);
  if (files.length === 0) { newFile(); return; }
  if (current === id) switchFile(files[files.length - 1].id);
  renderTabs();
  renderFileList();
}

function renderTabs() {
  const c = document.getElementById('tabs-container');
  c.innerHTML = '';
  files.forEach(f => {
    const tab = document.createElement('div');
    tab.className = 'tab' + (f.id === current ? ' active' : '');
    tab.innerHTML = `<span onclick="switchFile(${f.id})">${f.name}</span>
      <button class="close-tab" onclick="closeFile(${f.id}, event)">×</button>`;
    c.appendChild(tab);
  });
}

function renderFileList() {
  const ul = document.getElementById('file-list');
  ul.innerHTML = '';
  files.forEach(f => {
    const li = document.createElement('li');
    li.className = f.id === current ? 'active' : '';
    li.textContent = f.name;
    li.onclick = () => switchFile(f.id);
    ul.appendChild(li);
  });
}

function openFile() {
  document.getElementById('file-input').click();
}

function loadFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const id = Date.now();
    files.push({ id, name: file.name, content: e.target.result });
    switchFile(id);
    renderTabs();
    renderFileList();
  };
  reader.readAsText(file);
  event.target.value = '';
}

function saveFile() {
  const f = files.find(f => f.id === current);
  if (!f) return;
  f.content = getEditorText();
  const blob = new Blob([f.content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = f.name.endsWith('.gst') ? f.name : f.name + '.gst';
  a.click();
  URL.revokeObjectURL(url);
  setStatus('Archivo guardado: ' + a.download);
}

function onEditorInput() {
  const f = files.find(f => f.id === current);
  if (f) f.content = getEditorText();
  updateLineNumbers();
  updateStatusBar();
}

function handleTab(e) {
  if (e.key !== 'Tab') return;
  e.preventDefault();
  document.execCommand('insertText', false, '    ');
  onEditorInput();
}

function syncScroll() {
  const el = getEditor();
  document.getElementById('line-numbers').scrollTop = el.scrollTop;
}

function updateLineNumbers() {
  const text  = getEditorText();
  const lines = text === '' ? 1 : text.split('\n').length;
  const ln    = document.getElementById('line-numbers');
  let html    = '';
  for (let i = 1; i <= lines; i++) html += i + '\n';
  ln.textContent = html;
}

function updateStatusBar() {
  const sel = window.getSelection();
  let line = 1, col = 1;
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0).cloneRange();
    range.collapse(true);
    const text = getEditorText();
    const offset = getTextOffset();
    const before = text.substring(0, offset);
    line = before.split('\n').length;
    col  = before.split('\n').pop().length + 1;
  }
  document.getElementById('status-pos').textContent = `Línea ${line}, Col ${col}`;
}

function getTextOffset() {
  const el  = getEditor();
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0).cloneRange();
  range.selectNodeContents(el);
  range.setEnd(sel.anchorNode, sel.anchorOffset);
  return range.toString().length;
}

async function runCode() {
  const btn = document.getElementById('btn-run');
  const f   = files.find(f => f.id === current);
  if (!f) return;
  f.content  = getEditorText();
  const code = f.content;

  btn.disabled    = true;
  btn.textContent = '⏳ Ejecutando...';
  setStatus('Ejecutando...');

  clearPanels();
  showPanelTab('console');

  const result = await apiRun(code);

  btn.disabled    = false;
  btn.textContent = '▶ Ejecutar';

  if (!result) {
    appendConsole('Error de conexión con el servidor.', 'error');
    setStatus('Error de conexión.');
    return;
  }

  if (result.output && result.output.trim()) {
    result.output.split('\n').forEach(line => appendConsole(line, 'normal'));
  } else if (!result.errors || result.errors.length === 0) {
    appendConsole('(sin salida)', 'info');
  }

  renderErrors(result.errors || []);
  renderSymbols(result.symbols || []);
  if (result.ast) renderAST(result.ast);

  const nerr = (result.errors || []).length;
  setStatus(nerr > 0 ? `${nerr} error(es) encontrado(s)` : 'Ejecución completada sin errores.');
}

function switchPanel(name, btn) {
  document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.ptab').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
}

function showPanelTab(name) {
  document.querySelectorAll('.ptab').forEach(b => {
    if (b.textContent.toLowerCase().includes(name)) b.classList.add('active');
    else b.classList.remove('active');
  });
  document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
}

function showErrors()  { switchPanel('errors',  document.querySelectorAll('.ptab')[1]); }
function showSymbols() { switchPanel('symbols', document.querySelectorAll('.ptab')[2]); }
function showAST()     { switchPanel('ast',     document.querySelectorAll('.ptab')[3]); }

function appendConsole(text, type) {
  const div  = document.getElementById('console-output');
  const span = document.createElement('div');
  span.className = 'console-line ' + (type === 'error' ? 'error' : type === 'info' ? 'info' : '');
  span.textContent = text;
  div.appendChild(span);
}

function clearPanels() {
  document.getElementById('console-output').innerHTML = '';
  document.getElementById('errors-body').innerHTML    = '';
  document.getElementById('symbols-body').innerHTML   = '';
  document.getElementById('ast-container').innerHTML  =
    '<p style="color:var(--text-muted); padding:12px;">Ejecuta el código para ver el AST.</p>';
}

function setStatus(msg) {
  document.getElementById('status-msg').textContent = msg;
}