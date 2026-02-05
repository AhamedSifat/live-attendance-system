import type { Request } from 'express';
import type { WebSocket } from 'ws';
import mongoose from 'mongoose';

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'teacher' | 'student';
}

export interface IClass {
  _id: mongoose.Types.ObjectId;
  className: string;
  teacherId: mongoose.Types.ObjectId;
  studentIds: mongoose.Types.ObjectId[];
}

export interface IAttendance {
  _id: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  status: 'present' | 'absent';
}

export interface ActiveSession {
  classId: string | null;
  startedAt: string | null;
  attendance: Map<string, 'present' | 'absent'>;
}

export interface JwtPayload {
  userId: string;
  role: 'teacher' | 'student';
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export interface AuthenticatedWebSocket extends WebSocket {
  user: JwtPayload;
  isAlive: boolean;
}
