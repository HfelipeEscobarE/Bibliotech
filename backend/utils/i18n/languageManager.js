/**
*    Project     : Sample Vault (adaptado a gestión documental PDF)
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, 'locales');
const FALLBACK_LANGUAGE = 'es';

/**
 * LanguageManager (patrón Singleton)
 * Carga UNA SOLA VEZ los diccionarios de la carpeta locales/ y los mantiene en memoria.
 * Centraliza todos los mensajes del sistema: el resto del código solo conoce
 * el NOMBRE del mensaje (por ejemplo 'filter.required'), nunca el texto.
 *
 * Uso: const lm = LanguageManager.getInstance();
 *      lm.getThisMessage('filter.minLength', { min: 6 });
 *
 * El idioma inicial se toma de la variable DEFAULT_LANG del .env ('es' o 'en').
 */
class LanguageManager
{
    constructor()
    {
        this.dictionaries = {};
        this._loadLocales();

        const wanted = process.env.DEFAULT_LANG;
        this.language = this.dictionaries[wanted] ? wanted : FALLBACK_LANGUAGE;
    }

    // Punto de acceso único a la instancia
    static getInstance()
    {
        if (!LanguageManager._instance)
        {
            LanguageManager._instance = new LanguageManager();
        }
        return LanguageManager._instance;
    }

    // Privado por convención (guion bajo): lee todos los .json de locales/
    _loadLocales()
    {
        fs.readdirSync(LOCALES_DIR)
            .filter(file => file.endsWith('.json'))
            .forEach(file => {
                const language = path.basename(file, '.json'); // es.json -> 'es'
                this.dictionaries[language] = JSON.parse(
                    fs.readFileSync(path.join(LOCALES_DIR, file), 'utf8')
                );
            });
    }

    setLanguage(lang)
    {
        if (!this.dictionaries[lang])
        {
            throw new Error(`Unsupported language: ${lang}`);
        }
        this.language = lang;
    }

    getLanguage()
    {
        return this.language;
    }

    /**
     * Devuelve el texto de un mensaje en el idioma actual.
     * @param {string} messageName - Nombre del mensaje, ej: 'error.notFound'
     * @param {object} params - Valores para los marcadores {nombre} del texto
     * Si el mensaje no existe en el idioma actual, usa el español; si tampoco, devuelve el nombre.
     */
    getThisMessage(messageName, params = {})
    {
        const text = this.dictionaries[this.language]?.[messageName]
            ?? this.dictionaries[FALLBACK_LANGUAGE]?.[messageName]
            ?? messageName;

        return text.replace(/\{(\w+)\}/g, (placeholder, key) =>
            (key in params) ? String(params[key]) : placeholder
        );
    }
}

LanguageManager._instance = null;

module.exports = LanguageManager;
