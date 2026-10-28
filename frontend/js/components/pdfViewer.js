/**
*    Project     : Sample Vault (adaptado a gestión documental PDF)
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * Visor de PDF dentro de un modal, sin salir del sitio.
 * El PDF se pide con fetch (que envía el token) y se muestra desde un Blob.
 */
async function openPdfViewer(doc) {
    try {
        const blob = await apiService.requestBlob(`/documents/${doc.id}/file`);
        const blobUrl = URL.createObjectURL(blob);
        buildPdfModal(doc, blobUrl);
    } catch (error) {
        showModal('No se pudo abrir el documento', error.message);
    }
}

/**
 * Descarga el PDF al equipo del usuario.
 */
async function downloadPdf(doc) {
    try {
        const blob = await apiService.requestBlob(`/documents/${doc.id}/file?download=1`);
        const blobUrl = URL.createObjectURL(blob);

        // Enlace temporal con el atributo download, accionado por código
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = doc.original_name || `${doc.title}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        // Liberamos la memoria del Blob un instante después de iniciar la descarga
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
        showModal('No se pudo descargar el documento', error.message);
    }
}

/**
 * Construye el modal del visor (siempre uno nuevo, sin innerHTML).
 */
function buildPdfModal(doc, blobUrl) {
    // Si había un visor abierto, lo cerramos primero
    const previous = document.getElementById('pdfModal');
    if (previous) previous.remove();

    const modal = document.createElement('div');
    modal.id = 'pdfModal';
    modal.className = 'w3-modal';

    const content = document.createElement('div');
    content.className = 'w3-modal-content w3-card-4 w3-animate-zoom vault-card w3-display-container';
    content.style.maxWidth = '900px';

    // Encabezado con título y botón cerrar
    const header = document.createElement('header');
    header.className = 'w3-container w3-border-bottom';
    const title = document.createElement('h3');
    title.textContent = doc.title;
    const btnX = document.createElement('button');
    btnX.className = 'w3-button w3-display-topright';
    btnX.textContent = '×';

    // Cuerpo con el PDF
    const body = document.createElement('div');
    body.className = 'w3-container w3-padding';
    const frame = document.createElement('iframe');
    frame.className = 'pdf-frame';
    frame.title = doc.title;
    frame.src = blobUrl;
    body.appendChild(frame);

    // Pie con descarga y cierre
    const footer = document.createElement('div');
    footer.className = 'w3-container w3-padding w3-right-align';
    const btnDownload = document.createElement('button');
    btnDownload.className = 'w3-button w3-dark-grey w3-round w3-margin-right';
    btnDownload.textContent = 'Descargar';
    btnDownload.addEventListener('click', () => downloadPdf(doc));
    const btnClose = document.createElement('button');
    btnClose.className = 'w3-button w3-yellow w3-round';
    btnClose.textContent = 'Cerrar';

    // Al cerrar: se libera el Blob y se elimina el modal
    const closeModal = () => {
        frame.src = 'about:blank';
        URL.revokeObjectURL(blobUrl);
        modal.remove();
    };
    btnX.addEventListener('click', closeModal);
    btnClose.addEventListener('click', closeModal);

    header.append(title, btnX);
    footer.append(btnDownload, btnClose);
    content.append(header, body, footer);
    modal.appendChild(content);
    document.body.appendChild(modal);
    modal.style.display = 'block';
}
