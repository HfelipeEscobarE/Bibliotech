/**
*    Project     : Sample Vault (adaptado a gestión documental PDF)
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

// Filtros: detectan datos mal formados antes de llegar al controlador
const filterMiddleware = require('../middleware/filterMiddleware');
const FilterHandler = require('../utils/filter/filterHandler');
const { Required, IsString, MinLength, MaxLength, Username, Password } = require('../utils/filter/rules');

// Registro: se controla el formato del usuario y la fortaleza mínima de la contraseña
const registerFilter = filterMiddleware.forBody({
    username: new FilterHandler()
        .with(new Required())
        .with(new IsString())
        .with(new MinLength(3))
        .with(new MaxLength(50))
        .with(new Username()),
    password: new FilterHandler()
        .with(new Required())
        .with(new IsString())
        .with(new Password())
});

// Login: solo se exige que lleguen los dos datos como texto. No se revelan las reglas
// de formato: ante cualquier dato incorrecto el controlador responde "credenciales inválidas".
const loginFilter = filterMiddleware.forBody({
    username: new FilterHandler().with(new Required()).with(new IsString()),
    password: new FilterHandler().with(new Required()).with(new IsString())
});

// Ruta para el registro: POST /api/auth/register
router.post('/register', registerFilter, authController.register);

// Ruta para el login: POST /api/auth/login
router.post('/login', loginFilter, authController.login);

module.exports = router;
