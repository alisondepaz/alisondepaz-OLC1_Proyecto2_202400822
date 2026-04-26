**MANUAL DE USUARIO**

**GoScript IDE**

Proyecto 2 --- Primer Semestre 2026


# 1. Introducción

GoScript IDE es un entorno de desarrollo integrado web diseñado para escribir, ejecutar y depurar programas en el lenguaje GoScript. Este lenguaje de programación está inspirado en Go y permite trabajar con variables, funciones, estructuras de datos (slices y structs), control de flujo, y más.

Este manual explica cómo usar todas las funciones disponibles en el IDE, desde abrir un archivo hasta interpretar los reportes generados.

## 1.1 Requisitos del Sistema 

| **Requisito**     | **Descripción**                                            |
|-------------------|------------------------------------------------------------|
| Navegador web     | Google Chrome, Firefox, Edge o cualquier navegador moderno |
| Node.js           | Versión 18 o superior (para correr el servidor)            |
| Sistema Operativo | Windows, macOS o Linux                                     |
| Conexión          | Local --- el IDE corre en http://localhost:3000            |



# 2. Cómo Iniciar el IDE 

Para abrir el GoScript IDE, sigue estos pasos:

1.  Abre una terminal en la carpeta del proyecto.

2.  Instala las dependencias (solo la primera vez): npm install

3.  Genera el parser de la gramática (solo la primera vez): npm run build-grammar

4.  Inicia el servidor: npm start

5.  Abre tu navegador y ve a: http://localhost:3000

* Consejo: Si ves el mensaje \'GoScript IDE corriendo en http://localhost:3000\' en la terminal, el servidor inició correctamente.


# 3. Descripción de la Interfaz 

La interfaz del GoScript IDE está organizada en tres áreas principales:

## 3.1 Barra de Herramientas (

En la parte superior se encuentra la barra de herramientas con los siguientes botones:

| **Botón**      | **Función**                                                          |
|----------------|----------------------------------------------------------------------|
| \+ Nuevo       | Crea una nueva pestaña con un archivo .gst en blanco                 |
| Abrir          | Abre un archivo .gst desde tu computadora                            |
| Guardar        | Guarda el contenido del archivo activo como un archivo .gst          |
| Ejecutar     | Envía el código al intérprete y muestra los resultados (botón verde) |
| Errores        | Muestra la pestaña de reporte de errores léxicos y sintácticos       |
| Tabla Símbolos | Muestra la tabla de símbolos del programa                            |
| AST            | Muestra la visualización gráfica del Árbol de Sintaxis Abstracta     |

## 3.2 Panel de Archivos

Lista todos los archivos abiertos en el IDE. Al hacer clic en un archivo, este se activa en el editor. Los archivos también se muestran como pestañas en la parte superior del editor.

* Consejo: Puedes tener múltiples archivos abiertos simultáneamente y cambiar entre ellos desde las pestañas o el panel lateral.

## 3.3 Editor de Código 

Área principal de escritura de código GoScript. Características:

- Muestra el número de línea actual en el margen izquierdo.

- Soporta múltiples pestañas de archivo.

- El placeholder \'Escribe tu código GoScript aquí\...\' se muestra cuando el archivo está vacío.

- Puedes escribir código directamente o cargar un archivo con el botón Abrir.

## 3.4 Panel de Resultados

Muestra los resultados de la ejecución divididos en cuatro pestañas:

| **Pestaña** | **Contenido**                                                                |
|-------------|------------------------------------------------------------------------------|
| Consola     | Salida impresa por fmt.Println durante la ejecución del programa             |
| Errores     | Lista de errores léxicos, sintácticos y semánticos con línea, columna y tipo |
| Símbolos    | Tabla con todas las variables, funciones y structs declarados en el programa |
| AST         | Visualización gráfica e interactiva del Árbol de Sintaxis Abstracta          |

# 4. Flujo de Uso Básico 

## 4.1 Crear y Ejecutar tu Primer Programa 

6.  Haz clic en el botón + Nuevo para crear un nuevo archivo.

7.  Escribe tu código GoScript en el editor. Por ejemplo:

