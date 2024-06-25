const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const rutasPublicas=require('./routes/public')
const rutasPruebas=require('./routes/pruebas')
const APP= express();
const PORT=process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI).
    then(()=> console.log("se ha conectado a la base de datos")).
    catch(()=> console.log("error al conectarse a la base de datos"));

APP.use(express.json());
APP.use(express.static('public'));

APP.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });

APP.use("/api/public",rutasPublicas)
APP.use("/api/public",rutasPruebas)