const express = require("express"); // Express.js framework
const createHttpError = require("http-errors"); // For creating HTTP errors
const morgan = require("morgan"); // HTTP request logger middleware
const mongoose = require("mongoose"); // MongoDB object modeling tool
require("dotenv").config(); // Load environment variables from .env file
const connectFlash = require("connect-flash"); // Flash messages middleware
const session = require("express-session"); // Session middleware
const Swal = require('sweetalert2')
const { body, validationResult } = require("express-validator");
const passport = require("passport"); // Authentication middleware
const connectMongo = require("connect-mongo"); // MongoDB session store for Express
const connectEnsureLogin = require("connect-ensure-login"); // Authentication middleware
const User = require('./models/userModel'); // Importing User model
const Doctor = require('./models/doctorModel'); // Importing Doctor model
const Hospital = require('./models/hospitalModel');
const Appointment = require('./models/appointmentModel'); 
const Lab = require('./models/labModel')
const multer = require("multer");
const path = require("path");
const fileUpload = require('express-fileupload')
const cloudinary = require('cloudinary').v2;
const contact = require('./models/contactModel');

      // Creating an Express application
      const app = express();
      
      // Middleware

      // Logging middleware
      app.use(morgan("dev"));
      
// Setting view engine to EJS
app.set("view engine", "ejs");

// Serving static files from the 'public' directory
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/Images"));


// Parsing request bodies as JSON
app.use(express.json());

// Parsing URL-encoded request bodies
app.use(express.urlencoded({ extended: false }));

// Creating a MongoDB session store
const MongoStore = connectMongo.create({
  mongoUrl: process.env.MONGO_URI,
  mongooseConnection: mongoose.connection,
});

// Session middleware setup
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Secret for session cookie
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
    },
    store: MongoStore, // Using MongoDB to store sessions
  })
);

// Initializing Passport.js
app.use(passport.initialize());
app.use(passport.session());
require("./utils/passport_auth"); // Custom Passport.js configuration

// Setting 'user' local variable in views
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// Flash messages middleware setup
app.use(connectFlash());
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});
app.use(fileUpload({
  useTempFiles : true,
}))

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'Please log in to view this page');
  res.redirect('/login');
}

// Middleware to check user role
const authRole = (role) => {
  return (req, res, next) => {
    if (req.user && req.user.role == role) {
      next();
    } else {
      req.flash('error', 'Unauthorized access');
      // res.status(403).send('You cannot see this page')
      res.redirect('/')
    }
  };
};

// Routes

// Route to manage users (accessible only to admins)
app.get('/users', isAuthenticated, authRole("admin"), async (req, res, next) => {
  try {
    const users = await User.find();
    res.render('manage_users', { users });
  } catch (error) {
    next(error);
  }
});

app.get('/add-lab', isAuthenticated, authRole("admin"), (req, res) => {
  res.render('add_lab');
});
app.get('/add-hos', isAuthenticated, authRole("admin"), (req, res) => {
  res.render('addhospital');
});

// Inside app.js or your main Express file

app.get('/lab/:id', async (req, res, next) => {
  try {
    const lab = await Lab.findById(req.params.id);
    if (!lab) {
      return res.status(404).render('404');
    }
    // Render the lab view and pass the lab details
    res.render('lab', { lab });
  } catch (error) {
    next(error);
  }
});




app.get('/contact-messages', authRole("admin"), async (req, res, next) => {
  try {
    // Calculate the date range for the past three days
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 2); // Subtract 2 days for the day before yesterday

    // Fetch contact messages from the past three days
    const messages = await contact.find({
      createdAt: {
        $gte: threeDaysAgo,
        $lte: today
      }
    }).sort({ createdAt: -1 });

    // Send the messages data as JSON response
    res.render('get_messg', { messages });
  } catch (error) {
    // Handle errors
    next(error);
  }
});

