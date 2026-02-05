import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.ts';
import { signupSchema } from '../utils/schemas.ts';
import type { Request, Response } from 'express';

const router = express.Router();

router.post('/signup', async (req: Request, res: Response) => {
  try {
    const validated = signupSchema.parse(req.body);
    const exists = await User.findOne({ email: validated.email });
    if (exists)
      return res
        .status(400)
        .json({ success: false, error: 'Email already exists' });

    const hashed = await bcrypt.hash(validated.password, 10);
    const user = await User.create({
      name: validated.name,
      email: validated.email,
      password: hashed,
      role: validated.role,
    });

    const data = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    if (err.name === 'ZodError')
      return res
        .status(400)
        .json({ success: false, error: 'Invalid request schema' });
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
