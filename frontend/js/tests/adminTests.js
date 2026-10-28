/**
 * Pruebas de administración: /api/admin (requieren rol Admin)
 */

async function adminToken()
{
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '12345' })
    });
    const { token } = await response.json();
    return token;
}

/**
 * Test: GET /api/admin/users con Admin
 */
testUtils.createTestButton("Test Admin: Listar Usuarios con Login Admin Correcto -> 200", async (btn) => {
    const token = await adminToken();
    const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    testUtils.log(data);
    if (response.ok) testUtils.setSuccess(btn);
});

/**
 * Test: GET /api/admin/users con Student (no tiene permiso)
 */
testUtils.createTestButton("Test Admin: Listar Usuarios como Student -> 403", async (btn) => {
    const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'estudiante', password: '12345' })
    });
    const { token } = await loginRes.json();
    const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    testUtils.log(data);
    if (response.status === 403) testUtils.setSuccess(btn);
});

/**
 * Test: PUT /api/admin/users/:id/role (cambia el rol del usuario 3 y lo restaura)
 */
testUtils.createTestButton("Test Admin: Cambiar rol de 'estudiante' a professor y volver -> 200", async (btn) => {
    const token = await adminToken();
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const toProfessor = await fetch('/api/admin/users/3/role', {
        method: 'PUT', headers, body: JSON.stringify({ role: 'professor' })
    });
    const first = await toProfessor.json();

    const toStudent = await fetch('/api/admin/users/3/role', {
        method: 'PUT', headers, body: JSON.stringify({ role: 'student' })
    });
    const second = await toStudent.json();

    testUtils.log({ aProfessor: first, aStudent: second });
    if (toProfessor.ok && toStudent.ok) testUtils.setSuccess(btn);
});

/**
 * Test: PUT /api/admin/users/:id/role con un rol inexistente
 */
testUtils.createTestButton("Test Admin: Rol inválido -> 400", async (btn) => {
    const token = await adminToken();
    const response = await fetch('/api/admin/users/3/role', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'superman' })
    });
    const data = await response.json();
    testUtils.log(data);
    if (response.status === 400) testUtils.setSuccess(btn);
});
