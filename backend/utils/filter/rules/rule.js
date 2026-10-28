/**
*    Project     : Sample Vault (adaptado a gestión documental PDF)
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * Rule: clase base de todas las reglas (patrón Strategy).
 *
 * Contrato que cumple toda regla:
 *   evaluate(target) -> boolean       true si el dato cumple el patrón
 *   validate(target) -> null | { key, params }
 *                       null si el dato es válido; si no, el NOMBRE del mensaje
 *                       de error (y sus parámetros). La traducción al idioma
 *                       la hace el FilterHandler con el LanguageManager.
 *
 * Una regla nueva solo necesita extender Rule e implementar evaluate():
 * no se toca el FilterHandler (Principio Abierto/Cerrado).
 *
 * Convención: todas las reglas, salvo Required, dan por válido un dato vacío.
 * Así un campo opcional (por ejemplo "autor") solo se controla si viene con contenido.
 */
class Rule
{
    constructor(messageKey, params = {})
    {
        this.messageKey = messageKey;
        this.params = params;
    }

    // Debe implementarse en cada regla concreta
    evaluate(target)
    {
        throw new Error(`${this.constructor.name} must implement evaluate(target)`);
    }

    validate(target)
    {
        return this.evaluate(target) ? null : { key: this.messageKey, params: this.params };
    }

    // Un dato vacío es: undefined, null o un texto con solo espacios
    static isEmpty(value)
    {
        return value === undefined
            || value === null
            || (typeof value === 'string' && value.trim() === '');
    }
}

module.exports = Rule;
