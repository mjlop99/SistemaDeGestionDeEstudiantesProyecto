const express = require('express');
const router = express.Router();
const { hashContrasena, compararContrasena } = require('../utils/hashContraseñas');
const { generarAccessToken, generarRefreshToken, verificarToken } = require('../utils/jwt');
const CURSO = require('../models/Curso');
const USUARIO = require('../models/Usuario');
const jwt = require('jsonwebtoken');
require('dotenv').config();


router.post('/curso/crear/:id', async (req, res) => {
  const { nombre, profesor } = req.body;
  const { id } = req.params;

  try {
    // Verificar si el profesor existe
    const profesorExistente = await USUARIO.findById(id);
    if (!profesorExistente || profesorExistente.role !== 'maestro') {
      return res.status(401).send('Error: tú no eres un profesor válido');
    }

  // Verificar si el profesor ya ha creado este curso
  
  const cursoExistente = await CURSO.findOne({ nombre, profesor });
    if (cursoExistente) {
      return res.status(401).send('Error: este curso ya ha sido registrado');
    }

    const actividadesEStablecidads={
      id:`${id}${nombre}`,
      actividadesEStablecidas:[]
    }
    // Crear el nuevo curso
    const nuevoCurso = new CURSO({
      nombre,
      profesor,
      actividades:actividadesEStablecidads
    });

    // Guardar el nuevo curso en la base de datos
    await nuevoCurso.save();

    return res.status(200).json({ message: 'Curso registrado exitosamente', nuevoCurso });
  } catch (error) {
    console.error('Error al registrar el nuevo curso:', error);
    return res.status(500).send('Ha ocurrido un error al registrar el nuevo curso');
  }
});

module.exports = router;



//Ruta para obtener todos los tipos de usuario
router.get('/cursos', async (req, res) => {
  const accessToken = req.headers['accesstoken'];
  const refreshToken = req.headers['refreshtoken'];
  console.log('AccessToken:', accessToken);
  console.log('RefreshToken:', refreshToken);
  try {
    const cursos = await CURSO.find({});
    const cursosDisponibles = cursos.map(c => ({ nombre: c.nombre, profesor: c.profesor, alumnos: c.estudiantes.length }))
    return res.status(200).json(cursosDisponibles);
  } catch (error) {
    console.error('Error al obtener los cursos:', error);
    return res.status(500).send('Error en el servidor');
  }
});
//Ruta para obtener todos los cursos de un maestro
router.get('/mis-cursos/', async (req, res) => {
  const accessToken = req.headers['accesstoken'];
  const refreshToken = req.headers['refreshtoken'];
  try {
    const decoded=jwt.verify(accessToken,process.env.JWT_SECRET)
    if (!decoded) {
      res.status(404).send({messeage:"No estas authorizado"})
    }
    const id=decoded.id
    const cursos = await CURSO.find({profesor:id});
    const profesor=await USUARIO.findOne({_id:decoded.id,role:"maestro"})
    const cursosDisponibles = cursos.map(c => ({ nombre: c.nombre, profesor: profesor.nombres, alumnos: c.estudiantes.length }))
    return res.status(200).json(cursosDisponibles);
  } catch (error) {
    console.error('Error al obtener los cursos:', error);
    return res.status(500).send('Error en el servidor');
  }
});


//obtener el curso por id
router.get('/curso/:id', async (req, res) => {
  const id = req.params.id;
  try {

    const cursoExistente = await CURSO.findOne({ _id: id });

    if (!cursoExistente) {
      return res.status(401).send('Error: este curso no existe');
    }


    return res.status(200).json({ message: 'curso encontrado exitosamente', cursoExistente });
  } catch (error) {
    console.error('Error al buscar el nuevoCurso:', error);
    return res.status(500).send('Ha ocurrido un error al buscar el nuevoCurso');
  }
});

//agregar una actividad a todos los alumnos
router.post('/curso/:id/actividad', async (req, res) => {
  const { actividad } = req.body;
  const id = req.params.id;

  try {
    // Verificar si actividades no está vacío
    if (!actividad || actividad.length === 0) {
      return res.status(400).send('Error: no has enviado ninguna actividad');
    }

    // Verificar si el curso existe
    const cursoExistente = await CURSO.findById(id);
    if (!cursoExistente) {
      return res.status(404).send('Error: este curso no ha sido registrado');
    }
    // Agregar la nueva actividad al curso

    cursoExistente.actividades.actividadesEStablecidas.push(actividad);

    //agregar actividad a alumnos
    const alumnos = cursoExistente.estudiantes
    if (alumnos.length != 0) {
      alumnos.forEach(alumno => {
        alumno.actividadesAsignadas.push({ actividadNombre: actividad, "nota": 0.00 })
      })
    }

    // Guardar el curso modificado
    await cursoExistente.save();

    return res.status(200).json({ message: 'Curso modificado exitosamente', curso: cursoExistente });
  } catch (error) {
    console.error('Error al modificar el curso:', error);
    return res.status(500).send('Ha ocurrido un error al modificar el curso');
  }
});




