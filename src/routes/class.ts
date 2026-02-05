import express, { Request, Response } from 'express';
import Class from '../models/Class.ts';
import { authenticate, teacherOnly } from '../middleware/auth.ts';
import { createClassSchema } from '../utils/schemas.ts';

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

export default router;
