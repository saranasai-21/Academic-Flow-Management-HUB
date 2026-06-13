import mongoose from 'mongoose';

const GradeSchema = new mongoose.Schema({
  term: { type: String, required: true }, // e.g., 'Term 1', 'Term 2', 'Finals'
  subject: { type: String, required: true }, // e.g., 'Mathematics', 'English'
  marks: { type: Number, required: true, min: 0, max: 100 }, // Marks out of 100
  grade: { type: String, required: true } // Grade Letter: A+, B, C, etc.
}, { _id: false });

const PaymentSchema = new mongoose.Schema({
  receiptNumber: { type: String, default: '' },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  paymentMethod: { type: String, required: true }, // e.g., 'Card', 'Bank Transfer', 'Cash'
  status: { type: String, enum: ['Paid', 'Pending', 'Failed'], default: 'Paid' }
}, { _id: false });

const StudentSchema = new mongoose.Schema({
  // Personal Info
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  address: { type: String, required: true },
  profileImage: { type: String, default: '' },

  // Academic Details (School specific)
  rollNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  registerNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  grade: { type: String, required: true, trim: true }, // e.g., 'Grade 6', 'Grade 10'
  section: { type: String, required: true, uppercase: true, trim: true }, // e.g., 'A', 'B', 'C'
  admissionNumber: { type: String, trim: true },
  admissionDate: { type: Date, default: Date.now },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
  enrollmentDate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['Active', 'Suspended', 'Graduated', 'Inactive'], 
    default: 'Active' 
  },

  // Performance (K-12 School specific)
  grades: [GradeSchema],
  percentage: { type: Number, default: 0.0, min: 0.0, max: 100.0 }, // Overall Percentage

  // Attendance
  attendance: {
    presentDays: { type: Number, default: 0 },
    totalDays: { type: Number, default: 0 },
    rate: { type: Number, default: 0 } // Percentage: (presentDays / totalDays) * 100
  },

  // Guardian details (Critical for minors)
  guardian: {
    name: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true }, // e.g. 'Father', 'Mother', 'Guardian'
    phone: { type: String, required: true, trim: true }
  },

  // Finance details
  finance: {
    totalFees: { type: Number, default: 0 },
    feesPaid: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    paymentHistory: [PaymentSchema]
  }
}, {
  timestamps: true
});

// Middleware to calculate percentages and attendance rates before saving
StudentSchema.pre('save', function (next) {
  // Compute attendance rate
  if (this.attendance.totalDays > 0) {
    this.attendance.rate = Math.round((this.attendance.presentDays / this.attendance.totalDays) * 100);
  } else {
    this.attendance.rate = 0;
  }

  // Calculate Cumulative Percentage from grades if available
  if (this.grades && this.grades.length > 0) {
    let totalMarks = 0;
    this.grades.forEach(g => {
      totalMarks += g.marks || 0;
    });
    this.percentage = Math.round((totalMarks / this.grades.length) * 100) / 100;
  } else if (!this.percentage) {
    this.percentage = 0.0;
  }

  // Compute finance balance
  this.finance.outstandingBalance = this.finance.totalFees - this.finance.feesPaid;

  next();
});

const Student = mongoose.model('Student', StudentSchema);

export default Student;
