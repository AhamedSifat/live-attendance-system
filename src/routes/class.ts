import express, { Request, Response } from 'express';
import Class from '../models/Class.ts';
import {
  authenticate,
  checkClassOwnership,
  teacherOnly,
} from '../middleware/auth.ts';
import { addStudentSchema, createClassSchema } from '../utils/schemas.ts';
import User from '../models/User.ts';

const router = express.Router();

router.post(
  '/',
  authenticate,
  teacherOnly,
  async (req: Request, res: Response) => {
    try {
      const validated = createClassSchema.parse(req.body);
      const newClass = await Class.create({
        className: validated.className,
        teacherId: req.user.userId,
        studentIds: [],
      });
      res.status(201).json({ success: true, data: newClass });
    } catch (err: any) {
      if (err.name === 'ZodError')
        return res
          .status(400)
          .json({ success: false, error: 'Invalid request schema' });
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

router.post(
  '/:id/add-student',
  authenticate,
  teacherOnly,
  checkClassOwnership,
  async (req, res) => {
    try {
      const validated = addStudentSchema.parse(req.body);
      const student = await User.findOne({
        _id: validated.studentId,
        role: 'student',
      });
      if (!student)
        return res
          .status(404)
          .json({ success: false, error: 'Student not found' });

      if (req.classDoc.studentIds.includes(student._id)) {
        return res
          .status(400)
          .json({ success: false, error: 'Student already in class' });
      }

      req.classDoc.studentIds.push(student._id);
      await req.classDoc.save();

      res.json({ success: true, data: req.classDoc });
    } catch (err: any) {
      if (err.name === 'ZodError')
        return res
          .status(400)
          .json({ success: false, error: 'Invalid request schema' });
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

export default router;