//elimina una actividad a todos los estudiantes
router.delete('/curso/:id/actividad', async (req, res) => {
  const { actividad } = req.body; // Cambiado para aceptar una sola actividad en vez de un array
  const id = req.params.id;

  try {
    // Verificar si actividad no está vacío
    if (!actividad) {
      return res.status(400).send('Error: no has enviado ninguna actividad');
    }

    // Verificar si el curso existe
    const cursoExistente = await CURSO.findById(id);
    if (!cursoExistente) {
      return res.status(404).send('Error: este curso no ha sido registrado');
    }

    // Verificar si existe la actividad
    const actividadIndex = cursoExistente.actividades.findIndex(act => act === actividad);
    if (actividadIndex === -1) {
      return res.status(404).send('Error: esta actividad no existe en el curso');
    }

    // Eliminar la actividad del curso
    cursoExistente.actividades.splice(actividadIndex, 1);

    // Eliminar la actividad de los alumnos
    cursoExistente.estudiantes.forEach(alumno => {
      const alumnoActividadIndex = alumno.actividades.findIndex(act => act.actividadNombre === actividad);
      if (alumnoActividadIndex !== -1) {
        alumno.actividades.splice(alumnoActividadIndex, 1);
      }
    });

    // Guardar el curso modificado
    await cursoExistente.save();

    return res.status(200).json({ message: 'Actividad eliminada exitosamente', curso: cursoExistente });
  } catch (error) {
    console.error('Error al eliminar la actividad:', error);
    return res.status(500).send('Ha ocurrido un error al eliminar');
  }
});

//matricula a un estudiante y letea todas las actividades
router.post('/curso/:id/matricular', async (req, res) => {
  const idCurso = req.params.id;
  const idAlumno = req.body.idEstudiante;

  try {
    // Verificar si el curso ya se ha credo creado este curso 
    const cursoExistente = await CURSO.findOne({ _id: idCurso });
    if (!cursoExistente) {
      return res.status(401).send('Error: este curso no ha sido registrado');
    }
    // Verificar si el alumno existe ya se ha credo creado este curso 
    const estudianteExistente = await USUARIO.findOne({ _id: idAlumno, role: "estudiante" });

    if (!estudianteExistente) {
      return res.status(401).send('Error: este alumno no ha sido registrado');
    }
    const actividades = cursoExistente.actividades.actividadesEStablecidas

    console.log(actividades);
    const nuevoEstudiante = {
      _id: idAlumno,
      actividadesAsignadas: actividades.map(actividad => ({ actividadNombre: actividad, nota: 0.00 }))
    };

    cursoExistente.estudiantes.push(nuevoEstudiante);
    console.log(cursoExistente);

    // Guardar el nuevo usuario en la base de datos
    await cursoExistente.save();

    return res.status(200).json({ message: 'alumno registrado exitosamente', cursoExistente });
  } catch (error) {
    console.error('Error al registrar el nuevo alumno:', error);
    return res.status(500).send('Ha ocurrido un error al registrar el alumno');
  }
});

//elimina a un estudiante
router.delete('/curso/:id/matricular', async (req, res) => {

  // **los nombres y apellidos son del alumno y id del curso a matricular
  const idCurso = req.params.id;
  const idAlumno = req.body.idEstudiante;

  try {
    // Verificar si el curso ya se ha credo creado este curso 
    const cursoExistente = await CURSO.findOne({ _id: idCurso });
    if (!cursoExistente) {
      return res.status(401).send('Error: este curso no ha sido registrado');
    }
    // Verificar si el alumno existe ya se ha credo creado este curso 
    const estudianteExistente = await USUARIO.findById(idAlumno);

    if (!estudianteExistente) {
      return res.status(401).send('Error: este alumno no ha sido registrado');
    }

    cursoExistente.estudiantes.shift(estudianteExistente);

    // Guardar el nuevo usuario en la base de datos
    await cursoExistente.save();

    return res.status(200).json({ message: 'alumno eliminado exitosamente', cursoExistente });
  } catch (error) {
    console.error('Error al eliminar el alumno:', error);
    return res.status(500).send('Ha ocurrido un error al eliminar el alumno');
  }
});
router.put('/curso/:id/notas/cambios', async (req, res) => {
  const idCurso = req.params.id;
  const { idEstudiante, actividad, nota } = req.body;

  try {
    // Verificar si el curso existe
    const cursoExistente = await CURSO.findById(idCurso);

    if (!cursoExistente) {
      return res.status(401).send('Error: este curso no existe aun');
    }

    // Verificar si el estudiante está registrado en el curso
    const estudiante = cursoExistente.estudiantes.find(est => est._id.toString() === idEstudiante);

    if (!estudiante) {
      return res.status(401).send('Error: este alumno no está matriculado en este curso');
    }

    // Verificar si la actividad existe para el estudiante
    const actividadIndex = estudiante.actividades.findIndex(act => act.actividadNombre === actividad);

    if (actividadIndex === -1) {
      return res.status(404).send('Error: esta actividad no existe para el estudiante');
    }

    // Cambiar la nota de la actividad
    estudiante.actividades[actividadIndex].nota = nota;

    // Guardar el curso modificado en la base de datos
    await cursoExistente.save();

    return res.status(200).json({ message: 'Nota modificada exitosamente', cursoExistente });
  } catch (error) {
    console.error('Error al modificar la nota:', error);
    return res.status(500).send('Ha ocurrido un error al modificar la nota');
  }
});






module.exports = router;