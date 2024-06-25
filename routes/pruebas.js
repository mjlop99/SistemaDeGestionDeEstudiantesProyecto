const express = require('express');
const router = express.Router();
const {hashContrasena,compararContrasena} = require('../utils/hashContraseñas');
const { generarAccessToken, generarRefreshToken ,verificarToken} = require('../utils/jwt');
const CURSO = require('../models/Curso');
const USUARIO=require('../models/Usuario')


//crea un curso solo con el nombre DEL CURSO y NOMBRE del profesor
  router.post('/curso', async (req, res) => {
    const { nombre, profesor } = req.body;
    console.log(nombre, profesor);
    try {
      // Verificar si el profesor ya ha credo creado este curso 
      const cursoExistente = await CURSO.findOne({ nombre,profesor });
  
      if (cursoExistente) {
        return res.status(401).send('Error: este curso ya ha sido registrado');
      }
  
      // Crear el nuevo curso
      const nuevoCurso = new CURSO({
        nombre,
        profesor,
        actividades: [],
        
      });
  
      // Guardar el nuevo usuario en la base de datos
      await nuevoCurso.save();
  
      return res.status(200).json({ message: 'curso registrado exitosamente', nuevoCurso });
    } catch (error) {
      console.error('Error al registrar el nuevoCurso:', error);
      return res.status(500).send('Ha ocurrido un error al registrar el nuevoCurso');
    }
  });


  //obtener el curso por id
  router.get('/curso/:id', async (req, res) => {
    const id = req.params.id;
    try {
      
      const cursoExistente = await CURSO.findOne({_id:id });
  
      if (!cursoExistente) {
        return res.status(401).send('Error: este curso no existe');
      }
  
  
      return res.status(200).json({ message: 'curso encontrado exitosamente', cursoExistente });
    } catch (error) {
      console.error('Error al buscar el nuevoCurso:', error);
      return res.status(500).send('Ha ocurrido un error al buscar el nuevoCurso');
    }
  });


  router.post('/curso/:id/actividad', async (req, res) => {
    const { actividades } = req.body;
    const id = req.params.id;
  
    try {
      // Verificar si actividades no está vacío
      if (!actividades || actividades.length === 0) {
        return res.status(400).send('Error: no has enviado ninguna actividad');
      }
  
      // Verificar si el curso existe
      const cursoExistente = await CURSO.findById(id);
      if (!cursoExistente) {
        return res.status(404).send('Error: este curso no ha sido registrado');
      }
  
      // Agregar la nueva actividad al curso
      cursoExistente.actividades.push(actividades);
  
      // Guardar el curso modificado
      await cursoExistente.save();
  
      return res.status(200).json({ message: 'Curso modificado exitosamente', curso: cursoExistente });
    } catch (error) {
      console.error('Error al modificar el curso:', error);
      return res.status(500).send('Ha ocurrido un error al modificar el curso');
    }
  });



  router.post('/curso/:id/matricular', async (req, res) => {

    // **los nombres y apellidos son del alumno y id del curso a matricular
    const { nombres,apellidos } = req.body;
    const id = req.params.id;
    
    try {
      // Verificar si el curso ya se ha credo creado este curso 
      const cursoExistente = await CURSO.findOne({ _id:id });
      if (!cursoExistente) {
        return res.status(401).send('Error: este curso no ha sido registrado');
      }
      // Verificar si el alumno existe ya se ha credo creado este curso 
      const estudianteExistente = await USUARIO.findOne({ nombres,apellidos,role:"estudiante"});

      console.log(estudianteExistente);
      if (!cursoExistente) {
        return res.status(401).send('Error: este alumno  no ha sido registrado');
      }
  
      
  
      // Guardar el nuevo usuario en la base de datos
      await nuevoCurso.save();
  
      return res.status(200).json({ message: 'curso registrado exitosamente', nuevoCurso });
    } catch (error) {
      console.error('Error al registrar el nuevoCurso:', error);
      return res.status(500).send('Ha ocurrido un error al registrar el nuevoCurso');
    }
  });

  router.put('/curso/cambios', async (req, res) => {

    const { nombre, profesor,actividades } = req.body;
    try {
      // Verificar si el profesor ya ha credo creado este curso 
      const cursoExistente = await CURSO.findOne({ nombre,profesor });
  
      if (!cursoExistente) {
        return res.status(401).send('Error: este curso no existe aun');
      }
  
      // Crear el nuevo curso
      cursoExistente.actividades.push(actividades)
      const nuevoCurso = new CURSO({
        nombre,
        profesor,
        actividades: [],
        
      });
  
      // Guardar el nuevo usuario en la base de datos
      await nuevoCurso.save();
  
      return res.status(200).json({ message: 'curso registrado exitosamente', nuevoCurso });
    } catch (error) {
      console.error('Error al registrar el nuevoCurso:', error);
      return res.status(500).send('Ha ocurrido un error al registrar el nuevoCurso');
    }
  });



  module.exports = router;
