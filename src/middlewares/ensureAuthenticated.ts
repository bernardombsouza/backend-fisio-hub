import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function ensureAuthenticated(request: Request, response: Response, next: NextFunction) {
  const authToken = request.headers.authorization;
  if (!authToken) {
    return response.status(401).json({ message: 'Token is missing' });
  }
  const [, token] = authToken.split(' ');
  try {
    const payload = jwt.verify(token, '3004b458-6598-4dfe-9237-fff3c7df9517') as jwt.JwtPayload;
    (request as any).userId = payload.userId;
    return next();
  } catch (e) {
    return response.status(401).json({ message: 'Token invalid' });
  }
}
