import express from 'express';
import Class from '../models/Class.ts';
import { authenticate, teacherOnly } from '../middleware/auth.ts';
import { startAttendanceSchema } from '../utils/schemas.ts';
import { startSession } from '../websocket.ts';

const router = express.Router();

router.post('/start', authenticate, teacherOnly, async (req, res) => {
  try {
    const validated = startAttendanceSchema.parse(req.body);
    const classDoc = await Class.findById(validated.classId);
    if (!classDoc)
      return res.status(404).json({ success: false, error: 'Class not found' });
    if (classDoc.teacherId.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ success: false, error: 'Forbidden, not class teacher' });
    }

    const session = startSession(validated.classId);
    res.json({
      success: true,
      data: { classId: session.classId, startedAt: session.startedAt },
    });
  } catch (err: any) {
    if (err.name === 'ZodError')
      return res
        .status(400)
        .json({ success: false, error: 'Invalid request schema' });
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
