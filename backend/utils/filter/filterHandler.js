/**
*    Project     : Sample Vault (adaptado a gestión documental PDF)
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

const LanguageManager = require('../i18n/languageManager');

/**
 * FilterHandler (equivale a ValidationHandler del diagrama de clases)
 *
 * - Interfaz fluida: with() devuelve this, así que las reglas se encadenan.
 * - Strategy: no conoce reglas concretas; solo exige que cumplan evaluate() y validate().
 * - Composición con LanguageManager: es quien traduce el nombre del mensaje a texto.
 *
 * Ejemplo:
 *   const passwordFilter = new FilterHandler()
 *       .with(new Required())
 *       .with(new Password());
 *   passwordFilter.validateThis('123');  // -> ['La contraseña debe tener al menos 6 ...']
 *   passwordFilter.validateThis('123456'); // -> []
 */
class FilterHandler
{
    constructor(languageManager = LanguageManager.getInstance())
    {
        this.languageManager = languageManager;
        this.rules = [];
    }

    // Agrega una regla y devuelve this (interfaz fluida)
    with(rule)
    {
        if (!rule || typeof rule.evaluate !== 'function' || typeof rule.validate !== 'function')
        {
            throw new TypeError('A rule must implement evaluate(target) and validate(target).');
        }
        this.rules.push(rule);
        return this;
    }

    // Aplica UNA regla a un dato. Devuelve null si es válido o el mensaje de error traducido.
    validationObject(target, rule)
    {
        const failure = rule.validate(target);
        if (failure === null) return null;
        return this.languageManager.getThisMessage(failure.key, failure.params);
    }

    // Aplica TODAS las reglas a un dato. Devuelve la lista de mensajes de error (vacía si es válido).
    validateThis(target)
    {
        return this.rules
            .map(rule => this.validationObject(target, rule))
            .filter(message => message !== null);
    }
}

module.exports = FilterHandler;
