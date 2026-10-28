/**
 * Pruebas del manejo global de errores (globalErrorMiddleware)
 * Todas las respuestas de error tienen el mismo formato: { code, message, ... }
 */

testUtils.createTestButton("Test Ruta /api inexistente -> 404 NOT_FOUND (en JSON)", async (btn) => {
    const response = await fetch('/api/esta-ruta-no-existe');
    const data = await response.json();
    testUtils.log({ status: response.status, ...data });
    if (response.status === 404 && data.code === 'NOT_FOUND') testUtils.setSuccess(btn);
});

testUtils.createTestButton("Test JSON mal formado -> 400 MALFORMED_JSON", async (btn) => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"username": "admin", '   // JSON incompleto a propósito
    });
    const data = await response.json();
    testUtils.log({ status: response.status, ...data });
    if (response.status === 400 && data.code === 'MALFORMED_JSON') testUtils.setSuccess(btn);
});

testUtils.createTestButton("Test Login con tipos incorrectos (objeto en vez de texto) -> 400", async (btn) => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: { "$ne": "x" }, password: ["12345"] })
    });
    const data = await response.json();
    testUtils.log({ status: response.status, ...data });
    if (response.status === 400 && data.code === 'VALIDATION_ERROR') testUtils.setSuccess(btn);
});

testUtils.createTestButton("Test Token inválido -> 401 TOKEN_INVALID", async (btn) => {
    const response = await fetch('/api/documents/my-documents', {
        headers: { 'Authorization': 'Bearer token.inventado.123' }
    });
    const data = await response.json();
    testUtils.log({ status: response.status, ...data });
    if (response.status === 401 && data.code === 'TOKEN_INVALID') testUtils.setSuccess(btn);
});
