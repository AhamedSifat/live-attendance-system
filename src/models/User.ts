import mongoose, { Schema } from 'mongoose';
import type { IUser } from '../types/types.ts';

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['teacher', 'student'], required: true },
  },
  { timestamps: true },
);

export default mongoose.model<IUser>('User', userSchema);
