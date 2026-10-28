const Rule = require('./rule');

// Longitud máxima de un texto (evita errores de la base por datos demasiado largos)
class MaxLength extends Rule
{
    constructor(max)
    {
        super('filter.maxLength', { max });
        this.max = max;
    }

    evaluate(target)
    {
        if (Rule.isEmpty(target) || typeof target !== 'string') return true;
        return target.length <= this.max;
    }
}

module.exports = MaxLength;
