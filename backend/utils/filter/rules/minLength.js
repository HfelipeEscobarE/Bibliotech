const Rule = require('./rule');

// Longitud mínima de un texto
class MinLength extends Rule
{
    constructor(min)
    {
        super('filter.minLength', { min });
        this.min = min;
    }

    evaluate(target)
    {
        if (Rule.isEmpty(target) || typeof target !== 'string') return true;
        return target.length >= this.min;
    }
}

module.exports = MinLength;
