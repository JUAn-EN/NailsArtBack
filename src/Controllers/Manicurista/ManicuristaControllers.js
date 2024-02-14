const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require("../../Config/db");
// Cargar variables de entorno desde el archivo .env
require('dotenv').config();
const secretKey = process.env.SECRET_KEY;

exports.createManicurista = async (req, res) => {
    try {
        console.log('Datos de la manicurista:', req.body);

        const { nombre, apellido, emailPersonal, emailApp, contrasenaApp, celular, direccion, descripcion } = req.body;

        if (!nombre || !apellido || !emailPersonal || !emailApp || !contrasenaApp || !celular || !direccion) {
            return res.status(400).json({ message: "Faltan campos obligatorios" });
        }

        console.log('Petición recibida:', req.body);

        const [existingUser] = await pool.promise().query("SELECT * FROM manicurista WHERE emailApp = ?", [emailApp]);

        if (existingUser.length > 0) {
            return res.status(400).json({ message: "El correo ya se encuentra registrado" });
        }

        const hashedPassword = await bcrypt.hash(contrasenaApp, 10);

        const [insertUser] = await pool.promise().query(
            "INSERT INTO usuarios (nombre, apellido, email, contraseña, rol) VALUES (?, ?, ?, ?, 'manicurista')",
            [nombre, apellido, emailApp, hashedPassword]
        );

        
        const usuarioId = insertUser.insertId;

    
        const [insertManicurista] = await pool.promise().query(
            "INSERT INTO manicurista (id_usuario, nombre, apellido, emailPersonal, emailApp, contraseñaApp, celular, direccion, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [usuarioId, nombre, apellido, emailPersonal, emailApp, hashedPassword, celular, direccion, descripcion]
        );

        if (insertManicurista.affectedRows) {
            const usuarioId = insertUser.insertId;
            const token = jwt.sign({ usuarioId }, secretKey, { expiresIn: '1h' });
            return res.status(200).json({ message: "Se ha creado correctamente la manicurista", token });
        } else {
            return res.status(500).json({ message: "No se ha podido crear la manicurista" });
        }
    } catch (error) {
        console.error('Error en el controlador:', error);
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

exports.getManicurista = async (req, res) => {
    try {
        const [list] = await pool.promise().query(`SELECT * FROM manicurista`);
        return res.status(200).json(list);
    } catch (error) {
        console.error('Error en el controlador:', error);
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

exports.updateManicurista = async (req, res) => {
    try {
        console.log('Iniciando la actualización del manicurista...');

        const { idmanicurista, nombre, apellido, emailPersonal, emailApp, contrasenaApp, celular, direccion, descripcion } = req.body;

        console.log('Datos del manicurista a actualizar:', req.body);

        // Verificar si se está intentando actualizar la contraseña
        const isUpdatingPassword = contrasenaApp !== undefined && contrasenaApp !== null;

        if (isUpdatingPassword) {
            console.log('Contraseña antes de hash:', contrasenaApp);
            const hashedPassword = await bcrypt.hash(contrasenaApp, 10);
            console.log('Contraseña después de hash:', hashedPassword);

            // Utiliza la nueva contraseña encriptada en la consulta de actualización
            const updateQuery = `
                UPDATE manicurista
                SET nombre = ?, apellido = ?, emailPersonal = ?, emailApp = ?, contraseñaApp = ?, celular = ?, direccion = ?, descripcion = ?
                WHERE idmanicurista = ?
            `;

            const [updateResult] = await pool.promise().query(updateQuery, [nombre, apellido, emailPersonal, emailApp, hashedPassword, celular, direccion, descripcion, idmanicurista]);
        } else {
            // Si no se está actualizando la contraseña, utiliza el código original
            const updateQuery = `
                UPDATE manicurista
                SET nombre = ?, apellido = ?, emailPersonal = ?, emailApp = ?, celular = ?, direccion = ?, descripcion = ?
                WHERE idmanicurista = ?
            `;

            const [updateResult] = await pool.promise().query(updateQuery, [nombre, apellido, emailPersonal, emailApp, celular, direccion, descripcion, idmanicurista]);
        }

        // Resto del código...

        console.log('Manicurista actualizado correctamente');

        return res.status(200).json({ message: "Manicurista actualizado correctamente" });

    } catch (error) {
        console.error('Error en el controlador de actualización de manicurista:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "El correo ya se encuentra registrado" });
        }

        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};


exports.eliminarManicurista = async (req, res) => {
    try {
        const idmanicurista = req.params.idmanicurista;

        if (!idmanicurista) {
            return res.status(400).json({ message: 'Falta el ID del manicurista' });
        }

        const [existingManicurista] = await pool.promise().query("SELECT * FROM manicurista WHERE idmanicurista = ?", [idmanicurista]);

        if (existingManicurista.length === 0) {
            return res.status(404).json({ message: "El manicurista no existe" });
        }

        const deleteQuery = "DELETE FROM manicurista WHERE idmanicurista = ?";
        const [deleteResult] = await pool.promise().query(deleteQuery, [idmanicurista]);

        if (deleteResult.affectedRows > 0) {
            return res.status(200).json({ message: "Manicurista eliminado correctamente" });
        } else {
            return res.status(500).json({ message: "No se ha podido eliminar el manicurista" });
        }
    } catch (error) {
        console.error('Error en el controlador de eliminación de manicurista:', error);
        return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};


exports.loginManicurista = async (req, res) => {
    try {
        const { emailApp, contrasenaApp } = req.body;

        if (!emailApp || !contrasenaApp) {
            return res.status(400).json({ message: "Faltan campos obligatorios" });
        }

        const [manicurista] = await pool.promise().query("SELECT * FROM manicurista WHERE emailApp = ?", [emailApp]);

        if (manicurista.length === 0) {
            return res.status(404).json({ message: "No se encontró la manicurista" });
        }

        const hashedPassword = manicurista[0].contraseñaApp;

        const isPasswordValid = await bcrypt.compare(contrasenaApp, hashedPassword);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Contraseña incorrecta" });
        }

        // Generar token de sesión
        const token = jwt.sign({ manicuristaId: manicurista[0].idmanicurista, rol: 'manicurista' }, secretKey, { expiresIn: '1h' });

        // Devolver datos de la manicurista y el token
        return res.status(200).json({
            message: "Inicio de sesión exitoso",
            nombre: manicurista[0].nombre,
            apellido: manicurista[0].apellido,
            token
        });

    } catch (error) {
        console.error('Error en el controlador de inicio de sesión de manicurista:', error);
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

exports.buscarPorNombre = async (req, res) => {
    try {
      const nombre = req.params.nombre;
  
      if (!nombre) {
        return res.status(400).json({ message: 'Falta el nombre para la búsqueda' });
      }
  
      const [manicuristas] = await pool.promise().query("SELECT * FROM manicurista WHERE nombre LIKE ?", [`%${nombre}%`]);
  
      if (manicuristas.length === 0) {
        return res.status(404).json({ message: "No se encontraron manicuristas con ese nombre" });
      }
  
      return res.status(200).json(manicuristas);
    } catch (error) {
      console.error('Error en el controlador de búsqueda de manicuristas por nombre:', error);
      return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
  };
  