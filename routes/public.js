const express = require('express');
const router = express.Router();
const { hashContrasena, compararContrasena } = require('../utils/hashContraseñas');
const { generarAccessToken, generarRefreshToken, verificarToken } = require('../utils/jwt');
const USUARIO = require('../models/Usuario');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken');
require('dotenv').config();

router.post('/login', async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    // Buscar el usuario por correo electrónico
    const usuario = await USUARIO.findOne({ correo });

    if (!usuario) {
      return res.status(401).send('Correo o contraseña incorrectos');
    }

    // Comparar la contraseña proporcionada con la almacenada
    const contrasenaValida = await compararContrasena(contrasena, usuario.contrasena);

    if (!contrasenaValida) {
      return res.status(401).send('Correo o contraseña incorrectos');
    }

    // Generar tokens
    const accessToken = generarAccessToken({ id: usuario._id, role: usuario.role });
    const refreshToken = generarRefreshToken({ id: usuario._id });

    // Deberíamos almacenar el refreshToken en localstorage o en una cookie segura en el cliente

    return res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    return res.status(500).send('Error en el servidor');
  }
});


router.post('/registro', async (req, res) => {
  const { nombres, apellidos, correo, contrasena, role } = req.body;

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
      nombres,
      apellidos,
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
  const { token } = req.body

  const decoded = verificarToken(token, process.env.JWT_SECRET)

  if (decoded != null) {
    console.log(decoded);
  }


  // Validar que el id sea un ObjectId válido
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send('autorizacion denegada');
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

    const usuarios = await USUARIO.find({}, 'nombres correo role');
    return res.status(200).json(usuarios);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    return res.status(500).send('Error en el servidor');
  }

});

// Ruta para que los usuarios actualicen sus datos según sus permisos
router.put('/actualizar', async (req, res) => {
  const { nombres, apellidos, correo, contrasena, role } = req.body;
  const accessToken = req.headers['accesstoken'];


  // Validar que el id sea un ObjectId válido
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  try {
    // Verificar el token de acceso
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ error: 'No estás autorizado' });
    }

    // Obtener el usuario que hace la solicitud
    const usuario = await USUARIO.findById(decoded.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Actualizar los campos del usuario según su rol
    switch (usuario.role) {
      case 'director':
        if (nombres) usuario.nombres = nombres;
        if (apellidos) usuario.apellidos = apellidos;
        if (correo) usuario.correo = correo;
        if (contrasena) {
          // Generar un token de confirmación
          const token = jwt.sign({ id: usuario._id, correo: usuario.correo, nuevaContrasena: contrasena }, process.env.JWT_SECRET, { expiresIn: '1h' });

          // Configurar el transporte de nodemailer
          const transporter = nodemailer.createTransport({
            service: 'outlook', // Puedes usar cualquier servicio de correo que prefieras
            auth: {
              user: process.env.EMAIL, // Tu correo electrónico
              pass: process.env.EMAIL_PASSWORD // Tu contraseña de correo electrónico
            }
          });

          // Enviar el correo electrónico con el enlace de confirmación
          const mailOptions = {
            from: process.env.EMAIL,
            to: usuario.correo,
            subject: 'Confirmación de cambio de contraseña',
            text: `Para cambiar tu contraseña, haz clic en el siguiente enlace: ${process.env.CLIENT_URL}/confirmar-cambio-contrasena/${token}`
          };

          await transporter.sendMail(mailOptions); 
        }
        if (role) usuario.role = role;
        break;

      case 'maestro':
        if (nombres) usuario.nombres = nombres;
        if (apellidos) usuario.apellidos = apellidos;
        if (correo) usuario.correo = correo;
        if (contrasena) {
          // Generar un token de confirmación
          const token = jwt.sign({ id: usuario._id, correo: usuario.correo, nuevaContrasena: contrasena }, process.env.JWT_SECRET, { expiresIn: '1h' });

          // Configurar el transporte de nodemailer
          const transporter = nodemailer.createTransport({
            service: 'outlook', // Puedes usar cualquier servicio de correo que prefieras
            auth: {
              user: process.env.EMAIL, // Tu correo electrónico
              pass: process.env.EMAIL_PASSWORD // Tu contraseña de correo electrónico
            }
          });

          // Enviar el correo electrónico con el enlace de confirmación
          const mailOptions = {
            from: process.env.EMAIL,
            to: usuario.correo,
            subject: 'Confirmación de cambio de contraseña',
            text: `Para cambiar tu contraseña, haz clic en el siguiente enlace: ${process.env.CLIENT_URL}/confirmar-cambio-contrasena/${token}`
          };

          await transporter.sendMail(mailOptions); 
        }
        break;

      case 'estudiante':
        if (correo) usuario.correo = correo;
        if (contrasena) {
          // Generar un token de confirmación
          const token = jwt.sign({ id: usuario._id, correo: usuario.correo, nuevaContrasena: contrasena }, process.env.JWT_SECRET, { expiresIn: '1h' });

          // Configurar el transporte de nodemailer
          const transporter = nodemailer.createTransport({
            service: 'outlook', // Puedes usar cualquier servicio de correo que prefieras
            auth: {
              user: process.env.EMAIL, // Tu correo electrónico
              pass: process.env.EMAIL_PASSWORD // Tu contraseña de correo electrónico
            }
          });

          // Enviar el correo electrónico con el enlace de confirmación
          const mailOptions = {
            from: process.env.EMAIL,
            to: usuario.correo,
            subject: 'Confirmación de cambio de contraseña',
            text: `Para cambiar tu contraseña, haz clic en el siguiente enlace: ${process.env.CLIENT_URL}/confirmar-cambio-contrasena/${token}`
          };

          await transporter.sendMail(mailOptions); 
        }
        break;

      default:
        return res.status(403).json({ error: 'Rol no permitido' });
    }

    // Guardar los cambios en la base de datos
    await usuario.save();

    return res.status(200).json({usuario, message: 'Correo de confirmación enviado. Verifica tu correo para confirmar el cambio de contraseña.'})

  } catch (err) {
    console.error('Error al actualizar el usuario:', err);
    return res.status(500).json({ error: 'Error al actualizar los datos' });
  }
});
// Ruta para confirmar el cambio de contraseña
router.post('/confirmar/:token', async (req, res) => {
  const { token } = req.params;

  try {
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    // Encontrar al usuario por ID
    const usuario = await USUARIO.findById(decoded.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Cambiar la contraseña del usuario
    const contrasenaHasheada = await hashContrasena(decoded.nuevaContrasena);
    usuario.contrasena = contrasenaHasheada;

    // Guardar los cambios en la base de datos
    await usuario.save();

    return res.status(200).json({ message: 'Contraseña cambiada exitosamente' });
  } catch (error) {
    console.error('Error al cambiar la contraseña:', error);
    return res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
});

// Recuperar contraseña 
router.post('/sendEmail', async (req, res) => {
  const { correo } = req.body   // Capturamos el correo
  try {
    const usuario = await USUARIO.findOne({ correo })  //Validamos si el usuario existe
    if (!usuario) {
      res.status(400).json({ message: "Correo no encontrado" })
    }
    const token = generarAccessToken({ id: usuario._id })  //Generamos el token

    //Configuración del Transportador de Nodemailer
    const transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.S_EMAIL,
        pass: process.env.S_PASSWORD,
      }
    })

    //Definición de las Opciones del Correo Electrónico
    const mailOptions = {
      to: usuario.correo,
      from: process.env.S_EMAIL,
      subject: 'Recuperación de Contraseña',
      text: `Haz clic en el siguiente enlace para recuperar tu contraseña: http://localhost:3000/api/public/changePassword/${token}`
      //Depende de el puerto y la direccion de Frontend
    };

    await transporter.sendMail(mailOptions)
    res.status(200).json({ message: "Correo de recuperacion enviado" })

  } catch (err) {
    res.status(401).json({ message: "Correo de recuperación no enviado" })
  }
})


