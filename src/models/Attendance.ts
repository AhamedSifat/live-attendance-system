import mongoose, { Schema } from 'mongoose';
import type { IAttendance } from '../types/types.ts';

const attendanceSchema = new Schema<IAttendance>(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['present', 'absent'], required: true },
  },
  { timestamps: true },
);

export default mongoose.model<IAttendance>('Attendance', attendanceSchema);
