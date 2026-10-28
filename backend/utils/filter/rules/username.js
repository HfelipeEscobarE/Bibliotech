const Rule = require('./rule');

const USERNAME_PATTERN = /^[A-Za-z0-9_.-]+$/;

// Nombre de usuario: solo letras, números, guion, guion bajo y punto (sin espacios)
class Username extends Rule
{
    constructor() { super('filter.username'); }

    evaluate(target)
    {
        if (Rule.isEmpty(target) || typeof target !== 'string') return true;
        return USERNAME_PATTERN.test(target);
    }
}

module.exports = Username;
