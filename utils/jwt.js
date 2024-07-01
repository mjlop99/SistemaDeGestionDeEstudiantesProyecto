const jwt = require('jsonwebtoken');
require('dotenv').config();

function generarAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '6h' });  // Token expira en 15 minutos
}

function generarRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });  // Refresh token expira en 7 días
}

function verificarToken(token, secret) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return error; // Token inválido
  }
}


module.exports = { generarAccessToken, generarRefreshToken, verificarToken };
