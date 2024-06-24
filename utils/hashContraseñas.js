const bcrypt = require('bcrypt');

async function hashContrasena(contrasena) {
  const hashedPassword = await bcrypt.hash(contrasena, 10);
  return hashedPassword;
}

async function compararContrasena(contrasena, contranaHasheada) {
  const result = await bcrypt.compare(contrasena, contranaHasheada);
  return result;
}

module.exports = { hashContrasena, compararContrasena };
