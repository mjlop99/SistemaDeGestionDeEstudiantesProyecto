const mongoose = require('mongoose');
const { schema } = require('./Usuario');
const Schema = mongoose.Schema;

const cursoSchema = new Schema({
  nombre: {
    type: String,
    required: true
  },
  profesor: {
    type: String,
    required: true
  },
  actividades: [
    {
      type: String,
      unique: true
    }
  ]
  ,
  estudiantes: [
    {
      nombre: {
        type: String,
        required: true
      },
      actividades: {
        type: Schema.Types.Mixed,
        default: {}
      }
    }
  ]
});





module.exports = mongoose.model('Curso', cursoSchema)