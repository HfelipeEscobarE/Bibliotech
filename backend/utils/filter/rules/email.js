const Rule = require('./rule');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Formato de correo electrónico (detecta el patrón; no comprueba que el correo exista)
class Email extends Rule
{
    constructor() { super('filter.email'); }

    evaluate(target)
    {
        if (Rule.isEmpty(target) || typeof target !== 'string') return true;
        return target.length <= 254 && EMAIL_PATTERN.test(target);
    }
}

module.exports = Email;
