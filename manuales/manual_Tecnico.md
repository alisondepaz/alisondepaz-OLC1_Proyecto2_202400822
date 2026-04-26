**MANUAL TÉCNICO**

**GoScript Interpreter IDE**

Organización de Lenguajes y Compiladores 1

Universidad de San Carlos de Guatemala

Proyecto 2 --- Primer Semestre 2026



# 1. Descripción 
GoScript Interpreter IDE es una aplicación web que implementa un intérprete completo para el lenguaje de programación GoScript. El proyecto fue desarrollado para el curso de Organización de Lenguajes y Compiladores 1 y consiste en un IDE funcional con editor de código, ejecución, y reportes visuales de análisis.

GoScript es un lenguaje inspirado en Go con tipado estático, soporte para slices, structs, funciones, estructuras de control, y múltiples tipos primitivos (int, float64, string, bool, rune).

# 2. Tecnologías y Herramientas 

## 2.1 Stack Tecnológico

|                   |             |                                                    |
|-------------------|-------------|----------------------------------------------------|
| **Tecnología**    | **Versión** | **Uso**                                            |
| Node.js           | ≥ 18.x      | Entorno de ejecución del servidor backend          |
| Express.js        | 4.18.2      | Framework HTTP para la API REST del backend        |
| Jison             | 0.4.18      | Generador de analizador léxico y sintáctico (LALR) |
| JavaScript (ES6+) | Nativo      | Lógica del intérprete y frontend                   |
| HTML5 / CSS3      | Nativo      | Interfaz gráfica del IDE                           |
| CORS              | 2.8.5       | Manejo de políticas de origen cruzado              |

## 2.2 Herramientas de Desarrollo 

- Visual Studio Code --- Editor de código

- Git / GitHub --- Control de versiones

- npm --- Gestor de paquetes de Node.js

- Jison CLI --- Compilación de la gramática .jison a parser.js

# 3. Arquitectura del Sistema 

## 3.1 Estructura de Directorios 

PROYECTO2_COMPI/

├── backend/

│ ├── grammar/

│ │ └── goscript.jison ← Gramática del lenguaje

│ ├── grammar_gen/

│ │ └── parser.js ← Parser generado por Jison

│ ├── interpreter/

│ │ └── interpreter.js ← Motor del intérprete AST

│ └── server.js ← API REST con Express

├── frontend/

│ ├── js/

│ │ ├── api.js ← Comunicación con el backend

│ │ ├── editor.js ← Lógica del IDE

│ │ └── reports.js ← Renderizado de reportes

│ ├── index.html ← SPA del IDE

│ └── style.css ← Estilos del IDE

├── package.json

└── README.md

## 3.2 Flujo de Ejecución 

El sistema sigue una arquitectura cliente-servidor desacoplada:

- El usuario escribe o carga un archivo .gst en el editor del frontend.

- Al presionar Ejecutar, el frontend llama a POST /api/run con el código fuente.

- El servidor parsea el código usando el parser generado con Jison, obteniendo el AST.

- El intérprete recorre el AST ejecutando las instrucciones y recolecta la salida, errores y tabla de símbolos.

- Los resultados se devuelven como JSON y el frontend los despliega en las pestañas correspondientes.

# 4. Componentes Principales 

## 4.1 Gramática --- goscript.jison 

El archivo goscript.jison define el analizador léxico y sintáctico del lenguaje GoScript mediante la herramienta Jison. Se divide en dos secciones:

**Sección Léxica (%lex)**

Define los tokens del lenguaje mediante expresiones regulares. Los principales grupos son:

|                     |                                                                                                           |
|---------------------|-----------------------------------------------------------------------------------------------------------|
| **Categoría**       | **Tokens Reconocidos**                                                                                    |
| Palabras reservadas | func, var, if, else, for, return, break, continue, switch, case, default, struct, range, nil, true, false |
| Tipos de datos      | int, float64, string, bool, rune                                                                          |
| Funciones embebidas | fmt.Println, strconv.Atoi, strconv.ParseFloat, reflect.TypeOf, strings.Join, slices.Index, append, len    |
| Operadores          | :=, +=, -=, ==, !=, \>=, \<=, &&, \|\|, ++, \--, +, -, \*, /, %, =, \<, \>, !                             |
| Literales           | INT_LIT, FLOAT_LIT, STRING_LIT, RUNE_LIT                                                                  |
| Identificadores     | ID: \[a-zA-Z\_\]\[a-zA-Z0-9\_\]\*                                                                         |
| Comentarios         | // línea y /\* \*/ multilínea (ignorados)                                                                 |

