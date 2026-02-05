import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db.ts';
import authRoutes from './routes/auth.ts';
import classRoutes from './routes/class.ts';
import attendanceRoutes from './routes/attendance.ts';

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/class', classRoutes);
app.use('/attendance', attendanceRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
