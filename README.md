# <img src="frontend/img/favicon-gold.png" width="45" height="45" align="center"> Bibliotech

**Bibliotech** es una plataforma web para la gestión documental de libros y archivos en formato PDF. Los profesores suben el material, los estudiantes lo leen en el mismo sitio o lo descargan, y el administrador gestiona usuarios y documentos. Cualquier visitante puede consultar el catálogo sin cuenta.

Es una adaptación del proyecto **Sample Vault** (una biblioteca de sonidos) a un repositorio documental, conservando su arquitectura en N capas.

Proyecto original: [Sample Vault](https://github.com/gabrielinuz/sample-vault)

---

## 🎯 Hitos del proyecto

| Hito | Cómo se cumple |
|---|---|
| Arquitectura en N capas de Sample Vault | Rutas → middlewares → controladores → repositorios → Stored Procedures |
| Validación y manejo de errores modulares | Módulo **Filter** (`utils/filter/`), `filterMiddleware` y `globalErrorMiddleware` |
| De audio a gestión documental PDF | Filtro de Multer solo PDF, verificación de la firma `%PDF-` y tabla `documents` |
| Lectura cómoda en el sitio y descarga | Visor de PDF en un modal y botón de descarga |
| Roles | **Admin**, **Professor** y **Student**; el catálogo es público |

## 👥 Roles y permisos

| Acción                  | Visitante | Student | Professor      | Admin      |
|---                      |:---:      |:---:    |:---:           |:---:       |
| Ver el catálogo         | ✅       | ✅      | ✅            | ✅         |
| Leer o descargar un PDF | ❌       | ✅      | ✅            | ✅         |
| Subir un PDF            | ❌       | ❌      | ✅            | ✅         |
| Borrar un documento     | ❌       | ❌      | Solo los suyos | Cualquiera |
| Ver usuarios, cambiar 
roles, borrar usuarios    | ❌       | ❌      | ❌            | ✅         |

El registro público siempre crea usuarios **Student**. Solo un administrador puede asignar el rol Professor.

## 🚀 Características principales

* **Catálogo público** con buscador por título, autor o categoría.
* **Visor de PDF integrado:** el archivo se pide con `fetch` (que envía el token JWT) y se muestra desde un Blob, sin salir del sitio.
* **Filtros de validación (Fail-Fast):** los datos mal formados se frenan antes de llegar al controlador.
* **Manejo global de errores:** todas las respuestas de error tienen el mismo formato JSON, traducido (español/inglés) y sin datos técnicos en producción.
* **Frontend "Zero innerHTML":** el DOM se construye solo con `createElement`, `textContent` y `replaceChildren`.
* **Archivos protegidos:** la carpeta `uploads/` no se publica; los PDF salen únicamente por una ruta que exige sesión.

## 🛠️ Tecnologías utilizadas

### Backend
* **Node.js & Express:** servidor HTTP y rutas REST.
* **MariaDB / MySQL (`mysql2`):** base relacional; todo el acceso a datos es mediante **Stored Procedures**.
* **Multer:** carga de archivos `multipart/form-data`.
* **JSON Web Tokens (`jsonwebtoken`):** autenticación sin estado con tokens Bearer.
* **bcrypt:** hash seguro de contraseñas.
* **dotenv:** variables de entorno.

### Frontend
* **Vanilla JavaScript** con la API Fetch.
* **W3.CSS:** framework CSS liviano y responsivo.

## 🏛️ Arquitectura y patrones

```text
Petición ─▶ Router ─▶ verifyToken ─▶ authorize(roles) ─▶ [Multer] ─▶ filterMiddleware ─▶ Controlador ─▶ Repositorio ─▶ Stored Procedure
                                                                                              │
                                      Cualquier error ─────────────────────────────▶ globalErrorMiddleware ─▶ JSON estándar
```

| Capa | Responsabilidad |
|---|---|
| Base de datos | Stored Procedures; el usuario de la aplicación solo puede `SELECT` y `EXECUTE` (Principio de Menor Privilegio) |
| Repositorios | Abstracción del acceso a datos (patrón **Repository**) |
| Controladores | Lógica de negocio: propiedad de los documentos, reglas sobre uno mismo, etc. |
| Middlewares | Autenticación, autorización por rol, filtros de datos y errores |
| Rutas | Enrutamiento declarativo; cada ruta declara su cadena de middlewares |

Patrones aplicados en el módulo de validación: **Strategy** (cada regla es intercambiable), **Fluent Interface** (`with()` encadenable) y **Singleton** (`LanguageManager`). Cada módulo tiene su propio `README.md`: [`utils/filter`](backend/utils/filter/README.md) y [`utils/i18n`](backend/utils/i18n/README.md).

## 📂 Estructura del proyecto

```text
bibliotech/
├── backend/
│   ├── config/
│   │   ├── db.js                      # Pool de conexiones a MariaDB/MySQL
│   │   ├── init.sql                   # Tablas, usuario de menor privilegio y Stored Procedures
│   │   ├── delete.sql                 # Limpieza de la base y del usuario
│   │   └── multerConfig.js            # Carga de archivos: solo PDF, hasta 20 MB
│   ├── controllers/
│   │   ├── adminController.js         # Usuarios y roles
│   │   ├── authController.js          # Registro e inicio de sesión
│   │   └── documentController.js      # Subida, catálogo, lectura y borrado de PDF
│   ├── middleware/
│   │   ├── authMiddleware.js          # verifyToken, authorize(...roles), isAdmin
│   │   ├── filterMiddleware.js        # Escudo de validación (Fail-Fast)
│   │   └── globalErrorMiddleware.js   # Red de contención de errores
│   ├── repositories/
│   │   ├── documentRepo.js            # Acceso a datos de documentos
│   │   └── userRepo.js                # Acceso a datos de usuarios
│   ├── routes/
│   │   ├── adminRoutes.js             # Endpoints solo para administradores
│   │   ├── authRoutes.js              # Endpoints públicos de identidad
│   │   ├── documentRoutes.js          # Catálogo público y endpoints protegidos
│   │   ├── testsRoutes.js             # Ruta de la consola de pruebas
│   │   └── viewRoutes.js              # Enrutador de pantallas HTML
│   ├── uploads/                       # Almacenamiento físico de los PDF (no público)
│   ├── utils/
│   │   ├── errors/                    # AppError y ValidationError
│   │   ├── filter/                    # FilterHandler y reglas (Strategy)
│   │   ├── i18n/                      # LanguageManager y diccionarios es / en
│   │   └── fileHelper.js              # Borrado seguro de archivos del disco
│   ├── package.json
│   └── server.js                      # Punto de entrada y pipeline de Express
├── frontend/
│   ├── css/                           # style.css (variables) y w3.css
│   ├── html/
│   │   ├── admin-dashboard.html       # Usuarios, roles y documentos
│   │   ├── catalog.html               # Catálogo público
│   │   ├── login.html
│   │   ├── professor-dashboard.html   # Subida y gestión de documentos propios
│   │   ├── register.html
│   │   └── tests.html                 # Consola de pruebas de la API
│   ├── img/
│   └── js/
│       ├── components/                # documentComponents, pdfViewer, uiHandlers
│       ├── frontControllers/          # admin, auth, catalog y professor
│       ├── services/apiService.js     # Cliente Fetch (inyecta el token JWT)
│       ├── tests/                     # Pruebas de la consola (admin, auth, documentos, errores)
│       └── utils/authHelper.js        # Sesión en localStorage y control por rol
├── AUTHORS.md
├── LICENSE
├── setup.sh
└── README.md
```

## ⚙️ Instalación y puesta en marcha

### 1. Requisitos
* **Node.js** 18 o superior.
* **MariaDB** 10.1 o superior (también sirve MySQL). Por ejemplo, mediante XAMPP o Laragon.

### 2. Instalar las dependencias
```bash
cd backend
npm install
```

### 3. Crear la base de datos
Importá `backend/config/init.sql` en phpMyAdmin (pestaña **Importar**, sin elegir ninguna base) o desde la consola:

```bash
mysql -u root -p < backend/config/init.sql
```

El script **borra y recrea** la base `bibliotech`, crea el usuario `bibliotech` con permisos mínimos, las tablas, los Stored Procedures y los usuarios de prueba.

### 4. Variables de entorno
Creá el archivo `backend/.env`:

```text
PORT=3000
DB_HOST=localhost
DB_USER=bibliotech
DB_PASS=bibliotech
DB_NAME=bibliotech
JWT_SECRET=una_clave_larga_y_secreta
NODE_ENV=production
DEFAULT_LANG=es
```

| Variable       | Valores                                                                  |
|---             |---                                                                       |
| `NODE_ENV`     | `production` (oculta el detalle técnico de los errores 500), `development` o `testing` (activa la consola de pruebas)                               |
| `DEFAULT_LANG` | `es` o `en`, idioma de los mensajes de error. Opcional                   |

### 5. Iniciar la aplicación
Desde la carpeta `backend` (porque `uploads/` se resuelve desde ahí):

```bash
npm start
```

Abrí 👉 http://localhost:3000

## 👤 Usuarios de prueba

| Rol           | Usuario      | Contraseña |
|---            |---           |---         |
| Administrador | `admin`      | `12345`    |
| Professor     | `profesor`   | `12345`    |
| Student       | `estudiante` | `12345`    |

También se pueden crear usuarios desde **Registrarse** (siempre con rol Student).

## 🔌 API

| Método | Ruta | Acceso |
|---     |---|---|
| POST   | `/api/auth/register` | Público |
| POST   | `/api/auth/login` | Público |
| GET    | `/api/documents` | Público (solo metadatos) |
| GET    | `/api/documents/my-documents` | Professor, Admin |
| GET | `/api/documents/:id/file` (`?download=1` para descargar) | Cualquier rol con sesión |
| POST | `/api/documents/upload` (campo `pdfFile`) | Professor, Admin |
| DELETE | `/api/documents/:id` | Admin (cualquiera) o Professor (solo los suyos) |
| GET | `/api/admin/users` | Admin |
| PUT | `/api/admin/users/:id/role` | Admin |
| DELETE | `/api/admin/users/:id` | Admin |

Las rutas protegidas esperan el encabezado `Authorization: Bearer <token>`.

## 🛡️ Validación y manejo de errores

Todos los errores responden con el mismo formato:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Los datos enviados no son válidos.",
  "errors": { "password": ["La contraseña debe tener al menos 6 caracteres y no superar los 72."] }
}
```

| Código HTTP | `code` | Cuándo ocurre |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Un dato no cumple los filtros (formato, longitud, valores permitidos) |
| 400 | `INVALID_FILE_TYPE`, `INVALID_PDF_CONTENT`, `FILE_REQUIRED` | El archivo no es un PDF, o falta |
| 400 | `MALFORMED_JSON` | El cuerpo de la petición no es un JSON válido |
| 401 | `INVALID_CREDENTIALS`, `TOKEN_INVALID` | Credenciales incorrectas o token vencido |
| 403 | `TOKEN_MISSING`, `ROLE_FORBIDDEN`, `ADMIN_REQUIRED`, `NOT_OWNER` | Falta de sesión o de permisos |
| 404 | `DOCUMENT_NOT_FOUND`, `USER_NOT_FOUND`, `NOT_FOUND` | El recurso no existe |
| 409 | `DUPLICATE_ENTRY` | Ya existe un registro con esos datos (por ejemplo, el usuario) |
| 413 | `FILE_TOO_LARGE` | El PDF supera los 20 MB |
| 503 | `DATABASE_UNAVAILABLE` | No hay conexión utilizable con la base de datos |
| 500 | `INTERNAL_ERROR` | Error inesperado |

El **stack trace** y el detalle técnico se registran solo en la consola del servidor; únicamente se agregan a la respuesta (campo `debug`) cuando `NODE_ENV` no es `production`.

## 🧪 Laboratorio de pruebas API

1. En `backend/.env`, cambiá `NODE_ENV=testing`.
2. Reiniciá el servidor (`npm start`).
3. Abrí http://localhost:3000: aparece una consola con botones que ejecutan pruebas de:
   * inicio de sesión correcto e incorrecto;
   * registro con contraseña corta, con usuario inválido y con usuario duplicado;
   * catálogo público, subida de PDF por rol, falso PDF, archivos que no son PDF y lectura con y sin sesión;
   * administración de usuarios y cambio de roles;
   * errores globales (ruta inexistente, JSON mal formado, token inválido).

## 🔒 Seguridad

* Contraseñas con **bcrypt**; sesión con **JWT**.
* **Menor privilegio** en la base: el usuario de la aplicación no puede hacer `INSERT`, `UPDATE` ni `DELETE` directos.
* Los PDF se validan por tipo MIME, extensión y **firma real del archivo** (`%PDF-`), con nombre físico aleatorio y límite de 20 MB.
* La carpeta `uploads/` **no se publica**: los archivos se entregan solo con sesión iniciada.
* Un administrador no puede cambiar su propio rol ni borrar su propia cuenta.
* La autorización se aplica siempre en el backend; los controles del frontend son solo comodidad de la interfaz.

## 📜 Créditos y licencia

* Proyecto original: [Sample Vault](https://github.com/gabrielinuz/sample-vault), por sus autores listados en [AUTHORS.md](AUTHORS.md).
* Adaptación a Bibliotech: **[Hector]**.
* Licencia: [GNU GPL 3.0](LICENSE).