**Sección Sintáctica **

Define las reglas gramaticales LALR(1) y la construcción del AST. Cada producción retorna un nodo con su tipo y propiedades. La precedencia de operadores se define con %right, %left, %nonassoc siguiendo las reglas del lenguaje.

## 4.2 Intérprete

El intérprete implementa el patrón Visitor sobre el AST generado por Jison. Está compuesto por las siguientes clases:

**Clase Environment**

Gestiona los ámbitos de ejecución (scoping). Cada bloque, función y ciclo crea un nuevo Environment encadenado al padre.

|                              |                                                         |
|------------------------------|---------------------------------------------------------|
| **Método**                   | **Descripción**                                         |
| define(name, value, varType) | Declara una nueva variable en el ámbito actual          |
| get(name)                    | Busca una variable en el ámbito actual y los superiores |
| set(name, value)             | Actualiza el valor de una variable existente            |
| getScopeName()               | Retorna el nombre del ámbito (Global, main, for, etc.)  |

**Señales de Control (Signal Classes)**

Se utilizan clases de señal para implementar el flujo de control sin excepciones:

|                |                                                              |
|----------------|--------------------------------------------------------------|
| **Clase**      | **Propósito**                                                |
| ReturnSignal   | Propaga el valor de retorno de una función                   |
| BreakSignal    | Interrumpe bucles y sentencias switch                        |
| ContinueSignal | Salta a la siguiente iteración de un bucle                   |
| RuntimeError   | Encapsula errores en tiempo de ejecución con línea y columna |

**Clase Interpreter**

Núcleo del intérprete. Recorre el AST y ejecuta cada nodo:

|                                                 |                                                                |
|-------------------------------------------------|----------------------------------------------------------------|
| **Método**                                      | **Descripción**                                                |
| run(ast)                                        | Punto de entrada: registra structs, funciones y ejecuta main() |
| execStmt(node, env)                             | Despachador de sentencias por tipo de nodo                     |
| evalExpr(node, env)                             | Evaluador de expresiones, retorna valor y tipo                 |
| execBlock(stmts, parentEnv, scope)              | Ejecuta un bloque de sentencias en un nuevo ámbito             |
| execVarDecl / execShortVarDecl                  | Declaración de variables con var o :=                          |
| execIf / execForC / execForWhile / execForRange | Sentencias de control de flujo                                 |
| execSwitch                                      | Sentencia switch-case con break implícito                      |
| callFunc(name, args, line, col)                 | Invoca funciones definidas por el usuario                      |
| registerStruct / registerFunc                   | Registro global de structs y funciones                         |
| addSymbol(\...)                                 | Agrega entradas a la tabla de símbolos                         |

## 4.3 Servidor

API REST implementada con Express.js que expone dos endpoints:

|                   |            |                                                                                  |
|-------------------|------------|----------------------------------------------------------------------------------|
| **Endpoint**      | **Método** | **Descripción**                                                                  |
| POST /api/run     | POST       | Parsea el código, ejecuta el intérprete, retorna output, errores, símbolos y AST |
| POST /api/analyze | POST       | Solo realiza el análisis léxico/sintáctico sin ejecutar. Retorna errores y AST   |

## 4.4 Frontend

Interfaz de una sola página (SPA) construida con HTML5, CSS3 y JavaScript vanilla. Componentes principales:

|               |                                                                                  |
|---------------|----------------------------------------------------------------------------------|
| **Archivo**   | **Responsabilidad**                                                              |
| index.html    | Estructura del IDE: navbar, panel de archivos, editor, panel de reportes         |
| js/editor.js  | Gestión de pestañas, archivos, eventos del editor y llamadas a la API            |
| js/api.js     | Funciones fetch para comunicarse con POST /api/run y /api/analyze                |
| js/reports.js | Renderizado de la tabla de símbolos, errores y árbol AST (visualización gráfica) |
| style.css     | Tema oscuro del IDE con variables CSS personalizadas                             |

