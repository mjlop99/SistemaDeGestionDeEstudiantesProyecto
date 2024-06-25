const express = require('express');
const router = express.Router();
const {hashContrasena,compararContrasena} = require('../utils/hashContraseñas');
const { generarAccessToken, generarRefreshToken ,verificarToken} = require('../utils/jwt');
const USUARIO = require('../models/Usuario');
const mongoose = require('mongoose');

// Ruta para iniciar sesión y obtener tokens
router.post('/login', async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    // Buscar el usuario por correo electrónico
    const usuario = await USUARIO.findOne({ correo });

    if (!usuario) {
      return res.status(401).send('Correo o contraseña incorrectos');
    }

    // Comparar la contraseña proporcionada con la almacenada
    const contrasenaValida = compararContrasena(contrasena, usuario.contrasena);

    if (!contrasenaValida) {
      return res.status(401).send('Correo o contraseña incorrectos');
    }

    // Generar tokens
    const accessToken = generarAccessToken({ id: usuario._id, role: usuario.role });
    const refreshToken = generarRefreshToken({ id: usuario._id });

    // deberiamos almacenar el refreshToken en localstorage o en una cookie segura en el cliente

    return res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    return res.status(500).send('Error en el servidor');
  }
});

router.post('/registro', async (req, res) => {
    const { nombre, correo, contrasena, role } = req.body;
  
    try {
      // Verificar si el usuario ya existe por correo electrónico
      const usuarioExistente = await USUARIO.findOne({ correo });
  
      if (usuarioExistente) {
        return res.status(401).send('Error: este correo ya ha sido registrado');
      }
  
      // Hash de la contraseña
      const contrasenaHasheada = await hashContrasena(contrasena);
  
      // Crear el nuevo usuario
      const nuevoUsuario = new USUARIO({
        nombre,
        correo,
        contrasena: contrasenaHasheada,
        role
      });
  
      // Guardar el nuevo usuario en la base de datos
      await nuevoUsuario.save();
  
      return res.status(200).json({ message: 'Usuario registrado exitosamente', nuevoUsuario });
    } catch (error) {
      console.error('Error al registrar el usuario:', error);
      return res.status(500).send('Ha ocurrido un error al registrar el usuario');
    }
  });

// Ruta para refrescar el token de acceso
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(403).json({ message: 'Token de refresco no proporcionado' });
  }

  try {
    // Verificar el token de refresco
    const decoded = verificarToken(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (!decoded) {
      return res.status(403).json({ message: 'Token de refresco inválido' });
    }

    // Generar un nuevo token de acceso
    const accessToken = generarAccessToken({ id: decoded.id });

    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error('Error al refrescar el token:', error);
    return res.status(500).send('Error en el servidor');
  }
});

// Buscar usuarios por id
router.get('/usuario/:id', async (req, res) => {
  const { id } = req.params;

  // Validar que el id sea un ObjectId válido
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send('ID inválido');
  }

  try {
    const usuario = await USUARIO.findById(id);

    if (!usuario) {
      return res.status(404).send('Usuario no encontrado');
    }

    return res.status(200).json(usuario);
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    return res.status(500).send('Error en el servidor');
  }
});

//Ruta para obtener todos los tipos de usuario
router.get('/tiposUsuario', async (req, res) => {
  try {
    const tipos = await USUARIO.distinct('role');
    return res.status(200).json(tipos);
  } catch (error) {
    console.error('Error al obtener los tipos de usuario:', error);
    return res.status(500).send('Error en el servidor');
  }
});

//ruta para obtener todos los usuarios registrados
router.get('/usuarios', async (req, res) => {
  try {
    // Obtener todos los usuarios y seleccionar solo el campo 'correo'
    
    const correos = await USUARIO.find({}, 'correo');
    return res.status(200).json(correos);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    return res.status(500).send('Error en el servidor');
  }

});

// Actualizar un usuario por ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { role, nombres, apellidos, correo, contrasena } = req.body;

  // Validar que el id sea un ObjectId válido
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  try {
    const usuario = await USUARIO.findById(id);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Actualizar los campos del usuario
    if (role) usuario.role = role;
    if (nombres) usuario.nombres = nombres;
    if (apellidos) usuario.apellidos = apellidos;
    if (correo) usuario.correo = correo;
    if (contrasena) {
      const contrasenaHasheada = await hashContrasena(contrasena);
      usuario.contrasena = contrasenaHasheada;
    }

    // Guardar los cambios en la base de datos
    await usuario.save();

    return res.status(200).json(usuario);
  } catch (err) {
    console.error('Error al actualizar el usuario:', err);
    return res.status(500).json({ error: 'Error al actulizar los datos' });
  }
});

module.exports = router;

