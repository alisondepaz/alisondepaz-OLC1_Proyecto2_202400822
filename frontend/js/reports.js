function renderErrors(errors) {
  const tbody = document.getElementById('errors-body');
  tbody.innerHTML = '';

  if (!errors || errors.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="5" style="color:var(--success);padding:8px;">Sin errores.</td>';
    tbody.appendChild(tr);
    return;
  }

  errors.forEach((err, i) => {
    const tr = document.createElement('tr');
    const tipoClass = err.tipo === 'Léxico' ? 'tag-lex'
      : err.tipo === 'Sintáctico' ? 'tag-sint'
      : 'tag-sem';
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${escHtml(err.desc)}</td>
      <td>${err.line || 0}</td>
      <td>${err.col  || 0}</td>
      <td class="${tipoClass}">${escHtml(err.tipo)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderSymbols(symbols) {
  const tbody = document.getElementById('symbols-body');
  tbody.innerHTML = '';

  if (!symbols || symbols.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="6" style="color:var(--text-muted);padding:8px;">Sin símbolos.</td>';
    tbody.appendChild(tr);
    return;
  }

  symbols.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escHtml(String(s.id))}</td>
      <td>${escHtml(String(s.tipoSimbolo))}</td>
      <td>${escHtml(String(s.tipoDato))}</td>
      <td>${escHtml(String(s.ambito))}</td>
      <td>${s.line || 0}</td>
      <td>${s.col  || 0}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAST(ast) {
  const container = document.getElementById('ast-container');
  container.innerHTML = '';

  if (!ast) {
    container.innerHTML = '<p style="color:var(--text-muted);padding:12px;">Ejecuta el código para ver el AST.</p>';
    return;
  }

  const nodes = [];
  const edges = [];
  let idCounter = 0;

  function addNode(label, color) {
    const id = idCounter++;
    nodes.push({ id, label, color });
    return id;
  }

  function buildTree(node, parentId) {
    if (node === null || node === undefined) return;

    if (typeof node === 'boolean' || typeof node === 'number' || typeof node === 'string') {
      const id = addNode(String(node), '#4ade80');
      if (parentId !== undefined) edges.push([parentId, id]);
      return id;
    }

    if (Array.isArray(node)) {
      node.forEach(item => buildTree(item, parentId));
      return;
    }

    if (typeof node === 'object') {
      const type = node.type || 'Node';
      const loc  = node.line ? ` L${node.line}` : '';
      const id   = addNode(type + loc, '#7c6af7');
      if (parentId !== undefined) edges.push([parentId, id]);

      const skipKeys = ['type', 'line', 'col'];
      Object.entries(node).forEach(([key, val]) => {
        if (skipKeys.includes(key)) return;
        if (val === null || val === undefined) return;
        if (Array.isArray(val) && val.length === 0) return;

        if (typeof val === 'object' || Array.isArray(val)) {
          buildTree(val, id);
        } else {
          const childId = addNode(key + ': ' + String(val), '#60a5fa');
          edges.push([id, childId]);
        }
      });
      return id;
    }
  }

  buildTree(ast, undefined);

  const childrenMap = {};
  nodes.forEach(n => { childrenMap[n.id] = []; });
  edges.forEach(([from, to]) => { childrenMap[from].push(to); });

  const pos = {};
  const nodeW = 150, nodeH = 36, hGap = 16, vGap = 70;
  let maxX = 0, maxY = 0;

  function layoutNode(id, depth, xOffset) {
    const kids = childrenMap[id] || [];
    if (kids.length === 0) {
      pos[id] = { x: xOffset, y: depth * (nodeH + vGap) + 20 };
      maxY = Math.max(maxY, pos[id].y + nodeH);
      maxX = Math.max(maxX, pos[id].x + nodeW);
      return nodeW;
    }
    let totalW = 0;
    const kidWidths = [];
    kids.forEach(kid => {
      const w = layoutNode(kid, depth + 1, xOffset + totalW);
      kidWidths.push(w);
      totalW += w + hGap;
    });
    totalW -= hGap;
    let firstKidX = pos[kids[0]].x;
    let lastKidX  = pos[kids[kids.length - 1]].x;
    const centerX = (firstKidX + lastKidX + nodeW) / 2 - nodeW / 2;
    pos[id] = { x: centerX, y: depth * (nodeH + vGap) + 20 };
    maxY = Math.max(maxY, pos[id].y + nodeH);
    maxX = Math.max(maxX, pos[id].x + nodeW);
    return totalW;
  }

  layoutNode(0, 0, 20);
  const totalW = maxX + 40;
  const totalH = maxY + 40;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', totalW);
  svg.setAttribute('height', totalH);
  svg.style.minWidth = totalW + 'px';

  edges.forEach(([from, to]) => {
    if (pos[from] === undefined || pos[to] === undefined) return;
    const x1 = pos[from].x + nodeW/2;
    const y1 = pos[from].y + nodeH;
    const x2 = pos[to].x + nodeW/2;
    const y2 = pos[to].y;
    const cy = (y1 + y2) / 2;
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', `M${x1},${y1} C${x1},${cy} ${x2},${cy} ${x2},${y2}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#4a4a7a');
    path.setAttribute('stroke-width', '1.5');
    svg.appendChild(path);
  });

  nodes.forEach(n => {
    if (pos[n.id] === undefined) return;
    const g = document.createElementNS(svgNS, 'g');

    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', pos[n.id].x);
    rect.setAttribute('y', pos[n.id].y);
    rect.setAttribute('width', nodeW);
    rect.setAttribute('height', nodeH);
    rect.setAttribute('rx', '6');
    rect.setAttribute('fill', n.color + '22');
    rect.setAttribute('stroke', n.color);
    rect.setAttribute('stroke-width', '1.5');
    g.appendChild(rect);

    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', pos[n.id].x + nodeW/2);
    text.setAttribute('y', pos[n.id].y + nodeH/2 + 5);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#d0d0f0');
    text.setAttribute('font-size', '11');
    text.setAttribute('font-family', 'monospace');
    // Truncate long labels
    const lbl = n.label.length > 18 ? n.label.substring(0,16) + '..' : n.label;
    text.textContent = lbl;
    g.appendChild(text);

    svg.appendChild(g);
  });

  const wrapper = document.createElement('div');
  wrapper.style.overflowX = 'auto';
  wrapper.style.overflowY = 'auto';
  wrapper.style.padding = '12px';
  wrapper.style.background = 'var(--bg-editor)';
  wrapper.style.height = '100%';
  wrapper.appendChild(svg);
  container.appendChild(wrapper);
}

function buildASTNode(node, depth) {
  depth = depth || 0;
  if (node === null || node === undefined) {
    const span = document.createElement('span');
    span.className = 'ast-null';
    span.textContent = 'null';
    return span;
  }
  if (typeof node === 'boolean') {
    const span = document.createElement('span');
    span.className = 'ast-bool';
    span.textContent = String(node);
    return span;
  }
  if (typeof node === 'number') {
    const span = document.createElement('span');
    span.className = 'ast-num';
    span.textContent = String(node);
    return span;
  }
  if (typeof node === 'string') {
    const span = document.createElement('span');
    span.className = 'ast-str';
    span.textContent = '"' + node + '"';
    return span;
  }
  const span = document.createElement('span');
  span.textContent = String(node);
  return span;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}