const { pool } = require("../../Config/db");


exports.cambioEstado = async (req, res) => {
    try {
        console.log('Iniciando cambio de estado de la cita...');

        const { id_cita, nuevo_estado } = req.body;

        console.log('Datos de la cita a actualizar:', req.body);

        // Realiza la consulta de actualización
        const updateQuery = `
            UPDATE citas
            SET estado = ?
            WHERE id_cita = ?
        `;

        const [updateResult] = await pool.promise().query(updateQuery, [nuevo_estado, id_cita]);

        console.log('Cita actualizada correctamente');

        return res.status(200).json({ message: "Estado de la cita actualizado correctamente" });

    } catch (error) {
        console.error('Error en el controlador de cambio de estado de la cita:', error);

        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

exports.obtenerCita = async (req, res) => {
    try {
        console.log('Iniciando consulta de cita...');

        const { id_cita } = req.params;

        console.log('ID de la cita a consultar:', id_cita);

        // Realiza la consulta para obtener la cita
        const selectQuery = `
            SELECT *
            FROM citas
            WHERE id_cita = ?
        `;

        const [cita] = await pool.promise().query(selectQuery, [id_cita]);

        // Verifica si se encontró la cita
        if (cita.length === 0) {
            return res.status(404).json({ message: "Cita no encontrada" });
        }

        console.log('Cita consultada correctamente');

        return res.status(200).json({ cita });

    } catch (error) {
        console.error('Error en el controlador de consulta de cita:', error);

        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};