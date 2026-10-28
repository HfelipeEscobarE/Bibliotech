/**
*    Project     : Sample Vault (adaptado a gestión documental PDF)
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * Importación del módulo multer
 * Multer es un middleware de Node.js diseñado para Express, 
 * esencial para manejar la carga de archivos (imágenes, documentos, etc.)
 * enviados en formato multipart/form-data. Simplifica la gestión 
 * de archivos al permitir configuraciones de almacenamiento en disco 
 * o memoria, filtrado de tipos y límites de tamaño, añadiendo un objeto
 * file o files al objeto request.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

// 1. Definimos la ruta absoluta al directorio de subidas
// process.cwd() apunta a la raíz del proyecto donde se ejecutó 'node'
// (el servidor debe iniciarse desde la carpeta backend/)
const uploadDir = path.join(process.cwd(), 'uploads');

// 2. Comprobación y creación de directorio en tiempo de inicialización
// Esto se ejecuta UNA SOLA VEZ cuando el servidor arranca.
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`📁 Directorio creado automáticamente: ${uploadDir}`);
}

// Tamaño máximo permitido por documento
const MAX_SIZE_MB = 20;

// Configuración de almacenamiento de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Carpeta donde se guardarán físicamente
    },
    filename: (req, file, cb) => {
        // Nombre físico aleatorio: evita colisiones y caracteres peligrosos 
        // del nombre original. El nombre original se guarda aparte en la base de datos
        // (req.file.originalname) para usarlo al descargar.
        cb(null, `${Date.now()}-${crypto.randomUUID()}.pdf`);
    }
});

// Filtro para aceptar solo documentos PDF
// Se comprueban el tipo MIME declarado y la extensión.
// Importante: ambos datos los envía el cliente y se pueden falsear; 
// una verificación más fuerte (leer los primeros bytes "%PDF") se hace
// después de la subida, en el controlador.
const fileFilter = (req, file, cb) => {
    const hasPdfMime = file.mimetype === 'application/pdf';
    const hasPdfExtension = path.extname(file.originalname).toLowerCase() === '.pdf';

    if (hasPdfMime && hasPdfExtension)
    {
        cb(null, true);
    }
    else
    {
        const error = new Error('Invalid file type. Only PDF files are allowed.');
        error.code = 'INVALID_FILE_TYPE'; // Permite que un middleware de errores lo reconozca
        cb(error, false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 } // Si se supera: MulterError 'LIMIT_FILE_SIZE'
});

// 'pdfFile' es el nombre del campo en el formulario
module.exports = upload.single('pdfFile');
