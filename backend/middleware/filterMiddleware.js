/**
*    Project     : Sample Vault (adaptado a gestión documental PDF)
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

const ValidationError = require('../utils/errors/validationError');
const fileHelper = require('../utils/fileHelper');

/**
 * Escudo preventivo de validación sintáctica (Fail-Fast).
 * Aplica los FilterHandler a los campos de req.body y, si algún dato no cumple,
 * detiene la petición ANTES de que llegue al controlador.
 *
 * Los filtros solo detectan patrones (formato, longitud, valores permitidos).
 * Las reglas que dependen del sistema (¿el usuario ya existe?, ¿el documento es suyo?)
 * siguen siendo lógica de negocio del controlador.
 */
const filterMiddleware = {

    /**
     * @param {Object<string, FilterHandler>} fieldFilters - { nombreDelCampo: FilterHandler }
     * @returns {Function} middleware de Express
     *
     * Ejemplo:
     *   router.post('/register', filterMiddleware.forBody({
     *       username: new FilterHandler().with(new Required()),
     *       password: new FilterHandler().with(new Required()).with(new Password())
     *   }), authController.register);
     */
    forBody(fieldFilters)
    {
        return (req, res, next) => {
            const body = req.body || {};
            const errors = {};

            for (const [field, handler] of Object.entries(fieldFilters))
            {
                const messages = handler.validateThis(body[field]);
                if (messages.length > 0) errors[field] = messages;
            }

            if (Object.keys(errors).length === 0) return next();

            // En las rutas de subida Multer corre ANTES (necesita leer el formulario):
            // si los datos son inválidos, el archivo ya guardado se elimina para no dejar basura.
            if (req.file) fileHelper.deleteFile(`/uploads/${req.file.filename}`);

            // El globalErrorMiddleware arma la respuesta 400 con el detalle por campo
            next(new ValidationError(errors));
        };
    }
};

module.exports = filterMiddleware;
