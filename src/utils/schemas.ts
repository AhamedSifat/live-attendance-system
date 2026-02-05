import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['teacher', 'student']),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createClassSchema = z.object({
  className: z.string().min(1),
});

export const addStudentSchema = z.object({
  studentId: z.string().min(1),
});

export const startAttendanceSchema = z.object({
  classId: z.string().min(1),
});
