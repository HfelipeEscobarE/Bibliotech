/**
 * Pruebas de autenticación: POST /api/auth/login
 * Usuarios de prueba (init.sql): admin, profesor y estudiante, todos con contraseña 12345
 */

testUtils.createTestButton("Test Login Correcto (profesor y 12345)", async (btn) => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'profesor', password: '12345' })
    });
    const data = await response.json();
    testUtils.log(data);
    if (response.ok) {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("Test Login - Password Incorrecto (profesor y 123)", async (btn) => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'profesor', password: '123' })
    });
    const data = await response.json();
    testUtils.log(data);
    if (response.status === 401) {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("Test Login - Usuario Incorrecto (juan y 12345)", async (btn) => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'juan', password: '12345' })
    });
    const data = await response.json();
    testUtils.log(data);
    if (response.status === 401) {
        testUtils.setSuccess(btn);
    }
});

/**
 * Pruebas de los filtros de registro: POST /api/auth/register
 */
testUtils.createTestButton("Test Registro - Contraseña corta (< 6) -> 400 VALIDATION_ERROR", async (btn) => {
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'usuario_nuevo', password: '123' })
    });
    const data = await response.json();
    testUtils.log({ status: response.status, ...data });
    if (response.status === 400 && data.code === 'VALIDATION_ERROR') {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("Test Registro - Usuario con espacios -> 400 VALIDATION_ERROR", async (btn) => {
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'usuario con espacios', password: '123456' })
    });
    const data = await response.json();
    testUtils.log({ status: response.status, ...data });
    if (response.status === 400 && data.code === 'VALIDATION_ERROR') {
        testUtils.setSuccess(btn);
    }
});

testUtils.createTestButton("Test Registro - Usuario duplicado (admin) -> 409 DUPLICATE_ENTRY", async (btn) => {
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '123456' })
    });
    const data = await response.json();
    testUtils.log({ status: response.status, ...data });
    if (response.status === 409 && data.code === 'DUPLICATE_ENTRY') {
        testUtils.setSuccess(btn);
    }
});
