/**
*    Project     : Sample Vault (adaptado a gestión documental PDF)
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

const MAX_SIZE_MB = 20; // Debe coincidir con el límite de Multer en el backend

// Al cargar la página, verificar el rol y traer los documentos del profesor
document.addEventListener('DOMContentLoaded', () => {
    if (!authHelper.requireRole('professor')) return;
    loadMyDocuments();
});

async function loadMyDocuments() {
    try {
        const documents = await apiService.request('/documents/my-documents', 'GET');

        const actions = [
            { label: 'Leer', className: 'w3-yellow', handler: openPdfViewer },
            { label: 'Descargar', className: 'w3-dark-grey', handler: downloadPdf },
            { label: 'Borrar', className: 'w3-red', handler: (doc) => confirmAndDeleteDocument(doc, loadMyDocuments) }
        ];
        // false: no hace falta la columna "Subido por", todos son suyos
        renderDocumentsTable('documentsTableBody', documents, actions, false);
    } catch (error) {
        showModal('Error', 'No se pudieron cargar tus documentos: ' + error.message);
    }
}

// Evento para el formulario de subida
const uploadForm = document.getElementById('uploadForm');

if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = document.getElementById('pdfFile').files[0];

        // Validación rápida en el cliente (el backend vuelve a validar todo)
        if (file && file.size > MAX_SIZE_MB * 1024 * 1024) {
            showModal('Archivo demasiado grande', `El PDF no puede superar los ${MAX_SIZE_MB} MB.`);
            return;
        }

        const formData = new FormData();
        formData.append('title', document.getElementById('title').value);
        formData.append('author', document.getElementById('author').value);
        formData.append('category', document.getElementById('category').value);
        formData.append('pdfFile', file);

        try {
            await apiService.request('/documents/upload', 'POST', formData, true);
            showModal('Éxito', 'Documento guardado en la biblioteca.');
            uploadForm.reset();
            loadMyDocuments();
        } catch (error) {
            showModal('Error al subir', error.message);
        }
    });
}