app.get('/cardiology', async (req, res) => {
  try {
    // Fetch doctors belonging to the Cardiology department
    const doctors = await Doctor.find({ specialization: 'Cardiology' });
    res.render('cardiology', { doctors });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});


app.get('/pulmonary', async (req, res) => {
  try {
    // Fetch doctors belonging to the Pulmonary department
    const doctors = await Doctor.find({ specialization: 'Pulmonary' });
    res.render('pulmonary', { doctors });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.get('/neurology', async (req, res) => {
  try {
    // Fetch doctors belonging to the Neurology department
    const doctors = await Doctor.find({ specialization: 'Neurology' });
    res.render('neurology', { doctors });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.get('/orthopedics', async (req, res) => {
  try {
    // Fetch doctors belonging to the Orthopedics department
    const doctors = await Doctor.find({ specialization: 'Orthopedics' });
    res.render('orthopedics', { doctors });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.get('/DentalSurgery', (req, res) => {
  res.render('DentalSurgery');
});
app.get('/Laboratory', (req, res) => {
  res.render('Laboratory');
});
app.get('/doctor/data-input', isAuthenticated, authRole("doctor"), async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    res.render('doctor_data_input', { doctor });
  } catch (error) {
    next(error);
  }
});
app.get('/doctor/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash('error', 'Invalid ID');
      res.render('doctors')
      return;
    }
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      req.flash('error', 'Doctor not found');
      res.redirect('/doctors-data');
      return;
    }
    // Assuming you have a profile2.ejs template for displaying doctor's profile
    res.render('doctors', { doctor });
  } catch (error) {
    next(error);
  }
});

// Route to view user profile
app.get('/user/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash('error', 'Invalid ID');
      res.redirect('/users');
      return;
    }
    const person = await User.findById(id);
    if (!person) {
      req.flash('error', 'User not found');
      res.redirect('/users');
      return;
    }
    res.render('profile2', { person });
  } catch (error) {
    next(error);
  }
});

cloudinary.config({ 
  cloud_name: 'dyuddvjlv', 
  api_key: '713634818738548', 
  api_secret: '5GAZdVaXkMUpmTjPICXWGGa_Xk0' 
});


// add hopitals
app.post('/add-hospital', async (req, res) => {
  try {
    // Extract hospital data from request body
    const { name, location, mapEmbed } = req.body;
    const file = req.files ? req.files.photo : null;

    // Validate the input data
    if (!name || !location || !mapEmbed) {
      throw new Error('Name, location, and map embed are required');
    }

    if (!file) {
      throw new Error('Please upload a photo');
    }

    // Upload photo to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath);

    // Save hospital data to the database
    const newHospital = new Hospital({ name, location, photoUrl: result.secure_url, mapEmbed });
    await newHospital.save();

    // Redirect to the URL of the newly created hospital
    res.redirect(`/hospital/${newHospital._id}`);
  } catch (error) {
    // Handle errors
    console.error('Error while adding hospital:', error.message);
    req.flash('error', error.message);
    res.redirect('/add-hos'); // Redirect back to the form with error message
  }
});


app.post('/add-lab', async (req, res) => {
  try {
    console.log(req.body); // Log the request body to inspect the data being sent
    // Extract lab data from request body
    const { name, location } = req.body;
    const file = req.files.photo;

    // Check if a photo was uploaded
    if (!file) {
      throw new Error('Please upload a photo');
    }

    // Upload photo to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath);

    // Save lab data to the database
    const newLab = new Lab({ name, location, photoUrl: result.secure_url });
    await newLab.save();

    // Redirect to the URL of the newly created hospital
    res.redirect(`/lab/${newLab._id}`);
    // res.send('ok')
  } catch (error) {
    // Handle errors
    console.error(error);
    req.flash('error', 'Something you have missed enter data again');
    res.redirect('/add-lab'); 
  }
});



app.get('/hospitals', async (req, res, next) => {
  try {
    // Fetch all hospitals from the database
    const hospitals = await Hospital.find();
    // Render the page with the list of hospitals
    
    res.render('addhospital', { hospitals });
  } catch (error) {
    next(error);
  }
});

// Route to render the hospital detail page
app.get('/hospital/:id', async (req, res, next) => {
  try {
    // Fetch the hospital details by ID
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      // If hospital not found, render a 404 page
      return res.status(404).render('404');
    }
    // Render the hospital detail page
    res.render('hospital_detail', { hospital });
  } catch (error) {
    next(error);
  }
});

app.get("/register", async (req, res, next) => {
  const messages = req.flash();
  res.render("register", { messages });
});

// Route to handle user registration
app.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, phone, address, postal_code, city } = req.body;
    const user = new User({ name, email, password, phone, address, postal_code, city });
    await user.save();
    req.flash('success', 'Registration successful! Please log in.');
    res.redirect('/login');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/register');
  }
});

