/**
* Project     : Sample Vault (adaptado a gestión documental PDF)
* Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
* License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
* Date        : Marzo 2026
*/

const express = require('express');
const router = express.Router();

/**
 * Módulo/Biblioteca para el manejo de rutas:
 */
const path = require('path');

// Devuelve un manejador que envía una página HTML de la carpeta frontend/html
const sendPage = (fileName) => (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/html', fileName));
};

// --- Rutas de Navegación del Frontend HTML ---
// Al entrar a http://localhost:3000/ se muestra el catálogo público
router.get('/', sendPage('catalog.html'));

// Rutas amigables para las pantallas:
router.get('/catalog', sendPage('catalog.html'));
router.get('/login', sendPage('login.html'));
router.get('/register', sendPage('register.html'));
router.get('/professor-dashboard', sendPage('professor-dashboard.html'));
router.get('/admin-dashboard', sendPage('admin-dashboard.html'));

/**
 * @refactoring poner condición para cuando pide un archivo y no una uri
 * Captura de rutas inexistentes (404)
 * Si el usuario intenta acceder a una ruta que no existe,
 * se lo lleva al catálogo, que es la página pública de entrada.
 */
router.use((req, res) => {
    // Si la petición pide un archivo (tiene extensión), mejor devolver un 404 seco
    // para no romper el debug de scripts/estilos.
    if (req.path.includes('.')) {
        return res.status(404).send('Recurso no encontrado');
    }

    // Si es una ruta de navegación (ej: /loquesea), servimos el catálogo
    res.status(404).sendFile(path.join(__dirname, '../../frontend/html/catalog.html'));
});

module.exports = router;
