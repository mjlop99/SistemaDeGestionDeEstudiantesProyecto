const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer')
const { generarAccessToken, generarRefreshToken, verificarToken } = require('../../utils/jwt');
const path=require('path')
require('dotenv').config();


router.get('/inicios/maestro', (req, res) => {
  const accessToken = req.headers['accesstoken']
  const refreshToken = req.headers['refreshtoken']

  
  const info=tokenDestructurado(accessToken,refreshToken)

  if (!info || info === null) {
    return res.status(401).send({mensaje:"no tienes permiso"})
  }

  try {
    if (info.role==='maestro') {
      const filePath = path.join(__dirname, '../../public/inicioMaestros.html')
      return res.status(200).sendFile(filePath)
    }else{
      return res.status(403).json({ message: "No autorizado" });
    }
    
  } catch (error) {
    console.log(error);
  }
})

router.get('/inicios/director', (req, res) => {
  const accessToken = req.headers['accesstoken']
  const refreshToken = req.headers['refreshtoken']
  
  const info=tokenDestructurado(accessToken,refreshToken)
  
  if (!info || info === null) {
    return res.status(401).send({mensaje:"no tienes permiso"})
  }
  
  if (info.role==='director') {
    const filePath = path.join(__dirname, '../../public/directorInicio.html')
    return res.status(200).sendFile(filePath)
  }else{
    return res.status(403).json({ message: "No autorizado" });
  }
  
})
router.get('/inicios/estudiante', (req, res) => {
  const accessToken = req.headers['accesstoken']
  const refreshToken = req.headers['refreshtoken']
  
  const info=tokenDestructurado(accessToken,refreshToken)
  
  if (!info || info === null) {
    return res.status(401).send({mensaje:"no tienes permiso"})
  }
  
  if (info.role==='estudiante') {
    const filePath = path.join(__dirname, '../../public/estudianteInicio.html')
    return res.status(200).sendFile(filePath)
  }else{
    return res.status(403).json({ message: "No autorizado" });
  }

})


const tokenDestructurado = (accessToken, refreshToken) => {
  const decodedAccess = verificarToken(accessToken, process.env.JWT_SECRET);
  const decodedRefreshAccess = verificarToken(refreshToken, process.env.JWT_SECRET);
  if (decodedAccess || decodedRefreshAccess) {
    const id = (decodedAccess && decodedAccess.id) || (decodedRefreshAccess && decodedRefreshAccess.id);
    const role = (decodedAccess && decodedAccess.role) || (decodedRefreshAccess && decodedRefreshAccess.role);

    return { id, role };
  }
  return null;
};

module.exports = router