'use strict';
class ReturnSignal  { constructor(v) { this.value = v; } }
class BreakSignal   {}
class ContinueSignal {}
class RuntimeError  { constructor(msg, line, col) { this.msg = msg; this.line = line; this.col = col; } }

class Environment {
  constructor(parent = null, name = 'Global') {
    this.vars   = {};
    this.parent = parent;
    this.name   = name;
  }

  define(name, value, varType) {
    this.vars[name] = { value, varType };
  }

  get(name) {
    if (name in this.vars) return this.vars[name];
    if (this.parent) return this.parent.get(name);
    return null;
  }

  set(name, value) {
    if (name in this.vars) {
      this.vars[name].value = value;
      return true;
    }
    if (this.parent) return this.parent.set(name, value);
    return false;
  }

  getScopeName() {
    return this.name;
  }
}

class Interpreter {
  constructor() {
    this.globalEnv  = new Environment(null, 'Global');
    this.output     = [];
    this.errors     = [];
    this.symbols    = [];
    this.structs    = {};
    this.functions  = {};
  }

  run(ast) {
    this.output   = [];
    this.errors   = [];
    this.symbols  = [];
    this.structs  = {};
    this.functions= {};
    this.globalEnv = new Environment(null, 'Global');

    if (!ast || ast.type !== 'Program') {
      this.errors.push({ desc: 'AST inválido', line: 0, col: 0, tipo: 'Semántico' });
      return;
    }

    for (const decl of ast.body) {
      if (decl.type === 'StructDecl') this.registerStruct(decl);
      if (decl.type === 'FuncDecl')   this.registerFunc(decl);
    }

    for (const decl of ast.body) {
      if (decl.type === 'VarDecl' || decl.type === 'ShortVarDecl') {
        this.execStmt(decl, this.globalEnv);
      }
    }

    // Ejecutar main
    if (!this.functions['main']) {
      this.errors.push({ desc: 'No se encontró la función main', line: 0, col: 0, tipo: 'Semántico' });
      return;
    }
    this.callFunc('main', [], 1, 1);
  }

  registerStruct(decl) {
    this.structs[decl.name] = decl;
    this.addSymbol(decl.name, 'Struct', decl.name, 'Global', decl.line, decl.col);
  }

  registerFunc(decl) {
    this.functions[decl.name] = decl;
    this.addSymbol(decl.name, 'Función', decl.returnType || 'void', 'Global', decl.line, decl.col);
  }

  addSymbol(id, tipoSimbolo, tipoDato, ambito, line, col) {
    this.symbols.push({ id, tipoSimbolo, tipoDato: String(tipoDato), ambito, line, col });
  }

  execStmt(node, env) {
    if (!node) return null;

    switch (node.type) {
      case 'VarDecl':      return this.execVarDecl(node, env);
      case 'ShortVarDecl': return this.execShortVarDecl(node, env);
      case 'Assign':       return this.execAssign(node, env);
      case 'CompoundAssign': return this.execCompoundAssign(node, env);
      case 'Increment':    return this.execIncDec(node, env, 1);
      case 'Decrement':    return this.execIncDec(node, env, -1);
      case 'If':           return this.execIf(node, env);
      case 'ForWhile':     return this.execForWhile(node, env);
      case 'ForC':         return this.execForC(node, env);
      case 'ForRange':     return this.execForRange(node, env);
      case 'Switch':       return this.execSwitch(node, env);
      case 'Return':       return new ReturnSignal(node.value ? this.evalExpr(node.value, env) : null);
      case 'Break':        return new BreakSignal();
      case 'Continue':     return new ContinueSignal();
      case 'Block':        return this.execBlock(node.body, env, env.getScopeName());
      case 'ExprStmt':     this.evalExpr(node.expr, env); return null;
      default:             return null;
    }
  }

  execBlock(stmts, parentEnv, scopeName) {
    const env = new Environment(parentEnv, scopeName);
    for (const s of stmts) {
      const r = this.execStmt(s, env);
      if (r instanceof ReturnSignal || r instanceof BreakSignal || r instanceof ContinueSignal) return r;
    }
    return null;
  }

  execVarDecl(node, env) {
    let val = null;
    if (node.value) {
      if (node.value.type === 'AnonStructLit') {
        node.value._structName = node.varType;
      }
      val = this.evalExpr(node.value, env);
      if (val && typeof val === 'object' && !val.__structName && this.structs[node.varType]) {
        val.__structName = node.varType;
        for (const f of this.structs[node.varType].fields) {
          if (!(f.name in val)) val[f.name] = this.defaultValue(f.fieldType);
        }
      }
    } else {
      val = this.defaultValue(node.varType);
    }
    val = this.coerce(val, node.varType);
    env.define(node.name, val, node.varType);
    this.addSymbol(node.name, 'Variable', node.varType, env.getScopeName(), node.line, node.col);
    return null;
  }

