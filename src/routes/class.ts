import express from 'express';
import Class from '../models/Class.ts';
import {
  authenticate,
  checkClassOwnership,
  teacherOnly,
} from '../middleware/auth.ts';
import { addStudentSchema, createClassSchema } from '../utils/schemas.ts';
import User from '../models/User.ts';
import Attendance from '../models/Attendance.ts';
import type { Request, Response } from 'express';

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
  async (req: Request, res: Response) => {
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

      const existingIds = req.classDoc.studentIds.map((id: any) =>
        id.toString(),
      );
      if (!existingIds.includes(student._id.toString())) {
        req.classDoc.studentIds.push(student._id);
        await req.classDoc.save();
      }

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

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const classDoc = await Class.findById(req.params.id)
      .populate('teacherId', 'name email')
      .populate('studentIds', 'name email');

    if (!classDoc)
      return res.status(404).json({ success: false, error: 'Class not found' });

    const isTeacher = classDoc.teacherId._id.toString() === req.user.userId;
    const isStudent = classDoc.studentIds.some(
      (s: any) => s._id.toString() === req.user.userId,
    );

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const students = classDoc.studentIds.map((s: any) => ({
      _id: s._id,
      name: s.name,
      email: s.email,
    }));

    res.json({
      success: true,
      data: {
        _id: classDoc._id,
        className: classDoc.className,
        teacherId: classDoc.teacherId._id,
        students,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get(
  '/students',
  authenticate,
  teacherOnly,
  async (req: Request, res: Response) => {
    try {
      const students = await User.find({ role: 'student' }).select(
        'name email',
      );
      res.json({ success: true, data: students });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

router.get('/:id/my-attendance', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res
        .status(403)
        .json({ success: false, error: 'Forbidden, student access required' });
    }

    const classDoc = await Class.findById(req.params.id);
    if (!classDoc)
      return res.status(404).json({ success: false, error: 'Class not found' });

    const enrolled = classDoc.studentIds.some(
      (id: any) => id.toString() === req.user.userId,
    );
    if (!enrolled)
      return res
        .status(403)
        .json({ success: false, error: 'Forbidden, not enrolled' });

    const record = await Attendance.findOne({
      classId: req.params.id,
      studentId: req.user.userId,
    });

    res.json({
      success: true,
      data: {
        classId: req.params.id,
        status: record ? record.status : null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
