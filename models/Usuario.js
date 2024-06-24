const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const UsuarioSchema=new Schema({
    nombres:{
        type:String,
        require:true
    },
    apellidos:{
        type:String,
        require:true
    },
    correo:{
        type:String,
        require:true,
        unique:true
    },
    contrasena:{
        type:String,
        require:true,
        unique:true
    },
    role: { 
        type: String, 
        enum: ['director', 'maestro', 'estudiante'], 
        required: true }
});

module.exports=mongoose.model('Usuario',UsuarioSchema);