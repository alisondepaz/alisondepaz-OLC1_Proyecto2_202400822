'use strict';

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const fs         = require('fs');
const { Interpreter } = require('./interpreter/interpreter');

let parser = null;
const parserPath = path.join(__dirname, 'grammar_gen', 'parser.js');
if (fs.existsSync(parserPath)) {
  parser = require(parserPath);
} else {
  console.warn('⚠  Parser no generado. Ejecuta: npm run build-grammar');
}

const app  = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.post('/api/run', (req, res) => {
  const { code } = req.body;
  if (!code) return res.json({ output: '', errors: [], symbols: [], ast: null });

  const errors  = [];
  let ast       = null;
  let output    = '';
  let symbols   = [];

  if (!parser) {
    errors.push({ desc: 'Parser no generado. Ejecuta: npm run build-grammar', line: 0, col: 0, tipo: 'Sistema' });
    return res.json({ output, errors, symbols, ast });
  }

  try {
    ast = parser.parse(code);
  } catch (e) {
    const msg = String(e.message || e);
    const lineMatch = msg.match(/line[: ]+(\d+)/i);
    const colMatch  = msg.match(/col(?:umn)?[: ]+(\d+)/i);
    errors.push({
      desc: `Error de sintaxis: ${msg}`,
      line: lineMatch ? parseInt(lineMatch[1]) : 0,
      col:  colMatch  ? parseInt(colMatch[1])  : 0,
      tipo: 'Sintáctico'
    });
    return res.json({ output, errors, symbols, ast });
  }

  if (ast && errors.length === 0) {
    try {
      const interp = new Interpreter();
      interp.run(ast);
      const results = interp.getResults();
      output  = results.output;
      symbols = results.symbols;
      results.errors.forEach(e => errors.push(e));
    } catch (e) {
      errors.push({ desc: `Error en ejecución: ${e.message}`, line: 0, col: 0, tipo: 'Semántico' });
    }
  }

  res.json({ output, errors, symbols, ast });
});

app.post('/api/analyze', (req, res) => {
  const { code } = req.body;
  if (!code) return res.json({ errors: [], ast: null });

  const errors = [];
  let ast = null;

  if (!parser) {
    errors.push({ desc: 'Parser no generado', line: 0, col: 0, tipo: 'Sistema' });
    return res.json({ errors, ast });
  }

  try {
    ast = parser.parse(code);
  } catch (e) {
    const msg = String(e.message || e);
    const lineMatch = msg.match(/line[: ]+(\d+)/i);
    const colMatch  = msg.match(/col(?:umn)?[: ]+(\d+)/i);
    errors.push({
      desc: `Error de sintaxis: ${msg}`,
      line: lineMatch ? parseInt(lineMatch[1]) : 0,
      col:  colMatch  ? parseInt(colMatch[1])  : 0,
      tipo: 'Sintáctico'
    });
  }

  res.json({ errors, ast });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`GoScript IDE corriendo en http://localhost:${PORT}`);
  if (!parser) console.warn('  Recuerda generar el parser: npm run build-grammar');
});