# 5. Nodos del AST

El parser genera nodos JavaScript con la propiedad type que el intérprete evalúa. Los principales tipos son:

|                           |                                                         |
|---------------------------|---------------------------------------------------------|
| **Tipo de Nodo**          | **Descripción**                                         |
| Program                   | Nodo raíz. Contiene la lista de declaraciones globales  |
| FuncDecl                  | Declaración de función (name, params, returnType, body) |
| StructDecl                | Declaración de struct (name, fields)                    |
| VarDecl                   | Declaración var con tipo explícito                      |
| ShortVarDecl              | Declaración implícita con :=                            |
| Assign                    | Asignación simple =                                     |
| CompoundAssign            | Asignación compuesta += o -=                            |
| If                        | Sentencia if-else if-else                               |
| ForC                      | For clásico (init; cond; step)                          |
| ForWhile                  | For como while (solo condición)                         |
| ForRange                  | For range sobre un slice                                |
| Switch                    | Sentencia switch-case-default                           |
| Return / Break / Continue | Sentencias de transferencia                             |
| Block                     | Bloque independiente de sentencias                      |
| BinaryOp                  | Operación binaria (op, left, right)                     |
| UnaryOp                   | Negación unaria o lógica                                |
| Identifier                | Acceso a variable                                       |
| Literal                   | Valor literal (int, float, string, bool, rune, nil)     |
| SliceLiteral              | Literal de slice \[\]tipo{\...}                         |
| IndexAccess               | Acceso a elemento slice\[i\]                            |
| FieldAccess               | Acceso a campo struct.campo                             |
| CallExpr                  | Llamada a función o función embebida                    |
| StructInit                | Inicialización de struct Tipo{campo: val}               |

# 6. Guía de Instalación y Configuración 

## 6.1 Requisitos Previos 

|               |                            |
|---------------|----------------------------|
| **Requisito** | **Versión Mínima**         |
| Node.js       | 18.x o superior            |
| npm           | 9.x o superior             |
| Git           | Cualquier versión reciente |

## 6.2 Pasos de Instalación 

1\. Clonar el repositorio:

git clone https://github.com/usuario/OLC1_Proyecto2\_#Carnet.git

cd OLC1_Proyecto2\_#Carnet

2\. Instalar dependencias:

npm install

3\. Generar el parser desde la gramática Jison:

npm run build-grammar

Este comando ejecuta: cd backend/grammar && npx jison goscript.jison -o ../grammar_gen/parser.js

4\. Iniciar el servidor:

npm start

5\. Abrir el IDE en el navegador:

http://localhost:3000

## 6.3 Scripts Disponibles

|                       |                                                      |
|-----------------------|------------------------------------------------------|
| **Comando**           | **Descripción**                                      |
| npm start             | Inicia el servidor Express en el puerto 3000         |
| npm run build-grammar | Regenera parser.js desde goscript.jison usando Jison |

# 7. Referencia de la API REST 

## POST /api/run

Ejecuta código GoScript completo.

**Request Body:**

