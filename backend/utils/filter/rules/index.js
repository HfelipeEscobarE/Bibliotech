// Punto único de importación de las reglas:
//   const { Required, MinLength } = require('../utils/filter/rules');
module.exports = {
    Required: require('./required'),
    IsString: require('./isString'),
    MinLength: require('./minLength'),
    MaxLength: require('./maxLength'),
    Email: require('./email'),
    Username: require('./username'),
    Password: require('./password'),
    OneOf: require('./oneOf')
};
