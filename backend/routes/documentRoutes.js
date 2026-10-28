/**
*    Project     : Sample Vault (adaptado a gestión documental PDF)
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

const express = require('express');
const router = express.Router();

const documentController = require('../controllers/documentController');

// Configuración de Multer para subir archivos PDF:
const uploadMiddleware = require('../config/multerConfig');
const { verifyToken, authorize } = require('../middleware/authMiddleware');

// Filtro de los datos del formulario de subida (límites que coinciden con las columnas de la base)
const filterMiddleware = require('../middleware/filterMiddleware');
const FilterHandler = require('../utils/filter/filterHandler');
const { Required, IsString, MaxLength } = require('../utils/filter/rules');

const uploadFilter = filterMiddleware.forBody({
    title: new FilterHandler().with(new Required()).with(new IsString()).with(new MaxLength(150)),
    author: new FilterHandler().with(new IsString()).with(new MaxLength(100)),
    category: new FilterHandler().with(new IsString()).with(new MaxLength(50))
});

// --- RUTA PÚBLICA ---
// Catálogo: cualquier visitante puede ver la lista (solo metadatos)
// GET /api/documents
router.get('/', documentController.getCatalog);

// --- RUTAS PROTEGIDAS (requieren token) ---
// Mis documentos: GET /api/documents/my-documents
router.get('/my-documents', verifyToken, authorize('admin', 'professor'), documentController.getMyDocuments);

// Leer o descargar un PDF: GET /api/documents/:id/file  (?download=1 para descargar)
router.get('/:id/file', verifyToken, authorize('admin', 'professor', 'student'), documentController.getFile);

// Subir un PDF: POST /api/documents/upload
// 'pdfFile' es el nombre que debe tener el campo file en el FormData del frontend
// Orden de la cadena: 1) quién sos, 2) tenés permiso, 3) Multer lee el formulario y el archivo,
// 4) el filtro controla los datos de texto (necesita que Multer ya los haya leído), 5) controlador.
// authorize va ANTES de Multer para no recibir archivos de quien no tiene permiso
router.post('/upload', verifyToken, authorize('admin', 'professor'), uploadMiddleware, uploadFilter, documentController.uploadDocument);

// Eliminar un documento: DELETE /api/documents/:id
router.delete('/:id', verifyToken, authorize('admin', 'professor'), documentController.deleteDocument);

module.exports = router;
