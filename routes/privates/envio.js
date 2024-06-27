const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer')



router.get('/inicios/maestros', (req, res) => {

  res.status(200).sendFile('/home/mj99lopez/Escritorio/SistemaDeGestionDeEstudiantesProyecto/public/paginas/inicioMaestros.html')
})


module.exports=router