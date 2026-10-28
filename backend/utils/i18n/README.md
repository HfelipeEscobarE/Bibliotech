# Módulo i18n (internacionalización)

`LanguageManager` es un **Singleton**: carga una sola vez los diccionarios de `locales/`
(`es.json`, `en.json`) y los mantiene en memoria. El resto del código solo conoce el
**nombre** de un mensaje (`'error.notFound'`), nunca su texto.

```js
const LanguageManager = require('./languageManager');
const lm = LanguageManager.getInstance();

lm.getThisMessage('filter.minLength', { min: 6 }); // 'Debe tener al menos 6 caracteres.'
lm.setLanguage('en');                              // cambia el idioma de toda la aplicación
lm.getLanguage();                                  // 'en'
```

- **Idioma inicial:** variable `DEFAULT_LANG` del `.env` (`es` o `en`). Si falta, se usa `es`.
- **Parámetros:** los marcadores `{nombre}` del texto se reemplazan con el objeto `params`.
- **Mensaje inexistente:** se usa el texto en español; si tampoco existe, se devuelve el nombre.
- **Agregar un idioma:** crear `locales/<codigo>.json` con las mismas claves que `es.json`.

Quién usa el módulo: `FilterHandler` (mensajes de los filtros) y `globalErrorMiddleware`
(mensajes de todos los errores).

Alcance actual: están traducidos los **mensajes de error**. Los mensajes de éxito de los
controladores (por ejemplo "Usuario registrado con éxito.") siguen escritos en español dentro
del controlador.
