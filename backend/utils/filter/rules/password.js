const Rule = require('./rule');

// Contraseña: mínimo 6 caracteres. El máximo es de 72 BYTES porque bcrypt
// ignora lo que exceda ese tamaño: aceptar más daría una falsa sensación de seguridad.
class Password extends Rule
{
    constructor(min = 6, max = 72)
    {
        super('filter.password', { min, max });
        this.min = min;
        this.max = max;
    }

    evaluate(target)
    {
        if (Rule.isEmpty(target) || typeof target !== 'string') return true;
        return target.length >= this.min && Buffer.byteLength(target, 'utf8') <= this.max;
    }
}

module.exports = Password;
