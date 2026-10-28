SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

-- 1. Borrar la base de datos si existe
DROP DATABASE IF EXISTS bibliotech;
CREATE DATABASE bibliotech;
USE bibliotech;

-- 2. Configuración de usuario de DB (Restricción de privilegios)
-- Principio de Menor Privilegio: SELECT para lectura y EXECUTE para invocar
-- los Stored Procedures. Impide INSERT, UPDATE y DELETE directos desde la aplicación.
-- GRANT ... IDENTIFIED BY crea el usuario si no existe y fija su contraseña;
-- funciona también en versiones antiguas de MariaDB/MySQL (a diferencia de
-- CREATE USER IF NOT EXISTS y ALTER USER ... IDENTIFIED BY).
GRANT SELECT, EXECUTE ON bibliotech.* TO 'bibliotech'@'localhost' IDENTIFIED BY 'bibliotech';

-- 3. Tabla de Roles (Normalización)
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

-- 4. Tabla de Usuarios
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla Intermedia: users_roles
-- (la aplicación asigna UN rol por usuario; la estructura permite ampliarlo)
CREATE TABLE users_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 6. Tabla de Documentos (reemplaza a samples)
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,                       -- quién lo subió
    filename VARCHAR(255) NOT NULL,             -- nombre físico en backend/uploads/
    original_name VARCHAR(255) NOT NULL,        -- nombre original, para la descarga
    title VARCHAR(150) NOT NULL,
    author VARCHAR(100),
    category VARCHAR(50),
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Inserción de Datos Maestros (Roles)
INSERT INTO roles (name) VALUES ('admin'), ('professor'), ('student');

-- 8. Datos de prueba iniciales (contraseña de los tres: 12345)
INSERT INTO users (id, username, password) VALUES (1, 'admin', '$2b$10$.n0s847tiSxBqDvIo6Vg5ujXC5zIUmm98bTjBWnRdqX9CxxbIo7wS');
INSERT INTO users_roles (user_id, role_id) VALUES (1, 1); -- Rol Admin

INSERT INTO users (id, username, password) VALUES (2, 'profesor', '$2b$10$.n0s847tiSxBqDvIo6Vg5ujXC5zIUmm98bTjBWnRdqX9CxxbIo7wS');
INSERT INTO users_roles (user_id, role_id) VALUES (2, 2); -- Rol Professor

INSERT INTO users (id, username, password) VALUES (3, 'estudiante', '$2b$10$.n0s847tiSxBqDvIo6Vg5ujXC5zIUmm98bTjBWnRdqX9CxxbIo7wS');
INSERT INTO users_roles (user_id, role_id) VALUES (3, 3); -- Rol Student

-- ==========================================================
-- 9. PROCEDIMIENTOS ALMACENADOS (Stored Procedures)
-- ==========================================================

DELIMITER //

-- --- PROCEDIMIENTOS PARA USERS ---

-- Buscar usuario por username (con su rol)
CREATE PROCEDURE sp_find_user_by_username(IN p_username VARCHAR(50))
BEGIN
    SELECT u.*, r.name as role 
    FROM users u
    JOIN users_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE u.username = p_username;
END //

-- Crear nuevo usuario y asignar rol por nombre
CREATE PROCEDURE sp_create_user(
    IN p_username VARCHAR(50), 
    IN p_password VARCHAR(255), 
    IN p_role_name VARCHAR(20)
)
BEGIN
    DECLARE v_user_id INT;
    DECLARE v_role_id INT;

    INSERT INTO users (username, password) VALUES (p_username, p_password);
    SET v_user_id = LAST_INSERT_ID();

    SELECT id INTO v_role_id FROM roles WHERE name = p_role_name;
    INSERT INTO users_roles (user_id, role_id) VALUES (v_user_id, v_role_id);
    
    SELECT v_user_id as insertId;
END //

-- Listar todos los usuarios
CREATE PROCEDURE sp_find_all_users()
BEGIN
    SELECT u.id, u.username, r.name as role, u.created_at 
    FROM users u
    JOIN users_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id;
END //

-- NUEVO: Cambiar el rol de un usuario (lo usa el administrador, por ejemplo
-- para convertir a un student en professor)
CREATE PROCEDURE sp_set_user_role(IN p_user_id INT, IN p_role_name VARCHAR(20))
BEGIN
    DECLARE v_found INT;

    SELECT COUNT(*) INTO v_found FROM users WHERE id = p_user_id;

    IF v_found > 0 THEN
        UPDATE users_roles 
        SET role_id = (SELECT id FROM roles WHERE name = p_role_name)
        WHERE user_id = p_user_id;
    END IF;

    SELECT v_found AS found;
END //

-- Borrar usuario (sus roles y documentos se borran en cascada)
CREATE PROCEDURE sp_delete_user(IN p_id INT)
BEGIN
    DELETE FROM users WHERE id = p_id;
END //

-- --- PROCEDIMIENTOS PARA DOCUMENTS ---

-- Crear documento
CREATE PROCEDURE sp_create_document(
    IN p_user_id INT,
    IN p_filename VARCHAR(255),
    IN p_original_name VARCHAR(255),
    IN p_title VARCHAR(150),
    IN p_author VARCHAR(100),
    IN p_category VARCHAR(50),
    IN p_file_path VARCHAR(255)
)
BEGIN
    INSERT INTO documents (user_id, filename, original_name, title, author, category, file_path)
    VALUES (p_user_id, p_filename, p_original_name, p_title, p_author, p_category, p_file_path);
    SELECT LAST_INSERT_ID() as insertId;
END //

-- Listar todos los documentos (catálogo para consulta).
-- No devuelve file_path para no exponer rutas del servidor.
CREATE PROCEDURE sp_find_all_documents()
BEGIN
    SELECT d.id, d.title, d.author, d.category, d.original_name, d.created_at,
           u.username AS uploaded_by
    FROM documents d
    JOIN users u ON u.id = d.user_id
    ORDER BY d.created_at DESC;
END //

-- Listar documentos de un usuario (panel del profesor y limpieza de archivos al borrar un usuario)
CREATE PROCEDURE sp_find_documents_by_user(IN p_user_id INT)
BEGIN
    SELECT * FROM documents WHERE user_id = p_user_id ORDER BY created_at DESC;
END //

-- Buscar un documento por id (para leerlo, descargarlo o verificar su dueño)
CREATE PROCEDURE sp_find_document_by_id(IN p_id INT)
BEGIN
    SELECT d.*, u.username AS uploaded_by
    FROM documents d
    JOIN users u ON u.id = d.user_id
    WHERE d.id = p_id;
END //

-- Borrar documento. La verificación de dueño (el professor solo borra lo suyo,
-- el admin borra cualquiera) se hace en el controlador.
CREATE PROCEDURE sp_delete_document(IN p_id INT)
BEGIN
    DELETE FROM documents WHERE id = p_id;
END //

DELIMITER ;
SET foreign_key_checks = 1;
