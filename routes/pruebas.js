const express = require('express');
const router = express.Router();
const { hashContrasena, compararContrasena } = require('../utils/hashContraseñas');
const { generarAccessToken, generarRefreshToken, verificarToken } = require('../utils/jwt');
const CURSO = require('../models/Curso');
const USUARIO = require('../models/Usuario');
const jwt = require('jsonwebtoken');
const puppeteer = require('puppeteer');
require('dotenv').config();


router.post('/curso/crear/', async (req, res) => {
  const { nombre } = req.body;

  const accessToken = req.headers['accesstoken'];
  const refreshToken = req.headers['refreshtoken'];

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET)
    if (!decoded) {
      res.status(404).send({ messeage: "No estas authorizado" })
    }

    // Verificar si el profesor existe
    const profesorExistente = await USUARIO.findById(decoded.id);
    if (!profesorExistente || profesorExistente.role !== 'maestro') {
      return res.status(401).send('Error: tú no eres un profesor válido');
    }
    const profesor = decoded.id
    const nombreProfesor = `${profesorExistente.nombres} ${profesorExistente.apellidos}`

    // Verificar si el profesor ya ha creado este curso

    const cursoExistente = await CURSO.findOne({ nombre, profesor });
    if (cursoExistente) {
      return res.status(401).send('Error: este curso ya ha sido registrado');
    }

    const actividadesEStablecidads = {
      id: `${profesor}${nombre}`,
      actividadesEStablecidas: []
    }
    // Crear el nuevo curso
    const nuevoCurso = new CURSO({
      nombre,
      profesor,
      nombreProfesor,
      actividades: actividadesEStablecidads
    });

    // Guardar el nuevo curso en la base de datos
    await nuevoCurso.save();

    return res.status(200).json({ message: 'Curso registrado exitosamente', nuevoCurso });
  } catch (error) {
    console.error('Error al registrar el nuevo curso:', error);
    return res.status(500).send('Ha ocurrido un error al registrar el nuevo curso');
  }
});


//Ruta para obtener todos los tipos de Curso
router.get('/cursos', async (req, res) => {
  const accessToken = req.headers['accesstoken'];
  const refreshToken = req.headers['refreshtoken'];
  try {
    const cursos = await CURSO.find({});
    const cursosDisponibles = cursos.map(c => ({ nombre: c.nombre, profesor: c.profesor,nombreProfesor:c.nombreProfesor, alumnos: c.estudiantes.length }))
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
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET)
    if (!decoded) {
      res.status(404).send({ messeage: "No estas authorizado" })
    }
    const id = decoded.id
    const cursos = await CURSO.find({ profesor: id });
    const profesor = await USUARIO.findOne({ _id: decoded.id, role: "maestro" })
    const cursosDisponibles = cursos.map(c => ({ id: c._id, nombre: c.nombre, profesor: profesor.nombres, alumnos: c.estudiantes.length, actividades: c.actividades.actividadesEStablecidas }))
    return res.status(200).json(cursosDisponibles);
  } catch (error) {
    console.error('Error al obtener los cursos:', error);
    return res.status(500).send('Error en el servidor');
  }
});


//obtener el curso por Token
router.get('/curso/:id', async (req, res) => {
  const id = req.params.id
  const accessToken = req.headers['accesstoken'];
  const refreshToken = req.headers['refreshtoken'];

  const decoded = verificarToken(accessToken, process.env.JWT_SECRET)
  if (!decoded) {
    res.status(404).send({ messeage: "No estas authorizado" })
  }

  try {

    const cursoExistente = await CURSO.findOne({ _id: id });

    if (!cursoExistente) {
      return res.status(401).send('Error: este curso no existe');
    }


    return res.status(200).send(cursoExistente);
  } catch (error) {
    console.error('Error al buscar el nuevoCurso:', error);
    return res.status(500).send('Ha ocurrido un error al buscar el nuevoCurso');
  }
});


