/**
* Project     : Sample Vault (adaptado a gestión documental PDF)
* Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
* License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
* Date        : Marzo 2026
*/

/**
 * Carga las variables de entorno desde archivo .env 
 * para no exponer claves en el código.
 * Un archivo .env es un archivo de texto plano utilizado 
 * en el desarrollo de software para almacenar variables de entorno 
 * y credenciales sensibles (claves API, credenciales de bases de datos, 
 * tokens) fuera del código fuente. Se sitúa en la raíz del proyecto, 
 * usa pares clave-valor y nunca debe subirse al control de versiones (Git). 
 */
 require('dotenv').config();

/**
 * Express es un framework web minimalista, rápido y flexible para Node.js, 
 * diseñado para facilitar la creación de aplicaciones back-end y APIs. 
 * Proporciona una capa ligera de características fundamentales, \
 * como el enrutamiento y la gestión de middleware, \
 * permitiendo construir servidores web de manera eficiente \
 * sin imponer estructuras rígidas.
 */
const express = require('express');

/**
 * Módulo/Biblioteca que permite peticiones desde el origen del frontend:
 */
const cors = require('cors');

/**
 * Módulo/Biblioteca para el manejo de rutas:
 */
const path = require('path');

/**
 * Módulo/Biblioteca para el manejo del filesystem:
 */
const fs = require('fs');

/**
 * Importar las rutas definidas arriba (API y Navegación)
 */
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const viewRoutes = require('./routes/viewRoutes');
const testsRoutes = require('./routes/testsRoutes');

// Manejo global de errores (traduce cualquier excepción a un JSON estándar)
const globalErrorMiddleware = require('./middleware/globalErrorMiddleware');

const app = express();

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Configuración de Carpetas y Rutas Estáticas ---
// Carpeta de subidas (PDF) Crear 'uploads' si no existe al iniciar el server
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
// IMPORTANTE: 'uploads' ya NO se publica con express.static. Los PDF se entregan
// únicamente por la ruta protegida GET /api/documents/:id/file (requiere token).

// Servir archivos estáticos del FRONTEND 
// (esto permite que el HTML acceda a ../css y ../js)
// Como server.js está en /backend, subimos un nivel para encontrar /frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// --- Registrar rutas de la API ---
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);

// Cualquier ruta /api que no exista responde 404 en JSON (y no con una página HTML)
app.use('/api', globalErrorMiddleware.notFound);

// --- Registrar rutas de Navegación del Frontend ---
// Se coloca al final para que actúe como capturador de rutas de UI

/**
 * Usar una variable de entorno NODE_ENV en el .env para usar
 * el modo testing o production.
 */
if (process.env.NODE_ENV === 'testing') 
{
    app.use('/', testsRoutes);
} 
else 
{
    app.use('/', viewRoutes);
}

// --- Manejo de errores global ---
// Debe registrarse al FINAL, después de todas las rutas y middlewares.
// Atrapa los errores de controladores, filtros, Multer y MySQL, y los responde
// en un formato estándar sin exponer el stack trace en producción.
app.use(globalErrorMiddleware.handle);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`==========================================`);
    console.log(`🚀 Bibliotech listo en:`);
    console.log(`   Punto de entrada: http://localhost:${PORT}`);
    console.log(`==========================================`);
});