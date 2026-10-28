/**
* Project     : Sample Vault (adaptado a gestión documental PDF)
* Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
* License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
* Date        : Marzo 2026
*/

const fs = require('fs');
const path = require('path');
const fileHelper = require('../utils/fileHelper');
const documentRepo = require('../repositories/documentRepo');
const AppError = require('../utils/errors/appError');

/**
 * Verifica la firma real de un PDF: todo PDF válido empieza con los bytes "%PDF-".
 * El tipo MIME y la extensión los declara el cliente y se pueden falsear;
 * el contenido del archivo no.
 */
function hasPdfSignature(absolutePath)
{
    let fd;
    try
    {
        fd = fs.openSync(absolutePath, 'r');
        const buffer = Buffer.alloc(5);
        fs.readSync(fd, buffer, 0, 5, 0);
        return buffer.toString('latin1') === '%PDF-';
    }
    catch (error)
    {
        return false;
    }
    finally
    {
        if (fd !== undefined) fs.closeSync(fd);
    }
}

class DocumentController 
{
    // PÚBLICO: catálogo de documentos (solo metadatos, sin acceso al archivo)
    async getCatalog(req, res, next)
    {
        try
        {
            const documents = await documentRepo.findAll();
            res.json(documents);
        }
        catch (error)
        {
            next(error);
        }
    }

    // Documentos subidos por el usuario logueado (admin o professor)
    async getMyDocuments(req, res, next)
    {
        try
        {
            const documents = await documentRepo.findByUserId(req.userId);
            // No exponemos rutas físicas del servidor al cliente
            const safeDocuments = documents.map(({ file_path, filename, ...rest }) => rest);
            res.json(safeDocuments);
        }
        catch (error)
        {
            next(error);
        }
    }

    // Subir un documento PDF (admin o professor)
    async uploadDocument(req, res, next) 
    {
        try
        {
            // 1. Validación de archivo
            // (el formato y el tamaño los controla Multer; los datos del formulario, el filtro de la ruta)
            if (!req.file)
            {
                throw new AppError(400, 'FILE_REQUIRED', 'error.fileRequired');
            }

            // 2. Verificación del contenido real (firma %PDF-)
            if (!hasPdfSignature(req.file.path))
            {
                // (el archivo se elimina en el catch de más abajo)
                throw new AppError(400, 'INVALID_PDF_CONTENT', 'error.invalidPdfContent');
            }

            // 3. Datos del formulario (ya filtrados por la ruta)
            const { title, author, category } = req.body;

            const filename = req.file.filename;
            const filePath = `/uploads/${filename}`;

            // 4. Persistencia mediante el SP sp_create_document
            const insertId = await documentRepo.create({
                user_id: req.userId, // Proveniente del verifyToken
                filename,
                original_name: req.file.originalname,
                title,
                author: author || null,
                category: category || null,
                file_path: filePath
            });

            res.status(201).json({ 
                message: "Documento cargado exitosamente en la biblioteca.", 
                id: insertId
            });
        }
        catch (error)
        {
            // En caso de error de DB, intentar limpiar el archivo físico
            if (req.file) fileHelper.deleteFile(`/uploads/${req.file.filename}`);
            next(error);
        }
    }

    // Entregar el PDF: en línea (para leerlo en el sitio) o como descarga (?download=1)
    // Ruta protegida: requiere token. El frontend lo pide con fetch (que envía el token)
    // y lo muestra desde un Blob.
    async getFile(req, res, next)
    {
        try
        {
            const document = await documentRepo.findById(req.params.id);
            if (!document)
            {
                throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'error.documentNotFound');
            }

            const absolutePath = path.join(process.cwd(), document.file_path);
            if (!fs.existsSync(absolutePath))
            {
                throw new AppError(404, 'FILE_NOT_AVAILABLE', 'error.fileNotAvailable');
            }

            if (req.query.download === '1')
            {
                return res.download(absolutePath, document.original_name);
            }

            res.type('application/pdf');
            res.setHeader('Content-Disposition', 'inline');
            res.sendFile(absolutePath);
        }
        catch (error)
        {
            next(error);
        }
    }

    // Eliminar un documento: el admin borra cualquiera, el professor solo los suyos
    async deleteDocument(req, res, next) 
    {
        try 
        {
            const document = await documentRepo.findById(req.params.id);
            if (!document) 
            {
                throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'error.documentNotFound');
            }

            // Regla de negocio: autorización por propiedad
            if (req.userRole !== 'admin' && document.user_id !== req.userId)
            {
                throw new AppError(403, 'NOT_OWNER', 'error.notOwner');
            }

            await documentRepo.delete(document.id);
            fileHelper.deleteFile(document.file_path); 

            res.json({ message: "Registro eliminado y archivo físico removido con éxito." });
        }
        catch (error)
        {
            next(error);
        }
    }
}

module.exports = new DocumentController();
