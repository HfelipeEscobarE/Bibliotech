/**
*    Project     : Sample Vault (adaptado a gestión documental PDF)
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

const AppError = require('./appError');

/**
 * ValidationError: los datos enviados no pasaron los filtros.
 * Lleva el detalle por campo: { password: ['mensaje', ...], username: [...] }
 */
class ValidationError extends AppError
{
    constructor(errors)
    {
        super(400, 'VALIDATION_ERROR', 'error.validation');
        this.name = 'ValidationError';
        this.errors = errors;
    }
}

module.exports = ValidationError;
