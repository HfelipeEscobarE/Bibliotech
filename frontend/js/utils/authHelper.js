/**
*    Project     : Sample Vault (adaptado a gestión documental PDF)
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * Utilidad para gestionar la persistencia de la sesión
 * Centraliza el uso de localStorage/sessionStorage
 */
const authHelper = {

    /**
     * Se puede cambiar 'localStorage' por 'sessionStorage' aquí y afectará a toda la app
     * Cambiar a sessionStorage si se prefiere mayor seguridad en equipos compartidos
     */    
    storage: localStorage,

    saveSession(token, role) {
        this.storage.setItem('token', token);
        this.storage.setItem('role', role);
    },

    getToken() {
        return this.storage.getItem('token');
    },

    getRole() {
        return this.storage.getItem('role');
    },

    isLoggedIn() {
        return Boolean(this.getToken());
    },

    // NUEVO: lee el id del usuario desde el payload del JWT.
    // Solo se usa para la interfaz (por ejemplo, deshabilitar acciones sobre uno mismo);
    // la validación real la hace el backend.
    getUserId() {
        try {
            const base64 = this.getToken().split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(base64)).id;
        } catch (error) {
            return null;
        }
    },

    // NUEVO: página de inicio según el rol
    homeFor(role) {
        if (role === 'admin') return '/admin-dashboard';
        if (role === 'professor') return '/professor-dashboard';
        return '/catalog'; // student
    },

    // NUEVO: redirige al login si no hay sesión o el rol no está permitido.
    // Es solo una comodidad de la interfaz: la seguridad real la aplica el
    // backend con verifyToken y authorize en cada ruta.
    requireRole(...allowedRoles) {
        if (!this.isLoggedIn() || !allowedRoles.includes(this.getRole())) {
            window.location.href = '/login';
            return false;
        }
        return true;
    },

    logout() {
        this.storage.clear();
        window.location.href = '/login';
    },

    // Buscamos botones de logout por clase para evitar onclick en HTML
    initLogoutButtons() {
        const logoutBtns = document.querySelectorAll('.btn-logout');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', () => this.logout());
        });
    }
};

// Inicializar escuchadores de logout al cargar
document.addEventListener('DOMContentLoaded', () => authHelper.initLogoutButtons());
