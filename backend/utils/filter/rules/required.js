const Rule = require('./rule');

// El dato debe existir y no estar vacío
class Required extends Rule
{
    constructor() { super('filter.required'); }

    evaluate(target)
    {
        return !Rule.isEmpty(target);
    }
}

module.exports = Required;
