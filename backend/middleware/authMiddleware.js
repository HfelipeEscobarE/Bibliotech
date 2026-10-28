/**
*    Project     : Sample Vault (adaptado a gestión documental PDF)
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * JSON Web Token (JWT) es un estándar abierto (RFC 7519) compacto 
 * y seguro para transmitir información entre partes como un objeto JSON. 
 * Se utiliza principalmente para autenticación y autorización en 
 * aplicaciones web, permitiendo verificar la integridad de los datos 
 * mediante una firma digital (con clave secreta o par RSA)
 */
const jwt = require('jsonwebtoken');
const AppError = require('../utils/errors/appError');

// En producción, siempre usar variables de entorno (.env):
const SECRET_KEY = process.env.JWT_SECRET;

const authMiddleware = {

    // 0. Agregar SECRET_KEY para que sea accesible al importar el objeto authMiddleware
    SECRET_KEY,

    // 1. Verifica que el usuario esté logueado
    verifyToken: (req, res, next) => {
        // Obtener el token del encabezado de la petición
        //un mejor nombre es authHeader, porque esta cabecera puede traer otra información
        //además del token:
        const authHeader = req.headers['authorization'];

        // Mejora: Validación de formato Bearer segura
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new AppError(403, 'TOKEN_MISSING', 'error.tokenMissing'));
        }

        // El token o authHeader suele venir como "Bearer <token>", aquí quitamos el "Bearer ":
        const pureToken = authHeader.split(" ")[1];

        jwt.verify(pureToken, SECRET_KEY, (err, decoded) => {
            if (err) return next(new AppError(401, 'TOKEN_INVALID', 'error.tokenInvalid'));

            // Guardamos la info del usuario decodificada en el request para usarla después:
            req.userId = decoded.id;
            req.userRole = decoded.role; // Extraemos el rol del token
            next(); // Continuar al siguiente controlador o middleware
        });
    },

    // 2. NUEVO: Verifica que el rol del usuario esté entre los permitidos.
    // Uso en las rutas, SIEMPRE después de verifyToken:
    //   router.post('/upload', verifyToken, authorize('admin', 'professor'), ...)
    //   router.get('/', verifyToken, authorize('admin', 'professor', 'student'), ...)
    authorize: (...allowedRoles) => {
        return (req, res, next) => {
            // El rol puede ser un string "professor" o un array ["professor", "admin"]
            const userRoles = Array.isArray(req.userRole) ? req.userRole : [req.userRole];
            const isAllowed = userRoles.some(role => allowedRoles.includes(role));

            if (!isAllowed) {
                return next(new AppError(403, 'ROLE_FORBIDDEN', 'error.roleForbidden'));
            }
            next();
        };
    },

    // 3. Verifica si el usuario tiene privilegios de Admin
    // Importante: Este middleware debe ir DESPUÉS de verifyToken en las rutas
    isAdmin: (req, res, next) => {
        const roles = req.userRole; // Esto puede ser un string "admin" o un array ["professor", "admin"]

        // Verificamos si el rol 'admin' está presente de forma flexible
        const hasAdminRole = Array.isArray(roles) 
            ? roles.includes('admin') 
            : roles === 'admin';

        if (!hasAdminRole) {
            return next(new AppError(403, 'ADMIN_REQUIRED', 'error.adminRequired'));
        }
        next();
    }    
};

module.exports = authMiddleware;
