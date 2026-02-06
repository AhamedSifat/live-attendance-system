import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../types/types.ts';
import Class from '../models/Class.ts';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized, token missing or invalid',
    });
  }

  let token: string;

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    token = authHeader;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized, token missing or invalid',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized, token missing or invalid',
    });
  }
};

export const teacherOnly = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.user.role !== 'teacher') {
    return res
      .status(403)
      .json({ success: false, error: 'Forbidden, teacher access required' });
  }
  next();
};

export const checkClassOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const classDoc = await Class.findById(req.params.id);
    if (!classDoc)
      return res.status(404).json({ success: false, error: 'Class not found' });
    if (classDoc.teacherId.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ success: false, error: 'Forbidden, not class teacher' });
    }
    req.classDoc = classDoc;
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
};
