const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require("../Config/db");
 
// Cargar variables de entorno desde el archivo .env
require('dotenv').config();
const secretKey = process.env.SECRET_KEY;

// Uso de Variables de Entorno
if (!secretKey) {
    console.error('La clave secreta no está configurada correctamente en el archivo .env.');
    process.exit(1); // Termina la aplicación con un código de error
}

exports.createUser = async (req, res) => {
    try {
        const { nombre, apellido, email, contrasena, rol } = req.body;
        console.log('FormData en el servidor:', req.body);

        if (!nombre || !apellido || !email || !contrasena || !rol) {
            return res.status(400).json({ message: "Faltan campos obligatorios" });
        }

        console.log('Petición recibida:', req.body);

        const passwordHash = await bcrypt.hash(contrasena, 12);

        const [existingUser] = await pool.promise().query("SELECT * FROM usuarios WHERE email = ?", [email]);

        if (existingUser.length > 0) {
            return res.status(400).json({ message: "El correo ya se encuentra registrado" });
        }

        const [insertUser] = await pool.promise().query(
            "INSERT INTO usuarios (nombre, apellido, email, contraseña, rol) VALUES (?, ?, ?, ?, ?)",
            [nombre, apellido, email, passwordHash, rol]
        );

        if (insertUser.affectedRows) {
            const usuarioId = insertUser.insertId; 
            const token = jwt.sign({ usuarioId }, secretKey, { expiresIn: '1h' });
            return res.status(200).json({ message: "Se ha creado correctamente el usuario", token });
        } else {
            return res.status(500).json({ message: "No se ha podido crear el usuario" });
        }
    } catch (error) {
        console.error('Error en el controlador:', error);
        console.error(error);
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};


async function insertarAdmin() {
    try {
      const contraseña = '123456784'; 
  
      
      const passwordHash = await bcrypt.hash(contraseña, 12);

   
      const [existingAdmin] = await pool.promise().query("SELECT * FROM usuarios WHERE rol = 'admin'");

      if (existingAdmin.length === 0) {
        const [insertUser] = await pool.promise().query(
          "INSERT INTO usuarios (nombre, apellido, email, contraseña, rol) VALUES ('juan', 'gonza', 'admin12@gmail.com', ?, 'admin')",
          [passwordHash]
        );

        if (insertUser.affectedRows) {
          console.log('Usuario administrador insertado correctamente en la base de datos.');
        } else {
          console.log('No se pudo insertar el usuario administrador en la base de datos.');
        }
      } else {
        console.log('Ya existe un administador en la base de datos. No se insertará uno nuevo.');
      }
    } catch (error) {
      console.error('Error al insertar el usuario administrador:', error.message);
    } finally {

    }
}


insertarAdmin();
exports.loginUser = async (req, res) => {
    try {
        const { email, contrasena } = req.body;
        console.log('Datos recibidos para iniciar sesión:', req.body);

        if (!email || !contrasena) {
            return res.status(400).json({ message: "Faltan campos obligatorios" });
        }

        const [user] = await pool.promise().query("SELECT * FROM usuarios WHERE email = ?", [email]);
        console.log('Resultado de la consulta a la base de datos:', user);

        if (user.length === 0) {
            return res.status(401).json({ message: "Correo o contraseña incorrectos" });
        }

        const passwordMatch = await bcrypt.compare(contrasena, user[0].contraseña);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Correo o contraseña incorrectos" });
        }

        const usuarioId = user[0].id;
        const token = jwt.sign({ usuarioId,rol: user[0].rol  }, secretKey, { expiresIn: '1h' });

        return res.status(200).json({
            message: "Inicio de sesión exitoso",
            token,
            usuario: {
                id: user[0].id,
                nombre: user[0].nombre,
                apellido: user[0].apellido,
                email: user[0].email,
                rol: user[0].rol
            }
        });
    } catch (error) {
        console.error('Error en el controlador de inicio de sesión:', error);
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

