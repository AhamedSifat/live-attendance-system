import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.ts';
import { signupSchema, loginSchema } from '../utils/schemas.ts';
import { authenticate } from '../middleware/auth.ts';
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

router.post('/login', async (req: Request, res: Response) => {
  try {
    const validated = loginSchema.parse(req.body);
    const user = await User.findOne({ email: validated.email });
    if (!user || !(await bcrypt.compare(validated.password, user.password))) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' },
    );
    res.json({ success: true, data: { token } });
  } catch (err: any) {
    if (err.name === 'ZodError')
      return res
        .status(400)
        .json({ success: false, error: 'Invalid request schema' });
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;
