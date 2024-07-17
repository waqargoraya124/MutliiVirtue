const router = require("express").Router();
const Appointment = require('../models/appointmentModel');
const User = require('../models/userModel');
const Doctor = require('../models/doctorModel');
const Hospital = require('../models/hospitalModel');
const contact = require('../models/contactModel');
const Lab = require('../models/labModel');
const { body, validationResult } = require("express-validator");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment'); // Import moment library


router.get("/profile", async (req, res, next) => {
  console.log(req.user);
  const person = req.user;
  res.render("profile", { person: person });
});

router.get("/contact", async (req, res, next) => {
  res.render("contact");
});

router.get("/appointment", async (req, res, next) => {
  res.render("appointment");
});

router.get("/hospital1", async (req, res, next) => {
  res.render("hospital1");
});

const ITEMS_PER_PAGE = 10; // Change this value as needed

router.get('/doctors-data', async (req, res, next) => {
  try {
    const doctors = await Doctor.find();
    const filteredDoctors = await Promise.all(doctors.map(async doctor => {
      const user = await User.findById(doctor.user);
      if (user && user.role === 'doctor') {
        return doctor;
      }
    }));
    const validDoctors = filteredDoctors.filter(doctor => doctor);
    res.render('doctors_list', { doctors: validDoctors });
  } catch (error) {
    next(error);
  }
});

router.post('/contact', async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    const newMessage = new contact({ name, email, subject, message });
    await newMessage.save();
    req.flash('success', 'Your message has been sent successfully!');
    res.redirect('/');
  } catch (error) {
    req.flash('error', 'An error occurred. Please try again later.');
    res.redirect('/contact');
  }
});

router.get("/gethospital", async (req, res, next) => {
  try {
    const hospitals = await Hospital.find();
    const currentPage = parseInt(req.query.page) || 1;
    const totalPages = Math.ceil(hospitals.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const hospitalsForPage = hospitals.slice(startIndex, endIndex);
    res.render("allhospitals", { hospitals: hospitalsForPage, currentPage: currentPage, totalPages: totalPages });
  } catch (error) {
    next(error);
  }
});

// New route to handle hospital deletion
router.post("/deletehospital", async (req, res, next) => {
  try {
    const hospitalId = req.body.hospitalId;
    await Hospital.findByIdAndDelete(hospitalId);
    res.redirect("/gethospital");
  } catch (error) {
    next(error);
  }
});

router.get('/labs', async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 1;
      const skip = (page - 1) * limit;

      const totalLabs = await Lab.countDocuments();
      const totalPages = Math.ceil(totalLabs / limit);

      const labs = await Lab.find()
          .skip(skip)
          .limit(limit);

      res.render('labs_list', { 
          labs, 
          currentPage: page, 
          totalPages 
      });
  } catch (error) {
      res.status(500).send('Server Error');
  }
});

// Delete Lab
router.delete('/labs/:id', async (req, res, next) => {
  try {
    await Lab.findByIdAndDelete(req.params.id);
    res.status(200).send({ message: 'Lab deleted successfully' });
  } catch (error) {
    next(error);
  }
});


