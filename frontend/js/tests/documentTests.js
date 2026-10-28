/**
 * Pruebas de documentos: /api/documents
 * Cada prueba es independiente: inicia sesión por su cuenta cuando la necesita.
 */

// Inicia sesión con un usuario de prueba y devuelve su token
async function loginAs(username, password = '12345')
{
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    return data.token;
}

// Crea un PDF mínimo para las pruebas (empieza con la firma real %PDF-)
function createTestPdf()
{
    const content = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF';
    return new Blob([content], { type: 'application/pdf' });
}

// Sube un archivo como el usuario indicado y devuelve la respuesta completa
async function uploadAs(username, blob, fileName, title = 'Documento de prueba')
{
    const token = await loginAs(username);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('author', 'Autor de prueba');
    formData.append('category', 'Pruebas');
    formData.append('pdfFile', blob, fileName);

    return fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });
}

/**
 * Test: GET /api/documents (PÚBLICO, sin token)
 */
testUtils.createTestButton("Test Catálogo público (sin token) -> 200", async (btn) => {
    const response = await fetch('/api/documents');
    const data = await response.json();
    testUtils.log(data);
    if (response.ok) testUtils.setSuccess(btn);
});

/**
 * Test: GET /api/documents/my-documents sin token
 */
testUtils.createTestButton("Test Mis documentos sin token -> 403", async (btn) => {
    const response = await fetch('/api/documents/my-documents');
    const data = await response.json();
    testUtils.log(data);
    if (response.status === 403) testUtils.setSuccess(btn);
});

/**
 * Test: POST /api/documents/upload como Professor (PDF válido)
 */
testUtils.createTestButton("Test Subir PDF como Professor -> 201", async (btn) => {
    const response = await uploadAs('profesor', createTestPdf(), 'prueba-profesor.pdf');
    const data = await response.json();
    testUtils.log(data);
    if (response.status === 201) testUtils.setSuccess(btn);
});

/**
 * Test: POST /api/documents/upload como Student (no tiene permiso)
 */
testUtils.createTestButton("Test Subir PDF como Student -> 403", async (btn) => {
    const response = await uploadAs('estudiante', createTestPdf(), 'prueba-estudiante.pdf');
    const data = await response.json();
    testUtils.log(data);
    if (response.status === 403) testUtils.setSuccess(btn);
});

/**
 * Test: archivo que dice ser PDF pero cuyo contenido no lo es
 */
testUtils.createTestButton("Test Subir falso PDF (contenido de texto) -> 400", async (btn) => {
    const fake = new Blob(['Esto no es un PDF'], { type: 'application/pdf' });
    const response = await uploadAs('profesor', fake, 'falso.pdf');
    const data = await response.json();
    testUtils.log(data);
    if (response.status === 400) testUtils.setSuccess(btn);
});

/**
 * Test: archivo que no es PDF (lo rechaza el filtro de Multer)
 */
testUtils.createTestButton("Test Subir archivo .txt -> 400 INVALID_FILE_TYPE", async (btn) => {
    const txt = new Blob(['hola'], { type: 'text/plain' });
    const response = await uploadAs('profesor', txt, 'nota.txt');
    const data = await response.json();
    testUtils.log({ status: response.status, ...data });
    if (response.status === 400 && data.code === 'INVALID_FILE_TYPE') testUtils.setSuccess(btn);
});

/**
 * Test: PDF válido pero con el título demasiado largo (lo frena el filtro)
 */
testUtils.createTestButton("Test Subir PDF con título de 151 caracteres -> 400 VALIDATION_ERROR", async (btn) => {
    const response = await uploadAs('profesor', createTestPdf(), 'largo.pdf', 'x'.repeat(151));
    const data = await response.json();
    testUtils.log({ status: response.status, ...data });
    if (response.status === 400 && data.code === 'VALIDATION_ERROR') testUtils.setSuccess(btn);
});

/**
 * Test: leer un PDF sin token
 */
testUtils.createTestButton("Test Leer PDF sin token -> 403", async (btn) => {
    const catalog = await (await fetch('/api/documents')).json();
    if (catalog.length === 0) {
        testUtils.log("El catálogo está vacío: sube un documento primero.", true);
        return;
    }
    const response = await fetch(`/api/documents/${catalog[0].id}/file`);
    const data = await response.json();
    testUtils.log(data);
    if (response.status === 403) testUtils.setSuccess(btn);
});

/**
 * Test: leer un PDF como Student con sesión
 */
testUtils.createTestButton("Test Leer PDF como Student -> 200 application/pdf", async (btn) => {
    const catalog = await (await fetch('/api/documents')).json();
    if (catalog.length === 0) {
        testUtils.log("El catálogo está vacío: sube un documento primero.", true);
        return;
    }
    const token = await loginAs('estudiante');
    const response = await fetch(`/api/documents/${catalog[0].id}/file`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const blob = await response.blob();
    testUtils.log({ status: response.status, contentType: response.headers.get('content-type'), bytes: blob.size });
    if (response.ok && response.headers.get('content-type').includes('application/pdf')) {
        testUtils.setSuccess(btn);
    }
});

/**
 * Test: un Professor borra el documento que acaba de subir
 */
testUtils.createTestButton("Test Professor borra su propio documento -> 200", async (btn) => {
    const upload = await uploadAs('profesor', createTestPdf(), 'para-borrar.pdf', 'Documento para borrar');
    const { id } = await upload.json();
    const token = await loginAs('profesor');
    const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    testUtils.log(data);
    if (response.ok) testUtils.setSuccess(btn);
});