router.post('/changePassword', async (req, res) => {
  const { token } = req.params;   //Captura del Token y la Nueva Contraseña
  const { newPassword } = req.body;

  try {//Verificación del Token
    const decode = verificarToken(token, process.env.JWT_SECRET)
    if (!decode) {
      res.status(401).json({ message: "Token invalido" })
    }
    const usuario = await USUARIO.findOne({ _id: decode.id }) //Búsqueda del Usuario

    if (!usuario) {
      return res.status(401).json({ message: 'El Usuario no fue encontrado' });
    }
    const contrasenaHasheada = await hashContrasena(newPassword) //Hash de la Nueva Contraseña
    usuario.contrasena = contrasenaHasheada
    await usuario.save()   //Guardar el Usuario Actualizado

    res.status(200).json({ message: 'Contraseña actualizada exitosamente' })

  } catch (err) {
    res.status(401).json({ message: 'Error al reestablecer la contraseña' })
  }
})

//methodo para buscar un alumno dado su correo este debe verificarse jwt de un role profesor

router.get('/usuarios/:correo', async (req, res) => {
  const correo=req.params.correo

  try {
    const Estudiante = await USUARIO.findOne({correo});
    return res.status(200).json(Estudiante);
  } catch (error) {
    console.error('Error al obtener el estudiante:', error);
    return res.status(500).send('Error en el servidor');
  }

});
//obtener usuario por token
router.get('/usuariobyToken', async (req, res) => {

  const accessToken=req.headers['accesstoken']
  try {
    const decoded=verificarToken(accessToken,process.env.JWT_SECRET)
    let _id;
    if (decoded) {
      _id=decoded.id
    }
    const usuario = await USUARIO.findOne({_id});
    console.log(usuario);
    return res.status(200).json(usuario);
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    return res.status(500).send('Error en el servidor');
  }

});

module.exports = router;

