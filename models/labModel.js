// labModel.js
const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  photoUrl: { type: String, required: true }
});

const Lab = mongoose.model('Lab', labSchema);

module.exports = Lab;
