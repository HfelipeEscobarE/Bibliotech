# Módulo Filter (validación sintáctica)

Detecta si un dato cumple un **patrón** (formato de usuario, largo de una contraseña, valores
permitidos). No consulta la base de datos: lo que depende del sistema (¿el usuario ya existe?,
¿el documento es suyo?) es lógica de negocio y queda en los controladores.

## Relación con el diagrama de clases

| Diagrama            | Este proyecto                                              |
|---------------------|------------------------------------------------------------|
| `ValidationHandler` | `FilterHandler` (`filterHandler.js`)                       |
| `Email`, `Password` | `rules/email.js`, `rules/password.js` (+ otras reglas)     |
| `LanguageManager`   | `../i18n/languageManager.js`                               |
| `evaluate(target)`  | devuelve `true` si el dato cumple el patrón                |
| `validate(target)`  | devuelve `null` si es válido, o el **nombre** del mensaje de error |

`Rule` (`rules/rule.js`) es una clase base que evita repetir `validate()` en cada regla.
El diagrama no la dibuja; si se prefiere, se puede copiar `validate()` dentro de cada regla.

## Cómo se usa

```js
const FilterHandler = require('../utils/filter/filterHandler');
const { Required, IsString, Password } = require('../utils/filter/rules');

const passwordFilter = new FilterHandler()   // interfaz fluida: with() devuelve this
    .with(new Required())
    .with(new IsString())
    .with(new Password());

passwordFilter.validateThis('123');          // ['La contraseña debe tener al menos 6 ...']
passwordFilter.validateThis('abc123');       // []
```

En una ruta, `filterMiddleware.forBody({ campo: filtro })` aplica los filtros a `req.body` y
frena la petición con un error 400 **antes** de que llegue al controlador (Fail-Fast).

## Reglas disponibles

`Required`, `IsString`, `MinLength(n)`, `MaxLength(n)`, `Email`, `Username`,
`Password(min = 6, max = 72)`, `OneOf([...])`.

Todas, salvo `Required`, dan por válido un dato vacío: así un campo opcional solo se controla
si viene con contenido.

## Agregar una regla nueva (Principio Abierto/Cerrado)

1. Crear `rules/miRegla.js` con una clase que extienda `Rule` e implemente `evaluate(target)`.
2. Agregar el nombre del mensaje a `i18n/locales/es.json` y `en.json`.
3. Exportarla en `rules/index.js`.

No hace falta modificar `FilterHandler`.