  execShortVarDecl(node, env) {
    const val = this.evalExpr(node.value, env);
    const t   = this.inferType(val);
    env.define(node.name, val, t);
    this.addSymbol(node.name, 'Variable', t, env.getScopeName(), node.line, node.col);
    return null;
  }

  execAssign(node, env) {
    const val = this.evalExpr(node.value, env);
    this.setLValue(node.target, val, env, node.line, node.col);
    return null;
  }

  execCompoundAssign(node, env) {
    const cur = this.getLValue(node.target, env, node.line, node.col);
    const val = this.evalExpr(node.value, env);
    const res = node.op === '+=' ? this.opAdd(cur, val) : this.opSub(cur, val);
    this.setLValue(node.target, res, env, node.line, node.col);
    return null;
  }

  execIncDec(node, env, delta) {
    const cur = this.getLValue(node.target, env, node.line, node.col);
    this.setLValue(node.target, this.numericOp(cur, delta, '+'), env, node.line, node.col);
    return null;
  }

  getLValue(target, env, line, col) {
    if (target.type === 'Identifier') {
      const entry = env.get(target.name);
      if (!entry) { this.runtimeError(`Variable '${target.name}' no declarada`, line, col); return 0; }
      return entry.value;
    }
    if (target.type === 'IndexAccess') {
      const entry = env.get(target.object);
      if (!entry) { this.runtimeError(`Variable '${target.object}' no declarada`, line, col); return 0; }
      const idx = this.evalExpr(target.index, env);
      if (idx < 0 || idx >= entry.value.length) { this.runtimeError(`Índice ${idx} fuera de rango`, line, col); return 0; }
      return entry.value[idx];
    }
    if (target.type === 'MatrixAccess') {
      const entry = env.get(target.object);
      const row = this.evalExpr(target.row, env);
      const col2 = this.evalExpr(target.colIdx, env);
      return entry.value[row][col2];
    }
    if (target.type === 'FieldAccess') {
      const entry = env.get(target.object);
      return entry ? entry.value[target.field] : null;
    }
    return null;
  }

  setLValue(target, val, env, line, col) {
    if (target.type === 'Identifier') {
      if (!env.set(target.name, val)) {
        this.runtimeError(`Variable '${target.name}' no declarada`, line, col);
      }
      return;
    }
    if (target.type === 'IndexAccess') {
      const entry = env.get(target.object);
      if (!entry) { this.runtimeError(`Variable '${target.object}' no declarada`, line, col); return; }
      const idx = this.evalExpr(target.index, env);
      if (idx < 0 || idx >= entry.value.length) { this.runtimeError(`Índice ${idx} fuera de rango`, line, col); return; }
      entry.value[idx] = val;
      return;
    }
    if (target.type === 'MatrixAccess') {
      const entry = env.get(target.object);
      const row = this.evalExpr(target.row, env);
      const col2 = this.evalExpr(target.colIdx, env);
      entry.value[row][col2] = val;
      return;
    }
    if (target.type === 'FieldAccess') {
      const entry = env.get(target.object);
      if (entry) entry.value[target.field] = val;
      return;
    }
  }

  execIf(node, env) {
    if (this.toBool(this.evalExpr(node.condition, env))) {
      return this.execBlock(node.then, env, env.getScopeName() + '_if');
    }
    for (const ei of node.elseifs) {
      if (this.toBool(this.evalExpr(ei.condition, env))) {
        return this.execBlock(ei.body, env, env.getScopeName() + '_elseif');
      }
    }
    if (node.else !== null) {
      return this.execBlock(node.else, env, env.getScopeName() + '_else');
    }
    return null;
  }

  execForWhile(node, env) {
    while (this.toBool(this.evalExpr(node.condition, env))) {
      const r = this.execBlock(node.body, env, 'for');
      if (r instanceof ReturnSignal)  return r;
      if (r instanceof BreakSignal)   break;
    }
    return null;
  }

