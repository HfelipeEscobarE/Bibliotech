/**
*    Project     : Sample Vault (adaptado a gestión documental PDF)
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * AppError: error "esperado" de la aplicación (credenciales inválidas, documento
 * inexistente, falta de permisos, etc.).
 * No lleva el texto del mensaje, sino su NOMBRE (messageKey): el
 * globalErrorMiddleware lo traduce con el LanguageManager al generar la respuesta.
 *
 * Uso en un controlador:  throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'error.documentNotFound');
 */
class AppError extends Error
{
    constructor(status, code, messageKey, params = {})
    {
        super(messageKey);
        this.name = 'AppError';
        this.status = status;       // Código HTTP
        this.code = code;           // Código estable para el frontend y los tests
        this.messageKey = messageKey;
        this.params = params;
    }
}

module.exports = AppError;
