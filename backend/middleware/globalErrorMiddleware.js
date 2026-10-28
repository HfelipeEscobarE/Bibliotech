/**
*    Project     : Sample Vault (adaptado a gestión documental PDF)
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

const AppError = require('../utils/errors/appError');
const LanguageManager = require('../utils/i18n/languageManager');

// Códigos de error de red o de MySQL/MariaDB que significan "no hay base de datos utilizable"
const DB_UNAVAILABLE_CODES = [
    'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST',
    'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ER_CON_COUNT_ERROR'
];

/**
 * Traduce CUALQUIER error a: código HTTP, código estable y nombre del mensaje.
 */
function classify(err)
{
    // Errores esperados de la aplicación (controladores, autenticación, filtros)
    if (err instanceof AppError)
    {
        return { status: err.status, code: err.code, key: err.messageKey, params: err.params, errors: err.errors };
    }

    // Errores de Multer (carga de archivos)
    if (err.name === 'MulterError')
    {
        if (err.code === 'LIMIT_FILE_SIZE')
        {
            return { status: 413, code: 'FILE_TOO_LARGE', key: 'error.fileTooLarge' };
        }
        return { status: 400, code: 'UPLOAD_ERROR', key: 'error.upload' };
    }
    if (err.code === 'INVALID_FILE_TYPE') // lo lanza el filtro de multerConfig
    {
        return { status: 400, code: 'INVALID_FILE_TYPE', key: 'error.invalidFileType' };
    }

    // JSON mal formado en el cuerpo de la petición (lo detecta express.json)
    if (err.type === 'entity.parse.failed')
    {
        return { status: 400, code: 'MALFORMED_JSON', key: 'error.malformedJson' };
    }

    // Errores de MySQL / MariaDB
    if (err.code === 'ER_DUP_ENTRY')
    {
        return { status: 409, code: 'DUPLICATE_ENTRY', key: 'error.duplicateEntry' };
    }
    if (err.code === 'ER_DATA_TOO_LONG')
    {
        return { status: 400, code: 'DATA_TOO_LONG', key: 'error.dataTooLong' };
    }
    if (DB_UNAVAILABLE_CODES.includes(err.code))
    {
        return { status: 503, code: 'DATABASE_UNAVAILABLE', key: 'error.databaseUnavailable' };
    }

    // Otros errores 4xx que Express o sus módulos ya traen con su código HTTP
    if (Number.isInteger(err.status) && err.status >= 400 && err.status < 500)
    {
        return { status: err.status, code: 'BAD_REQUEST', key: 'error.badRequest' };
    }

    // Cualquier otra cosa es un error interno inesperado
    return { status: 500, code: 'INTERNAL_ERROR', key: 'error.internal' };
}

const globalErrorMiddleware = {

    // Rutas /api inexistentes: respuesta JSON estándar en lugar de HTML
    notFound: (req, res) => {
        const message = LanguageManager.getInstance().getThisMessage('error.notFound');
        res.status(404).json({ code: 'NOT_FOUND', message });
    },

    // Red de contención final. Express lo reconoce como manejador de errores
    // porque tiene exactamente 4 parámetros (err, req, res, next).
    handle: (err, req, res, next) => {
        // Si la respuesta ya empezó a enviarse, Express debe cerrarla él mismo
        if (res.headersSent) return next(err);

        const info = classify(err);
        const body = {
            code: info.code,
            message: LanguageManager.getInstance().getThisMessage(info.key, info.params)
        };
        if (info.errors) body.errors = info.errors; // detalle por campo (ValidationError)

        if (info.status >= 500)
        {
            // El detalle técnico queda SOLO en la consola del servidor...
            console.error('[ERROR]', err);
            // ...y se agrega a la respuesta únicamente fuera de producción
            if (process.env.NODE_ENV !== 'production')
            {
                body.debug = { message: err.message, stack: err.stack };
            }
        }

        res.status(info.status).json(body);
    }
};

module.exports = globalErrorMiddleware;