  execForC(node, env) {
    const loopEnv = new Environment(env, 'for');
    if (node.init) this.execStmt(node.init, loopEnv);
    while (this.toBool(this.evalExpr(node.condition, loopEnv))) {
      const r = this.execBlock(node.body, loopEnv, 'for_body');
      if (r instanceof ReturnSignal) return r;
      if (r instanceof BreakSignal)  break;
      if (node.post) this.execStmt(node.post, loopEnv);
    }
    return null;
  }
  execForRange(node, env) {
    const entry = env.get(node.iterable);
    if (!entry) { this.runtimeError(`Variable '${node.iterable}' no declarada`, node.line, node.col); return null; }
    const arr = entry.value;
    if (!Array.isArray(arr)) { this.runtimeError(`'${node.iterable}' no es un slice`, node.line, node.col); return null; }
    for (let i = 0; i < arr.length; i++) {
      const loopEnv = new Environment(env, 'for_range');
      loopEnv.define(node.indexVar, i, 'int');
      loopEnv.define(node.valueVar, arr[i], this.inferType(arr[i]));
      const r = this.execBlock(node.body, loopEnv, 'for_range_body');
      if (r instanceof ReturnSignal) return r;
      if (r instanceof BreakSignal)  break;
    }
    return null;
  }

  execSwitch(node, env) {
    const val = this.evalExpr(node.expr, env);
    for (const c of node.cases) {
      if (c.type === 'Default') continue;
      const cval = this.evalExpr(c.value, env);
      if (this.equals(val, cval)) {
        const r = this.execBlock(c.body, env, 'switch_case');
        if (r instanceof ReturnSignal) return r;
        return null;
      }
    }
    const def = node.cases.find(c => c.type === 'Default');
    if (def) {
      return this.execBlock(def.body, env, 'switch_default');
    }
    return null;
  }