// Route to update user role
app.post('/update-role', async (req, res, next) => {
  try {
    const { id, role } = req.body;
    if (!id || !role) {
      req.flash('error', 'Invalid request');
      return res.redirect('back');
    }
    if (req.user.id === id) {
      req.flash('error', 'You cannot remove yourself from Admin, ask another admin.');
      return res.redirect('back');
    }
    const updatedUser = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!updatedUser) {
      req.flash('error', 'User not found');
      return res.redirect('users');
    }
    req.flash('success', 'Role updated successfully');
    res.redirect('users');
  } catch (error) {
    next(error);
  }
});

// Route for the doctor dashboard
app.get('/doctor', isAuthenticated, authRole("doctor"), async (req, res) => {
  res.send('Doctor Dashboard');
});

// Route for doctor appointments
// Route for doctor appointments
// Route for doctor appointments
// Route for doctor appointments
app.get('/doctor/appointments', isAuthenticated, authRole("doctor"), async (req, res, next) => {
  try {
    // Find the authenticated doctor's appointments
    const doctorAppointments = await Appointment.find({ doctor: req.user.doctor }).populate('user');
    
    // Render the view to display appointments
    res.render('doctor_appointments', { doctorAppointments, user: req.user });
  } catch (error) {
    next(error);
  }
});





// Route for doctor data input form


// Route to handle saving doctor data
app.post('/save-doctor-data', isAuthenticated, authRole("doctor"), async (req, res, next) => {
  try {
    // Extract data from the request body
    const { name, pmdc, qualification, startTime, endTime, specialization, socialMedia1, socialMedia2, appointmentFee } = req.body;
    const file = req.files ? req.files.photo : null; // Check if photo was uploaded

    // Validate required fields
    if (!name || !pmdc || !qualification || !startTime || !endTime || !specialization || !appointmentFee) {
      throw new Error('All fields are required');
    }

    // Check if a photo was uploaded
    let photoUrl;
    if (file) {
      // Upload photo to Cloudinary
      const result = await cloudinary.uploader.upload(file.tempFilePath);
      photoUrl = result.secure_url;
    }

    // Find the doctor's data in the database
    let doctor = await Doctor.findOne({ user: req.user._id });

    // If the doctor's data exists, update it; otherwise, create a new record
    if (doctor) {
      // Update existing record
      doctor.name = name;
      doctor.pmdc = pmdc;
      doctor.qualification = qualification;
      doctor.startTime = startTime;
      doctor.endTime = endTime;
      doctor.specialization = specialization;
      doctor.socialMedia1 = socialMedia1;
      doctor.socialMedia2 = socialMedia2;
      doctor.appointmentFee = appointmentFee;
      if (photoUrl) {
        doctor.photoUrl = photoUrl; // Update photo URL if uploaded
      }
    } else {
      // Create new record
      doctor = new Doctor({
        user: req.user._id,
        name,
        pmdc,
        qualification,
        startTime,
        endTime,
        specialization,
        socialMedia1,
        socialMedia2,
        appointmentFee,
        photoUrl: photoUrl || '', // Store the image URL in the Doctor model if uploaded
      });
    }

    // Save the doctor data to the database
    await doctor.save();

    // Redirect back to the input page with a success message
    req.flash('success', 'Doctor data saved successfully');
    res.redirect('/doctor/data-input');
  } catch (error) {
    // Handle errors
    console.error(error);
    req.flash('error', error.message);
    res.redirect('/doctor/data-input'); // Redirect back to the form with error message
  }
});






// Route to get all specializations
app.get('/api/specializations', async (req, res, next) => {
  try {
    // Fetch distinct specializations from the Doctor collection
    const specializations = await Doctor.distinct('specialization');
    res.json({ specializations });
  } catch (error) {
    next(error);
  }
});

// Route to get doctors based on specialization
app.get('/api/doctors', async (req, res, next) => {
  try {
    const { specialization } = req.query;
    if (!specialization) {
      return res.status(400).json({ error: 'Specialization is required' });
    }

    // Fetch doctors with the given specialization
    const doctors = await Doctor.find({ specialization });
    res.json({ doctors });
  } catch (error) {
    next(error);
  }
});









// Route to display all doctors' data








// Routes imported from separate files
app.use("/", require("./routes/indexRoute"));
app.use("/", require("./routes/authRoute"));
app.use("/", isAuthenticated, require("./routes/userRoute"));

// Error handling middleware
app.use((req, res, next) => {
  next(createHttpError.NotFound());
});

app.use((error, req, res, next) => {
  if (!res.headersSent) {
    error.status = error.status || 500;
    res.status(error.status);
    res.render("error", { error });
  } else {
    next(error);
  }
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected successfully");
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
      console.log("Mongo URI: ", process.env.MONGO_URI);

    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
