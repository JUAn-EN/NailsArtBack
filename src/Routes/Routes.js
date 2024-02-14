const express = require("express");
const router = express.Router();
const UsuriosControllers = require("../Controllers/UsuariosController.js");
const Manicurista = require("../Controllers/Manicurista/ManicuristaControllers.js");
const verifyToken = require('../Middleware/verifyToken.js');
const AgendaCitas = require('../Controllers/agendamientoCitas/AgendarcitasControllers.js');
const empleadosController = require('../Controllers/TrabajaConNosotros/TrabajaNosotrosControllers.js');
const favoritasController = require('../Controllers/favoritas/favoritas.js');
const EstadoDeCitaController = require('../Controllers/estadoCitaModal/estadoCitaModal.js')

router.get("/", (req, res) => {
    res.json({
        mensaje: "Bienvenido a la api de Nails art"
    });
});

// Rutas para el usuario
router.post("/createusuario", UsuriosControllers.createUser);
router.post("/loginUsuario", UsuriosControllers.loginUser);

// Rutas para el CRUD de manicuristas
router.post("/createManicurista", Manicurista.createManicurista);
router.get('/manicuristas', Manicurista.getManicurista);
router.put("/updateManicurista", Manicurista.updateManicurista);
router.delete("/eliminarManicurista/:idmanicurista", Manicurista.eliminarManicurista);
router.post('/loginManicurista', Manicurista.loginManicurista);
router.get('/buscar-por-nombre/:nombre', Manicurista.buscarPorNombre);

// Rutas para agendar una cita
router.post("/crearCita", AgendaCitas.createCita);
router.get("/citas/:fecha", AgendaCitas.obtenerCitasPorFecha);

// Rutas para el Trabajador Candidato
router.post('/createEmpleadoCandidato', empleadosController.upload.single('hojaVidaFile'), empleadosController.createEmpleadoCandidato);
router.get('/getAllEmpleadosCandidatos/:email', empleadosController.getAllEmpleadosCandidatos);
router.post('/sendEmailWithEmpleadosData', empleadosController.sendEmailWithEmpleadosData);

//Rutas de favoritos
router.get('/manicurista/favorita/:email', favoritasController.getFavoritaManicurista);


//Rutas de Cambio de estado
router.put('/cambioDeEstado', EstadoDeCitaController.cambioEstado);
router.get('/citas/:id_cita', EstadoDeCitaController.obtenerCita);
router.get('/citasUsuario', EstadoDeCitaController.obtenerCitasUsuario);


module.exports = router;