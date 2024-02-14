const app = require("./index");

const port = 4000;
app.listen(port, function () {
    console.log("La aplicación se encuentra en ejecución en el puerto:", port);
});