{ \"code\": \"func main() { fmt.Println(\\Hola\\) }\" }

**Response:**

{ \"output\": \"Hola\n\", \"errors\": \[\], \"symbols\": \[\...\], \"ast\": {\...} }

## POST /api/analyze

Solo analiza léxica y sintácticamente sin ejecutar.

**Request Body:**

{ \"code\": \"func main() { \... }\" }

**Response:**

{ \"errors\": \[\], \"ast\": {\...} }

## Estructura de un Error

|           |          |                                              |
|-----------|----------|----------------------------------------------|
| **Campo** | **Tipo** | **Descripción**                              |
| desc      | string   | Descripción del error                        |
| line      | number   | Línea donde ocurrió                          |
| col       | number   | Columna donde ocurrió                        |
| tipo      | string   | Léxico \| Sintáctico \| Semántico \| Sistema |

## Estructura de un Símbolo

|             |          |                                                       |
|-------------|----------|-------------------------------------------------------|
| **Campo**   | **Tipo** | **Descripción**                                       |
| id          | string   | Nombre del símbolo                                    |
| tipoSimbolo | string   | Variable \| Función \| Struct                         |
| tipoDato    | string   | int, float64, string, bool, rune, \[\]int, void, etc. |
| ambito      | string   | Nombre del ámbito donde fue declarado                 |
| line        | number   | Línea de declaración                                  |
| col         | number   | Columna de declaración                                |

# 8. Sistema de Tipos e Inferencia 

GoScript implementa tipado estático con inferencia de tipo en declaraciones implícitas (:=). El intérprete rastrea los tipos en tiempo de ejecución para aplicar las reglas de coerción definidas en la especificación del lenguaje.

## 8.1 Tipos Primitivos Soportados 

|          |                       |                                                    |
|----------|-----------------------|----------------------------------------------------|
| **Tipo** | **Valor por Defecto** | **Notas**                                          |
| int      | 0                     | Enteros de 32 bits                                 |
| float64  | 0.0                   | Punto flotante de 64 bits                          |
| string   | \"\"                  | Cadenas de caracteres con comilla doble            |
| bool     | false                 | true o false                                       |
| rune     | 0                     | Carácter Unicode, literal con comilla simple \'A\' |
| nil      | null                  | Valor nulo para slices y structs                   |

## 8.2 Coerción Implícita en Suma 

La operación + soporta coerción de tipos. Algunos ejemplos notables:

|               |                        |
|---------------|------------------------|
| **Operación** | **Resultado**          |
| int + float64 | float64                |
| int + string  | string (concatenación) |
| int + bool    | int (true=1, false=0)  |
| int + rune    | int (valor ASCII)      |
| int \* string | string (repetición)    |

# 9. Manejo de Errores 

El sistema recolecta errores de las tres fases del análisis sin detener la ejecución ante el primer error:

## 9.1 Errores Léxicos 

Son reportados directamente por el lexer de Jison cuando encuentra caracteres no reconocidos. En la configuración actual, los caracteres inválidos son ignorados (regla catch-all \'.\').

## 9.2 Errores Sintácticos 

Cuando el parser detecta una secuencia de tokens que no coincide con ninguna producción de la gramática, lanza una excepción que el servidor captura y convierte en un objeto de error con número de línea y columna extraído del mensaje.

## 9.3 Errores Semánticos y de Runtime 

El intérprete detecta y reporta errores como: variables no declaradas, tipos incompatibles, división por cero, acceso a índice fuera de rango, función main no encontrada, conversiones inválidas con strconv.Atoi / strconv.ParseFloat, etc.

# 10. Glosario Técnico

|                    |                                                                                                                              |
|--------------------|------------------------------------------------------------------------------------------------------------------------------|
| **Término**        | **Definición**                                                                                                               |
| AST                | Árbol de Sintaxis Abstracta. Estructura de datos en árbol que representa la estructura sintáctica del código fuente          |
| Jison              | Herramienta JavaScript para generar parsers LALR(1) a partir de una gramática BNF                                            |
| LALR(1)            | Look-Ahead Left-to-right Rightmost derivation con 1 token de anticipación. Tipo de parser generado por Jison                 |
| Token              | Unidad léxica del lenguaje (número, identificador, operador, palabra reservada, etc.)                                        |
| Environment        | Tabla de símbolos encadenada que gestiona el ámbito de las variables en tiempo de ejecución                                  |
| Scoping            | Reglas de alcance de variables. En GoScript, las variables son accesibles en el bloque donde se declaran y sus bloques hijos |
| Inferencia de tipo | Deducción automática del tipo de una variable a partir del valor asignado (:=)                                               |
| Coerción implícita | Conversión automática de tipos en operaciones aritméticas (ej: int + float64 = float64)                                      |
| Signal             | Patrón de diseño utilizado en el intérprete para propagar return, break y continue sin usar excepciones                      |
| REST API           | Interfaz de programación que usa HTTP con métodos POST/GET para la comunicación frontend-backend                             |