router.get('/book-appointment', async (req, res, next) => {
  try {
    const doctors = await Doctor.find();
    const filteredDoctors = await Promise.all(doctors.map(async doctor => {
      const user = await User.findById(doctor.user);
      if (user && user.role === 'doctor') {
        return doctor;
      }
    }));
    const validDoctors = filteredDoctors.filter(doctor => doctor);
    res.render('book_appointment', { doctors: validDoctors, user: req.user, errors: [] });
  } catch (error) {
    next(error);
  }
});
router.post('/book-appointment', [
  body('doctor').notEmpty().withMessage('Doctor is required'),
  body('date').isDate().withMessage('Valid date is required'),
  body('time').notEmpty().withMessage('Time is required'),
  body('patientName').notEmpty().withMessage('Patient name is required'),
  body('patientAge').isInt({ min: 0 }).withMessage('Valid patient age is required'),
  body('patientGender').isIn(['Male', 'Female', 'Other']).withMessage('Valid patient gender is required')
], async (req, res, next) => {
  const errors = validationResult(req);
  const doctors = await Doctor.find(); 
  if (!errors.isEmpty()) {
    return res.render('book_appointment', { doctors, user: req.user, errors: errors.array() });
  }

  try {
    const { doctor, date, time, patientName, patientAge, patientGender } = req.body;
    
    // Check if appointment date is in the past
    const appointmentDate = new Date(date);
    const currentDate = new Date();
    if (appointmentDate < currentDate) {
      req.flash('error', 'Appointment date cannot be in the past');
      return res.redirect('/book-appointment');
    }
    
    const doctorData = await Doctor.findById(doctor);
    if (!doctorData) {
      return res.status(400).send("Doctor not found");
    }
    const doctorName = doctorData.name;
    const departmentName = doctorData.specialization // Assuming department field exists in doctorData
    const doctorFee = doctorData.appointmentFee
    const newAppointment = new Appointment({
      user: req.user._id,
      doctor: doctor,
      doctorName: doctorName, 
      date,
      time,
      patientName,
      patientAge,
      patientGender
    });

    await newAppointment.save();

    // Generate PDF
    const doc = new PDFDocument({ size: 'A4' });
    const pdfPath = path.join(__dirname, '../public/appointment.pdf');
    const pdfStream = fs.createWriteStream(pdfPath);
    doc.pipe(pdfStream);

    // Load the image
    const imagePath = path.join(__dirname, '../public/logo.png'); // Adjust the path as necessary
    const imageWidth = 100; // Image width in points
    const imageHeight = 100; // Image height in points

    // Define the components' positions using pixel-like values
    const leftX = 50; // Left position for image in points
    const centerX = 280; // Approximate center position for text in points
    const rightX = 550; // Right position for date in points
    const topY = 50; // Top position for all components in points
    const componentY = 160; // Vertical position for new components
    const lineWidth = 2.5; // Adjust thickness as needed (in points)
    const lineColor = '#007BFF';

    // Add image to the left
    doc.image(imagePath, leftX, topY, { width: imageWidth, height: imageHeight });

    // Calculate the exact center position for the text
    const centerText = "MultiVirtue";
    const textWidth = doc.font('Helvetica-Bold').widthOfString(centerText, { width: imageWidth, align: 'center' });
    const adjustedCenterX = centerX - (textWidth / 2);

    // Add text to the center
    doc.fontSize(18).text(centerText, adjustedCenterX, topY + 30);

    // Add today's date to the right
    const today = new Date();
    const dateText = today.toDateString();
    const dateWidth = doc.widthOfString(dateText, { align: 'right' });
    const adjustedRightX = rightX - dateWidth;

    doc.fontSize(10).text(dateText, adjustedRightX, topY + 35);

    // Add doctor name on the left
    doc.fontSize(12).font('Helvetica-Bold').text('Doctor:', leftX, componentY);
    doc.fontSize(12).font('Helvetica').text(doctorName, leftX + 60, componentY);
    
    // Add appointment time on the right with AM/PM
    const timeParts = time.split(':');
    let formattedTime = '';
    if (timeParts.length === 2) {
      const hours = parseInt(timeParts[0]);
      const minutes = parseInt(timeParts[1]);
      formattedTime = `${hours % 12 || 12}:${minutes < 10 ? '0' : ''}${minutes} ${hours < 12 ? 'AM' : 'PM'}`;
    }
    doc.fontSize(12).font('Helvetica-Bold').text('Time:', adjustedRightX, componentY);
    doc.fontSize(12).font('Helvetica').text(formattedTime, adjustedRightX + 40, componentY);

    doc.fontSize(12).font('Helvetica-Bold').text('Invoice:', leftX, componentY +20);
    
    // Draw a horizontal line
    const startX = leftX; // Use existing variable for consistency
    const startY = componentY + 50; // Position the line 10 points below componentY
    const endY = startY; // Same Y-coordinate for a horizontal line
    const endX = rightX; // Use existing variable for consistency

    doc.lineWidth(lineWidth) // Set line width
      .strokeColor(lineColor) // Set line color
      .moveTo(startX, startY) // Starting point
      .lineTo(endX, endY) // Ending point
      .stroke(); // Draw the line
      
      doc.fontSize(12).font('Helvetica-Bold').text('Patient:', leftX, componentY+70);
      doc.fontSize(12).font('Helvetica').text(patientName, leftX + 60, componentY+70);
    
    doc.fontSize(12).font('Helvetica-Bold').text('Gender:', adjustedRightX, componentY+70);
    doc.fontSize(12).font('Helvetica').text(patientGender, adjustedRightX + 50, componentY+70);

    const secY = componentY + 40;
    doc.fontSize(14).font('Helvetica-Bold').text('Appointment Details', adjustedCenterX - 190, secY + 70, { align: 'center' });

    // Add department name
    doc.fontSize(12).font('Helvetica-Bold').text('Appointment Date:', leftX, secY + 110);
    doc.fontSize(12).font('Helvetica').text(date, leftX + 120, secY + 110);
    
    doc.fontSize(12).font('Helvetica-Bold').text('Appointment Status:', adjustedRightX - 70, secY + 110);
    doc.fontSize(12).font('Helvetica').text('Booked', adjustedRightX + 60, secY + 110);

    doc.fontSize(12).font('Helvetica-Bold').text('Department:', leftX, secY + 130);
    doc.fontSize(12).font('Helvetica').text(departmentName, leftX + 120, secY + 130);
    
    
    doc.fontSize(12).font('Helvetica-Bold').text('Appointment Fee:', adjustedRightX - 70, secY + 130);
    doc.fontSize(12).font('Helvetica').text(`Rs ${doctorFee}/-`, adjustedRightX + 55, secY + 130);
    
    doc.fontSize(12).font('Helvetica-Bold').text('Doctor Signature:', leftX - 45, secY + 550);

    doc.lineWidth(lineWidth) // Set line width
      .strokeColor(lineColor) // Set line color
      .moveTo(startX +70, secY+560) // Starting point
      .lineTo(endX-200, secY+560) // Ending point
      .stroke(); // Draw the line
    
    doc.end();

    pdfStream.on('finish', () => {
      // Send the PDF file as a download
      res.download(pdfPath, 'appointment.pdf', (err) => {
        if (err) {
          console.error('Error sending PDF:', err);
          next(err);
        } else {
          fs.unlink(pdfPath, (err) => {
            if (err) console.error('Error deleting PDF:', err);
          });
        }
      });
    });

    req.flash('success', 'Appointment booked successfully');
  } catch (error) {
    next(error);
  }
});


  