func main() {

var nombre string = \"Mundo\"

fmt.Println(\"Hola,\", nombre)

}

8.  Haz clic en el botón verde  Ejecutar.

9.  Observa la salida en la pestaña Consola del panel derecho: Hola, Mundo

* Consejo: El punto de entrada del programa siempre es la función main(). Sin ella, el intérprete reportará un error.

## 4.2 Abrir un Archivo Existente 
10. Haz clic en el botón Abrir de la barra de herramientas.

11. Selecciona un archivo con extensión .gst desde tu explorador de archivos.

12. El contenido del archivo se cargará automáticamente en una nueva pestaña.

13. Presiona  Ejecutar para interpretar el código.

## 4.3 Guardar un Archivo

14. Asegúrate de que el archivo que quieres guardar esté activo (pestaña seleccionada).

15. Haz clic en el botón Guardar.

16. El navegador descargará el archivo con extensión .gst y el nombre de la pestaña.


# 5. Reportes del IDE 

## 5.1 Pestaña Consola

Muestra la salida estándar del programa. Cada llamada a fmt.Println imprime una línea en la consola. Si el programa no imprime nada, la consola aparece vacía.

Ejemplo de salida para un programa que imprime múltiples tipos:

Hola, Lucia

Edad: 19

Promedio: 81.5

Struct: Persona{Nombre: Alice, Edad: 25, EsEstudiante: true}

## 5.2 Pestaña Errores {#pestaña-errores}

Muestra una tabla con todos los errores encontrados durante el análisis. Las columnas son:

| **Columna** | **Descripción**                                        |
|-------------|--------------------------------------------------------|
| No.         | Número correlativo del error                           |
| Descripción | Mensaje explicativo del error encontrado               |
| Línea       | Número de línea donde ocurrió el error                 |
| Columna     | Posición en la línea donde ocurrió el error            |
| Tipo        | Clasificación: Léxico, Sintáctico, Semántico o Sistema |

*Consejo Si hay errores sintácticos, el intérprete no ejecutará el código. Corrige los errores y vuelve a ejecutar.

## 5.3 Pestaña Símbolos 

Muestra todas las variables, funciones y structs declarados durante la ejecución del programa. Las columnas son:

| **Columna**  | **Descripción**                                                  |
|--------------|------------------------------------------------------------------|
| ID           | Nombre del símbolo (variable, función o struct)                  |
| Tipo símbolo | Variable, Función, o Struct                                      |
| Tipo dato    | El tipo de dato (int, float64, string, \[\]int, void, etc.)      |
| Ámbito       | Dónde fue declarado (Global, main, nombre de función, for, etc.) |
| Línea        | Número de línea de la declaración                                |
| Col          | Columna de la declaración                                        |

Ejemplo de tabla de símbolos para un programa típico:

| **ID**          | **Tipo símbolo** | **Tipo dato** | **Ámbito** | **Línea** | **Col** |
|-----------------|------------------|---------------|------------|-----------|---------|
| Persona         | Struct           | Persona       | Global     | 2         | 0       |
| imprimirResumen | Función          | void          | Global     | 7         | 0       |
| main            | Función          | void          | Global     | 11        | 0       |
| edad            | Variable         | int           | main       | 12        | 0       |
| promedio        | Variable         | float64       | main       | 13        | 0       |
| numeros         | Variable         | \[\]int       | main       | 34        | 0       |
| i               | Variable         | int           | for        | 39        | 4       |

## 5.4 Pestaña AST (Árbol de Sintaxis Abstracta) 

Muestra una representación gráfica e interactiva del AST generado por el parser al analizar el código. El árbol incluye todos los nodos del programa: declaraciones, expresiones, sentencias de control, etc.

Características de la visualización:

- Nodos representados como rectángulos con bordes redondeados y colores del tema del IDE.

- Conexiones entre nodos padre e hijo mediante líneas curvas.

- Vista scrollable para programas con árboles grandes.

- Cada nodo muestra su tipo y propiedades relevantes (name, op, fieldType, etc.).


# 6. Guía Rápida del Lenguaje GoScript 

## 6.1 Declaración de Variables 

| **Sintaxis**            | **Ejemplo**         | **Descripción**                   |
|-------------------------|---------------------|-----------------------------------|
| var nombre tipo = valor | var edad int = 19   | Explícita con tipo y valor        |
| var nombre tipo         | var contador int    | Explícita sin valor (usa default) |
| nombre := valor         | nombre := \"Lucia\" | Implícita con inferencia de tipo  |

## 6.2 Tipos de Datos 

| **Tipo** | **Ejemplo**             | **Valor por defecto** |
|----------|-------------------------|-----------------------|
| int      | var x int = 10          | 0                     |
| float64  | var f float64 = 3.14    | 0.0                   |
| string   | var s string = \"hola\" | \"\"                  |
| bool     | var b bool = true       | false                 |
| rune     | var c rune = \'A\'      | 0                     |

## 6.4 Operadores 

| **Tipo**    | **Operadores**      |
|-------------|---------------------|
| Aritméticos | \+ - \* / %         |
| Comparación | == != \< \> \<= \>= |
| Lógicos     | && \|\| !           |
| Asignación  | = := += -=          |
| Incremento  | ++ \--              |

## 6.5 Control de Flujo 

**If - Else:**

if condicion {

// bloque

} else if otraCondicion {

// bloque

} else {

// bloque

}

**For (tres variantes):**

// Como while

for i \<= 5 { i++ }

// Clásico

for i := 0; i \< 10; i++ { }

// Range sobre slice

for indice, valor := range miSlice { }

**Switch:**

switch variable {

case 1:

fmt.Println(\"uno\")

case 2:

fmt.Println(\"dos\")

default:

fmt.Println(\"otro\")

}

## 6.6 Slices 

// Crear un slice

numeros := \[\]int{1, 2, 3, 4, 5}

// Acceder a elemento

fmt.Println(numeros\[0\]) // 1

// Agregar elemento

numeros = append(numeros, 6)

// Tamaño

fmt.Println(len(numeros)) // 6

## 6.7 Structs

// Definir (debe ser global)

struct Persona {

string Nombre;

int Edad;

}

// Instanciar y usar

p := Persona{Nombre: \"Ana\", Edad: 20}

fmt.Println(p.Nombre) // Ana

p.Nombre = \"Carlos\"

## 6.8 Funciones 

// Sin retorno

func saludar(nombre string) {

fmt.Println(\"Hola,\", nombre)

}

// Con retorno

func sumar(a int, b int) int {

return a + b

}

## 6.9 Funciones Embebidas

| **Función**              | **Descripción**                                        | **Ejemplo**                    |
|--------------------------|--------------------------------------------------------|--------------------------------|
| fmt.Println(\...)        | Imprime valores separados por espacio y salto de línea | fmt.Println(\"x =\", x)        |
| len(slice)               | Retorna el tamaño de un slice                          | len(numeros)                   |
| append(slice, val)       | Agrega un elemento al slice                            | append(nums, 10)               |
| slices.Index(slice, val) | Retorna el índice de la primera coincidencia o -1      | slices.Index(nums, 5)          |
| strings.Join(slice, sep) | Une los elementos de un \[\]string con un separador    | strings.Join(palabras, \", \") |
| strconv.Atoi(str)        | Convierte string a int                                 | strconv.Atoi(\"42\")           |
| strconv.ParseFloat(str)  | Convierte string a float64                             | strconv.ParseFloat(\"3.14\")   |
| reflect.TypeOf(val)      | Retorna el tipo del valor como string                  | reflect.TypeOf(x)              |

# 7. Preguntas Frecuentes

## ¿Por qué no se ejecuta mi código?

Verifica la pestaña Errores. Si hay errores sintácticos o léxicos, el intérprete no puede ejecutar el código. Corrige todos los errores marcados y vuelve a presionar Ejecutar.

## ¿Por qué aparece \'Parser no generado\'?

Debes ejecutar npm run build-grammar en la terminal antes de iniciar el servidor. Esto genera el parser.js desde la gramática Jison.

## ¿Por qué mi struct no funciona?

Los structs deben declararse en el ámbito global, fuera de cualquier función. Si los declaras dentro de main u otra función, obtendrás un error.

## ¿Puedo tener múltiples archivos abiertos?

Sí. Usa el botón + Nuevo o Abrir para agregar más archivos. Cada archivo tiene su propia pestaña en el editor. Los archivos se ejecutan de forma independiente.

## ¿Por qué \'if\' no funciona igual que en otros lenguajes?

En GoScript la condición del if NO necesita paréntesis (aunque puedes usarlos). Las llaves {} son obligatorias. Ejemplo correcto: if x \> 0 { \... }

## ¿Cómo funciona el tipado en GoScript?

GoScript usa tipado estático. Una vez declarada una variable con un tipo, no puedes cambiar su tipo. Sí puedes cambiar su valor mientras sea del mismo tipo. La única conversión implícita permitida es de int a float64.

# 8. Mensajes de Error Comunes 

| **Mensaje**                            | **Causa**                                         | **Solución**                                             |
|----------------------------------------|---------------------------------------------------|----------------------------------------------------------|
| No se encontró la función main         | El programa no tiene una función main()           | Agrega func main() { \... } al programa                  |
| Variable \'x\' no declarada            | Se usa una variable antes de declararla           | Declara la variable antes de usarla                      |
| Tipos incompatibles en asignación      | Se intenta asignar un tipo diferente al declarado | Verifica que el valor sea del mismo tipo que la variable |
| División por cero                      | Se divide un número entre cero                    | Agrega una validación antes de dividir                   |
| Índice fuera de rango                  | Se accede a un índice que no existe en el slice   | Verifica que el índice sea menor que len(slice)          |
| Error de sintaxis (línea X)            | El parser no reconoce la estructura del código    | Revisa la sintaxis en la línea indicada                  |
| Función \'X\' no declarada             | Se llama a una función que no existe              | Define la función antes de llamarla                      |
| Conversión inválida en Atoi/ParseFloat | La cadena no representa un número válido          | Verifica que la cadena contenga solo dígitos             |
