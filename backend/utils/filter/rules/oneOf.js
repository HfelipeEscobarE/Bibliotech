const Rule = require('./rule');

// El dato debe ser uno de los valores permitidos (por ejemplo, los roles del sistema)
class OneOf extends Rule
{
    constructor(options)
    {
        super('filter.oneOf', { options: options.join(', ') });
        this.options = options;
    }

    evaluate(target)
    {
        return Rule.isEmpty(target) || this.options.includes(target);
    }
}

module.exports = OneOf;
