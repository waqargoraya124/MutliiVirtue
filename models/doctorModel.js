// doctorModel.js
const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    pmdc: {
        type: String,
        required: true,
    },
    qualification: {
        type: String,
        required: true,
    },
    startTime: {
        type: String,
        required: true,
    },
    endTime: {
        type: String,
        required: true,
    },
    specialization: {
        type: String,
        required: true,
    },
    socialMedia1: {
        type: String,
        required: false,
    },
    socialMedia2: {
        type: String,
        required: false,
    },
    photoUrl: {
        type: String,
        required: true,
    },
    appointmentFee: {
        type: Number,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('Doctor', DoctorSchema);