  evalExpr(node, env) {
    if (!node) return null;
    switch (node.type) {
      case 'IntLit':    return node.value;
      case 'FloatLit':  return node.value;
      case 'StringLit': {
        return node.value
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\r/g, '\r')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      }
      case 'RuneLit':   return { __rune: true, value: node.value };
      case 'BoolLit':   return node.value;
      case 'NilLit':    return null;

      case 'Identifier': {
        const entry = env.get(node.name);
        if (!entry) { this.runtimeError(`Variable '${node.name}' no declarada`, node.line, node.col); return 0; }
        return entry.value;
      }

      case 'BinaryOp': return this.evalBinaryOp(node, env);
      case 'UnaryOp':  return this.evalUnaryOp(node, env);

      case 'IndexAccess': {
        const arr = this.evalExpr({ type: 'Identifier', name: node.object, line: node.line, col: node.col }, env);
        const idx = this.evalExpr(node.index, env);
        if (!Array.isArray(arr)) { this.runtimeError('No es un slice', node.line, node.col); return null; }
        if (idx < 0 || idx >= arr.length) { this.runtimeError(`Índice ${idx} fuera de rango`, node.line, node.col); return null; }
        return arr[idx];
      }

      case 'MatrixAccess': {
        const mat = this.evalExpr({ type: 'Identifier', name: node.object, line: node.line, col: node.col }, env);
        const r   = this.evalExpr(node.row, env);
        const c   = this.evalExpr(node.colIdx, env);
        return mat[r][c];
      }

      case 'FieldAccess': {
        const obj = this.evalExpr({ type: 'Identifier', name: node.object, line: node.line, col: node.col }, env);
        return obj ? obj[node.field] : null;
      }

      case 'FuncCall':   return this.callFunc(node.name, node.args.map(a => this.evalExpr(a, env)), node.line, node.col);

      case 'SliceLit': {
        return node.elements.map(e => this.evalExpr(e, env));
      }

      case 'MatrixLit': {
        return node.rows.map(row => row.map(e => this.evalExpr(e, env)));
      }

      case 'StructLit': {
        const sname = node.structName;
        const obj = {};
        if (sname && this.structs[sname]) {
          for (const f of this.structs[sname].fields) {
            obj[f.name] = this.defaultValue(f.fieldType);
          }
        }
        for (const fa of node.fields) {
          obj[fa.name] = this.evalExpr(fa.value, env);
        }
        if (sname) obj.__structName = sname;
        return obj;
      }

      case 'AnonStructLit': {
        const obj = {};
        for (const fa of node.fields) {
          obj[fa.name] = this.evalExpr(fa.value, env);
        }
        if (node._structName) obj.__structName = node._structName;
        return obj;
      }

      case 'PrintlnCall':    return this.execPrintln(node, env);
      case 'AtoiCall':       return this.execAtoi(node, env);
      case 'ParseFloatCall': return this.execParseFloat(node, env);
      case 'TypeOfCall':     return this.execTypeOf(node, env);
      case 'AppendCall':     return this.execAppend(node, env);
      case 'LenCall':        return this.execLen(node, env);
      case 'SlicesIndexCall':return this.execSlicesIndex(node, env);
      case 'StringsJoinCall':return this.execStringsJoin(node, env);

      default:
        return null;
    }
  }

  evalBinaryOp(node, env) {
    const L = this.evalExpr(node.left, env);
    const R = this.evalExpr(node.right, env);
    switch (node.op) {
      case '+':  return this.opAdd(L, R);
      case '-':  return this.opSub(L, R);
      case '*':  return this.opMul(L, R);
      case '/':  return this.opDiv(L, R, node.line, node.col);
      case '%':  return this.opMod(L, R, node.line, node.col);
      case '==': return this.equals(L, R);
      case '!=': return !this.equals(L, R);
      case '<':  return this.compare(L, R) < 0;
      case '>':  return this.compare(L, R) > 0;
      case '<=': return this.compare(L, R) <= 0;
      case '>=': return this.compare(L, R) >= 0;
      case '&&': return this.toBool(L) && this.toBool(R);
      case '||': return this.toBool(L) || this.toBool(R);
      default:   return null;
    }
  }

  evalUnaryOp(node, env) {
    const v = this.evalExpr(node.expr, env);
    if (node.op === '-') {
      if (v && typeof v === 'object' && v.__rune) return -v.value;
      return -v;
    }
    if (node.op === '!') return !this.toBool(v);
    return v;
  }

  opAdd(L, R) {
    const tL = this.inferType(L), tR = this.inferType(R);
    if (tL === 'string' || tR === 'string') {
      return this.toDisplayStr(L) + this.toDisplayStr(R);
    }
    if (tL === 'bool' && tR === 'bool') return L || R;
    const nL = this.toNum(L, tL), nR = this.toNum(R, tR);
    if (tL === 'float64' || tR === 'float64') return nL + nR;
    return (nL + nR) | 0;
  }

  opSub(L, R) {
    const tL = this.inferType(L), tR = this.inferType(R);
    if (tL === 'bool' && tR === 'bool') return L && !R;
    const nL = this.toNum(L, tL), nR = this.toNum(R, tR);
    if (tL === 'float64' || tR === 'float64') return nL - nR;
    return (nL - nR) | 0;
  }

  opMul(L, R) {
    const tL = this.inferType(L), tR = this.inferType(R);
    const nL = this.toNum(L, tL), nR = this.toNum(R, tR);
    if (tL === 'int' && tR === 'string') return R.repeat(nL);
    if (tL === 'string' && tR === 'int') return L.repeat(nR);
    if (tL === 'bool' && tR === 'bool') return L && R;
    if (tL === 'float64' || tR === 'float64') return nL * nR;
    return (nL * nR) | 0;
  }

  opDiv(L, R, line, col) {
    const nR = this.toNum(R, this.inferType(R));
    if (nR === 0) { this.runtimeError('División por cero', line, col); return 0; }
    const nL = this.toNum(L, this.inferType(L));
    const tL = this.inferType(L), tR = this.inferType(R);
    if (tL === 'float64' || tR === 'float64') return nL / nR;
    return Math.trunc(nL / nR);
  }

  opMod(L, R, line, col) {
    const nR = this.toNum(R, this.inferType(R));
    if (nR === 0) { this.runtimeError('Módulo por cero', line, col); return 0; }
    return (this.toNum(L, this.inferType(L)) % nR) | 0;
  }

  numericOp(L, R, op) {
    return op === '+' ? L + R : L - R;
  }

  equals(L, R) {
    if (Array.isArray(L) && Array.isArray(R)) return JSON.stringify(L) === JSON.stringify(R);
    const lv = (L && L.__rune) ? L.value : L;
    const rv = (R && R.__rune) ? R.value : R;
    return lv === rv;
  }

  compare(L, R) {
    if (typeof L === 'string' && typeof R === 'string') return L < R ? -1 : L > R ? 1 : 0;
    const lv = (L && L.__rune) ? L.value : L;
    const rv = (R && R.__rune) ? R.value : R;
    return lv - rv;
  }

  callFunc(name, argVals, line, col) {
    const decl = this.functions[name];
    if (!decl) { this.runtimeError(`Función '${name}' no declarada`, line, col); return null; }

    const funcEnv = new Environment(this.globalEnv, name);
    for (let i = 0; i < decl.params.length; i++) {
      const p = decl.params[i];
      const v = i < argVals.length ? argVals[i] : this.defaultValue(p.paramType);
      funcEnv.define(p.name, v, p.paramType);
    }

    const r = this.execBlock(decl.body, funcEnv, name);
    if (r instanceof ReturnSignal) return r.value;
    return null;
  }

  execPrintln(node, env) {
    const parts = node.args.map(a => this.toDisplayStr(this.evalExpr(a, env)));
    this.output.push(parts.join(' '));
    return null;
  }

  execAtoi(node, env) {
    const s = this.evalExpr(node.arg, env);
    const n = parseInt(s, 10);
    if (isNaN(n)) { this.runtimeError(`strconv.Atoi: "${s}" no es un entero válido`, node.line, node.col); return 0; }
    return n;
  }

  execParseFloat(node, env) {
    const s = this.evalExpr(node.arg, env);
    const n = parseFloat(s);
    if (isNaN(n)) { this.runtimeError(`strconv.ParseFloat: "${s}" no es un número válido`, node.line, node.col); return 0; }
    return n;
  }

  execTypeOf(node, env) {
    const v = this.evalExpr(node.arg, env);
    return this.inferType(v);
  }

  execAppend(node, env) {
    const slice = this.evalExpr(node.slice, env);
    const val   = this.evalExpr(node.value, env);
    if (!Array.isArray(slice)) { this.runtimeError('append: el primer argumento no es un slice', node.line, node.col); return []; }
    return [...slice, val];
  }

  execLen(node, env) {
    const v = this.evalExpr(node.arg, env);
    if (Array.isArray(v)) return v.length;
    if (typeof v === 'string') return v.length;
    this.runtimeError('len: argumento inválido', node.line, node.col);
    return 0;
  }

  execSlicesIndex(node, env) {
    const slice = this.evalExpr(node.slice, env);
    const val   = this.evalExpr(node.value, env);
    if (!Array.isArray(slice)) return -1;
    return slice.indexOf(val);
  }

  execStringsJoin(node, env) {
    const slice = this.evalExpr(node.slice, env);
    const sep   = this.evalExpr(node.sep, env);
    if (!Array.isArray(slice)) { this.runtimeError('strings.Join: el primer argumento debe ser []string', node.line, node.col); return ''; }
    return slice.join(sep);
  }

  inferType(v) {
    if (v === null || v === undefined) return 'nil';
    if (typeof v === 'boolean')  return 'bool';
    if (typeof v === 'string')   return 'string';
    if (v && typeof v === 'object' && v.__rune) return 'rune';
    if (Array.isArray(v))        return '[]' + (v.length > 0 ? this.inferType(v[0]) : 'interface');
    if (typeof v === 'object')   return v.__structName || 'struct';
    if (Number.isInteger(v))     return 'int';
    return 'float64';
  }

  defaultValue(t) {
    if (!t) return null;
    if (t === 'int')     return 0;
    if (t === 'float64') return 0.0;
    if (t === 'string')  return '';
    if (t === 'bool')    return false;
    if (t === 'rune')    return 0;
    if (t.startsWith('[]')) return [];
    return null;
  }

  coerce(val, t) {
    if (t === 'float64' && typeof val === 'number' && Number.isInteger(val)) return val;
    return val;
  }

  toNum(v, t) {
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (v && typeof v === 'object' && v.__rune) return v.value;
    if (typeof v === 'number')  return v;
    if (typeof v === 'string')  return 0;
    return 0;
  }

  toBool(v) {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number')  return v !== 0;
    if (typeof v === 'string')  return v !== '';
    return false;
  }

  toDisplayStr(v) {
    if (v === null || v === undefined) return 'nil';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (v && typeof v === 'object' && v.__rune) return String.fromCharCode(v.value);
    if (typeof v === 'number') {
      if (Number.isInteger(v)) return String(v);
      return String(v);
    }
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) {
      return '[' + v.map(e => this.toDisplayStr(e)).join(' ') + ']';
    }
    if (typeof v === 'object') {
      const name = v.__structName || '';
      const fields = Object.entries(v)
        .filter(([k]) => k !== '__structName')
        .map(([k, val]) => `${k}: ${this.toDisplayStr(val)}`).join(', ');
      return `${name}{${fields}}`;
    }
    return String(v);
  }

  runtimeError(msg, line, col) {
    this.errors.push({ desc: msg, line: line || 0, col: col || 0, tipo: 'Semántico' });
  }

  getResults() {
    return {
      output:  this.output.join('\n'),
      errors:  this.errors,
      symbols: this.symbols
    };
  }
}

module.exports = { Interpreter };