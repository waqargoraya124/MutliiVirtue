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
      const doctorData = await Doctor.findById(doctor);
      if (!doctorData) {
        return res.status(400).send("Doctor not found");
      }
      const doctorName = doctorData.name;
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
  
      // Add top navbar
      const navbarHeight = 50;
      const navbarWidth = 595; // Width of A4 paper in points
      const logoWidth = 100;
      const logoMargin = 20;
  
      // Center logo horizontally
      const logoX = (navbarWidth - logoWidth) / 2;
      const logoY = (navbarHeight + 10 - doc.currentLineHeight()) / 2;
      doc.fontSize(24).text('Goraya', logoX, logoY, { width: logoWidth, align: 'center' });
  
  
      // Draw long lines on both sides of the logo
      const lineLength = 200;
      const lineY = (navbarHeight - 10) / 2; // Y position for centering vertically
      const lineOffset = 100; // Offset from the logo for the lines
      const lineStartX = logoX - lineOffset - lineLength;
      const lineEndX = logoX + logoWidth + lineOffset;
      doc
        .moveTo(lineStartX, lineY)
        .lineTo(lineStartX + lineLength, lineY)
        .stroke();
  
      doc
        .moveTo(lineEndX, lineY)
        .lineTo(lineEndX + lineLength, lineY)
        .stroke();
  
      // Appointment details
  // Appointment details
  doc.fontSize(20).text('Appointment Details:', 50, navbarHeight + 10);
  
  const textOffsetX = 183;
  const lineOffsetY = 5;
  // const lineLength = 200;
  const lineThickness = 1;
  
  doc.fontSize(14).font('Helvetica-Bold').text('Doctor:', 50, navbarHeight + 50);
  doc.font('Helvetica').text('        '.repeat(2) + `${doctorName}`, textOffsetX, navbarHeight + 50);
  doc.moveTo(textOffsetX, navbarHeight + 57 + lineOffsetY).lineTo(textOffsetX + lineLength, navbarHeight + 57 + lineOffsetY).lineWidth(lineThickness).stroke();
  
  doc.fontSize(14).font('Helvetica-Bold').text('Date:', 50, navbarHeight + 74);
  doc.font('Helvetica').text('        '.repeat(2) + `${date}`, textOffsetX, navbarHeight + 74);
  doc.moveTo(textOffsetX, navbarHeight + 81 + lineOffsetY).lineTo(textOffsetX + lineLength, navbarHeight + 81 + lineOffsetY).lineWidth(lineThickness).stroke();
  
  doc.fontSize(14).font('Helvetica-Bold').text('Time:', 50, navbarHeight + 97);
  doc.font('Helvetica').text('        '.repeat(2) + `${time}`, textOffsetX, navbarHeight + 97);
  doc.moveTo(textOffsetX, navbarHeight + 104 + lineOffsetY).lineTo(textOffsetX + lineLength, navbarHeight + 104 + lineOffsetY).lineWidth(lineThickness).stroke();
  
  doc.fontSize(14).font('Helvetica-Bold').text('Patient Name:', 50, navbarHeight + 122);
  doc.font('Helvetica').text('        '.repeat(2) +`${patientName}`, 180, navbarHeight + 122);
  doc.moveTo(180, navbarHeight + 129 + lineOffsetY).lineTo(180 + lineLength, navbarHeight + 129 + lineOffsetY).lineWidth(lineThickness).stroke();
  
  doc.fontSize(14).font('Helvetica-Bold').text('Patient Age:', 50, navbarHeight + 145);
  doc.font('Helvetica').text('        '.repeat(2) +`${patientAge}`, 180, navbarHeight + 145);
  doc.moveTo(180, navbarHeight + 152 + lineOffsetY).lineTo(180 + lineLength, navbarHeight + 152 + lineOffsetY).lineWidth(lineThickness).stroke();
  
  doc.fontSize(14).font('Helvetica-Bold').text('Patient Gender:', 50, navbarHeight + 168);
  doc.font('Helvetica').text('        '.repeat(2) +`${patientGender}`, 180, navbarHeight + 168);
  doc.moveTo(180, navbarHeight + 175 + lineOffsetY).lineTo(180 + lineLength, navbarHeight + 175 + lineOffsetY).lineWidth(lineThickness).stroke();
  
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