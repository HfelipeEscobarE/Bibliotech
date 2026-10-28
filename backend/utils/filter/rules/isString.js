const Rule = require('./rule');

// El dato, si viene, debe ser un texto (rechaza objetos, arreglos y números enviados por JSON)
class IsString extends Rule
{
    constructor() { super('filter.string'); }

    evaluate(target)
    {
        return Rule.isEmpty(target) || typeof target === 'string';
    }
}

module.exports = IsString;
