/**
* Project     : Sample Vault (adaptado a gestión documental PDF)
* Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
* License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
* Date        : Marzo 2026
*/

const db = require('../config/db');

class DocumentRepository 
{
    // Insertar un nuevo registro de documento
    async create(documentData) 
    {
        const { user_id, filename, original_name, title, author, category, file_path } = documentData;
        const [rows] = await db.execute(
            'CALL sp_create_document(?, ?, ?, ?, ?, ?, ?)', 
            [user_id, filename, original_name, title, author, category, file_path]
        );
        return rows[0][0].insertId;
    }

    // Catálogo completo (no incluye rutas físicas del servidor)
    async findAll() 
    {
        const [rows] = await db.execute('CALL sp_find_all_documents()');
        return rows[0];
    }

    // Todos los documentos de un usuario
    async findByUserId(userId) 
    {
        const [rows] = await db.execute('CALL sp_find_documents_by_user(?)', [userId]);
        return rows[0];
    }

    // Buscar un documento por id (devuelve undefined si no existe)
    async findById(id) 
    {
        const [rows] = await db.execute('CALL sp_find_document_by_id(?)', [id]);
        return rows[0][0]; 
    }

    // Eliminar un documento (la verificación de dueño se hace en el controlador)
    async delete(id) 
    {
        await db.execute('CALL sp_delete_document(?)', [id]);
        return true;
    }
}

module.exports = new DocumentRepository();
