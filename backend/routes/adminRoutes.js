/**
*    Project     : Sample Vault
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Importamos los middlewares centralizados
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Filtro: el rol enviado debe ser uno de los roles del sistema
const filterMiddleware = require('../middleware/filterMiddleware');
const FilterHandler = require('../utils/filter/filterHandler');
const { Required, OneOf } = require('../utils/filter/rules');

const roleFilter = filterMiddleware.forBody({
    role: new FilterHandler().with(new Required()).with(new OneOf(['admin', 'professor', 'student']))
});

/**
 * Aplicamos la cadena de seguridad a todas las rutas:
 * 1. ¿Quién sos? (verifyToken)
 * 2. ¿Tenés permiso? (isAdmin)
 */
router.use(verifyToken, isAdmin);

router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', roleFilter, adminController.setUserRole);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;