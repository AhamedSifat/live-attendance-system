import { JwtPayload, IClass } from './types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      classDoc?: IClass;
    }
  }
}

export {};
