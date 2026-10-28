/**
*    Project     : Sample Vault (adaptado a gestión documental PDF)
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

// Configuración base de la API
const API_URL = "/api";

// Nombres legibles de los campos que pueden venir en el detalle de un error de validación
const FIELD_LABELS = {
    username: 'Usuario',
    password: 'Contraseña',
    title: 'Título',
    author: 'Autor',
    category: 'Categoría',
    role: 'Rol'
};

// Arma el texto de un error: el mensaje general más el detalle por campo, si lo hay.
// Ejemplo: "Los datos enviados no son válidos. Contraseña: Debe tener al menos 6 caracteres."
function buildErrorMessage(result) {
    let message = result.message || 'Error en la petición';
    if (result.errors) {
        const details = Object.entries(result.errors)
            .map(([field, messages]) => `${FIELD_LABELS[field] || field}: ${messages.join(' ')}`)
            .join(' | ');
        message += ` ${details}`;
    }
    return message;
}

const apiService = {

    // Función centralizada para peticiones Fetch que devuelven JSON
    async request(endpoint, method = 'GET', data = null, isFormData = false) {
        // Usamos el helper en lugar de acceder directo a localStorage o sessionStorage
        const token = authHelper.getToken();

        const headers = {};
        if (!isFormData) headers['Content-Type'] = 'application/json';
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const config = { method, headers };
        if (data) {
            // Si es FormData (para archivos), no se stringifica
            config.body = isFormData ? data : JSON.stringify(data);
        }

        const response = await fetch(`${API_URL}${endpoint}`, config);
        const result = await response.json();

        // Si el token expiró (401), forzamos logout automático
        if (response.status === 401) authHelper.logout();

        if (!response.ok) throw new Error(buildErrorMessage(result));
        return result;
    },

    // NUEVO: petición que devuelve un archivo (Blob), por ejemplo un PDF.
    // Un <iframe> o un <a> no pueden enviar el token JWT en un encabezado;
    // fetch sí. Por eso el PDF se pide con fetch y se muestra desde un Blob.
    async requestBlob(endpoint) {
        const token = authHelper.getToken();

        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}${endpoint}`, { headers });

        if (response.status === 401) authHelper.logout();

        if (!response.ok) {
            // Los errores del backend llegan como JSON con un campo message
            let message = 'Error en la petición';
            try {
                message = buildErrorMessage(await response.json());
            } catch (error) {
                // La respuesta de error no era JSON: usamos el mensaje por defecto
            }
            throw new Error(message);
        }
        return response.blob();
    }
};
