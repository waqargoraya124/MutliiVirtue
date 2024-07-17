const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointmentModel');
const Doctor = require('../models/doctorModel');

// Display the appointment booking form
router.get('/appointments/book', isAuthenticated, async (req, res, next) => {
  try {
    const doctors = await Doctor.find();
    res.render('appointment_booking', { doctors });
  } catch (error) {
    next(error);
  }
});

// Book an appointment
router.post('/appointments/book', isAuthenticated, async (req, res, next) => {
  try {
    const { doctorId, appointmentDate } = req.body;
    const userId = req.user._id; // Assuming the user is authenticated

    // Create a new appointment
    const appointment = new Appointment({
      user: userId,
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      // Add other appointment details as needed
    });

    // Save the appointment
    await appointment.save();

    // Redirect to a confirmation page or appointment details page
    res.redirect('/appointments');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
