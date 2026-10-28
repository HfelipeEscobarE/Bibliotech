/**
*    Project     : Sample Vault
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

const bcrypt = require('bcrypt'); // Biblioteca para encriptar contraseñas
const jwt = require('jsonwebtoken'); // Para generar tokens de sesión
const userRepo = require('../repositories/userRepo'); // Importamos el repositorio de usuarios
const AppError = require('../utils/errors/appError');

/**
 * Deserialización moderna: "Del objeto que devuelve este require, buscá la propiedad que se 
 * llame exactamente SECRET_KEY y creá una constante con ese mismo nombre y valor".
 *  */ 
const { SECRET_KEY } = require('../middleware/authMiddleware'); 

class AuthController 
{
    // Registro de usuarios
    async register(req, res, next) 
    {
        try 
        {
            const { username, password } = req.body;

            // La presencia y el formato de los datos ya los controló el filtro de la ruta.
            const hashedPassword = await bcrypt.hash(password, 10);            
            
            // Creación mediante el repositorio (que usa el SP sp_create_user)
            // El registro público SIEMPRE crea usuarios 'student'; el admin puede cambiar el rol después
            const userId = await userRepo.create(username, hashedPassword, 'student');
            
            res.status(201).json({ 
                message: "Usuario registrado con éxito.", 
                userId 
            });
        }
        catch (error)
        {
            // Un usuario duplicado (ER_DUP_ENTRY) llega al globalErrorMiddleware y se responde con 409
            next(error);
        }
    }

    // Inicio de sesión
    async login(req, res, next) 
    {
        try
        {
            const { username, password } = req.body;

            // El repositorio ahora devuelve el usuario con su ROL gracias al JOIN en el SP
            const user = await userRepo.findByUsername(username);

            if (!user || !(await bcrypt.compare(password, user.password)))
            {
                throw new AppError(401, 'INVALID_CREDENTIALS', 'error.invalidCredentials');
            }

            // Generación del Token (Payload consistente con el Middleware)
            const token = jwt.sign(
                { 
                    id: user.id, 
                    role: user.role // Este string ('admin', 'professor' o 'student') viene de la tabla roles
                }, 
                SECRET_KEY, 
                { expiresIn: '2h' }
            );

            res.json({ 
                message: "Login exitoso.", 
                token, 
                role: user.role 
            });
        }
        catch (error)
        {
            next(error);
        }
    }
}

module.exports = new AuthController();
