// Controlador en el servidor (favoritas.js)
const { pool } = require("../../Config/db");

exports.getFavoritaManicurista = async (req, res) => {
  try {
    const userEmail = req.params.email;
    // Consulta SQL para obtener la manicurista favorita
    const query = `
    SELECT DISTINCT m.nombre AS nombre_manicurista, m.fotoManicurista, m.descripcion
    FROM citas c
    JOIN manicurista m ON c.id_manicurista = m.idmanicurista
    JOIN usuarios u ON c.id_usuario = u.id
    WHERE u.email = ?
      AND c.favorito = TRUE
    ORDER BY c.fecha_del_servicio DESC;     
    `;

    // Ejecutar la consulta
    const [result] = await pool.promise().query(query, [userEmail]);

    console.log('Resultado de la consulta SQL:', result); // Agrega este log

    if (result.length > 0) {
      res.status(200).json(result);  // Modificación en esta línea
    } else {
      res.status(404).json({ message: 'Manicurista favorita no encontrada para el usuario.' });
    }
  } catch (error) {
    console.error('Error al obtener la manicurista favorita:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
