const jwt = require('jsonwebtoken');
const { pool } = require("../../Config/db");
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
// Cargar variables de entorno desde el archivo .env
require('dotenv').config();
const secretKey = process.env.SECRET_KEY;

// Uso de Variables de Entorno
if (!secretKey) {
    console.error('La clave secreta no está configurada correctamente en el archivo .env.');
    process.exit(1); // Termina la aplicación con un código de error
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'artn2387@gmail.com',
        pass: 'lngs nxea womv lfsf'
    },
    port: 587,  
    secure: false,
});

console.log(transporter);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, callback) {
        const ext = path.extname(file.originalname);
        if (ext !== '.pdf') {
            return callback(new Error('Solo se permiten archivos PDF'));
        }
        console.log('Archivo recibido:', file);
        callback(null, true);
    },
});

exports.upload = upload;

exports.createEmpleadoCandidato = async (req, res) => {
    try {
        const { nombre, apellido, email, telefono, aceptoPrivacidad } = req.body;

        // Verificar si hay un archivo adjunto
        if (!req.file) {
            return res.status(400).json({ message: "Falta el archivo adjunto (hoja de vida)" });
        }

        // Validar campos obligatorios
        if (!nombre || !apellido || !email || !telefono || !aceptoPrivacidad) {
            return res.status(400).json({ message: "Faltan campos obligatorios" });
        }

        const hojaVidaFile = req.file;
        const host = req.get('host');
        const fileUrl = `${req.protocol}://${host}/${hojaVidaFile.path}`;
        console.log('Solicitud recibida:', req.body, fileUrl, req.file);

        const [insertEmpleado] = await pool.promise().query(
            "INSERT INTO empleadosCandidatos (nombre, apellido, email, telefono, hoja_vida_path, acepto_privacidad) VALUES (?, ?, ?, ?, ?, ?)",
            [nombre, apellido, email, telefono, fileUrl, aceptoPrivacidad]
        );

        const empleadoId = insertEmpleado.insertId;
        const token = jwt.sign({ empleadoId }, secretKey, { expiresIn: '1h' });
        res.status(200).json({ message: "Se ha creado correctamente el empleado candidato", token });
    } catch (error) {
        console.error('Error en el controlador:', error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

exports.getAllEmpleadosCandidatos = async (req, res) => {
    try {
        const { email } = req.params; // Obtener el correo electrónico de los parámetros de la ruta
        console.log(req.body);
        const [empleadoCandidato] = await pool
            .promise()
            .query("SELECT * FROM empleadosCandidatos WHERE email = ?", [email]);

        if (empleadoCandidato.length > 0) {
            res.status(200).json({
                message: "Datos del empleado candidato obtenidos correctamente",
                data: empleadoCandidato,
            });
        } else {
            res.status(404).json({ message: "No se encontró el empleado candidato con ese correo electrónico" });
        }
    } catch (error) {
        console.error('Error en el controlador:', error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// ...

// ...

exports.sendEmailWithEmpleadosData = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Correo electrónico no proporcionado en la solicitud.' });
        }

        const [empleadoCandidato] = await pool
            .promise()
            .query("SELECT * FROM empleadosCandidatos WHERE email = ?", [email]);

        if (empleadoCandidato.length > 0) {
            const senderEmail = 'artn2387@gmail.com';
            const data = empleadoCandidato;

            // Obtenemos la ruta del PDF directamente de la base de datos
            const pdfPath = data[0].hoja_vida_path;

            // Enviamos el correo con el PDF como adjunto
            await sendEmailWithAttachment(data, senderEmail, pdfPath, req);

            res.status(200).json({ message: "Datos del empleado candidato enviados por correo electrónico correctamente" });
        } else {
            res.status(404).json({ message: "No se encontró el empleado candidato con ese correo electrónico" });
        }
    } catch (error) {
        console.error('Error en el controlador:', error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

async function sendEmailWithAttachment(data, senderEmail, pdfPath, req) {
    try {
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${path.basename(pdfPath)}`;
        const mailOptions = {
            from: senderEmail,
            to: 'artn2387@gmail.com',
            subject: 'Datos de empleados candidatos',
            text: `Datos de empleados candidatos:\n\n${JSON.stringify(data, null, 2)}`,
            html: `
                <html>
                    <head>
                        <style>
                            body {
                                font-family: 'Arial', sans-serif;
                                margin: 20px;
                            }
                            h1 {
                                color: #3498db;
                            }
                            p {
                                margin-bottom: 10px;
                            }
                        </style>
                    </head>
                    <body>
                        <h1>Datos de empleados candidatos</h1>
                        <p>Nombre: ${data[0].nombre}</p>
                        <p>Apellido: ${data[0].apellido}</p>
                        <p>Email: ${data[0].email}</p>
                        <p>Teléfono: ${data[0].telefono}</p>
                        <p>Adjunto encontrarás la hoja de vida del candidato.</p>
                        <p>Ruta del PDF: <a href="${fileUrl}" target="_blank">Ver hoja de vida</a></p>
                        <p>Gracias,</p>
                        <p>Tu Nombre</p>
                    </body>
                </html>
            `,
            attachments: [
                {
                    filename: 'hojaVida.pdf',
                    path: pdfPath,
                    encoding: 'base64',
                },
            ],
        };

        console.log('Opciones de correo electrónico:', mailOptions);
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error al enviar el correo electrónico:', error);
            } else {
                console.log('Correo electrónico enviado:', info.response);
            }
        });
        console.log('Correo electrónico enviado exitosamente.');
    } catch (error) {
        console.error('Error al enviar el correo electrónico:', error);
        console.error('Detalles del error:', error.response);
        throw new Error(`Error al enviar el correo electrónico: ${error.message}`);
    }
}