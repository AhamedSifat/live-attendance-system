import mongoose, { Schema } from 'mongoose';
import type { IClass } from '../types/types.js';

const classSchema = new Schema<IClass>(
  {
    className: { type: String, required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

export default mongoose.model<IClass>('Class', classSchema);
