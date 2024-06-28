const mongoose = require('mongoose');
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
  
  actividades: {
    id:{
      type:String,
      required:true
    },
    actividadesEStablecidas:[
      {
        type: String,
        default:null
      }
    ]
  }
  ,
  
  estudiantes: [
    {
      _id: {
        type: String,
        required: true
      },

    nombres:{
      type:String,
      required:true
    },
    apellidos:{
      type:String,
      required:true
    },
      actividadesAsignadas:[
        {
          actividadNombre:{
            type: String,
          },
          nota:{
            type: Number,
            required: false,
            default:0.00
          },
        }
      ]
    }
  ]

});




module.exports = mongoose.model('Curso', cursoSchema)