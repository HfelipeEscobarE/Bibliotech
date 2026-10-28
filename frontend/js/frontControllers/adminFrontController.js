/**
*    Project     : Sample Vault (adaptado a gestión documental PDF)
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * adminFrontController.js
 * Gestión de la interfaz de administración (usuarios y documentos)
 */

const ROLES = ['admin', 'professor', 'student'];

// Al cargar la página, verificar el rol y cargar usuarios y documentos
document.addEventListener('DOMContentLoaded', () => {
    if (!authHelper.requireRole('admin')) return;
    loadUsers();
    loadDocuments();
});

// ---------------- USUARIOS ----------------

async function loadUsers() {
    try {
        const users = await apiService.request('/admin/users', 'GET');
        renderUsersTable(users);
    } catch (error) {
        showModal('Error', 'No se pudo cargar la lista de usuarios: ' + error.message);
    }
}

/**
 * Renderiza la tabla de usuarios sin utilizar innerHTML para mayor seguridad
 */
function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.replaceChildren();

    const myId = authHelper.getUserId();

    users.forEach(u => {
        const isMe = u.id === myId; // El backend impide cambiar el rol o borrar la propia cuenta
        const row = document.createElement('tr');

        // Celda Username (usando <b> para resaltar)
        const tdUser = document.createElement('td');
        const b = document.createElement('b');
        b.textContent = isMe ? `${u.username} (tú)` : u.username;
        tdUser.appendChild(b);

        // Celda Rol: lista desplegable para cambiarlo
        const tdRole = document.createElement('td');
        const select = document.createElement('select');
        select.className = 'w3-select w3-border w3-round w3-black w3-text-white role-select';
        ROLES.forEach(role => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            option.selected = (role === u.role);
            select.appendChild(option);
        });
        select.disabled = isMe;
        select.addEventListener('change', () => changeRole(u.id, select.value));
        tdRole.appendChild(select);

        // Celda Acciones
        const tdActions = document.createElement('td');
        const btnDelete = document.createElement('button');
        btnDelete.className = 'w3-button w3-red w3-tiny';
        btnDelete.textContent = 'Eliminar usuario y sus documentos';
        btnDelete.disabled = isMe;
        btnDelete.addEventListener('click', () => deleteUser(u.id));
        tdActions.appendChild(btnDelete);

        row.append(
            createCell(u.id), 
            tdUser, 
            tdRole, 
            createCell(new Date(u.created_at).toLocaleDateString()), 
            tdActions
        );
        tbody.appendChild(row);
    });
}

async function changeRole(id, role) {
    if (!confirm(`¿Cambiar el rol de este usuario a '${role}'?`)) {
        loadUsers(); // Restaura la lista desplegable al valor anterior
        return;
    }
    try {
        await apiService.request(`/admin/users/${id}/role`, 'PUT', { role });
        showModal('Éxito', 'Rol actualizado.');
    } catch (error) {
        showModal('Error al cambiar el rol', error.message);
    }
    loadUsers();
}

async function deleteUser(id) {
    if (!confirm('¿Estás seguro de borrar a este usuario? Se borrarán todos sus documentos de forma permanente.')) {
        return;
    }
    try {
        await apiService.request(`/admin/users/${id}`, 'DELETE');
        showModal('Éxito', 'Usuario eliminado con éxito');
        loadUsers();
        loadDocuments(); // Sus documentos también desaparecen del catálogo
    } catch (error) {
        showModal('Error al borrar usuario', error.message);
    }
}

// ---------------- DOCUMENTOS ----------------

async function loadDocuments() {
    try {
        const documents = await apiService.request('/documents', 'GET');

        const actions = [
            { label: 'Leer', className: 'w3-yellow', handler: openPdfViewer },
            { label: 'Descargar', className: 'w3-dark-grey', handler: downloadPdf },
            { label: 'Borrar', className: 'w3-red', handler: (doc) => confirmAndDeleteDocument(doc, loadDocuments) }
        ];
        renderDocumentsTable('documentsTableBody', documents, actions, true);
    } catch (error) {
        showModal('Error', 'No se pudieron cargar los documentos: ' + error.message);
    }
}
