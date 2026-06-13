import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import studentRoutes from './routes/studentRoutes.js';
import classRoutes from './routes/classRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import parentRoutes from './routes/parentRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import examRoutes from './routes/examRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import studentPortalRoutes from './routes/studentPortalRoutes.js';
import teacherPortalRoutes from './routes/teacherPortalRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import supportTicketRoutes from './routes/supportTicketRoutes.js';

// Load environment config
dotenv.config();

// Finish database selection before serving requests so controllers use the correct data source.
await connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: '*', // For development flexibility; can restrict to client domain in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/student-portal', studentPortalRoutes);
app.use('/api/teacher-portal', teacherPortalRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/support-tickets', supportTicketRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'SMS API is running smoothly' });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: `API Endpoint Not Found: ${req.originalUrl}` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5050;
  app.listen(PORT, () => {
    console.log(`Express Backend Server listening on port ${PORT}`);
  });
}

export default app;
