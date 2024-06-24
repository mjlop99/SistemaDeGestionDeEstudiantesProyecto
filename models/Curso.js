const mongoose=require('mongoose');
const { schema } = require('./Usuario');
const Schema=mongoose.Schema;


const actividadSchema=new Schema({
    actividadId:{
        type:Schema.Types.ObjectId,
        require:true,
        auto:true,
    },
    nombre:{
        type:String,
        require:true
    },
    calificaion:{
        type:NUmber,
        require:true
    }
    }
);

const cursoSchema=new Schema({
    
    nombre:{
        type:String,
        require:true
    },
    profesor:{
        type:String,
        require:true
    },
    actividades:[actividadSchema]
    }
);

module.exports=mongoose.model('Curso',cursoSchema);