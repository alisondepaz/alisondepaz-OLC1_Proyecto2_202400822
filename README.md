# GoScript Interpreter IDE
### Organización de Lenguajes y Compiladores 1 — Proyecto 2
**Universidad de San Carlos de Guatemala**  
Facultad de Ingeniería — Escuela de Ciencias y Sistemas  
Primer Semestre 2026

---

## Descripción

GoScript IDE es un entorno de desarrollo integrado (IDE) web para el lenguaje de programación **GoScript**, un lenguaje con sintaxis inspirada en Go. Implementa un intérprete completo con:

- Analizador léxico y sintáctico generado con **Jison**
- Intérprete de AST con recorrido de árbol
- Reportes de errores, tabla de símbolos y visualización del AST
- Editor con soporte para múltiples archivos `.gst`

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| Node.js | Entorno de ejecución del backend |
| Express.js | API REST |
| Jison | Generador de analizador léxico/sintáctico |
| JavaScript (ES6+) | Intérprete y frontend |
| HTML5 / CSS3 | Interfaz del IDE |

---

## Requisitos Previos

- [Node.js](https://nodejs.org/) v18 o superior
- npm v9 o superior

---

## Instalación y Ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/usuario/OLC1_Proyecto2_#Carnet.git
cd OLC1_Proyecto2_#Carnet

# 2. Instalar dependencias
npm install

# 3. Generar el parser desde la gramática Jison
npm run build-grammar

# 4. Iniciar el servidor
npm start
```

Luego abre tu navegador en: **http://localhost:3000**

---

## Scripts Disponibles

```bash
npm start            # Inicia el servidor en el puerto 3000
npm run build-grammar  # Regenera parser.js desde goscript.jison
```

---

## Estructura del Proyecto

```
PROYECTO2_COMPI/
├── backend/
│   ├── grammar/
│   │   └── goscript.jison      ← Gramática del lenguaje
│   ├── grammar_gen/
│   │   └── parser.js           ← Parser generado por Jison
│   ├── interpreter/
│   │   └── interpreter.js      ← Motor del intérprete
│   └── server.js               ← API REST con Express
├── frontend/
│   ├── js/
│   │   ├── api.js
│   │   ├── editor.js
│   │   └── reports.js
│   ├── index.html
│   └── style.css
├── package.json
└── README.md
```

---

## Características del Lenguaje GoScript

- Tipos primitivos: `int`, `float64`, `string`, `bool`, `rune`
- Estructuras de datos: slices (`[]int`, `[]string`, etc.) y structs
- Control de flujo: `if/else`, `for`, `switch/case`
- Funciones con parámetros y retorno
- Tipado estático con inferencia de tipo (`:=`)
- Comentarios de línea `//` y multilínea `/* */`
- Funciones embebidas: `fmt.Println`, `append`, `len`, `strconv.Atoi`, etc.

---

## Ejemplo de Código GoScript

```go
struct Persona {
    string Nombre;
    int Edad;
}

func saludar(nombre string) {
    fmt.Println("Hola,", nombre)
}

func main() {
    var edad int = 20
    nombre := "Ana"
    saludar(nombre)
    fmt.Println("Edad:", edad)

    numeros := []int{1, 2, 3, 4, 5}
    for i := 0; i < len(numeros); i++ {
        fmt.Println("Elemento:", numeros[i])
    }

    p := Persona{Nombre: "Luis", Edad: 22}
    fmt.Println(p.Nombre, p.Edad)
}
```

---

## API REST

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/run` | POST | Parsea y ejecuta código GoScript |
| `/api/analyze` | POST | Solo analiza sin ejecutar |

---

## Autor

**Nombre:** _alison de paz gomez_  
**Carné:** _202400822_  
**Sección:** _N_
