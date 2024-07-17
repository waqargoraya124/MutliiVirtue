// const User = require("../models/userModel");

// const router = require("express").Router();

// router.get("/doctor", async (req, res, next) => {
//   try {
//     // const doctors = await User.find({ role: "DOCTOR" });
//     // res.send(doctors);
//     const doctors = req.user;
//     console.log(doctors);
//     res.render("doctor", { doctors: doctors });
//   } catch (error) {
//     next(error);
//   }
// });

// module.exports = router;



const router = require("express").Router();
const Appointment = require('../models/appointmentModel');
const User = require('../models/userModel');
const Doctor = require('../models/doctorModel');
const Hospital = require('../models/hospitalModel');
const contact = require('../models/contactModel');
const Lab = require('../models/labModel')

// Display the appointment booking form
// router.get('/appointments/book', async (req, res, next) => {
//   try {
//     const doctors = await User.find({ role: "doctor" });
//     res.render('appointment_booking', { doctors }); // Pass the doctors variable to the template
//   } catch (error) {
//     next(error);
//   }
// });

// Book an appointment
// router.post('/appointments/book', async (req, res, next) => {
//   try {
//     const { doctorId, appointmentDate } = req.body;
//     const userId = req.user._id; // Assuming the user is authenticated

//     // Create a new appointment
//     const appointment = new Appointment({
//       user: userId,
//       doctor: doctorId,
//       appointmentDate: new Date(appointmentDate),
//       // Add other appointment details as needed
//     });

//     // Save the appointment
//     await appointment.save();

//     // Redirect to a confirmation page or appointment details page
//     res.redirect('/');
//   } catch (error) {
//     next(error);
//   }
// });
// router.get("/profile", async (req, res, next) => {
//   console.log(req.user);
//   const person = req.user;
//   res.render("profile", { person: person });
// });
// router.get("/contact", async (req, res, next) => {
 
//   res.render("contact");
// });
// router.get("/appointment", async (req, res, next) => {
 
//   res.render("appointment");
// });
// router.get("/hospital1", async (req, res, next) => {
 
//   res.render("hospital1");
// });

// const ITEMS_PER_PAGE = 10; // Change this value as needed

// router.get('/doctors-data', async (req, res, next) => {
//   try {
//     // Fetch all doctors from the Doctor model
//     const doctors = await Doctor.find();
    
//     // Filter doctors based on their associated user's role
//     const filteredDoctors = await Promise.all(doctors.map(async doctor => {
//       // Find the corresponding user document
//       const user = await User.findById(doctor.user);
//       // Check if the user exists and is a doctor
//       if (user && user.role === 'doctor') {
//         return doctor;
//       }
//     }));
    

//     // Remove undefined values from the filteredDoctors array
//     const validDoctors = filteredDoctors.filter(doctor => doctor);

//     // Render the view with the list of valid doctors
//     res.render('doctors_list', { doctors: validDoctors });
//   } catch (error) {
//     next(error); 
//   }
// });

// router.post('/contact', async (req, res, next) => {
//   try {
//     const { name, email, subject, message } = req.body;
//     // Create a new contact message
//     const newMessage = new contact({ name, email, subject, message });
//     // Save the message to the database
//     await newMessage.save();
//     // Flash success message
//     req.flash('success', 'Your message has been sent successfully!');
//     // Redirect the user to a thank you page or another appropriate page
//     // res.redirect('/thank-you');
//     res.send('done')
//   } catch (error) {
//     // Handle errors
//     req.flash('error', 'An error occurred. Please try again later.');
//     res.redirect('/contact');
//   }
// });

// router.get("/gethospital", async (req, res, next) => {
//   try {
//     // Fetch all hospitals from the database
//     const hospitals = await Hospital.find();
//     // Calculate current page based on query parameter or default to 1
//     const currentPage = parseInt(req.query.page) || 1;
//     // Calculate total number of pages based on total number of hospitals and items per page
//     const totalPages = Math.ceil(hospitals.length / ITEMS_PER_PAGE);

//     // Get hospitals for the current page
//     const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
//     const endIndex = startIndex + ITEMS_PER_PAGE;
//     const hospitalsForPage = hospitals.slice(startIndex, endIndex);

//     // Send the hospitals data along with pagination information to the template
//     res.render("allhospitals", { hospitals: hospitalsForPage, currentPage: currentPage, totalPages: totalPages });

//   } catch (error) {
//     next(error);
//   }
// });

// router.get("/labs", async (req, res, next) => {
//   try {
//     // Fetch all labs from the database
//     const labs = await Lab.find();

//     // Send the labs data to the template
//     res.render("labs_list", { labs });

//   } catch (error) {
//     next(error);
//   }
// });

// // Route to render the appointment booking form
// router.get('/book-appointment', async (req, res, next) => {
//   try {
//     const doctors = await Doctor.find();
//     res.render('book_appointment', { doctors, user: req.user });
//   } catch (error) {
//     next(error);
//   }
// });

// // Route to handle appointment booking form submission
// router.post('/book-appointment', [
//   body('doctor').notEmpty().withMessage('Doctor is required'),
//   body('date').isDate().withMessage('Valid date is required'),
//   body('time').notEmpty().withMessage('Time is required'),
// ], async (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     const doctors = await Doctor.find();
//     return res.render('book_appointment', { doctors, user: req.user, errors: errors.array() });
//   }

//   try {
//     const { doctor, date, time, description } = req.body;
//     const newAppointment = new Appointment({
//       user: req.user._id,
//       doctor,
//       date,
//       time,
//       description
//     });
//     await newAppointment.save();
//     req.flash('success', 'Appointment booked successfully');
//     res.redirect('/appointments');
//   } catch (error) {
//     next(error);
//   }
// });

// // Route to show all appointments
// router.get('/appointments',  async (req, res, next) => {
//   try {
//     const appointments = await Appointment.find().populate('user').populate('doctor');
//     res.render('appointments', { appointments });
//   } catch (error) {
//     next(error);
//   }
// });
// module.exports = router;
