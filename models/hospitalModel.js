const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  photoUrl: { type: String, required: true },
  mapEmbed: { type: String, required: true },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
}
});

const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital;