//obtener el curso por nombre
router.get('/curso/nombre/:nombre', async (req, res) => {
  const nombre = req.params.nombre
  const accessToken = req.headers['accesstoken'];
  const refreshToken = req.headers['refreshtoken'];

  const decoded = verificarToken(accessToken, process.env.JWT_SECRET)
  if (!decoded) {
    res.status(404).send({ messeage: "No estas authorizado" })
  }

  try {

    const cursoExistente = await CURSO.findOne({ profesor: decoded.id, nombre: nombre });

    if (!cursoExistente) {
      return res.status(401).send('Error: este curso no existe');
    }


    return res.status(200).send(cursoExistente);
  } catch (error) {
    console.error('Error al buscar el nuevoCurso:', error);
    return res.status(500).send('Ha ocurrido un error al buscar el nuevoCurso');
  }
});
//agregar una actividad a todos los alumnos
router.post('/curso/:id/actividad', async (req, res) => {
  const { actividad } = req.body;
  const id = req.params.id;
  const accessToken = req.headers['accesstoken'];
  const refreshToken = req.headers['refreshtoken'];

  console.log(actividad);
  console.log(id);
  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET)
    if (!decoded) {
      res.status(404).send({ messeage: "No estas authorizado" })
    }
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
//optener los cursos de un estudiante
router.get('/misCursos/estudiantes/:id', async (req, res) => {
  const estudianteId = req.params.id;

  try {
    // Buscar el curso que contiene al estudiante con el ID proporcionado
    let cursos = await CURSO.find({});
    cursos = cursos.filter(curso => curso.estudiantes.some(est => est._id === estudianteId));

    if (!cursos) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    const estudiantes = cursos.map(c => c.estudiantes).flat()

    // const infoNombre=cursos.map(c=>c.nombre)
    // const ids=cursos.map(c=>c._id)
    // const estudianteActividades=estudiantes.filter(e=>e._id===estudianteId)

    const cursosInfo = cursos.map(c => ({
      cursoNombre: c.nombre,
      cursoId: c._id,
      estudianteActividades: c.estudiantes.find(est => est._id === estudianteId).actividadesAsignadas
    }));

    res.json(cursosInfo);
  } catch (error) {
    console.error('Error al buscar el estudiante', error);
    res.status(500).json({ message: 'Error al buscar el estudiante' });
  }
});




//elimina una actividad curso y a todos los estudiantes
router.delete('/curso/:id/actividad', async (req, res) => {
  const { actividad } = req.body; // Cambiado para aceptar una sola actividad en vez de un array
  const id = req.params.id;

  const accessToken = req.headers['accesstoken'];
  const refreshToken = req.headers['refreshtoken'];
  try {
    const decoded = verificarToken(accessToken, process.env.JWT_SECRET)
    if (!decoded) {
      res.status(404).send({ messeage: "No estas authorizado" })
    }
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
    const actividadIndex = cursoExistente.actividades.actividadesEStablecidas.findIndex(act => act === actividad);
    if (actividadIndex === -1) {
      return res.status(404).send('Error: esta actividad no existe en el curso');
    }

    // Eliminar la actividad del curso
    cursoExistente.actividades.actividadesEStablecidas.splice(actividadIndex, 1);

    // Eliminar la actividad de los alumnos
    cursoExistente.estudiantes.forEach(alumno => {
      const alumnoActividadIndex = alumno.actividadesAsignadas.findIndex(act => act.actividadNombre === actividad);
      if (alumnoActividadIndex !== -1) {
        alumno.actividadesAsignadas.splice(alumnoActividadIndex, 1);
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

  const accessToken = req.headers['accesstoken'];
  const refreshToken = req.headers['refreshtoken'];

  try {
    const decoded = verificarToken(accessToken, process.env.JWT_SECRET)
    if (!decoded) {
      res.status(404).send({ messeage: "No estas authorizado" })
    }
    // Verificar si el curso ya se ha credo creado este curso 
    const cursoExistente = await CURSO.findOne({ _id: idCurso });
    if (!cursoExistente) {
      return res.status(401).send('Error: este curso no ha sido registrado');
    }
    // Verificar si el alumno existe ya se ha credo creado este curso 
    const estudianteExistente = await USUARIO.findOne({ _id: idAlumno, role: "estudiante" });
    const nombresEstudiante = `${estudianteExistente.nombres}`
    const apellidosEstudiante = `${estudianteExistente.apellidos}`
    if (!estudianteExistente) {
      return res.status(401).send('Error: este alumno no ha sido registrado');
    }

    //verifica que el alumno no ha sido registrado

     // Verificar si el estudiante ya está matriculado en el curso
    const estudianteYaMatriculado = cursoExistente.estudiantes.some(estudiante => estudiante._id.toString() === idAlumno);
    if (estudianteYaMatriculado) {
      return res.status(400).send('Error: Este estudiante ya está matriculado en este curso');
    }

    const actividades = cursoExistente.actividades.actividadesEStablecidas
    const nuevoEstudiante = {
      _id: idAlumno,
      nombres: nombresEstudiante,
      apellidos: apellidosEstudiante,
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
router.delete('/curso/:id/eliminarEstudiante', async (req, res) => {

  // **los nombres y apellidos son del alumno y id del curso a matricular
  const idCurso = req.params.id;
  const idAlumno = req.body.idEstudiante;
  console.log("eliminando");
  console.log(idCurso);
  console.log(idAlumno);
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
  const accessToken = req.headers['accesstoken'];
  const refreshToken = req.headers['refreshtoken'];
  console.log("CAMBIANDO");
  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET)
    if (!decoded) {
      res.status(404).send({ messeage: "No estas authorizado" })
    }
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
    const actividadIndex = estudiante.actividadesAsignadas.findIndex(act => act.actividadNombre === actividad);


    if (actividadIndex === -1) {
      return res.status(404).send('Error: esta actividad no existe para el estudiante');
    }

    // Cambiar la nota de la actividad
    console.log(estudiante.actividadesAsignadas[actividadIndex]);
    estudiante.actividadesAsignadas[actividadIndex].nota = nota;

    // Guardar el curso modificado en la base de datos
    await cursoExistente.save();

    return res.status(200).json({ message: 'Nota modificada exitosamente', cursoExistente });
  } catch (error) {
    console.error('Error al modificar la nota:', error);
    return res.status(500).send('Ha ocurrido un error al modificar la nota');
  }
});



// Función para obtener la fecha actual formateada como "YYYYMMDDHHmmss"
function obtenerFechaFormateada() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

// Función para limpiar caracteres especiales en nombres de archivo
function limpiarNombreArchivo(nombre) {
  return nombre.replace(/[^\w\s.-]/gi, ''); // Remueve caracteres especiales excepto letras, números, espacios, guiones y puntos
}

// Ruta para generar el reporte en formato PDF para Maestros
// router.post('/generarReporte', async (req, res) => {
//   const listaDeEncabezados = req.body.encabezados;
//   const cuerpo = req.body.cuerpo;
//   const nombreProfe = req.body.nombreProfe;
//   const nombre = limpiarNombreArchivo(nombreProfe.replace(/\s+/g, '-'));
//   const nombreCurso = req.body.nombreCurso;

//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();

//   try {
//     await page.setContent(`
//       <!doctype html>
//       <html lang="en">
//       <head>
//           <meta charset="utf-8">
//           <meta name="viewport" content="width=device-width, initial-scale=1">
//           <title>Sistema de gestion Estudiantil</title>
//           <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"
//               integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
//            <style>
//       body {
//         padding: 40px 20px;
//       }
//     </style>
//       </head>
//       <body>
//           <main>
//               <h2>Profesor: ${nombreProfe}</h2>
//               <h2>Curso: ${nombreCurso}</h2>
//               <table class="table table-responsive table-bordered table-hover table-striped p-4" id="tablaEstudiantes">
//                   <thead id="encabezado">
//                       <tr id="encabezadosTablaEstudiantes" class="table-active">
//                           ${listaDeEncabezados}
//                       </tr>
//                   </thead>
//                   <tbody id="infoTablaEstudiantes">
//                     ${cuerpo}
//                   </tbody>
//               </table>
//           </main>
//       </body>
//       </html>
//     `);

//     await page.waitForSelector('#tablaEstudiantes');
//     const fecha = obtenerFechaFormateada();
//     const nombrePdf = `reporte_maestro_${nombre}_${nombreCurso}_${fecha}.pdf`;
//     const pathToSave = './pdfs/'; // Directorio donde se guardarán los archivos

//     // Verificar si el directorio existe, si no existe, crearlo
//     const fs = require('fs');
//     if (!fs.existsSync(pathToSave)) {
//       fs.mkdirSync(pathToSave, { recursive: true });
//     }

//     await page.pdf({ path: pathToSave + nombrePdf, format: 'A4' });

//     await browser.close();
//     console.log('PDF generado con éxito:', nombrePdf);

//     return res.status(200).send({ mensaje: "PDF generado", nombrePdf });

//   } catch (error) {
//     console.error('Error al generar el PDF:', error);
//     return res.status(400).send({ mensaje: "Error al generar el PDF" });
//   }
// });
// Ruta para generar el reporte en formato PDF
router.post('/generarReporte/estudiante', async (req, res) => {
  const listaDeEncabezados = req.body.encabezados;
  const cuerpo = req.body.cuerpo;
  // const cuerpo = req.body.cuerpo;
  const nombreAlumno = req.body.nombreAlumno;
  const nombreCurso = req.body.nombreCurso;

  try {
    const htmlContent=`
      <!doctype html>
      <html lang="en">
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Sistema de gestion Estudiantil</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"
              integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
           <style>
      body {
        padding: 40px 20px;
      }
    </style>
      </head>
      <body>
          <main>
              <h2>Profesor: ${nombreAlumno}</h2>
              <h2>Curso: ${nombreCurso}</h2>
              <table class="table table-responsive table-bordered table-hover table-striped p-4" id="tablaEstudiantes">
                  <thead id="encabezado">
                      <tr id="encabezadosTablaEstudiantes" class="table-active">
                          ${listaDeEncabezados}
                      </tr>
                  </thead>
                  <tbody id="infoTablaEstudiantes">
                      <tr id="notasTablaEstudiantes" class="table-active">
                          ${cuerpo}
                      </tr>
                  </tbody>
              </table>
          </main>
      </body>
      </html>
    `;
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({ format: 'A4' })
        await browser.close()

        const timespan = new Date().toISOString().replace(/:/g, '-')
        const pdfFilename = `reporte-${timespan}.pdf`
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=${pdfFilename}`,
            'Content-Length': pdfBuffer.length
        })
        res.send(pdfBuffer)

  } catch (error) {
    console.error('Error al generar el PDF:', error);
    return res.status(400).send({ mensaje: "Error al generar el PDF" });
  };

});
router.post('/generarReporte/director', async (req, res) => {
  const listaDeEncabezados = req.body.encabezados;
  const cuerpo = req.body.cuerpo;
  const nombreDirector = req.body.nombreDirector;

  try {
    const htmlContent=`
      <!doctype html>
      <html lang="en">
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Sistema de gestion Estudiantil</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"
              integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
           <style>
      body {
        padding: 40px 20px;
      }
    </style>
      </head>
      <body>
          <main>
              <h2>Director: ${nombreDirector}</h2>
              <h2>Curso: todos los cursos disponibles</h2>
              <table class="table table-responsive table-bordered table-hover table-striped p-4" id="tablaEstudiantes">
                  <thead id="encabezado">
                      <tr id="encabezadosTablaEstudiantes" class="table-active">
                          ${listaDeEncabezados}
                      </tr>
                  </thead>
                  <tbody id="infoTablaEstudiantes">
                      <tr id="notasTablaEstudiantes" class="table-active">
                          ${cuerpo}
                      </tr>
                  </tbody>
              </table>
          </main>
      </body>
      </html>
    `;
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({ format: 'A4' })
        await browser.close()

        const timespan = new Date().toISOString().replace(/:/g, '-')
        const pdfFilename = `reporte-${timespan}.pdf`
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=${pdfFilename}`,
            'Content-Length': pdfBuffer.length
        })
        res.send(pdfBuffer)

  } catch (error) {
    console.error('Error al generar el PDF:', error);
    return res.status(400).send({ mensaje: "Error al generar el PDF" });
  };

});

router.post('/generarReporte', async (req, res) => {
  const listaDeEncabezados = req.body.encabezados;
  const cuerpo = req.body.cuerpo;
  const nombreProfe = req.body.nombreProfe;
  const nombreCurso = req.body.nombreCurso;

  try {
    const htmlContent=`
    <!doctype html>
      <html lang="en">
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Sistema de gestion Estudiantil</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"
              integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
           <style>
      body {
        padding: 40px 20px;
      }
    </style>
      </head>
      <body>
          <main>
              <h2>Profesor: ${nombreProfe}</h2>
              <h2>Curso: ${nombreCurso}</h2>
              <table class="table table-responsive table-bordered table-hover table-striped p-4" id="tablaEstudiantes">
                  <thead id="encabezado">
                      <tr id="encabezadosTablaEstudiantes" class="table-active">
                          ${listaDeEncabezados}
                      </tr>
                  </thead>
                  <tbody id="infoTablaEstudiantes">
                    ${cuerpo}
                  </tbody>
              </table>
          </main>
      </body>
      </html>
    `
    ;
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({ format: 'A4' })
        await browser.close()

        const timespan = new Date().toISOString().replace(/:/g, '-')
        const pdfFilename = `reporte-${timespan}.pdf`
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=${pdfFilename}`,
            'Content-Length': pdfBuffer.length
        })
        res.send(pdfBuffer)

  } catch (error) {
    console.error('Error al generar el PDF:', error);
    return res.status(400).send({ mensaje: "Error al generar el PDF" });
  };

});
router.get('/permiso', async (req, res) => {
  
  const accessToken = req.headers['accesstoken'];
  const refreshToken = req.headers['refreshtoken'];
  
  try {
    const decoded=tokenDestructurado(accessToken,refreshToken)

    if (decoded) {
      return res.status(200).send({mensaje:"todo correto"})
    }
    return res.status(401).send({mensaje:"no estas autarizado"})
    
  } catch (error) {
    console.log(error);
  }

  
});
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

module.exports = router;


module.exports = router;
