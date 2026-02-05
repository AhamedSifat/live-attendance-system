import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthenticatedRequest, JwtPayload } from '../types/types.js';
import Class from '../models/Class.js';

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized, token missing or invalid',
    });
  }
  const token = authHeader.split(' ')[1];

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
  req: AuthenticatedRequest,
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
  req: AuthenticatedRequest,
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
