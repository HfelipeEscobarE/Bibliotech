/**
*    Project     : Sample Vault (adaptado a gestión documental PDF)
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * Componentes para mostrar documentos en tablas.
 * Todo el DOM se construye con createElement y textContent (Zero-XSS).
 */

// Crea una celda <td> con texto plano
function createCell(text) {
    const td = document.createElement('td');
    td.textContent = text ?? '';
    return td;
}

// Crea un botón de acción con su evento nativo
function createActionButton(label, className, handler) {
    const btn = document.createElement('button');
    btn.className = `w3-button w3-tiny w3-round w3-margin-right ${className}`;
    btn.textContent = label;
    btn.addEventListener('click', handler);
    return btn;
}

/**
 * Construye una fila <tr> para un documento.
 * @param {object} doc - Documento devuelto por la API
 * @param {Array<{label: string, className: string, handler: Function}>} actions - Botones de la fila
 * @param {boolean} showUploader - Si se muestra la columna "Subido por"
 */
function createDocumentRow(doc, actions, showUploader) {
    const row = document.createElement('tr');

    // Título (resaltado)
    const tdTitle = document.createElement('td');
    const bold = document.createElement('b');
    bold.textContent = doc.title;
    tdTitle.appendChild(bold);

    // Categoría (etiqueta, solo si existe)
    const tdCategory = document.createElement('td');
    if (doc.category) {
        const tag = document.createElement('span');
        tag.className = 'w3-tag w3-round w3-black';
        tag.textContent = doc.category;
        tdCategory.appendChild(tag);
    }

    row.append(tdTitle, createCell(doc.author), tdCategory);
    if (showUploader) row.appendChild(createCell(doc.uploaded_by));
    row.appendChild(createCell(new Date(doc.created_at).toLocaleDateString()));

    // Acciones: cada handler recibe el documento de la fila
    const tdActions = document.createElement('td');
    actions.forEach(action => {
        tdActions.appendChild(createActionButton(action.label, action.className, () => action.handler(doc)));
    });
    row.appendChild(tdActions);

    return row;
}

/**
 * Dibuja una lista de documentos dentro de un <tbody>.
 */
function renderDocumentsTable(tbodyId, documents, actions, showUploader = true) {
    const tbody = document.getElementById(tbodyId);
    tbody.replaceChildren(); // Limpia el contenido de forma eficiente

    if (documents.length === 0) {
        const row = document.createElement('tr');
        const td = createCell('No hay documentos para mostrar.');
        td.colSpan = showUploader ? 6 : 5;
        row.appendChild(td);
        tbody.appendChild(row);
        return;
    }

    documents.forEach(doc => tbody.appendChild(createDocumentRow(doc, actions, showUploader)));
}

/**
 * Pide confirmación y borra un documento. onDeleted se ejecuta si salió bien
 * (normalmente, para recargar la tabla).
 */
async function confirmAndDeleteDocument(doc, onDeleted) {
    if (!confirm(`¿Seguro que quieres eliminar "${doc.title}"? Esta acción no se puede deshacer.`)) return;

    try {
        await apiService.request(`/documents/${doc.id}`, 'DELETE');
        showModal('Eliminado', 'El documento ha sido borrado.');
        onDeleted();
    } catch (error) {
        showModal('Error al eliminar', error.message);
    }
}