router.get('/appointments', async (req, res, next) => {
  try {
    const userId = req.user._id;
    const doctor = await Doctor.findOne({ user: userId });
    if (!doctor) {
      return res.redirect('/');
    }
    const doctorId = doctor._id;

    // Get today's date, tomorrow's date, and the day after tomorrow's date
    const today = moment().startOf('day');
    const tomorrow = moment().add(1, 'days').startOf('day');
    const dayAfterTomorrow = moment().add(2, 'days').startOf('day');

    // Filter appointments for today, tomorrow, and the day after tomorrow
    const appointmentsForDoctor = await Appointment.find({
      doctor: doctorId,
      date: { $gte: today.toDate(), $lt: dayAfterTomorrow.add(1, 'days').toDate() }
    })
    .populate('user')
    .populate('doctor')
    .sort('date time'); // Ensure appointments are sorted by date and time

    // Convert time from 24-hour format to 12-hour format (AM/PM)
    appointmentsForDoctor.forEach(appointment => {
      const [hour, minute] = appointment.time.split(':').map(Number);
      let period = 'AM';
      let hour12 = hour;
      if (hour >= 12) {
        period = 'PM';
        hour12 = hour === 12 ? 12 : hour - 12;
      }
      if (hour12 === 0) {
        hour12 = 12;
      }
      appointment.time12hr = `${hour12}:${minute < 10 ? '0' + minute : minute} ${period}`;
    });

    res.render('appointments', { appointments: appointmentsForDoctor });
  } catch (error) {
    console.error('Error Fetching Appointments:', error);
    next(error);
  }
});



module.exports = router;
