/**
* Project     : Sample Vault (adaptado a gestión documental PDF)
* Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
* License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
* Date        : Marzo 2026
*/

const userRepo = require('../repositories/userRepo');
const documentRepo = require('../repositories/documentRepo');
const fileHelper = require('../utils/fileHelper');
const AppError = require('../utils/errors/appError');

/**
 * Los errores no se responden acá: se lanzan (AppError) o se pasan con next(error),
 * y el globalErrorMiddleware arma la respuesta traducida y sin datos técnicos.
 */
class AdminController 
{
    // Listar todos los usuarios con sus roles (vía SP sp_find_all_users)
    async getAllUsers(req, res, next)
    {
        try
        {
            const users = await userRepo.findAll();
            // El SP ya devuelve el nombre del rol gracias al JOIN interno
            res.json(users);
        }
        catch (error)
        {
            next(error);
        }
    }

    // Cambiar el rol de un usuario (por ejemplo, de student a professor).
    // Que el rol sea uno de los permitidos lo controla el filtro de la ruta (OneOf).
    async setUserRole(req, res, next)
    {
        try
        {
            const targetUserId = req.params.id;
            const { role } = req.body;

            // Regla de Negocio: un admin no puede cambiar su propio rol
            // (evita que el sistema se quede sin administradores)
            if (targetUserId == req.userId) {
                throw new AppError(403, 'CANNOT_CHANGE_OWN_ROLE', 'error.cannotChangeOwnRole');
            }

            // Cambio mediante el repositorio (SP sp_set_user_role)
            const found = await userRepo.setRole(targetUserId, role);
            if (!found) {
                throw new AppError(404, 'USER_NOT_FOUND', 'error.userNotFound');
            }

            res.json({ message: `Rol actualizado a '${role}'.` });
        }
        catch (error)
        {
            next(error);
        }
    }

    // Eliminar al usuario y sus archivos
    async deleteUser(req, res, next)
    {
        try
        {
            const targetUserId = req.params.id;
            const adminId = req.userId; // ID del administrador que realiza la acción (del JWT)

            // 1. Regla de Negocio: No permitir que un admin se elimine a sí mismo
            if (targetUserId == adminId) {
                throw new AppError(403, 'CANNOT_DELETE_SELF', 'error.cannotDeleteSelf');
            }

            // 2. Obtener sus documentos ANTES de borrar (después ya no se podrían listar)
            const userDocuments = await documentRepo.findByUserId(targetUserId);

            // 3. Proceder con la eliminación en la DB (vía SP sp_delete_user)
            const success = await userRepo.delete(targetUserId);
            if (!success) {
                throw new AppError(404, 'USER_NOT_FOUND', 'error.userNotFound');
            }

            // 4. Limpieza de archivos físicos 
            userDocuments.forEach(document => {
                fileHelper.deleteFile(document.file_path);
            });

            res.json({ 
                message: `Usuario eliminado con éxito. Se removieron ${userDocuments.length} documentos PDF.` 
            });
        }
        catch (error)
        {
            next(error);
        }
    }
}

module.exports = new AdminController();
