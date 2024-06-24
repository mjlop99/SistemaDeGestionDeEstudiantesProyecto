const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Calificaionchema = new Schema({
  activity_id: { type: Schema.Types.ObjectId, required: true },
  score: { type: Number, required: true }
});

const matriculaSchema = new Schema({
  cursoId: { type: Schema.Types.ObjectId, ref: 'Curso', required: true },
  estudianteId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  calificaion: [Calificaionchema]
});

module.exports = mongoose.model('Enrollment', matriculaSchema);
