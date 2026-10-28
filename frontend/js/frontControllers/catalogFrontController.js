/**
*    Project     : Sample Vault (adaptado a gestión documental PDF)
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * Catálogo público: cualquier visitante ve la lista de documentos.
 * Leer o descargar requiere sesión iniciada (lo exige también el backend).
 */

let catalogDocuments = []; // Copia local para filtrar sin volver a pedir al servidor

document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();
    loadCatalog();

    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', () => filterCatalog(searchInput.value));
});

// Botones de la barra superior según haya sesión o no
function renderNavbar() {
    const nav = document.getElementById('navActions');
    nav.replaceChildren();

    if (authHelper.isLoggedIn()) {
        const role = authHelper.getRole();

        const roleLabel = document.createElement('span');
        roleLabel.className = 'w3-bar-item w3-small w3-text-grey';
        roleLabel.textContent = role;
        nav.appendChild(roleLabel);

        // Admin y professor tienen un panel propio
        if (role === 'admin' || role === 'professor') {
            const panelLink = document.createElement('a');
            panelLink.className = 'w3-bar-item w3-button';
            panelLink.href = authHelper.homeFor(role);
            panelLink.textContent = 'Mi panel';
            nav.appendChild(panelLink);
        }

        // El botón se crea después de DOMContentLoaded, así que se enlaza el evento acá
        const btnLogout = document.createElement('button');
        btnLogout.className = 'w3-bar-item w3-button';
        btnLogout.textContent = 'Salir';
        btnLogout.addEventListener('click', () => authHelper.logout());
        nav.appendChild(btnLogout);
    } else {
        const loginLink = document.createElement('a');
        loginLink.className = 'w3-bar-item w3-button';
        loginLink.href = '/login';
        loginLink.textContent = 'Iniciar sesión';

        const registerLink = document.createElement('a');
        registerLink.className = 'w3-bar-item w3-button w3-yellow';
        registerLink.href = '/register';
        registerLink.textContent = 'Registrarse';

        nav.append(loginLink, registerLink);
    }
}

async function loadCatalog() {
    try {
        // Ruta pública: no necesita token
        catalogDocuments = await apiService.request('/documents', 'GET');
        renderCatalog(catalogDocuments);
    } catch (error) {
        showModal('Error', 'No se pudo cargar el catálogo: ' + error.message);
    }
}

function renderCatalog(documents) {
    const actions = [
        { label: 'Leer', className: 'w3-yellow', handler: withLogin(openPdfViewer) },
        { label: 'Descargar', className: 'w3-dark-grey', handler: withLogin(downloadPdf) }
    ];
    renderDocumentsTable('catalogTableBody', documents, actions, true);
}

// Filtra por título, autor o categoría (sin distinguir mayúsculas)
function filterCatalog(text) {
    const query = text.trim().toLowerCase();
    const filtered = catalogDocuments.filter(doc =>
        [doc.title, doc.author, doc.category]
            .some(field => (field || '').toLowerCase().includes(query))
    );
    renderCatalog(filtered);
}

// Envuelve una acción: si no hay sesión, avisa en lugar de llamar al backend
function withLogin(action) {
    return (doc) => {
        if (!authHelper.isLoggedIn()) {
            showModal(
                'Inicia sesión', 
                'Puedes ver el catálogo sin cuenta, pero para leer o descargar un documento debes iniciar sesión.'
            );
            return;
        }
        action(doc);
    };
}
